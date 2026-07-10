import { apiClient } from "@/lib/api/client";
import type { ImageAsset } from "@/types/image";

export async function fetchImages(): Promise<ImageAsset[]> {
  const { data } = await apiClient.get<ImageAsset[]>("/api/images/");
  return data;
}

export async function uploadImage(file: File): Promise<ImageAsset> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<ImageAsset>("/api/images/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteImage(id: number): Promise<void> {
  await apiClient.delete(`/api/images/${id}/`);
}
