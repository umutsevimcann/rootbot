# 🤖 RootBot - Windows PC Remote Control via Telegram

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

**RootBot**, Windows bilgisayarınızı Telegram üzerinden tam kontrol etmenizi sağlayan güçlü bir uzaktan yönetim botudur. Modüler mimari ile geliştirilmiş, 100+ özellik içeren kapsamlı bir sistem kontrol merkezidir.

---

## 📋 İçindekiler

- [✨ Özellikler](#-özellikler)
- [🎯 Kullanım Senaryoları](#-kullanım-senaryoları)
- [📦 Kurulum](#-kurulum)
- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [📖 Detaylı Kullanım Kılavuzu](#-detaylı-kullanım-kılavuzu)
- [🛠️ Yapılandırma](#️-yapılandırma)
- [📂 Proje Yapısı](#-proje-yapısı)
- [🔒 Güvenlik](#-güvenlik)
- [❌ Kaldırma](#-kaldırma)
- [🐛 Sorun Giderme](#-sorun-giderme)
- [🤝 Katkıda Bulunma](#-katkıda-bulunma)
- [📄 Lisans](#-lisans)

---

## ✨ Özellikler

### 🖥️ Sistem Yönetimi
- **Sistem Bilgisi**: CPU, RAM, Disk, GPU, Anakart bilgileri
- **Sıcaklık İzleme**: CPU ve GPU sıcaklık takibi
- **Çalışan Programlar**: Aktif uygulamaları görüntüleme ve yönetme
- **Program Başlatma/Kapatma**: Uzaktan uygulama kontrolü
- **Komut Çalıştırma**: PowerShell/CMD komutları yürütme
- **Ekran Kontrolü**: Ekranı kapatma, masaüstü gösterme

### ⚡ Güç Yönetimi
- **Kapatma**: Anlık veya zamanlanmış kapatma (1dk, 5dk, 15dk, 30dk, 1 saat, özel süre)
- **Yeniden Başlatma**: Bilgisayarı yeniden başlatma
- **Uyku Modu**: Sistem uyku moduna alma
- **Kapatmayı İptal**: Zamanlanmış kapatmayı iptal etme

### 🔒 Güvenlik & İzleme
- **Antivirüs Kontrolü**: Windows Defender durumu ve detayları
- **Güvenlik Duvarı**: Firewall durumu kontrolü
- **USB Cihazları**: Bağlı USB cihazlarını listeleme
- **Aktivite İzleme**: Sistem aktivitelerini takip
- **Website Engelleme**: Domain bazlı internet engelleme (hosts dosyası)
- **Engel Kaldırma**: Engellenen siteleri kaldırma

### 💽 Disk Yönetimi
- **Disk Bilgileri**: Tüm disklerin kullanım durumu
- **Disk Kullanımı**: Detaylı disk alanı analizi
- **Disk Analizi**: Büyük dosyaları tespit etme
- **Disk Temizliği**: Geçici dosyaları temizleme
- **Geçici Dosyalar**: Temp klasörü temizleme

### 📸 Ekran & Kamera
- **Ekran Görüntüsü**: Anlık screenshot alma
- **Ekran Kaydı**: 10-60 saniye arası video kayıt (FFmpeg + PowerShell fallback)
- **Webcam Fotoğraf**: Webcam ile fotoğraf çekme
- **Webcam Video**: Webcam ile video kaydı (10 saniye)

### 🔊 Ses Kontrolü
- **Ses Açma/Kapatma**: Mute/Unmute kontrolü
- **Ses Seviyesi**: Volume Up/Down (+2/-2)
- **Sabit Seviyeler**: %0, %50, %100 direkt ayar (DirectSound API)
- **Özel Seviye**: İstediğiniz değeri yazarak ayarlama
- **Cihaz Listesi**: Ses cihazlarını listeleme
- **Cihaz Değiştir**: Ses ayarları paneli açma
- **Sesli Komutlar**: Text-to-Speech ile 8 farklı sesli mesaj
  - 🔊 Merhaba De
  - 🔊 Uyarı Ver
  - 🔊 Şaka Yap
  - 🔊 Korkut
  - 🔊 Bilgisayarı Kapatıyorum
  - 🔊 Hacker Uyarısı
  - 🔊 Motivasyon
  - 🔊 Tebrikler
  - 🔊 Özel Mesaj (kendi metninizi yazdırın)

### 🌐 Ağ Yönetimi
- **Ağ Bilgileri**: IP adresi, MAC adresi, bağlantı detayları
- **Ping Testi**: Belirtilen adrese ping atma
- **Ağ Taraması**: Yerel ağdaki cihazları tarama
- **İnternet Hızı**: Download/Upload hız testi
- **Website Engelle/Kaldır**: Hosts dosyası ile engelleme

### 📁 Dosya Yönetimi
- **Dosya Gönderme**: Telegram'dan PC'ye dosya yükleme
- **Dosya İndirme**: PC'den Telegram'a dosya gönderme
- **Dosya Listele**: Belirtilen klasördeki dosyaları listeleme
- **Dosya Sil**: Uzaktan dosya silme
- **Klasör Oluşturma**: Yeni klasör oluşturma

### 🖱️ Mouse & Klavye
- **Mouse Hareket**: X, Y koordinatlarına mouse taşıma
- **Mouse Tıklama**: Sol/Sağ/Çift tık simülasyonu
- **Klavye Girişi**: Text yazma simülasyonu
- **Scroll**: Yukarı/aşağı scroll
- **Tuş Kombinasyonları**: Ctrl+C, Ctrl+V, vb.

### 📋 Pano (Clipboard)
- **Pano İçeriği**: Panodaki metni görüntüleme
- **Panoya Kopyala**: Text kopyalama
- **Pano Geçmişi**: Son kopyalanan metinleri gösterme
- **Geçmişi Temizle**: Pano geçmişini silme
- **Otomatik İzleme**: Pano değişikliklerini anlık takip

### 📊 Performans İzleme
- **CPU Kullanımı**: Anlık CPU yükü
- **RAM Kullanımı**: Bellek kullanım detayları
- **Disk I/O**: Okuma/yazma hızları
- **Ağ Trafiği**: Download/Upload istatistikleri
- **Gerçek Zamanlı Grafik**: 30 saniyelik performans grafiği (ASCII)

### 📅 Otomasyon
- **Zamanlanmış Görevler**: Belirli saatte işlem çalıştırma
- **Tekrarlı Görevler**: Periyodik görev oluşturma (her gün/hafta)
- **Görev Listesi**: Aktif görevleri görüntüleme
- **Görev Silme**: Zamanlanmış görevi iptal etme

### 🎨 Eğlence & Medya
- **Medya Kontrolü**: Oynat/Duraklat/Sonraki/Önceki
- **Spotify Kontrolü**: Spotify oynatma kontrolü (opsiyonel)
- **Ses Efektleri**: Sistem seslerini çalma
- **Bildirim Gönderme**: Windows bildirim penceresi gösterme

### 🔔 Bildirimler
- **Test Bildirimi**: Örnek bildirim gönderme
- **Özel Bildirim**: Başlık ve mesaj ile bildirim oluşturma
- **Bildirim Geçmişi**: Gönderilen bildirimleri görüntüleme

### 👁️ İzleme Modülleri
- **Ekran İzleme**: Periyodik screenshot alma
- **Webcam İzleme**: Periyodik webcam fotoğrafı
- **USB İzleme**: USB takılma/çıkarma bildirimi
- **Ağ İzleme**: Bağlantı değişikliği takibi
- **Pil İzleme**: Şarj durumu bildirimleri
- **CPU İzleme**: Yüksek CPU kullanımı uyarısı

---

## 🎯 Kullanım Senaryoları

### 🏠 Ev Kullanıcıları
- Evdeyken ofis bilgisayarını kontrol etme
- Uzaktan dosya indirme/yükleme
- Torrent/indirme takibi
- Bilgisayarı açık bırakıp uzaktan kapatma

### 💼 İş & Ofis
- Sunucu yönetimi ve izleme
- Uzaktan bakım ve destek
- Performans takibi
- Otomatik yedekleme görevi oluşturma

### 🎓 Eğitim & Öğrenci
- Laboratuvar bilgisayarlarını uzaktan kontrol
- Render/hesaplama işlemlerini takip
- Proje dosyalarını uzaktan yönetme

### 🔒 Güvenlik & İzleme
- Evinizdeki bilgisayarı kamera ile izleme
- USB cihaz takıldığında bildirim alma
- Şüpheli aktiviteleri tespit etme
- Website erişim kontrolü

---

## 📦 Kurulum

### Ön Gereksinimler

#### Zorunlu
- **Windows 10/11** (64-bit)
- **Node.js** v14.0.0 veya üzeri ([İndir](https://nodejs.org/))
- **npm** (Node.js ile birlikte gelir)
- **Telegram Hesabı** ve **Bot Token**

#### Opsiyonel (Tam özellik için önerilir)
- **FFmpeg** ([İndir](https://ffmpeg.org/download.html)) - Ekran ve webcam video kaydı için
- **PowerShell 5.0+** (Windows 10/11'de varsayılan)
- **Yönetici Yetkileri** - Bazı özellikler için (website engelleme, sistem servisleri vb.)

---

### Adım 1: Telegram Bot Oluşturma

1. Telegram'da [@BotFather](https://t.me/BotFather) botunu açın
2. `/newbot` komutunu gönderin
3. Bot için bir isim girin (örn: `My PC Control Bot`)
4. Bot için benzersiz bir kullanıcı adı girin (örn: `my_pc_control_bot`)
5. BotFather size bir **Token** verecek (örn: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Bu token'ı kaydedin! ⚠️

### Adım 2: Telegram User ID Bulma

1. Telegram'da [@userinfobot](https://t.me/userinfobot) botunu açın
2. Bota herhangi bir mesaj gönderin
3. Size **User ID** numaranızı verecek (örn: `987654321`)
4. Bu ID'yi kaydedin! ⚠️

### Adım 3: Projeyi İndirme

#### Git ile (Önerilen)
```bash
git clone https://github.com/umutseviimcan/rootbot.git
cd rootbot
```

#### Manuel İndirme
1. [Releases](https://github.com//umutseviimcan/rootbot/releases) sayfasından son sürümü indirin
2. ZIP dosyasını çıkarın
3. Çıkarılan klasöre gidin

### Adım 4: Otomatik Kurulum

```bash
node install.js
```

**Kurulum sihirbazı şunları yapacak:**
1. ✅ Sistem gereksinimlerini kontrol eder
2. ✅ npm bağımlılıklarını yükler
3. ✅ `.env` dosyasını oluşturur (Bot Token ve User ID sorar)
4. ✅ Gerekli klasörleri oluşturur (`logs/`, `data/`, `screenshots/`, vb.)
5. ✅ Otomatik başlatma ayarlarını sorar (opsiyonel)
6. ✅ Windows Defender ve Firewall istisnaları ekler (opsiyonel)
7. ✅ FFmpeg kontrolü yapar

**Kurulum çıktısı örneği:**
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║          🤖 RootBot v2.0 Kurulum Sihirbazı           ║
║     Windows PC Remote Control Telegram Bot           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

🔍 Sistem Kontrolü
──────────────────────────────────────────────────────
✓ Windows 11 (Build 22631)
✓ Node.js v18.16.0
✓ npm v9.5.1
✓ FFmpeg yüklü
✓ PowerShell aktif
✓ Yönetici yetkileri mevcut

──────────────────────────────────────────────────────

Kuruluma devam edilsin mi? (e/h): e

📦 Bağımlılıklar Kontrol Ediliyor
──────────────────────────────────────────────────────
✓ node_modules mevcut

📁 Klasör Yapısı Oluşturuluyor
──────────────────────────────────────────────────────
✓ logs/ oluşturuldu
✓ data/ oluşturuldu
✓ temp/ oluşturuldu
✓ screenshots/ oluşturuldu
✓ recordings/ oluşturuldu
✓ webcam/ oluşturuldu

📝 Telegram Bot Yapılandırması
──────────────────────────────────────────────────────
Telegram Bot Token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
Telegram Kullanıcı ID: 987654321
✓ .env dosyası oluşturuldu

🚀 Otomatik Başlatma Yapılandırması
──────────────────────────────────────────────────────
Windows başlangıcında otomatik başlatılsın mı? (e/h): e
✓ start_rootbot.bat oluşturuldu
✓ Başlangıç klasörüne VBS eklendi
✓ Registry kaydı eklendi
✓ Otomatik başlatma yapılandırıldı

🔒 Güvenlik Ayarları
──────────────────────────────────────────────────────
Güvenlik ayarları yapılandırılsın mı? (e/h): e
Windows Defender istisnası eklensin mi? (e/h): e
✓ Windows Defender istisnası eklendi
Güvenlik duvarı istisnası eklensin mi? (e/h): e
✓ Güvenlik duvarı istisnası eklendi

🎬 FFmpeg Kontrolü
──────────────────────────────────────────────────────
✓ FFmpeg zaten yüklü

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║            ✅ KURULUM BAŞARIYLA TAMAMLANDI!          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📝 Sonraki Adımlar:
  1. npm start         → Botu başlat
  2. Telegram'dan test et → /start komutunu gönder
  3. Logs klasörünü kontrol et → Hata varsa incele

📚 Kullanışlı Komutlar:
  npm start            → Botu başlat
  npm run dev          → Development modda çalıştır
  npm run clean        → Geçici dosyaları temizle

💡 İpuçları:
  • Bot çalışırken Telegram'dan /help yazarak yardım alabilirsiniz
  • Sorun yaşarsanız logs/rootbot.log dosyasını kontrol edin
  • .env dosyasından ayarları değiştirebilirsiniz

🎉 RootBot kullanıma hazır!
```

### Adım 5: Manuel Kurulum (Alternatif)

Otomatik kurulum yerine manuel kurulum yapmak isterseniz:

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyası oluştur
# Dosya içeriği:
TELEGRAM_TOKEN=your_bot_token_here
ALLOWED_USER_ID=your_user_id_here
NODE_ENV=production
LOG_LEVEL=info

# 3. Klasörleri oluştur
mkdir logs data temp screenshots recordings webcam

# 4. Botu başlat
npm start
```

---

## 🚀 Hızlı Başlangıç

### Botu Başlatma

```bash
# Normal başlatma
npm start

# Development mode (debug logları ile)
NODE_ENV=development npm start

# Arka planda çalıştırma (Windows)
start /B node main.js

# PM2 ile çalıştırma (önerilen)
npm install -g pm2
pm2 start main.js --name rootbot
pm2 save
pm2 startup
```

### İlk Kullanım

1. **Botu başlatın:**
   ```bash
   npm start
   ```

2. **Başlatma mesajını kontrol edin:**
   ```
   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║           🤖 RootBot v2.0            ║
   ║   Windows PC Remote Control Bot       ║
   ║                                       ║
   ║   Modüler Mimari - Windows 10/11     ║
   ║                                       ║
   ╚═══════════════════════════════════════╝

   ✓ Bot çalışıyor...
   ✓ Telegram'dan komut bekliyor...

   Botunuzu durdurmak için Ctrl+C tuşlayın.
   ```

3. **Telegram'dan test edin:**
   - Telegram'da botunuza `/start` gönderin
   - Ana menü gelecek:
   ```
   🚀 RootBot - Sistem Kontrol Merkezi

   Merhaba! Bilgisayarınızı uzaktan kontrol edebilirsiniz.

   📱 Anlık Durum:
   🔓 Bilgisayar şu anda açık
   ⏰ Son kontrol: 18:45:38

   Lütfen aşağıdaki menüden bir seçenek seçin:
   ```

4. **İlk komutunuzu deneyin:**
   - `🖥️ Sistem` → `📊 Sistem Bilgisi` seçeneğine tıklayın
   - Bilgisayarınızın detaylı bilgilerini göreceksiniz!

### Botu Durdurma

```bash
# Normal durdurma (Ctrl+C)
# Veya

# PM2 ile durdurma
pm2 stop rootbot

# Tüm PM2 process'lerini durdurma
pm2 stop all
```

### Botu Yeniden Başlatma

```bash
# Normal
# Önce Ctrl+C ile durdurun, sonra npm start

# PM2 ile
pm2 restart rootbot

# PM2 tüm process'ler
pm2 restart all
```

---

## 📖 Detaylı Kullanım Kılavuzu

### 🖥️ Sistem Menüsü

#### Sistem Bilgisi
- **Kullanım:** `🖥️ Sistem` → `📊 Sistem Bilgisi`
- **Gösterilen Bilgiler:**
  - İşletim Sistemi (Windows sürümü, build)
  - CPU (model, çekirdek sayısı, hız)
  - RAM (toplam, kullanılan, boş)
  - GPU (model, bellek)
  - Anakart (üretici, model)
  - Açık kalma süresi

#### Sıcaklık İzleme
- **Kullanım:** `🖥️ Sistem` → `🌡️ Sıcaklık`
- **Gösterilen Bilgiler:**
  - CPU sıcaklığı (°C)
  - GPU sıcaklığı (°C)
  - Anakart sıcaklığı
  - Disk sıcaklıkları
- **Not:** Sıcaklık sensörü desteği donanıma bağlıdır

#### Çalışan Programlar
- **Kullanım:** `🖥️ Sistem` → `💻 Çalışan Programlar`
- **Gösterilen Bilgiler:**
  - Tüm aktif pencereler
  - Program adları
  - Process ID'leri
- **Kullanım:** Program kapatmak için ID numarasını not edin

#### Program Başlatma
- **Kullanım:** `🖥️ Sistem` → `🚀 Program Başlat`
- **Adımlar:**
  1. Butona tıklayın
  2. Program adını veya yolunu yazın
  3. Örnekler:
     - `notepad` (Notepad açar)
     - `chrome` (Chrome açar)
     - `C:\Program Files\App\app.exe` (Tam yol ile)

#### Program Kapatma
- **Kullanım:** `🖥️ Sistem` → `❌ Program Kapat`
- **Adımlar:**
  1. Önce "Çalışan Programlar" ile process ID'sini öğrenin
  2. "Program Kapat" seçeneğine tıklayın
  3. Process ID veya program adını yazın
  4. Program kapatılır

#### Komut Çalıştırma
- **Kullanım:** `🖥️ Sistem` → `💻 Komut Çalıştır`
- **Adımlar:**
  1. Butona tıklayın
  2. PowerShell veya CMD komutunu yazın
  3. Komut çalıştırılır ve çıktı gösterilir
- **Örnekler:**
  - `ipconfig` (Ağ bilgilerini gösterir)
  - `dir C:\` (C:\ içeriğini listeler)
  - `tasklist` (Tüm process'leri listeler)
  - `systeminfo` (Sistem bilgilerini gösterir)

---

### ⚡ Güç Menüsü

#### Hemen Kapat
- **Kullanım:** `⚡ Güç` → `⚡ Kapat` → `⚡ Hemen Kapat`
- **Sonuç:** Bilgisayar anında kapatılır (0 saniye gecikme)
- **⚠️ Uyarı:** Kaydedilmemiş işler kaybolur!

#### Zamanlanmış Kapatma
- **Kullanım:** `⚡ Güç` → `⚡ Kapat` → Süre seç
- **Seçenekler:**
  - ⏰ 1 Dakika
  - ⏰ 5 Dakika
  - ⏰ 15 Dakika
  - ⏰ 30 Dakika
  - ⏰ 1 Saat
  - ⏰ Özel Süre (dakika cinsinden yazarsınız)
- **Örnek:** 45 dakika sonra kapatmak için "Özel Süre" → `45`

#### Kapatmayı İptal
- **Kullanım:** `⚡ Güç` → `❌ Kapatmayı İptal Et`
- **Sonuç:** Zamanlanmış kapatma iptal edilir

#### Yeniden Başlatma
- **Kullanım:** `⚡ Güç` → `🔄 Yeniden Başlat`
- **Sonuç:** Bilgisayar yeniden başlatılır

#### Uyku Modu
- **Kullanım:** `⚡ Güç` → `💤 Uyku Modu`
- **Sonuç:** Bilgisayar uyku moduna geçer

---

### 🔒 Güvenlik Menüsü

#### Antivirüs Kontrolü
- **Kullanım:** `🔒 Güvenlik` → `🧬 Antivirüs`
- **Gösterilen Bilgiler:**
  - Windows Defender durumu (Aktif/Pasif)
  - İmza versiyonu
  - Son tarama zamanı
  - Sistem koruma durumu

#### Website Engelleme
- **Kullanım:** `🔒 Güvenlik` → `🌐 Website Engelle`
- **Adımlar:**
  1. Butona tıklayın
  2. Engellenecek domain adını yazın (örn: `facebook.com`)
  3. Hem `facebook.com` hem de `www.facebook.com` engellenir
  4. DNS cache temizlenir
- **⚠️ Not:** Node.js'i "Yönetici olarak çalıştır" ile başlatmalısınız!

#### Engel Kaldırma
- **Kullanım:** `🔒 Güvenlik` → `🌐 Engeli Kaldır`
- **Adımlar:**
  1. Butona tıklayın
  2. Kaldırılacak domain adını yazın
  3. Engel hosts dosyasından silinir

#### USB Cihazları
- **Kullanım:** `🔒 Güvenlik` → `🔌 USB Cihazları`
- **Gösterilen Bilgiler:**
  - Bağlı tüm USB cihazlar
  - Cihaz adları
  - Sürücü harfleri

---

### 📸 Ekran & Kamera Menüsü

#### Ekran Görüntüsü
- **Kullanım:** `📸 Ekran` → `📸 Ekran Görüntüsü`
- **Sonuç:** Anlık ekran görüntüsü PNG olarak Telegram'a gönderilir
- **Format:** Full HD (ekran çözünürlüğünde)

#### Ekran Kaydı
- **Kullanım:** `📸 Ekran` → `🎥 Ekran Kaydı`
- **Adımlar:**
  1. Butona tıklayın
  2. Süre seçin (10, 30, 60 saniye)
  3. Kayıt başlar
  4. Bekleme süresi sonunda video Telegram'a gönderilir
- **Format:** MP4, H.264 codec
- **FPS:** 30 FPS (modern FFmpeg) veya 10 FPS (fallback)
- **⚠️ Not:** FFmpeg gereklidir, yoksa PowerShell fallback kullanılır

#### Webcam Fotoğraf
- **Kullanım:** `📸 Ekran` → `📷 Webcam Fotoğraf`
- **Sonuç:** Webcam ile fotoğraf çeker ve gönderir
- **Format:** JPEG, 1280x720
- **⚠️ Gereksinim:** Webcam bağlı ve çalışır durumda olmalı

#### Webcam Video
- **Kullanım:** `📸 Ekran` → `🎬 Webcam Video`
- **Süre:** 10 saniye
- **Format:** MP4, H.264
- **Çözünürlük:** 1280x720

---

### 🔊 Ses Menüsü

#### Ses Açma/Kapatma
- **Kullanım:** `🔊 Ses` → `🔊 Ses Aç` / `🔇 Ses Kapat`
- **Sonuç:** Sistem sesi mute/unmute olur

#### Ses Arttırma/Azaltma
- **Kullanım:** `🔊 Ses` → `🔼 Ses Arttır` / `🔽 Ses Azalt`
- **Artış:** Her tıklamada %2 değişir
- **Toplam:** Birden fazla tıklama ile istediğiniz seviyeye getirin

#### Sabit Ses Seviyeleri
- **Kullanım:** `🔊 Ses` → `%0` / `%50` / `%100`
- **Teknoloji:** DirectSound API ile tam kontrol
- **Sonuç:** Seçilen değere TAM OLARAK ayarlanır
- **Örnek:** %50 seçtinizde AYNEN %50 olur (±0 hata)

#### Özel Ses Seviyesi
- **Kullanım:** `🔊 Ses` → `🎚️ Özel Seviye`
- **Adımlar:**
  1. Butona tıklayın
  2. 0-100 arası bir değer yazın (örn: `75`)
  3. Ses seviyesi yazdığınız değere ayarlanır

#### Sesli Komutlar (Text-to-Speech)
- **Kullanım:** `🔊 Ses` → `🗣️ Sesli Komutlar`
- **Seçenekler:**
  - **🔊 Merhaba De**: "Merhaba! Bilgisayarımda Oturan Kişi Size nasıl yardımcı olabilirim?"
  - **🔊 Uyarı Ver**: "Dikkat! Bilgisayarınız uzaktan kontrol ediliyor..."
  - **🔊 Şaka Yap**: Rastgele bir bilgisayar şakası
  - **🔊 Korkut**: "Sistem tehlikede! Kritik güvenlik açığı!"
  - **🔊 Bilgisayarı Kapatıyorum**: "Bilgisayar 10 saniye içinde kapatılacak..."
  - **🔊 Hacker Uyarısı**: "İzinsiz erişim tespit edildi!"
  - **🔊 Motivasyon**: Rastgele motivasyon sözü
  - **🔊 Tebrikler**: "Harika bir iş çıkardın!"
  - **🔊 Özel Mesaj**: Kendi yazdığınız metni seslendirir
- **Teknoloji:** Windows Speech Synthesis (SAPI.SpVoice)
- **Ses:** Windows varsayılan TTS sesi
- **⚠️ Not:** Sistem seslerinin açık olması gerekir

---

### 📊 Performans İzleme

#### Gerçek Zamanlı İzleme
- **Kullanım:** `📊 Performans` → `📊 Sistem Bilgisi`
- **Gösterilen Bilgiler:**
  - CPU kullanımı (%)
  - RAM kullanımı (GB / %)
  - Disk kullanımı (GB / %)
  - Ağ hızı (Mbps)
- **Yenileme:** 5 saniyede bir otomatik güncellenir

---

### 🌐 Ağ Menüsü

#### Ağ Bilgileri
- **Kullanım:** `🌐 Ağ` → `📡 Ağ Bilgileri`
- **Gösterilen Bilgiler:**
  - IP adresi (yerel)
  - MAC adresi
  - Subnet Mask
  - Gateway
  - DNS sunucuları
  - Bağlantı türü (Ethernet/WiFi)

#### Ping Testi
- **Kullanım:** `🌐 Ağ` → `📶 Ping Testi`
- **Adımlar:**
  1. Butona tıklayın
  2. Test edilecek adresi yazın (örn: `google.com` veya `8.8.8.8`)
  3. Ping sonuçları gösterilir (ms)

#### İnternet Hızı
- **Kullanım:** `🌐 Ağ` → `⚡ İnternet Hızı`
- **Gösterilen Bilgiler:**
  - Download hızı (Mbps)
  - Upload hızı (Mbps)
  - Ping süresi (ms)
  - Test sunucusu
- **⚠️ Not:** Test 30-60 saniye sürebilir

---

### 📁 Dosya Yönetimi

#### Dosya Gönderme (Telegram → PC)
- **Kullanım:** Telegram'da dosyayı bota gönderin
- **Desteklenen Tipler:**
  - Belgeler (PDF, DOCX, XLSX, vb.)
  - Resimler (JPG, PNG, GIF)
  - Videolar (MP4, AVI, MKV)
  - Arşivler (ZIP, RAR)
- **İndirme Yeri:** `D:\PCKilitPro\temp\downloads\`
- **Maksimum Boyut:** Telegram limit (2 GB)

#### Dosya İndirme (PC → Telegram)
- **Kullanım:** `📁 Dosya` → Dosya yolu yazın
- **Adımlar:**
  1. Tam dosya yolunu yazın (örn: `C:\Users\User\Desktop\document.pdf`)
  2. Dosya Telegram'a gönderilir
- **Maksimum Boyut:** 50 MB (Telegram botu limiti)

#### Dosya Listeleme
- **Kullanım:** `📁 Dosya` → `📋 Dosya Listele`
- **Adımlar:**
  1. Klasör yolu yazın (örn: `C:\Users\User\Documents`)
  2. Klasördeki tüm dosyalar listelenir

---

### 🖱️ Mouse & Klavye Kontrolü

#### Mouse Hareket
- **Kullanım:** `🖱️ Mouse/Klavye` → `↗️ Mouse Hareket`
- **Adımlar:**
  1. Butona tıklayın
  2. X,Y koordinatlarını yazın (örn: `500,300`)
  3. Mouse belirtilen noktaya gider
- **Koordinat Sistemi:** Sol üst köşe (0,0)

#### Mouse Tıklama
- **Kullanım:** `🖱️ Mouse/Klavye` → `🖱️ Sol Tık` / `🖱️ Sağ Tık` / `🖱️ Çift Tık`
- **Sonuç:** Mouse'un bulunduğu yerde tıklama simüle edilir

#### Klavye Girişi
- **Kullanım:** `🖱️ Mouse/Klavye` → `⌨️ Metin Yaz`
- **Adımlar:**
  1. Butona tıklayın
  2. Yazdırılacak metni yazın
  3. Text klavye ile yazılır (her karakter 50ms arayla)

#### Tuş Kombinasyonları
- **Kullanım:** `🖱️ Mouse/Klavye` → `🎹 Kısayol Tuşları`
- **Seçenekler:**
  - Ctrl+C (Kopyala)
  - Ctrl+V (Yapıştır)
  - Ctrl+X (Kes)
  - Ctrl+Z (Geri Al)
  - Ctrl+S (Kaydet)
  - Alt+Tab (Pencere değiştir)
  - Win+D (Masaüstünü göster)
  - Print Screen (Ekran görüntüsü)

---

### 📋 Pano (Clipboard) Kontrolü

#### Pano İçeriği
- **Kullanım:** `📋 Pano` → `📋 Pano İçeriği`
- **Sonuç:** Panoda kopyalanmış olan text gösterilir

#### Panoya Kopyala
- **Kullanım:** `📋 Pano` → `📝 Panoya Kopyala`
- **Adımlar:**
  1. Butona tıklayın
  2. Kopyalanacak metni yazın
  3. Text panoya kopyalanır

#### Pano Geçmişi
- **Kullanım:** `📋 Pano` → `📜 Geçmiş`
- **Sonuç:** Son 10 kopyalanan text gösterilir
- **Format:** Zamanlı liste

#### Otomatik Pano İzleme
- **Kullanım:** `📋 Pano` → `👁️ İzleme Başlat`
- **Sonuç:** Pano her değiştiğinde Telegram'a bildirim gelir
- **Durdurma:** `⏸️ İzleme Durdur`

---

### 📅 Otomasyon & Zamanlanmış Görevler

#### Zamanlanmış Görev Oluşturma
- **Kullanım:** `📅 Otomasyon` → `⏰ Zamanlanmış Görev`
- **Adımlar:**
  1. Butona tıklayın
  2. Görev detaylarını yazın (örn: `22:00|shutdown` → Saat 22:00'de kapat)
  3. Format: `HH:MM|komut`
- **Örnekler:**
  - `14:30|screenshot` → 14:30'da ekran görüntüsü al
  - `23:00|shutdown` → 23:00'de bilgisayarı kapat

#### Tekrarlı Görev
- **Kullanım:** `📅 Otomasyon` → `🔄 Tekrarlı Görev`
- **Adımlar:**
  1. Periyot seçin (Her saat, Her gün, Her hafta)
  2. Görev komutunu yazın
- **Örnekler:**
  - Her gün saat 09:00'da sistem bilgisi gönder
  - Her saat başı performans raporu al

#### Görev Listesi
- **Kullanım:** `📅 Otomasyon` → `📋 Görev Listesi`
- **Gösterilen Bilgiler:**
  - Tüm aktif görevler
  - Çalışma zamanları
  - Görev ID'leri

#### Görev Silme
- **Kullanım:** `📅 Otomasyon` → `🗑️ Görev Sil`
- **Adımlar:**
  1. Önce görev listesinden ID'yi öğrenin
  2. "Görev Sil" → ID'yi yazın
  3. Görev iptal edilir

---

### 👁️ İzleme Modülleri

#### Ekran İzleme
- **Kullanım:** `👁️ İzleme` → `📸 Ekran İzleme` → `▶️ Başlat`
- **Sonuç:** Her 5 dakikada bir ekran görüntüsü Telegram'a gönderilir
- **Durdurma:** `⏹️ Durdur`

#### Webcam İzleme
- **Kullanım:** `👁️ İzleme` → `📷 Webcam İzleme` → `▶️ Başlat`
- **Sonuç:** Her 10 dakikada bir webcam fotoğrafı gönderilir

#### USB İzleme
- **Kullanım:** `👁️ İzleme` → `🔌 USB İzleme` → `▶️ Başlat`
- **Sonuç:** USB takıldığında veya çıkarıldığında bildirim gelir
- **Gösterilen Bilgiler:**
  - USB cihaz adı
  - Sürücü harfi
  - Takılma/çıkarılma zamanı

#### CPU İzleme
- **Kullanım:** `👁️ İzleme` → `💻 CPU İzleme` → `▶️ Başlat`
- **Eşik:** CPU kullanımı %80'i geçerse bildirim gelir
- **Bildirim Sıklığı:** En fazla 5 dakikada bir

---

### 🔔 Bildirimler

#### Test Bildirimi
- **Kullanım:** `🔔 Bildirimler` → `🔔 Test Bildirimi`
- **Sonuç:** Windows bildirim penceresi açılır (test amaçlı)

#### Özel Bildirim
- **Kullanım:** `🔔 Bildirimler` → `📨 Özel Bildirim Gönder`
- **Adımlar:**
  1. Butona tıklayın
  2. Başlık yazın
  3. Mesaj yazın
  4. Windows bildirim penceresi görünür
- **Örnek:**
  - Başlık: `Toplantı Hatırlatma`
  - Mesaj: `15 dakika sonra toplantınız var!`

---

## 🛠️ Yapılandırma

### .env Dosyası

`.env` dosyası botun ana yapılandırma dosyasıdır. İçeriği:

```env
# Telegram Bot Token (BotFather'dan alın)
TELEGRAM_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Telegram User ID (userinfobot'tan öğrenin)
ALLOWED_USER_ID=987654321

# Ortam (production/development)
NODE_ENV=production

# Log seviyesi (error/warn/info/debug)
LOG_LEVEL=info
```

### Ortam Değişkenleri

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `TELEGRAM_TOKEN` | Bot token (zorunlu) | - |
| `ALLOWED_USER_ID` | Yetkili kullanıcı ID (zorunlu) | - |
| `NODE_ENV` | Çalışma ortamı | `production` |
| `LOG_LEVEL` | Log detay seviyesi | `info` |

### Log Seviyeleri

- **error**: Sadece hatalar
- **warn**: Hatalar + uyarılar
- **info**: Hatalar + uyarılar + bilgi mesajları (önerilen)
- **debug**: Tüm detaylı loglar

### Özelleştirme

Bot davranışlarını değiştirmek için:

1. **Performans İzleme Aralığı**
   - Dosya: `src/services/performanceService.js`
   - Değişken: `COLLECTION_INTERVAL` (varsayılan: 5000ms)

2. **Screenshot Klasörü**
   - Dosya: `src/services/monitorService.js`
   - Klasör: `screenshots/`

3. **Log Dosyası Konumu**
   - Dosya: `src/utils/logger.js`
   - Konum: `logs/rootbot.log`

---

## 📂 Proje Yapısı

```
RootBot/
├── 📁 src/                          # Kaynak kodlar
│   ├── 📁 bot/                      # Bot core
│   │   └── index.js                 # Bot instance ve auth
│   ├── 📁 config/                   # Yapılandırma
│   │   ├── env.js                   # .env loader
│   │   └── config.js                # Uygulama ayarları
│   ├── 📁 handlers/                 # Mesaj handler'ları
│   │   └── messageHandler.js        # Ana mesaj işleyici
│   ├── 📁 menus/                    # Telegram menüleri
│   │   ├── mainMenu.js              # Ana menü
│   │   ├── systemMenu.js            # Sistem menüsü
│   │   ├── securityMenu.js          # Güvenlik menüsü
│   │   ├── audioMenu.js             # Ses menüsü
│   │   ├── inputMenu.js             # Mouse/Klavye menüsü
│   │   ├── clipboardMenu.js         # Pano menüsü
│   │   ├── monitoringMenu.js        # İzleme menüsü
│   │   ├── notificationMenu.js      # Bildirim menüsü
│   │   ├── settingsMenu.js          # Ayarlar menüsü
│   │   └── index.js                 # Menü exporter
│   ├── 📁 services/                 # İş mantığı servisleri
│   │   ├── systemService.js         # Sistem bilgileri
│   │   ├── powerService.js          # Güç yönetimi
│   │   ├── monitorService.js        # Ekran/Webcam
│   │   ├── networkService.js        # Ağ işlemleri
│   │   ├── audioService.js          # Ses kontrolü
│   │   ├── clipboardService.js      # Pano işlemleri
│   │   ├── programService.js        # Program yönetimi
│   │   ├── diskService.js           # Disk işlemleri
│   │   ├── securityService.js       # Güvenlik kontrolleri
│   │   ├── performanceService.js    # Performans izleme
│   │   ├── automationService.js     # Otomasyon
│   │   ├── activityService.js       # Aktivite takibi
│   │   ├── mediaService.js          # Medya kontrolü
│   │   ├── fileService.js           # Dosya işlemleri
│   │   ├── notificationService.js   # Bildirimler
│   │   ├── settingsService.js       # Ayarlar yönetimi
│   │   ├── inputService.js          # Mouse/Klavye
│   │   ├── monitoringService.js     # İzleme modülleri
│   │   ├── quickActionsService.js   # Hızlı işlemler
│   │   └── systemMonitorService.js  # Sistem monitörü
│   └── 📁 utils/                    # Yardımcı fonksiyonlar
│       ├── exec.js                  # Komut yürütme wrapper
│       └── logger.js                # Log sistemi
├── 📁 logs/                         # Log dosyaları
│   └── rootbot.log                  # Ana log dosyası
├── 📁 data/                         # Veri dosyaları
│   ├── clipboard_history.json       # Pano geçmişi
│   ├── scheduled_tasks.json         # Zamanlanmış görevler
│   └── monitoring_state.json        # İzleme durumları
├── 📁 temp/                         # Geçici dosyalar
│   └── downloads/                   # İndirilen dosyalar
├── 📁 screenshots/                  # Ekran görüntüleri
├── 📁 recordings/                   # Ekran kayıtları
├── 📁 webcam/                       # Webcam fotoğrafları
├── 📄 main.js                       # Ana giriş noktası
├── 📄 install.js                    # Kurulum sihirbazı
├── 📄 uninstall.js                  # Kaldırma scripti
├── 📄 package.json                  # NPM bağımlılıkları
├── 📄 .env                          # Ortam değişkenleri (GİZLİ!)
├── 📄 .gitignore                    # Git ignore kuralları
└── 📄 README.md                     # Bu dosya
```

### Modül Açıklamaları

#### 🎯 Core Modüller
- **bot/index.js**: Telegram bot instance, auth middleware, mesaj filtreleme
- **main.js**: Uygulama giriş noktası, event listeners, açılış bildirimi

#### 🔧 Servisler
Her servis belirli bir işlev grubunu yönetir:
- **systemService**: `systeminformation` kütüphanesi ile donanım bilgileri
- **powerService**: Windows shutdown komutları ile güç yönetimi
- **monitorService**: FFmpeg + PowerShell ile görüntü yakalama
- **audioService**: WScript.Shell + DirectSound API ile ses kontrolü
- **networkService**: PowerShell network cmdlet'leri ile ağ işlemleri

#### 📋 Menüler
Telegram klavye butonlarını tanımlar:
- Her menü `get{Menu}Keyboard()` ve `send{Menu}()` fonksiyonları içerir
- Butonlar emoji + text formatında
- Reply keyboard kullanır (ekranın altında sabit)

---

## 🔒 Güvenlik

### ⚠️ Önemli Güvenlik Uyarıları

1. **`.env` Dosyası GİZLİ Tutun!**
   - Bu dosya bot token içerir
   - GitHub'a ASLA yüklemeyin
   - `.gitignore` içinde olduğundan emin olun

2. **Sadece Size Ait User ID Kullanın**
   - `ALLOWED_USER_ID` sadece sizin Telegram ID'niz olmalı
   - Başkasının ID'sini eklemeyin
   - ID'yi kimseyle paylaşmayın

3. **Yönetici Yetkileri**
   - Bazı özellikler admin yetkisi gerektirir (website engelleme vb.)
   - Gerekmedikçe normal kullanıcı olarak çalıştırın
   - Admin gereken özellikler için uyarı verir

4. **Firewall & Antivirüs**
   - Bot, PowerShell komutları çalıştırır
   - Bazı antivirüsler şüpheli bulabilir
   - Güvendiğiniz klasöre ekleyin (install.js bunu sorar)

5. **Ağ Güvenliği**
   - Bot Telegram API ile şifreli (HTTPS) iletişim kurar
   - Yerel ağ taramaları dikkatli kullanın
   - Website engelleme hosts dosyasını değiştirir

### 🛡️ Güvenlik En İyi Uygulamaları

```bash
# 1. .env dosyasını koruyun
chmod 600 .env  # Sadece siz okuyabilirsiniz (Linux/Mac)

# 2. Hassas klasörleri yedekleyin
# screenshots/, webcam/, recordings/ klasörlerini düzenli temizleyin

# 3. Log dosyalarını kontrol edin
tail -f logs/rootbot.log  # Şüpheli aktivite için

# 4. Güvenlik güncellemelerini takip edin
npm audit  # Zafiyet taraması
npm update  # Bağımlılıkları güncelle
```

### 🔐 Yetkilendirme Sistemi

Bot, her mesajda şu kontrolleri yapar:
1. Gönderen Telegram User ID kontrolü
2. `.env` içindeki `ALLOWED_USER_ID` ile karşılaştırma
3. Eşleşmezse: `⛔ Yetkisiz Erişim!` mesajı

**Kod Örneği:**
```javascript
// src/bot/index.js
function checkAuthorization(chatId) {
    return chatId.toString() === config.telegram.allowedUserId.toString();
}
```

### 🕐 Eski Mesaj Filtreleme

Bot başladığında eski mesajları (bot kapalıyken gönderilen) işlemez:
```javascript
// src/bot/index.js
const botStartTime = Math.floor(Date.now() / 1000);

function isMessageTooOld(messageDate) {
    return messageDate < botStartTime;
}
```

Bu özellik, bilgisayar açılışında eski "Kapat" komutlarının çalışmasını engeller.

---

## ❌ Kaldırma

### Otomatik Kaldırma (Önerilen)

```bash
node uninstall.js
```

**Kaldırma sihirbazı şunları yapar:**
1. ✅ Otomatik başlatma kayıtlarını siler (VBS, BAT, Registry)
2. ✅ Windows Defender istisnasını kaldırır
3. ✅ Güvenlik duvarı kurallarını siler
4. ✅ Geçici dosyaları temizler (opsiyonel)
5. ✅ Log dosyalarını siler (opsiyonel)
6. ⚠️ `.env` dosyasını korur (veri kaybını önlemek için)

**Kaldırma çıktısı örneği:**
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         🗑️ RootBot v2.0 Kaldırma Sihirbazı          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

⚠️  UYARI: Bu işlem RootBot'u tamamen kaldıracak!

Kaldırmaya devam edilsin mi? (e/h): e

🚫 Otomatik Başlatma Kaldırılıyor
──────────────────────────────────────────────────────
✓ Başlangıç klasöründeki VBS dosyası silindi
✓ start_rootbot.bat silindi
✓ Registry kaydı silindi
✓ 3 otomatik başlatma kaydı temizlendi

🔓 Güvenlik Ayarları Kaldırılıyor
──────────────────────────────────────────────────────
Güvenlik ayarlarını kaldırmak ister misiniz? (e/h): e
✓ Windows Defender istisnası kaldırıldı
✓ Güvenlik duvarı kuralı silindi

🗑️ Geçici Dosyalar Temizleniyor
──────────────────────────────────────────────────────
Geçici dosyaları silmek ister misiniz? (e/h): e
✓ 15 screenshot silindi (12.5 MB)
✓ 3 ekran kaydı silindi (45.2 MB)
✓ 8 webcam fotoğrafı silindi (2.1 MB)
✓ Temp klasörü temizlendi (1.3 MB)
✓ Toplam 61.1 MB alan temizlendi

📝 Log Dosyaları
──────────────────────────────────────────────────────
Log dosyalarını silmek ister misiniz? (e/h): h
⚠ Log dosyaları korundu

🔧 Node Modüllerini Kaldırma
──────────────────────────────────────────────────────
node_modules klasörünü silmek ister misiniz? (350 MB) (e/h): e
✓ node_modules silindi (350 MB tasarruf)

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         ✅ KALDIRMA BAŞARIYLA TAMAMLANDI!            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📊 Özet:
  ✓ Otomatik başlatma: Kaldırıldı
  ✓ Güvenlik ayarları: Kaldırıldı
  ✓ Geçici dosyalar: Temizlendi (61.1 MB)
  ✓ Log dosyaları: Korundu
  ✓ node_modules: Silindi (350 MB)
  ⚠ .env dosyası: Korundu (güvenlik için)

💡 Tamamen silmek için:
  1. .env dosyasını manuel olarak silin
  2. Klasörün tamamını silin: rmdir /s /q "D:\PCKilitPro"

🎉 RootBot başarıyla kaldırıldı!
```

### Manuel Kaldırma

Otomatik kaldırma çalışmazsa manuel adımlar:

#### 1. Botu Durdur
```bash
# Çalışan bot process'ini bul
tasklist | findstr node.exe

# Process'i kapat (PID ile)
taskkill /F /PID <process_id>

# Veya tüm node process'lerini kapat
taskkill /F /IM node.exe
```

#### 2. Otomatik Başlatmayı Kaldır
```bash
# Registry kaydını sil
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "RootBot" /f

# Başlangıç klasöründeki VBS'yi sil
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RootBot.vbs"
```

#### 3. Güvenlik Ayarlarını Kaldır
```powershell
# Windows Defender istisnasını kaldır
Remove-MpPreference -ExclusionPath "D:\PCKilitPro"

# Güvenlik duvarı kuralını sil
netsh advfirewall firewall delete rule name="RootBot"
```

#### 4. Dosyaları Sil
```bash
# Proje klasörünü tamamen sil
cd ..
rmdir /s /q PCKilitPro
```

---

## 🐛 Sorun Giderme

### Sık Karşılaşılan Sorunlar

#### 1. Bot Başlamıyor

**Hata:**
```
Error: ETELEGRAM: 401 Unauthorized
```

**Çözüm:**
- `.env` dosyasındaki `TELEGRAM_TOKEN` yanlış
- BotFather'dan yeni token alıp güncelleyin

---

**Hata:**
```
Error: Cannot find module 'node-telegram-bot-api'
```

**Çözüm:**
```bash
# Bağımlılıkları yükleyin
npm install
```

---

#### 2. Çift Bot Instance Hatası

**Hata:**
```
ETELEGRAM: 409 Conflict: terminated by other getUpdates request
```

**Çözüm:**
```bash
# Tüm node process'lerini kapat
taskkill /F /IM node.exe

# Botu tekrar başlat
npm start
```

---

#### 3. FFmpeg Bulunamadı

**Hata:**
```
❌ FFmpeg bulunamadı! Ekran kaydı için FFmpeg kurulu olmalı.
```

**Çözüm:**
1. FFmpeg'i indirin: https://ffmpeg.org/download.html
2. Windows için: https://www.gyan.dev/ffmpeg/builds/
3. `ffmpeg.exe` dosyasını PATH'e ekleyin veya proje klasörüne koyun
4. Terminalde test edin: `ffmpeg -version`

**Alternatif (Fallback kullan):**
- Bot otomatik olarak PowerShell fallback kullanır (10 FPS)
- Video kalitesi düşer ama çalışır

---

#### 4. Website Engelleme İzin Hatası

**Hata:**
```
❌ Website engellenemedi: Yönetici yetkisi gerekiyor.
```

**Çözüm:**
```bash
# Node.js'i yönetici olarak çalıştırın
# Sağ tık → "Yönetici olarak çalıştır"

# Veya PowerShell Admin:
Start-Process node -ArgumentList "main.js" -Verb RunAs
```

---

#### 5. Webcam Bulunamadı

**Hata:**
```
❌ Webcam bulunamadı veya devre dışı.
```

**Çözüm:**
1. Webcam'in bağlı olduğundan emin olun
2. Cihaz Yöneticisi → Kameralar bölümünü kontrol edin
3. Windows Kamera uygulaması ile test edin
4. Webcam sürücülerini güncelleyin

---

#### 6. Ses Kontrolü Çalışmıyor

**Sorun:** Ses arttırma/azaltma çalışmıyor

**Çözüm:**
```powershell
# PowerShell'i test edin
$wsh = New-Object -ComObject WScript.Shell
$wsh.SendKeys([char]175)  # Volume Up

# Hata veriyorsa:
# 1. PowerShell'i yeniden başlatın
# 2. Script execution policy kontrol edin:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

#### 7. Log Dosyası Çok Büyüdü

**Sorun:** `logs/rootbot.log` dosyası GB boyutunda

**Çözüm:**
```bash
# Log dosyasını temizle
npm run clean

# Veya manuel:
del logs\rootbot.log

# Log seviyesini azalt (.env)
LOG_LEVEL=warn
```

---

#### 8. Port Zaten Kullanımda

**Hata:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Çözüm:**
```bash
# Kullanılan portu bul
netstat -ano | findstr :3000

# Process'i kapat
taskkill /F /PID <process_id>
```

---

### Debug Modu

Detaylı log görmek için:

```bash
# .env dosyasını düzenle
LOG_LEVEL=debug
NODE_ENV=development

# Botu başlat
npm start
```

Debug modda görecekleriniz:
- Tüm gelen mesajlar
- Servis çağrıları
- PowerShell komutları
- Hata stack trace'leri

---

### Log Analizi

```bash
# Son 50 log satırı
tail -n 50 logs/rootbot.log

# Gerçek zamanlı log takibi
tail -f logs/rootbot.log

# Sadece hataları göster
findstr "ERROR" logs/rootbot.log

# Belirli servisi ara
findstr "monitorService" logs/rootbot.log
```

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! 🎉

### Nasıl Katkıda Bulunulur

1. **Fork Yapın**
   ```bash
   # GitHub'da "Fork" butonuna tıklayın
   ```

2. **Klonlayın**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rootbot.git
   cd rootbot
   ```

3. **Yeni Branch Oluşturun**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Değişikliklerinizi Yapın**
   - Kod yazın
   - Test edin
   - Dokümante edin

5. **Commit Edin**
   ```bash
   git add .
   git commit -m "feat: Add amazing feature"
   ```

6. **Push Edin**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Pull Request Açın**
   - GitHub'da "New Pull Request" butonuna tıklayın
   - Değişikliklerinizi açıklayın

### Commit Mesajları

Conventional Commits standardını kullanın:

```
feat: Yeni özellik eklendi
fix: Bug düzeltildi
docs: Dokümantasyon güncellendi
style: Kod formatı düzenlendi
refactor: Kod yeniden yapılandırıldı
test: Test eklendi
chore: Bakım işlemi yapıldı
```

**Örnekler:**
```bash
git commit -m "feat: Add Spotify integration"
git commit -m "fix: Fix website blocking permission error"
git commit -m "docs: Update installation guide"
```

### Kod Standartları

- **JavaScript ES6+** kullanın
- **Async/Await** tercih edin (Promise.then yerine)
- **Modüler yapı** - Her özellik ayrı servis dosyasında
- **Error handling** - Try/catch blokları ekleyin
- **Yorum satırları** - Karmaşık kod parçalarını açıklayın
- **Türkçe string'ler** - Kullanıcı mesajları Türkçe olmalı
- **İngilizce kod** - Değişken/fonksiyon isimleri İngilizce

### Test Etme

Değişikliklerinizi test edin:

```bash
# Manuel test
npm start

# Telegram'dan test edin
# Tüm menüleri gezin
# Tüm özellikleri deneyin

# Log kontrolü
tail -f logs/rootbot.log
```

### İyi Bir Pull Request

✅ **İyi PR:**
- Tek bir özellik/düzeltme içerir
- Detaylı açıklama var
- Test edilmiş
- README güncellenmiş (gerekirse)
- Mevcut kodu bozmamış

❌ **Kötü PR:**
- Birden fazla ilgisiz değişiklik
- Açıklama yok
- Test edilmemiş
- Kod standartlarına uymuyor

---

## 📄 Lisans

Bu proje **ISC Lisansı** altında lisanslanmıştır.

```
ISC License

Copyright (c) 2025 Umut Sevimcan

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 🙏 Teşekkürler

### Kullanılan Kütüphaneler

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Telegram Bot API
- [systeminformation](https://github.com/sebhildebrandt/systeminformation) - Sistem bilgileri
- [node-webcam](https://github.com/chuckfairy/node-webcam) - Webcam kontrolü
- [screenshot-desktop](https://github.com/bencevans/screenshot-desktop) - Ekran görüntüsü
- [clipboardy](https://github.com/sindresorhus/clipboardy) - Pano işlemleri
- [node-notifier](https://github.com/mikaelbr/node-notifier) - Windows bildirimleri
- [node-schedule](https://github.com/node-schedule/node-schedule) - Zamanlanmış görevler
- [FFmpeg](https://ffmpeg.org/) - Video işleme

### İlham Kaynakları

- Windows PowerShell automation
- Telegram Bot API documentation
- Uzaktan masaüstü kontrolü projeleri

---

## 📞 İletişim & Destek

### Sorunuz mu var?

- 📧 **Email**: umutseviimcan@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/umutsevimcann/rootbot/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/umutsevimcann/rootbot/discussions)

### Yardımcı Linkler

- 📚 [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- 🎬 [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- 🔧 [Node.js Documentation](https://nodejs.org/en/docs/)
- 💻 [PowerShell Docs](https://docs.microsoft.com/en-us/powershell/)

---

## 🎉 Son Sözler

**RootBot** ile Windows bilgisayarınızı dünyanın her yerinden kontrol edebilirsiniz!

- ✨ 100+ özellik
- 🛡️ Güvenli (sadece siz erişebilirsiniz)
- 🚀 Hızlı ve stabil
- 🔧 Kolay kurulum
- 📱 Telegram ile kullanım

**Keyifli kullanımlar! 🤖**

---

<div align="center">

**⭐ Beğendiyseniz yıldız vermeyi unutmayın! ⭐**

Made with ❤️ by Umut Sevimcan

</div>
