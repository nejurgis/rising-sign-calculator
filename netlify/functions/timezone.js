exports.handler = async (event) => {
  const { lat, lon } = event.queryStringParameters || {};
  if (!lat || !lon) return { statusCode: 400, body: JSON.stringify({ error: 'Missing lat/lon' }) };

  try {
    const r = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`, {
      headers: { Accept: 'application/json' }
    });
    const data = await r.json();
    const utcOffset = data.currentUtcOffset?.seconds != null
      ? data.currentUtcOffset.seconds / 3600
      : (data.standardUtcOffset?.seconds != null ? data.standardUtcOffset.seconds / 3600 : null);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ timeZone: data.timeZone || null, utcOffset })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Timezone lookup unavailable' }) };
  }
};
