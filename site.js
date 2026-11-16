const $ = s => document.querySelector(s), C = window.SITO || {};
document.querySelectorAll('[data-ig]').forEach(a => { a.href = C.instagram; a.target = '_blank'; a.rel = 'noopener'; });
document.querySelectorAll('[data-wa]').forEach(a => { a.href = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(a.dataset.wa)}`; a.target = '_blank'; a.rel = 'noopener'; });
document.querySelectorAll('[data-mail]').forEach(a => { a.href = `mailto:${C.email}?subject=${encodeURIComponent(a.dataset.mail)}`; });
document.querySelectorAll('[data-mail-text]').forEach(a => { a.textContent = C.email; });

// ---- Foto: da Google Drive (se in config.js c'è la chiave API) oppure dalla cartella foto/ del sito ----
const DR = (C.drive && C.drive.apiKey && C.drive.cartella) ? C.drive : null;
const TIPI = "(mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/webp')";
const attesa = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
async function elenco(q, campi = 'files(id,name)') {
  const r = await attesa(fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(campi)}&pageSize=200&key=${DR.apiKey}`, { referrerPolicy: 'no-referrer-when-downgrade' }), 6000);
  if (!r.ok) { let m = ''; try { m = (await r.json()).error.message; } catch (e) {} throw new Error(`Drive ${r.status} ${m}`); }
  return (await r.json()).files || [];
}
const norm = s => String(s).trim().toLowerCase();
const ALIAS = { home: ['home'], commissioni: ['commissioni'], ritrattini: ['ritrattini'], editoriali: ['editoriali', 'progetti editoriali'] };
const sottocartelle = padre => elenco(`'${padre}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
const trova = (lista, nomi) => (lista.find(c => nomi.includes(norm(c.name))) || lista.find(c => nomi.some(n => norm(c.name).startsWith(n))) || {}).id;
async function fotoDrive(sezione) { // elenco ordinato per nome (1, 2, 10...), in cache 5 minuti
  const k = 'luna-drive-' + sezione; let c = null;
  try { c = JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) {}
  if (c && Date.now() - c.t < 300000) return c.f;
  const sub = await sottocartelle(DR.cartella), radice = trova(sub, ['foto']) || DR.cartella;
  const id = trova(radice === DR.cartella ? sub : await sottocartelle(radice), ALIAS[sezione] || [sezione]);
  if (!id) throw new Error(`Cartella "${sezione}" non trovata in Drive`);
  const f = (await elenco(`'${id}' in parents and ${TIPI} and trashed=false`, 'files(id,name,thumbnailLink)')).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (f.length) { try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), f })); } catch (e) {} }
  return f;
}
const urlDrive = (x, w) => [x.thumbnailLink && x.thumbnailLink.replace(/=s\d+.*$/, `=w${w}`), `https://lh3.googleusercontent.com/d/${x.id}=w${w}`, `https://drive.google.com/thumbnail?id=${x.id}&sz=w${w}`].filter(Boolean);
function provaImg(im, lista, ko) { let i = 0; im.referrerPolicy = 'no-referrer'; im.onerror = () => { if (++i < lista.length) im.src = lista[i]; else ko(); }; im.src = lista[0]; }

// Foto home: Drive (home/chi-sono.*, altrimenti la prima), poi foto/home/chi-sono.jpeg del sito, poi il segnaposto
document.querySelectorAll('.foto[data-foto]').forEach(async f => {
  const box = f.parentElement, locali = ['jpeg', 'jpg', 'png', 'webp', 'JPG', 'JPEG', 'svg'].map(e => `foto/home/${f.dataset.foto}.${e}`);
  let lista = locali;
  if (DR) { try { const fs = await fotoDrive('home'), x = fs.find(o => o.name.toLowerCase().startsWith(f.dataset.foto)) || fs[0]; if (x) lista = [...urlDrive(x, 1400), ...locali]; } catch (e) { console.warn('[Drive]', e.message); } }
  f.onload = () => box.classList.add('ok');
  provaImg(f, lista, () => box.classList.add('ko'));
});

// Menu hamburger
const burger = $('#burger'), menu = $('#menu');
const chiudi = () => { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); };
burger.onclick = e => { e.stopPropagation(); const apri = menu.hidden; menu.hidden = !apri; burger.setAttribute('aria-expanded', String(apri)); };
document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) chiudi(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudi(); });

// Gallerie: da Drive (cartella della sezione) oppure foto/<sezione>/1.jpeg, 2.jpeg... del sito.
// Se da Drive non arriva nemmeno una foto (errore, cartella vuota o immagini bloccate) si usano quelle del sito.
const MAX_FOTO = (window.GALLERIE || {}).massimo || 12;
document.querySelectorAll('[data-galleria]').forEach(async g => {
  const sez = g.dataset.galleria; let fatto = false;
  if (DR) {
    g.classList.add('carica');
    try {
      const fs = (await fotoDrive(sez)).slice(0, MAX_FOTO);
      const esiti = await Promise.all(fs.map((x, n) => new Promise(ok => {
        const im = new Image(); im.alt = `Opera ${n + 1}`; im.decoding = 'async'; im.onload = () => ok(true);
        provaImg(im, urlDrive(x, 1000), () => { im.remove(); ok(false); }); g.append(im);
      })));
      fatto = esiti.some(Boolean);
    } catch (e) { console.warn('[Drive]', e.message); }
    g.classList.remove('carica');
  }
  if (!fatto) for (let n = 1; n <= MAX_FOTO; n++) {
    const im = new Image(); im.alt = `Opera ${n}`; im.loading = 'lazy'; im.decoding = 'async';
    im.onerror = () => im.remove(); im.src = `foto/${sez}/${n}.jpeg`; g.append(im);
  }
});

// Installazione come app
let dp = null;
const mobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); dp = ev; const b = $('#one-tap'); if (b && mobile) b.hidden = false; });
const uno = $('#one-tap'); if (uno) uno.onclick = async () => { if (dp) { dp.prompt(); await dp.userChoice; uno.hidden = true; } };
const scheda = t => {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
  document.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== t);
};
if ($('[data-tab]')) { document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => scheda(b.dataset.tab)); scheda(/android/i.test(navigator.userAgent) ? 'android' : 'iphone'); }
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) document.querySelectorAll('a[href="installa.html"]').forEach(a => a.remove());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
