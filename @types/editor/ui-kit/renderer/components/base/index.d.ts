/**
 * 基础的自定义 UI 元素
 */
export declare class Base extends HTMLElement {
    defaultTabIndex: string;
    get focused(): boolean;
    set focused(val: boolean);
    get disabled(): boolean;
    set disabled(val: boolean);
    get readonly(): boolean;
    set readonly(val: boolean);
    get invalid(): boolean;
    set invalid(val: boolean);
    set path(val: string);
    get path(): string;
    /**
     * 构造函数
     *
     * @param shadow
     */
    constructor(shadow?: any);
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    /**
     * 移除文档流
     */
    disconnectedCallback(): void;
    /**
     * 向上传递事件
     * @param eventName 事件名称
     */
    dispatch(eventName: string): void;
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 获得焦点的时候更新 focused
     *
     * @param event
     */
    _onFocus(event: any): void;
    /**
     * 丢失焦点的时候更新 focused
     *
     * @param event
     */
    _onBlur(event: any): void;
    /**
     * 鼠标点击事件
     * 如果设置了 disabled 或者 readonly 则停止冒泡以及阻止默认事件
     * @param {Event} event
     */
    _onMouseDown(event: any): void;
    /**
     * 键盘按下事件
     * @param {Event} event
     */
    _onKeyDown(event: any): void;
    /**
     * 键盘抬起事件
     * @param {Event} event
     */
    _onKeyUp(event: any): void;
    /**
     * Element 连上 HTML 文档流
     */
    _onConnected(): void;
    /**
     * Element 断开文档流链接
     */
    _onDisconnected(): void;
}
