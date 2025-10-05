const fs = require('fs');
const path = require('path');

// Config dosyasını yükle
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

module.exports = {
    telegram_token: config.telegram_token,
    allowed_user_id: config.allowed_user_id,
    features: config.features
};
