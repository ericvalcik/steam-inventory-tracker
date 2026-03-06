# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start development server (localhost:3000)
pnpm build    # Build for production
pnpm start    # Run production server
pnpm lint     # Run ESLint
```

There are no tests configured yet.

## Architecture

This is a **Next.js 16 App Router** project bootstrapped with `create-next-app`. It uses:

- **Next.js App Router** — all routes live under `app/`. No Pages Router.
- **React 19** with TypeScript (strict mode, path alias `@/*` → root)
- **Tailwind CSS v4** via PostCSS — imported with `@import "tailwindcss"` in `globals.css`, not `@tailwind` directives
- **pnpm** as the package manager

The app is essentially a blank slate — only the default create-next-app boilerplate exists. The root layout (`app/layout.tsx`) sets up Geist fonts and dark mode CSS variables. No Steam API integration or inventory tracking logic has been built yet.
