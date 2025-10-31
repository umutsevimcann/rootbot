const path = require('path');
const fs = require('fs');
const { execPromise } = require('../utils/exec');
const si = require('systeminformation');

// FFmpeg static binary (garantili çalışır, install ile otomatik gelir)
let ffmpegPath;
try {
    ffmpegPath = require('ffmpeg-static');
    console.log('✅ FFmpeg static binary loaded:', ffmpegPath);
} catch (err) {
    console.log('⚠️ ffmpeg-static not found, using system ffmpeg');
    ffmpegPath = 'ffmpeg'; // Fallback to system ffmpeg
}

/**
 * Ekranları listele (multi-monitor desteği)
 */
async function getDisplays() {
    try {
        const graphics = await si.graphics();
        const displays = graphics.displays || [];

        // Aktif ekranları filtrele ve sırala
        const activeDisplays = displays
            .filter(d => d.connection && d.currentResX && d.currentResY)
            .sort((a, b) => {
                // Main ekranı önce getir
                if (a.main && !b.main) return -1;
                if (!a.main && b.main) return 1;
                // Sonra position'a göre sırala (soldan sağa)
                return (a.positionX || 0) - (b.positionX || 0);
            });

        return activeDisplays.map((display, index) => ({
            index: index,
            name: `Ekran ${index + 1}`,  // Simple names to avoid encoding issues
            main: display.main || false,
            width: display.currentResX,
            height: display.currentResY,
            positionX: display.positionX || 0,
            positionY: display.positionY || 0
        }));
    } catch (error) {
        console.error('Ekran listesi alınamadı:', error);
        // Fallback: Tek ekran varsay
        return [{
            index: 0,
            name: 'Ana Ekran',
            main: true,
            width: 1920,
            height: 1080,
            positionX: 0,
            positionY: 0
        }];
    }
}

/**
 * Ekran görüntüsü al (Multi-monitor desteği)
 * @param {Object} display - Ekran bilgisi (null = tüm ekranlar)
 * @param {Object} options - Ek seçenekler {autoDelete: bool}
 */
async function takeScreenshot(display = null, options = {}) {
    try {
        const screenshotPath = path.join(__dirname, '../../screenshots', `screenshot_${Date.now()}.png`);

        // Screenshots klasörü yoksa oluştur
        const dir = path.dirname(screenshotPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Path'leri normalize et (Windows backslash sorununu çöz)
        const ffmpeg = ffmpegPath.replace(/\\/g, '/');
        const output = screenshotPath.replace(/\\/g, '/');

        let cmd;
        if (display && display.index !== undefined) {
            // Belirli bir ekran
            cmd = `"${ffmpeg}" -f gdigrab -framerate 1 -offset_x ${display.positionX} -offset_y ${display.positionY} -video_size ${display.width}x${display.height} -i desktop -frames:v 1 -y "${output}"`;
        } else {
            // Tüm ekranlar
            cmd = `"${ffmpeg}" -f gdigrab -framerate 1 -i desktop -frames:v 1 -y "${output}"`;
        }

        await execPromise(cmd, { timeout: 5000, shell: true });

        // Otomatik silme ayarlanmışsa dosyayı işaret et
        if (options.autoDelete) {
            setTimeout(() => {
                if (fs.existsSync(screenshotPath)) {
                    fs.unlinkSync(screenshotPath);
                    console.log('🗑️ Screenshot temizlendi:', screenshotPath);
                }
            }, 10000); // 10 saniye sonra sil (Telegram'a gönderme zamanı)
        }

        return screenshotPath;
    } catch (error) {
        console.error('Ekran görüntüsü hatası:', error);
        throw new Error('Ekran görüntüsü alınamadı: ' + error.message);
    }
}

/**
 * Tüm ekranları ayrı ayrı screenshot al
 */
async function takeAllScreenshots(options = { autoDelete: true }) {
    try {
        const displays = await getDisplays();
        const screenshots = [];

        for (const display of displays) {
            const screenshotPath = await takeScreenshot(display, options);
            screenshots.push({
                display: display,  // Full display object for detailed info
                path: screenshotPath
            });
        }

        return screenshots;
    } catch (error) {
        console.error('Tüm ekran görüntüleri hatası:', error);
        throw new Error('Ekran görüntüleri alınamadı: ' + error.message);
    }
}

/**
 * Webcam fotoğraf çek
 */
async function takeWebcamPhoto(options = { autoDelete: true }) {
    try {
        // Webcam kontrolü
        const { stdout: webcamCheck } = await execPromise('powershell -Command "Get-PnpDevice | Where-Object { $_.Class -eq \'Camera\' -and $_.Status -eq \'OK\' }"');
        if (!webcamCheck || webcamCheck.trim().length === 0) {
            throw new Error('Webcam bulunamadı veya devre dışı. Lütfen kamera bağlantısını kontrol edin.');
        }

        const NodeWebcam = require('node-webcam');

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

        const photoPath = path.join(__dirname, '../../screenshots', `webcam_${Date.now()}.jpg`);
        const Webcam = NodeWebcam.create(opts);

        await new Promise((resolve, reject) => {
            Webcam.capture(photoPath, (err, data) => {
                if (err) reject(new Error('Webcam erişimi başarısız: ' + err.message));
                else resolve(data);
            });
        });

        // Otomatik silme ayarlanmışsa dosyayı işaret et
        if (options.autoDelete) {
            setTimeout(() => {
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                    console.log('🗑️ Webcam fotoğrafı temizlendi:', photoPath);
                }
            }, 10000); // 10 saniye sonra sil
        }

        return photoPath;
    } catch (error) {
        console.error('Webcam hatası:', error);
        throw new Error('Webcam fotoğrafı alınamadı: ' + error.message);
    }
}

/**
 * Ekran kaydı başlat (Yüksek Kalite + GPU Acceleration + Multi-Monitor)
 * OTOMATIK: Install ile FFmpeg hazır gelir, ekstra kurulum gereksiz!
 * @param {number} duration - Kayıt süresi (saniye)
 * @param {Object} display - Ekran bilgisi (null = tüm ekranlar)
 * @param {number} chatId - Telegram chat ID
 * @param {Object} bot - Telegram bot instance
 */
async function startScreenRecording(duration = 30, display = null, chatId = null, bot = null) {
    try {
        const recordingPath = path.join(__dirname, '../../recordings', `recording_${Date.now()}.mp4`);

        // Recordings klasörü yoksa oluştur
        const dir = path.dirname(recordingPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Asenkron olarak yüksek kaliteli kayıt yap
        (async () => {
            try {
                // GPU Acceleration denemesi (performans sırasına göre)
                // Path'leri normalize et (Windows backslash sorununu çöz)
                const ffmpeg = ffmpegPath.replace(/\\/g, '/');
                const output = recordingPath.replace(/\\/g, '/');

                // Display parametrelerini hazırla
                let displayParams = '';
                let displayInfo = 'Tüm Ekranlar';

                if (display && display.index !== undefined) {
                    displayParams = `-offset_x ${display.positionX} -offset_y ${display.positionY} -video_size ${display.width}x${display.height}`;
                    displayInfo = display.name;
                }

                const codecStrategies = [
                    {
                        name: 'NVIDIA GPU (NVENC)',
                        cmd: `"${ffmpeg}" -f gdigrab -framerate 60 ${displayParams} -i desktop -t ${duration} -c:v h264_nvenc -preset p4 -tune hq -rc vbr -cq 19 -b:v 8M -maxrate 12M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'AMD GPU (AMF)',
                        cmd: `"${ffmpeg}" -f gdigrab -framerate 60 ${displayParams} -i desktop -t ${duration} -c:v h264_amf -quality quality -rc vbr_peak -qp_i 18 -qp_p 20 -b:v 8M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'Intel QuickSync',
                        cmd: `"${ffmpeg}" -f gdigrab -framerate 60 ${displayParams} -i desktop -t ${duration} -c:v h264_qsv -preset medium -global_quality 20 -b:v 8M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'CPU High Quality',
                        cmd: `"${ffmpeg}" -f gdigrab -framerate 30 ${displayParams} -i desktop -t ${duration} -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'CPU Fast (Fallback)',
                        cmd: `"${ffmpeg}" -f gdigrab -framerate 30 ${displayParams} -i desktop -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -y "${output}"`
                    }
                ];

                let recordingSuccess = false;
                let usedCodec = 'Unknown';

                // Her codec'i sırayla dene
                for (const strategy of codecStrategies) {
                    try {
                        console.log(`🎬 Deneniyor: ${strategy.name}...`);

                        await execPromise(strategy.cmd, {
                            timeout: (duration + 15) * 1000,
                            shell: true
                        });

                        // Başarılı!
                        recordingSuccess = true;
                        usedCodec = strategy.name;
                        console.log(`✅ Başarılı: ${strategy.name}`);
                        break;
                    } catch (codecError) {
                        // Bu codec çalışmadı, sonrakini dene
                        console.log(`❌ ${strategy.name} başarısız, sonrakine geçiliyor...`);
                        continue;
                    }
                }

                if (!recordingSuccess) {
                    throw new Error('Hiçbir codec çalışmadı. FFmpeg yapılandırması kontrol edin.');
                }

                // Video dosyasını gönder
                if (bot && chatId) {
                    if (!fs.existsSync(recordingPath)) {
                        await bot.sendMessage(chatId, '❌ Ekran kaydı dosyası oluşturulamadı.');
                        return;
                    }

                    const stats = fs.statSync(recordingPath);
                    const fileSizeMB = stats.size / (1024 * 1024);

                    if (fileSizeMB > 50) {
                        await bot.sendMessage(chatId,
                            `*⚠️ Video Çok Büyük*\n\n` +
                            `📊 Boyut: ${fileSizeMB.toFixed(2)} MB\n` +
                            `⚡ Codec: ${usedCodec}\n` +
                            `📱 Telegram limiti: 50 MB\n\n` +
                            `💡 Daha kısa süre deneyin veya dosyayı manuel gönderin:\n\`${recordingPath}\``,
                            { parse_mode: 'Markdown' }
                        );
                    } else {
                        await bot.sendVideo(chatId, recordingPath, {
                            caption: `🎥 Ekran Kaydı\n📺 Ekran: ${displayInfo}\n⏱️ Süre: ${duration}s\n💾 Boyut: ${fileSizeMB.toFixed(2)} MB\n⚡ Codec: ${usedCodec}`,
                            supports_streaming: true
                        });

                        // Başarılı gönderimden sonra dosyayı sil (disk tasarrufu)
                        setTimeout(() => {
                            if (fs.existsSync(recordingPath)) {
                                fs.unlinkSync(recordingPath);
                                console.log('🗑️ Kayıt dosyası temizlendi:', recordingPath);
                            }
                        }, 5000);
                    }
                }
            } catch (err) {
                console.error('❌ Kayıt işleme hatası:', err);
                if (bot && chatId) {
                    await bot.sendMessage(chatId,
                        `❌ Ekran kaydı oluşturulamadı\n\n` +
                        `Hata: ${err.message}\n\n` +
                        `💡 FFmpeg sorunları için:\n` +
                        `• Botun yeniden başlatılması\n` +
                        `• \`npm install\` çalıştırılması\n` +
                        `gerekebilir.`
                    );
                }
            }
        })();

        return {
            path: recordingPath,
            duration: duration
        };
    } catch (error) {
        console.error('❌ Ekran kaydı hatası:', error);
        throw new Error('Ekran kaydı başlatılamadı: ' + error.message);
    }
}

/**
 * Webcam video kaydı başlat (Yüksek Kalite + GPU Acceleration)
 * OTOMATIK: Install ile FFmpeg hazır gelir, ekstra kurulum gereksiz!
 */
async function startWebcamRecording(duration = 10, chatId = null, bot = null) {
    try {
        // Webcam kontrolü
        const { stdout: webcamCheck } = await execPromise('powershell -Command "Get-PnpDevice | Where-Object { $_.Class -eq \'Camera\' -and $_.Status -eq \'OK\' }"', { timeout: 5000 });
        if (!webcamCheck || webcamCheck.trim().length === 0) {
            throw new Error('Webcam bulunamadı veya devre dışı. Lütfen kamera bağlantısını kontrol edin.');
        }

        const recordingPath = path.join(__dirname, '../../recordings', `webcam_${Date.now()}.mp4`);

        // Recordings klasörü yoksa oluştur
        const dir = path.dirname(recordingPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Asenkron olarak yüksek kaliteli webcam kaydı yap
        (async () => {
            try {
                // Webcam cihaz adını bul
                let videoDevice = 'Integrated Camera'; // Default

                // Path'leri normalize et (Windows backslash sorununu çöz)
                const ffmpeg = ffmpegPath.replace(/\\/g, '/');
                const output = recordingPath.replace(/\\/g, '/');

                try {
                    const { stdout: devicesOutput } = await execPromise(`"${ffmpeg}" -list_devices true -f dshow -i dummy`, { timeout: 5000 }).catch(e => ({ stdout: e.message }));

                    // Video cihazını bul
                    const videoDeviceMatch = devicesOutput.match(/"([^"]*camera[^"]*)"/i) ||
                                           devicesOutput.match(/"([^"]*webcam[^"]*)"/i) ||
                                           devicesOutput.match(/"([^"]*video[^"]*)"/i);

                    if (videoDeviceMatch) {
                        videoDevice = videoDeviceMatch[1];
                        console.log(`📹 Webcam bulundu: ${videoDevice}`);
                    }
                } catch (deviceError) {
                    console.log('⚠️ Cihaz listesi alınamadı, default kullanılıyor');
                }

                // GPU Acceleration ile webcam kayıt stratejileri
                const codecStrategies = [
                    {
                        name: 'NVIDIA GPU (NVENC)',
                        cmd: `"${ffmpeg}" -f dshow -video_size 1920x1080 -framerate 30 -i video="${videoDevice}" -t ${duration} -c:v h264_nvenc -preset p4 -tune hq -rc vbr -cq 19 -b:v 5M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'AMD GPU (AMF)',
                        cmd: `"${ffmpeg}" -f dshow -video_size 1920x1080 -framerate 30 -i video="${videoDevice}" -t ${duration} -c:v h264_amf -quality quality -rc vbr_peak -qp_i 18 -qp_p 20 -b:v 5M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'Intel QuickSync',
                        cmd: `"${ffmpeg}" -f dshow -video_size 1920x1080 -framerate 30 -i video="${videoDevice}" -t ${duration} -c:v h264_qsv -preset medium -global_quality 20 -b:v 5M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'CPU High Quality (720p)',
                        cmd: `"${ffmpeg}" -f dshow -video_size 1280x720 -framerate 30 -i video="${videoDevice}" -t ${duration} -c:v libx264 -preset medium -crf 18 -b:v 4M -pix_fmt yuv420p -y "${output}"`
                    },
                    {
                        name: 'CPU Fast (480p)',
                        cmd: `"${ffmpeg}" -f dshow -video_size 640x480 -framerate 30 -i video="${videoDevice}" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -y "${output}"`
                    }
                ];

                let recordingSuccess = false;
                let usedCodec = 'Unknown';
                let usedResolution = 'Unknown';

                // Her codec'i sırayla dene
                for (const strategy of codecStrategies) {
                    try {
                        console.log(`📹 Deneniyor: ${strategy.name}...`);

                        await execPromise(strategy.cmd, {
                            timeout: (duration + 15) * 1000,
                            shell: true
                        });

                        // Başarılı!
                        recordingSuccess = true;
                        usedCodec = strategy.name;

                        // Çözünürlüğü tespit et
                        if (strategy.cmd.includes('1920x1080')) usedResolution = '1080p';
                        else if (strategy.cmd.includes('1280x720')) usedResolution = '720p';
                        else usedResolution = '480p';

                        console.log(`✅ Webcam kaydı başarılı: ${strategy.name}`);
                        break;
                    } catch (codecError) {
                        console.log(`❌ ${strategy.name} başarısız, sonrakine geçiliyor...`);
                        continue;
                    }
                }

                if (!recordingSuccess) {
                    throw new Error('Webcam kaydı yapılamadı. Tüm codec\'ler başarısız oldu.');
                }

                // Video dosyasını gönder
                if (bot && chatId) {
                    if (!fs.existsSync(recordingPath)) {
                        await bot.sendMessage(chatId, '❌ Webcam kaydı dosyası oluşturulamadı.');
                        return;
                    }

                    const stats = fs.statSync(recordingPath);
                    const fileSizeMB = stats.size / (1024 * 1024);

                    if (fileSizeMB > 50) {
                        await bot.sendMessage(chatId,
                            `*⚠️ Video Çok Büyük*\n\n` +
                            `📊 Boyut: ${fileSizeMB.toFixed(2)} MB\n` +
                            `📹 Çözünürlük: ${usedResolution}\n` +
                            `⚡ Codec: ${usedCodec}\n` +
                            `📱 Telegram limiti: 50 MB\n\n` +
                            `💡 Daha kısa süre deneyin.`,
                            { parse_mode: 'Markdown' }
                        );
                    } else {
                        await bot.sendVideo(chatId, recordingPath, {
                            caption: `📹 Webcam Kaydı\n⏱️ Süre: ${duration}s\n💾 Boyut: ${fileSizeMB.toFixed(2)} MB\n📺 Çözünürlük: ${usedResolution}\n⚡ Codec: ${usedCodec}`,
                            supports_streaming: true
                        });

                        // Başarılı gönderimden sonra dosyayı sil (disk tasarrufu)
                        setTimeout(() => {
                            if (fs.existsSync(recordingPath)) {
                                fs.unlinkSync(recordingPath);
                                console.log('🗑️ Webcam kaydı temizlendi:', recordingPath);
                            }
                        }, 5000);
                    }
                }
            } catch (err) {
                console.error('❌ Webcam kayıt hatası:', err);
                if (bot && chatId) {
                    await bot.sendMessage(chatId,
                        `❌ Webcam kaydı oluşturulamadı\n\n` +
                        `Hata: ${err.message}\n\n` +
                        `💡 Kontrol edin:\n` +
                        `• Webcam takılı ve çalışıyor mu?\n` +
                        `• Başka uygulama webcam kullanıyor mu?\n` +
                        `• Windows kamera izinleri verildi mi?`
                    );
                }
            }
        })();

        return {
            path: recordingPath,
            duration: duration
        };
    } catch (error) {
        console.error('❌ Webcam kaydı hatası:', error);
        throw new Error('Webcam kaydı başlatılamadı: ' + error.message);
    }
}

module.exports = {
    getDisplays,
    takeScreenshot,
    takeAllScreenshots,
    takeWebcamPhoto,
    startScreenRecording,
    startWebcamRecording
};
