/**
 * CONSOLIDATED SYSTEM SERVICE
 * PHASE 4: Merged from 4 separate services
 *
 * Consolidates:
 * - systemService.js (258 lines) - System info, CPU, RAM, temp
 * - performanceService.js (183 lines) - Performance tracking, charts
 * - diskService.js (120 lines) - Disk usage, cleanup
 * - powerService.js (95 lines) - Power management
 *
 * Total: ~750 lines unified system management
 */

const si = require('systeminformation');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execPromise } = require('../utils/exec');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Byte formatla (KB, MB, GB)
 */
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Uptime formatla (gün, saat, dakika)
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} gün ${hours} saat ${minutes} dakika`;
}

// ============================================================================
// SYSTEM INFORMATION (from systemService.js)
// ============================================================================

/**
 * Detaylı sistem bilgisi al
 */
async function getSystemInfo() {
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const osInfo = await si.osInfo();
        const disk = await si.fsSize();
        const temp = await si.cpuTemperature();
        const graphics = await si.graphics();

        let info = '*Detaylı Sistem Bilgisi*\n\n';

        // İşletim Sistemi
        info += '*İşletim Sistemi:*\n';
        info += `• İsim: ${osInfo.distro || 'Bilinmiyor'}\n`;
        info += `• Sürüm: ${osInfo.release || 'Bilinmiyor'}\n`;
        info += `• Platform: ${osInfo.platform || 'Bilinmiyor'}\n`;
        info += `• Mimar: ${osInfo.arch || 'Bilinmiyor'}\n`;
        info += `• Çalışma Süresi: ${formatUptime(os.uptime())}\n\n`;

        // CPU
        const cpuTemp = await si.cpuTemperature();
        info += '*İşlemci (CPU):*\n';
        info += `• Üretici: ${cpu.manufacturer || 'Bilinmiyor'}\n`;
        info += `• Model: ${cpu.brand || 'Bilinmiyor'}\n`;
        info += `• Çekirdek Sayısı: ${cpu.cores || 'Bilinmiyor'}\n`;
        info += `• Hız: ${cpu.speed ? cpu.speed + ' GHz' : 'Bilinmiyor'}\n`;
        info += `• Sıcaklık: ${cpuTemp?.main ? cpuTemp.main + '°C' : (cpuTemp?.max ? cpuTemp.max + '°C' : 'Sensör yok')}\n\n`;

        // RAM
        info += '*Bellek (RAM):*\n';
        info += `• Toplam: ${formatBytes(mem.total)}\n`;
        info += `• Kullanılan: ${formatBytes(mem.used)} (%${((mem.used / mem.total) * 100).toFixed(1)})\n`;
        info += `• Boş: ${formatBytes(mem.free)} (%${((mem.free / mem.total) * 100).toFixed(1)})\n\n`;

        // Disk
        info += '*Disk Kullanımı:*\n';
        disk.forEach(d => {
            info += `*${d.fs}:*\n`;
            info += `• Toplam: ${formatBytes(d.size)}\n`;
            info += `• Kullanılan: ${formatBytes(d.used)} (%${d.use?.toFixed(1) || 'Bilinmiyor'})\n`;
            info += `• Boş: ${formatBytes(d.available)}\n\n`;
        });

        // GPU
        if (graphics.controllers && graphics.controllers.length > 0) {
            info += '*Ekran Kartı (GPU):*\n';
            graphics.controllers.forEach((gpu, index) => {
                info += `*GPU ${index + 1}:* ${gpu.model || 'Bilinmiyor'}\n`;
                const vram = gpu.vram || gpu.memoryTotal || gpu.memoryFree;
                info += `• VRAM: ${vram ? (vram + ' MB') : 'Tespit edilemedi'}\n\n`;
            });
        }

        return info;
    } catch (error) {
        console.error('Sistem bilgisi hatası:', error);
        return 'Sistem bilgisi alınamadı: ' + error.message;
    }
}

/**
 * CPU kullanımı al
 */
async function getCPUUsage() {
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;

    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpuCount;
    const total = totalTick / cpuCount;
    const usage = (100 - ~~(100 * idle / total)).toFixed(1);

    return {
        model: cpuModel,
        cores: cpuCount,
        usage: usage
    };
}

/**
 * RAM kullanımı al
 */
function getRAMUsage() {
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const usagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    return {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: usagePercent
    };
}

/**
 * Sıcaklık bilgisi al
 */
async function getTemperature() {
    try {
        const temp = await si.cpuTemperature();
        const graphics = await si.graphics();
        const baseTemp = await si.baseboard();

        let message = '*Sistem Sıcaklıkları*\n\n';

        // CPU Sıcaklığı
        if (temp.main) {
            message += `*CPU:* ${temp.main}°C\n`;
            if (temp.max) message += `   • Maksimum: ${temp.max}°C\n`;
            if (temp.cores && temp.cores.length > 0) {
                const avgCore = (temp.cores.reduce((a, b) => a + b, 0) / temp.cores.length).toFixed(1);
                message += `   • Çekirdek Ortalaması: ${avgCore}°C\n`;
            }
        } else {
            message += `*CPU:* Sensör yok\n`;
        }

        // GPU Sıcaklığı
        if (graphics.controllers && graphics.controllers.length > 0) {
            graphics.controllers.forEach((gpu, index) => {
                if (gpu.temperatureGpu) {
                    message += `*GPU ${index + 1}:* ${gpu.temperatureGpu}°C (${gpu.model})\n`;
                }
            });
        }

        // Anakart sıcaklığı
        if (baseTemp.temperature) {
            message += `*Anakart:* ${baseTemp.temperature}°C\n`;
        }

        if (!temp.main && (!graphics.controllers || graphics.controllers.every(g => !g.temperatureGpu))) {
            message += '\nSistemde sıcaklık sensörü tespit edilemedi.\n';
            message += 'Masaüstü PC\'lerde sıcaklık bilgisi genellikle BIOS/UEFI\'den alınır.';
        }

        return message;
    } catch (error) {
        return 'Sıcaklık bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Çalışan programları listele
 */
async function getRunningPrograms() {
    try {
        const { stdout } = await execPromise('tasklist /FO CSV /NH');
        const processes = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [name, pid] = line.replace(/"/g, '').split(',');
                return { name, pid };
            })
            .slice(0, 50);

        let message = '*Çalışan Programlar (İlk 50):*\n\n';
        processes.forEach((proc, index) => {
            message += `${index + 1}. ${proc.name} (PID: ${proc.pid})\n`;
        });

        message += `\nTüm programları dosya olarak görmek için "Program Listesi (TXT)" butonunu kullanın.`;

        return message;
    } catch (error) {
        return 'Program listesi alınamadı: ' + error.message;
    }
}

/**
 * Çalışan programları TXT dosyası olarak oluştur
 */
async function getRunningProgramsFile() {
    try {
        const { stdout } = await execPromise('tasklist /FO CSV');
        const filePath = path.join(__dirname, '../../temp/running_programs.txt');

        // Temp klasörü yoksa oluştur
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Dosyayı oluştur
        const timestamp = new Date().toLocaleString('tr-TR');
        let fileContent = `Çalışan Programlar Raporu\n`;
        fileContent += `Tarih: ${timestamp}\n`;
        fileContent += `${'='.repeat(80)}\n\n`;
        fileContent += stdout;

        fs.writeFileSync(filePath, fileContent, 'utf8');

        return {
            success: true,
            filePath: filePath,
            message: 'Program listesi TXT dosyası olarak hazırlandı.'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Program listesi dosyası oluşturulamadı: ' + error.message
        };
    }
}

// ============================================================================
// PERFORMANCE TRACKING (from performanceService.js)
// ============================================================================

// Performans geçmişi
let performanceHistory = {
    cpu: [],
    ram: [],
    timestamps: [],
    _lock: false
};

/**
 * Performans verisi topla
 */
async function collectPerformanceData() {
    // Wait for lock
    let waitCount = 0;
    while (performanceHistory._lock && waitCount < 100) {
        await new Promise(resolve => setTimeout(resolve, 10));
        waitCount++;
    }

    if (performanceHistory._lock) {
        console.warn('Performans verisi toplamada lock timeout');
        return;
    }

    performanceHistory._lock = true;

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
    } finally {
        performanceHistory._lock = false;
    }
}

/**
 * Performans grafiği oluştur
 */
async function getPerformanceChart() {
    try {
        if (performanceHistory.cpu.length === 0) {
            return 'Henüz yeterli veri toplanmadı. Lütfen birkaç dakika bekleyin.';
        }

        let message = '*Performans Grafiği (Son 10 Kayıt)*\n\n';

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

            message += `${time}\n`;
            message += `CPU: ${cpuBars}${cpuSpaces} ${cpu.toFixed(1)}%\n`;
            message += `RAM: ${ramBars}${ramSpaces} ${ram.toFixed(1)}%\n\n`;
        }

        return message;
    } catch (error) {
        return 'Performans grafiği oluşturulamadı: ' + error.message;
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

        let health = '*Sistem Sağlığı*\n\n';

        // CPU kontrolü
        if (cpu.currentLoad < 50) {
            health += 'CPU: Normal (%' + cpu.currentLoad.toFixed(1) + ')\n';
        } else if (cpu.currentLoad < 80) {
            health += 'CPU: Yüksek (%' + cpu.currentLoad.toFixed(1) + ')\n';
        } else {
            health += 'CPU: Kritik (%' + cpu.currentLoad.toFixed(1) + ')\n';
        }

        // RAM kontrolü
        const ramUsage = (mem.used / mem.total) * 100;
        if (ramUsage < 70) {
            health += 'RAM: Normal (%' + ramUsage.toFixed(1) + ')\n';
        } else if (ramUsage < 90) {
            health += 'RAM: Yüksek (%' + ramUsage.toFixed(1) + ')\n';
        } else {
            health += 'RAM: Kritik (%' + ramUsage.toFixed(1) + ')\n';
        }

        // Sıcaklık kontrolü
        if (temp.main) {
            if (temp.main < 70) {
                health += 'Sıcaklık: Normal (' + temp.main + '°C)\n';
            } else if (temp.main < 85) {
                health += 'Sıcaklık: Yüksek (' + temp.main + '°C)\n';
            } else {
                health += 'Sıcaklık: Kritik (' + temp.main + '°C)\n';
            }
        }

        // Disk kontrolü
        disk.forEach(d => {
            if (d.use < 80) {
                health += `Disk ${d.fs}: Normal (%${d.use.toFixed(1)})\n`;
            } else if (d.use < 95) {
                health += `Disk ${d.fs}: Yüksek (%${d.use.toFixed(1)})\n`;
            } else {
                health += `Disk ${d.fs}: Kritik (%${d.use.toFixed(1)})\n`;
            }
        });

        return health;
    } catch (error) {
        return 'Sistem sağlığı alınamadı: ' + error.message;
    }
}

// Performans interval
let performanceInterval = null;

function startPerformanceCollection() {
    if (performanceInterval) {
        console.log('Performans toplama zaten aktif.');
        return;
    }

    performanceInterval = setInterval(collectPerformanceData, 10000);
    console.log('Performans veri toplama başlatıldı (her 10 saniyede bir).');
}

function stopPerformanceCollection() {
    if (performanceInterval) {
        clearInterval(performanceInterval);
        performanceInterval = null;
        console.log('Performans veri toplama durduruldu.');
    }
}

function getPerformanceHistory() {
    return performanceHistory;
}

// ============================================================================
// DISK MANAGEMENT (from diskService.js)
// ============================================================================

/**
 * Disk kullanımı bilgisi al
 */
async function getDiskUsage() {
    try {
        const disks = await si.fsSize();

        let message = '*Disk Kullanımı*\n\n';

        disks.forEach(disk => {
            message += `*${disk.fs}* (${disk.type})\n`;
            message += `• Toplam: ${formatBytes(disk.size)}\n`;
            message += `• Kullanılan: ${formatBytes(disk.used)} (%${disk.use.toFixed(1)})\n`;
            message += `• Boş: ${formatBytes(disk.available)}\n\n`;
        });

        return message;
    } catch (error) {
        return 'Disk bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Disk analizi
 */
async function analyzeDisk() {
    try {
        const { stdout } = await execPromise('dir C:\\ /s /-c', { timeout: 30000 });

        let message = '*Disk Analizi*\n\n';
        message += 'C:\\ sürücüsü analiz ediliyor...\n\n';

        const lines = stdout.split('\n');
        const lastLines = lines.slice(-5).join('\n');
        message += `\`\`\`\n${lastLines}\n\`\`\``;

        return message;
    } catch (error) {
        return 'Disk analizi başarısız: ' + error.message;
    }
}

/**
 * Disk temizliği
 */
async function cleanDisk() {
    try {
        await execPromise('cleanmgr /sagerun:1', { timeout: 60000 });
        return 'Disk temizliği başlatıldı. Windows Disk Cleanup aracı çalışıyor...';
    } catch (error) {
        return 'Disk temizliği başarısız: ' + error.message;
    }
}

/**
 * Geçici dosyaları temizle
 */
async function cleanTempFiles() {
    try {
        const tempPath = process.env.TEMP || 'C:\\Windows\\Temp';
        await execPromise(`del /q /f /s "${tempPath}\\*"`, { timeout: 30000 });
        return 'Geçici dosyalar temizlendi.';
    } catch (error) {
        return 'Geçici dosya temizleme başarısız: ' + error.message;
    }
}

// ============================================================================
// POWER MANAGEMENT (from powerService.js)
// ============================================================================

/**
 * Bilgisayarı kilitle
 */
async function lockSystem() {
    try {
        await execPromise('rundll32.exe user32.dll,LockWorkStation');
        return 'Bilgisayar kilitlendi.';
    } catch (error) {
        return 'Kilitleme başarısız: ' + error.message;
    }
}

/**
 * Bilgisayar kilidini aç
 */
async function unlockSystem() {
    try {
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys(\'{ENTER}\')"');
        return 'Kilit açma komutu gönderildi (ENTER tuşu).';
    } catch (error) {
        return 'Kilit açma başarısız: ' + error.message;
    }
}

/**
 * Uyku moduna al
 */
async function sleepMode() {
    try {
        await execPromise('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return 'Bilgisayar uyku moduna alınıyor...';
    } catch (error) {
        return 'Uyku modu başarısız: ' + error.message;
    }
}

/**
 * Sistemi yeniden başlat
 */
async function rebootSystem() {
    try {
        await execPromise('shutdown /r /t 60 /c "Sistem 60 saniye içinde yeniden başlatılacak"');
        return 'Sistem 60 saniye içinde yeniden başlatılacak...';
    } catch (error) {
        return 'Yeniden başlatma başarısız: ' + error.message;
    }
}

/**
 * Sistemi kapat
 */
async function shutdownSystem(minutes = 0) {
    try {
        if (minutes === 0) {
            await execPromise('shutdown /s /t 0');
            return 'Bilgisayar hemen kapatılıyor...';
        } else {
            const seconds = minutes * 60;
            await execPromise(`shutdown /s /t ${seconds}`);
            return `Bilgisayar ${minutes} dakika sonra kapatılacak.`;
        }
    } catch (error) {
        return 'Kapatma başarısız: ' + error.message;
    }
}

/**
 * Kapatma iptal et
 */
async function cancelShutdown() {
    try {
        await execPromise('shutdown /a');
        return 'Kapatma işlemi iptal edildi.';
    } catch (error) {
        return 'İptal başarısız: ' + error.message;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Utility functions
    formatBytes,
    formatUptime,

    // System Information
    getSystemInfo,
    getCPUUsage,
    getRAMUsage,
    getTemperature,
    getRunningPrograms,
    getRunningProgramsFile,

    // Performance Tracking
    collectPerformanceData,
    getPerformanceChart,
    getSystemHealth,
    startPerformanceCollection,
    stopPerformanceCollection,
    getPerformanceHistory,

    // Disk Management
    getDiskUsage,
    analyzeDisk,
    cleanDisk,
    cleanTempFiles,

    // Power Management
    lockSystem,
    unlockSystem,
    sleepMode,
    rebootSystem,
    shutdownSystem,
    cancelShutdown
};
