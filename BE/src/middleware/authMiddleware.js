const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const secret =
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: "JWT access secret not configured" });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
