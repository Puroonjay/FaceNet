"use client";

import React, { useState } from "react";
import { BlockchainResult } from "@/types";
import {
  Database,
  ShieldCheck,
  Copy,
  Check,
  Cpu,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { truncateHex, formatUtcTimestamp } from "@/lib/formatters";

interface LedgerCardProps {
  blockchain?: BlockchainResult;
  isLoading: boolean;
}

export const LedgerCard: React.FC<LedgerCardProps> = ({
  blockchain,
  isLoading,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div
      className={`flex h-full flex-col justify-between space-y-3 overflow-hidden rounded-sm bg-[#080c0b] p-3 transition-colors ${
        blockchain?.is_tampered
          ? "border border-amber-700/70 bg-amber-950/10"
          : blockchain?.is_verified
            ? "border border-emerald-900/70"
            : "border border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-emerald-600">
            03
          </span>

          <div className="h-3 w-px bg-slate-800" />

          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-200">
            EVM Ledger Proof
          </h2>
        </div>

        {blockchain?.is_tampered ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Tamper Alert
          </span>
        ) : blockchain?.is_re_scan ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Already Verified
          </span>
        ) : blockchain?.is_verified ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Attested On-Chain
          </span>
        ) : isLoading ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Mining Block
          </span>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col justify-between space-y-2.5">
        {blockchain ? (
          <div className="space-y-2">
            {/* Tamper Alert Warning Box */}
            {blockchain.is_tampered && blockchain.tamper_details && (
              <div className="space-y-1.5 rounded-sm border border-amber-800/70 bg-amber-950/20 p-2.5 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Metadata Mismatch Detected
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-amber-900/30 pt-2 text-[10px]">
                  <div className="space-y-0.5">
                    <span className="block font-mono uppercase text-slate-600">
                      On-Chain Author
                    </span>
                    <span className="block truncate font-mono text-emerald-300">
                      {blockchain.tamper_details.stored_author || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block font-mono uppercase text-slate-600">
                      Live Scraped
                    </span>
                    <span className="block truncate font-mono text-amber-300">
                      {blockchain.tamper_details.live_author || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block font-mono uppercase text-slate-600">
                      On-Chain Platform
                    </span>
                    <span className="block truncate font-mono text-emerald-300">
                      {blockchain.tamper_details.stored_platform || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block font-mono uppercase text-slate-600">
                      Live Platform
                    </span>
                    <span className="block truncate font-mono text-amber-300">
                      {blockchain.tamper_details.live_platform || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Block Number / Attestation Status */}
            <div className="flex items-center justify-between rounded-sm border border-dashed border-slate-800 bg-[#050807] p-2.5">
              <div className="space-y-0.5">
                <span className="block font-mono text-[9px] uppercase tracking-wide text-slate-600">
                  Confirmed Status
                </span>

                <div className="font-mono text-sm font-bold text-emerald-400">
                  {blockchain.block_number > 0
                    ? `Block #${blockchain.block_number}`
                    : blockchain.is_re_scan
                      ? "Verified on Ledger"
                      : blockchain.is_tampered
                        ? "Tampered Asset"
                        : "Attested"}
                </div>
              </div>

              <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-emerald-900/80 bg-emerald-950/30 text-emerald-400">
                <Database className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Transaction Hash */}
            {blockchain.tx_hash && blockchain.tx_hash !== "0x" && (
              <div className="space-y-1 rounded-sm border border-slate-800 bg-[#050807] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-slate-600">
                    Transaction Hash
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(blockchain.tx_hash, "tx_hash")
                    }
                    className="flex items-center gap-1 font-mono text-[9px] uppercase text-slate-500 transition-colors hover:text-emerald-400"
                  >
                    {copiedKey === "tx_hash" ? (
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <Check className="h-3 w-3" />
                        Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="h-3 w-3" />
                        Copy
                      </span>
                    )}
                  </button>
                </div>

                <div className="select-all break-all rounded-sm border border-dashed border-slate-800 bg-[#080c0b] p-1.5 font-mono text-[10px] text-slate-300">
                  {truncateHex(blockchain.tx_hash, 16, 12)}
                </div>
              </div>
            )}

            {/* SHA-256 Digest */}
            <div className="space-y-1 rounded-sm border border-slate-800 bg-[#050807] p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wide text-slate-600">
                  SHA-256 State Fingerprint
                </span>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(blockchain.hash_hex, "hash_hex")
                  }
                  className="flex items-center gap-1 font-mono text-[9px] uppercase text-slate-500 transition-colors hover:text-emerald-400"
                >
                  {copiedKey === "hash_hex" ? (
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <Check className="h-3 w-3" />
                      Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Copy className="h-3 w-3" />
                      Copy
                    </span>
                  )}
                </button>
              </div>

              <div className="select-all break-all rounded-sm border border-dashed border-slate-800 bg-[#080c0b] p-1.5 font-mono text-[10px] text-slate-300">
                {truncateHex(blockchain.hash_hex, 16, 12)}
              </div>
            </div>

            {/* Gas & Timestamp Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5 rounded-sm border border-slate-800 bg-[#050807] p-2">
                <span className="block font-mono text-[9px] uppercase tracking-wide text-slate-600">
                  Gas Consumed
                </span>

                <span className="font-mono text-[10px] font-medium text-slate-200">
                  {blockchain.gas_used.toLocaleString()} units
                </span>
              </div>

              <div className="space-y-0.5 rounded-sm border border-slate-800 bg-[#050807] p-2">
                <span className="block font-mono text-[9px] uppercase tracking-wide text-slate-600">
                  Block Timestamp
                </span>

                <span
                  className="block truncate font-mono text-[10px] text-slate-300"
                  title={formatUtcTimestamp(blockchain.on_chain_timestamp)}
                >
                  {formatUtcTimestamp(blockchain.on_chain_timestamp)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-sm border border-dashed border-slate-800 bg-[#050807] p-4 text-center">
            <Cpu className="mb-2 h-5 w-5 text-slate-700" />

            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-600">
              No Transaction Record
            </span>
          </div>
        )}

        {/* Telemetry Footer */}
        <div className="divide-y divide-slate-800/80 rounded-sm border border-slate-800 bg-[#050807] font-mono text-[9px]">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="uppercase tracking-wide text-slate-600">
              Ledger Node
            </span>

            <span className="text-slate-400">Ganache EVM</span>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="uppercase tracking-wide text-slate-600">
              Attestation State
            </span>

            <span
              className={
                blockchain?.is_tampered
                  ? "font-medium text-amber-400"
                  : blockchain?.is_verified
                    ? "font-medium text-emerald-400"
                    : "text-slate-600"
              }
            >
              {blockchain?.is_tampered
                ? "Tamper Detected"
                : blockchain?.is_re_scan
                  ? "Confirmed (Re-Scan)"
                  : blockchain?.is_verified
                    ? "Confirmed (New Block)"
                    : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
