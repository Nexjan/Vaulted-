import { useEffect, useRef, useState } from 'react';
import {
  Animated, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { OnboardingPrefs, markOnboardingSessionDone } from '../lib/onboarding';
import { rankListings } from '../lib/quizMatching';
import { Listing, QuizAnswers } from '../lib/types';
import { getUniqueness } from '../lib/uniqueness';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

type DimKey = 'vibe' | 'setting' | 'moment' | 'group' | 'detail';
type Phase  = 'quiz' | 'loading' | 'reveal';

interface QuizOption { id: string; label: string; sub: string; }
interface Question   { dim: DimKey; question: string; options: QuizOption[]; }

const QUESTIONS: Question[] = [
  {
    dim: 'vibe',
    question: "What's your\nvibe?",
    options: [
      { id: 'remote-wild',   label: 'Remote & Wild',   sub: 'Forests, off-grid, stargazing'  },
      { id: 'over-water',    label: 'Over Water',       sub: 'Houseboats, lighthouses, ocean' },
      { id: 'cozy-retreat',  label: 'Cozy Retreat',     sub: 'Cabins, fireplaces, hot tubs'   },
      { id: 'architectural', label: 'Architectural',    sub: 'Domes, mirror homes, design'    },
    ],
  },
  {
    dim: 'setting',
    question: 'Where do you want\nto wake up?',
    options: [
      { id: 'desert-canyon',  label: 'Desert canyon',     sub: 'Red rock, silence, open sky'    },
      { id: 'deep-forest',    label: 'Deep forest',        sub: 'Trees, mist, birdsong'          },
      { id: 'mountains-snow', label: 'Mountains & snow',   sub: 'Alpine air, dramatic peaks'     },
      { id: 'lakeside',       label: 'Lakeside',           sub: 'Still water, reflections, calm' },
      { id: 'under-aurora',   label: 'Under the aurora',   sub: 'Northern lights, dark skies'    },
    ],
  },
  {
    dim: 'moment',
    question: "What's the moment\nyou're after?",
    options: [
      { id: 'stargazing',          label: 'Stargazing in silence',        sub: 'A sky full of stars, nothing else'  },
      { id: 'total-disconnection', label: 'Total disconnection',          sub: 'Off-grid, unhurried, present'       },
      { id: 'design-marvel',       label: "Design you can't stop\nstaring at", sub: 'Architecture as the experience' },
      { id: 'warm-cozy',           label: 'Warm and cozy nights',         sub: 'Fires, blankets, intimacy'          },
    ],
  },
  {
    dim: 'group',
    question: "Who's coming\nwith you?",
    options: [
      { id: 'solo',     label: 'Just me',                   sub: 'Solitude and self-discovery'      },
      { id: 'romantic', label: 'A romantic escape for two', sub: 'Intimate, private, unforgettable' },
      { id: 'friends',  label: 'Close friends',             sub: 'Shared memories and adventure'   },
      { id: 'family',   label: 'The whole family',          sub: 'Space for everyone'               },
    ],
  },
  {
    dim: 'detail',
    question: 'Pick your\nperfect detail',
    options: [
      { id: 'wall-of-glass',  label: 'A wall of glass to the wild', sub: 'Frame nature like a painting'  },
      { id: 'crackling-fire', label: 'A crackling fire inside',      sub: 'Warmth, glow, ambience'        },
      { id: 'deck-under-sky', label: 'A deck under the open sky',    sub: 'Stars overhead, coffee in hand'},
      { id: 'water-doorstep', label: 'Water at your doorstep',       sub: 'Steps to the lake or sea'      },
    ],
  },
];

export interface OnboardingModalProps {
  onDone: (prefs: OnboardingPrefs | null) => void;
}

export function OnboardingModal({ onDone }: OnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phase,         setPhase]         = useState<Phase>('quiz');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showShortlist, setShowShortlist] = useState(false);
  const [ranked,        setRanked]        = useState<(Listing & { quizScore: number })[]>([]);

  // Refs to avoid stale closures inside setTimeout chains
  const answersRef      = useRef<Partial<Record<DimKey, string>>>({});
  const questionIdxRef  = useRef(0);
  questionIdxRef.current = questionIndex;
  const advancingRef    = useRef(false);

  const containerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity   = useRef(new Animated.Value(1)).current;
  const shimmerOpacity   = useRef(new Animated.Value(0.35)).current;
  const shimmerLoop      = useRef<Animated.CompositeAnimation | null>(null);

  // Fade container in on mount
  useEffect(() => {
    Animated.timing(containerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shimmer pulse during loading
  useEffect(() => {
    if (phase === 'loading') {
      shimmerLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerOpacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
          Animated.timing(shimmerOpacity, { toValue: 0.25, duration: 650, useNativeDriver: true }),
        ])
      );
      shimmerLoop.current.start();
    } else {
      shimmerLoop.current?.stop();
    }
    return () => shimmerLoop.current?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const fadeOut = (duration: number, cb: () => void) =>
    Animated.timing(contentOpacity, { toValue: 0, duration, useNativeDriver: true }).start(cb);

  const fadeIn = (duration: number) =>
    Animated.timing(contentOpacity, { toValue: 1, duration, useNativeDriver: true }).start();

  const dismiss = (prefs: OnboardingPrefs | null) => {
    markOnboardingSessionDone();
    Animated.timing(containerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      onDone(prefs);
    });
  };

  const buildPrefs = (): OnboardingPrefs => ({
    vibeIds: [],
    maxPrice: null,
    quizAnswers: answersRef.current as QuizAnswers,
  });

  const handleAnswerSelect = (dim: DimKey, optId: string, optIndex: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setSelectedIndex(optIndex);

    setTimeout(() => {
      fadeOut(180, () => {
        const newAnswers = { ...answersRef.current, [dim]: optId };
        answersRef.current = newAnswers;
        setSelectedIndex(null);

        if (questionIdxRef.current < QUESTIONS.length - 1) {
          setQuestionIndex(questionIdxRef.current + 1);
          advancingRef.current = false;
          fadeIn(240);
        } else {
          // Last answer — compute ranking and enter loading phase
          const fullAnswers = newAnswers as QuizAnswers;
          const result = rankListings(fullAnswers);
          setRanked(result);
          setPhase('loading');
          fadeIn(300);

          setTimeout(() => {
            fadeOut(220, () => {
              setPhase('reveal');
              fadeIn(500);
            });
          }, 1500);
        }
      });
    }, 380);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/listing/${id}`);
    dismiss(buildPrefs());
  };

  const handleReserve = (bookingUrl: string) => {
    Linking.openURL(bookingUrl).catch(() => {});
  };

  const topMatch   = ranked[0];
  const shortlist  = ranked.slice(1, 4);
  const cur        = QUESTIONS[questionIndex];

  return (
    <Animated.View style={[styles.overlay, { opacity: containerOpacity }]}>
      {/* ── Fixed header: progress + skip ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {phase === 'quiz' && (
          <View style={styles.progressTrack}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  i <= questionIndex ? styles.progressSegActive : styles.progressSegInactive,
                ]}
              />
            ))}
          </View>
        )}
        <View style={styles.skipRow}>
          {phase !== 'reveal' && (
            <Pressable onPress={() => dismiss(null)} hitSlop={12}>
              <Text style={styles.skipText}>SKIP</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={phase === 'reveal'}
        bounces={phase === 'reveal'}
      >
        <Animated.View style={{ opacity: contentOpacity }}>

          {/* ── QUIZ PHASE ── */}
          {phase === 'quiz' && (
            <View style={styles.quizBody}>
              <Text style={styles.stepHint}>{questionIndex + 1} of {QUESTIONS.length}</Text>
              <Text style={styles.question}>{cur.question}</Text>
              <View style={styles.options}>
                {cur.options.map((opt, i) => {
                  const isSelected = selectedIndex === i;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => handleAnswerSelect(cur.dim, opt.id, i)}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    >
                      <View style={styles.optionInner}>
                        <View style={styles.optionTexts}>
                          <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                            {opt.label}
                          </Text>
                          <Text style={[styles.optionSub, isSelected && styles.optionSubSelected]}>
                            {opt.sub}
                          </Text>
                        </View>
                        <Text style={[styles.optionArrow, isSelected && styles.optionArrowSelected]}>→</Text>
                      </View>
                      {isSelected && <View style={styles.goldUnderline} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── LOADING PHASE ── */}
          {phase === 'loading' && (
            <View style={styles.loadingBody}>
              <View style={styles.loadingInner}>
                <View style={styles.loadingLineTop} />
                <Animated.Text style={[styles.loadingText, { opacity: shimmerOpacity }]}>
                  Curating your match…
                </Animated.Text>
                <View style={styles.loadingLineBottom} />
              </View>
            </View>
          )}

          {/* ── REVEAL PHASE ── */}
          {phase === 'reveal' && topMatch && (
            <RevealScreen
              topMatch={topMatch}
              shortlist={shortlist}
              showShortlist={showShortlist}
              onToggleShortlist={() => setShowShortlist(s => !s)}
              onViewDetails={handleViewDetails}
              onReserve={handleReserve}
              onClose={() => dismiss(buildPrefs())}
            />
          )}

        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

// ─── Reveal screen sub-component ─────────────────────────────────────────────

function RevealScreen({
  topMatch, shortlist, showShortlist,
  onToggleShortlist, onViewDetails, onReserve, onClose,
}: {
  topMatch: Listing & { quizScore: number };
  shortlist: (Listing & { quizScore: number })[];
  showShortlist: boolean;
  onToggleShortlist: () => void;
  onViewDetails: (id: string) => void;
  onReserve: (url: string) => void;
  onClose: () => void;
}) {
  const u = getUniqueness(topMatch);

  return (
    <View style={styles.revealBody}>
      {/* Label */}
      <View style={styles.revealLabelRow}>
        <View style={styles.revealLabelLine} />
        <Text style={styles.revealLabel}>YOUR VAULT MATCH</Text>
        <View style={styles.revealLabelLine} />
      </View>

      {/* Hero image */}
      <Image
        source={{ uri: topMatch.imageUrls[0] }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* Name + meta */}
      <View style={styles.revealInfo}>
        <Text style={styles.revealName}>{topMatch.name}</Text>
        <Text style={styles.revealLocation}>
          {topMatch.propertyType.toUpperCase()} · {topMatch.city}, {topMatch.country}
        </Text>
        <View style={styles.rarityRow}>
          <Text style={styles.rarityText}>◆ {u.score}</Text>
          <Text style={styles.rarityLabel}>{u.label.toUpperCase()}</Text>
        </View>
        <Text style={styles.revealDesc} numberOfLines={3}>{topMatch.description}</Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctaBlock}>
        <Pressable
          onPress={() => onReserve(topMatch.bookingUrl)}
          style={({ pressed }) => [styles.ctaPrimary, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaPrimaryText}>RESERVE THIS STAY</Text>
        </Pressable>
        <Pressable
          onPress={() => onViewDetails(topMatch.id)}
          style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.ctaSecondaryText}>VIEW DETAILS →</Text>
        </Pressable>
      </View>

      {/* Shortlist */}
      {shortlist.length > 0 && (
        <View style={styles.shortlistBlock}>
          <View style={styles.divider} />
          <Pressable onPress={onToggleShortlist} style={styles.shortlistToggle}>
            <Text style={styles.shortlistToggleText}>
              {showShortlist ? 'Hide matches ↑' : 'See more matches →'}
            </Text>
          </Pressable>

          {showShortlist && (
            <View>
              {shortlist.map((item, idx) => {
                const su = getUniqueness(item);
                return (
                  <View key={item.id}>
                    <Pressable
                      onPress={() => onViewDetails(item.id)}
                      style={({ pressed }) => [styles.shortlistRow, pressed && styles.shortlistRowPressed]}
                    >
                      <Text style={styles.shortlistNum}>{String(idx + 2).padStart(2, '0')}</Text>
                      <Image source={{ uri: item.imageUrls[0] }} style={styles.shortlistThumb} resizeMode="cover" />
                      <View style={styles.shortlistInfo}>
                        <Text style={styles.shortlistName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.shortlistType}>{item.propertyType.toUpperCase()} · {item.city}</Text>
                        <Text style={styles.shortlistRarity}>◆ {su.score} · {su.label}</Text>
                      </View>
                      <Text style={styles.shortlistArrow}>→</Text>
                    </Pressable>
                    <View style={styles.divider} />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Close */}
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeText}>CLOSE</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: BG,
    zIndex: 100,
  },

  // Fixed header
  header: {
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  progressSeg: {
    flex: 1,
    height: 1,
  },
  progressSegActive: {
    backgroundColor: GOLD,
  },
  progressSegInactive: {
    backgroundColor: DIVIDER,
  },
  skipRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  skipText: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2.5,
  },

  // Scrollable body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },

  // Quiz
  quizBody: {
    paddingTop: 16,
  },
  stepHint: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
    marginBottom: 20,
  },
  question: {
    fontSize: 38,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
    lineHeight: 44,
    marginBottom: 36,
  },
  options: {
    gap: 10,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.22)',
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: GOLD,
    backgroundColor: 'rgba(200,168,107,0.06)',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  optionTexts: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  optionLabelSelected: {
    color: GOLD,
  },
  optionSub: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.2,
  },
  optionSubSelected: {
    color: 'rgba(200,168,107,0.65)',
  },
  optionArrow: {
    fontSize: 16,
    color: MUTED,
    marginLeft: 12,
  },
  optionArrowSelected: {
    color: GOLD,
  },
  goldUnderline: {
    height: 1,
    backgroundColor: GOLD,
    marginHorizontal: 20,
    marginBottom: 1,
  },

  // Loading
  loadingBody: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingInner: {
    alignItems: 'center',
    gap: 20,
  },
  loadingLineTop: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(200,168,107,0.4)',
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '400',
    color: GOLD,
    fontFamily: 'Georgia',
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  loadingLineBottom: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(200,168,107,0.4)',
  },

  // Reveal
  revealBody: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  revealLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  revealLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER,
  },
  revealLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 3,
  },
  heroImage: {
    width: '100%',
    height: 260,
    marginBottom: 0,
  },
  revealInfo: {
    paddingTop: 24,
    paddingBottom: 8,
    gap: 6,
  },
  revealName: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  revealLocation: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  rarityLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
    opacity: 0.75,
  },
  revealDesc: {
    fontSize: 13,
    color: 'rgba(245,243,239,0.6)',
    lineHeight: 20,
    marginTop: 10,
  },

  // CTAs
  ctaBlock: {
    gap: 12,
    marginTop: 28,
    marginBottom: 8,
  },
  ctaPrimary: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: BG,
    letterSpacing: 2.5,
  },
  ctaSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.3)',
  },
  ctaSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },

  // Shortlist
  shortlistBlock: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
  },
  shortlistToggle: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  shortlistToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
  },
  shortlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  shortlistRowPressed: {
    backgroundColor: '#111111',
  },
  shortlistNum: {
    width: 24,
    fontSize: 16,
    fontWeight: '900',
    color: GOLD,
    fontFamily: 'Georgia',
    textAlign: 'right',
    opacity: 0.7,
  },
  shortlistThumb: {
    width: 72,
    height: 56,
  },
  shortlistInfo: {
    flex: 1,
    gap: 3,
  },
  shortlistName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.1,
  },
  shortlistType: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 1.5,
  },
  shortlistRarity: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  shortlistArrow: {
    fontSize: 14,
    color: MUTED,
  },

  // Close
  closeBtn: {
    marginTop: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 2.5,
  },
});
