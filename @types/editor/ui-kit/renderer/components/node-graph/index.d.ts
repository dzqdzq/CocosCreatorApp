import { NodeGraphItem } from './item';
import { Layout, Point, TypeInfo } from './interface';
export declare class NodeGraph extends HTMLElement {
    $content: HTMLElement;
    $mesh: HTMLCanvasElement;
    $line: HTMLCanvasElement;
    $layout: HTMLElement;
    meshCtx: CanvasRenderingContext2D;
    lineCtx: CanvasRenderingContext2D;
    _json: Layout;
    private _nextFrameUpdater;
    _moveNodeElement?: {
        node: NodeGraphItem;
        type: 'input' | 'output';
        param: string;
    };
    _temporaryLine?: {
        start: Point;
        end: Point;
    };
    scale: number;
    origin: Point;
    $nodeMap: {
        [uuid: string]: NodeGraphItem;
    };
    /**
     * 注册一个 node 类型
     * @param type
     * @param info
     */
    static registerNodeRender(type: string, info: TypeInfo): void;
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
     * 渲染一个 layout 数据
     * @param json
     */
    render(json: Layout): void;
    /**
     * 更新当前的渲染画面
     */
    update(): void;
    /**
     * 添加节点
     * @param type
     * @param x
     * @param y
     */
    addNode(type: string, x?: number, y?: number): void;
    /**
     * 添加条连接线
     * @param nodeA
     * @param paramA
     * @param nodeB
     * @param paramB
     */
    addLine(nodeA: string, paramA: string, nodeB: string, paramB: string): void;
    /**
     * 从当前的渲染的数据里，获取 layout 数据
     */
    getLayout(): any;
    /**
     * 绘制网格
     */
    _renderMesh(): void;
    /**
     * 绘制节点
     */
    _renderNodes(): void;
    /**
     * 绘制连接线
     */
    _renderLines(): void;
    _drawLine(startPoint: any, endPoint: any): void;
    _onMouseDown(event: MouseEvent): void;
    _onMouseWheel(event: MouseWheelEvent): void;
    _onMouseUp(): void;
    _onDBClick(): void;
}
