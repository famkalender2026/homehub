'use client';
import React, { useState } from 'react';
import { Calendar, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { DayPlan, Recipe } from '@/lib/recipe/types';
import { germanRecipes } from '@/lib/recipe/data';

interface MealPlannerProps {
  mealPlan: DayPlan[];
  onAddToPlan: (recipe: Recipe, dayIndex: number) => void;
  onRemoveFromPlan: (dayIndex: number) => void;
}

export function MealPlanner({ mealPlan, onAddToPlan, onRemoveFromPlan }: MealPlannerProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState<Recipe[]>([]);

  const handleSearch = () => {
    if (!searchTerm) return;
    setFiltered(germanRecipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())));
  };

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="slbl" style={{ margin: 0 }}><Calendar size={14} /> Wochenplan</div>
        <button className="bp" onClick={() => setShowSearch(!showSearch)}><Plus size={14} />Rezept hinzufügen</button>
      </div>
      {showSearch && (
        <div style={{ marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="inp" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rezept suchen..." />
            <button className="bp" onClick={handleSearch}>Suchen</button>
          </div>
          {filtered.length > 0 && (
            <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto' }}>
              {filtered.map(r => (
                <div key={r.id} className="frow" style={{ cursor: 'pointer' }} onClick={() => {
                  const day = prompt('Tag (0=Montag...6=Sonntag)');
                  if (day !== null && !isNaN(parseInt(day))) onAddToPlan(r, parseInt(day));
                  setShowSearch(false);
                  setFiltered([]);
                  setSearchTerm('');
                }}>
                  <div className="fico"><UtensilsCrossed size={16} /></div>
                  <div style={{ flex: 1 }}>{r.name}</div>
                  <Plus size={14} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {mealPlan.map((day, idx) => (
        <div key={day.day} className="erow">
          <span style={{ fontWeight: 600, width: 80 }}>{day.day}</span>
          <span style={{ flex: 1 }}>{day.recipeName || '—'}</span>
          {day.recipeId && (
            <button onClick={() => onRemoveFromPlan(idx)} className="bdel"><Trash2 size={14} /></button>
          )}
        </div>
      ))}
    </div>
  );
}