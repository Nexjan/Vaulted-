import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';

export default function TermsScreen() {
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
          <Text style={s.pageTitle}>Terms of Service</Text>
          <Text style={s.lastUpdated}>Last updated: June 17, 2026</Text>
        </View>

        <View style={s.divider} />

        {/* Body */}
        <View style={s.body}>

          <Text style={s.intro}>
            These Terms of Service ("Terms") govern your access to and use of the Vaulted platform operated at vaultedstays.com. By creating an account or using Vaulted, you agree to these Terms. If you do not agree, do not use the service.
          </Text>

          <Section title="1. Description of Service">
            <Para>Vaulted is a curated travel discovery platform. We surface vacation rentals, homes, and hotels from around the world, provide editorial curation and uniqueness scoring, and give users tools to save and share their own collection of stays. When you decide to book a property, Vaulted directs you to a third-party booking partner (such as Booking.com, Vrbo, or Agoda) to complete the reservation. Vaulted is not a booking agent and is not a party to any reservation or contract between you and a booking partner.</Para>
          </Section>

          <Section title="2. Affiliate Disclosure">
            <Para>
              Vaulted participates in affiliate advertising programs. When you click a booking link on Vaulted and complete a reservation, we may earn a referral commission from the booking partner at no additional cost to you. This commission does not influence the curation or ranking of listings — our goal is always to surface genuinely exceptional stays.
            </Para>
            <Para>
              We use Travelpayouts to manage affiliate tracking for travel partners. By using Vaulted and clicking booking links, you acknowledge that affiliate tracking technologies (including cookies) may be used to attribute your booking to Vaulted.
            </Para>
          </Section>

          <Section title="3. User Accounts">
            <Para>To save listings and use Vault features, you must create an account with a valid email address and password. You are responsible for keeping your credentials confidential and for all activity under your account. Notify us immediately at vaultedstay@gmail.com if you suspect unauthorized access.</Para>
            <Para>You must be at least 18 years old to create an account. By registering, you confirm that you meet this requirement.</Para>
          </Section>

          <Section title="4. Vault and Saved Listings">
            <Para>Your Vault is your personal collection of saved properties on Vaulted. You may choose to make your Vault public and share it via a unique link. Public Vaults display only the listings you have chosen to save and share — your email address and account details are never exposed to people viewing a shared Vault.</Para>
            <Para>Vaulted listings are sourced from publicly available data and affiliate partner feeds. Pricing, availability, amenities, and other listing details may change. Always verify details on the booking partner's site before completing a reservation.</Para>
          </Section>

          <Section title="5. Third-Party Booking Partners">
            <Para>When you leave Vaulted to book a property, you are interacting with a separate third-party platform. Vaulted has no control over and assumes no responsibility for:</Para>
            <BulletList items={[
              'The accuracy of pricing, availability, or property descriptions on partner sites.',
              'The terms, policies, or practices of booking partners.',
              'Any transaction, dispute, or outcome arising from a booking made through a partner.',
            ]} />
            <Para>Your relationship with booking partners is governed by their own terms and privacy policies.</Para>
          </Section>

          <Section title="6. Acceptable Use">
            <Para>You agree not to:</Para>
            <BulletList items={[
              'Use Vaulted for any unlawful purpose.',
              'Attempt to reverse-engineer, scrape, or disrupt the platform.',
              'Impersonate another person or misrepresent your identity.',
              'Transmit spam, malware, or any harmful content.',
            ]} />
            <Para>We reserve the right to suspend or terminate accounts that violate these Terms.</Para>
          </Section>

          <Section title="7. Intellectual Property">
            <Para>The Vaulted name, wordmark, design, editorial content, and curation methodology are the property of Vaulted and may not be reproduced or used without our written permission. Listing images and property descriptions belong to their respective owners and are used under license or in accordance with affiliate partner agreements.</Para>
          </Section>

          <Section title="8. Disclaimers">
            <Para>Vaulted is provided on an "as is" and "as available" basis. We make no warranties — express or implied — regarding the accuracy of listing information, the uninterrupted availability of the service, or the suitability of any property for your needs. Use of third-party booking platforms is entirely at your own risk.</Para>
          </Section>

          <Section title="9. Limitation of Liability">
            <Para>To the maximum extent permitted by applicable law, Vaulted and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to losses arising from bookings made through partner platforms, errors in listing data, or service interruptions. Our total liability to you for any claim shall not exceed the greater of $100 USD or the amount you paid to use the service in the 12 months preceding the claim.</Para>
          </Section>

          <Section title="10. Changes to These Terms">
            <Para>We may update these Terms from time to time. We will post the revised version with a new "Last updated" date. Continued use of Vaulted after changes are posted constitutes your acceptance of the revised Terms.</Para>
          </Section>

          <Section title="11. Governing Law and Disputes">
            <Para>These Terms are governed by the laws of the Commonwealth of Massachusetts, United States, without regard to conflict-of-law principles. Any disputes arising from these Terms or your use of Vaulted shall be resolved in the state or federal courts located in Massachusetts.</Para>
          </Section>

          <Section title="12. Contact">
            <Para>Questions about these Terms? Reach us at vaultedstay@gmail.com.</Para>
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
