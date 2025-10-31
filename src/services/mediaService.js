const { execPromise } = require('../utils/exec');

/**
 * Medya kontrolü (Play/Pause/Next/Previous)
 */
async function controlMusic(action) {
    try {
        let keyCode;

        switch (action) {
            case 'play':
            case 'pause':
                keyCode = 0xB3; // Media Play/Pause
                break;
            case 'next':
                keyCode = 0xB0; // Media Next Track
                break;
            case 'previous':
                keyCode = 0xB1; // Media Previous Track
                break;
            case 'stop':
                keyCode = 0xB2; // Media Stop
                break;
            default:
                return 'Geçersiz medya komutu.';
        }

        // PowerShell ile tuş gönder
        await execPromise(`powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${keyCode})"`);

        const actionNames = {
            'play': 'Oynat',
            'pause': 'Duraklat',
            'next': 'Sonraki',
            'previous': 'Önceki',
            'stop': 'Durdur'
        };

        return `Medya kontrolü: ${actionNames[action]}`;
    } catch (error) {
        console.error('Medya kontrol hatası:', error);
        return 'Medya kontrolü başarısız: ' + error.message;
    }
}

/**
 * Program aç
 */
async function openApplication(appName) {
    try {
        const appCommands = {
            'netflix': 'start netflix:',
            'spotify': 'start spotify:',
            'steam': 'start steam:',
            'discord': 'start discord:',
            'youtube': 'start https://www.youtube.com',
            'chrome': 'start chrome',
            'firefox': 'start firefox',
            'edge': 'start msedge',
            'notepad': 'start notepad',
            'calculator': 'start calc'
        };

        const command = appCommands[appName.toLowerCase()];

        if (!command) {
            return `Bilinmeyen uygulama: ${appName}`;
        }

        await execPromise(command);
        return `${appName} açılıyor...`;
    } catch (error) {
        console.error('Uygulama açma hatası:', error);
        return `${appName} açılamadı: ` + error.message;
    }
}

/**
 * Müzik çalıyor mu kontrol et
 */
async function getMusicStatus() {
    try {
        // Spotify veya diğer medya playerları kontrol et
        const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq Spotify.exe" /FO CSV /NH');

        if (stdout.includes('Spotify.exe')) {
            return '*Müzik Durumu*\n\nSpotify çalışıyor.';
        } else {
            return '*Müzik Durumu*\n\nMüzik çalar bulunamadı.';
        }
    } catch (error) {
        return 'Müzik durumu alınamadı: ' + error.message;
    }
}

/**
 * Ses seviyesi kontrolü (media keys)
 */
async function volumeUp() {
    try {
        await execPromise('powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]0xAF)"');
        return 'Ses yükseltildi.';
    } catch (error) {
        return 'Ses yükseltme başarısız: ' + error.message;
    }
}

async function volumeDown() {
    try {
        await execPromise('powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]0xAE)"');
        return 'Ses azaltıldı.';
    } catch (error) {
        return 'Ses azaltma başarısız: ' + error.message;
    }
}

async function volumeMute() {
    try {
        await execPromise('powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]0xAD)"');
        return 'Ses kapatıldı/açıldı.';
    } catch (error) {
        return 'Ses kapatma başarısız: ' + error.message;
    }
}

module.exports = {
    controlMusic,
    openApplication,
    getMusicStatus,
    volumeUp,
    volumeDown,
    volumeMute
};
