export * from './public';
export * from '../../asset-db/@types/public';

declare global {
    namespace globalThis {
        // eslint-disable-next-line no-var
        var DEBUG_TIME_COST: boolean;   // 用于调试时间消耗
    }
}

export interface IOptionBase {
    modeName?: string;  // 当前所处的模式
}

export interface IChangeNodeOptions extends IOptionBase {
    source?: string; // 产生的事件的来源，undefined,'editor'为正常编辑器操作产生，'undo'为undo产生,'engine'为引擎发出
    type?: string; // 引发变动的操作或事件类型
    propPath?: string; // 属性路径
    index?: number; // 数组变动可能会传index
}

export interface ISceneMouseEvent {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;

    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    wheelDeltaX: number;
    wheelDeltaY: number;
    moveDeltaX: number;
    moveDeltaY: number;
    leftButton: boolean;
    middleButton: boolean;
    rightButton: boolean;
}

export interface ISceneKeyboardEvent {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    key: string;
    keyCode: number;
}

export interface DragInfo {
    name?: string;
    type: string;
    value: string;
    additional?: string[];
    canvasRequired?: boolean; // 是否需要有 Canvas
    unlinkPrefab?: boolean; // 创建后取消 prefab 状态
}

export interface DragInfoData extends ISceneMouseEvent {
    from: string;
    type: string;
    values: DragInfo[];
}
