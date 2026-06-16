import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listings } from '../../data/listings';
import { ListingCard } from '../../components/ListingCard';
import { useFavorites } from '../../lib/favorites';

export default function SavedScreen() {
  const { favoriteIds, isLoaded } = useFavorites();

  const saved = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id)),
    [favoriteIds],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Saved stays</Text>
        <Text style={styles.subheading}>
          Tap the heart on any listing to bookmark it here for later — saved on this device.
        </Text>
      </View>

      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={
          isLoaded ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Nothing saved yet. Browse Search, Finds, or Best Deals and tap the heart on a listing to save it here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222',
  },
  subheading: {
    marginTop: 4,
    fontSize: 14,
    color: '#717171',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 16,
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
