const schedule = require('node-schedule');

// Zamanlanmış görevler
const scheduledTasks = new Map();

/**
 * Görev zamanla
 */
function scheduleTask(taskName, cronTime, taskFunction) {
    try {
        // Varolan görevi iptal et
        if (scheduledTasks.has(taskName)) {
            scheduledTasks.get(taskName).cancel();
        }

        // Yeni görev oluştur
        const job = schedule.scheduleJob(cronTime, taskFunction);

        if (job) {
            scheduledTasks.set(taskName, job);
            return `Görev zamanlandı: ${taskName}\nZaman: ${cronTime}`;
        } else {
            return 'Görev zamanlanamadı. Cron formatı hatalı olabilir.';
        }
    } catch (error) {
        console.error('Görev zamanlama hatası:', error);
        return 'Görev zamanlanamadı: ' + error.message;
    }
}

/**
 * Görev iptal et
 */
function cancelScheduledTask(taskName) {
    try {
        if (scheduledTasks.has(taskName)) {
            scheduledTasks.get(taskName).cancel();
            scheduledTasks.delete(taskName);
            return `Görev iptal edildi: ${taskName}`;
        } else {
            return `Görev bulunamadı: ${taskName}`;
        }
    } catch (error) {
        return 'Görev iptal edilemedi: ' + error.message;
    }
}

/**
 * Zamanlanmış görevleri listele
 */
function listScheduledTasks() {
    try {
        if (scheduledTasks.size === 0) {
            return 'Zamanlanmış görev bulunmuyor.';
        }

        let message = '*Zamanlanmış Görevler*\n\n';
        let index = 1;

        scheduledTasks.forEach((job, taskName) => {
            const nextInvocation = job.nextInvocation();
            message += `${index}. *${taskName}*\n`;
            message += `   Sonraki Çalışma: ${nextInvocation ? nextInvocation.toString() : 'Bilinmiyor'}\n\n`;
            index++;
        });

        return message;
    } catch (error) {
        return 'Görev listesi alınamadı: ' + error.message;
    }
}

/**
 * Tüm görevleri iptal et
 */
function cancelAllTasks() {
    try {
        scheduledTasks.forEach((job) => job.cancel());
        const count = scheduledTasks.size;
        scheduledTasks.clear();
        return `${count} görev iptal edildi.`;
    } catch (error) {
        return 'Görevler iptal edilemedi: ' + error.message;
    }
}

/**
 * Cron format yardımı
 */
function getCronHelp() {
    return `*Cron Format Yardımı*

Cron formatı: \`* * * * * *\`
               ┬ ┬ ┬ ┬ ┬ ┬
               │ │ │ │ │ │
               │ │ │ │ │ └─ gün (haftanın) (0-7, 0/7=Pazar)
               │ │ │ │ └─── ay (1-12)
               │ │ │ └───── gün (ayın) (1-31)
               │ │ └─────── saat (0-23)
               │ └───────── dakika (0-59)
               └─────────── saniye (0-59, opsiyonel)

**Örnekler:**
• Her gün saat 09:00: \`0 9 * * *\`
• Her saat başı: \`0 * * * *\`
• Her 5 dakikada: \`*/5 * * * *\`
• Pazartesi saat 08:00: \`0 8 * * 1\`
• Her gece yarısı: \`0 0 * * *\`
`;
}

module.exports = {
    scheduleTask,
    cancelScheduledTask,
    listScheduledTasks,
    cancelAllTasks,
    getCronHelp,
    getScheduledTasks: () => scheduledTasks
};
