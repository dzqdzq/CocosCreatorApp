import { globals } from './app-globals.js';
import { bootstrap } from './index.js';

export class Ui {
    constructor(options: Ui.Options) {
        this._devices = options.devices;
        this._emit = options.emit;
        this._checkMobile();

        this._query = document.querySelector.bind(document);
        this._canvas = this._queryChecked('#GameCanvas');
        this._toolbar = this._queryChecked('.toolbar');
        this._footer = this._queryChecked('.footer');
        this._select = this._queryChecked('#opts-device');
        this._optsDebugMode = this._queryChecked('#opts-debug-mode');
        this._rotateButton = this._queryChecked('#btn-rotate');
        this._pauseButton = this._queryChecked('#btn-pause');
        this._stepButton = this._queryChecked('#btn-step');
        this._showFpsButton = this._queryChecked('#btn-show-fps');
        this._setFpsInput = this._queryChecked('#input-set-fps');
        this._progressBar = this._queryChecked('#splash .progress-bar span');

        // ??
        // select 标签的初始化
        this._select.value = this._select.getAttribute('value')!;
        this._optsDebugMode.value = this._optsDebugMode.getAttribute('value')!;
        this._rotated = (this._rotateButton.className === 'checked');
        this.setGameDivSize();
        this._updateToolBarVisibility();
        this.showLoading();
    }

    get gameCanvas() {
        return this._canvas;
    }

    get showFps() {
        return this._showFpsButton.className === 'checked';
    }

    get debugMode() {
        return this._optsDebugMode.value;
    }

    get frameRate() {
        return parseInt(this._setFpsInput.value, 10);
    }

    /**
     * Get layout size and show loading.
     */
    public showLoading(flag?: boolean) {
        if (globals.error) {
            return;
        }

        if (!this._splash) {
            const LOGO_IMG_L_W = 416;
            const LOGO_IMG_L_H = 87;
            const LOGO_SIZE = 0.4;

            const { width, height } = this._getEmulatedScreenSize();
            this._splash = this._queryChecked<HTMLElement>('#splash');
            const gameContainer = this._queryChecked<HTMLElement>('#GameDiv');
            this._splash.style.width = `${Math.min(width, screen.width)}px`;
            this._splash.style.height = `${Math.min(height, screen.height)}px`;
            this._splash.style.display = '';
            this._progressBar.style.width = '0%';
            let marginTop;
            if (this._splash.style.width < this._splash.style.height) {
                this._splash.style.backgroundImage = `url("./../splash_portrait.png")`;
                this._splash.style.backgroundSize = '30%';
                marginTop = (height - width * (1 - LOGO_SIZE)) / 2;
            } else {
                const logoDisplayH = width * LOGO_SIZE / LOGO_IMG_L_W * LOGO_IMG_L_H;
                marginTop = logoDisplayH / 2 * 1.47;
            }
            this._progressBar.parentElement!.style.marginTop = marginTop + 'px';
            if (gameContainer) {
                gameContainer.style.visibility = 'visible';
            }
            if (!this._isMobile) {
                // Center the splash screen
                this._canvas.width = width;
                this._canvas.height = height;
            }
        } else {
            if (flag) {
                this._splash.style.display = '';
            } else {
                this._splash.style.display = 'none';
            }
        }
    }

    public setGameDivSize() {
        // Ignore game div size in mobile browsers
        if (!this._isMobile) {
            const gameDiv = this._queryChecked<HTMLElement>('#GameDiv');
            const size = this._getEmulatedScreenSize();
            gameDiv.style.width = size.width + 'px';
            gameDiv.style.height = size.height + 'px';
        }
    }

    private _updateToolBarVisibility() {
        if (this._isFullScreen()) {
            toggleElementClass(this._toolbar, 'hide', true);
            toggleElementClass(this._footer, 'hide', true);
        } else {
            toggleElementClass(this._toolbar, 'hide', false);
            toggleElementClass(this._footer, 'hide', false);
        }
    }

    /**
     * @param message 显示加载错误
     */
    public showError(message: string) {
        this._queryChecked<HTMLElement>('#splash').style.display = 'none';
        this._queryChecked<HTMLElement>('#error').style.display = 'block';
        this._queryChecked<HTMLElement>('#error .error-main').innerText += message;
        message = '[preview-error]' + message;
        this._emit('preview error', message);
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
        window.addEventListener('resize', () => {
            this.setGameDivSize();
            this._updateToolBarVisibility();
        }, {
            // 需要比引擎先处理 resize 事件
            capture: true,
        });
        this._rotateButton.addEventListener('click', () => {
            this._rotated = !this._rotated;
            toggleElementClass(this._rotateButton, 'checked');
            this.setGameDivSize();
            window.dispatchEvent(new Event('resize'));
            this._emit('changeOption', 'rotate', this._rotated);
        });

        this._select.addEventListener('change', (event) => {
            this.setGameDivSize();
            window.dispatchEvent(new Event('resize'));
            // @ts-ignore
            this._emit('changeOption', 'device', event.target.value);
        });

        // init show fps, true by default
        this._showFpsButton.addEventListener('click', () => {
            const show = !(cc.isDisplayStats());
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
            toggleElementClass(this._pauseButton, 'checked');
            toggleElementClass(this._stepButton, 'show');
        });

        // Debug mode.
        this._optsDebugMode.addEventListener('change', (event) => {
            // @ts-ignore
            const value = event!.target!.value;
            const debugMode = cc.DebugMode[value] ?? cc.DebugMode.INFO;
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

        // When click step button, game is stepped.
        this._stepButton.addEventListener('click', () => {
            cc.game.step();
        });

        // enable toolbar
        toggleElementClass(this._toolbar, 'disabled', false);
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
        const width = this._devices[this._select.value] && this._devices[this._select.value].width || 960;
        const height = this._devices[this._select.value] && this._devices[this._select.value].height || 640;
        return this._rotated ? { height: width, width: height } : { width, height };
    }

    /**
     * Get emulated screen size.
     */
    private _getEmulatedScreenSize() {
        if (this._isFullScreen()) {
            const { width, height }= screen;
            return this._rotated ? { height: width, width: height } : { width, height };
        }
        return this.getRotatedCurrentSize();
    }

    private _isFullScreen() {
        if (this._isMobile) {
            return true;
        }
        const size = this.getRotatedCurrentSize();
        if (size.width > screen.width) {
            return true;
        }
        return false;
    }

    private _checkMobile() {
        // @ts-ignore
        const nav = navigator.userAgent || navigator.vendor || window.opera;
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(nav) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(nav.substr(0, 4))) {
            this._isMobile = true;
        }
        else {
            this._isMobile = false;
        }
    }

    private _query: Query;
    private _toolbar: HTMLElement;
    private _canvas: HTMLCanvasElement;
    private _footer: HTMLElement;
    private _select: HTMLSelectElement;
    private _optsDebugMode: HTMLSelectElement;
    private _rotateButton: HTMLButtonElement;
    private _pauseButton: HTMLButtonElement;
    private _stepButton: HTMLButtonElement;
    private _showFpsButton: HTMLButtonElement;
    private _setFpsInput: HTMLInputElement;
    private _progressBar: HTMLElement;
    private _splash?: HTMLElement;
    private _gameContainer?: HTMLElement;
    private _rotated: boolean;
    private _devices: Ui.Options['devices'];
    private _emit: Ui.Options['emit'];
    private _isMobile: boolean = false;
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
