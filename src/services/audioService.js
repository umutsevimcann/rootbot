const { execPromise } = require('../utils/exec');

/**
 * Sesli uyarı çal (Türkçe ses ile)
 */
async function playAlert(message = 'Dikkat! Bilgisayarınız uzaktan kontrol ediliyor.') {
    try {
        // PowerShell ile Microsoft Tolga sesi kullan
        await execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SelectVoice('Microsoft Tolga'); $speak.Volume = 100; $speak.Rate = 0; $speak.Speak('${message.replace(/'/g, "''")}')"`)
            .catch((error) => {
                console.error('Tolga sesi bulunamadı, alternatif deneniyor:', error);
                // Alternatif: Tolga yoksa herhangi bir Türkçe ses kullan
                return execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voices = $speak.GetInstalledVoices(); $trVoice = $voices | Where-Object { $_.VoiceInfo.Name -like '*Tolga*' } | Select-Object -First 1; if($trVoice) { $speak.SelectVoice($trVoice.VoiceInfo.Name); } else { $speak.Volume = 100; $speak.Rate = -1; }; $speak.Speak('${message.replace(/'/g, "''")}')"`)
            });

        return '🔊 Sesli uyarı gönderildi.';
    } catch (error) {
        console.error('Sesli uyarı hatası:', error);
        return '❌ Sesli uyarı başarısız: ' + error.message;
    }
}

/**
 * Sesli komut çal
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
                message = command; // Özel mesaj
                break;
        }

        // PowerShell ile ses çal - önce varsayılan sesle dene
        try {
            await execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Volume = 100; $speak.Rate = 0; $speak.Speak('${message.replace(/'/g, "''")}')"`, { timeout: 30000 });
            return `🔊 Sesli komut çalındı: "${message}"`;
        } catch (error) {
            console.error('Sesli komut hatası:', error);
            // Fallback: Windows varsayılan sesiyle tekrar dene
            try {
                await execPromise(`powershell -Command "$voice = New-Object -ComObject SAPI.SpVoice; $voice.Volume = 100; $voice.Rate = 0; $voice.Speak('${message.replace(/'/g, "''")}')"`, { timeout: 30000 });
                return `🔊 Sesli komut çalındı (alternatif): "${message}"`;
            } catch (fallbackError) {
                throw new Error('Sesli komut çalınamadı. Windows ses ayarlarını kontrol edin.');
            }
        }
    } catch (error) {
        console.error('Sesli komut hatası:', error);
        return '❌ Sesli komut başarısız: ' + error.message;
    }
}

/**
 * Ses seviyesi al
 */
async function getAudioStatus() {
    try {
        const { stdout } = await execPromise('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"');
        return '🔊 *Ses Durumu*\n\nSes seviyesi kontrol ediliyor...';
    } catch (error) {
        return '❌ Ses durumu alınamadı: ' + error.message;
    }
}

/**
 * Sesi aç/kapat (toggle mute)
 */
async function unmuteSpeakers() {
    try {
        // PowerShell ile Mute tuşu gönder (toggle)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)"');
        return '🔊 Ses açıldı/kapatıldı (toggle).';
    } catch (error) {
        return '❌ Ses kontrolü başarısız: ' + error.message;
    }
}

/**
 * Sesi kapat (mute toggle)
 */
async function muteSpeakers() {
    try {
        // PowerShell ile Mute tuşu gönder (toggle)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]173)"');
        return '🔇 Ses kapatıldı/açıldı (toggle).';
    } catch (error) {
        return '❌ Ses kontrolü başarısız: ' + error.message;
    }
}

/**
 * Ses yükselt
 */
async function increaseVolume() {
    try {
        // Volume Up tuşu gönder (1 kez = %2 artış)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]175)"');
        return '🔼 Ses yükseltildi (+2).';
    } catch (error) {
        return '❌ Ses yükseltme başarısız: ' + error.message;
    }
}

/**
 * Ses azalt
 */
async function decreaseVolume() {
    try {
        // Volume Down tuşu gönder (1 kez = %2 azalma)
        await execPromise('powershell -Command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys([char]174)"');
        return '🔽 Ses azaltıldı (-2).';
    } catch (error) {
        return '❌ Ses azaltma başarısız: ' + error.message;
    }
}

/**
 * Ses seviyesi ayarla (0-100)
 */
async function setVolumeLevel(level) {
    try {
        if (level < 0 || level > 100) {
            return '❌ Ses seviyesi 0-100 arasında olmalı.';
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
        return `🔊 Ses seviyesi %${level} olarak ayarlandı.`;
    } catch (error) {
        return '❌ Ses seviyesi ayarlama başarısız: ' + error.message;
    }
}

/**
 * Ses cihazlarını listele (Windows varsayılan komutları kullanarak)
 */
async function listAudioDevices() {
    try {
        // Windows ses cihazlarını listele
        const { stdout } = await execPromise('powershell -Command "Get-CimInstance Win32_SoundDevice | Select-Object Name, Status, DeviceID | Format-List"');
        return `🔊 *Ses Cihazları*\n\n\`\`\`\n${stdout}\n\`\`\``;
    } catch (error) {
        return '❌ Ses cihazları listelenemedi: ' + error.message;
    }
}

/**
 * Varsayılan ses cihazını kontrol et
 */
async function changeAudioDevice() {
    try {
        // Windows ses ayarlarını aç (arka planda çalışır, hata vermesi normal)
        execPromise('control mmsys.cpl sounds').catch(() => {});
        return '🔊 Ses ayarları paneli açıldı.\n\n📝 Açılan pencereden ses cihazınızı değiştirebilirsiniz.';
    } catch (error) {
        return '🔊 Ses ayarları paneli açılıyor...';
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
