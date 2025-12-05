import { Grid, IGridConfig } from "./grid";
export declare const enum WRAP_MODE {
    Default = 0,
    Normal = 1,
    Loop = 2,
    PingPong = 22,
    Reverse = 36,
    LoopReverse = 38
}
export declare const enum TANGENT_MODE {
    AUTO = 0,
    BROKEN = 0
}
export interface ICtrlOpts {
    gridConfig?: IGridConfig;
    curveConfig?: ICurveConfig;
    handlerSize?: number;
}
export interface IPoint {
    x: number;
    y: number;
}
export interface ICurveConfig {
    precision?: number;
    postWrapMode?: WRAP_MODE;
    preWrapMode?: WRAP_MODE;
    strokeStyle?: string;
    origin?: IPoint;
    lineWidth?: number;
    strokeStyleAxu?: string;
    type?: string;
}
export interface ICurveKeyframe {
    inTangent?: number;
    outTangent?: number;
    point: IPoint;
    broken?: boolean;
}
/**
 * 曲线绘制基类，所有的曲线类型需要基于此抽象类实现细节
 */
export declare abstract class CurveBase {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    origin: IPoint;
    grid: Grid;
    config: ICurveConfig;
    keyframes: ICurveKeyframe[];
    constructor(canvas: HTMLCanvasElement, grid: Grid, config: ICurveConfig);
    abstract paintWithCache(ctx: CanvasRenderingContext2D): void;
    abstract clear(): void;
    abstract paint(keyframes: ICurveKeyframe[]): void;
    abstract rePaint(): void;
    abstract paintPreWrapMode(): void;
    abstract paintPostWrapMode(): void;
    /**
     * 在某个位置新增关键帧
     * @param position 点坐标信息
     * @return 关键帧 index ，添加失败为 null
     */
    abstract addKeyFrame(position: IPoint): number | null;
    /**
     * 在曲线的某个位置添加关键帧（由于要兼顾点击范围，获取到的鼠标点并不一定精准在曲线上，只能传递 x 值，去计算 y )
     * @param x 坐标
     * @return 关键帧 index ，添加失败为 null
     */
    abstract addKeyFrameInCurveAt(x: number): number | null;
    /**
     * 删除位于某个位置的关键帧
     */
    abstract delKeyFrame(index: number): void;
    /**
     * 移动多个关键帧到某个位置
     * @param keys
     * @param delta
     */
    abstract moveKeys(keys: ICurveKeyframe[], delta: IPoint): boolean;
    /**
     * 移动单个关键帧位置(仅计算，不重新绘制)
     * @param x 要移动到的位置 x canvas坐标
     * @param Y 要移动到的位置 y canvas坐标
     * @param index 关键帧索引
     * @returns index 关键帧索引（移动后，索引位置可能发生变化）
     */
    abstract moveKey(x: number, y: number, index: number): number;
    /**
     * 整体移动 Y 轴 len 个单位(canvas 像素值)，移动整条曲线
     * @param len
     */
    abstract moveAllY(len: number): boolean;
    /**
     * TODO hermit 曲线特有的操作处理
     * 更新某个点的斜率
     * @param index 曲线索引
     * @param tan 斜率
     * @param type 标识左右斜率
     * @returns 返回添加点的索引
     */
    abstract updateTan(index: number, k: number, type: string): void;
}
