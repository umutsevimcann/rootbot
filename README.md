# RootBot - Windows PC Remote Control via Telegram

A powerful Telegram bot for remotely controlling Windows PCs. Manage your computer from anywhere using simple Telegram commands.

## Features

### System Control
- System information and monitoring
- Temperature sensors
- Process management
- Shutdown, restart, sleep controls
- Lock/unlock computer

### File Management
- Browse folders and files
- Upload files to specific directories
- Download files from PC
- Search files
- View recent files

### Media Control
- Screen recording
- Webcam capture
- Screenshots
- Audio control (volume, mute/unmute)

### Security
- Multi-factor authentication support
- Path traversal protection
- Command injection prevention
- Secure file operations

### Performance Monitoring
- CPU and RAM usage
- Disk space monitoring
- Network statistics
- System uptime tracking

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/PCKilitPro.git
cd PCKilitPro
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```env
TELEGRAM_TOKEN=your_bot_token_here
ALLOWED_USER_ID=your_telegram_user_id
```

4. Run the bot
```bash
npm start
```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# Telegram Bot Configuration
TELEGRAM_TOKEN=your_telegram_bot_token
ALLOWED_USER_ID=your_telegram_user_id

# Optional
NODE_ENV=production
LOG_LEVEL=info
```

## Security

- Only authorized users can control the bot (configured via ALLOWED_USER_ID)
- All file operations are path-validated to prevent directory traversal
- Command injection protection on system commands
- Encrypted secrets support (optional)

## Requirements

- Node.js 16+ or higher
- Windows 10/11
- Telegram Bot Token (get from @BotFather)
- Your Telegram User ID (get from @userinfobot)

## Project Structure

```
PCKilitPro/
├── src/
│   ├── bot/              # Telegram bot core
│   ├── handlers/         # Message handlers
│   ├── services/         # Business logic
│   ├── ui/               # Menu systems
│   ├── utils/            # Utility functions
│   └── core/             # Core configuration
├── downloads/            # Downloaded files
├── recordings/           # Screen recordings
├── screenshots/          # Screenshots
├── webcam/               # Webcam captures
└── main.js               # Entry point
```

## Usage

After starting the bot, send `/start` or any message to your Telegram bot to receive the main menu.

### Main Menu Options
- **Sistem** - System information and control
- **Dosya** - File management
- **Güvenlik** - Security settings
- **Ses** - Audio controls
- **Otomasyon** - Task automation
- **Performans** - Performance monitoring

## Development

The project uses a modular architecture:
- **PHASE 1**: Initial implementation
- **PHASE 2**: Menu consolidation
- **PHASE 3**: Core configuration refactoring
- **PHASE 4**: State management with UserStateManager

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT License - see LICENSE file for details

## Disclaimer

This tool is for educational and personal use only. Users are responsible for complying with all applicable laws and regulations. The developer assumes no liability for misuse of this software.

## Support

For issues and questions, please open an issue on GitHub.
