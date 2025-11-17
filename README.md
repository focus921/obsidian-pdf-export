# Obsidian PDF Export (Mobile)

Export your Obsidian notes to PDF on mobile devices (iOS/Android) using the native print functionality.

## Features

- Export Markdown notes to PDF on iOS and Android
- Uses system native print-to-PDF (no memory limitations)
- Full Chinese/CJK character support
- Customizable font size and line height
- Preview before exporting
- No external dependencies (lightweight ~11KB)

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "PDF Export Mobile"
4. Install and enable the plugin

### Manual Installation

1. Download `main.js` and `manifest.json` from the latest release
2. Create folder: `<vault>/.obsidian/plugins/pdf-export-mobile/`
3. Copy the downloaded files into the folder
4. Reload Obsidian and enable the plugin

## Usage

### Method 1: Command Palette

1. Open the note you want to export
2. Press `Cmd/Ctrl + P` to open command palette
3. Search for "Export current note to PDF"
4. Follow the on-screen instructions

### Method 2: File Menu

1. Right-click (or long-press on mobile) on a markdown file
2. Select "Export to PDF"

### Exporting on iOS

1. A preview modal will open with your rendered note
2. Click "Copy HTML" button
3. Open Safari and paste the copied URL into the address bar
4. Use Share → Print → Pinch to zoom on preview → Save as PDF

### Exporting on Desktop

1. A preview modal will open
2. Click "Print Preview" button
3. Use your browser's "Save as PDF" option

## Settings

- **Font Size**: Base font size for PDF (10-24px)
- **Line Height**: Text line height multiplier (1.2-2.0)
- **Include Title**: Show document title at the top of PDF

## Why This Approach?

Previous versions used `html2canvas` + `jsPDF` which caused "Incomplete or corrupt PNG file" errors on iOS due to memory constraints. This version uses the system's native print functionality, which:

- Has no memory limitations
- Supports documents of any length
- Provides better CJK character rendering
- Is more stable and reliable

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode
npm run dev
```

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/focus921/obsidian-pdf-export/issues) on GitHub.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Derek - CyBrainSpark
