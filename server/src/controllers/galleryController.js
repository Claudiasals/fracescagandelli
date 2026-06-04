import cloudinary from "../config/cloudinary.js";
import GalleryPhoto from "../models/galleryPhotoModel.js";
import Category from "../models/categoryModel.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function validateSlug(slug) {
  if (!slug || typeof slug !== "string") return false;
  const s = slug.trim();
  return s.length > 0 && s.length < 120 && slugPattern.test(s);
}

function normalizeCaption(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, 500);
}

function normalizeGalleryDescription(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, 3000);
}

export const getGalleryController = async (req, res) => {
  try {
    const raw = req.params.slug;
    if (!validateSlug(raw)) {
      return res.status(400).json({ message: "Slug non valido" });
    }
    const slug = raw.trim();
    const photos = await GalleryPhoto.find({ categorySlug: slug }).sort({ order: 1 }).lean();
    const category = await Category.findOne({ slug }).lean();
    const title = category?.title || slug.replace(/-/g, " ");
    const description =
      typeof category?.description === "string" ? category.description.trim() : "";
    res.status(200).json({
      slug,
      title,
      categoryId: category?._id?.toString() ?? null,
      description,
      photos,
    });
  } catch (error) {
    console.error("Errore get gallery:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const patchGalleryDescriptionController = async (req, res) => {
  try {
    const raw = req.params.slug;
    if (!validateSlug(raw)) {
      return res.status(400).json({ message: "Slug non valido" });
    }
    const slug = raw.trim();
    const description = normalizeGalleryDescription(req.body?.description);

    const doc = await Category.findOneAndUpdate(
      { slug },
      { $set: { description } },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ message: "Categoria non trovata" });
    }

    res.status(200).json({
      slug: doc.slug,
      description: doc.description?.trim() ?? "",
    });
  } catch (error) {
    console.error("Errore patch gallery description:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const addGalleryPhotoController = async (req, res) => {
  try {
    const raw = req.params.slug;
    if (!validateSlug(raw)) {
      return res.status(400).json({ message: "Slug non valido" });
    }
    const slug = raw.trim();
    if (!req.file) {
      return res.status(400).json({ message: "Immagine obbligatoria" });
    }

    const maxOrder = await GalleryPhoto.findOne({ categorySlug: slug }).sort({ order: -1 }).select("order").lean();
    const order = maxOrder ? maxOrder.order + 1 : 0;
    const publicId = `g_${slug}_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      { folder: `portfolio_gallery/${slug}`, public_id: publicId },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Errore caricamento Cloudinary", error });
        }
        try {
          const caption = normalizeCaption(req.body.caption);
          const doc = await GalleryPhoto.create({
            categorySlug: slug,
            imageUrl: result.secure_url,
            order,
            caption,
          });
          res.status(201).json(doc.toObject());
        } catch (e) {
          console.error(e);
          res.status(500).json({ message: "Errore salvataggio foto" });
        }
      }
    );
    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Errore add gallery photo:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const reorderGalleryController = async (req, res) => {
  try {
    const raw = req.params.slug;
    if (!validateSlug(raw)) {
      return res.status(400).json({ message: "Slug non valido" });
    }
    const slug = raw.trim();
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array ids richiesto" });
    }

    const bulk = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, categorySlug: slug },
        update: { $set: { order: index } },
      },
    }));

    await GalleryPhoto.bulkWrite(bulk);
    const photos = await GalleryPhoto.find({ categorySlug: slug }).sort({ order: 1 }).lean();
    res.status(200).json({ photos });
  } catch (error) {
    console.error("Errore reorder gallery:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const patchGalleryPhotoController = async (req, res) => {
  try {
    const raw = req.params.slug;
    const { photoId } = req.params;
    if (!validateSlug(raw) || !photoId) {
      return res.status(400).json({ message: "Parametri non validi" });
    }
    const slug = raw.trim();
    const caption = normalizeCaption(req.body?.caption);

    const doc = await GalleryPhoto.findOneAndUpdate(
      { _id: photoId, categorySlug: slug },
      { $set: { caption } },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ message: "Foto non trovata" });
    }
    res.status(200).json(doc);
  } catch (error) {
    console.error("Errore patch gallery photo:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/** Sostituisce solo il file immagine (stesso documento, stesso ordine nella griglia). */
export const putGalleryPhotoImageController = async (req, res) => {
  try {
    const raw = req.params.slug;
    const { photoId } = req.params;
    if (!validateSlug(raw) || !photoId) {
      return res.status(400).json({ message: "Parametri non validi" });
    }
    const slug = raw.trim();
    if (!req.file) {
      return res.status(400).json({ message: "Seleziona un file immagine" });
    }

    const doc = await GalleryPhoto.findOne({ _id: photoId, categorySlug: slug });
    if (!doc) {
      return res.status(404).json({ message: "Foto non trovata" });
    }

    const publicId = `g_${slug}_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      { folder: `portfolio_gallery/${slug}`, public_id: publicId },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Errore caricamento Cloudinary", error });
        }
        try {
          doc.imageUrl = result.secure_url;
          await doc.save();
          res.status(200).json(doc.toObject());
        } catch (e) {
          console.error(e);
          res.status(500).json({ message: "Errore salvataggio" });
        }
      }
    );
    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Errore replace gallery image:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const deleteGalleryPhotoController = async (req, res) => {
  try {
    const raw = req.params.slug;
    const { photoId } = req.params;
    if (!validateSlug(raw) || !photoId) {
      return res.status(400).json({ message: "Parametri non validi" });
    }
    const slug = raw.trim();
    const deleted = await GalleryPhoto.findOneAndDelete({ _id: photoId, categorySlug: slug });
    if (!deleted) {
      return res.status(404).json({ message: "Foto non trovata" });
    }
    const photos = await GalleryPhoto.find({ categorySlug: slug }).sort({ order: 1 }).lean();
    res.status(200).json({ photos });
  } catch (error) {
    console.error("Errore delete gallery photo:", error);
    res.status(500).json({ message: "Errore server" });
  }
};
