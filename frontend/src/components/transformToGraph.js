import dagre from 'dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;

/**
 * Takes the raw dependencyMap from the backend and returns
 * { nodes, edges } ready for React Flow.
 *
 * dependencyMap shape:
 *   { "src/App.js": ["src/utils.js", "src/api.js"], ... }
 */
export function transformToGraph(dependencyMap) {
  // --- Step 1: Build nodes and edges arrays ---

  const nodes = Object.keys(dependencyMap).map((filePath) => ({
    id: filePath,
    // data.label is what React Flow renders inside the node box
    data: {
      label: filePath.split('/').pop(), // just the filename, not full path
      fullPath: filePath,               // keep full path for tooltip/click
    },
    // position is temporary — dagre will overwrite these with real coords
    position: { x: 0, y: 0 },
    type: 'default',
  }));

  // Collect all unique file ids so we can add nodes that appear
  // only as dependencies but not as keys (e.g. a leaf file with no imports)
  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = [];

  for (const [source, deps] of Object.entries(dependencyMap)) {
    for (const target of deps) {
      // Only add edge if target is a known node in our map
      // (avoids dangling edges to unresolved files)
      if (!nodeIds.has(target)) continue;

      edges.push({
        id: `${source}→${target}`,  // must be unique
        source,
        target,
        // animated: true gives the flowing dashes look
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      });
    }
  }

  // --- Step 2: Run Dagre layout ---
  // Dagre computes proper x,y for each node in a directed graph
  // so files that import others appear above their dependencies

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'TB',   // TB = top to bottom. LR = left to right if you prefer
    nodesep: 60,     // horizontal gap between nodes in the same rank
    ranksep: 80,     // vertical gap between ranks (dependency levels)
    marginx: 40,
    marginy: 40,
  });

  // Dagre needs a default edge label — empty string means no label
  g.setDefaultEdgeLabel(() => ({}));

  // Register every node with its dimensions
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Register every edge
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm — mutates the graph object in place
  dagre.layout(g);

  // Write the computed positions back into our nodes array
  const layoutedNodes = nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return {
      ...node,
      position: {
        // Dagre gives us the center point; React Flow wants top-left corner
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}