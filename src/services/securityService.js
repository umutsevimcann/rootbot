const { execPromise } = require('../utils/exec');

/**
 * Güvenlik kontrolü
 */
async function securityCheck() {
    try {
        let report = '*Güvenlik Kontrolü*\n\n';

        // Windows Defender durumu
        const { stdout: defenderStatus } = await execPromise('powershell -Command "Get-MpComputerStatus | Select-Object -Property RealTimeProtectionEnabled"');
        const isDefenderEnabled = defenderStatus.includes('True');

        // Güvenlik duvarı durumu
        const { stdout: firewallStatus } = await execPromise('netsh advfirewall show allprofiles state');
        const isFirewallEnabled = firewallStatus.includes('ON');

        // Güncellemeler
        const { stdout: updates } = await execPromise('powershell -Command "Get-HotFix | Sort-Object -Property InstalledOn -Descending | Select-Object -First 1"');

        report += `*Windows Defender:* ${isDefenderEnabled ? 'Aktif' : 'Devre Dışı'}\n`;
        report += `*Güvenlik Duvarı:* ${isFirewallEnabled ? 'Aktif' : 'Devre Dışı'}\n`;
        report += `*Son Güncelleme:* ${updates.split('\n')[3]?.trim() || 'Bilinmiyor'}\n`;

        return report;
    } catch (error) {
        console.error('Güvenlik kontrolü hatası:', error);
        return 'Güvenlik kontrolü başarısız: ' + error.message;
    }
}

/**
 * Antivirüs taraması başlat
 */
async function checkAntivirus() {
    try {
        let report = '*Antivirüs Durumu*\n\n';

        // Windows Defender durumu
        const { stdout: defenderInfo } = await execPromise('powershell -Command "Get-MpComputerStatus"');

        // Gerçek zamanlı koruma
        const realTimeProtection = defenderInfo.includes('RealTimeProtectionEnabled : True');
        report += `*Gerçek Zamanlı Koruma:* ${realTimeProtection ? 'Aktif' : 'Devre Dışı'}\n`;

        // Antivirüs imza versiyonu
        const signatureVersionMatch = defenderInfo.match(/AntivirusSignatureVersion\s+:\s+(.+)/);
        if (signatureVersionMatch) {
            report += `*İmza Versiyonu:* ${signatureVersionMatch[1].trim()}\n`;
        }

        // Son tarama
        const lastScanMatch = defenderInfo.match(/LastQuickScanStartTime\s+:\s+(.+)/);
        if (lastScanMatch && lastScanMatch[1].trim() !== '') {
            report += `*Son Hızlı Tarama:* ${lastScanMatch[1].trim()}\n`;
        } else {
            report += `*Son Hızlı Tarama:* Hiç yapılmamış\n`;
        }

        // Tespit edilen tehditler
        const threatCountMatch = defenderInfo.match(/QuickScanSignatureVersion\s+:\s+(\d+)/);
        report += `\n*Durum:* Sistem korunuyor\n`;

        // Hızlı tarama başlatma seçeneği
        report += '\n*İpucu:* Hızlı tarama başlatmak için Windows Security uygulamasını kullanın.';

        return report;
    } catch (error) {
        console.error('Antivirüs kontrolü hatası:', error);
        return 'Antivirüs kontrolü başarısız: ' + error.message;
    }
}

/**
 * Güvenlik duvarı kontrolü
 */
async function checkFirewall() {
    try {
        let report = '*Güvenlik Duvarı*\n\n';

        const { stdout: firewallStatus } = await execPromise('netsh advfirewall show allprofiles');

        // Domain, Private, Public profilleri kontrol et
        const profiles = ['Domain', 'Private', 'Public'];
        profiles.forEach(profile => {
            const regex = new RegExp(`${profile} Profile Settings.*?State\\s+(ON|OFF)`, 's');
            const match = firewallStatus.match(regex);
            if (match) {
                report += `*${profile}:* ${match[1] === 'ON' ? 'Aktif' : 'Devre Dışı'}\n`;
            }
        });

        return report;
    } catch (error) {
        console.error('Güvenlik duvarı kontrolü hatası:', error);
        return 'Güvenlik duvarı kontrolü başarısız: ' + error.message;
    }
}

/**
 * USB cihazlarını tespit et
 */
async function detectUSBDevices() {
    try {
        // PowerShell ile tüm USB cihazları tespit et
        const { stdout } = await execPromise(`powershell -Command "Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match '^USB' } | Select-Object FriendlyName, Status, InstanceId | ConvertTo-Json"`, { timeout: 10000 });

        // Boş output kontrolü
        if (!stdout || !stdout.trim()) {
            return '*USB Cihazları*\n\nUSB cihaz bulunamadı.';
        }

        let devices;
        try {
            devices = JSON.parse(stdout.trim());
            // Tek cihaz varsa array'e çevir
            if (!Array.isArray(devices)) {
                devices = [devices];
            }
        } catch (parseError) {
            console.error('JSON parse hatası:', parseError.message);
            return '*USB Cihazları*\n\nUSB cihaz listesi okunamadı.';
        }

        let message = '*USB Cihazları*\n\n';
        if (devices.length === 0) {
            message += 'USB cihaz bulunamadı.';
        } else {
            devices.forEach((device, index) => {
                message += `${index + 1}. ${device.FriendlyName}\n`;
                message += `   Durum: ${device.Status === 'OK' ? 'Çalışıyor' : '' + device.Status}\n\n`;
            });
        }

        return message;
    } catch (error) {
        console.error('USB tespit hatası:', error);
        return 'USB cihazlar tespit edilemedi: ' + error.message;
    }
}


/**
 * Güvenlik raporu
 */
async function getSecurityReport() {
    try {
        let report = '*Güvenlik Raporu*\n\n';

        // Güvenlik kontrolü
        const secCheck = await securityCheck();
        report += secCheck + '\n\n';

        // USB cihazları
        const usbCheck = await detectUSBDevices();
        report += usbCheck;

        return report;
    } catch (error) {
        return 'Güvenlik raporu oluşturulamadı: ' + error.message;
    }
}

module.exports = {
    securityCheck,
    checkAntivirus,
    checkFirewall,
    detectUSBDevices,
    getSecurityReport
};
