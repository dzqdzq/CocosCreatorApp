import { Base } from '../base';
export declare class ColorPicker extends Base {
    $hueHandle: any;
    $colorHandle: any;
    $alphaHandle: any;
    $hueCtrl: any;
    $colorCtrl: any;
    $alphaCtrl: any;
    $sliderR: any;
    $sliderG: any;
    $sliderB: any;
    $sliderA: any;
    $newColor: any;
    $oldColor: any;
    $hexInput: any;
    $btnAdd: any;
    $palette: any;
    $presets: any;
    _h: any;
    _a: any;
    _cl: any;
    _ct: any;
    _rgb: number[];
    _stagingRGBA: number[];
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {string} src
     */
    static importStyle(src: string): void;
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    /**
     * 实例移除回调
     */
    disconnectedCallback(): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get value(): number[];
    set value(val: number[]);
    _onBlur(): void;
    _onDisconnected(): void;
    _onHueHandleMousedown(event: any): void;
    _hubCtrlMousedown(event: any): void;
    _onAlphaHandleMousedown(event: any): void;
    _alphaCtrlMousedown(event: any): void;
    _onColorHandleMousedown(event: any): void;
    _colorCtrlMousedown(event: any): void;
    _onRSliderChange(event: any): void;
    _onGSliderChange(event: any): void;
    _onBSliderChange(event: any): void;
    _onASliderChange(event: any): void;
    _onConfirm(): void;
    /**
     * colorPicker的键盘事件
     * @param {Event} event
     */
    _onKeyDown(event: any): void;
    _onHexInputChange(event: any): void;
    /**
     * 获取本地存储的 colorPresets 信息，进行初始化
     */
    _updateColorPresets(): void;
    /**
     * 点击 colorPresets 的添加按钮，添加当前颜色并记录在本地
     */
    _onAddClick(): void;
    /**
     * 点击colorPresets内的颜色格子,将当前颜色替换为该颜色
     * @param {Event} event
     */
    _onPaletteClick(event: any): void;
    _onPaletteContextMenu(event: any): void;
    _staging(): void;
    _updateHueHandle(): void;
    _updateAlphaHandle(): void;
    _updateColorHandle(): void;
    _updateColor(): void;
    _updateRGB(): void;
    _updateA(): void;
    _updateHueAndColor(): void;
    _updateHexAndColor(): void;
}
