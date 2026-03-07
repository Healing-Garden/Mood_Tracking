const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary explicitly if not already done in the main app,
// though normally it relies on process.env.CLOUDINARY_URL or explicit config.
// Assuming your environment variables are set correctly:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a video file buffer to Cloudinary using upload_stream.
 *
 * @param {Object} file - The file object from multer containing the buffer
 * @returns {Promise<string>} - The secure URL of the uploaded video
 */
const uploadVideoToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.buffer) {
            return reject(new Error("No file buffer provided"));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "healing_videos",
                resource_type: "video",
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
};

/**
 * Deletes a video from Cloudinary given its URL.
 *
 * @param {string} url - The URL of the video on Cloudinary
 * @returns {Promise<any>}
 */
const deleteVideoByUrl = async (url) => {
    if (!url) return;

    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return;

        let startIndex = uploadIndex + 1;
        if (parts[startIndex].match(/^v\d+$/)) {
            startIndex++;
        }

        const fileWithExt = parts.slice(startIndex).join('/');
        const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.')) || fileWithExt;

        return new Promise((resolve) => {
            cloudinary.uploader.destroy(publicId, { resource_type: "video" }, (error, result) => {
                if (error) {
                    console.error("Cloudinary delete error:", error);
                    return resolve(false); // resolve false instead of rejecting to prevent crashes on missing file
                }
                resolve(result);
            });
        });
    } catch (err) {
        console.error("Error extracting public ID from URL", err);
    }
};

module.exports = {
    uploadVideoToCloudinary,
    deleteVideoByUrl,
};
