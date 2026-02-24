const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: {
    type: String,
    enum: ['active', 'ended', 'interrupted', 'crisis'],
    default: 'active'
  },
  currentState: {
    type: String,
    enum: ['initial', 'assessment', 'intervention', 'closure'],
    default: 'initial'
  },
  riskLevel: { type: Number, min: 0, max: 10, default: 0 },
  cbtTechniquesUsed: [{ type: String }],
  sessionSummary: String,
  moodContext: { type: mongoose.Schema.Types.Mixed }, 
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);