/**
 * Interface for Rewarded AdBreak API Callback
 */
export interface RewardedCallback {
  type: string;
  name: string;
  beforeAd: () => void;
  afterAd: () => void;
  beforeReward: (showAdFn: () => void) => void;
  adDismissed: () => void;
  adViewed: () => void;
  adBreakDone: (placementInfo: unknown) => void;
}