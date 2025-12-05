/**
 * 原生化场景初始化管理逻辑
 * 1. 调整electron窗口以支持挖孔方案
 * 2. 创建与原生进程通信的ipc server
 */
let nativeManager: NativeEngineManager;
import * as path from 'path';
const addonRoot = path.join(Editor.App.path, '../tools/native-scene');
if (process.platform === 'win32') {
    nativeManager = require(path.join(addonRoot, 'addon')).NativeEngineManager;
} else {
    if (process.arch === 'arm64') {
        nativeManager = require(path.join(addonRoot, 'addon_arm64')).NativeEngineManager;
    } else {
        nativeManager = require(path.join(addonRoot, 'addon_x86')).NativeEngineManager;
    }
}
const editorServer = require('./server');
const ipc = require('@base/electron-base-ipc');
const SceneWindow = require('./scene-window');
import { PacketFormat } from './interface';
import { NativizeConstants } from './constants';
import { ChildProcess, execFile } from 'child_process';

// use id to manager callback,id is odd number;
let id = 1;
let restartable = true;

// record info for inspect tool
let nodeInspectPort: string;
let nodeInspectID: string;
ipc.on('editor-lib-nativize:inspect-info', (event: any) => {
    event.reply(0, {
        id: nodeInspectID,
        port: nodeInspectPort,
    });
});

class Nativize {
    onFuncMaps: any;
    manager: any;
    server: any;
    parentWindow: any;

    appStarting: boolean;
    appConnect: boolean;
    restartAppTimes: number;
    nativeApp: ChildProcess|null;
    connectTimeoutID: any;
    mainSceneWidth: number;
    mainSceneHeight: number;
    port: number;
    constructor() {
        this.port = 0;
        this.appConnect = false;
        this.appStarting = false;
        // @ts-ignore
        this.manager = new nativeManager();
        this.server = new editorServer();
        this.server.on('connect', () => {
            console.log('native app connected');
            this.appConnect = true;
            this.restartAppTimes = 0;
            id = 1;// reset id
            if (this.onFuncMaps['connect']) {
                this.onFuncMaps['connect'](true);// first time connection
            }
            this.appStarting = false;
            // setTimeout(() => {
            //     console.log('111111111111111111111close');
            //     connection.close();
            // }, 60000);
        });
        this.server.on('close', () => {
            console.log('server close');
            this.appConnect = false;
            // native app will reconnect
            this.nativeAPPConnectTimeout();
            Editor.Message.send('scene', 'native-ipc', 'close');
        });

        this.onFuncMaps = {};
        this.restartAppTimes = 0;
    }

    onWindowCallback(type: string, w: number, h: number) {
        const callback = this.onFuncMaps[type];
        if (callback) {
            callback(w, h);
        }
    }

    init(editorHwnd: any, w: number, h: number) {
        this.server.startServer(this.port);
        this.parentWindow = this.manager.init(editorHwnd, w, h);
        if (this.parentWindow) {
            this.parentWindow.setWindowCallback(this.onWindowCallback.bind(this));
        } else {
            console.error('editorNative init fail');
        }
    }

    setMinWindowSize(w: number, h: number) {
        this.manager.setMinWindowSize(w, h);
    }

    setMainWindowSize(w: number, h: number) {
        this.mainSceneWidth = w;
        this.mainSceneHeight = h;
    }

    on(type: any, callback: Function) {
        this.onFuncMaps[type] = callback;
    }

    // check natice process alive
    nativeAPPConnectTimeout() {
        if (this.connectTimeoutID) {
            clearTimeout(this.connectTimeoutID);
        }
        this.connectTimeoutID = setTimeout(() => {
            // if native app failed to connect editor in 5000 ms
            if (!this.appConnect) {
                // time out restart native app
                console.log('native app failed to connect editor in 5s,restart now', new Date());
                this.restartNativeApp();
            }
            this.connectTimeoutID = null;
        }, 5000);
    }

    getAppPath(): string {
        const isDarwin = process.platform === 'darwin';
        const nativizePath = path.join(Editor.App.path, '../tools/node');
        const appPath = path.join(nativizePath, isDarwin ? 'bin/node' : 'node.exe');
        return appPath;
    }

    restartNativeApp() {
        if (!restartable) {
            return;
        }
        // kill before restart
        if (this.nativeApp) {
            this.nativeApp.removeAllListeners();
            this.nativeApp.kill();
            this.nativeApp = null;
        }
        if (this.restartAppTimes < 10) {
            console.log(`restartNativeApp at ${this.restartAppTimes} times`);
            this.startNativeApp([]);
        } else
        {
            console.error('try too much times for start native process');
        }
        this.restartAppTimes++;
    }

    startNativeApp(args: string[]) {
        this.appStarting = true;
        this.nativeAPPConnectTimeout();
        const appPath = this.getAppPath();
        const isDarwin = process.platform === 'darwin';
        let cwd = path.join(appPath, '../../../resources/3d/editor-native-scene/build');
        cwd = isDarwin ? path.join(appPath, '../../../../resources/3d/editor-native-scene/build') : cwd;
        console.log('appPath', appPath, cwd);
        const params = args ? args : ['--inspect'];
        params.push('./index.js');
        params.push(`port=${this.server.getPort()}`);
        this.nativeApp = execFile(appPath, params, {
            cwd: cwd,
        });
        this.nativeApp?.stdout.on('data', (data) => {
            console.log(`[native stdout]: ${data}`);
        });
        this.nativeApp?.stderr.on('data', (data) => {
            if (data.includes('Debugger listening on')) {
                // "Debugger listening on ws://127.0.0.1:9229/ef2d7acc-028c-4cf2-94b4-36f87cba7f93"
                // data is constant，so just use number to cut
                const brIndex = data.indexOf('\n');
                const url = data.slice(22, brIndex);
                nodeInspectPort = url.slice(15, 19);
                nodeInspectID = url.slice(20);
            }
            console.error(`[native stderr]: ${data}`);
        });
        this.nativeApp.on('error', (err) => {
            console.error('nativeApp on error', err.message);
            this.nativeApp = null;
            this.restartNativeApp();
        });
        this.nativeApp.on('exit', (code, signal) => {
            console.error('nativeApp on exit', code, signal);
            this.nativeApp = null;
            this.appStarting = false;
            this.restartNativeApp();
        });
    }

    createWindow(w: number, h: number) {
        return new Promise((resolve, reject) => {
            this.request({
                type: NativizeConstants.Type.newWindow,
                data: {
                    w: 480,
                    h: 320,
                },
            }).then((response: any) => {
                // windows平台不加定时器会出现卡死，暂时方案
                setTimeout(() => {
                    console.log('send new window resolve', response.windowID);
                    // 封装成window对象，应用挖孔效果
                    try {
                        const window = this.manager.createWindow(w, h, response.windowID);
                        const sceneWindow = new SceneWindow(window, response.windowID);
                        resolve(sceneWindow);
                    } catch (error) {
                        reject(error);
                    }
                }, 2000);
            });
        });
    }

    /* 
        obj必须包含type类型
    */
    send(obj: PacketFormat) {
        obj.id = id;
        id += 2;
        return this.server.send(obj);
    }

    request(obj: PacketFormat) {
        obj.id = id;
        id += 2;
        return this.server.request(obj);
    }

    setTitle(title: string) {
        if (this.parentWindow) {
            this.parentWindow.setTitle(title);
        }
    }

    setRestartable(able: boolean) {
        restartable = able;
    }

    setPort(p: number) {
        this.port = p;
    }
}

const instance = new Nativize();

// export functions

export { instance as Nativize, NativizeConstants, PacketFormat };
