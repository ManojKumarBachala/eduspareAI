# Production deployment

This project is deployed as three services:

| Component | Provider | Production URL |
| --- | --- | --- |
| Next.js frontend | Vercel | [https://eduspare-ai.vercel.app](https://eduspare-ai.vercel.app) |
| Django REST API | Render | [https://eduspare-ai-api.onrender.com](https://eduspare-ai-api.onrender.com) |
| PostgreSQL | Neon | Managed database; connection URL stays private |

The deployment is connected to the `main` branch of
[`ManojKumarBachala/eduspareAI`](https://github.com/ManojKumarBachala/eduspareAI).
Do not put credentials in this document, GitHub Actions output, or source
control.

## Prerequisites

- Access to the GitHub repository and connected Vercel and Render projects.
- A PostgreSQL database with a TLS-enabled connection URL.
- The production frontend URL, used for CORS and CSRF configuration.

## Deploy the backend

1. Create or update the Render web service from [`render.yaml`](../render.yaml)
   and connect it to the repository's `main` branch.
2. Set the following Render environment variables. The Blueprint supplies the
   other standard Django and Python settings.

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The full PostgreSQL connection URL from the database provider. Enter it as a secret; verify the password is not masked placeholder text. |
   | `CORS_ALLOWED_ORIGINS` | `https://eduspare-ai.vercel.app` |
   | `CSRF_TRUSTED_ORIGINS` | `https://eduspare-ai.vercel.app` |

3. Ensure `DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY` is a generated secret, and
   `DJANGO_ALLOWED_HOSTS` includes `eduspare-ai-api.onrender.com`. These are
   configured by the current Blueprint.
4. Save the settings and deploy. The configured start command applies database
   migrations and starts Gunicorn:

   ```sh
   python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```

5. In Render's deploy logs, confirm migrations complete and the service binds
   to the port provided by `$PORT`.

## Deploy the frontend

1. Import the GitHub repository into Vercel and set the project root directory
   to `frontend`.
2. Set these Vercel environment variables for the production environment:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_BASE_URL` | `https://eduspare-ai-api.onrender.com/api` |
   | `API_SERVER_URL` | `https://eduspare-ai-api.onrender.com` |

3. Deploy the production branch. `API_SERVER_URL` configures the Next.js API
   rewrite; `NEXT_PUBLIC_API_BASE_URL` configures browser-side API requests.
4. If the Vercel domain changes, update both CORS and CSRF origin variables on
   Render to the new exact `https://` origin, then redeploy the backend.

## Provision the first administrator

Do not expect a public account or default password to exist. Create an
administrator only after the backend is deployed:

1. Open the Render service's Shell.
2. Run `python manage.py createsuperuser` and follow the prompts.
3. Open `https://eduspare-ai-api.onrender.com/admin/` and sign in with the
   superuser credentials.
4. Create the school workspace, then create or update its school administrator
   account and assign that account to the school with the `SCHOOL_ADMIN` role.
   Alternatively, use the authorized school-onboarding workflow.
5. Store credentials in a password manager; do not add them to GitHub or this
   repository's documentation.

## Verify a deployment

1. Open [the API health endpoint](https://eduspare-ai-api.onrender.com/). It
   should return HTTP 200 and a JSON message indicating EduSphere AI is
   running.
2. Open the API root at
   [https://eduspare-ai-api.onrender.com/api/](https://eduspare-ai-api.onrender.com/api/).
   It should return the API resource links.
3. Open [the frontend](https://eduspare-ai.vercel.app/) and confirm the page
   renders.
4. In the browser's developer tools, inspect the Network panel for API
   requests. An unauthenticated request to a protected endpoint may correctly
   return HTTP 401; this is not by itself a deployment failure.
5. Sign in with a provisioned school account and verify that permitted
   dashboard data loads.
6. Confirm the Render logs show no database authentication, migration,
   startup, or CORS errors.

## Updating production

1. Make and test the change locally.
2. Merge or push the verified change to the connected `main` branch.
3. Wait for the Render and Vercel deployments to complete.
4. Review provider logs and perform the verification steps above.
5. For schema changes, commit the Django migration with the model change.
   Render applies migrations on service startup; review migration safety and
   make a database backup before destructive or data-transforming migrations.

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| API returns 502 or does not start | Inspect Render deploy/runtime logs; verify the service binds to `$PORT` and startup completes. |
| PostgreSQL authentication fails | Re-copy the full Neon connection URL while revealed; do not use a masked password, check for accidental whitespace, and save it only in Render's secret environment variable editor. |
| Browser reports a CORS error | Set `CORS_ALLOWED_ORIGINS` to the exact frontend origin (scheme and hostname, no path), then redeploy the API. |
| A protected request returns 401 | Sign in and send a valid bearer access token; check token expiry and refresh it through the account API. |
| Frontend cannot reach the API | Verify both Vercel API URL variables and the Render service URL, then redeploy the frontend. |
| First request is slow after inactivity | The free Render service may be sleeping. Retry after the instance wakes; consider an always-on plan for production use. |
| Database schema is out of date | Inspect Render logs for migration errors and confirm the expected migration files are present in the deployed commit. |

## Production notes

- Treat Render, Vercel, and Neon environment variable dashboards as secret
  stores; never paste credentials into chat, commits, tickets, or logs.
- Use separate credentials for local, staging, and production environments.
- Free-tier services are intended for demos and can sleep or have limited
  resources. Review provider terms and service limits before relying on them
  for a school production workload.
- Configure and periodically test database backups and restoration before
  storing real school data.
- Keep Django, Python, Node.js, and JavaScript dependencies updated, and review
  dependency changes before deploying.
