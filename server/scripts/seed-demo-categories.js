/**
 * Inserisce le 3 categorie demo (se mancano) con copertina su Cloudinary o URL locale.
 * Uso: cd server && node scripts/seed-demo-categories.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cloudinary from "../src/config/cloudinary.js";
import Category from "../src/models/categoryModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../client/public/demo-categories");

const DEMO_CATEGORIES = [
  {
    title: "Mani che tendono l'arco",
    slug: "demo-mani-che-tendono-l-arco",
    file: "demo-arco.png",
  },
  {
    title: "Il rosso del raccolto",
    slug: "demo-il-rosso-del-raccolto",
    file: "demo-raccolto.png",
  },
  {
    title: "Sulla linea del mare",
    slug: "demo-sulla-linea-del-mare",
    file: "demo-mare.png",
  },
];

function linkForSlug(slug) {
  return `/gallery/${slug}`;
}

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

async function resolveImageUrl(slug, file) {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File mancante: ${filePath}`);
  }
  if (hasCloudinary) {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "portfolio_categories",
      public_id: `cat_${slug}_${Date.now()}`,
    });
    return result.secure_url;
  }
  return `/demo-categories/${file}`;
}

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI mancante in server/.env");
  process.exit(1);
}

await mongoose.connect(uri);

const maxOrderDoc = await Category.findOne().sort({ order: -1 }).select("order").lean();
let nextOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 0;

for (const demo of DEMO_CATEGORIES) {
  const exists = await Category.findOne({ slug: demo.slug }).lean();
  if (exists) {
    console.log(`Già presente: ${demo.title}`);
    continue;
  }

  const imageUrl = await resolveImageUrl(demo.slug, demo.file);
  await Category.create({
    title: demo.title,
    description: "",
    imageUrl,
    slug: demo.slug,
    link: linkForSlug(demo.slug),
    order: nextOrder++,
    isDemo: true,
  });
  console.log(`Aggiunta: ${demo.title} → ${imageUrl}`);
}

const all = await Category.find().sort({ order: 1 }).select("title slug isDemo").lean();
console.log("\nCategorie in DB:", all.length);
for (const c of all) console.log(`  ${c.isDemo ? "[demo]" : "      "} ${c.title} (${c.slug})`);

await mongoose.disconnect();
