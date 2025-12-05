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
    /**
     * 注册某个协议信息
     * @param protocol
     * @param protocolInfo
     */
    register(protocol: string, protocolInfo: RegisterProtocolInfo): boolean;
    /**
     * 反注册某个协议信息
     * @param protocol 协议头
     */
    unregister(protocol: string): boolean;
    getAllFileProtocol(): ProtocolInfo[];
    resolveToRaw(url: string): string;
    resolveToUrl(raw: string, protocol: string): string;
    getProtocalInfo(protocol: string): ProtocolInfo | undefined;
    emitChanges(): void;
}
export declare const fileUrlManager: FileUrlManager;
export {};
