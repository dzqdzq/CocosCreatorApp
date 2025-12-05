/**
 * Interface for Preroll AdBreak API Callback
 */
export interface PrerollCallback {
  type: string;
  adBreakDone: (placementInfo: unknown) => void;
}