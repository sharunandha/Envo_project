export const getColorByRiskLevel = (level) => {
  const colors = {
    LOW: '#10b981',     // green
    MEDIUM: '#f59e0b',  // amber
    HIGH: '#ef4444',    // red
  };
  return colors[level] || '#6b7280'; // gray default
};

export const getColorByRiskScore = (score) => {
  if (score >= 70) return '#ef4444';   // red
  if (score >= 40) return '#f59e0b';   // amber
  return '#10b981';                     // green
};

export const formatNumber = (num) => {
  return num.toFixed(2);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

export const calculateTrend = (current, previous) => {
  if (current > previous) return 'increasing';
  if (current < previous) return 'decreasing';
  return 'stable';
};

export const getRiskDescription = (level) => {
  const descriptions = {
    LOW: 'Low risk, conditions are normal',
    MEDIUM: 'Moderate risk, continue monitoring',
    HIGH: 'High risk, take precautionary measures',
  };
  return descriptions[level] || 'Unknown';
};

export const getStateFromCoordinates = (latitude, longitude) => {
  // Simplified mapping - in production, use reverse geocoding
  if (latitude > 28 && longitude < 77) return 'Delhi';
  if (latitude > 23 && longitude < 72) return 'Gujarat';
  if (latitude < 15 && longitude > 73) return 'Kerala';
  return 'India';
};

export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};
