from fastapi import APIRouter, HTTPException
from datetime import datetime
from app import crud
from app.models import QuranSessionRequest

router = APIRouter(prefix="/api/dashboard", tags=["quran"])

@router.get("/quran")
def get_quran_sessions():
    sessions = crud.get_quran_sessions()

    # Build weekly chart data
    weekly_data = [
        {"day": "Mon", "Adam": 1, "Khadijah": 1, "Zayd": 0},
        {"day": "Tue", "Adam": 1, "Khadijah": 0, "Zayd": 1},
        {"day": "Wed", "Adam": 0, "Khadijah": 1, "Zayd": 1},
        {"day": "Thu", "Adam": 1, "Khadijah": 1, "Zayd": 0},
        {"day": "Fri", "Adam": 0, "Khadijah": 0, "Zayd": 0},
    ]

    # Nivo line chart format
    nivo_data = [
        {
            "id": "Adam",
            "color": "#3b82f6",
            "data": [
                {"x": "Mon", "y": 1},
                {"x": "Tue", "y": 1},
                {"x": "Wed", "y": 0},
                {"x": "Thu", "y": 1},
                {"x": "Fri", "y": 0},
            ]
        },
        {
            "id": "Khadijah",
            "color": "#10b981",
            "data": [
                {"x": "Mon", "y": 1},
                {"x": "Tue", "y": 0},
                {"x": "Wed", "y": 1},
                {"x": "Thu", "y": 1},
                {"x": "Fri", "y": 0},
            ]
        },
        {
            "id": "Zayd",
            "color": "#f59e0b",
            "data": [
                {"x": "Mon", "y": 0},
                {"x": "Tue", "y": 1},
                {"x": "Wed", "y": 1},
                {"x": "Thu", "y": 0},
                {"x": "Fri", "y": 0},
            ]
        },
    ]

    return {
        "status": "success",
        "data": {
            "sessions": sessions,
            "chartData": nivo_data,
            "weeklyData": weekly_data,
        },
        "message": "Quran sessions retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/quran")
def add_quran_session(request: QuranSessionRequest):
    try:
        session_data = request.model_dump()
        new_session = crud.add_quran_session(session_data)
        return {
            "status": "success",
            "data": new_session,
            "message": "Quran session added",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
