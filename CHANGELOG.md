# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Swiss modernist landing page with Bebas Neue + Work Sans typography
- Tailwind CSS v4 integration via `@tailwindcss/vite` plugin
- Global CSS entry point (`src/styles/global.css`)
- Head slot in Layout for per-page font injection

### Changed

- Redesigned editor page with V6 hybrid Swiss layout: dark header, sidebar with grouped actions, dense responsive grid, mobile toolbar, and status bar
- Full-page centered uploader replaces inline upload component
- Swiss industrial styling for page thumbnails (no rounded corners, no shadows, red accent)
- Mobile toolbar delegates clicks to sidebar buttons (no duplicate IDs)
- Redesigned landing page with full-viewport hero, feature list with grid layout, and CTA section
- Simplified Layout component to minimal shell without opinionated styles

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
