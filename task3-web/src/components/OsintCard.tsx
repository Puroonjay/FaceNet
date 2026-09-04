"use client";

import React, { useState } from "react";
import { MatchResult } from "@/types";
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon,
  Radio,
  Loader2,
} from "lucide-react";

interface OsintCardProps {
  match?: MatchResult;
  isLoading: boolean;
}

export const OsintCard: React.FC<OsintCardProps> = ({ match, isLoading }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`flex h-full flex-col justify-between space-y-3 overflow-hidden rounded-sm bg-[#080c0b] p-3 transition-colors ${
        match ? "border border-emerald-900/60" : "border border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-emerald-600">
            02
          </span>

          <div className="h-3 w-px bg-slate-800" />

          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-200">
            OSINT Resolver
          </h2>
        </div>

        {match ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            {match.source || "Match Resolved"}
          </span>
        ) : isLoading ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Querying Graph
          </span>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col justify-between space-y-2.5">
        {match ? (
          <div className="space-y-2">
            {/* Discovered Platform */}
            <div className="space-y-1 rounded-sm border border-slate-800 bg-[#050807] p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wide text-slate-600">
                  Discovered Source
                </span>

                {match.match_type && (
                  <span className="rounded-sm border border-slate-800 bg-[#080c0b] px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                    {match.match_type} Match
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-emerald-900/70 bg-emerald-950/20">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                </div>

                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                  {match.source || "Web Index"}
                </span>
              </div>
            </div>

            {/* Title / Entity Description */}
            <div className="space-y-1 rounded-sm border border-slate-800 bg-[#050807] p-2.5">
              <span className="block font-mono text-[9px] uppercase tracking-wide text-slate-600">
                Post / Profile Title
              </span>

              <p className="break-words font-mono text-[10px] leading-relaxed text-slate-300">
                {match.title || "No title metadata available"}
              </p>
            </div>

            {/* Author Handle if available */}
            {match.author && (
              <div className="flex items-center justify-between rounded-sm border border-slate-800 bg-[#050807] p-2">
                <span className="font-mono text-[9px] uppercase tracking-wide text-slate-600">
                  Author
                </span>

                <span className="max-w-[60%] truncate font-mono text-[10px] text-slate-300">
                  {match.author}
                </span>
              </div>
            )}

            {/* Target URL */}
            <div className="space-y-1.5 rounded-sm border border-slate-800 bg-[#050807] p-2.5">
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-slate-600">
                <LinkIcon className="h-3 w-3 text-slate-700" />
                Target Link
              </span>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={match.link || ""}
                  className="min-w-0 flex-1 select-all truncate rounded-sm border border-dashed border-slate-800 bg-[#080c0b] px-2 py-1.5 font-mono text-[9px] text-slate-400 outline-none"
                />

                <button
                  type="button"
                  onClick={() => copyUrl(match.link)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-slate-800 bg-[#080c0b] text-slate-500 transition-colors hover:border-emerald-900/70 hover:bg-emerald-950/20 hover:text-emerald-400"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                <a
                  href={match.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-slate-800 bg-[#080c0b] text-slate-500 transition-colors hover:border-emerald-900/70 hover:bg-emerald-950/20 hover:text-emerald-400"
                  title="Open in browser"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-sm border border-dashed border-slate-800 bg-[#050807] p-4 text-center">
            <Radio className="mb-2 h-5 w-5 text-slate-700" />

            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-600">
              No Web Match Data
            </span>
          </div>
        )}

        {/* Telemetry Footer */}
        <div className="divide-y divide-slate-800/80 rounded-sm border border-slate-800 bg-[#050807] font-mono text-[9px]">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="uppercase tracking-wide text-slate-600">
              Search Engine
            </span>

            <span className="text-slate-400">Google Lens Index</span>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="uppercase tracking-wide text-slate-600">
              Resolver Status
            </span>

            <span
              className={
                match ? "font-medium text-emerald-400" : "text-slate-600"
              }
            >
              {match ? "Resolved" : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
