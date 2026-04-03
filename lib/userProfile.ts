// lib/userProfile.ts
// Nutzer-Profil-Kontext — steuert frauenspezifische Features

export interface UserProfile {
  name: string
  gender: 'female' | 'male' | 'other' | 'prefer_not_to_say'
  showCycleCalendar: boolean   // Zyklus-Tab nur wenn gender=female & true
  homeCity: string
  homeLat: number
  homeLon: number
  bundesland: string           // z.B. 'BY' für Feiertags-Filter
}

// Standard-Profil (später aus Supabase laden)
export const DEFAULT_PROFILE: UserProfile = {
  name: 'Marie',
  gender: 'female',
  showCycleCalendar: true,
  homeCity: 'Grettstadt, Bayern',
  homeLat: 49.95,
  homeLon: 10.17,
  bundesland: 'BY',
}

/**
 * Gibt zurück ob der Zyklus-Kalender angezeigt werden soll.
 * Nur für weibliche Nutzer die es aktiviert haben.
 */
export function showCycleFeature(profile: UserProfile): boolean {
  return profile.gender === 'female' && profile.showCycleCalendar
}