# VAi Backend

Django + Django REST Framework API powering the task Kanban board and the
image annotation tool. SQLite via the Django ORM, JWT auth, local media
storage for uploaded images.

## Stack

- Python 3.14.5
- Django 6.0
- Django REST Framework
- djangorestframework-simplejwt (JWT auth)
- django-cors-headers
- Pillow (image handling)
- SQLite (default Django ORM backend)

## Apps

- `accounts` — custom `User` model (email as the login field, no username), JWT login/refresh/me endpoints, and a `seed_demo_user` management command.
- `tasks` — the `Task` model and its CRUD + bulk `reorder` API used by the Kanban board.
- `annotate` — `Image` and `Annotation` models and their upload/CRUD API used by the annotation tool.

## Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows (git-bash). Use venv\Scripts\activate on cmd/PowerShell, or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_demo_user   # creates demo@demo.com / DemoPass123! with a few sample tasks
python manage.py runserver 8000
```

The API is now available at `http://localhost:8000`. Uploaded images are
served from `http://localhost:8000/media/...` while `DEBUG=True`.

Demo login: **demo@demo.com / DemoPass123!**

## Tests

```bash
python manage.py test
```

14 tests cover auth (login success/failure, `/me/`), task owner-scoping and
date filtering, the `reorder` bulk endpoint, and the annotate app (image
upload, polygon point validation, cascade delete, single-annotation delete).

## API summary

All endpoints below (except `/api/auth/login/` and `/api/auth/refresh/`)
require `Authorization: Bearer <access token>` and are scoped to the
requesting user — another user's object returns `404`, not `403`.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login/` | `{email, password}` → `{access, refresh, user}` |
| POST | `/api/auth/refresh/` | `{refresh}` → `{access}` |
| GET | `/api/auth/me/` | current user |
| GET/POST | `/api/tasks/` | `?date=YYYY-MM-DD` filters by due date |
| GET/PATCH/DELETE | `/api/tasks/{id}/` | |
| POST | `/api/tasks/reorder/` | `{updates: [{id, status, order}]}`, bulk column/position update |
| GET/POST | `/api/images/` | multipart `file` upload |
| DELETE | `/api/images/{id}/` | cascades to its annotations |
| GET/POST | `/api/annotations/` | `?image_id=` filters; points are `[{x,y}]` normalized 0–1 |
| PATCH/DELETE | `/api/annotations/{id}/` | |

## Difficulties along the way

**Python 3.14.5 is very new.** `pip install django` resolved to Django 6.0
rather than the 5.x line I originally planned around, since 6.0 is what's
compatible with 3.14. Everything installed and ran without issue, but it's
worth flagging in case a reviewer runs into a mismatch on an older Python —
Django 5.x also works fine on 3.11+ if that's what's available.

**Custom `User` model with email login.** `AbstractUser`'s default manager
assumes a `username` field, so simply setting `USERNAME_FIELD = 'email'`
wasn't enough — `createsuperuser` and `objects.create_user()` would break.
Wrote a small custom `UserManager` (`accounts/models.py`) that normalizes the
email and doesn't require a username, based on Django's own
`contrib.auth.base_user.BaseUserManager` docs.

**Validating polygon points inside a JSONField.** `Annotation.points` is a
plain `JSONField`, so nothing stops a client from posting two points, or
values outside `[0, 1]`. Added a small DRF `PointSerializer` used with
`many=True` plus a `validate_points` on `AnnotationSerializer` to enforce
"at least 3 points, each coordinate normalized" server-side, rather than
trusting the frontend to always send well-formed data.

**Absolute media URLs.** By default DRF's `ImageField` serializes to a
relative path, which the frontend would then have to prefix with the API
host itself. Passing `context={'request': request}` through
`get_serializer_context` on `ImageViewSet` makes DRF return a full
`http://localhost:8000/media/...` URL instead, so the frontend can drop it
straight into an `<img>` tag with no extra config.
