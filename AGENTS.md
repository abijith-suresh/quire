# Agent Instructions — Quire

## Overview

- Quire is a client-side PDF editor for merge, extract, reorder, rotate, delete, and unlock flows.
- Keep PDF processing in the browser. Do not add uploads or server-side document handling.

## Stack

- Astro 5
- SolidJS editor UI
- Tailwind CSS v4
- TypeScript
- Bun
- Vitest and Playwright

## Commands

- Install deps: `bun install`
- Dev server: `bun run dev`
- Quality gate: `bun run verify`
- E2E tests: `bun run test:e2e`
- Individual steps: `bun run type-check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`

## Project Map

- `src/components/app/`: editor UI
- `src/controllers/`: DOM orchestration and interaction wiring
- `src/services/`: PDF load, render, and manipulation logic
- `src/utils/`: download, password prompt, transitions, and helpers
- `tests/e2e/`: Playwright coverage for core editor flows

## Hard Rules

- Preserve the browser-only privacy model.
- Keep editor behavior covered by unit tests and, when relevant, Playwright E2E tests.
- Use the existing controller/service split instead of pushing business logic into page components.
- If you change core upload, edit, unlock, or download flows, review `tests/e2e/core-app.spec.ts`.

## Git And CI

- Branch from the latest `main` before starting changes.
- Never commit directly to `main`.
- Commit and PR titles must use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`.
- Before push, run `bun run verify`.
- `pre-commit` runs `lint-staged`, `commit-msg` runs `commitlint`, and `pre-push` runs `bun run verify`.
- CI enforces `quality` and `pr-title` checks on pull requests.
- Playwright E2E runs in CI and should also be run locally when changing the editor workflow.
- Squash merge is the expected merge strategy.
