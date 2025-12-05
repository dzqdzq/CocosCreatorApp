import { Base } from '../base';
/**
 * Attribute
 *
 *   disabled: 禁用组件，显示灰色，无法输入，无法选中
 *   readonly: 可以选中，无法输入
 *   invalid: 无效数据
 *
 *   value: 当前的选中值
 *   checked: 是否勾选
 */
export declare class Checkbox extends Base {
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    /**
     * Attribute 更改后的回调
     * @param {*} attr
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get value(): boolean;
    set value(bool: boolean);
    get checked(): boolean;
    set checked(bool: boolean);
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
     * 点击事件
     * 切换选中状态
     */
    _onClick(): void;
    /**
     * 键盘按下事件
     * 切换 pressed 状态
     */
    _onKeyDown(): void;
    /**
     * 键盘按下事件
     * 取消 pressed 状态
     * 切换选中状态
     * @param {*} event
     */
    _onKeyUp(event: any): void;
}
