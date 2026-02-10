# Pilimarket Backend

FastAPI backend for Pilimarket prediction market platform.

## Setup

1. Create virtual environment:
```bash
python/python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file (see SETUP.md for details)

4. Run database migrations (after models are created):
```bash
alembic upgrade head
```

5. **Local login (optional):** The app uses contact number + password; production uses Twilio for registration. To log in locally without Twilio, seed a dev user:
```bash
python scripts/seed_dev_user.py
```
Then log in with **contact** `+639123456789` and **password** `devpassword`.

6. Start development server:

**For macOS:**
```bash
# Option 2: Activate venv, then run
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**For Linux/Windows:**
```bash
# Activate virtual environment first
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run with auto-reload (Linux/Windows)
uvicorn app.main:app --reload

# Or without reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Note (local login):** Your local DB is separate from production. Run `python scripts/seed_dev_user.py` once to create a dev user, then use contact `+639123456789` and password `devpassword` to log in.

**Note:** The `--reload` flag may not work properly on macOS. Use the commands above without `--reload` for macOS.

## API Documentation

Once the server is running:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/v1/      # API endpoints
│   ├── models/      # SQLAlchemy models
│   ├── schemas/     # Pydantic schemas
│   ├── services/    # Business logic
│   ├── utils/       # Utilities
│   ├── tasks/       # Celery tasks
│   ├── config.py    # Configuration
│   ├── database.py  # Database setup
│   └── main.py      # FastAPI app
├── alembic/         # Database migrations
└── tests/           # Tests
```

## Development

### Code Formatting
```bash
black .
ruff check . --fix
```

### Running Tests
```bash
pytest
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Variables

See `.env.example` (create `.env` file with your values)

## Production / Reverse proxy

If the API is behind nginx (or another reverse proxy), ensure the proxy allows request bodies large enough for avatar uploads. Otherwise uploads can fail with **413 Content Too Large**, and the browser may show a CORS error (because the proxy’s 413 response often has no CORS headers).

**nginx example** (e.g. in `server` or `http` block):

```nginx
client_max_body_size 10M;
```

Then reload nginx. The backend accepts avatar images up to 10MB; the frontend compresses images before upload to reduce size.

