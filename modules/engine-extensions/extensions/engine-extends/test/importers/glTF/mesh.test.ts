import { gfx } from 'cc';
import { GltfConverter } from '../../../source/importer/importers/utils/gltf-converter';
import { GltfAccessorType } from '../../../source/importer/importers/utils/glTF.constants';
import { NormalImportSetting, TangentImportSetting } from '../../../source/importer/meta-schemas/glTF.meta';
import { LoadedGlTF } from './util';

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
    });
});
