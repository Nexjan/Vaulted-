import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listings } from '../../lib/listingsService';
import { useFavorites } from '../../lib/favorites';
import { getUniqueness } from '../../lib/uniqueness';
import { Listing } from '../../lib/types';
import { formatPrice } from '../../lib/currency';
import { SkeletonBlock } from '../../components/Skeleton';
import { usePriceAlerts, getPriceDrop, PriceDrop } from '../../lib/priceAlerts';
import { useAuth } from '../../lib/auth';
import { useSharedVault, SharedVault } from '../../lib/sharedVault';

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

interface SharePanelProps {
  vault: SharedVault | null;
  svLoading: boolean;
  saving: boolean;
  error: string | null;
  setPublic: (isPublic: boolean, displayName?: string) => Promise<void>;
}

function SharePanel({ vault, svLoading, saving, error, setPublic }: SharePanelProps) {
  const { user } = useAuth();
  const [nameInput, setNameInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (vault?.display_name) setNameInput(vault.display_name);
  }, [vault?.display_name]);

  if (!user || svLoading) return null;

  const isPublic = vault?.is_public ?? false;

  const shareUrl = vault?.slug
    ? (typeof window !== 'undefined'
        ? `${window.location.origin}/vault/${vault.slug}`
        : `https://vaultedstays.com/vault/${vault.slug}`)
    : null;

  const handleToggle = () => setPublic(!isPublic);

  const handleCopy = async () => {
    if (!shareUrl) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) setPublic(isPublic, nameInput.trim());
  };

  return (
    <View style={sp.container}>
      <Pressable style={sp.toggleRow} onPress={handleToggle} disabled={saving}>
        <View style={{ flex: 1 }}>
          <Text style={sp.toggleLabel}>SHARE VAULT</Text>
          {isPublic && (
            <Text style={sp.toggleSub}>Anyone with the link can browse your collection</Text>
          )}
        </View>
        <View style={[sp.pill, isPublic && sp.pillOn]}>
          <Text style={[sp.pillText, isPublic && sp.pillTextOn]}>
            {saving ? '…' : isPublic ? 'PUBLIC' : 'PRIVATE'}
          </Text>
        </View>
      </Pressable>

      {!!error && (
        <View style={sp.errorRow}>
          <Text style={sp.errorText}>{error}</Text>
        </View>
      )}

      {isPublic && (
        <View style={sp.expanded}>
          <Text style={sp.fieldLabel}>VAULT NAME</Text>
          <View style={sp.nameRow}>
            <TextInput
              style={sp.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="My Vault"
              placeholderTextColor={MUTED}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <Pressable style={sp.saveBtn} onPress={handleSaveName}>
              <Text style={sp.saveBtnText}>SAVE</Text>
            </Pressable>
          </View>

          {shareUrl && (
            <>
              <Text style={[sp.fieldLabel, { marginTop: 16 }]}>SHAREABLE LINK</Text>
              <View style={sp.linkRow}>
                <Text style={sp.linkText} numberOfLines={1} selectable>{shareUrl}</Text>
                <Pressable style={sp.copyBtn} onPress={handleCopy}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={13}
                    color={GOLD}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={sp.copyBtnText}>{copied ? 'COPIED' : 'COPY'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function VaultCard({ listing, index, drop }: { listing: Listing; index: number; drop: PriceDrop | null }) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const uniqueness = getUniqueness(listing);
  const active = isFavorite(listing.id);

  // Entrance: scale + opacity (native driver)
  const entranceScale = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0.93)).current;
  const entranceOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  // 3D tilt + glow (non-native driver)
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Image fade (native driver)
  const imgOpacity = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;

  useEffect(() => {
    if (REDUCE_MOTION) return;
    Animated.parallel([
      Animated.spring(entranceScale, {
        toValue: 1,
        delay: index * 60,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(entranceOpacity, {
        toValue: 1,
        delay: index * 60,
        duration: 280,
        useNativeDriver: true,
      }),
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

          {/* Gold accent bar */}
          <View style={[styles.accentBar, drop && styles.accentBarDrop]} />

          {/* Image */}
          <View style={styles.imageWrap}>
            <SkeletonBlock style={StyleSheet.absoluteFill} />
            <Animated.Image
              source={{ uri: listing.imageUrls[0] }}
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

          {/* Body */}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>{listing.name}</Text>
            <Text style={styles.cardLocation}>
              {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardRarity}>◆ {uniqueness.score}</Text>
              {drop ? (
                <View style={styles.priceGroup}>
                  <Text style={styles.cardPriceDrop}>
                    {formatPrice(drop.live, listing.currency)}<Text style={styles.cardUnit}>/nt</Text>
                  </Text>
                  <Text style={styles.priceWas}>{formatPrice(drop.lastSeen, listing.currency)}</Text>
                </View>
              ) : (
                <Text style={styles.cardPrice}>
                  {formatPrice(listing.pricePerNight, listing.currency)}<Text style={styles.cardUnit}>/nt</Text>
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

          {/* Gold glow edge on tilt */}
          <Animated.View pointerEvents="none" style={[styles.cardGlow, { opacity: glowOpacity }]} />

        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function SavedScreen() {
  const { favoriteIds, isLoaded } = useFavorites();
  const { alerts, recordPrice, isLoaded: alertsLoaded } = usePriceAlerts();
  const { vault: sharedVault, loading: svLoading, saving: svSaving, error: svError, setPublic, refresh: refreshVault } = useSharedVault();
  const [refreshing, setRefreshing] = useState(false);

  const vaulted = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id)),
    [favoriteIds],
  );

  const totalValue = vaulted.reduce((sum, l) => sum + l.pricePerNight, 0);

  // Record base price the first time each item is seen in the vault
  useEffect(() => {
    if (!alertsLoaded) return;
    vaulted.forEach((listing) => recordPrice(listing.id, listing.pricePerNight));
  }, [vaulted, alertsLoaded]);

  // Compute price drops for display
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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshVault();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
      >

        {/* Header */}
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

        {/* Share vault panel (logged-in only) */}
        <SharePanel
          vault={sharedVault}
          svLoading={svLoading}
          saving={svSaving}
          error={svError}
          setPublic={setPublic}
        />

        <View style={styles.divider} />

        {/* Price-drop banner */}
        {anyDrops && isLoaded && (
          <View style={styles.dropBanner}>
            <Ionicons name="trending-down" size={13} color={GOLD} />
            <Text style={styles.dropBannerText}>A stay in your vault just dropped in price.</Text>
          </View>
        )}

        {/* Cards or empty state */}
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
    paddingBottom: 20,
  },
  wordmark: {
    fontSize: 56,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -2,
    lineHeight: 58,
    fontFamily: 'Georgia',
  },
  statsRow: {
    marginTop: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: DIVIDER,
    borderRadius: 2,
  },
  statBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: GOLD,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
  },
  statSep: {
    width: 1,
    backgroundColor: DIVIDER,
  },

  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Price-drop banner
  dropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    backgroundColor: 'rgba(200,168,107,0.07)',
  },
  dropBannerText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Cards layout
  cards: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },

  // VaultCard
  cardOuter: {},
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.14)',
    overflow: 'hidden',
  },
  accentBar: {
    height: 2,
    backgroundColor: GOLD,
  },
  accentBarDrop: {
    backgroundColor: '#5DA87A',
  },
  imageWrap: {
    height: 175,
    backgroundColor: SURFACE,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  serialTag: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(10,10,10,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  serialText: {
    fontSize: 8,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
    fontFamily: 'Georgia',
  },
  dropBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderWidth: 1,
    borderColor: '#5DA87A',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#5DA87A',
    letterSpacing: 1.5,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.3,
    fontFamily: 'Georgia',
  },
  cardLocation: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
  },
  cardMeta: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardRarity: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  cardPrice: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'right',
  },
  cardUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: MUTED,
  },
  priceGroup: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  cardPriceDrop: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5DA87A',
  },
  priceWas: {
    fontSize: 10,
    color: MUTED,
    textDecorationLine: 'line-through',
  },
  heartBtn: {
    padding: 4,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(200,168,107,0.65)',
  },

  // Empty state
  empty: {
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
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
    fontStyle: 'italic',
  },
});

const sp = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: DIVIDER,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 2,
  },
  toggleSub: {
    marginTop: 4,
    fontSize: 11,
    color: MUTED,
    fontStyle: 'italic',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: MUTED,
  },
  pillOn: {
    borderColor: GOLD,
    backgroundColor: 'rgba(200,168,107,0.08)',
  },
  pillText: {
    fontSize: 8,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
  },
  pillTextOn: {
    color: GOLD,
  },
  errorRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 10,
    color: '#E05C5C',
    letterSpacing: 0.5,
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: DIVIDER,
    paddingHorizontal: 12,
    color: TEXT,
    fontSize: 13,
    backgroundColor: '#0D0D0D',
  },
  saveBtn: {
    paddingHorizontal: 14,
    height: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },
  saveBtnText: {
    fontSize: 8,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DIVIDER,
    overflow: 'hidden',
  },
  linkText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    color: MUTED,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: DIVIDER,
    backgroundColor: 'rgba(200,168,107,0.06)',
  },
  copyBtnText: {
    fontSize: 8,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },
});
