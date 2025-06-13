from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import planner, project, stats, item
from .database import engine, Base

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(planner.router)
app.include_router(project.router)
app.include_router(stats.router)
app.include_router(item.router)

# Create database tables
@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to Days Pace API"}

