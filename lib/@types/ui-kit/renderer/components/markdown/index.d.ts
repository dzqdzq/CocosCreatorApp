export declare class Markdown extends HTMLElement {
    $slot: any;
    $content: any;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): any[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    /**
     * 移除文档流
     */
    disconnectedCallback(): void;
    private _refresh;
}
