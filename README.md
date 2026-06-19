# Portfolio Francesca Gandelli

Portfolio fotografico full-stack per Francesca Gandelli, con sito pubblico, gallerie dinamiche e area admin per gestire contenuti, immagini, contatti e pagine legali.

Il progetto e diviso in due parti:

- `client`: frontend React/Vite pubblicato su Netlify
- `server`: backend Node.js/Express pubblicato su Render

## Presentazione progetto

Sito portfolio fotografico con **area admin integrata**: il fotografo gestisce categorie, gallerie, testi e impostazioni senza toccare il codice. Il backend salva dati su **MongoDB Atlas** e immagini su **Cloudinary**; frontend su Netlify, API su Render.

**Identità visiva** — Palette (bianco, nero, grigi), tipografia (Bodoni Moda, Cormorant SC, TeX Gyre Heros), layout e impostazioni grafiche sono state scelte **unicamente dalla cliente**, che ha voluto il sito così com’è; lo sviluppo ha implementato quelle scelte senza modificarne lo stile.

**Video demo del gestionale** (registrazione delle funzioni admin principali; **audio disponibile** — attiva l’audio dal player):

https://github.com/Claudiasals/francescagandelli/raw/main/docs/francescagandelli-demo.mp4

Se il player non compare: [scarica o apri il video](https://github.com/Claudiasals/francescagandelli/raw/main/docs/francescagandelli-demo.mp4).

In locale puoi aprire anche [docs/PROGETTO.html](docs/PROGETTO.html) nel browser (stessa spiegazione e video a schermo intero).

### Area admin — funzioni principali

**Accesso** — Pagina `/login` con username e password; sessione protetta da token JWT.

![Login admin](docs/readme/admin-login.png)

**Recupero password** — Sotto **Accedi**, link *Password dimenticata*: apre un modale in tre passaggi. L’email deve coincidere con quella configurata sull’account admin (campo `email` in MongoDB, email pubblica in impostazioni o variabile `ADMIN_RESET_EMAIL`). **Invio** dalla tastiera equivale a **conferma**.

1. **Email** — Inserisci l’indirizzo collegato all’account; alla conferma parte l’OTP via email (SMTP Gmail, variabili `EMAIL_USER` / `EMAIL_PASS`).

![Recupero password — email](docs/readme/admin-forgot-password-email.png)

2. **Codice OTP** — Inserisci il codice a 6 cifre ricevuto per email (validità 10 minuti, max 5 tentativi).

![Recupero password — OTP](docs/readme/admin-forgot-password-otp.png)

3. **Nuova password** — Scegli e conferma la nuova password; al salvataggio l’accesso avviene in automatico con JWT.

![Recupero password — nuova password](docs/readme/admin-forgot-password-new.png)

**Categorie in home** — Dalla sidebar: **aggiungi categoria** (nuova card con titolo e immagine), **riordina** (drag & drop), **elimina categoria** (modalità eliminazione sulle card). In creazione compaiono **annulla** e **salva** per confermare o abbandonare.

![Gestione categorie](docs/readme/admin-categories.png)

**Conferma eliminazione categoria** — Modale con titolo, messaggio di avviso e pulsanti **annulla** / **elimina categoria** (stesso stile anche per l’eliminazione foto in galleria).

![Modale elimina categoria](docs/readme/admin-delete-category-modal.png)

**Gallerie fotografiche** — In ogni categoria, dalla sidebar: **aggiungi foto**, **riordina** le immagini, **elimina foto** (pulsante rosso su ogni scatto in modalità eliminazione). Link **torna alle categorie** per tornare alla home admin.

![Azioni galleria](docs/readme/admin-gallery-actions.png)

**Testi modificabili** — Su Contatti, Chi sono e note legali compare l’indicazione *«clicca sul testo per modificarlo»*: basta cliccare un paragrafo per editarlo inline; il salvataggio avviene al blur. Stessa logica per intro contatti, recapiti visibili e testo sopra il form messaggi.

![Modifica testi contatti](docs/readme/admin-contact-edit.png)

## Preview

| Sito pubblico | Home admin (categorie) |
| --- | --- |
| ![Sito pubblico](docs/readme/public-home.png) | ![Home admin](docs/readme/admin-categories.png) |

| Galleria | Impostazioni |
| --- | --- |
| ![Galleria admin](docs/readme/admin-gallery-actions.png) | ![Impostazioni admin](docs/readme/admin-settings.png) |

## Funzionalita

- Home pubblica con copertina e categorie fotografiche
- Copertina modificabile dall'area admin
- Categorie fotografiche modificabili: titolo, descrizione, immagine, ordine, creazione ed eliminazione
- Gallerie dinamiche per categoria
- Foto di galleria gestibili da area admin: upload, eliminazione, riordino e sostituzione immagine
- Didascalie delle foto modificabili
- Testi della pagina "Chi sono" modificabili
- Testi della pagina "Contatti" modificabili
- Privacy Policy, Cookie Policy e Termini di Servizio modificabili dall'area admin
- Login amministratore con token JWT
- Recupero password via email con codice OTP e reimpostazione guidata
- Gestione email e Instagram dal pannello impostazioni
- Invio messaggi tramite form contatti
- Immagini salvate su Cloudinary
- Dati salvati su MongoDB Atlas

## Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Phosphor Icons

### Backend

- Node.js
- Express
- MongoDB Atlas con Mongoose
- JWT per autenticazione
- bcryptjs per password admin
- Multer per upload immagini
- Cloudinary per storage immagini
- Nodemailer per invio email

## Struttura progetto

```txt
francescagandelli/
  client/
    src/
      components/
      context/
      pages/
      config/
      constants/
      utils/
    public/
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
  docs/
    PROGETTO.html
    francescagandelli-demo.mp4
    GUIDA-ADMIN.md
```

## Setup locale

### 1. Clonare il repository

```bash
git clone https://github.com/Claudiasals/francescagandelli.git
cd francescagandelli
```

### 2. Installare le dipendenze del frontend

```bash
cd client
npm install
```

### 3. Installare le dipendenze del backend

```bash
cd ../server
npm install
```

## Variabili ambiente

### Frontend

Nel deploy Netlify configurare:

```env
VITE_API_URL=https://TUO-BACKEND.onrender.com/api
```

In locale, se non viene impostata `VITE_API_URL`, il frontend usa:

```txt
http://localhost:5000/api
```

### Backend

Creare un file `server/.env` con valori reali solo in locale o nel pannello Render:

```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
JWT_SECRET=una_chiave_lunga_e_segreta

CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret

EMAIL_USER=indirizzo_email_smtp
EMAIL_PASS=password_per_app_smtp
CONTACT_MAIL_TO=email_destinazione_opzionale
ADMIN_RESET_EMAIL=email_recupero_password_opzionale
```

Non committare mai file `.env`, password, secret, API key o connection string reali.

## Avvio in sviluppo

### Backend

```bash
cd server
npm run dev
```

Il backend parte su:

```txt
http://localhost:5000
```

### Frontend

In un secondo terminale:

```bash
cd client
npm run dev
```

Il frontend parte di solito su:

```txt
http://localhost:5173
```

## Build frontend

```bash
cd client
npm run build
```

Per vedere la build in locale:

```bash
npm run preview
```

## Deploy

### Frontend su Netlify

Impostazioni consigliate:

```txt
Base directory: client
Build command: npm install && npm run build
Publish directory: dist
```

Variabile ambiente richiesta:

```txt
VITE_API_URL=https://TUO-BACKEND.onrender.com/api
```

### Backend su Render

Impostazioni consigliate:

```txt
Root directory: server
Build command: npm install
Start command: npm start
```

Configurare su Render tutte le variabili ambiente del backend.

Se si usa il piano gratuito di Render, il servizio puo andare in sleep dopo un periodo di inattivita. Per ridurre il cold start si puo configurare un ping periodico con un servizio come cron-job.org.

## Area admin

L'area admin si raggiunge da:

```txt
/login
```

Dopo il login e possibile:

- modificare copertina e categorie in homepage
- aggiungere, eliminare e riordinare foto nelle gallerie
- modificare didascalie
- aggiornare testi delle pagine
- cambiare email, Instagram e password admin
- recuperare la password da `/login` se dimenticata (OTP via email)
- aggiornare pagine legali

## Servizi esterni necessari

- Netlify: hosting frontend
- Render: hosting backend
- MongoDB Atlas: database
- Cloudinary: immagini
- Gmail/SMTP: invio email dal form contatti
- cron-job.org: keep-alive opzionale per backend Render free

## Note sicurezza

- Non salvare credenziali nel repository
- Non condividere `JWT_SECRET`, `MONGO_URI`, `CLOUDINARY_API_SECRET` o `EMAIL_PASS`
- Usare una password per app per Gmail/SMTP
- Conservare gli accessi in un password manager

## Licenza

## Licenza

Il codice sorgente può essere riutilizzato, modificato e adattato per altri progetti secondo i termini della licenza MIT.

Foto, testi, immagini, logo, nome, brand e materiali relativi a Francesca Gandelli sono esclusi dalla licenza del codice e restano di proprietà dei rispettivi titolari. 
Non possono essere copiati, modificati, distribuiti o riutilizzati senza autorizzazione scritta.
