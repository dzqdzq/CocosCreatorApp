import { bootstrap } from './index.js';
export declare class Ui {
    constructor(options: Ui.Options);
    get gameCanvas(): HTMLCanvasElement;
    get showFps(): boolean;
    get debugMode(): string;
    get frameRate(): number;
    /**
     * Get layout size and show loading.
     */
    showLoading(flag?: boolean): void;
    setGameDivSize(): void;
    private _updateToolBarVisibility;
    /**
     * @param message 显示加载错误
     */
    showError(message: string): void;
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
     */
    private _getEmulatedScreenSize;
    private _isFullScreen;
    private _checkMobile;
    private _query;
    private _toolbar;
    private _canvas;
    private _footer;
    private _select;
    private _optsDebugMode;
    private _rotateButton;
    private _pauseButton;
    private _stepButton;
    private _showFpsButton;
    private _setFpsInput;
    private _progressBar;
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
