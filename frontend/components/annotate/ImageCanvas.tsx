"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { AnnotationToolbar } from "@/components/annotate/AnnotationToolbar";
import { Spinner } from "@/components/shared/Spinner";
import {
  useAnnotationsQuery,
  useCreateAnnotation,
  useDeleteAnnotation,
} from "@/lib/hooks/useAnnotations";
import { useDeleteImage } from "@/lib/hooks/useImages";
import type { Point } from "@/types/annotation";

const PALETTE = ["#22c55e", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"];

/**
 * A single annotatable image "card": renders one image on its own Konva stage
 * with its own drawing/selection state and toolbar. Several of these stack in a
 * scrollable feed so the user can scroll through and annotate many images.
 */
export function ImageCanvas({
  imageId,
  imageUrl,
  filename,
}: {
  imageId: number;
  imageUrl: string;
  filename?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [image, status] = useImage(imageUrl);

  const { data: annotations, isLoading } = useAnnotationsQuery(imageId);
  const createAnnotation = useCreateAnnotation(imageId);
  const deleteAnnotation = useDeleteAnnotation(imageId);
  const deleteImage = useDeleteImage();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const naturalWidth = image?.naturalWidth ?? 0;
  const naturalHeight = image?.naturalHeight ?? 0;
  const renderedWidth = containerWidth;
  const renderedHeight = naturalWidth > 0 ? (containerWidth * naturalHeight) / naturalWidth : 0;

  function toNormalized(x: number, y: number): Point {
    return { x: x / renderedWidth, y: y / renderedHeight };
  }

  function toPixels(points: Point[]): number[] {
    return points.flatMap((p) => [p.x * renderedWidth, p.y * renderedHeight]);
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (isDrawing) {
      const stage = e.target.getStage();
      const pointerPos = stage?.getPointerPosition();
      if (pointerPos) {
        setDrawingPoints((prev) => [...prev, toNormalized(pointerPos.x, pointerPos.y)]);
      }
      return;
    }
    setSelectedId(null);
  }

  function handleNewPolygon() {
    setSelectedId(null);
    setDrawingPoints([]);
    setIsDrawing(true);
  }

  function handleCancel() {
    setIsDrawing(false);
    setDrawingPoints([]);
  }

  function handleFinish() {
    if (drawingPoints.length < 3) return;
    const color = PALETTE[(annotations?.length ?? 0) % PALETTE.length];
    createAnnotation.mutate(
      { image: imageId, points: drawingPoints, color },
      {
        onSuccess: () => {
          setIsDrawing(false);
          setDrawingPoints([]);
        },
      }
    );
  }

  function handleDeleteSelected() {
    if (selectedId === null) return;
    deleteAnnotation.mutate(selectedId, { onSuccess: () => setSelectedId(null) });
  }

  const annotationCount = annotations?.length ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {filename || `Image #${imageId}`}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {annotationCount} polygon{annotationCount === 1 ? "" : "s"}
          </span>
        </div>
        {confirmRemove ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Remove this image and its polygons?</span>
            <button
              type="button"
              onClick={() => deleteImage.mutate(imageId)}
              disabled={deleteImage.isPending}
              className="rounded-md bg-red-600 px-2.5 py-1 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deleteImage.isPending ? "Removing…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Remove image
          </button>
        )}
      </div>

      <div className="mb-3">
        <AnnotationToolbar
          isDrawing={isDrawing}
          pointCount={drawingPoints.length}
          hasSelection={selectedId !== null}
          onNewPolygon={handleNewPolygon}
          onFinish={handleFinish}
          onCancel={handleCancel}
          onDeleteSelected={handleDeleteSelected}
          isSaving={createAnnotation.isPending}
          isDeleting={deleteAnnotation.isPending}
        />
        {(createAnnotation.isError || deleteAnnotation.isError) && (
          <p className="mt-1 text-xs text-red-600">Something went wrong, please try again.</p>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-slate-900/5"
        style={{ height: renderedHeight > 0 ? renderedHeight : 240 }}
      >
        {(status === "loading" || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {status === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">
            Failed to load image
          </div>
        )}
        {image && renderedWidth > 0 && renderedHeight > 0 && (
          <Stage
            width={renderedWidth}
            height={renderedHeight}
            onClick={handleStageClick}
            style={{ cursor: isDrawing ? "crosshair" : "default" }}
          >
            <Layer>
              <KonvaImage image={image} width={renderedWidth} height={renderedHeight} />

              {(annotations ?? []).map((annotation) => {
                const isSelected = annotation.id === selectedId;
                return (
                  <Group
                    key={annotation.id}
                    onClick={(e) => {
                      if (isDrawing) return;
                      e.cancelBubble = true;
                      setSelectedId(annotation.id);
                    }}
                  >
                    <Line
                      points={toPixels(annotation.points)}
                      closed
                      fill={`${annotation.color}33`}
                      stroke={annotation.color}
                      strokeWidth={isSelected ? 3 : 2}
                      shadowColor={isSelected ? annotation.color : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  </Group>
                );
              })}

              {drawingPoints.length > 0 && (
                <>
                  <Line points={toPixels(drawingPoints)} stroke="#6366f1" strokeWidth={2} />
                  {drawingPoints.map((p, idx) => (
                    <Circle
                      key={idx}
                      x={p.x * renderedWidth}
                      y={p.y * renderedHeight}
                      radius={4}
                      fill="#6366f1"
                    />
                  ))}
                </>
              )}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
