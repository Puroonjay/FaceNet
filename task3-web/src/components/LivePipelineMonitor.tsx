"use client";

import React, { useState, useEffect } from "react";
import { PipelinePhase, VerificationResponse } from "@/types";
import {
  Check,
  Loader2,
  UploadCloud,
  Scan,
  Globe,
  Database,
  Activity,
} from "lucide-react";
import { formatBytes } from "@/lib/formatters";

interface LivePipelineMonitorProps {
  phase: PipelinePhase;
  isLoading: boolean;
  file: File | null;
  result: VerificationResponse | null;
}

export const LivePipelineMonitor: React.FC<LivePipelineMonitorProps> = ({
  phase,
  isLoading,
  file,
  result,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading) {
      const start = Date.now();
      setElapsedMs(0);

      interval = setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  if (!file && phase === "IDLE") {
    return null;
  }

  const getStageState = (stageIndex: number) => {
    if (phase === "ERROR") {
      return { status: "error", label: "Failed" };
    }

    if (phase === "COMPLETE" && result) {
      if (stageIndex === 0)
        return {
          status: "done",
          label: `${formatBytes(file?.size || 0)}`,
        };

      if (stageIndex === 1) {
        return {
          status: "done",
          label: result.detection?.face_detected
            ? `Face [${result.detection.bounding_box?.[0]}, ${result.detection.bounding_box?.[1]}]`
            : "Full Frame",
        };
      }

      if (stageIndex === 2)
        return {
          status: "done",
          label: result.match.source || "Match Resolved",
        };

      if (stageIndex === 3)
        return {
          status: "done",
          label: `Block #${result.blockchain.block_number}`,
        };
    }

    if (phase === "IDLE") {
      if (stageIndex === 0 && file)
        return {
          status: "done",
          label: `${formatBytes(file.size)} Ready`,
        };

      return { status: "pending", label: "Pending" };
    }

    if (phase === "INGESTING") {
      if (stageIndex === 0)
        return { status: "running", label: "Normalizing..." };

      return { status: "pending", label: "Pending" };
    }

    if (phase === "DETECTING") {
      if (stageIndex === 0) return { status: "done", label: "Ingested" };

      if (stageIndex === 1)
        return { status: "running", label: "Haar + YuNet..." };

      return { status: "pending", label: "Pending" };
    }

    if (phase === "RESOLVING_OSINT") {
      if (stageIndex === 0) return { status: "done", label: "Ingested" };

      if (stageIndex === 1) return { status: "done", label: "Face Localized" };

      if (stageIndex === 2)
        return { status: "running", label: "Lens Graph..." };

      return { status: "pending", label: "Pending" };
    }

    if (phase === "ATTESTING_EVM") {
      if (stageIndex === 0) return { status: "done", label: "Ingested" };

      if (stageIndex === 1) return { status: "done", label: "Face Localized" };

      if (stageIndex === 2) return { status: "done", label: "Match Found" };

      if (stageIndex === 3)
        return { status: "running", label: "Mining Block..." };
    }

    return { status: "pending", label: "Pending" };
  };

  const getActiveTitle = () => {
    switch (phase) {
      case "INGESTING":
        return "1/4 Ingesting image buffer and normalizing aspect ratio";

      case "DETECTING":
        return "2/4 Executing OpenCV face detection & ROI coordinate isolation";

      case "RESOLVING_OSINT":
        return "3/4 Querying visual reverse search index (Google Lens graph)";

      case "ATTESTING_EVM":
        return "4/4 Computing SHA-256 fingerprint & submitting smart contract proof";

      case "COMPLETE":
        return "Pipeline complete — All stages verified on-chain";

      case "ERROR":
        return "Pipeline execution halted";

      default:
        return `Buffer Loaded: ${file?.name}`;
    }
  };

  const STAGES = [
    { id: 1, name: "Buffer Ingest", icon: UploadCloud },
    { id: 2, name: "Vision Detection", icon: Scan },
    { id: 3, name: "OSINT Resolver", icon: Globe },
    { id: 4, name: "EVM Attestation", icon: Database },
  ];

  return (
    <div
      className={`rounded-sm border p-2.5 transition-all ${
        isLoading
          ? "border-emerald-800/70 bg-[#0a100d]"
          : phase === "COMPLETE"
            ? "border-emerald-900/70 bg-[#080d0b]"
            : phase === "ERROR"
              ? "border-rose-900/70 bg-[#0d0909]"
              : "border-slate-800 bg-[#080c0b]"
      }`}
    >
      {/* Live Status Header */}
      <div className="mb-2 flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" />
          ) : phase === "COMPLETE" ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          ) : phase === "ERROR" ? (
            <Activity className="h-3.5 w-3.5 shrink-0 text-rose-400" />
          ) : (
            <Activity className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          )}

          <span
            className={`truncate font-mono text-[10px] ${
              isLoading
                ? "text-emerald-300"
                : phase === "COMPLETE"
                  ? "text-emerald-400"
                  : phase === "ERROR"
                    ? "text-rose-400"
                    : "text-slate-400"
            }`}
          >
            {getActiveTitle()}
          </span>
        </div>

        {/* Live Elapsed Time or Confirmation */}
        <div className="ml-2 flex shrink-0 items-center gap-2 font-mono text-[10px]">
          {isLoading && (
            <span className="rounded-sm border border-emerald-900/80 bg-emerald-950/30 px-1.5 py-0.5 text-emerald-400">
              {(elapsedMs / 1000).toFixed(2)}s
            </span>
          )}

          {phase === "COMPLETE" && (
            <span className="font-mono text-[9px] uppercase tracking-wide text-emerald-400">
              Complete
            </span>
          )}
        </div>
      </div>

      {/* 4-Stage Live Node Grid */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {STAGES.map((stage, idx) => {
          const { status, label } = getStageState(idx);

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-2 rounded-sm border p-2 text-xs transition-colors ${
                status === "running"
                  ? "border-emerald-800/80 bg-emerald-950/20 text-white"
                  : status === "done"
                    ? "border-slate-800 bg-[#050807] text-slate-200"
                    : status === "error"
                      ? "border-rose-900/70 bg-rose-950/10 text-rose-300"
                      : "border-slate-800/60 bg-[#050807]/60 text-slate-500"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-mono ${
                  status === "done"
                    ? "border border-emerald-900/80 bg-emerald-950/30 text-emerald-400"
                    : status === "running"
                      ? "border border-emerald-800 bg-emerald-950/40 text-emerald-300"
                      : status === "error"
                        ? "border border-rose-900 bg-rose-950/30 text-rose-400"
                        : "border border-slate-800 bg-[#080c0b] text-slate-600"
                }`}
              >
                {status === "done" ? (
                  <Check className="h-3 w-3" />
                ) : status === "running" ? (
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                ) : (
                  <span>{stage.id}</span>
                )}
              </div>

              <div className="min-w-0 overflow-hidden">
                <span
                  className={`block truncate font-mono text-[9px] leading-tight uppercase tracking-wide ${
                    status === "running"
                      ? "font-semibold text-emerald-300"
                      : status === "done"
                        ? "text-slate-300"
                        : status === "error"
                          ? "text-rose-300"
                          : "text-slate-500"
                  }`}
                >
                  {stage.name}
                </span>

                <span
                  className={`block truncate font-mono text-[9px] ${
                    status === "running"
                      ? "font-semibold text-emerald-400"
                      : status === "done"
                        ? "text-emerald-500"
                        : status === "error"
                          ? "text-rose-400"
                          : "text-slate-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
