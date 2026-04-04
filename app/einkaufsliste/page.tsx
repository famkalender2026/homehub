"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import VoiceInput from '@/components/ui/VoiceInput';
import {
  Heart, Search, Utensils, X, ShoppingCart, Calendar, Sparkles,
  Flame, Plus, Trash2, Camera, Edit2, Star, Users, Clock,
  ChefHat, Apple, Dumbbell, Target, TrendingDown, Lightbulb,
  Filter, Check, Egg, Milk, Wheat, Leaf
} from 'lucide-react';

// ============== TYPES ==============
interface Recipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strTags?: string;
  strYoutube?: string;
  [key: string]: any;
}

interface WeekPlan {
  day: string;
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
}

interface CalorieEntry {
  id: string;
  food: string;
  calories: number;
  date: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goalWeight: number;
  goalMonths: number;
}

interface CustomRecipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  rating: number;
  tags: string[];
  imageUrl?: string;
}

interface AITip {
  title: string;
  description: string;
  icon: string;
}

// ============== DESIGN TOKENS ==============
const ocean = {
  50:  '#e8f4fd',
  100: '#c5e4f8',
  200: '#9dd0f2',
  300: '#63b3e8',
  400: '#2e90d9',
  500: '#1a72b8',
  600: '#125a96',
  700: '#0d4474',
  800: '#08305a',
  900: '#041e3a',
};

// ============== GLOBAL STYLES ==============
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  .rs-root {
    --ocean-50: #e8f4fd;
    --ocean-100: #c5e4f8;
    --ocean-200: #9dd0f2;
    --ocean-300: #63b3e8;
    --ocean-400: #2e90d9;
    --ocean-500: #1a72b8;
    --ocean-600: #125a96;
    --ocean-700: #0d4474;
    --ocean-800: #08305a;
    --ocean-900: #041e3a;
    --surface: #ffffff;
    --surface-2: #f4f7fb;
    --surface-3: #eaf1f9;
    --border: rgba(18, 90, 150, 0.12);
    --border-md: rgba(18, 90, 150, 0.22);
    --text-primary: #0a1a2e;
    --text-secondary: #4a647d;
    --text-muted: #8aa4bb;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    font-family: 'DM Sans', -apple-system, sans-serif;
    color: var(--text-primary);
  }

  .rs-tab-bar {
    display: flex;
    gap: 2px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .rs-tab-bar::-webkit-scrollbar { display: none; }

  .rs-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: all 0.18s ease;
    background: transparent;
    color: var(--text-secondary);
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .rs-tab:hover { background: rgba(46, 144, 217, 0.08); color: var(--ocean-600); }
  .rs-tab.active {
    background: var(--surface);
    color: var(--ocean-600);
    box-shadow: 0 1px 4px rgba(18, 90, 150, 0.15), 0 0 0 1px rgba(18, 90, 150, 0.08);
    font-weight: 600;
  }

  .rs-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    transition: box-shadow 0.15s ease;
  }
  .rs-card-hover:hover {
    box-shadow: 0 4px 16px rgba(18, 90, 150, 0.12);
    border-color: var(--border-md);
  }

  .rs-hero-card {
    background: linear-gradient(135deg, var(--ocean-600) 0%, var(--ocean-800) 100%);
    border-radius: var(--radius-xl);
    padding: 24px;
    color: white;
    position: relative;
    overflow: hidden;
  }
  .rs-hero-card::before {
    content: '';
    position: absolute;
    top: -30px; right: -30px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  .rs-hero-card::after {
    content: '';
    position: absolute;
    bottom: -20px; left: -20px;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }

  .rs-search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0 12px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rs-search-wrap:focus-within {
    border-color: var(--ocean-400);
    box-shadow: 0 0 0 3px rgba(46, 144, 217, 0.12);
    background: var(--surface);
  }
  .rs-search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 11px 0;
    font-size: 14px;
    font-family: inherit;
    color: var(--text-primary);
    outline: none;
  }
  .rs-search-input::placeholder { color: var(--text-muted); }

  .rs-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    letter-spacing: 0.02em;
  }
  .rs-btn-primary {
    background: var(--ocean-500);
    color: white;
  }
  .rs-btn-primary:hover { background: var(--ocean-600); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(18, 90, 150, 0.25); }
  .rs-btn-primary:active { transform: translateY(0); box-shadow: none; }
  .rs-btn-secondary {
    background: var(--surface-3);
    color: var(--ocean-600);
    border: 1px solid var(--border-md);
  }
  .rs-btn-secondary:hover { background: var(--ocean-50); border-color: var(--ocean-300); }
  .rs-btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;
    padding: 8px 10px;
  }
  .rs-btn-ghost:hover { background: var(--surface-3); color: var(--ocean-600); }
  .rs-btn-icon {
    width: 36px; height: 36px;
    padding: 0;
    border-radius: 10px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    color: var(--text-secondary);
  }
  .rs-btn-icon:hover { background: var(--ocean-50); color: var(--ocean-500); border-color: var(--ocean-200); }
  .rs-btn-sm { padding: 7px 13px; font-size: 12px; }

  .rs-filter-group {
    display: flex;
    gap: 4px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 3px;
  }
  .rs-filter-btn {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
  }
  .rs-filter-btn.active {
    background: var(--surface);
    color: var(--ocean-600);
    box-shadow: 0 1px 3px rgba(18, 90, 150, 0.12);
    font-weight: 600;
  }

  .rs-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    font-family: inherit;
  }
  .rs-tag-ocean { background: var(--ocean-50); color: var(--ocean-700); border-color: var(--ocean-200); }
  .rs-tag-blue { background: #e8f4fd; color: #125a96; border-color: #9dd0f2; }
  .rs-tag-amber { background: #fef3e2; color: #9a5000; border-color: #f9c95c; }
  .rs-tag-ocean.active, .rs-tag-blue.active { background: var(--ocean-500); color: white; border-color: var(--ocean-500); }

  .rs-recipe-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .rs-recipe-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .rs-recipe-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(18, 90, 150, 0.14);
    border-color: var(--border-md);
  }
  .rs-recipe-img-wrap { position: relative; }
  .rs-recipe-img { width: 100%; height: 130px; object-fit: cover; display: block; }
  .rs-recipe-fav {
    position: absolute; top: 8px; right: 8px;
    width: 30px; height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer;
    backdrop-filter: blur(4px);
    transition: transform 0.15s;
  }
  .rs-recipe-fav:hover { transform: scale(1.15); }
  .rs-recipe-kcal {
    position: absolute; bottom: 8px; left: 8px;
    background: rgba(4, 30, 58, 0.72);
    color: white;
    font-size: 11px; font-weight: 500;
    padding: 3px 8px;
    border-radius: 20px;
    display: flex; align-items: center; gap: 3px;
    backdrop-filter: blur(4px);
  }
  .rs-recipe-body { padding: 12px; }
  .rs-recipe-name { font-size: 13px; font-weight: 600; margin: 0 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rs-recipe-cat { font-size: 11px; color: var(--text-muted); margin: 0; }

  .rs-sub-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0;
  }
  .rs-sub-tab {
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    font-family: inherit;
    display: flex; align-items: center; gap: 5px;
    margin-bottom: -1px;
  }
  .rs-sub-tab.active { color: var(--ocean-500); border-bottom-color: var(--ocean-500); font-weight: 600; }
  .rs-sub-tab:hover:not(.active) { color: var(--ocean-400); background: var(--ocean-50); border-radius: 8px 8px 0 0; }

  .rs-section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 10px;
  }

  .rs-input {
    width: 100%;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-size: 14px;
    font-family: inherit;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .rs-input:focus {
    border-color: var(--ocean-400);
    background: var(--surface);
    box-shadow: 0 0 0 3px rgba(46, 144, 217, 0.1);
  }
  .rs-input::placeholder { color: var(--text-muted); }

  .rs-select {
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-size: 13px;
    font-family: inherit;
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .rs-select:focus { border-color: var(--ocean-400); box-shadow: 0 0 0 3px rgba(46, 144, 217, 0.1); }

  .rs-progress-bar {
    height: 6px;
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 12px;
  }
  .rs-progress-fill {
    height: 100%;
    background: rgba(255,255,255,0.9);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .rs-weekday-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px;
    margin-bottom: 10px;
  }
  .rs-meal-slot {
    border: 1.5px dashed var(--border-md);
    border-radius: var(--radius-md);
    padding: 10px;
    text-align: center;
    min-height: 80px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transition: all 0.15s;
    cursor: pointer;
  }
  .rs-meal-slot:hover { border-color: var(--ocean-300); background: var(--ocean-50); }
  .rs-meal-slot.filled { border-style: solid; border-color: var(--ocean-200); background: var(--ocean-50); padding: 6px; }

  .rs-entry-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    transition: background 0.12s;
  }
  .rs-entry-row:hover { background: var(--surface-3); }

  .rs-badge {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 11px; font-weight: 500;
    white-space: nowrap;
  }
  .rs-badge-ocean { background: var(--ocean-50); color: var(--ocean-700); }
  .rs-badge-amber { background: #fef3e2; color: #7a3e00; }
  .rs-badge-red { background: #fef0f0; color: #b91c1c; }
  .rs-badge-green { background: #edf7ed; color: #166534; }

  .rs-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px; font-weight: 500;
    background: var(--ocean-500);
    color: white;
  }
  .rs-chip-ghost {
    background: var(--ocean-50);
    color: var(--ocean-700);
    border: 1px solid var(--ocean-200);
  }

  .rs-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 24px;
    color: var(--text-muted);
    text-align: center;
    gap: 12px;
  }

  .rs-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(4, 30, 58, 0.55);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 50;
    padding: 16px;
  }
  .rs-modal {
    background: var(--surface);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border);
    box-shadow: 0 24px 64px rgba(4, 30, 58, 0.25);
  }
  .rs-modal-inner { padding: 24px; }

  .rs-lunchbox-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px;
    transition: all 0.18s;
  }
  .rs-lunchbox-card:hover { box-shadow: 0 4px 16px rgba(18, 90, 150, 0.1); border-color: var(--border-md); }

  .rs-star { cursor: pointer; transition: transform 0.1s; }
  .rs-star:hover { transform: scale(1.2); }

  .rs-skeleton {
    background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
    background-size: 200% 100%;
    animation: rs-shimmer 1.4s infinite;
    border-radius: var(--radius-sm);
  }
  @keyframes rs-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .rs-divider { height: 1px; background: var(--border); margin: 16px 0; }

  .rs-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; display: block; }
`;

// ============== HELPER FUNCTIONS ==============
const getSeasonalTips = (): AITip[] => {
  const month = new Date().getMonth();
  const tips: AITip[] = [
    { title: 'Ausgewogene Ernährung', description: 'Bunte Mischung aus Gemüse und Obst für optimale Nährstoffe.', icon: '🥗' },
  ];
  if (month >= 11 || month <= 1) {
    tips.push({ title: 'Wintergemüse', description: 'Regionaler Kohl und Wurzelgemüse sind jetzt perfekt!', icon: '🥬' });
  } else if (month >= 5 && month <= 7) {
    tips.push({ title: 'Sommerküche', description: 'Leichte Salate und Grillgerichte für warme Tage.', icon: '🌞' });
  }
  tips.push({ title: 'Meal Prep', description: 'Bereite am Wochenende Gerichte vor.', icon: '⏱️' });
  return tips;
};

const calculateDailyCalories = (profile: UserProfile): number => {
  let bmr;
  if (profile.gender === 'male') {
    bmr = 88.362 + 13.397 * profile.weight + 4.799 * profile.height - 5.677 * profile.age;
  } else {
    bmr = 447.593 + 9.247 * profile.weight + 3.098 * profile.height - 4.33 * profile.age;
  }
  const activityMultipliers = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const weeklyDeficit = ((profile.weight - profile.goalWeight) * 7700) / (profile.goalMonths * 4.33);
  return Math.round(tdee - weeklyDeficit / 7);
};

const BROTZEIT_SUGGESTIONS: Record<string, { name: string; ingredients: string[]; calories: number; healthy: boolean }[]> = {
  child: [
    { name: 'Obst-Teller mit Käse', ingredients: ['Äpfel', 'Trauben', 'Käse-Würfel', 'Karottenstifte'], calories: 250, healthy: true },
    { name: 'Vollkornbrot mit Aufstrich', ingredients: ['Vollkornbrot', 'Frischkäse', 'Gurke', 'Tomate'], calories: 300, healthy: true },
    { name: 'Reiswaffeln mit Hummus', ingredients: ['Reiswaffeln', 'Hummus', 'Paprika'], calories: 200, healthy: true },
  ],
  teen: [
    { name: 'Pauli Bento-Box', ingredients: ['Vollkorn-Reis', 'Chicken-Nuggets', 'Brokkoli', 'Mango'], calories: 450, healthy: true },
    { name: 'Protein-Box', ingredients: ['Pita', 'Hummus', 'Feta', 'Oliven', 'Kirschtomaten'], calories: 400, healthy: true },
    { name: 'Smoothie-Bowl', ingredients: ['Joghurt', 'Beeren', 'Granola', 'Bananen'], calories: 350, healthy: true },
  ],
  adult: [
    { name: 'Mediterrane Brotzeit', ingredients: ['Ciabatta', 'Olivenöl', 'getrocknete Tomaten', 'Burrata'], calories: 380, healthy: true },
    { name: 'Asiatische Bento', ingredients: ['Sushi-Reis', 'Edamame', 'Lachs', 'Wasabi'], calories: 420, healthy: true },
    { name: 'Power-Salat-Box', ingredients: ['Rucola', 'Kichererbsen', 'Feta', 'Walnüsse', 'Granatapfel'], calories: 350, healthy: true },
  ],
};

// ============== KOMPONENTE ==============
interface RecipeSearchProps {
  onAddToShoppingList?: (ingredients: string[]) => void;
}

const RecipeSearch: React.FC<RecipeSearchProps> = ({ onAddToShoppingList }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'weekplan' | 'calories' | 'lunchbox' | 'custom' | 'whatcanicook'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesRecipes, setFavoritesRecipes] = useState<Recipe[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const [weekPlan, setWeekPlan] = useState<WeekPlan[]>([]);
  const [calorieEntries, setCalorieEntries] = useState<CalorieEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: 30, gender: 'male', weight: 80, height: 180,
    activityLevel: 'moderate', goalWeight: 75, goalMonths: 3,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newCalorieEntry, setNewCalorieEntry] = useState({ food: '', calories: '', mealType: 'snack' as const });

  const [lunchboxAge, setLunchboxAge] = useState<'child' | 'teen' | 'adult'>('adult');
  const [showHealthyOnly, setShowHealthyOnly] = useState(false);

  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);
  const [newCustomRecipe, setNewCustomRecipe] = useState<Partial<CustomRecipe>>({
    name: '', ingredients: [], instructions: '', calories: 0, rating: 0, tags: [],
  });
  const [ingredientInput, setIngredientInput] = useState('');

  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [cookableRecipes, setCookableRecipes] = useState<Recipe[]>([]);

  const [dietFilter, setDietFilter] = useState<'all' | 'vegan' | 'vegetarian'>('all');
  const [intoleranceFilter, setIntoleranceFilter] = useState<{ lactose: boolean; gluten: boolean }>({
    lactose: false, gluten: false,
  });

  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
  const mealLabels = { breakfast: 'Frühstück', lunch: 'Mittag', dinner: 'Abendessen' };

  useEffect(() => {
    const savedFavorites = localStorage.getItem('recipeFavorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedWeekPlan = localStorage.getItem('weekPlan');
    if (savedWeekPlan) setWeekPlan(JSON.parse(savedWeekPlan));
    else setWeekPlan(weekDays.map((day) => ({ day })));
    const savedCalories = localStorage.getItem('calorieEntries');
    if (savedCalories) setCalorieEntries(JSON.parse(savedCalories));
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    const savedCustom = localStorage.getItem('customRecipes');
    if (savedCustom) setCustomRecipes(JSON.parse(savedCustom));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCalories = calorieEntries.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.calories, 0);
  const recommendedCalories = calculateDailyCalories(userProfile);

  const searchRecipes = async (query: string) => {
    if (!query.trim()) { setRecipes([]); return; }
    setLoading(true);
    try {
      let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
      if (dietFilter === 'vegetarian') url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian`;
      if (dietFilter === 'vegan') url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegan`;
      const response = await fetch(url);
      const data = await response.json();
      let results = data.meals || [];
      if (intoleranceFilter.gluten) {
        results = results.filter((r: Recipe) => {
          const ings = getIngredientsList(r);
          return !ings.some(i => i.toLowerCase().includes('wheat') || i.toLowerCase().includes('bread') || i.toLowerCase().includes('pasta'));
        });
      }
      if (intoleranceFilter.lactose) {
        results = results.filter((r: Recipe) => {
          const ings = getIngredientsList(r);
          return !ings.some(i => i.toLowerCase().includes('milk') || i.toLowerCase().includes('cheese') || i.toLowerCase().includes('cream'));
        });
      }
      setRecipes(results);
    } catch { setRecipes([]); } finally { setLoading(false); }
  };

  const getIngredients = (recipe: Recipe): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient?.trim()) ingredients.push(`${measure || ''} ${ingredient}`.trim());
    }
    return ingredients;
  };

  const getIngredientsList = (recipe: Recipe): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      if (ingredient?.trim()) ingredients.push(ingredient.trim());
    }
    return ingredients;
  };

  const estimateCalories = (recipe: Recipe): number => {
    const category = recipe.strCategory?.toLowerCase() || '';
    if (category.includes('beef') || category.includes('lamb') || category.includes('pork')) return 650;
    if (category.includes('chicken')) return 450;
    if (category.includes('seafood') || category.includes('fish')) return 350;
    if (category.includes('vegetarian') || category.includes('vegan')) return 380;
    if (category.includes('dessert')) return 500;
    if (category.includes('breakfast')) return 400;
    if (category.includes('pasta')) return 550;
    return 450;
  };

  const toggleFavorite = (recipeId: string) => {
    const newFavorites = favorites.includes(recipeId)
      ? favorites.filter((id) => id !== recipeId)
      : [...favorites, recipeId];
    setFavorites(newFavorites);
    localStorage.setItem('recipeFavorites', JSON.stringify(newFavorites));
    if (newFavorites.includes(recipeId)) {
      const recipe = recipes.find(r => r.idMeal === recipeId);
      if (recipe) setFavoritesRecipes(prev => [...prev.filter(r => r.idMeal !== recipeId), recipe]);
    } else {
      setFavoritesRecipes(prev => prev.filter(r => r.idMeal !== recipeId));
    }
  };

  const loadFavoritesRecipes = async () => {
    if (favorites.length === 0) { setFavoritesRecipes([]); return; }
    setLoading(true);
    try {
      const loadedRecipes: Recipe[] = [];
      for (const id of favorites) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        if (data.meals?.[0]) loadedRecipes.push(data.meals[0]);
      }
      setFavoritesRecipes(loadedRecipes);
    } catch {} finally { setLoading(false); }
  };

  const loadRecipeDetails = async (id: string) => {
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await response.json();
      if (data.meals?.[0]) setSelectedRecipe(data.meals[0]);
    } catch {}
  };

  const addToWeekPlan = (recipe: Recipe, dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const newPlan = [...weekPlan];
    newPlan[dayIndex] = { ...newPlan[dayIndex], [mealType]: recipe };
    setWeekPlan(newPlan);
    localStorage.setItem('weekPlan', JSON.stringify(newPlan));
  };

  const removeFromWeekPlan = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const newPlan = [...weekPlan];
    delete (newPlan[dayIndex] as any)[mealType];
    setWeekPlan(newPlan);
    localStorage.setItem('weekPlan', JSON.stringify(newPlan));
  };

  const getDayCalories = (dayPlan: WeekPlan): number => {
    let total = 0;
    if (dayPlan.breakfast) total += estimateCalories(dayPlan.breakfast);
    if (dayPlan.lunch) total += estimateCalories(dayPlan.lunch);
    if (dayPlan.dinner) total += estimateCalories(dayPlan.dinner);
    return total;
  };

  const addCalorieEntry = () => {
    if (!newCalorieEntry.food || !newCalorieEntry.calories) return;
    const entry: CalorieEntry = {
      id: Date.now().toString(),
      food: newCalorieEntry.food,
      calories: parseInt(newCalorieEntry.calories),
      date: todayStr,
      mealType: newCalorieEntry.mealType,
    };
    const newEntries = [...calorieEntries, entry];
    setCalorieEntries(newEntries);
    localStorage.setItem('calorieEntries', JSON.stringify(newEntries));
    setNewCalorieEntry({ food: '', calories: '', mealType: 'snack' });
  };

  const processVoiceCalories = (text: string) => {
    const match = text.match(/(\d+)\s*(kalorien|cal|kcal)/i);
    if (match) setNewCalorieEntry(prev => ({ ...prev, calories: match[1] }));
    const foodName = text.replace(/\d+\s*(kalorien|cal|kcal)/gi, '').trim();
    if (foodName) setNewCalorieEntry(prev => ({ ...prev, food: foodName }));
  };

  const addIngredientToCustom = () => {
    if (!ingredientInput.trim()) return;
    setNewCustomRecipe(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), ingredientInput.trim()] }));
    setIngredientInput('');
  };

  const removeIngredientFromCustom = (index: number) => {
    setNewCustomRecipe(prev => ({ ...prev, ingredients: prev.ingredients?.filter((_, i) => i !== index) }));
  };

  const saveCustomRecipe = () => {
    if (!newCustomRecipe.name || !newCustomRecipe.ingredients?.length) return;
    const recipe: CustomRecipe = {
      id: Date.now().toString(),
      name: newCustomRecipe.name,
      ingredients: newCustomRecipe.ingredients,
      instructions: newCustomRecipe.instructions || '',
      calories: newCustomRecipe.calories || 0,
      rating: newCustomRecipe.rating || 0,
      tags: newCustomRecipe.tags || [],
    };
    const newRecipes = [...customRecipes, recipe];
    setCustomRecipes(newRecipes);
    localStorage.setItem('customRecipes', JSON.stringify(newRecipes));
    setNewCustomRecipe({ name: '', ingredients: [], instructions: '', calories: 0, rating: 0, tags: [] });
  };

  const searchWhatCanICook = async () => {
    if (availableIngredients.length === 0) return;
    setLoading(true);
    try {
      const allMatches: Recipe[] = [];
      for (const ingredient of availableIngredients.slice(0, 5)) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
        const data = await response.json();
        if (data.meals) allMatches.push(...data.meals);
      }
      const recipeCounts = allMatches.reduce((acc: Record<string, { recipe: Recipe; count: number }>, recipe) => {
        if (!acc[recipe.idMeal]) acc[recipe.idMeal] = { recipe, count: 0 };
        acc[recipe.idMeal].count++;
        return acc;
      }, {});
      const sorted = Object.values(recipeCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => item.recipe);
      setCookableRecipes(sorted);
    } catch {} finally { setLoading(false); }
  };

  const getLunchboxSuggestions = () => {
    const suggestions = BROTZEIT_SUGGESTIONS[lunchboxAge] || BROTZEIT_SUGGESTIONS.adult;
    return showHealthyOnly ? suggestions.filter(s => s.healthy) : suggestions;
  };

  const displayedRecipes = showFavorites ? favoritesRecipes : recipes;
  const progressPct = Math.min(100, Math.round((todayCalories / recommendedCalories) * 100));

  const tabs = [
    { id: 'search', icon: Search, label: 'Suche' },
    { id: 'weekplan', icon: Calendar, label: 'Plan' },
    { id: 'calories', icon: Flame, label: 'Kalorien' },
    { id: 'lunchbox', icon: ChefHat, label: 'Brotzeit' },
    { id: 'custom', icon: Edit2, label: 'Eigene' },
    { id: 'whatcanicook', icon: Lightbulb, label: 'Was kochen?' },
  ];

  return (
    <div className="rs-root" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{globalStyles}</style>

      {/* TAB BAR */}
      <div className="rs-tab-bar">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`rs-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id as any)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── SEARCH TAB ── */}
      {activeTab === 'search' && (
        <>
          {/* Search bar */}
          <div className="rs-card">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <div className="rs-search-wrap" style={{ flex: 1 }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  className="rs-search-input"
                  placeholder="Rezept suchen…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRecipes(searchQuery)}
                />
              </div>
              <VoiceInput onResult={(text) => { setSearchQuery(text); searchRecipes(text); }} placeholder="Spracheingabe" />
              <button className="rs-btn rs-btn-primary" onClick={() => searchRecipes(searchQuery)}>
                <Search size={14} /> Suchen
              </button>
            </div>

            {/* Filters row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <div className="rs-filter-group">
                {(['all', 'vegetarian', 'vegan'] as const).map(f => (
                  <button
                    key={f}
                    className={`rs-filter-btn ${dietFilter === f ? 'active' : ''}`}
                    onClick={() => { setDietFilter(f); searchRecipes(searchQuery); }}
                  >
                    {f === 'all' ? 'Alle' : f === 'vegetarian' ? 'Vegetarisch' : 'Vegan'}
                  </button>
                ))}
              </div>
              <button
                className={`rs-tag ${intoleranceFilter.lactose ? 'rs-tag-blue active' : 'rs-tag-blue'}`}
                onClick={() => setIntoleranceFilter(prev => ({ ...prev, lactose: !prev.lactose }))}
              >
                <Milk size={11} /> Laktosefrei
              </button>
              <button
                className={`rs-tag ${intoleranceFilter.gluten ? 'rs-tag-amber active' : 'rs-tag-amber'}`}
                onClick={() => setIntoleranceFilter(prev => ({ ...prev, gluten: !prev.gluten }))}
              >
                <Wheat size={11} /> Glutenfrei
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="rs-sub-tabs">
            <button className={`rs-sub-tab ${!showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites(false)}>
              Alle Rezepte
            </button>
            <button
              className={`rs-sub-tab ${showFavorites ? 'active' : ''}`}
              onClick={() => { setShowFavorites(true); loadFavoritesRecipes(); }}
            >
              <Heart size={13} style={{ fill: showFavorites ? 'currentColor' : 'none' }} />
              Favoriten <span style={{ opacity: 0.6 }}>({favorites.length})</span>
            </button>
          </div>

          {/* Recipe grid */}
          {loading ? (
            <div className="rs-recipe-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="rs-skeleton" style={{ height: 130 }} />
                  <div style={{ padding: '12px' }}>
                    <div className="rs-skeleton" style={{ height: 14, width: '75%', marginBottom: 6 }} />
                    <div className="rs-skeleton" style={{ height: 11, width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedRecipes.length > 0 ? (
            <div className="rs-recipe-grid">
              {displayedRecipes.map(recipe => (
                <div key={recipe.idMeal} className="rs-recipe-card" onClick={() => loadRecipeDetails(recipe.idMeal)}>
                  <div className="rs-recipe-img-wrap">
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} className="rs-recipe-img" />
                    <button
                      className="rs-recipe-fav"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.idMeal); }}
                    >
                      <Heart
                        size={14}
                        style={{ color: favorites.includes(recipe.idMeal) ? '#e53e3e' : '#8aa4bb',
                          fill: favorites.includes(recipe.idMeal) ? '#e53e3e' : 'none' }}
                      />
                    </button>
                    <div className="rs-recipe-kcal">
                      <Flame size={10} />~{estimateCalories(recipe)} kcal
                    </div>
                  </div>
                  <div className="rs-recipe-body">
                    <p className="rs-recipe-name">{recipe.strMeal}</p>
                    {recipe.strCategory && <p className="rs-recipe-cat">{recipe.strCategory}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rs-empty">
              <Utensils size={40} style={{ opacity: 0.25 }} />
              <div>
                <p style={{ fontWeight: 500, marginBottom: 4 }}>
                  {showFavorites ? 'Keine Favoriten' : searchQuery ? 'Keine Ergebnisse gefunden' : 'Rezept eingeben und suchen'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {!searchQuery && !showFavorites ? 'Suche nach Zutaten, Kategorien oder Gerichtnamen.' : ''}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── WEEKPLAN TAB ── */}
      {activeTab === 'weekplan' && (
        <>
          <div className="rs-hero-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 4px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Diese Woche</p>
                <p style={{ fontSize: 32, fontWeight: 700, margin: 0, fontFamily: 'DM Serif Display, serif', letterSpacing: '-0.02em' }}>
                  {weekPlan.reduce((s, d) => s + getDayCalories(d), 0).toLocaleString()} kcal
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: '0 0 2px' }}>Ø pro Tag</p>
                <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
                  {Math.round(weekPlan.reduce((s, d) => s + getDayCalories(d), 0) / 7)} kcal
                </p>
              </div>
            </div>
          </div>

          {weekPlan.map((dayPlan, dayIndex) => (
            <div className="rs-weekday-card" key={dayIndex}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{dayPlan.day}</h3>
                {getDayCalories(dayPlan) > 0 && (
                  <span className="rs-badge rs-badge-ocean">
                    <Flame size={11} />{getDayCalories(dayPlan)} kcal
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {mealTypes.map(mealType => {
                  const meal = dayPlan[mealType];
                  return (
                    <div key={mealType} className={`rs-meal-slot ${meal ? 'filled' : ''}`}>
                      {meal ? (
                        <div style={{ width: '100%', position: 'relative' }}>
                          <img src={meal.strMealThumb} alt={meal.strMeal}
                            style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                          <button
                            onClick={() => removeFromWeekPlan(dayIndex, mealType)}
                            style={{
                              position: 'absolute', top: -4, right: -4,
                              width: 18, height: 18, borderRadius: '50%',
                              background: '#e53e3e', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}
                          >
                            <X size={10} />
                          </button>
                          <p style={{ fontSize: 11, fontWeight: 600, margin: '6px 0 0', textAlign: 'center',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {meal.strMeal}
                          </p>
                        </div>
                      ) : (
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                          onClick={() => setActiveTab('search')}
                        >
                          <Plus size={18} />
                          <span style={{ fontSize: 11, fontWeight: 500 }}>{mealLabels[mealType]}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── CALORIES TAB ── */}
      {activeTab === 'calories' && (
        <>
          {/* Hero calorie tracker */}
          <div className="rs-hero-card">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 4px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Heute gegessen</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <p style={{ fontSize: 48, fontWeight: 700, margin: 0, fontFamily: 'DM Serif Display, serif', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {todayCalories}
                </p>
                <p style={{ fontSize: 16, opacity: 0.6, margin: 0 }}>/ {recommendedCalories} kcal</p>
              </div>
              <div className="rs-progress-bar">
                <div className="rs-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <p style={{ fontSize: 12, opacity: 0.65, margin: '8px 0 0' }}>
                {recommendedCalories - todayCalories > 0
                  ? `Noch ${recommendedCalories - todayCalories} kcal übrig`
                  : `${todayCalories - recommendedCalories} kcal über dem Limit`}
              </p>
            </div>
          </div>

          {/* Tagesbedarf card */}
          <div className="rs-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="rs-section-label" style={{ margin: '0 0 4px' }}>Tagesbedarf</p>
              <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--ocean-600)', fontFamily: 'DM Serif Display, serif' }}>
                {recommendedCalories} kcal
              </p>
            </div>
            <button className="rs-btn rs-btn-secondary rs-btn-sm" onClick={() => setShowProfileModal(true)}>
              <Edit2 size={13} /> Anpassen
            </button>
          </div>

          {/* Add entry */}
          <div className="rs-card">
            <p className="rs-section-label">Kalorien hinzufügen</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="rs-input" placeholder="Lebensmittel…"
                value={newCalorieEntry.food}
                onChange={(e) => setNewCalorieEntry({ ...newCalorieEntry, food: e.target.value })}
                style={{ flex: 1 }}
              />
              <VoiceInput onResult={processVoiceCalories} placeholder="Spracheingabe" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="rs-input" placeholder="Kalorien" type="number"
                value={newCalorieEntry.calories}
                onChange={(e) => setNewCalorieEntry({ ...newCalorieEntry, calories: e.target.value })}
                style={{ flex: 1 }}
              />
              <select className="rs-select"
                value={newCalorieEntry.mealType}
                onChange={(e) => setNewCalorieEntry({ ...newCalorieEntry, mealType: e.target.value as any })}
              >
                <option value="breakfast">Frühstück</option>
                <option value="lunch">Mittag</option>
                <option value="dinner">Abendessen</option>
                <option value="snack">Snack</option>
              </select>
              <button className="rs-btn rs-btn-primary" style={{ padding: '10px 14px' }} onClick={addCalorieEntry}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Today's entries */}
          <div className="rs-card">
            <p className="rs-section-label">Heutige Einträge</p>
            {calorieEntries.filter(e => e.date === todayStr).length === 0 ? (
              <div className="rs-empty" style={{ padding: '32px 0' }}>
                <Apple size={28} style={{ opacity: 0.2 }} />
                <span style={{ fontSize: 13 }}>Noch keine Einträge heute</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {calorieEntries
                  .filter(e => e.date === todayStr)
                  .sort((a, b) => {
                    const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                    return order[a.mealType || 'snack'] - order[b.mealType || 'snack'];
                  })
                  .map(entry => (
                    <div key={entry.id} className="rs-entry-row">
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{entry.food}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                          {mealLabels[entry.mealType as keyof typeof mealLabels] || 'Snack'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: 'var(--ocean-600)', fontSize: 14 }}>{entry.calories} kcal</span>
                        <button
                          className="rs-btn-ghost rs-btn"
                          style={{ padding: '5px', borderRadius: '8px', color: '#e53e3e' }}
                          onClick={() => {
                            const newEntries = calorieEntries.filter(e => e.id !== entry.id);
                            setCalorieEntries(newEntries);
                            localStorage.setItem('calorieEntries', JSON.stringify(newEntries));
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Goal calculator */}
          <div className="rs-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ocean-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ocean-600)' }}>
                <Target size={16} />
              </div>
              <p style={{ fontWeight: 600, margin: 0 }}>Zielgewicht-Rechner</p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
              Um in {userProfile.goalMonths} Monaten {userProfile.goalWeight} kg zu erreichen:
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--ocean-600)', fontFamily: 'DM Serif Display, serif',
              margin: '0 0 4px', letterSpacing: '-0.01em' }}>
              {recommendedCalories} kcal/Tag
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Wöchentliches Kaloriendefizit: {Math.round(((userProfile.weight - userProfile.goalWeight) * 7700) / (userProfile.goalMonths * 4.33))} kcal
            </p>
          </div>

          {/* Profile modal */}
          {showProfileModal && (
            <div className="rs-modal-overlay">
              <div className="rs-modal">
                <div className="rs-modal-inner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, fontFamily: 'DM Serif Display, serif' }}>Profil bearbeiten</h3>
                    <button className="rs-btn rs-btn-ghost" style={{ padding: 6 }} onClick={() => setShowProfileModal(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="rs-label">Alter</label>
                        <input className="rs-input" type="number" value={userProfile.age}
                          onChange={(e) => setUserProfile({ ...userProfile, age: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="rs-label">Geschlecht</label>
                        <select className="rs-select" style={{ width: '100%' }} value={userProfile.gender}
                          onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value as any })}>
                          <option value="male">Männlich</option>
                          <option value="female">Weiblich</option>
                          <option value="other">Andere</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="rs-label">Gewicht (kg)</label>
                        <input className="rs-input" type="number" value={userProfile.weight}
                          onChange={(e) => setUserProfile({ ...userProfile, weight: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="rs-label">Zielgewicht (kg)</label>
                        <input className="rs-input" type="number" value={userProfile.goalWeight}
                          onChange={(e) => setUserProfile({ ...userProfile, goalWeight: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div>
                      <label className="rs-label">Größe (cm)</label>
                      <input className="rs-input" type="number" value={userProfile.height}
                        onChange={(e) => setUserProfile({ ...userProfile, height: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="rs-label">Aktivitätslevel</label>
                      <select className="rs-select" style={{ width: '100%' }} value={userProfile.activityLevel}
                        onChange={(e) => setUserProfile({ ...userProfile, activityLevel: e.target.value as any })}>
                        <option value="sedentary">Sedentär (wenig Bewegung)</option>
                        <option value="light">Leicht aktiv</option>
                        <option value="moderate">Moderat aktiv</option>
                        <option value="active">Sehr aktiv</option>
                        <option value="very_active">Extrem aktiv</option>
                      </select>
                    </div>
                    <div>
                      <label className="rs-label">Ziel erreichen in (Monate)</label>
                      <input className="rs-input" type="number" value={userProfile.goalMonths}
                        onChange={(e) => setUserProfile({ ...userProfile, goalMonths: parseInt(e.target.value) || 1 })} />
                    </div>
                    <button
                      className="rs-btn rs-btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                      onClick={() => { localStorage.setItem('userProfile', JSON.stringify(userProfile)); setShowProfileModal(false); }}
                    >
                      <Check size={16} /> Speichern
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── LUNCHBOX TAB ── */}
      {activeTab === 'lunchbox' && (
        <>
          <div className="rs-card">
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['child', 'teen', 'adult'] as const).map(age => (
                <button
                  key={age}
                  className={`rs-btn ${lunchboxAge === age ? 'rs-btn-primary' : 'rs-btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setLunchboxAge(age)}
                >
                  {age === 'child' ? 'Kinder' : age === 'teen' ? 'Jugendliche' : 'Erwachsene'}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showHealthyOnly}
                onChange={(e) => setShowHealthyOnly(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--ocean-500)', cursor: 'pointer' }}
              />
              <Leaf size={13} style={{ color: '#22c55e' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Nur gesunde Optionen anzeigen</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {getLunchboxSuggestions().map((suggestion, idx) => (
              <div key={idx} className="rs-lunchbox-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{suggestion.name}</p>
                  {suggestion.healthy && (
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: '#dcfce7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Leaf size={12} style={{ color: '#16a34a' }} />
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {suggestion.ingredients.join(' · ')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="rs-badge rs-badge-ocean">
                    <Flame size={11} />{suggestion.calories} kcal
                  </span>
                  <button className="rs-btn rs-btn-secondary rs-btn-sm"
                    onClick={() => onAddToShoppingList?.(suggestion.ingredients)}>
                    <ShoppingCart size={12} /> Einkaufsliste
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CUSTOM RECIPES TAB ── */}
      {activeTab === 'custom' && (
        <>
          <div className="rs-card">
            <p className="rs-section-label">Neues Rezept erstellen</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="rs-input" placeholder="Rezeptname"
                value={newCustomRecipe.name}
                onChange={(e) => setNewCustomRecipe({ ...newCustomRecipe, name: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="rs-input" placeholder="Zutat hinzufügen…"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIngredientToCustom()}
                  style={{ flex: 1 }}
                />
                <button className="rs-btn rs-btn-primary" style={{ padding: '10px 14px' }} onClick={addIngredientToCustom}>
                  <Plus size={16} />
                </button>
              </div>
              {newCustomRecipe.ingredients && newCustomRecipe.ingredients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {newCustomRecipe.ingredients.map((ing, idx) => (
                    <span key={idx} className="rs-chip">
                      {ing}
                      <button onClick={() => removeIngredientFromCustom(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                          padding: 0, display: 'flex', alignItems: 'center' }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input className="rs-input" placeholder="Zubereitung (optional)"
                value={newCustomRecipe.instructions}
                onChange={(e) => setNewCustomRecipe({ ...newCustomRecipe, instructions: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input className="rs-input" placeholder="Kalorien" type="number"
                  value={newCustomRecipe.calories || ''}
                  onChange={(e) => setNewCustomRecipe({ ...newCustomRecipe, calories: parseInt(e.target.value) || 0 })}
                />
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} className="rs-star"
                      onClick={() => setNewCustomRecipe({ ...newCustomRecipe, rating: star })}
                      style={{ background: 'none', border: 'none', padding: 2,
                        color: star <= (newCustomRecipe.rating || 0) ? '#f59e0b' : 'var(--border-md)' }}>
                      <Star size={20} fill={star <= (newCustomRecipe.rating || 0) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="rs-btn rs-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', opacity: (!newCustomRecipe.name || !newCustomRecipe.ingredients?.length) ? 0.5 : 1 }}
                onClick={saveCustomRecipe}
                disabled={!newCustomRecipe.name || !newCustomRecipe.ingredients?.length}
              >
                <Check size={16} /> Rezept speichern
              </button>
            </div>
          </div>

          <div className="rs-card">
            <p className="rs-section-label">Meine Rezepte</p>
            {customRecipes.length === 0 ? (
              <div className="rs-empty" style={{ padding: '28px 0' }}>
                <ChefHat size={28} style={{ opacity: 0.2 }} />
                <span style={{ fontSize: 13 }}>Noch keine eigenen Rezepte</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {customRecipes.map(recipe => (
                  <div key={recipe.id} style={{
                    padding: '14px', background: 'var(--surface-2)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{recipe.name}</p>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={11}
                            style={{ color: star <= recipe.rating ? '#f59e0b' : 'var(--border-md)' }}
                            fill={star <= recipe.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {recipe.ingredients.join(' · ')}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="rs-badge rs-badge-ocean"><Flame size={11} />{recipe.calories} kcal</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="rs-btn rs-btn-secondary rs-btn-sm"
                          onClick={() => onAddToShoppingList?.(recipe.ingredients)}>
                          <ShoppingCart size={12} />
                        </button>
                        <button
                          className="rs-btn rs-btn-sm"
                          style={{ background: '#fef0f0', color: '#b91c1c', border: '1px solid #fecaca' }}
                          onClick={() => {
                            const newRecipes = customRecipes.filter(r => r.id !== recipe.id);
                            setCustomRecipes(newRecipes);
                            localStorage.setItem('customRecipes', JSON.stringify(newRecipes));
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── WHAT CAN I COOK TAB ── */}
      {activeTab === 'whatcanicook' && (
        <>
          <div className="rs-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--ocean-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ocean-600)' }}>
                <Lightbulb size={15} />
              </div>
              <p style={{ fontWeight: 600, margin: 0 }}>Was kann ich kochen?</p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
              Gib bis zu 5 Zutaten ein, die du zuhause hast.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: availableIngredients.length > 0 ? 10 : 14 }}>
              <input className="rs-input" placeholder="Zutat eingeben…"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && availableIngredients.length < 5 && ingredientSearch.trim()) {
                    setAvailableIngredients([...availableIngredients, ingredientSearch.trim()]);
                    setIngredientSearch('');
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                className="rs-btn rs-btn-primary"
                style={{ padding: '10px 14px', opacity: availableIngredients.length >= 5 ? 0.5 : 1 }}
                onClick={() => {
                  if (availableIngredients.length < 5 && ingredientSearch.trim()) {
                    setAvailableIngredients([...availableIngredients, ingredientSearch.trim()]);
                    setIngredientSearch('');
                  }
                }}
                disabled={availableIngredients.length >= 5}
              >
                <Plus size={16} />
              </button>
            </div>
            {availableIngredients.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {availableIngredients.map((ing, idx) => (
                  <span key={idx} className="rs-chip">
                    {ing}
                    <button onClick={() => setAvailableIngredients(availableIngredients.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                        padding: 0, display: 'flex', alignItems: 'center' }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              className="rs-btn rs-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px',
                opacity: availableIngredients.length === 0 ? 0.5 : 1 }}
              onClick={searchWhatCanICook}
              disabled={availableIngredients.length === 0}
            >
              <Search size={15} /> Passende Rezepte finden
            </button>
          </div>

          {loading ? (
            <div className="rs-recipe-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="rs-skeleton" style={{ height: 130 }} />
                  <div style={{ padding: 12 }}>
                    <div className="rs-skeleton" style={{ height: 14, width: '75%', marginBottom: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : cookableRecipes.length > 0 ? (
            <div className="rs-recipe-grid">
              {cookableRecipes.map(recipe => (
                <div key={recipe.idMeal} className="rs-recipe-card" onClick={() => loadRecipeDetails(recipe.idMeal)}>
                  <div className="rs-recipe-img-wrap">
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} className="rs-recipe-img" />
                    <div className="rs-recipe-kcal"><Flame size={10} />~{estimateCalories(recipe)} kcal</div>
                  </div>
                  <div className="rs-recipe-body">
                    <p className="rs-recipe-name">{recipe.strMeal}</p>
                    <p className="rs-recipe-cat">Passt zu deinen Zutaten</p>
                  </div>
                </div>
              ))}
            </div>
          ) : availableIngredients.length > 0 ? (
            <div className="rs-empty">
              <Search size={32} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: 13 }}>Keine passenden Rezepte. Versuche andere Zutaten.</p>
            </div>
          ) : null}
        </>
      )}

      {/* ── RECIPE DETAIL MODAL ── */}
      {selectedRecipe && (
        <div className="rs-modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="rs-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <img
                src={selectedRecipe.strMealThumb}
                alt={selectedRecipe.strMeal}
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block',
                  borderRadius: '16px 16px 0 0' }}
              />
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)', color: 'var(--text-primary)'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="rs-modal-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 8px', lineHeight: 1.2 }}>
                    {selectedRecipe.strMeal}
                  </h2>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedRecipe.strCategory && (
                      <span className="rs-badge rs-badge-ocean">{selectedRecipe.strCategory}</span>
                    )}
                    {selectedRecipe.strArea && (
                      <span className="rs-badge rs-badge-amber">{selectedRecipe.strArea}</span>
                    )}
                    <span className="rs-badge rs-badge-red">
                      <Flame size={10} />~{estimateCalories(selectedRecipe)} kcal
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleFavorite(selectedRecipe.idMeal)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Heart size={22}
                    style={{ color: favorites.includes(selectedRecipe.idMeal) ? '#e53e3e' : 'var(--text-muted)',
                      fill: favorites.includes(selectedRecipe.idMeal) ? '#e53e3e' : 'none',
                      transition: 'all 0.15s' }}
                  />
                </button>
              </div>

              <div className="rs-divider" />

              <p className="rs-section-label">Zutaten</p>
              <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {getIngredients(selectedRecipe).map((ing, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ocean-400)', flexShrink: 0 }} />
                    {ing}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', gap: 8 }}>
                {onAddToShoppingList && (
                  <button className="rs-btn rs-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}
                    onClick={() => onAddToShoppingList(getIngredients(selectedRecipe))}>
                    <ShoppingCart size={14} /> Einkaufsliste
                  </button>
                )}
                <button className="rs-btn rs-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}
                  onClick={() => { setActiveTab('weekplan'); setSelectedRecipe(null); }}>
                  <Calendar size={14} /> Wochenplan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeSearch;