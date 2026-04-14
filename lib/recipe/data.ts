import { Recipe, Product } from './types';

// ========== DEUTSCHE REZEPTE ==========
export const germanRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Bolognese',
    category: 'Pasta',
    area: 'Italienisch',
    instructions: '1. Zwiebel und Knoblauch fein hacken.\n2. In etwas Olivenöl anbraten.\n3. Hackfleisch zugeben und krümelig braten.\n4. Tomatenmark, passierte Tomaten und Kräuter hinzufügen.\n5. Mindestens 30 Minuten köcheln lassen.\n6. Mit Salz, Pfeffer und Oregano abschmecken.\n7. Mit gekochten Spaghetti servieren.',
    image: 'https://www.themealdb.com/images/media/meals/urtpqw1487341253.jpg',
    ingredients: ['Zwiebel', 'Knoblauchzehe', 'Olivenöl', 'Rinderhackfleisch', 'Tomatenmark', 'Passierte Tomaten', 'Oregano', 'Salz', 'Pfeffer', 'Spaghetti'],
    measures: ['1', '2', '2 EL', '500g', '1 EL', '800g', '1 TL', 'nach Geschmack', 'nach Geschmack', '400g'],
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    lactoseFree: true,
    lunchbox: false,
  },
  {
    id: '2',
    name: 'Vegetarische Lasagne',
    category: 'Pasta',
    area: 'Italienisch',
    instructions: '1. Zucchini, Aubergine und Paprika würfeln.\n2. Mit Zwiebeln anbraten.\n3. Tomatensoße zugeben.\n4. Bechamelsoße aus Margarine, Mehl und Hafermilch zubereiten.\n5. Abwechselnd Nudelplatten, Gemüse und Soße schichten.\n6. Bei 180°C 35 Minuten backen.',
    image: 'https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg',
    ingredients: ['Zucchini', 'Aubergine', 'Paprika', 'Zwiebel', 'Tomatensoße', 'Lasagneplatten', 'Margarine', 'Mehl', 'Hafermilch'],
    measures: ['1', '1', '1', '1', '500ml', '250g', '50g', '50g', '500ml'],
    vegetarian: true,
    vegan: true,
    glutenFree: false,
    lactoseFree: true,
    lunchbox: false,
  },
  {
    id: '3',
    name: 'Brotzeitdose: Hähnchen-Teriyaki',
    category: 'Asiatisch',
    area: 'Japanisch',
    instructions: '1. Hähnchenbrust in Streifen schneiden.\n2. Mit Teriyaki-Sauce marinieren.\n3. In der Pfanne braten.\n4. Gekochten Reis und gedünstetes Gemüse hinzufügen.\n5. In eine Brotzeitdose füllen.',
    image: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    ingredients: ['Hähnchenbrust', 'Teriyaki-Sauce', 'Reis', 'Brokkoli', 'Karotten'],
    measures: ['300g', '100ml', '200g', '100g', '100g'],
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    lactoseFree: true,
    lunchbox: true,
  },
  {
    id: '4',
    name: 'Vegane Bowl mit Quinoa',
    category: 'Salat',
    area: 'International',
    instructions: '1. Quinoa kochen.\n2. Avocado, Gurke, Tomate und Kichererbsen würfeln.\n3. Alles in eine Schale geben.\n4. Mit Tahini-Dressing beträufeln.',
    image: 'https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg',
    ingredients: ['Quinoa', 'Avocado', 'Gurke', 'Tomate', 'Kichererbsen', 'Tahini', 'Zitrone'],
    measures: ['150g', '1', '1', '2', '200g', '2 EL', '1'],
    vegetarian: true,
    vegan: true,
    glutenFree: true,
    lactoseFree: true,
    lunchbox: true,
  },
  {
    id: '5',
    name: 'Glutenfreier Apfelkuchen',
    category: 'Dessert',
    area: 'Deutsch',
    instructions: '1. Äpfel schälen und in Spalten schneiden.\n2. Teig aus glutenfreiem Mehl, Zucker, Eiern und Butter zubereiten.\n3. Äpfel unterheben.\n4. Bei 180°C 45 Minuten backen.',
    image: 'https://www.themealdb.com/images/media/meals/xqwwpy1483908697.jpg',
    ingredients: ['Äpfel', 'Glutenfreies Mehl', 'Zucker', 'Eier', 'Butter'],
    measures: ['4', '250g', '150g', '3', '150g'],
    vegetarian: true,
    vegan: false,
    glutenFree: true,
    lactoseFree: false,
    lunchbox: false,
  },
  {
    id: '6',
    name: 'Laktosefreie Pilzsuppe',
    category: 'Suppe',
    area: 'Deutsch',
    instructions: '1. Pilze und Zwiebeln anbraten.\n2. Mit Gemüsebrühe ablöschen.\n3. Mit laktosefreier Sahne verfeinern.\n4. Pürieren und mit Petersilie servieren.',
    image: 'https://www.themealdb.com/images/media/meals/qtuuys1511387068.jpg',
    ingredients: ['Champignons', 'Zwiebel', 'Gemüsebrühe', 'Laktosefreie Sahne', 'Petersilie'],
    measures: ['500g', '1', '1l', '200ml', '1 Bund'],
    vegetarian: true,
    vegan: false,
    glutenFree: true,
    lactoseFree: true,
    lunchbox: false,
  },
];

// ========== PRODUKTE MIT PREISEN (wird mit echten Käufen erweitert) ==========
export const defaultProducts: Product[] = [
  { id: 'p1', name: 'Äpfel', category: 'Obst', avgPrice: 2.49, unit: 'kg', purchaseCount: 0 },
  { id: 'p2', name: 'Bananen', category: 'Obst', avgPrice: 1.79, unit: 'kg', purchaseCount: 0 },
  { id: 'p3', name: 'Milch', category: 'Milchprodukte', avgPrice: 1.19, unit: 'Liter', purchaseCount: 0 },
  { id: 'p4', name: 'Brot', category: 'Backwaren', avgPrice: 2.99, unit: 'Stück', purchaseCount: 0 },
  { id: 'p5', name: 'Eier', category: 'Milchprodukte', avgPrice: 2.49, unit: '10 Stück', purchaseCount: 0 },
  { id: 'p6', name: 'Hähnchenbrust', category: 'Fleisch', avgPrice: 6.99, unit: 'kg', purchaseCount: 0 },
  { id: 'p7', name: 'Tomaten', category: 'Gemüse', avgPrice: 2.99, unit: 'kg', purchaseCount: 0 },
  { id: 'p8', name: 'Zwiebeln', category: 'Gemüse', avgPrice: 1.49, unit: 'kg', purchaseCount: 0 },
  { id: 'p9', name: 'Reis', category: 'Trockenware', avgPrice: 2.29, unit: 'kg', purchaseCount: 0 },
  { id: 'p10', name: 'Nudeln', category: 'Trockenware', avgPrice: 1.49, unit: '500g', purchaseCount: 0 },
];

// ========== HILFSFUNKTIONEN ==========
export function searchRecipes(query: string, filters: any): Recipe[] {
  let results = germanRecipes.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.category.toLowerCase().includes(query.toLowerCase()) ||
    r.ingredients.some(i => i.toLowerCase().includes(query.toLowerCase()))
  );
  if (filters.vegetarian) results = results.filter(r => r.vegetarian);
  if (filters.vegan) results = results.filter(r => r.vegan);
  if (filters.glutenFree) results = results.filter(r => r.glutenFree);
  if (filters.lactoseFree) results = results.filter(r => r.lactoseFree);
  if (filters.lunchbox) results = results.filter(r => r.lunchbox);
  return results;
}

export function getRandomRecipes(count: number): Recipe[] {
  const shuffled = [...germanRecipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getLunchboxRecipes(): Recipe[] {
  return germanRecipes.filter(r => r.lunchbox);
}

export function matchProduct(ingredientName: string, products: Product[]): Product | undefined {
  const lowerIng = ingredientName.toLowerCase();
  return products.find(p => lowerIng.includes(p.name.toLowerCase()));
}

export function estimatePrice(ingredient: string, measure: string, products: Product[]): number {
  const product = matchProduct(ingredient, products);
  if (!product) return 0.5;
  let quantity = 1;
  const measureLower = measure.toLowerCase();
  if (measureLower.includes('kg')) quantity = parseFloat(measure) || 1;
  else if (measureLower.includes('g')) quantity = (parseFloat(measure) || 100) / 1000;
  else if (measureLower.includes('el')) quantity = 0.015;
  else if (measureLower.includes('tl')) quantity = 0.005;
  else if (measureLower.includes('stück') || measureLower.includes('stk')) quantity = parseFloat(measure) || 1;
  else if (!isNaN(parseFloat(measure))) quantity = parseFloat(measure) / 100;
  return product.avgPrice * quantity;
}