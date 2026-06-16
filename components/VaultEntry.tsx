import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const GOLD = '#C8A86B';
const BG = '#0A0A0A';
const PANEL = '#0E0E0E';

// ─── session tracking ──────────────────────────────────────────────────────
let _mobileHasPlayed = false;

function alreadyPlayed(): boolean {
  if (Platform.OS === 'web') {
    try { return typeof window !== 'undefined' && sessionStorage.getItem('vaulted:entry') === '1'; }
    catch { return false; }
  }
  return _mobileHasPlayed;
}

function markPlayed() {
  if (Platform.OS === 'web') {
    try { sessionStorage.setItem('vaulted:entry', '1'); } catch {}
  } else {
    _mobileHasPlayed = true;
  }
}

function reducedMotion(): boolean {
  if (Platform.OS !== 'web') return false;
  try { return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

// ─── component ─────────────────────────────────────────────────────────────
interface Props { onDone: () => void; }

export function VaultEntry({ onDone }: Props) {
  const skip = useRef(alreadyPlayed() || reducedMotion()).current;
  const [active, setActive] = useState(!skip);

  // Capture dimensions at mount — stable for the ~1.5s animation
  const W = useRef(Dimensions.get('window').width).current;

  const wordmarkAlpha  = useRef(new Animated.Value(0)).current;
  const seamAlpha      = useRef(new Animated.Value(0)).current;
  const seamGlowAlpha  = useRef(new Animated.Value(0)).current;
  const leftX          = useRef(new Animated.Value(0)).current;
  const rightX         = useRef(new Animated.Value(0)).current;
  const rootAlpha      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (skip) { onDone(); return; }

    const EASE     = Easing.bezier(0.4, 0, 0.2, 1);
    const EASE_OUT = Easing.bezier(0.0, 0, 0.4, 1); // heavy inertia at start, clears fast

    Animated.sequence([
      // 1 — brand materialises
      Animated.timing(wordmarkAlpha, { toValue: 1, duration: 380, easing: EASE, useNativeDriver: true }),
      Animated.delay(320),
      // 2 — gold seam traces along the split
      Animated.timing(seamAlpha, { toValue: 1, duration: 460, easing: EASE, useNativeDriver: true }),
      // 3 — seam blooms with glow
      Animated.timing(seamGlowAlpha, { toValue: 1, duration: 200, easing: EASE, useNativeDriver: true }),
      Animated.delay(240),
      // 4 — vault doors swing open
      Animated.parallel([
        Animated.timing(leftX,  { toValue: -(W / 2 + 6), duration: 680, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(rightX, { toValue:   W / 2 + 6,  duration: 680, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(seamGlowAlpha, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(seamAlpha,     { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(wordmarkAlpha, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      // 5 — dissolve overlay
      Animated.timing(rootAlpha, { toValue: 0, duration: 280, easing: EASE, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) { markPlayed(); setActive(false); onDone(); }
    });
  }, []);

  const dismiss = () => {
    [seamAlpha, seamGlowAlpha, leftX, rightX, wordmarkAlpha, rootAlpha].forEach((v) => v.stopAnimation());
    Animated.timing(rootAlpha, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      markPlayed(); setActive(false); onDone();
    });
  };

  if (!active) return null;

  const halfW = W / 2;

  return (
    <Animated.View style={[styles.root, { opacity: rootAlpha }]}>
      <Pressable style={styles.fill} onPress={dismiss}>
        {/* ── Left door panel ── */}
        <Animated.View style={[styles.panelLeft, { width: halfW, transform: [{ translateX: leftX }] }]}>
          {/* inner-edge shadow gives depth when doors part */}
          <View style={styles.leftEdgeShadow} />
        </Animated.View>

        {/* ── Right door panel ── */}
        <Animated.View style={[styles.panelRight, { width: halfW, transform: [{ translateX: rightX }] }]}>
          <View style={styles.rightEdgeShadow} />
        </Animated.View>

        {/* ── Gold seam — thin line at the split ── */}
        <Animated.View
          style={[styles.seam, { left: halfW - 1, opacity: seamAlpha }]}
          pointerEvents="none"
        />
        {/* soft glow halo around seam */}
        <Animated.View
          style={[styles.seamGlow, { left: halfW - 14, opacity: seamGlowAlpha }]}
          pointerEvents="none"
        />

        {/* ── Wordmark ── */}
        <Animated.View style={[styles.brandWrap, { opacity: wordmarkAlpha }]} pointerEvents="none">
          <Text style={styles.brandText}>VAULTED</Text>
          <View style={styles.taglineLine} />
          <Text style={styles.taglineText}>A CURATED COLLECTION</Text>
        </Animated.View>

        {/* ── Skip hint ── */}
        <View style={styles.skipWrap} pointerEvents="none">
          <Text style={styles.skipText}>TAP TO SKIP</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: BG,
  },
  fill: {
    flex: 1,
  },

  // ── Door panels ──────────────────────────────
  panelLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: PANEL,
  },
  leftEdgeShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 20,
    // dark gradient at the inner edge — multiple layered views approximate it
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  panelRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: PANEL,
  },
  rightEdgeShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  // ── Seam ─────────────────────────────────────
  seam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: GOLD,
  },
  seamGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: GOLD,
    opacity: 0.18,
  },

  // ── Brand ────────────────────────────────────
  brandWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F5F3EF',
    fontFamily: 'Georgia',
    letterSpacing: -1,
  },
  taglineLine: {
    width: 32,
    height: 1,
    backgroundColor: GOLD,
    marginTop: 14,
    marginBottom: 10,
  },
  taglineText: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 3.5,
  },

  // ── Skip ─────────────────────────────────────
  skipWrap: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(200,168,107,0.4)',
    letterSpacing: 2.5,
  },
});
