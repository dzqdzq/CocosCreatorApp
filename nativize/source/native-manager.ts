/**
 * 原生化场景初始化管理逻辑
 * 1. 调整electron窗口以支持挖孔方案
 * 2. 与渲染进程通信，渲染进程和引擎通信
 * 3. 管理原生窗口
 */
let NativeManager: NativeEngineManager;
import * as path from 'path';
const addonRoot = path.join(Editor.App.path, '../tools/native-scene');
const isWin32 = process.platform === 'win32';
if (isWin32) {
    NativeManager = require(path.join(addonRoot, 'addon')).NativeEngineManager;
} else {
    NativeManager = require(path.join(addonRoot, 'addon')).NativeEngineManager;
}
import { SceneWindow } from './scene-window';
import NativeIpc from './ipc/index';

class NativeWindowManager {
    private _sceneWindows: Map<string, SceneWindow> = new Map();
    private _previewWindows: Map<string, SceneWindow> = new Map();
    private _isPreviewing = false;// 是否预览中
    onFuncMaps: any;
    manager: any;
    ipc = NativeIpc;
    parentWindow: any;

    // 分别记录主窗口和预览窗口大小
    mainWindowRect: {x: number, y: number, w: number, h: number} = {x: 0, y: 0, w: 0, h: 0};
    previewWindowRect: {x: number, y: number, w: number, h: number } = {x: 0, y: 0, w: 0, h: 0};

    constructor() {
        // @ts-ignore
        this.manager = new NativeManager();
        this.onFuncMaps = {};
    }

    onWindowCallback(type: string, w: number, h: number) {
        const callback = this.onFuncMaps[type];
        if (callback) {
            callback(w, h);
        }
    }

    init(editorHwnd: any, w: number, h: number) {
        this.parentWindow = this.manager.init(editorHwnd, w, h);
        if (!this.parentWindow) {
            console.error('editorNative init fail');
        }
    }

    setMainWindowRect(rect: {x?: number, y?: number, w?: number, h?: number}) {
        rect.x && (this.mainWindowRect.x = rect.x);
        rect.y && (this.mainWindowRect.y = rect.y);
        rect.w && (this.mainWindowRect.w = rect.w);
        rect.h && (this.mainWindowRect.h = rect.h);
    }

    setPreviewWindowRect(rect: {x?: number, y?: number, w?: number, h?: number}) {
        rect.x && (this.previewWindowRect.x = rect.x);
        rect.y && (this.previewWindowRect.y = rect.y);
        rect.w && (this.previewWindowRect.w = rect.w);
        rect.h && (this.previewWindowRect.h = rect.h);
    }

    getWindowRect(name: string) {
        return name === 'MainWindow' ? this.mainWindowRect : this.previewWindowRect;
    }

    on(type: any, callback: Function) {
        this.onFuncMaps[type] = callback;
    }

    // TBD:在进程重启的时候需要销毁现有的SceneWindow
    async createWindow(w: number, h: number, name = '', isPreview = false): Promise<SceneWindow|null> {
        const { handler } = await this.request(isPreview, 'createWindow', w, h, name);
        // 封装成window对象，应用挖孔效果
        try {
            const window = this.manager.createWindow(w, h, handler, name === 'MainWindow', isPreview);
            const sceneWindow = new SceneWindow(window, handler, name);
            sceneWindow.isPreview = isPreview;
            if (isPreview) {
                this._previewWindows.set(name, sceneWindow);
                sceneWindow.hide();
            } else {
                this._sceneWindows.set(name, sceneWindow);
            }
            return sceneWindow;
        } catch (error) {
            console.error('createWinodw error', error);
            return null;
        }
    }

    getWindow(name: string, isPreview: boolean){
        if (isPreview) {
            return this._previewWindows.get(name);
        } else {
            return this._sceneWindows.get(name);
        }
    }

    // 切换生效的原生效果
    async switchWindows(isPreview: boolean) {
        // console.log('switchWindows', isPreview);
        this._isPreviewing = isPreview;
        
        if (isPreview) {
            this.setAllWindowsVisible(true, isPreview);
            this.setAllWindowsVisible(false);
 
        } else {
            this.setAllWindowsVisible(true);
        }
    }

    setAllWindowsVisible(visible: boolean, isPreview = false) {
        const allWindows = isPreview ? this._previewWindows : this._sceneWindows;
        allWindows.forEach((window, key) => {
            if (visible) {
                const rect = this.getWindowRect(key);
                window.restore(rect);
            } else {
                window.hide();
            }
        });
    }
    
    resizeWindow(name: string, rect: {x?: number, y?: number, w?: number, h?: number}) {
        if (name === 'MainWindow') {
            this.setMainWindowRect(rect);
        } else if (name === 'preview'){
            this.setPreviewWindowRect(rect);
        }
        if (this._isPreviewing) {
            const window = this._previewWindows.get(name);
            window?.resize(rect);
        } else {
            const window = this._sceneWindows.get(name);
            window?.resize(rect);
        }
    }

    redraw() {
        if (this.parentWindow) {
            this.parentWindow.redraw?.();
        }
        const windowMap = this._isPreviewing ? this._previewWindows : this._sceneWindows;
        windowMap.forEach((window, key) => {
            window.redraw();
        });
    }

    async request(isPreview = false, method: string, ...args: any[]) {
        return await this.ipc.request(isPreview, method, ...args);
    }

    // 预览面板重启时，获取当前窗口状态
    onPreviewPanelReady() {
        return {
            previewing: this._isPreviewing,
            hasPreviewWindow: this._previewWindows.get('preview'),
            hasSceneWindow: this._sceneWindows.get('preview'),
        };
    }
}

const instance = new NativeWindowManager();
SceneWindow.Nativize = instance;
export { instance as Nativize, NativeWindowManager};
