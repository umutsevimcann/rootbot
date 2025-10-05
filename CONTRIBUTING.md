# 🤝 Katkıda Bulunma Rehberi

RootBot'a katkıda bulunmak istediğiniz için teşekkürler! 🎉

## 📋 İçindekiler

- [Başlamadan Önce](#başlamadan-önce)
- [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)
- [Kod Standartları](#kod-standartları)
- [Commit Mesajları](#commit-mesajları)
- [Pull Request Süreci](#pull-request-süreci)
- [İssue Raporlama](#issue-raporlama)
- [Modül Ekleme](#modül-ekleme)

---

## Başlamadan Önce

### Nelere Katkıda Bulunabilirsiniz?

- 🐛 **Bug Fixes**: Hata düzeltmeleri
- ✨ **New Features**: Yeni özellikler
- 📚 **Documentation**: Dokümantasyon iyileştirmeleri
- 🎨 **UI/UX**: Telegram menü iyileştirmeleri
- 🔧 **Refactoring**: Kod kalitesi artırma
- 🌍 **Localization**: Dil desteği (şu an sadece Türkçe)
- 🧪 **Tests**: Test coverage artırma

### Katkı Öncelikleri

**Yüksek Öncelik:**
- FFmpeg alternatifi video capture
- Çoklu kullanıcı desteği
- Config UI (Telegram üzerinden ayarlar)
- Scheduled tasks UI iyileştirmesi
- Error handling iyileştirmeleri

**Orta Öncelik:**
- Spotify tam entegrasyonu
- Cloud storage entegrasyonu (Google Drive, OneDrive)
- Network monitoring iyileştirmesi
- Battery optimization
- Mobile app support research

**Düşük Öncelik:**
- Theme/skin desteği
- Custom emoji support
- Voice command improvements
- Advanced automation rules

---

## Geliştirme Ortamı Kurulumu

### 1. Proje Fork & Clone

```bash
# Fork yapın (GitHub'da "Fork" butonu)
# Sonra clone edin:
git clone https://github.com/YOUR_USERNAME/rootbot.git
cd rootbot

# Upstream ekleyin
git remote add upstream https://github.com/ORIGINAL_OWNER/rootbot.git
```

### 2. Dependencies Yükleme

```bash
# Node modüllerini yükle
npm install

# .env dosyası oluştur
cp .env.example .env
# .env dosyasını düzenle (kendi token'ınızı girin)
```

### 3. Development Mode Başlatma

```bash
# Development modda çalıştır
NODE_ENV=development LOG_LEVEL=debug npm start

# Veya .env'de:
# NODE_ENV=development
# LOG_LEVEL=debug
npm start
```

### 4. Branch Oluşturma

```bash
# Feature branch
git checkout -b feature/amazing-feature

# Bug fix branch
git checkout -b fix/bug-description

# Documentation branch
git checkout -b docs/improvement
```

---

## Kod Standartları

### JavaScript Style Guide

#### ✅ İyi Örnekler

```javascript
// ✅ Async/Await kullanın
async function getSystemInfo() {
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        return { cpu, mem };
    } catch (error) {
        logger.error('System info error:', error);
        throw error;
    }
}

// ✅ Destructuring kullanın
const { bot, checkAuthorization } = require('../bot');

// ✅ Template literals kullanın
const message = `CPU: ${cpu.manufacturer} ${cpu.brand}`;

// ✅ Arrow functions (kısa callback'ler için)
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// ✅ Modüler yapı
// Dosya: src/services/myService.js
async function myFunction() { /* ... */ }
module.exports = { myFunction };
```

#### ❌ Kötü Örnekler

```javascript
// ❌ Promise.then kullanmayın
si.cpu().then(cpu => {
    si.mem().then(mem => {
        // callback hell
    });
});

// ❌ var kullanmayın
var x = 10;

// ❌ String concatenation
var message = 'CPU: ' + cpu.manufacturer + ' ' + cpu.brand;

// ❌ Function expression (gereksiz yerlerde)
const doubled = numbers.map(function(n) {
    return n * 2;
});

// ❌ Tek dosyaya tüm kodu yazmayın
// main.js 4600 satır (ESKİ HALİ - YAPMAYIN!)
```

### Dosya Yapısı

#### Yeni Servis Ekleme

```javascript
// src/services/myNewService.js

// Import'lar en üstte
const { execPromise } = require('../utils/exec');
const logger = require('../utils/logger');

/**
 * Servis açıklaması
 * @param {string} param - Parametre açıklaması
 * @returns {Promise<string>} Dönen değer açıklaması
 */
async function myFunction(param) {
    try {
        // İşlem yapın
        const result = await execPromise(`some-command ${param}`);

        // Log ekleyin
        logger.info(`myFunction executed: ${param}`);

        return result;
    } catch (error) {
        // Hata yönetimi
        logger.error('myFunction error:', error);
        throw new Error('Friendly error message: ' + error.message);
    }
}

// Export
module.exports = {
    myFunction
};
```

#### Yeni Menü Ekleme

```javascript
// src/menus/myNewMenu.js

/**
 * Menü klavyesi
 */
function getMyMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🎯 Option 1', '🎯 Option 2'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

/**
 * Menüyü gönder
 */
async function sendMyMenu(bot, chatId) {
    try {
        const message = '🎯 *My Menu Title*\n\nDescription...';
        const keyboard = getMyMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Menu error:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi.');
    }
}

module.exports = {
    getMyMenuKeyboard,
    sendMyMenu
};
```

### Hata Yönetimi

```javascript
// ✅ Try/catch her zaman kullanın
async function riskyOperation() {
    try {
        const result = await someAsyncOperation();
        return result;
    } catch (error) {
        // Log edin
        logger.error('Operation failed:', error);

        // Kullanıcı dostu mesaj
        throw new Error('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    }
}

// ✅ Specific error handling
async function smartOperation() {
    try {
        const result = await someOperation();
        return result;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return 'Dosya bulunamadı';
        } else if (error.message.includes('permission')) {
            return 'Yönetici yetkisi gerekiyor';
        } else {
            throw error;
        }
    }
}
```

### Yorum Satırları

```javascript
// ✅ Karmaşık mantığı açıklayın
// FFmpeg gdigrab desteklemiyorsa PowerShell fallback kullan
if (errorMsg.includes('Unknown input format')) {
    // PowerShell ile 10 FPS screenshot capture
    const psCommand = `...`;
}

// ✅ Önemli değişkenleri açıklayın
const botStartTime = Math.floor(Date.now() / 1000); // Unix timestamp (eski mesaj filtresi için)

// ❌ Gereksiz yorumlar yazmayın
// x değişkenine 5 ata
const x = 5;
```

---

## Commit Mesajları

### Conventional Commits Formatı

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type

- **feat**: Yeni özellik
- **fix**: Bug düzeltmesi
- **docs**: Dokümantasyon
- **style**: Kod formatı (loglama değişikliği değil)
- **refactor**: Kod yeniden yapılandırma
- **perf**: Performans iyileştirmesi
- **test**: Test ekleme/düzeltme
- **chore**: Bakım işleri (dependency güncelleme vb.)

#### Örnekler

```bash
# ✅ İyi commit mesajları
git commit -m "feat(audio): Add DirectSound API for exact volume control"
git commit -m "fix(monitor): Fix FFmpeg gdigrab fallback to PowerShell"
git commit -m "docs(readme): Add installation troubleshooting section"
git commit -m "refactor(services): Split monolithic main.js to 29 modules"
git commit -m "perf(screenshot): Optimize screenshot capture speed"

# ❌ Kötü commit mesajları
git commit -m "update"
git commit -m "fix bug"
git commit -m "changed stuff"
git commit -m "asdasd"
```

#### Detaylı Commit Örneği

```bash
git commit -m "feat(network): Add website blocking with hosts file

- Implement blockWebsite() function
- Implement unblockWebsite() function
- Add admin permission check
- Add UAC elevation for hosts file modification
- Include both domain and www.domain blocking
- Add DNS cache flushing after changes

Closes #123"
```

---

## Pull Request Süreci

### 1. Upstream Güncellemesi

```bash
# Ana repo'dan güncel kodu çekin
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Branch'inizi Güncelleyin

```bash
git checkout feature/your-feature
git rebase main
```

### 3. Test Edin

```bash
# Botu çalıştırın
npm start

# Telegram'dan tüm değişikliklerinizi test edin
# Log dosyasını kontrol edin
tail -f logs/rootbot.log

# Hata yoksa commit edin
git add .
git commit -m "feat: Your feature description"
```

### 4. Push Edin

```bash
git push origin feature/your-feature
```

### 5. Pull Request Açın

GitHub'da:
1. "New Pull Request" butonuna tıklayın
2. base: `main` ← compare: `feature/your-feature`
3. Başlık: `feat: Your feature title`
4. Açıklama şablonunu doldurun:

```markdown
## Değişiklik Özeti
Bu PR şu özellikleri ekliyor: ...

## Yapılan Değişiklikler
- [ ] Yeni özellik eklendi: X
- [ ] Bug düzeltildi: Y
- [ ] Dokümantasyon güncellendi
- [ ] Test edildi

## Test Senaryosu
1. Adım 1
2. Adım 2
3. Beklenen sonuç: ...

## Ekran Görüntüleri
(Telegram bot mesajları screenshot'ları)

## Kontrol Listesi
- [x] Kod standartlarına uygun
- [x] Commit mesajları conventional commits formatında
- [x] Dokümantasyon güncellendi
- [x] Test edildi
- [x] Log kontrol edildi
```

### 6. Code Review

- Reviewer yorumlarını cevaplayın
- İstenirse değişiklik yapın
- Approve aldıktan sonra merge edilecek

---

## Issue Raporlama

### Bug Report

GitHub Issues → New Issue → Bug Report

```markdown
**Bug Açıklaması**
Ekran kaydı çalışmıyor, FFmpeg hatası veriyor.

**Adımlar (Tekrarlanabilir)**
1. Telegram'da "📸 Ekran" menüsüne gir
2. "🎥 Ekran Kaydı" seç
3. "30 saniye" seç
4. Hata mesajı geliyor

**Beklenen Davranış**
Ekran kaydı başlamalı ve 30 saniye sonra video gönderilmeli.

**Gerçekleşen Davranış**
"❌ Ekran kaydı oluşturulamadı: Unknown input format: 'gdigrab'" hatası.

**Sistem Bilgileri**
- OS: Windows 10 Pro (Build 19045)
- Node.js: v18.16.0
- RootBot: v2.0.0
- FFmpeg: N-55702-g920046a (2013 sürümü)

**Log Çıktısı**
```
[2025-01-15T18:08:17.428Z] [ERROR] FFmpeg error: Unknown input format: 'gdigrab'
```

**Ekran Görüntüleri**
(Screenshot'ları buraya ekleyin)

**Ek Notlar**
FFmpeg eski sürüm, güncel versiyon yüklenince düzelir mi?
```

### Feature Request

```markdown
**Özellik Açıklaması**
Spotify entegrasyonu - Şu an çalan şarkıyı gösterme ve kontrol etme

**Problem**
Spotify'ı uzaktan kontrol etmek istiyorum ama şu an sadece medya tuşları çalışıyor.

**Önerilen Çözüm**
Spotify Web API kullanarak:
- Şu an çalan şarkıyı göster (başlık, sanatçı, albüm)
- Çalma/Duraklat
- Sonraki/Önceki şarkı
- Ses seviyesi kontrolü
- Playlist listesi

**Alternatifler**
Spotify CLI tool kullanılabilir

**Ek Bilgi**
Spotify Developer hesabı gerekli, API token alınmalı.
```

---

## Modül Ekleme

### Yeni Servis Modülü Ekleme Adımları

#### 1. Servis Dosyası Oluştur

```bash
# src/services/spotifyService.js
touch src/services/spotifyService.js
```

#### 2. Servis Kodunu Yaz

```javascript
// src/services/spotifyService.js
const SpotifyWebApi = require('spotify-web-api-node');
const logger = require('../utils/logger');

// Spotify client oluştur
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

/**
 * Şu an çalan şarkıyı al
 */
async function getCurrentTrack() {
    try {
        const data = await spotifyApi.getMyCurrentPlayingTrack();

        if (!data.body || !data.body.item) {
            return '⏸️ Şu anda hiçbir şey çalmıyor.';
        }

        const track = data.body.item;
        const artists = track.artists.map(a => a.name).join(', ');

        return `🎵 *Şimdi Çalıyor*\n\n` +
               `🎤 *Şarkı:* ${track.name}\n` +
               `👤 *Sanatçı:* ${artists}\n` +
               `💿 *Albüm:* ${track.album.name}\n` +
               `⏱️ *Süre:* ${Math.floor(track.duration_ms / 1000 / 60)}:${Math.floor((track.duration_ms / 1000) % 60)}`;
    } catch (error) {
        logger.error('Spotify getCurrentTrack error:', error);
        return '❌ Spotify bilgisi alınamadı: ' + error.message;
    }
}

/**
 * Çalma/Duraklat toggle
 */
async function togglePlayPause() {
    try {
        const state = await spotifyApi.getMyCurrentPlaybackState();

        if (state.body.is_playing) {
            await spotifyApi.pause();
            return '⏸️ Spotify duraklatıldı.';
        } else {
            await spotifyApi.play();
            return '▶️ Spotify başlatıldı.';
        }
    } catch (error) {
        logger.error('Spotify togglePlayPause error:', error);
        return '❌ Spotify kontrol hatası: ' + error.message;
    }
}

module.exports = {
    getCurrentTrack,
    togglePlayPause
};
```

#### 3. Menü Ekle

```bash
# src/menus/spotifyMenu.js
touch src/menus/spotifyMenu.js
```

```javascript
// src/menus/spotifyMenu.js
function getSpotifyMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ['🎵 Şimdi Çalıyor', '⏯️ Çal/Duraklat'],
                ['⏭️ Sonraki Şarkı', '⏮️ Önceki Şarkı'],
                ['🔼 Ses Arttır', '🔽 Ses Azalt'],
                ['📋 Playlistler', '❤️ Beğen'],
                ['🔙 Ana Menü']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
}

async function sendSpotifyMenu(bot, chatId) {
    try {
        const message = '🎵 *Spotify Kontrolü*\n\nSpotify\'ı uzaktan kontrol edin:';
        const keyboard = getSpotifyMenuKeyboard();

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Spotify menu error:', error);
        await bot.sendMessage(chatId, '❌ Menü gönderilemedi.');
    }
}

module.exports = {
    getSpotifyMenuKeyboard,
    sendSpotifyMenu
};
```

#### 4. Ana Menüye Ekle

```javascript
// src/menus/mainMenu.js
function getMainMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                // ... mevcut butonlar
                ['🎵 Spotify', '🎨 Eğlence'], // Yeni satır
                // ...
            ]
        }
    };
}
```

#### 5. Message Handler'a Ekle

```javascript
// src/handlers/messageHandler.js

// Import ekle
const { sendSpotifyMenu } = require('../menus/spotifyMenu');
const spotifyService = require('../services/spotifyService');

// Handler'a ekle
async function handleMessage(msg) {
    // ... mevcut kod

    // Ana menü butonları
    if (text === '🎵 Spotify') {
        await sendSpotifyMenu(bot, chatId);
    }

    // Spotify komutları
    else if (text === '🎵 Şimdi Çalıyor') {
        const track = await spotifyService.getCurrentTrack();
        await bot.sendMessage(chatId, track, { parse_mode: 'Markdown' });
    } else if (text === '⏯️ Çal/Duraklat') {
        const result = await spotifyService.togglePlayPause();
        await bot.sendMessage(chatId, result);
    }

    // ... diğer handler'lar
}
```

#### 6. Dependencies Ekle

```bash
npm install spotify-web-api-node --save
```

```json
// package.json
{
  "dependencies": {
    // ... mevcut dependencies
    "spotify-web-api-node": "^5.0.2"
  }
}
```

#### 7. .env.example Güncelle

```env
# .env.example

# ... mevcut değişkenler

# ===== Spotify Configuration (Optional) =====
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

#### 8. README Güncelle

```markdown
## Spotify Entegrasyonu (Opsiyonel)

### Kurulum

1. Spotify Developer hesabı oluşturun
2. Yeni uygulama oluşturun: https://developer.spotify.com/dashboard
3. Client ID ve Client Secret alın
4. .env dosyasına ekleyin

### Özellikler

- 🎵 Şimdi çalan şarkıyı gösterme
- ⏯️ Çalma/Duraklat
- ⏭️ Sonraki/Önceki şarkı
- 🔊 Ses kontrolü
- 📋 Playlist yönetimi
```

#### 9. Test Et

```bash
npm start

# Telegram'dan test et:
# 1. "🎵 Spotify" butonuna bas
# 2. "🎵 Şimdi Çalıyor" dene
# 3. "⏯️ Çal/Duraklat" dene
# 4. Log dosyasını kontrol et
```

#### 10. Commit & PR

```bash
git add .
git commit -m "feat(spotify): Add Spotify integration

- Add spotifyService with getCurrentTrack and togglePlayPause
- Add Spotify menu with playback controls
- Add Spotify Web API dependency
- Update README with Spotify setup instructions

Implements #45"

git push origin feature/spotify-integration
```

---

## Code Review Checklist

### Self-Review (Kendinizi Kontrol Edin)

- [ ] Kod çalışıyor ve test edildi
- [ ] Hata yönetimi var (try/catch)
- [ ] Log eklendi (önemli işlemler için)
- [ ] Kullanıcı dostu mesajlar (Türkçe)
- [ ] Dokümantasyon güncellendi
- [ ] .env.example güncellendi (yeni değişken varsa)
- [ ] Gereksiz console.log temizlendi
- [ ] Yorum satırları anlamlı
- [ ] Naming convention uygun (camelCase)
- [ ] Modüler yapı korundu
- [ ] Mevcut kodu bozmadı

### Reviewer Checklist (İnceleyenler İçin)

- [ ] Kod okunabilir ve anlaşılır
- [ ] Best practices uygulanmış
- [ ] Security concern yok
- [ ] Performance problemi yok
- [ ] Breaking change yok (veya dokümante edilmiş)
- [ ] Test coverage yeterli
- [ ] Commit mesajları düzgün
- [ ] PR açıklaması detaylı

---

## Kaynaklar

### Faydalı Linkler

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Markdown Guide](https://www.markdownguide.org/)

### İletişim

- GitHub Issues: Sorularınız için
- GitHub Discussions: Tartışmalar için
- Pull Request: Kod inceleme için

---

**Teşekkürler! 🎉**

Katkılarınız RootBot'u daha iyi yapıyor!
