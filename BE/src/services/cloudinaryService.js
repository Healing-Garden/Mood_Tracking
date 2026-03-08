const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

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
                use_filename: true,
                unique_filename: true,
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
 * Deletes a resource from Cloudinary given its URL.
 *
 * @param {string} url - The URL of the resource on Cloudinary
 * @param {string} resourceType - The type of resource ('image', 'video', 'raw')
 * @returns {Promise<any>}
 */
const deleteResourceByUrl = async (url, resourceType = "image") => {
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
            cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
                if (error) {
                    console.error(`Cloudinary delete error (${resourceType}):`, error);
                    return resolve(false);
                }
                resolve(result);
            });
        });
    } catch (err) {
        console.error("Error extracting public ID from URL", err);
    }
};

/**
 * Uploads an image file buffer to Cloudinary using upload_stream.
 *
 * @param {Object} file - The file object from multer containing the buffer
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.buffer) {
            return reject(new Error("No file buffer provided"));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "avatars",
                resource_type: "image",
                use_filename: true,
                unique_filename: true,
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

module.exports = {
    uploadVideoToCloudinary,
    uploadImageToCloudinary,
    deleteResourceByUrl,
};
