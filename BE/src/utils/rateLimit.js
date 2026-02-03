const limits = new Map();

exports.checkRateLimit = (key, seconds = 60) => {
  const now = Date.now();
  if (limits.get(key) > now) return false;
  limits.set(key, now + seconds * 1000);
  return true;
};
