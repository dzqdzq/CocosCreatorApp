/**
 * 初始化引擎加载器。预先引擎模块，并将其映射为在编辑器内可用的 CommonJS 模块。
 * @param options 选项。
 */
declare function preload(options: {
    /**
     * 引擎根目录。如果未指定则用 IPC 消息查询当前使用的。
     */
    root?: string;
    /**
     * 引擎分发目录（引擎编译后的目录）。
     */
    dist?: string;
    editorPath?: string;
    /**
     * 是否要注入全局变量 `EditorExtends`。主进程不可使用。
     * @default true
     */
    editorExtensions?: boolean;
    /**
     * 需要预加载的模块。
     */
    requiredModules: string[];
}): Promise<void>;
export default preload;
/**
 * 动态加载指定模块。应确保引擎加载器已经初始化过。
 * @param id 引擎模块 ID。
 * @returns 引擎模块。
 */
export declare function loadDynamic(id: string): Promise<unknown>;
