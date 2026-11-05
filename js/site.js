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
