"use client";

export function AnnotationToolbar({
  isDrawing,
  pointCount,
  hasSelection,
  onNewPolygon,
  onFinish,
  onCancel,
  onDeleteSelected,
  isSaving,
  isDeleting,
}: {
  isDrawing: boolean;
  pointCount: number;
  hasSelection: boolean;
  onNewPolygon: () => void;
  onFinish: () => void;
  onCancel: () => void;
  onDeleteSelected: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      {isDrawing ? (
        <>
          <span className="text-xs font-medium text-slate-500">
            Click on the image to add points ({pointCount} placed)
          </span>
          <button
            type="button"
            onClick={onFinish}
            disabled={pointCount < 3 || isSaving}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Finish polygon"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onNewPolygon}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
          >
            + New polygon
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!hasSelection || isDeleting}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          >
            {isDeleting ? "Deleting…" : "Delete selected"}
          </button>
          {hasSelection && (
            <span className="text-xs text-slate-400">Click empty space to deselect</span>
          )}
        </>
      )}
    </div>
  );
}
