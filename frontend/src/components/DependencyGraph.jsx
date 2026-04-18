import { useCallback, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {};
const edgeTypes = {};

export default function DependencyGraph({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeSelect,
  filteredNodeIds,  // NEW: Set of node ids to show, null = show all
  searchQuery,      // NEW: string to highlight matching nodes
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState(null);

  const graphKey = useMemo(() => {
    const ids = initialNodes.map(n => n.id).join(',');
    const firstPos = initialNodes[0]
      ? `${initialNodes[0].position.x},${initialNodes[0].position.y}`
      : '';
    return `${ids}|${firstPos}`;
  }, [initialNodes]);

  useEffect(() => {
    setSelectedId(null);
    onNodeSelect?.(null);
    applyFilterAndSearch(
      initialNodes, initialEdges,
      filteredNodeIds, searchQuery,
      null, setNodes, setEdges
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey]);

  // Re-apply filter/search whenever they change
  useEffect(() => {
    applyFilterAndSearch(
      initialNodes, initialEdges,
      filteredNodeIds, searchQuery,
      selectedId, setNodes, setEdges
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredNodeIds, searchQuery]);

  const onNodeClick = useCallback((event, clickedNode) => {
    const clickedId = clickedNode.id;

    if (clickedId === selectedId) {
      setSelectedId(null);
      onNodeSelect?.(null);
      applyFilterAndSearch(
        initialNodes, initialEdges,
        filteredNodeIds, searchQuery,
        null, setNodes, setEdges
      );
      return;
    }

    setSelectedId(clickedId);
    onNodeSelect?.(clickedNode);

    const importedIds = new Set(
      initialEdges.filter(e => e.source === clickedId).map(e => e.target)
    );
    const importedByIds = new Set(
      initialEdges.filter(e => e.target === clickedId).map(e => e.source)
    );

    setNodes(initialNodes.map(node => {
      // If filtered out, keep it hidden regardless of selection
      if (filteredNodeIds && !filteredNodeIds.has(node.id)) {
        return { ...node, width: node.width, style: { ...node.style, opacity: 0.05 } };
      }

      let style = {};
      if (node.id === clickedId) {
        style = {
          background: '#6366f1', color: '#fff',
          border: '2px solid #4f46e5', borderRadius: '8px',
          width: node.width, minWidth: node.width,
          whiteSpace: 'nowrap', fontSize: '11px', padding: '4px 14px',
        };
      } else if (importedIds.has(node.id)) {
        style = {
          background: '#0d9488', color: '#fff',
          border: '2px solid #0f766e', borderRadius: '8px',
          width: node.width, minWidth: node.width,
          whiteSpace: 'nowrap', fontSize: '11px', padding: '4px 14px',
        };
      } else if (importedByIds.has(node.id)) {
        style = {
          background: '#d97706', color: '#fff',
          border: '2px solid #b45309', borderRadius: '8px',
          width: node.width, minWidth: node.width,
          whiteSpace: 'nowrap', fontSize: '11px', padding: '4px 14px',
        };
      } else {
        style = { ...node.style, opacity: 0.2 };
      }
      return { ...node, width: node.width, style };
    }));

    setEdges(initialEdges.map(edge => {
      const isRelevant = edge.source === clickedId || edge.target === clickedId;
      const bothVisible = !filteredNodeIds ||
        (filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target));
      return {
        ...edge,
        style: isRelevant && bothVisible
          ? { stroke: '#6366f1', strokeWidth: 2.5 }
          : { stroke: '#e2e8f0', strokeWidth: 1, opacity: 0.05 },
        animated: isRelevant && bothVisible,
      };
    }));
  }, [selectedId, initialNodes, initialEdges,
      filteredNodeIds, searchQuery, setNodes, setEdges, onNodeSelect]);

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
          onNodeSelect?.(null);
          applyFilterAndSearch(
            initialNodes, initialEdges,
            filteredNodeIds, searchQuery,
            null, setNodes, setEdges
          );
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
        borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#94a3b8',
      }}>
        <div style={{ marginBottom: 6, color: '#e2e8f0', fontWeight: 500 }}>
          Click a node
        </div>
        <LegendDot color="#6366f1" label="Selected file" />
        <LegendDot color="#0d9488" label="Files it imports" />
        <LegendDot color="#d97706" label="Files that import it" />
        <LegendDot color="#475569" label="Unrelated" />
      </div>
    </div>
  );
}

/**
 * Pure function — applies filter + search highlight to nodes and edges.
 * Called from multiple places so it lives outside the component.
 */
function applyFilterAndSearch(
  initialNodes, initialEdges,
  filteredNodeIds, searchQuery,
  selectedId, setNodes, setEdges
) {
  const query = searchQuery?.toLowerCase().trim();

  setNodes(initialNodes.map(node => {
    const isFiltered = filteredNodeIds && !filteredNodeIds.has(node.id);
    const isMatch = query && node.data.fullPath.toLowerCase().includes(query);
    const isSelected = node.id === selectedId;

    let style = {
      ...node.style,
      opacity: isFiltered ? 0.05 : 1,
    };

    // Search match — yellow ring, full opacity even if slightly dimmed
    if (isMatch && !isFiltered) {
      style = {
        ...node.style,
        opacity: 1,
        border: '2px solid #eab308',
        boxShadow: '0 0 0 2px #eab30840',
      };
    }

    // Selected takes priority over search highlight
    if (isSelected) {
      style = {
        ...node.style,
        background: '#6366f1', color: '#fff',
        border: '2px solid #4f46e5',
      };
    }

    return { ...node, width: node.width, style };
  }));

  setEdges(initialEdges.map(edge => {
    const bothVisible = !filteredNodeIds ||
      (filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target));
    return {
      ...edge,
      style: bothVisible
        ? { stroke: '#475569', strokeWidth: 1.5 }
        : { stroke: '#475569', strokeWidth: 1.5, opacity: 0.05 },
      animated: false,
    };
  }));
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
      <span>{label}</span>
    </div>
  );
}