import { StyleSheet, Text, View } from 'react-native';
import { PriceHistory } from '../lib/priceHistory';

const TRACK_HEIGHT = 96;

interface Props {
  history: PriceHistory;
}

const TREND_COPY: Record<PriceHistory['trend'], (percent: number) => string> = {
  down: (percent) => `Down ${percent}% over the last 6 months — a good time to book.`,
  up: (percent) => `Up ${percent}% over the last 6 months — prices have been climbing.`,
  flat: (percent) => `Roughly stable over the last 6 months (±${percent}%).`,
};

const TREND_STYLE: Record<PriceHistory['trend'], { icon: string; color: string }> = {
  down: { icon: '↓', color: '#0a8a4a' },
  up: { icon: '↑', color: '#b23b3b' },
  flat: { icon: '→', color: '#717171' },
};

export function PriceHistoryChart({ history }: Props) {
  const { points, trend, changePercent } = history;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);

  const { icon, color } = TREND_STYLE[trend];
  const summary = TREND_COPY[trend](Math.round(Math.abs(changePercent)));

  return (
    <View>
      <View style={styles.summaryRow}>
        <Text style={[styles.trendIcon, { color }]}>{icon}</Text>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      <View style={styles.chart}>
        {points.map((point) => {
          const fraction = (point.price - min) / range;
          const barHeight = Math.round((0.22 + fraction * 0.78) * TRACK_HEIGHT);
          const isLatest = point === points[points.length - 1];

          return (
            <View key={point.label} style={styles.column}>
              <Text style={styles.value}>${point.price}</Text>
              <View style={styles.track}>
                <View style={[styles.bar, { height: barHeight }, isLatest && styles.barLatest]} />
              </View>
              <Text style={[styles.label, isLatest && styles.labelLatest]}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  trendIcon: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 11,
    fontWeight: '600',
    color: '#717171',
    marginBottom: 4,
  },
  track: {
    height: TRACK_HEIGHT,
    width: 18,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#d8d2ea',
  },
  barLatest: {
    backgroundColor: '#5b3cc4',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: '#9a9a9a',
  },
  labelLatest: {
    color: '#222',
    fontWeight: '700',
  },
});
