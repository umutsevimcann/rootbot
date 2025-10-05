const fs = require('fs');
const path = require('path');
const config = require('../config/env');

/**
 * Tüm ayarları göster (.env tabanlı)
 */
function getAllSettings() {
    try {
        const envPath = path.join(__dirname, '../../.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        let message = '*⚙️ RootBot Ayarları*\n\n';

        // Telegram ayarları
        message += '*📱 Telegram:*\n';
        message += `• Bot Token: ${config.telegram.token ? '✅ Tanımlı' : '❌ Tanımsız'}\n`;
        message += `• Yetkili Kullanıcı: ${config.telegram.allowedUserId}\n\n`;

        // Environment
        message += '*🌍 Environment:*\n';
        message += `• NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`;
        message += `• LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}\n`;

        return message;
    } catch (error) {
        return '❌ Ayarlar alınamadı: ' + error.message;
    }
}

/**
 * Kategori durumunu değiştir - DEPRECATED (config.json kaldırıldı)
 */
function toggleCategory(categoryKey) {
    return '⚠️ Bu özellik artık desteklenmiyor. Tüm özellikler varsayılan olarak aktiftir.';
}

/**
 * Tüm kategorileri aç - DEPRECATED (config.json kaldırıldı)
 */
function enableAllCategories() {
    return '⚠️ Bu özellik artık desteklenmiyor. Tüm özellikler varsayılan olarak aktiftir.';
}

/**
 * Tüm kategorileri kapat - DEPRECATED (config.json kaldırıldı)
 */
function disableAllCategories() {
    return '⚠️ Bu özellik artık desteklenmiyor. Tüm özellikler varsayılan olarak aktiftir.';
}

/**
 * Bot bilgisi
 */
function getBotInfo() {
    const packageJson = require('../../package.json');
    const os = require('os');

    let message = '*🤖 RootBot Bilgileri*\n\n';
    message += `*Versiyon:* ${packageJson.version}\n`;
    message += `*İsim:* ${packageJson.name}\n`;
    message += `*Açıklama:* ${packageJson.description}\n\n`;

    message += `*💻 Sistem:*\n`;
    message += `• Platform: ${os.platform()}\n`;
    message += `• Node.js: ${process.version}\n`;
    message += `• Hostname: ${os.hostname()}\n`;

    return message;
}

module.exports = {
    getAllSettings,
    toggleCategory,
    enableAllCategories,
    disableAllCategories,
    getBotInfo
};
