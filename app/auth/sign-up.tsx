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

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState('');

  const handleSignUp = async () => {
    const e = email.trim();
    if (!e || !password)        { setError('Please enter your email and a password.'); return; }
    if (password.length < 6)    { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    const { error: err, needsVerification } = await signUp(e, password);
    setLoading(false);
    if (err) { setError(err); return; }
    if (needsVerification) { setSentEmail(e); return; }
    router.replace('/(tabs)/search');
  };

  if (sentEmail) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.centered}>
          <Text style={s.wordmark}>VAULTED</Text>
          <View style={s.goldLine} />
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>CHECK YOUR EMAIL</Text>
          <Text style={s.successBody}>
            We sent a verification link to{'\n'}
            <Text style={s.sentEmail}>{sentEmail}</Text>
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
            <Text style={s.screenLabel}>CREATE ACCOUNT</Text>
          </View>

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
            <TextInput
              style={s.input}
              placeholder="Password  (min 6 characters)"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable
              style={[s.primaryBtn, loading && s.primaryBtnOff]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={BG} />
                : <Text style={s.primaryBtnText}>CREATE ACCOUNT</Text>
              }
            </Pressable>
          </View>

          <View style={s.divider} />

          <Pressable onPress={() => router.replace('/auth/sign-in')} style={s.switchWrap}>
            <Text style={s.switchText}>
              Already have an account?{'  '}
              <Text style={s.switchLink}>Sign in →</Text>
            </Text>
          </Pressable>

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

  header:      { alignItems: 'center', marginBottom: 48 },
  wordmark:    { fontSize: 36, fontWeight: '900', color: TEXT, fontFamily: 'Georgia', letterSpacing: -1 },
  goldLine:    { width: 48, height: 1, backgroundColor: GOLD, marginTop: 14, marginBottom: 16 },
  screenLabel: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5 },

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

  divider:    { height: 1, backgroundColor: DIVIDER, marginVertical: 32 },
  switchWrap: { alignItems: 'center' },
  switchText: { fontSize: 12, color: MUTED, letterSpacing: 0.3 },
  switchLink: { color: GOLD },

  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon:  { fontSize: 32, color: GOLD, marginBottom: 12 },
  successTitle: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5, marginBottom: 20 },
  successBody:  { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22 },
  sentEmail:    { color: TEXT, fontWeight: '600' },
  ctaLink:      { marginTop: 36 },
  ctaLinkText:  { fontSize: 11, color: 'rgba(200,168,107,0.6)', letterSpacing: 1 },
});
