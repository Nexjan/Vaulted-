import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../data/listings';
import { useFavorites } from '../../lib/favorites';
import { getUniqueness } from '../../lib/uniqueness';
import { Listing } from '../../lib/types';
import { SkeletonBlock } from '../../components/Skeleton';
import { usePriceAlerts, getPriceDrop, PriceDrop } from '../../lib/priceAlerts';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

function VaultCard({ listing, index, drop }: { listing: Listing; index: number; drop: PriceDrop | null }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const uniqueness = getUniqueness(listing);
  const active = isFavorite(listing.id);

  const entranceScale = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0.93)).current;
  const entranceOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const imgOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  useEffect(() => {
    if (REDUCE_MOTION) return;
    Animated.parallel([
      Animated.spring(entranceScale, { toValue: 1, delay: index * 60, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.timing(entranceOpacity, { toValue: 1, delay: index * 60, duration: 280, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressIn = () => {
    if (REDUCE_MOTION) return;
    Animated.parallel([
      Animated.spring(tiltX, { toValue: 5, useNativeDriver: false, tension: 200, friction: 7 }),
      Animated.spring(tiltY, { toValue: -3, useNativeDriver: false, tension: 200, friction: 7 }),
      Animated.timing(glowOpacity, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  const onPressOut = () => {
    if (REDUCE_MOTION) return;
    Animated.parallel([
      Animated.spring(tiltX, { toValue: 0, useNativeDriver: false, tension: 200, friction: 7 }),
      Animated.spring(tiltY, { toValue: 0, useNativeDriver: false, tension: 200, friction: 7 }),
      Animated.timing(glowOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const rotateX = tiltX.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] });
  const rotateY = tiltY.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] });
  const serial = `VLT-${listing.id.replace(/\D/g, '').padStart(4, '0')}`;

  return (
    <Animated.View style={[styles.cardOuter, { opacity: entranceOpacity, transform: [{ scale: entranceScale }] }]}>
      <Pressable
        onPress={() => router.push(`/listing/${listing.id}`)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[styles.card, { transform: [{ perspective: 600 }, { rotateX }, { rotateY }] }]}>
          <View style={[styles.accentBar, drop && styles.accentBarDrop]} />
          <View style={styles.imageWrap}>
            <SkeletonBlock style={StyleSheet.absoluteFill} />
            <Animated.Image
              source={{ uri: listing.imageUrl }}
              style={[styles.cardImage, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={() => {
                if (REDUCE_MOTION) return;
                Animated.timing(imgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
              }}
            />
            <View style={styles.serialTag}>
              <Text style={styles.serialText}>{serial}</Text>
            </View>
            {drop && (
              <View style={styles.dropBadge}>
                <Text style={styles.dropBadgeText}>▼ {drop.pctOff}% PRICE DROP</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>{listing.title}</Text>
            <Text style={styles.cardLocation}>
              {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardRarity}>◆ {uniqueness.score}</Text>
              {drop ? (
                <View style={styles.priceGroup}>
                  <Text style={styles.cardPriceDrop}>
                    ${drop.live}<Text style={styles.cardUnit}>/nt</Text>
                  </Text>
                  <Text style={styles.priceWas}>${drop.lastSeen}</Text>
                </View>
              ) : (
                <Text style={styles.cardPrice}>
                  ${listing.pricePerNight}<Text style={styles.cardUnit}>/nt</Text>
                </Text>
              )}
              <Pressable
                onPress={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                hitSlop={8}
                style={styles.heartBtn}
              >
                <Ionicons name={active ? 'heart' : 'heart-outline'} size={16} color={active ? GOLD : MUTED} />
              </Pressable>
            </View>
          </View>
          <Animated.View pointerEvents="none" style={[styles.cardGlow, { opacity: glowOpacity }]} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function SavedScreen() {
  const { favoriteIds, isLoaded } = useFavorites();
  const { alerts, recordPrice, isLoaded: alertsLoaded } = usePriceAlerts();

  const vaulted = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id)),
    [favoriteIds],
  );

  const totalValue = vaulted.reduce((sum, l) => sum + l.pricePerNight, 0);

  useEffect(() => {
    if (!alertsLoaded) return;
    vaulted.forEach((listing) => recordPrice(listing.id, listing.pricePerNight));
  }, [vaulted, alertsLoaded]);

  const priceDrops = useMemo<Record<string, PriceDrop | null>>(() => {
    if (!alertsLoaded) return {};
    return Object.fromEntries(
      vaulted.map((listing) => {
        const lastSeen = alerts[listing.id];
        return [listing.id, lastSeen !== undefined ? getPriceDrop(listing, lastSeen) : null];
      }),
    );
  }, [vaulted, alerts, alertsLoaded]);

  const anyDrops = Object.values(priceDrops).some(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>THE{'\n'}VAULT</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{vaulted.length}</Text>
              <Text style={styles.statLabel}>STAYS VAULTED</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>${totalValue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>COMBINED $/NIGHT</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {anyDrops && isLoaded && (
          <View style={styles.dropBanner}>
            <Ionicons name="trending-down" size={13} color={GOLD} />
            <Text style={styles.dropBannerText}>A stay in your vault just dropped in price.</Text>
          </View>
        )}

        {isLoaded && vaulted.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="lock-closed-outline" size={36} color={GOLD} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>THE VAULT IS EMPTY</Text>
            <Text style={styles.emptyHint}>Tap the heart on any listing to vault it here.</Text>
          </View>
        ) : (
          <View style={styles.cards}>
            {vaulted.map((listing, i) => (
              <VaultCard
                key={listing.id}
                listing={listing}
                index={i}
                drop={priceDrops[listing.id] ?? null}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 48 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  wordmark: { fontSize: 56, fontWeight: '900', color: TEXT, letterSpacing: -2, lineHeight: 58, fontFamily: 'Georgia' },
  statsRow: { marginTop: 18, flexDirection: 'row', borderWidth: 1, borderColor: DIVIDER, borderRadius: 2 },
  statBox: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: GOLD, fontFamily: 'Georgia', letterSpacing: -0.5 },
  statLabel: { marginTop: 4, fontSize: 8, fontWeight: '700', color: MUTED, letterSpacing: 2 },
  statSep: { width: 1, backgroundColor: DIVIDER },
  divider: { height: 1, backgroundColor: DIVIDER },
  dropBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DIVIDER, backgroundColor: 'rgba(200,168,107,0.07)' },
  dropBannerText: { fontSize: 12, color: GOLD, fontWeight: '600', letterSpacing: 0.2 },
  cards: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  cardOuter: {},
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(200,168,107,0.14)', overflow: 'hidden' },
  accentBar: { height: 2, backgroundColor: GOLD },
  accentBarDrop: { backgroundColor: '#5DA87A' },
  imageWrap: { height: 175, backgroundColor: SURFACE },
  cardImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  serialTag: { position: 'absolute', bottom: 10, left: 12, backgroundColor: 'rgba(10,10,10,0.7)', paddingHorizontal: 8, paddingVertical: 4 },
  serialText: { fontSize: 8, fontWeight: '700', color: GOLD, letterSpacing: 2, fontFamily: 'Georgia' },
  dropBadge: { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(10,10,10,0.82)', borderWidth: 1, borderColor: '#5DA87A', paddingHorizontal: 8, paddingVertical: 4 },
  dropBadgeText: { fontSize: 8, fontWeight: '700', color: '#5DA87A', letterSpacing: 1.5 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: -0.3, fontFamily: 'Georgia' },
  cardLocation: { marginTop: 5, fontSize: 9, fontWeight: '600', color: MUTED, letterSpacing: 1.5 },
  cardMeta: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardRarity: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  cardPrice: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT, textAlign: 'right' },
  cardUnit: { fontSize: 10, fontWeight: '400', color: MUTED },
  priceGroup: { flex: 1, alignItems: 'flex-end', gap: 2 },
  cardPriceDrop: { fontSize: 15, fontWeight: '700', color: '#5DA87A' },
  priceWas: { fontSize: 10, color: MUTED, textDecorationLine: 'line-through' },
  heartBtn: { padding: 4 },
  cardGlow: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: 'rgba(200,168,107,0.65)' },
  empty: { paddingTop: 80, paddingHorizontal: 20, alignItems: 'center' },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 2.5 },
  emptyHint: { marginTop: 12, fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
});
