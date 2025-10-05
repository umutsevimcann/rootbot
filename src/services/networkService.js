const si = require('systeminformation');
const os = require('os');
const { execPromise, execPowerShell } = require('../utils/exec');
const { formatBytes } = require('./systemService');

/**
 * IP bilgisi al
 */
async function getIPInfo() {
    try {
        const networkInterfaces = os.networkInterfaces();
        let message = '*📡 IP Bilgileri*\n\n';

        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            interfaces.forEach(iface => {
                if (!iface.internal) {
                    message += `*${name}:*\n`;
                    message += `• IP: ${iface.address}\n`;
                    message += `• MAC: ${iface.mac}\n`;
                    message += `• Aile: ${iface.family}\n\n`;
                }
            });
        }

        return message;
    } catch (error) {
        return '❌ IP bilgisi alınamadı: ' + error.message;
    }
}

/**
 * WiFi bilgisi al
 */
async function getWiFiInfo() {
    try {
        const { stdout } = await execPromise('netsh wlan show interfaces');
        const lines = stdout.split('\n');

        let ssid = '';
        let signal = '';
        let channel = '';

        lines.forEach(line => {
            if (line.includes('SSID')) ssid = line.split(':')[1]?.trim();
            if (line.includes('Signal')) signal = line.split(':')[1]?.trim();
            if (line.includes('Channel')) channel = line.split(':')[1]?.trim();
        });

        let message = '*📶 WiFi Bilgisi*\n\n';
        message += `• Ağ Adı (SSID): ${ssid || 'Bilinmiyor'}\n`;
        message += `• Sinyal Gücü: ${signal || 'Bilinmiyor'}\n`;
        message += `• Kanal: ${channel || 'Bilinmiyor'}\n`;

        return message;
    } catch (error) {
        return '❌ WiFi bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Ağ trafiği bilgisi
 */
async function getNetworkTraffic() {
    try {
        const stats = await si.networkStats();

        let message = '*📊 Ağ Trafiği*\n\n';
        stats.forEach((stat, index) => {
            message += `*Bağlantı ${index + 1}:* ${stat.iface}\n`;
            message += `• İndirme: ${formatBytes(stat.rx_bytes)}\n`;
            message += `• Yükleme: ${formatBytes(stat.tx_bytes)}\n`;
            message += `• İndirme Hızı: ${formatBytes(stat.rx_sec)}/s\n`;
            message += `• Yükleme Hızı: ${formatBytes(stat.tx_sec)}/s\n\n`;
        });

        return message;
    } catch (error) {
        return '❌ Ağ trafiği alınamadı: ' + error.message;
    }
}

/**
 * Ağ taraması yap
 */
async function scanNetwork() {
    try {
        const { stdout } = await execPromise('arp -a');
        const lines = stdout.split('\n').filter(line => line.trim());

        let message = '*🔍 Ağ Taraması*\n\n';
        let deviceCount = 0;

        lines.forEach(line => {
            // IP adresi içeren satırları filtrele
            const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([\w-]+)/);
            if (match) {
                deviceCount++;
                message += `${deviceCount}. ${match[1]} (${match[2]})\n`;
            }
        });

        message += `\n*Toplam: ${deviceCount} cihaz bulundu*`;
        return message;
    } catch (error) {
        return '❌ Ağ taraması başarısız: ' + error.message;
    }
}

/**
 * Website engelle (hosts dosyası)
 */
async function blockWebsite(domain) {
    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
        const blockEntry1 = `127.0.0.1 ${domain}`;
        const blockEntry2 = `127.0.0.1 www.${domain}`;

        // Admin yetkisiyle PowerShell çalıştır
        const psCommand = `
            Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-Command','Add-Content -Path ''${hostsPath}'' -Value ''${blockEntry1}''; Add-Content -Path ''${hostsPath}'' -Value ''${blockEntry2}''; ipconfig /flushdns' -WindowStyle Hidden -Wait
        `.replace(/\n/g, ' ');

        await execPromise(`powershell -Command "${psCommand}"`);

        return `✅ ${domain} engellendi.\n\n🔸 www.${domain} da engellendi.\n🔄 DNS cache temizlendi.`;
    } catch (error) {
        if (error.message.includes('reddedildi') || error.message.includes('denied')) {
            return `❌ Website engellenemedi: Yönetici yetkisi gerekiyor.\n\n⚠️ Node.js'i "Yönetici olarak çalıştır" ile başlatın.`;
        }
        return '❌ Website engellenemedi: ' + error.message;
    }
}

/**
 * Website engelini kaldır
 */
async function unblockWebsite(domain) {
    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

        // Admin yetkisiyle PowerShell çalıştır
        const psCommand = `
            Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-Command','(Get-Content ''${hostsPath}'') | Where-Object { $_ -notmatch ''${domain}'' } | Set-Content ''${hostsPath}''; ipconfig /flushdns' -WindowStyle Hidden -Wait
        `.replace(/\n/g, ' ');

        await execPromise(`powershell -Command "${psCommand}"`);

        return `✅ ${domain} engeli kaldırıldı.\n🔄 DNS cache temizlendi.`;
    } catch (error) {
        if (error.message.includes('reddedildi') || error.message.includes('denied')) {
            return `❌ Engel kaldırılamadı: Yönetici yetkisi gerekiyor.\n\n⚠️ Node.js'i "Yönetici olarak çalıştır" ile başlatın.`;
        }
        return '❌ Engel kaldırılamadı: ' + error.message;
    }
}

/**
 * Engellenen websiteleri listele
 */
async function getBlockedWebsites() {
    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
        const { stdout } = await execPromise(`powershell -Command "Get-Content '${hostsPath}' | Select-String '127.0.0.1'"`);

        if (!stdout.trim()) {
            return '📋 *Engellenen Websiteler:*\n\nHenüz engellenmiş website yok.';
        }

        const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('localhost'));
        let message = '📋 *Engellenen Websiteler:*\n\n';

        lines.forEach((line, index) => {
            const match = line.match(/127\.0\.0\.1\s+(.+)/);
            if (match) {
                message += `${index + 1}. ${match[1].trim()}\n`;
            }
        });

        return message;
    } catch (error) {
        return '❌ Liste alınamadı: ' + error.message;
    }
}

module.exports = {
    getIPInfo,
    getWiFiInfo,
    getNetworkTraffic,
    scanNetwork,
    blockWebsite,
    unblockWebsite,
    getBlockedWebsites
};
