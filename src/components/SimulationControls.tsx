import React from 'react';
import { Play, Pause, RotateCcw, Zap, Plus, Cpu, CheckCircle2 } from 'lucide-react';
import { SimulationState } from '../types.js';

interface SimulationControlsProps {
  simulation: SimulationState;
  onStart: (fastMode?: boolean) => void;
  onPause: () => void;
  onReset: () => void;
  onAddTestDoubt: (text: string) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulation,
  onStart,
  onPause,
  onReset,
  onAddTestDoubt,
}) => {
  const [customDoubt, setCustomDoubt] = React.useState('');
  const [showInput, setShowInput] = React.useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDoubt.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      alert('Doubt text must be 1000 characters or fewer.');
      return;
    }
    onAddTestDoubt(trimmed);
    setCustomDoubt('');
    setShowInput(false);
  };

  const percentComplete = Math.min(
    100,
    Math.round((simulation.releasedCount / (simulation.totalDemoDoubts || 100)) * 100)
  );

  // Bug fix #5: track whether simulation has finished all doubts
  const isComplete =
    !simulation.isRunning &&
    simulation.totalDemoDoubts > 0 &&
    simulation.releasedCount >= simulation.totalDemoDoubts;

  // Bug fix #6: disable Fast Demo while already running in fast mode to prevent double-start
  const isFastRunning = simulation.isRunning && simulation.isFastMode;

  const statusLabel = simulation.isRunning
    ? simulation.isPaused
      ? 'SIMULATION PAUSED'
      : simulation.isFastMode
      ? 'FAST DEMO STREAMING (5X SPEED)'
      : 'LIVE CLASSROOM STREAM ACTIVE'
    : isComplete
    ? 'SIMULATION COMPLETE — ALL DOUBTS ANALYZED'
    : 'READY TO START DEMO';

  return (
    <div className="bg-[#0E1117] border border-slate-800 rounded-xl p-4 lg:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Status & AI Processor Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isComplete
                  ? 'bg-emerald-400'
                  : simulation.isRunning && !simulation.isPaused
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            ></div>
            {simulation.isRunning && !simulation.isPaused && (
              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white font-mono tracking-tight">
                {statusLabel}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {isComplete ? '✓ DONE' : '● LIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Streaming binary search tree doubts into Featherless semantic clustering pipeline.
            </p>
          </div>
        </div>

        {/* Right Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bug fix #5: show Start/Pause/Resume appropriately; complete state shows no Pause */}
          {isComplete ? (
            // Simulation finished — only Reset makes sense
            null
          ) : !simulation.isRunning ? (
            <button
              onClick={() => onStart(false)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START LIVE DEMO</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              {simulation.isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME STREAM</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE STREAM</span>
                </>
              )}
            </button>
          )}

          {/* Bug fix #6: Fast Demo disabled while already running in fast mode */}
          <button
            onClick={() => onStart(true)}
            disabled={isFastRunning}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isFastRunning
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50'
            }`}
            title={isFastRunning ? 'Fast mode already running' : 'Run full 100 doubts demonstration in fast mode'}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>FAST DEMO</span>
          </button>

          <button
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Reset session back to 0 doubts"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>RESET</span>
          </button>

          <button
            onClick={() => setShowInput(!showInput)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>TEST DOUBT</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Progress: <span className="text-white font-bold">{simulation.releasedCount}</span> / {simulation.totalDemoDoubts} doubts released
          </span>
          <span className="flex items-center gap-1">
            {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {percentComplete}% Analyzed
          </span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isComplete
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 via-amber-400 to-rose-500'
            }`}
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>

      {/* Custom Test Doubt Input Form */}
      {showInput && (
        <form onSubmit={handleAddSubmit} className="pt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={customDoubt}
              onChange={(e) => setCustomDoubt(e.target.value)}
              maxLength={1000}
              placeholder="Type a test doubt (e.g. 'Why is deleting a node with two children so complicated?')..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customDoubt.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              Inject Doubt
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-mono text-right">
            {customDoubt.length}/1000 characters
          </p>
        </form>
      )}
    </div>
  );
};
