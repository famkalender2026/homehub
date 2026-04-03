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

// Kalorien-Rechner
const calculateDailyCalories = (profile: UserProfile): number => {
  let bmr;
  if (profile.gender === 'male') {
    bmr = 88.362 + 13.397 * profile.weight + 4.799 * profile.height - 5.677 * profile.age;
  } else {
    bmr = 447.593 + 9.247 * profile.weight + 3.098 * profile.height - 4.33 * profile.age;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const weeklyDeficit = ((profile.weight - profile.goalWeight) * 7700) / (profile.goalMonths * 4.33);
  return Math.round(tdee - weeklyDeficit / 7);
};

// Brotzeit-Vorschläge
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
  // State
  const [activeTab, setActiveTab] = useState<'search' | 'weekplan' | 'calories' | 'lunchbox' | 'custom' | 'whatcanicook'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesRecipes, setFavoritesRecipes] = useState<Recipe[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Weekplan
  const [weekPlan, setWeekPlan] = useState<WeekPlan[]>([]);

  // Calorie Tracker
  const [calorieEntries, setCalorieEntries] = useState<CalorieEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: 30,
    gender: 'male',
    weight: 80,
    height: 180,
    activityLevel: 'moderate',
    goalWeight: 75,
    goalMonths: 3,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newCalorieEntry, setNewCalorieEntry] = useState({ food: '', calories: '', mealType: 'snack' as const });
  const [manualCalories, setManualCalories] = useState(0);

  // Lunchbox
  const [lunchboxAge, setLunchboxAge] = useState<'child' | 'teen' | 'adult'>('adult');
  const [showHealthyOnly, setShowHealthyOnly] = useState(false);

  // Custom Recipe
  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);
  const [newCustomRecipe, setNewCustomRecipe] = useState<Partial<CustomRecipe>>({
    name: '',
    ingredients: [],
    instructions: '',
    calories: 0,
    rating: 0,
    tags: [],
  });
  const [ingredientInput, setIngredientInput] = useState('');

  // What Can I Cook
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [cookableRecipes, setCookableRecipes] = useState<Recipe[]>([]);

  // Filter
  const [dietFilter, setDietFilter] = useState<'all' | 'vegan' | 'vegetarian'>('all');
  const [intoleranceFilter, setIntoleranceFilter] = useState<{ lactose: boolean; gluten: boolean }>({
    lactose: false,
    gluten: false,
  });

  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
  const mealLabels = { breakfast: 'Frühstück', lunch: 'Mittag', dinner: 'Abendessen' };

  // Load data from localStorage
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

  // Calculate today's calories
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCalories = calorieEntries
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.calories, 0);
  const recommendedCalories = calculateDailyCalories(userProfile);

  // ============== FUNCTIONS ==============
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

      // Apply intolerance filters locally
      if (intoleranceFilter.gluten) {
        results = results.filter((r: Recipe) => {
          const ingredients = getIngredientsList(r);
          return !ingredients.some(i => i.toLowerCase().includes('wheat') || i.toLowerCase().includes('bread') || i.toLowerCase().includes('pasta'));
        });
      }
      if (intoleranceFilter.lactose) {
        results = results.filter((r: Recipe) => {
          const ingredients = getIngredientsList(r);
          return !ingredients.some(i => i.toLowerCase().includes('milk') || i.toLowerCase().includes('cheese') || i.toLowerCase().includes('cream'));
        });
      }

      setRecipes(results);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const getIngredients = (recipe: Recipe): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient?.trim()) {
        ingredients.push(`${measure || ''} ${ingredient}`.trim());
      }
    }
    return ingredients;
  };

  const getIngredientsList = (recipe: Recipe): string[] => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      if (ingredient?.trim()) {
        ingredients.push(ingredient.trim());
      }
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
    // Update favoritesRecipes when toggling
    if (newFavorites.includes(recipeId)) {
      const recipe = recipes.find(r => r.idMeal === recipeId);
      if (recipe) {
        setFavoritesRecipes(prev => [...prev.filter(r => r.idMeal !== recipeId), recipe]);
      }
    } else {
      setFavoritesRecipes(prev => prev.filter(r => r.idMeal !== recipeId));
    }
  };

  // Load favorites recipes when switching to favorites tab
  const loadFavoritesRecipes = async () => {
    if (favorites.length === 0) {
      setFavoritesRecipes([]);
      return;
    }
    setLoading(true);
    try {
      const loadedRecipes: Recipe[] = [];
      for (const id of favorites) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        if (data.meals?.[0]) {
          loadedRecipes.push(data.meals[0]);
        }
      }
      setFavoritesRecipes(loadedRecipes);
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipeDetails = async (id: string) => {
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await response.json();
      if (data.meals?.[0]) setSelectedRecipe(data.meals[0]);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    }
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
    if (match) {
      setNewCalorieEntry(prev => ({ ...prev, calories: match[1] }));
    }
    const foodName = text.replace(/\d+\s*(kalorien|cal|kcal)/gi, '').trim();
    if (foodName) {
      setNewCalorieEntry(prev => ({ ...prev, food: foodName }));
    }
  };

  const addIngredientToCustom = () => {
    if (!ingredientInput.trim()) return;
    setNewCustomRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), ingredientInput.trim()],
    }));
    setIngredientInput('');
  };

  const removeIngredientFromCustom = (index: number) => {
    setNewCustomRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index),
    }));
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
        if (data.meals) {
          allMatches.push(...data.meals);
        }
      }
      const recipeCounts = allMatches.reduce((acc: Record<string, { recipe: Recipe; count: number }>, recipe) => {
        if (!acc[recipe.idMeal]) {
          acc[recipe.idMeal] = { recipe, count: 0 };
        }
        acc[recipe.idMeal].count++;
        return acc;
      }, {});

      const sorted = Object.values(recipeCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => item.recipe);

      setCookableRecipes(sorted);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLunchboxSuggestions = () => {
    const suggestions = BROTZEIT_SUGGESTIONS[lunchboxAge] || BROTZEIT_SUGGESTIONS.adult;
    return showHealthyOnly ? suggestions.filter(s => s.healthy) : suggestions;
  };

  const displayedRecipes = showFavorites ? favoritesRecipes : recipes;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'search', icon: Search, label: 'Suche' },
          { id: 'weekplan', icon: Calendar, label: 'Plan' },
          { id: 'calories', icon: Flame, label: 'Kalorien' },
          { id: 'lunchbox', icon: ChefHat, label: 'Brotzeit' },
          { id: 'custom', icon: Edit2, label: 'Eigene' },
          { id: 'whatcanicook', icon: Lightbulb, label: 'Was kochen?' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === id
                ? 'bg-white text-ocean-primary shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <>
          <Card className="p-4">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <Input
                  placeholder="Rezept suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRecipes(searchQuery)}
                />
              </div>
              <VoiceInput onResult={(text) => { setSearchQuery(text); searchRecipes(text); }} placeholder="Spracheingabe" />
              <Button onClick={() => searchRecipes(searchQuery)}>Suchen</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['all', 'vegetarian', 'vegan'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setDietFilter(filter); searchRecipes(searchQuery); }}
                    className={`px-3 py-1 text-xs rounded-md ${
                      dietFilter === filter ? 'bg-white text-ocean-primary' : 'text-text-secondary'
                    }`}
                  >
                    {filter === 'all' ? 'Alle' : filter === 'vegetarian' ? 'Vegetarisch' : 'Vegan'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIntoleranceFilter(prev => ({ ...prev, lactose: !prev.lactose }))}
                  className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 ${
                    intoleranceFilter.lactose ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Milk size={12} /> Laktosefrei
                </button>
                <button
                  onClick={() => setIntoleranceFilter(prev => ({ ...prev, gluten: !prev.gluten }))}
                  className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 ${
                    intoleranceFilter.gluten ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Wheat size={12} /> Glutenfrei
                </button>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setShowFavorites(false)}
              className={`pb-2 px-1 text-sm font-medium ${!showFavorites ? 'text-ocean-primary border-b-2 border-ocean-primary' : 'text-text-secondary'}`}
            >
              Alle Rezepte
            </button>
            <button
              onClick={() => { setShowFavorites(true); loadFavoritesRecipes(); }}
              className={`pb-2 px-1 text-sm font-medium flex items-center gap-1 ${showFavorites ? 'text-ocean-primary border-b-2 border-ocean-primary' : 'text-text-secondary'}`}
            >
              <Heart size={14} className={showFavorites ? 'fill-current' : ''} />
              Favoriten ({favorites.length})
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Card key={i} className="p-0"><div className="h-32 skeleton" /><div className="p-3"><div className="h-4 skeleton w-3/4" /></div></Card>)}
            </div>
          ) : displayedRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {displayedRecipes.map(recipe => (
                <Card
                  key={recipe.idMeal}
                  className="p-0 overflow-hidden cursor-pointer hover:shadow-card-hover"
                  onClick={() => loadRecipeDetails(recipe.idMeal)}
                >
                  <div className="relative">
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-32 object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.idMeal); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90"
                    >
                      <Heart size={16} className={favorites.includes(recipe.idMeal) ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame size={12} />~{estimateCalories(recipe)} kcal
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{recipe.strMeal}</h3>
                    {recipe.strCategory && <p className="text-xs text-text-secondary">{recipe.strCategory}</p>}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <Utensils size={48} className="mx-auto text-text-secondary opacity-50 mb-3" />
              <p className="text-text-secondary">
                {showFavorites ? 'Keine Favoriten' : searchQuery ? 'Keine Ergebnisse' : 'Suche nach Rezepten'}
              </p>
            </Card>
          )}
        </>
      )}

      {/* WEEKPLAN TAB */}
      {activeTab === 'weekplan' && (
        <>
          <Card className="bg-gradient-to-r from-ocean-primary to-ocean-dark text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/80">Woche</p>
                <p className="text-2xl font-bold">{weekPlan.reduce((s, d) => s + getDayCalories(d), 0).toLocaleString()} kcal</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Ø/Tag</p>
                <p className="text-xl">{Math.round(weekPlan.reduce((s, d) => s + getDayCalories(d), 0) / 7)} kcal</p>
              </div>
            </div>
          </Card>

          {weekPlan.map((dayPlan, dayIndex) => (
            <Card key={dayIndex}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">{dayPlan.day}</h3>
                <span className="text-sm text-ocean-primary">{getDayCalories(dayPlan)} kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mealTypes.map(mealType => {
                  const meal = dayPlan[mealType];
                  return (
                    <div
                      key={mealType}
                      className={`border-2 border-dashed rounded-lg p-2 text-center ${meal ? 'border-ocean-primary bg-ocean-primary/5' : 'border-gray-200'}`}
                    >
                      {meal ? (
                        <div className="relative">
                          <img src={meal.strMealThumb} alt={meal.strMeal} className="w-full h-16 object-cover rounded-md mb-1" />
                          <button
                            onClick={() => removeFromWeekPlan(dayIndex, mealType)}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X size={10} />
                          </button>
                          <p className="text-xs font-medium truncate">{meal.strMeal}</p>
                          <p className="text-xs text-text-secondary">{estimateCalories(meal)} kcal</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setActiveTab('search'); }}
                          className="w-full h-full flex flex-col items-center justify-center text-text-secondary hover:text-ocean-primary"
                        >
                          <Plus size={20} />
                          <span className="text-xs">{mealLabels[mealType]}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </>
      )}

      {/* CALORIES TAB */}
      {activeTab === 'calories' && (
        <>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
            <div className="text-center">
              <p className="text-sm text-white/80">Heute gegessen</p>
              <p className="text-4xl font-bold">{todayCalories}</p>
              <p className="text-sm text-white/60">von {recommendedCalories} kcal empfohlen</p>
              <div className="mt-3 bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all"
                  style={{ width: `${Math.min(100, (todayCalories / recommendedCalories) * 100)}%` }}
                />
              </div>
              <p className="text-xs mt-1">{recommendedCalories - todayCalories} kcal übrig</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-text-secondary">Tagesbedarf</p>
                <p className="text-lg font-bold">{recommendedCalories} kcal</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowProfileModal(true)}>
                <Edit2 size={16} /> Anpassen
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Kalorien hinzufügen</h3>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <Input
                  placeholder="Lebensmittel..."
                  value={newCalorieEntry.food}
                  onChange={(e) => setNewCalorieEntry({ ...newCalorieEntry, food: e.target.value })}
                />
              </div>
              <VoiceInput onResult={processVoiceCalories} placeholder="Spracheingabe" />
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <Input
                  placeholder="Kalorien"
                  type="number"
                  value={newCalorieEntry.calories}
                  onChange={(e) => setNewCalorieEntry({ ...newCalorieEntry, calories: e.target.value })}
                />
              </div>
              <select
                value={newCalorieEntry.mealType}
                onChange={(e) => setNewCalorieEntry({ ...newCalorieEntry, mealType: e.target.value as any })}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="breakfast">Frühstück</option>
                <option value="lunch">Mittag</option>
                <option value="dinner">Abendessen</option>
                <option value="snack">Snack</option>
              </select>
              <Button onClick={addCalorieEntry}><Plus size={18} /></Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Heutige Einträge</h3>
            {calorieEntries.filter(e => e.date === todayStr).length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-4">Noch keine Einträge</p>
            ) : (
              <div className="space-y-2">
                {calorieEntries
                  .filter(e => e.date === todayStr)
                  .sort((a, b) => {
                    const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                    return order[a.mealType || 'snack'] - order[b.mealType || 'snack'];
                  })
                  .map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{entry.food}</p>
                        <p className="text-xs text-text-secondary">{mealLabels[entry.mealType as keyof typeof mealLabels] || 'Snack'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-ocean-primary font-medium">{entry.calories} kcal</span>
                        <button
                          onClick={() => {
                            const newEntries = calorieEntries.filter(e => e.id !== entry.id);
                            setCalorieEntries(newEntries);
                            localStorage.setItem('calorieEntries', JSON.stringify(newEntries));
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="text-ocean-primary" />
              <h3 className="font-medium">Zielgewicht-Rechner</h3>
            </div>
            <p className="text-sm text-text-secondary mb-2">
              Um in {userProfile.goalMonths} Monaten {userProfile.goalWeight} kg zu erreichen:
            </p>
            <p className="text-lg font-bold text-ocean-primary">
              {recommendedCalories} kcal/Tag
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Wöchentlicher Kaloriendefizit: {Math.round(((userProfile.weight - userProfile.goalWeight) * 7700) / (userProfile.goalMonths * 4.33))} kcal
            </p>
          </Card>

          {showProfileModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display text-lg">Profil bearbeiten</h3>
                  <Button variant="ghost" onClick={() => setShowProfileModal(false)}><X size={20} /></Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary">Alter</label>
                      <Input type="number" value={userProfile.age} onChange={(e) => setUserProfile({ ...userProfile, age: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Geschlecht</label>
                      <select
                        value={userProfile.gender}
                        onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="male">Männlich</option>
                        <option value="female">Weiblich</option>
                        <option value="other">Andere</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary">Gewicht (kg)</label>
                      <Input type="number" value={userProfile.weight} onChange={(e) => setUserProfile({ ...userProfile, weight: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Zielgewicht (kg)</label>
                      <Input type="number" value={userProfile.goalWeight} onChange={(e) => setUserProfile({ ...userProfile, goalWeight: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary">Größe (cm)</label>
                    <Input type="number" value={userProfile.height} onChange={(e) => setUserProfile({ ...userProfile, height: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary">Aktivitätslevel</label>
                    <select
                      value={userProfile.activityLevel}
                      onChange={(e) => setUserProfile({ ...userProfile, activityLevel: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="sedentary">Sedentär (wenig Bewegung)</option>
                      <option value="light">Leicht aktiv</option>
                      <option value="moderate">Moderat aktiv</option>
                      <option value="active">Sehr aktiv</option>
                      <option value="very_active">Extrem aktiv</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary">Ziel erreichen in (Monate)</label>
                    <Input type="number" value={userProfile.goalMonths} onChange={(e) => setUserProfile({ ...userProfile, goalMonths: parseInt(e.target.value) || 1 })} />
                  </div>
                  <Button onClick={() => { localStorage.setItem('userProfile', JSON.stringify(userProfile)); setShowProfileModal(false); }} className="w-full">
                    Speichern
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* LUNCHBOX TAB */}
      {activeTab === 'lunchbox' && (
        <>
          <Card className="p-4">
            <div className="flex gap-2 mb-4">
              {(['child', 'teen', 'adult'] as const).map(age => (
                <button
                  key={age}
                  onClick={() => setLunchboxAge(age)}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors ${
                    lunchboxAge === age ? 'bg-ocean-primary text-white' : 'bg-gray-100 text-text-secondary'
                  }`}
                >
                  {age === 'child' ? 'Kinder' : age === 'teen' ? 'Jugendliche' : 'Erwachsene'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="healthyOnly"
                checked={showHealthyOnly}
                onChange={(e) => setShowHealthyOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="healthyOnly" className="text-sm flex items-center gap-1">
                <Leaf size={14} className="text-green-500" /> Nur gesunde Optionen
              </label>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getLunchboxSuggestions().map((suggestion, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{suggestion.name}</h3>
                  {suggestion.healthy && <span className="text-green-500"><Leaf size={16} /></span>}
                </div>
                <p className="text-xs text-text-secondary mb-2">{suggestion.ingredients.join(', ')}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ocean-primary font-medium">{suggestion.calories} kcal</span>
                  <Button size="sm" variant="ghost" onClick={() => onAddToShoppingList?.(suggestion.ingredients)}>
                    <ShoppingCart size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* CUSTOM RECIPES TAB */}
      {activeTab === 'custom' && (
        <>
          <Card className="p-4">
            <h3 className="font-medium mb-3">Neues Rezept erstellen</h3>
            <div className="space-y-3">
              <Input
                placeholder="Rezeptname"
                value={newCustomRecipe.name}
                onChange={(e) => setNewCustomRecipe({ ...newCustomRecipe, name: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Zutat hinzufügen..."
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIngredientToCustom()}
                />
                <Button onClick={addIngredientToCustom}><Plus size={18} /></Button>
              </div>
              {newCustomRecipe.ingredients && newCustomRecipe.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newCustomRecipe.ingredients.map((ing, idx) => (
                    <span key={idx} className="bg-ocean-primary/10 text-ocean-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      {ing}
                      <button onClick={() => removeIngredientFromCustom(idx)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
              <Input
                placeholder="Zubereitung (optional)"
                value={newCustomRecipe.instructions}
                onChange={(e) => setNewCustomRecipe({ ...newCustomRecipe, instructions: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Kalorien"
                  type="number"
                  value={newCustomRecipe.calories || ''}
                  onChange={(e) => setNewCustomRecipe({ ...newCustomRecipe, calories: parseInt(e.target.value) || 0 })}
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setNewCustomRecipe({ ...newCustomRecipe, rating: star })}
                      className={`p-1 ${star <= (newCustomRecipe.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      <Star size={20} fill={star <= (newCustomRecipe.rating || 0) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={saveCustomRecipe} disabled={!newCustomRecipe.name || !newCustomRecipe.ingredients?.length} className="w-full">
                Rezept speichern
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Meine Rezepte</h3>
            {customRecipes.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-4">Noch keine eigenen Rezepte</p>
            ) : (
              <div className="space-y-3">
                {customRecipes.map(recipe => (
                  <div key={recipe.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{recipe.name}</h4>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={12} fill={star <= recipe.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{recipe.ingredients.join(', ')}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-ocean-primary">{recipe.calories} kcal</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onAddToShoppingList?.(recipe.ingredients)}>
                          <ShoppingCart size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          const newRecipes = customRecipes.filter(r => r.id !== recipe.id);
                          setCustomRecipes(newRecipes);
                          localStorage.setItem('customRecipes', JSON.stringify(newRecipes));
                        }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* WHAT CAN I COOK TAB */}
      {activeTab === 'whatcanicook' && (
        <>
          <Card className="p-4">
            <h3 className="font-medium mb-3">Was kann ich kochen?</h3>
            <p className="text-sm text-text-secondary mb-3">Gib bis zu 5 Zutaten ein, die du zuhause hast.</p>

            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Zutat eingeben..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && availableIngredients.length < 5) {
                    setAvailableIngredients([...availableIngredients, ingredientSearch.trim()]);
                    setIngredientSearch('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (availableIngredients.length < 5) {
                    setAvailableIngredients([...availableIngredients, ingredientSearch.trim()]);
                    setIngredientSearch('');
                  }
                }}
                disabled={availableIngredients.length >= 5}
              >
                <Plus size={18} />
              </Button>
            </div>

            {availableIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {availableIngredients.map((ing, idx) => (
                  <span key={idx} className="bg-ocean-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {ing}
                    <button onClick={() => setAvailableIngredients(availableIngredients.filter((_, i) => i !== idx))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Button onClick={searchWhatCanICook} disabled={availableIngredients.length === 0} className="w-full">
              <Search size={16} /> Rezepte finden
            </Button>
          </Card>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Card key={i} className="p-0"><div className="h-32 skeleton" /></Card>)}
            </div>
          ) : cookableRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {cookableRecipes.map(recipe => (
                <Card
                  key={recipe.idMeal}
                  className="p-0 overflow-hidden cursor-pointer hover:shadow-card-hover"
                  onClick={() => loadRecipeDetails(recipe.idMeal)}
                >
                  <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{recipe.strMeal}</h3>
                    <p className="text-xs text-text-secondary">~{estimateCalories(recipe)} kcal</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : availableIngredients.length > 0 ? (
            <Card className="p-4 text-center">
              <p className="text-text-secondary">Keine passenden Rezepte gefunden. Versuche andere Zutaten.</p>
            </Card>
          ) : null}
        </>
      )}

      {/* RECIPE DETAIL MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img src={selectedRecipe.strMealThumb} alt={selectedRecipe.strMeal} className="w-full h-48 object-cover rounded-lg" />
              <button onClick={() => setSelectedRecipe(null)} className="absolute top-2 right-2 p-2 rounded-full bg-white/90">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl">{selectedRecipe.strMeal}</h2>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {selectedRecipe.strCategory && (
                      <span className="text-xs bg-ocean-primary/10 text-ocean-primary px-2 py-0.5 rounded-full">{selectedRecipe.strCategory}</span>
                    )}
                    {selectedRecipe.strArea && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{selectedRecipe.strArea}</span>
                    )}
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame size={12} />~{estimateCalories(selectedRecipe)} kcal
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleFavorite(selectedRecipe.idMeal)} className="p-2">
                  <Heart size={24} className={favorites.includes(selectedRecipe.idMeal) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>
              </div>
              <div className="mt-6">
                <h3 className="font-medium mb-2">Zutaten</h3>
                <ul className="space-y-1">
                  {getIngredients(selectedRecipe).map((ing, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-ocean-primary" />{ing}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 mt-4">
                {onAddToShoppingList && (
                  <Button onClick={() => { onAddToShoppingList(getIngredients(selectedRecipe)); }} className="flex-1">
                    <ShoppingCart size={16} /> Einkaufsliste
                  </Button>
                )}
                <Button variant="secondary" onClick={() => { setActiveTab('weekplan'); }} className="flex-1">
                  <Calendar size={16} /> Wochenplan
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RecipeSearch;