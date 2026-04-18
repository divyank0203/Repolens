import dagre from 'dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 44;


export function transformToGraph(dependencyMap) {
  

  const nodes = Object.keys(dependencyMap).map((filePath) => ({
    id: filePath,
    
    data: {
      label: filePath.split('/').pop(), 
      fullPath: filePath,               
    },
    
    position: { x: 0, y: 0 },
    type: 'default',
  }));


  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = [];

  for (const [source, deps] of Object.entries(dependencyMap)) {
    for (const target of deps) {
    
      if (!nodeIds.has(target)) continue;

      edges.push({
        id: `${source}→${target}`,  // must be unique
        source,
        target,
        
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      });
    }
  }

  

  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'TB',   
    nodesep: 60,     
    ranksep: 80,     
    marginx: 40,
    marginy: 40,
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
    const { x, y } = g.node(node.id);
    return {
      ...node,
      position: {
        
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}