from datetime import date

from django.core.management.base import BaseCommand

from accounts.models import User
from tasks.models import Task

DEMO_EMAIL = 'demo@demo.com'
DEMO_PASSWORD = 'DemoPass123!'


class Command(BaseCommand):
    help = 'Creates (or resets) a demo user with sample tasks for local review.'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(email=DEMO_EMAIL)
        user.set_password(DEMO_PASSWORD)
        user.is_active = True
        user.save()

        today = date.today()
        if not Task.objects.filter(owner=user, due_date=today).exists():
            sample_tasks = [
                {'title': 'Design the Kanban board', 'status': Task.Status.DONE, 'priority': Task.Priority.HIGH, 'tags': ['design'], 'order': 0},
                {'title': 'Wire up drag and drop', 'status': Task.Status.IN_PROGRESS, 'priority': Task.Priority.HIGH, 'tags': ['frontend'], 'order': 0},
                {'title': 'Build annotation canvas', 'status': Task.Status.IN_PROGRESS, 'priority': Task.Priority.MEDIUM, 'tags': ['frontend', 'canvas'], 'order': 1},
                {'title': 'Write API tests', 'status': Task.Status.TODO, 'priority': Task.Priority.MEDIUM, 'tags': ['backend'], 'order': 0},
                {'title': 'Polish README', 'status': Task.Status.TODO, 'priority': Task.Priority.LOW, 'tags': ['docs'], 'order': 1},
            ]
            for data in sample_tasks:
                Task.objects.create(owner=user, due_date=today, **data)

        self.stdout.write(self.style.SUCCESS(
            f"Demo user ready: {DEMO_EMAIL} / {DEMO_PASSWORD} ({'created' if created else 'already existed'})"
        ))
