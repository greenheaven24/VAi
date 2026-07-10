"use client";

import dynamic from "next/dynamic";
import { UploadButton } from "@/components/annotate/UploadButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { useImagesQuery } from "@/lib/hooks/useImages";

const ImageCanvas = dynamic(
  () => import("@/components/annotate/ImageCanvas").then((mod) => mod.ImageCanvas),
  { ssr: false }
);

export default function AnnotatePage() {
  const { data: images, isLoading } = useImagesQuery();
  const hasImages = !!images && images.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Image Annotation</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Scroll through your images and draw polygons on any of them.
          </p>
        </div>
        <UploadButton />
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner />
        </div>
      ) : hasImages ? (
        <div className="flex flex-col gap-6">
          {images.map((image) => (
            <ImageCanvas
              key={image.id}
              imageId={image.id}
              imageUrl={image.file}
              filename={image.original_filename}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No images yet"
          description="Upload an image to start drawing polygon annotations"
        />
      )}
    </div>
  );
}
