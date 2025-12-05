/**
 * 发送一个HTTP请求到某个服务器
 *
 * @param options 参数
 *   - host {String} 服务器主机名
 *   - path {String} 服务器路径
 *   - data {Object} 默认为空
 *   - port {Number} 默认80
 *   - method {String} 默认 'GET'
 *   - headers {Object}默认空对象
 * @param cb 回调函数
 */
export declare function sendHttpRequest(options: any, cb: Function): void;
