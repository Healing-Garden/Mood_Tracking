const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a video file from disk to Cloudinary.
 *
 * @param {Object} file - The file object from multer containing the path
 * @returns {Promise<string>} - The secure URL of the uploaded video
 */
const uploadVideoToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.path) {
            return reject(new Error("No file path provided"));
        }

        cloudinary.uploader.upload(
            file.path,
            {
                folder: "healing_exercises",
                resource_type: "video",
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                // Always clean up the local file after upload attempt
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }

                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
    });
};

/**
 * Uploads a podcast video file from disk to Cloudinary.
 *
 * @param {Object} file - The file object from multer containing the path
 * @returns {Promise<string>} - The secure URL of the uploaded video
 */
const uploadPodcastToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.path) {
            return reject(new Error("No file path provided"));
        }

        cloudinary.uploader.upload(
            file.path,
            {
                folder: "healing_podcasts",
                resource_type: "video",
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                // Always clean up the local file after upload attempt
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }

                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
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
 * Uploads an image file to Cloudinary.
 * Supports both memory (file.buffer) and disk (file.path) storage.
 *
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            return reject(new Error("No file provided"));
        }

        // Handle disk storage (file.path)
        if (file.path) {
            cloudinary.uploader.upload(
                file.path,
                {
                    folder: "avatars",
                    resource_type: "image",
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    // Clean up local file
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(error);
                    }
                    resolve(result.secure_url);
                }
            );
            return;
        }

        // Handle memory storage (file.buffer)
        if (file.buffer) {
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
            return;
        }

        return reject(new Error("File object does not contain path or buffer"));
    });
};

module.exports = {
    uploadVideoToCloudinary,
    uploadPodcastToCloudinary,
    uploadImageToCloudinary,
    deleteResourceByUrl,
};
