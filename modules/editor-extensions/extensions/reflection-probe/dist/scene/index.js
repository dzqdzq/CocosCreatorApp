'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = exports.EditorReflectionProbeManager = exports.BakeCommand = void 0;
const cc_1 = require("cc");
const reflection_probe_1 = require("cc/editor/reflection-probe");
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const graphics_1 = require("../utils/graphics");
const path_1 = require("path");
class BakeCommand {
    constructor(probe, 
    /** 取消当前命令的方法 */
    cancel, 
    /** 不再等待 */
    stopWaiting) {
        this.probe = probe;
        this.cancel = cancel;
        this.stopWaiting = stopWaiting;
        this.isCancel = false;
        this.stopWaiting = stopWaiting?.bind(this);
    }
    get nodeName() {
        return this.probe.node.name;
    }
    get uuid() {
        return this.probe.uuid;
    }
    toReflectionProbeBakeInfo() {
        return {
            uuid: this.uuid,
            nodeName: this.nodeName,
        };
    }
}
exports.BakeCommand = BakeCommand;
class EditorReflectionProbeManager {
    constructor() {
        /**
         * 当记录在此 map 的资源被导入完成时将触发对应的回调，并且删除记录
         */
        this.textureCubeURLMap = new Map();
        /** 生成的资源的 uuid */
        this._existFileSet = new Set();
        this._bakeQueue = [];
        this._isLocked = false;
        /** 是否所有的请求都收集完了 */
        this._isClearing = false;
        /** 完成烘焙的数量 */
        this._finished = [];
        EditorReflectionProbeManager._INSTANCE = this;
    }
    static GET_INSTANCE() {
        return this._INSTANCE ?? new EditorReflectionProbeManager();
    }
    async onLoad() {
        this._bindOnAssetChange = this.onAssetChange.bind(this);
        cce.Asset.addListener('asset-change', this._bindOnAssetChange);
        const fileUUIDSFromConfig = (await this._getConfig())?.fileUUIDs;
        const nonExistFileUUIDS = [];
        if (fileUUIDSFromConfig instanceof Array) {
            for (let index = 0; index < fileUUIDSFromConfig.length; index++) {
                const uuid = fileUUIDSFromConfig[index];
                if (typeof uuid === 'string') {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
                    if (!info) {
                        nonExistFileUUIDS.push(uuid);
                    }
                }
            }
            fileUUIDSFromConfig.filter(item => !nonExistFileUUIDS.includes(item)).forEach(item => this._existFileSet.add(item));
        }
    }
    async onAssetChange(uuid, assetInfo, meta) {
        if (this.textureCubeURLMap.has(assetInfo.url)) {
            const componentUUID = this.textureCubeURLMap.get(assetInfo.url);
            this._existFileSet.add(uuid.slice(0, uuid.length - 6));
            this._saveProfile();
            const asset = await new Promise((resolve) => {
                cc_1.assetManager.loadAny(uuid, (error, asset) => {
                    if (error) {
                        console.error(`[reflection-probe]: asset can't be load:{asset(${uuid})},please ensure that resources are imported`);
                        console.error(error);
                        resolve(null);
                    }
                    else {
                        resolve(asset);
                    }
                });
            });
            if (asset) {
                const component = cce.Component.query(componentUUID);
                if (component instanceof cc_1.ReflectionProbe) {
                    component.cubemap = asset;
                }
            }
            this.textureCubeURLMap.delete(assetInfo.url);
        }
    }
    onUnload() {
        this.stopBaking();
        this._isClearing = false;
        this._finished.length = 0;
        cce.Asset.removeListener('asset-change', this._bindOnAssetChange);
    }
    stopBaking() {
        this._bakeQueue.forEach(item => item.cancel?.());
        this._bakeQueue.length = 0;
        this._currentBakingInfo?.cancel?.();
        this._currentBakingInfo = undefined;
        this._isLocked = false;
    }
    isBaking(uuid) {
        return this._bakeQueue.some(item => item.uuid === uuid) || this._currentBakingInfo?.uuid === uuid;
    }
    bakeCubemaps(probeUUIDs) {
        const probeOrUUIDs = [];
        const componentMap = cce.Component.queryAll();
        for (const key in componentMap) {
            const component = componentMap[key];
            if (component instanceof cc_1.ReflectionProbe && component.enabled && component.probeType === cc_1.renderer.scene.ProbeType.CUBE) {
                if (!probeUUIDs || probeUUIDs.includes(component.uuid)) {
                    probeOrUUIDs.push(component);
                }
            }
        }
        // 先锁住等收集了所有命令的信息了再 nextTick
        this._isLocked = true;
        for (let index = 0; index < probeOrUUIDs.length; index++) {
            const probeOrUUID = probeOrUUIDs[index];
            this._bakeCubemap(probeOrUUID);
        }
        if (!this._currentBakingInfo) {
            this.nextTick();
        }
        else {
            this._broadcast('reflection-probe:update-bake-info', this.queryAllBakeInfos());
        }
    }
    queryAllBakeInfos() {
        const remaining = this._bakeQueue.map((item) => item.toReflectionProbeBakeInfo());
        const currentInfo = this._currentBakingInfo?.toReflectionProbeBakeInfo();
        return {
            remaining,
            currentInfo,
            finished: this._finished,
        };
    }
    async clearResults() {
        for await (const iterator of this._existFileSet.values()) {
            const url = await Editor.Message.request('asset-db', 'query-url', iterator);
            if (url) {
                await Editor.Message.request('asset-db', 'delete-asset', url);
            }
        }
        const componentMap = cce.Component.queryAll();
        for (const key in componentMap) {
            const component = componentMap[key];
            if (component instanceof cc_1.ReflectionProbe) {
                component.clearBakedCubemap();
            }
        }
        cce.Engine.repaintInEditMode();
        this._existFileSet.clear();
        this._saveProfile();
    }
    cancelBakes(reflectProbeUUIDs) {
        if (!reflectProbeUUIDs) {
            this._bakeQueue.forEach(item => item.cancel());
            this._currentBakingInfo?.cancel();
        }
        else {
            for (let index = 0; index < reflectProbeUUIDs.length; index++) {
                const uuid = reflectProbeUUIDs[index];
                if (this._currentBakingInfo?.uuid === uuid) {
                    this._currentBakingInfo.cancel();
                }
                else {
                    const item = this._bakeQueue.find(item => item.uuid === uuid);
                    item?.cancel();
                }
            }
        }
    }
    'start-bake'(reflectProbeUUIDs) {
        return this.bakeCubemaps(reflectProbeUUIDs);
    }
    'cancel-bake'(reflectProbeUUIDs) {
        return this.cancelBakes(reflectProbeUUIDs);
    }
    async 'clear-results'() {
        this._isClearing = true;
        this._broadcast('reflection-probe:clear-end', this._isClearing);
        try {
            await this.clearResults();
        }
        catch (error) {
            console.debug(`[reflection-probe]: Clear result failed`, error);
        }
        this._isClearing = false;
        this._broadcast('reflection-probe:clear-end', this._isClearing);
        return;
    }
    'query-bake-info'() {
        return this.queryAllBakeInfos();
    }
    'query-is-clearing'() {
        return this._isClearing;
    }
    get isBusy() {
        return this._isLocked;
    }
    /** 保存 profile */
    async _saveProfile() {
        await Editor.Profile.setProject('scene', EditorReflectionProbeManager._FILE_UUIDS_PROFILE_PATH, [...this._existFileSet.values()]);
    }
    async _getConfig() {
        return await Editor.Profile.getConfig('scene', EditorReflectionProbeManager._FILE_UUIDS_PROFILE_PATH, 'local');
    }
    _broadcast(message, ...args) {
        if (EditorReflectionProbeManager.BROADCAST_MESSAGE.includes(message)) {
            Editor.Message.broadcast(message, ...args);
        }
        else {
            throw new Error(`[reflection-probe]: message: ${message} is not exist`);
        }
    }
    nextTick() {
        const task = this._bakeQueue.pop();
        if (task) {
            task.stopWaiting();
        }
        else {
            this._isLocked = false;
            this._currentBakingInfo = undefined;
            this._finished.length = 0;
        }
        this._broadcast('reflection-probe:update-bake-info', this['query-bake-info']());
    }
    /**
     * @param probeOrUUID
     * @returns 是否烘焙成功
     */
    async _bakeCubemap(probeOrUUID) {
        const probe = probeOrUUID instanceof cc_1.ReflectionProbe ? probeOrUUID : cce.Component.query(probeOrUUID);
        if (!(probe instanceof cc_1.ReflectionProbe) || !probe.enabled) {
            return;
        }
        const bakeCommand = new BakeCommand(probe, () => {
            bakeCommand.isCancel = true;
            throw 'cancel';
        });
        try {
            if (this.isBaking(probe.uuid)) {
                return;
            }
            else if (this._isLocked) {
                await new Promise((resolveWait, rejectWait) => {
                    bakeCommand.cancel = () => {
                        bakeCommand.isCancel = true;
                        rejectWait('cancel');
                    };
                    bakeCommand.stopWaiting = () => resolveWait(void 0);
                    this._bakeQueue.push(bakeCommand);
                });
            }
            this._isLocked = true;
            this._currentBakingInfo = bakeCommand;
            this._broadcast('reflection-probe:update-bake-info', this['query-bake-info']());
            this._broadcast('reflection-probe:bake-start', bakeCommand.toReflectionProbeBakeInfo());
            const onFinish = () => {
                this._finished.push(bakeCommand.toReflectionProbeBakeInfo());
                this.nextTick();
            };
            this._captureCube(probe)
                .then(value => {
                this._broadcast('reflection-probe:bake-end', null, bakeCommand.toReflectionProbeBakeInfo());
            })
                .catch(err => {
                this._broadcast('reflection-probe:bake-end', err, bakeCommand.toReflectionProbeBakeInfo());
            })
                .finally(onFinish);
        }
        catch (error) {
            if (error === 'cancel') {
                const index = this._bakeQueue.findIndex(item => item.uuid === bakeCommand.uuid);
                if (index !== -1) {
                    this._bakeQueue.splice(index, 1);
                    for (const [url, uuid] of this.textureCubeURLMap.entries()) {
                        if (uuid === bakeCommand.uuid) {
                            this.textureCubeURLMap.delete(url);
                            break;
                        }
                    }
                }
            }
        }
    }
    /**
     * @en Render the six faces of the Probe and use the tool to generate a cubemap and save it to the asset directory.
     * @zh 渲染Probe的6个面，并且使用工具生成cubemap保存至asset目录。
     */
    async _captureCube(probeComponent) {
        this._currentBakingInfo;
        probeComponent.probe.captureCubemap();
        this._assertNotCancel();
        await this._waitForNextFrame();
        //Save rendertexture data to the resource directory
        const caps = (cc_1.director.root).device.capabilities;
        const files = [];
        for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
            this._assertNotCancel();
            const fileName = `capture_${faceIdx}.png`;
            files.push(fileName);
            let pixelData = graphics_1.readPixels(probeComponent.probe.bakedCubeTextures[faceIdx]);
            if (caps.clipSpaceMinZ === -1) {
                pixelData = graphics_1.flipImage(pixelData, probeComponent['_resolution'], probeComponent['_resolution']);
            }
            cc_1.assert(pixelData !== null);
            await graphics_1.saveDataToImage(Buffer.from(pixelData), probeComponent['_resolution'], probeComponent['_resolution'], probeComponent.node.scene.name, fileName);
        }
        //use the tool to generate a cubemap and save to asset directory
        const isHDR = (cc_1.director.root).pipeline.pipelineSceneData.isHDR;
        this._assertNotCancel();
        await this._bakeReflectionProbe(files, isHDR, probeComponent.node.scene.name, probeComponent.uuid, probeComponent.probe.getProbeId());
        if (probeComponent['_cubemap']) {
            reflection_probe_1.ReflectionProbeManager.probeManager.updateBakedCubemap(probeComponent.probe);
            reflection_probe_1.ReflectionProbeManager.probeManager.updatePreviewSphere(probeComponent.probe);
        }
        cce.Engine.repaintInEditMode();
    }
    async _waitForNextFrame() {
        return new Promise((resolve, reject) => {
            cc_1.director.once(cc_1.Director.EVENT_END_FRAME, () => {
                resolve();
            });
            cce.Engine.repaintInEditMode();
        });
    }
    _assertNotCancel() {
        if (this._currentBakingInfo?.isCancel) {
            throw 'cancel';
        }
    }
    /**
     *
     * @param files
     * @param isHDR
     * @param sceneName
     * @param probeComponentUUID
     * @param probeID
     * @param callback
     * @returns
     */
    async _bakeReflectionProbe(files, isHDR, sceneName, probeComponentUUID, probeID) {
        var _a, _b;
        const assetPath = await Editor.Message.request('asset-db', 'query-path', 'db://assets');
        if (assetPath === null) {
            console.error('[reflection-probe]: no asset directory');
            return;
        }
        const filePaths = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const path = path_1.join(assetPath, sceneName, fileName);
            filePaths.push(path);
            if (!fs_extra_1.existsSync(path)) {
                console.error(`[reflection-probe]: ${path} not exist`);
            }
        }
        const scenePath = path_1.join(assetPath, sceneName);
        if (!fs_extra_1.existsSync(scenePath)) {
            fs_extra_1.mkdirSync(scenePath);
        }
        const reflectionProbe = path_1.join(scenePath, 'reflectionProbe');
        const reflectionProbeMap = reflectionProbe + '_' + probeID.toString();
        const reflectionProbeMapWithExt = reflectionProbe + '_' + probeID.toString() + '.png';
        const reflectionProbeMapURL = `db://assets/${sceneName}/reflectionProbe_${probeID.toString()}.png`;
        const reflectionProbeSubAssetCubeMapURL = reflectionProbeMapURL + '/textureCube';
        const ldrHdrFormatString = isHDR ? 'rgbm' : 'bgra8';
        let reflectionProbeMapChild;
        const reflectionProbeMapParams = [
            '--bypassoutputtype',
            '--output0params',
            'png,' + ldrHdrFormatString + ',latlong',
            '--inputFacePosX',
            filePaths[0],
            '--inputFaceNegX',
            filePaths[1],
            '--inputFacePosY',
            filePaths[2],
            '--inputFaceNegY',
            filePaths[3],
            '--inputFacePosZ',
            filePaths[4],
            '--inputFaceNegZ',
            filePaths[5],
            '--output0',
            reflectionProbeMap,
        ];
        if (isHDR) {
            reflectionProbeMapParams.splice(0, 0, '--rgbm');
        }
        this._assertNotCancel();
        if (process.platform === 'darwin') {
            reflectionProbeMapChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64'), reflectionProbeMapParams);
        }
        else {
            reflectionProbeMapChild = child_process_1.spawn(path_1.join(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), reflectionProbeMapParams);
        }
        await new Promise((resolve, reject) => {
            const onClose = (code) => {
                if (code !== 0) {
                    console.error('[reflection-probe]: bake reflectionProbe failed.');
                    console.error(code);
                    reject(code);
                    return;
                }
                resolve(code);
            };
            this._currentBakingInfo.cancel = () => {
                this._currentBakingInfo.isCancel = true;
                reflectionProbeMapChild.removeListener('close', onClose);
                reflectionProbeMapChild.kill();
                reject('cancel');
            };
            reflectionProbeMapChild.on('close', onClose);
        });
        this._assertNotCancel();
        for (let i = 0; i < filePaths.length; i++) {
            await fs_extra_1.remove(filePaths[i]);
        }
        const metaPath = reflectionProbeMapWithExt + '.meta';
        let meta = {
            ver: '0.0.0',
            importer: '*',
            userData: {
                type: 'texture cube',
                isRGBE: true,
            },
            subMetas: {
                b47c0: {
                    userData: {
                        mipBakeMode: 2,
                    },
                },
            },
        };
        this.textureCubeURLMap.set(reflectionProbeSubAssetCubeMapURL, probeComponentUUID);
        if (!fs_extra_1.existsSync(metaPath)) {
            fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
            await Editor.Message.request('asset-db', 'refresh-asset', reflectionProbeMapURL);
        }
        else {
            meta = fs_extra_1.readJSONSync(metaPath);
            // 修改erp-texture-cube的userData.mipBakeMode，用来对cubemap做卷积
            if (meta.userData?.type !== 'texture cube' || meta.subMetas?.b47c0?.userData?.mipBakeMode !== 2) {
                meta.userData.type = 'texture cube';
                meta.subMetas ?? (meta.subMetas = {});
                (_a = meta.subMetas).b47c0 ?? (_a.b47c0 = {});
                (_b = meta.subMetas.b47c0).userData ?? (_b.userData = {});
                meta.subMetas.b47c0.userData.mipBakeMode = 2;
                const info = await Editor.Message.request('asset-db', 'query-asset-info', reflectionProbeMapURL);
                this._assertNotCancel();
                if (!info) {
                    throw new Error(`[reflection-probe]: failed to reimport-asset {asset(${reflectionProbeMapURL})},please ensure that resources are imported`);
                }
                await Editor.Message.request('asset-db', 'save-asset-meta', info.uuid, JSON.stringify(meta));
            }
            else {
                await Editor.Message.request('asset-db', 'reimport-asset', reflectionProbeMapURL);
            }
        }
        this._assertNotCancel();
    }
}
exports.EditorReflectionProbeManager = EditorReflectionProbeManager;
/** profile 中文件存放的路径 */
EditorReflectionProbeManager._FILE_UUIDS_PROFILE_PATH = 'reflection-probe.fileUUIDs';
EditorReflectionProbeManager.BROADCAST_MESSAGE = ['reflection-probe:bake-end', 'reflection-probe:bake-start', 'reflection-probe:clear-end', 'reflection-probe:update-bake-info'];
const instance = EditorReflectionProbeManager.GET_INSTANCE();
exports.methods = {
    'start-bake': (uuids) => instance['start-bake'](uuids),
    'cancel-bake': (uuids) => instance['cancelBakes'](uuids),
    'clear-results': async () => await instance['clear-results'](),
    'query-bake-info': () => instance['queryAllBakeInfos'](),
    'query-is-clearing': () => instance['query-is-clearing'](),
};
async function load() {
    await instance.onLoad();
}
exports.load = load;
function unload() {
    instance.onUnload();
}
exports.unload = unload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBaUg7QUFDakgsaUVBQW9FO0FBQ3BFLGlEQUFvRDtBQUNwRCx1Q0FBdUY7QUFFdkYsZ0RBQTJFO0FBQzNFLCtCQUE0QjtBQUc1QixNQUFhLFdBQVc7SUFTcEIsWUFDYyxLQUFzQjtJQUNoQyxnQkFBZ0I7SUFDVCxNQUFrQjtJQUN6QixXQUFXO0lBQ0osV0FBd0I7UUFKckIsVUFBSyxHQUFMLEtBQUssQ0FBaUI7UUFFekIsV0FBTSxHQUFOLE1BQU0sQ0FBWTtRQUVsQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQVo1QixhQUFRLEdBQUcsS0FBSyxDQUFDO1FBY3BCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBZEQsSUFBVyxRQUFRO1FBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELElBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQVVNLHlCQUF5QjtRQUM1QixPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQzFCLENBQUM7SUFDTixDQUFDO0NBQ0o7QUF4QkQsa0NBd0JDO0FBTUQsTUFBYSw0QkFBNEI7SUE0THJDO1FBdElBOztXQUVHO1FBQ08sc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7UUE4SGpFLGtCQUFrQjtRQUNDLGtCQUFhLEdBQWdCLElBQUksR0FBRyxFQUFFLENBQUM7UUFRaEQsZUFBVSxHQUFrQixFQUFFLENBQUM7UUFDL0IsY0FBUyxHQUFHLEtBQUss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dE1hbmFnZXIsIENvbXBvbmVudCwgRGlyZWN0b3IsIGRpcmVjdG9yLCBSZWZsZWN0aW9uUHJvYmUsIHJlbmRlcmVyLCBUZXh0dXJlQ3ViZSB9IGZyb20gJ2NjJztcbmltcG9ydCB7IFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIgfSBmcm9tICdjYy9lZGl0b3IvcmVmbGVjdGlvbi1wcm9iZSc7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBta2RpclN5bmMsIHJlbW92ZSwgcmVhZEpTT05TeW5jLCBvdXRwdXRKU09OU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IFF1ZXJ5QmFrZVJlc3VsdCwgUmVmbGVjdGlvblByb2JlQmFrZUluZm8sIFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdCwgUmVmbGVjdGlvblByb2JlT3BlcmF0aW9uUmVxdWVzdCwgUmVmbGVjdGlvblByb2JlUXVlcnlSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyByZWFkUGl4ZWxzLCBmbGlwSW1hZ2UsIHNhdmVEYXRhVG9JbWFnZSB9IGZyb20gJy4uL3V0aWxzL2dyYXBoaWNzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbnR5cGUgVVJMID0gc3RyaW5nO1xudHlwZSBQcm9iZUNvbXBvbmVudFVVSUQgPSBzdHJpbmc7XG5leHBvcnQgY2xhc3MgQmFrZUNvbW1hbmQgaW1wbGVtZW50cyBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbyB7XG5cbiAgICBwdWJsaWMgaXNDYW5jZWwgPSBmYWxzZTtcbiAgICBwdWJsaWMgZ2V0IG5vZGVOYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb2JlLm5vZGUubmFtZTtcbiAgICB9XG4gICAgcHVibGljIGdldCB1dWlkKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb2JlLnV1aWQ7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcm90ZWN0ZWQgcHJvYmU6IFJlZmxlY3Rpb25Qcm9iZSxcbiAgICAgICAgLyoqIOWPlua2iOW9k+WJjeWRveS7pOeahOaWueazlSAqL1xuICAgICAgICBwdWJsaWMgY2FuY2VsOiAoKSA9PiB2b2lkLFxuICAgICAgICAvKiog5LiN5YaN562J5b6FICovXG4gICAgICAgIHB1YmxpYyBzdG9wV2FpdGluZz86ICgpID0+IHZvaWQsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuc3RvcFdhaXRpbmcgPSBzdG9wV2FpdGluZz8uYmluZCh0aGlzKTtcbiAgICB9XG4gICAgcHVibGljIHRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKTogUmVmbGVjdGlvblByb2JlQmFrZUluZm8ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXVpZDogdGhpcy51dWlkLFxuICAgICAgICAgICAgbm9kZU5hbWU6IHRoaXMubm9kZU5hbWUsXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXJDb25maWcge1xuICAgIHJlYWRvbmx5IGZpbGVVVUlEczogUmVhZG9ubHlBcnJheTxzdHJpbmc+XG59XG5cbmV4cG9ydCBjbGFzcyBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyIGltcGxlbWVudHMgUmVmbGVjdGlvblByb2JlUXVlcnlSZXF1ZXN0LCBSZWZsZWN0aW9uUHJvYmVPcGVyYXRpb25SZXF1ZXN0IHtcblxuICAgIHB1YmxpYyBzdGF0aWMgR0VUX0lOU1RBTkNFKCk6IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fSU5TVEFOQ0UgPz8gbmV3IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb25Mb2FkKCkge1xuICAgICAgICB0aGlzLl9iaW5kT25Bc3NldENoYW5nZSA9IHRoaXMub25Bc3NldENoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICBjY2UuQXNzZXQuYWRkTGlzdGVuZXIoJ2Fzc2V0LWNoYW5nZScsIHRoaXMuX2JpbmRPbkFzc2V0Q2hhbmdlKTtcbiAgICAgICAgY29uc3QgZmlsZVVVSURTRnJvbUNvbmZpZyA9IChhd2FpdCB0aGlzLl9nZXRDb25maWcoKSk/LmZpbGVVVUlEcztcbiAgICAgICAgY29uc3Qgbm9uRXhpc3RGaWxlVVVJRFM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmIChmaWxlVVVJRFNGcm9tQ29uZmlnIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBmaWxlVVVJRFNGcm9tQ29uZmlnLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBmaWxlVVVJRFNGcm9tQ29uZmlnW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHV1aWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9uRXhpc3RGaWxlVVVJRFMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbGVVVUlEU0Zyb21Db25maWcuZmlsdGVyKGl0ZW0gPT4gIW5vbkV4aXN0RmlsZVVVSURTLmluY2x1ZGVzKGl0ZW0pKS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIGl0ZW0gPT4gdGhpcy5fZXhpc3RGaWxlU2V0LmFkZChpdGVtKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIGFzeW5jIG9uQXNzZXRDaGFuZ2UodXVpZDogc3RyaW5nLCBhc3NldEluZm86IGFueSwgbWV0YTogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmhhcyhhc3NldEluZm8udXJsKSkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50VVVJRCA9IHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZ2V0KGFzc2V0SW5mby51cmwpITtcbiAgICAgICAgICAgIHRoaXMuX2V4aXN0RmlsZVNldC5hZGQodXVpZC5zbGljZSgwLCB1dWlkLmxlbmd0aCAtIDYpKTtcbiAgICAgICAgICAgIHRoaXMuX3NhdmVQcm9maWxlKCk7XG4gICAgICAgICAgICBjb25zdCBhc3NldDogVGV4dHVyZUN1YmUgfCBudWxsID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NldE1hbmFnZXIubG9hZEFueSh1dWlkLCAoZXJyb3I6IGFueSwgYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtyZWZsZWN0aW9uLXByb2JlXTogYXNzZXQgY2FuJ3QgYmUgbG9hZDp7YXNzZXQoJHt1dWlkfSl9LHBsZWFzZSBlbnN1cmUgdGhhdCByZXNvdXJjZXMgYXJlIGltcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjY2UuQ29tcG9uZW50LnF1ZXJ5KGNvbXBvbmVudFVVSUQpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LmN1YmVtYXAgPSBhc3NldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmRlbGV0ZShhc3NldEluZm8udXJsKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIF9iaW5kT25Bc3NldENoYW5nZT86ICh1dWlkOiBzdHJpbmcsIGFzc2V0SW5mbzogYW55LCBtZXRhOiBhbnkpID0+IFByb21pc2U8dm9pZD47XG4gICAgLyoqXG4gICAgICog5b2T6K6w5b2V5Zyo5q2kIG1hcCDnmoTotYTmupDooqvlr7zlhaXlrozmiJDml7blsIbop6blj5Hlr7nlupTnmoTlm57osIPvvIzlubbkuJTliKDpmaTorrDlvZVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgdGV4dHVyZUN1YmVVUkxNYXAgPSBuZXcgTWFwPFVSTCwgUHJvYmVDb21wb25lbnRVVUlEPigpO1xuICAgIHB1YmxpYyBvblVubG9hZCgpIHtcbiAgICAgICAgdGhpcy5zdG9wQmFraW5nKCk7XG4gICAgICAgIHRoaXMuX2lzQ2xlYXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZmluaXNoZWQubGVuZ3RoID0gMDtcbiAgICAgICAgY2NlLkFzc2V0LnJlbW92ZUxpc3RlbmVyKCdhc3NldC1jaGFuZ2UnLCB0aGlzLl9iaW5kT25Bc3NldENoYW5nZSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3BCYWtpbmcoKSB7XG4gICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5jYW5jZWw/LigpKTtcbiAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy5jYW5jZWw/LigpO1xuICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5faXNMb2NrZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgcHVibGljIGlzQmFraW5nKHV1aWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fYmFrZVF1ZXVlLnNvbWUoaXRlbSA9PiBpdGVtLnV1aWQgPT09IHV1aWQpIHx8IHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy51dWlkID09PSB1dWlkO1xuICAgIH1cbiAgICBwdWJsaWMgYmFrZUN1YmVtYXBzKHByb2JlVVVJRHM/OiBSZWFkb25seUFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgcHJvYmVPclVVSURzOiBSZWZsZWN0aW9uUHJvYmVbXSA9IFtdO1xuICAgICAgICBjb25zdCBjb21wb25lbnRNYXA6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIENvbXBvbmVudD4+ID0gY2NlLkNvbXBvbmVudC5xdWVyeUFsbCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjb21wb25lbnRNYXApIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudE1hcFtrZXldO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudCBpbnN0YW5jZW9mIFJlZmxlY3Rpb25Qcm9iZSAmJiBjb21wb25lbnQuZW5hYmxlZCAmJiBjb21wb25lbnQucHJvYmVUeXBlID09PSByZW5kZXJlci5zY2VuZS5Qcm9iZVR5cGUuQ1VCRSkge1xuICAgICAgICAgICAgICAgIGlmICghcHJvYmVVVUlEcyB8fCBwcm9iZVVVSURzLmluY2x1ZGVzKGNvbXBvbmVudC51dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9iZU9yVVVJRHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDlhYjplIHkvY/nrYnmlLbpm4bkuobmiYDmnInlkb3ku6TnmoTkv6Hmga/kuoblho0gbmV4dFRpY2tcbiAgICAgICAgdGhpcy5faXNMb2NrZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcHJvYmVPclVVSURzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgcHJvYmVPclVVSUQgPSBwcm9iZU9yVVVJRHNbaW5kZXhdO1xuICAgICAgICAgICAgdGhpcy5fYmFrZUN1YmVtYXAocHJvYmVPclVVSUQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fY3VycmVudEJha2luZ0luZm8pIHtcbiAgICAgICAgICAgIHRoaXMubmV4dFRpY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJywgdGhpcy5xdWVyeUFsbEJha2VJbmZvcygpKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIHB1YmxpYyBxdWVyeUFsbEJha2VJbmZvcygpOiBRdWVyeUJha2VSZXN1bHQge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSB0aGlzLl9iYWtlUXVldWUubWFwKChpdGVtKSA9PiBpdGVtLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRJbmZvOiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbyB8IHVuZGVmaW5lZCA9IHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW1haW5pbmcsXG4gICAgICAgICAgICBjdXJyZW50SW5mbyxcbiAgICAgICAgICAgIGZpbmlzaGVkOiB0aGlzLl9maW5pc2hlZCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcHVibGljIGFzeW5jIGNsZWFyUmVzdWx0cygpIHtcbiAgICAgICAgZm9yIGF3YWl0IChjb25zdCBpdGVyYXRvciBvZiB0aGlzLl9leGlzdEZpbGVTZXQudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXVybCcsIGl0ZXJhdG9yKTtcbiAgICAgICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdkZWxldGUtYXNzZXQnLCB1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE1hcDogUmVhZG9ubHk8UmVjb3JkPHN0cmluZywgQ29tcG9uZW50Pj4gPSBjY2UuQ29tcG9uZW50LnF1ZXJ5QWxsKCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvbXBvbmVudE1hcCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50TWFwW2tleV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LmNsZWFyQmFrZWRDdWJlbWFwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuXG4gICAgICAgIHRoaXMuX2V4aXN0RmlsZVNldC5jbGVhcigpO1xuICAgICAgICB0aGlzLl9zYXZlUHJvZmlsZSgpO1xuXG4gICAgfVxuICAgIHB1YmxpYyBjYW5jZWxCYWtlcyhyZWZsZWN0UHJvYmVVVUlEcz86IHJlYWRvbmx5IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgICAgIGlmICghcmVmbGVjdFByb2JlVVVJRHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5jYW5jZWwoKSk7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8uY2FuY2VsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVmbGVjdFByb2JlVVVJRHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHJlZmxlY3RQcm9iZVVVSURzW2luZGV4XTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8udXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mby5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fYmFrZVF1ZXVlLmZpbmQoaXRlbSA9PiBpdGVtLnV1aWQgPT09IHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtPy5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfVxuICAgIHB1YmxpYyAnc3RhcnQtYmFrZScocmVmbGVjdFByb2JlVVVJRHM/OiBSZWFkb25seUFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFrZUN1YmVtYXBzKHJlZmxlY3RQcm9iZVVVSURzKTtcbiAgICB9XG4gICAgcHVibGljICdjYW5jZWwtYmFrZScocmVmbGVjdFByb2JlVVVJRHM/OiBSZWFkb25seUFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuY2VsQmFrZXMocmVmbGVjdFByb2JlVVVJRHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyAnY2xlYXItcmVzdWx0cycoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuX2lzQ2xlYXJpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJywgdGhpcy5faXNDbGVhcmluZyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2xlYXJSZXN1bHRzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVmbGVjdGlvbi1wcm9iZV06IENsZWFyIHJlc3VsdCBmYWlsZWRgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faXNDbGVhcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJywgdGhpcy5faXNDbGVhcmluZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHVibGljICdxdWVyeS1iYWtlLWluZm8nKCk6IFF1ZXJ5QmFrZVJlc3VsdCB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5QWxsQmFrZUluZm9zKCk7XG4gICAgfVxuICAgIHB1YmxpYyAncXVlcnktaXMtY2xlYXJpbmcnKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNDbGVhcmluZztcbiAgICB9XG4gICAgcHVibGljIGdldCBpc0J1c3koKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0xvY2tlZDtcbiAgICB9XG4gICAgLyoqIOS/neWtmCBwcm9maWxlICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9zYXZlUHJvZmlsZSgpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0UHJvamVjdCgnc2NlbmUnLCBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCwgWy4uLnRoaXMuX2V4aXN0RmlsZVNldC52YWx1ZXMoKV0pO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIF9JTlNUQU5DRTogRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlcjtcbiAgICAvKiogcHJvZmlsZSDkuK3mlofku7blrZjmlL7nmoTot6/lvoQgKi9cbiAgICBwcm90ZWN0ZWQgc3RhdGljIF9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCA9ICdyZWZsZWN0aW9uLXByb2JlLmZpbGVVVUlEcyc7XG4gICAgLyoqIOeUn+aIkOeahOi1hOa6kOeahCB1dWlkICovXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9leGlzdEZpbGVTZXQ6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuICAgIHByb3RlY3RlZCBhc3luYyBfZ2V0Q29uZmlnKCk6IFByb21pc2U8UmVmbGVjdGlvblByb2JlTWFuYWdlckNvbmZpZyB8IG51bGw+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygnc2NlbmUnLCBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCwgJ2xvY2FsJykgYXMgUmVmbGVjdGlvblByb2JlTWFuYWdlckNvbmZpZztcbiAgICB9XG4gICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9JTlNUQU5DRSA9IHRoaXM7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iYWtlUXVldWU6IEJha2VDb21tYW5kW10gPSBbXTtcbiAgICBwcm90ZWN0ZWQgX2lzTG9ja2VkID0gZmFsc2U7XG5cbiAgICBwcm90ZWN0ZWQgX2N1cnJlbnRCYWtpbmdJbmZvOiBCYWtlQ29tbWFuZCB8IHVuZGVmaW5lZDtcbiAgICBwcm90ZWN0ZWQgc3RhdGljIEJST0FEQ0FTVF9NRVNTQUdFOiBBcnJheTxrZXlvZiBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3Q+ID0gWydyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJywgJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCcsICdyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCcsICdyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nXTtcbiAgICBwcm90ZWN0ZWQgX2Jyb2FkY2FzdDxUIGV4dGVuZHMga2V5b2YgUmVmbGVjdGlvblByb2JlQnJvYWRjYXN0PihtZXNzYWdlOiBULCAuLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFtUXT4pOiB2b2lkIHtcbiAgICAgICAgaWYgKEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuQlJPQURDQVNUX01FU1NBR0UuaW5jbHVkZXMobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdChtZXNzYWdlLCAuLi5hcmdzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW3JlZmxlY3Rpb24tcHJvYmVdOiBtZXNzYWdlOiAke21lc3NhZ2V9IGlzIG5vdCBleGlzdGApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHByb3RlY3RlZCBuZXh0VGljaygpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IHRoaXMuX2Jha2VRdWV1ZS5wb3AoKTtcbiAgICAgICAgaWYgKHRhc2spIHtcbiAgICAgICAgICAgIHRhc2suc3RvcFdhaXRpbmchKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLl9maW5pc2hlZC5sZW5ndGggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJywgdGhpc1sncXVlcnktYmFrZS1pbmZvJ10oKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBwcm9iZU9yVVVJRCBcbiAgICAgKiBAcmV0dXJucyDmmK/lkKbng5jnhJnmiJDlip9cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2Jha2VDdWJlbWFwKHByb2JlT3JVVUlEOiBzdHJpbmcgfCBSZWZsZWN0aW9uUHJvYmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgcHJvYmUgPSBwcm9iZU9yVVVJRCBpbnN0YW5jZW9mIFJlZmxlY3Rpb25Qcm9iZSA/IHByb2JlT3JVVUlEIDogY2NlLkNvbXBvbmVudC5xdWVyeShwcm9iZU9yVVVJRCk7XG4gICAgICAgIGlmICghKHByb2JlIGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB8fCAhcHJvYmUuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmFrZUNvbW1hbmQ6IEJha2VDb21tYW5kID0gbmV3IEJha2VDb21tYW5kKFxuICAgICAgICAgICAgcHJvYmUsXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuaXNDYW5jZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRocm93ICdjYW5jZWwnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmFraW5nKHByb2JlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9pc0xvY2tlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlV2FpdCwgcmVqZWN0V2FpdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5pc0NhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3RXYWl0KCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuc3RvcFdhaXRpbmcgPSAoKSA9PiByZXNvbHZlV2FpdCh2b2lkIDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9iYWtlUXVldWUucHVzaChiYWtlQ29tbWFuZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lzTG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gYmFrZUNvbW1hbmQ7XG4gICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbycsIHRoaXNbJ3F1ZXJ5LWJha2UtaW5mbyddKCkpO1xuICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmJha2Utc3RhcnQnLCBiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25GaW5pc2ggPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmluaXNoZWQucHVzaChiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRpY2soKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuX2NhcHR1cmVDdWJlKHByb2JlKVxuICAgICAgICAgICAgICAgIC50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJywgbnVsbCwgYmFrZUNvbW1hbmQudG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnLCBlcnIsIGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShvbkZpbmlzaCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IgPT09ICdjYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9iYWtlUXVldWUuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS51dWlkID09PSBiYWtlQ29tbWFuZC51dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFt1cmwsIHV1aWRdIG9mIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXVpZCA9PT0gYmFrZUNvbW1hbmQudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZGVsZXRlKHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQGVuIFJlbmRlciB0aGUgc2l4IGZhY2VzIG9mIHRoZSBQcm9iZSBhbmQgdXNlIHRoZSB0b29sIHRvIGdlbmVyYXRlIGEgY3ViZW1hcCBhbmQgc2F2ZSBpdCB0byB0aGUgYXNzZXQgZGlyZWN0b3J5LlxuICAgICAqIEB6aCDmuLLmn5NQcm9iZeeahDbkuKrpnaLvvIzlubbkuJTkvb/nlKjlt6XlhbfnlJ/miJBjdWJlbWFw5L+d5a2Y6IezYXNzZXTnm67lvZXjgIJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2NhcHR1cmVDdWJlKHByb2JlQ29tcG9uZW50OiBSZWZsZWN0aW9uUHJvYmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm87XG4gICAgICAgIHByb2JlQ29tcG9uZW50LnByb2JlLmNhcHR1cmVDdWJlbWFwKCk7XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICBhd2FpdCB0aGlzLl93YWl0Rm9yTmV4dEZyYW1lKCk7XG4gICAgICAgIC8vU2F2ZSByZW5kZXJ0ZXh0dXJlIGRhdGEgdG8gdGhlIHJlc291cmNlIGRpcmVjdG9yeVxuICAgICAgICBjb25zdCBjYXBzID0gKGRpcmVjdG9yLnJvb3QhKS5kZXZpY2UuY2FwYWJpbGl0aWVzO1xuICAgICAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgZmFjZUlkeCA9IDA7IGZhY2VJZHggPCA2OyBmYWNlSWR4KyspIHtcbiAgICAgICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgY2FwdHVyZV8ke2ZhY2VJZHh9LnBuZ2A7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIGxldCBwaXhlbERhdGEgPSByZWFkUGl4ZWxzKHByb2JlQ29tcG9uZW50LnByb2JlLmJha2VkQ3ViZVRleHR1cmVzW2ZhY2VJZHhdKTtcbiAgICAgICAgICAgIGlmIChjYXBzLmNsaXBTcGFjZU1pblogPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcGl4ZWxEYXRhID0gZmxpcEltYWdlKHBpeGVsRGF0YSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10sIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzc2VydChwaXhlbERhdGEgIT09IG51bGwpO1xuICAgICAgICAgICAgYXdhaXQgc2F2ZURhdGFUb0ltYWdlKEJ1ZmZlci5mcm9tKHBpeGVsRGF0YSksIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddLCBwcm9iZUNvbXBvbmVudFsnX3Jlc29sdXRpb24nXSwgcHJvYmVDb21wb25lbnQubm9kZS5zY2VuZS5uYW1lLCBmaWxlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy91c2UgdGhlIHRvb2wgdG8gZ2VuZXJhdGUgYSBjdWJlbWFwIGFuZCBzYXZlIHRvIGFzc2V0IGRpcmVjdG9yeVxuICAgICAgICBjb25zdCBpc0hEUiA9IChkaXJlY3Rvci5yb290ISkucGlwZWxpbmUucGlwZWxpbmVTY2VuZURhdGEuaXNIRFI7XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICBhd2FpdCB0aGlzLl9iYWtlUmVmbGVjdGlvblByb2JlKGZpbGVzLCBpc0hEUiwgcHJvYmVDb21wb25lbnQubm9kZS5zY2VuZS5uYW1lLCBwcm9iZUNvbXBvbmVudC51dWlkLCBwcm9iZUNvbXBvbmVudC5wcm9iZS5nZXRQcm9iZUlkKCkpO1xuICAgICAgICBpZiAocHJvYmVDb21wb25lbnRbJ19jdWJlbWFwJ10pIHtcbiAgICAgICAgICAgIFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIucHJvYmVNYW5hZ2VyLnVwZGF0ZUJha2VkQ3ViZW1hcChwcm9iZUNvbXBvbmVudC5wcm9iZSk7XG4gICAgICAgICAgICBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLnByb2JlTWFuYWdlci51cGRhdGVQcmV2aWV3U3BoZXJlKHByb2JlQ29tcG9uZW50LnByb2JlKTtcbiAgICAgICAgfVxuICAgICAgICBjY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIF93YWl0Rm9yTmV4dEZyYW1lKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZGlyZWN0b3Iub25jZShEaXJlY3Rvci5FVkVOVF9FTkRfRlJBTUUsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBfYXNzZXJ0Tm90Q2FuY2VsKCkge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudEJha2luZ0luZm8/LmlzQ2FuY2VsKSB7XG4gICAgICAgICAgICB0aHJvdyAnY2FuY2VsJztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZmlsZXMgXG4gICAgICogQHBhcmFtIGlzSERSIFxuICAgICAqIEBwYXJhbSBzY2VuZU5hbWUgXG4gICAgICogQHBhcmFtIHByb2JlQ29tcG9uZW50VVVJRCBcbiAgICAgKiBAcGFyYW0gcHJvYmVJRCBcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9iYWtlUmVmbGVjdGlvblByb2JlKGZpbGVzOiBzdHJpbmdbXSwgaXNIRFI6IGJvb2xlYW4sIHNjZW5lTmFtZTogc3RyaW5nLCBwcm9iZUNvbXBvbmVudFVVSUQ6IHN0cmluZywgcHJvYmVJRDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0UGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCAnZGI6Ly9hc3NldHMnKTtcbiAgICAgICAgaWYgKGFzc2V0UGF0aCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3JlZmxlY3Rpb24tcHJvYmVdOiBubyBhc3NldCBkaXJlY3RvcnknKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBqb2luKGFzc2V0UGF0aCwgc2NlbmVOYW1lLCBmaWxlTmFtZSk7XG4gICAgICAgICAgICBmaWxlUGF0aHMucHVzaChwYXRoKTtcbiAgICAgICAgICAgIGlmICghZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtyZWZsZWN0aW9uLXByb2JlXTogJHtwYXRofSBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NlbmVQYXRoID0gam9pbihhc3NldFBhdGgsIHNjZW5lTmFtZSk7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhzY2VuZVBhdGgpKSB7XG4gICAgICAgICAgICBta2RpclN5bmMoc2NlbmVQYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmUgPSBqb2luKHNjZW5lUGF0aCwgJ3JlZmxlY3Rpb25Qcm9iZScpO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXAgPSByZWZsZWN0aW9uUHJvYmUgKyAnXycgKyBwcm9iZUlELnRvU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcFdpdGhFeHQgPSByZWZsZWN0aW9uUHJvYmUgKyAnXycgKyBwcm9iZUlELnRvU3RyaW5nKCkgKyAnLnBuZyc7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcFVSTCA9IGBkYjovL2Fzc2V0cy8ke3NjZW5lTmFtZX0vcmVmbGVjdGlvblByb2JlXyR7cHJvYmVJRC50b1N0cmluZygpfS5wbmdgO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVTdWJBc3NldEN1YmVNYXBVUkwgPSByZWZsZWN0aW9uUHJvYmVNYXBVUkwgKyAnL3RleHR1cmVDdWJlJztcblxuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSBpc0hEUiA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG5cbiAgICAgICAgbGV0IHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcFBhcmFtcyA9IFtcbiAgICAgICAgICAgICctLWJ5cGFzc291dHB1dHR5cGUnLFxuICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlUG9zWCcsXG4gICAgICAgICAgICBmaWxlUGF0aHNbMF0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VOZWdYJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1sxXSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZVBvc1knLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzJdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlTmVnWScsXG4gICAgICAgICAgICBmaWxlUGF0aHNbM10sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VQb3NaJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1s0XSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZU5lZ1onLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzVdLFxuICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXAsXG4gICAgICAgIF07XG5cbiAgICAgICAgaWYgKGlzSERSKSB7XG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcbiAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHJlZmxlY3Rpb25Qcm9iZU1hcFBhcmFtcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0LmV4ZScpLCByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IChjb2RlOiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3JlZmxlY3Rpb24tcHJvYmVdOiBiYWtlIHJlZmxlY3Rpb25Qcm9iZSBmYWlsZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUoY29kZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8hLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyEuaXNDYW5jZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uQ2xvc2UpO1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLmtpbGwoKTtcbiAgICAgICAgICAgICAgICByZWplY3QoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQub24oJ2Nsb3NlJywgb25DbG9zZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVQYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGZpbGVQYXRoc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWV0YVBhdGggPSByZWZsZWN0aW9uUHJvYmVNYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgbGV0IG1ldGE6IGFueSA9IHtcbiAgICAgICAgICAgIHZlcjogJzAuMC4wJyxcbiAgICAgICAgICAgIGltcG9ydGVyOiAnKicsXG4gICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0dXJlIGN1YmUnLFxuICAgICAgICAgICAgICAgIGlzUkdCRTogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWJNZXRhczoge1xuICAgICAgICAgICAgICAgIGI0N2MwOiB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXBCYWtlTW9kZTogMixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5zZXQocmVmbGVjdGlvblByb2JlU3ViQXNzZXRDdWJlTWFwVVJMLCBwcm9iZUNvbXBvbmVudFVVSUQpO1xuICAgICAgICBpZiAoIWV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwgbWV0YSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvblByb2JlTWFwVVJMKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgLy8g5L+u5pS5ZXJwLXRleHR1cmUtY3ViZeeahHVzZXJEYXRhLm1pcEJha2VNb2Rl77yM55So5p2l5a+5Y3ViZW1hcOWBmuWNt+enr1xuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGE/LnR5cGUgIT09ICd0ZXh0dXJlIGN1YmUnIHx8IG1ldGEuc3ViTWV0YXM/LmI0N2MwPy51c2VyRGF0YT8ubWlwQmFrZU1vZGUgIT09IDIpIHtcbiAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLnR5cGUgPSAndGV4dHVyZSBjdWJlJztcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzID8/PSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwID8/PSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhID8/PSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhLm1pcEJha2VNb2RlID0gMjtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHJlZmxlY3Rpb25Qcm9iZU1hcFVSTCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW3JlZmxlY3Rpb24tcHJvYmVdOiBmYWlsZWQgdG8gcmVpbXBvcnQtYXNzZXQge2Fzc2V0KCR7cmVmbGVjdGlvblByb2JlTWFwVVJMfSl9LHBsZWFzZSBlbnN1cmUgdGhhdCByZXNvdXJjZXMgYXJlIGltcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3NhdmUtYXNzZXQtbWV0YScsIGluZm8udXVpZCwgSlNPTi5zdHJpbmdpZnkobWV0YSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIHJlZmxlY3Rpb25Qcm9iZU1hcFVSTCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcblxuICAgIH1cbiAgICAvKiog5piv5ZCm5omA5pyJ55qE6K+35rGC6YO95pS26ZuG5a6M5LqGICovXG4gICAgcHJvdGVjdGVkIF9pc0NsZWFyaW5nID0gZmFsc2U7XG4gICAgLyoqIOWujOaIkOeDmOeEmeeahOaVsOmHjyAqL1xuICAgIHByb3RlY3RlZCByZWFkb25seSBfZmluaXNoZWQ6IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvW10gPSBbXTtcblxufVxuXG5jb25zdCBpbnN0YW5jZSA9IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuR0VUX0lOU1RBTkNFKCk7XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzOiBSZWZsZWN0aW9uUHJvYmVRdWVyeVJlcXVlc3QgJiBSZWZsZWN0aW9uUHJvYmVPcGVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICdzdGFydC1iYWtlJzogKHV1aWRzPzogcmVhZG9ubHkgc3RyaW5nW10pID0+IGluc3RhbmNlWydzdGFydC1iYWtlJ10odXVpZHMpLFxuICAgICdjYW5jZWwtYmFrZSc6ICh1dWlkcz86IHJlYWRvbmx5IHN0cmluZ1tdKSA9PiBpbnN0YW5jZVsnY2FuY2VsQmFrZXMnXSh1dWlkcyksXG4gICAgJ2NsZWFyLXJlc3VsdHMnOiBhc3luYyAoKSA9PiBhd2FpdCBpbnN0YW5jZVsnY2xlYXItcmVzdWx0cyddKCksXG4gICAgJ3F1ZXJ5LWJha2UtaW5mbyc6ICgpID0+IGluc3RhbmNlWydxdWVyeUFsbEJha2VJbmZvcyddKCksXG4gICAgJ3F1ZXJ5LWlzLWNsZWFyaW5nJzogKCkgPT4gaW5zdGFuY2VbJ3F1ZXJ5LWlzLWNsZWFyaW5nJ10oKSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkKCkge1xuICAgIGF3YWl0IGluc3RhbmNlLm9uTG9hZCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5sb2FkKCkge1xuICAgIGluc3RhbmNlLm9uVW5sb2FkKCk7XG59Il19