"use client";

import { useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { HomeTab, WalletTab } from "~/components/ui/tabs";
import { LoadingScreen } from "~/components/ui/LoadingScreen";
import { USE_WALLET } from "~/lib/constants";
import { useNeynarUser } from "../hooks/useNeynarUser";
import { useFarcasterSDK } from "../hooks/useFarcasterSDK";

// --- Types ---
export enum Tab {
  Home = "home",
  Wallet = "wallet",
}

export interface AppProps {
  title?: string;
}

/**
 * App component serves as the main container for the mini app interface.
 * 
 * This component orchestrates the overall mini app experience by:
 * - Managing tab navigation and state
 * - Handling Farcaster mini app initialization
 * - Coordinating wallet and context state
 * - Providing error handling and loading states
 * - Rendering the appropriate tab content based on user selection
 * 
 * The component integrates with the Neynar SDK for Farcaster functionality
 * and Wagmi for wallet management. It provides a complete mini app
 * experience with multiple tabs for different functionality areas.
 * 
 * Features:
 * - Tab-based navigation (Home, Game, Wallet)
 * - Farcaster mini app integration
 * - Wallet connection management
 * - Error handling and display
 * - Loading states for async operations
 * 
 * @param props - Component props
 * @param props.title - Optional title for the mini app (defaults to "Neynar Starter Kit")
 * 
 * @example
 * ```tsx
 * <App title="My Mini App" />
 * ```
 */
export default function App(
  { title }: AppProps = { title: "DOBI BIRD" }
) {
  // --- State for localhost mode ---
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.Home);
  const [context, setContext] = useState<any>(null);

  // --- Hooks ---
  // Farcaster SDK initialization
  const { isReady: isFarcasterReady, isInitializing, error: sdkError, progress } = useFarcasterSDK();
  
  // Always call the hook, handle errors in useEffect
  const miniAppData = useMiniApp();

  const {
    isSDKLoaded: sdkLoaded,
    context: sdkContext,
    setInitialTab: _setInitialTab,
    setActiveTab: sdkSetActiveTab,
    currentTab: sdkCurrentTab,
  } = miniAppData;

  // --- Neynar user hook ---
  const { user: neynarUser } = useNeynarUser(sdkContext || undefined);

  // --- Effects ---
  /**
   * Initialize app state when Farcaster SDK is ready
   */
  useEffect(() => {
    if (isFarcasterReady) {
      setContext(sdkContext || null);
    }
  }, [isFarcasterReady, sdkContext]);

  /**
   * Handle useMiniApp errors gracefully
   */
  useEffect(() => {
    try {
      // This will throw if useMiniApp fails
      if (miniAppData && typeof miniAppData === 'object') {
        // Hook worked correctly
        // // console.log('useMiniApp loaded successfully');
      }
    } catch (error) {
      // console.error('useMiniApp error handled:', error);
      // Fallback is already handled by the hook itself
    }
  }, [miniAppData]);

  /**
   * Sets the initial tab to "home" when everything is ready.
   */
  useEffect(() => {
    if (isFarcasterReady) {
      setCurrentTab(Tab.Home);
    }
  }, [isFarcasterReady]);

  // sdk.actions.ready() is now handled in the main app.tsx file

  // Always use local state for tab management to avoid network issues
  const activeTab = currentTab;
  const setActiveTab = setCurrentTab;

  // --- Early Returns ---
  if (!isFarcasterReady || isInitializing) {
    return (
      <LoadingScreen 
        message="Cargando Flappy DOBI..."
        subMessage={isInitializing ? "Inicializando SDK de Farcaster..." : "Preparando el juego espacial"}
        showProgress={isInitializing}
        progress={progress}
      />
    );
  }

  // Show error state if SDK failed to initialize
  if (sdkError) {
    return (
      <LoadingScreen 
        message="Error de inicialización"
        subMessage={`${sdkError}. Continuando en modo local...`}
        showProgress={false}
      />
    );
  }

  // --- Render ---
  return (
    <div
      style={{
        paddingTop: context?.client?.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client?.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client?.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header should be full width */}
      <Header neynarUser={neynarUser} />

      {/* Main content and footer should be centered */}
      <div className="container py-2 pb-20">
        {/* Main title */}
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        {/* Tab content rendering */}
        {activeTab === Tab.Home && <HomeTab setActiveTab={setActiveTab} />}
        {activeTab === Tab.Wallet && <WalletTab />}

        {/* Footer with navigation */}
        <Footer activeTab={activeTab as Tab} setActiveTab={setActiveTab} showWallet={USE_WALLET} />
      </div>
    </div>
  );
}

