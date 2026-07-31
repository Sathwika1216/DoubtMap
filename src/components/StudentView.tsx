import React from 'react';
import { Send, CheckCircle2, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

interface StudentViewProps {
  roomCode: string;
  lessonTitle: string;
  onSubmitDoubt: (text: string) => Promise<boolean>;
  onJoinRoom: (code: string) => Promise<boolean>;
}

export const StudentView: React.FC<StudentViewProps> = ({
  roomCode,
  lessonTitle,
  onSubmitDoubt,
  onJoinRoom,
}) => {
  const [inputCode, setInputCode] = React.useState(roomCode || 'DM-4821');
  const [joined, setJoined] = React.useState(true);
  const [doubtText, setDoubtText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [joinError, setJoinError] = React.useState('');

  // Keep the input code in sync when the parent session changes
  React.useEffect(() => {
    if (roomCode) setInputCode(roomCode);
  }, [roomCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    const ok = await onJoinRoom(code);
    if (ok) {
      setJoined(true);
    } else {
      setJoinError(`Classroom code "${code}" not found. Please check the code and try again.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = doubtText.trim();
    if (!trimmed || submitting) return;

    // Client-side length guard (mirrors server validation)
    if (trimmed.length > 1000) {
      setSubmitError('Your question must be 1000 characters or fewer.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);
    const success = await onSubmitDoubt(trimmed);
    setSubmitting(false);

    if (success) {
      setSubmitted(true);
      setDoubtText('');
    } else {
      setSubmitError('Submission failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0A0D12] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>100% Anonymous Student Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight font-mono">
            Ask Anonymously
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your teacher sees the conceptual gap on their live heatmap, not your name.
          </p>
        </div>

        {/* Room Code Join Form if not joined */}
        {!joined ? (
          <div className="bg-[#0E1117] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest font-mono text-center">
              Enter Classroom Code
            </h3>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. DM-4821"
                className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-3 text-center text-lg font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase tracking-widest"
                maxLength={10}
              />
              {joinError && <p className="text-xs text-rose-400 text-center">{joinError}</p>}
              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Join Live Classroom
              </button>
            </form>
          </div>
        ) : (
          /* Main Doubt Submission Form */
          <div className="bg-[#0E1117] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
            {/* Session Info Bar */}
            <div className="bg-black/30 rounded-lg p-3 border border-slate-800 flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="font-semibold text-white line-clamp-1">{lessonTitle}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-amber-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                  {roomCode}
                </span>
                {/* Allow switching to a different classroom */}
                <button
                  onClick={() => { setJoined(false); setSubmitted(false); setSubmitError(''); }}
                  title="Change classroom code"
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Submission State Message */}
            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-emerald-400 text-base">✓ Question Received!</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your doubt has been mapped into the live conceptual cluster.
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 pt-2">
                  No teacher or peer can see your name. Ask another question anytime!
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors mt-2"
                >
                  Ask Another Doubt
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest block">
                    Type Your Question / Doubt:
                  </label>
                  <textarea
                    rows={4}
                    value={doubtText}
                    onChange={(e) => { setDoubtText(e.target.value); setSubmitError(''); }}
                    placeholder="e.g., Why can't heat flow from cold to hot spontaneously in a refrigerator without work?"
                    className="w-full bg-black/40 border border-slate-700 rounded-lg p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
                    maxLength={1000}
                    required
                  />
                  <div className="flex justify-between items-center text-[10px]">
                    {submitError ? (
                      <p className="text-rose-400">{submitError}</p>
                    ) : (
                      <span />
                    )}
                    <span className={`font-mono ml-auto ${doubtText.length > 900 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {doubtText.length}/1000
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-black/30 p-3 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Your query will be semantically grouped with similar questions. No user identity is recorded.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !doubtText.trim()}
                  className="w-full py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Anonymously'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          DoubtMap Anonymous Classroom Intelligence
        </div>
      </div>
    </div>
  );
};
