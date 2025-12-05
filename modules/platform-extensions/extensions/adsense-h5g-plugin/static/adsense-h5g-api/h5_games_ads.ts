import {game} from 'cc';

import {InterstitialCallback} from './interstitial_callback';
import {RewardedCallback} from './rewarded_callback';
import {PrerollCallback} from './preroll_callback';
import {InterstitialAdEvent, PrerollAdEvent, RewardedVideoAdEvent} from './ad_event';
import {InterstitialType} from './interstitial_type';

// This is needed since there're no definition for AdSense object here.
// tslint:disable-next-line:no-any
const ADS_BY_GOOGLE = (window as any).adsbygoogle;
type AdBreakCallback = InterstitialCallback|RewardedCallback|PrerollCallback;

const adBreak =
(o: AdBreakCallback) => {
  ADS_BY_GOOGLE.push(o);
};

let showRewardedAdFn : (() => void) | null;

/**
 * API to show Preroll Ad when available.
 * If there are no ad available this function will request an ad.
 */
export function  showPrerollAd(){
    try {
        const game_instance = game;
        adBreak({
            type: 'preroll',
            adBreakDone: (placementInfo: any) => {
                game_instance.emit(PrerollAdEvent.AD_BREAK_DONE);
            },
         });
    } catch(e) {
        console.log(e)
    }
}

/**
 * API to show Interstitial Ad when available.
 * If there are no ad available this function will request an ad.
 */
export function showInterstitialAd(type: InterstitialType, name: string) {
  try {
    const gameInstance = game;
    adBreak({
      type,
      name,
      beforeAd: () => {
        gameInstance.emit(InterstitialAdEvent.BEFORE_AD);
      },
      afterAd: () => {
        gameInstance.emit(InterstitialAdEvent.AFTER_AD);
      },
      adBreakDone: (placementInfo: unknown) => {
        gameInstance.emit(InterstitialAdEvent.AD_BREAK_DONE);
      },
    });
  } catch (e) {
    console.log(e);
  }
}

/**
 * API to request Rewarded Ad.
 * To show the Rewarded Ad you could call showRewardedAd after
 * beforeReward callback.
 */
export function requestRewardedAd(name: string) {
  try {
    const gameInstance = game;
    adBreak({
      type: 'reward',
      name,
      beforeAd: () => {
        gameInstance.emit(RewardedVideoAdEvent.BEFORE_AD);
      },
      afterAd: () => {
        gameInstance.emit(RewardedVideoAdEvent.AFTER_AD);
      },
      adBreakDone: (placementInfo: unknown) => {
        gameInstance.emit(RewardedVideoAdEvent.AD_BREAK_DONE);
      },
      beforeReward: (showAdFn: () => void) => {
        showRewardedAdFn = showAdFn;
        gameInstance.emit(RewardedVideoAdEvent.BEFORE_REWARD);
      },
      adDismissed: () => {
        gameInstance.emit(RewardedVideoAdEvent.AD_DISMISSED);
      },
      adViewed: () => {
        gameInstance.emit(RewardedVideoAdEvent.AD_VIEWED);
      },
    });
  } catch (e) {
    console.log(e);
  }
}

/**
 * API to show Rewarded Ad when available.
 */
export function showRewardedAd() {
  if (!showRewardedAdFn) {
    console.log('No Rewarded Ad available');
    return;
  }
  showRewardedAdFn();
  showRewardedAdFn = null;
}
