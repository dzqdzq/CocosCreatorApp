'use strict';

const { expect } = require('chai');
const { delay, prefab, queryNodeUUidByAsset, requestScene } = require('./utils/index');
const reloadTime = 1200;

describe('嵌套Prefab操作测试', () => {
    let testNodeUuid = null;
    const testPrefabAssetUrl = 'db://assets/testPrefab.prefab';
    let testPrefabAssetUUID = null;

    const testPrefabAssetUrl2 = 'db://assets/testPrefab2.prefab';
    const testPrefabAssetUUID2 = null;

    let childNodeUUID = null;
    let childTorusNodeUUID = null;
    const childPrefabAssetUrl = 'db://assets/childPrefab.prefab';
    let childPrefabAssetUUID = null;

    let testNodeUUID2 = null;

    const positionPropKey = 'position';
    const positionSerializedKey = '_lpos';

    describe('prepare test resources', async () => {
        it('open empty scene', async () => {
            await requestScene('open-scene');
            await delay(reloadTime);
        });

        // scene:
        // - testPrefabRootNode
        it('create cube node', async () => {
            const newNodeUuid = await requestScene('create-node', {
                name: 'testPrefabRootNode',
                assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde',
            });
            expect(!!newNodeUuid).to.true;
            testNodeUuid = newNodeUuid;
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        it('create testPrefab', async () => {
            testPrefabAssetUUID = await requestScene('create-prefab', testNodeUuid, testPrefabAssetUrl);
            expect(!!testPrefabAssetUUID).to.true;

            // wait reload
            await delay(reloadTime);
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            const nodeDump = await requestScene('query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            // 默认有4个propertyOverride,['_name', '_lpos', '_lrot', '_euler']
            expect(propertyOverrides.length).equal(4);
        });

        it('open prefab', async () => {
            const result = await requestScene('open-scene', testPrefabAssetUUID);
            await delay(500);
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode
        //      - childTorusNode
        it('add child node in prefab mode', async () => {
            const nodeTree = await requestScene('query-node-tree');
            // console.log(nodeTree);
            expect(!!nodeTree).to.true;
            const prefabRootUUID = nodeTree.children[0].uuid;
            console.log(prefabRootUUID);

            const childCylinderNodeUuid = await requestScene('create-node', {
                name: 'childCylinderNode',
                assetUuid: 'ab3e16f9-671e-48a7-90b7-d0884d9cbb85',
                parent: prefabRootUUID,
            });
            expect(!!childCylinderNodeUuid).to.true;
            const childCylinderNodeDump = await requestScene('query-node', childCylinderNodeUuid);
            expect(childCylinderNodeDump.__prefab__.uuid).to.equal(testPrefabAssetUUID);
            expect(!!childCylinderNodeDump.__prefab__.instance).to.false;

            childNodeUUID = await requestScene('create-node', { name: 'childNode', parent: prefabRootUUID });
            expect(!!childNodeUUID).to.true;

            childTorusNodeUUID = await requestScene('create-node', {
                name: 'childTorusNode',
                assetUuid: 'd47f5d5e-c931-4ff4-987b-cc818a728b82',
                parent: childNodeUUID,
            });
            expect(!!childTorusNodeUUID).to.true;
            // const nodeDump = await requestScene('query-node', testNodeUuid);
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('create child prefab', async () => {
            childPrefabAssetUUID = await requestScene('create-prefab', childNodeUUID, childPrefabAssetUrl);
            expect(!!childPrefabAssetUUID).to.true;
            await delay(reloadTime);

            childNodeUUID = await queryNodeUUidByAsset(childPrefabAssetUUID);
            expect(!!childNodeUUID).to.true;

            const nodeDump = await requestScene('query-node', childNodeUUID);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            expect(!!childTorusNodeUUID).to.true;
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider+)
        it('create mountedComponent in nested PrefabInstance', async () => {
            await requestScene('create-component', { uuid: childTorusNodeUUID, component: 'cc.BoxCollider' });
            let nodeDump = await requestScene('query-node', childTorusNodeUUID);

            // console.log('after add mountedComponent:', nodeDump);
            expect(nodeDump.__comps__.length).equal(2);

            nodeDump = await requestScene('query-node', childNodeUUID);
            const mountedComponents = prefab.getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(1);
        });

        it('save prefab', async () => {
            const result = await requestScene('save-scene');
            await delay(reloadTime);
        });

        it('quit prefab mode', async () => {
            const result = await requestScene('close-scene');
        });

        it('open prefab', async () => {
            const result = await requestScene('open-scene', testPrefabAssetUUID);
            // await delay(500);
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider+)
        //   - childNode2(PrefabInstance)
        it('add nested prefab instance then softReload #17394', async () => {
            let nodeTree = await requestScene('query-node-tree');
            let prefabRoot = nodeTree.children[0];
            const childNode2 = await requestScene('create-node', {
                name: 'childNode2',
                assetUuid: childPrefabAssetUUID,
                parent: prefabRoot.uuid,
                type: 'cc.Prefab',
            });
            expect(!!childNode2).to.true;

            nodeTree = await requestScene('query-node-tree');
            prefabRoot = nodeTree.children[0];
            let childNode2Dump = prefabRoot.children[2];
            expect(prefabRoot.children.length).equal(3);
            expect(childNode2Dump.name).equal('childNode2');

            await requestScene('soft-reload');
            await delay(reloadTime);

            nodeTree = await requestScene('query-node-tree');
            prefabRoot = nodeTree.children[0];
            childNode2Dump = prefabRoot.children[2];
            expect(prefabRoot.children.length).equal(3);
            expect(childNode2Dump.name).equal('childNode2');

            await requestScene('remove-node', { uuid: childNode2 });
        });
        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider+)
        it('check mountedComponent save', async () => {
            const nodeTree = await requestScene('query-node-tree');
            // console.log(nodeTree);
            expect(!!nodeTree).to.true;
            const prefabRootUUID = nodeTree.children[0].uuid;
            console.log(prefabRootUUID);

            let nodeDump = await requestScene('query-node', prefabRootUUID);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            const mountedComponents = prefab.getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(1);

            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            nodeDump = await requestScene('query-node', childTorusNodeUUID);

            // console.log('after reload add mountedComponent:', nodeDump);
            expect(nodeDump.__comps__.length).equal(2);
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('remove mountedComponent in nested PrefabInstance', async () => {
            await requestScene('remove-array-element', { uuid: childTorusNodeUUID, path: '__comps__', index: 1 });
            let nodeDump = await requestScene('query-node', childTorusNodeUUID);
            // console.log('after remove mountedComponent:', nodeDump);
            expect(nodeDump.__comps__.length).equal(1);

            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log('after remove mountedComponent:', nodeDump);
            const mountedComponents = prefab.getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(0);
        });

        it('save prefab', async () => {
            const result = await requestScene('save-scene');

            await delay(reloadTime);
        });

        it('quit prefab mode', async () => {
            const result = await requestScene('close-scene');
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer(-))
        it('createPrefabFromExistPrefabNode #17622', async () => {
            // 问题，修改嵌套预制体的位置信息后，拖拽父预制体生成新的预制体，位置信息丢失
            childNodeUUID = await queryNodeUUidByAsset(childPrefabAssetUUID);
            await requestScene('set-property', {
                uuid: childNodeUUID,
                path: 'position',
                dump: {
                    type: 'cc.Vec3',
                    value: {
                        x: 3,
                        y: 5,
                        z: 3,
                    },
                },
            });
            let nodeDump = await requestScene('query-node', childNodeUUID);
            expect(nodeDump.position.value.x).equal(3);
            expect(nodeDump.position.value.y).equal(5);
            expect(nodeDump.position.value.z).equal(3);

            // 覆盖生成新预制体
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            testPrefabAssetUUID = await requestScene('create-prefab', testNodeUuid, testPrefabAssetUrl);
            await delay(reloadTime);
            // 检查生成后的数据
            childNodeUUID = await queryNodeUUidByAsset(childPrefabAssetUUID);
            nodeDump = await requestScene('query-node', childNodeUUID);
            expect(nodeDump.position.value.x).equal(3);
            expect(nodeDump.position.value.y).equal(5);
            expect(nodeDump.position.value.z).equal(3);

            // 预制体内的数据也要正常
            await requestScene('open-scene', testPrefabAssetUUID);
            childNodeUUID = await queryNodeUUidByAsset(childPrefabAssetUUID);
            nodeDump = await requestScene('query-node', childNodeUUID);
            expect(nodeDump.position.value.x).equal(3);
            expect(nodeDump.position.value.y).equal(5);
            expect(nodeDump.position.value.z).equal(3);

            await requestScene('close-scene');
            await delay(reloadTime);
        });

        let removedCompFileID = '';
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer(-))
        it('remove component in nested prefabInstance', async () => {
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            let nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            const meshComp = nodeDump.__comps__[0].value;
            // console.log('meshComp:', meshComp);
            const meshCompPrefab = meshComp.__prefab.value;
            removedCompFileID = meshCompPrefab.fileId.value;
            await requestScene('remove-array-element', { uuid: childTorusNodeUUID, path: '__comps__', index: 0 });
            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            // console.log('after remove component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);
            const removedComponents = prefab.getRemovedComponents(nodeDump);
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer)
        it('revert remove component in nested prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('before revert remove component rootNode:', nodeDump);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;

            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            // console.log('before revert remove component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(0);

            await requestScene('revert-removed-component', childTorusNodeUUID, removedCompFileID);
            await delay(500);
            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            // console.log('after remove component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(1);

            nodeDump = await requestScene('query-node', testNodeUuid);
            const removedComponents = prefab.getRemovedComponents(nodeDump);
            expect(removedComponents.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer(-))
        it('remove component in nested prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await requestScene('query-node', childNodeUUID);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            const meshComp = nodeDump.__comps__[0].value;
            const meshCompPrefab = meshComp.__prefab.value;
            removedCompFileID = meshCompPrefab.fileId.value;
            await requestScene('remove-array-element', { uuid: childTorusNodeUUID, path: '__comps__', index: 0 });
            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            expect(nodeDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);
            const removedComponents = prefab.getRemovedComponents(nodeDump);
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider(+))
        it('create component in nested prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            await requestScene('create-component', { uuid: childTorusNodeUUID, component: 'cc.BoxCollider' });
            nodeDump = await requestScene('query-node', childTorusNodeUUID);
            // console.log('after add component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(1);

            nodeDump = await requestScene('query-node', testNodeUuid);
            const mountedComponents = prefab.getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider(+))
        //      - nestedConeChild(+)
        it('create child in nested prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;

            const childNodeUuid = await requestScene('create-node', {
                name: 'nestedConeChild',
                assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110',
                parent: childNodeUUID,
            });
            expect(!!childNodeUuid).to.true;
            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log(nodeDump);
            expect(nodeDump.children.length).equal(2);

            nodeDump = await requestScene('query-node', testNodeUuid);
            const mountedChildren = prefab.getMountedChildren(nodeDump);
            expect(mountedChildren.length).equal(1);
        });

        const positionValue = {
            x: 0,
            y: 2,
            z: 0,
        };
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider(+))
        //      - nestedConeChild(+)
        it('move child in nested prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;

            await requestScene('set-property', {
                uuid: childTorusNodeUUID,
                path: positionPropKey,
                dump: {
                    type: 'cc.Vec3',
                    value: positionValue,
                },
            });

            nodeDump = await requestScene('query-node', testNodeUuid);

            // console.log(nodeDump);
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            const positionOverride = propertyOverrides[propertyOverrides.length - 1].value;
            const propPath = positionOverride.propertyPath.value[0].value;
            // 检查属性查找路径
            expect(propPath).to.equal(positionSerializedKey);
            const targetInfo = positionOverride.targetInfo.value;

            const propValue = positionOverride.value.value;
            expect(propValue.x).to.equal(positionValue.x);
            expect(propValue.y).to.equal(positionValue.y);
            expect(propValue.z).to.equal(positionValue.z);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //      - nestedConeChild
        it('apply prefab', async () => {
            console.log(testNodeUuid);
            await requestScene('apply-prefab', testNodeUuid);

            await delay(reloadTime);

            let nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log(nodeDump);
            const mountedComponents = prefab.getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(0);

            nodeDump = await requestScene('query-node', childNodeUUID);
            // console.log(nodeDump);

            const childMountedComponents = prefab.getMountedComponents(nodeDump);
            expect(childMountedComponents.length).equal(1);

            const childRemovedComponents = prefab.getRemovedComponents(nodeDump);
            expect(childRemovedComponents.length).equal(1);

            const childMountedChildren = prefab.getMountedChildren(nodeDump);
            expect(childMountedChildren.length).equal(1);

            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            const positionOverride = propertyOverrides[propertyOverrides.length - 1].value;
            const propValue = positionOverride.value.value;

            expect(propValue.x).to.equal(positionValue.x);
            expect(propValue.y).to.equal(positionValue.y);
            expect(propValue.z).to.equal(positionValue.z);

            // const childPrefabUUID = nodeDump.children[2].value.uuid;
            // console.log('addedChildNodeUUID:', childPrefabUUID);
            // const childConeNodeDump = await requestScene('query-node', childPrefabUUID);
            // console.log('childConeNodeDump:', childConeNodeDump);
            // expect(!!childConeNodeDump.__prefab__).to.true;
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //      - nestedConeChild
        // - testPrefabInstance2(PrefabInstance)
        it('create prefabInstance 2', async () => {
            testNodeUUID2 = await requestScene('create-node', {
                name: 'testPrefabInstance2',
                assetUuid: testPrefabAssetUUID,
                type: 'cc.Prefab',
            });

            expect(!!testNodeUUID2).to.true;

            const nodeDump = await requestScene('query-node', testNodeUUID2);

            // console.log(nodeDump);
            const mountedChildren = prefab.getMountedChildren(nodeDump);
            expect(mountedChildren.length).to.equal(0);

            const childRemovedComponents = prefab.getRemovedComponents(nodeDump);
            expect(childRemovedComponents.length).equal(0);

            const childMountedChildren = prefab.getMountedChildren(nodeDump);
            expect(childMountedChildren.length).equal(0);
        });
    });

    describe('clear test resources', async () => {
        it('remove test node', async () => {
            await requestScene('remove-node', { uuid: testNodeUuid });
        });

        it('delete prefab asset', async () => {
            const asset = await Editor.Message.request('asset-db', 'delete-asset', testPrefabAssetUrl);
            expect(asset).not.to.be.null;

            const childAsset = await Editor.Message.request('asset-db', 'delete-asset', childPrefabAssetUrl);
            expect(childAsset).not.to.be.null;
        });
    });
});
