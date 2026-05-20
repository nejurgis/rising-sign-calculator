/* wheel-static.js — decorative zodiac wheel for sign pages
   Usage: <div data-wheel-sign="0"></div>  (0=Aries … 11=Pisces)
   The page's sign is placed at the rising (9 o'clock) position with the Moon inside it. */
(function () {
  'use strict';

  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                      'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const W_ELEMENTS = ['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
  const W_SIGN_PATHS = [
    ["M12 5a5 5 0 1 0 -4 8","M16 13a5 5 0 1 0 -4 -8","M12 21l0 -16"],
    ["M6 3a6 6 0 0 0 12 0","M6 15a6 6 0 1 0 12 0a6 6 0 1 0 -12 0"],
    ["M3 3a21 21 0 0 0 18 0","M3 21a21 21 0 0 1 18 0","M7 4.5l0 15","M17 4.5l0 15"],
    ["M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0","M15 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0","M3 12a10 6.5 0 0 1 14 -6.5","M21 12a10 6.5 0 0 1 -14 6.5"],
    ["M13 17a4 4 0 1 0 8 0","M3 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0","M7 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0","M7 7c0 3 2 5 2 9","M15 7c0 4 -2 6 -2 10"],
    ["M3 4a2 2 0 0 1 2 2v9","M5 6a2 2 0 0 1 4 0v9","M9 6a2 2 0 0 1 4 0v10a7 5 0 0 0 7 5","M12 21a7 5 0 0 0 7 -5v-2a3 3 0 0 0 -6 0"],
    ["M5 20l14 0","M5 17h5v-.3a7 7 0 1 1 4 0v.3h5"],
    ["M3 4a2 2 0 0 1 2 2v9","M5 6a2 2 0 0 1 4 0v9","M9 6a2 2 0 0 1 4 0v10a3 3 0 0 0 3 3h5","M18 22l3 -3m-3 3l3 3"],
    ["M4 20l16 -16","M13 4h7v7","M6.5 12.5l5 5"],
    ["M4 4a3 3 0 0 1 3 3v9","M7 7a3 3 0 0 1 6 0v11a3 3 0 0 1 -3 3","M16 17a3 3 0 1 0 0.001 0"],
    ["M3 10l3 -3l3 3l3 -3l3 3l3 -3l3 3","M3 17l3 -3l3 3l3 -3l3 3l3 -3l3 3"],
    ["M5 3a21 21 0 0 1 0 18","M19 3a21 21 0 0 0 0 18","M5 12l14 0"],
  ];
  const W_ELEM_LIGHT = {
    fire:[242,80,52], earth:[58,188,82], air:[132,92,238], water:[58,128,232]
  };

  function _parseSvgPath(d) {
    const cmds = [];
    const re = /([MmLlCcQqAaHhVvZzSsTt])([^MmLlCcQqAaHhVvZzSsTt]*)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
      const nums = (m[2].match(/-?[\d.]+(?:e[+-]?\d+)?/gi) || []).map(Number);
      cmds.push({ cmd: m[1], nums });
    }
    return cmds;
  }

  function _tracePathCmds(ctx, cmds, sx, sy) {
    let cx = 0, cy = 0;
    for (const { cmd, nums } of cmds) {
      switch (cmd) {
        case 'M': ctx.moveTo(nums[0]*sx, nums[1]*sy); cx=nums[0]; cy=nums[1]; break;
        case 'm': ctx.moveTo((cx+nums[0])*sx,(cy+nums[1])*sy); cx+=nums[0]; cy+=nums[1]; break;
        case 'L': ctx.lineTo(nums[0]*sx, nums[1]*sy); cx=nums[0]; cy=nums[1]; break;
        case 'l': for(let i=0;i<nums.length;i+=2){cx+=nums[i];cy+=nums[i+1];ctx.lineTo(cx*sx,cy*sy);} break;
        case 'H': ctx.lineTo(nums[0]*sx, cy*sy); cx=nums[0]; break;
        case 'h': cx+=nums[0]; ctx.lineTo(cx*sx,cy*sy); break;
        case 'V': ctx.lineTo(cx*sx,nums[0]*sy); cy=nums[0]; break;
        case 'v': cy+=nums[0]; ctx.lineTo(cx*sx,cy*sy); break;
        case 'C': for(let i=0;i<nums.length;i+=6){ctx.bezierCurveTo(nums[i]*sx,nums[i+1]*sy,nums[i+2]*sx,nums[i+3]*sy,nums[i+4]*sx,nums[i+5]*sy);cx=nums[i+4];cy=nums[i+5];} break;
        case 'c': for(let i=0;i<nums.length;i+=6){ctx.bezierCurveTo((cx+nums[i])*sx,(cy+nums[i+1])*sy,(cx+nums[i+2])*sx,(cy+nums[i+3])*sy,(cx+nums[i+4])*sx,(cy+nums[i+5])*sy);cx+=nums[i+4];cy+=nums[i+5];} break;
        case 'Q': ctx.quadraticCurveTo(nums[0]*sx,nums[1]*sy,nums[2]*sx,nums[3]*sy); cx=nums[2];cy=nums[3]; break;
        case 'q': ctx.quadraticCurveTo((cx+nums[0])*sx,(cy+nums[1])*sy,(cx+nums[2])*sx,(cy+nums[3])*sy); cx+=nums[2];cy+=nums[3]; break;
        case 'A': case 'a': {
          const rel = cmd==='a';
          for (let i=0;i<nums.length;i+=7) {
            const rx=nums[i]*sx, ry=nums[i+1]*sy, xRot=nums[i+2]*Math.PI/180;
            const largeArc=!!nums[i+3], sweep=!!nums[i+4];
            const ex=rel?cx+nums[i+5]:nums[i+5], ey=rel?cy+nums[i+6]:nums[i+6];
            _arcTo(ctx, cx*sx, cy*sy, ex*sx, ey*sy, rx, ry, xRot, largeArc, sweep);
            cx=ex; cy=ey;
          }
          break;
        }
        case 'Z': case 'z': ctx.closePath(); break;
      }
    }
  }

  function _arcTo(ctx, x1, y1, x2, y2, rx, ry, xRot, largeArc, sweep) {
    const cos=Math.cos(xRot), sin=Math.sin(xRot);
    const dx=(x1-x2)/2, dy=(y1-y2)/2;
    const px=cos*dx+sin*dy, py=-sin*dx+cos*dy;
    let sq=Math.max(0,(rx*rx*ry*ry-rx*rx*py*py-ry*ry*px*px)/(rx*rx*py*py+ry*ry*px*px));
    sq=Math.sqrt(sq)*(largeArc===sweep?-1:1);
    const cpx=sq*rx*py/ry, cpy=-sq*ry*px/rx;
    const cx0=cos*cpx-sin*cpy+(x1+x2)/2, cy0=sin*cpx+cos*cpy+(y1+y2)/2;
    const a1=Math.atan2((py-cpy)/ry,(px-cpx)/rx);
    let da=Math.atan2((-py-cpy)/ry,(-px-cpx)/rx)-a1;
    if (!sweep&&da>0) da-=2*Math.PI;
    if (sweep&&da<0) da+=2*Math.PI;
    ctx.ellipse(cx0,cy0,rx,ry,xRot,a1,a1+da,!sweep);
  }

  function _drawSignGlyph(ctx, signIdx, cx, cy, size) {
    const paths = W_SIGN_PATHS[signIdx];
    const scale = size / 24;
    ctx.save();
    ctx.translate(cx - 12*scale, cy - 12*scale);
    ctx.beginPath();
    for (const d of paths) _tracePathCmds(ctx, _parseSvgPath(d), scale, scale);
    ctx.restore();
  }

  function _buildSignOverlaySvg(W, ascLon) {
    const BASE = Math.floor(((ascLon % 360) + 360) % 360 / 30) * 30;
    const toA = lon => Math.PI - ((lon - BASE + 3600) % 360) * Math.PI / 180;
    const cx = W/2, cy = W/2, M = W;
    const rSign = M * 0.305, rBand = M * 0.378;
    const rArc  = rSign + (rBand - rSign) * 0.52;
    const ascSignIdx = Math.floor(((ascLon % 360) + 360) % 360 / 30);
    const fontSize = M * 0.022;
    let defs = '', textEls = '';
    for (let i = 0; i < 12; i++) {
      const a1 = toA(i*30), a2 = toA(i*30+30);
      const midAng = toA(i*30+15);
      const isTop = Math.sin(midAng) < 0;
      const x1=cx+Math.cos(a1)*rArc, y1=cy+Math.sin(a1)*rArc;
      const x2=cx+Math.cos(a2)*rArc, y2=cy+Math.sin(a2)*rArc;
      const d = isTop
        ? `M ${x2.toFixed(2)},${y2.toFixed(2)} A ${rArc.toFixed(2)},${rArc.toFixed(2)} 0 0,1 ${x1.toFixed(2)},${y1.toFixed(2)}`
        : `M ${x1.toFixed(2)},${y1.toFixed(2)} A ${rArc.toFixed(2)},${rArc.toFixed(2)} 0 0,0 ${x2.toFixed(2)},${y2.toFixed(2)}`;
      const hi = (i === ascSignIdx);
      const [r,g,b] = W_ELEM_LIGHT[W_ELEMENTS[i]];
      const fill = hi ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},0.78)`;
      const weight = hi ? 'bold' : 'normal';
      const dy = isTop ? '-2' : '6';
      defs += `<path id="ws${i}" d="${d}"/>`;
      textEls += `<text dy="${dy}"><textPath startOffset="50%" href="#ws${i}" `
        + `style="text-anchor:middle;font-size:${fontSize.toFixed(1)}px;letter-spacing:0.07em;`
        + `font-family:'Space Mono',monospace;fill:${fill};font-weight:${weight}">`
        + `${SIGN_NAMES[i].toUpperCase()}</textPath></text>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" `
      + `style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none">`
      + `<defs>${defs}</defs>${textEls}</svg>`;
  }

  function _drawStaticCanvas(canvas, signIdx, dpr) {
    const ascLon  = signIdx * 30;
    const moonLon = signIdx * 30 + 15;
    const ink = a => `rgba(17,17,17,${a})`;

    const ctx = canvas.getContext('2d');
    const S = canvas.width / dpr;
    ctx.scale(dpr, dpr);
    const cx = S/2, cy = S/2, M = S;

    const rCore   = M * 0.080;
    const rSign   = M * 0.320;
    const rBand   = M * 0.400;
    const rTube   = M * 0.438;
    const rPlanet = M * 0.492;

    const BASE = ascLon;
    const toA = lon => Math.PI - ((lon - BASE + 3600) % 360) * Math.PI / 180;

    // Sign sector fills
    for (let i = 0; i < 12; i++) {
      const a1 = toA(i*30), a2 = toA(i*30+30);
      const [r,g,b] = W_ELEM_LIGHT[W_ELEMENTS[i]];
      const hi = (i === signIdx);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx,cy,rBand,a1,a2,true);
      ctx.arc(cx,cy,rSign,a2,a1,false);
      ctx.closePath();
      if (hi) { ctx.shadowColor=`rgba(${r},${g},${b},0.9)`; ctx.shadowBlur=M*0.06; }
      ctx.fillStyle = hi ? `rgba(${r},${g},${b},0.48)` : `rgba(${r},${g},${b},0.09)`;
      ctx.fill();
      if (hi) {
        ctx.shadowBlur=0;
        ctx.strokeStyle=`rgba(${r},${g},${b},0.85)`;
        ctx.lineWidth=1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Ring borders
    ctx.save();
    ctx.strokeStyle=ink(0.18); ctx.lineWidth=0.6;
    ctx.beginPath(); ctx.arc(cx,cy,rSign,0,2*Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,rBand,0,2*Math.PI); ctx.stroke();
    ctx.restore();

    // Tick marks
    for (let deg=0; deg<360; deg++) {
      const ang = toA(deg);
      const isBdy = (deg%30===0), isMaj = (deg%5===0);
      const base = rBand+(isBdy?0:(rTube-rBand)*0.12);
      const len  = isBdy?(rTube-rBand)*0.82:isMaj?(rTube-rBand)*0.48:(rTube-rBand)*0.26;
      ctx.save();
      ctx.strokeStyle=isBdy?ink(0.45):isMaj?ink(0.22):ink(0.10);
      ctx.lineWidth=isBdy?0.9:0.5;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(ang)*base,       cy+Math.sin(ang)*base);
      ctx.lineTo(cx+Math.cos(ang)*(base+len), cy+Math.sin(ang)*(base+len));
      ctx.stroke();
      ctx.restore();
    }

    // Metallic tube ring
    const tubeW=(rTube-rBand)*0.26, tubeR=rBand+(rTube-rBand)*0.76;
    const tG=ctx.createRadialGradient(cx,cy,tubeR-tubeW*0.55,cx,cy,tubeR+tubeW*0.55);
    tG.addColorStop(0,'#1a3838'); tG.addColorStop(0.3,'#2a5555');
    tG.addColorStop(0.5,'#c8ece8'); tG.addColorStop(0.7,'#2a5555'); tG.addColorStop(1,'#1a3838');
    ctx.save();
    ctx.strokeStyle=tG; ctx.lineWidth=tubeW;
    ctx.beginPath(); ctx.arc(cx,cy,tubeR,0,2*Math.PI); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle=ink(0.22); ctx.lineWidth=0.6;
    ctx.beginPath(); ctx.arc(cx,cy,rTube,0,2*Math.PI); ctx.stroke();
    ctx.restore();

    // Moon tick line
    const moonAng = toA(moonLon);
    ctx.save();
    ctx.strokeStyle='rgba(190,210,240,0.8)'; ctx.lineWidth=1.5; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(moonAng)*(rBand-M*0.010), cy+Math.sin(moonAng)*(rBand-M*0.010));
    ctx.lineTo(cx+Math.cos(moonAng)*(rPlanet-M*0.018), cy+Math.sin(moonAng)*(rPlanet-M*0.018));
    ctx.stroke();
    ctx.restore();

    // Moon glyph — filled crescent drawn on an offscreen canvas to avoid
    // destination-out compositing affecting the main canvas underneath.
    const glyphSize = M * 0.054;
    const gx = cx + Math.cos(moonAng) * rPlanet;
    const gy = cy + Math.sin(moonAng) * rPlanet;
    const moonR = glyphSize * 0.98;  // larger than the tick glyph size
    const oSize = Math.ceil(moonR * dpr * 4);
    const off = document.createElement('canvas');
    off.width = off.height = oSize;
    const oc = off.getContext('2d');
    const ocx = oSize / 2, ocy = oSize / 2;
    const oR = moonR * dpr;
    oc.fillStyle = 'rgb(78, 144, 244)';
    oc.beginPath();
    oc.arc(ocx, ocy, oR, 0, 2*Math.PI);
    oc.fill();
    oc.globalCompositeOperation = 'destination-out';
    oc.beginPath();
    oc.arc(ocx - oR*0.38, ocy, oR*0.82, 0, 2*Math.PI);
    oc.fill();
    ctx.drawImage(off, gx - moonR*2, gy - moonR*2, moonR*4, moonR*4);

    // ASC glow
    const ascAng = toA(ascLon);
    const glowX=cx+Math.cos(ascAng)*rSign, glowY=cy+Math.sin(ascAng)*rSign;
    const glowR=M*0.11;
    const glow=ctx.createRadialGradient(glowX,glowY,0,glowX,glowY,glowR);
    glow.addColorStop(0,'rgba(255,255,200,0.55)');
    glow.addColorStop(0.35,'rgba(255,230,100,0.28)');
    glow.addColorStop(1,'rgba(255,210,80,0)');
    ctx.save();
    ctx.beginPath(); ctx.arc(glowX,glowY,glowR,0,2*Math.PI);
    ctx.fillStyle=glow; ctx.fill();
    ctx.restore();

    // Center disc
    ctx.save();
    ctx.strokeStyle=ink(0.25); ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.arc(cx,cy,rCore,0,2*Math.PI); ctx.stroke();
    ctx.restore();

    // Center sign glyph
    const [r,g,b] = W_ELEM_LIGHT[W_ELEMENTS[signIdx]];
    ctx.save();
    ctx.strokeStyle=`rgb(${r},${g},${b})`; ctx.lineWidth=1.2;
    ctx.lineCap='round'; ctx.lineJoin='round';
    _drawSignGlyph(ctx, signIdx, cx, cy, rCore*2.1);
    ctx.stroke();
    ctx.restore();
  }

  function paintStaticWheel(container, signIdx) {
    const W = container.offsetWidth;
    if (W < 20) return;
    const dpr = window.devicePixelRatio || 1;

    container.innerHTML = '';
    container.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.width = W*dpr; canvas.height = W*dpr;
    canvas.style.cssText = 'width:100%;height:auto;display:block;background:transparent';
    container.appendChild(canvas);

    const tmp = document.createElement('div');
    tmp.innerHTML = _buildSignOverlaySvg(W, signIdx*30);
    container.appendChild(tmp.firstChild);

    _drawStaticCanvas(canvas, signIdx, dpr);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-wheel-sign]').forEach(el => {
      const signIdx = parseInt(el.dataset.wheelSign, 10);
      let rTimer;
      const paint = () => paintStaticWheel(el, signIdx);
      paint();
      new ResizeObserver(() => { clearTimeout(rTimer); rTimer = setTimeout(paint, 100); }).observe(el);
    });
  });
})();
