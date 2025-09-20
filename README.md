# MDeck - Markdown Presentation Editor

> [!NOTE]
> This entire project was generated with Claude, an AI assistant by Anthropic.

A powerful markdown editor with live preview and presentation mode, built with Tauri.

## Features

- **Live Markdown Preview** - See your markdown rendered in real-time as you type
- **Command-Line File Opening** - Open markdown files directly from the terminal
- **File Open Dialog** - Load markdown files through the UI file picker
- **Fullscreen Presentation Mode** - Convert your markdown into beautiful presentations
- **PDF Export** - Export your presentations to PDF format
- **Slide Navigation** - Multiple ways to navigate through your slides:
  - Keyboard: Arrow keys, Space, Page Up/Down, Home/End
  - Mouse: Scroll wheel
  - UI: Navigation buttons
- **Dark Theme** - Easy on the eyes with a VS Code-inspired dark theme
- **Image Support** - Include images using relative paths
- **Syntax Highlighting** - Code blocks with proper formatting

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (LTS version) - [Download](https://nodejs.org/)
- **Rust** - [Install Rust](https://www.rust-lang.org/tools/install)
- **System Dependencies**:
  - **Linux**: WebKit GTK development libraries:
    - Ubuntu/Debian: `sudo apt install libjavascriptcoregtk-4.1-dev libsoup-3.0-dev libwebkit2gtk-4.1-dev`
    - Fedora: `sudo dnf install webkit2gtk4.1-devel javascriptcoregtk4.1-devel libsoup3-devel`
    - Arch: `sudo pacman -S webkit2gtk-4.1 javascriptcore-glib-4.1`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools

## Installation

### From Source

1. Clone the repository:
```bash
git clone <repository-url>
cd mdeck
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run tauri build
```

4. Install the built application:
   - **macOS**: Move `src-tauri/target/release/bundle/macos/mdeck.app` to `/Applications/`
   - **Windows**: Run the installer from `src-tauri/target/release/bundle/msi/mdeck.msi`
   - **Linux**:
     - AppImage: Make executable with `chmod +x mdeck.AppImage` and run directly
     - Debian/Ubuntu: Install with `sudo dpkg -i mdeck.deb`
     - Or copy the binary: `sudo cp src-tauri/target/release/mdeck /usr/local/bin/`

### Quick Install (Linux/macOS)

For a system-wide installation of just the binary:
```bash
npm run tauri build
sudo cp src-tauri/target/release/mdeck /usr/local/bin/
```

## Development

Run the app in development mode with hot-reload:

```bash
npm run tauri dev
```

This will:
- Start the Tauri development server
- Open the application window
- Enable hot-reload for frontend changes
- Automatically rebuild Rust code when changed

## Building for Production

Create an optimized build for your platform:

```bash
npm run tauri build
```

The built application will be located in:
- **macOS**: `src-tauri/target/release/bundle/macos/mdeck.app`
- **Windows**: `src-tauri/target/release/bundle/msi/` or `/nsis/` (mdeck.msi or mdeck.exe installer)
- **Linux**: `src-tauri/target/release/bundle/appimage/mdeck.AppImage` or `/deb/mdeck.deb`

The standalone binary (without installer) can be found at:
- **All platforms**: `src-tauri/target/release/mdeck` (or `mdeck.exe` on Windows)

## Usage

### Command-Line Usage

Open a markdown file directly when launching the application:

```bash
# If installed globally
mdeck path/to/your/presentation.md

# Or using the full path to the binary
/usr/local/bin/mdeck ~/Documents/slides.md

# On Windows
mdeck.exe C:\Users\YourName\Documents\presentation.md
```

### Opening Files from the UI

Click the "Open File" button in the header to load an existing markdown file into the editor. The file picker will filter for `.md` and `.markdown` files.

### Creating Presentations

1. Write your content in markdown in the left pane
2. Use `---` (three or more dashes) on a line by itself to separate slides
3. Click "Presentation Mode" to view as fullscreen slides

### Presentation Controls

- **Start Presentation**: Click "Presentation Mode" button
- **Navigate Slides**:
  - Next: `→`, `↓`, `Space`, `Page Down`, or scroll down
  - Previous: `←`, `↑`, `Page Up`, or scroll up
  - First slide: `Home`
  - Last slide: `End`
- **Toggle Fullscreen**: Press `F`
- **Exit Presentation**: Press `Escape` or click "Exit Fullscreen"

### Exporting to PDF

Click the "Export PDF" button to save your presentation as a PDF file. Each slide will be rendered as a separate page with professional formatting.

### Example Markdown

```markdown
# Slide 1 Title

Your content here

---

# Slide 2 Title

- Bullet point 1
- Bullet point 2

![Image](./path/to/image.png)

---

# Final Slide

Thank you!
```

## Project Structure

```
mdeck/
├── src/                    # Frontend source files
│   ├── index.html         # Main HTML file
│   ├── main.js            # JavaScript logic
│   ├── styles.css         # Styling
│   └── assets/            # Static assets
├── src-tauri/             # Rust backend
│   ├── src/              # Rust source code
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Troubleshooting

### Linux: Missing webkit2gtk or JavaScriptCore

If you see an error about missing `webkit2gtk`, `javascriptcoregtk-4.1`, or related libraries on Linux:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install libjavascriptcoregtk-4.1-dev libsoup-3.0-dev libwebkit2gtk-4.1-dev
```

**Fedora:**
```bash
sudo dnf install webkit2gtk4.1-devel javascriptcoregtk4.1-devel libsoup3-devel
```

**Arch:**
```bash
sudo pacman -S webkit2gtk-4.1 javascriptcore-glib-4.1
```

### Build Errors

If the build fails:
1. Ensure all prerequisites are installed
2. Clear the build cache: `rm -rf src-tauri/target`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Try building again

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

[Your License Here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.