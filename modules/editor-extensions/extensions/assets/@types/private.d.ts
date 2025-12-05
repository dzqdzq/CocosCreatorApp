import { AssetInfo, IRedirectInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';

export { AssetInfo, IRedirectInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';

export interface IDragInfo {
    /**
     * 拖动 start 的起始赋值
     * 赋值资源各自的类型
     * 外部拖进来的文件 type = 'osFile'
     * 外部节点的情况包括节点可能的所有类型，
     * 是否接受该类型需要在 drop 中明确判断
     */
    type: string;
    value: string; // 被拖动的节点 uuid
    additional: IDragAdditional[]; // 数组，多选资源时所有被选资源的信息
    to: string; // 被指向的节点 uuid
    copy: boolean; // 是否是拖动复制
    files?: string[]; // 拖拽中带上外部系统文件
}

export interface IDragAdditional {
    type: string;
    value: string;
    name?: string; // 节点或资源名称
}

export interface IAddInfo {
    url: string;
    folderUuid?: string; // 在该资源上发起的新增, 可能等于或不等于 parentUuid
    template?: string; // 指定模板文件，相同 type 可以指定不同的 template
    importer: string; // 对应 db 的 importer
    // imported: boolean; // 是否成功导入
    fileExt: string; // 新文件的后缀，.js, .ts 等
    fileName: string; // 文件名称不带后缀
    name: string; // 文件名称 带后缀
    parentDir?: string; // 所在的目录的 url
    parentUuid: string; // 所在的目录的 uuid

    params?: any; // 文件模版内需要替换的参数
}

export interface IAssetInfo extends AssetInfo {
    additional: IDragAdditional[]; // 追加拖拽可识别的类型
    fileName: string; // 文件名，不包含后缀
    fileExt: string; // 后缀，不包含点好
    isParent: boolean; // 是否是父节点
    isDB: boolean; // 是否是 DB 根节点
    isSubAsset: boolean; // 是否是 subAsset, 是的话：无右击菜单，可拖动到 scene 或 hierarchy, 但 asset 面板里面的不能移动
    depth: number; // 树形层级
    left: number; // 缩进的大小
    refreshTime: number; // 每次刷新的当前时间戳，目前用于缩略图的刷新
    isBundle: boolean; // 是否是 bundle 文件夹
}

export interface ICopiedAssetInfo {
    uuid: string, // 资源的唯一 ID
    file: string, // 绝对路径
    name: string, // 资源名称
}
export interface ICopiedInfo {
    projectPath: string, // 项目路径
    assetInfo: ICopiedAssetInfo[];
}

export interface IOpenAssetRule {
    // 一种类型的规则配置
    defaultExec: string; // 默认对应偏好面板上的 edit 配置的 script_editor 或 picture_editor
    execPath: string; // 程序的路径
    args: string; // 备用的 cmd 命令行使用的参数
}

export interface IOpenAsset {
    ext: string; // 文件后缀或后缀的类型 如 '.mtl', 'image'
    file: string; // 文件的磁盘路径'
    uuid: string;
}

export interface IPanelRecord {
    sortType: string; // 排序方式
    expandUuids: string[]; // 已展开的节点, [ uuid ]
}

// 识别外部扩展所用到的数据类型 --> start
export interface DropItem {
    type: string;
    message: string;
}

export interface DropCallbackInfo {
    uuid: string; // 拖放到哪个资源 uuid 上
    type: string; // 拖放位置上资源的类型
    isDirectory: boolean; // 拖放位置上资源的是否是文件夹
}

export interface MenuExtension {
    createMenu: Function; // 创建资源的两个入口
    dbMenu: Function; // 资源数据库根节点
    assetMenu: Function; // 资源普通节点
    panelMenu: Function; // 面板空白区域
}

/**
 * ... 更多参数请查阅
 * 扩展右击菜单使用 Eelectron MenuItem
 * https://www.electronjs.org/docs/api/menu-item
 */
export interface IMenuItem {
    accelerator?: string;
    checked?: boolean;
    click?: Function;
    enabled?: boolean;
    label?: string;
    sublabel?: string;
    submenu?: IMenuItem[];
    type?: string;
    visible?: boolean;
    id?: string;
    before?: string;
    after?: string;
}

export interface MenuAssetInfo {
    // 资源名字
    name: string;
    // 资源用于显示的名字
    displayName: string;
    // loader 加载的层级地址
    url: string;
    // 绝对路径
    file: string;
    // 资源的唯一 ID
    uuid: string;
    // 使用的导入器名字
    importer: string;
    // 类型
    type: string;
    // 是否是文件夹
    isDirectory: boolean;
    // 是否只读
    readonly: boolean;
    // 虚拟资源可以实例化成实体的话，会带上这个扩展名
    instantiation?: string;
    // 跳转指向资源
    redirect?: IRedirectInfo;
    // 继承类型
    extends?: string[];
    // 是否导入完成
    imported: boolean;
    // 是否导入失败
    invalid: boolean;
}
// 识别外部扩展所用到的数据类型 --> end

export type IRepeatFile = {
    file: string,
    name: string
}