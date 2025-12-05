export declare class Login extends HTMLElement {
    $: any;
    get loading(): boolean;
    set loading(bool: boolean);
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
     * 向上传递事件
     * @param eventName 事件名称
     * @param options
     */
    dispatch(eventName: string, options: any): void;
}
