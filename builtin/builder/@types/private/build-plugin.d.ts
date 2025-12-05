export interface IBuildHooksInfo {
    pkgNameOrder: string[];
    infos: Record<string, { path: string; internal: boolean }>;
}

export interface IBuildStagesInfo {
    pkgNameOrder: string[];
    infos: Record<string, ICustomBuildStageItem>;
}
export interface IBuildAssetHandlerInfo {
    pkgNameOrder: string[];
    handles: {[pkgName: string]: Function};
}
