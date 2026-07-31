import { GoogleGenAI, Type } from '@google/genai';
import { Doubt, Cluster, HeatLevel, TrendDirection } from '../types.js';

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

export async function clusterDoubts(
  doubts: Doubt[],
  sessionId: string,
  previousClusters: Cluster[] = []
): Promise<{ clusters: Cluster[]; mode: 'GEMINI_AI' | 'STANDBY_HYBRID' }> {
  if (doubts.length === 0) {
    return { clusters: [], mode: 'GEMINI_AI' };
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
    return { clusters: [lowDataCluster], mode: 'GEMINI_AI' };
  }

  // Attempt Real Gemini AI Clustering
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const doubtListText = doubts
        .map((d) => `ID: ${d.id} | Doubt: "${d.text}"`)
        .join('\n');

      const prompt = `
You are DoubtMap's AI Semantic Analysis Engine for a computer science lecture on Binary Search Trees (BSTs).
Analyze the following list of ${doubts.length} anonymous student doubts.
Group them semantically into 3 to 5 distinct, high-impact conceptual gaps.

Doubts List:
${doubtListText}

Guidelines:
1. Do not perform simple keyword matching. Group by fundamental conceptual misunderstanding.
2. For each cluster:
   - Provide a clear, short, actionable title (e.g. "Deletion Cases & In-Order Successor").
   - Provide a 1-sentence description of the concept gap.
   - List all doubt IDs belonging to this cluster.
   - Pick 2 to 3 representative student doubt strings.
   - Provide a 2-sentence "semanticExplanation" highlighting how differently-worded doubts (e.g., asking about the 3 cases vs. what is the in-order successor vs. can I use the predecessor) share the exact same underlying conceptual gap.
   - Set "heat" level ("LOW", "MEDIUM", "HIGH", "CRITICAL") based on proportion and urgency.
   - Set "trend" ("UP", "STABLE", "DOWN").

Respond strictly in JSON format.
`;

      // Bug fix #1: corrected model name from the non-existent 'gemini-3.6-flash'
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clusters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    description: { type: Type.STRING },
                    doubtIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    representativeDoubts: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    semanticExplanation: { type: Type.STRING },
                    heat: {
                      type: Type.STRING,
                      description: 'LOW, MEDIUM, HIGH, or CRITICAL',
                    },
                    trend: {
                      type: Type.STRING,
                      description: 'UP, STABLE, or DOWN',
                    },
                  },
                  required: [
                    'label',
                    'description',
                    'doubtIds',
                    'representativeDoubts',
                    'semanticExplanation',
                    'heat',
                    'trend',
                  ],
                },
              },
            },
            required: ['clusters'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
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

          const formattedClusters: Cluster[] = parsed.clusters.map((c: any) => {
            const count = c.doubtIds?.length || 1;
            const percentage = Math.round((count / totalCount) * 100);
            const prevAddressed = addressedMap.get(c.label.toLowerCase());

            let heatLevel: HeatLevel = 'MEDIUM';
            if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(c.heat?.toUpperCase())) {
              heatLevel = c.heat.toUpperCase() as HeatLevel;
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
            if (['UP', 'STABLE', 'DOWN'].includes(c.trend?.toUpperCase())) {
              trend = c.trend.toUpperCase() as TrendDirection;
            }

            const heatScoreMap: Record<HeatLevel, number> = {
              CRITICAL: 90 + Math.min(percentage, 10),
              HIGH: 70 + Math.min(percentage, 15),
              MEDIUM: 45 + Math.min(percentage, 20),
              LOW: 20 + Math.min(percentage, 20),
            };

            // Bug fix #4: use stable ID derived from label, not array index
            return {
              id: stableClusterId(c.label, sessionId),
              sessionId,
              label: c.label,
              description: c.description,
              doubtIds: c.doubtIds || [],
              count,
              percentage,
              heat: heatLevel,
              heatScore: heatScoreMap[heatLevel],
              trend,
              addressed: prevAddressed?.addressed || false,
              addressedAt: prevAddressed?.addressedAt,
              representativeDoubts: c.representativeDoubts || [],
              semanticExplanation: c.semanticExplanation,
            };
          });

          // Sort clusters by count/heat descending
          formattedClusters.sort((a, b) => b.count - a.count);

          return { clusters: formattedClusters, mode: 'GEMINI_AI' };
        }
      }
    } catch (err) {
      console.warn('Gemini API clustering fallback triggered:', err);
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const clusterSummaryText = activeClusters
        .map((c) => `- ${c.label} (${c.count} doubts, ${c.percentage}% of class): ${c.description}`)
        .join('\n');

      const prompt = `
You are DoubtMap's AI Decision Support Assistant for a teacher giving a lecture on "${sessionTitle}".
Here are the current unresolved conceptual gaps identified from ${totalDoubts} student questions:
${clusterSummaryText}

Generate a concise 2-sentence teacher insight and actionable advice for the remaining lecture time.
Respond in JSON format with fields:
{
  "summary": "1 sentence describing the single biggest misconception bottleneck",
  "actionableAdvice": "1 sentence with a specific teaching intervention (e.g. diagram, analogy, step-by-step example)"
}
`;

      // Bug fix #1: corrected model name
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              actionableAdvice: { type: Type.STRING },
            },
            required: ['summary', 'actionableAdvice'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          summary: parsed.summary,
          actionableAdvice: parsed.actionableAdvice,
          topConfusions: defaultTopConfusions,
        };
      }
    } catch (err) {
      console.warn('Gemini teacher insight fallback triggered:', err);
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
