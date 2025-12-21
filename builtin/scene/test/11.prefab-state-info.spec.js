'use strict';

const { delay, requestScene, prefab, queryNodeUUidByAsset, queryNode, getNodeIDByName } = require('./utils/index');
const { readJSONSync } = require('fs-extra');
const { expect } = require('chai');
const { clearTestDir, getTestDir } = require('./utils');

const PrefabState = {
    NotAPrefab: 0, // 普通节点，非Prefab
    PrefabChild: 1, // Prefab子节点，不含有PrefabInstance
    PrefabInstance: 2, // Prefab的根节点含有PrefabInstance的节点
    PrefabLostAsset: 3, // 丢失资源的Prefab节点
};

const internalSceneURL = 'db://internal/default_file_content/scene/default.scene';
const testMountHerder = getTestDir();
const testDBHeader = `${testMountHerder}/prefab`;
const testSceneURL = `${testMountHerder}/main.scene`;

const ASSET_UUID = '30da77a1-f02d-4ede-aa56-403452ee7fde';

let sceneUuid = '';
let sceneNodeID = '';
let assetUuidMap = new Map();
describe('Prefab PrefabState 操作测试', () => {
    before(async () => {
        await clearTestDir();
    })

    after(async () => {
        await clearTestDir();
    })

    // scene:
    // A prefab
    //  B prefab
    //    B-child
    //    C （A-child）prefab
    //      D prefab

    describe('init test resources', async () => {
        it('init scene', async () => {
            // 创建并且打开场景
            const internalScenePath = await Editor.Message.request('asset-db', 'query-path', internalSceneURL);
            const scene = readJSONSync(internalScenePath);
            const asset = await Editor.Message.request('asset-db', 'create-asset', testSceneURL, JSON.stringify(scene));
            sceneUuid = asset.uuid;
            await requestScene('open-scene', sceneUuid);
            // 创建需要的 prefab
            let rootNodeID = '';
            let lastNodeID = '';
            const keys = ['A', 'B', 'C', 'D'];
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const tempNodeID = await requestScene('create-node', { name: key, parent: lastNodeID });
                if (key === 'B') {
                    const tempChildNodeID = await requestScene('create-node', { name: `${key}-child`, parent: tempNodeID });
                }
                if (key === 'C') {
                    lastNodeID = tempNodeID;
                } else {
                    await delay(50);
                    const prefabAssetUrl = `${testDBHeader}/${key}.prefab`;
                    const assetUuid = await requestScene('create-prefab', tempNodeID, prefabAssetUrl);
                    await delay(150);
                    lastNodeID = await queryNodeUUidByAsset(assetUuid);
                    if (key === 'A') {
                        rootNodeID = lastNodeID
                    }
                    assetUuidMap.set(key, assetUuid)
                }
            }
            await requestScene('apply-prefab', rootNodeID);
        });
    });

    describe('prepare test resources', async () => {

        it('default scene prefab state info', async () => {
            const scene = await requestScene('query-node-tree');
            expect(!!scene).to.true;

            sceneNodeID = scene.uuid;
            prefab.checkPrefabStateInfo(scene, {
                state: PrefabState.NotAPrefab,
                isUnwrappable: false,
                isRevertable: false,
                isApplicable: false,
                isAddedChild: false,
                isNested: false,
                assetUuid: ''
            });
        });

        it('prefab root node prefab state', async () => {
            const tree = await requestScene('query-node-tree');
            const A = getNodeIDByName(tree, 'A');
            prefab.checkPrefabStateInfo(A, {
                assetUuid: assetUuidMap.get('A'),
                isAddedChild: false,
                isApplicable: true,
                isRevertable: true,
                isUnwrappable: true,
                isNested: false,
                state: PrefabState.PrefabInstance,
            });
        });

        it('prefab child node prefab state', async () => {
            const tree = await requestScene('query-node-tree');
            const C = getNodeIDByName(tree, 'C');
            prefab.checkPrefabStateInfo(C, {
                assetUuid: assetUuidMap.get('A'),
                isAddedChild: false,
                isApplicable: false,
                isRevertable: false,
                isUnwrappable: false,
                isNested: false,
                state: PrefabState.PrefabChild,
            });
        });

        it('child nested prefab state', async () => {
            const tree = await requestScene('query-node-tree');
            const B = getNodeIDByName(tree, 'B');
            prefab.checkPrefabStateInfo(B, {
                assetUuid: assetUuidMap.get('B'),
                isAddedChild: false,
                isApplicable: false,
                isRevertable: false,
                isUnwrappable: false,
                isNested: true,
                state: PrefabState.PrefabInstance,
            });

            const BChild = getNodeIDByName(tree, 'B-child');
            prefab.checkPrefabStateInfo(BChild, {
                assetUuid: assetUuidMap.get('B'),
                isAddedChild: false,
                isApplicable: false,
                isRevertable: false,
                isUnwrappable: false,
                isNested: true,
                state: PrefabState.PrefabChild,
            });
        });

        it('child nested parent is normal node', async () => {
            const tree = await requestScene('query-node-tree');
            const D = getNodeIDByName(tree, 'D');
            prefab.checkPrefabStateInfo(D, {
                assetUuid: assetUuidMap.get('D'),
                isAddedChild: false,
                isApplicable: false,
                isRevertable: false,
                isUnwrappable: false,
                isNested: true,
                state: PrefabState.PrefabInstance,
            });

            const A = getNodeIDByName(tree, 'A');
            let tempNodeID = await requestScene('create-node', { name: 'E', ASSET_UUID, parent: A.uuid });
            tempNodeID = await requestScene('create-node', { name: 'F', ASSET_UUID, parent: tempNodeID });
            await delay(50);
            const prefabAssetUrl = `${testDBHeader}/F.prefab`;
            const assetUuid = await requestScene('create-prefab', tempNodeID, prefabAssetUrl);
            await delay(150);
            const F_NodeID = await queryNodeUUidByAsset(assetUuid);
            const nodeDump = await queryNode(F_NodeID);
            prefab.checkPrefabStateInfo(nodeDump, {
                assetUuid: assetUuid,
                isAddedChild: false,
                isApplicable: true,
                isRevertable: true,
                isUnwrappable: true,
                isNested: true,
                state: PrefabState.PrefabInstance,
            });
        });
    });

    describe('clear test resources', async () => {
        it('remove', async () => {
            await requestScene('save-scene', sceneUuid);
            await requestScene('multi-close-scene', sceneUuid);
            await requestScene('load-empty-scene');
        });
    });
});
