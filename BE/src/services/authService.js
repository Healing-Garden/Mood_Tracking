const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const googleAuthService = require("./googleAuthService");
const { applyDefaultAvatar } = require("./userService");

const issueJwt = (user) => {
  const finalUser = applyDefaultAvatar(user);
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
      role: finalUser.role,
      avatarUrl: finalUser.avatarUrl,
    },
  };
};

// Check if user is banned and handle auto-unban if duration has passed
const checkBannedStatus = async (user) => {
  if (user.accountStatus === "banned" || user.isBanned) {
    // If there is an expiration date
    if (user.banExpiresAt) {
      if (new Date() > user.banExpiresAt) {
        // Ban expired, auto-unban
        user.isBanned = false;
        user.accountStatus = "active";
        user.banExpiresAt = null;
        user.banReason = "";
        await user.save();
        return; // proceed with login
      } else {
        // Still banned
        const error = new Error("Account is banned");
        error.isBanned = true;
        error.banExpiresAt = user.banExpiresAt;
        error.banReason = user.banReason;
        throw error;
      }
    } else {
      // Permanent ban (no expiration date)
      const error = new Error("Account is permanently banned");
      error.isBanned = true;
      error.banExpiresAt = null;
      error.banReason = user.banReason;
      throw error;
    }
  }
};

module.exports = {
  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    if (!user.password) {
      throw new Error("Please set password before using email login");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    await checkBannedStatus(user);

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
        googleAvatarUrl: picture,
        googleId,
        authProvider: "google",
        role: "user",
        accountStatus: "active",
        password: null,
      });

      return issueJwt(user);
    }

    await checkBannedStatus(user);

    if (user.authProvider === "local") {
      user.googleId = googleId;
      user.authProvider = "both";
      if (!user.avatarUrl) user.avatarUrl = picture;
      user.googleAvatarUrl = picture;
      await user.save();

      return issueJwt(user);
    }

    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "both";
      if (!user.avatarUrl) user.avatarUrl = picture;
      user.googleAvatarUrl = picture;
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
    if (!user.avatarUrl) user.avatarUrl = avatarUrl;
    user.googleAvatarUrl = avatarUrl;

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
