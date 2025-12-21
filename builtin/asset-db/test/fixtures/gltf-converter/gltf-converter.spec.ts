
import { GltfAssetFinderKind, GltfConverter, IGltfAssetFinder } from '../../../source/importer-3d/importers/utils/gltf-converter';
import * as cc from 'cc';
import * as glTF from '../../../@types/private/glTF';
import { NormalImportSetting, TangentImportSetting } from '../../../source/importer-3d/meta-schemas/glTF.meta';
import { GltfAccessorComponentType, GltfAccessorType, getGltfAccessorTypeComponents } from '../../../source/importer-3d/importers/utils/glTF.constants';

const dummyGlTFPath = 'foo/bar.gltf';
const dummyGlTFAsset = {
    asset: {
        version: '2.0',
    },
};
const dummyFinder: IGltfAssetFinder = {
    find() {
        return null;
    },
};

describe('glTF converter: prefab', () => {
    const singleRootNodeGlTf: glTF.GlTf = {
        ...dummyGlTFAsset,
        nodes: [
            { name: 'SingleRootNode', children: [1, 2] },
            {},
            {},
        ],
        scenes: [
            { nodes: [0] },
        ],
    };

    const multiRootNodeGlTf: glTF.GlTf = {
        ...dummyGlTFAsset,
        nodes: [
            { name: 'MultiRootNode1' },
            { name: 'MultiRootNode2' },
        ],
        scenes: [
            { nodes: [0, 1] },
        ],
    };

    test('Single root node with "promoteSingleRootNode" enabled', () => {
        const glTFConverter = new GltfConverter(singleRootNodeGlTf, [], dummyGlTFPath, {
            promoteSingleRootNode: true,
        });

        const scene = glTFConverter.createScene(0, dummyFinder);
        expect(scene.name).toBe('SingleRootNode');
        expect(scene.children.length).toBe(2);
    });

    test('Multi root nodes with "promoteSingleRootNode" enabled', () => {
        const glTFConverter = new GltfConverter(multiRootNodeGlTf, [], dummyGlTFPath, {
            promoteSingleRootNode: true,
        });

        const scene = glTFConverter.createScene(0, dummyFinder);
        expect(scene.children.length).toBe(2);
        expect(scene.children[0].name).toBe('MultiRootNode1');
        expect(scene.children[1].name).toBe('MultiRootNode2');
    });

    test('Single root node with "promoteSingleRootNode" disabled', () => {
        const glTFConverter = new GltfConverter(singleRootNodeGlTf, [], dummyGlTFPath, {
            promoteSingleRootNode: false,
        });

        const scene = glTFConverter.createScene(0, dummyFinder);
        expect(scene.children.length).toBe(1);
        expect(scene.children[0].name).toBe('SingleRootNode');
        expect(scene.children[0].children.length).toBe(2);
    });
});

describe('glTF converter/Mesh/Morph Normals', () => {
    const positions = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    const normals = new Float32Array([0.11, 0.22, 0.33, 0.44, 0.55, 0.66]);
    const morphPositions = new Float32Array(6);
    const morphNormals = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);

    const buffers = [
        positions,
        normals,
        morphPositions,
        morphNormals,
    ];

    const glTF: glTF.GlTf = {
        ...dummyGlTFAsset,
        ...createAccessorStuffsFromArrayViews([
            { data: positions, type: GltfAccessorType.VEC3 },
            { data: normals, type: GltfAccessorType.VEC3 },
            { data: morphPositions, type: GltfAccessorType.VEC3 },
            { data: morphNormals, type: GltfAccessorType.VEC3 },
        ]),
        meshes: [{
            name: 'MeshWithMorphNormals',
            primitives: [{
                attributes: {
                    'POSITION': 0,
                    'NORMAL': 1,
                },
                targets: [{
                    'POSITION': 2,
                    'NORMAL': 3,
                }],
            }],
        }, {
            name: 'MeshWithOnlyMorphNormals',
            primitives: [{
                attributes: {
                    'POSITION': 0,
                    'NORMAL': 1,
                },
                targets: [{
                    'NORMAL': 3,
                }],
            }],
        }, {
            name: 'MeshWithoutMorphNormals',
            primitives: [{
                attributes: {
                    'POSITION': 0,
                },
            }],
        }],
    };

    const meshWithMorphNormalsIndex = 0;
    const meshWithOnlyMorphNormalsIndex = 1;

    test('Optional', () => {
        const glTFConverter = new GltfConverter(
            glTF,
            createBuffersFromArrayViews(buffers),
            dummyGlTFPath, {
                userData: {
                    normals: NormalImportSetting.optional,
                    morphNormals: NormalImportSetting.optional,
                    tangents: TangentImportSetting.optional,
                },
            },
        );

        const meshWithMorphNormals = glTFConverter.createMesh(meshWithMorphNormalsIndex);
        expect(meshWithMorphNormals.struct.morph).not.toBeUndefined();
        expect(meshWithMorphNormals.struct.morph!.subMeshMorphs).toHaveLength(1);
        const iNormal = meshWithMorphNormals.struct.morph!.subMeshMorphs[0]!.attributes.indexOf(cc.gfx.AttributeName.ATTR_NORMAL);
        expect(iNormal).toBeGreaterThanOrEqual(0);
        const normalsView = meshWithMorphNormals.struct.morph!.subMeshMorphs[0]!.targets[0].displacements[iNormal];
        const normals = readMeshBufferView(meshWithMorphNormals.data, normalsView, Float32Array);
        expect(normals).toStrictEqual(morphNormals);
    });

    test('Exclude', () => {
        const glTFConverter = new GltfConverter(
            glTF,
            createBuffersFromArrayViews(buffers),
            dummyGlTFPath, {
                userData: {
                    normals: NormalImportSetting.optional,
                    morphNormals: NormalImportSetting.exclude,
                    tangents: TangentImportSetting.optional,
                },
            },
        );

        const meshWithMorphNormals = glTFConverter.createMesh(meshWithMorphNormalsIndex);
        expect(meshWithMorphNormals.struct.morph).not.toBeUndefined();
        expect(meshWithMorphNormals.struct.morph!.subMeshMorphs).toHaveLength(1);
        expect(meshWithMorphNormals.struct.morph!.subMeshMorphs[0]!.attributes).not.toContain(cc.gfx.AttributeName.ATTR_NORMAL);

        const meshWithOnlyMorphNormals = glTFConverter.createMesh(meshWithOnlyMorphNormalsIndex);
        expect(meshWithOnlyMorphNormals.struct.morph).toBeUndefined();
    });
});

function readMeshBufferView(data: cc.Mesh['data'], bufferView: cc.Mesh.IBufferView, constructor: typeof Float32Array) {
    return new constructor(
        data.buffer,
        data.byteOffset + bufferView.offset,
        bufferView.count,
    );
}

function createBuffersFromArrayViews(arrayViews: Float32Array[]) {
    return arrayViews.map((arrayView) => Buffer.from(
        new Uint8Array(arrayView.buffer, arrayView.byteOffset, arrayView.byteLength)));
}

function createAccessorStuffsFromArrayViews(arrayViewAccessors: Array<{
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
