import { Base } from '../base';
export declare class GradientPicker extends Base {
    activeOrbital: any;
    activeProgress: any;
    _map: any;
    _value: any;
    _location: any;
    $preview: any;
    $previewHybrid: any;
    $previewAlpha: any;
    $previewColor: any;
    $alphas: any;
    $colors: any;
    $location: any;
    $color: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {string} src
     */
    static importStyle(src: string): void;
    get value(): any;
    set value(value: any);
    get fixed(): boolean;
    set fixed(value: boolean);
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
    attributeChangedCallback(attr: any, oldValue: any, newValue: any): void;
    _onFocus(): void;
    _onBlur(): void;
    /**
     * 鼠标点击 preview 区域，则更新 _location 数据
     * 这个数据在之后可以提供给增加 key 的功能使用
     * @param {*} event
     */
    _onPreviewMouseDown(event: any): void;
    /**
     * location 输入框输入位置数据，直接更改对应的关键帧值
     * @param {*} event
     */
    _onLocationChange(event: any): void;
    /**
     * 颜色更新
     *
     * @param event
     */
    _onColorChange(event: any): void;
    /**
     * 点击透明度区域，新增透明度关键帧
     * @param {*} event
     */
    _onAlphaClick(event: any): void;
    /**
     * 点击颜色区域，新建颜色关键帧
     * @param {*} event
     */
    _onColorClick(event: any): void;
    /**
     * 鼠标点到透明度关键帧，记录一些帧信息
     * 并开始拖拽操作，直到放开鼠标，停止所有的操作
     * @param {*} event
     */
    _onAlphaKeyMouseDown(event: any): void;
    /**
     * 鼠标点到颜色关键帧，记录一些帧信息
     * 并开始拖拽操作，直到放开鼠标，停止所有的操作
     * @param {*} event
     */
    _onColorKeyMouseDown(event: any): void;
    /**
     * 挂载透明度关键帧的帧事件
     */
    _mountAlphaKeysEvent(): void;
    /**
     * 挂载颜色关键帧的帧事件
     */
    _mountColorKeysEvent(): void;
    /**
     * 更新颜色渐变预览区域
     */
    _updateColor(): void;
    /**
     * 更新颜色关键帧
     */
    _updateColorKeys(): void;
    /**
     * 更新透明度渐变预览区域
     */
    _updateAlpha(): void;
    /**
     * 更新透明度关键帧
     */
    _updateAlphaKeys(): void;
    /**
     * 更新混合颜色值
     * @param {Gradient} value 颜色值
     */
    _updateHybrid(): void;
    /**
     * 更新 color-picker 元素显示状态
     * @param {*} orbital
     * @param {*} key
     */
    _updateActive(orbital: any, key: any): void;
}
