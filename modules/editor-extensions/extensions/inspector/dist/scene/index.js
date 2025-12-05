'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const cc_1 = require("cc");
const scene_1 = require("../extension/scene");
// 模块加载的时候触发的函数
function load() { }
exports.load = load;
// 模块卸载的时候触发的函数
function unload() { }
exports.unload = unload;
// 模块内定义的方法
exports.methods = {
    queryComponentRender(uuids) {
        const uuid = uuids[0];
        const comp = cce.Component.query(uuid);
        return scene_1.queryVirtualElement(comp);
    },
    emitComponentRenderEvent(uuids, elemID, eventName, attrs) {
        const uuid = uuids[0];
        const comp = cce.Component.query(uuid);
        scene_1.emitVirtualEvent(comp, elemID, eventName, attrs);
    },
    queryNodeWorldTransform(uuid) {
        const node = cce.Node.query(uuid);
        if (!node) {
            return null;
        }
        const data = {
            worldPosition: [node.worldPosition.x, node.worldPosition.y, node.worldPosition.z],
            worldRotation: [node.worldRotation.x, node.worldRotation.y, node.worldRotation.z, node.worldRotation.w],
            worldScale: [node.worldScale.x, node.worldScale.y, node.worldScale.z],
        };
        return data;
    },
    setNodeWorldTransform(uuid, data) {
        const node = cce.Node.query(uuid);
        if (!node) {
            return;
        }
        node.setWorldPosition(...data.worldPosition);
        node.setWorldRotation(...data.worldRotation);
        node.setWorldScale(...data.worldScale);
    },
    // edit scene node
    async generateVector(envMapUuid) {
        const path = await Editor.Message.request('asset-db', 'query-path', envMapUuid.replace(/@[^@]+$/, ''));
        if (!path) {
            return;
        }
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', envMapUuid);
        const ldrHdrFormatString = (meta.userData.isRGBE) ? 'rgbm' : 'bgra8';
        const ext = path_1.extname(path);
        const base = path_1.basename(path, ext);
        // ---- Vector ----
        const distVector = path_1.join(Editor.Project.tmpDir, 'inspector', `${base}_diffusion`);
        const distVectorWithExt = distVector + '.txt';
        if (fs_extra_1.existsSync(distVectorWithExt)) {
            try {
                await electron_1.shell.trashItem(distVectorWithExt);
            }
            catch (error) { }
        }
        // retry
        if (fs_extra_1.existsSync(distVectorWithExt)) {
            try {
                await fs_extra_1.remove(distVectorWithExt);
            }
            catch (error) {
                console.error(error);
            }
        }
        try {
            let vectorChild;
            const vectorParams = [
                '--hemispherelightingcoef',
                '--filter',
                'irradiance',
                '--dstFaceSize',
                '32',
                '--output0params',
                'png,' + ldrHdrFormatString + ',latlong',
                '--input',
                path,
                '--output0',
                distVector,
            ];
            if (meta.userData.isRGBE && ext !== '.hdr') {
                vectorParams.splice(0, 0, '--rgbm');
            }
            fs_extra_1.ensureDirSync(path_1.dirname(distVector));
            if (process.platform === 'darwin') {
                vectorChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64'), vectorParams);
            }
            else {
                vectorChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), vectorParams);
            }
            await new Promise((resolve, reject) => {
                vectorChild.on('close', () => {
                    resolve(void 0);
                });
            });
            let vectors = ['', ''];
            if (fs_extra_1.existsSync(distVectorWithExt)) {
                vectors = fs_extra_1.readFileSync(distVectorWithExt, 'utf8').split(/\n/).map(item => item.trim());
            }
            else {
                if (meta.importer === 'texture-cube') {
                    console.warn(Editor.I18n.t('inspector.scene.recommendErpTextureCube'));
                    return;
                }
            }
            if (!vectors[0]) {
                vectors[0] = '';
            }
            if (!vectors[1]) {
                vectors[1] = '';
            }
            // example: ['0.01', '0.01', '0.01']
            const vector1 = vectors[0].split(',').map(item => parseFloat(item.trim()));
            const vector2 = vectors[1].split(',').map(item => parseFloat(item.trim()));
            cc.director._scene._globals.ambient.skyColor = new cc_1.Vec4(vector1[0], vector1[1], vector1[2], 0);
            cc.director._scene._globals.ambient.groundAlbedo = new cc_1.Vec4(vector2[0], vector2[1], vector2[2], 0);
            broadcastSceneChange();
        }
        catch (error) {
            console.error(error);
        }
    },
    // edit scene node
    async generateDiffuseMap(envMapUuid) {
        const path = await Editor.Message.request('asset-db', 'query-path', envMapUuid.replace(/@[^@]+$/, ''));
        if (!path) {
            return null;
        }
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', envMapUuid);
        const ldrHdrFormatString = (meta.userData.isRGBE) ? 'rgbm' : 'bgra8';
        const ext = path_1.extname(path);
        const base = path_1.basename(path, ext);
        // ---- DiffuseMap ----
        const distDiffuseMap = path_1.join(path_1.dirname(path), `${base}_diffusion`);
        const distDiffuseMapWithExt = distDiffuseMap + '.png';
        if (fs_extra_1.existsSync(distDiffuseMapWithExt)) {
            try {
                await electron_1.shell.trashItem(distDiffuseMapWithExt);
            }
            catch (error) { }
        }
        // retry
        if (fs_extra_1.existsSync(distDiffuseMapWithExt)) {
            try {
                await fs_extra_1.remove(distDiffuseMapWithExt);
            }
            catch (error) {
                console.error(error);
            }
        }
        try {
            let diffuseMapChild;
            const diffuseMapParams = [
                '--filter',
                'irradiance',
                '--dstFaceSize',
                '32',
                '--output0params',
                'png,' + ldrHdrFormatString + ',latlong',
                '--input',
                path,
                '--output0',
                distDiffuseMap,
            ];
            if (meta.userData.isRGBE && ext !== '.hdr') {
                diffuseMapParams.splice(0, 0, '--rgbm');
            }
            if (process.platform === 'darwin') {
                diffuseMapChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64'), diffuseMapParams);
            }
            else {
                diffuseMapChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), diffuseMapParams);
            }
            await new Promise((resolve, reject) => {
                diffuseMapChild.on('close', () => {
                    resolve(void 0);
                });
            });
            // Texture must be cube type
            const metaPath = distDiffuseMapWithExt + '.meta';
            if (fs_extra_1.existsSync(metaPath)) {
                const meta = fs_extra_1.readJSONSync(metaPath);
                meta.userData.type = 'texture cube';
                fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
            }
            else {
                fs_extra_1.outputJSONSync(metaPath, {
                    ver: '0.0.0',
                    importer: '*',
                    userData: {
                        type: 'texture cube',
                        isRGBE: meta.userData.isRGBE,
                    },
                }, { spaces: 2 });
            }
            // When the file is ready, tell the editor to refresh the file
            await Editor.Message.request('asset-db', 'refresh-asset', distDiffuseMapWithExt);
            if (distDiffuseMapWithExt) {
                const uuid = await Editor.Message.request('asset-db', 'query-uuid', distDiffuseMapWithExt);
                if (uuid) {
                    const asset = await new Promise((resolve) => {
                        cc.assetManager.loadAny(`${uuid}@b47c0`, (error, asset) => {
                            if (error) {
                                console.error(`asset can't be load:${uuid}`);
                                resolve(null);
                            }
                            else {
                                resolve(asset);
                            }
                        });
                    });
                    if (asset) {
                        cc.director._scene._globals.skybox.diffuseMap = asset;
                        broadcastSceneChange();
                    }
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    },
    async bakeReflectionConvolution(envMapUuid) {
        const path = await Editor.Message.request('asset-db', 'query-path', envMapUuid.replace(/@[^@]+$/, ''));
        if (!path) {
            return null;
        }
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', envMapUuid);
        const ldrHdrFormatString = (meta.userData.isRGBE) ? 'rgbm' : 'bgra8';
        const ext = path_1.extname(path);
        const base = path_1.basename(path, ext);
        const reflectionMap = path_1.join(path_1.dirname(path), `${base}_reflection`);
        const reflectionMapWithExt = reflectionMap + '.png';
        if (fs_extra_1.existsSync(reflectionMapWithExt)) {
            try {
                await electron_1.shell.trashItem(reflectionMapWithExt);
            }
            catch (error) { }
        }
        // retry
        if (fs_extra_1.existsSync(reflectionMapWithExt)) {
            try {
                await fs_extra_1.remove(reflectionMapWithExt);
            }
            catch (error) {
                console.error(error);
            }
        }
        try {
            let reflectionMapChild;
            const reflectionMapParams = [
                '--srcFaceSize',
                '1536',
                '--bypassoutputtype',
                '--output0params',
                'png,' + ldrHdrFormatString + ',latlong',
                '--input',
                path,
                '--output0',
                reflectionMap,
            ];
            if (meta.userData.isRGBE && ext !== '.hdr') {
                reflectionMapParams.splice(0, 0, '--rgbm');
            }
            if (process.platform === 'darwin') {
                reflectionMapChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64'), reflectionMapParams);
            }
            else {
                reflectionMapChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), reflectionMapParams);
            }
            await new Promise((resolve, reject) => {
                reflectionMapChild.on('close', () => {
                    resolve(void 0);
                });
            });
            //手动烘焙需要清除导入器保存的卷积图缓存，避免加载上次的烘焙结果
            const cachePath = path_1.join(path_1.dirname(path), `${base}_reflection_convolution`);
            for (let i = 0; i < 6; i++) {
                const mipmapPath = path_1.join(cachePath, 'mipmap_' + i.toString() + '.png');
                if (fs_extra_1.existsSync(mipmapPath)) {
                    fs_extra_1.removeSync(mipmapPath);
                }
            }
            // Texture must be cube type
            const metaPath = reflectionMapWithExt + '.meta';
            if (fs_extra_1.existsSync(metaPath)) {
                const meta = fs_extra_1.readJSONSync(metaPath);
                meta.userData.type = 'texture cube';
                fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
            }
            else {
                fs_extra_1.outputJSONSync(metaPath, {
                    ver: '0.0.0',
                    importer: '*',
                    userData: {
                        type: 'texture cube',
                        isRGBE: meta.userData.isRGBE,
                    },
                }, { spaces: 2 });
            }
            // When the file is ready, tell the editor to refresh the file
            await Editor.Message.request('asset-db', 'refresh-asset', reflectionMapWithExt);
            // 需要修改到子资源 erp-texture-cube 的 userData.mipBakeMode
            if (fs_extra_1.existsSync(metaPath)) {
                const meta = fs_extra_1.readJSONSync(metaPath);
                if (meta.subMetas?.b47c0) {
                    meta.subMetas.b47c0.userData.mipBakeMode = 2;
                    fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
                    await Editor.Message.request('asset-db', 'refresh-asset', reflectionMapWithExt);
                }
            }
            if (reflectionMapWithExt) {
                const uuid = await Editor.Message.request('asset-db', 'query-uuid', reflectionMapWithExt);
                if (uuid) {
                    const asset = await new Promise((resolve) => {
                        cc.assetManager.loadAny(`${uuid}@b47c0`, (error, asset) => {
                            if (error) {
                                console.error(`asset can't be load:${uuid}`);
                                resolve(null);
                            }
                            else {
                                resolve(asset);
                            }
                        });
                    });
                    if (asset) {
                        cc.director._scene._globals.skybox.reflectionMap = asset;
                        broadcastSceneChange();
                    }
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    },
    async setReflectionConvolutionMap(envMapUuid) {
        const path = await Editor.Message.request('asset-db', 'query-path', envMapUuid.replace(/@[^@]+$/, ''));
        if (!path) {
            return null;
        }
        const ext = path_1.extname(path);
        const base = path_1.basename(path, ext);
        const reflectionMap = path_1.join(path_1.dirname(path), `${base}_reflection`);
        const reflectionMapWithExt = reflectionMap + '.png';
        if (fs_extra_1.existsSync(reflectionMapWithExt)) {
            const uuid = await Editor.Message.request('asset-db', 'query-uuid', reflectionMapWithExt);
            if (uuid) {
                const asset = await new Promise((resolve) => {
                    cc.assetManager.loadAny(`${uuid}@b47c0`, (error, asset) => {
                        if (error) {
                            console.error(`asset can't be load:${uuid}`);
                            resolve(null);
                        }
                        else {
                            resolve(asset);
                        }
                    });
                });
                if (asset) {
                    cc.director._scene._globals.skybox.reflectionMap = asset;
                    broadcastSceneChange();
                }
            }
        }
        else {
            if (cc.director._scene._globals.skybox.reflectionMap) {
                cc.director._scene._globals.skybox.reflectionMap = null;
                broadcastSceneChange();
            }
        }
    },
    async setSkyboxEnvMap(uuid) {
        if (uuid) {
            const asset = await new Promise((resolve) => {
                cc.assetManager.loadAny(uuid, (error, asset) => {
                    if (error) {
                        console.error(`asset can't be load:${uuid}`);
                        resolve(null);
                    }
                    else {
                        resolve(asset);
                    }
                });
            });
            if (asset) {
                cc.director._scene._globals.skybox.updateEnvMap(asset);
            }
        }
        else {
            cc.director._scene._globals.skybox.updateEnvMap(null);
            broadcastSceneChange();
        }
    },
};
function broadcastSceneChange() {
    const scene = cc.director.getScene();
    Editor.Message.broadcast('scene:change-node', scene.uuid);
    cce.SceneFacadeManager.recordNode(scene);
    cce.SceneFacadeManager.snapshot();
    cce.Engine.repaintInEditMode();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsaURBQW9EO0FBQ3BELCtCQUF3RDtBQUN4RCx1Q0FBcUg7QUFDckgsMkJBQTBCO0FBRTFCLDhDQUFxRjtBQWNyRixlQUFlO0FBQ2YsU0FBZ0IsSUFBSSxLQUFLLENBQUM7QUFBMUIsb0JBQTBCO0FBQzFCLGVBQWU7QUFDZixTQUFnQixNQUFNLEtBQUssQ0FBQztBQUE1Qix3QkFBNEI7QUFFNUIsV0FBVztBQUNFLFFBQUEsT0FBTyxHQUFHO0lBQ25CLG9CQUFvQixDQUFDLEtBQWU7UUFDaEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sMkJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELHdCQUF3QixDQUFDLEtBQWUsRUFBRSxNQUFjLEVBQUUsU0FBaUIsRUFBRSxLQUFpQztRQUMxRyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsd0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELHVCQUF1QixDQUFDLElBQVk7UUFDaEMsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbEMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNQLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7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LEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRCxHQUFHLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsQyxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDbkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgc2hlbGwgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgeyBzcGF3biwgQ2hpbGRQcm9jZXNzIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lLCBiYXNlbmFtZSwgZXh0bmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgb3V0cHV0SlNPTlN5bmMsIHJlbW92ZSwgZXhpc3RzU3luYywgcmVhZEpTT05TeW5jLCBlbnN1cmVEaXJTeW5jLCByZWFkRmlsZVN5bmMsIHJlbW92ZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBWZWM0IH0gZnJvbSAnY2MnO1xuXG5pbXBvcnQgeyBlbWl0VmlydHVhbEV2ZW50LCBxdWVyeVZpcnR1YWxFbGVtZW50LCByZWdpc3RlciB9IGZyb20gJy4uL2V4dGVuc2lvbi9zY2VuZSc7XG5pbXBvcnQgeyBWaXJ0dWFsRWxlbWVudCB9IGZyb20gJy4uL2V4dGVuc2lvbi9lbGVtZW50JztcblxuLy8gVE9ETyDmtYvor5Xku6PnoIFcbi8vIGltcG9ydCB7IFhNTExhYmVsSW5zcGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9uL3NjZW5lL3htbC50ZXN0Jztcbi8vIHJlZ2lzdGVyKCdjYy5MYWJlbCcsIG5ldyBYTUxMYWJlbEluc3BlY3RvckNvbXBvbmVudCk7XG4vLyBpbXBvcnQgeyBTaW1wbGVKU09OTGFiZWxJbnNwZWN0b3JDb21wb25lbnQgfSBmcm9tICcuLi9leHRlbnNpb24vc2NlbmUvc2ltcGxlLWpzb24udGVzdCc7XG4vLyByZWdpc3RlcignY2MuTGFiZWwnLCBuZXcgU2ltcGxlSlNPTkxhYmVsSW5zcGVjdG9yQ29tcG9uZW50KTtcbi8vIGltcG9ydCB7IFNpbXBsZVhNTExhYmVsSW5zcGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9uL3NjZW5lL3NpbXBsZS14bWwudGVzdCc7XG4vLyByZWdpc3RlcignY2MuTGFiZWwnLCBuZXcgU2ltcGxlWE1MTGFiZWxJbnNwZWN0b3JDb21wb25lbnQpO1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5kZWNsYXJlIGNvbnN0IGNjZTogYW55O1xuXG4vLyDmqKHlnZfliqDovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkgeyB9XG4vLyDmqKHlnZfljbjovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7IH1cblxuLy8g5qih5Z2X5YaF5a6a5LmJ55qE5pa55rOVXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBxdWVyeUNvbXBvbmVudFJlbmRlcih1dWlkczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgdXVpZCA9IHV1aWRzWzBdO1xuICAgICAgICBjb25zdCBjb21wID0gY2NlLkNvbXBvbmVudC5xdWVyeSh1dWlkKTtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5VmlydHVhbEVsZW1lbnQoY29tcCk7XG4gICAgfSxcblxuICAgIGVtaXRDb21wb25lbnRSZW5kZXJFdmVudCh1dWlkczogc3RyaW5nW10sIGVsZW1JRDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgYXR0cnM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9KSB7XG4gICAgICAgIGNvbnN0IHV1aWQgPSB1dWlkc1swXTtcbiAgICAgICAgY29uc3QgY29tcCA9IGNjZS5Db21wb25lbnQucXVlcnkodXVpZCk7XG4gICAgICAgIGVtaXRWaXJ0dWFsRXZlbnQoY29tcCwgZWxlbUlELCBldmVudE5hbWUsIGF0dHJzKTtcbiAgICB9LFxuXG4gICAgcXVlcnlOb2RlV29ybGRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjY2UuTm9kZS5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIHdvcmxkUG9zaXRpb246IFtub2RlLndvcmxkUG9zaXRpb24ueCwgbm9kZS53b3JsZFBvc2l0aW9uLnksIG5vZGUud29ybGRQb3NpdGlvbi56XSxcbiAgICAgICAgICAgIHdvcmxkUm90YXRpb246IFtub2RlLndvcmxkUm90YXRpb24ueCwgbm9kZS53b3JsZFJvdGF0aW9uLnksIG5vZGUud29ybGRSb3RhdGlvbi56LCBub2RlLndvcmxkUm90YXRpb24ud10sXG4gICAgICAgICAgICB3b3JsZFNjYWxlOiBbbm9kZS53b3JsZFNjYWxlLngsIG5vZGUud29ybGRTY2FsZS55LCBub2RlLndvcmxkU2NhbGUuel0sXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHNldE5vZGVXb3JsZFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgICAgICBjb25zdCBub2RlID0gY2NlLk5vZGUucXVlcnkodXVpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldFdvcmxkUG9zaXRpb24oLi4uZGF0YS53b3JsZFBvc2l0aW9uKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFJvdGF0aW9uKC4uLmRhdGEud29ybGRSb3RhdGlvbik7XG4gICAgICAgIG5vZGUuc2V0V29ybGRTY2FsZSguLi5kYXRhLndvcmxkU2NhbGUpO1xuICAgIH0sXG5cbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZVZlY3RvcihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gVmVjdG9yIC0tLS1cbiAgICAgICAgY29uc3QgZGlzdFZlY3RvciA9IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnaW5zcGVjdG9yJywgYCR7YmFzZX1fZGlmZnVzaW9uYCk7XG4gICAgICAgIGNvbnN0IGRpc3RWZWN0b3JXaXRoRXh0ID0gZGlzdFZlY3RvciArICcudHh0JztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hlbGwudHJhc2hJdGVtKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHZlY3RvckNoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3JQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0taGVtaXNwaGVyZWxpZ2h0aW5nY29lZicsXG4gICAgICAgICAgICAgICAgJy0tZmlsdGVyJyxcbiAgICAgICAgICAgICAgICAnaXJyYWRpYW5jZScsXG4gICAgICAgICAgICAgICAgJy0tZHN0RmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICczMicsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICBkaXN0VmVjdG9yLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIHZlY3RvclBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoZGlzdFZlY3RvcikpO1xuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgdmVjdG9yczogc3RyaW5nW10gPSBbJycsICcnXTtcblxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdFZlY3RvcldpdGhFeHQpKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9ycyA9IHJlYWRGaWxlU3luYyhkaXN0VmVjdG9yV2l0aEV4dCwgJ3V0ZjgnKS5zcGxpdCgvXFxuLykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobWV0YS5pbXBvcnRlciA9PT0gJ3RleHR1cmUtY3ViZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2luc3BlY3Rvci5zY2VuZS5yZWNvbW1lbmRFcnBUZXh0dXJlQ3ViZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzBdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1swXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzFdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1sxXSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBleGFtcGxlOiBbJzAuMDEnLCAnMC4wMScsICcwLjAxJ11cbiAgICAgICAgICAgIGNvbnN0IHZlY3RvcjEgPSB2ZWN0b3JzWzBdLnNwbGl0KCcsJykubWFwKGl0ZW0gPT4gcGFyc2VGbG9hdChpdGVtLnRyaW0oKSkpO1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yMiA9IHZlY3RvcnNbMV0uc3BsaXQoJywnKS5tYXAoaXRlbSA9PiBwYXJzZUZsb2F0KGl0ZW0udHJpbSgpKSk7XG5cbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5hbWJpZW50LnNreUNvbG9yID0gbmV3IFZlYzQodmVjdG9yMVswXSwgdmVjdG9yMVsxXSwgdmVjdG9yMVsyXSwgMCk7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuYW1iaWVudC5ncm91bmRBbGJlZG8gPSBuZXcgVmVjNCh2ZWN0b3IyWzBdLCB2ZWN0b3IyWzFdLCB2ZWN0b3IyWzJdLCAwKTtcblxuICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZURpZmZ1c2VNYXAoZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gRGlmZnVzZU1hcCAtLS0tXG4gICAgICAgIGNvbnN0IGRpc3REaWZmdXNlTWFwID0gam9pbihkaXJuYW1lKHBhdGgpLCBgJHtiYXNlfV9kaWZmdXNpb25gKTtcbiAgICAgICAgY29uc3QgZGlzdERpZmZ1c2VNYXBXaXRoRXh0ID0gZGlzdERpZmZ1c2VNYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0oZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0RGlmZnVzZU1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlbW92ZShkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgZGlmZnVzZU1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCBkaWZmdXNlTWFwUGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICctLWZpbHRlcicsXG4gICAgICAgICAgICAgICAgJ2lycmFkaWFuY2UnLFxuICAgICAgICAgICAgICAgICctLWRzdEZhY2VTaXplJyxcbiAgICAgICAgICAgICAgICAnMzInLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAgICAgJy0taW5wdXQnLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICAgICAgZGlzdERpZmZ1c2VNYXAsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YS5pc1JHQkUgJiYgZXh0ICE9PSAnLmhkcicpIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIGRpZmZ1c2VNYXBQYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgZGlmZnVzZU1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcENoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFRleHR1cmUgbXVzdCBiZSBjdWJlIHR5cGVcbiAgICAgICAgICAgIGNvbnN0IG1ldGFQYXRoID0gZGlzdERpZmZ1c2VNYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyOiAnMC4wLjAnLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJyonLFxuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1JHQkU6IG1ldGEudXNlckRhdGEuaXNSR0JFLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBmaWxlIGlzIHJlYWR5LCB0ZWxsIHRoZSBlZGl0b3IgdG8gcmVmcmVzaCB0aGUgZmlsZVxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIGlmIChkaXN0RGlmZnVzZU1hcFdpdGhFeHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3guZGlmZnVzZU1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIGJha2VSZWZsZWN0aW9uQ29udm9sdXRpb24oZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXAgPSBqb2luKGRpcm5hbWUocGF0aCksIGAke2Jhc2V9X3JlZmxlY3Rpb25gKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcFdpdGhFeHQgPSByZWZsZWN0aW9uTWFwICsgJy5wbmcnO1xuXG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0ocmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJldHJ5XG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZW1vdmUocmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVmbGVjdGlvbk1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwUGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICctLXNyY0ZhY2VTaXplJyxcbiAgICAgICAgICAgICAgICAnMTUzNicsXG4gICAgICAgICAgICAgICAgJy0tYnlwYXNzb3V0cHV0dHlwZScsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwLFxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGEuaXNSR0JFICYmIGV4dCAhPT0gJy5oZHInKSB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcFBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NCcpLCByZWZsZWN0aW9uTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHJlZmxlY3Rpb25NYXBQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvL+aJi+WKqOeDmOeEmemcgOimgea4hemZpOWvvOWFpeWZqOS/neWtmOeahOWNt+enr+Wbvue8k+WtmO+8jOmBv+WFjeWKoOi9veS4iuasoeeahOeDmOeEmee7k+aenFxuICAgICAgICAgICAgY29uc3QgY2FjaGVQYXRoID0gam9pbihkaXJuYW1lKHBhdGgpLCBgJHtiYXNlfV9yZWZsZWN0aW9uX2NvbnZvbHV0aW9uYCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pcG1hcFBhdGggPSBqb2luKGNhY2hlUGF0aCwgJ21pcG1hcF8nICsgaS50b1N0cmluZygpICsgJy5wbmcnKTtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtaXBtYXBQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVTeW5jKG1pcG1hcFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGV4dHVyZSBtdXN0IGJlIGN1YmUgdHlwZVxuICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSByZWZsZWN0aW9uTWFwV2l0aEV4dCArICcubWV0YSc7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLnR5cGUgPSAndGV4dHVyZSBjdWJlJztcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwgbWV0YSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCB7XG4gICAgICAgICAgICAgICAgICAgIHZlcjogJzAuMC4wJyxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZXI6ICcqJyxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0dXJlIGN1YmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNSR0JFOiBtZXRhLnVzZXJEYXRhLmlzUkdCRSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2hlbiB0aGUgZmlsZSBpcyByZWFkeSwgdGVsbCB0aGUgZWRpdG9yIHRvIHJlZnJlc2ggdGhlIGZpbGVcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIC8vIOmcgOimgeS/ruaUueWIsOWtkOi1hOa6kCBlcnAtdGV4dHVyZS1jdWJlIOeahCB1c2VyRGF0YS5taXBCYWtlTW9kZVxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKG1ldGEuc3ViTWV0YXM/LmI0N2MwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGEuc3ViTWV0YXMuYjQ3YzAudXNlckRhdGEubWlwQmFrZU1vZGUgPSAyO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwgbWV0YSwgeyBzcGFjZXM6IDIgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZWZsZWN0aW9uTWFwV2l0aEV4dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgcmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLmxvYWRBbnkoYCR7dXVpZH1AYjQ3YzBgLCAoZXJyb3I6IGFueSwgYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldCBjYW4ndCBiZSBsb2FkOiR7dXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuc2t5Ym94LnJlZmxlY3Rpb25NYXAgPSBhc3NldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyb2FkY2FzdFNjZW5lQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBzZXRSZWZsZWN0aW9uQ29udm9sdXRpb25NYXAoZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleHQgPSBleHRuYW1lKHBhdGgpO1xuICAgICAgICBjb25zdCBiYXNlID0gYmFzZW5hbWUocGF0aCwgZXh0KTtcblxuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwID0gam9pbihkaXJuYW1lKHBhdGgpLCBgJHtiYXNlfV9yZWZsZWN0aW9uYCk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXBXaXRoRXh0ID0gcmVmbGVjdGlvbk1hcCArICcucG5nJztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhyZWZsZWN0aW9uTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgcmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuXG4gICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLmxvYWRBbnkoYCR7dXVpZH1AYjQ3YzBgLCAoZXJyb3I6IGFueSwgYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICBicm9hZGNhc3RTY2VuZUNoYW5nZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuc2t5Ym94LnJlZmxlY3Rpb25NYXApIHtcbiAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuc2t5Ym94LnJlZmxlY3Rpb25NYXAgPSBudWxsO1xuICAgICAgICAgICAgICAgIGJyb2FkY2FzdFNjZW5lQ2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHNldFNreWJveEVudk1hcCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueSh1dWlkLCAoZXJyb3I6IGFueSwgYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gudXBkYXRlRW52TWFwKGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gudXBkYXRlRW52TWFwKG51bGwpO1xuICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5mdW5jdGlvbiBicm9hZGNhc3RTY2VuZUNoYW5nZSgpIHtcbiAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIHNjZW5lLnV1aWQpO1xuICAgIGNjZS5TY2VuZUZhY2FkZU1hbmFnZXIucmVjb3JkTm9kZShzY2VuZSk7XG4gICAgY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5zbmFwc2hvdCgpO1xuICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbn1cbiJdfQ==