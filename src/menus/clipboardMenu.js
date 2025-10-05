/**
 * Pano Yönetim Menüsü
 */

function getClipboardMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['📋 Panoyu Oku', '✏️ Panoya Yaz'],
                ['📜 Pano Geçmişi', '🔢 Geçmişten Seç'],
                ['📁 Panodaki Dosya', '🗑️ Panoyu Temizle'],
                ['🗑️ Geçmişi Temizle'],
                ['👁️ İzleme Başlat', '⏸️ İzleme Durdur'],
                ['🖱️ Mouse/Klavye', '🏠 Ana Menü']
            ],
            resize_keyboard: true
        }
    };
}

module.exports = {
    getClipboardMenu
};
