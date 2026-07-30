import React from 'react';
import { Radio, Users, Sparkles, ArrowRight, ShieldCheck, Flame, Layers, CheckCircle2, Zap } from 'lucide-react';

interface LandingPageProps {
  onLaunchTeacher: () => void;
  onJoinStudent: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchTeacher, onJoinStudent }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 flex flex-col justify-between p-6 lg:p-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto w-full space-y-12 my-auto relative z-10">
        {/* Top Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered Real-Time Classroom Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-mono leading-tight">
            SEE WHERE YOUR CLASS IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-400">CONFUSED.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            DoubtMap turns anonymous student doubts into live conceptual gaps — so teachers can fix confusion before it becomes a failed exam.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchTeacher}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <Radio className="w-4 h-4 text-indigo-200" />
              <span>LAUNCH TEACHER DASHBOARD</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onJoinStudent}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 hover:border-slate-600 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-rose-400" />
              <span>JOIN AS STUDENT</span>
            </button>
          </div>
        </div>

        {/* Visual Pipeline Animation Diagram */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">
              THE DOUBTMAP ARCHITECTURE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center text-center relative group hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-rose-400 font-bold mb-3 shadow-inner">
                100+
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">RAW STUDENT DOUBTS</h3>
              <p className="text-xs text-slate-400">
                Students ask anonymously in natural, unstructured free text without fear.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center text-center relative group hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">AI SEMANTIC ANALYSIS</h3>
              <p className="text-xs text-slate-400">
                Gemini 3.6 Flash understands meaning beyond exact keywords.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center text-center relative group hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">3–5 CONCEPTUAL GAPS</h3>
              <p className="text-xs text-slate-400">
                Grouped into high-density heat clusters with real-time percentages.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center text-center relative group hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">TEACHER ACTION</h3>
              <p className="text-xs text-slate-400">
                Targeted lecture adjustment & instant resolution tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Anonymous For Students</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              No student identity is ever exposed to teachers or peers. Eliminates hesitation, social anxiety, and silent confusion.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Layers className="w-4 h-4" />
              <span>Semantic Connection Engine</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recognizes that "Why can't entropy decrease?" and "Why is an irreversible process one-way?" share the exact same conceptual gap.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Zap className="w-4 h-4" />
              <span>Live Simulation & Decision Support</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Includes a 100-doubt thermodynamics test dataset for instant hackathon demonstration, complete with live stream controls.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full pt-8 text-center text-xs text-slate-500 border-t border-slate-900 mt-12">
        <p>DoubtMap — AI-Powered Live Classroom Intelligence System • Built with Gemini 3.6 Flash</p>
      </div>
    </div>
  );
};
