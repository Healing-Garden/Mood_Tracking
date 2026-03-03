const chatService = require('../services/chatService');
const mongoose = require('mongoose');

module.exports = (io, socket) => {
  let currentSessionId = null;
  let currentUserId = null;

  socket.on('join-chat', async ({ userId, moodContext, sessionId }) => {
    try {
      let session;
      if (sessionId) {
        // Load existing session
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
          socket.emit('error', { message: 'Invalid session ID' });
          return;
        }
        session = await chatService.getSession(sessionId);
        if (!session || session.userId !== userId) {
          socket.emit('error', { message: 'Session not found or unauthorized' });
          return;
        }
        currentSessionId = session._id.toString();
        currentUserId = userId;
        socket.join(currentSessionId);
        
        // Load existing messages via getRecentMessages (frontend will load via API)
        const messages = await chatService.getRecentMessages(session._id.toString(), 100);
        socket.emit('session_loaded', { sessionId: currentSessionId, messages });
      } else {
        // Create new session
        session = await chatService.createSession(userId, moodContext);
        currentSessionId = session._id.toString();
        currentUserId = userId;
        socket.join(currentSessionId);

        const welcomeMsg = {
          sender: 'bot',
          text: "👋 I'm here to listen. What's on your mind right now?",
          timestamp: new Date()
        };
        await chatService.saveMessage(currentSessionId, 'bot', welcomeMsg.text);
        socket.emit('session_created', { sessionId: currentSessionId });
        socket.emit('message', welcomeMsg);
      }
    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('error', { message: 'Failed to start chat session' });
    }
  });

  socket.on('send-message', async ({ text }) => {
    if (!currentSessionId) {
      socket.emit('error', { message: 'No active session' });
      return;
    }

    try {
      await chatService.saveMessage(currentSessionId, 'user', text);

      const aiResponse = await chatService.processAndRespond(
        currentSessionId,
        currentUserId,
        text
      );

      socket.emit('message', {
        sender: 'bot',
        text: aiResponse.text,
        timestamp: new Date(),
        technique: aiResponse.technique,
        exercise: aiResponse.exercise,
        isCrisis: aiResponse.isCrisis
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('end-chat', async ({ summary }) => {
    if (currentSessionId) {
      await chatService.endSession(currentSessionId, summary);
      socket.leave(currentSessionId);
      currentSessionId = null;
      currentUserId = null;
    }
  });

  socket.on('disconnect', async () => {
    if (currentSessionId) {
      await chatService.endSession(currentSessionId, 'Session ended due to disconnect');
      currentSessionId = null;
      currentUserId = null;
    }
  });
};