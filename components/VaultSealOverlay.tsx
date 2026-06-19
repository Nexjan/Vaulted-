import { Animated, StyleSheet, Text, View } from 'react-native';
import { useVaultSeal } from '../lib/vaultSeal';

const GOLD  = '#C8A86B';
const PANEL = '#0E0E0E';
const SEAL  = 92;
const GLOW  = 152;

export function VaultSealOverlay() {
  const { sealScale, sealOpacity, glowOpacity, sealTranslateY, shimmerX } = useVaultSeal();

  return (
    <View pointerEvents="none" style={s.root}>
      {/* Ambient gold glow */}
      <Animated.View style={[s.glow, { opacity: glowOpacity }]} />

      {/* Stamp circle */}
      <Animated.View
        style={[s.seal, {
          opacity: sealOpacity,
          transform: [{ scale: sealScale }, { translateY: sealTranslateY }],
        }]}
      >
        {/* Shimmer sweep — clipped to circle */}
        <View style={s.shimmerClip}>
          <Animated.View
            style={[s.shimmerBar, { transform: [{ translateX: shimmerX }, { rotate: '15deg' }] }]}
          />
        </View>

        <Text style={s.diamond}>◆</Text>
        <Text style={s.label}>VAULTED</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8888,
    elevation: 8888,
  },
  glow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    backgroundColor: GOLD,
  },
  seal: {
    width: SEAL,
    height: SEAL,
    borderRadius: SEAL / 2,
    backgroundColor: PANEL,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerClip: {
    position: 'absolute',
    width: SEAL,
    height: SEAL,
    borderRadius: SEAL / 2,
    overflow: 'hidden',
  },
  shimmerBar: {
    position: 'absolute',
    top: -10,
    left: 0,
    width: 26,
    height: SEAL + 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  diamond: {
    fontSize: 22,
    color: GOLD,
    lineHeight: 26,
  },
  label: {
    fontSize: 7,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 3,
    marginTop: 3,
  },
});
