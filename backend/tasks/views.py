from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.filter(owner=self.request.user)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(due_date=date)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        updates = request.data.get('updates', [])
        valid_statuses = {c[0] for c in Task.Status.choices}

        for update in updates:
            if update.get('status') not in valid_statuses:
                return Response({'detail': 'Invalid status in updates.'}, status=status.HTTP_400_BAD_REQUEST)

        updated_ids = []
        with transaction.atomic():
            for update in updates:
                rows = Task.objects.filter(id=update.get('id'), owner=request.user).update(
                    status=update.get('status'),
                    order=update.get('order', 0),
                )
                if rows:
                    updated_ids.append(update.get('id'))

        tasks = Task.objects.filter(id__in=updated_ids, owner=request.user)
        return Response(TaskSerializer(tasks, many=True).data)
