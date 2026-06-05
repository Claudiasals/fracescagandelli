import About from "../models/aboutModel.js";
import ContactPage from "../models/contactPageModel.js";
import SiteSettings from "../models/siteSettingsModel.js";
import {
  ABOUT_TEXT,
  CONTACT_FORM_LEAD,
  CONTACT_INTRO,
  INSTAGRAM_URL,
  PAGE_CONTENT_VERSION,
  PUBLIC_EMAIL,
} from "./siteCopy.js";

export async function syncPageContent() {
  let about = await About.findOne();
  if (!about) {
    about = new About({ text: ABOUT_TEXT, images: [] });
  } else {
    about.text = ABOUT_TEXT;
  }
  await about.save();

  let contact = await ContactPage.findOne();
  if (!contact) {
    contact = new ContactPage({
      introText: CONTACT_INTRO,
      formLeadText: CONTACT_FORM_LEAD,
    });
  } else {
    contact.introText = CONTACT_INTRO;
    contact.formLeadText = CONTACT_FORM_LEAD;
  }
  await contact.save();

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = new SiteSettings({
      publicEmail: PUBLIC_EMAIL,
      instagramUrl: INSTAGRAM_URL,
      pageContentVersion: PAGE_CONTENT_VERSION,
    });
  } else {
    settings.publicEmail = PUBLIC_EMAIL;
    settings.instagramUrl = INSTAGRAM_URL;
    settings.pageContentVersion = PAGE_CONTENT_VERSION;
  }
  await settings.save();
}

/** Aggiorna i testi ufficiali una sola volta per versione (es. dopo deploy). */
export async function syncPageContentIfNeeded() {
  const settings = await SiteSettings.findOne();
  const current = settings?.pageContentVersion ?? 0;
  if (current >= PAGE_CONTENT_VERSION) return;

  await syncPageContent();
  console.log(`Testi pagina sincronizzati (v${PAGE_CONTENT_VERSION}).`);
}
