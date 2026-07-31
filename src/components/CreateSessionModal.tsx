import React from 'react';
import { X, Sparkles, Plus, BookOpen } from 'lucide-react';

interface CreateSessionModalProps {
  onClose: () => void;
  onCreateSession: (subject: string, lessonTitle: string, description: string) => Promise<void>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  onClose,
  onCreateSession,
}) => {
  const [subject, setSubject] = React.useState('Physics');
  const [lessonTitle, setLessonTitle] = React.useState('Binary Search Trees');
  const [description, setDescription] = React.useState('BST structure, search/insert/delete operations, traversals, complexity, and balancing');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || loading) return;

    setLoading(true);
    await onCreateSession(subject.trim(), lessonTitle.trim(), description.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[#0E1117] border border-slate-800 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEW CLASSROOM SESSION</span>
          </div>
          <h2 className="text-2xl font-light text-white tracking-tight font-mono">
            Create Live Session
          </h2>
          <p className="text-xs text-slate-400">
            Generates a unique classroom code for students to submit anonymous doubts.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest block">Subject Name</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Thermodynamics / Physics / Organic Chemistry"
              className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest block">Lesson Title</label>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g. Entropy and the Second Law"
              className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest block">Optional Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key concepts covered in today's lecture..."
              className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Start Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
