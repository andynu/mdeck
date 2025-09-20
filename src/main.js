// marked, jsPDF and html2canvas are loaded globally from CDN
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

let markdownInput;
let previewOutput;
let presentationView;
let slideContent;
let updateTimer;
let slides = [];
let currentSlide = 0;
let isPresentation = false;
let currentFilePath = null;
let markedRenderer = null;
let isPreviewVisible = true;
let isMiniPresentation = false;
let fileChangeUnlistener = null;

function parseSlides(markdown) {
  const slideDelimiter = /^---+\s*$/gm;
  const rawSlides = markdown.split(slideDelimiter);
  return rawSlides.filter(slide => slide.trim().length > 0);
}

function renderSlide(slideIndex) {
  if (slideIndex < 0 || slideIndex >= slides.length) return;

  const slideMarkdown = slides[slideIndex];
  const html = markedRenderer ? marked.parse(slideMarkdown, { renderer: markedRenderer }) : marked.parse(slideMarkdown);
  slideContent.innerHTML = html;

  document.getElementById('slide-number').textContent = `${slideIndex + 1} / ${slides.length}`;

  document.getElementById('prev-slide').disabled = slideIndex === 0;
  document.getElementById('next-slide').disabled = slideIndex === slides.length - 1;

  currentSlide = slideIndex;
}

function updatePreview() {
  const markdown = markdownInput.value;

  if (isPresentation) {
    slides = parseSlides(markdown);
    if (currentSlide >= slides.length) {
      currentSlide = Math.max(0, slides.length - 1);
    }
    renderSlide(currentSlide);
  } else if (isMiniPresentation) {
    slides = parseSlides(markdown);
    if (currentSlide >= slides.length) {
      currentSlide = Math.max(0, slides.length - 1);
    }
    renderMiniSlide(currentSlide);
  } else {
    const html = markedRenderer ? marked.parse(markdown, { renderer: markedRenderer }) : marked.parse(markdown);
    previewOutput.innerHTML = html;
  }
}

function renderMiniSlide(slideIndex) {
  if (slideIndex < 0 || slideIndex >= slides.length) return;

  const slideMarkdown = slides[slideIndex];
  const html = markedRenderer ? marked.parse(slideMarkdown, { renderer: markedRenderer }) : marked.parse(slideMarkdown);

  // Create mini slide container with navigation
  previewOutput.innerHTML = `
    <div class="mini-presentation-container">
      <div class="mini-slide-content">
        ${html}
      </div>
      <div class="mini-slide-controls">
        <button class="mini-nav-btn" onclick="navigateMiniSlide(-1)" ${slideIndex === 0 ? 'disabled' : ''}>◀</button>
        <span class="mini-slide-counter">${slideIndex + 1} / ${slides.length}</span>
        <button class="mini-nav-btn" onclick="navigateMiniSlide(1)" ${slideIndex === slides.length - 1 ? 'disabled' : ''}>▶</button>
      </div>
    </div>
  `;

  currentSlide = slideIndex;
}

function navigateMiniSlide(direction) {
  const newSlide = currentSlide + direction;
  if (newSlide >= 0 && newSlide < slides.length) {
    renderMiniSlide(newSlide);
  }
}

function debounceUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updatePreview, 150);
}

async function togglePresentationMode() {
  isPresentation = !isPresentation;

  const toggleBtn = document.getElementById('toggle-mode');
  const editorPane = document.querySelector('.editor-pane');
  const previewPane = document.querySelector('.preview-pane');

  if (isPresentation) {
    // Hide the entire editor and preview panes
    editorPane.classList.add('hidden');
    previewPane.classList.add('hidden');
    presentationView.classList.remove('hidden');
    toggleBtn.textContent = 'Exit Presentation';
    toggleBtn.classList.add('active');

    slides = parseSlides(markdownInput.value);
    currentSlide = 0;
    renderSlide(currentSlide);

    // Show hint about how to exit
    const hint = document.createElement('div');
    hint.className = 'presentation-hint';
    hint.textContent = 'Press ESC to exit presentation';
    document.body.appendChild(hint);
    setTimeout(() => {
      if (hint.parentNode) {
        hint.remove();
      }
    }, 3000);

    // Request fullscreen on the presentation view container
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { // Safari
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE11
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request failed:', err);
    }
  } else {
    exitPresentationMode();
  }
}

function exitPresentationMode() {
  isPresentation = false;

  const toggleBtn = document.getElementById('toggle-mode');
  const editorPane = document.querySelector('.editor-pane');
  const previewPane = document.querySelector('.preview-pane');

  // Restore editor and preview panes
  editorPane.classList.remove('hidden');
  previewPane.classList.remove('hidden');
  presentationView.classList.add('hidden');
  toggleBtn.textContent = 'Presentation Mode';
  toggleBtn.classList.remove('active');

  // Exit fullscreen
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  } else if (document.webkitExitFullscreen) { // Safari
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { // IE11
    document.msExitFullscreen();
  }

  updatePreview();
}

function handleKeyNavigation(e) {
  if (!isPresentation) return;

  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    if (currentSlide > 0) {
      renderSlide(currentSlide - 1);
    }
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    if (currentSlide < slides.length - 1) {
      renderSlide(currentSlide + 1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentSlide > 0) {
      renderSlide(currentSlide - 1);
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (currentSlide < slides.length - 1) {
      renderSlide(currentSlide + 1);
    }
  } else if (e.key === 'Home') {
    e.preventDefault();
    renderSlide(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    renderSlide(slides.length - 1);
  } else if (e.key === 'Escape') {
    exitPresentationMode();
  } else if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    togglePresentationMode();
  }
}

function handleWheelNavigation(e) {
  if (!isPresentation) return;

  e.preventDefault();

  // Debounce wheel events to avoid too rapid scrolling
  if (handleWheelNavigation.scrolling) return;
  handleWheelNavigation.scrolling = true;
  setTimeout(() => { handleWheelNavigation.scrolling = false; }, 300);

  if (e.deltaY > 0) {
    // Scrolling down - next slide
    if (currentSlide < slides.length - 1) {
      renderSlide(currentSlide + 1);
    }
  } else if (e.deltaY < 0) {
    // Scrolling up - previous slide
    if (currentSlide > 0) {
      renderSlide(currentSlide - 1);
    }
  }
}

async function loadFileContent(filePath) {
  const content = await invoke('read_file', { path: filePath });
  currentFilePath = filePath;

      // Create a custom renderer for handling image paths
      markedRenderer = new marked.Renderer();

      // Store resolved image paths
      const imagePathMap = new Map();

      // First, pre-process all images in the markdown to resolve their paths
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const matches = [...content.matchAll(imageRegex)];

      const pathPromises = matches.map(match => {
        const imagePath = match[2];
        // Only process relative paths
        if (imagePath && !imagePath.match(/^(https?:\/\/|data:|\/)/)) {
          return invoke('resolve_path', {
            basePath: currentFilePath,
            relativePath: imagePath
          }).then(resolvedPath => {
            // Read the image and convert to base64 data URL
            return invoke('read_image_as_base64', { path: resolvedPath });
          }).then(dataUrl => {
            imagePathMap.set(imagePath, dataUrl);
            console.log('Loaded image:', imagePath, '(as data URL)');
          }).catch(err => {
            console.error('Failed to load image:', imagePath, err);
          });
        }
        return Promise.resolve();
      });

      // Wait for all paths to be resolved before rendering
      Promise.all(pathPromises).then(() => {
        // Now render with resolved paths
        markedRenderer.image = function(href, title, text) {
          // Handle marked.js passing objects
          if (typeof href === 'object' && href !== null) {
            if (href.href) {
              href = href.href;
            } else {
              return '';
            }
          }

          // Check if we have a resolved path for this image
          if (imagePathMap.has(href)) {
            const resolvedUrl = imagePathMap.get(href);
            console.log('Rendering image:', href);
            // Return the img tag with the resolved file:// URL
            const altText = text || '';
            const titleAttr = title ? ` title="${title}"` : '';
            return `<img src="${resolvedUrl}" alt="${altText}"${titleAttr}>`;
          }

          // For absolute URLs or data URLs, use the original href
          const altText = text || '';
          const titleAttr = title ? ` title="${title}"` : '';
          return `<img src="${href}" alt="${altText}"${titleAttr}>`;
        };

        markdownInput.value = content;
        updatePreview();
      });
}

async function openFile() {
  try {
    const selected = await window.TauriDialog.open({
      multiple: false,
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown']
      }]
    });

    if (selected) {
      await loadFileContent(selected);

      // Stop any existing file watcher
      if (fileChangeUnlistener) {
        fileChangeUnlistener();
        fileChangeUnlistener = null;
      }

      // Start watching the new file
      await invoke('start_watching_file', { filePath: selected });

      // Listen for file changes
      fileChangeUnlistener = await listen('file-changed', async (event) => {
        console.log('File changed, reloading...', event.payload);

        // Store current cursor position and scroll position
        const cursorPos = markdownInput.selectionStart;
        const scrollPos = markdownInput.scrollTop;
        const previewScrollPos = previewOutput.scrollTop;

        // Reload the file content
        await loadFileContent(event.payload);

        // Restore cursor and scroll positions
        markdownInput.selectionStart = cursorPos;
        markdownInput.selectionEnd = cursorPos;
        markdownInput.scrollTop = scrollPos;
        previewOutput.scrollTop = previewScrollPos;

        // Show a subtle notification
        showReloadNotification();
      });
    }
  } catch (error) {
    console.error('Error opening file:', error);
    alert('Error opening file: ' + error);
  }
}

function showReloadNotification() {
  const existing = document.querySelector('.reload-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'reload-notification';
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    animation: fadeInOut 2s ease;
  `;
  notification.textContent = 'File reloaded';
  document.body.appendChild(notification);

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(-10px); }
      20% { opacity: 1; transform: translateY(0); }
      80% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function togglePreview() {
  isPreviewVisible = !isPreviewVisible;
  const previewPane = document.querySelector('.preview-pane');
  const editorPane = document.querySelector('.editor-pane');
  const toggleBtn = document.getElementById('toggle-preview');

  if (isPreviewVisible) {
    previewPane.classList.remove('hidden');
    editorPane.classList.remove('full-width');
    toggleBtn.textContent = '👁️';
    toggleBtn.title = 'Hide Preview (Ctrl+Shift+P)';
    updatePreview();
  } else {
    previewPane.classList.add('hidden');
    editorPane.classList.add('full-width');
    toggleBtn.textContent = '👁️‍🗨️';
    toggleBtn.title = 'Show Preview (Ctrl+Shift+P)';
  }
}

function toggleMiniPresentation() {
  isMiniPresentation = !isMiniPresentation;
  const miniBtn = document.getElementById('mini-mode');
  const editorPane = document.querySelector('.editor-pane');
  const previewPane = document.querySelector('.preview-pane');

  if (isMiniPresentation) {
    // Hide editor, show only preview with mini presentation
    editorPane.classList.add('hidden');
    previewPane.classList.remove('hidden');
    previewPane.classList.add('mini-presentation-mode');
    miniBtn.classList.add('active');
    miniBtn.title = 'Exit Mini Presentation (Ctrl+M)';

    // Initialize slides and render first one
    slides = parseSlides(markdownInput.value);
    currentSlide = 0;
    renderMiniSlide(currentSlide);
  } else {
    // Restore normal view
    editorPane.classList.remove('hidden');
    previewPane.classList.remove('mini-presentation-mode');
    miniBtn.classList.remove('active');
    miniBtn.title = 'Mini Presentation (Ctrl+M)';

    // Restore preview visibility state
    if (!isPreviewVisible) {
      previewPane.classList.add('hidden');
      editorPane.classList.add('full-width');
    }

    updatePreview();
  }
}

// Make navigateMiniSlide global so onclick handlers work
window.navigateMiniSlide = navigateMiniSlide;

async function exportToPDF() {
  const exportBtn = document.getElementById('export-pdf');
  exportBtn.disabled = true;
  exportBtn.textContent = 'Generating PDF...';

  try {
    const pdf = new window.jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const markdown = markdownInput.value;
    const slideTexts = parseSlides(markdown);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1024px';
    tempContainer.style.padding = '40px';
    tempContainer.style.background = 'white';
    document.body.appendChild(tempContainer);

    for (let i = 0; i < slideTexts.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      tempContainer.innerHTML = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          color: #333;
          line-height: 1.6;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">
          ${markedRenderer ? marked.parse(slideTexts[i], { renderer: markedRenderer }) : marked.parse(slideTexts[i])}
        </div>
      `;

      const headings = tempContainer.querySelectorAll('h1, h2, h3');
      headings.forEach(h => {
        h.style.textAlign = 'center';
        h.style.marginBottom = '20px';
      });

      tempContainer.querySelectorAll('img').forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '20px auto';
      });

      tempContainer.querySelectorAll('ul, ol').forEach(list => {
        list.style.marginLeft = '20px';
        list.style.marginBottom = '16px';
        list.style.paddingLeft = '20px';
      });

      tempContainer.querySelectorAll('li').forEach(li => {
        li.style.marginBottom = '8px';
        li.style.lineHeight = '1.6';
      });

      tempContainer.querySelectorAll('ul ul, ol ol, ul ol, ol ul').forEach(nestedList => {
        nestedList.style.marginLeft = '20px';
        nestedList.style.marginTop = '8px';
        nestedList.style.marginBottom = '8px';
      });

      tempContainer.querySelectorAll('pre').forEach(pre => {
        pre.style.background = '#f5f5f5';
        pre.style.padding = '15px';
        pre.style.borderRadius = '5px';
        pre.style.overflow = 'auto';
      });

      tempContainer.querySelectorAll('code').forEach(code => {
        if (!code.parentElement.matches('pre')) {
          code.style.background = '#f5f5f5';
          code.style.padding = '2px 5px';
          code.style.borderRadius = '3px';
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pageHeight = 210;
      const verticalMargin = (pageHeight - Math.min(imgHeight, pageHeight - 20)) / 2;

      pdf.addImage(imgData, 'PNG', 0, verticalMargin, imgWidth, Math.min(imgHeight, pageHeight - 20));
    }

    document.body.removeChild(tempContainer);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `presentation_${timestamp}.pdf`;
    pdf.save(filename);

    // Show success message
    exportBtn.textContent = '✓ PDF Saved!';
    exportBtn.style.background = '#28a745';

    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-size: 14px;
    `;
    notification.innerHTML = `
      <strong>PDF Downloaded!</strong><br>
      <small>${filename} saved to your Downloads folder</small>
    `;
    document.body.appendChild(notification);

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      notification.style.animationFillMode = 'forwards';

      // Add slide-out animation
      const slideOutStyle = document.createElement('style');
      slideOutStyle.textContent = `
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(slideOutStyle);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);

    // Reset button after 3 seconds
    setTimeout(() => {
      exportBtn.style.background = '';
      exportBtn.textContent = 'Export PDF';
    }, 3000);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please check the console for details.');
  } finally {
    exportBtn.disabled = false;
    if (exportBtn.textContent === 'Generating PDF...') {
      exportBtn.textContent = 'Export PDF';
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  markdownInput = document.querySelector("#markdown-input");
  previewOutput = document.querySelector("#preview-output");
  presentationView = document.querySelector("#presentation-view");
  slideContent = document.querySelector("#slide-content");

  markdownInput.addEventListener("input", debounceUpdate);

  document.getElementById('toggle-mode').addEventListener('click', togglePresentationMode);
  document.getElementById('prev-slide').addEventListener('click', () => renderSlide(currentSlide - 1));
  document.getElementById('next-slide').addEventListener('click', () => renderSlide(currentSlide + 1));
  document.getElementById('export-pdf').addEventListener('click', exportToPDF);
  document.getElementById('open-file').addEventListener('click', openFile);
  document.getElementById('toggle-preview').addEventListener('click', togglePreview);
  document.getElementById('mini-mode').addEventListener('click', toggleMiniPresentation);

  document.addEventListener('keydown', (e) => {
    // Add keyboard shortcuts
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      togglePreview();
    } else if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      toggleMiniPresentation();
    } else if (isMiniPresentation) {
      // Handle navigation in mini mode
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateMiniSlide(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        navigateMiniSlide(1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleMiniPresentation();
      }
    } else {
      handleKeyNavigation(e);
    }
  });

  // Add wheel navigation for mini presentation mode
  previewOutput.addEventListener('wheel', (e) => {
    if (!isMiniPresentation) return;

    e.preventDefault();

    // Debounce wheel events to avoid too rapid scrolling
    if (previewOutput.wheelTimeout) return;
    previewOutput.wheelTimeout = true;
    setTimeout(() => { previewOutput.wheelTimeout = false; }, 300);

    if (e.deltaY > 0) {
      // Scrolling down - next slide
      navigateMiniSlide(1);
    } else if (e.deltaY < 0) {
      // Scrolling up - previous slide
      navigateMiniSlide(-1);
    }
  }, { passive: false });
  document.addEventListener('wheel', handleWheelNavigation, { passive: false });

  // Handle fullscreen changes (e.g., user presses ESC to exit fullscreen)
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isPresentation) {
      exitPresentationMode();
    }
  });

  // For Safari
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && isPresentation) {
      exitPresentationMode();
    }
  });

  const initialContent = `# Welcome to Markdown Editor

This is a **live preview** markdown editor built with Tauri!

## Features

- Real-time preview
- Syntax highlighting
- Dark theme
- Split pane view
- **NEW: Fullscreen presentation mode!**
- **PDF Export** - Save your presentations as PDF

---

# Presentation Mode

**Now with Fullscreen Support!**

Use three dashes (---) to separate slides

## Navigation Options:

- **Keyboard:** Arrow keys (↑↓←→), Space, Page Up/Down
- **Mouse:** Scroll wheel up/down
- **Shortcuts:**
  - Press **F** to toggle fullscreen
  - Press **Escape** to exit presentation
  - **Home/End** for first/last slide

---

## PDF Export

Click the "Export PDF" button to save your presentation as a PDF file.

Each slide becomes a page in the PDF with:
- Centered headings
- Proper image scaling
- Code block formatting
- Professional layout

---

## Images Support

You can include images using markdown syntax:

![Tauri Logo](./test-image.svg)

Images work with relative paths from the markdown file location.

You can also use images from the assets folder:

![JavaScript Logo](./assets/javascript.svg)

---

## Creating Slides

Just add horizontal rules to split your content:

\`\`\`markdown
# Slide 1
Content here

---

# Slide 2
More content
\`\`\`

---

### Try it out!

Type some markdown on the left and see it rendered on the right.

\`\`\`javascript
console.log("Hello from Tauri!");
\`\`\`

> Blockquotes look great too!

---

## Lists and Tables

- List item 1
- List item 2
  - Nested item
  - Another nested item

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

---

# Thank You!

[Visit Tauri](https://tauri.app)

Toggle between **Editor Mode** and **Presentation Mode** using the button above!`;

  // Listen for initial file from command line argument
  const unlistenInitial = await listen('load-initial-file', async (event) => {
    console.log('Loading initial file from command line:', event.payload.path);
    await loadFileContent(event.payload.path);

    // Start watching the file
    if (fileChangeUnlistener) {
      fileChangeUnlistener();
      fileChangeUnlistener = null;
    }
    await invoke('start_watching_file', { filePath: event.payload.path });

    // Listen for file changes
    fileChangeUnlistener = await listen('file-changed', async (event) => {
      console.log('File changed, reloading...', event.payload);

      // Store current cursor position and scroll position
      const cursorPos = markdownInput.selectionStart;
      const scrollPos = markdownInput.scrollTop;
      const previewScrollPos = previewOutput.scrollTop;

      // Reload the file content
      await loadFileContent(event.payload);

      // Restore cursor and scroll positions
      markdownInput.selectionStart = cursorPos;
      markdownInput.selectionEnd = cursorPos;
      markdownInput.scrollTop = scrollPos;
      previewOutput.scrollTop = previewScrollPos;

      // Show a subtle notification
      showReloadNotification();
    });

    // Unsubscribe from initial file event after first load
    unlistenInitial();
  });

  // Set default content if no file is loaded from command line
  setTimeout(() => {
    if (!currentFilePath) {
      markdownInput.value = initialContent;
      updatePreview();
    }
  }, 1000);

  // Clean up file watcher when closing
  window.addEventListener('beforeunload', async () => {
    if (fileChangeUnlistener) {
      fileChangeUnlistener();
      await invoke('stop_watching_file');
    }
  });
});