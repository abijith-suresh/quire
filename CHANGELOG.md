# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-28

### Added

- Quire brand favicon (dark wordmark, white "Q", red accent bar) replacing the default Astro icon
- `apple-touch-icon.png` (180×180) for iOS home screen bookmarks
- `scripts/gen-favicon.ts` one-off script to regenerate favicon assets via `@resvg/resvg-js`
- Dependency security audit step (`bun audit`) in CI pipeline, closes #38
- Initial project setup with Astro 5.x and TypeScript
- Basic project structure and documentation
- PDF upload component with drag-and-drop support
- PDF viewer component with page rendering
- PDFService for handling PDF operations using pdf-lib and pdf.js
- PDFUploaderController, PDFViewerController, EditorController
- TypeScript interfaces for service layer (IPDFService, IPDFLoader, IPDFRenderer)
- Custom event system for component communication (`pdf-loaded` event)
- Single PDF editor page at `/app` with 5 core operations: merge, split, reorder, rotate, delete
- PDFOperationsService for building PDFs using pdf-lib
- Download utility for triggering file downloads
- Astro View Transitions for SPA-like page navigation
- Scroll-triggered entrance animations with IntersectionObserver
- Staggered list reveal animations on all content pages
- CSS animation keyframes: contentFadeOut, contentFadeIn, fadeIn, slideUp, slideInLeft, scaleIn
- Micro-interactions: press-feedback on CTA buttons, link-slide underline on nav/footer links
- Nav persistence across page transitions via `transition:persist`
- `prefers-reduced-motion` support to disable all custom animations
- Swiss modernist landing page with Bebas Neue + Work Sans typography
- Tailwind CSS v4 integration via `@tailwindcss/vite` plugin
- Global CSS entry point (`src/styles/global.css`) with shared design tokens
- Shared Nav component with responsive links and active state support
- Shared Footer component with Product/Company/Legal link groups
- SEO pages: features, about, privacy, terms, changelog, FAQ
- Encrypted PDF support: owner-password PDFs load silently; user-password PDFs trigger a modal
- `PDFPasswordRequiredError` custom error class with retry and cancel support
- `src/utils/password-prompt.ts` — Swiss modernist modal utility
- AbortSignal scoping for `pdf-loaded` listener across SPA page transitions
- SEO meta tags: `description`, `og:*`, and `twitter:*` in Layout.astro
- Build-time OG image generation (1200×630 PNG) using satori + @resvg/resvg-js
- Unique `description` prop on all pages
- Changelog Astro 5 Content Collection (new Content Layer API with `glob` loader)
- Changelog v1.0 content entry
- App-wide toast notifications for upload, extract, and export feedback
- Browser E2E coverage for upload, editing, download, and encrypted PDF flows

### Changed

- Renamed the app from Pasta to Quire across the editor, site copy, SEO metadata, and output filenames
- Lazy-load page thumbnails with `IntersectionObserver`: placeholders are created synchronously on PDF load and canvases are painted only as each thumbnail scrolls into view, eliminating the browser freeze on large documents (closes #29)
- Drag-drop reorder now moves existing DOM nodes instead of re-rendering all page thumbnails, eliminating O(n) canvas redraws on every page move (closes #31)
- Drag-drop now shows a directional red insertion bar (left or right of target) so users can see exactly where the dropped page will land before releasing
- Centralized Google Fonts loading in Layout.astro
- Editor page overflow scoped to `body:has([data-page="editor"])`
- Editor script supports `astro:page-load` for View Transition re-initialization
- Redesigned editor page with Swiss hybrid layout: dark header, sidebar, dense grid, mobile toolbar, status bar
- Full-page centered uploader replaces inline upload component
- Swiss industrial styling for page thumbnails
- Redesigned landing page with full-viewport hero and feature grid
- Changelog migrated from hardcoded array to content collection
- Added loading and progress messaging for upload, add-PDF, extract, and build operations
- Rewrote README to reflect the shipped Quire v1 scope and release workflow

### Fixed

- Meta description on the home page no longer mentions removed "compress" operation
- OG image feature list for the Features page no longer mentions compress, watermark, or convert
- Fix memory leaks when repeatedly loading and replacing PDFs: `clearPasswordRegistry()` and `clearCache()` called on session reset clear the singleton service state accumulated from previous sessions; canvas GPU memory released via `canvas.width = 0` before clearing the page grid (closes #30)
- Fix WCAG 2.1 accessibility violations in password modal: add `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap (Tab/Shift+Tab), focus restoration on close, and `aria-live` on error message (closes #26)
- Add ARIA roles and keyboard navigation to editor thumbnails and toolbar: `role="listbox"` + `aria-multiselectable` on page grid, `role="option"` + `aria-selected` + `aria-label` on each thumbnail (synced on select/deselect/delete/reorder), descriptive `aria-label` on all four toolbar action buttons, `role="status"` + `aria-live` on status bar (closes #27)
- Make upload drop zone keyboard accessible: `role="button"`, `tabindex="0"`, Enter/Space keyboard activation, and persistent status text for the uploader (closes #28)
- Removed compress, watermark, convert, and undo from features page, FAQ, and changelog — these operations are not yet implemented (closes #17)
- Rewrote README to replace Astro starter kit template with Quire-specific content (closes #18)
- Race condition in drag-drop reorder: `handleDrop` now awaits `renderAllPages()` so thumbnails always settle in the correct order when pages are dragged rapidly
- Concurrent render interleaving on large PDFs: `renderAllPages()` now uses a generation counter to abort superseded render cycles, preventing old and new renders from writing to the same container simultaneously
- Encrypted PDFs failing silently instead of showing user-facing feedback
- `EncryptedPDFError` detection checking `error.message` (pdf-lib compiled class)
- `pdf-operations-service` passes `ignoreEncryption: true` for owner-password PDFs
- Duplicate `pdf-loaded` event listeners accumulating across SPA transitions
- Feature description text squeezed on mobile (grid-column fix)
- Viewport meta tag missing `initial-scale=1.0`
- YAML frontmatter colon-in-value parsing in changelog content entry
- Removed silent export failures by surfacing success/error toasts and status updates during long-running operations
