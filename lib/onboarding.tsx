import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type OnboardingVibeId = 'remote' | 'architectural' | 'overwater' | 'offgrid' | 'cozy' | 'views';

export interface OnboardingPrefs {
  vibeIds: OnboardingVibeId[];
  maxPrice: number | null;
}

const PREFS_KEY = 'vaulted:onboarding-prefs';

// Module-level gate for native (resets each app restart = one per session)
let _nativeSessionDone = false;

export function isOnboardingSessionDone(): boolean {
  if (Platform.OS === 'web') {
    try { return !!sessionStorage.getItem('vaulted:onboarding_done'); } catch { return false; }
  }
  return _nativeSessionDone;
}

export function markOnboardingSessionDone(): void {
  if (Platform.OS === 'web') {
    try { sessionStorage.setItem('vaulted:onboarding_done', '1'); } catch {}
  } else {
    _nativeSessionDone = true;
  }
}

interface Ctx {
  prefs: OnboardingPrefs | null;
  savePrefs: (p: OnboardingPrefs) => void;
}

const OnboardingContext = createContext<Ctx>({ prefs: null, savePrefs: () => {} });

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<OnboardingPrefs | null>(null);

  const savePrefs = (p: OnboardingPrefs) => {
    setPrefs(p);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p)).catch(() => {});
  };

  const value = useMemo(() => ({ prefs, savePrefs }), [prefs]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
