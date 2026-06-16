import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '../lib/favorites';
import { UserReviewsProvider } from '../lib/userReviews';
import { VaultEntry } from '../components/VaultEntry';
import { VaultProvider, useVault } from '../lib/vaultContext';
import { OnboardingProvider, useOnboarding, isOnboardingSessionDone } from '../lib/onboarding';
import { OnboardingModal } from '../components/OnboardingModal';
import { PriceAlertsProvider } from '../lib/priceAlerts';
import { AuthProvider } from '../lib/auth';
import { VaultSealProvider } from '../lib/vaultSeal';
import { VaultSealOverlay } from '../components/VaultSealOverlay';
import type { OnboardingPrefs } from '../lib/onboarding';

function AppShell() {
  const { setVaultDone, vaultDone } = useVault();
  const { savePrefs } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!vaultDone) return;
    if (isOnboardingSessionDone()) return;
    const delay = Math.random() * 60_000 + 300_000; // 5–6 min
    const t = setTimeout(() => setShowOnboarding(true), delay);
    return () => clearTimeout(t);
  }, [vaultDone]);

  const handleOnboardingDone = (prefs: OnboardingPrefs | null) => {
    if (prefs) savePrefs(prefs);
    setShowOnboarding(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <Stack screenOptions={{ headerShadowVisible: false, contentStyle: { backgroundColor: '#0A0A0A' } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="listing/[id]"
          options={{ title: '', headerTransparent: true, headerTintColor: '#F5F3EF' }}
        />
      </Stack>
      <VaultEntry onDone={() => setVaultDone(true)} />
      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}
      <VaultSealOverlay />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VaultSealProvider>
          <FavoritesProvider>
            <UserReviewsProvider>
              <VaultProvider>
                <OnboardingProvider>
                  <PriceAlertsProvider>
                    <AppShell />
                  </PriceAlertsProvider>
                </OnboardingProvider>
              </VaultProvider>
            </UserReviewsProvider>
          </FavoritesProvider>
        </VaultSealProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
