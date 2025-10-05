const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execPromise } = require('../utils/exec');

// Varsayılan indirme klasörü
const DOWNLOAD_FOLDER = path.join(__dirname, '../../downloads');

// Klasörü oluştur
if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER, { recursive: true });
}

/**
 * Dosya listele
 */
async function listFiles(directory = 'C:\\Users') {
    try {
        const { stdout } = await execPromise(`dir "${directory}" /B /A-D`, { timeout: 10000 });

        if (!stdout || stdout.trim() === '') {
            return '📂 Klasör boş veya dosya bulunamadı.';
        }

        const files = stdout.split('\n').filter(f => f.trim()).slice(0, 50);
        let message = `📁 *Dosyalar (${directory})*\n\n`;

        files.forEach((file, index) => {
            message += `${index + 1}. ${file.trim()}\n`;
        });

        if (files.length >= 50) {
            message += '\n⚠️ İlk 50 dosya gösteriliyor.';
        }

        return message;
    } catch (error) {
        return '❌ Dosya listesi alınamadı: ' + error.message;
    }
}

/**
 * Klasör listele
 */
async function listDirectories(directory = 'C:\\Users') {
    try {
        const { stdout } = await execPromise(`dir "${directory}" /B /AD`, { timeout: 10000 });

        if (!stdout || stdout.trim() === '') {
            return '📂 Alt klasör bulunamadı.';
        }

        const dirs = stdout.split('\n').filter(d => d.trim()).slice(0, 50);
        let message = `📂 *Klasörler (${directory})*\n\n`;

        dirs.forEach((dir, index) => {
            message += `${index + 1}. 📁 ${dir.trim()}\n`;
        });

        if (dirs.length >= 50) {
            message += '\n⚠️ İlk 50 klasör gösteriliyor.';
        }

        return message;
    } catch (error) {
        return '❌ Klasör listesi alınamadı: ' + error.message;
    }
}

/**
 * Dosya oku (text dosyaları için)
 */
async function readFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return '❌ Dosya bulunamadı.';
        }

        const stats = fs.statSync(filePath);

        if (stats.size > 1024 * 1024) { // 1MB'dan büyükse
            return '❌ Dosya çok büyük (max 1MB).';
        }

        const content = fs.readFileSync(filePath, 'utf8');
        return `📄 *${path.basename(filePath)}*\n\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``;
    } catch (error) {
        return '❌ Dosya okunamadı: ' + error.message;
    }
}

/**
 * Dosya oluştur
 */
async function createFile(filePath, content = '') {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return `✅ Dosya oluşturuldu: ${filePath}`;
    } catch (error) {
        return '❌ Dosya oluşturulamadı: ' + error.message;
    }
}

/**
 * Dosya sil
 */
async function deleteFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return '❌ Dosya bulunamadı.';
        }

        fs.unlinkSync(filePath);
        return `✅ Dosya silindi: ${filePath}`;
    } catch (error) {
        return '❌ Dosya silinemedi: ' + error.message;
    }
}

/**
 * Dosya bilgisi al
 */
async function getFileInfo(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return '❌ Dosya bulunamadı.';
        }

        const stats = fs.statSync(filePath);

        let message = `📄 *Dosya Bilgisi*\n\n`;
        message += `*Dosya:* ${path.basename(filePath)}\n`;
        message += `*Boyut:* ${(stats.size / 1024).toFixed(2)} KB\n`;
        message += `*Oluşturulma:* ${stats.birthtime.toLocaleString('tr-TR')}\n`;
        message += `*Değiştirilme:* ${stats.mtime.toLocaleString('tr-TR')}\n`;
        message += `*Erişim:* ${stats.atime.toLocaleString('tr-TR')}\n`;

        return message;
    } catch (error) {
        return '❌ Dosya bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Dosya ara
 */
async function searchFiles(directory, pattern) {
    try {
        const { stdout } = await execPromise(`dir "${directory}\\${pattern}" /B /S`, { timeout: 30000 });

        if (!stdout || stdout.trim() === '') {
            return '🔍 Eşleşen dosya bulunamadı.';
        }

        const files = stdout.split('\n').filter(f => f.trim()).slice(0, 30);
        let message = `🔍 *Arama Sonuçları (${pattern})*\n\n`;

        files.forEach((file, index) => {
            message += `${index + 1}. ${file.trim()}\n`;
        });

        if (files.length >= 30) {
            message += '\n⚠️ İlk 30 sonuç gösteriliyor.';
        }

        return message;
    } catch (error) {
        return '❌ Dosya araması başarısız: ' + error.message;
    }
}

/**
 * Telegram dosyasını indir
 */
async function downloadTelegramFile(bot, fileId, fileName, chatId) {
    try {
        // Dosya bilgisini al
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

        // Dosya yolunu oluştur
        const filePath = path.join(DOWNLOAD_FOLDER, fileName);

        // Dosyayı indir
        await downloadFile(fileUrl, filePath);

        return {
            success: true,
            message: `✅ *Dosya İndirildi*\n\nDosya: \`${fileName}\`\nBoyut: ${(file.file_size / 1024).toFixed(2)} KB\nKonum: \`${filePath}\``,
            filePath: filePath
        };
    } catch (error) {
        return {
            success: false,
            message: '❌ Dosya indirilemedi: ' + error.message
        };
    }
}

/**
 * HTTP/HTTPS dosya indirme yardımcı fonksiyonu
 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

/**
 * Dosya gönder (PC'den Telegram'a) - Boyut kontrolü ile
 */
async function sendFileToTelegram(bot, chatId, filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return '❌ Dosya bulunamadı: ' + filePath;
        }

        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);

        // Telegram limit kontrolü (50MB)
        if (fileSizeMB > 50) {
            return `❌ *Dosya Çok Büyük*\n\nDosya boyutu: ${fileSizeMB.toFixed(2)} MB\nTelegram limiti: 50 MB\n\nDaha küçük bir dosya gönderin.`;
        }

        await bot.sendDocument(chatId, filePath);
        return `✅ Dosya gönderildi: ${path.basename(filePath)}`;
    } catch (error) {
        return '❌ Dosya gönderilemedi: ' + error.message;
    }
}

/**
 * İndirme klasörünü aç
 */
async function openDownloadFolder() {
    try {
        await execPromise(`explorer "${DOWNLOAD_FOLDER}"`);
        return `📁 İndirme klasörü açıldı: ${DOWNLOAD_FOLDER}`;
    } catch (error) {
        return '❌ Klasör açılamadı: ' + error.message;
    }
}

module.exports = {
    listFiles,
    listDirectories,
    readFile,
    createFile,
    deleteFile,
    getFileInfo,
    searchFiles,
    downloadTelegramFile,
    sendFileToTelegram,
    openDownloadFolder,
    DOWNLOAD_FOLDER
};
