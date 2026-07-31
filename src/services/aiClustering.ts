import { Doubt, Cluster, HeatLevel, TrendDirection } from '../types.js';
import { featherlessChatJson, getFeatherlessApiKey } from './featherless.js';

// Category metadata for local fallback clustering
const CATEGORY_MAP: Record<string, { label: string; description: string; explanation: string }> = {
  definition_rules: {
    label: 'BST Definition & Ordering Rules',
    description: 'Confusion about what property distinguishes a BST from a generic binary tree and how the ordering constraint applies globally.',
    explanation: 'Students often think only the immediate parent-child relationship matters, missing that the ordering rule must hold for the entire subtree. Different phrasings—asking about duplicates, string keys, or single-node trees—share this same core gap.',
  },
  search_operation: {
    label: 'Search & Comparison Logic',
    description: 'Uncertainty about how search navigates the tree and under what conditions it achieves O(log n) performance.',
    explanation: 'Whether students ask "how do we pick left or right?" or "why is this faster than a scan?", the gap is the same: they have not connected the BST ordering property to the binary elimination of half the remaining keys at each step.',
  },
  insertion: {
    label: 'Insertion & Tree Shape',
    description: 'Difficulty understanding where new nodes land and how insertion order determines the tree\'s shape and future performance.',
    explanation: 'Questions about where a node goes, how to trace the path, and why sorted insertion degrades the tree all reduce to one idea: insertion follows the search path and always places the new key at a leaf position.',
  },
  deletion: {
    label: 'Deletion Cases & In-Order Successor',
    description: 'The three-case deletion algorithm is the most complex BST operation; students struggle with the two-child case and the role of the in-order successor.',
    explanation: 'Whether phrased as "why three cases?", "what is the in-order successor?", or "can I use the predecessor instead?", all these doubts stem from not seeing deletion as a search-then-replace operation that must preserve the BST property.',
  },
  complexity_height: {
    label: 'Time Complexity & Tree Height',
    description: 'Misunderstanding why BST complexity is O(h), not O(log n), and how input ordering produces worst-case degeneration.',
    explanation: 'Students conflate the average case with the guaranteed case. The central gap is that h can range from log n to n, making the worst-case a linked list—a consequence of insertion order, not the algorithm.',
  },
  traversal: {
    label: 'Traversal Orders & Sorted Output',
    description: 'Confusion about the three DFS traversal orders and why in-order specifically produces sorted output.',
    explanation: 'Pre-order, in-order, and post-order look nearly identical in code; students who cannot explain why in-order gives a sorted sequence have not internalized the BST property as an invariant that traversal exploits.',
  },
  balancing_degeneration: {
    label: 'Balancing, Rotations & Degeneration',
    description: 'Uncertainty about what a balanced BST is, why a plain BST can degenerate, and how AVL/red-black trees use rotations to prevent it.',
    explanation: 'Questions about AVL vs red-black, what rotations are, and why sorted inserts break a BST all connect to one idea: without automatic rebalancing, the ordering guarantee alone cannot bound height, so self-balancing trees pay a small rotation cost to guarantee O(log n) in the worst case.',
  },
};

// Bug fix #4: Generate a stable cluster ID from the label so IDs survive re-clustering
// across polling cycles. Without this, every re-cluster emits new index-based IDs that
// break any in-flight "mark addressed" API call referencing the old ID.
function stableClusterId(label: string, sessionId: string): string {
  let hash = 5381;
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) + hash) + label.charCodeAt(i);
    hash |= 0; // coerce to 32-bit int
  }
  return `c-ai-${Math.abs(hash).toString(36)}-${sessionId.slice(0, 4)}`;
}

function buildSemanticExplanation(parts: {
  explanation?: string;
  misconceptions?: string;
  keyConcepts?: string;
  nextTopic?: string;
  fallback?: string;
}): string {
  const explanation = (parts.explanation || parts.fallback || '').trim();
  const misconceptions = (parts.misconceptions || '').trim();
  const keyConcepts = (parts.keyConcepts || '').trim();
  const nextTopic = (parts.nextTopic || '').trim();

  const sections: string[] = [];
  if (explanation) sections.push(explanation);
  if (misconceptions) sections.push(`Common misconceptions: ${misconceptions}`);
  if (keyConcepts) sections.push(`Key concepts to study: ${keyConcepts}`);
  if (nextTopic) sections.push(`Suggested next topic: ${nextTopic}`);

  return sections.join('\n\n') || 'Related student doubts share a common conceptual gap.';
}

interface AiClusterPayload {
  clusters?: Array<{
    label?: string;
    description?: string;
    doubtIds?: string[];
    representativeDoubts?: string[];
    semanticExplanation?: string;
    explanation?: string;
    misconceptions?: string;
    keyConcepts?: string;
    nextTopic?: string;
    heat?: string;
    trend?: string;
  }>;
}

export async function clusterDoubts(
  doubts: Doubt[],
  sessionId: string,
  previousClusters: Cluster[] = []
): Promise<{ clusters: Cluster[]; mode: 'FEATHERLESS_AI' | 'STANDBY_HYBRID' }> {
  if (doubts.length === 0) {
    return { clusters: [], mode: 'FEATHERLESS_AI' };
  }

  // Handle Low Data state (< 6 doubts)
  if (doubts.length < 6) {
    const lowDataCluster: Cluster = {
      id: `c-pending-${sessionId}`,
      sessionId,
      label: 'Collecting Classroom Doubts...',
      description: `Received ${doubts.length} doubt${doubts.length === 1 ? '' : 's'}. Need at least 6 doubts to form distinct conceptual gaps.`,
      doubtIds: doubts.map((d) => d.id),
      count: doubts.length,
      percentage: 100,
      heat: 'LOW',
      heatScore: 20,
      trend: 'STABLE',
      addressed: false,
      representativeDoubts: doubts.map((d) => d.text).slice(0, 3),
      semanticExplanation: 'The AI engine is monitoring incoming questions and will cluster them into conceptual patterns once sufficient classroom volume is accumulated.',
    };
    return { clusters: [lowDataCluster], mode: 'FEATHERLESS_AI' };
  }

  // Attempt Featherless AI Clustering
  if (getFeatherlessApiKey()) {
    try {
      const doubtListText = doubts
        .map((d) => `ID: ${d.id} | Doubt: "${d.text}"`)
        .join('\n');

      const systemPrompt = `You are an educational AI assistant for DoubtMap's semantic analysis engine.
You group student doubts into conceptual clusters and generate clear learning guidance.
Always respond with valid JSON only. No markdown, no commentary.`;

      const userPrompt = `You are DoubtMap's AI Semantic Analysis Engine for a computer science lecture on Binary Search Trees (BSTs).
Analyze the following list of ${doubts.length} anonymous student doubts.
Group them semantically into 3 to 5 distinct, high-impact conceptual gaps.

Doubts List:
${doubtListText}

Guidelines:
1. Do not perform simple keyword matching. Group by fundamental conceptual misunderstanding.
2. For each cluster, given the student doubts belonging to that cluster, generate:
   - "label": a short cluster title
   - "description": a simple explanation of the concept gap (1 sentence)
   - "doubtIds": all doubt IDs belonging to this cluster
   - "representativeDoubts": 2 to 3 representative student doubt strings
   - "explanation": a short learning summary / simple explanation (2 sentences) highlighting how differently-worded doubts share the same underlying conceptual gap
   - "misconceptions": common misconceptions students hold about this topic
   - "keyConcepts": key concepts students should study
   - "nextTopic": suggested next topic
   - "heat": "LOW", "MEDIUM", "HIGH", or "CRITICAL" based on proportion and urgency
   - "trend": "UP", "STABLE", or "DOWN"
3. Also include "semanticExplanation" as a concise teacher-facing summary of the gap.

Return JSON only in this exact shape:
{
  "clusters": [
    {
      "label": "...",
      "description": "...",
      "doubtIds": ["..."],
      "representativeDoubts": ["..."],
      "explanation": "...",
      "misconceptions": "...",
      "keyConcepts": "...",
      "nextTopic": "...",
      "semanticExplanation": "...",
      "heat": "MEDIUM",
      "trend": "STABLE"
    }
  ]
}`;

      const parsed = await featherlessChatJson<AiClusterPayload>(systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 4096,
      });

      if (parsed.clusters && Array.isArray(parsed.clusters) && parsed.clusters.length > 0) {
        const totalCount = doubts.length;

        // Preserve addressed status if previous cluster had same label
        const addressedMap = new Map<string, { addressed: boolean; addressedAt?: string }>();
        for (const prev of previousClusters) {
          addressedMap.set(prev.label.toLowerCase(), {
            addressed: prev.addressed,
            addressedAt: prev.addressedAt,
          });
        }

        const formattedClusters: Cluster[] = parsed.clusters.map((c) => {
          const count = c.doubtIds?.length || 1;
          const percentage = Math.round((count / totalCount) * 100);
          const prevAddressed = addressedMap.get((c.label || '').toLowerCase());

          let heatLevel: HeatLevel = 'MEDIUM';
          if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(c.heat?.toUpperCase() || '')) {
            heatLevel = c.heat!.toUpperCase() as HeatLevel;
          } else if (percentage >= 30) {
            heatLevel = 'CRITICAL';
          } else if (percentage >= 20) {
            heatLevel = 'HIGH';
          } else if (percentage >= 10) {
            heatLevel = 'MEDIUM';
          } else {
            heatLevel = 'LOW';
          }

          let trend: TrendDirection = 'STABLE';
          if (['UP', 'STABLE', 'DOWN'].includes(c.trend?.toUpperCase() || '')) {
            trend = c.trend!.toUpperCase() as TrendDirection;
          }

          const heatScoreMap: Record<HeatLevel, number> = {
            CRITICAL: 90 + Math.min(percentage, 10),
            HIGH: 70 + Math.min(percentage, 15),
            MEDIUM: 45 + Math.min(percentage, 20),
            LOW: 20 + Math.min(percentage, 20),
          };

          const label = (c.label || 'Conceptual Gap').trim();
          if (!label) {
            throw new Error('Featherless returned a cluster with an empty title');
          }

          // Bug fix #4: use stable ID derived from label, not array index
          return {
            id: stableClusterId(label, sessionId),
            sessionId,
            label,
            description: (c.description || c.explanation || '').trim() || 'Related student doubts share a concept gap.',
            doubtIds: c.doubtIds || [],
            count,
            percentage,
            heat: heatLevel,
            heatScore: heatScoreMap[heatLevel],
            trend,
            addressed: prevAddressed?.addressed || false,
            addressedAt: prevAddressed?.addressedAt,
            representativeDoubts: c.representativeDoubts || [],
            semanticExplanation: buildSemanticExplanation({
              explanation: c.explanation || c.semanticExplanation,
              misconceptions: c.misconceptions,
              keyConcepts: c.keyConcepts,
              nextTopic: c.nextTopic,
              fallback: c.semanticExplanation,
            }),
          };
        });

        // Sort clusters by count/heat descending
        formattedClusters.sort((a, b) => b.count - a.count);

        return { clusters: formattedClusters, mode: 'FEATHERLESS_AI' };
      }

      console.warn('Featherless AI clustering returned empty or invalid clusters; using standby fallback.');
    } catch (err) {
      console.warn('Featherless AI clustering fallback triggered:', err);
    }
  }

  // Standby Hybrid Local Clustering Algorithm
  return {
    clusters: performLocalSemanticClustering(doubts, sessionId, previousClusters),
    mode: 'STANDBY_HYBRID',
  };
}

function performLocalSemanticClustering(
  doubts: Doubt[],
  sessionId: string,
  previousClusters: Cluster[] = []
): Cluster[] {
  const categories: Record<string, Doubt[]> = {
    direction_irreversibility: [],
    calculation_math: [],
    system_surroundings: [],
    reversible_efficiency: [],
    microstates_spontaneity: [],
  };

  // Classify doubts into categories based on hidden category tag or keyword semantic score
  for (const doubt of doubts) {
    if (doubt.hiddenCategory && categories[doubt.hiddenCategory]) {
      categories[doubt.hiddenCategory].push(doubt);
    } else {
      // Semantic keyword matching heuristics
      const text = doubt.text.toLowerCase();
      if (text.includes('calculate') || text.includes('formula') || text.includes('unit') || text.includes('integral') || text.includes('dq/t')) {
        categories.calculation_math.push(doubt);
      } else if (text.includes('surroundings') || text.includes('refrigerator') || text.includes('universe') || text.includes('freeze') || text.includes('plant')) {
        categories.system_surroundings.push(doubt);
      } else if (text.includes('carnot') || text.includes('efficiency') || text.includes('engine') || text.includes('friction') || text.includes('reversible')) {
        categories.reversible_efficiency.push(doubt);
      } else if (text.includes('microstate') || text.includes('boltzmann') || text.includes('spontaneous') || text.includes('gibbs') || text.includes('delta g')) {
        categories.microstates_spontaneity.push(doubt);
      } else {
        categories.direction_irreversibility.push(doubt);
      }
    }
  }

  const addressedMap = new Map<string, { addressed: boolean; addressedAt?: string }>();
  for (const prev of previousClusters) {
    if (prev.categoryKey) {
      addressedMap.set(prev.categoryKey, { addressed: prev.addressed, addressedAt: prev.addressedAt });
    } else {
      addressedMap.set(prev.label.toLowerCase(), { addressed: prev.addressed, addressedAt: prev.addressedAt });
    }
  }

  const totalDoubts = doubts.length;
  const resultClusters: Cluster[] = [];

  const keys = Object.keys(categories);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const categoryDoubts = categories[key];
    if (categoryDoubts.length === 0) continue;

    const meta = CATEGORY_MAP[key] || {
      label: 'Conceptual Gap ' + (i + 1),
      description: 'Group of related student doubts',
      explanation: 'Students are expressing similar confusion around this core topic using various phrasing.',
    };

    const count = categoryDoubts.length;
    const percentage = Math.round((count / totalDoubts) * 100);

    let heat: HeatLevel = 'LOW';
    let heatScore = 25;
    if (percentage >= 28) {
      heat = 'CRITICAL';
      heatScore = 92;
    } else if (percentage >= 20) {
      heat = 'HIGH';
      heatScore = 78;
    } else if (percentage >= 12) {
      heat = 'MEDIUM';
      heatScore = 52;
    }

    // Select 3 distinct representative doubts
    const representativeDoubts = Array.from(new Set(categoryDoubts.map((d) => d.text))).slice(0, 3);
    const prevAddressed = addressedMap.get(key) || addressedMap.get(meta.label.toLowerCase());

    // Bug fix #4: local clusters use stable key-based ID (already stable by category key)
    resultClusters.push({
      id: `c-loc-${key}-${sessionId.slice(0, 4)}`,
      sessionId,
      label: meta.label,
      description: meta.description,
      doubtIds: categoryDoubts.map((d) => d.id),
      count,
      percentage,
      heat,
      heatScore,
      trend: count > totalDoubts * 0.25 ? 'UP' : 'STABLE',
      addressed: prevAddressed?.addressed || false,
      addressedAt: prevAddressed?.addressedAt,
      representativeDoubts,
      semanticExplanation: meta.explanation,
      categoryKey: key,
    });
  }

  // Sort descending by count
  resultClusters.sort((a, b) => b.count - a.count);
  return resultClusters;
}

export async function generateTeacherInsight(
  sessionTitle: string,
  clusters: Cluster[],
  totalDoubts: number
): Promise<{ summary: string; actionableAdvice: string; topConfusions: string[] }> {
  const activeClusters = clusters.filter((c) => !c.addressed);
  const topCluster = activeClusters[0] || clusters[0];

  const defaultTopConfusions = activeClusters.slice(0, 3).map((c) => c.label);

  if (activeClusters.length === 0) {
    return {
      summary: 'All detected conceptual gaps have been addressed by the teacher! Excellent pacing.',
      actionableAdvice: 'Proceed to test conceptual retention with a quick poll or move to the next topic.',
      topConfusions: ['All gaps resolved'],
    };
  }

  if (getFeatherlessApiKey()) {
    try {
      const clusterSummaryText = activeClusters
        .map((c) => `- ${c.label} (${c.count} doubts, ${c.percentage}% of class): ${c.description}`)
        .join('\n');

      const systemPrompt = `You are DoubtMap's AI Decision Support Assistant.
Always respond with valid JSON only. No markdown, no commentary.`;

      const userPrompt = `You are helping a teacher giving a lecture on "${sessionTitle}".
Here are the current unresolved conceptual gaps identified from ${totalDoubts} student questions:
${clusterSummaryText}

Generate a concise 2-sentence teacher insight and actionable advice for the remaining lecture time.
Respond in JSON format with fields:
{
  "summary": "1 sentence describing the single biggest misconception bottleneck",
  "actionableAdvice": "1 sentence with a specific teaching intervention (e.g. diagram, analogy, step-by-step example)"
}`;

      const parsed = await featherlessChatJson<{
        summary?: string;
        actionableAdvice?: string;
      }>(systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 1024,
      });

      const summary = parsed.summary?.trim();
      const actionableAdvice = parsed.actionableAdvice?.trim();

      if (!summary || !actionableAdvice) {
        throw new Error('Featherless returned empty teacher insight fields');
      }

      return {
        summary,
        actionableAdvice,
        topConfusions: defaultTopConfusions,
      };
    } catch (err) {
      console.warn('Featherless teacher insight fallback triggered:', err);
    }
  }

  // Fallback decision support
  if (topCluster) {
    return {
      summary: `Primary classroom confusion is concentrated around "${topCluster.label}" (${topCluster.count} doubts, ${topCluster.percentage}% of class).`,
      actionableAdvice: `Draw a clear physical comparison or state function diagram on the board before proceeding to problem sets.`,
      topConfusions: defaultTopConfusions,
    };
  }

  return {
    summary: 'Classroom confusion is evenly distributed across core binary search tree topics.',
    actionableAdvice: 'Take a 3-minute Q&A pause to address representative questions from top clusters.',
    topConfusions: defaultTopConfusions,
  };
}
