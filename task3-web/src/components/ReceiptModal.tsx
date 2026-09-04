"use client";

import React, { useState } from "react";
import { VerificationResponse } from "@/types";
import { X, Copy, Check, FileCode } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VerificationResponse | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !data) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const copyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 font-mono backdrop-blur-[2px] sm:p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-emerald-900/50 bg-[#080c0b] shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex min-h-[44px] items-center justify-between border-b border-slate-800 bg-[#0b100e] px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-emerald-900/80 bg-emerald-950/30">
              <FileCode className="h-3.5 w-3.5 text-emerald-400" />
            </div>

            <h3 className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-200 sm:text-[11px]">
              Cryptographic Receipt Inspector
            </h3>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={copyJson}
              className="flex h-7 items-center gap-1.5 rounded-sm border border-slate-800 bg-[#050807] px-2.5 font-mono text-[9px] uppercase tracking-wide text-slate-400 transition-colors hover:border-emerald-900/70 hover:bg-emerald-950/20 hover:text-emerald-400"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span className="hidden sm:inline">Copy JSON</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-800 bg-[#050807] text-slate-500 transition-colors hover:border-rose-900/70 hover:bg-rose-950/20 hover:text-rose-400"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto bg-[#050807] p-3 text-[10px] leading-relaxed text-slate-400 select-text sm:p-4 sm:text-[11px]">
          <div className="mb-3 flex items-center gap-2 border-b border-dashed border-slate-800 pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-[9px] uppercase tracking-wide text-slate-600">
              Raw Verification Payload
            </span>
          </div>

          <pre className="whitespace-pre font-mono">{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0b100e] px-3 py-2 font-mono text-[9px] sm:px-4">
          <span className="uppercase tracking-wide text-slate-600">
            Schema: <span className="text-emerald-600">FaceNet_EVM_V1</span>
          </span>

          <span className="text-slate-600">{jsonString.length} bytes</span>
        </div>
      </div>
    </div>
  );
};
