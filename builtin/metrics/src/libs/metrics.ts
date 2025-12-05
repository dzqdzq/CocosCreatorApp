import { getMainDisplay, getClientID } from '../utils';
import {
    trackOptions,
    trackEventInfo,
    trackExceptionInfo,
    trackWithTimerEventInfo,
    MetricsData,
    trackTimeEndOptions,
    trackTimeEndInfo,
    MetricsInitInfo,
    IAsyncFunction,
    trackMemoryUsageInfo,
} from '../interface';

import { logMgr } from './log';

export class Metrics {
    // 客户端 cid
    private _clientID = '';
    // 客户端登陆的用户 uid
    private _userID = '';
    // 是否打开 log 调试
    private _metricsDebugMode = false;
    private _init = false;
    private _eventGroup: Record<string, any> = {};
    private _timer?: NodeJS.Timeout;
    private _metricsObservers: any[] = [];
    private get trackInfoList(): MetricsData[] {
        return Editor.Metrics.__protected__.getTrackInfoList();
    }

    private get trackTimeStartMap(): Map<string, number> {
        return Editor.Metrics.__protected__.getTrackTimeStartMap();
    }

    private get processMemoryMap(): Map<string, number> {
        return Editor.Metrics.__protected__.getProcessMemoryMap();
    }

    private get metricInitData(): MetricsInitInfo {
        return Editor.Metrics.__protected__.getMetricInitData();
    }
    private set metricInitData(val: any) {
        Editor.Metrics.__protected__.setMetricInitData(val);
    }

    private get trackAwaitHandler(): IAsyncFunction[] {
        return Editor.Metrics.__protected__.getTrackAwaitHandler();
    }

    private replyAsyncFunction(index: number, err: Error | null, result: any) {
        const idx = this.trackAwaitHandler.findIndex((info: IAsyncFunction) => info.index === index);
        const handler = this.trackAwaitHandler[idx];
        if (handler) {
            this.trackAwaitHandler.splice(idx, 1);
            if (err) {
                handler.reject(err);
            } else {
                handler.resolve(result);
            }
        }
    }

    /**
     * 增加一个统计服务
     * @param {*} metricsObserver
     */
    private addMetricsObserver(metricsObserver: any) {
        if (this._metricsObservers.includes(metricsObserver)) return;

        this._metricsObservers.push(metricsObserver);
    }

    /**
     * 通过 time 获取 map 的数据，并且删除掉
     */
    private getTrackInfoMapByTime(index: number): MetricsData | undefined {
        const idx = this.trackInfoList.findIndex((trackInfo: MetricsData) => trackInfo.index === index);
        const data: MetricsData | undefined = this.trackInfoList[idx];
        if (data) {
            this.trackInfoList.splice(idx, 1);
            return data;
        }
    }

    public register() {
        const __protected__ = Editor.Metrics.__protected__;
        __protected__.register('init', this.init.bind(this));
        __protected__.register('clear', this.clear.bind(this));
        __protected__.register('close', this.close.bind(this));
        __protected__.register('trackEvent', this.trackEvent.bind(this));
        __protected__.register('trackException', this.trackException.bind(this));
        __protected__.register('trackProcessMemory', this.trackProcessMemory.bind(this));
        __protected__.register('trackTimeStart', this.trackTimeStart.bind(this));
        __protected__.register('trackTimeEnd', this.trackTimeEnd.bind(this));
        __protected__.register('trackProcessMemoryStart', this.trackProcessMemoryStart.bind(this));
        __protected__.register('trackProcessMemoryEnd', this.trackProcessMemoryEnd.bind(this));
        __protected__.register('_trackEventWithTimer', this._trackEventWithTimer.bind(this));
        __protected__.register('_sendEventGroup', this._sendEventGroup.bind(this));
        __protected__.register('_trackCrashEvent', this._trackCrashEvent.bind(this));

        setInterval(() => {
            this.sync();
        }, 1000 * 60 * 30); // 30分钟 = 1000毫秒 * 60秒 * 30分钟
    }

    /**
     * 同步，把插件之前统计的数据，一同发上去，避免遗漏
     */
    public async sync() {
        if (this.metricInitData) {
            await this.init();
            this.metricInitData = undefined;
        }
        const tempTrackInfoList = [...this.trackInfoList];
        for (let i = 0; i < tempTrackInfoList.length; i++) {
            const trackInfo = tempTrackInfoList[i];
            const index = trackInfo.index;
            const func = this[trackInfo.funcName as keyof Metrics];
            if (!func) {
                console.debug(`Function not queried ${trackInfo.funcName}`);
                continue;
            }
            let result = null, err = null;
            try {
                const isAsyncFunction = func.constructor.name === 'AsyncFunction';
                result = isAsyncFunction ? await Promise.resolve(func.bind(this)(index)) : func.bind(this)(index);
            } catch (e: any) {
                err = new Error(e.message);
            }
            this.replyAsyncFunction(index, err, result);
        }
        Editor.Metrics.__protected__.reset();
    }

    protected clear() {
        logMgr.collectToFile(`[clear]`, JSON.stringify({
            trackInfoList: this.trackInfoList,
            trackAwaitHandler: this.trackAwaitHandler,
        }));
    }

    public async init() {
        if (!this.metricInitData) return;
        const { outputMetricLog } = this.metricInitData;

        this._clientID = await getClientID();
        const userInfo = await Editor.User.getData();
        this._userID = userInfo && userInfo.cocos_uid ? userInfo.cocos_uid : '-1';
        this._metricsDebugMode = !!(await Editor.Profile.getConfig('utils', 'features.analytics-debug'));

        // 初始化统计日志
        await logMgr.init(outputMetricLog, this._metricsDebugMode);

        const disableGa = !!(await Editor.Profile.getConfig('utils', 'features.disable-analytics-ga'));
        if (!disableGa) {
            this.addMetricsObserver(require('../observers/google-metrics-observer'));
        }
        this.addMetricsObserver(require('../observers/google-metrics-observer-v4'));
        this.addMetricsObserver(require('../observers/cocos-metrics-observer'));

        const display = getMainDisplay();
        const options: trackOptions = {
            cid: this._clientID,
            uid: this._userID,
            debug: this._metricsDebugMode || false,
            resolution: `${display.size.width}x${display.size.height}`,
            scaleFactor: `${display.scaleFactor}`,
        };

        // options.debug = true;

        this._metricsObservers.forEach((observer) => {
            observer.sendAppInfo(options);
        });

        this._init = true;
    }

    /**
     * 记录一个事件
     * @param index
     */
    public trackEvent(index: number) {
        if (!this._userID) return;

        const data = this.getTrackInfoMapByTime(index);
        if (!data) return;

        const options: trackOptions = {
            cid: this._clientID,
            uid: this._userID,
            debug: this._metricsDebugMode || false,
            useTestServer: this._metricsDebugMode || false,
        };

        const { info } = data as trackEventInfo;
        try {
            // 如果这个字段是不是 true，就删掉这个字段，避免污染数据
            if (!info.sendToCocosAnalyticsOnly) {
                delete info.sendToCocosAnalyticsOnly;
            }
            // 如果这个字段是不是 true，就删掉这个字段，避免污染数据
            if (!info.sendToNewCocosAnalyticsOnly) {
                delete info.sendToNewCocosAnalyticsOnly;
            }
        } catch (error) {
            console.debug(error);
        }

        info.projectID = Editor.Project.uuid || '';
        try {
            logMgr.collectToFile(`[trackEvent]`, JSON.stringify(info));
            this._metricsObservers.forEach((observer) => {
                observer.trackEvent(info, options);
            });
        } catch (error) {
            console.debug(error);
        }
    }

    public close() {
        const options: trackOptions = {
            cid: this._clientID,
            uid: this._userID,
            debug: this._metricsDebugMode || false,
            useTestServer: this._metricsDebugMode || false,
        };

        logMgr.collectToFile(`[close]`, JSON.stringify(options));
        this._metricsObservers.forEach((observer) => {
            observer.close(options);
        });
    }

    /**
     * 数据自增统计接口，添加的数据会与缓存数据结合递增，每五分钟发送一次数据
     * @returns
     * @param index
     */
    public _trackEventWithTimer(index: number) {
        const data = this.getTrackInfoMapByTime(index);
        if (!data || !data.info) return;

        const info = data.info as trackWithTimerEventInfo;
        try {
            logMgr.collectToFile(`[trackEventWithTimer]`, JSON.stringify(info));
            // 产品需求自增统计的数据需要支持string类型
            // if (typeof info.value !== 'number') {
            //     console.debug('trackEventSelfIncrement only support value with type of number.');
            //     return;
            // }
            if (!this._eventGroup[info.category]) {
                this._eventGroup[info.category] = {};
            }
            if (!this._eventGroup[info.category][info.id]) {
                this._eventGroup[info.category][info.id] = {};
            }
            if (typeof this._eventGroup[info.category][info.id] === 'number') {
                this._eventGroup[info.category][info.id] = ((this._eventGroup[info.category][info.id] + info.value) * 100 | 0) / 100;
            } else {
                this._eventGroup[info.category][info.id] = info.value;
            }
            if (!this._timer) {
                this._timer = setTimeout(() => {
                    this._timer && clearTimeout(this._timer);
                    this._timer = undefined;
                    this._sendEventGroup();
                    // 目前写死默认 5 分钟发送一次统计
                }, 5 * 1000 * 60);
            }
        } catch (error) {
            console.debug(error);
        }
    }

    /**
     * 记录一个异常
     * @param index
     */
    public trackException(index: number) {
        if (!this._userID) {
            return;
        }
        const data = this.getTrackInfoMapByTime(index);
        if (!data) return;

        const info = data.info as trackExceptionInfo;
        const options: trackOptions = {
            cid: this._clientID,
            uid: this._userID,
            debug: this._metricsDebugMode || false,
        };
        try {
            this._metricsObservers.forEach((observer) => {
                observer.trackException(info, options);
            });
            logMgr.collectToFile(`[trackException]`, JSON.stringify(info));
        } catch (error) {
            console.debug(error);
        }
    }

    public trackProcessMemory(index: number) {
        const data = this.getTrackInfoMapByTime(index);
        if (!data) return;

        const message = `[trackMemory][${process}]`;
        const dataStr = `${JSON.stringify(data.memoryInfo)}`;
        logMgr.collectToFile(message, dataStr);
        console.debug(`${message}:${dataStr}`);
    }

    public trackTimeStart() {
        // 暂时不做什么处理
    }

    public trackTimeEnd(index: number) {
        const data = this.getTrackInfoMapByTime(index);
        if (!data || !data.info) return -1;

        const info = data.info as trackTimeEndInfo;
        const message = info.message;
        const options = info.options as trackTimeEndOptions;

        const trackTimeStartMap = this.trackTimeStartMap;
        if (!options.value && !trackTimeStartMap.has(message)) {
            console.debug(`trackTimeEnd failed! Can not find the track time ${message} start`);
            return;
        }
        const durTime = options.value || (data.time || Date.now()) - trackTimeStartMap.get(message)!;
        trackTimeStartMap.delete(message);
        logMgr.collectToFile(`[trackTime]${message}`, `${durTime}ms`);
        if (!options.output) {
            return durTime;
        }
        const label = typeof options.label === 'string' ? (Editor.I18n.t(options.label.replace('i18n:', '')) || options.label || message) : message;
        console.debug(label + ` (${durTime}ms)`);
        return durTime;
    }

    public trackProcessMemoryStart(index: number) {

    }

    public async trackProcessMemoryEnd(index: number): Promise<number> {
        const data = this.getTrackInfoMapByTime(index);
        if (!data || !data.info) return -1;

        const info = data.info as trackMemoryUsageInfo;
        const processMemoryMap = this.processMemoryMap;
        const start = processMemoryMap.get(info.message) || 0;
        const end = info.memory.heapUsed;
        const incremental = end - start;
        processMemoryMap.delete(info.message);
        logMgr.collectToFile(`[trackProcessMemory]${info.message}`, { start, end, incremental });
        return incremental;
    }

    /**
     * 发送收集的统计数据
     */
    public _sendEventGroup() {
        if (!Object.keys(this._eventGroup).length) return;

        logMgr.collectToFile( `[sendCollectData]`, String(Object.keys(this._eventGroup).length));
        const eventGroup = JSON.parse(JSON.stringify(this._eventGroup));
        this._eventGroup = {};
        Object.keys(eventGroup).forEach((category) => {
            Editor.Metrics.trackEvent({
                category: category,
                value: eventGroup[category],
                sendToNewCocosAnalyticsOnly: true,
            });
        });
    }

    /**
     * 统计崩溃事件
     * @param index
     */
    public async _trackCrashEvent(index: number) {
        try {
            if (!this._userID) {
                throw new Error('User ID invalid');
            }

            const data = this.getTrackInfoMapByTime(index);
            if (!data) return;

            const info = data.info as trackEventInfo;

            const options: trackOptions = {
                cid: this._clientID,
                uid: this._userID,
                debug: this._metricsDebugMode || false,
                useTestServer: this._metricsDebugMode || false,
            };

            info.projectID = Editor.Project.uuid || '';

            logMgr.collectToFile(`[trackCrashEvent]`, JSON.stringify(info));
            const cocosMetricsObserver = require('../observers/cocos-metrics-observer');
            return await cocosMetricsObserver._trackCrashEvent(info, options);
        } catch (error) {
            logMgr.collectToFile(`[trackCrashEvent fail]`, error);
            console.debug(error);
            throw error;
        }
    }
}

export default new Metrics();
