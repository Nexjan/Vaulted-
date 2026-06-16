import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const SURFACE = '#141414';
const DIVIDER = '#1E1E1E';
const ERR     = '#C97B7B';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const handleUpdate = async () => {
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)              { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.replace('/auth/sign-in'), 2000);
  };

  if (done) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.centered}>
          <Text style={s.wordmark}>VAULTED</Text>
          <View style={s.goldLine} />
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>PASSWORD UPDATED</Text>
          <Text style={s.successBody}>Signing you in…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.centered}>
          <Text style={s.wordmark}>VAULTED</Text>
          <View style={s.goldLine} />
          <Text style={s.expiredIcon}>✕</Text>
          <Text style={s.expiredTitle}>LINK EXPIRED</Text>
          <Text style={s.expiredBody}>Request a new reset link below.</Text>
          <Pressable onPress={() => router.replace('/auth/forgot-password')} style={s.ctaLink}>
            <Text style={s.ctaLinkText}>← Request new link</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <Text style={s.wordmark}>VAULTED</Text>
            <View style={s.goldLine} />
            <Text style={s.screenLabel}>NEW PASSWORD</Text>
          </View>

          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="New password"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <TextInput
              style={s.input}
              placeholder="Confirm new password"
              placeholderTextColor={MUTED}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable
              style={[s.primaryBtn, loading && s.primaryBtnOff]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={BG} />
                : <Text style={s.primaryBtnText}>SET NEW PASSWORD</Text>
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

  header:      { alignItems: 'center', marginBottom: 48, paddingTop: 64 },
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

  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon:  { fontSize: 32, color: GOLD, marginBottom: 12 },
  successTitle: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5, marginBottom: 12 },
  successBody:  { fontSize: 13, color: MUTED },
  expiredIcon:  { fontSize: 28, color: ERR, marginBottom: 12 },
  expiredTitle: { fontSize: 9, fontWeight: '700', color: ERR, letterSpacing: 3.5, marginBottom: 12 },
  expiredBody:  { fontSize: 13, color: MUTED, marginBottom: 32 },
  ctaLink:      {},
  ctaLinkText:  { fontSize: 11, color: 'rgba(200,168,107,0.6)', letterSpacing: 1 },
});
