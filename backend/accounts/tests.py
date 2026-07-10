from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="user@example.com", password="TestPass123!")

    def test_login_with_correct_credentials_returns_tokens_and_user(self):
        response = self.client.post(
            "/api/auth/login/", {"email": "user@example.com", "password": "TestPass123!"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "user@example.com")

    def test_login_with_wrong_password_returns_401(self):
        response = self.client.post(
            "/api/auth/login/", {"email": "user@example.com", "password": "wrong"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "user@example.com")
