/**
 * Sistem İzleme Menüsü
 */

function getMonitoringMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['🔌 USB İzleme', '🔋 Pil İzleme'],
                ['🌐 İnternet İzleme', '💻 CPU İzleme'],
                ['📶 WiFi Şifresi', '📹 Webcam Kontrol'],
                ['🎤 Mikrofon Kontrol'],
                ['▶️ Tümünü Başlat', '⏹️ Tümünü Durdur'],
                ['📊 İzleme Durumu', '🏠 Ana Menü']
            ],
            resize_keyboard: true
        }
    };
}

function getUSBMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['▶️ Başlat', '⏹️ Durdur'],
                ['🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getBatteryMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['▶️ Başlat (%20)', '▶️ Başlat (%10)'],
                ['⏹️ Durdur', '🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getNetworkMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['▶️ Başlat', '⏹️ Durdur'],
                ['🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

function getCPUMonitorMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['▶️ Başlat (%90, 5dk)', '▶️ Başlat (%80, 3dk)'],
                ['⏹️ Durdur', '🔙 Geri']
            ],
            resize_keyboard: true
        }
    };
}

module.exports = {
    getMonitoringMenu,
    getUSBMonitorMenu,
    getBatteryMonitorMenu,
    getNetworkMonitorMenu,
    getCPUMonitorMenu
};
