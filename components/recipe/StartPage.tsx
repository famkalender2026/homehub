'use client';
import React from 'react';
import { Coffee, Sparkles, Heart } from 'lucide-react';
import { Recipe } from '@/lib/recipe/types';
import { RecipeGrid } from './RecipeGrid';

interface StartPageProps {
  lunchboxRecipes: Recipe[];
  normalRecipes: Recipe[];
  recommendations: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onFavoriteToggle: (id: string) => void;
  favorites: string[];
}

export function StartPage({ lunchboxRecipes, normalRecipes, recommendations, onRecipeClick, onFavoriteToggle, favorites }: StartPageProps) {
  return (
    <div className="fade-in">
      <div className="slbl"><Coffee size={14} /> Brotzeitdosen-Klassiker</div>
      <div className="card-grid" style={{ marginBottom: 32 }}>
        <RecipeGrid recipes={lunchboxRecipes} onRecipeClick={onRecipeClick} onFavoriteToggle={onFavoriteToggle} favorites={favorites} />
      </div>
      <div className="slbl"><Sparkles size={14} /> Heutige Empfehlungen</div>
      <div className="card-grid" style={{ marginBottom: 32 }}>
        <RecipeGrid recipes={normalRecipes} onRecipeClick={onRecipeClick} onFavoriteToggle={onFavoriteToggle} favorites={favorites} />
      </div>
      <div className="slbl"><Heart size={14} /> KI für dich entdeckt</div>
      <div className="card-grid">
        <RecipeGrid recipes={recommendations} onRecipeClick={onRecipeClick} onFavoriteToggle={onFavoriteToggle} favorites={favorites} />
      </div>
    </div>
  );
}