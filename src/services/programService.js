const { execPromise } = require('../utils/exec');

/**
 * Komut çalıştır
 */
async function runCommand(command) {
    try {
        const { stdout, stderr } = await execPromise(command, { timeout: 30000 });

        let result = '💻 *Komut Çıktısı:*\n\n';

        if (stdout) {
            result += `\`\`\`\n${stdout.substring(0, 3000)}\n\`\`\``;
        }

        if (stderr) {
            result += `\n⚠️ *Hatalar:*\n\`\`\`\n${stderr.substring(0, 1000)}\n\`\`\``;
        }

        if (!stdout && !stderr) {
            result += 'Komut çıktı üretmedi.';
        }

        return result;
    } catch (error) {
        console.error('Komut çalıştırma hatası:', error);
        return `❌ Komut başarısız:\n\`\`\`\n${error.message}\n\`\`\``;
    }
}

/**
 * Program başlat
 */
async function launchProgram(programName) {
    try {
        await execPromise(`start "" "${programName}"`);
        return `✅ Program başlatıldı: ${programName}`;
    } catch (error) {
        console.error('Program başlatma hatası:', error);
        return `❌ Program başlatılamadı: ${error.message}`;
    }
}

/**
 * Program sonlandır
 */
async function killProgram(processName) {
    try {
        await execPromise(`taskkill /F /IM "${processName}"`);
        return `✅ Program sonlandırıldı: ${processName}`;
    } catch (error) {
        console.error('Program sonlandırma hatası:', error);
        return `❌ Program sonlandırılamadı: ${error.message}`;
    }
}

/**
 * Başlangıç programlarını listele
 */
async function listStartupPrograms() {
    try {
        // Windows 11 uyumlu PowerShell komutu
        const { stdout } = await execPromise('powershell -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | Format-List"');
        return `🚀 *Başlangıçta Çalışan Programlar:*\n\n\`\`\`\n${stdout.substring(0, 3000)}\n\`\`\``;
    } catch (error) {
        console.error('Başlangıç programları hatası:', error);
        return '❌ Başlangıç programları listelenemedi: ' + error.message;
    }
}

/**
 * Yüklü programları listele
 */
async function listInstalledPrograms() {
    try {
        const { stdout } = await execPromise('powershell -Command "Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Where-Object {$_.DisplayName} | Format-Table -AutoSize"');
        return `📦 *Yüklü Programlar:*\n\n\`\`\`\n${stdout.substring(0, 3000)}\n\`\`\``;
    } catch (error) {
        console.error('Yüklü programlar hatası:', error);
        return '❌ Yüklü programlar listelenemedi: ' + error.message;
    }
}

/**
 * Çalışan servisleri listele
 */
async function listRunningServices() {
    try {
        const { stdout } = await execPromise('powershell -Command "Get-Service | Where-Object {$_.Status -eq \'Running\'} | Select-Object Name, DisplayName, Status | Format-Table -AutoSize"');
        return `⚙️ *Çalışan Servisler:*\n\n\`\`\`\n${stdout.substring(0, 3000)}\n\`\`\``;
    } catch (error) {
        console.error('Servis listesi hatası:', error);
        return '❌ Servisler listelenemedi: ' + error.message;
    }
}

module.exports = {
    runCommand,
    launchProgram,
    killProgram,
    listStartupPrograms,
    listInstalledPrograms,
    listRunningServices
};
