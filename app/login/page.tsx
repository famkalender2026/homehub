'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// ============================================
// WETTER: WMO-Code → deutschen Text übersetzen
// ============================================
function wetterBeschreibung(code: number): string {
  const codes: Record<number, string> = {
    0: 'Klar und sonnig',
    1: 'Meist klar', 2: 'Teilweise bewölkt', 3: 'Bedeckt',
    45: 'Neblig', 48: 'Gefrierender Nebel',
    51: 'Leichter Nieselregen', 53: 'Nieselregen', 55: 'Starker Nieselregen',
    61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen',
    71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall',
    80: 'Leichte Schauer', 81: 'Schauer', 82: 'Starke Schauer',
    95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Schweres Gewitter',
  }
  return codes[code] ?? 'Wetter unbekannt'
}

// ============================================
// WETTER: SVG-Icon je nach Wetterlage
// ============================================
function WetterIcon({ code, size = 64 }: { code: number; size?: number }) {
  if (code === 0 || code === 1) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="12" fill="#FFD166" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i} x1="32" y1="32" x2={32 + 22 * Math.cos((deg * Math.PI) / 180)} y2={32 + 22 * Math.sin((deg * Math.PI) / 180)} stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  )
  if (code >= 61 && code <= 65 || code >= 80 && code <= 82) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="24" rx="18" ry="12" fill="#93c5fd" />
      {[20,28,36,44].map((x, i) => <line key={i} x1={x} y1="40" x2={x-4} y2="54" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />)}
    </svg>
  )
  if (code >= 71 && code <= 75) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="24" rx="18" ry="12" fill="#bfdbfe" />
      {[20,28,36,44].map((x, i) => <text key={i} x={x-4} y="54" fontSize="14" fill="#93c5fd">❄</text>)}
    </svg>
  )
  if (code >= 95) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="20" rx="18" ry="12" fill="#94a3b8" />
      <polygon points="34,32 26,46 32,44 28,58 40,40 34,42" fill="#FFD166" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="28" cy="30" rx="16" ry="11" fill="#e2e8f0" />
      <ellipse cx="38" cy="26" rx="12" ry="9" fill="#cbd5e1" />
      <ellipse cx="20" cy="32" rx="10" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================
// WETTER-WIDGET (NUR aktuelles Wetter, keine Vorschau)
// ============================================
function WetterWidget() {
  const [wetter, setWetter] = useState<any>(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    const cache = localStorage.getItem('wetter_cache')
    if (cache) {
      const { daten, zeit } = JSON.parse(cache)
      if ((Date.now() - zeit) / 1000 / 60 < 30) { setWetter(daten); return }
    }
    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.95&longitude=10.17&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe%2FBerlin')
      .then(r => r.json())
      .then(daten => {
        localStorage.setItem('wetter_cache', JSON.stringify({ daten, zeit: Date.now() }))
        setWetter(daten)
      })
      .catch(() => setFehler(true))
  }, [])

  return (
    <div className="flex flex-col justify-between h-full text-white p-6 md:p-8">
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', marginBottom: '0.25rem' }}>FamilyHub</h1>
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Deine Familie, organisiert.</p>
      </div>
      <div>
        {fehler ? (
          <p style={{ opacity: 0.7 }}>Wetter nicht verfügbar</p>
        ) : !wetter ? (
          <div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }} />
            <p>Wetter wird geladen...</p>
          </div>
        ) : (
          <>
            <WetterIcon code={wetter.current.weather_code} size={64} />
            <div style={{ fontSize: '3rem', fontWeight: 300, lineHeight: 1, margin: '0.5rem 0' }}>
              {Math.round(wetter.current.temperature_2m)}°
            </div>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {wetterBeschreibung(wetter.current.weather_code)}
            </div>
            <div style={{ opacity: 0.8, fontSize: '0.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>💧 {wetter.current.relative_humidity_2m}%</span>
              <span>💨 {Math.round(wetter.current.wind_speed_10m)} km/h</span>
              <span>🌡️ Gefühlt {Math.round(wetter.current.apparent_temperature)}°</span>
            </div>
          </>
        )}
      </div>
      <div style={{ opacity: 0.6, fontSize: '0.7rem', marginTop: 'auto' }}>📍 Grettstadt, Bayern</div>
    </div>
  )
}

// ============================================
// Professionelles Auge-Icon (SVG) für Passwort-Toggle
// ============================================
function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  } else {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
}

// ============================================
// HAUPT LOGIN-SEITE
// ============================================
export default function LoginSeite() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'anmelden' | 'registrieren'>('anmelden')
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [name, setName] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [erfolg, setErfolg] = useState('')
  const [zeigePasswortVergessen, setZeigePasswortVergessen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetErfolg, setResetErfolg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function fehlerAufDeutsch(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort falsch.'
    if (msg.includes('Email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail.'
    if (msg.includes('User already registered')) return 'Diese E-Mail ist bereits registriert.'
    if (msg.includes('Password should be at least')) return 'Passwort muss mindestens 6 Zeichen haben.'
    if (msg.includes('Unable to validate email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.'
    if (msg.includes('redirect_uri_mismatch')) return 'Google Login: Redirect-URI nicht korrekt (siehe Hinweis unten).'
    return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setFehler(''); setLaden(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort })
    if (error) { setFehler(fehlerAufDeutsch(error.message)); setLaden(false); return }
    router.push('/dashboard')
  }

  async function handleRegistrierung(e: React.FormEvent) {
    e.preventDefault()
    setFehler(''); setLaden(true)
    const { error } = await supabase.auth.signUp({ email, password: passwort, options: { data: { name } } })
    if (error) { setFehler(fehlerAufDeutsch(error.message)); setLaden(false); return }
    setErfolg('Registrierung erfolgreich! Bitte prüfe deine E-Mails zur Bestätigung.')
    setLaden(false)
  }

  async function handlePasswortVergessen(e: React.FormEvent) {
    e.preventDefault()
    setFehler(''); setLaden(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/auth/reset-password` })
    if (error) { setFehler(fehlerAufDeutsch(error.message)); setLaden(false); return }
    setResetErfolg('E-Mail gesendet! Prüfe deinen Posteingang.')
    setLaden(false)
  }

  async function handleGoogle() {
    setFehler('')
    const redirectUrl = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    })
    if (error) {
      if (error.message.includes('redirect_uri_mismatch')) {
        setFehler(`Google Login Fehler (400): redirect_uri_mismatch. Bitte füge in der Google Cloud Console folgende URI hinzu: ${redirectUrl}`)
      } else {
        setFehler(fehlerAufDeutsch(error.message))
      }
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Linke Seite – Wetter (nur auf mittleren/großen Bildschirmen) */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 60%, #4a9fd4 100%)', display: 'none' }} className="md:flex md:flex-col">
        <WetterWidget />
      </div>

      {/* Rechte Seite – Login Formular */}
      <div style={{ flex: 1, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo nur auf mobilen Geräten (weil Wetter dort nicht sichtbar ist) */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: '#1a3a5c' }}>FamilyHub</h1>
            <p style={{ color: '#7a8fa6', fontSize: '0.9rem' }}>Deine Familie, organisiert.</p>
          </div>

          <h2 style={{ color: '#1a3a5c', fontSize: '1.75rem', fontWeight: 600 }}>{tab === 'anmelden' ? 'Willkommen zurück!' : 'Konto erstellen'}</h2>
          <p style={{ color: '#7a8fa6', marginBottom: '2rem' }}>{tab === 'anmelden' ? 'Melde dich in deinem Konto an.' : 'Erstelle dein FamilyHub-Konto.'}</p>

          {/* Tab-Wechsel */}
          <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
            {(['anmelden', 'registrieren'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setFehler(''); setErfolg(''); setShowPassword(false) }}
                style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 500, background: tab === t ? '#ffffff' : 'transparent', color: tab === t ? '#2d6a9f' : '#7a8fa6', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {t === 'anmelden' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          {fehler && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>⚠️ {fehler}</div>}
          {erfolg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem', color: '#16a34a', fontSize: '0.9rem', marginBottom: '1rem' }}>✅ {erfolg}</div>}

          <form onSubmit={tab === 'anmelden' ? handleLogin : handleRegistrierung}>
            {tab === 'registrieren' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500 }}>Dein Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Max Mustermann" required style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500 }}>E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.de" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500 }}>Passwort</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={passwort} onChange={e => setPasswort(e.target.value)} placeholder="Mindestens 6 Zeichen" required style={{ ...inputStyle, paddingRight: '2.8rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort einblenden'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#7a8fa6', display: 'flex', alignItems: 'center' }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={laden} style={{ width: '100%', padding: '0.85rem', background: laden ? '#93c5fd' : '#2d6a9f', color: '#ffffff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 500, cursor: laden ? 'not-allowed' : 'pointer' }}>
              {laden ? '⏳ Bitte warten...' : tab === 'anmelden' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          {tab === 'anmelden' && !zeigePasswortVergessen && (
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button onClick={() => setZeigePasswortVergessen(true)} style={{ background: 'none', border: 'none', color: '#2d6a9f', fontSize: '0.85rem', cursor: 'pointer' }}>Passwort vergessen?</button>
            </div>
          )}

          {zeigePasswortVergessen && (
            <div style={{ background: '#f0f4f8', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', marginTop: '1rem' }}>
              <h3 style={{ color: '#1a3a5c', fontSize: '1rem', fontWeight: 600 }}>🔑 Passwort zurücksetzen</h3>
              <p style={{ color: '#7a8fa6', fontSize: '0.85rem', marginBottom: '1rem' }}>Gib deine E-Mail ein – du bekommst einen Reset-Link.</p>
              {resetErfolg ? <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem', color: '#16a34a' }}>✅ {resetErfolg}</div> : (
                <form onSubmit={handlePasswortVergessen}>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="deine@email.de" required style={{ ...inputStyle, marginBottom: '0.75rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={laden} style={{ flex: 1, padding: '0.7rem', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{laden ? '⏳ Senden...' : 'Reset-Link senden'}</button>
                    <button type="button" onClick={() => setZeigePasswortVergessen(false)} style={{ padding: '0.7rem 1rem', background: '#fff', color: '#7a8fa6', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>Abbrechen</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}><div style={{ flex: 1, height: 1, background: '#e2e8f0' }} /><span style={{ color: '#7a8fa6' }}>oder</span><div style={{ flex: 1, height: 1, background: '#e2e8f0' }} /></div>

          <button onClick={handleGoogle} style={{ width: '100%', padding: '0.85rem', background: '#ffffff', color: '#1a3a5c', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '1rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-7.7 19.7-20 0-1.3-.1-2.7-.2-3z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.5-17.7 11.7z"/><path fill="#FBBC05" d="M24 43c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.9 33.7 27.1 35 24 35c-6 0-11.1-4-12.9-9.6l-7 5.4C7.8 38.4 15.4 43 24 43z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.6 4.8-4.9 6.3l6.7 5.5C41.8 36.8 44.5 30.4 44.5 23c0-1-.1-2-.2-3z"/></svg>
            Mit Google anmelden
          </button>

          {/* Hilfebox für Google Redirect-Fehler */}
          {fehler && fehler.includes('redirect_uri_mismatch') && (
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', background: '#fff3e0', padding: '0.75rem', borderRadius: 8, color: '#b45309' }}>
              <strong>🔧 Lösung:</strong> Füge in der Google Cloud Console unter "Authorized redirect URIs" folgende Adresse hinzu:<br />
              <code style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: 4, wordBreak: 'break-all' }}>{`${window.location.origin}/auth/callback`}</code><br />
              (Danach einige Minuten warten oder Cache leeren.)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: '1rem', color: '#1a3a5c', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box', background: '#f8fafc'
}