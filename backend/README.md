# Pilimarket Backend

FastAPI backend for Pilimarket prediction market platform.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
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

5. Start development server:
```bash
uvicorn app.main:app --reload
```

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

