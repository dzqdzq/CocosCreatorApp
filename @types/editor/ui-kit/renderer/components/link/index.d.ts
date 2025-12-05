import { Base } from '../base';
export declare class Link extends Base {
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    /**
     * 注入一个 link 处理器
     * 如果没有处理器，将使用默认的处理器处理逻辑
     * 如果有处理器，先使用注入处理器并获取返回值，返回值为 false 继续使用默认处理器，true 则直接返回
     * @param {*} func
     */
    static setLinkHandle(func: Function): void;
    /**
     * 构造函数
     */
    constructor();
    get value(): string;
    set value(val: string);
    get ctrl(): boolean;
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
     * Ctrl + 鼠标单击事件
     * 打开文档链接
     *
     * @param event
     */
    onClick(event: any): Promise<boolean>;
}
