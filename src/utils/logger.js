const fs = require('fs');
const path = require('path');

// Log dosyası yolu
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'bot.log');

/**
 * Log mesajı yaz (Non-blocking asynchronous)
 * @param {string} level - Log seviyesi (INFO, ERROR, WARNING)
 * @param {string} message - Log mesajı
 */
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logMessage.trim());

    // FIXED: Non-blocking asynchronous write to prevent event loop blocking
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) {
            console.error('Log yazma hatası:', err.message);
        }
    });
}

function info(message) {
    log('INFO', message);
}

function error(message) {
    log('ERROR', message);
}

function warning(message) {
    log('WARNING', message);
}

module.exports = {
    info,
    error,
    warning
};
