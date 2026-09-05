export default {
  reactStrictMode: true,
  async rewrites() {
    const backend = (process.env.BACKEND_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
    return { beforeFiles: [{ source: '/api/:path*', destination: backend + '/api/:path*' }] };
  }
};
