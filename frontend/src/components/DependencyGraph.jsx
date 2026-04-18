import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Defined OUTSIDE the component so the reference never changes between renders.
// React Flow compares nodeTypes/edgeTypes by reference — if they're defined
// inside the component, every render creates a new object and React Flow
// reinitialises the entire graph each time.
const nodeTypes = {};
const edgeTypes = {};

export default function DependencyGraph({ nodes: initialNodes, edges: initialEdges }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

useEffect(() => {
  setNodes(initialNodes);
  setEdges(initialEdges);
  setSelectedId(null);
}, [initialNodes, initialEdges]);

  const [selectedId, setSelectedId] = useState(null);

  const onNodeClick = useCallback((event, clickedNode) => {
    const clickedId = clickedNode.id;

    if (clickedId === selectedId) {
      setSelectedId(null);
      resetStyles(setNodes, setEdges, initialNodes, initialEdges);
      return;
    }

    setSelectedId(clickedId);

    const importedIds = new Set(
      initialEdges
        .filter(e => e.source === clickedId)
        .map(e => e.target)
    );

    const importedByIds = new Set(
      initialEdges
        .filter(e => e.target === clickedId)
        .map(e => e.source)
    );

    setNodes(initialNodes.map(node => {
      let style = {};

      if (node.id === clickedId) {
        style = {
          background: '#6366f1',
          color: '#fff',
          border: '2px solid #4f46e5',
          borderRadius: '8px',
        };
      } else if (importedIds.has(node.id)) {
        style = {
          background: '#0d9488',
          color: '#fff',
          border: '2px solid #0f766e',
          borderRadius: '8px',
        };
      } else if (importedByIds.has(node.id)) {
        style = {
          background: '#d97706',
          color: '#fff',
          border: '2px solid #b45309',
          borderRadius: '8px',
        };
      } else {
        style = { opacity: 0.2 };
      }

      return { ...node, style };
    }));

    setEdges(initialEdges.map(edge => {
      const isRelevant =
        edge.source === clickedId || edge.target === clickedId;

      return {
        ...edge,
        style: isRelevant
          ? { stroke: '#6366f1', strokeWidth: 2.5 }
          : { stroke: '#e2e8f0', strokeWidth: 1, opacity: 0.2 },
        animated: isRelevant,
      };
    }));
  }, [selectedId, initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={() => {
          setSelectedId(null);
          resetStyles(setNodes, setEdges, initialNodes, initialEdges);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
        <MiniMap
          nodeColor={(node) => node.style?.background || '#334155'}
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        />
      </ReactFlow>

      <div style={{
        position: 'absolute', bottom: 80, left: 16,
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#94a3b8'
      }}>
        <div style={{ marginBottom: 6, color: '#e2e8f0', fontWeight: 500 }}>Click a node</div>
        <LegendDot color="#6366f1" label="Selected file" />
        <LegendDot color="#0d9488" label="Files it imports" />
        <LegendDot color="#d97706" label="Files that import it" />
        <LegendDot color="#475569" label="Unrelated" />
      </div>
    </div>
  );
}

function resetStyles(setNodes, setEdges, initialNodes, initialEdges) {
  setNodes(initialNodes.map(n => ({ ...n, style: {} })));
  setEdges(initialEdges.map(e => ({
    ...e,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    animated: false,
  })));
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
      <span>{label}</span>
    </div>
  );
}