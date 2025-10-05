const si = require('systeminformation');
const os = require('os');

// Performans geçmişi
let performanceHistory = {
    cpu: [],
    ram: [],
    timestamps: []
};

/**
 * Performans verisi topla
 */
async function collectPerformanceData() {
    try {
        const cpuLoad = await si.currentLoad();
        const mem = await si.mem();

        const cpuUsage = cpuLoad.currentLoad;
        const ramUsage = (mem.used / mem.total) * 100;

        performanceHistory.cpu.push(cpuUsage);
        performanceHistory.ram.push(ramUsage);
        performanceHistory.timestamps.push(new Date().toLocaleTimeString('tr-TR'));

        // Son 20 veriyi tut
        if (performanceHistory.cpu.length > 20) {
            performanceHistory.cpu.shift();
            performanceHistory.ram.shift();
            performanceHistory.timestamps.shift();
        }
    } catch (error) {
        console.error('Performans veri toplama hatası:', error);
    }
}

/**
 * Performans grafiği oluştur (text-based)
 */
async function getPerformanceChart() {
    try {
        if (performanceHistory.cpu.length === 0) {
            return '📊 Henüz yeterli veri toplanmadı. Lütfen birkaç dakika bekleyin.';
        }

        let message = '*📊 Performans Grafiği (Son 10 Kayıt)*\n\n';

        const last10 = Math.max(0, performanceHistory.cpu.length - 10);
        const lastIndex = performanceHistory.cpu.length - 1;

        for (let i = lastIndex; i >= last10; i--) {
            const cpu = performanceHistory.cpu[i];
            const ram = performanceHistory.ram[i];
            const time = performanceHistory.timestamps[i];

            const cpuBars = '█'.repeat(Math.round(cpu / 5));
            const cpuSpaces = '░'.repeat(20 - Math.round(cpu / 5));
            const ramBars = '█'.repeat(Math.round(ram / 5));
            const ramSpaces = '░'.repeat(20 - Math.round(ram / 5));

            message += `🕐 ${time}\n`;
            message += `CPU: ${cpuBars}${cpuSpaces} ${cpu.toFixed(1)}%\n`;
            message += `RAM: ${ramBars}${ramSpaces} ${ram.toFixed(1)}%\n\n`;
        }

        return message;
    } catch (error) {
        console.error('Performans grafiği hatası:', error);
        return '❌ Performans grafiği oluşturulamadı: ' + error.message;
    }
}

/**
 * Sistem sağlığı raporu
 */
async function getSystemHealth() {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const temp = await si.cpuTemperature();
        const disk = await si.fsSize();

        let health = '*💚 Sistem Sağlığı*\n\n';

        // CPU kontrolü
        if (cpu.currentLoad < 50) {
            health += '✅ CPU: Normal (%' + cpu.currentLoad.toFixed(1) + ')\n';
        } else if (cpu.currentLoad < 80) {
            health += '⚠️ CPU: Yüksek (%' + cpu.currentLoad.toFixed(1) + ')\n';
        } else {
            health += '🔴 CPU: Kritik (%' + cpu.currentLoad.toFixed(1) + ')\n';
        }

        // RAM kontrolü
        const ramUsage = (mem.used / mem.total) * 100;
        if (ramUsage < 70) {
            health += '✅ RAM: Normal (%' + ramUsage.toFixed(1) + ')\n';
        } else if (ramUsage < 90) {
            health += '⚠️ RAM: Yüksek (%' + ramUsage.toFixed(1) + ')\n';
        } else {
            health += '🔴 RAM: Kritik (%' + ramUsage.toFixed(1) + ')\n';
        }

        // Sıcaklık kontrolü
        if (temp.main) {
            if (temp.main < 70) {
                health += '✅ Sıcaklık: Normal (' + temp.main + '°C)\n';
            } else if (temp.main < 85) {
                health += '⚠️ Sıcaklık: Yüksek (' + temp.main + '°C)\n';
            } else {
                health += '🔴 Sıcaklık: Kritik (' + temp.main + '°C)\n';
            }
        }

        // Disk kontrolü
        disk.forEach(d => {
            if (d.use < 80) {
                health += `✅ Disk ${d.fs}: Normal (%${d.use.toFixed(1)})\n`;
            } else if (d.use < 95) {
                health += `⚠️ Disk ${d.fs}: Yüksek (%${d.use.toFixed(1)})\n`;
            } else {
                health += `🔴 Disk ${d.fs}: Kritik (%${d.use.toFixed(1)})\n`;
            }
        });

        return health;
    } catch (error) {
        console.error('Sistem sağlığı hatası:', error);
        return '❌ Sistem sağlığı alınamadı: ' + error.message;
    }
}

// Performans interval (otomatik başlatılmıyor - manuel start gerekli)
let performanceInterval = null;

// Performans toplama başlat
function startPerformanceCollection() {
    if (performanceInterval) {
        console.log('⚠️ Performans toplama zaten aktif.');
        return;
    }

    performanceInterval = setInterval(collectPerformanceData, 10000);
    console.log('✅ Performans veri toplama başlatıldı (her 10 saniyede bir).');
}

// Cleanup fonksiyonu
function stopPerformanceCollection() {
    if (performanceInterval) {
        clearInterval(performanceInterval);
        performanceInterval = null;
        console.log('Performans veri toplama durduruldu.');
    }
}

module.exports = {
    collectPerformanceData,
    getPerformanceChart,
    getSystemHealth,
    getPerformanceHistory: () => performanceHistory,
    startPerformanceCollection,
    stopPerformanceCollection
};
