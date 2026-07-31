import React from 'react';
import { HelpCircle, Layers, Users, Clock, Flame, Sparkles } from 'lucide-react';

interface SummaryMetricsProps {
  totalDoubts: number;
  activeGapCount: number;
  studentCount: number;
  lastAnalysisTime?: string;
  aiMode?: 'GEMINI_AI' | 'STANDBY_HYBRID';
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  totalDoubts,
  activeGapCount,
  studentCount,
  lastAnalysisTime,
  aiMode = 'GEMINI_AI',
}) => {
  const [secondsAgo, setSecondsAgo] = React.useState<number>(0);

  React.useEffect(() => {
    const update = () => {
      if (lastAnalysisTime) {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(lastAnalysisTime).getTime()) / 1000));
        setSecondsAgo(diff);
      }
    };
    update(); // set immediately on mount/change
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastAnalysisTime]);

  // Bug fix #8: derive gap status label dynamically instead of hardcoding "Critical"
  const gapStatusLabel =
    activeGapCount === 0
      ? 'None'
      : activeGapCount === 1
      ? 'Active'
      : 'Active';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* Metric 1: Total Doubts */}
      <div className="bg-[#0E1117] border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            Total Doubts
          </span>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono tracking-tight flex items-baseline gap-2">
            <span>{totalDoubts}</span>
            <span className="text-xs font-semibold text-emerald-400 font-sans">live</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
          <HelpCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 2: Active Gaps */}
      <div className="bg-[#0E1117] border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Active Gaps
          </span>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono tracking-tight flex items-baseline gap-2">
            <span>{activeGapCount}</span>
            {/* Bug fix #8: was always "Critical", now reflects real state */}
            <span className={`text-xs font-semibold font-sans ${activeGapCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {gapStatusLabel}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 3: Students Connected */}
      <div className="bg-[#0E1117] border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Student Participation
          </span>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono tracking-tight flex items-baseline gap-2">
            <span>{studentCount}</span>
            <span className="text-xs font-semibold text-indigo-400 font-sans">connected</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 4: AI Engine / Last Update */}
      <div className="bg-[#0E1117] border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Last AI Update
          </span>
          <div className="text-lg sm:text-xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1.5">
            <span>{secondsAgo < 2 ? '2s ago' : `${secondsAgo}s ago`}</span>
          </div>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {/* Bug fix #11: updated model name label */}
            <span>{aiMode === 'GEMINI_AI' ? 'Gemini 2.0 Flash' : 'Standby Engine'}</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
