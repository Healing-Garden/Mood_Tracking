const ChatSession = require('../models/chatSession');
const Message = require('../models/Message');
const mongoose = require('mongoose');

class ChatController {
  async getUserSessions(req, res) {
    try {
      const { userId } = req.params;
      const sessions = await ChatSession.find({ userId })
        .sort({ startTime: -1 })
        .limit(20)
        .lean();
      res.json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSessionDetail(req, res) {
    try {
      const { sessionId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, error: 'Invalid session ID' });
      }
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      const messages = await Message.find({ sessionId: session._id }).sort({ timestamp: 1 }).lean();
      res.json({ success: true, data: { session, messages } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSessionMessages(req, res) {
    try {
      const { sessionId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, error: 'Invalid session ID' });
      }
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      const messages = await Message.find({ sessionId: session._id })
        .sort({ timestamp: 1 })
        .lean();
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, error: 'Invalid session ID' });
      }
      const session = await ChatSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      await ChatSession.findByIdAndDelete(sessionId);
      await Message.deleteMany({ sessionId: session._id });
      res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async saveJournalNote(req, res) {
    try {
      const { sessionId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, error: 'Invalid session ID' });
      }
      const { note } = req.body;
      const session = await ChatSession.findByIdAndUpdate(sessionId, { sessionSummary: note }, { new: true });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      res.json({ success: true, message: 'Journal note saved' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ChatController();