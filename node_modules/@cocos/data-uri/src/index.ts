import * as regexes from './data-uri-regex';

export interface DataURI {
    mediaType?: {
        value: string;
        type: string;
        subtype: string;
        parameters?: string;
    },
    base64?: boolean;
    data: string;
}

const dataURIRegex = new RegExp(regexes.dataURI);

export function parse(dataURI: string): DataURI | null {
    const dataURIMatches = dataURI.match(dataURIRegex);
    if (dataURIMatches === null) {
        return null;
    }

    const [
        ,
        mediaType,
        mimeTypeType,
        mimeTypeSubtype,
        mimeTypeParameters,
        base64,
        data,
    ] = dataURIMatches;

    const result: DataURI = {
        data,
    };
    if (mediaType) {
        result.mediaType = {
            value: mediaType,
            type: mimeTypeType,
            subtype: mimeTypeSubtype,
        };
        if (mimeTypeParameters) {
            result.mediaType.parameters = mimeTypeParameters;
        }
    }
    if (base64) {
        result.base64 = true;
    }

    return result;
}

export const defaultMediaType = 'text/plain;charset=US-ASCII';