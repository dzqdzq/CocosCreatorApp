'use strict';

const { expect } = require('chai');

function getMountedComponents(nodeDump) {
    return nodeDump.__prefab__.instance.value.mountedComponents.value;
}

function getMountedChildren(nodeDump) {
    return nodeDump.__prefab__.instance.value.mountedChildren.value;
}

function getRemovedComponents(nodeDump) {
    return nodeDump.__prefab__.instance.value.removedComponents.value;
}

describe('嵌套Prefab操作测试', () => {
    let testNodeUuid = null;
    const testPrefabAssetUrl = 'db://assets/testPrefab.prefab';
    let testPrefabAssetUUID = null;

    const testPrefabAssetUrl2 = 'db://assets/testPrefab2.prefab';
    let testPrefabAssetUUID2 = null;

    let childNodeUUID = null;
    let childTorusNodeUUID = null;
    const childPrefabAssetUrl = 'db://assets/childPrefab.prefab';
    let childPrefabAssetUUID = null;

    let testNodeUUID2 = null;

    const positionPropKey = 'position';
    const positionSerializedKey = '_lpos';

    const reloadTime = 1200;

    describe('prepare test resources', async () => {

        it('save scene', async () => {
            const result = await Editor.Message.request('scene', 'save-scene');

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

        });

        // scene:
        // - testPrefabRootNode
        it('create cube node', async () => {
            const newNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'testPrefabRootNode', assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde' });
            expect(!!newNodeUuid).to.true;
            testNodeUuid = newNodeUuid;
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        it('create testPrefab', async () => {
            testPrefabAssetUUID = await Editor.Message.request('scene', 'create-prefab', testNodeUuid, testPrefabAssetUrl);
            expect(!!testPrefabAssetUUID).to.true;

            // wait reload
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

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

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, 500);
            });

        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode
        //      - childTorusNode
        it('add child node in prefab mode', async () => {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            console.log(nodeTree);
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
                { name: 'childNode', parent: prefabRootUUID });
            expect(!!childNodeUUID).to.true;

            childTorusNodeUUID = await Editor.Message.request('scene', 'create-node',
                { name: 'childTorusNode', assetUuid: 'd47f5d5e-c931-4ff4-987b-cc818a728b82', parent: childNodeUUID });
            expect(!!childTorusNodeUUID).to.true;
            // const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('create child prefab', async () => {
            childPrefabAssetUUID = await Editor.Message.request('scene', 'create-prefab', childNodeUUID, childPrefabAssetUrl);
            expect(!!childPrefabAssetUUID).to.true;
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider+)
        it('create mountedComponent in nested PrefabInstance', async () => {
            await Editor.Message.request('scene', 'create-component', { uuid: childTorusNodeUUID, component: 'cc.BoxCollider' });
            let nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);

            console.log('after add mountedComponent:', nodeDump);
            expect(nodeDump.__comps__.length).equal(2);

            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            const mountedComponents = getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(1);
        });

        it('save prefab', async () => {
            const result = await Editor.Message.request('scene', 'save-scene');

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

        });

        it('quit prefab mode', async () => {
            const result = await Editor.Message.request('scene', 'close-scene');
        });

        it('open prefab', async () => {
            const result = await Editor.Message.request('scene', 'open-scene', testPrefabAssetUUID);

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, 500);
            });

        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider+)
        it('check mountedComponent save', async () => {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            console.log(nodeTree);
            expect(!!nodeTree).to.true;
            const prefabRootUUID = nodeTree.children[0].uuid;
            console.log(prefabRootUUID);

            let nodeDump = await Editor.Message.request('scene', 'query-node', prefabRootUUID);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            const mountedComponents = getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(1);

            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);

            console.log('after reload add mountedComponent:', nodeDump);
            expect(nodeDump.__comps__.length).equal(2);

        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('remove mountedComponent in nested PrefabInstance', async () => {
            await Editor.Message.request('scene', 'remove-array-element', { uuid: childTorusNodeUUID, path: '__comps__', index: 1 });
            let nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            console.log('after remove mountedComponent:', nodeDump);
            expect(nodeDump.__comps__.length).equal(1);

            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log('after remove mountedComponent:', nodeDump);
            const mountedComponents = getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(0);
        });

        it('save prefab', async () => {
            const result = await Editor.Message.request('scene', 'save-scene');

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

        });

        it('quit prefab mode', async () => {
            const result = await Editor.Message.request('scene', 'close-scene');

            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            console.log(nodeTree);
            expect(!!nodeTree).to.true;
            testNodeUuid = nodeTree.children[0].uuid;
        });

        let removedCompFileID = '';
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer(-))
        it('remove component in nested prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            const meshComp = nodeDump.__comps__[0].value;
            console.log('meshComp:', meshComp);
            const meshCompPrefab = meshComp.__prefab.value;
            removedCompFileID = meshCompPrefab.fileId.value;
            await Editor.Message.request('scene', 'remove-array-element', { uuid: childTorusNodeUUID, path: '__comps__', index: 0 });
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            console.log('after remove component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const removedComponents = getRemovedComponents(nodeDump);
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer)
        it('revert remove component in nested prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log('before revert remove component rootNode:', nodeDump);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;

            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            console.log('before revert remove component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(0);

            await Editor.Message.request('scene', 'revert-removed-component', childTorusNodeUUID, removedCompFileID);
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, 500);
            });
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            console.log('after remove component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(1);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const removedComponents = getRemovedComponents(nodeDump);
            expect(removedComponents.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(MeshRenderer(-))
        it('remove component in nested prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            const meshComp = nodeDump.__comps__[0].value;
            const meshCompPrefab = meshComp.__prefab.value;
            removedCompFileID = meshCompPrefab.fileId.value;
            await Editor.Message.request('scene', 'remove-array-element', { uuid: childTorusNodeUUID, path: '__comps__', index: 0 });
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            expect(nodeDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const removedComponents = getRemovedComponents(nodeDump);
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider(+))
        it('create component in nested prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;
            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log(nodeDump);
            expect(nodeDump.children.length).equal(1);
            childTorusNodeUUID = nodeDump.children[0].value.uuid;
            await Editor.Message.request('scene', 'create-component', { uuid: childTorusNodeUUID, component: 'cc.BoxCollider' });
            nodeDump = await Editor.Message.request('scene', 'query-node', childTorusNodeUUID);
            console.log('after add component:', nodeDump);
            expect(nodeDump.__comps__.length).equal(1);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const mountedComponents = getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode(BoxCollider(+))
        //      - nestedConeChild(+)
        it('create child in nested prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;

            const childNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'nestedConeChild', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: childNodeUUID });
            expect(!!childNodeUuid).to.true;
            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log(nodeDump);
            expect(nodeDump.children.length).equal(2);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const mountedChildren = getMountedChildren(nodeDump);
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
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            childNodeUUID = nodeDump.children[1].value.uuid;

            await Editor.Message.request('scene', 'set-property', {
                uuid: childTorusNodeUUID,
                path: positionPropKey,
                dump: {
                    type: 'cc.Vec3',
                    value: positionValue,
                },
            });

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            console.log(nodeDump);
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
            await Editor.Message.request('scene', 'apply-prefab', testNodeUuid);

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log(nodeDump);
            const mountedComponents = getMountedComponents(nodeDump);
            expect(mountedComponents.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', childNodeUUID);
            console.log(nodeDump);

            const childMountedComponents = getMountedComponents(nodeDump);
            expect(childMountedComponents.length).equal(1);

            const childRemovedComponents = getRemovedComponents(nodeDump);
            expect(childRemovedComponents.length).equal(1);

            const childMountedChildren = getMountedChildren(nodeDump);
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
            // const childConeNodeDump = await Editor.Message.request('scene', 'query-node', childPrefabUUID);
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

            testNodeUUID2 = await Editor.Message.request('scene', 'create-node',
                { name: 'testPrefabInstance2', assetUuid: testPrefabAssetUUID, type: 'cc.Prefab' });

            expect(!!testNodeUUID2).to.true;

            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUUID2);

            console.log(nodeDump);
            const mountedChildren = getMountedChildren(nodeDump);
            expect(mountedChildren.length).to.equal(0);

            const childRemovedComponents = getRemovedComponents(nodeDump);
            expect(childRemovedComponents.length).equal(0);

            const childMountedChildren = getMountedChildren(nodeDump);
            expect(childMountedChildren.length).equal(0);
        });

    });

    describe('clear test resources', async () => {
        it('remove test node', async () => {
            await Editor.Message.request('scene', 'remove-node', { uuid: testNodeUuid });
        });

        it('delete prefab asset', async () => {
            const asset = await Editor.Message.request('asset-db', 'delete-asset', testPrefabAssetUrl);
            expect(asset).not.to.be.null;

            const childAsset = await Editor.Message.request('asset-db', 'delete-asset', childPrefabAssetUrl);
            expect(childAsset).not.to.be.null;
        });
    });
});
