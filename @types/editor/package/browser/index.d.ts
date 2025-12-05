/// <reference types="node" />
import { EventEmitter } from 'events';
interface getPackageInterface {
    name?: string;
    debug?: boolean;
    path?: string;
    enable?: boolean;
    invalid?: boolean;
}
/**
 * 查询插件数组
 * @param options 查询参数
 */
export declare function getPackages(options: getPackageInterface): any[];
/**
 * 扫描一个目录，并将目录内的所有插件注册到管理器
 * 返回路径数组
 * @param dir 扫描一整个路径，加载路径里的插件
 */
export declare function scan(dir: any): Promise<any[]>;
export declare function startup(handle: (name: string, path: string) => void): Promise<void>;
/**
 * 注册一个文件夹地址为一个插件
 * @param path 注册的插件地址
 */
export declare function register(path: string): Promise<void>;
/**
 * 取消一个已经注册的地址
 * @param path 反注册的插件的地址
 */
export declare function unregister(path: string): Promise<void>;
/**
 * 启用一个插件
 * @param path 插件地址
 */
export declare function enable(path: string): Promise<void>;
/**
 * 禁用一个插件
 * @param path 插件地址
 */
export declare function disable(path: string, options?: {
    replacement?: boolean;
}): Promise<void>;
/**
 * 监听事件
 *
 * @param action 事件/动作名字
 * @param handle 处理函数
 */
export declare function on(action: string, handle: (...args: any[]) => void): EventEmitter;
/**
 * 移除监听事件
 *
 * @param action 事件/动作名字
 * @param handle 处理函数
 */
export declare function removeListener(action: string, handle: (...args: any[]) => void): EventEmitter;
export {};
