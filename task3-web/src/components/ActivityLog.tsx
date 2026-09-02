"use client";

import React, { useState } from "react";
import { SystemLogEntry } from "@/types";
import { ListTree, ChevronDown, ChevronUp, Copy, Check, Trash2 } from "lucide-react";

interface ActivityLogProps {
  logs: SystemLogEntry[];
  onClearLogs: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClearLogs }) => {
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
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/60";
      case "WARN":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60";
      case "ERR":
        return "bg-rose-950/70 text-rose-400 border-rose-800/60";
      case "EVM":
        return "bg-indigo-950/70 text-indigo-300 border-indigo-800/60";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListTree className="w-3.5 h-3.5 text-indigo-400" />
          <h3 className="text-xs font-medium text-slate-200">
            System Event Log
          </h3>
          <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] text-slate-400 font-mono border border-slate-800">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyAllLogs}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-800 transition-colors"
            title="Copy logs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="h-32 overflow-y-auto p-3 space-y-1 bg-slate-950 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-xs py-4 text-center font-sans">
              No activity recorded. Pipeline logs will appear here during execution.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-snug text-[11px]">
                <span className="text-slate-500 shrink-0 select-none">
                  [{log.timestamp}]
                </span>
                <span className="text-slate-400 font-semibold shrink-0 select-none">
                  [{log.subsystem}]
                </span>
                <span
                  className={`px-1 rounded text-[10px] border shrink-0 select-none ${getLevelBadge(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
