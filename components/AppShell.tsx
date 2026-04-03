'use client'

import { useRouter, usePathname } from 'next/navigation'

// 1. Definition muss GANZ OBEN stehen, außerhalb der Funktionen
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Start',     emoji: '🏠', path: '/dashboard'   },
  { id: 'kalender',  label: 'Kalender', emoji: '📅', path: '/kalender'     },
  { id: 'aufgaben',  label: 'Aufgaben', emoji: '✅', path: '/aufgaben'     },
  { id: 'einkauf',   label: 'Einkauf',  emoji: '🛒', path: '/einkaufsliste'},
  { id: 'rezepte',   label: 'Rezepte',  emoji: '🍳', path: '/rezepte'      },
  { id: 'wetter',    label: 'Wetter',   emoji: '🌤', path: '/wetter'        },
  { id: 'kalorien',  label: 'Kalorien', emoji: '🔥', path: '/kalorien'        },
]

interface NavProps {
  active: string
}

// 2. Hilfskomponente: Desktop Sidebar
export function SidebarNav({ active }: NavProps) {
  const router = useRouter()
  return (
    <nav style={{
      width: 64, background: '#1e3a5f', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '18px 0', gap: 4, flexShrink: 0, zIndex: 50,
      minHeight: '100vh', position: 'fixed', top: 0, left: 0, bottom: 0,
    }}>
      <div style={{ fontFamily: "serif", fontSize: 12, color: '#93c5fd', marginBottom: 14 }}>FH</div>
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id
        return (
          <button key={item.id} onClick={() => router.push(item.path)} style={{
            width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: isActive ? 'rgba(255,255,255,.18)' : 'transparent', color: '#fff'
          }}>
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <span style={{ fontSize: 7.5, opacity: isActive ? 1 : 0.5 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// 3. Hilfskomponente: Mobile Bottom Nav
export function BottomNav({ active }: NavProps) {
  const router = useRouter()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
      borderTop: '1px solid #f1f5f9', display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id
        return (
          <button key={item.id} onClick={() => router.push(item.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0', border: 'none', background: 'none'
          }}>
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <span style={{ fontSize: 9, color: isActive ? '#2563eb' : '#94a3b8' }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// 4. Hauptkomponente: AppShell (Diese wird im layout.tsx benutzt)
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Hier wird jetzt sicher auf NAV_ITEMS zugegriffen
  const activeItem = NAV_ITEMS.find(item => pathname.startsWith(item.path))
  const active = activeItem ? activeItem.id : 'dashboard'

  return (
    <>
      <style>{`
        @media (max-width: 767px) { .sidebar-nav { display: none !important; } }
        @media (min-width: 768px) { .bottom-nav  { display: none !important; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div className="sidebar-nav">
          <SidebarNav active={active} />
        </div>

        <div style={{ flex: 1, marginLeft: 0 }} id="app-content">
          <style>{`
            @media (min-width: 768px) { #app-content { margin-left: 64px; } }
            @media (max-width: 767px) { #app-content { padding-bottom: 70px; } }
          `}</style>
          {children}
        </div>

        <div className="bottom-nav">
          <BottomNav active={active} />
        </div>
      </div>
    </>
  )
}