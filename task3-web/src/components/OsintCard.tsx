"use client";

import React, { useState } from "react";
import { MatchResult } from "@/types";
import { Globe, ExternalLink, Copy, Check, Link as LinkIcon, Radio, Loader2 } from "lucide-react";

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
      className={`bg-slate-900/50 rounded-sm p-3 flex flex-col justify-between h-full space-y-3 transition-colors ${
        match ? "border border-slate-700/80" : "border border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500">02</span>
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
            OSINT Resolver
          </h2>
        </div>

        {match ? (
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {match.source || "Match Resolved"}
          </span>
        ) : isLoading ? (
          <span className="text-[11px] font-medium text-indigo-400 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Querying Graph
          </span>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-between">
        {match ? (
          <div className="space-y-2">
            {/* Discovered Platform */}
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800/90 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Discovered Source</span>
                {match.match_type && (
                  <span className="text-slate-300 text-[10px] px-1.5 py-0.2 bg-slate-900 rounded-sm border border-slate-800 font-mono">
                    {match.match_type} Match
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-semibold text-white">
                  {match.source || "Web Index"}
                </span>
              </div>
            </div>

            {/* Title / Entity Description */}
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800/90 space-y-0.5">
              <span className="text-[11px] text-slate-400 block">
                Post / Profile Title
              </span>
              <p className="text-xs text-slate-200 leading-snug font-normal">
                {match.title || "No title metadata available"}
              </p>
            </div>

            {/* Author Handle if available */}
            {match.author && (
              <div className="p-2 rounded-sm bg-slate-950 border border-slate-800/90 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Author</span>
                <span className="text-slate-200 font-medium">{match.author}</span>
              </div>
            )}

            {/* Target URL */}
            <div className="p-2.5 rounded-sm bg-slate-950 border border-slate-800/90 space-y-1.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-slate-500" />
                Target Link
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={match.link || ""}
                  className="flex-1 rounded-sm border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 truncate font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyUrl(match.link)}
                  className="p-1 rounded-sm border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={match.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-sm border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Open in browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] w-full rounded-sm border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-4 text-center">
            <Radio className="w-5 h-5 text-slate-600 mb-2" />
            <span className="text-xs text-slate-400">No Web Match Data</span>
          </div>
        )}

        {/* Telemetry Footer */}
        <div className="rounded-sm border border-slate-800 bg-slate-950 divide-y divide-slate-800/80 text-xs">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Search Engine</span>
            <span className="text-slate-200">Google Lens Index</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-slate-400 text-[11px]">Resolver Status</span>
            <span className={match ? "text-emerald-400 font-medium" : "text-slate-500"}>
              {match ? "Resolved" : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
