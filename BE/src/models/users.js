const moogoose = require("mongoose");

const userSchema = new moogoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, enum: ["user", "admin"], default: "user" }
}, {timestamps: true});

module.exports = moogoose.model("User", userSchema);