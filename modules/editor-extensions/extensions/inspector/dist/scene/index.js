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
        return (0, scene_1.queryVirtualElement)(comp);
    },
    emitComponentRenderEvent(uuids, elemID, eventName, attrs) {
        const uuid = uuids[0];
        const comp = cce.Component.query(uuid);
        (0, scene_1.emitVirtualEvent)(comp, elemID, eventName, attrs);
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
        const ext = (0, path_1.extname)(path);
        const base = (0, path_1.basename)(path, ext);
        // ---- Vector ----
        const distVector = (0, path_1.join)(Editor.Project.tmpDir, 'inspector', `${base}_diffusion`);
        const distVectorWithExt = distVector + '.txt';
        if ((0, fs_extra_1.existsSync)(distVectorWithExt)) {
            try {
                await electron_1.shell.trashItem(distVectorWithExt);
            }
            catch (error) { }
        }
        // retry
        if ((0, fs_extra_1.existsSync)(distVectorWithExt)) {
            try {
                await (0, fs_extra_1.remove)(distVectorWithExt);
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
            (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(distVector));
            if (process.platform === 'darwin') {
                vectorChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64'), vectorParams);
            }
            else {
                vectorChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), vectorParams);
            }
            await new Promise((resolve, reject) => {
                vectorChild.on('close', () => {
                    resolve(void 0);
                });
            });
            let vectors = ['', ''];
            if ((0, fs_extra_1.existsSync)(distVectorWithExt)) {
                vectors = (0, fs_extra_1.readFileSync)(distVectorWithExt, 'utf8').split(/\n/).map(item => item.trim());
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
        const ext = (0, path_1.extname)(path);
        const base = (0, path_1.basename)(path, ext);
        // ---- DiffuseMap ----
        const genPath = await findGenerationPath(path, envMapUuid, true);
        const distDiffuseMap = (0, path_1.join)(genPath, `${base}_diffusion`);
        const distDiffuseMapWithExt = distDiffuseMap + '.png';
        if ((0, fs_extra_1.existsSync)(distDiffuseMapWithExt)) {
            try {
                await electron_1.shell.trashItem(distDiffuseMapWithExt);
            }
            catch (error) { }
        }
        // retry
        if ((0, fs_extra_1.existsSync)(distDiffuseMapWithExt)) {
            try {
                await (0, fs_extra_1.remove)(distDiffuseMapWithExt);
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
                diffuseMapChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64'), diffuseMapParams);
            }
            else {
                diffuseMapChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), diffuseMapParams);
            }
            await new Promise((resolve, reject) => {
                diffuseMapChild.on('close', () => {
                    resolve(void 0);
                });
            });
            // Texture must be cube type
            const metaPath = distDiffuseMapWithExt + '.meta';
            if ((0, fs_extra_1.existsSync)(metaPath)) {
                const meta = (0, fs_extra_1.readJSONSync)(metaPath);
                meta.userData.type = 'texture cube';
                (0, fs_extra_1.outputJSONSync)(metaPath, meta, { spaces: 2 });
            }
            else {
                (0, fs_extra_1.outputJSONSync)(metaPath, {
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
        const ext = (0, path_1.extname)(path);
        const base = (0, path_1.basename)(path, ext);
        const genPath = await findGenerationPath(path, envMapUuid, true);
        const reflectionMap = (0, path_1.join)(genPath, `${base}_reflection`);
        const reflectionMapWithExt = reflectionMap + '.png';
        if ((0, fs_extra_1.existsSync)(reflectionMapWithExt)) {
            try {
                await electron_1.shell.trashItem(reflectionMapWithExt);
            }
            catch (error) { }
        }
        // retry
        if ((0, fs_extra_1.existsSync)(reflectionMapWithExt)) {
            try {
                await (0, fs_extra_1.remove)(reflectionMapWithExt);
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
                reflectionMapChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64'), reflectionMapParams);
            }
            else {
                reflectionMapChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), reflectionMapParams);
            }
            await new Promise((resolve, reject) => {
                reflectionMapChild.on('close', () => {
                    resolve(void 0);
                });
            });
            //手动烘焙需要清除导入器保存的卷积图缓存，避免加载上次的烘焙结果
            const cachePath = (0, path_1.join)((0, path_1.dirname)(genPath), `${base}_reflection_convolution`);
            for (let i = 0; i < 6; i++) {
                const mipmapPath = (0, path_1.join)(cachePath, 'mipmap_' + i.toString() + '.png');
                if ((0, fs_extra_1.existsSync)(mipmapPath)) {
                    (0, fs_extra_1.removeSync)(mipmapPath);
                }
            }
            // Texture must be cube type
            const metaPath = reflectionMapWithExt + '.meta';
            if ((0, fs_extra_1.existsSync)(metaPath)) {
                const meta = (0, fs_extra_1.readJSONSync)(metaPath);
                meta.userData.type = 'texture cube';
                (0, fs_extra_1.outputJSONSync)(metaPath, meta, { spaces: 2 });
            }
            else {
                (0, fs_extra_1.outputJSONSync)(metaPath, {
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
            if ((0, fs_extra_1.existsSync)(metaPath)) {
                const meta = (0, fs_extra_1.readJSONSync)(metaPath);
                if (meta.subMetas?.b47c0) {
                    meta.subMetas.b47c0.userData.mipBakeMode = 2;
                    (0, fs_extra_1.outputJSONSync)(metaPath, meta, { spaces: 2 });
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
        const ext = (0, path_1.extname)(path);
        const base = (0, path_1.basename)(path, ext);
        const genPath = await findGenerationPath(path, envMapUuid, false);
        const reflectionMap = (0, path_1.join)(genPath, `${base}_reflection`);
        const reflectionMapWithExt = reflectionMap + '.png';
        if ((0, fs_extra_1.existsSync)(reflectionMapWithExt)) {
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
async function findGenerationPath(path, uuid, isSaving) {
    //internal resource need to be saved to the project directory
    let envMapPath = await Editor.Message.request('asset-db', 'query-url', uuid);
    if (envMapPath && envMapPath.includes(`db://internal`)) {
        envMapPath = (0, path_1.dirname)(envMapPath);
        envMapPath = envMapPath.replace(`db://internal/`, `${Editor.Project.path}/assets/internal/`);
        envMapPath = envMapPath.replace(/\\/g, '/');
        if (isSaving)
            (0, fs_extra_1.ensureDirSync)(envMapPath);
        path = envMapPath;
    }
    else {
        path = (0, path_1.dirname)(path);
    }
    return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsaURBQW9EO0FBQ3BELCtCQUF3RDtBQUN4RCx1Q0FBcUg7QUFDckgsMkJBQTBCO0FBRTFCLDhDQUFxRjtBQWNyRixlQUFlO0FBQ2YsU0FBZ0IsSUFBSSxLQUFLLENBQUM7QUFBMUIsb0JBQTBCO0FBQzFCLGVBQWU7QUFDZixTQUFnQixNQUFNLEtBQUssQ0FBQztBQUE1Qix3QkFBNEI7QUFFNUIsV0FBVztBQUNFLFFBQUEsT0FBTyxHQUFHO0lBQ25CLG9CQUFvQixDQUFDLEtBQWU7UUFDaEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sSUFBQSwyQkFBbUIsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsd0JBQXdCLENBQUMsS0FBZSxFQUFFLE1BQWMsRUFBRSxTQUFpQixFQUFFLEtBQWlDO1FBQzFHLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFBLHdCQUFnQixFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCx1QkFBdUIsQ0FBQyxJQUFZO1FBQ2hDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxPQUFPLElBQUks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LEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDO1FBQzdGLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM1QyxJQUFJLFFBQVE7WUFBRSxJQUFBLHdCQUFhLEVBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEMsSUFBSSxHQUFHLFVBQVUsQ0FBQztLQUNyQjtTQUNJO1FBQ0QsSUFBSSxHQUFHLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3hCO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgc2hlbGwgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgeyBzcGF3biwgQ2hpbGRQcm9jZXNzIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lLCBiYXNlbmFtZSwgZXh0bmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgb3V0cHV0SlNPTlN5bmMsIHJlbW92ZSwgZXhpc3RzU3luYywgcmVhZEpTT05TeW5jLCBlbnN1cmVEaXJTeW5jLCByZWFkRmlsZVN5bmMsIHJlbW92ZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBWZWM0IH0gZnJvbSAnY2MnO1xuXG5pbXBvcnQgeyBlbWl0VmlydHVhbEV2ZW50LCBxdWVyeVZpcnR1YWxFbGVtZW50LCByZWdpc3RlciB9IGZyb20gJy4uL2V4dGVuc2lvbi9zY2VuZSc7XG5pbXBvcnQgeyBWaXJ0dWFsRWxlbWVudCB9IGZyb20gJy4uL2V4dGVuc2lvbi9lbGVtZW50JztcblxuLy8gVE9ETyDmtYvor5Xku6PnoIFcbi8vIGltcG9ydCB7IFhNTExhYmVsSW5zcGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9uL3NjZW5lL3htbC50ZXN0Jztcbi8vIHJlZ2lzdGVyKCdjYy5MYWJlbCcsIG5ldyBYTUxMYWJlbEluc3BlY3RvckNvbXBvbmVudCk7XG4vLyBpbXBvcnQgeyBTaW1wbGVKU09OTGFiZWxJbnNwZWN0b3JDb21wb25lbnQgfSBmcm9tICcuLi9leHRlbnNpb24vc2NlbmUvc2ltcGxlLWpzb24udGVzdCc7XG4vLyByZWdpc3RlcignY2MuTGFiZWwnLCBuZXcgU2ltcGxlSlNPTkxhYmVsSW5zcGVjdG9yQ29tcG9uZW50KTtcbi8vIGltcG9ydCB7IFNpbXBsZVhNTExhYmVsSW5zcGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9uL3NjZW5lL3NpbXBsZS14bWwudGVzdCc7XG4vLyByZWdpc3RlcignY2MuTGFiZWwnLCBuZXcgU2ltcGxlWE1MTGFiZWxJbnNwZWN0b3JDb21wb25lbnQpO1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5kZWNsYXJlIGNvbnN0IGNjZTogYW55O1xuXG4vLyDmqKHlnZfliqDovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkgeyB9XG4vLyDmqKHlnZfljbjovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7IH1cblxuLy8g5qih5Z2X5YaF5a6a5LmJ55qE5pa55rOVXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBxdWVyeUNvbXBvbmVudFJlbmRlcih1dWlkczogc3RyaW5nW10pIHtcbiAgICAgICAgY29uc3QgdXVpZCA9IHV1aWRzWzBdO1xuICAgICAgICBjb25zdCBjb21wID0gY2NlLkNvbXBvbmVudC5xdWVyeSh1dWlkKTtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5VmlydHVhbEVsZW1lbnQoY29tcCk7XG4gICAgfSxcblxuICAgIGVtaXRDb21wb25lbnRSZW5kZXJFdmVudCh1dWlkczogc3RyaW5nW10sIGVsZW1JRDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgYXR0cnM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9KSB7XG4gICAgICAgIGNvbnN0IHV1aWQgPSB1dWlkc1swXTtcbiAgICAgICAgY29uc3QgY29tcCA9IGNjZS5Db21wb25lbnQucXVlcnkodXVpZCk7XG4gICAgICAgIGVtaXRWaXJ0dWFsRXZlbnQoY29tcCwgZWxlbUlELCBldmVudE5hbWUsIGF0dHJzKTtcbiAgICB9LFxuXG4gICAgcXVlcnlOb2RlV29ybGRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjY2UuTm9kZS5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIHdvcmxkUG9zaXRpb246IFtub2RlLndvcmxkUG9zaXRpb24ueCwgbm9kZS53b3JsZFBvc2l0aW9uLnksIG5vZGUud29ybGRQb3NpdGlvbi56XSxcbiAgICAgICAgICAgIHdvcmxkUm90YXRpb246IFtub2RlLndvcmxkUm90YXRpb24ueCwgbm9kZS53b3JsZFJvdGF0aW9uLnksIG5vZGUud29ybGRSb3RhdGlvbi56LCBub2RlLndvcmxkUm90YXRpb24ud10sXG4gICAgICAgICAgICB3b3JsZFNjYWxlOiBbbm9kZS53b3JsZFNjYWxlLngsIG5vZGUud29ybGRTY2FsZS55LCBub2RlLndvcmxkU2NhbGUuel0sXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHNldE5vZGVXb3JsZFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgICAgICBjb25zdCBub2RlID0gY2NlLk5vZGUucXVlcnkodXVpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldFdvcmxkUG9zaXRpb24oLi4uZGF0YS53b3JsZFBvc2l0aW9uKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFJvdGF0aW9uKC4uLmRhdGEud29ybGRSb3RhdGlvbik7XG4gICAgICAgIG5vZGUuc2V0V29ybGRTY2FsZSguLi5kYXRhLndvcmxkU2NhbGUpO1xuICAgIH0sXG5cbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZVZlY3RvcihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gVmVjdG9yIC0tLS1cbiAgICAgICAgY29uc3QgZGlzdFZlY3RvciA9IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnaW5zcGVjdG9yJywgYCR7YmFzZX1fZGlmZnVzaW9uYCk7XG4gICAgICAgIGNvbnN0IGRpc3RWZWN0b3JXaXRoRXh0ID0gZGlzdFZlY3RvciArICcudHh0JztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hlbGwudHJhc2hJdGVtKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHZlY3RvckNoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3JQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0taGVtaXNwaGVyZWxpZ2h0aW5nY29lZicsXG4gICAgICAgICAgICAgICAgJy0tZmlsdGVyJyxcbiAgICAgICAgICAgICAgICAnaXJyYWRpYW5jZScsXG4gICAgICAgICAgICAgICAgJy0tZHN0RmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICczMicsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICBkaXN0VmVjdG9yLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIHZlY3RvclBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoZGlzdFZlY3RvcikpO1xuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgdmVjdG9yczogc3RyaW5nW10gPSBbJycsICcnXTtcblxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdFZlY3RvcldpdGhFeHQpKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9ycyA9IHJlYWRGaWxlU3luYyhkaXN0VmVjdG9yV2l0aEV4dCwgJ3V0ZjgnKS5zcGxpdCgvXFxuLykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobWV0YS5pbXBvcnRlciA9PT0gJ3RleHR1cmUtY3ViZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2luc3BlY3Rvci5zY2VuZS5yZWNvbW1lbmRFcnBUZXh0dXJlQ3ViZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzBdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1swXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzFdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1sxXSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBleGFtcGxlOiBbJzAuMDEnLCAnMC4wMScsICcwLjAxJ11cbiAgICAgICAgICAgIGNvbnN0IHZlY3RvcjEgPSB2ZWN0b3JzWzBdLnNwbGl0KCcsJykubWFwKGl0ZW0gPT4gcGFyc2VGbG9hdChpdGVtLnRyaW0oKSkpO1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yMiA9IHZlY3RvcnNbMV0uc3BsaXQoJywnKS5tYXAoaXRlbSA9PiBwYXJzZUZsb2F0KGl0ZW0udHJpbSgpKSk7XG5cbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5hbWJpZW50LnNreUNvbG9yID0gbmV3IFZlYzQodmVjdG9yMVswXSwgdmVjdG9yMVsxXSwgdmVjdG9yMVsyXSwgMCk7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuYW1iaWVudC5ncm91bmRBbGJlZG8gPSBuZXcgVmVjNCh2ZWN0b3IyWzBdLCB2ZWN0b3IyWzFdLCB2ZWN0b3IyWzJdLCAwKTtcblxuICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZURpZmZ1c2VNYXAoZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gRGlmZnVzZU1hcCAtLS0tXG4gICAgICAgIGNvbnN0IGdlblBhdGggPSBhd2FpdCBmaW5kR2VuZXJhdGlvblBhdGgocGF0aCwgZW52TWFwVXVpZCwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IGRpc3REaWZmdXNlTWFwID0gam9pbihnZW5QYXRoLCBgJHtiYXNlfV9kaWZmdXNpb25gKTtcbiAgICAgICAgY29uc3QgZGlzdERpZmZ1c2VNYXBXaXRoRXh0ID0gZGlzdERpZmZ1c2VNYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0oZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0RGlmZnVzZU1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlbW92ZShkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgZGlmZnVzZU1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCBkaWZmdXNlTWFwUGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICctLWZpbHRlcicsXG4gICAgICAgICAgICAgICAgJ2lycmFkaWFuY2UnLFxuICAgICAgICAgICAgICAgICctLWRzdEZhY2VTaXplJyxcbiAgICAgICAgICAgICAgICAnMzInLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAgICAgJy0taW5wdXQnLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICAgICAgZGlzdERpZmZ1c2VNYXAsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YS5pc1JHQkUgJiYgZXh0ICE9PSAnLmhkcicpIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIGRpZmZ1c2VNYXBQYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgZGlmZnVzZU1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcENoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFRleHR1cmUgbXVzdCBiZSBjdWJlIHR5cGVcbiAgICAgICAgICAgIGNvbnN0IG1ldGFQYXRoID0gZGlzdERpZmZ1c2VNYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyOiAnMC4wLjAnLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJyonLFxuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1JHQkU6IG1ldGEudXNlckRhdGEuaXNSR0JFLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBmaWxlIGlzIHJlYWR5LCB0ZWxsIHRoZSBlZGl0b3IgdG8gcmVmcmVzaCB0aGUgZmlsZVxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIGlmIChkaXN0RGlmZnVzZU1hcFdpdGhFeHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3guZGlmZnVzZU1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIGJha2VSZWZsZWN0aW9uQ29udm9sdXRpb24oZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIGNvbnN0IGdlblBhdGggPSBhd2FpdCBmaW5kR2VuZXJhdGlvblBhdGgocGF0aCwgZW52TWFwVXVpZCwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXAgPSBqb2luKGdlblBhdGgsIGAke2Jhc2V9X3JlZmxlY3Rpb25gKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcFdpdGhFeHQgPSByZWZsZWN0aW9uTWFwICsgJy5wbmcnO1xuICAgICAgICBpZiAoZXhpc3RzU3luYyhyZWZsZWN0aW9uTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hlbGwudHJhc2hJdGVtKHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhyZWZsZWN0aW9uTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlZmxlY3Rpb25NYXBDaGlsZDogQ2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcFBhcmFtcyA9IFtcbiAgICAgICAgICAgICAgICAnLS1zcmNGYWNlU2l6ZScsXG4gICAgICAgICAgICAgICAgJzE1MzYnLFxuICAgICAgICAgICAgICAgICctLWJ5cGFzc291dHB1dHR5cGUnLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAgICAgJy0taW5wdXQnLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcCxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgcmVmbGVjdGlvbk1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0LmV4ZScpLCByZWZsZWN0aW9uTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwQ2hpbGQub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy/miYvliqjng5jnhJnpnIDopoHmuIXpmaTlr7zlhaXlmajkv53lrZjnmoTljbfnp6/lm77nvJPlrZjvvIzpgb/lhY3liqDovb3kuIrmrKHnmoTng5jnhJnnu5PmnpxcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlUGF0aCA9IGpvaW4oZGlybmFtZShnZW5QYXRoKSwgYCR7YmFzZX1fcmVmbGVjdGlvbl9jb252b2x1dGlvbmApO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2OyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtaXBtYXBQYXRoID0gam9pbihjYWNoZVBhdGgsICdtaXBtYXBfJyArIGkudG9TdHJpbmcoKSArICcucG5nJyk7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWlwbWFwUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlU3luYyhtaXBtYXBQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRleHR1cmUgbXVzdCBiZSBjdWJlIHR5cGVcbiAgICAgICAgICAgIGNvbnN0IG1ldGFQYXRoID0gcmVmbGVjdGlvbk1hcFdpdGhFeHQgKyAnLm1ldGEnO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAgICAgbWV0YS51c2VyRGF0YS50eXBlID0gJ3RleHR1cmUgY3ViZSc7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICB2ZXI6ICcwLjAuMCcsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVyOiAnKicsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dHVyZSBjdWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUkdCRTogbWV0YS51c2VyRGF0YS5pc1JHQkUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGZpbGUgaXMgcmVhZHksIHRlbGwgdGhlIGVkaXRvciB0byByZWZyZXNoIHRoZSBmaWxlXG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuXG4gICAgICAgICAgICAvLyDpnIDopoHkv67mlLnliLDlrZDotYTmupAgZXJwLXRleHR1cmUtY3ViZSDnmoQgdXNlckRhdGEubWlwQmFrZU1vZGVcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChtZXRhLnN1Yk1ldGFzPy5iNDdjMCkge1xuICAgICAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhLm1pcEJha2VNb2RlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVmbGVjdGlvbk1hcFdpdGhFeHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5yZWZsZWN0aW9uTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicm9hZGNhc3RTY2VuZUNoYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2V0UmVmbGVjdGlvbkNvbnZvbHV0aW9uTWFwKGVudk1hcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIGVudk1hcFV1aWQucmVwbGFjZSgvQFteQF0rJC8sICcnKSk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgY29uc3QgZ2VuUGF0aCA9IGF3YWl0IGZpbmRHZW5lcmF0aW9uUGF0aChwYXRoLCBlbnZNYXBVdWlkLCBmYWxzZSk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXAgPSBqb2luKGdlblBhdGgsIGAke2Jhc2V9X3JlZmxlY3Rpb25gKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcFdpdGhFeHQgPSByZWZsZWN0aW9uTWFwICsgJy5wbmcnO1xuXG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldCBjYW4ndCBiZSBsb2FkOiR7dXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5yZWZsZWN0aW9uTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGJyb2FkY2FzdFNjZW5lQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCkge1xuICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2V0U2t5Ym94RW52TWFwKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KHV1aWQsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC51cGRhdGVFbnZNYXAoYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC51cGRhdGVFbnZNYXAobnVsbCk7XG4gICAgICAgICAgICBicm9hZGNhc3RTY2VuZUNoYW5nZSgpO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdFNjZW5lQ2hhbmdlKCkge1xuICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNoYW5nZS1ub2RlJywgc2NlbmUudXVpZCk7XG4gICAgY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5yZWNvcmROb2RlKHNjZW5lKTtcbiAgICBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyLnNuYXBzaG90KCk7XG4gICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmaW5kR2VuZXJhdGlvblBhdGgocGF0aDogc3RyaW5nLCB1dWlkOiBzdHJpbmcsIGlzU2F2aW5nOiBib29sZWFuKSB7XG4gICAgLy9pbnRlcm5hbCByZXNvdXJjZSBuZWVkIHRvIGJlIHNhdmVkIHRvIHRoZSBwcm9qZWN0IGRpcmVjdG9yeVxuICAgIGxldCBlbnZNYXBQYXRoOiBzdHJpbmcgfCBudWxsID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXJsJywgdXVpZCk7XG4gICAgaWYgKGVudk1hcFBhdGggJiYgZW52TWFwUGF0aC5pbmNsdWRlcyhgZGI6Ly9pbnRlcm5hbGApKSB7XG4gICAgICAgIGVudk1hcFBhdGggPSBkaXJuYW1lKGVudk1hcFBhdGgpO1xuICAgICAgICBlbnZNYXBQYXRoID0gZW52TWFwUGF0aC5yZXBsYWNlKGBkYjovL2ludGVybmFsL2AsIGAke0VkaXRvci5Qcm9qZWN0LnBhdGh9L2Fzc2V0cy9pbnRlcm5hbC9gKTtcbiAgICAgICAgZW52TWFwUGF0aCA9IGVudk1hcFBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICBpZiAoaXNTYXZpbmcpIGVuc3VyZURpclN5bmMoZW52TWFwUGF0aCk7XG4gICAgICAgIHBhdGggPSBlbnZNYXBQYXRoO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcGF0aCA9IGRpcm5hbWUocGF0aCk7XG4gICAgfVxuICAgIHJldHVybiBwYXRoO1xufVxuXG4iXX0=