'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const cc_1 = require("cc");
// 模块加载的时候触发的函数
function load() { }
exports.load = load;
// 模块卸载的时候触发的函数
function unload() { }
exports.unload = unload;
// 模块内定义的方法
exports.methods = {
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
};
function broadcastSceneChange() {
    const scene = cc.director.getScene();
    Editor.Message.broadcast('scene:change-node', scene.uuid);
    cce.SceneFacadeManager.recordNode(scene);
    cce.SceneFacadeManager.snapshot();
    cce.Engine.repaintInEditMode();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsaURBQW9EO0FBQ3BELCtCQUF3RDtBQUN4RCx1Q0FBcUg7QUFDckgsMkJBQTBCO0FBSzFCLGVBQWU7QUFDZixTQUFnQixJQUFJLEtBQUssQ0FBQztBQUExQixvQkFBMEI7QUFDMUIsZUFBZTtBQUNmLFNBQWdCLE1BQU0sS0FBSyxDQUFDO0FBQTVCLHdCQUE0QjtBQUU1QixXQUFXO0FBQ0UsUUFBQSxPQUFPLEdBQUc7SUFDbkIsdUJBQXVCLENBQUMsSUFBWTtRQUNoQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE1BQU0sSUFBSSxHQUFHO1lBQ1QsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDakYsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdkcsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDeEUsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxxQkFBcUIs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LENBQUM7QUFDbkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgc2hlbGwgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgeyBzcGF3biwgQ2hpbGRQcm9jZXNzIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lLCBiYXNlbmFtZSwgZXh0bmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgb3V0cHV0SlNPTlN5bmMsIHJlbW92ZSwgZXhpc3RzU3luYywgcmVhZEpTT05TeW5jLCBlbnN1cmVEaXJTeW5jLCByZWFkRmlsZVN5bmMsIHJlbW92ZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBWZWM0IH0gZnJvbSAnY2MnO1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5kZWNsYXJlIGNvbnN0IGNjZTogYW55O1xuXG4vLyDmqKHlnZfliqDovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkgeyB9XG4vLyDmqKHlnZfljbjovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7IH1cblxuLy8g5qih5Z2X5YaF5a6a5LmJ55qE5pa55rOVXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBxdWVyeU5vZGVXb3JsZFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IGNjZS5Ob2RlLnF1ZXJ5KHV1aWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgd29ybGRQb3NpdGlvbjogW25vZGUud29ybGRQb3NpdGlvbi54LCBub2RlLndvcmxkUG9zaXRpb24ueSwgbm9kZS53b3JsZFBvc2l0aW9uLnpdLFxuICAgICAgICAgICAgd29ybGRSb3RhdGlvbjogW25vZGUud29ybGRSb3RhdGlvbi54LCBub2RlLndvcmxkUm90YXRpb24ueSwgbm9kZS53b3JsZFJvdGF0aW9uLnosIG5vZGUud29ybGRSb3RhdGlvbi53XSxcbiAgICAgICAgICAgIHdvcmxkU2NhbGU6IFtub2RlLndvcmxkU2NhbGUueCwgbm9kZS53b3JsZFNjYWxlLnksIG5vZGUud29ybGRTY2FsZS56XSxcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgc2V0Tm9kZVdvcmxkVHJhbnNmb3JtKHV1aWQ6IHN0cmluZywgZGF0YTogYW55KSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjY2UuTm9kZS5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuc2V0V29ybGRQb3NpdGlvbiguLi5kYXRhLndvcmxkUG9zaXRpb24pO1xuICAgICAgICBub2RlLnNldFdvcmxkUm90YXRpb24oLi4uZGF0YS53b3JsZFJvdGF0aW9uKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFNjYWxlKC4uLmRhdGEud29ybGRTY2FsZSk7XG4gICAgfSxcblxuICAgIC8vIGVkaXQgc2NlbmUgbm9kZVxuICAgIGFzeW5jIGdlbmVyYXRlVmVjdG9yKGVudk1hcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIGVudk1hcFV1aWQucmVwbGFjZSgvQFteQF0rJC8sICcnKSk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgLy8gLS0tLSBWZWN0b3IgLS0tLVxuICAgICAgICBjb25zdCBkaXN0VmVjdG9yID0gam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsICdpbnNwZWN0b3InLCBgJHtiYXNlfV9kaWZmdXNpb25gKTtcbiAgICAgICAgY29uc3QgZGlzdFZlY3RvcldpdGhFeHQgPSBkaXN0VmVjdG9yICsgJy50eHQnO1xuXG4gICAgICAgIGlmIChleGlzdHNTeW5jKGRpc3RWZWN0b3JXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0oZGlzdFZlY3RvcldpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJldHJ5XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGRpc3RWZWN0b3JXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZW1vdmUoZGlzdFZlY3RvcldpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgdmVjdG9yQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIGNvbnN0IHZlY3RvclBhcmFtcyA9IFtcbiAgICAgICAgICAgICAgICAnLS1oZW1pc3BoZXJlbGlnaHRpbmdjb2VmJyxcbiAgICAgICAgICAgICAgICAnLS1maWx0ZXInLFxuICAgICAgICAgICAgICAgICdpcnJhZGlhbmNlJyxcbiAgICAgICAgICAgICAgICAnLS1kc3RGYWNlU2l6ZScsXG4gICAgICAgICAgICAgICAgJzMyJyxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgICAgICctLWlucHV0JyxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgICAgIGRpc3RWZWN0b3IsXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGEuaXNSR0JFICYmIGV4dCAhPT0gJy5oZHInKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShkaXN0VmVjdG9yKSk7XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgdmVjdG9yUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgdmVjdG9yUGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCB2ZWN0b3JzOiBzdHJpbmdbXSA9IFsnJywgJyddO1xuXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JzID0gcmVhZEZpbGVTeW5jKGRpc3RWZWN0b3JXaXRoRXh0LCAndXRmOCcpLnNwbGl0KC9cXG4vKS5tYXAoaXRlbSA9PiBpdGVtLnRyaW0oKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChtZXRhLmltcG9ydGVyID09PSAndGV4dHVyZS1jdWJlJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oRWRpdG9yLkkxOG4udCgnaW5zcGVjdG9yLnNjZW5lLnJlY29tbWVuZEVycFRleHR1cmVDdWJlJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXZlY3RvcnNbMF0pIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JzWzBdID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXZlY3RvcnNbMV0pIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JzWzFdID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGV4YW1wbGU6IFsnMC4wMScsICcwLjAxJywgJzAuMDEnXVxuICAgICAgICAgICAgY29uc3QgdmVjdG9yMSA9IHZlY3RvcnNbMF0uc3BsaXQoJywnKS5tYXAoaXRlbSA9PiBwYXJzZUZsb2F0KGl0ZW0udHJpbSgpKSk7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3IyID0gdmVjdG9yc1sxXS5zcGxpdCgnLCcpLm1hcChpdGVtID0+IHBhcnNlRmxvYXQoaXRlbS50cmltKCkpKTtcblxuICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLmFtYmllbnQuc2t5Q29sb3IgPSBuZXcgVmVjNCh2ZWN0b3IxWzBdLCB2ZWN0b3IxWzFdLCB2ZWN0b3IxWzJdLCAwKTtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5hbWJpZW50Lmdyb3VuZEFsYmVkbyA9IG5ldyBWZWM0KHZlY3RvcjJbMF0sIHZlY3RvcjJbMV0sIHZlY3RvcjJbMl0sIDApO1xuXG4gICAgICAgICAgICBicm9hZGNhc3RTY2VuZUNoYW5nZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIGVkaXQgc2NlbmUgbm9kZVxuICAgIGFzeW5jIGdlbmVyYXRlRGlmZnVzZU1hcChlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgLy8gLS0tLSBEaWZmdXNlTWFwIC0tLS1cbiAgICAgICAgY29uc3QgZGlzdERpZmZ1c2VNYXAgPSBqb2luKGRpcm5hbWUocGF0aCksIGAke2Jhc2V9X2RpZmZ1c2lvbmApO1xuICAgICAgICBjb25zdCBkaXN0RGlmZnVzZU1hcFdpdGhFeHQgPSBkaXN0RGlmZnVzZU1hcCArICcucG5nJztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0RGlmZnVzZU1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoZWxsLnRyYXNoSXRlbShkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJldHJ5XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGRpc3REaWZmdXNlTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBkaWZmdXNlTWFwQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIGNvbnN0IGRpZmZ1c2VNYXBQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0tZmlsdGVyJyxcbiAgICAgICAgICAgICAgICAnaXJyYWRpYW5jZScsXG4gICAgICAgICAgICAgICAgJy0tZHN0RmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICczMicsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICBkaXN0RGlmZnVzZU1hcCxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgZGlmZnVzZU1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0LmV4ZScpLCBkaWZmdXNlTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwQ2hpbGQub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gVGV4dHVyZSBtdXN0IGJlIGN1YmUgdHlwZVxuICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSBkaXN0RGlmZnVzZU1hcFdpdGhFeHQgKyAnLm1ldGEnO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAgICAgbWV0YS51c2VyRGF0YS50eXBlID0gJ3RleHR1cmUgY3ViZSc7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICB2ZXI6ICcwLjAuMCcsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVyOiAnKicsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dHVyZSBjdWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUkdCRTogbWV0YS51c2VyRGF0YS5pc1JHQkUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGZpbGUgaXMgcmVhZHksIHRlbGwgdGhlIGVkaXRvciB0byByZWZyZXNoIHRoZSBmaWxlXG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgaWYgKGRpc3REaWZmdXNlTWFwV2l0aEV4dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5kaWZmdXNlTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicm9hZGNhc3RTY2VuZUNoYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgYmFrZVJlZmxlY3Rpb25Db252b2x1dGlvbihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcCA9IGpvaW4oZGlybmFtZShwYXRoKSwgYCR7YmFzZX1fcmVmbGVjdGlvbmApO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwV2l0aEV4dCA9IHJlZmxlY3Rpb25NYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoZWxsLnRyYXNoSXRlbShyZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikgeyB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmV0cnlcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlbW92ZShyZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCByZWZsZWN0aW9uTWFwQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXBQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0tc3JjRmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICcxNTM2JyxcbiAgICAgICAgICAgICAgICAnLS1ieXBhc3NvdXRwdXR0eXBlJyxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgICAgICctLWlucHV0JyxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXAsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YS5pc1JHQkUgJiYgZXh0ICE9PSAnLmhkcicpIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHJlZmxlY3Rpb25NYXBQYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgcmVmbGVjdGlvbk1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcENoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8v5omL5Yqo54OY54SZ6ZyA6KaB5riF6Zmk5a+85YWl5Zmo5L+d5a2Y55qE5Y2356ev5Zu+57yT5a2Y77yM6YG/5YWN5Yqg6L295LiK5qyh55qE54OY54SZ57uT5p6cXG4gICAgICAgICAgICBjb25zdCBjYWNoZVBhdGggPSBqb2luKGRpcm5hbWUocGF0aCksIGAke2Jhc2V9X3JlZmxlY3Rpb25fY29udm9sdXRpb25gKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWlwbWFwUGF0aCA9IGpvaW4oY2FjaGVQYXRoLCAnbWlwbWFwXycgKyBpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuICAgICAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1pcG1hcFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVN5bmMobWlwbWFwUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUZXh0dXJlIG11c3QgYmUgY3ViZSB0eXBlXG4gICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IHJlZmxlY3Rpb25NYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyOiAnMC4wLjAnLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJyonLFxuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1JHQkU6IG1ldGEudXNlckRhdGEuaXNSR0JFLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBmaWxlIGlzIHJlYWR5LCB0ZWxsIHRoZSBlZGl0b3IgdG8gcmVmcmVzaCB0aGUgZmlsZVxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgLy8g6ZyA6KaB5L+u5pS55Yiw5a2Q6LWE5rqQIGVycC10ZXh0dXJlLWN1YmUg55qEIHVzZXJEYXRhLm1pcEJha2VNb2RlXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAobWV0YS5zdWJNZXRhcz8uYjQ3YzApIHtcbiAgICAgICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMC51c2VyRGF0YS5taXBCYWtlTW9kZSA9IDI7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcblxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHNldFJlZmxlY3Rpb25Db252b2x1dGlvbk1hcChlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXAgPSBqb2luKGRpcm5hbWUocGF0aCksIGAke2Jhc2V9X3JlZmxlY3Rpb25gKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcFdpdGhFeHQgPSByZWZsZWN0aW9uTWFwICsgJy5wbmcnO1xuXG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldCBjYW4ndCBiZSBsb2FkOiR7dXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5yZWZsZWN0aW9uTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGJyb2FkY2FzdFNjZW5lQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCkge1xuICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgYnJvYWRjYXN0U2NlbmVDaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5mdW5jdGlvbiBicm9hZGNhc3RTY2VuZUNoYW5nZSgpe1xuICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNoYW5nZS1ub2RlJywgc2NlbmUudXVpZCk7XG4gICAgY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5yZWNvcmROb2RlKHNjZW5lKTtcbiAgICBjY2UuU2NlbmVGYWNhZGVNYW5hZ2VyLnNuYXBzaG90KCk7XG4gICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xufVxuIl19