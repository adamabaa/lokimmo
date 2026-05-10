import Spinner from './Spinner'

export default function DataTable({
  columns,
  data,
  loading,
  emptyMessage = 'Aucune donnée',
  emptyIcon    = '📋',
  totalCount,
}) {
  if (loading) {
    return (
      <div className="lk-table-wrapper">
        <table className="lk-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="lk-skeleton" style={{ height: 18, width: '70%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="lk-table-wrapper">
        <div className="lk-empty">
          <div className="lk-empty-icon">{emptyIcon}</div>
          <h3>{emptyMessage}</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Commencez par en créer un nouveau
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {totalCount !== undefined && (
        <div style={{
          fontSize:     '0.8rem',
          color:        'var(--lk-text-muted)',
          marginBottom: '0.5rem',
        }}>
          {data.length} résultat{data.length > 1 ? 's' : ''}
          {totalCount !== data.length && ` sur ${totalCount}`}
        </div>
      )}
      <div className="lk-table-wrapper">
        <table className="lk-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.style}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i}
                style={{
                  opacity:   0,
                  animation: `fadeIn 0.3s ease forwards ${i * 0.03}s`,
                }}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}