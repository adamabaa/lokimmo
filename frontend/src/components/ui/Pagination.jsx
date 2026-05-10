export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '4px',
      marginTop:      '1.25rem',
    }}>
      {/* Précédent */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={btnStyle(false, currentPage === 1)}
      >
        ←
      </button>

      {/* Pages */}
      {pages.map(page => {
        // Afficher : première, dernière, courante ±1
        const show =
          page === 1 ||
          page === totalPages ||
          Math.abs(page - currentPage) <= 1

        if (!show) {
          // Ellipsis
          if (page === 2 || page === totalPages - 1) {
            return (
              <span key={page} style={{ color: 'var(--lk-text-muted)', padding: '0 4px' }}>
                ...
              </span>
            )
          }
          return null
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={btnStyle(page === currentPage, false)}
          >
            {page}
          </button>
        )
      })}

      {/* Suivant */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={btnStyle(false, currentPage === totalPages)}
      >
        →
      </button>
    </div>
  )
}

function btnStyle(active, disabled) {
  return {
    width:        32,
    height:       32,
    borderRadius: 'var(--radius-md)',
    border:       `1px solid ${active ? 'var(--lk-amber)' : 'var(--lk-border-2)'}`,
    background:   active ? 'var(--lk-amber-bg)' : 'transparent',
    color:        active ? 'var(--lk-amber)' : disabled ? 'var(--lk-text-muted)' : 'var(--lk-text-secondary)',
    fontSize:     '0.8rem',
    fontWeight:   active ? 600 : 400,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    opacity:      disabled ? 0.4 : 1,
    transition:   'all 0.15s',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  }
}