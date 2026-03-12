require("dotenv").config();
const { server } = require("./app");
const connectDB = require("./config/db");
const { initSchedulers } = require("./utils/scheduler");

connectDB();
initSchedulers();

require('./services/scheduler');

const PORT = process.env.PORT || 8080;
const serverInstance = server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Increase timeout for large file uploads (10 minutes)
serverInstance.timeout = 600000; 
serverInstance.keepAliveTimeout = 600000;
