const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async ({ fullName, age, weight, email, password }) => {
    const exists = await User.findOne({ email });
    if (exists) throw new Error("Email already exists");

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      password: hash,
      age,
      weight,
    });

    return user;
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  },
};

//d
