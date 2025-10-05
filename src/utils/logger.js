const fs = require('fs');
const path = require('path');

// Log dosyası yolu
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'bot.log');

/**
 * Log mesajı yaz
 * @param {string} level - Log seviyesi (INFO, ERROR, WARNING)
 * @param {string} message - Log mesajı
 */
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logMessage.trim());
    fs.appendFileSync(logFile, logMessage);
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
