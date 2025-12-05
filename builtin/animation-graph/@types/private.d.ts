import { animation, Vec2 } from 'cc';
import { AssetInfo } from '../../asset-db/@types/public';
import * as animationApi from 'cc/editor/new-gen-anim';
import { EnvType } from '../source/env-type';

export type StateMachine = animationApi.StateMachine;

export type State = animationApi.State;

export type Motion = NonNullable<animationApi.MotionState['motion']>;

export type Transition = animationApi.Transition | animationApi.AnimationTransition;

export type Condition = animationApi.BinaryCondition | animationApi.UnaryCondition | animationApi.TriggerCondition;

export type UnaryConditionOperator = animationApi.UnaryCondition.Operator;

export type BinaryConditionOperator = animationApi.BinaryCondition.Operator;

export type TriggerResetMode = animationApi.TriggerResetMode;

export interface queryDataTemplate {
    assetInfo: AssetInfo | null;
    isDirty: boolean;
    canPasteState: boolean;
    canPasteStateWithTransition: boolean;
    envType: Record<string, string>;
    view: {
        stateMachine?: stateMachineData;
        crumbs: crumbData[];
        layerIndex: number;
        stateIndex: number;
        transitionIndex: number;
        motion?: motionData;
        motionLevel: number[];
    };
    layers: layerData[];
    variables: Record<string, variableData>;
    variableType: typeof animationApi.VariableType;
    previewState: any;
    unaryConditionOperator: typeof UnaryConditionOperator;
    binaryConditionOperator: typeof BinaryConditionOperator;
    binaryConditionOperatorI18n: Record<string, string>;
    unaryConditionOperatorI18n: Record<string, string>;
    conditionVariableType: string[];
    cannotAddMotionStateType: string[];
    cannotAddComponentStateType: string[];
    cannotRemoveStateType: string[];
    motionType: string[];
    animationBlendType: string[];
}

export interface layerData {
    index: number;
    name: string;
    props: Record<string, any>;
}

export interface stateMachineData {
    states: stateData[];
    transitions: transitionData[];
}

export interface componentData {
    name: string;
    index: number;
    value: any;
}

export interface motionData {
    type: string;
    name: string;
    value: motionDataValue;
    min: number[];
    max: number[];
    threshold?: number | Vec2 | Record<string, number>;
    level: number[];
    children?: motionData[];
    editorData?: InitialEditorData;
}

export type motionDataValue = null | clipMotionData | AnimationBlendData | AnimationBlendData[];

export interface clipMotionData {
    uuid: string;
}
export interface AnimationBlendData {
    variable: string;
    value: number;
}

export interface stateData {
    index: number;
    name: string;
    type: string;
    props?: stateProps;
    editorData: InitialEditorData;
    outGoings: number[];
    inComings: number[];
    stateMachine?: stateMachineData;
    components?: componentData[];
}

interface bindableNumber {
    variable: string;
    value: number;
}

interface bindableBoolean {
    variable: string;
    value: boolean;
}

export interface stateProps {
    speed: number;
    speedMultiplier: string;
    speedMultiplierEnabled: boolean;
    motion: motionData;
}

export interface transitionData {
    type: string;
    index: number;
    priority: number;
    from: {
        index: number;
        name: string;
        type: string;
    };
    to: {
        index: number;
        name: string;
        type: string;
    };
    removable: boolean;
    duration: number;
    relativeDuration: boolean;
    interruptible?: boolean;
    exitConditionEnabled?: boolean;
    exitCondition?: number;
    destinationStart?: number;
    relativeDestinationStart: boolean;
    editorData: any;
    conditions: conditionData[];
}

export interface conditionData {
    type: string;
    operator?: number;
    lhs: {
        type: string;
        value: {
            variable: string;
            constant?: number | string | boolean;
        };
    };
    rhs?: {
        type: string;
        value: {
            variable: string;
            constant: number | string | boolean | undefined;
        };
    };
}

export interface variableData {
    type: string;
    value: number | string | boolean;
    resetMode?: TriggerResetMode;
}

export interface viewportData {
    scale: number;
    top: number;
    left: number;
}

export interface InitialEditorData {
    id?: string;
    centerX?: number;
    centerY?: number;
    name?: string;
    viewport?: viewportData;
    clone?: Function;
}

export interface editorData extends InitialEditorData {
    centerX: number;
    centerY: number;
}

export interface MotionEditorDataBlend2DThreshold {
    radiusX: number;
    radiusY: number;
}
export interface motionEditorData extends InitialEditorData {
    autoThreshold?: boolean;
    threshold?: MotionEditorDataBlend2DThreshold
}

export type AddStateData = ({
    type?: undefined | EnvType.MotionState;
    motion?: addMotionData;
} | {
    type: EnvType.EmptyState;
} | {
    type: EnvType.SubStateMachine;
    subStateMachine: any;
}) & {
    editorData: InitialEditorData,
};

export interface bestViewportData {
    graph: viewportData;
    states?: {
        index: number,
        editorData: InitialEditorData;
    }[];
    motions?: {
        level: number[],
        editorData: InitialEditorData;
    }[];
}

export interface addMotionData {
    type: string;
    editorData?: InitialEditorData;
    uuid?: string;
}
export interface addComponentData {
    name: '';
}

export interface crumbData {
    type: string;
    value?: any;
    name: string;
}

export interface previewData {
    time: number;
    state: number;
    speed: number;
    status: {
        timeLineLength: number;
        sourceMotionStart: number;
        sourceMotionRepeatCount: number;
        sourceMotionDuration: number;
        targetMotionStart: number;
        targetMotionRepeatCount: number;
        targetMotionDuration: number;
        exitTimesStart: number;
        exitTimesLength: number;
        transitionDurationStart: number;
        transitionDurationLength: number;
    };
}

export interface previewVariableParam {
    name: string;
    value: any;
}

export interface clipboard {
    stateMachine: StateMachine|null;
    state: State|null;
}
