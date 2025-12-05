import { IBuildTaskOption } from "../public";

// 导出的构建配置
export interface IExportBuildOptions extends IBuildTaskOption {
    __version__: string;
}
