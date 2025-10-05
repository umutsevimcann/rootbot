/**
 * Ayarlar menüsü klavyesi
 */
function getSettingsMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['⚙️ Tüm Ayarlar', '🤖 Bot Bilgisi'],
                ['✅ Tümünü Aç', '❌ Tümünü Kapat'],
                ['🔄 Config Yenile'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Ayarlar menüsünü gönder
 */
async function sendSettingsMenu(bot, chatId) {
    try {
        const message = '⚙️ *Ayarlar*\n\nBot ayarlarını yönetin:';
        const keyboard = getSettingsMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Ayarlar menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

module.exports = {
    getSettingsMenuKeyboard,
    sendSettingsMenu
};
