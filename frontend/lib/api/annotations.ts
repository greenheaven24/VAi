import { apiClient } from "@/lib/api/client";
import type { Annotation, AnnotationInput } from "@/types/annotation";

export async function fetchAnnotations(imageId: number): Promise<Annotation[]> {
  const { data } = await apiClient.get<Annotation[]>("/api/annotations/", {
    params: { image_id: imageId },
  });
  return data;
}

export async function createAnnotation(input: AnnotationInput): Promise<Annotation> {
  const { data } = await apiClient.post<Annotation>("/api/annotations/", input);
  return data;
}

export async function deleteAnnotation(id: number): Promise<void> {
  await apiClient.delete(`/api/annotations/${id}/`);
}
