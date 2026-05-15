import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

export default function DashboardLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      
      {/* Overlay sur mobile quand la sidebar est ouverte */}
      {isMobile && isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isMobile={isMobile} />
      
      <main style={{
        marginLeft:    isMobile ? '0' : 'var(--sidebar-width)',
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        background:    'var(--lk-dark)',
        transition:    'margin-left 0.3s ease',
        width:         '100%',
        overflowX:     'hidden',
      }}>
        <Navbar 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setIsSidebarOpen(true)}
          isMobile={isMobile}
        />
        <div style={{
          padding:   isMobile ? '1rem' : '2rem',
          flex:      1,
          animation: 'fadeIn 0.4s ease',
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}