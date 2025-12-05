/**
 * 查询本机的 ip 列表
 */
export declare function queryIPList(): any;
/**
 * 测试是否可以连接到服务器
 */
export declare function testConnectServer(): Promise<any>;
/**
 * 测试某个端口是否被占用
 *
 * @param port 检查的端口号
 */
export declare function portIsOccupied(port: number): Promise<any>;
/**
 * 测试是否可以连接到服务器
 * @param {*} ip
 */
export declare function testHost(ip: string): Promise<any>;
/**
 * get 请求某个 url 数据
 * @param url 发送的目的地 url
 * @param data 发送的数据
 */
export declare function get(url: string, data: any): Promise<any>;
/**
 * get 请求某个 url 数据
 * @param url 发送的目的地 url
 * @param data 发送的数据
 */
export declare function post(url: string, data: any): Promise<any>;
