/**
 * Logger utility with timestamps for backend
 */

function formatTimestamp() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}:${ms}`;
}

function logWithLevel(level, ...args) {
  const timestamp = formatTimestamp();
  console.log(`[${timestamp}] [${level}]`, ...args);
}

export const log = {
  i: (...args) => logWithLevel('INFO', ...args),
  w: (...args) => logWithLevel('WARN', ...args),
  e: (...args) => logWithLevel('ERROR', ...args),
};
