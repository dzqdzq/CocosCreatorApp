/**
 * 拖拽进入的元素
 */
export declare class DragArea extends HTMLElement {
    additionalTimer: any;
    hovingTimer: any;
    _types: string[];
    static get currentDragInfo(): any;
    get additional(): boolean;
    set additional(bool: boolean);
    get hoving(): boolean;
    set hoving(bool: boolean);
    get droppable(): string[];
    set droppable(types: string[]);
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
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 拖拽经过事件
     * @param {*} event
     */
    _onDragOver(event: any): void;
    /**
     * 拖拽离开事件
     */
    _onDragLevel(): void;
    /**
     * 拖拽放置事件
     * @param {*} event
     */
    _onDrop(event: any): void;
    /**
     * 分发阶段的放置事件
     * @param {*} event
     */
    _onPreDrop(event: any): void;
}
