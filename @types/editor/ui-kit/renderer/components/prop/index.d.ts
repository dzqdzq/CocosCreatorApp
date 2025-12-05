import { Base } from '../base';
export declare class Prop extends Base {
    $wrap: any;
    $label: any;
    $content: any;
    __render__: string | null;
    __label__: any;
    __ui__: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
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
     * @param {*} attr
     * @param {*} oldData
     * @param {*} newData
     */
    attributeChangedCallback(attr: string, oldData: any, newData: any): void;
    _renderLabel(): void;
    _renderUI(): void;
}
