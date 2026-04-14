// lib/recipe-api.ts
export interface Recipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  ingredients: string[];
  measures: string[];
}

export interface RecipeSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory: string;
}

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export async function searchRecipes(query: string): Promise<RecipeSummary[]> {
  const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!data.meals) return [];
  return data.meals.map((meal: any) => ({
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb,
    strCategory: meal.strCategory || '',
  }));
}

export async function getRecipeDetails(id: string): Promise<Recipe | null> {
  const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
  const data = await res.json();
  if (!data.meals) return null;
  const meal = data.meals[0];
  const ingredients: string[] = [];
  const measures: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push(ing.trim());
      measures.push(meas ? meas.trim() : '');
    }
  }
  return {
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strCategory: meal.strCategory || '',
    strArea: meal.strArea || '',
    strInstructions: meal.strInstructions || '',
    strMealThumb: meal.strMealThumb,
    strTags: meal.strTags,
    ingredients,
    measures,
  };
}

export async function getRandomRecipes(count: number): Promise<Recipe[]> {
  const promises = Array(count).fill(null).map(() => 
    fetch(`${BASE_URL}/random.php`).then(res => res.json())
  );
  const results = await Promise.all(promises);
  const recipes: Recipe[] = [];
  for (const data of results) {
    if (data.meals?.[0]) {
      const recipe = await getRecipeDetails(data.meals[0].idMeal);
      if (recipe) recipes.push(recipe);
    }
  }
  return recipes;
}

// Feste Brotzeitdosen-Rezept-IDs (TheMealDB)
export const LUNCHBOX_IDS = ['52772', '52820', '52948']; // Teriyaki Chicken, Chicken & Mushroom Pie, Tuna Sandwich

export async function getLunchboxRecipes(): Promise<Recipe[]> {
  const promises = LUNCHBOX_IDS.map(id => getRecipeDetails(id));
  const recipes = await Promise.all(promises);
  return recipes.filter((r): r is Recipe => r !== null);
}