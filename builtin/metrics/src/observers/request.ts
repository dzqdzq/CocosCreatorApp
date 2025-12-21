'use strict';

import * as Http from 'http';
import * as Https from 'https';
import * as Querystring from 'querystring';

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
export function sendHttpRequest(options: any, cb: (e: Error | null, body: string) => void): void {
    const host = options.host;
    let path = options.path;
    const protocol = options.protocol === 'https' ? Https : Http;
    let data = options.data || {};
    const useStringifyData = options.useStringifyData === undefined ? true : options.useStringifyData;
    if (useStringifyData) {
        data = Querystring.stringify(options.data || {});
    }
    const port = options.port || 443;
    const method = options.method || 'GET';
    const headers = options.headers || {};

    // if (!headers['Content-Type'] && method === 'POST') {
    //   headers['Content-Type'] = 'application/x-www-form-urlencoded';
    // }

    // if (!headers['Content-Length'] && method === 'POST') {
    //   headers['Content-Length'] = Buffer.byteLength(data);
    // }

    if (!headers['User-Agent']) {
        headers['User-Agent'] = Editor.App.userAgent;
    }

    if (method === 'GET') {
        path += '?' + data;
    } else {
        data += '\n';
    }

    let body = '';
    const request = protocol.request({
        method: method,
        host: host,
        port: port,
        path: path,
        headers: headers,
    }, (response: Http.IncomingMessage) => {
        if (response.statusCode === undefined || !(response.statusCode >= 200 && response.statusCode < 300)) {
            cb (new Error(`Connect Failed. Status Code: ${response.statusCode}`), body);
            // Consume response data to free up memory
            response.resume();
            return;
        }

        response.on('data', (buf: Buffer) => {
            body += buf;
        }).on('end', () => {
            cb (null, body);
        });
    }).on('error', (err: Error) => {
        cb (err, body);
    });

    request.write(data);
    request.end();
}
