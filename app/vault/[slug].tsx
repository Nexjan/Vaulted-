import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { listings as allListings } from '../../lib/listingsService';
import { getUniqueness } from '../../lib/uniqueness';
import type { Listing } from '../../lib/types';
import { SkeletonBlock } from '../../components/Skeleton';
import { formatPrice } from '../../lib/currency';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const SURFACE = '#141414';
const DIVIDER = '#1E1E1E';

function GalleryCard({ listing, index }: { listing: Listing; index: number }) {
  const router = useRouter();
  const uniqueness = getUniqueness(listing);
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceScale   = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, { toValue: 1, duration: 300, delay: index * 55, useNativeDriver: true }),
      Animated.spring(entranceScale,   { toValue: 1, delay: index * 55, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[s.cardOuter, { opacity: entranceOpacity, transform: [{ scale: entranceScale }] }]}>
      <Pressable style={s.card} onPress={() => router.push(`/listing/${listing.id}`)}>
        {/* Gold top bar */}
        <View style={s.accentBar} />

        {/* Image */}
        <View style={s.imageWrap}>
          <SkeletonBlock style={StyleSheet.absoluteFill} />
          <Animated.Image
            source={{ uri: listing.imageUrls[0] }}
            style={[StyleSheet.absoluteFill, { opacity: imgOpacity }]}
            resizeMode="cover"
            onLoad={() =>
              Animated.timing(imgOpacity, { toValue: 1, duration: 360, useNativeDriver: true }).start()
            }
          />
          {/* Rarity badge */}
          <View style={s.rarityBadge}>
            <Text style={s.rarityText}>◆ {uniqueness.score}/100</Text>
          </View>
          {/* Uniqueness label */}
          <View style={s.labelBadge}>
            <Text style={s.labelText}>{uniqueness.label.toUpperCase()}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>{listing.name}</Text>
          <Text style={s.cardLocation}>
            {listing.city.toUpperCase()} · {listing.country.toUpperCase()} · {listing.propertyType.toUpperCase()}
          </Text>
          <View style={s.cardMeta}>
            <Text style={s.cardPrice}>
              {formatPrice(listing.pricePerNight, listing.currency)}
              <Text style={s.cardUnit}> /night</Text>
            </Text>
            <View style={s.viewCta}>
              <Text style={s.viewCtaText}>VIEW →</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PublicVaultScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router   = useRouter();

  const [displayName, setDisplayName]   = useState('');
  const [vaulted, setVaulted]           = useState<Listing[]>([]);
  const [state, setState]               = useState<'loading' | 'notfound' | 'ready'>('loading');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      // RLS: only rows with is_public = true are returned here
      const { data: row } = await supabase
        .from('shared_vaults')
        .select('user_id, display_name')
        .eq('slug', slug)
        .eq('is_public', true)
        .maybeSingle();

      if (!row) { setState('notfound'); return; }
      setDisplayName(row.display_name);

      // RLS: vault_items_public_read policy allows this for users with a public vault
      const { data: items } = await supabase
        .from('vault_items')
        .select('listing_id')
        .eq('user_id', row.user_id);

      const ids = new Set((items ?? []).map((r: { listing_id: string }) => r.listing_id));
      const matched = allListings
        .filter((l) => ids.has(l.id))
        .sort((a, b) => getUniqueness(b).score - getUniqueness(a).score);

      setVaulted(matched);
      setState('ready');
    })();
  }, [slug]);

  if (state === 'loading') {
    return (
      <View style={s.loadingCenter}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  if (state === 'notfound') {
    return (
      <SafeAreaView style={s.notFoundCenter} edges={['top']}>
        <Ionicons name="lock-closed" size={32} color={GOLD} />
        <Text style={s.notFoundTitle}>VAULT NOT FOUND</Text>
        <Text style={s.notFoundHint}>This vault is private or the link has changed.</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>← GO BACK</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalValue = vaulted.reduce((sum, l) => sum + l.pricePerNight, 0);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Nav back */}
        <Pressable style={s.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={14} color={GOLD} />
          <Text style={s.backText}>BACK</Text>
        </Pressable>

        {/* Header */}
        <View style={s.header}>
          <View style={s.publicBadge}>
            <Text style={s.publicBadgeText}>◆ PUBLIC VAULT</Text>
          </View>
          <Text style={s.wordmark} numberOfLines={2}>{displayName.toUpperCase()}</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{vaulted.length}</Text>
              <Text style={s.statLabel}>STAYS CURATED</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statBox}>
              <Text style={s.statValue}>${totalValue.toLocaleString()}</Text>
              <Text style={s.statLabel}>COMBINED $/NIGHT</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Gallery */}
        {vaulted.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="lock-closed-outline" size={28} color={GOLD} />
            <Text style={s.emptyText}>THIS VAULT IS EMPTY</Text>
          </View>
        ) : (
          <View style={s.cards}>
            {vaulted.map((listing, i) => (
              <GalleryCard key={listing.id} listing={listing} index={i} />
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLabel}>CURATED ON</Text>
          <Text style={s.footerWordmark}>VAULTED</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  scroll:       { paddingBottom: 64 },
  loadingCenter: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  notFoundCenter: {
    flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40,
  },
  notFoundTitle: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 3 },
  notFoundHint:  { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
  backBtn:       { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: GOLD },
  backBtnText:   { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2.5 },

  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  backText: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 2 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  publicBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(200,168,107,0.4)',
    marginBottom: 14,
  },
  publicBadgeText: { fontSize: 8, fontWeight: '700', color: GOLD, letterSpacing: 2.5 },
  wordmark: {
    fontSize: 44, fontWeight: '900', color: TEXT,
    fontFamily: 'Georgia', letterSpacing: -1.5, lineHeight: 48, marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: DIVIDER, borderRadius: 2,
  },
  statBox:  { flex: 1, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: GOLD, fontFamily: 'Georgia', letterSpacing: -0.5 },
  statLabel: { marginTop: 4, fontSize: 8, fontWeight: '700', color: MUTED, letterSpacing: 2 },
  statSep:   { width: 1, backgroundColor: DIVIDER },

  divider: { height: 1, backgroundColor: DIVIDER },

  cards:    { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  cardOuter: {},
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: 'rgba(200,168,107,0.14)',
    overflow: 'hidden',
  },
  accentBar: { height: 2, backgroundColor: GOLD },
  imageWrap: { height: 190 },
  rarityBadge: {
    position: 'absolute', top: 10, right: 12,
    backgroundColor: 'rgba(10,10,10,0.76)',
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(200,168,107,0.4)',
  },
  rarityText:  { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 1.5 },
  labelBadge:  {
    position: 'absolute', bottom: 10, left: 12,
    backgroundColor: 'rgba(10,10,10,0.7)',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  labelText:   { fontSize: 8, fontWeight: '700', color: GOLD, letterSpacing: 2 },
  cardBody:    { padding: 14 },
  cardTitle:   { fontSize: 17, fontWeight: '800', color: TEXT, fontFamily: 'Georgia', letterSpacing: -0.3 },
  cardLocation: { marginTop: 5, fontSize: 9, fontWeight: '600', color: MUTED, letterSpacing: 1.5 },
  cardMeta:    { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice:   { fontSize: 16, fontWeight: '700', color: TEXT },
  cardUnit:    { fontSize: 10, fontWeight: '400', color: MUTED },
  viewCta: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(200,168,107,0.35)',
  },
  viewCtaText: { fontSize: 8, fontWeight: '700', color: GOLD, letterSpacing: 2.5 },

  emptyState:   { paddingTop: 72, alignItems: 'center', gap: 14 },
  emptyText:    { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 2.5 },

  footer:       { marginTop: 48, alignItems: 'center', gap: 4 },
  footerLabel:  { fontSize: 7, fontWeight: '700', color: 'rgba(85,85,85,0.4)', letterSpacing: 3 },
  footerWordmark: { fontSize: 11, fontWeight: '900', color: 'rgba(85,85,85,0.5)', letterSpacing: 4, fontFamily: 'Georgia' },
});
