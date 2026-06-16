import { createContext, ReactNode, useCallback, useContext, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

// Module-level defaults — safe because we never animate them without a real provider
const _av = new Animated.Value(0);

interface VaultSealCtx {
  triggerSeal: () => void;
  sealScale: Animated.Value;
  sealOpacity: Animated.Value;
  glowOpacity: Animated.Value;
  sealTranslateY: Animated.Value;
  shimmerX: Animated.Value;
}

const VaultSealContext = createContext<VaultSealCtx>({
  triggerSeal: () => {},
  sealScale: _av, sealOpacity: _av, glowOpacity: _av, sealTranslateY: _av, shimmerX: _av,
});

export function VaultSealProvider({ children }: { children: ReactNode }) {
  const sealScale      = useRef(new Animated.Value(0)).current;
  const sealOpacity    = useRef(new Animated.Value(0)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;
  const sealTranslateY = useRef(new Animated.Value(-18)).current;
  const shimmerX       = useRef(new Animated.Value(-60)).current;
  const running        = useRef(false);

  const triggerSeal = useCallback(() => {
    if (REDUCE_MOTION) return;
    if (running.current) return;
    running.current = true;

    sealScale.setValue(0);
    sealOpacity.setValue(0);
    glowOpacity.setValue(0);
    sealTranslateY.setValue(-18);
    shimmerX.setValue(-60);

    Animated.sequence([
      // 1 — stamp impact
      Animated.parallel([
        Animated.timing(sealScale,      { toValue: 1.18, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sealOpacity,    { toValue: 1,    duration: 100, useNativeDriver: true }),
        Animated.timing(glowOpacity,    { toValue: 0.7,  duration: 160, useNativeDriver: true }),
        Animated.timing(sealTranslateY, { toValue: 0,    duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // 2 — settle
      Animated.parallel([
        Animated.spring(sealScale,   { toValue: 1.0, useNativeDriver: true, tension: 200, friction: 14 }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 120, useNativeDriver: true }),
      ]),
      // 3 — shimmer sweep
      Animated.timing(shimmerX, { toValue: 150, duration: 220, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      // 4 — lift off
      Animated.parallel([
        Animated.timing(sealOpacity,  { toValue: 0,    duration: 220, useNativeDriver: true }),
        Animated.timing(glowOpacity,  { toValue: 0,    duration: 190, useNativeDriver: true }),
        Animated.timing(sealScale,    { toValue: 0.88, duration: 220, useNativeDriver: true }),
      ]),
    ]).start(() => { running.current = false; });
  }, []);

  return (
    <VaultSealContext.Provider
      value={{ triggerSeal, sealScale, sealOpacity, glowOpacity, sealTranslateY, shimmerX }}
    >
      {children}
    </VaultSealContext.Provider>
  );
}

export function useVaultSeal() {
  return useContext(VaultSealContext);
}
