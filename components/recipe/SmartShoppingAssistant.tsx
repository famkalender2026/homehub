'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, Camera, Store, DollarSign, BarChart3, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, Purchase, ShoppingItem, PurchaseItem } from '@/lib/recipe/types';
import { getProducts, saveProducts, getPurchases, savePurchases } from '@/lib/recipe/storage';
import { estimatePrice, matchProduct } from '@/lib/recipe/data';

interface SmartShoppingAssistantProps {
  onAddProductToShoppingList: (productName: string, quantity: string) => void;
  shoppingItems: ShoppingItem[];
}

export function SmartShoppingAssistant({ onAddProductToShoppingList, shoppingItems }: SmartShoppingAssistantProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showAnalyse, setShowAnalyse] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<Purchase | null>(null);

  useEffect(() => {
    setProducts(getProducts());
    setPurchases(getPurchases());
  }, []);

  useEffect(() => {
    generateSuggestions();
  }, [products]);

  function generateSuggestions() {
    const now = new Date();
    const suggestionsList: Product[] = [];
    for (const p of products) {
      if (p.purchaseCount > 0 && p.lastPurchased && p.avgIntervalDays) {
        const lastDate = new Date(p.lastPurchased);
        const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        if (daysSince >= p.avgIntervalDays * 0.8) {
          suggestionsList.push(p);
        }
      } else if (p.purchaseCount > 2) {
        suggestionsList.push(p);
      }
    }
    setSuggestions(suggestionsList.slice(0, 5));
  }

  function updateProductStats(purchase: Purchase) {
    const updatedProducts = [...products];
    for (const item of purchase.items) {
      let product = updatedProducts.find(p => p.id === item.productId || p.name === item.name);
      if (!product) {
        // Neues Produkt anlegen
        const newProduct: Product = {
          id: `p${Date.now()}-${Math.random()}`,
          name: item.name,
          category: 'Sonstiges',
          avgPrice: item.price,
          unit: 'Stück',
          purchaseCount: 1,
          lastPurchased: purchase.date,
        };
        updatedProducts.push(newProduct);
        product = newProduct;
      } else {
        product.purchaseCount += 1;
        product.lastPurchased = purchase.date;
        product.avgPrice = (product.avgPrice * (product.purchaseCount - 1) + item.price) / product.purchaseCount;
        if (product.purchaseCount > 1 && product.lastPurchased) {
          const prevPurchase = purchases.find(p => p.items.some(i => i.name === product!.name) && p.date !== purchase.date);
          if (prevPurchase) {
            const interval = (new Date(purchase.date).getTime() - new Date(prevPurchase.date).getTime()) / (1000 * 3600 * 24);
            if (!product.avgIntervalDays) product.avgIntervalDays = interval;
            else product.avgIntervalDays = (product.avgIntervalDays * (product.purchaseCount - 2) + interval) / (product.purchaseCount - 1);
          }
        }
      }
    }
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    generateSuggestions();
  }

  function processReceiptImage(imageDataUrl: string) {
    setReceiptImage(imageDataUrl);
    // Mock-OCR – in echter Implementierung durch Tesseract.js ersetzen
    const mockText = "REWE Markt 24.03.2025 14:32\nÄpfel 2,49 €\nBananen 1,79 €\nMilch 1,19 €\nBrot 2,99 €\nRabatt -0,50 €\nSumme 7,96 €";
    const lines = mockText.split('\n');
    const items: PurchaseItem[] = [];
    let total = 0;
    let discount = 0;
    for (const line of lines) {
      const match = line.match(/([a-zA-Zäöüß]+)\s+([\d,]+)\s*€/);
      if (match) {
        const name = match[1];
        const price = parseFloat(match[2].replace(',', '.'));
        const product = matchProduct(name, products);
        items.push({ productId: product?.id || '', name, quantity: 1, price });
        total += price;
      }
      if (line.includes('Rabatt')) {
        const discMatch = line.match(/([\d,]+)\s*€/);
        if (discMatch) discount = parseFloat(discMatch[1].replace(',', '.'));
      }
    }
    const newPurchase: Purchase = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      store: 'REWE',
      items,
      total: total - discount,
      discount,
      receiptImage: imageDataUrl,
    };
    setParsedReceipt(newPurchase);
  }

  function saveParsedReceipt() {
    if (parsedReceipt) {
      const updatedPurchases = [...purchases, parsedReceipt];
      setPurchases(updatedPurchases);
      savePurchases(updatedPurchases);
      updateProductStats(parsedReceipt);
      setParsedReceipt(null);
      setReceiptImage(null);
      alert('Einkauf gespeichert!');
    }
  }

  function getStoreStats() {
    const storeMap = new Map<string, { count: number; total: number }>();
    for (const p of purchases) {
      const existing = storeMap.get(p.store);
      if (existing) {
        existing.count++;
        existing.total += p.total;
      } else {
        storeMap.set(p.store, { count: 1, total: p.total });
      }
    }
    return Array.from(storeMap.entries()).map(([store, data]) => ({ store, ...data }));
  }

  function getTopProducts() {
    const productCount = new Map<string, number>();
    for (const p of purchases) {
      for (const item of p.items) {
        productCount.set(item.name, (productCount.get(item.name) || 0) + 1);
      }
    }
    return Array.from(productCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }

  function getMonthlySpending() {
    const monthly = new Map<string, number>();
    for (const p of purchases) {
      const month = p.date.slice(0, 7);
      monthly.set(month, (monthly.get(month) || 0) + p.total);
    }
    return Array.from(monthly.entries()).sort();
  }

  return (
    <div className="card fade-in" style={{ marginTop: 20 }}>
      <div className="slbl"><TrendingUp size={14} /> Intelligente Einkaufshelferin</div>

      {suggestions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📌 Häufig gekaufte Produkte:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map(p => (
              <button
                key={p.id}
                className="bg"
                onClick={() => onAddProductToShoppingList(p.name, '1')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={12} /> {p.name} (ø {p.avgPrice.toFixed(2)}€)
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📸 Beleg abfotografieren</div>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => {
          if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => processReceiptImage(ev.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
          }
        }} style={{ display: 'none' }} id="receipt-input" />
        <label htmlFor="receipt-input" className="bp" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          <Camera size={14} /> Beleg scannen
        </label>
        {receiptImage && (
          <div style={{ marginTop: 12 }}>
            <img src={receiptImage} alt="Beleg" style={{ maxHeight: 150, borderRadius: 8 }} />
            {parsedReceipt && (
              <div style={{ marginTop: 8 }}>
                <p><strong>{parsedReceipt.store}</strong> - {new Date(parsedReceipt.date).toLocaleDateString()}</p>
                <p>Summe: {parsedReceipt.total.toFixed(2)} € {parsedReceipt.discount ? `(Rabatt: ${parsedReceipt.discount.toFixed(2)}€)` : ''}</p>
                <button className="bp" onClick={saveParsedReceipt} style={{ marginTop: 8 }}>Einkauf speichern</button>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="bg" onClick={() => setShowAnalyse(!showAnalyse)} style={{ width: '100%', justifyContent: 'space-between' }}>
        <span><BarChart3 size={14} /> Einkaufsanalyse</span>
        {showAnalyse ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showAnalyse && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="slbl"><Store size={14} /> Beliebteste Geschäfte</div>
            {getStoreStats().map(s => (
              <div key={s.store} className="erow">
                <span>{s.store}</span>
                <span>{s.count} Einkäufe</span>
                <span>{s.total.toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="slbl"><ShoppingCart size={14} /> Meistgekaufte Produkte</div>
            {getTopProducts().map(([name, count]) => (
              <div key={name} className="erow">
                <span>{name}</span>
                <span>{count}×</span>
              </div>
            ))}
          </div>
          <div>
            <div className="slbl"><DollarSign size={14} /> Monatliche Ausgaben</div>
            {getMonthlySpending().map(([month, total]) => (
              <div key={month} className="erow">
                <span>{month}</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}