from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Annotation, Image
from .serializers import AnnotationSerializer, ImageSerializer


class ImageViewSet(viewsets.ModelViewSet):
    serializer_class = ImageSerializer
    parser_classes = (MultiPartParser, FormParser)
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Image.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        serializer.save(
            owner=self.request.user,
            original_filename=uploaded_file.name if uploaded_file else '',
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        qs = Annotation.objects.filter(image__owner=self.request.user)
        image_id = self.request.query_params.get('image_id')
        if image_id:
            qs = qs.filter(image_id=image_id)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
