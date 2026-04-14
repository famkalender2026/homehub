'use client';
import React, { useState, useEffect } from 'react';
import {
  Search, Home, Heart, Calendar, ShoppingCart, Coffee, Salad, Wheat, Milk, Flame,
  UtensilsCrossed, X, Plus, Trash2, Check, TrendingUp, Camera, Store, DollarSign,
  BarChart3, ChevronDown, ChevronUp, List, FileText, Sparkles, ArrowRight, ShoppingBag,
  Star, RefreshCw, Activity, Edit3, Save, Shuffle, TrendingDown, Package, Baby, Mic,
  Share2, Upload, Download, Pencil, BookOpen, ChefHat, Leaf
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ========== TYPES ==========
interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  tips?: string;
  image: string;
  ingredients: string[];
  measures: string[];
  calories: number;
  portionGram: number;
  portions: number;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  lactoseFree: boolean;
  lunchbox: boolean;
  isCustom?: boolean;
  author?: string;
  shareCode?: string;
}

interface ShoppingItem {
  id: string;
  recipeId: string;
  recipeName: string;
  ingredient: string;
  measure: string;
  quantity: number;
  checked: boolean;
  estimatedPrice?: number;
}

interface DayPlan {
  day: string;
  recipeId: string | null;
  recipeName: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  packSize: string;
  packPrice: number;
  purchaseCount: number;
}

interface Purchase {
  id: string;
  date: string;
  store: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
}

// ========== PRODUCT DATABASE ==========
const defaultProducts: Product[] = [
  { id: 'p1', name: 'Zwiebel', category: 'Gemüse', pricePerUnit: 1.49, unit: 'kg', packSize: '1kg', packPrice: 1.49, purchaseCount: 12 },
  { id: 'p2', name: 'Knoblauch', category: 'Gemüse', pricePerUnit: 4.99, unit: 'kg', packSize: '100g', packPrice: 0.50, purchaseCount: 10 },
  { id: 'p3', name: 'Olivenöl', category: 'Öle', pricePerUnit: 8.99, unit: 'Liter', packSize: '500ml', packPrice: 4.50, purchaseCount: 8 },
  { id: 'p4', name: 'Rinderhackfleisch', category: 'Fleisch', pricePerUnit: 8.99, unit: 'kg', packSize: '500g', packPrice: 4.50, purchaseCount: 6 },
  { id: 'p5', name: 'Tomatenmark', category: 'Konserven', pricePerUnit: 2.49, unit: 'kg', packSize: '200g', packPrice: 0.50, purchaseCount: 9 },
  { id: 'p6', name: 'Passierte Tomaten', category: 'Konserven', pricePerUnit: 1.99, unit: 'kg', packSize: '700g', packPrice: 1.39, purchaseCount: 7 },
  { id: 'p7', name: 'Spaghetti', category: 'Pasta', pricePerUnit: 2.49, unit: 'kg', packSize: '500g', packPrice: 1.25, purchaseCount: 11 },
  { id: 'p8', name: 'Hähnchenbrust', category: 'Fleisch', pricePerUnit: 9.99, unit: 'kg', packSize: '400g', packPrice: 4.00, purchaseCount: 5 },
  { id: 'p9', name: 'Reis', category: 'Trockenware', pricePerUnit: 2.29, unit: 'kg', packSize: '1kg', packPrice: 2.29, purchaseCount: 14 },
  { id: 'p10', name: 'Milch', category: 'Milchprodukte', pricePerUnit: 1.19, unit: 'Liter', packSize: '1l', packPrice: 1.19, purchaseCount: 20 },
  { id: 'p11', name: 'Eier', category: 'Milchprodukte', pricePerUnit: 2.49, unit: '10 Stück', packSize: '10 Stück', packPrice: 2.49, purchaseCount: 15 },
  { id: 'p12', name: 'Brot', category: 'Backwaren', pricePerUnit: 2.99, unit: 'Stück', packSize: '1 Stück', packPrice: 2.99, purchaseCount: 18 },
  { id: 'p13', name: 'Mehl', category: 'Backwaren', pricePerUnit: 1.49, unit: 'kg', packSize: '1kg', packPrice: 1.49, purchaseCount: 7 },
  { id: 'p14', name: 'Butter', category: 'Milchprodukte', pricePerUnit: 3.29, unit: '250g', packSize: '250g', packPrice: 3.29, purchaseCount: 13 },
  { id: 'p15', name: 'Salz', category: 'Gewürze', pricePerUnit: 0.79, unit: 'kg', packSize: '500g', packPrice: 0.40, purchaseCount: 4 },
];

const BASE_PRODUCTS_CATEGORIES = [
  { label: 'Basisprodukte', items: ['Mehl', 'Zucker', 'Salz', 'Pfeffer', 'Olivenöl', 'Butter', 'Eier', 'Milch'] },
  { label: 'Gemüse', items: ['Zwiebel', 'Knoblauch', 'Karotten', 'Tomaten', 'Paprika', 'Zucchini'] },
  { label: 'Fleisch & Fisch', items: ['Hähnchenbrust', 'Rinderhackfleisch', 'Lachs', 'Thunfisch (Dose)'] },
  { label: 'Trockenware', items: ['Spaghetti', 'Reis', 'Linsen', 'Kichererbsen (Dose)', 'Haferflocken'] },
];

// ========== RECIPE DATABASE ==========
const defaultRecipes: Recipe[] = [
  {
    id: '1', name: 'Spaghetti Bolognese', category: 'Pasta', area: 'Italienisch',
    instructions: '1. Zwiebel und Knoblauch fein hacken.\n2. In Olivenöl goldbraun anbraten.\n3. Hackfleisch zugeben und krümelig braten.\n4. Tomatenmark einrühren, kurz mitbraten.\n5. Passierte Tomaten und Oregano hinzufügen.\n6. 30 Minuten bei niedriger Hitze köcheln lassen.\n7. Mit Salz und Pfeffer abschmecken.\n8. Mit frisch gekochten Spaghetti servieren.',
    tips: 'Ein Schuss Rotwein macht die Sauce besonders aromatisch.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    ingredients: ['Zwiebel', 'Knoblauch', 'Olivenöl', 'Rinderhackfleisch', 'Tomatenmark', 'Passierte Tomaten', 'Oregano', 'Salz', 'Pfeffer', 'Spaghetti'],
    measures: ['1 Stück', '2 Zehen', '2 EL', '500g', '1 EL', '800g', '1 TL', 'Prise', 'Prise', '400g'],
    calories: 620, portionGram: 350, portions: 4, vegetarian: false, vegan: false, glutenFree: false, lactoseFree: true, lunchbox: false
  },
  {
    id: '2', name: 'Vegetarische Lasagne', category: 'Pasta', area: 'Italienisch',
    instructions: '1. Zucchini, Aubergine, Paprika und Zwiebel in Würfel schneiden.\n2. Gemüse in Olivenöl anbraten bis es weich ist.\n3. Tomatensoße unter das Gemüse mischen.\n4. Bechamelsoße: Margarine schmelzen, Mehl einrühren, Hafermilch langsam zugießen.\n5. Auflaufform schichten: Nudelplatten, Gemüse-Tomatenmix, Bechamel – wiederholen.\n6. Mit Bechamel abschließen.\n7. Bei 180°C Umluft 35 Minuten backen bis die Oberfläche goldbraun ist.',
    tips: 'Über Nacht im Kühlschrank durchziehen lassen macht sie noch besser.',
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80',
    ingredients: ['Zucchini', 'Aubergine', 'Paprika', 'Zwiebel', 'Olivenöl', 'Tomatensoße', 'Lasagneplatten', 'Margarine', 'Mehl', 'Hafermilch'],
    measures: ['1', '1', '1', '1', '2 EL', '500ml', '250g', '50g', '50g', '500ml'],
    calories: 480, portionGram: 400, portions: 6, vegetarian: true, vegan: true, glutenFree: false, lactoseFree: true, lunchbox: false
  },
  {
    id: '3', name: 'Hähnchen Teriyaki Bowl', category: 'Asiatisch', area: 'Japanisch',
    instructions: '1. Hähnchenbrust in gleichmäßige Streifen schneiden.\n2. Mit Teriyaki-Sauce mindestens 15 Minuten marinieren.\n3. In einer heißen Pfanne mit Öl von beiden Seiten braten.\n4. Reis nach Packungsanleitung kochen.\n5. Brokkoli und Karotten in Salzwasser bissfest garen.\n6. Bowl aufbauen: Reis, Hähnchen, Gemüse anrichten.\n7. Mit restlicher Sauce beträufeln.',
    tips: 'Mit Sesam und Frühlingszwiebeln bestreuen für mehr Aroma.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    ingredients: ['Hähnchenbrust', 'Teriyaki-Sauce', 'Reis', 'Brokkoli', 'Karotten', 'Olivenöl', 'Sesam'],
    measures: ['300g', '100ml', '200g', '200g', '100g', '1 EL', '1 TL'],
    calories: 550, portionGram: 400, portions: 3, vegetarian: false, vegan: false, glutenFree: true, lactoseFree: true, lunchbox: true
  },
  {
    id: '4', name: 'Vegane Quinoa-Bowl', category: 'Salat', area: 'International',
    instructions: '1. Quinoa in einem Sieb gründlich abspülen.\n2. In doppelter Menge Salzwasser 15 Minuten köcheln lassen.\n3. Avocado entkernen und in Scheiben schneiden.\n4. Gurke und Tomaten würfeln.\n5. Kichererbsen abtropfen und trocken tupfen.\n6. Tahini mit Zitronensaft, Salz und etwas Wasser zu cremigem Dressing rühren.\n7. Quinoa als Basis in die Schale, Zutaten darauf anrichten, Dressing darüber.',
    tips: 'Mit gerösteten Kürbiskernen und frischer Minze toppen.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    ingredients: ['Quinoa', 'Avocado', 'Gurke', 'Tomaten', 'Kichererbsen', 'Tahini', 'Zitrone', 'Salz'],
    measures: ['150g', '1', '1', '2', '200g', '2 EL', '1', 'Prise'],
    calories: 520, portionGram: 380, portions: 2, vegetarian: true, vegan: true, glutenFree: true, lactoseFree: true, lunchbox: true
  },
  {
    id: '5', name: 'Glutenfreier Apfelkuchen', category: 'Dessert', area: 'Deutsch',
    instructions: '1. Äpfel schälen, entkernen und in Spalten schneiden.\n2. Butter und Zucker cremig rühren.\n3. Eier einzeln unterrühren.\n4. Glutenfreies Mehl und Backpulver unterheben.\n5. Äpfel vorsichtig unter den Teig heben.\n6. In eine gefettete Springform füllen.\n7. Bei 180°C Ober-/Unterhitze 45 Minuten backen.\n8. Stäbchenprobe machen.',
    tips: 'Mit Zimt und einer Prise Vanille verfeinern.',
    image: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600&q=80',
    ingredients: ['Äpfel', 'Glutenfreies Mehl', 'Zucker', 'Eier', 'Butter', 'Backpulver'],
    measures: ['4', '250g', '150g', '3', '150g', '1 TL'],
    calories: 380, portionGram: 120, portions: 8, vegetarian: true, vegan: false, glutenFree: true, lactoseFree: false, lunchbox: false
  },
  {
    id: '6', name: 'Cremige Pilzsuppe', category: 'Suppe', area: 'Deutsch',
    instructions: '1. Champignons putzen und grob hacken.\n2. Zwiebel fein würfeln.\n3. Beides in Butter glasig anbraten.\n4. Mit Gemüsebrühe ablöschen und 15 Minuten köcheln.\n5. Laktosefreie Sahne einrühren.\n6. Mit einem Stabmixer cremig pürieren.\n7. Mit Salz, Pfeffer und Muskat abschmecken.\n8. Mit frischer Petersilie und Sahnetupfer servieren.',
    tips: 'Mit gerösteten Brotwürfeln als Suppeneinlage servieren.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    ingredients: ['Champignons', 'Zwiebel', 'Gemüsebrühe', 'Laktosefreie Sahne', 'Butter', 'Petersilie', 'Muskat', 'Salz', 'Pfeffer'],
    measures: ['500g', '1', '1l', '200ml', '30g', '1 Bund', 'Prise', 'Prise', 'Prise'],
    calories: 210, portionGram: 300, portions: 4, vegetarian: true, vegan: false, glutenFree: true, lactoseFree: true, lunchbox: false
  },
  // Kinder-Brotzeit
  {
    id: 'k1', name: 'Bunter Dino-Spieß', category: 'Kinder-Brotzeit', area: 'Kreativ',
    instructions: '1. Gurke in dicke Scheiben schneiden und mit Dino-Ausstechform ausstechen.\n2. Paprika in Streifen schneiden und ebenfalls ausstechen.\n3. Käse mit Ausstechform in Dino-Formen bringen.\n4. Abwechselnd Dino-Gurke, Dino-Käse, Dino-Paprika auf Holzspieße stecken.\n5. Weintrauben als bunte Akzente dazwischen schieben.\n6. Joghurt mit etwas Honig zu Dip verrühren.\n7. Spieße auf Teller anrichten und Dip dazustellen.',
    tips: 'Dino-Ausstechformen gibt es günstig online. Auch Sterne oder Herzchen funktionieren!',
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80',
    ingredients: ['Gurke', 'Paprika', 'Gouda-Käse', 'Weintrauben', 'Naturjoghurt', 'Honig'],
    measures: ['1/2', '1/2', '80g', '100g', '150g', '1 TL'],
    calories: 250, portionGram: 180, portions: 1, vegetarian: true, vegan: false, glutenFree: true, lactoseFree: false, lunchbox: true
  },
  {
    id: 'k2', name: 'Obst-Schmetterling', category: 'Kinder-Brotzeit', area: 'Kreativ',
    instructions: '1. Apfel waschen, entkernen und in dünne Spalten schneiden.\n2. Weintrauben waschen und halbieren.\n3. Apfelspalten als Schmetterlingsflügel auf einem Teller anordnen.\n4. Weintrauben als Körper und Antennen platzieren.\n5. Joghurt in eine kleine Schüssel geben.\n6. Optional: Schokostreusel auf den Joghurt streuen.\n7. Mit Holzspieß zum Dippen servieren.',
    tips: 'Mit Erdbeeren, Beeren oder anderen Lieblingsfrüchten variieren.',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80',
    ingredients: ['Apfel', 'Weintrauben', 'Erdbeeren', 'Naturjoghurt', 'Schokostreusel'],
    measures: ['1', '100g', '50g', '100g', '1 TL'],
    calories: 180, portionGram: 200, portions: 1, vegetarian: true, vegan: false, glutenFree: true, lactoseFree: false, lunchbox: true
  },
  {
    id: 'k3', name: 'Vollkorn-Wal-Sandwich', category: 'Kinder-Brotzeit', area: 'Kreativ',
    instructions: '1. Vollkornbrot großzügig mit Frischkäse bestreichen.\n2. Eine halbe Gurkenscheibe als Walflosse oben platzieren.\n3. Gurkenstreifen als Schwanzflosse unten anlegen.\n4. Paprikastück als Mund ausschneiden und aufkleben.\n5. Eine Olive oder Rosine als Auge befestigen.\n6. Mit kleinen Käsewürfeln als Blasen dekorieren.',
    tips: 'Mit Frischkäse-Kräuter für mehr Geschmack oder Hummus als vegane Variante.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    ingredients: ['Vollkornbrot', 'Frischkäse', 'Gurke', 'Paprika', 'Olive', 'Gouda-Käse'],
    measures: ['2 Scheiben', '2 EL', '3 Scheiben', '1/4', '1', '20g'],
    calories: 220, portionGram: 140, portions: 1, vegetarian: true, vegan: false, glutenFree: false, lactoseFree: false, lunchbox: true
  },
  {
    id: 'k4', name: 'Regenbogen-Gemüsesticks', category: 'Kinder-Brotzeit', area: 'Kreativ',
    instructions: '1. Karotte, Gurke, Paprika (rot, gelb, orange) in gleichmäßige Stifte schneiden.\n2. Brokkoli-Röschen abteilen.\n3. Alles bunt wie ein Regenbogen auf einem Teller anordnen.\n4. Hummus in eine kleine Schüssel in die Mitte stellen.\n5. Kinder beim Zusammenstellen einbeziehen – macht mehr Spaß!',
    tips: 'Hummus selbst machen: Kichererbsen, Tahini, Zitrone, Knoblauch pürieren.',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
    ingredients: ['Karotte', 'Gurke', 'Paprika rot', 'Paprika gelb', 'Brokkoli', 'Hummus'],
    measures: ['1', '1/2', '1/2', '1/2', '50g', '80g'],
    calories: 160, portionGram: 200, portions: 1, vegetarian: true, vegan: true, glutenFree: true, lactoseFree: true, lunchbox: true
  },
];

// ========== HELPERS ==========
function calculatePrice(ingredient: string, measure: string, products: Product[]): number {
  const lowerIng = ingredient.toLowerCase();
  const product = products.find(p => lowerIng.includes(p.name.toLowerCase()));
  if (!product) return 0.30;
  const match = measure.match(/(\d+(?:[.,]\d+)?)/);
  let number = match ? parseFloat(match[1].replace(',', '.')) : 1;
  const m = measure.toLowerCase();
  let needed = m.includes('kg') ? number * 1000 : m.includes('g') ? number : m.includes('l') ? number * 1000 : m.includes('ml') ? number : m.includes('el') ? number * 15 : m.includes('tl') ? number * 5 : number;
  const ps = product.packSize.toLowerCase();
  let packAmount = ps.includes('kg') ? parseFloat(ps) * 1000 : ps.includes('g') ? parseFloat(ps) : ps.includes('l') ? parseFloat(ps) * 1000 : ps.includes('ml') ? parseFloat(ps) : 1;
  const packs = Math.ceil(needed / (packAmount || 1));
  return product.packPrice * packs;
}

function mergeShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
  const map = new Map<string, { item: ShoppingItem; totalGrams: number; totalPrice: number }>();
  for (const item of items) {
    const key = item.ingredient.toLowerCase();
    const match = item.measure.match(/(\d+(?:[.,]\d+)?)/);
    let num = match ? parseFloat(match[1].replace(',', '.')) : 1;
    const m = item.measure.toLowerCase();
    let grams = m.includes('kg') ? num * 1000 : m.includes('g') ? num : m.includes('l') ? num * 1000 : m.includes('ml') ? num : num * 100;
    if (map.has(key)) {
      const e = map.get(key)!;
      e.totalGrams += grams;
      e.totalPrice += item.estimatedPrice || 0;
      e.item.measure = grams >= 1000 ? `${(e.totalGrams / 1000).toFixed(1)}kg` : `${Math.round(e.totalGrams)}g`;
      e.item.estimatedPrice = e.totalPrice;
    } else {
      map.set(key, { item: { ...item }, totalGrams: grams, totalPrice: item.estimatedPrice || 0 });
    }
  }
  return Array.from(map.values()).map(v => v.item);
}

function searchRecipes(query: string, filters: FilterState, allRecipes: Recipe[]): Recipe[] {
  const q = query.toLowerCase();
  let results = allRecipes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    r.area.toLowerCase().includes(q) ||
    r.ingredients.some(i => i.toLowerCase().includes(q))
  );
  if (filters.vegetarian) results = results.filter(r => r.vegetarian);
  if (filters.vegan) results = results.filter(r => r.vegan);
  if (filters.glutenFree) results = results.filter(r => r.glutenFree);
  if (filters.lactoseFree) results = results.filter(r => r.lactoseFree);
  return results;
}

function getRandomLunchboxSuggestions(allRecipes: Recipe[]): { kids: Recipe[]; adults: Recipe[] } {
  const kids = [...allRecipes.filter(r => r.category === 'Kinder-Brotzeit')].sort(() => 0.5 - Math.random());
  const adults = [...allRecipes.filter(r => r.lunchbox && r.category !== 'Kinder-Brotzeit')].sort(() => 0.5 - Math.random());
  return { kids: kids.slice(0, 4), adults: adults.slice(0, 4) };
}

// ========== LOCALSTORAGE ==========
const SK = {
  favorites: 'rw_favorites',
  mealplan: 'rw_mealplan',
  shopping: 'rw_shoppinglist',
  products: 'rw_products',
  purchases: 'rw_purchases',
  customRecipes: 'rw_custom',
  dailyLimit: 'rw_daily_limit',
};
const lsGet = (k: string, fallback: any) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fallback; } catch { return fallback; } };
const lsSet = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ========== FILTER TYPE ==========
interface FilterState { vegetarian: boolean; vegan: boolean; glutenFree: boolean; lactoseFree: boolean; }

// ========== CSS ==========
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@600;700&display=swap');

    :root {
      --ocean: #006FBF;
      --ocean-light: #0090E7;
      --ocean-dark: #004F8C;
      --ocean-glow: rgba(0,111,191,0.15);
      --ocean-glow2: rgba(0,144,231,0.08);
      --surface: #f0f4f9;
      --card: #ffffff;
      --card2: #f8fafd;
      --text: #0d1821;
      --text2: #4a5568;
      --text3: #8a9ab0;
      --border: rgba(0,111,191,0.12);
      --border2: rgba(0,0,0,0.06);
      --shadow-sm: 0 2px 8px rgba(0,70,140,0.06);
      --shadow-md: 0 6px 24px rgba(0,70,140,0.1);
      --shadow-lg: 0 16px 48px rgba(0,70,140,0.14);
      --radius: 20px;
      --radius-sm: 12px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--surface);
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    .app { min-height: 100vh; padding-bottom: 100px; }

    /* Header */
    .hdr {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(24px);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      height: 64px;
      display: flex;
      align-items: center;
    }
    .hdr-inner {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--ocean-dark);
      display: flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
    }
    .logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--ocean), var(--ocean-light));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 4px 12px var(--ocean-glow);
    }

    /* Main */
    .main { max-width: 1200px; margin: 0 auto; padding: 28px 20px; }

    /* Search Bar */
    .search-bar {
      background: var(--card);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
      margin-bottom: 8px;
    }
    .search-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .search-input-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon-left {
      position: absolute;
      left: 14px;
      color: var(--ocean);
      pointer-events: none;
    }
    .inp {
      width: 100%;
      height: 48px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0 48px 0 44px;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      background: var(--card2);
      color: var(--text);
      transition: all 0.2s;
      outline: none;
    }
    .inp:focus {
      border-color: var(--ocean);
      background: #fff;
      box-shadow: 0 0 0 3px var(--ocean-glow);
    }
    .inp::placeholder { color: var(--text3); }
    .textarea {
      width: 100%;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      background: var(--card2);
      color: var(--text);
      resize: vertical;
      min-height: 90px;
      outline: none;
      transition: all 0.2s;
    }
    .textarea:focus { border-color: var(--ocean); box-shadow: 0 0 0 3px var(--ocean-glow); }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      background: var(--card2);
      color: var(--text2);
      border: 1.5px solid var(--border);
      transition: all 0.2s;
      user-select: none;
    }
    .chip:hover { border-color: var(--ocean); color: var(--ocean); }
    .chip.active { background: var(--ocean); color: #fff; border-color: var(--ocean); box-shadow: 0 2px 8px var(--ocean-glow); }

    /* Tabs */
    .tabs-wrap {
      background: var(--card);
      border-radius: var(--radius);
      padding: 6px;
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .tab {
      flex: 1;
      min-width: 80px;
      border: none;
      border-radius: 14px;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: transparent;
      color: var(--text3);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab:hover { background: var(--ocean-glow2); color: var(--ocean); }
    .tab.active {
      background: linear-gradient(135deg, var(--ocean), var(--ocean-light));
      color: #fff;
      box-shadow: 0 4px 12px var(--ocean-glow);
    }

    /* Cards */
    .card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border2);
      transition: all 0.25s ease;
    }
    .card:hover { box-shadow: var(--shadow-md); }
    .card2 {
      background: var(--card2);
      border-radius: var(--radius-sm);
      padding: 16px;
      border: 1px solid var(--border);
    }

    .card-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media(min-width: 560px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
    @media(min-width: 900px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
    @media(min-width: 1200px) { .card-grid { grid-template-columns: repeat(4, 1fr); } }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 500;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.18s ease;
      padding: 0 18px;
      height: 42px;
      white-space: nowrap;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--ocean), var(--ocean-light));
      color: #fff;
      box-shadow: 0 2px 8px var(--ocean-glow);
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 16px var(--ocean-glow); }
    .btn-secondary { background: var(--ocean-glow2); color: var(--ocean); border: 1px solid var(--ocean-glow); }
    .btn-secondary:hover { background: var(--ocean-glow); }
    .btn-ghost { background: transparent; color: var(--text2); border: 1.5px solid var(--border); }
    .btn-ghost:hover { border-color: var(--ocean); color: var(--ocean); background: var(--ocean-glow2); }
    .btn-danger { background: linear-gradient(135deg, #ff3b30, #ff6b63); color: #fff; }
    .btn-sm { height: 34px; padding: 0 14px; font-size: 13px; border-radius: 10px; }
    .btn-icon { width: 38px; height: 38px; padding: 0; border-radius: 10px; background: var(--ocean-glow2); color: var(--ocean); border: 1px solid var(--ocean-glow); }
    .btn-icon:hover { background: var(--ocean); color: #fff; }

    /* Recipe Card */
    .recipe-img { width: 100%; height: 150px; object-fit: cover; border-radius: 14px; margin-bottom: 12px; cursor: pointer; transition: transform 0.2s; display: block; }
    .recipe-img:hover { transform: scale(1.02); }

    /* Section label */
    .slbl {
      font-size: 12px;
      font-weight: 600;
      color: var(--ocean);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--ocean-glow2);
      color: var(--ocean-dark);
      border-radius: 50px;
      padding: 3px 10px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-green { background: #e8f8f1; color: #1a7a4a; }
    .badge-amber { background: #fff8e1; color: #9a6700; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,20,40,0.5);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
    }
    @media(min-width: 600px) { .modal-overlay { align-items: center; } }
    .modal {
      background: var(--card);
      border-radius: 28px 28px 0 0;
      padding: 24px;
      width: 100%;
      max-width: 700px;
      max-height: 92vh;
      overflow-y: auto;
    }
    @media(min-width: 600px) { .modal { border-radius: 28px; max-height: 85vh; } }
    .modal-handle { width: 40px; height: 4px; background: var(--border); border-radius: 40px; margin: 0 auto 20px; }

    /* Detail tabs */
    .dtab { flex: 1; text-align: center; padding: 10px; background: none; border: none; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 14px; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text3); transition: all 0.2s; }
    .dtab.active { color: var(--ocean); border-bottom-color: var(--ocean); }

    /* List row */
    .list-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border2); }
    .list-row:last-child { border-bottom: none; }

    /* Spinner */
    .spinner { width: 40px; height: 40px; border: 3px solid var(--ocean-glow); border-top-color: var(--ocean); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 40px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Animations */
    .fade-up { animation: fadeUp 0.3s ease-out; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

    /* Meal plan grid */
    .day-card { background: var(--card2); border: 1.5px solid var(--border); border-radius: 14px; padding: 12px 14px; }
    .day-card.filled { border-color: var(--ocean); background: var(--ocean-glow2); }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

    /* Voice active */
    .voice-active { background: var(--ocean) !important; color: #fff !important; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

    /* Hero section */
    .hero {
      background: linear-gradient(135deg, var(--ocean-dark) 0%, var(--ocean) 50%, var(--ocean-light) 100%);
      border-radius: var(--radius);
      padding: 36px 28px;
      color: #fff;
      position: relative;
      overflow: hidden;
      margin-bottom: 28px;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.06);
      border-radius: 50%;
    }
    .hero::after {
      content: '';
      position: absolute;
      bottom: -60px;
      right: 60px;
      width: 140px;
      height: 140px;
      background: rgba(255,255,255,0.04);
      border-radius: 50%;
    }

    /* Section spacing */
    .section { margin-bottom: 36px; }
  `}</style>
);

// ========== MAIN COMPONENT ==========
export default function RezeptePage() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeView, setActiveView] = useState<'start' | 'favorites' | 'lunchbox' | 'mealplan' | 'shopping' | 'create'>('start');
  const [filters, setFilters] = useState<FilterState>({ vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false });
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([
    { day: 'Montag', recipeId: null, recipeName: null },
    { day: 'Dienstag', recipeId: null, recipeName: null },
    { day: 'Mittwoch', recipeId: null, recipeName: null },
    { day: 'Donnerstag', recipeId: null, recipeName: null },
    { day: 'Freitag', recipeId: null, recipeName: null },
    { day: 'Samstag', recipeId: null, recipeName: null },
    { day: 'Sonntag', recipeId: null, recipeName: null },
  ]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [products] = useState<Product[]>(defaultProducts);
  const [purchases] = useState<Purchase[]>([]);
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [lunchboxKids, setLunchboxKids] = useState<Recipe[]>([]);
  const [lunchboxAdults, setLunchboxAdults] = useState<Recipe[]>([]);
  const [listening, setListening] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({ name: '', category: '', instructions: '', tips: '', calories: 0, portionGram: 0, portions: 4, image: '', vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false, lunchbox: false });
  const [ingredientsList, setIngredientsList] = useState<{ name: string; measure: string }[]>([]);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const custom: Recipe[] = lsGet(SK.customRecipes, []);
    const all = [...defaultRecipes, ...custom];
    setAllRecipes(all);
    setFavorites(lsGet(SK.favorites, []));
    const storedPlan = lsGet(SK.mealplan, null);
    if (storedPlan) setMealPlan(storedPlan);
    setShoppingList(lsGet(SK.shopping, []));
    setDailyLimit(lsGet(SK.dailyLimit, 2000));
    const { kids, adults } = getRandomLunchboxSuggestions(all);
    setLunchboxKids(kids);
    setLunchboxAdults(adults);
  }, []);

  useEffect(() => { lsSet(SK.favorites, favorites); }, [favorites]);
  useEffect(() => { lsSet(SK.mealplan, mealPlan); }, [mealPlan]);
  useEffect(() => {
    const merged = mergeShoppingItems(shoppingList);
    lsSet(SK.shopping, merged);
  }, [shoppingList]);
  useEffect(() => { lsSet(SK.dailyLimit, dailyLimit); }, [dailyLimit]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && !Object.values(filters).some(Boolean)) return;
    setLoading(true);
    setTimeout(() => {
      const results = searchQuery.trim()
        ? searchRecipes(searchQuery, filters, allRecipes)
        : allRecipes.filter(r => {
            if (filters.vegetarian && !r.vegetarian) return false;
            if (filters.vegan && !r.vegan) return false;
            if (filters.glutenFree && !r.glutenFree) return false;
            if (filters.lactoseFree && !r.lactoseFree) return false;
            return true;
          });
      setSearchResults(results);
      setHasSearched(true);
      setLoading(false);
    }, 150);
  };

  const toggleFilter = (key: keyof FilterState) => {
    const next = { ...filters, [key]: !filters[key] };
    setFilters(next);
  };

  const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const addToShoppingList = (recipe: Recipe) => {
    const newItems: ShoppingItem[] = recipe.ingredients.map((ing, idx) => ({
      id: `${recipe.id}-${idx}-${Date.now()}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      ingredient: ing,
      measure: recipe.measures[idx],
      quantity: 1,
      checked: false,
      estimatedPrice: calculatePrice(ing, recipe.measures[idx], products),
    }));
    setShoppingList(prev => mergeShoppingItems([...prev, ...newItems]));
  };

  const addBaseProducts = (items: string[]) => {
    const newItems: ShoppingItem[] = items.map((name, idx) => ({
      id: `base-${name}-${Date.now()}-${idx}`,
      recipeId: 'base',
      recipeName: 'Basisprodukte',
      ingredient: name,
      measure: '1 Stück',
      quantity: 1,
      checked: false,
      estimatedPrice: 1.5,
    }));
    setShoppingList(prev => mergeShoppingItems([...prev, ...newItems]));
  };

  const addAllMealPlanToShopping = () => {
    for (const day of mealPlan.filter(d => d.recipeId)) {
      const recipe = allRecipes.find(r => r.id === day.recipeId);
      if (recipe) addToShoppingList(recipe);
    }
  };

  const addToMealPlan = (recipe: Recipe, dayIndex: number) => {
    const updated = [...mealPlan];
    updated[dayIndex] = { ...updated[dayIndex], recipeId: recipe.id, recipeName: recipe.name };
    setMealPlan(updated);
  };

  const removeFromMealPlan = (dayIndex: number) => {
    const updated = [...mealPlan];
    updated[dayIndex] = { ...updated[dayIndex], recipeId: null, recipeName: null };
    setMealPlan(updated);
  };

  const randomizeMealPlan = () => {
    const available = allRecipes.filter(r => !r.category.includes('Kinder')).sort(() => 0.5 - Math.random());
    setMealPlan(prev => prev.map((day, i) => ({
      ...day,
      recipeId: available[i % available.length].id,
      recipeName: available[i % available.length].name,
    })));
  };

  const startVoiceInput = (onResult: (t: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Spracheingabe nicht unterstützt.'); return; }
    const r = new SR();
    r.lang = 'de-DE';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e: any) => onResult(e.results[0][0].transcript);
    r.start();
  };

  const saveCustomRecipe = () => {
    if (!newRecipe.name || !newRecipe.instructions || ingredientsList.length === 0) {
      alert('Bitte Name, Zutaten und Zubereitung angeben.');
      return;
    }
    const recipe: Recipe = {
      id: editingRecipeId || `custom_${Date.now()}`,
      name: newRecipe.name!,
      category: newRecipe.category || 'Eigenes Rezept',
      area: 'Benutzerdefiniert',
      instructions: newRecipe.instructions!,
      tips: newRecipe.tips || '',
      image: newRecipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80',
      ingredients: ingredientsList.map(i => i.name),
      measures: ingredientsList.map(i => i.measure),
      calories: newRecipe.calories || 300,
      portionGram: newRecipe.portionGram || 250,
      portions: newRecipe.portions || 4,
      vegetarian: newRecipe.vegetarian || false,
      vegan: newRecipe.vegan || false,
      glutenFree: newRecipe.glutenFree || false,
      lactoseFree: newRecipe.lactoseFree || false,
      lunchbox: newRecipe.lunchbox || false,
      isCustom: true,
      shareCode: `RC-${Math.random().toString(36).substr(2,8).toUpperCase()}`,
    };
    const updated = editingRecipeId
      ? allRecipes.map(r => r.id === editingRecipeId ? recipe : r)
      : [...allRecipes, recipe];
    setAllRecipes(updated);
    lsSet(SK.customRecipes, updated.filter(r => r.isCustom));
    resetCreateForm();
    alert(editingRecipeId ? 'Rezept aktualisiert!' : 'Rezept gespeichert!');
    setEditingRecipeId(null);
  };

  const resetCreateForm = () => {
    setNewRecipe({ name: '', category: '', instructions: '', tips: '', calories: 0, portionGram: 0, portions: 4, image: '', vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false, lunchbox: false });
    setIngredientsList([]);
  };

  const startEditRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setNewRecipe({ ...recipe });
    setIngredientsList(recipe.ingredients.map((n, i) => ({ name: n, measure: recipe.measures[i] })));
    setActiveView('create');
  };

  const deleteCustomRecipe = (id: string) => {
    const updated = allRecipes.filter(r => r.id !== id);
    setAllRecipes(updated);
    lsSet(SK.customRecipes, updated.filter(r => r.isCustom));
  };

  const refreshLunchbox = () => {
    const { kids, adults } = getRandomLunchboxSuggestions(allRecipes);
    setLunchboxKids(kids);
    setLunchboxAdults(adults);
  };

  const favoriteRecipes = allRecipes.filter(r => favorites.includes(r.id));
  const estimatedTotal = shoppingList.reduce((s, i) => s + (i.estimatedPrice || 0), 0);

  return (
    <>
      <GlobalStyle />
      <div className="app">
        <header className="hdr">
          <div className="hdr-inner">
            <div className="logo">
              <div className="logo-icon"><ChefHat size={20} /></div>
              Rezeptwelt
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge"><Flame size={12} /> {allRecipes.length} Rezepte</span>
              <span className="badge badge-green"><Heart size={12} /> {favorites.length} Favoriten</span>
            </div>
          </div>
        </header>

        <main className="main">
          {/* Search */}
          <div className="search-bar" style={{ marginBottom: 20 }}>
            <form onSubmit={handleSearch}>
              <div className="search-row">
                <div className="search-input-wrap">
                  <Search size={17} className="search-icon-left" />
                  <input
                    className="inp"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Alle Rezepte durchsuchen – Name, Kategorie, Zutat …"
                  />
                  <button type="button" className={`btn btn-icon ${listening ? 'voice-active' : ''}`}
                    style={{ position: 'absolute', right: 6, width: 36, height: 36 }}
                    onClick={() => startVoiceInput(setSearchQuery)}>
                    <Mic size={16} />
                  </button>
                </div>
                <button type="submit" className="btn btn-primary">
                  <Search size={15} /> Suchen
                </button>
              </div>
              <div className="filter-chips">
                {(Object.keys(filters) as (keyof FilterState)[]).map(key => (
                  <div key={key} className={`chip ${filters[key] ? 'active' : ''}`} onClick={() => toggleFilter(key)}>
                    {key === 'vegetarian' && <Salad size={13} />}
                    {key === 'vegan' && <Leaf size={13} />}
                    {key === 'glutenFree' && <Wheat size={13} />}
                    {key === 'lactoseFree' && <Milk size={13} />}
                    {key === 'vegetarian' ? 'Vegetarisch' : key === 'vegan' ? 'Vegan' : key === 'glutenFree' ? 'Glutenfrei' : 'Laktosefrei'}
                  </div>
                ))}
                {(searchQuery || Object.values(filters).some(Boolean)) && (
                  <div className="chip" onClick={() => { setSearchQuery(''); setFilters({ vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false }); setHasSearched(false); }} style={{ color: '#ff3b30', borderColor: '#ff3b30' }}>
                    <X size={13} /> Zurücksetzen
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="section fade-up">
              <div className="slbl"><Search size={14} /> {searchResults.length} Ergebnisse</div>
              {loading ? <div className="spinner" /> : searchResults.length === 0
                ? <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Keine Rezepte für diese Suche gefunden.</div>
                : <div className="card-grid">{searchResults.map(r => <RecipeCard key={r.id} recipe={r} onOpen={() => setSelectedRecipe(r)} onFavorite={() => toggleFavorite(r.id)} isFavorite={favorites.includes(r.id)} onEdit={r.isCustom ? () => startEditRecipe(r) : undefined} />)}</div>
              }
            </div>
          )}

          {/* Tabs */}
          <div className="tabs-wrap">
            {([
              { key: 'start', label: 'Start', icon: Home },
              { key: 'favorites', label: `Favoriten (${favorites.length})`, icon: Heart },
              { key: 'lunchbox', label: 'Brotzeitdosen', icon: Coffee },
              { key: 'mealplan', label: 'Wochenplan', icon: Calendar },
              { key: 'shopping', label: `Einkauf (${shoppingList.length})`, icon: ShoppingCart },
              { key: 'create', label: 'Erstellen', icon: Edit3 },
            ] as const).map(tab => (
              <button key={tab.key} className={`tab ${activeView === tab.key ? 'active' : ''}`} onClick={() => setActiveView(tab.key)}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Views */}
          {activeView === 'start' && (
            <StartView allRecipes={allRecipes} onOpen={setSelectedRecipe} onFavorite={toggleFavorite} favorites={favorites} />
          )}
          {activeView === 'favorites' && (
            <FavoritesView recipes={favoriteRecipes} onOpen={setSelectedRecipe} onFavorite={toggleFavorite} favorites={favorites} onAddToShopping={addToShoppingList} onAddToMealPlan={addToMealPlan} />
          )}
          {activeView === 'lunchbox' && (
            <LunchboxView kids={lunchboxKids} adults={lunchboxAdults} onRefresh={refreshLunchbox} onOpen={setSelectedRecipe} onFavorite={toggleFavorite} favorites={favorites} onAddToShopping={addToShoppingList} />
          )}
          {activeView === 'mealplan' && (
            <MealPlanView mealPlan={mealPlan} onAddToPlan={addToMealPlan} onRemovePlan={removeFromMealPlan} onRandomize={randomizeMealPlan} onAddAllToShopping={addAllMealPlanToShopping} allRecipes={allRecipes} dailyLimit={dailyLimit} setDailyLimit={setDailyLimit} onOpen={setSelectedRecipe} />
          )}
          {activeView === 'shopping' && (
            <ShoppingView items={shoppingList} setItems={setShoppingList} estimatedTotal={estimatedTotal} onAddBase={addBaseProducts} purchases={purchases} />
          )}
          {activeView === 'create' && (
            <CreateView
              newRecipe={newRecipe}
              setNewRecipe={setNewRecipe}
              ingredientsList={ingredientsList}
              setIngredientsList={setIngredientsList}
              onSave={saveCustomRecipe}
              onCancel={() => { resetCreateForm(); setEditingRecipeId(null); setActiveView('start'); }}
              customRecipes={allRecipes.filter(r => r.isCustom)}
              onEdit={startEditRecipe}
              onDelete={deleteCustomRecipe}
              isEditing={!!editingRecipeId}
            />
          )}
        </main>

        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onFavorite={() => toggleFavorite(selectedRecipe.id)}
            isFavorite={favorites.includes(selectedRecipe.id)}
            onAddToShopping={() => addToShoppingList(selectedRecipe)}
            mealPlan={mealPlan}
            onAddToMealPlan={(dayIdx) => addToMealPlan(selectedRecipe, dayIdx)}
          />
        )}
      </div>
    </>
  );
}

// ========== START VIEW ==========
function StartView({ allRecipes, onOpen, onFavorite, favorites }: any) {
  const kidsRecipes = allRecipes.filter((r: Recipe) => r.category === 'Kinder-Brotzeit');
  const featured = allRecipes.filter((r: Recipe) => r.category !== 'Kinder-Brotzeit').slice(0, 8);
  return (
    <div className="fade-up">
      <div className="hero">
        <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Willkommen zurück</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Was kochen wir heute?</div>
        <div style={{ opacity: 0.8, fontSize: 15 }}>Entdecke {allRecipes.length} leckere Rezepte für jeden Anlass</div>
      </div>

      <div className="section">
        <div className="slbl"><Baby size={14} /> Kinder-Brotzeit</div>
        <div className="card-grid">
          {kidsRecipes.map((r: Recipe) => <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} />)}
        </div>
      </div>

      <div className="section">
        <div className="slbl"><Sparkles size={14} /> Alle Rezepte</div>
        <div className="card-grid">
          {featured.map((r: Recipe) => <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} />)}
        </div>
      </div>
    </div>
  );
}

// ========== RECIPE CARD ==========
function RecipeCard({ recipe, onOpen, onFavorite, isFavorite, onEdit }: any) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <img src={recipe.image} alt={recipe.name} className="recipe-img" onClick={onOpen}
        onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'; }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, flex: 1, paddingRight: 8 }}>{recipe.name}</h3>
        <button className="btn btn-icon" style={{ flexShrink: 0 }} onClick={onFavorite}>
          <Heart size={15} fill={isFavorite ? 'var(--ocean)' : 'none'} color={isFavorite ? 'var(--ocean)' : 'currentColor'} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="badge"><Flame size={11} /> {recipe.calories} kcal</span>
        {recipe.vegan && <span className="badge badge-green">Vegan</span>}
        {recipe.glutenFree && <span className="badge badge-amber">Glutenfrei</span>}
        {recipe.lunchbox && <span className="badge"><Coffee size={11} /> Brotzeit</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onOpen}>Details <ArrowRight size={13} /></button>
        {onEdit && <button className="btn btn-ghost btn-sm" onClick={onEdit}><Pencil size={13} /></button>}
      </div>
    </div>
  );
}

// ========== FAVORITES VIEW ==========
function FavoritesView({ recipes, onOpen, onFavorite, favorites, onAddToShopping, onAddToMealPlan }: any) {
  const [q, setQ] = useState('');
  const filtered = recipes.filter((r: Recipe) => r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 20 }}>
        <input className="inp" style={{ paddingLeft: 16 }} placeholder="Favoriten durchsuchen…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {filtered.length === 0
        ? <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: 48 }}>
            <Heart size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            Noch keine Favoriten gespeichert.
          </div>
        : <div className="card-grid">
            {filtered.map((r: Recipe) => (
              <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <img src={r.image} className="recipe-img" onClick={() => onOpen(r)} onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'; }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.name}</h3>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className="badge"><Flame size={11} /> {r.calories} kcal</span>
                  {r.vegan && <span className="badge badge-green">Vegan</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onOpen(r)}>Details</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onAddToShopping(r)}><ShoppingCart size={13} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(r.id)}><Heart size={13} fill="var(--ocean)" color="var(--ocean)" /></button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ========== LUNCHBOX VIEW ==========
function LunchboxView({ kids, adults, onRefresh, onOpen, onFavorite, favorites, onAddToShopping }: any) {
  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--ocean-glow2), var(--ocean-glow))', border: '1px solid var(--ocean-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Brotzeitdosen-Ideen</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Frisch generierte Vorschläge für Kinder & Erwachsene</div>
          </div>
          <button className="btn btn-primary" onClick={onRefresh}><RefreshCw size={15} /> Neue Ideen</button>
        </div>
      </div>

      <div className="section">
        <div className="slbl"><Baby size={14} /> Für Kinder (Kita & Schule)</div>
        <div className="card-grid">
          {kids.map((r: Recipe) => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <img src={r.image} className="recipe-img" onClick={() => onOpen(r)} onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80'; }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{r.name}</h3>
                <button className="btn btn-icon" style={{ flexShrink: 0 }} onClick={() => onFavorite(r.id)}>
                  <Heart size={14} fill={favorites.includes(r.id) ? 'var(--ocean)' : 'none'} color="var(--ocean)" />
                </button>
              </div>
              <span className="badge" style={{ marginBottom: 12, width: 'fit-content' }}><Flame size={11} /> {r.calories} kcal</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onAddToShopping(r)}><ShoppingCart size={13} /> Kaufen</button>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpen(r)}>Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="slbl"><Coffee size={14} /> Für Erwachsene</div>
        <div className="card-grid">
          {adults.map((r: Recipe) => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <img src={r.image} className="recipe-img" onClick={() => onOpen(r)} onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'; }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{r.name}</h3>
                <button className="btn btn-icon" style={{ flexShrink: 0 }} onClick={() => onFavorite(r.id)}>
                  <Heart size={14} fill={favorites.includes(r.id) ? 'var(--ocean)' : 'none'} color="var(--ocean)" />
                </button>
              </div>
              <span className="badge" style={{ marginBottom: 12, width: 'fit-content' }}><Flame size={11} /> {r.calories} kcal</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onAddToShopping(r)}><ShoppingCart size={13} /> Kaufen</button>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpen(r)}>Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MEAL PLAN VIEW ==========
function MealPlanView({ mealPlan, onAddToPlan, onRemovePlan, onRandomize, onAddAllToShopping, allRecipes, dailyLimit, setDailyLimit, onOpen }: any) {
  const [showRecipePicker, setShowRecipePicker] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const filteredForPicker = allRecipes.filter((r: Recipe) =>
    r.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={onRandomize}><Shuffle size={14} /> Zufällig würfeln</button>
          <button className="btn btn-secondary btn-sm" onClick={onAddAllToShopping}><ShoppingCart size={14} /> Alle in Einkaufsliste</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {mealPlan.map((day: DayPlan, idx: number) => (
            <div key={day.day} className={`day-card ${day.recipeId ? 'filled' : ''}`}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>{day.day}</div>
              {day.recipeId ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: 'var(--text)' }}>{day.recipeName}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" style={{ flex: 1 }} onClick={() => { const r = allRecipes.find((x: Recipe) => x.id === day.recipeId); if (r) onOpen(r); }}>Details</button>
                    <button className="btn btn-icon btn-sm" onClick={() => onRemovePlan(idx)} style={{ background: '#fff0f0', color: '#ff3b30', border: 'none' }}><X size={13} /></button>
                  </div>
                </>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { setShowRecipePicker(idx); setPickerSearch(''); }}>
                  <Plus size={14} /> Rezept wählen
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kalorien-Tagesplan */}
      <div className="card">
        <div className="slbl"><Activity size={14} /> Kalorienplan</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Tageslimit:</span>
          <input type="number" className="inp" style={{ width: 110, paddingLeft: 14 }} value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value) || 2000)} />
          <span className="badge"><Flame size={11} /> {dailyLimit} kcal/Tag</span>
        </div>
      </div>

      {/* Recipe Picker Modal */}
      {showRecipePicker !== null && (
        <div className="modal-overlay" onClick={() => setShowRecipePicker(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '70vh' }}>
            <div className="modal-handle" />
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Rezept für {mealPlan[showRecipePicker].day} wählen
            </div>
            <input className="inp" style={{ marginBottom: 14, paddingLeft: 16 }} placeholder="Suchen…" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
            <div style={{ overflowY: 'auto', maxHeight: '50vh' }}>
              {filteredForPicker.map((r: Recipe) => (
                <div key={r.id} className="list-row" style={{ cursor: 'pointer' }} onClick={() => { onAddToPlan(r, showRecipePicker); setShowRecipePicker(null); }}>
                  <img src={r.image} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.category} · {r.calories} kcal</div>
                  </div>
                  <Plus size={16} color="var(--ocean)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== SHOPPING VIEW ==========
function ShoppingView({ items, setItems, estimatedTotal, onAddBase, purchases }: any) {
  const [activeTab, setActiveTab] = useState<'list' | 'base' | 'stats'>('list');
  const [selectedBase, setSelectedBase] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setItems((prev: ShoppingItem[]) => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setItems((prev: ShoppingItem[]) => prev.filter(i => i.id !== id));
  const clearChecked = () => setItems((prev: ShoppingItem[]) => prev.filter(i => !i.checked));
  const clearAll = () => { if (confirm('Einkaufsliste leeren?')) setItems([]); };

  const grouped = items.reduce((acc: any, item: ShoppingItem) => {
    if (!acc[item.recipeId]) acc[item.recipeId] = { name: item.recipeName, items: [] };
    acc[item.recipeId].items.push(item);
    return acc;
  }, {});

  const toggleBaseItem = (item: string) => {
    const next = new Set(selectedBase);
    next.has(item) ? next.delete(item) : next.add(item);
    setSelectedBase(next);
  };

  return (
    <div className="fade-up">
      <div className="tabs-wrap" style={{ marginBottom: 16 }}>
        <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}><List size={14} /> Einkaufsliste</button>
        <button className={`tab ${activeTab === 'base' ? 'active' : ''}`} onClick={() => setActiveTab('base')}><Package size={14} /> Basisprodukte</button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><BarChart3 size={14} /> Statistik</button>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={clearChecked}><Trash2 size={13} /> Abgehakte löschen</button>
            <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={13} /> Alle löschen</button>
          </div>

          {Object.keys(grouped).length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                Einkaufsliste ist leer.
              </div>
            : <>
                {Object.entries(grouped).map(([recipeId, group]: any) => (
                  <div key={recipeId} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ocean)', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{group.name}</div>
                    {group.items.map((item: ShoppingItem) => (
                      <div key={item.id} className="list-row">
                        <button onClick={() => toggle(item.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${item.checked ? 'var(--ocean)' : 'var(--border)'}`, background: item.checked ? 'var(--ocean)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          {item.checked && <Check size={13} color="#fff" />}
                        </button>
                        <span style={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text3)' : 'var(--text)', fontSize: 14 }}>{item.measure} {item.ingredient}</span>
                        <span className="badge" style={{ fontSize: 12 }}>{item.estimatedPrice?.toFixed(2)} €</span>
                        <button onClick={() => remove(item.id)} className="btn btn-icon btn-sm" style={{ background: 'transparent', color: 'var(--text3)', border: 'none', width: 28, height: 28 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ textAlign: 'right', paddingTop: 12, borderTop: '2px solid var(--border)', fontWeight: 600, fontSize: 16 }}>
                  Gesamt: <span style={{ color: 'var(--ocean)' }}>~{estimatedTotal.toFixed(2)} €</span>
                </div>
              </>
          }
        </div>
      )}

      {activeTab === 'base' && (
        <div>
          {BASE_PRODUCTS_CATEGORIES.map(cat => (
            <div key={cat.label} className="card" style={{ marginBottom: 16 }}>
              <div className="slbl"><Package size={14} /> {cat.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {cat.items.map(item => (
                  <div key={item} className={`chip ${selectedBase.has(item) ? 'active' : ''}`} onClick={() => toggleBaseItem(item)}>
                    {selectedBase.has(item) && <Check size={12} />} {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {selectedBase.size > 0 && (
            <div style={{ position: 'sticky', bottom: 20, display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { onAddBase(Array.from(selectedBase)); setSelectedBase(new Set()); alert(`${selectedBase.size} Produkte zur Einkaufsliste hinzugefügt!`); }}>
                <ShoppingCart size={15} /> {selectedBase.size} Produkte hinzufügen
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="card">
          <div className="slbl"><BarChart3 size={14} /> Ausgaben-Übersicht</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="card2" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean)' }}>~{estimatedTotal.toFixed(0)} €</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Aktuelle Liste</div>
            </div>
            <div className="card2" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean)' }}>{items.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Artikel</div>
            </div>
            <div className="card2" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean)' }}>{items.filter((i: ShoppingItem) => i.checked).length}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Erledigt</div>
            </div>
          </div>
          <div style={{ color: 'var(--text3)', textAlign: 'center', fontSize: 14, padding: 20 }}>
            Kaufhistorie wird nach dem ersten Einkauf hier angezeigt.
          </div>
        </div>
      )}
    </div>
  );
}

// ========== CREATE VIEW ==========
function CreateView({ newRecipe, setNewRecipe, ingredientsList, setIngredientsList, onSave, onCancel, customRecipes, onEdit, onDelete, isEditing }: any) {
  const [view, setView] = useState<'list' | 'form'>('list');

  const addIngredient = () => setIngredientsList([...ingredientsList, { name: '', measure: '' }]);
  const updateIngredient = (idx: number, field: string, val: string) => {
    const u = [...ingredientsList];
    u[idx] = { ...u[idx], [field]: val };
    setIngredientsList(u);
  };
  const removeIngredient = (idx: number) => setIngredientsList(ingredientsList.filter((_: any, i: number) => i !== idx));

  const dietOptions: { key: keyof Recipe; label: string }[] = [
    { key: 'vegetarian', label: 'Vegetarisch' },
    { key: 'vegan', label: 'Vegan' },
    { key: 'glutenFree', label: 'Glutenfrei' },
    { key: 'lactoseFree', label: 'Laktosefrei' },
    { key: 'lunchbox', label: 'Für Brotzeit' },
  ];

  return (
    <div className="fade-up">
      <div className="tabs-wrap" style={{ marginBottom: 16 }}>
        <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><BookOpen size={14} /> Meine Rezepte ({customRecipes.length})</button>
        <button className={`tab ${view === 'form' || isEditing ? 'active' : ''}`} onClick={() => { setView('form'); }}><Edit3 size={14} /> {isEditing ? 'Rezept bearbeiten' : 'Neues Rezept'}</button>
      </div>

      {(view === 'list' && !isEditing) && (
        <div>
          {customRecipes.length === 0
            ? <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: 48 }}>
                <ChefHat size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <div>Noch keine eigenen Rezepte erstellt.</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setView('form')}><Plus size={15} /> Erstes Rezept erstellen</button>
              </div>
            : <>
                <button className="btn btn-primary btn-sm" style={{ marginBottom: 16 }} onClick={() => setView('form')}><Plus size={14} /> Neues Rezept</button>
                <div className="card-grid">
                  {customRecipes.map((r: Recipe) => (
                    <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <img src={r.image} className="recipe-img" onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'; }} />
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{r.name}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{r.category}</div>
                      {r.shareCode && (
                        <div className="badge" style={{ marginBottom: 10, width: 'fit-content', fontSize: 11 }}>
                          <Share2 size={10} /> {r.shareCode}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onEdit(r)}><Pencil size={13} /> Bearbeiten</button>
                        <button className="btn btn-icon btn-sm" onClick={() => navigator.clipboard.writeText(r.shareCode || '').then(() => alert('Teilcode kopiert!'))} title="Teilen"><Share2 size={13} /></button>
                        <button className="btn btn-icon btn-sm" style={{ background: '#fff0f0', color: '#ff3b30', border: 'none' }} onClick={() => { if (confirm('Rezept löschen?')) onDelete(r.id); }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      )}

      {(view === 'form' || isEditing) && (
        <div className="card">
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            {isEditing ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Rezeptname *</label>
              <input className="inp" style={{ paddingLeft: 16 }} placeholder="z.B. Omas Apfelstrudel" value={newRecipe.name || ''} onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Kategorie</label>
                <input className="inp" style={{ paddingLeft: 16 }} placeholder="z.B. Pasta, Suppe…" value={newRecipe.category || ''} onChange={e => setNewRecipe({ ...newRecipe, category: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Bild-URL</label>
                <input className="inp" style={{ paddingLeft: 16 }} placeholder="https://…" value={newRecipe.image || ''} onChange={e => setNewRecipe({ ...newRecipe, image: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Kalorien (kcal)</label>
                <input type="number" className="inp" style={{ paddingLeft: 16 }} value={newRecipe.calories || ''} onChange={e => setNewRecipe({ ...newRecipe, calories: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Portion (g)</label>
                <input type="number" className="inp" style={{ paddingLeft: 16 }} value={newRecipe.portionGram || ''} onChange={e => setNewRecipe({ ...newRecipe, portionGram: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Portionen</label>
                <input type="number" className="inp" style={{ paddingLeft: 16 }} value={newRecipe.portions || 4} onChange={e => setNewRecipe({ ...newRecipe, portions: parseInt(e.target.value) || 4 })} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Eigenschaften</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dietOptions.map(opt => (
                  <div key={String(opt.key)} className={`chip ${newRecipe[opt.key] ? 'active' : ''}`} onClick={() => setNewRecipe({ ...newRecipe, [opt.key]: !newRecipe[opt.key] })}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Zutaten *</label>
                <button className="btn btn-ghost btn-sm" onClick={addIngredient}><Plus size={13} /> Zutat hinzufügen</button>
              </div>
              {ingredientsList.map((ing: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="inp" style={{ paddingLeft: 14 }} placeholder="Zutat" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} />
                  <input className="inp" style={{ paddingLeft: 14, maxWidth: 140 }} placeholder="Menge (200g)" value={ing.measure} onChange={e => updateIngredient(idx, 'measure', e.target.value)} />
                  <button className="btn btn-icon btn-sm" style={{ flexShrink: 0, background: '#fff0f0', color: '#ff3b30', border: 'none' }} onClick={() => removeIngredient(idx)}><Trash2 size={13} /></button>
                </div>
              ))}
              {ingredientsList.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>Noch keine Zutaten hinzugefügt.</div>}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Zubereitung * <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(jeden Schritt als neue Zeile)</span></label>
              <textarea className="textarea" placeholder="1. Wasser zum Kochen bringen.&#10;2. Pasta hineingeben.&#10;3. …" value={newRecipe.instructions || ''} onChange={e => setNewRecipe({ ...newRecipe, instructions: e.target.value })} style={{ minHeight: 140 }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Tipps & Hinweise</label>
              <textarea className="textarea" placeholder="Optionale Tipps…" value={newRecipe.tips || ''} onChange={e => setNewRecipe({ ...newRecipe, tips: e.target.value })} style={{ minHeight: 70 }} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onSave}><Save size={15} /> {isEditing ? 'Aktualisieren' : 'Speichern'}</button>
              <button className="btn btn-ghost" onClick={onCancel}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== RECIPE MODAL ==========
function RecipeModal({ recipe, onClose, onFavorite, isFavorite, onAddToShopping, mealPlan, onAddToMealPlan }: any) {
  const [tab, setTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [showDayPicker, setShowDayPicker] = useState(false);

  const steps = recipe.instructions
    .split('\n')
    .filter((s: string) => s.trim())
    .map((s: string) => s.replace(/^\d+\.\s*\d+\./, (m: string) => m.split('.').slice(-1)[0] + '.').replace(/^(\d+\.)\s*\1/, '$1').trim())
    .map((s: string) => {
      // Remove duplicate leading numbers like "1. 1. " or "1.1."
      return s.replace(/^(\d+\.)\s*\1\s*/, '$1 ').replace(/^(\d+\.\s*)+/, (m: string) => {
        const nums = m.match(/\d+\./g) || [];
        return nums[nums.length - 1] + ' ';
      });
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{recipe.name}</h2>
            <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{recipe.category} · {recipe.area}</div>
          </div>
          <button className="btn btn-icon" onClick={onClose}><X size={17} /></button>
        </div>

        <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }}
          onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'; }} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="badge"><Flame size={11} /> {recipe.calories} kcal</span>
          <span className="badge"><UtensilsCrossed size={11} /> {recipe.portions} Portionen</span>
          {recipe.vegan && <span className="badge badge-green">Vegan</span>}
          {recipe.vegetarian && !recipe.vegan && <span className="badge badge-green">Vegetarisch</span>}
          {recipe.glutenFree && <span className="badge badge-amber">Glutenfrei</span>}
          {recipe.lactoseFree && <span className="badge badge-amber">Laktosefrei</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={onFavorite}>
            <Heart size={14} fill={isFavorite ? '#fff' : 'none'} /> {isFavorite ? 'Favorit entfernen' : 'Als Favorit'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onAddToShopping}><ShoppingCart size={14} /> Einkaufen</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDayPicker(!showDayPicker)}><Calendar size={14} /> Wochenplan</button>
        </div>

        {showDayPicker && (
          <div className="card2" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Zu welchem Tag hinzufügen?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {mealPlan.map((day: DayPlan, idx: number) => (
                <button key={day.day} className="btn btn-ghost btn-sm" onClick={() => { onAddToMealPlan(idx); setShowDayPicker(false); }}>
                  {day.day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <button className={`dtab ${tab === 'ingredients' ? 'active' : ''}`} onClick={() => setTab('ingredients')}>Zutaten</button>
          <button className={`dtab ${tab === 'instructions' ? 'active' : ''}`} onClick={() => setTab('instructions')}>Zubereitung</button>
        </div>

        {tab === 'ingredients' ? (
          <ul style={{ listStyle: 'none', display: 'grid', gap: 8 }}>
            {recipe.ingredients.map((ing: string, i: number) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--card2)', borderRadius: 10, fontSize: 14 }}>
                <span>{ing}</span>
                <span style={{ fontWeight: 600, color: 'var(--ocean)' }}>{recipe.measures[i]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ol style={{ listStyle: 'none', display: 'grid', gap: 12 }}>
            {steps.map((step: string, i: number) => (
              <li key={i} style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ocean), var(--ocean-light))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        )}

        {recipe.tips && (
          <div style={{ marginTop: 20, background: 'linear-gradient(135deg, var(--ocean-glow2), var(--ocean-glow))', padding: '12px 16px', borderRadius: 14, fontSize: 14, border: '1px solid var(--ocean-glow)' }}>
            <span style={{ fontWeight: 600, color: 'var(--ocean)' }}>💡 Tipp: </span>{recipe.tips}
          </div>
        )}
      </div>
    </div>
  );
}