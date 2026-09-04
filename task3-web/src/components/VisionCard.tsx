"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { CropBox, DetectionResult } from "@/types";
import { Sliders, Scan, CheckCircle2 } from "lucide-react";

interface VisionCardProps {
  previewUrl: string | null;
  imageDimensions: { width: number; height: number } | null;
  detection?: DetectionResult;
  isCropMode: boolean;
  cropBox: CropBox;
  setCropBox: React.Dispatch<React.SetStateAction<CropBox>>;
  setIsCropMode: (mode: boolean) => void;
  activeDragHandle: string | null;
  setActiveDragHandle: (handle: string | null) => void;
  dragStart: {
    clientX: number;
    clientY: number;
    box: CropBox;
  } | null;
  setDragStart: (
    val: {
      clientX: number;
      clientY: number;
      box: CropBox;
    } | null,
  ) => void;
}

export const VisionCard: React.FC<VisionCardProps> = ({
  previewUrl,
  imageDimensions,
  detection,
  isCropMode,
  cropBox,
  setCropBox,
  setIsCropMode,
  activeDragHandle,
  setActiveDragHandle,
  dragStart,
  setDragStart,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveDragHandle(handle);

    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
    });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeDragHandle || !dragStart || !viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) return;

      const deltaXPercent =
        ((e.clientX - dragStart.clientX) / rect.width) * 100;

      const deltaYPercent =
        ((e.clientY - dragStart.clientY) / rect.height) * 100;

      const { box } = dragStart;

      if (activeDragHandle === "move") {
        const nextX = Math.max(0, Math.min(100 - box.w, box.x + deltaXPercent));

        const nextY = Math.max(0, Math.min(100 - box.h, box.y + deltaYPercent));

        setCropBox((prev) => ({
          ...prev,
          x: nextX,
          y: nextY,
        }));
      } else if (activeDragHandle === "se") {
        const nextW = Math.max(5, Math.min(100 - box.x, box.w + deltaXPercent));

        const nextH = Math.max(5, Math.min(100 - box.y, box.h + deltaYPercent));

        setCropBox((prev) => ({
          ...prev,
          w: nextW,
          h: nextH,
        }));
      } else if (activeDragHandle === "nw") {
        const nextX = Math.max(
          0,
          Math.min(box.x + box.w - 5, box.x + deltaXPercent),
        );

        const nextY = Math.max(
          0,
          Math.min(box.y + box.h - 5, box.y + deltaYPercent),
        );

        const nextW = box.w - (nextX - box.x);
        const nextH = box.h - (nextY - box.y);

        setCropBox({
          x: nextX,
          y: nextY,
          w: nextW,
          h: nextH,
        });
      } else if (activeDragHandle === "ne") {
        const nextY = Math.max(
          0,
          Math.min(box.y + box.h - 5, box.y + deltaYPercent),
        );

        const nextW = Math.max(5, Math.min(100 - box.x, box.w + deltaXPercent));

        const nextH = box.h - (nextY - box.y);

        setCropBox({
          x: box.x,
          y: nextY,
          w: nextW,
          h: nextH,
        });
      } else if (activeDragHandle === "sw") {
        const nextX = Math.max(
          0,
          Math.min(box.x + box.w - 5, box.x + deltaXPercent),
        );

        const nextW = box.w - (nextX - box.x);

        const nextH = Math.max(5, Math.min(100 - box.y, box.h + deltaYPercent));

        setCropBox({
          x: nextX,
          y: box.y,
          w: nextW,
          h: nextH,
        });
      }
    },
    [activeDragHandle, dragStart, setCropBox],
  );

  const handlePointerUp = useCallback(() => {
    setActiveDragHandle(null);
    setDragStart(null);
  }, [setActiveDragHandle, setDragStart]);

  useEffect(() => {
    if (activeDragHandle) {
      window.addEventListener("pointermove", handlePointerMove);

      window.addEventListener("pointerup", handlePointerUp);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);

        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [activeDragHandle, handlePointerMove, handlePointerUp]);

  const fitCropToDetectedFace = () => {
    if (!detection?.bounding_box || !imageDimensions) return;

    const [fx, fy, fw, fh] = detection.bounding_box;

    const padX = fw * 0.35;
    const padY = fh * 0.35;

    const x1 = Math.max(0, fx - padX);
    const y1 = Math.max(0, fy - padY);

    const x2 = Math.min(imageDimensions.width, fx + fw + padX);

    const y2 = Math.min(imageDimensions.height, fy + fh + padY);

    setCropBox({
      x: (x1 / imageDimensions.width) * 100,
      y: (y1 / imageDimensions.height) * 100,
      w: ((x2 - x1) / imageDimensions.width) * 100,
      h: ((y2 - y1) / imageDimensions.height) * 100,
    });

    setIsCropMode(true);
  };

  const getCropPixelStats = () => {
    if (!imageDimensions) return null;

    const pxW = Math.round((cropBox.w / 100) * imageDimensions.width);

    const pxH = Math.round((cropBox.h / 100) * imageDimensions.height);

    const pxX = Math.round((cropBox.x / 100) * imageDimensions.width);

    const pxY = Math.round((cropBox.y / 100) * imageDimensions.height);

    return {
      pxW,
      pxH,
      pxX,
      pxY,
    };
  };

  const cropStats = getCropPixelStats();

  const getBoundingBoxStyle = () => {
    if (!detection?.bounding_box || !detection.image_dimensions) return null;

    const [bx, by, bw, bh] = detection.bounding_box;

    const [imgW, imgH] = detection.image_dimensions;

    if (!imgW || !imgH) return null;

    return {
      left: `${(bx / imgW) * 100}%`,
      top: `${(by / imgH) * 100}%`,
      width: `${(bw / imgW) * 100}%`,
      height: `${(bh / imgH) * 100}%`,
    };
  };

  const boundingBoxStyle = getBoundingBoxStyle();

  return (
    <div
      className={`flex h-full flex-col justify-between space-y-3 overflow-hidden rounded-sm bg-[#080c0b] p-3 transition-colors ${
        detection?.face_detected
          ? "border border-emerald-900/70"
          : "border border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-emerald-600">
            01
          </span>

          <div className="h-3 w-px bg-slate-800" />

          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-200">
            Vision ROI & Detection
          </h2>
        </div>

        {detection?.face_detected ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Face Detected
          </span>
        ) : previewUrl ? (
          <span className="font-mono text-[9px] font-medium uppercase tracking-wide text-slate-500">
            Image Loaded
          </span>
        ) : null}
      </div>

      {/* Viewport Frame */}
      <div className="flex flex-1 flex-col justify-between space-y-2.5">
        {/* Preset Toolbar */}
        {previewUrl && isCropMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-800 bg-[#050807] p-1.5 font-mono text-[9px]">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
              <Sliders className="h-3 w-3 text-emerald-500" />

              <span className="uppercase tracking-wide">Presets:</span>

              <button
                type="button"
                onClick={() =>
                  setCropBox({
                    x: 0,
                    y: 0,
                    w: 100,
                    h: 100,
                  })
                }
                className="rounded-sm border border-slate-800 bg-[#080c0b] px-1.5 py-1 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
              >
                100%
              </button>

              <button
                type="button"
                onClick={() =>
                  setCropBox({
                    x: 20,
                    y: 20,
                    w: 60,
                    h: 60,
                  })
                }
                className="rounded-sm border border-slate-800 bg-[#080c0b] px-1.5 py-1 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
              >
                60%
              </button>

              {detection?.bounding_box && (
                <button
                  type="button"
                  onClick={fitCropToDetectedFace}
                  className="rounded-sm border border-emerald-800 bg-emerald-950/30 px-1.5 py-1 font-semibold text-emerald-400 transition-colors hover:bg-emerald-950/50"
                >
                  Face ROI
                </button>
              )}
            </div>

            {cropStats && (
              <span className="font-mono font-medium text-emerald-400">
                {cropStats.pxW}×{cropStats.pxH} px
              </span>
            )}
          </div>
        )}

        {/* Viewport */}
        {previewUrl ? (
          <div
            ref={viewportRef}
            className="relative aspect-[4/3] w-full select-none touch-none overflow-hidden rounded-sm border border-slate-800 bg-[#050807]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vision Target"
              className="pointer-events-none h-full w-full object-cover"
            />

            {/* Crop Overlay */}
            {isCropMode ? (
              <>
                <div
                  className="pointer-events-none absolute left-0 right-0 top-0 bg-black/75"
                  style={{
                    height: `${cropBox.y}%`,
                  }}
                />

                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/75"
                  style={{
                    height: `${Math.max(0, 100 - (cropBox.y + cropBox.h))}%`,
                  }}
                />

                <div
                  className="pointer-events-none absolute bg-black/75"
                  style={{
                    top: `${cropBox.y}%`,
                    height: `${cropBox.h}%`,
                    left: 0,
                    width: `${cropBox.x}%`,
                  }}
                />

                <div
                  className="pointer-events-none absolute bg-black/75"
                  style={{
                    top: `${cropBox.y}%`,
                    height: `${cropBox.h}%`,
                    right: 0,
                    width: `${Math.max(0, 100 - (cropBox.x + cropBox.w))}%`,
                  }}
                />

                <div
                  onPointerDown={(e) => handlePointerDown(e, "move")}
                  className="absolute cursor-move border border-emerald-400 bg-emerald-500/10"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-b border-r border-emerald-300" />
                    <div className="border-b border-r border-emerald-300" />
                    <div className="border-b border-emerald-300" />

                    <div className="border-b border-r border-emerald-300" />
                    <div className="border-b border-r border-emerald-300" />
                    <div className="border-b border-emerald-300" />

                    <div className="border-r border-emerald-300" />
                    <div className="border-r border-emerald-300" />
                    <div />
                  </div>

                  {/* NW */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "nw")}
                    className="absolute -left-1 -top-1 h-2.5 w-2.5 cursor-nwse-resize border border-black bg-emerald-400"
                  />

                  {/* NE */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "ne")}
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 cursor-nesw-resize border border-black bg-emerald-400"
                  />

                  {/* SW */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "sw")}
                    className="absolute -bottom-1 -left-1 h-2.5 w-2.5 cursor-nesw-resize border border-black bg-emerald-400"
                  />

                  {/* SE */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "se")}
                    className="absolute -bottom-1 -right-1 h-2.5 w-2.5 cursor-nwse-resize border border-black bg-emerald-400"
                  />

                  <div className="pointer-events-none absolute left-1 top-1 border border-emerald-700 bg-[#050807]/95 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                    ROI [
                    {cropStats ? `${cropStats.pxW}×${cropStats.pxH}` : "Manual"}
                    ]
                  </div>
                </div>
              </>
            ) : (
              boundingBoxStyle && (
                <div
                  className="pointer-events-none absolute border border-emerald-400"
                  style={boundingBoxStyle}
                >
                  <div className="absolute -left-1 -top-1 h-2 w-2 border-l-2 border-t-2 border-emerald-400" />
                  <div className="absolute -right-1 -top-1 h-2 w-2 border-r-2 border-t-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-emerald-400" />
                </div>
              )
            )}

            {/* Viewport Ticker */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between rounded-sm border border-slate-800 bg-[#050807]/95 px-2 py-1 font-mono text-[9px]">
              <span className="font-medium text-emerald-400">
                {isCropMode && cropStats
                  ? `${cropStats.pxW}×${cropStats.pxH} px (ROI)`
                  : imageDimensions
                    ? `${imageDimensions.width}×${imageDimensions.height} px`
                    : "Input Ready"}
              </span>

              <span className="text-slate-500">
                {isCropMode
                  ? "Custom Crop Active"
                  : detection?.face_detected
                    ? "Face Localized"
                    : "Full Search"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-sm border border-dashed border-slate-800 bg-[#050807] p-4 text-center">
            <Scan className="mb-2 h-5 w-5 text-slate-700" />

            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-600">
              No Image Loaded
            </span>
          </div>
        )}

        {/* Data Display */}
        <div className="divide-y divide-slate-800/80 rounded-sm border border-slate-800 bg-[#050807] font-mono text-[9px]">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-600">Search Target</span>

            <span className="max-w-[190px] truncate text-emerald-400">
              {isCropMode && cropStats
                ? `ROI [${cropStats.pxX}, ${cropStats.pxY}, ${cropStats.pxW}, ${cropStats.pxH}]`
                : previewUrl
                  ? "Full Uploaded Image"
                  : "None"}
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-600">Detection Model</span>

            <span className="text-slate-300">OpenCV Haar + YuNet</span>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-600">Face Coordinates</span>

            <span className="font-mono text-slate-400">
              {detection?.bounding_box
                ? `[${detection.bounding_box.join(", ")}]`
                : previewUrl
                  ? "Full Frame"
                  : "None"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
