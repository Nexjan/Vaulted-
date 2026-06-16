import { createContext, useContext, useState, ReactNode } from 'react';

interface VaultCtx {
  vaultDone: boolean;
  setVaultDone: (v: boolean) => void;
}

const VaultContext = createContext<VaultCtx>({ vaultDone: false, setVaultDone: () => {} });

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultDone, setVaultDone] = useState(false);
  return (
    <VaultContext.Provider value={{ vaultDone, setVaultDone }}>
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => useContext(VaultContext);
