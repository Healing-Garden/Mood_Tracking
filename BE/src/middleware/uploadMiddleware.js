const multer = require("multer");

const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2 GB
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
    },
});

module.exports = upload;
