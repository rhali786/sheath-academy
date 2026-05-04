from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app import crud
from app.routes import tasks, progress, quran, records

app = FastAPI(title="Sheath Academy Dashboard API", version="0.0.1")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize mock data on startup
@app.on_event("startup")
def startup_event():
    crud.ensure_data_file()

# Include routers
app.include_router(tasks.router)
app.include_router(progress.router)
app.include_router(quran.router)
app.include_router(records.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Sheath Academy Dashboard",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def root():
    return {
        "message": "Sheath Academy Dashboard API",
        "version": "0.0.1",
        "docs": "/docs"
    }
