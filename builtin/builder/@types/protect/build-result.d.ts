import { BundleCompressionType, IAssetPathInfo, IBuildPaths, IBuildTaskOption, IBundleConfig, IJsonPathInfo, ISettings, UUID } from '../public';
import { IAssetInfo } from './asset-manager';
import { ImportMapWithImports } from './import-map';

export class InternalBuildResult {
    settings: ISettings;
    readonly bundles: IBundle[];
    readonly bundleMap: Record<string, IBundle>;
    // 构建实际使用到的插件脚本 uuid 列表
    plugins: UUID[];
    // 脚本资源包分组（子包/分包）
    scriptPackages: string[];
    // MD5 后缀 map
    pluginVers: Record<UUID, string>;
    // 纹理压缩任务
    public imageCompressTaskMap: Record<UUID, ImageCompressTask>;

    // 纹理压缩结果存储
    public compressImageResult: ICompressImageResult;
    importMap: ImportMapWithImports;
    // 传入构建的 options
    rawOptions: IBuildTaskOption;
    // 输出路径集合
    paths: IBuildPaths;
    // 允许自定义编译选项
    compileOptions?: any;
    addBundle: (bundle: IBundle) => void;
    addPlugin: (plugin: IAssetInfo) => void;
    addImageTask: (uuid: string, taskInfo: { src: string, dest: string, presetId: string, bundleName: string, hasAlpha: boolean, mtime?: string}) => void;
    removeImageTask: (uuid: string) => void;
    getMipmapFiles: (file: string, destDir?: string) => Promise<string[]>;
}
export interface ICompressConfig {
    src: string;
    mipmapFiles?: string[];
    dest: string;
    compressOptions: Record<string, any>;
    format: ITextureCompressType;
    customConfig?: ICustomConfig;
    uuid: string;
}

export interface ImageCompressTask {
    src: string;
    // 需要预生成的 mipmaps 源地址
    mipmapFiles?: string[];
    dest: string[];
    presetId: string;
    compressOptions: Record<string, any>;
    suffixMap: Record<string, string>;
    mtime?: any;
    // 生成阶段将会重新获取 bundle 的输出地址
    bundleNames: string[];
}

export interface IImageTaskInfo {
    src: string;
    // TODO 这个名称已和意义有冲突需要整理调整
    dest: string[];
    presetId: string;
    hasAlpha: boolean;
    mtime?: any;
    // 生成阶段将会重新获取 bundle 的输出地址
    bundleNames: string[];
}

export interface IVersionMap {
    import: Record<UUID, string>;
    native: Record<UUID, string>;
}

export interface IMD5Map {
    'raw-assets': Record<UUID, string>;
    import: Record<UUID, string>;
    plugin?: Record<UUID, string>;
}
export interface IAtlasResult {
    assetsToImage: Record<string, string>;
    imageToAtlas: Record<string, string>;
    atlasToImages: Record<string, string[]>;
}

export class IBundle {
    readonly scenes: UUID[]; // 该 bundle 中的所有场景，包含重定向的
    readonly assets: UUID[]; // 该 bundle 中的所有资源，包含重定向的
    readonly assetsWithoutRedirect: UUID[]; // 该 bundle 中的未重定向的资源
    readonly scripts: UUID[]; // 该 bundle 中的所有脚本
    readonly rootAssets: UUID[]; // 该 bundle 中的根资源，即直接放在 bundle 目录下的资源，包含重定向的资源
    readonly isSubpackage: boolean; // 该 bundle 是否是子包
    root: string; // bundle 的根目录, 开发者勾选的目录，如果是 main 包，这个字段为 ''
    dest: string; // bundle 的输出目录
    importBase: string;
    nativeBase: string;
    scriptDest: string; // 脚本的输出目录
    name: string; // bundle 的名称
    priority: number; // bundle 的优先级
    compressionType: BundleCompressionType; // bundle 的压缩类型
    assetVer: IVersionMap; // bundle 内的资源版本
    version: string; // bundle 本身的版本信息
    readonly isRemote: boolean; // bundle 是否是远程包
    redirect: Record<UUID, string>; // bundle 中的重定向资源
    deps: Set<string>; // bundle 的依赖 bundle
    groups: IGroup[]; // 该 bundle 中的资源分组
    cache: any;
    configOutPutName: string;
    config: IBundleConfig; // 该 bundle 的资源清单
    readonly isZip: boolean; // 该 bundle 是否是 zip 模式
    zipVer: string; // Zip 压缩模式，压缩包的版本
    atlasRes: IAtlasResult;
    compressRes: Record<string, string[]>;
    hasPreloadScript: boolean;
    _rootAssets: Set<UUID>; // 该 bundle 直接包含的资源
    _scenes: Set<UUID>;
    _scripts: Set<UUID>;
    _assets: Set<UUID>;

    addScene(scene: UUID): void;
    addScript(script: UUID): void;
    addRootAsset(asset: IAssetInfo): void;
    addAsset(asset: UUID): void;
    removeAsset(asset: UUID): void;
    addRedirectWithUuid(asset: UUID, redirect: string): void;
    addRedirect(asset: UUID, redirect: string): void;
    addAssetWithUuid(asset: UUID): void;
    getRedirect(uuid: UUID): string | undefined;
    addGroup(type: IJSONGroupType, uuids: UUID[]): void;
    addToGroup(type: IJSONGroupType, uuid: UUID): void;
    removeFromGroups(uuid: UUID): void;
    getJsonPath(uuid: string): string;
    getAssetPathInfo(uuid: string): IAssetPathInfo | null;
    containsAsset(uuid: string): boolean;
    getRawAssetPaths(uuid: string): string[];
    getJsonPathInfo(uuid: string): IJsonPathInfo | null;

    _resolveImportPath: (name: string) => string;
    _resolveNativePath: (libraryPath: string, extName: string) => string;
}

export type ICompressImageResult = Record<UUID, {
    formats: string[],
    files: string[],
}>;

export interface IGroup {
    // 分组名字
    name?: string;
    // 分组类型
    type: IJSONGroupType;
    // 该组中的资源 uuid 列表
    uuids: UUID[];
}

export type IJSONGroupType = 'NORMAL' | 'TEXTURE' | 'IMAGE';

export interface IDefaultGroup {
    assetUuids: UUID[];
    scriptUuids: UUID[];
    jsonUuids: UUID[];
}

export interface IBundleOptions {
    root: string, // bundle 的根目录, 开发者勾选的目录，如果是 main 包，这个字段为''
    dest: string, // bundle 的输出目录
    scriptDest: string, // 脚本的输出目录
    name: string, // bundle 的名称
    priority: number, // bundle 的优先级
    compressionType: BundleCompressionType, // bundle 的压缩类型
    isRemote: boolean // bundle 是否是远程包
    // isEncrypted: boolean // bundle 中的代码是否加密，原生平台使用
}
