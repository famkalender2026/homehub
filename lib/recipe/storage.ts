import { Product, Purchase, ShoppingItem, DayPlan } from './types';
import { defaultProducts } from './data';

const STORAGE_KEYS = {
  favorites: 'recipe_favorites',
  mealplan: 'recipe_mealplan',
  shopping: 'recipe_shoppinglist',
  products: 'shopping_products',
  purchases: 'shopping_purchases',
};

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.favorites);
  return stored ? JSON.parse(stored) : [];
}

export function saveFavorites(favorites: string[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
}

export function getMealPlan(): DayPlan[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.mealplan);
  return stored ? JSON.parse(stored) : [];
}

export function saveMealPlan(plan: DayPlan[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.mealplan, JSON.stringify(plan));
}

export function getShoppingList(): ShoppingItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.shopping);
  return stored ? JSON.parse(stored) : [];
}

export function saveShoppingList(list: ShoppingItem[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.shopping, JSON.stringify(list));
}

export function getProducts(): Product[] {
  if (typeof window === 'undefined') return defaultProducts;
  const stored = localStorage.getItem(STORAGE_KEYS.products);
  return stored ? JSON.parse(stored) : defaultProducts;
}

export function saveProducts(products: Product[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}

export function getPurchases(): Purchase[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.purchases);
  return stored ? JSON.parse(stored) : [];
}

export function savePurchases(purchases: Purchase[]) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.purchases, JSON.stringify(purchases));
}