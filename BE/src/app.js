const express = require("express");
const http = require('http');
const cors = require("cors");
const socketIo = require('socket.io');
const authRouters = require("./routes/authRoutes");
const userRouters = require("./routes/userRoutes");
const journalRouters = require("./routes/journalRoutes");
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRouters = require('./routes/feedbackRoutes');
const notificationSettingRoutes = require('./routes/notificationSettingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aggregatedInsightRoutes = require('./routes/aggregatedInsightRoutes');
const adminHealingContentRoutes = require('./routes/adminHealingContentRoutes');
const chatHandler = require('./socket/chatHandler');
const socketManager = require('./socketManager');
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        callback("CORS error");
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});
socketManager.init(io);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouters);
app.use("/api/user", userRouters);
app.use("/api/journals", journalRouters);

app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRouters);
app.use('/api/notifications/settings', notificationSettingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/admin/healing-content", adminHealingContentRoutes);

app.use('/api/admin', aggregatedInsightRoutes);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  chatHandler(io, socket);
});

module.exports = { app, server, io };

