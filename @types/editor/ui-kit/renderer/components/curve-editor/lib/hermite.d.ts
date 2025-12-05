import { CurveBase, ICurveKeyframe, WRAP_MODE } from './curve-base';
import { Grid } from './grid';
export interface IPoint {
    x: number;
    y: number;
}
export declare type ITangentType = 'inTangent' | 'outTangent';
export interface IHermiteConfig {
    precision?: number;
    postWrapMode?: WRAP_MODE;
    preWrapMode?: WRAP_MODE;
    strokeStyle?: string;
    origin?: IPoint;
    lineWidth?: number;
    strokeStyleAxu?: string;
    showKey?: boolean;
}
export interface IHermitePaintOptions {
    start?: number;
    end?: number;
}
export declare const enum ICurveWrapMode {
    Default = 0,
    Normal = 1,
    Loop = 2,
    PingPong = 22,
    Reverse = 36,
    LoopReverse = 38
}
interface IHermiteArgs {
    a: number;
    b: number;
    c: number;
    d: number;
    md5?: string;
}
export declare class Hermite extends CurveBase {
    /**
     * 计算绘制曲线的三次函数各个系数
     * @param point1 第一个点的 x 和 y 坐标
     * @param k1 第一个点的切线斜率
     * @param point2 第二个点的 x 和 y 坐标
     * @param k2 第二个点的切线斜率
     * @returns 曲线对应三次函数的格式系数
     */
    static calcArgs(point1: IPoint, k1: number, point2: IPoint, k2: number): IHermiteArgs;
    /**
     * 根据系数返回三次函数的计算函数
     * @param args 三次曲线参数
     * @param t 时间
     */
    static getRenderFunc(args: IHermiteArgs): (t: number) => number;
    /**
     * 给定关键帧与画布，绘制曲线
     * @param keyframes
     * @param canvas
     * @param negative 是否显示负坐标
     */
    static quickPaint(keyframes: ICurveKeyframe[], canvas: HTMLCanvasElement, negative: boolean): boolean;
    private static calcHermitArgsMd5;
    hermiteArgs: IHermiteArgs[];
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    origin: IPoint;
    grid: Grid;
    config: IHermiteConfig;
    keyframes: ICurveKeyframe[];
    private curveCache;
    wrapModeCurveCache?: Path2D;
    constructor(canvas: HTMLCanvasElement, grid: Grid, config: IHermiteConfig);
    /**
     * 平移多少距离
     * @param x
     * @param y
     */
    translate(x: number, y: number): void;
    /**
     * 初始化关键帧数据
     * @param keyframes
     */
    initKeyData(keyframes: ICurveKeyframe[]): void;
    /**
     * 绘制关键帧
     * @param keyframes
     */
    paint(keyframes: ICurveKeyframe[]): void;
    /**
     * 根据缓存的数据信息重新绘制
     */
    rePaint(): void;
    paintWithCache(ctx: CanvasRenderingContext2D): void;
    /**
     * 绘制关键帧
     */
    paintKeyFrame(point: IPoint): void;
    /**
     * 根据缓存的计算函数，重新绘制某个区域
     * @param start 起始绘制的关键帧 index
     * @param end 绘制终点的关键帧 index
     */
    paintRect(options?: IHermitePaintOptions): void;
    paintInWrapMode(): void;
    paintPreWrapMode(): void;
    paintPostWrapMode(): void;
    /**
     * 整体移动 Y 轴 len 个单位(canvas 像素值)
     * @param len
     */
    moveAllY(len: number): boolean;
    /**
     * 移动关键帧
     * @param keys
     * @param delta
     */
    moveKeys(keys: ICurveKeyframe[], delta: IPoint): void;
    /**
     * 移动单个关键帧位置(仅计算，不重新绘制)
     * @param x 要移动到的位置 x canvas坐标
     * @param Y 要移动到的位置 y canvas坐标
     * @param index 关键帧索引
     * @returns index 关键帧索引（移动后，索引位置可能发生变化）
     */
    moveKey(x: number, y: number, index: number): number;
    /**
     * 更新某个点的斜率
     * @param index 曲线索引
     * @param tan 斜率
     * @param type 标识左右斜率
     * @returns 返回添加点的索引
     */
    updateTan(index: number, tan: number, type: ITangentType): void;
    /**
     * 添加某个关键帧到曲线上
     * @param point
     */
    addKeyFrame(point: IPoint): number;
    /**
     * add keyframe in curves at x
     * @param x axis
     * @return {null | number} return keyframe index or null
     */
    addKeyFrameInCurveAt(x: number): null | number;
    /**
     * 删除关键帧
     * @param point 添加的点坐标
     */
    delKeyFrame(index: number): void;
    /**
     * 清空画布
     */
    clear(): void;
    private getRenderFunc;
    /**
     * 计算两点之间的斜率
     * @param a
     * @param b
     */
    private calcSlopeWithPoints;
    /**
     * 计算曲线上某点的斜率
     * @param x 横坐标
     * @param arg 所处在的曲线函数参数
     */
    private calcSlopeInCurveAt;
    /**
     * 计算当前添加关键帧前一个点的索引
     * @param x
     */
    private calcKeyIndexFromX;
}
export {};
