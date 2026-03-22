"use client"

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BarChart3, Timer, Menu, X, Trophy } from 'lucide-react'
import './globals.css'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/standings', label: 'Standings', icon: Trophy },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <html lang="en">
      <head>
        <title>F1 Stream — Real-Time Telemetry Dashboard</title>
        <meta name="description" content="Premium F1 data streaming dashboard with live telemetry, analytics, and ML predictions." />
      </head>
      <body>
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 200,
            background: 'var(--color-carbon-main)', border: '1px solid var(--color-glass-border)',
            borderRadius: 8, padding: '0.5rem', color: 'white', cursor: 'pointer',
          }}
          className="mobile-menu-btn"
          id="mobile-menu-toggle"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="dashboard-container">
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-brand text-gradient-red">F1 STREAM</div>
            <div className="sidebar-section">Navigation</div>
            <nav className="sidebar-nav">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-link ${pathname === href ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="sidebar-section" style={{ marginTop: '2rem' }}>System</div>
            <div className="sidebar-nav">
              <div className="sidebar-link" style={{ cursor: 'default' }}>
                <Timer size={18} />
                <span className="text-xs text-silver">WebSocket: <span style={{ color: 'var(--color-green)' }}>●</span></span>
              </div>
            </div>
          </aside>

          <main className="main-content">
            {children}
          </main>
        </div>

        <style jsx global>{`
          @media (max-width: 768px) {
            .mobile-menu-btn { display: block !important; }
          }
        `}</style>
      </body>
    </html>
  )
}
