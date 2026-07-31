import React from 'react';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './components/LandingPage.js';
import { SummaryMetrics } from './components/SummaryMetrics.js';
import { SimulationControls } from './components/SimulationControls.js';
import { HeatmapGrid } from './components/HeatmapGrid.js';
import { ActivityFeed } from './components/ActivityFeed.js';
import { TeacherInsightPanel } from './components/TeacherInsightPanel.js';
import { SemanticConnectionModal } from './components/SemanticConnectionModal.js';
import { ConfusionSnapshotModal } from './components/ConfusionSnapshotModal.js';
import { StudentView } from './components/StudentView.js';
import { CreateSessionModal } from './components/CreateSessionModal.js';
import { SessionFullData, Cluster } from './types.js';

export default function App() {
  const [currentView, setCurrentView] = React.useState<'landing' | 'teacher' | 'student'>('teacher');
  const [sessionId, setSessionId] = React.useState<string>('demo-session-bst');
  const [sessionData, setSessionData] = React.useState<SessionFullData | null>(null);
  const [selectedClusterId, setSelectedClusterId] = React.useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = React.useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = React.useState<boolean>(false);
  const [insightLoading, setInsightLoading] = React.useState<boolean>(false);

  // Fetch Session Data from API
  const fetchSession = React.useCallback(async (idToFetch: string) => {
    try {
      const res = await fetch(`/api/sessions/${idToFetch}`);
      if (res.ok) {
        const data: SessionFullData = await res.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error('Error fetching session data:', err);
    }
  }, []);

  // Poll for live updates every 1.5 seconds
  React.useEffect(() => {
    fetchSession(sessionId);
    const interval = setInterval(() => {
      fetchSession(sessionId);
    }, 1500);
    return () => clearInterval(interval);
  }, [sessionId, fetchSession]);

  // Simulation handlers
  const handleStartSimulation = async (fastMode = false) => {
    try {
      await fetch(`/api/sessions/${sessionId}/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fastMode }),
      });
      fetchSession(sessionId);
    } catch (err) {
      console.error('Failed to start simulation:', err);
    }
  };

  const handlePauseSimulation = async () => {
    try {
      await fetch(`/api/sessions/${sessionId}/simulation/pause`, {
        method: 'POST',
      });
      fetchSession(sessionId);
    } catch (err) {
      console.error('Failed to pause simulation:', err);
    }
  };

  const handleResetSimulation = async () => {
    try {
      await fetch(`/api/sessions/${sessionId}/simulation/reset`, {
        method: 'POST',
      });
      fetchSession(sessionId);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
  };

  const handleAddTestDoubt = async (text: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/doubts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Failed to add test doubt:', err.error);
        alert(err.error || 'Failed to add doubt.');
        return;
      }
      fetchSession(sessionId);
    } catch (err) {
      console.error('Failed to add test doubt:', err);
    }
  };

  const handleToggleAddressed = async (clusterId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/sessions/${sessionId}/clusters/${clusterId}/addressed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressed: !currentStatus }),
      });
      fetchSession(sessionId);
    } catch (err) {
      console.error('Failed to toggle addressed status:', err);
    }
  };

  const handleRefreshInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/insight`);
      if (res.ok) {
        const insightData = await res.json();
        setSessionData((prev) => (prev ? { ...prev, insight: insightData } : prev));
      }
    } catch (err) {
      console.error('Failed to refresh insight:', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleCreateSession = async (subject: string, lessonTitle: string, description: string) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, lessonTitle, description }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessionId(newSession.id);
        fetchSession(newSession.id);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleSubmitStudentDoubt = async (
    text: string,
    originalText?: string,
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
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/doubts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, originalText, analysis }),
      });
      if (res.ok) {
        fetchSession(sessionId);
        return true;
      }
      // Surface server validation errors (e.g. too long)
      const errBody = await res.json().catch(() => ({}));
      if (errBody?.error) console.error('Student submission rejected:', errBody.error);
    } catch (err) {
      console.error('Student submission error:', err);
    }
    return false;
  };

  const handleJoinRoom = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sessions/code/${code}`);
      if (res.ok) {
        const sess = await res.json();
        setSessionId(sess.id);
        fetchSession(sess.id);
        return true;
      }
    } catch (err) {
      console.error('Error joining room code:', err);
    }
    return false;
  };

  const session = sessionData?.session;
  const doubts = sessionData?.doubts || [];
  const clusters = sessionData?.clusters || [];
  const activities = sessionData?.activities || [];
  const insight = sessionData?.insight;
  const summary = sessionData?.summary;

  // Bug fix #10: derive the selected cluster from live data so the modal always has
  // fresh counts, addressed status, and doubtIds after each polling cycle.
  const selectedCluster: Cluster | null = React.useMemo(() => {
    if (!selectedClusterId) return null;
    return clusters.find((c) => c.id === selectedClusterId) ?? null;
  }, [selectedClusterId, clusters]);

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        roomCode={session?.code}
        lessonTitle={session?.lessonTitle}
        aiMode={session?.aiEngineMode}
        onOpenCreateSession={() => setShowCreateModal(true)}
        onOpenSummary={() => setShowSummaryModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onLaunchTeacher={() => setCurrentView('teacher')}
            onJoinStudent={() => setCurrentView('student')}
          />
        )}

        {currentView === 'student' && (
          <StudentView
            roomCode={session?.code || 'DM-4821'}
            lessonTitle={session?.lessonTitle || 'Binary Search Trees'}
            sessionId={sessionId}
            onSubmitDoubt={handleSubmitStudentDoubt}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {currentView === 'teacher' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
            {/* Top Summary Metrics Bar */}
            <SummaryMetrics
              totalDoubts={session?.doubtCount || 0}
              activeGapCount={session?.activeGapCount || 0}
              studentCount={session?.studentCount || 76}
              lastAnalysisTime={session?.lastAnalysisTime}
              aiMode={session?.aiEngineMode}
            />

            {/* Simulation Controller */}
            {session && (
              <SimulationControls
                simulation={session.simulation}
                onStart={handleStartSimulation}
                onPause={handlePauseSimulation}
                onReset={handleResetSimulation}
                onAddTestDoubt={handleAddTestDoubt}
              />
            )}

            {/* Dashboard Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Central Heatmap & Cluster Cards (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <HeatmapGrid
                  clusters={clusters}
                  onViewDetails={(c) => setSelectedClusterId(c.id)}
                  onToggleAddressed={handleToggleAddressed}
                />
              </div>

              {/* Right Column: AI Insight & Activity Feed (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <TeacherInsightPanel
                  insight={insight}
                  onRefreshInsight={handleRefreshInsight}
                  loading={insightLoading}
                />

                <ActivityFeed activities={activities} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedCluster && (
        <SemanticConnectionModal
          cluster={selectedCluster}
          doubts={doubts}
          onClose={() => setSelectedClusterId(null)}
          onToggleAddressed={handleToggleAddressed}
        />
      )}

      {showSummaryModal && (
        <ConfusionSnapshotModal
          summary={summary}
          clusters={clusters}
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreateSession={handleCreateSession}
        />
      )}
    </div>
  );
}
