const { extractPublicId, isImageReferenced } = require("./src/services/imageService");
const mongoose = require("mongoose");
require("dotenv").config();

const test = async () => {
    console.log("--- Testing extractPublicId ---");
    const urls = [
        "https://res.cloudinary.com/difg4vgbw/image/upload/v1741251934/f22zthst3nd52hscet1d.jpg",
        "https://res.cloudinary.com/difg4vgbw/video/upload/v1741251934/voice_note.webm",
        "https://res.cloudinary.com/difg4vgbw/image/upload/f_auto,q_auto/v1/journal_unsigned/uocmptovq5kghk0zptia"
    ];

    urls.forEach(url => {
        console.log(`URL: ${url}`);
        console.log(`Public ID: ${extractPublicId(url)}`);
    });

    console.log("\n--- Testing Reference Counting (Requires DB) ---");
    // Only run if MONGO_URI is available
    if (process.env.MONGO_URI) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("Connected to DB");

            const testUrl = "https://res.cloudinary.com/difg4vgbw/image/upload/v1741251934/f22zthst3nd52hscet1d.jpg";
            const referenced = await isImageReferenced(testUrl);
            console.log(`Is '${testUrl}' referenced? ${referenced}`);

            await mongoose.disconnect();
        } catch (err) {
            console.error("DB check failed:", err.message);
        }
    } else {
        console.log("Skip DB check (MONGO_URI not set)");
    }
};

test();
