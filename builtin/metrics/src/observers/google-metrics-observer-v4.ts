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

import { readJSONSync } from 'fs-extra';
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
import {
    BaseEventInfo,
    IGoogleG4Event,
    IGoogleG4Params,
    IGoogleG4SendData,
    IGoogleG4Table,
} from '../../@types/private';
import { join } from 'path';
import { session } from 'electron';

const headers = {
    'Content-Type': 'application/json',
    'User-Agent': '',
};

let g4Table: { [key: string]: IGoogleG4Table };
export class GoogleG4MetricsObserver extends MetricsObserverBase {

    static get googleG4ID() {
        return 'G-JXC4Z86YBG';
    }

    public DEBUG = false;

    session_id = '';

    params: BaseEventInfo = {
        app_name: '',
        app_id: '',
        app_version: '',
        scale_factor: '',
        language: '',
        arch: '',
    };

    // 用于计算 engagement_time_msec
    time = Date.now();
    firstTime = new Date();

    public _reportEvents: IGoogleG4Event[] = [];

    htmlUrl = '';
    public async getHtmlUrl(): Promise<string> {
        if (!this.htmlUrl) {
            // a032ffca62d9edac706b578840ab182b 是 md5('google-metrics-v4-report')
            const port = await Editor.Message.request('server', 'query-port') || 7456;
            this.htmlUrl = `http://localhost:${port}/a032ffca62d9edac706b578840ab182b/index.html`;
            this.limitGoogleG4Request(this.htmlUrl);
        }
        return this.htmlUrl;
    }

    /**
     * 加点校验以防这个页面被误打开
     */
    public limitGoogleG4Request(htmlUrl: string) {
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            if (details.url.startsWith(htmlUrl)) {
                // 这个 '2c2d5f6b07c59e4a4595501a71e93b7c' 是 md5('https://www.cocos.com/') 转后的数值;
                details.requestHeaders['x-custom-header'] = '2c2d5f6b07c59e4a4595501a71e93b7c';
            }
            callback({ requestHeaders: details.requestHeaders });
        });
    }

    /**
     * 获取后会被清除
     */
    getReportEvents(): IGoogleG4Event[] {
        const reportEvents = JSON.parse(JSON.stringify(this._reportEvents));
        this._reportEvents.length = 0;
        return reportEvents;
    }

    /**
     * 记录事件
     * @param info
     * @param options
     */
    public trackEvent(info: trackEventInfo, options: trackOptions) {
        if (info.sendToCocosAnalyticsOnly) return;

        if (!options.cid) {
            console.debug('Metrics: no valid client ID, trackEventInfo: ', info);
            return;
        }
        if (!info.category) {
            console.debug('Metrics: no valid info. trackEventInfo: ', info);
            return;
        }

        // editor + A100002 表示统计用户时长，这个是给 cocos 统计的，google 不需要
        if (info.category === 'editor' && info.value['A100002'] !== undefined) {
            return;
        }

        if (!g4Table) {
            g4Table = readJSONSync(join(__dirname, '../../statics/googleG4Table.json'));
        }

        const category = info.category;
        const copyInfo = Object.assign({}, info);
        delete copyInfo.sendToGoogleG4;
        delete copyInfo.sendToNewCocosAnalyticsOnly;
        delete copyInfo.category;

        let eventName = info.action ? `${category}_${info.action}` : category;
        let events: IGoogleG4Event[] = [];
        let replaceKey = '';
        if (typeof copyInfo.value === 'object') {
            delete copyInfo.value.projectID;
            // 这里对 A10001_PanelNam | B10001_Name or B10002 解析
            // 然后重新设置 action 跟 label 值，并查询 category + A10001 | B10002 是否有映射表，
            // 如有就替换成映射表的值
            Object.keys(copyInfo.value).forEach((item: string) => {
                if (item === 'project_id') {
                    // 跳过 project_id 因为已经有记录了
                    return;
                }
                const value = copyInfo.value[item];
                const newInfo: IGoogleG4Params = Object.assign({
                    action: category,
                    value: value,
                    count: value,
                    time: value,
                    baseKey: item,
                });

                let keys: string[] = item.split('_');
                keys = keys.length > 1 ? keys : [item];
                if (item.startsWith('A')) {
                    newInfo.action = keys[0];
                    if (keys[1] !== undefined) {
                        newInfo.label = keys[1];
                    }
                    replaceKey = `${category}_${keys[0]}`;
                } else {
                    eventName = category;
                    newInfo.action = category;
                    newInfo.label = item;
                    replaceKey = `${category}_${keys[0]}`;
                }
                const replaceInfo: IGoogleG4Table = g4Table[`${replaceKey}_${keys[1]}`] || g4Table[replaceKey];
                if (replaceInfo) {
                    newInfo.action = replaceInfo.action;
                    if (replaceInfo.label.includes('{*}')) {
                        newInfo.label = replaceInfo.label.replace(/{\*}/g, keys[1] ?? value);
                    } else if (replaceInfo.label) {
                        newInfo.label = replaceInfo.label;
                    }
                }
                events = events.concat(this.createNewEvent(category, newInfo));
            });
        } else {
            events = [this.createNewEvent(eventName, copyInfo)];
        }
        this.sendToGA4(this.createNewData(options, events));
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
        this.DEBUG = options.debug !== undefined ? options.debug : this.DEBUG;
        const { App, I18n } = this.getEditor();
        // init
        headers['User-Agent'] = App.userAgent;
        // 创建新的会话 ID
        this.time = Date.now();
        this.firstTime = new Date();
        this.session_id = options.uid + '_' + this.time;

        this.params = {
            // 应用名称
            app_name: Editor.App.name,
            // 应用 id
            app_id: 'com.cocos.creator',
            // @ts-ignore 应用版本
            app_version: App.version,
            // 自定义维度，屏幕像素密度
            scale_factor: options.scaleFactor || '1',
            // 用户当前语言
            language: I18n.getLanguage() || 'unknown',
            // 操作系统 CPU 架构
            arch: process.arch,
        };
    }

    /**
     * 结束统计会话
     */
    close(options: trackOptions) {
        const data = this.createNewData(options, [
            this.createNewEvent('close', {
                action: 'close',
            }),
        ]);
        this.sendToGA4(data);
    }

    private getEditor() {
        return Editor;
    }

    private createNewData(options: trackOptions, events?: IGoogleG4Event[]) {
        return {
            client_id: options.cid + '',
            user_id: options.uid + '', // 需要字符串
            timestamp_micros: (Date.now() * 1000) + '',
            events: events || [],
        };
    }

    private createNewEvent(name: string, value: any): IGoogleG4Event {
        // 空格剔除
        name = name.replace(/ +/g, '');
        // ga4 限制只允许使用字母数字字符和下划线，其他转成 '_'
        name = name.replace(/[^A-Za-z0-9_]/g, '_');
        return {
            'name': name,
            'params': Object.assign({}, this.params, value),
        };
    }

    /**
     * 发送数据到统计服务器
     * @param data
     */
    private sendToGA4(data: IGoogleG4SendData) {
        this.DEBUG && console.debug('start analytics... ', JSON.stringify(data));
        // 改用 web 的方式发送
        this._reportEvents = this._reportEvents.concat(data.events);
        this.DEBUG && logMgr.collectToFile(`[sendToGA4]`, JSON.stringify(data.events));
        Editor.Message.broadcast('metrics:google-v4-report-change');
    }

    private sendToNormalGA4(data: IGoogleG4SendData) {
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

    private sendToDebugGA4(data: IGoogleG4SendData) {
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

export const googleG4MetricsObserver = new GoogleG4MetricsObserver();

