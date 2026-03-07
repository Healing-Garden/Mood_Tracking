const express = require("express");
const http = require('http');
const cors = require("cors");
const socketIo = require('socket.io');
const authRouters = require("./routes/authRoutes");
const userRouters = require("./routes/userRoutes");
const journalRouters = require("./routes/journalRoutes");
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRouters = require('./routes/feedbackRoutes');
const notificationSettingRoutes = require('./routes/notificationSettingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aggregatedInsightRoutes = require('./routes/aggregatedInsightRoutes');
const chatHandler = require('./socket/chatHandler');
const socketManager = require('./socketManager');
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});
socketManager.init(io);

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: clientURL, credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouters);
app.use("/api/user", userRouters);
app.use("/api/journals", journalRouters);

app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRouters);
app.use('/api/notifications/settings', notificationSettingRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/admin', aggregatedInsightRoutes);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  chatHandler(io, socket);
});

module.exports = { app, server, io };
