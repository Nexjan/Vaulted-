import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';

export default function CookiesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.backRow} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={14} color={GOLD} />
            <Text style={s.backText}>BACK</Text>
          </Pressable>
          <Text style={s.wordmark}>VAULTED</Text>
          <View style={s.goldLine} />
          <Text style={s.pageTitle}>Cookie Policy</Text>
          <Text style={s.lastUpdated}>Last updated: June 17, 2026</Text>
        </View>

        <View style={s.divider} />

        {/* Body */}
        <View style={s.body}>

          <Text style={s.intro}>
            This Cookie Policy explains how Vaulted uses cookies and similar tracking technologies when you visit vaultedstays.com. It also explains your choices for managing them.
          </Text>

          <Section title="1. What Are Cookies?">
            <Para>Cookies are small text files placed on your device by a website. They allow the site to remember information about your visit — such as your login session or preferences — making the experience faster and more consistent. Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (stored until they expire or you delete them).</Para>
          </Section>

          <Section title="2. How Vaulted Uses Cookies">
            <Para>We use cookies for three primary purposes:</Para>

            <CookieCard
              category="Essential / Authentication"
              purpose="Supabase Authentication uses cookies to maintain your login session. Without these cookies, you would be signed out every time you navigate to a new page."
              provider="Supabase"
              canDisable={false}
            />
            <CookieCard
              category="Functionality"
              purpose="We store lightweight preferences (such as onboarding state and UI settings) in your browser's local storage or as session cookies to make the experience consistent across visits."
              provider="Vaulted"
              canDisable={false}
            />
            <CookieCard
              category="Affiliate Tracking"
              purpose="When you click a booking link, Travelpayouts places a tracking cookie on your device to attribute any resulting reservation to Vaulted. This is how affiliate commissions are measured. The cookie does not collect personally identifiable information beyond the referral event."
              provider="Travelpayouts / booking partners (Booking.com, Vrbo, Agoda)"
              canDisable={true}
            />
          </Section>

          <Section title="3. Third-Party Cookies">
            <Para>Third-party services we use — Supabase, Travelpayouts, and booking partners — may also set their own cookies governed by their respective privacy and cookie policies. We do not control the cookies set by these third parties once you have left Vaulted or clicked a partner link.</Para>
            <BulletList items={[
              'Supabase — authentication and database infrastructure.',
              'Travelpayouts — travel affiliate network for tracking booking referrals.',
              'Booking.com, Vrbo, Agoda — booking partners; their cookies apply when you visit their sites.',
            ]} />
          </Section>

          <Section title="4. Your Choices">
            <Para>You can control cookies through your browser settings. Most browsers allow you to:</Para>
            <BulletList items={[
              'View what cookies are stored and delete individual ones.',
              'Block third-party cookies entirely.',
              'Set preferences to be notified before a cookie is placed.',
            ]} />
            <Para>Note that disabling essential or authentication cookies will affect your ability to stay logged in to Vaulted. Disabling affiliate tracking cookies will not affect your ability to use the service — it will only prevent Vaulted from receiving a commission if you book through a partner link.</Para>
            <Para>For instructions specific to your browser, visit the help pages for Chrome, Safari, Firefox, or Edge.</Para>
          </Section>

          <Section title="5. Do Not Track">
            <Para>Some browsers send a "Do Not Track" signal. Vaulted does not currently respond to Do Not Track signals because there is no uniform industry standard for how to interpret them. We will update this policy if a standard emerges.</Para>
          </Section>

          <Section title="6. Changes to This Policy">
            <Para>We may update this Cookie Policy from time to time. Changes will be posted with a new "Last updated" date. Continued use of Vaulted after changes are posted constitutes your acceptance.</Para>
          </Section>

          <Section title="7. Contact">
            <Para>Questions about our use of cookies? Contact us at vaultedstay@gmail.com.</Para>
          </Section>

        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={s.para}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={s.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bullet}>—</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function CookieCard({
  category,
  purpose,
  provider,
  canDisable,
}: {
  category: string;
  purpose: string;
  provider: string;
  canDisable: boolean;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardCategory}>{category.toUpperCase()}</Text>
        <View style={[s.cardBadge, canDisable ? s.cardBadgeOptional : s.cardBadgeRequired]}>
          <Text style={[s.cardBadgeText, canDisable ? s.cardBadgeTextOptional : s.cardBadgeTextRequired]}>
            {canDisable ? 'OPTIONAL' : 'REQUIRED'}
          </Text>
        </View>
      </View>
      <Text style={s.cardPurpose}>{purpose}</Text>
      <Text style={s.cardProvider}>Provider: {provider}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer}>
      <View style={s.divider} />
      <Text style={s.footerText}>© 2026 Vaulted · vaultedstays.com</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { paddingBottom: 64 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 28,
  },
  backText: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: 4,
    marginBottom: 14,
  },
  goldLine: {
    width: 32,
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT,
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: MUTED,
    letterSpacing: 0.3,
  },

  divider: { height: 1, backgroundColor: DIVIDER },

  body: {
    paddingHorizontal: 24,
    paddingTop: 32,
    maxWidth: 720,
  },

  intro: {
    fontSize: 15,
    lineHeight: 26,
    color: '#AAAAAA',
    marginBottom: 32,
    fontStyle: 'italic',
  },

  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  para: {
    fontSize: 15,
    lineHeight: 26,
    color: '#CCCCCC',
    marginBottom: 12,
  },

  bulletList: {
    marginBottom: 12,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bullet: {
    fontSize: 15,
    color: GOLD,
    lineHeight: 26,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 26,
    color: '#CCCCCC',
  },

  // Cookie cards
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(200,168,107,0.15)',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  cardBadgeRequired: {
    borderColor: 'rgba(200,168,107,0.4)',
  },
  cardBadgeOptional: {
    borderColor: 'rgba(85,85,85,0.5)',
  },
  cardBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardBadgeTextRequired: {
    color: GOLD,
  },
  cardBadgeTextOptional: {
    color: MUTED,
  },
  cardPurpose: {
    fontSize: 13,
    lineHeight: 22,
    color: '#BBBBBB',
    marginBottom: 10,
  },
  cardProvider: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.3,
  },

  footer: {
    marginTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  footerText: {
    marginTop: 16,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
