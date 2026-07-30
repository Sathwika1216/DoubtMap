import React from 'react';
import { X, Sparkles, Network, ArrowRight, Flame, HelpCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { Cluster, Doubt } from '../types.js';

interface SemanticConnectionModalProps {
  cluster: Cluster | null;
  doubts: Doubt[];
  onClose: () => void;
  onToggleAddressed: (clusterId: string, currentStatus: boolean) => void;
}

export const SemanticConnectionModal: React.FC<SemanticConnectionModalProps> = ({
  cluster,
  doubts,
  onClose,
  onToggleAddressed,
}) => {
  if (!cluster) return null;

  // Get all actual doubts matching this cluster
  const clusterDoubts = doubts.filter((d) => cluster.doubtIds.includes(d.id));
  const sampleDoubts = clusterDoubts.length > 0 ? clusterDoubts.slice(0, 5) : cluster.representativeDoubts.map((text, idx) => ({ id: `s-${idx}`, text, timestamp: '' }));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[#0E1117] border border-slate-800 rounded-xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* WOW Moment Header Banner */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Semantic Connection Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight font-mono">
            Different Words. <span className="text-amber-400 font-bold">Same Conceptual Confusion.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            DoubtMap grouped these student questions together because they reflect the exact same root misunderstanding.
          </p>
        </div>

        {/* Core Visual Diagram: Questions -> AI -> Conceptual Gap */}
        <div className="bg-black/40 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">
              SEMANTIC CLUSTERING VECTOR FLOW
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Differently Worded Doubts */}
            <div className="md:col-span-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">
                DIFFERENT STUDENT PHRASINGS:
              </span>
              {sampleDoubts.slice(0, 3).map((d, idx) => (
                <div
                  key={idx}
                  className="bg-[#141820] border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-200 italic shadow-sm"
                >
                  "{d.text}"
                </div>
              ))}
            </div>

            {/* Middle AI Embedding Engine Node */}
            <div className="md:col-span-2 flex flex-col items-center justify-center py-2 md:py-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Network className="w-5 h-5 animate-pulse" />
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 hidden md:block mt-2" />
            </div>

            {/* Target Conceptual Gap */}
            <div className="md:col-span-5 bg-[#141820] border-2 border-amber-500/30 rounded-xl p-4 text-center space-y-1.5 shadow-xl">
              <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-widest block">
                SINGLE CONCEPTUAL GAP:
              </span>
              <h4 className="font-bold text-white text-base leading-tight">
                {cluster.label}
              </h4>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{cluster.count} doubts ({cluster.percentage}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Semantic Explanation */}
        <div className="bg-black/40 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase tracking-widest">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>AI CONCEPTUAL GAP EXPLANATION FOR TEACHER</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {cluster.semanticExplanation}
          </p>
        </div>

        {/* All Doubts in this Cluster */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest flex items-center justify-between">
            <span>ALL {clusterDoubts.length} DOUBTS IN THIS CLUSTER</span>
            <span className="text-slate-500 font-normal">Anonymous Students</span>
          </span>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {clusterDoubts.map((d) => (
              <div
                key={d.id}
                className="bg-black/30 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>"{d.text}"</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Close Window
          </button>

          <button
            onClick={() => {
              onToggleAddressed(cluster.id, cluster.addressed);
              onClose();
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
              cluster.addressed
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{cluster.addressed ? 'REOPEN GAP' : 'MARK AS RESOLVED'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
