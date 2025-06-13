from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# Create async engine
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./app.db"
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# Create async session factory
async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
