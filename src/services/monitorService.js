const screenshot = require('screenshot-desktop');
const path = require('path');
const fs = require('fs');
const { execPromise } = require('../utils/exec');

/**
 * Ekran görüntüsü al
 */
async function takeScreenshot() {
    try {
        const screenshotPath = path.join(__dirname, '../../screenshots', `screenshot_${Date.now()}.png`);

        // Screenshots klasörü yoksa oluştur
        const dir = path.dirname(screenshotPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await screenshot({ filename: screenshotPath });
        return screenshotPath;
    } catch (error) {
        console.error('Ekran görüntüsü hatası:', error);
        throw new Error('Ekran görüntüsü alınamadı: ' + error.message);
    }
}

/**
 * Webcam fotoğraf çek
 */
async function takeWebcamPhoto() {
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

        return photoPath;
    } catch (error) {
        console.error('Webcam hatası:', error);
        throw new Error('Webcam fotoğrafı alınamadı: ' + error.message);
    }
}

/**
 * Ekran kaydı başlat (FFmpeg ile gerçek zamanlı kayıt)
 */
async function startScreenRecording(duration = 30, chatId = null, bot = null) {
    try {
        // FFmpeg kontrolü
        try {
            await execPromise('ffmpeg -version', { timeout: 3000 });
        } catch (ffmpegError) {
            const errorMsg = '❌ FFmpeg bulunamadı! Ekran kaydı için FFmpeg kurulu olmalı.\n\nKurmak için: https://ffmpeg.org/download.html';
            if (bot && chatId) {
                await bot.sendMessage(chatId, errorMsg);
            }
            throw new Error(errorMsg);
        }

        const recordingPath = path.join(__dirname, '../../recordings', `recording_${Date.now()}.mp4`);

        // Recordings klasörü yoksa oluştur
        const dir = path.dirname(recordingPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Asenkron olarak gerçek zamanlı FFmpeg kaydı yap
        (async () => {
            try {
                // FFmpeg ile doğrudan ekran kaydı al
                // Önce gdigrab dene (yeni FFmpeg), sonra dshow fallback (eski FFmpeg)
                let ffmpegCmd = `ffmpeg -f gdigrab -framerate 30 -i desktop -t ${duration} -c:v libx264 -preset ultrafast -pix_fmt yuv420p -y "${recordingPath}"`;

                try {
                    await execPromise(ffmpegCmd, { timeout: (duration + 15) * 1000 });
                } catch (gdigrabError) {
                    // gdigrab desteklenmiyor, PowerShell fallback kullan
                    const errorMsg = gdigrabError.message || gdigrabError.toString();
                    if (errorMsg.includes('Unknown input format') || errorMsg.includes('gdigrab')) {
                        console.log('gdigrab desteklenmiyor, PowerShell ile ekran kaydı yapılıyor...');

                        if (bot && chatId) {
                            await bot.sendMessage(chatId, '⚠️ Modern FFmpeg algılanmadı. PowerShell ile kayıt yapılıyor (10 FPS)...');
                        }

                        // PowerShell ile ekran görüntüleri al ve FFmpeg ile birleştir
                        const outputBase = recordingPath.replace('.mp4', '');
                        const psCommand = `powershell -Command "$duration = ${duration}; $fps = 10; $interval = [math]::Round(1000/$fps); for($i=0; $i -lt ($duration*$fps); $i++) { Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height; $graphics = [System.Drawing.Graphics]::FromImage($bmp); $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $bmp.Size); $bmp.Save('${outputBase.replace(/\\/g, '\\\\')}' + '_' + $i + '.png'); $graphics.Dispose(); $bmp.Dispose(); Start-Sleep -Milliseconds $interval }"`;

                        await execPromise(psCommand, { timeout: (duration + 15) * 1000 });

                        // FFmpeg ile resimleri videoya çevir
                        const ffmpegConvertCmd = `ffmpeg -y -framerate 10 -i "${outputBase}_%d.png" -c:v libx264 -pix_fmt yuv420p "${recordingPath}"`;
                        await execPromise(ffmpegConvertCmd, { timeout: 60000 });

                        // PNG dosyalarını sil
                        for (let i = 0; i < duration * 10; i++) {
                            const pngPath = `${outputBase}_${i}.png`;
                            if (require('fs').existsSync(pngPath)) {
                                require('fs').unlinkSync(pngPath);
                            }
                        }
                    } else {
                        throw gdigrabError;
                    }
                }

                // Video dosyasını gönder (boyut kontrolü ile)
                if (bot && chatId) {
                    if (!fs.existsSync(recordingPath)) {
                        await bot.sendMessage(chatId, '❌ Ekran kaydı dosyası oluşturulamadı.');
                        return;
                    }

                    const stats = fs.statSync(recordingPath);
                    const fileSizeMB = stats.size / (1024 * 1024);

                    if (fileSizeMB > 50) {
                        await bot.sendMessage(chatId, `❌ *Video Çok Büyük*\n\nDosya boyutu: ${fileSizeMB.toFixed(2)} MB\nTelegram limiti: 50 MB\n\nDaha kısa süre deneyin veya dosyayı manuel olarak gönderin:\n\`${recordingPath}\``, { parse_mode: 'Markdown' });
                    } else {
                        await bot.sendVideo(chatId, recordingPath, { caption: `🎥 ${duration} saniyelik ekran kaydı (${fileSizeMB.toFixed(2)} MB)` });
                    }
                }
            } catch (err) {
                console.error('Kayıt işleme hatası:', err);
                if (bot && chatId) {
                    await bot.sendMessage(chatId, '❌ Ekran kaydı oluşturulamadı: ' + err.message);
                }
            }
        })();

        return {
            path: recordingPath,
            duration: duration
        };
    } catch (error) {
        console.error('Ekran kaydı hatası:', error);
        throw new Error('Ekran kaydı başlatılamadı: ' + error.message);
    }
}

/**
 * Webcam video kaydı başlat (FFmpeg ile gerçek zamanlı kayıt)
 */
async function startWebcamRecording(duration = 10, chatId = null, bot = null) {
    try {
        // FFmpeg kontrolü
        try {
            await execPromise('ffmpeg -version', { timeout: 3000 });
        } catch (ffmpegError) {
            const errorMsg = '❌ FFmpeg bulunamadı! Webcam kaydı için FFmpeg kurulu olmalı.\n\nKurmak için: https://ffmpeg.org/download.html';
            if (bot && chatId) {
                await bot.sendMessage(chatId, errorMsg);
            }
            throw new Error(errorMsg);
        }

        // Webcam kontrolü
        const { stdout: webcamCheck } = await execPromise('powershell -Command "Get-PnpDevice | Where-Object { $_.Class -eq \'Camera\' -and $_.Status -eq \'OK\' }"');
        if (!webcamCheck || webcamCheck.trim().length === 0) {
            throw new Error('Webcam bulunamadı veya devre dışı. Lütfen kamera bağlantısını kontrol edin.');
        }

        const recordingPath = path.join(__dirname, '../../recordings', `webcam_${Date.now()}.mp4`);

        // Recordings klasörü yoksa oluştur
        const dir = path.dirname(recordingPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Asenkron olarak gerçek zamanlı FFmpeg webcam kaydı yap
        (async () => {
            try {
                // FFmpeg DirectShow desteği kontrol et
                let useFallback = false;

                try {
                    // DirectShow ile webcam cihaz adını al
                    const { stdout: devicesOutput } = await execPromise('ffmpeg -list_devices true -f dshow -i dummy', { timeout: 5000 }).catch(e => ({ stdout: e.message }));

                    // Video cihazını bul (genellikle "Integrated Camera" veya benzeri)
                    const videoDeviceMatch = devicesOutput.match(/"([^"]*camera[^"]*)"/i) || devicesOutput.match(/"([^"]*webcam[^"]*)"/i);
                    const videoDevice = videoDeviceMatch ? videoDeviceMatch[1] : 'Integrated Camera';

                    // FFmpeg ile doğrudan webcam kaydı al (dshow - DirectShow)
                    const ffmpegCmd = `ffmpeg -f dshow -framerate 30 -i video="${videoDevice}" -t ${duration} -c:v libx264 -preset ultrafast -pix_fmt yuv420p -y "${recordingPath}"`;

                    await execPromise(ffmpegCmd, { timeout: (duration + 15) * 1000 });
                } catch (dshowError) {
                    // DirectShow desteklenmiyor veya hata var, node-webcam fallback kullan
                    console.log('FFmpeg DirectShow hatası, node-webcam kullanılıyor...');
                    useFallback = true;

                    const NodeWebcam = require('node-webcam');
                    const outputBase = recordingPath.replace('.mp4', '');

                    // Her 100ms'de webcam fotoğrafı çek (10 FPS)
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
                    const fps = 10;
                    const totalFrames = duration * fps;

                    for (let i = 0; i < totalFrames; i++) {
                        const photoPath = `${outputBase}_${i}.jpg`;
                        await new Promise((resolve, reject) => {
                            Webcam.capture(photoPath, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms = 10 FPS
                    }

                    // FFmpeg ile resimleri videoya çevir
                    const ffmpegConvertCmd = `ffmpeg -y -framerate ${fps} -i "${outputBase}_%d.jpg" -c:v libx264 -pix_fmt yuv420p "${recordingPath}"`;
                    await execPromise(ffmpegConvertCmd, { timeout: 60000 });

                    // JPG dosyalarını sil
                    for (let i = 0; i < totalFrames; i++) {
                        const jpgPath = `${outputBase}_${i}.jpg`;
                        if (fs.existsSync(jpgPath)) {
                            fs.unlinkSync(jpgPath);
                        }
                    }
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
                        await bot.sendMessage(chatId, `❌ *Video Çok Büyük*\n\nDosya boyutu: ${fileSizeMB.toFixed(2)} MB\nTelegram limiti: 50 MB\n\nDaha kısa süre deneyin.`, { parse_mode: 'Markdown' });
                    } else {
                        await bot.sendVideo(chatId, recordingPath, { caption: `🎬 ${duration} saniyelik webcam kaydı (${fileSizeMB.toFixed(2)} MB)` });
                    }
                }
            } catch (err) {
                console.error('Webcam kayıt hatası:', err);
                if (bot && chatId) {
                    await bot.sendMessage(chatId, '❌ Webcam kaydı oluşturulamadı: ' + err.message);
                }
            }
        })();

        return {
            path: recordingPath,
            duration: duration
        };
    } catch (error) {
        console.error('Webcam kaydı hatası:', error);
        throw new Error('Webcam kaydı başlatılamadı: ' + error.message);
    }
}

module.exports = {
    takeScreenshot,
    takeWebcamPhoto,
    startScreenRecording,
    startWebcamRecording
};
