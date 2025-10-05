const si = require('systeminformation');
const os = require('os');
const { execPromise } = require('../utils/exec');

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
        const network = await si.networkInterfaces();

        let info = '*💻 Detaylı Sistem Bilgisi*\n\n';

        // İşletim Sistemi
        info += '*🖥️ İşletim Sistemi:*\n';
        info += `• İsim: ${osInfo.distro || 'Bilinmiyor'}\n`;
        info += `• Sürüm: ${osInfo.release || 'Bilinmiyor'}\n`;
        info += `• Platform: ${osInfo.platform || 'Bilinmiyor'}\n`;
        info += `• Mimar: ${osInfo.arch || 'Bilinmiyor'}\n`;
        info += `• Çalışma Süresi: ${formatUptime(os.uptime())}\n\n`;

        // CPU
        const cpuTemp = await si.cpuTemperature();
        info += '*⚡ İşlemci (CPU):*\n';
        info += `• Üretici: ${cpu.manufacturer || 'Bilinmiyor'}\n`;
        info += `• Model: ${cpu.brand || 'Bilinmiyor'}\n`;
        info += `• Çekirdek Sayısı: ${cpu.cores || 'Bilinmiyor'}\n`;
        info += `• Hız: ${cpu.speed ? cpu.speed + ' GHz' : 'Bilinmiyor'}\n`;
        info += `• Sıcaklık: ${cpuTemp?.main ? cpuTemp.main + '°C' : (cpuTemp?.max ? cpuTemp.max + '°C' : 'Sensör yok')}\n\n`;

        // RAM
        info += '*🧠 Bellek (RAM):*\n';
        info += `• Toplam: ${formatBytes(mem.total)}\n`;
        info += `• Kullanılan: ${formatBytes(mem.used)} (%${((mem.used / mem.total) * 100).toFixed(1)})\n`;
        info += `• Boş: ${formatBytes(mem.free)} (%${((mem.free / mem.total) * 100).toFixed(1)})\n\n`;

        // Disk
        info += '*💾 Disk Kullanımı:*\n';
        disk.forEach(d => {
            info += `*${d.fs}:*\n`;
            info += `• Toplam: ${formatBytes(d.size)}\n`;
            info += `• Kullanılan: ${formatBytes(d.used)} (%${d.use?.toFixed(1) || 'Bilinmiyor'})\n`;
            info += `• Boş: ${formatBytes(d.available)}\n\n`;
        });

        // GPU
        if (graphics.controllers && graphics.controllers.length > 0) {
            info += '*🎮 Ekran Kartı (GPU):*\n';
            graphics.controllers.forEach((gpu, index) => {
                info += `*GPU ${index + 1}:* ${gpu.model || 'Bilinmiyor'}\n`;
                const vram = gpu.vram || gpu.memoryTotal || gpu.memoryFree;
                info += `• VRAM: ${vram ? (vram + ' MB') : 'Tespit edilemedi'}\n\n`;
            });
        }

        return info;
    } catch (error) {
        console.error('Sistem bilgisi hatası:', error);
        return '❌ Sistem bilgisi alınamadı: ' + error.message;
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

        let message = '*🌡️ Sistem Sıcaklıkları*\n\n';

        // CPU Sıcaklığı
        if (temp.main) {
            message += `🔥 *CPU:* ${temp.main}°C\n`;
            if (temp.max) message += `   • Maksimum: ${temp.max}°C\n`;
            if (temp.cores && temp.cores.length > 0) {
                const avgCore = (temp.cores.reduce((a, b) => a + b, 0) / temp.cores.length).toFixed(1);
                message += `   • Çekirdek Ortalaması: ${avgCore}°C\n`;
            }
        } else {
            message += `🔥 *CPU:* Sensör yok\n`;
        }

        // GPU Sıcaklığı
        if (graphics.controllers && graphics.controllers.length > 0) {
            graphics.controllers.forEach((gpu, index) => {
                if (gpu.temperatureGpu) {
                    message += `🎮 *GPU ${index + 1}:* ${gpu.temperatureGpu}°C (${gpu.model})\n`;
                }
            });
        }

        // Anakart sıcaklığı (varsa)
        if (baseTemp.temperature) {
            message += `🖥️ *Anakart:* ${baseTemp.temperature}°C\n`;
        }

        // Eğer hiç sıcaklık verisi yoksa
        if (!temp.main && (!graphics.controllers || graphics.controllers.every(g => !g.temperatureGpu))) {
            message += '\n⚠️ Sistemde sıcaklık sensörü tespit edilemedi.\n';
            message += '💡 Masaüstü PC\'lerde sıcaklık bilgisi genellikle BIOS/UEFI\'den alınır.';
        }

        return message;
    } catch (error) {
        return '❌ Sıcaklık bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Çalışan programları listele (Telegram mesaj olarak - ilk 50)
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

        let message = '*💻 Çalışan Programlar (İlk 50):*\n\n';
        processes.forEach((proc, index) => {
            message += `${index + 1}. ${proc.name} (PID: ${proc.pid})\n`;
        });

        message += `\n📄 Tüm programları dosya olarak görmek için "📄 Program Listesi (TXT)" butonunu kullanın.`;

        return message;
    } catch (error) {
        return '❌ Program listesi alınamadı: ' + error.message;
    }
}

/**
 * Çalışan programları TXT dosyası olarak oluştur
 */
async function getRunningProgramsFile() {
    try {
        const fs = require('fs');
        const path = require('path');

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
            message: '📄 Program listesi TXT dosyası olarak hazırlandı.'
        };
    } catch (error) {
        return {
            success: false,
            message: '❌ Program listesi dosyası oluşturulamadı: ' + error.message
        };
    }
}

module.exports = {
    getSystemInfo,
    getCPUUsage,
    getRAMUsage,
    getTemperature,
    getRunningPrograms,
    getRunningProgramsFile,
    formatBytes,
    formatUptime
};
