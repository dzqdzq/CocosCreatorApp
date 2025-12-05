'use strict';
interface trackEventInfoUA {
    category: string;
    action: string;
    label?: string;
    // 指定事件价值，值为非负整型
    value?: number;
}

// Cocos Analytics
interface trackEventInfoCA {
    [propName: string]: any;
}

export type trackEventInfo = {
    // 判断是否只发送到 cocos analytics
    sendToCocosAnalyticsOnly?: boolean;
    // 是否只发送到新的统计后台
    sendToNewCocosAnalyticsOnly?: boolean;
    [propName: string]: any;
} & (trackEventInfoUA | trackEventInfoCA);

export interface trackWithTimerEventInfo {
    category: string; // 分组目录
    id: string; // 事件行为 ID
    value: number | string; // 事件值
}

export interface trackOptions {
    uid: string;
    cid: string;
    debug?: boolean;
    useTestServer?: boolean;
    resolution?: string;
    scaleFactor?: string;
}

export interface trackExceptionInfo {
    code: number;
    message: string;
}

export interface winBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface trackTimeEndOptions {
    output?: boolean;
    label?: string;
    value?: number;
}

export interface trackTimeEndInfo {
    message: string;
    options: trackTimeEndOptions;
    time?: number;
}

export interface trackMemoryUsageInfo {
    message: string;
    memory: trackMemoryUsage;
}

export interface IAsyncFunction {
    index: number;
    reject: any;
    resolve: any;
    // 默认返回数据，用于在没有被处理时，重置时返回的数据
    defaultResult: any;
}

export interface trackMemoryUsage {
    /**
     * 常驻集大小 - 为无法与其他进程共享的进程分配的内存量。
     */
    rss: number;
    /**
     * 堆的总大小
     */
    heapTotal: number;
    /**
     * 堆使用的内存量
     */
    heapUsed: number;
    /**
     * 由 V8 管理的与 JavaScript 对象绑定的 C++ 对象使用的内存量。
     */
    external: number;
}

export interface MetricsInitInfo {
    outputMetricLog: boolean;
}

export interface MetricsData {
    index: number;
    funcName: string,
    time: number,
    info?: trackEventInfo | trackWithTimerEventInfo | trackTimeEndInfo | trackExceptionInfo;
    process?: string;
    memoryInfo?: trackMemoryUsage;
}
