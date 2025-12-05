export {
    ContributionInfo,
    ExecuteAssetDBScriptMethodOptions,
} from './public';

// AssetDB 进程的内部全局变量
declare global {
    const Manager: IManager;
}

// window 全局 Manager 变量
interface IManager {
    AssetInfo: IAssetWorkerInfo,
    AssetWorker: { [key: string]: any }
    serialize: Function;
    Utils: {
        queryAssets: (options?: ISearchOptions) => IAssetInfo[];
        queryAssetInfo: (uuid: string) => IAssetInfo | null;
    },
}
export interface IAssetDBConfig {
    name: string;
    target: string;
    project?: string;
    library?: string;
    temp?: string;
    visible?: boolean;
    readonly: boolean;
    level: number;
    interval: number;
    binaryInterval: number;
    usePolling: boolean;
    alwaysStat: boolean;
    followSymlinks: boolean;
    ignoreRegular: string;
    ignoreFiles: string[];
}

export interface IAssetWorkerInfo {
    engine: string; // 引擎所在目录
    type: string; // 当前项目的类型 2d | 3d
    dist: string; // asset-db 目标目录（importer 等）
    utils: string; // 引擎的 utils 所在目录
}

export interface IDatabaseInfo {
    name: string; // 数据库名字
    target: string; // 源目录地址
    library: string; // 导入数据地址
    temp: string; // 临时目录地址
    readonly: boolean; // 是否只读
    visible: boolean; // 是否显示
}

export interface IAssetInfo {
    name: string; // 资源名字
    displayName: string; // 资源用于显示的名字
    source: string; // url 地址
    path: string; // loader 加载的层级地址
    url: string; // loader 加载地址会去掉扩展名，这个参数不去掉
    file: string; // 绝对路径
    uuid: string; // 资源的唯一 ID
    importer: string; // 使用的导入器名字
    imported: boolean; // 是否结束导入过程
    invalid: boolean; // 是否导入成功
    type: string; // 类型
    isDirectory: boolean; // 是否是文件夹
    library: { [key: string]: string }; // 导入资源的 map
    subAssets: { [key: string]: IAssetInfo }; // 子资源 map
    visible: boolean; // 是否显示
    readonly: boolean; // 是否只读

    instantiation?: string; // 虚拟资源可以实例化成实体的话，会带上这个扩展名
    redirect?: IRedirectInfo; // 跳转指向资源
    meta?: any,
    fatherInfo?: any;
}

export interface IAsset {
    name: string; // 资源名字
    asset: import('@editor/asset-db').Asset; // AssetDB 的资源
}

export interface IRedirectInfo {
    type: string; // 跳转资源的类型
    uuid: string; // 跳转资源的 uuid
}

export interface IMoveOptions {
    confirmOverwrite?: boolean; // 是否要提示询问覆盖文件
    overwrite?: boolean; // 是否强制覆盖文件
}

export interface ICreateOption {
    src?: string; // 源文件地址，如果传入 content 为空，则复制这个指向的文件
    overwrite?: boolean; // 是否覆盖文件
}

export type assetsType = 'scene' | 'scripts' | 'effect' | 'image';

export interface ISearchOptions {
    type?: assetsType,
    ccType?: string, // 'cc.Spritframe' 这类
    isBundle? : boolean, // 筛选 asset bundle 信息
    importer?: string, // 导入名称
    pattern?: string, // 路径匹配
    extname?: string, // 扩展名匹配
}
