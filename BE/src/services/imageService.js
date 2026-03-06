const cloudinary = require("../config/cloudinary");
const Journal = require("../models/journalEntries");

const extractPublicId = (url) => {
    if (!url) return null;

    try {
        const parts = url.split("/");
        const lastPart = parts[parts.length - 1];

        const publicIdWithVersion = lastPart.split(".")[0];

        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex !== -1) {
            let startIndex = uploadIndex + 1;
            if (parts[startIndex].startsWith("v") && /^\d+$/.test(parts[startIndex].substring(1))) {
                startIndex++;
            }

            const publicIdParts = parts.slice(startIndex);
            const fileName = publicIdParts[publicIdParts.length - 1];
            publicIdParts[publicIdParts.length - 1] = fileName.split(".")[0];
            return publicIdParts.join("/");
        }

        return publicIdWithVersion;
    } catch (error) {
        console.error("Failed to extract public ID from URL:", url, error);
        return null;
    }
};
const isImageReferenced = async (url) => {
    const count = await Journal.countDocuments({
        $or: [
            { images: url },
            { voice_note_url: url }
        ]
    });
    return count > 0;
};

const deleteImageIfUnused = async (url) => {
    if (!url || !url.includes("cloudinary.com")) return;

    const referenced = await isImageReferenced(url);
    if (referenced) {
        console.log(`Image still referenced, skipping Cloudinary deletion: ${url}`);
        return;
    }

    const publicId = extractPublicId(url);
    if (!publicId) return;

    try {
        const resourceType = url.includes("/video/upload") || url.includes("/raw/upload") ? "video" : "image";
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`Cloudinary deletion attempt for ${publicId}:`, result);
    } catch (error) {
        console.error(`Failed to delete image from Cloudinary: ${publicId}`, error);
    }
};

module.exports = {
    extractPublicId,
    isImageReferenced,
    deleteImageIfUnused,
};
