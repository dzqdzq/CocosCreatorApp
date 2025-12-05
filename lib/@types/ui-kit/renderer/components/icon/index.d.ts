import { Base } from '../base';
export declare class Icon extends Base {
    $span: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {filePath} src
     */
    static importStyle(src: string): boolean;
    /**
     * 获取支持的 icon 数组信息
     */
    static get Map(): any;
    /**
     * 构造函数
     */
    constructor();
    connectedCallback(): void;
    /**
     * 移除文档流
     */
    disconnectedCallback(): void;
    get value(): string;
    set value(val: string);
    get color(): string;
    set color(val: string);
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    /**
     * Attribute 更改后的回调
     * @param {*} attr
     * @param {*} oldValue
     * @param {*} newValue
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
}
