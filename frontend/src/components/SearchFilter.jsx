export default function SearchFilter({
  searchQuery,
  onSearchChange,
  folders,
  activeFolder,
  onFolderChange,
  minConnections,
  onMinConnectionsChange,
  totalNodes,
  visibleNodes,
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 16,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: 220,
    }}>

      {/* Search input */}
      <input
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search files..."
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#e2e8f0',
          fontSize: 12,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Folder filter */}
      <select
        value={activeFolder}
        onChange={e => onFolderChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          background: '#1e293b',
          border: '1px solid #334155',
          color: activeFolder ? '#e2e8f0' : '#475569',
          fontSize: 12,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="">All folders</option>
        {folders.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Connectivity filter */}
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '6px 10px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <span style={{ color: '#475569', fontSize: 11 }}>Min connections</span>
          <span style={{ color: '#6366f1', fontSize: 11, fontWeight: 600 }}>
            {minConnections}+
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          value={minConnections}
          onChange={e => onMinConnectionsChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#6366f1' }}
        />
      </div>

      {/* Node count indicator */}
      <div style={{
        color: '#475569',
        fontSize: 11,
        textAlign: 'center',
      }}>
        {visibleNodes === totalNodes
          ? `${totalNodes} files`
          : `${visibleNodes} of ${totalNodes} files`}
      </div>
    </div>
  );
}