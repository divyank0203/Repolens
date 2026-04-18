import dagre from 'dagre';

const NODE_HEIGHT = 36;

export function transformToGraph(dependencyMap, direction = 'TB') {

  const nodeIds = new Set(Object.keys(dependencyMap));
  for (const deps of Object.values(dependencyMap)) {
    for (const dep of deps) nodeIds.add(dep);
  }

  const nodes = Array.from(nodeIds).map((filePath) => {
    const label = filePath.split('/').pop();

    // Use full path length for width estimation since the node
    // displays the full path (backslash paths need more space)
    const charCount = label.length;
    const estimatedWidth = Math.max(charCount * 8 + 32, 130);

    return {
      id: filePath,
      data: { label, fullPath: filePath },
      position: { x: 0, y: 0 },
      type: 'default',
      // TOP-LEVEL width — this is what React Flow actually uses
      // to size the node box. Without this, RF ignores style.width.
      width: estimatedWidth,
      style: {
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid #334155',
        borderRadius: '6px',
        fontSize: '11px',
        padding: '4px 14px',
        whiteSpace: 'nowrap',
        width: estimatedWidth,      // keeps style in sync
        minWidth: estimatedWidth,   // prevents RF from shrinking it
      },
    };
  });

  const edgeMap = new Map();
  for (const [source, deps] of Object.entries(dependencyMap)) {
    for (const target of deps) {
      if (!nodeIds.has(target)) continue;
      const edgeId = `${source}→${target}`;
      if (edgeMap.has(edgeId)) continue;
      edgeMap.set(edgeId, {
        id: edgeId,
        source,
        target,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#475569', strokeWidth: 1.5 },
      });
    }
  }
  const edges = Array.from(edgeMap.values());

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir:   direction,
    nodesep:   60,
    ranksep:   80,
    marginx:   30,
    marginy:   30,
    acyclicer: 'greedy',
    ranker:    'network-simplex',
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: node.width, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - node.width / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}