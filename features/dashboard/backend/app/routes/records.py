from fastapi import APIRouter
from datetime import datetime
from app import crud

router = APIRouter(prefix="/api/dashboard", tags=["records"])

@router.get("/records")
def get_records():
    records = crud.get_records()
    return {
        "status": "success",
        "data": records,
        "message": "Records retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/alerts")
def get_alerts():
    alerts = crud.get_alerts()
    return {
        "status": "success",
        "data": alerts,
        "message": "Alerts retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }
