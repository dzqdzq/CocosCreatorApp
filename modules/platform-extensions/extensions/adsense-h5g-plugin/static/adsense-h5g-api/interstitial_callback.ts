import {InterstitialType} from './interstitial_type';

/**
 * Interface for Interstitial AdBreak API Callback
 */
export interface InterstitialCallback {
  type: InterstitialType;
  name: string;
  beforeAd: () => void;
  afterAd: () => void;
  adBreakDone: (placementInfo: unknown) => void;
}