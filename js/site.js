// search
const sb = document.getElementById('sbtn'), box = document.getElementById('sbox'), q = document.getElementById('sq'), res = document.getElementById('sres');
let IDX = null;
const norm = s => (s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
async function load() { if (!IDX) IDX = await fetch('/search.json').then(r => r.json()); }
sb && sb.addEventListener('click', async () => { box.hidden = !box.hidden; if (!box.hidden) { q.focus(); await load(); } });
q && q.addEventListener('input', async () => {
  await load(); const t = norm(q.value.trim()); if (!t) { res.innerHTML = ''; return; }
  const hits = IDX.filter(p => norm(p.n + ' ' + p.a + ' ' + p.b).includes(t)).slice(0, 12);
  res.innerHTML = hits.length ? hits.map(p => `<a href="${p.u}"><img src="${p.i}" alt="" loading="lazy"><span><b>${p.n}</b> ${p.a ? '· ' + p.a : ''}<br><small>${p.b} — ${p.pr.toLocaleString('en-US')} ₺${p.s ? '' : ' · نفدت'}</small></span></a>`).join('') : '<p>لا توجد نتائج</p>';
});
const qs = new URLSearchParams(location.search).get('q');
if (qs && q) { box.hidden = false; q.value = qs; q.dispatchEvent(new Event('input')); }

// filters + sort
document.querySelectorAll('.fbar').forEach(ch => {
  const grid = ch.nextElementSibling;
  const cnt = document.querySelector('.phead .count');
  const apply = (b, push) => {
    ch.querySelectorAll('.chips button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    let n = 0; grid.querySelectorAll('.pc').forEach(c => { const show = b.dataset.f === '*' || c.dataset.b === b.dataset.f; c.hidden = !show; if (show) n++; });
    if (cnt) cnt.textContent = n + ' منتج';
    if (push) { const u = new URL(location); b.dataset.f === '*' ? u.searchParams.delete('brand') : u.searchParams.set('brand', b.dataset.f); history.replaceState(null, '', u); }
  };
  ch.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => { apply(b, true); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }));
  const pre = new URLSearchParams(location.search).get('brand'); const pb = pre && ch.querySelector(`.chips button[data-f="${CSS.escape(pre)}"]`); if (pb) apply(pb, false);
  const s = ch.querySelector('.sort');
  s && s.addEventListener('change', () => {
    const items = [...grid.children]; const k = s.value;
    const f = { pa: (a, b) => a.dataset.p - b.dataset.p, pd: (a, b) => b.dataset.p - a.dataset.p, r: (a, b) => b.dataset.r - a.dataset.r }[k];
    if (f) items.sort(f).forEach(el => grid.appendChild(el));
  });
});

// size -> whatsapp message
document.querySelectorAll('.vars input').forEach(i => i.addEventListener('change', () => { const w = document.getElementById('wabtn'); if (w) w.href = i.dataset.wa; }));

// 3D category deck (coverflow): arrows, dots, swipe/drag, click side card to bring it front
document.querySelectorAll('[data-deck]').forEach(deck => {
  const cards = [...deck.querySelectorAll('.dcard')], n = cards.length;
  const dots = deck.parentElement.querySelector('.ddots');
  if (dots) dots.innerHTML = cards.map(() => '<i></i>').join('');
  let cur = 0, timer;
  const rtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
  function render() {
    const narrow = innerWidth < 560;
    cards.forEach((c, i) => {
      let off = i - cur; if (off > n / 2) off -= n; if (off < -n / 2) off += n;
      const a = Math.abs(off), dir = rtl ? -1 : 1;
      const x = off * (narrow ? 58 : 62) * dir, rot = -off * 38 * dir, z = -a * 160;
      c.style.transform = `translateX(${x}%) translateZ(${z}px) rotateY(${rot}deg)`;
      c.style.zIndex = 30 - a; c.style.opacity = a > 2 ? 0 : 1; c.classList.toggle('on', off === 0);
      c.setAttribute('aria-hidden', a > 2); c.tabIndex = off === 0 ? 0 : -1;
    });
    dots && [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
  }
  const go = d => { cur = (cur + d + n) % n; render(); };
  deck.querySelector('.prev').addEventListener('click', () => { go(-1); stop(); });
  deck.querySelector('.next').addEventListener('click', () => { go(1); stop(); });
  cards.forEach((c, i) => c.addEventListener('click', e => { if (moved) { e.preventDefault(); return; } if (i !== cur) { e.preventDefault(); cur = i; render(); stop(); } }));
  let sx = null, moved = false;
  deck.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; });
  deck.addEventListener('pointermove', e => { if (sx !== null && Math.abs(e.clientX - sx) > 12) moved = true; });
  deck.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) { go((dx < 0 ? 1 : -1) * (rtl ? -1 : 1)); stop(); } setTimeout(() => moved = false, 0); });
  const stop = () => { clearInterval(timer); timer = null; };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && !timer && timer !== 0) timer = setInterval(() => go(1), 3800); }), { threshold: .4 });
    io.observe(deck); deck.addEventListener('pointerenter', () => { stop(); timer = 0; });
  }
  addEventListener('resize', render); render();
});

// "request a perfume" form -> email (FormSubmit) when configured, otherwise a ready WhatsApp message
document.querySelectorAll('.req-f').forEach(f => {
  const msg = f.querySelector('.req-msg');
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d._honey) return;
    const miss = ['perfume', 'name', 'contact'].filter(k => !String(d[k] || '').trim());
    if (miss.length) { msg.textContent = 'فضلاً عبّئ الحقول المطلوبة (*)'; f.querySelector(`[name=${miss[0]}]`).focus(); return; }
    const text = `طلب عطر جديد 🌹\nالعطر: ${d.perfume}${d.brand ? '\nالماركة: ' + d.brand : ''}\nالاسم: ${d.name}\nللتواصل: ${d.contact}${d.notes ? '\nملاحظات: ' + d.notes : ''}`;
    if (f.dataset.email) {
      msg.textContent = 'جارٍ الإرسال…';
      try {
        const r = await fetch('https://formsubmit.co/ajax/' + f.dataset.email, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: 'طلب عطر جديد — ' + d.perfume, _template: 'table', 'العطر': d.perfume, 'الماركة': d.brand, 'الاسم': d.name, 'للتواصل': d.contact, 'ملاحظات': d.notes }) });
        if (!r.ok) throw 0; msg.textContent = 'وصلنا طلبك ✓ — بنتواصل معك قريب.'; f.reset(); return;
      } catch { msg.textContent = 'تعذّر الإرسال بالإيميل، نفتح لك واتساب بدلاً منه…'; }
    }
    window.open(`https://wa.me/${f.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    msg.textContent = 'انفتحت رسالة واتساب جاهزة بطلبك — اضغط إرسال ✓'; f.reset();
  });
});
