
export * from "../../../../builtin/builder/@types/protect";
import { IInternalBuildOptions, InternalBuildResult } from "../../../../builtin/builder/@types/protect";

export type IOrientation = 'landscape' | 'portrait';

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'windows': IOptions;
    }
}

export interface IOptions {
    renderBackEnd: {
        vulkan: boolean;
        gles3: boolean;
        gles2: boolean;
    };
    serverMode: boolean;
}

export interface IBuildResult extends InternalBuildResult {
    userFrameWorks: boolean; // 是否使用用户的配置数据
}
