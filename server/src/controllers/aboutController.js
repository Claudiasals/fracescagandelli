import cloudinary from "../config/cloudinary.js";
import About from "../models/aboutModel.js";

/** Testo iniziale se il documento non esiste ancora (stesso contenuto della prima versione statica). */
export const DEFAULT_ABOUT_TEXT = `Sono una fotografa Freelancer che vive nel mondo, ma più precisamente a Milano.

Amo la natura e la naturalezza, attraverso i miei scatti racconto storie ed emozioni. Ti aiuto a mostrare la tua essenza e autenticità!

La mia profonda passione per la fotografia mi ha portato a perfezionarmi in autonomia e a frequentare numerosi corsi specializzati, affinando costantemente le mie competenze.

Mi occupo di fotografia di famiglia, ritratti, storytelling e personal branding, trasformando ogni scatto in un ricordo speciale o in un racconto visivo.`;

export const getAboutController = async (req, res) => {
  try {
    const doc = await About.findOne();
    if (!doc) {
      return res.status(200).json({
        text: DEFAULT_ABOUT_TEXT,
        images: [],
      });
    }
    res.status(200).json({
      text: doc.text?.trim() ? doc.text : DEFAULT_ABOUT_TEXT,
      images: doc.images || [],
    });
  } catch (error) {
    console.error("Errore get about:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const updateAboutTextController = async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ message: "Campo text richiesto" });
    }

    let doc = await About.findOne();
    if (!doc) {
      doc = new About({ text, images: [] });
    } else {
      doc.text = text;
    }
    await doc.save();
    res.status(200).json({ message: "Testo aggiornato", text: doc.text });
  } catch (error) {
    console.error("Errore update about text:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const addAboutImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nessun file caricato" });
    }

    const publicId = `about_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "about_page",
        public_id: publicId,
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Errore caricamento Cloudinary", error });
        }

        let doc = await About.findOne();
        if (!doc) {
          doc = new About({ text: DEFAULT_ABOUT_TEXT, images: [result.secure_url] });
        } else {
          doc.images = [result.secure_url];
        }
        await doc.save();
        res.status(200).json({
          message: "Immagine aggiornata",
          images: doc.images,
        });
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Errore add about image:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const deleteAboutImageController = async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    if (Number.isNaN(index) || index < 0) {
      return res.status(400).json({ message: "Indice non valido" });
    }

    const doc = await About.findOne();
    if (!doc || !doc.images || index >= doc.images.length) {
      return res.status(404).json({ message: "Immagine non trovata" });
    }

    doc.images.splice(index, 1);
    await doc.save();
    res.status(200).json({ message: "Immagine rimossa", images: doc.images });
  } catch (error) {
    console.error("Errore delete about image:", error);
    res.status(500).json({ message: "Errore server" });
  }
};
