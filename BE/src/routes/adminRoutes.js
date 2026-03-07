const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

router.get("/users", adminController.getUsers);
router.patch("/users/:id/ban", adminController.banUser);
router.patch("/users/:id/unban", adminController.unbanUser);

module.exports = router;
