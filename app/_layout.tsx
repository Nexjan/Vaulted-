import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '../lib/favorites';
import { UserReviewsProvider } from '../lib/userReviews';
import { VaultEntry } from '../components/VaultEntry';
import { VaultProvider, useVault } from '../lib/vaultContext';

function AppShell() {
  const { setVaultDone } = useVault();
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
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <UserReviewsProvider>
          <VaultProvider>
            <AppShell />
          </VaultProvider>
        </UserReviewsProvider>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
