const { execPromise } = require('../utils/exec');
const fs = require('fs');
const path = require('path');

// Pano geçmişi (son 10 kopyalama)
let clipboardHistory = [];
const MAX_HISTORY_SIZE = 10;
const MAX_TEXT_SIZE = 10000; // 10KB limit per entry to prevent memory leak
const HISTORY_FILE = path.join(__dirname, '../../data/clipboard_history.json');

// Data klasörünü oluştur
const dataDir = path.dirname(HISTORY_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Uygulama başlangıcında geçmişi yükle (Async)
async function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = await fs.promises.readFile(HISTORY_FILE, 'utf8');
            clipboardHistory = JSON.parse(data);
            console.log(`Clipboard geçmişi yüklendi: ${clipboardHistory.length} öğe`);
        }
    } catch (error) {
        console.error('Clipboard geçmişi yüklenemedi:', error);
        clipboardHistory = [];
    }
}

// Geçmişi dosyaya kaydet (Async + Debounced to prevent frequent writes)
let saveHistoryTimeout = null;
function saveHistory() {
    // Debounce: Wait 2 seconds before saving to avoid frequent file writes
    clearTimeout(saveHistoryTimeout);
    saveHistoryTimeout = setTimeout(async () => {
        try {
            await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(clipboardHistory, null, 2), 'utf8');
        } catch (error) {
            console.error('Clipboard geçmişi kaydedilemedi:', error);
        }
    }, 2000);
}

// Başlangıçta yükle
loadHistory();

/**
 * Panoyu oku
 */
async function getClipboard() {
    try {
        const clipboardy = await import('clipboardy');
        const text = await clipboardy.default.read();

        if (!text || text.trim() === '') {
            return '*Pano:* Boş';
        }

        return `*Panoda:*\n\`\`\`\n${text.substring(0, 500)}\n\`\`\``;
    } catch (error) {
        console.error('Pano okuma hatası:', error);
        return 'Pano okunamadı: ' + error.message;
    }
}

/**
 * Panoya yaz
 */
async function writeClipboard(text) {
    try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(text);

        // Geçmişe ekle
        addToHistory(text);

        return `Panoya yazıldı: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
    } catch (error) {
        console.error('Panoya yazma hatası:', error);
        return 'Panoya yazılamadı: ' + error.message;
    }
}

/**
 * Panoyu temizle
 */
async function clearClipboard() {
    try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write('');
        return 'Pano temizlendi.';
    } catch (error) {
        return 'Pano temizlenemedi: ' + error.message;
    }
}

/**
 * Pano geçmişini al (son 10 kopyalama)
 */
function getClipboardHistory() {
    try {
        if (clipboardHistory.length === 0) {
            return '*Pano Geçmişi:* Boş';
        }

        let message = '*Pano Geçmişi* (Son 10)\n\n';
        clipboardHistory.forEach((item, index) => {
            const preview = item.text.substring(0, 50).replace(/\n/g, ' ');
            const time = new Date(item.timestamp).toLocaleString('tr-TR');
            message += `${index + 1}. ${preview}${item.text.length > 50 ? '...' : ''}\n   ${time}\n\n`;
        });

        return message;
    } catch (error) {
        return 'Pano geçmişi alınamadı: ' + error.message;
    }
}

/**
 * Pano geçmişinden öğe seç ve panoya yaz
 */
async function selectFromHistory(index) {
    try {
        if (index < 1 || index > clipboardHistory.length) {
            return `Geçersiz index. 1-${clipboardHistory.length} arası bir sayı girin.`;
        }

        const item = clipboardHistory[index - 1];
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(item.text);

        return `Panoya yazıldı (Geçmiş #${index}):\n${item.text.substring(0, 100)}${item.text.length > 100 ? '...' : ''}`;
    } catch (error) {
        return 'Geçmişten seçim başarısız: ' + error.message;
    }
}

/**
 * Pano geçmişini temizle
 */
function clearClipboardHistory() {
    clipboardHistory = [];
    saveHistory(); // Dosyayı da temizle
    return 'Pano geçmişi temizlendi.';
}

/**
 * Pano geçmişine ekle (internal) - FIXED: Memory leak prevention
 */
function addToHistory(text) {
    // Boş veya çok kısa metinleri ekleme
    if (!text || text.trim().length < 2) {
        return;
    }

    // FIXED: Truncate text if too large to prevent memory leak
    const truncatedText = text.length > MAX_TEXT_SIZE
        ? text.substring(0, MAX_TEXT_SIZE) + '... (kesildi)'
        : text;

    // Aynı metin varsa ekleme (중복 방지)
    const exists = clipboardHistory.some(item => item.text === truncatedText);
    if (exists) {
        return;
    }

    // Geçmişe ekle
    clipboardHistory.unshift({
        text: truncatedText,
        timestamp: Date.now()
    });

    // Max boyut kontrolü
    if (clipboardHistory.length > MAX_HISTORY_SIZE) {
        clipboardHistory = clipboardHistory.slice(0, MAX_HISTORY_SIZE);
    }

    // Dosyaya kaydet (debounced - 2 saniye gecikme ile)
    saveHistory();
}

/**
 * Pano izleme başlat (her 2 saniyede kontrol) - FIXED: Interval leak prevention
 */
let clipboardWatcher = null;
let lastClipboardContent = '';
let clipboardErrorCount = 0;
const MAX_CLIPBOARD_ERRORS = 5;

async function startClipboardWatch() {
    try {
        if (clipboardWatcher) {
            return 'Pano izleme zaten aktif.';
        }

        const clipboardy = await import('clipboardy');
        lastClipboardContent = await clipboardy.default.read();
        clipboardErrorCount = 0; // Reset error count

        clipboardWatcher = setInterval(async () => {
            try {
                const currentContent = await clipboardy.default.read();
                if (currentContent && currentContent !== lastClipboardContent) {
                    lastClipboardContent = currentContent;
                    addToHistory(currentContent);
                }
                clipboardErrorCount = 0; // Reset on success
            } catch (err) {
                console.error('Pano izleme hatası:', err);
                clipboardErrorCount++;

                // FIXED: Auto-stop after too many errors to prevent zombie interval
                if (clipboardErrorCount >= MAX_CLIPBOARD_ERRORS) {
                    console.error(`Çok fazla hata (${clipboardErrorCount}), pano izleme durduruluyor`);
                    clearInterval(clipboardWatcher);
                    clipboardWatcher = null;
                    clipboardErrorCount = 0;
                }
            }
        }, 2000); // Her 2 saniyede bir kontrol

        return 'Pano izleme başlatıldı. Her kopyalama işlemi geçmişe kaydedilecek.';
    } catch (error) {
        return 'Pano izleme başlatılamadı: ' + error.message;
    }
}

/**
 * Pano izlemeyi durdur
 */
function stopClipboardWatch() {
    if (!clipboardWatcher) {
        return 'Pano izleme zaten pasif.';
    }

    clearInterval(clipboardWatcher);
    clipboardWatcher = null;
    return 'Pano izleme durduruldu.';
}

module.exports = {
    getClipboard,
    writeClipboard,
    clearClipboard,
    getClipboardHistory,
    selectFromHistory,
    clearClipboardHistory,
    startClipboardWatch,
    stopClipboardWatch
};
