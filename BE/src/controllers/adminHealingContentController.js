const HealingContent = require("../models/HealingContent");
const cloudinaryService = require("../services/cloudinaryService");

exports.getAllHealingContent = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = type ? { type } : {};

        // Sort by newest first
        const content = await HealingContent.find(filter)
            .sort({ createdAt: -1 })
            .populate("createdBy", "fullName email"); // Optional: populate admin details

        res.status(200).json(content);
    } catch (error) {
        console.error("Error heavily fetching healing content:", error);
        res.status(500).json({ message: "Server error fetching healing content" });
    }
};

exports.createHealingContent = async (req, res) => {
    try {
        const { title, description, type, content, thumbnail } = req.body;
        let videoUrl = null;

        if (type === "video") {
            if (!req.file) {
                return res.status(400).json({ message: "Video file is required for video type content" });
            }
            // Upload video to Cloudinary
            videoUrl = await cloudinaryService.uploadVideoToCloudinary(req.file);
        }

        const newContent = new HealingContent({
            title,
            description,
            type,
            content,
            videoUrl,
            thumbnail,
            createdBy: req.userId,
        });

        await newContent.save();
        res.status(201).json(newContent);
    } catch (error) {
        console.error("Error creating healing content:", error);
        res.status(500).json({ message: "Server error creating healing content" });
    }
};

exports.updateHealingContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content, thumbnail } = req.body;

        const existingContent = await HealingContent.findById(id);
        if (!existingContent) {
            return res.status(404).json({ message: "Healing content not found" });
        }

        let videoUrl = existingContent.videoUrl;
        const removeVideo = req.body.removeVideo === 'true';

        // Delete old video if replacing it OR explicitly removing it
        if (existingContent.type === "video" && videoUrl) {
            if (req.file || removeVideo) {
                await cloudinaryService.deleteResourceByUrl(videoUrl, "video");
                videoUrl = null;
            }
        }

        // Output new Cloudinary URL if a new file is uploaded
        if (req.body.type === "video" || existingContent.type === "video") {
            if (req.file) {
                videoUrl = await cloudinaryService.uploadVideoToCloudinary(req.file);
            }
        }

        existingContent.title = title || existingContent.title;
        existingContent.description = description !== undefined ? description : existingContent.description;
        existingContent.content = content !== undefined ? content : existingContent.content;
        existingContent.thumbnail = thumbnail !== undefined ? thumbnail : existingContent.thumbnail;
        existingContent.videoUrl = videoUrl;

        await existingContent.save();
        res.status(200).json(existingContent);
    } catch (error) {
        console.error("Error updating healing content:", error);
        res.status(500).json({ message: "Server error updating healing content" });
    }
};

exports.deleteHealingContent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContent = await HealingContent.findByIdAndDelete(id);

        if (!deletedContent) {
            return res.status(404).json({ message: "Healing content not found" });
        }

        if (deletedContent.type === "video" && deletedContent.videoUrl) {
            await cloudinaryService.deleteResourceByUrl(deletedContent.videoUrl, "video");
        }

        res.status(200).json({ message: "Healing content deleted successfully" });
    } catch (error) {
        console.error("Error deleting healing content:", error);
        res.status(500).json({ message: "Server error deleting healing content" });
    }
};
