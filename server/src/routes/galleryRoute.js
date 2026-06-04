import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";
import {
  getGalleryController,
  addGalleryPhotoController,
  reorderGalleryController,
  patchGalleryPhotoController,
  patchGalleryDescriptionController,
  putGalleryPhotoImageController,
  deleteGalleryPhotoController,
} from "../controllers/galleryController.js";

const router = express.Router();

router.get("/:slug", getGalleryController);
router.post("/:slug", authMiddleware, uploadMiddleware.single("photo"), addGalleryPhotoController);
router.put("/:slug/reorder", authMiddleware, reorderGalleryController);
router.patch("/:slug/description", authMiddleware, patchGalleryDescriptionController);
router.patch("/:slug/:photoId", authMiddleware, patchGalleryPhotoController);
router.put(
  "/:slug/:photoId",
  authMiddleware,
  uploadMiddleware.single("photo"),
  putGalleryPhotoImageController
);
router.delete("/:slug/:photoId", authMiddleware, deleteGalleryPhotoController);

export default router;
