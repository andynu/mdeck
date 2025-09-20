// marked is loaded globally from CDN

let markdownInput;
let previewOutput;
let presentationView;
let slideContent;
let updateTimer;
let slides = [];
let currentSlide = 0;
let isPresentation = false;

function parseSlides(markdown) {
  const slideDelimiter = /^---+$/gm;
  const rawSlides = markdown.split(slideDelimiter);
  return rawSlides.filter(slide => slide.trim().length > 0);
}

function renderSlide(slideIndex) {
  if (slideIndex < 0 || slideIndex >= slides.length) return;

  const slideMarkdown = slides[slideIndex];
  const html = marked.parse(slideMarkdown);
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
  } else {
    const html = marked.parse(markdown);
    previewOutput.innerHTML = html;
  }
}

function debounceUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updatePreview, 150);
}

async function togglePresentationMode() {
  isPresentation = !isPresentation;

  const toggleBtn = document.getElementById('toggle-mode');

  if (isPresentation) {
    previewOutput.classList.add('hidden');
    presentationView.classList.remove('hidden');
    toggleBtn.textContent = 'Exit Fullscreen';
    toggleBtn.classList.add('active');

    slides = parseSlides(markdownInput.value);
    currentSlide = 0;
    renderSlide(currentSlide);

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
  previewOutput.classList.remove('hidden');
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

window.addEventListener("DOMContentLoaded", () => {
  markdownInput = document.querySelector("#markdown-input");
  previewOutput = document.querySelector("#preview-output");
  presentationView = document.querySelector("#presentation-view");
  slideContent = document.querySelector("#slide-content");

  markdownInput.addEventListener("input", debounceUpdate);

  document.getElementById('toggle-mode').addEventListener('click', togglePresentationMode);
  document.getElementById('prev-slide').addEventListener('click', () => renderSlide(currentSlide - 1));
  document.getElementById('next-slide').addEventListener('click', () => renderSlide(currentSlide + 1));

  document.addEventListener('keydown', handleKeyNavigation);
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

  markdownInput.value = initialContent;
  updatePreview();
});