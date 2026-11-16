# Atelier Luna in Pesci

## Cosa modificare
- `assets/js/config.js`: link Instagram, numero WhatsApp (con prefisso, senza +) ed email.
- Testi: direttamente nei file `.html` (cerca i commenti "DI PROVA").
- Foto home: sostituisci `foto/home/chi-sono.jpeg` (sono accettati anche .jpg, .png e .webp). Ridimensionala a circa 1200 px e sotto i 500 KB.

## Struttura
- `view/`: pagine interne del sito.
- `foto/`: fotografie della home e delle gallerie.
- `assets/css/`, `assets/js/`, `assets/icons/`, `assets/images/`: fogli di stile, script, icone e immagini di supporto.
- `manifest.webmanifest` e `sw.js` restano nella radice per mantenere corretti ambito e registrazione della PWA.

## Pubblicare
1. Nuovo repository pubblico su GitHub, carica i file (non lo zip).
2. Settings, Pages, Deploy from a branch, main, / (root).
3. Apri `sitemap.xml` e `robots.txt` e sostituisci `https://TUOUTENTE.github.io/NOME-REPO/` con l'indirizzo vero del sito.

## Google
1. Registra il sito su search.google.com/search-console.
2. In Sitemap invia `sitemap.xml`.
3. Metti il link del sito nella bio di Instagram.

## Foto da Google Drive (facoltativo)
1. Cartella Drive condivisa con "Chiunque abbia il link", Visualizzatore, con dentro `foto/home`, `foto/commissioni`, `foto/ritrattini`, `foto/editoriali`.
2. console.cloud.google.com: nuovo progetto, Libreria, abilita "Google Drive API".
3. Credenziali, Crea credenziali, Chiave API. Modificala: Restrizioni applicazione = Siti web, aggiungi `https://TUOUTENTE.github.io/*`; Restrizioni API = solo Google Drive API.
4. Incolla la chiave in `assets/js/config.js`, campo `drive.apiKey`.
Se Drive non risponde, il sito usa le foto della cartella `foto/`.

## Installazione come app
Il manifest e il service worker sono nella radice; le icone sono in `assets/icons/`. La guida per gli utenti è in `view/installa.html`.
