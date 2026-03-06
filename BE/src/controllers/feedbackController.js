const Feedback = require('../models/Feedback');

const feedbackController = {
    /**
     * UC-41: Submit new feedback
     */
    async submitFeedback(req, res) {
        try {
            const { type, subject, message, rating } = req.body;
            const userId = req.user?.id || req.body.user_id; // Support both auth middleware and direct body for flexibility

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User identification required'
                });
            }

            if (!type || !subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: type, subject, and message are required'
                });
            }

            const newFeedback = new Feedback({
                user_id: userId,
                type,
                subject,
                message,
                rating,
                status: 'pending'
            });

            await newFeedback.save();

            res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                data: newFeedback
            });
        } catch (error) {
            console.error('Submit feedback error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    /**
     * Get feedback history for current user
     */
    async getMyFeedback(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const feedbacks = await Feedback.find({ user_id: userId }).sort({ created_at: -1 });

            res.json({
                success: true,
                data: feedbacks
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = feedbackController;
