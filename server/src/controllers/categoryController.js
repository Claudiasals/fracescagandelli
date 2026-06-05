import cloudinary from "../config/cloudinary.js";
import Category from "../models/categoryModel.js";

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function linkForSlug(slug) {
  return `/gallery/${slug}`;
}

const SEED = [
  {
    title: "Famiglia",
    description: "Momenti in famiglia",
    slug: "family",
    link: "/gallery/family",
    order: 0,
    imageUrl: "",
  },
  {
    title: "Ritratti",
    description: "Scatti professionali",
    slug: "portrait",
    link: "/gallery/portrait",
    order: 1,
    imageUrl: "",
  },
  {
    title: "Storytelling",
    description: "Dove l'artigiano incontra la natura",
    slug: "storytelling",
    link: "/gallery/storytelling",
    order: 2,
    imageUrl: "",
  },
  {
    title: "Personal Branding",
    description: "Immagini per il tuo brand",
    slug: "personal-branding",
    link: "/gallery/personal-branding",
    order: 3,
    imageUrl: "",
  },
];

/** Categorie temporanee per video demo (immagini in client/public/demo-categories). */
const DEMO_CATEGORIES = [
  {
    title: "Mani che tendono l'arco",
    description: "",
    slug: "demo-mani-che-tendono-l-arco",
    imageUrl: "/demo-categories/demo-arco.png",
  },
  {
    title: "Il rosso del raccolto",
    description: "",
    slug: "demo-il-rosso-del-raccolto",
    imageUrl: "/demo-categories/demo-raccolto.png",
  },
  {
    title: "Sulla linea del mare",
    description: "",
    slug: "demo-sulla-linea-del-mare",
    imageUrl: "/demo-categories/demo-mare.png",
  },
];

async function ensureSeed() {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(SEED);
  }
}

async function ensureDemoCategories() {
  const maxOrderDoc = await Category.findOne().sort({ order: -1 }).select("order").lean();
  let nextOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 0;

  for (const demo of DEMO_CATEGORIES) {
    const exists = await Category.findOne({ slug: demo.slug }).lean();
    if (exists) continue;

    await Category.create({
      title: demo.title,
      description: demo.description,
      imageUrl: demo.imageUrl,
      slug: demo.slug,
      link: linkForSlug(demo.slug),
      order: nextOrder++,
      isDemo: true,
    });
  }
}

async function ensureCanonicalLinks() {
  const categories = await Category.find().select("slug link").lean();
  await Promise.all(
    categories
      .filter((cat) => cat.link !== linkForSlug(cat.slug))
      .map((cat) =>
        Category.updateOne({ _id: cat._id }, { link: linkForSlug(cat.slug) })
      )
  );
}

export const getCategoriesController = async (req, res) => {
  try {
    await ensureSeed();
    await ensureDemoCategories();
    await ensureCanonicalLinks();
    const categories = await Category.find().sort({ order: 1 }).lean();
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Errore get categories:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

async function uniqueSlug(base) {
  let slug = base || "categoria";
  let n = 0;
  while (await Category.findOne({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export const createCategoryController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Immagine obbligatoria" });
    }

    const title = (req.body.title || "").trim();
    const description = (req.body.description || "").trim();
    let slugInput = (req.body.slug || "").trim();

    if (!title) {
      return res.status(400).json({ message: "Titolo obbligatorio" });
    }

    let slug = slugInput ? slugify(slugInput) : slugify(title);
    if (!slug) slug = "categoria";
    slug = await uniqueSlug(slug);

    const maxOrder = await Category.findOne().sort({ order: -1 }).select("order").lean();
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const publicId = `cat_${slug}_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      { folder: "portfolio_categories", public_id: publicId },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Errore caricamento Cloudinary", error });
        }

        try {
          const doc = await Category.create({
            title,
            description,
            imageUrl: result.secure_url,
            slug,
            link: linkForSlug(slug),
            order,
          });
          res.status(201).json(doc.toObject());
        } catch (e) {
          console.error(e);
          res.status(500).json({ message: "Errore salvataggio categoria" });
        }
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Errore create category:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const reorderCategoriesController = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array ids richiesto" });
    }

    const bulk = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await Category.bulkWrite(bulk);
    const categories = await Category.find().sort({ order: 1 }).lean();
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Errore reorder:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Category.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Categoria non trovata" });
    }

    const title = req.body.title !== undefined ? String(req.body.title).trim() : doc.title;
    const description =
      req.body.description !== undefined ? String(req.body.description).trim() : doc.description;

    doc.title = title;
    doc.description = description;

    if (!req.file) {
      await doc.save();
      return res.status(200).json(doc.toObject());
    }

    const publicId = `cat_${doc.slug}_${Date.now()}`;
    const stream = cloudinary.uploader.upload_stream(
      { folder: "portfolio_categories", public_id: publicId },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Errore caricamento Cloudinary", error });
        }
        doc.imageUrl = result.secure_url;
        await doc.save();
        res.status(200).json(doc.toObject());
      }
    );
    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Errore update category:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Category.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ message: "Deve restare almeno una categoria" });
    }
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Categoria non trovata" });
    }
    const categories = await Category.find().sort({ order: 1 }).lean();
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Errore delete category:", error);
    res.status(500).json({ message: "Errore server" });
  }
};
