/**
 * Güvenlik menüsü klavyesi
 */
function getSecurityMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🛡️ Güvenlik Kontrolü', '📊 Güvenlik Raporu'],
                ['🧬 Antivirüs', '🔥 Güvenlik Duvarı'],
                ['🔌 USB Cihazları', '📊 Aktivite'],
                ['🌐 Website Engelle', '🌐 Engeli Kaldır'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Güvenlik menüsünü gönder
 */
async function sendSecurityMenu(bot, chatId) {
    try {
        const message = '🔒 *Güvenlik & İzleme*\n\nGüvenlik kontrolleri ve izleme işlemleri:';
        const keyboard = getSecurityMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Güvenlik menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

module.exports = {
    getSecurityMenuKeyboard,
    sendSecurityMenu
};
