const JSON_HEADERS = { 'Content-Type': 'application/json' };

function randomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) id += chars[b % chars.length];
  return id;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/timezone')) {
      const lat = url.searchParams.get('lat');
      const lon = url.searchParams.get('lon');
      if (!lat || !lon) {
        return new Response(JSON.stringify({ error: 'Missing lat/lon' }), {
          status: 400,
          headers: JSON_HEADERS,
        });
      }
      try {
        const r = await fetch(
          `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`,
          { headers: { Accept: 'application/json' } }
        );
        const data = await r.json();
        const utcOffset =
          data.currentUtcOffset?.seconds != null
            ? data.currentUtcOffset.seconds / 3600
            : data.standardUtcOffset?.seconds != null
              ? data.standardUtcOffset.seconds / 3600
              : null;
        return new Response(JSON.stringify({ timeZone: data.timeZone || null, utcOffset }), {
          status: 200,
          headers: { ...JSON_HEADERS, 'Access-Control-Allow-Origin': '*' },
        });
      } catch {
        return new Response(JSON.stringify({ error: 'Timezone lookup unavailable' }), {
          status: 500,
          headers: JSON_HEADERS,
        });
      }
    }

    if (url.pathname === '/api/chart') {
      if (request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
        }
        const { date, time, lat, lon, city, tz, noTime } = body;
        if (!date || !lat || !lon) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: JSON_HEADERS });
        }
        const id = randomId();
        await env.CHARTS.put(`chart:${id}`, JSON.stringify({ date, time, lat, lon, city, tz, noTime }), { expirationTtl: 60 * 60 * 24 * 365 });
        return new Response(JSON.stringify({ id }), { status: 201, headers: JSON_HEADERS });
      }

      if (request.method === 'GET') {
        const id = url.searchParams.get('id');
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: JSON_HEADERS });
        const raw = await env.CHARTS.get(`chart:${id}`);
        if (!raw) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: JSON_HEADERS });
        return new Response(raw, { status: 200, headers: JSON_HEADERS });
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: JSON_HEADERS });
    }

    // Redirect /chart/[id] → /?chart=[id] so index.html can auto-load the chart
    if (url.pathname.startsWith('/chart/')) {
      const id = url.pathname.slice(7);
      return Response.redirect(`${url.origin}/?chart=${id}`, 302);
    }

    return env.ASSETS.fetch(request);
  },
};
