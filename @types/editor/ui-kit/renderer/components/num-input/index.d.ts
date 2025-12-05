import { Base } from '../base';
/**
 * Attribute
 *
 *   disabled: 禁用组件，显示灰色，无法输入，无法选中
 *   readonly: 可以选中，无法输入
 *   invalid: 无效数据
 *
 *   value: 当前的文本值
 *   unit: 显示的单位
 *   step: 步进数据
 *   max: 最大值
 *   min: 最小值
 */
export declare class NumInput extends Base {
    $input: any;
    $label: any;
    $unit: any;
    $up: any;
    $down: any;
    ignoreInputFocus: boolean;
    _staging: number | null;
    _timer: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get value(): number;
    set value(val: number);
    get label(): string;
    set label(val: string);
    get unit(): string;
    set unit(val: string);
    get preci(): number;
    set preci(val: number);
    get step(): number;
    set step(val: number);
    get max(): number | string | null;
    set max(val: number | string | null);
    get min(): number | string | null;
    set min(val: number | string | null);
    get state(): string;
    set state(str: string);
    /**
     * 构造函数
     */
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    /**
     * 移除文档流
     */
    disconnectedCallback(): void;
    _setTooltip(): void;
    /**
     * 获得了焦点
     *
     * @param event
     */
    _onFocus(event: any): void;
    /**
     * input 获得了焦点
     */
    _onInputFocus(): void;
    /**
     * input 丢失焦点
     */
    _onInputBlur(): void;
    /**
     * input 数据修改
     */
    _onInputChange(): void;
    /**
     * 鼠标滚动微调，按步增的幅度
     * @param event
     */
    _onInputWheel(event: any): void;
    /**
     * 点击单位按钮
     * @param {*} event
     */
    _onUnitClick(event: any): void;
    /**
     * input 键盘按下事件
     *
     * @param event
     */
    _onKeyDown(event: any): void;
    _confirm(ignore?: boolean): void;
    _cancel(): void;
    /**
     * 根据step递增数据
     * @param {*} step
     */
    stepUp(step?: number): void;
    /**
     * 根据 默认或者指定的 step 来递增递减值
     * @param {*} step 注意：这相当于一个减法函数，传入 5 是减 5，传入 -5 是加上 5
     */
    stepDown(step?: number): void;
    /**
     * up 按键点击事件
     *
     * @param event
     */
    _onUpMouseDown(event: any): void;
    /**
     * down 按键点击事件
     *
     * @param event
     */
    _onDownMouseDown(event: any): void;
    /**
     * 上下箭头按下
     *
     * @param $elem
     * @param method
     */
    _onUpDownMouseDown($elem: Element, method: string): void;
    /**
     * 上下箭头抬起
     */
    _onUpDownMouseUp(): void;
    /**
     * label 文本鼠标移动调整数值
     * @param event
     */
    _onLabelMouseDown(event: any): void;
    _onLabelMouseMove(event: any): void;
    _onLabelMouseUp(): void;
    _checkState(): void;
    calcValue(inputValue: string | number): number;
}
