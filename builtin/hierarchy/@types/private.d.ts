export interface IdragNode {
    /**
     * 拖动 start 的起始赋值
     * 赋值节点各自的类型
     * 外部资源的情况包括资源可能的所有类型，
     * 是否接受该类型需要在 drop 中明确判断
     */
    type: string;
    value?: string; // 被拖动的节点 uuid
    name?: string; // 附加名称数据
    additional: IdragNodeInfo[]; // 数组，多选资源时所有被选资源的信息
    to: string; // 被指向的节点 uuid
    insert: 'inside' | 'before' | 'after'; // 插入方式，有三种：inside, before, after
    copy: boolean; // 是否是拖动复制
    keepWorldTransform: boolean; // 是否保持拖动后保留当前世界坐标
}

export interface IdragNodeInfo {
    type: string; // 节点或资源的类型
    value: string; // uuid
    name?: string; // 节点或资源名称
}

export interface IdumpNode {
    extends?: string[]; // 所继承的类
    readonly: boolean;
    type: string; // 节点或资源的类型
    value: { uuid: string };
    name: string; // 节点或资源名称
    visible: boolean;
}

export interface IaddNode {
    name?: string; // 节点名称
    assetUuid?: string; // 从哪个资源创建出来
    parent?: string; // 父级节点的 uuid
    sibling?: string; // 出现输入框的位置
    unlinkPrefab?: boolean; // 还原为普通节点
    canvasRequired?: boolean; // 新增节点前必要的检查，比如新建 ui 节点前需要检查是否有 canvas 的父节点
    keepWorldTransform?: boolean; // 是否保持新节点的世界坐标不变
}

export interface ItreeNode {
    name: string; // 来自 scene 场景的查询数据
    active: boolean; // 是否在 scene 中显示
    locked: boolean; // 是否在编辑器中锁定
    uuid: string;
    type: string;
    children: ItreeNode[];
    components: string[];
    prefab: any;
    parent: string;

    // 以下是扩展的数据
    additional: IdragNodeInfo[]; // drag 需要的 components 数据
    path: string; // 节点的完整路径
    isScene: boolean; // 是否是 scene 根节点
    isPrefabRoot: boolean; // 正在编辑的 .prefab 根节点
    isPrefabNode: boolean; // 是否是 prefab 特性的节点
    isAddedChild: boolean; // 是否是PrefabInstance里新增的节点
    isAnimationNode: boolean; // 属于当前动画编辑模式下的节点
    isActive: boolean; // 根据自身和父级的 active 调整状态
    isVisible: boolean; // 是否在视窗的范围内
    readonly: boolean; // 是否是只读
    top: number; // top 位置
    left: number; // 缩进的大小
    depth: number; // 树形层级
    level: string; // 节点在树形索引位置的字符表现，如 0_1_0，当前用于记录折叠状态
    isParent: boolean; // 是否是父节点
    isExpand: boolean; // 是否展开显示
    state: string; // 状态
    parentUuid: string; // 父级的 uuid
    _height: number; // 整个节点包括children的高度
    height: number; // 整个节点包括children的高度
}

export interface sceneState {
    assetUuid: string; // 当前场景对应的 .scene 或 .prefab 资源
    animationUuid: string; // 正在编辑动画的节点
    expandLevels: string[]; // 记录展开的节点所对应的层级
}

// 识别外部扩展所用到的数据类型 --> start
export interface DropItem {
    type: string;
    message: string;
}

export interface DropCallbackInfo {
    node: string; // 拖入到哪个节点上 uuid
    parent: string; // 拖入节点的父级 uuid
    index: number; // 所在 children 的索引位置
    position: 'inside' | 'before' | 'after'; // 节点拖入的位置
}

// 识别外部扩展所用到的数据类型 --> end
