/// <reference types="../@types/extension" />
export interface PanelThis {
    $?: {
        [name: string]: HTMLElement;
    };
    [name: string]: any | Function;
    dispatch: (name: string, ...arg: any) => void;
}
export interface UIPanelEvent extends Event {
    target: Panel;
    args: any[];
}
export declare class Panel extends HTMLElement {
    panel: Editor.Interface.PanelInfo | null;
    panelObject: PanelThis | null;
    private __listeners;
    connected: boolean;
    _injectionStyle: string;
    set config(config: Editor.Interface.PanelInfo | null);
    private _setPanel;
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
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): Promise<void>;
    /**
     * 向上传递事件
     * @param eventName 事件名称
     */
    dispatch(eventName: string, ...args: any[]): void;
    /**
     * 触发内部 update 方法
     * @param args
     */
    update(...args: any[]): void;
    /**
     * 注入自定义样式
     * @param style
     */
    injectionStyle(style: string): void;
    /**
     * 检查是否允许关闭
     */
    canClose(): Promise<boolean>;
    /**
     * 调用一个 method 方法
     * @param method
     * @param args
     */
    callMethod(method: string, ...args: any[]): Promise<any>;
    private _refresh;
}
