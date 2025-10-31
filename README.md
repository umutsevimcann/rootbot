# RootBot

🤖 **Windows PC Remote Control via Telegram** | 100+ Features | Modular Architecture | Turkish Documentation

Telegram üzerinden Windows bilgisayarınızı uzaktan kontrol edin. Güçlü özellikler, modüler mimari ve güvenli tasarım ile tam kontrol.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Kurulum](#-kurulum)
- [Yapılandırma](#-yapılandırma)
- [Kullanım](#-kullanım)
- [Kaldırma](#-kaldırma)
- [Güvenlik](#-güvenlik)
- [Proje Yapısı](#-proje-yapısı)
- [Gereksinimler](#-gereksinimler)
- [Sorumluluk Reddi](#️-sorumluluk-reddi)

---

## 🚀 Özellikler

### 💻 Sistem Yönetimi
- **Sistem Bilgileri**: CPU, RAM, Disk, İşletim Sistemi bilgileri
- **Performans İzleme**: Gerçek zamanlı CPU/RAM/Disk kullanımı
- **Sıcaklık Sensörleri**: Donanım sıcaklık takibi
- **Disk Yönetimi**: Disk analizi ve temp dosya temizleme
- **Güç Yönetimi**: Shutdown, Restart, Sleep, Hibernate
- **Ekran Kilidi**: Uzaktan lock/unlock
- **Performans Grafikleri**: 10 saniye aralıklarla veri toplama

### 📁 Dosya Yönetimi
- **Akıllı Dosya Gezgini**: Klasörler arası kolay navigasyon
- **Dosya İşlemleri**: Oku, Sil, Oluştur, Bilgi Al
- **Dosya Yükleme**: Telegram'dan PC'ye hedef klasöre yükleme
- **Dosya İndirme**: PC'den Telegram'a dosya gönderme (max 50MB)
- **Dosya Arama**: İsme göre tüm disklerde arama
- **Son Kullanılanlar**: Windows recent dosyaları listesi
- **Dinamik Disk Desteği**: Tüm diskler otomatik tespit (C:, D:, E:, vb.)

### 🎥 Medya & Görüntü
- **Ekran Görüntüsü**: Tek veya tüm monitörler
- **Ekran Kaydı**: 30 saniyeye kadar video kaydı
- **Webcam**: Fotoğraf ve video kaydı
- **Otomatik Temizlik**: Kayıtlar otomatik silinir

### 🔊 Ses Kontrolü
- **Ses Seviyesi**: Artır, Azalt, Mute/Unmute
- **Özel Seviye**: 0-100 arası tam kontrol
- **Ses Cihazları**: Aktif cihazları listele
- **Text-to-Speech**: Metni sesli okutma

### 🎯 Program Yönetimi
- **Program Başlat**: İsme göre program çalıştır
- **Program Kapat**: Process kill işlemi
- **Çalışan Programlar**: Tüm aktif süreçler
- **Startup Programları**: Otomatik başlayan uygulamalar
- **Yüklü Programlar**: Sistemdeki tüm yazılımlar
- **Windows Servisleri**: Çalışan servis listesi
- **Komut Çalıştırma**: PowerShell/CMD komutları

### ⏰ Otomasyon
- **Zamanlanmış Görevler**: Cron syntax ile görev zamanlama
- **Görev Yönetimi**: Aktif görevleri listeleme ve iptal
- **Tekrarlayan Görevler**: Periyodik işlemler

### 📊 İzleme (Monitoring)
- **USB İzleme**: Takılan/çıkarılan USB cihazları
- **Batarya İzleme**: Düşük batarya uyarıları
- **Network İzleme**: Ağ değişikliği bildirimleri
- **CPU İzleme**: Yüksek CPU kullanım uyarısı
- **İnternet Kontrolü**: Bağlantı durumu

### 📋 Pano (Clipboard)
- **Pano Geçmişi**: Son 20 kopyalanan metin
- **Pano Okuma/Yazma**: Uzaktan kopyala-yapıştır
- **Pano Temizleme**: Geçmiş silme

### 🛡️ Güvenlik
- **Tek Kullanıcı Yetkilendirme**: Sadece belirlenen Telegram ID
- **Path Traversal Koruması**: Dizin geçişi engelleme (CWE-22)
- **Command Injection Koruması**: Komut enjeksiyonu önleme
- **MFA Desteği**: Çok faktörlü kimlik doğrulama (opsiyonel)
- **Güvenli Dosya İşlemleri**: Whitelist tabanlı path validation

---

## 📦 Kurulum

### Adım 1: Gereksinimler

Sisteminizde şunlar yüklü olmalı:
- **Node.js** (16 veya üzeri) - [İndir](https://nodejs.org/)
- **Git** - [İndir](https://git-scm.com/)
- **Windows 10/11** işletim sistemi
- **PowerShell** (Windows'ta varsayılan olarak var)

### Adım 2: Telegram Bot Oluşturma

1. Telegram'da [@BotFather](https://t.me/BotFather) ile konuşun
2. `/newbot` komutunu gönderin
3. Bot adını ve kullanıcı adını belirleyin
4. Size verilen **Bot Token**'ı kaydedin (örnek: `1234567890:ABCdefGhIJKlmNoPQRstuVWXyz`)

### Adım 3: Telegram User ID Öğrenme

1. [@userinfobot](https://t.me/userinfobot) ile konuşun
2. Size verilen **User ID**'yi kaydedin (örnek: `123456789`)

### Adım 4: Projeyi İndirme

```bash
git clone https://github.com/umutsevimcann/rootbot.git
cd rootbot
```

### Adım 5: Bağımlılıkları Yükleme

```bash
npm install
```

### Adım 6: Yapılandırma

Proje klasöründe `.env` dosyası oluşturun:

```env
# Telegram Bot Token (BotFather'dan aldığınız)
TELEGRAM_TOKEN=1234567890:ABCdefGhIJKlmNoPQRstuVWXyz

# Telegram User ID (userinfobot'tan aldığınız)
ALLOWED_USER_ID=123456789

# Opsiyonel
NODE_ENV=production
LOG_LEVEL=info
```

**UYARI**: `.env` dosyasını asla paylaşmayın veya GitHub'a yüklemeyin!

### Adım 7: Botu Başlatma

```bash
npm start
```

Bot başladığında Telegram'a bildirim gelecektir. Artık botunuzu kullanabilirsiniz!

### Adım 8: Windows Başlangıcında Otomatik Başlatma (Opsiyonel)

1. **Kurulum scriptini çalıştırın**:
```bash
node install.js
```

2. Script size şunları soracak:
   - Bot token ve user ID (`.env` dosyasından okur)
   - Windows başlangıcına eklensin mi?
   - Sistem servisi olarak çalışsın mı?

3. Onaylarsanız, bot her Windows açılışında otomatik başlayacak.

---

## ⚙️ Yapılandırma

### Environment Variables

`.env` dosyasında yapılandırabileceğiniz tüm değişkenler:

| Değişken | Açıklama | Zorunlu | Varsayılan |
|----------|----------|---------|------------|
| `TELEGRAM_TOKEN` | Telegram bot token | ✅ Evet | - |
| `ALLOWED_USER_ID` | Yetkili Telegram kullanıcı ID | ✅ Evet | - |
| `NODE_ENV` | Ortam (development/production) | ❌ Hayır | `development` |
| `LOG_LEVEL` | Log seviyesi (info/debug/error) | ❌ Hayır | `info` |

### Güvenlik Ayarları

Path validator ([src/utils/pathValidator.js](src/utils/pathValidator.js)) izin verilen dizinleri kontrol eder:

```javascript
// İzin verilen dizinler
- Tüm disk sürücüleri (C:\, D:\, E:\, ...)
- C:\Users
- C:\Temp
- C:\Downloads
- {proje}/downloads
- {proje}/recordings
- {proje}/screenshots
- {proje}/webcam
```

---

## 📱 Kullanım

### Bot Menüsü

Bot başladıktan sonra Telegram'dan herhangi bir mesaj gönderin. Ana menü görünecektir:

```
🖥 RootBot - Sistem Kontrol Merkezi

Merhaba! Bilgisayarınızı uzaktan kontrol edebilirsiniz.

Anlık Durum:
✅ Bilgisayar şu anda açık
⏰ Son kontrol: XX:XX:XX

Menü Seçenekleri:
├─ Sistem
├─ Dosya
├─ Güvenlik
├─ Ses
├─ Otomasyon
└─ Performans
```

### Örnek Kullanım Senaryoları

#### 1. Dosya Yükleme (Evden Telegram'a, İşte PC'ye)
```
1. "Dosya" → "Gözat" → "Masaüstü"
2. Klasöre gir
3. "Dosya Yükle" butonuna bas
4. Telegram'dan dosya gönder
5. Dosya direkt o klasöre kaydedilir
```

#### 2. Ekran Görüntüsü Alma
```
1. "Sistem" → "Ekran Görüntüsü"
2. Tüm monitörlerden screenshot alınır
3. Telegram'a gönderilir
```

#### 3. Uzaktan Shutdown
```
1. "Sistem" → "Kapat"
2. Süre seç (Hemen / 1-60 dakika)
3. Onay ver
```

#### 4. Program Başlatma
```
1. "Sistem" → "Program Başlat"
2. Program adını yaz (örn: "notepad", "chrome")
3. Program açılır
```

---

## 🗑️ Kaldırma

### Yöntem 1: Uninstall Script (Önerilen)

```bash
node uninstall.js
```

Bu script:
- Windows başlangıç görevini kaldırır
- Sistem servisini durdurur ve siler
- Tüm logları ve geçici dosyaları temizler
- `.env` dosyasını siler (opsiyonel)

### Yöntem 2: Manuel Kaldırma

1. **Botu durdur**: `Ctrl+C` ile botu kapat
2. **Başlangıç görevini kaldır**: Windows Task Scheduler'dan "RootBot" görevini sil
3. **Proje klasörünü sil**: Tüm dosyaları sil

```bash
cd ..
rmdir /s rootbot
```

---

## 🛡️ Güvenlik

### Güvenlik Özellikleri

✅ **Tek Kullanıcı Yetkilendirme**: Sadece `.env` dosyasındaki `ALLOWED_USER_ID` bot kullanabilir

✅ **Path Traversal Koruması**:
- `../` veya `..\` gibi dizin geçişleri engellenir
- Sadece whitelist'teki dizinlere erişim
- Symbolic link koruması

✅ **Command Injection Koruması**:
- Özel karakterler filtrele (`&`, `|`, `;`, `$`, `` ` ``)
- Komutlar validate edilir
- PowerShell injection önlenir

✅ **Eski Mesaj Filtresi**: Bot kapalıyken gönderilen mesajlar işlenmez

✅ **MFA Desteği**: Opsiyonel multi-factor authentication

### Güvenlik Tavsiyeleri

1. ⚠️ `.env` dosyasını asla paylaşmayın
2. ⚠️ Bot token'ı kimseyle paylaşmayın
3. ⚠️ Güvenilir ağlarda kullanın
4. ⚠️ Düzenli olarak logları kontrol edin
5. ⚠️ Botunuzu sadece kendi bilgisayarınızda kullanın

---

## 📂 Proje Yapısı

```
rootbot/
├── src/
│   ├── bot/              # Telegram bot core
│   │   └── index.js      # Bot initialization
│   ├── handlers/         # Message handlers
│   │   └── messageHandler.js
│   ├── services/         # İş mantığı servisleri
│   │   ├── systemService.js       # Sistem işlemleri
│   │   ├── fileService.js         # Dosya yönetimi
│   │   ├── mediaService.js        # Medya kontrolleri
│   │   ├── audioService.js        # Ses kontrolü
│   │   ├── programService.js      # Program yönetimi
│   │   ├── automationService.js   # Otomasyon
│   │   ├── monitoringService.js   # İzleme
│   │   ├── clipboardService.js    # Pano işlemleri
│   │   ├── securityService.js     # Güvenlik
│   │   └── ...
│   ├── ui/               # Menü sistemleri
│   │   └── menus.js      # Tüm bot menüleri
│   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── logger.js             # Loglama
│   │   ├── pathValidator.js      # Path güvenliği
│   │   ├── exec.js               # Güvenli komut çalıştırma
│   │   ├── UserStateManager.js   # Kullanıcı state yönetimi
│   │   └── ...
│   └── core/             # Core configuration
│       └── config.js     # Merkezi konfigurasyon
├── downloads/            # İndirilen dosyalar (oluşturulur)
├── recordings/           # Ekran kayıtları (oluşturulur)
├── screenshots/          # Ekran görüntüleri (oluşturulur)
├── webcam/               # Webcam görüntüleri (oluşturulur)
├── .env                  # Environment variables (siz oluşturursunuz)
├── .env.example          # Örnek env dosyası
├── .gitignore            # Git ignore kuralları
├── main.js               # Ana giriş noktası
├── install.js            # Kurulum scripti
├── uninstall.js          # Kaldırma scripti
├── package.json          # NPM bağımlılıkları
└── README.md             # Bu dosya
```

---

## 🔧 Gereksinimler

### Yazılım Gereksinimleri

| Yazılım | Versiyon | Zorunlu |
|---------|----------|---------|
| Node.js | 16.x veya üzeri | ✅ Evet |
| npm | 8.x veya üzeri | ✅ Evet |
| Windows | 10/11 | ✅ Evet |
| PowerShell | 5.1 veya üzeri | ✅ Evet |
| Git | 2.x veya üzeri | ✅ Evet (kurulum için) |

### Node.js Paketleri

```json
{
  "node-telegram-bot-api": "^0.66.0",
  "dotenv": "^17.2.3",
  "systeminformation": "^5.27.11",
  "ffmpeg-static": "^5.2.0",
  "node-webcam": "^0.8.2",
  "clipboardy": "^5.0.0",
  "node-schedule": "^2.1.1",
  "node-notifier": "^10.0.1"
}
```

Tüm paketler `npm install` ile otomatik yüklenir.

---

## ⚖️ Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## ⚠️ Sorumluluk Reddi

**ÖNEMLI**: Bu yazılım sadece **eğitim** ve **kişisel kullanım** amaçlıdır.

- ❌ Yazılımı başkasının bilgisayarında izinsiz kullanmayın
- ❌ Yasal olmayan amaçlarla kullanmayın
- ❌ Gizlilik yasalarını ihlal etmeyin
- ✅ Sadece kendi bilgisayarınızda kullanın
- ✅ Yerel yasalara uyun

**Geliştirici, bu yazılımın kötüye kullanımından kaynaklanan hiçbir sorumluluğu kabul etmez.**

Kullanıcılar, tüm uygulanabilir yasalara ve düzenlemelere uymaktan sorumludur.

---

## 📞 Destek

Sorularınız veya sorunlarınız için:

- **GitHub Issues**: [Sorun Bildir](https://github.com/umutsevimcann/rootbot/issues)
- **Belgeler**: Bu README dosyası
- **Kod İnceleme**: Kaynak kodları açık, inceleyebilirsiniz

---

## 🎯 Özellik İstekleri

Yeni özellik önerileri için GitHub Issues kullanabilirsiniz. Pull request'ler memnuniyetle karşılanır!

---

**RootBot v2.0** - Windows PC Remote Control via Telegram
