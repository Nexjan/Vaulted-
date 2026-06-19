import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingPrefs, OnboardingVibeId, markOnboardingSessionDone } from '../lib/onboarding';

const BG = '#0A0A0A';
const TEXT = '#F5F3EF';
const GOLD = '#C8A86B';
const MUTED = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

export interface OnboardingModalProps {
  onDone: (prefs: OnboardingPrefs | null) => void;
}

type StepOption = {
  label: string;
  sub: string;
  vibeIds?: OnboardingVibeId[];
  maxPrice?: number | null;
};

type Step = {
  question: string;
  options: StepOption[];
};

const STEPS: Step[] = [
  {
    question: "What's your\nvibe?",
    options: [
      { label: 'Remote & Wild', sub: 'Forests, off-grid, stargazing', vibeIds: ['remote', 'offgrid'] },
      { label: 'Over Water', sub: 'Houseboats, lighthouses, ocean', vibeIds: ['overwater'] },
      { label: 'Cozy Retreat', sub: 'Cabins, fireplaces, hot tubs', vibeIds: ['cozy'] },
      { label: 'Architectural', sub: 'Domes, converted spaces, design', vibeIds: ['architectural'] },
    ],
  },
  {
    question: "What's your\nbudget per night?",
    options: [
      { label: 'Under $150', sub: 'Hidden gems and great value', maxPrice: 150 },
      { label: 'Under $250', sub: 'Balanced price and rarity', maxPrice: 250 },
      { label: 'Under $400', sub: 'Premium experiences', maxPrice: 400 },
      { label: 'No limit', sub: 'Show me everything rare', maxPrice: null },
    ],
  },
  {
    question: 'What type\nof stay?',
    options: [
      { label: 'Wild & Unique', sub: 'Treehouses, yurts, geodesic domes', vibeIds: ['remote'] },
      { label: 'On the Water', sub: 'Floating homes, coastal retreats', vibeIds: ['overwater'] },
      { label: 'Dramatic Views', sub: 'Castles, lighthouses, panoramas', vibeIds: ['views'] },
      { label: 'Anything rare', sub: 'Show the full collection', vibeIds: [] },
    ],
  },
];

function OptionCard({ label, sub, onSelect }: { label: string; sub: string; onSelect: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const fillOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 70, useNativeDriver: true }),
      ]),
      Animated.timing(fillOpacity, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start(() => onSelect());
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.optionCard, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.optionFill, { opacity: fillOpacity }]} />
        <View style={styles.optionContent}>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionLabel}>{label}</Text>
            <Text style={styles.optionSub}>{sub}</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function OnboardingModal({ onDone }: OnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [accVibes, setAccVibes] = useState<OnboardingVibeId[]>([]);
  const [accMaxPrice, setAccMaxPrice] = useState<number | null>(null);

  const containerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(containerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (prefs: OnboardingPrefs | null) => {
    markOnboardingSessionDone();
    Animated.timing(containerOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
      onDone(prefs);
    });
  };

  const handleSelect = (opt: StepOption) => {
    const newVibes = opt.vibeIds ? [...accVibes, ...opt.vibeIds] : accVibes;
    const newMax = opt.maxPrice !== undefined ? opt.maxPrice : accMaxPrice;

    if (step >= STEPS.length - 1) {
      dismiss({ vibeIds: Array.from(new Set(newVibes)) as OnboardingVibeId[], maxPrice: newMax });
      return;
    }

    Animated.timing(contentOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setAccVibes(newVibes);
      setAccMaxPrice(newMax);
      setStep((s) => s + 1);
      Animated.timing(contentOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const cur = STEPS[step];

  return (
    <Animated.View style={[styles.overlay, { opacity: containerOpacity }]}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>

        {/* Skip */}
        <Pressable onPress={() => dismiss(null)} hitSlop={12} style={styles.skipBtn}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>

        <Animated.View style={[styles.body, { opacity: contentOpacity }]}>
          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{step + 1} OF {STEPS.length}</Text>
            <View style={styles.progressLine} />
          </View>

          {/* Question */}
          <Text style={styles.question}>{cur.question}</Text>

          {/* Options */}
          <View style={styles.options}>
            {cur.options.map((opt) => (
              <OptionCard
                key={opt.label}
                label={opt.label}
                sub={opt.sub}
                onSelect={() => handleSelect(opt)}
              />
            ))}
          </View>
        </Animated.View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: BG,
    zIndex: 100,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 20,
  },
  skipText: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2,
  },
  body: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
  },
  progressLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
  },
  question: {
    fontSize: 36,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 36,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.35)',
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  optionFill: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: GOLD,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  optionTextGroup: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.3,
  },
  optionSub: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.3,
  },
  optionArrow: {
    fontSize: 18,
    color: GOLD,
  },
});
