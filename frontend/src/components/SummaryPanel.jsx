import { useState, useEffect } from 'react';

export default function SummaryPanel({
  node,
  summary,
  architectureOverview,
  summaryLoading,
  onClose,
}) {
  
  const [activeTab, setActiveTab] = useState(
    architectureOverview && !node ? 'overview' : 'file'
  );

  
  useEffect(() => {
    if (node) setActiveTab('file');
  }, [node]);

  
  useEffect(() => {
    if (architectureOverview && !node) setActiveTab('overview');
  }, [architectureOverview, node]);

  const hasOverview = Boolean(architectureOverview);
  const hasFile     = Boolean(node);

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0,
      width: '340px',
      height: '100%',
      background: '#0f172a',
      borderLeft: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 20,
      animation: 'slideIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .rl-tab {
          flex: 1;
          padding: 10px 0;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .rl-tab:hover { color: #94a3b8; }
        .rl-tab.active {
          color: #e2e8f0;
          border-bottom-color: #6366f1;
        }
      `}</style>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
      }}>
        <button
          className={`rl-tab ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          File Summary
        </button>
        <button
          className={`rl-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Architecture
        </button>

        {/* Close button — only shown when a node is selected */}
        {hasFile && (
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: '#475569', cursor: 'pointer',
              fontSize: 16, padding: '0 14px', flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── FILE SUMMARY TAB ── */}
      {activeTab === 'file' && (
        <>
          {hasFile ? (
            <>
              {/* File header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #1e293b',
                flexShrink: 0,
              }}>
                <div style={{
                  color: '#e2e8f0', fontWeight: 600,
                  fontSize: 13, wordBreak: 'break-all',
                }}>
                  {node.data.fullPath.split('/').pop()}
                </div>
                <div style={{
                  color: '#475569', fontSize: 11,
                  marginTop: 4, wordBreak: 'break-all',
                }}>
                  {node.data.fullPath}
                </div>
              </div>

              {/* Summary body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {summaryLoading ? (
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    AI summaries are loading...
                  </div>
                ) : summary ? (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.08em', color: '#6366f1',
                      textTransform: 'uppercase', marginBottom: 10,
                    }}>
                      AI Summary
                    </div>
                    <p style={{
                      color: '#94a3b8', fontSize: 13,
                      lineHeight: 1.7, margin: 0,
                    }}>
                      {summary.summary}
                    </p>
                  </>
                ) : (
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    No summary available for this file.
                  </div>
                )}
              </div>

              {/* Footer — import counts */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #1e293b',
                display: 'flex', gap: 16, flexShrink: 0,
              }}>
                <Stat label="Imports"     value={node.data.importCount ?? 0}     color="#0d9488" />
                <Stat label="Imported by" value={node.data.importedByCount ?? 0} color="#d97706" />
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 24, textAlign: 'center',
            }}>
              <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
                Click any node in the graph to see its file summary here.
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ARCHITECTURE OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {summaryLoading && !hasOverview ? (
            <div style={{ color: '#475569', fontSize: 13 }}>
              Generating architecture overview...
              <br /><br />
              <div style={{
                width: '100%', height: 4,
                background: '#1e293b', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  width: '40%', height: '100%',
                  background: '#6366f1', borderRadius: 2,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; transform: translateX(-100%); }
                  50%       { opacity: 1;   transform: translateX(250%);  }
                }
              `}</style>
            </div>
          ) : hasOverview ? (
            <>
              <div style={{
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em', color: '#6366f1',
                textTransform: 'uppercase', marginBottom: 12,
              }}>
                Architecture Overview
              </div>
              {/* Render each paragraph separately for readability */}
              {architectureOverview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} style={{
                  color: '#94a3b8', fontSize: 13,
                  lineHeight: 1.7, margin: '0 0 12px 0',
                }}>
                  {para}
                </p>
              ))}
            </>
          ) : (
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
              Architecture overview not available.
              <br /><br />
              Make sure your{' '}
              <code style={{ color: '#6366f1', fontSize: 12 }}>GEMINI_API_KEY</code>
              {' '}is set and the summary pipeline completed successfully.
            </div>
          )}
        </div>
      )}
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