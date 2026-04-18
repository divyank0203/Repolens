import { useState } from 'react';
import RepoInput from './components/RepoInput';
import DependencyGraph from './components/DependencyGraph';
import { transformToGraph } from './components/transformToGraph';

export default function App() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleAnalyze(repoUrl) {
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    setGraphData(null);

    try {
      const res = await fetch('http://localhost:3001/api/repo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }

      const data = await res.json();

      // Transform backend output into React Flow format
      // This is the only place transformToGraph is called —
      // we do it once and store the result, not on every render
      const graph = transformToGraph(data.dependencyMap);
      setGraphData(graph);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <RepoInput onSubmit={handleAnalyze} loading={loading} />

      {error && (
        <div style={{ padding: 20, color: '#f87171', background: '#1e293b' }}>
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Cloning and analyzing repository...
        </div>
      )}

      {graphData && (
        // key prop forces React Flow to fully remount when graph data changes
        // without it, React Flow's internal store gets confused on re-analysis
        <div style={{ flex: 1, position: 'relative' }}>
          <DependencyGraph
            key={JSON.stringify(graphData.nodes.length)}
            nodes={graphData.nodes}
            edges={graphData.edges}
          />
        </div>
      )}

      {!graphData && !loading && !error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 15 }}>
          Enter a GitHub repo URL to visualize its dependency graph
        </div>
      )}
    </div>
  );
}