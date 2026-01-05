# Pilimarket Setup Instructions

## Prerequisites

- **PostgreSQL** (already set up: `dev_Pilimarket`, user: `andersonbond`)
- **Redis** (for caching and background jobs)
- **Python 3.11+**
- **Node.js 18+**
- **npm** or **yarn**

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (copy from `.env.example`):
```bash
# Note: .env.example is in gitignore, create manually with these variables:
# Application
APP_NAME=Pilimarket API
DEBUG=True

# Database
DATABASE_URL=postgresql://andersonbond@localhost/dev_Pilimarket

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT (generate a secure key: openssl rand -hex 32)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:8100,http://localhost:3000

# Stripe (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

5. Initialize Alembic (database migrations):
```bash
# This will be done in Phase 1 when we create the first migration
# For now, the structure is ready
```

6. Start development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/api/docs`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

4. Start development server:
```bash
npm start
```

The app will be available at `http://localhost:8100`

## Redis Setup

### Option 1: Local Installation
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Or run manually
redis-server
```

### Option 2: Docker (if preferred)
```bash
docker run -d -p 6379:6379 redis:alpine
```

## Celery Worker Setup

1. From backend directory:
```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

## Running Tests

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Development Tools

### Code Formatting

**Backend:**
```bash
cd backend
black .
ruff check . --fix
```

**Frontend:**
```bash
cd frontend
npm run format
npm run lint:fix
```

### Pre-commit Hooks

Install pre-commit:
```bash
pip install pre-commit
pre-commit install
```

## Database Migrations

Once models are created (Phase 1), run migrations:

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

## Project Structure

```
Pilimarket/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/     # API routes
│   │   ├── models/  # SQLAlchemy models
│   │   ├── schemas/ # Pydantic schemas
│   │   ├── services/# Business logic
│   │   └── utils/   # Utilities
│   ├── alembic/     # Database migrations
│   └── tests/       # Tests
├── frontend/        # Ionic 8 + React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
│   └── public/
└── docs/            # Documentation
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database name and user in `.env`
- Verify connection: `psql -U andersonbond -d dev_Pilimarket`

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host/port in `.env`

### Port Already in Use
- Backend: Change port in `uvicorn` command: `--port 8001`
- Frontend: Change port in `vite.config.ts` or `ionic.config.json`

## Next Steps

After setup, proceed to **Phase 1: Authentication & User Management**

