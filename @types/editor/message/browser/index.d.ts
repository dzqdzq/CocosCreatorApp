import { MessageInfo } from '../public/interface';
/**
 * 注册某个插件的所有消息
 * @param name 插件名
 * @param messageInfo 消息列表
 */
export declare function register(name: string, messageInfo: {
    [message: string]: MessageInfo;
}): void;
/**
 * 反注册一个插件里的所有消息
 * @param name 插件名
 */
export declare function unregister(name: string): void;
/**
 * 等待一个消息返回值
 * @param name 插件名
 * @param message 消息名
 * @param args 处理所需要的参数
 */
export declare function request(name: string, message: string, ...args: any[]): Promise<unknown>;
/**
 * 发送某个消息，不等待返回
 * @param name 插件名
 * @param message 消息名
 * @param args 消息所需要的参数
 */
export declare function send(name: string, message: string, ...args: any[]): void;
/**
 * 广播一个消息
 * @param message 消息名
 * @param args 消息附带的参数
 */
export declare function broadcast(message: string, ...args: any[]): void;
/**
 * 新增一个广播消息监听器
 * @param message 消息名
 * @param func 处理函数
 */
export declare function addBroadcastListener(message: string, func: Function): void;
/**
 * 新增一个广播消息监听器
 * @param message 消息名
 * @param func 处理函数
 */
export declare function removeBroadcastListener(message: string, func: Function): void;
