export interface RegisterProtocolInfo {
    label: string;
    description?: string;
    path: string;
    invalidInfo?: string;
}
export interface ProtocolInfo extends RegisterProtocolInfo {
    protocol: string;
}
declare class FileUrlManager {
    static urlMap: Record<string, RegisterProtocolInfo>;
    getAllFileProtocol(): ProtocolInfo[];
    resolveToRaw(url: string): string;
    resolveToUrl(raw: string, protocol: string): string;
    getProtocalInfo(protocol: string): ProtocolInfo | undefined;
}
export declare const fileUrlManager: FileUrlManager;
export declare class FileUrl {
    private _relPath;
    private _raw;
    private _protocolInfo?;
    private _val;
    /**
     * 当前路径是否无效
     */
    get invalid(): boolean;
    get protocolInfo(): ProtocolInfo;
    get protocol(): string;
    set protocol(val: string);
    set relPath(val: string);
    get relPath(): string;
    get raw(): string;
    set raw(val: string);
    get url(): string;
    set value(val: string);
    get value(): string;
    toString(): string;
}
export {};
