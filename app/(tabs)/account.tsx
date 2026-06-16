import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../../lib/auth';
import { useFavorites } from '../../lib/favorites';
import { usePriceAlerts, getPriceDrop } from '../../lib/priceAlerts';
import { useSharedVault } from '../../lib/sharedVault';
import { listings } from '../../lib/listingsService';
import { supabase } from '../../lib/supabase';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
// Update LEGAL_BASE to your real domain once legal pages exist
const LEGAL_BASE = 'https://vaulted.app';

const BG      = '#0A0A0A';
const TEXT    = '#F5F3EF';
const GOLD    = '#C8A86B';
const MUTED   = '#555555';
const DIVIDER = '#1E1E1E';
const SURFACE = '#141414';
const DANGER  = '#C85C5C';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  catch { return ''; }
}

// ─── Sub-components ────────────────────────────────────────────

function Header() {
  return (
    <View style={s.header}>
      <Text style={s.wordmark}>VAULTED</Text>
      <View style={s.goldLine} />
      <Text style={s.headerLabel}>YOUR ACCOUNT</Text>
    </View>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function StatCell({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={s.statCell}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function RowDivider() {
  return <View style={s.rowDivider} />;
}

function NavRow({
  label, sub, badge, last, onPress,
}: {
  label: string; sub?: string; badge?: string | number; last?: boolean; onPress: () => void;
}) {
  return (
    <>
      <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]} onPress={onPress}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowText}>{label}</Text>
          {!!sub && <Text style={s.rowSub}>{sub}</Text>}
        </View>
        {badge !== undefined && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={11} color={MUTED} style={{ marginLeft: 6 }} />
      </Pressable>
      {!last && <RowDivider />}
    </>
  );
}

function ChangeEmailForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'err'>('idle');
  const [err, setErr] = useState('');

  const submit = async () => {
    const e = email.trim();
    if (!e.includes('@')) { setErr('Enter a valid email address.'); setStatus('err'); return; }
    setStatus('busy'); setErr('');
    const { error } = await supabase.auth.updateUser({ email: e });
    if (error) { setErr(error.message); setStatus('err'); }
    else setStatus('done');
  };

  if (status === 'done') {
    return (
      <View style={s.formExpanded}>
        <Text style={s.formSuccess}>Confirmation sent — check your inbox.</Text>
        <Pressable onPress={onDone} style={{ marginTop: 12 }}>
          <Text style={s.formDismiss}>DONE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.formExpanded}>
      <TextInput
        style={s.formInput}
        value={email}
        onChangeText={setEmail}
        placeholder="New email address"
        placeholderTextColor={MUTED}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {status === 'err' && <Text style={s.formError}>{err}</Text>}
      <Pressable
        style={[s.formBtn, status === 'busy' && s.formBtnDisabled]}
        onPress={submit}
        disabled={status === 'busy'}
      >
        <Text style={s.formBtnText}>{status === 'busy' ? '…' : 'SEND CONFIRMATION'}</Text>
      </Pressable>
    </View>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'err'>('idle');
  const [err, setErr] = useState('');

  const submit = async () => {
    if (pw.length < 6) { setErr('Minimum 6 characters.'); setStatus('err'); return; }
    if (pw !== confirm) { setErr('Passwords do not match.'); setStatus('err'); return; }
    setStatus('busy'); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setStatus('err'); }
    else setStatus('done');
  };

  if (status === 'done') {
    return (
      <View style={s.formExpanded}>
        <Text style={s.formSuccess}>Password updated.</Text>
        <Pressable onPress={onDone} style={{ marginTop: 12 }}>
          <Text style={s.formDismiss}>DONE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.formExpanded}>
      <TextInput
        style={s.formInput}
        value={pw}
        onChangeText={setPw}
        placeholder="New password"
        placeholderTextColor={MUTED}
        secureTextEntry
      />
      <TextInput
        style={[s.formInput, { marginTop: 8 }]}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm new password"
        placeholderTextColor={MUTED}
        secureTextEntry
      />
      {status === 'err' && <Text style={s.formError}>{err}</Text>}
      <Pressable
        style={[s.formBtn, status === 'busy' && s.formBtnDisabled]}
        onPress={submit}
        disabled={status === 'busy'}
      >
        <Text style={s.formBtnText}>{status === 'busy' ? '…' : 'UPDATE PASSWORD'}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────

export default function AccountTab() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { favoriteIds } = useFavorites();
  const { alerts } = usePriceAlerts();
  const { vault, loading: vaultLoading } = useSharedVault();

  const [emailOpen, setEmailOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [deleteErr, setDeleteErr] = useState('');

  const listingById = useMemo(
    () => Object.fromEntries(listings.map((l) => [l.id, l])),
    [],
  );

  const activeDropCount = useMemo(() =>
    favoriteIds.filter((id) => {
      const listing = listingById[id];
      const price = alerts[id];
      return listing && price !== undefined && getPriceDrop(listing, price) !== null;
    }).length,
    [favoriteIds, alerts, listingById],
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/');
  }, [signOut, router]);

  const handleDeletePress = useCallback(async () => {
    if (deleteStep === 'idle') {
      setDeleteStep('confirm');
      return;
    }
    setDeleteErr('');
    setDeleteStep('deleting');
    try {
      if (user?.id) {
        await supabase.from('vault_items').delete().eq('user_id', user.id);
        await supabase.from('shared_vaults').delete().eq('user_id', user.id);
      }
      // Requires delete_user() DB function — see supabase/delete_user.sql
      await supabase.rpc('delete_user').catch(() => {});
      await signOut();
      router.replace('/');
    } catch {
      setDeleteErr('Could not delete — try again.');
      setDeleteStep('confirm');
    }
  }, [deleteStep, user?.id, signOut, router]);

  if (loading) return <View style={s.container} />;

  // ── Logged out ─────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
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
          <Text style={s.browseNote}>Browse freely — no account required.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Logged in ───────────────────────────────────────────
  const vaultStatusLabel = vaultLoading ? '–' : (vault?.is_public ? 'PUBLIC' : 'PRIVATE');

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <Header />

        {/* ── Profile ── */}
        <View style={s.profileBlock}>
          <View style={s.profileRow}>
            <Text style={s.profileLabel}>EMAIL</Text>
            <Text style={s.profileValue} numberOfLines={1}>{user.email}</Text>
          </View>
          {!!user.created_at && (
            <>
              <View style={s.rowDivider} />
              <View style={s.profileRow}>
                <Text style={s.profileLabel}>MEMBER SINCE</Text>
                <Text style={s.profileValue}>{fmtDate(user.created_at)}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <StatCell value={favoriteIds.length} label="STAYS VAULTED" />
          <View style={s.statDivider} />
          <StatCell value={activeDropCount} label="PRICE DROPS" />
          <View style={s.statDivider} />
          <StatCell value={vaultStatusLabel} label="VAULT" />
        </View>

        {/* ── YOUR COLLECTION ── */}
        <SectionHead label="YOUR COLLECTION" />
        <View style={s.card}>
          <NavRow
            label="My Vault"
            sub={`${favoriteIds.length} saved stay${favoriteIds.length === 1 ? '' : 's'}`}
            onPress={() => router.navigate('/(tabs)/saved')}
          />
          <NavRow
            label="Shared Vault"
            sub={vault?.is_public ? vault.display_name : 'Private — tap to manage sharing'}
            badge={vault?.is_public ? 'PUBLIC' : undefined}
            last={activeDropCount === 0}
            onPress={() => router.navigate('/(tabs)/saved')}
          />
          {activeDropCount > 0 && (
            <NavRow
              label="Price Drops"
              sub={`${activeDropCount} active alert${activeDropCount === 1 ? '' : 's'}`}
              badge={activeDropCount}
              last
              onPress={() => router.navigate('/(tabs)/saved')}
            />
          )}
        </View>

        {/* ── ACCOUNT ── */}
        <SectionHead label="ACCOUNT" />
        <View style={s.card}>
          {/* Change Email */}
          <Pressable
            style={({ pressed }) => [s.row, pressed && s.rowPressed]}
            onPress={() => { setEmailOpen((v) => !v); setPwOpen(false); }}
          >
            <Text style={s.rowText}>Change Email</Text>
            <Ionicons name={emailOpen ? 'chevron-up' : 'chevron-forward'} size={11} color={MUTED} />
          </Pressable>
          {emailOpen && (
            <ChangeEmailForm onDone={() => setEmailOpen(false)} />
          )}

          <RowDivider />

          {/* Change Password */}
          <Pressable
            style={({ pressed }) => [s.row, pressed && s.rowPressed]}
            onPress={() => { setPwOpen((v) => !v); setEmailOpen(false); }}
          >
            <Text style={s.rowText}>Change Password</Text>
            <Ionicons name={pwOpen ? 'chevron-up' : 'chevron-forward'} size={11} color={MUTED} />
          </Pressable>
          {pwOpen && (
            <ChangePasswordForm onDone={() => setPwOpen(false)} />
          )}

          <RowDivider />

          {/* Sign Out */}
          <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]} onPress={handleSignOut}>
            <Text style={s.rowText}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={14} color={MUTED} />
          </Pressable>
        </View>

        {/* ── DELETE ACCOUNT ── */}
        <View style={s.deleteBlock}>
          {deleteStep === 'idle' && (
            <Pressable style={({ pressed }) => [s.deleteRow, pressed && s.rowPressed]} onPress={handleDeletePress}>
              <Text style={s.deleteRowText}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={11} color={DANGER} />
            </Pressable>
          )}
          {deleteStep === 'confirm' && (
            <View style={s.deleteConfirm}>
              <Text style={s.deleteWarning}>
                All vault data will be permanently erased. This cannot be undone.
              </Text>
              {!!deleteErr && <Text style={s.formError}>{deleteErr}</Text>}
              <View style={s.deleteActions}>
                <Pressable style={s.deleteCancelBtn} onPress={() => setDeleteStep('idle')}>
                  <Text style={s.deleteCancelText}>CANCEL</Text>
                </Pressable>
                <Pressable style={s.deleteConfirmBtn} onPress={handleDeletePress}>
                  <Text style={s.deleteConfirmText}>CONFIRM DELETE</Text>
                </Pressable>
              </View>
            </View>
          )}
          {deleteStep === 'deleting' && (
            <Text style={s.deletingText}>Deleting your account…</Text>
          )}
        </View>

        {/* ── LEGAL ── */}
        <SectionHead label="LEGAL" />
        <View style={s.card}>
          <NavRow
            label="Privacy Policy"
            onPress={() => Linking.openURL(`${LEGAL_BASE}/privacy`).catch(() => {})}
          />
          <NavRow
            label="Terms of Service"
            onPress={() => Linking.openURL(`${LEGAL_BASE}/terms`).catch(() => {})}
          />
          <NavRow
            label="Cookie Policy"
            last
            onPress={() => Linking.openURL(`${LEGAL_BASE}/cookies`).catch(() => {})}
          />
          <RowDivider />
          <View style={s.row}>
            <Text style={s.rowText}>Version</Text>
            <Text style={s.rowMeta}>{APP_VERSION}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  inner: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56 },

  // Header
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  wordmark: { fontSize: 36, fontWeight: '900', color: TEXT, fontFamily: 'Georgia', letterSpacing: -1 },
  goldLine: { width: 48, height: 1, backgroundColor: GOLD, marginTop: 14, marginBottom: 16 },
  headerLabel: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3.5 },

  // Profile block
  profileBlock: { marginTop: 8, marginBottom: 4 },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 13,
  },
  profileLabel: { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 2 },
  profileValue: { fontSize: 13, color: TEXT, flex: 1, textAlign: 'right' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: DIVIDER,
    marginTop: 20,
    marginBottom: 32,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: -0.5,
    fontFamily: 'Georgia',
  },
  statLabel: { fontSize: 8, fontWeight: '700', color: MUTED, letterSpacing: 1.5, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: DIVIDER },

  // Section head
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionLabel: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 3 },
  sectionLine: { flex: 1, height: 1, backgroundColor: DIVIDER },

  // Card
  card: { borderWidth: 1, borderColor: DIVIDER, marginBottom: 28 },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowPressed: { backgroundColor: '#111111' },
  rowText: { fontSize: 14, color: TEXT, flex: 1 },
  rowSub: { fontSize: 10, color: MUTED, marginTop: 2, letterSpacing: 0.2 },
  rowMeta: { fontSize: 13, color: MUTED },
  rowDivider: { height: 1, backgroundColor: DIVIDER },

  // Badge
  badge: {
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 4,
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: GOLD, letterSpacing: 1.5 },

  // Expandable form
  formExpanded: {
    backgroundColor: SURFACE,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  formInput: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: TEXT,
    letterSpacing: 0.2,
  },
  formBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: GOLD,
    paddingVertical: 11,
    alignItems: 'center',
  },
  formBtnDisabled: { opacity: 0.45 },
  formBtnText: { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 2 },
  formSuccess: { fontSize: 12, color: GOLD, lineHeight: 18 },
  formError: { fontSize: 11, color: DANGER, marginTop: 8, lineHeight: 16 },
  formDismiss: { fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 2 },

  // Delete
  deleteBlock: { borderWidth: 1, borderColor: '#2A1A1A', marginBottom: 32 },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  deleteRowText: { fontSize: 14, color: DANGER, flex: 1 },
  deleteConfirm: { padding: 16 },
  deleteWarning: { fontSize: 12, color: MUTED, lineHeight: 18, marginBottom: 16 },
  deleteActions: { flexDirection: 'row', gap: 10 },
  deleteCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: DIVIDER,
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteCancelText: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 1.5 },
  deleteConfirmBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: DANGER,
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteConfirmText: { fontSize: 10, fontWeight: '700', color: DANGER, letterSpacing: 1.5 },
  deletingText: { padding: 16, fontSize: 12, color: MUTED, fontStyle: 'italic' },

  // Logged out
  pitch: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22, marginTop: 20, marginBottom: 36 },
  btnGroup: { gap: 12 },
  solidBtn: { backgroundColor: GOLD, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  solidBtnText: { fontSize: 11, fontWeight: '700', color: BG, letterSpacing: 3 },
  outlineBtn: { borderWidth: 1, borderColor: GOLD, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  outlineBtnText: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 3 },
  browseNote: { fontSize: 10, color: 'rgba(85,85,85,0.6)', textAlign: 'center', letterSpacing: 0.5 },
});
