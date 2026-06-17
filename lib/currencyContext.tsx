import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'US Dollar'         },
  { code: 'EUR', symbol: '€',  label: 'Euro'              },
  { code: 'GBP', symbol: '£',  label: 'Brit. Pound'       },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar'   },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥',  label: 'Japanese Yen'      },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

const STORAGE_KEY = 'vaulted:display-currency';

interface CurrencyContextValue {
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (code: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  displayCurrency: 'USD',
  setDisplayCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>('USD');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val && SUPPORTED_CURRENCIES.some((c) => c.code === val)) {
        setDisplayCurrencyState(val as CurrencyCode);
      }
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user.id) {
        try {
          const { data } = await supabase
            .from('user_preferences')
            .select('preferred_currency')
            .eq('user_id', session.user.id)
            .maybeSingle();
          const code = (data as any)?.preferred_currency;
          if (code && SUPPORTED_CURRENCIES.some((c) => c.code === code)) {
            setDisplayCurrencyState(code as CurrencyCode);
            await AsyncStorage.setItem(STORAGE_KEY, code);
          }
        } catch {}
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const setDisplayCurrency = useCallback(async (code: CurrencyCode) => {
    setDisplayCurrencyState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user.id) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ user_id: session.user.id, preferred_currency: code }, { onConflict: 'user_id' });
      } catch {}
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
