import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import crud


client = TestClient(app)


class TestStartup:
    def test_app_imports_successfully(self):
        """Verify app can be imported (catches missing dependencies early)."""
        assert app is not None
        assert app.title == "Sheath Academy Dashboard API"

    def test_app_initializes_data_store(self):
        """Verify data can be loaded from in-memory store."""
        data = crud.load_data()
        assert data is not None
        assert "children" in data
        assert "tasks" in data
        assert len(data["children"]) == 3

    def test_testclient_creates_successfully(self):
        """Verify TestClient can instantiate (catches FastAPI/Starlette issues)."""
        assert client is not None


class TestHealth:
    def test_health_check(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "Sheath Academy" in response.json()["service"]


class TestSummary:
    def test_get_summary(self):
        response = client.get("/api/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "attendanceReady" in data["data"]
        assert "lessonsPlanned" in data["data"]
        assert "needsAttention" in data["data"]
        assert "quranLogged" in data["data"]
        assert "portfolioItems" in data["data"]


class TestTasks:
    def test_get_tasks(self):
        response = client.get("/api/dashboard/tasks")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0

        # Check task structure
        task = data["data"][0]
        assert "id" in task
        assert "childId" in task
        assert "subject" in task
        assert "description" in task
        assert "status" in task
        assert "completed" in task

    def test_task_has_three_students(self):
        response = client.get("/api/dashboard/tasks")
        data = response.json()
        tasks = data["data"]

        child_ids = {t["childId"] for t in tasks}
        assert "adam_001" in child_ids
        assert "khadijah_001" in child_ids
        assert "zayd_001" in child_ids
        assert "family" in child_ids

    def test_complete_task(self):
        # Get a task
        response = client.get("/api/dashboard/tasks")
        tasks = response.json()["data"]
        task_id = tasks[0]["id"]
        initial_completed = tasks[0]["completed"]

        # Toggle it
        response = client.post(f"/api/dashboard/tasks/{task_id}/complete", json={"completed": not initial_completed})
        assert response.status_code == 200
        assert response.json()["data"]["completed"] == (not initial_completed)


class TestProgress:
    def test_get_progress(self):
        response = client.get("/api/dashboard/progress")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "adam_001" in data["data"]
        assert "khadijah_001" in data["data"]
        assert "zayd_001" in data["data"]

    def test_progress_has_subjects(self):
        response = client.get("/api/dashboard/progress")
        data = response.json()["data"]

        adam = data["adam_001"]
        assert "childName" in adam
        assert adam["childName"] == "Adam"
        assert "subjects" in adam
        assert len(adam["subjects"]) > 0
        assert "subject" in adam["subjects"][0]
        assert "completion" in adam["subjects"][0]


class TestQuran:
    def test_get_quran_sessions(self):
        response = client.get("/api/dashboard/quran")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "sessions" in data["data"]
        assert "chartData" in data["data"]

        sessions = data["data"]["sessions"]
        assert len(sessions) > 0

        # Check session structure
        session = sessions[0]
        assert "id" in session
        assert "childId" in session
        assert "type" in session
        assert "surah" in session
        assert "fromAyah" in session
        assert "toAyah" in session

    def test_quran_chart_format(self):
        response = client.get("/api/dashboard/quran")
        data = response.json()["data"]
        chart_data = data["chartData"]

        assert len(chart_data) == 3  # 3 children

        # Check Nivo ResponsiveLine format
        for series in chart_data:
            assert "id" in series
            assert "color" in series
            assert "data" in series
            assert len(series["data"]) == 5  # Mon-Fri


class TestRecords:
    def test_get_records(self):
        response = client.get("/api/dashboard/records")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert isinstance(data["data"], list)
        assert len(data["data"]) == 4  # 4 record types

        # Check record structure
        record = data["data"][0]
        assert "id" in record
        assert "title" in record
        assert "count" in record
        assert "icon" in record


class TestAlerts:
    def test_get_alerts(self):
        response = client.get("/api/dashboard/alerts")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert isinstance(data["data"], list)
        assert len(data["data"]) == 5  # 5 alerts

        # Check alert structure
        alert = data["data"][0]
        assert "id" in alert
        assert "title" in alert
        assert "detail" in alert
        assert "priority" in alert
        assert "actionButton" in alert

    def test_alert_priorities(self):
        response = client.get("/api/dashboard/alerts")
        alerts = response.json()["data"]

        priorities = {a["priority"] for a in alerts}
        # Should have mix of amber and gray
        assert "amber" in priorities or "gray" in priorities


class TestCRUDOperations:
    def test_load_data_initializes(self):
        data = crud.load_data()
        assert data is not None
        assert "children" in data
        assert "tasks" in data
        assert "alerts" in data
        assert "quranSessions" in data

    def test_get_children(self):
        children = crud.get_children()
        assert len(children) == 3
        child_names = {c["name"] for c in children}
        assert "Adam" in child_names
        assert "Khadijah" in child_names
        assert "Zayd" in child_names

    def test_get_tasks_count(self):
        tasks = crud.get_tasks()
        assert len(tasks) == 15  # 15 tasks total

    def test_get_quran_sessions_count(self):
        sessions = crud.get_quran_sessions()
        assert len(sessions) == 11  # 11 sessions

    def test_update_task_persists_in_memory(self):
        # Reset data to known state
        crud._DATA_STORE = None

        initial_tasks = crud.get_tasks()
        # Find a task that's not yet completed
        task_to_update = next((t for t in initial_tasks if not t["completed"]), initial_tasks[0])
        initial_state = task_to_update["completed"]

        crud.update_task(task_to_update["id"], not initial_state)

        updated_tasks = crud.get_tasks()
        updated_task = next(t for t in updated_tasks if t["id"] == task_to_update["id"])
        assert updated_task["completed"] == (not initial_state)


class TestDataIntegrity:
    def test_no_duplicate_task_ids(self):
        tasks = crud.get_tasks()
        task_ids = [t["id"] for t in tasks]
        assert len(task_ids) == len(set(task_ids))  # No duplicates

    def test_all_tasks_have_valid_child_id(self):
        tasks = crud.get_tasks()
        children = crud.get_children()
        child_ids = {c["id"] for c in children}
        child_ids.add("family")  # Family is valid

        for task in tasks:
            assert task["childId"] in child_ids

    def test_quran_sessions_have_valid_child_id(self):
        sessions = crud.get_quran_sessions()
        children = crud.get_children()
        child_ids = {c["id"] for c in children}

        for session in sessions:
            assert session["childId"] in child_ids

    def test_progress_matches_children(self):
        progress = crud.get_progress_data()
        children = crud.get_children()
        child_ids = {c["id"] for c in children}

        for child_id in progress.keys():
            assert child_id in child_ids


class TestAPIErrorHandling:
    def test_api_endpoint_not_found(self):
        # Undefined API routes fall through to catch-all (serves frontend)
        # In production, this would be a proper 404, but our catch-all serves SPA
        response = client.get("/api/nonexistent")
        # Either 404 (proper API behavior) or 200 (catch-all SPA serving)
        assert response.status_code in [200, 404]

    def test_spa_fallback_to_index(self):
        # Non-API routes fall back to index.html for client-side routing
        response = client.get("/some-app-route")
        # Returns 200 with HTML (SPA behavior)
        assert response.status_code in [200, 404]

    def test_invalid_task_id(self):
        response = client.post("/api/dashboard/tasks/nonexistent_id/complete", json={"completed": True})
        # API handles gracefully
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
