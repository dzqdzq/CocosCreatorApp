/// <reference types="node" />
import { EventEmitter } from 'events';
/**
 * 查询插件数组
 * @param {*} options
 */
export declare function getPackages(options: any): any;
/**
 * 注册一个插件
 *
 * @param path 插件地址
 */
export declare function register(path: string): Promise<unknown>;
/**
 * 反注册一个插件
 *
 * @param path 插件地址
 */
export declare function unregister(path: string): Promise<unknown>;
/**
 * 开启一个插件
 *
 * @param path 插件的地址
 */
export declare function enable(path: string): Promise<unknown>;
/**
 * 关闭一个插件
 *
 * @param path 插件的地址
 */
export declare function disable(path: string, options: any): Promise<unknown>;
/**
 * 监听插件管理器的动作
 *
 * @param action 事件/动作名称
 * @param handle 处理函数
 */
export declare function on(action: string, handle: (...args: any[]) => void): EventEmitter;
/**
 * 移除监听插件管理器的动作
 *
 * @param action 事件/动作名称
 * @param handle 处理函数
 */
export declare function removeListener(action: string, handle: (...args: any[]) => void): EventEmitter;
