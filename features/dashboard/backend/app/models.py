from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Child(BaseModel):
    id: str
    name: str
    age: int
    grade: int
    avatar: str

class Task(BaseModel):
    id: str
    childId: str
    subject: str
    description: str
    status: str
    completed: bool

class Alert(BaseModel):
    id: str
    childId: Optional[str]
    title: str
    detail: str
    priority: str
    actionButton: str

class QuranSession(BaseModel):
    id: str
    childId: str
    type: str
    surah: str
    fromAyah: int
    toAyah: int
    notes: Optional[str]
    date: str
    lastLogged: str

class Record(BaseModel):
    id: str
    title: str
    count: int
    icon: str
    viewButton: str

class DashboardMetrics(BaseModel):
    attendanceReady: str
    lessonsPlanned: int
    needsAttention: int
    quranLogged: str
    portfolioItems: int

class DashboardSummary(BaseModel):
    status: str
    data: DashboardMetrics
    message: str
    timestamp: str

class TasksResponse(BaseModel):
    status: str
    data: List
    message: str
    timestamp: str

class TaskCompleteRequest(BaseModel):
    completed: bool

class QuranSessionRequest(BaseModel):
    childId: str
    type: str
    surah: str
    fromAyah: int
    toAyah: int
    notes: Optional[str] = None

class ProgressResponse(BaseModel):
    status: str
    data: dict
    message: str
    timestamp: str

class QuranResponse(BaseModel):
    status: str
    data: dict
    message: str
    timestamp: str

class RecordsResponse(BaseModel):
    status: str
    data: List[Record]
    message: str
    timestamp: str
