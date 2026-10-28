export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy /api/* dan /uploads/* langsung ke backend Railway
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
      const backendOrigin = 'https://presensi-statistika-ti25c-production.up.railway.app';
      const targetUrl = new URL(url.pathname + url.search, backendOrigin);
      return fetch(new Request(targetUrl, request));
    }

    // Sisanya dilayani langsung oleh Cloudflare CDN Static Assets (SPA)
    return env.ASSETS.fetch(request);
  }
};

