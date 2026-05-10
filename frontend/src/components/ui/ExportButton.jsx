import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import Spinner from './Spinner'

export default function ExportButton({ onExportExcel, onExportPdf }) {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf,   setLoadingPdf]   = useState(false)
  const [open,         setOpen]         = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExcel = (e) => {
    e.stopPropagation(); e.preventDefault()
    setOpen(false); setLoadingExcel(true)
    try { if (onExportExcel) onExportExcel() }
    finally { setLoadingExcel(false) }
  }

  const handlePdf = (e) => {
    e.stopPropagation(); e.preventDefault()
    setOpen(false); setLoadingPdf(true)
    try { if (onExportPdf) onExportPdf() }
    finally { setLoadingPdf(false) }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="lk-btn lk-btn-secondary"
        onClick={() => setOpen(prev => !prev)}
        style={{ fontSize: '0.8rem', gap: '6px', display: 'flex', alignItems: 'center' }}
      >
        {loadingExcel || loadingPdf
          ? <Spinner size="sm" />
          : <Download size={14} />
        }
        Exporter
        <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div style={{
          position:     'absolute', top: '42px', right: 0,
          background:   'var(--lk-dark-2)',
          border:       '1px solid var(--lk-border-2)',
          borderRadius: 'var(--radius-md)',
          boxShadow:    'var(--shadow-md)',
          zIndex:       200, minWidth: '170px',
          overflow:     'hidden',
          animation:    'fadeInScale 0.2s ease',
        }}>
          <div
            onMouseDown={handleExcel}
            style={{
              display:     'flex', alignItems: 'center', gap: '10px',
              padding:     '0.65rem 1rem',
              background:  'transparent',
              borderBottom:'1px solid var(--lk-border)',
              color:       'var(--lk-text-primary)',
              fontSize:    '0.8rem', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--lk-dark-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileSpreadsheet size={15} color="#3ecf8e" />
            Excel (.xlsx)
          </div>
          <div
            onMouseDown={handlePdf}
            style={{
              display:    'flex', alignItems: 'center', gap: '10px',
              padding:    '0.65rem 1rem',
              background: 'transparent',
              color:      'var(--lk-text-primary)',
              fontSize:   '0.8rem', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--lk-dark-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileText size={15} color="#e5534b" />
            PDF
          </div>
        </div>
      )}
    </div>
  )
}