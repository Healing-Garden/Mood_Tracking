const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

// All routes below require authenticated user
router.use(authMiddleware);

// Profile routes
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);
router.delete("/avatar", userController.removeAvatar);
router.post("/change-password", userController.changePassword);
router.get("/admin/recovery-codes", userController.getAdminRecoveryCodes);
router.post("/admin/recovery-codes/download", userController.downloadAdminRecoveryCodes);

// Onboarding preferences
router.get("/onboarding/status", userController.getOnboardingStatus);
router.get("/onboarding", userController.getOnboardingPreferences);
router.post("/onboarding", userController.saveOnboardingPreferences);

// Daily check-ins
router.get("/checkins/today", userController.getTodayCheckIn);
router.post("/checkins", userController.saveDailyCheckIn);
router.get("/checkins/flow", userController.getMoodFlow);

// Analytics
router.get("/analytics/trigger-heatmap", userController.getTriggerHeatmap);
router.get("/analytics/word-cloud", userController.getWordCloud);
router.get("/analytics/summary", userController.getAnalyticsSummary);
router.get("/analytics/mood-history", userController.getMoodHistory);

// Dashboard
router.get("/dashboard/data", userController.getDashboardData);

module.exports = router;


