from fastapi import APIRouter, HTTPException
from datetime import datetime
from app import crud
from app.models import TaskCompleteRequest

router = APIRouter(prefix="/api/dashboard", tags=["tasks"])

@router.get("/tasks")
def get_tasks():
    tasks = crud.get_tasks()
    return {
        "status": "success",
        "data": tasks,
        "message": "Tasks retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/tasks/{task_id}/complete")
def complete_task(task_id: str, request: TaskCompleteRequest):
    try:
        crud.update_task(task_id, request.completed)
        return {
            "status": "success",
            "data": {"taskId": task_id, "completed": request.completed},
            "message": "Task updated",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
