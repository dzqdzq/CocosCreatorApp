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
                meta.userData.isRGBE = true;
                meta.subMetas ?? (meta.subMetas = {});
                (_a = meta.subMetas).b47c0 ?? (_a.b47c0 = {});
                (_b = meta.subMetas.b47c0).userData ?? (_b.userData = {});
                meta.subMetas.b47c0.userData.mipBakeMode = mipBakeMode;
                this._assertNotCancel();
                fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBd0g7QUFDeEgsaUVBQW9FO0FBQ3BFLGlEQUFvRDtBQUNwRCx1Q0FBbUc7QUFFbkcsZ0RBQTJFO0FBQzNFLCtCQUFxQztBQUlyQyxNQUFhLFdBQVc7SUFTcEIsWUFDYyxLQUFzQjtJQUNoQyxnQkFBZ0I7SUFDVCxNQUFrQjtJQUN6QixXQUFXO0lBQ0osV0FBd0I7UUFKckIsVUFBSyxHQUFMLEtBQUssQ0FBaUI7UUFFekIsV0FBTSxHQUFOLE1BQU0sQ0FBWTtRQUVsQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQVo1QixhQUFRLEdBQUcsS0FBSyxDQUFDO1FBY3BCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBZEQsSUFBVyxRQUFRO1FBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELElBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQVVNLHlCQUF5QjtRQUM1QixPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQzFCLENBQUM7SUFDTixDQUFDO0NBQ0o7QUF4QkQsa0NBd0JDO0FBTUQsTUFBYSw0QkFBNEI7SUEyTnJDO1FBdEtBLGdCQUFXLEdBQWMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQTRCbkM7O1dBRUc7UUFDTyxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztRQWtJakUsa0JBQWtCO1FBQ0Msa0JBQWEsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQVFoRCxlQUFV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O0lBQzlELGlCQUFpQixFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFO0lBQ3hELG1CQUFtQixFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFO0NBQzdELENBQUM7QUFFSyxLQUFLLFVBQVUsSUFBSTtJQUN0QixNQUFNLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM1QixDQUFDO0FBRkQsb0JBRUM7QUFFRCxTQUFnQixNQUFNO0lBQ2xCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN4QixDQUFDO0FBRkQsd0JBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGFzc2VydCwgQXNzZXQsIGFzc2V0TWFuYWdlciwgQ29tcG9uZW50LCBEaXJlY3RvciwgZGlyZWN0b3IsIFJlZmxlY3Rpb25Qcm9iZSwgcmVuZGVyZXIsIFRleHR1cmVDdWJlIH0gZnJvbSAnY2MnO1xuaW1wb3J0IHsgUmVmbGVjdGlvblByb2JlTWFuYWdlciB9IGZyb20gJ2NjL2VkaXRvci9yZWZsZWN0aW9uLXByb2JlJztcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIG1rZGlyU3luYywgcmVtb3ZlLCByZWFkSlNPTlN5bmMsIG91dHB1dEpTT05TeW5jLCByZW1vdmVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgUXVlcnlCYWtlUmVzdWx0LCBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbywgUmVmbGVjdGlvblByb2JlQnJvYWRjYXN0LCBSZWZsZWN0aW9uUHJvYmVPcGVyYXRpb25SZXF1ZXN0LCBSZWZsZWN0aW9uUHJvYmVRdWVyeVJlcXVlc3QgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IHJlYWRQaXhlbHMsIGZsaXBJbWFnZSwgc2F2ZURhdGFUb0ltYWdlIH0gZnJvbSAnLi4vdXRpbHMvZ3JhcGhpY3MnO1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xudHlwZSBVUkwgPSBzdHJpbmc7XG50eXBlIFVVSUQgPSBzdHJpbmc7XG50eXBlIFByb2JlQ29tcG9uZW50VVVJRCA9IHN0cmluZztcbmV4cG9ydCBjbGFzcyBCYWtlQ29tbWFuZCBpbXBsZW1lbnRzIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvIHtcblxuICAgIHB1YmxpYyBpc0NhbmNlbCA9IGZhbHNlO1xuICAgIHB1YmxpYyBnZXQgbm9kZU5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvYmUubm9kZS5uYW1lO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IHV1aWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvYmUudXVpZDtcbiAgICB9XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByb3RlY3RlZCBwcm9iZTogUmVmbGVjdGlvblByb2JlLFxuICAgICAgICAvKiog5Y+W5raI5b2T5YmN5ZG95Luk55qE5pa55rOVICovXG4gICAgICAgIHB1YmxpYyBjYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgICAgIC8qKiDkuI3lho3nrYnlvoUgKi9cbiAgICAgICAgcHVibGljIHN0b3BXYWl0aW5nPzogKCkgPT4gdm9pZCxcbiAgICApIHtcbiAgICAgICAgdGhpcy5zdG9wV2FpdGluZyA9IHN0b3BXYWl0aW5nPy5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBwdWJsaWMgdG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpOiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbyB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXG4gICAgICAgICAgICBub2RlTmFtZTogdGhpcy5ub2RlTmFtZSxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVmbGVjdGlvblByb2JlTWFuYWdlckNvbmZpZyB7XG4gICAgcmVhZG9ubHkgZmlsZVVVSURzOiBSZWFkb25seUFycmF5PHN0cmluZz5cbn1cblxuZXhwb3J0IGNsYXNzIEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIgaW1wbGVtZW50cyBSZWZsZWN0aW9uUHJvYmVRdWVyeVJlcXVlc3QsIFJlZmxlY3Rpb25Qcm9iZU9wZXJhdGlvblJlcXVlc3Qge1xuXG4gICAgcHVibGljIHN0YXRpYyBHRVRfSU5TVEFOQ0UoKTogRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9JTlNUQU5DRSA/PyBuZXcgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMuX2JpbmRPbkFzc2V0Q2hhbmdlID0gdGhpcy5vbkFzc2V0Q2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICAgIGNjZS5Bc3NldC5hZGRMaXN0ZW5lcignYXNzZXQtY2hhbmdlJywgdGhpcy5fYmluZE9uQXNzZXRDaGFuZ2UpO1xuICAgICAgICBjb25zdCBmaWxlVVVJRFNGcm9tQ29uZmlnID0gKGF3YWl0IHRoaXMuX2dldENvbmZpZygpKT8uZmlsZVVVSURzO1xuICAgICAgICBjb25zdCBub25FeGlzdEZpbGVVVUlEUzogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKGZpbGVVVUlEU0Zyb21Db25maWcgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZpbGVVVUlEU0Zyb21Db25maWcubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGZpbGVVVUlEU0Zyb21Db25maWdbaW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdXVpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub25FeGlzdEZpbGVVVUlEUy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsZVVVSURTRnJvbUNvbmZpZy5maWx0ZXIoaXRlbSA9PiAhbm9uRXhpc3RGaWxlVVVJRFMuaW5jbHVkZXMoaXRlbSkpLmZvckVhY2goXG4gICAgICAgICAgICAgICAgaXRlbSA9PiB0aGlzLl9leGlzdEZpbGVTZXQuYWRkKGl0ZW0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkQ29tcG9uZW50QXNzZXQoY29tcG9uZW50VVVJRDogc3RyaW5nLCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fZXhpc3RGaWxlU2V0LmFkZCh1dWlkLnNsaWNlKDAsIHV1aWQubGFzdEluZGV4T2YoJ0AnKSkpO1xuICAgICAgICB0aGlzLl9zYXZlUHJvZmlsZSgpO1xuICAgICAgICBjb25zdCBhc3NldDogVGV4dHVyZUN1YmUgfCBudWxsID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGFzc2V0TWFuYWdlci5sb2FkQW55KHV1aWQsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtyZWZsZWN0aW9uLXByb2JlXTogYXNzZXQgY2FuJ3QgYmUgbG9hZDp7YXNzZXQoJHt1dWlkfSl9LHBsZWFzZSBlbnN1cmUgdGhhdCByZXNvdXJjZXMgYXJlIGltcG9ydGVkYCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjY2UuQ29tcG9uZW50LnF1ZXJ5KGNvbXBvbmVudFVVSUQpO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudCBpbnN0YW5jZW9mIFJlZmxlY3Rpb25Qcm9iZSkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jdWJlbWFwID0gYXNzZXQ7XG4gICAgICAgICAgICAgICAgUmVmbGVjdGlvblByb2JlTWFuYWdlci5wcm9iZU1hbmFnZXIudXBkYXRlQmFrZWRDdWJlbWFwKGNvbXBvbmVudC5wcm9iZSk7XG4gICAgICAgICAgICAgICAgUmVmbGVjdGlvblByb2JlTWFuYWdlci5wcm9iZU1hbmFnZXIudXBkYXRlUHJldmlld1NwaGVyZShjb21wb25lbnQucHJvYmUpO1xuICAgICAgICAgICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdhaXRpbmdMaXN0OiBTZXQ8VVVJRD4gPSBuZXcgU2V0KCk7XG4gICAgYXN5bmMgb25Bc3NldENoYW5nZSh1dWlkOiBzdHJpbmcsIGFzc2V0SW5mbzogYW55LCBtZXRhOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBmb3IgKGNvbnN0IHVybCBvZiB0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmtleXMoKSkge1xuICAgICAgICAgICAgaWYgKChhc3NldEluZm8udXJsIGFzIHN0cmluZykuc3RhcnRzV2l0aCh1cmwpICYmIGFzc2V0SW5mby51cmwgIT09IHVybCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2FpdGluZ0xpc3QuYWRkKHV1aWQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnRleHR1cmVDdWJlVVJMTWFwLmhhcyhhc3NldEluZm8udXJsKSkge1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRVVUlEID0gdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5nZXQoYXNzZXRJbmZvLnVybCkhO1xuICAgICAgICAgICAgY29uc3Qgb25TdWJBc3NldExvYWRlZCA9ICh0ZXh0dXJlQ3ViZUFzc2V0OiBUZXh0dXJlQ3ViZSwgc3ViQXNzZXRVVUlEOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLndhaXRpbmdMaXN0LmRlbGV0ZShzdWJBc3NldFVVSUQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1N1YkFzc2V0TG9hZGluZyA9IEFycmF5LmZyb20odGhpcy53YWl0aW5nTGlzdC52YWx1ZXMoKSkuc29tZShpdGVtID0+IGl0ZW0uc3RhcnRzV2l0aCh1dWlkKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNTdWJBc3NldExvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkQ29tcG9uZW50QXNzZXQoY29tcG9uZW50VVVJRCwgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0TWFuYWdlci5hc3NldExpc3RlbmVyLm9mZih1dWlkLCBvblN1YkFzc2V0TG9hZGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLmFzc2V0TGlzdGVuZXIub24odXVpZCwgb25TdWJBc3NldExvYWRlZCk7XG5cbiAgICAgICAgICAgIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuZGVsZXRlKGFzc2V0SW5mby51cmwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9iaW5kT25Bc3NldENoYW5nZT86ICh1dWlkOiBzdHJpbmcsIGFzc2V0SW5mbzogYW55LCBtZXRhOiBhbnkpID0+IFByb21pc2U8dm9pZD47XG5cbiAgICAvKipcbiAgICAgKiDlvZPorrDlvZXlnKjmraQgbWFwIOeahOi1hOa6kOiiq+WvvOWFpeWujOaIkOaXtuWwhuinpuWPkeWvueW6lOeahOWbnuiwg++8jOW5tuS4lOWIoOmZpOiusOW9lVxuICAgICAqL1xuICAgIHByb3RlY3RlZCB0ZXh0dXJlQ3ViZVVSTE1hcCA9IG5ldyBNYXA8VVJMLCBQcm9iZUNvbXBvbmVudFVVSUQ+KCk7XG4gICAgcHVibGljIG9uVW5sb2FkKCkge1xuICAgICAgICB0aGlzLnN0b3BCYWtpbmcoKTtcbiAgICAgICAgdGhpcy5faXNDbGVhcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9maW5pc2hlZC5sZW5ndGggPSAwO1xuICAgICAgICBjY2UuQXNzZXQucmVtb3ZlTGlzdGVuZXIoJ2Fzc2V0LWNoYW5nZScsIHRoaXMuX2JpbmRPbkFzc2V0Q2hhbmdlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcEJha2luZygpIHtcbiAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLmZvckVhY2goaXRlbSA9PiBpdGVtLmNhbmNlbD8uKCkpO1xuICAgICAgICB0aGlzLl9iYWtlUXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8/LmNhbmNlbD8uKCk7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBwdWJsaWMgaXNCYWtpbmcodXVpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9iYWtlUXVldWUuc29tZShpdGVtID0+IGl0ZW0udXVpZCA9PT0gdXVpZCkgfHwgdGhpcy5fY3VycmVudEJha2luZ0luZm8/LnV1aWQgPT09IHV1aWQ7XG4gICAgfVxuICAgIHB1YmxpYyBiYWtlQ3ViZW1hcHMocHJvYmVVVUlEcz86IFJlYWRvbmx5QXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICBjb25zdCBwcm9iZU9yVVVJRHM6IFJlZmxlY3Rpb25Qcm9iZVtdID0gW107XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE1hcDogUmVhZG9ubHk8UmVjb3JkPHN0cmluZywgQ29tcG9uZW50Pj4gPSBjY2UuQ29tcG9uZW50LnF1ZXJ5QWxsKCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvbXBvbmVudE1hcCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50TWFwW2tleV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlICYmIGNvbXBvbmVudC5lbmFibGVkICYmIGNvbXBvbmVudC5wcm9iZVR5cGUgPT09IHJlbmRlcmVyLnNjZW5lLlByb2JlVHlwZS5DVUJFKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwcm9iZVVVSURzIHx8IHByb2JlVVVJRHMuaW5jbHVkZXMoY29tcG9uZW50LnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2JlT3JVVUlEcy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIOWFiOmUgeS9j+etieaUtumbhuS6huaJgOacieWRveS7pOeahOS/oeaBr+S6huWGjSBuZXh0VGlja1xuICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IHRydWU7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9iZU9yVVVJRHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9iZU9yVVVJRCA9IHByb2JlT3JVVUlEc1tpbmRleF07XG4gICAgICAgICAgICB0aGlzLl9iYWtlQ3ViZW1hcChwcm9iZU9yVVVJRCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9jdXJyZW50QmFraW5nSW5mbykge1xuICAgICAgICAgICAgdGhpcy5uZXh0VGljaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nLCB0aGlzLnF1ZXJ5QWxsQmFrZUluZm9zKCkpO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgcHVibGljIHF1ZXJ5QWxsQmFrZUluZm9zKCk6IFF1ZXJ5QmFrZVJlc3VsdCB7XG4gICAgICAgIGNvbnN0IHJlbWFpbmluZyA9IHRoaXMuX2Jha2VRdWV1ZS5tYXAoKGl0ZW0pID0+IGl0ZW0udG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgY29uc3QgY3VycmVudEluZm86IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvIHwgdW5kZWZpbmVkID0gdGhpcy5fY3VycmVudEJha2luZ0luZm8/LnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbWFpbmluZyxcbiAgICAgICAgICAgIGN1cnJlbnRJbmZvLFxuICAgICAgICAgICAgZmluaXNoZWQ6IHRoaXMuX2ZpbmlzaGVkLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBwdWJsaWMgYXN5bmMgY2xlYXJSZXN1bHRzKCkge1xuICAgICAgICBsZXQgbmVlZFJlcGFpbnQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50TWFwOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBDb21wb25lbnQ+PiA9IGNjZS5Db21wb25lbnQucXVlcnlBbGwoKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcG9uZW50TWFwKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRNYXBba2V5XTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmN1YmVtYXA/LnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHV1aWQgPSBjb21wb25lbnQuY3ViZW1hcC51dWlkO1xuICAgICAgICAgICAgICAgICAgICB1dWlkID0gdXVpZC5zbGljZSgwLCB1dWlkLmxhc3RJbmRleE9mKCdAJykpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11cmwnLCB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9leGlzdEZpbGVTZXQuZGVsZXRlKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuY2xlYXJCYWtlZEN1YmVtYXAoKTtcbiAgICAgICAgICAgICAgICAgICAgbmVlZFJlcGFpbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmVlZFJlcGFpbnQpIHtcbiAgICAgICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgICAgIHRoaXMuX3NhdmVQcm9maWxlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGNhbmNlbEJha2VzKHJlZmxlY3RQcm9iZVVVSURzPzogcmVhZG9ubHkgc3RyaW5nW10gfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFyZWZsZWN0UHJvYmVVVUlEcykge1xuICAgICAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLmZvckVhY2goaXRlbSA9PiBpdGVtLmNhbmNlbCgpKTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy5jYW5jZWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZWZsZWN0UHJvYmVVVUlEcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gcmVmbGVjdFByb2JlVVVJRHNbaW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy51dWlkID09PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvLmNhbmNlbCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9iYWtlUXVldWUuZmluZChpdGVtID0+IGl0ZW0udXVpZCA9PT0gdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0/LmNhbmNlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG4gICAgcHVibGljICdzdGFydC1iYWtlJyhyZWZsZWN0UHJvYmVVVUlEcz86IFJlYWRvbmx5QXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICByZXR1cm4gdGhpcy5iYWtlQ3ViZW1hcHMocmVmbGVjdFByb2JlVVVJRHMpO1xuICAgIH1cbiAgICBwdWJsaWMgJ2NhbmNlbC1iYWtlJyhyZWZsZWN0UHJvYmVVVUlEcz86IFJlYWRvbmx5QXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5jZWxCYWtlcyhyZWZsZWN0UHJvYmVVVUlEcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jICdjbGVhci1yZXN1bHRzJygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5faXNDbGVhcmluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTpjbGVhci1lbmQnLCB0aGlzLl9pc0NsZWFyaW5nKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jbGVhclJlc3VsdHMoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtyZWZsZWN0aW9uLXByb2JlXTogQ2xlYXIgcmVzdWx0IGZhaWxlZGAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pc0NsZWFyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTpjbGVhci1lbmQnLCB0aGlzLl9pc0NsZWFyaW5nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwdWJsaWMgJ3F1ZXJ5LWJha2UtaW5mbycoKTogUXVlcnlCYWtlUmVzdWx0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlBbGxCYWtlSW5mb3MoKTtcbiAgICB9XG4gICAgcHVibGljICdxdWVyeS1pcy1jbGVhcmluZycoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0NsZWFyaW5nO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IGlzQnVzeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzTG9ja2VkO1xuICAgIH1cbiAgICAvKiog5L+d5a2YIHByb2ZpbGUgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX3NhdmVQcm9maWxlKCkge1xuICAgICAgICBhd2FpdCBFZGl0b3IuUHJvZmlsZS5zZXRQcm9qZWN0KCdzY2VuZScsIEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuX0ZJTEVfVVVJRFNfUFJPRklMRV9QQVRILCBbLi4udGhpcy5fZXhpc3RGaWxlU2V0LnZhbHVlcygpXSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzdGF0aWMgX0lOU1RBTkNFOiBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyO1xuICAgIC8qKiBwcm9maWxlIOS4reaWh+S7tuWtmOaUvueahOi3r+W+hCAqL1xuICAgIHByb3RlY3RlZCBzdGF0aWMgX0ZJTEVfVVVJRFNfUFJPRklMRV9QQVRIID0gJ3JlZmxlY3Rpb24tcHJvYmUuZmlsZVVVSURzJztcbiAgICAvKiog55Sf5oiQ55qE6LWE5rqQ55qEIHV1aWQgKi9cbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2V4aXN0RmlsZVNldDogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG4gICAgcHJvdGVjdGVkIGFzeW5jIF9nZXRDb25maWcoKTogUHJvbWlzZTxSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyQ29uZmlnIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdzY2VuZScsIEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuX0ZJTEVfVVVJRFNfUFJPRklMRV9QQVRILCAnbG9jYWwnKSBhcyBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyQ29uZmlnO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuX0lOU1RBTkNFID0gdGhpcztcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Jha2VRdWV1ZTogQmFrZUNvbW1hbmRbXSA9IFtdO1xuICAgIHByb3RlY3RlZCBfaXNMb2NrZWQgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBfY3VycmVudEJha2luZ0luZm86IEJha2VDb21tYW5kIHwgdW5kZWZpbmVkO1xuICAgIHByb3RlY3RlZCBzdGF0aWMgQlJPQURDQVNUX01FU1NBR0U6IEFycmF5PGtleW9mIFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdD4gPSBbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnLCAncmVmbGVjdGlvbi1wcm9iZTpiYWtlLXN0YXJ0JywgJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJywgJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbyddO1xuICAgIHByb3RlY3RlZCBfYnJvYWRjYXN0PFQgZXh0ZW5kcyBrZXlvZiBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3Q+KG1lc3NhZ2U6IFQsIC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0W1RdPik6IHZvaWQge1xuICAgICAgICBpZiAoRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5CUk9BRENBU1RfTUVTU0FHRS5pbmNsdWRlcyhtZXNzYWdlKSkge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KG1lc3NhZ2UsIC4uLmFyZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbcmVmbGVjdGlvbi1wcm9iZV06IG1lc3NhZ2U6ICR7bWVzc2FnZX0gaXMgbm90IGV4aXN0YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHJvdGVjdGVkIG5leHRUaWNrKCkge1xuICAgICAgICBjb25zdCB0YXNrID0gdGhpcy5fYmFrZVF1ZXVlLnBvcCgpO1xuICAgICAgICBpZiAodGFzaykge1xuICAgICAgICAgICAgdGFzay5zdG9wV2FpdGluZyEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2lzTG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmlzaGVkLmxlbmd0aCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nLCB0aGlzWydxdWVyeS1iYWtlLWluZm8nXSgpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHByb2JlT3JVVUlEIFxuICAgICAqIEByZXR1cm5zIOaYr+WQpueDmOeEmeaIkOWKn1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfYmFrZUN1YmVtYXAocHJvYmVPclVVSUQ6IHN0cmluZyB8IFJlZmxlY3Rpb25Qcm9iZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwcm9iZSA9IHByb2JlT3JVVUlEIGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlID8gcHJvYmVPclVVSUQgOiBjY2UuQ29tcG9uZW50LnF1ZXJ5KHByb2JlT3JVVUlEKTtcbiAgICAgICAgaWYgKCEocHJvYmUgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUpIHx8ICFwcm9iZS5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiYWtlQ29tbWFuZDogQmFrZUNvbW1hbmQgPSBuZXcgQmFrZUNvbW1hbmQoXG4gICAgICAgICAgICBwcm9iZSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5pc0NhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ2NhbmNlbCc7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNCYWtpbmcocHJvYmUudXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2lzTG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmVXYWl0LCByZWplY3RXYWl0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGJha2VDb21tYW5kLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJha2VDb21tYW5kLmlzQ2FuY2VsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdFdhaXQoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5zdG9wV2FpdGluZyA9ICgpID0+IHJlc29sdmVXYWl0KHZvaWQgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5wdXNoKGJha2VDb21tYW5kKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faXNMb2NrZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8gPSBiYWtlQ29tbWFuZDtcbiAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJywgdGhpc1sncXVlcnktYmFrZS1pbmZvJ10oKSk7XG4gICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCcsIGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICBjb25zdCBvbkZpbmlzaCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maW5pc2hlZC5wdXNoKGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VGljaygpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5fY2FwdHVyZUN1YmUocHJvYmUpXG4gICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnLCBudWxsLCBiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTpiYWtlLWVuZCcsIGVyciwgYmFrZUNvbW1hbmQudG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KG9uRmluaXNoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvciA9PT0gJ2NhbmNlbCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2Jha2VRdWV1ZS5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLnV1aWQgPT09IGJha2VDb21tYW5kLnV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW3VybCwgdXVpZF0gb2YgdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1dWlkID09PSBiYWtlQ29tbWFuZC51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlQ3ViZVVSTE1hcC5kZWxldGUodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAZW4gUmVuZGVyIHRoZSBzaXggZmFjZXMgb2YgdGhlIFByb2JlIGFuZCB1c2UgdGhlIHRvb2wgdG8gZ2VuZXJhdGUgYSBjdWJlbWFwIGFuZCBzYXZlIGl0IHRvIHRoZSBhc3NldCBkaXJlY3RvcnkuXG4gICAgICogQHpoIOa4suafk1Byb2Jl55qENuS4qumdou+8jOW5tuS4lOS9v+eUqOW3peWFt+eUn+aIkGN1YmVtYXDkv53lrZjoh7Nhc3NldOebruW9leOAglxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfY2FwdHVyZUN1YmUocHJvYmVDb21wb25lbnQ6IFJlZmxlY3Rpb25Qcm9iZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbztcbiAgICAgICAgcHJvYmVDb21wb25lbnQucHJvYmUuY2FwdHVyZUN1YmVtYXAoKTtcbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3dhaXRGb3JOZXh0RnJhbWUoKTtcbiAgICAgICAgLy9TYXZlIHJlbmRlcnRleHR1cmUgZGF0YSB0byB0aGUgcmVzb3VyY2UgZGlyZWN0b3J5XG4gICAgICAgIGNvbnN0IGNhcHMgPSAoZGlyZWN0b3Iucm9vdCEpLmRldmljZS5jYXBhYmlsaXRpZXM7XG4gICAgICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBmYWNlSWR4ID0gMDsgZmFjZUlkeCA8IDY7IGZhY2VJZHgrKykge1xuICAgICAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGBjYXB0dXJlXyR7ZmFjZUlkeH0ucG5nYDtcbiAgICAgICAgICAgIGZpbGVzLnB1c2goZmlsZU5hbWUpO1xuICAgICAgICAgICAgbGV0IHBpeGVsRGF0YSA9IHJlYWRQaXhlbHMocHJvYmVDb21wb25lbnQucHJvYmUuYmFrZWRDdWJlVGV4dHVyZXNbZmFjZUlkeF0pO1xuICAgICAgICAgICAgaWYgKGNhcHMuY2xpcFNwYWNlTWluWiA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwaXhlbERhdGEgPSBmbGlwSW1hZ2UocGl4ZWxEYXRhLCBwcm9iZUNvbXBvbmVudFsnX3Jlc29sdXRpb24nXSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzZXJ0KHBpeGVsRGF0YSAhPT0gbnVsbCk7XG4gICAgICAgICAgICBhd2FpdCBzYXZlRGF0YVRvSW1hZ2UoQnVmZmVyLmZyb20ocGl4ZWxEYXRhKSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10sIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddLCBwcm9iZUNvbXBvbmVudC5ub2RlLnNjZW5lLm5hbWUsIGZpbGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcbiAgICAgICAgLy91c2UgdGhlIHRvb2wgdG8gZ2VuZXJhdGUgYSBjdWJlbWFwIGFuZCBzYXZlIHRvIGFzc2V0IGRpcmVjdG9yeVxuICAgICAgICAvL3JlZmxlY3Rpb24gcHJvYmUgYWx3YXlzIHVzZSBoZHJcbiAgICAgICAgY29uc3QgaXNIRFIgPSB0cnVlO1xuICAgICAgICBhd2FpdCB0aGlzLl9iYWtlUmVmbGVjdGlvblByb2JlKGZpbGVzLCBpc0hEUiwgcHJvYmVDb21wb25lbnQubm9kZS5zY2VuZS5uYW1lLCBwcm9iZUNvbXBvbmVudC51dWlkLCBwcm9iZUNvbXBvbmVudC5wcm9iZS5nZXRQcm9iZUlkKCksIHByb2JlQ29tcG9uZW50LmZhc3RCYWtlKTtcblxuICAgICAgICBjY2UuRW5naW5lLnJlcGFpbnRJbkVkaXRNb2RlKCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIF93YWl0Rm9yTmV4dEZyYW1lKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZGlyZWN0b3Iub25jZShEaXJlY3Rvci5FVkVOVF9FTkRfRlJBTUUsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBfYXNzZXJ0Tm90Q2FuY2VsKCkge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudEJha2luZ0luZm8/LmlzQ2FuY2VsKSB7XG4gICAgICAgICAgICB0aHJvdyAnY2FuY2VsJztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZmlsZXMgXG4gICAgICogQHBhcmFtIGlzSERSIFxuICAgICAqIEBwYXJhbSBzY2VuZU5hbWUgXG4gICAgICogQHBhcmFtIHByb2JlQ29tcG9uZW50VVVJRCBcbiAgICAgKiBAcGFyYW0gcHJvYmVJRCBcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9iYWtlUmVmbGVjdGlvblByb2JlKGZpbGVzOiBzdHJpbmdbXSwgaXNIRFI6IGJvb2xlYW4sIHNjZW5lTmFtZTogc3RyaW5nLCBwcm9iZUNvbXBvbmVudFVVSUQ6IHN0cmluZywgcHJvYmVJRDogbnVtYmVyLCBmYXN0QmFrZTogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBhc3NldFBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgJ2RiOi8vYXNzZXRzJyk7XG4gICAgICAgIGlmIChhc3NldFBhdGggPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tyZWZsZWN0aW9uLXByb2JlXTogbm8gYXNzZXQgZGlyZWN0b3J5Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZXNbaV07XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gam9pbihhc3NldFBhdGgsIHNjZW5lTmFtZSwgZmlsZU5hbWUpO1xuICAgICAgICAgICAgZmlsZVBhdGhzLnB1c2gocGF0aCk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0c1N5bmMocGF0aCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbcmVmbGVjdGlvbi1wcm9iZV06ICR7cGF0aH0gbm90IGV4aXN0YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjZW5lUGF0aCA9IGpvaW4oYXNzZXRQYXRoLCBzY2VuZU5hbWUpO1xuICAgICAgICBpZiAoIWV4aXN0c1N5bmMoc2NlbmVQYXRoKSkge1xuICAgICAgICAgICAgbWtkaXJTeW5jKHNjZW5lUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlID0gam9pbihzY2VuZVBhdGgsICdyZWZsZWN0aW9uUHJvYmUnKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlTWFwID0gcmVmbGVjdGlvblByb2JlICsgJ18nICsgcHJvYmVJRC50b1N0cmluZygpO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXBXaXRoRXh0ID0gcmVmbGVjdGlvblByb2JlICsgJ18nICsgcHJvYmVJRC50b1N0cmluZygpICsgJy5wbmcnO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXBVUkwgPSBgZGI6Ly9hc3NldHMvJHtzY2VuZU5hbWV9L3JlZmxlY3Rpb25Qcm9iZV8ke3Byb2JlSUQudG9TdHJpbmcoKX0ucG5nYDtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlU3ViQXNzZXRDdWJlTWFwVVJMID0gcmVmbGVjdGlvblByb2JlTWFwVVJMICsgJy90ZXh0dXJlQ3ViZSc7XG5cbiAgICAgICAgY29uc3QgbGRySGRyRm9ybWF0U3RyaW5nID0gaXNIRFIgPyAncmdibScgOiAnYmdyYTgnO1xuXG4gICAgICAgIGxldCByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZDogQ2hpbGRQcm9jZXNzO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMgPSBbXG4gICAgICAgICAgICAnLS1ieXBhc3NvdXRwdXR0eXBlJyxcbiAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICctLWlucHV0RmFjZVBvc1gnLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzBdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlTmVnWCcsXG4gICAgICAgICAgICBmaWxlUGF0aHNbMV0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VQb3NZJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1syXSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZU5lZ1knLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzNdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlUG9zWicsXG4gICAgICAgICAgICBmaWxlUGF0aHNbNF0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VOZWdaJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1s1XSxcbiAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwLFxuICAgICAgICBdO1xuXG4gICAgICAgIGlmIChpc0hEUikge1xuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NCcpLCByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgcmVmbGVjdGlvblByb2JlTWFwUGFyYW1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSAoY29kZTogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb2RlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tyZWZsZWN0aW9uLXByb2JlXTogYmFrZSByZWZsZWN0aW9uUHJvYmUgZmFpbGVkLicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNvZGUpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKGNvZGUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvIS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8hLmlzQ2FuY2VsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbkNsb3NlKTtcbiAgICAgICAgICAgICAgICByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZC5raWxsKCk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCdjYW5jZWwnKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLm9uKCdjbG9zZScsIG9uQ2xvc2UpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvL+aJi+WKqOeDmOeEmemcgOimgea4hemZpOWvvOWFpeWZqOS/neWtmOeahOWNt+enr+Wbvue8k+WtmO+8jOmBv+WFjeWKoOi9veS4iuasoeeahOeDmOeEmee7k+aenFxuICAgICAgICBjb25zdCBjYWNoZVBhdGggPSBqb2luKHNjZW5lUGF0aCwgYHJlZmxlY3Rpb25Qcm9iZV8ke3Byb2JlSUQudG9TdHJpbmcoKX1fY29udm9sdXRpb25gKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2OyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG1pcG1hcFBhdGggPSBqb2luKGNhY2hlUGF0aCwgJ21pcG1hcF8nICsgaS50b1N0cmluZygpICsgJy5wbmcnKTtcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKG1pcG1hcFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlU3luYyhtaXBtYXBQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVQYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVtb3ZlU3luYyhmaWxlUGF0aHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1ldGFQYXRoID0gcmVmbGVjdGlvblByb2JlTWFwV2l0aEV4dCArICcubWV0YSc7XG4gICAgICAgIGNvbnN0IG1pcEJha2VNb2RlID0gZmFzdEJha2UgPyAxIDogMjtcbiAgICAgICAgbGV0IG1ldGE6IGFueSA9IHtcbiAgICAgICAgICAgIHZlcjogJzAuMC4wJyxcbiAgICAgICAgICAgIGltcG9ydGVyOiAnKicsXG4gICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0dXJlIGN1YmUnLFxuICAgICAgICAgICAgICAgIGlzUkdCRTogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWJNZXRhczoge1xuICAgICAgICAgICAgICAgIGI0N2MwOiB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaXBCYWtlTW9kZTogbWlwQmFrZU1vZGUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudGV4dHVyZUN1YmVVUkxNYXAuc2V0KHJlZmxlY3Rpb25Qcm9iZVN1YkFzc2V0Q3ViZU1hcFVSTCwgcHJvYmVDb21wb25lbnRVVUlEKTtcbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHJlZmxlY3Rpb25Qcm9iZU1hcFVSTCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgIC8vIOS/ruaUuWVycC10ZXh0dXJlLWN1YmXnmoR1c2VyRGF0YS5taXBCYWtlTW9kZe+8jOeUqOadpeWvuWN1YmVtYXDlgZrljbfnp69cbiAgICAgICAgICAgIGlmIChtZXRhLnVzZXJEYXRhPy50eXBlICE9PSAndGV4dHVyZSBjdWJlJyB8fCBtZXRhLnN1Yk1ldGFzPy5iNDdjMD8udXNlckRhdGE/Lm1pcEJha2VNb2RlICE9PSBtaXBCYWtlTW9kZSkge1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgICAgIG1ldGEudXNlckRhdGEuaXNSR0JFID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzID8/PSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwID8/PSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhID8/PSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhLnN1Yk1ldGFzLmI0N2MwLnVzZXJEYXRhLm1pcEJha2VNb2RlID0gbWlwQmFrZU1vZGU7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIGpvaW4oYXNzZXRQYXRoLCBzY2VuZU5hbWUpKTtcbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG5cbiAgICB9XG4gICAgLyoqIOaYr+WQpuaJgOacieeahOivt+axgumDveaUtumbhuWujOS6hiAqL1xuICAgIHByb3RlY3RlZCBfaXNDbGVhcmluZyA9IGZhbHNlO1xuICAgIC8qKiDlrozmiJDng5jnhJnnmoTmlbDph48gKi9cbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2ZpbmlzaGVkOiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mb1tdID0gW107XG5cbn1cblxuY29uc3QgaW5zdGFuY2UgPSBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLkdFVF9JTlNUQU5DRSgpO1xuXG5leHBvcnQgY29uc3QgbWV0aG9kczogUmVmbGVjdGlvblByb2JlUXVlcnlSZXF1ZXN0ICYgUmVmbGVjdGlvblByb2JlT3BlcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAnc3RhcnQtYmFrZSc6ICh1dWlkcz86IHJlYWRvbmx5IHN0cmluZ1tdKSA9PiBpbnN0YW5jZVsnc3RhcnQtYmFrZSddKHV1aWRzKSxcbiAgICAnY2FuY2VsLWJha2UnOiAodXVpZHM/OiByZWFkb25seSBzdHJpbmdbXSkgPT4gaW5zdGFuY2VbJ2NhbmNlbEJha2VzJ10odXVpZHMpLFxuICAgICdjbGVhci1yZXN1bHRzJzogYXN5bmMgKCkgPT4gYXdhaXQgaW5zdGFuY2VbJ2NsZWFyLXJlc3VsdHMnXSgpLFxuICAgICdxdWVyeS1iYWtlLWluZm8nOiAoKSA9PiBpbnN0YW5jZVsncXVlcnlBbGxCYWtlSW5mb3MnXSgpLFxuICAgICdxdWVyeS1pcy1jbGVhcmluZyc6ICgpID0+IGluc3RhbmNlWydxdWVyeS1pcy1jbGVhcmluZyddKCksXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICBhd2FpdCBpbnN0YW5jZS5vbkxvYWQoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcbiAgICBpbnN0YW5jZS5vblVubG9hZCgpO1xufSJdfQ==