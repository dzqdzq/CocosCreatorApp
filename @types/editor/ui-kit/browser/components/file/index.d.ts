import { ProtocolInfo, RegisterProtocolInfo } from './fileUrl';
export declare const defaultProtocol: {
    label: string;
    path: string;
    protocol: string;
    description: string;
    invalidInfo: string;
};
export declare class File {
    static registerProtocol(protocol: string, protocolInfo: RegisterProtocolInfo): boolean;
    static unregisterProtocol(protocol: string): boolean;
    static resolveToRaw(url: string): string;
    static resolveToUrl(raw: string, protocol: string): string;
    static getAllProtocolInfos(): ProtocolInfo[];
}
