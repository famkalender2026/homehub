'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wind, MapPin, Search, Clock, Umbrella, ArrowUp, ArrowDown,
  AlertTriangle, RefreshCw, Droplets, Eye, Gauge, Check, X,
  Sunrise, Sunset, Sun, CloudRain, Calendar, Home, Clock3
} from 'lucide-react';

const API_KEY = '9c173a5f26ac74af2bacb874e4208735';
const BASE = 'https://api.openweathermap.org';

// ─── Typen ─────────────────────────────────────────────────────────────
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
  windSpeedKmh?: number
}

interface Alert {
  event: string; description: string; start: number; end: number; severity?: 'low' | 'medium' | 'high'
}

interface DailyItem {
  date: string; weekday: string; conditionId: number
  max: number; min: number; pop: number; mm: number; uvIndex: number
}

interface SearchResult {
  name: string; country: string; state?: string; lat: number; lon: number
}

// ─── Styles (analog FamilyHub) ─────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    paddingBottom: 40,
  } as React.CSSProperties,
  header: {
    background: '#1e3a5f',
    padding: '40px 20px 40px',
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    padding: '0 20px',
  } as React.CSSProperties,
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative' as const,
    zIndex: 1,
  },
  logo: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    color: '#fff',
    letterSpacing: -0.5,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: '#fff',
    marginTop: 16,
    position: 'relative' as const,
    zIndex: 1,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 1px 4px rgba(15,23,42,.07), 0 0 0 1px rgba(241,245,249,.8)',
    marginBottom: 20,
    height: 'fit-content',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 20,
    alignItems: 'start',
  } as React.CSSProperties,
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  } as React.CSSProperties,
  input: {
    width: '100%',
    height: 42,
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    padding: '0 14px',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  } as React.CSSProperties,
  buttonPrimary: {
    background: '#2563eb',
    border: 'none',
    borderRadius: 40,
    padding: '10px 20px',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  buttonGhost: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 40,
    padding: '10px 20px',
    color: '#1e293b',
    fontWeight: 500,
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  } as React.CSSProperties,
  buttonOutline: {
    background: 'transparent',
    border: '1.5px solid #cbd5e1',
    borderRadius: 40,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  } as React.CSSProperties,
  alertHigh: {
    background: '#fee2e2',
    borderLeft: '4px solid #ef4444',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  alertMedium: {
    background: '#fef3c7',
    borderLeft: '4px solid #f59e0b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  alertLow: {
    background: '#dbeafe',
    borderLeft: '4px solid #3b82f6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  hourlyScroll: {
    display: 'flex',
    overflowX: 'auto',
    gap: 12,
    paddingBottom: 8,
    scrollbarWidth: 'thin',
  } as React.CSSProperties,
  hourlyItem: {
    minWidth: 80,
    textAlign: 'center',
    padding: '10px 8px',
    background: '#f8fafc',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
  } as React.CSSProperties,
};

// ─── Hilfsfunktionen ───────────────────────────────────────────────────
const windDirLabel = (deg: number) => ['N','NO','O','SO','S','SW','W','NW'][Math.round(deg/45)%8];
const fmt = (unix: number) => new Date(unix*1000).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
const isRainId = (id: number) => id >= 200 && id < 600;

function wxIcon(id: number, day = true) {
  if (id >= 200 && id < 300) return '⛈';
  if (id >= 300 && id < 400) return '🌦';
  if (id >= 500 && id < 600) return id >= 502 ? '🌧' : '🌦';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫';
  if (id === 800) return day ? '☀️' : '🌙';
  if (id === 801) return '🌤';
  if (id === 802) return '⛅';
  return '☁️';
}

// ─── Hauptkomponente ──────────────────────────────────────────────────
export default function WetterApp() {
  const router = useRouter();

  const [weather,   setWeather]   = useState<WeatherData | null>(null);
  const [hourly,    setHourly]    = useState<HourlyItem[]>([]);
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [showDrop,  setShowDrop]  = useState(false);
  const [daily,     setDaily]     = useState<DailyItem[]>([]);
  const [mounted,   setMounted]   = useState(false);

  // Regenwarnung (aktuelle Regendauer)
  const [rainWarning, setRainWarning] = useState<{ active: boolean; startTime: string; endTime: string; durationHours: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };
  const formatDate = () => {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // ─── Wetter + Forecast + Warnungen + 14‑Tage ─────────────────────────
  const fetchByCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setLoading(true); setError(null); setShowDrop(false); setDaily([]); setRainWarning(null);
    try {
      // 1) Aktuelles Wetter
      const r1 = await fetch(
        `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de`
      );
      if (!r1.ok) throw new Error(r1.status === 401 ? 'API-Key ungültig' : `Fehler ${r1.status}`);
      const cur = await r1.json();

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
      });

      // 2) Forecast (3h-Schritte) – für 24h Prognose & Regenwarnung
      const r2 = await fetch(
        `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de&cnt=40` // 40 = 5 Tage * 8 Slots, reicht für 48h
      );
      if (r2.ok) {
        const fc = await r2.json();
        // Nächste 24 Stunden (max 8 Einträge à 3h)
        const next24h = fc.list.slice(0, 8).map((it: any) => {
          const dt = new Date(it.dt * 1000);
          const hour = dt.getHours();
          return {
            time: `${String(hour).padStart(2,'0')}:00`,
            hour: hour,
            temp: Math.round(it.main.temp),
            mm: it.rain?.['3h'] ?? 0,
            pop: it.pop ?? 0,
            conditionId: it.weather[0].id,
            isRain: isRainId(it.weather[0].id),
            windSpeedKmh: Math.round((it.wind?.speed ?? 0) * 3.6),
          };
        });
        setHourly(next24h);

        // Regenwarnung: durchgehende Regenperiode in den nächsten 24h
        let rainStart: Date | null = null;
        let rainEnd: Date | null = null;
        let inRain = false;
        for (let i = 0; i < next24h.length; i++) {
          const item = next24h[i];
          const itemDate = new Date();
          itemDate.setHours(item.hour, 0, 0, 0);
          if (item.isRain && !inRain) {
            inRain = true;
            rainStart = itemDate;
          } else if (!item.isRain && inRain) {
            inRain = false;
            rainEnd = new Date(itemDate.getTime() - 1);
            break;
          }
        }
        if (inRain && rainStart) {
          // Regen endet nicht innerhalb 24h, setze Ende auf letzte Stunde
          const lastHour = next24h[next24h.length-1].hour;
          const endDate = new Date();
          endDate.setHours(lastHour, 0, 0, 0);
          rainEnd = endDate;
        }
        if (rainStart && rainEnd) {
          const durationHours = Math.round((rainEnd.getTime() - rainStart.getTime()) / (1000 * 60 * 60));
          setRainWarning({
            active: true,
            startTime: rainStart.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            endTime: rainEnd.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            durationHours: durationHours,
          });
        } else {
          setRainWarning(null);
        }

        // Warnungen ableiten (Sturm, Gewitter, Schnee, Hitze, Frost)
        const nowTs = Math.floor(Date.now() / 1000);
        const derived: Alert[] = [];
        const stormSlots = next24h.filter(it => (it.windSpeedKmh ?? 0) >= 60);
        if (stormSlots.length) derived.push({
          event: '💨 Sturmwarnung', description: `Windböen bis ${Math.max(...stormSlots.map(s => s.windSpeedKmh ?? 0))} km/h`,
          start: nowTs, end: nowTs + stormSlots.length * 10800, severity: 'high',
        });
        const thunderSlots = next24h.filter(it => it.conditionId >= 200 && it.conditionId < 300);
        if (thunderSlots.length) derived.push({
          event: '⛈ Gewitterwarnung', description: `Gewitter ${thunderSlots[0].time}–${thunderSlots[thunderSlots.length-1].time} Uhr`,
          start: nowTs, end: nowTs + thunderSlots.length * 10800, severity: 'high',
        });
        const snowSlots = next24h.filter(it => it.conditionId >= 600 && it.conditionId < 700);
        if (snowSlots.length) derived.push({
          event: '❄️ Schneewarnung', description: `Schneefall ${snowSlots[0].time}–${snowSlots[snowSlots.length-1].time} Uhr`,
          start: nowTs, end: nowTs + snowSlots.length * 10800, severity: 'medium',
        });
        const maxT = Math.max(...next24h.map(it => it.temp));
        const minT = Math.min(...next24h.map(it => it.temp));
        if (maxT >= 35) derived.push({
          event: '🌡️ Hitzewarnung', description: `Bis ${maxT}°C – viel trinken, Sonne meiden.`,
          start: nowTs, end: nowTs + 86400, severity: 'high',
        });
        if (minT <= -5) derived.push({
          event: '🥶 Frostwarnung', description: `Bis ${minT}°C, Glatteisgefahr.`,
          start: nowTs, end: nowTs + 86400, severity: 'medium',
        });
        setAlerts(derived);
      }

      // 3) 14‑Tage Vorhersage via Open‑Meteo
      try {
        const r3 = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max` +
          `&timezone=auto&forecast_days=14`
        );
        if (r3.ok) {
          const dm = await r3.json();
          const wdMap: Record<number,number> = {
            0:800,1:800,2:802,3:804,45:741,48:741,
            51:300,53:301,55:302,61:500,63:501,65:502,
            71:600,73:601,75:602,77:611,80:520,81:521,
            82:522,85:620,86:621,95:200,96:201,99:202,
          };
          const days: DailyItem[] = dm.daily.time.map((d: string, i: number) => {
            const wc = dm.daily.weathercode[i];
            const dt = new Date(d);
            return {
              date: dt.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }),
              weekday: dt.toLocaleDateString('de-DE', { weekday:'short' }),
              conditionId: wdMap[wc] ?? 800,
              max: Math.round(dm.daily.temperature_2m_max[i]),
              min: Math.round(dm.daily.temperature_2m_min[i]),
              pop: (dm.daily.precipitation_probability_max[i] ?? 0) / 100,
              mm: Math.round((dm.daily.precipitation_sum[i] ?? 0) * 10) / 10,
              uvIndex: Math.round(dm.daily.uv_index_max[i] ?? 0),
            };
          });
          setDaily(days);
        }
      } catch {}
    } catch (e: any) {
      setError(e.message ?? 'Verbindungsfehler');
    }
    setLoading(false);
  }, []);

  // ─── Geocoding Suche (inkl. PLZ) ────────────────────────────────────
  const fetchGeo = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDrop(false); return; }
    setSearching(true);
    try {
      // Direkter API-Aufruf unterstützt PLZ automatisch (z.B. "97421" findet Schweinfurt)
      const r = await fetch(`${BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=8&appid=${API_KEY}`);
      if (r.ok) {
        const data: any[] = await r.json();
        const mapped = data.map(d => ({
          name: d.local_names?.de ?? d.name,
          country: d.country, state: d.state,
          lat: d.lat, lon: d.lon,
        }));
        setResults(mapped);
        setShowDrop(mapped.length > 0);
      }
    } catch {}
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchGeo(query), 380);
    return () => clearTimeout(t);
  }, [query, fetchGeo]);

  // GPS beim Start
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => fetchByCoords(p.coords.latitude, p.coords.longitude),
      () => fetchByCoords(49.7213, 10.2240, 'Schweinfurt')
    );
  }, [fetchByCoords]);

  const pickCity = (r: SearchResult) => {
    setQuery(''); fetchByCoords(r.lat, r.lon, r.name);
  };

  const isDay = weather ? Date.now()/1000 > weather.sunrise && Date.now()/1000 < weather.sunset : true;

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.container}>
          <div style={S.headerRow}>
            <div style={S.logo}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                <ArrowUp size={24} style={{ transform: 'rotate(-90deg)' }} />
              </button>
              <span>FamilyHub</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 50, padding: '6px 14px' }}>
              <Sun size={18} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 500 }}>Wetter & Regen</span>
            </div>
          </div>
          <div style={S.greeting}>{getGreeting()}, Wetter-Fan!</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            {formatDate()} – aktuelle Wetterdaten & Vorhersage
          </div>
        </div>
      </div>

      <div style={S.container}>
        <div style={S.grid}>
          {/* ─── SPALTE 1: AKTUELLES WETTER + SUCHE ──────────────────── */}
          <div>
            {/* Suchfeld mit PLZ-Hinweis */}
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); if (!e.target.value) setShowDrop(false); }}
                  onFocus={() => results.length > 0 && setShowDrop(true)}
                  placeholder="Stadt oder PLZ suchen… z.B. Berlin, 97421"
                  style={S.input}
                />
                <Search size={17} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} />
                {searching && <RefreshCw size={16} style={{ position: 'absolute', right: 14, top: 13, animation: 'spin 1s linear infinite' }} />}
                {query && !searching && (
                  <button onClick={() => { setQuery(''); setShowDrop(false); setResults([]); }} style={{ position: 'absolute', right: 14, top: 12, background: 'none', border: 'none' }}>
                    <X size={16} color="#94a3b8" />
                  </button>
                )}
              </div>
              {showDrop && results.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
                  {results.map((r, i) => (
                    <button key={i} onClick={() => pickCity(r)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: 'none', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 500 }}>{r.name}{r.state && `, ${r.state}`}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{r.country}</div>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>🔍 PLZ-Suche möglich (z.B. 97421)</div>
            </div>

            {/* Aktuelle Wetterkarte */}
            <div style={S.card}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><RefreshCw className="animate-spin" size={32} color="#2563eb" /></div>
              ) : error ? (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: 20 }}>{error}</div>
              ) : weather && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{weather.city}, {weather.country}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 48, fontWeight: 300 }}>{weather.temp}°</span>
                        <div>
                          <div style={{ fontSize: 18, textTransform: 'capitalize' }}>{weather.condition}</div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>Gefühlt {weather.feelsLike}°</div>
                        </div>
                      </div>
                      <div style={S.grid2}>
                        <div><Wind size={14} /> {weather.wind} km/h ({windDirLabel(weather.windDir)})</div>
                        <div><Droplets size={14} /> {weather.humidity}%</div>
                        <div><Sunrise size={14} /> Aufgang: {fmt(weather.sunrise)}</div>
                        <div><Sunset size={14} /> Untergang: {fmt(weather.sunset)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 64 }}>{wxIcon(weather.conditionId, isDay)}</div>
                  </div>

                  {/* Min/Max */}
                  <div style={{ marginTop: 20, display: 'flex', gap: 16 }}>
                    <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 40, fontSize: 13 }}>⬆️ Max {weather.max}°</span>
                    <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 40, fontSize: 13 }}>⬇️ Min {weather.min}°</span>
                  </div>
                </>
              )}
            </div>

            {/* 14‑Tage-Vorschau (scrollbar) */}
            {daily.length > 0 && (
              <div style={S.card}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#2563eb" /> 14‑Tage‑Prognose
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
                    {daily.map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', minWidth: 70 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{i === 0 ? 'Heute' : d.weekday}</div>
                        <div style={{ fontSize: 20 }}>{wxIcon(d.conditionId)}</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{d.max}°</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{d.min}°</div>
                        {d.pop > 0 && <div style={{ fontSize: 10, color: '#2563eb' }}>{Math.round(d.pop*100)}%</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── SPALTE 2: WARNUNGEN + REGENWARNUNG + 24H PROGNOSE ────── */}
          <div>
            {/* Warnungen (allgemein) */}
            {alerts.length > 0 && (
              <div style={S.card}>
                <h3 style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#eab308" /> Wetterwarnungen
                </h3>
                {alerts.map((a, i) => (
                  <div key={i} style={a.severity === 'high' ? S.alertHigh : a.severity === 'medium' ? S.alertMedium : S.alertLow}>
                    <div style={{ fontWeight: 600 }}>{a.event}</div>
                    <div style={{ fontSize: 13 }}>{a.description}</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: '#475569' }}>{fmt(a.start)} – {fmt(a.end)} Uhr</div>
                  </div>
                ))}
              </div>
            )}

            {/* Regenwarnung (detailliert) */}
            {rainWarning && rainWarning.active && (
              <div style={{ ...S.card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <CloudRain size={24} color="#2563eb" />
                  <h3 style={{ fontWeight: 600 }}>🌧️ Aktive Regenwarnung</h3>
                </div>
                <div style={{ fontSize: 15, marginBottom: 8 }}>
                  <strong>Von:</strong> {rainWarning.startTime} Uhr &nbsp;|&nbsp;
                  <strong>Bis:</strong> {rainWarning.endTime} Uhr
                </div>
                <div style={{ fontSize: 14, color: '#1e40af' }}>
                  <strong>Dauer:</strong> ca. {rainWarning.durationHours} Stunde{rainWarning.durationHours !== 1 ? 'n' : ''}
                </div>
                <div style={{ marginTop: 10, padding: 8, background: '#fff', borderRadius: 12, fontSize: 13 }}>
                  ⚠️ Plane Aktivitäten im Freien entsprechend. Regenkleidung empfohlen.
                </div>
              </div>
            )}

            {/* 24‑Stunden Prognose (stündlich) */}
            {hourly.length > 0 && (
              <div style={S.card}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock3 size={18} color="#2563eb" /> 24‑Stunden‑Prognose
                </h3>
                <div style={S.hourlyScroll}>
                  {hourly.map((h, i) => (
                    <div key={i} style={S.hourlyItem}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{h.time}</div>
                      <div style={{ fontSize: 24, margin: '6px 0' }}>{wxIcon(h.conditionId, h.hour >= 6 && h.hour < 20)}</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{h.temp}°</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{Math.round(h.pop*100)}%</div>
                      {h.mm > 0 && <div style={{ fontSize: 10, color: '#3b82f6' }}>{h.mm.toFixed(1)} mm</div>}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
                  ⏱️ Aktualisierung alle 3 Stunden (OpenWeatherMap 3h‑Schritte)
                </div>
              </div>
            )}

            {/* Zusätzliche Details */}
            {weather && (
              <div style={S.card}>
                <h3 style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Gauge size={18} color="#2563eb" /> Weitere Werte
                </h3>
                <div style={S.grid2}>
                  <div><Eye size={14} /> Sicht: {weather.visibility} km</div>
                  <div><Gauge size={14} /> Druck: {weather.pressure} hPa</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fußzeile */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 20 }}>
          OpenWeatherMap · Open‑Meteo · {mounted && new Date().toLocaleString('de-DE')}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}