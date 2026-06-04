import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    link: { type: String, required: true },
    order: { type: Number, default: 0 },
    /** Categorie temporanee per demo video — rimuovibili con npm run remove-demo-categories */
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema, "categories");
