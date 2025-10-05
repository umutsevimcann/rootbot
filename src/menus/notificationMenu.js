/**
 * Bildirimler menüsü klavyesi
 */
function getNotificationMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['📬 Bildirimleri Göster', '🔔 Test Bildirimi'],
                ['📨 Özel Bildirim Gönder'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Bildirimler menüsünü gönder
 */
async function sendNotificationMenu(bot, chatId) {
    try {
        const message = '🔔 *Bildirimler*\n\nWindows bildirim yönetimi:';
        const keyboard = getNotificationMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Bildirim menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

module.exports = {
    getNotificationMenuKeyboard,
    sendNotificationMenu
};
