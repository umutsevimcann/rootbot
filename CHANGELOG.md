# Changelog

RootBot'un sürüm geçmişi.

## [2.0.0] - 2025-01-15

### 🎉 Büyük Değişiklikler

#### Modüler Mimari
- **4600 satırlık tek dosyadan 29 modüle geçiş**
- Servisler, menüler, handler'lar ayrı dosyalarda
- Daha kolay bakım ve geliştirme
- Daha iyi kod organizasyonu

#### Klasör Yapısı
```
src/
├── bot/           # Bot core
├── config/        # Yapılandırma
├── handlers/      # Mesaj işleyiciler
├── menus/         # Telegram menüleri
├── services/      # İş mantığı
└── utils/         # Yardımcı fonksiyonlar
```

### ✨ Yeni Özellikler

#### Ses Kontrolü İyileştirmeleri
- **DirectSound API** ile tam ses kontrolü
- %0, %50, %100 sabit seviyeler **TAM OLARAK** çalışıyor
- Ses arttır/azalt artık **+2/-2** (önceden +4/-4)
- Text-to-Speech sesli komutlar (8 farklı mesaj + özel)
- Ses cihazları listeleme
- Cihaz değiştirme paneli

#### Ekran & Webcam İyileştirmeleri
- **Gerçek zamanlı FFmpeg video kaydı** (gdigrab)
- PowerShell fallback (eski FFmpeg için)
- Webcam video kaydı (DirectShow + fallback)
- Screenshot optimizasyonu
- Video boyut limiti kontrolü (50 MB)

#### Güvenlik & Ağ
- Website engelleme (hosts dosyası)
- Website engel kaldırma
- Admin yetki kontrolü
- UAC elevation desteği
- Antivirüs detaylı bilgi (imza versiyonu, son tarama)

#### Sistem İyileştirmeleri
- Parlaklık hata mesajı sadeleştirildi
- Disk analizi ilerleme mesajı
- Sistem menüsü temizlendi (gereksiz özellikler kaldırıldı)
- Program listesi TXT export

#### Performans & İzleme
- Gerçek zamanlı performans grafikleri (ASCII)
- 30 saniyelik veri toplama
- CPU, RAM, Disk, Network izleme
- Otomatik cleanup

### 🐛 Düzeltilen Hatalar

#### Kritik Düzeltmeler
- **PC açılışında otomatik kapanma sorunu** düzeltildi
  - Bot başlangıç zamanı kaydı (`botStartTime`)
  - Eski mesaj filtreleme (`isMessageTooOld()`)
  - Bot kapalıyken gönderilen mesajlar işlenmiyor

#### Emoji & Handler Sorunları
- Website engelle/kaldır emoji uyumsuzluğu düzeltildi
- Emoji Unicode variant farkları çözüldü
- Text içeriği ile de kontrol eklendi

#### FFmpeg Fallback
- gdigrab hatası yakalama iyileştirildi
- PowerShell fallback otomatik devreye giriyor
- Kullanıcıya bilgilendirme mesajı gösteriliyor

#### Ses Kontrolleri
- Volume arttır/azalt loop hatası düzeltildi (4 yerine 2)
- DirectSound API ile exact volume control
- Cihaz değiştir hata mesajı düzeltildi
- Sesli komut timeout eklendi (30 saniye)

#### Çift Bot Instance
- 409 Conflict hatası çözüldü
- Process kontrolü eklendi
- Kullanıcı uyarısı eklendi

### 🔒 Güvenlik İyileştirmeleri

#### Yetkilendirme
- User ID kontrol mekanizması güçlendirildi
- Her mesajda auth kontrolü
- Yetkisiz erişim loglanıyor

#### Eski Mesaj Filtreleme
- Bot başlangıç zamanı tracking
- Timestamp bazlı filtreleme
- Eski komutlar güvenlik riski oluşturmuyor

#### Admin İşlemler
- Website engelleme için yetki kontrolü
- UAC elevation ile güvenli hosts değişikliği
- Kullanıcıya yetki gereksinimi bildirimi

### 📦 Bağımlılıklar

#### Yeni Eklenenler
- `node-telegram-bot-api`: ^0.64.0
- `systeminformation`: ^5.21.22
- `screenshot-desktop`: ^1.15.0
- `node-webcam`: ^0.8.2
- `clipboardy`: ^5.0.0
- `node-notifier`: ^10.0.1
- `node-schedule`: ^2.1.1

#### Güncellemeler
- Node.js minimum sürümü: v14.0.0
- npm minimum sürümü: v6.0.0

### 📝 Dokümantasyon

#### Yeni Dosyalar
- ✅ `README.md` - Kapsamlı kurulum ve kullanım kılavuzu
- ✅ `CONTRIBUTING.md` - Katkıda bulunma rehberi
- ✅ `CHANGELOG.md` - Sürüm geçmişi (bu dosya)
- ✅ `LICENSE` - ISC Lisansı
- ✅ `.env.example` - Örnek yapılandırma dosyası
- ✅ `.gitignore` - Git ignore kuralları

#### İyileştirmeler
- Her servis fonksiyonu JSDoc ile dokümante edildi
- Kod yorumları Türkçe/İngilizce
- Inline açıklamalar eklendi
- Örnek kullanımlar

### 🛠️ Kurulum & Yapılandırma

#### Otomatik Kurulum
- `install.js` sihirbazı eklendi
- Sistem gereksinim kontrolü
- Bağımlılık otomatik yükleme
- .env dosyası oluşturma
- Otomatik başlatma ayarları
- Windows Defender/Firewall istisnaları

#### Otomatik Kaldırma
- `uninstall.js` scripti eklendi
- Otomatik başlatma temizleme
- Güvenlik ayarları kaldırma
- Geçici dosya temizleme
- Veri koruma (opsiyonel silme)

### 🔧 Yapılandırma

#### .env Dosyası
```env
TELEGRAM_TOKEN=your_bot_token
ALLOWED_USER_ID=your_user_id
NODE_ENV=production
LOG_LEVEL=info
```

#### Ortam Değişkenleri
- `NODE_ENV`: production/development
- `LOG_LEVEL`: error/warn/info/debug
- Yeni değişkenler dokümante edildi

### 📊 İstatistikler

#### Kod Metrikleri
- **Dosya Sayısı:** 1 → 35 dosya
- **Satır Sayısı:** 4600 → ~200 satır/dosya (ortalama)
- **Modül Sayısı:** 0 → 29 modül
- **Servis Sayısı:** 0 → 18 servis
- **Menü Sayısı:** 0 → 11 menü

#### Özellik Sayısı
- **Toplam Özellik:** 100+
- **Menü Kategorisi:** 14
- **Telegram Butonu:** 150+
- **PowerShell Komutu:** 50+

### 🚀 Performans

#### İyileştirmeler
- Modüler yapı ile daha hızlı yükleme
- Lazy loading servisleri
- Optimized screenshot capture
- Daha az bellek kullanımı

#### Benchmark
- Bot başlatma: ~2 saniye
- Mesaj yanıt süresi: <500ms
- Screenshot: ~1 saniye
- Ekran kaydı (30s): ~35 saniye (kayıt + encode)

### 🐛 Bilinen Sorunlar

#### FFmpeg
- Eski FFmpeg sürümleri gdigrab desteklemiyor
- Fallback PowerShell kullanılıyor (10 FPS)
- Modern FFmpeg önerilir (30 FPS)

#### Sesli Komutlar
- Windows TTS sesi sisteme bağlı
- Türkçe ses eksikse İngilizce konuşuyor
- Alternatif SAPI.SpVoice fallback var

#### Website Engelleme
- Admin yetkisi gerekiyor
- Node.js "Yönetici olarak çalıştır" ile başlatılmalı
- UAC elevation kullanıcı onayı istiyor

### 📅 Gelecek Planlar

#### v2.1.0 (Yakında)
- [ ] Spotify tam entegrasyonu
- [ ] Cloud storage desteği (Google Drive, OneDrive)
- [ ] Çoklu kullanıcı desteği (whitelist)
- [ ] Web UI (tarayıcıdan yönetim)
- [ ] Mobile app support research

#### v2.2.0
- [ ] Voice command improvements
- [ ] Advanced automation (IFTTT benzeri)
- [ ] Network monitoring iyileştirmesi
- [ ] Battery optimization
- [ ] System tray icon

#### v3.0.0 (Uzun Vadeli)
- [ ] Electron app (standalone)
- [ ] Multi-language support (İngilizce)
- [ ] Plugin sistemi
- [ ] REST API
- [ ] Grafik performans dashboard

### 🙏 Teşekkürler

Bu sürümde katkıda bulunan herkese teşekkürler!

- **Umut Sevimcan** - Modüler refactoring, tüm yeni özellikler
- **Kullanıcı Geri Bildirimleri** - Bug raporları ve öneriler

---

## [1.0.0] - 2024-09-01 (Arşiv)

### İlk Sürüm
- Tek dosya mimarisi (`main_old_4600lines.js`)
- Temel özellikler
  - Sistem bilgileri
  - Güç yönetimi
  - Ekran görüntüsü
  - Webcam fotoğraf
  - Ses kontrolü (basit)
  - Dosya yönetimi
- Telegram bot entegrasyonu
- PowerShell komutları

---

## Semantic Versioning

RootBot [Semantic Versioning 2.0.0](https://semver.org/) kullanır.

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (uyumsuz API değişiklikleri)
- **MINOR:** Yeni özellikler (geriye uyumlu)
- **PATCH:** Bug fixes (geriye uyumlu)

**Örnekler:**
- `2.0.0` → `2.0.1`: Bug fix
- `2.0.1` → `2.1.0`: Yeni özellik
- `2.1.0` → `3.0.0`: Breaking change

---

## Kategoriler

- **🎉 Added** - Yeni özellikler
- **🔧 Changed** - Mevcut özelliklerde değişiklikler
- **⚠️ Deprecated** - Yakında kaldırılacak özellikler
- **❌ Removed** - Kaldırılan özellikler
- **🐛 Fixed** - Bug düzeltmeleri
- **🔒 Security** - Güvenlik düzeltmeleri

---

Güncel sürüm: **v2.0.0** (2025-01-15)
