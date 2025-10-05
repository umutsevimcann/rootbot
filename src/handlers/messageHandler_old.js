const { bot, checkAuthorization, sendUnauthorizedMessage } = require('../bot');
const logger = require('../utils/logger');

// Menü imports
const {
    sendMainMenu,
    sendSystemMenu,
    sendSecurityMenu,
    sendPowerMenu,
    sendDiskMenu,
    sendNetworkMenu,
    sendPerformanceMenu,
    sendAutomationMenu,
    sendAudioMenu,
    sendEntertainmentMenu,
    sendFileManagementMenu,
    sendMonitorMenu
} = require('../menus');

// Servis imports
const systemService = require('../services/systemService');
const powerService = require('../services/powerService');
const monitorService = require('../services/monitorService');
const networkService = require('../services/networkService');

// Global durumlar
let isLocked = false;
let awaitingShutdownTime = false;
let awaitingCommand = false;
let awaitingProgramName = false;
let awaitingClipboardText = false;

/**
 * Ana mesaj handler
 */
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Yetkilendirme kontrolü
    if (!checkAuthorization(chatId)) {
        await sendUnauthorizedMessage(chatId);
        logger.warning(`Yetkisiz erişim denemesi: ${chatId}`);
        return;
    }

    logger.info(`Mesaj alındı: ${text}`);

    try {
        // /start komutu
        if (text === '/start') {
            await sendMainMenu(bot, chatId, isLocked);
            return;
        }

        // Ana menü butonları
        if (text === '🖥️ Sistem') {
            await sendSystemMenu(bot, chatId);
        } else if (text === '⚡ Güç') {
            await sendPowerMenu(bot, chatId);
        } else if (text === '🔒 Güvenlik') {
            await sendSecurityMenu(bot, chatId);
        } else if (text === '💽 Disk') {
            await sendDiskMenu(bot, chatId);
        } else if (text === '📸 Ekran') {
            await sendMonitorMenu(bot, chatId);
        } else if (text === '🔊 Ses') {
            await sendAudioMenu(bot, chatId);
        } else if (text === '🌐 Ağ') {
            await sendNetworkMenu(bot, chatId);
        } else if (text === '📁 Dosya') {
            await sendFileManagementMenu(bot, chatId);
        } else if (text === '📅 Otomasyon') {
            await sendAutomationMenu(bot, chatId);
        } else if (text === '📊 Performans') {
            await sendPerformanceMenu(bot, chatId);
        } else if (text === '🎨 Eğlence') {
            await sendEntertainmentMenu(bot, chatId);
        } else if (text === '🔙 Ana Menü') {
            await sendMainMenu(bot, chatId, isLocked);
        }

        // Sistem menüsü işlemleri
        else if (text === '📊 Sistem Bilgisi') {
            const info = await systemService.getSystemInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === '🌡️ Sıcaklık') {
            const temp = await systemService.getTemperature();
            await bot.sendMessage(chatId, temp, { parse_mode: 'Markdown' });
        } else if (text === '💻 Çalışan Programlar') {
            const programs = await systemService.getRunningPrograms();
            await bot.sendMessage(chatId, programs, { parse_mode: 'Markdown' });
        } else if (text === '💻 CPU Kullanımı') {
            const cpu = await systemService.getCPUUsage();
            const message = `💻 *CPU Bilgisi*\n\n🔧 Model: ${cpu.model}\n⚙️ Çekirdek: ${cpu.cores}\n📊 Kullanım: %${cpu.usage}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else if (text === '🧠 RAM Kullanımı') {
            const ram = await systemService.getRAMUsage();
            const message = `🧠 *RAM Kullanımı*\n\n📊 Kullanılan: ${ram.used} GB\n📈 Toplam: ${ram.total} GB\n💾 Boş: ${ram.free} GB\n📉 Kullanım: %${ram.usagePercent}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }

        // Güç menüsü işlemleri
        else if (text === '🔒 Kilitle') {
            const result = await powerService.lockSystem();
            isLocked = true;
            await bot.sendMessage(chatId, result);
        } else if (text === '🔓 Kilidi Aç') {
            isLocked = false;
            await bot.sendMessage(chatId, '🔓 Kilit açıldı (manuel)');
        } else if (text === '💤 Uyku Modu') {
            const result = await powerService.sleepMode();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔄 Yeniden Başlat') {
            const result = await powerService.rebootSystem();
            await bot.sendMessage(chatId, result);
        } else if (text === '⚡ Kapat') {
            const keyboard = {
                reply_markup: {
                    keyboard: [
                        ['⚡ Hemen Kapat', '⏰ Özel Süre Belirle'],
                        ['🔙 İptal']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            };
            await bot.sendMessage(chatId, '⚡ *Kapatma Seçenekleri*\n\nNasıl kapatmak istersiniz?', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } else if (text === '⚡ Hemen Kapat') {
            const result = await powerService.shutdownSystem(0);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ Özel Süre Belirle') {
            await bot.sendMessage(chatId, '⏰ Lütfen kapatma süresini dakika cinsinden yazın (örn: 15)');
            awaitingShutdownTime = true;
        }

        // Özel süre girişi
        else if (awaitingShutdownTime && !isNaN(text) && parseInt(text) > 0) {
            awaitingShutdownTime = false;
            const minutes = parseInt(text);
            const result = await powerService.shutdownSystem(minutes);
            await bot.sendMessage(chatId, result);
        }

        // Ekran menüsü işlemleri
        else if (text === '📸 Ekran Görüntüsü') {
            await bot.sendMessage(chatId, '📸 Ekran görüntüsü alınıyor...');
            const screenshotPath = await monitorService.takeScreenshot();
            await bot.sendPhoto(chatId, screenshotPath, { caption: '📸 Ekran görüntüsü' });
        } else if (text === '📷 Webcam Fotoğraf') {
            await bot.sendMessage(chatId, '📷 Webcam fotoğrafı çekiliyor...');
            const photoPath = await monitorService.takeWebcamPhoto();
            await bot.sendPhoto(chatId, photoPath, { caption: '📷 Webcam fotoğrafı' });
        } else if (text === '🎥 Ekran Kaydı (30sn)') {
            await bot.sendMessage(chatId, '🎥 30 saniyelik ekran kaydı başlatılıyor...');
            await monitorService.startScreenRecording(30);
            await bot.sendMessage(chatId, '✅ Kayıt başlatıldı. 30 saniye sonra video gönderilecek.');
        } else if (text === '🎥 Ekran Kaydı (60sn)') {
            await bot.sendMessage(chatId, '🎥 60 saniyelik ekran kaydı başlatılıyor...');
            await monitorService.startScreenRecording(60);
            await bot.sendMessage(chatId, '✅ Kayıt başlatıldı. 60 saniye sonra video gönderilecek.');
        }

        // Ağ menüsü işlemleri
        else if (text === '📡 IP Bilgisi') {
            const info = await networkService.getIPInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === '📶 WiFi Bilgisi') {
            const info = await networkService.getWiFiInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === '📊 Ağ Trafiği') {
            const traffic = await networkService.getNetworkTraffic();
            await bot.sendMessage(chatId, traffic, { parse_mode: 'Markdown' });
        } else if (text === '🔍 Ağ Taraması') {
            await bot.sendMessage(chatId, '🔍 Ağ taranıyor...');
            const scan = await networkService.scanNetwork();
            await bot.sendMessage(chatId, scan, { parse_mode: 'Markdown' });
        }

        // Bilinmeyen komut
        else {
            await bot.sendMessage(chatId, '❓ Bilinmeyen komut. Lütfen menüden bir seçenek seçin.');
        }

    } catch (error) {
        logger.error(`Mesaj işleme hatası: ${error.message}`);
        await bot.sendMessage(chatId, '❌ Bir hata oluştu: ' + error.message);
    }
}

module.exports = {
    handleMessage
};
