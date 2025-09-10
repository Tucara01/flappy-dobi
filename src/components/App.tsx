"use client";

import { useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { HomeTab, ActionsTab, ContextTab, WalletTab } from "~/components/ui/tabs";
import FlappyBirdGame from "./FlappyBirdGame";
import { USE_WALLET } from "~/lib/constants";
import { useNeynarUser } from "../hooks/useNeynarUser";

// --- Types ---
export enum Tab {
  Home = "home",
  Game = "game",
  Actions = "actions",
  Context = "context",
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
 * - Tab-based navigation (Home, Actions, Context, Wallet)
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
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.Home);
  const [context, setContext] = useState<any>(null);

  // --- Hooks ---
  let miniAppData;
  try {
    miniAppData = useMiniApp();
  } catch (err) {
    // If useMiniApp fails (like in localhost), use fallback
    miniAppData = {
      isSDKLoaded: false,
      context: null,
      setInitialTab: null,
      setActiveTab: setCurrentTab,
      currentTab: currentTab
    };
  }

  const {
    isSDKLoaded: sdkLoaded,
    context: sdkContext,
    setInitialTab,
    setActiveTab: sdkSetActiveTab,
    currentTab: sdkCurrentTab,
  } = miniAppData;

  // --- Neynar user hook ---
  const { user: neynarUser } = useNeynarUser(sdkContext || undefined);

  // --- Effects ---
  /**
   * Initialize app state for localhost mode
   */
  useEffect(() => {
    // Always initialize as loaded for localhost mode
    setIsSDKLoaded(true);
    setContext(sdkContext || null);
  }, [sdkContext]);

  /**
   * Sets the initial tab to "home" when the SDK is loaded.
   */
  useEffect(() => {
    if (isSDKLoaded) {
      // Always use local state for tab management in localhost mode
      setCurrentTab(Tab.Home);
    }
  }, [isSDKLoaded]);

  // Always use local state for tab management to avoid network issues
  const activeTab = currentTab;
  const setActiveTab = setCurrentTab;

  // --- Early Returns ---
  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p>Loading SDK...</p>
        </div>
      </div>
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
        {activeTab === Tab.Home && <HomeTab />}
        {activeTab === Tab.Game && <FlappyBirdGame />}
        {activeTab === Tab.Actions && <ActionsTab />}
        {activeTab === Tab.Context && <ContextTab />}
        {activeTab === Tab.Wallet && <WalletTab />}

        {/* Footer with navigation */}
        <Footer activeTab={activeTab as Tab} setActiveTab={setActiveTab} showWallet={USE_WALLET} />
      </div>
    </div>
  );
}

