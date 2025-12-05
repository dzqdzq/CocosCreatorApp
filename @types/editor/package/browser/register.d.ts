/**
 * 注册 profile 的一些处理
 * 在配置里新增一个 version 数据，记录当前的数据属于哪个版本，用于后期版本升级
 *
 * @param info 插件信息
 */
export declare function profile(info: any): Promise<void[]>;
