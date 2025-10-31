const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const os = require('os');
const { execPromise } = require('../utils/exec');
const { validatePath } = require('../utils/pathValidator');

// Varsayılan indirme klasörü
const DOWNLOAD_FOLDER = path.join(__dirname, '../../downloads');

// Klasörü oluştur
if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER, { recursive: true });
}

/**
 * Hızlı erişim klasörlerini getir
 */
function getQuickFolders() {
    const userProfile = process.env.USERPROFILE || process.env.HOME;

    const folders = {
        'Masaüstü': path.join(userProfile, 'Desktop'),
        'Belgelerim': path.join(userProfile, 'Documents'),
        'İndirilenler': path.join(userProfile, 'Downloads'),
        'Resimler': path.join(userProfile, 'Pictures'),
        'Müzik': path.join(userProfile, 'Music'),
        'Videolarım': path.join(userProfile, 'Videos'),
        'Bu Bilgisayar': userProfile
    };

    // Dinamik olarak tüm disk sürücülerini tespit et
    // A'dan Z'ye tüm harfleri kontrol et
    for (let i = 65; i <= 90; i++) { // A=65, Z=90
        const letter = String.fromCharCode(i);
        const drivePath = `${letter}:\\`;

        // Disk var mı kontrol et
        try {
            if (fs.existsSync(drivePath)) {
                folders[`${letter} Diski`] = drivePath;
            }
        } catch (error) {
            // Erişim hatası - devam et
            continue;
        }
    }

    // Sadece var olan klasörleri döndür
    const availableFolders = {};
    for (const [name, folderPath] of Object.entries(folders)) {
        if (fs.existsSync(folderPath)) {
            availableFolders[name] = folderPath;
        }
    }

    return availableFolders;
}

/**
 * Markdown karakterlerini escape et
 */
function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Klasör içeriğini listele (dosya + klasör birlikte, akıllı)
 */
async function listFolderContents(directory) {
    try {
        // CRITICAL: Validate path to prevent traversal (VULN-004)
        const safePath = validatePath(directory);

        if (!fs.existsSync(safePath)) {
            return { success: false, message: 'Klasör bulunamadı.' };
        }

        const items = await fs.promises.readdir(safePath, { withFileTypes: true });

        const folders = [];
        const files = [];

        for (const item of items) {
            try {
                const fullPath = path.join(safePath, item.name);
                const stats = await fs.promises.stat(fullPath);

                if (item.isDirectory()) {
                    folders.push({
                        type: 'folder',
                        name: item.name,
                        path: fullPath
                    });
                } else {
                    files.push({
                        type: 'file',
                        name: item.name,
                        path: fullPath,
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            } catch (err) {
                // Skip files/folders we can't access
                continue;
            }
        }

        // Sort: folders first, then files, alphabetically
        folders.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));

        // Limit results
        const limitedFolders = folders.slice(0, 20);
        const limitedFiles = files.slice(0, 30);

        // Escape folder name for markdown
        const folderName = escapeMarkdown(path.basename(safePath));
        let message = `*${folderName}*\n\n`;

        // Add parent directory option
        if (safePath !== path.parse(safePath).root) {
            message += `0\\. \\.\\./ \\(Yukarı\\)\n\n`;
        }

        // List folders
        if (limitedFolders.length > 0) {
            message += `*Klasörler:*\n`;
            limitedFolders.forEach((folder, index) => {
                const escapedName = escapeMarkdown(folder.name);
                message += `${index + 1}\\. ${escapedName}/\n`;
            });
            message += '\n';
        }

        // List files
        if (limitedFiles.length > 0) {
            message += `*Dosyalar:*\n`;
            const startIndex = limitedFolders.length + 1;
            limitedFiles.forEach((file, index) => {
                const escapedName = escapeMarkdown(file.name);
                const sizeKB = (file.size / 1024).toFixed(1);
                message += `${startIndex + index}\\. ${escapedName} \\(${sizeKB} KB\\)\n`;
            });
        }

        if (folders.length === 0 && files.length === 0) {
            message += 'Klasör boş\\.';
        }

        return {
            success: true,
            message: message,
            currentPath: safePath,
            folders: limitedFolders,
            files: limitedFiles,
            totalFolders: folders.length,
            totalFiles: files.length
        };
    } catch (error) {
        return { success: false, message: 'Klasör içeriği listelenemedi: ' + error.message };
    }
}

/**
 * Numara ile dosya/klasör seç
 */
function selectItemByNumber(number, folders, files) {
    const totalFolders = folders.length;

    if (number === 0) {
        return { type: 'parent', name: '../' };
    }

    if (number <= totalFolders) {
        // Klasör seçildi
        return folders[number - 1];
    } else {
        // Dosya seçildi
        const fileIndex = number - totalFolders - 1;
        if (fileIndex < files.length) {
            return files[fileIndex];
        }
    }

    return null;
}

/**
 * Son kullanılan dosyaları getir
 */
async function getRecentFiles(limit = 20) {
    try {
        const userProfile = process.env.USERPROFILE || process.env.HOME;
        const recentPath = path.join(userProfile, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent');

        if (!fs.existsSync(recentPath)) {
            return { success: false, message: 'Son kullanılanlar klasörü bulunamadı.' };
        }

        const items = await fs.promises.readdir(recentPath);
        const recentFiles = [];

        for (const item of items) {
            try {
                const fullPath = path.join(recentPath, item);
                const stats = await fs.promises.stat(fullPath);

                if (item.endsWith('.lnk')) {
                    recentFiles.push({
                        name: item.replace('.lnk', ''),
                        path: fullPath,
                        modified: stats.mtime
                    });
                }
            } catch (err) {
                continue;
            }
        }

        // Sort by most recent
        recentFiles.sort((a, b) => b.modified - a.modified);
        const limited = recentFiles.slice(0, limit);

        let message = `*Son Kullanılan Dosyalar*\n\n`;
        limited.forEach((file, index) => {
            message += `${index + 1}. ${escapeMarkdown(file.name)}\n`;
        });

        return {
            success: true,
            message: message,
            files: limited
        };
    } catch (error) {
        return { success: false, message: 'Son kullanılan dosyalar alınamadı: ' + error.message };
    }
}

/**
 * Dosya listele (eski fonksiyon - geriye uyumluluk için)
 */
async function listFiles(directory = 'C:\\Users') {
    const result = await listFolderContents(directory);
    return result.message || result.message;
}

/**
 * Klasör listele
 */
async function listDirectories(directory = 'C:\\Users') {
    try {
        // CRITICAL: Validate path to prevent traversal (VULN-004)
        const safePath = validatePath(directory);

        const { stdout } = await execPromise(`dir "${safePath}" /B /AD`, { timeout: 10000 });

        if (!stdout || stdout.trim() === '') {
            return 'Alt klasör bulunamadı.';
        }

        const dirs = stdout.split('\n').filter(d => d.trim()).slice(0, 50);
        let message = `*Klasörler (${directory})*\n\n`;

        dirs.forEach((dir, index) => {
            message += `${index + 1}. ${dir.trim()}\n`;
        });

        if (dirs.length >= 50) {
            message += '\nİlk 50 klasör gösteriliyor.';
        }

        return message;
    } catch (error) {
        return 'Klasör listesi alınamadı: ' + error.message;
    }
}

/**
 * Dosya oku (text dosyaları için)
 */
async function readFile(filePath) {
    try {
        // CRITICAL: Validate path to prevent traversal (VULN-004)
        const safePath = validatePath(filePath);

        if (!fs.existsSync(safePath)) {
            return 'Dosya bulunamadı.';
        }

        const stats = await fs.promises.stat(safePath); // FIXED: Async stat

        if (stats.size > 1024 * 1024) { // 1MB'dan büyükse
            return 'Dosya çok büyük (max 1MB).';
        }

        const content = await fs.promises.readFile(safePath, 'utf8'); // FIXED: Async readFile
        return `*${path.basename(safePath)}*\n\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``;
    } catch (error) {
        return 'Dosya okunamadı: ' + error.message;
    }
}

/**
 * Dosya oluştur
 */
async function createFile(filePath, content = '') {
    try {
        // CRITICAL: Validate path to prevent traversal (VULN-004)
        const safePath = validatePath(filePath);

        await fs.promises.writeFile(safePath, content, 'utf8'); // FIXED: Async writeFile
        return `Dosya oluşturuldu: ${safePath}`;
    } catch (error) {
        return 'Dosya oluşturulamadı: ' + error.message;
    }
}

/**
 * Dosya sil
 */
async function deleteFile(filePath) {
    try {
        // CRITICAL: Validate path to prevent traversal attacks
        const safePath = validatePath(filePath);

        if (!fs.existsSync(safePath)) {
            return 'Dosya bulunamadı.';
        }

        await fs.promises.unlink(safePath); // FIXED: Async unlink
        return `Dosya silindi: ${safePath}`;
    } catch (error) {
        return 'Dosya silinemedi: ' + error.message;
    }
}

/**
 * Dosya bilgisi al
 */
async function getFileInfo(filePath) {
    try {
        // CRITICAL: Validate path to prevent traversal
        const safePath = validatePath(filePath);

        if (!fs.existsSync(safePath)) {
            return 'Dosya bulunamadı.';
        }

        const stats = fs.statSync(safePath);

        let message = `*Dosya Bilgisi*\n\n`;
        message += `*Dosya:* ${path.basename(safePath)}\n`;
        message += `*Boyut:* ${(stats.size / 1024).toFixed(2)} KB\n`;
        message += `*Oluşturulma:* ${stats.birthtime.toLocaleString('tr-TR')}\n`;
        message += `*Değiştirilme:* ${stats.mtime.toLocaleString('tr-TR')}\n`;
        message += `*Erişim:* ${stats.atime.toLocaleString('tr-TR')}\n`;

        return message;
    } catch (error) {
        return 'Dosya bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Dosya ara
 */
async function searchFiles(directory, pattern) {
    try {
        // Pattern'i wildcard olarak kullan (*.pdf veya *beamng* gibi)
        // Eğer kullanıcı wildcard kullanmadıysa, otomatik ekle
        let searchPattern = pattern;
        if (!pattern.includes('*')) {
            searchPattern = `*${pattern}*`;
        }

        const { stdout } = await execPromise(`dir "${directory}" /B /S /A-D | findstr /I "${pattern.replace(/\*/g, '.*')}"`, { timeout: 30000 });

        if (!stdout || stdout.trim() === '') {
            return `Eşleşen dosya bulunamadı.\n\nArama: ${pattern}\nKonum: ${directory}`;
        }

        const files = stdout.split('\n').filter(f => f.trim()).slice(0, 30);
        let message = `*Arama Sonuçları (${escapeMarkdown(pattern)})*\n\n`;

        files.forEach((file, index) => {
            message += `${index + 1}. \`${escapeMarkdown(file.trim())}\`\n`;
        });

        if (files.length >= 30) {
            message += '\n💡 İlk 30 sonuç gösteriliyor.';
        }

        return message;
    } catch (error) {
        if (error.message.includes('File Not Found') || error.message.includes('FIND:')) {
            return `Eşleşen dosya bulunamadı.\n\nArama: ${pattern}\nKonum: ${directory}`;
        }
        return 'Dosya araması başarısız: ' + error.message;
    }
}

/**
 * Telegram dosyasını indir
 */
async function downloadTelegramFile(bot, fileId, fileName, chatId, targetFolder = null) {
    try {
        // Dosya bilgisini al
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

        // Hedef klasörü belirle
        const destinationFolder = targetFolder || DOWNLOAD_FOLDER;

        // Hedef klasörü doğrula (güvenlik)
        const safeFolder = validatePath(destinationFolder);

        // Klasör yoksa oluştur
        if (!fs.existsSync(safeFolder)) {
            fs.mkdirSync(safeFolder, { recursive: true });
        }

        // Dosya yolunu oluştur
        const filePath = path.join(safeFolder, fileName);

        // Dosyayı indir
        await downloadFile(fileUrl, filePath);

        return {
            success: true,
            message: `*Dosya İndirildi*\n\nDosya: \`${fileName}\`\nBoyut: ${(file.file_size / 1024).toFixed(2)} KB\nKonum: \`${filePath}\``,
            filePath: filePath
        };
    } catch (error) {
        return {
            success: false,
            message: 'Dosya indirilemedi: ' + error.message
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
        }).on('error', async (err) => {
            try {
                await fs.promises.unlink(dest); // FIXED: Async unlink on error
            } catch (unlinkErr) {
                // Ignore unlink errors
            }
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
            return 'Dosya bulunamadı: ' + filePath;
        }

        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);

        // Telegram limit kontrolü (50MB)
        if (fileSizeMB > 50) {
            return `*Dosya Çok Büyük*\n\nDosya boyutu: ${fileSizeMB.toFixed(2)} MB\nTelegram limiti: 50 MB\n\nDaha küçük bir dosya gönderin.`;
        }

        await bot.sendDocument(chatId, filePath);
        return `Dosya gönderildi: ${path.basename(filePath)}`;
    } catch (error) {
        return 'Dosya gönderilemedi: ' + error.message;
    }
}

/**
 * İndirme klasörünü aç
 */
async function openDownloadFolder() {
    try {
        await execPromise(`explorer "${DOWNLOAD_FOLDER}"`);
        return `İndirme klasörü açıldı: ${DOWNLOAD_FOLDER}`;
    } catch (error) {
        return 'Klasör açılamadı: ' + error.message;
    }
}

module.exports = {
    // Yeni akıllı fonksiyonlar
    getQuickFolders,
    listFolderContents,
    selectItemByNumber,
    getRecentFiles,

    // Eski fonksiyonlar (geriye uyumluluk)
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
