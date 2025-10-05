const { bot, checkAuthorization, sendUnauthorizedMessage, isMessageTooOld } = require('../bot');
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
    sendVoiceCommandMenu,
    sendEntertainmentMenu,
    sendFileManagementMenu,
    sendMonitorMenu,
    sendNotificationMenu,
    sendSettingsMenu
} = require('../menus');

// Servis imports
const systemService = require('../services/systemService');
const powerService = require('../services/powerService');
const monitorService = require('../services/monitorService');
const networkService = require('../services/networkService');
const audioService = require('../services/audioService');
const clipboardService = require('../services/clipboardService');
const programService = require('../services/programService');
const diskService = require('../services/diskService');
const securityService = require('../services/securityService');
const performanceService = require('../services/performanceService');
const automationService = require('../services/automationService');
const activityService = require('../services/activityService');
const mediaService = require('../services/mediaService');
const fileService = require('../services/fileService');
const notificationService = require('../services/notificationService');
const settingsService = require('../services/settingsService');
const inputService = require('../services/inputService');
const monitoringService = require('../services/monitoringService');
const quickActionsService = require('../services/quickActionsService');

// Menü helper imports
const { getInputMenu, getMouseClickMenu, getScrollMenu, getKeyMenu, getComboMenu } = require('../menus/inputMenu');
const { getClipboardMenu } = require('../menus/clipboardMenu');
const { getMonitoringMenu, getUSBMonitorMenu, getBatteryMonitorMenu, getNetworkMonitorMenu, getCPUMonitorMenu } = require('../menus/monitoringMenu');

// Global durumlar
let isLocked = false;
let awaitingShutdownTime = false;
let awaitingCommand = false;
let awaitingProgramName = false;
let awaitingProgramKill = false;
let awaitingClipboardText = false;
let awaitingVoiceMessage = false;
let awaitingWebsiteBlock = false;
let awaitingMouseMove = false;
let awaitingTypeText = false;
let awaitingClipboardSelect = false;
let awaitingWebsiteUnblock = false;
let awaitingCustomNotification = false;
let awaitingCustomNotificationTitle = '';
let awaitingBrightnessLevel = false;
let awaitingNotificationMessage = false;
let awaitingScheduledTask = false;
let awaitingRecurringTask = false;
let awaitingTaskDelete = false;
let awaitingFileSend = false;
let awaitingFileList = false;
let awaitingFileDelete = false;
let awaitingFileCreate = false;
let awaitingCustomVolume = false;

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

    // Eski mesajları görmezden gel (bot kapalıyken gönderilen mesajlar)
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski mesaj görmezden gelindi: ${text} (Tarih: ${new Date(msg.date * 1000).toLocaleString('tr-TR')})`);
        return;
    }

    logger.info(`Mesaj alındı: ${text}`);

    try {
        // /start komutu
        if (text === '/start') {
            await sendMainMenu(bot, chatId, isLocked);
            return;
        }

        // Geri butonu - ana menüye dön
        if (text === '🔙 Geri' || text === '◀️ Ana Menü') {
            awaitingShutdownTime = false;
            awaitingCommand = false;
            awaitingProgramName = false;
            awaitingNotificationTitle = false;
            awaitingNotificationMessage = false;
            awaitingFileDownload = false;
            awaitingClipboardText = false;
            awaitingVolumeValue = false;

            await sendMainMenu(bot, chatId, isLocked);
            return;
        }

        // Kapatmayı iptal et
        if (text === '❌ Kapatmayı İptal Et') {
            const result = await powerService.cancelShutdown();
            await bot.sendMessage(chatId, result);
            return;
        }

        // Global input handlers (öncelik)
        if (awaitingShutdownTime && !isNaN(text) && parseInt(text) > 0) {
            awaitingShutdownTime = false;
            const minutes = parseInt(text);
            const result = await powerService.shutdownSystem(minutes);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingCommand) {
            awaitingCommand = false;
            const result = await programService.runCommand(text);
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            return;
        }

        if (awaitingProgramName) {
            awaitingProgramName = false;
            const result = await programService.launchProgram(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingProgramKill) {
            awaitingProgramKill = false;
            const result = await programService.killProgram(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingClipboardText) {
            awaitingClipboardText = false;
            const result = await clipboardService.writeClipboard(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingVoiceMessage) {
            awaitingVoiceMessage = false;
            const result = await audioService.playVoiceCommand(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingWebsiteBlock) {
            awaitingWebsiteBlock = false;
            const result = await networkService.blockWebsite(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingWebsiteUnblock) {
            awaitingWebsiteUnblock = false;
            const result = await networkService.unblockWebsite(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingMouseMove) {
            awaitingMouseMove = false;
            const coords = text.split(',');
            if (coords.length === 2) {
                const x = parseInt(coords[0].trim());
                const y = parseInt(coords[1].trim());
                if (!isNaN(x) && !isNaN(y)) {
                    const result = await inputService.moveMouse(x, y);
                    await bot.sendMessage(chatId, result);
                    return;
                }
            }
            await bot.sendMessage(chatId, '❌ Geçersiz format! Örnek: 500,300');
            return;
        }

        if (awaitingTypeText) {
            awaitingTypeText = false;
            const result = await inputService.typeText(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingClipboardSelect) {
            awaitingClipboardSelect = false;
            const index = parseInt(text);
            if (!isNaN(index)) {
                const result = await clipboardService.selectFromHistory(index);
                await bot.sendMessage(chatId, result);
                return;
            }
        }

        if (awaitingBrightnessLevel) {
            awaitingBrightnessLevel = false;
            const level = parseInt(text);
            if (!isNaN(level) && level >= 0 && level <= 100) {
                const result = await quickActionsService.setBrightness(level);
                // Markdown hatası olabileceği için parse_mode kullanma
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, '❌ Geçersiz değer! 0-100 arası bir sayı girin.');
            return;
        }

        if (awaitingNotificationMessage) {
            awaitingNotificationMessage = false;
            const result = await quickActionsService.sendNotification(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingCustomNotification) {
            if (!awaitingCustomNotificationTitle) {
                // İlk adım: Başlığı al
                awaitingCustomNotificationTitle = text;
                await bot.sendMessage(chatId, '📨 Şimdi bildirim mesajını yazın:');
                return;
            } else {
                // İkinci adım: Mesajı al ve bildirimi gönder
                const title = awaitingCustomNotificationTitle;
                const message = text;
                awaitingCustomNotification = false;
                awaitingCustomNotificationTitle = '';
                const result = await notificationService.sendCustomNotification(title, message);
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
                return;
            }
        }

        if (awaitingCustomVolume) {
            awaitingCustomVolume = false;
            const level = parseInt(text);
            if (!isNaN(level) && level >= 0 && level <= 100) {
                const result = await quickActionsService.setVolume(level);
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, '❌ Geçersiz değer! 0-100 arası bir sayı girin.');
            return;
        }

        if (awaitingScheduledTask) {
            awaitingScheduledTask = false;
            const parts = text.split('|');
            if (parts.length === 2) {
                const command = parts[0].trim();
                const minutes = parseInt(parts[1].trim());
                if (!isNaN(minutes)) {
                    const result = await automationService.scheduleTask(command, minutes);
                    await bot.sendMessage(chatId, result);
                    return;
                }
            }
            await bot.sendMessage(chatId, '❌ Geçersiz format! Örnek: `shutdown /s /t 0|30`', { parse_mode: 'Markdown' });
            return;
        }

        if (awaitingRecurringTask) {
            awaitingRecurringTask = false;
            const parts = text.split('|');
            if (parts.length === 2) {
                const command = parts[0].trim();
                const interval = parseInt(parts[1].trim());
                if (!isNaN(interval)) {
                    const result = await automationService.addRecurringTask(command, interval);
                    await bot.sendMessage(chatId, result);
                    return;
                }
            }
            await bot.sendMessage(chatId, '❌ Geçersiz format! Örnek: `echo test|10`', { parse_mode: 'Markdown' });
            return;
        }

        if (awaitingTaskDelete) {
            awaitingTaskDelete = false;
            const taskId = parseInt(text);
            if (!isNaN(taskId)) {
                const result = await automationService.removeTask(taskId);
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, '❌ Geçersiz görev ID\'si!');
            return;
        }

        if (awaitingFileSend) {
            awaitingFileSend = false;
            try {
                await bot.sendDocument(chatId, text);
                await bot.sendMessage(chatId, '✅ Dosya gönderildi.');
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Dosya gönderilemedi: ' + error.message);
            }
            return;
        }

        if (awaitingFileList) {
            awaitingFileList = false;
            const result = await fileService.listFiles(text);
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            return;
        }

        if (awaitingFileDelete) {
            awaitingFileDelete = false;
            const result = await fileService.deleteFile(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (awaitingFileCreate) {
            awaitingFileCreate = false;
            const parts = text.split('|');
            if (parts.length === 2) {
                const filePath = parts[0].trim();
                const content = parts[1].trim();
                const result = await fileService.createFile(filePath, content);
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, '❌ Geçersiz format! Örnek: `C:\\test.txt|Merhaba`', { parse_mode: 'Markdown' });
            return;
        }

        // ========== ANA MENÜ ==========
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
        } else if (text === '🔙 Ana Menü' || text === '🔙 Ses Menüsü' || text === '🔙 Geri' || text === '🏠 Ana Menü') {
            await sendMainMenu(bot, chatId, isLocked);
        }

        // ========== SİSTEM MENÜSÜ ==========
        else if (text === '📊 Sistem Bilgisi') {
            const info = await systemService.getSystemInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === '🌡️ Sıcaklık') {
            const temp = await systemService.getTemperature();
            await bot.sendMessage(chatId, temp, { parse_mode: 'Markdown' });
        } else if (text === '💻 Çalışan Programlar') {
            const programs = await systemService.getRunningPrograms();
            await bot.sendMessage(chatId, programs, { parse_mode: 'Markdown' });
        } else if (text === '📄 Program Listesi (TXT)') {
            await bot.sendMessage(chatId, '📄 Program listesi hazırlanıyor...');
            const result = await systemService.getRunningProgramsFile();
            if (result.success) {
                await bot.sendDocument(chatId, result.filePath, { caption: result.message });
            } else {
                await bot.sendMessage(chatId, result.message);
            }
        } else if (text === '💻 CPU Kullanımı') {
            const cpu = await systemService.getCPUUsage();
            const message = `💻 *CPU Bilgisi*\n\n🔧 Model: ${cpu.model}\n⚙️ Çekirdek: ${cpu.cores}\n📊 Kullanım: %${cpu.usage}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else if (text === '🧠 RAM Kullanımı') {
            const ram = await systemService.getRAMUsage();
            const message = `🧠 *RAM Kullanımı*\n\n📊 Kullanılan: ${ram.used} GB\n📈 Toplam: ${ram.total} GB\n💾 Boş: ${ram.free} GB\n📉 Kullanım: %${ram.usagePercent}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else if (text === '📋 Panoyu Göster') {
            const clipboard = await clipboardService.getClipboard();
            await bot.sendMessage(chatId, clipboard, { parse_mode: 'Markdown' });
        } else if (text === '📝 Panoya Yaz') {
            await bot.sendMessage(chatId, '📝 Lütfen panoya yazılacak metni gönderin:');
            awaitingClipboardText = true;
        } else if (text === '💻 Komut Çalıştır') {
            await bot.sendMessage(chatId, '💻 Lütfen çalıştırılacak komutu yazın:');
            awaitingCommand = true;
        } else if (text === '🚀 Program Başlat') {
            await bot.sendMessage(chatId, `🚀 *Program Başlat*

Program adını veya yolunu yazın:

📝 *Örnekler:*
• \`notepad\` - Not Defteri
• \`calc\` - Hesap Makinesi
• \`mspaint\` - Paint
• \`cmd\` - Komut İstemi
• \`chrome\` - Google Chrome
• \`firefox\` - Mozilla Firefox
• \`explorer\` - Dosya Gezgini
• \`control\` - Kontrol Paneli
• \`taskmgr\` - Görev Yöneticisi
• \`snippingtool\` - Ekran Alıntısı Aracı
• \`C:\\Program Files\\App\\app.exe\` - Tam yol`, { parse_mode: 'Markdown' });
            awaitingProgramName = true;
        } else if (text === '❌ Program Kapat') {
            await bot.sendMessage(chatId, `❌ *Program Kapat*

Kapatılacak programın adını yazın:

📝 *Örnekler:*
• \`notepad.exe\` - Not Defteri
• \`chrome.exe\` - Google Chrome
• \`firefox.exe\` - Mozilla Firefox
• \`explorer.exe\` - Dosya Gezgini
• \`Telegram.exe\` - Telegram
• \`Discord.exe\` - Discord
• \`Spotify.exe\` - Spotify
• \`Code.exe\` - VS Code
• \`javaw.exe\` - Java uygulamaları

💡 *İpucu:* 💻 Çalışan Programlar'dan tam adını görebilirsiniz.`, { parse_mode: 'Markdown' });
            awaitingProgramKill = true;
        }

        // ========== GÜÇ MENÜSÜ ==========
        else if (text === '🔒 Kilitle') {
            const result = await powerService.lockSystem();
            isLocked = true;
            await bot.sendMessage(chatId, result);
        } else if (text === '🔓 Kilidi Aç') {
            const result = await powerService.unlockSystem();
            isLocked = false;
            await bot.sendMessage(chatId, result);
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
                        ['⚡ Hemen Kapat'],
                        ['⏰ 1 Dakika', '⏰ 5 Dakika'],
                        ['⏰ 15 Dakika', '⏰ 30 Dakika'],
                        ['⏰ 1 Saat', '⏰ Özel Süre'],
                        ['❌ Kapatmayı İptal Et', '🔙 Geri']
                    ],
                    resize_keyboard: true
                }
            };
            await bot.sendMessage(chatId, '⚡ *Kapatma Zamanı Seçin*\n\nBilgisayar ne zaman kapatılsın?', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } else if (text === '⚡ Hemen Kapat') {
            const result = await powerService.shutdownSystem(0);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ 1 Dakika') {
            const result = await powerService.shutdownSystem(1);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ 5 Dakika') {
            const result = await powerService.shutdownSystem(5);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ 15 Dakika') {
            const result = await powerService.shutdownSystem(15);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ 30 Dakika') {
            const result = await powerService.shutdownSystem(30);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ 1 Saat') {
            const result = await powerService.shutdownSystem(60);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏰ Özel Süre') {
            await bot.sendMessage(chatId, '⏰ Kapatma süresini dakika cinsinden yazın (örn: 45):');
            awaitingShutdownTime = true;
        }

        // ========== EKRAN MENÜSÜ ==========
        else if (text === '📸 Ekran Görüntüsü') {
            await bot.sendMessage(chatId, '📸 Ekran görüntüsü alınıyor...');
            const screenshotPath = await monitorService.takeScreenshot();
            await bot.sendPhoto(chatId, screenshotPath, { caption: '📸 Ekran görüntüsü' });
        } else if (text === '📷 Webcam Fotoğraf') {
            await bot.sendMessage(chatId, '📷 Webcam fotoğrafı çekiliyor...');
            const photoPath = await monitorService.takeWebcamPhoto();
            await bot.sendPhoto(chatId, photoPath, { caption: '📷 Webcam fotoğrafı' });
        } else if (text === '🎬 Webcam Video') {
            await bot.sendMessage(chatId, '🎬 10 saniyelik webcam video kaydı başlatılıyor...');
            await monitorService.startWebcamRecording(10, chatId, bot);
            await bot.sendMessage(chatId, '✅ Kayıt başlatıldı. 10 saniye sonra video gönderilecek.');
        } else if (text === '🎥 Ekran Kaydı (30sn)' || text === '🎥 Ekran Kaydı') {
            await bot.sendMessage(chatId, '🎥 30 saniyelik ekran kaydı başlatılıyor...');
            await monitorService.startScreenRecording(30, chatId, bot);
            await bot.sendMessage(chatId, '✅ Kayıt başlatıldı. 30 saniye sonra video gönderilecek.');
        } else if (text === '🎥 Ekran Kaydı (60sn)') {
            await bot.sendMessage(chatId, '🎥 60 saniyelik ekran kaydı başlatılıyor...');
            await monitorService.startScreenRecording(60, chatId, bot);
            await bot.sendMessage(chatId, '✅ Kayıt başlatıldı. 60 saniye sonra video gönderilecek.');
        }

        // ========== AĞ MENÜSÜ ==========
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
        } else if (text === '🌐 Website Engelle' || text.includes('Website Engelle')) {
            await bot.sendMessage(chatId, '🌐 Engellenecek domain adını yazın (örn: facebook.com):');
            awaitingWebsiteBlock = true;
        } else if (text === '🌐 Engeli Kaldır' || text.includes('Engeli Kaldır')) {
            await bot.sendMessage(chatId, '🌐 Engeli kaldırılacak domain adını yazın:');
            awaitingWebsiteUnblock = true;
        } else if (text === '📋 Engellenen Siteler') {
            const blocked = await networkService.getBlockedWebsites();
            await bot.sendMessage(chatId, blocked, { parse_mode: 'Markdown' });
        }

        // ========== SES MENÜSÜ ==========
        else if (text === '🔊 Ses Aç') {
            const result = await audioService.unmuteSpeakers();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔇 Sessize Al') {
            const result = await audioService.muteSpeakers();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔼 Ses Yükselt') {
            const result = await audioService.increaseVolume();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔽 Ses Azalt') {
            const result = await audioService.decreaseVolume();
            await bot.sendMessage(chatId, result);
        } else if (text === '🗣️ Sesli Komutlar') {
            await sendVoiceCommandMenu(bot, chatId);
        }

        // ========== SESLİ KOMUTLAR ==========
        else if (text === '🔊 Merhaba De') {
            const result = await audioService.playVoiceCommand('hello');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Uyarı Ver') {
            const result = await audioService.playVoiceCommand('warning');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Şaka Yap') {
            const result = await audioService.playVoiceCommand('joke');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Korkut') {
            const result = await audioService.playVoiceCommand('scare');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Bilgisayarı Kapatıyorum') {
            const result = await audioService.playVoiceCommand('shutdown');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Hacker Uyarısı') {
            const result = await audioService.playVoiceCommand('hacker');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Motivasyon') {
            const result = await audioService.playVoiceCommand('motivation');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Tebrikler') {
            const result = await audioService.playVoiceCommand('congrats');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Özel Mesaj') {
            await bot.sendMessage(chatId, '🗣️ Söylememi istediğiniz metni yazın:');
            awaitingVoiceMessage = true;
        } else if (text === '🔊 Cihaz Listesi') {
            const result = await audioService.listAudioDevices();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '🔄 Cihaz Değiştir') {
            const result = await audioService.changeAudioDevice();
            await bot.sendMessage(chatId, result);
        }

        // ========== GÜVENLİK MENÜSÜ ==========
        else if (text === '🛡️ Güvenlik Kontrolü') {
            const report = await securityService.securityCheck();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === '📊 Güvenlik Raporu') {
            const report = await securityService.getSecurityReport();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === '🧬 Antivirüs') {
            const report = await securityService.checkAntivirus();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === '🔥 Güvenlik Duvarı') {
            const report = await securityService.checkFirewall();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === '🔌 USB Cihazları') {
            const devices = await securityService.detectUSBDevices();
            await bot.sendMessage(chatId, devices, { parse_mode: 'Markdown' });
        }

        // ========== DİSK MENÜSÜ ==========
        else if (text === '📊 Disk Kullanımı') {
            const usage = await diskService.getDiskUsage();
            await bot.sendMessage(chatId, usage, { parse_mode: 'Markdown' });
        } else if (text === '🔍 Disk Analizi') {
            await bot.sendMessage(chatId, '🔍 *Disk Analizi Başlatıldı*\n\n⏳ Tüm diskler taranıyor...\n📂 Büyük dosyalar tespit ediliyor...\n\n⚠️ Bu işlem 30-60 saniye sürebilir, lütfen bekleyin.', { parse_mode: 'Markdown' });
            const analysis = await diskService.analyzeDisk();
            await bot.sendMessage(chatId, analysis, { parse_mode: 'Markdown' });
        } else if (text === '🧹 Disk Temizliği' || text === '🗑️ Geçici Dosyalar') {
            await bot.sendMessage(chatId, '🧹 Disk temizliği başlatılıyor...');
            const result = await diskService.cleanDisk();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // ========== PERFORMANS MENÜSÜ ==========
        else if (text === '📈 Performans Grafiği') {
            const chart = await performanceService.getPerformanceChart();
            await bot.sendMessage(chatId, chart, { parse_mode: 'Markdown' });
        } else if (text === '💚 Sistem Sağlığı') {
            const health = await performanceService.getSystemHealth();
            await bot.sendMessage(chatId, health, { parse_mode: 'Markdown' });
        } else if (text === '🚀 Başlangıç') {
            const programs = await programService.listStartupPrograms();
            await bot.sendMessage(chatId, programs, { parse_mode: 'Markdown' });
        }

        // ========== OTOMASYON MENÜSÜ ==========
        else if (text === '⏰ Zamanlanmış Görev') {
            await bot.sendMessage(chatId, '⏰ *Zamanlanmış Görev Ekle*\n\nKomut ve zaman bilgisini şu formatta yazın:\n`komut|dakika`\n\nÖrnek: `shutdown /s /t 0|30` (30 dakika sonra kapat)');
            awaitingScheduledTask = true;
        } else if (text === '🔄 Tekrarlı Görev') {
            await bot.sendMessage(chatId, '🔄 *Tekrarlı Görev Ekle*\n\nKomut ve tekrar süresini şu formatta yazın:\n`komut|interval_dakika`\n\nÖrnek: `echo test|10` (her 10 dakikada bir)');
            awaitingRecurringTask = true;
        } else if (text === '📋 Görev Listesi') {
            const tasks = automationService.listScheduledTasks();
            await bot.sendMessage(chatId, tasks, { parse_mode: 'Markdown' });
        } else if (text === '🗑️ Görev Sil') {
            await bot.sendMessage(chatId, '🗑️ Silmek istediğiniz görev ID\'sini yazın:');
            awaitingTaskDelete = true;
        } else if (text === '❓ Cron Yardım') {
            const help = automationService.getCronHelp();
            await bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
        }

        // ========== DOSYA YÖNETİMİ MENÜSÜ ==========
        else if (text === '📂 Dosya Gönder') {
            await bot.sendMessage(chatId, '📂 Göndermek istediğiniz dosyanın tam yolunu yazın:\n\nÖrnek: C:\\Users\\YourName\\Desktop\\file.txt');
            awaitingFileSend = true;
        } else if (text === '📋 Dosya Listele') {
            await bot.sendMessage(chatId, '📋 Listelemek istediğiniz klasörün yolunu yazın:\n\nÖrnek: C:\\Users\\YourName\\Desktop');
            awaitingFileList = true;
        } else if (text === '🗑️ Dosya Sil') {
            await bot.sendMessage(chatId, '🗑️ Silmek istediğiniz dosyanın tam yolunu yazın:');
            awaitingFileDelete = true;
        } else if (text === '📝 Dosya Oluştur') {
            await bot.sendMessage(chatId, '📝 Oluşturulacak dosyanın yolunu ve içeriğini şu formatta yazın:\n`dosya_yolu|içerik`\n\nÖrnek: `C:\\test.txt|Merhaba Dünya`');
            awaitingFileCreate = true;
        }

        // ========== AKTİVİTE İZLEME ==========
        else if (text === '📊 Aktivite' || text === '📊 Aktivite Raporu') {
            const report = activityService.getActivityReport();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === '▶️ İzlemeyi Başlat') {
            const result = activityService.startMonitoring();
            await bot.sendMessage(chatId, result);
        } else if (text === '⏹️ İzlemeyi Durdur') {
            const result = activityService.stopMonitoring();
            await bot.sendMessage(chatId, result);
        }

        // ========== EĞLENCE/MEDYA ==========
        else if (text === '🎬 Netflix Aç') {
            const result = await mediaService.openApplication('netflix');
            await bot.sendMessage(chatId, result);
        } else if (text === '🎵 Spotify Aç') {
            const result = await mediaService.openApplication('spotify');
            await bot.sendMessage(chatId, result);
        } else if (text === '🎮 Steam Aç') {
            const result = await mediaService.openApplication('steam');
            await bot.sendMessage(chatId, result);
        } else if (text === '💬 Discord Aç') {
            const result = await mediaService.openApplication('discord');
            await bot.sendMessage(chatId, result);
        } else if (text === '▶️ Medya Oynat' || text === '⏸️ Medya Duraklat') {
            const result = await mediaService.controlMusic('play');
            await bot.sendMessage(chatId, result);
        } else if (text === '⏭️ Sonraki') {
            const result = await mediaService.controlMusic('next');
            await bot.sendMessage(chatId, result);
        } else if (text === '⏮️ Önceki') {
            const result = await mediaService.controlMusic('previous');
            await bot.sendMessage(chatId, result);
        } else if (text === '🎵 Çalan Müzik') {
            const status = await mediaService.getMusicStatus();
            await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
        }

        // ========== BİLDİRİMLER ==========
        else if (text === '🔔 Bildirimler') {
            await sendNotificationMenu(bot, chatId);
        } else if (text === '📬 Bildirimleri Göster') {
            const notifications = await notificationService.getWindowsNotifications();
            await bot.sendMessage(chatId, notifications, { parse_mode: 'Markdown' });
        } else if (text === '🔔 Test Bildirimi') {
            const result = await notificationService.sendTestNotification();
            await bot.sendMessage(chatId, result);
        } else if (text === '📨 Özel Bildirim Gönder') {
            await bot.sendMessage(chatId, '📨 Bildirim başlığını yazın (sonra mesajı soracağım):');
            awaitingCustomNotification = true;
        }

        // ========== AYARLAR ==========
        else if (text === '⚙️ Ayarlar') {
            await sendSettingsMenu(bot, chatId);
        } else if (text === '⚙️ Tüm Ayarlar') {
            const settings = settingsService.getAllSettings();
            await bot.sendMessage(chatId, settings, { parse_mode: 'Markdown' });
        } else if (text === '🤖 Bot Bilgisi') {
            const info = settingsService.getBotInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === '✅ Tümünü Aç') {
            const result = settingsService.enableAllCategories();
            await bot.sendMessage(chatId, result);
        } else if (text === '❌ Tümünü Kapat') {
            const result = settingsService.disableAllCategories();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔄 Config Yenile') {
            await bot.sendMessage(chatId, '⚠️ Bu özellik artık desteklenmiyor. .env dosyasını düzenleyin ve botu yeniden başlatın.');
        }

        // 🖱️ MOUSE VE KLAVYE KONTROLÜ
        else if (text === '🖱️ Mouse/Klavye') {
            await bot.sendMessage(chatId, '🖱️ *Mouse ve Klavye Kontrolü*\n\nUzaktan mouse ve klavye kontrolü yapabilirsiniz.', { parse_mode: 'Markdown', ...getInputMenu() });
        } else if (text === '🖱️ Mouse Taşı') {
            awaitingMouseMove = true;
            await bot.sendMessage(chatId, '🖱️ Fareyi taşımak için koordinatları girin (x,y):\n\nÖrnek: 500,300');
        } else if (text === '🖱️ Mouse Tıkla') {
            await bot.sendMessage(chatId, '🖱️ Hangi mouse butonuna tıklamak istersiniz?', getMouseClickMenu());
        } else if (text === '🖱️ Sol Tık') {
            const result = await inputService.clickMouse('left');
            await bot.sendMessage(chatId, result);
        } else if (text === '🖱️ Sağ Tık') {
            const result = await inputService.clickMouse('right');
            await bot.sendMessage(chatId, result);
        } else if (text === '🖱️ Orta Tık') {
            const result = await inputService.clickMouse('middle');
            await bot.sendMessage(chatId, result);
        } else if (text === '🖱️ Çift Tık') {
            const result = await inputService.doubleClick();
            await bot.sendMessage(chatId, result);
        } else if (text === '🖱️ Scroll') {
            await bot.sendMessage(chatId, '🖱️ Hangi yöne scroll yapmak istersiniz?', getScrollMenu());
        } else if (text === '⬆️ Yukarı Scroll') {
            const result = await inputService.scrollMouse('up', 3);
            await bot.sendMessage(chatId, result);
        } else if (text === '⬇️ Aşağı Scroll') {
            const result = await inputService.scrollMouse('down', 3);
            await bot.sendMessage(chatId, result);
        } else if (text === '🖱️ Mouse Konum') {
            const result = await inputService.getMousePosition();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '⌨️ Metin Yaz') {
            awaitingTypeText = true;
            await bot.sendMessage(chatId, '⌨️ Yazmak istediğiniz metni girin:');
        } else if (text === '⌨️ Tuş Bas') {
            await bot.sendMessage(chatId, '⌨️ Hangi tuşa basmak istersiniz?', getKeyMenu());
        } else if (text === '↩️ Enter') {
            const result = await inputService.pressKey('enter');
            await bot.sendMessage(chatId, result);
        } else if (text === '⭾ Tab') {
            const result = await inputService.pressKey('tab');
            await bot.sendMessage(chatId, result);
        } else if (text === '⎋ Esc') {
            const result = await inputService.pressKey('esc');
            await bot.sendMessage(chatId, result);
        } else if (text === '⌫ Backspace') {
            const result = await inputService.pressKey('backspace');
            await bot.sendMessage(chatId, result);
        } else if (text === '⌦ Delete') {
            const result = await inputService.pressKey('delete');
            await bot.sendMessage(chatId, result);
        } else if (text === '🏠 Home') {
            const result = await inputService.pressKey('home');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔚 End') {
            const result = await inputService.pressKey('end');
            await bot.sendMessage(chatId, result);
        } else if (text === '⇞ PageUp') {
            const result = await inputService.pressKey('pageup');
            await bot.sendMessage(chatId, result);
        } else if (text === '⇟ PageDown') {
            const result = await inputService.pressKey('pagedown');
            await bot.sendMessage(chatId, result);
        } else if (text === '⬆️ Up') {
            const result = await inputService.pressKey('up');
            await bot.sendMessage(chatId, result);
        } else if (text === '⬇️ Down') {
            const result = await inputService.pressKey('down');
            await bot.sendMessage(chatId, result);
        } else if (text === '⬅️ Left') {
            const result = await inputService.pressKey('left');
            await bot.sendMessage(chatId, result);
        } else if (text === '➡️ Right') {
            const result = await inputService.pressKey('right');
            await bot.sendMessage(chatId, result);
        } else if (text === '⌨️ Tuş Kombinasyonu') {
            await bot.sendMessage(chatId, '⌨️ Hangi tuş kombinasyonunu kullanmak istersiniz?', getComboMenu());
        } else if (text === '📋 Ctrl+C') {
            const result = await inputService.pressKeyCombination('ctrl+c');
            await bot.sendMessage(chatId, result);
        } else if (text === '📋 Ctrl+V') {
            const result = await inputService.pressKeyCombination('ctrl+v');
            await bot.sendMessage(chatId, result);
        } else if (text === '📋 Ctrl+X') {
            const result = await inputService.pressKeyCombination('ctrl+x');
            await bot.sendMessage(chatId, result);
        } else if (text === '↩️ Ctrl+A') {
            const result = await inputService.pressKeyCombination('ctrl+a');
            await bot.sendMessage(chatId, result);
        } else if (text === '💾 Ctrl+S') {
            const result = await inputService.pressKeyCombination('ctrl+s');
            await bot.sendMessage(chatId, result);
        } else if (text === '↩️ Ctrl+Z') {
            const result = await inputService.pressKeyCombination('ctrl+z');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔄 Ctrl+Y') {
            const result = await inputService.pressKeyCombination('ctrl+y');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔍 Ctrl+F') {
            const result = await inputService.pressKeyCombination('ctrl+f');
            await bot.sendMessage(chatId, result);
        } else if (text === '⊞ Alt+Tab') {
            const result = await inputService.pressKeyCombination('alt+tab');
            await bot.sendMessage(chatId, result);
        } else if (text === '❌ Alt+F4') {
            const result = await inputService.pressKeyCombination('alt+f4');
            await bot.sendMessage(chatId, result);
        } else if (text === '🖥️ Win+D') {
            const result = await inputService.pressKeyCombination('win+d');
            await bot.sendMessage(chatId, result);
        } else if (text === '🔒 Win+L') {
            const result = await inputService.pressKeyCombination('win+l');
            await bot.sendMessage(chatId, result);
        }

        // 📋 PANO YÖNETİMİ
        else if (text === '📋 Pano' || text === '📋 Pano Menü') {
            await bot.sendMessage(chatId, '📋 *Pano Yönetimi*\n\nPanodaki metinleri okuyabilir, yazabilir ve geçmişi görebilirsiniz.', { parse_mode: 'Markdown', ...getClipboardMenu() });
        } else if (text === '📋 Panoyu Oku') {
            const result = await clipboardService.getClipboard();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '✏️ Panoya Yaz') {
            awaitingClipboardText = true;
            await bot.sendMessage(chatId, '✏️ Panoya yazmak istediğiniz metni girin:');
        } else if (text === '📜 Pano Geçmişi') {
            const result = clipboardService.getClipboardHistory();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '🔢 Geçmişten Seç') {
            awaitingClipboardSelect = true;
            await bot.sendMessage(chatId, '🔢 Geçmişten hangi numarayı seçmek istersiniz? (1-10)\n\nÖnce "📜 Pano Geçmişi" ile listeyi görün.');
        } else if (text === '🗑️ Panoyu Temizle') {
            const result = await clipboardService.clearClipboard();
            await bot.sendMessage(chatId, result);
        } else if (text === '🗑️ Geçmişi Temizle') {
            const result = clipboardService.clearClipboardHistory();
            await bot.sendMessage(chatId, result);
        } else if (text === '👁️ İzleme Başlat') {
            const result = await clipboardService.startClipboardWatch();
            await bot.sendMessage(chatId, result);
        } else if (text === '⏸️ İzleme Durdur') {
            const result = clipboardService.stopClipboardWatch();
            await bot.sendMessage(chatId, result);
        }

        // 👁️ SİSTEM İZLEME
        else if (text === '👁️ İzleme') {
            await bot.sendMessage(chatId, '👁️ *Sistem Olayı İzleme*\n\nUSB, Pil, İnternet ve CPU değişikliklerini izleyebilirsiniz.', { parse_mode: 'Markdown', ...getMonitoringMenu() });
        } else if (text === '🔌 USB İzleme') {
            await bot.sendMessage(chatId, '🔌 *USB Cihaz İzleme*\n\nUSB cihaz takılıp çıkarıldığında bildirim alırsınız.', { parse_mode: 'Markdown', ...getUSBMonitorMenu() });
        } else if (text === '🔋 Pil İzleme') {
            await bot.sendMessage(chatId, '🔋 *Pil Seviyesi İzleme*\n\nPil seviyesi düştüğünde bildirim alırsınız.', { parse_mode: 'Markdown', ...getBatteryMonitorMenu() });
        } else if (text === '🌐 İnternet İzleme') {
            await bot.sendMessage(chatId, '🌐 *İnternet Bağlantı İzleme*\n\nBağlantı kesilip geldiğinde bildirim alırsınız.', { parse_mode: 'Markdown', ...getNetworkMonitorMenu() });
        } else if (text === '💻 CPU İzleme') {
            await bot.sendMessage(chatId, '💻 *CPU Kullanım İzleme*\n\nYüksek CPU kullanımında bildirim alırsınız.', { parse_mode: 'Markdown', ...getCPUMonitorMenu() });
        } else if (text === '▶️ Başlat' && awaitingWebsiteBlock === false) {
            // USB/Network başlat (context'e göre)
            const result = await monitoringService.startUSBMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            });
            await bot.sendMessage(chatId, result);
        } else if (text === '▶️ Başlat (%20)') {
            const result = await monitoringService.startBatteryMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 20);
            await bot.sendMessage(chatId, result);
        } else if (text === '▶️ Başlat (%10)') {
            const result = await monitoringService.startBatteryMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 10);
            await bot.sendMessage(chatId, result);
        } else if (text === '▶️ Başlat (%90, 5dk)') {
            const result = await monitoringService.startCPUMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 90, 5);
            await bot.sendMessage(chatId, result);
        } else if (text === '▶️ Başlat (%80, 3dk)') {
            const result = await monitoringService.startCPUMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 80, 3);
            await bot.sendMessage(chatId, result);
        } else if (text === '⏹️ Durdur') {
            // Context'e göre ilgili izlemeyi durdur
            const result = monitoringService.stopAllMonitoring();
            await bot.sendMessage(chatId, result);
        } else if (text === '▶️ Tümünü Başlat') {
            const result = await monitoringService.startAllMonitoring({
                onUSBChange: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }),
                onBatteryLow: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }),
                onNetworkChange: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }),
                onCPUHigh: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' })
            });
            await bot.sendMessage(chatId, result);
        } else if (text === '⏹️ Tümünü Durdur') {
            const result = monitoringService.stopAllMonitoring();
            await bot.sendMessage(chatId, result);
        } else if (text === '📊 İzleme Durumu') {
            const result = monitoringService.getMonitoringStatus();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // ⚡ HIZLI İŞLEMLER (Distributed to individual menus)
        else if (text === '🖥️ Ekran Kapat') {
            const result = await quickActionsService.turnOffScreen();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔇 Sesi Kapat') {
            const result = await quickActionsService.toggleMute();
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Ses %0') {
            const result = await quickActionsService.setVolume(0);
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Ses %50') {
            const result = await quickActionsService.setVolume(50);
            await bot.sendMessage(chatId, result);
        } else if (text === '🔊 Ses %100') {
            const result = await quickActionsService.setVolume(100);
            await bot.sendMessage(chatId, result);
        } else if (text === '🎚️ Özel Ses Seviyesi') {
            await bot.sendMessage(chatId, '🎚️ *Özel Ses Seviyesi*\n\nİstediğiniz ses seviyesini girin (0-100):', { parse_mode: 'Markdown' });
            awaitingCustomVolume = true;
        } else if (text === '💡 Parlaklık') {
            await bot.sendMessage(chatId, '💡 *Parlaklık Ayarı*\n\nİstediğiniz parlaklık seviyesini girin (0-100):', { parse_mode: 'Markdown' });
            awaitingBrightnessLevel = true;
        } else if (text === '📹 Webcam Kontrol') {
            const result = await quickActionsService.checkWebcamStatus();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '🎤 Mikrofon Kontrol') {
            const result = await quickActionsService.checkMicrophoneStatus();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '📂 Son Dosyalar') {
            const result = await quickActionsService.getRecentFiles();
            // Result artık {message, useMarkdown} objesi döndürüyor
            if (result.useMarkdown === false) {
                await bot.sendMessage(chatId, result.message);
            } else {
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
        } else if (text === '📶 WiFi Şifresi') {
            const result = await quickActionsService.getWiFiPassword();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '🗑️ Geri Dönüşüm Boşalt') {
            const result = await quickActionsService.emptyRecycleBin();
            await bot.sendMessage(chatId, result);
        } else if (text === '🖥️ Masaüstü Göster') {
            const result = await quickActionsService.showDesktop();
            await bot.sendMessage(chatId, result);
        } else if (text === '📁 Panodaki Dosya') {
            const result = await quickActionsService.getClipboardFilePath();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === '💬 Bildirim Gönder') {
            await bot.sendMessage(chatId, '💬 *Bildirim Gönder*\n\nGöndermek istediğiniz bildirimi yazın:', { parse_mode: 'Markdown' });
            awaitingNotificationMessage = true;
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
