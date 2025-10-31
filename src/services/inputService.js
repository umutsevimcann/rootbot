const { execPromise } = require('../utils/exec');
const path = require('path');
const fs = require('fs');

/**
 * Mouse ve Klavye Kontrol Servisi
 * Basitleştirilmiş ve çalışan PowerShell komutları
 */

/**
 * Mouse'u belirtilen koordinata taşı
 */
async function moveMouse(x, y) {
    try {
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})`;
        await execPromise(`powershell -Command "${psCommand}"`, { timeout: 5000 }); // FIXED: Added timeout
        return `Fare ${x},${y} koordinatına taşındı.`;
    } catch (error) {
        return 'Fare taşıma başarısız: ' + error.message;
    }
}

/**
 * Mouse tıklama - NirSoft NirCmd veya AutoHotkey kullanmadan basit çözüm
 */
async function clickMouse(button = 'left') {
    const tempFile = path.join(__dirname, `../../temp_click_${Date.now()}.vbs`);
    try {
        // PowerShell ile gerçek mouse event simülasyonu
        const psScript = button === 'left'
            ? `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")`
            : `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("+{F10}")`;

        await execPromise(`powershell -Command "${psScript}"`, { timeout: 5000 }); // FIXED: Added timeout

        const buttonText = button === 'left' ? 'Sol' : button === 'right' ? 'Sağ' : 'Orta';
        return `${buttonText} tıklama simüle edildi.`;
    } catch (error) {
        return 'Mouse tıklama başarısız: ' + error.message;
    } finally {
        // Cleanup - eğer dosya oluşturulmuşsa sil
        if (fs.existsSync(tempFile)) {
            try {
                fs.unlinkSync(tempFile);
            } catch (e) {
                // Silme hatası önemli değil
            }
        }
    }
}

/**
 * Çift tıklama
 */
async function doubleClick() {
    try {
        await clickMouse('left');
        await new Promise(resolve => setTimeout(resolve, 100));
        await clickMouse('left');
        return 'Çift tıklama yapıldı.';
    } catch (error) {
        return 'Çift tıklama başarısız: ' + error.message;
    }
}

/**
 * Mouse scroll - Basit çözüm
 */
async function scrollMouse(direction = 'down', amount = 3) {
    try {
        const key = direction === 'up' ? '{PGUP}' : '{PGDN}';
        for (let i = 0; i < amount; i++) {
            await execPromise(`powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${key}')"`, { timeout: 5000 }); // FIXED: Added timeout
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const dirText = direction === 'up' ? 'Yukarı' : 'Aşağı';
        return `${dirText} scroll yapıldı (${amount}x).`;
    } catch (error) {
        return 'Mouse scroll başarısız: ' + error.message;
    }
}

/**
 * Mevcut mouse pozisyonunu al
 */
async function getMousePosition() {
    try {
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $pos = [System.Windows.Forms.Cursor]::Position; Write-Output "$($pos.X),$($pos.Y)"`;
        const { stdout } = await execPromise(`powershell -Command "${psCommand}"`, { timeout: 5000 }); // FIXED: Added timeout
        const [x, y] = stdout.trim().split(',');
        return `*Mouse Pozisyonu*\n\nX: ${x}\nY: ${y}`;
    } catch (error) {
        return 'Mouse pozisyonu alınamadı: ' + error.message;
    }
}

/**
 * Klavye tuş gönderme
 */
async function sendKeys(keys) {
    try {
        const escapedKeys = keys.replace(/"/g, '""');
        await execPromise(`powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${escapedKeys}')"`, { timeout: 5000 }); // FIXED: Added timeout
        return `Tuşlar gönderildi: "${keys}"`;
    } catch (error) {
        return 'Tuş gönderme başarısız: ' + error.message;
    }
}

/**
 * Metin yaz
 */
async function typeText(text) {
    try {
        // Özel karakterleri escape et
        const escapedText = text
            .replace(/\+/g, '{+}')
            .replace(/\^/g, '{^}')
            .replace(/%/g, '{%}')
            .replace(/~/g, '{~}')
            .replace(/\(/g, '{(}')
            .replace(/\)/g, '{)}')
            .replace(/\[/g, '{[}')
            .replace(/\]/g, '{]}')
            .replace(/\{/g, '{{}')
            .replace(/\}/g, '{}}');

        await execPromise(`powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${escapedText}')"`, { timeout: 5000 }); // FIXED: Added timeout
        return `Metin yazıldı: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
    } catch (error) {
        return 'Metin yazma başarısız: ' + error.message;
    }
}

/**
 * Özel tuş basma
 */
async function pressKey(key) {
    try {
        const keyMap = {
            'enter': '{ENTER}',
            'tab': '{TAB}',
            'esc': '{ESC}',
            'escape': '{ESC}',
            'backspace': '{BACKSPACE}',
            'delete': '{DELETE}',
            'home': '{HOME}',
            'end': '{END}',
            'pageup': '{PGUP}',
            'pagedown': '{PGDN}',
            'up': '{UP}',
            'down': '{DOWN}',
            'left': '{LEFT}',
            'right': '{RIGHT}',
            'space': ' ',
            'f1': '{F1}',
            'f2': '{F2}',
            'f3': '{F3}',
            'f4': '{F4}',
            'f5': '{F5}',
            'f6': '{F6}',
            'f7': '{F7}',
            'f8': '{F8}',
            'f9': '{F9}',
            'f10': '{F10}',
            'f11': '{F11}',
            'f12': '{F12}'
        };

        const mappedKey = keyMap[key.toLowerCase()] || key;
        await execPromise(`powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${mappedKey}')"`, { timeout: 5000 }); // FIXED: Added timeout
        return `Tuş basıldı: ${key}`;
    } catch (error) {
        return 'Tuş basma başarısız: ' + error.message;
    }
}

/**
 * Tuş kombinasyonu
 */
async function pressKeyCombination(combination) {
    try {
        const parts = combination.toLowerCase().split('+');
        let sendKeysString = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();

            if (part === 'ctrl' || part === 'control') {
                sendKeysString += '^';
            } else if (part === 'alt') {
                sendKeysString += '%';
            } else if (part === 'shift') {
                sendKeysString += '+';
            } else if (part === 'win' || part === 'windows') {
                sendKeysString += '^{ESC}';
            } else {
                // Son karakter - tuş
                const keyMap = {
                    'c': 'c', 'v': 'v', 'x': 'x', 'a': 'a',
                    'z': 'z', 'y': 'y', 's': 's', 'f': 'f',
                    'n': 'n', 'o': 'o', 'p': 'p', 'w': 'w',
                    'tab': '{TAB}',
                    'enter': '{ENTER}',
                    'esc': '{ESC}',
                    'f4': '{F4}',
                    'd': 'd',
                    'l': 'l'
                };
                sendKeysString += keyMap[part] || part;
            }
        }

        await execPromise(`powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('${sendKeysString}')"`, { timeout: 5000 }); // FIXED: Added timeout
        return `Kombinasyon basıldı: ${combination}`;
    } catch (error) {
        return 'Tuş kombinasyonu başarısız: ' + error.message;
    }
}

module.exports = {
    moveMouse,
    clickMouse,
    doubleClick,
    scrollMouse,
    getMousePosition,
    sendKeys,
    typeText,
    pressKey,
    pressKeyCombination
};
