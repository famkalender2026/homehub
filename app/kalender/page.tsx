'use client'

// ═══════════════════════════════════════════════════════════════════════════
// KALENDER PAGE — vollständig eigenständig, keine externen Imports nötig
// Einfach in app/kalender/page.tsx (oder app/(app)/kalender/page.tsx) ablegen
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Typen ────────────────────────────────────────────────────────────────────
type CalType   = 'personal' | 'family' | 'cycle'
type CalView   = 'tag' | 'woche' | 'monat' | 'jahr'
type CalFilter = 'all' | 'personal' | 'family' | 'cycle' | 'holiday'

interface CalEvent {
  id: number
  title: string
  date: string        // 'YYYY-MM-DD'
  time: string
  type: CalType
  color: string
  desc: string
  showPersonal?: boolean  // Familienterm. auch im pers. Kalender
}

// ─── Korrigierte Feiertage 2025 ───────────────────────────────────────────────
// ⚠️  31.10. (Reformationstag) ist KEIN Feiertag in Bayern!
//     Nur in: BB, HB, HH, MV, NI, SN, ST, TH
const HOLIDAYS: Record<string, { name: string; abbr: string; national: boolean }> = {
  '01-01': { name: 'Neujahr',             abbr: 'ALL',           national: true  },
  '01-06': { name: 'Heilige Drei Könige', abbr: 'BY,BW,ST',      national: false },
  '04-18': { name: 'Karfreitag',          abbr: 'ALL',           national: true  },
  '04-20': { name: 'Ostersonntag',        abbr: 'ALL',           national: true  },
  '04-21': { name: 'Ostermontag',         abbr: 'ALL',           national: true  },
  '05-01': { name: 'Tag der Arbeit',      abbr: 'ALL',           national: true  },
  '05-29': { name: 'Christi Himmelfahrt', abbr: 'ALL',           national: true  },
  '06-08': { name: 'Pfingstsonntag',      abbr: 'ALL',           national: true  },
  '06-09': { name: 'Pfingstmontag',       abbr: 'ALL',           national: true  },
  '06-19': { name: 'Fronleichnam',        abbr: 'BY,BW,HE,NW+',  national: false },
  '08-15': { name: 'Mariä Himmelfahrt',   abbr: 'BY,SL',         national: false },
  '10-03': { name: 'Tag d. Dt. Einheit',  abbr: 'ALL',           national: true  },
  // 10-31 Reformationstag absichtlich NICHT drin (kein BY-Feiertag)
  '11-01': { name: 'Allerheiligen',       abbr: 'BY,BW,NW,RP,SL', national: false },
  '12-25': { name: '1. Weihnachtstag',    abbr: 'ALL',           national: true  },
  '12-26': { name: '2. Weihnachtstag',    abbr: 'ALL',           national: true  },
}

function getHoliday(ds: string) {
  const [, m, d] = ds.split('-')
  return HOLIDAYS[`${m}-${d}`] ?? null
}

// ─── Konstanten ───────────────────────────────────────────────────────────────
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const MSHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DSHORT = ['Mo','Di','Mi','Do','Fr','Sa','So']
const DLONG  = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
const COLORS  = ['#2563eb','#16a34a','#d97706','#e11d48','#7c3aed','#0d9488','#db2777','#ea580c']

// Benutzer-Einstellungen (später aus Supabase/Context laden)
const USER = {
  name: 'Marie',
  gender: 'female' as const,    // 'female' | 'male' | 'other'
  showCycle: true,              // Zyklus-Tab anzeigen (nur bei female)
  bundesland: 'BY',
}
const SHOW_CYCLE = USER.gender === 'female' && USER.showCycle

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fd(d: Date): string { return d.toISOString().slice(0, 10) }
function add(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function wkStart(d: Date): Date {
  const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m
}

// ─── Demo-Daten ───────────────────────────────────────────────────────────────
const TODAY = new Date()
const DEMO: CalEvent[] = [
  { id: 1, title: 'Kinderarzt Lena',  date: fd(add(TODAY, 1)), time: '10:00', type: 'family',   color: '#2563eb', desc: 'U8',       showPersonal: true  },
  { id: 2, title: 'Yoga',             date: fd(TODAY),         time: '18:00', type: 'personal', color: '#16a34a', desc: '',         showPersonal: false },
  { id: 3, title: 'Elternabend',      date: fd(add(TODAY, 2)), time: '19:30', type: 'family',   color: '#7c3aed', desc: 'Schule',   showPersonal: false },
  { id: 4, title: 'Zahnarzt',         date: fd(add(TODAY, 5)), time: '14:00', type: 'personal', color: '#e11d48', desc: '',         showPersonal: false },
  { id: 5, title: 'Familienessen',    date: fd(add(TODAY, 7)), time: '13:00', type: 'family',   color: '#d97706', desc: "Omas Geb.",showPersonal: true  },
  { id: 6, title: 'Zyklus Start',     date: fd(add(TODAY,-3)), time: '',      type: 'cycle',    color: '#db2777', desc: '',         showPersonal: false },
  { id: 7, title: 'Fruchtbare Tage',  date: fd(add(TODAY,11)), time: '',      type: 'cycle',    color: '#db2777', desc: 'ca. 5 T',  showPersonal: false },
]

// ─── Navigation Items ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',    label: 'Start',    emoji: '🏠', path: '/dashboard'     },
  { id: 'kalender',     label: 'Kalender', emoji: '📅', path: '/kalender'      },
  { id: 'aufgaben',     label: 'Aufgaben', emoji: '✅', path: '/aufgaben'      },
  { id: 'einkaufsliste',label: 'Einkauf',  emoji: '🛒', path: '/einkaufsliste' },
  { id: 'rezepte',      label: 'Rezepte',  emoji: '🍳', path: '/rezepte'       },
  { id: 'wetter',       label: 'Wetter',   emoji: '🌤', path: '/wetter'        },
]

// ─── Spracheingabe Hook ───────────────────────────────────────────────────────
function useSpeech(onResult: (t: string) => void) {
  const [active, setActive] = useState(false)
  const ref = useRef<any>(null)

  const toggle = useCallback(() => {
    if (active) { ref.current?.stop(); return }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Spracheingabe nicht unterstützt.\n\nBitte nutze Chrome (Android/Desktop).\nSafari unterstützt diese Funktion leider nicht.')
      return
    }
    const r = new SR()
    ref.current = r
    r.lang = 'de-DE'
    r.continuous = false
    r.interimResults = false

    r.onstart  = () => setActive(true)
    r.onresult = (e: any) => { onResult(e.results[0]?.[0]?.transcript ?? ''); }
    r.onerror  = (e: any) => {
      if (e.error === 'not-allowed')
        alert('Mikrofon-Zugriff verweigert.\nBitte in den Browser-Einstellungen erlauben.')
      setActive(false)
    }
    r.onend = () => setActive(false)

    // Auf Android: erst getUserMedia anfragen, dann starten
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => r.start())
        .catch(() => {
          alert('Mikrofon-Zugriff wurde verweigert.')
          setActive(false)
        })
    } else {
      r.start()
    }
  }, [active, onResult])

  return { active, toggle }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE
// ═══════════════════════════════════════════════════════════════════════════════
export default function KalenderPage() {
  const router = useRouter()

  const [view,     setViewState] = useState<CalView>('monat')
  const [filter,   setFilter]    = useState<CalFilter>('all')
  const [curYear,  setCurYear]   = useState(TODAY.getFullYear())
  const [curMonth, setCurMonth]  = useState(TODAY.getMonth())
  const [selDate,  setSelDate]   = useState<Date>(TODAY)
  const [events,   setEvents]    = useState<CalEvent[]>(DEMO)
  const [nextId,   setNextId]    = useState(20)
  const [desktop,  setDesktop]   = useState(false)

  // Modal
  const [modal,      setModal]     = useState(false)
  const [editId,     setEditId]    = useState<number | null>(null)
  const [evTitle,    setEvTitle]   = useState('')
  const [evDate,     setEvDate]    = useState(fd(TODAY))
  const [evTime,     setEvTime]    = useState('')
  const [evDesc,     setEvDesc]    = useState('')
  const [evType,     setEvType]    = useState<CalType>('personal')
  const [evColor,    setEvColor]   = useState('#2563eb')
  const [evShowPers, setEvShowPers]= useState(false)

  const speech = useSpeech(t => setEvTitle(p => p ? p + ' ' + t : t))

  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth >= 768)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // ── Filter ────────────────────────────────────────────────────────────────
  const showHol = filter === 'all' || filter === 'holiday'

  const filterEvs = useCallback((evs: CalEvent[]): CalEvent[] => {
    return evs.filter(e => {
      if (e.type === 'cycle' && !SHOW_CYCLE) return false
      if (filter === 'all')      return true
      if (filter === 'holiday')  return false
      if (filter === 'family')   return e.type === 'family'
      if (filter === 'personal') return (
        e.type === 'personal' ||
        (e.type === 'family' && e.showPersonal === true) ||
        (e.type === 'cycle' && SHOW_CYCLE)
      )
      if (filter === 'cycle')    return e.type === 'cycle' && SHOW_CYCLE
      return true
    })
  }, [filter])

  const evOf = (ds: string) => filterEvs(events.filter(e => e.date === ds))

  // ── Navigation ────────────────────────────────────────────────────────────
  function nav(dir: number) {
    if (view === 'jahr') { setCurYear(y => y + dir); return }
    let m = curMonth + dir, y = curYear
    if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
    setCurMonth(m); setCurYear(y)
  }
  function changeView(v: CalView) {
    setViewState(v)
    if (v !== 'jahr') { setCurMonth(selDate.getMonth()); setCurYear(selDate.getFullYear()) }
  }
  function selDay(ds: string) {
    setSelDate(new Date(ds + 'T12:00:00'))
    setCurMonth(new Date(ds + 'T12:00:00').getMonth())
    setCurYear(new Date(ds + 'T12:00:00').getFullYear())
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openAdd(ds?: string) {
    setEditId(null); setEvTitle(''); setEvDate(ds ?? fd(selDate))
    setEvTime(''); setEvDesc(''); setEvType('personal')
    setEvColor('#2563eb'); setEvShowPers(false)
    setModal(true)
  }
  function openEdit(id: number) {
    const e = events.find(x => x.id === id); if (!e) return
    setEditId(id); setEvTitle(e.title); setEvDate(e.date)
    setEvTime(e.time); setEvDesc(e.desc); setEvType(e.type)
    setEvColor(e.color); setEvShowPers(e.showPersonal ?? false)
    setModal(true)
  }
  function pickType(t: CalType) {
    setEvType(t)
    setEvColor(t === 'family' ? '#2563eb' : t === 'cycle' ? '#db2777' : '#16a34a')
  }
  function save() {
    if (!evTitle.trim()) { alert('Bitte Titel eingeben'); return }
    const ev: CalEvent = { id: editId ?? nextId, title: evTitle.trim(), date: evDate, time: evTime, desc: evDesc, type: evType, color: evColor, showPersonal: evShowPers }
    if (editId) setEvents(p => p.map(e => e.id === editId ? ev : e))
    else { setEvents(p => [...p, ev]); setNextId(n => n + 1) }
    setModal(false)
  }
  function del(id: number) {
    if (confirm('Termin löschen?')) setEvents(p => p.filter(e => e.id !== id))
  }

  const selDs   = fd(selDate)
  const todayDs = fd(TODAY)

  const calTitle = view === 'jahr' ? String(curYear)
    : view === 'tag' ? `${selDate.getDate()}. ${MONTHS[selDate.getMonth()]} ${selDate.getFullYear()}`
    : `${MONTHS[curMonth]} ${curYear}`

  const chips = [
    { id: 'all',      label: 'Alle',       bg: '#f1f5f9', c: '#475569', bc: '#94a3b8' },
    { id: 'family',   label: 'Familie',    bg: '#dbeafe', c: '#1d4ed8', bc: '#93c5fd' },
    { id: 'personal', label: 'Persönlich', bg: '#dcfce7', c: '#15803d', bc: '#86efac' },
    ...(SHOW_CYCLE ? [{ id: 'cycle', label: 'Zyklus ♀', bg: '#fce7f3', c: '#be185d', bc: '#f9a8d4' }] : []),
    { id: 'holiday',  label: 'Feiertage',  bg: '#fef9c3', c: '#854d0e', bc: '#fcd34d' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; }
        .fh-font { font-family: 'DM Sans','Segoe UI',sans-serif; }
        .hov:hover { background: #f1f5f9 !important; }
        .hov-ed:hover { background: #eff6ff !important; color: #2563eb !important; }
        .hov-del:hover { background: #fee2e2 !important; color: #dc2626 !important; }
        .sb-btn:hover:not(.sb-active) { background: rgba(255,255,255,.1) !important; }
        ::-webkit-scrollbar { display: none; }
        input[type=date], input[type=time] { color-scheme: light; }

        @keyframes micPulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(225,29,72,.4); }
          50%      { transform: scale(1.06); box-shadow: 0 0 0 8px rgba(225,29,72,0); }
        }
        .mic-on { animation: micPulse 1.2s infinite; }

        /* ── MODAL: Speichern-Button immer sichtbar ── */
        .modal-wrap {
          position: fixed; inset: 0;
          background: rgba(15,23,42,.5);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 9999;
        }
        .modal-box {
          background: #fff;
          width: 100%; max-width: 520px;
          max-height: 88vh;
          border-radius: 24px 24px 0 0;
          display: flex; flex-direction: column;
          box-shadow: 0 -12px 48px rgba(15,23,42,.2);
        }
        .modal-head { flex-shrink: 0; padding: 14px 20px 10px; border-bottom: 1px solid #f1f5f9; }
        .modal-scroll {
          flex: 1; overflow-y: auto; padding: 14px 20px;
          -webkit-overflow-scrolling: touch;
        }
        .modal-foot {
          flex-shrink: 0;
          padding: 12px 20px;
          border-top: 1px solid #f1f5f9;
          background: #fff;
          padding-bottom: max(14px, env(safe-area-inset-bottom, 14px));
        }
        /* Desktop: zentriertes Floating-Modal */
        @media (min-width: 768px) {
          .modal-wrap { align-items: center; }
          .modal-box  { border-radius: 24px; max-height: 90vh; }
        }
        /* Desktop: Sidebar statt Bottom-Nav */
        @media (min-width: 768px) {
          .bottom-nav { display: none !important; }
          .main-content { margin-left: 64px; }
        }
        @media (max-width: 767px) {
          .sidebar-nav { display: none !important; }
          .main-content { margin-left: 0; padding-bottom: 80px; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }} className="fh-font">

        {/* ── Desktop Sidebar ─────────────────────────────────────── */}
        <nav className="sidebar-nav" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 64, background: '#1e3a5f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0', gap: 4, zIndex: 50 }}>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 12, color: '#93c5fd', marginBottom: 14, letterSpacing: -0.5 }}>FH</div>
          {NAV.map(item => (
            <button key={item.id} onClick={() => router.push(item.path)} title={item.label}
                    className={`sb-btn${item.id === 'kalender' ? ' sb-active' : ''}`}
                    style={{ width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: item.id === 'kalender' ? 'rgba(255,255,255,.18)' : 'transparent', fontFamily: 'inherit', transition: 'background .15s' }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 7.5, fontWeight: 600, color: item.id === 'kalender' ? '#fff' : 'rgba(255,255,255,.4)', letterSpacing: 0.3 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Haupt-Inhalt ────────────────────────────────────────── */}
        <div className="main-content" style={{ flex: 1, minHeight: '100vh', background: '#f8fafc' }}>

          {/* Header */}
          <div style={{ background: '#1e3a5f', padding: '44px 20px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(37,99,235,.28)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => router.push('/dashboard')} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => nav(-1)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 17, color: '#fff', minWidth: 160, textAlign: 'center' }}>{calTitle}</span>
                <button onClick={() => nav(1)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setSelDate(TODAY); setCurMonth(TODAY.getMonth()); setCurYear(TODAY.getFullYear()) }} style={{ height: 34, padding: '0 12px', borderRadius: 10, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Heute</button>
                <button onClick={() => openAdd()} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.18)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,.04)', position: 'sticky', top: 0, zIndex: 40 }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 3, gap: 2 }}>
                {(['tag','woche','monat','jahr'] as CalView[]).map(v => (
                  <button key={v} onClick={() => changeView(v)} style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: view === v ? '#fff' : 'transparent', color: view === v ? '#2563eb' : '#94a3b8', boxShadow: view === v ? '0 1px 4px rgba(15,23,42,.1)' : 'none', transition: 'all .15s' }}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, overflow: 'auto', flex: 1, scrollbarWidth: 'none' }}>
                {chips.map(ch => (
                  <button key={ch.id} onClick={() => setFilter(ch.id as CalFilter)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `2px solid ${filter === ch.id ? ch.bc : 'transparent'}`, background: ch.bg, color: ch.c, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>{ch.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Kalender-Inhalt */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: desktop ? '20px 24px 40px' : '14px 16px 90px' }}>

            {view === 'monat' && (
              desktop ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
                  <MonatGrid year={curYear} month={curMonth} evOf={evOf} selDs={selDs} todayDs={todayDs} showHol={showHol} desktop onSel={selDay} />
                  <div style={{ position: 'sticky', top: 70 }}>
                    <DayPanel ds={selDs} evOf={evOf} showHol={showHol} onEdit={openEdit} onDel={del} onAdd={() => openAdd(selDs)} />
                  </div>
                </div>
              ) : (
                <MonatGrid year={curYear} month={curMonth} evOf={evOf} selDs={selDs} todayDs={todayDs} showHol={showHol} desktop={false} onSel={selDay} onAdd={openAdd} onEdit={openEdit} onDel={del} />
              )
            )}
            {view === 'woche' && <WocheView base={selDate} evOf={evOf} selDs={selDs} todayDs={todayDs} showHol={showHol} onSel={selDay} onEdit={openEdit} onDel={del} />}
            {view === 'tag'   && <TagView date={selDate} evOf={evOf} showHol={showHol} onEdit={openEdit} onDel={del} />}
            {view === 'jahr'  && <JahrView year={curYear} evOf={evOf} todayDs={todayDs} onSel={ds => { selDay(ds); changeView('monat') }} />}

          </div>

          {/* Mobile FAB */}
          <button onClick={() => openAdd()} style={{ position: 'fixed', bottom: 76, right: 20, width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontSize: 26, fontWeight: 300, display: desktop ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,.4)', zIndex: 30 }}>+</button>

        </div>

        {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
        <nav className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', zIndex: 100, boxShadow: '0 -4px 20px rgba(15,23,42,.08)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 12px', gap: 3, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: item.id === 'kalender' ? '#2563eb' : '#94a3b8' }}>{item.label}</span>
              {item.id === 'kalender' && <span style={{ width: 16, height: 3, borderRadius: 2, background: '#2563eb', position: 'absolute', bottom: 4 }} />}
            </button>
          ))}
        </nav>

      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL — Speichern-Button IMMER sichtbar
      ══════════════════════════════════════════════════════════ */}
      {modal && (
        <div className="modal-wrap" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal-box fh-font">

            {/* Header — fixiert */}
            <div className="modal-head">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 20, color: '#0f172a' }}>
                  {editId ? 'Termin bearbeiten' : 'Neuer Termin'}
                </span>
                <button onClick={() => setModal(false)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#f1f5f9', color: '#64748b', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {/* Body — scrollbar */}
            <div className="modal-scroll">

              {/* Titel + Mikrofon */}
              <Label>Titel</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="z.B. Arzttermin"
                       style={{ flex: 1, height: 48, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 14px', fontSize: 15, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa' }} />
                <button onClick={speech.toggle} className={speech.active ? 'mic-on' : ''} title={speech.active ? 'Stopp' : 'Spracheingabe'}
                        style={{ width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer', flexShrink: 0, fontSize: 20, background: speech.active ? '#e11d48' : '#f1f5f9', color: speech.active ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                  {speech.active ? '⏹' : '🎤'}
                </button>
              </div>
              {speech.active && (
                <div style={{ fontSize: 12, color: '#e11d48', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e11d48', display: 'inline-block' }} />
                  Höre zu… auf Deutsch sprechen, dann 🎤 nochmal tippen
                </div>
              )}

              {/* Datum + Zeit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div><Label>Datum</Label><input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} style={{ width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa' }} /></div>
                <div><Label>Uhrzeit</Label><input type="time" value={evTime} onChange={e => setEvTime(e.target.value)} style={{ width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa' }} /></div>
              </div>

              {/* Notiz */}
              <Label>Notiz</Label>
              <input value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Optional…"
                     style={{ width: '100%', height: 48, border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', background: '#fafafa', marginBottom: 14 }} />

              {/* Kalender-Typ */}
              <Label>Kalender</Label>
              <div style={{ display: 'grid', gridTemplateColumns: SHOW_CYCLE ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: 8, marginBottom: evType === 'family' ? 10 : 14 }}>
                {[
                  { id: 'personal', label: 'Persönlich', ac: '#16a34a', ab: '#f0fdf4' },
                  { id: 'family',   label: 'Familie',    ac: '#2563eb', ab: '#eff6ff' },
                  ...(SHOW_CYCLE ? [{ id: 'cycle', label: 'Zyklus ♀', ac: '#db2777', ab: '#fce7f3' }] : []),
                ].map(t => (
                  <button key={t.id} onClick={() => pickType(t.id as CalType)} style={{ padding: '11px 0', borderRadius: 14, border: `2px solid ${evType === t.id ? t.ac : '#e2e8f0'}`, background: evType === t.id ? t.ab : '#fafafa', color: evType === t.id ? t.ac : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Auch im persönlichen Kalender zeigen */}
              {evType === 'family' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 14px', borderRadius: 12, marginBottom: 14 }}>
                  <input type="checkbox" id="showp" checked={evShowPers} onChange={e => setEvShowPers(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer', flexShrink: 0 }} />
                  <label htmlFor="showp" style={{ fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', lineHeight: 1.4 }}>Auch im persönlichen Kalender anzeigen</label>
                </div>
              )}

              {/* Farbe */}
              <Label>Farbe</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setEvColor(c)} style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${evColor === c ? '#0f172a' : 'transparent'}`, background: c, cursor: 'pointer', transform: evColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all .15s' }} />
                ))}
              </div>

            </div>{/* end modal-scroll */}

            {/* Footer — IMMER SICHTBAR, nie wegscrollbar */}
            <div className="modal-foot">
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, height: 52, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#f1f5f9', color: '#475569', fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>
                  Abbrechen
                </button>
                <button onClick={save} style={{ flex: 2, height: 52, borderRadius: 16, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
                  <span style={{ fontSize: 18 }}>💾</span>
                  {editId ? 'Änderungen speichern' : 'Termin speichern'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

// ─── Kleine Hilfskomponenten ──────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 7 }}>{children}</div>
}

function HolBadge({ ds }: { ds: string }) {
  const h = getHoliday(ds); if (!h) return null
  return (
    <div style={{ background: '#fef9c3', borderRadius: 10, padding: '7px 12px', marginBottom: 10, fontSize: 12, color: '#854d0e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
      🎉 {h.name}
      {!h.national && <span style={{ fontSize: 10, background: '#fde68a', padding: '1px 7px', borderRadius: 10, color: '#92400e' }}>{h.abbr}</span>}
    </div>
  )
}

function Bdg({ type }: { type: string }) {
  const s: React.CSSProperties = type === 'family' ? { background: '#dbeafe', color: '#1d4ed8' } : type === 'cycle' ? { background: '#fce7f3', color: '#be185d' } : { background: '#dcfce7', color: '#15803d' }
  return <span style={{ ...s, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{type === 'family' ? 'Fam' : type === 'cycle' ? '♀' : 'Pers'}</span>
}

function EvRow({ e, onEdit, onDel }: { e: CalEvent; onEdit: (id: number) => void; onDel: (id: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: '#f8fafc', marginBottom: 6 }}>
      <div style={{ width: 3, alignSelf: 'stretch', minHeight: 28, borderRadius: 3, background: e.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.title}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
          {e.time || 'Ganztag'} · {e.type === 'family' ? 'Familie' : e.type === 'cycle' ? 'Zyklus' : 'Persönlich'}
          {e.showPersonal && e.type === 'family' ? ' · auch pers.' : ''}
          {e.desc ? ` · ${e.desc}` : ''}
        </div>
      </div>
      <Bdg type={e.type} />
      <button className="hov-ed" onClick={() => onEdit(e.id)} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>✏️</button>
      <button className="hov-del" onClick={() => onDel(e.id)} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', flexShrink: 0 }}>🗑</button>
    </div>
  )
}

function DayPanel({ ds, evOf, showHol, onEdit, onDel, onAdd }: { ds: string; evOf: (ds: string) => CalEvent[]; showHol: boolean; onEdit: (id: number) => void; onDel: (id: number) => void; onAdd?: () => void }) {
  const d = new Date(ds + 'T12:00:00')
  const evs = evOf(ds).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: '0 1px 4px rgba(15,23,42,.07)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
        {DLONG[d.getDay()]}, {d.getDate()}. {MONTHS[d.getMonth()]}
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginLeft: 6 }}>{evs.length} Termin{evs.length !== 1 ? 'e' : ''}</span>
      </div>
      {showHol && <HolBadge ds={ds} />}
      {evs.length === 0 ? <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>Keine Termine</p> : evs.map(e => <EvRow key={e.id} e={e} onEdit={onEdit} onDel={onDel} />)}
      {onAdd && <button onClick={onAdd} style={{ width: '100%', height: 42, borderRadius: 14, border: 'none', cursor: 'pointer', background: '#eff6ff', color: '#2563eb', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', marginTop: 8 }}>+ Termin an diesem Tag</button>}
    </div>
  )
}

function MonatGrid({ year, month, evOf, selDs, todayDs, showHol, desktop, onSel, onAdd, onEdit, onDel }: { year: number; month: number; evOf: (ds: string) => CalEvent[]; selDs: string; todayDs: string; showHol: boolean; desktop: boolean; onSel: (ds: string) => void; onAdd?: (ds: string) => void; onEdit?: (id: number) => void; onDel?: (id: number) => void }) {
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0)
  const sw = (first.getDay() + 6) % 7
  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 20, padding: desktop ? 20 : 14, boxShadow: '0 1px 4px rgba(15,23,42,.07)', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
          {DSHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: .6, padding: '3px 0', textTransform: 'uppercase' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {Array.from({ length: sw }, (_, i) => <div key={`p${i}`} style={{ minHeight: desktop ? 80 : 54 }} />)}
          {Array.from({ length: last.getDate() }, (_, i) => {
            const d = i + 1
            const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isT = ds === todayDs, isSel = ds === selDs
            const hol = showHol ? getHoliday(ds) : null
            const evs = evOf(ds)
            return (
              <div key={d} className="hov" onClick={() => onSel(ds)} style={{ minHeight: desktop ? 80 : 54, padding: desktop ? '5px' : '3px 2px', borderRadius: 11, cursor: 'pointer', background: isSel && !isT ? '#eff6ff' : 'transparent', outline: isSel && !isT ? '1.5px solid #bfdbfe' : 'none', display: 'flex', flexDirection: 'column', alignItems: desktop ? 'flex-start' : 'center', transition: 'background .12s' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isT ? 700 : 500, background: isT ? '#2563eb' : 'transparent', color: isT ? '#fff' : hol ? '#d97706' : isSel ? '#2563eb' : '#0f172a', flexShrink: 0 }}>{d}</div>
                {desktop && evs.slice(0,2).map(e => <div key={e.id} style={{ width: '100%', background: e.color, color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 5, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.time && <span style={{ opacity: .8 }}>{e.time} </span>}{e.title}</div>)}
                {desktop && evs.length > 2 && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, paddingLeft: 4 }}>+{evs.length-2}</div>}
                {!desktop && <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>{evs.slice(0,2).map(e => <div key={e.id} style={{ width: 5, height: 5, borderRadius: '50%', background: e.color }} />)}</div>}
                {hol && <div style={{ fontSize: desktop ? 9 : 7, color: '#d97706', fontWeight: 700, marginTop: 2, textAlign: desktop ? 'left' : 'center', overflow: 'hidden', maxWidth: '100%', paddingLeft: desktop ? 4 : 0 }}>{hol.national ? hol.name.split(' ')[0] : hol.abbr}</div>}
              </div>
            )
          })}
        </div>
      </div>
      {!desktop && onEdit && onDel && <DayPanel ds={selDs} evOf={evOf} showHol={showHol} onEdit={onEdit} onDel={onDel} onAdd={onAdd ? () => onAdd(selDs) : undefined} />}
    </div>
  )
}

function WocheView({ base, evOf, selDs, todayDs, showHol, onSel, onEdit, onDel }: { base: Date; evOf: (ds: string) => CalEvent[]; selDs: string; todayDs: string; showHol: boolean; onSel: (ds: string) => void; onEdit: (id: number) => void; onDel: (id: number) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => add(wkStart(base), i))
  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 18, padding: 10, marginBottom: 12, boxShadow: '0 1px 4px rgba(15,23,42,.07)', display: 'flex', gap: 4 }}>
        {days.map(d => {
          const ds = fd(d), isT = ds === todayDs, isSel = ds === selDs
          return (
            <button key={ds} onClick={() => onSel(ds)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: isT ? '#2563eb' : isSel ? '#eff6ff' : 'transparent', transition: 'all .15s' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: isT ? 'rgba(255,255,255,.7)' : '#94a3b8' }}>{DSHORT[(d.getDay()+6)%7]}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: isT ? '#fff' : isSel ? '#2563eb' : '#0f172a', marginTop: 2 }}>{d.getDate()}</span>
              <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>{evOf(ds).slice(0,2).map(e => <div key={e.id} style={{ width: 4, height: 4, borderRadius: '50%', background: isT ? 'rgba(255,255,255,.6)' : e.color }} />)}</div>
            </button>
          )
        })}
      </div>
      {days.map(d => {
        const ds = fd(d), isT = ds === todayDs
        const evs = evOf(ds).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
        return (
          <div key={ds} style={{ background: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(15,23,42,.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isT ? '#2563eb' : '#0f172a' }}>{DLONG[d.getDay()]}, {d.getDate()}. {MSHORT[d.getMonth()]}</span>
              {isT && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#2563eb', color: '#fff', fontWeight: 700 }}>HEUTE</span>}
            </div>
            {showHol && <HolBadge ds={ds} />}
            {evs.length === 0 ? <span style={{ fontSize: 12, color: '#94a3b8' }}>Keine Termine</span> : evs.map(e => <EvRow key={e.id} e={e} onEdit={onEdit} onDel={onDel} />)}
          </div>
        )
      })}
    </div>
  )
}

function TagView({ date, evOf, showHol, onEdit, onDel }: { date: Date; evOf: (ds: string) => CalEvent[]; showHol: boolean; onEdit: (id: number) => void; onDel: (id: number) => void }) {
  const ds = fd(date)
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 1px 4px rgba(15,23,42,.07)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{DLONG[date.getDay()]}, {date.getDate()}. {MONTHS[date.getMonth()]} {date.getFullYear()}</div>
      {showHol && <HolBadge ds={ds} />}
      {evOf(ds).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')).map(e => <EvRow key={e.id} e={e} onEdit={onEdit} onDel={onDel} />) || <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Keine Termine</p>}
    </div>
  )
}

function JahrView({ year, evOf, todayDs, onSel }: { year: number; evOf: (ds: string) => CalEvent[]; todayDs: string; onSel: (ds: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(year,m,1), last = new Date(year,m+1,0), sw = (first.getDay()+6)%7
        return (
          <div key={m} style={{ background: '#fff', borderRadius: 16, padding: '12px 10px', boxShadow: '0 1px 4px rgba(15,23,42,.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textAlign: 'center', marginBottom: 8 }}>{MONTHS[m]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
              {DSHORT.map(d => <div key={d} style={{ fontSize: 7, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{d[0]}</div>)}
              {Array.from({ length: sw }, (_, i) => <div key={`p${i}`} />)}
              {Array.from({ length: last.getDate() }, (_, i) => {
                const d = i+1, ds = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const isT = ds===todayDs, hasEv = evOf(ds).length>0, hol = getHoliday(ds)
                return <button key={d} onClick={() => onSel(ds)} style={{ fontSize: 8.5, textAlign: 'center', borderRadius: isT ? '50%' : 3, border: 'none', cursor: 'pointer', padding: '2px 1px', lineHeight: '15px', background: isT ? '#2563eb' : hasEv ? '#dbeafe' : 'transparent', color: isT ? '#fff' : hasEv ? '#1d4ed8' : hol ? '#d97706' : '#475569', fontStyle: hol&&!isT&&!hasEv ? 'italic' : 'normal', fontWeight: hasEv ? 700 : 400 }}>{d}</button>
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}