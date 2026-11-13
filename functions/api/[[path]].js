// Cloudflare Pages Function: Proxy API requests to Vercel backend
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    const backendOrigin = 'https://presensi-mk-statistika.vercel.app';
    const targetUrl = new URL(url.pathname + url.search, backendOrigin);

    return fetch(new Request(targetUrl, request));
}

