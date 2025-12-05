import { Base } from "../..";
import { ICurveConfig } from "../curve-editor";
import { ICurveKeyframe, WRAP_MODE } from "../curve-editor/lib/curve-base";
export interface IValue {
    keys: ICurveKeyframe[];
    preWrapMode?: WRAP_MODE;
    postWrapMode?: WRAP_MODE;
}
export declare class Curve extends Base {
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    private _type;
    private _value;
    private _config;
    private _connect;
    private $canvas;
    get type(): string;
    set value(val: IValue);
    get value(): IValue;
    get config(): ICurveConfig;
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
    render(val: IValue): void;
    _onClick(event: any): void;
}
