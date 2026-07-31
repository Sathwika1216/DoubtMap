import React from 'react';
import { Send, CheckCircle2, ShieldCheck, Lock, ArrowLeft, Sparkles, MessageCircleHeart } from 'lucide-react';
import { shouldOfferRephrase } from '../services/doubtTone.js';
import type { DoubtToneResult } from '../types.js';

interface StudentViewProps {
  roomCode: string;
  lessonTitle: string;
  sessionId?: string;
  onSubmitDoubt: (
    text: string,
    analysis?: {
      analysis_available?: boolean;
      tone?: string;
      intent?: string;
      is_genuine_doubt?: boolean;
      underlying_doubt?: string;
      rephrased_doubt?: string;
      topic?: string;
      confidence?: number;
    }
  ) => Promise<boolean>;
  onJoinRoom: (code: string) => Promise<boolean>;
}

export const StudentView: React.FC<StudentViewProps> = ({
  roomCode,
  lessonTitle,
  sessionId,
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
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<DoubtToneResult | null>(null);
  const [pendingSubmitText, setPendingSubmitText] = React.useState('');

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

  const analyzeTone = async (trimmed: string) => {
    if (!sessionId) return null;

    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/doubts/analyze-tone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        return null;
      }

      const payload = await res.json().catch(() => ({ success: false, analysis: { analysis_available: false } }));
      const result = payload?.analysis as DoubtToneResult | undefined;
      return result ?? null;
    } catch (err) {
      console.warn('Failed to analyze doubt tone:', err);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const submitDoubt = async (submitText: string, analysis?: DoubtToneResult) => {
    setSubmitting(true);
    const success = await onSubmitDoubt(submitText, analysis?.analysis_available ? analysis : undefined);
    setSubmitting(false);

    if (success) {
      setSubmitted(true);
      setDoubtText('');
      setAnalysisResult(null);
      setPendingSubmitText('');
    } else {
      setSubmitError('Submission failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = doubtText.trim();
    if (!trimmed || submitting) return;

    if (trimmed.length > 1000) {
      setSubmitError('Your question must be 1000 characters or fewer.');
      return;
    }

    setSubmitError('');
    setPendingSubmitText(trimmed);
    setSubmitting(true);
    const analysis = await analyzeTone(trimmed);

    if (analysis?.analysis_available && shouldOfferRephrase(analysis)) {
      setAnalysisResult(analysis);
      setSubmitting(false);
      return;
    }

    await submitDoubt(trimmed, analysis);
  };

  const handleRephraseChoice = async (useImproved: boolean) => {
    if (!analysisResult?.analysis_available || !pendingSubmitText) return;
    const choiceText = useImproved ? analysisResult.rephrased_doubt : pendingSubmitText;
    await submitDoubt(choiceText, analysisResult);
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

                {analyzing && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>✨ Understanding your doubt...</span>
                  </div>
                )}

                {analysisResult?.analysis_available && shouldOfferRephrase(analysisResult) && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 text-left">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                      <MessageCircleHeart className="w-4 h-4" />
                      <span>Make your doubt clearer?</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-300">Detected: <span className="font-semibold text-amber-200">{analysisResult.tone}</span></p>
                      <p className="text-[11px] text-slate-300">AI-rephrased doubt:</p>
                      <blockquote className="text-sm text-white border-l-2 border-amber-400 pl-3 italic">
                        {analysisResult.rephrased_doubt}
                      </blockquote>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => handleRephraseChoice(true)}
                        className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] uppercase tracking-widest py-2.5"
                      >
                        Use Improved Version
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRephraseChoice(false)}
                        className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] uppercase tracking-widest py-2.5"
                      >
                        Keep Original
                      </button>
                    </div>
                  </div>
                )}

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
