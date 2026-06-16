import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const SURFACE = '#141414';
const DIVIDER = '#1E1E1E';
const ERR     = '#C97B7B';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);

  const handleReset = async () => {
    const e = email.trim();
    if (!e) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await resetPassword(e);
    setLoading(false);
    if (err) { setError(err); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.centered}>
          <Text style={s.wordmark}>VAULTED</Text>
          <View style={s.goldLine} />
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>LINK SENT</Text>
          <Text style={s.successBody}>
            Check your inbox for a{'\n'}password reset link.
          </Text>
          <Pressable onPress={() => router.replace('/auth/sign-in')} style={s.ctaLink}>
            <Text style={s.ctaLinkText}>← Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
            <Text style={s.backText}>← BACK</Text>
          </Pressable>

          <View style={s.header}>
            <Text style={s.wordmark}>VAULTED</Text>
            <View style={s.goldLine} />
            <Text style={s.screenLabel}>RESET PASSWORD</Text>
          </View>

          <Text style={s.subtext}>We’ll send a reset link to your inbox.</Text>

          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable
              style={[s.primaryBtn, loading && s.primaryBtnOff]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={BG} />
                : <Text style={s.primaryBtnText}>SEND RESET LINK</Text>
              }
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingBottom: 48 },

  back:     { paddingTop: 16, paddingBottom: 32 },
  backText: { fontSize: 9, fontWeight: '700', color: 'rgba(200,168,107,0.45)', letterSpacing: 2 },

  header:      { alignItems: 'center', marginBottom: 28 },
  wordmark:    { fontSize: 36, fontWeight: '900', color: TEXT, fontFamily: 'Georgia', letterSpacing: -1 },
  goldLine:    { width: 48, height: 1, backgroundColor: GOLD, marginTop: 14, marginBottom: 16 },
  screenLabel: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5 },

  subtext: { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 36, lineHeight: 20 },

  form: { gap: 12 },
  input: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: DIVIDER,
    borderRadius: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT,
    letterSpacing: 0.2,
  },
  error: { fontSize: 11, color: ERR, letterSpacing: 0.3, paddingHorizontal: 2 },

  primaryBtn: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  primaryBtnOff:  { opacity: 0.55 },
  primaryBtnText: { fontSize: 11, fontWeight: '700', color: BG, letterSpacing: 3 },

  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon:  { fontSize: 32, color: GOLD, marginBottom: 12 },
  successTitle: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5, marginBottom: 20 },
  successBody:  { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22 },
  ctaLink:      { marginTop: 36 },
  ctaLinkText:  { fontSize: 11, color: 'rgba(200,168,107,0.6)', letterSpacing: 1 },
});
