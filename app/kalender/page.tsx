'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type CalType   = 'personal' | 'family' | 'cycle'
type CalView   = 'tag' | 'woche' | 'monat' | 'jahr'
type CalFilter = 'all' | 'personal' | 'family' | 'cycle' | 'holiday'

interface CalEvent {
  id: number; title: string; date: string; time: string
  type: CalType; color: string; desc: string
}

const HOLIDAYS: Record<string, { name: string; abbr: string }> = {
  '01-01': { name: 'Neujahr',             abbr: 'ALL'      },
  '01-06': { name: 'Heilige Drei Könige', abbr: 'BY,BW,ST' },
  '04-18': { name: 'Karfreitag',          abbr: 'ALL'      },
  '04-20': { name: 'Ostersonntag',        abbr: 'ALL'      },
  '04-21': { name: 'Ostermontag',         abbr: 'ALL'      },
  '05-01': { name: 'Tag der Arbeit',      abbr: 'ALL'      },
  '05-29': { name: 'Christi Himmelfahrt', abbr: 'ALL'      },
  '06-08': { name: 'Pfingstsonntag',      abbr: 'ALL'      },
  '06-09': { name: 'Pfingstmontag',       abbr: 'ALL'      },
  '06-19': { name: 'Fronleichnam',        abbr: 'BY,BW,HE' },
  '08-15': { name: 'Mariä Himmelfahrt',   abbr: 'BY,SL'    },
  '10-03': { name: 'Tag d. Dt. Einheit',  abbr: 'ALL'      },
  '11-01': { name: 'Allerheiligen',       abbr: 'BY,BW,NW' },
  '12-25': { name: '1. Weihnachtstag',    abbr: 'ALL'      },
  '12-26': { name: '2. Weihnachtstag',    abbr: 'ALL'      },
}
function getHol(ds: string) {
  const [, m, d] = ds.split('-')
  return HOLIDAYS[`${m}-${d}`] ?? null
}

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const MSHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DSHORT = ['Mo','Di','Mi','Do','Fr','Sa','So']
const DLONG  = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
const ECOLORS = ['#2563eb','#16a34a','#d97706','#e11d48','#7c3aed','#0d9488','#db2777','#ea580c']

function fd(d: Date) { return d.toISOString().slice(0, 10) }
function add(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function wkStart(d: Date) { const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m }

const TODAY = new Date()
const DEMO: CalEvent[] = [
  { id: 1, title: 'Kinderarzt Lena', date: fd(add(TODAY, 1)), time: '10:00', type: 'family',   color: '#2563eb', desc: 'Vorsorge U8'     },
  { id: 2, title: 'Yoga',            date: fd(TODAY),         time: '18:00', type: 'personal', color: '#16a34a', desc: ''               },
  { id: 3, title: 'Elternabend',     date: fd(add(TODAY, 2)), time: '19:30', type: 'family',   color: '#7c3aed', desc: 'Schule'          },
  { id: 4, title: 'Zahnarzt',        date: fd(add(TODAY, 5)), time: '14:00', type: 'personal', color: '#e11d48', desc: ''               },
  { id: 5, title: 'Familienessen',   date: fd(add(TODAY, 7)), time: '13:00', type: 'family',   color: '#d97706', desc: "Omas Geburtstag" },
  { id: 6, title: 'Zyklus Start',    date: fd(add(TODAY,-3)), time: '',      type: 'cycle',    color: '#db2777', desc: ''               },
  { id: 7, title: 'Fruchtbare Tage', date: fd(add(TODAY,11)), time: '',      type: 'cycle',    color: '#db2777', desc: 'ca. 5 Tage'     },
]

// Wiederverwendbare Styles
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: 16, marginBottom: 14,
  boxShadow: '0 1px 4px rgba(15,23,42,.07)',
}
const btnStyle = (active: boolean, bg?: string, color?: string): React.CSSProperties => ({
  background: active ? (bg ?? '#2563eb') : 'transparent',
  color: active ? (color ?? '#fff') : '#94a3b8',
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  borderRadius: 12, padding: '7px 0', fontSize: 12, fontWeight: 600, transition: 'all .15s',
})
const badgeStyle = (type: string): React.CSSProperties => {
  if (type === 'family')   return { background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }
  if (type === 'cycle')    return { background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }
  return                          { background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }
}

export default function KalenderPage() {
  const router = useRouter()

  const [view,     setView]     = useState<CalView>('monat')
  const [filter,   setFilter]   = useState<CalFilter>('all')
  const [curYear,  setCurYear]  = useState(TODAY.getFullYear())
  const [curMonth, setCurMonth] = useState(TODAY.getMonth())
  const [selDate,  setSelDate]  = useState(TODAY)
  const [events,   setEvents]   = useState<CalEvent[]>(DEMO)
  const [nextId,   setNextId]   = useState(20)

  // Modal
  const [modal,     setModal]     = useState(false)
  const [editId,    setEditId]    = useState<number | null>(null)
  const [evTitle,   setEvTitle]   = useState('')
  const [evDate,    setEvDate]    = useState(fd(TODAY))
  const [evTime,    setEvTime]    = useState('')
  const [evDesc,    setEvDesc]    = useState('')
  const [evType,    setEvType]    = useState<CalType>('personal')
  const [evColor,   setEvColor]   = useState('#2563eb')
  const [listening, setListening] = useState(false)

  const showHol = filter === 'all' || filter === 'holiday'

  const filtered = useCallback(() => {
    if (filter === 'all') return events
    if (filter === 'holiday') return []
    return events.filter(e => e.type === filter)
  }, [events, filter])

  const evOf = (ds: string) => filtered().filter(e => e.date === ds)

  function nav(dir: number) {
    if (view === 'jahr') { setCurYear(y => y + dir); return }
    let m = curMonth + dir, y = curYear
    if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
    setCurMonth(m); setCurYear(y)
  }

  function changeView(v: CalView) {
    setView(v)
    if (v !== 'jahr') { setCurMonth(selDate.getMonth()); setCurYear(selDate.getFullYear()) }
  }

  function openAdd(ds?: string) {
    setEditId(null); setEvTitle(''); setEvDate(ds ?? fd(selDate))
    setEvTime(''); setEvDesc(''); setEvType('personal'); setEvColor('#2563eb')
    setModal(true)
  }
  function openEdit(id: number) {
    const e = events.find(x => x.id === id); if (!e) return
    setEditId(id); setEvTitle(e.title); setEvDate(e.date)
    setEvTime(e.time); setEvDesc(e.desc); setEvType(e.type); setEvColor(e.color)
    setModal(true)
  }
  function save() {
    if (!evTitle.trim()) { alert('Bitte Titel eingeben'); return }
    const ev: CalEvent = { id: editId ?? nextId, title: evTitle.trim(), date: evDate, time: evTime, desc: evDesc, type: evType, color: evColor }
    if (editId) setEvents(prev => prev.map(e => e.id === editId ? ev : e))
    else { setEvents(prev => [...prev, ev]); setNextId(n => n + 1) }
    setModal(false)
  }
  function del(id: number) {
    if (confirm('Termin löschen?')) setEvents(prev => prev.filter(e => e.id !== id))
  }
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Bitte Chrome nutzen'); return }
    const r = new SR(); r.lang = 'de-DE'; r.interimResults = false
    r.onstart = () => setListening(true)
    r.onresult = (e: any) => { setEvTitle(e.results[0][0].transcript); setListening(false) }
    r.onerror = r.onend = () => setListening(false)
    r.start()
  }

  const selDs   = fd(selDate)
  const todayDs = fd(TODAY)
  const calTitle = view === 'jahr' ? String(curYear)
    : view === 'tag' ? `${selDate.getDate()}. ${MONTHS[selDate.getMonth()]}`
    : `${MONTHS[curMonth]} ${curYear}`

  const filterChips = [
    { id: 'all',     label: 'Alle',        bg: '#f1f5f9', color: '#475569' },
    { id: 'family',  label: 'Familie',     bg: '#dbeafe', color: '#1d4ed8' },
    { id: 'personal',label: 'Persönlich',  bg: '#dcfce7', color: '#15803d' },
    { id: 'cycle',   label: 'Zyklus ♀',   bg: '#fce7f3', color: '#be185d' },
    { id: 'holiday', label: 'Feiertage',   bg: '#fef9c3', color: '#854d0e' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        .cal-cell:hover { background: #f1f5f9 !important; }
        .act-btn:hover { background: #e0e7ff !important; color: #4338ca !important; }
        .del-btn:hover { background: #fee2e2 !important; color: #dc2626 !important; }
        input[type=date], input[type=time] { color-scheme: light; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans','Segoe UI',sans-serif", paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ background: '#1e3a5f', padding: '48px 20px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(37,99,235,.3)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <button onClick={() => router.push('/dashboard')} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => nav(-1)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 18, color: '#fff', minWidth: 160, textAlign: 'center' }}>{calTitle}</span>
              <button onClick={() => nav(1)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
            <button onClick={() => openAdd()} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300 }}>+</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>

          {/* ── View Tabs ──────────────────────────────────────── */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 14, padding: 3, gap: 2, marginBottom: 14 }}>
            {(['tag','woche','monat','jahr'] as CalView[]).map(v => (
              <button key={v} onClick={() => changeView(v)} style={{
                flex: 1, padding: '8px 0', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, transition: 'all .15s',
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#2563eb' : '#94a3b8',
                boxShadow: view === v ? '0 1px 4px rgba(15,23,42,.1)' : 'none',
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Filter Chips ───────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 16, paddingBottom: 2 }}>
            {filterChips.map(c => (
              <button key={c.id} onClick={() => setFilter(c.id as CalFilter)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `2px solid ${filter === c.id ? c.color : 'transparent'}`,
                background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* ── Ansichten ─────────────────────────────────────── */}
          {view === 'monat' && <MonatView year={curYear} month={curMonth} evOf={evOf} selDs={selDs} todayDs={todayDs} showHol={showHol} onSel={ds => { setSelDate(new Date(ds + 'T12:00:00')); setCurMonth(new Date(ds + 'T12:00:00').getMonth()) }} onEdit={openEdit} onDel={del} />}
          {view === 'woche' && <WocheView base={selDate} evOf={evOf} selDs={selDs} todayDs={todayDs} showHol={showHol} onSel={ds => { setSelDate(new Date(ds + 'T12:00:00')) }} onEdit={openEdit} onDel={del} />}
          {view === 'tag'   && <TagView date={selDate} evOf={evOf} showHol={showHol} onEdit={openEdit} onDel={del} />}
          {view === 'jahr'  && <JahrView year={curYear} evOf={evOf} todayDs={todayDs} onSel={ds => { setSelDate(new Date(ds + 'T12:00:00')); setCurMonth(new Date(ds + 'T12:00:00').getMonth()); setCurYear(new Date(ds + 'T12:00:00').getFullYear()); changeView('monat') }} />}

          {/* ── FAB ─────────────────────────────────────────── */}
          <button onClick={() => openAdd()} style={{
            width: '100%', height: 50, borderRadius: 16, border: 'none', cursor: 'pointer',
            background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16,
            boxShadow: '0 4px 14px rgba(37,99,235,.3)',
          }}>
            <span style={{ fontSize: 20, fontWeight: 300 }}>+</span> Termin hinzufügen
          </button>
        </div>

        {/* ── Modal ─────────────────────────────────────────── */}
        {modal && (
          <div onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
               style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
            <div style={{ background: '#fff', width: '100%', borderRadius: '28px 28px 0 0', padding: 24, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(15,23,42,.15)' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 20, color: '#0f172a' }}>
                  {editId ? 'Termin bearbeiten' : 'Neuer Termin'}
                </span>
                <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>

              {/* Felder */}
              {[
                { label: 'Titel', content: (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="z. B. Arzttermin"
                           style={{ flex: 1, height: 44, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa' }} />
                    <button onClick={startVoice} style={{ width: 44, height: 44, borderRadius: 14, border: 'none', cursor: 'pointer', background: listening ? '#fee2e2' : '#f1f5f9', color: listening ? '#e11d48' : '#64748b', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎤</button>
                  </div>
                )},
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>{f.label}</div>
                  {f.content}
                </div>
              ))}

              {/* Datum + Zeit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[{ label: 'Datum', type: 'date', val: evDate, set: setEvDate }, { label: 'Uhrzeit', type: 'time', val: evTime, set: setEvTime }].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>{f.label}</div>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                           style={{ width: '100%', height: 44, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa' }} />
                  </div>
                ))}
              </div>

              {/* Notiz */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Notiz</div>
                <input value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Optional…"
                       style={{ width: '100%', height: 44, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa' }} />
              </div>

              {/* Kalender-Typ */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Kalender</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { id: 'personal', label: 'Persönlich', ac: '#16a34a', ab: '#f0fdf4' },
                    { id: 'family',   label: 'Familie',    ac: '#2563eb', ab: '#eff6ff' },
                    { id: 'cycle',    label: 'Zyklus ♀',  ac: '#db2777', ab: '#fce7f3' },
                  ].map(t => (
                    <button key={t.id} onClick={() => { setEvType(t.id as CalType); setEvColor(t.ac) }}
                            style={{ padding: '9px 0', borderRadius: 14, border: `2px solid ${evType === t.id ? t.ac : '#e2e8f0'}`, background: evType === t.id ? t.ab : '#fafafa', color: evType === t.id ? t.ac : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farbe */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Farbe</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ECOLORS.map(c => (
                    <button key={c} onClick={() => setEvColor(c)} style={{
                      width: 30, height: 30, borderRadius: '50%', border: `3px solid ${evColor === c ? '#0f172a' : 'transparent'}`,
                      background: c, cursor: 'pointer', transform: evColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all .15s',
                    }} />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, height: 48, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#f1f5f9', color: '#64748b', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>Abbrechen</button>
                <button onClick={save} style={{ flex: 1, height: 48, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,.3)' }}>💾 Speichern</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Navigation ─────────────────────────────── */}
        <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', zIndex: 100, boxShadow: '0 -4px 20px rgba(15,23,42,.08)' }}>
          {[
            { label: 'Start',    emoji: '🏠', path: '/dashboard',    active: false },
            { label: 'Kalender', emoji: '📅', path: '/kalender',     active: true  },
            { label: 'Aufgaben', emoji: '✅', path: '/aufgaben',     active: false },
            { label: 'Einkauf',  emoji: '🛒', path: '/einkaufsliste',active: false },
            { label: 'Rezepte',  emoji: '🍳', path: '/rezepte',      active: false },
            { label: 'Analyse',  emoji: '📊', path: '/analyse',      active: false },
          ].map(item => (
            <button key={item.path} onClick={() => router.push(item.path)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 12px', gap: 3, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: item.active ? '#2563eb' : '#94a3b8' }}>{item.label}</span>
              {item.active && <span style={{ width: 16, height: 3, borderRadius: 2, background: '#2563eb' }} />}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

// ─── Monatsansicht ────────────────────────────────────────────────────────────
function MonatView({ year, month, evOf, selDs, todayDs, showHol, onSel, onEdit, onDel }:
  { year: number; month: number; evOf: (ds: string) => CalEvent[]; selDs: string; todayDs: string; showHol: boolean;
    onSel: (ds: string) => void; onEdit: (id: number) => void; onDel: (id: number) => void }) {

  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0)
  const sw = (first.getDay() + 6) % 7

  return (
    <>
      {/* Wochentage Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
        {DSHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8, padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>)}
      </div>

      {/* Kalender-Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 14 }}>
        {Array.from({ length: sw }, (_, i) => <div key={`p${i}`} />)}
        {Array.from({ length: last.getDate() }, (_, i) => {
          const d  = i + 1
          const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const isT = ds === todayDs, isSel = ds === selDs
          const hol = showHol ? getHol(ds) : null
          const evs = evOf(ds)
          return (
            <div key={d} className="cal-cell" onClick={() => onSel(ds)} style={{
              minHeight: 52, padding: '4px 2px 2px', borderRadius: 12, cursor: 'pointer', transition: 'background .12s',
              background: isSel && !isT ? '#eff6ff' : 'transparent',
              outline: isSel && !isT ? '1.5px solid #bfdbfe' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: isT ? 700 : 500,
                background: isT ? '#2563eb' : 'transparent',
                color: isT ? '#fff' : hol ? '#d97706' : isSel ? '#2563eb' : '#0f172a',
              }}>{d}</div>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                {evs.slice(0, 2).map(e => <div key={e.id} style={{ width: 5, height: 5, borderRadius: '50%', background: e.color }} />)}
              </div>
              {hol && <div style={{ fontSize: 7, color: '#d97706', marginTop: 1, textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', fontWeight: 700 }}>{hol.abbr === 'ALL' ? hol.name.split(' ')[0] : hol.abbr}</div>}
            </div>
          )
        })}
      </div>

      <DayPanel ds={selDs} evOf={evOf} showHol={showHol} onEdit={onEdit} onDel={onDel} />
    </>
  )
}

// ─── Wochenansicht ────────────────────────────────────────────────────────────
function WocheView({ base, evOf, selDs, todayDs, showHol, onSel, onEdit, onDel }:
  { base: Date; evOf: (ds: string) => CalEvent[]; selDs: string; todayDs: string; showHol: boolean;
    onSel: (ds: string) => void; onEdit: (id: number) => void; onDel: (id: number) => void }) {

  const days = Array.from({ length: 7 }, (_, i) => add(wkStart(base), i))

  return (
    <div>
      <div style={{ ...cardStyle, padding: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {days.map(d => {
            const ds = fd(d), isT = ds === todayDs, isSel = ds === selDs
            const evs = evOf(ds)
            return (
              <button key={ds} onClick={() => onSel(ds)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: isT ? '#2563eb' : isSel ? '#eff6ff' : 'transparent', transition: 'all .15s',
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: isT ? 'rgba(255,255,255,.7)' : '#94a3b8' }}>{DSHORT[(d.getDay() + 6) % 7]}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: isT ? '#fff' : isSel ? '#2563eb' : '#0f172a', marginTop: 2 }}>{d.getDate()}</span>
                <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                  {evs.slice(0, 2).map(e => <div key={e.id} style={{ width: 4, height: 4, borderRadius: '50%', background: isT ? 'rgba(255,255,255,.6)' : e.color }} />)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {days.map(d => {
        const ds = fd(d), isT = ds === todayDs
        const evs = evOf(ds).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
        const hol = showHol ? getHol(ds) : null
        return (
          <div key={ds} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isT ? '#2563eb' : '#0f172a' }}>
                {DLONG[d.getDay()]}, {d.getDate()}. {MSHORT[d.getMonth()]}
              </span>
              {isT && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#2563eb', color: '#fff', fontWeight: 700 }}>HEUTE</span>}
            </div>
            {hol && <div style={{ background: '#fef9c3', borderRadius: 10, padding: '6px 10px', marginBottom: 8, fontSize: 11, color: '#854d0e', fontWeight: 600 }}>🎉 {hol.name} {hol.abbr !== 'ALL' ? `(${hol.abbr})` : ''}</div>}
            {evs.length === 0
              ? <span style={{ fontSize: 12, color: '#94a3b8' }}>Keine Termine</span>
              : evs.map(e => <EventRow key={e.id} event={e} onEdit={onEdit} onDel={onDel} />)}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tagesansicht ─────────────────────────────────────────────────────────────
function TagView({ date, evOf, showHol, onEdit, onDel }:
  { date: Date; evOf: (ds: string) => CalEvent[]; showHol: boolean; onEdit: (id: number) => void; onDel: (id: number) => void }) {
  const ds = fd(date)
  const hol = showHol ? getHol(ds) : null
  return (
    <div>
      {hol && <div style={{ background: '#fef9c3', borderRadius: 14, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#854d0e', fontWeight: 600 }}>🎉 Feiertag: {hol.name} {hol.abbr !== 'ALL' ? `(${hol.abbr})` : ''}</div>}
      <DayPanel ds={ds} evOf={evOf} showHol={false} onEdit={onEdit} onDel={onDel} />
    </div>
  )
}

// ─── Jahresansicht ────────────────────────────────────────────────────────────
function JahrView({ year, evOf, todayDs, onSel }:
  { year: number; evOf: (ds: string) => CalEvent[]; todayDs: string; onSel: (ds: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(year, m, 1), last = new Date(year, m + 1, 0)
        const sw = (first.getDay() + 6) % 7
        return (
          <div key={m} style={{ ...cardStyle, padding: 10, marginBottom: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textAlign: 'center', marginBottom: 6 }}>{MSHORT[m]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
              {['M','D','M','D','F','S','S'].map((d, i) => <div key={i} style={{ fontSize: 7, textAlign: 'center', color: '#94a3b8' }}>{d}</div>)}
              {Array.from({ length: sw }, (_, i) => <div key={`p${i}`} />)}
              {Array.from({ length: last.getDate() }, (_, i) => {
                const d  = i + 1
                const ds = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const isT = ds === todayDs, hasEv = evOf(ds).length > 0, hol = getHol(ds)
                return (
                  <button key={d} onClick={() => onSel(ds)} style={{
                    fontSize: 8, textAlign: 'center', borderRadius: isT ? '50%' : 3,
                    background: isT ? '#2563eb' : hasEv ? '#dbeafe' : 'transparent',
                    color: isT ? '#fff' : hasEv ? '#1d4ed8' : hol ? '#d97706' : '#475569',
                    fontStyle: hol && !isT && !hasEv ? 'italic' : 'normal',
                    border: 'none', cursor: 'pointer', padding: '2px 1px', lineHeight: '14px',
                    fontWeight: hasEv ? 700 : 400,
                  }}>{d}</button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tages-Panel ─────────────────────────────────────────────────────────────
function DayPanel({ ds, evOf, showHol, onEdit, onDel }:
  { ds: string; evOf: (ds: string) => CalEvent[]; showHol: boolean; onEdit: (id: number) => void; onDel: (id: number) => void }) {
  const d   = new Date(ds + 'T12:00:00')
  const evs = evOf(ds).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const hol = showHol ? getHol(ds) : null
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.4, marginBottom: 10 }}>
        {d.getDate()}. {MONTHS[d.getMonth()]} · {evs.length} Termin{evs.length !== 1 ? 'e' : ''}
      </div>
      {hol && <div style={{ background: '#fef9c3', borderRadius: 10, padding: '6px 10px', marginBottom: 10, fontSize: 11, color: '#854d0e', fontWeight: 600 }}>🎉 {hol.name} {hol.abbr !== 'ALL' ? `(${hol.abbr})` : ''}</div>}
      {evs.length === 0
        ? <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Keine Termine</div>
        : evs.map(e => <EventRow key={e.id} event={e} onEdit={onEdit} onDel={onDel} />)}
    </div>
  )
}

// ─── Event Row ────────────────────────────────────────────────────────────────
function EventRow({ event: e, onEdit, onDel }: { event: CalEvent; onEdit: (id: number) => void; onDel: (id: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: '#f8fafc', marginBottom: 6 }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 3, background: e.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.title}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
          {e.time || 'Ganztag'} · {e.type === 'family' ? 'Familie' : e.type === 'cycle' ? 'Zyklus' : 'Persönlich'}{e.desc ? ` · ${e.desc}` : ''}
        </div>
      </div>
      <span style={badgeStyle(e.type)}>{e.type === 'family' ? 'Fam' : e.type === 'cycle' ? '♀' : 'Pers'}</span>
      <button className="act-btn" onClick={() => onEdit(e.id)} style={{ width: 28, height: 28, borderRadius: 9, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, transition: 'all .15s' }}>✏️</button>
      <button className="del-btn" onClick={() => onDel(e.id)} style={{ width: 28, height: 28, borderRadius: 9, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13, transition: 'all .15s' }}>🗑</button>
    </div>
  )
}