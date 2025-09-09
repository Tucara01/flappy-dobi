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
    // tell Warpcast the app is ready
    sdk.actions.ready();
  }, []);

  return <AppComponent title={title} />;
}
