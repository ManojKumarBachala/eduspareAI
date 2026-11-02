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

Notes:
- Backend runs at http://localhost:8000 by default.
- Frontend runs at http://localhost:3000 by default.
- For production, set `DJANGO_DEBUG=false` and provide `DJANGO_SECRET_KEY` and appropriate `SECURE_*` env vars.
