import { StyleSheet, Text, View, ViewStyle } from 'react-native';

const TONE_COLORS: Record<string, { bg: string; fg: string }> = {
  rare: { bg: '#5b3cc4', fg: '#fff' },
  deal: { bg: '#0a8a4a', fg: '#fff' },
  neutral: { bg: '#222', fg: '#fff' },
};

interface Props {
  label: string;
  tone?: 'rare' | 'deal' | 'neutral';
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', style }: Props) {
  const colors = TONE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
