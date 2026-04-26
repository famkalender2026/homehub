'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Save, RotateCcw, ArrowLeft, Plus, Mic, Scale, Bluetooth, Trash2,
  TrendingUp, Dumbbell, Timer, Coffee, Camera, Upload, Check,
  UtensilsCrossed, ChevronDown, ChevronUp, X, Loader2, Settings,
  Sparkles, Heart, Activity, CalendarIcon, Edit2, Target, Info,
  Footprints, Bike, Droplets, Zap, Sun, Moon, Apple, Salad, Egg, Fish, Beef, Wheat, Milk, BatteryCharging,
  Music, RefreshCw, Star, BookOpen
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, Area, AreaChart
} from 'recharts';

// ========== HILFSKOMPONENTEN FÜR CHARTS ==========
function ResponsiveLineChart({ data, height = 130, ...props }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      {width > 0 && (
        <LineChart width={width} height={height} data={data} {...props}>
          {props.children}
        </LineChart>
      )}
    </div>
  );
}

function ResponsiveBarChart({ data, height = 140, ...props }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      {width > 0 && (
        <BarChart width={width} height={height} data={data} {...props}>
          {props.children}
        </BarChart>
      )}
    </div>
  );
}

function ResponsiveAreaChart({ data, height = 55, ...props }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      {width > 0 && (
        <AreaChart width={width} height={height} data={data} {...props}>
          {props.children}
        </AreaChart>
      )}
    </div>
  );
}

// ========== VOICE-INPUT-KOMPONENTEN ==========
function VoiceNumberInput({ value, onChange, placeholder, className }: any) {
  const [listening, setListening] = useState(false);
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      const match = text.match(/(\d+)[,.]?(\d+)?/);
      if (match) {
        let num = parseFloat(match[0].replace(',', '.'));
        if (!isNaN(num)) onChange(num);
      }
    };
    rec.start();
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input className={className} type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
      <button type="button" className={`bic ${listening ? 'rec' : ''}`} onClick={startVoice}><Mic size={16} /></button>
    </div>
  );
}

function VoiceTextInput({ value, onChange, placeholder, className }: any) {
  const [listening, setListening] = useState(false);
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onChange(text);
    };
    rec.start();
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input className={className} type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
      <button type="button" className={`bic ${listening ? 'rec' : ''}`} onClick={startVoice}><Mic size={16} /></button>
    </div>
  );
}

// ==================== TYPEN ====================
interface UserProfile {
  age: number; gender: 'male' | 'female'; weight: number; height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}
interface CalorieResult { bmr: number; tdee: number; goalCalories: { lose: number; maintain: number; gain: number }; }
interface WeightEntry { id: string; date: string; weight: number; source: 'manual' | 'voice' | 'scale'; }
interface ActivityEntry { id: string; date: string; sport: string; durationMinutes: number; caloriesBurned: number; met: number; }
interface FoodEntry { id: string; date: string; time: string; name: string; calories: number; source: 'manual' | 'voice' | 'photo'; photoPreview?: string; }

interface Recipe {
  id: string;
  name: string;
  calories: number;
  explanation: string;
  ingredients: string[];
  instructions: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  isFavorite?: boolean;
}

// ==================== KONSTANTEN ====================
const SPORTS = [
  { name: 'Gehen (3 km/h)', met: 2.0, icon: Footprints },
  { name: 'Walking (5 km/h)', met: 3.5, icon: Footprints },
  { name: 'Joggen (8 km/h)', met: 8.0, icon: Activity },
  { name: 'Laufen (10 km/h)', met: 10.0, icon: Zap },
  { name: 'Radfahren (16 km/h)', met: 6.0, icon: Bike },
  { name: 'Radfahren (20 km/h)', met: 8.0, icon: Bike },
  { name: 'Schwimmen (moderat)', met: 7.0, icon: Droplets },
  { name: 'Yoga', met: 2.5, icon: Sun },
  { name: 'Krafttraining (leicht)', met: 3.5, icon: Dumbbell },
  { name: 'Krafttraining (intensiv)', met: 6.0, icon: Dumbbell },
  { name: 'HIIT', met: 8.0, icon: BatteryCharging },
  { name: 'Fußball', met: 7.0, icon: Activity },
  { name: 'Tanzen', met: 4.5, icon: Music },
];
const ACTIVITY_MULTIPLIERS: Record<UserProfile['activityLevel'], { value: number; label: string; desc: string }> = {
  sedentary: { value: 1.2, label: 'Sedentär', desc: 'Büroarbeit, wenig Bewegung' },
  light: { value: 1.375, label: 'Leicht aktiv', desc: 'Sport 1–3 Tage/Woche' },
  moderate: { value: 1.55, label: 'Mäßig aktiv', desc: 'Sport 3–5 Tage/Woche' },
  active: { value: 1.725, label: 'Aktiv', desc: 'Sport 6–7 Tage/Woche' },
  very_active: { value: 1.9, label: 'Sehr aktiv', desc: 'Körperl. Arbeit + Sport' },
};
const STORAGE_KEYS = {
  profile: 'familyhub_calorie_profile',
  weight: 'familyhub_weight_entries',
  activities: 'familyhub_activities',
  food: 'familyhub_food_entries',
  goal: 'familyhub_calorie_goal',
  weightStart: 'familyhub_weight_start_date',
  calorieLimitManual: 'familyhub_calorie_limit_manual',
  favoriteRecipes: 'familyhub_favorite_recipes'
};
const safeLS = {
  get: (k: string) => { try { return typeof window !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } },
  set: (k: string, v: string) => { try { if (typeof window !== 'undefined') localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { if (typeof window !== 'undefined') localStorage.removeItem(k); } catch {} },
};
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const todayStr = () => fmtDate(new Date());
const nowTime = () => new Date().toTimeString().slice(0, 5);

// ==================== LEBENSMITTEL-DATENBANK ====================
const foodDB: Record<string, number> = {
  buchweizen: 343, buchweizenmehl: 335, haferflocken: 371, hafer: 389,
  granola: 450, cornflakes: 378, dinkel: 338, dinkelmehl: 348,
  weizenmehl: 340, vollkornmehl: 320, roggenmehl: 325, amaranth: 371,
  quinoa: 120, hirse: 378, gerstengraupen: 352, bulgur: 83,
  couscous: 112, polenta: 72, müsli: 380,
  brot: 265, vollkornbrot: 247, toast: 300, brötchen: 280, toastbrot: 295,
  baguette: 275, ciabatta: 271, pumpernickel: 218, knäckebrot: 350, zwieback: 390,
  reis: 130, nudeln: 158, spaghetti: 158, pasta: 158, penne: 158,
  vollkornnudeln: 148, glasnudeln: 351, reisnudeln: 109,
  kartoffel: 77, kartoffeln: 77, süsskartoffel: 86, süßkartoffel: 86,
  linsen: 116, rotelinsen: 116, kichererbsen: 164,
  bohnen: 127, kidneybohnen: 127, erbsen: 81,
  sojabohnen: 173, edamame: 121, tofu: 76, tempeh: 193, hummus: 166,
  nüsse: 600, mandeln: 579, walnüsse: 654, cashews: 553, haselnüsse: 628,
  erdnüsse: 567, pistazien: 562, macadamia: 718,
  leinsamen: 534, chiasamen: 486, sonnenblumenkerne: 584, kürbiskerne: 559,
  sesam: 573, sesamkerne: 573, hanfsamen: 553, mohn: 525,
  erdnussbutter: 588, mandelbutter: 614,
  hähnchen: 165, hühnchen: 165, hähnchenbrustfilet: 110, hähnchenbrust: 110,
  rind: 250, rindfleisch: 250, hackfleisch: 230, rinderhack: 230,
  schwein: 242, kotelett: 195, schweinebauch: 395,
  lamm: 294, truthahn: 189, pute: 189, putenbrustfilet: 107,
  ente: 337, kaninchen: 136, hirsch: 120,
  speck: 541, bacon: 541, schinken: 145, kochschinken: 100,
  salami: 378, chorizo: 386, bratwurst: 265, wurst: 270,
  fisch: 150, lachs: 208, lachsfilet: 208, thunfisch: 144, thunfischdose: 116,
  forelle: 119, kabeljau: 82, dorsch: 82, tilapia: 96, hering: 158,
  makrele: 205, sardinen: 208, pangasius: 90,
  garnelen: 85, crevetten: 85, krabben: 72, muscheln: 86, tintenfisch: 75,
  ei: 155, hühnerei: 155, eiweiß: 52, eigelb: 322,
  milch: 64, vollmilch: 64, halbfettmilch: 46, magermilch: 34,
  butter: 717, margarine: 717,
  käse: 350, gouda: 356, cheddar: 403, camembert: 297, brie: 334,
  feta: 264, mozzarella: 280, parmesan: 431, emmentaler: 380,
  frischkäse: 140, hüttenkäse: 98, ricotta: 174,
  joghurt: 61, naturjoghurt: 61, griechischerjoghurt: 97, skyr: 63,
  quark: 68, magerquark: 68, sahnequark: 136,
  sahne: 292, schlagsahne: 292, schmand: 220,
  öl: 884, olivenöl: 884, sonnenblumenöl: 884, kokosöl: 892, rapsöl: 884,
  apfel: 52, birne: 57, orange: 47, mandarine: 53, grapefruit: 42,
  zitrone: 29, banane: 89, erdbeere: 32, himbeere: 52,
  heidelbeere: 57, blaubeere: 57, brombeere: 43, johannisbeere: 56,
  weintraube: 69, kirsche: 63, pflaume: 46, pfirsich: 39, aprikose: 48,
  mango: 60, ananas: 50, kiwi: 61, papaya: 43, wassermelone: 30,
  melone: 34, feige: 74, dattel: 282, avocado: 160, granatapfel: 83,
  salat: 15, kopfsalat: 13, rucola: 25, spinat: 23, mangold: 19,
  gurke: 12, tomate: 18, paprika: 26,
  zwiebel: 40, lauch: 31, knoblauch: 149,
  karotte: 41, möhre: 41, sellerie: 17,
  brokkoli: 34, blumenkohl: 25, rosenkohl: 43, wirsing: 27, kohl: 25,
  rotkohl: 31, weißkohl: 25, chinakohl: 16,
  zucchini: 17, kürbis: 26, butternutkürbis: 45, aubergine: 25,
  pilze: 22, champignons: 22, steinpilze: 26, pfifferlinge: 32,
  spargel: 20, artischocke: 53, fenchel: 31,
  mais: 86,
  schokolade: 546, vollmilchschokolade: 535, zartbitterschokolade: 560,
  nutella: 530, marmelade: 250,
  kuchen: 400, muffin: 380, keks: 450, plätzchen: 450,
  croissant: 406, donut: 452, waffel: 291,
  chips: 536, popcorn: 375, cracker: 430,
  eis: 200, speiseeis: 200,
  gummibärchen: 343, honig: 304, zucker: 387,
  pizza: 266, burger: 295, hamburger: 295,
  pommes: 312, kebab: 280, döner: 280, hotdog: 290,
  ketchup: 112, mayonnaise: 680, senf: 70, sojasosse: 53,
};

const foodAliases: Record<string, string> = {
  'haferbrei': 'haferflocken', 'porridge': 'haferflocken',
  'chicken': 'hähnchen', 'huhn': 'hähnchen',
  'beef': 'rind', 'steak': 'rind',
  'salmon': 'lachs', 'tuna': 'thunfisch',
  'apple': 'apfel', 'banana': 'banane',
  'pommes frites': 'pommes',
};

const foodEmoji: Record<string, string> = {
  apfel: '🍎', birne: '🍐', banane: '🍌', erdbeere: '🍓', himbeere: '🍓', heidelbeere: '🫐',
  orange: '🍊', mandarine: '🍊', zitrone: '🍋', wassermelone: '🍉', traube: '🍇', kirsche: '🍒',
  pfirsich: '🍑', mango: '🥭', avocado: '🥑', brot: '🍞', toast: '🍞', croissant: '🥐',
  ei: '🥚', käse: '🧀', milch: '🥛', joghurt: '🥄', hähnchen: '🍗', rind: '🥩', fisch: '🐟', lachs: '🐟',
  kartoffel: '🥔', salat: '🥗', tomate: '🍅', gurke: '🥒', paprika: '🫑', zwiebel: '🧅', knoblauch: '🧄',
  nudeln: '🍝', reis: '🍚', pizza: '🍕', burger: '🍔', pommes: '🍟', kuchen: '🍰', schokolade: '🍫',
};

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(foodEmoji)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

interface ParsedItem { name: string; weight: number; unit: string; calories: number; kcalPer100g: number; }
function parseFoodLine(input: string): { total: number; items: ParsedItem[] } | null {
  let text = input.toLowerCase().trim();
  if (!text) return null;
  for (const [alias, target] of Object.entries(foodAliases)) {
    text = text.replace(new RegExp(`\\b${alias}\\b`, 'gi'), target);
  }

  const results: ParsedItem[] = [];
  const foods = Object.keys(foodDB).sort((a, b) => b.length - a.length);

  for (const food of foods) {
    const esc = food.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-züäöß])${esc}(?![a-züäöß])`, 'i');
    const match = regex.exec(text);
    if (!match) continue;

    const before = text.substring(0, match.index);
    const after = text.substring(match.index + match[0].length);

    let weight = 100;
    let unit = 'g';

    const patterns = [
      { re: /(\d+(?:[.,]\d+)?)\s*kg\s*$/, mult: 1000, u: 'kg' },
      { re: /(\d+(?:[.,]\d+)?)\s*(?:l|liter)\s*$/, mult: 1000, u: 'l' },
      { re: /(\d+(?:[.,]\d+)?)\s*(?:el|esslöffel)\s*$/, mult: 15, u: 'EL' },
      { re: /(\d+(?:[.,]\d+)?)\s*(?:tl|teelöffel)\s*$/, mult: 5, u: 'TL' },
      { re: /(\d+(?:[.,]\d+)?)\s*tassen?\s*$/, mult: 240, u: 'Tasse' },
      { re: /(\d+(?:[.,]\d+)?)\s*portionen?\s*$/, mult: 150, u: 'Portion' },
      { re: /(\d+(?:[.,]\d+)?)\s*scheiben?\s*$/, mult: 30, u: 'Scheibe' },
      { re: /(\d+(?:[.,]\d+)?)\s*(?:stück|stk)\s*$/, mult: 100, u: 'Stück' },
      { re: /(\d+(?:[.,]\d+)?)\s*(?:g|gramm|ml)\s*$/, mult: 1, u: 'g' },
      { re: /(\d+(?:[.,]\d+)?)\s*$/, mult: 1, u: 'g' },
    ];
    const afterPats = [
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*kg/, mult: 1000, u: 'kg' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*(?:l|liter)/, mult: 1000, u: 'l' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*(?:el|esslöffel)/, mult: 15, u: 'EL' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*(?:tl|teelöffel)/, mult: 5, u: 'TL' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*tassen?/, mult: 240, u: 'Tasse' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*portionen?/, mult: 150, u: 'Portion' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*scheiben?/, mult: 30, u: 'Scheibe' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*(?:stück|stk)/, mult: 100, u: 'Stück' },
      { re: /^\s*(\d+(?:[.,]\d+)?)\s*(?:g|gramm|ml)/, mult: 1, u: 'g' },
      { re: /^\s*(\d+(?:[.,]\d+)?)(?![a-zA-ZäöüÄÖÜ])/, mult: 1, u: 'g' },
    ];

    let found = false;
    for (const p of patterns) {
      const m = before.match(p.re);
      if (m) { weight = parseFloat(m[1].replace(',', '.')) * p.mult; unit = p.u; found = true; break; }
    }
    if (!found) {
      for (const p of afterPats) {
        const m = after.match(p.re);
        if (m) { weight = parseFloat(m[1].replace(',', '.')) * p.mult; unit = p.u; break; }
      }
    }

    const kcalPer100g = foodDB[food];
    const calories = Math.round((weight / 100) * kcalPer100g);
    results.push({ name: food, weight, unit, calories, kcalPer100g });
    text = text.replace(regex, ' ').replace(/\s+/g, ' ');
  }

  if (results.length === 0) return null;
  const total = results.reduce((s, r) => s + r.calories, 0);
  return { total, items: results };
}

// ==================== REZEPT-DATENBANK ====================
const RECIPE_DB: Recipe[] = [
  { id: 'b1', name: 'Haferflocken mit Beeren', calories: 350, explanation: 'Ballaststoffreiches Porridge mit frischen Beeren und einem Klecks Joghurt.',
    ingredients: ['50g Haferflocken', '200ml Milch oder Wasser', '100g gemischte Beeren', '1 TL Honig', '1 EL Joghurt (optional)'],
    instructions: 'Haferflocken mit Milch/Wasser aufkochen, 5 Minuten köcheln. In eine Schüssel geben, Beeren darauf verteilen, mit Honig beträufeln.', mealType: 'breakfast' },
  { id: 'b2', name: 'Vollkornbrot mit Avocado', calories: 420, explanation: '2 Scheiben Vollkornbrot, halbe Avocado, Tomaten und etwas Salz/Pfeffer.',
    ingredients: ['2 Scheiben Vollkornbrot', '1/2 Avocado', '4 Kirschtomaten', 'Salz, Pfeffer', 'etwas Zitronensaft'],
    instructions: 'Brot toasten. Avocado zerdrücken, mit Zitronensaft, Salz und Pfeffer vermischen. Auf Brot streichen, Tomaten darauf legen.', mealType: 'breakfast' },
  { id: 'b3', name: 'Griechischer Joghurt mit Honig', calories: 280, explanation: '150g Joghurt, 1 EL Honig, Walnüsse und Zimt.',
    ingredients: ['150g griechischer Joghurt', '1 EL Honig', '20g Walnüsse', '1 Prise Zimt'],
    instructions: 'Joghurt in Schüssel geben, Honig unterrühren. Walnüsse hacken und darüber streuen, mit Zimt bestäuben.', mealType: 'breakfast' },
  { id: 'b4', name: 'Rührei mit Spinat', calories: 320, explanation: '3 Eier, Handvoll frischer Spinat, etwas Zwiebel – in Olivenöl gebraten.',
    ingredients: ['3 Eier', '50g frischer Spinat', '1/2 Zwiebel', '1 EL Olivenöl', 'Salz, Pfeffer'],
    instructions: 'Zwiebel in Öl glasig dünsten. Spinat zugeben und zusammenfallen lassen. Eier verquirlen, über das Gemüse gießen und stocken lassen.', mealType: 'breakfast' },
  { id: 'l1', name: 'Hähnchen-Gemüse-Pfanne', calories: 480, explanation: 'Hähnchenbruststreifen mit Brokkoli, Paprika und Zuckerschoten in Sojasoße.',
    ingredients: ['200g Hähnchenbrust', '100g Brokkoli', '1 rote Paprika', '50g Zuckerschoten', '2 EL Sojasoße', '1 TL Öl'],
    instructions: 'Hähnchen anbraten, herausnehmen. Gemüse kurz anbraten, Hähnchen wieder zugeben, Sojasoße hinzufügen und 2-3 Minuten braten.', mealType: 'lunch' },
  { id: 'l2', name: 'Quinoa-Salat mit Feta', calories: 450, explanation: 'Quinoa, Gurke, Tomate, Oliven, Feta, Zitronen-Vinaigrette.',
    ingredients: ['100g Quinoa', '1/2 Gurke', '150g Kirschtomaten', '50g Feta', '50g Oliven', '1 EL Olivenöl', 'Saft einer Zitrone'],
    instructions: 'Quinoa kochen, abkühlen lassen. Gemüse klein schneiden, mit Quinoa vermengen. Feta zerbröseln. Dressing aus Öl, Zitronensaft und Gewürzen zugeben.', mealType: 'lunch' },
  { id: 'l3', name: 'Veggie-Bowl mit Kichererbsen', calories: 520, explanation: 'Reis, geröstete Kichererbsen, Avocado, Karotten, Tahin-Dressing.',
    ingredients: ['150g gekochter Reis', '200g Kichererbsen', '1/2 Avocado', '1 Karotte', '2 EL Tahin', '1 EL Zitronensaft'],
    instructions: 'Kichererbsen rösten. Reis in Bowl geben, Kichererbsen, Karottenstreifen und Avocado anrichten. Tahin mit Zitronensaft und Wasser zu Soße verrühren.', mealType: 'lunch' },
  { id: 'l4', name: 'Linsensuppe', calories: 380, explanation: 'Herzhafte rote Linsensuppe mit Karotten, Sellerie und Kreuzkümmel.',
    ingredients: ['150g rote Linsen', '1 Zwiebel', '2 Karotten', '1 Stange Sellerie', '1 TL Kreuzkümmel', '500ml Gemüsebrühe', '1 EL Olivenöl'],
    instructions: 'Gemüse würfeln und in Öl anbraten. Linsen und Kreuzkümmel mitbraten, mit Brühe ablöschen und 20 Minuten köcheln. Pürieren und abschmecken.', mealType: 'lunch' },
  { id: 'd1', name: 'Gebackener Lachs mit Spargel', calories: 520, explanation: 'Lachsfilet mit Zitrone und Dill, dazu grüner Spargel und Kartoffelecken.',
    ingredients: ['200g Lachsfilet', '200g grüner Spargel', '200g kleine Kartoffeln', '1 Zitrone', 'Dill', 'Salz, Pfeffer', '1 EL Olivenöl'],
    instructions: 'Kartoffeln halbieren, mit Öl und Salz mischen, bei 200°C 15 Minuten vorbacken. Lachs würzen, mit Zitrone und Spargel aufs Blech legen, weitere 15 Minuten backen.', mealType: 'dinner' },
  { id: 'd2', name: 'Zucchini-Nudeln mit Pesto', calories: 390, explanation: 'Zoodles mit selbstgemachtem Basilikum-Pesto und Kirschtomaten.',
    ingredients: ['2 Zucchini', '100g Kirschtomaten', '40g Basilikum', '30g Pinienkerne', '30g Parmesan', '1 Knoblauchzehe', '4 EL Olivenöl'],
    instructions: 'Zucchini zu Nudeln spiralisieren. Pesto aus Basilikum, Pinienkernen, Parmesan, Knoblauch und Öl mixen. Zoodles kurz erwärmen, Pesto unterheben, mit Tomaten servieren.', mealType: 'dinner' },
  { id: 'd3', name: 'Vegetarische Chili sin Carne', calories: 410, explanation: 'Bohnen, Mais, Paprika, Zwiebeln in Tomatensoße – serviert mit etwas Reis.',
    ingredients: ['1 Zwiebel', '1 Paprika', '200g Kidneybohnen', '150g Mais', '400g Tomaten (Dose)', '1 TL Chili', '1 TL Kreuzkümmel', '1 EL Öl'],
    instructions: 'Zwiebel und Paprika in Öl anbraten. Bohnen, Mais und Tomaten zugeben, mit Chili, Kreuzkümmel würzen, 15 Minuten köcheln.', mealType: 'dinner' },
  { id: 'd4', name: 'Putenbrust mit Süßkartoffelpüree', calories: 550, explanation: 'Saftige Putenbrust, cremiges Süßkartoffelpüree und gedünsteter Brokkoli.',
    ingredients: ['200g Putenbrust', '300g Süßkartoffeln', '150g Brokkoli', '50ml Milch', '1 TL Butter', 'Salz, Pfeffer, Paprikapulver', '1 EL Öl'],
    instructions: 'Süßkartoffeln kochen und pürieren. Brokkoli dämpfen. Putenbrust anbraten und fertig garen. Alles anrichten.', mealType: 'dinner' },
  { id: 's1', name: 'Apfel mit Mandelbutter', calories: 180, explanation: 'Ein Apfel, 1 EL Mandelbutter.',
    ingredients: ['1 Apfel', '1 EL Mandelbutter'],
    instructions: 'Apfel waschen, in Spalten schneiden und mit Mandelbutter genießen.', mealType: 'snack' },
  { id: 's2', name: 'Protein-Shake', calories: 150, explanation: '1 Scoop Whey, 200ml Mandelmilch, halbe Banane.',
    ingredients: ['1 Scoop Proteinpulver', '200ml Mandelmilch', '1/2 Banane'],
    instructions: 'Alle Zutaten mixen.', mealType: 'snack' },
  { id: 's3', name: 'Gemüsesticks mit Hummus', calories: 200, explanation: 'Karotten, Gurke, Paprika – 3 EL Hummus.',
    ingredients: ['1 Karotte', '1/2 Gurke', '1/2 Paprika', '3 EL Hummus'],
    instructions: 'Gemüse in Sticks schneiden und mit Hummus dippen.', mealType: 'snack' },
  { id: 's4', name: 'Griechischer Joghurt (klein)', calories: 120, explanation: '100g Joghurt mit einem TL Honig.',
    ingredients: ['100g griechischer Joghurt', '1 TL Honig'],
    instructions: 'Joghurt in Schälchen geben, Honig darüber träufeln.', mealType: 'snack' },
];

// ==================== HILFSFUNKTIONEN ====================
function idealWeight(height: number) {
  const m = height / 100;
  return { lo: Math.round(18.5 * m * m), hi: Math.round(24.9 * m * m) };
}
function getBMI(weight: number, height: number) { const m = height / 100; return weight / (m * m); }
function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Untergewicht', color: '#3b82f6' };
  if (bmi < 25) return { label: 'Normalgewicht', color: '#16a34a' };
  if (bmi < 30) return { label: 'Übergewicht', color: '#f59e0b' };
  return { label: 'Adipositas', color: '#ef4444' };
}
function getWeightDiff(entries: WeightEntry[]) {
  if (entries.length === 0) return { diff: 0, weeklyRate: 0, startWeight: 0, currentWeight: 0 };
  const s = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const diff = s[s.length - 1].weight - s[0].weight;
  const days = (new Date(s[s.length - 1].date).getTime() - new Date(s[0].date).getTime()) / 86400000;
  return { diff, weeklyRate: days > 0 ? diff / (days / 7) : 0, startWeight: s[0].weight, currentWeight: s[s.length - 1].weight };
}

function linearRegression(entries: WeightEntry[]): { slope: number; intercept: number; r2: number } | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0].date).getTime();
  const points = sorted.map(e => ({
    x: (new Date(e.date).getTime() - firstDate) / (1000 * 3600 * 24),
    y: e.weight
  }));
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x; sumY2 += p.y * p.y;
  }
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const ssRes = points.reduce((sum, p) => sum + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const ssTot = sumY2 - (sumY * sumY) / n;
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function getProjectedWeightByTrend(entries: WeightEntry[], weeks: number): number | null {
  const reg = linearRegression(entries);
  if (!reg) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const firstDate = new Date(sorted[0].date);
  const daysFromFirst = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
  const lastWeight = reg.intercept + reg.slope * daysFromFirst;
  return lastWeight + reg.slope * (weeks * 7);
}

function getPlanProjectedWeight(entries: WeightEntry[], result: CalorieResult | null, goalMode: 'lose' | 'maintain' | 'gain', weeks: number): number | null {
  if (!result || entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const dailyDiff = result.goalCalories[goalMode] - result.tdee;
  const weeklyKgChange = (dailyDiff * 7) / 7700;
  return last.weight + weeklyKgChange * weeks;
}

interface PrognosePoint {
  date: string;
  label: string;
  actual: number | null;
  planPrognose: number | null;
  trendPrognose: number | null;
}

function buildPrognoseData(entries: WeightEntry[], goalMode: 'lose' | 'maintain' | 'gain', result: CalorieResult | null): PrognosePoint[] {
  if (!result || entries.length < 1) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const dailyDiff = result.goalCalories[goalMode] - result.tdee;
  const weeklyKgChange = (dailyDiff * 7) / 7700;

  const historical: PrognosePoint[] = sorted.map(e => ({
    date: e.date,
    label: e.date.slice(5),
    actual: e.weight,
    planPrognose: null,
    trendPrognose: null,
  }));

  const future: PrognosePoint[] = [];
  const lastDate = new Date(last.date);
  for (let w = 1; w <= 8; w++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + w * 7);
    future.push({
      date: fmtDate(d),
      label: fmtDate(d).slice(5),
      actual: null,
      planPrognose: +(last.weight + weeklyKgChange * w).toFixed(2),
      trendPrognose: null,
    });
  }
  return [...historical, ...future].sort((a, b) => a.date.localeCompare(b.date));
}

function buildTrendPrognoseData(entries: WeightEntry[], weeks = 8): PrognosePoint[] {
  if (entries.length < 2) return [];
  const reg = linearRegression(entries);
  if (!reg) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0].date).getTime();
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const startDay = (lastDate.getTime() - firstDate) / (1000 * 3600 * 24);
  const result: PrognosePoint[] = [];
  for (let w = 0; w <= weeks; w++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + w * 7);
    const day = startDay + w * 7;
    const weight = reg.intercept + reg.slope * day;
    result.push({
      date: fmtDate(futureDate),
      label: fmtDate(futureDate).slice(5),
      actual: null,
      planPrognose: null,
      trendPrognose: +weight.toFixed(2),
    });
  }
  return result;
}

function Ring({ pct, size = 90, sw = 10, color = '#30d158' }: { pct: number; size?: number; sw?: number; color?: string }) {
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

// ==================== MODALS ====================
function FoodModal({ onClose, onSave }: { onClose: () => void; onSave: (e: Omit<FoodEntry, 'id'>) => void }) {
  const [tab, setTab] = useState<'manual' | 'voice'>('manual');
  const [name, setName] = useState('');
  const [cals, setCals] = useState('');
  const [time, setTime] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(true);
  const [parsed, setParsed] = useState<ReturnType<typeof parseFoodLine> | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userEdited, setUserEdited] = useState(false);
  const tmr = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set time only on client to avoid SSR mismatch
  useEffect(() => {
    setTime(nowTime());
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceOk(!!SR);
  }, []);

  useEffect(() => {
    if (tmr.current) clearTimeout(tmr.current);
    if (!name.trim()) { setParsed(null); return; }
    tmr.current = setTimeout(() => {
      const r = parseFoodLine(name);
      setParsed(r);
      if (r && !userEdited) setCals(String(r.total));
    }, 350);
    return () => { if (tmr.current) clearTimeout(tmr.current); };
  }, [name, userEdited]);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR(); rec.lang = 'de-DE';
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text: string = e.results[0][0].transcript;
      const cm = text.match(/(\d+)\s*(?:kalorien|kcal|cal)/i);
      const spokenCal = cm ? parseInt(cm[1]) : 0;
      const cleaned = text.replace(/(\d+)\s*(?:kalorien|kcal|cal)/gi, '').trim() || text;
      setName(cleaned); setUserEdited(false);
      if (spokenCal > 0) { setCals(String(spokenCal)); setUserEdited(true); }
    };
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const save = () => {
    const cal = parseInt(cals);
    if (!name.trim() || isNaN(cal) || cal <= 0) { alert('Bitte Name und Kalorien eingeben.'); return; }
    onSave({ date: todayStr(), time: time || nowTime(), name: name.trim(), calories: cal, source: tab });
    onClose();
  };

  const emoji = getFoodEmoji(name);

  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>➕ Mahlzeit</span>
          <button className="bic" style={{ width: 40, height: 40 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div className="tbar">
          <button className={`tbtn ${tab === 'manual' ? 'on' : ''}`} onClick={() => setTab('manual')}><UtensilsCrossed size={14} />Tippen</button>
          <button className={`tbtn ${tab === 'voice' ? 'on' : ''}`} onClick={() => setTab('voice')}><Mic size={14} />Sprache</button>
        </div>

        {tab === 'voice' && (
          <div style={{ background: '#f1f5f9', borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            {voiceOk ? (
              <>
                <button className={`bic ${listening ? 'rec' : ''}`} style={{ width: 56, height: 56, borderRadius: 28, margin: '0 auto 10px' }} onClick={startVoice}>
                  <Mic size={24} />
                </button>
                <p style={{ fontSize: 12, color: '#64748b' }}>{listening ? '🔴 Aufnahme läuft…' : 'z.B. „Haferflocken 80g mit Milch 200ml"'}</p>
              </>
            ) : (
              <div className="voice-warn"><b>Spracheingabe nicht verfügbar</b><br />Bitte tippe die Mahlzeit unten ein.</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="lbl">Lebensmittel mit Menge</label>
            <div style={{ position: 'relative' }}>
              <input className="inp" value={name} onChange={e => { setName(e.target.value); setUserEdited(false); }}
                placeholder="z.B. Buchweizen 80g, Milch 200ml, Ei 2 Stück" />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 22 }}>{emoji}</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Mengen: 80g · 2 EL · 1 Tasse · 1 Portion …</div>
          </div>

          {parsed && (
            <div className="aibox">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} color="#15803d" />
                <span style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{parsed.total} kcal</span>
                <span style={{ fontSize: 12, color: '#16a34a' }}>automatisch</span>
                <button onClick={() => setShowDetail(!showDetail)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 11, color: '#0f766e', textDecoration: 'underline', cursor: 'pointer' }}>{showDetail ? 'ausblenden' : 'Details'}</button>
              </div>
              {showDetail && <div className="aidetail">{parsed.items.map((item, i) => <div key={i}><b>{item.name}</b>: {item.weight}g × {item.kcalPer100g} = {item.calories} kcal</div>)}</div>}
            </div>
          )}

          <div><label className="lbl">Kalorien (kcal)</label><input className="inp" type="number" value={cals} onChange={e => { setCals(e.target.value); setUserEdited(true); }} placeholder="kcal" min={1} /></div>
          <div><label className="lbl">Uhrzeit</label><input className="inp" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={save} style={{ flex: 2, justifyContent: 'center', height: 48 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

function ActivityModal({ weight, onClose, onSave }: { weight: number; onClose: () => void; onSave: (a: Omit<ActivityEntry, 'id'>) => void }) {
  const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
  const [duration, setDuration] = useState(30);
  const [custom, setCustom] = useState(false);
  const [customMet, setCustomMet] = useState('');
  const met = custom ? parseFloat(customMet) || 0 : selectedSport.met;
  const calories = Math.round(met * weight * (duration / 60));
  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>🏃 Aktivität</span>
          <button className="bic" style={{ width: 40, height: 40 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="lbl">Sportart wählen</label>
            {!custom ? (
              <div className="sport-grid">
                {SPORTS.map(sport => {
                  const Icon = sport.icon;
                  return (
                    <div key={sport.name} className={`sport-card ${selectedSport.name === sport.name ? 'selected' : ''}`} onClick={() => setSelectedSport(sport)}>
                      <div className="sport-icon"><Icon size={24} strokeWidth={1.5} /></div>
                      <div style={{ fontSize: 12, fontWeight: 500, textAlign: 'center' }}>{sport.name.split('(')[0]}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>MET {sport.met}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <VoiceNumberInput value={customMet} onChange={setCustomMet} placeholder="MET-Wert (z.B. 6.5)" className="inp" />
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)} /> Eigener MET-Wert
            </label>
          </div>
          <div>
            <label className="lbl">Dauer (Minuten)</label>
            <VoiceNumberInput value={duration} onChange={(val: any) => setDuration(Math.max(1, Number(val)))} placeholder="Minuten" className="inp" />
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 16, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>Verbrauch geschätzt</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#2563eb' }}>{calories} <span style={{ fontSize: 13, fontWeight: 400 }}>kcal</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={() => {
            if ((!custom && selectedSport) || (custom && customMet)) {
              onSave({ date: todayStr(), sport: custom ? `Custom MET ${met}` : selectedSport.name, durationMinutes: duration, caloriesBurned: calories, met });
              onClose();
            }
          }} style={{ flex: 2, justifyContent: 'center', height: 48 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

function WeightModal({ onClose, onSave, currentWeight }: { onClose: () => void; onSave: (w: number, d: string) => void; currentWeight: number }) {
  const [weight, setWeight] = useState(String(currentWeight));
  const [date, setDate] = useState('');

  // Set date only on client
  useEffect(() => {
    setDate(todayStr());
  }, []);

  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>⚖️ Gewicht</span>
          <button className="bic" style={{ width: 40, height: 40 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="lbl">Datum</label><input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label className="lbl">Gewicht (kg)</label><VoiceNumberInput value={weight} onChange={setWeight} className="inp" placeholder="kg" /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={() => {
            const v = parseFloat(weight);
            if (v > 0 && v < 300) { onSave(v, date); onClose(); }
          }} style={{ flex: 2, justifyContent: 'center', height: 48 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

function BtModal({ onClose, onRead }: { onClose: () => void; onRead: (w: number) => void }) {
  const [st, setSt] = useState<'idle' | 'scan' | 'conn' | 'read'>('idle');
  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>🔗 Bluetooth-Waage</span>
          <button className="bic" style={{ width: 40, height: 40 }} onClick={onClose}><X size={18} /></button>
        </div>
        {st === 'idle' && <button className="bp" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSt('scan'); setTimeout(() => setSt('conn'), 1500); }}><Bluetooth size={18} />Suchen</button>}
        {st === 'scan' && <div style={{ textAlign: 'center' }}><Loader2 size={32} className="spin" style={{ marginBottom: 8 }} /><p>Suche Waage…</p></div>}
        {st === 'conn' && (
          <>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 12 }}>✓ Demo-Waage verbunden</div>
            <button className="bp" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSt('read'); setTimeout(() => { onRead(+(Math.random() * 70 + 50).toFixed(1)); onClose(); }, 1000); }}><Scale size={16} />Gewicht abrufen</button>
          </>
        )}
        {st === 'read' && <div style={{ textAlign: 'center' }}><Loader2 size={32} className="spin" style={{ marginBottom: 8 }} /><p>Lese Gewicht…</p></div>}
        <button className="bg" onClick={onClose} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>Abbrechen</button>
      </div>
    </div>
  );
}

function EditCalModal({ entry, onClose, onSave }: { entry: FoodEntry; onClose: () => void; onSave: (id: string, cal: number) => void }) {
  const [cals, setCals] = useState(String(entry.calories));
  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>✏️ Kalorien bearbeiten</span>
          <button className="bic" style={{ width: 40, height: 40 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#475569' }}>{entry.name}</div>
        <div><label className="lbl">Kalorien (kcal)</label><VoiceNumberInput value={cals} onChange={setCals} className="inp" placeholder="kcal" /></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="bg" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Abbrechen</button>
          <button className="bp" onClick={() => { const v = parseInt(cals); if (v > 0) { onSave(entry.id, v); onClose(); } }} style={{ flex: 2, justifyContent: 'center', height: 48 }}><Save size={14} />Speichern</button>
        </div>
      </div>
    </div>
  );
}

function RecipeDetailModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{recipe.name}</span>
          <button className="bic" style={{ width: 40, height: 40 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 8, marginBottom: 16, textAlign: 'center' }}>
          <span style={{ fontWeight: 700 }}>{recipe.calories} kcal</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>🛒 Zutaten:</div>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: '#334155' }}>
            {recipe.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>🍳 Zubereitung:</div>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{recipe.instructions}</div>
        </div>
        <button className="bp" onClick={onClose} style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>Schließen</button>
      </div>
    </div>
  );
}

// ==================== HAUPTKOMPONENTE ====================
export default function CaloriePage() {
  const router = useRouter();

  const [ringSize, setRingSize] = useState(90);
  useEffect(() => {
    const handleResize = () => setRingSize(window.innerWidth < 480 ? 70 : 90);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [chartsReady, setChartsReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setChartsReady(true), 150);
    return () => clearTimeout(t);
  }, []);

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
  const [weightRangeMode, setWeightRangeMode] = useState<'last7' | 'custom'>('custom');
  // weightStart: initialized with empty string on server, set on client
  const [weightStart, setWeightStart] = useState<string>('');
  const [showBt, setShowBt] = useState(false);
  const [editFood, setEditFood] = useState<FoodEntry | null>(null);

  const [showFoodToday, setShowFoodToday] = useState(false);
  const [showActivityToday, setShowActivityToday] = useState(false);

  // calorieLimitManual: initialized as null (no localStorage on server)
  const [calorieLimitManual, setCalorieLimitManual] = useState<number | null>(null);
  const [useManualLimit, setUseManualLimit] = useState(false);
  const [showRecipeSuggestions, setShowRecipeSuggestions] = useState(false);
  const [currentRecipes, setCurrentRecipes] = useState<Recipe[]>([]);

  // FIX: favoriteRecipes starts empty on both server and client,
  // then gets hydrated from localStorage in the useEffect below
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showFavorites, setShowFavorites] = useState(true);

  useEffect(() => {
    safeLS.set(STORAGE_KEYS.favoriteRecipes, JSON.stringify(favoriteRecipes));
  }, [favoriteRecipes]);

  useEffect(() => {
    safeLS.set(STORAGE_KEYS.calorieLimitManual, calorieLimitManual ? String(calorieLimitManual) : '');
  }, [calorieLimitManual]);

  const calcBMR = (p: UserProfile) => p.gender === 'male'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
    : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;

  const computeResult = useCallback((p: UserProfile) => {
    const bmr = Math.round(calcBMR(p));
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[p.activityLevel].value);
    setResult({ bmr, tdee, goalCalories: { lose: Math.round(tdee * 0.8), maintain: tdee, gain: Math.round(tdee * 1.15) } });
  }, []);

  // Single useEffect for all localStorage reads (runs only on client)
  useEffect(() => {
    // weightStart default
    const savedStart = safeLS.get(STORAGE_KEYS.weightStart);
    setWeightStart(savedStart || fmtDate(new Date(Date.now() - 90 * 86400000)));

    // calorieLimitManual
    const savedLimit = safeLS.get(STORAGE_KEYS.calorieLimitManual);
    if (savedLimit) setCalorieLimitManual(parseInt(savedLimit));

    // favoriteRecipes
    try {
      const sf = safeLS.get(STORAGE_KEYS.favoriteRecipes);
      if (sf) setFavoriteRecipes(JSON.parse(sf));
    } catch {}

    // profile
    const sp = safeLS.get(STORAGE_KEYS.profile);
    if (sp) {
      try { const p = JSON.parse(sp); setProfile(p); computeResult(p); setSaved(true); } catch {}
    } else {
      computeResult(profile);
    }

    // goal
    const sg = safeLS.get(STORAGE_KEYS.goal);
    if (sg) setGoalMode(sg as 'lose' | 'maintain' | 'gain');

    // weight entries
    try { const sw = safeLS.get(STORAGE_KEYS.weight); if (sw) setWeightEntries(JSON.parse(sw)); } catch {}

    // activities
    try { const sa = safeLS.get(STORAGE_KEYS.activities); if (sa) setActivities(JSON.parse(sa)); } catch {}

    // food entries
    try { const sf2 = safeLS.get(STORAGE_KEYS.food); if (sf2) setFoodEntries(JSON.parse(sf2)); } catch {}
  }, []);

  useEffect(() => { safeLS.set(STORAGE_KEYS.weight, JSON.stringify(weightEntries)); }, [weightEntries]);
  useEffect(() => { safeLS.set(STORAGE_KEYS.activities, JSON.stringify(activities)); }, [activities]);
  useEffect(() => { safeLS.set(STORAGE_KEYS.food, JSON.stringify(foodEntries)); }, [foodEntries]);
  useEffect(() => { safeLS.set(STORAGE_KEYS.goal, goalMode); }, [goalMode]);
  useEffect(() => { if (weightStart) safeLS.set(STORAGE_KEYS.weightStart, weightStart); }, [weightStart]);

  const updProfile = (field: keyof UserProfile, value: any) => {
    const u = { ...profile, [field]: value };
    setProfile(u);
    computeResult(u);
    setSaved(false);
  };

  const saveWeight = (w: number, date: string) => {
    setWeightEntries(prev =>
      [...prev.filter(e => e.date !== date), { id: Date.now().toString(), date, weight: w, source: 'manual' as const }]
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    updProfile('weight', w);
  };

  const generateDailySuggestions = useCallback((limit: number) => {
    const breakfastOptions = RECIPE_DB.filter(r => r.mealType === 'breakfast');
    const lunchOptions = RECIPE_DB.filter(r => r.mealType === 'lunch');
    const dinnerOptions = RECIPE_DB.filter(r => r.mealType === 'dinner');
    const snackOptions = RECIPE_DB.filter(r => r.mealType === 'snack');

    const randomBreakfast = breakfastOptions[Math.floor(Math.random() * breakfastOptions.length)];
    const randomLunch = lunchOptions[Math.floor(Math.random() * lunchOptions.length)];
    const randomDinner = dinnerOptions[Math.floor(Math.random() * dinnerOptions.length)];
    const randomSnack = snackOptions[Math.floor(Math.random() * snackOptions.length)];

    setCurrentRecipes([randomBreakfast, randomLunch, randomDinner, randomSnack]);
    setShowRecipeSuggestions(true);
  }, []);

  const getCurrentLimit = (): number => {
    if (useManualLimit && calorieLimitManual) return calorieLimitManual;
    if (result) return result.goalCalories[goalMode];
    return 2000;
  };

  const toggleFavorite = (recipe: Recipe) => {
    const exists = favoriteRecipes.some(r => r.id === recipe.id);
    if (exists) {
      setFavoriteRecipes(prev => prev.filter(r => r.id !== recipe.id));
    } else {
      setFavoriteRecipes(prev => [...prev, { ...recipe, isFavorite: true }]);
    }
  };

  const td = todayStr();
  const todayFood = foodEntries.filter(e => e.date === td);
  const todayActs = activities.filter(a => a.date === td);
  const consumed = todayFood.reduce((s, e) => s + e.calories, 0);
  const burned = todayActs.reduce((s, a) => s + a.caloriesBurned, 0);
  const target = result?.goalCalories[goalMode] ?? 2000;
  const remaining = Math.max(target - consumed + burned, 0);
  const pct = target > 0 ? (consumed / target) * 100 : 0;
  const ringColor = pct > 100 ? '#ff3b30' : pct > 85 ? '#ff9500' : '#30d158';

  const bmi = getBMI(profile.weight, profile.height);
  const bmiCat = getBMICategory(bmi);
  const ideal = idealWeight(profile.height);
  const bmiPct = Math.min(Math.max(((bmi - 15) / 30) * 100, 0), 100);
  const overBy = profile.weight > ideal.hi ? +(profile.weight - ideal.hi).toFixed(1) : 0;
  const underBy = profile.weight < ideal.lo ? +(ideal.lo - profile.weight).toFixed(1) : 0;

  const wdiff = getWeightDiff(weightEntries);

  const filteredWeights = () => {
    const start = weightRangeMode === 'last7' ? fmtDate(new Date(Date.now() - 7 * 86400000)) : weightStart;
    return weightEntries
      .filter(e => e.date >= start && e.date <= td)
      .map(e => ({ date: e.date.slice(5), weight: e.weight }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const dt = fmtDate(new Date(Date.now() - (6 - i) * 86400000));
    return {
      d: dt.slice(5),
      eat: foodEntries.filter(e => e.date === dt).reduce((s, e) => s + e.calories, 0),
      burn: activities.filter(a => a.date === dt).reduce((s, a) => s + a.caloriesBurned, 0),
    };
  });

  const sortedW = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const successData = sortedW.map(e => ({
    date: e.date.slice(5),
    weight: e.weight,
    delta: +(sortedW[0]?.weight - e.weight).toFixed(1),
  }));

  const planPrognose = buildPrognoseData(weightEntries, goalMode, result);
  const trendPrognose = buildTrendPrognoseData(weightEntries, 8);
  const combinedPrognose: PrognosePoint[] = planPrognose.map(p => {
    const trend = trendPrognose.find(t => t.date === p.date);
    return { ...p, trendPrognose: trend?.trendPrognose ?? null };
  });
  const projectedTrend8w = getProjectedWeightByTrend(weightEntries, 8);
  const projectedPlan8w = getPlanProjectedWeight(weightEntries, result, goalMode, 8);

  const deviationData = (() => {
    if (weightEntries.length === 0 || !result) return [];
    const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const dailyDiff = result.goalCalories[goalMode] - result.tdee;
    const weeks = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() - i * 7);
      const weekStr = fmtDate(weekDate);
      const actual = sorted.find(e => e.date === weekStr)?.weight ?? null;
      const daysFromStart = (weekDate.getTime() - new Date(first.date).getTime()) / 86400000;
      const plan = first.weight + (dailyDiff * daysFromStart) / 7700;
      weeks.push({
        week: weekStr.slice(5),
        actual,
        plan: plan > 0 ? +plan.toFixed(1) : null,
        deviation: actual ? +(actual - plan).toFixed(1) : null,
      });
    }
    return weeks;
  })();

  const dateIn8Weeks = new Date(Date.now() + 8 * 7 * 86400000);
  const formatted8WeeksDate = dateIn8Weeks.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // All buttons are uniformly blue: #2563eb
  const BLUE = '#2563eb';
  const BLUE_RGB = '37,99,235';

  return (
    <>
      <style>{`
        :root {
          --blue-primary: #1e3a5f;
          --blue-accent: #2563eb;
          --blue-dark: #0f2b44;
          --gray-bg: #f5f7fb;
          --card-radius: 20px;
          --card-padding: 16px;
          --gap-sm: 12px;
          --gap-md: 16px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fb; font-family: 'Inter', sans-serif; }
        .cp { min-height: 100vh; background: #f5f7fb; padding-bottom: 60px; }
        .hdr { background: linear-gradient(135deg, #1e3a5f 0%, #0f2b44 100%); padding: 14px 20px; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .hdr-r { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .hdr-logo { font-size: 18px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 12px; }
        .hdr-badge { background: rgba(255,255,255,.15); backdrop-filter: blur(4px); border-radius: 20px; padding: 6px 14px; color: #fff; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .main { max-width: 1400px; margin: 0 auto; padding: 16px 12px; }
        .card-grid { display: grid; grid-template-columns: 1fr; gap: var(--gap-md); align-items: start; }
        @media(min-width: 640px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
        @media(min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
        .card { background: #fff; border-radius: var(--card-radius); padding: var(--card-padding); box-shadow: 0 8px 20px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid rgba(0,0,0,0.03); min-width: 0; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 16px 28px -8px rgba(0,0,0,0.08); }
        .card-dk { background: linear-gradient(145deg, #1e3a5f, #132f4a); border-radius: var(--card-radius); padding: var(--card-padding); color: #fff; box-shadow: 0 12px 24px -8px rgba(0,0,0,0.2); min-width: 0; }
        .card-full { grid-column: 1/-1; min-width: 0; }
        @media(max-width: 639px) { .card-full { grid-column: 1; } }
        .slbl { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .inp { width: 100%; height: 44px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 14px; font-size: 14px; font-family: inherit; background: #fafcff; transition: all 0.2s; }
        .inp:focus { border-color: #2563eb; background: #fff; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .sel { width: 100%; height: 44px; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 12px; font-size: 14px; background: #fafcff; }
        .bp {
          background: #2563eb;
          border: none;
          border-radius: 12px;
          padding: 0 18px;
          height: 38px;
          color: #fff;
          font-weight: 600;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .bp:hover { filter: brightness(0.9); transform: scale(0.98); }
        .bg {
          background: #2563eb;
          border: none;
          border-radius: 12px;
          padding: 0 16px;
          height: 38px;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bg:hover { filter: brightness(0.9); transform: scale(0.98); }
        .bic {
          background: transparent;
          border: none;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #2563eb;
        }
        .bic:hover { background: rgba(37,99,235,0.1); transform: scale(0.96); }
        .bic.rec { background: #ff3b30; color: #fff; animation: pulse 1.2s infinite; }
        .bdel { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 6px; border-radius: 8px; transition: all 0.2s; }
        .bdel:hover { color: #ff3b30; background: #fee2e2; }
        .bedit { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 6px; border-radius: 8px; transition: all 0.2s; }
        .bedit:hover { color: #2563eb; background: #e0f2fe; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeInUp 0.3s ease-out; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .frow { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
        .frow:hover { background: #f8fafc; border-radius: 12px; padding-left: 6px; }
        .fico { width: 32px; height: 32px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .erow { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .sw { background: #fff; border-radius: var(--card-radius); overflow: hidden; }
        .stgl { width: 100%; background: #fff; border: none; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; color: #0f172a; }
        .stgl:hover { background: #f8fafc; }
        .sbody { padding: 0 18px 18px 18px; background: #fff; display: flex; flex-direction: column; gap: 14px; }
        .lbl { font-size: 12px; font-weight: 500; color: #475569; display: block; margin-bottom: 6px; }
        .aibox { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 12px 14px; margin-top: 8px; }
        .aidetail { font-size: 11px; color: #166534; margin-top: 8px; line-height: 1.6; background: #e7fdf0; border-radius: 12px; padding: 8px 12px; }
        .bmibar { position: relative; height: 6px; border-radius: 20px; overflow: hidden; background: linear-gradient(to right, #3b82f6 0%, #3b82f6 20%, #16a34a 20%, #16a34a 60%, #f59e0b 60%, #f59e0b 85%, #ef4444 85%, #ef4444 100%); }
        .bmipip { position: absolute; top: -4px; width: 14px; height: 14px; background: #1e3a5f; border: 3px solid #fff; border-radius: 50%; transform: translateX(-50%); transition: left 0.5s cubic-bezier(0.2,0.9,0.4,1.1); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .rw { position: relative; flex-shrink: 0; }
        .ri { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .gc {
          padding: 4px 12px;
          border-radius: 20px;
          border: 1.5px solid rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: rgba(255,255,255,0.8);
        }
        .gc[data-active="true"] {
          background: rgba(255,255,255,0.25);
          color: #fff;
          border-color: #fff;
        }
        .tbar { display: flex; background: #f1f5f9; border-radius: 12px; padding: 4px; gap: 4px; margin-bottom: 18px; }
        .tbtn { flex: 1; border: none; border-radius: 8px; padding: 10px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; background: transparent; color: #64748b; }
        .tbtn.on { background: #2563eb; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .moo { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; }
        .mosh { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 680px; max-height: 88vh; overflow-y: auto; }
        @media(min-width: 600px) { .moo { align-items: center; } .mosh { border-radius: 20px; max-height: 80vh; } }
        .mohdl { width: 44px; height: 5px; background: #d1d5db; border-radius: 20px; margin: 0 auto 20px; }
        .aopt { width: 100%; padding: 10px 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; text-align: left; background: #fff; cursor: pointer; transition: all 0.2s; margin-bottom: 6px; }
        .aopt.on { border-color: #2563eb; background: rgba(37,99,235,0.05); }
        .chart-w { width: 100%; height: 130px; min-width: 0; overflow: hidden; }
        .chart-wl { width: 100%; height: 180px; min-width: 0; overflow: hidden; }
        .erfolg-stat { display: flex; flex-direction: column; align-items: center; background: #f8fafc; border-radius: 12px; padding: 10px 12px; flex: 1; min-width: 80px; }
        .hinweis { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 12px 14px; font-size: 12px; color: #92400e; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .voice-warn { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 12px 14px; font-size: 12px; color: #9a3412; margin-bottom: 12px; }
        .sport-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; max-height: 280px; overflow-y: auto; padding: 4px; }
        .sport-card { display: flex; flex-direction: column; align-items: center; gap: 8px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 6px; cursor: pointer; transition: all 0.2s; }
        .sport-card.selected { border-color: #2563eb; background: rgba(37,99,235,0.05); transform: scale(0.98); }
        .sport-card:hover { background: #f1f5f9; transform: translateY(-2px); }
        .sport-icon { width: 40px; height: 40px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        .mini-dashboard { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
        .mini-card { flex: 1; min-width: 160px; background: #f8fafc; border-radius: 12px; padding: 10px; border: 1px solid #e2e8f0; overflow: hidden; }
        .mini-card h4 { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
        .mini-value { font-size: 18px; font-weight: 700; color: #1e3a5f; }
        .mini-unit { font-size: 10px; font-weight: 400; color: #64748b; }
        .mini-chart { height: 55px; width: 100%; margin-top: 8px; min-width: 0; overflow: hidden; }
        .abweichung-table { font-size: 10px; width: 100%; border-collapse: collapse; margin-top: 12px; }
        .abweichung-table th, .abweichung-table td { padding: 4px 2px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .abweichung-table th { color: #64748b; font-weight: 600; }
        .positiv { color: #16a34a; }
        .negativ { color: #dc2626; }
        .skeleton-chart { height: 130px; background: #e2e8f0; border-radius: 12px; animation: pulse 1.5s infinite; }
        @media (max-width: 480px) {
          .card, .card-dk { padding: 12px; }
          .hdr-logo { font-size: 16px; }
          .slbl { font-size: 10px; }
          .gc { font-size: 9px; padding: 4px 8px; }
          .sport-card { padding: 8px 4px; }
          .sport-icon { width: 36px; height: 36px; }
          .mini-card { min-width: 140px; }
          .mini-value { font-size: 16px; }
        }
        .bp:focus-visible, .bg:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
        .recipe-card { background: #f8fafc; border-radius: 16px; padding: 12px; margin-bottom: 12px; border-left: 4px solid #2563eb; }
        .recipe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .recipe-name { font-weight: 700; font-size: 14px; }
        .recipe-cal { font-weight: 600; color: #2563eb; }
        .recipe-explain { font-size: 12px; color: #475569; margin-top: 4px; }
        .fav-btn { background: none; border: none; cursor: pointer; color: #f59e0b; transition: transform 0.1s; }
        .fav-btn:hover { transform: scale(1.1); }
        .details-btn { background: none; border: none; cursor: pointer; color: #64748b; transition: color 0.2s; }
        .details-btn:hover { color: #2563eb; }
      `}</style>

      {/* FIX: removed dynamic --button-color CSS variable, all buttons are uniformly blue via CSS classes */}
      <div className="cp">
        <div className="hdr">
          <div className="hdr-r">
            <div className="hdr-logo">
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                <ArrowLeft size={22} />
              </button>
              FamilyHub
            </div>
            <div className="hdr-badge"><Flame size={14} />Kalorien & Fitness</div>
          </div>
        </div>

        <div className="main">
          <div className="card-grid fade-in">

            {/* MEINE DATEN */}
            <div className="sw card-full">
              <button className="stgl" onClick={() => setSettingsOpen(!settingsOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings size={14} />
                  <span>Meine Daten</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: saved ? '#f0fdf4' : '#fffbeb', color: saved ? '#16a34a' : '#d97706' }}>
                    {saved ? 'gespeichert' : 'neu'}
                  </span>
                </div>
                {settingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {settingsOpen && (
                <div className="sbody">
                  <div className="g2">
                    <div><label className="lbl">Alter</label><VoiceNumberInput value={profile.age} onChange={(val: any) => updProfile('age', parseInt(val) || 0)} className="inp" /></div>
                    <div><label className="lbl">Geschlecht</label><select className="sel" value={profile.gender} onChange={e => updProfile('gender', e.target.value)}><option value="male">Männlich</option><option value="female">Weiblich</option></select></div>
                    <div><label className="lbl">Gewicht (kg)</label><VoiceNumberInput value={profile.weight} onChange={(val: any) => updProfile('weight', parseFloat(val) || 0)} className="inp" /></div>
                    <div><label className="lbl">Größe (cm)</label><VoiceNumberInput value={profile.height} onChange={(val: any) => updProfile('height', parseInt(val) || 0)} className="inp" /></div>
                  </div>
                  <div>
                    <label className="lbl">Aktivitätslevel</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 6 }}>
                      {(Object.keys(ACTIVITY_MULTIPLIERS) as UserProfile['activityLevel'][]).map(lv => (
                        <button key={lv} className={`aopt ${profile.activityLevel === lv ? 'on' : ''}`} onClick={() => updProfile('activityLevel', lv)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 500 }}>{ACTIVITY_MULTIPLIERS[lv].label}</span><span>×{ACTIVITY_MULTIPLIERS[lv].value}</span></div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{ACTIVITY_MULTIPLIERS[lv].desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {result && (
                    <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '10px 14px', fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span><b>BMR</b> {result.bmr} kcal</span>
                      <span><b>TDEE</b> {result.tdee} kcal</span>
                      <span><b>Ziel ({goalMode === 'lose' ? 'Abnehmen' : goalMode === 'maintain' ? 'Halten' : 'Zunehmen'})</b> {result.goalCalories[goalMode]} kcal</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="bp" onClick={() => { safeLS.set(STORAGE_KEYS.profile, JSON.stringify(profile)); setSaved(true); }} disabled={saved} style={{ flex: 1, justifyContent: 'center' }}><Save size={13} />Speichern</button>
                    <button className="bg" onClick={() => { const d: UserProfile = { age: 30, gender: 'male', weight: 75, height: 175, activityLevel: 'moderate' }; setProfile(d); computeResult(d); safeLS.del(STORAGE_KEYS.profile); setSaved(false); }}><RotateCcw size={13} />Reset</button>
                  </div>
                </div>
              )}
            </div>

            {/* TAGESRING */}
            {result && (
              <div className="card-dk">
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {(['lose', 'maintain', 'gain'] as const).map(k => (
                    <button
                      key={k}
                      className="gc"
                      onClick={() => setGoalMode(k)}
                      data-active={goalMode === k}
                    >
                      {k === 'lose' ? `Abnehmen · ${result.goalCalories.lose}` : k === 'maintain' ? `Halten · ${result.goalCalories.maintain}` : `Zunehmen · ${result.goalCalories.gain}`}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="rw">
                    <Ring pct={pct} size={ringSize} color={ringColor} />
                    <div className="ri"><span style={{ fontSize: 18, fontWeight: 700 }}>{consumed}</span><span style={{ fontSize: 9 }}>gegessen</span></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{remaining}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{remaining > 0 ? 'kcal noch frei' : '🎯 Tagesziel erreicht!'}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>Ziel {target} · +{burned} verbrannt</div>
                    <div style={{ marginTop: 8, background: 'rgba(255,255,255,.2)', borderRadius: 20, height: 4 }}>
                      <div style={{ height: 4, borderRadius: 20, background: ringColor, width: `${Math.min(pct, 100)}%`, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                  {[{ val: consumed, lbl: 'Gegessen', col: '#ffd60a' }, { val: burned, lbl: 'Verbrannt', col: '#30d158' }, { val: target, lbl: 'Ziel', col: 'rgba(255,255,255,.7)' }].map(({ val, lbl, col }) => (
                    <div key={lbl} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '6px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{val}</div>
                      <div style={{ fontSize: 9, opacity: 0.7 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAHLZEITEN HEUTE */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="slbl" style={{ margin: 0 }}><UtensilsCrossed size={12} />Mahlzeiten heute</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="bp" onClick={() => setShowFood(true)}><Plus size={13} />Eintragen</button>
                  <button className="bg" onClick={() => setShowFoodToday(!showFoodToday)} style={{ padding: '0 10px' }}>
                    {showFoodToday ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showFoodToday ? 'ausblenden' : 'anzeigen'}
                  </button>
                </div>
              </div>
              {showFoodToday && (
                <>
                  {todayFood.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                      <Coffee size={24} style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 12 }}>Keine Mahlzeiten</div>
                    </div>
                  ) : (
                    todayFood.map(e => (
                      <div key={e.id} className="frow">
                        <div className="fico" style={{ fontSize: 22 }}>{getFoodEmoji(e.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{e.time}</div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{e.calories}</span>
                        <button className="bedit" onClick={() => setEditFood(e)}><Edit2 size={13} /></button>
                        <button className="bdel" onClick={() => setFoodEntries(p => p.filter(x => x.id !== e.id))}><Trash2 size={13} /></button>
                      </div>
                    ))
                  )}
                  {todayFood.length > 0 && (
                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{todayFood.length} Einträge</span>
                      <span style={{ fontWeight: 700 }}>{consumed} kcal</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* AKTIVITÄTEN HEUTE */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="slbl" style={{ margin: 0 }}><Dumbbell size={12} />Aktivitäten heute</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="bp" onClick={() => setShowActivity(true)}><Plus size={13} />Eintragen</button>
                  <button className="bg" onClick={() => setShowActivityToday(!showActivityToday)} style={{ padding: '0 10px' }}>
                    {showActivityToday ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showActivityToday ? 'ausblenden' : 'anzeigen'}
                  </button>
                </div>
              </div>
              {showActivityToday && (
                <>
                  {todayActs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 12 }}>Noch keine Aktivität</div>
                  ) : (
                    todayActs.map(a => {
                      const sportObj = SPORTS.find(s => s.name === a.sport);
                      const Icon = sportObj?.icon || Activity;
                      return (
                        <div key={a.id} className="frow">
                          <div className="fico"><Icon size={20} strokeWidth={1.5} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.sport}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{a.durationMinutes} min</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#30d158', flexShrink: 0 }}>−{a.caloriesBurned}</span>
                          <button className="bdel" onClick={() => setActivities(p => p.filter(x => x.id !== a.id))}><Trash2 size={13} /></button>
                        </div>
                      );
                    })
                  )}
                </>
              )}
              <button className="bg" onClick={() => setShowActHist(!showActHist)} style={{ width: '100%', justifyContent: 'center', marginTop: 10, height: 36 }}>
                {showActHist ? <ChevronUp size={12} /> : <ChevronDown size={12} />}Verlauf
              </button>
              {showActHist && activities.slice(0, 10).map(a => (
                <div key={a.id} className="erow">
                  <span style={{ width: 70, color: '#64748b' }}>{a.date}</span>
                  <span style={{ flex: 1 }}>{a.sport}</span>
                  <span style={{ color: '#30d158' }}>{a.caloriesBurned}</span>
                  <button className="bdel" onClick={() => setActivities(p => p.filter(x => x.id !== a.id))}><Trash2 size={11} /></button>
                </div>
              ))}
            </div>

            {/* GEWICHT & KÖRPER */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="slbl" style={{ margin: 0 }}><Scale size={12} />Gewicht & Körper</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="bp" onClick={() => setShowWeight(true)}><Plus size={13} />Eintragen</button>
                  <button className="bic" onClick={() => setShowBt(true)}><Bluetooth size={14} /></button>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{profile.weight}<span style={{ fontSize: 18 }}> kg</span></div>
                <div style={{ fontSize: 12, color: '#64748b' }}>BMI {bmi.toFixed(1)} · <span style={{ color: bmiCat.color }}>{bmiCat.label}</span></div>
              </div>
              <div className="bmibar"><div className="bmipip" style={{ left: `${bmiPct}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', margin: '4px 0 12px' }}>
                <span>Unter</span><span>Normal</span><span>Über</span><span>Adipositas</span>
              </div>
              <div className="g2" style={{ gap: 8 }}>
                <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#0369a1' }}>Idealgewicht</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{ideal.lo}–{ideal.hi} kg</div>
                </div>
                {overBy > 0 ? (
                  <div style={{ background: '#fff7ed', borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#c2410c' }}>Bis Ideal</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{overBy} kg</div>
                    <div style={{ fontSize: 10 }}>abzunehmen</div>
                  </div>
                ) : underBy > 0 ? (
                  <div style={{ background: '#eff6ff', borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#1d4ed8' }}>Bis Normal</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{underBy} kg</div>
                    <div style={{ fontSize: 10 }}>zuzunehmen</div>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>🎯</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Idealgewicht!</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 8 }}>
                <button className={weightRangeMode === 'last7' ? 'bp' : 'bg'} style={{ padding: '0 12px', height: 32, fontSize: 11 }} onClick={() => setWeightRangeMode('last7')}>7 Tage</button>
                <button className={weightRangeMode === 'custom' ? 'bp' : 'bg'} style={{ padding: '0 12px', height: 32, fontSize: 11 }} onClick={() => setWeightRangeMode('custom')}>Zeitraum</button>
                {weightRangeMode === 'custom' && weightStart && (
                  <input type="date" className="inp" value={weightStart} onChange={e => setWeightStart(e.target.value)} style={{ height: 32, fontSize: 11, flex: 1 }} />
                )}
              </div>
              {chartsReady && filteredWeights().length > 0 ? (
                <div className="chart-w">
                  <ResponsiveLineChart data={filteredWeights()} height={130} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis domain={['auto', 'auto']} unit="kg" tick={{ fontSize: 9, fill: '#64748b' }} width={30} />
                    <Tooltip formatter={(v: any) => `${v} kg`} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    <Line type="monotone" dataKey="weight" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 2 }} />
                  </ResponsiveLineChart>
                </div>
              ) : chartsReady ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>Keine Daten im Zeitraum</p>
              ) : (
                <div className="skeleton-chart" />
              )}
              <button className="bg" onClick={() => setShowWChart(!showWChart)} style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 36 }}>
                {showWChart ? <ChevronUp size={12} /> : <ChevronDown size={12} />}Alle Einträge
              </button>
              {showWChart && weightEntries.slice().reverse().slice(0, 8).map(e => (
                <div key={e.id} className="erow">
                  <span>{e.date}</span>
                  <span style={{ fontWeight: 600 }}>{e.weight} kg</span>
                  <button className="bdel" onClick={() => setWeightEntries(p => p.filter(w => w.id !== e.id))}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>

            {/* KALORIENPLAN & VORSCHLÄGE */}
            <div className="card">
              <div className="slbl"><Target size={12} /> Kalorienplan</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8 }}>
                  <input type="checkbox" checked={useManualLimit} onChange={e => setUseManualLimit(e.target.checked)} />
                  Manuelles Limit verwenden
                </label>
                {useManualLimit && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <VoiceNumberInput value={calorieLimitManual || ''} onChange={(val: any) => setCalorieLimitManual(parseInt(val) || null)} className="inp" placeholder="z.B. 2200" />
                    <span>kcal</span>
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  Aktuelles Limit: <strong>{getCurrentLimit()} kcal</strong> {useManualLimit ? '(manuell)' : `(${goalMode === 'lose' ? 'Abnehmen' : goalMode === 'maintain' ? 'Halten' : 'Zunehmen'})`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="bp" onClick={() => generateDailySuggestions(getCurrentLimit())}>
                  <Sparkles size={14} /> Vorschläge
                </button>
                {showRecipeSuggestions && (
                  <button className="bg" onClick={() => generateDailySuggestions(getCurrentLimit())}>
                    <RefreshCw size={14} /> Neue Vorschläge
                  </button>
                )}
              </div>

              {showRecipeSuggestions && currentRecipes.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>🍽️ Dein Tagesplan (Vorschlag)</span>
                    <span className="recipe-cal">Gesamt: {currentRecipes.reduce((s, r) => s + r.calories, 0)} kcal</span>
                  </div>
                  {currentRecipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card">
                      <div className="recipe-header">
                        <span className="recipe-name">{recipe.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="recipe-cal">{recipe.calories} kcal</span>
                          <button className="fav-btn" onClick={() => toggleFavorite(recipe)}>
                            {favoriteRecipes.some(r => r.id === recipe.id) ? <Star size={16} fill="#f59e0b" /> : <Star size={16} />}
                          </button>
                          <button className="details-btn" onClick={() => setSelectedRecipe(recipe)}>
                            <BookOpen size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="recipe-explain">{recipe.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MEINE FAVORITEN */}
            <div className="card">
              <div className="slbl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={12} fill="#f59e0b" /> Meine Favoriten</span>
                <button className="bg" onClick={() => setShowFavorites(!showFavorites)} style={{ padding: '4px 10px', height: 28 }}>
                  {showFavorites ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showFavorites ? 'ausblenden' : 'einblenden'}
                </button>
              </div>
              {showFavorites && (
                <>
                  {favoriteRecipes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
                      Keine Favoriten gespeichert.<br />Klicke auf den Stern bei einem Rezept.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                      {favoriteRecipes.map(recipe => (
                        <div key={recipe.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{recipe.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{recipe.calories} kcal</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="details-btn" onClick={() => setSelectedRecipe(recipe)}>
                              <BookOpen size={14} />
                            </button>
                            <button onClick={() => toggleFavorite(recipe)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97706' }}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ANALYSE & PROGNOSE */}
            <div className="card card-full">
              <div className="slbl"><Target size={12} /> Analyse & Prognose</div>
              <div className="mini-dashboard">
                <div className="mini-card">
                  <h4><TrendingUp size={12} /> Bisheriger Fortschritt</h4>
                  {sortedW.length >= 2 ? (
                    <>
                      <div className="mini-value">{Math.abs(wdiff.diff).toFixed(1)} <span className="mini-unit">kg</span></div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        {wdiff.diff <= 0 ? 'Abgenommen' : 'Zugenommen'} (Ø {Math.abs(wdiff.weeklyRate).toFixed(2)} kg/Woche)
                      </div>
                      <div className="mini-chart">
                        <ResponsiveAreaChart data={successData.slice(-7)} height={55} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <Area type="monotone" dataKey="weight" stroke="#1e3a5f" strokeWidth={1.5} fill="#e2e8f0" dot={false} />
                        </ResponsiveAreaChart>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>Gewicht eintragen</div>
                  )}
                </div>
                <div className="mini-card">
                  <h4><Activity size={12} /> 8‑Wochen‑Prognose</h4>
                  {projectedTrend8w !== null && projectedPlan8w !== null ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div><span style={{ fontSize: 10, color: '#64748b' }}>Plan</span><br /><span className="mini-value">{projectedPlan8w.toFixed(1)} kg</span></div>
                        <div><span style={{ fontSize: 10, color: '#64748b' }}>Trend</span><br /><span className="mini-value">{projectedTrend8w.toFixed(1)} kg</span></div>
                        <div>
                          <span style={{ fontSize: 10, color: '#64748b' }}>Differenz</span><br />
                          <span className={`mini-value ${(projectedTrend8w - projectedPlan8w) > 0 ? 'negativ' : 'positiv'}`}>
                            {(projectedTrend8w - projectedPlan8w).toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                      <div className="mini-chart">
                        <ResponsiveLineChart data={combinedPrognose} height={55} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <Line type="monotone" dataKey="planPrognose" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Plan" />
                          <Line type="monotone" dataKey="trendPrognose" stroke="#16a34a" strokeWidth={1.5} dot={false} name="Trend" />
                          <Line type="monotone" dataKey="actual" stroke="#1e3a5f" strokeWidth={1.5} dot={{ r: 1.5 }} name="Ist" />
                          <Tooltip contentStyle={{ fontSize: 10 }} />
                        </ResponsiveLineChart>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 10, color: '#64748b', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                        📅 In 8 Wochen: {formatted8WeeksDate}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>Genügend Gewichtsdaten für Trend benötigt</div>
                  )}
                </div>
              </div>
              {deviationData.length > 0 && deviationData.some(d => d.actual !== null) && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={12} /> Abweichung vom Plan (Soll/Ist)
                  </h4>
                  <table className="abweichung-table">
                    <thead>
                      <tr><th>Woche</th><th>Soll (kg)</th><th>Ist (kg)</th><th>Abweichung</th></tr>
                    </thead>
                    <tbody>
                      {deviationData.map((d, idx) => (
                        <tr key={idx}>
                          <td>{d.week}</td>
                          <td>{d.plan ?? '–'}</td>
                          <td>{d.actual ?? '–'}</td>
                          <td className={d.deviation !== null ? (d.deviation > 0 ? 'negativ' : 'positiv') : ''}>
                            {d.deviation !== null ? (d.deviation > 0 ? `+${d.deviation}` : d.deviation) : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                    Positive Abweichung = mehr Gewicht als geplant.
                  </div>
                </div>
              )}
            </div>

            {/* 7 TAGE KALORIEN */}
            <div className="card card-full">
              <div className="slbl"><Activity size={12} /> Kalorien der letzten 7 Tage</div>
              {chartsReady && last7.some(d => d.eat > 0 || d.burn > 0) ? (
                <div className="chart-w" style={{ height: 140 }}>
                  <ResponsiveBarChart data={last7} height={140} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="d" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} width={35} />
                    <Tooltip formatter={(v: any) => `${v} kcal`} />
                    {result && <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `Ziel ${target}`, position: 'right', fontSize: 9, fill: '#f59e0b' }} />}
                    <Bar dataKey="eat" fill="#1e3a5f" name="Gegessen" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="burn" fill="#30d158" name="Verbrannt" radius={[4, 4, 0, 0]} />
                  </ResponsiveBarChart>
                </div>
              ) : chartsReady ? (
                <p style={{ textAlign: 'center', padding: 20 }}>Noch keine Daten für die letzte Woche</p>
              ) : (
                <div className="skeleton-chart" style={{ height: 140 }} />
              )}
              <button className="bg" onClick={() => setShowFoodHist(!showFoodHist)} style={{ width: '100%', justifyContent: 'center', marginTop: 12, height: 36 }}>
                {showFoodHist ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Alle Mahlzeiten
              </button>
              {showFoodHist && foodEntries.slice(0, 20).map(e => (
                <div key={e.id} className="erow">
                  <span style={{ width: 58 }}>{e.date}</span>
                  <span style={{ width: 36 }}>{e.time}</span>
                  <span style={{ width: 24 }}>{getFoodEmoji(e.name)}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{e.calories}</span>
                  <button className="bedit" onClick={() => setEditFood(e)}><Edit2 size={11} /></button>
                  <button className="bdel" onClick={() => setFoodEntries(p => p.filter(x => x.id !== e.id))}><Trash2 size={11} /></button>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {showFood && <FoodModal onClose={() => setShowFood(false)} onSave={e => setFoodEntries(p => [{ id: Date.now().toString(), ...e }, ...p])} />}
      {showActivity && <ActivityModal weight={profile.weight} onClose={() => setShowActivity(false)} onSave={a => setActivities(p => [{ id: Date.now().toString(), ...a }, ...p])} />}
      {showWeight && <WeightModal onClose={() => setShowWeight(false)} onSave={saveWeight} currentWeight={profile.weight} />}
      {showBt && <BtModal onClose={() => setShowBt(false)} onRead={w => saveWeight(w, todayStr())} />}
      {editFood && <EditCalModal entry={editFood} onClose={() => setEditFood(null)} onSave={(id, cal) => setFoodEntries(p => p.map(e => e.id === id ? { ...e, calories: cal } : e))} />}
      {selectedRecipe && <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </>
  );
}