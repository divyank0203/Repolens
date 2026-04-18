import { useState } from 'react';

export default function RepoInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  return (
    <div style={{
      display: 'flex', gap: 10, padding: 20,
      background: '#1e293b', borderBottom: '1px solid #334155'
    }}>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://github.com/user/repo"
        style={{
          flex: 1, padding: '8px 14px', borderRadius: 8,
          background: '#0f172a', border: '1px solid #334155',
          color: '#f1f5f9', fontSize: 14, outline: 'none',
        }}
        onKeyDown={e => e.key === 'Enter' && onSubmit(url)}
      />
      <button
        onClick={() => onSubmit(url)}
        disabled={loading}
        style={{
          padding: '8px 20px', borderRadius: 8, border: 'none',
          background: loading ? '#475569' : '#6366f1',
          color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 500,
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </div>
  );
}