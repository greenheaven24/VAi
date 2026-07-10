from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'due_date',
            'tags', 'order', 'owner', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')
