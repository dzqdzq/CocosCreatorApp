import { Base } from '../base';
export declare class Section extends Base {
    $header: any;
    $content: any;
    $contentSlot: any;
    $scrollHeight: any;
    $headerSlot: any;
    resizeObserver: any;
    _noFocusFlag: boolean;
    _recoverScrollHeightTimeId: any;
    _clearScrollHeightTimeId: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    /**
     * 构造函数
     */
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get expand(): boolean;
    set expand(val: boolean);
    get header(): string;
    set header(val: string);
    _onContentScroll(): void;
    recoverScroll($root: any): void;
    /**
     * 批量修改目标组件内子组件内部属性的方法
     *
     * @param {string} attrName
     * @param {*} value
     * @param parentNode
     */
    updateUIAttr(attrName: string, value: any, parentNode: any): void;
    /**
     * section头部点击展开
     */
    _onHeaderClick(event: MouseEvent): void;
    /**
     * focus事件
     */
    _onFocus(): void;
    /**
     * mousedown点击事件
     * @param {Event} event
     */
    _onMouseDown(event: any): void;
    /**
     * 更新头部内容
     * @param {string} value
     */
    _updateHeader(value: string): void;
}
