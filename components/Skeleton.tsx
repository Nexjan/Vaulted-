import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const REDUCE_MOTION =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

const SHIMMER_W = 90;

interface Props {
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({ style }: Props) {
  const shimmerX = useRef(new Animated.Value(-SHIMMER_W)).current;
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    if (REDUCE_MOTION || containerW === 0) return;
    shimmerX.setValue(-SHIMMER_W);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: containerW + SHIMMER_W,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    );
    loop.start();
    return () => loop.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerW]);

  return (
    <View
      style={[styles.base, style]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerW(w);
      }}
    >
      {!REDUCE_MOTION && (
        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SHIMMER_W,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
});
