const OMDB_BASE_URL = 'https://www.omdbapi.com/';
const ALLOWED_PARAMS = new Set(['i', 't', 'y', 'type', 'plot', 'r', 'v']);

function jsonResponse(body, status = 200, origin = '*') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'cache-control': status === 200 ? 'public, max-age=86400' : 'no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET, OPTIONS',
          'access-control-allow-headers': 'content-type',
        },
      });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    if (!env.OMDB_API_KEY) {
      return jsonResponse({ error: 'OMDB_API_KEY is not configured' }, 500, origin);
    }

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== '/api/omdb') {
      return jsonResponse({ error: 'Not found' }, 404, origin);
    }

    const omdbUrl = new URL(OMDB_BASE_URL);
    omdbUrl.searchParams.set('apikey', env.OMDB_API_KEY);

    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (ALLOWED_PARAMS.has(key) && value) {
        omdbUrl.searchParams.set(key, value);
      }
    }

    if (!omdbUrl.searchParams.get('i') && !omdbUrl.searchParams.get('t')) {
      return jsonResponse({ error: 'Pass either an IMDb ID (i) or a title (t).' }, 400, origin);
    }

    const cache = caches.default;
    const cacheKey = new Request(omdbUrl.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const omdbResponse = await fetch(omdbUrl, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });

    const body = await omdbResponse.json();
    const response = jsonResponse(body, omdbResponse.ok ? 200 : omdbResponse.status, origin);
    if (omdbResponse.ok && body.Response !== 'False') {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  },
};
