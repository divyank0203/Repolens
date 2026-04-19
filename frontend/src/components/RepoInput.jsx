import { useState } from 'react';

export default function RepoInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: 20,
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    }}>
      
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste any JS/TS GitHub repo URL"
        onKeyDown={e => e.key === 'Enter' && onSubmit(url)}
        style={{
          flex: 4,
          minWidth: '600px',
          padding: '10px 16px',
          borderRadius: 10,
          background: '#0f172a',
          border: '1px solid #334155',
          color: '#f1f5f9',
          fontSize: 15,
          outline: 'none',
          transition: 'border 0.2s ease',
        }}
        onFocus={e => e.target.style.border = '1px solid #6366f1'}
        onBlur={e => e.target.style.border = '1px solid #334155'}
      />

      <button
        onClick={() => onSubmit(url)}
        disabled={loading}
        style={{
          flex: 1,
          padding: '10px 20px',
          borderRadius: 10,
          border: 'none',
          background: loading ? '#475569' : '#6366f1',
          color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'background 0.2s ease',
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

    </div>
  );
}