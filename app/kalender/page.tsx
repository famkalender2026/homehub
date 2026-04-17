'use client'

// ═══════════════════════════════════════════════════════════════════════════
// KALENDER PAGE — Modern Ocean Blue UI, vollständig überarbeitet
// Ablegen unter: app/(app)/kalender/page.tsx
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Typen ────────────────────────────────────────────────────────────────────
type CalType   = 'personal' | 'family' | 'cycle'
type CalView   = 'tag' | 'woche' | 'monat' | 'jahr'
type CalFilter = 'all' | 'personal' | 'family'

interface CalEvent {
  id: number
  title: string
  date: string        // 'YYYY-MM-DD'
  time: string
  type: CalType
  color: string
  desc: string
  showPersonal?: boolean  // Familienterm. auch im pers. Kalender zeigen
}

interface CycleSettings {
  enabled: boolean
  lastPeriodStart: string   // 'YYYY-MM-DD'
  cycleLength: number       // Standard 28
  periodLength: number      // Standard 5
}

// ─── Deutsche Feiertage 2024-2026 ────────────────────────────────────────────
// Bundesweit = national: true  |  Nur bestimmte Bundesländer = national: false
function getEasterSunday(year: number): Date {
  // Gaußsche Osterformel
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day   = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDaysToDate(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}

function buildHolidaysForYear(year: number): Record<string, { name: string; national: boolean; bundesland?: string }> {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const easter = getEasterSunday(year)

  const fixed: Record<string, { name: string; national: boolean; bundesland?: string }> = {
    [`${year}-01-01`]: { name: 'Neujahr',                national: true },
    [`${year}-01-06`]: { name: 'Heilige Drei Könige',     national: false, bundesland: 'BY, BW, ST' },
    [`${year}-03-08`]: { name: 'Internationaler Frauentag', national: false, bundesland: 'BE, MV, TH' },
    [`${year}-05-01`]: { name: 'Tag der Arbeit',           national: true },
    [`${year}-10-03`]: { name: 'Tag d. Dt. Einheit',       national: true },
    [`${year}-11-01`]: { name: 'Allerheiligen',            national: false, bundesland: 'BY, BW, NW, RP, SL' },
    [`${year}-12-25`]: { name: '1. Weihnachtstag',         national: true },
    [`${year}-12-26`]: { name: '2. Weihnachtstag',         national: true },
  }

  // Reformationstag (nur bestimmte Bundesländer)
  fixed[`${year}-10-31`] = { name: 'Reformationstag', national: false, bundesland: 'BB, HB, HH, MV, NI, SN, ST, TH' }

  // Bewegliche Feiertage
  const movable: Record<string, { name: string; national: boolean; bundesland?: string }> = {
    [fmt(addDaysToDate(easter, -2))]:  { name: 'Karfreitag',           national: true },
    [fmt(easter)]:                     { name: 'Ostersonntag',          national: true },
    [fmt(addDaysToDate(easter,  1))]:  { name: 'Ostermontag',           national: true },
    [fmt(addDaysToDate(easter, 39))]:  { name: 'Christi Himmelfahrt',   national: true },
    [fmt(addDaysToDate(easter, 49))]:  { name: 'Pfingstsonntag',        national: true },
    [fmt(addDaysToDate(easter, 50))]:  { name: 'Pfingstmontag',         national: true },
    [fmt(addDaysToDate(easter, 60))]:  { name: 'Fronleichnam',          national: false, bundesland: 'BY, BW, HE, NW, RP, SL, SN, TH' },
  }

  // Augsburger Friedensfest (nur Augsburg, ignorieren wir hier)
  fixed[`${year}-08-15`] = { name: 'Mariä Himmelfahrt', national: false, bundesland: 'BY, SL' }

  return { ...fixed, ...movable }
}

// Cache für 3 Jahre
const HOLIDAY_CACHE: Record<number, Record<string, { name: string; national: boolean; bundesland?: string }>> = {}
function getHolidaysForYear(year: number) {
  if (!HOLIDAY_CACHE[year]) HOLIDAY_CACHE[year] = buildHolidaysForYear(year)
  return HOLIDAY_CACHE[year]
}
function getHoliday(ds: string) {
  const year = parseInt(ds.slice(0, 4))
  return getHolidaysForYear(year)[ds] ?? null
}

// ─── Konstanten ───────────────────────────────────────────────────────────────
const MONTHS  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const MSHORT  = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const DSHORT  = ['Mo','Di','Mi','Do','Fr','Sa','So']
const DLONG   = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
const COLORS  = ['#1e6bbf','#0d7a6e','#c0405a','#d4a843','#7c3aed','#ea580c','#db2777','#0f766e']

const NAV = [
  { id: 'dashboard',     label: 'Start',    emoji: '🏠', path: '/dashboard'      },
  { id: 'kalender',      label: 'Kalender', emoji: '📅', path: '/kalender'       },
  { id: 'aufgaben',      label: 'Aufgaben', emoji: '✅', path: '/aufgaben'       },
  { id: 'einkaufsliste', label: 'Einkauf',  emoji: '🛒', path: '/einkaufsliste'  },
  { id: 'rezepte',       label: 'Rezepte',  emoji: '🍳', path: '/rezepte'        },
  { id: 'wetter',        label: 'Wetter',   emoji: '🌤', path: '/wetter'         },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function addD(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate()+n); return x }
function wkStart(d: Date): Date { const m = new Date(d); m.setDate(d.getDate()-((d.getDay()+6)%7)); return m }
function parseDate(ds: string): Date { return new Date(ds + 'T12:00:00') }

// ─── Zyklus-Berechnung ────────────────────────────────────────────────────────
function getCycleDays(cycle: CycleSettings): Record<string, 'period' | 'fertile' | 'ovulation'> {
  if (!cycle.enabled || !cycle.lastPeriodStart) return {}
  const map: Record<string, 'period' | 'fertile' | 'ovulation'> = {}
  const start = parseDate(cycle.lastPeriodStart)
  for (let c = -1; c < 18; c++) {
    const cs = new Date(start); cs.setDate(cs.getDate() + c * cycle.cycleLength)
    for (let d = 0; d < cycle.periodLength; d++) {
      const day = addD(cs, d); map[fd(day)] = 'period'
    }
    const ov = addD(cs, cycle.cycleLength - 14)
    map[fd(ov)] = 'ovulation'
    for (let f = -5; f <= 1; f++) {
      const fd2 = addD(ov, f)
      if (!map[fd(fd2)] || map[fd(fd2)] === 'fertile') map[fd(fd2)] = 'fertile'
    }
  }
  return map
}

function getCyclePhase(cycle: CycleSettings): { name: string; desc: string; pct: number; color: string } | null {
  if (!cycle.enabled || !cycle.lastPeriodStart) return null
  const today = new Date()
  const start = parseDate(cycle.lastPeriodStart)
  const diff  = Math.floor((today.getTime() - start.getTime()) / 86400000) % cycle.cycleLength
  const pl  = cycle.periodLength
  const ovD = cycle.cycleLength - 14
  if (diff < pl)                          return { name: 'Periode',        desc: `Tag ${diff+1} von ${pl}`,        pct: ((diff+1)/pl)*100,              color: '#c0405a' }
  if (diff === ovD)                       return { name: 'Eisprung',        desc: 'Höchste Fruchtbarkeit',          pct: 100,                            color: '#d4a843' }
  if (diff > ovD-6 && diff < ovD)        return { name: 'Fruchtbare Phase',desc: `Eisprung in ${ovD-diff} Tag(en)`,pct: ((diff-pl)/(ovD-pl))*100,       color: '#0d7a6e' }
  if (diff > pl && diff < ovD-5)         return { name: 'Follikelphase',   desc: `Zyklustag ${diff+1}`,            pct: ((diff-pl)/(ovD-5-pl))*100,     color: '#1e6bbf' }
  return                                         { name: 'Lutealphase',     desc: `Zyklustag ${diff+1}`,            pct: ((diff-ovD)/(cycle.cycleLength-ovD))*100, color: '#6d28d9' }
}

// ─── Demo-Events ──────────────────────────────────────────────────────────────
const TODAY = new Date()
const DEMO_EVENTS: CalEvent[] = [
  { id: 1, title: 'Kinderarzt Lena',  date: fd(addD(TODAY,1)),  time: '10:00', type: 'family',   color: '#1e6bbf', desc: 'U8-Vorsorge',   showPersonal: true  },
  { id: 2, title: 'Yoga-Kurs',        date: fd(TODAY),           time: '18:00', type: 'personal', color: '#0d7a6e', desc: '',              showPersonal: false },
  { id: 3, title: 'Elternabend',      date: fd(addD(TODAY,2)),  time: '19:30', type: 'family',   color: '#7c3aed', desc: 'Schule Klasse 3',showPersonal: false },
  { id: 4, title: 'Zahnarzt',         date: fd(addD(TODAY,5)),  time: '14:00', type: 'personal', color: '#c0405a', desc: '',              showPersonal: false },
  { id: 5, title: 'Familienessen',    date: fd(addD(TODAY,7)),  time: '13:00', type: 'family',   color: '#d4a843', desc: "Omas Geburtstag",showPersonal: true  },
  { id: 6, title: 'Meeting Team',     date: fd(addD(TODAY,3)),  time: '09:00', type: 'personal', color: '#1e6bbf', desc: 'Zoom-Call',     showPersonal: false },
  { id: 7, title: 'Schulaufführung',  date: fd(addD(TODAY,10)), time: '17:00', type: 'family',   color: '#0f766e', desc: 'Aula Schule',   showPersonal: false },
]

// ─── Spracheingabe ────────────────────────────────────────────────────────────
function useSpeech(onResult: (t: string) => void) {
  const [active, setActive] = useState(false)
  const ref = useRef<any>(null)
  const toggle = useCallback(() => {
    if (active) { ref.current?.stop(); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Spracheingabe nicht unterstützt.\nBitte Chrome verwenden.'); return }
    const r = new SR(); ref.current = r
    r.lang = 'de-DE'; r.continuous = false; r.interimResults = false
    r.onstart  = () => setActive(true)
    r.onresult = (e: any) => { onResult(e.results[0]?.[0]?.transcript ?? '') }
    r.onerror  = (e: any) => { if (e.error==='not-allowed') alert('Mikrofon-Zugriff verweigert.'); setActive(false) }
    r.onend    = () => setActive(false)
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => r.start()).catch(() => { alert('Mikrofon-Zugriff verweigert.'); setActive(false) })
    } else { r.start() }
  }, [active, onResult])
  return { active, toggle }
}

// ════════════════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display:ital@0;1&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --o900: #0a1628; --o800: #0d2240; --o700: #0f3460; --o600: #1a4f8a;
  --o500: #1e6bbf; --o400: #3d8fd6; --o300: #6db8f0; --o200: #a8d8f8;
  --o100: #d6eefc; --o50:  #edf7fe;
  --t600: #0d7a6e; --t400: #1db8a8; --t200: #a0ede6; --t50: #edfaf9;
  --r600: #c0405a; --r400: #e8607a; --r200: #f8c0cc; --r100: #fde8ed; --r50: #fff2f5;
  --g400: #d4a843; --g200: #f0d89a; --g50: #fdf7e6;
  --surf: #ffffff; --surf2: #f4f8fd; --surf3: #e8f2fb;
  --text: #0a1628; --text2: #3a5a7a; --textm: #7aa2c0;
  --bord: #c8dff0; --bord2: #e0eff9;
  --rad: 14px; --rads: 10px;
  --shadow: 0 2px 16px rgba(10,22,40,.07);
  --shadow2: 0 4px 24px rgba(10,22,40,.1);
}

html, body { height: 100%; background: var(--surf2); font-family: 'DM Sans', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bord); border-radius: 10px; }
input[type=date], input[type=time] { color-scheme: light; }
button { font-family: 'DM Sans', sans-serif; }

/* ── APP SHELL ── */
.app { display: flex; min-height: 100vh; }
.sidebar-nav { position: fixed; top: 0; left: 0; bottom: 0; width: 68px; background: var(--o800); display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 4px; z-index: 60; }
.sidebar-logo { font-family: 'DM Serif Display', serif; font-size: 13px; color: var(--o300); margin-bottom: 16px; letter-spacing: -.3px; }
.sb-btn { width: 50px; height: 50px; border-radius: 14px; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: transparent; transition: background .15s; }
.sb-btn:hover:not(.sb-active) { background: rgba(255,255,255,.08); }
.sb-active { background: rgba(255,255,255,.16) !important; }
.sb-label { font-size: 8px; font-weight: 600; color: rgba(255,255,255,.4); letter-spacing: .4px; }
.sb-active .sb-label { color: rgba(255,255,255,.9); }
.main-content { flex: 1; min-height: 100vh; display: flex; flex-direction: column; }

/* ── HEADER ── */
.cal-header { background: var(--o700); padding: 16px 24px 18px; position: relative; overflow: hidden; flex-shrink: 0; }
.cal-header::before { content: ''; position: absolute; top: -50px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(61,143,214,.2); pointer-events: none; }
.cal-header::after { content: ''; position: absolute; bottom: -60px; left: 20%; width: 140px; height: 140px; border-radius: 50%; background: rgba(29,184,168,.12); pointer-events: none; }
.hdr-inner { max-width: 1140px; margin: 0 auto; position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; }
.hdr-back { width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,.12); border: none; cursor: pointer; color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: background .15s; flex-shrink: 0; }
.hdr-back:hover { background: rgba(255,255,255,.2); }
.hdr-nav { display: flex; align-items: center; gap: 8px; }
.hdr-nav-btn { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.12); border: none; cursor: pointer; color: #fff; font-size: 17px; display: flex; align-items: center; justify-content: center; transition: .15s; flex-shrink: 0; }
.hdr-nav-btn:hover { background: rgba(255,255,255,.22); }
.hdr-title { font-family: 'DM Serif Display', serif; font-size: 18px; color: #fff; min-width: 180px; text-align: center; letter-spacing: -.2px; }
.hdr-actions { display: flex; gap: 8px; margin-left: auto; }
.hdr-today-btn { height: 36px; padding: 0 14px; border-radius: 10px; background: rgba(255,255,255,.12); border: none; cursor: pointer; color: #fff; font-size: 12px; font-weight: 600; transition: .15s; }
.hdr-today-btn:hover { background: rgba(255,255,255,.22); }
.hdr-add-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,.18); border: none; cursor: pointer; color: #fff; font-size: 22px; font-weight: 300; display: flex; align-items: center; justify-content: center; transition: .15s; }
.hdr-add-btn:hover { background: rgba(255,255,255,.3); }

/* ── TOOLBAR ── */
.toolbar { background: var(--surf); border-bottom: 1px solid var(--bord2); position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 8px rgba(10,22,40,.05); }
.toolbar-inner { max-width: 1140px; margin: 0 auto; padding: 10px 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.view-pills { display: flex; background: var(--surf2); border-radius: 12px; padding: 3px; gap: 2px; }
.view-btn { padding: 7px 14px; border-radius: 9px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; background: transparent; color: var(--textm); transition: .15s; }
.view-btn.active { background: var(--surf); color: var(--o500); box-shadow: 0 1px 6px rgba(10,22,40,.08); }
.filter-chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1; }
.filter-chips::-webkit-scrollbar { display: none; }
.filter-chip { flex-shrink: 0; height: 32px; padding: 0 14px; border-radius: 20px; border: 1.5px solid transparent; font-size: 12px; font-weight: 600; cursor: pointer; transition: .15s; display: flex; align-items: center; gap: 5px; }
.filter-chip .chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ── CONTENT ── */
.cal-body { max-width: 1140px; margin: 0 auto; width: 100%; padding: 20px 20px 100px; flex: 1; }

/* ── CARDS ── */
.card { background: var(--surf); border-radius: var(--rad); border: 1px solid var(--bord2); box-shadow: var(--shadow); }
.card-pad { padding: 18px; }

/* ── MONTH GRID ── */
.month-desktop { display: grid; grid-template-columns: 1fr 300px; gap: 18px; align-items: start; }
.dow-row { display: grid; grid-template-columns: repeat(7,1fr); padding: 0 14px; margin-bottom: 6px; }
.dow-cell { text-align: center; font-size: 10.5px; font-weight: 700; color: var(--textm); text-transform: uppercase; letter-spacing: .07em; padding: 6px 0; }
.days-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; padding: 4px 10px 10px; }
.day-cell { min-height: 88px; border-radius: var(--rads); cursor: pointer; padding: 6px 5px; display: flex; flex-direction: column; border: 1.5px solid transparent; transition: border-color .12s, background .12s; position: relative; overflow: hidden; }
.day-cell:hover { background: var(--o50); border-color: var(--o200); }
.day-cell.today { border-color: var(--o500) !important; background: var(--o50) !important; }
.day-cell.selected:not(.today) { border-color: var(--o300); background: var(--surf3); }
.day-cell.other-month { opacity: .38; }
.day-cell.has-holiday { background: #fffbe6; }
.day-cell.has-holiday:hover { background: #fff8d6; }
.day-cell.period-day { background: var(--r50) !important; }
.day-cell.fertile-day { background: var(--t50) !important; }
.day-cell.ovulation-day { background: var(--g50) !important; }
.day-num-wrap { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
.day-num { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--text); flex-shrink: 0; }
.day-cell.today .day-num { background: var(--o500); color: #fff; border-radius: 8px; }
.day-hol-name { font-size: 8.5px; font-weight: 600; color: #a16207; line-height: 1.2; text-align: right; max-width: 60%; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.day-hol-badge { font-size: 8px; color: #a16207; background: #fef3c7; border-radius: 4px; padding: 1px 4px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.day-chip { border-radius: 5px; padding: 2px 5px; font-size: 10px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; color: #fff; }
.day-more { font-size: 9px; color: var(--textm); padding: 1px 4px; }
.cycle-dot { position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; border-radius: 50%; }
/* Mobile month */
.days-grid-mobile { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; padding: 4px 8px 10px; }
.day-cell-m { border-radius: 8px; cursor: pointer; padding: 4px 2px; display: flex; flex-direction: column; align-items: center; border: 1.5px solid transparent; transition: .12s; min-height: 54px; position: relative; }
.day-cell-m:hover { background: var(--o50); }
.day-cell-m.today { border-color: var(--o500); background: var(--o50); }
.day-cell-m.selected:not(.today) { border-color: var(--o300); background: var(--surf3); }
.day-cell-m.other-month { opacity: .35; }
.day-cell-m.period-day { background: var(--r50) !important; }
.day-cell-m.fertile-day { background: var(--t50) !important; }
.day-cell-m.ovulation-day { background: var(--g50) !important; }
.day-cell-m.has-holiday { background: #fffbe6 !important; }
.day-num-m { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text); }
.day-cell-m.today .day-num-m { background: var(--o500); color: #fff; }
.day-dots { display: flex; gap: 2px; flex-wrap: wrap; justify-content: center; margin-top: 2px; }
.day-dot { width: 5px; height: 5px; border-radius: 50%; }
.hol-star { font-size: 9px; color: #a16207; position: absolute; top: 3px; right: 3px; }

/* ── DAY PANEL ── */
.day-panel { }
.day-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.day-panel-title { font-family: 'DM Serif Display', serif; font-size: 16px; color: var(--text); }
.day-panel-add { height: 34px; padding: 0 14px; border-radius: 10px; border: none; background: var(--o500); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; transition: .15s; display: flex; align-items: center; gap: 5px; }
.day-panel-add:hover { background: var(--o600); }
.holiday-banner { background: #fffbe6; border: 1px solid #fde68a; border-radius: var(--rads); padding: 9px 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.holiday-banner-name { font-size: 13px; font-weight: 600; color: #92400e; }
.holiday-banner-scope { font-size: 10px; background: #fef3c7; color: #92400e; border-radius: 20px; padding: 2px 8px; font-weight: 700; flex-shrink: 0; }
.no-events { text-align: center; padding: 24px 0; font-size: 13px; color: var(--textm); }
.ev-row { display: flex; align-items: stretch; gap: 10px; padding: 10px 12px; border-radius: 12px; background: var(--surf2); margin-bottom: 6px; transition: .12s; }
.ev-row:hover { background: var(--surf3); }
.ev-stripe { width: 3px; border-radius: 3px; flex-shrink: 0; }
.ev-content { flex: 1; min-width: 0; }
.ev-title { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev-meta { font-size: 11px; color: var(--textm); margin-top: 2px; }
.ev-badge { border-radius: 20px; font-size: 10px; font-weight: 700; padding: 2px 8px; white-space: nowrap; align-self: flex-start; flex-shrink: 0; }
.ev-btn { width: 30px; height: 30px; border-radius: 8px; border: none; background: transparent; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: .12s; flex-shrink: 0; align-self: center; }
.ev-btn-edit:hover { background: var(--o50); }
.ev-btn-del:hover { background: var(--r100); }

/* ── WEEK VIEW ── */
.week-strip { display: flex; gap: 4px; padding: 10px; margin-bottom: 2px; }
.week-day-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border-radius: 12px; border: none; cursor: pointer; background: transparent; transition: .15s; }
.week-day-btn:hover:not(.wdb-today):not(.wdb-sel) { background: var(--surf2); }
.wdb-today { background: var(--o500) !important; }
.wdb-sel:not(.wdb-today) { background: var(--surf3); border: 1.5px solid var(--o300); }
.wdb-dow { font-size: 9px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--textm); }
.wdb-today .wdb-dow { color: rgba(255,255,255,.7); }
.wdb-num { font-size: 18px; font-weight: 700; color: var(--text); margin: 3px 0; line-height: 1; }
.wdb-today .wdb-num { color: #fff; }
.wdb-sel:not(.wdb-today) .wdb-num { color: var(--o500); }
.week-day-card { border-radius: 14px; background: var(--surf); border: 1px solid var(--bord2); margin-bottom: 10px; overflow: hidden; box-shadow: var(--shadow); }
.wdc-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--bord2); }
.wdc-date { font-size: 13px; font-weight: 700; color: var(--text); }
.wdc-today-badge { font-size: 9px; background: var(--o500); color: #fff; border-radius: 20px; padding: 2px 8px; font-weight: 700; }
.wdc-body { padding: 10px 12px; }

/* ── YEAR VIEW ── */
.year-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.year-month { background: var(--surf); border-radius: 14px; padding: 14px 12px; border: 1px solid var(--bord2); box-shadow: var(--shadow); }
.ym-title { font-size: 12px; font-weight: 700; color: var(--o600); text-align: center; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
.ym-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 1px; }
.ym-dow { font-size: 7px; font-weight: 700; color: var(--textm); text-align: center; padding: 2px 0; }
.ym-day { font-size: 9px; text-align: center; border-radius: 4px; border: none; cursor: pointer; padding: 3px 1px; line-height: 1.5; background: transparent; color: var(--text2); transition: .12s; }
.ym-day:hover { background: var(--o100); }
.ym-day.ym-today { background: var(--o500); color: #fff; border-radius: '50%'; }
.ym-day.ym-has-ev { background: var(--o100); color: var(--o700); font-weight: 700; }
.ym-day.ym-hol { color: #a16207; font-style: italic; }

/* ── CYCLE SIDEBAR ── */
.cycle-card { background: linear-gradient(135deg, var(--r50) 0%, #fde8ed 100%); border: 1px solid var(--r200); border-radius: var(--rad); box-shadow: var(--shadow); margin-top: 16px; }
.cycle-head { padding: 14px 16px 10px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--r200); }
.cycle-title { font-size: 13px; font-weight: 700; color: var(--r600); flex: 1; }
.cycle-active-badge { background: var(--r400); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px; }
.cycle-body { padding: 14px 16px; }
.phase-block { background: #fff; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; border: 1px solid var(--r200); }
.phase-name { font-size: 14px; font-weight: 700; color: var(--r600); }
.phase-desc { font-size: 11px; color: var(--r600); opacity: .75; margin-top: 2px; }
.phase-bar { height: 5px; background: var(--r100); border-radius: 20px; overflow: hidden; margin-top: 8px; }
.phase-fill { height: 100%; border-radius: 20px; transition: width .4s; }
.cycle-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.cycle-stat { background: #fff; border-radius: 9px; padding: 8px 6px; text-align: center; border: 1px solid var(--r200); }
.cycle-stat-val { font-size: 17px; font-weight: 700; color: var(--r600); line-height: 1.1; }
.cycle-stat-lbl { font-size: 9.5px; color: var(--r400); margin-top: 2px; }
.symptom-row { display: flex; gap: 6px; flex-wrap: wrap; }
.symptom-chip { background: #fff; border: 1px solid var(--r200); border-radius: 20px; padding: 4px 11px; font-size: 11px; color: var(--r600); cursor: pointer; transition: .15s; font-family: inherit; }
.symptom-chip.on, .symptom-chip:hover { background: var(--r400); color: #fff; border-color: var(--r400); }
.setup-field { margin-bottom: 12px; }
.setup-label { font-size: 11px; font-weight: 600; color: var(--r600); margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .04em; }
.setup-inp { width: 100%; border: 1.5px solid var(--r200); border-radius: 9px; padding: 8px 12px; font-family: inherit; font-size: 14px; color: var(--text); background: #fff; outline: none; transition: .15s; }
.setup-inp:focus { border-color: var(--r400); }
.setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.setup-btn { width: 100%; border: none; background: var(--r400); color: #fff; border-radius: 9px; padding: 10px; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; transition: .15s; margin-top: 4px; }
.setup-btn:hover { background: var(--r600); }

/* ── LEGEND ── */
.cal-legend { display: flex; gap: 16px; flex-wrap: wrap; padding: 10px 14px; border-top: 1px solid var(--bord2); }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text2); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* ── MODAL ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(10,22,40,.5); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: fadeIn .18s ease; }
.modal-box { background: var(--surf); width: 100%; max-width: 520px; max-height: 88vh; border-radius: 22px 22px 0 0; display: flex; flex-direction: column; box-shadow: 0 -16px 48px rgba(10,22,40,.2); animation: slideUp .22s ease; }
.modal-handle { width: 40px; height: 4px; border-radius: 2px; background: var(--bord); margin: 12px auto 10px; }
.modal-head { flex-shrink: 0; padding: 0 20px 12px; border-bottom: 1px solid var(--bord2); display: flex; align-items: center; justify-content: space-between; }
.modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text); }
.modal-close { width: 32px; height: 32px; border-radius: 9px; border: none; cursor: pointer; background: var(--surf2); color: var(--text2); font-size: 16px; display: flex; align-items: center; justify-content: center; transition: .15s; }
.modal-close:hover { background: var(--surf3); }
.modal-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; }
.modal-foot { flex-shrink: 0; padding: 12px 20px; border-top: 1px solid var(--bord2); padding-bottom: max(14px, env(safe-area-inset-bottom, 14px)); }
.form-label { font-size: 10.5px; font-weight: 700; color: var(--textm); letter-spacing: .07em; text-transform: uppercase; display: block; margin-bottom: 6px; }
.form-input { width: 100%; height: 48px; border: 1.5px solid var(--bord); border-radius: 12px; padding: 0 14px; font-family: inherit; font-size: 15px; color: var(--text); background: var(--surf2); outline: none; transition: .15s; }
.form-input:focus { border-color: var(--o400); background: var(--surf); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 16px; }
.type-grid { display: grid; gap: 8px; }
.type-btn { padding: 11px; border-radius: 12px; border: 2px solid var(--bord); background: var(--surf2); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: .15s; }
.color-row { display: flex; gap: 8px; flex-wrap: wrap; }
.color-swatch { width: 34px; height: 34px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: .15s; }
.color-swatch.sel { border-color: var(--text); transform: scale(1.15); }
.modal-btn-cancel { flex: 1; height: 52px; border-radius: 14px; border: none; cursor: pointer; background: var(--surf2); color: var(--text2); font-size: 15px; font-weight: 700; font-family: inherit; transition: .15s; }
.modal-btn-cancel:hover { background: var(--surf3); }
.modal-btn-save { flex: 2; height: 52px; border-radius: 14px; border: none; cursor: pointer; background: var(--o500); color: #fff; font-size: 15px; font-weight: 700; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(30,107,191,.35); transition: .15s; }
.modal-btn-save:hover { background: var(--o600); }
.mic-btn { width: 48px; height: 48px; border-radius: 12px; border: none; cursor: pointer; background: var(--surf2); color: var(--text2); font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: .2s; }
.mic-btn.active { background: var(--r400); color: #fff; animation: micPulse 1.2s infinite; }
.show-personal-row { display: flex; align-items: center; gap: 10px; background: var(--surf2); padding: 10px 14px; border-radius: 12px; cursor: pointer; }

/* ── MOBILE BOTTOM NAV ── */
.bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surf); border-top: 1px solid var(--bord2); display: flex; z-index: 100; box-shadow: 0 -4px 20px rgba(10,22,40,.07); padding-bottom: env(safe-area-inset-bottom, 0px); }
.bn-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 0 12px; gap: 3px; border: none; background: none; cursor: pointer; font-family: inherit; position: relative; }
.bn-label { font-size: 9.5px; font-weight: 600; color: var(--textm); }
.bn-active .bn-label { color: var(--o500); }
.bn-indicator { width: 16px; height: 3px; border-radius: 2px; background: var(--o500); position: absolute; bottom: 4px; }
.mobile-fab { position: fixed; bottom: 76px; right: 20px; width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer; background: var(--o500); color: #fff; font-size: 26px; font-weight: 300; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px rgba(30,107,191,.4); z-index: 30; transition: .15s; }
.mobile-fab:hover { background: var(--o600); transform: scale(1.05); }

/* ── ANIMATIONS ── */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes micPulse { 0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(192,64,90,.4); } 50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(192,64,90,0); } }

/* ── RESPONSIVE ── */
@media (min-width: 768px) {
  .bottom-nav, .mobile-fab { display: none !important; }
  .main-content { margin-left: 68px; }
  .modal-overlay { align-items: center; padding: 20px; }
  .modal-box { border-radius: 22px; max-height: 90vh; }
  .year-grid { grid-template-columns: repeat(4,1fr); }
}
@media (max-width: 767px) {
  .sidebar-nav { display: none !important; }
  .cal-body { padding: 14px 14px 100px; }
  .year-grid { grid-template-columns: repeat(2,1fr); }
  .hdr-title { min-width: 130px; font-size: 15px; }
}
@media (max-width: 480px) {
  .year-grid { grid-template-columns: repeat(2,1fr); }
  .hdr-title { min-width: 110px; font-size: 14px; }
}
`

// ════════════════════════════════════════════════════════════════════════════
// HAUPTKOMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default function KalenderPage() {
  const router = useRouter()
  const [view,      setViewState] = useState<CalView>('monat')
  const [filter,    setFilter]    = useState<CalFilter>('all')
  const [curYear,   setCurYear]   = useState(TODAY.getFullYear())
  const [curMonth,  setCurMonth]  = useState(TODAY.getMonth())
  const [selDate,   setSelDate]   = useState<Date>(TODAY)
  const [events,    setEvents]    = useState<CalEvent[]>(DEMO_EVENTS)
  const [nextId,    setNextId]    = useState(30)
  const [desktop,   setDesktop]   = useState(false)
  const [symptoms,  setSymptoms]  = useState<string[]>([])

  const [cycle, setCycle] = useState<CycleSettings>({
    enabled: false,
    lastPeriodStart: fd(addD(TODAY, -3)),
    cycleLength: 28,
    periodLength: 5,
  })

  // Modal state
  const [modal,      setModal]      = useState(false)
  const [editId,     setEditId]     = useState<number|null>(null)
  const [evTitle,    setEvTitle]    = useState('')
  const [evDate,     setEvDate]     = useState(fd(TODAY))
  const [evTime,     setEvTime]     = useState('')
  const [evDesc,     setEvDesc]     = useState('')
  const [evType,     setEvType]     = useState<CalType>('personal')
  const [evColor,    setEvColor]    = useState('#1e6bbf')
  const [evShowPers, setEvShowPers] = useState(false)

  // Cycle setup modal
  const [showCycleSetup, setShowCycleSetup] = useState(false)
  const [setupLPS,  setSetupLPS]  = useState(fd(addD(TODAY,-3)))
  const [setupCL,   setSetupCL]   = useState('28')
  const [setupPL,   setSetupPL]   = useState('5')

  const speech = useSpeech(t => setEvTitle(p => p ? p + ' ' + t : t))

  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth >= 768)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const cycleDays   = getCycleDays(cycle)
  const cyclePhase  = getCyclePhase(cycle)

  // ── Filter ────────────────────────────────────────────────────────────────
  const filterEvs = useCallback((evs: CalEvent[]): CalEvent[] => {
    if (filter === 'all') return evs
    if (filter === 'family')   return evs.filter(e => e.type === 'family' || (e.type === 'cycle' && cycle.enabled))
    if (filter === 'personal') return evs.filter(e =>
      e.type === 'personal' ||
      (e.type === 'family' && e.showPersonal === true) ||
      (e.type === 'cycle' && cycle.enabled)
    )
    return evs
  }, [filter, cycle.enabled])

  const evOf = (ds: string) =>
    filterEvs(events.filter(e => e.date === ds))
      .sort((a,b) => (a.time||'99').localeCompare(b.time||'99'))

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
    const d = parseDate(ds)
    setSelDate(d); setCurMonth(d.getMonth()); setCurYear(d.getFullYear())
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openAdd(ds?: string) {
    setEditId(null); setEvTitle(''); setEvDate(ds ?? fd(selDate))
    setEvTime(''); setEvDesc(''); setEvType('personal')
    setEvColor('#1e6bbf'); setEvShowPers(false)
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
    setEvColor(t==='family'?'#1e6bbf':t==='cycle'?'#c0405a':'#0d7a6e')
  }
  function save() {
    if (!evTitle.trim()) { alert('Bitte Titel eingeben'); return }
    const ev: CalEvent = { id: editId ?? nextId, title: evTitle.trim(), date: evDate, time: evTime, desc: evDesc, type: evType, color: evColor, showPersonal: evShowPers }
    if (editId) setEvents(p => p.map(e => e.id === editId ? ev : e))
    else { setEvents(p => [...p, ev]); setNextId(n => n+1) }
    setModal(false)
  }
  function del(id: number) {
    if (confirm('Termin wirklich löschen?')) setEvents(p => p.filter(e => e.id !== id))
  }

  function saveCycleSetup() {
    const cl = parseInt(setupCL), pl = parseInt(setupPL)
    if (!setupLPS || isNaN(cl) || isNaN(pl) || cl < 21 || pl < 1) { alert('Bitte alle Felder korrekt ausfüllen'); return }
    setCycle({ enabled: true, lastPeriodStart: setupLPS, cycleLength: cl, periodLength: pl })
    setShowCycleSetup(false)
  }

  const selDs   = fd(selDate)
  const todayDs = fd(TODAY)

  const calTitle = view === 'jahr' ? String(curYear)
    : view === 'tag' ? `${selDate.getDate()}. ${MONTHS[selDate.getMonth()]} ${selDate.getFullYear()}`
    : `${MONTHS[curMonth]} ${curYear}`

  const filterChips = [
    { id: 'all',      label: 'Alle',       bg: '#f1f5f9', c: '#475569', bc: '#94a3b8', dot: '#94a3b8' },
    { id: 'family',   label: 'Familie',    bg: '#dbeafe', c: '#1d4ed8', bc: '#93c5fd', dot: '#1e6bbf' },
    { id: 'personal', label: 'Persönlich', bg: '#d1fae5', c: '#065f46', bc: '#6ee7b7', dot: '#0d7a6e' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="app">
        {/* ── Desktop Sidebar ── */}
        <nav className="sidebar-nav">
          <div className="sidebar-logo">FH</div>
          {NAV.map(item => (
            <button key={item.id} className={`sb-btn${item.id==='kalender'?' sb-active':''}`}
                    onClick={() => router.push(item.path)} title={item.label}>
              <span style={{fontSize:20}}>{item.emoji}</span>
              <span className="sb-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <div className="main-content">

          {/* Header */}
          <div className="cal-header">
            <div className="hdr-inner">
              <button className="hdr-back" onClick={() => router.push('/dashboard')}>‹</button>
              <div className="hdr-nav">
                <button className="hdr-nav-btn" onClick={() => nav(-1)}>‹</button>
                <span className="hdr-title">{calTitle}</span>
                <button className="hdr-nav-btn" onClick={() => nav(1)}>›</button>
              </div>
              <div className="hdr-actions">
                <button className="hdr-today-btn"
                        onClick={() => { setSelDate(TODAY); setCurMonth(TODAY.getMonth()); setCurYear(TODAY.getFullYear()) }}>
                  Heute
                </button>
                <button className="hdr-add-btn" onClick={() => openAdd()}>+</button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="toolbar-inner">
              <div className="view-pills">
                {(['tag','woche','monat','jahr'] as CalView[]).map(v => (
                  <button key={v} className={`view-btn${view===v?' active':''}`}
                          onClick={() => changeView(v)}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
              <div className="filter-chips">
                {filterChips.map(ch => (
                  <button key={ch.id}
                          className="filter-chip"
                          style={{ background:ch.bg, color:ch.c, borderColor: filter===ch.id ? ch.bc : 'transparent' }}
                          onClick={() => setFilter(ch.id as CalFilter)}>
                    <span className="chip-dot" style={{background:ch.dot}} />
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="cal-body">
            {view === 'monat' && (
              desktop ? (
                <div className="month-desktop">
                  <div>
                    <div className="card" style={{overflow:'hidden'}}>
                      <DowHeader />
                      <DaysGridDesktop
                        year={curYear} month={curMonth}
                        evOf={evOf} selDs={selDs} todayDs={todayDs}
                        cycleDays={cycleDays} hasCycle={cycle.enabled}
                        onSel={selDay}
                      />
                      <CycleLegend hasCycle={cycle.enabled} />
                    </div>
                  </div>
                  <div style={{position:'sticky', top:70, display:'flex', flexDirection:'column', gap:16}}>
                    <DayPanel
                      ds={selDs} evOf={evOf}
                      onEdit={openEdit} onDel={del}
                      onAdd={() => openAdd(selDs)}
                    />
                    {cycle.enabled && <CycleSidebarActive cycle={cycle} phase={cyclePhase} symptoms={symptoms} onToggleSymptom={s => setSymptoms(p => p.includes(s)?p.filter(x=>x!==s):[...p,s])} onEdit={() => setShowCycleSetup(true)} />}
                    {!cycle.enabled && filter !== 'family' && (
                      <button onClick={() => setShowCycleSetup(true)}
                              style={{width:'100%', padding:'12px', border:'1.5px dashed var(--r200)', borderRadius:'var(--rad)', background:'var(--r50)', color:'var(--r600)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, justifyContent:'center'}}>
                        <span style={{fontSize:16}}>♀</span> Zykluskalender aktivieren
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="card" style={{overflow:'hidden', marginBottom:14}}>
                    <DowHeader />
                    <DaysGridMobile
                      year={curYear} month={curMonth}
                      evOf={evOf} selDs={selDs} todayDs={todayDs}
                      cycleDays={cycleDays} hasCycle={cycle.enabled}
                      onSel={selDay}
                    />
                    <CycleLegend hasCycle={cycle.enabled} />
                  </div>
                  <DayPanel ds={selDs} evOf={evOf} onEdit={openEdit} onDel={del} onAdd={() => openAdd(selDs)} />
                  {cycle.enabled && <CycleSidebarActive cycle={cycle} phase={cyclePhase} symptoms={symptoms} onToggleSymptom={s => setSymptoms(p => p.includes(s)?p.filter(x=>x!==s):[...p,s])} onEdit={() => setShowCycleSetup(true)} />}
                  {!cycle.enabled && filter !== 'family' && (
                    <button onClick={() => setShowCycleSetup(true)}
                            style={{width:'100%', padding:'12px', border:'1.5px dashed var(--r200)', borderRadius:'var(--rad)', background:'var(--r50)', color:'var(--r600)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginTop:14}}>
                      <span style={{fontSize:16}}>♀</span> Zykluskalender aktivieren
                    </button>
                  )}
                </div>
              )
            )}

            {view === 'woche' && (
              <WocheView base={selDate} evOf={evOf} selDs={selDs} todayDs={todayDs}
                         cycleDays={cycleDays} hasCycle={cycle.enabled}
                         onSel={selDay} onEdit={openEdit} onDel={del} />
            )}
            {view === 'tag' && (
              <TagView date={selDate} evOf={evOf} onEdit={openEdit} onDel={del} />
            )}
            {view === 'jahr' && (
              <JahrView year={curYear} evOf={evOf} todayDs={todayDs}
                        onSel={ds => { selDay(ds); changeView('monat') }} />
            )}
          </div>

          {/* Mobile FAB */}
          <button className="mobile-fab" onClick={() => openAdd()}>+</button>

        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="bottom-nav">
          {NAV.map(item => (
            <button key={item.id} className={`bn-btn${item.id==='kalender'?' bn-active':''}`}
                    onClick={() => router.push(item.path)}>
              <span style={{fontSize:20}}>{item.emoji}</span>
              <span className="bn-label">{item.label}</span>
              {item.id==='kalender' && <span className="bn-indicator" />}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════ EVENT MODAL ═══════════ */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setModal(false) }}>
          <div className="modal-box">
            <div className="modal-handle" />
            <div className="modal-head">
              <span className="modal-title">{editId?'Termin bearbeiten':'Neuer Termin'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-scroll">

              {/* Titel + Mic */}
              <div className="form-group">
                <label className="form-label">Titel</label>
                <div style={{display:'flex',gap:8}}>
                  <input className="form-input" value={evTitle}
                         onChange={e => setEvTitle(e.target.value)}
                         placeholder="z.B. Arzttermin…" autoFocus />
                  <button className={`mic-btn${speech.active?' active':''}`}
                          onClick={speech.toggle} title={speech.active?'Stopp':'Spracheingabe'}>
                    {speech.active ? '⏹' : '🎤'}
                  </button>
                </div>
                {speech.active && (
                  <div style={{fontSize:11,color:'var(--r400)',fontWeight:600,marginTop:6,display:'flex',alignItems:'center',gap:6}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:'var(--r400)',display:'inline-block'}} />
                    Höre zu… auf Deutsch sprechen
                  </div>
                )}
              </div>

              {/* Datum + Zeit */}
              <div className="form-group form-row">
                <div>
                  <label className="form-label">Datum</label>
                  <input type="date" className="form-input" value={evDate}
                         onChange={e => setEvDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Uhrzeit</label>
                  <input type="time" className="form-input" value={evTime}
                         onChange={e => setEvTime(e.target.value)} />
                </div>
              </div>

              {/* Notiz */}
              <div className="form-group">
                <label className="form-label">Notiz</label>
                <input className="form-input" value={evDesc}
                       onChange={e => setEvDesc(e.target.value)} placeholder="Optional…" />
              </div>

              {/* Kalender-Typ */}
              <div className="form-group">
                <label className="form-label">Kalender</label>
                <div className="type-grid" style={{gridTemplateColumns: cycle.enabled?'repeat(3,1fr)':'repeat(2,1fr)'}}>
                  {[
                    {id:'personal',label:'Persönlich',ac:'#0d7a6e',ab:'#d1fae5'},
                    {id:'family',  label:'Familie',   ac:'#1e6bbf',ab:'#dbeafe'},
                    ...(cycle.enabled?[{id:'cycle',label:'Zyklus ♀',ac:'#c0405a',ab:'#fce7f3'}]:[]),
                  ].map(t => (
                    <button key={t.id} className="type-btn"
                            style={{
                              borderColor: evType===t.id ? t.ac : 'var(--bord)',
                              background:  evType===t.id ? t.ab : 'var(--surf2)',
                              color:       evType===t.id ? t.ac : 'var(--textm)',
                            }}
                            onClick={() => pickType(t.id as CalType)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Im persönlichen Kalender anzeigen */}
              {evType === 'family' && (
                <div className="form-group">
                  <label className="show-personal-row" onClick={() => setEvShowPers(p => !p)}>
                    <input type="checkbox" checked={evShowPers} onChange={e => setEvShowPers(e.target.checked)}
                           style={{width:18,height:18,accentColor:'#1e6bbf',cursor:'pointer',flexShrink:0}} />
                    <span style={{fontSize:13,fontWeight:500,color:'var(--text2)'}}>
                      Auch im persönlichen Kalender anzeigen
                    </span>
                  </label>
                </div>
              )}

              {/* Farbe */}
              <div className="form-group">
                <label className="form-label">Farbe</label>
                <div className="color-row">
                  {COLORS.map(c => (
                    <button key={c} className={`color-swatch${evColor===c?' sel':''}`}
                            style={{background:c}} onClick={() => setEvColor(c)} />
                  ))}
                </div>
              </div>

            </div>
            <div className="modal-foot">
              <div style={{display:'flex',gap:10}}>
                <button className="modal-btn-cancel" onClick={() => setModal(false)}>Abbrechen</button>
                <button className="modal-btn-save" onClick={save}>
                  <span style={{fontSize:16}}>💾</span>
                  {editId ? 'Speichern' : 'Termin speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ZYKLUS SETUP MODAL ═══════════ */}
      {showCycleSetup && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowCycleSetup(false) }}>
          <div className="modal-box">
            <div className="modal-handle" />
            <div className="modal-head">
              <span className="modal-title">Zykluskalender</span>
              <button className="modal-close" onClick={() => setShowCycleSetup(false)}>✕</button>
            </div>
            <div className="modal-scroll">
              <div style={{background:'var(--r50)',borderRadius:12,padding:'12px 14px',marginBottom:18,border:'1px solid var(--r200)'}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--r600)',marginBottom:4}}>♀ Persönliche Zyklus-Daten</div>
                <div style={{fontSize:12,color:'var(--r600)',opacity:.8,lineHeight:1.5}}>
                  Trage deine Zyklus-Daten ein. Fruchtbare Tage und Periodenvorhersagen werden automatisch berechnet und im Kalender markiert.
                </div>
              </div>
              <div className="setup-field">
                <label className="setup-label">Letzte Periode begann am</label>
                <input className="setup-inp" type="date" value={setupLPS} onChange={e => setSetupLPS(e.target.value)} />
              </div>
              <div className="setup-grid" style={{marginBottom:14}}>
                <div className="setup-field">
                  <label className="setup-label">Zykluslänge (Tage)</label>
                  <input className="setup-inp" type="number" value={setupCL} min="21" max="45" onChange={e => setSetupCL(e.target.value)} />
                </div>
                <div className="setup-field">
                  <label className="setup-label">Periodendauer (Tage)</label>
                  <input className="setup-inp" type="number" value={setupPL} min="2" max="10" onChange={e => setSetupPL(e.target.value)} />
                </div>
              </div>
              {cycle.enabled && (
                <button style={{width:'100%',padding:'10px',border:'none',borderRadius:10,background:'#fef2f2',color:'#dc2626',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginBottom:8}}
                        onClick={() => { if(confirm('Zykluskalender deaktivieren?')) { setCycle(p=>({...p,enabled:false})); setShowCycleSetup(false) } }}>
                  Zykluskalender deaktivieren
                </button>
              )}
            </div>
            <div className="modal-foot">
              <div style={{display:'flex',gap:10}}>
                <button className="modal-btn-cancel" onClick={() => setShowCycleSetup(false)}>Abbrechen</button>
                <button className="modal-btn-save" onClick={saveCycleSetup}
                        style={{background:'var(--r400)',boxShadow:'0 4px 14px rgba(192,64,90,.35)'}}>
                  <span style={{fontSize:16}}>✓</span> Aktivieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-KOMPONENTEN
// ════════════════════════════════════════════════════════════════════════════

function DowHeader() {
  return (
    <div className="dow-row" style={{padding:'8px 14px 0'}}>
      {DSHORT.map(d => <div key={d} className="dow-cell">{d}</div>)}
    </div>
  )
}

function CycleLegend({ hasCycle }: { hasCycle: boolean }) {
  return (
    <div className="cal-legend">
      <div className="legend-item"><div className="legend-dot" style={{background:'var(--o500)'}} />Familientermin</div>
      <div className="legend-item"><div className="legend-dot" style={{background:'var(--t600)'}} />Persönlich</div>
      <div className="legend-item"><div className="legend-dot" style={{background:'#d4a843'}} />Feiertag</div>
      {hasCycle && <>
        <div className="legend-item"><div className="legend-dot" style={{background:'var(--r400)'}} />Periode</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'var(--t400)'}} />Fruchtbar</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#d4a843',border:'2px solid #a16207'}} />Eisprung</div>
      </>}
    </div>
  )
}

function HolidayBanner({ ds }: { ds: string }) {
  const h = getHoliday(ds); if (!h) return null
  return (
    <div className="holiday-banner">
      <span style={{fontSize:16}}>🎉</span>
      <span className="holiday-banner-name">{h.name}</span>
      <span className="holiday-banner-scope">{h.national ? 'Bundesweit' : h.bundesland}</span>
    </div>
  )
}

function EvRow({ e, onEdit, onDel }: { e: CalEvent; onEdit:(id:number)=>void; onDel:(id:number)=>void }) {
  const badgeStyle: React.CSSProperties = e.type==='family'
    ? {background:'#dbeafe',color:'#1d4ed8'}
    : e.type==='cycle'
    ? {background:'#fce7f3',color:'#be185d'}
    : {background:'#d1fae5',color:'#065f46'}

  return (
    <div className="ev-row">
      <div className="ev-stripe" style={{background:e.color}} />
      <div className="ev-content">
        <div className="ev-title">{e.title}</div>
        <div className="ev-meta">
          {e.time || 'Ganztag'}
          {' · '}{e.type==='family'?'Familie':e.type==='cycle'?'Zyklus':'Persönlich'}
          {e.showPersonal && e.type==='family' ? ' · auch pers.' : ''}
          {e.desc ? ` · ${e.desc}` : ''}
        </div>
      </div>
      <span className="ev-badge" style={badgeStyle}>
        {e.type==='family'?'Fam':e.type==='cycle'?'♀':'Pers'}
      </span>
      <button className="ev-btn ev-btn-edit" onClick={() => onEdit(e.id)} title="Bearbeiten">✏️</button>
      <button className="ev-btn ev-btn-del"  onClick={() => onDel(e.id)}  title="Löschen">🗑</button>
    </div>
  )
}

function DayPanel({ ds, evOf, onEdit, onDel, onAdd }: {
  ds: string; evOf:(ds:string)=>CalEvent[]; onEdit:(id:number)=>void; onDel:(id:number)=>void; onAdd?:()=>void
}) {
  const d   = parseDate(ds)
  const evs = evOf(ds)
  return (
    <div className="card card-pad day-panel">
      <div className="day-panel-head">
        <div className="day-panel-title">{DLONG[d.getDay()]}, {d.getDate()}. {MSHORT[d.getMonth()]}</div>
        {onAdd && <button className="day-panel-add" onClick={onAdd}>+ Termin</button>}
      </div>
      <HolidayBanner ds={ds} />
      {evs.length===0
        ? <div className="no-events">Keine Termine an diesem Tag</div>
        : evs.map(e => <EvRow key={e.id} e={e} onEdit={onEdit} onDel={onDel} />)
      }
    </div>
  )
}

function DaysGridDesktop({ year, month, evOf, selDs, todayDs, cycleDays, hasCycle, onSel }: {
  year:number; month:number; evOf:(ds:string)=>CalEvent[]; selDs:string; todayDs:string;
  cycleDays:Record<string,'period'|'fertile'|'ovulation'>; hasCycle:boolean; onSel:(ds:string)=>void
}) {
  const first = new Date(year,month,1)
  const last  = new Date(year,month+1,0)
  const sw    = (first.getDay()+6)%7

  return (
    <div className="days-grid">
      {Array.from({length:sw},(_,i)=><div key={`p${i}`} style={{minHeight:88}} />)}
      {Array.from({length:last.getDate()},(_,i)=>{
        const d  = i+1
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        const isT   = ds===todayDs, isSel = ds===selDs
        const hol   = getHoliday(ds)
        const evs   = evOf(ds)
        const cy    = hasCycle ? cycleDays[ds] : undefined
        return (
          <div key={d} className={`day-cell${isT?' today':''}${isSel&&!isT?' selected':''}${hol&&!cy?' has-holiday':''}${cy==='period'?' period-day':''}${cy==='fertile'?' fertile-day':''}${cy==='ovulation'?' ovulation-day':''}`}
               onClick={() => onSel(ds)}>
            {cy && hasCycle && <div className="cycle-dot" style={{background:cy==='period'?'var(--r400)':cy==='ovulation'?'#d4a843':'var(--t400)'}} />}
            <div className="day-num-wrap">
              <div className="day-num">{d}</div>
              {hol && <div className="day-hol-name">{hol.national?hol.name:hol.name.split(' ')[0]}</div>}
            </div>
            {hol && <div className="day-hol-badge">{hol.national?'🏛 Bundesweit':hol.bundesland}</div>}
            <div style={{flex:1,overflow:'hidden'}}>
              {evs.slice(0,2).map(e=>(
                <div key={e.id} className="day-chip" style={{background:e.color}}>
                  {e.time?<span style={{opacity:.8,fontSize:9}}>{e.time} </span>:null}{e.title}
                </div>
              ))}
              {evs.length>2 && <div className="day-more">+{evs.length-2} mehr</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DaysGridMobile({ year, month, evOf, selDs, todayDs, cycleDays, hasCycle, onSel }: {
  year:number; month:number; evOf:(ds:string)=>CalEvent[]; selDs:string; todayDs:string;
  cycleDays:Record<string,'period'|'fertile'|'ovulation'>; hasCycle:boolean; onSel:(ds:string)=>void
}) {
  const first = new Date(year,month,1)
  const last  = new Date(year,month+1,0)
  const sw    = (first.getDay()+6)%7

  return (
    <div className="days-grid-mobile">
      {Array.from({length:sw},(_,i)=><div key={`p${i}`} />)}
      {Array.from({length:last.getDate()},(_,i)=>{
        const d  = i+1
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
        const isT   = ds===todayDs, isSel = ds===selDs
        const hol   = getHoliday(ds)
        const evs   = evOf(ds)
        const cy    = hasCycle ? cycleDays[ds] : undefined
        return (
          <div key={d} className={`day-cell-m${isT?' today':''}${isSel&&!isT?' selected':''}${hol&&!cy?' has-holiday':''}${cy==='period'?' period-day':''}${cy==='fertile'?' fertile-day':''}${cy==='ovulation'?' ovulation-day':''}`}
               onClick={() => onSel(ds)}>
            {hol && <span className="hol-star">★</span>}
            <div className="day-num-m">{d}</div>
            <div className="day-dots">
              {evs.slice(0,3).map(e=><div key={e.id} className="day-dot" style={{background:e.color}} />)}
              {hol && !evs.length && <div className="day-dot" style={{background:'#d4a843'}} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WocheView({ base, evOf, selDs, todayDs, cycleDays, hasCycle, onSel, onEdit, onDel }: {
  base:Date; evOf:(ds:string)=>CalEvent[]; selDs:string; todayDs:string;
  cycleDays:Record<string,'period'|'fertile'|'ovulation'>; hasCycle:boolean;
  onSel:(ds:string)=>void; onEdit:(id:number)=>void; onDel:(id:number)=>void
}) {
  const days = Array.from({length:7},(_,i)=>addD(wkStart(base),i))
  return (
    <div>
      <div className="card" style={{marginBottom:14,overflow:'hidden'}}>
        <div className="week-strip">
          {days.map(d=>{
            const ds  = fd(d), isT = ds===todayDs, isSel = ds===selDs
            const cy  = hasCycle ? cycleDays[ds] : undefined
            return (
              <button key={ds}
                      className={`week-day-btn${isT?' wdb-today':''}${isSel&&!isT?' wdb-sel':''}`}
                      style={cy==='period'?{background:'var(--r50)'}:cy==='fertile'?{background:'var(--t50)'}:cy==='ovulation'?{background:'var(--g50)'}:undefined}
                      onClick={()=>onSel(ds)}>
                <span className="wdb-dow">{DSHORT[(d.getDay()+6)%7]}</span>
                <span className="wdb-num">{d.getDate()}</span>
                <div style={{display:'flex',gap:2}}>
                  {evOf(ds).slice(0,2).map(e=>(
                    <div key={e.id} style={{width:4,height:4,borderRadius:'50%',background:isT?'rgba(255,255,255,.7)':e.color}} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      {days.map(d=>{
        const ds  = fd(d), isT = ds===todayDs
        const evs = evOf(ds)
        return (
          <div key={ds} className="week-day-card">
            <div className="wdc-head">
              <span className="wdc-date">{DLONG[d.getDay()]}, {d.getDate()}. {MSHORT[d.getMonth()]}</span>
              {isT && <span className="wdc-today-badge">HEUTE</span>}
              {getHoliday(ds) && <span style={{fontSize:11,color:'#a16207',fontWeight:600}}>🎉 {getHoliday(ds)!.name}</span>}
            </div>
            <div className="wdc-body">
              {evs.length===0
                ? <span style={{fontSize:12,color:'var(--textm)'}}>Keine Termine</span>
                : evs.map(e=><EvRow key={e.id} e={e} onEdit={onEdit} onDel={onDel} />)
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TagView({ date, evOf, onEdit, onDel }: {
  date:Date; evOf:(ds:string)=>CalEvent[]; onEdit:(id:number)=>void; onDel:(id:number)=>void
}) {
  const ds  = fd(date)
  const evs = evOf(ds)
  return (
    <div className="card card-pad">
      <div style={{fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:14,fontFamily:"'DM Serif Display',serif"}}>
        {DLONG[date.getDay()]}, {date.getDate()}. {MONTHS[date.getMonth()]} {date.getFullYear()}
      </div>
      <HolidayBanner ds={ds} />
      {evs.length===0
        ? <div className="no-events">Keine Termine an diesem Tag</div>
        : evs.map(e=><EvRow key={e.id} e={e} onEdit={onEdit} onDel={onDel} />)
      }
    </div>
  )
}

function JahrView({ year, evOf, todayDs, onSel }: {
  year:number; evOf:(ds:string)=>CalEvent[]; todayDs:string; onSel:(ds:string)=>void
}) {
  return (
    <div className="year-grid">
      {Array.from({length:12},(_,m)=>{
        const first = new Date(year,m,1), last = new Date(year,m+1,0), sw=(first.getDay()+6)%7
        return (
          <div key={m} className="year-month">
            <div className="ym-title">{MONTHS[m]}</div>
            <div className="ym-grid">
              {DSHORT.map(d=><div key={d} className="ym-dow">{d[0]}</div>)}
              {Array.from({length:sw},(_,i)=><div key={`p${i}`} />)}
              {Array.from({length:last.getDate()},(_,i)=>{
                const d  = i+1
                const ds = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const isT = ds===todayDs, hasEv = evOf(ds).length>0, hol = getHoliday(ds)
                return (
                  <button key={d} className={`ym-day${isT?' ym-today':''}${hasEv&&!isT?' ym-has-ev':''}${hol&&!isT&&!hasEv?' ym-hol':''}`}
                          onClick={()=>onSel(ds)}>
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Zyklus Sidebar (aktiv) ─────────────────────────────────────────────────
const SYMPTOM_LIST = ['Schmerzen','Müdigkeit','Stimmung','Kopfschmerz','Krämpfe','Übelkeit']

function CycleSidebarActive({ cycle, phase, symptoms, onToggleSymptom, onEdit }: {
  cycle: CycleSettings
  phase: ReturnType<typeof getCyclePhase>
  symptoms: string[]
  onToggleSymptom: (s:string) => void
  onEdit: () => void
}) {
  return (
    <div className="cycle-card">
      <div className="cycle-head">
        <span style={{fontSize:16}}>♀</span>
        <span className="cycle-title">Zykluskalender</span>
        <span className="cycle-active-badge">Aktiv</span>
        <button onClick={onEdit} style={{border:'none',background:'none',cursor:'pointer',color:'var(--r400)',fontSize:12,fontWeight:600,fontFamily:'inherit',flexShrink:0}}>bearbeiten</button>
      </div>
      <div className="cycle-body">
        {phase && (
          <div className="phase-block">
            <div className="phase-name">{phase.name}</div>
            <div className="phase-desc">{phase.desc}</div>
            <div className="phase-bar">
              <div className="phase-fill" style={{width:`${Math.min(Math.max(phase.pct,0),100)}%`,background:phase.color}} />
            </div>
          </div>
        )}
        <div className="cycle-stats">
          <div className="cycle-stat">
            <div className="cycle-stat-val">{cycle.cycleLength}</div>
            <div className="cycle-stat-lbl">Zyklus Tage</div>
          </div>
          <div className="cycle-stat">
            <div className="cycle-stat-val">{cycle.periodLength}</div>
            <div className="cycle-stat-lbl">Perioden Tage</div>
          </div>
          <div className="cycle-stat">
            <div className="cycle-stat-val">{Math.max(0,cycle.cycleLength-14-4)}</div>
            <div className="cycle-stat-lbl">Fruchtb. Tage</div>
          </div>
        </div>
        <div style={{fontSize:10.5,fontWeight:700,color:'var(--r400)',marginBottom:7,textTransform:'uppercase',letterSpacing:'.05em'}}>Symptome heute</div>
        <div className="symptom-row">
          {SYMPTOM_LIST.map(s=>(
            <button key={s} className={`symptom-chip${symptoms.includes(s)?' on':''}`}
                    onClick={()=>onToggleSymptom(s)}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  )
}