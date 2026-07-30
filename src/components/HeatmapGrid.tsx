import React from 'react';
import { ClusterCard } from './ClusterCard.js';
import { Cluster } from '../types.js';
import { Flame, CheckCircle, HelpCircle } from 'lucide-react';

interface HeatmapGridProps {
  clusters: Cluster[];
  onViewDetails: (cluster: Cluster) => void;
  onToggleAddressed: (clusterId: string, currentStatus: boolean) => void;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  clusters,
  onViewDetails,
  onToggleAddressed,
}) => {
  const activeClusters = clusters.filter((c) => !c.addressed);
  const addressedClusters = clusters.filter((c) => c.addressed);

  if (clusters.length === 0) {
    return (
      <div className="bg-[#0E1117] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white">No Doubts Received Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Click "START LIVE DEMO" above to release realistic student questions, or join as a student to submit doubts anonymously.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Conceptual Gaps Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono">
              DETECTED CONCEPTUAL GAPS ({activeClusters.length})
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Sorted by heat and student doubt density
          </span>
        </div>

        {activeClusters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeClusters.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                onViewDetails={onViewDetails}
                onToggleAddressed={onToggleAddressed}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#0E1117] border border-emerald-500/20 rounded-xl p-8 text-center text-emerald-400 space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="font-bold text-sm">All conceptual gaps addressed by teacher!</p>
            <p className="text-xs text-slate-400">Great job clearing up the classroom confusion.</p>
          </div>
        )}
      </div>

      {/* Addressed Conceptual Gaps Section */}
      {addressedClusters.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono">
              RESOLVED GAPS ({addressedClusters.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addressedClusters.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                onViewDetails={onViewDetails}
                onToggleAddressed={onToggleAddressed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
