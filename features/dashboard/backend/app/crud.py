import json
import os
from datetime import datetime
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent.parent / "data" / "dashboard.json"

MOCK_DATA = {
    "children": [
        {"id": "adam_001", "name": "Adam", "age": 11, "grade": 5, "avatar": "A"},
        {"id": "khadijah_001", "name": "Khadijah", "age": 8, "grade": 3, "avatar": "K"},
        {"id": "zayd_001", "name": "Zayd", "age": 14, "grade": 8, "avatar": "Z"},
    ],
    "tasks": [
        # Adam's tasks
        {"id": "task_001", "childId": "adam_001", "subject": "QURAN", "description": "Al-Mulk 1–5 revision", "status": "Overdue", "completed": False},
        {"id": "task_002", "childId": "adam_001", "subject": "ARABIC", "description": "Copywork — letter forms ت ث ج", "status": "Ready", "completed": False},
        {"id": "task_003", "childId": "adam_001", "subject": "MATH", "description": "Fractions practice set 3", "status": "Ready", "completed": False},
        {"id": "task_004", "childId": "adam_001", "subject": "ISLAMIC STUDIES", "description": "Unit 3, Lesson 2 — read discussion", "status": "Ready", "completed": False},
        {"id": "task_005", "childId": "adam_001", "subject": "READING", "description": "Chapter 5 comprehension", "status": "Ready", "completed": True},

        # Khadijah's tasks
        {"id": "task_006", "childId": "khadijah_001", "subject": "QURAN", "description": "New memorization — Surah al-Alaq 1–3", "status": "Ready", "completed": True},
        {"id": "task_007", "childId": "khadijah_001", "subject": "READING", "description": "Story lesson ch. 4", "status": "Ready", "completed": True},
        {"id": "task_008", "childId": "khadijah_001", "subject": "SCIENCE", "description": "Nature notebook — observation walk", "status": "Ready", "completed": False},
        {"id": "task_009", "childId": "khadijah_001", "subject": "ARABIC", "description": "Letter recognition worksheet", "status": "Ready", "completed": False},

        # Zayd's tasks
        {"id": "task_010", "childId": "zayd_001", "subject": "QURAN", "description": "Recitation review — juz 30", "status": "Ready", "completed": False},
        {"id": "task_011", "childId": "zayd_001", "subject": "ENGLISH", "description": "Comprehension essays", "status": "Ready", "completed": False},
        {"id": "task_012", "childId": "zayd_001", "subject": "SCIENCE", "description": "Lab notebook write-up", "status": "Ready", "completed": True},
        {"id": "task_013", "childId": "zayd_001", "subject": "MATH", "description": "Algebra review — quadratic equations", "status": "Overdue", "completed": False},
        {"id": "task_014", "childId": "zayd_001", "subject": "HISTORY", "description": "Ottoman Empire research paper", "status": "Overdue", "completed": False},

        # Family task
        {"id": "task_015", "childId": "family", "subject": "ISLAMIC STUDIES", "description": "Unit 3, Lesson 2 — read, discuss, portfolio prompt", "status": "Ready", "completed": False},
    ],
    "alerts": [
        {"id": "alert_001", "childId": "zayd_001", "title": "Two overdue lessons", "detail": "Algebra and History from last week", "priority": "amber", "actionButton": "Review"},
        {"id": "alert_002", "childId": "adam_001", "title": "Quran revision missed", "detail": "Al-Mulk needs review before new memorization, 2 days overdue", "priority": "amber", "actionButton": "Review"},
        {"id": "alert_003", "childId": None, "title": "Friday attendance not logged", "detail": "Reports cannot generate without attendance data", "priority": "amber", "actionButton": "Log"},
        {"id": "alert_004", "childId": None, "title": "Portfolio thin this week", "detail": "Only 1 item captured, Islamic Studies prompt ready", "priority": "gray", "actionButton": "Add"},
        {"id": "alert_005", "childId": None, "title": "Weekly report due Friday", "detail": "80% ready, needs 2 teacher notes", "priority": "gray", "actionButton": "Complete"},
    ],
    "quranSessions": [
        {"id": "quran_001", "childId": "adam_001", "type": "Revision", "surah": "Al-Mulk", "fromAyah": 1, "toAyah": 5, "notes": "", "date": "2026-05-01", "lastLogged": "2 days ago"},
        {"id": "quran_002", "childId": "adam_001", "type": "Revision", "surah": "Al-Mulk", "fromAyah": 1, "toAyah": 5, "notes": "", "date": "2026-04-30", "lastLogged": "3 days ago"},
        {"id": "quran_003", "childId": "adam_001", "type": "Recitation", "surah": "Al-Fatihah", "fromAyah": 1, "toAyah": 7, "notes": "Tajweed check", "date": "2026-04-29", "lastLogged": "4 days ago"},

        {"id": "quran_004", "childId": "khadijah_001", "type": "New memorization", "surah": "Al-Alaq", "fromAyah": 1, "toAyah": 3, "notes": "", "date": "2026-05-03", "lastLogged": "Today"},
        {"id": "quran_005", "childId": "khadijah_001", "type": "Revision", "surah": "Al-Ikhlas", "fromAyah": 1, "toAyah": 4, "notes": "", "date": "2026-05-02", "lastLogged": "Yesterday"},
        {"id": "quran_006", "childId": "khadijah_001", "type": "Recitation", "surah": "Al-Baqarah", "fromAyah": 1, "toAyah": 10, "notes": "", "date": "2026-05-01", "lastLogged": "2 days ago"},

        {"id": "quran_007", "childId": "zayd_001", "type": "Recitation practice", "surah": "Juz 30", "fromAyah": 1, "toAyah": 50, "notes": "Full juz review", "date": "2026-05-02", "lastLogged": "Yesterday"},
        {"id": "quran_008", "childId": "zayd_001", "type": "Revision", "surah": "Al-Mulk", "fromAyah": 1, "toAyah": 30, "notes": "", "date": "2026-05-01", "lastLogged": "2 days ago"},
        {"id": "quran_009", "childId": "zayd_001", "type": "Recitation", "surah": "Juz 30", "fromAyah": 1, "toAyah": 50, "notes": "", "date": "2026-04-29", "lastLogged": "4 days ago"},
        {"id": "quran_010", "childId": "adam_001", "type": "Recitation", "surah": "Al-Ikhlas", "fromAyah": 1, "toAyah": 4, "notes": "", "date": "2026-04-28", "lastLogged": "5 days ago"},
        {"id": "quran_011", "childId": "khadijah_001", "type": "Revision", "surah": "Al-Ikhlas", "fromAyah": 1, "toAyah": 4, "notes": "", "date": "2026-04-27", "lastLogged": "6 days ago"},
    ],
    "records": [
        {"id": "record_001", "title": "Attendance", "count": 4, "maxCount": 5, "icon": "CheckCircle", "viewButton": "View"},
        {"id": "record_002", "title": "Progress updates", "count": 8, "maxCount": 15, "icon": "TrendingUp", "viewButton": "View"},
        {"id": "record_003", "title": "Portfolio evidence", "count": 4, "maxCount": 10, "icon": "Folder", "viewButton": "View"},
        {"id": "record_004", "title": "Quran sessions", "count": 11, "maxCount": 21, "icon": "BookOpen", "viewButton": "View"},
    ],
    "progressData": {
        "adam_001": [
            {"subject": "Quran", "completion": 65},
            {"subject": "Arabic", "completion": 80},
            {"subject": "Math", "completion": 70},
            {"subject": "Islamic Studies", "completion": 75},
        ],
        "khadijah_001": [
            {"subject": "Quran", "completion": 90},
            {"subject": "Arabic", "completion": 60},
            {"subject": "Reading", "completion": 85},
            {"subject": "Science", "completion": 70},
        ],
        "zayd_001": [
            {"subject": "Quran", "completion": 55},
            {"subject": "English", "completion": 75},
            {"subject": "Science", "completion": 65},
            {"subject": "History", "completion": 45},
        ],
    },
}

def ensure_data_file():
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        with open(DATA_FILE, "w") as f:
            json.dump(MOCK_DATA, f, indent=2)

def load_data():
    ensure_data_file()
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    ensure_data_file()
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_tasks():
    data = load_data()
    return data.get("tasks", [])

def update_task(task_id: str, completed: bool):
    data = load_data()
    tasks = data.get("tasks", [])
    for task in tasks:
        if task["id"] == task_id:
            task["completed"] = completed
            break
    save_data(data)

def get_children():
    data = load_data()
    return data.get("children", [])

def get_alerts():
    data = load_data()
    return data.get("alerts", [])

def get_quran_sessions():
    data = load_data()
    return data.get("quranSessions", [])

def add_quran_session(session_data: dict):
    data = load_data()
    sessions = data.get("quranSessions", [])
    new_id = f"quran_{len(sessions) + 1:03d}"
    session_data["id"] = new_id
    session_data["lastLogged"] = "Today"
    sessions.append(session_data)
    data["quranSessions"] = sessions
    save_data(data)
    return session_data

def get_records():
    data = load_data()
    return data.get("records", [])

def get_progress_data():
    data = load_data()
    return data.get("progressData", {})
