# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
