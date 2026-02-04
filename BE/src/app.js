const express = require("express");
const cors = require("cors");
const authRouters = require("./routes/authRoutes");
const profileRouters = require("./routes/profileRoutes");
const cookieParser = require("cookie-parser");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Vite default
    credentials: true,               // cho phép cookie
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouters);
app.use("/api/profile", profileRouters);

module.exports = app;
