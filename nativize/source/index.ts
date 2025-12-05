import { TIMEOUT } from 'dns';
import { BrowserWindow } from 'electron';
import { Nativize, NativizeConstants, PacketFormat } from './native-manager';
const ipc = require('@base/electron-base-ipc');

let initLimitTimes = 5;
let mainWindow: BrowserWindow = null;
let sceneWindow: SceneWinodw = null;

let isEngineViewReady = false;
let isNativeWindowReady = false;
const isWin32 = process.platform === 'win32';

let redrawHandle: NodeJS.Timeout = null;
function onNativize() {
    Nativize.on('resize', (w: number, h: number) => {
        if (isWin32) {
            mainWindow.setBounds({ x: 0, y: 0, width: w, height: h });
        } else {
            mainWindow.setBounds({ width: w, height: h });
        }
    });

    Nativize.on('close', () => {
        mainWindow.close();
    });

    Nativize.on('focus', () => {
        mainWindow.focus();
    });

    // parent window get a redraw event
    Nativize.on('redraw', () => {
        if (redrawHandle) {
            // console.log('清除redraw');
            clearTimeout(redrawHandle);
            redrawHandle = null;
        }
        redrawHandle = setTimeout(() => {
            if (sceneWindow) {
                // console.log('redraw');
                // windows api 刷新场景窗口没生效，只能通过这个方式hack
                sceneWindow.resize({ w: Nativize.mainSceneWidth - 1, h: Nativize.mainSceneHeight - 1 });
                sceneWindow.resize({ w: Nativize.mainSceneWidth, h: Nativize.mainSceneHeight });
            }
        }, 30);
    });

    Nativize.on('connect', (firstTimeConnected: boolean) => {
        console.log(`native app suc connected, first time:${firstTimeConnected}`);
        if (firstTimeConnected) {
            initSceneWindow();
            setNativeWindowReady(true);
        }
    });
}

// 处理主窗口
function initMainWindow() {
    const { width, height } = mainWindow.getBounds();
    Nativize.init(mainWindow.getNativeWindowHandle(), width, height);
    Nativize.setMinWindowSize(960, 680);
    mainWindow.focus();
}

// 通知原生进程加载引擎
async function prepareNativeEngine(editorPath: string) {
    return new Promise((resolve, reject) => {
        Nativize.request({
            type: 'prepareNativeEngine',
            data: { editorPath },
        }).then((response: any) => {
            resolve(true);
        });
    });
}

// 初始化原生窗口
function initSceneWindow() {
    Nativize.createWindow(480, 320).then((window) => {
        console.log('scene-resize', 'createWindow');
        // @ts-ignore
        sceneWindow = window;
    });
}

// 编辑器主界面的engineView准备好了
function setEngineViewReady(ready: boolean) {
    isEngineViewReady = ready;

    if (isEngineViewReady && isNativeWindowReady) {
        prepareNativeEngine(Editor.App.path);
    }
}

function setNativeWindowReady(ready: boolean) {
    isNativeWindowReady = ready;

    if (isEngineViewReady && isNativeWindowReady) {
        prepareNativeEngine(Editor.App.path).then(() => {
            if (Nativize.mainSceneWidth !== 0 && sceneWindow) {
                console.log('prepareNativeEngine  scene-resize', Nativize.mainSceneWidth, Nativize.mainSceneHeight);
                sceneWindow.resize({ w: Nativize.mainSceneWidth, h: Nativize.mainSceneHeight });
            }
        });
    }
}

// -------------------export----------------------
// 原生化场景加载时执行
// @ts-ignore
async function initNativize(windows: any) {
    mainWindow = windows.uuid2win[windows.uuids[0]];
    // mainWindow.webContents.openDevTools();
    if (!mainWindow) {
        if (initLimitTimes > 0) {
            setTimeout(() => {
                initLimitTimes--;
                initNativize(windows);
            }, 1000);
        }
        return;
    }

    initMainWindow();
    onNativize();

    ipc.on('engine-view:ready', (event: any, ready: boolean) => {
        setEngineViewReady(ready);
    });

    // 首次进入，如果事件触发时，sceneWindow还没有生成，会导致sceneWindow和实际区域不一致，需要resize
    ipc.on('editor-lib-windows:scene-resize', (event: any, bounds: any) => {
        if (!bounds || !bounds.width) {
            return;
        }
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && sceneWindow) {
            const size = mainWindow.getContentSize();
            sceneWindow.resize({
                x: bounds.left,
                y: isWin32 ? bounds.top : size[1] - bounds.bottom,
                w: bounds.width,
                h: bounds.height,
            });
        }
        Nativize.setMainWindowSize(bounds.width, bounds.height);
    });

    // 由于劫持了窗口，所以需要手动设置窗口title
    Editor.Message.addBroadcastListener('editor-title-change', (title: string) => {
        Nativize.setTitle(title);
    });
}

export { initNativize, Nativize, NativizeConstants, PacketFormat };
