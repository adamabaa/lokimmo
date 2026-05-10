import Sidebar from './Sidebar'
import Navbar  from './Navbar'

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft:    'var(--sidebar-width)',
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        background:    'var(--lk-dark)',
      }}>
        <Navbar title={title} subtitle={subtitle} />
        <div style={{
          padding:   '2rem',
          flex:      1,
          animation: 'fadeIn 0.4s ease',
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}