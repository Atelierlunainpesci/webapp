# Atelier Luna in Pesci

## Cosa modificare
- `assets/js/config.js`: link Instagram, numero WhatsApp (con prefisso, senza +) ed email.
- Testi e traduzioni: `assets/js/i18n.js`. Le pagine usano l'italiano se la lingua preferita del browser inizia con `it`; per tutte le altre lingue usano l'inglese. Per aggiungere un'etichetta, crea la stessa chiave nei dizionari `it` e `en` e applicala in HTML con `data-i18n` (oppure `data-i18n-attr` per gli attributi e `data-i18n-html` per i passaggi con formattazione).
- Didascalie delle opere: modifica le chiavi `portfolio.commissionCaption`, `portfolio.portraitCaption` e `portfolio.illustrationCaption` in entrambi i dizionari di `assets/js/i18n.js`.
- Testi personalizzati: aggiorna le traduzioni corrispondenti in `assets/js/i18n.js`, comprese le versioni inglesi.
- Tema: segue la preferenza del dispositivo. In locale puoi forzarlo aggiungendo `?theme=dark` oppure `?theme=white` (anche `?theme=light`) all'indirizzo; la scelta resta attiva navigando tra le pagine. Rimuovi il parametro per tornare alla preferenza del dispositivo. Il test non è attivo sul sito pubblicato.
- Foto home locale di ripiego: `foto/home/chi-sono.jpeg` (sono accettati anche .jpg, .png e .webp). Portfolio e gallerie usano le cartelle sotto `foto/`. Per aggiornare le foto da Drive senza modificare il codice, segui la sezione [Foto da Google Drive](#foto-da-google-drive-facoltativo).

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
1. Crea una cartella Drive condivisa con "Chiunque abbia il link", Visualizzatore. Dentro crea `foto/home`, `foto/commissioni`, `foto/ritrattini` e `foto/editoriali` (illustrazioni nel portfolio).
2. console.cloud.google.com: nuovo progetto, Libreria, abilita "Google Drive API".
3. Credenziali, Crea credenziali, Chiave API. Modificala: Restrizioni applicazione = Siti web, aggiungi `https://TUOUTENTE.github.io/*`; Restrizioni API = solo Google Drive API.
4. Incolla la chiave in `assets/js/config.js`, campo `drive.apiKey`.

Dopo questa configurazione, chi gestisce le foto può caricarle, sostituirle o rinominarle direttamente nella sottocartella giusta di Drive: non serve modificare il codice né ripubblicare il sito. Il sito rilegge l'elenco quando si apre la pagina (cache massima 30 secondi); per le gallerie mostra fino a 12 immagini, in ordine alfabetico/numerico. La foto home preferisce un nome che inizi con `chi-sono`, altrimenti usa la prima immagine.

Sono inclusi i formati immagine riconosciuti da Drive, compresi HEIC: il sito prova a usare l'anteprima generata da Drive, perché i browser non visualizzano direttamente tutti i formati. Per ogni foto Drive deve poter creare un'anteprima. Mantieni i nomi delle sottocartelle come indicati; i nomi dei file invece sono liberi. Se Drive non è raggiungibile, il sito usa le foto locali di `foto/`.

## Installazione come app
Il manifest e il service worker sono nella radice; le icone sono in `assets/icons/`. La guida per gli utenti è in `view/installa.html`.
