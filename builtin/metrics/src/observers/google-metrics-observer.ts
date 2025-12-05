'use strict';

// Measurement Protocol 参数参考
// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters?hl=zh-cn

import { MetricsObserverBase } from './metrics-observer-base';
import { trackEventInfo, trackExceptionInfo, trackOptions } from '../interface';
import { sendHttpRequest as sendRequest } from './request';
import { logMgr } from '../libs/log';

const TrackingID = 'UA-60734607-3';

/**
 * 发送数据到统计服务器
 * @param data
 * @param debug
 */
function sendData(data: any, debug = false) {
    const time = Date.now();
    debug && logMgr.collectToFile(`send analytics: ${time}`, data);
    sendRequest({
        method: 'POST',
        host: 'www.google-analytics.com',
        path: '/collect',
        protocol: 'https',
        data: data,
    }, (error: Error | null) => {
        if (!error) {
            debug && logMgr.collectToFile(`send analytics done: ${time}`, data);
            return;
        }
        debug && logMgr.collectToFile(`send analytics fail: ${time}`, error);
    });
}

class GoogleMetricsObserver extends MetricsObserverBase {

    _trackID: string;

    constructor() {
        super();
        this._trackID = TrackingID;
    }

    /**
     * 记录事件
     * @param info
     * @param options
     */
    trackEvent(info: trackEventInfo, options: trackOptions) {
        if (info.sendToCocosAnalyticsOnly || info.sendToNewCocosAnalyticsOnly) {
            return;
        }
        if (!options.cid) {
            console.debug('Metrics: no valid client ID');
            return;
        }
        if (!info.category || !info.action) {
            console.debug('Metrics: no valid info');
            return;
        }

        const data: any = {
            v: 1,
            tid: this._trackID,
            cid: options.cid,
            uid: options.uid,
            t: 'event',
            ec: info.category,
            ea: info.action,
        };

        if (info.label) {
            data.el = info.label;
        }

        if (info.value) {
            // 必须是自然数（>= 0 的整数）
            data.ev = info.value;
        }

        options.debug && console.debug('send trackEvent analytics --->', JSON.stringify(data));

        sendData(data, options.debug);
    }

    /**
     * 记录异常
     * @param info
     * @param options
     */
    trackException(info: trackExceptionInfo, options: trackOptions) {
        if (!options.cid) {
            console.debug('Metrics: no valid client ID');
            return;
        }

        const data = {
            v: 1,
            tid: this._trackID,
            cid: options.cid,
            uid: options.uid,
            t: 'exception',
            exd: info.code + '-' + info.message,
            exf: 0,
        };

        options.debug && console.debug('send trackException analytics --->', JSON.stringify(data));

        sendData(data, options.debug);
    }

    /**
     * 发送 app 信息
     * @param {*} options
     */
    sendAppInfo(options: trackOptions) {
        const data = {
            v: 1,
            tid: this._trackID,
            cid: options.cid,
            uid: options.uid,
            t: 'screenView',
            an: 'CocosCreator',
            aid: 'com.cocos.creator',
            // @ts-ignore
            av: Editor.App.version,
            cd: 'Home',
            sc: 'start',
            // 屏幕大小，200字节
            sr: options.resolution || 'unknown',
            // 自定义维度，屏幕像素密度
            cd1: options.scaleFactor || '1',
            // 用户当前语言
            ul: Editor.I18n.getLanguage() || 'unknown',
            // 系统 ua
            ua: Editor.App.userAgent,
        };

        options.debug && console.debug('send sendAppInfo analytics --->', JSON.stringify(data));

        sendData(data, options.debug);
    }

    /**
     * 结束统计会话
     */
    close(options: trackOptions) {}
}

module.exports = new GoogleMetricsObserver();
