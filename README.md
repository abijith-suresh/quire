# Quire

Quire is a fully client-side PDF editor for the five tasks people reach for most: merge, extract, reorder, rotate, and delete. Every operation runs in your browser with `pdf-lib` and `pdf.js`, so your files never leave your device.

## Product Scope

- Merge multiple PDFs into one working set
- Extract selected pages into a new PDF
- Reorder pages with drag and drop
- Rotate individual pages or selections in 90 degree steps
- Mark pages for deletion before export
- Unlock password-protected PDFs with an in-browser prompt

## Stack

- [Astro 5](https://astro.build) for the site shell and content pages
- [SolidJS](https://www.solidjs.com/) for the editor interface
- [Tailwind CSS v4](https://tailwindcss.com) for styling
- [pdf-lib](https://pdf-lib.js.org) and [pdf.js](https://mozilla.github.io/pdf.js/) for PDF processing/rendering
- [Vitest](https://vitest.dev/) for unit tests
- [Playwright](https://playwright.dev/) for browser E2E coverage
- [Bun](https://bun.sh) for package management and scripts

## Development

```sh
bun install
bun run dev
```

The app runs at `http://localhost:4321` by default.

## Quality Checks

```sh
bun run type-check
bun run lint
bun run format:check
bun run test
bun run test:e2e
bun run build
```

## Project Structure

```text
src/
  components/app/      Solid editor UI
  components/shared/   Shared site chrome
  content/changelog/   Changelog content collection
  layouts/             Shared page layout and SEO
  pages/               Marketing, legal, editor, and OG routes
  services/            PDF load/render/build services
  styles/              Global design tokens and animations
  utils/               Download, password, toast, and transition helpers
tests/
  e2e/                 Playwright coverage for the core editor flow
  fixtures/            PDF fixtures used by browser tests
```

## Release Notes

- Current canonical domain target: `https://quire.page`
- Current GitHub repository: `https://github.com/abijith-suresh/quire`
- License: [MIT](./LICENSE)

## Contributing

- Open an issue for bugs, polish work, or roadmap ideas
- Keep changes atomic and follow Conventional Commits
- Run lint, unit tests, E2E, and build checks before opening a PR
