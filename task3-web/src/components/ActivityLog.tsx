"use client";

import React, { useState } from "react";
import { SystemLogEntry } from "@/types";
import {
  ListTree,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
} from "lucide-react";

interface ActivityLogProps {
  logs: SystemLogEntry[];
  onClearLogs: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  onClearLogs,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const copyAllLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.subsystem}] [${l.level}] ${l.message}`)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getLevelBadge = (level: SystemLogEntry["level"]) => {
    switch (level) {
      case "OK":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-900/70";
      case "WARN":
        return "bg-amber-950/40 text-amber-400 border-amber-900/70";
      case "ERR":
        return "bg-rose-950/40 text-rose-400 border-rose-900/70";
      case "EVM":
        return "bg-emerald-950/40 text-emerald-300 border-emerald-900/70";
      default:
        return "bg-slate-950 text-slate-500 border-slate-800";
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-sm border border-slate-800 bg-[#080c0b]">
      {/* Header */}
      <div className="flex min-h-[42px] items-center justify-between border-b border-slate-800 bg-[#0b100e] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-emerald-900/80 bg-emerald-950/30">
            <ListTree className="h-3 w-3 text-emerald-400" />
          </div>

          <h3 className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-200">
            System Event Log
          </h3>

          <span className="shrink-0 rounded-sm border border-slate-800 bg-[#050807] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
            {logs.length} events
          </span>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          {/* Copy */}
          <button
            type="button"
            onClick={copyAllLogs}
            className="flex h-6 items-center gap-1 rounded-sm border border-slate-800 bg-[#050807] px-2 font-mono text-[9px] uppercase tracking-wide text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200 cursor-pointer"
            title="Copy logs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={onClearLogs}
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-slate-800 bg-[#050807] text-slate-500 transition-colors hover:border-rose-900/70 hover:bg-rose-950/20 hover:text-rose-400 cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="h-3 w-3" />
          </button>

          {/* Collapse */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-slate-800 bg-[#050807] text-slate-500 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200 cursor-pointer"
            title={isOpen ? "Collapse logs" : "Expand logs"}
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="h-32 overflow-y-auto bg-[#050807] p-3 font-mono text-[10px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center font-mono text-[10px] text-slate-600">
              No activity recorded. Pipeline logs will appear here during
              execution.
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 leading-relaxed"
                >
                  {/* Timestamp */}
                  <span className="shrink-0 select-none text-slate-600">
                    [{log.timestamp}]
                  </span>

                  {/* Subsystem */}
                  <span className="shrink-0 select-none font-semibold text-slate-500">
                    [{log.subsystem}]
                  </span>

                  {/* Level */}
                  <span
                    className={`shrink-0 rounded-[2px] border px-1 py-0 font-mono text-[9px] font-medium leading-4 ${getLevelBadge(
                      log.level,
                    )}`}
                  >
                    {log.level}
                  </span>

                  {/* Message */}
                  <span className="break-all text-slate-400">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
