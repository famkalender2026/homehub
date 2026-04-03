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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const MSHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DAYS   = ['So','Mo','Di','Mi','Do','Fr','Sa']

function fd(d: Date) { return d.toISOString().slice(0, 10) }
function add(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function weekStart(d: Date) {
  const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m
}
function wmoDesc(c: number) {
  if (c === 0) return 'Klar ☀️'
  if (c <= 2)  return 'Meist klar 🌤'
  if (c === 3) return 'Bedeckt ☁️'
  if (c <= 48) return 'Nebel 🌫'
  if (c <= 55) return 'Nieselregen 🌦'
  if (c <= 65) return 'Regen 🌧'
  if (c <= 75) return 'Schnee ❄️'
  if (c <= 82) return 'Schauer 🌦'
  return 'Gewitter ⛈'
}

// ─── Demo-Daten ───────────────────────────────────────────────────────────────
const TODAY = new Date()
const DEMO_EVENTS: CalEvent[] = [
  { id: 1, title: 'Kinderarzt Lena', date: fd(add(TODAY, 1)), time: '10:00', type: 'family',   color: '#2563eb', desc: 'Vorsorge U8' },
  { id: 2, title: 'Yoga',            date: fd(TODAY),         time: '18:00', type: 'personal', color: '#16a34a', desc: '' },
  { id: 3, title: 'Elternabend',     date: fd(add(TODAY, 2)), time: '19:30', type: 'family',   color: '#7c3aed', desc: 'Schule' },
  { id: 4, title: 'Zahnarzt',        date: fd(add(TODAY, 5)), time: '14:00', type: 'personal', color: '#e11d48', desc: '' },
  { id: 5, title: 'Familienessen',   date: fd(add(TODAY, 7)), time: '13:00', type: 'family',   color: '#d97706', desc: "Omas Geburtstag" },
]
const DEMO_TODOS: Todo[] = [
  { id: 1, text: 'Schulranzen kaufen', done: false },
  { id: 2, text: 'Arzt anrufen',       done: false },
  { id: 3, text: 'Rechnung bezahlen',  done: true  },
]

// ─── CSS als JS-Objekt (100% Tailwind-unabhängig) ─────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    paddingBottom: 80,
    maxWidth: 480,
    margin: '0 auto',
  } as React.CSSProperties,

  // Header
  header: {
    background: '#1e3a5f',
    padding: '48px 20px 24px',
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  headerDeco1: {
    position: 'absolute' as const, top: -40, right: -30,
    width: 160, height: 160, borderRadius: '50%',
    background: 'rgba(37,99,235,.35)', pointerEvents: 'none' as const,
  } as React.CSSProperties,
  headerDeco2: {
    position: 'absolute' as const, bottom: -30, left: 20,
    width: 100, height: 100, borderRadius: '50%',
    background: 'rgba(13,148,136,.2)', pointerEvents: 'none' as const,
  } as React.CSSProperties,
  headerRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative' as const, zIndex: 1,
  } as React.CSSProperties,
  logo: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 22, color: '#fff', fontWeight: 400, letterSpacing: -0.5,
  } as React.CSSProperties,
  avatarRing: {
    width: 38, height: 38, borderRadius: '50%', padding: 2,
    background: 'linear-gradient(135deg,#38bdf8,#818cf8)', cursor: 'pointer',
  } as React.CSSProperties,
  avatarInner: {
    width: '100%', height: '100%', borderRadius: '50%',
    background: '#1e3a5f', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff',
  } as React.CSSProperties,

  greeting: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 26, color: '#fff', lineHeight: 1.25,
    marginTop: 16, position: 'relative' as const, zIndex: 1,
  } as React.CSSProperties,
  greetingAccent: { color: '#93c5fd', fontStyle: 'italic' } as React.CSSProperties,
  subDate: {
    fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 4,
    letterSpacing: 0.2, position: 'relative' as const, zIndex: 1,
  } as React.CSSProperties,

  // Weather pill
  weatherRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginTop: 16,
    position: 'relative' as const, zIndex: 1,
  } as React.CSSProperties,
  weatherPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,.13)',
    border: '1px solid rgba(255,255,255,.18)',
    borderRadius: 50, padding: '7px 14px 7px 10px',
  } as React.CSSProperties,
  weatherTemp: { fontSize: 16, fontWeight: 600, color: '#fff' } as React.CSSProperties,
  weatherDesc: { fontSize: 11, color: 'rgba(255,255,255,.65)' } as React.CSSProperties,

  // Stat pills
  statRow: {
    display: 'flex', gap: 8, flex: 1,
  } as React.CSSProperties,
  statPill: {
    flex: 1,
    background: 'rgba(255,255,255,.1)',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 14, padding: '10px 12px',
  } as React.CSSProperties,
  statVal: { fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: -0.5 } as React.CSSProperties,
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,.45)', letterSpacing: 0.8, textTransform: 'uppercase' as const, marginTop: 2 } as React.CSSProperties,

  // Content
  content: { padding: '20px 20px 0' } as React.CSSProperties,
  card: {
    background: '#fff', borderRadius: 20, padding: 16, marginBottom: 16,
    boxShadow: '0 1px 4px rgba(15,23,42,.07), 0 0 0 1px rgba(241,245,249,.8)',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  } as React.CSSProperties,
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#0f172a', letterSpacing: -0.3 } as React.CSSProperties,
  cardLink: { fontSize: 12, fontWeight: 600, color: '#2563eb', cursor: 'pointer', background: 'none', border: 'none' } as React.CSSProperties,

  // Week strip
  weekStrip: {
    display: 'flex', gap: 6, overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const, paddingBottom: 4,
  } as React.CSSProperties,

  // Divider
  divider: { height: 1, background: '#f1f5f9', margin: '10px 0' } as React.CSSProperties,

  // Event row
  eventRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 0', borderBottom: '1px solid #f8fafc',
  } as React.CSSProperties,
  eventTimeCol: { width: 42, textAlign: 'right' as const, flexShrink: 0 } as React.CSSProperties,
  eventLine: { width: 3, height: 36, borderRadius: 3, flexShrink: 0 } as React.CSSProperties,
  eventTitle: { fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties,
  eventMeta: { fontSize: 10, color: '#94a3b8', marginTop: 1 } as React.CSSProperties,

  // Badges
  badgeFamily:   { background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 } as React.CSSProperties,
  badgePersonal: { background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 } as React.CSSProperties,
  badgeCycle:    { background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 } as React.CSSProperties,

  // Todo
  todoRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 0', borderBottom: '1px solid #f8fafc',
  } as React.CSSProperties,
  todoCheck: {
    width: 20, height: 20, borderRadius: 7,
    border: '2px solid #cbd5e1', flexShrink: 0, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', transition: 'all .15s',
  } as React.CSSProperties,

  // Quick add
  quickAdd: { display: 'flex', gap: 8, marginTop: 12 } as React.CSSProperties,
  qaInput: {
    flex: 1, height: 42, border: '1.5px solid #e2e8f0', borderRadius: 14,
    padding: '0 14px', fontSize: 13, fontFamily: 'inherit',
    color: '#0f172a', outline: 'none', background: '#fafafa',
  } as React.CSSProperties,
  qaBtnPrimary: {
    width: 42, height: 42, borderRadius: 14, border: 'none', cursor: 'pointer',
    background: '#2563eb', color: '#fff', fontSize: 22, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  } as React.CSSProperties,
  qaBtnMic: {
    width: 42, height: 42, borderRadius: 14, border: 'none', cursor: 'pointer',
    background: '#f1f5f9', color: '#64748b', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  } as React.CSSProperties,

  // Shortcuts
  shortcutGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 } as React.CSSProperties,
  scCard: {
    background: '#fff', borderRadius: 18, padding: '18px 10px 14px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8,
    cursor: 'pointer', boxShadow: '0 1px 4px rgba(15,23,42,.07)',
    border: 'none',
  } as React.CSSProperties,
  scIcon: {
    width: 44, height: 44, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  } as React.CSSProperties,

  // Big CTA button
  ctaBtn: {
    width: '100%', height: 48, borderRadius: 16, border: 'none', cursor: 'pointer',
    background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, boxShadow: '0 4px 14px rgba(37,99,235,.3)',
  } as React.CSSProperties,

  // Bottom Nav
  bottomNav: {
    position: 'fixed' as const, bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480, background: '#fff',
    borderTop: '1px solid #f1f5f9', display: 'flex', zIndex: 100,
    boxShadow: '0 -4px 20px rgba(15,23,42,.08)',
  } as React.CSSProperties,
  navBtn: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    padding: '10px 0 12px', gap: 3, border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [events, setEvents]   = useState<CalEvent[]>(DEMO_EVENTS)
  const [todos, setTodos]     = useState<Todo[]>(DEMO_TODOS)
  const [todoInput, setTodoInput] = useState('')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.95&longitude=10.17&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FBerlin')
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), desc: wmoDesc(d.current.weather_code), wind: Math.round(d.current.wind_speed_10m) }))
      .catch(() => {})
  }, [])

  const hour = TODAY.getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const ws       = weekStart(TODAY)
  const weekDays = Array.from({ length: 7 }, (_, i) => add(ws, i))

  const dayEvents = events.filter(e => e.date === fd(selectedDate)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const upcoming  = events.filter(e => e.date >= fd(TODAY)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const openTodos = todos.filter(t => !t.done).slice(0, 3)

  function addTodo() {
    const text = todoInput.trim(); if (!text) return
    setTodos(prev => [{ id: Date.now(), text, done: false }, ...prev])
    setTodoInput('')
  }
  function toggleTodo(id: number) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: true } : t))
  }
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Bitte Chrome nutzen für Spracheingabe'); return }
    const r = new SR(); r.lang = 'de-DE'; r.interimResults = false
    r.onstart = () => setListening(true)
    r.onresult = (e: any) => { setTodoInput(e.results[0][0].transcript); setListening(false) }
    r.onerror = r.onend = () => setListening(false)
    r.start()
  }
  function eventLabel(date: string) {
    if (date === fd(TODAY)) return 'Heute'
    if (date === fd(add(TODAY, 1))) return 'Morgen'
    const d = new Date(date + 'T12:00:00')
    return `${d.getDate()}. ${MSHORT[d.getMonth()]}`
  }
  function badgeStyle(type: string) {
    if (type === 'family')   return S.badgeFamily
    if (type === 'cycle')    return S.badgeCycle
    return S.badgePersonal
  }
  function badgeLabel(type: string) {
    if (type === 'family')   return 'Familie'
    if (type === 'cycle')    return '♀ Zyklus'
    return 'Persönlich'
  }

  return (
    <>
      {/* Google Fonts laden */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      <div style={S.page}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerDeco1} />
          <div style={S.headerDeco2} />

          {/* Logo + Avatar */}
          <div style={S.headerRow}>
            <span style={S.logo}>FamilyHub</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Glocke */}
              <button style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.8)', fontSize: 16 }}>
                🔔
              </button>
              {/* Avatar */}
              <div style={S.avatarRing}>
                <div style={S.avatarInner}>MF</div>
              </div>
            </div>
          </div>

          {/* Greeting */}
          <div style={S.greeting}>
            {greeting},<br />
            <span style={S.greetingAccent}>Marie!</span>
          </div>
          <div style={S.subDate}>
            {TODAY.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Wetter + Stats */}
          <div style={S.weatherRow}>
            <div style={S.weatherPill}>
              <span style={{ fontSize: 20 }}>🌤</span>
              <span style={S.weatherTemp}>{weather ? `${weather.temp}°` : '--°'}</span>
              <span style={S.weatherDesc}>{weather?.desc ?? 'Grettstadt'}</span>
            </div>
            <div style={S.statRow}>
              {[
                { val: events.filter(e => e.date >= fd(TODAY) && e.date <= fd(add(TODAY, 7))).length, lbl: 'Termine' },
                { val: todos.filter(t => !t.done).length, lbl: 'Aufgaben' },
              ].map(s => (
                <div key={s.lbl} style={S.statPill}>
                  <div style={S.statVal}>{s.val}</div>
                  <div style={S.statLbl}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={S.content}>

          {/* ── Diese Woche ─────────────────────────────────── */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>Diese Woche</span>
              <button style={S.cardLink} onClick={() => router.push('/kalender')}>Kalender →</button>
            </div>

            {/* Wochentage */}
            <div style={S.weekStrip}>
              {weekDays.map(d => {
                const ds   = fd(d)
                const isT  = ds === fd(TODAY)
                const isSel = ds === fd(selectedDate)
                const devs = events.filter(e => e.date === ds)
                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDate(new Date(ds + 'T12:00:00'))}
                    style={{
                      flexShrink: 0, width: 46, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', padding: '10px 0 8px', borderRadius: 16, cursor: 'pointer',
                      border: isSel && !isT ? '1.5px solid #bfdbfe' : '1.5px solid transparent',
                      background: isT ? '#2563eb' : isSel ? '#eff6ff' : 'transparent',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: isT ? 'rgba(255,255,255,.7)' : '#94a3b8' }}>
                      {DAYS[d.getDay()]}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 600, color: isT ? '#fff' : isSel ? '#2563eb' : '#0f172a', marginTop: 2, lineHeight: 1 }}>
                      {d.getDate()}
                    </span>
                    <div style={{ display: 'flex', gap: 3, marginTop: 4, height: 6, alignItems: 'center' }}>
                      {devs.slice(0, 2).map(e => (
                        <div key={e.id} style={{ width: 5, height: 5, borderRadius: '50%', background: isT ? 'rgba(255,255,255,.6)' : e.color }} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Tagesdetails */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                {selectedDate.getDate()}. {MONTHS[selectedDate.getMonth()]} · {dayEvents.length} Termin{dayEvents.length !== 1 ? 'e' : ''}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Keine Termine heute</div>
              ) : (
                dayEvents.map(e => (
                  <div key={e.id} style={{ ...S.eventRow, borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ ...S.eventTimeCol }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>{e.time || 'Ganztag'}</span>
                    </div>
                    <div style={{ ...S.eventLine, background: e.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.eventTitle}>{e.title}</div>
                      <div style={S.eventMeta}>{e.type === 'family' ? 'Familie' : e.type === 'cycle' ? 'Zyklus' : 'Persönlich'}{e.desc ? ` · ${e.desc}` : ''}</div>
                    </div>
                    <span style={badgeStyle(e.type)}>{badgeLabel(e.type)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Nächste Termine ─────────────────────────────── */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>Nächste Termine</span>
              <button style={S.cardLink} onClick={() => router.push('/kalender')}>Alle →</button>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Keine Termine</div>
            ) : (
              upcoming.map(e => (
                <div key={e.id} style={{ ...S.eventRow }}>
                  <div style={S.eventTimeCol}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{eventLabel(e.date)}</div>
                    <div style={{ fontSize: 10, color: '#cbd5e1' }}>{e.time}</div>
                  </div>
                  <div style={{ ...S.eventLine, background: e.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...S.eventTitle, fontSize: 14 }}>{e.title}</div>
                    <div style={S.eventMeta}>{e.type === 'family' ? 'Familienkalender' : e.type === 'cycle' ? 'Zyklus' : 'Persönlicher Kalender'}</div>
                  </div>
                  <span style={badgeStyle(e.type)}>{badgeLabel(e.type)}</span>
                </div>
              ))
            )}
            <button style={S.ctaBtn} onClick={() => router.push('/kalender')}>
              <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Termin hinzufügen
            </button>
          </div>

          {/* ── Aufgaben ─────────────────────────────────────── */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>Aufgaben</span>
              <button style={S.cardLink} onClick={() => router.push('/aufgaben')}>Alle →</button>
            </div>
            {openTodos.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Alle erledigt 🎉</div>
            ) : (
              openTodos.map(t => (
                <div key={t.id} style={{ ...S.todoRow }}>
                  <button
                    onClick={() => toggleTodo(t.id)}
                    style={S.todoCheck}
                    title="Erledigt markieren"
                  />
                  <span style={{ fontSize: 14, color: '#0f172a', flex: 1 }}>{t.text}</span>
                </div>
              ))
            )}
            <div style={S.quickAdd}>
              <input
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
                placeholder="Neue Aufgabe…"
                style={S.qaInput}
              />
              <button
                onClick={startVoice}
                style={{ ...S.qaBtnMic, background: listening ? '#fee2e2' : '#f1f5f9', color: listening ? '#e11d48' : '#64748b' }}
                title="Spracheingabe"
              >
                🎤
              </button>
              <button onClick={addTodo} style={S.qaBtnPrimary}>+</button>
            </div>
          </div>

          {/* ── Schnellzugriff ───────────────────────────────── */}
          <div style={{ ...S.cardTitle, marginBottom: 12 }}>Schnellzugriff</div>
          <div style={S.shortcutGrid}>
            {[
              { label: 'Einkauf',  emoji: '🛒', bg: '#eff6ff', path: '/einkaufsliste' },
              { label: 'Rezepte',  emoji: '👨‍🍳', bg: '#f0fdf4', path: '/rezepte'      },
              { label: 'Analyse',  emoji: '📊', bg: '#f5f3ff', path: '/analyse'       },
            ].map(item => (
              <button key={item.path} style={S.scCard} onClick={() => router.push(item.path)}>
                <div style={{ ...S.scIcon, background: item.bg }}>
                  <span>{item.emoji}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Bottom Navigation ────────────────────────────── */}
        <nav style={S.bottomNav}>
          {[
            { label: 'Start',    emoji: '🏠', path: '/dashboard',    active: true  },
            { label: 'Kalender', emoji: '📅', path: '/kalender',     active: false },
            { label: 'Aufgaben', emoji: '✅', path: '/aufgaben',     active: false },
            { label: 'Einkauf',  emoji: '🛒', path: '/einkaufsliste',active: false },
            { label: 'Rezepte',  emoji: '🍳', path: '/rezepte',      active: false },
            { label: 'Analyse',  emoji: '📊', path: '/analyse',      active: false },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{ ...S.navBtn, color: item.active ? '#2563eb' : '#94a3b8' }}
            >
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.2, color: item.active ? '#2563eb' : '#94a3b8' }}>
                {item.label}
              </span>
              {item.active && <span style={{ width: 16, height: 3, borderRadius: 2, background: '#2563eb', marginTop: 2 }} />}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}