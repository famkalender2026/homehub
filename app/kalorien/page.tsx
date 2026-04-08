'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, User, Activity, Target, Info, Calculator, Save, RotateCcw, ArrowLeft,
  Plus, Mic, Scale, Bluetooth, Trash2, Calendar, TrendingUp, Dumbbell, Timer,
  Zap, List, Coffee, Camera, UtensilsCrossed, ChevronDown, ChevronUp, X, Loader2,
  Settings, ChevronRight, Sparkles, Heart
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────
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
  light: { value: 1.375, label: 'Leicht aktiv', description: 'Sport 1–3 Tage/Woche' },
  moderate: { value: 1.55, label: 'Mäßig aktiv', description: 'Sport 3–5 Tage/Woche' },
  active: { value: 1.725, label: 'Aktiv', description: 'Sport 6–7 Tage/Woche' },
  very_active: { value: 1.9, label: 'Sehr aktiv', description: 'Körperl. Arbeit + Sport' },
};

const STORAGE_KEY_PROFILE = 'familyhub_calorie_profile';
const STORAGE_KEY_WEIGHT = 'familyhub_weight_entries';
const STORAGE_KEY_START_DATE = 'familyhub_weight_start_date';
const STORAGE_KEY_ACTIVITIES = 'familyhub_activities';
const STORAGE_KEY_FOOD = 'familyhub_food_entries';
const STORAGE_KEY_GOAL = 'familyhub_calorie_goal';

const safeLS = {
  get: (k: string) => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } },
  set: (k: string, v: string) => { try { if (typeof window !== 'undefined') localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { if (typeof window !== 'undefined') localStorage.removeItem(k); } catch {} },
};

const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const getToday = () => formatDate(new Date());
const getNow = () => new Date().toTimeString().slice(0, 5);
const defaultStartDate = () => formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

// ─── Ideal Weight Calculation ──────────────────────────────────────────
function getIdealWeight(height: number, gender: 'male' | 'female') {
  const heightInInches = (height - 152.4) / 2.54;
  const base = gender === 'male' ? 50 : 45.5;
  const devine = base + 2.3 * heightInInches;
  const heightM = height / 100;
  const bmiLow = 18.5 * heightM * heightM;
  const bmiHigh = 24.9 * heightM * heightM;
  return { devine: Math.round(devine), bmiLow: Math.round(bmiLow), bmiHigh: Math.round(bmiHigh) };
}

function getBMI(weight: number, height: number) {
  const h = height / 100;
  return weight / (h * h);
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Untergewicht', color: '#3b82f6' };
  if (bmi < 25) return { label: 'Normalgewicht', color: '#16a34a' };
  if (bmi < 30) return { label: 'Übergewicht', color: '#f59e0b' };
  return { label: 'Adipositas', color: '#ef4444' };
}

// ─── AI Calorie Suggestion (Claude) ─────────────────────────────────────
async function getAICalorieSuggestion(foodDescription: string): Promise<{ calories: number; explanation: string } | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Schätze die Kalorien für folgende Mahlzeit/Lebensmittel: "${foodDescription}"\n\nAntworte NUR mit einem JSON-Objekt, kein Markdown:\n{"calories": 123, "explanation": "kurze Begründung auf Deutsch, max 60 Zeichen"}\n\nSei realistisch und verwende Durchschnittswerte.`,
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map((c: any) => c.text || '').join('') || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

async function analyzePhotoCalories(base64: string): Promise<{ name: string; calories: number; explanation: string } | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Analysiere dieses Essensfoto. Antworte NUR mit JSON, kein Markdown:\n{"name": "Gerichtsname auf Deutsch", "calories": 123, "explanation": "Schätzung: z.B. ca. 200g Nudeln ~280kcal + Sauce ~80kcal"}\n\nFalls kein Essen: {"name": "Unbekannt", "calories": 0, "explanation": "Kein Essen erkannt"}' },
          ],
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map((c: any) => c.text || '').join('') || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

// ─── Ring Chart ────────────────────────────────────────────────────────
function RingChart({ pct, size = 100, stroke = 9, color = '#2563eb' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - dash}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

// ─── Food Input Modal ──────────────────────────────────────────────────
interface FoodModalProps {
  userWeight: number;
  onClose: () => void;
  onSave: (e: Omit<FoodEntry, 'id'>) => void;
}

function FoodInputModal({ userWeight: _uw, onClose, onSave }: FoodModalProps) {
  const [tab, setTab] = useState<'manual' | 'voice' | 'photo'>('manual');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [time, setTime] = useState(getNow());
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ calories: number; explanation: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoResult, setPhotoResult] = useState<{ name: string; calories: number; explanation: string } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (name.trim().length > 3 && tab === 'manual') {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      aiTimerRef.current = setTimeout(async () => {
        setIsLoadingAI(true);
        setAiSuggestion(null);
        const result = await getAICalorieSuggestion(name.trim());
        setAiSuggestion(result);
        setIsLoadingAI(false);
      }, 900);
    } else {
      setAiSuggestion(null);
      setIsLoadingAI(false);
    }
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [name, tab]);

  const acceptSuggestion = () => {
    if (aiSuggestion) setCalories(String(aiSuggestion.calories));
  };

  const acceptPhotoResult = () => {
    if (photoResult) {
      setName(photoResult.name);
      setCalories(String(photoResult.calories));
    }
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { alert('Keine Spracheingabe verfügbar.'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      const calMatch = text.match(/(\d+)\s*(?:kalorien|kcal|cal)/i);
      const numMatch = text.match(/(\d{2,4})/);
      const cal = calMatch ? parseInt(calMatch[1]) : numMatch ? parseInt(numMatch[1]) : 0;
      const cleaned = text.replace(/(\d+)\s*(?:kalorien|kcal|cal)?/gi, '').trim() || text;
      setName(cleaned);
      if (cal > 0) {
        setCalories(String(cal));
      } else {
        setIsLoadingAI(true);
        const s = await getAICalorieSuggestion(cleaned);
        setAiSuggestion(s);
        setIsLoadingAI(false);
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl.split(',')[1]);
      setPhotoResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!photoBase64) return;
    setIsAnalyzing(true);
    const result = await analyzePhotoCalories(photoBase64);
    setPhotoResult(result);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    const cal = parseInt(calories);
    if (!name.trim() || isNaN(cal) || cal <= 0) { alert('Bitte Name und gültige Kalorienzahl eingeben.'); return; }
    onSave({ date: getToday(), time, name: name.trim(), calories: cal, source: tab, photoPreview: tab === 'photo' ? (photoPreview ?? undefined) : undefined });
    onClose();
  };

  const tabStyle = (t: typeof tab): React.CSSProperties => ({
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer',
    background: tab === t ? '#2563eb' : 'transparent', color: tab === t ? '#fff' : '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
  });

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const modalContentStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 24, padding: 24, maxWidth: 520, width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '0 14px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff'
  };
  const buttonPrimaryStyle: React.CSSProperties = {
    background: '#2563eb', border: 'none', borderRadius: 40, padding: '10px 20px',
    color: '#fff', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
  };
  const buttonGhostStyle: React.CSSProperties = {
    background: '#f1f5f9', border: 'none', borderRadius: 40, padding: '10px 20px',
    color: '#1e293b', fontWeight: 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>Mahlzeit eintragen</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 16, padding: 4, gap: 4, marginBottom: 20 }}>
          <button style={tabStyle('manual')} onClick={() => setTab('manual')}><UtensilsCrossed size={14} />Tippen</button>
          <button style={tabStyle('voice')} onClick={() => setTab('voice')}><Mic size={14} />Sprache</button>
          <button style={tabStyle('photo')} onClick={() => setTab('photo')}><Camera size={14} />Foto</button>
        </div>

        {(tab === 'manual' || tab === 'voice') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tab === 'voice' && (
              <div style={{ background: '#f0f9ff', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                  Sag z.B.:<br /><strong>„Apfel"</strong> oder <strong>„Pizza 600 Kalorien"</strong>
                </p>
                <button onClick={startVoice} style={{ ...buttonPrimaryStyle, background: isListening ? '#dc2626' : '#2563eb', margin: '0 auto' }}>
                  <Mic size={16} />{isListening ? 'Höre zu...' : 'Aufnahme starten'}
                </button>
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Bezeichnung</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Apfel, 50g Haferflocken" style={{ ...inputStyle, flex: 1 }} />
                {isLoadingAI && <div style={{ display: 'flex', alignItems: 'center', paddingRight: 4 }}><Loader2 size={16} className="spinning" color="#888" /></div>}
              </div>
            </div>
            {(aiSuggestion || isLoadingAI) && !parseInt(calories) && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={16} color="#15803d" style={{ flexShrink: 0 }} />
                {isLoadingAI
                  ? <span style={{ color: '#888', fontSize: 13 }}>KI schätzt Kalorien…</span>
                  : aiSuggestion && <>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'DM Sans', fontSize: 18, fontWeight: 700, color: '#15803d' }}>{aiSuggestion.calories} kcal</div>
                        <button onClick={() => setShowExplanation(!showExplanation)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <div style={{ fontSize: 12, textDecoration: 'underline', textDecorationStyle: 'dotted', color: '#166534' }}>{aiSuggestion.explanation}</div>
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ ...buttonGhostStyle, height: 34, padding: '0 12px', fontSize: 12 }} onClick={acceptSuggestion}>Übernehmen</button>
                      </div>
                    </>}
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Kalorien (kcal)</label>
              <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Eingeben oder KI-Vorschlag übernehmen" min={1} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Uhrzeit</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        {tab === 'photo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
              {photoPreview
                ? <img src={photoPreview} alt="" style={{ maxHeight: 200, borderRadius: 10, objectFit: 'cover', maxWidth: '100%' }} />
                : <>
                    <Camera size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: '#64748b', fontSize: 13 }}>Foto auswählen oder aufnehmen</p>
                  </>}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            {photoPreview && !photoResult && (
              <button onClick={analyzePhoto} disabled={isAnalyzing} style={{ ...buttonPrimaryStyle, justifyContent: 'center', opacity: isAnalyzing ? 0.7 : 1 }}>
                {isAnalyzing ? <><Loader2 size={16} className="spinning" />KI analysiert…</> : <><Sparkles size={16} />Mit KI analysieren</>}
              </button>
            )}
            {photoResult && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Sparkles size={16} color="#15803d" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{photoResult.name}</div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 18, fontWeight: 700, color: '#15803d' }}>{photoResult.calories} kcal</div>
                  </div>
                  <button style={{ ...buttonGhostStyle, height: 34, padding: '0 12px', fontSize: 12 }} onClick={acceptPhotoResult}>Übernehmen</button>
                </div>
                <button onClick={() => setShowExplanation(!showExplanation)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: 4 }}>
                  <div style={{ fontSize: 12, textDecoration: 'underline', textDecorationStyle: 'dotted', color: '#166534' }}>
                    {showExplanation ? photoResult.explanation : '▸ Schätzung anzeigen'}
                  </div>
                </button>
              </div>
            )}
            {(name || parseInt(calories) > 0) && <>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Bezeichnung</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Kalorien (kcal)</label>
                <input type="number" value={calories} onChange={e => setCalories(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Uhrzeit</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
              </div>
            </>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={buttonGhostStyle}>Abbrechen</button>
          <button onClick={handleSave} style={buttonPrimaryStyle}><Save size={16} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Modal ────────────────────────────────────────────────────
function ActivityModal({ weight, onClose, onSave }: { weight: number; onClose: () => void; onSave: (a: Omit<ActivityEntry, 'id'>) => void }) {
  const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
  const [duration, setDuration] = useState(30);
  const [useCustom, setUseCustom] = useState(false);
  const [customMet, setCustomMet] = useState('');
  const met = useCustom ? parseFloat(customMet) || 0 : selectedSport.met;
  const cal = Math.round(met * weight * (duration / 60));

  const handleSave = () => {
    if (met === 0 || duration <= 0) return;
    onSave({ date: getToday(), sport: useCustom ? `Custom (MET ${met})` : selectedSport.name, durationMinutes: duration, caloriesBurned: cal, met });
    onClose();
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const modalContentStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 24, padding: 24, maxWidth: 520, width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '0 14px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff'
  };
  const selectStyle: React.CSSProperties = {
    width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '0 12px', fontSize: 14, background: '#fff', fontFamily: "'DM Sans', sans-serif"
  };
  const buttonPrimaryStyle: React.CSSProperties = {
    background: '#2563eb', border: 'none', borderRadius: 40, padding: '10px 20px',
    color: '#fff', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
  };
  const buttonGhostStyle: React.CSSProperties = {
    background: '#f1f5f9', border: 'none', borderRadius: 40, padding: '10px 20px',
    color: '#1e293b', fontWeight: 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 18 }}>Aktivität eintragen</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Sportart</label>
            <select value={selectedSport.name} disabled={useCustom} onChange={e => { const s = SPORTS.find(x => x.name === e.target.value); if (s) setSelectedSport(s); }} style={selectStyle}>
              {SPORTS.map(s => <option key={s.name} value={s.name}>{s.name} (MET {s.met})</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" id="cm" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} />
              <label htmlFor="cm" style={{ fontSize: 13, color: '#666' }}>Eigener MET-Wert</label>
              {useCustom && <input type="number" step="0.1" value={customMet} onChange={e => setCustomMet(e.target.value)} placeholder="z.B. 6.5" style={{ ...inputStyle, width: 100 }} />}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Dauer (Minuten)</label>
            <input type="number" value={duration} onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 0))} min={1} style={inputStyle} />
          </div>
          <div style={{ background: '#f0f9ff', borderRadius: 16, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#2563eb', fontWeight: 500 }}>Geschätzter Verbrauch</span>
            <span style={{ fontFamily: 'DM Sans', fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{cal} <span style={{ fontSize: 14, fontWeight: 400 }}>kcal</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...buttonGhostStyle, flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button onClick={handleSave} style={{ ...buttonPrimaryStyle, flex: 2, justifyContent: 'center' }}><Save size={15} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Weight Modal ──────────────────────────────────────────────────────
function WeightModal({ onClose, onSave, currentWeight }: { onClose: () => void; onSave: (w: number, date: string) => void; currentWeight: number }) {
  const [weight, setWeight] = useState(String(currentWeight));
  const [date, setDate] = useState(getToday());
  const [isListening, setIsListening] = useState(false);

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { alert('Keine Spracheingabe.'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      const wm = text.match(/(\d+)[,.](\d+)/);
      const w = wm ? parseFloat(wm[1] + '.' + wm[2]) : parseFloat(text.match(/(\d+)/)?.[1] || '0');
      if (w > 0 && w < 300) setWeight(String(w));
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const modalContentStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 24, padding: 24, maxWidth: 520, width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '0 14px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff'
  };
  const buttonPrimaryStyle: React.CSSProperties = {
    background: '#2563eb', border: 'none', borderRadius: 40, padding: '10px 20px',
    color: '#fff', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
  };
  const buttonGhostStyle: React.CSSProperties = {
    background: '#f1f5f9', border: 'none', borderRadius: 40, padding: '10px 20px',
    color: '#1e293b', fontWeight: 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
  };
  const buttonOutlineStyle: React.CSSProperties = {
    background: 'transparent',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 40,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer'
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 18 }}>Gewicht eintragen</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>Gewicht (kg)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={startVoice} style={{ ...buttonOutlineStyle, background: isListening ? '#e0e7ff' : 'white' }}><Mic size={16} /></button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...buttonGhostStyle, flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button onClick={() => { const w = parseFloat(weight); if (w > 0 && w < 300) { onSave(w, date); onClose(); } else alert('Ungültiges Gewicht'); }} style={{ ...buttonPrimaryStyle, flex: 2, justifyContent: 'center' }}><Save size={15} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Globale Style-Objekte für die Hauptseite ───────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: 40
};
const headerStyle: React.CSSProperties = {
  background: '#1e3a5f', padding: '40px 20px 40px', position: 'relative', overflow: 'hidden'
};
const containerStyle: React.CSSProperties = {
  maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 20px'
};
const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, alignItems: 'start'
};
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: 20,
  boxShadow: '0 1px 4px rgba(15,23,42,.07), 0 0 0 1px rgba(241,245,249,.8)', marginBottom: 20, height: 'fit-content'
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
  padding: '0 14px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', background: '#fff'
};
const selectStyle: React.CSSProperties = {
  width: '100%', height: 42, border: '1.5px solid #e2e8f0', borderRadius: 12,
  padding: '0 12px', fontSize: 14, background: '#fff', fontFamily: "'DM Sans', sans-serif"
};
const buttonPrimaryStyle: React.CSSProperties = {
  background: '#2563eb', border: 'none', borderRadius: 40, padding: '10px 20px',
  color: '#fff', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
};
const buttonGhostStyle: React.CSSProperties = {
  background: '#f1f5f9', border: 'none', borderRadius: 40, padding: '10px 20px',
  color: '#1e293b', fontWeight: 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
};
// Korrigierter buttonOutlineStyle ohne gemischte border-Eigenschaften
const buttonOutlineStyle: React.CSSProperties = {
  background: 'transparent',
  borderWidth: '1.5px',
  borderStyle: 'solid',
  borderColor: '#cbd5e1',
  borderRadius: 40,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer'
};

// ─── Hauptkomponente ────────────────────────────────────────────────────
export default function CaloriePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({ age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' });
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [goalMode, setGoalMode] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [startDate] = useState<string>(defaultStartDate);
  const [showWeightChart, setShowWeightChart] = useState(false);

  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [showFoodHistory, setShowFoodHistory] = useState(false);

  const calcBMR = (p: UserProfile) => p.gender === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const calcTDEE = (bmr: number, level: UserProfile['activityLevel']) => Math.round(bmr * ACTIVITY_MULTIPLIERS[level].value);
  const computeResult = useCallback((p: UserProfile) => {
    const bmr = Math.round(calcBMR(p));
    const tdee = calcTDEE(bmr, p.activityLevel);
    setResult({ bmr, tdee, goalCalories: { lose: Math.round(tdee * 0.8), maintain: tdee, gain: Math.round(tdee * 1.15) } });
  }, []);

  useEffect(() => {
    const sp = safeLS.get(STORAGE_KEY_PROFILE);
    if (sp) { try { const p = JSON.parse(sp); setProfile(p); computeResult(p); setIsSaved(true); } catch {} } else computeResult(profile);
    const sg = safeLS.get(STORAGE_KEY_GOAL);
    if (sg) setGoalMode(sg as any);
    const sw = safeLS.get(STORAGE_KEY_WEIGHT);
    if (sw) { try { setWeightEntries(JSON.parse(sw)); } catch {} }
    const sa = safeLS.get(STORAGE_KEY_ACTIVITIES);
    if (sa) { try { setActivities(JSON.parse(sa)); } catch {} }
    const sf = safeLS.get(STORAGE_KEY_FOOD);
    if (sf) { try { setFoodEntries(JSON.parse(sf)); } catch {} }
  }, []);

  useEffect(() => { safeLS.set(STORAGE_KEY_WEIGHT, JSON.stringify(weightEntries)); }, [weightEntries]);
  useEffect(() => { safeLS.set(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities)); }, [activities]);
  useEffect(() => { safeLS.set(STORAGE_KEY_FOOD, JSON.stringify(foodEntries)); }, [foodEntries]);
  useEffect(() => { safeLS.set(STORAGE_KEY_GOAL, goalMode); }, [goalMode]);

  const updateProfile = (field: keyof UserProfile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated); computeResult(updated); setIsSaved(false);
  };
  const saveProfile = () => { safeLS.set(STORAGE_KEY_PROFILE, JSON.stringify(profile)); setIsSaved(true); };
  const resetProfile = () => {
    const def: UserProfile = { age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' };
    setProfile(def); computeResult(def); safeLS.del(STORAGE_KEY_PROFILE); setIsSaved(false);
  };

  const saveWeight = (w: number, date: string) => {
    const ne: WeightEntry = { id: Date.now().toString(), date, weight: w, source: 'manual' };
    setWeightEntries(prev => { const filtered = prev.filter(e => e.date !== date); return [...filtered, ne].sort((a, b) => a.date.localeCompare(b.date)); });
    updateProfile('weight', w);
  };

  const addActivity = (a: Omit<ActivityEntry, 'id'>) => setActivities(prev => [{ id: Date.now().toString(), ...a }, ...prev]);
  const delActivity = (id: string) => setActivities(prev => prev.filter(a => a.id !== id));
  const addFood = (e: Omit<FoodEntry, 'id'>) => setFoodEntries(prev => [{ id: Date.now().toString(), ...e }, ...prev]);
  const delFood = (id: string) => setFoodEntries(prev => prev.filter(e => e.id !== id));

  const today = getToday();
  const todayFood = foodEntries.filter(e => e.date === today);
  const todayActivities = activities.filter(a => a.date === today);
  const consumed = todayFood.reduce((s, e) => s + e.calories, 0);
  const burned = todayActivities.reduce((s, a) => s + a.caloriesBurned, 0);
  const targetCal = result?.goalCalories[goalMode] ?? result?.tdee ?? 2000;
  const remaining = targetCal - consumed + burned;
  const pctConsumed = targetCal > 0 ? (consumed / targetCal) * 100 : 0;

  const bmi = getBMI(profile.weight, profile.height);
  const bmiCat = getBMICategory(bmi);
  const ideal = getIdealWeight(profile.height, profile.gender);
  const bmiPct = Math.min(Math.max(((bmi - 15) / (45 - 15)) * 100, 0), 100);
  const overweight = profile.weight > ideal.bmiHigh ? +(profile.weight - ideal.bmiHigh).toFixed(1) : 0;
  const toIdeal = profile.weight > ideal.bmiHigh ? overweight : profile.weight < ideal.bmiLow ? +(ideal.bmiLow - profile.weight).toFixed(1) : 0;

  const chartData = weightEntries.filter(e => e.date >= startDate).map(e => ({ date: e.date.slice(5), weight: e.weight }));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = formatDate(new Date(Date.now() - (6 - i) * 86400000));
    return {
      date: d.slice(5),
      eaten: foodEntries.filter(e => e.date === d).reduce((s, e) => s + e.calories, 0),
      burned: activities.filter(a => a.date === d).reduce((s, a) => s + a.caloriesBurned, 0),
    };
  });

  const srcIcon = (s: FoodEntry['source']) => s === 'voice' ? '🎤' : s === 'photo' ? '📸' : '⌨️';
  const ringColor = pctConsumed > 100 ? '#ef4444' : pctConsumed > 85 ? '#f59e0b' : '#2563eb';

  return (
    <div style={pageStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={24} /></button>
              <span>FamilyHub</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 50, padding: '6px 14px' }}>
              <Flame size={18} color="#fff" /><span style={{ color: '#fff', fontWeight: 500 }}>Kalorien & Fitness</span>
            </div>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#fff', marginTop: 16 }}>
            Dein Kalorien- & Aktivitäten-Tracker
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>Mifflin-St Jeor · MET-Sportverbrauch · KI-Fotoanalyse</div>
        </div>
      </div>

      <div style={{ ...containerStyle, marginTop: 24 }}>
        <div style={gridStyle}>

          {/* SPALTE 1: Profil + Kalorienziele */}
          <div>
            <div style={cardStyle}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color="#2563eb" />Deine Daten</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Alter</label><input type="number" value={profile.age} onChange={(e) => updateProfile('age', parseInt(e.target.value) || 0)} style={inputStyle} min={15} max={100} /></div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Geschlecht</label>
                  <select value={profile.gender} onChange={(e) => updateProfile('gender', e.target.value as any)} style={selectStyle}>
                    <option value="male">Männlich</option><option value="female">Weiblich</option>
                  </select>
                </div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Gewicht (kg)</label><input type="number" value={profile.weight} onChange={(e) => updateProfile('weight', parseFloat(e.target.value) || 0)} style={inputStyle} step={0.1} /></div>
                <div><label style={{ fontSize: 12, color: '#64748b' }}>Größe (cm)</label><input type="number" value={profile.height} onChange={(e) => updateProfile('height', parseInt(e.target.value) || 0)} style={inputStyle} /></div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={14} />Aktivitätslevel</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(Object.keys(ACTIVITY_MULTIPLIERS) as UserProfile['activityLevel'][]).map((level) => (
                    <button key={level} onClick={() => updateProfile('activityLevel', level)} style={{ ...buttonOutlineStyle, width: '100%', textAlign: 'left', justifyContent: 'space-between', ...(profile.activityLevel === level ? { borderColor: '#2563eb', background: '#eff6ff' } : {}) }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{ACTIVITY_MULTIPLIERS[level].label}</span>
                        <p style={{ fontSize: 12, color: '#64748b' }}>{ACTIVITY_MULTIPLIERS[level].description}</p>
                      </div>
                      <span style={{ fontSize: 12, color: '#2563eb' }}>×{ACTIVITY_MULTIPLIERS[level].value}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={saveProfile} disabled={isSaved} style={{ ...buttonPrimaryStyle, opacity: isSaved ? 0.6 : 1 }}><Save size={16} />{isSaved ? 'Gespeichert' : 'Speichern'}</button>
                <button onClick={resetProfile} style={buttonGhostStyle}><RotateCcw size={16} />Reset</button>
              </div>
            </div>

            {result && (
              <>
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: '#64748b' }}>Grundumsatz (BMR)</span></div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#2563eb' }}>{result.bmr} <span style={{ fontSize: 16, fontWeight: 400 }}>kcal / Tag</span></div>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fff0e6, #fff)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Target size={18} color="#ea580c" /><span style={{ fontSize: 12, color: '#64748b' }}>Gesamtumsatz (TDEE)</span></div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#ea580c' }}>{result.tdee} <span style={{ fontSize: 16, fontWeight: 400 }}>kcal / Tag</span></div>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Inklusive Alltagsaktivität</p>
                </div>
                <div style={cardStyle}>
                  <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calculator size={18} color="#2563eb" />Kalorien nach Ziel</h3>
                  {[
                    { key: 'lose', label: 'Abnehmen', sub: '~0,5 kg/Woche', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', bar: '#22c55e' },
                    { key: 'maintain', label: 'Halten', sub: 'Erhaltungskalorien', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', bar: '#3b82f6' },
                    { key: 'gain', label: 'Zunehmen', sub: '~0,5 kg/Woche', color: '#9a3412', bg: '#fff7ed', border: '#fed7aa', bar: '#f97316' },
                  ].map(({ key, label, sub, color, bg, border, bar }) => (
                    <div key={key} onClick={() => setGoalMode(key as any)} style={{ cursor: 'pointer', background: bg, border: `1px solid ${border}`, borderRadius: 20, padding: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><span style={{ fontWeight: 600, color }}>{label}</span><p style={{ fontSize: 12, color }}>{sub}</p></div>
                        <div style={{ fontSize: 24, fontWeight: 700, color }}>{result.goalCalories[key as keyof typeof result.goalCalories]} kcal</div>
                      </div>
                      <div style={{ background: '#e2e8f0', borderRadius: 40, height: 6, marginTop: 8 }}>
                        <div style={{ width: `${(result.goalCalories[key as keyof typeof result.goalCalories] / result.tdee) * 100}%`, background: bar, height: 6, borderRadius: 40 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* SPALTE 2: Gewicht + Idealgewicht + Verlauf */}
          <div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Scale size={18} color="#2563eb" />Gewicht</h3>
                <button onClick={() => setShowWeightModal(true)} style={buttonPrimaryStyle}><Plus size={16} />Eintragen</button>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: 'DM Sans', fontSize: 48, fontWeight: 700 }}>{profile.weight} <span style={{ fontSize: 20, fontWeight: 400 }}>kg</span></div>
                <div style={{ fontSize: 13, color: '#64748b' }}>BMI: {bmi.toFixed(1)} · <span style={{ color: bmiCat.color, fontWeight: 500 }}>{bmiCat.label}</span></div>
              </div>
              <div style={{ margin: '12px 0' }}>
                <div style={{ position: 'relative', height: 10, borderRadius: 40, overflow: 'hidden', background: 'linear-gradient(to right, #3b82f6 0%, #3b82f6 20%, #16a34a 20%, #16a34a 60%, #f59e0b 60%, #f59e0b 85%, #ef4444 85%, #ef4444 100%)' }}>
                  <div style={{ position: 'absolute', top: -4, width: 18, height: 18, background: '#1a1a1a', border: '3px solid #fff', borderRadius: '50%', transform: 'translateX(-50%)', left: `${bmiPct}%`, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginTop: 4 }}>
                  <span>Untergewicht</span><span>Normal</span><span>Übergewicht</span><span>Adipositas</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 16, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Heart size={12} />Idealgewicht</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 20, fontWeight: 700, color: '#0c4a6e' }}>{ideal.bmiLow}–{ideal.bmiHigh} kg</div>
                  <div style={{ fontSize: 11, color: '#0369a1' }}>BMI-Bereich 18,5–24,9</div>
                </div>
                <div style={{ background: overweight > 0 ? '#fff7ed' : '#f0f9ff', border: `1px solid ${overweight > 0 ? '#fed7aa' : '#bae6fd'}`, borderRadius: 16, padding: '12px 16px' }}>
                  {overweight > 0 ? (
                    <>
                      <div style={{ fontSize: 12, color: '#c2410c', fontWeight: 600, marginBottom: 4 }}>Bis zum Idealgewicht</div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: 28, fontWeight: 700, color: '#9a3412' }}>{toIdeal} kg</div>
                      <div style={{ fontSize: 11, color: '#c2410c' }}>abzunehmen</div>
                    </>
                  ) : toIdeal > 0 ? (
                    <>
                      <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>Bis zum Normalgewicht</div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: 20, fontWeight: 700, color: '#0c4a6e' }}>{toIdeal} kg</div>
                      <div style={{ fontSize: 11, color: '#0369a1' }}>zuzunehmen</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Idealgewicht erreicht!</div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: 20, fontWeight: 700, color: '#16a34a' }}>Super!</div>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setShowWeightChart(!showWeightChart)} style={{ ...buttonGhostStyle, width: '100%', justifyContent: 'center', marginTop: 16 }}>
                {showWeightChart ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Gewichtsverlauf
              </button>
              {showWeightChart && (
                <div style={{ marginTop: 16 }}>
                  {chartData.length > 1 ? (
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={['auto', 'auto']} unit=" kg" />
                          <Tooltip formatter={(v) => `${v} kg`} />
                          <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Gewicht" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Mindestens 2 Einträge für Kurve nötig</p>
                  )}
                  <div style={{ marginTop: 16 }}>
                    {weightEntries.slice().reverse().slice(0, 8).map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Calendar size={14} color="#64748b" />
                          <span style={{ fontWeight: 500 }}>{e.date}</span>
                          <span style={{ fontWeight: 600 }}>{e.weight} kg</span>
                        </div>
                        <button onClick={() => setWeightEntries(prev => prev.filter(w => w.id !== e.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SPALTE 3: Sport & Aktivitäten */}
          <div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Dumbbell size={18} color="#2563eb" />Sport & Aktivitäten</h3>
                <button onClick={() => setShowActivityModal(true)} style={buttonPrimaryStyle}><Plus size={16} />Eintragen</button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} color="#eab308" />Heute verbrannt</h4>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{burned} kcal</span>
                </div>
                {todayActivities.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: 12 }}>Noch keine Aktivitäten.</p>
                ) : (
                  todayActivities.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Timer size={14} color="#64748b" />
                        <span style={{ fontWeight: 500 }}>{a.sport}</span>
                        <span>{a.durationMinutes} min</span>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>{a.caloriesBurned} kcal</span>
                      </div>
                      <button onClick={() => delActivity(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setShowActivityHistory(!showActivityHistory)} style={{ ...buttonGhostStyle, width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {showActivityHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Verlauf
              </button>
              {showActivityHistory && (
                <div style={{ marginTop: 12 }}>
                  {activities.slice(0, 10).map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#64748b' }}>{a.date}</span>
                        <span>{a.sport}</span>
                        <span>{a.durationMinutes} min</span>
                        <span>{a.caloriesBurned} kcal</span>
                      </div>
                      <button onClick={() => delActivity(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SPALTE 4: Tagesbilanz + Mahlzeiten */}
          <div>
            {result && (
              <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}><Flame size={18} />Heute – Kalorien-Bilanz</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['lose', 'maintain', 'gain'] as const).map(g => (
                      <button key={g} onClick={() => setGoalMode(g)} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', background: goalMode === g ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff' }}>
                        {g === 'lose' ? 'Abnehmen' : g === 'maintain' ? 'Halten' : 'Zunehmen'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <RingChart pct={pctConsumed} size={100} stroke={8} color="#fff" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>{remaining > 0 ? remaining : 0} <span style={{ fontSize: 14, fontWeight: 400 }}>kcal</span></div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{remaining > 0 ? 'noch verfügbar' : 'Tagesziel erreicht'}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Ziel: {targetCal} kcal · Verbrannt: {burned} kcal</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 40, height: 6 }}>
                  <div style={{ width: `${Math.min(pctConsumed, 100)}%`, height: 6, borderRadius: 40, background: '#fff' }} />
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><UtensilsCrossed size={18} color="#2563eb" />Mahlzeiten heute</h3>
                <button onClick={() => setShowFoodModal(true)} style={buttonPrimaryStyle}><Plus size={16} />Eintragen</button>
              </div>
              {todayFood.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 16 }}>
                  <Coffee size={28} color="#94a3b8" />
                  <p style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Noch nichts eingetragen.</p>
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Tippe, sprich oder fotografiere deine Mahlzeiten!</p>
                </div>
              ) : (
                todayFood.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    {entry.photoPreview
                      ? <img src={entry.photoPreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      : <div style={{ width: 36, height: 36, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{srcIcon(entry.source)}</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{entry.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{entry.time}</div>
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>{entry.calories} kcal</div>
                    <button onClick={() => delFood(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                ))
              )}
              <div style={{ marginTop: 16 }}>
                <div style={{ height: 180 }}>
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
              </div>
              <button onClick={() => setShowFoodHistory(!showFoodHistory)} style={{ ...buttonGhostStyle, width: '100%', justifyContent: 'center', marginTop: 12 }}>
                {showFoodHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Alle Mahlzeiten
              </button>
              {showFoodHistory && (
                <div style={{ marginTop: 12 }}>
                  {foodEntries.slice(0, 20).map(entry => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b', width: 70 }}>{entry.date}</span>
                      <span style={{ color: '#64748b', width: 45 }}>{entry.time}</span>
                      <span style={{ width: 30 }}>{srcIcon(entry.source)}</span>
                      <span style={{ flex: 1 }}>{entry.name}</span>
                      <span style={{ fontWeight: 600, color: '#ea580c' }}>{entry.calories} kcal</span>
                      <button onClick={() => delFood(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showFoodModal && <FoodInputModal userWeight={profile.weight} onClose={() => setShowFoodModal(false)} onSave={addFood} />}
      {showActivityModal && <ActivityModal weight={profile.weight} onClose={() => setShowActivityModal(false)} onSave={addActivity} />}
      {showWeightModal && <WeightModal onClose={() => setShowWeightModal(false)} onSave={saveWeight} currentWeight={profile.weight} />}
    </div>
  );
}