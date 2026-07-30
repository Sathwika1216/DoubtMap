import React from 'react';
import { X, CheckCircle2, Flame, Award, Clock, Cpu, BarChart3 } from 'lucide-react';
import { SessionSummary, Cluster } from '../types.js';

interface ConfusionSnapshotModalProps {
  summary?: SessionSummary;
  clusters: Cluster[];
  onClose: () => void;
}

export const ConfusionSnapshotModal: React.FC<ConfusionSnapshotModalProps> = ({
  summary,
  clusters,
  onClose,
}) => {
  if (!summary) return null;

  const addressedList = clusters.filter((c) => c.addressed);
  const activeList = clusters.filter((c) => !c.addressed);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[#0E1117] border border-slate-800 rounded-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" />
            <span>SESSION COMPLETE SUMMARY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight font-mono">
            Classroom Confusion Snapshot
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive post-lecture report generated from AI semantic doubt clustering.
          </p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-black/40 border border-slate-800 rounded-lg p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">ANALYZED</span>
            <div className="text-2xl font-light text-white font-mono">{summary.totalDoubts}</div>
            <p className="text-[10px] text-slate-400">Student Doubts</p>
          </div>

          <div className="bg-black/40 border border-slate-800 rounded-lg p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">DETECTED</span>
            <div className="text-2xl font-light text-amber-400 font-mono">{summary.totalGaps}</div>
            <p className="text-[10px] text-slate-400">Conceptual Gaps</p>
          </div>

          <div className="bg-black/40 border border-slate-800 rounded-lg p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">RESOLVED</span>
            <div className="text-2xl font-light text-emerald-400 font-mono">
              {summary.addressedGapsCount} / {summary.totalGaps}
            </div>
            <p className="text-[10px] text-slate-400">Gaps Cleared</p>
          </div>

          <div className="bg-black/40 border border-slate-800 rounded-lg p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">AI LATENCY</span>
            <div className="text-2xl font-light text-indigo-400 font-mono">{summary.avgProcessingTimeMs}ms</div>
            <p className="text-[10px] text-slate-400">Avg Cluster Speed</p>
          </div>
        </div>

        {/* Top Confusion Breakdown */}
        <div className="bg-black/40 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              TOP CONCEPTUAL GAP
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {summary.topGapDoubtCount} Doubts
            </span>
          </div>
          <div className="text-base font-bold text-white bg-[#141820] p-3.5 rounded-lg border border-amber-500/30">
            {summary.topGapLabel}
          </div>
        </div>

        {/* Resolved vs Unresolved Lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              RESOLVED GAPS ({addressedList.length})
            </span>
            <div className="space-y-1.5">
              {addressedList.length > 0 ? (
                addressedList.map((c) => (
                  <div
                    key={c.id}
                    className="bg-black/30 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-slate-200 line-clamp-1"
                  >
                    ✓ {c.label} ({c.count} doubts)
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No gaps marked as addressed yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              REMAINING GAPS ({activeList.length})
            </span>
            <div className="space-y-1.5">
              {activeList.length > 0 ? (
                activeList.map((c) => (
                  <div
                    key={c.id}
                    className="bg-black/30 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 line-clamp-1"
                  >
                    • {c.label} ({c.count} doubts)
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">All detected gaps resolved!</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
