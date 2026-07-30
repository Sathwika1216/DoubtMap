import React from 'react';
import { Activity, HelpCircle, Flame, CheckCircle2, Cpu } from 'lucide-react';
import { ActivityEvent } from '../types.js';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-[#0E1117] border border-slate-800 rounded-xl flex flex-col overflow-hidden h-full max-h-[420px] shadow-sm">
      <div className="p-3 border-b border-slate-800 bg-black/20 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
          Live Feed
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activities.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8">
            Waiting for live classroom activity...
          </div>
        ) : (
          activities.map((act) => {
            let barColor = 'bg-indigo-500';
            if (act.type === 'DOUBT_RECEIVED') {
              barColor = 'bg-amber-500';
            } else if (act.type === 'CLUSTER_UPDATED' || act.type === 'NEW_GAP_DETECTED') {
              barColor = 'bg-rose-500';
            } else if (act.type === 'CLUSTER_ADDRESSED') {
              barColor = 'bg-emerald-500';
            }

            const timeFormatted = new Date(act.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div key={act.id} className="flex gap-3 text-xs">
                <div className={`w-1 h-auto ${barColor} rounded-full shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{timeFormatted}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-tight mt-0.5">
                    {act.message}
                  </p>
                  {act.doubtText && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                      "{act.doubtText}"
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-black/20 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Semantic Engine Active
          </span>
        </div>
      </div>
    </div>
  );
};
