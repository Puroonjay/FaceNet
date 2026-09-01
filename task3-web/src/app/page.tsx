"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  FileImage,
  CheckCircle2,
  Database,
  ShieldCheck,
  Globe,
  Scan,
  Link as LinkIcon,
} from "lucide-react";

export interface DetectionResult {
  face_detected?: boolean;
  bounding_box?: [number, number, number, number] | null;
  expanded_box?: [number, number, number, number] | null;
  image_dimensions?: [number, number];
  cropped_dimensions?: [number, number];
}

export interface MatchResult {
  title: string;
  link: string;
  source: string;
  author?: string;
  similarity?: string;
}

export interface BlockchainResult {
  is_verified: boolean;
  tx_hash: string;
  block_number: number;
  gas_used: number;
  hash_hex: string;
  on_chain_timestamp: number;
  contract_address?: string;
}

export interface VerificationResponse {
  detection?: DetectionResult;
  match: MatchResult;
  blockchain: BlockchainResult;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function FaceNetDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkBackendHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${BACKEND_URL}/api/health`, {
        method: "GET",
        signal: controller.signal,
      }).catch(async () => {
        return await fetch(`${BACKEND_URL}/health`, {
          method: "GET",
          signal: controller.signal,
        }).catch(async () => {
          return await fetch(`${BACKEND_URL}/`, {
            method: "GET",
            signal: controller.signal,
          }).catch(() => null);
        });
      });

      clearTimeout(timeoutId);
      setBackendConnected(Boolean(res && (res.ok || res.status === 404 || res.status === 200)));
    } catch {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const handleFile = (selectedFile: File) => {
    const valid = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!valid.includes(selectedFile.type)) {
      setErrorMessage("Please upload a valid image file (.png, .jpg, .jpeg, .webp).");
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setResult(null);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Extract natural image dimensions dynamically
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setImageDimensions(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runVerification = async () => {
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BACKEND_URL}/api/verify`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errText = `Server error (${response.status})`;
        try {
          const json = await response.json();
          if (json.detail) errText = json.detail;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {}
        throw new Error(errText);
      }

      const data: VerificationResponse = await response.json();
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification request failed";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const truncate = (str: string, front = 12, back = 10) => {
    if (!str || str.length <= front + back) return str;
    return `${str.slice(0, front)}...${str.slice(-back)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTimestamp = (epoch: number) => {
    if (!epoch) return "—";
    const date = new Date(epoch * 1000);
    return date.toUTCString();
  };

  // Dynamic bounding box computation
  const getDynamicBoundingBoxStyle = () => {
    if (!result?.detection?.bounding_box || !result.detection.image_dimensions) {
      return null;
    }
    const [bx, by, bw, bh] = result.detection.bounding_box;
    const [imgW, imgH] = result.detection.image_dimensions;
    if (!imgW || !imgH) return null;

    return {
      left: `${(bx / imgW) * 100}%`,
      top: `${(by / imgH) * 100}%`,
      width: `${(bw / imgW) * 100}%`,
      height: `${(bh / imgH) * 100}%`,
    };
  };

  const boundingBoxStyle = getDynamicBoundingBoxStyle();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-mono flex flex-col px-4 sm:px-8 lg:px-12 py-8 lg:py-10 max-w-[92rem] w-full mx-auto space-y-8">
      {/* 1. Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800/80 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
              <Scan className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-100">
              FaceNet <span className="text-neutral-500 font-normal">//</span> Biometric Attestation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 pl-11">
            Reverse Visual Search <span className="text-neutral-600">→</span> Ganache EVM Ledger
          </p>
        </div>

        {/* Backend Connection Indicator */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs ${
              backendConnected === true
                ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-400"
                : backendConnected === false
                ? "bg-rose-950/20 border-rose-800/50 text-rose-400"
                : "bg-neutral-900 border-neutral-800 text-neutral-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected === true
                  ? "bg-emerald-500"
                  : backendConnected === false
                  ? "bg-rose-500"
                  : "bg-neutral-500 animate-pulse"
              }`}
            />
            <span className="font-semibold">
              {backendConnected === true
                ? `Backend Active (${BACKEND_URL.replace(/^https?:\/\//, "")})`
                : backendConnected === false
                ? "Backend Offline"
                : "Checking Connection..."}
            </span>
            <button
              onClick={checkBackendHealth}
              className="text-neutral-500 hover:text-neutral-300 ml-1 transition-colors"
              title="Refresh connection status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold uppercase tracking-wider text-rose-400">Error:</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Upload & Execution Bar */}
      <section className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-4 sm:p-5 shadow-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          {/* Dropzone & Dynamic File Details */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border transition-all cursor-pointer gap-4 ${
              isDragging
                ? "border-emerald-500 bg-emerald-950/20"
                : file
                ? "border-neutral-700 bg-neutral-950/80 hover:border-neutral-600"
                : "border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-950/80"
            }`}
          >
            <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
              {previewUrl && file ? (
                <div className="w-12 h-12 rounded border border-neutral-700 bg-neutral-900 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Thumb" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded border border-neutral-800 bg-neutral-900/60 flex items-center justify-center text-neutral-400 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
              )}

              <div className="space-y-0.5 overflow-hidden">
                {file ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-100 truncate">{file.name}</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold shrink-0">
                        READY
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                      <span>Size: {formatFileSize(file.size)}</span>
                      <span className="text-neutral-600">•</span>
                      <span>Format: {file.type || "image"}</span>
                      {imageDimensions && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span>Dimensions: {imageDimensions.width} × {imageDimensions.height} px</span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-neutral-200">
                      Select or drag a target image to verify
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Accepts PNG, JPG, JPEG, or WEBP images
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-900 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded transition-colors font-medium">
                {file ? "Change Image" : "Browse Files"}
              </span>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            disabled={!file || isLoading}
            onClick={runVerification}
            className={`lg:w-72 py-4 px-6 rounded-lg font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shrink-0 ${
              isLoading
                ? "bg-neutral-800 text-emerald-400 border border-neutral-700 cursor-wait shadow-inner"
                : !file
                ? "bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-[0.99]"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <span>Run Verification Pipeline</span>
            )}
          </button>
        </div>
      </section>

      {/* 3. Expansive 3-Stage Result Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* CARD 01: Face Detection */}
        <div className="bg-neutral-900/30 rounded-xl border border-neutral-800/80 p-5 flex flex-col justify-between min-h-[500px] lg:min-h-[540px] shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                  01
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Face Detection
                </h2>
              </div>
              {result && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {result.detection?.face_detected ? "Face Detected" : "Frame Ingested"}
                </span>
              )}
            </div>

            {previewUrl ? (
              <div className="space-y-4">
                {/* Large Preview Frame with Dynamic Bounding Box Overlay */}
                <div className="relative aspect-[4/3] w-full rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Face Detection Viewport"
                    className="w-full h-full object-cover filter contrast-105"
                  />

                  {/* Real Dynamic Bounding Box Overlay */}
                  {boundingBoxStyle && (
                    <div
                      className="absolute border border-emerald-400 rounded-sm pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                      style={boundingBoxStyle}
                    >
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-neutral-950/85 backdrop-blur-sm border border-neutral-800 px-2.5 py-1 rounded text-[11px] text-neutral-300 flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold">
                      {result?.detection?.cropped_dimensions
                        ? `${result.detection.cropped_dimensions[0]} × ${result.detection.cropped_dimensions[1]} px`
                        : imageDimensions
                        ? `${imageDimensions.width} × ${imageDimensions.height} px`
                        : "Processed Frame"}
                    </span>
                    <span className="text-neutral-400">
                      {result?.detection?.face_detected ? "ROI Cropped" : "Frame Ingested"}
                    </span>
                  </div>
                </div>

                {/* Dynamic Metadata Details */}
                {file && (
                  <div className="space-y-2 text-xs pt-1">
                    <div className="p-3 rounded bg-neutral-950 border border-neutral-800/80 flex justify-between items-center">
                      <span className="text-neutral-500">File Size</span>
                      <span className="text-neutral-200 font-medium">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="p-3 rounded bg-neutral-950 border border-neutral-800/80 flex justify-between items-center">
                      <span className="text-neutral-500">MIME Format</span>
                      <span className="text-neutral-200 font-medium">{file.type || "image/jpeg"}</span>
                    </div>
                    <div className="p-3 rounded bg-neutral-950 border border-neutral-800/80 flex justify-between items-center">
                      <span className="text-neutral-500">Bounding Coordinates</span>
                      <span className="text-emerald-400 font-medium">
                        {result?.detection?.bounding_box
                          ? `[${result.detection.bounding_box.join(", ")}]`
                          : "Full Frame"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 w-full rounded-lg bg-neutral-950/60 border border-neutral-800/60 flex flex-col items-center justify-center p-6 text-center text-neutral-600 space-y-2">
                <FileImage className="w-8 h-8 stroke-[1.5]" />
                <p className="text-xs">No image ingested</p>
              </div>
            )}
          </div>
        </div>

        {/* CARD 02: OSINT Web Match */}
        <div className="bg-neutral-900/30 rounded-xl border border-neutral-800/80 p-5 flex flex-col justify-between min-h-[500px] lg:min-h-[540px] shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                  02
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  OSINT Web Match
                </h2>
              </div>
              {result?.match && (
                <span className="text-[11px] text-sky-400 font-semibold bg-sky-950/40 border border-sky-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {result.match.source}
                </span>
              )}
            </div>

            {result?.match ? (
              <div className="space-y-3 text-xs">
                {/* Platform Card */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Discovered Platform Source
                  </span>
                  <p className="text-sm font-bold text-neutral-100">{result.match.source}</p>
                </div>

                {/* Title & Post Content */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Post / Profile Title
                  </span>
                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {result.match.title || "—"}
                  </p>
                </div>

                {/* Match Confidence / Similarity Metric */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Match Confidence
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {result.match.similarity || "Visual Feature Match"}
                  </span>
                </div>

                {/* Direct Link Action */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-neutral-400" />
                    Target External Link
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={result.match.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline truncate flex-1 block"
                      title={result.match.link}
                    >
                      {result.match.link}
                    </a>
                    <a
                      href={result.match.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-700 shrink-0 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText(result.match.link, "match_link")}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-700 shrink-0 transition-colors"
                      title="Copy URL"
                    >
                      {copiedKey === "match_link" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-72 w-full rounded-lg bg-neutral-950/60 border border-neutral-800/60 flex flex-col items-center justify-center p-6 text-center text-neutral-600 space-y-2">
                <Globe className="w-8 h-8 stroke-[1.5]" />
                <p className="text-xs">No web match data</p>
              </div>
            )}
          </div>
        </div>

        {/* CARD 03: Ganache EVM Record */}
        <div className="bg-neutral-900/30 rounded-xl border border-neutral-800/80 p-5 flex flex-col justify-between min-h-[500px] lg:min-h-[540px] shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                  03
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Ganache EVM Record
                </h2>
              </div>
              {result?.blockchain?.is_verified && (
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ON-CHAIN ATTESTED
                </span>
              )}
            </div>

            {result?.blockchain ? (
              <div className="space-y-3 text-xs">
                {/* Block Number Card */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                      Block Number
                    </span>
                    <p className="text-sm font-bold text-emerald-400">
                      Block #{result.blockchain.block_number}
                    </p>
                  </div>
                  <Database className="w-5 h-5 text-emerald-400 opacity-80" />
                </div>

                {/* Tx Hash */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase font-semibold">
                    <span>Transaction Hash (EVM)</span>
                    <button
                      type="button"
                      onClick={() => copyText(result.blockchain.tx_hash, "tx_hash")}
                      className="text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1"
                    >
                      {copiedKey === "tx_hash" ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-200 break-all bg-neutral-900/80 p-2 rounded border border-neutral-800">
                    {truncate(result.blockchain.tx_hash, 16, 12)}
                  </div>
                </div>

                {/* SHA-256 Digest */}
                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase font-semibold">
                    <span>SHA-256 Digest (hash_hex)</span>
                    <button
                      type="button"
                      onClick={() => copyText(result.blockchain.hash_hex, "hash_hex")}
                      className="text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1"
                    >
                      {copiedKey === "hash_hex" ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-300 break-all bg-neutral-900/80 p-2 rounded border border-neutral-800">
                    {truncate(result.blockchain.hash_hex, 16, 12)}
                  </div>
                </div>

                {/* Gas & Timestamp Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                      Gas Used
                    </span>
                    <span className="text-neutral-200 font-bold font-mono">
                      {result.blockchain.gas_used.toLocaleString()} GAS
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                      Timestamp
                    </span>
                    <span
                      className="text-neutral-300 font-mono truncate block text-[10px]"
                      title={formatTimestamp(result.blockchain.on_chain_timestamp)}
                    >
                      {result.blockchain.on_chain_timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-72 w-full rounded-lg bg-neutral-950/60 border border-neutral-800/60 flex flex-col items-center justify-center p-6 text-center text-neutral-600 space-y-2">
                <Database className="w-8 h-8 stroke-[1.5]" />
                <p className="text-xs">No transaction record</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
