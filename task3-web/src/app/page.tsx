"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DetectionResult,
  MatchResult,
  BlockchainResult,
  VerificationResponse,
  CropBox,
  SystemLogEntry,
  PipelinePhase,
} from "@/types";
import { Header } from "@/components/Header";
import { LivePipelineMonitor } from "@/components/LivePipelineMonitor";
import { UploadSection } from "@/components/UploadSection";
import { VisionCard } from "@/components/VisionCard";
import { OsintCard } from "@/components/OsintCard";
import { LedgerCard } from "@/components/LedgerCard";
import { ActivityLog } from "@/components/ActivityLog";
import { ReceiptModal } from "@/components/ReceiptModal";
import { AlertCircle, X } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function FaceNetDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [phase, setPhase] = useState<PipelinePhase>("IDLE");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null,
  );
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);

  // Interactive ROI Crop State
  const [isCropMode, setIsCropMode] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<CropBox>({
    x: 15,
    y: 15,
    w: 70,
    h: 70,
  });
  const [activeDragHandle, setActiveDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    clientX: number;
    clientY: number;
    box: CropBox;
  } | null>(null);

  // System Activity & Telemetry Logs
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);

  const addLog = useCallback(
    (
      subsystem: SystemLogEntry["subsystem"],
      level: SystemLogEntry["level"],
      message: string,
    ) => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 23);
      setLogs((prev) => [
        ...prev.slice(-150),
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: timeStr,
          subsystem,
          level,
          message,
        },
      ]);
    },
    [],
  );

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
      const isOk = Boolean(
        res && (res.ok || res.status === 404 || res.status === 200),
      );
      setBackendConnected(isOk);

      if (isOk) {
        try {
          const rootRes = await fetch(`${BACKEND_URL}/`);
          if (rootRes.ok) {
            const rootJson = await rootRes.json();
            if (
              rootJson.contract_address &&
              !result?.blockchain?.contract_address
            ) {
              setResult((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  blockchain: {
                    ...prev.blockchain,
                    contract_address: rootJson.contract_address,
                  },
                };
              });
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      setBackendConnected(false);
    }
  }, [result?.blockchain?.contract_address]);

  useEffect(() => {
    addLog("SYS", "INFO", "Core initialized. Standing by for image payload.");
    addLog("NET", "INFO", `Connecting to ${BACKEND_URL}...`);
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  }, [checkBackendHealth, addLog]);

  useEffect(() => {
    if (backendConnected === true) {
      addLog("NET", "OK", `Backend node active at ${BACKEND_URL}`);
    } else if (backendConnected === false) {
      addLog(
        "NET",
        "WARN",
        `Backend unreachable at ${BACKEND_URL}. Check FastAPI/Ganache.`,
      );
    }
  }, [backendConnected, addLog]);

  const handleFile = (selectedFile: File) => {
    const valid = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!valid.includes(selectedFile.type)) {
      const err = `Invalid MIME type: ${selectedFile.type}. Supported: .png, .jpg, .webp`;
      setErrorMessage(err);
      addLog("SYS", "ERR", err);
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setResult(null);
    setPhase("IDLE");
    setIsCropMode(false);
    setCropBox({ x: 15, y: 15, w: 70, h: 70 });

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      addLog(
        "VISION",
        "INFO",
        `Ingested ${selectedFile.name} [${img.naturalWidth}×${img.naturalHeight}px, ${(
          selectedFile.size / 1024
        ).toFixed(1)} KB]`,
      );
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
    setPhase("IDLE");
    setIsCropMode(false);
    addLog("SYS", "INFO", "Input buffer cleared.");
  };

  const getSubmittableFile = async (): Promise<File> => {
    if (!file || !isCropMode || !previewUrl || !imageDimensions) {
      return file!;
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const srcX = Math.round((cropBox.x / 100) * img.naturalWidth);
        const srcY = Math.round((cropBox.y / 100) * img.naturalHeight);
        const srcW = Math.max(
          10,
          Math.round((cropBox.w / 100) * img.naturalWidth),
        );
        const srcH = Math.max(
          10,
          Math.round((cropBox.h / 100) * img.naturalHeight),
        );

        const canvas = document.createElement("canvas");
        canvas.width = srcW;
        canvas.height = srcH;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
        }
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], `crop_${file.name}`, {
                type: "image/jpeg",
              });
              resolve(croppedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.95,
        );
      };
      img.onerror = () => resolve(file);
      img.src = previewUrl;
    });
  };

  const runVerification = async () => {
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setPhase("INGESTING");

    addLog("SYS", "INFO", `Running pipeline for ${file.name}...`);

    try {
      const fileToSend = await getSubmittableFile();
      const formData = new FormData();
      formData.append("file", fileToSend);

      setPhase("DETECTING");
      addLog(
        "VISION",
        "INFO",
        "Running OpenCV HaarCascade / YuNet detector...",
      );

      setTimeout(() => {
        setPhase((curr) => (curr === "DETECTING" ? "RESOLVING_OSINT" : curr));
        addLog("OSINT", "INFO", "Querying visual reverse index...");
      }, 700);

      setTimeout(() => {
        setPhase((curr) =>
          curr === "RESOLVING_OSINT" ? "ATTESTING_EVM" : curr,
        );
        addLog("EVM", "INFO", "Mining attestation transaction on Ganache...");
      }, 1400);

      const response = await fetch(`${BACKEND_URL}/api/verify`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errText = `HTTP_${response.status}`;
        try {
          const json = await response.json();
          if (json.detail) errText = json.detail;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {}
        throw new Error(errText);
      }

      const data: VerificationResponse = await response.json();
      setResult(data);
      setPhase("COMPLETE");

      addLog(
        "VISION",
        "OK",
        data.detection?.face_detected
          ? `Face localized [${data.detection.bounding_box?.join(", ")}]`
          : "Full frame processed (no frontal face detected)",
      );

      addLog(
        "OSINT",
        "OK",
        `Source match: ${data.match.source} (${data.match.similarity || "Feature Match"})`,
      );

      addLog(
        "EVM",
        "OK",
        `Block #${data.blockchain.block_number} mined (Gas: ${data.blockchain.gas_used}, Hash: ${data.blockchain.hash_hex.slice(
          0,
          12,
        )}...)`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setErrorMessage(msg);
      setPhase("ERROR");
      addLog("SYS", "ERR", `Pipeline execution failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (file && !isLoading) runVerification();
      } else if (e.key === "Escape") {
        if (isJsonModalOpen) setIsJsonModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, isLoading, isJsonModalOpen]);

  return (
    // <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
    <div className="min-h-screen bg-[#050807] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* 1. Header Toolbar */}
      <Header
        backendConnected={backendConnected}
        onRefreshHealth={checkBackendHealth}
        phase={phase}
        contractAddress={result?.blockchain?.contract_address}
        rpcUrl={BACKEND_URL}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        hasResult={Boolean(result)}
      />

      <main className="flex-1 max-w-[96rem] w-full mx-auto px-4 py-3 space-y-2.5 flex flex-col">
        {/* Error Banner */}
        {errorMessage && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold text-rose-400">ERROR:</span>
              <span className="break-all">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Buffer Ingest Strip */}
        <UploadSection
          file={file}
          imageDimensions={imageDimensions}
          previewUrl={previewUrl}
          isCropMode={isCropMode}
          cropBox={cropBox}
          isLoading={isLoading}
          onFileSelect={handleFile}
          onClear={handleClear}
          onToggleCrop={() => setIsCropMode(!isCropMode)}
          onExecute={runVerification}
        />

        {/* Dynamic Live Execution Monitor */}
        <LivePipelineMonitor
          phase={phase}
          isLoading={isLoading}
          file={file}
          result={result}
        />

        {/* 3-Stage Pipeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-[440px]">
          {/* Stage 1: Vision ROI & Detection */}
          <VisionCard
            previewUrl={previewUrl}
            imageDimensions={imageDimensions}
            detection={result?.detection}
            isCropMode={isCropMode}
            cropBox={cropBox}
            setCropBox={setCropBox}
            setIsCropMode={setIsCropMode}
            activeDragHandle={activeDragHandle}
            setActiveDragHandle={setActiveDragHandle}
            dragStart={dragStart}
            setDragStart={setDragStart}
          />

          {/* Stage 2: OSINT Web Match */}
          <OsintCard
            match={result?.match}
            isLoading={
              isLoading &&
              (phase === "RESOLVING_OSINT" || phase === "DETECTING")
            }
          />

          {/* Stage 3: EVM Ledger Proof */}
          <LedgerCard
            blockchain={result?.blockchain}
            isLoading={
              isLoading &&
              (phase === "ATTESTING_EVM" || phase === "RESOLVING_OSINT")
            }
          />
        </div>

        {/* 6. Activity Logs Console */}
        <ActivityLog logs={logs} onClearLogs={() => setLogs([])} />
      </main>

      {/* 7. JSON Receipt Inspector Modal */}
      <ReceiptModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        data={result}
      />
    </div>
  );
}
