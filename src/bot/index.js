const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/env');

// Bot instance oluştur
const bot = new TelegramBot(config.telegram.token, { polling: true });

// Bot başlangıç zamanı (eski mesajları görmezden gelmek için)
const botStartTime = Math.floor(Date.now() / 1000);

// Yetkilendirme middleware
function checkAuthorization(chatId) {
    return chatId.toString() === config.telegram.allowedUserId.toString();
}

// Mesaj zaman kontrolü (eski mesajları filtrele)
function isMessageTooOld(messageDate) {
    // Mesaj bot başlamadan önce gönderildiyse true döndür
    return messageDate < botStartTime;
}

// Yetkisiz erişim mesajı
async function sendUnauthorizedMessage(chatId) {
    await bot.sendMessage(chatId, '⛔ *Yetkisiz Erişim!*\n\nBu botu kullanma yetkiniz bulunmamaktadır.', {
        parse_mode: 'Markdown'
    });
}

module.exports = {
    bot,
    botStartTime,
    checkAuthorization,
    isMessageTooOld,
    sendUnauthorizedMessage
};
