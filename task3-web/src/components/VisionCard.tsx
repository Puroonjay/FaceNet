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
  dragStart: { clientX: number; clientY: number; box: CropBox } | null;
  setDragStart: (val: { clientX: number; clientY: number; box: CropBox } | null) => void;
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

      const deltaXPercent = ((e.clientX - dragStart.clientX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStart.clientY) / rect.height) * 100;

      const { box } = dragStart;

      if (activeDragHandle === "move") {
        const nextX = Math.max(0, Math.min(100 - box.w, box.x + deltaXPercent));
        const nextY = Math.max(0, Math.min(100 - box.h, box.y + deltaYPercent));
        setCropBox((prev) => ({ ...prev, x: nextX, y: nextY }));
      } else if (activeDragHandle === "se") {
        const nextW = Math.max(5, Math.min(100 - box.x, box.w + deltaXPercent));
        const nextH = Math.max(5, Math.min(100 - box.y, box.h + deltaYPercent));
        setCropBox((prev) => ({ ...prev, w: nextW, h: nextH }));
      } else if (activeDragHandle === "nw") {
        const nextX = Math.max(0, Math.min(box.x + box.w - 5, box.x + deltaXPercent));
        const nextY = Math.max(0, Math.min(box.y + box.h - 5, box.y + deltaYPercent));
        const nextW = box.w - (nextX - box.x);
        const nextH = box.h - (nextY - box.y);
        setCropBox({ x: nextX, y: nextY, w: nextW, h: nextH });
      } else if (activeDragHandle === "ne") {
        const nextY = Math.max(0, Math.min(box.y + box.h - 5, box.y + deltaYPercent));
        const nextW = Math.max(5, Math.min(100 - box.x, box.w + deltaXPercent));
        const nextH = box.h - (nextY - box.y);
        setCropBox({ x: box.x, y: nextY, w: nextW, h: nextH });
      } else if (activeDragHandle === "sw") {
        const nextX = Math.max(0, Math.min(box.x + box.w - 5, box.x + deltaXPercent));
        const nextW = box.w - (nextX - box.x);
        const nextH = Math.max(5, Math.min(100 - box.y, box.h + deltaYPercent));
        setCropBox({ x: nextX, y: box.y, w: nextW, h: nextH });
      }
    },
    [activeDragHandle, dragStart, setCropBox]
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
    return { pxW, pxH, pxX, pxY };
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
      className={`bg-slate-900/50 rounded-sm p-3 flex flex-col justify-between h-full space-y-3 transition-colors ${
        detection?.face_detected
          ? "border border-slate-700/80"
          : "border border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500">01</span>
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
            Vision ROI & Detection
          </h2>
        </div>

        {detection?.face_detected ? (
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Face Detected
          </span>
        ) : previewUrl ? (
          <span className="text-[11px] font-medium text-slate-300">
            Image Loaded
          </span>
        ) : null}
      </div>

      {/* Viewport Frame */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Preset Toolbar when Crop Mode is Active */}
        {previewUrl && isCropMode && (
          <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 rounded-sm bg-slate-950 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-1 text-slate-400">
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span>Presets:</span>
              <button
                type="button"
                onClick={() => setCropBox({ x: 0, y: 0, w: 100, h: 100 })}
                className="px-1.5 py-0.2 rounded-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setCropBox({ x: 20, y: 20, w: 60, h: 60 })}
                className="px-1.5 py-0.2 rounded-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                60%
              </button>
              {detection?.bounding_box && (
                <button
                  type="button"
                  onClick={fitCropToDetectedFace}
                  className="px-1.5 py-0.2 rounded-sm bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium"
                >
                  Face ROI
                </button>
              )}
            </div>
            {cropStats && (
              <span className="text-indigo-400 font-mono font-medium">
                {cropStats.pxW}×{cropStats.pxH} px
              </span>
            )}
          </div>
        )}

        {/* Viewport Frame */}
        {previewUrl ? (
          <div
            ref={viewportRef}
            className="relative aspect-[4/3] w-full rounded-sm border border-slate-800 bg-slate-950 overflow-hidden select-none touch-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vision Target"
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Crop Overlay */}
            {isCropMode ? (
              <>
                <div
                  className="absolute top-0 left-0 right-0 bg-slate-950/75 pointer-events-none"
                  style={{ height: `${cropBox.y}%` }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 bg-slate-950/75 pointer-events-none"
                  style={{ height: `${Math.max(0, 100 - (cropBox.y + cropBox.h))}%` }}
                />
                <div
                  className="absolute bg-slate-950/75 pointer-events-none"
                  style={{
                    top: `${cropBox.y}%`,
                    height: `${cropBox.h}%`,
                    left: 0,
                    width: `${cropBox.x}%`,
                  }}
                />
                <div
                  className="absolute bg-slate-950/75 pointer-events-none"
                  style={{
                    top: `${cropBox.y}%`,
                    height: `${cropBox.h}%`,
                    right: 0,
                    width: `${Math.max(0, 100 - (cropBox.x + cropBox.w))}%`,
                  }}
                />

                <div
                  onPointerDown={(e) => handlePointerDown(e, "move")}
                  className="absolute border border-indigo-400 bg-indigo-500/15 cursor-move"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`,
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                    <div className="border-r border-b border-indigo-300" />
                    <div className="border-r border-b border-indigo-300" />
                    <div className="border-b border-indigo-300" />
                    <div className="border-r border-b border-indigo-300" />
                    <div className="border-r border-b border-indigo-300" />
                    <div className="border-b border-indigo-300" />
                    <div className="border-r border-indigo-300" />
                    <div className="border-r border-indigo-300" />
                    <div />
                  </div>

                  <div
                    onPointerDown={(e) => handlePointerDown(e, "nw")}
                    className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-400 border border-slate-950 cursor-nwse-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "ne")}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 border border-slate-950 cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "sw")}
                    className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-400 border border-slate-950 cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "se")}
                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-400 border border-slate-950 cursor-nwse-resize"
                  />

                  <div className="absolute top-1 left-1 px-1.5 py-0.2 bg-slate-950/90 text-[10px] font-mono text-indigo-300 border border-indigo-600 pointer-events-none">
                    ROI [{cropStats ? `${cropStats.pxW}×${cropStats.pxH}` : "Manual"}]
                  </div>
                </div>
              </>
            ) : (
              boundingBoxStyle && (
                <div
                  className="absolute border border-emerald-400 pointer-events-none"
                  style={boundingBoxStyle}
                >
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-400" />
                </div>
              )
            )}

            {/* Viewport Ticker */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-sm bg-slate-950/90 border border-slate-800 px-2 py-1 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-indigo-400 font-mono font-medium">
                {isCropMode && cropStats
                  ? `${cropStats.pxW}×${cropStats.pxH} px (ROI)`
                  : imageDimensions
                  ? `${imageDimensions.width}×${imageDimensions.height} px`
                  : "Input Ready"}
              </span>
              <span className="text-slate-400 text-[11px]">
                {isCropMode
                  ? "Custom Crop Active"
                  : detection?.face_detected
                  ? "Face Localized"
                  : "Full Search"}
              </span>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] w-full rounded-sm border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-4 text-center">
            <Scan className="w-5 h-5 text-slate-600 mb-2" />
            <span className="text-xs text-slate-400">No Image Loaded</span>
          </div>
        )}

        {/* Data Display */}
        <div className="rounded-sm border border-slate-800 bg-slate-950 divide-y divide-slate-800/80 text-xs">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Search Target</span>
            <span className="text-indigo-400 font-mono font-medium truncate max-w-[190px]">
              {isCropMode && cropStats
                ? `ROI [${cropStats.pxX}, ${cropStats.pxY}, ${cropStats.pxW}, ${cropStats.pxH}]`
                : previewUrl
                ? "Full Uploaded Image"
                : "None"}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Detection Model</span>
            <span className="text-slate-200">OpenCV Haar + YuNet</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Face Coordinates</span>
            <span className="text-slate-300 font-mono">
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
