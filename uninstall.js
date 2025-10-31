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

// Klasör silme
function deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            return true;
        } catch (error) {
            log(`⚠ ${dirPath} silinemedi: ${error.message}`, 'yellow');
            return false;
        }
    }
    return false;
}

// Dosya silme
function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch (error) {
            log(`⚠ ${filePath} silinemedi: ${error.message}`, 'yellow');
            return false;
        }
    }
    return false;
}

// Klasör boyutu hesaplama
function getFolderSize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;

    let totalSize = 0;
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                totalSize += getFolderSize(filePath);
            } else {
                totalSize += fs.statSync(filePath).size;
            }
        }
    } catch (error) {
        // Ignore errors
    }
    return totalSize;
}

// Boyut formatla
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// node_modules silme
async function removeNodeModules() {
    const nodeModulesPath = path.join(__dirname, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
        log('✓ node_modules zaten yok', 'blue');
        return;
    }

    const size = getFolderSize(nodeModulesPath);
    log(`\nnode_modules klasörü: ${formatSize(size)}`, 'cyan');

    const remove = await askQuestion('node_modules klasörünü silmek istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        log('node_modules siliniyor (bu biraz sürebilir)...', 'yellow');
        if (deleteDirectory(nodeModulesPath)) {
            log('✓ node_modules silindi', 'green');
        }
    } else {
        log('node_modules korundu', 'blue');
    }
}

// .env silme
async function removeEnvFile() {
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
        log('\n✓ .env dosyası zaten yok', 'blue');
        return;
    }

    log('\n.env dosyası (Bot token ve ayarlarınız)', 'cyan');
    log('⚠ DİKKAT: Silersen bot token\'ı yeniden girmen gerekir!', 'red');

    const remove = await askQuestion('.env dosyasını silmek istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        if (deleteFile(envPath)) {
            log('✓ .env silindi', 'green');
        }
    } else {
        log('.env korundu', 'blue');
    }
}

// Log dosyaları silme
async function removeLogs() {
    const logsPath = path.join(__dirname, 'logs');

    if (!fs.existsSync(logsPath)) {
        log('\n✓ logs klasörü zaten yok', 'blue');
        return;
    }

    const size = getFolderSize(logsPath);
    log(`\nlogs klasörü: ${formatSize(size)}`, 'cyan');

    const remove = await askQuestion('Log dosyalarını silmek istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        if (deleteDirectory(logsPath)) {
            log('✓ logs klasörü silindi', 'green');
        }
    } else {
        log('logs korundu', 'blue');
    }
}

// Medya dosyaları silme
async function removeMediaFiles() {
    const mediaDirs = ['screenshots', 'recordings', 'webcam', 'temp'];
    const existingDirs = mediaDirs.filter(dir => fs.existsSync(path.join(__dirname, dir)));

    if (existingDirs.length === 0) {
        log('\n✓ Medya klasörleri zaten yok', 'blue');
        return;
    }

    let totalSize = 0;
    existingDirs.forEach(dir => {
        totalSize += getFolderSize(path.join(__dirname, dir));
    });

    log(`\nMedya dosyaları (${existingDirs.join(', ')}): ${formatSize(totalSize)}`, 'cyan');

    const remove = await askQuestion('Tüm medya dosyalarını silmek istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        let deleted = 0;
        existingDirs.forEach(dir => {
            if (deleteDirectory(path.join(__dirname, dir))) {
                deleted++;
            }
        });
        log(`✓ ${deleted} medya klasörü silindi`, 'green');
    } else {
        log('Medya dosyaları korundu', 'blue');
    }
}

// Otomatik başlatma kaldırma
async function removeAutoStart() {
    log('\nOtomatik Başlatma', 'cyan');

    const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const vbsPath = path.join(startupFolder, 'RootBot.vbs');
    const batPath = path.join(__dirname, 'start_rootbot.bat');

    const hasVbs = fs.existsSync(vbsPath);
    const hasBat = fs.existsSync(batPath);

    if (!hasVbs && !hasBat) {
        log('✓ Otomatik başlatma zaten yok', 'blue');
        return;
    }

    const remove = await askQuestion('Otomatik başlatmayı kaldırmak istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        let removed = 0;

        if (deleteFile(vbsPath)) {
            log('✓ Başlangıç klasöründen kaldırıldı', 'green');
            removed++;
        }

        if (deleteFile(batPath)) {
            log('✓ start_rootbot.bat silindi', 'green');
            removed++;
        }

        // Registry kaydını kaldır
        try {
            await execPromise('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "RootBot" /f');
            log('✓ Registry kaydı kaldırıldı', 'green');
            removed++;
        } catch (error) {
            // Registry kaydı yoksa hata vermez
        }

        if (removed > 0) {
            log('✓ Otomatik başlatma kaldırıldı', 'green');
        }
    } else {
        log('Otomatik başlatma korundu', 'blue');
    }
}

// Windows Defender istisnası kaldırma
async function removeWindowsDefender() {
    log('\nWindows Defender İstisnası', 'cyan');

    const remove = await askQuestion('Windows Defender istisnasını kaldırmak istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        try {
            const defenderPath = __dirname;
            await execPromise(`powershell -Command "Remove-MpPreference -ExclusionPath '${defenderPath}'"`);
            log('✓ Windows Defender istisnası kaldırıldı', 'green');
        } catch (error) {
            log('⚠ İstisna kaldırılamadı (yönetici yetkisi gerekli veya zaten yok)', 'yellow');
        }
    } else {
        log('Windows Defender istisnası korundu', 'blue');
    }
}

// Firewall kuralı kaldırma
async function removeFirewall() {
    log('\nGüvenlik Duvarı Kuralı', 'cyan');

    const remove = await askQuestion('Güvenlik duvarı kuralını kaldırmak istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        try {
            await execPromise('netsh advfirewall firewall delete rule name="RootBot"');
            log('✓ Güvenlik duvarı kuralı kaldırıldı', 'green');
        } catch (error) {
            log('⚠ Kural kaldırılamadı (yönetici yetkisi gerekli veya zaten yok)', 'yellow');
        }
    } else {
        log('Güvenlik duvarı kuralı korundu', 'blue');
    }
}

// package-lock.json silme
async function removePackageLock() {
    const lockPath = path.join(__dirname, 'package-lock.json');

    if (!fs.existsSync(lockPath)) {
        return;
    }

    log('\npackage-lock.json dosyası', 'cyan');

    const remove = await askQuestion('package-lock.json dosyasını silmek istiyor musunuz? (e/h): ');

    if (remove === 'e' || remove === 'evet') {
        if (deleteFile(lockPath)) {
            log('✓ package-lock.json silindi', 'green');
        }
    } else {
        log('package-lock.json korundu', 'blue');
    }
}

// Ana kaldırma fonksiyonu
async function uninstall() {
    console.clear();

    log('╔═══════════════════════════════════════════════════════╗', 'red');
    log('║                                                       ║', 'red');
    log('║         RootBot v2.0 Kaldırma Sihirbazı           ║', 'red');
    log('║                                                       ║', 'red');
    log('╚═══════════════════════════════════════════════════════╝', 'red');

    log('\n⚠ DİKKAT: Bu işlem RootBot kurulumunu temizleyecektir.', 'yellow');
    log('Her adımı teker teker size soracağım.\n', 'cyan');

    const continueUninstall = await askQuestion('Kaldırmaya devam etmek istiyor musunuz? (e/h): ');

    if (continueUninstall !== 'e' && continueUninstall !== 'evet') {
        log('\nKaldırma iptal edildi.', 'green');
        return;
    }

    log('\n─'.repeat(50), 'cyan');

    // Kaldırma adımları
    await removeAutoStart();
    await removeWindowsDefender();
    await removeFirewall();
    await removeMediaFiles();
    await removeLogs();
    await removeEnvFile();
    await removePackageLock();
    await removeNodeModules();

    // Özet
    log('\n╔═══════════════════════════════════════════════════════╗', 'green');
    log('║                                                       ║', 'green');
    log('║         KALDIRMA İŞLEMİ TAMAMLANDI!              ║', 'green');
    log('║                                                       ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');

    log('\nKalan Dosyalar:', 'cyan');
    log('  • src/ klasörü (kaynak kodlar)', 'blue');
    log('  • package.json (proje tanımı)', 'blue');
    log('  • install.js, uninstall.js (kurulum araçları)', 'blue');
    log('  • main.js (ana dosya)', 'blue');

    log('\nTam Kaldırma İçin:', 'yellow');
    log('  Proje klasörünü manuel olarak silebilirsiniz.', 'yellow');

    log('\nYeniden Kurulum İçin:', 'cyan');
    log('  node install.js komutunu çalıştırın', 'cyan');

    log('\n✓ Güle güle!', 'green');
}

// Kaldırmayı başlat
uninstall().catch(error => {
    log('\n✗ Kaldırma hatası: ' + error.message, 'red');
    console.error(error);
    process.exit(1);
});
