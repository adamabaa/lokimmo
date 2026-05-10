import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
      <Search size={14} style={{
        position:   'absolute', left: '10px', top: '50%',
        transform:  'translateY(-50%)',
        color:      'var(--lk-text-muted)',
        pointerEvents: 'none',
      }} />
      <input
        className="lk-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: '32px', fontSize: '0.875rem' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position:   'absolute', right: '10px', top: '50%',
            transform:  'translateY(-50%)',
            background: 'none', border: 'none',
            color:      'var(--lk-text-muted)',
            cursor:     'pointer', display: 'flex',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}