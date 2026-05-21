import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

export default function DashboardLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 1024)
  const location                          = useLocation()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Bloquer le scroll body quand sidebar ouverte sur mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, isSidebarOpen])

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const openSidebar  = useCallback(() => setIsSidebarOpen(true), [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* Overlay sombre derrière la sidebar sur mobile */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position:   'fixed',
            inset:      0,
            background: 'rgba(0,0,0,0.6)',
            zIndex:     99,
            backdropFilter: 'blur(2px)',
            animation:  'fadeIn 0.2s ease',
          }}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      <main style={{
        marginLeft:    isMobile ? '0' : 'var(--sidebar-width)',
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        background:    'var(--lk-dark)',
        transition:    'margin-left 0.3s ease',
        width:         isMobile ? '100%' : `calc(100% - var(--sidebar-width))`,
        overflowX:     'hidden',
      }}>
        <Navbar
          title={title}
          subtitle={subtitle}
          onMenuClick={openSidebar}
          isMobile={isMobile}
        />
        <div style={{
          padding:   isMobile ? '0.875rem' : '2rem',
          flex:      1,
          animation: 'fadeIn 0.4s ease',
          maxWidth:  '100%',
          overflowX: 'hidden',
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}