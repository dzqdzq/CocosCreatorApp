import { ICurveKeyframe, WRAP_MODE } from "./lib/curve-base";
export interface ICurveConfig {
    type: string;
    showPreWrapMode?: boolean;
    showPostWrapMode?: boolean;
    xRange?: number[];
    yRange?: number[];
    precision?: number;
    color?: string;
    xFormat?: (x: number) => number;
    yFormat?: (y: number) => number;
    negative?: boolean;
}
export interface IValue {
    keys: ICurveKeyframe[];
    preWrapMode?: WRAP_MODE;
    postWrapMode?: WRAP_MODE;
}
export declare class CurveEditor extends HTMLElement {
    private curveCtrl?;
    private $curveLabelX;
    private $curveLabelY;
    private $ctrlCanvas;
    private config;
    set value(val: IValue);
    get value(): IValue;
    set focused(val: boolean);
    get disabled(): boolean;
    set disabled(val: boolean);
    get readonly(): boolean;
    set readonly(val: boolean);
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
     * TODO config
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
    private initCurveCtrl;
    _render(value: IValue): void;
    /**
     * 向上传递事件
     * @param eventName 事件名称
     */
    dispatch(eventName: string): void;
}
