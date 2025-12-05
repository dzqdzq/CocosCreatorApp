/**
 * 通过 gtag 上报给 google g4 的数据
 */
export interface IGoogleG4Event {
    name: string;
    params: IGoogleG4Params | number;
    user_properties?: any;
}

/**
 * 上传 Google G4 B1 的参数
 */
export interface IGoogleG4_B1_Params {
    [key: string]: number | string;
}

/**
 * 上传 Google G4 的参数
 */
export type IGoogleG4Params = {
    // 原始的 event value key 例如 A10001
    baseKey: string;
    // 触发时机或者行为
    action: string;
    label?: string;
    // 具体说明这个事件在统计什么
    desc?: string;
    // 指定事件价值，值为非负整型
    value?: number;
    time?: number;
    count: number;
} & IGoogleG4_B1_Params

/**
 * 每个事件会带的基础信息
 */
export interface BaseEventInfo {
    // 应用名称
    app_name: string,
    // 应用 id
    app_id: string,
    // 应用版本
    app_version: string,
    // 自定义维度，屏幕像素密度
    scale_factor: string,
    // 用户当前语言
    language: string,
    // 操作系统 CPU 架构
    arch: string,
}

/**
 * g4 需要的数据
 */
export interface IGoogleG4Data {
    htmlUrl: string;
    firstTimestamp: number;
    reportEvents: IGoogleG4Event[],
}

/**
 * 通过 Measurement Protocol 上报给 google g4 的数据
 */
export interface IGoogleG4SendData {
    client_id: string;
    user_id: string;
    timestamp_micros: string;
    events: IGoogleG4Event[];
}

/**
 * 映射表的类型
 */
export interface IGoogleG4Table {
    action: string;
    label: string;
}