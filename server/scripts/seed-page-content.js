/**
 * Imposta i testi ufficiali Chi sono / Contatti (e email Instagram) in MongoDB.
 * Uso: cd server && npm run seed-page-content
 */
import "dotenv/config";
import mongoose from "mongoose";
import { syncPageContent } from "../src/content/syncPageContent.js";

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI mancante in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  await syncPageContent();
  console.log("✓ about, contact_page e site settings aggiornati");
  await mongoose.disconnect();
  console.log("Fatto.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
