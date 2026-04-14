'use client';
import React from 'react';
import { Heart } from 'lucide-react';
import { Recipe } from '@/lib/recipe/types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onFavorite: () => void;
  isFavorite: boolean;
}

export function RecipeCard({ recipe, onClick, onFavorite, isFavorite }: RecipeCardProps) {
  return (
    <div className="card fade-in" style={{ cursor: 'pointer' }}>
      <img
        src={recipe.image}
        alt={recipe.name}
        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }}
        onClick={onClick}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{recipe.name}</h3>
          <p style={{ fontSize: 12, color: '#64748b' }}>{recipe.category}</p>
        </div>
        <button onClick={onFavorite} className="bic" style={{ width: 36, height: 36 }}>
          {isFavorite ? <Heart size={16} fill="#ff3b30" color="#ff3b30" /> : <Heart size={16} />}
        </button>
      </div>
      <button onClick={onClick} className="bg" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
        Details ansehen
      </button>
    </div>
  );
}