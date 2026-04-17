'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Activity, Calendar as CalendarIcon, CloudRain,
  Wind, Droplets, AlertTriangle, RefreshCw, UtensilsCrossed, Plus
} from 'lucide-react';

// ========== TYPEN ==========
interface CalEvent {
  id: number; title: string; date: string; time: string;
  type: 'personal' | 'family' | 'cycle'; color: string; desc: string;
}
interface FoodEntry { id: string; date: string; time: string; name: string; calories: number; }
interface ActivityEntry { id: string; date: string; sport: string; durationMinutes: number; caloriesBurned: number; }
interface UserProfile { age: number; gender: 'male' | 'female'; weight: number; height: number; activityLevel: string; }
interface CalorieResult { bmr: number; tdee: number; goalCalories: { lose: number; maintain: number; gain: number }; }
interface Recipe {
  id: string; name: string; category: string; calories: number; image: string;
  vegetarian: boolean; vegan: boolean; lunchbox: boolean;
}
interface WeatherData {
  temp: number; condition: string; conditionId: number; humidity: number;
  wind: number; isRaining: boolean; pop?: number; alerts?: { event: string; description: string }[];
}

// ========== HILFSFUNKTIONEN ==========
const todayStr = () => new Date().toISOString().slice(0, 10);
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function wmoDesc(code: number): string {
  if (code === 0) return 'Klar';
  if (code <= 2) return 'Leicht bewölkt';
  if (code === 3) return 'Bedeckt';
  if (code <= 48) return 'Nebel';
  if (code <= 55) return 'Nieselregen';
  if (code <= 65) return 'Regen';
  if (code <= 75) return 'Schnee';
  if (code <= 82) return 'Schauer';
  return 'Gewitter';
}

function wxIcon(id: number): string {
  if (id >= 200 && id < 300) return '⛈';
  if (id >= 300 && id < 400) return '🌦';
  if (id >= 500 && id < 600) return id >= 502 ? '🌧' : '🌦';
  if (id >= 600 && id < 700) return '❄️';
  if (id === 800) return '☀️';
  if (id === 801) return '🌤';
  if (id === 802) return '⛅';
  return '☁️';
}

// Demo-Termine
const DEMO_EVENTS: CalEvent[] = [
  { id: 1, title: 'Kinderarzt Lena', date: '2026-04-15', time: '10:00', type: 'family', color: '#2563eb', desc: 'Vorsorge U8' },
  { id: 2, title: 'Yoga', date: todayStr(), time: '18:00', type: 'personal', color: '#16a34a', desc: '' },
  { id: 3, title: 'Elternabend', date: '2026-04-16', time: '19:30', type: 'family', color: '#7c3aed', desc: 'Schule' },
  { id: 4, title: 'Zahnarzt Tom', date: '2026-04-17', time: '14:00', type: 'family', color: '#2563eb', desc: '' },
];

// Demo-Rezepte
const TOP_RECIPES: Recipe[] = [
  { id: '1', name: 'Spaghetti Bolognese', category: 'Pasta', calories: 620, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80', vegetarian: false, vegan: false, lunchbox: false },
  { id: '2', name: 'Vegetarische Lasagne', category: 'Pasta', calories: 480, image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80', vegetarian: true, vegan: true, lunchbox: false },
  { id: 'k1', name: 'Bunter Dino-Spieß', category: 'Kinder-Brotzeit', calories: 250, image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&q=80', vegetarian: true, vegan: false, lunchbox: true },
  { id: 'k2', name: 'Regenbogen-Gemüsesticks', category: 'Kinder-Brotzeit', calories: 160, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80', vegetarian: true, vegan: true, lunchbox: true },
];

// ========== NAVIGATION (exakt die gleichen SVGs wie im Kalender) ==========
const NAV = [
  { id: 'dashboard', label: 'Start',    icon: 'home',   path: '/dashboard' },
  { id: 'kalender',  label: 'Kalender', icon: 'cal',    path: '/kalender'  },
  { id: 'aufgaben',  label: 'Aufgaben', icon: 'tasks',  path: '/aufgaben'  },
  { id: 'einkauf',   label: 'Einkauf',  icon: 'cart',   path: '/einkaufsliste' },
  { id: 'rezepte',   label: 'Rezepte',  icon: 'recipe', path: '/rezepte'   },
  { id: 'wetter',    label: 'Wetter',   icon: 'weather',path: '/wetter'    },
];

// Handgefertigte SVG‑Icons (gleiche wie im Kalender-Code)
const Icons = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  tasks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  cart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  recipe: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>,
  weather: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>,
};

// ========== HAUPTKOMPONENTE ==========
export default function OceanDashboard() {
  const router = useRouter();

  // Kalorien State
  const [profile, setProfile] = useState<UserProfile>({ age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' });
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [goalMode, setGoalMode] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Wetter State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Termine & Wochenansicht
  const [events] = useState<CalEvent[]>(DEMO_EVENTS);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Rezepte
  const [dailyRecipes, setDailyRecipes] = useState<Recipe[]>([]);

  // Kalorien-Hilfsfunktionen
  const calcBMR = useCallback((p: UserProfile) => {
    return p.gender === 'male'
      ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
      : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  }, []);

  const computeResult = useCallback((p: UserProfile) => {
    const actMult: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
    };
    const bmr = Math.round(calcBMR(p));
    const tdee = Math.round(bmr * (actMult[p.activityLevel] || 1.55));
    setResult({ bmr, tdee, goalCalories: { lose: Math.round(tdee * 0.8), maintain: tdee, gain: Math.round(tdee * 1.15) } });
  }, [calcBMR]);

  // Daten aus localStorage (nur einmal)
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('familyhub_calorie_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      const savedFood = localStorage.getItem('familyhub_food_entries');
      if (savedFood) setFoodEntries(JSON.parse(savedFood));
      const savedActivities = localStorage.getItem('familyhub_activities');
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      const savedGoal = localStorage.getItem('familyhub_calorie_goal');
      if (savedGoal) setGoalMode(savedGoal as any);
    } catch (e) {}
    setIsLoadingData(false);
  }, []);

  useEffect(() => {
    if (!isLoadingData) computeResult(profile);
  }, [profile, computeResult, isLoadingData]);

  const today = todayStr();
  const todayFood = foodEntries.filter(e => e.date === today);
  const todayActivities = activities.filter(a => a.date === today);
  const consumed = todayFood.reduce((s, e) => s + e.calories, 0);
  const burned = todayActivities.reduce((s, a) => s + a.caloriesBurned, 0);
  const target = result?.goalCalories[goalMode] ?? 2000;
  const remaining = Math.max(target - consumed + burned, 0);
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  const ringColor = pct > 100 ? '#ff3b30' : pct > 85 ? '#ff9500' : '#30d158';

  // Wetter laden
  useEffect(() => {
    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        let lat = 49.95, lon = 10.17;
        if (typeof navigator !== 'undefined') {
          try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej)
            );
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          } catch {}
        }
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe/Berlin`
        );
        const data = await res.json();
        const code = data.current.weather_code;
        const condition = wmoDesc(code);
        const pop = data.daily?.precipitation_probability_max?.[0] || 0;
        const alerts = [];
        if (pop > 70) alerts.push({ event: '🌧 Regenwarnung', description: `Heute ${pop}% Regenwahrscheinlichkeit` });
        if (data.current.wind_speed_10m > 50) alerts.push({ event: '💨 Sturmwarnung', description: `Windböen bis ${Math.round(data.current.wind_speed_10m)} km/h` });
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition, conditionId: code,
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m * 3.6),
          isRaining: (code >= 51 && code <= 65) || (code >= 80 && code <= 82),
          pop, alerts: alerts.length ? alerts : undefined
        });
      } catch (err) {
        setWeatherError('Wetter konnte nicht geladen werden');
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchWeather();
  }, []);

  useEffect(() => {
    const shuffled = [...TOP_RECIPES].sort(() => 0.5 - Math.random());
    setDailyRecipes(shuffled.slice(0, 3));
  }, []);

  // Terminfilter
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return events.filter(e => e.date === dateStr);
  };

  const getWeekDays = (base: Date) => {
    const start = new Date(base);
    start.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedDate);
  const todayEvents = getEventsForDate(selectedDate);

  const prevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };
  const nextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };
  const goToToday = () => setSelectedDate(new Date());

  const formatDateHeader = (date: Date) => {
    return `${DAYS[date.getDay()]}, ${date.getDate()}. ${MONTHS[date.getMonth()]}`;
  };

  // Ring-Komponente
  const Ring = ({ pct, size = 80, color = '#30d158' }: { pct: number; size?: number; color?: string }) => {
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const d = Math.min(pct / 100, 1) * c;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={c - d} strokeLinecap="round" />
      </svg>
    );
  };

  const COLORS = {
    primary: { 50: '#e0f2fe', 100: '#bae6fd', 200: '#7dd3fc', 300: '#38bdf8', 400: '#0ea5e9', 500: '#0284c7', 600: '#0369a1', 700: '#075985', 800: '#0c4a6e', 900: '#082f49' },
    slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
    success: '#10b981', warning: '#f59e0b', danger: '#ef4444', pink: '#ec4899', purple: '#8b5cf6',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .glass { background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); }
        .ocean-gradient { background: linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%); }
        .shadow-card { box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 6px 16px rgba(0,0,0,0.08); }
        .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; font-weight: 600; box-shadow: 0 4px 14px rgba(14,165,233,0.4); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,165,233,0.5); }
        @media (min-width: 768px) { .bottom-nav { display: none !important; } .sidebar-nav { display: flex !important; } }
        @media (max-width: 767px) { .sidebar-nav { display: none !important; } .main-content { padding-bottom: 88px; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* Desktop Sidebar mit den gleichen Icons */}
        <nav className="sidebar-nav glass" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 6, borderRight: `1px solid ${COLORS.slate[100]}`, zIndex: 50 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${COLORS.primary[600]} 0%, ${COLORS.primary[400]} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          {NAV.map(item => {
            const isActive = item.id === 'dashboard';
            return (
              <button key={item.id} onClick={() => router.push(item.path)} title={item.label}
                style={{ width: 52, height: 52, borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: isActive ? `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[600]} 100%)` : 'transparent', transition: 'all 0.2s', boxShadow: isActive ? '0 4px 12px rgba(14,165,233,0.3)' : 'none' }}>
                <span style={{ color: isActive ? '#fff' : COLORS.slate[400] }}>{Icons[item.icon as keyof typeof Icons]}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: isActive ? '#fff' : COLORS.slate[400], letterSpacing: 0.3 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Hauptinhalt */}
        <div className="main-content" style={{ flex: 1, minHeight: '100vh', background: `linear-gradient(180deg, ${COLORS.slate[50]} 0%, #fff 100%)` }}>

          {/* Header mit Ocean Gradient (heller, freundlicher) */}
          <div className="ocean-gradient" style={{ padding: '52px 24px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <button onClick={() => router.push('/')} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Dashboard</span>
                </div>
                <div style={{ width: 40 }} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Guten Tag, <span style={{ color: '#93c5fd' }}>Marie</span></div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: 500 }}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

            {/* Erste Reihe: Kalorien + Wetter */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
              {/* Kalorienkarte */}
              <div className="shadow-card" style={{ background: '#fff', borderRadius: 24, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <Flame size={18} color="#0284c7" />
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', flex: 1 }}>Kalorien heute</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['lose','maintain','gain'] as const).map(mode => (
                      <button key={mode} onClick={() => setGoalMode(mode)} style={{ padding: '4px 12px', borderRadius: 40, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: goalMode === mode ? '#0284c7' : '#f1f5f9', color: goalMode === mode ? '#fff' : '#64748b' }}>
                        {mode === 'lose' ? 'Abnehmen' : mode === 'maintain' ? 'Halten' : 'Zunehmen'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 90, height: 90 }}>
                    <Ring pct={pct} size={90} color={ringColor} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{consumed}</span>
                      <span style={{ fontSize: 8, color: '#64748b' }}>gegessen</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div><span style={{ fontSize: 18, fontWeight: 700 }}>{remaining}</span><span style={{ fontSize: 12, color: '#64748b' }}> kcal übrig</span></div>
                    <div><span style={{ fontSize: 18, fontWeight: 700 }}>+{burned}</span><span style={{ fontSize: 12, color: '#64748b' }}> verbrannt</span></div>
                    <div><span style={{ fontSize: 18, fontWeight: 700 }}>{target}</span><span style={{ fontSize: 12, color: '#64748b' }}> Tagesziel</span></div>
                    <div style={{ background: '#e2e8f0', borderRadius: 10, height: 6, marginTop: 12 }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 10, background: ringColor, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button onClick={() => router.push('/kalorien')} className="btn-primary" style={{ flex: 1, padding: '10px 12px', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><Plus size={14} /> Mahlzeit</button>
                  <button onClick={() => router.push('/kalorien')} className="btn-primary" style={{ flex: 1, padding: '10px 12px', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#475569', boxShadow: 'none' }}><Activity size={14} /> Aktivität</button>
                </div>
              </div>

              {/* Wetterkarte */}
              <div className="shadow-card" style={{ background: '#fff', borderRadius: 24, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <CloudRain size={18} color="#0284c7" />
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Aktuelles Wetter</span>
                  {weatherLoading && <RefreshCw size={14} className="spin" style={{ marginLeft: 'auto' }} />}
                </div>
                {weatherError ? (
                  <div style={{ color: '#ef4444', textAlign: 'center', padding: 20 }}>{weatherError}</div>
                ) : weather ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                      <span style={{ fontSize: 56 }}>{wxIcon(weather.conditionId)}</span>
                      <div>
                        <div style={{ fontSize: 36, fontWeight: 700 }}>{weather.temp}°</div>
                        <div style={{ fontSize: 14, color: '#64748b', textTransform: 'capitalize' }}>{weather.condition}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                      <div><Droplets size={14} /> {weather.humidity}%</div>
                      <div><Wind size={14} /> {weather.wind} km/h</div>
                      {weather.pop && <div style={{ color: '#60a5fa' }}><CloudRain size={14} /> {weather.pop}% Regen</div>}
                    </div>
                    {weather.alerts?.map((a, i) => (
                      <div key={i} style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: 12, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <AlertTriangle size={14} /> {a.event}: {a.description}
                      </div>
                    ))}
                  </>
                ) : <div style={{ textAlign: 'center', padding: 20 }}>Keine Daten</div>}
                <button onClick={() => router.push('/wetter')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: 13, fontWeight: 600, marginTop: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>Detailvorhersage <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
            </div>

            {/* Zweite Reihe: Termine mit Wochenumschaltung */}
            <div className="shadow-card" style={{ background: '#fff', borderRadius: 24, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                <CalendarIcon size={18} color="#0284c7" />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', flex: 1 }}>Termine</span>
                <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 40, padding: 2 }}>
                  <button onClick={() => setViewMode('day')} style={{ padding: '6px 16px', borderRadius: 38, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: viewMode === 'day' ? '#0284c7' : 'transparent', color: viewMode === 'day' ? '#fff' : '#64748b' }}>Tag</button>
                  <button onClick={() => setViewMode('week')} style={{ padding: '6px 16px', borderRadius: 38, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: viewMode === 'week' ? '#0284c7' : 'transparent', color: viewMode === 'week' ? '#fff' : '#64748b' }}>Woche</button>
                </div>
              </div>

              {viewMode === 'day' ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <button onClick={prevWeek} style={{ width: 34, height: 34, borderRadius: 20, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                    <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{formatDateHeader(selectedDate)}</span>
                    <button onClick={nextWeek} style={{ width: 34, height: 34, borderRadius: 20, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
                    <button onClick={goToToday} style={{ background: '#e2e8f0', border: 'none', padding: '6px 16px', borderRadius: 40, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Heute</button>
                  </div>
                  {todayEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Keine Termine für diesen Tag</div>
                  ) : (
                    todayEvents.map(ev => (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ width: 60, fontSize: 13, color: '#64748b' }}>{ev.time}</div>
                        <div style={{ width: 4, height: 32, background: ev.color, borderRadius: 2, marginRight: 12 }} />
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{ev.title}</div><div style={{ fontSize: 12, color: '#64748b' }}>{ev.desc}</div></div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <button onClick={prevWeek} style={{ width: 34, height: 34, borderRadius: 20, background: '#f1f5f9', border: 'none', cursor: 'pointer' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{weekDays[0].toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' })} – {weekDays[6].toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' })}</span>
                    <button onClick={nextWeek} style={{ width: 34, height: 34, borderRadius: 20, background: '#f1f5f9', border: 'none', cursor: 'pointer' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
                    <button onClick={goToToday} style={{ background: '#e2e8f0', border: 'none', padding: '6px 16px', borderRadius: 40, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Heute</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                    {weekDays.map(day => {
                      const dayEvents = getEventsForDate(day);
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={day.toISOString()} style={{ background: isToday ? '#eff6ff' : '#fff', border: `1px solid ${isToday ? '#0284c7' : '#e2e8f0'}`, borderRadius: 16, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{DAYS[day.getDay()]}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, margin: '8px 0' }}>{day.getDate()}</div>
                          {dayEvents.length > 0 ? dayEvents.map(ev => (
                            <div key={ev.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '6px 8px', marginTop: 6, fontSize: 10, textAlign: 'left' }}>
                              <div style={{ fontSize: 10, color: ev.color }}>{ev.time}</div>
                              <div style={{ fontSize: 11, fontWeight: 500 }}>{ev.title}</div>
                            </div>
                          )) : <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 6 }}>–</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <button onClick={() => router.push('/kalender')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: 13, fontWeight: 600, marginTop: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>Zum Kalender <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>

            {/* Dritte Reihe: Top Tagesrezepte */}
            <div className="shadow-card" style={{ background: '#fff', borderRadius: 24, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <UtensilsCrossed size={18} color="#0284c7" />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', flex: 1 }}>Top Tagesrezepte</span>
                <button onClick={() => setDailyRecipes([...TOP_RECIPES].sort(() => 0.5 - Math.random()).slice(0, 3))} style={{ background: '#f1f5f9', border: 'none', width: 34, height: 34, borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {dailyRecipes.map(recipe => (
                  <div key={recipe.id} style={{ display: 'flex', gap: 14, background: '#f8fafc', borderRadius: 18, padding: 12, alignItems: 'center' }}>
                    <img src={recipe.image} alt={recipe.name} style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }} onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{recipe.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Flame size={12} /> {recipe.calories} kcal {recipe.vegetarian && <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 30, fontSize: 10 }}>🌱 Veggie</span>}</div>
                      <button onClick={() => router.push('/rezepte')} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Zum Rezept</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Bottom Navigation – gleiche Icons, helles Ocean Blue */}
        <nav className="bottom-nav glass" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', zIndex: 100, borderTop: `1px solid ${COLORS.slate[100]}`, paddingBottom: 'env(safe-area-inset-bottom,0px)', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)' }}>
          {NAV.map(item => {
            const isActive = item.id === 'dashboard';
            return (
              <button key={item.id} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 14px', gap: 4, border: 'none', background: 'none', cursor: 'pointer', position: 'relative' }}>
                <span style={{ color: isActive ? COLORS.primary[600] : COLORS.slate[400] }}>{Icons[item.icon as keyof typeof Icons]}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? COLORS.primary[600] : COLORS.slate[400] }}>{item.label}</span>
                {isActive && <span style={{ width: 20, height: 3, borderRadius: 2, background: COLORS.primary[500], position: 'absolute', bottom: 6 }} />}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}