import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '../lib/favorites';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="listing/[id]"
            options={{ title: '', headerTransparent: true, headerTintColor: '#222' }}
          />
        </Stack>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
