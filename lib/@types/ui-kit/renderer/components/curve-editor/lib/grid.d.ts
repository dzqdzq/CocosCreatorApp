import LinearTicks from './linear-ticks';
interface IPoint {
    x: number;
    y: number;
}
interface IAxiConfig {
    showLine?: boolean;
    $container?: HTMLElement;
    startOffset?: number;
    lods?: number[];
    minScale?: number;
    maxScale?: number;
    lineWidth?: number;
    lineColor?: string | number[];
    format?: IFormat;
    maxValue?: number;
    minValue?: number;
    defaultStep?: number;
}
export interface IGridConfig {
    axisMargin?: number;
    negative?: boolean;
    lineWidth?: number;
    axisXConfig?: IAxiConfig;
    axisYConfig?: IAxiConfig;
}
export declare type IFormat = (value: number) => number | string;
export declare class Grid {
    get height(): number;
    multi: number;
    axisMargin: number;
    negative: boolean;
    lineWidth: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    get xRange(): {
        left: number;
        right: number;
    };
    showX: boolean;
    showY: boolean;
    xTicks?: LinearTicks;
    yTicks?: LinearTicks;
    xFormat?: IFormat;
    yFormat?: IFormat;
    private xDefaultFormat?;
    private yDefaultFormat?;
    pixelToValueX?: (n: number) => number;
    pixelToValueY?: (n: number) => number;
    valueToPixelX?: (n: number) => number;
    valueToPixelY?: (n: number) => number;
    /**
     * 整个坐标系平移，通过改变 this.xAxisOffset 偏移数，更改数值转换像素的结果值
     * @param deltaPixelX 平移像素数,正负号代表方向
     */
    transferX?: (n: number) => number;
    transferY?: (n: number) => number;
    /**
     * 绘制 X 坐标
     */
    renderLabelX?: () => void;
    /**
     * 绘制 Y 坐标
     */
    renderLabelY?: () => void;
    renderX?: () => void;
    renderY?: () => void;
    /**
     * 在 x 坐标为 pixelX 时的缩放
     * @param pixelX 当前需要缩放的鼠标位置
     * @param scale 需要缩放的倍数
     * @returns scale2
     */
    xAxisScaleAt?: (pixelX: number, scale: number) => number;
    /**
     * 在 y 坐标为 pixelY 时的缩放
     * @param pixelY 当前需要缩放的鼠标位置(基于 canvas 坐标)
     * @param scale 需要缩放的倍数
     * @returns scale
     */
    yAxisScaleAt?: (pixelY: number, scale: number) => number;
    xAxisScale: number;
    yAxisScale: number;
    readonly axisXConfig: IAxiConfig;
    readonly axisYConfig: IAxiConfig;
    private xAxisOffset;
    private xAnchor;
    private yAxisOffset;
    private yAnchor;
    private xAxisMinStep;
    private yAxisMinStep;
    xMaxValue: number;
    yMaxValue: number;
    getXRange: Function;
    getYRange: Function;
    get anchorInfo(): {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    constructor(canvas: HTMLCanvasElement, config: IGridConfig);
    /************* 允许外部注入更改的方法函数 *************/
    resize(w: number, h: number): void;
    /**
     * 初次绘制
     */
    render(): void;
    transfer(x: number, y: number): {
        x: number;
        y: number;
    };
    /**
     * 更新显示的坐标轴
     */
    updateLabels(): void;
    clear(): void;
    updateGrids(): void;
    valueToPixel(point: IPoint): IPoint;
    pixelToValue(point: IPoint): {
        x: number;
        y: number;
    };
    valueToFormat(point: IPoint): {
        x: string | number;
        y: string | number;
    };
    checkPointInRange(pixelPoint: IPoint): boolean;
    private checkXInRange;
    /**
     * 初始化横坐标轴的相关配置
     */
    private _initXAxios;
    /**
     * 初始化纵坐标轴的相关配置
     */
    private _initYAxios;
}
export {};
