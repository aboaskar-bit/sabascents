// i18n (page language from <html lang>)
const LG = document.documentElement.lang || "ar";
const ruPl = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
const TX = {
  ar: { none: "لا توجد نتائج", out: " · نفدت", count: n => n + " منتج", req: "فضلاً عبّئ الحقول المطلوبة (*)", sending: "جارٍ الإرسال…", ok: "وصلنا طلبك ✓ — بنتواصل معك قريب.", fail: "تعذّر الإرسال بالإيميل، نفتح لك واتساب بدلاً منه…", wa: "انفتحت رسالة واتساب جاهزة بطلبك — اضغط إرسال ✓", view: "شاهد", msg: d => ["طلب عطر جديد 🌹", "العطر: " + d.perfume, d.brand ? "الماركة: " + d.brand : "", "الاسم: " + d.name, "للتواصل: " + d.contact, d.notes ? "ملاحظات: " + d.notes : ""].filter(Boolean).join("\n") },
  en: { none: "No results", out: " · sold out", count: n => n + (n === 1 ? " product" : " products"), req: "Please fill in the required fields (*)", sending: "Sending…", ok: "Request received ✓ — we’ll be in touch soon.", fail: "Email failed, opening WhatsApp instead…", wa: "A ready WhatsApp message opened — just press send ✓", view: "View", msg: d => ["New perfume request 🌹", "Perfume: " + d.perfume, d.brand ? "Brand: " + d.brand : "", "Name: " + d.name, "Contact: " + d.contact, d.notes ? "Notes: " + d.notes : ""].filter(Boolean).join("\n") },
  tr: { none: "Sonuç bulunamadı", out: " · tükendi", count: n => n + " ürün", req: "Lütfen zorunlu alanları doldurun (*)", sending: "Gönderiliyor…", ok: "Talebiniz alındı ✓ — en kısa sürede dönüş yapacağız.", fail: "E-posta gönderilemedi, WhatsApp açılıyor…", wa: "Hazır WhatsApp mesajı açıldı — sadece gönderin ✓", view: "İncele", msg: d => ["Yeni parfüm talebi 🌹", "Parfüm: " + d.perfume, d.brand ? "Marka: " + d.brand : "", "Ad: " + d.name, "İletişim: " + d.contact, d.notes ? "Notlar: " + d.notes : ""].filter(Boolean).join("\n") },
  ru: { none: "Ничего не найдено", out: " · нет в наличии", count: n => n + " " + ruPl(n, "товар", "товара", "товаров"), req: "Пожалуйста, заполните обязательные поля (*)", sending: "Отправка…", ok: "Запрос получен ✓ — скоро свяжемся с вами.", fail: "Не удалось отправить e-mail, открываем WhatsApp…", wa: "Открылось готовое сообщение в WhatsApp — просто отправьте ✓", view: "Смотреть", msg: d => ["Новый запрос аромата 🌹", "Аромат: " + d.perfume, d.brand ? "Бренд: " + d.brand : "", "Имя: " + d.name, "Контакт: " + d.contact, d.notes ? "Комментарий: " + d.notes : ""].filter(Boolean).join("\n") }
}[LG] || null;
const T = TX || {};
// search
const sb = document.getElementById('sbtn'), box = document.getElementById('sbox'), q = document.getElementById('sq'), res = document.getElementById('sres');
let IDX = null;
const norm = s => (s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
async function load() { if (!IDX) IDX = await fetch(LG === 'ar' ? '/search.json' : '/search-' + LG + '.json').then(r => r.json()); }
sb && sb.addEventListener('click', async () => { box.hidden = !box.hidden; if (!box.hidden) { q.focus(); await load(); } });
q && q.addEventListener('input', async () => {
  await load(); const t = norm(q.value.trim()); if (!t) { res.innerHTML = ''; return; }
  const hits = IDX.filter(p => norm(p.n + ' ' + p.a + ' ' + p.b).includes(t)).slice(0, 12);
  res.innerHTML = hits.length ? hits.map(p => `<a href="${p.u}"><img src="${p.i}" alt="" loading="lazy"><span><b>${p.n}</b> ${p.a ? '· ' + p.a : ''}<br><small>${p.b} — ${p.pr.toLocaleString('en-US')} ₺${p.s ? '' : T.out}</small></span></a>`).join('') : '<p>' + T.none + '</p>';
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
    if (cnt) cnt.textContent = T.count(n);
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
    if (miss.length) { msg.textContent = T.req; f.querySelector(`[name=${miss[0]}]`).focus(); return; }
    const text = T.msg(d);
    if (f.dataset.email) {
      msg.textContent = T.sending;
      try {
        const r = await fetch('https://formsubmit.co/ajax/' + f.dataset.email, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: 'طلب عطر جديد — ' + d.perfume, _template: 'table', 'العطر': d.perfume, 'الماركة': d.brand, 'الاسم': d.name, 'للتواصل': d.contact, 'ملاحظات': d.notes }) });
        if (!r.ok) throw 0; msg.textContent = T.ok; f.reset(); return;
      } catch { msg.textContent = T.fail; }
    }
    window.open(`https://wa.me/${f.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    msg.textContent = T.wa; f.reset();
  });
});

// ===== motion layer =====
document.documentElement.classList.add('js');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

// header height -> hero sizing
const hdrEl = document.querySelector('.hdr'), annEl = document.querySelector('.announce');
const setHH = () => document.documentElement.style.setProperty('--hh', ((hdrEl ? hdrEl.offsetHeight : 0) + (annEl ? annEl.offsetHeight : 0)) + 'px');
setHH(); addEventListener('resize', setHH);

// hero: crossfading stills
document.querySelectorAll('.hero2').forEach(h => {
  const slides = [...h.querySelectorAll('.hs')], shots = [...h.querySelectorAll('.hshot')], dots = [...h.querySelectorAll('.hdots button')];
  const n = slides.length, DUR = 3200; let cur = 0, t = null, paused = false;
  h.style.setProperty('--dur', DUR + 'ms');
  const hydrate = i => slides[i] && slides[i].querySelectorAll('img').forEach(im => {
    if (im.dataset.srcset) { im.srcset = im.dataset.srcset; im.removeAttribute('data-srcset'); }
    if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
  });
  const ready = i => [...slides[i].querySelectorAll('.hf')].every(im => im.complete && im.naturalWidth);
  function show(i) {
    cur = (i + n) % n; hydrate((cur + 1) % n);
    slides.forEach((s, k) => s.classList.toggle('on', k === cur));
    shots.forEach((s, k) => s.classList.toggle('on', k === cur));
    dots.forEach((d, k) => { d.classList.toggle('on', k === cur); d.classList.toggle('done', k < cur); d.setAttribute('aria-selected', k === cur); const i2 = d.querySelector('i'); i2.style.animation = 'none'; i2.offsetWidth; i2.style.animation = ''; });
  }
  function next() { const nx = (cur + 1) % n; hydrate(nx); if (!ready(nx)) { t = setTimeout(next, 400); return; } show(nx); schedule(); }
  function schedule() { clearTimeout(t); if (!paused && !RM) t = setTimeout(next, DUR); }
  const pause = p => { paused = p; h.classList.toggle('paused', p); p ? clearTimeout(t) : schedule(); };
  dots.forEach((d, k) => d.addEventListener('click', () => { hydrate(k); show(k); schedule(); }));
  document.addEventListener('visibilitychange', () => pause(document.hidden));
  new IntersectionObserver(es => es.forEach(e => pause(!e.isIntersecting)), { threshold: .15 }).observe(h);
  let sx = null; h.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  h.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) { const k = cur + (dx > 0 ? 1 : -1); hydrate((k + n) % n); show(k); schedule(); } }, { passive: true });
  const boot = () => { hydrate(1); schedule(); };
  document.readyState === 'complete' ? boot() : addEventListener('load', boot);
  if (RM) dots.forEach(d => d.querySelector('i').style.animation = 'none');
});

// reveal on scroll (only things below the fold, so nothing visible ever flashes)
if (!RM && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const groups = ['main section h2', 'main .eyebrow', '.pg', '.pillars', '.bgrid2', '.shop3d .deck', '.req-in', '.faq', '.pdg', '.phead'];
  document.querySelectorAll(groups.join(',')).forEach(el => {
    if (el.closest('.hero2') || el.getBoundingClientRect().top < innerHeight) return;
    el.classList.add('rvl'); io.observe(el);
  });
  document.querySelectorAll('.pg').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--d', (i % 4) * 0.06 + 's')));
}

// smooth scrolling (desktop wheel/trackpad only — phones keep native scroll)
if (FINE && !RM) {
  const s = document.createElement('script'); s.src = '/js/lenis.min.js'; s.defer = true;
  s.onload = () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, anchors: { offset: -90 }, prevent: n => n.closest && n.closest('.sres,.chips,.search') });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    window.__lenis = lenis;
  };
  document.head.appendChild(s);
}

// luxury cursor + magnetic buttons
if (FINE && !RM) {
  const root = document.documentElement;
  const ring = document.createElement('div'); ring.className = 'cur'; ring.innerHTML = '<span>' + T.view + '</span>';
  const dot = document.createElement('div'); dot.className = 'cur-dot';
  document.body.append(ring, dot);
  let mx = -100, my = -100, rx = -100, ry = -100, running = false;
  const loop = () => {
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.2) requestAnimationFrame(loop); else running = false;
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    root.classList.add('has-cur'); root.classList.remove('cur-out');
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.add('cur-out'));
  addEventListener('pointerdown', () => root.classList.add('cur-down'));
  addEventListener('pointerup', () => root.classList.remove('cur-down'));
  document.addEventListener('pointerover', e => {
    const v = e.target.closest('.pc a, .arch, .dcard, .pcap, .bl2, .bcard');
    const l = !v && e.target.closest('a, button, select, label, summary, [role=tab]');
    root.classList.toggle('cur-view', !!v); root.classList.toggle('cur-link', !!l);
  });
  // magnetic pull on primary buttons
  document.querySelectorAll('.cta, .fab, .dnav').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.translate = `${x * 0.18}px ${y * 0.28}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
}

// language menu: collapsed on phones
document.querySelectorAll('.langs').forEach(n => {
  const cur = n.querySelector('[aria-current]');
  cur && cur.addEventListener('click', e => { if (innerWidth <= 700) { e.preventDefault(); n.classList.toggle('open'); } });
  document.addEventListener('click', e => { if (!n.contains(e.target)) n.classList.remove('open'); });
});

// ---------------- order basket (one WhatsApp message for many perfumes) ----------------
(() => {
  const CT = {
    ar: { hi: 'السلام عليكم 🌹', intro: 'أبغى أطلب من سبأ للعطور:', total: 'المجموع', added: 'انضاف للسلة ✓', rm: 'حذف', inc: 'زيادة', dec: 'إنقاص', items: n => n + (n === 1 ? ' عطر' : n === 2 ? ' عطران' : n <= 10 ? ' عطور' : ' عطر') },
    en: { hi: 'Hello 🌹', intro: 'I’d like to order from Sabascents:', total: 'Total', added: 'Added to basket ✓', rm: 'Remove', inc: 'More', dec: 'Less', items: n => n + (n === 1 ? ' item' : ' items') },
    tr: { hi: 'Merhaba 🌹', intro: 'Sabascents’ten sipariş vermek istiyorum:', total: 'Toplam', added: 'Sepete eklendi ✓', rm: 'Kaldır', inc: 'Artır', dec: 'Azalt', items: n => n + ' ürün' },
    ru: { hi: 'Здравствуйте 🌹', intro: 'Хочу заказать в Sabascents:', total: 'Итого', added: 'Добавлено в корзину ✓', rm: 'Удалить', inc: 'Больше', dec: 'Меньше', items: n => n + ' ' + ruPl(n, 'товар', 'товара', 'товаров') },
  }[LG] || {};
  const KEY = 'sabaCart', box = document.getElementById('cart');
  if (!box) return;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };
  const money = v => Number(v).toLocaleString('en-US') + ' ₺';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const name = it => LG === 'ar' && it.na ? `${it.n} · ${it.na}` : it.n;
  const brand = it => LG === 'ar' ? it.ba || it.b : it.b;
  const pre = { ar: '', en: '/en', tr: '/tr', ru: '/ru' }[LG] || '';
  const wa = (document.getElementById('csend').getAttribute('href') || '').split('?')[0];
  const cnt = document.getElementById('ccount'), list = document.getElementById('clist');
  let cart = load();
  function render() {
    const n = cart.reduce((a, it) => a + it.q, 0), tot = cart.reduce((a, it) => a + it.q * it.p, 0);
    cnt.hidden = !n; cnt.textContent = n;
    document.getElementById('cempty').hidden = !!cart.length; document.getElementById('cft').hidden = !cart.length;
    list.innerHTML = cart.map((it, i) => `<div class="ci"><a href="${pre}/p/${it.slug}/"><img src="${it.img}" alt="" loading="lazy"></a><div class="ci-t"><a href="${pre}/p/${it.slug}/"><b>${esc(it.n)}</b></a>${LG === 'ar' && it.na ? `<small class="ci-ar">${esc(it.na)}</small>` : ''}<small>${esc(brand(it))}${it.sz ? ' · ' + esc(it.sz) : ''}</small><span class="ci-p">${money(it.p * it.q)}</span></div><div class="ci-q"><button type="button" data-i="${i}" data-d="1" aria-label="${CT.inc}">+</button><span>${it.q}</span><button type="button" data-i="${i}" data-d="-1" aria-label="${CT.dec}">−</button></div><button type="button" class="ci-x" data-i="${i}" data-x aria-label="${CT.rm}">×</button></div>`).join('');
    document.getElementById('ctot').textContent = money(tot);
    const lines = cart.map((it, i) => `${i + 1}) ${name(it)} — ${brand(it)}${it.sz ? ' — ' + it.sz : ''} × ${it.q} = ${money(it.p * it.q)}`);
    const msg = [CT.hi, CT.intro, '', ...lines, '', `${CT.total}: ${money(tot)} (${CT.items(n)})`].join('\n');
    document.getElementById('csend').href = wa + '?text=' + encodeURIComponent(msg);
  }
  const open = () => { box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); document.documentElement.classList.add('cart-open'); window.__lenis && window.__lenis.stop(); };
  const close = () => { box.classList.remove('on'); document.documentElement.classList.remove('cart-open'); window.__lenis && window.__lenis.start(); setTimeout(() => { if (!box.classList.contains('on')) box.hidden = true; }, 380); };
  document.getElementById('cbtn').addEventListener('click', open);
  box.addEventListener('click', e => {
    const t = e.target.closest('button,[data-close]'); if (!t) return;
    if (t.hasAttribute('data-close')) return close();
    const i = +t.dataset.i;
    if (t.hasAttribute('data-x')) cart.splice(i, 1);
    else if (t.dataset.d) { cart[i].q = Math.max(1, Math.min(20, cart[i].q + +t.dataset.d)); }
    else return;
    save(cart); render();
  });
  document.getElementById('cclear').addEventListener('click', () => { cart = []; save(cart); render(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  addEventListener('storage', e => { if (e.key === KEY) { cart = load(); render(); } });
  // product page: add the chosen size
  const add = document.getElementById('addc');
  if (add) {
    const sync = () => { const v = document.querySelector('.vars input:checked'); add.disabled = !!v && v.dataset.ok === '0'; };
    document.querySelectorAll('.vars input').forEach(i => i.addEventListener('change', sync)); sync();
    add.addEventListener('click', () => {
      const v = document.querySelector('.vars input:checked') || {}, d = add.dataset, sz = v.dataset ? v.dataset.sz : '', id = d.slug + '|' + (v.dataset ? v.dataset.raw : '');
      const ex = cart.find(it => it.id === id);
      if (ex) ex.q = Math.min(20, ex.q + 1);
      else cart.push({ id, slug: d.slug, n: d.n, na: d.na, b: d.b, ba: d.ba, img: d.img, sz, p: +(v.dataset ? v.dataset.pr : 0), q: 1 });
      save(cart); render();
      add.classList.add('ok'); add.querySelector('span').dataset.t = add.querySelector('span').dataset.t || add.querySelector('span').textContent;
      add.querySelector('span').textContent = CT.added;
      setTimeout(() => { add.classList.remove('ok'); add.querySelector('span').textContent = add.querySelector('span').dataset.t; }, 1600);
      cnt.classList.remove('pop'); void cnt.offsetWidth; cnt.classList.add('pop');
      open();
    });
  }
  render();
})();
