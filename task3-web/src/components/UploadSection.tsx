"use client";

import React, { useRef } from "react";
import { Upload, Crop, X, Play, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/formatters";
import { CropBox } from "@/types";

interface UploadSectionProps {
  file: File | null;
  imageDimensions: { width: number; height: number } | null;
  previewUrl: string | null;
  isCropMode: boolean;
  cropBox: CropBox;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onToggleCrop: () => void;
  onExecute: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  file,
  imageDimensions,
  previewUrl,
  isCropMode,
  cropBox,
  isLoading,
  onFileSelect,
  onClear,
  onToggleCrop,
  onExecute,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCropPixelStats = () => {
    if (!imageDimensions) return null;

    const pxW = Math.round((cropBox.w / 100) * imageDimensions.width);
    const pxH = Math.round((cropBox.h / 100) * imageDimensions.height);
    const pxX = Math.round((cropBox.x / 100) * imageDimensions.width);
    const pxY = Math.round((cropBox.y / 100) * imageDimensions.height);

    return { pxW, pxH, pxX, pxY };
  };

  const cropStats = getCropPixelStats();

  return (
    <div className="rounded-sm border border-slate-800 bg-[#080c0b] p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />

      <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
        {/* Dropzone & Target Specs */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            if (e.dataTransfer.files?.[0]) {
              onFileSelect(e.dataTransfer.files[0]);
            }
          }}
          className={`flex flex-1 cursor-pointer flex-col justify-between gap-3 rounded-sm border p-2.5 transition-colors sm:flex-row sm:items-center ${
            file
              ? "border-emerald-900/60 bg-[#050807] hover:border-emerald-800"
              : "border-dashed border-slate-800 bg-[#050807]/70 hover:border-slate-700"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            {previewUrl ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-emerald-900/60 bg-[#080c0b]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-800 bg-[#080c0b] text-slate-600">
                <Upload className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0 space-y-0.5 overflow-hidden">
              {file ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="max-w-[220px] truncate font-mono text-[10px] font-semibold text-slate-200 sm:max-w-[340px]">
                      {file.name}
                    </span>

                    <span className="shrink-0 rounded-sm border border-emerald-900/80 bg-emerald-950/30 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-emerald-400">
                      Ready
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 font-mono text-[9px] text-slate-600">
                    <span>{formatBytes(file.size)}</span>

                    <span className="text-slate-800">•</span>

                    <span>{file.type || "image/jpeg"}</span>

                    {imageDimensions && (
                      <>
                        <span className="text-slate-800">•</span>
                        <span>
                          {imageDimensions.width}×{imageDimensions.height} px
                        </span>
                      </>
                    )}

                    {isCropMode && cropStats && (
                      <>
                        <span className="text-slate-800">•</span>
                        <span className="text-emerald-500">
                          ROI: {cropStats.pxW}×{cropStats.pxH} px
                        </span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <span className="block font-mono text-[10px] font-medium uppercase tracking-wide text-slate-300">
                    Upload image payload
                  </span>

                  <span className="text-[9px] text-slate-600">
                    Click to browse or drop an image file (.png, .jpg, .webp)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Chips */}
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-transparent text-slate-600 transition-colors hover:border-rose-900/60 hover:bg-rose-950/10 hover:text-rose-400"
                title="Clear image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <span className="rounded-sm border border-slate-800 bg-[#080c0b] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wide text-slate-400 transition-colors">
              {file ? "Change" : "Browse"}
            </span>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {file && (
            <button
              type="button"
              onClick={onToggleCrop}
              className={`flex items-center gap-1.5 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-wide transition-colors ${
                isCropMode
                  ? "border-emerald-800 bg-emerald-950/30 font-semibold text-emerald-400"
                  : "border-slate-800 bg-[#050807] text-slate-500 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <Crop className="h-3.5 w-3.5" />

              <span>Crop: {isCropMode ? "Active" : "Off"}</span>
            </button>
          )}

          <button
            type="button"
            disabled={!file || isLoading}
            onClick={onExecute}
            className={`flex min-w-[180px] items-center justify-center gap-2 rounded-sm border px-5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              isLoading
                ? "cursor-wait border-slate-700 bg-slate-900 text-slate-500"
                : !file
                  ? "cursor-not-allowed border-slate-800 bg-[#080c0b] text-slate-600"
                  : "cursor-pointer border-emerald-700 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500 hover:bg-emerald-900/40 hover:text-emerald-200"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />

                <span>
                  {isCropMode && cropStats
                    ? `Verify Crop (${cropStats.pxW}×${cropStats.pxH})`
                    : "Run Pipeline"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
