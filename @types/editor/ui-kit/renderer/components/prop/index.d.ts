/// <reference types="../../../../../extension" />
import { Base } from '../base';
export declare class Prop extends Base {
    $wrap: any;
    $label: any;
    $icon: any;
    $content: any;
    dump: any;
    renderInfo: any;
    /**
     * 注册一个渲染方法
     * @param type
     * @param handle
     */
    static registerRender(type: string, handle: Editor.Interface.PanelInfo): void;
    /**
     * 判断一个渲染类型是否注册
     * @param type
     */
    static hasRender(type: any): boolean;
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
     * 监听的 Attribute
     */
    static get observedAttributes(): string[];
    /**
     * Attribute 更改后的回调
     * @param attr
     * @param oldData
     * @param newData
     */
    attributeChangedCallback(attr: string, oldData: any, newData: any): void;
    /**
     * 通过一份数据渲染内部元素
     * @param info
     */
    render(info: any): void;
    /**
     * 获取 dump 里的 name 名称
     */
    getName(dump: any): any;
    /**
     * 设置 prop 里的 label 通用属性
     * name 和 tooltip
     */
    setLabel($label: any, dump: any): void;
    /**
     * 工具函数：内部元素设置只读状态
     * @param element
     */
    setReadonly(dump: any, element: HTMLElement): void;
}
