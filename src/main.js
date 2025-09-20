import { marked } from 'marked';

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
  const html = marked(slideMarkdown);
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
    const html = marked(markdown);
    previewOutput.innerHTML = html;
  }
}

function debounceUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updatePreview, 150);
}

function togglePresentationMode() {
  isPresentation = !isPresentation;

  const toggleBtn = document.getElementById('toggle-mode');

  if (isPresentation) {
    previewOutput.classList.add('hidden');
    presentationView.classList.remove('hidden');
    toggleBtn.textContent = 'Editor Mode';
    toggleBtn.classList.add('active');

    slides = parseSlides(markdownInput.value);
    currentSlide = 0;
    renderSlide(currentSlide);
  } else {
    previewOutput.classList.remove('hidden');
    presentationView.classList.add('hidden');
    toggleBtn.textContent = 'Presentation Mode';
    toggleBtn.classList.remove('active');

    updatePreview();
  }
}

function handleKeyNavigation(e) {
  if (!isPresentation) return;

  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    if (currentSlide > 0) {
      renderSlide(currentSlide - 1);
    }
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    if (currentSlide < slides.length - 1) {
      e.preventDefault();
      renderSlide(currentSlide + 1);
    }
  } else if (e.key === 'Home') {
    renderSlide(0);
  } else if (e.key === 'End') {
    renderSlide(slides.length - 1);
  } else if (e.key === 'Escape') {
    togglePresentationMode();
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

  const initialContent = `# Welcome to Markdown Editor

This is a **live preview** markdown editor built with Tauri!

## Features

- Real-time preview
- Syntax highlighting
- Dark theme
- Split pane view
- **NEW: Presentation mode!**

---

# Presentation Mode

Use three dashes (---) to separate slides

- Navigate with arrow keys or buttons
- Press Escape to exit presentation
- Space bar or Page Down for next slide

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