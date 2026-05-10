import { useEffect, useState, useCallback } from 'react'
import SuperAdminLayout                      from '../../components/super/SuperAdminLayout'
import { logApi }                            from '../../api/logApi'
import Spinner                               from '../../components/ui/Spinner'
import { Key, Sparkles, Crown, Home, Edit, Trash2, Building2, Zap, BarChart2, ClipboardList } from 'lucide-react'

const ACTION_LABELS = {
  login:             { label: 'Connexion',       color: '#3ecf8e', icon: <Key size={14} /> },
  register:          { label: 'Inscription',     color: '#5b9cf6', icon: <Sparkles size={14} /> },
  super_admin_login: { label: 'SA Connexion',    color: '#d4a853', icon: <Crown size={14} /> },
  create_property:   { label: 'Bien créé',       color: '#5b9cf6', icon: <Home size={14} /> },
  update_property:   { label: 'Bien modifié',    color: '#d4a853', icon: <Edit size={14} /> },
  delete_property:   { label: 'Bien supprimé',   color: '#e5534b', icon: <Trash2 size={14} /> },
  create_agency:     { label: 'Agence créée',    color: '#3ecf8e', icon: <Building2 size={14} /> },
  toggle_agency:     { label: 'Agence toggleée', color: '#d4a853', icon: <Zap size={14} /> },
  delete_agency:     { label: 'Agence supprimée',color: '#e5534b', icon: <Trash2 size={14} /> },
}

export default function LogsPage() {
  const [logs,        setLogs]        = useState([])
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [total,       setTotal]       = useState(0)
  const [actionFilter, setActionFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, statsRes] = await Promise.all([
        logApi.getLogs({ page, action: actionFilter }),
        logApi.getStats(),
      ])
      setLogs(logsRes.data.data?.logs        || [])
      setTotalPages(logsRes.data.data?.total_pages || 1)
      setTotal(logsRes.data.data?.total           || 0)
      setStats(statsRes.data.data)
    } finally { setLoading(false) }
  }, [page, actionFilter])

  useEffect(() => { load() }, [load])

  const formatDate = (str) => {
    if (!str) return '—'
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(str))
  }

  return (
    <SuperAdminLayout title="Logs d'activité" subtitle="Historique de toutes les actions sur la plateforme">

      {/* Stats rapides */}
      {stats && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap:                 '1rem',
          marginBottom:        '1.5rem',
        }}>
          <StatCard label="Aujourd'hui"    value={stats.today_count}          color="#5b9cf6" icon={<BarChart2 size={18} />} />
          <StatCard label="Top agence"     value={stats.top_agencies?.[0]?.name || '—'} color="#d4a853" icon={<Building2 size={18} />} />
          <StatCard label="Action fréquente" value={ACTION_LABELS[stats.top_actions?.[0]?.action]?.label || '—'} color="#3ecf8e" icon={<Zap size={18} />} />
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select
          className="lk-input"
          style={{ width: 'auto', fontSize: '0.875rem', background: '#0e1219', color: '#f0ece4', border: '1px solid rgba(255,255,255,0.06)' }}
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
        >
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.8rem', color: '#8b8d96', alignSelf: 'center' }}>
          {total} entrée{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table logs */}
      <div style={{
        background:   '#0e1219',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow:     'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="md" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8b8d96', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', opacity: 0.3 }}><ClipboardList size={40} /></div>
            Aucun log trouvé
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Action', 'Utilisateur', 'Agence', 'Description', 'IP', 'Date'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left',
                    fontSize: '0.68rem', color: '#555761',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: '#8b8d96', icon: '•' }
                return (
                  <tr key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      opacity:      0,
                      animation:    `fadeIn 0.3s ease forwards ${i * 0.03}s`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Action */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display:      'inline-flex',
                        alignItems:   'center',
                        gap:          '5px',
                        background:   `${actionInfo.color}15`,
                        color:        actionInfo.color,
                        borderRadius: '20px',
                        padding:      '2px 8px',
                        fontSize:     '0.72rem',
                        fontWeight:   500,
                        whiteSpace:   'nowrap',
                      }}>
                        {actionInfo.icon} {actionInfo.label}
                      </span>
                    </td>

                    {/* Utilisateur */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ color: '#f0ece4', fontWeight: 500 }}>{log.user_name || '—'}</div>
                      <div style={{ color: '#555761', fontSize: '0.72rem' }}>{log.user_email || ''}</div>
                    </td>

                    {/* Agence */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {log.agency_name ? (
                        <>
                          <div style={{ color: '#f0ece4' }}>{log.agency_name}</div>
                          <div style={{ color: '#555761', fontSize: '0.72rem', fontFamily: 'monospace' }}>{log.agency_slug}</div>
                        </>
                      ) : (
                        <span style={{ color: '#d4a853', fontSize: '0.72rem' }}>Super Admin</span>
                      )}
                    </td>

                    {/* Description */}
                    <td style={{ padding: '0.75rem 1rem', color: '#8b8d96', maxWidth: '200px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.description || '—'}
                      </div>
                    </td>

                    {/* IP */}
                    <td style={{ padding: '0.75rem 1rem', color: '#555761', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                      {log.ip_address || '—'}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '0.75rem 1rem', color: '#8b8d96', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '1.25rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pageBtnStyle(false, page === 1)}
          >←</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i + 1}
              onClick={() => setPage(i + 1)}
              style={pageBtnStyle(page === i + 1, false)}
            >{i + 1}</button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pageBtnStyle(false, page === totalPages)}
          >→</button>
        </div>
      )}

    </SuperAdminLayout>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background:   '#0e1219',
      border:       '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding:      '1rem',
      position:     'relative',
      overflow:     'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#8b8d96', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: '#f0ece4', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}

function pageBtnStyle(active, disabled) {
  return {
    width: 32, height: 32,
    borderRadius: '8px',
    border: `1px solid ${active ? '#5b9cf6' : 'rgba(255,255,255,0.06)'}`,
    background: active ? 'rgba(91,156,246,0.1)' : 'transparent',
    color: active ? '#5b9cf6' : disabled ? '#333' : '#8b8d96',
    fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}