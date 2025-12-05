import { DataURI, parse } from '../src';

test('parse', () => {
    const oks: Record<string, DataURI> = {
        "data:image/png;base64,i": {
            data: 'i',
            mediaType: {
                value: 'image/png',
                type: 'image',
                subtype: 'png',
            },
            base64: true,
        },
        "data:,Hello%2C%20World!": {
            data: 'Hello%2C%20World!',
        },
        "data:,Hello World!": {
            data: 'Hello World!',
        },
        "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D": {
            data: 'SGVsbG8sIFdvcmxkIQ%3D%3D',
            base64: true,
        },
        "data:text/html,%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E": {
            data: '%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E',
        },
        "data:,A%20brief%20note": {
            data: 'A%20brief%20note',
        },
        "data:text/html;charset=US-ASCII,%3Ch1%3EHello!%3C%2Fh1%3E": {
            data: '%3Ch1%3EHello!%3C%2Fh1%3E',
            mediaType: {
                value: 'text/html;charset=US-ASCII',
                type: 'text',
                subtype: 'html',
                parameters: ';charset=US-ASCII',
            },
        },
        "data:application/octet-stream;base64,a": {
            data: 'a',
            mediaType: {
                value: 'application/octet-stream',
                type: 'application',
                subtype: 'octet-stream',
            },
        },
    };

    for (const dataURIRep of Object.keys(oks)) {
        const expected = oks[dataURIRep];
        const actual = parse(dataURIRep);
        expect(actual).not.toBeNull();
        expect(actual).toMatchObject(expected);
    }
});