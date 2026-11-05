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

  let cur = { si: 0, f: 0, mix: 0 }, hdr = 0;
  const H = document.querySelector('.hdr');
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); draw();
  }
  // small offscreen canvases: ambient blur (cheap upscale of a tiny copy) + feathered sharp layer
  const amb = document.createElement('canvas'), ax = amb.getContext('2d'); amb.width = 48; amb.height = 27;
  const lay = document.createElement('canvas'), lx = lay.getContext('2d');
  const wide = () => cv.width / cv.height > 0.9;
  function cover(im, a) {
    if (!im || !im.complete || !im.naturalWidth) return false;
    const iw = im.naturalWidth, ih = im.naturalHeight;
    // ambient backdrop (both layouts): tiny copy stretched = soft blur over the whole screen
    ax.drawImage(im, 0, ih * 0.25, iw, ih * 0.5, 0, 0, amb.width, amb.height);
    ctx.globalAlpha = a; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(amb, 0, 0, cv.width, cv.height);
    ctx.fillStyle = 'rgba(27,3,10,.5)'; ctx.fillRect(0, 0, cv.width, cv.height);
    if (!wide()) {
      // phones/tablets: whole shot at full width under the header, bottom feathered, text gets the space below
      const d = cv.width / cv.getBoundingClientRect().width;
      const free = cv.height - hdr * d, w = cv.width, x = 0, y = hdr * d;
      const h = Math.min(ih * (w / iw), free * 0.62), sh = h * iw / w, sy = (ih - sh) * 0.42;
      lay.width = Math.ceil(w); lay.height = Math.ceil(h);
      lx.globalCompositeOperation = 'source-over'; lx.drawImage(im, 0, sy, iw, sh, 0, 0, lay.width, lay.height);
      const g = lx.createLinearGradient(0, 0, 0, lay.height);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.8, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.globalCompositeOperation = 'destination-in'; lx.fillStyle = g; lx.fillRect(0, 0, lay.width, lay.height);
      ctx.drawImage(lay, x, y); ctx.globalAlpha = 1; return true;
    }
    // 2) sharp vertical shot, full height, on the visual left (text sits on the right in RTL), edges feathered
    const h = cv.height * 1.04, w = iw * (h / ih), x = Math.max(cv.width * 0.06, cv.width * 0.3 - w / 2), y = (cv.height - h) / 2;
    lay.width = Math.ceil(w); lay.height = Math.ceil(h);
    lx.globalCompositeOperation = 'source-over'; lx.drawImage(im, 0, 0, lay.width, lay.height);
    const g = lx.createLinearGradient(0, 0, lay.width, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.16, 'rgba(0,0,0,1)'); g.addColorStop(0.84, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    lx.globalCompositeOperation = 'destination-in'; lx.fillStyle = g; lx.fillRect(0, 0, lay.width, lay.height);
    ctx.drawImage(lay, x, y); ctx.globalAlpha = 1; return true;
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
      hdr = Math.max(0, (H ? H.getBoundingClientRect().bottom : 0) - Math.max(0, r.top));
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
