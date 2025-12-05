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
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsaURBQW9EO0FBQ3BELCtCQUF3RDtBQUN4RCx1Q0FBeUc7QUFDekcsMkJBQTBCO0FBSzFCLGVBQWU7QUFDZixTQUFnQixJQUFJLEtBQUksQ0FBQztBQUF6QixvQkFBeUI7QUFDekIsZUFBZTtBQUNmLFNBQWdCLE1BQU0sS0FBSSxDQUFDO0FBQTNCLHdCQUEyQjtBQUUzQixXQUFXO0FBQ0UsUUFBQSxPQUFPLEdBQUc7SUFDbkIsdUJBQXVCLENBQUMsSUFBWTtRQUNoQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE1BQU0sSUFBSSxHQUFHO1lBQ1QsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDakYsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdkcsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDeEUsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxxQkFBcUIs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Q0FBQyxDQUFDO3FCQUMxRTtpQkFDSjthQUVKO1NBQ0o7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDeEI7SUFDTCxDQUFDO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgc2hlbGwgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgeyBzcGF3biwgQ2hpbGRQcm9jZXNzIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lLCBiYXNlbmFtZSwgZXh0bmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgb3V0cHV0SlNPTlN5bmMsIHJlbW92ZSwgZXhpc3RzU3luYywgcmVhZEpTT05TeW5jLCBlbnN1cmVEaXJTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBWZWM0IH0gZnJvbSAnY2MnO1xuXG5kZWNsYXJlIGNvbnN0IGNjOiBhbnk7XG5kZWNsYXJlIGNvbnN0IGNjZTogYW55O1xuXG4vLyDmqKHlnZfliqDovb3nmoTml7blgJnop6blj5HnmoTlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge31cbi8vIOaooeWdl+WNuOi9veeahOaXtuWAmeinpuWPkeeahOWHveaVsFxuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHt9XG5cbi8vIOaooeWdl+WGheWumuS5ieeahOaWueazlVxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgcXVlcnlOb2RlV29ybGRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjY2UuTm9kZS5xdWVyeSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIHdvcmxkUG9zaXRpb246IFtub2RlLndvcmxkUG9zaXRpb24ueCwgbm9kZS53b3JsZFBvc2l0aW9uLnksIG5vZGUud29ybGRQb3NpdGlvbi56XSxcbiAgICAgICAgICAgIHdvcmxkUm90YXRpb246IFtub2RlLndvcmxkUm90YXRpb24ueCwgbm9kZS53b3JsZFJvdGF0aW9uLnksIG5vZGUud29ybGRSb3RhdGlvbi56LCBub2RlLndvcmxkUm90YXRpb24ud10sXG4gICAgICAgICAgICB3b3JsZFNjYWxlOiBbbm9kZS53b3JsZFNjYWxlLngsIG5vZGUud29ybGRTY2FsZS55LCBub2RlLndvcmxkU2NhbGUuel0sXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHNldE5vZGVXb3JsZFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgICAgICBjb25zdCBub2RlID0gY2NlLk5vZGUucXVlcnkodXVpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLnNldFdvcmxkUG9zaXRpb24oLi4uZGF0YS53b3JsZFBvc2l0aW9uKTtcbiAgICAgICAgbm9kZS5zZXRXb3JsZFJvdGF0aW9uKC4uLmRhdGEud29ybGRSb3RhdGlvbik7XG4gICAgICAgIG5vZGUuc2V0V29ybGRTY2FsZSguLi5kYXRhLndvcmxkU2NhbGUpO1xuICAgIH0sXG5cbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZVZlY3RvcihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gVmVjdG9yIC0tLS1cbiAgICAgICAgY29uc3QgZGlzdFZlY3RvciA9IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnaW5zcGVjdG9yJywgYCR7YmFzZX1fZGlmZnVzaW9uYCk7XG4gICAgICAgIGNvbnN0IGRpc3RWZWN0b3JXaXRoRXh0ID0gZGlzdFZlY3RvciArICcudHh0JztcblxuICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0VmVjdG9yV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hlbGwudHJhc2hJdGVtKGRpc3RWZWN0b3JXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuICAgICAgICB9XG4gICAgICAgIC8vIHJldHJ5XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGRpc3RWZWN0b3JXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZW1vdmUoZGlzdFZlY3RvcldpdGhFeHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgdmVjdG9yQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIGNvbnN0IHZlY3RvclBhcmFtcyA9IFtcbiAgICAgICAgICAgICAgICAnLS1oZW1pc3BoZXJlbGlnaHRpbmdjb2VmJyxcbiAgICAgICAgICAgICAgICAnLS1maWx0ZXInLFxuICAgICAgICAgICAgICAgICdpcnJhZGlhbmNlJyxcbiAgICAgICAgICAgICAgICAnLS1kc3RGYWNlU2l6ZScsXG4gICAgICAgICAgICAgICAgJzMyJyxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgICAgICctLWlucHV0JyxcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgICAgIGRpc3RWZWN0b3IsXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGEuaXNSR0JFICYmIGV4dCAhPT0gJy5oZHInKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtICcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoZGlzdFZlY3RvcikpO1xuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZlY3RvckNoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHZlY3RvclBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB2ZWN0b3JDaGlsZC5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgdmVjdG9yczogc3RyaW5nW10gPSBbJycsICcnXTtcblxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdFZlY3RvcldpdGhFeHQpKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9ycyA9IHJlYWRGaWxlU3luYyhkaXN0VmVjdG9yV2l0aEV4dCwgJ3V0ZjgnKS5zcGxpdCgvXFxuLykubWFwKGl0ZW0gPT4gaXRlbS50cmltKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobWV0YS5pbXBvcnRlciA9PT0gJ3RleHR1cmUtY3ViZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2luc3BlY3Rvci5zY2VuZS5yZWNvbW1lbmRFcnBUZXh0dXJlQ3ViZScpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzBdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1swXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF2ZWN0b3JzWzFdKSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yc1sxXSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBleGFtcGxlOiBbJzAuMDEnLCAnMC4wMScsICcwLjAxJ11cbiAgICAgICAgICAgIGNvbnN0IHZlY3RvcjEgPSB2ZWN0b3JzWzBdLnNwbGl0KCcsJykubWFwKGl0ZW0gPT4gcGFyc2VGbG9hdChpdGVtLnRyaW0oKSkpO1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yMiA9IHZlY3RvcnNbMV0uc3BsaXQoJywnKS5tYXAoaXRlbSA9PiBwYXJzZUZsb2F0KGl0ZW0udHJpbSgpKSk7XG5cbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5hbWJpZW50LnNreUNvbG9yID0gbmV3IFZlYzQodmVjdG9yMVswXSwgdmVjdG9yMVsxXSwgdmVjdG9yMVsyXSwgMCk7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5fc2NlbmUuX2dsb2JhbHMuYW1iaWVudC5ncm91bmRBbGJlZG8gPSBuZXcgVmVjNCh2ZWN0b3IyWzBdLCB2ZWN0b3IyWzFdLCB2ZWN0b3IyWzJdLCAwKTtcblxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIGNjLmRpcmVjdG9yLl9zY2VuZS51dWlkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBlZGl0IHNjZW5lIG5vZGVcbiAgICBhc3luYyBnZW5lcmF0ZURpZmZ1c2VNYXAoZW52TWFwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgZW52TWFwVXVpZC5yZXBsYWNlKC9AW15AXSskLywgJycpKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGE6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBlbnZNYXBVdWlkKTtcbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gKG1ldGEudXNlckRhdGEuaXNSR0JFKSA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGNvbnN0IGV4dCA9IGV4dG5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBiYXNlbmFtZShwYXRoLCBleHQpO1xuXG4gICAgICAgIC8vIC0tLS0gRGlmZnVzZU1hcCAtLS0tXG4gICAgICAgIGNvbnN0IGRpc3REaWZmdXNlTWFwID0gam9pbihkaXJuYW1lKHBhdGgpLCBgJHtiYXNlfV9kaWZmdXNpb25gKTtcbiAgICAgICAgY29uc3QgZGlzdERpZmZ1c2VNYXBXaXRoRXh0ID0gZGlzdERpZmZ1c2VNYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdERpZmZ1c2VNYXBXaXRoRXh0KSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzaGVsbC50cmFzaEl0ZW0oZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7fVxuICAgICAgICB9XG4gICAgICAgIC8vIHJldHJ5XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGRpc3REaWZmdXNlTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGRpc3REaWZmdXNlTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBkaWZmdXNlTWFwQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIGNvbnN0IGRpZmZ1c2VNYXBQYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgJy0tZmlsdGVyJyxcbiAgICAgICAgICAgICAgICAnaXJyYWRpYW5jZScsXG4gICAgICAgICAgICAgICAgJy0tZHN0RmFjZVNpemUnLFxuICAgICAgICAgICAgICAgICczMicsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICAgICAnLS1pbnB1dCcsXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgICAgICBkaXN0RGlmZnVzZU1hcCxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICAgICAgZGlmZnVzZU1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgZGlmZnVzZU1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpZmZ1c2VNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0LmV4ZScpLCBkaWZmdXNlTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBkaWZmdXNlTWFwQ2hpbGQub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gVGV4dHVyZSBtdXN0IGJlIGN1YmUgdHlwZVxuICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSBkaXN0RGlmZnVzZU1hcFdpdGhFeHQgKyAnLm1ldGEnO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAgICAgbWV0YS51c2VyRGF0YS50eXBlID0gJ3RleHR1cmUgY3ViZSc7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICB2ZXI6ICcwLjAuMCcsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydGVyOiAnKicsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dHVyZSBjdWJlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzUkdCRTogbWV0YS51c2VyRGF0YS5pc1JHQkUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGZpbGUgaXMgcmVhZHksIHRlbGwgdGhlIGVkaXRvciB0byByZWZyZXNoIHRoZSBmaWxlXG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgaWYgKGRpc3REaWZmdXNlTWFwV2l0aEV4dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgZGlzdERpZmZ1c2VNYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkQW55KGAke3V1aWR9QGI0N2MwYCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXQgY2FuJ3QgYmUgbG9hZDoke3V1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IuX3NjZW5lLl9nbG9iYWxzLnNreWJveC5kaWZmdXNlTWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoJ3NjZW5lOmNoYW5nZS1ub2RlJywgY2MuZGlyZWN0b3IuX3NjZW5lLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgYmFrZVJlZmxlY3Rpb25Db252b2x1dGlvbihlbnZNYXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBlbnZNYXBVdWlkLnJlcGxhY2UoL0BbXkBdKyQvLCAnJykpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWV0YTogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGVudk1hcFV1aWQpO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSAobWV0YS51c2VyRGF0YS5pc1JHQkUpID8gJ3JnYm0nIDogJ2JncmE4JztcbiAgICAgICAgY29uc3QgZXh0ID0gZXh0bmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZSA9IGJhc2VuYW1lKHBhdGgsIGV4dCk7XG5cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcCA9IGpvaW4oZGlybmFtZShwYXRoKSwgYCR7YmFzZX1fcmVmbGVjdGlvbmApO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uTWFwV2l0aEV4dCA9IHJlZmxlY3Rpb25NYXAgKyAnLnBuZyc7XG5cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMocmVmbGVjdGlvbk1hcFdpdGhFeHQpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoZWxsLnRyYXNoSXRlbShyZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge31cbiAgICAgICAgfVxuICAgICAgICAvLyByZXRyeVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhyZWZsZWN0aW9uTWFwV2l0aEV4dCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKHJlZmxlY3Rpb25NYXBXaXRoRXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHJlZmxlY3Rpb25NYXBDaGlsZDogQ2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgY29uc3QgcmVmbGVjdGlvbk1hcFBhcmFtcyA9IFtcbiAgICAgICAgICAgICAgICAnLS1zcmNGYWNlU2l6ZScsXG4gICAgICAgICAgICAgICAgJzE1MzYnLFxuICAgICAgICAgICAgICAgICctLWJ5cGFzc291dHB1dHR5cGUnLFxuICAgICAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAgICAgJy0taW5wdXQnLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcCxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhLmlzUkdCRSAmJiBleHQgIT09ICcuaGRyJykge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvbk1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgcmVmbGVjdGlvbk1hcFBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25NYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0LmV4ZScpLCByZWZsZWN0aW9uTWFwUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uTWFwQ2hpbGQub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gVGV4dHVyZSBtdXN0IGJlIGN1YmUgdHlwZVxuICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSByZWZsZWN0aW9uTWFwV2l0aEV4dCArICcubWV0YSc7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLnR5cGUgPSAndGV4dHVyZSBjdWJlJztcbiAgICAgICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwgbWV0YSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCB7XG4gICAgICAgICAgICAgICAgICAgIHZlcjogJzAuMC4wJyxcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0ZXI6ICcqJyxcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0dXJlIGN1YmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNSR0JFOiBtZXRhLnVzZXJEYXRhLmlzUkdCRSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2hlbiB0aGUgZmlsZSBpcyByZWFkeSwgdGVsbCB0aGUgZWRpdG9yIHRvIHJlZnJlc2ggdGhlIGZpbGVcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgIC8vIOmcgOimgeS/ruaUueWIsOWtkOi1hOa6kCBlcnAtdGV4dHVyZS1jdWJlIOeahCB1c2VyRGF0YS5taXBCYWtlTW9kZVxuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKG1ldGEuc3ViTWV0YXM/LmI0N2MwKXtcbiAgICAgICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMC51c2VyRGF0YS5taXBCYWtlTW9kZSA9IDI7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcblxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvbk1hcFdpdGhFeHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZmxlY3Rpb25NYXBXaXRoRXh0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCByZWZsZWN0aW9uTWFwV2l0aEV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0IGNhbid0IGJlIGxvYWQ6JHt1dWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLl9zY2VuZS5fZ2xvYmFscy5za3lib3gucmVmbGVjdGlvbk1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KCdzY2VuZTpjaGFuZ2Utbm9kZScsIGNjLmRpcmVjdG9yLl9zY2VuZS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxufTtcbiJdfQ==