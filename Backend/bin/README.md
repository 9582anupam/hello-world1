# FFmpeg Installation Instructions

This application uses FFmpeg for processing video files. You have two options to make it work:

## Option 1: Install FFmpeg Globally (Recommended)

### Windows:
1. Download FFmpeg from the official website: https://ffmpeg.org/download.html
   - Alternatively, use the direct link: https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
2. Extract the zip file to a folder of your choice (e.g., `C:\ffmpeg`)
3. Add FFmpeg to your PATH:
   - Right-click "This PC" and select "Properties"
   - Click on "Advanced system settings"
   - Click on the "Environment Variables" button
   - Under "System Variables", find and select "Path", then click "Edit"
   - Click "New" and add the path to the `bin` directory (e.g., `C:\ffmpeg\bin`)
   - Click "OK" on all dialogs to save your changes
4. Restart your terminal/command prompt

### macOS:
```bash
# Using Homebrew
brew install ffmpeg

# Using MacPorts
port install ffmpeg
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### Linux (Fedora):
```bash
sudo dnf install ffmpeg
```

## Option 2: Place FFmpeg Executables in This Directory

Place the appropriate FFmpeg binary for your platform in this directory:

- Windows: `ffmpeg.exe` 
- macOS: `ffmpeg`
- Linux: `ffmpeg`

You can download the binaries from: https://ffmpeg.org/download.html

## Verifying Installation

To verify FFmpeg is installed correctly, run:

```bash
ffmpeg -version
```

You should see version information if the installation was successful.

## Troubleshooting

If you encounter the error `'ffmpeg' is not recognized as an internal or external command`, it means FFmpeg is not properly installed or not in your PATH. Follow the instructions above to fix this issue.
