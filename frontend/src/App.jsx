import { useState, useMemo } from 'react';
import RepoInput from './components/RepoInput';
import DependencyGraph from './components/DependencyGraph';
import SummaryPanel from './components/SummaryPanel';
import SearchFilter from './components/SearchFilter';
import { transformToGraph } from './components/transformToGraph';

export default function App() {
  const [graphData, setGraphData]               = useState(null);
  const [rawDependencyMap, setRawDependencyMap] = useState(null);
  const [fileSummaries, setFileSummaries]       = useState([]);
  const [architectureOverview, setArchitectureOverview] = useState('');
  const [selectedNode, setSelectedNode]         = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [summaryLoading, setSummaryLoading]     = useState(false);
  const [error, setError]                       = useState(null);
  const [direction, setDirection]               = useState('TB');

  // Search + filter state
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeFolder, setActiveFolder]       = useState('');
  const [minConnections, setMinConnections]   = useState(0);

  const summaryMap = useMemo(() => {
    const map = {};
    for (const s of fileSummaries) map[s.filePath] = s;
    return map;
  }, [fileSummaries]);

  const selectedSummary = selectedNode
    ? summaryMap[selectedNode.data.fullPath] ?? null
    : null;

  // All unique folders extracted from node ids
  const folders = useMemo(() => {
    if (!graphData) return [];
    const folderSet = new Set();
    for (const node of graphData.nodes) {
      const parts = node.id.replace(/\\/g, '/').split('/');
      if (parts.length > 1) {
        folderSet.add(parts.slice(0, -1).join('/'));
      }
    }
    return Array.from(folderSet).sort();
  }, [graphData]);

  // Derive the set of visible node ids from active filters
  // null means "show all" — avoids iterating when no filter is active
  const filteredNodeIds = useMemo(() => {
    if (!graphData) return null;
    if (!activeFolder && minConnections === 0) return null;

    const filtered = new Set();
    for (const node of graphData.nodes) {
      const normalizedPath = node.id.replace(/\\/g, '/');
      const inFolder = !activeFolder ||
        normalizedPath.startsWith(activeFolder);
      const totalConnections =
        (node.data.importCount || 0) + (node.data.importedByCount || 0);
      const meetsConnections = totalConnections >= minConnections;

      if (inFolder && meetsConnections) {
        filtered.add(node.id);
      }
    }
    return filtered;
  }, [graphData, activeFolder, minConnections]);

  // Count visible nodes for the SearchFilter indicator
  const visibleNodeCount = useMemo(() => {
    if (!graphData) return 0;
    if (!filteredNodeIds) return graphData.nodes.length;
    return filteredNodeIds.size;
  }, [graphData, filteredNodeIds]);

  function buildGraph(depMap, dir) {
    const graph = transformToGraph(depMap, dir);
    const enrichedNodes = attachCounts(graph.nodes, graph.edges);
    return { nodes: enrichedNodes, edges: graph.edges };
  }

  async function handleAnalyze(repoUrl) {
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    setGraphData(null);
    setFileSummaries([]);
    setArchitectureOverview('');
    setSelectedNode(null);
    setSearchQuery('');
    setActiveFolder('');
    setMinConnections(0);

    try {
      const res = await fetch('http://localhost:3001/api/repo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Server error');
      const data = await res.json();
      setRawDependencyMap(data.dependencyMap);
      setGraphData(buildGraph(data.dependencyMap, direction));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }

    fetchSummaries(repoUrl);
  }

  async function fetchSummaries(repoUrl) {
    setSummaryLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/repo/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFileSummaries(data.fileSummaries || []);
      setArchitectureOverview(data.architectureOverview || '');
    } catch {
      // fail silently
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleDirectionChange(newDirection) {
    setDirection(newDirection);
    if (rawDependencyMap) {
      setGraphData(buildGraph(rawDependencyMap, newDirection));
      setSelectedNode(null);
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex',
      flexDirection: 'column', background: '#0f172a',
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 12px', background: '#1e293b',
        borderBottom: '1px solid #334155', flexShrink: 0,
      }}>
        <RepoInput onSubmit={handleAnalyze} loading={loading} />
        {summaryLoading && (
          <span style={{ color: '#6366f1', fontSize: 12, whiteSpace: 'nowrap' }}>
            AI summaries loading...
          </span>
        )}
        {!summaryLoading && fileSummaries.length > 0 && (
          <span style={{ color: '#0d9488', fontSize: 12, whiteSpace: 'nowrap' }}>
            {fileSummaries.length} summaries ready
          </span>
        )}
      </div>

      {error && (
        <div style={{ padding: 20, color: '#f87171', background: '#1e293b' }}>
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#94a3b8' }}>
          Cloning and analyzing repository...
        </div>
      )}

      {graphData && (
        <div style={{ flex: 1, position: 'relative' }}>

          {/* Search + filter panel */}
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            folders={folders}
            activeFolder={activeFolder}
            onFolderChange={setActiveFolder}
            minConnections={minConnections}
            onMinConnectionsChange={setMinConnections}
            totalNodes={graphData.nodes.length}
            visibleNodes={visibleNodeCount}
          />

          {/* Direction toggle */}
          <div style={{
            position: 'absolute', top: 10,
            right: (selectedNode || architectureOverview) ? 356 : 16,
            zIndex: 10, display: 'flex', gap: 6,
          }}>
            {['TB', 'LR'].map(d => (
              <button key={d} onClick={() => handleDirectionChange(d)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 12,
                background: direction === d ? '#6366f1' : '#1e293b',
                color: '#e2e8f0', border: '1px solid #334155', cursor: 'pointer',
              }}>
                {d === 'TB' ? '↕ Top-Down' : '↔ Left-Right'}
              </button>
            ))}
          </div>

          <DependencyGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            onNodeSelect={setSelectedNode}
            filteredNodeIds={filteredNodeIds}
            searchQuery={searchQuery}
          />

          {(selectedNode || architectureOverview) && (
            <SummaryPanel
              node={selectedNode}
              summary={selectedSummary}
              architectureOverview={architectureOverview}
              summaryLoading={summaryLoading}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      )}

      {!graphData && !loading && !error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#475569', fontSize: 15 }}>
          Enter a GitHub repo URL to visualize its dependency graph
        </div>
      )}
    </div>
  );
}

function attachCounts(nodes, edges) {
  const importCount     = {};
  const importedByCount = {};
  for (const edge of edges) {
    importCount[edge.source]     = (importCount[edge.source]     || 0) + 1;
    importedByCount[edge.target] = (importedByCount[edge.target] || 0) + 1;
  }
  return nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      importCount:     importCount[node.id]     || 0,
      importedByCount: importedByCount[node.id] || 0,
    },
  }));
}