import { trackEventInfo, trackExceptionInfo } from '../public/interface';
/**
 * 增加一个统计服务
 * @param {*} metricsObserver
 */
export declare function addMetricsObserver(metricsObserver: any): void;
/**
 * 删除一个统计服务
 * @param {*} metricsObserver
 */
export declare function removeMetricsObserver(metricsObserver: any): void;
/**
 * 删除所有的统计服务
 */
export declare function removeAllMetricsObservers(): void;
/**
 * 初始化所有的统计服务
 */
export declare function init(): Promise<void>;
/**
 * 记录一个事件
 * @param {*} info
 */
export declare function trackEvent(info: trackEventInfo): void;
/**
 * 记录一个异常
 * @param info
 */
export declare function trackException(info: trackExceptionInfo): void;
