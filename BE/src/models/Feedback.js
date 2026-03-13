const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    type: {
        type: String,
        enum: ['feature', 'bug', 'content_rating'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },
    admin_response: {
        type: String,
        default: ''
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
