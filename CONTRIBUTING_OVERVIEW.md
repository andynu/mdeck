# Tauri Markdown Editor - Technical Overview

This is a **Tauri** application - a framework that lets you build desktop apps using web technologies (HTML/JS/CSS) with a Rust backend. This document provides a technical walkthrough for contributors.

## Architecture Overview

**Tauri** combines:
- **Frontend**: HTML/JavaScript/CSS running in a web view (not a full browser, but a native OS webview)
- **Backend**: Rust code that handles system operations (file access, native APIs)
- **IPC Bridge**: Communication between frontend and backend via commands

## Project Structure

```
├── src/                  # Frontend web files
│   ├── index.html       # Main HTML
│   ├── main.js          # JavaScript logic
│   └── styles.css       # Dark theme styling
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── main.rs      # Entry point
│   │   └── lib.rs       # Core Rust logic & commands
│   ├── tauri.conf.json  # Tauri configuration
│   └── Cargo.toml       # Rust dependencies
└── package.json         # Node dependencies for build tools
```

## Core Tauri Concepts

### 1. Commands
Functions in Rust exposed to JavaScript:
```rust
#[command]
fn read_file(path: String) -> Result<String, String>
```
Called from JS via:
```javascript
await invoke('read_file', { path: selected })
```

### 2. Plugins
Tauri provides plugins for native capabilities:
- `tauri-plugin-dialog`: Native file picker dialogs
- `tauri-plugin-opener`: Open files with system apps

### 3. Security
CSP (Content Security Policy) in `tauri.conf.json` controls what resources can load

## Current Features

### 1. Markdown Editor (src/main.js:1-596)
- Live preview using `marked.js` library
- Split-pane interface
- Real-time rendering with 150ms debounce

### 2. Presentation Mode (src/main.js:56-188)
- Slides separated by `---` in markdown
- Fullscreen support
- Navigation: arrows, space, scroll wheel
- Exit with ESC

### 3. File Operations (src/main.js:190-271)
- Opens `.md` files via native dialog
- **Image handling**: When opening a file, relative image paths are:
  1. Resolved to absolute paths (src-tauri/src/lib.rs:33-42)
  2. Read as binary data (src-tauri/src/lib.rs:12-30)
  3. Converted to base64 data URLs
  4. Embedded directly in HTML

### 4. PDF Export (src/main.js:273-455)
- Uses `html2canvas` to capture slides as images
- `jsPDF` to create PDF document
- Each slide becomes a PDF page

## How Tauri Differs from Web Development

1. **File System Access**: Direct file reads without user upload
2. **Native Dialogs**: OS-native file pickers, not HTML inputs
3. **No Server**: Everything runs locally on the user's machine
4. **Binary Distribution**: Compiles to a native executable (.exe, .app, .deb)
5. **IPC Communication**: Frontend can't directly access files; must go through Rust commands

## Development Workflow

- `npm run tauri dev` - Runs in development mode (hot reload)
- `npm run tauri build` - Creates distributable binary
- Frontend changes reflect immediately
- Rust changes require rebuild

## Key Technical Details

### Frontend-Backend Communication
The frontend communicates with the Rust backend through the `invoke` function:
```javascript
const { invoke } = window.__TAURI__.core;
const content = await invoke('read_file', { path: selected });
```

### Image Path Resolution
When markdown contains relative image paths, the app:
1. Extracts image references from markdown
2. Resolves paths relative to the markdown file location
3. Reads image files as binary data
4. Converts to base64 data URLs for embedding

### Presentation Navigation
The presentation mode supports multiple navigation methods:
- **Keyboard**: Arrow keys, Space, Page Up/Down, Home/End
- **Mouse**: Scroll wheel
- **Buttons**: On-screen previous/next controls
- **Shortcuts**: F to toggle fullscreen, ESC to exit

### PDF Generation Process
1. Parse markdown into individual slides
2. Create temporary DOM container with slide content
3. Apply presentation styling
4. Use html2canvas to capture as image
5. Add image to PDF with jsPDF
6. Download to user's system

## Contributing Guidelines

When contributing to this project:

1. **Frontend Changes**: Edit files in `src/` directory
2. **Backend Changes**: Edit Rust files in `src-tauri/src/`
3. **New Commands**: Add to `lib.rs` and register in `invoke_handler`
4. **Dependencies**:
   - JavaScript: Add to `package.json`
   - Rust: Add to `src-tauri/Cargo.toml`

The app is essentially a lightweight markdown presentation tool that leverages Tauri's ability to access the file system while using familiar web technologies for the UI.