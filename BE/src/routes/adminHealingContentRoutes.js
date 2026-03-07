const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const adminHealingContentController = require("../controllers/adminHealingContentController");

// Inline requireAdmin middleware as requested (no new file)
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

router.use(authMiddleware);
router.use(requireAdmin);

// Routes
router.get("/", adminHealingContentController.getAllHealingContent);
router.post("/", uploadMiddleware.single("video"), adminHealingContentController.createHealingContent);
router.put("/:id", uploadMiddleware.single("video"), adminHealingContentController.updateHealingContent);
router.delete("/:id", adminHealingContentController.deleteHealingContent);

module.exports = router;
