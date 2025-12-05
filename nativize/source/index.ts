import { BrowserWindow, screen, Rectangle } from 'electron';
import { Nativize } from './native-manager';
const ipc = require('@base/electron-base-ipc');

let initLimitTimes = 5;
let mainWindow: BrowserWindow = null;
const MainWindowName = 'MainWindow';
const isWin32 = process.platform === 'win32';
const scale = screen.getPrimaryDisplay().scaleFactor;
let MainWindowWidth = 0;
let MainWindowHeight = 0;
const resizeHandle: NodeJS.Timeout = null;

// function resizeMainWindow() {
//     if (resizeHandle) {
//         clearTimeout(resizeHandle);
//         resizeHandle = null;
//     }
//     resizeHandle = setTimeout(() => {
//         const rect: Rectangle = { x: 0, y: 0, width: MainWindowWidth, height: MainWindowHeight };
//         mainWindow.setBounds(rect, false);
//     }, 16);
// }
function initMainWindowEvent() {
    if (!isWin32) return;
    mainWindow.on('focus', () => {
        Nativize.redraw();
    });

    mainWindow.on('restore', () => {
        Nativize.redraw();
    });

    mainWindow.on('will-resize', (event, bounds) => {
        // console.log('will-resize', bounds.width, bounds.height, scale);
        Nativize.parentWindow?.setSize(bounds.width * scale, bounds.height * scale);
        mainWindow.setBackgroundColor('#434343');

    });
    mainWindow.on('resized', () => {
        mainWindow.setBackgroundColor('#00000000');
        Nativize.redraw();
    });
    mainWindow.on('move', () => {
        Nativize.redraw();
    });
}

// 处理主窗口
function initMainWindow() {
    const { width, height } = mainWindow.getBounds();
    Nativize.init(mainWindow.getNativeWindowHandle(), width, height);
    MainWindowWidth = width; 
    MainWindowHeight = height;
    initMainWindowEvent();
}

// 初始化原生窗口
async function initSceneWindow(isPreview: boolean) {
    await Nativize.createWindow(Nativize.mainWindowRect.w, Nativize.mainWindowRect.h, MainWindowName, isPreview);
    Nativize.resizeWindow(MainWindowName, Nativize.mainWindowRect);
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

    ipc.on('native:engine-ready', async (event: any, isPreview: boolean) => {
        await initSceneWindow(isPreview);
    });

    // 首次进入，如果事件触发时，sceneWindow还没有生成，会导致sceneWindow和实际区域不一致，需要resize
    ipc.on('editor-lib-windows:scene-resize', (event: any, bounds: any) => {
        if (!bounds || !bounds.width) {
            return;
        }
        const size = mainWindow.getContentSize();
        const factor = isWin32 ? scale : 1;
        const rect = {
            x: Math.round(bounds.left * factor),
            y: Math.round((isWin32 ? bounds.top : size[1] - bounds.bottom) * factor),
            w: Math.round(bounds.width * factor),
            h: Math.round(bounds.height * factor),
        };
        Nativize.resizeWindow(MainWindowName, rect);
    });

}

export { initNativize, Nativize };
