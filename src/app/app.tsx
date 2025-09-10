"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { APP_NAME } from "~/lib/constants";

// dynamic import for components that use the Frame SDK
const AppComponent = dynamic(() => import("~/components/App"), {
  ssr: false,
});

export default function App(
  { title }: { title?: string } = { title: APP_NAME }
) {
  useEffect(() => {
    // Call ready() after the component is mounted and DOM is ready
    const initializeApp = async () => {
      // Wait for the next tick to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 0));
      
      try {
        await sdk.actions.ready();
        console.log('Farcaster Mini App is ready - DOM loaded');
      } catch (err) {
        console.log('Running in localhost mode - Farcaster SDK not available');
      }
    };
    
    initializeApp();
  }, []);

  return <AppComponent title={title} />;
}
