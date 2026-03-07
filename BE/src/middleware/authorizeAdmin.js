const User = require('../models/users');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('role');
    if (user && user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Admin access required' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};