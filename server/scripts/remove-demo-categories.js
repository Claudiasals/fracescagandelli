/**
 * Rimuove le categorie demo (isDemo: true) e le foto galleria collegate.
 * Uso: cd server && node scripts/remove-demo-categories.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import Category from "../src/models/categoryModel.js";
import GalleryPhoto from "../src/models/galleryPhotoModel.js";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI mancante in .env");
  process.exit(1);
}

await mongoose.connect(uri);

const demoCats = await Category.find({ isDemo: true }).lean();
const slugs = demoCats.map((c) => c.slug);

if (slugs.length === 0) {
  console.log("Nessuna categoria demo da rimuovere.");
  await mongoose.disconnect();
  process.exit(0);
}

const photos = await GalleryPhoto.deleteMany({ categorySlug: { $in: slugs } });
const cats = await Category.deleteMany({ isDemo: true });

console.log(`Rimosse ${cats.deletedCount} categorie demo e ${photos.deletedCount} foto collegate.`);
await mongoose.disconnect();
