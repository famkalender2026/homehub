'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Save, RotateCcw, ArrowLeft, Plus, Mic, Scale, Bluetooth, Trash2,
  TrendingUp, Dumbbell, Timer, Coffee, Camera, Upload, Check,
  UtensilsCrossed, ChevronDown, ChevronUp, X, Loader2, Settings,
  Sparkles, Heart, Calculator, Activity, Calendar as CalendarIcon
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────
interface UserProfile {
  age: number; gender: 'male' | 'female'; weight: number; height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}
interface CalorieResult { bmr: number; tdee: number; goalCalories: { lose: number; maintain: number; gain: number }; }
interface WeightEntry { id: string; date: string; weight: number; source: 'manual' | 'voice' | 'scale'; }
interface ActivityEntry { id: string; date: string; sport: string; durationMinutes: number; caloriesBurned: number; met: number; }
interface FoodEntry { id: string; date: string; time: string; name: string; calories: number; source: 'manual' | 'voice' | 'photo'; photoPreview?: string; }

const SPORTS = [
  { name: 'Gehen (3 km/h)', met: 2.0 }, { name: 'Walking (5 km/h)', met: 3.5 },
  { name: 'Joggen (8 km/h)', met: 8.0 }, { name: 'Laufen (10 km/h)', met: 10.0 },
  { name: 'Radfahren (16 km/h)', met: 6.0 }, { name: 'Radfahren (20 km/h)', met: 8.0 },
  { name: 'Schwimmen (moderat)', met: 7.0 }, { name: 'Yoga', met: 2.5 },
  { name: 'Krafttraining (leicht)', met: 3.5 }, { name: 'Krafttraining (intensiv)', met: 6.0 },
  { name: 'HIIT', met: 8.0 }, { name: 'Fußball', met: 7.0 }, { name: 'Tanzen', met: 4.5 },
];
const ACT_MULT: Record<UserProfile['activityLevel'], { value: number; label: string; desc: string }> = {
  sedentary: { value: 1.2, label: 'Sedentär', desc: 'Büroarbeit, wenig Bewegung' },
  light: { value: 1.375, label: 'Leicht aktiv', desc: 'Sport 1–3 Tage/Woche' },
  moderate: { value: 1.55, label: 'Mäßig aktiv', desc: 'Sport 3–5 Tage/Woche' },
  active: { value: 1.725, label: 'Aktiv', desc: 'Sport 6–7 Tage/Woche' },
  very_active: { value: 1.9, label: 'Sehr aktiv', desc: 'Körperl. Arbeit + Sport' },
};
const SK = { p: 'fhub_profile', w: 'fhub_weight', a: 'fhub_acts', f: 'fhub_food', g: 'fhub_goal', ws: 'fhub_weight_start' };
const ls = {
  get: (k: string) => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } },
  set: (k: string, v: string) => { try { if (typeof window !== 'undefined') localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { if (typeof window !== 'undefined') localStorage.removeItem(k); } catch {} },
};
const fd = (d: Date) => d.toISOString().slice(0, 10);
const td = () => fd(new Date());
const nt = () => new Date().toTimeString().slice(0, 5);

// ─── Hilfsfunktionen ────────────────────────────────────────────────────
function idealWeight(height: number): { lo: number; hi: number } {
  const m = height / 100;
  return { lo: Math.round(18.5 * m * m), hi: Math.round(24.9 * m * m) };
}
function getBMI(weight: number, height: number): number {
  const m = height / 100;
  return weight / (m * m);
}
function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Untergewicht', color: '#3b82f6' };
  if (bmi < 25) return { label: 'Normalgewicht', color: '#16a34a' };
  if (bmi < 30) return { label: 'Übergewicht', color: '#f59e0b' };
  return { label: 'Adipositas', color: '#ef4444' };
}
function getWeightDifference(entries: WeightEntry[]): { diff: number; weeklyRate: number; startWeight: number; currentWeight: number } {
  if (entries.length === 0) return { diff: 0, weeklyRate: 0, startWeight: 0, currentWeight: 0 };
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = sorted[0].weight;
  const currentWeight = sorted[sorted.length - 1].weight;
  const diff = currentWeight - startWeight;
  const days = (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 3600 * 24);
  const weeks = days / 7;
  const weeklyRate = weeks > 0 ? diff / weeks : 0;
  return { diff, weeklyRate, startWeight, currentWeight };
}

// ─── Lokale Lebensmittel-Datenbank (kcal pro 100g) ───────────────────────
const foodDB: Record<string, number> = {
  apfel: 52, banane: 89, birne: 57, orange: 47, erdbeere: 32, himbeere: 52,
  brot: 265, vollkornbrot: 247, toast: 300, brötchen: 280,
  haferflocken: 371, müsli: 380, cornflakes: 378,
  reis: 130, nudeln: 158, kartoffel: 77, süßkartoffel: 86,
  hähnchen: 165, rind: 250, schwein: 242, fisch: 150, lachs: 208,
  ei: 155, käse: 350, quark: 68, joghurt: 61, milch: 64,
  butter: 717, öl: 884, nüsse: 600, mandeln: 579,
  schokolade: 546, kuchen: 400, pizza: 266, burger: 295,
  pommes: 312, salat: 15, gurke: 12, tomate: 18, paprika: 26,
};
function parseFoodAndWeight(input: string): { food: string | null; weight: number | null; caloriesPer100g: number | null } {
  const lower = input.toLowerCase().trim();
  const weightMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gramm|gram)?/);
  let weight: number | null = null;
  if (weightMatch) weight = parseFloat(weightMatch[1].replace(',', '.'));
  let foodName = lower.replace(/(\d+(?:[.,]\d+)?)\s*(?:g|gramm|gram)?/, '').trim();
  for (const [key, cal] of Object.entries(foodDB)) {
    if (foodName.includes(key)) {
      return { food: key, weight, caloriesPer100g: cal };
    }
  }
  return { food: null, weight: null, caloriesPer100g: null };
}
function calculateCalories(food: string, weight: number | null, calPer100g: number): number {
  const w = weight ?? 100;
  return Math.round((w / 100) * calPer100g);
}

// ─── CSS (modern, responsiv, flexibles Grid) ────────────────────────────
const GS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#f0f4f8;}
.cp{min-height:100vh;background:#f0f4f8;font-family:'Plus Jakarta Sans',sans-serif;color:#1c1c1e;padding-bottom:80px;}
.hdr{background:#1e3a5f;padding:16px 20px;}
.hdr-r{max-width:1400px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;}
.hdr-logo{font-size:17px;font-weight:700;color:#fff;display:flex;align-items:center;gap:10px;}
.hdr-badge{background:rgba(255,255,255,.15);border-radius:20px;padding:5px 12px;color:#fff;font-size:12px;font-weight:500;display:flex;align-items:center;gap:5px;}
.main{max-width:1400px;margin:0 auto;padding:14px 14px 0;}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:14px;align-items:start;grid-auto-rows:minmax(min-content, auto);}
.card{background:#fff;border-radius:20px;padding:18px;border:1px solid rgba(0,0,0,.05);box-shadow:0 1px 3px rgba(0,0,0,0.03);height:fit-content;}
.card-dk{background:#1e3a5f;border-radius:20px;padding:18px;color:#fff;height:fit-content;}
.slbl{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:5px;margin-bottom:12px;}
.inp{width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:12px;padding:0 14px;font-size:14px;font-family:inherit;background:#fafafa;color:#1c1c1e;outline:none;transition:border-color .15s;}
.inp:focus{border-color:#2563eb;background:#fff;}
.sel{width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:12px;padding:0 12px;font-size:14px;font-family:inherit;background:#fafafa;color:#1c1c1e;outline:none;}
.bp{background:#2563eb;border:none;border-radius:12px;padding:0 16px;height:40px;color:#fff;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity .15s;flex-shrink:0;}
.bp:hover{opacity:.85;}
.bp:disabled{opacity:.4;cursor:not-allowed;}
.bg{background:#f1f5f9;border:none;border-radius:12px;padding:0 14px;height:38px;color:#1e293b;font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:inherit;transition:background .15s;}
.bg:hover{background:#e2e8f0;}
.bic{background:#f1f5f9;border:none;border-radius:10px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;flex-shrink:0;color:#1e293b;}
.bic:hover{background:#e2e8f0;}
.bic.rec{background:#ff3b30;color:#fff;animation:pulse 1s infinite;}
.bdel{background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;border-radius:6px;display:flex;align-items:center;transition:color .15s;}
.bdel:hover{color:#ff3b30;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.frow{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;}
.frow:last-child{border-bottom:none;}
.fico{width:36px;height:36px;background:#f1f5f9;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.fthumb{width:36px;height:36px;border-radius:9px;object-fit:cover;flex-shrink:0;}
.erow{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;}
.erow:last-child{border-bottom:none;}
.sw{border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;margin-bottom:0;}
.stgl{width:100%;background:#fafafa;border:none;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-family:inherit;font-size:14px;font-weight:500;color:#1c1c1e;}
.stgl:hover{background:#f1f5f9;}
.sbody{padding:18px;background:#fff;border-top:1px solid #e2e8f0;display:flex;flex-direction:column;gap:14px;}
.lbl{font-size:12px;color:#64748b;display:block;margin-bottom:4px;}
.aibox{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:10px 14px;display:flex;align-items:flex-start;gap:10px;margin-top:6px;}
.aical{font-size:21px;font-weight:700;color:#15803d;line-height:1;}
.aiexp{font-size:11px;color:#166534;margin-top:3px;}
.bmibar{position:relative;height:10px;border-radius:40px;overflow:hidden;background:linear-gradient(to right,#3b82f6 0%,#3b82f6 20%,#16a34a 20%,#16a34a 60%,#f59e0b 60%,#f59e0b 85%,#ef4444 85%,#ef4444 100%);}
.bmipip{position:absolute;top:-4px;width:18px;height:18px;background:#1e3a5f;border:3px solid #fff;border-radius:50%;transform:translateX(-50%);transition:left .5s;box-shadow:0 1px 4px rgba(0,0,0,.25);}
.rw{position:relative;flex-shrink:0;}
.ri{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.gc{padding:5px 11px;border-radius:20px;border:1.5px solid;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;}
.tbar{display:flex;background:#f1f5f9;border-radius:12px;padding:3px;gap:2px;margin-bottom:14px;}
.tbtn{flex:1;border:none;border-radius:10px;padding:9px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s;background:transparent;color:#64748b;}
.tbtn.on{background:#fff;color:#1c1c1e;box-shadow:0 1px 3px rgba(0,0,0,.1);}
.moo{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;z-index:1000;}
.mosh{background:#fff;border-radius:24px 24px 0 0;padding:20px 20px 34px;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;}
.mohdl{width:36px;height:4px;background:#d1d1d6;border-radius:40px;margin:0 auto 16px;}
@media(min-width:600px){.moo{align-items:center;}.mosh{border-radius:24px;max-height:80vh;}}
.aopt{width:100%;padding:10px 14px;border-radius:12px;border:1.5px solid #e2e8f0;text-align:left;background:#fff;cursor:pointer;font-family:inherit;transition:all .15s;}
.aopt.on{border-color:#2563eb;background:#eff6ff;}
.chart-container{min-height:200px;width:100%;margin:8px 0;}
`;

// ─── Ring Chart ─────────────────────────────────────────────────────────
function Ring({ pct, size = 112, sw = 11, color = '#30d158' }: { pct: number; size?: number; sw?: number; color?: string }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, d = Math.min(pct / 100, 1) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={c} strokeDashoffset={c - d} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

// ─── Food Modal (mit lokalen Vorschlägen) ───────────────────────────────
function FoodModal({ onClose, onSave }: { onClose: () => void; onSave: (e: Omit<FoodEntry, 'id'>) => void }) {
  const [tab, setTab] = useState<'manual' | 'voice' | 'photo'>('manual');
  const [name, setName] = useState('');
  const [cals, setCals] = useState('');
  const [time, setTime] = useState(nt());
  const [listening, setListening] = useState(false);
  const [localSuggestion, setLocalSuggestion] = useState<{ calories: number; explanation: string } | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [photoPrev, setPhotoPrev] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoRes, setPhotoRes] = useState<{ name: string; calories: number; explanation: string } | null>(null);
  const [photoExp, setPhotoExp] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tmr = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tmr.current) clearTimeout(tmr.current);
    if (!name.trim() || tab !== 'manual') { setLocalSuggestion(null); return; }
    tmr.current = setTimeout(() => {
      const parsed = parseFoodAndWeight(name);
      if (parsed.food && parsed.caloriesPer100g) {
        const cal = calculateCalories(parsed.food, parsed.weight, parsed.caloriesPer100g);
        const weightText = parsed.weight ? `${parsed.weight}g` : '100g';
        setLocalSuggestion({
          calories: cal,
          explanation: `${parsed.food} (${weightText}) ≈ ${cal} kcal`
        });
      } else {
        setLocalSuggestion(null);
      }
    }, 300);
    return () => { if (tmr.current) clearTimeout(tmr.current); };
  }, [name, tab]);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Keine Spracheingabe verfügbar'); return; }
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setListening(true); rec.onend = () => setListening(false);
    rec.onresult = async (e: any) => {
      const text: string = e.results[0][0].transcript;
      const cm = text.match(/(\d+)\s*(?:kalorien|kcal|cal)/i), nm = text.match(/(\d{2,4})/);
      const cal = cm ? parseInt(cm[1]) : nm ? parseInt(nm[1]) : 0;
      const cleaned = text.replace(/(\d+)\s*(?:kalorien|kcal|cal)?/gi, '').replace(/\s+/g, ' ').trim() || text;
      setName(cleaned);
      if (cal > 0) setCals(String(cal));
    };
    rec.onerror = () => setListening(false); rec.start();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { const d = ev.target?.result as string; setPhotoPrev(d); setPhotoB64(d.split(',')[1]); setPhotoRes(null); };
    reader.readAsDataURL(f);
  };

  const doAnalyze = async () => { if (!photoB64) return; setAnalyzing(true); /* KI optional */ setAnalyzing(false); };
  const acceptSuggestion = () => { if (localSuggestion) setCals(String(localSuggestion.calories)); };

  const save = () => {
    const cal = parseInt(cals);
    if (!name.trim() || isNaN(cal) || cal <= 0) { alert('Bitte Name und Kalorien eingeben.'); return; }
    onSave({ date: td(), time, name: name.trim(), calories: cal, source: tab, photoPreview: tab === 'photo' ? (photoPrev ?? undefined) : undefined });
    onClose();
  };

  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Mahlzeit eintragen</span>
          <button className="bic" style={{ width: 34, height: 34 }} onClick={onClose}><X size={15} /></button>
        </div>
        <div className="tbar">
          {(['manual', 'voice', 'photo'] as const).map(t => (
            <button key={t} className={`tbtn ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t === 'manual' && <><UtensilsCrossed size={13} />Tippen</>}
              {t === 'voice' && <><Mic size={13} />Sprache</>}
              {t === 'photo' && <><Camera size={13} />Foto</>}
            </button>
          ))}
        </div>

        {tab === 'voice' && (
          <div style={{ background: '#f1f5f9', borderRadius: 14, padding: '14px', marginBottom: 12, textAlign: 'center' }}>
            <button className={`bic ${listening ? 'rec' : ''}`} style={{ width: 52, height: 52, borderRadius: 26, margin: '0 auto 8px' }} onClick={startVoice}><Mic size={22} /></button>
            <p style={{ fontSize: 12, color: '#64748b' }}>z.B. <b>„Apfel"</b> oder <b>„Pizza 600 Kalorien"</b></p>
          </div>
        )}

        {(tab === 'manual' || tab === 'voice') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><label className="lbl">Bezeichnung</label><input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder={tab === 'manual' ? 'z.B. Apfel 150g' : 'Erkannter Text…'} /></div>
            {localSuggestion && (
              <div className="aibox">
                <Sparkles size={15} color="#15803d" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div className="aical">{localSuggestion.calories} kcal</div>
                  <button onClick={() => setShowExp(!showExp)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div className="aiexp" style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{showExp ? localSuggestion.explanation : '▸ Schätzung anzeigen'}</div>
                  </button>
                </div>
                <button className="bg" style={{ height: 32, padding: '0 12px', fontSize: 12 }} onClick={acceptSuggestion}>Übernehmen</button>
              </div>
            )}
            <div><label className="lbl">Kalorien (kcal)</label><input className="inp" type="number" value={cals} onChange={e => setCals(e.target.value)} placeholder="Eingeben oder Vorschlag übernehmen" min={1} /></div>
            <div><label className="lbl">Uhrzeit</label><input className="inp" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>
        )}

        {tab === 'photo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
              {photoPrev ? <img src={photoPrev} alt="" style={{ maxHeight: 190, borderRadius: 10, objectFit: 'cover', maxWidth: '100%' }} />
                : <><Camera size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} /><p style={{ fontSize: 13, color: '#64748b' }}>Foto aufnehmen oder auswählen</p></>}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
            </div>
            {photoPrev && !photoRes && <button className="bp" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={doAnalyze} disabled={analyzing}>{analyzing ? <><Loader2 size={15} className="spin" />KI analysiert…</> : <><Sparkles size={15} />Foto analysieren</>}</button>}
            {photoRes && (
              <div className="aibox" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={15} color="#15803d" />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{photoRes.name}</div><div className="aical">{photoRes.calories} kcal</div></div>
                  <button className="bg" style={{ height: 32, padding: '0 12px', fontSize: 12 }} onClick={() => { setName(photoRes.name); setCals(String(photoRes.calories)); }}>Übernehmen</button>
                </div>
                <button onClick={() => setPhotoExp(!photoExp)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}><div className="aiexp" style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{photoExp ? photoRes.explanation : '▸ Schätzung anzeigen'}</div></button>
              </div>
            )}
            {(name || parseInt(cals) > 0) && <>
              <div><label className="lbl">Bezeichnung</label><input className="inp" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><label className="lbl">Kalorien (kcal)</label><input className="inp" type="number" value={cals} onChange={e => setCals(e.target.value)} /></div>
              <div><label className="lbl">Uhrzeit</label><input className="inp" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
            </>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={save} style={{ flex: 2, justifyContent: 'center', height: 44 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Modal ─────────────────────────────────────────────────────
function ActivityMo({ weight, onClose, onSave }: { weight: number; onClose: () => void; onSave: (a: Omit<ActivityEntry, 'id'>) => void }) {
  const [sport, setSport] = useState(SPORTS[0]);
  const [dur, setDur] = useState(30);
  const [custom, setCustom] = useState(false);
  const [cMet, setCMet] = useState('');
  const met = custom ? parseFloat(cMet) || 0 : sport.met;
  const cal = Math.round(met * weight * (dur / 60));
  const save = () => { if (!met || dur <= 0) return; onSave({ date: td(), sport: custom ? `Custom (MET ${met})` : sport.name, durationMinutes: dur, caloriesBurned: cal, met }); onClose(); };
  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Aktivität eintragen</span>
          <button className="bic" style={{ width: 34, height: 34 }} onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="lbl">Sportart</label>
            <select className="sel" value={sport.name} disabled={custom} onChange={e => { const s = SPORTS.find(x => x.name === e.target.value); if (s) setSport(s); }}>
              {SPORTS.map(s => <option key={s.name}>{s.name} (MET {s.met})</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)} />Eigener MET-Wert
              {custom && <input className="inp" type="number" step=".1" value={cMet} onChange={e => setCMet(e.target.value)} placeholder="z.B. 6.5" style={{ width: 90, height: 36 }} />}
            </label>
          </div>
          <div><label className="lbl">Dauer (Minuten)</label><input className="inp" type="number" value={dur} onChange={e => setDur(Math.max(1, parseInt(e.target.value) || 0))} min={1} /></div>
          <div style={{ background: '#f1f5f9', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>Verbrauch geschätzt</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{cal} <span style={{ fontSize: 13, fontWeight: 400 }}>kcal</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={save} style={{ flex: 2, justifyContent: 'center', height: 44 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Weight Modal ───────────────────────────────────────────────────────
function WeightMo({ onClose, onSave, cur }: { onClose: () => void; onSave: (w: number, d: string) => void; cur: number }) {
  const [w, setW] = useState(String(cur)); const [d, setD] = useState(td()); const [listening, setListening] = useState(false);
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) return;
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setListening(true); rec.onend = () => setListening(false);
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; const m = t.match(/(\d+)[,.](\d+)/); const v = m ? parseFloat(m[1] + '.' + m[2]) : parseFloat(t.match(/(\d+)/)?.[1] || '0'); if (v > 0 && v < 300) setW(String(v)); };
    rec.onerror = () => setListening(false); rec.start();
  };
  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Gewicht eintragen</span>
          <button className="bic" style={{ width: 34, height: 34 }} onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="lbl">Datum</label><input className="inp" type="date" value={d} onChange={e => setD(e.target.value)} /></div>
          <div><label className="lbl">Gewicht (kg)</label>
            <div style={{ display: 'flex', gap: 8 }}><input className="inp" type="number" step=".1" value={w} onChange={e => setW(e.target.value)} style={{ flex: 1 }} />
              <button className={`bic ${listening ? 'rec' : ''}`} onClick={startVoice}><Mic size={16} /></button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={() => { const v = parseFloat(w); if (v > 0 && v < 300) { onSave(v, d); onClose(); } }} style={{ flex: 2, justifyContent: 'center', height: 44 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ─── Bluetooth‑Waage Modal (Demo) ───────────────────────────────────────
function BluetoothScaleModal({ onClose, onWeightRead }: { onClose: () => void; onWeightRead: (weight: number) => void }) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'connected' | 'reading' | 'error'>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const startScan = () => {
    setStatus('scanning');
    setTimeout(() => {
      if (navigator.bluetooth && navigator.bluetooth.requestDevice) {
        setDeviceName('Smart Scale X1');
        setStatus('connected');
      } else {
        setDeviceName('Demo‑Waage (simuliert)');
        setStatus('connected');
      }
    }, 1500);
  };

  const readWeight = () => {
    setStatus('reading');
    setTimeout(() => {
      const simulatedWeight = +(Math.random() * 70 + 50).toFixed(1);
      onWeightRead(simulatedWeight);
      onClose();
    }, 1000);
  };

  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Bluetooth‑Waage verbinden</span>
          <button className="bic" style={{ width: 34, height: 34 }} onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {status === 'idle' && (
            <button className="bp" onClick={startScan} style={{ justifyContent: 'center', height: 48 }}>
              <Bluetooth size={18} /> Gerät suchen
            </button>
          )}
          {status === 'scanning' && (
            <div style={{ textAlign: 'center' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
              <p>Suche nach Waagen...</p>
            </div>
          )}
          {status === 'connected' && (
            <>
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <Bluetooth size={20} color="#15803d" style={{ margin: '0 auto 8px' }} />
                <p>Verbunden mit <strong>{deviceName}</strong></p>
              </div>
              <button className="bp" onClick={readWeight} style={{ justifyContent: 'center' }}>
                <Scale size={16} /> Gewicht abrufen
              </button>
            </>
          )}
          {status === 'reading' && (
            <div style={{ textAlign: 'center' }}>
              <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
              <p>Lese Gewicht...</p>
            </div>
          )}
          {status === 'error' && (
            <div style={{ background: '#fef2f2', borderRadius: 12, padding: 12, textAlign: 'center', color: '#dc2626' }}>
              Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.
            </div>
          )}
          <button className="bg" onClick={onClose} style={{ justifyContent: 'center' }}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

// ─── Smartwatch‑Import Modal ────────────────────────────────────────────
function SmartwatchImportModal({ onClose, onImport }: { onClose: () => void; onImport: (activities: Omit<ActivityEntry, 'id'>[]) => void }) {
  const [importType, setImportType] = useState<'manual' | 'csv'>('manual');
  const [steps, setSteps] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleManualImport = () => {
    const stepsNum = parseInt(steps);
    const hr = parseInt(heartRate);
    const cal = parseInt(calories);
    if (isNaN(stepsNum) && isNaN(hr) && isNaN(cal)) {
      alert('Bitte mindestens einen Wert eingeben (Schritte, Puls oder Kalorien).');
      return;
    }
    const activity: Omit<ActivityEntry, 'id'> = {
      date: td(),
      sport: `Smartwatch‑Daten`,
      durationMinutes: 0,
      caloriesBurned: cal,
      met: 0,
    };
    if (stepsNum > 0 && cal === 0) {
      const estimatedCal = Math.round(stepsNum * 0.04);
      activity.caloriesBurned = estimatedCal;
      activity.sport = `${stepsNum} Schritte (≈ ${estimatedCal} kcal)`;
    }
    if (hr > 0) activity.sport += `, Puls ${hr}`;
    onImport([activity]);
    onClose();
  };

  const handleCsvUpload = () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1);
      const activities: Omit<ActivityEntry, 'id'>[] = [];
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const date = parts[0].trim();
          const sport = parts[1].trim();
          const duration = parseInt(parts[2].trim());
          const kcal = parseInt(parts[3].trim());
          if (!isNaN(duration) && !isNaN(kcal) && date.length === 10) {
            activities.push({ date, sport, durationMinutes: duration, caloriesBurned: kcal, met: 0 });
          }
        }
      }
      onImport(activities);
      onClose();
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Aktivitäten importieren (Smartwatch)</span>
          <button className="bic" style={{ width: 34, height: 34 }} onClick={onClose}><X size={15} /></button>
        </div>
        <div className="tbar" style={{ marginBottom: 16 }}>
          <button className={`tbtn ${importType === 'manual' ? 'on' : ''}`} onClick={() => setImportType('manual')}>Manuell</button>
          <button className={`tbtn ${importType === 'csv' ? 'on' : ''}`} onClick={() => setImportType('csv')}>CSV‑Import</button>
        </div>

        {importType === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label className="lbl">Schritte (optional)</label><input className="inp" type="number" value={steps} onChange={e => setSteps(e.target.value)} placeholder="z.B. 8500" /></div>
            <div><label className="lbl">Durchschnittlicher Puls (optional)</label><input className="inp" type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} placeholder="z.B. 120" /></div>
            <div><label className="lbl">Verbrannte Kalorien (optional)</label><input className="inp" type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="z.B. 350" /></div>
            <button className="bp" onClick={handleManualImport} style={{ justifyContent: 'center' }}>Importieren</button>
          </div>
        )}

        {importType === 'csv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
              {csvFile ? <><Check size={24} color="#16a34a" /><p>{csvFile.name}</p></> : <><Upload size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} /><p style={{ fontSize: 13, color: '#64748b' }}>CSV‑Datei auswählen (Datum,Aktivität,Dauer,kcal)</p></>}
              <input ref={fileRef} type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </div>
            <button className="bp" onClick={handleCsvUpload} disabled={!csvFile} style={{ justifyContent: 'center' }}>Importieren</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hauptkomponente ────────────────────────────────────────────────────
export default function CaloriePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({ age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' });
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalMode, setGoalMode] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [showFood, setShowFood] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  const [showActHist, setShowActHist] = useState(false);
  const [showFoodHist, setShowFoodHist] = useState(false);
  const [showWChart, setShowWChart] = useState(false);
  const [weightStartDate, setWeightStartDate] = useState<string>(() => {
    const saved = ls.get(SK.ws);
    return saved || fd(new Date(Date.now() - 90 * 86400000));
  });
  const [weightRangeMode, setWeightRangeMode] = useState<'custom' | 'last7'>('custom');
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);

  useEffect(() => { ls.set(SK.ws, weightStartDate); }, [weightStartDate]);

  const calcBMR = (p: UserProfile) => p.gender === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const compute = useCallback((p: UserProfile) => {
    const bmr = Math.round(calcBMR(p)), tdee = Math.round(bmr * ACT_MULT[p.activityLevel].value);
    setResult({ bmr, tdee, goalCalories: { lose: Math.round(tdee * 0.8), maintain: tdee, gain: Math.round(tdee * 1.15) } });
  }, []);

  useEffect(() => {
    const sp = ls.get(SK.p); if (sp) { try { const p = JSON.parse(sp); setProfile(p); compute(p); setSaved(true); } catch {} } else compute(profile);
    const sg = ls.get(SK.g); if (sg) setGoalMode(sg as any);
    try { const sw = ls.get(SK.w); if (sw) setWeightEntries(JSON.parse(sw)); } catch {}
    try { const sa = ls.get(SK.a); if (sa) setActivities(JSON.parse(sa)); } catch {}
    try { const sf = ls.get(SK.f); if (sf) setFoodEntries(JSON.parse(sf)); } catch {}
  }, []);

  useEffect(() => { ls.set(SK.w, JSON.stringify(weightEntries)); }, [weightEntries]);
  useEffect(() => { ls.set(SK.a, JSON.stringify(activities)); }, [activities]);
  useEffect(() => { ls.set(SK.f, JSON.stringify(foodEntries)); }, [foodEntries]);
  useEffect(() => { ls.set(SK.g, goalMode); }, [goalMode]);

  const upd = (f: keyof UserProfile, v: any) => { const u = { ...profile, [f]: v }; setProfile(u); compute(u); setSaved(false); };
  const saveP = () => { ls.set(SK.p, JSON.stringify(profile)); setSaved(true); };
  const resetP = () => { const d: UserProfile = { age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' }; setProfile(d); compute(d); ls.del(SK.p); setSaved(false); };
  const saveW = (w: number, date: string) => { setWeightEntries(prev => [...prev.filter(e => e.date !== date), { id: Date.now().toString(), date, weight: w, source: 'manual' }].sort((a, b) => a.date.localeCompare(b.date))); upd('weight', w); };
  const addAct = (a: Omit<ActivityEntry, 'id'>) => setActivities(p => [{ id: Date.now().toString(), ...a }, ...p]);
  const delAct = (id: string) => setActivities(p => p.filter(a => a.id !== id));
  const addFood = (e: Omit<FoodEntry, 'id'>) => setFoodEntries(p => [{ id: Date.now().toString(), ...e }, ...p]);
  const delFood = (id: string) => setFoodEntries(p => p.filter(e => e.id !== id));
  const handleScaleWeight = (w: number) => { saveW(w, td()); alert(`Gewicht ${w} kg von Waage übernommen.`); };
  const handleWatchImport = (newActivities: Omit<ActivityEntry, 'id'>[]) => { newActivities.forEach(act => addAct(act)); alert(`${newActivities.length} Aktivität(en) importiert.`); };

  const today = td();
  const tFood = foodEntries.filter(e => e.date === today);
  const tActs = activities.filter(a => a.date === today);
  const consumed = tFood.reduce((s, e) => s + e.calories, 0);
  const burned = tActs.reduce((s, a) => s + a.caloriesBurned, 0);
  const target = result?.goalCalories[goalMode] ?? 2000;
  const remaining = Math.max(target - consumed + burned, 0);
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  const ringCol = pct > 100 ? '#ff3b30' : pct > 85 ? '#ff9500' : '#30d158';

  const bmi = getBMI(profile.weight, profile.height);
  const bmiCategory = getBMICategory(bmi);
  const ideal = idealWeight(profile.height);
  const bmiPct = Math.min(Math.max(((bmi - 15) / 30) * 100, 0), 100);
  const overBy = profile.weight > ideal.hi ? +(profile.weight - ideal.hi).toFixed(1) : 0;
  const underBy = profile.weight < ideal.lo ? +(ideal.lo - profile.weight).toFixed(1) : 0;

  const weightDiff = getWeightDifference(weightEntries);
  const trendIcon = weightDiff.diff > 0 ? '📈' : weightDiff.diff < 0 ? '📉' : '➖';
  const trendText = weightDiff.diff > 0 ? 'zugenommen' : weightDiff.diff < 0 ? 'abgenommen' : 'stabil';
  const trendColor = weightDiff.diff > 0 ? '#dc2626' : weightDiff.diff < 0 ? '#16a34a' : '#64748b';

  const getWeightChartData = () => {
    let start = weightStartDate;
    if (weightRangeMode === 'last7') {
      const sevenDaysAgo = fd(new Date(Date.now() - 7 * 86400000));
      start = sevenDaysAgo;
    }
    return weightEntries
      .filter(e => e.date >= start && e.date <= today)
      .map(e => ({ date: e.date.slice(5), weight: e.weight }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  const weightChartData = getWeightChartData();
  const fullWeightChart = weightEntries.map(e => ({ date: e.date.slice(5), weight: e.weight })).sort((a, b) => a.date.localeCompare(b.date));
  const last7Data = Array.from({ length: 7 }, (_, i) => {
    const dt = fd(new Date(Date.now() - (6 - i) * 86400000));
    return { d: dt.slice(5), eat: foodEntries.filter(e => e.date === dt).reduce((s, e) => s + e.calories, 0), burn: activities.filter(a => a.date === dt).reduce((s, a) => s + a.caloriesBurned, 0) };
  });
  const srcIco = (s: FoodEntry['source']) => s === 'voice' ? '🎤' : s === 'photo' ? '📸' : '⌨️';

  return (
    <>
      <style>{GS}</style>
      <div className="cp">
        <div className="hdr">
          <div className="hdr-r">
            <div className="hdr-logo">
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 0 }}><ArrowLeft size={20} /></button>
              FamilyHub
            </div>
            <div className="hdr-badge"><Flame size={13} />Kalorien & Fitness</div>
          </div>
        </div>

        <div className="main">
          <div className="card-grid">

            {/* Meine Daten (einklappbar) */}
            <div className="sw">
              <button className="stgl" onClick={() => setSettingsOpen(!settingsOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings size={14} color="#64748b" />
                  <span>Meine Daten</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: saved ? '#f0fdf4' : '#fffbeb', color: saved ? '#16a34a' : '#d97706', border: `1px solid ${saved ? '#bbf7d0' : '#fde68a'}` }}>
                    {saved ? 'gespeichert' : 'nicht gespeichert'}
                  </span>
                </div>
                {settingsOpen ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
              </button>
              {settingsOpen && (
                <div className="sbody">
                  <div className="g2">
                    <div><label className="lbl">Alter</label><input className="inp" type="number" value={profile.age} onChange={e => upd('age', parseInt(e.target.value) || 0)} min={15} max={100} /></div>
                    <div><label className="lbl">Geschlecht</label><select className="sel" value={profile.gender} onChange={e => upd('gender', e.target.value)}><option value="male">Männlich</option><option value="female">Weiblich</option></select></div>
                    <div><label className="lbl">Gewicht (kg)</label><input className="inp" type="number" step=".1" value={profile.weight} onChange={e => upd('weight', parseFloat(e.target.value) || 0)} /></div>
                    <div><label className="lbl">Größe (cm)</label><input className="inp" type="number" value={profile.height} onChange={e => upd('height', parseInt(e.target.value) || 0)} /></div>
                  </div>
                  <div>
                    <label className="lbl" style={{ marginBottom: 8 }}>Aktivitätslevel</label>
                    {(Object.keys(ACT_MULT) as UserProfile['activityLevel'][]).map(lv => (
                      <button key={lv} className={`aopt ${profile.activityLevel === lv ? 'on' : ''}`} style={{ marginBottom: 5 }} onClick={() => upd('activityLevel', lv)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div><span style={{ fontSize: 13, fontWeight: 500 }}>{ACT_MULT[lv].label}</span><span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{ACT_MULT[lv].desc}</span></div>
                          <span style={{ fontSize: 11, color: profile.activityLevel === lv ? '#2563eb' : '#94a3b8' }}>×{ACT_MULT[lv].value}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {result && <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#64748b', display: 'flex', gap: 16 }}><span><b style={{ color: '#1e293b' }}>BMR</b> {result.bmr} kcal</span><span><b style={{ color: '#1e293b' }}>TDEE</b> {result.tdee} kcal</span></div>}
                  <div style={{ display: 'flex', gap: 8 }}><button className="bp" onClick={saveP} disabled={saved} style={{ flex: 1, justifyContent: 'center', height: 40 }}><Save size={13} />{saved ? 'Gespeichert' : 'Speichern'}</button><button className="bg" onClick={resetP}><RotateCcw size={13} />Reset</button></div>
                </div>
              )}
            </div>

            {/* Ring + Tagesbilanz */}
            {result && (
              <div className="card-dk">
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {(['lose', 'maintain', 'gain'] as const).map(k => (
                    <button key={k} className="gc" onClick={() => setGoalMode(k)} style={{ borderColor: goalMode === k ? '#fff' : 'rgba(255,255,255,.3)', background: goalMode === k ? '#fff' : 'transparent', color: goalMode === k ? '#1e3a5f' : 'rgba(255,255,255,.85)' }}>
                      {k === 'lose' ? 'Abnehmen' : k === 'maintain' ? 'Halten' : 'Zunehmen'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div className="rw"><Ring pct={pct} color={ringCol} /><div className="ri"><span style={{ fontSize: 21, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{consumed}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>gegessen</span></div></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{remaining}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{remaining > 0 ? 'kcal noch frei' : '🎯 Ziel erreicht!'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Ziel {target} · Verbrannt +{burned}</div><div style={{ marginTop: 10, background: 'rgba(255,255,255,.2)', borderRadius: 40, height: 5, overflow: 'hidden' }}><div style={{ height: 5, borderRadius: 40, background: ringCol, width: `${Math.min(pct, 100)}%`, transition: 'width .6s' }} /></div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
                  {[{ val: consumed, lbl: 'Gegessen', col: '#ffd60a' }, { val: burned, lbl: 'Verbrannt', col: '#30d158' }, { val: result.goalCalories[goalMode], lbl: 'Tagesziel', col: 'rgba(255,255,255,.7)' }].map(({ val, lbl, col }) => (
                    <div key={lbl} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: col }}>{val}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{lbl}</div></div>
                  ))}
                </div>
              </div>
            )}

            {/* Mahlzeiten heute */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div className="slbl" style={{ margin: 0 }}><UtensilsCrossed size={12} />Mahlzeiten heute</div><button className="bp" onClick={() => setShowFood(true)}><Plus size={13} />Eintragen</button></div>
              {tFood.length === 0 ? <div style={{ textAlign: 'center', padding: '18px 0', color: '#94a3b8' }}><Coffee size={24} style={{ margin: '0 auto 6px' }} /><div style={{ fontSize: 13 }}>Noch nichts gegessen?</div><div style={{ fontSize: 11, marginTop: 3 }}>Tippen · Sprechen · Fotografieren</div></div>
                : tFood.map(e => (
                  <div key={e.id} className="frow">
                    {e.photoPreview ? <img src={e.photoPreview} alt="" className="fthumb" /> : <div className="fico">{srcIco(e.source)}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div><div style={{ fontSize: 11, color: '#64748b' }}>{e.time}</div></div>
                    <span style={{ fontSize: 15, fontWeight: 700, marginRight: 8 }}>{e.calories}</span>
                    <button className="bdel" onClick={() => delFood(e.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              {tFood.length > 0 && <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#64748b' }}>{tFood.length} Mahlzeit{tFood.length > 1 ? 'en' : ''}</span><span style={{ fontWeight: 700 }}>{consumed} kcal</span></div>}
            </div>

            {/* Aktivitäten heute */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="slbl" style={{ margin: 0 }}><Dumbbell size={12} />Aktivitäten heute</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="bp" onClick={() => setShowActivity(true)}><Plus size={13} />Eintragen</button>
                  <button className="bic" onClick={() => setShowWatchModal(true)} title="Von Smartwatch importieren"><Activity size={16} /></button>
                </div>
              </div>
              {tActs.length === 0 ? <div style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontSize: 13 }}>Noch keine Aktivität</div>
                : tActs.map(a => (
                  <div key={a.id} className="frow">
                    <div className="fico"><Timer size={15} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{a.sport}</div><div style={{ fontSize: 11, color: '#64748b' }}>{a.durationMinutes} min</div></div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#30d158', marginRight: 8 }}>−{a.caloriesBurned}</span>
                    <button className="bdel" onClick={() => delAct(a.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              <button className="bg" onClick={() => setShowActHist(!showActHist)} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>{showActHist ? <ChevronUp size={13} /> : <ChevronDown size={13} />}Verlauf</button>
              {showActHist && activities.slice(0, 12).map(a => (
                <div key={a.id} className="erow"><div style={{ display: 'flex', gap: 8, flex: 1 }}><span style={{ color: '#64748b', width: 70 }}>{a.date}</span><span style={{ flex: 1 }}>{a.sport}</span><span style={{ color: '#64748b' }}>{a.durationMinutes} min</span></div><span style={{ color: '#30d158', fontWeight: 600, marginRight: 8 }}>{a.caloriesBurned}</span><button className="bdel" onClick={() => delAct(a.id)}><Trash2 size={13} /></button></div>
              ))}
            </div>

            {/* 7-Tage-Verlauf + Gewichtstrend */}
            <div className="card">
              <div className="slbl"><TrendingUp size={12} />Verlauf & Gewichtstrend</div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Data} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #f1f5f9' }} />
                    <Bar dataKey="eat" fill="#1e3a5f" name="Gegessen" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="burn" fill="#30d158" name="Verbrannt" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {fullWeightChart.length > 1 && (
                <>
                  <div className="slbl" style={{ marginTop: 12 }}><Scale size={12} />Gewichtsentwicklung (Start → heute)</div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fullWeightChart} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis domain={['auto', 'auto']} unit=" kg" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip formatter={v => `${v} kg`} contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #f1f5f9' }} />
                        <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Gewicht" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Von {weightDiff.startWeight} kg → {weightDiff.currentWeight} kg</span>
                      <div style={{ fontSize: 18, fontWeight: 700, color: trendColor, marginTop: 4 }}>
                        {trendIcon} {Math.abs(weightDiff.diff).toFixed(1)} kg {trendText}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>pro Woche</span>
                      <div style={{ fontSize: 16, fontWeight: 600, color: trendColor }}>
                        {Math.abs(weightDiff.weeklyRate).toFixed(1)} kg/Woche
                      </div>
                    </div>
                  </div>
                </>
              )}
              {fullWeightChart.length <= 1 && (
                <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  Mindestens zwei Gewichtseinträge für Trendanzeige nötig.
                </p>
              )}
              <button className="bg" onClick={() => setShowFoodHist(!showFoodHist)} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                {showFoodHist ? <ChevronUp size={13} /> : <ChevronDown size={13} />}Alle Mahlzeiten
              </button>
              {showFoodHist && foodEntries.slice(0, 20).map(e => (
                <div key={e.id} className="erow"><span style={{ color: '#64748b', width: 62 }}>{e.date}</span><span style={{ width: 40, color: '#64748b' }}>{e.time}</span><span style={{ width: 22 }}>{srcIco(e.source)}</span><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span><span style={{ fontWeight: 600, marginRight: 8, color: '#f59e0b' }}>{e.calories}</span><button className="bdel" onClick={() => delFood(e.id)}><Trash2 size={13} /></button></div>
              ))}
            </div>

            {/* Gewicht & Körper */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div className="slbl" style={{ margin: 0 }}><Scale size={12} />Gewicht & Körper</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="bp" onClick={() => setShowWeight(true)}><Plus size={13} />Eintragen</button>
                  <button className="bic" onClick={() => setShowScaleModal(true)} title="Bluetooth‑Waage"><Bluetooth size={16} /></button>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}><div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{profile.weight} <span style={{ fontSize: 20, fontWeight: 400 }}>kg</span></div><div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>BMI {bmi.toFixed(1)} · <span style={{ color: bmiCategory.color, fontWeight: 600 }}>{bmiCategory.label}</span></div></div>
              <div className="bmibar"><div className="bmipip" style={{ left: `${bmiPct}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4, marginBottom: 14 }}><span>Untergewicht</span><span>Normal</span><span>Übergewicht</span><span>Adipositas</span></div>
              <div className="g2">
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 14, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={11} />Idealgewicht</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0c4a6e' }}>{ideal.lo}–{ideal.hi} kg</div><div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>BMI 18,5–24,9</div></div>
                {overBy > 0 ? <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#c2410c', fontWeight: 600, marginBottom: 4 }}>Bis Idealgewicht</div><div style={{ fontSize: 28, fontWeight: 700, color: '#9a3412' }}>{overBy} kg</div><div style={{ fontSize: 11, color: '#c2410c' }}>abzunehmen</div></div>
                  : underBy > 0 ? <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, marginBottom: 4 }}>Bis Normalgewicht</div><div style={{ fontSize: 22, fontWeight: 700, color: '#1e40af' }}>{underBy} kg</div><div style={{ fontSize: 11, color: '#1d4ed8' }}>zuzunehmen</div></div>
                  : <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}><div style={{ fontSize: 24 }}>🎯</div><div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginTop: 4 }}>Idealgewicht!</div></div>}
              </div>

              {/* Zeitraum-Auswahl für Gewichtsverlauf */}
              <div style={{ marginTop: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className={`bg ${weightRangeMode === 'last7' ? 'bp' : 'bg'}`} style={{ padding: '0 12px', height: 36 }} onClick={() => setWeightRangeMode('last7')}>Letzte 7 Tage</button>
                  <button className={`bg ${weightRangeMode === 'custom' ? 'bp' : 'bg'}`} style={{ padding: '0 12px', height: 36 }} onClick={() => setWeightRangeMode('custom')}>Individuell</button>
                  {weightRangeMode === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <CalendarIcon size={16} color="#64748b" />
                      <input type="date" className="inp" value={weightStartDate} onChange={e => setWeightStartDate(e.target.value)} style={{ height: 36, flex: 1 }} />
                    </div>
                  )}
                </div>
              </div>

              {weightChartData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={['auto', 'auto']} unit=" kg" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip formatter={v => `${v} kg`} contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #f1f5f9' }} />
                      <Line type="monotone" dataKey="weight" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} name="Gewicht" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Keine Gewichtsdaten im ausgewählten Zeitraum.</p>
              )}
              <button className="bg" onClick={() => setShowWChart(!showWChart)} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                {showWChart ? <ChevronUp size={13} /> : <ChevronDown size={13} />}Alle Gewichtseinträge
              </button>
              {showWChart && weightEntries.slice().reverse().slice(0, 8).map(e => (
                <div key={e.id} className="erow"><div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#64748b' }}>{e.date}</span><span style={{ fontWeight: 600 }}>{e.weight} kg</span></div><button className="bdel" onClick={() => setWeightEntries(p => p.filter(w => w.id !== e.id))}><Trash2 size={13} /></button></div>
              ))}
            </div>

            {/* Kalorienziele */}
            {result && (
              <div className="card">
                <div className="slbl"><Calculator size={12} />Kalorienziele</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(['lose', 'maintain', 'gain'] as const).map(k => (
                    <button key={k} onClick={() => setGoalMode(k)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${goalMode === k ? '#2563eb' : '#e2e8f0'}`, background: goalMode === k ? '#eff6ff' : '#fafafa', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ textAlign: 'left' }}><div style={{ fontSize: 14, fontWeight: 500 }}>{k === 'lose' ? 'Abnehmen' : k === 'maintain' ? 'Halten' : 'Zunehmen'}</div><div style={{ fontSize: 11, color: '#64748b' }}>{k === 'lose' ? '~0,5 kg/Woche' : k === 'maintain' ? 'Erhaltung' : '~0,5 kg/Woche'}</div></div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: k === 'lose' ? '#1e3a5f' : k === 'maintain' ? '#1c1c1e' : '#16a34a' }}>{result.goalCalories[k]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showFood && <FoodModal onClose={() => setShowFood(false)} onSave={addFood} />}
      {showActivity && <ActivityMo weight={profile.weight} onClose={() => setShowActivity(false)} onSave={addAct} />}
      {showWeight && <WeightMo onClose={() => setShowWeight(false)} onSave={saveW} cur={profile.weight} />}
      {showScaleModal && <BluetoothScaleModal onClose={() => setShowScaleModal(false)} onWeightRead={handleScaleWeight} />}
      {showWatchModal && <SmartwatchImportModal onClose={() => setShowWatchModal(false)} onImport={handleWatchImport} />}
    </>
  );
}