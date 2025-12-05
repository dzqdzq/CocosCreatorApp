import { gfx } from 'cc';
import { GltfConverter } from '../../../source/handler/assets/utils/gltf-converter';
import { GltfAccessorType } from '../../../source/handler/assets/utils/glTF.constants';
import { NormalImportSetting, TangentImportSetting } from '../../../source/handler/meta-schemas/glTF.meta';
import { gltfConverterSilentLogger, LoadedGlTF } from './util';

describe('glTF converter: Mesh import', () => {
    test('Invalid vertex attribute: unacceptable texture coordinate set', () => {
        const nTriangles = 1;
        const nVertices = 3 * nTriangles;
        const positions = Float32Array.from({ length: 3 * nVertices }, (_, index) => index);
        const normals = Float32Array.from({ length: 3 * nVertices }, (_, index) => 0.1 * index);
        const uvs = Float32Array.from({ length: 2 * nVertices }, (_, index) => 0.1 * index);

        const model = new LoadedGlTF();
        model.glTF.meshes = [];
        model.glTF.meshes.push({
            primitives: [{
                attributes: {
                    POSITION: model.addAccessor(positions, GltfAccessorType.VEC3),
                    TEXCOORD_99: model.addAccessor(uvs, GltfAccessorType.VEC2),
                    NORMAL: model.addAccessor(normals, GltfAccessorType.VEC3),
                },
            }],
        });

        const glTFConverter = new GltfConverter(model.glTF, model.buffers, '/dummy.glTF', {
            logger: gltfConverterSilentLogger,
            userData: {
                normals: NormalImportSetting.optional,
                tangents: TangentImportSetting.exclude,
            },
        });
        const mesh = glTFConverter.createMesh(0);
        expect(mesh.struct.primitives).toHaveLength(1);
        const subMesh = mesh.struct.primitives[0];
        expect(subMesh.vertexBundelIndices).toHaveLength(1);
        const vertexBundle = mesh.struct.vertexBundles[subMesh.vertexBundelIndices[0]];
        expect(vertexBundle.attributes).toHaveLength(2);
        expect(vertexBundle.attributes[0].name).toBe(gfx.AttributeName.ATTR_POSITION);
        expect(vertexBundle.attributes[1].name).toBe(gfx.AttributeName.ATTR_NORMAL);
        const mesh1 = glTFConverter.createMesh(0, true);
        const vertexBundle1 = mesh1.struct.vertexBundles[subMesh.vertexBundelIndices[0]];
        expect(vertexBundle1.attributes).toHaveLength(3);
        expect(vertexBundle1.attributes[0].name).toBe(gfx.AttributeName.ATTR_POSITION);
        expect(vertexBundle1.attributes[1].name).toBe(gfx.AttributeName.ATTR_NORMAL);
        expect(vertexBundle1.attributes[2].name).toBe(gfx.AttributeName.ATTR_TEX_COORD1);
        expect(mesh1.readAttribute(0, gfx.AttributeName.ATTR_TEX_COORD1)).toStrictEqual(new Float32Array(mesh1.struct.vertexBundles[0].view.count * 2));
    });
});
