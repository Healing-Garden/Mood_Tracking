const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    require("fs").mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.use(authMiddleware);

router.get("/", profileController.getProfile);
router.put("/", profileController.updateProfile);
router.post("/avatar", upload.single("avatar"), profileController.uploadAvatar);
router.delete("/avatar", profileController.deleteAvatar);
router.post("/change-password", profileController.changePassword);
router.post("/set-pin", profileController.setAppLockPin);

module.exports = router;
