import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesProvider } from '../lib/favorites';
import { UserReviewsProvider } from '../lib/userReviews';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <UserReviewsProvider>
          <Stack screenOptions={{ headerShadowVisible: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="listing/[id]"
              options={{ title: '', headerTransparent: true, headerTintColor: '#F5F3EF' }}
            />
          </Stack>
        </UserReviewsProvider>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
