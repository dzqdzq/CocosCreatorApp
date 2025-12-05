import Ejs from 'ejs';
import { join } from 'path';

import metrics from './libs/metrics';
import { GoogleG4MetricsObserver, googleG4MetricsObserver } from './observers/google-metrics-observer-v4';
import { IGoogleG4Data } from '../@types/private';

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

    async 'query-google-v4-data'(): Promise<IGoogleG4Data> {
        return {
            htmlUrl: await googleG4MetricsObserver.getHtmlUrl(),
            firstTimestamp: googleG4MetricsObserver.time,
            reportEvents: googleG4MetricsObserver.getReportEvents(),
        };
    },

    async 'query-google-metrics-v4-html'() {
        // const googleG4ID = await Editor.Profile.getConfig('metrics', 'googleG4.id') || GoogleG4MetricsObserver.googleG4ID;
        const googleG4ID = GoogleG4MetricsObserver.googleG4ID;
        const indexHtmlPath = join(__dirname, '..', 'template', 'google-metrics-v4-report.ejs');
        const html = await Ejs.renderFile(indexHtmlPath, {
            googleG4ID,
        });
        return html;
    },
};

export function load() {
    metrics.register();
    void metrics.sync();
}

export function unload() {

}

