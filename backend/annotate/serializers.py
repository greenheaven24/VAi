from rest_framework import serializers

from .models import Annotation, Image


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ('id', 'file', 'original_filename', 'uploaded_at')
        read_only_fields = ('id', 'original_filename', 'uploaded_at')


class PointSerializer(serializers.Serializer):
    x = serializers.FloatField(min_value=0, max_value=1)
    y = serializers.FloatField(min_value=0, max_value=1)


class AnnotationSerializer(serializers.ModelSerializer):
    points = PointSerializer(many=True)

    class Meta:
        model = Annotation
        fields = ('id', 'image', 'points', 'label', 'color', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_image(self, image):
        request = self.context.get('request')
        if request and image.owner_id != request.user.id:
            raise serializers.ValidationError('Image not found.')
        return image

    def validate_points(self, points):
        if len(points) < 3:
            raise serializers.ValidationError('A polygon needs at least 3 points.')
        return points
