import React from 'react';
import { Flame, CheckCircle2, ArrowUpRight, TrendingUp, TrendingDown, Minus, Eye, Sparkles } from 'lucide-react';
import { Cluster, HeatLevel } from '../types.js';

interface ClusterCardProps {
  cluster: Cluster;
  onViewDetails: (cluster: Cluster) => void;
  onToggleAddressed: (clusterId: string, currentStatus: boolean) => void;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onViewDetails,
  onToggleAddressed,
}) => {
  const heatConfig: Record<
    HeatLevel,
    { badgeBg: string; textColor: string; borderColor: string; iconColor: string; label: string }
  > = {
    CRITICAL: {
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      textColor: 'text-rose-400',
      borderColor: 'hover:border-rose-500/50',
      iconColor: 'text-rose-400',
      label: '🔥 CRITICAL',
    },
    HIGH: {
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      textColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500/50',
      iconColor: 'text-amber-400',
      label: '🔥 HIGH',
    },
    MEDIUM: {
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      textColor: 'text-indigo-400',
      borderColor: 'hover:border-indigo-500/50',
      iconColor: 'text-indigo-400',
      label: '🟡 MEDIUM',
    },
    LOW: {
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      textColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/50',
      iconColor: 'text-emerald-400',
      label: '🟢 LOW',
    },
  };

  const currentHeat = heatConfig[cluster.heat] || heatConfig.MEDIUM;

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
        cluster.addressed
          ? 'bg-[#0E1117] border-emerald-500/20 opacity-70'
          : cluster.heat === 'CRITICAL' || cluster.heat === 'HIGH'
          ? 'bg-[#141820] border-2 border-amber-500/30'
          : 'bg-[#0E1117] border border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header & Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {cluster.addressed ? (
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ RESOLVED</span>
            </span>
          ) : (
            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border flex items-center gap-1.5 font-mono ${currentHeat.badgeBg}`}>
              <Flame className="w-3.5 h-3.5" />
              <span>{currentHeat.label}</span>
            </span>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            {cluster.trend === 'UP' && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
            {cluster.trend === 'DOWN' && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
            {cluster.trend === 'STABLE' && <Minus className="w-3.5 h-3.5 text-slate-500" />}
            <span>{cluster.trend}</span>
          </div>
        </div>

        {/* Conceptual Gap Label & Count */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
            CONCEPTUAL GAP
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight leading-tight mt-0.5">
            {cluster.label}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
            {cluster.description}
          </p>
        </div>

        {/* Metrics Bar */}
        <div className="bg-black/30 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xl font-extrabold text-white font-mono flex items-baseline gap-1.5">
              <span>{cluster.count}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">doubts</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-base font-bold font-mono ${currentHeat.textColor}`}>
              {cluster.percentage}%
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">of confusion</p>
          </div>
        </div>

        {/* Representative Student Doubts */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Representative Doubts
          </span>
          <div className="space-y-1.5">
            {cluster.representativeDoubts.slice(0, 2).map((doubtText, idx) => (
              <div
                key={idx}
                className="text-xs italic text-slate-300 bg-black/30 p-2.5 rounded-lg border border-slate-800 line-clamp-2"
              >
                "{doubtText}"
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800/80">
        <button
          onClick={() => onViewDetails(cluster)}
          className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-300 font-bold text-xs uppercase tracking-widest border border-slate-700 transition-all flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>SEMANTIC VIEW</span>
        </button>

        <button
          onClick={() => onToggleAddressed(cluster.id, cluster.addressed)}
          className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
            cluster.addressed
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{cluster.addressed ? 'REOPEN' : 'RESOLVE'}</span>
        </button>
      </div>
    </div>
  );
};
