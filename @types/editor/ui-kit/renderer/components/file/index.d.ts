import { Base } from '../base';
import { Input } from '../input';
import { ProtocolInfo } from './fileUrl';
interface CustomShadowElement extends HTMLElement {
    $root: File;
    value: any;
}
export declare class File extends Base {
    $input: Input;
    $select: CustomShadowElement;
    $open: CustomShadowElement;
    $location: CustomShadowElement;
    private url;
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    static resolveToRaw(url: string): string;
    static resolveToUrl(raw: string, protocol: string): string;
    static getAllProtocolInfos(): ProtocolInfo[];
    get value(): string;
    set value(file: string);
    get type(): string;
    set type(type: string);
    get extensions(): string;
    set extensions(value: string);
    get multi(): boolean;
    set multi(multi: boolean);
    get protocol(): string;
    set protocol(protocol: string);
    private get _protocols();
    /**
     * 将 value 输出成绝对路径
     */
    toAbsolutePath(): string;
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
    _onLocationClick(event: MouseEvent): void;
    _onInputChange(event: any): void;
    _placeholder(newValue?: string): void;
    _updateValue(newValue: string): void;
    /**
     * URL 发生变化的后续处理
     */
    _urlChange(): void;
}
export {};
