const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const googleAuthService = require("./googleAuthService");

const DEFAULT_AVATAR_URL =
  process.env.DEFAULT_AVATAR_URL ||
  "https://i.pinimg.com/originals/bc/43/98/bc439871417621836a0eeea768d60944.jpg";

const isDefaultAvatar = (url) => {
  if (!url) return true;
  return url.trim() === DEFAULT_AVATAR_URL;
};

const issueJwt = (user) => {
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
};

module.exports = {
  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");
    if (user.accountStatus === "banned") throw new Error("Account is banned");

    if (!user.password) {
      throw new Error("Please set password before using email login");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    return issueJwt(user);
  },

  googleLogin: async (accessToken) => {
    const payload = await googleAuthService.verifyGoogleAccessToken(
      accessToken
    );

    const { email, name, picture, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      throw new Error("Google email not verified");
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        avatarUrl: picture,
        googleId,
        authProvider: "google",
        role: "user",
        accountStatus: "active",
        password: null,
      });

      return issueJwt(user);
    }

    if (user.authProvider === "local") {
      user.googleId = googleId;
      user.authProvider = "both";
      if (isDefaultAvatar(user.avatarUrl)) user.avatarUrl = picture;
      await user.save();

      return issueJwt(user);
    }

    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "both";
      if (isDefaultAvatar(user.avatarUrl)) user.avatarUrl = picture;
      await user.save();
    } else if (isDefaultAvatar(user.avatarUrl)) {
      user.avatarUrl = picture;
      await user.save();
    }

    return issueJwt(user);
  },

  linkGoogleAccount: async ({ email, password, googleId, avatarUrl }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    user.googleId = googleId;
    user.authProvider = "both";
    if (isDefaultAvatar(user.avatarUrl)) user.avatarUrl = avatarUrl;

    await user.save();
    return issueJwt(user);
  },

  setPassword: async (userId, newPassword) => {
    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { _id: userId },
      { password: hash, authProvider: "both" }
    );
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
};
