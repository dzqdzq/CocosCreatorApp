import type { ComponentInstance, Ref, UnwrapNestedRefs } from 'vue';
// import type { CurveEditor } from '@editor/creator-ui-kit/dist/renderer';
import {
    IPropCurveDumpData,
    IAnimCopyKeySrcInfo,
    IAnimCopyPropSrcInfo,
    IAnimCopyEventSrcInfo,
    IAnimCopyPropDstInfo,
    IAnimCopyKeyDstInfo,
    IAnimCopyEventDstInfo,
    IAnimCopyNodeSrcInfo,
    EditorAnimationClipDump,
    IEmbeddedPlayers,
    IPropCurveDumpData,
    IPlayableInfo,
    IClipInfo,
    IAnimationType,
    AuxiliaryCurveListItem,
} from '../../scene/@types/public';
import type { AuxCurveStore } from '../source/panel/vm/hooks/store-aux';
import type { UseTransformEventReturn } from '../source/panel/vm/hooks/store-grid';

import type { EmbeddedPlayerGroup, RealInterpolationMode, TangentWeightMode } from 'cc';
import Vue from 'vue/dist/vue.js';

export * from '../../scene/@types/public';
interface IEventDump {
    frame: number;
    func: string;
    params: string[];
}

export enum IWrapMode {
    Default = 0,
    Normal = 1,
    Loop = 2,
    PingPong = 22,
    Reverse = 36,
    LoopReverse = 38,
}

export type IShowType = 'time' | 'frame' | 'time_s';
export interface IClipConfig {
    sample: number;
    isLock: boolean;
    speed: number;
    duration: number;
    wrapMode: IWrapMode;
}

export interface IClipDumps extends EditorAnimationClipDump {
    curves: IRawCurveData[];
    // only record data display in prop-wrap
    displayClipsDump?: Record<string, Record<string, IPropData>>;
    // (/Cube: position: {displayName...})
    pathsDump: Record<string, Record<string, IPropData>>;
    groupToEmbeddedPlayers: Record<string, IEmbeddedPlayers[]>;
    wrapMode: IWrapMode; // 0: Default
    uuid: string; // clip uuid

    // transform from `auxiliaryCurves` in scene dump
    displayAuxiliaryCurves: IPropAuxCurveData[];
}

export interface INodesDump {
    // displayNodesDump:
    path: string;
    active: boolean;
    // /: ["cdi6xZPNZHspVZ/rHG2yF8"]
    path2uuid: Record<string, string[]>;
    uuid: string;
    uuid2path: Record<string, string>;
    nodes: INodeInfo[];
    displayNodesDump: INodeInfo[];
    nodesDump: INodeInfo[];
    rawPath?: string;
}

export interface INodeInfoBase {
    indent: number; // position
    name: string;
    path: string;
    uuid: string;
}

export interface INodeInfo extends INodeInfoBase {
    keyFrames: IKeyFrame[];
    top: number; // position offset canvas
    rawIndex: number;
    listIndex: number;
    disabled?: boolean;
    hidden?: boolean; // 是否隐藏，搜索过滤级别的隐藏
}

export interface IRawCurveData extends IPropCurveDumpData { // propDate
    partKeys: string[];
    parentPropKey: string;
    type?: IKeyFrameDump;
}

export type IPropAuxCurveData = Omit<IPropCurveDumpData, 'keyframes'> & {
    keyframes: IRawKeyFrame[];
};

export interface IPropData extends IRawCurveData{
    propOpts: any; // TODO 注释
    nodePath: string;
    prop: string;
    type?: IKeyFrameDump;
    frames?: number[];
    keyFrames: IRawKeyFrame[]; // 加工后的关键帧数据
    hidden: boolean; // 是否隐藏
    missing: boolean;
    top: number; // 轨道的高度
    index: number;
    color?: string; // 轨道颜色对照，非父轨道都有
}

// 场景传递到动画编辑器的原始数据格式
export interface IRawKeyframe {
    frame: number;
    dump: {
        default: any;
        extends: string[];
        readonly: boolean;
        type: string; // cc.Vec3
        value: any;
        visible: boolean;
    };
}
/**
 * 每条关键帧数据的基本定义
 */
export interface IKeyFrame{
    // curve: any;
    prop: string,
    frame: number,
    // dump: IKeyFrameDump;
    x: number,
    value?: any,
}

export interface IEmbeddedPlayerInfo {
    begin: number;
    end: number;
    reconciledSpeed: boolean;
    group: string;
    displayName?: string;
    playable?: IPlayableInfo;

    // 界面专属配置
    key: string; // 计算出的当前嵌入播放器的唯一 key
    x: number;
    width: number;
}

export interface ISelectEmbeddedPlayerInfo extends IEmbeddedPlayerInfo {
    rawInfo: IEmbeddedPlayerInfo;
}

// ----------------------------- 曲线编辑 -----------------------------
// 曲线编辑器支持的 wrapMode
export const enum WrapMode {
    CLAMP = 1,
    LOOP = 2,
    PING_PONG = 22,
}
interface IPoint {
    x: number;
    y: number;
}
export interface ICtrlKeyframe {
    // point: IPoint; // 存储的原始数据
    // inTangent?: number;
    inCanvas?: IPoint;
    outCanvas?: IPoint;
    // outTangent?: number;
    index?: number; // 关键帧数据位于原数据中的 index 数据

    key: ICurveKeyframeCanvas;
    raw: ICurveKeyframe;
}
export interface ICurveKeyInfos {
    key: string;
    keys: ICtrlKeyframe[];
}
export interface ICurveValue {
    curveInfos: Record<string, ICurveInfo>;
    wrapMode?: IWrapMode;
    duration?: number;
}
export interface ICurveInfo {
    keys: ICurveKeyframe[];
    preWrapMode?: CurveWrapMode;
    postWrapMode?: CurveWrapMode;
    color?: string; // 指定曲线显示的颜色，未指定将使用默认值
}
export const enum CurveWrapMode {
    /**
     * Compute the result
     * according to the first two frame's linear trend in the case of underflow and
     * according to the last two frame's linear trend in the case of overflow.
     * If there are less than two frames, fallback to `CLAMP`.
     */
    LINEAR,

    /**
     * Use first frame's value in the case of underflow,
     * use last frame's value in the case of overflow.
     */
    CLAMP,

    /**
     * Before evaluation, LOOPedly mapping the input time into the allowed range.
     */
    LOOP,

    /**
     * Before evaluation, mapping the input time into the allowed range like ping pong.
     */
    PING_PONG,
}

// 最好从场景接口处继承
export interface ICurveData {
    inTangent?: number;
    outTangent?: number;
    inTangentWeight?: number;
    outTangentWeight?: number;
    interpMode?: RealInterpolationMode;
    broken?: boolean;
    tangentWeightMode?: TangentWeightMode;
    broken?: boolean;
    easingMethod?: number;
}
export interface IPropCustomData extends ICurveData {
    newValue?: any; // from type defines in scene
}
export interface ICurveKeyframe extends ICurveData{
    point: IPoint;
}

export interface ICurveKeyframeCanvas extends ICurveKeyframe {
    canvas: IPoint; // 存储原数据基于新画布的数据(传递给 curve 的数据)
    inCtrlPoint?: IPoint;
    outCtrlPoint?: IPoint;
}
// 曲线编辑 --------- end -----------
export interface IRawKeyFrame extends IKeyFrame {
    dump: IKeyFrameDump;
    curve: null | ICurveKeyframe;
    key: string;
}

export interface IKeyFrameDump {
    type: string;
    value: any;
}

// TODO 应与关键帧选中数据类型一致
export interface IStartDragKey {
    startX: number;
    offset: number;
    offsetFrame: number;
    prop: string;
    nodePath: string;
    keyFrames: IKeyFrameData[],
    sortDump?: ISortDumps;
    ctrl?: boolean;
    alt?: boolean;
    location: 'node' | 'prop', // 起始移动的关键帧数据位置
}

export type ISortDumps = Record<string, ISortDump>;
export interface ISortDump {
    frames: number[];
    nodePath: string;
    prop: string;
    keyFrames: IKeyFrameData[];
    offsetFrame?: number;
    targetFrame?: number;
}
export interface IParamBase {
    nodePath: string;
    prop: string;
}
export interface ISelectParam extends IParamBase {
    frame: number;
    offsetFrame?: number;
}
export interface ISelectProperty {
    clipUuid: string;
    nodePath: string;
    prop: string;
    type: {
        value: string; // 类型名称
        extends: string[];
    },
    dump: any;
    isCurveSupport?: boolean;
    missing?: boolean;
}

export interface ICopyKeySrcInfo extends IAnimCopyKeySrcInfo {
    leftFrame: number; // 多选的最左侧关键帧
}

export interface ISelectKey extends Omit<Partial<ISelectKeyBase>, 'keyframes'> {
    nodePath: string;
    prop?: string;
    keyFrames: IKeyFrameData[];
    sortDump?: ISortDumps;
    location: 'node' | 'prop';
}

export interface ISelectKeyBase {
    keyframes: IKeyframeDataBase[];
    offsetFrame: number;
    ctrl: boolean;
    // 多选拖拽的
    startX: number;
    offset: number;
}
export interface ISelectKeyAux extends ISelectKeyBase {
    name: string;
}

export interface IKeyframeDataBase {
    x: number;
    frame: number;
    rawFrame: number;
    key: string; // 关键帧的唯一标识
    offsetFrame?: number;
}

export interface ICopyParam extends IParamBase {
    frame: number;
    targetFrame?: number; // 拷贝的目标节点
}

export interface ICopyKeyParam {
    params: ICopyParam[];
    keyFrames: IKeyFrameData[];
    sortDump?: ISortDumps;
    clipUuid: string;
}
// export type sortKeysDump = Record<string, ketDumps>

// 辅助曲线关键帧复制时记录的数据
export type ICopyAuxKeySnapshot = {
    clip: string;
    name: string;
    frame: number;
    curve: ICurveKeyframe;
    dump: IKeyFrameDump;
}

export interface IPropMenuInfo {
    name: string;
    disable: boolean;
    displayName: string;
    key: string;
    opts: any;
    type: any;
}

export interface IPropParams {
    nodePath: string,
    prop: string,
    keyFrames?: IKeyFrameData,
    frame?: number,
    x?: number,
}

export interface IKeyFrameData extends IKeyframeDataBase {
    prop: string;
    nodePath: string;
    value?: any; // TODO 需要补充字段含义
}

export interface ISelectBoxInfo {
    type: 'node' | 'property';
    startX: number;
    startY: number;
    x: number;
    y: number;
    ctrlKey?: boolean;
    rawKeyFrames?: IKeyFrameData[];
}

export type IAniCtrlOperationName = 'spacingKeys' | 'copyKey' | 'createKey' | 'pasteKey' | 'removeKey';

export interface IStartDragEvent {
    startX: number;
    data: IEventInfo[];
    offset: number;
    offsetFrame: number;
    frames: number[];
}

export interface IEventInfo {
    frame: number;
    func: string;
    params: any[];
    x: number;
}

export interface ICopyEvent {
    clipUuid: string;
    frames: number[];
}

export interface ISelectPropertyData extends ISelectParam {
    value: any;
}

export interface IDisplayEventDump {
    x: number;
    frame: number;
}

export enum ILoadingState {
    NONE = '',
    WAIT_SCENE_READY = 'wait_scene_ready',
    WAIT_ANI_DATA = 'init_animation_data',
}

export interface propertyMenuItem {
    key: string;
    disable: boolean;
    menuName?: string;
    displayName: string;
    category: string;
}

interface IScrollInfo {
    top: number;
    height: number;
    size: {
        w: number,
        h: number;
    }
}

interface IStickBoxStyle {
    top: string;
    left: string;
    width: string;
    height: string;
}

export type IAnimationStateType = 'stop' | 'play' | 'pause' | 'resume';
export interface IAniPropCurveDumpData extends IPropCurveDumpData {
    _parentType?: any;
}

export interface BezierPresetItem {
    name: string;
    data: number[];
    svgData?: string;
}

export type LayoutOptions = {
    embeddedPlayer: boolean;
    node: boolean;
    property: boolean;
    auxiliaryCurve: boolean;
};
// top => player; center => node; 因为 property 目前是自动撑满的(flex-1)，因此暂时没有特殊标记
export type LayoutType = 'top' | 'left' | 'center' | 'auxCurve';
export type LayoutPercentKey = `${LayoutType}Pec`;
// 这里的名称需要遵循 type + 'Pec' 的命名约定。Flags, mousemove 的逻辑中会使用到
export type LayoutHeightMap = {
    [K in LayoutPercentKey]: number;
}

export interface aniVmData {
    // --------------- 动画编辑器自身数据相关 --------------------
    // 存储当前布局信息
    layout: LayoutHeightMap;
    leftResizeMoving: boolean;
    expandLayout: LayoutOptions;
    filterInvalid: boolean; // 是否过滤无效节点
    filterName: string; // 过滤文本

    loading: string; // 当前显示的 loading 遮罩文本内容
    wrapModeList: Array<{ name: string; value: number }>; // 循环模式的渲染列表数据 freeze
    maskPanel: '' | 'event'; // 当前遮罩面板类型 （maskPanelId）
    nodesHeight: number; // 模拟节点高度
    toast: {
        message: string;
    };

    nodeScrollInfo: null | IScrollInfo;
    propertyScrollInfo: null | IScrollInfo;
    embeddedPlayerScrollInfo: null | IScrollInfo;
    showAnimCurve: boolean; // 是否显示动画曲线
    // showAnimEmbeddedPlayer: boolean; // 是否显示嵌入播放器

    // ------------------ 控制数据更新时机 ---------------
    selectDataChange: number; // (X)
    updateKeyFrame: number; // (X)
    updatePosition: number; // (X)
    updateSelectNode: number; // (X)
    updateSelectKey: number; // (X)
    scrolling: boolean; // (X)

    // ---------------- 动画操作数据相关 ----------------
    editEventFrame: number;
    // 辅助小红线
    previewPointer: null | {
        x: number;
        y: number;
        frame: number;
    };
    moveInfo: null | {
        frame: number;
        offsetFrame: number;
        x: number;
        y: number;
    }; // 存储当前移动过程中的关键帧信息

    selectedId: string; // 选中节点 uuid (selectedNodeUUID)
    selectedIds: Set<string>; // 当前所有的选中节点信息 (selectedNodeUUIDs)
    selectPath: string; // 选中节点路径
    moveNodePath: string; // 正在迁移的动画节点路径
    selectKeyInfo: null | ISelectKey; // (selectKeyInfo)
    selectEventInfo: null | IStartDragEvent;
    selectEmbeddedPlayerInfo: null | ISelectEmbeddedPlayerInfo[];
    boxInfo: null | ISelectBoxInfo; // 存储框选信息 (ISelectBoxInfo)
    boxStyle: null | {
        // 选择框样式 (selectBoxStyle)
        top: string;
        left: string;
        right: string;
        bottom: string;
    };
    boxData: null | {
        origin: {
            x: number;
            y: number;
        };
        w: number;
        h: number;
        type: 'node' | 'property';
    };
    aniCompType: null | IAnimationType; // 动画组件类型
    lightCurve: {
        name: string;
        color: string;
    } | null; // 当前高亮的曲线信息
    hasSelectedCurveClip: boolean;
    expandTab: string;

    // ---------------- 动画显示数据相关 ----------------
    // rootInfo: null | {
    //     uuid: string; // 根节点 uuid
    //     active: boolean; // 是否隐藏
    // }
    root: string; // (X)
    active: boolean; // 根节点是否隐藏 (X)
    selectProperty: null | ISelectProperty; // 选中的属性数据值

    animationState: IAnimationStateType; // 当前播放状态，改 playState
    currentFrame: number; // 当前关键帧
    animationMode: boolean; // 是否在动画编辑模式下

    clipsMenu: IClipInfo[]; // clip 菜单

    // 属性轨道关键帧数据 Map，关键帧数据是裁剪过的
    properties: null | Record<string, IPropData>;
    nodeDump: null | readonly INodeInfo[]; // 节点 dump 数据
    eventsDump: null | IDisplayEventDump[]; // 动画事件关键帧数据
    expandInfo: Record<string, boolean>; // 存储属性轨道的是否展开数据
    propertiesMenu: null | propertyMenuItem[]; // 属性菜单数组
    curveDisabledCCtypes: string[];
    searchPresetName: string;
    // 计算属性
    // computeSelectPath: string; // 计算属性，当前选中的节点路径
    timeInfos: { value: number; x: number }[]; // 时间轴上秒的位置信息
    showType: IShowType;
    embeddedPlayerGroups: IEmbeddedPlayerGroup[];
    enableEmbeddedPlayer: boolean;

    // 目前因为 现有bug 如果打开baked animation选项，动画编辑器无法播放动画。
    // 所有需要在动画编辑器上加警告提示用户
    // 相关 issue：https://github.com/cocos/3d-tasks/issues/13604
    showUseBakedAnimationWarn: boolean;
    useBakedAnimationWarnTip: HTMLElement | null;
    currentSceneMode: string; // 当前场景模式
}

export interface IEmbeddedPlayerGroup extends EmbeddedPlayerGroup {
    embeddedPlayers: IEmbeddedPlayerInfo[];
    menuInfo: IEmbeddedPlayerMenuItem;
}

export interface IStickInfo {
    leftFrame: number;
    rightFrame: number;
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ICreateKeyInfo {
    frame?: number;
    group?: string;
    nodePath: string;
    value?: {
        newValue: any;
    };
    prop: string;
}

export interface ICreateEmbeddedPlayerInfo {
    begin?: number;
    end?: number;
    playable?: IPlayerInfo;
    group?: string;
}

export interface IEmbeddedPlayerMenuItem {
    value: IPlayableInfo,
    label: string,
    icon: string;
    active?: boolean;
    trackLabel: string;
    // default?: ICreateEmbeddedPlayerInfo; // 创建的默认值信息，不同菜单项可能会带上一些初始参数
    pathPlaceholder: string; // path 属性的 placeholder
}
interface aniVmCompute {
    clipConfig: null | IClipConfig; // 当前 clip 的配置信息
    computeSelectPath: string;
    lock: boolean;
    selectPropData: IPropData;
    sample: number;
    lastFrameInfo: {
        frame: number;
        x: number;
    };
    propertyHeight: number;
    stickInfo: null | IStickInfo;
    stickBoxStyle: null | IStickBoxStyle;
    curveData: null | ICurveValue & {
        hasUserEasingMethod: boolean; // 是否含有自定义 easingMethod
    };
    presetArr: BezierPresetItem[];
    currentTime: string;
    displayPropertiesMenu: Editor.Menu.ContextMenuItem[];
    displayLayout: LayoutHeightMap;
}

// interface ICurveElement extends Editor.Interface.UIKit.EditorElementBase {
//     value: ICurveValue;
//     resize(w: number, h: number): void;
//     setConfig(opt: any);
// }
export type VMThisTemplate<data = {}, m = {}, c = {}> = data & m & c;

// not recommended
export type IAniVMSetup = {
    t(keypath: string, args?: Record<string, any>): string;
    currentClip: string; // 当前 clip UUID (currentClipUUID)
    isSkeletonClip: boolean; // 是否是骨骼动画

    focusedCurve: IAniCurveName | ''; // 用户当前聚焦的曲线编辑器

    offset: number;
    scale: number;

    auxCurveStore: AuxCurveStore;
    transformEvent: UseTransformEventReturn;

    enableAuxCurve: boolean;
    updateAuxCurveEnableState: () => Promise<void>;
};

// 曲线组件需要实现的公共接口
export type IAniCurveComponent = {
    editor: Ref<Editor.UI.HTMLCustomElement>;
    // TODO: 使用 CurveEditor.curveCtrl 的类型，但需要先处理好类型定义
    curveCtrl: Record<string, any>;
    sample: Ref<number>;
    repaint(): void;
    paint(data: ICurveValue | undefined | null): void;
    resize(width: number, height: number): void;
    zoomToFit(): void;
    zoomToSelectedKeys(): void;
};
export type UnwrappedAniCurveComponent = UnwrapNestedRefs<IAniCurveComponent>;

export type IAniVMRefs = {
    right: HTMLDivElement;
    gridCanvas: HTMLCanvasElement;
    'node-content': HTMLDivElement;
    nodes: HTMLDivElement;
    'embeddedPlayer-content': HTMLDivElement;
    embeddedPlayer: HTMLDivElement;
    property: HTMLDivElement;
    'property-content': HTMLDivElement;
    left: HTMLDivElement;
    xAxis: HTMLDivElement;
    chart: HTMLDivElement;
    container: HTMLDivElement;

    // 名称变动时注意同步到 IAniCurveName 类型中
    curve: Vue & UnwrappedAniCurveComponent; // 属性曲线编辑器
    auxCurve: Vue & UnwrappedAniCurveComponent; // 辅助曲线编辑器
};
export type IAniCurveName = keyof Pick<IAniVMRefs, 'curve' | 'auxCurve'>;

export type IAniVMThis = ComponentInstance &
    aniVmData &
    IAniVMMethods &
    aniVmCompute &
    IAniVMSetup & {
        $refs: IAniVMRefs & {
            [key: string]: HTMLCanvasElement[];
        };
        $el: HTMLDivElement;
    };

export interface IAniVMMethods {
    onFilter: (event: Event) => void;
    onConfirm: (event: Event) => void;
    onScroll: (event: Event, type: 'node' | 'property') => void;
    onMouseWheel: (event: WheelEvent) => void;
    onMouseDown: (event: MouseEvent) => void;
    onPropertyListContextMouseDown: (event: MouseEvent) => void;
    toggleAniCurve: () => void;
    // toggleAnimEmbeddedPlayer: () => void;
    toggleInvalidNode: () => void;
    onPropChange: (event: Event) => void;
    onPropConfirm: (event: CustomEvent) => void;
    onStartResize: (event: MouseEvent, type: 'left' | 'top') => void;
    onUpdateEvent: (uuid: string, frame: number, event: IEventDump[]) => void;
    pointerPosition(offset?: number): number
    calcSelectProperty(params: null | ISelectProperty, isUpdate?: boolean): void;
    queryDurationStyle(frame: number): string;
    showSelectedKeys(): void;
    showAllKeys: () => void;
    onEditEasingMethodCurve: (event: MouseEvent) => Promise<void>;
    onClipCurvePreset: (curveData: number[]) => void;
    changeFrameShowType: (showType: IShowType) => void;
    onTimeConfirm: (event: any) => void;
    onScale: (scale: number) => void;
    onShowEmbeddedPlayerMenu: (event: MouseEvent) => void;
    toggleExpandLayoutChange: (type: 'node' | 'embeddedPlayer') => void;
    updateEnableEmbeddedPlayer: () => Promise<void>;

    onShowUseBakedAnimationWarn: (event: MouseEvent) => void;
}

// TODO: use types in `@vueuse` instead
export type MaybeRef<T>= T | Ref<T>;
