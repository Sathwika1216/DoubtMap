import React from 'react';
import { Sparkles, RefreshCw, Lightbulb, CheckCircle2 } from 'lucide-react';
import { TeacherInsight } from '../types.js';

interface TeacherInsightPanelProps {
  insight?: TeacherInsight;
  onRefreshInsight: () => void;
  loading: boolean;
}

export const TeacherInsightPanel: React.FC<TeacherInsightPanelProps> = ({
  insight,
  onRefreshInsight,
  loading,
}) => {
  return (
    <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-indigo-400 uppercase tracking-widest font-mono">
              AI Decision Support
            </h3>
          </div>
        </div>

        <button
          onClick={onRefreshInsight}
          disabled={loading}
          className="p-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 transition-colors disabled:opacity-50"
          title="Regenerate AI Insight"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-4 text-center space-y-2">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-300">Synthesizing classroom doubts into teaching intervention...</p>
        </div>
      ) : insight ? (
        <div className="space-y-3 pt-1">
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {insight.summary}
          </p>
          <div className="bg-black/30 border border-indigo-500/20 rounded-lg p-3 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              RECOMMENDED ACTION
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {insight.actionableAdvice}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-slate-400">
          Click refresh to generate AI decision support intervention for your lecture.
        </div>
      )}
    </div>
  );
};
