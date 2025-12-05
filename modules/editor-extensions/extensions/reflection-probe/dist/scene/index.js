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
                component.cubemap = asset;
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
        //手动烘焙需要清除导入器保存的卷积图缓存，避免加载上次的烘焙结果
        const cachePath = path_1.join(scenePath, `reflectionProbe_${probeID.toString()}_convolution`);
        for (let i = 0; i < 6; i++) {
            const mipmapPath = path_1.join(cachePath, 'mipmap_' + i.toString() + '.png');
            if (fs_extra_1.existsSync(mipmapPath)) {
                fs_extra_1.removeSync(mipmapPath);
            }
        }
        this._assertNotCancel();
        for (let i = 0; i < filePaths.length; i++) {
            fs_extra_1.removeSync(filePaths[i]);
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
        if (!fs_extra_1.existsSync(metaPath)) {
            fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
            await Editor.Message.request('asset-db', 'refresh-asset', reflectionProbeMapURL);
        }
        else {
            meta = fs_extra_1.readJSONSync(metaPath);
            // 修改erp-texture-cube的userData.mipBakeMode，用来对cubemap做卷积
            if (meta.userData?.type !== 'texture cube' || meta.subMetas?.b47c0?.userData?.mipBakeMode !== mipBakeMode) {
                meta.userData.type = 'texture cube';
                meta.subMetas ?? (meta.subMetas = {});
                (_a = meta.subMetas).b47c0 ?? (_a.b47c0 = {});
                (_b = meta.subMetas.b47c0).userData ?? (_b.userData = {});
                meta.subMetas.b47c0.userData.mipBakeMode = mipBakeMode;
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
        await Editor.Message.request('asset-db', 'refresh-asset', path_1.join(assetPath, sceneName));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBd0g7QUFDeEgsaUVBQW9FO0FBQ3BFLGlEQUFvRDtBQUNwRCx1Q0FBbUc7QUFFbkcsZ0RBQTJFO0FBQzNFLCtCQUFxQztBQUlyQyxNQUFhLFdBQVc7SUFTcEIsWUFDYyxLQUFzQjtJQUNoQyxnQkFBZ0I7SUFDVCxNQUFrQjtJQUN6QixXQUFXO0lBQ0osV0FBd0I7UUFKckIsVUFBSyxHQUFMLEtBQUssQ0FBaUI7UUFFekIsV0FBTSxHQUFOLE1BQU0sQ0FBWTtRQUVsQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQVo1QixhQUFRLEdBQUcsS0FBSyxDQUFDO1FBY3BCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBZEQsSUFBVyxRQUFRO1FBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELElBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQVVNLHlCQUF5QjtRQUM1QixPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQzFCLENBQUM7SUFDTixDQUFDO0NBQ0o7QUF4QkQsa0NBd0JDO0FBTUQsTUFBYSw0QkFBNEI7SUF1TnJDO1FBbEtBLGdCQUFXLEdBQWMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQTRCbkM7O1dBRUc7UUFDTyxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztRQThIakUsa0JBQWtCO1FBQ0Msa0JBQWEsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQVFoRCxlQUFV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QUFLLENBQUM7SUFDNUUsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUU7SUFDOUQsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7SUFDeEQsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUU7Q0FDN0QsQ0FBQztBQUVLLEtBQUssVUFBVSxJQUFJO0lBQ3RCLE1BQU0sUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzVCLENBQUM7QUFGRCxvQkFFQztBQUVELFNBQWdCLE1BQU07SUFDbEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFGRCx3QkFFQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgYXNzZXJ0LCBBc3NldCwgYXNzZXRNYW5hZ2VyLCBDb21wb25lbnQsIERpcmVjdG9yLCBkaXJlY3RvciwgUmVmbGVjdGlvblByb2JlLCByZW5kZXJlciwgVGV4dHVyZUN1YmUgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyIH0gZnJvbSAnY2MvZWRpdG9yL3JlZmxlY3Rpb24tcHJvYmUnO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgbWtkaXJTeW5jLCByZW1vdmUsIHJlYWRKU09OU3luYywgb3V0cHV0SlNPTlN5bmMsIHJlbW92ZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBRdWVyeUJha2VSZXN1bHQsIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvLCBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3QsIFJlZmxlY3Rpb25Qcm9iZU9wZXJhdGlvblJlcXVlc3QsIFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcmVhZFBpeGVscywgZmxpcEltYWdlLCBzYXZlRGF0YVRvSW1hZ2UgfSBmcm9tICcuLi91dGlscy9ncmFwaGljcyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG50eXBlIFVSTCA9IHN0cmluZztcbnR5cGUgVVVJRCA9IHN0cmluZztcbnR5cGUgUHJvYmVDb21wb25lbnRVVUlEID0gc3RyaW5nO1xuZXhwb3J0IGNsYXNzIEJha2VDb21tYW5kIGltcGxlbWVudHMgUmVmbGVjdGlvblByb2JlQmFrZUluZm8ge1xuXG4gICAgcHVibGljIGlzQ2FuY2VsID0gZmFsc2U7XG4gICAgcHVibGljIGdldCBub2RlTmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9iZS5ub2RlLm5hbWU7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgdXVpZCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9iZS51dWlkO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJvdGVjdGVkIHByb2JlOiBSZWZsZWN0aW9uUHJvYmUsXG4gICAgICAgIC8qKiDlj5bmtojlvZPliY3lkb3ku6TnmoTmlrnms5UgKi9cbiAgICAgICAgcHVibGljIGNhbmNlbDogKCkgPT4gdm9pZCxcbiAgICAgICAgLyoqIOS4jeWGjeetieW+hSAqL1xuICAgICAgICBwdWJsaWMgc3RvcFdhaXRpbmc/OiAoKSA9PiB2b2lkLFxuICAgICkge1xuICAgICAgICB0aGlzLnN0b3BXYWl0aW5nID0gc3RvcFdhaXRpbmc/LmJpbmQodGhpcyk7XG4gICAgfVxuICAgIHB1YmxpYyB0b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCk6IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcbiAgICAgICAgICAgIG5vZGVOYW1lOiB0aGlzLm5vZGVOYW1lLFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyQ29uZmlnIHtcbiAgICByZWFkb25seSBmaWxlVVVJRHM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPlxufVxuXG5leHBvcnQgY2xhc3MgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlciBpbXBsZW1lbnRzIFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCwgUmVmbGVjdGlvblByb2JlT3BlcmF0aW9uUmVxdWVzdCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIEdFVF9JTlNUQU5DRSgpOiBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX0lOU1RBTkNFID8/IG5ldyBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG9uTG9hZCgpIHtcbiAgICAgICAgdGhpcy5fYmluZE9uQXNzZXRDaGFuZ2UgPSB0aGlzLm9uQXNzZXRDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgY2NlLkFzc2V0LmFkZExpc3RlbmVyKCdhc3NldC1jaGFuZ2UnLCB0aGlzLl9iaW5kT25Bc3NldENoYW5nZSk7XG4gICAgICAgIGNvbnN0IGZpbGVVVUlEU0Zyb21Db25maWcgPSAoYXdhaXQgdGhpcy5fZ2V0Q29uZmlnKCkpPy5maWxlVVVJRHM7XG4gICAgICAgIGNvbnN0IG5vbkV4aXN0RmlsZVVVSURTOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAoZmlsZVVVSURTRnJvbUNvbmZpZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmlsZVVVSURTRnJvbUNvbmZpZy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZmlsZVVVSURTRnJvbUNvbmZpZ1tpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vbkV4aXN0RmlsZVVVSURTLnB1c2godXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxlVVVJRFNGcm9tQ29uZmlnLmZpbHRlcihpdGVtID0+ICFub25FeGlzdEZpbGVVVUlEUy5pbmNsdWRlcyhpdGVtKSkuZm9yRWFjaChcbiAgICAgICAgICAgICAgICBpdGVtID0+IHRoaXMuX2V4aXN0RmlsZVNldC5hZGQoaXRlbSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRDb21wb25lbnRBc3NldChjb21wb25lbnRVVUlEOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9leGlzdEZpbGVTZXQuYWRkKHV1aWQuc2xpY2UoMCwgdXVpZC5sYXN0SW5kZXhPZignQCcpKSk7XG4gICAgICAgIHRoaXMuX3NhdmVQcm9maWxlKCk7XG4gICAgICAgIGNvbnN0IGFzc2V0OiBUZXh0dXJlQ3ViZSB8IG51bGwgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLmxvYWRBbnkodXVpZCwgKGVycm9yOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW3JlZmxlY3Rpb24tcHJvYmVdOiBhc3NldCBjYW4ndCBiZSBsb2FkOnthc3NldCgke3V1aWR9KX0scGxlYXNlIGVuc3VyZSB0aGF0IHJlc291cmNlcyBhcmUgaW1wb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGNjZS5Db21wb25lbnQucXVlcnkoY29tcG9uZW50VVVJRCk7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LmN1YmVtYXAgPSBhc3NldDtcbiAgICAgICAgICAgICAgICBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLnByb2JlTWFuYWdlci51cGRhdGVCYWtlZEN1YmVtYXAoY29tcG9uZW50LnByb2JlKTtcbiAgICAgICAgICAgICAgICBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLnByb2JlTWFuYWdlci51cGRhdGVQcmV2aWV3U3BoZXJlKGNvbXBvbmVudC5wcm9iZSk7XG4gICAgICAgICAgICAgICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2FpdGluZ0xpc3Q6IFNldDxVVUlEPiA9IG5ldyBTZXQoKTtcbiAgICBhc3luYyBvbkFzc2V0Q2hhbmdlKHV1aWQ6IHN0cmluZywgYXNzZXRJbmZvOiBhbnksIG1ldGE6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGZvciAoY29uc3QgdXJsIG9mIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAua2V5cygpKSB7XG4gICAgICAgICAgICBpZiAoKGFzc2V0SW5mby51cmwgYXMgc3RyaW5nKS5zdGFydHNXaXRoKHVybCkgJiYgYXNzZXRJbmZvLnVybCAhPT0gdXJsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YWl0aW5nTGlzdC5hZGQodXVpZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuaGFzKGFzc2V0SW5mby51cmwpKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFVVSUQgPSB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmdldChhc3NldEluZm8udXJsKSE7XG4gICAgICAgICAgICBjb25zdCBvblN1YkFzc2V0TG9hZGVkID0gKHRleHR1cmVDdWJlQXNzZXQ6IFRleHR1cmVDdWJlLCBzdWJBc3NldFVVSUQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMud2FpdGluZ0xpc3QuZGVsZXRlKHN1YkFzc2V0VVVJRCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzU3ViQXNzZXRMb2FkaW5nID0gQXJyYXkuZnJvbSh0aGlzLndhaXRpbmdMaXN0LnZhbHVlcygpKS5zb21lKGl0ZW0gPT4gaXRlbS5zdGFydHNXaXRoKHV1aWQpKTtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc1N1YkFzc2V0TG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRDb21wb25lbnRBc3NldChjb21wb25lbnRVVUlELCB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLmFzc2V0TGlzdGVuZXIub2ZmKHV1aWQsIG9uU3ViQXNzZXRMb2FkZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhc3NldE1hbmFnZXIuYXNzZXRMaXN0ZW5lci5vbih1dWlkLCBvblN1YkFzc2V0TG9hZGVkKTtcblxuICAgICAgICAgICAgdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5kZWxldGUoYXNzZXRJbmZvLnVybCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2JpbmRPbkFzc2V0Q2hhbmdlPzogKHV1aWQ6IHN0cmluZywgYXNzZXRJbmZvOiBhbnksIG1ldGE6IGFueSkgPT4gUHJvbWlzZTx2b2lkPjtcblxuICAgIC8qKlxuICAgICAqIOW9k+iusOW9leWcqOatpCBtYXAg55qE6LWE5rqQ6KKr5a+85YWl5a6M5oiQ5pe25bCG6Kem5Y+R5a+55bqU55qE5Zue6LCD77yM5bm25LiU5Yig6Zmk6K6w5b2VXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHRleHR1cmVDdWJlVVJMTWFwID0gbmV3IE1hcDxVUkwsIFByb2JlQ29tcG9uZW50VVVJRD4oKTtcbiAgICBwdWJsaWMgb25VbmxvYWQoKSB7XG4gICAgICAgIHRoaXMuc3RvcEJha2luZygpO1xuICAgICAgICB0aGlzLl9pc0NsZWFyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2ZpbmlzaGVkLmxlbmd0aCA9IDA7XG4gICAgICAgIGNjZS5Bc3NldC5yZW1vdmVMaXN0ZW5lcignYXNzZXQtY2hhbmdlJywgdGhpcy5fYmluZE9uQXNzZXRDaGFuZ2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wQmFraW5nKCkge1xuICAgICAgICB0aGlzLl9iYWtlUXVldWUuZm9yRWFjaChpdGVtID0+IGl0ZW0uY2FuY2VsPy4oKSk7XG4gICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8uY2FuY2VsPy4oKTtcbiAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2lzTG9ja2VkID0gZmFsc2U7XG4gICAgfVxuICAgIHB1YmxpYyBpc0Jha2luZyh1dWlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Jha2VRdWV1ZS5zb21lKGl0ZW0gPT4gaXRlbS51dWlkID09PSB1dWlkKSB8fCB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8udXVpZCA9PT0gdXVpZDtcbiAgICB9XG4gICAgcHVibGljIGJha2VDdWJlbWFwcyhwcm9iZVVVSURzPzogUmVhZG9ubHlBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHByb2JlT3JVVUlEczogUmVmbGVjdGlvblByb2JlW10gPSBbXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50TWFwOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBDb21wb25lbnQ+PiA9IGNjZS5Db21wb25lbnQucXVlcnlBbGwoKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcG9uZW50TWFwKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRNYXBba2V5XTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUgJiYgY29tcG9uZW50LmVuYWJsZWQgJiYgY29tcG9uZW50LnByb2JlVHlwZSA9PT0gcmVuZGVyZXIuc2NlbmUuUHJvYmVUeXBlLkNVQkUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb2JlVVVJRHMgfHwgcHJvYmVVVUlEcy5pbmNsdWRlcyhjb21wb25lbnQudXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvYmVPclVVSURzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g5YWI6ZSB5L2P562J5pS26ZuG5LqG5omA5pyJ5ZG95Luk55qE5L+h5oGv5LqG5YaNIG5leHRUaWNrXG4gICAgICAgIHRoaXMuX2lzTG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHByb2JlT3JVVUlEcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2JlT3JVVUlEID0gcHJvYmVPclVVSURzW2luZGV4XTtcbiAgICAgICAgICAgIHRoaXMuX2Jha2VDdWJlbWFwKHByb2JlT3JVVUlEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLm5leHRUaWNrKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbycsIHRoaXMucXVlcnlBbGxCYWtlSW5mb3MoKSk7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICBwdWJsaWMgcXVlcnlBbGxCYWtlSW5mb3MoKTogUXVlcnlCYWtlUmVzdWx0IHtcbiAgICAgICAgY29uc3QgcmVtYWluaW5nID0gdGhpcy5fYmFrZVF1ZXVlLm1hcCgoaXRlbSkgPT4gaXRlbS50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICBjb25zdCBjdXJyZW50SW5mbzogUmVmbGVjdGlvblByb2JlQmFrZUluZm8gfCB1bmRlZmluZWQgPSB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8udG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVtYWluaW5nLFxuICAgICAgICAgICAgY3VycmVudEluZm8sXG4gICAgICAgICAgICBmaW5pc2hlZDogdGhpcy5fZmluaXNoZWQsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHB1YmxpYyBhc3luYyBjbGVhclJlc3VsdHMoKSB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgaXRlcmF0b3Igb2YgdGhpcy5fZXhpc3RGaWxlU2V0LnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11cmwnLCBpdGVyYXRvcik7XG4gICAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb21wb25lbnRNYXA6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIENvbXBvbmVudD4+ID0gY2NlLkNvbXBvbmVudC5xdWVyeUFsbCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjb21wb25lbnRNYXApIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudE1hcFtrZXldO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudCBpbnN0YW5jZW9mIFJlZmxlY3Rpb25Qcm9iZSkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jbGVhckJha2VkQ3ViZW1hcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcblxuICAgICAgICB0aGlzLl9leGlzdEZpbGVTZXQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc2F2ZVByb2ZpbGUoKTtcblxuICAgIH1cbiAgICBwdWJsaWMgY2FuY2VsQmFrZXMocmVmbGVjdFByb2JlVVVJRHM/OiByZWFkb25seSBzdHJpbmdbXSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgICAgICBpZiAoIXJlZmxlY3RQcm9iZVVVSURzKSB7XG4gICAgICAgICAgICB0aGlzLl9iYWtlUXVldWUuZm9yRWFjaChpdGVtID0+IGl0ZW0uY2FuY2VsKCkpO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8/LmNhbmNlbCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlZmxlY3RQcm9iZVVVSURzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSByZWZsZWN0UHJvYmVVVUlEc1tpbmRleF07XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY3VycmVudEJha2luZ0luZm8/LnV1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2Jha2VRdWV1ZS5maW5kKGl0ZW0gPT4gaXRlbS51dWlkID09PSB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbT8uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH1cbiAgICBwdWJsaWMgJ3N0YXJ0LWJha2UnKHJlZmxlY3RQcm9iZVVVSURzPzogUmVhZG9ubHlBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmJha2VDdWJlbWFwcyhyZWZsZWN0UHJvYmVVVUlEcyk7XG4gICAgfVxuICAgIHB1YmxpYyAnY2FuY2VsLWJha2UnKHJlZmxlY3RQcm9iZVVVSURzPzogUmVhZG9ubHlBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbmNlbEJha2VzKHJlZmxlY3RQcm9iZVVVSURzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgJ2NsZWFyLXJlc3VsdHMnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLl9pc0NsZWFyaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCcsIHRoaXMuX2lzQ2xlYXJpbmcpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNsZWFyUmVzdWx0cygpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlZmxlY3Rpb24tcHJvYmVdOiBDbGVhciByZXN1bHQgZmFpbGVkYCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzQ2xlYXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCcsIHRoaXMuX2lzQ2xlYXJpbmcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHB1YmxpYyAncXVlcnktYmFrZS1pbmZvJygpOiBRdWVyeUJha2VSZXN1bHQge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUFsbEJha2VJbmZvcygpO1xuICAgIH1cbiAgICBwdWJsaWMgJ3F1ZXJ5LWlzLWNsZWFyaW5nJygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQ2xlYXJpbmc7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgaXNCdXN5KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNMb2NrZWQ7XG4gICAgfVxuICAgIC8qKiDkv53lrZggcHJvZmlsZSAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfc2F2ZVByb2ZpbGUoKSB7XG4gICAgICAgIGF3YWl0IEVkaXRvci5Qcm9maWxlLnNldFByb2plY3QoJ3NjZW5lJywgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5fRklMRV9VVUlEU19QUk9GSUxFX1BBVEgsIFsuLi50aGlzLl9leGlzdEZpbGVTZXQudmFsdWVzKCldKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBfSU5TVEFOQ0U6IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXI7XG4gICAgLyoqIHByb2ZpbGUg5Lit5paH5Lu25a2Y5pS+55qE6Lev5b6EICovXG4gICAgcHJvdGVjdGVkIHN0YXRpYyBfRklMRV9VVUlEU19QUk9GSUxFX1BBVEggPSAncmVmbGVjdGlvbi1wcm9iZS5maWxlVVVJRHMnO1xuICAgIC8qKiDnlJ/miJDnmoTotYTmupDnmoQgdXVpZCAqL1xuICAgIHByb3RlY3RlZCByZWFkb25seSBfZXhpc3RGaWxlU2V0OiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2dldENvbmZpZygpOiBQcm9taXNlPFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXJDb25maWcgfCBudWxsPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3NjZW5lJywgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5fRklMRV9VVUlEU19QUk9GSUxFX1BBVEgsICdsb2NhbCcpIGFzIFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXJDb25maWc7XG4gICAgfVxuICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5fSU5TVEFOQ0UgPSB0aGlzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBfYmFrZVF1ZXVlOiBCYWtlQ29tbWFuZFtdID0gW107XG4gICAgcHJvdGVjdGVkIF9pc0xvY2tlZCA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIF9jdXJyZW50QmFraW5nSW5mbzogQmFrZUNvbW1hbmQgfCB1bmRlZmluZWQ7XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBCUk9BRENBU1RfTUVTU0FHRTogQXJyYXk8a2V5b2YgUmVmbGVjdGlvblByb2JlQnJvYWRjYXN0PiA9IFsncmVmbGVjdGlvbi1wcm9iZTpiYWtlLWVuZCcsICdyZWZsZWN0aW9uLXByb2JlOmJha2Utc3RhcnQnLCAncmVmbGVjdGlvbi1wcm9iZTpjbGVhci1lbmQnLCAncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJ107XG4gICAgcHJvdGVjdGVkIF9icm9hZGNhc3Q8VCBleHRlbmRzIGtleW9mIFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdD4obWVzc2FnZTogVCwgLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbVF0+KTogdm9pZCB7XG4gICAgICAgIGlmIChFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLkJST0FEQ0FTVF9NRVNTQUdFLmluY2x1ZGVzKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QobWVzc2FnZSwgLi4uYXJncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFtyZWZsZWN0aW9uLXByb2JlXTogbWVzc2FnZTogJHttZXNzYWdlfSBpcyBub3QgZXhpc3RgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwcm90ZWN0ZWQgbmV4dFRpY2soKSB7XG4gICAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLl9iYWtlUXVldWUucG9wKCk7XG4gICAgICAgIGlmICh0YXNrKSB7XG4gICAgICAgICAgICB0YXNrLnN0b3BXYWl0aW5nISgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faXNMb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5fZmluaXNoZWQubGVuZ3RoID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbycsIHRoaXNbJ3F1ZXJ5LWJha2UtaW5mbyddKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gcHJvYmVPclVVSUQgXG4gICAgICogQHJldHVybnMg5piv5ZCm54OY54SZ5oiQ5YqfXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9iYWtlQ3ViZW1hcChwcm9iZU9yVVVJRDogc3RyaW5nIHwgUmVmbGVjdGlvblByb2JlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHByb2JlID0gcHJvYmVPclVVSUQgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUgPyBwcm9iZU9yVVVJRCA6IGNjZS5Db21wb25lbnQucXVlcnkocHJvYmVPclVVSUQpO1xuICAgICAgICBpZiAoIShwcm9iZSBpbnN0YW5jZW9mIFJlZmxlY3Rpb25Qcm9iZSkgfHwgIXByb2JlLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJha2VDb21tYW5kOiBCYWtlQ29tbWFuZCA9IG5ldyBCYWtlQ29tbWFuZChcbiAgICAgICAgICAgIHByb2JlLFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGJha2VDb21tYW5kLmlzQ2FuY2VsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aHJvdyAnY2FuY2VsJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0Jha2luZyhwcm9iZS51dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5faXNMb2NrZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZVdhaXQsIHJlamVjdFdhaXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuaXNDYW5jZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0V2FpdCgnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJha2VDb21tYW5kLnN0b3BXYWl0aW5nID0gKCkgPT4gcmVzb2x2ZVdhaXQodm9pZCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLnB1c2goYmFrZUNvbW1hbmQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyA9IGJha2VDb21tYW5kO1xuICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nLCB0aGlzWydxdWVyeS1iYWtlLWluZm8nXSgpKTtcbiAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTpiYWtlLXN0YXJ0JywgYmFrZUNvbW1hbmQudG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uRmluaXNoID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbmlzaGVkLnB1c2goYmFrZUNvbW1hbmQudG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUaWNrKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLl9jYXB0dXJlQ3ViZShwcm9iZSlcbiAgICAgICAgICAgICAgICAudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTpiYWtlLWVuZCcsIG51bGwsIGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJywgZXJyLCBiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkob25GaW5pc2gpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yID09PSAnY2FuY2VsJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fYmFrZVF1ZXVlLmZpbmRJbmRleChpdGVtID0+IGl0ZW0udXVpZCA9PT0gYmFrZUNvbW1hbmQudXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9iYWtlUXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbdXJsLCB1dWlkXSBvZiB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IGJha2VDb21tYW5kLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmRlbGV0ZSh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBlbiBSZW5kZXIgdGhlIHNpeCBmYWNlcyBvZiB0aGUgUHJvYmUgYW5kIHVzZSB0aGUgdG9vbCB0byBnZW5lcmF0ZSBhIGN1YmVtYXAgYW5kIHNhdmUgaXQgdG8gdGhlIGFzc2V0IGRpcmVjdG9yeS5cbiAgICAgKiBAemgg5riy5p+TUHJvYmXnmoQ25Liq6Z2i77yM5bm25LiU5L2/55So5bel5YW355Sf5oiQY3ViZW1hcOS/neWtmOiHs2Fzc2V055uu5b2V44CCXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9jYXB0dXJlQ3ViZShwcm9iZUNvbXBvbmVudDogUmVmbGVjdGlvblByb2JlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvO1xuICAgICAgICBwcm9iZUNvbXBvbmVudC5wcm9iZS5jYXB0dXJlQ3ViZW1hcCgpO1xuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fd2FpdEZvck5leHRGcmFtZSgpO1xuICAgICAgICAvL1NhdmUgcmVuZGVydGV4dHVyZSBkYXRhIHRvIHRoZSByZXNvdXJjZSBkaXJlY3RvcnlcbiAgICAgICAgY29uc3QgY2FwcyA9IChkaXJlY3Rvci5yb290ISkuZGV2aWNlLmNhcGFiaWxpdGllcztcbiAgICAgICAgY29uc3QgZmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAobGV0IGZhY2VJZHggPSAwOyBmYWNlSWR4IDwgNjsgZmFjZUlkeCsrKSB7XG4gICAgICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYGNhcHR1cmVfJHtmYWNlSWR4fS5wbmdgO1xuICAgICAgICAgICAgZmlsZXMucHVzaChmaWxlTmFtZSk7XG4gICAgICAgICAgICBsZXQgcGl4ZWxEYXRhID0gcmVhZFBpeGVscyhwcm9iZUNvbXBvbmVudC5wcm9iZS5iYWtlZEN1YmVUZXh0dXJlc1tmYWNlSWR4XSk7XG4gICAgICAgICAgICBpZiAoY2Fwcy5jbGlwU3BhY2VNaW5aID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHBpeGVsRGF0YSA9IGZsaXBJbWFnZShwaXhlbERhdGEsIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddLCBwcm9iZUNvbXBvbmVudFsnX3Jlc29sdXRpb24nXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhc3NlcnQocGl4ZWxEYXRhICE9PSBudWxsKTtcbiAgICAgICAgICAgIGF3YWl0IHNhdmVEYXRhVG9JbWFnZShCdWZmZXIuZnJvbShwaXhlbERhdGEpLCBwcm9iZUNvbXBvbmVudFsnX3Jlc29sdXRpb24nXSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10sIHByb2JlQ29tcG9uZW50Lm5vZGUuc2NlbmUubmFtZSwgZmlsZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgICAgICAvL3VzZSB0aGUgdG9vbCB0byBnZW5lcmF0ZSBhIGN1YmVtYXAgYW5kIHNhdmUgdG8gYXNzZXQgZGlyZWN0b3J5XG4gICAgICAgIC8vcmVmbGVjdGlvbiBwcm9iZSBhbHdheXMgdXNlIGhkclxuICAgICAgICBjb25zdCBpc0hEUiA9IHRydWU7XG4gICAgICAgIGF3YWl0IHRoaXMuX2Jha2VSZWZsZWN0aW9uUHJvYmUoZmlsZXMsIGlzSERSLCBwcm9iZUNvbXBvbmVudC5ub2RlLnNjZW5lLm5hbWUsIHByb2JlQ29tcG9uZW50LnV1aWQsIHByb2JlQ29tcG9uZW50LnByb2JlLmdldFByb2JlSWQoKSwgcHJvYmVDb21wb25lbnQuZmFzdEJha2UpO1xuXG4gICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX3dhaXRGb3JOZXh0RnJhbWUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkaXJlY3Rvci5vbmNlKERpcmVjdG9yLkVWRU5UX0VORF9GUkFNRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIF9hc3NlcnROb3RDYW5jZWwoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8uaXNDYW5jZWwpIHtcbiAgICAgICAgICAgIHRocm93ICdjYW5jZWwnO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmaWxlcyBcbiAgICAgKiBAcGFyYW0gaXNIRFIgXG4gICAgICogQHBhcmFtIHNjZW5lTmFtZSBcbiAgICAgKiBAcGFyYW0gcHJvYmVDb21wb25lbnRVVUlEIFxuICAgICAqIEBwYXJhbSBwcm9iZUlEIFxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2Jha2VSZWZsZWN0aW9uUHJvYmUoZmlsZXM6IHN0cmluZ1tdLCBpc0hEUjogYm9vbGVhbiwgc2NlbmVOYW1lOiBzdHJpbmcsIHByb2JlQ29tcG9uZW50VVVJRDogc3RyaW5nLCBwcm9iZUlEOiBudW1iZXIsIGZhc3RCYWtlOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0UGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCAnZGI6Ly9hc3NldHMnKTtcbiAgICAgICAgaWYgKGFzc2V0UGF0aCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3JlZmxlY3Rpb24tcHJvYmVdOiBubyBhc3NldCBkaXJlY3RvcnknKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBqb2luKGFzc2V0UGF0aCwgc2NlbmVOYW1lLCBmaWxlTmFtZSk7XG4gICAgICAgICAgICBmaWxlUGF0aHMucHVzaChwYXRoKTtcbiAgICAgICAgICAgIGlmICghZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtyZWZsZWN0aW9uLXByb2JlXTogJHtwYXRofSBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NlbmVQYXRoID0gam9pbihhc3NldFBhdGgsIHNjZW5lTmFtZSk7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhzY2VuZVBhdGgpKSB7XG4gICAgICAgICAgICBta2RpclN5bmMoc2NlbmVQYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmUgPSBqb2luKHNjZW5lUGF0aCwgJ3JlZmxlY3Rpb25Qcm9iZScpO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXAgPSByZWZsZWN0aW9uUHJvYmUgKyAnXycgKyBwcm9iZUlELnRvU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcFdpdGhFeHQgPSByZWZsZWN0aW9uUHJvYmUgKyAnXycgKyBwcm9iZUlELnRvU3RyaW5nKCkgKyAnLnBuZyc7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcFVSTCA9IGBkYjovL2Fzc2V0cy8ke3NjZW5lTmFtZX0vcmVmbGVjdGlvblByb2JlXyR7cHJvYmVJRC50b1N0cmluZygpfS5wbmdgO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVTdWJBc3NldEN1YmVNYXBVUkwgPSByZWZsZWN0aW9uUHJvYmVNYXBVUkwgKyAnL3RleHR1cmVDdWJlJztcblxuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSBpc0hEUiA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG5cbiAgICAgICAgbGV0IHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkOiBDaGlsZFByb2Nlc3M7XG4gICAgICAgIGNvbnN0IHJlZmxlY3Rpb25Qcm9iZU1hcFBhcmFtcyA9IFtcbiAgICAgICAgICAgICctLWJ5cGFzc291dHB1dHR5cGUnLFxuICAgICAgICAgICAgJy0tb3V0cHV0MHBhcmFtcycsXG4gICAgICAgICAgICAncG5nLCcgKyBsZHJIZHJGb3JtYXRTdHJpbmcgKyAnLGxhdGxvbmcnLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlUG9zWCcsXG4gICAgICAgICAgICBmaWxlUGF0aHNbMF0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VOZWdYJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1sxXSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZVBvc1knLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzJdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlTmVnWScsXG4gICAgICAgICAgICBmaWxlUGF0aHNbM10sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VQb3NaJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1s0XSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZU5lZ1onLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzVdLFxuICAgICAgICAgICAgJy0tb3V0cHV0MCcsXG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXAsXG4gICAgICAgIF07XG5cbiAgICAgICAgaWYgKGlzSERSKSB7XG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMuc3BsaWNlKDAsIDAsICctLXJnYm0nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcbiAgICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0JyksIHJlZmxlY3Rpb25Qcm9iZU1hcFBhcmFtcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZCA9IHNwYXduKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvY21mdC9jbWZ0UmVsZWFzZTY0LmV4ZScpLCByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IChjb2RlOiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3JlZmxlY3Rpb24tcHJvYmVdOiBiYWtlIHJlZmxlY3Rpb25Qcm9iZSBmYWlsZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUoY29kZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8hLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyEuaXNDYW5jZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uQ2xvc2UpO1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLmtpbGwoKTtcbiAgICAgICAgICAgICAgICByZWplY3QoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQub24oJ2Nsb3NlJywgb25DbG9zZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8v5omL5Yqo54OY54SZ6ZyA6KaB5riF6Zmk5a+85YWl5Zmo5L+d5a2Y55qE5Y2356ev5Zu+57yT5a2Y77yM6YG/5YWN5Yqg6L295LiK5qyh55qE54OY54SZ57uT5p6cXG4gICAgICAgIGNvbnN0IGNhY2hlUGF0aCA9IGpvaW4oc2NlbmVQYXRoLCBgcmVmbGVjdGlvblByb2JlXyR7cHJvYmVJRC50b1N0cmluZygpfV9jb252b2x1dGlvbmApO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgbWlwbWFwUGF0aCA9IGpvaW4oY2FjaGVQYXRoLCAnbWlwbWFwXycgKyBpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMobWlwbWFwUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVTeW5jKG1pcG1hcFBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZVBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZW1vdmVTeW5jKGZpbGVQYXRoc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWV0YVBhdGggPSByZWZsZWN0aW9uUHJvYmVNYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgY29uc3QgbWlwQmFrZU1vZGUgPSBmYXN0QmFrZSA/IDEgOiAyO1xuICAgICAgICBsZXQgbWV0YTogYW55ID0ge1xuICAgICAgICAgICAgdmVyOiAnMC4wLjAnLFxuICAgICAgICAgICAgaW1wb3J0ZXI6ICcqJyxcbiAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHR1cmUgY3ViZScsXG4gICAgICAgICAgICAgICAgaXNSR0JFOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Yk1ldGFzOiB7XG4gICAgICAgICAgICAgICAgYjQ3YzA6IHtcbiAgICAgICAgICAgICAgICAgICAgdXNlckRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pcEJha2VNb2RlOiBtaXBCYWtlTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5zZXQocmVmbGVjdGlvblByb2JlU3ViQXNzZXRDdWJlTWFwVVJMLCBwcm9iZUNvbXBvbmVudFVVSUQpO1xuICAgICAgICBpZiAoIWV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICBvdXRwdXRKU09OU3luYyhtZXRhUGF0aCwgbWV0YSwgeyBzcGFjZXM6IDIgfSk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvblByb2JlTWFwVVJMKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1ldGEgPSByZWFkSlNPTlN5bmMobWV0YVBhdGgpO1xuICAgICAgICAgICAgLy8g5L+u5pS5ZXJwLXRleHR1cmUtY3ViZeeahHVzZXJEYXRhLm1pcEJha2VNb2Rl77yM55So5p2l5a+5Y3ViZW1hcOWBmuWNt+enr1xuICAgICAgICAgICAgaWYgKG1ldGEudXNlckRhdGE/LnR5cGUgIT09ICd0ZXh0dXJlIGN1YmUnIHx8IG1ldGEuc3ViTWV0YXM/LmI0N2MwPy51c2VyRGF0YT8ubWlwQmFrZU1vZGUgIT09IG1pcEJha2VNb2RlKSB7XG4gICAgICAgICAgICAgICAgbWV0YS51c2VyRGF0YS50eXBlID0gJ3RleHR1cmUgY3ViZSc7XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcyA/Pz0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMCA/Pz0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMC51c2VyRGF0YSA/Pz0ge307XG4gICAgICAgICAgICAgICAgbWV0YS5zdWJNZXRhcy5iNDdjMC51c2VyRGF0YS5taXBCYWtlTW9kZSA9IG1pcEJha2VNb2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgcmVmbGVjdGlvblByb2JlTWFwVVJMKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbcmVmbGVjdGlvbi1wcm9iZV06IGZhaWxlZCB0byByZWltcG9ydC1hc3NldCB7YXNzZXQoJHtyZWZsZWN0aW9uUHJvYmVNYXBVUkx9KX0scGxlYXNlIGVuc3VyZSB0aGF0IHJlc291cmNlcyBhcmUgaW1wb3J0ZWRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnc2F2ZS1hc3NldC1tZXRhJywgaW5mby51dWlkLCBKU09OLnN0cmluZ2lmeShtZXRhKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlaW1wb3J0LWFzc2V0JywgcmVmbGVjdGlvblByb2JlTWFwVVJMKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCBqb2luKGFzc2V0UGF0aCwgc2NlbmVOYW1lKSk7XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuXG4gICAgfVxuICAgIC8qKiDmmK/lkKbmiYDmnInnmoTor7fmsYLpg73mlLbpm4blrozkuoYgKi9cbiAgICBwcm90ZWN0ZWQgX2lzQ2xlYXJpbmcgPSBmYWxzZTtcbiAgICAvKiog5a6M5oiQ54OY54SZ55qE5pWw6YePICovXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IF9maW5pc2hlZDogUmVmbGVjdGlvblByb2JlQmFrZUluZm9bXSA9IFtdO1xuXG59XG5cbmNvbnN0IGluc3RhbmNlID0gRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5HRVRfSU5TVEFOQ0UoKTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCAmIFJlZmxlY3Rpb25Qcm9iZU9wZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgJ3N0YXJ0LWJha2UnOiAodXVpZHM/OiByZWFkb25seSBzdHJpbmdbXSkgPT4gaW5zdGFuY2VbJ3N0YXJ0LWJha2UnXSh1dWlkcyksXG4gICAgJ2NhbmNlbC1iYWtlJzogKHV1aWRzPzogcmVhZG9ubHkgc3RyaW5nW10pID0+IGluc3RhbmNlWydjYW5jZWxCYWtlcyddKHV1aWRzKSxcbiAgICAnY2xlYXItcmVzdWx0cyc6IGFzeW5jICgpID0+IGF3YWl0IGluc3RhbmNlWydjbGVhci1yZXN1bHRzJ10oKSxcbiAgICAncXVlcnktYmFrZS1pbmZvJzogKCkgPT4gaW5zdGFuY2VbJ3F1ZXJ5QWxsQmFrZUluZm9zJ10oKSxcbiAgICAncXVlcnktaXMtY2xlYXJpbmcnOiAoKSA9PiBpbnN0YW5jZVsncXVlcnktaXMtY2xlYXJpbmcnXSgpLFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgYXdhaXQgaW5zdGFuY2Uub25Mb2FkKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7XG4gICAgaW5zdGFuY2Uub25VbmxvYWQoKTtcbn0iXX0=