import { useCallback, useRef, useState } from 'react';
import {
  Animated, Easing, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../lib/listingsService';
import { Listing } from '../../lib/types';
import { getUniqueness } from '../../lib/uniqueness';
import { formatPrice } from '../../lib/currency';
import { useCurrency } from '../../lib/currencyContext';
import { useFavorites } from '../../lib/favorites';
import { SkeletonBlock } from '../../components/Skeleton';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

const BG   = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';

// Bias strongly toward rarer stays (score 90+ gets 10× weight)
function pick(pool: Listing[], excludeId: string | null): Listing {
  const eligible = pool.filter((l) => l.id !== excludeId);
  const weights  = eligible.map((l) => {
    const sc = getUniqueness(l).score;
    return sc >= 90 ? 10 : sc >= 80 ? 5 : sc >= 70 ? 2 : 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

export default function SurpriseScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { displayCurrency } = useCurrency();

  const [listing, setListing] = useState<Listing>(() => pick(listings, null));
  const [busy, setBusy]       = useState(false);

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentSlideY  = useRef(new Animated.Value(0)).current;
  const imgOpacity     = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  const imgSlideY      = useRef(new Animated.Value(REDUCE_MOTION ? 0 : 20)).current;

  const uniqueness = getUniqueness(listing);
  const saved      = isFavorite(listing.id);

  const reroll = useCallback(() => {
    if (busy) return;
    setBusy(true);

    if (REDUCE_MOTION) {
      setListing(pick(listings, listing.id));
      setBusy(false);
      return;
    }

    // Phase 1 — fade out current
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0,   duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(contentSlideY,  { toValue: -22, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(imgOpacity,     { toValue: 0,   duration: 240, useNativeDriver: true }),
    ]).start(() => {
      const next = pick(listings, listing.id);
      imgSlideY.setValue(24);
      contentSlideY.setValue(18);
      setListing(next);

      // Phase 2 — fade in new
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(contentSlideY,  { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(imgOpacity,     { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(imgSlideY,      { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setBusy(false));
    });
  }, [listing.id, busy]);

  return (
    <View style={s.container}>
      {/* Background photo */}
      <SkeletonBlock style={StyleSheet.absoluteFill} />
      <Animated.Image
        source={{ uri: listing.imageUrls[0] }}
        style={[s.image, { opacity: imgOpacity, transform: [{ translateY: imgSlideY }] }]}
        resizeMode="cover"
        onLoad={() => {
          if (REDUCE_MOTION) { imgOpacity.setValue(1); return; }
          Animated.parallel([
            Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(imgSlideY,  { toValue: 0, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]).start();
        }}
      />

      {/* Cinematic overlays */}
      <View style={s.overlayTop} />
      <View style={s.overlayBottom} />

      {/* Top HUD — wordmark + rarity badge */}
      <SafeAreaView style={s.topHud} edges={['top']}>
        <Animated.View style={[s.topRow, { opacity: contentOpacity }]}>
          <Text style={s.wordmark}>VAULTED</Text>
          <View style={s.rarityBadge}>
            <Text style={s.rarityText}>◆ {uniqueness.score}/100</Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Bottom content */}
      <SafeAreaView style={s.bottomHud} edges={['bottom']}>
        <Animated.View
          style={[s.bottomContent, {
            opacity: contentOpacity,
            transform: [{ translateY: contentSlideY }],
          }]}
        >
          <Text style={s.eyebrow}>
            {listing.propertyType.toUpperCase()} · {listing.city.toUpperCase()}, {listing.country.toUpperCase()}
          </Text>
          <Text style={s.title} numberOfLines={2}>{listing.name}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>
              {formatPrice(listing.pricePerNight, listing.currency, displayCurrency)}
              <Text style={s.priceUnit}> /night</Text>
            </Text>
            <Pressable onPress={() => toggleFavorite(listing.id)} hitSlop={10} style={s.heartBtn}>
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={26}
                color={saved ? GOLD : TEXT}
              />
            </Pressable>
          </View>

          <View style={s.ctaStack}>
            <Pressable
              style={[s.rerollBtn, busy && s.btnOff]}
              onPress={reroll}
              disabled={busy}
            >
              <Text style={s.rerollBtnText}>SHOW ME ANOTHER</Text>
            </Pressable>
            <Pressable
              style={s.detailsBtn}
              onPress={() => router.push(`/listing/${listing.id}`)}
            >
              <Text style={s.detailsBtnText}>VIEW DETAILS →</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  image: { ...StyleSheet.absoluteFillObject },

  overlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  overlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 320,
    backgroundColor: 'rgba(0,0,0,0.74)',
  },

  topHud:  { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  wordmark: {
    fontSize: 13,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: 1,
    opacity: 0.75,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.5)',
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },

  bottomHud: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomContent: { paddingHorizontal: 24, paddingBottom: 12 },

  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(200,168,107,0.8)',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  price:     { fontSize: 20, fontWeight: '800', color: TEXT },
  priceUnit: { fontSize: 12, fontWeight: '400', color: 'rgba(245,243,239,0.5)' },
  heartBtn:  { padding: 4 },

  ctaStack: { gap: 8, marginBottom: 4 },

  rerollBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff:       { opacity: 0.45 },
  rerollBtnText: { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 3 },

  detailsBtn:     { paddingVertical: 12, alignItems: 'center' },
  detailsBtnText: { fontSize: 10, fontWeight: '700', color: 'rgba(245,243,239,0.55)', letterSpacing: 2.5 },
});
