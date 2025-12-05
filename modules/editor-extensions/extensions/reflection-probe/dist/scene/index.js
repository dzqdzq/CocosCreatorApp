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
    onUnload() {
        this.stopBaking();
        this._isClearing = false;
        this._finished.length = 0;
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
            throw new Error(`message: ${message} is not exist`);
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
        await this._bakeReflectionProbe(files, isHDR, probeComponent.node.scene.name, probeComponent.uuid, probeComponent.probe.getProbeId(), (asset) => {
            probeComponent.cubemap = asset;
        });
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
    async _bakeReflectionProbe(files, isHDR, sceneName, probeComponentUUID, probeID, callback) {
        const assetPath = await Editor.Message.request('asset-db', 'query-path', 'db://assets');
        if (assetPath === null) {
            console.error('no asset directory');
            return;
        }
        const filePaths = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const path = path_1.join(assetPath, sceneName, fileName);
            filePaths.push(path);
            if (!fs_extra_1.existsSync(path)) {
                console.error(path + ' not exist');
            }
        }
        const scenePath = path_1.join(assetPath, sceneName);
        if (!fs_extra_1.existsSync(scenePath)) {
            fs_extra_1.mkdirSync(scenePath);
        }
        const reflectionProbe = path_1.join(scenePath, 'reflectionProbe');
        const reflectionProbeMap = reflectionProbe + '_' + probeID.toString();
        const reflectionProbeMapWithExt = reflectionProbe + '_' + probeID.toString() + '.png';
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
                    console.error('bake reflectionProbe failed.');
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
                    isRGBE: true,
                },
            }, { spaces: 2 });
        }
        this._assertNotCancel();
        await Editor.Message.request('asset-db', 'refresh-asset', reflectionProbeMapWithExt);
        this._assertNotCancel();
        // 修改erp-texture-cube的userData.mipBakeMode，用来对cubemap做卷积
        if (fs_extra_1.existsSync(metaPath)) {
            const meta = fs_extra_1.readJSONSync(metaPath);
            if (meta.subMetas?.b47c0) {
                meta.subMetas.b47c0.userData.mipBakeMode = 2;
                fs_extra_1.outputJSONSync(metaPath, meta, { spaces: 2 });
                await Editor.Message.request('asset-db', 'refresh-asset', reflectionProbeMapWithExt);
            }
            this._assertNotCancel();
        }
        this._assertNotCancel();
        if (reflectionProbeMapWithExt) {
            const uuid = await Editor.Message.request('asset-db', 'query-uuid', reflectionProbeMapWithExt);
            if (uuid) {
                this._existFileSet.add(uuid);
                this._saveProfile();
                const asset = await new Promise((resolve) => {
                    cc_1.assetManager.loadAny(`${uuid}@b47c0`, (error, asset) => {
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
                    callback(asset);
                }
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc2NlbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBb0c7QUFDcEcsaUVBQW9FO0FBQ3BFLGlEQUFvRDtBQUNwRCx1Q0FBdUY7QUFFdkYsZ0RBQTJFO0FBQzNFLCtCQUE0QjtBQUU1QixNQUFhLFdBQVc7SUFTcEIsWUFDYyxLQUFzQjtJQUNoQyxnQkFBZ0I7SUFDVCxNQUFrQjtJQUN6QixXQUFXO0lBQ0osV0FBd0I7UUFKckIsVUFBSyxHQUFMLEtBQUssQ0FBaUI7UUFFekIsV0FBTSxHQUFOLE1BQU0sQ0FBWTtRQUVsQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQVo1QixhQUFRLEdBQUcsS0FBSyxDQUFDO1FBY3BCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBZEQsSUFBVyxRQUFRO1FBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUNELElBQVcsSUFBSTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQVVNLHlCQUF5QjtRQUM1QixPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQzFCLENBQUM7SUFDTixDQUFDO0NBQ0o7QUF4QkQsa0NBd0JDO0FBTUQsTUFBYSw0QkFBNEI7SUEySnJDO1FBTEEsa0JBQWtCO1FBQ0Msa0JBQWEsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQVFoRCxlQUFVLEdBQWtCLEVBQUUsQ0FBQztRQUMvQixjQUFTLEdBQUcsS0FBSyxDQUFDO1FBbVI1QixtQkFBbUI7UUFDVCxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUM5Qixj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LENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDMUUsYUFBYSxFQUFFLENBQUMsS0FBeUIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUM1RSxlQUFlLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRTtJQUM5RCxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRTtJQUN4RCxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRTtDQUM3RCxDQUFDO0FBRUssS0FBSyxVQUFVLElBQUk7SUFDdEIsTUFBTSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDNUIsQ0FBQztBQUZELG9CQUVDO0FBRUQsU0FBZ0IsTUFBTTtJQUNsQixRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7QUFFeEIsQ0FBQztBQUhELHdCQUdDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBhc3NlcnQsIGFzc2V0TWFuYWdlciwgQ29tcG9uZW50LCBEaXJlY3RvciwgZGlyZWN0b3IsIFJlZmxlY3Rpb25Qcm9iZSwgcmVuZGVyZXIgfSBmcm9tICdjYyc7XG5pbXBvcnQgeyBSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyIH0gZnJvbSAnY2MvZWRpdG9yL3JlZmxlY3Rpb24tcHJvYmUnO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgbWtkaXJTeW5jLCByZW1vdmUsIHJlYWRKU09OU3luYywgb3V0cHV0SlNPTlN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBRdWVyeUJha2VSZXN1bHQsIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvLCBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3QsIFJlZmxlY3Rpb25Qcm9iZU9wZXJhdGlvblJlcXVlc3QsIFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcmVhZFBpeGVscywgZmxpcEltYWdlLCBzYXZlRGF0YVRvSW1hZ2UgfSBmcm9tICcuLi91dGlscy9ncmFwaGljcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBCYWtlQ29tbWFuZCBpbXBsZW1lbnRzIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvIHtcbiAgICBcbiAgICBwdWJsaWMgaXNDYW5jZWwgPSBmYWxzZTtcbiAgICBwdWJsaWMgZ2V0IG5vZGVOYW1lKCk6IHN0cmluZ3tcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvYmUubm9kZS5uYW1lO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IHV1aWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvYmUudXVpZDtcbiAgICB9XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByb3RlY3RlZCBwcm9iZTogUmVmbGVjdGlvblByb2JlLFxuICAgICAgICAvKiog5Y+W5raI5b2T5YmN5ZG95Luk55qE5pa55rOVICovXG4gICAgICAgIHB1YmxpYyBjYW5jZWw6ICgpID0+IHZvaWQsXG4gICAgICAgIC8qKiDkuI3lho3nrYnlvoUgKi9cbiAgICAgICAgcHVibGljIHN0b3BXYWl0aW5nPzogKCkgPT4gdm9pZCxcbiAgICApe1xuICAgICAgICB0aGlzLnN0b3BXYWl0aW5nID0gc3RvcFdhaXRpbmc/LmJpbmQodGhpcyk7XG4gICAgfVxuICAgIHB1YmxpYyB0b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCk6IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZve1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXVpZDogdGhpcy51dWlkLFxuICAgICAgICAgICAgbm9kZU5hbWU6IHRoaXMubm9kZU5hbWUsXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXJDb25maWcge1xuICAgIHJlYWRvbmx5IGZpbGVVVUlEczogUmVhZG9ubHlBcnJheTxzdHJpbmc+IFxufVxuXG5leHBvcnQgY2xhc3MgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlciBpbXBsZW1lbnRzIFJlZmxlY3Rpb25Qcm9iZVF1ZXJ5UmVxdWVzdCwgUmVmbGVjdGlvblByb2JlT3BlcmF0aW9uUmVxdWVzdCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIEdFVF9JTlNUQU5DRSgpOiBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2Vye1xuICAgICAgICByZXR1cm4gdGhpcy5fSU5TVEFOQ0UgPz8gbmV3IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb25Mb2FkKCkge1xuICAgICAgICBjb25zdCBmaWxlVVVJRFNGcm9tQ29uZmlnID0gKGF3YWl0IHRoaXMuX2dldENvbmZpZygpKT8uZmlsZVVVSURzO1xuICAgICAgICBjb25zdCBub25FeGlzdEZpbGVVVUlEUzogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKGZpbGVVVUlEU0Zyb21Db25maWcgaW5zdGFuY2VvZiBBcnJheSl7XG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmlsZVVVSURTRnJvbUNvbmZpZy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gZmlsZVVVSURTRnJvbUNvbmZpZ1tpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJyl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mbyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBub25FeGlzdEZpbGVVVUlEUy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsZVVVSURTRnJvbUNvbmZpZy5maWx0ZXIoaXRlbSA9PiAhbm9uRXhpc3RGaWxlVVVJRFMuaW5jbHVkZXMoaXRlbSkpLmZvckVhY2goXG4gICAgICAgICAgICAgICAgaXRlbSA9PiB0aGlzLl9leGlzdEZpbGVTZXQuYWRkKGl0ZW0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBwdWJsaWMgb25VbmxvYWQoKXtcbiAgICAgICAgdGhpcy5zdG9wQmFraW5nKCk7XG4gICAgICAgIHRoaXMuX2lzQ2xlYXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZmluaXNoZWQubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcEJha2luZygpe1xuICAgICAgICB0aGlzLl9iYWtlUXVldWUuZm9yRWFjaChpdGVtID0+IGl0ZW0uY2FuY2VsPy4oKSk7XG4gICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5sZW5ndGggPSAwOyBcbiAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8/LmNhbmNlbD8uKCk7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBwdWJsaWMgaXNCYWtpbmcodXVpZDogc3RyaW5nKTogYm9vbGVhbntcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Jha2VRdWV1ZS5zb21lKGl0ZW0gPT4gaXRlbS51dWlkID09PSB1dWlkKSB8fCB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8udXVpZCA9PT0gdXVpZDtcbiAgICB9XG4gICAgcHVibGljIGJha2VDdWJlbWFwcyhwcm9iZVVVSURzPzogUmVhZG9ubHlBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHByb2JlT3JVVUlEczogUmVmbGVjdGlvblByb2JlW10gPSBbXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50TWFwOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBDb21wb25lbnQ+PiA9IGNjZS5Db21wb25lbnQucXVlcnlBbGwoKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcG9uZW50TWFwKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRNYXBba2V5XTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUgJiYgY29tcG9uZW50LmVuYWJsZWQgJiYgY29tcG9uZW50LnByb2JlVHlwZSA9PT0gcmVuZGVyZXIuc2NlbmUuUHJvYmVUeXBlLkNVQkUpe1xuICAgICAgICAgICAgICAgIGlmICghcHJvYmVVVUlEcyB8fCBwcm9iZVVVSURzLmluY2x1ZGVzKGNvbXBvbmVudC51dWlkKSl7XG4gICAgICAgICAgICAgICAgICAgIHByb2JlT3JVVUlEcy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIOWFiOmUgeS9j+etieaUtumbhuS6huaJgOacieWRveS7pOeahOS/oeaBr+S6huWGjSBuZXh0VGlja1xuICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IHRydWU7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9iZU9yVVVJRHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9iZU9yVVVJRCA9IHByb2JlT3JVVUlEc1tpbmRleF07XG4gICAgICAgICAgICB0aGlzLl9iYWtlQ3ViZW1hcChwcm9iZU9yVVVJRCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9jdXJyZW50QmFraW5nSW5mbyl7XG4gICAgICAgICAgICB0aGlzLm5leHRUaWNrKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbycsIHRoaXMucXVlcnlBbGxCYWtlSW5mb3MoKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuICAgIHB1YmxpYyBxdWVyeUFsbEJha2VJbmZvcygpOiBRdWVyeUJha2VSZXN1bHQge1xuICAgICAgICBjb25zdCByZW1haW5pbmcgPSB0aGlzLl9iYWtlUXVldWUubWFwKChpdGVtKSA9PiBpdGVtLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRJbmZvOiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mb3x1bmRlZmluZWQgPSB0aGlzLl9jdXJyZW50QmFraW5nSW5mbz8udG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVtYWluaW5nLFxuICAgICAgICAgICAgY3VycmVudEluZm8sXG4gICAgICAgICAgICBmaW5pc2hlZDogdGhpcy5fZmluaXNoZWQsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHB1YmxpYyBhc3luYyBjbGVhclJlc3VsdHMoKXtcbiAgICAgICAgZm9yIGF3YWl0IChjb25zdCBpdGVyYXRvciBvZiB0aGlzLl9leGlzdEZpbGVTZXQudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXVybCcsIGl0ZXJhdG9yKTtcbiAgICAgICAgICAgIGlmICh1cmwpe1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2RlbGV0ZS1hc3NldCcsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29tcG9uZW50TWFwOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBDb21wb25lbnQ+PiA9IGNjZS5Db21wb25lbnQucXVlcnlBbGwoKTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcG9uZW50TWFwKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjb21wb25lbnRNYXBba2V5XTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnQgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUpe1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5jbGVhckJha2VkQ3ViZW1hcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcblxuICAgICAgICB0aGlzLl9leGlzdEZpbGVTZXQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc2F2ZVByb2ZpbGUoKTtcbiAgICAgICAgXG4gICAgfVxuICAgIHB1YmxpYyBjYW5jZWxCYWtlcyhyZWZsZWN0UHJvYmVVVUlEcz86IHJlYWRvbmx5IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgICAgIGlmICghcmVmbGVjdFByb2JlVVVJRHMpe1xuICAgICAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLmZvckVhY2goaXRlbSA9PiBpdGVtLmNhbmNlbCgpKTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy5jYW5jZWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZWZsZWN0UHJvYmVVVUlEcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gcmVmbGVjdFByb2JlVVVJRHNbaW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy51dWlkID09PSB1dWlkKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2Jha2VRdWV1ZS5maW5kKGl0ZW0gPT4gaXRlbS51dWlkID09PSB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbT8uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH1cbiAgICBwdWJsaWMgJ3N0YXJ0LWJha2UnKHJlZmxlY3RQcm9iZVVVSURzPzogUmVhZG9ubHlBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmJha2VDdWJlbWFwcyhyZWZsZWN0UHJvYmVVVUlEcyk7XG4gICAgfVxuICAgIHB1YmxpYyAnY2FuY2VsLWJha2UnKHJlZmxlY3RQcm9iZVVVSURzPzogUmVhZG9ubHlBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbmNlbEJha2VzKHJlZmxlY3RQcm9iZVVVSURzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgJ2NsZWFyLXJlc3VsdHMnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLl9pc0NsZWFyaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCcsIHRoaXMuX2lzQ2xlYXJpbmcpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNsZWFyUmVzdWx0cygpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW3JlZmxlY3Rpb24tcHJvYmVdOiBDbGVhciByZXN1bHQgZmFpbGVkYCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzQ2xlYXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCcsIHRoaXMuX2lzQ2xlYXJpbmcpO1xuICAgICAgICByZXR1cm4gO1xuICAgIH1cbiAgICBwdWJsaWMgJ3F1ZXJ5LWJha2UtaW5mbycoKTogUXVlcnlCYWtlUmVzdWx0e1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUFsbEJha2VJbmZvcygpO1xuICAgIH1cbiAgICBwdWJsaWMgJ3F1ZXJ5LWlzLWNsZWFyaW5nJygpe1xuICAgICAgICByZXR1cm4gdGhpcy5faXNDbGVhcmluZztcbiAgICB9XG4gICAgcHVibGljIGdldCBpc0J1c3koKTogYm9vbGVhbntcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzTG9ja2VkO1xuICAgIH1cbiAgICAvKiog5L+d5a2YIHByb2ZpbGUgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX3NhdmVQcm9maWxlKCl7XG4gICAgICAgIGF3YWl0IEVkaXRvci5Qcm9maWxlLnNldFByb2plY3QoJ3NjZW5lJywgRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5fRklMRV9VVUlEU19QUk9GSUxFX1BBVEgsIFsuLi50aGlzLl9leGlzdEZpbGVTZXQudmFsdWVzKCldKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBfSU5TVEFOQ0U6IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXI7XG4gICAgLyoqIHByb2ZpbGUg5Lit5paH5Lu25a2Y5pS+55qE6Lev5b6EICovXG4gICAgcHJvdGVjdGVkIHN0YXRpYyBfRklMRV9VVUlEU19QUk9GSUxFX1BBVEggPSAncmVmbGVjdGlvbi1wcm9iZS5maWxlVVVJRHMnO1xuICAgIC8qKiDnlJ/miJDnmoTotYTmupDnmoQgdXVpZCAqL1xuICAgIHByb3RlY3RlZCByZWFkb25seSBfZXhpc3RGaWxlU2V0OiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcbiAgICBwcm90ZWN0ZWQgYXN5bmMgX2dldENvbmZpZygpOiBQcm9taXNlPFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXJDb25maWcgfCBudWxsPntcbiAgICAgICAgcmV0dXJuIGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygnc2NlbmUnLCBFZGl0b3JSZWZsZWN0aW9uUHJvYmVNYW5hZ2VyLl9GSUxFX1VVSURTX1BST0ZJTEVfUEFUSCwgJ2xvY2FsJykgYXMgUmVmbGVjdGlvblByb2JlTWFuYWdlckNvbmZpZztcbiAgICB9XG4gICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuX0lOU1RBTkNFID0gdGhpcztcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Jha2VRdWV1ZTogQmFrZUNvbW1hbmRbXSA9IFtdO1xuICAgIHByb3RlY3RlZCBfaXNMb2NrZWQgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBfY3VycmVudEJha2luZ0luZm86IEJha2VDb21tYW5kIHwgdW5kZWZpbmVkO1xuICAgIHByb3RlY3RlZCBzdGF0aWMgQlJPQURDQVNUX01FU1NBR0U6IEFycmF5PGtleW9mIFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdD4gPSBbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnLCAncmVmbGVjdGlvbi1wcm9iZTpiYWtlLXN0YXJ0JywgJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJywgJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbyddO1xuICAgIHByb3RlY3RlZCBfYnJvYWRjYXN0PFQgZXh0ZW5kcyBrZXlvZiBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3Q+KG1lc3NhZ2U6IFQsIC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0W1RdPik6IHZvaWQge1xuICAgICAgICBpZiAoRWRpdG9yUmVmbGVjdGlvblByb2JlTWFuYWdlci5CUk9BRENBU1RfTUVTU0FHRS5pbmNsdWRlcyhtZXNzYWdlKSl7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QobWVzc2FnZSwgLi4uYXJncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1lc3NhZ2U6ICR7bWVzc2FnZX0gaXMgbm90IGV4aXN0YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHJvdGVjdGVkIG5leHRUaWNrKCl7XG4gICAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLl9iYWtlUXVldWUucG9wKCk7XG4gICAgICAgIGlmICh0YXNrKXtcbiAgICAgICAgICAgICAgICB0YXNrLnN0b3BXYWl0aW5nISgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faXNMb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5fZmluaXNoZWQubGVuZ3RoID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbycsIHRoaXNbJ3F1ZXJ5LWJha2UtaW5mbyddKCkpOyBcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHByb2JlT3JVVUlEIFxuICAgICAqIEByZXR1cm5zIOaYr+WQpueDmOeEmeaIkOWKn1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfYmFrZUN1YmVtYXAocHJvYmVPclVVSUQ6IHN0cmluZyB8IFJlZmxlY3Rpb25Qcm9iZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwcm9iZSA9IHByb2JlT3JVVUlEIGluc3RhbmNlb2YgUmVmbGVjdGlvblByb2JlID8gcHJvYmVPclVVSUQgOiBjY2UuQ29tcG9uZW50LnF1ZXJ5KHByb2JlT3JVVUlEKTtcbiAgICAgICAgaWYgKCEocHJvYmUgaW5zdGFuY2VvZiBSZWZsZWN0aW9uUHJvYmUpIHx8ICFwcm9iZS5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiYWtlQ29tbWFuZDogQmFrZUNvbW1hbmQgPSBuZXcgQmFrZUNvbW1hbmQoXG4gICAgICAgICAgICBwcm9iZSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5pc0NhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ2NhbmNlbCc7XG4gICAgICAgICAgICB9LFxuICAgICAgICApOyBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmFraW5nKHByb2JlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9pc0xvY2tlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlV2FpdCwgcmVqZWN0V2FpdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWtlQ29tbWFuZC5pc0NhbmNlbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3RXYWl0KCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYmFrZUNvbW1hbmQuc3RvcFdhaXRpbmcgPSAoKSA9PiByZXNvbHZlV2FpdCh2b2lkIDApOyBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmFrZVF1ZXVlLnB1c2goYmFrZUNvbW1hbmQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9pc0xvY2tlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyA9IGJha2VDb21tYW5kO1xuICAgICAgICAgICAgdGhpcy5fYnJvYWRjYXN0KCdyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nLCB0aGlzWydxdWVyeS1iYWtlLWluZm8nXSgpKTsgXG4gICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCcsIGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICBjb25zdCBvbkZpbmlzaCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maW5pc2hlZC5wdXNoKGJha2VDb21tYW5kLnRvUmVmbGVjdGlvblByb2JlQmFrZUluZm8oKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VGljaygpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5fY2FwdHVyZUN1YmUocHJvYmUpXG4gICAgICAgICAgICAgICAgLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9icm9hZGNhc3QoJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnLCBudWxsLCBiYWtlQ29tbWFuZC50b1JlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKCkpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb2FkY2FzdCgncmVmbGVjdGlvbi1wcm9iZTpiYWtlLWVuZCcsIGVyciwgYmFrZUNvbW1hbmQudG9SZWZsZWN0aW9uUHJvYmVCYWtlSW5mbygpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KG9uRmluaXNoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvciA9PT0gJ2NhbmNlbCcpe1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fYmFrZVF1ZXVlLmZpbmRJbmRleChpdGVtID0+IGl0ZW0udXVpZCA9PT0gYmFrZUNvbW1hbmQudXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jha2VRdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAZW4gUmVuZGVyIHRoZSBzaXggZmFjZXMgb2YgdGhlIFByb2JlIGFuZCB1c2UgdGhlIHRvb2wgdG8gZ2VuZXJhdGUgYSBjdWJlbWFwIGFuZCBzYXZlIGl0IHRvIHRoZSBhc3NldCBkaXJlY3RvcnkuXG4gICAgICogQHpoIOa4suafk1Byb2Jl55qENuS4qumdou+8jOW5tuS4lOS9v+eUqOW3peWFt+eUn+aIkGN1YmVtYXDkv53lrZjoh7Nhc3NldOebruW9leOAglxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfY2FwdHVyZUN1YmUocHJvYmVDb21wb25lbnQ6IFJlZmxlY3Rpb25Qcm9iZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbztcbiAgICAgICAgcHJvYmVDb21wb25lbnQucHJvYmUuY2FwdHVyZUN1YmVtYXAoKTtcbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3dhaXRGb3JOZXh0RnJhbWUoKTtcbiAgICAgICAgLy9TYXZlIHJlbmRlcnRleHR1cmUgZGF0YSB0byB0aGUgcmVzb3VyY2UgZGlyZWN0b3J5XG4gICAgICAgIGNvbnN0IGNhcHMgPSAoZGlyZWN0b3Iucm9vdCEpLmRldmljZS5jYXBhYmlsaXRpZXM7XG4gICAgICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBmYWNlSWR4ID0gMDsgZmFjZUlkeCA8IDY7IGZhY2VJZHgrKykge1xuICAgICAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGBjYXB0dXJlXyR7ZmFjZUlkeH0ucG5nYDtcbiAgICAgICAgICAgIGZpbGVzLnB1c2goZmlsZU5hbWUpO1xuICAgICAgICAgICAgbGV0IHBpeGVsRGF0YSA9IHJlYWRQaXhlbHMocHJvYmVDb21wb25lbnQucHJvYmUuYmFrZWRDdWJlVGV4dHVyZXNbZmFjZUlkeF0pO1xuICAgICAgICAgICAgaWYgKGNhcHMuY2xpcFNwYWNlTWluWiA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwaXhlbERhdGEgPSBmbGlwSW1hZ2UocGl4ZWxEYXRhLCBwcm9iZUNvbXBvbmVudFsnX3Jlc29sdXRpb24nXSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzZXJ0KHBpeGVsRGF0YSAhPT0gbnVsbCk7XG4gICAgICAgICAgICBhd2FpdCBzYXZlRGF0YVRvSW1hZ2UoQnVmZmVyLmZyb20ocGl4ZWxEYXRhKSwgcHJvYmVDb21wb25lbnRbJ19yZXNvbHV0aW9uJ10sIHByb2JlQ29tcG9uZW50WydfcmVzb2x1dGlvbiddLCBwcm9iZUNvbXBvbmVudC5ub2RlLnNjZW5lLm5hbWUsIGZpbGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICAvL3VzZSB0aGUgdG9vbCB0byBnZW5lcmF0ZSBhIGN1YmVtYXAgYW5kIHNhdmUgdG8gYXNzZXQgZGlyZWN0b3J5XG4gICAgICAgIGNvbnN0IGlzSERSID0gKGRpcmVjdG9yLnJvb3QhKS5waXBlbGluZS5waXBlbGluZVNjZW5lRGF0YS5pc0hEUjtcbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX2Jha2VSZWZsZWN0aW9uUHJvYmUoZmlsZXMsIGlzSERSLCBwcm9iZUNvbXBvbmVudC5ub2RlLnNjZW5lLm5hbWUsIHByb2JlQ29tcG9uZW50LnV1aWQsIHByb2JlQ29tcG9uZW50LnByb2JlLmdldFByb2JlSWQoKSwgKGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIHByb2JlQ29tcG9uZW50LmN1YmVtYXAgPSBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChwcm9iZUNvbXBvbmVudFsnX2N1YmVtYXAnXSkge1xuICAgICAgICAgICAgUmVmbGVjdGlvblByb2JlTWFuYWdlci5wcm9iZU1hbmFnZXIudXBkYXRlQmFrZWRDdWJlbWFwKHByb2JlQ29tcG9uZW50LnByb2JlKTtcbiAgICAgICAgICAgIFJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIucHJvYmVNYW5hZ2VyLnVwZGF0ZVByZXZpZXdTcGhlcmUocHJvYmVDb21wb25lbnQucHJvYmUpO1xuICAgICAgICB9XG4gICAgICAgIGNjZS5FbmdpbmUucmVwYWludEluRWRpdE1vZGUoKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgX3dhaXRGb3JOZXh0RnJhbWUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkaXJlY3Rvci5vbmNlKERpcmVjdG9yLkVWRU5UX0VORF9GUkFNRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2NlLkVuZ2luZS5yZXBhaW50SW5FZGl0TW9kZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIF9hc3NlcnROb3RDYW5jZWwoKXtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRCYWtpbmdJbmZvPy5pc0NhbmNlbCl7XG4gICAgICAgICAgICB0aHJvdyAnY2FuY2VsJztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZmlsZXMgXG4gICAgICogQHBhcmFtIGlzSERSIFxuICAgICAqIEBwYXJhbSBzY2VuZU5hbWUgXG4gICAgICogQHBhcmFtIHByb2JlQ29tcG9uZW50VVVJRCBcbiAgICAgKiBAcGFyYW0gcHJvYmVJRCBcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIF9iYWtlUmVmbGVjdGlvblByb2JlKGZpbGVzOiBzdHJpbmdbXSwgaXNIRFI6IGJvb2xlYW4sIHNjZW5lTmFtZTogc3RyaW5nLCBwcm9iZUNvbXBvbmVudFVVSUQ6IHN0cmluZywgcHJvYmVJRDogbnVtYmVyLCBjYWxsYmFjazogRnVuY3Rpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYXNzZXRQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsICdkYjovL2Fzc2V0cycpO1xuICAgICAgICBpZiAoYXNzZXRQYXRoID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdubyBhc3NldCBkaXJlY3RvcnknKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBqb2luKGFzc2V0UGF0aCwgc2NlbmVOYW1lLCBmaWxlTmFtZSk7XG4gICAgICAgICAgICBmaWxlUGF0aHMucHVzaChwYXRoKTtcbiAgICAgICAgICAgIGlmICghZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocGF0aCArICcgbm90IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHNjZW5lUGF0aCA9IGpvaW4oYXNzZXRQYXRoLCBzY2VuZU5hbWUpO1xuICAgICAgICBpZiAoIWV4aXN0c1N5bmMoc2NlbmVQYXRoKSkge1xuICAgICAgICAgICAgbWtkaXJTeW5jKHNjZW5lUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlID0gam9pbihzY2VuZVBhdGgsICdyZWZsZWN0aW9uUHJvYmUnKTtcbiAgICAgICAgY29uc3QgcmVmbGVjdGlvblByb2JlTWFwID0gcmVmbGVjdGlvblByb2JlICsgJ18nICsgcHJvYmVJRC50b1N0cmluZygpO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXBXaXRoRXh0ID0gcmVmbGVjdGlvblByb2JlICsgJ18nICsgcHJvYmVJRC50b1N0cmluZygpICsgJy5wbmcnO1xuICAgICAgICBjb25zdCBsZHJIZHJGb3JtYXRTdHJpbmcgPSBpc0hEUiA/ICdyZ2JtJyA6ICdiZ3JhOCc7XG4gICAgICAgIGxldCByZWZsZWN0aW9uUHJvYmVNYXBDaGlsZDogQ2hpbGRQcm9jZXNzO1xuICAgICAgICBjb25zdCByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMgPSBbXG4gICAgICAgICAgICAnLS1ieXBhc3NvdXRwdXR0eXBlJyxcbiAgICAgICAgICAgICctLW91dHB1dDBwYXJhbXMnLFxuICAgICAgICAgICAgJ3BuZywnICsgbGRySGRyRm9ybWF0U3RyaW5nICsgJyxsYXRsb25nJyxcbiAgICAgICAgICAgICctLWlucHV0RmFjZVBvc1gnLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzBdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlTmVnWCcsXG4gICAgICAgICAgICBmaWxlUGF0aHNbMV0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VQb3NZJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1syXSxcbiAgICAgICAgICAgICctLWlucHV0RmFjZU5lZ1knLFxuICAgICAgICAgICAgZmlsZVBhdGhzWzNdLFxuICAgICAgICAgICAgJy0taW5wdXRGYWNlUG9zWicsXG4gICAgICAgICAgICBmaWxlUGF0aHNbNF0sXG4gICAgICAgICAgICAnLS1pbnB1dEZhY2VOZWdaJyxcbiAgICAgICAgICAgIGZpbGVQYXRoc1s1XSxcbiAgICAgICAgICAgICctLW91dHB1dDAnLFxuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwLFxuICAgICAgICBdO1xuXG4gICAgICAgIGlmIChpc0hEUikge1xuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwUGFyYW1zLnNwbGljZSgwLCAwLCAnLS1yZ2JtJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXNzZXJ0Tm90Q2FuY2VsKCk7XG4gICAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NCcpLCByZWZsZWN0aW9uUHJvYmVNYXBQYXJhbXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQgPSBzcGF3bihqb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL2NtZnQvY21mdFJlbGVhc2U2NC5leGUnKSwgcmVmbGVjdGlvblByb2JlTWFwUGFyYW1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSAoY29kZTogbnVtYmVyfG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdiYWtlIHJlZmxlY3Rpb25Qcm9iZSBmYWlsZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUoY29kZSk7ICAgICAgICAgICAgXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEJha2luZ0luZm8hLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50QmFraW5nSW5mbyEuaXNDYW5jZWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uQ2xvc2UpO1xuICAgICAgICAgICAgICAgIHJlZmxlY3Rpb25Qcm9iZU1hcENoaWxkLmtpbGwoKTtcbiAgICAgICAgICAgICAgICByZWplY3QoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmVmbGVjdGlvblByb2JlTWFwQ2hpbGQub24oJ2Nsb3NlJywgb25DbG9zZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVQYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXdhaXQgcmVtb3ZlKGZpbGVQYXRoc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWV0YVBhdGggPSByZWZsZWN0aW9uUHJvYmVNYXBXaXRoRXh0ICsgJy5tZXRhJztcbiAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgIG1ldGEudXNlckRhdGEudHlwZSA9ICd0ZXh0dXJlIGN1YmUnO1xuICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIG1ldGEsIHsgc3BhY2VzOiAyIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0SlNPTlN5bmMobWV0YVBhdGgsIHtcbiAgICAgICAgICAgICAgICB2ZXI6ICcwLjAuMCcsXG4gICAgICAgICAgICAgICAgaW1wb3J0ZXI6ICcqJyxcbiAgICAgICAgICAgICAgICB1c2VyRGF0YToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dHVyZSBjdWJlJyxcbiAgICAgICAgICAgICAgICAgICAgaXNSR0JFOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcblxuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvblByb2JlTWFwV2l0aEV4dCk7XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuXG4gICAgICAgIC8vIOS/ruaUuWVycC10ZXh0dXJlLWN1YmXnmoR1c2VyRGF0YS5taXBCYWtlTW9kZe+8jOeUqOadpeWvuWN1YmVtYXDlgZrljbfnp69cbiAgICAgICAgaWYgKGV4aXN0c1N5bmMobWV0YVBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCBtZXRhID0gcmVhZEpTT05TeW5jKG1ldGFQYXRoKTtcbiAgICAgICAgICAgIGlmIChtZXRhLnN1Yk1ldGFzPy5iNDdjMCkge1xuICAgICAgICAgICAgICAgIG1ldGEuc3ViTWV0YXMuYjQ3YzAudXNlckRhdGEubWlwQmFrZU1vZGUgPSAyO1xuICAgICAgICAgICAgICAgIG91dHB1dEpTT05TeW5jKG1ldGFQYXRoLCBtZXRhLCB7IHNwYWNlczogMiB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWZyZXNoLWFzc2V0JywgcmVmbGVjdGlvblByb2JlTWFwV2l0aEV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hc3NlcnROb3RDYW5jZWwoKTtcblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Fzc2VydE5vdENhbmNlbCgpO1xuICAgIFxuICAgICAgICBpZiAocmVmbGVjdGlvblByb2JlTWFwV2l0aEV4dCkge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCByZWZsZWN0aW9uUHJvYmVNYXBXaXRoRXh0KTtcblxuICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9leGlzdEZpbGVTZXQuYWRkKHV1aWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NhdmVQcm9maWxlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NldE1hbmFnZXIubG9hZEFueShgJHt1dWlkfUBiNDdjMGAsIChlcnJvcjogYW55LCBhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldCBjYW4ndCBiZSBsb2FkOiR7dXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cbiAgICAvKiog5piv5ZCm5omA5pyJ55qE6K+35rGC6YO95pS26ZuG5a6M5LqGICovXG4gICAgcHJvdGVjdGVkIF9pc0NsZWFyaW5nID0gZmFsc2U7XG4gICAgLyoqIOWujOaIkOeDmOeEmeeahOaVsOmHjyAqL1xuICAgIHByb3RlY3RlZCByZWFkb25seSBfZmluaXNoZWQ6IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvW10gPSBbXTtcblxufVxuXG5jb25zdCBpbnN0YW5jZSA9IEVkaXRvclJlZmxlY3Rpb25Qcm9iZU1hbmFnZXIuR0VUX0lOU1RBTkNFKCk7XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzOiBSZWZsZWN0aW9uUHJvYmVRdWVyeVJlcXVlc3QgJiBSZWZsZWN0aW9uUHJvYmVPcGVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICdzdGFydC1iYWtlJzogKHV1aWRzPzogcmVhZG9ubHkgc3RyaW5nW10pID0+IGluc3RhbmNlWydzdGFydC1iYWtlJ10odXVpZHMpLFxuICAgICdjYW5jZWwtYmFrZSc6ICh1dWlkcz86IHJlYWRvbmx5IHN0cmluZ1tdKSA9PiBpbnN0YW5jZVsnY2FuY2VsQmFrZXMnXSh1dWlkcyksXG4gICAgJ2NsZWFyLXJlc3VsdHMnOiBhc3luYyAoKSA9PiBhd2FpdCBpbnN0YW5jZVsnY2xlYXItcmVzdWx0cyddKCksXG4gICAgJ3F1ZXJ5LWJha2UtaW5mbyc6ICgpID0+IGluc3RhbmNlWydxdWVyeUFsbEJha2VJbmZvcyddKCksXG4gICAgJ3F1ZXJ5LWlzLWNsZWFyaW5nJzogKCkgPT4gaW5zdGFuY2VbJ3F1ZXJ5LWlzLWNsZWFyaW5nJ10oKSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkKCl7XG4gICAgYXdhaXQgaW5zdGFuY2Uub25Mb2FkKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKXtcbiAgICBpbnN0YW5jZS5vblVubG9hZCgpO1xuXG59Il19