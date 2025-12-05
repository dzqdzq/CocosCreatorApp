
export * from '../../../../builtin/builder/@types/protect';
import { IInternalBuildOptions, InternalBuildResult, IPolyFills } from '../../../../builtin/builder/@types/protect';

export type IOrientation = 'landscape' | 'portrait';

export interface IOptionOrientation {
    landscapeLeft: boolean;
    landscapeRight: boolean;
    portrait: boolean;
    upsideDown: boolean;
}

export interface ITaskOptionPackages {
    native: IOptions;
    android?: {
        apiLevel: string,
        appABIs: string[],
        appBundle: boolean,
        keystoreAlias: string,
        keystoreAliasPassword: string,
        keystorePath: string,
        keystorePassword: string,
        orientation: IOptionOrientation,
        packageName: string,
        useDebugKeystore: boolean,
        sdkPath: string;
        ndkPath: string;
        androidInstant:boolean;
        remoteUrl:string;
    },
    ios?: {
        orientation: IOptionOrientation,
        packageName: string,
    },
    mac?: {
        packageName: string;
        supportM1: boolean;
    },
    windows?: {
        sdkVersion: string
    }
}

export interface ITaskOption extends IInternalBuildOptions {
    packages: ITaskOptionPackages;
}

export interface IOptions {
    template: string;
    remoteServerAddress: string;
    polyfills?: IPolyFills;
    engine?: string;
    makeAfterBuild: boolean;
    runAfterMake: boolean;
    encrypted: boolean;//是否加密脚本
    compressZip: boolean;//是否压缩脚本
    xxteaKey?: string;//xxtea 加密的 key 值
}

export interface IBuildCache extends InternalBuildResult {
    userFrameWorks: boolean; // 是否使用用户的配置数据
}
