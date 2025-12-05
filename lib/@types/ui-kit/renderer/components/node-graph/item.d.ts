import { NodeInfo, TypeInfo, Point } from './interface';
import { NodeGraph } from './index';
export declare class NodeGraphItem extends HTMLElement {
    _nextFrameUpdater: any;
    $header: HTMLElement;
    $panel: HTMLElement;
    $input: HTMLElement;
    $output: HTMLElement;
    $root: NodeGraph;
    info: TypeInfo;
    id: string;
    private _node;
    get node(): NodeInfo;
    set node(node: NodeInfo);
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
     * 渲染 node 数据
     */
    render(): void;
    updatePosition(x: number, y: number): void;
    getInputOffset(id: string): number;
    getOutputOffset(id: string): number;
    _renderOption(): void;
    _renderInput(): void;
    _renderOutput(): void;
    _onMouseDown(event: MouseEvent): void;
    _onDragParam(event: MouseEvent, param: string, pointA?: Point, pointB?: Point): void;
}
