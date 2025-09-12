"use client";

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface SDKState {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  progress: number;
}

export function useFarcasterSDK() {
  const [state, setState] = useState<SDKState>({
    isReady: false,
    isInitializing: false,
    error: null,
    progress: 0,
  });

  useEffect(() => {
    let isMounted = true;
    
    const initializeSDK = async () => {
      try {
        setState(prev => ({ ...prev, isInitializing: true, error: null, progress: 10 }));
        
        // Check if we're in a Farcaster environment
        if (typeof window === 'undefined') {
          setState(prev => ({ ...prev, isReady: true, isInitializing: false, progress: 100 }));
          return;
        }

        // Simulate initialization steps
        const steps = [
          { progress: 20, message: 'Inicializando SDK...' },
          { progress: 40, message: 'Conectando con Farcaster...' },
          { progress: 60, message: 'Configurando autenticación...' },
          { progress: 80, message: 'Preparando interfaz...' },
        ];

        for (const step of steps) {
          if (!isMounted) return;
          
          setState(prev => ({ ...prev, progress: step.progress }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Call sdk.actions.ready()
        if (isMounted) {
          setState(prev => ({ ...prev, progress: 90 }));
          
          try {
            // Add a timeout to prevent hanging
            const readyPromise = sdk.actions.ready();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('SDK ready timeout')), 5000)
            );
            
            await Promise.race([readyPromise, timeoutPromise]);
            // // console.log('Farcaster SDK ready successfully');
          } catch (sdkError) {
            // console.warn('Farcaster SDK not available or user rejected:', sdkError);
            // This is expected in localhost mode or when user rejects, so we don't treat it as an error
          }

          if (isMounted) {
            setState(prev => ({ 
              ...prev, 
              isReady: true, 
              isInitializing: false, 
              progress: 100 
            }));
          }
        }
      } catch (error) {
        if (isMounted) {
          // console.error('Error initializing Farcaster SDK:', error);
          setState(prev => ({ 
            ...prev, 
            isReady: true, // Still allow the app to work
            isInitializing: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            progress: 100
          }));
        }
      }
    };

    initializeSDK();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
