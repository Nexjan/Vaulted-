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

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSignIn = async () => {
    const e = email.trim();
    if (!e || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(e, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)/search');
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/search'));

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <Pressable onPress={back} hitSlop={12} style={s.back}>
            <Text style={s.backText}>← BACK</Text>
          </Pressable>

          <View style={s.header}>
            <Text style={s.wordmark}>VAULTED</Text>
            <View style={s.goldLine} />
            <Text style={s.screenLabel}>SIGN IN</Text>
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
              placeholder="Password"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable
              style={[s.primaryBtn, loading && s.primaryBtnOff]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={BG} />
                : <Text style={s.primaryBtnText}>SIGN IN</Text>
              }
            </Pressable>

            <Pressable onPress={() => router.push('/auth/forgot-password')} style={s.forgotWrap}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <View style={s.divider} />

          <Pressable onPress={() => router.push('/auth/sign-up')} style={s.switchWrap}>
            <Text style={s.switchText}>
              New here?{'  '}
              <Text style={s.switchLink}>Create account →</Text>
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

  forgotWrap: { alignItems: 'center', paddingVertical: 10 },
  forgotText: { fontSize: 11, color: 'rgba(200,168,107,0.5)', letterSpacing: 0.5 },

  divider:    { height: 1, backgroundColor: DIVIDER, marginVertical: 32 },
  switchWrap: { alignItems: 'center' },
  switchText: { fontSize: 12, color: MUTED, letterSpacing: 0.3 },
  switchLink: { color: GOLD },
});
