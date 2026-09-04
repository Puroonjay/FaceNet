"use client";

import React from "react";
import {
  ShieldCheck,
  RefreshCw,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PipelinePhase } from "@/types";

interface HeaderProps {
  backendConnected: boolean | null;
  onRefreshHealth: () => void;
  phase: PipelinePhase;
  contractAddress?: string;
  rpcUrl: string;
  onOpenJsonModal: () => void;
  hasResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected,
  onRefreshHealth,
  phase,
  contractAddress,
  rpcUrl,
  onOpenJsonModal,
  hasResult,
}) => {
  const getPhaseBadge = () => {
    switch (phase) {
      case "COMPLETE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-900/80 bg-emerald-950/30 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        );

      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-rose-900/80 bg-rose-950/30 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-rose-400">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );

      case "DETECTING":
      case "RESOLVING_OSINT":
      case "ATTESTING_EVM":
      case "INGESTING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-900/70 bg-emerald-950/20 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Executing
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-800 bg-[#050807] px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            Idle
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#080c0b]/95 px-3 py-2 backdrop-blur-sm sm:px-4">
      <div className="mx-auto flex min-h-[38px] max-w-[96rem] items-center justify-between gap-3">
        {/* Left: Product & Service Identifier */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#18800b]/40 bg-[#18800b] text-[#161214]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                {/* 4 Corners (Face Scan Frame) */}
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />

                {/* Network / Face Nodes */}
                <circle cx="9" cy="9" r="1" fill="currentColor" />
                <circle cx="15" cy="9" r="1" fill="currentColor" />
                <circle cx="12" cy="13" r="1" fill="currentColor" />

                <path d="M9 9l3 4 3-4" strokeWidth="1.5" />
                <path d="M10 16c1 .5 3 .5 4 0" strokeWidth="1.5" />
              </svg>
            </div>

            <span className="font-mono text-sm font-semibold tracking-tight text-white">
              FaceNet
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-800 sm:block" />

          <span className="hidden truncate font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500 sm:inline">
            Pipeline: Vision → OSINT → EVM
          </span>

          {contractAddress && (
            <span className="hidden max-w-[240px] truncate rounded-sm border border-slate-800 bg-[#050807] px-2 py-1 font-mono text-[9px] text-slate-500 md:inline">
              Contract: {contractAddress.slice(0, 8)}...
              {contractAddress.slice(-6)}
            </span>
          )}
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="flex shrink-0 items-center gap-1.5 text-xs">
          {/* Node Health Status */}
          <div className="hidden items-center gap-2 rounded-sm border border-slate-800 bg-[#050807] px-2.5 py-1.5 font-mono text-[9px] sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendConnected === true
                  ? "bg-emerald-500"
                  : backendConnected === false
                    ? "bg-rose-500"
                    : "animate-pulse bg-amber-400"
              }`}
            />

            <span className="max-w-[180px] truncate text-slate-400">
              {backendConnected === true
                ? rpcUrl.replace(/^https?:\/\//, "")
                : backendConnected === false
                  ? "API Offline"
                  : "Checking..."}
            </span>

            <button
              type="button"
              onClick={onRefreshHealth}
              className="text-slate-600 transition-colors hover:text-emerald-400"
              title="Ping Backend"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {/* Phase Badge */}
          {getPhaseBadge()}

          {/* Raw JSON View */}
          {hasResult && (
            <button
              type="button"
              onClick={onOpenJsonModal}
              className="flex h-7 items-center gap-1.5 rounded-sm border border-slate-800 bg-[#050807] px-2.5 font-mono text-[9px] uppercase tracking-wide text-slate-400 transition-colors hover:border-emerald-900/70 hover:bg-emerald-950/20 hover:text-emerald-400"
            >
              <FileCode className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">JSON Receipt</span>
              <span className="sm:hidden">JSON</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
