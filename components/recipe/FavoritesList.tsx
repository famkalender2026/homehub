'use client';
import React from 'react';
import { Recipe } from '@/lib/recipe/types';
import { RecipeGrid } from './RecipeGrid';
import { germanRecipes } from '@/lib/recipe/data';

interface FavoritesListProps {
  favoriteIds: string[];
  onRecipeClick: (recipe: Recipe) => void;
  onFavoriteToggle: (id: string) => void;
  favorites: string[];
}

export function FavoritesList({ favoriteIds, onRecipeClick, onFavoriteToggle, favorites }: FavoritesListProps) {
  const recipes = germanRecipes.filter(r => favoriteIds.includes(r.id));
  return <RecipeGrid recipes={recipes} onRecipeClick={onRecipeClick} onFavoriteToggle={onFavoriteToggle} favorites={favorites} />;
}