import { Base } from '../base';
export declare class Slider extends Base {
    $input: any;
    $cursor: any;
    $track: any;
    $wrapper: any;
    $child: any;
    dragging: boolean;
    sliderSize: number;
    _staging: string | null;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {filePath} src
     */
    static importStyle(src: string): void;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get boundingClientRect(): any;
    get currentPosition(): number;
    get disabled(): boolean;
    set disabled(val: boolean);
    get vertical(): boolean;
    get height(): string;
    get value(): string | number;
    set value(val: string | number);
    get min(): number;
    set min(val: number);
    get max(): number;
    set max(val: number);
    get step(): number;
    set step(val: number);
    set preci(val: any);
    get preci(): any;
    _onFocus(event: any): void;
    /**
     * num-input 的 change 监听事件
     */
    _onInputChange(): void;
    /**
     * input的confirm监听事件，因为num-input内部已经对值是否改变作了处理，因而此处不需要再作验证
     */
    _onInputConfirm(): void;
    /**
     * 监听input的cancel事件
     */
    _onInputCancel(): void;
    /**
     * 键盘按下监听事件
     * @param {Event} event
     */
    _onKeyDown(event: any): void;
    /**
     * 更新位置转化为值
     * @param {*} position
     */
    positionToValue(position: number): number;
    /**
     * 更新滑块
     */
    updateCursor(): void;
    /**
     * 更新滑块与Input的值
     */
    updateCursorAndInput(): void;
    /**
     * confirm事件
     */
    _confirm(): void;
    /**
     * 对input值作数据验证后，返回处理过的数据值
     */
    _parseInput(): number;
    resetSize(): void;
    /**
     * 数据递减函数
     * @param {Event} event
     */
    stepDown(event: any): void;
    /**
     * 数据递增函数
     * @param {Event} event
     */
    stepUp(event: any): void;
}
