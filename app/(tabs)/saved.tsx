import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../data/listings';
import { useFavorites } from '../../lib/favorites';
import { getUniqueness } from '../../lib/uniqueness';
import { Listing } from '../../lib/types';

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';

export default function SavedScreen() {
  const { favoriteIds, isLoaded } = useFavorites();
  const router = useRouter();

  const saved = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id)),
    [favoriteIds],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.wordmark}>YOUR{'\n'}VAULT</Text>
              <View style={styles.headerMeta}>
                <Text style={styles.headerLabel}>
                  {saved.length > 0 ? `${saved.length} SAVED ${saved.length === 1 ? 'PROPERTY' : 'PROPERTIES'}` : 'SAVED PROPERTIES'}
                </Text>
                <View style={styles.headerLine} />
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        }
        renderItem={({ item, index }) => <SavedRow listing={item} number={index + 1} router={router} />}
        ListEmptyComponent={
          isLoaded ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>YOUR VAULT IS EMPTY</Text>
              <Text style={styles.emptyHint}>
                Tap the heart on any listing to save it here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function SavedRow({ listing, number, router }: { listing: Listing; number: number; router: ReturnType<typeof useRouter> }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const uniqueness = getUniqueness(listing);
  const active = isFavorite(listing.id);
  const num = String(number).padStart(2, '0');

  return (
    <View>
      <Pressable
        onPress={() => router.push(`/listing/${listing.id}`)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <Text style={styles.rowNumber}>{num}</Text>
        <Image source={{ uri: listing.imageUrl }} style={styles.rowImage} resizeMode="cover" />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>{listing.title}</Text>
          <Text style={styles.rowLocation}>
            {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
          </Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowRarity}>◆ {uniqueness.score}</Text>
            <Text style={styles.rowPrice}>
              ${listing.pricePerNight}
              <Text style={styles.rowUnit}>/nt</Text>
            </Text>
          </View>
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          hitSlop={8}
          style={styles.rowHeart}
        >
          <Ionicons name={active ? 'heart' : 'heart-outline'} size={16} color={active ? GOLD : MUTED} />
        </Pressable>
      </Pressable>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: 48,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  wordmark: {
    fontSize: 56,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -2,
    lineHeight: 58,
    fontFamily: 'Georgia',
  },
  headerMeta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Editorial rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: '#111111',
  },
  rowNumber: {
    width: 32,
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    fontFamily: 'Georgia',
    letterSpacing: -1,
    textAlign: 'right',
    opacity: 0.85,
  },
  rowImage: {
    width: 90,
    height: 68,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  rowLocation: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 7,
  },
  rowRarity: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
  },
  rowUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: MUTED,
  },
  rowHeart: {
    padding: 8,
  },

  // Empty state
  empty: {
    paddingTop: 72,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2.5,
  },
  emptyHint: {
    marginTop: 12,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
});
