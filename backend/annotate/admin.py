from django.contrib import admin

from .models import Annotation, Image


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_filename', 'owner', 'uploaded_at')


@admin.register(Annotation)
class AnnotationAdmin(admin.ModelAdmin):
    list_display = ('id', 'image', 'label', 'created_at')
