# Foto

## Aggiornamento automatico con Google Drive

Se Drive è configurato in `assets/js/config.js`, carica o sostituisci le immagini direttamente nella cartella condivisa:

| Cartella Drive | Dove compaiono |
|---|---|
| `foto/home/` | Foto nella home |
| `foto/commissioni/` | Portfolio e galleria Commissioni |
| `foto/ritrattini/` | Portfolio e galleria Ritrattini a portar via |
| `foto/editoriali/` | Sezione Illustrazioni del portfolio |

Non serve mantenere nomi o estensioni specifiche: le gallerie rilevano automaticamente i file immagine e li ordinano per nome (numeri compresi). La home preferisce una foto il cui nome inizia con `chi-sono`; se non c'è, usa la prima. Le gallerie mostrano fino a 12 immagini. Il sito rilegge Drive quando viene aperta la pagina; l'elenco resta in cache per al massimo 30 secondi.

Sono accettati anche file HEIC se Google Drive riesce a generarne l'anteprima. Se una foto non appare, aprila in Drive per verificare che sia visibile e che abbia un'anteprima.

## Foto locali di ripiego

Se Drive non è configurato o non è raggiungibile, il sito usa questa cartella del repository:

- Home: `home/chi-sono.jpeg` (sono accettati anche `.jpg`, `.png`, `.webp` e `.svg`).
- Gallerie: `commissioni/`, `ritrattini/`, `editoriali/` con file `1.jpeg`, `2.jpeg`, `3.jpeg`... fino a 12.
