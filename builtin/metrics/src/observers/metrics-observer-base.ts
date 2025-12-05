'use strict';

import { trackEventInfo, trackExceptionInfo, trackOptions } from '../interface';

export class MetricsObserverBase {

    /**
     * 发消息给远程服务器记录事件
     * @param info {
     *      category: category, //-- {string}类型
     *      action: action,     //-- {string}操作行为
     *      label: label        //-- {string}名称
     * }
     *
     * @param options {
     *      cid: cliendID, //-- {string}类型
     *      uid: userID,   //-- {string}类型
     * }
     */
    trackEvent(info: trackEventInfo, options: trackOptions) {}

    /**
     * 发异常数据给远程服务器记录
     *
     * @param info 记录事件的信息
     * @param options 记录的参数
     */
    trackException(info: trackExceptionInfo, options: trackOptions) {}

    /**
     * 发送 APP 信息
     * @param options
     */
    sendAppInfo(options: trackOptions) {}

    /**
     * 结束统计会话
     * @param options
     */
    close(options: trackOptions) {}
}
