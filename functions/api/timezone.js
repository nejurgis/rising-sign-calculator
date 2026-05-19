export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'Missing lat/lon' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Timezone lookup unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
