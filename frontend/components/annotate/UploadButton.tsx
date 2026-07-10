"use client";

import { useRef } from "react";
import { useUploadImage } from "@/lib/hooks/useImages";

export function UploadButton({ onUploaded }: { onUploaded?: (imageId: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage.mutate(file, {
      onSuccess: (image) => onUploaded?.(image.id),
    });
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadImage.isPending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {uploadImage.isPending ? "Uploading…" : "+ Upload image"}
      </button>
      {uploadImage.isError && (
        <span className="ml-2 text-xs text-red-600">Upload failed, please try again.</span>
      )}
    </>
  );
}
