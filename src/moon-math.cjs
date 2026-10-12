/*
 * (Copy of lunarlog-site/src/moon-math.js — keep the two in sync.)
 * LunarMath — the LunarLog app's moon maths, ported from MoonEphemeris.swift so the
 * website, the embeddable Moon card and the app always agree.
 *
 * Moon: Meeus "Astronomical Algorithms" ch. 47 (full table 47.A) + nutation in
 * longitude. Sun: Meeus ch. 25 (low accuracy). Phase: true Sun–Moon elongation,
 * not a mean synodic month. Checked against astronomy-engine.
 *
 * Works as a classic <script> (sets globalThis.LunarMath) and as a CommonJS module
 * (module.exports) for bundlers such as wrangler/esbuild.
 */
(function (root) {
  "use strict";

  const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  const PHASES = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];

  // Meeus table 47.A: D, M, M', F multipliers, Σl (1e-6 deg), Σr (1e-3 km)
  const T47A = [
    [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111],
    [2, 0, 0, 0, 658314, -2955968], [0, 0, 2, 0, 213618, -569925],
    [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138],
    [2, 0, 1, 0, 53322, -170733], [2, -1, 0, 0, 45758, -204586],
    [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321],
    [0, 0, 1, 2, -12528, 0], [0, 0, 1, -2, 10980, 79661],
    [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208],
    [2, 1, 0, 0, -6766, 30824], [1, 0, -1, 0, -5163, -8379],
    [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650],
    [2, 0, -3, 0, 3665, 14403], [0, 1, -2, 0, -2689, -7003],
    [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
    [1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884],
    [0, 1, 2, 0, -2120, 5751], [0, 2, 0, 0, -2069, 0],
    [2, -2, -1, 0, 2048, -4950], [2, 0, 1, -2, -1773, 4130],
    [2, 0, 0, 2, -1595, 0], [4, -1, -1, 0, 1215, -3958],
    [0, 0, 2, 2, -1110, 0], [3, 0, -1, 0, -892, 3258],
    [2, 1, 1, 0, -810, 2616], [4, -1, -2, 0, 759, -1897],
    [0, 2, -1, 0, -713, -2117], [2, 2, -1, 0, -700, 2354],
    [2, 1, -2, 0, 691, 0], [2, -1, 0, -2, 596, 0],
    [4, 0, 1, 0, 549, -1423], [0, 0, 4, 0, 537, -1117],
    [4, -1, 0, 0, 520, -1571], [1, 0, -2, 0, -487, -1739],
    [2, 1, 0, -2, -399, 0], [0, 0, 2, -2, -381, -4421],
    [1, 1, 1, 0, 351, 0], [3, 0, -2, 0, -340, 0],
    [4, 0, -3, 0, 330, 0], [2, -1, 2, 0, 327, 0],
    [0, 2, 1, 0, -323, 1165], [1, 1, -1, 0, 299, 0],
    [2, 0, 3, 0, 294, 0], [2, 0, -1, -2, 0, 8752],
  ];

  const D2R = Math.PI / 180;
  const norm = (deg) => ((deg % 360) + 360) % 360;
  const jd = (date) => date.getTime() / 86400000 + 2440587.5;

  function nutationLongitude(T) {
    const omega = 125.04452 - 1934.136261 * T;
    const Lsun = 280.4665 + 36000.7698 * T;
    const Lmoon = 218.3165 + 481267.8813 * T;
    const arcsec = -17.20 * Math.sin(omega * D2R) - 1.32 * Math.sin(2 * Lsun * D2R)
      - 0.23 * Math.sin(2 * Lmoon * D2R) + 0.21 * Math.sin(2 * omega * D2R);
    return arcsec / 3600;
  }

  /** Apparent ecliptic longitude (deg) and distance (km) of the Moon. */
  function moonLonDist(date) {
    const T = (jd(date) - 2451545.0) / 36525, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000);
    const D = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
    const M = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000);
    const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000);
    const F = norm(93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000);
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    let sumL = 0, sumR = 0;
    for (const [d, m, mp, f, sl, sr] of T47A) {
      const arg = (d * D + m * M + mp * Mp + f * F) * D2R;
      const ecc = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sumL += sl * ecc * Math.sin(arg);
      sumR += sr * ecc * Math.cos(arg);
    }
    sumL += 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((Lp - F) * D2R) + 318 * Math.sin(A2 * D2R);
    const lon = norm(Lp + sumL / 1e6 + nutationLongitude(T));
    return { lon, dist: 385000.56 + sumR / 1000 };
  }

  /** Sun's apparent ecliptic longitude (deg). */
  function sunLongitude(date) {
    const T = (jd(date) - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    const omega = 125.04 - 1934.136 * T;
    return norm(L0 + C - 0.00569 - 0.00478 * Math.sin(omega * D2R));
  }

  /** Moon − Sun longitude, 0..360 (0 = new, 180 = full). */
  const elongation = (date) => norm(moonLonDist(date).lon - sunLongitude(date));

  /** Same naming as the app: principal phases within ±12° (~1 day) of their instant. */
  function phaseIndex(el) {
    if (el < 12) return 0; if (el < 78) return 1; if (el < 102) return 2; if (el < 168) return 3;
    if (el < 192) return 4; if (el < 258) return 5; if (el < 282) return 6; if (el < 348) return 7;
    return 0;
  }

  /** Everything a card or page needs about the Moon at `date`. */
  function moonNow(date = new Date()) {
    const { lon, dist } = moonLonDist(date);
    const el = norm(lon - sunLongitude(date));
    const si = Math.floor(lon / 30) % 12;
    const idx = phaseIndex(el);
    return {
      date, longitude: lon, distanceKm: dist,
      signIndex: si, sign: SIGNS[si], glyph: GLYPHS[si],
      degree: Math.floor(lon - si * 30), minute: Math.floor(((lon - si * 30) % 1) * 60),
      elongation: el, fraction: el / 360,
      illumination: (1 - Math.cos(el * D2R)) / 2 * 100,
      phaseIndex: idx, phase: PHASES[idx], waxing: el < 180,
    };
  }

  /** Bisect a monotone event between t0 (false) and t1 (true) to ~1 minute. */
  function bisect(t0, t1, test) {
    let a = t0.getTime(), b = t1.getTime();
    while (b - a > 60000) {
      const m = (a + b) / 2;
      if (test(new Date(m))) b = m; else a = m;
    }
    return new Date(b);
  }

  /** Next time the Moon changes sign after `from`: {date, signIndex, sign, glyph}. */
  function nextIngress(from = new Date()) {
    const start = Math.floor(moonLonDist(from).lon / 30) % 12;
    let t = from;
    for (let i = 0; i < 24 * 4; i++) {           // ≤ 4 days, hourly steps
      const t1 = new Date(t.getTime() + 3600000);
      if (Math.floor(moonLonDist(t1).lon / 30) % 12 !== start) {
        const at = bisect(t, t1, (d) => Math.floor(moonLonDist(d).lon / 30) % 12 !== start);
        const si = Math.floor(moonLonDist(new Date(at.getTime() + 60000)).lon / 30) % 12;
        return { date: at, signIndex: si, sign: SIGNS[si], glyph: GLYPHS[si] };
      }
      t = t1;
    }
    return null;
  }

  /** Sign changes in [from, until). */
  function ingresses(from, until) {
    const out = [];
    let t = from;
    while (true) {
      const ing = nextIngress(t);
      if (!ing || ing.date >= until) break;
      out.push(ing);
      t = new Date(ing.date.getTime() + 3600000);
    }
    return out;
  }

  /** Next new (0°) or full (180°) moon after `from`: {date, kind, sign, glyph}. */
  function nextPrincipal(from = new Date()) {
    let t = from, e0 = elongation(from);
    for (let i = 0; i < 4 * 32; i++) {            // ≤ 32 days, 6-hour steps
      const t1 = new Date(t.getTime() + 6 * 3600000), e1 = elongation(t1);
      const full = e0 < 180 && e1 >= 180, isNew = e1 < e0;   // wrapped past 360 → new moon
      if (full || isNew) {
        const at = full ? bisect(t, t1, (d) => elongation(d) >= 180)
                        : bisect(t, t1, (d) => elongation(d) < e0);
        const m = moonNow(at);
        return { date: at, kind: full ? "full" : "new", sign: m.sign, glyph: m.glyph };
      }
      t = t1; e0 = e1;
    }
    return null;
  }

  /** The next `n` new/full moons. */
  function principals(from, n) {
    const out = [];
    let t = from;
    while (out.length < n) {
      const p = nextPrincipal(t);
      if (!p) break;
      out.push(p);
      t = new Date(p.date.getTime() + 3600000);
    }
    return out;
  }

  /**
   * SVG path of the lit part of a moon disc of radius r centred at (r, r) — the same
   * geometry as the app's MoonPhaseShape (fraction 0 = new, 0.5 = full).
   */
  function phasePath(fraction, r) {
    let p = ((fraction % 1) + 1) % 1;
    const cx = r, cy = r, k = 4 / 3;
    const waxing = p < 0.5;
    const xr = (waxing ? Math.cos(2 * Math.PI * p) : -Math.cos(2 * Math.PI * p)) * r;
    const arc = waxing ? `A ${r} ${r} 0 0 1 ${cx} ${cy + r}` : `A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
    return `M ${cx} ${cy - r} ${arc} C ${cx + xr * k} ${cy + r} ${cx + xr * k} ${cy - r} ${cx} ${cy - r} Z`;
  }

  const LunarMath = { SIGNS, GLYPHS, PHASES, moonNow, nextIngress, ingresses, nextPrincipal,
    principals, phasePath, elongation, sunLongitude, moonLonDist };
  if (typeof module !== "undefined" && module.exports) module.exports = LunarMath;
  else root.LunarMath = LunarMath;
})(typeof globalThis !== "undefined" ? globalThis : this);
