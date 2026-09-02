"use client";

import React, { useState, useEffect } from "react";
import { PipelinePhase, VerificationResponse } from "@/types";
import { Check, Loader2, UploadCloud, Scan, Globe, Database, Activity } from "lucide-react";
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
      if (stageIndex === 0) return { status: "done", label: `${formatBytes(file?.size || 0)}` };
      if (stageIndex === 1) {
        return {
          status: "done",
          label: result.detection?.face_detected
            ? `Face [${result.detection.bounding_box?.[0]}, ${result.detection.bounding_box?.[1]}]`
            : "Full Frame",
        };
      }
      if (stageIndex === 2) return { status: "done", label: result.match.source || "Match Resolved" };
      if (stageIndex === 3) return { status: "done", label: `Block #${result.blockchain.block_number}` };
    }

    if (phase === "IDLE") {
      if (stageIndex === 0 && file) return { status: "done", label: `${formatBytes(file.size)} Ready` };
      return { status: "pending", label: "Pending" };
    }

    if (phase === "INGESTING") {
      if (stageIndex === 0) return { status: "running", label: "Normalizing..." };
      return { status: "pending", label: "Pending" };
    }

    if (phase === "DETECTING") {
      if (stageIndex === 0) return { status: "done", label: "Ingested" };
      if (stageIndex === 1) return { status: "running", label: "Haar + YuNet..." };
      return { status: "pending", label: "Pending" };
    }

    if (phase === "RESOLVING_OSINT") {
      if (stageIndex === 0) return { status: "done", label: "Ingested" };
      if (stageIndex === 1) return { status: "done", label: "Face Localized" };
      if (stageIndex === 2) return { status: "running", label: "Lens Graph..." };
      return { status: "pending", label: "Pending" };
    }

    if (phase === "ATTESTING_EVM") {
      if (stageIndex === 0) return { status: "done", label: "Ingested" };
      if (stageIndex === 1) return { status: "done", label: "Face Localized" };
      if (stageIndex === 2) return { status: "done", label: "Match Found" };
      if (stageIndex === 3) return { status: "running", label: "Mining Block..." };
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
          ? "bg-slate-900/90 border-indigo-500/70"
          : phase === "COMPLETE"
          ? "bg-slate-900/60 border-emerald-900/70"
          : "bg-slate-900/40 border-slate-800"
      }`}
    >
      {/* Live Status Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
          ) : phase === "COMPLETE" ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}

          <span
            className={`font-medium truncate ${
              isLoading
                ? "text-indigo-300"
                : phase === "COMPLETE"
                ? "text-emerald-400"
                : "text-slate-300"
            }`}
          >
            {getActiveTitle()}
          </span>
        </div>

        {/* Live Elapsed Time or Confirmation */}
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
          {isLoading && (
            <span className="text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded-sm border border-indigo-800">
              {(elapsedMs / 1000).toFixed(2)}s
            </span>
          )}
          {phase === "COMPLETE" && (
            <span className="text-emerald-400 font-sans text-xs">
              Complete
            </span>
          )}
        </div>
      </div>

      {/* 4-Stage Live Node Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STAGES.map((stage, idx) => {
          const { status, label } = getStageState(idx);

          return (
            <div
              key={stage.id}
              className={`p-2 rounded-sm border flex items-center gap-2 text-xs transition-colors ${
                status === "running"
                  ? "bg-slate-950 border-indigo-500 text-white"
                  : status === "done"
                  ? "bg-slate-950/80 border-slate-800 text-slate-200"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-500"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 text-[11px] font-mono ${
                  status === "done"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : status === "running"
                    ? "bg-indigo-950 text-indigo-300 border border-indigo-700"
                    : "bg-slate-900 text-slate-500 border border-slate-800"
                }`}
              >
                {status === "done" ? (
                  <Check className="w-3 h-3" />
                ) : status === "running" ? (
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                ) : (
                  <span>{stage.id}</span>
                )}
              </div>

              <div className="overflow-hidden min-w-0">
                <span
                  className={`font-medium truncate block leading-tight ${
                    status === "running"
                      ? "text-indigo-200 font-semibold"
                      : status === "done"
                      ? "text-slate-200"
                      : "text-slate-400"
                  }`}
                >
                  {stage.name}
                </span>
                <span
                  className={`text-[10px] font-mono truncate block ${
                    status === "running"
                      ? "text-indigo-400 font-semibold"
                      : status === "done"
                      ? "text-emerald-400"
                      : "text-slate-500"
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
