import express from "express";
import {
  loginAdmin,
  getDashboard,
  changePasswordController,
  requestPasswordResetController,
  verifyPasswordOtpController,
  resetPasswordWithTokenController,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/forgot-password/request", requestPasswordResetController);
router.post("/forgot-password/verify-otp", verifyPasswordOtpController);
router.post("/forgot-password/reset", resetPasswordWithTokenController);
router.put("/password", authMiddleware, changePasswordController);

export default router;
