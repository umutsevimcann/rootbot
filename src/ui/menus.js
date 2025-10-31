/**
 * CONSOLIDATED MENUS - All bot menus in one place
 * Consolidated from 10 separate menu files for better organization
 */

// ============================================================================
// MAIN MENU
// ============================================================================

/**
 * Ana menü klavyesi
 */
function getMainMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['Sistem', 'Güç', 'Güvenlik'],
                ['Disk', 'Ekran', 'Ses'],
                ['Ağ', 'Dosya', 'Otomasyon'],
                ['Performans', 'Eğlence'],
                ['Mouse/Klavye', 'Pano', 'İzleme'],
                ['Bildirimler']
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
    return `*RootBot - Sistem Kontrol Merkezi*

Merhaba! Bilgisayarınızı uzaktan kontrol edebilirsiniz.

*Anlık Durum:*
${isLocked ? 'Bilgisayar şu anda kilitli' : 'Bilgisayar şu anda açık'}
Son kontrol: ${new Date().toLocaleTimeString('tr-TR')}

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
        await bot.sendMessage(chatId, 'Menü yüklenirken bir hata oluştu.');
    }
}

// ============================================================================
// SYSTEM MENU
// ============================================================================

/**
 * Sistem menüsü klavyesi
 */
function getSystemMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['Sistem Bilgisi', 'Sıcaklık'],
                ['Çalışan Programlar', 'Program Listesi (TXT)'],
                ['Program Başlat', 'Program Kapat'],
                ['Komut Çalıştır', 'Ekran Kapat'],
                ['Masaüstü Göster', 'Ana Menü']
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
        const message = '*Sistem & Uzaktan Kontrol*\n\nSistem yönetimi ve uzaktan kontrol işlemleri:';
        const keyboard = getSystemMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Sistem menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, 'Menü gönderilemedi: ' + error.message);
    }
}

// ============================================================================
// SECURITY MENU
// ============================================================================

/**
 * Güvenlik menüsü klavyesi
 */
function getSecurityMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['Güvenlik Kontrolü', 'Güvenlik Raporu'],
                ['Antivirüs', 'Güvenlik Duvarı'],
                ['USB Cihazları', 'Aktivite'],
                ['Website Engelle', 'Engeli Kaldır'],
                ['Ana Menü']
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
        const message = '*Güvenlik & İzleme*\n\nGüvenlik kontrolleri ve izleme işlemleri:';
        const keyboard = getSecurityMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Güvenlik menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, 'Menü gönderilemedi: ' + error.message);
    }
}

// ============================================================================
// AUDIO MENU
// ============================================================================

/**
 * Ses menüsü klavyesi
 */
function getAudioMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['Ses Aç', 'Sessize Al'],
                ['Ses Yükselt', 'Ses Azalt'],
                ['Ses %0', 'Ses %50', 'Ses %100'],
                ['Özel Ses Seviyesi'],
                ['Çalan Müzik', 'Ses Cihazları'],
                ['Cihaz Listesi', 'Cihaz Değiştir'],
                ['Sesli Komutlar'],
                ['Ana Menü']
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
                ['Merhaba De', 'Uyarı Ver'],
                ['Şaka Yap', 'Korkut'],
                ['Bilgisayarı Kapatıyorum', 'Hacker Uyarısı'],
                ['Motivasyon', 'Tebrikler'],
                ['Özel Mesaj'],
                ['Ses Menüsü']
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
        const message = '*Ses Kontrolü*\n\nSes ayarlarını yönetin:';
        const keyboard = getAudioMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Ses menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, 'Menü gönderilemedi: ' + error.message);
    }
}

/**
 * Sesli komutlar menüsünü gönder
 */
async function sendVoiceCommandMenu(bot, chatId) {
    try {
        const message = '*Sesli Komutlar*\n\nBilgisayardan sesli mesaj yayınlamak için bir seçenek seçin:';
        const keyboard = getVoiceCommandMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Sesli komut menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, 'Menü gönderilemedi: ' + error.message);
    }
}

// ============================================================================
// CLIPBOARD MENU
// ============================================================================

/**
 * Pano Yönetim Menüsü
 */
function getClipboardMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Panoyu Oku', 'Panoya Yaz'],
                ['Pano Geçmişi', 'Geçmişten Seç'],
                ['Panodaki Dosya', 'Panoyu Temizle'],
                ['Geçmişi Temizle'],
                ['İzleme Başlat', 'İzleme Durdur'],
                ['Mouse/Klavye', 'Ana Menü']
            ],
            resize_keyboard: true
        }
    };
}

// ============================================================================
// INPUT MENU (Mouse & Keyboard)
// ============================================================================

/**
 * Mouse ve Klavye Kontrol Menüsü
 */
function getInputMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Mouse Taşı', 'Mouse Tıkla'],
                ['Çift Tık', 'Scroll'],
                ['Mouse Konum', 'Metin Yaz'],
                ['Tuş Bas', 'Tuş Kombinasyonu'],
                ['Pano Menü', 'Ana Menü']
            ],
            resize_keyboard: true
        }
    };
}

function getMouseClickMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Sol Tık', 'Sağ Tık', 'Orta Tık'],
                ['Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getScrollMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Yukarı Scroll', 'Aşağı Scroll'],
                ['Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getKeyMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Enter', 'Tab', 'Esc'],
                ['Backspace', 'Delete', 'Home'],
                ['End', 'PageUp', 'PageDown'],
                ['Up', 'Down', 'Left', 'Right'],
                ['Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getComboMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Ctrl+C', 'Ctrl+V', 'Ctrl+X'],
                ['Ctrl+A', 'Ctrl+S', 'Ctrl+Z'],
                ['Ctrl+Y', 'Ctrl+F', 'Alt+Tab'],
                ['Alt+F4', 'Win+D', 'Win+L'],
                ['Geri']
            ],
            resize_keyboard: true
        }
    };
}

// ============================================================================
// MONITORING MENU
// ============================================================================

/**
 * Sistem İzleme Menüsü
 */
function getMonitoringMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['USB İzleme', 'Pil İzleme'],
                ['İnternet İzleme', 'CPU İzleme'],
                ['WiFi Şifresi', 'Webcam Kontrol'],
                ['Mikrofon Kontrol'],
                ['Tümünü Başlat', 'Tümünü Durdur'],
                ['İzleme Durumu', 'Ana Menü']
            ],
            resize_keyboard: true
        }
    };
}

function getUSBMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Başlat', 'Durdur'],
                ['Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getBatteryMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Başlat (%20)', 'Başlat (%10)'],
                ['Durdur', 'Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getNetworkMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Başlat', 'Durdur'],
                ['Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getCPUMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['Başlat (%90, 5dk)', 'Başlat (%80, 3dk)'],
                ['Durdur', 'Geri']
            ],
            resize_keyboard: true
        }
    };
}

// ============================================================================
// NOTIFICATION MENU
// ============================================================================

/**
 * Bildirimler menüsü klavyesi
 */
function getNotificationMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['Bildirimleri Göster', 'Test Bildirimi'],
                ['Özel Bildirim Gönder'],
                ['Ana Menü']
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
        const message = '*Bildirimler*\n\nWindows bildirim yönetimi:';
        const keyboard = getNotificationMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Bildirim menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, 'Menü gönderilemedi: ' + error.message);
    }
}

// ============================================================================
// SETTINGS MENU
// ============================================================================

/**
 * Ayarlar menüsü klavyesi
 */
function getSettingsMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['Tüm Ayarlar', 'Bot Bilgisi'],
                ['Tümünü Aç', 'Tümünü Kapat'],
                ['Config Yenile'],
                ['Ana Menü']
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
        const message = '*Ayarlar*\n\nBot ayarlarını yönetin:';
        const keyboard = getSettingsMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Ayarlar menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, 'Menü gönderilemedi: ' + error.message);
    }
}

// ============================================================================
// ADDITIONAL MENUS (from index.js)
// ============================================================================

/**
 * Güç menüsü
 */
async function sendPowerMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['Kilitle', 'Kilidi Aç'],
                ['Uyku Modu'],
                ['Yeniden Başlat', 'Kapat'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Güç Yönetimi*\n\nLütfen bir işlem seçin:', {
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
                ['Disk Kullanımı', 'Disk Analizi'],
                ['Disk Temizliği', 'Geçici Dosyalar'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Disk Yönetimi*\n\nDisk işlemlerini seçin:', {
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
                ['Ağ Trafiği', 'IP Bilgisi'],
                ['WiFi Bilgisi', 'Ağ Taraması'],
                ['Website Engelle', 'Engeli Kaldır'],
                ['Engellenen Siteler'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Ağ Yönetimi*\n\nAğ işlemlerini seçin:', {
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
                ['Performans Grafiği', 'Başlangıç'],
                ['Sistem Bilgisi', 'Sıcaklık'],
                ['RAM Kullanımı', 'CPU Kullanımı'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Performans İzleme*\n\nPerformans bilgilerini görüntüleyin:', {
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
                ['Zamanlanmış Görev', 'Tekrarlı Görev'],
                ['Görev Listesi', 'Görev Sil'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Otomasyon*\n\nZamanlanmış görev yönetimi:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Eğlence menüsü
 */
async function sendEntertainmentMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['Netflix Aç', 'Spotify Aç'],
                ['Steam Aç', 'Discord Aç'],
                ['Medya Oynat', 'Medya Duraklat'],
                ['Sonraki', 'Önceki'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Eğlence*\n\nMedya ve uygulama kontrolü:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Dosya yönetimi menüsü (Yeni, Basit ve Kullanıcı Dostu)
 */
async function sendFileManagementMenu(bot, chatId) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['Gözat', 'Son Kullanılanlar'],
                ['Dosya Ara'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Dosya Yönetimi*\n\n' +
        'Gözat - Klasörler arası gezin ve dosya seç\n' +
        'Son Kullanılanlar - En son açtığınız dosyalar\n' +
        'Dosya Ara - İsme göre dosya arayın\n\n' +
        '💡 Gözat\'ta dosya seçince Gönder/Sil/Bilgi işlemlerini yapabilirsin', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Hızlı klasör seçim menüsü
 */
async function sendQuickFoldersMenu(bot, chatId, quickFolders) {
    const folderButtons = Object.keys(quickFolders).map(name => [name]);
    folderButtons.push(['Geri']);

    const keyboard = {
        reply_markup: {
            keyboard: folderButtons,
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, '*Hızlı Klasörler*\n\nBir klasör seçin:', {
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
                ['Ekran Görüntüsü', 'Ekran Kaydı'],
                ['Webcam Fotoğraf', 'Webcam Video'],
                ['Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    await bot.sendMessage(chatId, '*Ekran & Kamera*\n\nGörüntü yakalama işlemleri:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Main Menu
    sendMainMenu,
    getMainMenuKeyboard,
    getWelcomeMessage,

    // System Menu
    sendSystemMenu,
    getSystemMenuKeyboard,

    // Security Menu
    sendSecurityMenu,
    getSecurityMenuKeyboard,

    // Power Menu
    sendPowerMenu,

    // Disk Menu
    sendDiskMenu,

    // Network Menu
    sendNetworkMenu,

    // Performance Menu
    sendPerformanceMenu,

    // Automation Menu
    sendAutomationMenu,

    // Audio Menu
    sendAudioMenu,
    sendVoiceCommandMenu,
    getAudioMenuKeyboard,
    getVoiceCommandMenuKeyboard,

    // Entertainment Menu
    sendEntertainmentMenu,

    // File Management Menu
    sendFileManagementMenu,
    sendQuickFoldersMenu,

    // Monitor Menu (Screen & Camera)
    sendMonitorMenu,

    // Clipboard Menu
    getClipboardMenu,

    // Input Menu (Mouse & Keyboard)
    getInputMenu,
    getMouseClickMenu,
    getScrollMenu,
    getKeyMenu,
    getComboMenu,

    // Monitoring Menu
    getMonitoringMenu,
    getUSBMonitorMenu,
    getBatteryMonitorMenu,
    getNetworkMonitorMenu,
    getCPUMonitorMenu,

    // Notification Menu
    sendNotificationMenu,
    getNotificationMenuKeyboard,

    // Settings Menu
    sendSettingsMenu,
    getSettingsMenuKeyboard
};
