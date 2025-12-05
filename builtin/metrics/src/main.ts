// @ts-ignore
import packageJSON from '../package.json';

import metrics from './libs/metrics';

export const methods: { [key: string]: (...any: any) => any } = {

    async init() {
        await metrics.init();
    },

    /**
     * 记录一个事件
     * @param index
     */
    trackEvent(index: number) {
        metrics.trackEvent(index);
    },

    /**
     * 结束统计事件
     */
    close() {
        metrics.close();
    },

    /**
     * 记录一个异常
     * @param index
     */
    trackException(index: number) {
        metrics.trackException(index);
    },

    trackProcessMemory(index: number) {
        metrics.trackProcessMemory(index);
    },

    trackTimeStart(trackTimeStartMap: Map<string, number>) {
        metrics.trackTimeStart();
    },

    trackTimeEnd(index: number) {
        return metrics.trackTimeEnd(index);
    },

    trackProcessMemoryStart(index: number) {
        metrics.trackProcessMemoryStart(index);
    },

    trackProcessMemoryEnd(index: number): Promise<number> {
        return metrics.trackProcessMemoryEnd(index);
    },

    _trackEventWithTimer(index: number) {
        metrics._trackEventWithTimer(index);
    },

    _sendEventGroup() {
        metrics._sendEventGroup();
    },

    /**
     * 统计崩溃事件
     * @return data
     * @param index
     */
    async _trackCrashEvent(index: number) {
        return await metrics._trackCrashEvent(index);
    },
};

export function load() {
    metrics.register();
    metrics.sync();
}

export function unload() {

}

