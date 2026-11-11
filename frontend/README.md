# EduSpare AI frontend

This directory contains the Next.js web application for EduSpare AI. For
project architecture, backend setup, API overview, security guidance, and
production deployment instructions, see the [repository README](../README.md)
and [deployment runbook](../docs/DEPLOYMENT.md).

## Requirements

- Node.js compatible with the Next.js version in `package.json`.
- npm.
- The Django API running locally or a reachable API service.

## Local development

From this directory, install the locked dependencies and start the dev server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). By default, the Next.js
rewrite forwards `/api/*` requests to `http://127.0.0.1:8000`; start the Django
backend separately from the repository root.

Copy `.env.example` to `.env.local` to override the browser-side API base URL:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

For local server-side rewrites, set `API_SERVER_URL` to the backend origin when
you need to override the default. Do not put secrets in `NEXT_PUBLIC_*`
variables; they are embedded into client-side code.

## Commands

```bash
npm run dev    # Start the development server
npm run lint   # Run ESLint
npm run build  # Create a production build
npm run start  # Serve the production build
```
