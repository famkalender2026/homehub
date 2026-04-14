'use client';
import React, { useState } from 'react';
import { X, Heart, ShoppingCart, List, FileText } from 'lucide-react';
import { Recipe } from '@/lib/recipe/types';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onFavorite: () => void;
  isFavorite: boolean;
  onAddToShopping: () => void;
}

export function RecipeDetailModal({ recipe, onClose, onFavorite, isFavorite, onAddToShopping }: RecipeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const steps = recipe.instructions.split(/\d\./).filter(s => s.trim().length > 0);

  return (
    <div className="moo" onClick={onClose}>
      <div className="mosh" onClick={e => e.stopPropagation()}>
        <div className="mohdl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{recipe.name}</h2>
          <button className="bic" onClick={onClose}><X size={18} /></button>
        </div>
        <img src={recipe.image} alt={recipe.name} style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 200, objectFit: 'cover' }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button className="bp" onClick={onFavorite} style={{ flex: 1, justifyContent: 'center' }}>
            {isFavorite ? <Heart size={16} fill="#fff" /> : <Heart size={16} />} {isFavorite ? 'Favorit entfernen' : 'Favorit'}
          </button>
          <button className="bg" onClick={onAddToShopping} style={{ flex: 1, justifyContent: 'center' }}>
            <ShoppingCart size={16} /> Einkaufsliste
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
          <button
            className={`detail-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <List size={14} style={{ display: 'inline', marginRight: 6 }} /> Zutaten
          </button>
          <button
            className={`detail-tab ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            <FileText size={14} style={{ display: 'inline', marginRight: 6 }} /> Zubereitung
          </button>
        </div>

        {activeTab === 'ingredients' ? (
          <ul style={{ marginBottom: 20, paddingLeft: 20 }}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} style={{ marginBottom: 8 }}><strong>{recipe.measures[i]}</strong> {ing}</li>
            ))}
          </ul>
        ) : (
          <ol style={{ paddingLeft: 20, listStyle: 'decimal' }}>
            {steps.map((step, i) => (
              <li key={i} style={{ marginBottom: 12, lineHeight: 1.5 }}>{step.trim()}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}