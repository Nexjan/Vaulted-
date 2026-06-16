import { useRef } from 'react';
import { Animated, Platform } from 'react-native';

export const REDUCE_MOTION: boolean =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

export function useTilt() {
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

  const webHandlers = !REDUCE_MOTION && Platform.OS === 'web' ? { onMouseMove, onMouseLeave } : {};

  const tiltStyle = REDUCE_MOTION ? {} : ({
    transform: [{ perspective: 800 }, { rotateX: rotXStr }, { rotateY: rotYStr }],
  } as any);

  return { webHandlers, tiltStyle, glow };
}
