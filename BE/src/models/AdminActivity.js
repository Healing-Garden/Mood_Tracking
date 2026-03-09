const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
  admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true 
  },
  target_type: { 
    type: String, 
    enum: ['user', 'content', 'system'], 
    required: true 
  },
  target_id: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

adminActivitySchema.index({ admin_id: 1, created_at: -1 });
adminActivitySchema.index({ action: 1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);