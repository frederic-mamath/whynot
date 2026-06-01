import { usePostHog } from "posthog-react-native";

export type FunnelEvent =
  | { name: "sign_up_completed"; method: "email" | "google" | "apple" }
  | { name: "login_completed"; method: "email" | "google" | "apple" }
  | {
      name: "live_viewed";
      liveId: number;
      hostId: number;
      isSellerView: boolean;
    }
  | {
      name: "bid_placed";
      auctionId: string;
      liveId: number;
      amount: number;
    }
  | {
      name: "auction_won";
      auctionId: string;
      liveId: number;
      finalPrice: number;
    }
  | { name: "checkout_started"; orderId: string; amount: number }
  | { name: "purchase_completed"; orderId: string; amount: number };

export function useTrack(): (e: FunnelEvent) => void {
  const ph = usePostHog();
  return (e) => {
    const { name, ...props } = e;
    ph?.capture(name, props);
  };
}
