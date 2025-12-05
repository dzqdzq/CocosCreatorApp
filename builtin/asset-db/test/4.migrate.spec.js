const { expect } = require('chai');
const { join } = require('path');
const { readJSON} = require('fs-extra');
const path = require('path');

const { migratePrefabInstanceRootsByJson } = require('../dist/importer-3d/importers/scene/migrate-prefab-1-1-34');

describe('测试 migrate 接口：', () => {
    describe('migratePrefabInstanceRoots in PrefabAsset', async function() {
        const prefabAssetPath = path.join(__dirname, 'assets', 'testPrefab-3-3-0.prefab');
        const json = await readJSON(prefabAssetPath);
        // console.log('before:', json);
        const prefabRootNode = json[1];
        const prefabInfo = json[prefabRootNode._prefab.__id__];
        expect(prefabInfo.nestedPrefabInstanceRoots).equal(undefined);
        migratePrefabInstanceRootsByJson(json);
        // console.log('after:', json);

        const instanceRoots = prefabInfo.nestedPrefabInstanceRoots;
        expect(instanceRoots.length).equal(1);
        const nodeRef = instanceRoots[0];
        expect(nodeRef.__id__).equal(7);
    });

    describe('migratePrefabinstanceRoots in SceneAsset', async function() {
        const prefabAssetPath = path.join(__dirname, 'assets', 'testPrefab-3-3-0.scene');
        const json = await readJSON(prefabAssetPath);
        // console.log('before:', json);
        const prefabRootNode = json[1];
        expect(prefabRootNode._prefab).equal(null);

        migratePrefabInstanceRootsByJson(json);
        // console.log('after:', json);

        const prefabInfo = json[prefabRootNode._prefab.__id__];
        const instanceRoots = prefabInfo.nestedPrefabInstanceRoots;
        expect(instanceRoots.length).equal(2);
        const nodeRef = instanceRoots[0];
        expect(nodeRef.__id__).equal(7);
    });
});

