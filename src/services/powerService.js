const { execPromise } = require('../utils/exec');

/**
 * Bilgisayarı kilitle
 */
async function lockSystem() {
    try {
        await execPromise('rundll32.exe user32.dll,LockWorkStation');
        return '🔒 Bilgisayar kilitlendi.';
    } catch (error) {
        console.error('Kilitleme hatası:', error);
        return '❌ Kilitleme başarısız: ' + error.message;
    }
}

/**
 * Bilgisayar kilidini aç (ENTER tuşu simülasyonu)
 */
async function unlockSystem() {
    try {
        // PowerShell SendKeys ile ENTER tuşu gönder
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys(\'{ENTER}\')"');
        return '🔓 Kilit açma komutu gönderildi (ENTER tuşu).';
    } catch (error) {
        console.error('Kilit açma hatası:', error);
        return '❌ Kilit açma başarısız: ' + error.message;
    }
}

/**
 * Uyku moduna al
 */
async function sleepMode() {
    try {
        await execPromise('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return '💤 Bilgisayar uyku moduna alınıyor...';
    } catch (error) {
        console.error('Uyku modu hatası:', error);
        return '❌ Uyku moduna alma başarısız: ' + error.message;
    }
}

/**
 * Sistemi yeniden başlat
 */
async function rebootSystem() {
    try {
        await execPromise('shutdown /r /t 60 /c "Sistem 60 saniye içinde yeniden başlatılacak"');
        return '🔄 Sistem 60 saniye içinde yeniden başlatılacak...';
    } catch (error) {
        console.error('Yeniden başlatma hatası:', error);
        return '❌ Yeniden başlatma başarısız: ' + error.message;
    }
}

/**
 * Sistemi kapat
 */
async function shutdownSystem(minutes = 0) {
    try {
        if (minutes === 0) {
            await execPromise('shutdown /s /t 0');
            return '⚡ Bilgisayar hemen kapatılıyor...';
        } else {
            const seconds = minutes * 60;
            await execPromise(`shutdown /s /t ${seconds}`);
            return `⏰ Bilgisayar ${minutes} dakika sonra kapatılacak.`;
        }
    } catch (error) {
        console.error('Kapatma hatası:', error);
        return '❌ Kapatma başarısız: ' + error.message;
    }
}

/**
 * Kapatma iptal et
 */
async function cancelShutdown() {
    try {
        await execPromise('shutdown /a');
        return '✅ Kapatma işlemi iptal edildi.';
    } catch (error) {
        console.error('İptal hatası:', error);
        return '❌ İptal başarısız: ' + error.message;
    }
}

module.exports = {
    lockSystem,
    unlockSystem,
    sleepMode,
    rebootSystem,
    shutdownSystem,
    cancelShutdown
};
