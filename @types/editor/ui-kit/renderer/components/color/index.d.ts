import { Base } from '../base';
/**
 * 颜色选择框
 * value:[255,255,255,255]
 */
export declare class Color extends Base {
    $colorWrap: any;
    $color: any;
    $alpha: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {filePath} src
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
    disconnectedCallback(): void;
    get value(): any;
    set value(value: any);
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 更新颜色值
     * @param {Color} value 颜色值
     */
    _updateColor(value: number[]): void;
    _onClick(event: any): void;
}
