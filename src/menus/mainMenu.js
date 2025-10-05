/**
 * Ana menü klavyesi
 */
function getMainMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🖥️ Sistem', '⚡ Güç', '🔒 Güvenlik'],
                ['💽 Disk', '📸 Ekran', '🔊 Ses'],
                ['🌐 Ağ', '📁 Dosya', '📅 Otomasyon'],
                ['📊 Performans', '🎨 Eğlence'],
                ['🖱️ Mouse/Klavye', '📋 Pano', '👁️ İzleme'],
                ['🔔 Bildirimler']
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
            persistent: true
        }
    };
}

/**
 * Ana menü hoşgeldin mesajı
 */
function getWelcomeMessage(isLocked = false) {
    return `🚀 *RootBot - Sistem Kontrol Merkezi*

Merhaba! Bilgisayarınızı uzaktan kontrol edebilirsiniz.

📱 *Anlık Durum:*
${isLocked ? '🔒 Bilgisayar şu anda kilitli' : '🔓 Bilgisayar şu anda açık'}
⏰ Son kontrol: ${new Date().toLocaleTimeString('tr-TR')}

Lütfen aşağıdaki menüden bir seçenek seçin:`;
}

/**
 * Ana menüyü gönder
 */
async function sendMainMenu(bot, chatId, isLocked = false) {
    try {
        const welcomeMessage = getWelcomeMessage(isLocked);
        const keyboard = getMainMenuKeyboard();

        await bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Ana menü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü yüklenirken bir hata oluştu.');
    }
}

module.exports = {
    getMainMenuKeyboard,
    getWelcomeMessage,
    sendMainMenu
};
