const activeWindow = require('active-win');

// Aktivite geçmişi
let activityLog = [];
let isMonitoring = false;
let monitoringInterval = null;

/**
 * Aktivite izlemeyi başlat
 */
function startMonitoring() {
    if (isMonitoring) {
        return 'İzleme zaten aktif.';
    }

    isMonitoring = true;

    // Her 30 saniyede bir aktif pencereyi kaydet
    monitoringInterval = setInterval(async () => {
        try {
            const window = await activeWindow();

            if (window) {
                activityLog.push({
                    timestamp: new Date(),
                    title: window.title,
                    owner: window.owner.name,
                    path: window.owner.path
                });

                // Son 100 kaydı tut
                if (activityLog.length > 100) {
                    activityLog.shift();
                }
            }
        } catch (error) {
            console.error('Aktivite izleme hatası:', error);
        }
    }, 30000); // 30 saniye

    return 'Aktivite izleme başlatıldı.';
}

/**
 * Aktivite izlemeyi durdur
 */
function stopMonitoring() {
    if (!isMonitoring) {
        return 'İzleme zaten durmuş.';
    }

    isMonitoring = false;

    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }

    return 'Aktivite izleme durduruldu.';
}

/**
 * Aktivite raporu al
 */
function getActivityReport() {
    try {
        if (activityLog.length === 0) {
            return 'Henüz aktivite kaydı yok. Önce izlemeyi başlatın.';
        }

        let report = `*Aktivite Raporu*\n\n`;
        report += `Toplam Kayıt: ${activityLog.length}\n`;
        report += `İzleme Durumu: ${isMonitoring ? 'Aktif' : 'Durmuş'}\n\n`;

        // Son 10 aktiviteyi göster
        const recentActivities = activityLog.slice(-10).reverse();

        report += '*Son 10 Aktivite:*\n\n';
        recentActivities.forEach((activity, index) => {
            const time = activity.timestamp.toLocaleTimeString('tr-TR');
            report += `${index + 1}. [${time}] ${activity.title}\n`;
            report += `   Program: ${activity.owner}\n\n`;
        });

        return report;
    } catch (error) {
        return 'Aktivite raporu alınamadı: ' + error.message;
    }
}

/**
 * Aktivite geçmişini temizle
 */
function clearActivityLog() {
    activityLog = [];
    return 'Aktivite geçmişi temizlendi.';
}

/**
 * İzleme durumunu al
 */
function getMonitoringStatus() {
    return {
        isMonitoring,
        logCount: activityLog.length,
        lastActivity: activityLog.length > 0 ? activityLog[activityLog.length - 1] : null
    };
}

/**
 * Şu anki aktif pencereyi al
 */
async function getCurrentActivity() {
    try {
        const window = await activeWindow();

        if (!window) {
            return 'Aktif pencere bulunamadı.';
        }

        let message = '*Şu Anki Aktivite*\n\n';
        message += `*Pencere:* ${window.title}\n`;
        message += `*Program:* ${window.owner.name}\n`;
        message += `*Yol:* \`${window.owner.path}\`\n`;

        return message;
    } catch (error) {
        return 'Aktif pencere bilgisi alınamadı: ' + error.message;
    }
}

module.exports = {
    startMonitoring,
    stopMonitoring,
    getActivityReport,
    clearActivityLog,
    getMonitoringStatus,
    getCurrentActivity,
    getActivityLog: () => activityLog
};
