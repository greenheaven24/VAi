from django.conf import settings
from django.db import models


class Image(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='images', on_delete=models.CASCADE)
    file = models.ImageField(upload_to='uploads/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255, blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_filename or self.file.name


class Annotation(models.Model):
    image = models.ForeignKey(Image, related_name='annotations', on_delete=models.CASCADE)
    points = models.JSONField(default=list)
    label = models.CharField(max_length=100, blank=True, default='')
    color = models.CharField(max_length=20, default='#22c55e')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Annotation {self.id} on {self.image_id}'
