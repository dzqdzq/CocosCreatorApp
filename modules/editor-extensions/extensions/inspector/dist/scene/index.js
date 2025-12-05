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
                vectorParams.splice(0, 0, '--rgbm ');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsaURBQW9EO0FBQ3BELCtCQUF3RDtBQUN4RCx1Q0FBeUc7QUFDekcsMkJBQTBCO0FBSzFCLGVBQWU7QUFDZixTQUFnQixJQUFJLEtBQUksQ0FBQztBQUF6QixvQkFBeUI7QUFDekIsZUFBZTtBQUNmLFNBQWdCLE1BQU0sS0FBSSxDQUFDO0FBQTNCLHdCQUEyQjtBQUUzQixXQUFXO0FBQ0UsUUFBQSxPQUFPLEdBQUc7SUFDbkIsdUJBQXVCLENBQUMsSUFBWTtRQUNoQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE1BQU0sSUFBSSxHQUFHO1lBQ1QsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDakYsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdkcsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDeEUsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxxQkFBcUIs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SUFBSSxFQUFFLENBQUMsQ0FBQzs0QkFDN0MsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUNqQjs2QkFBTTs0QkFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ2xCO29CQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksS0FBSyxFQUFFO29CQUNQLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztvQkFDekQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzFFO2FBQ0o7U0FFSjtJQUNMLENBQUM7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7IHNwYXduLCBDaGlsZFByb2Nlc3MgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGpvaW4sIGRpcm5hbWUsIGJhc2VuYW1lLCBleHRuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBvdXRwdXRKU09OU3luYywgcmVtb3ZlLCBleGlzdHNTeW5jLCByZWFkSlNPTlN5bmMsIGVuc3VyZURpclN5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IFZlYzQgfSBmcm9tICdjYyc7XG5cbmRlY2xhcmUgY29uc3QgY2M6IGFueTtcbmRlY2xhcmUgY29uc3QgY2NlOiBhbnk7XG5cbi8vIOaooeWdl+WKoOi9veeahOaXtuWAmeinpuWPkeeahOWHveaVsFxuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoKSB7fVxuLy8g5qih5Z2X5Y246L2955qE5pe25YCZ6Kem5Y+R55qE5Ye95pWwXG5leHBvcnQgZnVuY3Rpb24gdW5sb2FkKCkge31cblxuLy8g5qih5Z2X5YaF5a6a5LmJ55qE5pa55rOVXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBxdWVyeU5vZGVXb3JsZFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IGNjZS5Ob2RlLnF1ZXJ5KHV1aWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgd29ybGRQb3NpdGlvbjogW25vZGUud29ybGRQb3NpdGlvbi54LCBub2RlLndvcmxkUG9zaXRpb24ueSwgbm9kZS53b3JsZFBvc2l0aW9uLnpdLFxuICAgICAgICAgICAgd29ybGRSb3RhdGlvbjogW25vZGUud29ybGRSb3RhdGlvbi54LCBub2RlLndvcmxkUm90YXRpb24ueSwgbm9kZS53b3JsZFJvdGF0aW9uLnosIG5vZGUud29ybGRSb3RhdGlvbi53XSxcbiAgICAgICAgICAgIHdvcmxkU2NhbGU6IFtub2RlLndvcmxkU2NhbGUueCwgbm9kZS53b3JsZFNjYWxlLnksIG5vZGUud29ybGRTY2FsZS56XSxcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgc2V0Tm9kZVdvcmxkVHJhbnNmb3JtKHV1aWQ6IHN0cmluZywgZGF0YTogYW55KSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjY2UuTm9kZS5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuc2V0V29ybGRQb3NpdGlvbiguLi5kYXRhLndvcmxkUG9zaXRpb24pO1xuICAgICAgICBub2RlLnNldFdvcmxkUm90YXRpb24oLi4uZGF0YS53b3JsZFJvdGF0aW9uKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFNjYWxlKC4uLmRhdGEud29ybGRTY2FsZSk7XG4gICAgfSxcblxuICAgIC8vIGVkaXQgc2NlbmUgbm9kZVxuICAgIGFzeW5jIGdlbmVyYXRlVmVjdG9yKGVudk1hcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIGVudk1hcFV1aWQucmVwbGFjZSgvQFteQF0rJC8sICcnKSk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgLy8gLS0tLSBWZWN0b3IgLS0tLVxuICAgICAgICBjb25zdCBkaXN0VmVjdG9yID0gam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsICdpbnNwZWN0b3InLCBgJHtiYXNlfV9kaWZmdXNpb25gKTtcbiAgICAgICAgY29uc3QgZGlzdFZlY3RvcldpdGhFeHQgPSBkaXN0VmVjdG9yICsgJy50eHQnO1xuXG4gICAgICAgIGlmIChleGlzdHNTeW5jKGRpc3RWZWN0b3JXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0oZGlzdFZlY3RvcldpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHt9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmV0cnlcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdFZlY3RvcldpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlbW92ZShkaXN0VmVjdG9yV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCB2ZWN0b3JDaGlsZDogQ2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yUGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICctLWhlbWlzcGhlcmVsaWdodGluZ2NvZWYnLFxuICAgICAgICAgICAgICAgICctLWZpbHRlcicsXG4gICAgICAgICAgICAgICAgJ2lycmFkaWFuY2UnLFxuICAgICAgICAgICAgICAgICctLWRzdEZhY2VTaXplJyxcbiAgICAgICAgICAgICAgICAnMzInLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAgICAgJy0taW5wdXQnLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICAgICAgZGlzdFZlY3RvcixcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YS5pc1JHQkUgJiYgZXh0ICE9PSAnLmhkcicpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0gJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShkaXN0VmVjdG9yKSk7XG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgdmVjdG9yUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgdmVjdG9yUGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh2b2lkIDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCB2ZWN0b3JzOiBzdHJpbmdbXSA9IFsnJywgJyddO1xuXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JzID0gcmVhZEZpbGVTeW5jKGRpc3RWZWN0b3JXaXRoRXh0LCAndXRmOCcpLnNwbGl0KC9cXG4vKS5tYXAoaXRlbSA9PiBpdGVtLnRyaW0oKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChtZXRhLmltcG9ydGVyID09PSAndGV4dHVyZS1jdWJlJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oRWRpdG9yLkkxOG4udCgnaW5zcGVjdG9yLnNjZW5lLnJlY29tbWVuZEVycFRleHR1cmVDdWJlJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXZlY3RvcnNbMF0pIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JzWzBdID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXZlY3RvcnNbMV0pIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JzWzFdID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGV4YW1wbGU6IFsnMC4wMScsICcwLjAxJywgJzAuMDEnXVxuICAgICAgICAgICAgY29uc3QgdmVjdG9yMSA9IHZlY3RvcnNbMF0uc3BsaXQoJywnKS5tYXAoaXRlbSA9PiBwYXJzZUZsb2F0KGl0ZW0udHJpbSgpKSk7XG4gICAgICAgICAgICBjb25zdCB2ZWN0b3IyID0gdmVjdG9yc1sxXS5zcGxpdCgnLCcpLm1hcChpdGVtID0+IHBhcnNlRmxvYXQoaXRlbS50cmltKCkpKTtcblxuICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLmFtYmllbnQuc2t5Q29sb3IgPSBuZXcgVmVjNCh2ZWN0b3IxWzBdLCB2ZWN0b3IxWzFdLCB2ZWN0b3IxWzJdLCAwKTtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5hbWJpZW50Lmdyb3VuZEFsYmVkbyA9IG5ldyBWZWM0KHZlY3RvcjJbMF0sIHZlY3RvcjJbMV0sIHZlY3RvcjJbMl0sIDApO1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNoYW5nZS1ub2RlJywgY2MuZGlyZWN0b3IuX3NjZW5lLnV1aWQpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIGVkaXQgc2NlbmUgbm9kZVxuICAgIGFzeW5jIGdlbmVyYXRlRGlmZnVzZU1hcChlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgLy8gLS0tLSBEaWZmdXNlTWFwIC0tLS1cbiAgICAgICAgY29uc3QgZGlzdERpZmZ1c2VNYXAgPSBqb2luKGRpcm5hbWUocGF0aCksIGAke2Jhc2V9X2RpZmZ1c2lvbmApO1xuICAgICAgICBjb25zdCBkaXN0RGlmZnVzZU1hcFdpdGhFeHQgPSBkaXN0RGlmZnVzZU1hcCArICcucG5nJztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0RGlmZnVzZU1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoZWxsLnRyYXNoSXRlbShkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHt9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmV0cnlcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZW1vdmUoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGRpZmZ1c2VNYXBDaGlsZDogQ2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgY29uc3QgZGlmZnVzZU1hcFBhcmFtcyA9IFtcbiAgICAgICAgICAgICAgICAnLS1maWx0ZXInLFxuICAgICAgICAgICAgICAgICdpcnJhZGlhbmNlJyxcbiAgICAgICAgICAgICAgICAnLS1kc3RGYWNlU2l6ZScsXG4gICAgICAgICAgICAgICAgJzMyJyxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgICAgICctLWlucHV0JyxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgICAgIGRpc3REaWZmdXNlTWFwLFxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGEuaXNSR0JFICYmIGV4dCAhPT0gJy5oZHInKSB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcFBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NCcpLCBkaWZmdXNlTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIGRpZmZ1c2VNYXBQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBUZXh0dXJlIG11c3QgYmUgY3ViZSB0eXBlXG4gICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IGRpc3REaWZmdXNlTWFwV2l0aEV4dCArICcubWV0YSc7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLnR5cGUgPSAndGV4dHVyZSBjdWJlJztcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwgbWV0YSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCB7XG4gICAgICAgICAgICAgICAgICAgIHZlcjogJzAuMC4wJyxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZXI6ICcqJyxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0dXJlIGN1YmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNSR0JFOiBtZXRhLnVzZXJEYXRhLmlzUkdCRSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2hlbiB0aGUgZmlsZSBpcyByZWFkeSwgdGVsbCB0aGUgZWRpdG9yIHRvIHJlZnJlc2ggdGhlIGZpbGVcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCBkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuXG4gICAgICAgICAgICBpZiAoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBkaXN0RGlmZnVzZU1hcFdpdGhFeHQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLmxvYWRBbnkoYCR7dXVpZH1AYjQ3YzBgLCAoZXJyb3I6IGFueSwgYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldCBjYW4ndCBiZSBsb2FkOiR7dXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuc2t5Ym94LmRpZmZ1c2VNYXAgPSBhc3NldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdCgnc2NlbmU6Y2hhbmdlLW5vZGUnLCBjYy5kaXJlY3Rvci5fc2NlbmUudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBiYWtlUmVmbGVjdGlvbkNvbnZvbHV0aW9uKGVudk1hcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIGVudk1hcFV1aWQucmVwbGFjZSgvQFteQF0rJC8sICcnKSk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZXRhOiBhbnkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1tZXRhJywgZW52TWFwVXVpZCk7XG4gICAgICAgIGNvbnN0IGxkckhkckZvcm1hdFN0cmluZyA9IChtZXRhLnVzZXJEYXRhLmlzUkdCRSkgPyAncmdibScgOiAnYmdyYTgnO1xuICAgICAgICBjb25zdCBleHQgPSBleHRuYW1lKHBhdGgpO1xuICAgICAgICBjb25zdCBiYXNlID0gYmFzZW5hbWUocGF0aCwgZXh0KTtcblxuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwID0gam9pbihkaXJuYW1lKHBhdGgpLCBgJHtiYXNlfV9yZWZsZWN0aW9uYCk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25NYXBXaXRoRXh0ID0gcmVmbGVjdGlvbk1hcCArICcucG5nJztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhyZWZsZWN0aW9uTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hlbGwudHJhc2hJdGVtKHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuICAgICAgICB9XG4gICAgICAgIC8vIHJldHJ5XG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZW1vdmUocmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgcmVmbGVjdGlvbk1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwUGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICctLXNyY0ZhY2VTaXplJyxcbiAgICAgICAgICAgICAgICAnMTUzNicsXG4gICAgICAgICAgICAgICAgJy0tYnlwYXNzb3V0cHV0dHlwZScsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwLFxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGEuaXNSR0JFICYmIGV4dCAhPT0gJy5oZHInKSB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcFBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NCcpLCByZWZsZWN0aW9uTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHJlZmxlY3Rpb25NYXBQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBUZXh0dXJlIG11c3QgYmUgY3ViZSB0eXBlXG4gICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IHJlZmxlY3Rpb25NYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgdmVyOiAnMC4wLjAnLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRlcjogJyonLFxuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1JHQkU6IG1ldGEudXNlckRhdGEuaXNSR0JFLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBmaWxlIGlzIHJlYWR5LCB0ZWxsIHRoZSBlZGl0b3IgdG8gcmVmcmVzaCB0aGUgZmlsZVxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgLy8g6ZyA6KaB5L+u5pS55Yiw5a2Q6LWE5rqQIGVycC10ZXh0dXJlLWN1YmUg55qEIHVzZXJEYXRhLm1pcEJha2VNb2RlXG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAobWV0YS5zdWJNZXRhcz8uYjQ3YzApe1xuICAgICAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhLm1pcEJha2VNb2RlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVmbGVjdGlvbk1hcFdpdGhFeHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5yZWZsZWN0aW9uTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNoYW5nZS1ub2RlJywgY2MuZGlyZWN0b3IuX3NjZW5lLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2V0UmVmbGVjdGlvbkNvbnZvbHV0aW9uTWFwKGVudk1hcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIGVudk1hcFV1aWQucmVwbGFjZSgvQFteQF0rJC8sICcnKSk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcCA9IGpvaW4oZGlybmFtZShwYXRoKSwgYCR7YmFzZX1fcmVmbGVjdGlvbmApO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwV2l0aEV4dCA9IHJlZmxlY3Rpb25NYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXVpZCcsIHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuc2t5Ym94LnJlZmxlY3Rpb25NYXAgPSBhc3NldDtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIGNjLmRpcmVjdG9yLl9zY2VuZS51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH0sXG59O1xuIl19