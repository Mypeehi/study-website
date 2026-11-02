import { Lecture, MindmapConceptNode, MindmapLink, ConceptCategory } from '../types';

/**
 * Intelligently generates a multi-tiered hierarchical concept mindmap
 * from any Lecture, ensuring rich Level 0, Level 1, Level 2, and Level 3 nodes.
 */
export function generateMindmapFromLecture(lecture: Lecture): MindmapConceptNode {
  // 1. MECHANISTIC STEPS (Level 1)
  const mechanismChildren: MindmapConceptNode[] = (lecture.coreMechanism || []).map((stepText, idx) => {
    const colonIndex = stepText.indexOf(':');
    let title = `Phase ${idx + 1}`;
    let body = stepText;

    if (colonIndex !== -1) {
      title = stepText.substring(0, colonIndex).trim();
      body = stepText.substring(colonIndex + 1).trim();
    } else {
      // Split by first period if available
      const dotIndex = stepText.indexOf('.');
      if (dotIndex !== -1 && dotIndex < 35) {
        title = stepText.substring(0, dotIndex + 1).trim();
        body = stepText.substring(dotIndex + 1).trim();
      }
    }

    // Extract level 3 sub-concepts from the step description
    const sentences = body
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    const subStepChildren: MindmapConceptNode[] = sentences.slice(0, 3).map((sent, sIdx) => {
      // Extract a punchy subtopic label
      let subName = `Detail ${idx + 1}.${sIdx + 1}`;
      if (sent.includes('(') && sent.includes(')')) {
        const match = sent.match(/\(([^)]+)\)/);
        if (match && match[1].length < 35) {
          subName = match[1];
        }
      } else {
        const words = sent.split(' ').slice(0, 4).join(' ');
        subName = words.length > 25 ? words.slice(0, 25) + '…' : words;
      }

      return {
        id: `node-mech-${idx + 1}-sub-${sIdx + 1}`,
        name: subName,
        category: 'mechanism',
        level: 3,
        description: sent,
        examinerNote: `High-yield mechanism detail for ${title}. Pay close attention to causal direction.`,
        parentId: `node-mech-${idx + 1}`,
      };
    });

    return {
      id: `node-mech-${idx + 1}`,
      name: title,
      category: 'mechanism',
      level: 2,
      description: body,
      examinerNote: `Sequential mechanistic milestone #${idx + 1} for ${lecture.title}.`,
      parentId: 'pillar-mechanisms',
      children: subStepChildren,
    };
  });

  // 2. EXAMINER TRAPS & PITFALLS (Level 1)
  const trapChildren: MindmapConceptNode[] = [
    {
      id: 'node-trap-primary',
      name: 'Fatal Misconception',
      category: 'trap',
      level: 2,
      description: lecture.theTrap,
      examinerNote: 'The exact trap professors exploit to separate top scorers from failing students.',
      parentId: 'pillar-traps',
      children: [
        {
          id: 'node-trap-detail-root',
          name: 'Why Students Fail',
          category: 'trap',
          level: 3,
          description: `Superficial memorization leads students to confuse cause and effect here. The core trap: "${lecture.theTrap.slice(0, 120)}..."`,
          examinerNote: 'Never pick answers that invert causality on this topic.',
          parentId: 'node-trap-primary',
        },
        {
          id: 'node-trap-detail-fix',
          name: 'The Antidote Heuristic',
          category: 'trap',
          level: 3,
          description: 'Focus strictly on the thermodynamic driving force and physical gating states rather than vague intuitions.',
          examinerNote: 'Look for active vs passive transport or allosteric vs direct inhibition distractors.',
          parentId: 'node-trap-primary',
        },
      ],
    },
  ];

  // Add Quiz trap notes if available
  (lecture.quiz || []).forEach((q, qIdx) => {
    if (q.examinerTrapNotes) {
      trapChildren.push({
        id: `node-trap-q-${qIdx + 1}`,
        name: `Distractor Trap #${qIdx + 1}`,
        category: 'trap',
        level: 2,
        description: q.examinerTrapNotes,
        examinerNote: `Tested on question: "${q.question.slice(0, 60)}..."`,
        parentId: 'pillar-traps',
        children: [
          {
            id: `node-trap-q-${qIdx + 1}-fix`,
            name: 'Distractor Breakdown',
            category: 'trap',
            level: 3,
            description: q.angryExplanation.slice(0, 160) + '...',
            examinerNote: 'High probability of appearing in multiple-choice exams.',
            parentId: `node-trap-q-${qIdx + 1}`,
          },
        ],
      });
    }
  });

  // 3. MENTAL MODEL & ANALOGY (Level 1)
  const analogySentences = (lecture.analogy || '')
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const analogyChildren: MindmapConceptNode[] = [
    {
      id: 'node-analogy-core',
      name: 'Mental Metaphor',
      category: 'analogy',
      level: 2,
      description: lecture.analogy,
      examinerNote: 'Intuitive physical anchor: Connects textbook jargon to everyday kinetic systems.',
      parentId: 'pillar-analogy',
      children: analogySentences.slice(0, 2).map((sent, aIdx) => ({
        id: `node-analogy-sub-${aIdx + 1}`,
        name: `Mapping Element #${aIdx + 1}`,
        category: 'analogy',
        level: 3,
        description: sent,
        examinerNote: 'Use this mental picture when answering oral viva questions.',
        parentId: 'node-analogy-core',
      })),
    },
  ];

  // 4. HIGH-YIELD PEARLS & BLOCKERS (Level 1)
  const pearlChildren: MindmapConceptNode[] = (lecture.highYieldBullets || []).map((bullet, bIdx) => {
    const arrowIdx = bullet.indexOf('->');
    let bTitle = `Pearl #${bIdx + 1}`;
    let bBody = bullet;

    if (arrowIdx !== -1) {
      bTitle = bullet.substring(0, arrowIdx).trim();
      bBody = bullet.substring(arrowIdx + 2).trim();
    } else {
      const words = bullet.split(' ');
      if (words.length > 4) {
        bTitle = words.slice(0, 3).join(' ');
      }
    }

    return {
      id: `node-pearl-${bIdx + 1}`,
      name: bTitle,
      category: 'pearl',
      level: 2,
      description: bullet,
      examinerNote: `Must-know clinical or experimental pearl for ${lecture.topic}.`,
      parentId: 'pillar-pearls',
      children: [
        {
          id: `node-pearl-${bIdx + 1}-consequence`,
          name: 'Clinical Consequence',
          category: 'pearl',
          level: 3,
          description: bBody,
          examinerNote: 'Examiners test this via clinical vignettes or toxicology scenarios.',
          parentId: `node-pearl-${bIdx + 1}`,
        },
      ],
    };
  });

  // 5. VIVA PROBES & SPEAKING EXAM SCENARIOS (Level 1)
  const vivaChildren: MindmapConceptNode[] = (lecture.vivaQuestions || []).map((viva, vIdx) => ({
    id: `node-viva-${vIdx + 1}`,
    name: viva.title || `Oral Probe #${vIdx + 1}`,
    category: 'detail',
    level: 2,
    description: viva.examinerPrompt,
    examinerNote: `Difficulty: ${viva.difficulty} · Required keywords: ${viva.requiredKeywords.join(', ')}`,
    parentId: 'pillar-viva',
    children: [
      {
        id: `node-viva-${vIdx + 1}-kw`,
        name: 'Required Scientific Keywords',
        category: 'detail',
        level: 3,
        description: `Mandatory vocabulary to score 1st class honors: ${viva.requiredKeywords.join(', ')}`,
        examinerNote: 'Omitting any of these keywords will prompt an aggressive examiner interruption.',
        parentId: `node-viva-${vIdx + 1}`,
      },
      {
        id: `node-viva-${vIdx + 1}-model`,
        name: 'Model Answer Takeaway',
        category: 'detail',
        level: 3,
        description: (viva.sampleModelAnswer || '').slice(0, 180) + '...',
        examinerNote: 'Concise, rigorous oral teaching delivery.',
        parentId: `node-viva-${vIdx + 1}`,
      },
    ],
  }));

  // Construct Root & Major Pillars
  const rootNode: MindmapConceptNode = {
    id: 'node-root',
    name: lecture.title,
    category: 'root',
    level: 0,
    description: lecture.summary,
    examinerNote: `Foundation Lecture · Difficulty: ${lecture.difficulty} · ${lecture.topic}`,
    children: [
      {
        id: 'pillar-mechanisms',
        name: 'Causal Mechanisms',
        category: 'mechanism',
        level: 1,
        description: 'The step-by-step chronological sequence of causal molecular and physical events.',
        examinerNote: 'Examiners demand exact step-by-step ordering with no skipped intermediates.',
        parentId: 'node-root',
        children: mechanismChildren,
      },
      {
        id: 'pillar-traps',
        name: 'Examiner Traps & Flaws',
        category: 'trap',
        level: 1,
        description: lecture.theTrap,
        examinerNote: 'High-frequency exam failure points and seductive distractor options.',
        parentId: 'node-root',
        children: trapChildren,
      },
      {
        id: 'pillar-analogy',
        name: 'Mental Model Analogy',
        category: 'analogy',
        level: 1,
        description: lecture.analogy,
        examinerNote: 'Intuitive mental model for rapid active recall under exam pressure.',
        parentId: 'node-root',
        children: analogyChildren,
      },
      {
        id: 'pillar-pearls',
        name: 'High-Yield Pearls',
        category: 'pearl',
        level: 1,
        description: 'Critical clinical pearls, pharmacology blockers, and formulas.',
        examinerNote: 'Tested on both multiple-choice and viva sections.',
        parentId: 'node-root',
        children: pearlChildren,
      },
      ...(vivaChildren.length > 0
        ? [
            {
              id: 'pillar-viva',
              name: 'Oral Viva Probes',
              category: 'detail' as ConceptCategory,
              level: 1,
              description: 'Rigorous oral examination challenges on this lecture topic.',
              examinerNote: 'Evaluates your ability to teach back the concept without hesitation.',
              parentId: 'node-root',
              children: vivaChildren,
            },
          ]
        : []),
    ],
  };

  return rootNode;
}

/**
 * Traverses the hierarchical tree and extracts active nodes and links,
 * filtering out any nodes whose ancestors are marked as collapsed.
 */
export function flattenMindmap(
  root: MindmapConceptNode,
  collapsedNodeIds: Set<string>
): { nodes: MindmapConceptNode[]; links: MindmapLink[] } {
  const nodes: MindmapConceptNode[] = [];
  const links: MindmapLink[] = [];

  function traverse(node: MindmapConceptNode) {
    nodes.push(node);

    // If this node is in collapsedNodeIds, do not traverse its children
    if (collapsedNodeIds.has(node.id)) {
      return;
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        links.push({
          source: node.id,
          target: child.id,
          category: child.category,
        });
        traverse(child);
      }
    }
  }

  traverse(root);
  return { nodes, links };
}

/**
 * Returns all node IDs in the hierarchy that have 1 or more children.
 */
export function getAllNodeIdsWithChildren(root: MindmapConceptNode): string[] {
  const ids: string[] = [];
  function walk(node: MindmapConceptNode) {
    if (node.children && node.children.length > 0) {
      ids.push(node.id);
      node.children.forEach(walk);
    }
  }
  walk(root);
  return ids;
}

/**
 * Counts total descendants (children, grandchildren, etc.) for a node.
 */
export function countTotalDescendants(node: MindmapConceptNode): number {
  if (!node.children || node.children.length === 0) return 0;
  let count = node.children.length;
  for (const child of node.children) {
    count += countTotalDescendants(child);
  }
  return count;
}

/**
 * Finds the path from root to a specific target node (for breadcrumbs).
 */
export function findNodePath(
  root: MindmapConceptNode,
  targetId: string
): MindmapConceptNode[] | null {
  if (root.id === targetId) return [root];
  if (!root.children) return null;

  for (const child of root.children) {
    const subPath = findNodePath(child, targetId);
    if (subPath) {
      return [root, ...subPath];
    }
  }
  return null;
}

/**
 * Searches the mindmap for nodes matching a query string.
 * Returns an array of matched nodes and the set of all ancestor IDs
 * that must be expanded so the matched nodes are visible.
 */
export function searchMindmap(
  root: MindmapConceptNode,
  query: string
): { matchedNodeIds: Set<string>; ancestorIdsToExpand: Set<string> } {
  const cleanQ = query.trim().toLowerCase();
  const matchedNodeIds = new Set<string>();
  const ancestorIdsToExpand = new Set<string>();

  if (!cleanQ) {
    return { matchedNodeIds, ancestorIdsToExpand };
  }

  function search(node: MindmapConceptNode, currentPath: string[]): boolean {
    const matchesSelf =
      node.name.toLowerCase().includes(cleanQ) ||
      (node.description && node.description.toLowerCase().includes(cleanQ)) ||
      (node.examinerNote && node.examinerNote.toLowerCase().includes(cleanQ));

    let childMatched = false;
    if (node.children) {
      for (const child of node.children) {
        if (search(child, [...currentPath, node.id])) {
          childMatched = true;
        }
      }
    }

    if (matchesSelf) {
      matchedNodeIds.add(node.id);
      currentPath.forEach(id => ancestorIdsToExpand.add(id));
      return true;
    }

    return childMatched;
  }

  search(root, []);
  return { matchedNodeIds, ancestorIdsToExpand };
}
