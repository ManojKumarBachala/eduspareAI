# EduSpare AI

EduSpare AI is a school-management application with a Next.js web frontend and
a Django REST API. It brings common school workflows together in one
school-scoped workspace.

## Live application

| Service | Link |
| --- | --- |
| Web application | [eduspare-ai.vercel.app](https://eduspare-ai.vercel.app/) |
| API health check | [eduspare-ai-api.onrender.com](https://eduspare-ai-api.onrender.com/) |
| API root | [eduspare-ai-api.onrender.com/api/](https://eduspare-ai-api.onrender.com/api/) |

The public website is available without an account, but school data and most
management actions require an authorized account. No demo passwords or
production secrets are published in this repository. The free hosting plan may
put the API to sleep when idle; the first request after inactivity can take
longer while the service starts.

## Features

- School and user account management, with JWT-based sign-in and token refresh.
- Student and teacher directories.
- Attendance tracking and dashboard summaries.
- Timetables, exams, and results.
- Fee management.
- Library books and book issues.
- Transport routes, vehicles, assignments, and maintenance.
- A Next.js dashboard for accessing school workflows.

## Architecture

| Component | Technology | Local address |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript | `http://localhost:3000` |
| Backend API | Django 5.2, Django REST Framework | `http://127.0.0.1:8000` |
| Local database | SQLite (default) | `db.sqlite3` |
| Production database | PostgreSQL | Managed with Neon |
| Frontend hosting | Vercel | [Live site](https://eduspare-ai.vercel.app/) |
| Backend hosting | Render | [API health check](https://eduspare-ai-api.onrender.com/) |

The frontend's `/api/*` requests are forwarded by Next.js to `API_SERVER_URL`.
Browser-side API calls use `NEXT_PUBLIC_API_BASE_URL`. In production, both
variables should point to the deployed API as described in the
[deployment runbook](docs/DEPLOYMENT.md).

## Requirements

- Python 3.10 or later (Python 3.13 is supported by the project setup).
- Node.js compatible with the installed Next.js version and npm.
- Git.

## Run locally

Open two terminals from the repository root.

### 1. Set up the backend

Create and activate a virtual environment:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies and apply database migrations:

```bash
python -m pip install -r requirements.txt
python manage.py migrate
```

The backend uses SQLite by default, so a local `DATABASE_URL` is not required.
To configure optional settings, copy `.env.example` to `.env` and update it.
Do not use production credentials in a local environment or commit `.env`.

Start the API:

```bash
python manage.py runserver
```

Check that it is responding:

```text
http://127.0.0.1:8000/
```

### 2. Set up the frontend

In another terminal:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.example` to `frontend/.env.local` if you need to change
the API URL. For local development, the default API URL is
`http://127.0.0.1:8000/api`.

Start the web app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

### Backend environment

The backend reads environment variables from the process environment. A local
`.env` file is not loaded automatically; export variables in your shell or use
your preferred local environment manager.

| Variable | Purpose | Local default |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Django signing key; set a unique secret outside local development | Generated for each process if unset |
| `DJANGO_DEBUG` | Enables Django debug mode | `true` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1` |
| `DATABASE_URL` | PostgreSQL connection URL; omit to use SQLite locally | Unset |
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call the API | Local frontend origins |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated trusted HTTPS origins for CSRF checks | Unset |
| `SECURE_HSTS_SECONDS` | HSTS duration in seconds | `0` (production defaults apply when debug is off) |
| `SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS | `false` (enabled by production defaults) |
| `SESSION_COOKIE_SECURE` | Send session cookies only over HTTPS | `false` (enabled by production defaults) |
| `CSRF_COOKIE_SECURE` | Send CSRF cookies only over HTTPS | `false` (enabled by production defaults) |

For frontend configuration, see [`frontend/.env.example`](frontend/.env.example).
Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and must
never contain secrets.

## API overview

The API base path is `/api/`. Available resource groups include:

| Area | Example endpoint |
| --- | --- |
| Accounts and schools | `/api/accounts/` |
| Students | `/api/students/` |
| Teachers | `/api/teachers/` |
| Attendance | `/api/attendance/` |
| Timetable | `/api/timetable/` |
| Exams and results | `/api/exams/`, `/api/results/` |
| Fees | `/api/fees/` |
| Library | `/api/books/`, `/api/book-issues/` |
| Transport | `/api/vehicles/`, `/api/routes/`, `/api/student-assignments/`, `/api/maintenance/` |
| Dashboard | `/api/dashboard/` |

Account endpoints include `/api/accounts/login/`, `/api/accounts/refresh/`,
`/api/accounts/me/`, and `/api/accounts/schools/me/`. Login returns JWT
credentials. Send the access token as `Authorization: Bearer <access-token>`
when calling endpoints that require authentication. Permissions vary by
endpoint; use a school account with the appropriate role. The API root at
`/api/` exposes the browsable resource links. See the [API reference](docs/API.md)
for authentication examples, resource routes, and response behavior.

## Common development commands

From the repository root:

```bash
# Check Django configuration
python manage.py check

# Apply database migrations
python manage.py migrate

# Run backend tests
python manage.py test
```

From `frontend/`:

```bash
# Run ESLint
npm run lint

# Create a production build
npm run build

# Serve the production build locally
npm run start
```

## Deployment

Production uses Vercel for the frontend, Render for the Django API, and Neon
for PostgreSQL. The Render Blueprint is [`render.yaml`](render.yaml). Follow
the step-by-step [deployment runbook](docs/DEPLOYMENT.md) for initial setup,
environment variables, admin provisioning, verification, and troubleshooting.

## Security and operations

- Never commit `.env` files, API keys, passwords, private database URLs, or
  Django secret keys.
- Use HTTPS and unique, high-entropy secrets in production.
- Restrict CORS and CSRF trusted origins to the exact deployed frontend URL.
- Do not publish production credentials or real student information in issues,
  logs, screenshots, or sample data.
- Review access permissions before granting school accounts.
- Back up the production database before risky schema or data changes.
- Confirm migrations and health checks after each deployment.

## Contributing

1. Create a branch for your change.
2. Keep changes focused and avoid including local databases, build output, or
   secrets.
3. Run the relevant Django checks/tests and frontend lint/build commands.
4. Open a pull request describing the change and how it was verified.

## License

No license is currently specified. Unless a license is added, all rights remain
with the copyright holder and reuse is not granted by this repository.
