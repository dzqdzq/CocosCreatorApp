import { Base } from '../base';
/**
 * Attribute
 *
 *   disabled: 禁用组件，显示灰色，无法输入，无法选中
 *   readonly: 可以选中，无法输入
 *
 */
export declare class Tab extends Base {
    $slot: any;
    $buttons: any;
    _value: number | undefined;
    /**
     * 使用第三方提供的样式显示当前的元素,select内的option的样式也需经由此接口
     * @param {file} src
     */
    static importStyle(src: string): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    get value(): number;
    set value(val: number);
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
    _slotChange(): void;
    _update(): void;
}
