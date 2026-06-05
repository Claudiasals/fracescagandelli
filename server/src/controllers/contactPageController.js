import ContactPage from "../models/contactPageModel.js";
import { CONTACT_FORM_LEAD, CONTACT_INTRO } from "../content/siteCopy.js";

export const DEFAULT_CONTACT_INTRO = CONTACT_INTRO;
export const DEFAULT_CONTACT_FORM_LEAD = CONTACT_FORM_LEAD;

/** Mantiene gli a capo; su ogni riga collassa solo gli spazi multipli. */
const normalizePreLineText = (text) =>
  typeof text === "string"
    ? text
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .join("\n")
        .trim()
    : text;

const normalizeInlineText = (text) =>
  typeof text === "string" ? text.replace(/\s+/g, " ").trim() : text;

export const getContactPageController = async (req, res) => {
  try {
    const doc = await ContactPage.findOne();
    if (!doc) {
      return res.status(200).json({
        introText: DEFAULT_CONTACT_INTRO,
        formLeadText: DEFAULT_CONTACT_FORM_LEAD,
      });
    }
    res.status(200).json({
      introText: normalizePreLineText(
        doc.introText?.trim() ? doc.introText.trim() : DEFAULT_CONTACT_INTRO
      ),
      formLeadText: normalizeInlineText(
        doc.formLeadText?.trim() ? doc.formLeadText.trim() : DEFAULT_CONTACT_FORM_LEAD
      ),
    });
  } catch (error) {
    console.error("Errore get contact page:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const updateContactPageTextController = async (req, res) => {
  try {
    const { introText, formLeadText } = req.body;
    if (typeof introText !== "string" || typeof formLeadText !== "string") {
      return res.status(400).json({ message: "Campi introText e formLeadText (stringhe) richiesti" });
    }

    let doc = await ContactPage.findOne();
    if (!doc) {
      doc = new ContactPage({
        introText: normalizePreLineText(introText),
        formLeadText: normalizeInlineText(formLeadText),
      });
    } else {
      doc.introText = normalizePreLineText(introText);
      doc.formLeadText = normalizeInlineText(formLeadText);
    }
    await doc.save();
    res.status(200).json({
      message: "Contenuti aggiornati",
      introText: doc.introText,
      formLeadText: doc.formLeadText,
    });
  } catch (error) {
    console.error("Errore update contact page:", error);
    res.status(500).json({ message: "Errore server" });
  }
};
