import React from 'react';
import { Sparkles, Radio, Users, Copy, Check, Plus, Home, UserCheck, Flame } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'teacher' | 'student';
  onViewChange: (view: 'landing' | 'teacher' | 'student') => void;
  roomCode?: string;
  lessonTitle?: string;
  aiMode?: 'FEATHERLESS_AI' | 'STANDBY_HYBRID';
  onOpenCreateSession: () => void;
  onOpenSummary: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  roomCode = 'DM-4821',
  lessonTitle = 'Binary Search Trees',
  aiMode = 'FEATHERLESS_AI',
  onOpenCreateSession,
  onOpenSummary,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {
      // Fallback for environments where clipboard API is restricted
      const el = document.createElement('textarea');
      el.value = roomCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">DOUBTMAP</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline-block">
                  AI CLASSROOM INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Turn 100 silent doubts into 4 things a teacher can fix.
              </p>
            </div>
          </button>
        </div>

        {/* Center Session Badge (if in Teacher view) */}
        {currentView === 'teacher' && (
          <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">{lessonTitle}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 font-mono bg-slate-800/80 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20">
              <span>Code: {roomCode}</span>
              <button
                onClick={copyCode}
                title="Copy Classroom Code"
                className="hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {/* Bug fix #11: updated model label */}
              <span>{aiMode === 'FEATHERLESS_AI' ? 'Featherless DeepSeek-V3.2' : 'Standby Engine'}</span>
            </div>
          </div>
        )}

        {/* View Switchers & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => onViewChange('landing')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                currentView === 'landing'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              onClick={() => onViewChange('teacher')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                currentView === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Teacher Dashboard</span>
            </button>

            <button
              onClick={() => onViewChange('student')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                currentView === 'student'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student View</span>
            </button>
          </div>

          {currentView === 'teacher' && (
            <>
              <button
                onClick={onOpenSummary}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Summary</span>
              </button>

              <button
                onClick={onOpenCreateSession}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
