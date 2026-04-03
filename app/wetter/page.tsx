'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wind, MapPin, Search, Clock, Umbrella,
  ArrowUp, ArrowDown, AlertTriangle, RefreshCw,
  Droplets, Eye, Gauge, Check, X
} from 'lucide-react'

const API_KEY = '9c173a5f26ac74af2bacb874e4208735'
const BASE = 'https://api.openweathermap.org'

// ── Typen ─────────────────────────────────────────────────────
interface WeatherData {
  city: string; country: string
  temp: number; feelsLike: number; max: number; min: number
  condition: string; conditionId: number
  humidity: number; wind: number; windDir: number
  visibility: number; pressure: number
  isRaining: boolean; icon: string
  sunrise: number; sunset: number
  lat: number; lon: number
}
interface HourlyItem {
  time: string; hour: number; temp: number
  mm: number; pop: number; conditionId: number; isRain: boolean
}
interface Alert { event: string; description: string; start: number; end: number }
interface DailyItem {
  date: string; weekday: string; conditionId: number
  max: number; min: number; pop: number; mm: number; uvIndex: number
}
interface SearchResult { name: string; country: string; state?: string; lat: number; lon: number }

// ── Helpers ───────────────────────────────────────────────────
const windDirLabel = (deg: number) => ['N','NO','O','SO','S','SW','W','NW'][Math.round(deg/45)%8]
const fmt = (unix: number) => new Date(unix*1000).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
const isRainId = (id: number) => id >= 200 && id < 600

function wxIcon(id: number, day = true) {
  if (id >= 200 && id < 300) return '⛈'
  if (id >= 300 && id < 400) return '🌦'
  if (id >= 500 && id < 600) return id >= 502 ? '🌧' : '🌦'
  if (id >= 600 && id < 700) return '❄️'
  if (id >= 700 && id < 800) return '🌫'
  if (id === 800) return day ? '☀️' : '🌙'
  if (id === 801) return '🌤'
  if (id === 802) return '⛅'
  return '☁️'
}

function analyzeRain(hourly: HourlyItem[], currentlyRaining: boolean) {
  const rainSlots = hourly.filter(h => h.isRain && h.pop > 0.25)
  if (!rainSlots.length && !currentlyRaining)
    return { status: 'Kein Regen in Sicht', startsAt: null, endsAt: null, durationH: 0, active: false }
  if (currentlyRaining) {
    const last = [...rainSlots].reverse()[0] ?? rainSlots[0]
    return { status: 'Aktuell Regen', startsAt: 'Jetzt', endsAt: last?.time ?? null,
             durationH: rainSlots.length, active: true }
  }
  const first = rainSlots[0], last = rainSlots[rainSlots.length-1]
  return { status: `Regen ab ${first.time} Uhr`, startsAt: first.time, endsAt: last.time,
           durationH: rainSlots.length, active: false }
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function WetterApp() {
  const [weather,   setWeather]   = useState<WeatherData | null>(null)
  const [hourly,    setHourly]    = useState<HourlyItem[]>([])
  const [alerts,    setAlerts]    = useState<Alert[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [showDrop,  setShowDrop]  = useState(false)
  const [daily,     setDaily]     = useState<DailyItem[]>([])
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // ── Wetter + Forecast + Warnungen laden ───────────────────
  const fetchByCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setLoading(true); setError(null); setShowDrop(false); setResults([]); setDaily([])
    try {
      // 1) Aktuelles Wetter
      const r1 = await fetch(
        `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de`
      )
      if (!r1.ok) throw new Error(r1.status === 401 ? 'API-Key ungültig – bitte prüfen' : `Fehler ${r1.status}`)
      const cur = await r1.json()

      setWeather({
        city: label ?? cur.name, country: cur.sys.country,
        temp: Math.round(cur.main.temp), feelsLike: Math.round(cur.main.feels_like),
        max: Math.round(cur.main.temp_max), min: Math.round(cur.main.temp_min),
        condition: cur.weather[0].description, conditionId: cur.weather[0].id,
        humidity: cur.main.humidity,
        wind: Math.round(cur.wind.speed * 3.6), windDir: cur.wind.deg ?? 0,
        visibility: Math.round((cur.visibility ?? 10000) / 1000),
        pressure: cur.main.pressure,
        isRaining: isRainId(cur.weather[0].id), icon: cur.weather[0].icon,
        sunrise: cur.sys.sunrise, sunset: cur.sys.sunset,
        lat: cur.coord.lat, lon: cur.coord.lon,
      })

      // 2) Forecast (3h-Schritte)
      const r2 = await fetch(
        `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de&cnt=16`
      )
      if (r2.ok) {
        const fc = await r2.json()
        const fcItems = fc.list.slice(0, 16).map((it: any) => {
          const h = new Date(it.dt * 1000).getHours()
          return {
            time: `${String(h).padStart(2,'0')}:00`, hour: h,
            temp: Math.round(it.main.temp), mm: it.rain?.['3h'] ?? 0,
            pop: it.pop ?? 0, conditionId: it.weather[0].id,
            isRain: isRainId(it.weather[0].id),
            windSpeedKmh: Math.round((it.wind?.speed ?? 0) * 3.6),
          }
        })
        setHourly(fcItems)

        // Warnungen aus Forecast ableiten (kein OneCall 3.0 Abo nötig)
        const nowTs = Math.floor(Date.now() / 1000)
        const derived: Alert[] = []

        const stormSlots = fcItems.filter((it: any) => it.windSpeedKmh >= 60)
        if (stormSlots.length > 0) derived.push({
          event: '💨 Sturmwarnung – Wind bis ' + Math.max(...stormSlots.map((s: any) => s.windSpeedKmh)) + ' km/h',
          description: 'Starke Windböen erwartet (' + stormSlots[0].time + '–' + stormSlots[stormSlots.length-1].time + ' Uhr).',
          start: nowTs, end: nowTs + stormSlots.length * 10800,
        })

        const thunderSlots = fcItems.filter((it: any) => it.conditionId >= 200 && it.conditionId < 300)
        if (thunderSlots.length > 0) derived.push({
          event: '⛈ Gewitterwarnung',
          description: 'Gewitter erwartet: ' + thunderSlots[0].time + '–' + thunderSlots[thunderSlots.length-1].time + ' Uhr.',
          start: nowTs, end: nowTs + thunderSlots.length * 10800,
        })

        const snowSlots = fcItems.filter((it: any) => it.conditionId >= 600 && it.conditionId < 700)
        if (snowSlots.length > 0) derived.push({
          event: '❄️ Schnee- / Glatteiswarnung',
          description: 'Schneefall erwartet: ' + snowSlots[0].time + '–' + snowSlots[snowSlots.length-1].time + ' Uhr.',
          start: nowTs, end: nowTs + snowSlots.length * 10800,
        })

        const maxT = Math.max(...fcItems.map((it: any) => it.temp))
        const minT = Math.min(...fcItems.map((it: any) => it.temp))
        if (maxT >= 35) derived.push({
          event: '🌡️ Hitzewarnung – bis ' + maxT + '°C',
          description: 'Sehr hohe Temperaturen in den nächsten 48 h. Viel trinken, Mittagssonne meiden.',
          start: nowTs, end: nowTs + 86400,
        })
        if (minT <= -5) derived.push({
          event: '🥶 Frostwarnung – bis ' + minT + '°C',
          description: 'Starker Frost erwartet. Glatteisgefahr auf Straßen, Rohre schützen.',
          start: nowTs, end: nowTs + 86400,
        })

        setAlerts(derived)
      }

      // 3) 14-Tage Vorhersage via Open-Meteo (kostenlos, kein Key)
      try {
        const r3 = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
          '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max' +
          '&timezone=auto&forecast_days=14'
        )
        if (r3.ok) {
          const dm = await r3.json()
          const wdMap: Record<number,number> = {
            0:800, 1:800, 2:802, 3:804,
            45:741, 48:741,
            51:300, 53:301, 55:302,
            61:500, 63:501, 65:502,
            71:600, 73:601, 75:602,
            77:611,
            80:520, 81:521, 82:522,
            85:620, 86:621,
            95:200, 96:201, 99:202,
          }
          const days: DailyItem[] = dm.daily.time.map((d: string, i: number) => {
            const wc = dm.daily.weathercode[i]
            const dt = new Date(d)
            return {
              date: dt.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }),
              weekday: dt.toLocaleDateString('de-DE', { weekday:'short' }),
              conditionId: wdMap[wc] ?? 800,
              max: Math.round(dm.daily.temperature_2m_max[i]),
              min: Math.round(dm.daily.temperature_2m_min[i]),
              pop: (dm.daily.precipitation_probability_max[i] ?? 0) / 100,
              mm: Math.round((dm.daily.precipitation_sum[i] ?? 0) * 10) / 10,
              uvIndex: Math.round(dm.daily.uv_index_max[i] ?? 0),
            }
          })
          setDaily(days)
        }
      } catch {}

    } catch (e: any) {
      setError(e.message ?? 'Verbindungsfehler')
    }
    setLoading(false)
  }, [])

  // ── Geocoding Suche (Debounced) ───────────────────────────
  const fetchGeo = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDrop(false); return }
    setSearching(true)
    try {
      const r = await fetch(
        `${BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=6&appid=${API_KEY}`
      )
      if (r.ok) {
        const data: any[] = await r.json()
        const mapped = data.map(d => ({
          name: d.local_names?.de ?? d.name,
          country: d.country, state: d.state,
          lat: d.lat, lon: d.lon,
        }))
        setResults(mapped)
        setShowDrop(mapped.length > 0)
      }
    } catch {}
    setSearching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchGeo(query), 380)
    return () => clearTimeout(t)
  }, [query, fetchGeo])

  // GPS beim Start
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => fetchByCoords(p.coords.latitude, p.coords.longitude),
      () => fetchByCoords(49.7213, 10.2240, 'Schweinfurt')
    )
  }, [fetchByCoords])

  // Stadt auswählen
  const pickCity = (r: SearchResult) => {
    setQuery(''); fetchByCoords(r.lat, r.lon, r.name)
  }

  const rain  = weather ? analyzeRain(hourly, weather.isRaining) : null
  const isDay = weather ? Date.now()/1000 > weather.sunrise && Date.now()/1000 < weather.sunset : true

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000c1a] via-[#001830] to-[#000810] text-white font-sans">

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-cyan-600/5 blur-[120px]" />
        <div className="absolute -bottom-20 -right-10 w-[400px] h-[400px] rounded-full bg-blue-800/8 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 space-y-4">

        {/* ═══ HEADER ═══ */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <MapPin size={14} />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">
                  {loading ? 'Lädt…' : 'Aktueller Standort'}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none">
                {weather?.city ?? '—'}
                {weather && <span className="text-white/25 text-2xl font-light ml-2">{weather.country}</span>}
              </h1>
              <p className="capitalize text-cyan-300/70 text-sm font-medium mt-2">
                {weather ? `${wxIcon(weather.conditionId, isDay)}  ${weather.condition}` : ''}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-7xl font-thin text-cyan-400 leading-none tracking-tighter">
                {loading
                  ? <RefreshCw className="animate-spin text-cyan-400/50 ml-auto" size={48} />
                  : `${weather?.temp ?? '—'}°`
                }
              </div>
              <p className="text-white/30 text-xs mt-1">Gefühlt {weather?.feelsLike ?? '—'}°</p>
              <div className="flex justify-end gap-2 mt-3">
                <span className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                  <ArrowUp size={10} className="text-red-400" />{weather?.max ?? '—'}°
                </span>
                <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                  <ArrowDown size={10} className="text-blue-400" />{weather?.min ?? '—'}°
                </span>
              </div>
            </div>
          </div>

          {/* ── Suchfeld mit Live-Dropdown ── */}
          <div className="relative mt-7">
            <div className="relative group">
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); if (!e.target.value) setShowDrop(false) }}
                onFocus={() => results.length > 0 && setShowDrop(true)}
                placeholder="Stadt suchen… z.B. Berlin, Tokyo, 97421"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm
                           outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-white/20"
              />
              <Search size={17} className="absolute left-4 top-[14px] text-white/20 group-focus-within:text-cyan-400 transition-colors" />
              {searching
                ? <RefreshCw size={16} className="absolute right-4 top-[15px] animate-spin text-cyan-400" />
                : query
                  ? <button onClick={() => { setQuery(''); setShowDrop(false); setResults([]) }}
                            className="absolute right-4 top-[14px] text-white/20 hover:text-white/60 transition-colors">
                      <X size={16} />
                    </button>
                  : null
              }
            </div>

            {/* Dropdown */}
            {showDrop && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#00111f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-white/25 font-black uppercase tracking-widest">
                    {results.length} Städte gefunden — auswählen zum Übernehmen
                  </span>
                  <button onClick={() => setShowDrop(false)} className="text-white/20 hover:text-white/50 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => pickCity(r)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-cyan-500/10
                               transition-colors text-left group border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={13} className="text-cyan-400/40 group-hover:text-cyan-400 transition-colors shrink-0" />
                      <div>
                        <span className="font-semibold text-sm">{r.name}</span>
                        {r.state && <span className="text-white/25 text-xs ml-2">{r.state}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white/20 bg-white/5 px-2 py-0.5 rounded-lg">{r.country}</span>
                      <Check size={13} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* ═══ WARNUNGEN ═══ */}
        {alerts.length > 0 && alerts.map((a, i) => (
          <div key={i} className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 flex gap-4">
            <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-orange-200 text-sm uppercase tracking-wide">{a.event}</p>
              <p className="text-orange-100/55 text-xs mt-1 leading-relaxed line-clamp-3">{a.description}</p>
              <p className="text-orange-400/40 text-xs mt-2">{fmt(a.start)} – {fmt(a.end)} Uhr</p>
            </div>
          </div>
        ))}

        {/* ═══ REGEN-CHECK ═══ */}
        {weather && rain && (
          <div className={`rounded-3xl p-6 border flex flex-col sm:flex-row justify-between items-center gap-5
            ${rain.active
              ? 'bg-blue-600/15 border-blue-500/30'
              : rain.startsAt
                ? 'bg-amber-600/10 border-amber-500/20'
                : 'bg-emerald-600/8 border-emerald-500/15'}`}>
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl border ${rain.active ? 'bg-blue-400/20 border-blue-400/30' : 'bg-white/5 border-white/10'}`}>
                <Umbrella size={30} className={rain.active ? 'text-blue-300' : rain.startsAt ? 'text-amber-300' : 'text-emerald-400'} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">Regen-Analyse</p>
                <h4 className="text-xl font-bold">{rain.status}</h4>
                {rain.durationH > 0 && (
                  <p className="text-white/30 text-xs mt-0.5">
                    Dauer: ca. {rain.durationH} Stunde{rain.durationH !== 1 ? 'n' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              {rain.startsAt ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center min-w-[110px]">
                    <span className="text-[9px] font-black uppercase text-cyan-400 block mb-1">Beginnt</span>
                    <span className="text-2xl font-mono font-bold">{rain.startsAt}</span>
                  </div>
                  {rain.endsAt && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center min-w-[110px]">
                      <span className="text-[9px] font-black uppercase text-white/25 block mb-1">Endet</span>
                      <span className="text-2xl font-mono font-bold">{rain.endsAt}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-4 text-center">
                  <span className="text-[9px] font-black uppercase text-emerald-400 block mb-1">Status</span>
                  <span className="text-xl font-bold text-emerald-300">✓ Trocken</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ DETAILS ═══ */}
        {weather && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Wind,     label: 'Wind',      val: `${weather.wind} km/h`, sub: windDirLabel(weather.windDir) },
              { icon: Droplets, label: 'Feuchte',    val: `${weather.humidity}%`, sub: weather.humidity > 70 ? 'Hoch' : 'Normal' },
              { icon: Eye,      label: 'Sicht',      val: `${weather.visibility} km`, sub: weather.visibility >= 10 ? 'Gut' : 'Eingeschränkt' },
              { icon: Gauge,    label: 'Luftdruck',  val: `${weather.pressure}`, sub: 'hPa' },
            ].map(({ icon: Ic, label, val, sub }) => (
              <div key={label} className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                <Ic size={16} className="text-cyan-400 mb-3" />
                <p className="text-[9px] text-white/25 uppercase font-black tracking-wider">{label}</p>
                <p className="text-lg font-bold mt-1">{val}</p>
                <p className="text-xs text-white/25 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ═══ SONNENZEITEN ═══ */}
        {weather && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/8 border border-amber-500/15 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-2xl">🌅</span>
              <div>
                <p className="text-[9px] text-amber-400/50 font-black uppercase tracking-wider">Aufgang</p>
                <p className="text-lg font-bold">{fmt(weather.sunrise)}</p>
              </div>
            </div>
            <div className="bg-orange-500/8 border border-orange-500/15 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-2xl">🌇</span>
              <div>
                <p className="text-[9px] text-orange-400/50 font-black uppercase tracking-wider">Untergang</p>
                <p className="text-lg font-bold">{fmt(weather.sunset)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STUNDENTREND ═══ */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6">
          <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-5 flex items-center gap-2">
            <Clock size={12} /> 48h Stunden-Trend
          </h3>
          {hourly.length === 0
            ? <p className="text-white/15 text-sm text-center py-6">Lade Stundendaten…</p>
            : (
              <div className="flex overflow-x-auto gap-2.5 pb-3" style={{scrollbarWidth:'thin', scrollbarColor:'rgba(0,210,255,0.15) transparent'}}>
                {hourly.map((h, i) => (
                  <div key={i} className={`flex flex-col items-center min-w-[72px] p-3.5 rounded-2xl border transition-all cursor-default
                    ${h.isRain && h.pop > 0.25 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'}`}>
                    <span className="text-[10px] text-white/25 font-bold">{h.time}</span>
                    <span className="text-xl my-2">{wxIcon(h.conditionId, h.hour >= 6 && h.hour < 20)}</span>
                    <span className="text-base font-bold">{h.temp}°</span>
                    <div className="mt-2 w-full">
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{width:`${Math.round(h.pop*100)}%`}} />
                      </div>
                      <span className="text-[9px] text-cyan-400/50 block text-center mt-1">{Math.round(h.pop*100)}%</span>
                    </div>
                    {h.mm > 0 && <span className="text-[9px] text-blue-400 font-bold mt-0.5">{h.mm.toFixed(1)}mm</span>}
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* ═══ 14-TAGE VORHERSAGE ═══ */}
        {daily.length > 0 && (
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6">
            <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-5 flex items-center gap-2">
              <Clock size={12} /> 14-Tage Vorhersage
            </h3>
            <div className="space-y-2">
              {daily.map((d, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                  ${i === 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}>

                  {/* Wochentag + Datum */}
                  <div className="w-16 shrink-0">
                    <p className={`text-xs font-black uppercase ${i === 0 ? 'text-cyan-400' : 'text-white/60'}`}>
                      {i === 0 ? 'Heute' : d.weekday}
                    </p>
                    <p className="text-[10px] text-white/25">{d.date}</p>
                  </div>

                  {/* Icon */}
                  <span className="text-xl w-8 text-center shrink-0">{wxIcon(d.conditionId)}</span>

                  {/* Regenbalken */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400/60 rounded-full" style={{width: Math.round(d.pop*100)+'%'}} />
                      </div>
                      <span className="text-[10px] text-cyan-400/60 w-7 text-right shrink-0">{Math.round(d.pop*100)}%</span>
                    </div>
                    {d.mm > 0 && <p className="text-[9px] text-blue-400/70 mt-0.5">{d.mm} mm</p>}
                  </div>

                  {/* UV */}
                  <div className="w-10 text-center shrink-0">
                    <p className={`text-[9px] font-black uppercase ${d.uvIndex >= 6 ? 'text-orange-400' : 'text-white/20'}`}>UV</p>
                    <p className={`text-sm font-bold ${d.uvIndex >= 8 ? 'text-red-400' : d.uvIndex >= 6 ? 'text-orange-400' : d.uvIndex >= 3 ? 'text-yellow-400' : 'text-white/40'}`}>
                      {d.uvIndex}
                    </p>
                  </div>

                  {/* Min / Max */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-blue-400/70 text-sm font-bold">{d.min}°</span>
                    <span className="text-white/15 text-xs">–</span>
                    <span className={`text-sm font-bold ${i === 0 ? 'text-cyan-300' : 'text-white/80'}`}>{d.max}°</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-white/15 mt-4 text-right">Quelle: Open-Meteo.com</p>
          </div>
        )}

        <p className="text-center text-white/10 text-xs pb-4">
          OpenWeatherMap · Open-Meteo{mounted ? ' · ' + new Date().toLocaleString('de-DE') : ''}
        </p>
      </div>
    </div>
  )
}