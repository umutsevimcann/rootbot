/**
 * Path Validation Utility
 * VULN-004: Path Traversal Prevention (CVSS 8.8)
 *
 * Prevents directory traversal attacks (../, ..\, etc.)
 * CWE-22: Path Traversal
 * OWASP A03:2021 - Injection
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Dinamik olarak tüm disk sürücülerini tespit et
function getAllDrives() {
    const drives = [];

    // A'dan Z'ye tüm harfleri kontrol et
    for (let i = 65; i <= 90; i++) { // A=65, Z=90
        const letter = String.fromCharCode(i);
        const drivePath = `${letter}:\\`;

        // Disk var mı kontrol et
        try {
            if (fs.existsSync(drivePath)) {
                drives.push(drivePath);
            }
        } catch (error) {
            // Erişim hatası - devam et
            continue;
        }
    }

    return drives.length > 0 ? drives : ['C:\\'];
}

// Allowed base directories (whitelist)
const ALLOWED_DIRECTORIES = [
    ...getAllDrives(), // Tüm disk sürücüleri (C:\, D:\, E:\, vb.)
    'C:\\Users',
    'C:\\Temp',
    'C:\\Downloads',
    path.join(process.cwd(), 'downloads'),
    path.join(process.cwd(), 'recordings'),
    path.join(process.cwd(), 'screenshots'),
    path.join(process.cwd(), 'webcam'),
    path.join(process.cwd(), 'temp'),
    path.join(process.cwd(), 'data')
];

/**
 * Validate and sanitize file path
 * @param {string} inputPath - User-provided path
 * @param {string} baseDir - Base directory (optional)
 * @returns {string} - Validated absolute path
 * @throws {Error} - If path is invalid or dangerous
 */
function validatePath(inputPath, baseDir = null) {
    if (!inputPath || typeof inputPath !== 'string') {
        throw new Error('Path must be a non-empty string');
    }

    // Remove null bytes (security)
    if (inputPath.includes('\0')) {
        throw new Error('Path contains null bytes');
    }

    // Resolve to absolute path
    const absolutePath = baseDir
        ? path.resolve(baseDir, inputPath)
        : path.resolve(inputPath);

    // Normalize path (removes .. and .)
    const normalizedPath = path.normalize(absolutePath);

    // Check if path is within allowed directories
    const isAllowed = ALLOWED_DIRECTORIES.some(allowedDir => {
        const normalized = path.normalize(allowedDir);
        return normalizedPath.startsWith(normalized);
    });

    if (!isAllowed) {
        throw new Error(
            `Access denied: Path outside allowed directories\n` +
            `Requested: ${normalizedPath}\n` +
            `Allowed: ${ALLOWED_DIRECTORIES.join(', ')}`
        );
    }

    // Check for symbolic link traversal
    try {
        const realPath = fs.realpathSync(normalizedPath);
        if (realPath !== normalizedPath) {
            // Verify symlink target is also allowed
            const symlinkAllowed = ALLOWED_DIRECTORIES.some(allowedDir =>
                realPath.startsWith(path.normalize(allowedDir))
            );

            if (!symlinkAllowed) {
                throw new Error('Symbolic link points outside allowed directories');
            }
        }
    } catch (error) {
        // File doesn't exist yet (ok for create operations)
        // Or realpath failed (continue with normalized path)
    }

    return normalizedPath;
}

/**
 * Check if path is safe (doesn't traverse outside base)
 * @param {string} inputPath - Path to check
 * @param {string} baseDir - Base directory
 * @returns {boolean} - True if safe
 */
function isSafePath(inputPath, baseDir) {
    try {
        validatePath(inputPath, baseDir);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Add allowed directory to whitelist
 * @param {string} directory - Directory to allow
 */
function addAllowedDirectory(directory) {
    const normalized = path.normalize(path.resolve(directory));

    if (!ALLOWED_DIRECTORIES.includes(normalized)) {
        ALLOWED_DIRECTORIES.push(normalized);
    }
}

/**
 * Get list of allowed directories
 * @returns {string[]} - Array of allowed directories
 */
function getAllowedDirectories() {
    return [...ALLOWED_DIRECTORIES];
}

module.exports = {
    validatePath,
    isSafePath,
    addAllowedDirectory,
    getAllowedDirectories
};
