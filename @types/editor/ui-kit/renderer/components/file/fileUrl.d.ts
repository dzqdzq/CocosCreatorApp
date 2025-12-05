export interface RegisterProtocolInfo {
    label: string;
    description?: string;
    path: string;
    invalidInfo?: string;
}
export interface ProtocolInfo extends RegisterProtocolInfo {
    protocol: string;
}
export declare class FileUrlManager {
    static urlMap: Record<string, RegisterProtocolInfo>;
    static hasInit: boolean;
    getAllFileProtocol(): ProtocolInfo[];
    resolveToRaw(url: string): string;
    resolveToUrl(raw: string, protocol: string): string;
    getProtocalInfo(protocol: string): ProtocolInfo | undefined;
}
export declare const fileUrlManager: FileUrlManager;
export declare class FileUrl {
    private _relPath;
    private _protocolInfo?;
    private _$root;
    private _timer;
    constructor($root: HTMLElement);
    /**
     * 当前路径是否无效
     */
    get invalid(): boolean;
    get protocolInfo(): ProtocolInfo;
    set relPath(val: string);
    get relPath(): string;
    get protocol(): string;
    set protocol(val: string);
    get raw(): string;
    get url(): string;
    set value(val: string);
    get value(): string;
    toString(): string;
}
