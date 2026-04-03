'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, User, Activity, Target, Info, Calculator, Save, RotateCcw, ArrowLeft,
  Plus, Mic, Scale, Bluetooth, Trash2, Calendar, TrendingUp, Dumbbell, Timer,
  Zap, List, Coffee
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── Typen ─────────────────────────────────────────────────────────────
interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface CalorieResult {
  bmr: number;
  tdee: number;
  goalCalories: { lose: number; maintain: number; gain: number };
}

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  source: 'manual' | 'voice' | 'scale';
}

interface ActivityEntry {
  id: string;
  date: string;
  sport: string;
  durationMinutes: number;
  caloriesBurned: number;
  met: number;
}

// Sportarten mit MET-Werten (Quelle: Compendium of Physical Activities)
const SPORTS: { name: string; met: number }[] = [
  { name: 'Gehen (3 km/h)', met: 2.0 },
  { name: 'Walking (5 km/h)', met: 3.5 },
  { name: 'Joggen (8 km/h)', met: 8.0 },
  { name: 'Laufen (10 km/h)', met: 10.0 },
  { name: 'Radfahren (16 km/h)', met: 6.0 },
  { name: 'Radfahren (20 km/h)', met: 8.0 },
  { name: 'Schwimmen (moderat)', met: 7.0 },
  { name: 'Yoga', met: 2.5 },
  { name: 'Krafttraining (leicht)', met: 3.5 },
  { name: 'Krafttraining (intensiv)', met: 6.0 },
  { name: 'HIIT', met: 8.0 },
  { name: 'Fußball', met: 7.0 },
  { name: 'Tanzen', met: 4.5 },
];

const ACTIVITY_MULTIPLIERS: Record<UserProfile['activityLevel'], { value: number; label: string; description: string }> = {
  sedentary: { value: 1.2, label: 'Sedentär', description: 'Büroarbeit, wenig Bewegung' },
  light: { value: 1.375, label: 'Leicht aktiv', description: 'Leichter Sport 1-3 Tage/Woche' },
  moderate: { value: 1.55, label: 'Mäßig aktiv', description: 'Moderater Sport 3-5 Tage/Woche' },
  active: { value: 1.725, label: 'Aktiv', description: 'Schwerer Sport 6-7 Tage/Woche' },
  very_active: { value: 1.9, label: 'Sehr aktiv', description: 'Körperliche Arbeit + täglicher Sport' },
};

const STORAGE_KEY_PROFILE = 'familyhub_calorie_profile';
const STORAGE_KEY_WEIGHT = 'familyhub_weight_entries';
const STORAGE_KEY_START_DATE = 'familyhub_weight_start_date';
const STORAGE_KEY_ACTIVITIES = 'familyhub_activities';

// ─── Styles (FamilyHub Dashboard – FIXED: border longhand) ─────────────
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
  select: {
    width: '100%',
    height: 42,
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    padding: '0 12px',
    fontSize: 14,
    background: '#fff',
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
  activityOption: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    // ✅ FIX: Shorthand 'border' durch Longhand ersetzt (vermeidet React-Style-Conflict)
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    textAlign: 'left' as const,
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  activityActive: {
    // ✅ Überschreibt nur borderColor – jetzt konfliktfrei
    borderColor: '#2563eb',
    background: '#eff6ff',
  },
  resultCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  } as React.CSSProperties,
  progressBar: {
    background: '#e2e8f0',
    borderRadius: 40,
    height: 6,
    marginTop: 12,
    overflow: 'hidden',
  } as React.CSSProperties,
  progressFill: {
    height: 6,
    borderRadius: 40,
  } as React.CSSProperties,
  entryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f1f5f9',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    borderRadius: 24,
    padding: 24,
    maxWidth: 500,
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  badge: {
    background: '#e2e8f0',
    borderRadius: 30,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 500,
  } as React.CSSProperties,
};

// Hilfsfunktionen
const formatDate = (date: Date): string => date.toISOString().slice(0, 10);
const getToday = () => formatDate(new Date());

export default function CaloriePage() {
  const router = useRouter();

  // Kalorien State
  const [profile, setProfile] = useState<UserProfile>({
    age: 30,
    gender: 'male',
    weight: 75,
    height: 175,
    activityLevel: 'moderate',
  });
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Gewichtsverlauf State
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_START_DATE);
    return saved || formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  });
  const [newWeightDate, setNewWeightDate] = useState<string>(getToday());
  const [newWeightValue, setNewWeightValue] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [scaleStatus, setScaleStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  // Aktivitäten State
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
  const [customMet, setCustomMet] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [calculatedCalories, setCalculatedCalories] = useState<number>(0);
  const [useCustomMet, setUseCustomMet] = useState(false);

  // Sprachrecognition
  const recognitionRef = useRef<any>(null);

  // ─── Effekte ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Lade Kalorienprofil
    const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        calculateCalories(parsed);
        setIsSaved(true);
      } catch (e) {}
    } else {
      calculateCalories(profile);
    }

    // Lade Gewichtsdaten
    const savedWeights = localStorage.getItem(STORAGE_KEY_WEIGHT);
    if (savedWeights) {
      try {
        setWeightEntries(JSON.parse(savedWeights));
      } catch (e) {}
    }

    // Lade Aktivitäten
    const savedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WEIGHT, JSON.stringify(weightEntries));
  }, [weightEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_START_DATE, startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  // Berechnung der verbrannten Kalorien bei Änderung von Sport/Dauer
  useEffect(() => {
    const met = useCustomMet ? parseFloat(customMet) || 0 : selectedSport.met;
    const weightKg = profile.weight;
    const hours = durationMinutes / 60;
    const calories = met * weightKg * hours;
    setCalculatedCalories(Math.round(calories));
  }, [selectedSport, durationMinutes, profile.weight, useCustomMet, customMet]);

  // Kalorienberechnung (Mifflin-St Jeor)
  const calculateBMR = (p: UserProfile): number => {
    if (p.gender === 'male')
      return 10 * p.weight + 6.25 * p.height - 5 * p.age + 5;
    return 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  };
  const calculateTDEE = (bmr: number, level: UserProfile['activityLevel']): number =>
    Math.round(bmr * ACTIVITY_MULTIPLIERS[level].value);
  const calculateGoalCalories = (tdee: number) => ({
    lose: Math.round(tdee * 0.8),
    maintain: tdee,
    gain: Math.round(tdee * 1.15),
  });
  const calculateCalories = (p: UserProfile) => {
    const bmr = Math.round(calculateBMR(p));
    const tdee = calculateTDEE(bmr, p.activityLevel);
    const goalCalories = calculateGoalCalories(tdee);
    setResult({ bmr, tdee, goalCalories });
  };

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    calculateCalories(updated);
    setIsSaved(false);
  };
  const handleSaveProfile = () => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    setIsSaved(true);
  };
  const handleResetProfile = () => {
    const defaultProfile: UserProfile = {
      age: 30,
      gender: 'male',
      weight: 75,
      height: 175,
      activityLevel: 'moderate',
    };
    setProfile(defaultProfile);
    calculateCalories(defaultProfile);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    setIsSaved(false);
  };

  // ─── Gewichtsverlauf Funktionen ──────────────────────────────────────
  const addWeightEntry = (date: string, weight: number, source: WeightEntry['source']) => {
    if (isNaN(weight) || weight <= 0 || weight > 300) return false;
    const existingIndex = weightEntries.findIndex(e => e.date === date);
    const newEntry: WeightEntry = { id: Date.now().toString(), date, weight, source };
    let newEntries;
    if (existingIndex !== -1) {
      newEntries = [...weightEntries];
      newEntries[existingIndex] = newEntry;
    } else {
      newEntries = [...weightEntries, newEntry];
    }
    newEntries.sort((a, b) => a.date.localeCompare(b.date));
    setWeightEntries(newEntries);
    return true;
  };

  const deleteWeightEntry = (id: string) => {
    setWeightEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleManualAdd = () => {
    const weight = parseFloat(newWeightValue);
    if (!newWeightDate || isNaN(weight)) {
      alert('Bitte Datum und gültiges Gewicht eingeben');
      return;
    }
    addWeightEntry(newWeightDate, weight, 'manual');
    setNewWeightValue('');
    setNewWeightDate(getToday());
  };

  // Spracheingabe (wie gehabt)
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Ihr Browser unterstützt keine Spracheingabe.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      parseVoiceInput(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      alert('Fehler bei der Spracherkennung.');
    };
    recognition.start();
  };

  const parseVoiceInput = (text: string) => {
    const lower = text.toLowerCase();
    let date = null;
    let weight = null;
    const today = getToday();
    if (lower.includes('heute') || lower.includes('jetzt')) {
      date = today;
    } else {
      const dateMatch = text.match(/(\d{1,2})\.\s*(\w+)(?:\s*(\d{4}))?/);
      if (dateMatch) {
        const day = dateMatch[1];
        let month = dateMatch[2];
        let year = dateMatch[3] || new Date().getFullYear().toString();
        const monthMap: Record<string, number> = {
          januar: 0, februar: 1, märz: 2, april: 3, mai: 4, juni: 5,
          juli: 6, august: 7, september: 8, oktober: 9, november: 10, dezember: 11
        };
        let monthNum = monthMap[month.toLowerCase()];
        if (monthNum === undefined) {
          const num = parseInt(month);
          if (!isNaN(num) && num >= 1 && num <= 12) monthNum = num - 1;
        }
        if (monthNum !== undefined) {
          const parsedDate = new Date(parseInt(year), monthNum, parseInt(day));
          if (!isNaN(parsedDate.getTime())) date = formatDate(parsedDate);
        }
      }
    }
    const weightMatch = text.match(/(\d+)[,.](\d+)/);
    if (weightMatch) weight = parseFloat(weightMatch[1] + '.' + weightMatch[2]);
    else {
      const simpleWeight = text.match(/(\d+)\s*(?:kilo|kg)?/);
      if (simpleWeight) weight = parseFloat(simpleWeight[1]);
    }
    if (!date) date = today;
    if (weight && weight > 0 && weight < 300) {
      addWeightEntry(date, weight, 'voice');
      alert(`Gewicht ${weight} kg für ${date} hinzugefügt.`);
    } else {
      alert('Konnte kein gültiges Gewicht erkennen. Beispiel: "Heute 75 Komma 2"');
    }
  };

  // Waagen Mock
  const connectScale = () => {
    setScaleStatus('connecting');
    setTimeout(() => {
      setScaleStatus('connected');
      const mockWeight = profile.weight + (Math.random() * 2 - 1);
      const mockDate = getToday();
      addWeightEntry(mockDate, parseFloat(mockWeight.toFixed(1)), 'scale');
      setScaleStatus('idle');
      setShowScaleModal(false);
      alert(`Waage hat übertragen: ${mockWeight.toFixed(1)} kg für heute.`);
    }, 2000);
  };

  // ─── Aktivitäten Funktionen ──────────────────────────────────────────
  const addActivity = () => {
    const met = useCustomMet ? parseFloat(customMet) || 0 : selectedSport.met;
    if (met === 0 || durationMinutes <= 0) {
      alert('Bitte wähle eine Sportart und gib eine gültige Dauer ein.');
      return;
    }
    const calories = Math.round(met * profile.weight * (durationMinutes / 60));
    const newActivity: ActivityEntry = {
      id: Date.now().toString(),
      date: getToday(),
      sport: useCustomMet ? `Custom (MET ${met})` : selectedSport.name,
      durationMinutes,
      caloriesBurned: calories,
      met,
    };
    setActivities(prev => [newActivity, ...prev]);
    // Optional: Eingabe zurücksetzen
    setDurationMinutes(30);
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  // Heutige Aktivitäten und Summe
  const todayActivities = activities.filter(a => a.date === getToday());
  const todayCaloriesBurned = todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);

  // Daten für Chart filtern
  const chartData = weightEntries
    .filter(entry => entry.date >= startDate)
    .map(entry => ({ date: entry.date, weight: entry.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.container}>
          <div style={S.headerRow}>
            <div style={S.logo}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                <ArrowLeft size={24} />
              </button>
              <span>FamilyHub</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 50, padding: '6px 14px' }}>
              <Flame size={18} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 500 }}>Kalorien & Fitness</span>
            </div>
          </div>
          <div style={S.greeting}>Dein Kalorien- & Aktivitäten-Tracker</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            Mifflin-St Jeor Formel + MET-basierter Sportverbrauch
          </div>
        </div>
      </div>

      <div style={S.container}>
        <div style={S.grid}>
          {/* ─── SPALTE 1: KALORIENRECHNER ─────────────────────────────── */}
          <div>
            {/* Profil-Eingabe */}
            <div style={S.card}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="#2563eb" /> Deine Daten
              </h3>
              <div style={S.grid2}>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Alter</label>
                  <input type="number" value={profile.age} onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)} style={S.input} min={15} max={100} />
                </div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Geschlecht</label>
                  <select value={profile.gender} onChange={(e) => handleInputChange('gender', e.target.value as any)} style={S.select}>
                    <option value="male">Männlich</option><option value="female">Weiblich</option>
                  </select>
                </div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Gewicht (kg)</label>
                  <input type="number" value={profile.weight} onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)} style={S.input} step={0.1} min={30} />
                </div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Größe (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)} style={S.input} min={100} />
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={14} /> Aktivitätslevel</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(Object.keys(ACTIVITY_MULTIPLIERS) as UserProfile['activityLevel'][]).map((level) => (
                    <button key={level} onClick={() => handleInputChange('activityLevel', level)} style={{ ...S.activityOption, ...(profile.activityLevel === level ? S.activityActive : {}) }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><span style={{ fontWeight: 500 }}>{ACTIVITY_MULTIPLIERS[level].label}</span>
                          <p style={{ fontSize: 12, color: '#64748b' }}>{ACTIVITY_MULTIPLIERS[level].description}</p>
                        </div>
                        <span style={{ fontSize: 12, color: '#2563eb' }}>Faktor: {ACTIVITY_MULTIPLIERS[level].value}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={handleSaveProfile} disabled={isSaved} style={{ ...S.buttonPrimary, opacity: isSaved ? 0.6 : 1 }}><Save size={16} /> {isSaved ? 'Gespeichert' : 'Profil speichern'}</button>
                <button onClick={handleResetProfile} style={S.buttonGhost}><RotateCcw size={16} /> Zurücksetzen</button>
              </div>
            </div>

            {/* Kalorien-Ergebnisse */}
            {result && (
              <>
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: '#64748b' }}>Grundumsatz (BMR)</span>
                    <button onClick={() => setShowInfo(!showInfo)} style={{ background: 'none', border: 'none' }}><Info size={16} color="#94a3b8" /></button>
                  </div>
                  {showInfo && <div style={{ background: '#eff6ff', borderRadius: 12, padding: 8, fontSize: 12, marginBottom: 12 }}>Der Grundumsatz ist die Kalorienmenge, die dein Körper im völligen Ruhezustand benötigt.</div>}
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#2563eb' }}>{result.bmr} <span style={{ fontSize: 16, fontWeight: 400 }}>kcal / Tag</span></div>
                </div>
                <div style={{ ...S.card, background: 'linear-gradient(135deg, #fff0e6, #fff)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Target size={18} color="#ea580c" /><span style={{ fontSize: 12, color: '#64748b' }}>Gesamtumsatz (TDEE)</span></div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#ea580c' }}>{result.tdee} <span style={{ fontSize: 16, fontWeight: 400 }}>kcal / Tag</span></div>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Inklusive deiner Alltagsaktivität und Bewegung</p>
                </div>
                <div style={S.card}>
                  <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calculator size={18} color="#2563eb" /> Kalorien nach Ziel</h3>
                  <div style={{ ...S.resultCard, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><span style={{ fontWeight: 600, color: '#15803d' }}>Abnehmen</span><p style={{ fontSize: 12, color: '#15803d' }}>~0,5 kg pro Woche</p></div><div style={{ fontSize: 24, fontWeight: 700, color: '#15803d' }}>{result.goalCalories.lose} kcal</div></div>
                    <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${(result.goalCalories.lose / result.tdee) * 100}%`, background: '#22c55e' }} /></div>
                  </div>
                  <div style={{ ...S.resultCard, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><span style={{ fontWeight: 600, color: '#1e40af' }}>Gewicht halten</span><p style={{ fontSize: 12, color: '#1e40af' }}>Erhaltungskalorien</p></div><div style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>{result.goalCalories.maintain} kcal</div></div>
                    <div style={S.progressBar}><div style={{ ...S.progressFill, width: '100%', background: '#3b82f6' }} /></div>
                  </div>
                  <div style={{ ...S.resultCard, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><span style={{ fontWeight: 600, color: '#9a3412' }}>Zunehmen</span><p style={{ fontSize: 12, color: '#9a3412' }}>~0,5 kg pro Woche</p></div><div style={{ fontSize: 24, fontWeight: 700, color: '#9a3412' }}>{result.goalCalories.gain} kcal</div></div>
                    <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${(result.goalCalories.gain / result.tdee) * 100}%`, background: '#f97316' }} /></div>
                  </div>
                </div>
                <div style={{ ...S.card, background: '#fffbeb', borderColor: '#fde68a' }}>
                  <div style={{ display: 'flex', gap: 12 }}><Info size={18} color="#d97706" /><div><h4 style={{ fontWeight: 600, color: '#92400e' }}>Tipp</h4><p style={{ fontSize: 12, color: '#92400e' }}>Diese Werte sind Schätzungen. Für genauere Ergebnisse verwende einen Fitness-Tracker.</p></div></div>
                </div>
              </>
            )}
          </div>

          {/* ─── SPALTE 2: GEWICHTSVERLAUF ─────────────────────────────── */}
          <div>
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} color="#2563eb" /> Gewichtsverlauf</h3>
                <button onClick={() => setShowScaleModal(true)} style={S.buttonOutline}><Bluetooth size={16} /> Waage</button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Startdatum für Diagramm</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={S.input} />
              </div>

              {chartData.length > 0 ? (
                <div style={{ height: 300, marginBottom: 24 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis domain={['auto', 'auto']} unit=" kg" />
                      <Tooltip formatter={(value) => `${value} kg`} />
                      <Legend />
                      <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Gewicht (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, background: '#f8fafc', borderRadius: 16, marginBottom: 24 }}>
                  <Scale size={32} color="#94a3b8" />
                  <p style={{ color: '#64748b', marginTop: 8 }}>Noch keine Gewichtsdaten.</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Neuen Eintrag hinzufügen</h4>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, color: '#64748b' }}>Datum</label><input type="date" value={newWeightDate} onChange={(e) => setNewWeightDate(e.target.value)} style={S.input} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, color: '#64748b' }}>Gewicht (kg)</label><input type="number" step="0.1" value={newWeightValue} onChange={(e) => setNewWeightValue(e.target.value)} placeholder="z.B. 75.2" style={S.input} /></div>
                  <button onClick={handleManualAdd} style={S.buttonPrimary}><Plus size={16} /> Hinzufügen</button>
                  <button onClick={startVoiceInput} style={{ ...S.buttonOutline, background: isListening ? '#e0e7ff' : 'white' }}><Mic size={16} /> {isListening ? 'Höre zu...' : 'Sprache'}</button>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Historie</h4>
                {weightEntries.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Keine Einträge</p>
                ) : (
                  weightEntries.slice().reverse().map(entry => (
                    <div key={entry.id} style={S.entryRow}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Calendar size={14} color="#64748b" />
                        <span style={{ fontWeight: 500 }}>{entry.date}</span>
                        <span style={{ fontWeight: 600 }}>{entry.weight} kg</span>
                        {entry.source === 'voice' && <Mic size={12} color="#16a34a" title="Sprache" />}
                        {entry.source === 'scale' && <Scale size={12} color="#2563eb" title="Waage" />}
                      </div>
                      <button onClick={() => deleteWeightEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── SPALTE 3: SPORT & AKTIVITÄTEN ──────────────────────────── */}
          <div>
            <div style={S.card}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Dumbbell size={18} color="#2563eb" /> Sport & Aktivitäten
              </h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
                Trage Sportart und Dauer ein – wir berechnen die verbrannten Kalorien basierend auf deinem Gewicht.
              </p>

              {/* Sportauswahl */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Sportart</label>
                <select
                  value={selectedSport.name}
                  onChange={(e) => {
                    const sport = SPORTS.find(s => s.name === e.target.value);
                    if (sport) setSelectedSport(sport);
                    setUseCustomMet(false);
                  }}
                  style={S.select}
                  disabled={useCustomMet}
                >
                  {SPORTS.map(sport => <option key={sport.name} value={sport.name}>{sport.name} (MET {sport.met})</option>)}
                </select>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="customMet" checked={useCustomMet} onChange={(e) => setUseCustomMet(e.target.checked)} />
                  <label htmlFor="customMet" style={{ fontSize: 12 }}>Eigener MET-Wert</label>
                </div>
                {useCustomMet && (
                  <input type="number" step="0.1" value={customMet} onChange={(e) => setCustomMet(e.target.value)} placeholder="z.B. 6.5" style={{ ...S.input, marginTop: 8 }} />
                )}
              </div>

              {/* Dauer */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Dauer (Minuten)</label>
                <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 0))} style={S.input} min={1} />
              </div>

              {/* Ergebnis & Button */}
              <div style={{ background: '#f0f9ff', borderRadius: 16, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Verbrannte Kalorien:</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{calculatedCalories} kcal</span>
              </div>

              <button onClick={addActivity} style={{ ...S.buttonPrimary, width: '100%', justifyContent: 'center' }}>
                <Plus size={16} /> Aktivität speichern
              </button>
            </div>

            {/* Heutige Aktivitäten & Historie */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} color="#eab308" /> Heute verbrannt</h4>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{todayCaloriesBurned} kcal</span>
              </div>

              {todayActivities.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: 16 }}>Noch keine Aktivitäten heute.</p>
              ) : (
                todayActivities.map(act => (
                  <div key={act.id} style={S.entryRow}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Timer size={14} color="#64748b" />
                      <span style={{ fontWeight: 500 }}>{act.sport}</span>
                      <span>{act.durationMinutes} min</span>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>{act.caloriesBurned} kcal</span>
                    </div>
                    <button onClick={() => deleteActivity(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                ))
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><List size={16} /> Letzte Aktivitäten</h4>
                {activities.slice(0, 5).map(act => (
                  <div key={act.id} style={S.entryRow}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>{act.date}</span>
                      <span>{act.sport}</span>
                      <span>{act.durationMinutes} min</span>
                      <span>{act.caloriesBurned} kcal</span>
                    </div>
                    <button onClick={() => deleteActivity(act.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal für Waage */}
      {showScaleModal && (
        <div style={S.modalOverlay} onClick={() => setShowScaleModal(false)}>
          <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Smarte Waage verbinden</h3>
            <p style={{ color: '#475569', marginBottom: 20 }}>Simuliere eine Verbindung zu einer Bluetooth-Waage. (Demo – echte Integration erfordert Web Bluetooth API oder native App.)</p>
            {scaleStatus === 'connecting' && <p>Verbinde...</p>}
            {scaleStatus === 'connected' && <p>Verbunden! Daten werden empfangen...</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowScaleModal(false); setScaleStatus('idle'); }} style={S.buttonGhost}>Abbrechen</button>
              <button onClick={connectScale} disabled={scaleStatus === 'connecting'} style={S.buttonPrimary}>Verbinden & Daten abrufen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}