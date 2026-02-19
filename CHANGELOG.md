# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup with Astro 5.x and TypeScript
- Basic project structure and documentation
- PDF upload component with drag-and-drop support
- PDF viewer component with page rendering
- PDFService for handling PDF operations using pdf-lib and pdf.js
- PDFUploaderController, PDFViewerController, EditorController
- TypeScript interfaces for service layer (IPDFService, IPDFLoader, IPDFRenderer)
- Custom event system for component communication (`pdf-loaded` event)
- Single PDF editor page at `/app` with all 8 core operations: merge, split, reorder, rotate, delete, compress, watermark, convert
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
- SEO pages: features, about, blog, privacy, terms, changelog, FAQ
- Encrypted PDF support: owner-password PDFs load silently; user-password PDFs trigger a modal
- `PDFPasswordRequiredError` custom error class with retry and cancel support
- `src/utils/password-prompt.ts` — Swiss modernist modal utility
- AbortSignal scoping for `pdf-loaded` listener across SPA page transitions
- SEO meta tags: `description`, `og:*`, and `twitter:*` in Layout.astro
- Build-time OG image generation (1200×630 PNG) using satori + @resvg/resvg-js
- Unique `description` prop on all 9 pages
- Blog and changelog Astro 5 Content Collections (new Content Layer API with `glob` loader)
- Individual blog post pages at `/blog/[slug]/` with styled prose via `@tailwindcss/typography`
- Three blog posts: "Why we built Pasta", "The new Swiss-inspired editor", "Introducing watermark and convert features"
- Changelog v1.0 content entry

### Changed

- Centralized Google Fonts loading in Layout.astro
- Editor page overflow scoped to `body:has([data-page="editor"])`
- Editor script supports `astro:page-load` for View Transition re-initialization
- Redesigned editor page with Swiss hybrid layout: dark header, sidebar, dense grid, mobile toolbar, status bar
- Full-page centered uploader replaces inline upload component
- Swiss industrial styling for page thumbnails
- Redesigned landing page with full-viewport hero and feature grid
- Blog listing migrated from hardcoded array to content collection
- Changelog migrated from hardcoded array to content collection

### Fixed

- Race condition in drag-drop reorder: `handleDrop` now awaits `renderAllPages()` so thumbnails always settle in the correct order when pages are dragged rapidly
- Concurrent render interleaving on large PDFs: `renderAllPages()` now uses a generation counter to abort superseded render cycles, preventing old and new renders from writing to the same container simultaneously
- Encrypted PDFs failing silently instead of showing user-facing feedback
- `EncryptedPDFError` detection checking `error.message` (pdf-lib compiled class)
- `pdf-operations-service` passes `ignoreEncryption: true` for owner-password PDFs
- Duplicate `pdf-loaded` event listeners accumulating across SPA transitions
- Feature description text squeezed on mobile (grid-column fix)
- Viewport meta tag missing `initial-scale=1.0`
- YAML frontmatter colon-in-value parsing in changelog content entry
