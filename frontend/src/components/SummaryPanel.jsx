import { useState, useEffect } from 'react';

export default function SummaryPanel({
  node,
  summary,
  architectureOverview,
  summaryLoading,
  entryPoints,       //  array of file path strings
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

  const hasOverview  = Boolean(architectureOverview);
  const hasFile      = Boolean(node);
  const hasEntries   = entryPoints && entryPoints.length > 0;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: '340px', height: '100%',
      background: '#0f172a', borderLeft: '1px solid #334155',
      display: 'flex', flexDirection: 'column',
      zIndex: 20, animation: 'slideIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .rl-tab {
          flex: 1; padding: 10px 0;
          background: none; border: none;
          border-bottom: 2px solid transparent;
          color: #475569; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: color 0.15s, border-color 0.15s;
        }
        .rl-tab:hover { color: #94a3b8; }
        .rl-tab.active { color: #e2e8f0; border-bottom-color: #6366f1; }
      `}</style>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <button className={`rl-tab ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}>
          File Summary
        </button>
        <button className={`rl-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}>
          Architecture
        </button>
        {hasFile && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#475569',
            cursor: 'pointer', fontSize: 16, padding: '0 14px', flexShrink: 0,
          }}>✕</button>
        )}
      </div>

      {/* FILE SUMMARY TAB */}
      {activeTab === 'file' && (
        <>
          {hasFile ? (
            <>
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid #1e293b', flexShrink: 0,
              }}>
                {/* Entry point badge */}
                {node.data.isEntry && (
                  <div style={{
                    display: 'inline-block',
                    background: '#1e1b4b', color: '#a5b4fc',
                    border: '1px solid #6366f1',
                    borderRadius: 4, fontSize: 10, fontWeight: 600,
                    padding: '2px 8px', marginBottom: 8,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    Entry Point
                  </div>
                )}
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

              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {summaryLoading ? (
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    AI summaries are loading...
                  </div>
                ) : summary ? (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                      color: '#6366f1', textTransform: 'uppercase', marginBottom: 10,
                    }}>
                      AI Summary
                    </div>
                    <p style={{
                      color: '#94a3b8', fontSize: 13, lineHeight: 1.7, margin: 0,
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

              <div style={{
                padding: '12px 16px', borderTop: '1px solid #1e293b',
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

      {/* ARCHITECTURE OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* Entry points section — always shown if available */}
          {hasEntries && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                color: '#6366f1', textTransform: 'uppercase', marginBottom: 10,
              }}>
                Entry Points
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entryPoints.map(ep => (
                  <div key={ep} style={{
                    background: '#1e1b4b',
                    border: '1px solid #6366f140',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {/* small diamond icon */}
                    <div style={{
                      width: 6, height: 6,
                      background: '#6366f1',
                      borderRadius: 1,
                      transform: 'rotate(45deg)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      color: '#a5b4fc', fontSize: 12,
                      wordBreak: 'break-all',
                    }}>
                      {ep}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture overview text */}
          {summaryLoading && !hasOverview ? (
            <div style={{ color: '#475569', fontSize: 13 }}>
              Generating architecture overview...
              <br /><br />
              <div style={{
                width: '100%', height: 4, background: '#1e293b',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  width: '40%', height: '100%',
                  background: '#6366f1', borderRadius: 2,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
              <style>{`
                @keyframes pulse {
                  0%,100% { opacity:0.4; transform:translateX(-100%); }
                  50%     { opacity:1;   transform:translateX(250%);  }
                }
              `}</style>
            </div>
          ) : hasOverview ? (
            <>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                color: '#6366f1', textTransform: 'uppercase', marginBottom: 12,
              }}>
                Architecture Overview
              </div>
              {architectureOverview.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} style={{
                  color: '#94a3b8', fontSize: 13, lineHeight: 1.7, margin: '0 0 12px 0',
                }}>
                  {para}
                </p>
              ))}
            </>
          ) : (
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
              Architecture overview not available.
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