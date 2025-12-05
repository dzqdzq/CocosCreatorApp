'use strict';

const { expect } = require('chai');
const { delay, requestScene, prefab, queryNodeUUidByAsset, request } = require('./utils/index');
const exp = require('constants');
const reloadTime = 1200;

const PrefabState = {
    NotAPrefab: 0, // 普通节点，非Prefab
    PrefabChild: 1, // Prefab子节点，不含有PrefabInstance
    PrefabInstance: 2, // Prefab的根节点含有PrefabInstance的节点
    PrefabLostAsset: 3, // 丢失资源的Prefab节点
};

function checkEditMode(name) {
    expect(Editor.EditMode.getMode()).to.equal(name);
}

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
    const currentRootNode = null;
    describe('prepare test resources', async () => {

        // scene:
        // - testPrefabRootNode
        it('create cube node', async () => {
            const newNodeUuid = await requestScene('create-node',
                { name: 'testPrefabRootNode', assetUuid: '30da77a1-f02d-4ede-aa56-403452ee7fde' });
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

            // reload后新的uuid会变化
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            const nodeDump = await requestScene('query-node', testNodeUuid);
            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;

            prefab.checkDefaultPropertyOverrides(nodeDump);

            prefab.checkPrefabStateInfo(nodeDump, {
                assetUuid: testPrefabAssetUUID,
                isAddedChild: false,
                isApplicable: true,
                isRevertable: true,
                isUnwrappable: true,
                state: PrefabState.PrefabInstance,
            });

            prefab.checkMountedComponentsCount(nodeDump, 0);
            prefab.checkMountedChildrenInfoCount(nodeDump, 0);
            prefab.checkInstancePrefabRootNode(nodeDump, '');

        });

        // it('link prefab', async () => {
        //     await requestScene('link-prefab', testNodeUuid, testPrefabAsset.uuid);
        //     await new Promise((resolve) => {
        //         setTimeout(function() {
        //             resolve();
        //         }, 1000);
        //     });
        //     const nodeDump = await requestScene('query-node', testNodeUuid);
        //     expect(nodeDump.__prefab__.uuid).to.equal(testPrefabAsset.uuid);
        //     expect(nodeDump.__prefab__.sync).to.true;
        // });

        it('open prefab', async () => {
            const result = await requestScene('open-scene', testPrefabAssetUUID);
            await delay(500);
            checkEditMode('prefab');
        });

        // prefab:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode
        //      - childTorusNode
        it('add child prefab in prefab mode', async () => {
 
            const prefabRootUUID = await queryNodeUUidByAsset(testPrefabAssetUUID);
            // console.log('add child prefab', prefabRootUUID);
            expect(!!prefabRootUUID).to.true;

            const childCylinderNodeUuid = await requestScene('create-node',
                { name: 'childCylinderNode', assetUuid: 'ab3e16f9-671e-48a7-90b7-d0884d9cbb85', parent: prefabRootUUID });
            expect(!!childCylinderNodeUuid).to.true;

            const childCylinderNodeDump = await requestScene('query-node', childCylinderNodeUuid);
            expect(childCylinderNodeDump.__prefab__.rootUuid).equal(prefabRootUUID);
            expect(!!childCylinderNodeDump.__prefab__.instance).to.false;
            prefab.checkPrefabStateInfo(childCylinderNodeDump, {
                assetUuid: testPrefabAssetUUID,
                isAddedChild: false,
                isApplicable: false,
                isRevertable: false,
                isUnwrappable: false,
                state: PrefabState.PrefabChild,
            });
            childNodeUUID = await requestScene('create-node',
                { name: 'childNode', parent: prefabRootUUID });
            expect(!!childNodeUUID).to.true;

            const childTorusNodeUuid = await requestScene('create-node',
                { name: 'childTorusNode', assetUuid: 'd47f5d5e-c931-4ff4-987b-cc818a728b82', parent: childNodeUUID });
            expect(!!childTorusNodeUuid).to.true;
            
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
            const childPrefabNodeDump = await requestScene('query-node', childNodeUUID);
            
            // _prefab.root等于自己
            prefab.checkPrefabRoot(childPrefabNodeDump, childNodeUUID);
            prefab.checkPrefabStateInfo(childPrefabNodeDump, {
                isAddedChild: false,
                isApplicable: true,
                isRevertable: true,
                isUnwrappable: true,
                state: PrefabState.PrefabInstance,
            });
            // 测试嵌套预制体信息
            const prefabRootUUID = await queryNodeUUidByAsset(testPrefabAssetUUID);
            prefab.checkInstancePrefabRootNode(childPrefabNodeDump, prefabRootUUID);
        });

        it('save prefab', async () => {
            await requestScene('save-scene');
        });

        it('quit prefab mode', async () => {
            await requestScene('close-scene');
            checkEditMode('general');
            
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)(position:[0,2,0])
        //      - childTorusNode
        it('modify nested prefabInstance position', async () => {
            // 这里应该是testPrefabRootNode
            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID);
            expect(!!testNodeUuid).to.true;
            let nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            const childPrefabUUID = nodeDump.children[1].value.uuid;

            const positionValue = {
                x: 0,
                y: 2,
                z: 0,
            };
            
            await requestScene('set-property', {
                uuid: childPrefabUUID,
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
            const localID = targetInfo.localID.value;

            const childNodeDump = await requestScene('query-node', childPrefabUUID);
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
        it('create mountedChildren for testPrefab in general', async () => {
            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            const undoId = await requestScene('begin-recording', testNodeUuid);
            let childrenCount = 2;
            for (let i = 0; i < 3; i++) {
                const childNodeUuid = await requestScene('create-node',
                    { name: 'childConeNode', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
                expect(!!childNodeUuid).to.true;
                const nodeDump = await requestScene('query-node', testNodeUuid);
                expect(!!nodeDump.__prefab__.instance.value.fileId).to.true;
                // console.log(nodeDump);
                childrenCount++;
                expect(nodeDump.children.length).equal(childrenCount);

                const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value[0].value;
                const childrenNodes = mountedChildren.nodes.value;
                const child = childrenNodes[i].value;

                expect(child.uuid === nodeDump.uuid.value);

                const childNodeDump = await requestScene('query-node', childNodeUuid);
                // console.log('addedChild:', childNodeDump);
                // 只是做为一个普通节点创建在PrefabInstance下面
                expect(!!childNodeDump.__prefab__).to.false;
                await delay(200);
            }
            await requestScene('end-recording', undoId);
        });

        // 还原一个PrefabInstance的数据为所指向的PrefabAsset里的数据
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('revert from prefab asset', async () => {
            const result = await requestScene('restore-prefab', testNodeUuid);
            expect(result).to.true;
            await delay(reloadTime);
            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            prefab.checkDefaultPropertyOverrides(nodeDump);
            // revert prefab会清空mountedChildren
            prefab.checkMountedChildrenInfoCount(nodeDump, 0);

            // 检查子节点
            const childPrefabUUID = nodeDump.children[1].value.uuid;
            const childNodeDump = await requestScene('query-node', childPrefabUUID);
            const childPos = childNodeDump.position.value;
            expect(childPos.y).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode(Added)
        //   - childConeNode(Added)
        //   - childConeNode(Added)
        it('revert prefab undo(#17179)', async () => {
            await requestScene('undo');
            const nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('revert prefab undo:', nodeDump);

            prefab.checkMountedChildrenCount(nodeDump, 3);
            expect(nodeDump.children.length).equal(5);

            // 检查子节点数据是否还原
            const childPrefabUUID = nodeDump.children[1].value.uuid;
            const childNodeDump = await requestScene('query-node', childPrefabUUID);
            const childPos = childNodeDump.position.value;
            expect(childPos.y).equal(2);

        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        it('revert prefab redo', async () => {
            await requestScene('redo');
            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(2);
            prefab.checkMountedChildrenInfoCount(nodeDump, 0);
            const childPrefabUUID = nodeDump.children[1].value.uuid;
            const childNodeDump = await requestScene('query-node', childPrefabUUID);
            const childPos = childNodeDump.position.value;
            expect(childPos.y).equal(0);
        });
        
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode(Added)
        it('create mountedChildren in general', async () => {
            console.log('create mountedChildren in general 3');
            const undoId = await requestScene('begin-recording', testNodeUuid);
            const childNodeUuid = await requestScene('create-node',
                { name: 'childConeNode', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
            await requestScene('end-recording', undoId);
            expect(!!childNodeUuid).to.true;

            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(!!nodeDump.__prefab__.instance.value.fileId).to.true;
            expect(nodeDump.children.length).equal(3);
            // console.log(nodeDump);
            const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value;
            const child = mountedChildren[0].value;

            expect(child.uuid === nodeDump.uuid.value);

            const childNodeDump = await requestScene('query-node', childNodeUuid);
            // console.log('addedChild:', childNodeDump);
            // 只是做为一个普通节点创建在PrefabInstance下面
            expect(!!childNodeDump.__prefab__).to.false;
            await delay(200);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        it('apply prefab', async () => {
            console.log(testNodeUuid);
            const undoId = await requestScene('begin-recording', testNodeUuid);
            await requestScene('apply-prefab', testNodeUuid);
            await requestScene('end-recording', undoId);

            await delay(reloadTime);

            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(3);
            prefab.checkMountedChildrenInfoCount(nodeDump, 0);

            const childPrefabUUID = nodeDump.children[2].value.uuid;
            console.log('addedChildNodeUUID:', childPrefabUUID);
            const childConeNodeDump = await requestScene('query-node', childPrefabUUID);
            // console.log('childConeNodeDump:', childConeNodeDump);
            expect(!!childConeNodeDump.__prefab__).to.true;
        });
            
        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode(Added)
        it('undo apply prefab', async () => {
            await requestScene('undo');
            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(3);
            prefab.checkMountedChildrenCount(nodeDump, 1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        it('redo apply prefab', async () => {
            await requestScene('redo');
            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(nodeDump.children.length).equal(3);
            prefab.checkMountedChildrenInfoCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        it('modify prefab Root position', async () => {
            // await delay(reloadTime);

            const positionValue = {
                x: 1,
                y: 2,
                z: 3,
            };
            const undoId = await requestScene('begin-recording', testNodeUuid);
            await requestScene('set-property', {
                uuid: testNodeUuid,
                path: positionPropKey,
                dump: {
                    type: 'cc.Vec3',
                    value: positionValue,
                },
            });
            await requestScene('end-recording', undoId);
            // 属性修改时的propertyOverrides时有延迟的(200ms)
            await delay(250);
            const nodeDump = await requestScene('query-node', testNodeUuid);
            const prefabFileId = nodeDump.__prefab__.fileId;
            const positionOverride = prefab.getPropertyOverrides(nodeDump, positionSerializedKey);
            expect(!!positionOverride).to.true;
            // console.log('positionOverride', positionOverride);
            
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
        it('create mountedChildren in general', async () => {
            console.log('create mountedChildren in general 1');
            const undoId = await requestScene('begin-recording', testNodeUuid);
            const childNodeUuid = await requestScene('create-node',
                { name: 'childConeNode', assetUuid: '6350d660-e888-4acf-a552-f3b719ae9110', parent: testNodeUuid });
            await requestScene('end-recording', undoId);
            expect(!!childNodeUuid).to.true;

            const nodeDump = await requestScene('query-node', testNodeUuid);
            expect(!!nodeDump.__prefab__.instance.value.fileId).to.true;
            expect(nodeDump.children.length).equal(4);
            // console.log(nodeDump);
            const mountedChildren = nodeDump.__prefab__.instance.value.mountedChildren.value;
            const child = mountedChildren[0].value;

            expect(child.uuid === nodeDump.uuid.value);

            const childNodeDump = await requestScene('query-node', childNodeUuid);
            // console.log('addedChild:', childNodeDump);
            // 只是做为一个普通节点创建在PrefabInstance下面
            expect(!!childNodeDump.__prefab__).to.false;
            await delay(200);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode
        it('create testPrefab2', async () => {
            testPrefabAssetUUID2 = await requestScene('create-prefab', testNodeUuid, testPrefabAssetUrl2);
            expect(!!testPrefabAssetUUID2).to.true;
            
            // wait reload
            await delay(reloadTime);

            testNodeUuid = await queryNodeUUidByAsset(testPrefabAssetUUID2);
            const nodeDump = await requestScene('query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkDefaultPropertyOverrides(nodeDump);
            const position = nodeDump.position.value;
            expect(position.z).equal(3);

            prefab.checkMountedChildrenInfoCount(nodeDump, 0);
            expect(nodeDump.children.length).equal(4);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        
        it('add mountedComponent to prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);

            const childCount = nodeDump.children.length;
            const lastChild = nodeDump.children[childCount - 1].value;
            const undoId = await requestScene('begin-recording', lastChild.uuid);
            await requestScene('create-component', { uuid: lastChild.uuid, component: 'cc.BoxCollider2D' });
            await requestScene('end-recording', undoId);

            nodeDump = await requestScene('query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
                
            prefab.checkMountedComponentsCount(nodeDump, 1);
            // TBD 添加更多校验
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode
        it('undo add mountedComponent', async () => {
            await requestScene('undo');
            await delay(500);
            
            const nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('undo add component:', nodeDump);
            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkMountedComponentsCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('redo add mountedComponent', async () => {
            await requestScene('redo');
            await delay(500);

            let nodeDump = await requestScene('query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkMountedComponentsCount(nodeDump, 1);

            const childCount = nodeDump.children.length;
            const lastChild = nodeDump.children[childCount - 1].value;
            nodeDump = await requestScene('query-node', lastChild.uuid);
            // console.log('after redo add mounted component', nodeDump);

            const mountedCompDump = nodeDump.__comps__[1];
            expect(mountedCompDump.mountedRoot).equal(testNodeUuid);
        });

        // 把新加的组件更新到预制体资源
        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('apply-prefab for add mountedComponent', async () => {
            console.log('to be done');
            await requestScene('apply-prefab', testNodeUuid);
            await delay(reloadTime);
            const nodeDump = await requestScene('query-node', testNodeUuid);
            prefab.checkMountedComponentsCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D+)
        it('undo apply-prefab for add mountedComponent #17130', async () => {
            await requestScene('undo');
            await delay(reloadTime);
            const nodeDump = await requestScene('query-node', testNodeUuid);
            prefab.checkMountedComponentsCount(nodeDump, 1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('redo apply-prefab for add mountedComponent', async () => {
            await requestScene('redo');
            await delay(reloadTime);
            const nodeDump = await requestScene('query-node', testNodeUuid);
            prefab.checkMountedComponentsCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        let removedCompFileID = 0;
        it('remove component in prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;
            let firstChildDump = await requestScene('query-node', firstChild.uuid);
            removedCompFileID = firstChildDump.__comps__[0].value.__prefab.value.fileId.value;

            await requestScene('remove-array-element', { uuid: firstChild.uuid, path: '__comps__', index: 0 });

            firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkRemovedComponentsCount(nodeDump, 1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('revert removed component in prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);
            
            const firstChild = nodeDump.children[0].value;
            
            // 还原PrefabInstance中移除的Component
            await requestScene('revert-removed-component', firstChild.uuid, removedCompFileID);
            await delay(250);
            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(1);

            nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('after revert remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkRemovedComponentsCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('undo revert removed component(#17180)', async () => {
            await requestScene('undo');
           
            const nodeDump = await requestScene('query-node', testNodeUuid);
            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkRemovedComponentsCount(nodeDump, 1);

            const firstChild = nodeDump.children[0].value;
            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('redo revert removed component', async () => {

            await requestScene('redo');

            const nodeDump = await requestScene('query-node', testNodeUuid);
            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            // console.log('redo revert removed component:', testNodeUuid, nodeDump);

            const firstChild = nodeDump.children[0].value;
            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(1);
            
            prefab.checkRemovedComponentsCount(nodeDump, 0);

        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('remove component in prefabInstance again', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;
            let firstChildDump = await requestScene('query-node', firstChild.uuid);
            removedCompFileID = firstChildDump.__comps__[0].value.__prefab.value.fileId.value;

            await requestScene('remove-array-element', { uuid: firstChild.uuid, path: '__comps__', index: 0 });

            firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkRemovedComponentsCount(nodeDump, 1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('apply remove component in prefabInstance', async () => {
            let nodeDump = await requestScene('query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;
            
            // 将PrefabInstance身上移除的component应用到PrefabAsset中
            await requestScene('apply-removed-component', firstChild.uuid, removedCompFileID);

            // wait reload
            await delay(reloadTime);

            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('after apply remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            const prefabInstance = nodeDump.__prefab__.instance.value;
            prefab.checkRemovedComponentsCount(nodeDump, 0);
            prefab.checkMountedComponentsCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode(cc.MeshRender removed)
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('undo apply remove component in prefabInstance', async () => {
            await requestScene('undo');
            // wait reload
            await delay(reloadTime);
            let nodeDump = await requestScene('query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;

            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('after remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkRemovedComponentsCount(nodeDump, 1);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        it('redo apply remove component in prefabInstance', async () => {
            await requestScene('redo');
            // wait reload
            await delay(reloadTime);
            let nodeDump = await requestScene('query-node', testNodeUuid);

            const firstChild = nodeDump.children[0].value;

            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);

            nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log('after remove component:', nodeDump);

            const prefabFileId = nodeDump.__prefab__.fileId;
            expect(!!prefabFileId).to.true;
            prefab.checkRemovedComponentsCount(nodeDump, 0);
        });

        // scene:
        // - testPrefabRootNode(PrefabInstance)(position:[1,2,3])
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode(BoxCollider2D)
        // - testPrefabInstance2(PrefabInstance)
        it('create prefabInstance 2', async () => {
            // 从应用了removeComponent操作后的PrefabAsset中创建一个新的PrefabInstance
            testNodeUUID2 = await requestScene('create-node',
                { name: 'testPrefabInstance2', assetUuid: testPrefabAssetUUID2 });
            expect(!!testNodeUUID2).to.true;

            const nodeDump = await requestScene('query-node', testNodeUUID2);

            const firstChild = nodeDump.children[0].value;

            const firstChildDump = await requestScene('query-node', firstChild.uuid);
            expect(firstChildDump.__comps__.length).equal(0);
        });

        // scene:
        // - testPrefabRootNode
        //   - childCylinderNode
        //   - childNode(PrefabInstance)
        //      - childTorusNode
        //   - childConeNode
        //   - childConeNode
        it('unlink prefab', async () => {

            // 和Prefab取消关联
            const undoId = await requestScene('begin-recording', testNodeUuid);
            await requestScene('unlink-prefab', testNodeUuid);
            await requestScene('end-recording', undoId);

            const nodeDump = await requestScene('query-node', testNodeUuid);
            // console.log(nodeDump);
            const prefabInfo = nodeDump.__prefab__;
            expect(!!prefabInfo).to.false;
            expect(nodeDump.children.length).equal(4);
            const childPrefabUUID = nodeDump.children[1].value.uuid;

            const childPrefabDump = await requestScene('query-node', childPrefabUUID);
            // console.log('childPrefabDump:', childPrefabDump);
            const childPrefabInstance = childPrefabDump.__prefab__.instance;
            expect(!!childPrefabInstance).to.true;
        });

        it('undo unlink prefab', async () => {
            await requestScene('undo');

        });

        it('redo unlink prefab', async () => {
            await requestScene('redo');

        });
    });

    describe('clear test resources', async () => {
        it('remove test node', async () => {
            await requestScene('remove-node', { uuid: testNodeUuid });
            await requestScene('remove-node', { uuid: testNodeUUID2 });
        });

        it('delete prefab asset', async () => {
            const asset = await request('asset-db', 'delete-asset', testPrefabAssetUrl);
            expect(asset).not.to.be.null;

            const childAsset = await request('asset-db', 'delete-asset', childPrefabAssetUrl);
            expect(childAsset).not.to.be.null;

            const asset2 = await request('asset-db', 'delete-asset', testPrefabAssetUrl2);
            expect(asset2).not.to.be.null;
        });
    });
});
