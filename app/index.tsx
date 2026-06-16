import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { listings } from '../lib/listingsService';
import { sortByUniqueness, getUniqueness } from '../lib/uniqueness';
import { Listing } from '../lib/types';
import { SkeletonBlock } from '../components/Skeleton';
import { useAuth } from '../lib/auth';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  })();

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

const { height: WIN_H, width: WIN_W } = Dimensions.get('window');

const TOP_LISTINGS = sortByUniqueness(listings).slice(0, 4);
const HERO_IMG     = TOP_LISTINGS[0]?.imageUrls?.[0] ?? '';
// Dedicated atmospheric URL — decoupled from listings so a bad listing image can't bleed through.
const CLOSING_IMG  = 'https://loremflickr.com/800/600/ocean,night?lock=800';
const TOTAL_STAYS  = listings.length;

// ─── returning-user helpers ───────────────────────────────────────────────────
const VAULT_KEY = 'vaulted_entered';

function hasEnteredBefore(): boolean {
  if (Platform.OS !== 'web') return false;
  try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(VAULT_KEY); } catch { return false; }
}

function markEntered(): void {
  if (Platform.OS !== 'web') return;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(VAULT_KEY, '1'); } catch {}
}

// CSS passthrough for web scroll-snap (RN Web forwards unknown style keys to the DOM)
const WEB_SNAP_CONTAINER = Platform.OS === 'web' && !REDUCE_MOTION
  ? ({ scrollSnapType: 'y mandatory' } as any)
  : null;

const WEB_SNAP_CHAPTER = Platform.OS === 'web' && !REDUCE_MOTION
  ? ({ scrollSnapAlign: 'start' } as any)
  : null;

// ─── chapter reveal hook ─────────────────────────────────────────────────────
// Fires when scrollVal reaches ~70 % of the way toward chapterIndex * WIN_H
function useChapterReveal(chapterIndex: number, scrollVal: number) {
  const threshold = chapterIndex * WIN_H * 0.7;
  const anim  = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  const fired = useRef(REDUCE_MOTION);

  useEffect(() => {
    if (fired.current) return;
    if (scrollVal >= threshold) {
      fired.current = true;
      Animated.timing(anim, {
        toValue: 1, duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [scrollVal]);

  return anim;
}

// ─── 3-D tilt hook (web mouse-only) ─────────────────────────────────────────
function useTilt() {
  const rotX = useRef(new Animated.Value(0)).current;
  const rotY = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const rotXStr = rotX.interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] });
  const rotYStr = rotY.interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] });

  const onMouseMove = (e: any) => {
    if (REDUCE_MOTION) return;
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rx = (e.nativeEvent.clientX - rect.left) / rect.width - 0.5;
      const ry = (e.nativeEvent.clientY - rect.top) / rect.height - 0.5;
      rotY.setValue(rx * 16);
      rotX.setValue(-ry * 10);
      glow.setValue(Math.min(Math.sqrt(rx * rx + ry * ry) * 2, 0.9));
    } catch {}
  };

  const onMouseLeave = () => {
    if (REDUCE_MOTION) return;
    Animated.parallel([
      Animated.spring(rotX, { toValue: 0, useNativeDriver: false, tension: 100, friction: 12 }),
      Animated.spring(rotY, { toValue: 0, useNativeDriver: false, tension: 100, friction: 12 }),
      Animated.spring(glow, { toValue: 0, useNativeDriver: false, tension: 100, friction: 12 }),
    ]).start();
  };

  const webHandlers = !REDUCE_MOTION && Platform.OS === 'web'
    ? { onMouseMove, onMouseLeave }
    : {};

  const tiltStyle = REDUCE_MOTION
    ? {}
    : ({ transform: [{ perspective: 900 }, { rotateX: rotXStr }, { rotateY: rotYStr }] } as any);

  return { webHandlers, tiltStyle, glow };
}

// ─── root ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router                    = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [scrollVal, setScrollVal] = useState(0);
  // Synchronous — drives the skip-link style without blocking render.
  const isReturning = hasEnteredBefore();

  const enterApp = useCallback(() => {
    markEntered();
    router.push('/search');
  }, [router]);

  // Only logged-in users are auto-redirected — they have an active session and
  // don't need the cinematic. localStorage returning users get a prominent skip
  // link instead so the cinematic remains accessible (e.g. for devs iterating).
  useEffect(() => {
    if (authLoading || !user) return;
    router.replace('/search');
  }, [authLoading, user]);

  // On web: prevent document body from double-scrolling
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        style={[styles.root, WEB_SNAP_CONTAINER]}
        contentContainerStyle={styles.rootContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollVal(e.nativeEvent.contentOffset.y)}
      >
        <HeroChapter onEnter={enterApp} />
        <PhilosophyChapter scrollVal={scrollVal} />
        <CollectionChapter scrollVal={scrollVal} onEnter={enterApp} />
        <ClosingChapter scrollVal={scrollVal} onEnter={enterApp} />
      </ScrollView>
      {/* Persistent skip — fixed top-right, more prominent for returning users */}
      <SkipLink onPress={enterApp} isReturning={isReturning} />
    </View>
  );
}

// ─── CHAPTER 1 — HERO ────────────────────────────────────────────────────────
function HeroChapter({ onEnter }: { onEnter: () => void }) {
  const H     = WIN_H;
  const halfW = WIN_W / 2;

  const seamAlpha     = useRef(new Animated.Value(0)).current;
  const seamGlowAlpha = useRef(new Animated.Value(0)).current;
  const leftX         = useRef(new Animated.Value(0)).current;
  const rightX        = useRef(new Animated.Value(0)).current;
  const contentAlpha  = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  const contentY      = useRef(new Animated.Value(REDUCE_MOTION ? 0 : 28)).current;
  const imgAlpha      = useRef(new Animated.Value(0)).current;
  const hintAlpha     = useRef(new Animated.Value(REDUCE_MOTION ? 0.45 : 0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (REDUCE_MOTION) return;
    const E  = Easing.bezier(0.4, 0, 0.2, 1);
    const EO = Easing.bezier(0.0, 0, 0.4, 1);

    Animated.sequence([
      Animated.delay(380),
      Animated.timing(seamAlpha,     { toValue: 1, duration: 420, easing: E,  useNativeDriver: true }),
      Animated.timing(seamGlowAlpha, { toValue: 1, duration: 200, easing: E,  useNativeDriver: true }),
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(leftX,         { toValue: -(halfW + 8), duration: 720, easing: EO, useNativeDriver: true }),
        Animated.timing(rightX,        { toValue:   halfW + 8,  duration: 720, easing: EO, useNativeDriver: true }),
        Animated.timing(seamGlowAlpha, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(seamAlpha,     { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(60),
      Animated.parallel([
        Animated.timing(contentAlpha, { toValue: 1, duration: 620, easing: E, useNativeDriver: true }),
        Animated.timing(contentY,     { toValue: 0, duration: 620, easing: E, useNativeDriver: true }),
      ]),
      Animated.timing(hintAlpha, { toValue: 0.45, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (REDUCE_MOTION) return;
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, { toValue: 7, duration: 750, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
        ])
      ).start();
    }, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.chapter, { height: H, backgroundColor: BG }, WEB_SNAP_CHAPTER]}>
      <Animated.Image
        source={{ uri: HERO_IMG }}
        style={[StyleSheet.absoluteFill, { opacity: imgAlpha }]}
        resizeMode="cover"
        onLoad={() =>
          Animated.timing(imgAlpha, { toValue: 1, duration: 500, useNativeDriver: true }).start()
        }
      />
      <View style={styles.heroOverlay} />

      {/* Left door panel */}
      <Animated.View
        style={[styles.panel, styles.panelLeft, { width: halfW, transform: [{ translateX: leftX }] }]}
      >
        <View style={styles.panelOverlay} />
        <View style={styles.panelEdgeR} />
      </Animated.View>

      {/* Right door panel */}
      <Animated.View
        style={[styles.panel, styles.panelRight, { width: halfW, transform: [{ translateX: rightX }] }]}
      >
        <View style={styles.panelOverlay} />
        <View style={styles.panelEdgeL} />
      </Animated.View>

      {/* Gold centre seam */}
      <Animated.View
        style={[styles.seam,     { left: halfW - 1,  opacity: seamAlpha }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.seamGlow, { left: halfW - 14, opacity: seamGlowAlpha }]}
        pointerEvents="none"
      />

      {/* Hero copy */}
      <Animated.View
        style={[styles.heroContent, { opacity: contentAlpha, transform: [{ translateY: contentY }] }]}
        pointerEvents="box-none"
      >
        <Text style={styles.heroWordmark}>VAULTED</Text>
        <View style={styles.heroGoldLine} />
        <Text style={styles.heroTagline}>Not every stay. Only the rare ones.</Text>
        <EnterButton onPress={onEnter} style={{ marginTop: 40 }} />
      </Animated.View>

      {/* Scroll hint */}
      <Animated.View style={[styles.scrollHint, { opacity: hintAlpha, transform: [{ translateY: bounceY }] }]} pointerEvents="none">
        <Text style={styles.scrollHintText}>SCROLL TO DISCOVER</Text>
        <View style={styles.scrollHintLine} />
      </Animated.View>
    </View>
  );
}

// ─── CHAPTER 2 — PHILOSOPHY ───────────────────────────────────────────────────
function PhilosophyChapter({ scrollVal }: { scrollVal: number }) {
  const reveal = useChapterReveal(1, scrollVal);
  const ty = reveal.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <View style={[styles.chapter, { height: WIN_H, backgroundColor: BG }, WEB_SNAP_CHAPTER]}>
      <Animated.View style={[styles.philoInner, { opacity: reveal, transform: [{ translateY: ty }] }]}>
        <Text style={styles.eyebrow}>THE PHILOSOPHY</Text>

        <Text style={styles.philoPull}>
          Most travel sites{'\n'}show you everything.
        </Text>

        <View style={styles.philoDivider} />

        <Text style={styles.philoCounter}>
          We show you what's{'\n'}worth finding.
        </Text>

        <View style={styles.philoDivider} />

        <Text style={styles.philoBody}>
          Every listing earns a rarity score. Lighthouses.{'\n'}
          Cave houses. Windmills. Treehouses perched over{'\n'}
          nowhere. If it defies the ordinary, it belongs here.
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── CHAPTER 3 — COLLECTION ───────────────────────────────────────────────────
function CollectionChapter({
  scrollVal,
  onEnter,
}: {
  scrollVal: number;
  onEnter: () => void;
}) {
  const reveal = useChapterReveal(2, scrollVal);
  const ty     = reveal.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const router = useRouter();

  const isWide = WIN_W > 700;
  const cols   = isWide ? 4 : 2;
  const hPad   = 20;
  const gap    = 10;
  const maxW   = Math.min(WIN_W, 1280);
  const cardW  = (maxW - hPad * 2 - gap * (cols - 1)) / cols;

  return (
    <View style={[styles.chapter, { minHeight: WIN_H, backgroundColor: SURFACE }, WEB_SNAP_CHAPTER]}>
      <Animated.View
        style={[styles.collInner, { opacity: reveal, transform: [{ translateY: ty }] }]}
      >
        <Text style={[styles.eyebrow, { marginBottom: 28 }]}>FROM THE COLLECTION</Text>
        <View style={styles.collGrid}>
          {TOP_LISTINGS.map((listing) => (
            <CollectionCard
              key={listing.id}
              listing={listing}
              width={cardW}
              onPress={() => router.push(`/listing/${listing.id}`)}
            />
          ))}
        </View>
        <Pressable style={styles.collLink} onPress={onEnter}>
          <Text style={styles.collLinkText}>See all {TOTAL_STAYS} stays →</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function CollectionCard({
  listing,
  width,
  onPress,
}: {
  listing: Listing;
  width: number;
  onPress: () => void;
}) {
  const { webHandlers, tiltStyle, glow } = useTilt();
  const uniqueness = getUniqueness(listing);
  const imgAlpha   = useRef(new Animated.Value(0)).current;

  return (
    <Pressable style={{ width }} onPress={onPress} {...(webHandlers as any)}>
      {({ pressed }) => (
        <Animated.View style={[styles.card, tiltStyle, pressed && styles.cardPressed]}>
          <View style={styles.cardImg}>
            <SkeletonBlock style={StyleSheet.absoluteFill} />
            <Animated.Image
              source={{ uri: listing.imageUrls[0] }}
              style={[StyleSheet.absoluteFill, { opacity: imgAlpha }]}
              resizeMode="cover"
              onLoad={() =>
                Animated.timing(imgAlpha, { toValue: 1, duration: 350, useNativeDriver: true }).start()
              }
            />
            <View style={styles.cardImgOverlay} />
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>◆ {uniqueness.score}</Text>
            </View>
          </View>
          <View style={styles.cardCaption}>
            <Text style={styles.cardName} numberOfLines={1}>{listing.name}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
            </Text>
          </View>
          <Animated.View style={[styles.cardGlow, { opacity: glow }]} pointerEvents="none" />
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─── CHAPTER 4 — CLOSING / ENTRY ──────────────────────────────────────────────
function ClosingChapter({
  scrollVal,
  onEnter,
}: {
  scrollVal: number;
  onEnter: () => void;
}) {
  const reveal   = useChapterReveal(3, scrollVal);
  const ty       = reveal.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const imgAlpha = useRef(new Animated.Value(0)).current;

  return (
    <View
      style={[
        styles.chapter,
        { height: WIN_H, backgroundColor: BG },
        WEB_SNAP_CHAPTER,
      ]}
    >
      {/* Atmospheric background — gives depth vs the pure-black hero */}
      <Animated.Image
        source={{ uri: CLOSING_IMG }}
        style={[StyleSheet.absoluteFill, { opacity: imgAlpha }]}
        resizeMode="cover"
        onLoad={() =>
          Animated.timing(imgAlpha, { toValue: 1, duration: 900, useNativeDriver: true }).start()
        }
      />
      <View style={styles.closingOverlay} />

      <Animated.View style={[styles.closingInner, { opacity: reveal, transform: [{ translateY: ty }] }]}>
        {/* Smaller, refined wordmark — deliberately different from the 76px hero */}
        <Text style={styles.closingWordmark}>VAULTED</Text>
        <View style={styles.closingGoldLine} />
        <Text style={styles.closingTagline}>Your collection awaits.</Text>
        <EnterButton onPress={onEnter} style={{ marginTop: 44 }} label="OPEN THE VAULT" />
        <Text style={styles.closingTrust}>A curated collection · {TOTAL_STAYS} rare stays</Text>
        <View style={styles.legalRow}>
          <Pressable hitSlop={8}><Text style={styles.legalLink}>Privacy Policy</Text></Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable hitSlop={8}><Text style={styles.legalLink}>Terms</Text></Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable hitSlop={8}><Text style={styles.legalLink}>Cookie Policy</Text></Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── persistent skip link (fixed top-right across all chapters) ──────────────
function SkipLink({ onPress, isReturning }: { onPress: () => void; isReturning: boolean }) {
  // On web we can use position:fixed via RN Web's unknown-prop passthrough so
  // the link stays pinned to the viewport regardless of scroll position.
  const posStyle = Platform.OS === 'web'
    ? ({ position: 'fixed', top: 20, right: 24, zIndex: 200 } as any)
    : { position: 'absolute', top: 20, right: 24, zIndex: 200 };

  return (
    <Pressable onPress={onPress} hitSlop={14} style={posStyle}>
      {({ pressed }) => (
        <Text style={[
          styles.skipLinkText,
          isReturning && styles.skipLinkReturning,
          pressed && { opacity: 0.5 },
        ]}>
          {isReturning ? 'Skip intro →' : 'Enter the Vault →'}
        </Text>
      )}
    </Pressable>
  );
}

// ─── shared CTA button ────────────────────────────────────────────────────────
function EnterButton({ onPress, style, label = 'ENTER THE VAULT' }: { onPress: () => void; style?: object; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cta, style, pressed && styles.ctaPressed]}
    >
      <Text style={styles.ctaText}>{label}</Text>
    </Pressable>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  rootContent: {},

  chapter: {
    width: '100%',
    overflow: 'hidden',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  closingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.80)',
  },
  panel: {
    position: 'absolute',
    top: 0, bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#0E0E0E',
  },
  panelLeft:  { left: 0 },
  panelRight: { right: 0 },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  panelEdgeR: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, width: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panelEdgeL: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, width: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  seam: {
    position: 'absolute', top: 0, bottom: 0,
    width: 2, backgroundColor: GOLD,
  },
  seamGlow: {
    position: 'absolute', top: 0, bottom: 0,
    width: 28, backgroundColor: GOLD, opacity: 0.18,
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroWordmark: {
    fontSize: 76,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -3,
    fontFamily: 'Georgia',
    textAlign: 'center',
  },
  heroGoldLine: {
    width: 44, height: 1,
    backgroundColor: GOLD,
    marginTop: 20, marginBottom: 18,
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(245,243,239,0.88)',
    textAlign: 'center',
    letterSpacing: 0.2,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  scrollHint: {
    position: 'absolute',
    bottom: 36, left: 0, right: 0,
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 1.5,
    opacity: 0.75,
  },
  skipLinkReturning: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 1,
  },
  scrollHintText: {
    fontSize: 8,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 3,
  },
  scrollHintLine: {
    marginTop: 10,
    width: 1.5, height: 36,
    backgroundColor: GOLD,
    borderRadius: 1,
  },

  // ── CTA button (shared) ───────────────────────────────────────────────────
  cta: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    backgroundColor: GOLD,
    borderRadius: 1,
  },
  ctaPressed: { opacity: 0.78 },
  ctaText: {
    fontSize: 11,
    fontWeight: '800',
    color: BG,
    letterSpacing: 2.5,
  },

  // ── Philosophy ────────────────────────────────────────────────────────────
  philoInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 3.5,
    marginBottom: 40,
  },
  philoPull: {
    fontSize: 42,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 52,
    fontFamily: 'Georgia',
    letterSpacing: -1,
  },
  philoDivider: {
    height: 1,
    width: 52,
    backgroundColor: GOLD,
    opacity: 0.4,
    marginVertical: 32,
  },
  philoCounter: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(245,243,239,0.82)',
    lineHeight: 42,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
  },
  philoBody: {
    fontSize: 15,
    color: MUTED,
    lineHeight: 26,
    letterSpacing: 0.2,
  },

  // ── Collection ────────────────────────────────────────────────────────────
  collInner: {
    paddingVertical: 64,
    paddingHorizontal: 20,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  collGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    backgroundColor: BG,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.88 },
  cardImg: {
    width: '100%',
    aspectRatio: 2 / 3,
    overflow: 'hidden',
  },
  cardImgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  cardBadge: {
    position: 'absolute',
    bottom: 10, left: 10,
    backgroundColor: 'rgba(10,10,10,0.78)',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
  cardCaption: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.85)',
  },
  collLink: {
    marginTop: 28,
    alignSelf: 'flex-start',
  },
  collLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 0.4,
    textDecorationLine: 'underline',
  },

  // ── Closing ───────────────────────────────────────────────────────────────
  closingInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  closingWordmark: {
    fontSize: 46,
    fontWeight: '700',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -1,
  },
  closingGoldLine: {
    width: 44, height: 1,
    backgroundColor: GOLD,
    marginTop: 22, marginBottom: 22,
  },
  closingTagline: {
    fontSize: 26,
    color: 'rgba(245,243,239,0.88)',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    letterSpacing: 0.2,
    lineHeight: 34,
  },
  closingTrust: {
    marginTop: 24,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1,
  },
  legalRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalLink: {
    fontSize: 10,
    color: MUTED,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 10,
    color: MUTED,
  },
});
