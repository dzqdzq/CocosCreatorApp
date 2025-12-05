/// <reference types="node" />
/**
 * 查询 ip 地址列表
 */
export declare function queryIpList(): string[];
/**
 * 是否能连接到 passport 服务器
 */
export declare function canConnectPassport(): Promise<boolean>;
/**
 * 检测端口是否被占用
 * @param port 检查的端口号
 */
export declare function portIsOccupied(port: number): Promise<boolean>;
/**
 * 发送 get 消息到服务器
 * @param url 发送的目的地地址
 * @param data 发送的数据
 */
export declare function sendGetRequest(url: string, data: any): Promise<Buffer>;
/**
 * 发送 post 消息到服务器
 * @param {string} url
 * @param {object} data
 */
export declare function sendPostRequest(url: string, data: any): any;
