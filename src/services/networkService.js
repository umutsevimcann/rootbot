const si = require('systeminformation');
const os = require('os');
const fs = require('fs').promises;
const { execPromise, execPowerShell } = require('../utils/exec');
const { formatBytes } = require('./systemService');

/**
 * Validate and sanitize domain input to prevent command injection
 * @param {string} domain - User-provided domain
 * @returns {string|null} - Sanitized domain or null if invalid
 */
function validateDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return null;
    }

    // Remove whitespace and convert to lowercase
    domain = domain.trim().toLowerCase();

    // Strict domain validation regex (RFC-compliant)
    // Allows: alphanumeric, hyphens, dots (standard domain format)
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

    if (!domainRegex.test(domain)) {
        return null;
    }

    // Length validation (max 253 characters per RFC 1035)
    if (domain.length > 253) {
        return null;
    }

    // Check each label (part between dots)
    const labels = domain.split('.');
    for (const label of labels) {
        if (label.length === 0 || label.length > 63) {
            return null;
        }
    }

    // Block PowerShell special characters (defense in depth)
    const dangerousChars = /['"`$;&|<>(){}[\]\\]/;
    if (dangerousChars.test(domain)) {
        return null;
    }

    return domain;
}

/**
 * IP bilgisi al
 */
async function getIPInfo() {
    try {
        const networkInterfaces = os.networkInterfaces();
        let message = '*IP Bilgileri*\n\n';

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
        return 'IP bilgisi alınamadı: ' + error.message;
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

        let message = '*WiFi Bilgisi*\n\n';
        message += `• Ağ Adı (SSID): ${ssid || 'Bilinmiyor'}\n`;
        message += `• Sinyal Gücü: ${signal || 'Bilinmiyor'}\n`;
        message += `• Kanal: ${channel || 'Bilinmiyor'}\n`;

        return message;
    } catch (error) {
        return 'WiFi bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Ağ trafiği bilgisi
 */
async function getNetworkTraffic() {
    try {
        const stats = await si.networkStats();

        let message = '*Ağ Trafiği*\n\n';
        stats.forEach((stat, index) => {
            message += `*Bağlantı ${index + 1}:* ${stat.iface}\n`;
            message += `• İndirme: ${formatBytes(stat.rx_bytes)}\n`;
            message += `• Yükleme: ${formatBytes(stat.tx_bytes)}\n`;
            message += `• İndirme Hızı: ${formatBytes(stat.rx_sec)}/s\n`;
            message += `• Yükleme Hızı: ${formatBytes(stat.tx_sec)}/s\n\n`;
        });

        return message;
    } catch (error) {
        return 'Ağ trafiği alınamadı: ' + error.message;
    }
}

/**
 * Ağ taraması yap
 */
async function scanNetwork() {
    try {
        const { stdout } = await execPromise('arp -a');
        const lines = stdout.split('\n').filter(line => line.trim());

        let message = '*Ağ Taraması*\n\n';
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
        return 'Ağ taraması başarısız: ' + error.message;
    }
}

/**
 * Website engelle (hosts dosyası) - SECURE VERSION
 * Uses Node.js fs module instead of PowerShell to prevent command injection
 */
async function blockWebsite(domain) {
    try {
        // CRITICAL: Validate and sanitize input
        const sanitizedDomain = validateDomain(domain);
        if (!sanitizedDomain) {
            return 'Geçersiz domain formatı. Lütfen geçerli bir domain girin (örnek: example.com)\n\nÖzel karakterler ve boşluk kullanılamaz.';
        }

        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

        // Read current hosts file using Node.js fs (no shell execution)
        let hostsContent = '';
        try {
            hostsContent = await fs.readFile(hostsPath, 'utf8');
        } catch (error) {
            return 'Hosts dosyası okunamadı: Yönetici yetkisi gerekiyor.\n\nNode.js\'i "Yönetici olarak çalıştır" ile başlatın.';
        }

        // Check if already blocked
        const blockEntry1 = `127.0.0.1 ${sanitizedDomain}`;
        const blockEntry2 = `127.0.0.1 www.${sanitizedDomain}`;

        if (hostsContent.includes(blockEntry1)) {
            return `${sanitizedDomain} zaten engellenmiş.`;
        }

        // Append block entries (safe - no command execution)
        const newContent = hostsContent + `\n${blockEntry1}\n${blockEntry2}\n`;

        // Write back to hosts file
        try {
            await fs.writeFile(hostsPath, newContent, 'utf8');
        } catch (error) {
            return 'Hosts dosyası yazılamadı: Yönetici yetkisi gerekiyor.\n\nNode.js\'i "Yönetici olarak çalıştır" ile başlatın.';
        }

        // Flush DNS cache (safe - no user input in command)
        try {
            await execPromise('ipconfig /flushdns');
        } catch (error) {
            // DNS flush failed but blocking succeeded
            return `${sanitizedDomain} engellendi.\n\nwww.${sanitizedDomain} da engellendi.\n\nUyarı: DNS cache temizlenemedi.`;
        }

        return `${sanitizedDomain} engellendi.\n\nwww.${sanitizedDomain} da engellendi.\nDNS cache temizlendi.`;
    } catch (error) {
        return 'Website engellenemedi: ' + error.message;
    }
}

/**
 * Website engelini kaldır - SECURE VERSION
 * Uses Node.js fs module instead of PowerShell to prevent command injection
 */
async function unblockWebsite(domain) {
    try {
        // CRITICAL: Validate and sanitize input
        const sanitizedDomain = validateDomain(domain);
        if (!sanitizedDomain) {
            return 'Geçersiz domain formatı. Lütfen geçerli bir domain girin (örnek: example.com)\n\nÖzel karakterler ve boşluk kullanılamaz.';
        }

        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

        // Read hosts file using Node.js fs (no shell execution)
        let hostsContent = '';
        try {
            hostsContent = await fs.readFile(hostsPath, 'utf8');
        } catch (error) {
            return 'Hosts dosyası okunamadı: Yönetici yetkisi gerekiyor.\n\nNode.js\'i "Yönetici olarak çalıştır" ile başlatın.';
        }

        // Remove lines matching exact domain entries (prevents partial matching bug)
        const lines = hostsContent.split('\n');
        const blockEntry1 = `127.0.0.1 ${sanitizedDomain}`;
        const blockEntry2 = `127.0.0.1 www.${sanitizedDomain}`;

        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed !== blockEntry1 && trimmed !== blockEntry2;
        });

        // Check if anything was removed
        if (lines.length === filteredLines.length) {
            return `${sanitizedDomain} zaten engellenmemiş.`;
        }

        // Write back to hosts file
        try {
            await fs.writeFile(hostsPath, filteredLines.join('\n'), 'utf8');
        } catch (error) {
            return 'Hosts dosyası yazılamadı: Yönetici yetkisi gerekiyor.\n\nNode.js\'i "Yönetici olarak çalıştır" ile başlatın.';
        }

        // Flush DNS cache (safe - no user input in command)
        try {
            await execPromise('ipconfig /flushdns');
        } catch (error) {
            return `${sanitizedDomain} engeli kaldırıldı.\n\nUyarı: DNS cache temizlenemedi.`;
        }

        return `${sanitizedDomain} engeli kaldırıldı.\nDNS cache temizlendi.`;
    } catch (error) {
        return 'Engel kaldırılamadı: ' + error.message;
    }
}

/**
 * Engellenen websiteleri listele - SECURE VERSION
 * Uses Node.js fs module instead of PowerShell to prevent path injection
 */
async function getBlockedWebsites() {
    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

        // Read hosts file using Node.js fs (no shell execution)
        let hostsContent = '';
        try {
            hostsContent = await fs.readFile(hostsPath, 'utf8');
        } catch (error) {
            return 'Hosts dosyası okunamadı: Yönetici yetkisi gerekiyor.\n\nNode.js\'i "Yönetici olarak çalıştır" ile başlatın.';
        }

        // Parse blocked websites (safe - no command execution)
        const lines = hostsContent.split('\n');
        const blockedSites = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            // Match 127.0.0.1 entries
            const match = trimmedLine.match(/^127\.0\.0\.1\s+(.+)/);
            if (match && !match[1].includes('localhost')) {
                blockedSites.push(match[1].trim());
            }
        }

        if (blockedSites.length === 0) {
            return '*Engellenen Websiteler:*\n\nHenüz engellenmiş website yok.';
        }

        let message = '*Engellenen Websiteler:*\n\n';
        blockedSites.forEach((site, index) => {
            message += `${index + 1}. ${site}\n`;
        });

        return message;
    } catch (error) {
        return 'Liste alınamadı: ' + error.message;
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
