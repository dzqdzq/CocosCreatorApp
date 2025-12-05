import { Base } from '../base';
export declare class File extends Base {
    $input: any;
    $select: any;
    $open: any;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    get value(): string;
    set value(file: string);
    get type(): string;
    set type(type: string);
    get extensions(): string;
    set extensions(value: string);
    get multi(): boolean;
    set multi(multi: boolean);
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
    _onSelectClick(): void;
    _onOpenClick(): void;
    _onInputChange(event: any): void;
    _placeholder(newValue?: string): void;
}
