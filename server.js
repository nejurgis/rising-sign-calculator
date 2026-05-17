const express = require('express');
const path = require('path');
const swisseph = require('@swisseph/node');
const { calculatePosition, Planet } = swisseph;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

const PLANET_BODIES = [
  { key: 'sun',     body: Planet.Sun },
  { key: 'moon',    body: Planet.Moon },
  { key: 'mercury', body: Planet.Mercury },
  { key: 'venus',   body: Planet.Venus },
  { key: 'mars',    body: Planet.Mars },
  { key: 'jupiter', body: Planet.Jupiter },
  { key: 'saturn',  body: Planet.Saturn },
  { key: 'uranus',  body: Planet.Uranus },
  { key: 'neptune', body: Planet.Neptune },
  { key: 'pluto',   body: Planet.Pluto },
];

// Proxy: Nominatim geocoding
app.get('/api/geocode', async (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 1) return res.json([]);
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'RisingSignCalculator/1.0 (educational astronomy project)',
        'Accept-Language': 'en'
      }
    });
    const data = await r.json();
    res.json(data.map(item => {
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || item.name;
      const country = addr.country || '';
      return {
        displayName: item.display_name,
        shortName: [city, country].filter(Boolean).join(', '),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      };
    }));
  } catch (e) {
    console.error('Geocode error:', e.message);
    res.status(500).json({ error: 'Geocoding unavailable' });
  }
});

// Proxy: timezone lookup from coordinates
app.get('/api/timezone', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
  try {
    const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await r.json();
    res.json({
      timeZone: data.timeZone || null,
      utcOffset: data.currentUtcOffset?.seconds != null
        ? data.currentUtcOffset.seconds / 3600
        : (data.standardUtcOffset?.seconds != null ? data.standardUtcOffset.seconds / 3600 : null)
    });
  } catch (e) {
    console.error('Timezone error:', e.message);
    res.status(500).json({ error: 'Timezone lookup unavailable' });
  }
});

// Main calculation endpoint
app.post('/api/calculate', (req, res) => {
  const { year, month, day, hour, minute, lat, lon, utcOffset } = req.body;

  const missing = ['year','month','day','hour','minute','lat','lon','utcOffset']
    .filter(k => req.body[k] == null || req.body[k] === '');
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  // Convert local birth time to Universal Time
  let hourUT = parseFloat(hour) + parseFloat(minute) / 60 - parseFloat(utcOffset);
  let d = parseInt(day);
  let m = parseInt(month);
  let y = parseInt(year);

  // Roll day boundaries
  while (hourUT < 0) {
    hourUT += 24;
    d -= 1;
    if (d < 1) {
      m -= 1;
      if (m < 1) { m = 12; y -= 1; }
      d = new Date(y, m, 0).getDate();
    }
  }
  while (hourUT >= 24) {
    hourUT -= 24;
    d += 1;
    const last = new Date(y, m, 0).getDate();
    if (d > last) { d = 1; m += 1; if (m > 12) { m = 1; y += 1; } }
  }

  try {
    const julday = swisseph.julianDay(y, m, d, hourUT);
    const latF = parseFloat(lat);

    // Whole sign houses; fall back to Equal at extreme latitudes
    let houses;
    let houseLabel;
    try {
      houses = swisseph.calculateHouses(julday, latF, parseFloat(lon), swisseph.HouseSystem.WholeSign);
      houseLabel = 'Whole Sign';
    } catch {
      houses = swisseph.calculateHouses(julday, latF, parseFloat(lon), swisseph.HouseSystem.Equal);
      houseLabel = 'Equal (extreme latitude)';
    }

    const makePos = (lon360) => {
      const norm = ((lon360 % 360) + 360) % 360;
      const idx = Math.floor(norm / 30) % 12;
      const inSign = norm % 30;
      const deg = Math.floor(inSign);
      const min = Math.round((inSign - deg) * 60);
      return { longitude: norm, sign: SIGNS[idx], signIndex: idx, degree: deg, minute: min };
    };

    const planets = {};
    for (const { key, body } of PLANET_BODIES) {
      try {
        const pos = calculatePosition(julday, body);
        planets[key] = makePos(pos.longitude);
      } catch { /* skip if body unavailable */ }
    }

    // Whole Sign cusps: each house starts at the beginning of its sign
    const ascNorm    = ((houses.ascendant % 360) + 360) % 360;
    const firstCusp  = Math.floor(ascNorm / 30) * 30;
    const cusps      = Array.from({ length: 12 }, (_, i) => (firstCusp + i * 30) % 360);

    res.json({
      ascendant:  makePos(houses.ascendant),
      midheaven:  makePos(houses.mc),
      houseSystem: houseLabel,
      planets,
      cusps
    });
  } catch (err) {
    console.error('Calculation error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rising Sign Calculator → http://localhost:${PORT}`));
