<h1 align="center">Summernote Grid Plugin</h1>

<p align="center">
  <strong>A robust Bootstrap grid layout plugin for Summernote editor.</strong><br>
  Insert responsive multi-column layouts with contenteditable isolation — paste, type, and embed without breaking columns.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Summernote-0.8%2B-blue?logo=data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" alt="Summernote 0.8+">
  <img src="https://img.shields.io/badge/Bootstrap-5.x-purple?logo=bootstrap" alt="Bootstrap 5">
  <img src="https://img.shields.io/badge/jQuery-3.0%2B-blue?logo=jquery" alt="jQuery 3.0+">
  <img src="https://img.shields.io/badge/size-~4KB_min-brightgreen" alt="~4KB minified">
</p>

<p align="center">
  <a href="https://raca12.github.io/summernote-grid-plugin/examples/"><img src="https://img.shields.io/badge/Live_Demo-Try_it_now-ff6b6b?style=for-the-badge" alt="Live Demo"></a>
</p>

<p align="center">
  <img src="ekran.png" alt="Summernote Grid Plugin — Insert responsive columns in your editor" width="720">
</p>

---

## The Problem

Summernote (and most contenteditable editors) treats the entire editing area as one flat block. When you insert a grid with `<div class="row"><div class="col-md-6">...`:

- **Pasting content** destroys columns — the right column gets deleted
- **Backspace** merges columns together
- **Inserting media** (images, videos) pushes content outside the grid
- **The grid structure breaks** with almost any editing action

Every existing Summernote grid plugin has this problem because they create plain `<div>` elements that contenteditable doesn't respect.

## The Solution

This plugin uses **contenteditable isolation**:

```
+--------------------------------------------------+
|  .sn-grid  (contenteditable="false")              |
|  Summernote cannot modify this container          |
|                                                    |
|  +---------------------+ +---------------------+  |
|  | .sn-grid-col        | | .sn-grid-col        |  |
|  | contenteditable=true | | contenteditable=true |  |
|  |                      | |                      |  |
|  | Your content here.   | | Independent zone.    |  |
|  | Paste works.         | | Paste works.         |  |
|  | Backspace is safe.   | | Videos embed fine.   |  |
|  +---------------------+ +---------------------+  |
+--------------------------------------------------+
```

- **Row** has `contenteditable="false"` — Summernote can't touch it
- **Each column** has `contenteditable="true"` — independent editing zone
- **Paste events** are intercepted and sandboxed per column
- **Backspace/Delete** can't accidentally remove a column
- Result: **columns survive any editing action**

---

## Features

- 12 pre-built responsive layouts (equal and asymmetric)
- Visual preview icons in dropdown menu
- Bootstrap 5 grid classes (`col-md-*`)
- Paste protection (HTML + plain text, sandboxed per column)
- Keyboard navigation (Tab / Shift+Tab between columns)
- Backspace safety (empty columns survive, never get deleted)
- Auto-protection for existing grids on editor init
- One-click grid deletion (X button on hover)
- Drag & drop stays within column boundaries
- Mobile responsive (stacks vertically on small screens)
- Lightweight (~4KB minified)

---

## Demo

**[Live Demo](https://raca12.github.io/summernote-grid-plugin/examples/)** — Try it in your browser. No setup needed.

---

## Available Layouts

| Layout | Columns | Use Case |
|--------|---------|----------|
| 2 Kolon | `6 + 6` | Side-by-side content |
| 3 Kolon | `4 + 4 + 4` | Product cards, features |
| 4 Kolon | `3 + 3 + 3 + 3` | Gallery grid |
| 6 Kolon | `2 x 6` | Dense grid |
| 12 Kolon | `1 x 12` | Full micro grid |
| 8 + 4 | `8 + 4` | Content + sidebar |
| 4 + 8 | `4 + 8` | Sidebar + content |
| 9 + 3 | `9 + 3` | Wide content + narrow sidebar |
| 3 + 9 | `3 + 9` | Narrow sidebar + wide content |
| 3 + 6 + 3 | `3 + 6 + 3` | Centered content |
| 2 + 8 + 2 | `2 + 8 + 2` | Centered with margins |

---

## Installation

### CDN (Fastest)

```html
<!-- After Summernote CSS -->
<link href="https://cdn.jsdelivr.net/npm/summernote-grid-plugin@latest/dist/summernote-grid.min.css" rel="stylesheet">

<!-- After Summernote JS -->
<script src="https://cdn.jsdelivr.net/npm/summernote-grid-plugin@latest/dist/summernote-grid.min.js"></script>
```

### npm

```bash
npm install summernote-grid-plugin
```

### Manual

Download [`dist/summernote-grid.min.js`](dist/summernote-grid.min.js) and [`dist/summernote-grid.min.css`](dist/summernote-grid.min.css), include them after Summernote.

---

## Quick Start

```html
<!-- Dependencies -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote-lite.min.css" rel="stylesheet">
<link href="summernote-grid.min.css" rel="stylesheet">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote-lite.min.js"></script>
<script src="summernote-grid.min.js"></script>

<!-- Editor -->
<textarea id="editor"></textarea>

<script>
$('#editor').summernote({
    toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['grid', ['grid']],   // <-- Add this
        ['view', ['fullscreen', 'codeview']]
    ]
});
</script>
```

Click the grid icon in the toolbar, pick a layout, start editing inside columns. That's it.

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |

---

## Requirements

| Dependency | Version | Required |
|-----------|---------|----------|
| jQuery | 3.0+ | Yes |
| Summernote | 0.8+ (lite or full) | Yes |
| Bootstrap 5 (CSS) | 5.0+ | Yes (for grid classes) |
| Bootstrap Icons | 1.0+ | Yes (for toolbar icon) |

---

## File Structure

```
summernote-grid-plugin/
├── dist/
│   ├── summernote-grid.js          # Full source
│   ├── summernote-grid.min.js      # Minified (~4KB)
│   ├── summernote-grid.css         # Full styles
│   └── summernote-grid.min.css     # Minified styles
├── src/
│   ├── summernote-grid.js          # Development source
│   └── summernote-grid.css         # Development styles
├── examples/
│   └── index.html                  # Interactive demo
├── package.json
├── LICENSE                         # MIT
└── README.md
```

---

## Why This Plugin?

There are other Summernote grid plugins. They all break when you paste content, insert media, or press backspace. This is because they create plain `<div>` elements and hope contenteditable will respect them. It doesn't.

This plugin was built for a production multi-tenant e-commerce platform where content editors needed reliable multi-column layouts daily. The contenteditable isolation technique solved every grid-breaking issue.

**It just works. Paste anything, embed videos, backspace freely — your columns stay intact.**

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT &copy; [raca12](https://github.com/raca12)

---

<p align="center">
  <sub>If this saved you time, consider giving it a <a href="https://github.com/raca12/summernote-grid-plugin">star</a> ⭐</sub>
</p>
