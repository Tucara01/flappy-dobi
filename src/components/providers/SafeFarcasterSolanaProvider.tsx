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
    // Store the original console.error
    const origError = console.error;
    let errorShown = false;
    
    // Create a queue for deferred error logging
    const errorQueue: any[][] = [];
    
    // Function to process the error queue
    const processErrorQueue = () => {
      while (errorQueue.length > 0) {
        const args = errorQueue.shift();
        if (args) {
          try {
            origError.apply(console, args);
          } catch (e) {
            // Ignore errors in error processing
          }
        }
      }
    };
    
    // Use a more stable approach to avoid useInsertionEffect issues
    const handleError = (...args: any[]) => {
      try {
        // Check if this is a game session error that we should handle gracefully
        if (
          typeof args[0] === "string" &&
          (args[0].includes("WalletConnectionError: could not get Solana provider") ||
           args[0].includes("Invalid or expired game session") ||
           args[0].includes("Game creation failed"))
        ) {
          if (!errorShown) {
            // Queue the error for later processing
            errorQueue.push(args);
            errorShown = true;
          }
          return;
        }
        // Queue all other errors for later processing
        errorQueue.push(args);
      } catch (error) {
        // If there's an error in error handling, just ignore it
        // This prevents the error handler from breaking the app
      }
    };

    // Only override console.error if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.error = handleError;
      
      // Process the error queue using multiple strategies
      const processQueue = () => {
        processErrorQueue();
        // Schedule next processing
        if (errorQueue.length > 0) {
          if (window.requestIdleCallback) {
            window.requestIdleCallback(processQueue);
          } else {
            setTimeout(processQueue, 10);
          }
        }
      };
      
      // Start processing the queue
      if (window.requestIdleCallback) {
        window.requestIdleCallback(processQueue);
      } else {
        setTimeout(processQueue, 10);
      }
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
