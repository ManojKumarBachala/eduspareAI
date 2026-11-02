edusphere-ai

Quick start (backend):

1. Create a Python virtual environment and activate it.

```bash
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
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
