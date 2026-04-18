import dagre from 'dagre';

// These must match the rendered node size in React Flow.
// If your CSS gives nodes a different size, update these to match —
// otherwise dagre's spacing calculations will be wrong and nodes will overlap.
const NODE_WIDTH  = 172;
const NODE_HEIGHT = 36;

/**
 * Converts the raw dependencyMap from the backend into
 * { nodes, edges } ready for React Flow, with dagre-computed positions.
 *
 * dependencyMap shape:
 *   { "src/App.js": ["src/utils.js", "src/api.js"], ... }
 */
export function transformToGraph(dependencyMap, direction = 'TB') {
  // ── Step 1: Build flat nodes and edges arrays ──────────────────────────

  const nodeIds = new Set(Object.keys(dependencyMap));

  // Some files appear only as targets (imported but never import anything).
  // Walk all dep arrays to catch them so they appear as nodes too.
  for (const deps of Object.values(dependencyMap)) {
    for (const dep of deps) {
      nodeIds.add(dep);
    }
  }

  const nodes = Array.from(nodeIds).map((filePath) => ({
    id: filePath,
    data: {
      label: filePath.split('/').pop(), // filename only for display
      fullPath: filePath,
    },
    // position is placeholder — dagre overwrites it below
    position: { x: 0, y: 0 },
    // tells React Flow to use its built-in default node renderer
    type: 'default',
    // base style — highlight logic in DependencyGraph.jsx overrides this per-click
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: '6px',
      fontSize: '11px',
      padding: '4px 10px',
      width: NODE_WIDTH,
    },
  }));

  const edges = [];
  for (const [source, deps] of Object.entries(dependencyMap)) {
    for (const target of deps) {
      // Only draw edges between nodes we actually have
      if (!nodeIds.has(target)) continue;

      edges.push({
        id: `${source}→${target}`,
        source,
        target,
        type: 'smoothstep',  // smoothstep looks cleaner than straight lines in dense graphs
        animated: false,
        style: { stroke: '#475569', strokeWidth: 1.5 },
      });
    }
  }

  // ── Step 2: Configure the dagre graph ─────────────────────────────────

  // Always create a fresh graph instance.
  // Reusing one across calls accumulates stale nodes/edges.
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir:  direction,  // 'TB' (top→bottom) or 'LR' (left→right)
    nodesep:  50,   // px between nodes in the same rank (horizontal gap for TB)
    ranksep:  80,   // px between ranks (vertical gap for TB)
    marginx:  30,   // padding around the whole graph
    marginy:  30,
    acyclicer: 'greedy',   // handles circular imports — breaks cycles before ranking
    ranker:    'network-simplex', // best general-purpose rank algorithm in dagre
  });

  // dagre needs a default edge label function — returning {} means no label
  g.setDefaultEdgeLabel(() => ({}));

  // ── Step 3: Register nodes with their exact pixel dimensions ──────────

  // This is what dagre uses to compute spacing.
  // The width/height here must match your actual rendered node dimensions.
  // If they don't match, nodes visually overlap even though dagre thinks
  // they're spaced correctly.
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // ── Step 4: Register edges ─────────────────────────────────────────────

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // ── Step 5: Run the layout algorithm ──────────────────────────────────

  // This mutates `g` in place — all nodes now have .x and .y set
  dagre.layout(g);

  // ── Step 6: Write dagre's positions back to React Flow nodes ──────────

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);

    // THE KEY OFFSET:
    // dagre gives centre coordinates, React Flow wants top-left.
    // Without this subtraction, every node renders shifted down-right
    // by half its size, and edges point to empty space.
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH  / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}