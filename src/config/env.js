require('dotenv').config();

/**
 * Konfigürasyon modülü - .env dosyasından ayarları yükler
 * Validasyon ile
 */

// Validation
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
        console.error('❌ Konfigürasyon Hataları:');
        errors.forEach(err => console.error('  - ' + err));
        console.error('\n.env dosyası örneği:');
        console.error('TELEGRAM_TOKEN=your_bot_token_here');
        console.error('ALLOWED_USER_ID=your_telegram_user_id');
        process.exit(1);
    }
}

// Validate on load
validateConfig();

module.exports = {
    telegram: {
        token: process.env.TELEGRAM_TOKEN,
        allowedUserId: process.env.ALLOWED_USER_ID
    }
};
