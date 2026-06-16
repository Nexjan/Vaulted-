import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
function genSlug(len = 11): string {
  return Array.from({ length: len }, () =>
    SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)],
  ).join('');
}

export interface SharedVault {
  id: string;
  slug: string;
  display_name: string;
  is_public: boolean;
}

export function useSharedVault() {
  const { user } = useAuth();
  const [vault, setVault] = useState<SharedVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVault = useCallback(async (userId: string) => {
    const { data, error: fetchErr } = await supabase
      .from('shared_vaults')
      .select('id, slug, display_name, is_public')
      .eq('user_id', userId)
      .maybeSingle();
    if (fetchErr) console.error('[sharedVault] fetch:', fetchErr.message);
    setVault((data as SharedVault) ?? null);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setVault(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchVault(user.id).finally(() => setLoading(false));
  }, [user?.id, fetchVault]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await fetchVault(user.id);
  }, [user?.id, fetchVault]);

  const setPublic = useCallback(
    async (isPublic: boolean, displayName?: string): Promise<void> => {
      if (!user?.id) return;
      setSaving(true);
      setError(null);
      try {
        // Always re-fetch to avoid stale state (e.g. row exists but vault state is null)
        const { data: current, error: fetchErr } = await supabase
          .from('shared_vaults')
          .select('id, slug, display_name, is_public')
          .eq('user_id', user.id)
          .maybeSingle();
        if (fetchErr) console.error('[sharedVault] pre-save fetch:', fetchErr.message);

        if (current) {
          const patch: Record<string, unknown> = {
            is_public: isPublic,
            updated_at: new Date().toISOString(),
          };
          if (displayName !== undefined) patch.display_name = displayName;
          const { data, error: updateErr } = await supabase
            .from('shared_vaults')
            .update(patch)
            .eq('id', current.id)
            .select('id, slug, display_name, is_public')
            .single();
          if (updateErr) {
            console.error('[sharedVault] update:', updateErr.message);
            setError('Could not save — try again.');
          } else if (data) {
            setVault(data as SharedVault);
          }
        } else {
          const slug = genSlug();
          const { data, error: insertErr } = await supabase
            .from('shared_vaults')
            .insert({
              user_id: user.id,
              slug,
              display_name: displayName ?? 'My Vault',
              is_public: isPublic,
            })
            .select('id, slug, display_name, is_public')
            .single();
          if (insertErr) {
            console.error('[sharedVault] insert:', insertErr.message);
            setError('Could not enable sharing — try again.');
          } else if (data) {
            setVault(data as SharedVault);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[sharedVault] unexpected:', msg);
        setError('Something went wrong — try again.');
      } finally {
        setSaving(false);
      }
    },
    [user?.id],
  );

  return { vault, loading, saving, error, setPublic, refresh };
}
