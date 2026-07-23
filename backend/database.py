import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cvd_retina.db")

# Ensure SQLite relative path resolves to the backend directory
if DATABASE_URL.startswith("sqlite:///./"):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_filename = DATABASE_URL.replace("sqlite:///./", "")
    DATABASE_URL = f"sqlite:///{os.path.join(backend_dir, db_filename).replace('\\', '/')}"
elif DATABASE_URL.startswith("sqlite:///"):
    # If it's a simple relative path like sqlite:///cvd_retina.db
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_filename = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.isabs(db_filename):
        DATABASE_URL = f"sqlite:///{os.path.join(backend_dir, db_filename).replace('\\', '/')}"

# For SQLite database, connect_args is needed to handle multi-threading properly
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
