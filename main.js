/**
 * RootBot - Windows PC Remote Control Telegram Bot
 * Modüler mimari ile yeniden yazıldı
 */

console.log('========================================');
console.log('MAIN.JS BAŞLADI - SATIR 1');
console.log('========================================');

const { bot, isMessageTooOld } = require('./src/bot');
console.log('✓ Bot modülü yüklendi');

const { handleMessage } = require('./src/handlers/messageHandler');
console.log('✓ Message handler yüklendi');

const { sendMainMenu } = require('./src/menus');
console.log('✓ Main menu yüklendi');

const logger = require('./src/utils/logger');
console.log('✓ Logger yüklendi');

const config = require('./src/config/env');
console.log('✓ Config yüklendi');

const performanceService = require('./src/services/performanceService');
console.log('✓ Performance service yüklendi');

const fileService = require('./src/services/fileService');
console.log('✓ File service yüklendi');

// Bot başlatma
logger.info('RootBot başlatılıyor...');
logger.info(`Yetkili kullanıcı ID: ${config.telegram.allowedUserId}`);

// PC açılış bildirimi gönder
(async () => {
    try {
        const os = require('os');
        const startTime = new Date().toLocaleString('tr-TR');
        const hostname = os.hostname();
        const message = `🟢 *PC Açıldı*\n\n⏰ Saat: ${startTime}\n💻 Bilgisayar: ${hostname}\n\n✅ RootBot aktif ve hazır!`;
        await bot.sendMessage(config.telegram.allowedUserId, message, { parse_mode: 'Markdown' });

        // Ana menüyü gönder
        await sendMainMenu(bot, config.telegram.allowedUserId, false);

        // Bot hazır olduktan SONRA performans toplamayı başlat
        performanceService.startPerformanceCollection();
    } catch (error) {
        logger.error('Açılış bildirimi gönderilemedi:', error.message);
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

    // Eski dosyaları görmezden gel
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski dosya görmezden gelindi: ${document.file_name}`);
        return;
    }

    try {
        logger.info(`Dosya alındı: ${document.file_name}`);
        const result = await fileService.downloadTelegramFile(bot, document.file_id, document.file_name, chatId);
        await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
    } catch (error) {
        logger.error('Dosya indirme hatası:', error);
        await bot.sendMessage(chatId, '❌ Dosya indirilemedi: ' + error.message);
    }
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1]; // En yüksek çözünürlük

    // Eski fotoğrafları görmezden gel
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski fotoğraf görmezden gelindi`);
        return;
    }

    try {
        const fileName = `photo_${Date.now()}.jpg`;
        logger.info(`Fotoğraf alındı: ${fileName}`);
        const result = await fileService.downloadTelegramFile(bot, photo.file_id, fileName, chatId);
        await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
    } catch (error) {
        logger.error('Fotoğraf indirme hatası:', error);
        await bot.sendMessage(chatId, '❌ Fotoğraf indirilemedi: ' + error.message);
    }
});

bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    const video = msg.video;

    // Eski videoları görmezden gel
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski video görmezden gelindi`);
        return;
    }

    try {
        const fileName = video.file_name || `video_${Date.now()}.mp4`;
        logger.info(`Video alındı: ${fileName}`);
        const result = await fileService.downloadTelegramFile(bot, video.file_id, fileName, chatId);
        await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
    } catch (error) {
        logger.error('Video indirme hatası:', error);
        await bot.sendMessage(chatId, '❌ Video indirilemedi: ' + error.message);
    }
});

// Hata yakalama
bot.on('polling_error', (error) => {
    logger.error(`Polling hatası: ${error.message}`);
});

// Başarılı başlatma mesajı
logger.info('✓ RootBot başarıyla başlatıldı!');
logger.info('Bot mesaj bekliyor...');

// Process hata yakalama
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Yakalanmamış Promise Reddi: ${reason}`);
});

process.on('uncaughtException', (error) => {
    logger.error(`Yakalanmamış İstisna: ${error.message}`);
    process.exit(1);
});

// Çıkış sinyali yakalama (sadece Ctrl+C için - Windows shutdown tetiklemez)
process.on('SIGINT', async () => {
    logger.info('Bot manuel olarak kapatılıyor (Ctrl+C)...');
    try {
        // Performans veri toplamayı durdur
        performanceService.stopPerformanceCollection();
    } catch (error) {
        logger.error('Cleanup hatası:', error.message);
    }
    bot.stopPolling();
    process.exit(0);
});

console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║           🤖 RootBot v2.0            ║
║   Windows PC Remote Control Bot       ║
║                                       ║
║   Modüler Mimari - Windows 10/11     ║
║                                       ║
╚═══════════════════════════════════════╝

✓ Bot çalışıyor...
✓ Telegram'dan komut bekliyor...

Botunuzu durdurmak için Ctrl+C tuşlayın.
`);
