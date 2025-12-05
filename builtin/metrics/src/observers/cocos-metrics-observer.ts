'use strict';

import { MetricsObserverBase } from './metrics-observer-base';
import { trackEventInfo, trackExceptionInfo, trackOptions } from '../interface';
import { logMgr } from '../libs/log';

const encrypt = require('./cocos-encrypt');
const uuid = require('node-uuid');

/**
 * 创建参数
 *
 * @param trackExceptionInfo 记录事件的信息
 * @param options 记录的参数
 */
function createParam(trackExceptionInfo: trackEventInfo | {}, options: trackOptions) {
    // cocos analytics 的 appid
    const analyticsID = '681395864';
    return {
        // @ts-ignore
        appVersion: Editor.App.version,
        // apiURL: caURL,
        versionCode: 'v1',
        uniqueID: options.uid,
        appID: analyticsID,
        channelID: '100000',
        platform: process.platform === 'darwin' ? 'Mac' : 'Windows',
        engine: 'electron',
        userID: options.uid,
        resolution: options.resolution || 'unknown', // 逻辑像素
        scaleFactor: options.scaleFactor || '1', // 屏幕像素密度

        // 获取不到对应系统版本，可以通过下面这个API可以获取一个版本号，再去 https://en.wikipedia.org/wiki/Uname#Examples 查看
        osVersion: require('os').version(),
        manufacturer: '',
        store: 'unknown',
        age: 0,
        sex: 0,
        callNumber: options.useTestServer ? 'demo.cocos.com' : 'creator.cocos.com',
        model: null,

        msgID: uuid.v4(),
        chargeTime: String((Date.now() / 1000) | 0),
        language: Editor.I18n.getLanguage() || 'unknown',
    };
}

/**
 * 发送数据到统计服务器
 *
 * @param url 发送的目的 url
 * @param str
 * @param debug 是否打印 log
 */
async function sendData(url: string, str: string, debug = false) {
    // 如果没有 debug 参数，出错了也不打印 log，毕竟收集信息是比较敏感的，用户无感知最好
    const time = Date.now();
    debug && logMgr.collectToFile(`send cocos analytics: ${time}`, str);
    try {
        await Editor.Network.post(url, str);
        debug && logMgr.collectToFile(`send cocos analytics done: ${time}`, str);
    } catch (error) {
        debug && logMgr.collectToFile(`send cocos analytics fail: ${time}`, error);
    }
}

class CocosMetricsObserver extends MetricsObserverBase {

    _caURL: string;

    constructor() {
        super();
        // cocos analytics 上传的 url
        this._caURL = 'https://logstorage.cocos.com/log/v2?';
    }

    /**
     * 记录事件
     *
     * @param info 记录事件的信息
     * @param options 记录的参数
     */
    trackEvent(info: trackEventInfo, options: trackOptions) {
        if (!options.cid) {
            console.debug('Metrics: no valid client ID');
            return;
        }
        (info.sendToCocosAnalyticsOnly || info.sendToNewCocosAnalyticsOnly) ? this.trackCocosEvent(info, options) : this.trackNormalEvent(info, options);
    }

    /**
     * 用来发跟谷歌一样的数据
     * @param info
     * @param options
     * @private
     */
    private trackNormalEvent(info: trackEventInfo, options: trackOptions) {
        const value = { ...info.opts || info.value || {} };

        value.action = info.action;
        info.label && (value.label = info.label);

        // 如果 opts 里有 eventTag 则忽略外面的 eventTag
        let eventTag = 'succeed';
        if (info.opts && info.opts.eventTag) {
            eventTag = info.opts.eventTag;
            delete value.eventTag;
        }

        const data: any = createParam(info, options);
        data.eventID = info.category;
        data.eventValue = value;
        data.eventTag = eventTag;

        if (info.exitTag) {
            data.exitTag = info.exitTag;
            data.eventTag = info.exitTag;
        }

        info.onlineDuration && (data.onlineDuration = info.onlineDuration);
        delete info.onlineDuration;

        options.debug && console.debug('send cocos analytics --->', JSON.stringify(data));

        sendData(this._caURL, encodeURIComponent(encrypt.encryptPostData(JSON.stringify(data))), options.debug);
    }

    /**
     * 用来别的 cocos 发统计数据
     * @param info
     * @param options
     * @private
     */
    private trackCocosEvent(info: trackEventInfo, options: trackOptions) {
        if (info.sendToNewCocosAnalyticsOnly) {
            delete info.sendToCocosAnalyticsOnly;
            this.trackNewCocosEvent(info, options);
            return;
        }
        if (!info.eventId) {
            console.debug('Metrics: no valid eventId');
            return;
        }

        // 删除无用的字段
        delete info.sendToCocosAnalyticsOnly;

        const data: any = createParam(info, options);

        // 处理下结构
        if (info.store) {
            data.store = info.store;
            delete info.store;
        }
        if (info.packageName) {
            data.packageName = info.packageName;
            delete info.packageName;
        }
        const eventId = info.eventId;
        delete info.eventId;

        data.eventID = eventId;
        data.eventValue = info;
        data.eventTag = 'succeed';// 都用succeed

        info.onlineDuration && (data.onlineDuration = info.onlineDuration);
        delete info.onlineDuration;

        options.debug && console.debug('send cocos analytics --->', JSON.stringify(data));

        sendData(this._caURL, encodeURIComponent(encrypt.encryptPostData(JSON.stringify(data))), options.debug);
    }

    trackNewCocosEvent(info: trackEventInfo, options: trackOptions) {
        // 删除无用的字段
        delete info.sendToNewCocosAnalyticsOnly;
        const data: any = createParam(info, options);
        data.eventID = info.category;
        data.eventValue = info.value;
        if (data.eventValue && info.projectID) {
            data.eventValue.projectID = info.projectID;
        }
        options.debug && console.debug('send cocos analytics --->', JSON.stringify(data));
        data.eventTag = 'successed';
        sendData(this._caURL, encodeURIComponent(encrypt.encryptPostData(JSON.stringify(data))), options.debug);
    }

    /**
     * 记录异常
     *
     * @param info 记录事件的信息
     * @param options 记录的参数
     */
    trackException(info: trackExceptionInfo, options: trackOptions) {
        if (!options.cid) {
            console.debug('Metrics: no valid client ID');
            return;
        }
        const data: any = createParam({}, options);

        data.eventID = 'exception';
        data.eventValue = {
            code: info.code,
            desc: info.message,
        };
        data.eventTag = 'succeed';

        sendData(this._caURL, encodeURIComponent(JSON.stringify(data)), options.debug);
    }

    /**
     * 发送 app 信息
     * @param {*} options
     */
    sendAppInfo(options: trackOptions) {}

    /**
     * 结束统计会话
     */
    close(options: trackOptions) {}

    /**
     * 统计崩溃事件
     * @param info
     * @param options
     * @return data
     */
    async _trackCrashEvent(info: trackEventInfo, options: trackOptions) {
        try {
            const data: any = createParam(info, options);
            data.eventID = info.category;
            data.eventValue = info.value;
            if (data.eventValue && info.projectID) {
                data.eventValue.projectID = info.projectID;
            }
            options.debug && console.debug('send cocos analytics --->', JSON.stringify(data));
            data.eventTag = 'successed';
            const str = encodeURIComponent(encrypt.encryptPostData(JSON.stringify(data)));
            // 如果没有 debug 参数，出错了也不打印 log，毕竟收集信息是比较敏感的，用户无感知最好
            options.debug && console.debug('receive cocos analytics data -->', str);
            await Editor.Network.post(this._caURL, str);
            return data;
        } catch (error) {
            options.debug && console.debug('send cocos analytics data fail', error);
            throw error;
        }
    }

}

module.exports = new CocosMetricsObserver();
