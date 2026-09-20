# Contributing to Faculty-Finder

Thanks for helping out! Bug reports, ideas and pull requests are all welcome.

## Setup

```bash
git clone <your-fork-url>
cd faculty-finder
npm install
npm run dev
```

## Before you open a pull request

1. `npm run typecheck` and `npm test` pass.
2. `npm run build` succeeds.
3. You checked your change on a **phone-sized screen** (Chrome DevTools → device toolbar) and with the **keyboard only**.
4. UI changes work in both light and dark themes.

## Guidelines

- Keep the data layer (`src/lib`, `src/data`) free of React. Keep CSV parsing out of components.
- Only show fields that exist. Never invent faculty information.
- Keep dependencies minimal. This app should stay small and fast.
- New behaviour in `src/lib` should come with a test in `src/lib/lib.test.ts`.
- Use plain, friendly copy (sentence case, say what happens).

## Reporting data problems

If a CSV loads incorrectly, open an issue with the **header row** (no personal data needed) and what you expected to see. Most fixes are one line in `src/lib/columns.ts`.
