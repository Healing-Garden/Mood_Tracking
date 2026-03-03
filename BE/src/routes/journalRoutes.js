const router = require("express").Router();
const journalController = require("../controllers/journalController");
const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", upload.array("files"), journalController.create);
router.get("/", journalController.getAll);
router.get("/deleted", journalController.getDeleted);
router.get("/search", journalController.search);

router.put("/:id", journalController.update);
router.delete("/:id", journalController.delete);
router.patch("/:id/restore", journalController.restore);
router.delete("/:id/permanent", journalController.permanentDelete);

module.exports = router;
