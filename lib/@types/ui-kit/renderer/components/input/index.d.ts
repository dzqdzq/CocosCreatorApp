import { Base } from '../base';
/**
 * Attribute
 *
 *   disabled: 禁用组件，显示灰色，无法输入，无法选中
 *   readonly: 可以选中，无法输入
 *   invalid: 无效数据
 *
 *   value: 当前的文本值
 *   password: 所有输入文字都显示成 *
 *   placeholder: 没有输入的时候显示的灰色提示文字
 *   show-clear: 是否显示清除 value 的按钮
 */
export declare class Input extends Base {
    $input: any;
    $clear: any;
    _staging: string | null;
    /**
     * 使用第三方提供的样式显示当前的元素
     *
     * @param {string} src est
     * @returns {undefined}
     */
    static importStyle(src: string): boolean;
    /**
     * 监听的 Attribute
     *
     * @returns {Array} 返回需要监听的数组
     */
    static get observedAttributes(): string[];
    /**
     * Attribute 更改后的回调
     *
     * @param {*} attr 属性名字
     * @param {*} oldValue 旧数据
     * @param {*} newValue 新数据
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get value(): string;
    set value(val: string);
    get password(): boolean;
    set password(bool: boolean);
    get placeholder(): string;
    set placeholder(val: string);
    get 'auto-select'(): boolean;
    set 'auto-select'(bool: boolean);
    get 'show-clear'(): boolean;
    set 'show-clear'(val: boolean);
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
    /**
     * 获得了焦点
     *
     * @param {Event} event 事件对象
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
     * input 键盘按下事件
     *
     * @param {Event} event 事件对象
     */
    _onKeyDown(event: any): void;
    /**
     * 点击清除按钮
     */
    _onClear(): void;
    _confirm(ignore?: boolean): void;
    _cancel(): void;
    _clear(): void;
    _placeholder(newValue?: string): void;
}
