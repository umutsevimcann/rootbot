const { exec } = require('child_process');
const util = require('util');

// Promise tabanlı exec
const execPromise = util.promisify(exec);

/**
 * PowerShell komutu çalıştır
 * @param {string} command - PowerShell komutu
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execPowerShell(command) {
    return await execPromise(`powershell -Command "${command}"`);
}

/**
 * CMD komutu çalıştır
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
