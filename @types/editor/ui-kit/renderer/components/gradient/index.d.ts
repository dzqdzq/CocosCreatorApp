import { Base } from '../base';
/**
 * 颜色梯度显示组件
 */
export declare class Gradient extends Base {
    $colorWrap: any;
    $color: any;
    fixed: any;
    _map: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {filePath} src
     */
    static importStyle(src: string): void;
    get value(): any;
    set value(value: any);
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
    attributeChangedCallback(attr: any, oldValue: any, newValue: any): void;
    /**
     * 更新颜色值
     * @param {Gradient} value 颜色值
     */
    _updateColor(): void;
    _onDisconnected(): void;
    _onClick(event: any): void;
}
