const express = require("express");
const cors = require("cors");
const authRouters = require("./routes/authRoutes");
const userRouters = require("./routes/userRoutes");
const aiRouters = require("./routes/aiRoutes");
const journalRouters = require("./routes/journalRoutes");
const cookieParser = require("cookie-parser");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,               
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouters);
app.use("/api/user", userRouters);
app.use("/api/ai", aiRouters);
app.use("/api/journals", journalRouters);

module.exports = app;
