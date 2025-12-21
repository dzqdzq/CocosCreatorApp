'use strict';

const { expect } = require('chai');
const { queryNode, setProperty, queryNodeUUidByAsset, delay } = require('./utils/index');
const { clearTestDir, getTestDir, requestScene, adaptCloseCurrentScene } = require('./utils');

const testDBHeader = `${getTestDir()}/prefab-override`;

describe('Prefab的TargetOverride操作测试', () => {
    after( () => {
        clearTestDir();
    });
    let testNodeUuid = null;
    const testPrefabAssetUrl = `${testDBHeader}/testPrefab.prefab`;
    let testPrefabAssetUUID = null;

    let childNodeUUID = null;
    const childPrefabAssetUrl = `${testDBHeader}/childPrefab.prefab`;
    let childPrefabAssetUUID = null;

    const reloadTime = 1200;

    const testRefClassName = 'TestPrefabRef';
    const testRefCompUrl = `${testDBHeader}/__testRef__.ts`;
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
            await requestScene( 'load-empty-scene');
        });
        // scene:
        // - testPrefab
        it('create Root node', async () => {
            Editor.Selection.clear('node');
            const newNodeUuid = await requestScene( 'create-node',
                { name: 'testPrefab' });
            expect(!!newNodeUuid).to.true;
            testNodeUuid = newNodeUuid;
        });

        // scene:
        // - testPrefab(PrefabInstance)
        it('create testPrefab', async () => {
            testPrefabAssetUUID = await requestScene( 'create-prefab', testNodeUuid, testPrefabAssetUrl);
            expect(!!testPrefabAssetUUID).to.true;
            // wait reload
            await delay(reloadTime);

            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            const nodeDump = await requestScene( 'query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            // 默认有4个propertyOverride,['_name', '_lpos', '_lrot', '_euler']
            expect(propertyOverrides.length).equal(4);
        });

        it('open prefab', async () => {
            const result = await requestScene( 'open-scene', testPrefabAssetUUID);

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
            const nodeTree = await requestScene( 'query-node-tree');
            // console.log(nodeTree);
            expect(!!nodeTree).to.true;
            const prefabRootUUID = nodeTree.children[0].uuid;
            console.log(prefabRootUUID);

            const childCylinderNodeUuid = await requestScene( 'create-node',
                { name: 'childCylinderNode', assetUuid: 'ab3e16f9-671e-48a7-90b7-d0884d9cbb85', parent: prefabRootUUID });
            expect(!!childCylinderNodeUuid).to.true;
            const childCylinderNodeDump = await requestScene( 'query-node', childCylinderNodeUuid);
            expect(childCylinderNodeDump.__prefab__.uuid).to.equal(testPrefabAssetUUID);
            expect(!!childCylinderNodeDump.__prefab__.instance).to.false;

            childNodeUUID = await requestScene( 'create-node',
                { name: 'childPrefab', assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde', parent: prefabRootUUID });
            expect(!!childNodeUUID).to.true;

            const testOutRefNodeUUID = await requestScene( 'create-node',
                { name: 'testOutRef', parent: childNodeUUID });
            expect(!!testOutRefNodeUUID).to.true;
            await requestScene( 'create-component', { uuid: testOutRefNodeUUID, component: testRefClassName });

            const testInRefNodeUUID = await requestScene( 'create-node',
                { name: 'testInRef', parent: childNodeUUID });
            expect(!!testInRefNodeUUID).to.true;
            await requestScene( 'create-component', { uuid: testInRefNodeUUID, component: testRefClassName });
            // const nodeDump = await requestScene( 'query-node', testNodeUuid);
        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab(PrefabInstance)
        //      - testOutRef
        //      - testInRef
        it('create child prefab', async () => {
            childPrefabAssetUUID = await requestScene( 'create-prefab', childNodeUUID, childPrefabAssetUrl);
            expect(!!childPrefabAssetUUID).to.true;
            await delay(reloadTime);
        });

        it('save prefab', async () => {
            const result = await requestScene( 'save-scene');

            await delay(reloadTime);

        });

        it('open child prefab', async () => {
            const result = await requestScene( 'open-scene', childPrefabAssetUUID);

            await delay(500);

        });

        // Prefab:
        // - childPrefab(PrefabInstance)
        //    - testOutRef
        //    - testInRef
        it('set in prefab reference', async () => {
            const nodeTree = await requestScene( 'query-node-tree');
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
            const result = await requestScene( 'save-scene');

            await delay(reloadTime);

        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab(PrefabInstance)
        //      - testOutRef
        //      - testInRef
        it('open Root prefab', async () => {
            const result = await requestScene( 'open-scene', testPrefabAssetUUID);

            await delay(500);

        });

        // prefab:
        // - testPrefab
        //   - childCylinderNode
        //   - childPrefab(PrefabInstance)
        //      - testOutRef
        //      - testInRef
        it('set nested prefab reference', async () => {
            const nodeTree = await requestScene( 'query-node-tree');
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
            const result = await requestScene( 'save-scene');

            await delay(reloadTime);

        });

        it('quit prefab mode', async () => {
            const result = await adaptCloseCurrentScene()
        });

    });

    describe('clear test resources', async () => {
        it('remove test node', async () => {
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            await requestScene( 'remove-node', { uuid: testNodeUuid });
        });
    });
});

