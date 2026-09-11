import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { proxy } from '../src/lib/backendProxy.js';

const originalFetch = globalThis.fetch;
const keys = ['BACKEND_API_URL', 'BACKEND_VERCEL_BYPASS_SECRET', 'NODE_ENV', 'VERCEL'];
let saved;
beforeEach(() => {
  saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.BACKEND_API_URL = 'https://backend.example/';
  process.env.NODE_ENV = 'test';
  delete process.env.VERCEL;
  delete process.env.BACKEND_VERCEL_BYPASS_SECRET;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

test('forwards mutations, query parameters, authentication and binary bodies', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://backend.example/api/employees/123?active=true');
      assert.equal(options.method, method);
      assert.deepEqual(new Uint8Array(options.body), new Uint8Array([0, 255, 128]));
      assert.equal(options.headers.get('cookie'), 'peoplepay_token=session');
      assert.equal(options.headers.get('authorization'), 'Bearer test');
      assert.equal(options.headers.get('host'), null);
      assert.equal(options.headers.get('x-vercel-protection-bypass'), 'server-secret');
      assert.equal(options.redirect, 'manual');
      return Response.json({ ok: true }, { status: 201 });
    };
    process.env.BACKEND_VERCEL_BYPASS_SECRET = 'server-secret';
    const response = await proxy(new Request('https://frontend.example/api/employees/123?active=true', {
      method, body: new Uint8Array([0, 255, 128]), headers: {
        cookie: 'peoplepay_token=session; _vercel_sso_nonce=private', authorization: 'Bearer test',
        'x-vercel-protection-bypass': 'untrusted', host: 'frontend.example',
      },
    }));
    assert.equal(response.status, 201);
  }
});

test('preserves login cookies and PDF bytes while disabling response caching', async () => {
  globalThis.fetch = async () => new Response(new Uint8Array([37, 80, 68, 70, 255]), { headers: {
    'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="payslip.pdf"',
    'set-cookie': 'peoplepay_token=session; Path=/; Secure; HttpOnly; SameSite=Lax',
    'content-encoding': 'gzip', 'content-length': '99', 'cache-control': 'public',
  } });
  const response = await proxy(new Request('https://frontend.example/api/payslips/123/pdf'));
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([37, 80, 68, 70, 255]));
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('content-disposition'), /payslip.pdf/);
  assert.equal(response.headers.get('content-encoding'), null);
  assert.equal(response.headers.get('content-length'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('rejects missing production configuration and invalid backend origins without fetching', async () => {
  process.env.NODE_ENV = 'production';
  globalThis.fetch = () => assert.fail('must not fetch invalid backend');
  for (const value of ['', 'https://backend.example/api', 'https://frontend.example', 'file:///secret', 'invalid']) {
    process.env.BACKEND_API_URL = value;
    const response = await proxy(new Request('https://frontend.example/api/auth/me'));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'BACKEND_CONFIGURATION_ERROR');
  }
});

test('Vercel cannot fall back to a local or insecure backend', async () => {
  process.env.VERCEL = '1';
  globalThis.fetch = () => assert.fail('must not fetch local backend');
  for (const value of ['http://127.0.0.1:4000', 'http://backend.example', 'https://localhost']) {
    process.env.BACKEND_API_URL = value;
    assert.equal((await proxy(new Request('https://frontend.example/api/auth/me'))).status, 503);
  }
});

test('turns Vercel sign-in redirects into actionable JSON errors', async () => {
  globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: 'https://vercel.com/sso-api?url=backend' } });
  const response = await proxy(new Request('https://frontend.example/api/auth/me'));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, 'BACKEND_DEPLOYMENT_PROTECTED');
});

test('preserves authentication failures, empty responses, and HEAD/OPTIONS', async () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    globalThis.fetch = async (_, options) => {
      assert.equal(options.method, method);
      return new Response(null, { status: 204 });
    };
    assert.equal((await proxy(new Request('https://frontend.example/api/auth/me', { method }))).status, 204);
  }
  globalThis.fetch = async () => Response.json({ message: 'Authentication is required' }, { status: 401 });
  assert.equal((await proxy(new Request('https://frontend.example/api/auth/me'))).status, 401);
});

test('network failures and timeouts return retryable JSON errors', async () => {
  for (const [name, status] of [['TypeError', 502], ['TimeoutError', 504]]) {
    globalThis.fetch = async () => { throw Object.assign(new Error('failed'), { name }); };
    assert.equal((await proxy(new Request('https://frontend.example/api/auth/me'))).status, status);
  }
});
