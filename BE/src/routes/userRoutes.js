const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

// All routes below require authenticated user
router.use(authMiddleware);

// Onboarding preferences
router.get("/onboarding/status", userController.getOnboardingStatus);
router.get("/onboarding", userController.getOnboardingPreferences);
router.post("/onboarding", userController.saveOnboardingPreferences);

// Daily check-ins
router.get("/checkins/today", userController.getTodayCheckIn);
router.post("/checkins", userController.saveDailyCheckIn);

module.exports = router;

