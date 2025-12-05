'use strict';
/**
 * Measurement Protocol v2
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4
 * 事件参考
 * https://support.google.com/analytics/answer/9234069
 * 用户维度参考
 * https://support.google.com/analytics/answer/9268042
 * 调试工具
 * https://ga-dev-tools.web.app/ga4/event-builder/
 */

// 1. 在 Measurement Protocol v2 正式发布后，根据文档
//    正确填充 user_properties，提供版本号、操作系统、操作系统版本、编辑器语言等信息。在启动、推出时设置正确的事件参数，以准确标记会话的开始和结束。
// 2. 或者对 [gtag.js](https://www.googletagmanager.com/gtag/js?id=G-GLCT09215F) 进行抓包，查看相应请求参数。

import { MetricsObserverBase } from './metrics-observer-base';
import { trackEventInfo, trackExceptionInfo, trackOptions } from '../interface';

const MeasurementId = 'G-JXC4Z86YBG';
const ApiSecret = 'OtGhpiWGSCmHl0xjL1P5TQ';
const QueryParams = `?&measurement_id=${MeasurementId}&api_secret=${ApiSecret}`;
const HOST = 'www.google-analytics.com';
const PATH = `/mp/collect${QueryParams}`;
const Debug_PATH = `/debug/mp/collect${QueryParams}`;

import { sendHttpRequest as sendRequest } from './request';
import { logMgr } from '../libs/log';

const headers = {
    'Content-Type': 'application/json',
    'User-Agent': '',
};

class GoogleMetricsObserver extends MetricsObserverBase {
    public DEBUG = false;

    session_id = '';

    // 用于计算 engagement_time_msec
    time = Date.now();

    /**
     * 记录事件
     * @param info
     * @param options
     */
    public trackEvent(info: trackEventInfo, options: trackOptions) {
        if (info.sendToCocosAnalyticsOnly || info.sendToNewCocosAnalyticsOnly) {
            return;
        }
        if (!options.cid) {
            console.debug('Metrics: no valid client ID, trackEventInfo: ', info);
            return;
        }
        if (!info.category) {
            console.debug('Metrics: no valid info. trackEventInfo: ', info);
            return;
        }

        const category = info.category;
        const copyInfo = Object.assign({}, info);
        delete copyInfo.category;
        this.sendToGA4(this.createNewData(options, [
            this.createNewEvent(`${category}_${info.action}`, copyInfo),
        ]));
    }

    /**
     * 记录异常
     * @param info
     * @param options
     */
    public trackException(info: trackExceptionInfo, options: trackOptions) {
        if (!options.cid) {
            console.debug('Metrics: no valid client ID, trackEventInfo: ', options);
            return;
        }

        this.sendToGA4(this.createNewData(options, [
            this.createNewEvent('exception', {
                'description': info.code + '-' + info.message,
                'fatal': true,
            }),
        ]));
    }

    /**
     * 发送 app 信息
     * @param {*} options
     */
    public sendAppInfo(options: trackOptions) {
        this.DEBUG = options.debug || false;
        const { App, I18n } = this.getEditor();
        // init
        headers['User-Agent'] = App.userAgent;
        // 创建新的会话 ID
        this.time = Date.now();
        this.session_id = options.uid + '_' + this.time;

        const data = this.createNewData(options, [
            this.createNewEvent('app_info', {
                // 统计会话时长
                engagement_time_msec: 0,
                tid: MeasurementId,
                // 应用名称
                app_name: 'CocosCreator',
                // 应用 id
                app_id: 'com.cocos.creator',
                // @ts-ignore 应用版本
                app_version: App.version,
                // 屏幕大小
                screen_resolution: options.resolution || 'unknown',
                // 自定义维度，屏幕像素密度
                scale_factor: options.scaleFactor || '1',
                // 用户当前语言
                language: I18n.getLanguage() || 'unknown',
                // 系统 ua
                user_agent: App.userAgent,
                // 操作系统 CPU 架构
                arch: process.arch,
                // 当前系统
                // @ts-ignore
                operating_system: ({
                    'darwin': 'Macintosh',
                    'win32': 'Windows',
                    'linux': 'Linux',
                })[process.platform] || process.platform,
            }),
        ]);
        this.sendToGA4(data);
    }

    /**
     * 结束统计会话
     */
    close(options: trackOptions) {
        const data = this.createNewData(options, [
            this.createNewEvent('close', {}),
        ]);
        this.sendToGA4(data);
    }

    private getEditor() {
        // Test code
        // if (typeof Editor === 'undefined') {
        //     return {
        //         App: {
        //             version: '3.8.0-test',
        //             userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) CocosCreator/3.6.2 Chrome/91.0.4472.106 Electron/13.1.4 Safari/537.36"
        //         },
        //         I18n: {
        //             getLanguage() {
        //                 return 'zh'
        //             }
        //         }
        //     }
        // }
        return Editor;
    }

    private createNewData(options: trackOptions, events?: { name: string; params: any }[]) {
        return {
            client_id: options.cid + '',
            user_id: options.uid + '', // 需要字符串
            timestamp_micros: (Date.now() * 1000) + '',
            events: events || [],
        };
    }

    private createNewEvent(name: string, value: any) {
        // 空格剔除
        name = name.replace(/ +/g, '');
        return {
            // ga4 限制只允许使用字母数字字符和下划线，其他转成 '_'
            'name': name.replace(/[^A-Za-z0-9_]/g, '_'),
            'params': Object.assign({
                'session_id': this.session_id,
                'engagement_time_msec': (Date.now() - this.time),
            }, value),
        };
    }

    /**
     * 发送数据到统计服务器
     * @param data
     */
    private sendToGA4(data: Record<string, any>) {
        this.DEBUG && console.debug('start analytics... ', JSON.stringify(data));
        if (this.DEBUG) {
            this.sendToDebugGA4(data);
        } else {
            this.sendToNormalGA4(data);
        }
    }

    private sendToNormalGA4(data: Record<string, any>) {
        const sendOptions = {
            method: 'POST',
            protocol: 'https',
            host: HOST,
            path: PATH,
            headers: headers,
            data: JSON.stringify(data),
            useStringifyData: false,
        };
        const time = Date.now();
        this.DEBUG && logMgr.collectToFile(`[send analytics ga4]: ${time}`, data);
        sendRequest(sendOptions, (err, content) => {
            if (err) {
                this.DEBUG && logMgr.collectToFile(`[send analytics ga4 fail]: ${time}`, err);
                return;
            }
            this.DEBUG && logMgr.collectToFile(`[send analytics ga4 done]: ${time}`, data);
        });
    }

    private sendToDebugGA4(data: Record<string, any>) {
        const sendOptions = {
            method: 'POST',
            protocol: 'https',
            host: HOST,
            path: Debug_PATH,
            headers: headers,
            data: JSON.stringify(data),
            useStringifyData: false,
        };
        sendRequest(sendOptions, (err, content) => {
            try {
                if (err) {
                    console.debug(err);
                    return;
                }
                const result = JSON.parse(content);
                const validationMessages = result['validationMessages'];
                if (!validationMessages || validationMessages.length > 0) {
                    console.debug(`sending failure.\n`, validationMessages, JSON.stringify(data));
                    return;
                }
                this.sendToNormalGA4(data);
            } catch (e) {
                console.debug('sending failure. \n', `error: \n`, e, `content: \n`, content);
            }
        });
    }
}

module.exports = new GoogleMetricsObserver();
