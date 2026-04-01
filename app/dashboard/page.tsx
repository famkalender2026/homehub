'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [nutzer, setNutzer] = useState<any>(null)

  useEffect(() => {
    // Nutzer laden
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setNutzer(data.user)
    })
  }, [])

  async function handleAbmelden() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!nutzer) return (
    <div style={{
      minHeight: '100vh', background: '#f0f4f8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <p style={{ color: '#2d6a9f' }}>⏳ Wird geladen...</p>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4f8',
      fontFamily: "'DM Sans', sans-serif", padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff', borderRadius: 16,
        padding: '1.5rem 2rem', marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          color: '#1a3a5c', fontSize: '1.75rem', margin: 0
        }}>
          🏠 FamilyHub
        </h1>
        <button onClick={handleAbmelden}
          style={{
            background: '#f0f4f8', color: '#7a8fa6',
            border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.9rem'
          }}>
          Abmelden
        </button>
      </div>

      {/* Willkommen Karte */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a5c, #2d6a9f)',
        borderRadius: 16, padding: '2rem',
        color: '#ffffff', marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
          👋 Willkommen bei FamilyHub!
        </h2>
        <p style={{ margin: 0, opacity: 0.85 }}>
          Angemeldet als: {nutzer.email}
        </p>
      </div>

      {/* Kommen bald Karte */}
      <div style={{
        background: '#ffffff', borderRadius: 16,
        padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ color: '#1a3a5c', marginTop: 0 }}>🚧 Wird gebaut...</h3>
        <p style={{ color: '#7a8fa6' }}>
          Das Dashboard wird Schritt für Schritt ausgebaut. Bald kommen hier:
        </p>
        <ul style={{ color: '#7a8fa6', lineHeight: 2 }}>
          <li>🌤️ Wetter-Widget</li>
          <li>📅 Kalender-Vorschau</li>
          <li>✅ Aufgaben-Vorschau</li>
          <li>🛒 Einkaufsliste</li>
          <li>🍳 Rezepte</li>
        </ul>
      </div>
    </div>
  )
}