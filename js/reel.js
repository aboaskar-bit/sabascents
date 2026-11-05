// Scroll-driven perfume commercial: each shot is a frame sequence drawn on a canvas,
// the scroll position picks the frame (smooth on phones, where seeking <video> stutters).
(() => {
  const root = document.querySelector('.reel');
  if (!root) return;
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  const shots = [...root.querySelectorAll('.shot')];
  const counts = JSON.parse(root.dataset.counts);
  const keys = Object.keys(counts).sort();
  const imgs = keys.map(k => new Array(counts[k]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const src = (si, i) => `/reel/${keys[si]}/${String(i + 1).padStart(3, '0')}.webp`;
  const get = (si, i) => {
    let im = imgs[si][i];
    if (!im) { im = imgs[si][i] = new Image(); im.decoding = 'async'; im.src = src(si, i); im.onload = () => { if (si === cur.si) draw(); }; }
    return im;
  };
  // load first shot first, then the rest in the background (every frame, in order)
  const order = []; keys.forEach((k, si) => { for (let i = 0; i < counts[k]; i++) order.push([si, i]); });
  let qi = 0; const pump = () => { for (let n = 0; n < 6 && qi < order.length; n++, qi++) get(...order[qi]); if (qi < order.length) setTimeout(pump, 60); };
  get(0, 0).onload = () => { draw(); pump(); };

  let cur = { si: 0, f: 0, mix: 0 };
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); draw();
  }
  function cover(im, a) {
    if (!im || !im.complete || !im.naturalWidth) return false;
    const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.globalAlpha = a; ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h); ctx.globalAlpha = 1; return true;
  }
  // nearest loaded frame so fast scrolling never shows a blank
  const near = (si, f) => { for (let d = 0; d < counts[keys[si]]; d++) for (const j of [f - d, f + d]) { const im = imgs[si][j]; if (im && im.complete && im.naturalWidth) return im; } return get(si, f); };
  function draw() {
    const { si, f, mix } = cur;
    if (!cover(near(si, f), 1)) { ctx.fillStyle = '#2a0610'; ctx.fillRect(0, 0, cv.width, cv.height); }
    if (mix > 0 && si + 1 < keys.length) cover(near(si + 1, 0), mix);
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const r = root.getBoundingClientRect(), total = root.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const x = p * keys.length, si = Math.min(keys.length - 1, Math.floor(x)), t = x - si;
      const n = counts[keys[si]], fade = 0.14;
      cur = { si, f: Math.min(n - 1, Math.floor((reduce ? 0.5 : Math.min(t / (1 - fade), 1)) * (n - 1))), mix: t > 1 - fade ? (t - (1 - fade)) / fade : 0 };
      draw();
      shots.forEach((s, i) => s.classList.toggle('on', i === si));
      root.style.setProperty('--p', p.toFixed(4)); root.style.setProperty('--off', Math.max(0, r.top) + 'px');
      root.classList.toggle('started', p > 0.01);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', size);
  size(); onScroll();
})();
