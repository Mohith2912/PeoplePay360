function failure(message, status, code) {
  return Response.json({ message, code }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function backendOrigin(requestUrl) {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (!configured && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
    throw new Error('BACKEND_API_URL is required on the frontend deployment.');
  }
  const backend = new URL(configured || 'http://127.0.0.1:4000');
  if (!['http:', 'https:'].includes(backend.protocol) || backend.username || backend.password ||
      backend.pathname !== '/' || backend.search || backend.hash || backend.origin === requestUrl.origin) {
    throw new Error('BACKEND_API_URL must be the backend origin, without /api, credentials, or a query string.');
  }
  if (process.env.VERCEL && (backend.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname))) {
    throw new Error('BACKEND_API_URL must use a reachable HTTPS backend on Vercel.');
  }
  return backend.origin;
}

export async function proxy(request) {
  const url = new URL(request.url);
  let origin;
  try {
    origin = backendOrigin(url);
  } catch (error) {
    console.error('[backend-proxy] configuration:', error.message);
    return failure('The backend connection is not configured correctly. Contact your administrator.', 503, 'BACKEND_CONFIGURATION_ERROR');
  }
  try {
    // Forward only application headers; deployment credentials stay on the server.
    const headers = new Headers();
    for (const name of ['accept', 'content-type', 'authorization']) {
      if (request.headers.has(name)) headers.set(name, request.headers.get(name));
    }
    const cookies = (request.headers.get('cookie') || '').split(';')
      .map(value => value.trim()).filter(value => /^(peoplepay_token|token)=/.test(value));
    if (cookies.length) headers.set('cookie', cookies.join('; '));
    if (process.env.BACKEND_VERCEL_BYPASS_SECRET) {
      headers.set('x-vercel-protection-bypass', process.env.BACKEND_VERCEL_BYPASS_SECRET);
    }
    const response = await fetch(origin + url.pathname + url.search, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(55000),
    });
    const location = response.headers.get('location');
    if (location && new URL(location, origin).hostname === 'vercel.com') {
      await response.body?.cancel();
      console.error('[backend-proxy] backend requires Vercel deployment authentication');
      return failure('The backend is blocked by deployment protection. Contact your administrator.', 502, 'BACKEND_DEPLOYMENT_PROTECTED');
    }
    const responseHeaders = new Headers(response.headers);
    // fetch decompresses the body, so upstream transport headers no longer apply.
    for (const name of ['content-encoding', 'content-length', 'transfer-encoding', 'connection']) responseHeaders.delete(name);
    responseHeaders.set('cache-control', 'no-store');
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    const timeout = error.name === 'TimeoutError';
    console.error('[backend-proxy] request failed', { method: request.method, path: url.pathname, type: error.name });
    return failure(timeout ? 'The backend took too long to respond. Please retry.' : 'Backend is unavailable. Please retry.', timeout ? 504 : 502, timeout ? 'BACKEND_TIMEOUT' : 'BACKEND_UNAVAILABLE');
  }
}
