const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/register/verify-otp", authController.verifyRegisterOtp);
router.post("/register/resend-otp", authController.resendRegisterOtp);

router.post("/forgot-password", authController.forgotPassword);
router.post("/forgot-password/verify-otp", authController.verifyForgotOtp);
router.post("/forgot-password/reset", authController.resetForgotPassword);

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;