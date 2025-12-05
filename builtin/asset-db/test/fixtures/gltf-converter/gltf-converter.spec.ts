
import { GltfAssetFinderKind, GltfConverter, IGltfAssetFinder } from '../../../source/importer-3d/importers/utils/gltf-converter';
import * as cc from 'cc';
import * as glTF from '../../../@types/private/glTF';

const dummyGlTFPath = 'foo/bar.gltf';
const dummyGlTFAsset = {
    asset: {
        version: '2.0',
    },
};
const dummyFinder: IGltfAssetFinder = {
    find() {
        return null;
    }
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