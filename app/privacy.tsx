import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';

export default function PrivacyScreen() {
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
          <Text style={s.pageTitle}>Privacy Policy</Text>
          <Text style={s.lastUpdated}>Last updated: June 17, 2026</Text>
        </View>

        <View style={s.divider} />

        {/* Body */}
        <View style={s.body}>

          <Text style={s.intro}>
            Vaulted ("we," "us," or "our") operates the Vaulted travel platform at vaultedstays.com. This Privacy Policy explains what information we collect, how we use it, and your choices. By using Vaulted, you agree to the practices described here.
          </Text>

          <Section title="1. Information We Collect">
            <Para><Bold>Account information.</Bold> When you create an account, we collect your email address and a password (managed through Supabase Authentication). We do not store your password in plain text.</Para>
            <Para><Bold>Vault and saved-listings data.</Bold> When you save listings to your Vault, we store those associations in our database (Supabase) tied to your account.</Para>
            <Para><Bold>Usage and device data.</Bold> We may receive standard technical information such as IP address, browser type, and pages visited through cookies and similar technologies. See the Cookie section below.</Para>
            <Para><Bold>Communications.</Bold> If you contact us by email, we retain that correspondence.</Para>
          </Section>

          <Section title="2. How We Use Your Information">
            <Para>We use the information we collect to:</Para>
            <BulletList items={[
              'Provide, maintain, and improve the Vaulted service.',
              'Authenticate your account and keep your Vault data in sync.',
              'Understand how users interact with the platform so we can improve it.',
              'Respond to your inquiries or support requests.',
              'Comply with legal obligations.',
            ]} />
          </Section>

          <Section title="3. Affiliate Disclosure">
            <Para>
              Vaulted participates in affiliate advertising programs. When you click a booking link and complete a reservation with a partner such as Booking.com, Vrbo, or Agoda, we may earn a commission at no additional cost to you. Affiliate links are used to fund the service and do not affect the price you pay or the rankings and curation of listings.
            </Para>
            <Para>
              We use Travelpayouts, a travel affiliate network, to facilitate tracking of referrals to booking partners. Travelpayouts may set cookies or tracking pixels in connection with this program (see Section 6).
            </Para>
          </Section>

          <Section title="4. How We Share Your Information">
            <Para>We do not sell your personal information. We share data only in these limited circumstances:</Para>
            <Para><Bold>Supabase.</Bold> We use Supabase to host authentication and our database. Your email address and Vault data are stored on Supabase's infrastructure. Supabase's privacy policy governs their handling of that data.</Para>
            <Para><Bold>Booking partners.</Bold> When you click a "Reserve" or booking link, you are redirected to a third-party platform (e.g. Booking.com, Vrbo, Agoda). Any information you provide to those platforms is governed by their own privacy policies. We do not transmit your Vaulted account information to booking partners.</Para>
            <Para><Bold>Travelpayouts.</Bold> Affiliate tracking data (such as click referrals) is shared with Travelpayouts as part of our affiliate program.</Para>
            <Para><Bold>Legal requirements.</Bold> We may disclose information if required by law, court order, or to protect the rights or safety of users and the public.</Para>
          </Section>

          <Section title="5. Data Retention">
            <Para>We retain your account data for as long as your account is active. If you delete your account (available in Account Settings), your email address and Vault data are removed from our database. Some residual data may remain in backups for a limited period before being purged.</Para>
          </Section>

          <Section title="6. Cookies and Tracking Technologies">
            <Para>We use cookies and similar technologies for:</Para>
            <BulletList items={[
              'Authentication — keeping you logged in across sessions.',
              'Site functionality — storing preferences and UI state.',
              'Affiliate tracking — Travelpayouts uses cookies to attribute bookings made through our referral links to Vaulted.',
            ]} />
            <Para>You can control or disable cookies through your browser settings. Disabling cookies may affect login functionality and parts of the service. For full details, see our Cookie Policy.</Para>
          </Section>

          <Section title="7. Your Rights">
            <Para>You have the right to:</Para>
            <BulletList items={[
              'Access the personal data we hold about you.',
              'Request correction of inaccurate data.',
              'Request deletion of your account and associated data (use the "Delete Account" option in Account Settings, or contact us).',
              'Withdraw consent where processing is based on consent.',
            ]} />
            <Para>To exercise these rights, contact us at vaultedstay@gmail.com.</Para>
          </Section>

          <Section title="8. Data Security">
            <Para>We implement reasonable technical and organizational measures to protect your information. Authentication is managed by Supabase, which provides industry-standard security. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</Para>
          </Section>

          <Section title="9. Children's Privacy">
            <Para>Vaulted is not directed at children under the age of 18. We do not knowingly collect personal information from anyone under 18. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.</Para>
          </Section>

          <Section title="10. Changes to This Policy">
            <Para>We may update this Privacy Policy from time to time. We will post the revised policy with a new "Last updated" date. Continued use of Vaulted after changes are posted constitutes your acceptance of the revised policy.</Para>
          </Section>

          <Section title="11. Governing Law">
            <Para>This Privacy Policy is governed by the laws of the Commonwealth of Massachusetts, United States, without regard to conflict-of-law principles.</Para>
          </Section>

          <Section title="12. Contact">
            <Para>Questions about this policy? Contact us at vaultedstay@gmail.com.</Para>
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

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={s.bold}>{children}</Text>;
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
  bold: {
    fontWeight: '700',
    color: TEXT,
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
