import { Base } from '../base';
export declare class DragObject extends Base {
    _value: any;
    _droppable: any;
    _placeholder: any;
    $value: any;
    $area: any;
    $clear: any;
    $placeholder: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    /**
     * 监听的 Attribute
     */
    static get observedAttributes(): string[];
    /**
     * Attribute 更改后的回调
     * @param {*} attr
     * @param {*} oldValue
     * @param {*} newData
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): Promise<void>;
    get droppable(): any;
    set droppable(val: any);
    get value(): any;
    set value(val: any);
    get placeholder(): any;
    set placeholder(val: any);
    get invalid(): boolean;
    set invalid(val: boolean);
    /**
     * 构造函数
     */
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): Promise<void>;
    /**
     * 移除文档流
     */
    disconnectedCallback(): void;
    /**
     * 拖拽进入 area 元素
     */
    _onAreaDragOver(): void;
    /**
     * 拖拽离开 area 元素
     */
    _onAreaDragLeave(): void;
    /**
     * 拖放到 area 元素
     *
     * @param event
     */
    _onAreaDrop(event: any): void;
    /**
     * 点击清空按钮
     *
     * @param event
     */
    _onClearClick(event: any): void;
}
