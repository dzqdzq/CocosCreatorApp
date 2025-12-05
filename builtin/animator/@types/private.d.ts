export {
    IAnimCopyKeySrcInfo,
    IAnimCopyPropSrcInfo,
    IAnimCopyEventSrcInfo,
    IAnimCopyPropDstInfo,
    IAnimCopyKeyDstInfo,
    IAnimCopyEventDstInfo,
    IAnimCopyNodeSrcInfo,
    IPropCurveDumpData,
} from '../../scene/@types/public';

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

export interface IClipDumps {
    curves: IRawCurveData[];
    // only record data display in prop-wrap
    displayClipsDump?: Record<string, Record<string, IPropData>>;
    duration: number; // 0.36666666666666664 s
    events: IEventDump[];
    name: string; // name of clip
    // (/Cube: position: {displayName...})
    pathsDump:  Record<string, Record<string, IPropData>>;
    sample: number;
    speed: number;
    time: number; // s
    wrapMode: IWrapMode; // 0: Default
    isLock: boolean;
    uuid: string; // clip uuid
}

export interface INodesDump {
    // displayNodesDump:
    path: string;
    active: boolean;
    compIndex: number; // index of animation component
    // /: ["cdi6xZPNZHspVZ/rHG2yF8"]
    path2uuid: Record<string, string[]>;
    uuid: string;
    uuid2path: Record<string, string>;
    nodes: INodeInfoBase[];
    displayNodesDump: INodeInfo[];
    nodesDump: INodeInfo[];
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
}

export interface IRawCurveData { // propDate
    displayName: string;
    key: string; // prop
    keyframes: IRawKeyframe;
    nodePath: string;
    partKeys: string[];
    parentPropKey: string;
    type?: IKeyFrameDump;
}

export interface IPropData extends IRawCurveData{
    propOpts: any; // TODO 注释
    nodePath: string;
    prop: string;
    type?: IKeyFrameDump;
    frames?: number[];
    keyFrames: IRawKeyFrame[];
    hidden: boolean; // 是否隐藏
    missing: boolean;
    top: number; // 轨道的高度
    index: number;
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

export interface IRawKeyFrame extends IKeyFrame {
    curve: any;
    dump: IKeyFrameDump;
}
export interface IKeyFrameDump {
    type: string;
    value: any;
}
export interface IStartDragKey {
    startX: number;
    offset: number;
    offsetFrame: number;
    data: IKeyFrame[],
    params: ISelectParam[],
    sortDump: ISortDumps;
    ctrl?: boolean;
    alt?:boolean;
}

export type ISortDumps = Record<string, ISortDump>;
export interface ISortDump {
    frames: number[];
    nodePath: string;
    prop: string;
    params?: ISelectParam[];
    data?: IKeyFrameData[];
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
    type?: {
        value: string;
        extends: string[];
    },
    missing?: boolean;
}

export interface ISelectKey {
    nodePath: string;
    prop: string;
    data: null | IKeyFrameData[];
    params: null | ISelectParam[];
    sortDump?: ISortDumps;
}

export interface ICopyParam extends IParamBase {
    frame: number;
    targetFrame?: number; // 拷贝的目标节点
}

export interface ICopyKeyParam {
    params: ICopyParam[];
    data: IKeyFrameData[];
    sortDump?: ISortDumps;
    clipUuid: string;
}
// export type sortKeysDump = Record<string, ketDumps>

export interface IPropMenuInfo {
    name: string;
    disable: boolean;
    displayName: string;
    key: string;
    opts: any;
    type: any;
}

export interface IPropParams {
    param: {
        nodePath: string,
        prop: string
    },
    data?: IKeyFrameData,
    frame?: number,
    x?: number,
}

export interface IKeyFrameData {
    x: number;
    frame: number;
    prop: string;
    nodePath?: number;
    value?: any;
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
