const si = require('systeminformation');
const { bot } = require('../bot');
const config = require('../config/env');

/**
 * Sistem İzleme Servisi - Periyodik CPU/RAM/Temp kontrolleri
 */

let monitorInterval = null;
let isMonitoring = false;

// Eşik değerleri
const THRESHOLDS = {
    CPU: 90,        // %90 CPU kullanımı
    RAM: 90,        // %90 RAM kullanımı
    TEMP: 80        // 80°C sıcaklık
};

/**
 * Periyodik sistem kontrolünü başlat
 */
async function startSystemMonitoring(intervalMinutes = 1) {
    if (isMonitoring) {
        return '⚠️ Sistem izleme zaten aktif.';
    }

    isMonitoring = true;

    // Her X dakikada bir kontrol
    monitorInterval = setInterval(async () => {
        await checkSystemHealth();
    }, intervalMinutes * 60 * 1000);

    console.log(`Periyodik sistem kontrolü başlatıldı (${intervalMinutes} dakika aralıkla)`);
    return `✅ Periyodik sistem kontrolü başlatıldı.\nKontrol aralığı: ${intervalMinutes} dakika`;
}

/**
 * Periyodik sistem kontrolünü durdur
 */
function stopSystemMonitoring() {
    if (!isMonitoring) {
        return '⚠️ Sistem izleme zaten pasif.';
    }

    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }

    isMonitoring = false;
    console.log('Periyodik sistem kontrolü durduruldu');
    return '✅ Periyodik sistem kontrolü durduruldu.';
}

/**
 * Sistem sağlığını kontrol et
 */
async function checkSystemHealth() {
    try {
        const warnings = [];

        // CPU kontrolü
        const cpu = await si.currentLoad();
        const cpuLoad = Math.round(cpu.currentLoad);

        if (cpuLoad > THRESHOLDS.CPU) {
            warnings.push(`⚠️ *Yüksek CPU Kullanımı!*\nCPU: %${cpuLoad} (Eşik: %${THRESHOLDS.CPU})`);
        }

        // RAM kontrolü
        const mem = await si.mem();
        const ramUsage = Math.round((mem.used / mem.total) * 100);

        if (ramUsage > THRESHOLDS.RAM) {
            warnings.push(`⚠️ *Yüksek RAM Kullanımı!*\nRAM: %${ramUsage} (Eşik: %${THRESHOLDS.RAM})`);
        }

        // Sıcaklık kontrolü
        const temp = await si.cpuTemperature();

        if (temp.main && temp.main > THRESHOLDS.TEMP) {
            warnings.push(`⚠️ *Yüksek Sıcaklık!*\nSıcaklık: ${temp.main}°C (Eşik: ${THRESHOLDS.TEMP}°C)`);
        }

        // Uyarı varsa bildirim gönder
        if (warnings.length > 0) {
            const message = `🚨 *Sistem Uyarısı*\n\n${warnings.join('\n\n')}\n\n⏰ Zaman: ${new Date().toLocaleString('tr-TR')}`;

            await bot.sendMessage(config.telegram.allowedUserId, message, { parse_mode: 'Markdown' });
            console.log('Sistem uyarısı gönderildi:', warnings.length, 'uyarı');
        }

    } catch (error) {
        console.error('Sistem kontrolü hatası:', error);
    }
}

/**
 * İzleme durumunu al
 */
function getMonitoringStatus() {
    return {
        isActive: isMonitoring,
        thresholds: THRESHOLDS
    };
}

/**
 * Eşik değerlerini güncelle
 */
function updateThresholds(cpu, ram, temp) {
    if (cpu) THRESHOLDS.CPU = cpu;
    if (ram) THRESHOLDS.RAM = ram;
    if (temp) THRESHOLDS.TEMP = temp;

    return `✅ Eşik değerleri güncellendi:\nCPU: %${THRESHOLDS.CPU}\nRAM: %${THRESHOLDS.RAM}\nSıcaklık: ${THRESHOLDS.TEMP}°C`;
}

module.exports = {
    startSystemMonitoring,
    stopSystemMonitoring,
    checkSystemHealth,
    getMonitoringStatus,
    updateThresholds
};
