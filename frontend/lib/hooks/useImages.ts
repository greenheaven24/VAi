import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteImage, fetchImages, uploadImage } from "@/lib/api/images";

export function useImagesQuery() {
  return useQuery({
    queryKey: ["images"],
    queryFn: fetchImages,
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}
