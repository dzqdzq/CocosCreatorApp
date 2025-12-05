'use strict';

/**
 * 导入器注册，先在 package.json 里的 contributions 里注册 asset-db 的 asset-handler
 * 里面可以指定调用这个文件里的某一个 registerImporter 函数
 * 所以在这里新增函数后，需要去 package.json 里添加对应的注册字段
 * load，unload 是作为生命周期函数方便一些特殊事件的监听与销毁，正常情况下不需要写
 */

export const methods = {
    async registerHMISceneImporter() {
        const HMIScene = (await import('./handler/scene')).HMIScene;
        const next = await Editor.Profile.getConfig('hmi-adapter', 'next');
        if (!next) {
            // 移除 hmi-scene 的新建菜单
            delete HMIScene.createInfo!.generateMenuInfo;
        }
        return HMIScene;
    },
    async registerHMIPrefabImporter() {
        const HMIPrefab = (await import('./handler/prefab')).HMIPrefab;
        const next = await Editor.Profile.getConfig('hmi-adapter', 'next');
        if (!next) {
            // 移除 hmi-prefab 的新建菜单
            delete HMIPrefab.createInfo!.generateMenuInfo;
        }
        return HMIPrefab;
    },
};
