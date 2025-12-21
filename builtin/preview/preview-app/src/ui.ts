import { bootstrap } from './index.js';
import type { ISplashSetting } from '../../../builder/@types/public/options';

interface ErrorInfo {
    message: string;
    stack?: string;
}

export type UIConfiguration = ISplashSetting & { width: number; height: number };

const userAgentRE =
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
// FIXME: 看不懂是干嘛的
const navigatorVendorRE =
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i;

export class Ui {
    constructor(options: Ui.Options) {
        this._devices = options.devices;
        this._emit = options.emit;
        this._checkMobile();

        this._query = document.querySelector.bind(document);
        this._canvas = this._queryChecked('#GameCanvas');
        this._toolbar = this._queryChecked('.toolbar');
        // this._footer = this._queryChecked('.footer');
        this._viewSelect = this._queryChecked('#view-select');
        this._viewSelectValue = this._viewSelect.querySelector('#name') as HTMLElement;
        this._optsDebugMode = this._queryChecked('#opts-debug-mode');
        this._rotateButton = this._queryChecked('#btn-rotate');
        this._pauseButton = this._queryChecked('#btn-pause');
        this._stepButton = this._queryChecked('#btn-step');
        this._stepLengthWrap = this._queryChecked('#step-length');
        this._stepLength = this._stepLengthWrap.querySelector('input')!;
        this._showFpsButton = this._queryChecked('#btn-show-fps');
        this._setFpsInput = this._queryChecked('#input-set-fps');
        this._splash = this._queryChecked('#splash');
        this._progressBar = this._queryChecked('#splash .progress-bar span');

        // ??
        // select 标签的初始化
        let value = this._viewSelect.getAttribute('value') || 'Default';
        // 设备初始值容错
        if (!this._devices[value]) {
            value = 'Default';
        }
        // 网页全屏处理初始数据
        if (value === 'WebpageFullScreen') {
            this._devices[value].width = window.innerWidth;
            this._devices[value].height = window.innerHeight;
            this._viewSelectValue.innerText = this._devices[value].name;
        } else {
            const width = this._devices[value].width || 960;
            const height = this._devices[value].height || 640;
            this._viewSelectValue.innerText = `${this._devices[value].name} (${width}X${height})`;
        }
        // 网页全屏时监听 hover 来控制菜单来是否显示，在构造函数中绑定函数，避免使用 bind(this) 移除时绑定的函数不同而移除失败
        this.handleContentMouseMove = this.handleContentMouseMove.bind(this);
        this._optsDebugMode.value = this._optsDebugMode.getAttribute('value')!;
        this._rotated = this._rotateButton.className === 'checked';
    }

    get gameCanvas() {
        return this._canvas;
    }

    get showFps() {
        return this._showFpsButton.className === 'checked';
    }

    get isShowError() {
        return this.debugMode !== 'NONE';
    }

    get debugMode() {
        return this._optsDebugMode.value;
    }

    get frameRate() {
        return parseInt(this._setFpsInput.value, 10);
    }

    private _errorInfo: ErrorInfo | null = null;

    /**
     * Get layout size and show loading.
     */
    public showLoading() {
        if (this._errorInfo) {
            return;
        }

        this._splash.style.visibility = 'visible';
        const { width, height } = this._getEmulatedScreenSize();
        if (width < height) {
            this._splash.className += ' portrait';
        }
    }

    public setWindowSize(cc: any) {
        const dpr = window.devicePixelRatio;
        if (!this.isFullscreen()) {
            const sizeInCssPixels = this._getEmulatedScreenSize();
            cc.screen.windowSize = new cc.Size(sizeInCssPixels.width * dpr, sizeInCssPixels.height * dpr);
        }
    }

    private _updateToolBarVisibility() {
        //  全屏和网页全屏时隐藏菜单栏
        if (this.isFullscreen() || this._viewSelect.getAttribute('value') === 'WebpageFullScreen') {
            toggleElementClass(this._toolbar, 'hide', true);
            // toggleElementClass(this._footer, 'hide', true);
        } else {
            toggleElementClass(this._toolbar, 'hide', false);
            // toggleElementClass(this._footer, 'hide', false);
        }
    }

    /**
     * @param message 显示加载错误
     */
    public showError(error: Error | ErrorEvent | PromiseRejectionEvent) {
        // @ts-ignore
        if (!window.__errorTools) {
            return;
        }
        // @ts-ignore
        const { showError, transToErrorInfo } = window.__errorTools;
        const errorInfo = transToErrorInfo(error);
        const message = '[Browser Preview]' + errorInfo.message + (errorInfo.stack ? '/n' + errorInfo.stack : '');
        this._emit('preview error', message);
        this._errorInfo = errorInfo;
        // 添加容错，允许用户去掉 error-main 标签屏蔽错误遮罩
        if (!this.isShowError) {
            return;
        }
        showError(errorInfo, message);
    }

    public hideSplash() {
        if (this._splash) {
            this._splash.style.display = 'none';
        }
    }

    public hintEmptyScene() {
        this._queryChecked<HTMLElement>('#bulletin').style.display = 'block';
        this._queryChecked<HTMLElement>('#sceneIsEmpty').style.display = 'block';
    }

    public bindEngine(cc: any) {
        let pausedByMe = false;

        const toggleOnPauseOrResumed = () => {
            toggleElementClass(this._pauseButton, 'checked');
            toggleElementClass(this._stepButton, 'show');
            this._stepLength.value = cc.game.frameTime;
            toggleElementClass(this._stepLengthWrap, 'show');
        };

        // To react on `game.pause()` invocation from anywhere else,
        // We do inspect "actual" pausing state at frame end to align with our UI.
        cc.director.on(cc.Director.EVENT_END_FRAME, () => {
            const paused = cc.game.isPaused();
            if (pausedByMe !== paused) {
                // Actual pausing state does not match with what we recorded.
                pausedByMe = paused;
                toggleOnPauseOrResumed();
            }
        });

        let resizeTimer: number;
        window.addEventListener('resize', () => {
            this._updateToolBarVisibility();
            // 窗口改变时处理网页全屏
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const device = this._viewSelect.getAttribute('value');
                if (device === 'FullScreen') {
                    this.setWindowSize(cc);
                }
            }, 500);
        });
        this._rotateButton.addEventListener('click', () => {
            this._rotated = !this._rotated;
            toggleElementClass(this._rotateButton, 'checked');
            this.setWindowSize(cc);
            window.dispatchEvent(new Event('orientationchange'));
            this._emit('changeOption', 'rotate', this._rotated);
        });

        const $select = this._viewSelect.querySelector('.view-select');
        const $options = this._viewSelect.querySelector('.options');
        const $ul = this._viewSelect.querySelector('.options > ul');
        $select?.addEventListener('click', (e: any) => {
            e.stopPropagation();
            if ($options?.hasAttribute('open')) {
                $options.removeAttribute('open');
            } else {
                $options?.setAttribute('open', '');
            }
        });
        document.addEventListener('click', (e: any) => {
            e.stopPropagation();
            if ($options?.hasAttribute('open')) {
                $options?.removeAttribute('open');
            }
        });
        // 退出全屏模式
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.setWindowSize(cc);
                window.dispatchEvent(new Event('resize'));
            }
        });
        $ul?.addEventListener('click', (e: any) => {
            const target = e.target;
            if (target?.tagName.toLowerCase() === 'li' && target.dataset.device) {
                const value = target.dataset.device;
                if (value === 'FullScreen') {
                    document.fullscreenEnabled && !document.fullscreenElement && cc.screen.requestFullScreen();
                } else {
                    this._viewSelect.setAttribute('value', value);
                    if (value === 'WebpageFullScreen') {
                        this._devices[value].width = window.innerWidth;
                        this._devices[value].height = window.innerHeight;
                        this._viewSelectValue.innerText = this._devices[value].name;

                        // 鼠标 hover 后展示菜单栏
                        if (!this._isAddContentListener) {
                            this._canvas.addEventListener('mousemove', this.handleContentMouseMove);
                            this._isAddContentListener = true;
                        }
                    } else {
                        const width = (this._devices[value] && this._devices[value].width) || 960;
                        const height = (this._devices[value] && this._devices[value].height) || 640;
                        this._viewSelectValue.innerText = `${this._devices[value].name} (${width}X${height})`;

                        if (this._isAddContentListener) {
                            this._canvas.removeEventListener('mousemove', this.handleContentMouseMove);
                            this._isAddContentListener = false;
                        }
                    }
    
                    this.setWindowSize(cc);
                    window.dispatchEvent(new Event('resize'));
                    this._emit('changeOption', 'device', value);
    
                    changeSelectedClass($ul, target, 'selected');
                }
            }
            $options?.removeAttribute('open');
        });

        // init show fps, true by default
        this._showFpsButton.addEventListener('click', () => {
            const show = !cc.isDisplayStats();
            cc.setDisplayStats(show);
            toggleElementClass(this._showFpsButton, 'checked');
            this._emit('changeOption', 'showFps', show);
        });

        // init pause button
        this._pauseButton.addEventListener('click', () => {
            const shouldPause = !cc.game.isPaused();
            if (shouldPause) {
                cc.game.pause();
            } else {
                cc.game.resume();
            }
            pausedByMe = !pausedByMe;
            toggleOnPauseOrResumed();
        });

        // Debug mode.
        this._optsDebugMode.addEventListener('change', (event) => {
            // @ts-ignore
            const value = event!.target!.value;
            const debugMode = cc.DebugMode[value] ?? cc.DebugMode.INFO;
            if (debugMode === cc.DebugMode.NONE || !this._errorInfo) {
                this._queryChecked<HTMLElement>('#error').style.display = 'none';
            } else {
                this._queryChecked<HTMLElement>('#error').style.display = 'block';
            }
            // @ts-ignore
            window.cc.debug._resetDebugSetting(debugMode);
            this._emit('changeOption', 'debugMode', value);
        });

        // Set FPS.
        this._setFpsInput.addEventListener('change', (event) => {
            let fps = parseInt(this._setFpsInput.value, 10);
            if (isNaN(fps)) {
                fps = 60;
                this._setFpsInput.value = fps.toString();
            }
            cc.game.setFrameRate(fps);
        });

        // Set step length.
        this._stepLength.addEventListener('change', (event: any) => {
            const stepLen = parseInt(event.target.value, 10);
            if (isNaN(stepLen)) {
                event.target.value = cc.game.frameTime;
                return;
            }
            cc.game.frameTime = stepLen;
        });

        // 鼠标hover后展示菜单栏
        if (this._viewSelect.getAttribute('value') === 'WebpageFullScreen' && !this._isAddContentListener) {
            this._canvas.addEventListener('mousemove', this.handleContentMouseMove);
            this._isAddContentListener = true;
        }
        // When click step button, game is stepped.
        this._stepButton.addEventListener('click', () => {
            cc.game.step();
        });
        // enable toolbar
        toggleElementClass(this._toolbar, 'disabled', false);

        // 初始化引擎
        this.setWindowSize(cc);
        this._updateToolBarVisibility();
    }

    private handleContentMouseMove(event: MouseEvent) {
        const contentRect = this._canvas.getBoundingClientRect();
        if (event.clientY <= contentRect.top + 50 && event.clientY >= contentRect.top) {
            toggleElementClass(this._toolbar, 'hide', false);
        } else {
            toggleElementClass(this._toolbar, 'hide', true);
        }
    }

    /**
     * @param progress 进度值，[0, 100]
     */
    public reportLoadProgress(progress: number) {
        this._progressBar.style.width = progress.toFixed(2) + '%';
    }

    private _queryChecked<E extends Element = Element>(selectors: string): E {
        const element = this._query<E>(selectors);
        if (!element) {
            throw new Error(`UI element ${selectors} doesn't exist.`);
        } else {
            return element;
        }
    }

    /**
     * 获取当前设备 size
     */
    public getRotatedCurrentSize() {
        // 当前分辨率为非自定义
        const value = this._viewSelect.getAttribute('value') || 'Default';
        const width = (this._devices[value] && this._devices[value].width) || 960;
        const height = (this._devices[value] && this._devices[value].height) || 640;
        return this._rotated ? { height: width, width: height } : { width, height };
    }

    /**
     * Get emulated screen size.
     * Return the size in css pixels.
     */
    private _getEmulatedScreenSize() {
        if (this.isFullscreen()) {
            const { width, height } = screen;
            return this._rotated ? { height: width, width: height } : { width, height };
        }
        return this.getRotatedCurrentSize();
    }

    public isFullscreen() {
        if (this._isMobile) {
            return true;
        }
        return !!document.fullscreenElement;
    }

    private _checkMobile() {
        // @ts-ignore
        const nav = navigator.userAgent || navigator.vendor || window.opera;
        if (userAgentRE.test(nav) || navigatorVendorRE.test(nav.substr(0, 4))) {
            this._isMobile = true;
        } else {
            this._isMobile = false;
        }
    }

    private _query: Query;
    private _toolbar: HTMLElement;
    private _canvas: HTMLCanvasElement;
    // private _footer: HTMLElement;
    private _viewSelect: HTMLSelectElement;
    private _viewSelectValue: HTMLElement;
    private _optsDebugMode: HTMLSelectElement;
    private _rotateButton: HTMLButtonElement;
    private _pauseButton: HTMLButtonElement;
    private _stepButton: HTMLButtonElement;
    private _stepLengthWrap: HTMLDivElement;
    private _stepLength: HTMLInputElement;
    private _showFpsButton: HTMLButtonElement;
    private _setFpsInput: HTMLInputElement;
    private _progressBar: HTMLDivElement;
    private _splash: HTMLElement;
    private _gameContainer?: HTMLElement;
    private _rotated: boolean;
    private _devices: Ui.Options['devices'];
    private _emit: Ui.Options['emit'];
    private _isMobile = false;
    private _isAddContentListener = false;
}

export declare namespace Ui {
    export interface Options {
        devices: bootstrap.Options['devices'];
        emit(event: string, ...args: any[]): void;
    }
}

type Query = {
    <K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
    <K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
    <E extends Element = Element>(selectors: string): E | null;
};

function toggleElementClass(element: HTMLElement, className: string, add?: boolean) {
    const isAdd = add === undefined ? !element.classList.contains(className) : add;
    if (isAdd) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
}

function changeSelectedClass(element: Element, target: Element, className: string) {
    const lis = element.querySelectorAll('li');
    for (let i = 0; i < lis.length; i++) {
        if (lis[i].classList.contains(className)) {
            lis[i].classList.remove(className);
        }
    }
    target.classList.add(className);
}
