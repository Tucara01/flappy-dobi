import { Metadata } from "next";
import App from "./app";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";
import { sdk } from "@farcaster/miniapp-sdk";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default function Home() {
  // Call ready() as soon as the page loads
  if (typeof window !== 'undefined') {
    sdk.actions.ready().catch(() => {
      console.log('Running in localhost mode - Farcaster SDK not available');
    });
  }
  
  return (<App />);
}
