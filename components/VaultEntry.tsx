import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const VAULT_BG_URI = 'data:image/jpeg;base64,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';

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
        {/* ── Left door panel — left half of vault image ── */}
        <Animated.View style={[styles.panelLeft, { width: halfW, transform: [{ translateX: leftX }] }]}>
          <Image source={{ uri: VAULT_BG_URI }} style={[styles.panelImg, { width: W, left: 0 }]} resizeMode="cover" />
          <View style={styles.panelOverlay} />
          <View style={styles.leftEdgeShadow} />
        </Animated.View>

        {/* ── Right door panel — right half of vault image ── */}
        <Animated.View style={[styles.panelRight, { width: halfW, transform: [{ translateX: rightX }] }]}>
          <Image source={{ uri: VAULT_BG_URI }} style={[styles.panelImg, { width: W, right: 0 }]} resizeMode="cover" />
          <View style={styles.panelOverlay} />
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
    overflow: 'hidden',
    backgroundColor: PANEL,
  },
  panelImg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  panelOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  leftEdgeShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panelRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: PANEL,
  },
  rightEdgeShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
