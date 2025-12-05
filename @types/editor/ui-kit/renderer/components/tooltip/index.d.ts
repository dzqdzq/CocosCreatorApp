import { Base } from '../base';
export declare class Tooltip extends Base {
    $content: any;
    resizeObserver: any;
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
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 默认 arrow="bottom center"
     * 识别格式 arrow="direction adjust" 如：
     * arrow="left"
     * arrow="left middle"
     * arrow="left top"
     * arrow="left top+20px"
     * @param str
     */
    showArrow(str: string): void;
}
