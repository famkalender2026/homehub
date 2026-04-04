'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, User, Activity, Target, Info, Calculator, Save, RotateCcw, ArrowLeft,
  Plus, Mic, Scale, Bluetooth, Trash2, Calendar, TrendingUp, Dumbbell, Timer,
  Zap, List, Coffee, Camera, UtensilsCrossed, ChevronDown, ChevronUp, X, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
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

// NEU: Mahlzeit / Kalorieneintrag
interface FoodEntry {
  id: string;
  date: string;
  time: string;
  name: string;
  calories: number;
  source: 'manual' | 'voice' | 'photo';
  photoPreview?: string;
}

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
const STORAGE_KEY_FOOD = 'familyhub_food_entries';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch {}
  },
};

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);
const getToday = () => formatDate(new Date());
const defaultStartDate = () => formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
const getNow = () => new Date().toTimeString().slice(0, 5);

const S = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: 40 } as React.CSSProperties,
  header: { background: '#1e3a5f', padding: '40px 20px 40px', position: 'relative' as const, overflow: 'hidden' } as React.CSSProperties,
  container: { maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 20px' } as React.CSSProperties,
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' as const, zIndex: 1 },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#fff', letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 12 },
  greeting: { fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#fff', marginTop: 16, position: 'relative' as const, zIndex: 1 },
  card: { background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 4px rgba(15,23,42,.07), 0 0 0 1px rgba(241,245,249,.8)', marginBottom: 20, height: 'fit-content' } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, alignItems: 'start' } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 } as React.CSSProperties,
  input: { width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const } as React.CSSProperties,
  select: { width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '0 12px', fontSize: 14, background: '#fff', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  buttonPrimary: { background: '#2563eb', border: 'none', borderRadius: 40, padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' } as React.CSSProperties,
  buttonGhost: { background: '#f1f5f9', border: 'none', borderRadius: 40, padding: '10px 20px', color: '#1e293b', fontWeight: 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' } as React.CSSProperties,
  buttonOutline: { background: 'transparent', border: '1.5px solid #cbd5e1', borderRadius: 40, padding: '8px 16px', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' } as React.CSSProperties,
  activityOption: { width: '100%', padding: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', textAlign: 'left' as const, background: '#fff', cursor: 'pointer' } as React.CSSProperties,
  activityActive: { borderColor: '#2563eb', background: '#eff6ff' },
  resultCard: { padding: 16, borderRadius: 20, marginBottom: 12 } as React.CSSProperties,
  progressBar: { background: '#e2e8f0', borderRadius: 40, height: 6, marginTop: 12, overflow: 'hidden' } as React.CSSProperties,
  progressFill: { height: 6, borderRadius: 40 } as React.CSSProperties,
  entryRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' } as React.CSSProperties,
  modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 24, padding: 24, maxWidth: 520, width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' as const } as React.CSSProperties,
};

// ─── Mahlzeit-Eingabe Modal ──────────────────────────────────────────────
interface FoodModalProps {
  onClose: () => void;
  onSave: (entry: Omit<FoodEntry, 'id'>) => void;
}

function FoodInputModal({ onClose, onSave }: FoodModalProps) {
  const [tab, setTab] = useState<'manual' | 'voice' | 'photo'>('manual');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [time, setTime] = useState(getNow());
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoResult, setPhotoResult] = useState<{ name: string; calories: number } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabStyle = (t: typeof tab): React.CSSProperties => ({
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    background: tab === t ? '#2563eb' : 'transparent', color: tab === t ? '#fff' : '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
  });

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { alert('Keine Spracheingabe verfügbar.'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => { const text = e.results[0][0].transcript; setVoiceText(text); parseVoice(text); };
    rec.onerror = () => { setIsListening(false); alert('Fehler bei Spracherkennung.'); };
    rec.start();
  };

  const parseVoice = (text: string) => {
    const calMatch = text.match(/(\d+)\s*(?:kalorien|kcal|cal)/i);
    const numMatch = text.match(/(\d{2,4})/);
    const cal = calMatch ? parseInt(calMatch[1]) : numMatch ? parseInt(numMatch[1]) : 0;
    const cleaned = text.replace(/(\d+)\s*(?:kalorien|kcal|cal)?/gi, '').trim();
    setCalories(cal > 0 ? String(cal) : '');
    setName(cleaned || text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl.split(',')[1]);
      setPhotoResult(null); setPhotoError('');
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!photoBase64) return;
    setIsAnalyzing(true); setPhotoError('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 } },
              { type: 'text', text: `Analysiere dieses Essensfoto. Schätze:\n1. Den Namen des Gerichts (kurz, auf Deutsch)\n2. Die ungefähre Kalorienmenge in kcal\n\nAntworte NUR mit einem JSON-Objekt, ohne Markdown:\n{"name": "...", "calories": 123}\n\nFalls kein Essen erkennbar: {"name": "Unbekannt", "calories": 0}` },
            ],
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || '').join('') || '';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setPhotoResult(parsed);
      setName(parsed.name || '');
      setCalories(String(parsed.calories || ''));
    } catch {
      setPhotoError('Analyse fehlgeschlagen. Bitte manuell eingeben.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const cal = parseInt(calories);
    if (!name.trim() || isNaN(cal) || cal <= 0) { alert('Bitte Name und gültige Kalorienzahl eingeben.'); return; }
    onSave({ date: getToday(), time, name: name.trim(), calories: cal, source: tab, photoPreview: tab === 'photo' ? (photoPreview ?? undefined) : undefined });
    onClose();
  };

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>Mahlzeit eintragen</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 16, padding: 4, gap: 4, marginBottom: 20 }}>
          <button style={tabStyle('manual')} onClick={() => setTab('manual')}><UtensilsCrossed size={14} />Tippen</button>
          <button style={tabStyle('voice')} onClick={() => setTab('voice')}><Mic size={14} />Sprache</button>
          <button style={tabStyle('photo')} onClick={() => setTab('photo')}><Camera size={14} />Foto</button>
        </div>

        {tab === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Bezeichnung</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Haferbrei mit Beeren" style={S.input} /></div>
            <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Kalorien (kcal)</label>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="z.B. 350" style={S.input} min={1} /></div>
            <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Uhrzeit</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={S.input} /></div>
          </div>
        )}

        {tab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f0f9ff', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                Sag z.B.:<br /><strong>„Pizza 600 Kalorien"</strong> oder <strong>„Apfel 80 kcal"</strong>
              </p>
              <button onClick={startVoice} style={{ ...S.buttonPrimary, background: isListening ? '#dc2626' : '#2563eb', margin: '0 auto' }}>
                <Mic size={16} />{isListening ? 'Höre zu...' : 'Aufnahme starten'}
              </button>
              {voiceText && <div style={{ marginTop: 12, padding: 10, background: '#fff', borderRadius: 12, fontSize: 13, color: '#334155' }}>🎤 <em>„{voiceText}"</em></div>}
            </div>
            {name && <>
              <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Bezeichnung</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={S.input} /></div>
              <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Kalorien (kcal)</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} style={S.input} /></div>
              <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Uhrzeit</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={S.input} /></div>
            </>}
          </div>
        )}

        {tab === 'photo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
              {photoPreview
                ? <img src={photoPreview} alt="Mahlzeit" style={{ maxHeight: 180, borderRadius: 12, objectFit: 'cover', maxWidth: '100%' }} />
                : <>
                  <Camera size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ color: '#64748b', fontSize: 13 }}>Foto auswählen oder aufnehmen</p>
                  <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>JPG, PNG, WEBP</p>
                </>}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {photoPreview && !photoResult && (
              <button onClick={analyzePhoto} disabled={isAnalyzing} style={{ ...S.buttonPrimary, justifyContent: 'center', opacity: isAnalyzing ? 0.7 : 1 }}>
                {isAnalyzing
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />KI analysiert...</>
                  : <><Zap size={16} />Mit KI analysieren</>}
              </button>
            )}

            {photoError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 10, fontSize: 13, color: '#dc2626' }}>{photoError}</div>}

            {photoResult && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, fontSize: 13 }}>
                <span style={{ color: '#15803d', fontWeight: 600 }}>✓ KI-Schätzung: </span>
                {photoResult.name} – ca. <strong>{photoResult.calories} kcal</strong>
                <br /><span style={{ color: '#64748b', fontSize: 11 }}>Bitte prüfen und ggf. anpassen.</span>
              </div>
            )}

            {(photoResult || photoError) && <>
              <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Bezeichnung</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={S.input} /></div>
              <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Kalorien (kcal)</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} style={S.input} /></div>
              <div><label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Uhrzeit</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={S.input} /></div>
            </>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.buttonGhost}>Abbrechen</button>
          <button onClick={handleSave} style={S.buttonPrimary}><Save size={16} />Speichern</button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────
export default function CaloriePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({ age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' });
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [newWeightDate, setNewWeightDate] = useState<string>(getToday());
  const [newWeightValue, setNewWeightValue] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [scaleStatus, setScaleStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
  const [customMet, setCustomMet] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [calculatedCalories, setCalculatedCalories] = useState<number>(0);
  const [useCustomMet, setUseCustomMet] = useState(false);

  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showFoodHistory, setShowFoodHistory] = useState(false);

  useEffect(() => {
    const sp = safeLocalStorage.getItem(STORAGE_KEY_PROFILE);
    if (sp) { try { const p = JSON.parse(sp); setProfile(p); calculateCalories(p); setIsSaved(true); } catch {} }
    else calculateCalories(profile);
    const sd = safeLocalStorage.getItem(STORAGE_KEY_START_DATE);
    if (sd) setStartDate(sd);
    const sw = safeLocalStorage.getItem(STORAGE_KEY_WEIGHT);
    if (sw) { try { setWeightEntries(JSON.parse(sw)); } catch {} }
    const sa = safeLocalStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (sa) { try { setActivities(JSON.parse(sa)); } catch {} }
    const sf = safeLocalStorage.getItem(STORAGE_KEY_FOOD);
    if (sf) { try { setFoodEntries(JSON.parse(sf)); } catch {} }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEY_WEIGHT, JSON.stringify(weightEntries)); }, [weightEntries]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEY_START_DATE, startDate); }, [startDate]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities)); }, [activities]);
  useEffect(() => { safeLocalStorage.setItem(STORAGE_KEY_FOOD, JSON.stringify(foodEntries)); }, [foodEntries]);
  useEffect(() => {
    const met = useCustomMet ? parseFloat(customMet) || 0 : selectedSport.met;
    setCalculatedCalories(Math.round(met * profile.weight * (durationMinutes / 60)));
  }, [selectedSport, durationMinutes, profile.weight, useCustomMet, customMet]);

  const calculateBMR = (p: UserProfile) => p.gender === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const calculateTDEE = (bmr: number, level: UserProfile['activityLevel']) => Math.round(bmr * ACTIVITY_MULTIPLIERS[level].value);
  const calculateGoalCalories = (tdee: number) => ({ lose: Math.round(tdee * 0.8), maintain: tdee, gain: Math.round(tdee * 1.15) });
  const calculateCalories = (p: UserProfile) => {
    const bmr = Math.round(calculateBMR(p));
    const tdee = calculateTDEE(bmr, p.activityLevel);
    setResult({ bmr, tdee, goalCalories: calculateGoalCalories(tdee) });
  };

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated); calculateCalories(updated); setIsSaved(false);
  };
  const handleSaveProfile = () => { safeLocalStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile)); setIsSaved(true); };
  const handleResetProfile = () => {
    const def: UserProfile = { age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' };
    setProfile(def); calculateCalories(def); safeLocalStorage.removeItem(STORAGE_KEY_PROFILE); setIsSaved(false);
  };

  const addWeightEntry = (date: string, weight: number, source: WeightEntry['source']) => {
    if (isNaN(weight) || weight <= 0 || weight > 300) return false;
    const idx = weightEntries.findIndex(e => e.date === date);
    const ne: WeightEntry = { id: Date.now().toString(), date, weight, source };
    let arr = idx !== -1 ? weightEntries.map((e, i) => i === idx ? ne : e) : [...weightEntries, ne];
    arr.sort((a, b) => a.date.localeCompare(b.date));
    setWeightEntries(arr); return true;
  };
  const deleteWeightEntry = (id: string) => setWeightEntries(prev => prev.filter(e => e.id !== id));
  const handleManualAdd = () => {
    const w = parseFloat(newWeightValue);
    if (!newWeightDate || isNaN(w)) { alert('Bitte Datum und gültiges Gewicht eingeben'); return; }
    addWeightEntry(newWeightDate, w, 'manual'); setNewWeightValue(''); setNewWeightDate(getToday());
  };
  const startVoiceWeight = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { alert('Keine Spracheingabe.'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      const wm = text.match(/(\d+)[,.](\d+)/);
      const w = wm ? parseFloat(wm[1] + '.' + wm[2]) : parseFloat(text.match(/(\d+)/)?.[1] || '0');
      if (w > 0 && w < 300) { addWeightEntry(getToday(), w, 'voice'); alert(`${w} kg hinzugefügt.`); }
      else alert('Kein gültiges Gewicht erkannt.');
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };
  const connectScale = () => {
    setScaleStatus('connecting');
    setTimeout(() => {
      const mw = parseFloat((profile.weight + (Math.random() * 2 - 1)).toFixed(1));
      addWeightEntry(getToday(), mw, 'scale'); setScaleStatus('idle'); setShowScaleModal(false);
      alert(`Waage: ${mw} kg übertragen.`);
    }, 2000);
  };

  const addActivity = () => {
    const met = useCustomMet ? parseFloat(customMet) || 0 : selectedSport.met;
    if (met === 0 || durationMinutes <= 0) { alert('Bitte Sportart und Dauer eingeben.'); return; }
    const cal = Math.round(met * profile.weight * (durationMinutes / 60));
    setActivities(prev => [{ id: Date.now().toString(), date: getToday(), sport: useCustomMet ? `Custom (MET ${met})` : selectedSport.name, durationMinutes, caloriesBurned: cal, met }, ...prev]);
    setDurationMinutes(30);
  };
  const deleteActivity = (id: string) => setActivities(prev => prev.filter(a => a.id !== id));

  const addFoodEntry = (entry: Omit<FoodEntry, 'id'>) => setFoodEntries(prev => [{ id: Date.now().toString(), ...entry }, ...prev]);
  const deleteFoodEntry = (id: string) => setFoodEntries(prev => prev.filter(e => e.id !== id));

  const today = getToday();
  const todayActivities = activities.filter(a => a.date === today);
  const todayCaloriesBurned = todayActivities.reduce((s, a) => s + a.caloriesBurned, 0);
  const todayFoodEntries = foodEntries.filter(e => e.date === today);
  const todayCaloriesConsumed = todayFoodEntries.reduce((s, e) => s + e.calories, 0);
  const netToday = todayCaloriesConsumed - todayCaloriesBurned;
  const tdee = result?.tdee ?? 0;
  const netProgress = tdee > 0 ? Math.min((todayCaloriesConsumed / tdee) * 100, 100) : 0;

  const chartData = weightEntries.filter(e => e.date >= startDate).map(e => ({ date: e.date, weight: e.weight })).sort((a, b) => a.date.localeCompare(b.date));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = formatDate(new Date(Date.now() - (6 - i) * 86400000));
    return {
      date: d.slice(5),
      eaten: foodEntries.filter(e => e.date === d).reduce((s, e) => s + e.calories, 0),
      burned: activities.filter(a => a.date === d).reduce((s, a) => s + a.caloriesBurned, 0),
    };
  });

  const sourceIcon = (s: FoodEntry['source']) => s === 'voice' ? '🎤' : s === 'photo' ? '📸' : '⌨️';

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div style={S.container}>
          <div style={S.headerRow}>
            <div style={S.logo}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={24} /></button>
              <span>FamilyHub</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 50, padding: '6px 14px' }}>
              <Flame size={18} color="#fff" /><span style={{ color: '#fff', fontWeight: 500 }}>Kalorien & Fitness</span>
            </div>
          </div>
          <div style={S.greeting}>Dein Kalorien- & Aktivitäten-Tracker</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>Mifflin-St Jeor · MET-Sportverbrauch · KI-Fotoanalyse</div>
        </div>
      </div>

      <div style={{ ...S.container, marginTop: 24 }}>
        <div style={S.grid}>

          {/* SPALTE 1: KALORIENRECHNER */}
          <div>
            <div style={S.card}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="#2563eb" />Deine Daten</h3>
              <div style={S.grid2}>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Alter</label><input type="number" value={profile.age} onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)} style={S.input} min={15} max={100} /></div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Geschlecht</label>
                  <select value={profile.gender} onChange={(e) => handleInputChange('gender', e.target.value as any)} style={S.select}>
                    <option value="male">Männlich</option><option value="female">Weiblich</option>
                  </select></div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Gewicht (kg)</label><input type="number" value={profile.weight} onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)} style={S.input} step={0.1} min={30} /></div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Größe (cm)</label><input type="number" value={profile.height} onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)} style={S.input} min={100} /></div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={14} />Aktivitätslevel</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(Object.keys(ACTIVITY_MULTIPLIERS) as UserProfile['activityLevel'][]).map((level) => (
                    <button key={level} onClick={() => handleInputChange('activityLevel', level)} style={{ ...S.activityOption, ...(profile.activityLevel === level ? S.activityActive : {}) }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><span style={{ fontWeight: 500 }}>{ACTIVITY_MULTIPLIERS[level].label}</span><p style={{ fontSize: 12, color: '#64748b' }}>{ACTIVITY_MULTIPLIERS[level].description}</p></div>
                        <span style={{ fontSize: 12, color: '#2563eb' }}>×{ACTIVITY_MULTIPLIERS[level].value}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={handleSaveProfile} disabled={isSaved} style={{ ...S.buttonPrimary, opacity: isSaved ? 0.6 : 1 }}><Save size={16} />{isSaved ? 'Gespeichert' : 'Speichern'}</button>
                <button onClick={handleResetProfile} style={S.buttonGhost}><RotateCcw size={16} />Reset</button>
              </div>
            </div>

            {result && <>
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Grundumsatz (BMR)</span>
                  <button onClick={() => setShowInfo(!showInfo)} style={{ background: 'none', border: 'none' }}><Info size={16} color="#94a3b8" /></button>
                </div>
                {showInfo && <div style={{ background: '#eff6ff', borderRadius: 12, padding: 8, fontSize: 12, marginBottom: 12 }}>Der Grundumsatz ist die Kalorienmenge im völligen Ruhezustand.</div>}
                <div style={{ fontSize: 36, fontWeight: 700, color: '#2563eb' }}>{result.bmr} <span style={{ fontSize: 16, fontWeight: 400 }}>kcal / Tag</span></div>
              </div>
              <div style={{ ...S.card, background: 'linear-gradient(135deg, #fff0e6, #fff)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Target size={18} color="#ea580c" /><span style={{ fontSize: 12, color: '#64748b' }}>Gesamtumsatz (TDEE)</span></div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#ea580c' }}>{result.tdee} <span style={{ fontSize: 16, fontWeight: 400 }}>kcal / Tag</span></div>
                <p style={{ fontSize: 12, color: '#64748b' }}>Inklusive Alltagsaktivität</p>
              </div>
              <div style={S.card}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calculator size={18} color="#2563eb" />Kalorien nach Ziel</h3>
                {[
                  { key: 'lose', label: 'Abnehmen', sub: '~0,5 kg/Woche', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', bar: '#22c55e' },
                  { key: 'maintain', label: 'Halten', sub: 'Erhaltungskalorien', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', bar: '#3b82f6' },
                  { key: 'gain', label: 'Zunehmen', sub: '~0,5 kg/Woche', color: '#9a3412', bg: '#fff7ed', border: '#fed7aa', bar: '#f97316' },
                ].map(({ key, label, sub, color, bg, border, bar }) => (
                  <div key={key} style={{ ...S.resultCard, background: bg, border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div><span style={{ fontWeight: 600, color }}>{label}</span><p style={{ fontSize: 12, color }}>{sub}</p></div>
                      <div style={{ fontSize: 24, fontWeight: 700, color }}>{result.goalCalories[key as keyof typeof result.goalCalories]} kcal</div>
                    </div>
                    <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${(result.goalCalories[key as keyof typeof result.goalCalories] / result.tdee) * 100}%`, background: bar }} /></div>
                  </div>
                ))}
              </div>
            </>}
          </div>

          {/* SPALTE 2: GEWICHTSVERLAUF */}
          <div>
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} color="#2563eb" />Gewichtsverlauf</h3>
                <button onClick={() => setShowScaleModal(true)} style={S.buttonOutline}><Bluetooth size={16} />Waage</button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Startdatum</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={S.input} />
              </div>
              {chartData.length > 0 ? (
                <div style={{ height: 260, marginBottom: 24 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis domain={['auto', 'auto']} unit=" kg" />
                      <Tooltip formatter={(v) => `${v} kg`} />
                      <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Gewicht" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, background: '#f8fafc', borderRadius: 16, marginBottom: 24 }}>
                  <Scale size={32} color="#94a3b8" /><p style={{ color: '#64748b', marginTop: 8 }}>Noch keine Daten.</p>
                </div>
              )}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Neuer Eintrag</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, color: '#64748b' }}>Datum</label><input type="date" value={newWeightDate} onChange={(e) => setNewWeightDate(e.target.value)} style={S.input} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 12, color: '#64748b' }}>Gewicht (kg)</label><input type="number" step="0.1" value={newWeightValue} onChange={(e) => setNewWeightValue(e.target.value)} placeholder="75.2" style={S.input} /></div>
                  <button onClick={handleManualAdd} style={S.buttonPrimary}><Plus size={16} /></button>
                  <button onClick={startVoiceWeight} style={{ ...S.buttonOutline, background: isListening ? '#e0e7ff' : 'white' }}><Mic size={16} />{isListening ? '…' : 'Sprache'}</button>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Historie</h4>
                {weightEntries.length === 0
                  ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Keine Einträge</p>
                  : weightEntries.slice().reverse().map(entry => (
                    <div key={entry.id} style={S.entryRow}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Calendar size={14} color="#64748b" />
                        <span style={{ fontWeight: 500 }}>{entry.date}</span>
                        <span style={{ fontWeight: 600 }}>{entry.weight} kg</span>
                        {entry.source === 'voice' && <span title="Sprache"><Mic size={12} color="#16a34a" /></span>}
                        {entry.source === 'scale' && <span title="Waage"><Scale size={12} color="#2563eb" /></span>}
                      </div>
                      <button onClick={() => deleteWeightEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* SPALTE 3: SPORT */}
          <div>
            <div style={S.card}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Dumbbell size={18} color="#2563eb" />Sport & Aktivitäten</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Sportart</label>
                <select value={selectedSport.name} onChange={(e) => { const s = SPORTS.find(x => x.name === e.target.value); if (s) setSelectedSport(s); setUseCustomMet(false); }} style={S.select} disabled={useCustomMet}>
                  {SPORTS.map(s => <option key={s.name} value={s.name}>{s.name} (MET {s.met})</option>)}
                </select>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="customMet" checked={useCustomMet} onChange={(e) => setUseCustomMet(e.target.checked)} />
                  <label htmlFor="customMet" style={{ fontSize: 12 }}>Eigener MET-Wert</label>
                </div>
                {useCustomMet && <input type="number" step="0.1" value={customMet} onChange={(e) => setCustomMet(e.target.value)} placeholder="z.B. 6.5" style={{ ...S.input, marginTop: 8 }} />}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Dauer (Minuten)</label>
                <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 0))} style={S.input} min={1} />
              </div>
              <div style={{ background: '#f0f9ff', borderRadius: 16, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Verbrannte Kalorien:</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{calculatedCalories} kcal</span>
              </div>
              <button onClick={addActivity} style={{ ...S.buttonPrimary, width: '100%', justifyContent: 'center' }}><Plus size={16} />Aktivität speichern</button>
            </div>

            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} color="#eab308" />Heute verbrannt</h4>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{todayCaloriesBurned} kcal</span>
              </div>
              {todayActivities.length === 0
                ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 12 }}>Noch keine Aktivitäten.</p>
                : todayActivities.map(a => (
                  <div key={a.id} style={S.entryRow}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Timer size={14} color="#64748b" />
                      <span style={{ fontWeight: 500 }}>{a.sport}</span>
                      <span>{a.durationMinutes} min</span>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>{a.caloriesBurned} kcal</span>
                    </div>
                    <button onClick={() => deleteActivity(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12 }}>
                <h4 style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><List size={15} />Letzte Aktivitäten</h4>
                {activities.slice(0, 5).map(a => (
                  <div key={a.id} style={{ ...S.entryRow, fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#64748b' }}>{a.date}</span>
                      <span>{a.sport}</span>
                      <span>{a.durationMinutes} min</span>
                      <span>{a.caloriesBurned} kcal</span>
                    </div>
                    <button onClick={() => deleteActivity(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SPALTE 4: MAHLZEITEN (NEU) */}
          <div>
            {/* Tages-Bilanz-Card */}
            <div style={{ ...S.card, background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: '#fff' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                <Coffee size={18} />Heute – Kalorien-Bilanz
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Gegessen', value: todayCaloriesConsumed, color: '#fbbf24' },
                  { label: 'Verbrannt', value: todayCaloriesBurned, color: '#34d399' },
                  { label: 'Netto', value: netToday, color: netToday > (tdee || 2000) ? '#f87171' : '#a5f3fc' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>
              {tdee > 0 && <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                  <span>Ziel: {tdee} kcal</span><span>{Math.round(netProgress)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 40, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: 8, borderRadius: 40, background: netProgress >= 100 ? '#f87171' : '#fbbf24', width: `${netProgress}%`, transition: 'width 0.5s' }} />
                </div>
              </>}
            </div>

            {/* Mahlzeiten-Card */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><UtensilsCrossed size={18} color="#2563eb" />Mahlzeiten heute</h3>
                <button onClick={() => setShowFoodModal(true)} style={S.buttonPrimary}><Plus size={16} />Eintragen</button>
              </div>

              {todayFoodEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 16 }}>
                  <Coffee size={28} color="#94a3b8" />
                  <p style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Noch nichts eingetragen.</p>
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Tippe, sprich oder fotografiere deine Mahlzeiten!</p>
                </div>
              ) : (
                todayFoodEntries.map(entry => (
                  <div key={entry.id} style={S.entryRow}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                      {entry.photoPreview && <img src={entry.photoPreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />}
                      <span style={{ fontSize: 13 }}>{sourceIcon(entry.source)}</span>
                      <span style={{ fontWeight: 500, flex: 1 }}>{entry.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{entry.time}</span>
                      <span style={{ fontWeight: 600, color: '#ea580c' }}>{entry.calories} kcal</span>
                    </div>
                    <button onClick={() => deleteFoodEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 8 }}><Trash2 size={15} /></button>
                  </div>
                ))
              )}

              {/* 7-Tage-Verlauf */}
              <button onClick={() => setShowFoodHistory(!showFoodHistory)} style={{ ...S.buttonGhost, width: '100%', justifyContent: 'center', marginTop: 16 }}>
                {showFoodHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}7-Tage-Verlauf
              </button>

              {showFoodHistory && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={last7} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="eaten" fill="#fbbf24" name="Gegessen" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="burned" fill="#34d399" name="Verbrannt" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Alle Mahlzeit-Einträge</h4>
                    {foodEntries.length === 0
                      ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Keine Einträge.</p>
                      : foodEntries.slice(0, 20).map(entry => (
                        <div key={entry.id} style={{ ...S.entryRow, fontSize: 13 }}>
                          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>{entry.date}</span>
                            <span style={{ color: '#64748b' }}>{entry.time}</span>
                            <span>{sourceIcon(entry.source)}</span>
                            <span style={{ flex: 1 }}>{entry.name}</span>
                            <span style={{ fontWeight: 600, color: '#ea580c' }}>{entry.calories} kcal</span>
                          </div>
                          <button onClick={() => deleteFoodEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {showFoodModal && <FoodInputModal onClose={() => setShowFoodModal(false)} onSave={addFoodEntry} />}

      {showScaleModal && (
        <div style={S.modalOverlay} onClick={() => setShowScaleModal(false)}>
          <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Smarte Waage verbinden</h3>
            <p style={{ color: '#475569', marginBottom: 20 }}>Demo – echte Integration erfordert Web Bluetooth API oder native App.</p>
            {scaleStatus === 'connecting' && <p>Verbinde...</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowScaleModal(false); setScaleStatus('idle'); }} style={S.buttonGhost}>Abbrechen</button>
              <button onClick={connectScale} disabled={scaleStatus === 'connecting'} style={S.buttonPrimary}>Verbinden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}