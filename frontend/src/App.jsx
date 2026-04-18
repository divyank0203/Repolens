import { useState } from 'react';
import RepoInput from './components/RepoInput';
import DependencyGraph from './components/DependencyGraph';
import { transformToGraph } from './components/transformToGraph';

export default function App() {

const [direction, setDirection] = useState('TB');


<div style={{
  position: 'absolute', top: 10, right: 16, zIndex: 10,
  display: 'flex', gap: 6,
}}>
  {['TB', 'LR'].map(d => (
    <button
      key={d}
      onClick={() => {
        setDirection(d);
        if (rawDependencyMap) {
          setGraphData(transformToGraph(rawDependencyMap, d));
        }
      }}
      style={{
        padding: '4px 12px', borderRadius: 6, fontSize: 12,
        background: direction === d ? '#6366f1' : '#1e293b',
        color: '#e2e8f0', border: '1px solid #334155', cursor: 'pointer',
      }}
    >
      {d === 'TB' ? '↕ Top-Down' : '↔ Left-Right'}
    </button>
  ))}
</div>


  const [graphData, setGraphData] = useState(null);
  const [rawDependencyMap, setRawDependencyMap] = useState(null);
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
      
      setRawDependencyMap(data.dependencyMap);
      setGraphData(transformToGraph(data.dependencyMap, direction));  
      const graph = transformToGraph(data.dependencyMap, 'TB');
      
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