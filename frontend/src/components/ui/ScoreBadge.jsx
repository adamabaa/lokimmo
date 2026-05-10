import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function ScoreBadge({ score, size = 'md', showLabel = true }) {
  const s = parseInt(score || 0)

  const config = s >= 80
    ? { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)',  label: 'Excellent',   icon: <TrendingUp  size={10} /> }
    : s >= 60
    ? { color: '#5b9cf6', bg: 'rgba(91,156,246,0.12)',  label: 'Bon',         icon: <TrendingUp  size={10} /> }
    : s >= 40
    ? { color: '#d4a853', bg: 'rgba(212,168,83,0.12)',  label: 'Acceptable',  icon: <Minus       size={10} /> }
    : s >= 20
    ? { color: '#e5534b', bg: 'rgba(229,83,75,0.12)',   label: 'Risqué',      icon: <TrendingDown size={10} /> }
    : { color: '#8b8d96', bg: 'rgba(139,141,150,0.12)', label: 'Insuffisant', icon: <TrendingDown size={10} /> }

  const sizes = {
    sm: { width: 36, height: 36, fontSize: '0.75rem', labelSize: '0.65rem' },
    md: { width: 48, height: 48, fontSize: '0.9rem',  labelSize: '0.72rem' },
    lg: { width: 72, height: 72, fontSize: '1.3rem',  labelSize: '0.8rem'  },
  }

  const sz = sizes[size] || sizes.md

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width:          sz.width, height: sz.height,
        borderRadius:   '50%',
        background:     config.bg,
        border:         `2px solid ${config.color}`,
        display:        'flex', alignItems: 'center', justifyContent: 'center',
        fontSize:       sz.fontSize, fontWeight: 700,
        color:          config.color, flexShrink: 0,
        position:       'relative',
      }}>
        {s}
      </div>
      {showLabel && (
        <span style={{
          display:    'flex', alignItems: 'center', gap: '3px',
          fontSize:   sz.labelSize,
          color:      config.color, fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>
          {config.icon} {config.label}
        </span>
      )}
    </div>
  )
}