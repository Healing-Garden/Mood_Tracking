function getTimeOfDay(hour) {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function isTimeMatch(currentTime, timeSlot) {
  return currentTime === timeSlot; 
}

module.exports = { getTimeOfDay, isTimeMatch };