export interface DataURI {
    mediaType?: {
        value: string;
        type: string;
        subtype: string;
        parameters?: string;
    };
    base64?: boolean;
    data: string;
}
export declare function parse(dataURI: string): DataURI | null;
export declare const defaultMediaType = "text/plain;charset=US-ASCII";
