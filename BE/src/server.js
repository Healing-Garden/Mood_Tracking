require("dotenv").config();
const { server } = require("./app");
const connectDB = require("./config/db");
const { initSchedulers } = require("./utils/scheduler");

connectDB();
initSchedulers();

require('./services/scheduler');

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
