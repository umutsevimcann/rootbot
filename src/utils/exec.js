const { exec } = require('child_process');
const util = require('util');

// Promise tabanlı exec
const execPromiseInternal = util.promisify(exec);

/**
 * Basit exec - Güvenlik kontrolleri kaldırıldı (kişisel kullanım)
 * @param {string} command - Çalıştırılacak komut
 * @param {Object} options - exec options
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execPromise(command, options = {}) {
    // Sadece basic validation
    if (!command || typeof command !== 'string') {
        throw new Error('Invalid command: must be non-empty string');
    }

    // Default timeout ekle (60 saniye)
    const execOptions = {
        timeout: 60000,
        maxBuffer: 5 * 1024 * 1024, // 5MB (video/screenshot için)
        ...options
    };

    return await execPromiseInternal(command, execOptions);
}

/**
 * PowerShell komutu çalıştır (Basitleştirilmiş)
 * @param {string} command - PowerShell komutu
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execPowerShell(command) {
    // PowerShell komutunda double-quote escape
    const escapedCommand = command.replace(/"/g, '`"');

    // PowerShell -Command ile çalıştır
    return await execPromise(`powershell -Command "${escapedCommand}"`);
}

/**
 * CMD komutu çalıştır (Basitleştirilmiş)
 * @param {string} command - CMD komutu
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execCmd(command) {
    return await execPromise(command);
}

module.exports = {
    execPromise,
    execPowerShell,
    execCmd
};
