const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    if (user.accountStatus === "banned")
      throw new Error("Account is banned");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  },

  refreshToken: async (token) => {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const accessToken = jwt.sign(
      { id: payload.id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken };
  },

  resetPassword: async (email, newPassword) => {
    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hash });
  },
};
