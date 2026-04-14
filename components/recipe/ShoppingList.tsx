'use client';
import React from 'react';
import { ShoppingCart, Trash2, Check } from 'lucide-react';
import { ShoppingItem } from '@/lib/recipe/types';

interface ShoppingListProps {
  items: ShoppingItem[];
  estimatedTotal: number;
  onToggleCheck: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearChecked: () => void;
}

export function ShoppingList({ items, estimatedTotal, onToggleCheck, onRemoveItem, onClearChecked }: ShoppingListProps) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.recipeId]) acc[item.recipeId] = { recipeName: item.recipeName, items: [] };
    acc[item.recipeId].items.push(item);
    return acc;
  }, {} as Record<string, { recipeName: string; items: ShoppingItem[] }>);

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="slbl" style={{ margin: 0 }}><ShoppingCart size={14} /> Einkaufsliste</div>
        <button onClick={onClearChecked} className="bg" style={{ height: 36 }}><Trash2 size={14} /> Abgehakte löschen</button>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Noch keine Zutaten. Füge Rezepte zur Liste hinzu!</p>
      ) : (
        <>
          {Object.entries(grouped).map(([recipeId, group]) => (
            <div key={recipeId} style={{ marginBottom: 20 }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8, color: '#1e3a5f' }}>{group.recipeName}</h4>
              {group.items.map(item => (
                <div key={item.id} className="frow" style={{ padding: '6px 0' }}>
                  <button onClick={() => onToggleCheck(item.id)} className="bic" style={{ width: 28, height: 28 }}>
                    {item.checked ? <Check size={14} color="#16a34a" /> : <div style={{ width: 14, height: 14, border: '2px solid #94a3b8', borderRadius: 4 }} />}
                  </button>
                  <span style={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#94a3b8' : '#1e293b' }}>
                    {item.measure} {item.ingredient}
                  </span>
                  {item.estimatedPrice && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>{item.estimatedPrice.toFixed(2)} €</span>
                  )}
                  <button onClick={() => onRemoveItem(item.id)} className="bdel"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          ))}
          <div style={{ marginTop: 16, textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>Geschätzter Gesamtpreis: </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{estimatedTotal.toFixed(2)} €</span>
          </div>
        </>
      )}
    </div>
  );
}