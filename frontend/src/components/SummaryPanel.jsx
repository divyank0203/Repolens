export default function SummaryPanel({ node, summary, onClose }) {
  // node = the React Flow node object that was clicked
  // summary = the matching entry from fileSummaries array, or null

  if (!node) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '340px',
      height: '100%',
      background: '#0f172a',
      borderLeft: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 20,
      // smooth slide in from the right
      animation: 'slideIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px',
        borderBottom: '1px solid #1e293b',
        gap: 10,
      }}>
        <div>
          {/* filename large */}
          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, wordBreak: 'break-all' }}>
            {node.data.fullPath.split('/').pop()}
          </div>
          {/* full path smaller */}
          <div style={{ color: '#475569', fontSize: 11, marginTop: 4, wordBreak: 'break-all' }}>
            {node.data.fullPath}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 4px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {summary ? (
          <>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#6366f1',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              AI Summary
            </div>
            <p style={{
              color: '#94a3b8',
              fontSize: 13,
              lineHeight: 1.7,
              margin: 0,
            }}>
              {summary.summary}
            </p>
          </>
        ) : (
          <div style={{ color: '#475569', fontSize: 13 }}>
            No summary available for this file.
            <br /><br />
            Run the <code style={{ color: '#6366f1' }}>/summary</code> endpoint
            to generate AI summaries.
          </div>
        )}
      </div>

      {/* Footer — dependency counts */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        gap: 16,
      }}>
        <Stat label="Imports" value={node.data.importCount ?? '—'} color="#0d9488" />
        <Stat label="Imported by" value={node.data.importedByCount ?? '—'} color="#d97706" />
      </div>
    </div>
  );
}

function Stat({ label, color, value }) {
  return (
    <div>
      <div style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#475569', fontSize: 11 }}>{label}</div>
    </div>
  );
}