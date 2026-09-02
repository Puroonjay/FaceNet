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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 font-mono">
      <div className="w-full max-w-2xl rounded-md border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Cryptographic Receipt Inspector
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyJson}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre">{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-4 py-2 bg-slate-900 flex items-center justify-between text-[11px] text-slate-400">
          <span>Schema: FaceNet_EVM_V1</span>
          <span>{jsonString.length} bytes</span>
        </div>
      </div>
    </div>
  );
};
