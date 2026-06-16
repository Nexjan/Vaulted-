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

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

const BG    = '#0A0A0A';
const TEXT  = '#F5F3EF';
const GOLD  = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

const TOP_LISTINGS = sortByUniqueness(listings).slice(0, 4);
const HERO_IMG     = TOP_LISTINGS[0]?.imageUrls?.[0] ?? '';
const TOTAL_STAYS  = listings.length;

// ─── tilt hook (web-only 3-D card effect) ────────────────────────────────────
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
    ? { onMouseMove, onMouseLeave } : {};
  const tiltStyle = REDUCE_MOTION ? {} : ({
    transform: [{ perspective: 900 }, { rotateX: rotXStr }, { rotateY: rotYStr }],
  } as any);

  return { webHandlers, tiltStyle, glow };
}

// ─── scroll-reveal hook ───────────────────────────────────────────────────
function useReveal(sectionY: number, scrollVal: number) {
  const anim  = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  const fired = useRef(REDUCE_MOTION);
  const winH  = Dimensions.get('window').height;

  useEffect(() => {
    if (fired.current || sectionY === 0) return;
    if (scrollVal + winH > sectionY + 80) {
      fired.current = true;
      Animated.timing(anim, {
        toValue: 1, duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [scrollVal, sectionY]);

  return anim;
}

// ─── root ─────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [scrollVal, setScrollVal] = useState(0);

  const enterApp = useCallback(() => router.push('/search'), [router]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.rootContent}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={(e) => setScrollVal(e.nativeEvent.contentOffset.y)}
    >
      <HeroSection onEnter={enterApp} />
      <StorySection scrollVal={scrollVal} />
      <CollectionSection scrollVal={scrollVal} onEnter={enterApp} />
      <ClosingSection scrollVal={scrollVal} onEnter={enterApp} />
    </ScrollView>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────────────
function HeroSection({ onEnter }: { onEnter: () => void }) {
  const H     = useRef(Dimensions.get('window').height).current;
  const W     = useRef(Dimensions.get('window').width).current;
  const halfW = W / 2;

  const seamAlpha      = useRef(new Animated.Value(0)).current;
  const seamGlowAlpha  = useRef(new Animated.Value(0)).current;
  const leftX          = useRef(new Animated.Value(0)).current;
  const rightX         = useRef(new Animated.Value(0)).current;
  const contentAlpha   = useRef(new Animated.Value(REDUCE_MOTION ? 1 : 0)).current;
  const contentY       = useRef(new Animated.Value(REDUCE_MOTION ? 0 : 28)).current;
  const imgAlpha       = useRef(new Animated.Value(0)).current;
  const hintAlpha      = useRef(new Animated.Value(REDUCE_MOTION ? 0.45 : 0)).current;

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
        Animated.timing(leftX,          { toValue: -(halfW + 8), duration: 720, easing: EO, useNativeDriver: true }),
        Animated.timing(rightX,         { toValue:   halfW + 8,  duration: 720, easing: EO, useNativeDriver: true }),
        Animated.timing(seamGlowAlpha,  { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(seamAlpha,      { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(60),
      Animated.parallel([
        Animated.timing(contentAlpha, { toValue: 1, duration: 620, easing: E, useNativeDriver: true }),
        Animated.timing(contentY,     { toValue: 0, duration: 620, easing: E, useNativeDriver: true }),
      ]),
      Animated.timing(hintAlpha, { toValue: 0.45, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.hero, { height: H }]}>
      {/* Listing image revealed behind the doors */}
      <Animated.Image
        source={{ uri: HERO_IMG }}
        style={[StyleSheet.absoluteFill, { opacity: imgAlpha }]}
        resizeMode="cover"
        onLoad={() =>
          Animated.timing(imgAlpha, { toValue: 1, duration: 500, useNativeDriver: true }).start()
        }
      />
      <View style={styles.heroOverlay} />

      {/* Left door */}
      <Animated.View style={[styles.panel, styles.panelLeft, { width: halfW, transform: [{ translateX: leftX }] }]}>
        <View style={styles.panelOverlay} />
        <View style={styles.panelEdgeR} />
      </Animated.View>

      {/* Right door */}
      <Animated.View style={[styles.panel, styles.panelRight, { width: halfW, transform: [{ translateX: rightX }] }]}>
        <View style={styles.panelOverlay} />
        <View style={styles.panelEdgeL} />
      </Animated.View>

      {/* Gold seam */}
      <Animated.View style={[styles.seam,     { left: halfW - 1, opacity: seamAlpha }]}     pointerEvents="none" />
      <Animated.View style={[styles.seamGlow, { left: halfW - 14, opacity: seamGlowAlpha }]} pointerEvents="none" />

      {/* Hero content */}
      <Animated.View
        style={[styles.heroContent, { opacity: contentAlpha, transform: [{ translateY: contentY }] }]}
        pointerEvents="box-none"
      >
        <Text style={styles.heroWordmark}>VAULTED</Text>
        <View style={styles.heroLine} />
        <Text style={styles.heroTagline}>Not every stay. Only the rare ones.</Text>
        <EnterButton onPress={onEnter} style={styles.heroCtaGap} />
      </Animated.View>

      {/* Scroll hint */}
      <Animated.View style={[styles.scrollHint, { opacity: hintAlpha }]} pointerEvents="none">
        <Text style={styles.scrollHintText}>SCROLL TO DISCOVER</Text>
        <View style={styles.scrollHintLine} />
      </Animated.View>
    </View>
  );
}

// ─── STORY ──────────────────────────────────────────────────────────────────────────
function StorySection({ scrollVal }: { scrollVal: number }) {
  const [sectionY, setSectionY] = useState(0);
  const reveal = useReveal(sectionY, scrollVal);
  const ty = reveal.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View
      style={[styles.story, { opacity: reveal, transform: [{ translateY: ty }] }]}
      onLayout={(e) => setSectionY(e.nativeEvent.layout.y)}
    >
      <Text style={styles.eyebrow}>THE STORY</Text>

      <Text style={styles.storyPull}>
        Most travel sites show you everything.
      </Text>

      <View style={styles.storyDivider} />

      <Text style={styles.storyPull}>
        We show you what’s worth finding — handpicked rare stays, scored by how unusual they are.
      </Text>

      <View style={styles.storyDivider} />

      <Text style={styles.storyBody}>
        Every listing earns a rarity score. Lighthouses. Cave houses. Windmills.
        Treehouses perched over nowhere. If it defies the ordinary, it belongs here.
      </Text>
    </Animated.View>
  );
}

// ─── COLLECTION ───────────────────────────────────────────────────────────────────
function CollectionSection({ scrollVal, onEnter }: { scrollVal: number; onEnter: () => void }) {
  const [sectionY, setSectionY] = useState(0);
  const reveal = useReveal(sectionY, scrollVal);
  const ty = reveal.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const router = useRouter();
  const W = Dimensions.get('window').width;
  const isWide = W > 700;
  const cols = isWide ? 4 : 2;
  const hPad = 20;
  const gap = 10;
  const cardW = (Math.min(W, 1280) - hPad * 2 - gap * (cols - 1)) / cols;

  return (
    <View style={styles.collOuter}>
      <Animated.View
        style={[styles.collInner, { opacity: reveal, transform: [{ translateY: ty }] }]}
        onLayout={(e) => setSectionY(e.nativeEvent.layout.y)}
      >
        <Text style={[styles.eyebrow, styles.collEyebrow]}>FROM THE COLLECTION</Text>
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
  const imgAlpha = useRef(new Animated.Value(0)).current;

  return (
    <Pressable style={{ width }} onPress={onPress} {...(webHandlers as any)}>
      {({ pressed }) => (
        <Animated.View style={[styles.card, tiltStyle, pressed && styles.cardPressed]}>
          {/* Image */}
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
          {/* Caption */}
          <View style={styles.cardCaption}>
            <Text style={styles.cardName} numberOfLines={1}>{listing.name}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {listing.city.toUpperCase()} · {listing.propertyType.toUpperCase()}
            </Text>
          </View>
          {/* Tilt glow border */}
          <Animated.View style={[styles.cardGlow, { opacity: glow }]} pointerEvents="none" />
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─── CLOSING ─────────────────────────────────────────────────────────────────────────
function ClosingSection({ scrollVal, onEnter }: { scrollVal: number; onEnter: () => void }) {
  const [sectionY, setSectionY] = useState(0);
  const reveal = useReveal(sectionY, scrollVal);
  const ty = reveal.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <Animated.View
      style={[styles.closing, { opacity: reveal, transform: [{ translateY: ty }] }]}
      onLayout={(e) => setSectionY(e.nativeEvent.layout.y)}
    >
      <Text style={styles.closingWordmark}>VAULTED</Text>
      <EnterButton onPress={onEnter} />
      <Text style={styles.closingTrust}>A curated collection · {TOTAL_STAYS} rare stays</Text>
      <View style={styles.legalRow}>
        <Pressable hitSlop={8}><Text style={styles.legalLink}>Privacy Policy</Text></Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable hitSlop={8}><Text style={styles.legalLink}>Terms</Text></Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable hitSlop={8}><Text style={styles.legalLink}>Cookie Policy</Text></Pressable>
      </View>
    </Animated.View>
  );
}

// ─── shared CTA button ────────────────────────────────────────────────────────────────────
function EnterButton({ onPress, style }: { onPress: () => void; style?: object }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cta, style, pressed && styles.ctaPressed]}
    >
      <Text style={styles.ctaText}>ENTER THE VAULT</Text>
    </Pressable>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  rootContent: {},

  // ── Hero ─────────────────────────────────────────────────────────────────────────
  hero: { backgroundColor: BG, overflow: 'hidden' },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },

  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#0E0E0E',
  },
  panelLeft:    { left: 0 },
  panelRight:   { right: 0 },
  panelOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.82)' },
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
    position: 'absolute',
    top: 0, bottom: 0,
    width: 2,
    backgroundColor: GOLD,
  },
  seamGlow: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 28,
    backgroundColor: GOLD,
    opacity: 0.18,
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
  heroLine: {
    width: 44,
    height: 1,
    backgroundColor: GOLD,
    marginTop: 20,
    marginBottom: 18,
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
  heroCtaGap: { marginTop: 40 },

  scrollHint: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollHintText: {
    fontSize: 8,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 3,
  },
  scrollHintLine: {
    marginTop: 10,
    width: 1,
    height: 30,
    backgroundColor: GOLD,
  },

  // ── CTA button (shared) ─────────────────────────────────────────────────────────
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

  // ── Story ───────────────────────────────────────────────────────────────────────
  story: {
    paddingHorizontal: 32,
    paddingVertical: 88,
    maxWidth: 740,
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
  storyPull: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 36,
    fontFamily: 'Georgia',
    letterSpacing: -0.4,
  },
  storyDivider: {
    height: 1,
    width: 56,
    backgroundColor: GOLD,
    opacity: 0.4,
    marginVertical: 28,
  },
  storyBody: {
    fontSize: 15,
    color: MUTED,
    lineHeight: 25,
    letterSpacing: 0.2,
    marginTop: 4,
  },

  // ── Collection ────────────────────────────────────────────────────────────────
  collOuter: { backgroundColor: SURFACE },
  collInner: {
    paddingVertical: 64,
    paddingHorizontal: 20,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  collEyebrow: { marginBottom: 28 },
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
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(10,10,10,0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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

  // ── Closing ────────────────────────────────────────────────────────────────────
  closing: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: BG,
  },
  closingWordmark: {
    fontSize: 38,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -1,
    marginBottom: 28,
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
