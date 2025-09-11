import React, { createContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { sdk } from '@farcaster/miniapp-sdk';

const FarcasterSolanaProvider = dynamic(
  () => import('@farcaster/mini-app-solana').then(mod => mod.FarcasterSolanaProvider),
  { ssr: false }
);

type SafeFarcasterSolanaProviderProps = {
  endpoint: string;
  children: React.ReactNode;
};

const SolanaProviderContext = createContext<{ hasSolanaProvider: boolean }>({ hasSolanaProvider: false });

export function SafeFarcasterSolanaProvider({ endpoint, children }: SafeFarcasterSolanaProviderProps) {
  const isClient = typeof window !== "undefined";
  const [hasSolanaProvider, setHasSolanaProvider] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;
    (async () => {
      try {
        const provider = await sdk.wallet.getSolanaProvider();
        if (!cancelled) {
          setHasSolanaProvider(!!provider);
        }
      } catch {
        if (!cancelled) {
          setHasSolanaProvider(false);
        }
      } finally {
        if (!cancelled) {
          setChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClient]);

  useEffect(() => {
    let errorShown = false;
    const origError = console.error;
    
    // Use a more stable approach to avoid useInsertionEffect issues
    const handleError = (...args: any[]) => {
      try {
        if (
          typeof args[0] === "string" &&
          args[0].includes("WalletConnectionError: could not get Solana provider")
        ) {
          if (!errorShown) {
            origError(...args);
            errorShown = true;
          }
          return;
        }
        origError(...args);
      } catch (error) {
        // If there's an error in error handling, just ignore it
        // This prevents the error handler from breaking the app
      }
    };

    // Only override console.error if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.error = handleError;
    }

    return () => {
      try {
        if (typeof window !== 'undefined') {
          console.error = origError;
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  if (!isClient || !checked) {
    return null;
  }

  return (
    <SolanaProviderContext.Provider value={{ hasSolanaProvider }}>
      {hasSolanaProvider ? (
        <FarcasterSolanaProvider endpoint={endpoint}>
          {children}
        </FarcasterSolanaProvider>
      ) : (
        <>{children}</>
      )}
    </SolanaProviderContext.Provider>
  );
}

export function useHasSolanaProvider() {
  return React.useContext(SolanaProviderContext).hasSolanaProvider;
}
