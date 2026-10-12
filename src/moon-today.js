// /moon-today — "What sign is the Moon in today?", rendered per request so the
// answer is in the HTML (search engines, no-JS) and never stale. Same moon maths
// as the LunarLog app (./moon-math.cjs).
import LunarMath from './moon-math.cjs';

const APP = 'https://apps.apple.com/app/lunarlog-moon-mood-tracker/id6778718909?pt=128956173&ct=whatsmyrising-moontoday&mt=8';
const ELEMENT = ['#E87474', '#74BA82', '#A084C7', '#4389E8']; // fire, earth, air, water
const TEXT = '︎'; // zodiac symbols as text, not emoji tiles

const utc = (d) => d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
const t = (d) => `<time datetime="${d.toISOString()}">${utc(d)}</time>`;
const slug = (sign) => sign.toLowerCase();

export function renderMoonToday(now = new Date()) {
  const m = LunarMath.moonNow(now);
  const next = LunarMath.nextIngress(now);
  const week = LunarMath.ingresses(now, new Date(now.getTime() + 8 * 86400000));
  const lunations = LunarMath.principals(now, 4);
  const color = ELEMENT[m.signIndex % 4];
  const pct = Math.round(m.illumination);
  const answer = `The Moon is in ${m.sign} today (${m.degree}° ${m.sign}), ${m.phase.toLowerCase()} and ${pct}% lit.`
    + (next ? ` It moves into ${next.sign} on ${utc(next.date)}.` : '');

  // Visible text uses <time> (localised in the browser); the UTC version feeds meta/FAQ.
  const answerHtml = `The Moon is in ${m.sign} today (${m.degree}° ${m.sign}), ${m.phase.toLowerCase()} and ${pct}% lit.`
    + (next ? ` It moves into ${next.sign} on ${t(next.date)}.` : '');

  // Meta description stays under ~155 chars (Bing flags anything over 160).
  const metaDescription = `The Moon is in ${m.sign} today (${m.degree}°), ${m.phase.toLowerCase()} and ${pct}% lit.`
    + (next ? ` It moves into ${next.sign} on ${utc(next.date)}.` : '')
    + ` See this week's moon signs.`;

  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What sign is the Moon in today?', acceptedAnswer: { '@type': 'Answer', text: answer } },
      { '@type': 'Question', name: 'How often does the Moon change signs?', acceptedAnswer: { '@type': 'Answer', text: 'The Moon moves into a new zodiac sign roughly every two and a half days and passes through all twelve signs in about 27.3 days.' } },
      { '@type': 'Question', name: 'What phase is the Moon in today?', acceptedAnswer: { '@type': 'Answer', text: `The Moon is ${m.phase.toLowerCase()} today, ${pct}% illuminated.` } },
    ],
  };

  const weekRows = week.map((i) => `<li><span style="color:${ELEMENT[i.signIndex % 4]}">${i.glyph}${TEXT}</span> Moon enters <a href="/moon/${slug(i.sign)}">${i.sign}</a> — ${t(i.date)}</li>`).join('');
  const lunationRows = lunations.map((p) => `<li>${p.kind === 'full' ? 'Full Moon' : 'New Moon'} in ${p.sign} ${p.glyph}${TEXT} — ${t(p.date)}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>What Sign Is the Moon in Today? — Moon Sign &amp; Phase Today</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="https://whatsmyrising.com/moon-today">
  <script type="application/ld+json">${JSON.stringify(faq)}</script>
  <link rel="stylesheet" href="/style.css">
  <style>
    .info-content { max-width: 800px; margin: 4rem auto; line-height: 1.8; }
    .info-content h1 { font-family: var(--ff-serif); font-size: 3rem; margin-bottom: 2rem; text-align: center; }
    .info-content h2 { font-family: var(--ff-serif); font-size: 1.6rem; margin-top: 2.5rem; margin-bottom: 1rem; }
    .info-content p, .info-content li { font-family: var(--ff-serif); font-size: 1.2rem; }
    .info-content ul { list-style: none; padding: 0; }
    .info-content li { margin: .35rem 0; }
    .today { display: flex; gap: 1.5rem; align-items: center; padding: 1.5rem 1.75rem; border-radius: 20px;
      background: linear-gradient(180deg, #0a0a17, #1a142e); color: rgba(255,255,255,.92); }
    .today .sign { font-family: var(--ff-serif); font-size: 2rem; line-height: 1.2; }
    .today .sub { opacity: .75; font-family: var(--ff-sans); font-size: 1rem; }
    .today svg { flex: 0 0 96px; }
    .cta { margin-top: 3rem; padding: 1.5rem 1.75rem; border-radius: 20px; border: 1px solid currentColor; }
    .cta p { margin: 0 0 1rem; }
    .back-link { display: block; margin-top: 3rem; text-align: center; font-family: var(--ff-sans);
      text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; color: var(--text); font-weight: bold; }
    @media (max-width: 600px) { .info-content h1 { font-size: 2.2rem; } .today { flex-direction: column; text-align: center; } }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1><a href="/moon-sign-calculator" class="logo"><img src="/logoFinal.png" alt="" class="logo-img" width="52"><span>Moon Sign <br> Calculator</span></a></h1>
      <nav class="site-nav">
        <a href="/moon-info">What is a moon sign?</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <article class="info-content">
      <h1>What sign is the Moon in today?</h1>

      <div class="today">
        <svg width="96" height="96" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,.10)"/>
          <path transform="translate(2 2)" d="${LunarMath.phasePath(m.fraction, 30)}" fill="#f5f0dc"/>
        </svg>
        <div>
          <div class="sign">Moon in ${m.sign} <span style="color:${color}">${m.glyph}${TEXT} ${m.degree}°</span></div>
          <div class="sub">${m.phase} · ${pct}% lit</div>
          ${next ? `<div class="sub">Enters ${next.sign} ${next.glyph}${TEXT} ${t(next.date)}</div>` : ''}
        </div>
      </div>

      <p style="margin-top:1.5rem">${answerHtml} In astrology the Moon's sign colours the emotional tone of the day: here's <a href="https://lunarlog.astrologyoffice.com/journal/moon-in-each-sign#moon-in-${slug(m.sign)}">how ${m.sign} Moon days tend to feel</a>, and <a href="/moon/${slug(m.sign)}">what a ${m.sign} Moon means</a> if you were born with one.</p>

      <h2>Moon signs this week</h2>
      <ul>${weekRows}</ul>

      <h2>Next full and new moons</h2>
      <ul>${lunationRows}</ul>

      <h2>How often does the Moon change signs?</h2>
      <p>The Moon is the fastest-moving body in the chart. It spends about two and a half days in each sign and moves through all twelve in roughly 27 days, so the "Moon sign of the day" changes several times a week — often in the middle of a day. The times above are calculated for the exact moment of each change.</p>

      <div class="cta">
        <p><strong>Does the Moon's sign actually change how you feel?</strong> LunarLog lets you log your mood in one tap and records the Moon's sign and phase beside every day. After a few weeks it shows you which signs lift you and which weigh on you — and says so honestly if the Moon doesn't seem to matter for you at all.</p>
        <a href="${APP}" aria-label="Download LunarLog on the App Store"><img src="/app-store-badge.svg" alt="Download on the App Store" height="44" width="132" loading="lazy"></a>
      </div>

      <p style="margin-top:2rem">Looking for your birth Moon sign instead? Use the <a href="/moon-sign-calculator">moon sign calculator</a>.</p>
      <a href="/moon-sign-calculator" class="back-link">← Moon Sign Calculator</a>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Tropical zodiac · Geocentric · Times in your local time zone</p>
      <nav class="footer-tools" aria-label="More from the maker">
        <a href="https://apps.apple.com/app/lunarlog-moon-mood-tracker/id6778718909?pt=128956173&ct=whatsmyrising&mt=8">LunarLog — moon &amp; mood tracker app</a>
        <a href="https://apps.apple.com/app/lunarlog-moon-mood-tracker/id6778718909?pt=128956173&ct=whatsmyrising&mt=8" aria-label="Download LunarLog on the App Store"><img src="/app-store-badge.svg" alt="Download on the App Store" height="36" width="108" loading="lazy" style="vertical-align:middle"></a>
      </nav>
    </div>
  </footer>
  <script>
    // Show every time in the visitor's own time zone.
    document.querySelectorAll('time[datetime]').forEach(function (el) {
      var d = new Date(el.getAttribute('datetime'));
      el.textContent = d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    });
  </script>
</body>
</html>`;
}
