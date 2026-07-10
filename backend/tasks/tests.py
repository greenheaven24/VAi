from datetime import date, timedelta

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from tasks.models import Task


class TaskApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="owner@example.com", password="TestPass123!")
        self.other = User.objects.create_user(email="other@example.com", password="TestPass123!")
        self.client.force_authenticate(user=self.user)
        self.today = date.today()

    def test_date_filter_only_returns_owners_tasks_for_that_date(self):
        Task.objects.create(owner=self.user, title="Mine today", due_date=self.today)
        Task.objects.create(owner=self.user, title="Mine tomorrow", due_date=self.today + timedelta(days=1))
        Task.objects.create(owner=self.other, title="Not mine", due_date=self.today)

        response = self.client.get("/api/tasks/", {"date": self.today.isoformat()})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [t["title"] for t in response.data]
        self.assertEqual(titles, ["Mine today"])

    def test_reorder_updates_status_and_order_atomically(self):
        t1 = Task.objects.create(owner=self.user, title="A", due_date=self.today, status="todo", order=0)
        t2 = Task.objects.create(owner=self.user, title="B", due_date=self.today, status="todo", order=1)

        response = self.client.post(
            "/api/tasks/reorder/",
            {
                "updates": [
                    {"id": t1.id, "status": "done", "order": 0},
                    {"id": t2.id, "status": "todo", "order": 0},
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        t1.refresh_from_db()
        t2.refresh_from_db()
        self.assertEqual(t1.status, "done")
        self.assertEqual(t2.status, "todo")
        self.assertEqual(t2.order, 0)

    def test_cannot_access_another_users_task(self):
        other_task = Task.objects.create(owner=self.other, title="Secret", due_date=self.today)
        response = self.client.get(f"/api/tasks/{other_task.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_another_users_task(self):
        other_task = Task.objects.create(owner=self.other, title="Secret", due_date=self.today)
        response = self.client.delete(f"/api/tasks/{other_task.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Task.objects.filter(id=other_task.id).exists())

    def test_create_task_defaults_owner_to_requesting_user(self):
        response = self.client.post(
            "/api/tasks/",
            {
                "title": "New task",
                "status": "todo",
                "priority": "medium",
                "due_date": self.today.isoformat(),
                "tags": ["a", "b"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["owner"], self.user.id)
