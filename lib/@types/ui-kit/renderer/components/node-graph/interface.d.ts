export interface NodeInfo {
    type: string;
    position: Point;
    details?: {
        [key: string]: any;
    };
}
export interface ParamInfo {
    type: string;
    details?: {
        [key: string]: any;
    };
}
export interface LineInfo {
    input: {
        node: string;
        param: string;
    };
    output: {
        node: string;
        param: string;
    };
    details?: {
        [key: string]: any;
    };
}
export interface Layout {
    graph: any;
    nodes?: {
        [uuid: string]: NodeInfo;
    };
    lines?: {
        [uuid: string]: LineInfo;
    };
}
export interface TypeInfo {
    title: string;
    width: number;
    height: number;
    panel: string;
    input: {
        [uuid: string]: ParamInfo;
    };
    output: {
        [uuid: string]: ParamInfo;
    };
}
export interface Point {
    x: number;
    y: number;
}
