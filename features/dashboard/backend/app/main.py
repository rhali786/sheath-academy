from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime
from pathlib import Path
from app import crud
from app.routes import tasks, progress, quran, records

app = FastAPI(title="Sheath Academy Dashboard API", version="0.0.1")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React static files
frontend_build_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_build_path.exists():
    app.mount("/assets", StaticFiles(directory=frontend_build_path / "assets"), name="assets")

# Initialize mock data on startup (in-memory)
@app.on_event("startup")
def startup_event():
    crud.load_data()  # Populate in-memory store

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

# Serve React app
@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    frontend_build_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
    file_path = frontend_build_path / full_path

    if file_path.is_file():
        return FileResponse(file_path)

    # Fallback to index.html for client-side routing
    index_path = frontend_build_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    return {"error": "Not found"}, 404
