import { Base } from '../base';
/**
 * 颜色选择框
 * value:[255,255,255,0.5]
 */
export declare class Code extends Base {
    $slot: any;
    $pre: any;
    $code: any;
    textContent: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {filePath} src
     */
    static importStyle(src: string): void;
    get language(): string;
    set language(val: string);
    /**
     * 构造函数
     */
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    _slotTextChange(): void;
    render(): void;
}
