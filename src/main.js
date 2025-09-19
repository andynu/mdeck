import { marked } from 'marked';

let markdownInput;
let previewOutput;
let updateTimer;

function updatePreview() {
  const markdown = markdownInput.value;
  const html = marked(markdown);
  previewOutput.innerHTML = html;
}

function debounceUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updatePreview, 150);
}

window.addEventListener("DOMContentLoaded", () => {
  markdownInput = document.querySelector("#markdown-input");
  previewOutput = document.querySelector("#preview-output");

  markdownInput.addEventListener("input", debounceUpdate);

  const initialContent = `# Welcome to Markdown Editor

This is a **live preview** markdown editor built with Tauri!

## Features

- Real-time preview
- Syntax highlighting
- Dark theme
- Split pane view

### Try it out!

Type some markdown on the left and see it rendered on the right.

\`\`\`javascript
console.log("Hello from Tauri!");
\`\`\`

> Blockquotes look great too!

- List item 1
- List item 2
  - Nested item
  - Another nested item

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

[Visit Tauri](https://tauri.app)`;

  markdownInput.value = initialContent;
  updatePreview();
});