/// <reference types="node" />
import { EventEmitter } from 'events';
import { CurveBase, ICurveKeyframe, WRAP_MODE } from './curve-base';
import { Grid, IFormat, IGridConfig } from './grid';
import { IHermiteConfig, IPoint } from './hermite';
export interface ICtrlOpts {
    gridConfig?: IGridConfig;
    curveConfig?: IHermiteConfig;
    handlerSize?: number;
    precision?: number;
    showPreWrapMode?: boolean;
    showPostWrapMode?: boolean;
}
export declare class CurveCtrl extends EventEmitter {
    /**
     * 绘制线条
     * @param beginCanvas
     * @param endPoint
     * @param ctx
     */
    static drawLine(beginCanvas: IPoint, endPoint: IPoint, ctx: CanvasRenderingContext2D): void;
    /**
     * 绘制圆点
     * @param point
     * @param radius
     * @param ctx
     */
    static drawArc(point: IPoint, radius: number, ctx: CanvasRenderingContext2D): void;
    grid: Grid;
    readonly: boolean;
    canvas: HTMLCanvasElement;
    curve: CurveBase;
    private ctrlKeys;
    private multi;
    private ctrlConfig;
    private ctx;
    private changeType;
    private isShowCtrl;
    private isShowPoint;
    private isShowAuxin;
    private ctrlPoints;
    private currentKeyIndex;
    private activeBoxInfo;
    private activeKeysInfos;
    private mouseDownPoint;
    private eventHandlers;
    private emitConfirm;
    private emitChange;
    constructor(canvas: HTMLCanvasElement, config: ICtrlOpts);
    resetConfig(config: ICtrlOpts): void;
    /**
     * 注入 grid 的单位转换函数
     * @param func
     * @param type
     */
    setGridFormat(func: IFormat, type: 'x' | 'y'): void;
    /**
     * 获取实时的关键帧数据
     */
    getCurrentKeyframes(): ICurveKeyframe[];
    /**
     * 第一次绘制，初始化所有的关键帧数据与绘制
     * @param keyframes
     */
    paint(keyframes: ICurveKeyframe[]): void;
    /**
     * 初始数据转化为坐标系数据
     * @param keyframes
     */
    private transValueToGrid;
    /**
     * 坐标系数据转化为传入数据格式
     * @param keyframes
     */
    private transGridToValue;
    /**
     * 重新绘制，画布清空，关键帧等数据都会直接复用
     */
    rePaint(): void;
    /**
     * 更新两端的循环模式
     * @param type
     * @param value
     */
    updateWrapMode(type: 'preWrapMode' | 'postWrapMode', value: WRAP_MODE): void;
    moveTimeLine(deltaX: number, deltaY: number): {
        x: number;
        y: number;
    };
    moveTimeLineX(delta: number): number;
    moveTimeLineY(delta: number): number;
    scaleTimeLine(x: number, y: number, scale: number): boolean;
    scaleTimeLineY(y: number, scale: number): boolean;
    scaleTimeLineX(x: number, scale: number): boolean;
    /**
     * 在某个位置新增关键帧
     * @param position 点坐标信息
     */
    addKeyFrame(position: IPoint): void;
    /**
     * 在曲线的某个位置添加关键帧（由于要兼顾点击范围，获取到的鼠标点并不一定精准在曲线上，只能传递 x 值，去计算 y )
     * @param x 坐标
     */
    addKeyFrameInCurveAt(x: number): void;
    /**
     * 原关键帧数据转化为控制关键帧（带有画布关键帧数据）
     * @param key
     */
    private transToCtrlKey;
    /**
     * 计算关键帧对应的控制点
     * @param index
     * @param type
     * @returns ICtrlKeyframe
     */
    private calcCtrl;
    /**
     * 计算控制杆终点坐标（返回的是当前坐标系上的点位置）
     */
    private calcCtrlPoint;
    /**
     * 删除当前选中的关键帧
     */
    private delActiveKeys;
    /**
     * 删除关键帧
     * @param index 关键帧索引
     */
    private delKeyFrame;
    /**
     * 刷新绘制
     */
    private refreshRender;
    private clear;
    clearAll(): void;
    /**
     * 更新关键帧的斜率
     * @param offsetX 当前鼠标 x 坐标
     * @param offsetY
     */
    private updateTan;
    /**
     * 移动关键帧
     * @param delta
     */
    private moveActiveKeys;
    /**
     * 移动关键帧
     * @param x 需要移动到的 canvas 坐标 x
     * @param y 需要移动到的 canvas 坐标 y
     */
    private moveKey;
    /**
     * canvas 事件处理（编辑操作）
     */
    registerHandler(): void;
    unregisterHandler(): void;
    private onKeyDown;
    private onWheel;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    /**
     * 右键菜单
     */
    private onPopMenu;
    /**
     * 显示或隐藏点信息
     * @param info 点信息
     */
    private showPoint;
    /**
     * 绘制框选关键帧辅助线框
     */
    private paintAssistBox;
    /**
     * 高亮显示曲线辅助线
     */
    private lightCurve;
    /**
     * 显示控制手柄
     * @param info 控制点信息
     */
    private showCtrl;
    /**
     * 绘制控制手柄
     * @param info 手柄信息
     * @param ctx 画布
     */
    private drawCtrl;
    /**
     * 激活某个关键帧
     */
    private activeKeys;
    /**
     * 绘制激活关键帧的控制面板
     */
    private paintActiveCtrlBox;
    /**
     * 显示某个关键帧点的控制杆
     */
    private showKeyCtrlHand;
    /**
     * 显示某个点的数值信息
     */
    private showKeyValueInfo;
    /**
     * 恢复辅助线效果
     */
    private resetCtrl;
    /**
     * 绘制渲染控制点
     */
    private painCtrlPoint;
}
