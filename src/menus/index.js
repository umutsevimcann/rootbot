// Tüm menüleri tek noktadan export et
const { sendMainMenu, getMainMenuKeyboard, getWelcomeMessage } = require('./mainMenu');
const { sendSystemMenu, getSystemMenuKeyboard } = require('./systemMenu');
const { sendSecurityMenu, getSecurityMenuKeyboard } = require('./securityMenu');
const { sendAudioMenu, sendVoiceCommandMenu } = require('./audioMenu');
const { sendNotificationMenu } = require('./notificationMenu');
const { sendSettingsMenu } = require('./settingsMenu');

/**
 * Güç menüsü
 */
async function sendPowerMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🔒 Kilitle', '🔓 Kilidi Aç'],
                ['💤 Uyku Modu'],
                ['🔄 Yeniden Başlat', '⚡ Kapat'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '⚡ *Güç Yönetimi*\n\nLütfen bir işlem seçin:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Disk menüsü
 */
async function sendDiskMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📊 Disk Kullanımı', '🔍 Disk Analizi'],
                ['🧹 Disk Temizliği', '🗑️ Geçici Dosyalar'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '💽 *Disk Yönetimi*\n\nDisk işlemlerini seçin:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Ağ menüsü
 */
async function sendNetworkMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📊 Ağ Trafiği', '📡 IP Bilgisi'],
                ['📶 WiFi Bilgisi', '🔍 Ağ Taraması'],
                ['🚫 Website Engelle', '🔓 Engel Kaldır'],
                ['📋 Engellenen Siteler'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '🌐 *Ağ Yönetimi*\n\nAğ işlemlerini seçin:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Performans menüsü
 */
async function sendPerformanceMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📈 Performans Grafiği', '🚀 Başlangıç'],
                ['📊 Sistem Bilgisi', '🌡️ Sıcaklık'],
                ['🧠 RAM Kullanımı', '💻 CPU Kullanımı'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '📊 *Performans İzleme*\n\nPerformans bilgilerini görüntüleyin:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Otomasyon menüsü
 */
async function sendAutomationMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['⏰ Zamanlanmış Görev', '🔄 Tekrarlı Görev'],
                ['📋 Görev Listesi', '🗑️ Görev Sil'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '📅 *Otomasyon*\n\nZamanlanmış görev yönetimi:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Ses menüsü audioMenu.js'den import edildi

/**
 * Eğlence menüsü
 */
async function sendEntertainmentMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🎬 Netflix Aç', '🎵 Spotify Aç'],
                ['🎮 Steam Aç', '💬 Discord Aç'],
                ['▶️ Medya Oynat', '⏸️ Medya Duraklat'],
                ['⏭️ Sonraki', '⏮️ Önceki'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '🎨 *Eğlence*\n\nMedya ve uygulama kontrolü:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Dosya yönetimi menüsü
 */
async function sendFileManagementMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📂 Dosya Gönder', '📥 Dosya İndir'],
                ['📋 Dosya Listele', '🗑️ Dosya Sil'],
                ['📝 Dosya Oluştur', '✏️ Dosya Düzenle'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '📁 *Dosya Yönetimi*\n\nDosya işlemlerini yönetin:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Ekran menüsü
 */
async function sendMonitorMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📸 Ekran Görüntüsü', '🎥 Ekran Kaydı'],
                ['📷 Webcam Fotoğraf', '🎬 Webcam Video'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '📸 *Ekran & Kamera*\n\nGörüntü yakalama işlemleri:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

module.exports = {
    sendMainMenu,
    sendSystemMenu,
    sendSecurityMenu,
    sendPowerMenu,
    sendDiskMenu,
    sendNetworkMenu,
    sendPerformanceMenu,
    sendAutomationMenu,
    sendAudioMenu,
    sendVoiceCommandMenu,
    sendEntertainmentMenu,
    sendFileManagementMenu,
    sendMonitorMenu,
    sendNotificationMenu,
    sendSettingsMenu,
    getMainMenuKeyboard,
    getSystemMenuKeyboard,
    getSecurityMenuKeyboard
};
