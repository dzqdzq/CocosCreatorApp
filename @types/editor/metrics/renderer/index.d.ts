import { trackEventInfo, trackExceptionInfo } from '../public/interface';
/**
 * 发消息给远程服务器记录事件
 * @param info
 */
export declare function trackEvent(info: trackEventInfo): void;
/**
 * 发异常数据给远程服务器记录
 * @param info
 */
export declare function trackException(info: trackExceptionInfo): void;
