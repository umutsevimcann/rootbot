/**
 * RootBot - Windows PC Remote Control Telegram Bot
 * Modüler mimari ile yeniden yazıldı
 */

const { bot, isMessageTooOld, checkAuthorization } = require('./src/bot');
const { handleMessage } = require('./src/handlers/messageHandler');
const { sendMainMenu } = require('./src/ui/menus'); // UPDATED: PHASE 2
const logger = require('./src/utils/logger');
const config = require('./src/core/config'); // UPDATED: PHASE 3
const systemService = require('./src/services/systemService'); // UPDATED: PHASE 4 (was performanceService)
const fileService = require('./src/services/fileService');
const { getInstance } = require('./src/utils/UserStateManager');
const stateManager = getInstance();

// Bot başlatma
logger.info('RootBot başlatılıyor...');
logger.info(`Yetkili kullanıcı ID: ${config.telegram.allowedUserId}`);

// PC açılış bildirimi gönder (OTOMATIK - 403 hatası çözüldü!)
(async () => {
    try {
        const os = require('os');
        const startTime = new Date().toLocaleString('tr-TR');
        const hostname = os.hostname();

        // Bilgisayar açıldığında Telegram'a bildirim gönder
        const message = `🖥 *PC Açıldı*\n\n⏰ Saat: ${startTime}\n💻 Bilgisayar: ${hostname}\n\n✅ RootBot aktif ve hazır!`;
        await bot.sendMessage(config.telegram.allowedUserId, message, { parse_mode: 'Markdown' });

        // Ana menüyü gönder
        await sendMainMenu(bot, config.telegram.allowedUserId, false);

        // Bot hazır olduktan SONRA performans toplamayı başlat
        systemService.startPerformanceCollection();

        logger.info('✅ Açılış bildirimi gönderildi!');
    } catch (error) {
        logger.error('Açılış bildirimi gönderilemedi:', error.message);
        // Hata olursa bile performans toplamayı başlat
        systemService.startPerformanceCollection();
    }
})();

// Tüm mesajları işle
bot.on('message', async (msg) => {
    await handleMessage(msg);
});

// Dosya yüklemeleri (document, photo, video)
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const document = msg.document;

    // Yetkilendirme kontrolü ÖNCE!
    if (!checkAuthorization(chatId)) {
        return;
    }

    // Eski dosyaları görmezden gel
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski dosya görmezden gelindi: ${document.file_name}`);
        return;
    }

    try {
        logger.info(`Dosya alındı: ${document.file_name}`);

        // Kullanıcı dosya yükleme modunda mı kontrol et
        const userState = stateManager.getState(chatId);
        const targetFolder = userState.awaitingFileUpload ? userState.uploadTargetFolder : null;

        const result = await fileService.downloadTelegramFile(bot, document.file_id, document.file_name, chatId, targetFolder);

        try {
            await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
        } catch (sendError) {
            // Markdown parse hatası varsa plain text dene
            await bot.sendMessage(chatId, result.message);
        }

        // Eğer hedef klasöre yüklendiyse, dosya yükleme modundan çık
        if (userState.awaitingFileUpload && result.success) {
            stateManager.setState(chatId, 'awaitingFileUpload', false);
            stateManager.setState(chatId, 'uploadTargetFolder', null);

            // Kullanıcıyı browse moduna geri döndür
            const fileService = require('./src/services/fileService');
            const listResult = await fileService.listFolderContents(userState.currentPath);

            if (listResult.success) {
                const browseKeyboard = {
                    reply_markup: {
                        keyboard: [['Geri', 'Dosya Yükle']],
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                };

                await bot.sendMessage(chatId, listResult.message, { parse_mode: 'Markdown', ...browseKeyboard });

                stateManager.setState(chatId, 'currentFolders', listResult.folders);
                stateManager.setState(chatId, 'currentFiles', listResult.files);
            }
        }
    } catch (error) {
        logger.error('Dosya indirme hatası:', error);
        try {
            await bot.sendMessage(chatId, 'Dosya indirilemedi: ' + error.message);
        } catch (sendError) {
            logger.error('Hata mesajı gönderilemedi:', sendError);
        }
    }
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1]; // En yüksek çözünürlük

    // Yetkilendirme kontrolü ÖNCE!
    if (!checkAuthorization(chatId)) {
        return;
    }

    // Eski fotoğrafları görmezden gel
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski fotoğraf görmezden gelindi`);
        return;
    }

    try {
        const fileName = `photo_${Date.now()}.jpg`;
        logger.info(`Fotoğraf alındı: ${fileName}`);

        // Kullanıcı dosya yükleme modunda mı kontrol et
        const userState = stateManager.getState(chatId);
        const targetFolder = userState.awaitingFileUpload ? userState.uploadTargetFolder : null;

        const result = await fileService.downloadTelegramFile(bot, photo.file_id, fileName, chatId, targetFolder);

        try {
            await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
        } catch (sendError) {
            await bot.sendMessage(chatId, result.message);
        }

        // Eğer hedef klasöre yüklendiyse, dosya yükleme modundan çık
        if (userState.awaitingFileUpload && result.success) {
            stateManager.setState(chatId, 'awaitingFileUpload', false);
            stateManager.setState(chatId, 'uploadTargetFolder', null);

            // Kullanıcıyı browse moduna geri döndür
            const fileService = require('./src/services/fileService');
            const listResult = await fileService.listFolderContents(userState.currentPath);

            if (listResult.success) {
                const browseKeyboard = {
                    reply_markup: {
                        keyboard: [['Geri', 'Dosya Yükle']],
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                };

                await bot.sendMessage(chatId, listResult.message, { parse_mode: 'Markdown', ...browseKeyboard });

                stateManager.setState(chatId, 'currentFolders', listResult.folders);
                stateManager.setState(chatId, 'currentFiles', listResult.files);
            }
        }
    } catch (error) {
        logger.error('Fotoğraf indirme hatası:', error);
        try {
            await bot.sendMessage(chatId, 'Fotoğraf indirilemedi: ' + error.message);
        } catch (sendError) {
            logger.error('Hata mesajı gönderilemedi:', sendError);
        }
    }
});

bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    const video = msg.video;

    // Yetkilendirme kontrolü ÖNCE!
    if (!checkAuthorization(chatId)) {
        return;
    }

    // Eski videoları görmezden gel
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski video görmezden gelindi`);
        return;
    }

    try {
        const fileName = video.file_name || `video_${Date.now()}.mp4`;
        logger.info(`Video alındı: ${fileName}`);

        // Kullanıcı dosya yükleme modunda mı kontrol et
        const userState = stateManager.getState(chatId);
        const targetFolder = userState.awaitingFileUpload ? userState.uploadTargetFolder : null;

        const result = await fileService.downloadTelegramFile(bot, video.file_id, fileName, chatId, targetFolder);

        try {
            await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
        } catch (sendError) {
            await bot.sendMessage(chatId, result.message);
        }

        // Eğer hedef klasöre yüklendiyse, dosya yükleme modundan çık
        if (userState.awaitingFileUpload && result.success) {
            stateManager.setState(chatId, 'awaitingFileUpload', false);
            stateManager.setState(chatId, 'uploadTargetFolder', null);

            // Kullanıcıyı browse moduna geri döndür
            const fileService = require('./src/services/fileService');
            const listResult = await fileService.listFolderContents(userState.currentPath);

            if (listResult.success) {
                const browseKeyboard = {
                    reply_markup: {
                        keyboard: [['Geri', 'Dosya Yükle']],
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                };

                await bot.sendMessage(chatId, listResult.message, { parse_mode: 'Markdown', ...browseKeyboard });

                stateManager.setState(chatId, 'currentFolders', listResult.folders);
                stateManager.setState(chatId, 'currentFiles', listResult.files);
            }
        }
    } catch (error) {
        logger.error('Video indirme hatası:', error);
        try {
            await bot.sendMessage(chatId, 'Video indirilemedi: ' + error.message);
        } catch (sendError) {
            logger.error('Hata mesajı gönderilemedi:', sendError);
        }
    }
});

// Hata yakalama
bot.on('polling_error', (error) => {
    logger.error(`Polling hatası: ${error.message}`);
});

// Başarılı başlatma mesajı
logger.info('RootBot başarıyla başlatıldı!');
logger.info('Bot mesaj bekliyor...');

// Process hata yakalama (FIXED: Graceful shutdown)
process.on('unhandledRejection', async (reason, promise) => {
    logger.error(`Yakalanmamış Promise Reddi: ${reason}`);
    logger.error('Stack:', reason.stack || 'No stack trace');

    try {
        // Graceful cleanup
        systemService.stopPerformanceCollection();
        bot.stopPolling();

        // Give time for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (cleanupError) {
        logger.error('Cleanup hatası:', cleanupError.message);
    } finally {
        process.exit(1);
    }
});

process.on('uncaughtException', async (error) => {
    logger.error(`Yakalanmamış İstisna: ${error.message}`);
    logger.error('Stack:', error.stack);

    try {
        // Graceful cleanup
        systemService.stopPerformanceCollection();
        bot.stopPolling();

        // Give time for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (cleanupError) {
        logger.error('Cleanup hatası:', cleanupError.message);
    } finally {
        process.exit(1);
    }
});

// Çıkış sinyali yakalama (sadece Ctrl+C için - Windows shutdown tetiklemez)
process.on('SIGINT', async () => {
    logger.info('Bot manuel olarak kapatılıyor (Ctrl+C)...');
    try {
        // Performans veri toplamayı durdur
        systemService.stopPerformanceCollection();
    } catch (error) {
        logger.error('Cleanup hatası:', error.message);
    }
    bot.stopPolling();
    process.exit(0);
});

console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║           � RootBot v2.0            ║
║   Windows PC Remote Control Bot       ║
║                                       ║
║   Modüler Mimari - Windows 10/11     ║
║                                       ║
╚═══════════════════════════════════════╝

Bot çalışıyor...
Telegram'dan komut bekliyor...

Botunuzu durdurmak için Ctrl+C tuşlayın.
`);
