import { Base } from '../base';
export declare class Label extends Base {
    $slot: any;
    $span: any;
    _renderLock: boolean;
    get value(): string;
    set value(value: string);
    get i18n(): boolean;
    set i18n(value: boolean);
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
     * @param attr 被修改的 attribute key
     * @param oldValue 之前的数据
     * @param newValue 修改后的数据
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 渲染内容
     */
    _render(): void;
    /**
     * slot 变化事件
     */
    _slotChange(): void;
}
