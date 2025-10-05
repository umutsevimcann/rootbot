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

// Otomatik başlatmayı kaldır
async function removeAutoStart() {
    log('\n🚫 Otomatik Başlatma Kaldırılıyor', 'cyan');
    log('─'.repeat(50), 'cyan');

    const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const vbsPath = path.join(startupFolder, 'RootBot.vbs');
    const batPath = path.join(__dirname, 'start_rootbot.bat');

    let removedCount = 0;

    // VBS dosyasını kaldır
    if (fs.existsSync(vbsPath)) {
        try {
            fs.unlinkSync(vbsPath);
            log('✓ Başlangıç klasöründeki VBS dosyası silindi', 'green');
            removedCount++;
        } catch (error) {
            log('⚠ VBS dosyası silinemedi: ' + error.message, 'yellow');
        }
    }

    // BAT dosyasını kaldır
    if (fs.existsSync(batPath)) {
        try {
            fs.unlinkSync(batPath);
            log('✓ start_rootbot.bat silindi', 'green');
            removedCount++;
        } catch (error) {
            log('⚠ BAT dosyası silinemedi: ' + error.message, 'yellow');
        }
    }

    // Registry kaydını kaldır
    try {
        await execPromise('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "RootBot" /f');
        log('✓ Registry kaydı silindi', 'green');
        removedCount++;
    } catch (error) {
        // Registry kaydı yoksa hata verir, normal
        if (!error.message.includes('unable to find')) {
            log('⚠ Registry kaydı silinemedi: ' + error.message, 'yellow');
        }
    }

    if (removedCount === 0) {
        log('ℹ Otomatik başlatma zaten kaldırılmış', 'blue');
    } else {
        log(`✓ ${removedCount} otomatik başlatma kaydı temizlendi`, 'green');
    }
}

// Güvenlik ayarlarını kaldır
async function removeSecurity() {
    log('\n🔓 Güvenlik Ayarları Kaldırılıyor', 'cyan');
    log('─'.repeat(50), 'cyan');

    const remove = await askQuestion('Güvenlik ayarlarını kaldırmak ister misiniz? (e/h): ');

    if (remove !== 'e' && remove !== 'evet') {
        log('Güvenlik ayarları korundu.', 'yellow');
        return;
    }

    let removedCount = 0;

    // Windows Defender istisnasını kaldır
    const defender = await askQuestion('Windows Defender istisnasını kaldırmak ister misiniz? (e/h): ');
    if (defender === 'e' || defender === 'evet') {
        try {
            const defenderPath = __dirname;
            await execPromise(`powershell -Command "Remove-MpPreference -ExclusionPath '${defenderPath}'"`);
            log('✓ Windows Defender istisnası kaldırıldı', 'green');
            removedCount++;
        } catch (error) {
            log('⚠ Windows Defender istisnası kaldırılamadı (yönetici yetkisi gerekebilir)', 'yellow');
        }
    }

    // Firewall kurallarını kaldır
    const firewall = await askQuestion('Güvenlik duvarı kurallarını kaldırmak ister misiniz? (e/h): ');
    if (firewall === 'e' || firewall === 'evet') {
        try {
            await execPromise('netsh advfirewall firewall delete rule name="RootBot"');
            log('✓ Güvenlik duvarı kuralları kaldırıldı', 'green');
            removedCount++;
        } catch (error) {
            log('⚠ Güvenlik duvarı kuralları kaldırılamadı', 'yellow');
        }
    }

    if (removedCount > 0) {
        log(`✓ ${removedCount} güvenlik ayarı kaldırıldı`, 'green');
    }
}

// Klasörleri temizle
async function cleanDirectories() {
    log('\n📁 Klasör Temizliği', 'cyan');
    log('─'.repeat(50), 'cyan');

    const dirs = [
        { name: 'logs', description: 'Log dosyaları' },
        { name: 'data', description: 'Veri dosyaları' },
        { name: 'temp', description: 'Geçici dosyalar' },
        { name: 'screenshots', description: 'Ekran görüntüleri' },
        { name: 'recordings', description: 'Ekran kayıtları' },
        { name: 'webcam', description: 'Webcam görüntüleri' }
    ];

    for (const dir of dirs) {
        const dirPath = path.join(__dirname, dir.name);

        if (!fs.existsSync(dirPath)) {
            log(`ℹ ${dir.name}/ klasörü zaten yok`, 'blue');
            continue;
        }

        // Klasör içindeki dosya sayısını say
        const files = fs.readdirSync(dirPath);
        const fileCount = files.length;

        if (fileCount === 0) {
            log(`ℹ ${dir.name}/ klasörü boş`, 'blue');
            const removeEmpty = await askQuestion(`${dir.name}/ (boş klasör) silinsin mi? (e/h): `);
            if (removeEmpty === 'e' || removeEmpty === 'evet') {
                try {
                    fs.rmdirSync(dirPath);
                    log(`✓ ${dir.name}/ klasörü silindi`, 'green');
                } catch (error) {
                    log(`⚠ ${dir.name}/ klasörü silinemedi: ${error.message}`, 'yellow');
                }
            }
            continue;
        }

        log(`\n📂 ${dir.name}/ - ${fileCount} dosya (${dir.description})`, 'cyan');
        const removeDir = await askQuestion(`${dir.name}/ klasörünü ve içindekileri silmek ister misiniz? (e/h): `);

        if (removeDir === 'e' || removeDir === 'evet') {
            try {
                // Klasör içindeki tüm dosyaları sil
                files.forEach(file => {
                    const filePath = path.join(dirPath, file);
                    try {
                        if (fs.lstatSync(filePath).isDirectory()) {
                            fs.rmdirSync(filePath, { recursive: true });
                        } else {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        log(`  ⚠ ${file} silinemedi`, 'yellow');
                    }
                });

                // Klasörü sil
                fs.rmdirSync(dirPath);
                log(`✓ ${dir.name}/ klasörü ve ${fileCount} dosya silindi`, 'green');
            } catch (error) {
                log(`⚠ ${dir.name}/ klasörü silinemedi: ${error.message}`, 'yellow');
            }
        } else {
            log(`ℹ ${dir.name}/ klasörü korundu`, 'blue');
        }
    }
}

// Yapılandırma dosyalarını kontrol et
async function checkConfigFiles() {
    log('\n⚙️ Yapılandırma Dosyaları', 'cyan');
    log('─'.repeat(50), 'cyan');

    const configFiles = [
        { path: '.env', description: 'Environment variables (Telegram token, User ID)' },
        { path: 'config.json', description: 'Eski yapılandırma dosyası' }
    ];

    log('⚠ UYARI: Yapılandırma dosyaları silinmeyecek!', 'yellow');
    log('  Bu dosyalar önemli bilgiler içerir ve manuel olarak silinmelidir.', 'yellow');
    log('', 'reset');

    for (const file of configFiles) {
        const filePath = path.join(__dirname, file.path);
        if (fs.existsSync(filePath)) {
            log(`✓ ${file.path} mevcut (${file.description})`, 'cyan');
            log(`  → Konum: ${filePath}`, 'blue');
        }
    }
}

// Bağımlılıkları kontrol et
async function checkDependencies() {
    log('\n📦 Bağımlılıklar', 'cyan');
    log('─'.repeat(50), 'cyan');

    const nodeModulesPath = path.join(__dirname, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
        log('ℹ node_modules zaten yok', 'blue');
        return;
    }

    log('⚠ UYARI: node_modules klasörü çok büyük olabilir', 'yellow');
    const removeModules = await askQuestion('node_modules klasörünü silmek ister misiniz? (e/h): ');

    if (removeModules === 'e' || removeModules === 'evet') {
        log('\n🗑️ node_modules siliniyor (bu birkaç dakika sürebilir)...', 'cyan');
        try {
            await execPromise('rmdir /s /q node_modules', { timeout: 60000 });
            log('✓ node_modules klasörü silindi', 'green');
            log('ℹ Tekrar yüklemek için: npm install', 'blue');
        } catch (error) {
            log('⚠ node_modules silinemedi: ' + error.message, 'yellow');
            log('  Manuel olarak silebilirsiniz: rmdir /s /q node_modules', 'cyan');
        }
    } else {
        log('ℹ node_modules korundu', 'blue');
    }
}

// Ana kaldırma fonksiyonu
async function uninstall() {
    console.clear();

    log('╔═══════════════════════════════════════════════════════╗', 'red');
    log('║                                                       ║', 'red');
    log('║          🗑️  RootBot Kaldırma Sihirbazı             ║', 'red');
    log('║     Windows PC Remote Control Telegram Bot           ║', 'red');
    log('║                                                       ║', 'red');
    log('╚═══════════════════════════════════════════════════════╝', 'red');

    log('\n⚠️  UYARI', 'yellow');
    log('─'.repeat(50), 'yellow');
    log('Bu işlem RootBot\'u sisteminizden kaldıracak.', 'yellow');
    log('Yapılandırma dosyaları (.env, config.json) korunacak.', 'yellow');
    log('Diğer dosyalar için seçim yapabilirsiniz.', 'yellow');

    log('\n─'.repeat(50), 'cyan');
    const continueUninstall = await askQuestion('\nKaldırma işlemine devam edilsin mi? (e/h): ');

    if (continueUninstall !== 'e' && continueUninstall !== 'evet') {
        log('\n❌ Kaldırma işlemi iptal edildi.', 'red');
        return;
    }

    // Kaldırma adımları
    await removeAutoStart();
    await removeSecurity();
    await cleanDirectories();
    await checkDependencies();
    await checkConfigFiles();

    // Özet
    log('\n╔═══════════════════════════════════════════════════════╗', 'green');
    log('║                                                       ║', 'green');
    log('║        ✅ KALDIRMA İŞLEMİ TAMAMLANDI!               ║', 'green');
    log('║                                                       ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');

    log('\n📝 Kalan Dosyalar:', 'cyan');
    log('  • .env                   → Telegram ayarları (manuel silin)', 'yellow');
    log('  • package.json           → Proje dosyası (korundu)', 'yellow');
    log('  • src/                   → Kaynak kodlar (korundu)', 'yellow');
    log('  • install.js / uninstall.js → Kurulum scriptleri (korundu)', 'yellow');

    log('\n💡 Tekrar Yüklemek İçin:', 'cyan');
    log('  1. npm run install       → RootBot\'u yeniden kur', 'blue');
    log('  2. npm start             → Botu başlat', 'blue');

    log('\n🗑️  Tamamen Silmek İçin:', 'cyan');
    log('  • Proje klasörünü manuel olarak silin: rmdir /s /q d:\\PCKilitPro', 'magenta');

    log('\n👋 RootBot kaldırıldı!', 'green');
}

// Kaldırmayı başlat
uninstall().catch(error => {
    log('\n✗ Kaldırma hatası: ' + error.message, 'red');
    process.exit(1);
});
