
export * from "../../../../builtin/builder/@types/protect";
import { appTemplateData, IInternalBuildOptions, IPolyFills } from "../../../../builtin/builder/@types/protect";

export interface IOptions {
    resolution: {
        designHeight: number;
        designWidth: number;
    },
    polyfills?: IPolyFills;
    remoteServerAddress?: string;
}
export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'web-desktop': IOptions;
    };
    appTemplateData: appTemplateData;
}
