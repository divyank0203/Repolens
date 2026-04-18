import dagre from 'dagre';

const NODE_WIDTH  = 172;
const NODE_HEIGHT = 36;

export function transformToGraph(dependencyMap, direction = 'TB') {


  const nodeIds = new Set(Object.keys(dependencyMap));

  for (const deps of Object.values(dependencyMap)) {
    for (const dep of deps) {
      nodeIds.add(dep);
    }
  }

  

  const nodes = Array.from(nodeIds).map((filePath) => ({
    id: filePath,
    data: {
      label: filePath.split('/').pop(),
      fullPath: filePath,
    },
    position: { x: 0, y: 0 }, // dagre overwrites this below
    type: 'default',
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


  const edgeMap = new Map();

  for (const [source, deps] of Object.entries(dependencyMap)) {
    for (const target of deps) {
      if (!nodeIds.has(target)) continue;

      const edgeId = `${source}→${target}`;

      if (edgeMap.has(edgeId)) continue; // skip exact duplicates

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
    rankdir:   direction, // 'TB' = top→bottom, 'LR' = left→right
    nodesep:   50,        // gap between nodes in the same rank
    ranksep:   80,        // gap between ranks
    marginx:   30,
    marginy:   30,
    acyclicer: 'greedy',          // handles circular imports gracefully
    ranker:    'network-simplex', // best general-purpose ranker in dagre
  });

  g.setDefaultEdgeLabel(() => ({}));


  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
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
        x: dagreNode.x - NODE_WIDTH  / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}