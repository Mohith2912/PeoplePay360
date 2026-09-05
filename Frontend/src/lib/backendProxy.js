export async function proxy(request) {
  const url = new URL(request.url);
  const base = process.env.BACKEND_API_URL || 'http://127.0.0.1:4000';
  try {
    const headers = new Headers(request.headers); headers.delete('host'); headers.delete('content-length');
    const response = await fetch(base + url.pathname + url.search, {method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.text(),redirect:'manual',cache:'no-store'});
    return new Response(response.body,{status:response.status,headers:response.headers});
  } catch { return Response.json({message:'Backend is unavailable. Please retry.'},{status:502}); }
}
