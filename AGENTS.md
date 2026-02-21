# Pasta - Client-Side PDF Manipulation Tool

## Overview

Pasta is a fully client-side PDF manipulation tool built with Astro. All operations happen entirely in the browser using pdf-lib. No files are sent to any server.

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
│       └── deploy.yml                  # GitHub Pages deployment
├── public/                              # Static assets
├── src/
│   ├── components/
│   │   ├── app/
│   │   │   ├── PDFUploader.astro       # File upload with drag-drop
│   │   │   └── PDFViewer.astro         # Page thumbnails/preview
│   │   └── shared/
│   │       ├── Nav.astro               # Shared navigation bar
│   │       └── Footer.astro            # Shared footer with link groups
│   ├── content/
│   │   ├── config.ts                   # Astro 5 Content Collections config (glob loader)
│   │   ├── blog/
│   │   │   ├── the-new-swiss-editor.md
│   │   │   └── why-we-built-pasta.md
│   │   └── changelog/
│   │       └── v1-0.md
│   ├── controllers/
│   │   ├── editor-controller.ts        # Editor page UI logic
│   │   ├── pdf-uploader-controller.ts  # Uploader UI logic
│   │   └── pdf-viewer-controller.ts    # Viewer UI logic
│   ├── layouts/
│   │   └── Layout.astro                # Base layout with ViewTransitions + SEO meta
│   ├── pages/
│   │   ├── index.astro                 # Landing page (Swiss modernist)
│   │   ├── app.astro                   # PDF editor page
│   │   ├── features.astro              # Features overview page
│   │   ├── about.astro                 # About / mission page
│   │   ├── blog/
│   │   │   ├── index.astro             # Blog listing page (content collection)
│   │   │   └── [slug].astro            # Individual blog post page
│   │   ├── og/
│   │   │   └── [page].png.ts           # Build-time OG image endpoint (satori + resvg)
│   │   ├── privacy.astro               # Privacy policy page
│   │   ├── terms.astro                 # Terms of service page
│   │   ├── changelog.astro             # Changelog page (content collection)
│   │   └── faq.astro                   # FAQ page
│   ├── scripts/
│   │   └── scroll-animations.ts        # IntersectionObserver for scroll animations
│   ├── services/
│   │   ├── pdf-operations-service.ts   # PDF build/extract operations
│   │   └── pdf-service.ts              # PDF load/render service
│   ├── styles/
│   │   └── global.css                  # Tailwind CSS v4 + typography plugin + animations
│   ├── types/
│   │   └── interfaces.ts               # TypeScript interfaces/contracts
│   └── utils/
│       ├── download.ts                 # File download utility
│       ├── password-prompt.ts          # Modal for unlocking encrypted PDFs
│       └── transitions.ts              # View Transition animation config
├── astro.config.ts
├── commitlint.config.ts
├── eslint.config.ts
├── package.json
└── README.md
```

## Installation & Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# TypeScript type checking
bun run type-check

# Lint code
bun run lint

# Lint and auto-fix
bun run lint:fix

# Format all files
bun run format

# Check formatting
bun run format:check

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui
```

## Available Operations

1. **Merge**: Combine multiple PDFs into one
2. **Split**: Extract pages or split into separate files
3. **Reorder**: Drag and drop to reorder pages
4. **Rotate**: Rotate pages 90°/180°/270°
5. **Delete**: Remove specific pages

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
- Controllers: PascalCase with Controller suffix (`PDFUploaderController.ts`)
- Interfaces: PascalCase with I prefix (`IPDFService.ts`)

## Clean Architecture

The project follows clean architecture principles with clear separation of concerns:

### Layers

1. **Components** (`src/components/`): UI layer
   - Pure Astro components handling HTML structure and styling
   - Import and initialize controllers in `<script>` tags
   - No business logic in components

2. **Controllers** (`src/controllers/*-controller.ts`): Presentation layer
   - Handle user interactions and DOM manipulation
   - Depend on service interfaces (DIP)
   - Manage component lifecycle

3. **Services** (`src/services/pdf-service.ts`): Business logic layer
   - Handle PDF operations (load, render, manipulate)
   - Implement service interfaces
   - Use dependency injection pattern

4. **Interfaces** (`src/types/interfaces.ts`): Contracts layer
   - Define clear contracts between layers
   - Enable testability and loose coupling
   - Follow Interface Segregation Principle

### Key Principles

- **Single Responsibility**: Each class has one reason to change
- **Dependency Inversion**: Controllers depend on abstractions (interfaces)
- **Separation of Concerns**: UI, logic, and data layers are separate
- **Event-Driven**: Components communicate via custom events (e.g., `pdf-loaded`)
- Pages: lowercase with dashes (`merge.astro`)
- Assets: lowercase with dashes

## GitHub Pages Configuration

- Build command: `bun run build`
- Output directory: `dist`
- Base path: `/pasta/`

## Environment Variables

None required - all operations are client-side.

## Testing Strategy

- Unit tests via Vitest (`bun run test`) — covers services and utilities
- E2E tests via Playwright (`bun run test:e2e`) — covers core user flows
- Manual testing in browsers for visual/interaction verification
- Verify no data leaves the browser (network tab should show zero PDF-related requests)

## Roadmap

### v1.1 — Polish

- Keyboard shortcuts (`Ctrl+A`, `Delete`, `R`, `Ctrl+S`) for editor operations
- Toast notifications for operation success/error feedback
- Loading states and progress indicators during PDF load/build
- Extract magic numbers and hardcoded strings to `src/constants.ts`
- Move inline styles in `password-prompt.ts` to Tailwind utility classes

### v1.2 — New Operations

- **Compress**: Reduce file size via pdf-lib save options (`useObjectStreams: true`)
- **Watermark**: Diagonal text watermark on all pages using `page.drawText()`
- **Images → PDF**: Embed JPEG/PNG files as pages using `embedJpg()`/`embedPng()`

### v1.3 — Power User

- **Password protect output**: Encrypt the saved PDF with a user password
- **Page numbering**: Add configurable page numbers via `page.drawText()`
- **Insert blank pages**: Add spacer pages at any position
- **Metadata editing**: Edit PDF title, author, subject, and keywords

### v1.4 — Advanced Editing

- **Redaction**: Draw permanent opaque boxes over sensitive content
- **Crop pages**: Adjust the crop/media box to trim margins or scanner borders
- **Normalize page sizes**: Scale all pages to a uniform size (A4/Letter) when merging

### v2.0 — Workflow

- **Form filling**: Fill AcroForm fields client-side using pdf-lib
- **Simple e-signatures**: Draw or type a signature and embed it on a page
- **PWA / offline support**: Service worker + manifest so Pasta works fully offline

### Not planned

- OCR (Tesseract.js) — out of scope; this is a manipulation tool, not a document-understanding tool
- Cryptographic digital signatures — require a certificate authority; not feasible client-side
- PDF-to-images export via canvas re-render — lossy, produces inaccessible image-only PDFs
- Batch processing mode — adds UI complexity for a narrow use case

## Atomic Commit Guidelines

**Every change — no matter how small — must follow this sequence. Never commit directly to `main`.**

1. Pull the latest `main`: `git checkout main && git pull origin main`
2. Cut a new branch: `git checkout -b type/short-description`
3. Make one logical change per commit (atomic)
4. Test the change works before committing
5. Commit with a descriptive Conventional Commits message
6. Push the branch: `git push -u origin type/short-description`
7. Open a PR via `gh pr create`

## Deployment

Automatically deploys to GitHub Pages on every push to `main` branch via GitHub Actions workflow.

## DevContainer

The repository includes a DevContainer configuration for a consistent, fully containerized development environment.

**Includes:** Node.js 24, Bun, GitHub CLI, and VSCode extensions (Astro, ESLint, Prettier, Tailwind CSS, EditorConfig, Vitest, Path IntelliSense).

**Setup (requires Docker Desktop or Podman):**

1. Install the VSCode **Dev Containers** extension (`ms-vscode-remote.remote-containers`)
2. Open the repository in VSCode
3. Press `F1` → **"Dev Containers: Reopen in Container"**

The container automatically runs `bun install` on creation and forwards port 4321 for the Astro dev server.

## Git Workflow

### Branch Naming

- Format: `type/description` (kebab-case)
- Examples: `feat/add-og-images`, `fix/broken-nav`, `chore/update-deps`
- Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

### Commit Message Format

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

- **type**: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`
- **scope**: optional, e.g., `feat(nav): add mobile menu`
- **subject**: present tense, ≤50 chars, no period at end

| Type       | When to use                     |
| ---------- | ------------------------------- |
| `feat`     | New feature                     |
| `fix`      | Bug fix                         |
| `docs`     | Documentation only              |
| `refactor` | Code change without feature/fix |
| `chore`    | Build, deps, config             |
| `test`     | Tests only                      |

### PR Workflow

1. Pull latest main: `git checkout main && git pull origin main`
2. Cut branch: `git checkout -b type/description`
3. Make atomic commits (one logical change per commit)
4. Push branch: `git push -u origin type/description`
5. Open PR: `gh pr create --title "type: description" --body "..."`
6. Wait for CI to pass
7. **Merge using squash merge** (keeps main history linear)
8. Delete branch after merge
9. Update `CHANGELOG.md` with a summary of changes

### Key Rules

- Never commit directly to `main`
- Pre-commit hook runs lint-staged automatically
- `commit-msg` hook validates commit format via commitlint
- Keep commits atomic — one logical change, one commit
