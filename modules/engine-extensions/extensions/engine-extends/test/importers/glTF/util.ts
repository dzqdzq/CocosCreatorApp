import * as glTF from '../../../@types/glTF';
import { GltfAccessorType, GltfAccessorComponentType, getGltfAccessorTypeComponents } from '../../../source/handler/assets/utils/glTF.constants';
import type { GltfConverter } from '../../../source/handler/assets/utils/gltf-converter';

export function createAccessorStuffsFromArrayViews(arrayViewAccessors: Array<{
    data: Float32Array;
    type: GltfAccessorType;
}>): Pick<glTF.GlTf, 'buffers' | 'bufferViews' | 'accessors'> {
    return {
        buffers: arrayViewAccessors.map((arrayView) => ({
            byteLength: arrayView.data.byteLength,
        })),
        bufferViews: arrayViewAccessors.map((arrayView, arrayViewIndex) => ({
            buffer: arrayViewIndex,
            byteLength: arrayView.data.byteLength,
        })),
        accessors: arrayViewAccessors.map((arrayView, arrayViewIndex) => {
            return {
                bufferView: arrayViewIndex,
                componentType: GltfAccessorComponentType.FLOAT,
                type: arrayView.type,
                count: arrayView.data.length / getGltfAccessorTypeComponents(arrayView.type),
            };
        }),
    };
}

export class LoadedGlTF {
    glTF: glTF.GlTf;

    buffers: Buffer[] = [];

    constructor() {
        this.glTF = {
            asset: { version: '2.0' },
        };
    }

    public addAccessor(arrayView: IndexedArrayBufferView, type: GltfAccessorType) {
        const buffer = Buffer.from(new Uint8Array(arrayView.buffer, arrayView.byteOffset, arrayView.byteLength));

        const iBuffer = this.buffers.length;
        this.buffers.push(buffer);

        const iBufferView = (this.glTF.bufferViews ??= []).length;
        this.glTF.bufferViews.push({
            buffer: iBuffer,
            byteLength: buffer.byteLength,
        });

        const iAccessor = (this.glTF.accessors ??= []).length;
        this.glTF.accessors.push({
            bufferView: iBufferView,
            componentType: getGltfAccessorComponentType(arrayView),
            type: type,
            count: arrayView.length / getGltfAccessorTypeComponents(type),
        });

        return iAccessor;
    }
}

export function addAccessor(data: Float32Array, type: GltfAccessorType) {

}

type IndexedArrayBufferView = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;

function getGltfAccessorComponentType(arrayBufferView: IndexedArrayBufferView) {
    switch (arrayBufferView.constructor) {
        case Uint8Array: return GltfAccessorComponentType.UNSIGNED_BYTE;
        case Int8Array: return GltfAccessorComponentType.BYTE;
        case Uint16Array: return GltfAccessorComponentType.UNSIGNED_SHORT;
        case Int16Array: return GltfAccessorComponentType.SHORT;
        case Uint32Array: return GltfAccessorComponentType.UNSIGNED_INT;
        case Int32Array: return GltfAccessorComponentType.UNSIGNED_INT;
        case Float32Array: return GltfAccessorComponentType.FLOAT;
        default: throw new Error(`${arrayBufferView.constructor.name} is not a glTF component type.`);
    }
}

export class GltfConverterLoggerMock {
    get logger() {
        return this._logger;
    }

    private _logger: GltfConverter.Logger = (level, error, args) => {
    };
}

export const gltfConverterSilentLogger: GltfConverter.Logger = () => {

};
