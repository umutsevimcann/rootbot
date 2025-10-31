const notifier = require('node-notifier');
const { execPromise } = require('../utils/exec');

/**
 * Windows bildirimi gönder
 */
function sendNotification(title, message, icon = 'info') {
    return new Promise((resolve, reject) => {
        notifier.notify({
            title: title,
            message: message,
            icon: icon === 'error' ? notifier.WindowsToaster.Sound.SMS : undefined,
            sound: true,
            wait: false
        }, (err, response) => {
            if (err) reject(err);
            else resolve(response);
        });
    });
}

/**
 * Windows bildirimlerini al
 */
async function getWindowsNotifications() {
    try {
        // Windows 10/11 bildirim merkezi
        const { stdout } = await execPromise('powershell -Command "Get-WinEvent -LogName Application -MaxEvents 10 | Select-Object TimeCreated, Message | ConvertTo-Json"');

        let notifications;
        try {
            notifications = JSON.parse(stdout);
            if (!Array.isArray(notifications)) {
                notifications = [notifications];
            }
        } catch (e) {
            return 'Bildirim bulunamadı.';
        }

        let message = '*Son Windows Bildirimleri*\n\n';

        notifications.slice(0, 5).forEach((notif, index) => {
            const time = new Date(notif.TimeCreated).toLocaleString('tr-TR');
            const msg = notif.Message ? notif.Message.substring(0, 100) : 'Bilgi yok';
            message += `${index + 1}. [${time}]\n   ${msg}...\n\n`;
        });

        return message;
    } catch (error) {
        console.error('Bildirim alma hatası:', error);
        return 'Bildirimler alınamadı: ' + error.message;
    }
}

/**
 * Test bildirimi gönder
 */
async function sendTestNotification() {
    try {
        await sendNotification('RootBot Test', 'Bildirim sistemi çalışıyor!', 'info');
        return 'Test bildirimi gönderildi!';
    } catch (error) {
        return 'Test bildirimi gönderilemedi: ' + error.message;
    }
}

/**
 * Özel bildirim gönder
 */
async function sendCustomNotification(title, message) {
    try {
        await sendNotification(title, message, 'info');
        return `Bildirim gönderildi: ${title}`;
    } catch (error) {
        return 'Bildirim gönderilemedi: ' + error.message;
    }
}

module.exports = {
    sendNotification,
    getWindowsNotifications,
    sendTestNotification,
    sendCustomNotification
};
