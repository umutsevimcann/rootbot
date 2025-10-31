const { execPromise } = require('../utils/exec');
const { ValidationError } = require('../utils/errors');

/**
 * TTS için mesaj sanitization (VULN-001 FIX)
 * Sadece güvenli karakterlere izin ver: alfanumerik, noktalama, Türkçe karakterler
 *
 * @param {string} message - Sanitize edilecek mesaj
 * @returns {string} - Güvenli mesaj
 * @throws {ValidationError} - Geçersiz mesaj
 */
function sanitizeTTSMessage(message) {
    if (!message || typeof message !== 'string') {
        throw new ValidationError('Invalid TTS message: must be non-empty string');
    }

    // Whitelist: Alfanumerik + noktalama + Türkçe karakterler + boşluk
    // İzin verilen: a-z A-Z 0-9 .,!?'"-:; ĞÜŞİÖÇğüşıöç ve boşluk
    const safeMessage = message
        .replace(/[^a-zA-Z0-9\s.,!?'"\-:;ĞÜŞİÖÇğüşıöç]/g, '') // Sadece güvenli karakterler
        .substring(0, 500); // Max 500 karakter (TTS için yeterli)

    if (!safeMessage || safeMessage.trim().length === 0) {
        throw new ValidationError('Invalid TTS message: no safe characters remaining');
    }

    return safeMessage.trim();
}

/**
 * PowerShell TTS komutu oluştur (GÜNCELLEME: Güvenli mesaj ile)
 * @param {string} message - Sanitize edilmiş mesaj
 * @returns {string} - PowerShell komutu
 */
function buildTTSCommand(message) {
    // PowerShell için tek tırnak escape (SQL Injection gibi)
    const escapedMessage = message.replace(/'/g, "''");

    return `Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Volume = 100; $speak.Rate = 0; $speak.Speak('${escapedMessage}')`;
}

/**
 * Sesli uyarı çal (Türkçe ses ile) - GÜNCELLEME: Güvenlik kontrolü ile
 */
async function playAlert(message = 'Dikkat! Bilgisayarınız uzaktan kontrol ediliyor.') {
    try {
        // SECURITY: Mesaj sanitization
        const safeMessage = sanitizeTTSMessage(message);

        // PowerShell ile Microsoft Tolga sesi kullan
        await execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SelectVoice('Microsoft Tolga'); $speak.Volume = 100; $speak.Rate = 0; $speak.Speak('${safeMessage.replace(/'/g, "''")}')"`)
            .catch((error) => {
                console.error('Tolga sesi bulunamadı, alternatif deneniyor:', error);
                // Alternatif: Tolga yoksa herhangi bir Türkçe ses kullan
                return execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voices = $speak.GetInstalledVoices(); $trVoice = $voices | Where-Object { $_.VoiceInfo.Name -like '*Tolga*' } | Select-Object -First 1; if($trVoice) { $speak.SelectVoice($trVoice.VoiceInfo.Name); } else { $speak.Volume = 100; $speak.Rate = -1; }; $speak.Speak('${safeMessage.replace(/'/g, "''")}')"`)
            });

        return 'Sesli uyarı gönderildi.';
    } catch (error) {
        if (error instanceof ValidationError) {
            return 'Sesli uyarı başarısız: Geçersiz mesaj (güvenlik kontrolü)';
        }
        console.error('Sesli uyarı hatası:', error);
        return 'Sesli uyarı başarısız: ' + error.message;
    }
}

/**
 * Sesli komut çal - GÜNCELLEME: Güvenlik kontrolü ile
 */
async function playVoiceCommand(command) {
    try {
        let message = '';

        switch (command) {
            case 'hello':
                message = 'Merhaba! Bilgisayarımda Oturan Kişi Size nasıl yardımcı olabilirim?';
                break;
            case 'warning':
                message = 'Dikkat! Bilgisayarınız uzaktan kontrol ediliyor. Lütfen dikkatli olun.';
                break;
            case 'joke':
                const jokes = [
                    'Bilgisayarlar neden asla üşümez? Çünkü onların Windows\'u var!',
                    'Bilgisayarım bana dedi ki, sen olmadan yapamam. Güç kablosunu çektim, gerçekten yapamadı.',
                    'Bilgisayarımın şifresi yanlış diye uyarı veriyordu. Şifreyi değiştirdim, şimdi doğru diye uyarı veriyor.',
                    'Bilgisayarıma virüs bulaşmış. Doktora götürdüm, format atmamı söyledi.'
                ];
                message = jokes[Math.floor(Math.random() * jokes.length)];
                break;
            case 'scare':
                message = 'Dikkat! Sistem tehlikede! Kritik güvenlik açığı tespit edildi! Tüm veriler risk altında!';
                break;
            case 'shutdown':
                message = 'Dikkat! Bilgisayar 10 saniye içinde kapatılacak. Lütfen çalışmalarınızı kaydedin.';
                break;
            case 'hacker':
                message = 'Uyarı! Bilgisayarınıza izinsiz erişim tespit edildi. Sistem güvenliği tehlikede!';
                break;
            case 'motivation':
                const motivations = [
                    'Bugün harika bir gün olacak! Tüm hedeflerine ulaşacaksın!',
                    'Asla pes etme! Her zorluk, seni daha güçlü yapar!',
                    'Başarı, düştükten sonra tekrar ayağa kalkmaktır!',
                    'İmkansız diye bir şey yoktur, sadece zaman alır!',
                    'Hayallerine ulaşmak için her gün bir adım at!'
                ];
                message = motivations[Math.floor(Math.random() * motivations.length)];
                break;
            case 'congrats':
                message = 'Tebrikler! Harika bir iş çıkardın! Seninle gurur duyuyorum!';
                break;
            default:
                // SECURITY FIX: Özel mesaj için sanitization
                message = command;
                break;
        }

        // SECURITY: Mesaj sanitization
        const safeMessage = sanitizeTTSMessage(message);

        // PowerShell ile ses çal - önce varsayılan sesle dene
        try {
            await execPromise(`powershell -Command "${buildTTSCommand(safeMessage)}"`, { timeout: 30000 });
            return `Sesli komut çalındı: "${safeMessage}"`;
        } catch (error) {
            console.error('Sesli komut hatası:', error);
            // Fallback: Windows varsayılan sesiyle tekrar dene
            try {
                await execPromise(`powershell -Command "$voice = New-Object -ComObject SAPI.SpVoice; $voice.Volume = 100; $voice.Rate = 0; $voice.Speak('${safeMessage.replace(/'/g, "''")}')"`, { timeout: 30000 });
                return `Sesli komut çalındı (alternatif): "${safeMessage}"`;
            } catch (fallbackError) {
                throw new Error('Sesli komut çalınamadı. Windows ses ayarlarını kontrol edin.');
            }
        }
    } catch (error) {
        if (error instanceof ValidationError) {
            return 'Sesli komut başarısız: Geçersiz mesaj (güvenlik kontrolü)';
        }
        console.error('Sesli komut hatası:', error);
        return 'Sesli komut başarısız: ' + error.message;
    }
}

/**
 * Ses seviyesi al
 */
async function getAudioStatus() {
    try {
        const { stdout } = await execPromise('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"');
        return '*Ses Durumu*\n\nSes seviyesi kontrol ediliyor...';
    } catch (error) {
        return 'Ses durumu alınamadı: ' + error.message;
    }
}

/**
 * Sesi aç/kapat (toggle mute)
 */
async function unmuteSpeakers() {
    try {
        // PowerShell ile Mute tuşu gönder (toggle)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)"');
        return 'Ses açıldı/kapatıldı (toggle).';
    } catch (error) {
        return 'Ses kontrolü başarısız: ' + error.message;
    }
}

/**
 * Sesi kapat (mute toggle)
 */
async function muteSpeakers() {
    try {
        // PowerShell ile Mute tuşu gönder (toggle)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)"');
        return 'Ses kapatıldı/açıldı (toggle).';
    } catch (error) {
        return 'Ses kontrolü başarısız: ' + error.message;
    }
}

/**
 * Ses yükselt
 */
async function increaseVolume() {
    try {
        // Volume Up tuşu gönder (1 kez = %2 artış)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]175)"');
        return 'Ses yükseltildi (+2).';
    } catch (error) {
        return 'Ses yükseltme başarısız: ' + error.message;
    }
}

/**
 * Ses azalt
 */
async function decreaseVolume() {
    try {
        // Volume Down tuşu gönder (1 kez = %2 azalma)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]174)"');
        return 'Ses azaltıldı (-2).';
    } catch (error) {
        return 'Ses azaltma başarısız: ' + error.message;
    }
}

/**
 * Ses seviyesi ayarla (0-100)
 */
async function setVolumeLevel(level) {
    try {
        if (level < 0 || level > 100) {
            return 'Ses seviyesi 0-100 arasında olmalı.';
        }

        // 0-100 arası değeri 0-65535 arasına çevir (Windows ses API'si)
        const volumeValue = Math.round((level / 100) * 65535);

        // PowerShell ile DirectSound API kullanarak tam ses kontrolü
        const psCommand = `
            Add-Type -TypeDefinition @'
            using System.Runtime.InteropServices;
            [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
            interface IAudioEndpointVolume {
                int NotImpl1(); int NotImpl2();
                int GetChannelCount(out int channelCount);
                int SetMasterVolumeLevel(float level, System.Guid eventContext);
                int SetMasterVolumeLevelScalar(float level, System.Guid eventContext);
                int GetMasterVolumeLevel(out float level);
                int GetMasterVolumeLevelScalar(out float level);
            }
'@
            $deviceEnumerator = New-Object -ComObject MMDevMgr.DeviceEnumerator
            $defaultDevice = $deviceEnumerator.GetDefaultAudioEndpoint(0, 0)
            $guid = [System.Guid]::Empty
            $endpointVolume = [System.Runtime.InteropServices.Marshal]::GetComInterfaceForObject($defaultDevice, [Type]::GetTypeFromCLSID([Guid]'{5CDF2C82-841E-4546-9722-0CF74078229A}'))
            $endpointVolume.SetMasterVolumeLevelScalar(${level / 100}, $guid)
        `.replace(/\n/g, ' ');

        await execPromise(`powershell -Command "${psCommand}"`);
        return `Ses seviyesi %${level} olarak ayarlandı.`;
    } catch (error) {
        return 'Ses seviyesi ayarlama başarısız: ' + error.message;
    }
}

/**
 * Ses cihazlarını listele (Windows varsayılan komutları kullanarak)
 */
async function listAudioDevices() {
    try {
        // Windows ses cihazlarını listele
        const { stdout } = await execPromise('powershell -Command "Get-CimInstance Win32_SoundDevice | Select-Object Name, Status, DeviceID | Format-List"');
        return `*Ses Cihazları*\n\n\`\`\`\n${stdout}\n\`\`\``;
    } catch (error) {
        return 'Ses cihazları listelenemedi: ' + error.message;
    }
}

/**
 * Varsayılan ses cihazını kontrol et
 */
async function changeAudioDevice() {
    try {
        // Windows ses ayarlarını aç (arka planda çalışır, hata vermesi normal)
        execPromise('control mmsys.cpl sounds').catch(() => {});
        return 'Ses ayarları paneli açıldı.\n\nAçılan pencereden ses cihazınızı değiştirebilirsiniz.';
    } catch (error) {
        return 'Ses ayarları paneli açılıyor...';
    }
}

module.exports = {
    playAlert,
    playVoiceCommand,
    getAudioStatus,
    unmuteSpeakers,
    muteSpeakers,
    increaseVolume,
    decreaseVolume,
    setVolumeLevel,
    listAudioDevices,
    changeAudioDevice
};
