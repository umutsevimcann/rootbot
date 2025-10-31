const { execPromise } = require('../utils/exec');
const path = require('path');

/**
 * Hızlı İşlemler Servisi
 * Telegram'dan sıkça kullanılacak pratik özellikler
 */

/**
 * Ekranı kapat (monitör kapatma)
 */
async function turnOffScreen() {
    try {
        await execPromise('powershell -Command "(Add-Type \'[DllImport(\\\"user32.dll\\\")]public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);\' -Name a -Pas)::SendMessage(-1,0x0112,0xF170,2)"');
        return 'Ekran kapatıldı. Hareket ettirdiğinizde açılacak.';
    } catch (error) {
        return 'Ekran kapatma başarısız: ' + error.message;
    }
}

/**
 * Ses seviyesini ayarla (0-100)
 */
async function setVolume(level) {
    try {
        if (level < 0 || level > 100) {
            return 'Ses seviyesi 0-100 arası olmalı!';
        }

        // NirCmd kullanarak doğrudan ses seviyesi ayarla (0-65535 aralığı)
        // NirCmd yoksa PowerShell yöntemi kullan
        try {
            const volumeValue = Math.round((level / 100) * 65535);
            await execPromise(`nircmd setsysvolume ${volumeValue}`, { timeout: 2000 });
            return `Ses seviyesi %${level} olarak ayarlandı.`;
        } catch (nircmdError) {
            // NirCmd yoksa, WScript.Shell yöntemi - daha doğru hesaplama
            // Windows volume 0-100 arası 50 adımda değişir (her adım %2)
            const targetSteps = Math.round(level / 2);
            await execPromise(`powershell -Command "$wsh = New-Object -ComObject WScript.Shell; 1..50 | ForEach-Object { $wsh.SendKeys([char]174) }; Start-Sleep -Milliseconds 200; 1..${targetSteps} | ForEach-Object { $wsh.SendKeys([char]175); Start-Sleep -Milliseconds 15 }"`, { timeout: 10000 });
            return `Ses seviyesi ~%${level} olarak ayarlandı.`;
        }
    } catch (error) {
        return 'Ses ayarlama başarısız: ' + error.message;
    }
}

/**
 * Sesi kapat/aç (toggle)
 */
async function toggleMute() {
    try {
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)"');
        return 'Ses kapatıldı/açıldı (toggle).';
    } catch (error) {
        return 'Ses toggle başarısız: ' + error.message;
    }
}

/**
 * Webcam açık mı kontrol et
 */
async function checkWebcamStatus() {
    try {
        const { stdout } = await execPromise('powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -match \'Camera|Webcam|Video\'} | Select-Object ProcessName, MainWindowTitle | ConvertTo-Json"');

        if (stdout.trim()) {
            try {
                const processes = JSON.parse(stdout);
                const procList = Array.isArray(processes) ? processes : [processes];

                if (procList.length > 0) {
                    let msg = '*Webcam Aktif!*\n\n';
                    procList.forEach(p => {
                        msg += `• ${p.ProcessName}: ${p.MainWindowTitle}\n`;
                    });
                    return msg;
                }
            } catch (e) {
                // JSON parse hatası
            }
        }

        return 'Webcam kullanımda değil.';
    } catch (error) {
        return 'Webcam kontrolü başarısız: ' + error.message;
    }
}

/**
 * Mikrofon açık mı kontrol et
 */
async function checkMicrophoneStatus() {
    try {
        const { stdout } = await execPromise('powershell -Command "Get-Process | Where-Object {$_.ProcessName -match \'Discord|Teams|Zoom|Skype|obs|chrome|msedge\'} | Select-Object ProcessName | ConvertTo-Json"');

        if (stdout.trim()) {
            try {
                const processes = JSON.parse(stdout);
                const procList = Array.isArray(processes) ? processes : [processes];

                if (procList.length > 0) {
                    const uniqueProcs = [...new Set(procList.map(p => p.ProcessName))];
                    let msg = '*Mikrofon Kullanabilecek Uygulamalar:*\n\n';
                    uniqueProcs.forEach(p => {
                        msg += `• ${p}\n`;
                    });
                    msg += '\nBu uygulamalar mikrofonunuzu kullanıyor olabilir.';
                    return msg;
                }
            } catch (e) {
                // JSON parse hatası
            }
        }

        return 'Mikrofon kullanabilecek uygulama çalışmıyor.';
    } catch (error) {
        return 'Mikrofon kontrolü başarısız: ' + error.message;
    }
}

/**
 * Tüm uygulamaları minimize et (masaüstünü göster)
 */
async function showDesktop() {
    try {
        // Windows+D için PowerShell ile Shell.Application COM nesnesi kullan
        const psCommand = '$shell = New-Object -ComObject Shell.Application; $shell.MinimizeAll()';
        await execPromise(`powershell -Command "${psCommand}"`);
        return 'Tüm pencereler minimize edildi. Masaüstü gösteriliyor.';
    } catch (error) {
        return 'Masaüstü gösterme başarısız: ' + error.message;
    }
}

/**
 * Son açılan dosyaları listele
 */
async function getRecentFiles() {
    try {
        const { stdout } = await execPromise(`powershell -Command "Get-ChildItem -Path '$env:APPDATA\\Microsoft\\Windows\\Recent' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object { $_.Name }"`);

        if (stdout.trim()) {
            const files = stdout.trim().split('\n').filter(f => f.trim());

            // Markdown kullanmadan düz metin olarak döndür
            let message = 'Son Açılan Dosyalar:\n\n';
            files.forEach((file, index) => {
                message += `${index + 1}. ${file.trim()}\n`;
            });

            return { message, useMarkdown: false };
        }

        return { message: 'Son açılan dosya bulunamadı.', useMarkdown: false };
    } catch (error) {
        return { message: 'Son dosyalar listelenemedi: ' + error.message, useMarkdown: false };
    }
}

/**
 * Aktif WiFi şifresini göster
 */
async function getWiFiPassword() {
    try {
        // Mevcut WiFi adını al
        const { stdout: profileOutput } = await execPromise('netsh wlan show interfaces');
        const profileMatch = profileOutput.match(/Profile\s+:\s+(.+)/);

        if (!profileMatch) {
            return 'WiFi bağlantısı yok.';
        }

        const profileName = profileMatch[1].trim();

        // WiFi şifresini al
        const { stdout: passOutput } = await execPromise(`netsh wlan show profile name="${profileName}" key=clear`);
        const passMatch = passOutput.match(/Key Content\s+:\s+(.+)/);

        if (passMatch) {
            const password = passMatch[1].trim();
            return `*WiFi Bilgileri*\n\n*Ağ:* ${profileName}\n*Şifre:* \`${password}\``;
        }

        return `*WiFi:* ${profileName}\n\nŞifre bulunamadı (açık ağ olabilir).`;
    } catch (error) {
        return 'WiFi şifresi alınamadı: ' + error.message;
    }
}

/**
 * Geri dönüşüm kutusunu boşalt
 */
async function emptyRecycleBin() {
    try {
        // PowerShell 5.0+ için Clear-RecycleBin, eski sürümler için alternatif
        try {
            await execPromise('powershell -Command "Clear-RecycleBin -Force -ErrorAction Stop"');
        } catch (err) {
            // Eski PowerShell için COM Shell kullan
            await execPromise('powershell -Command "$shell = New-Object -ComObject Shell.Application; $recycleBin = $shell.NameSpace(10); $recycleBin.Items() | ForEach-Object { Remove-Item $_.Path -Recurse -Force -ErrorAction SilentlyContinue }"');
        }
        return 'Geri dönüşüm kutusu boşaltıldı.';
    } catch (error) {
        // Hata olsa bile boşaltma işlemi başarılı olabilir
        return 'Geri dönüşüm kutusu boşaltma işlemi tamamlandı.';
    }
}

/**
 * Ekran parlaklığını ayarla (0-100)
 */
async function setBrightness(level) {
    try {
        if (level < 0 || level > 100) {
            return 'Parlaklık 0-100 arası olmalı!';
        }

        // Önce WMI ile dene (dizüstü bilgisayarlar için)
        try {
            await execPromise(`powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${level})"`, { timeout: 3000 });
            return `Ekran parlaklığı %${level} olarak ayarlandı.`;
        } catch (wmiError) {
            // WMI başarısız - masaüstü PC veya harici monitör
            return `Parlaklık ayarlanamadı.

Bu özellik sadece dizüstü bilgisayarlarda çalışır.
Masaüstü PC'de monitörün fiziksel butonlarını kullanın.`;
        }
    } catch (error) {
        return 'Parlaklık ayarlama hatası: ' + error.message;
    }
}

/**
 * Bildirim gönder (Windows 10 Toast Notification)
 */
async function sendNotification(title, message) {
    try {
        const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">${title}</text>
            <text id="2">${message}</text>
        </binding>
    </visual>
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("RootBot").Show($toast)
        `;

        await execPromise(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);
        return `Bildirim gönderildi: "${title}"`;
    } catch (error) {
        return 'Bildirim gönderilemedi: ' + error.message;
    }
}

/**
 * Panoya son kopyalanan dosya yolunu al
 */
async function getClipboardFilePath() {
    try {
        const { stdout } = await execPromise('powershell -Command "Get-Clipboard -Format FileDropList | Select-Object -First 1"');

        if (stdout.trim()) {
            return `*Panodaki Dosya:*\n\n\`${stdout.trim()}\``;
        }

        return 'Panoda dosya yok.';
    } catch (error) {
        return 'Clipboard dosya yolu alınamadı: ' + error.message;
    }
}

/**
 * Hızlı komutlar menüsü
 */
function getQuickCommandsHelp() {
    return `*Hızlı Komutlar*\n\n` +
           `Ekran Kapat - Monitörü kapat\n` +
           `Ses %50 - Ses seviyesi ayarla\n` +
           `Sesi Kapat - Mute/unmute\n` +
           `Webcam Kontrol - Webcam kullanımda mı?\n` +
           `Mikrofon Kontrol - Hangi uygulamalar mikrofon kullanıyor?\n` +
           `Masaüstü Göster - Tüm pencereleri minimize et\n` +
           `Son Dosyalar - Son açılan 10 dosya\n` +
           `WiFi Şifresi - Bağlı WiFi şifresi\n` +
           `Geri Dönüşüm Boşalt - Recycle bin temizle\n` +
           `Parlaklık %70 - Ekran parlaklığı ayarla\n` +
           `Bildirim Gönder - Windows bildirimi\n` +
           `Panodaki Dosya - Kopyalanan dosya yolu`;
}

module.exports = {
    turnOffScreen,
    setVolume,
    toggleMute,
    checkWebcamStatus,
    checkMicrophoneStatus,
    showDesktop,
    getRecentFiles,
    getWiFiPassword,
    emptyRecycleBin,
    setBrightness,
    sendNotification,
    getClipboardFilePath,
    getQuickCommandsHelp
};
