import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    /** Email pubblica (mailto, footer, moduli) e destinazione messaggi dal form */
    publicEmail: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    /** Versione testi Chi sono / Contatti applicata (sync automatico al deploy). */
    pageContentVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", siteSettingsSchema, "site_settings");
