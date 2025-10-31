require('dotenv').config();

const fs = require('fs');
const path = require('path');

/**
 * CORE CONFIG MODULE
 * PHASE 3: Consolidated from config/env.js + services/settingsService.js
 *
 * Handles all configuration and settings management
 */

// ============================================================================
// ENV CONFIGURATION & VALIDATION
// ============================================================================

/**
 * Validate configuration
 */
function validateConfig() {
    const errors = [];

    if (!process.env.TELEGRAM_TOKEN) {
        errors.push('TELEGRAM_TOKEN eksik! .env dosyasını kontrol edin.');
    }

    if (!process.env.ALLOWED_USER_ID) {
        errors.push('ALLOWED_USER_ID eksik! .env dosyasını kontrol edin.');
    }

    if (process.env.ALLOWED_USER_ID && isNaN(parseInt(process.env.ALLOWED_USER_ID))) {
        errors.push('ALLOWED_USER_ID sayı olmalı!');
    }

    if (errors.length > 0) {
        console.error('Konfigürasyon Hataları:');
        errors.forEach(err => console.error('  - ' + err));
        console.error('\n.env dosyası örneği:');
        console.error('TELEGRAM_TOKEN=your_bot_token_here');
        console.error('ALLOWED_USER_ID=your_telegram_user_id');
        process.exit(1);
    }
}

// Validate on load
validateConfig();

// Export config
const config = {
    telegram: {
        token: process.env.TELEGRAM_TOKEN,
        allowedUserId: process.env.ALLOWED_USER_ID
    }
};

// ============================================================================
// SETTINGS MANAGEMENT (from settingsService.js)
// ============================================================================

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

        let message = '*RootBot Ayarları*\n\n';

        // Telegram ayarları
        message += '*Telegram:*\n';
        message += `• Bot Token: ${config.telegram.token ? 'Tanımlı' : 'Tanımsız'}\n`;
        message += `• Yetkili Kullanıcı: ${config.telegram.allowedUserId}\n\n`;

        // Environment
        message += '*Environment:*\n';
        message += `• NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`;
        message += `• LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}\n`;

        return message;
    } catch (error) {
        return 'Ayarlar alınamadı: ' + error.message;
    }
}

/**
 * Bot bilgisi
 */
function getBotInfo() {
    const packageJson = require('../../package.json');
    const os = require('os');

    let message = '*RootBot Bilgileri*\n\n';
    message += `*Versiyon:* ${packageJson.version}\n`;
    message += `*İsim:* ${packageJson.name}\n`;
    message += `*Açıklama:* ${packageJson.description}\n\n`;

    message += `*Sistem:*\n`;
    message += `• Platform: ${os.platform()}\n`;
    message += `• Node.js: ${process.version}\n`;
    message += `• Hostname: ${os.hostname()}\n`;

    return message;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Config export (for backward compatibility)
    ...config,

    // Settings functions (from settingsService.js)
    getAllSettings,
    getBotInfo
};
