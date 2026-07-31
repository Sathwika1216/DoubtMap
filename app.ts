import 'dotenv/config';
import express from 'express';
import { DEMO_DOUBTS_DATASET, DEMO_LESSON_INFO } from './src/data/demoDataset.js';
import { clusterDoubts, generateTeacherInsight } from './src/services/aiClustering.js';
import { analyzeDoubtTone } from './src/services/doubtTone.js';
import {
  Session,
  Doubt,
  Cluster,
  ActivityEvent,
  TeacherInsight,
  SessionFullData,
  SessionSummary,
} from './src/types.js';

const SIMULATION_TICK_MS = 1800;

export const app = express();

app.use(express.json());

interface SessionStore {
  session: Session;
  doubts: Doubt[];
  clusters: Cluster[];
  activities: ActivityEvent[];
  insight?: TeacherInsight;
  simulationIndex: number;
  isProcessingClustering: boolean;
  lastSimulationTick?: number;
}

const sessionMap = new Map<string, SessionStore>();

function createDefaultDemoSession(): SessionStore {
  const sessionId = 'demo-session-bst';
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
    aiEngineMode: 'FEATHERLESS_AI',
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
        message: 'DoubtMap AI Semantic Engine initialized and monitoring binary search tree classroom.',
        timestamp: new Date().toISOString(),
      },
    ],
    simulationIndex: 0,
    isProcessingClustering: false,
  };

  sessionMap.set(sessionId, store);
  return store;
}

createDefaultDemoSession();

function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DM-${num}`;
}

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

async function refreshSessionClustering(store: SessionStore) {
  if (store.doubts.length === 0) {
    store.clusters = [];
    store.session.activeGapCount = 0;
    return;
  }

  try {
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
  } catch (err) {
    console.error('refreshSessionClustering failed:', err);
  }
}

/** Advance live simulation when enough time has passed (works on serverless + local). */
export async function tickSimulations() {
  const now = Date.now();

  for (const store of sessionMap.values()) {
    const sim = store.session.simulation;
    if (!sim.isRunning || sim.isPaused) continue;

    if (store.lastSimulationTick && now - store.lastSimulationTick < SIMULATION_TICK_MS) {
      continue;
    }

    store.lastSimulationTick = now;

    if (store.simulationIndex < DEMO_DOUBTS_DATASET.length) {
      const batchSize = sim.isFastMode
        ? Math.min(8, DEMO_DOUBTS_DATASET.length - store.simulationIndex)
        : Math.min(2, DEMO_DOUBTS_DATASET.length - store.simulationIndex);

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

      if (!store.isProcessingClustering) {
        store.isProcessingClustering = true;
        refreshSessionClustering(store)
          .catch((err) => console.error('Simulation clustering error:', err))
          .finally(() => { store.isProcessingClustering = false; });
      }
    } else {
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
    aiEngineMode: 'FEATHERLESS_AI',
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
    isProcessingClustering: false,
  };

  sessionMap.set(id, store);
  res.json(session);
});

app.get('/api/sessions/:id', async (req, res) => {
  await tickSimulations();

  let store = sessionMap.get(req.params.id);
  if (!store && req.params.id === 'demo-session-bst') {
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
    avgProcessingTimeMs: store.session.aiEngineMode === 'FEATHERLESS_AI' ? 620 : 120,
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

app.post('/api/sessions/:id/doubts/analyze-tone', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { text } = req.body ?? {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Doubt text cannot be empty' });
    return;
  }

  const trimmed = text.trim();
  if (trimmed.length > 1000) {
    res.status(400).json({ error: 'Doubt text must be 1000 characters or fewer' });
    return;
  }

  try {
    const analysis = await analyzeDoubtTone(trimmed);
    res.json({ success: true, analysis });
  } catch (err) {
    console.warn('analyze-tone endpoint error:', err);
    res.json({ success: true, analysis: { analysis_available: false } });
  }
});

app.post('/api/sessions/:id/doubts', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { text, originalText, analysis } = req.body ?? {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Doubt text cannot be empty' });
    return;
  }

  const trimmed = text.trim();
  if (trimmed.length > 1000) {
    res.status(400).json({ error: 'Doubt text must be 1000 characters or fewer' });
    return;
  }

  const originalTrimmed = typeof originalText === 'string' ? originalText.trim() : trimmed;
  if (originalTrimmed.length > 1000) {
    res.status(400).json({ error: 'Original doubt text must be 1000 characters or fewer' });
    return;
  }

  const doubt: Doubt = {
    id: `d-std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sessionId: store.session.id,
    text: trimmed,
    timestamp: new Date().toISOString(),
    submittedByStudent: true,
    originalText: originalTrimmed,
    analysisAvailable: analysis?.analysis_available === true,
    tone: typeof analysis?.tone === 'string' ? analysis.tone : undefined,
    intent: typeof analysis?.intent === 'string' ? analysis.intent : undefined,
    underlyingDoubt: typeof analysis?.underlying_doubt === 'string' ? analysis.underlying_doubt : undefined,
    rephrasedDoubt: typeof analysis?.rephrased_doubt === 'string' ? analysis.rephrased_doubt : undefined,
    topic: typeof analysis?.topic === 'string' ? analysis.topic : undefined,
    confidence: typeof analysis?.confidence === 'number' ? analysis.confidence : undefined,
  };

  store.doubts.push(doubt);
  store.session.doubtCount = store.doubts.length;

  logActivity(store, 'DOUBT_RECEIVED', 'New anonymous student doubt received.', undefined, doubt.text);

  if (!store.isProcessingClustering) {
    store.isProcessingClustering = true;
    try {
      await refreshSessionClustering(store);
    } finally {
      store.isProcessingClustering = false;
    }
  }

  res.json({ success: true, doubt });
});

app.post('/api/sessions/:id/analyze', async (req, res) => {
  const store = sessionMap.get(req.params.id);
  if (!store) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await refreshSessionClustering(store);
  res.json({ success: true, clusters: store.clusters, mode: store.session.aiEngineMode });
});

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
  store.lastSimulationTick = undefined;

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
  store.isProcessingClustering = false;
  store.lastSimulationTick = undefined;
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
