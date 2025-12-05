export interface PanelInfo {
    $?: {
        [name: string]: string;
    };
    template: string;
    style?: string;
    methods?: {
        [name: string]: Function;
    };
    ready?: Function;
    close?: Function;
}
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
    panel: PanelInfo | null;
    panelObject: PanelThis | null;
    connected: boolean;
    set config(config: PanelInfo | null);
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
    /**
     * 向上传递事件
     * @param eventName 事件名称
     */
    dispatch(eventName: string, ...args: any[]): void;
    private _refresh;
}
