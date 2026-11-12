const $ = s => document.querySelector(s), C = window.SITO || {};
document.querySelectorAll('[data-ig]').forEach(a => { a.href = C.instagram; a.target = '_blank'; a.rel = 'noopener'; });
document.querySelectorAll('[data-wa]').forEach(a => { a.href = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(a.dataset.wa)}`; a.target = '_blank'; a.rel = 'noopener'; });
document.querySelectorAll('[data-mail]').forEach(a => { a.href = `mailto:${C.email}?subject=${encodeURIComponent(a.dataset.mail)}`; });
document.querySelectorAll('[data-mail-text]').forEach(a => { a.textContent = C.email; });

// Foto: prova chi-sono.jpg, .jpeg, .png, .webp (anche maiuscole), poi il segnaposto .svg
document.querySelectorAll('.foto[data-foto]').forEach(f => {
  const box = f.parentElement, c = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'svg'].map(e => `${f.dataset.foto}.${e}`); let i = 0;
  f.onload = () => box.classList.add('ok');
  f.onerror = () => { if (++i < c.length) f.src = c[i]; else box.classList.add('ko'); };
  f.src = c[0];
});

// Menu hamburger
const burger = $('#burger'), menu = $('#menu');
const chiudi = () => { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); };
burger.onclick = e => { e.stopPropagation(); const apri = menu.hidden; menu.hidden = !apri; burger.setAttribute('aria-expanded', String(apri)); };
document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) chiudi(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudi(); });
