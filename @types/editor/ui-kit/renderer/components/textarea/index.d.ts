import { Base } from '../base';
export declare class TextArea extends Base {
    $textarea: any;
    $child: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    get pressed(): boolean;
    set pressed(bool: boolean);
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
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    /**
     * Attribute 更改后的回调
     * @param attr
     * @param oldValue
     * @param newValue
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get value(): string;
    set value(val: string);
    get placeholder(): any;
    set placeholder(val: any);
    get readOnly(): boolean;
    set readOnly(val: boolean);
    get autoHeight(): boolean;
    set autoHeight(val: boolean);
    /**
     * 获得了焦点
     * 需要将焦点转移到 textarea 元素上
     * @param {Event} event
     */
    _onFocus(event: any): void;
    /**
     * textarea 获得了焦点
     * 需要记录现在的 value 数据
     */
    _onTextareaFocus(): void;
    /**
     * textarea 丢失焦点
     */
    _onTextareaBlur(): void;
    /**
     * textarea 被修改
     *
     * @param event
     */
    _onTextareaChange(event: any): void;
    /**
     * textarea 键盘按下事件
     * @param {Event} event
     */
    _onTextareaKeyDown(event: any): void;
}
