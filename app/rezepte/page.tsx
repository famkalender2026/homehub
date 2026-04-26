'use client';
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import {
  Search, Home, Heart, Calendar, ShoppingCart, Coffee, Salad, Wheat, Milk, Flame,
  UtensilsCrossed, X, Plus, Trash2, Check, TrendingUp, Camera, Store, DollarSign,
  BarChart3, ChevronDown, ChevronUp, List, FileText, Sparkles, ArrowRight, ShoppingBag,
  Star, RefreshCw, Activity, Edit3, Save, Shuffle, TrendingDown, Package, Baby, Mic,
  Share2, Upload, Download, Pencil, BookOpen, ChefHat, Leaf, Folder, FolderPlus, Move, Receipt
} from 'lucide-react';

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
  category?: string;
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
  receiptImage?: string;
}

interface FavoriteFolder {
  id: string;
  name: string;
  recipeIds: string[];
}

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

// ========== TOAST CONTEXT ==========
const ToastContext = createContext<{
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? 'linear-gradient(135deg, #006FBF, #0090E7)' : t.type === 'error' ? '#ff3b30' : '#333',
            color: '#fff', padding: '12px 20px', borderRadius: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 500,
            textAlign: 'center', backdropFilter: 'blur(8px)', animation: 'fadeUp 0.2s ease-out', pointerEvents: 'auto'
          }}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

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

// ========== RECIPE DATABASE (vollständig aus Ihrem Original) ==========
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

// ========== HELPER-FUNKTIONEN ==========
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

function getIngredientCategory(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  if (['zwiebel', 'knoblauch', 'karotte', 'tomate', 'paprika', 'zucchini', 'gurke', 'brokkoli', 'aubergine', 'spinat', 'salat', 'kartoffel'].some(k => lower.includes(k))) return '🥬 Obst & Gemüse';
  if (['milch', 'käse', 'gouda', 'frischkäse', 'joghurt', 'butter', 'sahne', 'quark', 'ei', 'eier'].some(k => lower.includes(k))) return '🥛 Milchprodukte & Eier';
  if (['hackfleisch', 'hähnchen', 'rinder', 'lamm', 'schwein', 'speck', 'wurst', 'lachs', 'thunfisch'].some(k => lower.includes(k))) return '🥩 Fleisch & Fisch';
  if (['brot', 'toast', 'brötchen', 'vollkornbrot', 'brotzeit'].some(k => lower.includes(k))) return '🍞 Brot & Backwaren';
  if (['spaghetti', 'pasta', 'nudeln', 'reis', 'quinoa', 'couscous', 'haferflocken'].some(k => lower.includes(k))) return '🍝 Getreide & Beilagen';
  if (['öl', 'olivenöl', 'butter', 'margarine', 'kokosöl'].some(k => lower.includes(k))) return '🫒 Öle & Fette';
  if (['salz', 'pfeffer', 'gewürz', 'oregano', 'paprikapulver', 'knoblauchpulver', 'zimt', 'vanille'].some(k => lower.includes(k))) return '🧂 Gewürze & Kräuter';
  return '🛒 Sonstiges';
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
      map.set(key, { item: { ...item, category: item.category || getIngredientCategory(item.ingredient) }, totalGrams: grams, totalPrice: item.estimatedPrice || 0 });
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

function getRandomUniqueSuggestions(recipes: Recipe[], count: number, excludeIds: string[] = []): Recipe[] {
  const available = recipes.filter(r => !excludeIds.includes(r.id));
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
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
  favoriteFolders: 'rw_favorite_folders',
  baseProducts: 'rw_base_products',
  purchaseStats: 'rw_purchase_stats',
};
const lsGet = (k: string, fallback: any) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fallback; } catch { return fallback; } };
const lsSet = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

interface FilterState { vegetarian: boolean; vegan: boolean; glutenFree: boolean; lactoseFree: boolean; }

// ========== GLOBAL CSS (responsive, mobil optimiert) ==========
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

    .main { max-width: 1200px; margin: 0 auto; padding: 28px 20px; }

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

    .recipe-img { width: 100%; height: 150px; object-fit: cover; border-radius: 14px; margin-bottom: 12px; cursor: pointer; transition: transform 0.2s; display: block; }
    .recipe-img:hover { transform: scale(1.02); }

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

    .dtab { flex: 1; text-align: center; padding: 10px; background: none; border: none; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 14px; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text3); transition: all 0.2s; }
    .dtab.active { color: var(--ocean); border-bottom-color: var(--ocean); }

    .list-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border2); }
    .list-row:last-child { border-bottom: none; }

    .spinner { width: 40px; height: 40px; border: 3px solid var(--ocean-glow); border-top-color: var(--ocean); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 40px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .fade-up { animation: fadeUp 0.3s ease-out; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

    .day-card { background: var(--card2); border: 1.5px solid var(--border); border-radius: 14px; padding: 12px 14px; }
    .day-card.filled { border-color: var(--ocean); background: var(--ocean-glow2); }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

    .voice-active { background: var(--ocean) !important; color: #fff !important; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

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

    .section { margin-bottom: 36px; }

    /* Kalorien-Analyse spezifische Styles */
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      flex: 1;
      min-width: 120px;
      background: var(--card2);
      border-radius: var(--radius-sm);
      padding: 16px;
      text-align: center;
      border: 1px solid var(--border);
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--ocean);
    }
    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
    .trend-stable { color: #f59e0b; }
    .calorie-bar-container {
      background: var(--border);
      border-radius: 20px;
      height: 8px;
      overflow: hidden;
      margin-top: 8px;
    }
    .calorie-bar-fill {
      background: linear-gradient(90deg, var(--ocean), var(--ocean-light));
      height: 100%;
      border-radius: 20px;
      transition: width 0.3s;
    }
  `}</style>
);

// ========== HAUPTKOMPONENTE ==========
export default function RezeptePage() {
  const { showToast } = useToast();

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeView, setActiveView] = useState<'start' | 'favorites' | 'lunchbox' | 'mealplan' | 'shopping' | 'create' | 'stats'>('start');
  const [filters, setFilters] = useState<FilterState>({ vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false });
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteFolders, setFavoriteFolders] = useState<FavoriteFolder[]>(lsGet(SK.favoriteFolders, []));
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [dailySuggestions, setDailySuggestions] = useState<Recipe[]>([]);
  const [lunchboxSuggestions, setLunchboxSuggestions] = useState<{ kids: Recipe[]; adults: Recipe[] }>({ kids: [], adults: [] });
  const lastSuggestionIds = useRef<{ daily: string[]; kids: string[]; adults: string[] }>({ daily: [], kids: [], adults: [] });
  const [baseProducts, setBaseProducts] = useState<string[]>(lsGet(SK.baseProducts, ['Milch', 'Eier', 'Brot', 'Butter', 'Salz', 'Olivenöl']));
  const [purchaseStats, setPurchaseStats] = useState<Record<string, number>>(lsGet(SK.purchaseStats, {}));
  const [listening, setListening] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({ name: '', category: '', instructions: '', tips: '', calories: 0, portionGram: 0, portions: 4, image: '', vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false, lunchbox: false });
  const [ingredientsList, setIngredientsList] = useState<{ name: string; measure: string }[]>([]);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  // Initialisierung
  useEffect(() => {
    const custom: Recipe[] = lsGet(SK.customRecipes, []);
    const all = [...defaultRecipes, ...custom];
    setAllRecipes(all);
    setFavorites(lsGet(SK.favorites, []));
    const storedPlan = lsGet(SK.mealplan, null);
    if (storedPlan) setMealPlan(storedPlan);
    setShoppingList(lsGet(SK.shopping, []));
    setDailyLimit(lsGet(SK.dailyLimit, 2000));
    setPurchases(lsGet(SK.purchases, []));
    const nonLunchbox = all.filter(r => r.category !== 'Kinder-Brotzeit');
    const kidsRecipes = all.filter(r => r.category === 'Kinder-Brotzeit');
    const newDaily = getRandomUniqueSuggestions(nonLunchbox, 3);
    const newKids = getRandomUniqueSuggestions(kidsRecipes, 3);
    const newAdults = getRandomUniqueSuggestions(nonLunchbox.filter(r => r.lunchbox), 3);
    setDailySuggestions(newDaily);
    setLunchboxSuggestions({ kids: newKids, adults: newAdults });
    lastSuggestionIds.current = {
      daily: newDaily.map(r => r.id),
      kids: newKids.map(r => r.id),
      adults: newAdults.map(r => r.id)
    };
  }, []);

  useEffect(() => { lsSet(SK.favorites, favorites); }, [favorites]);
  useEffect(() => { lsSet(SK.mealplan, mealPlan); }, [mealPlan]);
  useEffect(() => { lsSet(SK.shopping, mergeShoppingItems(shoppingList)); }, [shoppingList]);
  useEffect(() => { lsSet(SK.dailyLimit, dailyLimit); }, [dailyLimit]);
  useEffect(() => { lsSet(SK.favoriteFolders, favoriteFolders); }, [favoriteFolders]);
  useEffect(() => { lsSet(SK.baseProducts, baseProducts); }, [baseProducts]);
  useEffect(() => { lsSet(SK.purchaseStats, purchaseStats); }, [purchaseStats]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && !Object.values(filters).some(Boolean)) return;
    setLoading(true);
    setTimeout(() => {
      const results = searchRecipes(searchQuery, filters, allRecipes);
      setSearchResults(results);
      setHasSearched(true);
      setLoading(false);
    }, 150);
  };

  const toggleFilter = (key: keyof FilterState) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    showToast(favorites.includes(id) ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
  };

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
      category: getIngredientCategory(ing),
    }));
    setShoppingList(prev => mergeShoppingItems([...prev, ...newItems]));
    showToast(`${recipe.name} zur Einkaufsliste hinzugefügt`);
  };

  const addBaseProductsToShopping = (items: string[]) => {
    const newItems: ShoppingItem[] = items.map((name, idx) => ({
      id: `base-${name}-${Date.now()}-${idx}`,
      recipeId: 'base',
      recipeName: 'Basisprodukte',
      ingredient: name,
      measure: '1 Stück',
      quantity: 1,
      checked: false,
      estimatedPrice: 1.5,
      category: getIngredientCategory(name),
    }));
    setShoppingList(prev => mergeShoppingItems([...prev, ...newItems]));
    showToast(`${items.length} Basisprodukte hinzugefügt`);
  };

  const addAllMealPlanToShopping = () => {
    mealPlan.forEach(day => {
      if (day.recipeId) {
        const recipe = allRecipes.find(r => r.id === day.recipeId);
        if (recipe) addToShoppingList(recipe);
      }
    });
    showToast('Alle Rezepte des Wochenplans zur Einkaufsliste hinzugefügt');
  };

  const addToMealPlan = (recipe: Recipe, dayIndex: number) => {
    const updated = [...mealPlan];
    updated[dayIndex] = { ...updated[dayIndex], recipeId: recipe.id, recipeName: recipe.name };
    setMealPlan(updated);
    showToast(`${recipe.name} zum Wochenplan (${updated[dayIndex].day}) hinzugefügt`);
  };

  const removeFromMealPlan = (dayIndex: number) => {
    const updated = [...mealPlan];
    updated[dayIndex] = { ...updated[dayIndex], recipeId: null, recipeName: null };
    setMealPlan(updated);
    showToast('Rezept aus Wochenplan entfernt');
  };

  const randomizeMealPlan = () => {
    const available = allRecipes.filter(r => !r.category.includes('Kinder')).sort(() => 0.5 - Math.random());
    const newPlan = mealPlan.map((day, i) => ({
      ...day,
      recipeId: available[i % available.length].id,
      recipeName: available[i % available.length].name,
    }));
    setMealPlan(newPlan);
    showToast('Wochenplan zufällig neu befüllt');
  };

  const handleDragStart = (e: React.DragEvent, recipeId: string, recipeName: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ recipeId, recipeName }));
    e.dataTransfer.effectAllowed = 'copy';
  };
  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const recipe = allRecipes.find(r => r.id === data.recipeId);
    if (recipe) addToMealPlan(recipe, dayIndex);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const startVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('Spracheingabe nicht unterstützt', 'error'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      if (transcript.includes('suche')) {
        const query = transcript.replace('suche', '').trim();
        setSearchQuery(query);
        handleSearch();
        showToast(`Suche: ${query}`);
      } else if (transcript.includes('füge zur einkaufsliste hinzu')) {
        const item = transcript.replace('füge zur einkaufsliste hinzu', '').trim();
        const newItem: ShoppingItem = {
          id: `voice-${Date.now()}`,
          recipeId: 'voice',
          recipeName: 'Sprachbefehl',
          ingredient: item,
          measure: '1 Stück',
          quantity: 1,
          checked: false,
          estimatedPrice: 1.0,
          category: getIngredientCategory(item),
        };
        setShoppingList(prev => mergeShoppingItems([...prev, newItem]));
        showToast(`${item} zur Einkaufsliste hinzugefügt`);
      } else {
        showToast(`Befehl nicht erkannt: "${transcript}"`, 'error');
      }
    };
    recognition.start();
  };

  const refreshLunchboxSuggestions = () => {
    const kidsRecipes = allRecipes.filter(r => r.category === 'Kinder-Brotzeit');
    const adultLunchbox = allRecipes.filter(r => r.lunchbox && r.category !== 'Kinder-Brotzeit');
    const newKids = getRandomUniqueSuggestions(kidsRecipes, 3, lastSuggestionIds.current.kids);
    const newAdults = getRandomUniqueSuggestions(adultLunchbox, 3, lastSuggestionIds.current.adults);
    setLunchboxSuggestions({ kids: newKids, adults: newAdults });
    lastSuggestionIds.current.kids = newKids.map(r => r.id);
    lastSuggestionIds.current.adults = newAdults.map(r => r.id);
    showToast('Neue Brotzeit-Ideen generiert');
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

  const favoriteRecipes = allRecipes.filter(r => favorites.includes(r.id));
  const estimatedTotal = shoppingList.reduce((s, i) => s + (i.estimatedPrice || 0), 0);

  // ========== KALORIEN-ANALYSE ==========
  const getLast7DaysCalories = () => {
    const today = new Date();
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    // Wir nehmen die aktuellen Wochentage aus mealPlan (der immer Montag-Sonntag ist)
    // Für die Analyse nehmen wir die aktuellen Plan-Werte (unabhängig vom Datum)
    return mealPlan.map(day => {
      const recipe = allRecipes.find(r => r.id === day.recipeId);
      const calories = recipe ? recipe.calories : 0;
      return { day: day.day, calories, limit: dailyLimit };
    });
  };

  const weeklyData = getLast7DaysCalories();
  const totalWeekCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0);
  const avgCalories = totalWeekCalories / 7;
  // Einfache Prognose: Trend aus den letzten 3 Tagen vs. vorherige 3 Tage
  const last3 = weeklyData.slice(-3).reduce((s, d) => s + d.calories, 0);
  const prev3 = weeklyData.slice(-6, -3).reduce((s, d) => s + d.calories, 0);
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (last3 > prev3 * 1.05) trend = 'up';
  else if (last3 < prev3 * 0.95) trend = 'down';
  const forecast = trend === 'up' ? avgCalories * 1.05 : trend === 'down' ? avgCalories * 0.95 : avgCalories;

  return (
    <ToastProvider>
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
          {/* Search-Bar (unverändert) */}
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
                    onClick={startVoiceCommand}>
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

          {/* Suchergebnisse */}
          {hasSearched && (
            <div className="section fade-up">
              <div className="slbl"><Search size={14} /> {searchResults.length} Ergebnisse</div>
              {loading ? <div className="spinner" /> : searchResults.length === 0
                ? <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Keine Rezepte für diese Suche gefunden.</div>
                : <div className="card-grid">{searchResults.map(r => <RecipeCard key={r.id} recipe={r} onOpen={() => setSelectedRecipe(r)} onFavorite={() => toggleFavorite(r.id)} isFavorite={favorites.includes(r.id)} onAddToShopping={() => addToShoppingList(r)} onAddToMealPlan={() => addToMealPlan(r, 0)} onDragStart={handleDragStart} />)}</div>
              }
            </div>
          )}

          {/* Tabs – erweitert um 'Statistik' */}
          <div className="tabs-wrap">
            {([
              { key: 'start', label: 'Start', icon: Home },
              { key: 'favorites', label: `Favoriten (${favorites.length})`, icon: Heart },
              { key: 'lunchbox', label: 'Brotzeit', icon: Coffee },
              { key: 'mealplan', label: 'Wochenplan', icon: Calendar },
              { key: 'shopping', label: `Einkauf (${shoppingList.length})`, icon: ShoppingCart },
              { key: 'stats', label: 'Kalorien', icon: BarChart3 },
              { key: 'create', label: 'Erstellen', icon: Edit3 },
            ] as const).map(tab => (
              <button key={tab.key} className={`tab ${activeView === tab.key ? 'active' : ''}`} onClick={() => setActiveView(tab.key)}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Views */}
          {activeView === 'start' && (
            <StartView
              dailySuggestions={dailySuggestions}
              lunchboxSuggestions={lunchboxSuggestions}
              onOpen={setSelectedRecipe}
              onFavorite={toggleFavorite}
              favorites={favorites}
              onAddToShopping={addToShoppingList}
              onAddToMealPlan={addToMealPlan}
              onDragStart={handleDragStart}
            />
          )}
          {activeView === 'favorites' && (
            <FavoritesWithFolders
              recipes={favoriteRecipes}
              folders={favoriteFolders}
              setFolders={setFavoriteFolders}
              onOpen={setSelectedRecipe}
              onFavorite={toggleFavorite}
              favorites={favorites}
              onAddToShopping={addToShoppingList}
              onAddToMealPlan={addToMealPlan}
              onDragStart={handleDragStart}
            />
          )}
          {activeView === 'lunchbox' && (
            <LunchboxView
              kids={lunchboxSuggestions.kids}
              adults={lunchboxSuggestions.adults}
              onRefresh={refreshLunchboxSuggestions}
              onOpen={setSelectedRecipe}
              onFavorite={toggleFavorite}
              favorites={favorites}
              onAddToShopping={addToShoppingList}
              onDragStart={handleDragStart}
            />
          )}
          {activeView === 'mealplan' && (
            <MealPlanView
              mealPlan={mealPlan}
              onAddToPlan={addToMealPlan}
              onRemovePlan={removeFromMealPlan}
              onRandomize={randomizeMealPlan}
              onAddAllToShopping={addAllMealPlanToShopping}
              allRecipes={allRecipes}
              dailyLimit={dailyLimit}
              setDailyLimit={setDailyLimit}
              onOpen={setSelectedRecipe}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          )}
          {activeView === 'shopping' && (
            <ShoppingListEnhanced
              items={shoppingList}
              setItems={setShoppingList}
              baseProducts={baseProducts}
              setBaseProducts={setBaseProducts}
              purchaseStats={purchaseStats}
              setPurchaseStats={setPurchaseStats}
              purchases={purchases}
              setPurchases={setPurchases}
              onAddBaseToShopping={addBaseProductsToShopping}
            />
          )}
          {activeView === 'stats' && (
            <KalorienAnalyse
              weeklyData={weeklyData}
              totalWeekCalories={totalWeekCalories}
              avgCalories={avgCalories}
              trend={trend}
              forecast={forecast}
              dailyLimit={dailyLimit}
            />
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
            onAddToMealPlan={(dayIdx: number) => addToMealPlan(selectedRecipe, dayIdx)}
          />
        )}
      </div>
    </ToastProvider>
  );
}

// ========== START VIEW (automatische Vorschläge) ==========
function StartView({ dailySuggestions, lunchboxSuggestions, onOpen, onFavorite, favorites, onAddToShopping, onAddToMealPlan, onDragStart }: any) {
  return (
    <div className="fade-up">
      <div className="hero">
        <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Willkommen zurück</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Was kochen wir heute?</div>
        <div style={{ opacity: 0.8, fontSize: 15 }}>Entdecke {dailySuggestions.length + lunchboxSuggestions.kids.length + lunchboxSuggestions.adults.length}+ Rezepte</div>
      </div>
      <div className="section">
        <div className="slbl"><Sparkles size={14} /> Tagesrezepte (3 Vorschläge)</div>
        <div className="card-grid">
          {dailySuggestions.map((r: Recipe) => (
            <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} onAddToShopping={() => onAddToShopping(r)} onAddToMealPlan={() => onAddToMealPlan(r, 0)} onDragStart={onDragStart} />
          ))}
        </div>
      </div>
      <div className="section">
        <div className="slbl"><Baby size={14} /> Brotzeit-Ideen (3 Kinder + 3 Erwachsene)</div>
        <div className="card-grid">
          {lunchboxSuggestions.kids.map((r: Recipe) => (
            <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} onAddToShopping={() => onAddToShopping(r)} onDragStart={onDragStart} />
          ))}
        </div>
        <div className="card-grid" style={{ marginTop: 16 }}>
          {lunchboxSuggestions.adults.map((r: Recipe) => (
            <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} onAddToShopping={() => onAddToShopping(r)} onDragStart={onDragStart} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== RECIPE CARD ==========
function RecipeCard({ recipe, onOpen, onFavorite, isFavorite, onAddToShopping, onAddToMealPlan, onDragStart }: any) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }} draggable onDragStart={(e) => onDragStart && onDragStart(e, recipe.id, recipe.name)}>
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
        <button className="btn btn-secondary btn-sm" onClick={onAddToShopping}><ShoppingCart size={13} /></button>
        {onAddToMealPlan && <button className="btn btn-ghost btn-sm" onClick={onAddToMealPlan}><Calendar size={13} /></button>}
      </div>
    </div>
  );
}

// ========== FAVORITES WITH FOLDERS ==========
function FavoritesWithFolders({ recipes, folders, setFolders, onOpen, onFavorite, favorites, onAddToShopping, onAddToMealPlan, onDragStart }: any) {
  const [search, setSearch] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const filteredRecipes = recipes.filter((r: Recipe) => r.name.toLowerCase().includes(search.toLowerCase()));
  const currentFolder = folders.find((f: FavoriteFolder) => f.id === selectedFolderId);
  const displayedRecipes = currentFolder ? recipes.filter((r: Recipe) => currentFolder.recipeIds.includes(r.id)) : filteredRecipes;

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: FavoriteFolder = { id: Date.now().toString(), name: newFolderName, recipeIds: [] };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  const addToFolder = (recipeId: string, folderId: string) => {
    setFolders(folders.map((f: FavoriteFolder) => f.id === folderId ? { ...f, recipeIds: [...f.recipeIds, recipeId] } : f));
  };

  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 20 }}>
        <input className="inp" style={{ paddingLeft: 16 }} placeholder="Favoriten durchsuchen…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className={`btn ${selectedFolderId === null ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setSelectedFolderId(null)}>Alle</button>
        {folders.map((f: FavoriteFolder) => (
          <button key={f.id} className={`btn ${selectedFolderId === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setSelectedFolderId(f.id)}>
            <Folder size={12} /> {f.name} ({f.recipeIds.length})
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateFolder(true)}><FolderPlus size={12} /> Ordner</button>
      </div>
      {showCreateFolder && (
        <div className="card2" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <input className="inp" placeholder="Ordnername" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={createFolder}>Erstellen</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateFolder(false)}>Abbrechen</button>
        </div>
      )}
      {displayedRecipes.length === 0
        ? <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: 48 }}><Heart size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />Keine Favoriten in dieser Ansicht.</div>
        : <div className="card-grid">
            {displayedRecipes.map((r: Recipe) => (
              <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column' }} draggable onDragStart={(e) => onDragStart(e, r.id, r.name)}>
                <img src={r.image} className="recipe-img" onClick={() => onOpen(r)} onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'} />
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.name}</h3>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className="badge"><Flame size={11} /> {r.calories} kcal</span>
                  {r.vegan && <span className="badge badge-green">Vegan</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onOpen(r)}>Details</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onAddToShopping(r)}><ShoppingCart size={13} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onAddToMealPlan(r, 0)}><Calendar size={13} /></button>
                  <select className="chip" style={{ fontSize: 12 }} onChange={e => addToFolder(r.id, e.target.value)} value="">
                    <option value="">In Ordner</option>
                    {folders.map((f: FavoriteFolder) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ========== LUNCHBOX VIEW ==========
function LunchboxView({ kids, adults, onRefresh, onOpen, onFavorite, favorites, onAddToShopping, onDragStart }: any) {
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
            <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} onAddToShopping={() => onAddToShopping(r)} onDragStart={onDragStart} />
          ))}
        </div>
      </div>
      <div className="section">
        <div className="slbl"><Coffee size={14} /> Für Erwachsene</div>
        <div className="card-grid">
          {adults.map((r: Recipe) => (
            <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} onFavorite={() => onFavorite(r.id)} isFavorite={favorites.includes(r.id)} onAddToShopping={() => onAddToShopping(r)} onDragStart={onDragStart} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MEAL PLAN VIEW (mit Drag & Drop) ==========
function MealPlanView({ mealPlan, onAddToPlan, onRemovePlan, onRandomize, onAddAllToShopping, allRecipes, dailyLimit, setDailyLimit, onOpen, onDrop, onDragOver }: any) {
  const [showRecipePicker, setShowRecipePicker] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const filteredForPicker = allRecipes.filter((r: Recipe) =>
    r.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  // Kalorien pro Tag aus dem Plan berechnen
  const getDayCalories = (day: DayPlan) => {
    const recipe = allRecipes.find((r: Recipe) => r.id === day.recipeId);
    return recipe ? recipe.calories : 0;
  };

  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={onRandomize}><Shuffle size={14} /> Zufällig verteilen</button>
          <button className="btn btn-secondary btn-sm" onClick={onAddAllToShopping}><ShoppingCart size={14} /> Alle in Einkaufsliste</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {mealPlan.map((day: DayPlan, idx: number) => {
            const dayCal = getDayCalories(day);
            const isOver = dayCal > dailyLimit;
            return (
              <div key={day.day} className={`day-card ${day.recipeId ? 'filled' : ''}`} onDragOver={onDragOver} onDrop={(e) => onDrop(e, idx)}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>{day.day}</div>
                {day.recipeId ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>{day.recipeName}</div>
                    <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="badge"><Flame size={10} /> {dayCal} kcal</span>
                      {isOver && <span style={{ color: '#ef4444', fontSize: 11 }}>⚠️ über Limit</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" style={{ flex: 1 }} onClick={() => { const r = allRecipes.find((x: Recipe) => x.id === day.recipeId); if (r) onOpen(r); }}>Details</button>
                      <button className="btn btn-icon btn-sm" onClick={() => onRemovePlan(idx)} style={{ background: '#fff0f0', color: '#ff3b30', border: 'none' }}><X size={13} /></button>
                    </div>
                    <div className="calorie-bar-container" style={{ marginTop: 8 }}>
                      <div className="calorie-bar-fill" style={{ width: `${Math.min(100, (dayCal / dailyLimit) * 100)}%` }}></div>
                    </div>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { setShowRecipePicker(idx); setPickerSearch(''); }}>
                    <Plus size={14} /> Rezept wählen
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div className="slbl"><Activity size={14} /> Kalorienplan</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>Tageslimit:</span>
          <input type="number" className="inp" style={{ width: 110, paddingLeft: 14 }} value={dailyLimit} onChange={e => setDailyLimit(parseInt(e.target.value) || 2000)} />
          <span className="badge"><Flame size={11} /> {dailyLimit} kcal/Tag</span>
        </div>
      </div>
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

// ========== SHOPPING LIST ENHANCED (unverändert, nur der Vollständigkeit halber) ==========
function ShoppingListEnhanced({ items, setItems, baseProducts, setBaseProducts, purchaseStats, setPurchaseStats, purchases, setPurchases, onAddBaseToShopping }: any) {
  const [activeTab, setActiveTab] = useState<'list' | 'base' | 'stats' | 'receipt'>('list');
  const [newBaseProduct, setNewBaseProduct] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptTotal, setReceiptTotal] = useState('');

  const grouped = items.reduce((acc: any, item: ShoppingItem) => {
    const cat = item.category || getIngredientCategory(item.ingredient);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort();

  const toggleItem = (id: string) => setItems((prev: ShoppingItem[]) => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const removeItem = (id: string) => setItems((prev: ShoppingItem[]) => prev.filter(i => i.id !== id));
  const clearChecked = () => {
    const checkedItems = items.filter(i => i.checked);
    const newStats = { ...purchaseStats };
    checkedItems.forEach(item => {
      const name = item.ingredient.toLowerCase();
      newStats[name] = (newStats[name] || 0) + 1;
    });
    setPurchaseStats(newStats);
    setItems((prev: ShoppingItem[]) => prev.filter(i => !i.checked));
  };
  const clearAll = () => { if (confirm('Einkaufsliste leeren?')) setItems([]); };

  const addBaseProduct = () => {
    if (newBaseProduct.trim() && !baseProducts.includes(newBaseProduct.trim())) {
      setBaseProducts([...baseProducts, newBaseProduct.trim()]);
      setNewBaseProduct('');
    }
  };
  const removeBaseProduct = (prod: string) => setBaseProducts(baseProducts.filter((p: string) => p !== prod));

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  const saveReceipt = () => {
    if (!receiptTotal) return;
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      store: 'Manuell',
      items: [],
      total: parseFloat(receiptTotal),
      receiptImage: receiptImage || undefined,
    };
    setPurchases([...purchases, newPurchase]);
    setReceiptImage(null);
    setReceiptTotal('');
    alert('Beleg gespeichert!');
  };

  const totalPrice = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

  return (
    <div className="fade-up">
      <div className="tabs-wrap" style={{ marginBottom: 16 }}>
        <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}><List size={14} /> Einkaufsliste</button>
        <button className={`tab ${activeTab === 'base' ? 'active' : ''}`} onClick={() => setActiveTab('base')}><Package size={14} /> Basisliste</button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><BarChart3 size={14} /> Statistik</button>
        <button className={`tab ${activeTab === 'receipt' ? 'active' : ''}`} onClick={() => setActiveTab('receipt')}><Receipt size={14} /> Beleg</button>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={clearChecked}><Trash2 size={13} /> Abgehakte löschen</button>
            <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={13} /> Alle löschen</button>
          </div>
          {sortedCategories.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}><ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />Einkaufsliste ist leer.</div>
            : <>
                {sortedCategories.map(cat => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div className="slbl" style={{ fontSize: 14 }}>{cat}</div>
                    {grouped[cat].map((item: ShoppingItem) => (
                      <div key={item.id} className="list-row">
                        <button onClick={() => toggleItem(item.id)} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${item.checked ? 'var(--ocean)' : 'var(--border)'}`, background: item.checked ? 'var(--ocean)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          {item.checked && <Check size={13} color="#fff" />}
                        </button>
                        <span style={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text3)' : 'var(--text)', fontSize: 14 }}>{item.measure} {item.ingredient}</span>
                        <span className="badge" style={{ fontSize: 12 }}>{item.estimatedPrice?.toFixed(2)} €</span>
                        <button onClick={() => removeItem(item.id)} className="btn btn-icon btn-sm" style={{ background: 'transparent', color: 'var(--text3)', border: 'none', width: 28, height: 28 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ textAlign: 'right', paddingTop: 12, borderTop: '2px solid var(--border)', fontWeight: 600, fontSize: 16 }}>
                  Gesamt: <span style={{ color: 'var(--ocean)' }}>~{totalPrice.toFixed(2)} €</span>
                </div>
              </>
          }
        </div>
      )}

      {activeTab === 'base' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="slbl"><Package size={14} /> Meine Basisprodukte</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="inp" placeholder="Neues Basisprodukt" value={newBaseProduct} onChange={e => setNewBaseProduct(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addBaseProduct}>Hinzufügen</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {baseProducts.map((prod: string) => (
                <div key={prod} className="chip" style={{ background: 'var(--ocean-glow2)' }}>
                  {prod}
                  <button onClick={() => removeBaseProduct(prod)} style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer' }}><X size={12} /></button>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onAddBaseToShopping(baseProducts)}>Alle Basisprodukte zur Liste</button>
          </div>
          {BASE_PRODUCTS_CATEGORIES.map(cat => (
            <div key={cat.label} className="card" style={{ marginBottom: 16 }}>
              <div className="slbl"><Package size={14} /> {cat.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cat.items.map(item => (
                  <div key={item} className="chip" onClick={() => onAddBaseToShopping([item])} style={{ cursor: 'pointer' }}><Plus size={12} /> {item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="card">
          <div className="slbl"><BarChart3 size={14} /> Kaufstatistik</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="card2" style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean)' }}>~{totalPrice.toFixed(0)} €</div><div style={{ fontSize: 12 }}>Aktuelle Liste</div></div>
            <div className="card2" style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean)' }}>{items.length}</div><div style={{ fontSize: 12 }}>Artikel</div></div>
            <div className="card2" style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean)' }}>{items.filter((i: ShoppingItem) => i.checked).length}</div><div style={{ fontSize: 12 }}>Erledigt</div></div>
          </div>
          <div className="slbl">Häufig gekaufte Produkte</div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {Object.entries(purchaseStats).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => (
              <div key={name} className="list-row" style={{ justifyContent: 'space-between' }}>
                <span>{name}</span><span className="badge">{count}x gekauft</span>
                <button className="btn btn-sm btn-secondary" onClick={() => { if (!baseProducts.includes(name)) setBaseProducts([...baseProducts, name]); }}><Plus size={12} /> Basis</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'receipt' && (
        <div className="card">
          <div className="slbl"><Camera size={14} /> Beleg scannen</div>
          <input type="file" accept="image/*" onChange={handleReceiptUpload} />
          {receiptImage && <img src={receiptImage} style={{ maxWidth: '100%', maxHeight: 200, marginTop: 12 }} alt="Beleg" />}
          <input className="inp" style={{ marginTop: 12 }} placeholder="Gesamtbetrag (€)" type="number" step="0.01" value={receiptTotal} onChange={e => setReceiptTotal(e.target.value)} />
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveReceipt}>Beleg speichern</button>
          <div className="slbl" style={{ marginTop: 20 }}>Letzte Belege</div>
          {purchases.slice(-5).reverse().map((p: Purchase) => (
            <div key={p.id} className="list-row" style={{ justifyContent: 'space-between' }}>
              <span>{new Date(p.date).toLocaleDateString()}</span>
              <span>{p.total.toFixed(2)} €</span>
              {p.receiptImage && <button className="btn btn-ghost btn-sm" onClick={() => window.open(p.receiptImage)}>Bild</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== KALORIEN-ANALYSE (NEU) ==========
function KalorienAnalyse({ weeklyData, totalWeekCalories, avgCalories, trend, forecast, dailyLimit }: any) {
  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="slbl"><BarChart3 size={14} /> Kalorien-Analyse der letzten 7 Tage</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{Math.round(totalWeekCalories)}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Gesamt (Woche)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(avgCalories)}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Ø pro Tag</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dailyLimit}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Tageslimit</div>
          </div>
        </div>

        <div className="slbl" style={{ marginTop: 16 }}>Tägliche Kalorien</div>
        {weeklyData.map((day: any) => {
          const percent = Math.min(100, (day.calories / dailyLimit) * 100);
          const isOver = day.calories > dailyLimit;
          return (
            <div key={day.day} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{day.day}</span>
                <span style={{ fontWeight: 600, color: isOver ? '#ef4444' : 'var(--ocean)' }}>{day.calories} kcal</span>
              </div>
              <div className="calorie-bar-container">
                <div className="calorie-bar-fill" style={{ width: `${percent}%`, background: isOver ? '#ef4444' : undefined }}></div>
              </div>
            </div>
          );
        })}

        <div className="stats-grid" style={{ marginTop: 24 }}>
          <div className="stat-card">
            <div className={`stat-value ${trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable'}`}>
              {trend === 'up' && <TrendingUp size={18} style={{ display: 'inline', marginRight: 4 }} />}
              {trend === 'down' && <TrendingDown size={18} style={{ display: 'inline', marginRight: 4 }} />}
              {trend === 'stable' && <Activity size={18} style={{ display: 'inline', marginRight: 4 }} />}
              {trend === 'up' ? 'Steigend' : trend === 'down' ? 'Fallend' : 'Stabil'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Trend (letzte 3 Tage)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(forecast)}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Prognose nächster Tag</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 16 }}>
          *Basiert auf Ihrem aktuellen Wochenplan. Passen Sie die Rezepte an, um Ihr Kalorienziel zu erreichen.
        </div>
      </div>
    </div>
  );
}

// ========== CREATE VIEW (unverändert, hier nur Platzhalter) ==========
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
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Kategorie</label><input className="inp" style={{ paddingLeft: 16 }} placeholder="z.B. Pasta, Suppe…" value={newRecipe.category || ''} onChange={e => setNewRecipe({ ...newRecipe, category: e.target.value })} /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Bild-URL</label><input className="inp" style={{ paddingLeft: 16 }} placeholder="https://…" value={newRecipe.image || ''} onChange={e => setNewRecipe({ ...newRecipe, image: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Kalorien (kcal)</label><input type="number" className="inp" style={{ paddingLeft: 16 }} value={newRecipe.calories || ''} onChange={e => setNewRecipe({ ...newRecipe, calories: parseInt(e.target.value) || 0 })} /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Portion (g)</label><input type="number" className="inp" style={{ paddingLeft: 16 }} value={newRecipe.portionGram || ''} onChange={e => setNewRecipe({ ...newRecipe, portionGram: parseInt(e.target.value) || 0 })} /></div>
              <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Portionen</label><input type="number" className="inp" style={{ paddingLeft: 16 }} value={newRecipe.portions || 4} onChange={e => setNewRecipe({ ...newRecipe, portions: parseInt(e.target.value) || 4 })} /></div>
            </div>
            <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Eigenschaften</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{dietOptions.map(opt => (<div key={String(opt.key)} className={`chip ${newRecipe[opt.key] ? 'active' : ''}`} onClick={() => setNewRecipe({ ...newRecipe, [opt.key]: !newRecipe[opt.key] })}>{opt.label}</div>))}</div></div>
            <div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Zutaten *</label><button className="btn btn-ghost btn-sm" onClick={addIngredient}><Plus size={13} /> Zutat hinzufügen</button></div>
              {ingredientsList.map((ing: any, idx: number) => (<div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}><input className="inp" style={{ paddingLeft: 14 }} placeholder="Zutat" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} /><input className="inp" style={{ paddingLeft: 14, maxWidth: 140 }} placeholder="Menge (200g)" value={ing.measure} onChange={e => updateIngredient(idx, 'measure', e.target.value)} /><button className="btn btn-icon btn-sm" style={{ flexShrink: 0, background: '#fff0f0', color: '#ff3b30', border: 'none' }} onClick={() => removeIngredient(idx)}><Trash2 size={13} /></button></div>))}
              {ingredientsList.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>Noch keine Zutaten hinzugefügt.</div>}
            </div>
            <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Zubereitung * <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(jeden Schritt als neue Zeile)</span></label><textarea className="textarea" placeholder="1. Wasser zum Kochen bringen.&#10;2. Pasta hineingeben.&#10;3. …" value={newRecipe.instructions || ''} onChange={e => setNewRecipe({ ...newRecipe, instructions: e.target.value })} style={{ minHeight: 140 }} /></div>
            <div><label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Tipps & Hinweise</label><textarea className="textarea" placeholder="Optionale Tipps…" value={newRecipe.tips || ''} onChange={e => setNewRecipe({ ...newRecipe, tips: e.target.value })} style={{ minHeight: 70 }} /></div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}><button className="btn btn-primary" style={{ flex: 1 }} onClick={onSave}><Save size={15} /> {isEditing ? 'Aktualisieren' : 'Speichern'}</button><button className="btn btn-ghost" onClick={onCancel}>Abbrechen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== RECIPE MODAL (unverändert) ==========
function RecipeModal({ recipe, onClose, onFavorite, isFavorite, onAddToShopping, mealPlan, onAddToMealPlan }: any) {
  const [tab, setTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [showDayPicker, setShowDayPicker] = useState(false);

  const steps = recipe.instructions.split('\n').filter((s: string) => s.trim()).map((s: string) => s.replace(/^\d+\.\s*\d+\./, (m: string) => m.split('.').slice(-1)[0] + '.').replace(/^(\d+\.)\s*\1/, '$1').trim());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div><h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 }}>{recipe.name}</h2><div style={{ color: 'var(--text3)', fontSize: 13 }}>{recipe.category} · {recipe.area}</div></div>
          <button className="btn btn-icon" onClick={onClose}><X size={17} /></button>
        </div>
        <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }} onError={(e: any) => e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80'} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="badge"><Flame size={11} /> {recipe.calories} kcal</span><span className="badge"><UtensilsCrossed size={11} /> {recipe.portions} Portionen</span>
          {recipe.vegan && <span className="badge badge-green">Vegan</span>}{recipe.vegetarian && !recipe.vegan && <span className="badge badge-green">Vegetarisch</span>}
          {recipe.glutenFree && <span className="badge badge-amber">Glutenfrei</span>}{recipe.lactoseFree && <span className="badge badge-amber">Laktosefrei</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={onFavorite}><Heart size={14} fill={isFavorite ? '#fff' : 'none'} /> {isFavorite ? 'Favorit entfernen' : 'Als Favorit'}</button>
          <button className="btn btn-secondary btn-sm" onClick={onAddToShopping}><ShoppingCart size={14} /> Einkaufen</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDayPicker(!showDayPicker)}><Calendar size={14} /> Wochenplan</button>
        </div>
        {showDayPicker && (<div className="card2" style={{ marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Zu welchem Tag hinzufügen?</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{mealPlan.map((day: DayPlan, idx: number) => (<button key={day.day} className="btn btn-ghost btn-sm" onClick={() => { onAddToMealPlan(idx); setShowDayPicker(false); }}>{day.day}</button>))}</div></div>)}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}><button className={`dtab ${tab === 'ingredients' ? 'active' : ''}`} onClick={() => setTab('ingredients')}>Zutaten</button><button className={`dtab ${tab === 'instructions' ? 'active' : ''}`} onClick={() => setTab('instructions')}>Zubereitung</button></div>
        {tab === 'ingredients' ? (<ul style={{ listStyle: 'none', display: 'grid', gap: 8 }}>{recipe.ingredients.map((ing: string, i: number) => (<li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--card2)', borderRadius: 10, fontSize: 14 }}><span>{ing}</span><span style={{ fontWeight: 600, color: 'var(--ocean)' }}>{recipe.measures[i]}</span></li>))}</ul>) : (<ol style={{ listStyle: 'none', display: 'grid', gap: 12 }}>{steps.map((step: string, i: number) => (<li key={i} style={{ display: 'flex', gap: 12 }}><span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ocean), var(--ocean-light))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{i + 1}</span><span style={{ fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step.replace(/^\d+\.\s*/, '')}</span></li>))}</ol>)}
        {recipe.tips && (<div style={{ marginTop: 20, background: 'linear-gradient(135deg, var(--ocean-glow2), var(--ocean-glow))', padding: '12px 16px', borderRadius: 14, fontSize: 14 }}><span style={{ fontWeight: 600, color: 'var(--ocean)' }}>💡 Tipp: </span>{recipe.tips}</div>)}
      </div>
    </div>
  );
}