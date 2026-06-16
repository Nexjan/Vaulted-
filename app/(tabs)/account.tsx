import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  catch { return ''; }
}

function Header() {
  return (
    <View style={s.header}>
      <Text style={s.wordmark}>VAULTED</Text>
      <View style={s.goldLine} />
      <Text style={s.label}>YOUR ACCOUNT</Text>
    </View>
  );
}

export default function AccountTab() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  if (loading) return <View style={s.container} />;

  if (user) {
    const handleSignOut = async () => {
      await signOut();
      router.replace('/');
    };

    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.inner}>
          <Header />

          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.rowLabel}>EMAIL</Text>
            <Text style={s.rowValue} numberOfLines={1}>{user.email}</Text>
          </View>

          {!!user.created_at && (
            <View style={s.row}>
              <Text style={s.rowLabel}>MEMBER SINCE</Text>
              <Text style={s.rowValue}>{fmtDate(user.created_at)}</Text>
            </View>
          )}

          <View style={s.divider} />
          <View style={{ flex: 1 }} />

          <Pressable style={s.outlineBtn} onPress={handleSignOut}>
            <Text style={s.outlineBtnText}>SIGN OUT</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.inner}>
        <Header />

        <Text style={s.pitch}>
          Sign in to save favourites and{'\n'}sync your vault across devices.
        </Text>

        <View style={s.btnGroup}>
          <Pressable style={s.solidBtn} onPress={() => router.push('/auth/sign-in')}>
            <Text style={s.solidBtnText}>SIGN IN</Text>
          </Pressable>
          <Pressable style={s.outlineBtn} onPress={() => router.push('/auth/sign-up')}>
            <Text style={s.outlineBtnText}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Text style={s.browseNote}>Browse freely — no account required.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 12, paddingBottom: 32 },

  header:   { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  wordmark: { fontSize: 36, fontWeight: '900', color: TEXT, fontFamily: 'Georgia', letterSpacing: -1 },
  goldLine: { width: 48, height: 1, backgroundColor: GOLD, marginTop: 14, marginBottom: 16 },
  label:    { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5 },

  divider: { height: 1, backgroundColor: DIVIDER, marginVertical: 24 },

  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 12 },
  rowLabel: { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 2 },
  rowValue: { fontSize: 13, color: TEXT, flex: 1, textAlign: 'right' },

  pitch: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 36,
  },

  btnGroup: { gap: 12 },

  solidBtn:       { backgroundColor: GOLD, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  solidBtnText:   { fontSize: 11, fontWeight: '700', color: BG, letterSpacing: 3 },

  outlineBtn:     { borderWidth: 1, borderColor: GOLD, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  outlineBtnText: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 3 },

  browseNote: { fontSize: 10, color: 'rgba(85,85,85,0.6)', textAlign: 'center', letterSpacing: 0.5 },
});
