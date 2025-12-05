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
            Editor.Message.broadcast('scene:change-node', cc.director._scene.uuid);
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
                        Editor.Message.broadcast('scene:change-node', cc.director._scene.uuid);
                    }
                    cce.Engine.repaintInEditMode();
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
                        Editor.Message.broadcast('scene:change-node', cc.director._scene.uuid);
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
                    Editor.Message.broadcast('scene:change-node', cc.director._scene.uuid);
                }
            }
        }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsaURBQW9EO0FBQ3BELCtCQUF3RDtBQUN4RCx1Q0FBeUc7QUFDekcsMkJBQTBCO0FBSzFCLGVBQWU7QUFDZixTQUFnQixJQUFJLEtBQUssQ0FBQztBQUExQixvQkFBMEI7QUFDMUIsZUFBZTtBQUNmLFNBQWdCLE1BQU0sS0FBSyxDQUFDO0FBQTVCLHdCQUE0QjtBQUU1QixXQUFXO0FBQ0UsUUFBQSxPQUFPLEdBQUc7SUFDbkIsdUJBQXVCLENBQUMsSUFBWTtRQUNoQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE1BQU0sSUFBSSxHQUFHO1lBQ1QsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDakYsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdkcsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDeEUsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxxQkFBcUIsQ0FBQyxJQUFZLEVBQUUsSUFBUztRQUN6QyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTztTQUNWO1FBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxVQUFrQjtRQUNuQyxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTztTQUNWO1FBRUQsTUFBTSxJQUFJLEdBQVEsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0YsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3JFLE1BQU0sR0FBRyxHQUFHLGNBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixNQUFNLElBQUksR0FBRyxlQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWpDLG1CQUFtQjtRQUNuQixNQUFNLFVBQVUsR0FBRyxXQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxZQUFZLENBQUMsQ0FBQztRQUNqRixNQUFNLGlCQUFpQixHQUFHLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFFOUMsSUFBSSxxQkFBVSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7WUFDL0IsSUFBSTtnQkFDQSxNQUFNLGdCQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDNUM7WUFBQyxPQUFPLEtBQUssRUFBRSxHQUFHO1NBQ3RCO1FBQ0QsUUFBUTtRQUNSLElBQUkscUJBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO1lBQy9CLElBQUk7Z0JBQ0EsTUFBTSxpQkFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDbkM7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3hCO1NBQ0o7UUFFRCxJQUFJO1lBQ0EsSUFBSSxXQUF5QixDQUFDO1lBQzlCLE1BQU0sWUFBWSxHQUFHO2dCQUNqQiwwQkFBMEI7Z0JBQzFCLFVBQVU7Z0JBQ1YsWUFBWTtnQkFDWixlQUFlO2dCQUNmLElBQUk7Z0JBQ0osaUJBQWlCO2dCQUNqQixNQUFNLEdBQUcsa0JBQWtCLEdBQUcsVUFBVTtnQkFDeEMsU0FBUztnQkFDVCxJQUFJO2dCQUNKLFdBQVc7Z0JBQ1gsVUFBVTthQUNiLENBQUM7WUFDRixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLEVBQUU7Z0JBQ3hDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN2QztZQUVELHdCQUFhLENBQUMsY0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFbkMsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDL0IsV0FBVyxHQUFHLHFCQUFLLENBQUMsV0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLDZCQUE2QixDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDM0Y7aUJBQU07Z0JBQ0gsV0FBVyxHQUFHLHFCQUFLLENBQUMsV0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDL0Y7WUFFRCxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNsQyxXQUFXLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxPQUFPLEdBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFakMsSUFBSSxxQkFBVSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sR0FBRyx1QkFBWSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQzthQUMxRjtpQkFBTTtnQkFDSCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssY0FBYyxFQUFFO29CQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztvQkFDdkUsT0FBTztpQkFDVjthQUNKO1lBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDYixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ25CO1lBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDYixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ25CO1lBRUQsb0NBQW9DO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLFNBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRixFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxJQUFJLFNBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVuRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxRTtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QjtJQUNMLENBQUM7SUFDRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFVBQWtCO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZHLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsTUFBTSxJQUFJLEdBQVEsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0YsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3JFLE1BQU0sR0FBRyxHQUFHLGNBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixNQUFNLElBQUksR0FBRyxlQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWpDLHVCQUF1QjtRQUN2QixNQUFNLGNBQWMsR0FBRyxXQUFJLENBQUMsY0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxZQUFZLENBQUMsQ0FBQztRQUNoRSxNQUFNLHFCQUFxQixHQUFHLGNBQWMsR0FBRyxNQUFNLENBQUM7UUFFdEQsSUFBSSxxQkFBVSxDQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDbkMsSUFBSTtnQkFDQSxNQUFNLGdCQUFLLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLENBQUM7YUFDaEQ7WUFBQyxPQUFPLEtBQUssRUFBRSxHQUFHO1NBQ3RCO1FBQ0QsUUFBUTtRQUNSLElBQUkscUJBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFO1lBQ25DLElBQUk7Z0JBQ0EsTUFBTSxpQkFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7YUFDdkM7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3hCO1NBQ0o7UUFFRCxJQUFJO1lBQ0EsSUFBSSxlQUE2QixDQUFDO1lBQ2xDLE1BQU0sZ0JBQWdCLEdBQUc7Z0JBQ3JCLFVBQVU7Z0JBQ1YsWUFBWTtnQkFDWixlQUFlO2dCQUNmLElBQUk7Z0JBQ0osaUJBQWlCO2dCQUNqQixNQUFNLEdBQUcsa0JBQWtCLEdBQUcsVUFBVTtnQkFDeEMsU0FBUztnQkFDVCxJQUFJO2dCQUNKLFdBQVc7Z0JBQ1gsY0FBYzthQUNqQixDQUFDO1lBRUYsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFO2dCQUN4QyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUMzQztZQUVELElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQy9CLGVBQWUsR0FBRyxxQkFBSyxDQUFDLFdBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSw2QkFBNkIsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7YUFDbkc7aUJBQU07Z0JBQ0gsZUFBZSxHQUFHLHFCQUFLLENBQUMsV0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQzthQUN2RztZQUNELE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ2xDLGVBQWUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDN0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7WUFFSCw0QkFBNEI7WUFDNUIsTUFBTSxRQUFRLEdBQUcscUJBQXFCLEdBQUcsT0FBTyxDQUFDO1lBQ2pELElBQUkscUJBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDdEIsTUFBTSxJQUFJLEdBQUcsdUJBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDO2dCQUNwQyx5QkFBYyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNqRDtpQkFBTTtnQkFDSCx5QkFBYyxDQUFDLFFBQVEsRUFBRTtvQkFDckIsR0FBRyxFQUFFLE9BQU87b0JBQ1osUUFBUSxFQUFFLEdBQUc7b0JBQ2IsUUFBUSxFQUFFO3dCQUNOLElBQUksRUFBRSxjQUFjO3dCQUNwQixNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNO3FCQUMvQjtpQkFDSixFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDckI7WUFFRCw4REFBOEQ7WUFDOUQsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsZUFBZSxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFFakYsSUFBSSxxQkFBcUIsRUFBRTtnQkFDdkIsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLHFCQUFxQixDQUFDLENBQUM7Z0JBRTNGLElBQUksSUFBSSxFQUFFO29CQUNOLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDeEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDLEtBQVUsRUFBRSxLQUFVLEVBQUUsRUFBRTs0QkFDaEUsSUFBSSxLQUFLLEVBQUU7Z0NBQ1AsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDN0MsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDOzZCQUNqQjtpQ0FBTTtnQ0FDSCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7NkJBQ2xCO3dCQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUMsQ0FBQyxDQUFDO29CQUVILElBQUksS0FBSyxFQUFFO3dCQUNQLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQzt3QkFDdEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzFFO29CQUNELEdBQUcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztpQkFDbEM7YUFFSjtTQUNKO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hCO0lBQ0wsQ0FBQztJQUNELEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxVQUFrQjtRQUM5QyxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE1BQU0sSUFBSSxHQUFRLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNGLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNyRSxNQUFNLEdBQUcsR0FBRyxjQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxJQUFJLEdBQUcsZUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUVqQyxNQUFNLGFBQWEsR0FBRyxXQUFJLENBQUMsY0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxhQUFhLENBQUMsQ0FBQztRQUNoRSxNQUFNLG9CQUFvQixHQUFHLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFFcEQsSUFBSSxxQkFBVSxDQUFDLG9CQUFvQixDQUFDLEVBQUU7WUFDbEMsSUFBSTtnQkFDQSxNQUFNLGdCQUFLLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDL0M7WUFBQyxPQUFPLEtBQUssRUFBRSxHQUFHO1NBQ3RCO1FBQ0QsUUFBUTtRQUNSLElBQUkscUJBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO1lBQ2xDLElBQUk7Z0JBQ0EsTUFBTSxpQkFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDdEM7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3hCO1NBQ0o7UUFFRCxJQUFJO1lBQ0EsSUFBSSxrQkFBZ0MsQ0FBQztZQUNyQyxNQUFNLG1CQUFtQixHQUFHO2dCQUN4QixlQUFlO2dCQUNmLE1BQU07Z0JBQ04sb0JBQW9CO2dCQUNwQixpQkFBaUI7Z0JBQ2pCLE1BQU0sR0FBRyxrQkFBa0IsR0FBRyxVQUFVO2dCQUN4QyxTQUFTO2dCQUNULElBQUk7Z0JBQ0osV0FBVztnQkFDWCxhQUFhO2FBQ2hCLENBQUM7WUFFRixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLEVBQUU7Z0JBQ3hDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzlDO1lBRUQsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDL0Isa0JBQWtCLEdBQUcscUJBQUssQ0FBQyxXQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO2FBQ3pHO2lCQUFNO2dCQUNILGtCQUFrQixHQUFHLHFCQUFLLENBQUMsV0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzthQUM3RztZQUNELE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ2xDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztZQUVILDRCQUE0QjtZQUM1QixNQUFNLFFBQVEsR0FBRyxvQkFBb0IsR0FBRyxPQUFPLENBQUM7WUFDaEQsSUFBSSxxQkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN0QixNQUFNLElBQUksR0FBRyx1QkFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUM7Z0JBQ3BDLHlCQUFjLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ2pEO2lCQUFNO2dCQUNILHlCQUFjLENBQUMsUUFBUSxFQUFFO29CQUNyQixHQUFHLEVBQUUsT0FBTztvQkFDWixRQUFRLEVBQUUsR0FBRztvQkFDYixRQUFRLEVBQUU7d0JBQ04sSUFBSSxFQUFFLGNBQWM7d0JBQ3BCLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU07cUJBQy9CO2lCQUNKLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNyQjtZQUVELDhEQUE4RDtZQUM5RCxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUVoRixtREFBbUQ7WUFDbkQsSUFBSSxxQkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN0QixNQUFNLElBQUksR0FBRyx1QkFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFO29CQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztvQkFDN0MseUJBQWMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBRTlDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2lCQUNuRjthQUNKO1lBRUQsSUFBSSxvQkFBb0IsRUFBRTtnQkFDdEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixDQUFDLENBQUM7Z0JBRTFGLElBQUksSUFBSSxFQUFFO29CQUNOLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDeEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDLEtBQVUsRUFBRSxLQUFVLEVBQUUsRUFBRTs0QkFDaEUsSUFBSSxLQUFLLEVBQUU7Z0NBQ1AsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDN0MsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDOzZCQUNqQjtpQ0FBTTtnQ0FDSCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7NkJBQ2xCO3dCQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUMsQ0FBQyxDQUFDO29CQUVILElBQUksS0FBSyxFQUFFO3dCQUNQLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQzt3QkFDekQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzFFO2lCQUNKO2FBRUo7U0FDSjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QjtJQUNMLENBQUM7SUFDRCxLQUFLLENBQUMsMkJBQTJCLENBQUMsVUFBa0I7UUFDaEQsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkcsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNQLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxNQUFNLEdBQUcsR0FBRyxjQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxJQUFJLEdBQUcsZUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUVqQyxNQUFNLGFBQWEsR0FBRyxXQUFJLENBQUMsY0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxhQUFhLENBQUMsQ0FBQztRQUNoRSxNQUFNLG9CQUFvQixHQUFHLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFFcEQsSUFBSSxxQkFBVSxDQUFDLG9CQUFvQixDQUFDLEVBQUU7WUFDbEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFMUYsSUFBSSxJQUFJLEVBQUU7Z0JBQ04sTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO29CQUN4QyxFQUFFLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUMsS0FBVSxFQUFFLEtBQVUsRUFBRSxFQUFFO3dCQUNoRSxJQUFJLEtBQUssRUFBRTs0QkFDUCxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUM3QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ2pCOzZCQUFNOzRCQUNILE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzt5QkFDbEI7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxLQUFLLEVBQUU7b0JBQ1AsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO29CQUN6RCxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDMUU7YUFDSjtTQUVKO0lBQ0wsQ0FBQztDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IHNoZWxsIH0gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHsgc3Bhd24sIENoaWxkUHJvY2VzcyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgam9pbiwgZGlybmFtZSwgYmFzZW5hbWUsIGV4dG5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IG91dHB1dEpTT05TeW5jLCByZW1vdmUsIGV4aXN0c1N5bmMsIHJlYWRKU09OU3luYywgZW5zdXJlRGlyU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgVmVjNCB9IGZyb20gJ2NjJztcblxuZGVjbGFyZSBjb25zdCBjYzogYW55O1xuZGVjbGFyZSBjb25zdCBjY2U6IGFueTtcblxuLy8g5qih5Z2X5Yqg6L2955qE5pe25YCZ6Kem5Y+R55qE5Ye95pWwXG5leHBvcnQgZnVuY3Rpb24gbG9hZCgpIHsgfVxuLy8g5qih5Z2X5Y246L2955qE5pe25YCZ6Kem5Y+R55qE5Ye95pWwXG5leHBvcnQgZnVuY3Rpb24gdW5sb2FkKCkgeyB9XG5cbi8vIOaooeWdl+WGheWumuS5ieeahOaWueazlVxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgcXVlcnlOb2RlV29ybGRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjY2UuTm9kZS5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIHdvcmxkUG9zaXRpb246IFtub2RlLndvcmxkUG9zaXRpb24ueCwgbm9kZS53b3JsZFBvc2l0aW9uLnksIG5vZGUud29ybGRQb3NpdGlvbi56XSxcbiAgICAgICAgICAgIHdvcmxkUm90YXRpb246IFtub2RlLndvcmxkUm90YXRpb24ueCwgbm9kZS53b3JsZFJvdGF0aW9uLnksIG5vZGUud29ybGRSb3RhdGlvbi56LCBub2RlLndvcmxkUm90YXRpb24ud10sXG4gICAgICAgICAgICB3b3JsZFNjYWxlOiBbbm9kZS53b3JsZFNjYWxlLngsIG5vZGUud29ybGRTY2FsZS55LCBub2RlLndvcmxkU2NhbGUuel0sXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHNldE5vZGVXb3JsZFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgICAgICBjb25zdCBub2RlID0gY2NlLk5vZGUucXVlcnkodXVpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldFdvcmxkUG9zaXRpb24oLi4uZGF0YS53b3JsZFBvc2l0aW9uKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFJvdGF0aW9uKC4uLmRhdGEud29ybGRSb3RhdGlvbik7XG4gICAgICAgIG5vZGUuc2V0V29ybGRTY2FsZSguLi5kYXRhLndvcmxkU2NhbGUpO1xuICAgIH0sXG5cbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZVZlY3RvcihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gVmVjdG9yIC0tLS1cbiAgICAgICAgY29uc3QgZGlzdFZlY3RvciA9IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnaW5zcGVjdG9yJywgYCR7YmFzZX1fZGlmZnVzaW9uYCk7XG4gICAgICAgIGNvbnN0IGRpc3RWZWN0b3JXaXRoRXh0ID0gZGlzdFZlY3RvciArICcudHh0JztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hlbGwudHJhc2hJdGVtKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHZlY3RvckNoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3JQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0taGVtaXNwaGVyZWxpZ2h0aW5nY29lZicsXG4gICAgICAgICAgICAgICAgJy0tZmlsdGVyJyxcbiAgICAgICAgICAgICAgICAnaXJyYWRpYW5jZScsXG4gICAgICAgICAgICAgICAgJy0tZHN0RmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICczMicsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICBkaXN0VmVjdG9yLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIHZlY3RvclBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoZGlzdFZlY3RvcikpO1xuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgdmVjdG9yczogc3RyaW5nW10gPSBbJycsICcnXTtcblxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdFZlY3RvcldpdGhFeHQpKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9ycyA9IHJlYWRGaWxlU3luYyhkaXN0VmVjdG9yV2l0aEV4dCwgJ3V0ZjgnKS5zcGxpdCgvXFxuLykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobWV0YS5pbXBvcnRlciA9PT0gJ3RleHR1cmUtY3ViZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2luc3BlY3Rvci5zY2VuZS5yZWNvbW1lbmRFcnBUZXh0dXJlQ3ViZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzBdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1swXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzFdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1sxXSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBleGFtcGxlOiBbJzAuMDEnLCAnMC4wMScsICcwLjAxJ11cbiAgICAgICAgICAgIGNvbnN0IHZlY3RvcjEgPSB2ZWN0b3JzWzBdLnNwbGl0KCcsJykubWFwKGl0ZW0gPT4gcGFyc2VGbG9hdChpdGVtLnRyaW0oKSkpO1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yMiA9IHZlY3RvcnNbMV0uc3BsaXQoJywnKS5tYXAoaXRlbSA9PiBwYXJzZUZsb2F0KGl0ZW0udHJpbSgpKSk7XG5cbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5hbWJpZW50LnNreUNvbG9yID0gbmV3IFZlYzQodmVjdG9yMVswXSwgdmVjdG9yMVsxXSwgdmVjdG9yMVsyXSwgMCk7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuYW1iaWVudC5ncm91bmRBbGJlZG8gPSBuZXcgVmVjNCh2ZWN0b3IyWzBdLCB2ZWN0b3IyWzFdLCB2ZWN0b3IyWzJdLCAwKTtcblxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIGNjLmRpcmVjdG9yLl9zY2VuZS51dWlkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZURpZmZ1c2VNYXAoZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gRGlmZnVzZU1hcCAtLS0tXG4gICAgICAgIGNvbnN0IGRpc3REaWZmdXNlTWFwID0gam9pbihkaXJuYW1lKHBhdGgpLCBgJHtiYXNlfV9kaWZmdXNpb25gKTtcbiAgICAgICAgY29uc3QgZGlzdERpZmZ1c2VNYXBXaXRoRXh0ID0gZGlzdERpZmZ1c2VNYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0oZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0RGlmZnVzZU1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlbW92ZShkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgZGlmZnVzZU1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCBkaWZmdXNlTWFwUGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICctLWZpbHRlcicsXG4gICAgICAgICAgICAgICAgJ2lycmFkaWFuY2UnLFxuICAgICAgICAgICAgICAgICctLWRzdEZhY2VTaXplJyxcbiAgICAgICAgICAgICAgICAnMzInLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAgICAgJy0taW5wdXQnLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICAgICAgZGlzdERpZmZ1c2VNYXAsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YS5pc1JHQkUgJiYgZXh0ICE9PSAnLmhkcicpIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIGRpZmZ1c2VNYXBQYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgZGlmZnVzZU1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcENoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFRleHR1cmUgbXVzdCBiZSBjdWJlIHR5cGVcbiAgICAgICAgICAgIGNvbnN0IG1ldGFQYXRoID0gZGlzdERpZmZ1c2VNYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyOiAnMC4wLjAnLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJyonLFxuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1JHQkU6IG1ldGEudXNlckRhdGEuaXNSR0JFLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBmaWxlIGlzIHJlYWR5LCB0ZWxsIHRoZSBlZGl0b3IgdG8gcmVmcmVzaCB0aGUgZmlsZVxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIGlmIChkaXN0RGlmZnVzZU1hcFdpdGhFeHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3guZGlmZnVzZU1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIGNjLmRpcmVjdG9yLl9zY2VuZS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgYmFrZVJlZmxlY3Rpb25Db252b2x1dGlvbihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcCA9IGpvaW4oZGlybmFtZShwYXRoKSwgYCR7YmFzZX1fcmVmbGVjdGlvbmApO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwV2l0aEV4dCA9IHJlZmxlY3Rpb25NYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoZWxsLnRyYXNoSXRlbShyZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikgeyB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmV0cnlcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlbW92ZShyZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCByZWZsZWN0aW9uTWFwQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXBQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0tc3JjRmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICcxNTM2JyxcbiAgICAgICAgICAgICAgICAnLS1ieXBhc3NvdXRwdXR0eXBlJyxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgICAgICctLWlucHV0JyxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXAsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YS5pc1JHQkUgJiYgZXh0ICE9PSAnLmhkcicpIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHJlZmxlY3Rpb25NYXBQYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgcmVmbGVjdGlvbk1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcENoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFRleHR1cmUgbXVzdCBiZSBjdWJlIHR5cGVcbiAgICAgICAgICAgIGNvbnN0IG1ldGFQYXRoID0gcmVmbGVjdGlvbk1hcFdpdGhFeHQgKyAnLm1ldGEnO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAgICAgbWV0YS51c2VyRGF0YS50eXBlID0gJ3RleHR1cmUgY3ViZSc7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICB2ZXI6ICcwLjAuMCcsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVyOiAnKicsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dHVyZSBjdWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUkdCRTogbWV0YS51c2VyRGF0YS5pc1JHQkUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGZpbGUgaXMgcmVhZHksIHRlbGwgdGhlIGVkaXRvciB0byByZWZyZXNoIHRoZSBmaWxlXG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuXG4gICAgICAgICAgICAvLyDpnIDopoHkv67mlLnliLDlrZDotYTmupAgZXJwLXRleHR1cmUtY3ViZSDnmoQgdXNlckRhdGEubWlwQmFrZU1vZGVcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChtZXRhLnN1Yk1ldGFzPy5iNDdjMCkge1xuICAgICAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhLm1pcEJha2VNb2RlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVmbGVjdGlvbk1hcFdpdGhFeHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5yZWZsZWN0aW9uTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNoYW5nZS1ub2RlJywgY2MuZGlyZWN0b3IuX3NjZW5lLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2V0UmVmbGVjdGlvbkNvbnZvbHV0aW9uTWFwKGVudk1hcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIGVudk1hcFV1aWQucmVwbGFjZSgvQFteQF0rJC8sICcnKSk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcCA9IGpvaW4oZGlybmFtZShwYXRoKSwgYCR7YmFzZX1fcmVmbGVjdGlvbmApO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwV2l0aEV4dCA9IHJlZmxlY3Rpb25NYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuc2t5Ym94LnJlZmxlY3Rpb25NYXAgPSBhc3NldDtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIGNjLmRpcmVjdG9yLl9zY2VuZS51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH0sXG59O1xuIl19