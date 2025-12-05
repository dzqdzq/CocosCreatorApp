import { Base } from '../base';
/**
 * Attribute
 *
 *   disabled: 禁用组件，显示灰色，无法输入，无法选中
 *   readonly: 可以选中，无法输入
 *   invalid: 无效数据
 *
 *   value: 当前选中的值
//  *   multiple: 是否允许多选
 */
export declare class Select extends Base {
    $select: any;
    $placeholder: any;
    $slot: any;
    $child: any;
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
    get value(): any;
    set value(val: any);
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
     * 监听 ui-select 的 focus 事件，转移到内层的 focus
     * @param {Event} event
     */
    _onFocus(event: any): void;
    /**
     * 监听 select 的 change 事件，响应到外层
     */
    _selectChange(): void;
    _slotChange(): void;
    _slotTextChange(): void;
}
