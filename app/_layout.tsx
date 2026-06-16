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
import type { OnboardingPrefs } from '../lib/onboarding';

function AppShell() {
  const { setVaultDone, vaultDone } = useVault();
  const { savePrefs } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!vaultDone) return;
    if (!isOnboardingSessionDone()) setShowOnboarding(true);
  }, [vaultDone]);

  const handleOnboardingDone = (prefs: OnboardingPrefs | null) => {
    if (prefs) savePrefs(prefs);
    setShowOnboarding(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="listing/[id]"
          options={{ title: '', headerTransparent: true, headerTintColor: '#F5F3EF' }}
        />
      </Stack>
      <VaultEntry onDone={() => setVaultDone(true)} />
      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
