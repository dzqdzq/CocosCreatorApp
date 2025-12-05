'use strict';

const { expect } = require('chai');
const { queryNode, setProperty, queryNodeUUidByAsset, delay } = require('./utils/index');

describe('Prefab的TargetOverride操作测试', () => {
    let testNodeUuid = null;
    const testPrefabAssetUrl = 'db://assets/testPrefab.prefab';
    let testPrefabAssetUUID = null;

    let childNodeUUID = null;
    const childPrefabAssetUrl = 'db://assets/childPrefab.prefab';
    let childPrefabAssetUUID = null;

    const reloadTime = 1200;

    const testRefClassName = 'TestPrefabRef';
    const testRefCompUrl = 'db://assets/__testRef__.ts';
    const testRefCompContent = ` 
        import { _decorator, Component, Node } from 'cc';
        const { ccclass, property, type } = _decorator;

        @ccclass('${testRefClassName}')
        export class TestRef extends Component {
            @type(Node)
            public refNode: Node|null = null;
            
            @type(Component)
            public refComp: Component|null = null;

            start () {
            }
        }
    `;
    let testRefScriptURL = null;

    describe('prepare test resources', async () => {
        it('reset scene', async () => {
            await Editor.Message.request('scene', 'open-scene', '');
        });
        // scene:
        // - testPrefab
        it('create Root node', async () => {
            const newNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'testPrefab' });
            expect(!!newNodeUuid).to.true;
            testNodeUuid = newNodeUuid;
        });

        // scene:
        // - testPrefab(PrefabInstance)
        it('create testPrefab', async () => {
            testPrefabAssetUUID = await Editor.Message.request('scene', 'create-prefab', testNodeUuid, testPrefabAssetUrl);
            expect(!!testPrefabAssetUUID).to.true;
            // wait reload
            await delay(reloadTime);

            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            // 默认有4个propertyOverride,['_name', '_lpos', '_lrot', '_euler']
            expect(propertyOverrides.length).equal(4);
        });

        it('open prefab', async () => {
            const result = await Editor.Message.request('scene', 'open-scene', testPrefabAssetUUID);

            await delay(500);

        });

        it('create testRef script', async () => {
            const assetInfo = await Editor.Message.request('asset-db', 'create-asset',
                testRefCompUrl,
                testRefCompContent,
                {
                    overwrite: true,
                }
            );

            testRefScriptURL = assetInfo.url;
            await delay(1500);
            console.log('结束创建脚本', Date.now());
        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab
        //      - testOutRef
        //      - testInRef
        it('add child node in prefab mode', async () => {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            // console.log(nodeTree);
            expect(!!nodeTree).to.true;
            const prefabRootUUID = nodeTree.children[0].uuid;
            console.log(prefabRootUUID);

            const childCylinderNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'childCylinderNode', assetUuid: 'ab3e16f9-671e-48a7-90b7-d0884d9cbb85', parent: prefabRootUUID });
            expect(!!childCylinderNodeUuid).to.true;
            const childCylinderNodeDump = await Editor.Message.request('scene', 'query-node', childCylinderNodeUuid);
            expect(childCylinderNodeDump.__prefab__.uuid).to.equal(testPrefabAssetUUID);
            expect(!!childCylinderNodeDump.__prefab__.instance).to.false;

            childNodeUUID = await Editor.Message.request('scene', 'create-node',
                { name: 'childPrefab', assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde', parent: prefabRootUUID });
            expect(!!childNodeUUID).to.true;

            const testOutRefNodeUUID = await Editor.Message.request('scene', 'create-node',
                { name: 'testOutRef', parent: childNodeUUID });
            expect(!!testOutRefNodeUUID).to.true;
            await Editor.Message.request('scene', 'create-component', { uuid: testOutRefNodeUUID, component: testRefClassName });

            const testInRefNodeUUID = await Editor.Message.request('scene', 'create-node',
                { name: 'testInRef', parent: childNodeUUID });
            expect(!!testInRefNodeUUID).to.true;
            await Editor.Message.request('scene', 'create-component', { uuid: testInRefNodeUUID, component: testRefClassName });
            // const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab(PrefabInstance)
        //      - testOutRef
        //      - testInRef
        it('create child prefab', async () => {
            childPrefabAssetUUID = await Editor.Message.request('scene', 'create-prefab', childNodeUUID, childPrefabAssetUrl);
            expect(!!childPrefabAssetUUID).to.true;
            await delay(reloadTime);
        });

        it('save prefab', async () => {
            const result = await Editor.Message.request('scene', 'save-scene');

            await delay(reloadTime);

        });

        it('open child prefab', async () => {
            const result = await Editor.Message.request('scene', 'open-scene', childPrefabAssetUUID);

            await delay(500);

        });

        // Prefab:
        // - childPrefab(PrefabInstance)
        //    - testOutRef
        //    - testInRef
        it('set in prefab reference', async () => {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            // console.log(nodeTree);
            expect(!!nodeTree).to.true;
            // 这里不需要 .value
            const prefabRootUUID = nodeTree.children[0].uuid;

            let nodeDump = await queryNode(prefabRootUUID);
            // console.log(nodeDump);
            const testOutRefNodeUUID = nodeDump.children[0].value.uuid;
            const testInRefNodeUUID = nodeDump.children[1].value.uuid;

            await setProperty({
                uuid: testInRefNodeUUID,
                path: '__comps__.0.refNode',
                dump: {
                    type: 'cc.Node',
                    value: {
                        uuid: prefabRootUUID,
                    },
                },
            });

            nodeDump = await queryNode(testInRefNodeUUID);
            // console.log('after set property:', nodeDump);
            expect(nodeDump.__comps__[0].value.refNode.value.uuid).to.equal(prefabRootUUID);
        });

        it('save prefab', async () => {
            const result = await Editor.Message.request('scene', 'save-scene');

            await delay(reloadTime);

        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab(PrefabInstance)
        //      - testOutRef
        //      - testInRef
        it('open Root prefab', async () => {
            const result = await Editor.Message.request('scene', 'open-scene', testPrefabAssetUUID);

            await delay(500);

        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab(PrefabInstance)
        //      - testOutRef
        //      - testInRef
        it('set nested prefab reference', async () => {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            // console.log(nodeTree);
            expect(!!nodeTree).to.true;
            // 这里不需要 .value
            const prefabRootUUID = nodeTree.children[0].uuid;

            let nodeDump = await queryNode(prefabRootUUID);

            const childCylinderNodeUUID = nodeDump.children[0].value.uuid;
            const childNodeUUID = nodeDump.children[1].value.uuid;

            nodeDump = await queryNode(childNodeUUID);

            const testOutRefNodeUUID = nodeDump.children[0].value.uuid;
            const testInRefNodeUUID = nodeDump.children[1].value.uuid;

            await setProperty({
                uuid: testOutRefNodeUUID,
                path: '__comps__.0.refNode',
                dump: {
                    type: 'cc.Node',
                    value: {
                        uuid: prefabRootUUID,
                    },
                },
            });

            nodeDump = await queryNode(testOutRefNodeUUID);
            // console.log('after set property:', nodeDump);
            expect(nodeDump.__comps__[0].value.refNode.value.uuid).to.equal(prefabRootUUID);

            // 子Prefab中的reference应该会带到实例中
            nodeDump = await queryNode(testInRefNodeUUID);
            expect(!!nodeDump.__comps__[0].value.refNode.value.uuid).to.true;

            nodeDump = await queryNode(prefabRootUUID);
            // console.log('root', nodeDump);
        });

        it('save prefab', async () => {
            const result = await Editor.Message.request('scene', 'save-scene');

            await delay(reloadTime);

        });

        it('quit prefab mode', async () => {
            const result = await Editor.Message.request('scene', 'close-scene');
        });

    });

    describe('clear test resources', async () => {
        it('remove test node', async () => {
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            await Editor.Message.request('scene', 'remove-node', { uuid: testNodeUuid });
        });

        it('delete prefab asset', async () => {
            const scriptAsset = await Editor.Message.request('asset-db', 'delete-asset', testRefScriptURL);
            expect(scriptAsset).not.to.be.null;

            const asset = await Editor.Message.request('asset-db', 'delete-asset', testPrefabAssetUrl);
            expect(asset).not.to.be.null;

            const childAsset = await Editor.Message.request('asset-db', 'delete-asset', childPrefabAssetUrl);
            expect(childAsset).not.to.be.null;
        });
    });
});

