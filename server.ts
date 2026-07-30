import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DEMO_DOUBTS_DATASET, DEMO_LESSON_INFO } from './src/data/demoDataset.js';
import { clusterDoubts, generateTeacherInsight } from './src/services/aiClustering.js';
import {
  Session,
  Doubt,
  Cluster,
  ActivityEvent,
  TeacherInsight,
  SessionFullData,
  SessionSummary,
} from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Store
interface SessionStore {
  session: Session;
  doubts: Doubt[];
  clusters: Cluster[];
  activities: ActivityEvent[];
  insight?: TeacherInsight;
  simulationIndex: number;
}

const sessionMap = new Map<string, SessionStore>();

// Create initial default demo session
function createDefaultDemoSession(): SessionStore {
  const sessionId = 'demo-session-entropy';
  const defaultSession: Session = {
    id: sessionId,
    code: 'DM-4821',
    subject: DEMO_LESSON_INFO.subject,
    lessonTitle: DEMO_LESSON_INFO.lessonTitle,
    description: DEMO_LESSON_INFO.description,
    createdAt: new Date().toISOString(),
    active: true,
    doubtCount: 0,
    activeGapCount: 0,
    studentCount: 76,
    lastAnalysisTime: new Date().toISOString(),
    aiEngineMode: 'GEMINI_AI',
    simulation: {
      isRunning: false,
      isPaused: false,
      isFastMode: false,
      speedMultiplier: 1,
      releasedCount: 0,
      totalDemoDoubts: DEMO_DOUBTS_DATASET.length,
    },
  };

  const store: SessionStore = {
    session: defaultSession,
    doubts: [],
    clusters: [],
    activities: [
      {
        id: 'act-init',
        sessionId,
        type: 'AI_ANALYSIS_RUN',
        message: 'DoubtMap AI Semantic Engine initialized and monitoring thermodynamics classroom.',
        timestamp: new Date().toISOString(),
      },
    ],
    simulationIndex: 0,
  };

  sessionMap.set(sessionId, store);
  return store;
}

// Initialize default session
createDefaultDemoSession();

// Generate random classroom code like DM-8392
function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DM-${num}`;
}

// Add activity log event helper
function logActivity(
  store: SessionStore,
  type: ActivityEvent['type'],
  message: string,
  clusterId?: string,
  doubtText?: string
) {
  const event: ActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sessionId: store.session.id,
    type,
    message,
    timestamp: new Date().toISOString(),
    clusterId,
    doubtText,
  };
  store.activities.unshift(event);
  if (store.activities.length > 40) {
    store.activities.pop();
  }
}

// Re-cluster doubts for a session
async function refreshSessionClustering(store: SessionStore) {
  if (store.doubts.length === 0) {
    store.clusters = [];
    store.session.activeGapCount = 0;
    return;
  }

  const { clusters, mode } = await clusterDoubts(
    store.doubts,
    store.session.id,
    store.clusters
  );

  store.clusters = clusters;
  store.session.aiEngineMode = mode;
  store.session.lastAnalysisTime = new Date().toISOString();
  store.session.activeGapCount = clusters.filter((c) => !c.addressed).length;

  logActivity(
    store,
    'CLUSTER_UPDATED',
    `AI analyzed ${store.doubts.length} doubts into ${clusters.length} conceptual gap${clusters.length === 1 ? '' : 's'}.`
  );
}

// Server API Routes

// 1. Create a Session
app.post('/api/sessions', async (req, res) => {
  const { subject, lessonTitle, description } = req.body;
  const id = `sess-${Date.now()}`;
  const code = generateRoomCode();

  const session: Session = {
    id,
    code,
    subject: subject || 'Physics',
    lessonTitle: lessonTitle || 'Untitled Lesson',
    description: description || '',
    createdAt: new Date().toISOString(),
    active: true,
    doubtCount: 0,
    activeGapCount: 0,
    studentCount: Math.floor(25 + Math.random() * 50),
    aiEngineMode: 'GEMINI_AI',
    simulation: {
      isRunning: false,
      isPaused: false,
      isFastMode: false,
      speedMultiplier: 1,
      releasedCount: 0,
      totalDemoDoubts: DEMO_DOUBTS_DATASET.length,
    },
  };

  const store: SessionStore = {
    session,
    doubts: [],
    clusters: [],
    activities: [
      {
        id: `act-${Date.now()}`,
        sessionId: id,
        type: 'AI_ANALYSIS_RUN',
        message: `Session "${lessonTitle}" created with code ${code}.`,
        timestamp: new Date().toISOString(),
      },
    ],
    simulationIndex: 0,
  };

  sessionMap.set(id, store);
  res.json(session);
});

// 2. Get Session Full Data
app.get('/api/sessions/:id', (req, res) => {
  let store = sessionMap.get(req.params.id);
  if (!store && req.params.id === 'demo-session-entropy') {
    store = createDefaultDemoSession();
  }

  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const activeClusters = store.clusters.filter((c) => !c.addressed);
  const addressedClusters = store.clusters.filter((c) => c.addressed);
  const topCluster = activeClusters[0] || store.clusters[0];

  const summary: SessionSummary = {
    totalDoubts: store.doubts.length,
    totalGaps: store.clusters.length,
    addressedGapsCount: addressedClusters.length,
    topGapLabel: topCluster ? topCluster.label : 'None',
    topGapDoubtCount: topCluster ? topCluster.count : 0,
    fastestGrowingGap: topCluster ? topCluster.label : 'None',
    avgProcessingTimeMs: store.session.aiEngineMode === 'GEMINI_AI' ? 620 : 120,
  };

  const responseData: SessionFullData = {
    session: store.session,
    doubts: store.doubts,
    clusters: store.clusters,
    activities: store.activities,
    insight: store.insight,
    summary,
  };

  res.json(responseData);
});

// 3. Lookup Session by Code (for student joining)
app.get('/api/sessions/code/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  for (const store of sessionMap.values()) {
    if (store.session.code.toUpperCase() === code) {
      res.json(store.session);
      return;
    }
  }
  res.status(404).json({ error: 'Classroom code not found' });
});

// 4. Submit Doubt
app.post('/api/sessions/:id/doubts', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Doubt text cannot be empty' });
    return;
  }

  const doubt: Doubt = {
    id: `d-std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sessionId: store.session.id,
    text: text.trim(),
    timestamp: new Date().toISOString(),
    submittedByStudent: true,
  };

  store.doubts.push(doubt);
  store.session.doubtCount = store.doubts.length;

  logActivity(store, 'DOUBT_RECEIVED', 'New anonymous student doubt received.', undefined, doubt.text);

  // Trigger clustering update
  await refreshSessionClustering(store);

  res.json({ success: true, doubt });
});

// 5. Force Re-analyze AI Clusters
app.post('/api/sessions/:id/analyze', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await refreshSessionClustering(store);
  res.json({ success: true, clusters: store.clusters, mode: store.session.aiEngineMode });
});

// 6. Mark Cluster as Addressed / Unaddressed
app.post('/api/sessions/:id/clusters/:clusterId/addressed', (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { clusterId } = req.params;
  const { addressed } = req.body;

  const cluster = store.clusters.find((c) => c.id === clusterId);
  if (cluster) {
    cluster.addressed = addressed !== undefined ? addressed : true;
    cluster.addressedAt = cluster.addressed ? new Date().toISOString() : undefined;

    store.session.activeGapCount = store.clusters.filter((c) => !c.addressed).length;

    logActivity(
      store,
      'CLUSTER_ADDRESSED',
      cluster.addressed
        ? `Teacher addressed conceptual gap: "${cluster.label}".`
        : `Reopened conceptual gap: "${cluster.label}".`,
      cluster.id
    );

    res.json({ success: true, cluster });
    return;
  }

  res.status(404).json({ error: 'Cluster not found' });
});

// 7. Get AI Teacher Insight
app.get('/api/sessions/:id/insight', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const insightData = await generateTeacherInsight(
    store.session.lessonTitle,
    store.clusters,
    store.doubts.length
  );

  store.insight = {
    ...insightData,
    generatedAt: new Date().toISOString(),
  };

  res.json(store.insight);
});

// 8. Simulation Controls (Start, Pause, Reset, Fast Mode)
app.post('/api/sessions/:id/simulation/start', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { fastMode } = req.body;

  store.session.simulation.isRunning = true;
  store.session.simulation.isPaused = false;
  store.session.simulation.isFastMode = !!fastMode;
  store.session.simulation.speedMultiplier = fastMode ? 5 : 1;

  logActivity(
    store,
    'AI_ANALYSIS_RUN',
    fastMode
      ? '🚀 Started Live Demo in FAST MODE (accelerated streaming).'
      : '▶️ Started Live Classroom Simulation stream.'
  );

  res.json(store.session.simulation);
});

app.post('/api/sessions/:id/simulation/pause', (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  store.session.simulation.isPaused = !store.session.simulation.isPaused;
  logActivity(
    store,
    'AI_ANALYSIS_RUN',
    store.session.simulation.isPaused ? '⏸️ Simulation stream paused.' : '▶️ Simulation stream resumed.'
  );

  res.json(store.session.simulation);
});

app.post('/api/sessions/:id/simulation/reset', (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  store.doubts = [];
  store.clusters = [];
  store.simulationIndex = 0;
  store.session.doubtCount = 0;
  store.session.activeGapCount = 0;
  store.session.simulation = {
    isRunning: false,
    isPaused: false,
    isFastMode: false,
    speedMultiplier: 1,
    releasedCount: 0,
    totalDemoDoubts: DEMO_DOUBTS_DATASET.length,
  };

  logActivity(store, 'AI_ANALYSIS_RUN', '🔄 Classroom session and doubts reset.');
  res.json(store.session.simulation);
});

// Server-side loop for live simulation progression
setInterval(async () => {
  for (const store of sessionMap.values()) {
    const sim = store.session.simulation;
    if (sim.isRunning && !sim.isPaused) {
      if (store.simulationIndex < DEMO_DOUBTS_DATASET.length) {
        // Release 1-3 doubts in normal mode, or 4-8 doubts in fast mode
        const batchSize = sim.isFastMode ? Math.min(8, DEMO_DOUBTS_DATASET.length - store.simulationIndex) : Math.min(2, DEMO_DOUBTS_DATASET.length - store.simulationIndex);

        const newBatch = DEMO_DOUBTS_DATASET.slice(
          store.simulationIndex,
          store.simulationIndex + batchSize
        );

        for (const item of newBatch) {
          store.doubts.push({
            id: `${item.id}-${Date.now()}`,
            sessionId: store.session.id,
            text: item.text,
            timestamp: new Date().toISOString(),
            hiddenCategory: item.hiddenCategory,
          });
        }

        store.simulationIndex += batchSize;
        store.session.doubtCount = store.doubts.length;
        sim.releasedCount = store.simulationIndex;
        sim.lastReleasedTime = new Date().toISOString();

        logActivity(
          store,
          'DOUBT_RECEIVED',
          `Batch of ${newBatch.length} anonymous doubt${newBatch.length > 1 ? 's' : ''} received.`,
          undefined,
          newBatch[0]?.text
        );

        // Run clustering update
        await refreshSessionClustering(store);
      } else {
        // Simulation complete
        sim.isRunning = false;
        sim.isPaused = false;
        logActivity(
          store,
          'AI_ANALYSIS_RUN',
          '✅ Simulation complete! All 100 student doubts streamed and semantically clustered.'
        );
      }
    }
  }
}, 1800);

// Setup Vite / Static Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DoubtMap server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
