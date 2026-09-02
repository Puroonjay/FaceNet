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
    <div className="bg-slate-900/50 border border-slate-800 rounded-sm p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
        }}
      />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Dropzone & Target Specs */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
          }}
          className={`flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-sm border transition-colors cursor-pointer gap-3 ${
            file
              ? "bg-slate-950 border-slate-700/80 hover:border-slate-600"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {previewUrl ? (
              <div className="w-10 h-10 rounded-sm border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-sm border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
                <Upload className="w-4 h-4" />
              </div>
            )}

            <div className="overflow-hidden space-y-0.5">
              {file ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-[340px]">
                      {file.name}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-sm bg-emerald-950/80 text-emerald-400 border border-emerald-800 shrink-0 font-medium">
                      Ready
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 font-mono">
                    <span>{formatBytes(file.size)}</span>
                    <span className="text-slate-600">•</span>
                    <span>{file.type || "image/jpeg"}</span>
                    {imageDimensions && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span>{imageDimensions.width}×{imageDimensions.height} px</span>
                      </>
                    )}
                    {isCropMode && cropStats && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-indigo-400">
                          ROI: {cropStats.pxW}×{cropStats.pxH} px
                        </span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-xs font-medium text-slate-300 block">
                    Upload image payload
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click to browse or drop an image file (.png, .jpg, .webp)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Chips */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 rounded-sm text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                title="Clear image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="px-2.5 py-1 rounded-sm bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 font-medium">
              {file ? "Change" : "Browse"}
            </span>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {file && (
            <button
              type="button"
              onClick={onToggleCrop}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs border transition-colors ${
                isCropMode
                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-700 font-medium"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop: {isCropMode ? "Active" : "Off"}</span>
            </button>
          )}

          <button
            type="button"
            disabled={!file || isLoading}
            onClick={onExecute}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-sm text-xs font-semibold tracking-wide transition-colors min-w-[180px] ${
              isLoading
                ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-wait"
                : !file
                ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 cursor-pointer"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isCropMode && cropStats
                    ? `Verify Crop (${cropStats.pxW}×{cropStats.pxH})`
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
