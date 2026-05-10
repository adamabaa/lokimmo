export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 18, md: 28, lg: 44 }
  const s     = sizes[size]

  return (
    <div
      style={{
        width:        s,
        height:       s,
        borderRadius: '50%',
        border:       '2px solid rgba(212,168,83,0.15)',
        borderTop:    '2px solid var(--lk-amber)',
        animation:    'spin 0.7s linear infinite',
        flexShrink:   0,
      }}
    />
  )
}

export function FullPageLoader() {
  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'var(--lk-dark)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '1rem',
      zIndex:         9999,
    }}>
      <div style={{
        fontFamily:    'var(--font-display)',
        fontSize:      '1.8rem',
        color:         'var(--lk-amber)',
        letterSpacing: '-0.02em',
      }}>
        Lokimmo
      </div>
      <Spinner size="md" />
    </div>
  )
}
