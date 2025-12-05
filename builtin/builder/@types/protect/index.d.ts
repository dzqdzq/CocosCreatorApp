import { IBuild, IBuildUtils, ITaskState } from '../public';
import { InternalBuildResult } from './build-result';

export * from './asset-manager';
export * from './import-map';
export * from './options';
export * from './build-result';
export * from './build-plugin';
export * from '../public';

export type Physics = 'cannon' | 'ammo' | 'builtin';
export type Url = string; // 需要的是符合 url 标准的字符串
export type AssetInfoArr = Array<string | number>; // 固定两位或三位数组 [url,ccType,isSubAsset]
export type IProcessingFunc = (process: number, message: string, state?: ITaskState) => void;
export interface IBuildManager {
    taskManager: any;
    currentCompileTask: any;
    currentBuildTask: any;
    __taskId: string;
}

export interface IQuickSpawnOption {
    cwd?: string;
    env?: any;
    
    downGradeWaring?: boolean; // 将会转为 log 打印，默认为 false
    downGradeLog?: boolean; // 将会转为 debug 打印，默认为 true
    downGradeError?: boolean; // 将会转为警告，默认为 false
    ignoreLog?: boolean; // 忽略 log 信息
    ignoreError?: boolean; // 忽略错误信息
    prefix?: string; // log 输出前缀
}
export interface IInternalBuildUtils extends IBuildUtils {
    /**
     * 获取构建出的所有模块或者模块包文件。
     */
    getModuleFiles(result: InternalBuildResult): Promise<string[]>;

    /**
     * 快速开启子进程
     * @param command
     * @param cmdParams
     * @param options
     */
    quickSpawn(command: string, cmdParams: string[], options?: IQuickSpawnOption): Promise<number | boolean>;

    /**
     * 将某个 hash 值添加到某个路径上
     * @param targetPath
     * @param hash
     * @returns
     */
    patchMd5ToPath(targetPath: string, hash: string): string;

    /**
     * 编译脚本，遇到错误将会抛出异常
     * @param contents
     * @param path
     */
    compileJS(contents: Buffer, path: string): string;
}

export interface IInternalBuild extends IBuild {
    Utils: IInternalBuildUtils;
    debugMode: boolean; // 是否为调试模式，仅供开发使用，进程池开启的子进程打开 inspector 后会自动在第一行断点，任务管理器也可以随意组织
}

export interface IBuildProcessInfo {
    state: ITaskState; // 任务状态
    progress: number; // 任务进度
    message: string; // 最后一次更新的进度消息
    id: string; // 任务唯一标识符
    options: any; // 构建参数
}

export interface fileMap {
    src: string;
    dest: string;
}

export interface IScriptInfo {
    file: string;
    uuid: string;
}

type ICheckRule = 'pathExist' | 'valid' | 'required' | 'normalName' | 'noChinese' | 'array' | 'string' | 'number' | 'http';

export interface IBuildPanel {
    // 内部使用的 Vue
    Vue: any;
    // 内置 vue 组件
    vueComps: {
        buildProp: any;
        templateComp: any;
    };
    validator: {
        has: (ruleName: string) => boolean;
        // 通过返回空字符串，失败返回错误信息
        checkRuleWithMessage: (ruleName: ICheckRule, val: any, ...arg: any[]) => Promise<string>;
        check: (ruleName: ICheckRule, val: any, ...arg: any[]) => Promise<boolean>;
        checkWithInternalRule: (ruleName: ICheckRule, val: any, ...arg: any[]) => boolean;
        queryRuleMessage: (ruleName: ICheckRule) => string;
    };
}
