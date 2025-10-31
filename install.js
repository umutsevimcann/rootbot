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

    log('\nSistem Gereksinimleri Kontrol Ediliyor...', 'cyan');
    log('─'.repeat(50), 'cyan');

    try {
        const nodeVersion = process.version;
        checks.node = true;
        log(`✓ Node.js ${nodeVersion}`, 'green');
    } catch (e) {
        log('✗ Node.js bulunamadı', 'red');
    }

    try {
        const { stdout } = await execPromise('npm --version');
        checks.npm = true;
        log(`✓ npm v${stdout.trim()}`, 'green');
    } catch (e) {
        log('✗ npm bulunamadı', 'red');
    }

    // ffmpeg-static npm paketi kontrolü (otomatik gelir)
    try {
        const ffmpegStatic = require('ffmpeg-static');
        checks.ffmpeg = true;
        log('✓ FFmpeg static binary (npm paketi - otomatik)', 'green');
        log(`  📦 ${ffmpegStatic}`, 'cyan');
        log('  ⚡ GPU acceleration + yüksek kalite kayıt HAZIR!', 'green');
    } catch (staticError) {
        // ffmpeg-static yoksa sistem ffmpeg'ini kontrol et
        try {
            await execPromise('ffmpeg -version', { timeout: 3000 });
            checks.ffmpeg = true;
            log('✓ Sistem FFmpeg yüklü', 'green');
            log('  ⚠️  npm install ile ffmpeg-static otomatik gelir', 'yellow');
        } catch (e) {
            log('⚠ FFmpeg bulunamadı', 'yellow');
            log('  npm install çalıştırın (ffmpeg-static otomatik gelir)', 'cyan');
        }
    }

    try {
        await execPromise('powershell -Command "Get-Host | Select-Object Version"');
        checks.powershell = true;
        log('✓ PowerShell aktif', 'green');
    } catch (e) {
        log('✗ PowerShell bulunamadı', 'red');
    }

    try {
        const { stdout } = await execPromise('net session 2>&1');
        if (!stdout.includes('Access is denied')) {
            checks.admin = true;
            log('✓ Yönetici yetkileri mevcut', 'green');
        } else {
            log('⚠ Yönetici olarak çalıştırılmıyor (bazı özellikler kısıtlı olabilir)', 'yellow');
        }
    } catch (e) {
        log('⚠ Yönetici olarak çalıştırılmıyor', 'yellow');
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

// .env dosyası oluşturma
async function createEnvFile() {
    const envPath = path.join(__dirname, '.env');

    log('\nTelegram Bot Yapılandırması', 'cyan');
    log('─'.repeat(50), 'cyan');

    if (fs.existsSync(envPath)) {
        log('\n.env dosyası zaten mevcut.', 'yellow');
        const overwrite = await askQuestion('Üzerine yazmak ister misiniz? (e/h): ');
        if (overwrite !== 'e' && overwrite !== 'evet') {
            log('.env dosyası korundu.', 'cyan');
            return;
        }
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const botToken = await new Promise(resolve => {
        rl.question('\nTelegram Bot Token (BotFather\'dan alın): ', answer => resolve(answer.trim()));
    });

    const userId = await new Promise(resolve => {
        rl.question('Telegram Kullanıcı ID (userinfobot\'tan öğrenin): ', answer => resolve(answer.trim()));
    });

    rl.close();

    const envContent = `# RootBot v2.0 - Environment Variables
# ─────────────────────────────────────────────────────────────
# Telegram Configuration
TELEGRAM_TOKEN=${botToken}
ALLOWED_USER_ID=${userId}

# Application Settings
NODE_ENV=production
LOG_LEVEL=info

# Optional Settings (uncomment to use)
# PORT=3000
# SCREENSHOT_QUALITY=90
# RECORDING_FPS=30
`;

    fs.writeFileSync(envPath, envContent);
    log('✓ .env dosyası oluşturuldu', 'green');
}

// Klasör yapısı oluşturma
async function createDirectories() {
    log('\nKlasör Yapısı', 'cyan');
    log('─'.repeat(50), 'cyan');

    const createDirs = await askQuestion('Gerekli klasörleri oluşturmak ister misiniz? (e/h): ');

    if (createDirs !== 'e' && createDirs !== 'evet') {
        log('Klasör oluşturma atlandı.', 'yellow');
        return;
    }

    const dirs = [
        'logs',
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
            log(`✓ ${dir}/ zaten mevcut`, 'blue');
        }
    });

    log('✓ Klasör yapısı hazır', 'green');
}

// Otomatik başlatma
async function setupAutoStart() {
    log('\nOtomatik Başlatma', 'cyan');
    log('─'.repeat(50), 'cyan');

    const autoStart = await askQuestion('Windows başlangıcında otomatik başlatılsın mı? (e/h): ');

    if (autoStart !== 'e' && autoStart !== 'evet') {
        log('Otomatik başlatma atlandı.', 'yellow');
        return;
    }

    const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const vbsPath = path.join(startupFolder, 'RootBot.vbs');
    const batPath = path.join(__dirname, 'start_rootbot.bat');

    // Batch dosyası oluştur
    const batContent = `@echo off
cd /d "${__dirname}"
node main.js`;

    fs.writeFileSync(batPath, batContent);
    log('✓ start_rootbot.bat oluşturuldu', 'green');

    // VBS dosyası oluştur (görünmez başlatma)
    const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """${batPath}""", 0, false`;

    try {
        fs.writeFileSync(vbsPath, vbsContent);
        log('✓ Başlangıç klasörüne eklendi', 'green');
    } catch (error) {
        log('⚠ Başlangıç klasörüne eklenemedi: ' + error.message, 'yellow');
    }

    log('✓ Otomatik başlatma yapılandırıldı', 'green');
}

// Windows Defender istisnası
async function setupWindowsDefender() {
    log('\nWindows Defender İstisnası', 'cyan');
    log('─'.repeat(50), 'cyan');

    const defender = await askQuestion('Windows Defender istisnası eklensin mi? (e/h): ');

    if (defender !== 'e' && defender !== 'evet') {
        log('Windows Defender istisnası atlandı.', 'yellow');
        return;
    }

    try {
        const defenderPath = __dirname;
        await execPromise(`powershell -Command "Add-MpPreference -ExclusionPath '${defenderPath}'"`);
        log('✓ Windows Defender istisnası eklendi', 'green');
    } catch (error) {
        log('⚠ İstisna eklenemedi (yönetici yetkisi gerekli)', 'yellow');
    }
}

// Firewall istisnası
async function setupFirewall() {
    log('\nGüvenlik Duvarı İstisnası', 'cyan');
    log('─'.repeat(50), 'cyan');

    const firewall = await askQuestion('Güvenlik duvarı istisnası eklensin mi? (e/h): ');

    if (firewall !== 'e' && firewall !== 'evet') {
        log('Güvenlik duvarı istisnası atlandı.', 'yellow');
        return;
    }

    try {
        const nodePath = process.execPath;
        await execPromise(`netsh advfirewall firewall add rule name="RootBot" dir=in action=allow program="${nodePath}" enable=yes`);
        await execPromise(`netsh advfirewall firewall add rule name="RootBot" dir=out action=allow program="${nodePath}" enable=yes`);
        log('✓ Güvenlik duvarı istisnası eklendi', 'green');
    } catch (error) {
        log('⚠ İstisna eklenemedi (yönetici yetkisi gerekli)', 'yellow');
    }
}

// FFmpeg kontrolü
async function checkFFmpeg() {
    log('\nFFmpeg Kontrolü', 'cyan');
    log('─'.repeat(50), 'cyan');

    try {
        await execPromise('ffmpeg -version', { timeout: 3000 });
        log('✓ FFmpeg zaten yüklü', 'green');
        return true;
    } catch (e) {
        log('⚠ FFmpeg bulunamadı (ekran kaydı için gerekli)', 'yellow');
        log('  İndirme: https://ffmpeg.org/download.html', 'cyan');

        const install = await askQuestion('\nFFmpeg kurulum sayfasını açmak ister misiniz? (e/h): ');
        if (install === 'e' || install === 'evet') {
            exec('start https://ffmpeg.org/download.html');
        }
        return false;
    }
}

// Dependency kontrolü
async function checkDependencies() {
    log('\nBağımlılıklar', 'cyan');
    log('─'.repeat(50), 'cyan');

    const nodeModulesPath = path.join(__dirname, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
        log('⚠ node_modules bulunamadı', 'yellow');
        const install = await askQuestion('npm install çalıştırılsın mı? (e/h): ');

        if (install === 'e' || install === 'evet') {
            log('\nBağımlılıklar yükleniyor (birkaç dakika sürebilir)...', 'cyan');
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

// Ana kurulum fonksiyonu
async function install() {
    console.clear();

    log('╔═══════════════════════════════════════════════════════╗', 'cyan');
    log('║                                                       ║', 'cyan');
    log('║           RootBot v2.0 Kurulum Sihirbazı          ║', 'cyan');
    log('║      Windows PC Remote Control via Telegram          ║', 'cyan');
    log('║                                                       ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════╝', 'cyan');

    // Windows sürümü
    const winVersion = await detectWindowsVersion();
    log(`\n✓ ${winVersion.name} (Build ${winVersion.build})`, 'green');

    // Sistem kontrolleri
    const checks = await checkSystem();

    if (!checks.node || !checks.npm) {
        log('\n✗ Kritik hata: Node.js ve npm yüklü olmalı!', 'red');
        return;
    }

    log('\n─'.repeat(50), 'cyan');
    const continueInstall = await askQuestion('\nKuruluma devam edilsin mi? (e/h): ');

    if (continueInstall !== 'e' && continueInstall !== 'evet') {
        log('\nKurulum iptal edildi.', 'red');
        return;
    }

    // Kurulum adımları
    await checkDependencies();
    await createDirectories();
    await createEnvFile();
    await setupAutoStart();
    await setupWindowsDefender();
    await setupFirewall();
    await checkFFmpeg();

    // Özet
    log('\n╔═══════════════════════════════════════════════════════╗', 'green');
    log('║                                                       ║', 'green');
    log('║          KURULUM BAŞARIYLA TAMAMLANDI!            ║', 'green');
    log('║                                                       ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');

    log('\nSonraki Adımlar:', 'cyan');
    log('  1. npm start              → Botu başlat', 'yellow');
    log('  2. Telegram\'dan test et   → /start komutunu gönder', 'yellow');
    log('  3. Logları izle           → logs/ klasörü', 'yellow');

    log('\nKomutlar:', 'cyan');
    log('  npm start                 → Botu başlat', 'blue');
    log('  npm run dev               → Development mod', 'blue');
    log('  node uninstall.js         → Kaldır', 'blue');

    log('\nÖnemli Notlar:', 'yellow');
    log('  • .env dosyasını asla paylaşmayın!', 'red');
    log('  • Bot token\'ınızı güvende tutun', 'red');
    log('  • Sadece güvendiğiniz kişilere erişim verin', 'red');

    log('\n✓ RootBot kullanıma hazır!', 'green');
}

// Kurulumu başlat
install().catch(error => {
    log('\n✗ Kurulum hatası: ' + error.message, 'red');
    console.error(error);
    process.exit(1);
});
