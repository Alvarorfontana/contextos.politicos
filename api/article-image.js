const SUPABASE_URL = 'https://iovcqzztardtmdxzmadd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YGksvgyo3Tvf94sSPryGHw_qHKUV-pZ';

module.exports = async function handler(request, response) {
    const id = String(request.query?.id || '').trim();
    if (!id) return response.status(400).send('Falta el identificador de la noticia.');

    const articleResponse = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${encodeURIComponent(id)}&select=image` , {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const articles = articleResponse.ok ? await articleResponse.json() : [];
    const imageUrl = articles[0]?.image;
    if (!imageUrl) return response.status(404).send('La noticia no tiene imagen.');

    const imageResponse = await fetch(imageUrl, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; ContextoPolitico/1.0)' }
    });
    if (!imageResponse.ok) return response.status(404).send('No se pudo cargar la imagen.');

    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    response.setHeader('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');
    return response.status(200).send(Buffer.from(await imageResponse.arrayBuffer()));
};
