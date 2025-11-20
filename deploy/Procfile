# Heroku Procfile for AutoGitGrow
web: cd backend && python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)" && uvicorn main:app --host 0.0.0.0 --port $PORT
scheduler: python scripts/autotrack.py
release: cd backend && python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('Database initialized')"