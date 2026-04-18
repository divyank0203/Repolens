import dagre from 'dagre';

const NODE_HEIGHT = 36;

// entryPoints is an optional Set of file paths
export function transformToGraph(dependencyMap, direction = 'TB', entryPoints = new Set()) {

  const nodeIds = new Set(Object.keys(dependencyMap));
  for (const deps of Object.values(dependencyMap)) {
    for (const dep of deps) nodeIds.add(dep);
  }

  const nodes = Array.from(nodeIds).map((filePath) => {
    const label          = filePath.split('/').pop();
    const estimatedWidth = Math.max(label.length * 8 + 32, 130);
    const isEntry        = entryPoints.has(filePath);

    return {
      id: filePath,
      data: { label, fullPath: filePath, isEntry },
      position: { x: 0, y: 0 },
      type: 'default',
      width: estimatedWidth,
      style: {
        background: isEntry ? '#1e1b4b' : '#1e293b',
        color: isEntry ? '#a5b4fc' : '#e2e8f0',
        // entry points get a purple border + slightly thicker ring
        border: isEntry ? '2px solid #6366f1' : '1px solid #334155',
        borderRadius: isEntry ? '8px' : '6px',
        fontSize: '11px',
        padding: '4px 14px',
        whiteSpace: 'nowrap',
        width: estimatedWidth,
        minWidth: estimatedWidth,
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
    rankdir: direction, nodesep: 60, ranksep: 80,
    marginx: 30, marginy: 30,
    acyclicer: 'greedy', ranker: 'network-simplex',
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    g.setNode(node.id, { width: node.width, height: NODE_HEIGHT });
  });
  edges.forEach(edge => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  const layoutedNodes = nodes.map(node => {
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