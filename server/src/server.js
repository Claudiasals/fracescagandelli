// Express il framework per creare il server HTTP
import express from "express";
// dotenv per leggere le variabili d'ambiente dal file .env
import dotenv from "dotenv";
// funzione per connetterci a MongoDB (db.js)
import connectDB from "./config/db.js";
import { syncPageContentIfNeeded } from "./content/syncPageContent.js";
// importo le rotte per l'autenticazione
import authRoutes from "./routes/authRoute.js";
// importo CORS per permettere richieste cross-origin
import cors from "cors";
import aboutRoutes from "./routes/aboutRoute.js";
import contactPageRoutes from "./routes/contactPageRoute.js";
import categoryRoutes from "./routes/categoryRoute.js";
import galleryRoutes from "./routes/galleryRoute.js";
import siteSettingsRoutes from "./routes/siteSettingsRoute.js";
import legalPagesRoutes from "./routes/legalPagesRoute.js";
import SiteSettings from "./models/siteSettingsModel.js";
import { DEFAULT_PUBLIC_EMAIL } from "./controllers/siteSettingsController.js";
// libreria email x form  
import nodemailer from "nodemailer";  


// Carico le variabili d'ambiente presenti nel file .env
dotenv.config();


// Creo l'istanza dell'app Express
const app = express();


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* TEST FORM EMAIL:
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP non valido:", error);
  } else {
    console.log("✅ SMTP pronto a inviare email");
  }
}); */
 


// Configurazione CORS: sviluppo locale + frontend pubblicato su Netlify.
const allowedOrigins = [
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "https://francescagandelli.netlify.app",
];

const localNetworkOrigin =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function corsOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production" && localNetworkOrigin.test(origin)) {
    return true;
  }
  return false;
}

// Middleware CORS per Express
app.use(
  cors({
    origin(origin, callback) {
      if (corsOriginAllowed(origin)) return callback(null, true);
      return callback(new Error(`La richiesta da ${origin} non è permessa!`), false);
    },
    credentials: true,
  })
);
/*
origin → è il dominio che sta facendo la richiesta (es. http://localhost:5173).
callback → è una funzione che chiami per dire “ok, questa origine è permessa” oppure “no, blocca”.
*/


// Middleware per leggere automaticamente il JSON presente 
// nel body delle richieste (utile per POST, PUT, PATCH)
app.use(express.json());

// Collegamento delle rotte auth
app.use("/api/auth", authRoutes);


// Rotta di test per verificare che il server funzioni
app.get("/", (req, res) => {
  res.send("Server Francesca Gandelli Portfolio OK");
});

// Chi Sono: testo e galleria immagini (GET pubblico, PUT/POST/DELETE admin)
app.use("/api", aboutRoutes);
app.use("/api", contactPageRoutes);
app.use("/api", legalPagesRoutes);

// Categorie home (card portfolio)
app.use("/api/categories", categoryRoutes);

// Foto per categoria (gallerie /family, /portrait, /gallery/:slug, …)
app.use("/api/gallery", galleryRoutes);
app.use("/api", siteSettingsRoutes);

// Rotta per il form di contatto
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      status: "error",
      message: "Tutti i campi sono obbligatori"
    });
  }

  try {
    const settings = await SiteSettings.findOne();
    const toEmail =
      settings?.publicEmail?.trim() ||
      process.env.CONTACT_MAIL_TO?.trim() ||
      DEFAULT_PUBLIC_EMAIL;

    await transporter.sendMail({
      from: email,
      to: toEmail,
      subject: `Messaggio da ${name}`,
      text: message,
    });

    res.json({ status: "ok", message: "Messaggio inviato!" });
  } catch (err) {
    console.error("Errore invio email:", err);
    res.status(500).json({
      status: "error",
      message: "Errore nell'invio del messaggio"
    });
  }
});



// Funzione asincrona per avviare il server solo dopo che il DB è connesso
const startServer = async () => {
  try {
    // Aspetta la connessione al database
    await connectDB();
    await syncPageContentIfNeeded();
    console.log("Database connesso correttamente!"); // Stampa messaggio se va tutto bene

    // porta su cui il server ascolterà le richieste
    // Usa PORT dal .env oppure fallback a 5000 se non definita
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || "0.0.0.0";

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    // Se c'è un errore nella connessione al DB, stampa l'errore
    console.error("Errore avvio server:", error);

    // Blocca l'esecuzione del server se il database non è disponibile
    process.exit(1);
  }
};

// Chiamiamo la funzione per far partire il server
startServer();
