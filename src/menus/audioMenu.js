/**
 * Ses menüsü klavyesi
 */
function getAudioMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🔊 Ses Aç', '🔇 Sessize Al'],
                ['🔼 Ses Yükselt', '🔽 Ses Azalt'],
                ['🔊 Ses %0', '🔊 Ses %50', '🔊 Ses %100'],
                ['🎚️ Özel Ses Seviyesi'],
                ['🎵 Çalan Müzik', '📻 Ses Cihazları'],
                ['🔊 Cihaz Listesi', '🔄 Cihaz Değiştir'],
                ['🗣️ Sesli Komutlar'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Sesli komutlar menüsü
 */
function getVoiceCommandMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🔊 Merhaba De', '🔊 Uyarı Ver'],
                ['🔊 Şaka Yap', '🔊 Korkut'],
                ['🔊 Bilgisayarı Kapatıyorum', '🔊 Hacker Uyarısı'],
                ['🔊 Motivasyon', '🔊 Tebrikler'],
                ['🔊 Özel Mesaj'],
                ['🔙 Ses Menüsü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Ses menüsünü gönder
 */
async function sendAudioMenu(bot, chatId) {
    try {
        const message = '🔊 *Ses Kontrolü*\n\nSes ayarlarını yönetin:';
        const keyboard = getAudioMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Ses menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

/**
 * Sesli komutlar menüsünü gönder
 */
async function sendVoiceCommandMenu(bot, chatId) {
    try {
        const message = '🔊 *Sesli Komutlar*\n\nBilgisayardan sesli mesaj yayınlamak için bir seçenek seçin:';
        const keyboard = getVoiceCommandMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Sesli komut menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

module.exports = {
    getAudioMenuKeyboard,
    getVoiceCommandMenuKeyboard,
    sendAudioMenu,
    sendVoiceCommandMenu
};
