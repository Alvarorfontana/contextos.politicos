const SUPABASE_URL = 'https://iovcqzztardtmdxzmadd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YGksvgyo3Tvf94sSPryGHw_qHKUV-pZ';

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function cleanDescription(value = '') {
    return String(value)
        .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
}

module.exports = async function handler(request, response) {
    const id = String(request.query?.id || '').trim();
    if (!id) return response.status(400).send('Falta el identificador de la noticia.');

    const url = `${SUPABASE_URL}/rest/v1/articles?id=eq.${encodeURIComponent(id)}&select=id,title,subtitle,image`;
    const result = await fetch(url, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const articles = result.ok ? await result.json() : [];
    const article = articles[0];
    if (!article) return response.status(404).send('Artículo no encontrado.');

    const articleUrl = `https://contextos-politicos.vercel.app/articulo.html?id=${encodeURIComponent(article.id)}`;
    const title = escapeHtml(article.title);
    const description = escapeHtml(cleanDescription(article.subtitle || 'Leé el análisis completo en Contexto Político.'));
    const image = escapeHtml(`https://contextos-politicos.vercel.app/api/article-image?id=${encodeURIComponent(article.id)}`);
    const canonical = escapeHtml(articleUrl);

    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    return response.status(200).send(`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Contexto Político">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<title>${title} | Contexto Político</title>
</head><body>
<p>Abriendo la nota...</p><p><a href="${canonical}">Continuar al artículo</a></p>
<script>window.location.replace(${JSON.stringify(articleUrl)});</script>
</body></html>`);
};
