"use client";

import React, { useState } from "react";
import { BlockchainResult } from "@/types";
import { Database, ShieldCheck, Copy, Check, Cpu, Loader2 } from "lucide-react";
import { truncateHex, formatUtcTimestamp } from "@/lib/formatters";

interface LedgerCardProps {
  blockchain?: BlockchainResult;
  isLoading: boolean;
}

export const LedgerCard: React.FC<LedgerCardProps> = ({ blockchain, isLoading }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div
      className={`bg-slate-900/50 rounded-sm p-3 flex flex-col justify-between h-full space-y-3 transition-colors ${
        blockchain?.is_verified ? "border border-slate-700/80" : "border border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500">03</span>
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
            EVM Ledger Proof
          </h2>
        </div>

        {blockchain?.is_verified ? (
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Attested On-Chain
          </span>
        ) : isLoading ? (
          <span className="text-[11px] font-medium text-indigo-400 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Mining Block
          </span>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
        {blockchain ? (
          <div className="space-y-2">
            {/* Block Number */}
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800/90 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block">Confirmed Block</span>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  Block #{blockchain.block_number}
                </div>
              </div>
              <div className="w-7 h-7 rounded-sm bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Database className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800/90 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Transaction Hash</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(blockchain.tx_hash, "tx_hash")}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === "tx_hash" ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-medium text-[11px]">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[11px]">
                      <Copy className="w-3 h-3" /> Copy
                    </span>
                  )}
                </button>
              </div>
              <div className="rounded-sm bg-slate-900 border border-slate-800 p-1.5 font-mono text-xs text-slate-200 select-all break-all">
                {truncateHex(blockchain.tx_hash, 16, 12)}
              </div>
            </div>

            {/* SHA-256 Digest */}
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800/90 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">SHA-256 State Fingerprint</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(blockchain.hash_hex, "hash_hex")}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === "hash_hex" ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-medium text-[11px]">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[11px]">
                      <Copy className="w-3 h-3" /> Copy
                    </span>
                  )}
                </button>
              </div>
              <div className="rounded-sm bg-slate-900 border border-slate-800 p-1.5 font-mono text-xs text-slate-300 select-all break-all">
                {truncateHex(blockchain.hash_hex, 16, 12)}
              </div>
            </div>

            {/* Gas & Timestamp Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-sm bg-slate-950 border border-slate-800/90 space-y-0.5">
                <span className="text-slate-400 text-[10px] block">Gas Consumed</span>
                <span className="text-white font-mono font-medium">
                  {blockchain.gas_used.toLocaleString()} units
                </span>
              </div>
              <div className="p-2 rounded-sm bg-slate-950 border border-slate-800/90 space-y-0.5">
                <span className="text-slate-400 text-[10px] block">Block Timestamp</span>
                <span
                  className="text-slate-300 font-mono truncate block text-[11px]"
                  title={formatUtcTimestamp(blockchain.on_chain_timestamp)}
                >
                  {formatUtcTimestamp(blockchain.on_chain_timestamp)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] w-full rounded-sm border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-4 text-center">
            <Cpu className="w-5 h-5 text-slate-600 mb-2" />
            <span className="text-xs text-slate-400">No Transaction Record</span>
          </div>
        )}

        {/* Telemetry Footer */}
        <div className="rounded-sm border border-slate-800 bg-slate-950 divide-y divide-slate-800/80 text-xs">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Ledger Node</span>
            <span className="text-slate-200">Ganache EVM</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Attestation State</span>
            <span className={blockchain?.is_verified ? "text-emerald-400 font-medium" : "text-slate-500"}>
              {blockchain?.is_verified ? "Confirmed" : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
