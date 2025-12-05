const DefaultPropertyOverrides = ['_name', '_lpos', '_lrot', '_euler'];
const { expect } = require('chai');
exports.prefab = {

    // 校验prefabStateInfo
    checkPrefabStateInfo: function(nodeDump, compared) {
        const prefabStateInfo = nodeDump.__prefab__.prefabStateInfo;
        compared.assetUuid && expect(prefabStateInfo.assetUuid).to.equal(compared.assetUuid);
        compared.isAddedChild && expect(prefabStateInfo.isAddedChild).to.equal(compared.isAddedChild);
        compared.isApplicable && expect(prefabStateInfo.isApplicable).to.equal(compared.isApplicable);//预制体实例根节点，可以更新到资源
        compared.isRevertable && expect(prefabStateInfo.isRevertable).to.equal(compared.isRevertable);//预制体实例根节点，可以从资源还原
        compared.isUnwrappable && expect(prefabStateInfo.isUnwrappable).to.equal(compared.isUnwrappable);// 可以解除嵌套
        compared.state && expect(prefabStateInfo.state).to.equal(compared.state);// PrefabState
    },
    
    checkMountedComponentsCount: function(nodeDump, num) {
        const mountedComponentNum = nodeDump.__prefab__.instance.value.mountedComponents.value.length;
        expect(mountedComponentNum).to.equal(num);
    },
    
    checkRemovedComponentsCount: function(nodeDump, num) {
        const removedComponentNum = nodeDump.__prefab__.instance.value.removedComponents.value.length;
        expect(removedComponentNum).to.equal(num);
        
    },
    
    checkMountedChildrenCount: function(nodeDump, num) {
        const mountedNodeNum = nodeDump.__prefab__.instance.value.mountedChildren.value[0].value.nodes.value.length;
        expect(mountedNodeNum).to.equal(num);
    },
    
    checkMountedChildrenInfoCount: function(nodeDump, num) {
        const mountedNodeNum = nodeDump.__prefab__.instance.value.mountedChildren.value.length;
        expect(mountedNodeNum).to.equal(num);
    },

    checkDefaultPropertyOverrides: function(nodeDump) {
        const prefabInstance = nodeDump.__prefab__.instance.value;
        const propertyOverrides = prefabInstance.propertyOverrides.value;
        
        // 默认有4个propertyOverride,['_name', '_lpos', '_lrot', '_euler']
        expect(propertyOverrides.length).equal(4);
        propertyOverrides.forEach((override) => {
            const path = override.value.propertyPath;
            expect(!!path).to.true;
            expect(DefaultPropertyOverrides.includes(path.value[0].value)).to.true;
        });
    },
    
    // _prefab.instance.prefabRootNode 如果是嵌套预制体实例，需要检查prefabRootNode指向是否正确
    checkInstancePrefabRootNode: function(nodeDump, expectNodeUUid) {
        const uuid = nodeDump.__prefab__.instance.value.prefabRootNode.value.uuid;
        expect(uuid).to.equal(expectNodeUUid);
    },

    // check prefab.root
    checkPrefabRoot: function(dump, uuid) {
        expect(dump.__prefab__.rootUuid).to.equal(uuid);
    },

    // check prefab.nestedPrefabInstanceRoots
    checkNestPrefabRoots: function(dump, count, uuids) {
        const root = dump.__prefab__.nestedPrefabInstanceRoots.value;
        expect(root.length).to.equal(count);
        if (uuids) {
            
        }
    },

    getMountedComponents: function(nodeDump) {
        return nodeDump.__prefab__.instance.value.mountedComponents.value;
    },
    
    getMountedChildren: function(nodeDump) {
        return nodeDump.__prefab__.instance.value.mountedChildren.value;
    },
    
    getRemovedComponents: function(nodeDump) {
        return nodeDump.__prefab__.instance.value.removedComponents.value;
    },
    
    getPropertyOverrides: function(nodeDump, prop) {
        const prefabInstance = nodeDump.__prefab__.instance.value;
        const propertyOverrides = prefabInstance.propertyOverrides.value;
        for (let index = 0; index < propertyOverrides.length; index++) {
            const override = propertyOverrides[index];
            const path = override.value.propertyPath;
            if (path.value[0].value === prop) {
                return override.value;
            }
        }
    },
};