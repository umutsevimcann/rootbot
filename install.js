const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Renkli console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.toLowerCase().trim());
    }));
}

// Sistem kontrolü
async function checkSystem() {
    const checks = {
        node: false,
        npm: false,
        ffmpeg: false,
        powershell: false,
        admin: false
    };

    try {
        // Node.js sürümü
        const nodeVersion = process.version;
        checks.node = true;
        log(`✓ Node.js ${nodeVersion}`, 'green');
    } catch (e) {
        log('✗ Node.js bulunamadı', 'red');
    }

    try {
        // npm sürümü
        const { stdout } = await execPromise('npm --version');
        checks.npm = true;
        log(`✓ npm v${stdout.trim()}`, 'green');
    } catch (e) {
        log('✗ npm bulunamadı', 'red');
    }

    try {
        // FFmpeg kontrolü
        await execPromise('ffmpeg -version', { timeout: 3000 });
        checks.ffmpeg = true;
        log('✓ FFmpeg yüklü', 'green');
    } catch (e) {
        log('⚠ FFmpeg bulunamadı (ekran kaydı için gerekli)', 'yellow');
    }

    try {
        // PowerShell kontrolü
        await execPromise('powershell -Command "Get-Host | Select-Object Version"');
        checks.powershell = true;
        log('✓ PowerShell aktif', 'green');
    } catch (e) {
        log('✗ PowerShell bulunamadı', 'red');
    }

    try {
        // Admin kontrolü
        const { stdout } = await execPromise('net session 2>&1');
        if (!stdout.includes('Access is denied')) {
            checks.admin = true;
            log('✓ Yönetici yetkileri mevcut', 'green');
        } else {
            log('⚠ Yönetici olarak çalıştırılmıyor (bazı özellikler kısıtlı olabilir)', 'yellow');
        }
    } catch (e) {
        log('⚠ Yönetici olarak çalıştırılmıyor (bazı özellikler kısıtlı olabilir)', 'yellow');
    }

    return checks;
}

// Windows sürüm tespiti
async function detectWindowsVersion() {
    try {
        const { stdout } = await execPromise('powershell -Command "[System.Environment]::OSVersion.Version | Select-Object Major,Minor,Build | ConvertTo-Json"');
        const version = JSON.parse(stdout);

        if (version.Build >= 22000) {
            return { version: 11, build: version.Build, name: 'Windows 11' };
        } else if (version.Build >= 10240) {
            return { version: 10, build: version.Build, name: 'Windows 10' };
        } else {
            return { version: version.Major, build: version.Build, name: `Windows ${version.Major}` };
        }
    } catch (error) {
        return { version: 10, build: 0, name: 'Windows (Bilinmeyen)' };
    }
}

// .env dosyası oluşturma (config.json yerine)
async function createEnvFile() {
    const envPath = path.join(__dirname, '.env');

    if (fs.existsSync(envPath)) {
        log('\n⚠ .env dosyası zaten mevcut.', 'yellow');
        const overwrite = await askQuestion('Üzerine yazmak ister misiniz? (e/h): ');
        if (overwrite !== 'e' && overwrite !== 'evet') {
            log('.env dosyası korundu.', 'cyan');
            return;
        }
    }

    log('\n📝 Telegram Bot Yapılandırması', 'cyan');
    log('─'.repeat(50), 'cyan');

    const botToken = await askQuestion('Telegram Bot Token: ');
    const userId = await askQuestion('Telegram Kullanıcı ID: ');

    const envContent = `# RootBot Environment Variables
TELEGRAM_TOKEN=${botToken.trim()}
ALLOWED_USER_ID=${userId.trim()}
NODE_ENV=production
LOG_LEVEL=info
`;

    fs.writeFileSync(envPath, envContent);
    log('✓ .env dosyası oluşturuldu', 'green');
}

// .env kontrolü ve uyarı
async function checkEnvFile() {
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
        log('⚠ .env dosyası bulunamadı, lütfen createEnvFile() fonksiyonunu çağırın', 'yellow');
        return false;
    }

    log('✓ .env dosyası mevcut', 'green');
    return true;
}

// Otomatik başlatma
async function setupAutoStart() {
    const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const vbsPath = path.join(startupFolder, 'RootBot.vbs');
    const batPath = path.join(__dirname, 'start_rootbot.bat');

    log('\n🚀 Otomatik Başlatma Yapılandırması', 'cyan');
    log('─'.repeat(50), 'cyan');

    const autoStart = await askQuestion('Windows başlangıcında otomatik başlatılsın mı? (e/h): ');

    if (autoStart !== 'e' && autoStart !== 'evet') {
        log('Otomatik başlatma atlandı.', 'yellow');
        return;
    }

    // Batch dosyası oluştur
    const batContent = `@echo off
cd /d "${__dirname}"
node main.js >> logs\\rootbot.log 2>&1`;

    fs.writeFileSync(batPath, batContent);
    log('✓ start_rootbot.bat oluşturuldu', 'green');

    // VBS dosyası oluştur (görünmez başlatma)
    const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """${batPath}""", 0, false`;

    fs.writeFileSync(vbsPath, vbsContent);
    log('✓ Başlangıç klasörüne VBS eklendi', 'green');

    // Registry kaydı (yedek)
    try {
        const regCommand = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "RootBot" /t REG_SZ /d "${vbsPath}" /f`;
        await execPromise(regCommand);
        log('✓ Registry kaydı eklendi', 'green');
    } catch (error) {
        log('⚠ Registry kaydı eklenemedi (yönetici yetkisi gerekebilir)', 'yellow');
    }

    log('✓ Otomatik başlatma yapılandırıldı', 'green');
}

// Klasör yapısı oluşturma
async function createDirectories() {
    log('\n📁 Klasör Yapısı Oluşturuluyor', 'cyan');
    log('─'.repeat(50), 'cyan');

    const dirs = [
        'logs',
        'data',
        'temp',
        'screenshots',
        'recordings',
        'webcam'
    ];

    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            log(`✓ ${dir}/ oluşturuldu`, 'green');
        } else {
            log(`✓ ${dir}/ mevcut`, 'blue');
        }
    });
}

// Güvenlik ayarları
async function setupSecurity() {
    log('\n🔒 Güvenlik Ayarları', 'cyan');
    log('─'.repeat(50), 'cyan');

    const setup = await askQuestion('Güvenlik ayarları yapılandırılsın mı? (e/h): ');

    if (setup !== 'e' && setup !== 'evet') {
        log('Güvenlik ayarları atlandı.', 'yellow');
        return;
    }

    // Windows Defender istisnası
    const defender = await askQuestion('Windows Defender istisnası eklensin mi? (e/h): ');
    if (defender === 'e' || defender === 'evet') {
        try {
            const defenderPath = __dirname;
            await execPromise(`powershell -Command "Add-MpPreference -ExclusionPath '${defenderPath}'"`);
            log('✓ Windows Defender istisnası eklendi', 'green');
        } catch (error) {
            log('⚠ Windows Defender istisnası eklenemedi (yönetici yetkisi gerekebilir)', 'yellow');
        }
    }

    // Firewall istisnası
    const firewall = await askQuestion('Güvenlik duvarı istisnası eklensin mi? (e/h): ');
    if (firewall === 'e' || firewall === 'evet') {
        try {
            const nodePath = process.execPath;
            await execPromise(`netsh advfirewall firewall add rule name="RootBot" dir=in action=allow program="${nodePath}" enable=yes`);
            await execPromise(`netsh advfirewall firewall add rule name="RootBot" dir=out action=allow program="${nodePath}" enable=yes`);
            log('✓ Güvenlik duvarı istisnası eklendi', 'green');
        } catch (error) {
            log('⚠ Güvenlik duvarı istisnası eklenemedi (yönetici yetkisi gerekebilir)', 'yellow');
        }
    }
}

// FFmpeg kurulum kontrolü
async function checkFFmpeg() {
    log('\n🎬 FFmpeg Kontrolü', 'cyan');
    log('─'.repeat(50), 'cyan');

    try {
        const { stdout } = await execPromise('ffmpeg -version', { timeout: 3000 });
        log('✓ FFmpeg zaten yüklü', 'green');
        return true;
    } catch (e) {
        log('⚠ FFmpeg bulunamadı', 'yellow');
        log('  Ekran kaydı özelliği için FFmpeg gereklidir.', 'yellow');
        log('  İndirmek için: https://ffmpeg.org/download.html', 'cyan');

        const install = await askQuestion('\nFFmpeg kurulum sayfasını açmak ister misiniz? (e/h): ');
        if (install === 'e' || install === 'evet') {
            exec('start https://ffmpeg.org/download.html');
        }
        return false;
    }
}

// Dependency kontrolü
async function checkDependencies() {
    log('\n📦 Bağımlılıklar Kontrol Ediliyor', 'cyan');
    log('─'.repeat(50), 'cyan');

    const packageJsonPath = path.join(__dirname, 'package.json');
    const nodeModulesPath = path.join(__dirname, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
        log('⚠ node_modules bulunamadı', 'yellow');
        const install = await askQuestion('npm install çalıştırılsın mı? (e/h): ');

        if (install === 'e' || install === 'evet') {
            log('\n📥 Bağımlılıklar yükleniyor (bu birkaç dakika sürebilir)...', 'cyan');
            try {
                await execPromise('npm install', { timeout: 300000 });
                log('✓ Tüm bağımlılıklar yüklendi', 'green');
            } catch (error) {
                log('✗ Bağımlılık yükleme hatası: ' + error.message, 'red');
            }
        }
    } else {
        log('✓ node_modules mevcut', 'green');
    }
}

// Test çalıştırma
async function runTest() {
    log('\n🧪 Test Çalıştırılıyor', 'cyan');
    log('─'.repeat(50), 'cyan');

    const test = await askQuestion('Botu test etmek ister misiniz? (e/h): ');

    if (test !== 'e' && test !== 'evet') {
        log('Test atlandı.', 'yellow');
        return;
    }

    try {
        // .env kontrolü
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            log('✗ .env dosyası bulunamadı, test yapılamaz', 'red');
            return;
        }

        log('Bot başlatılıyor (10 saniye test)...', 'cyan');
        log('Telegram\'dan "ping" mesajı göndererek test edebilirsiniz.', 'cyan');

        const botProcess = exec('node main.js');

        setTimeout(() => {
            botProcess.kill();
            log('✓ Test tamamlandı', 'green');
        }, 10000);
    } catch (error) {
        log('✗ Test hatası: ' + error.message, 'red');
    }
}

// Ana kurulum fonksiyonu
async function install() {
    console.clear();

    log('╔═══════════════════════════════════════════════════════╗', 'cyan');
    log('║                                                       ║', 'cyan');
    log('║          🤖 RootBot v2.1 Kurulum Sihirbazı           ║', 'cyan');
    log('║     Windows PC Remote Control Telegram Bot           ║', 'cyan');
    log('║                                                       ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════╝', 'cyan');

    log('\n🔍 Sistem Kontrolü', 'cyan');
    log('─'.repeat(50), 'cyan');

    // Windows sürümü
    const winVersion = await detectWindowsVersion();
    log(`✓ ${winVersion.name} (Build ${winVersion.build})`, 'green');

    // Sistem gereksinimleri
    const checks = await checkSystem();

    if (!checks.node || !checks.npm) {
        log('\n✗ Kritik bileşenler eksik! Node.js ve npm yüklü olmalı.', 'red');
        return;
    }

    log('\n─'.repeat(50), 'cyan');
    const continueInstall = await askQuestion('\nKuruluma devam edilsin mi? (e/h): ');

    if (continueInstall !== 'e' && continueInstall !== 'evet') {
        log('\n❌ Kurulum iptal edildi.', 'red');
        return;
    }

    // Kurulum adımları
    await checkDependencies();
    await createDirectories();
    await createEnvFile();  // Tek .env dosyası (config.json yok)
    await setupAutoStart();
    await setupSecurity();
    await checkFFmpeg();

    // Özet
    log('\n╔═══════════════════════════════════════════════════════╗', 'green');
    log('║                                                       ║', 'green');
    log('║            ✅ KURULUM BAŞARIYLA TAMAMLANDI!          ║', 'green');
    log('║                                                       ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');

    log('\n📝 Sonraki Adımlar:', 'cyan');
    log('  1. npm start         → Botu başlat', 'yellow');
    log('  2. Telegram\'dan test et → /start komutunu gönder', 'yellow');
    log('  3. Logs klasörünü kontrol et → Hata varsa incele', 'yellow');

    log('\n📚 Kullanışlı Komutlar:', 'cyan');
    log('  npm start            → Botu başlat', 'blue');
    log('  npm run dev          → Development modda çalıştır', 'blue');
    log('  npm run clean        → Geçici dosyaları temizle', 'blue');

    log('\n💡 İpuçları:', 'cyan');
    log('  • Bot çalışırken Telegram\'dan /help yazarak yardım alabilirsiniz', 'magenta');
    log('  • Sorun yaşarsanız logs/rootbot.log dosyasını kontrol edin', 'magenta');
    log('  • .env dosyasından ayarları değiştirebilirsiniz', 'magenta');

    log('\n🎉 RootBot kullanıma hazır!', 'green');
}

// Kurulumu başlat
install().catch(error => {
    log('\n✗ Kurulum hatası: ' + error.message, 'red');
    process.exit(1);
});
