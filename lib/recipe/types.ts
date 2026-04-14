export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  image: string;
  ingredients: string[];
  measures: string[];
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  lactoseFree: boolean;
  lunchbox: boolean;
}

export interface ShoppingItem {
  id: string;
  recipeId: string;
  recipeName: string;
  ingredient: string;
  measure: string;
  checked: boolean;
  estimatedPrice?: number;
  productId?: string;
}

export interface DayPlan {
  day: string;
  recipeId: string | null;
  recipeName: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  avgPrice: number;
  unit: string;
  lastPurchased?: string;
  purchaseCount: number;
  avgIntervalDays?: number;
  typicalStore?: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
}

export interface Purchase {
  id: string;
  date: string;
  store: string;
  items: PurchaseItem[];
  total: number;
  discount?: number;
  receiptImage?: string;
}