'use strict';

const { expect } = require('chai');

describe('Prefab操作测试', () => {
    let testNodeUuid = null;
    const testPrefabAssetUrl = 'db://assets/testPrefab.prefab';
    let testPrefabAssetUUID = null;

    const testPrefabAssetUrl2 = 'db://assets/testPrefab2.prefab';
    let testPrefabAssetUUID2 = null;

    let childNodeUUID = null;
    const childPrefabAssetUrl = 'db://assets/childPrefab.prefab';
    let childPrefabAssetUUID = null;

    let testNodeUUID2 = null;

    const positionPropKey = 'position';
    const positionSerializedKey = '_lpos';

    const reloadTime = 1200;

    describe('prepare test resources', async () => {

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

        // it('link prefab', async () => {
        //     await Editor.Message.request('scene', 'link-prefab', testNodeUuid, testPrefabAsset.uuid);
        //     await new Promise((resolve) => {
        //         setTimeout(function() {
        //             resolve();
        //         }, 1000);
        //     });
        //     const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
        //     expect(nodeDump.__prefab__.uuid).to.equal(testPrefabAsset.uuid);
        //     expect(nodeDump.__prefab__.sync).to.true;
        // });

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
        it('add child prefab in prefab mode', async () => {
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

            const childTorusNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'childTorusNode', assetUuid: 'd47f5d5e-c931-4ff4-987b-cc818a728b82', parent: childNodeUUID });
            expect(!!childTorusNodeUuid).to.true;
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

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)(position:[0,2,0])
        //      - childTorusNode
        it('move nested prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            const childPrefabUUID = nodeDump.children[1].value.uuid;

            const positionValue = {
                x: 0,
                y: 2,
                z: 0,
            };
            await Editor.Message.request('scene', 'set-property', {
                uuid: childPrefabUUID,
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
            const localID = targetInfo.localID.value;

            const childNodeDump = await Editor.Message.request('scene', 'query-node', childPrefabUUID);
            const childPrefabInstance = childNodeDump.__prefab__.instance.value;
            const childPrefabInstanceFileId = childPrefabInstance.fileId.value;
            const childFileId = childNodeDump.__prefab__.fileId;

            // 检查节点查找路径
            expect(localID[0].value).to.equal(childPrefabInstanceFileId);
            expect(localID[1].value).to.equal(childFileId);

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
        //   - childConeNode(Added)
        //   - childConeNode(Added)
        //   - childConeNode(Added)
        it('create child under prefab in general for revert', async () => {
            for (let i = 0; i < 3; i++) {
                const childNodeUuid = await Editor.Message.request('scene', 'create-node',
                { name: 'childConeNode', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
                expect(!!childNodeUuid).to.true;

                const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
                expect(!!nodeDump.__prefab__.instance.value.fileId).to.true;
                console.log(nodeDump);
                const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value[0].value;
                const childrenNodes = mountedChildren.nodes.value;
                const child = childrenNodes[i].value;

                expect(child.uuid === nodeDump.uuid.value);

                const childNodeDump = await Editor.Message.request('scene', 'query-node', childNodeUuid);
                console.log('addedChild:', childNodeDump);
                // 只是做为一个普通节点创建在PrefabInstance下面
                expect(!!childNodeDump.__prefab__).to.false;
                await new Promise((resolve) => {
                    setTimeout(function() {
                        resolve();
                    }, 200);
                });
            }
        });

        // 还原一个PrefabInstance的数据为所指向的PrefabAsset里的数据
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('revert prefab', async () => {
            const result = await Editor.Message.request('scene', 'restore-prefab', testNodeUuid);
            expect(result).to.true;

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const childPrefabUUID = nodeDump.children[1].value.uuid;

            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            // 默认4个propertyOverride不revert,['_name', '_lpos', '_lrot', '_euler']
            expect(propertyOverrides.length).to.equal(4);

            const childNodeDump = await Editor.Message.request('scene', 'query-node', childPrefabUUID);

            const childPos = childNodeDump.position.value;
            expect(childPos.y).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode(Added)
        it('create child under prefab in general', async () => {
            const childNodeUuid = await Editor.Message.request('scene', 'create-node',
            { name: 'childConeNode', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
            expect(!!childNodeUuid).to.true;

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(!!nodeDump.__prefab__.instance.value.fileId).to.true;
            console.log(nodeDump);
            const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value;
            const child = mountedChildren[0].value;

            expect(child.uuid === nodeDump.uuid.value);

            const childNodeDump = await Editor.Message.request('scene', 'query-node', childNodeUuid);
            console.log('addedChild:', childNodeDump);
            // 只是做为一个普通节点创建在PrefabInstance下面
            expect(!!childNodeDump.__prefab__).to.false;
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, 200);
            });
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        it('apply prefab', async () => {
            console.log(testNodeUuid);
            await Editor.Message.request('scene', 'apply-prefab', testNodeUuid);

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log(nodeDump);
            const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value;
            expect(mountedChildren.length).equal(0);

            const childPrefabUUID = nodeDump.children[2].value.uuid;
            console.log('addedChildNodeUUID:', childPrefabUUID);
            const childConeNodeDump = await Editor.Message.request('scene', 'query-node', childPrefabUUID);
            console.log('childConeNodeDump:', childConeNodeDump);
            expect(!!childConeNodeDump.__prefab__).to.true;
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        it('move prefab Root', async () => {
            console.log(testNodeUuid);
            await Editor.Message.request('scene', 'apply-prefab', testNodeUuid);

            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

            const positionValue = {
                x: 1,
                y: 2,
                z: 3,
            };
            await Editor.Message.request('scene', 'set-property', {
                uuid: testNodeUuid,
                path: positionPropKey,
                dump: {
                    type: 'cc.Vec3',
                    value: positionValue,
                },
            });

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            const prefabFileId = nodeDump.__prefab__.fileId;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const propertyOverrides = prefabInstance.propertyOverrides.value;
            const positionOverride = propertyOverrides[1].value;
            const propPath = positionOverride.propertyPath.value[0].value;
            // 检查属性查找路径
            expect(propPath).to.equal(positionSerializedKey);
            const targetInfo = positionOverride.targetInfo.value;
            const localID = targetInfo.localID.value;

            // 检查节点查找路径
            expect(localID[0].value).to.equal(prefabFileId);
            const propValue = positionOverride.value.value;
            expect(propValue.x).to.equal(positionValue.x);
            expect(propValue.y).to.equal(positionValue.y);
            expect(propValue.z).to.equal(positionValue.z);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(Added)
        it('create child under prefab in general', async () => {
            const childNodeUuid = await Editor.Message.request('scene', 'create-node',
            { name: 'childConeNode', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
            expect(!!childNodeUuid).to.true;

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            expect(!!nodeDump.__prefab__.instance.value.fileId).to.true;
            console.log(nodeDump);
            const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value;
            const child = mountedChildren[0].value;

            expect(child.uuid === nodeDump.uuid.value);

            const childNodeDump = await Editor.Message.request('scene', 'query-node', childNodeUuid);
            console.log('addedChild:', childNodeDump);
            // 只是做为一个普通节点创建在PrefabInstance下面
            expect(!!childNodeDump.__prefab__).to.false;
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, 200);
            });
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode
        it('create testPrefab2', async () => {
            testPrefabAssetUUID2 = await Editor.Message.request('scene', 'create-prefab', testNodeUuid, testPrefabAssetUrl2);
            expect(!!testPrefabAssetUUID2).to.true;

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
            const position = nodeDump.position.value;
            expect(position.z).equal(3);

            const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value;
            expect(mountedChildren.length).equal(0);
            expect(nodeDump.children.length).equal(4);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('add component in prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const childCount = nodeDump.children.length;
            const lastChild = nodeDump.children[childCount - 1].value;
            await Editor.Message.request('scene', 'snapshot');
            await Editor.Message.request('scene', 'create-component', { uuid: lastChild.uuid, component: 'cc.BoxCollider2D' });

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const mountedComponents = prefabInstance.mountedComponents.value;
            expect(mountedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode
        it('undo add component in prefabInstance', async () => {
            await Editor.Message.request('scene', 'undo');
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log('undo add component:', nodeDump);
            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const mountedComponents = prefabInstance.mountedComponents.value;
            expect(mountedComponents.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('redo add component in prefabInstance', async () => {
            await Editor.Message.request('scene', 'redo');
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, 500);
            });

            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const mountedComponents = prefabInstance.mountedComponents.value;
            expect(mountedComponents.length).equal(1);

            const childCount = nodeDump.children.length;
            const lastChild = nodeDump.children[childCount - 1].value;
            nodeDump = await Editor.Message.request('scene', 'query-node', lastChild.uuid);
            console.log('after redo add mounted component', nodeDump);

            const mountedCompDump = nodeDump.__comps__[1];
            expect(mountedCompDump.mountedRoot).equal(testNodeUuid);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        let removedCompFileID = 0;
        it('remove component in prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;
            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            removedCompFileID = firstChildDump.__comps__[0].value.__prefab.value.fileId.value;

            await Editor.Message.request('scene', 'remove-array-element', { uuid: firstChild.uuid, path: '__comps__', index: 0 });

            firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const removedComponents = prefabInstance.removedComponents.value;
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('revert remove component in prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;

            // 撤销PrefabInstance中移除的Component
            await Editor.Message.request('scene', 'revert-removed-component', firstChild.uuid, removedCompFileID);

            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(1);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log('after revert remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const removedComponents = prefabInstance.removedComponents.value;
            expect(removedComponents.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('remove component in prefabInstance again', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;
            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            removedCompFileID = firstChildDump.__comps__[0].value.__prefab.value.fileId.value;

            await Editor.Message.request('scene', 'remove-array-element', { uuid: firstChild.uuid, path: '__comps__', index: 0 });

            firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const removedComponents = prefabInstance.removedComponents.value;
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('apply remove component in prefabInstance', async () => {
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;

            // 将PrefabInstance身上移除的component应用到PrefabAsset中
            await Editor.Message.request('scene', 'apply-removed-component', firstChild.uuid, removedCompFileID);

            // wait reload
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });

            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log('after apply remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const removedComponents = prefabInstance.removedComponents.value;
            expect(removedComponents.length).equal(0);

            const mountedComponents = prefabInstance.mountedComponents.value;
            const compUUID = mountedComponents[0].value.components.value[0].value.uuid;
            console.log(compUUID);
            const comp = await Editor.Message.request('scene', 'query-component', compUUID);
            console.log(comp);
            expect(comp.mountedRoot).equal(testNodeUuid);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('undo apply remove component in prefabInstance', async () => {
            await Editor.Message.request('scene', 'undo');
            // wait reload
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;

            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log('after remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const removedComponents = prefabInstance.removedComponents.value;
            expect(removedComponents.length).equal(1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('redo apply remove component in prefabInstance', async () => {
            await Editor.Message.request('scene', 'redo');
            // wait reload
            await new Promise((resolve) => {
                setTimeout(function() {
                    resolve();
                }, reloadTime);
            });
            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;

            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log('after remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            const removedComponents = prefabInstance.removedComponents.value;
            expect(removedComponents.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        // - testPrefabInstance2(PrefabInstance)
        it('create prefabInstance 2', async () => {
            // 从应用了removeComponent操作后的PrefabAsset中创建一个新的PrefabInstance
            testNodeUUID2 = await Editor.Message.request('scene', 'create-node',
            { name: 'testPrefabInstance2', assetUuid: testPrefabAssetUUID2 });
            expect(!!testNodeUUID2).to.true;

            let nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUUID2);

            const firstChild = nodeDump.children[0].value;

            let firstChildDump = await Editor.Message.request('scene', 'query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode
        it('disconnect prefab', async () => {
            // 和Prefab取消关联
            await Editor.Message.request('scene', 'unlink-prefab', testNodeUuid);

            const nodeDump = await Editor.Message.request('scene', 'query-node', testNodeUuid);
            console.log(nodeDump);
            const prefabInfo = nodeDump.__prefab__;
            expect(!!prefabInfo).to.false;
            expect(nodeDump.children.length).equal(4);
            const childPrefabUUID = nodeDump.children[1].value.uuid;

            const childPrefabDump = await Editor.Message.request('scene', 'query-node', childPrefabUUID);
            console.log('childPrefabDump:', childPrefabDump);
            const childPrefabInstance = childPrefabDump.__prefab__.instance;
            expect(!!childPrefabInstance).to.true;
        });
    });

    describe('clear test resources', async () => {
        it('remove test node', async () => {
            await Editor.Message.request('scene', 'remove-node', { uuid: testNodeUuid });
            await Editor.Message.request('scene', 'remove-node', { uuid: testNodeUUID2 });
        });



        it('delete prefab asset', async () => {
            const asset = await Editor.Message.request('asset-db', 'delete-asset', testPrefabAssetUrl);
            expect(asset).not.to.be.null;

            const childAsset = await Editor.Message.request('asset-db', 'delete-asset', childPrefabAssetUrl);
            expect(childAsset).not.to.be.null;

            const asset2 = await Editor.Message.request('asset-db', 'delete-asset', testPrefabAssetUrl2);
            expect(asset2).not.to.be.null;
        });
    });
});
