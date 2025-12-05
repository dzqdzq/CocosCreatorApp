import { DragArea } from '../drag/drag-area';
interface TreeItem {
    index: number;
    fold: boolean;
    indent: number;
    showArrow: boolean;
    detail: {
        [index: string]: any;
    };
    parent: TreeItem | null;
    children: TreeItem[];
}
declare type TemplateType = 'left' | 'icon' | 'text' | 'right' | 'item';
export declare class Tree extends DragArea {
    list: TreeItem[];
    _templates: {
        left: string;
        icon: string;
        text: string;
        right: string;
        item: string;
    };
    /**
     * 设置 template 的渲染模版
     * @param type
     * @param template
     */
    setTemplate(type: TemplateType, template: string): void;
    _templateInits: {
        left(elem: HTMLElement): void;
        icon(elem: HTMLElement): void;
        text(elem: HTMLElement): void;
        right(elem: HTMLElement): void;
        item(elem: HTMLElement): void;
    };
    /**
     * 模版渲染完后的初始化方法
     * @param type
     * @param handle
     */
    setTemplateInit(type: TemplateType, handle: (elem: HTMLElement) => {}): void;
    _renders: {
        left(elem: HTMLElement, data: TreeItem): void;
        icon(elem: HTMLElement, data: TreeItem): void;
        text(elem: HTMLElement, data: TreeItem): void;
        right(elem: HTMLElement, data: TreeItem): void;
        item(elem: HTMLElement, data: TreeItem): void;
    };
    /**
     * 数据更新的时候，更新模版
     * @param type
     * @param handle
     */
    setRender(type: TemplateType, handle: (elem: HTMLElement) => {}): void;
    selectItems: TreeItem[];
    select(item?: TreeItem): void;
    unselect(item?: TreeItem): void;
    clear(): void;
    _lineHeight: number;
    _indent: number;
    _tree: TreeItem;
    $items: HTMLElement[];
    $style: HTMLElement | null;
    $content: HTMLElement | null;
    $fixed: HTMLElement | null;
    $list: HTMLElement | null;
    $prompt: HTMLElement | null;
    get lineHeight(): number;
    set lineHeight(lineHeight: number);
    get indent(): number;
    set indent(indent: number);
    get css(): string;
    set css(css: string);
    set tree(tree: TreeItem[]);
    get tree(): TreeItem[];
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
    /**
     * Attribute 更改后的回调
     * @param attr
     * @param oldValue
     * @param newValue
     */
    attributeChangedCallback(attr: string, oldValue: any, newValue: any): void;
    /**
     * 将视角定位到某一个元素
     * 如果元素不在可视区域，则跳转到元素所在的区域
     * 如果元素是折叠状态，则自动展开到元素
     * @param item
     */
    positioning(item: TreeItem): void;
    /**
     * 显示一个方框，将所选元素包括在内
     * @param item
     */
    prompt(item?: TreeItem): void;
    /**
     * 折叠一个元素
     * @param item
     */
    collapse(item?: TreeItem): void;
    /**
     * 展开一个元素
     * @param item
     */
    expand(item?: TreeItem): void;
    /**
     * 应用数据，渲染数据
     * @param force
     */
    render(): void;
    _nextRender: any;
    _firstIndex: number;
    _render(): void;
}
export {};
