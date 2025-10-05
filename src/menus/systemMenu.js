/**
 * Sistem menüsü klavyesi
 */
function getSystemMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['📊 Sistem Bilgisi', '🌡️ Sıcaklık'],
                ['💻 Çalışan Programlar', '📄 Program Listesi (TXT)'],
                ['🚀 Program Başlat', '❌ Program Kapat'],
                ['💻 Komut Çalıştır', '🖥️ Ekran Kapat'],
                ['🖥️ Masaüstü Göster', '🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Sistem menüsünü gönder
 */
async function sendSystemMenu(bot, chatId) {
    try {
        const message = '🖥️ *Sistem & Uzaktan Kontrol*\n\nSistem yönetimi ve uzaktan kontrol işlemleri:';
        const keyboard = getSystemMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Sistem menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

module.exports = {
    getSystemMenuKeyboard,
    sendSystemMenu
};
