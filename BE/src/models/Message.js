const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
  sentiment: {
    sentiment: String,
    score: Number,
    confidence: Number,
    emotions: [Object]
  },
  intent: String,
  cbtTechnique: String,
  exercise: String,
  isCrisis: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);