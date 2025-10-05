/**
 * Mouse ve Klavye Kontrol Menüsü
 */

function getInputMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['🖱️ Mouse Taşı', '🖱️ Mouse Tıkla'],
                ['🖱️ Çift Tık', '🖱️ Scroll'],
                ['🖱️ Mouse Konum', '⌨️ Metin Yaz'],
                ['⌨️ Tuş Bas', '⌨️ Tuş Kombinasyonu'],
                ['📋 Pano Menü', '🏠 Ana Menü']
            ],
            resize_keyboard: true
        }
    };
}

function getMouseClickMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['🖱️ Sol Tık', '🖱️ Sağ Tık', '🖱️ Orta Tık'],
                ['🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getScrollMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['⬆️ Yukarı Scroll', '⬇️ Aşağı Scroll'],
                ['🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getKeyMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['↩️ Enter', '⭾ Tab', '⎋ Esc'],
                ['⌫ Backspace', '⌦ Delete', '🏠 Home'],
                ['🔚 End', '⇞ PageUp', '⇟ PageDown'],
                ['⬆️ Up', '⬇️ Down', '⬅️ Left', '➡️ Right'],
                ['🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getComboMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['📋 Ctrl+C', '📋 Ctrl+V', '📋 Ctrl+X'],
                ['↩️ Ctrl+A', '💾 Ctrl+S', '↩️ Ctrl+Z'],
                ['🔄 Ctrl+Y', '🔍 Ctrl+F', '⊞ Alt+Tab'],
                ['❌ Alt+F4', '🖥️ Win+D', '🔒 Win+L'],
                ['🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

module.exports = {
    getInputMenu,
    getMouseClickMenu,
    getScrollMenu,
    getKeyMenu,
    getComboMenu
};
