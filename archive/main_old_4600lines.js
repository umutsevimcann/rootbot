const TelegramBot = require('node-telegram-bot-api');
const screenshot = require('screenshot-desktop');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');
const si = require('systeminformation');
const notifier = require('node-notifier');
const { machineId } = require('node-machine-id');
const activeWindow = require('active-win');
const util = require('util');
const wol = require('wol');

// Promise tabanlı exec
const execPromise = util.promisify(exec);


// Yapılandırma dosyasını oku
const config = require('./config.json');
const token = config.telegram_token;
const allowedUserId = config.allowed_user_id;

// Menü yapısını güncelle
const menu = {
    main: {
        title: '🚀 *Sistem Kontrol Merkezi*',
        description: 'Merhaba Umut Bey! Bilgisayarınızı uzaktan kontrol edebilirsiniz.',
        commands: {
            '/sistem': 'Sistem Bilgileri',
            '/güvenlik': 'Güvenlik İşlemleri',
            '/programlar': 'Program Yönetimi',
            '/disk': 'Disk İşlemleri',
            '/ağ': 'Ağ Yönetimi',
            '/ses': 'Ses Kontrolü',
            '/yardim': 'Yardım'
        }
    },
    system: {
        title: '💻 *Sistem Bilgileri*',
        description: 'Sistem durumu ve performans bilgileri',
        commands: {
            '/detay': 'Detaylı Sistem Bilgisi',
            '/sıcaklık': 'Sistem Sıcaklıkları',
            '/geri': 'Ana Menü'
        }
    },
    security: {
        title: '🛡️ *Güvenlik İşlemleri*',
        description: 'Güvenlik ve koruma ayarları',
        commands: {
            '/antivirüs': 'Antivirüs Taraması',
            '/güvenlikduvarı': 'Güvenlik Duvarı',
            '/kilitle': 'Bilgisayarı Kilitle',
            '/kamera': 'Kamera Görüntüsü',
            '/ekran': 'Ekran Görüntüsü',
            '/ses': 'Ses Kaydı',
            '/geri': 'Ana Menü'
        }
    },
    programs: {
        title: '📱 *Program Yönetimi*',
        description: 'Programları yönet ve kontrol et',
        commands: {
            '/listele': 'Program Listesi',
            '/başlat': 'Program Başlat',
            '/durdur': 'Program Durdur',
            '/kaldır': 'Program Kaldır',
            '/geri': 'Ana Menü'
        }
    },
    disk: {
        title: '💾 *Disk İşlemleri*',
        description: 'Disk yönetimi ve bakımı',
        commands: {
            '/analiz': 'Disk Analizi',
            '/temizle': 'Disk Temizliği',
            '/geri': 'Ana Menü'
        }
    },
    network: {
        title: '🌐 *Ağ Yönetimi*',
        description: 'Ağ bağlantıları ve ayarları',
        commands: {
            '/durum': 'Ağ Durumu',
            '/tarama': 'Ağ Taraması',
            '/wifi': 'Wi-Fi Bilgileri',
            '/ip': 'IP Bilgileri',
            '/geri': 'Ana Menü'
        }
    },
    audio: {
        title: '🔊 *Ses Kontrolü*',
        description: 'Bilgisayar ses ayarları',
        commands: {
            '/sesdurumu': 'Ses Durumu',
            '/sesaç': 'Sesi Aç',
            '/seskapat': 'Sesi Kapat',
            '/sesayarla': 'Ses Seviyesi Ayarla',
            '/geri': 'Ana Menü'
        }
    }
};

// Global değişkenler
let isLocked = false;
let lastLoginAttempts = [];
let activeProcesses = new Set();
let isAntivirusScanning = false;
let antivirusScanInterval = null;
let lastAntivirusMessageId = null;
let isMonitoring = false;
let lastScreenshotTime = 0;
let lastNotificationTime = 0;
let systemCheckInterval = null;
let networkCheckInterval = null;

// Yeni özellikler için global değişkenler
let awaitingClipboardWrite = false;
let awaitingCommand = false;
let awaitingLaunchProgram = false;
let awaitingKillProgram = false;
let awaitingBlockWebsite = false;
let awaitingUnblockWebsite = false;
let awaiting2FAVerify = false;
let awaitingAIQuestion = false;
let awaitingShutdownTime = false;

// Telegram bot oluştur
const bot = new TelegramBot(token, { polling: true });

// Hata yönetimi
process.on('uncaughtException', (error) => {
    console.error('Beklenmeyen hata:', error);
    notifyAdmin('⚠️ Sistem Hatası: ' + error.message);
    setTimeout(() => {
        process.exit(1);
    }, 3000);
});

// Admin'e bildirim gönderme yardımcı fonksiyonu
async function notifyAdmin(message) {
    try {
        await bot.sendMessage(allowedUserId, message);
    } catch (error) {
        console.error('Telegram bildirim hatası:', error);
    }
}

// Ana program başlangıcı
async function main() {
    try {
        console.log('Bot başlatılıyor...');

        await notifyAdmin('🖥️ Sistem Açık\n\nSistem aktif durumda.\n\nEmirlerinizi bekliyor, Umut Bey.');
        
        // Sistem kontrolünü başlat
        systemCheckInterval = setInterval(checkSystemStatus, 60000); // Her dakika
        // networkCheckInterval = setInterval(checkNetworkChanges, 300000); // Her 5 dakika
        
        // Komut dinleyicilerini başlat
        setupCommandListeners();
        
        // İstenirse başlangıçta kilitle
        if (config.security && config.security.auto_lock && config.security.auto_lock.on_startup) {
            await lockPC();
        }
    } catch (error) {
        console.error('Başlatma hatası:', error);
        notifyAdmin('⚠️ Başlatma hatası: ' + error.message);
    }
}

// Komut dinleyicilerini ayarla
function setupCommandListeners() {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }
        await sendMainMenu(chatId);
    });


    // Özel sesli mesaj için dinleyici
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        
        // Yetkisiz kullanıcıları engelle
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }

        const text = msg.text;
        if (!text) return;

        // Özel sesli mesaj bekleniyor mu?
        if (global.awaitingVoiceMessage) {
            global.awaitingVoiceMessage = false;
            const result = await playVoiceCommand(msg.text);
            await bot.sendMessage(chatId, result);
            return;
        }

        try {
            // Ana menü komutları
            if (text === '/start' || text === '/menu' || text === 'menü') {
                await sendMainMenu(chatId);
            } 
            // Sistem Kontrolü
            else if (text === '🖥️ Sistem' || text === '🖥️ Sistem Kontrolü') {
                await sendSystemMenu(chatId);
            } 
            // Sistem Menüsü Komutları
            else if (text === '📊 Sistem Bilgisi') {
                const sysInfo = await getSystemInfo();
                await bot.sendMessage(chatId, sysInfo, { parse_mode: 'Markdown' });
            }
            else if (text === '🌡️ Sıcaklık' || text === '🌡️ Sıcaklık Kontrolü') {
                const tempInfo = await getSystemTemperature();
                await bot.sendMessage(chatId, tempInfo, { parse_mode: 'Markdown' });
            }
            else if (text === '💻 Çalışan Programlar') {
                const processes = await getRunningPrograms();
                await bot.sendMessage(chatId, processes, { parse_mode: 'Markdown' });
            }
            // Güvenlik
            else if (text === '🔒 Güvenlik') {
                await sendSecurityMenu(chatId);
            } 
            // Güvenlik Menüsü Komutları
            else if (text === '🛡️ Güvenlik Kontrolü') {
                const security = await securityCheck();
                await bot.sendMessage(chatId, security, { parse_mode: 'Markdown' });
            }
            else if (text === '🧬 Antivirüs' || text === '🧬 Antivirüs Taraması') {
                const result = await checkAntivirus();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🔥 Güvenlik Duvarı') {
                const result = await checkFirewall();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            // Disk İşlemleri
            else if (text === '💽 Disk' || text === '💽 Disk İşlemleri') {
                await sendDiskMenu(chatId);
            } 
            // Disk Menüsü Komutları
            else if (text === '🧹 Disk Temizleme') {
                const result = await cleanDisk();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📊 Disk Analizi') {
                const result = await analyzeDisk();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🔍 Disk Kontrolü') {
                const result = await checkDisk();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            // Güç Yönetimi
            else if (text === '⚡ Güç' || text === '⚡ Güç Yönetimi') {
                await sendPowerMenu(chatId);
            } 
            // Güç Menüsü Komutları
            else if (text === '🔒 Kilitle') {
                const result = await lockPC();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔓 Kilidi Aç') {
                const result = await unlockPC();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '💤 Uyku Modu') {
                const result = await sleepMode();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔄 Yeniden Başlat') {
                const result = await rebootSystem();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '⚡ Kapat') {
                await sendShutdownMenu(chatId);
            }
            // Gelişmiş
            else if (text === '🔍 Gelişmiş') {
                await sendAdvancedMenu(chatId);
            } 
            // Gelişmiş Menü Komutları
            else if (text === '🔍 Ağ Taraması') {
                const result = await scanNetwork();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📶 WiFi Bilgisi') {
                const result = await getWifiInfo();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📡 IP Bilgisi' || text === '🌐 IP Bilgisi') {
                const result = await getIPInfo();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📷 Webcam Fotoğrafı') {
                await takeWebcamPhoto();
            }
            else if (text === '🔊 Sesli Uyarı') {
                const result = await playAlert();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '👁️ Kilitle ve İzle') {
                await sendMonitorMenu(chatId);
            }
            else if (text === '📊 İzleme Durumu') {
                const result = await checkMonitoringStatus();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📋 İzleme Raporu') {
                const result = await getMonitoringReport();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '⏱️ İzleme Sıklığını Ayarla') {
                await bot.sendMessage(chatId, '⏱️ Lütfen izleme sıklığını saniye cinsinden yazın (10-3600):');
                global.awaitingMonitoringInterval = true;
            }
            else if (global.awaitingMonitoringInterval) {
                global.awaitingMonitoringInterval = false;
                const result = await setMonitoringInterval(text);
                await bot.sendMessage(chatId, result);
            }
            // Sesli Komutlar
            else if (text === '🔊 Sesli Komutlar') {
                await sendVoiceCommandMenu(chatId);
            }
            // Ana menü yeni butonları
            else if (text === '🌐 Ağ' || text === '🌐 Ağ & İnternet') {
                await sendNetworkMenu(chatId);
            }
            else if (text === '📊 Performans') {
                await sendPerformanceMenu(chatId);
            }
            else if (text === '🎨 Eğlence') {
                await sendEntertainmentMenu(chatId);
            }
            // Sesli Komut Menüsü Komutları
            else if (text === '🔊 Merhaba De') {
                const result = await playVoiceCommand('hello');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Uyarı Ver') {
                const result = await playVoiceCommand('warning');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Şaka Yap') {
                const result = await playVoiceCommand('joke');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Korkut') {
                const result = await playVoiceCommand('scare');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Bilgisayarı Kapatıyorum') {
                const result = await playVoiceCommand('shutdown');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Hacker Uyarısı') {
                const result = await playVoiceCommand('hacker');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Motivasyon') {
                const result = await playVoiceCommand('motivation');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Tebrikler') {
                const result = await playVoiceCommand('congrats');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Özel Mesaj') {
                await bot.sendMessage(chatId, '🔊 Sesli olarak söylenmesini istediğiniz mesajı yazın:');
                global.awaitingVoiceMessage = true;
            }
            // Bildirimler - Direkt bildirim göster
            else if (text === '🔔 Bildirimler') {
                const result = await getWindowsNotifications();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            // Ayarlar - Kategori açma/kapama
            else if (text === '⚙️ Ayarlar') {
                await sendFeaturesMenu(chatId);
            }
            // Yardım butonu kaldırıldı (gereksiz)
            // Ana Menüye Dön
            else if (text === '🔙 Ana Menü') {
                await sendMainMenu(chatId);
            }
            // Ekran Görüntüsü
            else if (text === '📸 Ekran' || text === '📸 Ekran Görüntüsü' || text === '/screenshot' || text === 'ekran görüntüsü') {
                await takeScreenshot();
            } 
            // Sistem Durumu
            else if (text === '📊 Sistem Durumu' || text === '/status' || text === 'durum') {
                const sysInfo = await getSystemInfo();
                await bot.sendMessage(chatId, sysInfo, { parse_mode: 'Markdown' });
            } 
            // Diğer komutlar
            else if (text === '/lock' || text === 'kilitle') {
                const result = await lockPC();
                await bot.sendMessage(chatId, result);
            } else if (text === '/unlock' || text === 'kilidi aç') {
                const result = await unlockPC();
                await bot.sendMessage(chatId, result);
            } else if (text === '/temperature' || text === 'sıcaklık') {
                const tempInfo = await getSystemTemperature();
                await bot.sendMessage(chatId, tempInfo, { parse_mode: 'Markdown' });
            } else if (text === '/processes' || text === 'programlar') {
                const processes = await getRunningPrograms();
                await bot.sendMessage(chatId, processes, { parse_mode: 'Markdown' });
            } else if (text === '/security' || text === 'güvenlik') {
                const security = await securityCheck();
                await bot.sendMessage(chatId, security, { parse_mode: 'Markdown' });
            } else if (text === '/sleep' || text === 'uyku') {
                const result = await sleepMode();
                await bot.sendMessage(chatId, result);
            } else if (text === '/restart' || text === 'yeniden başlat') {
                const result = await rebootSystem();
                await bot.sendMessage(chatId, result);
            } else if (text === '⚡ Hemen Kapat') {
                const immediateResult = await shutdownSystem(0);
                await bot.sendMessage(chatId, immediateResult);
            } else if (text === '⏰ 1 Dakika Sonra') {
                const oneMinResult = await shutdownSystem(1);
                await bot.sendMessage(chatId, oneMinResult);
            } else if (text === '⏰ 5 Dakika Sonra') {
                const fiveMinResult = await shutdownSystem(5);
                await bot.sendMessage(chatId, fiveMinResult);
            } else if (text === '⏰ 10 Dakika Sonra') {
                const tenMinResult = await shutdownSystem(10);
                await bot.sendMessage(chatId, tenMinResult);
            } else if (text === '⏰ 30 Dakika Sonra') {
                const thirtyMinResult = await shutdownSystem(30);
                await bot.sendMessage(chatId, thirtyMinResult);
            } else if (text === '⏰ 1 Saat Sonra') {
                const oneHourResult = await shutdownSystem(60);
                await bot.sendMessage(chatId, oneHourResult);
            } else if (text === '⏰ 2 Saat Sonra') {
                const twoHourResult = await shutdownSystem(120);
                await bot.sendMessage(chatId, twoHourResult);
            } else if (text === '⏰ Özel Süre Belirle') {
                await bot.sendMessage(chatId, '⏰ Lütfen kapatma süresini dakika cinsinden yazın (örn: 15)');
                awaitingShutdownTime = true;
            } else if (text === '❌ İptal Et') {
                const cancelResult = await cancelShutdown();
                await bot.sendMessage(chatId, cancelResult);
            }
            // Ana Menü Komutları
            else if (text === '/ses') {
                await sendAudioMenu(chatId);
            }
            // Ses Menüsü Komutları
            else if (text === '🔊 Ses Durumu') {
                const result = await getAudioStatus();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🔊 Sesi Aç') {
                const result = await unmuteSpeakers();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔇 Sesi Kapat') {
                const result = await muteSpeakers();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔉 Ses: 25%') {
                const result = await setVolumeLevel(25);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔉 Ses: 50%') {
                const result = await setVolumeLevel(50);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Ses: 100%') {
                const result = await setVolumeLevel(100);
                await bot.sendMessage(chatId, result);
            }
            else if (text.startsWith('/sesayarla ')) {
                const level = parseInt(text.replace('/sesayarla ', ''));
                const result = await setVolumeLevel(level);
                await bot.sendMessage(chatId, result);
            }
            // Ses Kontrolü
            else if (text === '🔊 Ses' || text === '🔊 Ses Kontrolü') {
                await sendAudioMenu(chatId);
            }
            // Ses Menüsü Komutları
            else if (text === '🔊 Ses Durumu') {
                const status = await getAudioStatus();
                await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
            }
            else if (text === '🔇 Sessiz Mod') {
                const result = await muteSpeakers();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔉 Ses Azalt') {
                const result = await decreaseVolume();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 Ses Arttır') {
                const result = await increaseVolume();
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 25% Ses') {
                const result = await setVolumeLevel(25);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 50% Ses') {
                const result = await setVolumeLevel(50);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔊 100% Ses') {
                const result = await setVolumeLevel(100);
                await bot.sendMessage(chatId, result);
            }
            // Geri dönüş butonu
            else if (text === '🔙 Ana Menü') {
                await sendMainMenu(chatId);
            }
            // Yeni Özellikler Menü Butonları
            else if (text === '⚙️ Ayarlar' || text === '⚙️ Özellikleri Aç/Kapat') {
                await sendFeaturesMenu(chatId);
            }
            else if (text === '🔍 İzleme & Güvenlik') {
                await sendMonitoringMenu(chatId);
            }
            else if (text === '🎮 Uzaktan Kontrol') {
                await sendRemoteControlMenu(chatId);
            }
            else if (text === '📊 Performans') {
                await sendPerformanceMenu(chatId);
            }
            else if (text === '📅 Otomasyon') {
                await sendAutomationMenu(chatId);
            }
            else if (text === '🌐 Ağ İşlemleri') {
                await sendNetworkMenu(chatId);
            }
            else if (text === '🛡️ Gelişmiş Güvenlik') {
                await sendAdvancedSecurityMenu(chatId);
            }
            else if (text === '🎨 Eğlence & Konfor') {
                await sendEntertainmentMenu(chatId);
            }

            // Kategori 1 Butonları - İzleme & Güvenlik
            else if (text === '🔌 USB Cihazları Göster') {
                const result = await detectUSBDevices();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🎥 Ekran Kaydı (30sn)') {
                const result = await recordScreen(30);
                if (!result.includes('✅')) {
                    await bot.sendMessage(chatId, result);
                }
            }
            else if (text === '🎥 Ekran Kaydı (60sn)') {
                const result = await recordScreen(60);
                if (!result.includes('✅')) {
                    await bot.sendMessage(chatId, result);
                }
            }
            else if (text === '📊 Aktivite' || text === '📊 Aktivite Raporu') {
                const result = await getActivityReport();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }

            // Kategori 3 Butonları - Uzaktan Kontrol
            else if (text === '📋 Panoyu Göster') {
                const result = await getClipboard();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📝 Panoya Yaz') {
                await bot.sendMessage(chatId, '📝 Panoya yazmak istediğiniz metni gönderin:');
                awaitingClipboardWrite = true;
            }
            else if (awaitingClipboardWrite && text) {
                awaitingClipboardWrite = false;
                const result = await writeClipboard(text);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '💻 Komut Çalıştır') {
                await bot.sendMessage(chatId, '💻 *Komut Çalıştır*\n\nÇalıştırmak istediğiniz komutu gönderin:\n\n**Örnekler:**\n• `ipconfig` - Ağ bilgileri\n• `tasklist` - Çalışan programlar\n• `systeminfo` - Sistem detayları\n• `dir C:\\` - Klasör içeriği\n• `netstat -an` - Ağ bağlantıları\n• `ping google.com` - İnternet testi\n• `whoami` - Kullanıcı adı\n• `hostname` - Bilgisayar adı', { parse_mode: 'Markdown' });
                awaitingCommand = true;
            }
            else if (awaitingCommand && text) {
                awaitingCommand = false;
                const result = await runCommand(text);
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🚀 Program Başlat') {
                await bot.sendMessage(chatId, '🚀 *Program Başlat*\n\nBaşlatmak istediğiniz programın adını gönderin:\n\n**Örnekler:**\n• `chrome.exe` - Google Chrome\n• `notepad.exe` - Not Defteri\n• `calc.exe` - Hesap Makinesi\n• `mspaint.exe` - Paint\n• `explorer.exe` - Dosya Gezgini\n• `spotify.exe` - Spotify\n• `cmd.exe` - Komut İstemi\n• `taskmgr.exe` - Görev Yöneticisi', { parse_mode: 'Markdown' });
                awaitingLaunchProgram = true;
            }
            else if (awaitingLaunchProgram && text) {
                awaitingLaunchProgram = false;
                const result = await launchProgram(text);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '❌ Program Kapat' || text === '❌ Program Sonlandır') {
                await bot.sendMessage(chatId, '❌ *Program Sonlandır*\n\nSonlandırmak istediğiniz programın adını gönderin:\n\n**Örnekler:**\n• `chrome.exe` - Google Chrome\n• `notepad.exe` - Not Defteri\n• `spotify.exe` - Spotify\n• `Discord.exe` - Discord\n• `msedge.exe` - Edge\n• `firefox.exe` - Firefox', { parse_mode: 'Markdown' });
                awaitingKillProgram = true;
            }
            else if (awaitingKillProgram && text) {
                awaitingKillProgram = false;
                const result = await killProgram(text);
                await bot.sendMessage(chatId, result);
            }

            // Kategori 4 Butonları - Performans
            else if (text === '📈 Performans Grafiği') {
                const result = await sendPerformanceChart(chatId);
                if (result !== '✅ Grafik gönderildi.') {
                    await bot.sendMessage(chatId, result);
                }
            }
            else if (text === '🚀 Başlangıç' || text === '🚀 Başlangıç Programları') {
                const result = await listStartupPrograms();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🧠 RAM Kullanımı') {
                const os = require('os');
                const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
                const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
                const usedMem = (totalMem - freeMem).toFixed(2);
                const usagePercent = ((usedMem / totalMem) * 100).toFixed(1);
                const message = `🧠 *RAM Kullanımı*\n\n📊 Kullanılan: ${usedMem} GB\n📈 Toplam: ${totalMem} GB\n💾 Boş: ${freeMem} GB\n📉 Kullanım: %${usagePercent}`;
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }
            else if (text === '💻 CPU Kullanımı') {
                const os = require('os');
                const cpus = os.cpus();
                const cpuModel = cpus[0].model;
                const cpuCount = cpus.length;
                let totalIdle = 0, totalTick = 0;
                cpus.forEach(cpu => {
                    for (let type in cpu.times) {
                        totalTick += cpu.times[type];
                    }
                    totalIdle += cpu.times.idle;
                });
                const idle = totalIdle / cpuCount;
                const total = totalTick / cpuCount;
                const usage = (100 - ~~(100 * idle / total)).toFixed(1);
                const message = `💻 *CPU Bilgisi*\n\n🔧 Model: ${cpuModel}\n⚙️ Çekirdek: ${cpuCount}\n📊 Kullanım: %${usage}`;
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }

            // Kategori 5 Butonları - Otomasyon
            else if (text === '📋 Zamanlayıcıları Göster') {
                const result = await listScheduledTasks();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '➕ Zamanlayıcı Ekle') {
                await bot.sendMessage(chatId, '⏰ Zamanlayıcı eklemek için kod gereklidir. Lütfen dokümantasyona bakın.');
            }
            else if (text === '❌ Zamanlayıcı Sil') {
                await bot.sendMessage(chatId, '⏰ Zamanlayıcı silmek için kod gereklidir. Lütfen dokümantasyona bakın.');
            }
            else if (text === '📖 Zamanlayıcı Dökümanı') {
                const docMessage = `📖 *Zamanlayıcı Dökümanı*

🕐 *Cron Format Açıklaması:*
\`\`\`
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ haftanın günü (0-7) (0 veya 7 Pazar)
│    │    │    │    └───── ay (1-12)
│    │    │    └────────── ayın günü (1-31)
│    │    └─────────────── saat (0-23)
│    └──────────────────── dakika (0-59)
└───────────────────────── saniye (0-59, opsiyonel)
\`\`\`

📝 *Örnekler:*

• \`0 23 * * *\` - Her gün saat 23:00'de
• \`0 0 * * 1\` - Her Pazartesi 00:00'da
• \`*/5 * * * *\` - Her 5 dakikada bir
• \`30 9 * * 1-5\` - Hafta içi her gün 09:30'da
• \`0 12,18 * * *\` - Her gün 12:00 ve 18:00'de

🔧 *Kullanım:*
Kod ile kullanabilirsiniz:
\`\`\`javascript
scheduleTask('görev_adı', '0 23 * * *',
  () => lockPC());
\`\`\`

⚙️ *Config.json'dan:*
\`automation.schedules\` bölümünden otomatik görevleri düzenleyebilirsiniz.`;

                await bot.sendMessage(chatId, docMessage, { parse_mode: 'Markdown' });
            }

            // Kategori 6 Butonları - Ağ İşlemleri
            else if (text === '📊 Ağ Trafiği' || text === '📊 Ağ Trafiği Göster') {
                const result = await getNetworkTraffic();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '🚫 Website Engelle') {
                await bot.sendMessage(chatId, '🚫 Engellemek istediğiniz domain\'i gönderin:\n\nÖrnek: `facebook.com`', { parse_mode: 'Markdown' });
                awaitingBlockWebsite = true;
            }
            else if (awaitingBlockWebsite && text) {
                awaitingBlockWebsite = false;
                const result = await blockWebsite(text);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '🔓 Engel Kaldır' || text === '🔓 Website Engel Kaldır') {
                await bot.sendMessage(chatId, '🔓 Engelini kaldırmak istediğiniz domain\'i gönderin:\n\nÖrnek: `facebook.com`', { parse_mode: 'Markdown' });
                awaitingUnblockWebsite = true;
            }
            else if (awaitingUnblockWebsite && text) {
                awaitingUnblockWebsite = false;
                const result = await unblockWebsite(text);
                await bot.sendMessage(chatId, result);
            }
            else if (text === '📋 Engellenen Siteler') {
                const result = await listBlockedWebsites();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }

            // Kategori 7 Butonları - Gelişmiş Güvenlik
            else if (text === '🔐 2FA Aktif Et') {
                await bot.sendMessage(chatId, '⚠️ *2FA Özelliği Devre Dışı*\n\nBu özellik şu anda kullanılamıyor.\n\nℹ️ Aktif etmek için `speakeasy` paketini yükleyin:\n```\nnpm install speakeasy\n```', { parse_mode: 'Markdown' });
            }
            else if (text === '✅ 2FA Doğrula') {
                await bot.sendMessage(chatId, '⚠️ *2FA Özelliği Devre Dışı*\n\nBu özellik şu anda kullanılamıyor.', { parse_mode: 'Markdown' });
            }
            else if (text === '📊 Güvenlik Raporu') {
                const result = await getSecurityReport();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }

            // Kategori 8 Butonları - Eğlence & Konfor
            else if (text === '🤖 Komut Asistanı') {
                await bot.sendMessage(chatId, '🤖 Komut Asistanı\'a ne sormak istersiniz?\n\nÖrnek:\n- PC\'yi kilitle\n- Ekran görüntüsü al\n- USB var mı?', { parse_mode: 'Markdown' });
                awaitingAIQuestion = true;
            }
            else if (awaitingAIQuestion && text) {
                awaitingAIQuestion = false;
                const result = await aiAssistant(text);
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '📬 Bildirimler') {
                const result = await getWindowsNotifications();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            else if (text === '▶️ Medya Oynat') {
                const result = await controlMusic('play');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '⏸️ Medya Duraklat') {
                const result = await controlMusic('pause');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '⏭️ Sonraki Şarkı') {
                const result = await controlMusic('next');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '⏮️ Önceki Şarkı') {
                const result = await controlMusic('previous');
                await bot.sendMessage(chatId, result);
            }
            else if (text === '😊 PC Sağlığı') {
                const result = await getSystemHealth();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Mesaj işleme hatası:', error);
            await bot.sendMessage(chatId, '❌ Hata: ' + error.message);
        }
    });

    // Özel süre girişi için mesaj işleyici
    bot.on('text', async (msg) => {
        if (msg.from.id.toString() !== config.allowed_user_id) {
            return;
        }

        const chatId = msg.chat.id;
        const text = msg.text;

        // Sayı kontrolü - SADECE awaitingShutdownTime true ise
        if (awaitingShutdownTime && !isNaN(text) && parseInt(text) > 0) {
            awaitingShutdownTime = false;
            const minutes = parseInt(text);
            const result = await shutdownSystem(minutes);
            await bot.sendMessage(chatId, result);
        }
    });

    // Callback sorguları için dinleyici
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const data = callbackQuery.data;
        
        // Yetkisiz kullanıcıları engelle
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '⚠️ Bu botu kullanma yetkiniz yok.',
                show_alert: true
            });
            return;
        }

        try {
            // Ana menü işlemleri
            if (data === 'system_menu') {
                await sendSystemMenu(chatId, messageId);
            } else if (data === 'security_menu') {
                await sendSecurityMenu(chatId, messageId);
            } else if (data === 'disk_menu') {
                await sendDiskMenu(chatId, messageId);
            } else if (data === 'power_menu') {
                await sendPowerMenu(chatId, messageId);
            } else if (data === 'advanced_menu') {
                await sendAdvancedMenu(chatId, messageId);
            } else if (data === 'notifications_menu') {
                // Bildirimler menüsü kaldırıldı
                const result = await getWindowsNotifications();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'settings_menu') {
                // Ayarlar menüsü yerine kategori yönetimi
                await sendFeaturesMenu(chatId);
            } else if (data === 'voice_menu') {
                await sendVoiceCommandMenu(chatId, messageId);
            } else if (data === 'network_menu') {
                await sendNetworkMenu(chatId, messageId);
            } else if (data === 'audio_menu') {
                await sendAudioMenu(chatId, messageId);
            } else if (data === 'main_menu') {
                await bot.answerCallbackQuery(callbackQuery.id);
                await sendMainMenu(chatId);
            } 
            // Doğrudan işlemler
            else if (data === 'screenshot') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📸 Ekran görüntüsü alınıyor...' });
                await takeScreenshot();
            } else if (data === 'status') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📊 Sistem durumu alınıyor...' });
                const sysInfo = await getSystemInfo();
                await bot.sendMessage(chatId, sysInfo, { parse_mode: 'Markdown' });
            } 
            // Sistem menüsü işlemleri
            else if (data === 'system_info') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📊 Sistem bilgisi alınıyor...' });
                const sysInfo = await getSystemInfo();
                await bot.sendMessage(chatId, sysInfo, { parse_mode: 'Markdown' });
            } else if (data === 'temperature') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🌡️ Sıcaklık bilgisi alınıyor...' });
                const tempInfo = await getSystemTemperature();
                await bot.sendMessage(chatId, tempInfo, { parse_mode: 'Markdown' });
            } else if (data === 'processes') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '💻 Programlar listeleniyor...' });
                const processes = await getRunningPrograms();
                await bot.sendMessage(chatId, processes, { parse_mode: 'Markdown' });
            } 
            // Güvenlik menüsü işlemleri
            else if (data === 'security_check') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🛡️ Güvenlik kontrolü yapılıyor...' });
                const security = await securityCheck();
                await bot.sendMessage(chatId, security, { parse_mode: 'Markdown' });
            } else if (data === 'antivirus') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🧬 Antivirüs taraması başlatılıyor...' });
                const result = await checkAntivirus();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'firewall') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔥 Güvenlik duvarı kontrol ediliyor...' });
                const result = await checkFirewall();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } 
            // Disk menüsü işlemleri
            else if (data === 'disk_cleanup') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🧹 Disk temizleniyor...' });
                const result = await cleanDisk();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'disk_analyze') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📊 Disk analiz ediliyor...' });
                const result = await analyzeDisk();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'disk_check') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔍 Disk kontrol ediliyor...' });
                const result = await checkDisk();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } 
            // Güç menüsü işlemleri
            else if (data === 'lock') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔒 Bilgisayar kilitleniyor...' });
                const result = await lockPC();
                await bot.sendMessage(chatId, result);
            } else if (data === 'unlock') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔓 Bilgisayar kilidi açılıyor...' });
                const result = await unlockPC();
                await bot.sendMessage(chatId, result);
            } else if (data === 'sleep') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '💤 Bilgisayar uyku moduna alınıyor...' });
                const result = await sleepMode();
                await bot.sendMessage(chatId, result);
            } else if (data === 'restart') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 Bilgisayar yeniden başlatılıyor...' });
                const result = await rebootSystem();
                await bot.sendMessage(chatId, result);
            } else if (data === 'shutdown') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '⚡ Bilgisayar kapatılıyor...' });
                const result = await shutdownSystem();
                await bot.sendMessage(chatId, result);
            }
            // Gelişmiş menü işlemleri
            else if (data === 'network_scan') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔍 Ağ taraması yapılıyor...' });
                const result = await scanNetwork();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'wifi_info') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📶 WiFi bilgisi alınıyor...' });
                const result = await getWifiInfo();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'ip_info') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🌐 IP bilgisi alınıyor...' });
                const result = await getIPInfo();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'webcam_photo') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📷 Webcam fotoğrafı alınıyor...' });
                await takeWebcamPhoto();
            } else if (data === 'play_alert') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Sesli uyarı gönderiliyor...' });
                const result = await playAlert();
                await bot.sendMessage(chatId, result);
            } else if (data === 'lock_and_monitor') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '👁️ Kilitleme ve izleme başlatılıyor...' });
                const result = await lockAndMonitor();
                await bot.sendMessage(chatId, result);
            } else if (data === 'stop_monitoring') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🛑 İzleme durduruluyor...' });
                const result = await stopMonitoring();
                await bot.sendMessage(chatId, result);
            } else if (data === 'monitor_menu') {
                await sendMonitorMenu(chatId, messageId);
            } else if (data === 'start_monitoring') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '👁️ İzleme başlatılıyor...' });
                const result = await lockAndMonitor();
                await bot.sendMessage(chatId, result);
            } else if (data === 'monitoring_status') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📊 İzleme durumu alınıyor...' });
                const result = await checkMonitoringStatus();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            } else if (data === 'monitoring_report') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '📋 İzleme raporu hazırlanıyor...' });
                const result = await getMonitoringReport();
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
            // Sesli komut işlemleri
            else if (data === 'voice_hello') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Merhaba deniyor...' });
                const result = await playVoiceCommand('hello');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_warning') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Uyarı veriliyor...' });
                const result = await playVoiceCommand('warning');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_joke') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Şaka yapılıyor...' });
                const result = await playVoiceCommand('joke');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_scare') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Korkutma mesajı gönderiliyor...' });
                const result = await playVoiceCommand('scare');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_shutdown') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Kapatma uyarısı gönderiliyor...' });
                const result = await playVoiceCommand('shutdown');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_hacker') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Hacker uyarısı gönderiliyor...' });
                const result = await playVoiceCommand('hacker');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_motivation') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Motivasyon mesajı gönderiliyor...' });
                const result = await playVoiceCommand('motivation');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_congrats') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Tebrik mesajı gönderiliyor...' });
                const result = await playVoiceCommand('congrats');
                await bot.sendMessage(chatId, result);
            } else if (data === 'voice_custom') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Özel mesaj için hazırlanıyor...' });
                await bot.sendMessage(chatId, '🔊 Sesli olarak söylenmesini istediğiniz mesajı yazın:');
                // Özel mesaj için durum ayarla
                global.awaitingVoiceMessage = true;
            }
            // Ses menüsü işlemleri
            else if (data === 'audio_status') {
                const status = await getAudioStatus();
                await bot.answerCallbackQuery(callbackQuery.id);
                await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
            }
            else if (data === 'audio_toggle_mute') {
                // Mevcut sessize alma durumunu al
                let result;
                try {
                    const { stdout } = await execPromise('powershell -command "$devices = Get-WmiObject -Class MSFT_MixerDevice -Namespace root/Microsoft/Windows/MMDevice; $devices | Where-Object {$_.DeviceType -eq \'Playback\'} | ForEach-Object {$_.IsMuted}"');
                    const isMuted = stdout.toLowerCase().includes("true");
                    
                    // Durumu tersine çevir
                    if (isMuted) {
                        result = await unmuteSpeakers();
                    } else {
                        result = await muteSpeakers();
                    }
                } catch (error) {
                    // Durum alınamazsa varsayılan olarak sessize alma işlemini dene
                    result = await muteSpeakers();
                }
                
                await bot.answerCallbackQuery(callbackQuery.id, { text: result });
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_volume_down') {
                const result = await decreaseVolume();
                await bot.answerCallbackQuery(callbackQuery.id, { text: result });
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_volume_up') {
                const result = await increaseVolume();
                await bot.answerCallbackQuery(callbackQuery.id, { text: result });
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_volume_set') {
                await bot.answerCallbackQuery(callbackQuery.id);
                const msg = await bot.sendMessage(chatId, '🔊 *Ses Seviyesi Ayarla*\n\nLütfen 0-100 arasında bir ses seviyesi değeri girin:', {
                    parse_mode: 'Markdown'
                });
                
                // Sonraki mesajı dinle
                bot.onReplyToMessage(chatId, msg.message_id, async (replyMsg) => {
                    const level = parseInt(replyMsg.text.trim());
                    const result = await setVolumeLevel(level);
                    await bot.sendMessage(chatId, result);
                });
            }
            else if (data === 'audio_devices') {
                await bot.answerCallbackQuery(callbackQuery.id);
                await listAudioDevices(chatId);
            }
            else if (data === 'audio_settings') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔧 Ses ayarları açılıyor...' });
                await execPromise('powershell -command "Start-Process control.exe -ArgumentList mmsys.cpl"');
                await bot.sendMessage(chatId, '🔧 Windows ses ayarları açıldı.');
            }
            else if (data.startsWith('audio_device_')) {
                const deviceIndex = data.replace('audio_device_', '');
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 Ses cihazı değiştiriliyor...' });
                const result = await changeAudioDevice(deviceIndex);
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_unmute') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Ses açılıyor...' });
                const result = await unmuteSpeakers();
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_mute') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔇 Ses kapatılıyor...' });
                const result = await muteSpeakers();
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_volume_25') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔉 Ses seviyesi 25% olarak ayarlanıyor...' });
                const result = await setVolumeLevel(25);
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_volume_50') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔉 Ses seviyesi 50% olarak ayarlanıyor...' });
                const result = await setVolumeLevel(50);
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_volume_100') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔊 Ses seviyesi 100% olarak ayarlanıyor...' });
                const result = await setVolumeLevel(100);
                await bot.sendMessage(chatId, result);
            }
            else if (data === 'audio_default_speaker') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 Varsayılan hoparlöre geçiliyor...' });
                await execPromise('powershell -command "Get-AudioDevice -List | Where-Object {$_.Type -eq \'Playback\' -and $_.Name -like \'*speaker*\'} | Set-AudioDevice"');
                await bot.sendMessage(chatId, '✅ Varsayılan hoparlör ayarlandı.');
            }
            else if (data === 'audio_headphones') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 Kulaklığa geçiliyor...' });
                await execPromise('powershell -command "Get-AudioDevice -List | Where-Object {$_.Type -eq \'Playback\' -and $_.Name -like \'*headphone*\'} | Set-AudioDevice"');
                await bot.sendMessage(chatId, '✅ Kulaklık ayarlandı.');
            }
            else if (data === 'audio_hdmi') {
                await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 HDMI ses cihazına geçiliyor...' });
                await execPromise('powershell -command "Get-AudioDevice -List | Where-Object {$_.Type -eq \'Playback\' -and $_.Name -like \'*HDMI*\'} | Set-AudioDevice"');
                await bot.sendMessage(chatId, '✅ HDMI ses cihazı ayarlandı.');
            }
            
        } catch (error) {
            console.error('Callback işleme hatası:', error);
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '❌ İşlem sırasında bir hata oluştu.',
                show_alert: true
            });
        }
    });

    // Ses kontrolü için komut dinleyicileri
    bot.onText(/\/ses/, async (msg) => {
        const chatId = msg.chat.id;
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }
        await sendAudioMenu(chatId);
    });

    bot.onText(/\/sesdurumu/, async (msg) => {
        const chatId = msg.chat.id;
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }
        const result = await getAudioStatus();
        await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/sesaç/, async (msg) => {
        const chatId = msg.chat.id;
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }
        const result = await unmuteSpeakers();
        await bot.sendMessage(chatId, result);
    });

    bot.onText(/\/seskapat/, async (msg) => {
        const chatId = msg.chat.id;
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }
        const result = await muteSpeakers();
        await bot.sendMessage(chatId, result);
    });

    bot.onText(/\/sesayarla (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (chatId.toString() !== allowedUserId.toString()) {
            await bot.sendMessage(chatId, '⚠️ Bu botu kullanma yetkiniz yok.');
            return;
        }
        const level = parseInt(match[1]);
        const result = await setVolumeLevel(level);
        await bot.sendMessage(chatId, result);
    });
}

// Ana menüyü gönder
async function sendMainMenu(chatId, messageId = null) {
    try {
        // Sohbet içi klavye menüsü oluştur (Yeniden düzenlendi)
        const mainMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🖥️ Sistem', '⚡ Güç', '🔒 Güvenlik'],
                    ['💽 Disk', '📸 Ekran', '🔊 Ses'],
                    ['🌐 Ağ', '📁 Dosya', '📅 Otomasyon'],
                    ['📊 Performans', '🎨 Eğlence'],
                    ['⚙️ Ayarlar', '🔔 Bildirimler']
                ],
                resize_keyboard: true,
                one_time_keyboard: false,
                persistent: true
            }
        };
        
        // Hoş geldin mesajı
        const welcomeMessage = `
🚀 *Sistem Kontrol Merkezi*

Merhaba Umut Bey! Bilgisayarınızı uzaktan kontrol edebilirsiniz.

📱 *Anlık Durum:*
${isLocked ? '🔒 Bilgisayar şu anda kilitli' : '🔓 Bilgisayar şu anda açık'}
⏰ Son kontrol: ${new Date().toLocaleTimeString()}

Lütfen aşağıdaki menüden bir seçenek seçin:
`;
        
        await bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            ...mainMenuKeyboard
        });
    } catch (error) {
        console.error('Menü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// Sistem menüsünü gönder
async function sendSystemMenu(chatId, messageId = null) {
    try {
        const systemMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['📊 Sistem Bilgisi', '🌡️ Sıcaklık'],
                    ['💻 Çalışan Programlar', '🚀 Program Başlat'],
                    ['📋 Panoyu Göster', '📝 Panoya Yaz'],
                    ['💻 Komut Çalıştır', '❌ Program Kapat'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };

        const message = '🖥️ *Sistem & Uzaktan Kontrol*\n\nSistem yönetimi ve uzaktan kontrol işlemleri:';

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...systemMenuKeyboard
        });
    } catch (error) {
        console.error('Sistem menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// Güvenlik menüsünü gönder (Genişletilmiş)
async function sendSecurityMenu(chatId, messageId = null) {
    try {
        const securityMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🛡️ Güvenlik Kontrolü', '📊 Güvenlik Raporu'],
                    ['🧬 Antivirüs', '🔥 Güvenlik Duvarı'],
                    ['🔌 USB Cihazları', '📊 Aktivite'],
                    ['🎥 Ekran Kaydı (30sn)', '🎥 Ekran Kaydı (60sn)'],
                    ['🔐 2FA Aktif Et', '✅ 2FA Doğrula'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };

        const message = '🔒 *Güvenlik Merkezi*\n\nİzleme, güvenlik ve 2FA özellikleri:';

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...securityMenuKeyboard
        });
    } catch (error) {
        console.error('Güvenlik menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// Disk menüsünü gönder
async function sendDiskMenu(chatId, messageId = null) {
    try {
        const diskMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🧹 Disk Temizleme'],
                    ['📊 Disk Analizi', '🔍 Disk Kontrolü'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };
        
        const message = '💽 *Disk İşlemleri*\n\nLütfen bir işlem seçin:';
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...diskMenuKeyboard
        });
    } catch (error) {
        console.error('Disk menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// Güç menüsünü gönder
async function sendPowerMenu(chatId, messageId = null) {
    try {
        const powerMenuKeyboard = {
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
        
        const message = '⚡ *Güç Yönetimi*\n\nLütfen bir işlem seçin:';
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...powerMenuKeyboard
        });
    } catch (error) {
        console.error('Güç menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// PC'yi kilitle
async function lockPC() {
    try {
        await execPromise('rundll32.exe user32.dll,LockWorkStation');
        isLocked = true;
        return '🔒 Bilgisayar kilitlendi';
    } catch (error) {
        console.error('Kilitleme hatası:', error);
        return '❌ Kilitleme başarısız: ' + error.message;
    }
}

// PC kilidini aç
async function unlockPC() {
    try {
        // Windows kilit ekranından çık
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys(\'{ENTER}\')"');
        isLocked = false;
        return '🔓 Kilit açıldı';
    } catch (error) {
        console.error('Kilit açma hatası:', error);
        return '❌ Kilit açma başarısız: ' + error.message;
    }
}

// Ekran görüntüsü al
async function takeScreenshot() {
    try {
        const timestamp = Date.now();
        const filename = `screenshot_${timestamp}.png`;
        const filepath = path.join(__dirname, filename);
        
        await screenshot({ filename: filepath });
        
        // Dosyayı doğrudan yolu ile gönder
        await bot.sendPhoto(allowedUserId, filepath, {
            caption: '📸 Ekran görüntüsü alındı'
        });
        
        // Dosyayı sil
        fs.unlinkSync(filepath);
        
        return true;
    } catch (error) {
        console.error('Ekran görüntüsü hatası:', error);
        await notifyAdmin('❌ Ekran görüntüsü alınamadı: ' + error.message);
        return false;
    }
}

// Sistem sıcaklığını al
async function getSystemTemperature() {
    try {
        const temps = await si.cpuTemperature();
        const graphics = await si.graphics();
        let report = '*🌡️ Sistem Sıcaklıkları*\n\n';
        
        // CPU Sıcaklıkları
        if (temps?.main) {
        report += `*CPU Sıcaklığı:* ${temps.main}°C\n`;
        if (temps.cores && temps.cores.length > 0) {
            report += '\n*Çekirdek Sıcaklıkları:*\n';
            temps.cores.forEach((temp, i) => {
                    report += `• Çekirdek ${i + 1}: ${temp}°C\n`;
                });
            }
        } else {
            report += '*CPU Sıcaklığı:* Bilinmiyor\n';
        }
        
        // GPU Sıcaklıkları
        if (graphics.controllers && graphics.controllers.length > 0) {
            report += '\n*GPU Sıcaklıkları:*\n';
            graphics.controllers.forEach((gpu, index) => {
                if (gpu.temperatureGpu) {
                    report += `• GPU ${index + 1}: ${gpu.temperatureGpu}°C\n`;
                } else {
                    report += `• GPU ${index + 1}: Bilinmiyor\n`;
                }
            });
        }
        
        // Sıcaklık değerlendirmesi
        if (temps?.main) {
        if (temps.main > 80) {
            report += '\n⚠️ *DİKKAT:* CPU sıcaklığı çok yüksek!';
        } else if (temps.main > 70) {
            report += '\n⚠️ *UYARI:* CPU sıcaklığı yüksek.';
        } else {
                report += '\n✅ CPU sıcaklığı normal.';
            }
        }
        
        // GPU sıcaklık değerlendirmesi
        if (graphics.controllers && graphics.controllers.length > 0) {
            graphics.controllers.forEach((gpu, index) => {
                if (gpu.temperatureGpu) {
                    if (gpu.temperatureGpu > 80) {
                        report += `\n⚠️ *DİKKAT:* GPU ${index + 1} sıcaklığı çok yüksek!`;
                    } else if (gpu.temperatureGpu > 70) {
                        report += `\n⚠️ *UYARI:* GPU ${index + 1} sıcaklığı yüksek.`;
                    }
                }
            });
        }
        
        return report;
    } catch (error) {
        console.error('Sıcaklık bilgisi alma hatası:', error);
        return '❌ Sıcaklık bilgisi alınamadı: ' + error.message;
    }
}


// Çalışan programları listele
async function getRunningPrograms() {
    try {
        const { stdout } = await execPromise('tasklist /FO CSV /NH');
        const processes = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [name, pid, ...rest] = line.replace(/"/g, '').split(',');
                return { name, pid };
            })
            .slice(0, 20); // İlk 20 process
        
        let report = '*💻 Çalışan Programlar*\n\n';
        processes.forEach(proc => {
            report += `• ${proc.name} (PID: ${proc.pid})\n`;
        });
        
        return report;
    } catch (error) {
        console.error('Program listesi alma hatası:', error);
        return '❌ Program listesi alınamadı: ' + error.message;
    }
}

// Güvenlik kontrolü yap
async function securityCheck() {
    try {
        let report = '*🛡️ Güvenlik Kontrolü*\n\n';
        
        // Windows Defender durumu
        const { stdout: defenderStatus } = await execPromise('powershell -Command "Get-MpComputerStatus | Select-Object -Property RealTimeProtectionEnabled"');
        const isDefenderEnabled = defenderStatus.includes('True');
        
        // Güvenlik duvarı durumu
        const { stdout: firewallStatus } = await execPromise('netsh advfirewall show allprofiles state');
        const isFirewallEnabled = firewallStatus.includes('ON');
        
        // Güncellemeler
        const { stdout: updates } = await execPromise('powershell -Command "Get-HotFix | Sort-Object -Property InstalledOn -Descending | Select-Object -First 1"');
        
        report += `*Windows Defender:* ${isDefenderEnabled ? '✅ Aktif' : '❌ Devre Dışı'}\n`;
        report += `*Güvenlik Duvarı:* ${isFirewallEnabled ? '✅ Aktif' : '❌ Devre Dışı'}\n`;
        report += `*Son Güncelleme:* ${updates.split('\n')[3]?.trim() || 'Bilinmiyor'}\n`;
        
        return report;
    } catch (error) {
        console.error('Güvenlik kontrolü hatası:', error);
        return '❌ Güvenlik kontrolü başarısız: ' + error.message;
    }
}

// Uyku moduna al
async function sleepMode() {
    try {
        await execPromise('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return '💤 Bilgisayar uyku moduna alınıyor...';
    } catch (error) {
        console.error('Uyku modu hatası:', error);
        return '❌ Uyku moduna alma başarısız: ' + error.message;
    }
}

// Sistemi yeniden başlat
async function rebootSystem() {
    try {
        await execPromise('shutdown /r /t 60 /c "Sistem 60 saniye içinde yeniden başlatılacak"');
        return '🔄 Sistem 60 saniye içinde yeniden başlatılacak...';
    } catch (error) {
        console.error('Yeniden başlatma hatası:', error);
        return '❌ Yeniden başlatma başarısız: ' + error.message;
    }
}

// Sistemi kapat
async function shutdownSystem(minutes = 0) {
    try {
        if (minutes === 0) {
            await execPromise('shutdown /s /t 0');
            return '⚡ Bilgisayar hemen kapatılıyor...';
        } else {
            const seconds = minutes * 60;
            await execPromise(`shutdown /s /t ${seconds}`);
            return `⏰ Bilgisayar ${minutes} dakika sonra kapatılacak.`;
        }
    } catch (error) {
        console.error('Kapatma hatası:', error);
        return '❌ Kapatma başarısız: ' + error.message;
    }
}

// Sistem durumunu kontrol et
async function checkSystemStatus() {
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const temp = await si.cpuTemperature();
        
        // Yüksek CPU kullanımı kontrolü
        if (cpu.load > 90) {
            await notifyAdmin(`⚠️ Yüksek CPU Kullanımı: %${cpu.load.toFixed(1)}`);
        }
        
        // Yüksek RAM kullanımı kontrolü
        const ramUsage = (mem.used / mem.total) * 100;
        if (ramUsage > 90) {
            await notifyAdmin(`⚠️ Yüksek RAM Kullanımı: %${ramUsage.toFixed(1)}`);
        }
        
        // Yüksek sıcaklık kontrolü
        if (temp.main > 80) {
            await notifyAdmin(`🌡️ Yüksek CPU Sıcaklığı: ${temp.main}°C`);
        }
        
    } catch (error) {
        console.error('Sistem kontrolü hatası:', error);
    }
}

// Ağ değişikliklerini kontrol et
async function checkNetworkChanges() {
    try {
        const networkInterfaces = os.networkInterfaces();
        const activeInterfaces = [];
        
        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            for (const interface of interfaces) {
                if (!interface.internal) {
                    activeInterfaces.push({
                        name,
                        address: interface.address,
                        family: interface.family
                    });
                }
            }
        }
        
        await notifyAdmin('🌐 Aktif Ağ Bağlantıları:\n\n' + 
            activeInterfaces.map(i => `${i.name}: ${i.address} (${i.family})`).join('\n'));
            
    } catch (error) {
        console.error('Ağ kontrolü hatası:', error);
    }
}

// Birleştirilmiş sistem bilgisi fonksiyonu
async function getSystemInfo() {
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const os = await si.osInfo();
        const disk = await si.fsSize();
        const temp = await si.cpuTemperature();
        const graphics = await si.graphics();
        const network = await si.networkInterfaces();
        const processes = await si.processes();
        const { stdout: tasklist } = await execPromise('tasklist /FO CSV /NH');
        const runningProcesses = tasklist.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [name, pid, ...rest] = line.replace(/"/g, '').split(',');
                return { name, pid };
            })
            .slice(0, 20);
        
        let info = '*💻 Detaylı Sistem Bilgisi*\n\n';
        
        // İşletim Sistemi Bilgileri
        info += '*🖥️ İşletim Sistemi:*\n';
        info += `• İsim: ${os.distro || 'Bilinmiyor'}\n`;
        info += `• Sürüm: ${os.release || 'Bilinmiyor'}\n`;
        info += `• Platform: ${os.platform || 'Bilinmiyor'}\n`;
        info += `• Mimar: ${os.arch || 'Bilinmiyor'}\n`;
        info += `• Çalışma Süresi: ${os.uptime ? formatUptime(os.uptime) : 'Bilinmiyor'}\n\n`;
        
        // CPU Bilgileri
        info += '*⚡ İşlemci (CPU):*\n';
        info += `• Üretici: ${cpu.manufacturer || 'Bilinmiyor'}\n`;
        info += `• Model: ${cpu.brand || 'Bilinmiyor'}\n`;
        info += `• Çekirdek Sayısı: ${cpu.cores || 'Bilinmiyor'}\n`;
        info += `• İş Parçacığı Sayısı: ${cpu.physicalCores || 'Bilinmiyor'}\n`;
        info += `• Hız: ${cpu.speed ? cpu.speed + ' GHz' : 'Bilinmiyor'}\n`;
        info += `• Kullanım: %${cpu.load ? cpu.load.toFixed(1) : 'Bilinmiyor'}\n`;
        info += `• Sıcaklık: ${temp?.main ? temp.main + '°C' : 'Bilinmiyor'}\n\n`;
        
        // Bellek (RAM) Bilgileri
        info += '*🧠 Bellek (RAM):*\n';
        info += `• Toplam: ${formatBytes(mem.total)}\n`;
        info += `• Kullanılan: ${formatBytes(mem.used)} (%${((mem.used / mem.total) * 100).toFixed(1)})\n`;
        info += `• Boş: ${formatBytes(mem.free)} (%${((mem.free / mem.total) * 100).toFixed(1)})\n`;
        info += `• Önbellek: ${mem.cached ? formatBytes(mem.cached) : 'Bilinmiyor'}\n`;
        info += `• Takas: ${mem.swapTotal ? formatBytes(mem.swapTotal) : 'Bilinmiyor'} (Kullanılan: ${mem.swapUsed ? formatBytes(mem.swapUsed) : 'Bilinmiyor'})\n\n`;
        
        // Disk Bilgileri
        info += '*💾 Disk Kullanımı:*\n';
        disk.forEach(d => {
            info += `*${d.fs}:*\n`;
            info += `• Toplam: ${formatBytes(d.size)}\n`;
            info += `• Kullanılan: ${formatBytes(d.used)} (%${d.use?.toFixed(1) || 'Bilinmiyor'})\n`;
            info += `• Boş: ${formatBytes(d.available)}\n`;
            info += `• Tip: ${d.type || 'Bilinmiyor'}\n\n`;
        });
        
        // GPU Bilgileri
        if (graphics.controllers && graphics.controllers.length > 0) {
            info += '*🎮 Ekran Kartı (GPU):*\n';
            graphics.controllers.forEach((gpu, index) => {
                info += `*GPU ${index + 1}:*\n`;
                info += `• Model: ${gpu.model || 'Bilinmiyor'}\n`;
                info += `• Üretici: ${gpu.vendor || 'Bilinmiyor'}\n`;
                info += `• VRAM: ${gpu.memoryTotal ? formatBytes(gpu.memoryTotal) : 'Bilinmiyor'}\n`;
                info += `• Sürücü: ${gpu.driverVersion || 'Bilinmiyor'}\n`;
                info += `• Sıcaklık: ${gpu.temperatureGpu ? gpu.temperatureGpu + '°C' : 'Bilinmiyor'}\n\n`;
            });
        }
        
        // Ağ Bilgileri
        info += '*🌐 Ağ Bağlantıları:*\n';
        const activeNetworks = network.filter(net => !net.internal);
        if (activeNetworks.length > 0) {
            activeNetworks.forEach((net, index) => {
                info += `*Bağlantı ${index + 1}:*\n`;
                info += `• Ağ Adı: ${net.iface || 'Bilinmiyor'}\n`;
                info += `• IP Adresi: ${net.ip4 || 'Bilinmiyor'}\n`;
                info += `• MAC Adresi: ${net.mac || 'Bilinmiyor'}\n`;
                info += `• Hız: ${net.speed ? net.speed + ' Mbps' : 'Bilinmiyor'}\n\n`;
            });
        } else {
            info += 'Aktif ağ bağlantısı bulunamadı.\n\n';
        }
        
        // Çalışan Programlar
        info += '*📊 Çalışan Programlar:*\n';
        runningProcesses.forEach(proc => {
            info += `• ${proc.name} (PID: ${proc.pid})\n`;
        });
        info += '\n';
        
        // Güvenlik Durumu
        const { stdout: defenderStatus } = await execPromise('powershell -Command "Get-MpComputerStatus | Select-Object -Property RealTimeProtectionEnabled"').catch(() => ({ stdout: '' }));
        const { stdout: firewallStatus } = await execPromise('netsh advfirewall show allprofiles state').catch(() => ({ stdout: '' }));
        const { stdout: updates } = await execPromise('powershell -Command "Get-HotFix | Sort-Object -Property InstalledOn -Descending | Select-Object -First 1"').catch(() => ({ stdout: '' }));
        
        info += '*🛡️ Güvenlik Durumu:*\n';
        info += `• Windows Defender: ${defenderStatus.includes('True') ? '✅ Aktif' : '❌ Devre Dışı'}\n`;
        info += `• Güvenlik Duvarı: ${firewallStatus.includes('ON') ? '✅ Aktif' : '❌ Devre Dışı'}\n`;
        info += `• Son Güncelleme: ${updates.split('\n')[3]?.trim() || 'Bilinmiyor'}\n\n`;
        
        // Sistem Sağlığı
        info += '*🏥 Sistem Sağlığı:*\n';
        if (temp?.main) {
            if (temp.main > 80) {
                info += '⚠️ *UYARI:* CPU sıcaklığı çok yüksek!\n';
            } else if (temp.main > 70) {
                info += '⚠️ *UYARI:* CPU sıcaklığı yüksek.\n';
            } else {
                info += '✅ CPU sıcaklığı normal.\n';
            }
        } else {
            info += 'ℹ️ CPU sıcaklığı bilinmiyor.\n';
        }
        
        const ramUsage = (mem.used / mem.total) * 100;
        if (ramUsage > 90) {
            info += '⚠️ *UYARI:* RAM kullanımı çok yüksek!\n';
        } else if (ramUsage > 80) {
            info += '⚠️ *UYARI:* RAM kullanımı yüksek.\n';
        } else {
            info += '✅ RAM kullanımı normal.\n';
        }
        
        return info;
    } catch (error) {
        console.error('Sistem bilgisi alma hatası:', error);
        return '❌ Sistem bilgisi alınamadı: ' + error.message;
    }
}

// Yardımcı fonksiyon: Çalışma süresini formatla
function formatUptime(seconds) {
    if (!seconds || isNaN(seconds)) return 'Bilinmiyor';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} gün, ${hours} saat, ${minutes} dakika`;
}

// Yardımcı fonksiyonlar
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Antivirüs taraması yap
async function checkAntivirus() {
    try {
        if (isAntivirusScanning) {
            return '⚠️ Zaten bir antivirüs taraması devam ediyor.';
        }

        isAntivirusScanning = true;
        let scanProgress = 0;

        // Tarama başlat
        const scanProcess = exec('powershell -Command "Start-MpScan -ScanType FullScan -AsJob"');
        
        // İlerleme mesajını gönder
        const progressMessage = await bot.sendMessage(
            config.allowed_user_id,
            '*🛡️ Antivirüs Taraması Başlatıldı*\n\n' +
            '⏳ Tarama devam ediyor...\n' +
            '📊 İlerleme: %0\n\n' +
            '❌ Taramayı iptal etmek için /iptal komutunu kullanın.',
            { parse_mode: 'Markdown' }
        );
        lastAntivirusMessageId = progressMessage.message_id;

        // İlerleme güncelleme fonksiyonu
        const updateProgress = async () => {
            try {
                const { stdout } = await execPromise('powershell -Command "Get-MpThreat"');
                const threats = stdout.split('\n').filter(line => line.trim()).length;
                
                // İlerleme yüzdesini hesapla
                scanProgress = Math.min(scanProgress + 5, 100);
                
                // Mesajı güncelle
                await bot.editMessageText(
                    '*🛡️ Antivirüs Taraması*\n\n' +
                    '⏳ Tarama devam ediyor...\n' +
                    `📊 İlerleme: %${scanProgress}\n` +
                    `⚠️ Tespit Edilen Tehditler: ${threats}\n\n` +
                    '❌ Taramayı iptal etmek için /iptal komutunu kullanın.',
                    {
                        chat_id: config.allowed_user_id,
                        message_id: lastAntivirusMessageId,
                        parse_mode: 'Markdown'
                    }
                );
    } catch (error) {
                console.error('İlerleme güncelleme hatası:', error);
            }
        };

        // Her 30 saniyede bir ilerlemeyi güncelle
        antivirusScanInterval = setInterval(updateProgress, 30000);

        // Tarama tamamlandığında
        scanProcess.on('close', async (code) => {
            clearInterval(antivirusScanInterval);
            isAntivirusScanning = false;

            const { stdout: scanResults } = await execPromise('powershell -Command "Get-MpThreat"');
            const threats = scanResults.split('\n').filter(line => line.trim());

            let report = '*🛡️ Antivirüs Taraması Tamamlandı*\n\n';
            if (threats.length > 0) {
                report += '⚠️ *Tespit Edilen Tehditler:*\n';
                threats.forEach(threat => {
                    report += `• ${threat}\n`;
                });
            } else {
                report += '✅ Tehdit tespit edilmedi.\n';
            }

            await bot.editMessageText(report, {
                chat_id: config.allowed_user_id,
                message_id: lastAntivirusMessageId,
                parse_mode: 'Markdown'
            });
        });

        return 'Antivirüs taraması başlatıldı. İlerlemeyi Telegram üzerinden takip edebilirsiniz.';
    } catch (error) {
        console.error('Antivirüs tarama hatası:', error);
        isAntivirusScanning = false;
        if (antivirusScanInterval) {
            clearInterval(antivirusScanInterval);
        }
        return '❌ Antivirüs taraması başlatılamadı: ' + error.message;
    }
}

// Güvenlik duvarı kontrolü
async function checkFirewall() {
    try {
        let report = '*🔥 Güvenlik Duvarı Kontrolü*\n\n';
        
        // Güvenlik duvarı durumu
        const { stdout: firewallStatus } = await execPromise('netsh advfirewall show allprofiles state');
        
        // Profil durumlarını analiz et
        const domainStatus = firewallStatus.includes('Domain Profile') && firewallStatus.includes('ON');
        const privateStatus = firewallStatus.includes('Private Profile') && firewallStatus.includes('ON');
        const publicStatus = firewallStatus.includes('Public Profile') && firewallStatus.includes('ON');
        
        report += `*Domain Profili:* ${domainStatus ? '✅ Aktif' : '❌ Devre Dışı'}\n`;
        report += `*Özel Profil:* ${privateStatus ? '✅ Aktif' : '❌ Devre Dışı'}\n`;
        report += `*Genel Profil:* ${publicStatus ? '✅ Aktif' : '❌ Devre Dışı'}\n\n`;
        
        // Güvenlik duvarı kuralları
        const { stdout: firewallRules } = await execPromise('netsh advfirewall firewall show rule name=all dir=in status=enabled | find /c "Rule Name"');
        
        report += `*Aktif Gelen Kuralları:* ${firewallRules.trim()}\n`;
        
        // Öneriler
        if (!domainStatus || !privateStatus || !publicStatus) {
            report += '\n⚠️ *Güvenlik Açığı:* Bazı güvenlik duvarı profilleri devre dışı!\n';
            report += '🛡️ *Öneri:* Tüm profilleri etkinleştirin.\n';
        } else {
            report += '\n✅ Güvenlik duvarı tüm profillerde aktif.\n';
        }
        
        return report;
    } catch (error) {
        console.error('Güvenlik duvarı kontrolü hatası:', error);
        return '❌ Güvenlik duvarı kontrolü başarısız: ' + error.message;
    }
}

// Disk temizleme
async function cleanDisk() {
    try {
        let report = '*🧹 Disk Temizliği*\n\n';
        
        // Disk temizleme işlemleri
        report += '⏳ Temizlik işlemleri başlatılıyor...\n\n';
        
        // Disk temizleme aracını çalıştır
        await execPromise('powershell -Command "Start-Process -FilePath cleanmgr.exe -ArgumentList \'/sagerun:1\' -WindowStyle Hidden"')
            .then(() => report += '✅ Disk temizleme aracı başlatıldı\n')
            .catch(() => report += '❌ Disk temizleme aracı başlatılamadı\n');
        
        // Geçici dosyaları temizle (daha güvenli yöntem)
        await execPromise('powershell -Command "$tempfolders = @(\'C:\\Windows\\Temp\', $env:TEMP); foreach ($folder in $tempfolders) { if(Test-Path $folder) { Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue }}"')
            .then(() => report += '✅ Geçici dosyalar temizlendi\n')
            .catch(() => report += '❌ Geçici dosyalar temizlenemedi\n');
        
        // Çöp kutusunu temizle
        await execPromise('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"')
            .then(() => report += '✅ Çöp kutusu temizlendi\n')
            .catch(() => report += '❌ Çöp kutusu temizlenemedi\n');
            
        // Disk durumunu görüntüle
        try {
            const { stdout: diskInfo } = await execPromise('powershell -Command "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter, @{Name=\'FreeGB\';Expression={[math]::Round($_.SizeRemaining/1GB, 2)}}, @{Name=\'SizeGB\';Expression={[math]::Round($_.Size/1GB, 2)}}, @{Name=\'PercentFree\';Expression={[math]::Round(($_.SizeRemaining/$_.Size)*100, 2)}} | Format-Table -AutoSize | Out-String -Width 100"');
            report += '\n*Disk Durumu:*\n```\n' + diskInfo + '```\n';
        } catch (e) {
            report += '\n*Disk Durumu:* Bilgi alınamadı\n';
        }
        
        return report;
    } catch (error) {
        console.error('Disk temizleme hatası:', error);
        return '❌ Disk temizleme başarısız: ' + error.message;
    }
}

// Disk analizi
async function analyzeDisk() {
    try {
        let report = '*💾 Disk Analizi*\n\n';
        
        // PowerShell ile disk bilgilerini al
        const { stdout: volumeInfo } = await execPromise('powershell -Command "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter, FileSystemLabel, FileSystem, DriveType, @{Name=\'FreeGB\';Expression={[math]::Round($_.SizeRemaining/1GB, 2)}}, @{Name=\'SizeGB\';Expression={[math]::Round($_.Size/1GB, 2)}}, @{Name=\'PercentFree\';Expression={[math]::Round(($_.SizeRemaining/$_.Size)*100, 2)}} | Format-Table -AutoSize | Out-String -Width 100"');
        
        report += `*Disk Bilgileri:*\n\`\`\`\n${volumeInfo}\`\`\`\n`;
        
        // Disk sağlık durumunu kontrol et
        try {
            const { stdout: diskHealth } = await execPromise('powershell -Command "Get-PhysicalDisk | Select-Object FriendlyName, HealthStatus, OperationalStatus, Size | Format-Table -AutoSize | Out-String -Width 100"');
            report += `*Disk Sağlığı:*\n\`\`\`\n${diskHealth}\`\`\`\n`;
        } catch (e) {
            report += '*Disk Sağlığı:* Bilgi alınamadı (Yönetici yetkileri gerekli)\n';
        }
        
        // En büyük klasörleri bul
        try {
            const { stdout: largeFolders } = await execPromise('powershell -Command "Get-ChildItem -Path C:\\ -Directory -ErrorAction SilentlyContinue | ForEach-Object { $size = (Get-ChildItem -Path $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; [PSCustomObject]@{Name=$_.Name; SizeGB=[math]::Round($size/1GB, 2)}} | Sort-Object -Property SizeGB -Descending | Select-Object -First 5 | Format-Table -AutoSize | Out-String -Width 100"');
            report += `*En Büyük Klasörler:*\n\`\`\`\n${largeFolders}\`\`\`\n`;
        } catch (e) {
            report += '*En Büyük Klasörler:* Bilgi alınamadı\n';
        }
        
        return report;
    } catch (error) {
        console.error('Disk analizi hatası:', error);
        return '❌ Disk analizi başarısız: ' + error.message;
    }
}

// Disk kontrolü
async function checkDisk() {
    try {
        let report = '*🔍 Disk Kontrolü*\n\n';
        
        // PowerShell ile disk sağlık durumunu kontrol et
        const { stdout: diskStatus } = await execPromise('powershell -Command "Get-PhysicalDisk | Select-Object FriendlyName, HealthStatus, OperationalStatus | Format-Table -AutoSize"');
        
        report += '*Disk Durumu:*\n```\n' + diskStatus + '```\n';
        
        // CHKDSK komutunu çalıştır
        await execPromise('powershell -Command "Start-Process -FilePath chkdsk.exe -ArgumentList \'/f\' -Verb RunAs -WindowStyle Hidden"');
        
        report += '✅ Disk kontrolü başlatıldı. Bu işlem arka planda gerçekleştirilecek ve bir süre alabilir.\n';
        
        return report;
    } catch (error) {
        console.error('Disk kontrolü hatası:', error);
        return '❌ Disk kontrolü başarısız: ' + error.message;
    }
}

// Gelişmiş menüyü gönder
async function sendAdvancedMenu(chatId, messageId = null) {
    try {
        const advancedMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🔍 Ağ Taraması', '📶 WiFi Bilgisi'],
                    ['🌐 IP Bilgisi'],
                    ['📷 Webcam Fotoğrafı', '🔊 Sesli Uyarı'],
                    ['👁️ Kilitle ve İzle'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };

        const message = '🔍 *Gelişmiş Özellikler*\n\nLütfen bir işlem seçin:';

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...advancedMenuKeyboard
        });
    } catch (error) {
        console.error('Gelişmiş menü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// Bildirimler menüsünü gönder
// sendNotificationsMenu() fonksiyonu kaldırıldı (handler'lar yoktu, çalışmıyordu)

// sendSettingsMenu() fonksiyonu kaldırıldı (handler'ları yoktu, kullanılmıyordu)

// Ağ taraması yap
async function scanNetwork() {
    try {
        let report = '*🔍 Ağ Taraması*\n\n';
        
        // Yerel IP adresini al
        const networkInterfaces = os.networkInterfaces();
        let localIP = '';
        
        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            for (const interface of interfaces) {
                if (!interface.internal && interface.family === 'IPv4') {
                    localIP = interface.address;
                    break;
                }
            }
            if (localIP) break;
        }
        
        if (!localIP) {
            return '❌ Yerel IP adresi bulunamadı.';
        }
        
        report += `*Yerel IP:* ${localIP}\n\n`;
        
        // Ağ taraması yap
        const ipBase = localIP.substring(0, localIP.lastIndexOf('.') + 1);
        report += '*Ağdaki Cihazlar:*\n';
        
        // ARP tablosunu al
        const { stdout: arpTable } = await execPromise('arp -a');
        const arpLines = arpTable.split('\n').filter(line => line.includes('dynamic'));
        
        if (arpLines.length === 0) {
            report += 'Ağda cihaz bulunamadı.\n';
        } else {
            arpLines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    const ip = parts[0];
                    const mac = parts[1];
                    report += `• ${ip} (MAC: ${mac})\n`;
                }
            });
        }
        
        // Açık portları tara
        report += '\n*Açık Portlar:*\n';
        try {
            const { stdout: netstatOutput } = await execPromise('netstat -an | findstr LISTENING');
            const ports = netstatOutput.split('\n')
                .filter(line => line.includes('LISTENING'))
                .map(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const address = parts[1];
                        return address.substring(address.lastIndexOf(':') + 1);
                    }
                    return null;
                })
                .filter(Boolean)
                .slice(0, 10); // İlk 10 port
            
            if (ports.length === 0) {
                report += 'Açık port bulunamadı.\n';
            } else {
                ports.forEach(port => {
                    report += `• Port ${port}\n`;
                });
            }
        } catch (e) {
            report += 'Port taraması yapılamadı.\n';
        }
        
        return report;
    } catch (error) {
        console.error('Ağ taraması hatası:', error);
        return '❌ Ağ taraması başarısız: ' + error.message;
    }
}

// WiFi bilgisi al
async function getWifiInfo() {
    try {
        let report = '*📶 WiFi Bilgisi*\n\n';
        
        // Bağlı WiFi ağını al
        const { stdout: netshOutput } = await execPromise('netsh wlan show interfaces');
        
        const ssid = netshOutput.match(/SSID\s+:\s(.+)/);
        const signal = netshOutput.match(/Signal\s+:\s(.+)/);
        const channel = netshOutput.match(/Channel\s+:\s(.+)/);
        const authentication = netshOutput.match(/Authentication\s+:\s(.+)/);
        const encryption = netshOutput.match(/Encryption\s+:\s(.+)/);
        const bssid = netshOutput.match(/BSSID\s+:\s(.+)/);
        const radioType = netshOutput.match(/Radio type\s+:\s(.+)/);
        
        if (ssid) {
            report += `*Ağ Adı (SSID):* ${ssid[1]}\n`;
            if (signal) report += `*Sinyal Gücü:* ${signal[1]}\n`;
            if (channel) report += `*Kanal:* ${channel[1]}\n`;
            if (authentication) report += `*Kimlik Doğrulama:* ${authentication[1]}\n`;
            if (encryption) report += `*Şifreleme:* ${encryption[1]}\n`;
            if (bssid) report += `*BSSID:* ${bssid[1]}\n`;
            if (radioType) report += `*Radyo Tipi:* ${radioType[1]}\n`;
        } else {
            report += 'WiFi ağına bağlı değil.\n';
        }
        
        // Mevcut WiFi ağlarını listele
        report += '\n*Mevcut WiFi Ağları:*\n';
        
        try {
            const { stdout: networksOutput } = await execPromise('netsh wlan show networks mode=bssid');
            const networks = networksOutput.split('\n')
                .filter(line => line.includes('SSID'))
                .map(line => line.trim())
                .slice(0, 10); // İlk 10 ağ
            
            if (networks.length === 0) {
                report += 'WiFi ağı bulunamadı.\n';
            } else {
                networks.forEach(network => {
                    report += `• ${network}\n`;
                });
            }
        } catch (e) {
            report += 'WiFi ağları listelenemiyor.\n';
        }
        
        return report;
    } catch (error) {
        console.error('WiFi bilgisi alma hatası:', error);
        return '❌ WiFi bilgisi alınamadı: ' + error.message;
    }
}


// IP bilgisi al
async function getIPInfo() {
    try {
        let report = '*🌐 IP Bilgisi*\n\n';
        
        // Yerel IP adreslerini al
        const networkInterfaces = os.networkInterfaces();
        report += '*Yerel IP Adresleri:*\n';
        
        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            for (const interface of interfaces) {
                if (!interface.internal) {
                    report += `• ${name}: ${interface.address} (${interface.family})\n`;
                }
            }
        }
        
        // Genel IP adresini al
        report += '\n*Genel IP Adresi:*\n';
        
        try {
            const { stdout: publicIP } = await execPromise('powershell -Command "Invoke-RestMethod -Uri https://api.ipify.org"');
            report += `• ${publicIP.trim()}\n`;
            
            // IP bilgilerini al
            report += '\n*IP Bilgileri:*\n';
            
            try {
                const { stdout: ipInfo } = await execPromise(`powershell -Command "Invoke-RestMethod -Uri https://ipinfo.io/${publicIP.trim()}/json | ConvertTo-Json"`);
                const info = JSON.parse(ipInfo);
                
                if (info.city) report += `• Şehir: ${info.city}\n`;
                if (info.region) report += `• Bölge: ${info.region}\n`;
                if (info.country) report += `• Ülke: ${info.country}\n`;
                if (info.org) report += `• Organizasyon: ${info.org}\n`;
                if (info.postal) report += `• Posta Kodu: ${info.postal}\n`;
                if (info.timezone) report += `• Zaman Dilimi: ${info.timezone}\n`;
            } catch (e) {
                report += 'IP bilgileri alınamadı.\n';
            }
        } catch (e) {
            report += 'Genel IP adresi alınamadı.\n';
        }
        
        // DNS bilgilerini al
        report += '\n*DNS Sunucuları:*\n';
        
        try {
            const { stdout: dnsOutput } = await execPromise('powershell -Command "Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses"');
            const dnsServers = dnsOutput.split('\n').filter(line => line.trim());
            
            if (dnsServers.length === 0) {
                report += 'DNS sunucusu bulunamadı.\n';
            } else {
                dnsServers.forEach(server => {
                    report += `• ${server.trim()}\n`;
                });
            }
        } catch (e) {
            report += 'DNS sunucuları alınamadı.\n';
        }
        
        return report;
    } catch (error) {
        console.error('IP bilgisi alma hatası:', error);
        return '❌ IP bilgisi alınamadı: ' + error.message;
    }
}


// Webcam ile fotoğraf çek
async function takeWebcamPhoto() {
    try {
        const NodeWebcam = require('node-webcam');

        // Geçici dosya yolu
        const timestamp = Date.now();
        const filename = `webcam_${timestamp}.jpg`;
        const filepath = path.join(__dirname, filename);

        // Webcam ayarları
        const opts = {
            width: 1280,
            height: 720,
            quality: 100,
            delay: 0,
            saveShots: true,
            output: "jpeg",
            device: false,
            callbackReturn: "location",
            verbose: false
        };

        const Webcam = NodeWebcam.create(opts);

        // Fotoğraf çek
        await new Promise((resolve, reject) => {
            Webcam.capture(filepath, (err, data) => {
                if (err) {
                    reject(new Error('Webcam erişimi başarısız: ' + err.message));
                } else {
                    resolve(data);
                }
            });
        });

        // Fotoğrafı gönder
        await bot.sendPhoto(allowedUserId, filepath, {
            caption: '📷 Webcam fotoğrafı alındı'
        });

        // Dosyayı sil
        setTimeout(() => {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }, 1000);

        return true;
    } catch (error) {
        console.error('Webcam fotoğrafı hatası:', error);
        await bot.sendMessage(allowedUserId, '❌ Webcam fotoğrafı alınamadı: ' + error.message);
        return '❌ Webcam fotoğrafı alınamadı: ' + error.message;
    }
}

// Bilgisayarı kilitle ve izle
async function lockAndMonitor() {
    try {
        // Bilgisayarı kilitle
        await lockPC();
        
        // İzleme modunu başlat
        isMonitoring = true;
        
        // Periyodik olarak ekran görüntüsü al
        const monitorInterval = setInterval(async () => {
            if (!isMonitoring) {
                clearInterval(monitorInterval);
                return;
            }
            
            try {
                // Ekran görüntüsü al
                await takeScreenshot();
                
                // Aktif pencereyi kontrol et
                const active = await activeWindow();
                if (active) {
                    await notifyAdmin(`🔍 Aktif Pencere: ${active.title} (${active.owner.name})`);
                }
            } catch (e) {
                console.error('İzleme hatası:', e);
            }
        }, 60000); // Her dakika
        
        return '🔒 Bilgisayar kilitlendi ve izleme modu başlatıldı. Her dakika ekran görüntüsü alınacak.';
    } catch (error) {
        console.error('Kilitleme ve izleme hatası:', error);
        return '❌ Kilitleme ve izleme başarısız: ' + error.message;
    }
}

// İzleme modunu durdur
async function stopMonitoring() {
    try {
        isMonitoring = false;
        return '✅ İzleme modu durduruldu.';
    } catch (error) {
        console.error('İzleme durdurma hatası:', error);
        return '❌ İzleme durdurma başarısız: ' + error.message;
    }
}


// Bilgisayarı sesli uyar
async function playAlert(message = 'Dikkat! Bilgisayarınız uzaktan kontrol ediliyor.') {
    try {
        // PowerShell çıktısındaki tam ses adını kullan: "Microsoft Tolga"
        await execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SelectVoice('Microsoft Tolga'); $speak.Volume = 100; $speak.Rate = 0; $speak.Speak('${message.replace(/'/g, "''")}')"`)
            .catch((error) => {
                console.error('Tolga sesi bulunamadı, alternatif deneniyor:', error);
                // Tüm sesleri listele ve kullanıcıya göster
                return execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voices = $speak.GetInstalledVoices(); Write-Host 'Mevcut sesler:'; foreach($voice in $voices) { Write-Host $voice.VoiceInfo.Name }; $trVoice = $voices | Where-Object { $_.VoiceInfo.Name -like '*Tolga*' } | Select-Object -First 1; if($trVoice) { $speak.SelectVoice($trVoice.VoiceInfo.Name); } else { $speak.Volume = 100; $speak.Rate = -1; }; $speak.Speak('${message.replace(/'/g, "''")}')"`)
            });
        
        return '🔊 Sesli uyarı gönderildi.';
    } catch (error) {
        console.error('Sesli uyarı hatası:', error);
        return '❌ Sesli uyarı başarısız: ' + error.message;
    }
}


// Sesli komut menüsünü gönder
async function sendVoiceCommandMenu(chatId, messageId = null) {
    try {
        const voiceMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🔊 Merhaba De', '🔊 Uyarı Ver'],
                    ['🔊 Şaka Yap', '🔊 Korkut'],
                    ['🔊 Bilgisayarı Kapatıyorum', '🔊 Hacker Uyarısı'],
                    ['🔊 Motivasyon', '🔊 Tebrikler'],
                    ['🔊 Özel Mesaj'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };
        
        const message = '🔊 *Sesli Komutlar*\n\nBilgisayardan sesli mesaj yayınlamak için bir seçenek seçin:';
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...voiceMenuKeyboard
        });
    } catch (error) {
        console.error('Sesli komut menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}


// Sesli komut çal
async function playVoiceCommand(command) {
    try {
        let message = '';
        
        switch (command) {
            case 'hello':
                message = 'Merhaba! Bilgisayarımda Oturan Kişi Size nasıl yardımcı olabilirim?';
                break;
            case 'warning':
                message = 'Dikkat! Bilgisayarınız uzaktan kontrol ediliyor. Lütfen dikkatli olun.';
                break;
            case 'joke':
                const jokes = [
                    'Bilgisayarlar neden asla üşümez? Çünkü onların Windows\'u var!',
                    'Bilgisayarım bana dedi ki, sen olmadan yapamam. Güç kablosunu çektim, gerçekten yapamadı.',
                    'Bilgisayarımın şifresi yanlış diye uyarı veriyordu. Şifreyi değiştirdim, şimdi doğru diye uyarı veriyor.',
                    'Bilgisayarıma virüs bulaşmış. Doktora götürdüm, format atmamı söyledi.'
                ];
                message = jokes[Math.floor(Math.random() * jokes.length)];
                break;
            case 'scare':
                message = 'Dikkat! Sistem tehlikede! Kritik güvenlik açığı tespit edildi! Tüm veriler risk altında!';
                break;
            case 'shutdown':
                message = 'Dikkat! Bilgisayar 10 saniye içinde kapatılacak. Lütfen çalışmalarınızı kaydedin.';
                break;
            case 'hacker':
                message = 'Uyarı! Bilgisayarınıza izinsiz erişim tespit edildi. Sistem güvenliği tehlikede!';
                break;
            case 'motivation':
                const motivations = [
                    'Bugün harika bir gün olacak! Tüm hedeflerine ulaşacaksın!',
                    'Asla pes etme! Her zorluk, seni daha güçlü yapar!',
                    'Başarı, düştükten sonra tekrar ayağa kalkmaktır!',
                    'İmkansız diye bir şey yoktur, sadece zaman alır!',
                    'Hayallerine ulaşmak için her gün bir adım at!'
                ];
                message = motivations[Math.floor(Math.random() * motivations.length)];
                break;
            case 'congrats':
                message = 'Tebrikler! Harika bir iş çıkardın! Seninle gurur duyuyorum!';
                break;
            default:
                message = command; // Özel mesaj
                break;
        }
        
        // PowerShell çıktısındaki tam ses adını kullan: "Microsoft Tolga"
        await execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SelectVoice('Microsoft Tolga'); $speak.Volume = 100; $speak.Rate = 0; $speak.Speak('${message.replace(/'/g, "''")}')"`)
            .catch((error) => {
                console.error('Tolga sesi bulunamadı, alternatif deneniyor:', error);
                // Tüm sesleri listele ve kullanıcıya göster
                return execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voices = $speak.GetInstalledVoices(); Write-Host 'Mevcut sesler:'; foreach($voice in $voices) { Write-Host $voice.VoiceInfo.Name }; $trVoice = $voices | Where-Object { $_.VoiceInfo.Name -like '*Tolga*' } | Select-Object -First 1; if($trVoice) { $speak.SelectVoice($trVoice.VoiceInfo.Name); } else { $speak.Volume = 100; $speak.Rate = -1; }; $speak.Speak('${message.replace(/'/g, "''")}')"`)
            });
        
        return `🔊 Sesli komut gönderildi: "${message}"`;
    } catch (error) {
        console.error('Sesli komut hatası:', error);
        return '❌ Sesli komut başarısız: ' + error.message;
    }
}

// Yardım mesajı gönder
// sendHelpMessage() fonksiyonu kaldırıldı (gereksiz) 

// Kilitle ve İzle menüsünü gönder
async function sendMonitorMenu(chatId, messageId = null) {
    try {
        const monitorMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🔒 Kilitle ve İzlemeyi Başlat', '🛑 İzlemeyi Durdur'],
                    ['📸 Anlık Ekran Görüntüsü', '📊 İzleme Durumu'],
                    ['⏱️ İzleme Sıklığını Ayarla', '📋 İzleme Raporu'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };
        
        const message = `👁️ *Kilitle ve İzle*\n\nBilgisayarınızı kilitleyip uzaktan izleyebilirsiniz.\n\n*Mevcut Durum:*\n${isMonitoring ? '✅ İzleme aktif' : '❌ İzleme devre dışı'}\n${isLocked ? '🔒 Bilgisayar kilitli' : '🔓 Bilgisayar kilidi açık'}`;
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...monitorMenuKeyboard
        });
    } catch (error) {
        console.error('Kilitle ve İzle menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}

// İzleme durumunu kontrol et
async function checkMonitoringStatus() {
    try {
        let report = '*📊 İzleme Durumu*\n\n';
        
        report += `*İzleme:* ${isMonitoring ? '✅ Aktif' : '❌ Devre dışı'}\n`;
        report += `*Bilgisayar:* ${isLocked ? '🔒 Kilitli' : '🔓 Kilidi açık'}\n`;
        
        if (isMonitoring) {
            const monitoringStartTime = global.monitoringStartTime || Date.now();
            const elapsedTime = Date.now() - monitoringStartTime;
            const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
            const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
            
            report += `*İzleme Süresi:* ${hours} saat, ${minutes} dakika\n`;
            report += `*İzleme Sıklığı:* ${global.monitoringInterval || 60} saniye\n`;
            report += `*Son Ekran Görüntüsü:* ${new Date(lastScreenshotTime).toLocaleTimeString() || 'Henüz alınmadı'}\n`;
        }
        
        return report;
    } catch (error) {
        console.error('İzleme durumu hatası:', error);
        return '❌ İzleme durumu alınamadı: ' + error.message;
    }
}

// İzleme raporu oluştur
async function getMonitoringReport() {
    try {
        let report = '*📋 İzleme Raporu*\n\n';
        
        if (!isMonitoring && !global.monitoringHistory) {
            return '❌ İzleme geçmişi bulunamadı. Henüz izleme yapılmamış.';
        }
        
        const monitoringHistory = global.monitoringHistory || [];
        const monitoringStartTime = global.monitoringStartTime || Date.now();
        const elapsedTime = Date.now() - monitoringStartTime;
        const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        
        report += `*İzleme Başlangıç:* ${new Date(monitoringStartTime).toLocaleString()}\n`;
        report += `*Toplam İzleme Süresi:* ${hours} saat, ${minutes} dakika\n`;
        report += `*Alınan Ekran Görüntüsü:* ${monitoringHistory.length || 0}\n\n`;
        
        if (monitoringHistory.length > 0) {
            report += '*Son Aktiviteler:*\n';
            
            // Son 5 aktiviteyi göster
            const recentActivities = monitoringHistory.slice(-5);
            recentActivities.forEach((activity, index) => {
                report += `${index + 1}. ${activity.time}: ${activity.action}\n`;
            });
        }
        
        return report;
    } catch (error) {
        console.error('İzleme raporu hatası:', error);
        return '❌ İzleme raporu oluşturulamadı: ' + error.message;
    }
}

// İzleme sıklığını ayarla
async function setMonitoringInterval(interval) {
    try {
        // Geçerli bir sayı mı kontrol et
        const newInterval = parseInt(interval);
        if (isNaN(newInterval) || newInterval < 10 || newInterval > 3600) {
            return '❌ Geçersiz izleme sıklığı. 10-3600 saniye arasında bir değer girin.';
        }
        
        // Global değişkene kaydet
        global.monitoringInterval = newInterval;
        
        // Eğer izleme aktifse, yeni sıklıkla yeniden başlat
        if (isMonitoring && global.monitorInterval) {
            clearInterval(global.monitorInterval);
            startMonitoring();
        }
        
        return `✅ İzleme sıklığı ${newInterval} saniye olarak ayarlandı.`;
    } catch (error) {
        console.error('İzleme sıklığı ayarlama hatası:', error);
        return '❌ İzleme sıklığı ayarlanamadı: ' + error.message;
    }
}

// İzlemeyi başlat
async function startMonitoring() {
    try {
        // İzleme geçmişi oluştur
        if (!global.monitoringHistory) {
            global.monitoringHistory = [];
        }
        
        // İzleme başlangıç zamanını kaydet
        global.monitoringStartTime = Date.now();
        
        // İzleme sıklığını ayarla (varsayılan: 60 saniye)
        const interval = global.monitoringInterval || 60;
        
        // İzleme modunu başlat
        isMonitoring = true;
        
        // Aktivite ekle
        global.monitoringHistory.push({
            time: new Date().toLocaleTimeString(),
            action: 'İzleme başlatıldı'
        });
        
        // Periyodik olarak ekran görüntüsü al
        global.monitorInterval = setInterval(async () => {
            if (!isMonitoring) {
                clearInterval(global.monitorInterval);
                return;
            }
            
            try {
                // Ekran görüntüsü al
                await takeScreenshot();
                lastScreenshotTime = Date.now();
                
                // Aktivite ekle
                global.monitoringHistory.push({
                    time: new Date().toLocaleTimeString(),
                    action: 'Ekran görüntüsü alındı'
                });
                
                // Aktif pencereyi kontrol et
                const active = await activeWindow();
                if (active) {
                    await notifyAdmin(`🔍 Aktif Pencere: ${active.title} (${active.owner.name})`);
                    
                    // Aktivite ekle
                    global.monitoringHistory.push({
                        time: new Date().toLocaleTimeString(),
                        action: `Aktif pencere: ${active.title}`
                    });
                }
            } catch (e) {
                console.error('İzleme hatası:', e);
            }
        }, interval * 1000); // Saniye -> Milisaniye
        
        return '✅ İzleme başlatıldı. Periyodik olarak ekran görüntüsü alınacak.';
    } catch (error) {
        console.error('İzleme başlatma hatası:', error);
        return '❌ İzleme başlatılamadı: ' + error.message;
    }
}

// Antivirüs taramasını iptal et
async function cancelAntivirusScan() {
    try {
        if (!isAntivirusScanning) {
            return '⚠️ Aktif bir antivirüs taraması bulunmuyor.';
        }

        await execPromise('powershell -Command "Stop-MpScan"');
        isAntivirusScanning = false;
        if (antivirusScanInterval) {
            clearInterval(antivirusScanInterval);
        }

        // Son mesajı güncelle
        await bot.editMessageText(
            '*🛡️ Antivirüs Taraması İptal Edildi*\n\n' +
            '❌ Tarama kullanıcı tarafından iptal edildi.',
            {
                chat_id: config.allowed_user_id,
                message_id: lastAntivirusMessageId,
                parse_mode: 'Markdown'
            }
        );

        return '✅ Antivirüs taraması iptal edildi.';
    } catch (error) {
        console.error('Tarama iptal hatası:', error);
        return '❌ Tarama iptal edilemedi: ' + error.message;
    }
}

// Komut işleyiciye iptal komutunu ekle
bot.onText(/\/iptal/, async (msg) => {
    if (msg.from.id.toString() === config.allowed_user_id) {
        const result = await cancelAntivirusScan();
        await bot.sendMessage(msg.chat.id, result, { parse_mode: 'Markdown' });
    }
});

// Kapatma işlemini iptal et
async function cancelShutdown() {
    try {
        await execPromise('shutdown /a');
        return '✅ Kapatma işlemi iptal edildi.';
    } catch (error) {
        console.error('Kapatma iptal hatası:', error);
        return '❌ Kapatma iptal edilemedi: ' + error.message;
    }
}

// shutdownSystem() fonksiyonu satır 1480'de tanımlı (duplicate kaldırıldı)

async function sendShutdownMenu(chatId, messageId = null) {
    try {
        const shutdownMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['⚡ Hemen Kapat'],
                    ['⏰ 1 Dakika Sonra', '⏰ 5 Dakika Sonra'],
                    ['⏰ 10 Dakika Sonra', '⏰ 30 Dakika Sonra'],
                    ['⏰ 1 Saat Sonra', '⏰ 2 Saat Sonra'],
                    ['⏰ Özel Süre Belirle'],
                    ['❌ İptal Et'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };
        
        const message = '⚡ *Kapatma Zamanı Seçin*\n\nLütfen bilgisayarın ne zaman kapatılacağını seçin:';
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...shutdownMenuKeyboard
        });
    } catch (error) {
        console.error('Kapatma menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi: ' + error.message);
    }
}


// Ses durumunu kontrol etme
async function getAudioStatus() {
    try {
        // Daha güvenilir bir PowerShell komutu kullanarak ses bilgilerini al
        const { stdout } = await execPromise('powershell -command "Get-CimInstance -Class Win32_SoundDevice | Where-Object {$_.Status -eq \'OK\'} | Select-Object Name, Status"');
        
        // Ses seviyesi bilgisini al (NAudio ya da alternatif komut)
        let volumeInfo = "";
        try {
            const { stdout: volumeOut } = await execPromise('powershell -command "$volume = Get-WmiObject -Class MSFT_MixerVolume -Namespace root/Microsoft/Windows/MMDevice | Select-Object MasterVolume; $volume.MasterVolume"');
            const volumeLevel = Math.round(parseFloat(volumeOut.trim()) * 100);
            volumeInfo = `\n\n*Ses Seviyesi:* ${volumeLevel}%`;
        } catch (err) {
            volumeInfo = "\n\n*Ses Seviyesi:* Alınamadı";
        }
        
        // Sessiz mod durumunu kontrol et
        let muteInfo = "";
        try {
            const { stdout: muteOut } = await execPromise('powershell -command "$devices = Get-WmiObject -Class MSFT_MixerDevice -Namespace root/Microsoft/Windows/MMDevice; $devices | Where-Object {$_.DeviceType -eq \'Playback\'} | ForEach-Object {$_.IsMuted}"');
            const isMuted = muteOut.toLowerCase().includes("true");
            muteInfo = `\n*Ses Durumu:* ${isMuted ? '🔇 Sessiz' : '🔊 Açık'}`;
        } catch (err) {
            muteInfo = "\n*Ses Durumu:* Alınamadı";
        }
        
        return `🔊 *Ses Durumu*\n\n*Ses Cihazları:*\n${stdout}${muteInfo}${volumeInfo}`;
    } catch (error) {
        console.error('Ses durumu alma hatası:', error);
        return '❌ Ses durumu alınamadı: ' + error.message;
    }
}

// Sesi aç
async function unmuteSpeakers() {
    try {
        // En temel yöntem - SendKeys kullan
        await execPromise('powershell -command "$wshShell = New-Object -ComObject WScript.Shell; $wshShell.SendKeys([char]173)"');
        return '🔊 Ses açıldı.';
    } catch (error) {
        console.error('Ses açma hatası:', error);
        return '❌ Ses açılamadı: ' + error.message;
    }
}

// Sesi kapat
async function muteSpeakers() {
    try {
        // En temel yöntem - SendKeys kullan
        await execPromise('powershell -command "$wshShell = New-Object -ComObject WScript.Shell; $wshShell.SendKeys([char]173)"');
        return '🔇 Ses kapatıldı.';
    } catch (error) {
        console.error('Ses kapatma hatası:', error);
        return '❌ Ses kapatılamadı: ' + error.message;
    }
}

// Ses seviyesini artır
async function increaseVolume() {
    try {
        // SendKeys kullan - daha güvenilir
        await execPromise('powershell -command "$wshShell = New-Object -ComObject WScript.Shell; $wshShell.SendKeys([char]175)"');
        return '🔊 Ses seviyesi artırıldı.';
    } catch (error) {
        console.error('Ses artırma hatası:', error);
        return '❌ Ses artırılamadı: ' + error.message;
    }
}

// Ses seviyesini azalt
async function decreaseVolume() {
    try {
        // SendKeys kullan - daha güvenilir
        await execPromise('powershell -command "$wshShell = New-Object -ComObject WScript.Shell; $wshShell.SendKeys([char]174)"');
        return '🔉 Ses seviyesi azaltıldı.';
    } catch (error) {
        console.error('Ses azaltma hatası:', error);
        return '❌ Ses azaltılamadı: ' + error.message;
    }
}

// Ses seviyesini ayarla
async function setVolumeLevel(level) {
    try {
        if (isNaN(level) || level < 0 || level > 100) {
            return '❌ Geçersiz ses seviyesi. 0-100 arasında bir değer giriniz.';
        }
        
        // Temel ses artırma/azaltma komutları kullan
        // Önce sesi tamamen azalt
        await execPromise('powershell -command "1..50 | ForEach-Object { $wshShell = New-Object -ComObject WScript.Shell; $wshShell.SendKeys([char]174); Start-Sleep -Milliseconds 50 }"');
        
        // Sonra istenen seviyeye getir
        const steps = Math.round(level / 2); // her adım yaklaşık %2 arttırır
        if (steps > 0) {
            await execPromise(`powershell -command "1..${steps} | ForEach-Object { $wshShell = New-Object -ComObject WScript.Shell; $wshShell.SendKeys([char]175); Start-Sleep -Milliseconds 50 }"`);
        }
        
        return `🔊 Ses seviyesi yaklaşık ${level}% olarak ayarlandı.`;
    } catch (error) {
        console.error('Ses seviyesi ayarlama hatası:', error);
        return '❌ Ses seviyesi ayarlanamadı: ' + error.message;
    }
}

// Varsayılan ses cihazını listele ve seç
async function listAudioDevices(chatId) {
    try {
        // Manuel bir şekilde her cihazı ayrı bir komutla alıp ekleyelim
        const { stdout } = await execPromise('powershell "Get-CimInstance -Class Win32_SoundDevice | Select-Object Name,Status"');
        
        // Cihazları elle oluşturulmuş butonlar halinde göster
        const buttons = [
            [{ text: 'Varsayılan Hoparlör', callback_data: 'audio_default_speaker' }],
            [{ text: 'Kulaklık (Realtek)', callback_data: 'audio_headphones' }],
            [{ text: 'HDMI Ses', callback_data: 'audio_hdmi' }],
            [{ text: '↩️ Ana Menü', callback_data: 'main_menu' }]
        ];
        
        await bot.sendMessage(chatId, '🔊 *Ses Cihazları*\n\n' + stdout + '\n\nVarsayılan olarak ayarlamak istediğiniz ses cihazını seçiniz:', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });
        
        return 'Ses cihazları listelendi.';
    } catch (error) {
        console.error('Ses cihazlarını listeleme hatası:', error);
        return '❌ Ses cihazları listelenirken hata oluştu: ' + error.message;
    }
}

// Ses cihazını değiştir
async function changeAudioDevice(deviceIndex) {
    try {
        await execPromise(`powershell -command "Set-AudioDevice -Index ${deviceIndex}"`);
        const { stdout } = await execPromise(`powershell -command "Get-AudioDevice -Index ${deviceIndex} | Select-Object -ExpandProperty Name"`);
        return `✅ Varsayılan ses cihazı '${stdout.trim()}' olarak değiştirildi.`;
    } catch (error) {
        console.error('Ses cihazını değiştirme hatası:', error);
        return '❌ Ses cihazı değiştirilemedi: ' + error.message;
    }
}

// Ses menüsünü gönder
async function sendAudioMenu(chatId, messageId = null) {
    try {
        const audioMenuKeyboard = {
            reply_markup: {
                keyboard: [
                    ['🔊 Ses Durumu', '🔇 Sessiz Mod'],
                    ['🔉 Ses Azalt', '🔊 Ses Arttır'],
                    ['🔊 25% Ses', '🔊 50% Ses', '🔊 100% Ses'],
                    ['🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };
        
        const message = '🔊 *Ses Kontrolü*\n\nBilgisayarınızın ses ayarlarını kontrol etmek için aşağıdaki seçenekleri kullanabilirsiniz:';
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...audioMenuKeyboard
        });
    } catch (error) {
        console.error('Ses menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Ses menüsü gösterilirken bir hata oluştu.');
    }
}

// ==========================================
// YENİ ÖZELLİKLER - KATEGORİ SİSTEMİ
// ==========================================

// Config dosyasını yeniden yükle
function reloadConfig() {
    delete require.cache[require.resolve('./config.json')];
    return require('./config.json');
}

// Yeni Özellikler Ana Menüsü (Tamamen Tıklamalı)
async function sendNewFeaturesMenu(chatId, messageId = null) {
    try {
        const currentConfig = reloadConfig();
        const features = currentConfig.features;

        const message = `🎯 *Yeni Özellikler Merkezi*

Tüm yeni özelliklere aşağıdaki butonlardan erişebilirsiniz!

📊 *Durum:*
🔍 İzleme: ${features.category1_smart_monitoring.enabled ? '✅' : '❌'}
🎮 Kontrol: ${features.category3_remote_control.enabled ? '✅' : '❌'}
📊 Performans: ${features.category4_performance.enabled ? '✅' : '❌'}
📅 Otomasyon: ${features.category5_automation.enabled ? '✅' : '❌'}
🌐 Ağ: ${features.category6_network.enabled ? '✅' : '❌'}
🛡️ Güvenlik: ${features.category7_advanced_security.enabled ? '✅' : '❌'}
🎨 Eğlence: ${features.category8_entertainment.enabled ? '✅' : '❌'}

⚙️ Kategorileri açmak için *"Ayarlar"* butonuna tıklayın.`;

        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['🔍 İzleme & Güvenlik', '🎮 Uzaktan Kontrol'],
                    ['📊 Performans', '📅 Otomasyon'],
                    ['🌐 Ağ İşlemleri', '🛡️ Gelişmiş Güvenlik'],
                    ['🎨 Eğlence & Konfor'],
                    ['⚙️ Ayarlar', '🔙 Ana Menü']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Yeni özellikler menüsü hatası:', error);
        await bot.sendMessage(chatId, '❌ Menü gösterilemedi.');
    }
}

// Alt Menüler - Her kategori için detaylı butonlu menüler

// Kategori 1: İzleme & Güvenlik Menüsü
async function sendMonitoringMenu(chatId) {
    const message = `🔍 *İzleme & Güvenlik*

USB cihaz tespiti, ekran kaydı ve aktivite takibi özellikleri.

Bir işlem seçin:`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🔌 USB Cihazları Göster'],
                ['🎥 Ekran Kaydı (30sn)', '🎥 Ekran Kaydı (60sn)'],
                ['📊 Aktivite Raporu'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Kategori 3: Uzaktan Kontrol Menüsü
async function sendRemoteControlMenu(chatId) {
    const message = `🎮 *Uzaktan Kontrol*

Pano, komut satırı ve program yönetimi özellikleri.

Bir işlem seçin:`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📋 Panoyu Göster', '📝 Panoya Yaz'],
                ['💻 Komut Çalıştır'],
                ['🚀 Program Başlat', '❌ Program Sonlandır'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Kategori 4: Performans Menüsü (Zenginleştirildi)
async function sendPerformanceMenu(chatId) {
    const message = `📊 *Performans & Optimizasyon*

Sistem performansını izleyin ve optimize edin.

Bir işlem seçin:`;

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

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Kategori 5: Otomasyon Menüsü
async function sendAutomationMenu(chatId) {
    const message = `📅 *Akıllı Otomasyon*

Zamanlayıcılar ve otomatik görevler.

Bir işlem seçin:`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📋 Zamanlayıcıları Göster', '📖 Zamanlayıcı Dökümanı'],
                ['➕ Zamanlayıcı Ekle', '❌ Zamanlayıcı Sil'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Kategori 6: Ağ İşlemleri Menüsü (Zenginleştirildi)
async function sendNetworkMenu(chatId) {
    const message = `🌐 *Ağ ve İnternet*

Ağ trafiği, IP bilgisi ve website kontrolü.

Bir işlem seçin:`;

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

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Kategori 7: Gelişmiş Güvenlik Menüsü
async function sendAdvancedSecurityMenu(chatId) {
    const message = `🛡️ *Gelişmiş Güvenlik*

2FA, tehdit tespiti ve güvenlik raporları.

Bir işlem seçin:`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🔐 2FA Aktif Et', '✅ 2FA Doğrula'],
                ['📊 Güvenlik Raporu'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Kategori 8: Eğlence & Konfor Menüsü
async function sendEntertainmentMenu(chatId) {
    const message = `🎨 *Eğlence & Konfor*

Komut asistanı, medya kontrolü ve bildirimler.

Bir işlem seçin:`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🤖 Komut Asistanı', '📬 Bildirimler'],
                ['▶️ Medya Oynat', '⏸️ Medya Duraklat'],
                ['⏭️ Sonraki Şarkı', '⏮️ Önceki Şarkı'],
                ['😊 PC Sağlığı'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Özellik menüsü gönder
async function sendFeaturesMenu(chatId, messageId = null) {
    try {
        const currentConfig = reloadConfig();
        const features = currentConfig.features;

        const statusIcon = (enabled) => enabled ? '✅' : '❌';

        const message = `⚙️ *Özellik Yönetimi*

📊 *Kategori Durumları:*

1️⃣ Akıllı İzleme & Güvenlik: ${statusIcon(features.category1_smart_monitoring.enabled)}
3️⃣ Uzaktan Kontrol: ${statusIcon(features.category3_remote_control.enabled)}
4️⃣ Performans & Optimizasyon: ${statusIcon(features.category4_performance.enabled)}
5️⃣ Akıllı Otomasyon: ${statusIcon(features.category5_automation.enabled)}
6️⃣ Ağ ve İnternet: ${statusIcon(features.category6_network.enabled)}
7️⃣ Gelişmiş Güvenlik: ${statusIcon(features.category7_advanced_security.enabled)}
8️⃣ Eğlence & Konfor: ${statusIcon(features.category8_entertainment.enabled)}

💡 *Kategorileri açıp kapatmak için tıklayın:*`;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `${statusIcon(features.category1_smart_monitoring.enabled)} KATEGORİ 1`, callback_data: 'toggle_cat1' },
                        { text: `${statusIcon(features.category3_remote_control.enabled)} KATEGORİ 3`, callback_data: 'toggle_cat3' }
                    ],
                    [
                        { text: `${statusIcon(features.category4_performance.enabled)} KATEGORİ 4`, callback_data: 'toggle_cat4' },
                        { text: `${statusIcon(features.category5_automation.enabled)} KATEGORİ 5`, callback_data: 'toggle_cat5' }
                    ],
                    [
                        { text: `${statusIcon(features.category6_network.enabled)} KATEGORİ 6`, callback_data: 'toggle_cat6' },
                        { text: `${statusIcon(features.category7_advanced_security.enabled)} KATEGORİ 7`, callback_data: 'toggle_cat7' }
                    ],
                    [
                        { text: `${statusIcon(features.category8_entertainment.enabled)} KATEGORİ 8`, callback_data: 'toggle_cat8' }
                    ],
                    [
                        { text: '🔄 Yenile', callback_data: 'refresh_features' },
                        { text: '🔙 Ana Menü', callback_data: 'back_main' }
                    ]
                ]
            }
        };

        if (messageId) {
            await bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                ...keyboard
            });
        } else {
            await bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                ...keyboard
            });
        }
    } catch (error) {
        console.error('Özellik menüsü gönderme hatası:', error);
        await bot.sendMessage(chatId, '❌ Özellik menüsü gösterilemedi.');
    }
}

// Kategori toggle fonksiyonu
async function toggleCategory(category) {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Kategori anahtarını belirle
        const categoryKey = `category${category}_${getCategoryName(category)}`;

        // Toggle yap
        currentConfig.features[categoryKey].enabled = !currentConfig.features[categoryKey].enabled;

        // Alt özellikleri de toggle yap
        for (let key in currentConfig.features[categoryKey]) {
            if (key !== 'enabled') {
                currentConfig.features[categoryKey][key] = currentConfig.features[categoryKey].enabled;
            }
        }

        // Config'i kaydet
        fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4), 'utf8');

        const status = currentConfig.features[categoryKey].enabled ? '✅ AÇILDI' : '❌ KAPATILDI';
        return `Kategori ${category}: ${status}`;
    } catch (error) {
        console.error('Toggle hatası:', error);
        return '❌ Ayar değiştirilemedi: ' + error.message;
    }
}

// Kategori isimlerini döndür
function getCategoryName(num) {
    const names = {
        '1': 'smart_monitoring',
        '3': 'remote_control',
        '4': 'performance',
        '5': 'automation',
        '6': 'network',
        '7': 'advanced_security',
        '8': 'entertainment'
    };
    return names[num];
}

// Callback query listener ekle
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    try {
        if (data.startsWith('toggle_cat')) {
            const catNum = data.replace('toggle_cat', '');
            const result = await toggleCategory(catNum);

            // Menüyü güncelle
            await sendFeaturesMenu(chatId, messageId);

            // Bildirim gönder
            await bot.answerCallbackQuery(query.id, {
                text: result,
                show_alert: false
            });
        } else if (data === 'refresh_features') {
            await sendFeaturesMenu(chatId, messageId);
            await bot.answerCallbackQuery(query.id, {
                text: '🔄 Yenilendi',
                show_alert: false
            });
        } else if (data === 'back_main') {
            await sendMainMenu(chatId);
            await bot.answerCallbackQuery(query.id);
        }
    } catch (error) {
        console.error('Callback query hatası:', error);
        await bot.answerCallbackQuery(query.id, {
            text: '❌ Hata oluştu',
            show_alert: true
        });
    }
});

// ==========================================
// KATEGORİ 1: AKILLI İZLEME & GÜVENLİK
// ==========================================

// USB Cihaz Tespiti
async function detectUSBDevices() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category1_smart_monitoring.enabled ||
        !currentConfig.features.category1_smart_monitoring.usb_detection) {
        return '⚠️ USB tespiti devre dışı. /features menüsünden açın.';
    }

    try {
        // PowerShell ile tüm USB cihazları tespit et (telefonlar dahil)
        const { stdout } = await execPromise(`powershell -Command "Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match '^USB' } | Select-Object FriendlyName, Status, InstanceId | ConvertTo-Json"`);

        const devices = JSON.parse(stdout);
        if (!devices || (Array.isArray(devices) && devices.length === 0)) {
            return '📁 *USB Cihazlar:* Yok\n\nŞu anda takılı USB cihaz bulunamadı.';
        }

        let message = '🔌 *Tespit Edilen USB Cihazlar:*\n\n';
        const deviceArray = Array.isArray(devices) ? devices : [devices];

        deviceArray.forEach((device, i) => {
            const status = device.Status === 'OK' ? '✅' : '⚠️';
            message += `${i + 1}. ${status} **${device.FriendlyName}**\n`;
            message += `   📋 Durum: ${device.Status}\n`;
            message += `   🔗 ID: ${device.InstanceId.substring(0, 50)}...\n\n`;
        });

        return message;
    } catch (error) {
        console.error('USB tespit hatası:', error);

        // Fallback: Drivelist ile sadece sürücüleri göster
        try {
            const drivelist = require('drivelist');
            const drives = await drivelist.list();
            const usbDrives = drives.filter(d => d.isUSB);

            if (usbDrives.length === 0) {
                return '📁 *USB Sürücüler:* Yok\n\n⚠️ Telefon/diğer cihazlar tespit edilemedi.';
            }

            let message = '🔌 *USB Sürücüler:*\n\n';
            usbDrives.forEach((drive, i) => {
                const size = (drive.size / 1024 / 1024 / 1024).toFixed(2);
                message += `${i + 1}. **${drive.description}**\n`;
                message += `   💾 Boyut: ${size} GB\n`;
                if (drive.mountpoints && drive.mountpoints.length > 0) {
                    message += `   📍 Konum: ${drive.mountpoints[0].path}\n`;
                }
                message += '\n';
            });

            return message;
        } catch (fallbackError) {
            return '❌ USB cihazları tespit edilemedi: ' + error.message;
        }
    }
}

// Ekran Kaydı (Video + Ses)
async function recordScreen(duration = 30) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category1_smart_monitoring.enabled ||
        !currentConfig.features.category1_smart_monitoring.screen_recording) {
        return '⚠️ Ekran kaydı devre dışı. /features menüsünden açın.';
    }

    try {
        const ffmpeg = require('ffmpeg-static');
        const outputPath = path.join(__dirname, `recording_${Date.now()}.mp4`);

        await notifyAdmin(`🎥 Ekran kaydı başlatılıyor (${duration} saniye, sesli)...`);

        // SES EKLENDİ: -f dshow ile mikrofon ses kaydı + ekran
        // Telegram limit 50MB - Uzun videolar için düşük kalite
        const quality = duration > 30 ? '15' : '23'; // CRF değeri (düşük = iyi kalite)
        const cmd = `"${ffmpeg}" -f gdigrab -framerate 20 -i desktop -f dshow -i audio="Stereo Mix" -t ${duration} -c:v libx264 -crf ${quality} -preset ultrafast -c:a aac -b:a 128k -pix_fmt yuv420p "${outputPath}"`;

        return new Promise((resolve) => {
            exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, async (error) => {
                if (error) {
                    console.error('Ekran kaydı hatası:', error);
                    // Ses hatası varsa sessiz kayıt dene
                    const cmdNoAudio = `"${ffmpeg}" -f gdigrab -framerate 20 -i desktop -t ${duration} -c:v libx264 -crf ${quality} -preset ultrafast -pix_fmt yuv420p "${outputPath}"`;
                    exec(cmdNoAudio, async (error2) => {
                        if (error2) {
                            resolve('❌ Ekran kaydı başarısız: ' + error2.message);
                            return;
                        }
                        await sendVideoSafe(outputPath, duration, 'sessiz');
                        resolve(`✅ ${duration}sn ekran kaydı tamamlandı (ses yok).`);
                    });
                    return;
                }

                await sendVideoSafe(outputPath, duration, 'sesli');
                resolve(`✅ ${duration}sn sesli ekran kaydı tamamlandı.`);
            });
        });
    } catch (error) {
        console.error('Ekran kaydı hatası:', error);
        return '❌ Ekran kaydı başlatılamadı: ' + error.message;
    }
}

// Güvenli video gönderimi (Telegram 50MB limit)
async function sendVideoSafe(videoPath, duration, audioStatus) {
    if (!fs.existsSync(videoPath)) {
        await notifyAdmin('❌ Video dosyası oluşturulamadı.');
        return;
    }

    const stats = fs.statSync(videoPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 45) {
        // 45MB'dan büyükse hata ver
        await notifyAdmin(`⚠️ Video çok büyük (${fileSizeMB.toFixed(1)}MB). Daha kısa süre deneyin (max 30sn).`);
        fs.unlinkSync(videoPath);
        return;
    }

    try {
        await bot.sendVideo(allowedUserId, videoPath, {
            caption: `🎥 ${duration}sn ekran kaydı (${audioStatus}) - ${fileSizeMB.toFixed(1)}MB`
        });
        fs.unlinkSync(videoPath);
    } catch (error) {
        if (error.message.includes('Request Entity Too Large')) {
            await notifyAdmin(`❌ Video Telegram limiti aştı (${fileSizeMB.toFixed(1)}MB). Daha kısa süre kullanın.`);
        } else {
            await notifyAdmin(`❌ Video gönderilemedi: ${error.message}`);
        }
        fs.unlinkSync(videoPath);
    }
}

// Klavye/Mouse Takibi (Son aktivite)
let lastActivity = {
    activeWindow: '',
    timestamp: Date.now()
};

async function trackActivity() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category1_smart_monitoring.enabled ||
        !currentConfig.features.category1_smart_monitoring.keyboard_mouse_tracking) {
        return;
    }

    try {
        const window = await activeWindow();
        if (window && window.title !== lastActivity.activeWindow) {
            lastActivity.activeWindow = window.title;
            lastActivity.timestamp = Date.now();

            // Log yaz
            const logEntry = `[${new Date().toLocaleString()}] Program: ${window.title} (${window.owner.name})\n`;
            fs.appendFileSync('./activity_log.txt', logEntry);
        }
    } catch (error) {
        // Sessizce atla
    }
}

// Aktivite takibini başlat
setInterval(trackActivity, 5000); // Her 5 saniyede bir

// Aktivite raporunu göster
async function getActivityReport() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category1_smart_monitoring.enabled ||
        !currentConfig.features.category1_smart_monitoring.keyboard_mouse_tracking) {
        return '⚠️ Aktivite takibi devre dışı. /features menüsünden açın.';
    }

    try {
        if (!fs.existsSync('./activity_log.txt')) {
            return '📊 *Aktivite Raporu:* Henüz veri yok.';
        }

        const log = fs.readFileSync('./activity_log.txt', 'utf8');
        const lines = log.split('\n').filter(l => l.trim());
        const recent = lines.slice(-20).join('\n'); // Son 20 kayıt

        return `📊 *Son Aktiviteler:*\n\n\`\`\`\n${recent}\n\`\`\``;
    } catch (error) {
        return '❌ Aktivite raporu okunamadı: ' + error.message;
    }
}

// ==========================================
// KATEGORİ 3: UZAKTAN KONTROL
// ==========================================

// Clipboard (Pano) Okuma
async function getClipboard() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category3_remote_control.enabled ||
        !currentConfig.features.category3_remote_control.clipboard_control) {
        return '⚠️ Pano kontrolü devre dışı. /features menüsünden açın.';
    }

    try {
        const clipboardy = await import('clipboardy');
        const text = await clipboardy.default.read();

        if (!text || text.trim() === '') {
            return '📋 *Pano:* Boş';
        }

        return `📋 *Panoda:*\n\`\`\`\n${text.substring(0, 500)}\n\`\`\``;
    } catch (error) {
        console.error('Pano okuma hatası:', error);
        return '❌ Pano okunamadı: ' + error.message;
    }
}

// Panoya Yazma
async function writeClipboard(text) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category3_remote_control.enabled ||
        !currentConfig.features.category3_remote_control.clipboard_control) {
        return '⚠️ Pano kontrolü devre dışı. /features menüsünden açın.';
    }

    try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(text);
        return `✅ Panoya yazıldı: ${text.substring(0, 50)}...`;
    } catch (error) {
        return '❌ Panoya yazılamadı: ' + error.message;
    }
}

// Komut Satırı Çalıştırma
async function runCommand(command) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category3_remote_control.enabled ||
        !currentConfig.features.category3_remote_control.command_execution) {
        return '⚠️ Komut çalıştırma devre dışı. /features menüsünden açın.';
    }

    try {
        const { stdout, stderr } = await execPromise(command, { timeout: 30000 });

        let result = '💻 *Komut Çıktısı:*\n\n';

        if (stdout) {
            result += `\`\`\`\n${stdout.substring(0, 3000)}\n\`\`\``;
        }

        if (stderr) {
            result += `\n⚠️ *Hatalar:*\n\`\`\`\n${stderr.substring(0, 1000)}\n\`\`\``;
        }

        if (!stdout && !stderr) {
            result += 'Komut çıktı üretmedi.';
        }

        return result;
    } catch (error) {
        console.error('Komut çalıştırma hatası:', error);
        return `❌ Komut başarısız:\n\`\`\`\n${error.message}\n\`\`\``;
    }
}

// Program Başlatma
async function launchProgram(programName) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category3_remote_control.enabled ||
        !currentConfig.features.category3_remote_control.program_management) {
        return '⚠️ Program yönetimi devre dışı. /features menüsünden açın.';
    }

    try {
        await execPromise(`start "" "${programName}"`);
        return `✅ Program başlatıldı: ${programName}`;
    } catch (error) {
        return `❌ Program başlatılamadı: ${error.message}`;
    }
}

// Program Sonlandırma
async function killProgram(processName) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category3_remote_control.enabled ||
        !currentConfig.features.category3_remote_control.program_management) {
        return '⚠️ Program yönetimi devre dışı. /features menüsünden açın.';
    }

    try {
        await execPromise(`taskkill /F /IM "${processName}"`);
        return `✅ Program sonlandırıldı: ${processName}`;
    } catch (error) {
        return `❌ Program sonlandırılamadı: ${error.message}`;
    }
}

// ==========================================
// KATEGORİ 4: PERFORMANS & OPTİMİZASYON
// ==========================================

// Gerçek Zamanlı Performans Grafiği
let performanceHistory = {
    cpu: [],
    ram: [],
    timestamps: []
};

// Performans verisini topla
async function collectPerformanceData() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category4_performance.enabled ||
        !currentConfig.features.category4_performance.realtime_charts) {
        return;
    }

    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();

        performanceHistory.cpu.push(cpu.currentLoad.toFixed(1));
        performanceHistory.ram.push((mem.used / mem.total * 100).toFixed(1));
        performanceHistory.timestamps.push(new Date().toLocaleTimeString());

        // Son 20 veriyi tut
        if (performanceHistory.cpu.length > 20) {
            performanceHistory.cpu.shift();
            performanceHistory.ram.shift();
            performanceHistory.timestamps.shift();
        }
    } catch (error) {
        console.error('Performans veri toplama hatası:', error);
    }
}

// Her 5 saniyede veri topla
setInterval(collectPerformanceData, 5000);

// Performans grafiğini gönder
async function sendPerformanceChart(chatId) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category4_performance.enabled ||
        !currentConfig.features.category4_performance.realtime_charts) {
        return '⚠️ Performans grafikleri devre dışı. /features menüsünden açın.';
    }

    try {
        if (performanceHistory.cpu.length < 5) {
            return '📊 Yeterli veri yok. Lütfen birkaç dakika bekleyin...';
        }

        // Metin tabanlı performans raporu (ChartJS yerine)
        const lastIndex = performanceHistory.cpu.length - 1;
        const last10 = Math.max(0, lastIndex - 9);

        let message = '📊 *Performans Grafiği (Son 10 Ölçüm)*\n\n';

        for (let i = lastIndex; i >= last10; i--) {
            const time = performanceHistory.timestamps[i];
            const cpu = performanceHistory.cpu[i];
            const ram = performanceHistory.ram[i];

            // CPU bar grafiği
            const cpuBars = '█'.repeat(Math.round(cpu / 5));
            const cpuSpaces = '░'.repeat(20 - Math.round(cpu / 5));

            // RAM bar grafiği
            const ramBars = '█'.repeat(Math.round(ram / 5));
            const ramSpaces = '░'.repeat(20 - Math.round(ram / 5));

            message += `🕐 ${time}\n`;
            message += `CPU: ${cpuBars}${cpuSpaces} ${cpu.toFixed(1)}%\n`;
            message += `RAM: ${ramBars}${ramSpaces} ${ram.toFixed(1)}%\n\n`;
        }

        // Ortalamalar
        const avgCpu = (performanceHistory.cpu.reduce((a, b) => a + b, 0) / performanceHistory.cpu.length).toFixed(1);
        const avgRam = (performanceHistory.ram.reduce((a, b) => a + b, 0) / performanceHistory.ram.length).toFixed(1);

        message += `📈 *Ortalamalar:*\n`;
        message += `CPU: ${avgCpu}% | RAM: ${avgRam}%`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        return '✅ Performans raporu gönderildi.';
    } catch (error) {
        console.error('Performans raporu hatası:', error);
        return '❌ Performans raporu oluşturulamadı: ' + error.message;
    }
}

// Startup Programları Listesi
async function listStartupPrograms() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category4_performance.enabled ||
        !currentConfig.features.category4_performance.startup_management) {
        return '⚠️ Startup yönetimi devre dışı. /features menüsünden açın.';
    }

    try {
        // wmic yerine PowerShell kullan (Windows 11 uyumlu)
        const { stdout } = await execPromise('powershell -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | Format-List"');
        return `🚀 *Başlangıçta Çalışan Programlar:*\n\n\`\`\`\n${stdout.substring(0, 3000)}\n\`\`\``;
    } catch (error) {
        return '❌ Startup programları listelenemedi: ' + error.message;
    }
}

// ==========================================
// KATEGORİ 5: AKILLI OTOMASYON
// ==========================================

// Zamanlayıcı (Scheduler) - Örnek: Her gün 23:00'de kilitle
const schedule = require('node-schedule');
let scheduledJobs = {};

async function scheduleTask(taskName, cronTime, taskFunction) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category5_automation.enabled ||
        !currentConfig.features.category5_automation.schedulers) {
        return '⚠️ Zamanlayıcılar devre dışı. /features menüsünden açın.';
    }

    try {
        // Varolan işi iptal et
        if (scheduledJobs[taskName]) {
            scheduledJobs[taskName].cancel();
        }

        // Yeni iş oluştur
        scheduledJobs[taskName] = schedule.scheduleJob(cronTime, taskFunction);

        return `✅ Zamanlayıcı oluşturuldu: ${taskName} (${cronTime})`;
    } catch (error) {
        return `❌ Zamanlayıcı oluşturulamadı: ${error.message}`;
    }
}

// Zamanlayıcıyı iptal et
async function cancelScheduledTask(taskName) {
    if (scheduledJobs[taskName]) {
        scheduledJobs[taskName].cancel();
        delete scheduledJobs[taskName];
        return `✅ Zamanlayıcı iptal edildi: ${taskName}`;
    }
    return `❌ Zamanlayıcı bulunamadı: ${taskName}`;
}

// Aktif zamanlayıcıları listele
async function listScheduledTasks() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category5_automation.enabled ||
        !currentConfig.features.category5_automation.schedulers) {
        return '⚠️ Zamanlayıcılar devre dışı. /features menüsünden açın.';
    }

    const tasks = Object.keys(scheduledJobs);
    if (tasks.length === 0) {
        return '📅 Aktif zamanlayıcı yok.';
    }

    let message = '📅 *Aktif Zamanlayıcılar:*\n\n';
    tasks.forEach((task, i) => {
        message += `${i + 1}. ${task}\n`;
    });

    return message;
}

// ==========================================
// KATEGORİ 6: AĞ VE İNTERNET
// ==========================================

// Trafik Analizi (Basit)
async function getNetworkTraffic() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category6_network.enabled ||
        !currentConfig.features.category6_network.traffic_analysis) {
        return '⚠️ Trafik analizi devre dışı. /features menüsünden açın.';
    }

    try {
        const netStats = await si.networkStats();

        let message = '📊 *Ağ Trafiği:*\n\n';

        netStats.forEach((iface, i) => {
            const rxMB = (iface.rx_bytes / 1024 / 1024).toFixed(2);
            const txMB = (iface.tx_bytes / 1024 / 1024).toFixed(2);

            message += `**${iface.iface}**\n`;
            message += `  📥 İndirilen: ${rxMB} MB\n`;
            message += `  📤 Yüklenen: ${txMB} MB\n\n`;
        });

        return message;
    } catch (error) {
        return '❌ Ağ trafiği okunamadı: ' + error.message;
    }
}

// Engellenen websiteleri tutan global liste
let blockedWebsites = [];

// Website Engelleme (hosts dosyası)
async function blockWebsite(domain) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category6_network.enabled ||
        !currentConfig.features.category6_network.website_blocking) {
        return '⚠️ Website engelleme devre dışı. /features menüsünden açın.';
    }

    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
        const blockEntry = `\n127.0.0.1 ${domain}`;

        fs.appendFileSync(hostsPath, blockEntry);
        blockedWebsites.push(domain);
        return `✅ Website engellendi: ${domain}\n\nℹ️ Engeli kaldırmak için "🔓 Website Engel Kaldır" kullanın.`;
    } catch (error) {
        return `❌ Website engellenemedi (Admin yetkisi gerekli): ${error.message}`;
    }
}

// Website Engel Kaldırma
async function unblockWebsite(domain) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category6_network.enabled ||
        !currentConfig.features.category6_network.website_blocking) {
        return '⚠️ Website engelleme devre dışı. /features menüsünden açın.';
    }

    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
        let hostsContent = fs.readFileSync(hostsPath, 'utf8');

        // Domain'i hosts dosyasından kaldır
        const blockEntry = `127.0.0.1 ${domain}`;
        hostsContent = hostsContent.split('\n').filter(line => !line.includes(blockEntry)).join('\n');

        fs.writeFileSync(hostsPath, hostsContent);
        blockedWebsites = blockedWebsites.filter(d => d !== domain);

        return `✅ Website engeli kaldırıldı: ${domain}`;
    } catch (error) {
        return `❌ Engel kaldırılamadı (Admin yetkisi gerekli): ${error.message}`;
    }
}

// Engellenen websiteleri listele
async function listBlockedWebsites() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category6_network.enabled ||
        !currentConfig.features.category6_network.website_blocking) {
        return '⚠️ Website engelleme devre dışı. /features menüsünden açın.';
    }

    if (blockedWebsites.length === 0) {
        return '📋 *Engellenen Websiteler:* Yok\n\nHenüz hiçbir website engellenmedi.';
    }

    let message = '🚫 *Engellenen Websiteler:*\n\n';
    blockedWebsites.forEach((domain, i) => {
        message += `${i + 1}. ${domain}\n`;
    });

    return message;
}

// ==========================================
// TELEGRAM KOMUT EKLEME
// ==========================================

// Özellikler menüsünü başlatma komutu ekle
bot.onText(/\/features/, async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== allowedUserId.toString()) {
        return;
    }
    await sendFeaturesMenu(chatId);
});

// Yeni komutlar ekle
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (chatId.toString() !== allowedUserId.toString()) return;
    if (!text) return;

    try {
        // KATEGORİ 1 komutları
        if (text === '/usb' || text === '🔌 USB Cihazlar') {
            const result = await detectUSBDevices();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
        else if (text.startsWith('/record ')) {
            const duration = parseInt(text.split(' ')[1]) || 30;
            const result = await recordScreen(duration);
            if (!result.includes('✅')) {
                await bot.sendMessage(chatId, result);
            }
        }
        else if (text === '/activity' || text === '📊 Aktivite Raporu') {
            const result = await getActivityReport();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // KATEGORİ 3 komutları
        else if (text === '/clipboard' || text === '📋 Pano') {
            const result = await getClipboard();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
        else if (text.startsWith('/cmd ')) {
            const command = text.substring(5);
            const result = await runCommand(command);
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
        else if (text.startsWith('/launch ')) {
            const program = text.substring(8);
            const result = await launchProgram(program);
            await bot.sendMessage(chatId, result);
        }
        else if (text.startsWith('/kill ')) {
            const process = text.substring(6);
            const result = await killProgram(process);
            await bot.sendMessage(chatId, result);
        }

        // KATEGORİ 4 komutları
        else if (text === '/chart' || text === '📊 Performans Grafiği') {
            const result = await sendPerformanceChart(chatId);
            if (result !== '✅ Grafik gönderildi.') {
                await bot.sendMessage(chatId, result);
            }
        }
        else if (text === '/startup' || text === '🚀 Startup Programları') {
            const result = await listStartupPrograms();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // KATEGORİ 5 komutları
        else if (text === '/schedulers' || text === '📅 Zamanlayıcılar') {
            const result = await listScheduledTasks();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // KATEGORİ 6 komutları
        else if (text === '/traffic' || text === '📊 Ağ Trafiği') {
            const result = await getNetworkTraffic();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
        else if (text.startsWith('/block ')) {
            const domain = text.substring(7);
            const result = await blockWebsite(domain);
            await bot.sendMessage(chatId, result);
        }
    } catch (error) {
        console.error('Komut işleme hatası:', error);
    }
});

// ==========================================
// KATEGORİ 7: GELİŞMİŞ GÜVENLİK
// ==========================================

// 2FA (Two-Factor Authentication) Sistemi
let twoFactorSecret = null;
let twoFactorEnabled = false;
let pendingUnlockCode = null;

// 2FA'yı Etkinleştir
async function enable2FA() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category7_advanced_security.enabled ||
        !currentConfig.features.category7_advanced_security.two_factor_auth) {
        return '⚠️ İki faktörlü kimlik doğrulama devre dışı. /features menüsünden açın.';
    }

    try {
        const speakeasy = require('speakeasy');
        const QRCode = require('qrcode');

        // Secret oluştur
        const secret = speakeasy.generateSecret({
            name: 'PC Kilit Pro',
            length: 32
        });

        twoFactorSecret = secret.base32;

        // QR kod oluştur
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        const qrBuffer = Buffer.from(qrCodeUrl.split(',')[1], 'base64');

        await bot.sendPhoto(allowedUserId, qrBuffer, {
            caption: `🔐 *2FA Kurulum*\n\n1. Google Authenticator uygulamasını indirin\n2. QR kodu tarayın\n3. /verify2fa <KOD> ile doğrulayın\n\n**Secret Key:** \`${twoFactorSecret}\``,
            parse_mode: 'Markdown'
        });

        return '✅ 2FA kurulum başlatıldı. QR kodu tarayın.';
    } catch (error) {
        console.error('2FA etkinleştirme hatası:', error);
        return '❌ 2FA etkinleştirilemedi: ' + error.message;
    }
}

// 2FA Kodunu Doğrula
async function verify2FA(token) {
    if (!twoFactorSecret) {
        return '❌ 2FA önce etkinleştirilmeli. /enable2fa komutunu kullanın.';
    }

    try {
        const speakeasy = require('speakeasy');

        const verified = speakeasy.totp.verify({
            secret: twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (verified) {
            twoFactorEnabled = true;

            // Secret'i config'e kaydet
            const configPath = path.join(__dirname, 'config.json');
            const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            currentConfig.twoFactorSecret = twoFactorSecret;
            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4), 'utf8');

            return '✅ 2FA başarıyla etkinleştirildi! Artık kilit açma için kod gerekecek.';
        } else {
            return '❌ Kod geçersiz. Lütfen tekrar deneyin.';
        }
    } catch (error) {
        return '❌ Doğrulama hatası: ' + error.message;
    }
}

// 2FA ile Kilit Açma
async function unlockWithCode(token) {
    if (!twoFactorEnabled) {
        return unlockPC(); // 2FA kapalıysa normal unlock
    }

    try {
        const speakeasy = require('speakeasy');

        const verified = speakeasy.totp.verify({
            secret: twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (verified) {
            return await unlockPC();
        } else {
            return '❌ Kod yanlış. PC kilidi açılamadı.';
        }
    } catch (error) {
        return '❌ Doğrulama hatası: ' + error.message;
    }
}

// Şüpheli Aktivite Algılama (Basit AI)
let activityPatterns = {
    normalHours: { start: 8, end: 23 },
    suspiciousPrograms: ['mimikatz', 'psexec', 'netcat', 'nmap'],
    rapidKeystrokes: 0,
    lastKeystrokeTime: Date.now()
};

async function detectSuspiciousActivity() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category7_advanced_security.enabled ||
        !currentConfig.features.category7_advanced_security.ai_threat_detection) {
        return;
    }

    try {
        const currentHour = new Date().getHours();
        const processes = await getRunningPrograms();

        let threats = [];

        // Gece aktivitesi kontrolü
        if (currentHour < activityPatterns.normalHours.start ||
            currentHour > activityPatterns.normalHours.end) {
            threats.push('⚠️ Olağandışı saat: ' + currentHour + ':00');
        }

        // Şüpheli program kontrolü
        for (let suspiciousApp of activityPatterns.suspiciousPrograms) {
            if (processes.toLowerCase().includes(suspiciousApp)) {
                threats.push(`🚨 Şüpheli program tespit edildi: ${suspiciousApp}`);
            }
        }

        if (threats.length > 0) {
            await notifyAdmin('🚨 *Şüpheli Aktivite Tespit Edildi!*\n\n' + threats.join('\n'));

            // Otomatik screenshot al
            await takeScreenshot();
        }
    } catch (error) {
        console.error('Tehdit tespiti hatası:', error);
    }
}

// OTOMATIK TARAMA KAPALI - Manuel olarak çalıştırılabilir
// setInterval(detectSuspiciousActivity, 300000);

// Güvenlik Raporu
async function getSecurityReport() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category7_advanced_security.enabled) {
        return '⚠️ Gelişmiş güvenlik devre dışı. /features menüsünden açın.';
    }

    try {
        let report = '🛡️ *Güvenlik Raporu*\n\n';

        // 2FA durumu
        report += `**2FA Durumu:** ${twoFactorEnabled ? '✅ Aktif' : '❌ Pasif'}\n`;

        // Sistem saati
        const now = new Date();
        report += `**Şu Anki Saat:** ${now.getHours()}:${now.getMinutes()}\n`;

        // Normal saat aralığı
        report += `**Normal Aktivite Saati:** ${activityPatterns.normalHours.start}:00 - ${activityPatterns.normalHours.end}:00\n`;

        // Aktivite log durumu
        const logExists = fs.existsSync('./activity_log.txt');
        report += `**Aktivite Logu:** ${logExists ? '✅ Aktif' : '❌ Yok'}\n`;

        // Son güvenlik olayı
        if (logExists) {
            const log = fs.readFileSync('./activity_log.txt', 'utf8');
            const lines = log.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                report += `**Son Aktivite:** ${lines[lines.length - 1].substring(0, 100)}\n`;
            }
        }

        return report;
    } catch (error) {
        return '❌ Güvenlik raporu oluşturulamadı: ' + error.message;
    }
}

// ==========================================
// KATEGORİ 8: EĞLENCE & KONFOR
// ==========================================

// Windows Bildirimlerini Okuma
async function getWindowsNotifications() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category8_entertainment.enabled ||
        !currentConfig.features.category8_entertainment.notification_management) {
        return '⚠️ Bildirim yönetimi devre dışı. /features menüsünden açın.';
    }

    try {
        // PowerShell ile sistem olaylarını al (Alternatif yöntem)
        const { stdout } = await execPromise(`powershell -command "Get-WinEvent -LogName Application -MaxEvents 10 -ErrorAction SilentlyContinue | Select-Object -Property TimeCreated, ProviderName, Message | ConvertTo-Json"`);

        if (!stdout || stdout.trim() === '') {
            return '📬 *Bildirimler:* Son sistem olaylarında veri bulunamadı.\n\nℹ️ Windows bildirim geçmişi için Bildirim Merkezi\'ni kontrol edin.';
        }

        const notifications = JSON.parse(stdout);
        let message = '📬 *Son Sistem Olayları:*\n\n';

        if (Array.isArray(notifications)) {
            notifications.slice(0, 5).forEach((notif, i) => {
                const time = new Date(notif.TimeCreated).toLocaleString('tr-TR');
                message += `${i + 1}. [${time}]\n`;
                message += `   📱 ${notif.ProviderName || 'Sistem'}\n`;
                message += `   💬 ${notif.Message?.substring(0, 80) || 'Bilgi yok'}...\n\n`;
            });
        } else {
            const time = new Date(notifications.TimeCreated).toLocaleString('tr-TR');
            message += `1. [${time}]\n`;
            message += `   📱 ${notifications.ProviderName || 'Sistem'}\n`;
            message += `   💬 ${notifications.Message?.substring(0, 80)}...\n`;
        }

        message += '\nℹ️ *Not:* Gerçek bildirimler için Action Center kullanılmalıdır.';
        return message;
    } catch (error) {
        console.error('Bildirim okuma hatası:', error);
        return '📬 *Bildirimler*\n\n⚠️ Sistem bildirimlerine erişim şu anda kullanılamıyor.\n\nℹ️ Windows Bildirim Merkezi\'nden (Win+A) bildirimleri görebilirsiniz.';
    }
}

// Ses Seviyesi İzleme ve Bildirim
let audioMonitoring = false;

async function startAudioMonitoring() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category8_entertainment.enabled ||
        !currentConfig.features.category8_entertainment.notification_management) {
        return '⚠️ Bildirim yönetimi devre dışı.';
    }

    try {
        audioMonitoring = true;
        return '🔊 Ses izleme başlatıldı. Yüksek ses algılandığında bildirim gelecek.';
    } catch (error) {
        return '❌ Ses izleme başlatılamadı: ' + error.message;
    }
}

async function stopAudioMonitoring() {
    audioMonitoring = false;
    return '🔇 Ses izleme durduruldu.';
}

// Basit AI Asistan (Komut Yorumlama)
async function aiAssistant(userMessage) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category8_entertainment.enabled ||
        !currentConfig.features.category8_entertainment.ai_assistant) {
        return '⚠️ AI asistan devre dışı. /features menüsünden açın.';
    }

    try {
        const msg = userMessage.toLowerCase();

        // Basit komut eşleştirme
        if (msg.includes('kilitle') || msg.includes('lock')) {
            await lockPC();
            return '🤖 Anladım, PC\'yi kilitliyorum.';
        }
        else if (msg.includes('aç') || msg.includes('unlock')) {
            await unlockPC();
            return '🤖 PC kilidi açılıyor.';
        }
        else if (msg.includes('ekran') || msg.includes('screenshot')) {
            await takeScreenshot();
            return '🤖 Ekran görüntüsü alınıyor...';
        }
        else if (msg.includes('bilgi') || msg.includes('info')) {
            return await getSystemInfo();
        }
        else if (msg.includes('kapat') || msg.includes('shutdown')) {
            return '🤖 PC\'yi kapatmak için "/shutdown" komutunu kullanın veya kaç dakika sonra kapatmak istediğinizi söyleyin.';
        }
        else if (msg.includes('yardım') || msg.includes('help')) {
            return `🤖 *AI Asistan Yardım*

Şunları yapabilirim:
- "PC'yi kilitle" → Kilitlerim
- "Ekran görüntüsü al" → Screenshot çekerim
- "Sistem bilgisi" → Detaylı bilgi veririm
- "USB var mı?" → USB cihazları kontrol ederim
- "Performans nasıl?" → Grafik gönderirim

Normal komutlar da çalışır: /lock, /screenshot, /info vb.`;
        }
        else if (msg.includes('usb')) {
            return await detectUSBDevices();
        }
        else if (msg.includes('performans') || msg.includes('grafik')) {
            await sendPerformanceChart(allowedUserId);
            return '🤖 Performans grafiği gönderiliyor...';
        }
        else {
            return `🤖 Anlamadım. "yardım" yazarak neler yapabileceğimi öğrenebilirsiniz.`;
        }
    } catch (error) {
        return '🤖 Bir hata oluştu: ' + error.message;
    }
}

// Müzik Kontrolü (Windows Media Keys ile PowerShell)
async function controlMusic(action) {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category8_entertainment.enabled ||
        !currentConfig.features.category8_entertainment.music_control) {
        return '⚠️ Müzik kontrolü devre dışı. /features menüsünden açın.';
    }

    try {
        let keyCode;
        switch(action) {
            case 'play':
            case 'pause':
                keyCode = '0xB3'; // Play/Pause key
                break;
            case 'next':
                keyCode = '0xB0'; // Next track
                break;
            case 'previous':
                keyCode = '0xB1'; // Previous track
                break;
            default:
                return '❌ Geçersiz müzik komutu. Kullanım: play, pause, next, previous';
        }

        const command = `powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]${keyCode})"`;
        await execPromise(command);
        return `🎵 Müzik komutu gönderildi: ${action}`;
    } catch (error) {
        return `❌ Müzik kontrolü çalışmadı: ${error.message}`;
    }
}

// Sistem Sağlık Durumu (Eğlenceli Format)
async function getSystemHealth() {
    const currentConfig = reloadConfig();
    if (!currentConfig.features.category8_entertainment.enabled) {
        return '⚠️ Eğlence & Konfor kategorisi devre dışı.';
    }

    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const temp = await si.cpuTemperature();

        let health = 100;
        let emoji = '😊';
        let status = 'Mükemmel';

        // CPU kontrolü
        if (cpu.currentLoad > 80) {
            health -= 20;
            emoji = '😰';
            status = 'Yorgun';
        }

        // RAM kontrolü
        const ramUsage = (mem.used / mem.total) * 100;
        if (ramUsage > 85) {
            health -= 15;
            emoji = '😓';
            status = 'Boğuluyor';
        }

        // Sıcaklık kontrolü
        if (temp.main > 80) {
            health -= 25;
            emoji = '🥵';
            status = 'Aşırı Isınmış';
        }

        return `${emoji} *PC Sağlık Durumu*

**Genel Sağlık:** ${health}%
**Durum:** ${status}

💪 **CPU:** ${cpu.currentLoad.toFixed(1)}% (${cpu.currentLoad > 80 ? 'Çok yorgun!' : 'İyi'})
🧠 **RAM:** ${ramUsage.toFixed(1)}% (${ramUsage > 85 ? 'Nefes alamıyor!' : 'Rahat'})
🌡️ **Sıcaklık:** ${temp.main || 'N/A'}°C (${temp.main > 80 ? 'Çok sıcak!' : 'Normal'})

${health < 50 ? '⚠️ PC\'niz dinlenmeye ihtiyacı var!' : '✅ Her şey yolunda!'}`;
    } catch (error) {
        return '❌ Sağlık durumu okunamadı: ' + error.message;
    }
}

// ==========================================
// YENİ KOMUTLARI TELEGRAM'A EKLE
// ==========================================

// KATEGORİ 7 ve 8 komutlarını mevcut bot.on('message') içine ekle
// (Önceki message handler'ın sonuna ekleniyor)

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (chatId.toString() !== allowedUserId.toString()) return;
    if (!text) return;

    try {
        // KATEGORİ 7 komutları (Gelişmiş Güvenlik)
        if (text === '/enable2fa' || text === '🔐 2FA Aktif Et') {
            const result = await enable2FA();
            if (!result.includes('✅')) {
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
        }
        else if (text.startsWith('/verify2fa ')) {
            const code = text.substring(11).trim();
            const result = await verify2FA(code);
            await bot.sendMessage(chatId, result);
        }
        else if (text.startsWith('/unlockcode ')) {
            const code = text.substring(12).trim();
            const result = await unlockWithCode(code);
            await bot.sendMessage(chatId, result);
        }
        else if (text === '/securityreport' || text === '🛡️ Güvenlik Raporu') {
            const result = await getSecurityReport();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // KATEGORİ 8 komutları (Eğlence & Konfor)
        else if (text === '/notifications' || text === '📬 Bildirimler') {
            const result = await getWindowsNotifications();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
        else if (text === '/audiomonitor' || text === '🔊 Ses İzleme Başlat') {
            const result = await startAudioMonitoring();
            await bot.sendMessage(chatId, result);
        }
        else if (text === '/stopaudiomonitor' || text === '🔇 Ses İzleme Durdur') {
            const result = await stopAudioMonitoring();
            await bot.sendMessage(chatId, result);
        }
        else if (text.startsWith('/ai ')) {
            const question = text.substring(4);
            const result = await aiAssistant(question);
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
        else if (text === '/music play' || text === '▶️ Medya Oynat') {
            const result = await controlMusic('play');
            await bot.sendMessage(chatId, result);
        }
        else if (text === '/music pause' || text === '⏸️ Medya Duraklat') {
            const result = await controlMusic('pause');
            await bot.sendMessage(chatId, result);
        }
        else if (text === '/music next' || text === '⏭️ Sonraki Şarkı') {
            const result = await controlMusic('next');
            await bot.sendMessage(chatId, result);
        }
        else if (text === '/music previous' || text === '⏮️ Önceki Şarkı') {
            const result = await controlMusic('previous');
            await bot.sendMessage(chatId, result);
        }
        else if (text === '/health' || text === '😊 PC Sağlığı') {
            const result = await getSystemHealth();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Kategori 7/8 komut hatası:', error);
    }
});

// ==========================================
// DOSYA YÖNETİMİ ÖZELLİĞİ
// ==========================================

// Dosya yönetimi için global değişken
let uploadTargetPath = 'D:\\PCKilitProDownloads'; // Varsayılan klasör

// Dosya yükleme hedef klasörünü göster/değiştir
async function sendFileManagementMenu(chatId) {
    const message = `📁 *Dosya Yönetimi*

Telegram'dan gönderdiğiniz dosyalar bilgisayara kaydedilir.

📂 **Mevcut Hedef Klasör:**
\`${uploadTargetPath}\`

Bir seçenek seçin:`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📥 Dosya Gönder'],
                ['📂 Hedef Klasör Değiştir'],
                ['📋 İndirilen Dosyalar'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// Telegram'dan gelen dosyaları dinle ve kaydet
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== allowedUserId.toString()) return;

    try {
        const file = msg.document;
        const fileId = file.file_id;
        const fileName = file.file_name;
        const fileSize = (file.file_size / 1024 / 1024).toFixed(2); // MB

        await bot.sendMessage(chatId, `📥 Dosya indiriliyor: ${fileName} (${fileSize}MB)...`);

        // Dosyayı indir
        const fileLink = await bot.getFileLink(fileId);
        const https = require('https');

        // Hedef klasör yoksa oluştur
        if (!fs.existsSync(uploadTargetPath)) {
            fs.mkdirSync(uploadTargetPath, { recursive: true });
        }

        const dest = path.join(uploadTargetPath, fileName);
        const file_stream = fs.createWriteStream(dest);

        https.get(fileLink, (response) => {
            response.pipe(file_stream);
            file_stream.on('finish', async () => {
                file_stream.close();
                await bot.sendMessage(chatId, `✅ Dosya kaydedildi!\n\n📁 **Konum:**\n\`${dest}\``, { parse_mode: 'Markdown' });
            });
        }).on('error', async (err) => {
            fs.unlink(dest, () => {});
            await bot.sendMessage(chatId, `❌ İndirme hatası: ${err.message}`);
        });

    } catch (error) {
        console.error('Dosya kaydetme hatası:', error);
        await bot.sendMessage(chatId, `❌ Dosya kaydedilemedi: ${error.message}`);
    }
});

// Fotoğrafları dinle
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== allowedUserId.toString()) return;

    try {
        const photo = msg.photo[msg.photo.length - 1]; // En yüksek kalite
        const fileId = photo.file_id;
        const fileName = `photo_${Date.now()}.jpg`;

        await bot.sendMessage(chatId, `📸 Fotoğraf indiriliyor...`);

        const fileLink = await bot.getFileLink(fileId);
        const https = require('https');

        if (!fs.existsSync(uploadTargetPath)) {
            fs.mkdirSync(uploadTargetPath, { recursive: true });
        }

        const dest = path.join(uploadTargetPath, fileName);
        const file_stream = fs.createWriteStream(dest);

        https.get(fileLink, (response) => {
            response.pipe(file_stream);
            file_stream.on('finish', async () => {
                file_stream.close();
                await bot.sendMessage(chatId, `✅ Fotoğraf kaydedildi!\n\n📁 **Konum:**\n\`${dest}\``, { parse_mode: 'Markdown' });
            });
        }).on('error', async (err) => {
            fs.unlink(dest, () => {});
            await bot.sendMessage(chatId, `❌ İndirme hatası: ${err.message}`);
        });

    } catch (error) {
        console.error('Fotoğraf kaydetme hatası:', error);
        await bot.sendMessage(chatId, `❌ Fotoğraf kaydedilemedi: ${error.message}`);
    }
});

// Video dinle
bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== allowedUserId.toString()) return;

    try {
        const video = msg.video;
        const fileId = video.file_id;
        const fileName = video.file_name || `video_${Date.now()}.mp4`;
        const fileSize = (video.file_size / 1024 / 1024).toFixed(2);

        await bot.sendMessage(chatId, `🎥 Video indiriliyor: ${fileName} (${fileSize}MB)...`);

        const fileLink = await bot.getFileLink(fileId);
        const https = require('https');

        if (!fs.existsSync(uploadTargetPath)) {
            fs.mkdirSync(uploadTargetPath, { recursive: true });
        }

        const dest = path.join(uploadTargetPath, fileName);
        const file_stream = fs.createWriteStream(dest);

        https.get(fileLink, (response) => {
            response.pipe(file_stream);
            file_stream.on('finish', async () => {
                file_stream.close();
                await bot.sendMessage(chatId, `✅ Video kaydedildi!\n\n📁 **Konum:**\n\`${dest}\``, { parse_mode: 'Markdown' });
            });
        }).on('error', async (err) => {
            fs.unlink(dest, () => {});
            await bot.sendMessage(chatId, `❌ İndirme hatası: ${err.message}`);
        });

    } catch (error) {
        console.error('Video kaydetme hatası:', error);
        await bot.sendMessage(chatId, `❌ Video kaydedilemedi: ${error.message}`);
    }
});

// Hedef klasör değiştirme
let awaitingNewPath = false;

// Dosya Yönetimi butonlarını işle
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (chatId.toString() !== allowedUserId.toString()) return;
    if (!text) return;

    try {
        if (text === '📁 Dosya' || text === '📁 Dosya Yönetimi') {
            await sendFileManagementMenu(chatId);
        }
        else if (text === '📥 Dosya Gönder') {
            await bot.sendMessage(chatId, '📥 *Dosya Gönderme*\n\nŞimdi göndermek istediğiniz dosyayı/fotoğrafı/videoyu Telegram\'a yükleyin.\n\n📂 Hedef klasör:\n`' + uploadTargetPath + '`', { parse_mode: 'Markdown' });
        }
        else if (text === '📂 Hedef Klasör Değiştir') {
            await bot.sendMessage(chatId, '📂 *Hedef Klasör Değiştir*\n\nYeni klasör yolunu gönderin:\n\nÖrnek:\n• `D:\\Downloads`\n• `C:\\Users\\' + os.userInfo().username + '\\Desktop`\n• `D:\\Belgelerim`', { parse_mode: 'Markdown' });
            awaitingNewPath = true;
        }
        else if (awaitingNewPath && text && !text.startsWith('/') && !text.startsWith('📁')) {
            awaitingNewPath = false;

            // Geçerli klasör yolu mu kontrol et
            if (text.includes(':') && text.length > 3) {
                uploadTargetPath = text.trim();

                // Klasör yoksa oluştur
                if (!fs.existsSync(uploadTargetPath)) {
                    try {
                        fs.mkdirSync(uploadTargetPath, { recursive: true });
                        await bot.sendMessage(chatId, `✅ Yeni klasör oluşturuldu ve hedef olarak ayarlandı:\n\`${uploadTargetPath}\``, { parse_mode: 'Markdown' });
                    } catch (error) {
                        await bot.sendMessage(chatId, `❌ Klasör oluşturulamadı: ${error.message}`);
                    }
                } else {
                    await bot.sendMessage(chatId, `✅ Hedef klasör değiştirildi:\n\`${uploadTargetPath}\``, { parse_mode: 'Markdown' });
                }
            } else {
                await bot.sendMessage(chatId, '❌ Geçersiz klasör yolu. Örnek: `D:\\Downloads`', { parse_mode: 'Markdown' });
            }
        }
        else if (text === '📋 İndirilen Dosyalar') {
            if (!fs.existsSync(uploadTargetPath)) {
                await bot.sendMessage(chatId, '📂 Hedef klasör henüz oluşturulmamış.');
                return;
            }

            const files = fs.readdirSync(uploadTargetPath);
            if (files.length === 0) {
                await bot.sendMessage(chatId, '📁 Klasör boş. Henüz dosya yüklenmemiş.');
                return;
            }

            let message = `📋 **İndirilen Dosyalar** (${files.length} dosya):\n\n`;
            files.slice(0, 20).forEach((file, i) => {
                const stats = fs.statSync(path.join(uploadTargetPath, file));
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                message += `${i + 1}. \`${file}\` - ${sizeMB}MB\n`;
            });

            if (files.length > 20) {
                message += `\n... ve ${files.length - 20} dosya daha`;
            }

            message += `\n\n📂 Klasör: \`${uploadTargetPath}\``;

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Dosya yönetimi buton hatası:', error);
    }
});

// Programı başlat
main().catch(console.error);