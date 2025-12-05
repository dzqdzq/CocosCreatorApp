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
    get nodeName() {
        return this.probe.node.name;
    }
    get uuid() {
        return this.probe.uuid;
    }
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
    toReflectionProbeBakeInfo() {
        return {
            uuid: this.uuid,
            nodeName: this.nodeName,
        };
    }
}
exports.BakeCommand = BakeCommand;
class EditorReflectionProbeManager {
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
    async loadComponentAsset(componentUUID, uuid) {
        this._existFileSet.add(uuid.slice(0, uuid.lastIndexOf('@')));
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
                // hack：需要触发场景 dirty，否则如果 bake 后，不保存的话，刷新场景或者重启编辑器会丢失 cubemap
                const commandId = cce.SceneFacadeManager.beginRecording(component.node.uuid);
                component.cubemap = asset;
                cce.SceneFacadeManager.endRecording(commandId);
                reflection_probe_1.ReflectionProbeManager.probeManager.updateBakedCubemap(component.probe);
                reflection_probe_1.ReflectionProbeManager.probeManager.updatePreviewSphere(component.probe);
                cce.Engine.repaintInEditMode();
            }
        }
    }
    async onAssetChange(uuid, assetInfo, meta) {
        for (const url of this.textureCubeURLMap.keys()) {
            if (assetInfo.url.startsWith(url) && assetInfo.url !== url) {
                this.waitingList.add(uuid);
                return;
            }
        }
        if (this.textureCubeURLMap.has(assetInfo.url)) {
            const componentUUID = this.textureCubeURLMap.get(assetInfo.url);
            const onSubAssetLoaded = (textureCubeAsset, subAssetUUID) => {
                this.waitingList.delete(subAssetUUID);
                const hasSubAssetLoading = Array.from(this.waitingList.values()).some(item => item.startsWith(uuid));
                if (!hasSubAssetLoading) {
                    this.loadComponentAsset(componentUUID, uuid);
                    cc_1.assetManager.assetListener.off(uuid, onSubAssetLoaded);
                }
            };
            cc_1.assetManager.assetListener.on(uuid, onSubAssetLoaded);
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
            if (component instanceof cc_1.ReflectionProbe && component.enabled && component.node.active && component.probeType === cc_1.renderer.scene.ProbeType.CUBE) {
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
        let needRepaint = false;
        const componentMap = cce.Component.queryAll();
        for (const key in componentMap) {
            const component = componentMap[key];
            if (component instanceof cc_1.ReflectionProbe) {
                if (component.cubemap?.uuid) {
                    let uuid = component.cubemap.uuid;
                    uuid = uuid.slice(0, uuid.lastIndexOf('@'));
                    const url = await Editor.Message.request('asset-db', 'query-url', uuid);
                    if (url) {
                        await Editor.Message.request('asset-db', 'delete-asset', url);
                    }
                    this._existFileSet.delete(uuid);
                    component.clearBakedCubemap();
                    needRepaint = true;
                }
            }
        }
        if (needRepaint) {
            cce.Engine.repaintInEditMode();
            this._saveProfile();
        }
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
    constructor() {
        this.waitingList = new Set();
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
            let pixelData = (0, graphics_1.readPixels)(probeComponent.probe.bakedCubeTextures[faceIdx]);
            if (caps.clipSpaceMinZ === -1) {
                pixelData = (0, graphics_1.flipImage)(pixelData, probeComponent['_resolution'], probeComponent['_resolution']);
            }
            (0, cc_1.assert)(pixelData !== null);
            await (0, graphics_1.saveDataToImage)(Buffer.from(pixelData), probeComponent['_resolution'], probeComponent['_resolution'], probeComponent.node.scene.name, fileName);
        }
        this._assertNotCancel();
        //use the tool to generate a cubemap and save to asset directory
        //reflection probe always use hdr
        const isHDR = true;
        await this._bakeReflectionProbe(files, isHDR, probeComponent.node.scene.name, probeComponent.uuid, probeComponent.probe.getProbeId(), probeComponent.fastBake);
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
    async _bakeReflectionProbe(files, isHDR, sceneName, probeComponentUUID, probeID, fastBake) {
        var _a, _b;
        const assetPath = await Editor.Message.request('asset-db', 'query-path', 'db://assets');
        if (assetPath === null) {
            console.error('[reflection-probe]: no asset directory');
            return;
        }
        const filePaths = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const path = (0, path_1.join)(assetPath, sceneName, fileName);
            filePaths.push(path);
            if (!(0, fs_extra_1.existsSync)(path)) {
                console.error(`[reflection-probe]: ${path} not exist`);
            }
        }
        const scenePath = (0, path_1.join)(assetPath, sceneName);
        if (!(0, fs_extra_1.existsSync)(scenePath)) {
            (0, fs_extra_1.mkdirSync)(scenePath);
        }
        const reflectionProbe = (0, path_1.join)(scenePath, 'reflectionProbe');
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
            reflectionProbeMapChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64'), reflectionProbeMapParams);
        }
        else {
            reflectionProbeMapChild = (0, child_process_1.spawn)((0, path_1.join)(Editor.App.path, '../tools/cmft/cmftRelease64.exe'), reflectionProbeMapParams);
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
        //手动烘焙需要清除导入器保存的卷积图缓存，避免加载上次的烘焙结果
        const cachePath = (0, path_1.join)(scenePath, `reflectionProbe_${probeID.toString()}_convolution`);
        for (let i = 0; i < 6; i++) {
            const mipmapPath = (0, path_1.join)(cachePath, 'mipmap_' + i.toString() + '.png');
            if ((0, fs_extra_1.existsSync)(mipmapPath)) {
                (0, fs_extra_1.removeSync)(mipmapPath);
            }
        }
        this._assertNotCancel();
        for (let i = 0; i < filePaths.length; i++) {
            (0, fs_extra_1.removeSync)(filePaths[i]);
        }
        const metaPath = reflectionProbeMapWithExt + '.meta';
        const mipBakeMode = fastBake ? 1 : 2;
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
                        mipBakeMode: mipBakeMode,
                    },
                },
            },
        };
        this.textureCubeURLMap.set(reflectionProbeSubAssetCubeMapURL, probeComponentUUID);
        if (!(0, fs_extra_1.existsSync)(metaPath)) {
            (0, fs_extra_1.outputJSONSync)(metaPath, meta, { spaces: 2 });
            await Editor.Message.request('asset-db', 'refresh-asset', reflectionProbeMapURL);
        }
        else {
            meta = (0, fs_extra_1.readJSONSync)(metaPath);
            // 修改erp-texture-cube的userData.mipBakeMode，用来对cubemap做卷积
            if (meta.userData?.type !== 'texture cube' || meta.subMetas?.b47c0?.userData?.mipBakeMode !== mipBakeMode) {
                meta.userData.type = 'texture cube';
                meta.userData.isRGBE = true;
                meta.subMetas ?? (meta.subMetas = {});
                (_a = meta.subMetas).b47c0 ?? (_a.b47c0 = {});
                (_b = meta.subMetas.b47c0).userData ?? (_b.userData = {});
                meta.subMetas.b47c0.userData.mipBakeMode = mipBakeMode;
                this._assertNotCancel();
                (0, fs_extra_1.outputJSONSync)(metaPath, meta, { spaces: 2 });
            }
        }
        await Editor.Message.request('asset-db', 'refresh-asset', (0, path_1.join)(assetPath, sceneName));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBd0g7QUFDeEgsaUVBQW9FO0FBQ3BFLGlEQUFvRDtBQUNwRCx1Q0FBbUc7QUFFbkcsZ0RBQTJFO0FBQzNFLCtCQUFxQztBQUlyQyxNQUFhLFdBQVc7SUFHcEIsSUFBVyxRQUFRO1FBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELElBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUNELFlBQ2MsS0FBc0I7SUFDaEMsZ0JBQWdCO0lBQ1QsTUFBa0I7SUFDekIsV0FBVztJQUNKLFdBQXdCO1FBSnJCLFVBQUssR0FBTCxLQUFLLENBQWlCO1FBRXpCLFdBQU0sR0FBTixNQUFNLENBQVk7UUFFbEIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7UUFaNUIsYUFBUSxHQUFHLEtBQUssQ0FBQztRQWNwQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNNLHlCQUF5QjtRQUM1QixPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQzFCLENBQUM7SUFDTixDQUFDO0NBQ0o7QUF4QkQsa0NBd0JDO0FBTUQsTUFBYSw0QkFBNEI7SUFFOUIsTUFBTSxDQUFDLFlBQVk7UUFDdEIsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksNEJBQTRCLEVBQUUsQ0FBQztJQUNoRSxDQUFDO0lBRU0sS0FBSyxDQUFDLE1BQU07UUFDZixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJ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QUFtQyxDQUFDLENBQUM7QUF1UmhOLE1BQU0sUUFBUSxHQUFHLDRCQUE0QixDQUFDLFlBQVksRUFBRSxDQUFDO0FBRWhELFFBQUEsT0FBTyxHQUFrRTtJQUNsRixZQUFZLEVBQUUsQ0FBQyxLQUF5QixFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQzFFLGFBQWEsRUFBRSxDQUFDLEtBQXlCLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDNUUsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUU7SUFDOUQsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7SUFDeEQsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7Q0FDN0QsQ0FBQztBQUVLLEtBQUssVUFBVSxJQUFJO0lBQ3RCLE1BQU0sUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzVCLENBQUM7QUFGRCxvQkFFQztBQUVELFNBQWdCLE1BQU07SUFDbEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFGRCx3QkFFQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgYXNzZXJ0LCBBc3NldCwgYXNzZXRNYW5hZ2VyLCBDb21wb25lbnQsIERpcmVjdG9yLCBkaXJlY3RvciwgUmVmbGVjdGlvblByb2JlLCByZW5kZXJlciwgVGV4dHVyZUN1YmUgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyIH0gZnJvbSAnY2MvZWRpdG9yL3JlZmxlY3Rpb24tcHJvYmUnO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgbWtkaXJTeW5jLCByZW1vdmUsIHJlYWRKU09OU3luYywgb3V0cHV0SlNPTlN5bmMsIHJlbW92ZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBRdWVyeUJha2VSZXN1bHQsIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvLCBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3QsIFJlZmxlY3Rpb25Qcm9iZU9wZXJhdGlvblJlcXVlc3QsIFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcmVhZFBpeGVscywgZmxpcEltYWdlLCBzYXZlRGF0YVRvSW1hZ2UgfSBmcm9tICcuLi91dGlscy9ncmFwaGljcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG50eXBlIFVSTCA9IHN0cmluZztcbnR5cGUgVVVJRCA9IHN0cmluZztcbnR5cGUgUHJvYmVDb21wb25lbnRVVUlEID0gc3RyaW5nO1xuZXhwb3J0IGNsYXNzIEJha2VDb21tYW5kIGltcGxlbWVudHMgUmVmbGVjdGlvblByb2JlQmFrZUluZm8ge1xuXG4gICAgcHVibGljIGlzQ2FuY2VsID0gZmFsc2U7XG4gICAgcHVibGljIGdldCBub2RlTmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9iZS5ub2RlLm5hbWU7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgdXVpZCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9iZS51dWlkO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJvdGVjdGVkIHByb2JlOiBSZWZsZWN0aW9uUHJvYmUsXG4gICAgICAgIC8qKiDlj5bmtojlvZPliY3lkb3ku6TnmoTmlrnms5UgKi9cbiAgICAgICAgcHVibGljIGNhbmNlbDogKCkgPT4gdm9pZCxcbiAgICAgICAgLyoqIOS4jeWGjeetieW+hSAqL1xuICAgICAgICBwdWJsaWMgc3RvcFdhaXRpbmc/OiAoKSA9PiB2b2lkLFxuICAgICkge1xuICAgICAgICB0aGlzLnN0b3BXYWl0aW5nID0gc3RvcFdhaXRpbmc/LmJpbmQodGhpcyk7XG4gICAgfVxuICAgIHB1YmxpYyB0b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCk6IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcbiAgICAgICAgICAgIG5vZGVOYW1lOiB0aGlzLm5vZGVOYW1lLFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyQ29uZmlnIHtcbiAgICByZWFkb25seSBmaWxlVVVJRHM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPlxufVxuXG5leHBvcnQgY2xhc3MgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlciBpbXBsZW1lbnRzIFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCwgUmVmbGVjdGlvblByb2JlT3BlcmF0aW9uUmVxdWVzdCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIEdFVF9JTlNUQU5DRSgpOiBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX0lOU1RBTkNFID8/IG5ldyBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG9uTG9hZCgpIHtcbiAgICAgICAgdGhpcy5fYmluZE9uQXNzZXRDaGFuZ2UgPSB0aGlzLm9uQXNzZXRDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgY2NlLkFzc2V0LmFkZExpc3RlbmVyKCdhc3NldC1jaGFuZ2UnLCB0aGlzLl9iaW5kT25Bc3NldENoYW5nZSk7XG4gICAgICAgIGNvbnN0IGZpbGVVVUlEU0Zyb21Db25maWcgPSAoYXdhaXQgdGhpcy5fZ2V0Q29uZmlnKCkpPy5maWxlVVVJRHM7XG4gICAgICAgIGNvbnN0IG5vbkV4aXN0RmlsZVVVSURTOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAoZmlsZVVVSURTRnJvbUNvbmZpZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmlsZVVVSURTRnJvbUNvbmZpZy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZmlsZVVVSURTRnJvbUNvbmZpZ1tpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vbkV4aXN0RmlsZVVVSURTLnB1c2godXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxlVVVJRFNGcm9tQ29uZmlnLmZpbHRlcihpdGVtID0+ICFub25FeGlzdEZpbGVVVUlEUy5pbmNsdWRlcyhpdGVtKSkuZm9yRWFjaChcbiAgICAgICAgICAgICAgICBpdGVtID0+IHRoaXMuX2V4aXN0RmlsZVNldC5hZGQoaXRlbSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRDb21wb25lbnRBc3NldChjb21wb25lbnRVVUlEOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9leGlzdEZpbGVTZXQuYWRkKHV1aWQuc2xpY2UoMCwgdXVpZC5sYXN0SW5kZXhPZignQCcpKSk7XG4gICAgICAgIHRoaXMuX3NhdmVQcm9maWxlKCk7XG4gICAgICAgIGNvbnN0IGFzc2V0OiBUZXh0dXJlQ3ViZSB8IG51bGwgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLmxvYWRBbnkodXVpZCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW3JlZmxlY3Rpb24tcHJvYmVdOiBhc3NldCBjYW4ndCBiZSBsb2FkOnthc3NldCgke3V1aWR9KX0scGxlYXNlIGVuc3VyZSB0aGF0IHJlc291cmNlcyBhcmUgaW1wb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGNjZS5Db21wb25lbnQucXVlcnkoY29tcG9uZW50VVVJRCk7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB7XG4gICAgICAgICAgICAgICAgLy8gaGFja++8mumcgOimgeinpuWPkeWcuuaZryBkaXJ0ee+8jOWQpuWImeWmguaenCBiYWtlIOWQju+8jOS4jeS/neWtmOeahOivne+8jOWIt+aWsOWcuuaZr+aIluiAhemHjeWQr+e8lui+keWZqOS8muS4ouWksSBjdWJlbWFwXG4gICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZElkID0gY2NlLlNjZW5lRmFjYWRlTWFuYWdlci5iZWdpblJlY29yZGluZyhjb21wb25lbnQubm9kZS51dWlkKTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuY3ViZW1hcCA9IGFzc2V0O1xuICAgICAgICAgICAgICAgIGNjZS5TY2VuZUZhY2FkZU1hbmFnZXIuZW5kUmVjb3JkaW5nKGNvbW1hbmRJZCk7XG4gICAgICAgICAgICAgICAgUmVmbGVjdGlvblByb2JlTWFuYWdlci5wcm9iZU1hbmFnZXIudXBkYXRlQmFrZWRDdWJlbWFwKGNvbXBvbmVudC5wcm9iZSk7XG4gICAgICAgICAgICAgICAgUmVmbGVjdGlvblByb2JlTWFuYWdlci5wcm9iZU1hbmFnZXIudXBkYXRlUHJldmlld1NwaGVyZShjb21wb25lbnQucHJvYmUpO1xuICAgICAgICAgICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdhaXRpbmdMaXN0OiBTZXQ8VVVJRD4gPSBuZXcgU2V0KCk7XG4gICAgYXN5bmMgb25Bc3NldENoYW5nZSh1dWlkOiBzdHJpbmcsIGFzc2V0SW5mbzogYW55LCBtZXRhOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBmb3IgKGNvbnN0IHVybCBvZiB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmtleXMoKSkge1xuICAgICAgICAgICAgaWYgKChhc3NldEluZm8udXJsIGFzIHN0cmluZykuc3RhcnRzV2l0aCh1cmwpICYmIGFzc2V0SW5mby51cmwgIT09IHVybCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FpdGluZ0xpc3QuYWRkKHV1aWQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmhhcyhhc3NldEluZm8udXJsKSkge1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRVVUlEID0gdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5nZXQoYXNzZXRJbmZvLnVybCkhO1xuICAgICAgICAgICAgY29uc3Qgb25TdWJBc3NldExvYWRlZCA9ICh0ZXh0dXJlQ3ViZUFzc2V0OiBUZXh0dXJlQ3ViZSwgc3ViQXNzZXRVVUlEOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLndhaXRpbmdMaXN0LmRlbGV0ZShzdWJBc3NldFVVSUQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1N1YkFzc2V0TG9hZGluZyA9IEFycmF5LmZyb20odGhpcy53YWl0aW5nTGlzdC52YWx1ZXMoKSkuc29tZShpdGVtID0+IGl0ZW0uc3RhcnRzV2l0aCh1dWlkKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNTdWJBc3NldExvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkQ29tcG9uZW50QXNzZXQoY29tcG9uZW50VVVJRCwgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0TWFuYWdlci5hc3NldExpc3RlbmVyLm9mZih1dWlkLCBvblN1YkFzc2V0TG9hZGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLmFzc2V0TGlzdGVuZXIub24odXVpZCwgb25TdWJBc3NldExvYWRlZCk7XG5cbiAgICAgICAgICAgIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZGVsZXRlKGFzc2V0SW5mby51cmwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9iaW5kT25Bc3NldENoYW5nZT86ICh1dWlkOiBzdHJpbmcsIGFzc2V0SW5mbzogYW55LCBtZXRhOiBhbnkpID0+IFByb21pc2U8dm9pZD47XG5cbiAgICAvKipcbiAgICAgKiDlvZPorrDlvZXlnKjmraQgbWFwIOeahOi1hOa6kOiiq+WvvOWFpeWujOaIkOaXtuWwhuinpuWPkeWvueW6lOeahOWbnuiwg++8jOW5tuS4lOWIoOmZpOiusOW9lVxuICAgICAqL1xuICAgIHByb3RlY3RlZCB0ZXh0dXJlQ3ViZVVSTE1hcCA9IG5ldyBNYXA8VVJMLCBQcm9iZUNvbXBvbmVudFVVSUQ+KCk7XG4gICAgcHVibGljIG9uVW5sb2FkKCkge1xuICAgICAgICB0aGlzLnN0b3BCYWtpbmcoKTtcbiAgICAgICAgdGhpcy5faXNDbGVhcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9maW5pc2hlZC5sZW5ndGggPSAwO1xuICAgICAgICBjY2UuQXNzZXQucmVtb3ZlTGlzdGVuZXIoJ2Fzc2V0LWNoYW5nZScsIHRoaXMuX2JpbmRPbkFzc2V0Q2hhbmdlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcEJha2luZygpIHtcbiAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLmZvckVhY2goaXRlbSA9PiBpdGVtLmNhbmNlbD8uKCkpO1xuICAgICAgICB0aGlzLl9iYWtlUXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8/LmNhbmNlbD8uKCk7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBwdWJsaWMgaXNCYWtpbmcodXVpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9iYWtlUXVldWUuc29tZShpdGVtID0+IGl0ZW0udXVpZCA9PT0gdXVpZCkgfHwgdGhpcy5fY3VycmVudEJha2luZ0luZm8/LnV1aWQgPT09IHV1aWQ7XG4gICAgfVxuICAgIHB1YmxpYyBiYWtlQ3ViZW1hcHMocHJvYmVVVUlEcz86IFJlYWRvbmx5QXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICBjb25zdCBwcm9iZU9yVVVJRHM6IFJlZmxlY3Rpb25Qcm9iZVtdID0gW107XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE1hcDogUmVhZG9ubHk8UmVjb3JkPHN0cmluZywgQ29tcG9uZW50Pj4gPSBjY2UuQ29tcG9uZW50LnF1ZXJ5QWxsKCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvbXBvbmVudE1hcCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50TWFwW2tleV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlICYmIGNvbXBvbmVudC5lbmFibGVkICYmIGNvbXBvbmVudC5ub2RlLmFjdGl2ZSAmJiBjb21wb25lbnQucHJvYmVUeXBlID09PSByZW5kZXJlci5zY2VuZS5Qcm9iZVR5cGUuQ1VCRSkge1xuICAgICAgICAgICAgICAgIGlmICghcHJvYmVVVUlEcyB8fCBwcm9iZVVVSURzLmluY2x1ZGVzKGNvbXBvbmVudC51dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9iZU9yVVVJRHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDlhYjplIHkvY/nrYnmlLbpm4bkuobmiYDmnInlkb3ku6TnmoTkv6Hmga/kuoblho0gbmV4dFRpY2tcbiAgICAgICAgdGhpcy5faXNMb2NrZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcHJvYmVPclVVSURzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgY29uc3QgcHJvYmVPclVVSUQgPSBwcm9iZU9yVVVJRHNbaW5kZXhdO1xuICAgICAgICAgICAgdGhpcy5fYmFrZUN1YmVtYXAocHJvYmVPclVVSUQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fY3VycmVudEJha2luZ0luZm8pIHtcbiAgICAgICAgICAgIHRoaXMubmV4dFRpY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJywgdGhpcy5xdWVyeUFsbEJha2VJbmZvcygpKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIHB1YmxpYyBxdWVyeUFsbEJha2VJbmZvcygpOiBRdWVyeUJha2VSZXN1bHQge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSB0aGlzLl9iYWtlUXVldWUubWFwKChpdGVtKSA9PiBpdGVtLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRJbmZvOiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbyB8IHVuZGVmaW5lZCA9IHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW1haW5pbmcsXG4gICAgICAgICAgICBjdXJyZW50SW5mbyxcbiAgICAgICAgICAgIGZpbmlzaGVkOiB0aGlzLl9maW5pc2hlZCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcHVibGljIGFzeW5jIGNsZWFyUmVzdWx0cygpIHtcbiAgICAgICAgbGV0IG5lZWRSZXBhaW50ID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE1hcDogUmVhZG9ubHk8UmVjb3JkPHN0cmluZywgQ29tcG9uZW50Pj4gPSBjY2UuQ29tcG9uZW50LnF1ZXJ5QWxsKCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvbXBvbmVudE1hcCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50TWFwW2tleV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5jdWJlbWFwPy51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1dWlkID0gY29tcG9uZW50LmN1YmVtYXAudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgdXVpZCA9IHV1aWQuc2xpY2UoMCwgdXVpZC5sYXN0SW5kZXhPZignQCcpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktdXJsJywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2RlbGV0ZS1hc3NldCcsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXhpc3RGaWxlU2V0LmRlbGV0ZSh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LmNsZWFyQmFrZWRDdWJlbWFwKCk7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRSZXBhaW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5lZWRSZXBhaW50KSB7XG4gICAgICAgICAgICBjY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgICAgICB0aGlzLl9zYXZlUHJvZmlsZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBjYW5jZWxCYWtlcyhyZWZsZWN0UHJvYmVVVUlEcz86IHJlYWRvbmx5IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgICAgIGlmICghcmVmbGVjdFByb2JlVVVJRHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5jYW5jZWwoKSk7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8uY2FuY2VsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVmbGVjdFByb2JlVVVJRHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHJlZmxlY3RQcm9iZVVVSURzW2luZGV4XTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8udXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mby5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fYmFrZVF1ZXVlLmZpbmQoaXRlbSA9PiBpdGVtLnV1aWQgPT09IHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtPy5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfVxuICAgIHB1YmxpYyAnc3RhcnQtYmFrZScocmVmbGVjdFByb2JlVVVJRHM/OiBSZWFkb25seUFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFrZUN1YmVtYXBzKHJlZmxlY3RQcm9iZVVVSURzKTtcbiAgICB9XG4gICAgcHVibGljICdjYW5jZWwtYmFrZScocmVmbGVjdFByb2JlVVVJRHM/OiBSZWFkb25seUFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuY2VsQmFrZXMocmVmbGVjdFByb2JlVVVJRHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyAnY2xlYXItcmVzdWx0cycoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuX2lzQ2xlYXJpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJywgdGhpcy5faXNDbGVhcmluZyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2xlYXJSZXN1bHRzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbcmVmbGVjdGlvbi1wcm9iZV06IENsZWFyIHJlc3VsdCBmYWlsZWRgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faXNDbGVhcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJywgdGhpcy5faXNDbGVhcmluZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHVibGljICdxdWVyeS1iYWtlLWluZm8nKCk6IFF1ZXJ5QmFrZVJlc3VsdCB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5QWxsQmFrZUluZm9zKCk7XG4gICAgfVxuICAgIHB1YmxpYyAncXVlcnktaXMtY2xlYXJpbmcnKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNDbGVhcmluZztcbiAgICB9XG4gICAgcHVibGljIGdldCBpc0J1c3koKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0xvY2tlZDtcbiAgICB9XG4gICAgLyoqIOS/neWtmCBwcm9maWxlICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9zYXZlUHJvZmlsZSgpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0UHJvamVjdCgnc2NlbmUnLCBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCwgWy4uLnRoaXMuX2V4aXN0RmlsZVNldC52YWx1ZXMoKV0pO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIF9JTlNUQU5DRTogRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlcjtcbiAgICAvKiogcHJvZmlsZSDkuK3mlofku7blrZjmlL7nmoTot6/lvoQgKi9cbiAgICBwcm90ZWN0ZWQgc3RhdGljIF9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCA9ICdyZWZsZWN0aW9uLXByb2JlLmZpbGVVVUlEcyc7XG4gICAgLyoqIOeUn+aIkOeahOi1hOa6kOeahCB1dWlkICovXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9leGlzdEZpbGVTZXQ6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuICAgIHByb3RlY3RlZCBhc3luYyBfZ2V0Q29uZmlnKCk6IFByb21pc2U8UmVmbGVjdGlvblByb2JlTWFuYWdlckNvbmZpZyB8IG51bGw+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygnc2NlbmUnLCBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCwgJ2xvY2FsJykgYXMgUmVmbGVjdGlvblByb2JlTWFuYWdlckNvbmZpZztcbiAgICB9XG4gICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9JTlNUQU5DRSA9IHRoaXM7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iYWtlUXVldWU6IEJha2VDb21tYW5kW10gPSBbXTtcbiAgICBwcm90ZWN0ZWQgX2lzTG9ja2VkID0gZmFsc2U7XG5cbiAgICBwcm90ZWN0ZWQgX2N1cnJlbnRCYWtpbmdJbmZvOiBCYWtlQ29tbWFuZCB8IHVuZGVmaW5lZDtcbiAgICBwcm90ZWN0ZWQgc3RhdGljIEJST0FEQ0FTVF9NRVNTQUdFOiBBcnJheTxrZXlvZiBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3Q+ID0gWydyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJywgJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCcsICdyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCcsICdyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nXTtcbiAgICBwcm90ZWN0ZWQgX2Jyb2FkY2FzdDxUIGV4dGVuZHMga2V5b2YgUmVmbGVjdGlvblByb2JlQnJvYWRjYXN0PihtZXNzYWdlOiBULCAuLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFtUXT4pOiB2b2lkIHtcbiAgICAgICAgaWYgKEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuQlJPQURDQVNUX01FU1NBR0UuaW5jbHVkZXMobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdChtZXNzYWdlLCAuLi5hcmdzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW3JlZmxlY3Rpb24tcHJvYmVdOiBtZXNzYWdlOiAke21lc3NhZ2V9IGlzIG5vdCBleGlzdGApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHByb3RlY3RlZCBuZXh0VGljaygpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IHRoaXMuX2Jha2VRdWV1ZS5wb3AoKTtcbiAgICAgICAgaWYgKHRhc2spIHtcbiAgICAgICAgICAgIHRhc2suc3RvcFdhaXRpbmchKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLl9maW5pc2hlZC5sZW5ndGggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJywgdGhpc1sncXVlcnktYmFrZS1pbmZvJ10oKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBwcm9iZU9yVVVJRCBcbiAgICAgKiBAcmV0dXJucyDmmK/lkKbng5jnhJnmiJDlip9cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2Jha2VDdWJlbWFwKHByb2JlT3JVVUlEOiBzdHJpbmcgfCBSZWZsZWN0aW9uUHJvYmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgcHJvYmUgPSBwcm9iZU9yVVVJRCBpbnN0YW5jZW9mIFJlZmxlY3Rpb25Qcm9iZSA/IHByb2JlT3JVVUlEIDogY2NlLkNvbXBvbmVudC5xdWVyeShwcm9iZU9yVVVJRCk7XG4gICAgICAgIGlmICghKHByb2JlIGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB8fCAhcHJvYmUuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmFrZUNvbW1hbmQ6IEJha2VDb21tYW5kID0gbmV3IEJha2VDb21tYW5kKFxuICAgICAgICAgICAgcHJvYmUsXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuaXNDYW5jZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRocm93ICdjYW5jZWwnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmFraW5nKHByb2JlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9pc0xvY2tlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlV2FpdCwgcmVqZWN0V2FpdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5pc0NhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3RXYWl0KCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuc3RvcFdhaXRpbmcgPSAoKSA9PiByZXNvbHZlV2FpdCh2b2lkIDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9iYWtlUXVldWUucHVzaChiYWtlQ29tbWFuZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lzTG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gYmFrZUNvbW1hbmQ7XG4gICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbycsIHRoaXNbJ3F1ZXJ5LWJha2UtaW5mbyddKCkpO1xuICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmJha2Utc3RhcnQnLCBiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25GaW5pc2ggPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmluaXNoZWQucHVzaChiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRpY2soKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuX2NhcHR1cmVDdWJlKHByb2JlKVxuICAgICAgICAgICAgICAgIC50aGVuKHZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJywgbnVsbCwgYmFrZUNvbW1hbmQudG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnLCBlcnIsIGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShvbkZpbmlzaCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IgPT09ICdjYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9iYWtlUXVldWUuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS51dWlkID09PSBiYWtlQ29tbWFuZC51dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFt1cmwsIHV1aWRdIG9mIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXVpZCA9PT0gYmFrZUNvbW1hbmQudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZGVsZXRlKHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQGVuIFJlbmRlciB0aGUgc2l4IGZhY2VzIG9mIHRoZSBQcm9iZSBhbmQgdXNlIHRoZSB0b29sIHRvIGdlbmVyYXRlIGEgY3ViZW1hcCBhbmQgc2F2ZSBpdCB0byB0aGUgYXNzZXQgZGlyZWN0b3J5LlxuICAgICAqIEB6aCDmuLLmn5NQcm9iZeeahDbkuKrpnaLvvIzlubbkuJTkvb/nlKjlt6XlhbfnlJ/miJBjdWJlbWFw5L+d5a2Y6IezYXNzZXTnm67lvZXjgIJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2NhcHR1cmVDdWJlKHByb2JlQ29tcG9uZW50OiBSZWZsZWN0aW9uUHJvYmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm87XG4gICAgICAgIHByb2JlQ29tcG9uZW50LnByb2JlLmNhcHR1cmVDdWJlbWFwKCk7XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICBhd2FpdCB0aGlzLl93YWl0Rm9yTmV4dEZyYW1lKCk7XG4gICAgICAgIC8vU2F2ZSByZW5kZXJ0ZXh0dXJlIGRhdGEgdG8gdGhlIHJlc291cmNlIGRpcmVjdG9yeVxuICAgICAgICBjb25zdCBjYXBzID0gKGRpcmVjdG9yLnJvb3QhKS5kZXZpY2UuY2FwYWJpbGl0aWVzO1xuICAgICAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgZmFjZUlkeCA9IDA7IGZhY2VJZHggPCA2OyBmYWNlSWR4KyspIHtcbiAgICAgICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgY2FwdHVyZV8ke2ZhY2VJZHh9LnBuZ2A7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIGxldCBwaXhlbERhdGEgPSByZWFkUGl4ZWxzKHByb2JlQ29tcG9uZW50LnByb2JlLmJha2VkQ3ViZVRleHR1cmVzW2ZhY2VJZHhdKTtcbiAgICAgICAgICAgIGlmIChjYXBzLmNsaXBTcGFjZU1pblogPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcGl4ZWxEYXRhID0gZmxpcEltYWdlKHBpeGVsRGF0YSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10sIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzc2VydChwaXhlbERhdGEgIT09IG51bGwpO1xuICAgICAgICAgICAgYXdhaXQgc2F2ZURhdGFUb0ltYWdlKEJ1ZmZlci5mcm9tKHBpeGVsRGF0YSksIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddLCBwcm9iZUNvbXBvbmVudFsnX3Jlc29sdXRpb24nXSwgcHJvYmVDb21wb25lbnQubm9kZS5zY2VuZS5uYW1lLCBmaWxlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgIC8vdXNlIHRoZSB0b29sIHRvIGdlbmVyYXRlIGEgY3ViZW1hcCBhbmQgc2F2ZSB0byBhc3NldCBkaXJlY3RvcnlcbiAgICAgICAgLy9yZWZsZWN0aW9uIHByb2JlIGFsd2F5cyB1c2UgaGRyXG4gICAgICAgIGNvbnN0IGlzSERSID0gdHJ1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5fYmFrZVJlZmxlY3Rpb25Qcm9iZShmaWxlcywgaXNIRFIsIHByb2JlQ29tcG9uZW50Lm5vZGUuc2NlbmUubmFtZSwgcHJvYmVDb21wb25lbnQudXVpZCwgcHJvYmVDb21wb25lbnQucHJvYmUuZ2V0UHJvYmVJZCgpLCBwcm9iZUNvbXBvbmVudC5mYXN0QmFrZSk7XG5cbiAgICAgICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBfd2FpdEZvck5leHRGcmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGRpcmVjdG9yLm9uY2UoRGlyZWN0b3IuRVZFTlRfRU5EX0ZSQU1FLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgX2Fzc2VydE5vdENhbmNlbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy5pc0NhbmNlbCkge1xuICAgICAgICAgICAgdGhyb3cgJ2NhbmNlbCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIGZpbGVzIFxuICAgICAqIEBwYXJhbSBpc0hEUiBcbiAgICAgKiBAcGFyYW0gc2NlbmVOYW1lIFxuICAgICAqIEBwYXJhbSBwcm9iZUNvbXBvbmVudFVVSUQgXG4gICAgICogQHBhcmFtIHByb2JlSUQgXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfYmFrZVJlZmxlY3Rpb25Qcm9iZShmaWxlczogc3RyaW5nW10sIGlzSERSOiBib29sZWFuLCBzY2VuZU5hbWU6IHN0cmluZywgcHJvYmVDb21wb25lbnRVVUlEOiBzdHJpbmcsIHByb2JlSUQ6IG51bWJlciwgZmFzdEJha2U6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYXNzZXRQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsICdkYjovL2Fzc2V0cycpO1xuICAgICAgICBpZiAoYXNzZXRQYXRoID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbcmVmbGVjdGlvbi1wcm9iZV06IG5vIGFzc2V0IGRpcmVjdG9yeScpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsZVBhdGhzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGVzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGpvaW4oYXNzZXRQYXRoLCBzY2VuZU5hbWUsIGZpbGVOYW1lKTtcbiAgICAgICAgICAgIGZpbGVQYXRocy5wdXNoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFleGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW3JlZmxlY3Rpb24tcHJvYmVdOiAke3BhdGh9IG5vdCBleGlzdGApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY2VuZVBhdGggPSBqb2luKGFzc2V0UGF0aCwgc2NlbmVOYW1lKTtcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKHNjZW5lUGF0aCkpIHtcbiAgICAgICAgICAgIG1rZGlyU3luYyhzY2VuZVBhdGgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZSA9IGpvaW4oc2NlbmVQYXRoLCAncmVmbGVjdGlvblByb2JlJyk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcCA9IHJlZmxlY3Rpb25Qcm9iZSArICdfJyArIHByb2JlSUQudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlTWFwV2l0aEV4dCA9IHJlZmxlY3Rpb25Qcm9iZSArICdfJyArIHByb2JlSUQudG9TdHJpbmcoKSArICcucG5nJztcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlTWFwVVJMID0gYGRiOi8vYXNzZXRzLyR7c2NlbmVOYW1lfS9yZWZsZWN0aW9uUHJvYmVfJHtwcm9iZUlELnRvU3RyaW5nKCl9LnBuZ2A7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZVN1YkFzc2V0Q3ViZU1hcFVSTCA9IHJlZmxlY3Rpb25Qcm9iZU1hcFVSTCArICcvdGV4dHVyZUN1YmUnO1xuXG4gICAgICAgIGNvbnN0IGxkckhkckZvcm1hdFN0cmluZyA9IGlzSERSID8gJ3JnYm0nIDogJ2JncmE4JztcblxuICAgICAgICBsZXQgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQ6IENoaWxkUHJvY2VzcztcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlTWFwUGFyYW1zID0gW1xuICAgICAgICAgICAgJy0tYnlwYXNzb3V0cHV0dHlwZScsXG4gICAgICAgICAgICAnLS1vdXRwdXQwcGFyYW1zJyxcbiAgICAgICAgICAgICdwbmcsJyArIGxkckhkckZvcm1hdFN0cmluZyArICcsbGF0bG9uZycsXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VQb3NYJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1swXSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZU5lZ1gnLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzFdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlUG9zWScsXG4gICAgICAgICAgICBmaWxlUGF0aHNbMl0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VOZWdZJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1szXSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZVBvc1onLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzRdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlTmVnWicsXG4gICAgICAgICAgICBmaWxlUGF0aHNbNV0sXG4gICAgICAgICAgICAnLS1vdXRwdXQwJyxcbiAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcCxcbiAgICAgICAgXTtcblxuICAgICAgICBpZiAoaXNIRFIpIHtcbiAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcFBhcmFtcy5zcGxpY2UoMCwgMCwgJy0tcmdibScpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQnKSwgcmVmbGVjdGlvblByb2JlTWFwUGFyYW1zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkID0gc3Bhd24oam9pbihFZGl0b3IuQXBwLnBhdGgsICcuLi90b29scy9jbWZ0L2NtZnRSZWxlYXNlNjQuZXhlJyksIHJlZmxlY3Rpb25Qcm9iZU1hcFBhcmFtcyk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvbkNsb3NlID0gKGNvZGU6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbcmVmbGVjdGlvbi1wcm9iZV06IGJha2UgcmVmbGVjdGlvblByb2JlIGZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGNvZGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShjb2RlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyEuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvIS5pc0NhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgb25DbG9zZSk7XG4gICAgICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQua2lsbCgpO1xuICAgICAgICAgICAgICAgIHJlamVjdCgnY2FuY2VsJyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZC5vbignY2xvc2UnLCBvbkNsb3NlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy/miYvliqjng5jnhJnpnIDopoHmuIXpmaTlr7zlhaXlmajkv53lrZjnmoTljbfnp6/lm77nvJPlrZjvvIzpgb/lhY3liqDovb3kuIrmrKHnmoTng5jnhJnnu5PmnpxcbiAgICAgICAgY29uc3QgY2FjaGVQYXRoID0gam9pbihzY2VuZVBhdGgsIGByZWZsZWN0aW9uUHJvYmVfJHtwcm9iZUlELnRvU3RyaW5nKCl9X2NvbnZvbHV0aW9uYCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNjsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBtaXBtYXBQYXRoID0gam9pbihjYWNoZVBhdGgsICdtaXBtYXBfJyArIGkudG9TdHJpbmcoKSArICcucG5nJyk7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhtaXBtYXBQYXRoKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVN5bmMobWlwbWFwUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlUGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlbW92ZVN5bmMoZmlsZVBhdGhzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtZXRhUGF0aCA9IHJlZmxlY3Rpb25Qcm9iZU1hcFdpdGhFeHQgKyAnLm1ldGEnO1xuICAgICAgICBjb25zdCBtaXBCYWtlTW9kZSA9IGZhc3RCYWtlID8gMSA6IDI7XG4gICAgICAgIGxldCBtZXRhOiBhbnkgPSB7XG4gICAgICAgICAgICB2ZXI6ICcwLjAuMCcsXG4gICAgICAgICAgICBpbXBvcnRlcjogJyonLFxuICAgICAgICAgICAgdXNlckRhdGE6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dHVyZSBjdWJlJyxcbiAgICAgICAgICAgICAgICBpc1JHQkU6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3ViTWV0YXM6IHtcbiAgICAgICAgICAgICAgICBiNDdjMDoge1xuICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWlwQmFrZU1vZGU6IG1pcEJha2VNb2RlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLnNldChyZWZsZWN0aW9uUHJvYmVTdWJBc3NldEN1YmVNYXBVUkwsIHByb2JlQ29tcG9uZW50VVVJRCk7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhtZXRhUGF0aCkpIHtcbiAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCByZWZsZWN0aW9uUHJvYmVNYXBVUkwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWV0YSA9IHJlYWRKU09OU3luYyhtZXRhUGF0aCk7XG4gICAgICAgICAgICAvLyDkv67mlLllcnAtdGV4dHVyZS1jdWJl55qEdXNlckRhdGEubWlwQmFrZU1vZGXvvIznlKjmnaXlr7ljdWJlbWFw5YGa5Y2356evXG4gICAgICAgICAgICBpZiAobWV0YS51c2VyRGF0YT8udHlwZSAhPT0gJ3RleHR1cmUgY3ViZScgfHwgbWV0YS5zdWJNZXRhcz8uYjQ3YzA/LnVzZXJEYXRhPy5taXBCYWtlTW9kZSAhPT0gbWlwQmFrZU1vZGUpIHtcbiAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLnR5cGUgPSAndGV4dHVyZSBjdWJlJztcbiAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLmlzUkdCRSA9IHRydWU7XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcyA/Pz0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMCA/Pz0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMC51c2VyRGF0YSA/Pz0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMC51c2VyRGF0YS5taXBCYWtlTW9kZSA9IG1pcEJha2VNb2RlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCBqb2luKGFzc2V0UGF0aCwgc2NlbmVOYW1lKSk7XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuXG4gICAgfVxuICAgIC8qKiDmmK/lkKbmiYDmnInnmoTor7fmsYLpg73mlLbpm4blrozkuoYgKi9cbiAgICBwcm90ZWN0ZWQgX2lzQ2xlYXJpbmcgPSBmYWxzZTtcbiAgICAvKiog5a6M5oiQ54OY54SZ55qE5pWw6YePICovXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9maW5pc2hlZDogUmVmbGVjdGlvblByb2JlQmFrZUluZm9bXSA9IFtdO1xuXG59XG5cbmNvbnN0IGluc3RhbmNlID0gRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5HRVRfSU5TVEFOQ0UoKTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCAmIFJlZmxlY3Rpb25Qcm9iZU9wZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgJ3N0YXJ0LWJha2UnOiAodXVpZHM/OiByZWFkb25seSBzdHJpbmdbXSkgPT4gaW5zdGFuY2VbJ3N0YXJ0LWJha2UnXSh1dWlkcyksXG4gICAgJ2NhbmNlbC1iYWtlJzogKHV1aWRzPzogcmVhZG9ubHkgc3RyaW5nW10pID0+IGluc3RhbmNlWydjYW5jZWxCYWtlcyddKHV1aWRzKSxcbiAgICAnY2xlYXItcmVzdWx0cyc6IGFzeW5jICgpID0+IGF3YWl0IGluc3RhbmNlWydjbGVhci1yZXN1bHRzJ10oKSxcbiAgICAncXVlcnktYmFrZS1pbmZvJzogKCkgPT4gaW5zdGFuY2VbJ3F1ZXJ5QWxsQmFrZUluZm9zJ10oKSxcbiAgICAncXVlcnktaXMtY2xlYXJpbmcnOiAoKSA9PiBpbnN0YW5jZVsncXVlcnktaXMtY2xlYXJpbmcnXSgpLFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgYXdhaXQgaW5zdGFuY2Uub25Mb2FkKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7XG4gICAgaW5zdGFuY2Uub25VbmxvYWQoKTtcbn0iXX0=