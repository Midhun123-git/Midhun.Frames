
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin,
  getMyProfile,
  updateMyProfile,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/userController");

const userProtect = require("../middleware/userMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

router.get("/me", userProtect, getMyProfile);
router.put("/me", userProtect, updateMyProfile);
router.put("/change-password", userProtect, changePassword);

module.exports = router;
