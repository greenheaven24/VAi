import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image as PILImage
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from annotate.models import Annotation, Image


def make_test_image(name="test.png"):
    buf = io.BytesIO()
    PILImage.new("RGB", (10, 10), color="blue").save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


TEST_MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class AnnotateApiTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="owner@example.com", password="TestPass123!")
        self.other = User.objects.create_user(email="other@example.com", password="TestPass123!")
        self.client.force_authenticate(user=self.user)

    def test_upload_image_and_list(self):
        response = self.client.post("/api/images/", {"file": make_test_image()}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["file"].startswith("http"))

        list_response = self.client.get("/api/images/")
        self.assertEqual(len(list_response.data), 1)

    def test_annotation_requires_at_least_three_points(self):
        image = Image.objects.create(owner=self.user, file=make_test_image(), original_filename="test.png")
        response = self.client.post(
            "/api/annotations/",
            {"image": image.id, "points": [{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.2}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_annotate_another_users_image(self):
        other_image = Image.objects.create(owner=self.other, file=make_test_image(), original_filename="test.png")
        response = self.client.post(
            "/api/annotations/",
            {
                "image": other_image.id,
                "points": [{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.2}, {"x": 0.3, "y": 0.3}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_image_cascades_annotations(self):
        image = Image.objects.create(owner=self.user, file=make_test_image(), original_filename="test.png")
        Annotation.objects.create(
            image=image, points=[{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.2}, {"x": 0.3, "y": 0.3}]
        )

        response = self.client.delete(f"/api/images/{image.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Annotation.objects.filter(image_id=image.id).count(), 0)

    def test_delete_annotation_removes_only_that_one(self):
        image = Image.objects.create(owner=self.user, file=make_test_image(), original_filename="test.png")
        keep = Annotation.objects.create(
            image=image, points=[{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.2}, {"x": 0.3, "y": 0.3}]
        )
        remove = Annotation.objects.create(
            image=image, points=[{"x": 0.4, "y": 0.4}, {"x": 0.5, "y": 0.5}, {"x": 0.6, "y": 0.6}]
        )

        response = self.client.delete(f"/api/annotations/{remove.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        remaining_ids = list(
            Annotation.objects.filter(image_id=image.id).values_list("id", flat=True)
        )
        self.assertEqual(remaining_ids, [keep.id])
