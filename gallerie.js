// Foto delle gallerie. Per ora sono immagini casuali da picsum.photos (segnaposto).
// Per usare le tue: carica le foto su GitHub (es. cartella "foto") e scrivi gli indirizzi, es. 'foto/commissione-1.jpg'.
const picsum = (nome, n = 6) => Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/luna-${nome}-${i + 1}/600/600`);
window.GALLERIE = {
  commissioni: picsum('commissioni'),
  ritrattini: picsum('ritrattini'),
  editoriali: picsum('editoriali')
};
