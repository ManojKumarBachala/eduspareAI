edusphere-ai

Quick start (backend, Python 3.10+; Python 3.13 tested):

1. Create and activate a Python virtual environment.

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

3. (Optional) copy `.env.example` to `.env` and edit values.

4. Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

Frontend quick start (requires Node.js and npm):

```bash
cd frontend
npm install
npm run dev
```

## Deploy for a demo

The app has a Django API and a Next.js frontend, so GitHub stores the source but
does not run the app. A deployment can use Render for the API, Neon for
PostgreSQL, and Vercel for the frontend.

1. Create a PostgreSQL database in Neon and copy its connection string.
2. In Render, create a Blueprint from this repository's `render.yaml`. Set
   `DATABASE_URL` to the Neon connection string. After the frontend is deployed,
   set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to its exact HTTPS URL.
3. In Vercel, import this repository and set the project root directory to
   `frontend`. Set `NEXT_PUBLIC_API_BASE_URL` to
   `https://eduspare-ai-api.onrender.com/api` and `API_SERVER_URL` to
   `https://eduspare-ai-api.onrender.com`.
4. After the first backend deploy, create an admin with Render's shell:
   `python manage.py createsuperuser`. Use Django admin to create the school
   and school-admin account for the demo.

Do not commit database URLs, passwords, or secret keys. Free demo services may
sleep while idle; allow time for the backend to wake on the first request.

Notes:
- Backend runs at http://localhost:8000 by default.
- Frontend runs at http://localhost:3000 by default.
- For production, set `DJANGO_DEBUG=false` and provide `DJANGO_SECRET_KEY` and appropriate `SECURE_*` env vars.
