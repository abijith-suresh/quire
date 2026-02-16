# Pasta - Client-Side PDF Manipulation Tool

## Overview

Pasta is a fully client-side PDF manipulation tool built with Astro. All operations (merge, split, reorder, rotate, delete, compress, watermark, convert) happen entirely in the browser using pdf-lib. No files are sent to any server.

## Repository

- **GitHub**: https://github.com/abijith-suresh/pasta
- **Deployment**: GitHub Pages (via GitHub Actions)

## Tech Stack

- **Framework**: Astro 5.x (static site)
- **Language**: Pure JavaScript (no React/Vue)
- **Styling**: Tailwind CSS 4.x
- **PDF Library**: pdf-lib
- **Package Manager**: Bun
- **Deployment**: GitHub Pages

## Project Structure

```
pasta/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── public/                      # Static assets
├── src/
│   ├── components/              # Astro components
│   │   ├── PDFDropzone.astro   # File upload with drag-drop
│   │   ├── PDFViewer.astro     # Page thumbnails/preview
│   │   ├── Toolbar.astro       # Action buttons
│   │   └── Layout.astro        # Base layout
│   ├── pages/                   # Route pages
│   │   ├── index.astro         # Home/dashboard
│   │   ├── merge.astro         # Merge PDFs
│   │   ├── split.astro         # Split PDF
│   │   ├── reorder.astro       # Reorder pages
│   │   ├── rotate.astro        # Rotate pages
│   │   ├── delete.astro        # Delete pages
│   │   ├── compress.astro      # Compress/optimize
│   │   ├── watermark.astro     # Add watermark
│   │   └── convert.astro       # Convert to/from images
│   ├── scripts/
│   │   └── pdf-utils.js        # Shared pdf-lib utilities
│   └── styles/
│       └── global.css          # Tailwind directives
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
└── README.md
```

## Installation & Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Available Operations

1. **Merge**: Combine multiple PDFs into one
2. **Split**: Extract pages or split into separate files
3. **Reorder**: Drag and drop to reorder pages
4. **Rotate**: Rotate pages 90°/180°/270°
5. **Delete**: Remove specific pages
6. **Compress**: Reduce file size
7. **Watermark**: Add text or image watermarks
8. **Convert**: PDF to images or images to PDF

## Coding Conventions

### JavaScript

- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use arrow functions where appropriate
- Async/await for promises
- Module imports/exports (ES modules)

### Astro Components

- Use `.astro` extension
- Keep logic in frontmatter (`---` block)
- Use client directives (`client:load`, `client:visible`) sparingly
- Props destructuring: `const { propName } = Astro.props`

### Styling

- Tailwind CSS utility classes
- No inline styles
- Responsive design with Tailwind breakpoints
- Dark mode support (optional future feature)

### File Naming

- Components: PascalCase (`PDFDropzone.astro`)
- Scripts: camelCase (`pdf-utils.js`)
- Pages: lowercase with dashes (`merge.astro`)
- Assets: lowercase with dashes

## Dependencies to Install

```bash
# Core
bun add pdf-lib
bun add file-saver

# Development
bun add -D @tailwindcss/vite
```

## GitHub Pages Configuration

- Build command: `bun run build`
- Output directory: `dist`
- Base path: `/pasta/`

## Environment Variables

None required - all operations are client-side.

## Testing Strategy

- Manual testing in browsers
- Test with various PDF sizes and types
- Verify no data leaves the browser (check network tab)

## Future Enhancements

- [ ] OCR support (client-side Tesseract.js)
- [ ] Form filling
- [ ] Electronic signatures
- [ ] Batch operations
- [ ] PDF encryption/decryption
- [ ] Progress indicators for large files

## Atomic Commit Guidelines

When adding features or files:

1. Create/modify files
2. Test the changes work
3. Commit with descriptive message
4. Push to GitHub

## Deployment

Automatically deploys to GitHub Pages on every push to `main` branch via GitHub Actions workflow.
