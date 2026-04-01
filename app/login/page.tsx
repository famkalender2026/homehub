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
// WETTER: Passendes SVG-Icon je nach Wetterlage
// ============================================
function WetterIcon({ code, size = 64 }: { code: number; size?: number }) {
  // Sonne
  if (code === 0 || code === 1) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="12" fill="#FFD166" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1="32" y1="32"
          x2={32 + 22 * Math.cos((deg * Math.PI) / 180)}
          y2={32 + 22 * Math.sin((deg * Math.PI) / 180)}
          stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round"
        />
      ))}
    </svg>
  )
  // Regen
  if (code >= 61 && code <= 65 || code >= 80 && code <= 82) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="24" rx="18" ry="12" fill="#93c5fd" />
      {[20,28,36,44].map((x, i) => (
        <line key={i} x1={x} y1="40" x2={x - 4} y2="54"
          stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  )
  // Schnee
  if (code >= 71 && code <= 75) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="24" rx="18" ry="12" fill="#bfdbfe" />
      {[20,28,36,44].map((x, i) => (
        <text key={i} x={x - 4} y="54" fontSize="14" fill="#93c5fd">❄</text>
      ))}
    </svg>
  )
  // Gewitter
  if (code >= 95) return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="20" rx="18" ry="12" fill="#94a3b8" />
      <polygon points="34,32 26,46 32,44 28,58 40,40 34,42" fill="#FFD166" />
    </svg>
  )
  // Bewölkt (Standard)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="28" cy="30" rx="16" ry="11" fill="#e2e8f0" />
      <ellipse cx="38" cy="26" rx="12" ry="9" fill="#cbd5e1" />
      <ellipse cx="20" cy="32" rx="10" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

// ============================================
// WETTER-WIDGET (linke Seite)
// ============================================
function WetterWidget() {
  const [wetter, setWetter] = useState<any>(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    // Zuerst aus Cache laden (30 Min gültig)
    const cache = localStorage.getItem('wetter_cache')
    if (cache) {
      const { daten, zeit } = JSON.parse(cache)
      const alterInMin = (Date.now() - zeit) / 1000 / 60
      if (alterInMin < 30) { setWetter(daten); return }
    }
    // Sonst von API laden (Grettstadt, Bayern)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.95&longitude=10.17&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin&forecast_days=5')
      .then(r => r.json())
      .then(daten => {
        localStorage.setItem('wetter_cache', JSON.stringify({ daten, zeit: Date.now() }))
        setWetter(daten)
      })
      .catch(() => setFehler(true))
  }, [])

  const tage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

  return (
    <div className="flex flex-col justify-between h-full text-white p-8">
      {/* App Branding */}
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', marginBottom: '0.25rem' }}>
          FamilyHub
        </h1>
        <p style={{ opacity: 0.8, fontSize: '1rem' }}>Deine Familie, organisiert.</p>
      </div>

      {/* Wetter Hauptanzeige */}
      <div>
        {fehler ? (
          <p style={{ opacity: 0.7 }}>Wetter nicht verfügbar</p>
        ) : !wetter ? (
          <div style={{ opacity: 0.7 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }} />
            <p>Wetter wird geladen...</p>
          </div>
        ) : (
          <>
            <WetterIcon code={wetter.current.weather_code} size={72} />
            <div style={{ fontSize: '4rem', fontWeight: 300, lineHeight: 1, margin: '0.5rem 0' }}>
              {Math.round(wetter.current.temperature_2m)}°
            </div>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {wetterBeschreibung(wetter.current.weather_code)}
            </div>
            <div style={{ opacity: 0.8, fontSize: '0.9rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>💧 {wetter.current.relative_humidity_2m}%</span>
              <span>💨 {Math.round(wetter.current.wind_speed_10m)} km/h</span>
              <span>🌡️ Gefühlt {Math.round(wetter.current.apparent_temperature)}°</span>
            </div>

            {/* 5-Tage-Vorschau */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
              {wetter.daily.time.slice(0, 5).map((datum: string, i: number) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: '0.5rem 0.75rem',
                  textAlign: 'center',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ opacity: 0.8 }}>{tage[new Date(datum).getDay()]}</div>
                  <WetterIcon code={wetter.daily.weather_code[i]} size={24} />
                  <div>{Math.round(wetter.daily.temperature_2m_max[i])}°</div>
                  <div style={{ opacity: 0.6 }}>{Math.round(wetter.daily.temperature_2m_min[i])}°</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>
        📍 Grettstadt, Bayern
      </div>
    </div>
  )
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

  // Fehlermeldungen auf Deutsch
  function fehlerAufDeutsch(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort falsch.'
    if (msg.includes('Email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail.'
    if (msg.includes('User already registered')) return 'Diese E-Mail ist bereits registriert.'
    if (msg.includes('Password should be at least')) return 'Passwort muss mindestens 6 Zeichen haben.'
    if (msg.includes('Unable to validate email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.'
    return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
  }

  // E-Mail Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setFehler(''); setLaden(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort })
    if (error) { setFehler(fehlerAufDeutsch(error.message)); setLaden(false); return }
    router.push('/dashboard')
  }

  // Registrierung
  async function handleRegistrierung(e: React.FormEvent) {
    e.preventDefault()
    setFehler(''); setLaden(true)
    const { error } = await supabase.auth.signUp({
      email, password: passwort,
      options: { data: { name } }
    })
    if (error) { setFehler(fehlerAufDeutsch(error.message)); setLaden(false); return }
    setErfolg('Registrierung erfolgreich! Bitte prüfe deine E-Mails zur Bestätigung.')
    setLaden(false)
  }

// Passwort zurücksetzen
async function handlePasswortVergessen(e: React.FormEvent) {
  e.preventDefault()
  setFehler(''); setLaden(true)
  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) { setFehler(fehlerAufDeutsch(error.message)); setLaden(false); return }
  setResetErfolg('E-Mail gesendet! Prüfe deinen Posteingang.')
  setLaden(false)
}

  // Google Login
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

      {/* LINKE SEITE – Wetter + Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 60%, #4a9fd4 100%)',
        display: 'none',
      }}
        className="md:flex md:flex-col"
      >
        <WetterWidget />
      </div>

      {/* RECHTE SEITE – Login Formular */}
      <div style={{
        flex: 1,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo (nur auf Mobile sichtbar) */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', color: '#1a3a5c' }}>
              FamilyHub
            </h1>
            <p style={{ color: '#7a8fa6', fontSize: '0.9rem' }}>Deine Familie, organisiert.</p>
          </div>

          <h2 style={{ color: '#1a3a5c', fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {tab === 'anmelden' ? 'Willkommen zurück!' : 'Konto erstellen'}
          </h2>
          <p style={{ color: '#7a8fa6', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {tab === 'anmelden' ? 'Melde dich in deinem Konto an.' : 'Erstelle dein FamilyHub-Konto.'}
          </p>

          {/* Tab-Wechsel */}
          <div style={{
            display: 'flex', background: '#f0f4f8',
            borderRadius: 10, padding: 4, marginBottom: '1.5rem'
          }}>
            {(['anmelden', 'registrieren'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setFehler(''); setErfolg('') }}
                style={{
                  flex: 1, padding: '0.6rem',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 500,
                  background: tab === t ? '#ffffff' : 'transparent',
                  color: tab === t ? '#2d6a9f' : '#7a8fa6',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}>
                {t === 'anmelden' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          {/* Fehlermeldung */}
          {fehler && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '0.75rem 1rem',
              color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem'
            }}>
              ⚠️ {fehler}
            </div>
          )}

          {/* Erfolgsmeldung */}
          {erfolg && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '0.75rem 1rem',
              color: '#16a34a', fontSize: '0.9rem', marginBottom: '1rem'
            }}>
              ✅ {erfolg}
            </div>
          )}

          {/* Formular */}
          <form onSubmit={tab === 'anmelden' ? handleLogin : handleRegistrierung}>

            {/* Name (nur bei Registrierung) */}
            {tab === 'registrieren' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500, marginBottom: 6 }}>
                  Dein Name
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="z.B. Max Mustermann" required
                  style={inputStyle} />
              </div>
            )}

            {/* E-Mail */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500, marginBottom: 6 }}>
                E-Mail
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.de" required
                style={inputStyle} />
            </div>

            {/* Passwort */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#1a3a5c', fontSize: '0.9rem', fontWeight: 500, marginBottom: 6 }}>
                Passwort
              </label>
              <input type="password" value={passwort} onChange={e => setPasswort(e.target.value)}
                placeholder="Mindestens 6 Zeichen" required
                style={inputStyle} />
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={laden}
              style={{
                width: '100%', padding: '0.85rem',
                background: laden ? '#93c5fd' : '#2d6a9f',
                color: '#ffffff', border: 'none', borderRadius: 10,
                fontSize: '1rem', fontWeight: 500, cursor: laden ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s'
              }}>
              {laden ? '⏳ Bitte warten...' : tab === 'anmelden' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>
{/* Passwort vergessen Link */}
{tab === 'anmelden' && !zeigePasswortVergessen && (
  <div style={{ textAlign: 'right', marginTop: '1rem', marginBottom: '1.5rem' }}>
    <button onClick={() => setZeigePasswortVergessen(true)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#2d6a9f', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif"
      }}>
      Passwort vergessen?
    </button>
  </div>
)}

{/* Passwort vergessen Formular */}
{zeigePasswortVergessen && (
  <div style={{
    background: '#f0f4f8', borderRadius: 12,
    padding: '1.25rem', marginBottom: '1rem'
  }}>
    <h3 style={{ color: '#1a3a5c', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
      🔑 Passwort zurücksetzen
    </h3>
    <p style={{ color: '#7a8fa6', fontSize: '0.85rem', marginBottom: '1rem' }}>
      Gib deine E-Mail ein – du bekommst einen Reset-Link.
    </p>

    {resetErfolg ? (
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 8, padding: '0.75rem',
        color: '#16a34a', fontSize: '0.9rem'
      }}>
        ✅ {resetErfolg}
      </div>
    ) : (
      <form onSubmit={handlePasswortVergessen}>
        <input type="email" value={resetEmail}
          onChange={e => setResetEmail(e.target.value)}
          placeholder="deine@email.de" required
          style={{ ...inputStyle, marginBottom: '0.75rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={laden}
            style={{
              flex: 1, padding: '0.7rem',
              background: '#2d6a9f', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem'
            }}>
            {laden ? '⏳ Senden...' : 'Reset-Link senden'}
          </button>
          <button type="button" onClick={() => setZeigePasswortVergessen(false)}
            style={{
              padding: '0.7rem 1rem',
              background: '#fff', color: '#7a8fa6',
              border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem'
            }}>
            Abbrechen
          </button>
        </div>
      </form>
    )}
  </div>
)}
          {/* Trennlinie */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ color: '#7a8fa6', fontSize: '0.85rem' }}>oder</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Google Login */}
          <button onClick={handleGoogle}
            style={{
              width: '100%', padding: '0.85rem',
              background: '#ffffff', color: '#1a3a5c',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
            }}>
            {/* Google SVG Icon */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-7.7 19.7-20 0-1.3-.1-2.7-.2-3z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.5-17.7 11.7z"/>
              <path fill="#FBBC05" d="M24 43c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.9 33.7 27.1 35 24 35c-6 0-11.1-4-12.9-9.6l-7 5.4C7.8 38.4 15.4 43 24 43z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.6 4.8-4.9 6.3l6.7 5.5C41.8 36.8 44.5 30.4 44.5 23c0-1-.1-2-.2-3z"/>
            </svg>
            Mit Google anmelden
          </button>

        </div>
      </div>
    </div>
  )
}

// Wiederverwendbarer Input-Style
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: '1rem', color: '#1a3a5c',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
  background: '#f8fafc'
}