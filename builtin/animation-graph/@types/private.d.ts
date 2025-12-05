import { animation, Vec2 } from 'cc';
import { AssetInfo } from '../../asset-db/@types/public';
import * as animationApi from 'cc/editor/new-gen-anim';
import { EnvType } from '../source/env-type';
import { PEGAddNodeArgs, PEGAddNodeKey, PEGCopyNodesInfo, PEGGraphData, PEGNodeID } from '../source/pose-expr-graph/instance-data';
import { PEGNodeTypeID } from './static-data';

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
    pasteInfo: {
        type: 'none' | 'state' | 'state-machine' | 'pose-nodes';
    } | {
        type: 'state';
        withTransitions?: boolean;
    };
    envType: Record<string, string>;
    view: {
        stateMachine?: stateMachineData;
        crumbs: crumbData[];
        layerIndex: number;
        stateIndex: number;
        transitionIndex: number;
        motion?: motionData;
        motionLevel: number[];
        poseExpr?: poseExprData;
        poseExprNodeId?: PEGNodeID;
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

    /**
     * Animation Blend 2D algorithm 的单向枚举。 
     */
    AnimationBlend2DAlgorithm: Record<string, number | string>;

    /**
     * TCBindingValueType 的单向枚举。
     */
    TCBindingValueType: Record<string, number | string>;
    tcBindingTypeInfos: {
        id: string;
        menu: string;
        provisions: readonly number[];
        transitionSourceFilter: readonly string[] | undefined;
    }[];
}

export interface layerData {
    index: number;
    name: string;
    props: Record<string, any>;
}

export interface stateMachineData {
    allowEmptyStates: boolean;
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
    props?: MotionProps;
    value: motionDataValue;
    min: number[];
    max: number[];
    threshold?: number | Vec2 | Record<string, number>;
    level: number[];
    children?: motionData[];
    editorData?: InitialEditorData;
    /**
     * 该动作涉及的所有影响混合的参数变量和它们的当前值。
     * 目前只会在 `queryDataTemplate['view']['motion']` 中进行赋值。
     * 预览器目前会用到这些信息。
     */
    involvedBlendParamVariables?: Record<string, {
        /**
         * 该变量的当前值。
         * 如果 `this.valid === true`，那么该值就是动画图中该变量的值；否则，是另一个默认值。
         */
        value: number;
        /**
         * 该变量是否有效。如果该变量不在动画图中（比如原先在后来删了）或者类型不匹配时，该字段将为 `false`。
         * 
         * 预览器在展示该动作涉及的参数时可以在以下方案中任选一个：
         * - 忽略这个字段，即使无效也能去调整；
         * - 或者在上一个方案的基础上，给出一个警告标志；
         * - 或者根据这个字段将“无效”的参数都剔除不让预览。
         */
        valid: boolean;
        /**
         * 该变量应有的最小值。
         */
        min: number;
        /**
         * 该变量应有的最大值。
         */
        max: number;
    }>;
}

export interface MotionProps {
    algorithm: number;
}

export type motionDataValue = null | clipMotionData | AnimationBlendData | AnimationBlendData[];

export interface clipMotionData {
    uuid: string;
}
export interface AnimationBlendData {
    variable: string;
    value: number;
}

export type EventBindingsData = Record<string, string>;

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
    eventBindings?: EventBindingsData;
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
    eventBindings?: EventBindingsData;
}

export type TCBindingData = Record<string, any>;

export interface UnaryConditionData {
    type: EnvType.UnaryCondition;
    operator: number;
    operand: string;
}

export interface BinaryConditionData {
    type: EnvType.BinaryCondition;
    operator: number;
    lhs: number;
    lhsBinding: TCBindingData;
    rhs: number;
    isRhsInteger: boolean;
}

export interface TriggerConditionData {
    type: EnvType.TriggerCondition;
    trigger: string;
}

export type conditionData = UnaryConditionData | BinaryConditionData | TriggerConditionData;

export interface variableData {
    type: string;
    /**
     * 变量值的 dump。
     */
    value: unknown;
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
    type?: undefined | EnvType.MotionState | EnvType.PoseExprState;
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
    poses?: {
        id: number,
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

type CrumbType = crumbData['type'];

type CrumbValue<T extends CrumbType> = Extract<crumbData, { type: T }>['value'];

export type crumbData = { name: string } & ({
    type: '';
    value: undefined | null | '';
} | {
    type: EnvType.state;
    /**
     * State index.
     */
    value: number;
} | {
    type: EnvType.layer;
    value?: any;
} | {
    type: EnvType.StateMachine;
    value?: any;
} | {
    type: EnvType.SubStateMachine;
    /**
     * State index.
     */
    value: number;
} | {
    type: EnvType.MotionState;
    /**
     * Motion level.
     */
    value: number | number[];
} | {
    type: EnvType.ClipMotion | EnvType.AnimationBlend1D | EnvType.AnimationBlend2D;
    /**
     * Motion level.
     */
    value: number[];
} | {
    type: EnvType.Transition;
    /**
     * Transition index.
     */
    value: number;
} | {
    type: EnvType.PoseExprState;
    value?: any;
} | {
    type: EnvType.PoseExprNode;
    /**
     * Pose expr node ID.
     */
    value: number;
} | {
    type: EnvType.LayerStash;
    value: {
        /**
         * Layer index.
         */
        layerIndex: number;

        /**
         * Stash id.
         */
        stashId: string;
    };
}
);

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

export type clipboard = {
    type: 'none';
} | {
    type: 'state';
    stateMachine: StateMachine|null;
    state: State|null;
} | {
    type: 'pose-nodes';
    copyPoseNodes: PEGCopyNodesInfo;
} | {
    type: 'state-machine';
    stateMachine: StateMachine;
};

export type AddPoseNodeData = ({
    key: PEGAddNodeKey;
}) & {
    editorData: InitialEditorData,
};

export interface PoseNodeEditorData extends InitialEditorData {
    collapse?: boolean;
}


export interface ViewState extends stateData {
    rename: boolean;
    editorData: editorData & { id: string }
};

export interface ViewMotion extends motionData {
    rename: boolean;
    editorData: editorData & { id: string }
    children: motionData[];
};

export interface ViewTransition extends transitionData {};