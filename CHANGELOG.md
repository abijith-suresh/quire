# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Encrypted PDF support: owner-password PDFs (permission-restricted) load silently without a prompt
- Password modal for user-password PDFs with retry on wrong password and cancel support
- `PDFPasswordRequiredError` custom error class with `file` reference and `reason` (`needs-password` / `wrong-password`)
- `loadPDFWithPassword(file, password)` method on `PDFService` for post-prompt retry
- `getPassword(file)` registry on `PDFService` so thumbnail re-renders reuse the stored password
- `src/utils/password-prompt.ts` — Swiss modernist modal utility (Enter/Escape/backdrop-click support)
- AbortSignal passed into `EditorController` to scope `pdf-loaded` listener to the current page lifecycle

### Fixed

- Encrypted PDFs silently failing with a raw `EncryptedPDFError` stack trace instead of user-facing feedback
- `EncryptedPDFError` detection now checks `error.message` (pdf-lib's compiled class never sets `error.name`)
- `pdf-operations-service` now passes `ignoreEncryption: true` so owner-password PDFs can be copied into output documents
- Duplicate `pdf-loaded` event listeners accumulating across SPA page transitions

- Astro View Transitions for SPA-like page navigation (no full page reloads)
- Scroll-triggered entrance animations with IntersectionObserver
- Staggered list reveal animations on features, FAQ, changelog, blog, and legal pages
- Hero entrance animations on landing page (sequential slideUp/fadeIn)
- CSS animation keyframes: contentFadeOut, contentFadeIn, fadeIn, slideUp, slideInLeft, scaleIn
- Micro-interactions: press-feedback on CTA buttons, link-slide underline on nav/footer links
- Nav persistence across page transitions via transition:persist
- prefers-reduced-motion support to disable all custom animations
- Google Fonts preconnect hints for faster font loading
- Swiss modernist landing page with Bebas Neue + Work Sans typography
- Tailwind CSS v4 integration via `@tailwindcss/vite` plugin
- Global CSS entry point (`src/styles/global.css`)
- Head slot in Layout for per-page font injection
- Tailwind `@theme` block with shared design tokens (fonts, colors)
- Shared Nav component with responsive links and active state support
- Shared Footer component with Product/Company/Legal link groups
- SEO pages: features, about, blog, privacy, terms, changelog, FAQ

### Changed

- Centralized Google Fonts loading in Layout.astro (removed from all pages)
- Editor page overflow:hidden scoped to body:has([data-page="editor"]) to prevent leak
- Editor script supports astro:page-load for View Transition re-initialization
- Redesigned editor page with V6 hybrid Swiss layout: dark header, sidebar with grouped actions, dense responsive grid, mobile toolbar, and status bar
- Full-page centered uploader replaces inline upload component
- Swiss industrial styling for page thumbnails (no rounded corners, no shadows, red accent)
- Mobile toolbar delegates clicks to sidebar buttons (no duplicate IDs)
- Redesigned landing page with full-viewport hero, feature list with grid layout, and CTA section
- Simplified Layout component to minimal shell without opinionated styles
- Landing page now uses shared Nav and Footer components

### Fixed

- Feature description text squeezed into narrow column on mobile (grid-column fix)
- Viewport meta tag missing initial-scale=1.0

## [0.3.0] - 2026-02-17

### Added

- Single PDF editor page at `/app` with all 5 core operations
- Rotate: per-page or batch rotate selected pages 90° clockwise
- Delete: toggle mark-for-deletion with visual overlay, applied on download
- Reorder: HTML5 drag-and-drop to rearrange page order
- Merge: "Add PDF" button to load and append additional files
- Split/Extract: select pages and extract as a separate PDF download
- PDFOperationsService for building PDFs using pdf-lib
- EditorController for managing editor UI state and interactions
- Download utility for triggering file downloads
- Layout component with shared head metadata and styling

### Changed

- Migrated folder structure to clean architecture layout (types/, services/, controllers/, utils/)
- Moved PDF components into `components/app/` subdirectory
- Updated landing page with feature cards and "Get Started" link

## [0.2.0] - 2026-02-16

### Added

- PDF upload component with drag-and-drop support
- PDF viewer component with page rendering (limited to 5 pages)
- PDFService for handling PDF operations using pdf-lib and pdf.js
- PDFUploaderController for managing uploader UI interactions
- PDFViewerController for managing viewer rendering logic
- TypeScript interfaces for service layer (IPDFService, IPDFLoader, IPDFRenderer)
- Custom event system for component communication (pdf-loaded event)
- Client-side PDF loading and page rendering capabilities

### Changed

- Refactored Astro components to use controller pattern following clean architecture principles
- Separated business logic from UI components into dedicated controller classes
- Implemented dependency injection for services in controllers

### Fixed

- ES module import errors in inline scripts by properly bundling as modules
- PDF.js worker configuration to use bundled worker instead of CDN

## [0.1.0] - 2025-02-16

### Added

- Initial project setup with Astro 5.x and TypeScript
- Basic project structure and documentation
