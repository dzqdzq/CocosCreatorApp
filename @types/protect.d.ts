/// <reference path="./editor.d.ts"/>
/// <reference path="./message.d.ts"/>

import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';

declare global {
    export namespace Editor {
        export namespace I18n {
            /**
             * 动态注册 i18n 数据
             * Dynamic registration of i18n data
             *
             * @param language 语言 language
             * @param key 翻译路径 Translation path
             * @param map 翻译表 Translation table
             */
            export function register(language: string, key: string, map: I18nMap): void;
        }
        export namespace Panel {
            export namespace _kitControl {
                export interface IOptions {
                    $kit: HTMLElement;
                    name: string;
                    timestamp?: number;
                    events: Record<string, (...args: any[]) => void>;
                    [key: string]: any;
                }

                export function getOptionsCache(): IOptions;

                /**
                 * 注册预加载某个 kit 面板
                 * @param name
                 */
                export function register(name: string): void;

                /**
                 * 反注册某个已注册的 kit 面板
                 * @param name
                 */
                export function unregister(name: string): void;

                /**
                 * 反注册某个已注册的 kit 面板
                 * @param name
                 * @param parentWindow 渲染进程无需填写，主进程调用必填
                 */
                export function open(options: IOptions, parentWindow?: BrowserWindow): void;

                /**
                 * 隐藏现有的任意 kit 面板
                 */
                export function hide(): void;

                /**
                 * 保持现有窗口的显示状态不消失
                 */
                export function hold(): void;

                /**
                 * 主动派发消息
                 * @param message 消息名
                 * @param timestamp 时间戳
                 * @param args 参数数组
                 */
                export function emit(message: string, timestamp: number, ...args: any[]): void;
            }
        }
        export namespace Logger {
            /**
             * 监听 Logger 内发送的事件
             * Listeners for events sent in the Logger
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action 监听动作 Monitor actions
             * @param handle 处理函数 The processing function
             */
            export function on(action: string, handle: Function): any;
            /**
             * 监听 Logger 内发送的事件
             * Listeners for events sent in the Logger
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action 监听动作 Monitor actions
             * @param handle 处理函数 The processing function
             */
            export function once(action: string, handle: Function): any;
            /**
             * 移除监听的事件
             * Removes listener event
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action 监听动作 Monitor actions
             * @param handle 处理函数 The processing function
             */
            export function removeListener(action: string, handle: Function): any;
        }
        export namespace Menu {
            /**
             * 添加一个菜单
             * Add a menu
             * 只有主进程可以使用
             * Only the main process can use it
             *
             * @param path
             * @param options
             */
            export function add(path: string, options: BaseMenuItem): any;
            /**
             * 删除一个菜单
             * Delete a menu
             * 只有主进程可以使用
             * Only the main process can use it
             *
             * @param path
             * @param options
             */
            export function remove(path: string, options: BaseMenuItem): any;
            /**
             * 获取一个菜单对象
             * Gets a menu object
             * 只有主进程可以使用
             * Only the main process can use it
             *
             * @param path
             */
            export function get(path: string): any;
            /**
             * 应用之前的菜单修改
             * Apply the previous menu changes
             * 只有主进程可以使用
             * Only the main process can use it
             */
            export function apply(): any;
            /**
             * 添加分组信息
             * Add grouping information
             *
             * @param path
             * @param name
             * @param order
             */
            export function addGroup(path: string, name: string, order: number): any;
            /**
             * 删除分组信息
             * Delete grouping information
             *
             * @param path
             * @param name
             */
            export function removeGroup(path: string, name: string): any;
            /**
             * 注册菜单模版
             * Register the menu template
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param name
             * @param template
             */
            export function registerTemplate(name: string, template: MenuTemplateItem[]): any;
            /**
             * 移除菜单模版
             * Remove menu template
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param name
             */
            export function unregisterTemplate(name: string): any;
            /**
             * 查询当前弹出的右键菜单的模版信息
             */
            export function queryPopup(): Promise<any>;
            /**
             * 查询当前弹出的右键菜单的模版信息
             * @param searcher 选择器
             */
            export function clickPopup(searcher: string): Promise<any>;
            /**
             * 查询主菜单的模版信息
             */
            export function queryMain(): Promise<any>;
            /**
             * 查询当前弹出的右键菜单的模版信息
             * @param searcher 选择器
             */
            export function clickMain(searcher: string): Promise<any>;
        }
        export namespace Message {
            /**
             * 请勿使用
             * Do not use
             * 马上会被删除
             * It will be deleted immediately
             *
             * @param name
             * @param messageInfo
             */
            export function __register__(
                name: string,
                messageInfo: {
                    [message: string]: MessageInfo;
                },
            ): any;
            /**
             * 请勿使用
             * Do not use
             * 马上会被删除
             * It will be deleted immediately
             *
             * @param name
             */
            export function __unregister__(name: string): any;
            export const __eb__: EventEmitter;
        }
        export namespace Package {
            /**
             * 监听插件事件
             * Listening for plug-in events
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action
             * @param handle
             */
            export function on(action: string, handle: Function): any;
            /**
             * 监听一次插件事件
             * Listen for a plug-in event
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action
             * @param handle
             */
            export function once(action: string, handle: Function): any;
            /**
             * 移除监听插件的事件
             * Event to remove the listener plug-in
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action
             * @param handle
             */
            export function removeListener(action: string, handle: Function): any;
        }
        export namespace Profile {
            /**
             * 监听 profile 事件
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action
             * @param handle
             */
            export function on(action: string, handle: Function): any;
            /**
             * 监听一次 profile 事件
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action
             * @param handle
             */
            export function once(action: string, handle: Function): any;
            /**
             * 移除监听的 profile 事件
             * 谨慎使用，之后会被移除
             * Use with caution and it will be removed later
             *
             * @param action
             * @param handle
             */
            export function removeListener(action: string, handle: Function): any;
        }
        export namespace Startup {
            export const ready: {
                readonly window: any;
                readonly package: any;
            };
            export function window(): Promise<void>;
            export function manager(skipLogin: boolean): Promise<void>;
            export function package(): Promise<void>;
            export function build(options: any, debug: boolean): Promise<any>;
            export function on(action: string, handle: Function): any;
            export function removeListener(action: string, handle: Function): any;
            export function once(action: string, handle: Function): any;
        }
        export namespace Metrics {
            export interface trackEventInfo {
                sendToCocosAnalyticsOnly?: boolean;
                // 是否只发送到新的统计后台
                sendToNewCocosAnalyticsOnly?: boolean;
                [propName: string]: any;
            }
            export interface trackWithTimerEventInfo {
                category: string; // 分组目录
                id: string; // 事件行为 ID
                value: number; // 事件值
            }
            export interface trackOptions {
                uid: string;
                cid: string;
                debug?: boolean;
            }
            export interface trackExceptionInfo {
                code: number;
                message: string;
            }
            /**
             * 追踪一个事件
             * Track an event
             * 请勿使用
             * Do not use
             *
             * @param info 跟踪的错误信息 Error message for trace
             */
            export function trackEvent(info: trackEventInfo): any;
            /**
             * 数据自增统计接口，添加的数据会与缓存数据结合递增
             * @param info 统计事件数据
             * @returns 
             */
             export function _trackEventWithTimer(info: trackWithTimerEventInfo): any;
            /**
             * 追踪一个异常
             * Tracing an exception
             * 请勿使用
             * Do not use
             *
             * @param info 跟踪的错误信息 Error message for trace
             */
            export function trackException(info: trackExceptionInfo): any;
            /**
             * 开始追踪时间
             * Start tracking time
             * @param message
             */
            export function trackTimeStart(message: string): void;
            /**
             * 结束追踪时间
             * End tracking time
             * @param message 
             * @param options 输出选项 { output：是否 console.debug 打印，label: 打印的消息名词的替换文本，支持 i18n: 写法}
             * @return 返回统计时间
             */
            export function trackTimeEnd(message: string, options?: { output?: boolean, label?: string}): Promise<number>;
        }
        export namespace Module {
            export type requireOptions = {
                root?: string;
            };
            /**
             * 动态加载一个脚本模块
             * @param file
             */
            export function requireFile(file: string, options?: requireOptions): any;
            /**
             * 删除加载的模块文件的缓存
             * @param file
             */
            export function removeCache(file: string): any;

            export type ImportProjectModuleDelegate = (url: string) => Promise<unknown>;

            export function setImportProjectModuleDelegate(delegate: ImportProjectModuleDelegate): void;
        }
    }
}
export {};
