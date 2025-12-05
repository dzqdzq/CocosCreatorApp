/// <reference types="node" />
/**
 * 查询本机的 ip 列表
 */
export declare function queryIPList(): string[];
/**
 * 测试是否可以连接到服务器
 */
export declare function testConnectServer(): Promise<boolean>;
/**
 * 测试某个端口是否被占用
 *
 * @param port 检查的端口号
 */
export declare function portIsOccupied(port: number): Promise<boolean>;
/**
 * 检查 ip 地址是否可以联通
 * @param ip 目标地址
 */
export declare function testHost(ip: string): Promise<boolean>;
/**
 * get 请求某个 url 数据
 * @param url 发送
 * @param data
 */
export declare function get(url: string, data: {
    [index: string]: string | number;
}): Promise<Buffer>;
/**
 * get 请求某个 url 数据
 * @param {*} url
 * @param {*} data
 */
export declare function post(url: string, data: {
    [index: string]: string | number;
}): Promise<Buffer>;
