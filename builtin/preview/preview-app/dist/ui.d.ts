import { bootstrap } from './index.js';
export declare class Ui {
    constructor(options: Ui.Options);
    get gameCanvas(): HTMLCanvasElement;
    get showFps(): boolean;
    get isShowError(): false | HTMLElement;
    get debugMode(): string;
    get frameRate(): number;
    private _errorInfo;
    /**
     * Get layout size and show loading.
     */
    showLoading(flag?: boolean): void;
    setWindowSize(cc: any): void;
    private _updateToolBarVisibility;
    /**
     * @param message 显示加载错误
     */
    showError(error: Error | ErrorEvent | PromiseRejectionEvent): void;
    private transToErrorInfo;
    hideSplash(): void;
    hintEmptyScene(): void;
    bindEngine(cc: any): void;
    /**
     * @param progress 进度值，[0, 100]
     */
    reportLoadProgress(progress: number): void;
    private _queryChecked;
    /**
     * 获取当前设备 size
     */
    getRotatedCurrentSize(): {
        height: number;
        width: number;
    };
    /**
     * Get emulated screen size.
     * Return the size in css pixels.
     */
    private _getEmulatedScreenSize;
    isFullscreen(): boolean;
    private _checkMobile;
    private _query;
    private _toolbar;
    private _canvas;
    private _footer;
    private _viewSelect;
    private _viewSelectValue;
    private _optsDebugMode;
    private _rotateButton;
    private _pauseButton;
    private _stepButton;
    private _stepLengthWrap;
    private _stepLength;
    private _showFpsButton;
    private _setFpsInput;
    private _progressBar;
    private _errorMain;
    private _errorStack;
    private _splash?;
    private _gameContainer?;
    private _rotated;
    private _devices;
    private _emit;
    private _isMobile;
}
export declare namespace Ui {
    interface Options {
        devices: bootstrap.Options['devices'];
        emit(event: string, ...args: any[]): void;
    }
}
