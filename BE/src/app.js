const express = require("express");
const cors = require("cors");
const authRouters = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouters);

module.exports = app;