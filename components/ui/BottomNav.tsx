'use client'

import { useRouter } from 'next/navigation'
import { Home, Calendar, CheckSquare, ShoppingCart, ChefHat, BarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Start',    Icon: Home,          path: '/dashboard' },
  { id: 'kalender',  label: 'Kalender', Icon: Calendar,      path: '/kalender'  },
  { id: 'aufgaben',  label: 'Aufgaben', Icon: CheckSquare,   path: '/aufgaben'  },
  { id: 'einkauf',   label: 'Einkauf',  Icon: ShoppingCart,  path: '/einkauf'   },
  { id: 'rezepte',   label: 'Rezepte',  Icon: ChefHat,       path: '/rezepte'   },
  { id: 'analyse',   label: 'Analyse',  Icon: BarChart2,     path: '/analyse'   },
]

export default function BottomNav({ active }: { active: string }) {
  const router = useRouter()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex max-w-[430px] mx-auto"
      style={{
        background: '#fff',
        borderTop: '1px solid #f1f5f9',
        boxShadow: '0 -4px 20px rgba(15,23,42,.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ id, label, Icon, path }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => router.push(path)}
            className="flex-1 flex flex-col items-center pt-2 pb-3 gap-1 relative transition-colors"
            style={{ color: isActive ? '#2563eb' : '#94a3b8' }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              style={{ color: isActive ? '#2563eb' : '#94a3b8' }}
            />
            <span
              className="text-[9.5px] font-semibold tracking-wide"
              style={{ color: isActive ? '#2563eb' : '#94a3b8', letterSpacing: '.15px' }}
            >
              {label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-1 w-4 h-1 rounded-full"
                style={{ background: '#2563eb' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}