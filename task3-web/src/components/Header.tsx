"use client";

import React from "react";
import { ShieldCheck, RefreshCw, FileCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-800/80">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "DETECTING":
      case "RESOLVING_OSINT":
      case "ATTESTING_EVM":
      case "INGESTING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/80">
            <Loader2 className="w-3 h-3 animate-spin" />
            Executing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Idle
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30 px-4 py-2">
      <div className="max-w-[96rem] mx-auto flex items-center justify-between">
        {/* Left: Product & Service Identifier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm text-white tracking-tight">FaceNet</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <span className="text-xs text-slate-400 hidden sm:inline font-mono">
            Pipeline: Vision → OSINT → EVM
          </span>

          {contractAddress && (
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hidden md:inline truncate max-w-[240px]">
              Contract: {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
            </span>
          )}
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center gap-2 text-xs">
          {/* Node Health Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendConnected === true
                  ? "bg-emerald-500"
                  : backendConnected === false
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-slate-300">
              {backendConnected === true
                ? rpcUrl.replace(/^https?:\/\//, "")
                : backendConnected === false
                ? "API Offline"
                : "Checking..."}
            </span>
            <button
              type="button"
              onClick={onRefreshHealth}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Ping Backend"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Phase Badge */}
          {getPhaseBadge()}

          {/* Raw JSON View */}
          {hasResult && (
            <button
              type="button"
              onClick={onOpenJsonModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono text-[11px] transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON Receipt</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
