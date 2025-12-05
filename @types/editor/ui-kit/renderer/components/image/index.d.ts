import { Base } from '../base';
export declare class Image extends Base {
    $img: any;
    $area: any;
    $placeholder: any;
    _droppable: any;
    _placeholder: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    /**
     * 构造函数
     */
    constructor();
    get size(): string;
    set size(val: string);
    get value(): string;
    set value(val: string);
    get src(): string;
    set src(val: string);
    get droppable(): any;
    set droppable(val: any);
    /**
     * 注入一个翻译器
     * 如果没有翻译器，默认页面显示的就是 value 的值
     * 如果有，则将 value 传给翻译器，并显示 return 出来的值
     * @param {*} func
     */
    static setSrcTranslator(func: (uuid: string) => string): void;
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
     *
     * @param {*} attr 属性名字
     * @param {*} oldValue 旧数据
     * @param {*} newValue 新数据
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): Promise<void>;
    /**
     * 拖拽进入 area 元素
     */
    _onAreaDragOver(): void;
    /**
     * 拖拽离开 area 元素
     */
    _onAreaDragLeave(): void;
    /**
     * 拖放到 area 元素
     *
     * @param event
     */
    _onAreaDrop(event: any): void;
}
