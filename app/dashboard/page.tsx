'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Typen ────────────────────────────────────────────────────────────────────
interface CalEvent {
  id: number; title: string; date: string; time: string
  type: 'personal' | 'family' | 'cycle'; color: string; desc: string
}
interface Todo { id: number; text: string; done: boolean }
interface Weather { temp: number; desc: string; wind: number }

// ─── Helpers (bleiben gleich) ──────────────────────────────────────────────────
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const MSHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DAYS   = ['So','Mo','Di','Mi','Do','Fr','Sa']

function fd(d: Date) { return d.toISOString().slice(0, 10) }
function add(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function weekStart(d: Date) {
  const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m
}
function wmoDesc(c: number) {
  if (c === 0) return 'Klar ☀️'; if (c <= 2) return 'Meist klar 🌤'; if (c === 3) return 'Bedeckt ☁️'
  if (c <= 48) return 'Nebel 🌫'; if (c <= 55) return 'Nieselregen 🌦'; if (c <= 65) return 'Regen 🌧'
  if (c <= 75) return 'Schnee ❄️'; if (c <= 82) return 'Schauer 🌦'; return 'Gewitter ⛈'
}

// ─── Demo-Daten ───────────────────────────────────────────────────────────────
const TODAY = new Date()
const DEMO_EVENTS: CalEvent[] = [
  { id: 1, title: 'Kinderarzt Lena', date: fd(add(TODAY, 1)), time: '10:00', type: 'family', color: '#2563eb', desc: 'Vorsorge U8' },
  { id: 2, title: 'Yoga', date: fd(TODAY), time: '18:00', type: 'personal', color: '#16a34a', desc: '' },
  { id: 3, title: 'Elternabend', date: fd(add(TODAY, 2)), time: '19:30', type: 'family', color: '#7c3aed', desc: 'Schule' },
]
const DEMO_TODOS: Todo[] = [
  { id: 1, text: 'Schulranzen kaufen', done: false },
  { id: 2, text: 'Arzt anrufen', done: false },
]

// ─── ANGEPASSTES CSS (Responsive & Full Width) ─────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    paddingBottom: 40,
    width: '100%', // Breite auf 100% gesetzt
  } as React.CSSProperties,

  header: {
    background: '#1e3a5f',
    padding: '60px 20px 40px',
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  // Neuer Container, um den Inhalt auf riesigen Bildschirmen zu zentrieren
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,

  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' as const, zIndex: 1 },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#fff', letterSpacing: -0.5 },
  
  // Grid System für die Karten
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
    marginTop: 20,
  } as React.CSSProperties,

  card: {
    background: '#fff', borderRadius: 20, padding: 20,
    boxShadow: '0 1px 4px rgba(15,23,42,.07), 0 0 0 1px rgba(241,245,249,.8)',
    height: '100%',
  } as React.CSSProperties,

  // ... (Restliche Styles wie im Original, aber ohne maxWidth Einschränkungen)
  greeting: { fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#fff', marginTop: 16, position: 'relative' as const, zIndex: 1 },
  weatherPill: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 50, padding: '8px 16px', border: '1px solid rgba(255,255,255,.1)' },
  eventRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  quickAdd: { display: 'flex', gap: 8, marginTop: 12 },
  qaInput: { flex: 1, height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '0 14px' },
  qaBtnPrimary: { width: 42, height: 42, borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' },
  shortcutGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 },
  scCard: { background: '#fff', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }
}

export default function DashboardPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [todos, setTodos] = useState<Todo[]>(DEMO_TODOS)
  const [todoInput, setTodoInput] = useState('')
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.95&longitude=10.17&current=temperature_2m,weather_code&timezone=Europe%2FBerlin')
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), desc: wmoDesc(d.current.weather_code), wind: 0 }))
      .catch(() => {})
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => add(weekStart(TODAY), i))

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.container}>
          <div style={S.headerRow}>
            <span style={S.logo}>FamilyHub</span>
            <div style={S.weatherPill}>
              <span style={{ fontSize: 20 }}>🌤</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{weather ? `${weather.temp}°` : '--°'}</span>
            </div>
          </div>
          <div style={S.greeting}>Guten Tag, <span style={{ color: '#93c5fd' }}>Marie!</span></div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            {TODAY.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div style={{ ...S.container, padding: '0 20px' }}>
        <div style={S.grid}>
          
          {/* Karte 1: Wochenübersicht */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <span style={{ fontWeight: 600 }}>Diese Woche</span>
              <button onClick={() => router.push('/kalender')} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}>Kalender →</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {weekDays.map(d => (
                <div key={d.toString()} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedDate(d)}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{DAYS[d.getDay()]}</div>
                  <div style={{ 
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                    background: fd(d) === fd(TODAY) ? '#2563eb' : 'transparent',
                    color: fd(d) === fd(TODAY) ? '#fff' : '#0f172a',
                    fontWeight: 600
                  }}>{d.getDate()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Karte 2: Nächste Termine */}
          <div style={S.card}>
            <div style={{ fontWeight: 600, marginBottom: 15 }}>Nächste Termine</div>
            {DEMO_EVENTS.map(e => (
              <div key={e.id} style={S.eventRow}>
                <div style={{ width: 40, fontSize: 11, color: '#94a3b8' }}>{e.time}</div>
                <div style={{ width: 3, height: 24, background: e.color, borderRadius: 2 }} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{e.title}</div>
              </div>
            ))}
          </div>

          {/* Karte 3: Aufgaben */}
          <div style={S.card}>
            <div style={{ fontWeight: 600, marginBottom: 15 }}>Aufgaben</div>
            {todos.map(t => (
              <div key={t.id} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <div style={{ width: 18, height: 18, border: '2px solid #cbd5e1', borderRadius: 5 }} />
                <span style={{ fontSize: 14 }}>{t.text}</span>
              </div>
            ))}
            <div style={S.quickAdd}>
              <input style={S.qaInput} placeholder="Aufgabe hinzufügen..." value={todoInput} onChange={e => setTodoInput(e.target.value)} />
              <button style={S.qaBtnPrimary}>+</button>
            </div>
          </div>

        </div>

        {/* Schnellzugriff Bereich */}
        <div style={{ marginTop: 30 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Schnellzugriff</div>
          <div style={S.shortcutGrid}>
            {[
              { label: 'Einkauf', emoji: '🛒', path: '/einkaufsliste' },
              { label: 'Rezepte', emoji: '🍳', path: '/rezepte' },
              { label: 'Wetter', emoji: '🌤', path: '/wetter' },
            ].map(item => (
              <button key={item.path} style={S.scCard} onClick={() => router.push(item.path)}>
                <span style={{ fontSize: 24 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* WICHTIG: Die lokale BottomNav wurde entfernt, da sie nun aus der globalen AppShell kommt! */}
    </div>
  )
}