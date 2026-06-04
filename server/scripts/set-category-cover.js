/**
 * Imposta la copertina di una categoria da file locale.
 * Uso: cd server && node scripts/set-category-cover.js [slug-o-titolo]
 * Default: reale — immagine in client/public/demo-categories/reale.png
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cloudinary from "../src/config/cloudinary.js";
import Category from "../src/models/categoryModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lookup = (process.argv[2] || "reale").trim();
const imagePath = path.resolve(__dirname, "../../client/public/demo-categories/reale.png");

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI mancante in server/.env");
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`Immagine non trovata: ${imagePath}`);
  process.exit(1);
}

await mongoose.connect(uri);

const escaped = lookup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cat = await Category.findOne({
  $or: [
    { slug: lookup },
    { slug: new RegExp(`^${escaped}$`, "i") },
    { title: new RegExp(`^${escaped}$`, "i") },
  ],
});

if (!cat) {
  console.error(`Categoria non trovata per "${lookup}". Slug/titoli in DB:`);
  const all = await Category.find().select("title slug").lean();
  for (const c of all) console.error(`  - ${c.title} (${c.slug})`);
  await mongoose.disconnect();
  process.exit(1);
}

let imageUrl = `/demo-categories/reale.png`;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: "portfolio_categories",
    public_id: `cat_${cat.slug}_cover_${Date.now()}`,
  });
  imageUrl = result.secure_url;
  console.log("Caricata su Cloudinary.");
} else {
  console.log("Cloudinary non configurato: uso URL locale (ok in dev con Vite).");
}

cat.imageUrl = imageUrl;
await cat.save();

console.log(`Copertina aggiornata per "${cat.title}" (${cat.slug}) → ${imageUrl}`);
await mongoose.disconnect();
