export interface NodeLibraryExtension {
    name: string; // tab 名称
    module?: string; // 扩展需要 require 的 js 文件
    data: NodeLibraryGroup[];
    refresh?: string; // 插件注册进来的广播消息，用于刷新数据
    packageName: string; // 来自哪个扩展插件
    packageBroadcast: Record<string, Function>; // 可能注册的广播
    packageModule?: any; // 通过 require 扩展数据格式中 contributions['node-library'].module 中的 js 文件得来
}

export interface NodeLibraryGroup {
    name: string; // 组名
    items: NodeLibraryItem[];
}

export interface NodeLibraryItem {
    name: string;
    assetUuid: string;
    type: string;
    icon?: string;
    canvasRequired?: boolean; // 类似 UI 节点，是否需要挂在有 UITransform 组件节点里
    unlinkPrefab?: boolean; // 是否要成为一个普通节点，默认为 true
}
