import { useMemo } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../data/listings';
import { sortByBestDeal } from '../../lib/pricing';
import { useFavorites } from '../../lib/favorites';
import { useTilt } from '../../hooks/useTilt';

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';

export default function DealsScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();

  const ranked = useMemo(
    () => sortByBestDeal(listings, listings).filter((item) => item.priceComparison.comparableCount > 0),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>BEST{'\n'}DEALS</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerLabel}>BELOW-AVERAGE PRICE · {ranked.length} PROPERTIES</Text>
            <View style={styles.headerLine} />
          </View>
        </View>

        <View style={styles.divider} />

        {ranked.map((item, i) => (
          <DealsRow
            key={item.id}
            item={item}
            index={i}
            router={router}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

function DealsRow({
  item, index, router, isFavorite, toggleFavorite,
}: {
  item: any;
  index: number;
  router: ReturnType<typeof useRouter>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}) {
  const { percentDiff, tier, comparableAverage } = item.priceComparison;
  const savings = Math.round(Math.abs(percentDiff));
  const active = isFavorite(item.id);
  const num = String(index + 1).padStart(2, '0');
  const { webHandlers, tiltStyle, glow } = useTilt();

  return (
    <View>
      <Pressable
        onPress={() => router.push(`/listing/${item.id}`)}
        style={styles.rowOuter}
        {...(webHandlers as any)}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.row, tiltStyle, pressed && styles.rowPressed]}>
            <Text style={styles.rowNumber}>{num}</Text>
            <Image source={{ uri: item.imageUrl }} style={styles.rowImage} resizeMode="cover" />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.rowLocation}>
                {item.city.toUpperCase()} · {item.propertyType.toUpperCase()}
              </Text>
              <View style={styles.rowMeta}>
                {tier === 'great-deal' ? (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{savings}% BELOW AVG</Text>
                  </View>
                ) : (
                  <Text style={styles.avgText}>${Math.round(comparableAverage)} avg</Text>
                )}
              </View>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowPrice}>${item.pricePerNight}<Text style={styles.rowUnit}>/nt</Text></Text>
              <Pressable
                onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                hitSlop={8}
                style={styles.rowHeart}
              >
                <Ionicons name={active ? 'heart' : 'heart-outline'} size={16} color={active ? GOLD : MUTED} />
              </Pressable>
            </View>
            <Animated.View pointerEvents="none" style={[styles.rowGlow, { opacity: glow }]} />
          </Animated.View>
        )}
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

  // Rows
  rowOuter: {},
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
  rowGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.6)',
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
    marginTop: 7,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  savingsText: {
    fontSize: 8,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1.5,
  },
  avgText: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0.5,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 6,
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
    padding: 4,
  },
});
