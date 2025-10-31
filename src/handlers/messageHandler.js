const { bot, checkAuthorization, sendUnauthorizedMessage, isMessageTooOld } = require('../bot');
const logger = require('../utils/logger');
const { getInstance: getUserStateManager } = require('../utils/UserStateManager');

// Get state manager singleton
const stateManager = getUserStateManager();

// Menü imports (PHASE 2: Consolidated menus)
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
    sendQuickFoldersMenu,
    sendMonitorMenu,
    sendNotificationMenu,
    sendSettingsMenu
} = require('../ui/menus');

// Servis imports
// PHASE 4: systemService now consolidates power, disk, and performance
const systemService = require('../services/systemService');
const monitorService = require('../services/monitorService');
const networkService = require('../services/networkService');
const audioService = require('../services/audioService');
const clipboardService = require('../services/clipboardService');
const programService = require('../services/programService');
const securityService = require('../services/securityService');
const automationService = require('../services/automationService');
const activityService = require('../services/activityService');
const mediaService = require('../services/mediaService');
const fileService = require('../services/fileService');
const notificationService = require('../utils/notifications'); // PHASE 3: Moved to utils
const settingsService = require('../core/config'); // PHASE 3: Consolidated config
const inputService = require('../services/inputService');
const monitoringService = require('../services/monitoringService');
const quickActionsService = require('../services/quickActionsService');

// Menü helper imports (PHASE 2: Consolidated menus)
const { getInputMenu, getMouseClickMenu, getScrollMenu, getKeyMenu, getComboMenu } = require('../ui/menus');
const { getClipboardMenu } = require('../ui/menus');
const { getMonitoringMenu, getUSBMonitorMenu, getBatteryMonitorMenu, getNetworkMonitorMenu, getCPUMonitorMenu } = require('../ui/menus');

/**
 * Ana mesaj handler
 * PHASE 4: Refactored to use Map-based state management
 */
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Dosya yüklemelerini (document, photo, video) görmezden gel
    // Bu mesajlar ayrı event handler'lar tarafından işleniyor
    if (!text) {
        return;
    }

    // CRITICAL: Eski mesajları ÖNCE kontrol et (bot kapalıyken gönderilen mesajlar)
    // Eski mesajlara yanıt vermemek için authorization'dan ÖNCE kontrol edilmeli
    if (msg.date && isMessageTooOld(msg.date)) {
        logger.info(`Eski mesaj görmezden gelindi: ${text} (Tarih: ${new Date(msg.date * 1000).toLocaleString('tr-TR')})`);
        return;
    }

    // Yetkilendirme kontrolü
    if (!checkAuthorization(chatId)) {
        await sendUnauthorizedMessage(chatId);
        logger.warning(`Yetkisiz erişim denemesi: ${chatId}`);
        return;
    }

    // Get user-specific state (Map-based)
    const userState = stateManager.getState(chatId);

    logger.info(`Mesaj alındı: ${text}`);

    try {
        // /start komutu
        if (text === '/start') {
            await sendMainMenu(bot, chatId, userState.isLocked);
            return;
        }

        // Ana Menü butonu - ana menüye dön (sadece state yoksa)
        if (text === 'Ana Menü') {
            // Clear all awaiting states for this user
            stateManager.clearAllAwaitingStates(chatId);

            await sendMainMenu(bot, chatId, userState.isLocked);
            return;
        }

        // Kapatmayı iptal et
        if (text === 'Kapatmayı İptal Et') {
            const result = await systemService.cancelShutdown();
            await bot.sendMessage(chatId, result);
            return;
        }

        // Global input handlers (öncelik) - PHASE 4: Per-user state
        if (userState.awaitingShutdownTime && !isNaN(text) && parseInt(text) > 0) {
            stateManager.setState(chatId, 'awaitingShutdownTime', false);
            const minutes = parseInt(text);
            const result = await systemService.shutdownSystem(minutes);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingCommand) {
            stateManager.setState(chatId, 'awaitingCommand', false);
            const result = await programService.runCommand(text);
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            return;
        }

        if (userState.awaitingProgramName) {
            stateManager.setState(chatId, 'awaitingProgramName', false);
            const result = await programService.launchProgram(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingProgramKill) {
            stateManager.setState(chatId, 'awaitingProgramKill', false);
            const result = await programService.killProgram(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingClipboardText) {
            stateManager.setState(chatId, 'awaitingClipboardText', false);
            const result = await clipboardService.writeClipboard(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingVoiceMessage) {
            stateManager.setState(chatId, 'awaitingVoiceMessage', false);
            const result = await audioService.playVoiceCommand(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingWebsiteBlock) {
            stateManager.setState(chatId, 'awaitingWebsiteBlock', false);
            const result = await networkService.blockWebsite(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingWebsiteUnblock) {
            stateManager.setState(chatId, 'awaitingWebsiteUnblock', false);
            const result = await networkService.unblockWebsite(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingMouseMove) {
            stateManager.setState(chatId, 'awaitingMouseMove', false);
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
            await bot.sendMessage(chatId, 'Geçersiz format! Örnek: 500,300');
            return;
        }

        if (userState.awaitingTypeText) {
            stateManager.setState(chatId, 'awaitingTypeText', false);
            const result = await inputService.typeText(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingClipboardSelect) {
            stateManager.setState(chatId, 'awaitingClipboardSelect', false);
            const index = parseInt(text);
            if (!isNaN(index)) {
                const result = await clipboardService.selectFromHistory(index);
                await bot.sendMessage(chatId, result);
                return;
            }
        }

        if (userState.awaitingBrightnessLevel) {
            stateManager.setState(chatId, 'awaitingBrightnessLevel', false);
            const level = parseInt(text);
            if (!isNaN(level) && level >= 0 && level <= 100) {
                const result = await quickActionsService.setBrightness(level);
                // Markdown hatası olabileceği için parse_mode kullanma
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, 'Geçersiz değer! 0-100 arası bir sayı girin.');
            return;
        }

        if (userState.awaitingNotificationMessage) {
            stateManager.setState(chatId, 'awaitingNotificationMessage', false);
            const result = await quickActionsService.sendNotification(text);
            await bot.sendMessage(chatId, result);
            return;
        }

        if (userState.awaitingCustomNotification) {
            if (!userState.awaitingCustomNotificationTitle) {
                // İlk adım: Başlığı al
                stateManager.setState(chatId, 'awaitingCustomNotificationTitle', text);
                await bot.sendMessage(chatId, 'Şimdi bildirim mesajını yazın:');
                return;
            } else {
                // İkinci adım: Mesajı al ve bildirimi gönder
                const title = userState.awaitingCustomNotificationTitle;
                const message = text;
                stateManager.setState(chatId, 'awaitingCustomNotification', false);
                stateManager.setState(chatId, 'awaitingCustomNotificationTitle', '');
                const result = await notificationService.sendCustomNotification(title, message);
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
                return;
            }
        }

        if (userState.awaitingCustomVolume) {
            stateManager.setState(chatId, 'awaitingCustomVolume', false);
            const level = parseInt(text);
            if (!isNaN(level) && level >= 0 && level <= 100) {
                const result = await quickActionsService.setVolume(level);
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, 'Geçersiz değer! 0-100 arası bir sayı girin.');
            return;
        }

        // Screenshot display selection handler
        if (userState.awaitingScreenshotDisplay) {
            const displaysList = userState.displaysList;

            if (text === '🖥️ Tüm Ekranlar') {
                // Take all screenshots
                await bot.sendMessage(chatId, 'Tüm ekranların görüntüsü alınıyor...');
                const results = await monitorService.takeAllScreenshots();

                // Send all screenshots
                for (const result of results) {
                    await bot.sendPhoto(chatId, result.path, {
                        caption: `📸 ${result.display.name}${result.display.main ? ' (Ana Ekran)' : ''}\n📏 ${result.display.width}x${result.display.height}`
                    });
                }

                // Clear state and return to monitor menu
                stateManager.setState(chatId, 'awaitingScreenshotDisplay', false);
                stateManager.setState(chatId, 'displaysList', null);
                await sendMonitorMenu(bot, chatId);
                return;
            } else {
                // Find selected display
                const selectedDisplay = displaysList.find(d =>
                    text === `📺 ${d.name}${d.main ? ' (Ana Ekran)' : ''}`
                );

                if (selectedDisplay) {
                    await bot.sendMessage(chatId, `${selectedDisplay.name} ekran görüntüsü alınıyor...`);
                    const screenshotPath = await monitorService.takeScreenshot(selectedDisplay, { autoDelete: true });
                    await bot.sendPhoto(chatId, screenshotPath, {
                        caption: `📸 ${selectedDisplay.name}${selectedDisplay.main ? ' (Ana Ekran)' : ''}\n📏 ${selectedDisplay.width}x${selectedDisplay.height}`
                    });

                    // Clear state and return to monitor menu
                    stateManager.setState(chatId, 'awaitingScreenshotDisplay', false);
                    stateManager.setState(chatId, 'displaysList', null);
                    await sendMonitorMenu(bot, chatId);
                    return;
                }
            }
        }

        // Recording display selection handler
        if (userState.awaitingRecordingDisplay) {
            const displaysList = userState.displaysList;
            const duration = userState.recordingDuration || 30;

            if (text === '🖥️ Tüm Ekranlar') {
                // Record all displays (tüm ekran - default behavior)
                await bot.sendMessage(chatId, `Tüm ekranların ${duration} saniyelik kaydı başlatılıyor...`);
                await monitorService.startScreenRecording(duration, null, chatId, bot);
                await bot.sendMessage(chatId, `Kayıt başlatıldı. ${duration} saniye sonra video gönderilecek.`);

                // Clear state and return to monitor menu
                stateManager.setState(chatId, 'awaitingRecordingDisplay', false);
                stateManager.setState(chatId, 'displaysList', null);
                stateManager.setState(chatId, 'recordingDuration', null);
                await sendMonitorMenu(bot, chatId);
                return;
            } else {
                // Find selected display
                const selectedDisplay = displaysList.find(d =>
                    text === `📺 ${d.name}${d.main ? ' (Ana Ekran)' : ''}`
                );

                if (selectedDisplay) {
                    await bot.sendMessage(chatId, `${selectedDisplay.name} ekranının ${duration} saniyelik kaydı başlatılıyor...`);
                    await monitorService.startScreenRecording(duration, selectedDisplay, chatId, bot);
                    await bot.sendMessage(chatId, `Kayıt başlatıldı. ${duration} saniye sonra video gönderilecek.`);

                    // Clear state and return to monitor menu
                    stateManager.setState(chatId, 'awaitingRecordingDisplay', false);
                    stateManager.setState(chatId, 'displaysList', null);
                    stateManager.setState(chatId, 'recordingDuration', null);
                    await sendMonitorMenu(bot, chatId);
                    return;
                }
            }
        }

        if (userState.awaitingScheduledTask) {
            stateManager.setState(chatId, 'awaitingScheduledTask', false);
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
            await bot.sendMessage(chatId, 'Geçersiz format! Örnek: `shutdown /s /t 0|30`', { parse_mode: 'Markdown' });
            return;
        }

        if (userState.awaitingRecurringTask) {
            stateManager.setState(chatId, 'awaitingRecurringTask', false);
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
            await bot.sendMessage(chatId, 'Geçersiz format! Örnek: `echo test|10`', { parse_mode: 'Markdown' });
            return;
        }

        if (userState.awaitingTaskDelete) {
            stateManager.setState(chatId, 'awaitingTaskDelete', false);
            const taskId = parseInt(text);
            if (!isNaN(taskId)) {
                const result = await automationService.removeTask(taskId);
                await bot.sendMessage(chatId, result);
                return;
            }
            await bot.sendMessage(chatId, 'Geçersiz görev ID\'si!');
            return;
        }

        // ========== AKILLI DOSYA GEZİNME SİSTEMİ ==========
        if (userState.awaitingFileBrowse) {
            // Özel komutları kontrol et (Geri, İptal, Ana Menü)
            if (text === 'Geri' || text === 'İptal') {
                stateManager.setState(chatId, 'awaitingFileBrowse', false);
                stateManager.setState(chatId, 'currentPath', null);
                stateManager.setState(chatId, 'currentFolders', null);
                stateManager.setState(chatId, 'currentFiles', null);
                await sendFileManagementMenu(bot, chatId);
                return;
            }

            // Dosya yükleme butonu
            if (text === 'Dosya Yükle') {
                const currentPath = userState.currentPath;
                stateManager.setState(chatId, 'awaitingFileUpload', true);
                stateManager.setState(chatId, 'uploadTargetFolder', currentPath);
                const keyboard = {
                    reply_markup: {
                        keyboard: [['İptal']],
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                };
                await bot.sendMessage(chatId, `*Dosya Yükleme Modu*\n\nHedef klasör: \`${currentPath}\`\n\n💡 Dosya, fotoğraf veya video gönder\nİptal ile vazgeç`, { parse_mode: 'Markdown', ...keyboard });
                return;
            }

            // Quick folder geçişi için kontrol (kullanıcı browse sırasında quick folder'a geçmek isteyebilir)
            const quickFolders = fileService.getQuickFolders();
            if (quickFolders[text]) {
                const result = await fileService.listFolderContents(quickFolders[text]);
                if (result.success) {
                    stateManager.setState(chatId, 'currentPath', result.currentPath);
                    stateManager.setState(chatId, 'currentFolders', result.folders);
                    stateManager.setState(chatId, 'currentFiles', result.files);
                    const browseKeyboard = {
                        reply_markup: {
                            keyboard: [['Geri', 'Dosya Yükle']],
                            resize_keyboard: true,
                            one_time_keyboard: false
                        }
                    };
                    await bot.sendMessage(chatId, result.message + '\n\n💡 Numara ile seçim yap\n💡 Geri ile menüye dön | Dosya Yükle ile dosya yükle', { parse_mode: 'Markdown', ...browseKeyboard });
                }
                return;
            }

            // Numara ile seçim
            const number = parseInt(text);
            if (!isNaN(number)) {
                const currentFolders = userState.currentFolders || [];
                const currentFiles = userState.currentFiles || [];
                const currentPath = userState.currentPath;
                const selected = fileService.selectItemByNumber(number, currentFolders, currentFiles);

                if (!selected) {
                    await bot.sendMessage(chatId, '❌ Geçersiz numara!');
                    return;
                }

                if (selected.type === 'parent') {
                    const path = require('path');
                    const parentPath = path.dirname(currentPath);
                    const result = await fileService.listFolderContents(parentPath);
                    if (result.success) {
                        stateManager.setState(chatId, 'currentPath', result.currentPath);
                        stateManager.setState(chatId, 'currentFolders', result.folders);
                        stateManager.setState(chatId, 'currentFiles', result.files);
                        const browseKeyboard = {
                            reply_markup: {
                                keyboard: [['Geri', 'Dosya Yükle']],
                                resize_keyboard: true,
                                one_time_keyboard: false
                            }
                        };
                        await bot.sendMessage(chatId, result.message + '\n\n💡 Numara ile seçim yap\n💡 Geri ile menüye dön | Dosya Yükle ile dosya yükle', { parse_mode: 'Markdown', ...browseKeyboard });
                    }
                    return;
                } else if (selected.type === 'folder') {
                    const result = await fileService.listFolderContents(selected.path);
                    if (result.success) {
                        stateManager.setState(chatId, 'currentPath', result.currentPath);
                        stateManager.setState(chatId, 'currentFolders', result.folders);
                        stateManager.setState(chatId, 'currentFiles', result.files);
                        const browseKeyboard = {
                            reply_markup: {
                                keyboard: [['Geri', 'Dosya Yükle']],
                                resize_keyboard: true,
                                one_time_keyboard: false
                            }
                        };
                        await bot.sendMessage(chatId, result.message + '\n\n💡 Numara ile seçim yap\n💡 Geri ile menüye dön | Dosya Yükle ile dosya yükle', { parse_mode: 'Markdown', ...browseKeyboard });
                    }
                    return;
                } else if (selected.type === 'file') {
                    stateManager.setState(chatId, 'selectedFile', selected);
                    stateManager.setState(chatId, 'awaitingFileBrowse', false);
                    stateManager.setState(chatId, 'awaitingFileAction', true);
                    const keyboard = {
                        reply_markup: {
                            keyboard: [['Gönder', 'Bilgi'], ['Sil', 'İptal']],
                            resize_keyboard: true
                        }
                    };
                    await bot.sendMessage(chatId, `*Seçildi:* ${selected.name}\n\nNe yapalım?`, { parse_mode: 'Markdown', ...keyboard });
                    return;
                }
            }

            // Geçersiz giriş
            await bot.sendMessage(chatId, '❌ Geçersiz giriş! Lütfen bir numara girin veya "Geri" yazın.');
            return;
        }

        if (userState.awaitingQuickFolder) {
            const quickFolders = userState.quickFolders || {};
            if (text === 'Geri') {
                stateManager.setState(chatId, 'awaitingQuickFolder', false);
                stateManager.setState(chatId, 'quickFolders', null);
                await sendFileManagementMenu(bot, chatId);
                return;
            }
            const selectedPath = quickFolders[text];
            if (selectedPath) {
                const result = await fileService.listFolderContents(selectedPath);
                if (result.success) {
                    stateManager.setState(chatId, 'awaitingQuickFolder', false);
                    stateManager.setState(chatId, 'quickFolders', null);
                    stateManager.setState(chatId, 'awaitingFileBrowse', true);
                    stateManager.setState(chatId, 'currentPath', result.currentPath);
                    stateManager.setState(chatId, 'currentFolders', result.folders);
                    stateManager.setState(chatId, 'currentFiles', result.files);
                    const browseKeyboard = {
                        reply_markup: {
                            keyboard: [['Geri', 'Dosya Yükle']],
                            resize_keyboard: true,
                            one_time_keyboard: false
                        }
                    };
                    await bot.sendMessage(chatId, result.message + '\n\n💡 Numara ile seçim yap\n💡 Geri ile menüye dön | Dosya Yükle ile dosya yükle', { parse_mode: 'Markdown', ...browseKeyboard });
                } else {
                    await bot.sendMessage(chatId, result.message || '❌ Klasöre erişilemedi!');
                }
            }
            return;
        }

        // ========== DOSYA YÜKLEME MODU ==========
        if (userState.awaitingFileUpload) {
            if (text === 'İptal') {
                stateManager.setState(chatId, 'awaitingFileUpload', false);
                stateManager.setState(chatId, 'uploadTargetFolder', null);
                // Browse moduna geri dön
                const currentPath = userState.currentPath;
                if (currentPath) {
                    const result = await fileService.listFolderContents(currentPath);
                    if (result.success) {
                        const browseKeyboard = {
                            reply_markup: {
                                keyboard: [['Geri', 'Dosya Yükle']],
                                resize_keyboard: true,
                                one_time_keyboard: false
                            }
                        };
                        await bot.sendMessage(chatId, result.message + '\n\n💡 Numara ile seçim yap\n💡 Geri ile menüye dön | Dosya Yükle ile dosya yükle', { parse_mode: 'Markdown', ...browseKeyboard });
                    }
                } else {
                    await sendFileManagementMenu(bot, chatId);
                }
                return;
            }
            // Dosya bekliyoruz, başka metin mesajı geçersiz
            await bot.sendMessage(chatId, '⚠️ Lütfen dosya gönder veya İptal ile vazgeç');
            return;
        }

        if (userState.awaitingFileAction) {
            const selectedFile = userState.selectedFile;
            if (text === 'Gönder') {
                stateManager.setState(chatId, 'awaitingFileAction', false);
                stateManager.setState(chatId, 'selectedFile', null);
                const result = await fileService.sendFileToTelegram(bot, chatId, selectedFile.path);
                await bot.sendMessage(chatId, result);
                await sendFileManagementMenu(bot, chatId);
            } else if (text === 'Bilgi') {
                stateManager.setState(chatId, 'awaitingFileAction', false);
                stateManager.setState(chatId, 'selectedFile', null);
                const info = await fileService.getFileInfo(selectedFile.path);
                await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
                await sendFileManagementMenu(bot, chatId);
            } else if (text === 'Sil') {
                stateManager.setState(chatId, 'awaitingFileAction', false);
                stateManager.setState(chatId, 'selectedFile', null);
                const result = await fileService.deleteFile(selectedFile.path);
                await bot.sendMessage(chatId, result);
                await sendFileManagementMenu(bot, chatId);
            } else if (text === 'İptal') {
                stateManager.setState(chatId, 'awaitingFileAction', false);
                stateManager.setState(chatId, 'selectedFile', null);
                await sendFileManagementMenu(bot, chatId);
            }
            return;
        }

        if (userState.awaitingFileSearch) {
            stateManager.setState(chatId, 'awaitingFileSearch', false);
            const currentPath = userState.currentPath || 'C:\\Users';
            const result = await fileService.searchFiles(currentPath, text);
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            await sendFileManagementMenu(bot, chatId);
            return;
        }

        // ========== ANA MENÜ ==========
        if (text === 'Sistem') {
            await sendSystemMenu(bot, chatId);
        } else if (text === 'Güç') {
            await sendPowerMenu(bot, chatId);
        } else if (text === 'Güvenlik') {
            await sendSecurityMenu(bot, chatId);
        } else if (text === 'Disk') {
            await sendDiskMenu(bot, chatId);
        } else if (text === 'Ekran') {
            await sendMonitorMenu(bot, chatId);
        } else if (text === 'Ses') {
            await sendAudioMenu(bot, chatId);
        } else if (text === 'Ağ') {
            await sendNetworkMenu(bot, chatId);
        } else if (text === 'Dosya') {
            await sendFileManagementMenu(bot, chatId);
        } else if (text === 'Otomasyon') {
            await sendAutomationMenu(bot, chatId);
        } else if (text === 'Performans') {
            await sendPerformanceMenu(bot, chatId);
        } else if (text === 'Eğlence') {
            await sendEntertainmentMenu(bot, chatId);
        } else if (text === 'Ana Menü' || text === 'Ses Menüsü' || text === 'Geri') {
            await sendMainMenu(bot, chatId, userState.isLocked);
        }

        // ========== SİSTEM MENÜSÜ ==========
        else if (text === 'Sistem Bilgisi') {
            const info = await systemService.getSystemInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === 'Sıcaklık') {
            const temp = await systemService.getTemperature();
            await bot.sendMessage(chatId, temp, { parse_mode: 'Markdown' });
        } else if (text === 'Çalışan Programlar') {
            const programs = await systemService.getRunningPrograms();
            await bot.sendMessage(chatId, programs, { parse_mode: 'Markdown' });
        } else if (text === 'Program Listesi (TXT)') {
            await bot.sendMessage(chatId, 'Program listesi hazırlanıyor...');
            const result = await systemService.getRunningProgramsFile();
            if (result.success) {
                await bot.sendDocument(chatId, result.filePath, { caption: result.message });
            } else {
                await bot.sendMessage(chatId, result.message);
            }
        } else if (text === 'CPU Kullanımı') {
            const cpu = await systemService.getCPUUsage();
            const message = `*CPU Bilgisi*\n\nModel: ${cpu.model}\nÇekirdek: ${cpu.cores}\nKullanım: %${cpu.usage}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else if (text === 'RAM Kullanımı') {
            const ram = await systemService.getRAMUsage();
            const message = `*RAM Kullanımı*\n\nKullanılan: ${ram.used} GB\nToplam: ${ram.total} GB\nBoş: ${ram.free} GB\nKullanım: %${ram.usagePercent}`;
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else if (text === 'Panoyu Göster') {
            const clipboard = await clipboardService.getClipboard();
            await bot.sendMessage(chatId, clipboard, { parse_mode: 'Markdown' });
        } else if (text === 'Panoya Yaz') {
            await bot.sendMessage(chatId, 'Lütfen panoya yazılacak metni gönderin:');
            stateManager.setState(chatId, 'awaitingClipboardText', true);
        } else if (text === 'Komut Çalıştır') {
            await bot.sendMessage(chatId, 'Lütfen çalıştırılacak komutu yazın:');
            stateManager.setState(chatId, 'awaitingCommand', true);
        } else if (text === 'Program Başlat') {
            await bot.sendMessage(chatId, `*Program Başlat*

Program adını veya yolunu yazın:

*Örnekler:*
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
            stateManager.setState(chatId, 'awaitingProgramName', true);
        } else if (text === 'Program Kapat') {
            await bot.sendMessage(chatId, `*Program Kapat*

Kapatılacak programın adını yazın:

*Örnekler:*
• \`notepad.exe\` - Not Defteri
• \`chrome.exe\` - Google Chrome
• \`firefox.exe\` - Mozilla Firefox
• \`explorer.exe\` - Dosya Gezgini
• \`Telegram.exe\` - Telegram
• \`Discord.exe\` - Discord
• \`Spotify.exe\` - Spotify
• \`Code.exe\` - VS Code
• \`javaw.exe\` - Java uygulamaları

*İpucu:* Çalışan Programlar'dan tam adını görebilirsiniz.`, { parse_mode: 'Markdown' });
            stateManager.setState(chatId, 'awaitingProgramKill', true);
        }

        // ========== GÜÇ MENÜSÜ ==========
        else if (text === 'Kilitle') {
            const result = await systemService.lockSystem();
            stateManager.setState(chatId, 'isLocked', true);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Kilidi Aç') {
            const result = await systemService.unlockSystem();
            stateManager.setState(chatId, 'isLocked', false);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Uyku Modu') {
            const result = await systemService.sleepMode();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Yeniden Başlat') {
            const result = await systemService.rebootSystem();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Kapat') {
            const keyboard = {
                reply_markup: {
                    keyboard: [
                        ['Hemen Kapat'],
                        ['1 Dakika', '5 Dakika'],
                        ['15 Dakika', '30 Dakika'],
                        ['1 Saat', 'Özel Süre'],
                        ['Kapatmayı İptal Et', 'Geri']
                    ],
                    resize_keyboard: true
                }
            };
            await bot.sendMessage(chatId, '*Kapatma Zamanı Seçin*\n\nBilgisayar ne zaman kapatılsın?', {
                parse_mode: 'Markdown',
                ...keyboard
            });
        } else if (text === 'Hemen Kapat') {
            const result = await systemService.shutdownSystem(0);
            await bot.sendMessage(chatId, result);
        } else if (text === '1 Dakika') {
            const result = await systemService.shutdownSystem(1);
            await bot.sendMessage(chatId, result);
        } else if (text === '5 Dakika') {
            const result = await systemService.shutdownSystem(5);
            await bot.sendMessage(chatId, result);
        } else if (text === '15 Dakika') {
            const result = await systemService.shutdownSystem(15);
            await bot.sendMessage(chatId, result);
        } else if (text === '30 Dakika') {
            const result = await systemService.shutdownSystem(30);
            await bot.sendMessage(chatId, result);
        } else if (text === '1 Saat') {
            const result = await systemService.shutdownSystem(60);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Özel Süre') {
            await bot.sendMessage(chatId, 'Kapatma süresini dakika cinsinden yazın (örn: 45):');
            stateManager.setState(chatId, 'awaitingShutdownTime', true);
        }

        // ========== EKRAN MENÜSÜ ==========
        else if (text === 'Ekran Görüntüsü') {
            // Multi-monitor desteği
            const displays = await monitorService.getDisplays();

            if (displays.length > 1) {
                // Birden fazla ekran var - menü göster
                const keyboard = {
                    reply_markup: {
                        keyboard: [
                            ...displays.map((d, i) => [`📺 ${d.name}${d.main ? ' (Ana Ekran)' : ''}`]),
                            ['🖥️ Tüm Ekranlar', 'Geri']
                        ],
                        resize_keyboard: true
                    }
                };

                stateManager.setState(chatId, 'awaitingScreenshotDisplay', true);
                stateManager.setState(chatId, 'displaysList', displays);
                await bot.sendMessage(chatId, '*Ekran Seçin*\n\nHangi ekranın görüntüsünü almak istersiniz?', {
                    parse_mode: 'Markdown',
                    ...keyboard
                });
            } else {
                // Tek ekran - direkt al
                await bot.sendMessage(chatId, 'Ekran görüntüsü alınıyor...');
                const screenshotPath = await monitorService.takeScreenshot(null, { autoDelete: true });
                await bot.sendPhoto(chatId, screenshotPath, { caption: '📸 Ekran görüntüsü' });
            }
        } else if (text === 'Webcam Fotoğraf') {
            await bot.sendMessage(chatId, 'Webcam fotoğrafı çekiliyor...');
            const photoPath = await monitorService.takeWebcamPhoto({ autoDelete: true });
            await bot.sendPhoto(chatId, photoPath, { caption: 'Webcam fotoğrafı' });
        } else if (text === 'Webcam Video') {
            await bot.sendMessage(chatId, '10 saniyelik webcam video kaydı başlatılıyor...');
            await monitorService.startWebcamRecording(10, chatId, bot);
            await bot.sendMessage(chatId, 'Kayıt başlatıldı. 10 saniye sonra video gönderilecek.');
        } else if (text === 'Ekran Kaydı (30sn)' || text === 'Ekran Kaydı') {
            // Multi-monitor desteği
            const displays = await monitorService.getDisplays();

            if (displays.length > 1) {
                // Birden fazla ekran var - menü göster
                const keyboard = {
                    reply_markup: {
                        keyboard: [
                            ...displays.map((d, i) => [`📺 ${d.name}${d.main ? ' (Ana Ekran)' : ''}`]),
                            ['🖥️ Tüm Ekranlar', 'Geri']
                        ],
                        resize_keyboard: true
                    }
                };

                stateManager.setState(chatId, 'awaitingRecordingDisplay', true);
                stateManager.setState(chatId, 'recordingDuration', 30);
                stateManager.setState(chatId, 'displaysList', displays);
                await bot.sendMessage(chatId, '*Ekran Seçin (30sn Kayıt)*\n\nHangi ekranı kaydetmek istersiniz?', {
                    parse_mode: 'Markdown',
                    ...keyboard
                });
            } else {
                // Tek ekran - direkt kaydet
                await bot.sendMessage(chatId, '30 saniyelik ekran kaydı başlatılıyor...');
                await monitorService.startScreenRecording(30, null, chatId, bot);
                await bot.sendMessage(chatId, 'Kayıt başlatıldı. 30 saniye sonra video gönderilecek.');
            }
        } else if (text === 'Ekran Kaydı (60sn)') {
            // Multi-monitor desteği
            const displays = await monitorService.getDisplays();

            if (displays.length > 1) {
                // Birden fazla ekran var - menü göster
                const keyboard = {
                    reply_markup: {
                        keyboard: [
                            ...displays.map((d, i) => [`📺 ${d.name}${d.main ? ' (Ana Ekran)' : ''}`]),
                            ['🖥️ Tüm Ekranlar', 'Geri']
                        ],
                        resize_keyboard: true
                    }
                };

                stateManager.setState(chatId, 'awaitingRecordingDisplay', true);
                stateManager.setState(chatId, 'recordingDuration', 60);
                stateManager.setState(chatId, 'displaysList', displays);
                await bot.sendMessage(chatId, '*Ekran Seçin (60sn Kayıt)*\n\nHangi ekranı kaydetmek istersiniz?', {
                    parse_mode: 'Markdown',
                    ...keyboard
                });
            } else {
                // Tek ekran - direkt kaydet
                await bot.sendMessage(chatId, '60 saniyelik ekran kaydı başlatılıyor...');
                await monitorService.startScreenRecording(60, null, chatId, bot);
                await bot.sendMessage(chatId, 'Kayıt başlatıldı. 60 saniye sonra video gönderilecek.');
            }
        }

        // ========== AĞ MENÜSÜ ==========
        else if (text === 'IP Bilgisi') {
            const info = await networkService.getIPInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === 'WiFi Bilgisi') {
            const info = await networkService.getWiFiInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === 'Ağ Trafiği') {
            const traffic = await networkService.getNetworkTraffic();
            await bot.sendMessage(chatId, traffic, { parse_mode: 'Markdown' });
        } else if (text === 'Ağ Taraması') {
            await bot.sendMessage(chatId, 'Ağ taranıyor...');
            const scan = await networkService.scanNetwork();
            await bot.sendMessage(chatId, scan, { parse_mode: 'Markdown' });
        } else if (text === 'Website Engelle' || text.includes('Website Engelle')) {
            await bot.sendMessage(chatId, 'Engellenecek domain adını yazın (örn: facebook.com):');
            stateManager.setState(chatId, 'awaitingWebsiteBlock', true);
        } else if (text === 'Engeli Kaldır' || text.includes('Engeli Kaldır')) {
            await bot.sendMessage(chatId, 'Engeli kaldırılacak domain adını yazın:');
            stateManager.setState(chatId, 'awaitingWebsiteUnblock', true);
        } else if (text === 'Engellenen Siteler') {
            const blocked = await networkService.getBlockedWebsites();
            await bot.sendMessage(chatId, blocked, { parse_mode: 'Markdown' });
        }

        // ========== SES MENÜSÜ ==========
        else if (text === 'Ses Aç') {
            const result = await audioService.unmuteSpeakers();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Sessize Al') {
            const result = await audioService.muteSpeakers();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ses Yükselt') {
            const result = await audioService.increaseVolume();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ses Azalt') {
            const result = await audioService.decreaseVolume();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Sesli Komutlar') {
            await sendVoiceCommandMenu(bot, chatId);
        }

        // ========== SESLİ KOMUTLAR ==========
        else if (text === 'Merhaba De') {
            const result = await audioService.playVoiceCommand('hello');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Uyarı Ver') {
            const result = await audioService.playVoiceCommand('warning');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Şaka Yap') {
            const result = await audioService.playVoiceCommand('joke');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Korkut') {
            const result = await audioService.playVoiceCommand('scare');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Bilgisayarı Kapatıyorum') {
            const result = await audioService.playVoiceCommand('shutdown');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Hacker Uyarısı') {
            const result = await audioService.playVoiceCommand('hacker');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Motivasyon') {
            const result = await audioService.playVoiceCommand('motivation');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Tebrikler') {
            const result = await audioService.playVoiceCommand('congrats');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Özel Mesaj') {
            await bot.sendMessage(chatId, 'Söylememi istediğiniz metni yazın:');
            stateManager.setState(chatId, 'awaitingVoiceMessage', true);
        } else if (text === 'Cihaz Listesi') {
            const result = await audioService.listAudioDevices();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Cihaz Değiştir') {
            const result = await audioService.changeAudioDevice();
            await bot.sendMessage(chatId, result);
        }

        // ========== GÜVENLİK MENÜSÜ ==========
        else if (text === 'Güvenlik Kontrolü') {
            const report = await securityService.securityCheck();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === 'Güvenlik Raporu') {
            const report = await securityService.getSecurityReport();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === 'Antivirüs') {
            const report = await securityService.checkAntivirus();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === 'Güvenlik Duvarı') {
            const report = await securityService.checkFirewall();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === 'USB Cihazları') {
            const devices = await securityService.detectUSBDevices();
            await bot.sendMessage(chatId, devices, { parse_mode: 'Markdown' });
        }

        // ========== DİSK MENÜSÜ ==========
        else if (text === 'Disk Kullanımı') {
            const usage = await systemService.getDiskUsage();
            await bot.sendMessage(chatId, usage, { parse_mode: 'Markdown' });
        } else if (text === 'Disk Analizi') {
            await bot.sendMessage(chatId, '*Disk Analizi Başlatıldı*\n\nTüm diskler taranıyor...\nBüyük dosyalar tespit ediliyor...\n\nBu işlem 30-60 saniye sürebilir, lütfen bekleyin.', { parse_mode: 'Markdown' });
            const analysis = await systemService.analyzeDisk();
            await bot.sendMessage(chatId, analysis, { parse_mode: 'Markdown' });
        } else if (text === 'Disk Temizliği' || text === 'Geçici Dosyalar') {
            await bot.sendMessage(chatId, 'Disk temizliği başlatılıyor...');
            const result = await systemService.cleanDisk();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // ========== PERFORMANS MENÜSÜ ==========
        else if (text === 'Performans Grafiği') {
            const chart = await systemService.getPerformanceChart();
            await bot.sendMessage(chatId, chart, { parse_mode: 'Markdown' });
        } else if (text === 'Sistem Sağlığı') {
            const health = await systemService.getSystemHealth();
            await bot.sendMessage(chatId, health, { parse_mode: 'Markdown' });
        } else if (text === 'Başlangıç') {
            const programs = await programService.listStartupPrograms();
            await bot.sendMessage(chatId, programs, { parse_mode: 'Markdown' });
        }

        // ========== OTOMASYON MENÜSÜ ==========
        else if (text === 'Zamanlanmış Görev') {
            await bot.sendMessage(chatId, '*Zamanlanmış Görev Ekle*\n\nKomut ve zaman bilgisini şu formatta yazın:\n`komut|dakika`\n\nÖrnek: `shutdown /s /t 0|30` (30 dakika sonra kapat)');
            stateManager.setState(chatId, 'awaitingScheduledTask', true);
        } else if (text === 'Tekrarlı Görev') {
            await bot.sendMessage(chatId, '*Tekrarlı Görev Ekle*\n\nKomut ve tekrar süresini şu formatta yazın:\n`komut|interval_dakika`\n\nÖrnek: `echo test|10` (her 10 dakikada bir)');
            stateManager.setState(chatId, 'awaitingRecurringTask', true);
        } else if (text === 'Görev Listesi') {
            const tasks = automationService.listScheduledTasks();
            await bot.sendMessage(chatId, tasks, { parse_mode: 'Markdown' });
        } else if (text === 'Görev Sil') {
            await bot.sendMessage(chatId, 'Silmek istediğiniz görev ID\'sini yazın:');
            stateManager.setState(chatId, 'awaitingTaskDelete', true);
        } else if (text === 'Cron Yardım') {
            const help = automationService.getCronHelp();
            await bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
        }

        // ========== YENİ DOSYA YÖNETİMİ MENÜSÜ (AKILLI) ==========
        else if (text === 'Gözat') {
            const quickFolders = fileService.getQuickFolders();
            stateManager.setState(chatId, 'awaitingQuickFolder', true);
            stateManager.setState(chatId, 'quickFolders', quickFolders);
            await sendQuickFoldersMenu(bot, chatId, quickFolders);
        }
        else if (text === 'Son Kullanılanlar') {
            const result = await fileService.getRecentFiles();
            await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
        }
        else if (text === 'Dosya Ara') {
            await bot.sendMessage(chatId, 'Aramak istediğin dosya adını yaz (örnek: *.pdf veya rapor*)');
            stateManager.setState(chatId, 'awaitingFileSearch', true);
        }

        // ========== AKTİVİTE İZLEME ==========
        else if (text === 'Aktivite' || text === 'Aktivite Raporu') {
            const report = activityService.getActivityReport();
            await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
        } else if (text === 'İzlemeyi Başlat') {
            const result = activityService.startMonitoring();
            await bot.sendMessage(chatId, result);
        } else if (text === 'İzlemeyi Durdur') {
            const result = activityService.stopMonitoring();
            await bot.sendMessage(chatId, result);
        }

        // ========== EĞLENCE/MEDYA ==========
        else if (text === 'Netflix Aç') {
            const result = await mediaService.openApplication('netflix');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Spotify Aç') {
            const result = await mediaService.openApplication('spotify');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Steam Aç') {
            const result = await mediaService.openApplication('steam');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Discord Aç') {
            const result = await mediaService.openApplication('discord');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Medya Oynat' || text === 'Medya Duraklat') {
            const result = await mediaService.controlMusic('play');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Sonraki') {
            const result = await mediaService.controlMusic('next');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Önceki') {
            const result = await mediaService.controlMusic('previous');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Çalan Müzik') {
            const status = await mediaService.getMusicStatus();
            await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
        }

        // ========== BİLDİRİMLER ==========
        else if (text === 'Bildirimler') {
            await sendNotificationMenu(bot, chatId);
        } else if (text === 'Bildirimleri Göster') {
            const notifications = await notificationService.getWindowsNotifications();
            await bot.sendMessage(chatId, notifications, { parse_mode: 'Markdown' });
        } else if (text === 'Test Bildirimi') {
            const result = await notificationService.sendTestNotification();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Özel Bildirim Gönder') {
            await bot.sendMessage(chatId, 'Bildirim başlığını yazın (sonra mesajı soracağım):');
            stateManager.setState(chatId, 'awaitingCustomNotification', true);
        }

        // ========== AYARLAR ==========
        else if (text === 'Ayarlar') {
            await sendSettingsMenu(bot, chatId);
        } else if (text === 'Tüm Ayarlar') {
            const settings = settingsService.getAllSettings();
            await bot.sendMessage(chatId, settings, { parse_mode: 'Markdown' });
        } else if (text === 'Bot Bilgisi') {
            const info = settingsService.getBotInfo();
            await bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
        } else if (text === 'Tümünü Aç') {
            const result = settingsService.enableAllCategories();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Tümünü Kapat') {
            const result = settingsService.disableAllCategories();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Config Yenile') {
            await bot.sendMessage(chatId, 'Bu özellik artık desteklenmiyor. .env dosyasını düzenleyin ve botu yeniden başlatın.');
        }

        // MOUSE VE KLAVYE KONTROLÜ
        else if (text === 'Mouse/Klavye') {
            await bot.sendMessage(chatId, '*Mouse ve Klavye Kontrolü*\n\nUzaktan mouse ve klavye kontrolü yapabilirsiniz.', { parse_mode: 'Markdown', ...getInputMenu() });
        } else if (text === 'Mouse Taşı') {
            stateManager.setState(chatId, 'awaitingMouseMove', true);
            await bot.sendMessage(chatId, 'Fareyi taşımak için koordinatları girin (x,y):\n\nÖrnek: 500,300');
        } else if (text === 'Mouse Tıkla') {
            await bot.sendMessage(chatId, 'Hangi mouse butonuna tıklamak istersiniz?', getMouseClickMenu());
        } else if (text === 'Sol Tık') {
            const result = await inputService.clickMouse('left');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Sağ Tık') {
            const result = await inputService.clickMouse('right');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Orta Tık') {
            const result = await inputService.clickMouse('middle');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Çift Tık') {
            const result = await inputService.doubleClick();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Scroll') {
            await bot.sendMessage(chatId, 'Hangi yöne scroll yapmak istersiniz?', getScrollMenu());
        } else if (text === 'Yukarı Scroll') {
            const result = await inputService.scrollMouse('up', 3);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Aşağı Scroll') {
            const result = await inputService.scrollMouse('down', 3);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Mouse Konum') {
            const result = await inputService.getMousePosition();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Metin Yaz') {
            stateManager.setState(chatId, 'awaitingTypeText', true);
            await bot.sendMessage(chatId, 'Yazmak istediğiniz metni girin:');
        } else if (text === 'Tuş Bas') {
            await bot.sendMessage(chatId, 'Hangi tuşa basmak istersiniz?', getKeyMenu());
        } else if (text === 'Enter') {
            const result = await inputService.pressKey('enter');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Tab') {
            const result = await inputService.pressKey('tab');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Esc') {
            const result = await inputService.pressKey('esc');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Backspace') {
            const result = await inputService.pressKey('backspace');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Delete') {
            const result = await inputService.pressKey('delete');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Home') {
            const result = await inputService.pressKey('home');
            await bot.sendMessage(chatId, result);
        } else if (text === 'End') {
            const result = await inputService.pressKey('end');
            await bot.sendMessage(chatId, result);
        } else if (text === 'PageUp') {
            const result = await inputService.pressKey('pageup');
            await bot.sendMessage(chatId, result);
        } else if (text === 'PageDown') {
            const result = await inputService.pressKey('pagedown');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Up') {
            const result = await inputService.pressKey('up');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Down') {
            const result = await inputService.pressKey('down');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Left') {
            const result = await inputService.pressKey('left');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Right') {
            const result = await inputService.pressKey('right');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Tuş Kombinasyonu') {
            await bot.sendMessage(chatId, 'Hangi tuş kombinasyonunu kullanmak istersiniz?', getComboMenu());
        } else if (text === 'Ctrl+C') {
            const result = await inputService.pressKeyCombination('ctrl+c');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+V') {
            const result = await inputService.pressKeyCombination('ctrl+v');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+X') {
            const result = await inputService.pressKeyCombination('ctrl+x');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+A') {
            const result = await inputService.pressKeyCombination('ctrl+a');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+S') {
            const result = await inputService.pressKeyCombination('ctrl+s');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+Z') {
            const result = await inputService.pressKeyCombination('ctrl+z');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+Y') {
            const result = await inputService.pressKeyCombination('ctrl+y');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ctrl+F') {
            const result = await inputService.pressKeyCombination('ctrl+f');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Alt+Tab') {
            const result = await inputService.pressKeyCombination('alt+tab');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Alt+F4') {
            const result = await inputService.pressKeyCombination('alt+f4');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Win+D') {
            const result = await inputService.pressKeyCombination('win+d');
            await bot.sendMessage(chatId, result);
        } else if (text === 'Win+L') {
            const result = await inputService.pressKeyCombination('win+l');
            await bot.sendMessage(chatId, result);
        }

        // PANO YÖNETİMİ
        else if (text === 'Pano' || text === 'Pano Menü') {
            await bot.sendMessage(chatId, '*Pano Yönetimi*\n\nPanodaki metinleri okuyabilir, yazabilir ve geçmişi görebilirsiniz.', { parse_mode: 'Markdown', ...getClipboardMenu() });
        } else if (text === 'Panoyu Oku') {
            const result = await clipboardService.getClipboard();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Panoya Yaz') {
            stateManager.setState(chatId, 'awaitingClipboardText', true);
            await bot.sendMessage(chatId, 'Panoya yazmak istediğiniz metni girin:');
        } else if (text === 'Pano Geçmişi') {
            const result = clipboardService.getClipboardHistory();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Geçmişten Seç') {
            stateManager.setState(chatId, 'awaitingClipboardSelect', true);
            await bot.sendMessage(chatId, 'Geçmişten hangi numarayı seçmek istersiniz? (1-10)\n\nÖnce "Pano Geçmişi" ile listeyi görün.');
        } else if (text === 'Panoyu Temizle') {
            const result = await clipboardService.clearClipboard();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Geçmişi Temizle') {
            const result = clipboardService.clearClipboardHistory();
            await bot.sendMessage(chatId, result);
        } else if (text === 'İzleme Başlat') {
            const result = await clipboardService.startClipboardWatch();
            await bot.sendMessage(chatId, result);
        } else if (text === 'İzleme Durdur') {
            const result = clipboardService.stopClipboardWatch();
            await bot.sendMessage(chatId, result);
        }

        // SİSTEM İZLEME
        else if (text === 'İzleme') {
            await bot.sendMessage(chatId, '*Sistem Olayı İzleme*\n\nUSB, Pil, İnternet ve CPU değişikliklerini izleyebilirsiniz.', { parse_mode: 'Markdown', ...getMonitoringMenu() });
        } else if (text === 'USB İzleme') {
            await bot.sendMessage(chatId, '*USB Cihaz İzleme*\n\nUSB cihaz takılıp çıkarıldığında bildirim alırsınız.', { parse_mode: 'Markdown', ...getUSBMonitorMenu() });
        } else if (text === 'Pil İzleme') {
            await bot.sendMessage(chatId, '*Pil Seviyesi İzleme*\n\nPil seviyesi düştüğünde bildirim alırsınız.', { parse_mode: 'Markdown', ...getBatteryMonitorMenu() });
        } else if (text === 'İnternet İzleme') {
            await bot.sendMessage(chatId, '*İnternet Bağlantı İzleme*\n\nBağlantı kesilip geldiğinde bildirim alırsınız.', { parse_mode: 'Markdown', ...getNetworkMonitorMenu() });
        } else if (text === 'CPU İzleme') {
            await bot.sendMessage(chatId, '*CPU Kullanım İzleme*\n\nYüksek CPU kullanımında bildirim alırsınız.', { parse_mode: 'Markdown', ...getCPUMonitorMenu() });
        } else if (text === 'Başlat' && userState.awaitingWebsiteBlock === false) {
            // USB/Network başlat (context'e göre)
            const result = await monitoringService.startUSBMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            });
            await bot.sendMessage(chatId, result);
        } else if (text === 'Başlat (%20)') {
            const result = await monitoringService.startBatteryMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 20);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Başlat (%10)') {
            const result = await monitoringService.startBatteryMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 10);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Başlat (%90, 5dk)') {
            const result = await monitoringService.startCPUMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 90, 5);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Başlat (%80, 3dk)') {
            const result = await monitoringService.startCPUMonitoring((msg) => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            }, 80, 3);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Durdur') {
            // Context'e göre ilgili izlemeyi durdur
            const result = monitoringService.stopAllMonitoring();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Tümünü Başlat') {
            const result = await monitoringService.startAllMonitoring({
                onUSBChange: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }),
                onBatteryLow: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }),
                onNetworkChange: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }),
                onCPUHigh: (msg) => bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' })
            });
            await bot.sendMessage(chatId, result);
        } else if (text === 'Tümünü Durdur') {
            const result = monitoringService.stopAllMonitoring();
            await bot.sendMessage(chatId, result);
        } else if (text === 'İzleme Durumu') {
            const result = monitoringService.getMonitoringStatus();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        }

        // HIZLI İŞLEMLER (Distributed to individual menus)
        else if (text === 'Ekran Kapat') {
            const result = await quickActionsService.turnOffScreen();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Sesi Kapat') {
            const result = await quickActionsService.toggleMute();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ses %0') {
            const result = await quickActionsService.setVolume(0);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ses %50') {
            const result = await quickActionsService.setVolume(50);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Ses %100') {
            const result = await quickActionsService.setVolume(100);
            await bot.sendMessage(chatId, result);
        } else if (text === 'Özel Ses Seviyesi') {
            await bot.sendMessage(chatId, '*Özel Ses Seviyesi*\n\nİstediğiniz ses seviyesini girin (0-100):', { parse_mode: 'Markdown' });
            stateManager.setState(chatId, 'awaitingCustomVolume', true);
        } else if (text === 'Parlaklık') {
            await bot.sendMessage(chatId, '*Parlaklık Ayarı*\n\nİstediğiniz parlaklık seviyesini girin (0-100):', { parse_mode: 'Markdown' });
            stateManager.setState(chatId, 'awaitingBrightnessLevel', true);
        } else if (text === 'Webcam Kontrol') {
            const result = await quickActionsService.checkWebcamStatus();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Mikrofon Kontrol') {
            const result = await quickActionsService.checkMicrophoneStatus();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Son Dosyalar') {
            const result = await quickActionsService.getRecentFiles();
            // Result artık {message, useMarkdown} objesi döndürüyor
            if (result.useMarkdown === false) {
                await bot.sendMessage(chatId, result.message);
            } else {
                await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
            }
        } else if (text === 'WiFi Şifresi') {
            const result = await quickActionsService.getWiFiPassword();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Geri Dönüşüm Boşalt') {
            const result = await quickActionsService.emptyRecycleBin();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Masaüstü Göster') {
            const result = await quickActionsService.showDesktop();
            await bot.sendMessage(chatId, result);
        } else if (text === 'Panodaki Dosya') {
            const result = await quickActionsService.getClipboardFilePath();
            await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
        } else if (text === 'Bildirim Gönder') {
            await bot.sendMessage(chatId, '*Bildirim Gönder*\n\nGöndermek istediğiniz bildirimi yazın:', { parse_mode: 'Markdown' });
            stateManager.setState(chatId, 'awaitingNotificationMessage', true);
        }

        // Bilinmeyen komut
        else {
            await bot.sendMessage(chatId, 'Bilinmeyen komut. Lütfen menüden bir seçenek seçin.');
        }

    } catch (error) {
        logger.error(`Mesaj işleme hatası: ${error.message}`);
        await bot.sendMessage(chatId, 'Bir hata oluştu: ' + error.message);
    }
}

module.exports = {
    handleMessage
};
