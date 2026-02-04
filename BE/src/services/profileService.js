const User = require("../models/users");
const cloudinary = require("../config/cloudinary");

const DEFAULT_AVATAR_URL =
  process.env.DEFAULT_AVATAR_URL ||
  "https://i.pinimg.com/originals/bc/43/98/bc439871417621836a0eeea768d60944.jpg";

const normalizeAvatarUrl = (url) => {
  if (typeof url !== "string") return DEFAULT_AVATAR_URL;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_AVATAR_URL;
  if (!/^https?:\/\//i.test(trimmed)) return DEFAULT_AVATAR_URL;
  return trimmed;
};

const applyDefaultAvatar = (user) => {
  if (user) {
    user.avatarUrl = normalizeAvatarUrl(user.avatarUrl);
  }
  return user;
};

const isCloudinaryUrl = (url) =>
  typeof url === "string" && url.includes("res.cloudinary.com");

const extractCloudinaryPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const { pathname } = new URL(url);
    const marker = "/upload/";
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;
    const path = pathname.slice(idx + marker.length);
    const parts = path.split("/");
    const versionIndex = parts.findIndex((p) => /^v\d+$/.test(p));
    const publicIdParts =
      versionIndex === -1 ? parts : parts.slice(versionIndex + 1);
    if (!publicIdParts.length) return null;
    const withExt = publicIdParts.join("/");
    return withExt.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

module.exports = {
  getProfile: async (userId) => {
    const user = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) throw new Error("User not found");
    return applyDefaultAvatar(user);
  },

  updateProfile: async (userId, updateData) => {
    const allowedFields = [
      "fullName",
      "age",
      "weight",
      "heightCm",
      "dateOfBirth",
      "healthGoals",
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) throw new Error("User not found");
    return applyDefaultAvatar(user);
  },

  uploadAvatar: async (userId, file) => {
    if (!file) throw new Error("No file provided");

    try {
      const user = await User.findById(userId).select("avatarUrl");
      if (!user) throw new Error("User not found");

      const safeFileName = (file.originalname || "avatar")
        .replace(/\s+/g, "_")
        .replace(/[()]/g, "")
        .replace(/[^a-zA-Z0-9_.-]/g, "");

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "avatars",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: `${Date.now()}_${safeFileName || "avatar"}`,
        max_bytes: 5242880,
      });

      const previousAvatarUrl = normalizeAvatarUrl(user.avatarUrl);
      if (
        previousAvatarUrl &&
        previousAvatarUrl !== DEFAULT_AVATAR_URL &&
        previousAvatarUrl !== result.secure_url
      ) {
        const publicId = extractCloudinaryPublicId(previousAvatarUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, {
              resource_type: "image",
            });
          } catch (error) {
            console.error("Delete old avatar failed:", error.message);
          }
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatarUrl: result.secure_url },
        { new: true }
      ).select("-password -resetPasswordToken -resetPasswordExpires");

      return {
        user: applyDefaultAvatar(updatedUser),
        imageUrl: result.secure_url,
      };
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  },

  deleteAvatar: async (userId) => {
    const user = await User.findById(userId).select("avatarUrl");
    if (!user) throw new Error("User not found");

    const currentAvatarUrl = normalizeAvatarUrl(user.avatarUrl);
    if (currentAvatarUrl && currentAvatarUrl !== DEFAULT_AVATAR_URL) {
      const publicId = extractCloudinaryPublicId(currentAvatarUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
        } catch (error) {
          console.error("Delete avatar failed:", error.message);
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: DEFAULT_AVATAR_URL },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    return applyDefaultAvatar(updatedUser);
  },

  updatePassword: async (userId, currentPassword, newPassword) => {
    const bcrypt = require("bcrypt");
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new Error("Current password is incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: "Password updated successfully" };
  },

  setAppLockPin: async (userId, pin) => {
    const bcrypt = require("bcrypt");
    const pinHash = await bcrypt.hash(pin, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        appLockPinHash: pinHash,
        appLockEnabled: true,
      },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) throw new Error("User not found");
    return user;
  },
};
