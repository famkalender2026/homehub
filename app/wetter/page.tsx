'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wind, MapPin, Search, Clock, Umbrella, AlertTriangle,
  RefreshCw, Droplets, Eye, Gauge, X,
  Sunrise, Sunset, Sun, CloudRain, Calendar, Clock3,
  Thermometer, Navigation, ChevronLeft, Zap, Snowflake
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const API_KEY = '9c173a5f26ac74af2bacb874e4208735';
const BASE = 'https://api.openweathermap.org';

// ─── Typen ─────────────────────────────────────────────────────────────
interface WeatherData {
  city: string; country: string;
  temp: number; feelsLike: number; max: number; min: number;
  condition: string; conditionId: number;
  humidity: number; wind: number; windDir: number;
  visibility: number; pressure: number;
  isRaining: boolean; icon: string;
  sunrise: number; sunset: number;
  lat: number; lon: number;
}
interface HourlyItem {
  time: string; hour: number; temp: number;
  mm: number; pop: number; conditionId: number; isRain: boolean;
  windSpeedKmh: number; dt: number;
}
interface Alert {
  event: string; description: string; start: number; end: number; severity: 'low' | 'medium' | 'high';
}
interface DailyItem {
  date: string; weekday: string; conditionId: number;
  max: number; min: number; pop: number; mm: number; uvIndex: number;
  sunrise?: number; sunset?: number;
}
interface SearchResult {
  name: string; country: string; state?: string; lat: number; lon: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────
const windDirLabel = (deg: number) => ['N','NO','O','SO','S','SW','W','NW'][Math.round(deg/45)%8];
const fmt = (unix: number) => new Date(unix*1000).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
const isRainId = (id: number) => id >= 200 && id < 600;

function wxIcon(id: number, day = true, size = 32): string {
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

function wxGradient(id: number, day = true): string {
  if (id >= 200 && id < 300) return 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)';
  if (id >= 500 && id < 600) return 'linear-gradient(160deg,#1e3a5f 0%,#243b55 50%,#141e30 100%)';
  if (id >= 600 && id < 700) return 'linear-gradient(160deg,#2c3e50 0%,#3d5a73 50%,#96c2d6 100%)';
  if (id === 800) return day
    ? 'linear-gradient(160deg,#0f4c81 0%,#1a6fa8 50%,#2596be 100%)'
    : 'linear-gradient(160deg,#0b0c1a 0%,#12152a 50%,#1a1f3a 100%)';
  return 'linear-gradient(160deg,#2c3e50 0%,#3d5a73 100%)';
}

const uvLabel = (uv: number) => {
  if (uv <= 2) return { label: 'Niedrig', color: '#22c55e' };
  if (uv <= 5) return { label: 'Mäßig', color: '#f59e0b' };
  if (uv <= 7) return { label: 'Hoch', color: '#f97316' };
  if (uv <= 10) return { label: 'Sehr hoch', color: '#ef4444' };
  return { label: 'Extrem', color: '#9333ea' };
};

// ─── Hauptkomponente ───────────────────────────────────────────────────
export default function WetterApp() {
  const router = useRouter();

  const [weather,    setWeather]    = useState<WeatherData | null>(null);
  const [hourly,     setHourly]     = useState<HourlyItem[]>([]);
  const [alerts,     setAlerts]     = useState<Alert[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState<SearchResult[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [showDrop,   setShowDrop]   = useState(false);
  const [daily,      setDaily]      = useState<DailyItem[]>([]);
  const [mounted,    setMounted]    = useState(false);
  const [activeTab,  setActiveTab]  = useState<'48h'|'14d'>('48h');
  const [rainDays,   setRainDays]   = useState<DailyItem[]>([]);

  useEffect(() => { setMounted(true); }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const fetchByCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setLoading(true); setError(null); setShowDrop(false);
    setDaily([]); setRainDays([]); setHourly([]);

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

      // 2) 48h Forecast (3h-Schritte, 16 Einträge = 48h)
      const r2 = await fetch(
        `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de&cnt=40`
      );
      if (r2.ok) {
        const fc = await r2.json();
        const next48h: HourlyItem[] = fc.list.slice(0, 16).map((it: any) => {
          const dt = new Date(it.dt * 1000);
          return {
            time: dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            hour: dt.getHours(),
            temp: Math.round(it.main.temp),
            mm: it.rain?.['3h'] ?? 0,
            pop: it.pop ?? 0,
            conditionId: it.weather[0].id,
            isRain: isRainId(it.weather[0].id),
            windSpeedKmh: Math.round((it.wind?.speed ?? 0) * 3.6),
            dt: it.dt,
          };
        });
        setHourly(next48h);

        // Warnungen ableiten
        const nowTs = Math.floor(Date.now() / 1000);
        const derived: Alert[] = [];
        const stormSlots = next48h.filter(it => it.windSpeedKmh >= 60);
        if (stormSlots.length) derived.push({
          event: '💨 Sturmwarnung',
          description: `Windböen bis ${Math.max(...stormSlots.map(s => s.windSpeedKmh))} km/h erwartet`,
          start: nowTs, end: nowTs + stormSlots.length * 10800, severity: 'high',
        });
        const thunderSlots = next48h.filter(it => it.conditionId >= 200 && it.conditionId < 300);
        if (thunderSlots.length) derived.push({
          event: '⛈ Gewitterwarnung',
          description: `Gewitter zwischen ${thunderSlots[0].time} und ${thunderSlots[thunderSlots.length-1].time} Uhr`,
          start: nowTs, end: nowTs + thunderSlots.length * 10800, severity: 'high',
        });
        const snowSlots = next48h.filter(it => it.conditionId >= 600 && it.conditionId < 700);
        if (snowSlots.length) derived.push({
          event: '❄️ Schneewarnung',
          description: `Schneefall ${snowSlots[0].time}–${snowSlots[snowSlots.length-1].time} Uhr`,
          start: nowTs, end: nowTs + snowSlots.length * 10800, severity: 'medium',
        });
        const maxT = Math.max(...next48h.map(it => it.temp));
        const minT = Math.min(...next48h.map(it => it.temp));
        if (maxT >= 35) derived.push({
          event: '🌡️ Hitzewarnung', description: `Bis ${maxT}°C – viel trinken, Sonne meiden.`,
          start: nowTs, end: nowTs + 86400, severity: 'high',
        });
        if (minT <= -5) derived.push({
          event: '🥶 Frostwarnung', description: `Bis ${minT}°C, Glatteisgefahr möglich.`,
          start: nowTs, end: nowTs + 86400, severity: 'medium',
        });
        setAlerts(derived);
      }

      // 3) 14-Tage via Open-Meteo
      try {
        const r3 = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,` +
          `precipitation_probability_max,uv_index_max,sunrise,sunset` +
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
            const sunriseStr: string = dm.daily.sunrise?.[i] ?? '';
            const sunsetStr: string = dm.daily.sunset?.[i] ?? '';
            return {
              date: dt.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }),
              weekday: dt.toLocaleDateString('de-DE', { weekday:'short' }),
              conditionId: wdMap[wc] ?? 800,
              max: Math.round(dm.daily.temperature_2m_max[i]),
              min: Math.round(dm.daily.temperature_2m_min[i]),
              pop: (dm.daily.precipitation_probability_max[i] ?? 0) / 100,
              mm: Math.round((dm.daily.precipitation_sum[i] ?? 0) * 10) / 10,
              uvIndex: Math.round(dm.daily.uv_index_max[i] ?? 0),
              sunrise: sunriseStr ? new Date(sunriseStr).getTime() / 1000 : undefined,
              sunset:  sunsetStr  ? new Date(sunsetStr).getTime()  / 1000 : undefined,
            };
          });
          setDaily(days);
          // Regentage für Mehrtagswarnung
          setRainDays(days.filter(d => d.pop >= 0.5 || d.mm >= 2));
        }
      } catch {}
    } catch (e: any) {
      setError(e.message ?? 'Verbindungsfehler');
    }
    setLoading(false);
  }, []);

  // Geocoding
  const fetchGeo = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDrop(false); return; }
    setSearching(true);
    try {
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

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    navigator.geolocation?.getCurrentPosition(
      p => fetchByCoords(p.coords.latitude, p.coords.longitude),
      () => fetchByCoords(49.7213, 10.2240, 'Schweinfurt')
    );
  }, [fetchByCoords]);

  const pickCity = (r: SearchResult) => {
    setQuery(''); fetchByCoords(r.lat, r.lon, r.name);
  };

  const isDay = weather
    ? Date.now()/1000 > weather.sunrise && Date.now()/1000 < weather.sunset
    : true;

  const bgGradient = weather ? wxGradient(weather.conditionId, isDay) : wxGradient(800);

  const chartData = hourly.map(h => ({
    name: h.time,
    temp: h.temp,
    regen: Math.round(h.pop * 100),
    wind: h.windSpeedKmh,
    mm: h.mm,
  }));

  const alertStyle = (severity: Alert['severity']) => ({
    high:   { bg: '#fee2e2', border: '#ef4444', icon: '#dc2626' },
    medium: { bg: '#fef3c7', border: '#f59e0b', icon: '#d97706' },
    low:    { bg: '#dbeafe', border: '#3b82f6', icon: '#2563eb' },
  }[severity]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1623',
      fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif",
      paddingBottom: 60,
      color: '#e2e8f0',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      <style>{`
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 99px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.32); }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .spin { animation: spin 1s linear infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.4s ease both; }
        .hover-row:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* HERO HEADER */}
      <div style={{
        background: bgGradient,
        padding: '0 0 40px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 1s ease',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -60,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Top nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 24, paddingBottom: 16,
          }}>
            <button onClick={() => router.back()} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: 12, padding: '8px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'inherit', backdropFilter: 'blur(8px)',
            }}>
              <ChevronLeft size={18} /> FamilyHub
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)', borderRadius: 99,
              padding: '6px 16px', backdropFilter: 'blur(8px)',
            }}>
              <Sun size={16} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>Wetter & Klima</span>
            </div>
          </div>

          {/* Main weather display */}
          {!loading && weather && (
            <div className="fade-in" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <MapPin size={16} color="rgba(255,255,255,0.7)" />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 500 }}>
                      {weather.city}, {weather.country}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, lineHeight: 1 }}>
                    <span style={{ fontSize: 88, fontWeight: 300, color: '#fff', letterSpacing: -4 }}>
                      {weather.temp}°
                    </span>
                    <div style={{ paddingBottom: 14 }}>
                      <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize', fontWeight: 400 }}>
                        {weather.condition}
                      </div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                        Gefühlt {weather.feelsLike}° · ↑{weather.max}° ↓{weather.min}°
                      </div>
                    </div>
                  </div>
                  {/* Quick stats row */}
                  <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                    {[
                      { icon: <Droplets size={14}/>, label: `${weather.humidity}% Feuchte` },
                      { icon: <Wind size={14}/>, label: `${weather.wind} km/h ${windDirLabel(weather.windDir)}` },
                      { icon: <Eye size={14}/>, label: `${weather.visibility} km Sicht` },
                      { icon: <Gauge size={14}/>, label: `${weather.pressure} hPa` },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                        {s.icon} {s.label}
                      </div>
                    ))}
                  </div>
                  {/* Sunrise / Sunset */}
                  <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,220,100,0.9)', fontSize: 13 }}>
                      <Sunrise size={14} /> Aufgang {fmt(weather.sunrise)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,160,80,0.9)', fontSize: 13 }}>
                      <Sunset size={14} /> Untergang {fmt(weather.sunset)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 100, lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>
                  {wxIcon(weather.conditionId, isDay)}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ paddingTop: 40, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.7)' }}>
              <RefreshCw size={20} className="spin" /> Wetterdaten werden geladen…
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* SEARCH */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, padding: '0 16px',
            backdropFilter: 'blur(8px)',
          }}>
            <Search size={17} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) setShowDrop(false); }}
              onFocus={() => results.length > 0 && setShowDrop(true)}
              placeholder="Stadt, PLZ oder Ort weltweit suchen… z.B. Tokyo, 97421, London"
              style={{
                flex: 1, height: 46, background: 'none', border: 'none', outline: 'none',
                color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit',
              }}
            />
            {searching && <RefreshCw size={16} color="rgba(255,255,255,0.5)" className="spin" />}
            {query && !searching && (
              <button onClick={() => { setQuery(''); setShowDrop(false); setResults([]); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <X size={16} />
              </button>
            )}
          </div>

          {showDrop && results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: '#1a2235',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, marginTop: 6,
              maxHeight: 280, overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => pickCity(r)}
                  className="hover-row"
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 20px',
                    borderBottom: i < results.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    background: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 12,
                  }}>
                  <MapPin size={14} color="#4b8fd4" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: 14 }}>
                      {r.name}{r.state && `, ${r.state}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{r.country}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: 16, marginBottom: 24, color: '#fca5a5',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* WARNUNGEN */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 24 }} className="fade-in">
            {alerts.map((a, i) => {
              const st = alertStyle(a.severity);
              return (
                <div key={i} style={{
                  background: st.bg + '18',
                  border: `1px solid ${st.border}44`,
                  borderLeft: `4px solid ${st.border}`,
                  borderRadius: 14,
                  padding: '14px 18px',
                  marginBottom: 10,
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <AlertTriangle size={18} color={st.icon} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: st.icon, fontSize: 14 }}>{a.event}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{a.description}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                      {fmt(a.start)} – {fmt(a.end)} Uhr
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REGENTAGE VORSCHAU (Mehrtagswarnung) */}
        {rainDays.length > 0 && (
          <div style={{
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: 16, padding: '16px 20px',
            marginBottom: 24,
          }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <CloudRain size={18} color="#60a5fa" />
              <span style={{ fontWeight: 600, color: '#93c5fd', fontSize: 14 }}>
                🌧️ Regentage in den nächsten 14 Tagen
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {rainDays.map((d, i) => (
                <div key={i} style={{
                  background: 'rgba(37,99,235,0.2)',
                  border: '1px solid rgba(37,99,235,0.35)',
                  borderRadius: 10, padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                }}>
                  <span style={{ fontSize: 18 }}>{wxIcon(d.conditionId)}</span>
                  <div>
                    <div style={{ fontWeight: 500, color: '#bfdbfe' }}>{d.weekday} {d.date}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      {Math.round(d.pop*100)}% · {d.mm > 0 ? `${d.mm} mm` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>

          {/* LINKE SPALTE */}
          <div>
            {/* 48h Chart */}
            {hourly.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 20, padding: 20, marginBottom: 20,
              }} className="fade-in">
                {/* Tab-Switcher */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 15, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock3 size={16} color="#60a5fa" /> Prognose
                  </h3>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 99, padding: 3 }}>
                    {(['48h', '14d'] as const).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '5px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                        background: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontWeight: activeTab === tab ? 600 : 400, fontSize: 13,
                        fontFamily: 'inherit', transition: 'all 0.2s',
                      }}>
                        {tab === '48h' ? '48 Stunden' : '14 Tage'}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === '48h' && (
                  <>
                    {/* Stündliche Kacheln */}
                    <div style={{ display: 'flex', overflowX: 'auto', gap: 10, paddingBottom: 12, marginBottom: 20 }}>
                      {hourly.map((h, i) => (
                        <div key={i} style={{
                          minWidth: 72, textAlign: 'center',
                          background: h.isRain ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${h.isRain ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 14, padding: '10px 6px', flexShrink: 0,
                        }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{h.time}</div>
                          <div style={{ fontSize: 26, marginBottom: 4 }}>{wxIcon(h.conditionId, h.hour >= 6 && h.hour < 20)}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{h.temp}°</div>
                          <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 4 }}>
                            {Math.round(h.pop*100)}%
                          </div>
                          {h.mm > 0 && (
                            <div style={{ fontSize: 10, color: '#93c5fd', marginTop: 2 }}>{h.mm.toFixed(1)}mm</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Temperaturkurve */}
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Temperatur (°C)</div>
                      <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                          <Tooltip
                            contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                            labelStyle={{ color: '#e2e8f0' }}
                          />
                          <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2}
                            fill="url(#tempGrad)" name="Temperatur" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Regenwahrscheinlichkeit */}
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, marginTop: 16 }}>Regenwahrscheinlichkeit (%)</div>
                      <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={chartData} margin={{ top: 0, right: 5, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                          <Tooltip
                            contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                            labelStyle={{ color: '#e2e8f0' }}
                          />
                          <Bar dataKey="regen" fill="#3b82f6" radius={[4,4,0,0]} name="Regen %" opacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {activeTab === '14d' && daily.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {daily.map((d, i) => {
                      const uv = uvLabel(d.uvIndex);
                      return (
                        <div key={i} className="hover-row" style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 12,
                          background: i === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                          transition: 'background 0.15s',
                        }}>
                          <div style={{ width: 60, fontSize: 13, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: i === 0 ? 600 : 400 }}>
                            {i === 0 ? 'Heute' : `${d.weekday} ${d.date}`}
                          </div>
                          <div style={{ fontSize: 22, width: 32 }}>{wxIcon(d.conditionId)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {d.pop > 0.3 && (
                                <span style={{ fontSize: 11, color: '#60a5fa' }}>
                                  {Math.round(d.pop*100)}%
                                </span>
                              )}
                              {d.mm > 0 && (
                                <span style={{ fontSize: 11, color: '#93c5fd' }}>{d.mm} mm</span>
                              )}
                              <span style={{ fontSize: 10, color: uv.color, marginLeft: 'auto' }}>
                                UV {d.uvIndex}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                            <span style={{ color: '#f97316', fontWeight: 600 }}>{d.max}°</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
                            <span style={{ color: '#60a5fa' }}>{d.min}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RECHTE SPALTE */}
          <div>
            {/* Detail-Stats */}
            {weather && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 20, padding: 20, marginBottom: 20,
              }} className="fade-in">
                <h3 style={{ fontWeight: 600, fontSize: 15, color: '#e2e8f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Thermometer size={16} color="#60a5fa" /> Wetterdetails
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Gefühlt', value: `${weather.feelsLike}°C`, icon: <Thermometer size={14}/> },
                    { label: 'Luftfeuchtigkeit', value: `${weather.humidity}%`, icon: <Droplets size={14}/> },
                    { label: 'Wind', value: `${weather.wind} km/h`, icon: <Wind size={14}/> },
                    { label: 'Windrichtung', value: windDirLabel(weather.windDir), icon: <Navigation size={14}/> },
                    { label: 'Sichtweite', value: `${weather.visibility} km`, icon: <Eye size={14}/> },
                    { label: 'Luftdruck', value: `${weather.pressure} hPa`, icon: <Gauge size={14}/> },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 14, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>
                        {s.icon} {s.label}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 18, color: '#e2e8f0' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Sonnenauf- und -untergang mit Bar */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sunrise size={14} /> {fmt(weather.sunrise)}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Sonnentag</span>
                    <span style={{ color: '#fdba74', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {fmt(weather.sunset)} <Sunset size={14} />
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 99,
                      background: 'linear-gradient(90deg, #fde68a, #f97316, #fdba74)',
                      width: (() => {
                        const now = Date.now() / 1000;
                        const total = weather.sunset - weather.sunrise;
                        const elapsed = now - weather.sunrise;
                        const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
                        return `${pct}%`;
                      })(),
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* Heute + Morgen Sonnenzeiten aus 14-Tage */}
            {daily.length >= 2 && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 20, padding: 20, marginBottom: 20,
              }} className="fade-in">
                <h3 style={{ fontWeight: 600, fontSize: 15, color: '#e2e8f0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sun size={16} color="#fde68a" /> Sonnenzeiten
                </h3>
                {daily.slice(0, 3).map((d, i) => (
                  d.sunrise && d.sunset ? (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, width: 60 }}>
                        {i === 0 ? 'Heute' : i === 1 ? 'Morgen' : d.weekday}
                      </span>
                      <span style={{ color: '#fde68a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Sunrise size={13} /> {fmt(d.sunrise)}
                      </span>
                      <span style={{ color: '#fdba74', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Sunset size={13} /> {fmt(d.sunset)}
                      </span>
                    </div>
                  ) : null
                ))}
              </div>
            )}

            {/* Wind-Kompass */}
            {weather && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 20, padding: 20, marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 20,
              }} className="fade-in">
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    {['N','O','S','W'].map((d, i) => (
                      <text key={d} x={36 + 26*Math.sin(i*Math.PI/2)} y={36 - 26*Math.cos(i*Math.PI/2) + 4}
                        textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Outfit">
                        {d}
                      </text>
                    ))}
                    <line
                      x1="36" y1="36"
                      x2={36 + 22*Math.sin(weather.windDir * Math.PI/180)}
                      y2={36 - 22*Math.cos(weather.windDir * Math.PI/180)}
                      stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"
                    />
                    <circle cx="36" cy="36" r="3" fill="#60a5fa" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Wind</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0' }}>{weather.wind} <span style={{ fontSize: 13, fontWeight: 400 }}>km/h</span></div>
                  <div style={{ fontSize: 13, color: '#60a5fa' }}>aus {windDirLabel(weather.windDir)} ({weather.windDir}°)</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 32 }}>
          OpenWeatherMap · Open-Meteo {mounted && `· Stand: ${new Date().toLocaleString('de-DE')}`}
        </div>
      </div>
    </div>
  );
}