const ChatSession = require('../models/chatSession');
const Message = require('../models/Message');
const aiService = require('./aiService');

class ChatService {
  async createSession(userId, moodContext = null) {
    const session = await ChatSession.create({
      userId,
      startTime: new Date(),
      status: 'active',
      moodContext
    });
    return session;
  }

  async endSession(sessionId, summary = '') {
    const session = await ChatSession.findByIdAndUpdate(
      sessionId,
      { status: 'ended', endTime: new Date(), sessionSummary: summary },
      { new: true }
    );
    return session;
  }

  async getSession(sessionId) {
    return ChatSession.findById(sessionId);
  }

  async saveMessage(sessionId, sender, text, analysis = {}) {
     if (!text || text.trim() === '') {
      console.warn('Skipping empty message save');
      return null;
    }
    
    const mongoose = require('mongoose');
    const sessionIdObj = mongoose.Types.ObjectId.isValid(sessionId) 
      ? new mongoose.Types.ObjectId(sessionId)
      : sessionId;
    
    const message = await Message.create({
      sessionId: sessionIdObj,
      sender,
      text: text.trim(),
      sentiment: analysis?.sentiment?.sentiment || null,
      score: analysis?.sentiment?.score || null,
      confidence: analysis?.sentiment?.confidence || null,
      intent: analysis?.intent || null,
      cbtTechnique: analysis?.technique || null,
      exercise: analysis?.exercise || null,
      isCrisis: analysis?.isCrisis || false
    });

    return message;
  }

  async getSessionState(sessionId) {
    const session = await ChatSession.findById(sessionId);
    if (!session) throw new Error('Session not found');
    return {
      state: session.currentState,
      riskLevel: session.riskLevel,
      techniquesUsed: session.cbtTechniquesUsed
    };
  }

  async updateSessionState(sessionId, updates) {
    await ChatSession.findByIdAndUpdate(sessionId, updates);
  }

  async getRecentMessages(sessionId, limit = 5) {
    const mongoose = require('mongoose');
    const query = mongoose.Types.ObjectId.isValid(sessionId) 
      ? { sessionId: new mongoose.Types.ObjectId(sessionId) }
      : { sessionId };
    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();
    return messages;
  }

  async getUserContext(userId) {
    try {
      const DailyCheckin = require('../models/dailyCheckIn');
      
      const recentCheckins = await DailyCheckin.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const recentMoods = recentCheckins.map(c => ({
        mood: c.mood,
        energy: c.energyLevel,
        timestamp: c.createdAt
      }));

      return { userId, recentMoods };
    } catch (error) {
      console.log('DailyCheckin model not found or error, using empty context');
      return { userId, recentMoods: [] };
    }
  }

  async processAndRespond(sessionId, userId, userText) {
    const sessionState = await this.getSessionState(sessionId);
    
    const userContext = await this.getUserContext(userId);
    
    const recentMessages = await this.getRecentMessages(sessionId, 5);
    const formattedRecent = recentMessages.map(m => ({
      sender: m.sender,
      text: m.text
    }));

    const aiResult = await aiService.processChatMessage(
      sessionId,
      userText,
      sessionState,
      userContext,
      formattedRecent
    );

    if (!aiResult.success) {
      throw new Error(aiResult.error);
    }

    const aiData = aiResult.data;

    await this.saveMessage(sessionId, 'bot', aiData.text, {
      sentiment: aiData.sentiment,
      intent: aiData.intent,
      technique: aiData.technique,
      exercise: aiData.exercise,
      isCrisis: aiData.isCrisis
    });

    await this.updateSessionState(sessionId, {
      currentState: aiData.next_state,
      riskLevel: aiData.risk_level,
      $addToSet: { cbtTechniquesUsed: aiData.technique }
    });

    return aiData;
  }
}

module.exports = new ChatService();