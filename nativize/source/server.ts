// @ts-nocheck
// ipc server for native app
const WebSocketServer = require('websocket').server;
const { serialize, deserialize } = require('v8');
const http = require('http');
import { PacketFormat } from './interface';

const PROFILER = false;

const profilerStringify = PROFILER ? (data: any) => {
    const time1 = Date.now();
    const ret = serialize(data);
    const time2 = Date.now();
    if (time2 - time1 > 1) {
        console.log('JSON.stringify time out', time2 - time1, ret);
        console.trace();
    }
    return ret;
} : (data: any) => {
    return serialize(data);
};

const profilerParse = PROFILER ? (data: any) => {
    const time1 = Date.now();
    const ret = deserialize(data);
    const time2 = Date.now();
    if (time2 - time1 > 1) {
        console.log('JSON.parse time out', time2 - time1, ret.type);
    }
    return ret;
} : (data: any) => {
    return deserialize(data);
};

class EditorServer {
    server: any | null;
    wsServer: any | null;
    connection: any | null;
    resolveMap: any;
    callbackMap: any| null;
    constructor() {
        this.resolveMap = {};
        this.callbackMap = {};
    }

    getPort() {
        return this.server.address().port;
    }

    startServer(port: number) {
        const self = this;
        this.server = http.createServer(function(request, response) {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        this.server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Nativize IPC Serer error : EADDRINUSE', self.getPort());
            }
        });
        this.server.listen(port, function() {
            console.log((new Date()) + ' Server is listening on port ' + self.getPort());
        });
        const timeout = 30 * 60 * 1000;
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
            closeTimeout: timeout,
            keepaliveGracePeriod: timeout,
            autoAcceptConnections: false,
            maxReceivedFrameSize: 20480000,
            maxReceivedMessageSize: 20480000,
        });

        this.wsServer.on('request', function(request) {
            const connection = request.accept('editor-native', request.origin);
            console.log((new Date()) + ' Connection accepted.');
            connection.on('message', function(message) {
                if (message.type !== 'utf8') {
                    PROFILER ? console.log('EditorReceiceTime', Date.now()) : 0;
                    // console.log('receive data', message);
                    const response = profilerParse(message.binaryData);

                    // handle EditorServer.request promise resolve
                    const resolveTarget = self.resolveMap[response.id];
                    if (resolveTarget) {
                        PROFILER ? console.log('requestResponseTime', response.id, Date.now() - resolveTarget[2], resolveTarget[3]) : 0;
                        resolveTarget[0](response);
                        self.resolveMap[response.id] = null;
                    }
                    else if (response.ipc) {
                        self.retransmitIPC(response);
                    }
                    else {
                        console.log('receive nativize msg');
                    }
                }
            });
            connection.on('close', function(reasonCode, description) {
                console.log('native ipc close', reasonCode, description);
                if (self.callbackMap['close']) {
                    self.callbackMap['close'](connection);
                }
                self.connection = null;
            });
            self.connection = connection;
            if (self.callbackMap['connect']) {
                self.callbackMap['connect'](connection);
            }
        }.bind(this));
    }

    // 只需要发送数据使用send
    send(data: PacketFormat) {
        if (this.connection) {
            this.connection.sendBytes(profilerStringify(data));
        } else {
            console.error('nativize not connect');
        }
    }

    // 需求回调数据时使用request
    request(data: PacketFormat) {
        if (this.connection) {
            return new Promise((resolve, reject) => {
                this.resolveMap[data.id] = [resolve, reject];
                this.connection.sendBytes(profilerStringify(data));
            });
        } else {
            return Promise.reject('send fail!not connect');
        }
    }

    on(type: string, callback: Function) {
        this.callbackMap[type] = callback;
    }

    async retransmitIPC(packet) {
        const method: string = packet.method;
        // console.log(`转发ipc ${method} ${packet.plugin} ${packet.msg} ${packet.data}`);
        if (!Editor.Message[method]) {
            console.error('retransmitIPC failed:wrong method');
            return;
        }
        if (method === 'broadcast') {
            await Editor.Message[method](packet.msg, ...packet.data);
            return;
        }
        const ret = await Editor.Message[method](packet.plugin, packet.msg, ...packet.data);
        // console.log(`转发ipc ${method} ${packet.plugin} ${packet.msg} ${packet.data} ret: ${ret}`);

        const response = {
            id: packet.id,
            ipc: 1,
            type: packet.type,
            data: ret,
        };
        this.send(response);
    }
}

module.exports = EditorServer;
