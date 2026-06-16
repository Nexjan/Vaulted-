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

  useEffect(() => {
    if (!user?.id) {
      setVault(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('shared_vaults')
      .select('id, slug, display_name, is_public')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setVault(data ?? null);
        setLoading(false);
      });
  }, [user?.id]);

  const setPublic = useCallback(
    async (isPublic: boolean, displayName?: string): Promise<void> => {
      if (!user?.id) return;
      setSaving(true);

      if (vault) {
        const patch: Record<string, unknown> = {
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        };
        if (displayName !== undefined) patch.display_name = displayName;
        const { data } = await supabase
          .from('shared_vaults')
          .update(patch)
          .eq('id', vault.id)
          .select('id, slug, display_name, is_public')
          .single();
        if (data) setVault(data as SharedVault);
      } else {
        const slug = genSlug();
        const { data } = await supabase
          .from('shared_vaults')
          .insert({
            user_id: user.id,
            slug,
            display_name: displayName ?? 'My Vault',
            is_public: isPublic,
          })
          .select('id, slug, display_name, is_public')
          .single();
        if (data) setVault(data as SharedVault);
      }
      setSaving(false);
    },
    [user?.id, vault],
  );

  return { vault, loading, saving, setPublic };
}
