// Cloudflare Pages Function: Proxy uploads requests to Railway backend
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    const backendOrigin = 'https://presensi-statistika-ti25c-production.up.railway.app';
    const targetUrl = new URL(url.pathname + url.search, backendOrigin);

    return fetch(new Request(targetUrl, request));
}
