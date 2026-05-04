from fastapi import APIRouter
from datetime import datetime
from app import crud

router = APIRouter(prefix="/api/dashboard", tags=["progress"])

@router.get("/summary")
def get_summary():
    tasks = crud.get_tasks()
    completed = sum(1 for t in tasks if t["completed"])
    total = len(tasks)

    return {
        "status": "success",
        "data": {
            "attendanceReady": "4/5",
            "lessonsPlanned": 14,
            "needsAttention": 3,
            "quranLogged": "2/3",
            "portfolioItems": 4
        },
        "message": "Summary retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/progress")
def get_progress():
    progress_data = crud.get_progress_data()
    children = crud.get_children()

    result = {}
    for child in children:
        child_id = child["id"]
        child_progress = progress_data.get(child_id, [])
        result[child_id] = {
            "childName": child["name"],
            "subjects": child_progress,
            "quranCurrent": "Al-Mulk 1-5" if child_id == "adam_001" else ("Al-Alaq (new)" if child_id == "khadijah_001" else "Juz 30"),
            "streak": 8 if child_id == "adam_001" else (15 if child_id == "khadijah_001" else 12),
            "lastLogged": "2 days ago" if child_id == "adam_001" else ("today" if child_id == "khadijah_001" else "yesterday"),
        }

    return {
        "status": "success",
        "data": result,
        "message": "Progress data retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }
