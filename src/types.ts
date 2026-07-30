export type HeatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TrendDirection = 'UP' | 'STABLE' | 'DOWN';

export interface Doubt {
  id: string;
  sessionId: string;
  text: string;
  timestamp: string;
  hiddenCategory?: string;
  clusterId?: string;
  submittedByStudent?: boolean;
}

export interface Cluster {
  id: string;
  sessionId: string;
  label: string;
  description: string;
  doubtIds: string[];
  count: number;
  percentage: number;
  heat: HeatLevel;
  heatScore: number; // 0 - 100
  trend: TrendDirection;
  addressed: boolean;
  addressedAt?: string;
  representativeDoubts: string[];
  semanticExplanation: string;
  categoryKey?: string;
}

export interface ActivityEvent {
  id: string;
  sessionId: string;
  type: 'DOUBT_RECEIVED' | 'CLUSTER_UPDATED' | 'NEW_GAP_DETECTED' | 'CLUSTER_ADDRESSED' | 'AI_ANALYSIS_RUN';
  message: string;
  timestamp: string;
  clusterId?: string;
  doubtText?: string;
}

export interface TeacherInsight {
  summary: string;
  actionableAdvice: string;
  topConfusions: string[];
  generatedAt: string;
}

export interface SessionSummary {
  totalDoubts: number;
  totalGaps: number;
  addressedGapsCount: number;
  topGapLabel: string;
  topGapDoubtCount: number;
  fastestGrowingGap: string;
  avgProcessingTimeMs: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isFastMode: boolean;
  speedMultiplier: number; // 1x, 2x, 5x
  releasedCount: number;
  totalDemoDoubts: number;
  lastReleasedTime?: string;
}

export interface Session {
  id: string;
  code: string;
  subject: string;
  lessonTitle: string;
  description?: string;
  createdAt: string;
  active: boolean;
  doubtCount: number;
  activeGapCount: number;
  studentCount: number;
  lastAnalysisTime?: string;
  aiEngineMode: 'GEMINI_AI' | 'STANDBY_HYBRID';
  simulation: SimulationState;
  insight?: TeacherInsight;
}

export interface SessionFullData {
  session: Session;
  doubts: Doubt[];
  clusters: Cluster[];
  activities: ActivityEvent[];
  insight?: TeacherInsight;
  summary?: SessionSummary;
}
