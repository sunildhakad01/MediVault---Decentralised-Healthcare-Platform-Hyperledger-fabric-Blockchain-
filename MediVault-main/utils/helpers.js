/**
 * Safely convert BigInt to Number for JavaScript operations
 * @param {BigInt|Number|String} value - The value to convert
 * @returns {Number} - Converted number
 */
export const safeNumberConversion = (value) => {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    return parseInt(value, 10);
  }
  return value || 0;
};

/**
 * Format timestamp (BigInt or Number) to readable date
 * @param {BigInt|Number} timestamp - Unix timestamp
 * @returns {String} - Formatted date string
 */
export const formatDate = (timestamp) => {
  const timeInMs = safeNumberConversion(timestamp) * 1000;
  return new Date(timeInMs).toLocaleDateString();
};

/**
 * Format timestamp (BigInt or Number) to readable time
 * @param {BigInt|Number} timestamp - Unix timestamp
 * @returns {String} - Formatted time string
 */
export const formatTime = (timestamp) => {
  const timeInMs = safeNumberConversion(timestamp) * 1000;
  return new Date(timeInMs).toLocaleTimeString();
};

/**
 * Format timestamp (BigInt or Number) to readable date and time
 * @param {BigInt|Number} timestamp - Unix timestamp
 * @returns {String} - Formatted date and time string
 */
export const formatDateTime = (timestamp) => {
  const timeInMs = safeNumberConversion(timestamp) * 1000;
  return new Date(timeInMs).toLocaleString();
};

/**
 * Format Wei amount (BigInt) to ETH string
 * @param {BigInt|String|Number} weiAmount - Amount in wei
 * @param {Number} decimals - Number of decimal places to show
 * @returns {String} - Formatted ETH amount
 */
export const formatEthAmount = (weiAmount, decimals = 4) => {
  if (!weiAmount) return "0";

  try {
    // Convert to string first if BigInt
    const weiString =
      typeof weiAmount === "bigint"
        ? weiAmount.toString()
        : weiAmount.toString();
    const ethValue = parseFloat(weiString) / 1e18;
    return ethValue.toFixed(decimals);
  } catch (error) {
    console.error("Error formatting ETH amount:", error);
    return "0";
  }
};

/**
 * Safely convert contract response arrays
 * @param {Array} contractArray - Array from contract call
 * @returns {Array} - Processed array with converted BigInt values
 */
export const processContractArray = (contractArray) => {
  if (!Array.isArray(contractArray)) return [];

  return contractArray.map((item) => {
    if (typeof item === "object" && item !== null) {
      const processed = {};
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === "bigint") {
          processed[key] = Number(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    }
    return typeof item === "bigint" ? Number(item) : item;
  });
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {BigInt|Number} timestamp - Unix timestamp
 * @returns {String} - Relative time string
 */
export const getRelativeTime = (timestamp) => {
  const timeInMs = safeNumberConversion(timestamp) * 1000;
  const now = new Date().getTime();
  const diffInSeconds = Math.floor((now - timeInMs) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

/**
 * Truncate address for display
 * @param {String} address - Ethereum address
 * @param {Number} startChars - Characters to show at start
 * @param {Number} endChars - Characters to show at end
 * @returns {String} - Truncated address
 */
export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Validate Ethereum address
 * @param {String} address - Address to validate
 * @returns {Boolean} - Is valid address
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Copy text to clipboard
 * @param {String} text - Text to copy
 * @returns {Promise<Boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

/**
 * Generate random ID
 * @returns {String} - Random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {Number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format large numbers with suffixes (K, M, B)
 * @param {Number} num - Number to format
 * @returns {String} - Formatted number
 */
export const formatNumber = (num) => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + "B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + "K";
  }
  return num.toString();
};

/**
 * Calculate percentage
 * @param {Number} value - Current value
 * @param {Number} total - Total value
 * @returns {Number} - Percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format an ISO/YYYY-MM-DD date string to DD/MM/YYYY (India locale)
 * @param {String} dateStr - Date string parseable by new Date()
 * @returns {String} - "DD/MM/YYYY" or "—" if invalid
 */
export const formatDateDMY = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

/**
 * Get status color based on status string
 * @param {String} status - Status string
 * @returns {String} - CSS color class
 */
export const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || "";

  if (
    statusLower.includes("success") ||
    statusLower.includes("completed") ||
    statusLower.includes("approved")
  ) {
    return "text-green-600 bg-green-100";
  }
  if (statusLower.includes("pending") || statusLower.includes("waiting")) {
    return "text-yellow-600 bg-yellow-100";
  }
  if (
    statusLower.includes("failed") ||
    statusLower.includes("rejected") ||
    statusLower.includes("error")
  ) {
    return "text-red-600 bg-red-100";
  }
  if (statusLower.includes("active") || statusLower.includes("available")) {
    return "text-blue-600 bg-blue-100";
  }

  return "text-gray-600 bg-gray-100";
};

export default {
  safeNumberConversion,
  formatDate,
  formatTime,
  formatDateTime,
  formatEthAmount,
  processContractArray,
  getRelativeTime,
  truncateAddress,
  isValidAddress,
  copyToClipboard,
  generateId,
  debounce,
  formatNumber,
  calculatePercentage,
  getStatusColor,
  formatDateDMY,
};
