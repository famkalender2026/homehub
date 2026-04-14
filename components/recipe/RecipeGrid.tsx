'use client';
import React from 'react';
import { Recipe } from '@/lib/recipe/types';
import { RecipeCard } from './RecipeCard';
import { UtensilsCrossed } from 'lucide-react';

interface RecipeGridProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onFavoriteToggle: (id: string) => void;
  favorites: string[];
}

export function RecipeGrid({ recipes, onRecipeClick, onFavoriteToggle, favorites }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <UtensilsCrossed size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
        <p>Keine Rezepte gefunden. Versuche einen anderen Begriff.</p>
      </div>
    );
  }
  return (
    <div className="card-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onClick={() => onRecipeClick(recipe)}
          onFavorite={() => onFavoriteToggle(recipe.id)}
          isFavorite={favorites.includes(recipe.id)}
        />
      ))}
    </div>
  );
}