import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAnnotation, deleteAnnotation, fetchAnnotations } from "@/lib/api/annotations";
import type { AnnotationInput } from "@/types/annotation";

export function useAnnotationsQuery(imageId: number | null) {
  return useQuery({
    queryKey: ["annotations", imageId],
    queryFn: () => fetchAnnotations(imageId as number),
    enabled: imageId !== null,
  });
}

export function useCreateAnnotation(imageId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnotationInput) => createAnnotation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", imageId] });
    },
  });
}

export function useDeleteAnnotation(imageId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAnnotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", imageId] });
    },
  });
}
