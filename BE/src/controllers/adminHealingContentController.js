const HealingQuote = require("../models/HealingQuote");
const HealingVideo = require("../models/HealingVideo");
const HealingPodcast = require("../models/HealingPodcast");
const cloudinaryService = require("../services/cloudinaryService");

const getModelByType = (type) => {
    switch (type) {
        case 'quote': return HealingQuote;
        case 'video': return HealingVideo;
        case 'podcast': return HealingPodcast;
        default: return null;
    }
};

exports.getAllHealingContent = async (req, res) => {
    try {
        const { type } = req.query;
        let content = [];
        if (type) {
            const Model = getModelByType(type);
            if (!Model) return res.status(400).json({ message: "Invalid type" });
            content = await Model.find().sort({ createdAt: -1 }).populate("createdBy", "fullName email");
        } else {
            const quotes = await HealingQuote.find().sort({ createdAt: -1 }).populate("createdBy", "fullName email");
            const videos = await HealingVideo.find().sort({ createdAt: -1 }).populate("createdBy", "fullName email");
            const podcasts = await HealingPodcast.find().sort({ createdAt: -1 }).populate("createdBy", "fullName email");
            content = [...quotes, ...videos, ...podcasts].sort((a, b) => b.createdAt - a.createdAt);
        }

        res.status(200).json(content);
    } catch (error) {
        console.error("Error fetching healing content from separated tables:", error);
        res.status(500).json({ message: "Server error fetching healing content" });
    }
};

exports.createHealingContent = async (req, res) => {
    try {
        const { title, description, author, type, content, thumbnail, moodLevel, is_active } = req.body;
        let videoUrl = null;

        const Model = getModelByType(type);
        if (!Model) return res.status(400).json({ message: "Invalid content type. Must be 'quote', 'video', or 'podcast'." });

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required." });
        }

        if (type === "video") {
            if (!req.file) {
                return res.status(400).json({ message: "A video file is required for exercise (video) content." });
            }
            try {
                videoUrl = await cloudinaryService.uploadVideoToCloudinary(req.file);
            } catch (uploadErr) {
                console.error("Cloudinary upload failed (video):", uploadErr);
                return res.status(500).json({ message: "Failed to upload video to cloud storage. Please try again." });
            }
        }

        if (type === "podcast") {
            if (!req.file) {
                return res.status(400).json({ message: "A video file is required for podcast content." });
            }
            try {
                videoUrl = await cloudinaryService.uploadPodcastToCloudinary(req.file);
            } catch (uploadErr) {
                console.error("Cloudinary upload failed (podcast):", uploadErr);
                return res.status(500).json({ message: "Failed to upload podcast video to cloud storage. Please try again." });
            }
        }

        let parsedMetadata = {};
        if (req.body.metadata) {
            try {
                parsedMetadata = JSON.parse(req.body.metadata);
            } catch (err) {
                parsedMetadata = typeof req.body.metadata === 'object' ? req.body.metadata : {};
            }
        }

        const newContent = new Model({
            title,
            description,
            author,
            type,
            content,
            videoUrl,
            thumbnail,
            moodLevel: moodLevel || 3,
            metadata: Object.keys(parsedMetadata).length > 0 ? parsedMetadata : undefined,
            is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : true,
            createdBy: req.userId,
        });

        await newContent.save();
        res.status(201).json(newContent);
    } catch (error) {
        console.error("Error creating healing content:", error);
        res.status(500).json({ message: error.message || "Server error while creating healing content." });
    }
};

exports.updateHealingContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, author, type, content, thumbnail, moodLevel, is_active } = req.body;

        let existingContent = null;
        let Model = null;

        if (type) {
            Model = getModelByType(type);
            if (Model) existingContent = await Model.findById(id);
        } else {
            existingContent = await HealingQuote.findById(id);
            if (existingContent) Model = HealingQuote;
            else {
                existingContent = await HealingVideo.findById(id);
                if (existingContent) Model = HealingVideo;
                else {
                    existingContent = await HealingPodcast.findById(id);
                    if (existingContent) Model = HealingPodcast;
                }
            }
        }

        if (!existingContent || !Model) {
            return res.status(404).json({ message: "Healing content not found" });
        }

        let videoUrl = existingContent.videoUrl;
        const removeVideo = req.body.removeVideo === 'true';

        // Delete old video/podcast file if replacing or removing
        if ((existingContent.type === "video" || existingContent.type === "podcast") && videoUrl) {
            if (req.file || removeVideo) {
                await cloudinaryService.deleteResourceByUrl(videoUrl, "video");
                videoUrl = null;
            }
        }

        // Upload new file if provided
        if (req.file) {
            try {
                if (existingContent.type === "video" || req.body.type === "video") {
                    videoUrl = await cloudinaryService.uploadVideoToCloudinary(req.file);
                } else if (existingContent.type === "podcast" || req.body.type === "podcast") {
                    videoUrl = await cloudinaryService.uploadPodcastToCloudinary(req.file);
                }
            } catch (uploadErr) {
                console.error("Cloudinary upload failed (update):", uploadErr);
                return res.status(500).json({ message: "Failed to upload video to cloud storage. Please try again." });
            }
        }

        let parsedMetadata = {};
        if (req.body.metadata) {
            try {
                parsedMetadata = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata;
            } catch (err) {
                console.error("Failed to parse metadata", err);
            }
        }

        existingContent.title = title || existingContent.title;
        existingContent.description = description !== undefined ? description : existingContent.description;
        existingContent.author = author !== undefined ? author : existingContent.author;
        existingContent.content = content !== undefined ? content : existingContent.content;
        existingContent.thumbnail = thumbnail !== undefined ? thumbnail : existingContent.thumbnail;
        existingContent.moodLevel = moodLevel !== undefined ? moodLevel : existingContent.moodLevel;
        if (Object.keys(parsedMetadata).length > 0) {
            existingContent.metadata = parsedMetadata;
        }
        if (is_active !== undefined) {
            existingContent.is_active = (is_active === 'true' || is_active === true);
        }
        existingContent.videoUrl = videoUrl;

        await existingContent.save();
        res.status(200).json(existingContent);
    } catch (error) {
        console.error("Error updating healing content:", error);
        res.status(500).json({ message: error.message || "Server error while updating healing content." });
    }
};

exports.deleteHealingContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        let deletedContent = null;
        if (type) {
            const Model = getModelByType(type);
            if (Model) deletedContent = await Model.findByIdAndDelete(id);
        } else {
            deletedContent = await HealingQuote.findByIdAndDelete(id)
                || await HealingVideo.findByIdAndDelete(id)
                || await HealingPodcast.findByIdAndDelete(id);
        }

        if (!deletedContent) {
            return res.status(404).json({ message: "Healing content not found" });
        }

        if ((deletedContent.type === "video" || deletedContent.type === "podcast") && deletedContent.videoUrl) {
            await cloudinaryService.deleteResourceByUrl(deletedContent.videoUrl, "video");
        }

        res.status(200).json({ message: "Healing content deleted successfully" });
    } catch (error) {
        console.error("Error deleting healing content:", error);
        res.status(500).json({ message: "Server error deleting healing content" });
    }
};
