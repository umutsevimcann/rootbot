const { execPromise } = require('../utils/exec');
const si = require('systeminformation');

/**
 * Sistem Olayı İzleme Servisi
 * USB, Pil, İnternet Bağlantısı, CPU, vb. olayları izler
 */

// Global değişkenler
let usbMonitor = null;
let batteryMonitor = null;
let networkMonitor = null;
let cpuMonitor = null;

let lastUSBDevices = [];
let lastBatteryLevel = 100;
let lastNetworkStatus = true;
let lastCPULoad = 0;

// Callback fonksiyonları (Telegram bildirimi için)
let onUSBChange = null;
let onBatteryLow = null;
let onNetworkChange = null;
let onCPUHigh = null;

/**
 * USB izleme başlat
 */
async function startUSBMonitoring(callback) {
    try {
        if (usbMonitor) {
            return 'USB izleme zaten aktif.';
        }

        onUSBChange = callback;

        // İlk durumu al
        lastUSBDevices = await getCurrentUSBDevices();

        // Her 15 saniyede bir kontrol (optimize edilmiş)
        usbMonitor = setInterval(async () => {
            try {
                const currentDevices = await getCurrentUSBDevices();

                // Yeni cihaz takıldı mı?
                const newDevices = currentDevices.filter(
                    device => !lastUSBDevices.some(old => old.id === device.id)
                );

                // Cihaz çıkarıldı mı?
                const removedDevices = lastUSBDevices.filter(
                    device => !currentDevices.some(current => current.id === device.id)
                );

                if (newDevices.length > 0 && onUSBChange) {
                    newDevices.forEach(device => {
                        onUSBChange(`*USB Cihaz Takıldı*\n\n${device.name}`);
                    });
                }

                if (removedDevices.length > 0 && onUSBChange) {
                    removedDevices.forEach(device => {
                        onUSBChange(`*USB Cihaz Çıkarıldı*\n\n${device.name}`);
                    });
                }

                lastUSBDevices = currentDevices;
            } catch (err) {
                console.error('USB monitoring error:', err);
            }
        }, 15000);

        return 'USB izleme başlatıldı. USB cihaz değişikliklerinde bildirim gönderilecek.';
    } catch (error) {
        return 'USB izleme başlatılamadı: ' + error.message;
    }
}

/**
 * USB izlemeyi durdur
 */
function stopUSBMonitoring() {
    if (!usbMonitor) {
        return 'USB izleme zaten pasif.';
    }

    clearInterval(usbMonitor);
    usbMonitor = null;
    onUSBChange = null;
    return 'USB izleme durduruldu.';
}

/**
 * Pil izleme başlat (Dizüstü bilgisayarlar için)
 */
async function startBatteryMonitoring(callback, threshold = 20) {
    try {
        if (batteryMonitor) {
            return 'Pil izleme zaten aktif.';
        }

        onBatteryLow = callback;

        // Her 30 saniyede bir kontrol
        batteryMonitor = setInterval(async () => {
            try {
                const battery = await si.battery();

                if (!battery.hasBattery) {
                    return; // Masaüstü bilgisayar
                }

                const currentLevel = battery.percent;
                const isCharging = battery.isCharging;

                // Pil %20'nin altına düştüyse ve şarj olmuyor
                if (currentLevel <= threshold && !isCharging && currentLevel !== lastBatteryLevel) {
                    if (onBatteryLow) {
                        onBatteryLow(`*Düşük Pil Uyarısı!*\n\nPil seviyesi: %${currentLevel}\nŞarj durumu: ${isCharging ? 'Şarj oluyor' : 'Şarj olmuyor'}\n\nLütfen şarj cihazını takın!`);
                    }
                }

                // Pil %10'un altında kritik uyarı
                if (currentLevel <= 10 && !isCharging && lastBatteryLevel > 10) {
                    if (onBatteryLow) {
                        onBatteryLow(`*KRİTİK! Pil Bitmek Üzere!*\n\nPil seviyesi: %${currentLevel}\n\nHEMEN ŞARJ CİHAZINI TAKIN!`);
                    }
                }

                lastBatteryLevel = currentLevel;
            } catch (err) {
                console.error('Battery monitoring error:', err);
            }
        }, 30000); // 30 saniyede bir

        return `Pil izleme başlatıldı. Pil %${threshold}'nin altına düşerse bildirim gönderilecek.`;
    } catch (error) {
        return 'Pil izleme başlatılamadı: ' + error.message;
    }
}

/**
 * Pil izlemeyi durdur
 */
function stopBatteryMonitoring() {
    if (!batteryMonitor) {
        return 'Pil izleme zaten pasif.';
    }

    clearInterval(batteryMonitor);
    batteryMonitor = null;
    onBatteryLow = null;
    return 'Pil izleme durduruldu.';
}

/**
 * İnternet bağlantı izleme başlat
 */
async function startNetworkMonitoring(callback) {
    try {
        if (networkMonitor) {
            return 'İnternet izleme zaten aktif.';
        }

        onNetworkChange = callback;

        // İlk durumu al
        lastNetworkStatus = await checkInternetConnection();

        // Her 10 saniyede bir kontrol
        networkMonitor = setInterval(async () => {
            try {
                const currentStatus = await checkInternetConnection();

                if (currentStatus !== lastNetworkStatus) {
                    if (onNetworkChange) {
                        if (currentStatus) {
                            onNetworkChange('*İnternet Bağlantısı Geri Geldi!*\n\nİnternet bağlantısı yeniden kuruldu.');
                        } else {
                            onNetworkChange('*İnternet Bağlantısı Kesildi!*\n\nİnternet bağlantısı yok. Lütfen kontrol edin.');
                        }
                    }
                    lastNetworkStatus = currentStatus;
                }
            } catch (err) {
                console.error('Network monitoring error:', err);
            }
        }, 10000); // 10 saniyede bir

        return 'İnternet izleme başlatıldı. Bağlantı değişikliklerinde bildirim gönderilecek.';
    } catch (error) {
        return 'İnternet izleme başlatılamadı: ' + error.message;
    }
}

/**
 * İnternet izlemeyi durdur
 */
function stopNetworkMonitoring() {
    if (!networkMonitor) {
        return 'İnternet izleme zaten pasif.';
    }

    clearInterval(networkMonitor);
    networkMonitor = null;
    onNetworkChange = null;
    return 'İnternet izleme durduruldu.';
}

/**
 * CPU yüksek kullanım izleme başlat
 */
async function startCPUMonitoring(callback, threshold = 90, duration = 5) {
    try {
        if (cpuMonitor) {
            return 'CPU izleme zaten aktif.';
        }

        onCPUHigh = callback;
        let highCPUCounter = 0;

        // Her 10 saniyede bir kontrol
        cpuMonitor = setInterval(async () => {
            try {
                const cpu = await si.currentLoad();
                const currentLoad = Math.round(cpu.currentLoad);

                if (currentLoad >= threshold) {
                    highCPUCounter++;

                    // N dakika boyunca yüksek kaldıysa bildir
                    if (highCPUCounter >= (duration * 60 / 10)) {
                        if (onCPUHigh) {
                            // En çok CPU kullanan 3 işlemi bul
                            const processes = await si.processes();
                            const topProcesses = processes.list
                                .sort((a, b) => b.cpu - a.cpu)
                                .slice(0, 3)
                                .map((p, i) => `${i + 1}. ${p.name} (%${p.cpu.toFixed(1)})`)
                                .join('\n');

                            onCPUHigh(`*Yüksek CPU Kullanımı Uyarısı!*\n\nCPU: %${currentLoad}\nSüre: ${duration} dakikadan fazla\n\n*En Çok CPU Kullanan İşlemler:*\n${topProcesses}\n\nSistem yavaşlayabilir!`);
                        }
                        highCPUCounter = 0; // Tekrar bildirim göndermemek için sıfırla
                    }
                } else {
                    highCPUCounter = 0; // Normal seviyeye döndü
                }

                lastCPULoad = currentLoad;
            } catch (err) {
                console.error('CPU monitoring error:', err);
            }
        }, 10000); // 10 saniyede bir

        return `CPU izleme başlatıldı. CPU %${threshold}'ın üzerinde ${duration} dakika kalırsa bildirim gönderilecek.`;
    } catch (error) {
        return 'CPU izleme başlatılamadı: ' + error.message;
    }
}

/**
 * CPU izlemeyi durdur
 */
function stopCPUMonitoring() {
    if (!cpuMonitor) {
        return 'CPU izleme zaten pasif.';
    }

    clearInterval(cpuMonitor);
    cpuMonitor = null;
    onCPUHigh = null;
    return 'CPU izleme durduruldu.';
}

/**
 * Tüm izlemeleri başlat
 */
async function startAllMonitoring(callbacks) {
    const results = [];

    if (callbacks.onUSBChange) {
        results.push(await startUSBMonitoring(callbacks.onUSBChange));
    }

    if (callbacks.onBatteryLow) {
        results.push(await startBatteryMonitoring(callbacks.onBatteryLow));
    }

    if (callbacks.onNetworkChange) {
        results.push(await startNetworkMonitoring(callbacks.onNetworkChange));
    }

    if (callbacks.onCPUHigh) {
        results.push(await startCPUMonitoring(callbacks.onCPUHigh));
    }

    return results.join('\n');
}

/**
 * Tüm izlemeleri durdur
 */
function stopAllMonitoring() {
    const results = [];

    results.push(stopUSBMonitoring());
    results.push(stopBatteryMonitoring());
    results.push(stopNetworkMonitoring());
    results.push(stopCPUMonitoring());

    return results.join('\n');
}

/**
 * İzleme durumunu al
 */
function getMonitoringStatus() {
    let status = '*İzleme Durumu*\n\n';

    status += `*USB İzleme:* ${usbMonitor ? 'Aktif' : 'Pasif'}\n`;
    status += `*Pil İzleme:* ${batteryMonitor ? 'Aktif' : 'Pasif'}\n`;
    status += `*İnternet İzleme:* ${networkMonitor ? 'Aktif' : 'Pasif'}\n`;
    status += `*CPU İzleme:* ${cpuMonitor ? 'Aktif' : 'Pasif'}\n`;

    return status;
}

// Helper fonksiyonlar

/**
 * Mevcut USB cihazlarını al
 */
async function getCurrentUSBDevices() {
    try {
        const { stdout } = await execPromise(
            `powershell -Command "Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match '^USB' } | Select-Object FriendlyName, InstanceId | ConvertTo-Json"`,
            { timeout: 8000 }
        );

        if (!stdout || !stdout.trim()) {
            return [];
        }

        let devices = [];
        try {
            const parsed = JSON.parse(stdout.trim());
            devices = Array.isArray(parsed) ? parsed : [parsed];
        } catch (err) {
            console.error('USB JSON parse hatası:', err.message);
            return [];
        }

        return devices
            .filter(d => d && d.InstanceId && d.FriendlyName)
            .map(d => ({
                id: d.InstanceId,
                name: d.FriendlyName
            }));
    } catch (error) {
        console.error('USB cihaz listesi alınamadı:', error.message);
        return [];
    }
}

/**
 * İnternet bağlantısını kontrol et
 */
async function checkInternetConnection() {
    try {
        await execPromise('ping -n 1 8.8.8.8', { timeout: 5000 });
        return true; // Bağlantı var
    } catch (error) {
        return false; // Bağlantı yok
    }
}

module.exports = {
    startUSBMonitoring,
    stopUSBMonitoring,
    startBatteryMonitoring,
    stopBatteryMonitoring,
    startNetworkMonitoring,
    stopNetworkMonitoring,
    startCPUMonitoring,
    stopCPUMonitoring,
    startAllMonitoring,
    stopAllMonitoring,
    getMonitoringStatus
};
