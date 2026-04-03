// lib/holidays.ts
// ─────────────────────────────────────────────────────────────────────────────
// Deutsche Feiertage 2025 — vollständig und korrekt
//
// WICHTIG: 31. Oktober (Reformationstag) ist NUR in diesen Bundesländern
// ein gesetzlicher Feiertag: BB, HB, HH, MV, NI, SN, ST, TH
// NICHT in: Bayern (BY), Baden-Württemberg (BW), Hessen (HE),
//           NRW (NW), Rheinland-Pfalz (RP), Saarland (SL)
// ─────────────────────────────────────────────────────────────────────────────

export interface Holiday {
  name:     string
  abbr:     string    // Kurzanzeige im Kalender
  national: boolean   // true = alle 16 Bundesländer
  states:   string[]  // betroffene Bundesländer (leer wenn national=true)
}

/**
 * Feste + bewegliche Feiertage 2025.
 * Schlüssel: 'MM-DD'
 */
export const HOLIDAYS_2025: Record<string, Holiday> = {

  // ── Bundesweite Feiertage ──────────────────────────────────────────────
  '01-01': { name: 'Neujahr',              abbr: 'ALL',  national: true,  states: [] },
  '04-18': { name: 'Karfreitag',           abbr: 'ALL',  national: true,  states: [] },
  '04-20': { name: 'Ostersonntag',         abbr: 'ALL',  national: true,  states: [] },
  '04-21': { name: 'Ostermontag',          abbr: 'ALL',  national: true,  states: [] },
  '05-01': { name: 'Tag der Arbeit',       abbr: 'ALL',  national: true,  states: [] },
  '05-29': { name: 'Christi Himmelfahrt',  abbr: 'ALL',  national: true,  states: [] },
  '06-08': { name: 'Pfingstsonntag',       abbr: 'ALL',  national: true,  states: [] },
  '06-09': { name: 'Pfingstmontag',        abbr: 'ALL',  national: true,  states: [] },
  '10-03': { name: 'Tag d. Dt. Einheit',   abbr: 'ALL',  national: true,  states: [] },
  '12-25': { name: '1. Weihnachtstag',     abbr: 'ALL',  national: true,  states: [] },
  '12-26': { name: '2. Weihnachtstag',     abbr: 'ALL',  national: true,  states: [] },

  // ── Nur bestimmte Bundesländer ─────────────────────────────────────────
  '01-06': {
    name: 'Heilige Drei Könige',
    abbr: 'BY,BW,ST',
    national: false,
    states: ['BY', 'BW', 'ST'],
  },
  '03-08': {
    name: 'Internationaler Frauentag',
    abbr: 'BE,MV',
    national: false,
    states: ['BE', 'MV'],
  },
  '06-19': {
    name: 'Fronleichnam',
    abbr: 'BY,BW,HE,NW+',
    national: false,
    states: ['BY', 'BW', 'HE', 'NW', 'RP', 'SL', 'SN', 'TH'],
  },
  '08-15': {
    name: 'Mariä Himmelfahrt',
    abbr: 'BY,SL',
    national: false,
    states: ['BY', 'SL'],
  },

  // ⚠️  REFORMATIONSTAG: 31.10. ist KEIN Feiertag in Bayern, BW, HE, NW, RP, SL!
  '10-31': {
    name: 'Reformationstag',
    abbr: 'BB,HB,HH,MV+',
    national: false,
    states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'TH'],
    // Nicht in: BY, BW, HE, NW, RP, SL
  },

  '11-01': {
    name: 'Allerheiligen',
    abbr: 'BY,BW,NW+',
    national: false,
    states: ['BY', 'BW', 'NW', 'RP', 'SL'],
  },
  '11-19': {
    name: 'Buß- und Bettag',
    abbr: 'SN',
    national: false,
    states: ['SN'],
  },
}

/**
 * Gibt den Feiertag für ein gegebenes Datum zurück.
 * @param dateStr  Format 'YYYY-MM-DD'
 * @param state    Bundesland-Kürzel z.B. 'BY'. Default 'ALL' = zeige alle.
 */
export function getHoliday(
  dateStr: string,
  state: string = 'ALL'
): Holiday | null {
  const [, m, d] = dateStr.split('-')
  const key = `${m}-${d}`
  const hol = HOLIDAYS_2025[key]
  if (!hol) return null

  // Alle anzeigen
  if (state === 'ALL') return hol

  // Bundesweite Feiertage immer anzeigen
  if (hol.national) return hol

  // Regionaler Feiertag: prüfen ob Bundesland dabei ist
  return hol.states.includes(state) ? hol : null
}