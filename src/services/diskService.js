const { execPromise } = require('../utils/exec');

/**
 * Disk kullanımı bilgisi
 */
async function getDiskUsage() {
    try {
        const { stdout } = await execPromise('powershell -Command "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter, @{Name=\'FreeGB\';Expression={[math]::Round($_.SizeRemaining/1GB, 2)}}, @{Name=\'SizeGB\';Expression={[math]::Round($_.Size/1GB, 2)}}, @{Name=\'PercentFree\';Expression={[math]::Round(($_.SizeRemaining/$_.Size)*100, 2)}} | Format-Table -AutoSize | Out-String -Width 100"');
        return `💽 *Disk Kullanımı:*\n\n\`\`\`\n${stdout}\`\`\``;
    } catch (error) {
        return '❌ Disk kullanımı alınamadı: ' + error.message;
    }
}

/**
 * Disk temizliği
 */
async function cleanDisk() {
    try {
        let report = '*🧹 Disk Temizliği*\n\n';
        report += '⏳ Temizlik işlemleri başlatılıyor...\n\n';

        // Disk temizleme aracını çalıştır
        await execPromise('powershell -Command "Start-Process -FilePath cleanmgr.exe -ArgumentList \'/sagerun:1\' -WindowStyle Hidden"')
            .then(() => report += '✅ Disk temizleme aracı başlatıldı\n')
            .catch(() => report += '❌ Disk temizleme aracı başlatılamadı\n');

        // Geçici dosyaları temizle
        await execPromise('powershell -Command "$tempfolders = @(\'C:\\Windows\\Temp\', $env:TEMP); foreach ($folder in $tempfolders) { if(Test-Path $folder) { Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue }}"')
            .then(() => report += '✅ Geçici dosyalar temizlendi\n')
            .catch(() => report += '❌ Geçici dosyalar temizlenemedi\n');

        // Çöp kutusunu temizle
        await execPromise('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"')
            .then(() => report += '✅ Çöp kutusu temizlendi\n')
            .catch(() => report += '❌ Çöp kutusu temizlenemedi\n');

        // Disk durumunu görüntüle
        try {
            const { stdout: diskInfo } = await execPromise('powershell -Command "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter, @{Name=\'FreeGB\';Expression={[math]::Round($_.SizeRemaining/1GB, 2)}}, @{Name=\'SizeGB\';Expression={[math]::Round($_.Size/1GB, 2)}}, @{Name=\'PercentFree\';Expression={[math]::Round(($_.SizeRemaining/$_.Size)*100, 2)}} | Format-Table -AutoSize | Out-String -Width 100"');
            report += '\n*Disk Durumu:*\n```\n' + diskInfo + '```\n';
        } catch (e) {
            report += '\n*Disk Durumu:* Bilgi alınamadı\n';
        }

        return report;
    } catch (error) {
        console.error('Disk temizleme hatası:', error);
        return '❌ Disk temizleme başarısız: ' + error.message;
    }
}

/**
 * Disk analizi
 */
async function analyzeDisk() {
    try {
        let report = '*💾 Disk Analizi*\n\n';

        // Disk bilgileri
        const { stdout: volumeInfo } = await execPromise('powershell -Command "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter, FileSystemLabel, FileSystem, DriveType, @{Name=\'FreeGB\';Expression={[math]::Round($_.SizeRemaining/1GB, 2)}}, @{Name=\'SizeGB\';Expression={[math]::Round($_.Size/1GB, 2)}}, @{Name=\'PercentFree\';Expression={[math]::Round(($_.SizeRemaining/$_.Size)*100, 2)}} | Format-Table -AutoSize | Out-String -Width 100"');
        report += `*Disk Bilgileri:*\n\`\`\`\n${volumeInfo}\`\`\`\n`;

        // Disk sağlık durumu
        try {
            const { stdout: diskHealth } = await execPromise('powershell -Command "Get-PhysicalDisk | Select-Object FriendlyName, HealthStatus, OperationalStatus, Size | Format-Table -AutoSize | Out-String -Width 100"');
            report += `*Disk Sağlığı:*\n\`\`\`\n${diskHealth}\`\`\`\n`;
        } catch (e) {
            report += '*Disk Sağlığı:* Bilgi alınamadı (Yönetici yetkileri gerekli)\n';
        }

        // En büyük klasörler
        try {
            const { stdout: largeFolders } = await execPromise('powershell -Command "Get-ChildItem -Path C:\\ -Directory -ErrorAction SilentlyContinue | ForEach-Object { $size = (Get-ChildItem -Path $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; [PSCustomObject]@{Name=$_.Name; SizeGB=[math]::Round($size/1GB, 2)}} | Sort-Object -Property SizeGB -Descending | Select-Object -First 5 | Format-Table -AutoSize | Out-String -Width 100"', { timeout: 60000 });
            report += `*En Büyük Klasörler:*\n\`\`\`\n${largeFolders}\`\`\`\n`;
        } catch (e) {
            report += '*En Büyük Klasörler:* Bilgi alınamadı (işlem uzun sürdü)\n';
        }

        return report;
    } catch (error) {
        console.error('Disk analizi hatası:', error);
        return '❌ Disk analizi başarısız: ' + error.message;
    }
}

/**
 * Disk kontrolü (CHKDSK)
 */
async function checkDisk() {
    try {
        let report = '*🔍 Disk Kontrolü*\n\n';

        // Disk sağlık durumu
        const { stdout: diskStatus } = await execPromise('powershell -Command "Get-PhysicalDisk | Select-Object FriendlyName, HealthStatus, OperationalStatus | Format-Table -AutoSize"', { timeout: 10000 });
        report += '*Disk Durumu:*\n```\n' + diskStatus + '```\n';

        // CHKDSK /f disk kilitli olduğunda çalışmaz
        // Bu yüzden sonraki yeniden başlatmada çalışması için planlıyoruz
        try {
            await execPromise('echo Y | chkdsk C: /f', { timeout: 5000 });
            report += '\n⚠️ Disk kontrolü sonraki yeniden başlatmada çalışacak şekilde planlandı.\n';
            report += 'CHKDSK /f disk kilitli olduğunda çalışamaz, bilgisayar yeniden başlatıldığında otomatik olarak çalışacak.\n';
        } catch (chkdskError) {
            report += '\n⚠️ Disk kontrolü planlanamadı. Manuel olarak komut satırından "chkdsk C: /f" komutunu çalıştırabilirsiniz.\n';
        }

        return report;
    } catch (error) {
        console.error('Disk kontrolü hatası:', error);
        return '❌ Disk kontrolü başarısız: ' + error.message;
    }
}

module.exports = {
    getDiskUsage,
    cleanDisk,
    analyzeDisk,
    checkDisk
};
