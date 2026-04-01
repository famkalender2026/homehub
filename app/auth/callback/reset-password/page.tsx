'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function PasswortZuruecksetzen() {
  const router = useRouter()
  const supabase = createClient()
  const [passwort, setPasswort] = useState('')
  const [bestaetigung, setBestaetigung] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [erfolg, setErfolg] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (passwort !== bestaetigung) {
      setFehler('Die Passwörter stimmen nicht überein.'); return
    }
    if (passwort.length < 6) {
      setFehler('Passwort muss mindestens 6 Zeichen haben.'); return
    }
    setLaden(true); setFehler('')
    const { error } = await supabase.auth.updateUser({ password: passwort })
    if (error) { setFehler('Fehler beim Zurücksetzen. Bitte erneut versuchen.'); setLaden(false); return }
    setErfolg(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4f8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: '2rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        padding: '2.5rem', width: '100%', maxWidth: 400,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          color: '#1a3a5c', fontSize: '1.75rem', marginBottom: '0.5rem'
        }}>
          Neues Passwort
        </h1>
        <p style={{ color: '#7a8fa6', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Gib dein neues Passwort ein.
        </p>

        {erfolg ? (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '1rem',
            color: '#16a34a', textAlign: 'center'
          }}>
            ✅ Passwort erfolgreich geändert!<br />
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Du wirst zum Login weitergeleitet...
            </span>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            {fehler && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '0.75rem',
                color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem'
              }}>
                ⚠️ {fehler}
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500, marginBottom: 6 }}>
                Neues Passwort
              </label>
              <input type="password" value={passwort}
                onChange={e => setPasswort(e.target.value)}
                placeholder="Mindestens 6 Zeichen" required
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: '1rem', color: '#1a3a5c',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                  background: '#f8fafc'
                }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500, marginBottom: 6 }}>
                Passwort bestätigen
              </label>
              <input type="password" value={bestaetigung}
                onChange={e => setBestaetigung(e.target.value)}
                placeholder="Passwort wiederholen" required
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: '1rem', color: '#1a3a5c',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                  background: '#f8fafc'
                }} />
            </div>
            <button type="submit" disabled={laden}
              style={{
                width: '100%', padding: '0.85rem',
                background: laden ? '#93c5fd' : '#2d6a9f',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: '1rem', fontWeight: 500, cursor: laden ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif"
              }}>
              {laden ? '⏳ Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
