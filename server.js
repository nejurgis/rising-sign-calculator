const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Local dev proxy for timezone (on Netlify this is handled by a Function)
app.get('/api/timezone', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
  try {
    const r = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`, {
      headers: { Accept: 'application/json' }
    });
    const data = await r.json();
    const utcOffset = data.currentUtcOffset?.seconds != null
      ? data.currentUtcOffset.seconds / 3600
      : (data.standardUtcOffset?.seconds != null ? data.standardUtcOffset.seconds / 3600 : null);
    res.json({ timeZone: data.timeZone || null, utcOffset });
  } catch (e) {
    res.status(500).json({ error: 'Timezone lookup unavailable' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rising Sign Calculator → http://localhost:${PORT}`));
