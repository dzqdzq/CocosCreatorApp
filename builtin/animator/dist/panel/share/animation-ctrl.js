"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animationCtrl = void 0;
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const global_data_1 = require("./global-data");
const grid_ctrl_1 = require("./grid-ctrl");
const ipc_event_1 = require("./ipc-event");
const lodash = require('lodash');
/**
 * 存储动画实际数据与相关操作的类，例如动画播放状态更改、增删改查动画数据
 */
class AnimationCtrl {
    constructor() {
        this.clipConfig = {
            sample: 60,
            isLock: false,
            speed: 1,
            duration: 60,
            wrapMode: 0,
        };
        this.clipsDump = null;
        this.nodesDump = null;
        this.propRowIndex = {};
        this.__copyKeyInfo = null;
        this.__copyNodeInfo = null;
        this.__copyEventInfo = null;
        this.__copyPropInfo = null;
        this.animationState = 'stop';
        this.debounceCache = {};
        this.isCreatingAniClip = false;
        this.isNewClip = false;
    }
    get copyPropInfo() {
        return this.getClipBoardData('prop');
    }
    set copyPropInfo(val) {
        this.__copyPropInfo = JSON.parse(JSON.stringify(val));
        Editor.Clipboard.write('animation.prop', val);
    }
    get copyKeyInfo() {
        return this.getClipBoardData('key');
    }
    set copyKeyInfo(val) {
        this.__copyKeyInfo = JSON.parse(JSON.stringify(val));
        Editor.Clipboard.write('animation.key', val);
    }
    get copyEmbeddedPlayerDump() {
        return this.getClipBoardData('embeddedPlayer');
    }
    set copyEmbeddedPlayerDump(val) {
        this.__copyKeyInfo = JSON.parse(JSON.stringify(val));
        Editor.Clipboard.write('animation.embeddedPlayer', val);
    }
    get copyEventInfo() {
        return JSON.parse(JSON.stringify(this.__copyEventInfo)) || this.getClipBoardData('event');
    }
    set copyEventInfo(val) {
        this.__copyEventInfo = JSON.parse(JSON.stringify(val));
        Editor.Clipboard.write('animation.event', val);
    }
    get copyNodeInfo() {
        return this.getClipBoardData('node');
    }
    set copyNodeInfo(val) {
        this.__copyNodeInfo = JSON.parse(JSON.stringify(val));
        Editor.Clipboard.write('animation.node', val);
    }
    reset() {
        this.clipConfig = {
            sample: 60,
            isLock: false,
            speed: 1,
            duration: 60,
            wrapMode: 0,
        };
        this.clipsDump = null;
        this.nodesDump = null;
        this.propRowIndex = {};
        this.__copyKeyInfo = null;
        this.__copyNodeInfo = null;
        this.__copyEventInfo = null;
        this.__copyPropInfo = null;
        this.debounceCache = {};
    }
    getClipBoardData(type) {
        return Editor.Clipboard.read(`animation.${type}`);
    }
    init(vm) {
        this.vm = vm;
    }
    getPropData(nodePath, prop) {
        if (!this.clipsDump || !this.clipsDump?.pathsDump[nodePath] || !this.vm.properties) {
            return null;
        }
        let res = this.clipsDump.pathsDump[nodePath][prop];
        if (res && this.vm.properties[prop]) {
            res = Object.assign(JSON.parse(JSON.stringify(res)), this.vm.properties[prop]);
        }
        return res;
    }
    /**
     * 更改当前关键帧为参数值
     * @param frame
     */
    setCurrentFrame(frame) {
        this.vm.currentFrame = frame;
    }
    /**
     * 更新动画配置数据
     * @param type
     * @param value
     */
    async updateConfig(type, value) {
        switch (type) {
            case 'speed':
                (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IchangeClipSpeed)(this.vm.currentClip, value));
                break;
            case 'sample':
                (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IchangeClipSample)(this.vm.currentClip, value));
                break;
            case 'wrapMode':
                (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IchangeClipWrapMode)(this.vm.currentClip, Number(value)));
                break;
            case 'exit':
                await this.exit();
                break;
        }
    }
    async createAniCompFromAsset(asset) {
        return await Editor.Message.request('scene', 'execute-scene-script', {
            name: 'animator',
            method: 'createAniCompFromAsset',
            args: [this.vm.root, asset.map((info) => info.value), this.vm.aniCompType],
        });
    }
    async addClipFromAsset(assets) {
        // 需要确认是否已经有同 uuid 的 clip
        if (this.vm.clipsMenu) {
            const exitClip = this.vm.clipsMenu.find(item => (assets.find((info) => item.uuid === info.value)));
            if (exitClip) {
                return true;
            }
        }
        else {
            this.vm.clipsMenu = [];
        }
        const res = await this.createAniCompFromAsset(assets);
        if (res) {
            assets.forEach((info) => {
                this.vm.clipsMenu.push({
                    name: info.name,
                    uuid: info.value,
                });
            });
        }
        return res;
    }
    async addAnimationComponent() {
        // Editor.Message.send('scene', 'snapshot');
        const undoID = await Editor.Message.request('scene', 'begin-recording', this.vm.root);
        await Editor.Message.request('scene', 'create-component', {
            uuid: this.vm.root,
            component: 'cc.Animation',
        });
        // Editor.Message.send('scene', 'snapshot');
        await Editor.Message.request('scene', 'end-recording', undoID);
    }
    /**
     * 挂载新建的动画 clip
     * @returns
     */
    async createAniClip() {
        this.isCreatingAniClip = true;
        const uuid = await Editor.Message.request('asset-db', 'create-asset-dialog', 'cc.AnimationClip');
        if (uuid) {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
            if (!assetInfo) {
                return this.vm.currentClip;
            }
            await exports.animationCtrl.addClipFromAsset([{
                    value: assetInfo.uuid,
                    name: assetInfo.name,
                }]);
        }
        this.isCreatingAniClip = false;
        return uuid || '';
    }
    /**
     * 进入动画编辑模式 TODO 可以优化避免多余的消息发送
     */
    async enter(clipUuid) {
        return await (0, ipc_event_1.Irecord)(this.vm.root, true, clipUuid);
    }
    /**
     * 退出动画编辑模式
     */
    async exit() {
        if (this.vm.animationMode === false) {
            return false;
        }
        return await Editor.Message.request('scene', 'close-scene');
    }
    /**
     * 更新动画播放状态
     * @param state
     */
    async updatePlayState(state) {
        const that = this.vm;
        if (state === 'play') {
            if (that.animationState === 'pause') {
                state = 'resume';
            }
            (0, utils_1.multiplyTrackWithTimer)('hippoAnimator', {
                // 主动播放动画统计
                'A100003': 1,
                // 每次上报时需要带上当前项目id，project_id
                project_id: Editor.Project.uuid,
                // 每次上报时需要带上当前编辑的动画剪辑 clip_id
                clip_id: this.vm.currentClip,
                // 编辑器版本
                version: Editor.App.version,
            });
        }
        const changeSuccess = await (0, ipc_event_1.IchangeAnimationState)(state, that.currentClip);
        if (!changeSuccess) {
            console.warn(`${that.currentClip} change play status ${state} failed！`);
            return false;
        }
        this.animationState = state === 'resume' ? 'play' : state;
        return true;
    }
    async save() {
        return await Editor.Message.request('scene', 'save-clip');
    }
    // #region ********************* 关键帧操作相关 *********************
    callByDebounce(funcName, ...arg) {
        // @ts-ignore
        const originalFunc = this[funcName];
        if (!originalFunc) {
            return false;
        }
        if (!this.debounceCache[funcName]) {
            this.debounceCache[funcName] = lodash.debounce(originalFunc, 300);
        }
        return this.debounceCache[funcName].call(this, ...arg);
    }
    /**
     * 排列关键帧
     * @param spacingFrame
     */
    spacingKeys(spacingFrame) {
        const that = this.vm;
        if (!that.selectKeyInfo || !that.selectKeyInfo.keyFrames.length) {
            return;
        }
        const sortDump = (0, utils_1.sortKeysToTreeMap)(that.selectKeyInfo.keyFrames);
        if (Object.keys(sortDump).length === 0) {
            return;
        }
        const spacingKeyOpList = [];
        const newSelecteInfo = {
            nodePath: that.selectKeyInfo.nodePath,
            prop: that.selectKeyInfo.prop,
            keyFrames: [],
            location: 'prop',
        };
        Object.keys(sortDump).forEach((path) => {
            const item = sortDump[path];
            // 只有一个关键帧不参与排列
            if (item.frames.length <= 1) {
                return;
            }
            const startFrame = item.frames[0];
            const keyFrames = item.frames.map((frame, i) => {
                const keyData = {
                    x: grid_ctrl_1.gridCtrl.grid.valueToPixelH(startFrame + i * spacingFrame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                    rawFrame: frame,
                    nodePath: item.nodePath,
                    prop: item.prop,
                    frame: startFrame + i * spacingFrame,
                    offsetFrame: startFrame + i * spacingFrame - frame,
                };
                return {
                    ...keyData,
                    key: (0, utils_1.calcKeyFrameKey)(keyData),
                };
            });
            newSelecteInfo.keyFrames.push(...keyFrames);
            // 分量轨道与父轨道同时选中时，剔除分量轨道
            const parentProp = exports.animationCtrl.clipsDump.pathsDump[item.nodePath][item.prop].parentPropKey;
            if (parentProp && sortDump[item.nodePath + parentProp]) {
                return;
            }
            spacingKeyOpList.push((0, ipc_event_1.IspacingKeys)(that.currentClip, item.nodePath, item.prop, item.frames, spacingFrame));
        });
        (0, ipc_event_1.IApplyOperation)(spacingKeyOpList);
        that.selectKeyInfo = newSelecteInfo;
    }
    /**
     * 复制关键帧
     * @param params
     */
    copyKey(params) {
        if (params && params.frame) {
            const { nodePath, prop } = params;
            const propData = this.clipsDump?.pathsDump[nodePath][prop];
            if (!propData) {
                return;
            }
            const curvesDump = [];
            // TODO 需要尽量合并操作消息
            if (propData.partKeys) {
                for (const childProp of propData.partKeys) {
                    const childPropData = this.clipsDump.pathsDump[nodePath][childProp];
                    const keyFrame = childPropData.keyFrames.find((item) => item.frame === params.frame);
                    if (!keyFrame) {
                        continue;
                    }
                    curvesDump.push({
                        nodePath,
                        key: childProp,
                        type: childPropData.type,
                        displayName: childPropData.displayName,
                        keyframes: [keyFrame.curve && (0, utils_1.transCurveKeyToDumpKey)(keyFrame.curve, childPropData.type) || keyFrame],
                        _parentType: propData.type,
                        postExtrap: childPropData.postExtrap,
                        preExtrap: childPropData.preExtrap,
                        isCurveSupport: childPropData.isCurveSupport,
                    });
                }
            }
            else {
                const keyFrame = propData.keyFrames.find((item) => item.frame === params.frame);
                keyFrame && curvesDump.push({
                    nodePath,
                    key: prop,
                    type: propData.type,
                    displayName: propData.displayName,
                    keyframes: [keyFrame.curve && (0, utils_1.transCurveKeyToDumpKey)(keyFrame.curve, propData.type) || keyFrame],
                    postExtrap: propData.postExtrap,
                    preExtrap: propData.preExtrap,
                    isCurveSupport: propData.isCurveSupport,
                });
            }
            curvesDump.length && (this.copyKeyInfo = {
                curvesDump,
                leftFrame: params.frame,
            });
            return;
        }
        if (this.vm.selectKeyInfo) {
            const copyKeyInfo = this.transSelectToCopyKeyInfo();
            if (copyKeyInfo.curvesDump.length) {
                this.copyKeyInfo = copyKeyInfo;
            }
            return;
        }
    }
    /**
     * 新建关键帧
     * @param info
     */
    createKey(info, options) {
        const vm = this.vm;
        info.frame = info.frame ?? vm.currentFrame;
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IcreateKey)(vm.currentClip, info.nodePath, info.prop, Number(info.frame), info.value), options);
    }
    /**
     * 批量新建关键帧
     * @param infos
     */
    createKeyBatch(infos) {
        const vm = this.vm;
        const createOperate = [];
        infos.forEach((info) => {
            info.frame = info.frame || vm.currentFrame;
            createOperate.push((0, ipc_event_1.IcreateKey)(vm.currentClip, info.nodePath, info.prop, Number(info.frame), info.value));
        });
        (0, ipc_event_1.IApplyOperation)(createOperate);
    }
    async pasteEmbeddedPlayer(currentFrame, embeddedPlayerDumps, group) {
        const offsetFrame = currentFrame - embeddedPlayerDumps[0].begin;
        const operations = [];
        embeddedPlayerDumps.forEach((embeddedPlayer) => {
            embeddedPlayer.begin += offsetFrame;
            embeddedPlayer.end += offsetFrame;
            embeddedPlayer.group = group || embeddedPlayer.group;
            operations.push((0, ipc_event_1.addEmbeddedPlayer)(this.vm.currentClip, embeddedPlayer));
        });
        await (0, ipc_event_1.IApplyOperation)(operations);
    }
    /**
     * 粘贴关键帧
     * @param targetInfo
     */
    pasteKey(targetInfo, copyKeyInfo) {
        copyKeyInfo = copyKeyInfo || this.copyKeyInfo;
        if (!copyKeyInfo) {
            return;
        }
        const copyTasks = [];
        let curvesDump = copyKeyInfo.curvesDump;
        if (targetInfo.prop) {
            curvesDump = (0, utils_1.pickTargetCurveDump)({
                nodePath: targetInfo.nodePath,
                prop: targetInfo.prop,
            }, curvesDump, exports.animationCtrl.clipsDump.pathsDump);
            // 优先粘贴目标属性轨道找到与复制属性轨道一致的轨道
            const propData = exports.animationCtrl.clipsDump.pathsDump[targetInfo.nodePath][targetInfo.prop];
            // 粘贴轨道未父轨道时，pickTargetCurveDump 筛选出的已经是符合使用需求的轨道数组
            if (curvesDump.length && !propData.partKeys) {
                const startFrame = curvesDump[0].keyframes[0].frame;
                copyTasks.push((0, ipc_event_1.IcopyKeys)(this.vm.currentClip, { curvesDump: [curvesDump[0]] }, {
                    startFrame: targetInfo.target + (startFrame - copyKeyInfo.leftFrame),
                    nodePath: targetInfo.nodePath,
                    propKeys: [targetInfo.prop],
                }));
            }
        }
        if (!copyTasks.length) {
            // 当没有指定粘贴目标轨道或者指定目标轨道误，直接按照复制关键帧数据一一对应粘贴过去
            curvesDump.forEach((dump) => {
                if (!dump.keyframes.length) {
                    return;
                }
                const startFrame = dump.keyframes[0].frame;
                copyTasks.push((0, ipc_event_1.IcopyKeys)(this.vm.currentClip, { curvesDump: [dump] }, {
                    startFrame: targetInfo.target + (startFrame - copyKeyInfo.leftFrame),
                    nodePath: targetInfo.nodePath,
                    propKeys: [dump.key],
                }));
            });
        }
        (0, ipc_event_1.IApplyOperation)(copyTasks);
    }
    /**
     * 将当前选中关键帧信息转换为复制的关键帧信息
     */
    transSelectToCopyKeyInfo() {
        const dumps = (0, utils_1.sortKeysToTreeMap)(this.vm.selectKeyInfo.keyFrames);
        const curvesDump = [];
        Object.values(dumps).forEach((item) => {
            const rawPropData = this.clipsDump?.pathsDump[item.nodePath][item.prop];
            if (!rawPropData) {
                return;
            }
            if (rawPropData.partKeys) {
                for (const childKey of rawPropData.partKeys) {
                    const key = rawPropData.nodePath + childKey;
                    if (!dumps[key]) {
                        dumps[key] = {
                            prop: childKey,
                            nodePath: item.nodePath,
                            frames: [],
                            keyFrames: [],
                        };
                    }
                    dumps[key].frames.push(...item.frames);
                }
                return;
            }
        });
        Object.values(dumps).forEach((item) => {
            const rawPropData = this.clipsDump?.pathsDump[item.nodePath][item.prop];
            if (!rawPropData || rawPropData.partKeys) {
                return;
            }
            const parent = this.clipsDump.pathsDump[item.nodePath][rawPropData.parentPropKey];
            const rawKeyFrames = rawPropData.keyFrames.filter((keyFrame) => item.frames.includes(keyFrame.frame));
            const keyframes = rawKeyFrames.map((keyFrame) => {
                if (keyFrame.curve) {
                    return (0, utils_1.transCurveKeyToDumpKey)(keyFrame.curve, rawPropData.type);
                }
                return keyFrame;
            });
            if (!keyframes.length) {
                return;
            }
            curvesDump.push({
                nodePath: item.nodePath,
                key: item.prop,
                type: rawPropData.type,
                displayName: rawPropData.displayName,
                keyframes,
                _parentType: parent && parent.type,
                preExtrap: rawPropData.preExtrap,
                postExtrap: rawPropData.postExtrap,
                isCurveSupport: rawPropData.isCurveSupport,
            });
        });
        let leftFrame = (this.vm.stickInfo && this.vm.stickInfo.leftFrame) || this.vm.selectKeyInfo.keyFrames[0].frame;
        if (this.vm.selectKeyInfo.offsetFrame) {
            leftFrame = leftFrame - this.vm.selectKeyInfo.offsetFrame;
        }
        return {
            curvesDump,
            leftFrame,
        };
    }
    /**
     * 移除关键帧
     * @param params
     * @param forceSingle 强制移除单个关键帧
     */
    async removeKey(params, forceSingle = false) {
        const that = this.vm;
        // 移除传递参数的关键帧数据，不传递 frame 时使用当前小红线位置
        if (params) {
            let removeParams = [];
            if (!Array.isArray(params)) {
                removeParams.push(params);
            }
            else {
                removeParams = params;
            }
            const removeOpList = [];
            removeParams.forEach((params) => {
                if (typeof params.frame !== 'number') {
                    params.frame = this.vm.currentFrame;
                }
                if (that.selectKeyInfo && !forceSingle) {
                    const key = params.nodePath + params.prop;
                    const sortDumps = that.selectKeyInfo.sortDump || (0, utils_1.sortKeysToTreeMap)(that.selectKeyInfo.keyFrames);
                    // 要移除的关键帧不属于选中关键帧才可以移除单个
                    if (sortDumps[key] && !sortDumps[key].frames.includes(params.frame)) {
                        removeOpList.push((0, ipc_event_1.IremoveKey)(that.currentClip, params.nodePath, params.prop, params.frame));
                        return;
                    }
                }
                else {
                    // 当前没有选中关键帧，单独移除选中帧数据
                    removeOpList.push((0, ipc_event_1.IremoveKey)(that.currentClip, params.nodePath, params.prop, params.frame));
                }
            });
            if (removeOpList.length > 0) {
                const removeSuccess = await (0, ipc_event_1.IApplyOperation)(removeOpList);
                if (!removeSuccess) {
                    return;
                }
                return;
            }
        }
        // 移除选中关键帧
        if (!that.selectKeyInfo) {
            return;
        }
        const removeDump = that.selectKeyInfo.sortDump || (0, utils_1.sortKeysToTreeMap)(that.selectKeyInfo.keyFrames);
        const removeKeyOpList = [];
        for (const path of Object.keys(removeDump)) {
            const param = removeDump[path];
            removeKeyOpList.push((0, ipc_event_1.IremoveKey)(that.currentClip, param.nodePath, param.prop, param.frames));
        }
        const removeSelectSuccess = await (0, ipc_event_1.IApplyOperation)(removeKeyOpList);
        if (!removeSelectSuccess) {
            return;
        }
        that.selectKeyInfo = null;
    }
    /**
     * 移动当前选中的已经拖动一定距离的关键帧 + 缩放关键帧
     * 注意：需要整理数据，仅发送分量轨道数据，分量与主轨道数据一起发送由于场景按照顺序移动会出现重合关键帧丢失
     */
    async moveKeys() {
        const that = this.vm;
        if (!that.selectKeyInfo) {
            return false;
        }
        const { offsetFrame } = that.selectKeyInfo;
        if (offsetFrame === 0 && (!global_data_1.Flags.startDragStickInfo || global_data_1.Flags.startDragStickInfo.type === 'center') && !that.selectKeyInfo.ctrl) {
            return false;
        }
        const moveKeyOpList = [];
        const movePaths = (0, utils_1.changeParentToPart)(that.selectKeyInfo.keyFrames, exports.animationCtrl.clipsDump.pathsDump);
        // 缩放关键帧
        if (global_data_1.Flags.startDragStickInfo && global_data_1.Flags.startDragStickInfo.type !== 'center') {
            for (const key of Object.keys(movePaths)) {
                const frames = [];
                const offsets = [];
                let nodePath = undefined;
                let prop = undefined;
                movePaths[key].keyFrames.forEach((param) => {
                    if (!param.offsetFrame && !offsetFrame) {
                        return;
                    }
                    frames.push(param.rawFrame);
                    offsets.push(param.offsetFrame ?? offsetFrame);
                    if (!nodePath) {
                        nodePath = param.nodePath;
                    }
                    if (!prop) {
                        prop = param.prop;
                    }
                });
                if (nodePath && prop) {
                    moveKeyOpList.push((0, ipc_event_1.ImoveKeys)(that.currentClip, nodePath, prop, frames, offsets));
                }
            }
        }
        else {
            for (const path of Object.keys(movePaths)) {
                const param = movePaths[path];
                if (!param.offsetFrame && !offsetFrame) {
                    continue;
                }
                moveKeyOpList.push((0, ipc_event_1.ImoveKeys)(that.currentClip, param.nodePath, param.prop, param.frames, param.offsetFrame ?? offsetFrame));
            }
        }
        if (moveKeyOpList.length === 0) {
            return false;
        }
        const moveResult = await (0, ipc_event_1.IApplyOperation)(moveKeyOpList);
        if (!moveResult) {
            that.selectKeyInfo = null;
            return false;
        }
        return true;
    }
    // #endregion
    // #region ********************* 事件帧相关处理 *********************
    /**
     * 添加事件帧
     * @param frame
     */
    addEvent(frame) {
        if (typeof frame !== 'number') {
            frame = Number(this.vm.currentFrame);
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IaddEvent)(this.vm.currentClip, frame, '', []));
    }
    /**
     * 删除事件帧
     * @param frames
     */
    async deleteEvent(frames) {
        const that = this.vm;
        if (that.selectEventInfo && !frames) {
            frames = that.selectEventInfo.frames;
            that.selectEventInfo = null;
        }
        if (!frames) {
            return false;
        }
        const deleteEventsOpList = [];
        for (const frame of frames) {
            deleteEventsOpList.push((0, ipc_event_1.IdeleteEvent)(that.currentClip, frame));
        }
        const success = await (0, ipc_event_1.IApplyOperation)(deleteEventsOpList);
        if (!success) {
            return false;
        }
        return true;
    }
    /**
     * 拷贝事件信息
     * @param eventInfo
     */
    copyEvents(frames) {
        const that = this.vm;
        frames = frames || (that.selectEventInfo && that.selectEventInfo.frames) || [];
        if (!frames) {
            return;
        }
        this.copyEventInfo = {
            eventsDump: this.clipsDump.events.filter((eventInfo) => frames.includes(eventInfo.frame)),
        };
    }
    /**
     * 把拷贝的关键帧数据拷贝到某一关键帧
     * @param frame
     */
    pasteEvent(target, copyEventInfo) {
        const that = this.vm;
        copyEventInfo = copyEventInfo || this.copyEventInfo;
        if (!copyEventInfo) {
            return;
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IcopyEvent)(that.currentClip, copyEventInfo, {
            startFrame: target,
        }));
        that.selectEventInfo = null;
    }
    /**
     * 确认移动当前的移动事件帧数据
     */
    async moveEvents() {
        const that = this.vm;
        if (!that.selectEventInfo) {
            return false;
        }
        const { frames, offsetFrame } = that.selectEventInfo;
        const success = await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.ImoveEvents)(that.currentClip, frames, offsetFrame));
        if (!success) {
            return false;
        }
        that.selectEventInfo.frames = [...new Set(that.selectEventInfo.data.map((item) => item.frame))];
        that.selectEventInfo.offsetFrame -= offsetFrame;
        return true;
    }
    // #endregion
    // #region ********************* 轨道操作相关 *********************
    /**
     * 创建某个属性轨道
     * @param param
     * @param multi 是否为多个选中节点添加属性轨道
     */
    createProp(param, multi) {
        const createProps = [];
        if (multi && this.vm.selectedIds.size) {
            for (const uuid of this.vm.selectedIds.values()) {
                // 选中节点可能不在动画节点内
                if (!this.nodesDump.uuid2path[uuid]) {
                    break;
                }
                createProps.push((0, ipc_event_1.IcreateProp)(this.vm.currentClip, this.nodesDump.uuid2path[uuid], param.prop));
            }
        }
        else {
            createProps.push((0, ipc_event_1.IcreateProp)(this.vm.currentClip, param.nodePath || this.vm.computeSelectPath, param.prop));
        }
        (0, ipc_event_1.IApplyOperation)(createProps);
    }
    /**
     * 清空某个属性轨道
     * @param param
     */
    async clearPropKeys(param) {
        const shouldClear = await checkClearPropData(param.prop);
        if (!shouldClear) {
            return;
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IclearKeys)(this.vm.currentClip, param.nodePath, param.prop));
    }
    /**
     * 移除某个属性轨道
     * @param param
     */
    async removeProp(param) {
        const that = this.vm;
        const shouldRemove = await checkRemoveProp(param.prop);
        if (!shouldRemove) {
            return;
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IremoveProp)(that.currentClip, param.nodePath, param.prop));
        // 删除的如果是选中轨道轨道后要将选中轨道信息清除
        if (that.selectProperty && param.prop === that.selectProperty.prop) {
            that.selectProperty = null;
        }
    }
    copyProp(param) {
        const propData = this.clipsDump?.pathsDump[param.nodePath][param.prop];
        if (!propData) {
            return;
        }
        const curvesDump = [(0, utils_1.propDataToCurveDump)(propData)];
        if (propData.partKeys) {
            // 拷贝主轨道的属性数据时，需要拆分多记录一份分量轨道的数据才能在粘贴时恢复分量轨道上的关键帧分布
            propData.partKeys.forEach((prop) => {
                curvesDump.push((0, utils_1.propDataToCurveDump)(this.clipsDump.pathsDump[param.nodePath][prop]));
            });
        }
        this.copyPropInfo = {
            curvesDump: curvesDump,
        };
    }
    pasteProp(param, propData) {
        const that = this.vm;
        propData = propData || this.copyPropInfo;
        if (!this.copyPropInfo || !param) {
            return;
        }
        let curvesDump = propData.curvesDump.filter((item) => {
            // 目前返回的相同字段有可能 extends 不同，不能深度比较
            return item.type?.value === param.type?.value;
        });
        if (!curvesDump.length) {
            console.warn(Editor.I18n.t('animator.property.can_not_paste_in_current_prop'));
            return;
        }
        // 只允许单选复制粘贴轨道、以及不允许删除分量轨道时才可以这样处理
        const curentProp = exports.animationCtrl.clipsDump.pathsDump[param.nodePath][param.prop];
        let propKeys = curentProp.partKeys;
        if (propKeys) {
            const curveInfo = curvesDump[0];
            const propDatas = exports.animationCtrl.clipsDump.pathsDump[param.nodePath];
            if (!propDatas[curveInfo.key]) {
                return;
            }
            curvesDump = propDatas[curveInfo.key].partKeys.map((prop) => {
                const data = JSON.parse(JSON.stringify(propDatas[prop]));
                // 优先查找复制数据内属性名称一致的属性轨道粘贴
                const copyCurveInfo = propData.curvesDump.find((item) => item.key === prop) || curveInfo;
                data.keyFrames = copyCurveInfo.keyframes;
                return (0, utils_1.propDataToCurveDump)(data);
            });
        }
        else {
            propKeys = [param.prop];
            if (curentProp.parentPropKey) {
                // 优先查找复制数据内属性名称一致的属性轨道粘贴
                const data = curvesDump.find((item) => item.key === param.prop);
                data && (curvesDump = [data]);
            }
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IcopyProp)(that.currentClip, {
            curvesDump: curvesDump,
        }, {
            nodePath: param.nodePath,
            propKeys: propKeys,
        }));
    }
    // #endregion
    // #region ********************* 节点关键帧操作相关 *********************
    async clearNodeKeys(nodePath) {
        const shouldClear = await checkClearNodeKeys();
        if (!shouldClear) {
            return;
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IremoveNode)(this.vm.currentClip, nodePath));
    }
    /**
     * 迁移节点数据到目标节点
     * @param targetNodePath
     * @param srcNodePath
     */
    moveNodeData(targetNodePath, srcNodePath) {
        const that = this.vm;
        if (that.moveNodePath) {
            (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IchangeNodeDataPath)(that.currentClip, srcNodePath || that.moveNodePath, targetNodePath));
            that.moveNodePath = '';
            if (that.selectProperty?.nodePath === (srcNodePath || that.moveNodePath)) {
                that.selectProperty = null;
            }
        }
    }
    /**
     * 拷贝节点
     * @param srcNodePath
     */
    copyNodeData(srcNodePaths) {
        const curvesDump = [];
        for (const path of srcNodePaths) {
            for (const prop of Object.keys(this.clipsDump.pathsDump[path])) {
                const propData = this.clipsDump.pathsDump[path][prop];
                // 节点数据不拷贝主轨道数据
                // if (propData.partKeys) {
                //     continue;
                // }
                curvesDump.push((0, utils_1.propDataToCurveDump)(propData));
            }
        }
        this.copyNodeInfo = {
            curvesDump,
        };
    }
    /**
     * 粘贴动画节点
     * @param targetNodePath，目前粘贴的动画节点数据只会在同一个节点下
     */
    pasteNodeData(targetNodePath, nodeDump) {
        nodeDump = nodeDump || this.copyNodeInfo;
        if (!nodeDump || !targetNodePath) {
            return;
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IcopyNode)(this.vm.currentClip, nodeDump, {
            nodePath: targetNodePath,
        }));
    }
    // #endregion
    // #region ********************* 嵌入播放器操作相关 *********************
    /**
     * 清空某个节点上的嵌入播放器
     * @param nodePath
     * @returns
     */
    async clearEmbeddedPlayer(nodePath) {
        nodePath = nodePath || this.vm.computeSelectPath;
        return await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.clearEmbeddedPlayer)(this.vm.currentClip, nodePath));
    }
    /**
     * 添加嵌入播放器
     * @param info
     * @returns
     */
    async addEmbeddedPlayer(info) {
        const res = await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.addEmbeddedPlayer)(this.vm.currentClip, info));
        (0, utils_1.multiplyTrackWithTimer)('hippoAnimator', {
            'A100002': 1,
            // 每次上报时需要带上当前项目id，project_id
            project_id: Editor.Project.uuid,
            // 每次上报时需要带上当前编辑的动画剪辑 clip_id
            clip_id: this.vm.currentClip,
            // 编辑器版本
            version: Editor.App.version,
        });
        return res;
    }
    /**
    /**
     * 删除嵌入播放器
     * @param embeddedPlayerDump
     * @returns
     */
    async deleteEmbeddedPlayer(embeddedPlayerDump) {
        return await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.deleteEmbeddedPlayer)(this.vm.currentClip, embeddedPlayerDump));
    }
    /**
     * 修改嵌入播放器
     * @param rawEmbeddedPlayer
     * @param newEmbeddedPlayer
     */
    async updateEmbeddedPlayer(rawEmbeddedPlayer, newEmbeddedPlayer) {
        return await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.updateEmbeddedPlayer)(this.vm.currentClip, rawEmbeddedPlayer, newEmbeddedPlayer));
    }
    // #endregion
    // #region *********************  辅助曲线操作相关 *********************
    async createAuxKey(name, frame, data, options) {
        return (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.createAuxKey)(this.vm.currentClip, name, frame ?? this.vm.currentFrame, data), options);
    }
    async removeAuxKey(name, frame) {
        return (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.removeAuxKey)(this.vm.currentClip, name, frame ?? this.vm.currentFrame));
    }
    async moveAuxKey(frames, offsetFrame) {
        const clip = this.vm.currentClip;
        // group keyframe by curve name
        const groups = (0, lodash_1.groupBy)(frames, (frame) => frame.key);
        const names = Object.keys(groups);
        const operations = names.map((name) => {
            const frameData = groups[name];
            // 把同一个 curve 的操作压缩在一次 operation 里
            const framesArr = frameData.reduce((prev, curr) => {
                prev.push(curr.rawFrame);
                return prev;
            }, []);
            return (0, ipc_event_1.moveAuxKeys)(clip, name, framesArr, offsetFrame);
        });
        return (0, ipc_event_1.IApplyOperation)(operations);
    }
    async copyAuxKey(src, dest) {
        return (0, ipc_event_1.IApplyOperation)([(0, ipc_event_1.copyAuxKey)(this.vm.currentClip, src, dest)]);
    }
    // #endregion
    /**
     * 清空缓存
     */
    clear() {
        this.__copyPropInfo = null;
        this.__copyEventInfo = null;
        this.__copyKeyInfo = null;
        this.__copyNodeInfo = null;
    }
}
exports.animationCtrl = new AnimationCtrl();
function T(key, type = '') {
    return Editor.I18n.t(`animator.${type}${key}`);
}
// 移除属性轨道
async function checkRemoveProp(propName) {
    const t = T;
    const result = await Editor.Dialog.warn(t('is_remove_prop.message'), {
        title: `${t('is_remove_prop.title')}(${propName})`,
        buttons: [t('cancel'), t('is_remove_prop.remove')],
        default: 0,
        cancel: 0,
    });
    if (result.response === 1) {
        return true;
    }
}
// 清空属性关键帧提示
async function checkClearPropData(propName) {
    const t = T;
    const result = await Editor.Dialog.warn(t('is_clear_prop.message'), {
        title: `${t('is_clear_prop.title')}(${propName})`,
        buttons: [t('cancel'), t('is_clear_prop.remove')],
        default: 1,
        cancel: 0,
    });
    if (result.response === 1) {
        return true;
    }
}
// 清空节点轨道
async function checkClearNodeKeys() {
    const t = T;
    const result = await Editor.Dialog.warn(t('is_clear_message'), {
        title: t('is_clear'),
        buttons: [t('cancel'), t('clear')],
        default: 0,
        cancel: 0,
    });
    if (result.response === 1) {
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWN0cmwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWwvc2hhcmUvYW5pbWF0aW9uLWN0cmwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQWlDO0FBcUNqQyxvQ0FBcU07QUFDck0sK0NBQXNDO0FBQ3RDLDJDQUF1QztBQUN2QywyQ0FpQ3FCO0FBU3JCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQVNqQzs7R0FFRztBQUNILE1BQU0sYUFBYTtJQUFuQjtRQUNXLGVBQVUsR0FBZ0I7WUFDN0IsTUFBTSxFQUFFLEVBQUU7WUFDVixNQUFNLEVBQUUsS0FBSztZQUNiLEtBQUssRUFBRSxDQUFDO1lBQ1IsUUFBUSxFQUFFLEVBQUU7WUFDWixRQUFRLEVBQUUsQ0FBQztTQUNkLENBQUM7UUFDSyxjQUFTLEdBQXNCLElBQUksQ0FBQztRQUNwQyxjQUFTLEdBQXNCLElBQUksQ0FBQztRQUNwQyxpQkFBWSxHQUEyQixFQUFFLENBQUM7UUFFekMsa0JBQWEsR0FBMkIsSUFBSSxDQUFDO1FBQzdDLG1CQUFjLEdBQWdDLElBQUksQ0FBQztRQUNuRCxvQkFBZSxHQUFpQyxJQUFJLENBQUM7UUFDckQsbUJBQWMsR0FBZ0MsSUFBSSxDQUFDO1FBQ3BELG1CQUFjLEdBQXdCLE1BQU0sQ0FBQztRQStDNUMsa0JBQWEsR0FBNkIsRUFBRSxDQUFDO1FBaUg5QyxzQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFzQnpCLGNBQVMsR0FBRyxLQUFLLENBQUM7SUEwMEI5QixDQUFDO0lBOS9CRyxJQUFJLFlBQVk7UUFDWixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxZQUFZLENBQUMsR0FBeUI7UUFDdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMs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N0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1osTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsRUFBRTtRQUMzRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUNwQixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sRUFBRSxDQUFDO1FBQ1YsTUFBTSxFQUFFLENBQUM7S0FDWixDQUFDLENBQUM7SUFDSCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ3JvdXBCeSB9IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IEFzc2V0SW5mbyB9IGZyb20gJy4uLy4uLy4uLy4uL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IHtcbiAgICBBbmltYXRpb25PcGVyYXRpb25PcHRpb25zLFxuICAgIElBbmltQ29weUF1eERlc3QsXG4gICAgSUFuaW1Db3B5QXV4U3JjLFxuICAgIElBbmltQ29weUV2ZW50U3JjSW5mbyxcbiAgICBJQW5pbUNvcHlLZXlTcmNJbmZvLFxuICAgIElBbmltQ29weU5vZGVTcmNJbmZvLFxuICAgIElBbmltQ29weVByb3BTcmNJbmZvLFxuICAgIElFbWJlZGRlZFBsYXllcnMsXG59IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IHtcbiAgICBJQ2xpcENvbmZpZyxcbiAgICBJQ2xpcER1bXBzLFxuICAgIElOb2Rlc0R1bXAsXG4gICAgSVByb3BQYXJhbXMsXG4gICAgSVNvcnREdW1wcyxcbiAgICBJU29ydER1bXAsXG4gICAgSVNlbGVjdFBhcmFtLFxuICAgIElFdmVudEluZm8sXG4gICAgSVByb3BEYXRhLFxuICAgIElTZWxlY3RLZXksXG4gICAgSUtleUZyYW1lLFxuICAgIElBbmlWTVRoaXMsXG4gICAgSUFuaVByb3BDdXJ2ZUR1bXBEYXRhLFxuICAgIElLZXlGcmFtZURhdGEsXG4gICAgSUFuaW1hdGlvblN0YXRlVHlwZSxcbiAgICBJU2VsZWN0UHJvcGVydHksXG4gICAgSUNyZWF0ZUVtYmVkZGVkUGxheWVySW5mbyxcbiAgICBJQ3JlYXRlS2V5SW5mbyxcbiAgICBJRW1iZWRkZWRQbGF5ZXJHcm91cCxcbiAgICBJS2V5ZnJhbWVEYXRhQmFzZSxcbiAgICBJUHJvcEN1c3RvbURhdGEsXG59IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgY2FsY0tleUZyYW1lS2V5LCBjaGFuZ2VQYXJlbnRUb1BhcnQsIG11bHRpcGx5VHJhY2tXaXRoVGltZXIsIHBpY2tUYXJnZXRDdXJ2ZUR1bXAsIHByb3BEYXRhVG9DdXJ2ZUR1bXAsIHNvcnRLZXlzVG9UcmVlTWFwLCB0cmFuc0N1cnZlS2V5VG9EdW1wS2V5LCB0cmFuc2Zvcm1DdXJ2ZUtleVRvRHVtcCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IEZsYWdzIH0gZnJvbSAnLi9nbG9iYWwtZGF0YSc7XG5pbXBvcnQgeyBncmlkQ3RybCB9IGZyb20gJy4vZ3JpZC1jdHJsJztcbmltcG9ydCB7XG4gICAgSWFkZEV2ZW50LFxuICAgIElBbmltT3BlcmF0aW9uLFxuICAgIElBcHBseU9wZXJhdGlvbixcbiAgICBJY2hhbmdlQW5pbWF0aW9uU3RhdGUsXG4gICAgSWNoYW5nZUNsaXBTYW1wbGUsXG4gICAgSWNoYW5nZUNsaXBTcGVlZCxcbiAgICBJY2hhbmdlQ2xpcFdyYXBNb2RlLFxuICAgIEljaGFuZ2VOb2RlRGF0YVBhdGgsXG4gICAgSWNsZWFyS2V5cyxcbiAgICBJY29weUtleXMsXG4gICAgSWNvcHlQcm9wLFxuICAgIEljb3B5Tm9kZSxcbiAgICBJY3JlYXRlS2V5LFxuICAgIEljcmVhdGVQcm9wLFxuICAgIElkZWxldGVFdmVudCxcbiAgICBJbW92ZUV2ZW50cyxcbiAgICBJbW92ZUtleXMsXG4gICAgSXJlbW92ZUtleSxcbiAgICBJcmVtb3ZlTm9kZSxcbiAgICBJcmVtb3ZlUHJvcCxcbiAgICBJc3BhY2luZ0tleXMsXG4gICAgSXNldEVkaXRDbGlwLFxuICAgIEljb3B5RXZlbnQsXG4gICAgSXJlY29yZCxcbiAgICBjbGVhckVtYmVkZGVkUGxheWVyLFxuICAgIGFkZEVtYmVkZGVkUGxheWVyLFxuICAgIHVwZGF0ZUVtYmVkZGVkUGxheWVyLFxuICAgIGRlbGV0ZUVtYmVkZGVkUGxheWVyLFxuICAgIGNyZWF0ZUF1eEtleSxcbiAgICByZW1vdmVBdXhLZXksXG4gICAgbW92ZUF1eEtleXMsXG4gICAgY29weUF1eEtleSxcbn0gZnJvbSAnLi9pcGMtZXZlbnQnO1xuXG50eXBlIE1ldGhvZE5hbWVzPFQ+ID0geyBbSyBpbiBrZXlvZiBUXTogVFtLXSBleHRlbmRzIEZ1bmN0aW9uID8gSyA6IG5ldmVyIH1ba2V5b2YgVF07XG50eXBlIEF2YWlsYWJsZURlYm91bmNlRnVuYyA9IEV4Y2x1ZGU8TWV0aG9kTmFtZXM8QW5pbWF0aW9uQ3RybD4sICdjYWxsQnlEZWJvdW5jZSc+O1xuXG5pbnRlcmZhY2UgSUNvcHlLZXlTcmNJbmZvIGV4dGVuZHMgSUFuaW1Db3B5S2V5U3JjSW5mbyB7XG4gICAgbGVmdEZyYW1lOiBudW1iZXI7IC8vIOWkmumAieeahOacgOW3puS+p+WFs+mUruW4p1xufVxuXG5jb25zdCBsb2Rhc2ggPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuZXhwb3J0IHR5cGUgQW5pbWF0aW9uQ2xpcEJvYXJkRGF0YSA9IHtcbiAgICAncHJvcCc6IElBbmltQ29weVByb3BTcmNJbmZvLFxuICAgICdrZXknOiBJQ29weUtleVNyY0luZm8sXG4gICAgJ25vZGUnOiBJQW5pbUNvcHlOb2RlU3JjSW5mbyxcbiAgICAnZXZlbnQnOiBJQW5pbUNvcHlFdmVudFNyY0luZm8sXG4gICAgJ2VtYmVkZGVkUGxheWVyJzogSUVtYmVkZGVkUGxheWVyc1tdLFxufVxuLyoqXG4gKiDlrZjlgqjliqjnlLvlrp7pmYXmlbDmja7kuI7nm7jlhbPmk43kvZznmoTnsbvvvIzkvovlpoLliqjnlLvmkq3mlL7nirbmgIHmm7TmlLnjgIHlop7liKDmlLnmn6XliqjnlLvmlbDmja5cbiAqL1xuY2xhc3MgQW5pbWF0aW9uQ3RybCB7XG4gICAgcHVibGljIGNsaXBDb25maWc6IElDbGlwQ29uZmlnID0ge1xuICAgICAgICBzYW1wbGU6IDYwLFxuICAgICAgICBpc0xvY2s6IGZhbHNlLFxuICAgICAgICBzcGVlZDogMSxcbiAgICAgICAgZHVyYXRpb246IDYwLFxuICAgICAgICB3cmFwTW9kZTogMCxcbiAgICB9O1xuICAgIHB1YmxpYyBjbGlwc0R1bXA6IElDbGlwRHVtcHMgfCBudWxsID0gbnVsbDtcbiAgICBwdWJsaWMgbm9kZXNEdW1wOiBJTm9kZXNEdW1wIHwgbnVsbCA9IG51bGw7XG4gICAgcHVibGljIHByb3BSb3dJbmRleDogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4gICAgcHJpdmF0ZSBfX2NvcHlLZXlJbmZvOiBJQ29weUtleVNyY0luZm8gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9fY29weU5vZGVJbmZvOiBJQW5pbUNvcHlOb2RlU3JjSW5mbyB8IG51bGwgPSBudWxsO1xuICAgIHByaXZhdGUgX19jb3B5RXZlbnRJbmZvOiBJQW5pbUNvcHlFdmVudFNyY0luZm8gfCBudWxsID0gbnVsbDtcbiAgICBwcml2YXRlIF9fY29weVByb3BJbmZvOiBJQW5pbUNvcHlQcm9wU3JjSW5mbyB8IG51bGwgPSBudWxsO1xuICAgIHB1YmxpYyBhbmltYXRpb25TdGF0ZTogSUFuaW1hdGlvblN0YXRlVHlwZSA9ICdzdG9wJztcblxuICAgIGdldCBjb3B5UHJvcEluZm8oKTogSUFuaW1Db3B5UHJvcFNyY0luZm8ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDbGlwQm9hcmREYXRhKCdwcm9wJykhO1xuICAgIH1cblxuICAgIHNldCBjb3B5UHJvcEluZm8odmFsOiBJQW5pbUNvcHlQcm9wU3JjSW5mbykge1xuICAgICAgICB0aGlzLl9fY29weVByb3BJbmZvID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWwpKTtcbiAgICAgICAgRWRpdG9yLkNsaXBib2FyZC53cml0ZSgnYW5pbWF0aW9uLnByb3AnLCB2YWwpO1xuICAgIH1cblxuICAgIGdldCBjb3B5S2V5SW5mbygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2xpcEJvYXJkRGF0YSgna2V5JykhO1xuICAgIH1cblxuICAgIHNldCBjb3B5S2V5SW5mbyh2YWw6IElDb3B5S2V5U3JjSW5mbykge1xuICAgICAgICB0aGlzLl9fY29weUtleUluZm8gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHZhbCkpO1xuICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCdhbmltYXRpb24ua2V5JywgdmFsKTtcbiAgICB9XG5cbiAgICBnZXQgY29weUVtYmVkZGVkUGxheWVyRHVtcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2xpcEJvYXJkRGF0YSgnZW1iZWRkZWRQbGF5ZXInKSE7XG4gICAgfVxuXG4gICAgc2V0IGNvcHlFbWJlZGRlZFBsYXllckR1bXAodmFsOiBJRW1iZWRkZWRQbGF5ZXJzW10pIHtcbiAgICAgICAgdGhpcy5fX2NvcHlLZXlJbmZvID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWwpKTtcbiAgICAgICAgRWRpdG9yLkNsaXBib2FyZC53cml0ZSgnYW5pbWF0aW9uLmVtYmVkZGVkUGxheWVyJywgdmFsKTtcbiAgICB9XG5cbiAgICBnZXQgY29weUV2ZW50SW5mbygpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5fX2NvcHlFdmVudEluZm8pKSB8fCB0aGlzLmdldENsaXBCb2FyZERhdGEoJ2V2ZW50Jyk7XG4gICAgfVxuXG4gICAgc2V0IGNvcHlFdmVudEluZm8odmFsOiBJQW5pbUNvcHlFdmVudFNyY0luZm8pIHtcbiAgICAgICAgdGhpcy5fX2NvcHlFdmVudEluZm8gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHZhbCkpO1xuICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCdhbmltYXRpb24uZXZlbnQnLCB2YWwpO1xuICAgIH1cblxuICAgIGdldCBjb3B5Tm9kZUluZm8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENsaXBCb2FyZERhdGEoJ25vZGUnKSE7XG4gICAgfVxuXG4gICAgc2V0IGNvcHlOb2RlSW5mbyh2YWw6IElBbmltQ29weU5vZGVTcmNJbmZvKSB7XG4gICAgICAgIHRoaXMuX19jb3B5Tm9kZUluZm8gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHZhbCkpO1xuICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCdhbmltYXRpb24ubm9kZScsIHZhbCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkZWJvdW5jZUNhY2hlOiBSZWNvcmQ8c3RyaW5nLCBGdW5jdGlvbj4gPSB7fTtcbiAgICAvKiogQGRlcHJlY2F0ZWQgdm0sIGFuaW1hdGlvbkVkaXRvciwgYW5pbWF0aW9uQ3RybCDkuInogIXkvp3otZblhbPns7vmt7fkubEgKi9cbiAgICBwcml2YXRlIHZtITogSUFuaVZNVGhpcztcblxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmNsaXBDb25maWcgPSB7XG4gICAgICAgICAgICBzYW1wbGU6IDYwLFxuICAgICAgICAgICAgaXNMb2NrOiBmYWxzZSxcbiAgICAgICAgICAgIHNwZWVkOiAxLFxuICAgICAgICAgICAgZHVyYXRpb246IDYwLFxuICAgICAgICAgICAgd3JhcE1vZGU6IDAsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY2xpcHNEdW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2Rlc0R1bXAgPSBudWxsO1xuICAgICAgICB0aGlzLnByb3BSb3dJbmRleCA9IHt9O1xuICAgICAgICB0aGlzLl9fY29weUtleUluZm8gPSBudWxsO1xuICAgICAgICB0aGlzLl9fY29weU5vZGVJbmZvID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX2NvcHlFdmVudEluZm8gPSBudWxsO1xuICAgICAgICB0aGlzLl9fY29weVByb3BJbmZvID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZWJvdW5jZUNhY2hlID0ge307XG4gICAgfVxuXG4gICAgcHVibGljIGdldENsaXBCb2FyZERhdGE8ayBleHRlbmRzIGtleW9mIEFuaW1hdGlvbkNsaXBCb2FyZERhdGE+KHR5cGU6IGspOiBBbmltYXRpb25DbGlwQm9hcmREYXRhW2tdIHtcbiAgICAgICAgcmV0dXJuIEVkaXRvci5DbGlwYm9hcmQucmVhZChgYW5pbWF0aW9uLiR7dHlwZX1gKSBhcyB1bmtub3duIGFzIEFuaW1hdGlvbkNsaXBCb2FyZERhdGFba107XG4gICAgfVxuXG4gICAgcHVibGljIGluaXQodm06IGFueSkge1xuICAgICAgICB0aGlzLnZtID0gdm07XG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb3BEYXRhKG5vZGVQYXRoOiBzdHJpbmcsIHByb3A6IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMuY2xpcHNEdW1wIHx8ICF0aGlzLmNsaXBzRHVtcD8ucGF0aHNEdW1wW25vZGVQYXRoXSB8fCAhdGhpcy52bS5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzID0gdGhpcy5jbGlwc0R1bXAucGF0aHNEdW1wW25vZGVQYXRoXVtwcm9wXTtcbiAgICAgICAgaWYgKHJlcyAmJiB0aGlzLnZtLnByb3BlcnRpZXNbcHJvcF0pIHtcbiAgICAgICAgICAgIHJlcyA9IE9iamVjdC5hc3NpZ24oSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXMpKSwgdGhpcy52bS5wcm9wZXJ0aWVzW3Byb3BdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaUueW9k+WJjeWFs+mUruW4p+S4uuWPguaVsOWAvFxuICAgICAqIEBwYXJhbSBmcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRDdXJyZW50RnJhbWUoZnJhbWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZtLmN1cnJlbnRGcmFtZSA9IGZyYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOWKqOeUu+mFjee9ruaVsOaNrlxuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUNvbmZpZyh0eXBlOiAnc3BlZWQnIHwgJ3NhbXBsZScgfCAnd3JhcE1vZGUnIHwgJ2V4aXQnLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnc3BlZWQnOlxuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihJY2hhbmdlQ2xpcFNwZWVkKHRoaXMudm0uY3VycmVudENsaXAsIHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzYW1wbGUnOlxuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihJY2hhbmdlQ2xpcFNhbXBsZSh0aGlzLnZtLmN1cnJlbnRDbGlwLCB2YWx1ZSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnd3JhcE1vZGUnOlxuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihJY2hhbmdlQ2xpcFdyYXBNb2RlKHRoaXMudm0uY3VycmVudENsaXAsIE51bWJlcih2YWx1ZSkpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2V4aXQnOlxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZXhpdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNyZWF0ZUFuaUNvbXBGcm9tQXNzZXQoYXNzZXQ6IHsgdmFsdWU6IHN0cmluZywgbmFtZTogc3RyaW5nIH1bXSkge1xuICAgICAgICByZXR1cm4gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCB7XG4gICAgICAgICAgICBuYW1lOiAnYW5pbWF0b3InLFxuICAgICAgICAgICAgbWV0aG9kOiAnY3JlYXRlQW5pQ29tcEZyb21Bc3NldCcsXG4gICAgICAgICAgICBhcmdzOiBbdGhpcy52bS5yb290LCBhc3NldC5tYXAoKGluZm8pID0+IGluZm8udmFsdWUpLCB0aGlzLnZtLmFuaUNvbXBUeXBlXSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZENsaXBGcm9tQXNzZXQoYXNzZXRzOiB7IHZhbHVlOiBzdHJpbmcsIG5hbWU6IHN0cmluZyB9W10pIHtcbiAgICAgICAgLy8g6ZyA6KaB56Gu6K6k5piv5ZCm5bey57uP5pyJ5ZCMIHV1aWQg55qEIGNsaXBcbiAgICAgICAgaWYgKHRoaXMudm0uY2xpcHNNZW51KSB7XG4gICAgICAgICAgICBjb25zdCBleGl0Q2xpcCA9IHRoaXMudm0uY2xpcHNNZW51LmZpbmQoaXRlbSA9PiAoYXNzZXRzLmZpbmQoKGluZm8pID0+IGl0ZW0udXVpZCEgPT09IGluZm8udmFsdWUpKSk7XG4gICAgICAgICAgICBpZiAoZXhpdENsaXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudm0uY2xpcHNNZW51ID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmNyZWF0ZUFuaUNvbXBGcm9tQXNzZXQoYXNzZXRzKTtcbiAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgYXNzZXRzLmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnZtLmNsaXBzTWVudS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaW5mby5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBpbmZvLnZhbHVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgYWRkQW5pbWF0aW9uQ29tcG9uZW50KCkge1xuICAgICAgICAvLyBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuICAgICAgICBjb25zdCB1bmRvSUQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdiZWdpbi1yZWNvcmRpbmcnLCB0aGlzLnZtLnJvb3QpO1xuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtY29tcG9uZW50Jywge1xuICAgICAgICAgICAgdXVpZDogdGhpcy52bS5yb290LFxuICAgICAgICAgICAgY29tcG9uZW50OiAnY2MuQW5pbWF0aW9uJyxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2VuZC1yZWNvcmRpbmcnLCB1bmRvSUQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpc0NyZWF0aW5nQW5pQ2xpcCA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICog5oyC6L295paw5bu655qE5Yqo55S7IGNsaXBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgY3JlYXRlQW5pQ2xpcCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICB0aGlzLmlzQ3JlYXRpbmdBbmlDbGlwID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldC1kaWFsb2cnLCAnY2MuQW5pbWF0aW9uQ2xpcCcpO1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHV1aWQpO1xuICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52bS5jdXJyZW50Q2xpcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGFuaW1hdGlvbkN0cmwuYWRkQ2xpcEZyb21Bc3NldChbe1xuICAgICAgICAgICAgICAgIHZhbHVlOiBhc3NldEluZm8udXVpZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBhc3NldEluZm8ubmFtZSxcbiAgICAgICAgICAgIH1dKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzQ3JlYXRpbmdBbmlDbGlwID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB1dWlkIHx8ICcnO1xuICAgIH1cbiAgICBwcml2YXRlIGlzTmV3Q2xpcCA9IGZhbHNlO1xuICAgIC8qKlxuICAgICAqIOi/m+WFpeWKqOeUu+e8lui+keaooeW8jyBUT0RPIOWPr+S7peS8mOWMlumBv+WFjeWkmuS9meeahOa2iOaBr+WPkemAgVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBlbnRlcihjbGlwVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBJcmVjb3JkKHRoaXMudm0ucm9vdCwgdHJ1ZSwgY2xpcFV1aWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmAgOWHuuWKqOeUu+e8lui+keaooeW8j1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBleGl0KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBpZiAodGhpcy52bS5hbmltYXRpb25Nb2RlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjbG9zZS1zY2VuZScpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOWKqOeUu+aSreaUvueKtuaAgVxuICAgICAqIEBwYXJhbSBzdGF0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyB1cGRhdGVQbGF5U3RhdGUoc3RhdGU6IElBbmltYXRpb25TdGF0ZVR5cGUpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gJ3BsYXknKSB7XG4gICAgICAgICAgICBpZiAodGhhdC5hbmltYXRpb25TdGF0ZSA9PT0gJ3BhdXNlJykge1xuICAgICAgICAgICAgICAgIHN0YXRlID0gJ3Jlc3VtZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtdWx0aXBseVRyYWNrV2l0aFRpbWVyKCdoaXBwb0FuaW1hdG9yJywge1xuICAgICAgICAgICAgICAgIC8vIOS4u+WKqOaSreaUvuWKqOeUu+e7n+iuoVxuICAgICAgICAgICAgICAgICdBMTAwMDAzJzogMSxcbiAgICAgICAgICAgICAgICAvLyDmr4/mrKHkuIrmiqXml7bpnIDopoHluKbkuIrlvZPliY3pobnnm65pZO+8jHByb2plY3RfaWRcbiAgICAgICAgICAgICAgICBwcm9qZWN0X2lkOiBFZGl0b3IuUHJvamVjdC51dWlkLFxuICAgICAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjee8lui+keeahOWKqOeUu+WJqui+kSBjbGlwX2lkXG4gICAgICAgICAgICAgICAgY2xpcF9pZDogdGhpcy52bS5jdXJyZW50Q2xpcCxcbiAgICAgICAgICAgICAgICAvLyDnvJbovpHlmajniYjmnKxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoYW5nZVN1Y2Nlc3MgPSBhd2FpdCBJY2hhbmdlQW5pbWF0aW9uU3RhdGUoc3RhdGUsIHRoYXQuY3VycmVudENsaXApO1xuICAgICAgICBpZiAoIWNoYW5nZVN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgJHt0aGF0LmN1cnJlbnRDbGlwfSBjaGFuZ2UgcGxheSBzdGF0dXMgJHtzdGF0ZX0gZmFpbGVk77yBYCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hbmltYXRpb25TdGF0ZSA9IHN0YXRlID09PSAncmVzdW1lJyA/ICdwbGF5JyA6IHN0YXRlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2F2ZSgpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtY2xpcCcpO1xuICAgIH1cblxuICAgIC8vICNyZWdpb24gKioqKioqKioqKioqKioqKioqKioqIOWFs+mUruW4p+aTjeS9nOebuOWFsyAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIHB1YmxpYyBjYWxsQnlEZWJvdW5jZTxLIGV4dGVuZHMgQXZhaWxhYmxlRGVib3VuY2VGdW5jPihmdW5jTmFtZTogSywgLi4uYXJnOiBQYXJhbWV0ZXJzPEFuaW1hdGlvbkN0cmxbS10+KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxGdW5jID0gdGhpc1tmdW5jTmFtZV07XG4gICAgICAgIGlmICghb3JpZ2luYWxGdW5jKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmRlYm91bmNlQ2FjaGVbZnVuY05hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmRlYm91bmNlQ2FjaGVbZnVuY05hbWVdID0gbG9kYXNoLmRlYm91bmNlKG9yaWdpbmFsRnVuYywgMzAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5kZWJvdW5jZUNhY2hlW2Z1bmNOYW1lXS5jYWxsKHRoaXMsIC4uLmFyZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5o6S5YiX5YWz6ZSu5binXG4gICAgICogQHBhcmFtIHNwYWNpbmdGcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBzcGFjaW5nS2V5cyhzcGFjaW5nRnJhbWU6IG51bWJlcikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEtleUluZm8gfHwgIXRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29ydER1bXAgPSBzb3J0S2V5c1RvVHJlZU1hcCh0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzISk7XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhzb3J0RHVtcCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3BhY2luZ0tleU9wTGlzdDogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICBjb25zdCBuZXdTZWxlY3RlSW5mbzogSVNlbGVjdEtleSA9IHtcbiAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnNlbGVjdEtleUluZm8ubm9kZVBhdGgsXG4gICAgICAgICAgICBwcm9wOiB0aGF0LnNlbGVjdEtleUluZm8ucHJvcCxcbiAgICAgICAgICAgIGtleUZyYW1lczogW10sXG4gICAgICAgICAgICBsb2NhdGlvbjogJ3Byb3AnLFxuICAgICAgICB9O1xuICAgICAgICBPYmplY3Qua2V5cyhzb3J0RHVtcCkuZm9yRWFjaCgocGF0aDogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gc29ydER1bXBbcGF0aF07XG4gICAgICAgICAgICAvLyDlj6rmnInkuIDkuKrlhbPplK7luKfkuI3lj4LkuI7mjpLliJdcbiAgICAgICAgICAgIGlmIChpdGVtLmZyYW1lcy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0RnJhbWUgPSBpdGVtLmZyYW1lc1swXTtcbiAgICAgICAgICAgIGNvbnN0IGtleUZyYW1lcyA9IGl0ZW0uZnJhbWVzLm1hcCgoZnJhbWUsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICB4OiBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKHN0YXJ0RnJhbWUgKyBpICogc3BhY2luZ0ZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICByYXdGcmFtZTogZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiBpdGVtLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBwcm9wOiBpdGVtLnByb3AsXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiBzdGFydEZyYW1lICsgaSAqIHNwYWNpbmdGcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IHN0YXJ0RnJhbWUgKyBpICogc3BhY2luZ0ZyYW1lIC0gZnJhbWUsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAuLi5rZXlEYXRhLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGNhbGNLZXlGcmFtZUtleShrZXlEYXRhKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXdTZWxlY3RlSW5mby5rZXlGcmFtZXMucHVzaCguLi5rZXlGcmFtZXMpO1xuICAgICAgICAgICAgLy8g5YiG6YeP6L2o6YGT5LiO54i26L2o6YGT5ZCM5pe26YCJ5Lit5pe277yM5YmU6Zmk5YiG6YeP6L2o6YGTXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRQcm9wID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFtpdGVtLm5vZGVQYXRoXVtpdGVtLnByb3BdLnBhcmVudFByb3BLZXk7XG4gICAgICAgICAgICBpZiAocGFyZW50UHJvcCAmJiBzb3J0RHVtcFtpdGVtLm5vZGVQYXRoICsgcGFyZW50UHJvcF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGFjaW5nS2V5T3BMaXN0LnB1c2goSXNwYWNpbmdLZXlzKHRoYXQuY3VycmVudENsaXAsIGl0ZW0ubm9kZVBhdGgsIGl0ZW0ucHJvcCwgaXRlbS5mcmFtZXMsIHNwYWNpbmdGcmFtZSEpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIElBcHBseU9wZXJhdGlvbihzcGFjaW5nS2V5T3BMaXN0KTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gbmV3U2VsZWN0ZUluZm87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5aSN5Yi25YWz6ZSu5binXG4gICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAqL1xuICAgIHB1YmxpYyBjb3B5S2V5KHBhcmFtcz86IElQcm9wUGFyYW1zKSB7XG4gICAgICAgIGlmIChwYXJhbXMgJiYgcGFyYW1zLmZyYW1lKSB7XG4gICAgICAgICAgICBjb25zdCB7IG5vZGVQYXRoLCBwcm9wIH0gPSBwYXJhbXM7XG4gICAgICAgICAgICBjb25zdCBwcm9wRGF0YSA9IHRoaXMuY2xpcHNEdW1wPy5wYXRoc0R1bXBbbm9kZVBhdGhdW3Byb3BdO1xuICAgICAgICAgICAgaWYgKCFwcm9wRGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGN1cnZlc0R1bXA6IElBbmlQcm9wQ3VydmVEdW1wRGF0YVtdID0gW107XG4gICAgICAgICAgICAvLyBUT0RPIOmcgOimgeWwvemHj+WQiOW5tuaTjeS9nOa2iOaBr1xuICAgICAgICAgICAgaWYgKHByb3BEYXRhLnBhcnRLZXlzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZFByb3Agb2YgcHJvcERhdGEucGFydEtleXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRQcm9wRGF0YSA9IHRoaXMuY2xpcHNEdW1wIS5wYXRoc0R1bXBbbm9kZVBhdGhdW2NoaWxkUHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleUZyYW1lID0gY2hpbGRQcm9wRGF0YS5rZXlGcmFtZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5mcmFtZSA9PT0gcGFyYW1zLmZyYW1lKSE7XG4gICAgICAgICAgICAgICAgICAgIGlmICgha2V5RnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlc0R1bXAucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY2hpbGRQcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY2hpbGRQcm9wRGF0YSEudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBjaGlsZFByb3BEYXRhIS5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleWZyYW1lczogW2tleUZyYW1lLmN1cnZlICYmIHRyYW5zQ3VydmVLZXlUb0R1bXBLZXkoa2V5RnJhbWUuY3VydmUsIGNoaWxkUHJvcERhdGEudHlwZSkgfHwga2V5RnJhbWVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgX3BhcmVudFR5cGU6IHByb3BEYXRhLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0RXh0cmFwOiBjaGlsZFByb3BEYXRhIS5wb3N0RXh0cmFwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlRXh0cmFwOiBjaGlsZFByb3BEYXRhIS5wcmVFeHRyYXAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0N1cnZlU3VwcG9ydDogY2hpbGRQcm9wRGF0YSEuaXNDdXJ2ZVN1cHBvcnQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5RnJhbWUgPSBwcm9wRGF0YS5rZXlGcmFtZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5mcmFtZSA9PT0gcGFyYW1zLmZyYW1lKSE7XG5cbiAgICAgICAgICAgICAgICBrZXlGcmFtZSAmJiBjdXJ2ZXNEdW1wLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBub2RlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBwcm9wLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBwcm9wRGF0YS50eXBlLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogcHJvcERhdGEuZGlzcGxheU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGtleWZyYW1lczogW2tleUZyYW1lLmN1cnZlICYmIHRyYW5zQ3VydmVLZXlUb0R1bXBLZXkoa2V5RnJhbWUuY3VydmUsIHByb3BEYXRhLnR5cGUpIHx8IGtleUZyYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgcG9zdEV4dHJhcDogcHJvcERhdGEucG9zdEV4dHJhcCxcbiAgICAgICAgICAgICAgICAgICAgcHJlRXh0cmFwOiBwcm9wRGF0YS5wcmVFeHRyYXAsXG4gICAgICAgICAgICAgICAgICAgIGlzQ3VydmVTdXBwb3J0OiBwcm9wRGF0YS5pc0N1cnZlU3VwcG9ydCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnZlc0R1bXAubGVuZ3RoICYmICh0aGlzLmNvcHlLZXlJbmZvID0ge1xuICAgICAgICAgICAgICAgIGN1cnZlc0R1bXAsXG4gICAgICAgICAgICAgICAgbGVmdEZyYW1lOiBwYXJhbXMuZnJhbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52bS5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCBjb3B5S2V5SW5mbyA9IHRoaXMudHJhbnNTZWxlY3RUb0NvcHlLZXlJbmZvKCk7XG4gICAgICAgICAgICBpZiAoY29weUtleUluZm8uY3VydmVzRHVtcC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvcHlLZXlJbmZvID0gY29weUtleUluZm87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmlrDlu7rlhbPplK7luKdcbiAgICAgKiBAcGFyYW0gaW5mb1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVLZXkoaW5mbzogSUNyZWF0ZUtleUluZm8sIG9wdGlvbnM/OiBBbmltYXRpb25PcGVyYXRpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHZtOiBhbnkgPSB0aGlzLnZtO1xuICAgICAgICBpbmZvLmZyYW1lID0gaW5mby5mcmFtZSA/PyB2bS5jdXJyZW50RnJhbWU7XG4gICAgICAgIElBcHBseU9wZXJhdGlvbihJY3JlYXRlS2V5KHZtLmN1cnJlbnRDbGlwLCBpbmZvLm5vZGVQYXRoLCBpbmZvLnByb3AsIE51bWJlcihpbmZvLmZyYW1lKSwgaW5mby52YWx1ZSksIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaJuemHj+aWsOW7uuWFs+mUruW4p1xuICAgICAqIEBwYXJhbSBpbmZvc1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVLZXlCYXRjaChpbmZvczogSUNyZWF0ZUtleUluZm9bXSkge1xuICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgY3JlYXRlT3BlcmF0ZTogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICBpbmZvcy5mb3JFYWNoKChpbmZvKSA9PiB7XG4gICAgICAgICAgICBpbmZvLmZyYW1lID0gaW5mby5mcmFtZSB8fCB2bS5jdXJyZW50RnJhbWU7XG4gICAgICAgICAgICBjcmVhdGVPcGVyYXRlLnB1c2goSWNyZWF0ZUtleSh2bS5jdXJyZW50Q2xpcCwgaW5mby5ub2RlUGF0aCwgaW5mby5wcm9wLCBOdW1iZXIoaW5mby5mcmFtZSksIGluZm8udmFsdWUpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIElBcHBseU9wZXJhdGlvbihjcmVhdGVPcGVyYXRlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcGFzdGVFbWJlZGRlZFBsYXllcihjdXJyZW50RnJhbWU6IG51bWJlciwgZW1iZWRkZWRQbGF5ZXJEdW1wczogSUVtYmVkZGVkUGxheWVyc1tdLCBncm91cD86IHN0cmluZykge1xuICAgICAgICBjb25zdCBvZmZzZXRGcmFtZSA9IGN1cnJlbnRGcmFtZSAtIGVtYmVkZGVkUGxheWVyRHVtcHNbMF0uYmVnaW47XG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJEdW1wcy5mb3JFYWNoKChlbWJlZGRlZFBsYXllcikgPT4ge1xuICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXIuYmVnaW4gKz0gb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICBlbWJlZGRlZFBsYXllci5lbmQgKz0gb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICBlbWJlZGRlZFBsYXllci5ncm91cCA9IGdyb3VwIHx8IGVtYmVkZGVkUGxheWVyLmdyb3VwO1xuICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoKGFkZEVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIGVtYmVkZGVkUGxheWVyKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBJQXBwbHlPcGVyYXRpb24ob3BlcmF0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog57KY6LS05YWz6ZSu5binXG4gICAgICogQHBhcmFtIHRhcmdldEluZm9cbiAgICAgKi9cbiAgICBwdWJsaWMgcGFzdGVLZXkoXG4gICAgICAgIHRhcmdldEluZm86IHtcbiAgICAgICAgICAgIHRhcmdldDogbnVtYmVyO1xuICAgICAgICAgICAgbm9kZVBhdGg6IHN0cmluZztcbiAgICAgICAgICAgIHByb3A/OiBzdHJpbmc7XG4gICAgICAgIH0sXG4gICAgICAgIGNvcHlLZXlJbmZvPzogSUNvcHlLZXlTcmNJbmZvLFxuICAgICkge1xuICAgICAgICBjb3B5S2V5SW5mbyA9IGNvcHlLZXlJbmZvIHx8IHRoaXMuY29weUtleUluZm8hO1xuICAgICAgICBpZiAoIWNvcHlLZXlJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb3B5VGFza3M6IGFueVtdID0gW107XG4gICAgICAgIGxldCBjdXJ2ZXNEdW1wID0gY29weUtleUluZm8uY3VydmVzRHVtcDtcbiAgICAgICAgaWYgKHRhcmdldEluZm8ucHJvcCkge1xuICAgICAgICAgICAgY3VydmVzRHVtcCA9IHBpY2tUYXJnZXRDdXJ2ZUR1bXAoe1xuICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0YXJnZXRJbmZvLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgIHByb3A6IHRhcmdldEluZm8ucHJvcCxcbiAgICAgICAgICAgIH0sIGN1cnZlc0R1bXAsIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXApO1xuICAgICAgICAgICAgLy8g5LyY5YWI57KY6LS055uu5qCH5bGe5oCn6L2o6YGT5om+5Yiw5LiO5aSN5Yi25bGe5oCn6L2o6YGT5LiA6Ie055qE6L2o6YGTXG4gICAgICAgICAgICBjb25zdCBwcm9wRGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbdGFyZ2V0SW5mby5ub2RlUGF0aF1bdGFyZ2V0SW5mby5wcm9wXTtcbiAgICAgICAgICAgIC8vIOeymOi0tOi9qOmBk+acqueItui9qOmBk+aXtu+8jHBpY2tUYXJnZXRDdXJ2ZUR1bXAg562b6YCJ5Ye655qE5bey57uP5piv56ym5ZCI5L2/55So6ZyA5rGC55qE6L2o6YGT5pWw57uEXG4gICAgICAgICAgICBpZiAoY3VydmVzRHVtcC5sZW5ndGggJiYgIXByb3BEYXRhLnBhcnRLZXlzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRGcmFtZSA9IGN1cnZlc0R1bXBbMF0ua2V5ZnJhbWVzWzBdLmZyYW1lO1xuICAgICAgICAgICAgICAgIGNvcHlUYXNrcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBJY29weUtleXMoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZtLmN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBjdXJ2ZXNEdW1wOiBbY3VydmVzRHVtcFswXV0gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydEZyYW1lOiB0YXJnZXRJbmZvLnRhcmdldCArIChzdGFydEZyYW1lIC0gY29weUtleUluZm8hLmxlZnRGcmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IHRhcmdldEluZm8ubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcEtleXM6IFt0YXJnZXRJbmZvLnByb3AhXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29weVRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8g5b2T5rKh5pyJ5oyH5a6a57KY6LS055uu5qCH6L2o6YGT5oiW6ICF5oyH5a6a55uu5qCH6L2o6YGT6K+v77yM55u05o6l5oyJ54Wn5aSN5Yi25YWz6ZSu5bin5pWw5o2u5LiA5LiA5a+55bqU57KY6LS06L+H5Y67XG4gICAgICAgICAgICBjdXJ2ZXNEdW1wLmZvckVhY2goKGR1bXApID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWR1bXAua2V5ZnJhbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0RnJhbWUgPSBkdW1wLmtleWZyYW1lc1swXS5mcmFtZTtcbiAgICAgICAgICAgICAgICBjb3B5VGFza3MucHVzaChcbiAgICAgICAgICAgICAgICAgICAgSWNvcHlLZXlzKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52bS5jdXJyZW50Q2xpcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgY3VydmVzRHVtcDogW2R1bXBdIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRGcmFtZTogdGFyZ2V0SW5mby50YXJnZXQgKyAoc3RhcnRGcmFtZSAtIGNvcHlLZXlJbmZvIS5sZWZ0RnJhbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0YXJnZXRJbmZvLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BLZXlzOiBbZHVtcC5rZXldLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgSUFwcGx5T3BlcmF0aW9uKGNvcHlUYXNrcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5bCG5b2T5YmN6YCJ5Lit5YWz6ZSu5bin5L+h5oGv6L2s5o2i5Li65aSN5Yi255qE5YWz6ZSu5bin5L+h5oGvXG4gICAgICovXG4gICAgcHVibGljIHRyYW5zU2VsZWN0VG9Db3B5S2V5SW5mbygpOiBJQ29weUtleVNyY0luZm8ge1xuICAgICAgICBjb25zdCBkdW1wczogSVNvcnREdW1wcyA9IHNvcnRLZXlzVG9UcmVlTWFwKHRoaXMudm0uc2VsZWN0S2V5SW5mbyEua2V5RnJhbWVzKTtcbiAgICAgICAgY29uc3QgY3VydmVzRHVtcDogSUFuaVByb3BDdXJ2ZUR1bXBEYXRhW10gPSBbXTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyhkdW1wcykuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmF3UHJvcERhdGEgPSB0aGlzLmNsaXBzRHVtcD8ucGF0aHNEdW1wW2l0ZW0ubm9kZVBhdGhdW2l0ZW0ucHJvcF07XG4gICAgICAgICAgICBpZiAoIXJhd1Byb3BEYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJhd1Byb3BEYXRhIS5wYXJ0S2V5cykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGRLZXkgb2YgcmF3UHJvcERhdGEhLnBhcnRLZXlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHJhd1Byb3BEYXRhIS5ub2RlUGF0aCArIGNoaWxkS2V5O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWR1bXBzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1bXBzW2tleV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDogY2hpbGRLZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IGl0ZW0ubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlGcmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkdW1wc1trZXldLmZyYW1lcy5wdXNoKC4uLml0ZW0uZnJhbWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyhkdW1wcykuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmF3UHJvcERhdGEgPSB0aGlzLmNsaXBzRHVtcD8ucGF0aHNEdW1wW2l0ZW0ubm9kZVBhdGhdW2l0ZW0ucHJvcF07XG4gICAgICAgICAgICBpZiAoIXJhd1Byb3BEYXRhIHx8IHJhd1Byb3BEYXRhLnBhcnRLZXlzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5jbGlwc0R1bXAhLnBhdGhzRHVtcFtpdGVtLm5vZGVQYXRoXVtyYXdQcm9wRGF0YS5wYXJlbnRQcm9wS2V5XTtcbiAgICAgICAgICAgIGNvbnN0IHJhd0tleUZyYW1lcyA9IHJhd1Byb3BEYXRhIS5rZXlGcmFtZXMuZmlsdGVyKChrZXlGcmFtZSkgPT4gaXRlbS5mcmFtZXMuaW5jbHVkZXMoa2V5RnJhbWUuZnJhbWUhKSk7XG4gICAgICAgICAgICBjb25zdCBrZXlmcmFtZXMgPSByYXdLZXlGcmFtZXMubWFwKChrZXlGcmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrZXlGcmFtZS5jdXJ2ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNDdXJ2ZUtleVRvRHVtcEtleShrZXlGcmFtZS5jdXJ2ZSwgcmF3UHJvcERhdGEhLnR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5RnJhbWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICgha2V5ZnJhbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnZlc0R1bXAucHVzaCh7XG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IGl0ZW0ubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAga2V5OiBpdGVtLnByb3AsXG4gICAgICAgICAgICAgICAgdHlwZTogcmF3UHJvcERhdGEhLnR5cGUsXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHJhd1Byb3BEYXRhIS5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICBrZXlmcmFtZXMsXG4gICAgICAgICAgICAgICAgX3BhcmVudFR5cGU6IHBhcmVudCAmJiBwYXJlbnQudHlwZSxcbiAgICAgICAgICAgICAgICBwcmVFeHRyYXA6IHJhd1Byb3BEYXRhLnByZUV4dHJhcCxcbiAgICAgICAgICAgICAgICBwb3N0RXh0cmFwOiByYXdQcm9wRGF0YS5wb3N0RXh0cmFwLFxuICAgICAgICAgICAgICAgIGlzQ3VydmVTdXBwb3J0OiByYXdQcm9wRGF0YS5pc0N1cnZlU3VwcG9ydCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgbGV0IGxlZnRGcmFtZSA9ICh0aGlzLnZtLnN0aWNrSW5mbyAmJiB0aGlzLnZtLnN0aWNrSW5mby5sZWZ0RnJhbWUpIHx8IHRoaXMudm0uc2VsZWN0S2V5SW5mbyEua2V5RnJhbWVzIVswXS5mcmFtZTtcbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0S2V5SW5mbyEub2Zmc2V0RnJhbWUpIHtcbiAgICAgICAgICAgIGxlZnRGcmFtZSA9IGxlZnRGcmFtZSAtIHRoaXMudm0uc2VsZWN0S2V5SW5mbyEub2Zmc2V0RnJhbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGN1cnZlc0R1bXAsXG4gICAgICAgICAgICBsZWZ0RnJhbWUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk5YWz6ZSu5binXG4gICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAqIEBwYXJhbSBmb3JjZVNpbmdsZSDlvLrliLbnp7vpmaTljZXkuKrlhbPplK7luKdcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVtb3ZlS2V5KHBhcmFtcz86IElQcm9wUGFyYW1zIHwgSVByb3BQYXJhbXNbXSwgZm9yY2VTaW5nbGUgPSBmYWxzZSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgLy8g56e76Zmk5Lyg6YCS5Y+C5pWw55qE5YWz6ZSu5bin5pWw5o2u77yM5LiN5Lyg6YCSIGZyYW1lIOaXtuS9v+eUqOW9k+WJjeWwj+e6oue6v+S9jee9rlxuICAgICAgICBpZiAocGFyYW1zKSB7XG4gICAgICAgICAgICBsZXQgcmVtb3ZlUGFyYW1zID0gW107XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVBhcmFtcy5wdXNoKHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlbW92ZVBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZU9wTGlzdDogYW55W10gPSBbXTtcbiAgICAgICAgICAgIHJlbW92ZVBhcmFtcy5mb3JFYWNoKChwYXJhbXM6IElQcm9wUGFyYW1zKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMuZnJhbWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5mcmFtZSA9IHRoaXMudm0uY3VycmVudEZyYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhhdC5zZWxlY3RLZXlJbmZvICYmICFmb3JjZVNpbmdsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBwYXJhbXMubm9kZVBhdGggKyBwYXJhbXMucHJvcDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29ydER1bXBzID0gdGhhdC5zZWxlY3RLZXlJbmZvLnNvcnREdW1wIHx8IHNvcnRLZXlzVG9UcmVlTWFwKHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMpO1xuICAgICAgICAgICAgICAgICAgICAvLyDopoHnp7vpmaTnmoTlhbPplK7luKfkuI3lsZ7kuo7pgInkuK3lhbPplK7luKfmiY3lj6/ku6Xnp7vpmaTljZXkuKpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvcnREdW1wc1trZXldICYmICFzb3J0RHVtcHNba2V5XS5mcmFtZXMuaW5jbHVkZXMocGFyYW1zLmZyYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlT3BMaXN0LnB1c2goSXJlbW92ZUtleSh0aGF0LmN1cnJlbnRDbGlwLCBwYXJhbXMubm9kZVBhdGgsIHBhcmFtcy5wcm9wLCBwYXJhbXMuZnJhbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW9k+WJjeayoeaciemAieS4reWFs+mUruW4p++8jOWNleeLrOenu+mZpOmAieS4reW4p+aVsOaNrlxuICAgICAgICAgICAgICAgICAgICByZW1vdmVPcExpc3QucHVzaChJcmVtb3ZlS2V5KHRoYXQuY3VycmVudENsaXAsIHBhcmFtcy5ub2RlUGF0aCwgcGFyYW1zLnByb3AsIHBhcmFtcy5mcmFtZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHJlbW92ZU9wTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlU3VjY2VzcyA9IGF3YWl0IElBcHBseU9wZXJhdGlvbihyZW1vdmVPcExpc3QpO1xuICAgICAgICAgICAgICAgIGlmICghcmVtb3ZlU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDnp7vpmaTpgInkuK3lhbPplK7luKdcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZW1vdmVEdW1wOiBJU29ydER1bXBzID0gdGhhdC5zZWxlY3RLZXlJbmZvLnNvcnREdW1wIHx8IHNvcnRLZXlzVG9UcmVlTWFwKHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMpO1xuICAgICAgICBjb25zdCByZW1vdmVLZXlPcExpc3QgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBwYXRoIG9mIE9iamVjdC5rZXlzKHJlbW92ZUR1bXApKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbTogSVNvcnREdW1wID0gcmVtb3ZlRHVtcFtwYXRoXTtcbiAgICAgICAgICAgIHJlbW92ZUtleU9wTGlzdC5wdXNoKElyZW1vdmVLZXkodGhhdC5jdXJyZW50Q2xpcCwgcGFyYW0ubm9kZVBhdGgsIHBhcmFtLnByb3AsIHBhcmFtLmZyYW1lcykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlbW92ZVNlbGVjdFN1Y2Nlc3MgPSBhd2FpdCBJQXBwbHlPcGVyYXRpb24ocmVtb3ZlS2V5T3BMaXN0KTtcbiAgICAgICAgaWYgKCFyZW1vdmVTZWxlY3RTdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vliqjlvZPliY3pgInkuK3nmoTlt7Lnu4/mi5bliqjkuIDlrprot53nprvnmoTlhbPplK7luKcgKyDnvKnmlL7lhbPplK7luKdcbiAgICAgKiDms6jmhI/vvJrpnIDopoHmlbTnkIbmlbDmja7vvIzku4Xlj5HpgIHliIbph4/ovajpgZPmlbDmja7vvIzliIbph4/kuI7kuLvovajpgZPmlbDmja7kuIDotbflj5HpgIHnlLHkuo7lnLrmma/mjInnhafpobrluo/np7vliqjkvJrlh7rnjrDph43lkIjlhbPplK7luKfkuKLlpLFcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgbW92ZUtleXMoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgb2Zmc2V0RnJhbWUgfSA9IHRoYXQuc2VsZWN0S2V5SW5mbztcbiAgICAgICAgaWYgKG9mZnNldEZyYW1lID09PSAwICYmICghRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvIHx8IEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mby50eXBlID09PSAnY2VudGVyJykgJiYgIXRoYXQuc2VsZWN0S2V5SW5mby5jdHJsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtb3ZlS2V5T3BMaXN0OiBhbnlbXSA9IFtdO1xuICAgICAgICBjb25zdCBtb3ZlUGF0aHMgPSBjaGFuZ2VQYXJlbnRUb1BhcnQodGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcywgYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcCk7XG4gICAgICAgIC8vIOe8qeaUvuWFs+mUruW4p1xuICAgICAgICBpZiAoRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvICYmIEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mby50eXBlICE9PSAnY2VudGVyJykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMobW92ZVBhdGhzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGxldCBub2RlUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCBwcm9wOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbW92ZVBhdGhzW2tleV0ua2V5RnJhbWVzIS5mb3JFYWNoKChwYXJhbTogSUtleUZyYW1lRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmFtLm9mZnNldEZyYW1lICYmICFvZmZzZXRGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lcy5wdXNoKHBhcmFtLnJhd0ZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0cy5wdXNoKHBhcmFtLm9mZnNldEZyYW1lID8/IG9mZnNldEZyYW1lISk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoID0gcGFyYW0ubm9kZVBhdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wID0gcGFyYW0ucHJvcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChub2RlUGF0aCAmJiBwcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vdmVLZXlPcExpc3QucHVzaChJbW92ZUtleXModGhhdC5jdXJyZW50Q2xpcCwgbm9kZVBhdGghLCBwcm9wLCBmcmFtZXMsIG9mZnNldHMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhdGggb2YgT2JqZWN0LmtleXMobW92ZVBhdGhzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtOiBJU29ydER1bXAgPSBtb3ZlUGF0aHNbcGF0aF07XG4gICAgICAgICAgICAgICAgaWYgKCFwYXJhbS5vZmZzZXRGcmFtZSAmJiAhb2Zmc2V0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vdmVLZXlPcExpc3QucHVzaChJbW92ZUtleXModGhhdC5jdXJyZW50Q2xpcCwgcGFyYW0ubm9kZVBhdGgsIHBhcmFtLnByb3AsIHBhcmFtLmZyYW1lcywgcGFyYW0ub2Zmc2V0RnJhbWUgPz8gb2Zmc2V0RnJhbWUhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW92ZUtleU9wTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb3ZlUmVzdWx0ID0gYXdhaXQgSUFwcGx5T3BlcmF0aW9uKG1vdmVLZXlPcExpc3QpO1xuICAgICAgICBpZiAoIW1vdmVSZXN1bHQpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb25cblxuICAgIC8vICNyZWdpb24gKioqKioqKioqKioqKioqKioqKioqIOS6i+S7tuW4p+ebuOWFs+WkhOeQhiAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIC8qKlxuICAgICAqIOa3u+WKoOS6i+S7tuW4p1xuICAgICAqIEBwYXJhbSBmcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBhZGRFdmVudChmcmFtZT86IG51bWJlcikge1xuICAgICAgICBpZiAodHlwZW9mIGZyYW1lICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgZnJhbWUgPSBOdW1iZXIodGhpcy52bS5jdXJyZW50RnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIElBcHBseU9wZXJhdGlvbihJYWRkRXZlbnQodGhpcy52bS5jdXJyZW50Q2xpcCwgZnJhbWUsICcnLCBbXSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIoOmZpOS6i+S7tuW4p1xuICAgICAqIEBwYXJhbSBmcmFtZXNcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgZGVsZXRlRXZlbnQoZnJhbWVzPzogbnVtYmVyW10pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEV2ZW50SW5mbyAmJiAhZnJhbWVzKSB7XG4gICAgICAgICAgICBmcmFtZXMgPSB0aGF0LnNlbGVjdEV2ZW50SW5mby5mcmFtZXM7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEV2ZW50SW5mbyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmcmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkZWxldGVFdmVudHNPcExpc3QgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBmcmFtZSBvZiBmcmFtZXMpIHtcbiAgICAgICAgICAgIGRlbGV0ZUV2ZW50c09wTGlzdC5wdXNoKElkZWxldGVFdmVudCh0aGF0LmN1cnJlbnRDbGlwLCBmcmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBJQXBwbHlPcGVyYXRpb24oZGVsZXRlRXZlbnRzT3BMaXN0KTtcbiAgICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ou36LSd5LqL5Lu25L+h5oGvXG4gICAgICogQHBhcmFtIGV2ZW50SW5mb1xuICAgICAqL1xuICAgIHB1YmxpYyBjb3B5RXZlbnRzKGZyYW1lcz86IG51bWJlcltdKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBmcmFtZXMgPSBmcmFtZXMgfHwgKHRoYXQuc2VsZWN0RXZlbnRJbmZvICYmIHRoYXQuc2VsZWN0RXZlbnRJbmZvLmZyYW1lcykgfHwgW107XG4gICAgICAgIGlmICghZnJhbWVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb3B5RXZlbnRJbmZvID0ge1xuICAgICAgICAgICAgZXZlbnRzRHVtcDogdGhpcy5jbGlwc0R1bXAhLmV2ZW50cy5maWx0ZXIoKGV2ZW50SW5mbykgPT4gZnJhbWVzIS5pbmNsdWRlcyhldmVudEluZm8uZnJhbWUpKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmiormi7fotJ3nmoTlhbPplK7luKfmlbDmja7mi7fotJ3liLDmn5DkuIDlhbPplK7luKdcbiAgICAgKiBAcGFyYW0gZnJhbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgcGFzdGVFdmVudCh0YXJnZXQ6IG51bWJlciwgY29weUV2ZW50SW5mbz86IElBbmltQ29weUV2ZW50U3JjSW5mbykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29weUV2ZW50SW5mbyA9IGNvcHlFdmVudEluZm8gfHwgdGhpcy5jb3B5RXZlbnRJbmZvO1xuICAgICAgICBpZiAoIWNvcHlFdmVudEluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBJQXBwbHlPcGVyYXRpb24oXG4gICAgICAgICAgICBJY29weUV2ZW50KHRoYXQuY3VycmVudENsaXAsIGNvcHlFdmVudEluZm8sIHtcbiAgICAgICAgICAgICAgICBzdGFydEZyYW1lOiB0YXJnZXQsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8gPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOehruiupOenu+WKqOW9k+WJjeeahOenu+WKqOS6i+S7tuW4p+aVsOaNrlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBtb3ZlRXZlbnRzKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEV2ZW50SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgZnJhbWVzLCBvZmZzZXRGcmFtZSB9ID0gdGhhdC5zZWxlY3RFdmVudEluZm87XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBJQXBwbHlPcGVyYXRpb24oSW1vdmVFdmVudHModGhhdC5jdXJyZW50Q2xpcCwgZnJhbWVzLCBvZmZzZXRGcmFtZSkpO1xuICAgICAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGF0LnNlbGVjdEV2ZW50SW5mby5mcmFtZXMgPSBbLi4ubmV3IFNldCh0aGF0LnNlbGVjdEV2ZW50SW5mby5kYXRhLm1hcCgoaXRlbTogSUV2ZW50SW5mbykgPT4gaXRlbS5mcmFtZSkpXTtcbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8ub2Zmc2V0RnJhbWUgLT0gb2Zmc2V0RnJhbWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAvLyAjcmVnaW9uICoqKioqKioqKioqKioqKioqKioqKiDovajpgZPmk43kvZznm7jlhbMgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rmn5DkuKrlsZ7mgKfovajpgZNcbiAgICAgKiBAcGFyYW0gcGFyYW1cbiAgICAgKiBAcGFyYW0gbXVsdGkg5piv5ZCm5Li65aSa5Liq6YCJ5Lit6IqC54K55re75Yqg5bGe5oCn6L2o6YGTXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZVByb3AocGFyYW06IHsgbm9kZVBhdGg/OiBzdHJpbmc7IHByb3A6IHN0cmluZyB9LCBtdWx0aT86IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgY3JlYXRlUHJvcHM6IGFueVtdID0gW107XG4gICAgICAgIGlmIChtdWx0aSAmJiB0aGlzLnZtLnNlbGVjdGVkSWRzLnNpemUpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiB0aGlzLnZtLnNlbGVjdGVkSWRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgLy8g6YCJ5Lit6IqC54K55Y+v6IO95LiN5Zyo5Yqo55S76IqC54K55YaFXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm5vZGVzRHVtcCEudXVpZDJwYXRoW3V1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcmVhdGVQcm9wcy5wdXNoKEljcmVhdGVQcm9wKHRoaXMudm0uY3VycmVudENsaXAsIHRoaXMubm9kZXNEdW1wIS51dWlkMnBhdGhbdXVpZF0sIHBhcmFtLnByb3ApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNyZWF0ZVByb3BzLnB1c2goSWNyZWF0ZVByb3AodGhpcy52bS5jdXJyZW50Q2xpcCwgcGFyYW0ubm9kZVBhdGggfHwgdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCwgcGFyYW0ucHJvcCkpO1xuICAgICAgICB9XG4gICAgICAgIElBcHBseU9wZXJhdGlvbihjcmVhdGVQcm9wcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riF56m65p+Q5Liq5bGe5oCn6L2o6YGTXG4gICAgICogQHBhcmFtIHBhcmFtXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGNsZWFyUHJvcEtleXMocGFyYW06IHsgbm9kZVBhdGg6IHN0cmluZzsgcHJvcDogc3RyaW5nIH0pIHtcbiAgICAgICAgY29uc3Qgc2hvdWxkQ2xlYXIgPSBhd2FpdCBjaGVja0NsZWFyUHJvcERhdGEocGFyYW0ucHJvcCk7XG4gICAgICAgIGlmICghc2hvdWxkQ2xlYXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBJQXBwbHlPcGVyYXRpb24oSWNsZWFyS2V5cyh0aGlzLnZtLmN1cnJlbnRDbGlwLCBwYXJhbS5ub2RlUGF0aCwgcGFyYW0ucHJvcCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOenu+mZpOafkOS4quWxnuaAp+i9qOmBk1xuICAgICAqIEBwYXJhbSBwYXJhbVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyByZW1vdmVQcm9wKHBhcmFtOiB7IG5vZGVQYXRoOiBzdHJpbmc7IHByb3A6IHN0cmluZyB9KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCBzaG91bGRSZW1vdmUgPSBhd2FpdCBjaGVja1JlbW92ZVByb3AocGFyYW0ucHJvcCk7XG4gICAgICAgIGlmICghc2hvdWxkUmVtb3ZlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgSUFwcGx5T3BlcmF0aW9uKElyZW1vdmVQcm9wKHRoYXQuY3VycmVudENsaXAsIHBhcmFtLm5vZGVQYXRoLCBwYXJhbS5wcm9wKSk7XG4gICAgICAgIC8vIOWIoOmZpOeahOWmguaenOaYr+mAieS4rei9qOmBk+i9qOmBk+WQjuimgeWwhumAieS4rei9qOmBk+S/oeaBr+a4hemZpFxuICAgICAgICBpZiAodGhhdC5zZWxlY3RQcm9wZXJ0eSAmJiBwYXJhbS5wcm9wID09PSB0aGF0LnNlbGVjdFByb3BlcnR5LnByb3ApIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0UHJvcGVydHkgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNvcHlQcm9wKHBhcmFtOiB7IG5vZGVQYXRoOiBzdHJpbmcsIHByb3A6IHN0cmluZ30pIHtcbiAgICAgICAgY29uc3QgcHJvcERhdGEgPSB0aGlzLmNsaXBzRHVtcD8ucGF0aHNEdW1wW3BhcmFtLm5vZGVQYXRoXVtwYXJhbS5wcm9wXTtcbiAgICAgICAgaWYgKCFwcm9wRGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnZlc0R1bXAgPSBbcHJvcERhdGFUb0N1cnZlRHVtcChwcm9wRGF0YSldO1xuICAgICAgICBpZiAocHJvcERhdGEucGFydEtleXMpIHtcbiAgICAgICAgICAgIC8vIOaLt+i0neS4u+i9qOmBk+eahOWxnuaAp+aVsOaNruaXtu+8jOmcgOimgeaLhuWIhuWkmuiusOW9leS4gOS7veWIhumHj+i9qOmBk+eahOaVsOaNruaJjeiDveWcqOeymOi0tOaXtuaBouWkjeWIhumHj+i9qOmBk+S4iueahOWFs+mUruW4p+WIhuW4g1xuICAgICAgICAgICAgcHJvcERhdGEucGFydEtleXMuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICAgICAgICAgIGN1cnZlc0R1bXAucHVzaChwcm9wRGF0YVRvQ3VydmVEdW1wKHRoaXMuY2xpcHNEdW1wIS5wYXRoc0R1bXBbcGFyYW0ubm9kZVBhdGhdW3Byb3BdISkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb3B5UHJvcEluZm8gPSB7XG4gICAgICAgICAgICBjdXJ2ZXNEdW1wOiBjdXJ2ZXNEdW1wLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBwYXN0ZVByb3AocGFyYW06IElTZWxlY3RQcm9wZXJ0eSwgcHJvcERhdGE/OiBJQW5pbUNvcHlQcm9wU3JjSW5mbykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgcHJvcERhdGEgPSBwcm9wRGF0YSB8fCB0aGlzLmNvcHlQcm9wSW5mbztcbiAgICAgICAgaWYgKCF0aGlzLmNvcHlQcm9wSW5mbyB8fCAhcGFyYW0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdXJ2ZXNEdW1wID0gcHJvcERhdGEuY3VydmVzRHVtcC5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIC8vIOebruWJjei/lOWbnueahOebuOWQjOWtl+auteacieWPr+iDvSBleHRlbmRzIOS4jeWQjO+8jOS4jeiDvea3seW6puavlOi+g1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udHlwZT8udmFsdWUgPT09IHBhcmFtLnR5cGU/LnZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFjdXJ2ZXNEdW1wLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLnByb3BlcnR5LmNhbl9ub3RfcGFzdGVfaW5fY3VycmVudF9wcm9wJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+q5YWB6K645Y2V6YCJ5aSN5Yi257KY6LS06L2o6YGT44CB5Lul5Y+K5LiN5YWB6K645Yig6Zmk5YiG6YeP6L2o6YGT5pe25omN5Y+v5Lul6L+Z5qC35aSE55CGXG4gICAgICAgIGNvbnN0IGN1cmVudFByb3AgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEucGF0aHNEdW1wW3BhcmFtLm5vZGVQYXRoXVtwYXJhbS5wcm9wXSE7XG4gICAgICAgIGxldCBwcm9wS2V5cyA9IGN1cmVudFByb3AucGFydEtleXM7XG4gICAgICAgIGlmIChwcm9wS2V5cykge1xuICAgICAgICAgICAgY29uc3QgY3VydmVJbmZvID0gY3VydmVzRHVtcFswXTtcbiAgICAgICAgICAgIGNvbnN0IHByb3BEYXRhcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbcGFyYW0ubm9kZVBhdGhdO1xuICAgICAgICAgICAgaWYgKCFwcm9wRGF0YXNbY3VydmVJbmZvLmtleV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJ2ZXNEdW1wID0gcHJvcERhdGFzW2N1cnZlSW5mby5rZXldLnBhcnRLZXlzLm1hcCgocHJvcCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHByb3BEYXRhc1twcm9wXSkpO1xuICAgICAgICAgICAgICAgIC8vIOS8mOWFiOafpeaJvuWkjeWItuaVsOaNruWGheWxnuaAp+WQjeensOS4gOiHtOeahOWxnuaAp+i9qOmBk+eymOi0tFxuICAgICAgICAgICAgICAgIGNvbnN0IGNvcHlDdXJ2ZUluZm8gPSBwcm9wRGF0YSEuY3VydmVzRHVtcC5maW5kKChpdGVtKSA9PiBpdGVtLmtleSA9PT0gcHJvcCkgfHwgY3VydmVJbmZvO1xuICAgICAgICAgICAgICAgIGRhdGEua2V5RnJhbWVzID0gY29weUN1cnZlSW5mby5rZXlmcmFtZXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BEYXRhVG9DdXJ2ZUR1bXAoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3BLZXlzID0gW3BhcmFtLnByb3BdO1xuICAgICAgICAgICAgaWYgKGN1cmVudFByb3AucGFyZW50UHJvcEtleSkge1xuICAgICAgICAgICAgICAgIC8vIOS8mOWFiOafpeaJvuWkjeWItuaVsOaNruWGheWxnuaAp+WQjeensOS4gOiHtOeahOWxnuaAp+i9qOmBk+eymOi0tFxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBjdXJ2ZXNEdW1wLmZpbmQoKGl0ZW0pID0+IGl0ZW0ua2V5ID09PSBwYXJhbS5wcm9wKTtcbiAgICAgICAgICAgICAgICBkYXRhICYmIChjdXJ2ZXNEdW1wID0gW2RhdGFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBJQXBwbHlPcGVyYXRpb24oXG4gICAgICAgICAgICBJY29weVByb3AoXG4gICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50Q2xpcCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlc0R1bXA6IGN1cnZlc0R1bXAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiBwYXJhbS5ub2RlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcHJvcEtleXM6IHByb3BLZXlzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApLFxuICAgICAgICApO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAvLyAjcmVnaW9uICoqKioqKioqKioqKioqKioqKioqKiDoioLngrnlhbPplK7luKfmk43kvZznm7jlhbMgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICBwdWJsaWMgYXN5bmMgY2xlYXJOb2RlS2V5cyhub2RlUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHNob3VsZENsZWFyID0gYXdhaXQgY2hlY2tDbGVhck5vZGVLZXlzKCk7XG4gICAgICAgIGlmICghc2hvdWxkQ2xlYXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBJQXBwbHlPcGVyYXRpb24oSXJlbW92ZU5vZGUodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDov4Hnp7voioLngrnmlbDmja7liLDnm67moIfoioLngrlcbiAgICAgKiBAcGFyYW0gdGFyZ2V0Tm9kZVBhdGhcbiAgICAgKiBAcGFyYW0gc3JjTm9kZVBhdGhcbiAgICAgKi9cbiAgICBwdWJsaWMgbW92ZU5vZGVEYXRhKHRhcmdldE5vZGVQYXRoOiBzdHJpbmcsIHNyY05vZGVQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAodGhhdC5tb3ZlTm9kZVBhdGgpIHtcbiAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihJY2hhbmdlTm9kZURhdGFQYXRoKHRoYXQuY3VycmVudENsaXAsIHNyY05vZGVQYXRoIHx8IHRoYXQubW92ZU5vZGVQYXRoLCB0YXJnZXROb2RlUGF0aCkpO1xuICAgICAgICAgICAgdGhhdC5tb3ZlTm9kZVBhdGggPSAnJztcbiAgICAgICAgICAgIGlmICh0aGF0LnNlbGVjdFByb3BlcnR5Py5ub2RlUGF0aCA9PT0gKHNyY05vZGVQYXRoIHx8IHRoYXQubW92ZU5vZGVQYXRoKSkge1xuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0UHJvcGVydHkgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ou36LSd6IqC54K5XG4gICAgICogQHBhcmFtIHNyY05vZGVQYXRoXG4gICAgICovXG4gICAgcHVibGljIGNvcHlOb2RlRGF0YShzcmNOb2RlUGF0aHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IGN1cnZlc0R1bXA6IElBbmlQcm9wQ3VydmVEdW1wRGF0YVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBzcmNOb2RlUGF0aHMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBPYmplY3Qua2V5cyh0aGlzLmNsaXBzRHVtcCEucGF0aHNEdW1wW3BhdGhdKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BEYXRhID0gdGhpcy5jbGlwc0R1bXAhLnBhdGhzRHVtcFtwYXRoXVtwcm9wXTtcbiAgICAgICAgICAgICAgICAvLyDoioLngrnmlbDmja7kuI3mi7fotJ3kuLvovajpgZPmlbDmja5cbiAgICAgICAgICAgICAgICAvLyBpZiAocHJvcERhdGEucGFydEtleXMpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIGN1cnZlc0R1bXAucHVzaChwcm9wRGF0YVRvQ3VydmVEdW1wKHByb3BEYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb3B5Tm9kZUluZm8gPSB7XG4gICAgICAgICAgICBjdXJ2ZXNEdW1wLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOeymOi0tOWKqOeUu+iKgueCuVxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlUGF0aO+8jOebruWJjeeymOi0tOeahOWKqOeUu+iKgueCueaVsOaNruWPquS8muWcqOWQjOS4gOS4quiKgueCueS4i1xuICAgICAqL1xuICAgIHB1YmxpYyBwYXN0ZU5vZGVEYXRhKHRhcmdldE5vZGVQYXRoOiBzdHJpbmcsIG5vZGVEdW1wPzogSUFuaW1Db3B5Tm9kZVNyY0luZm8pIHtcbiAgICAgICAgbm9kZUR1bXAgPSBub2RlRHVtcCB8fCB0aGlzLmNvcHlOb2RlSW5mbztcbiAgICAgICAgaWYgKCFub2RlRHVtcCB8fCAhdGFyZ2V0Tm9kZVBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBJQXBwbHlPcGVyYXRpb24oXG4gICAgICAgICAgICBJY29weU5vZGUodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZUR1bXAsIHtcbiAgICAgICAgICAgICAgICBub2RlUGF0aDogdGFyZ2V0Tm9kZVBhdGgsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgLy8gI3JlZ2lvbiAqKioqKioqKioqKioqKioqKioqKiog5bWM5YWl5pKt5pS+5Zmo5pON5L2c55u45YWzICoqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgLyoqXG4gICAgICog5riF56m65p+Q5Liq6IqC54K55LiK55qE5bWM5YWl5pKt5pS+5ZmoXG4gICAgICogQHBhcmFtIG5vZGVQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBjbGVhckVtYmVkZGVkUGxheWVyKG5vZGVQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgIG5vZGVQYXRoID0gbm9kZVBhdGggfHwgdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aDtcbiAgICAgICAgcmV0dXJuIGF3YWl0IElBcHBseU9wZXJhdGlvbihjbGVhckVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5re75Yqg5bWM5YWl5pKt5pS+5ZmoXG4gICAgICogQHBhcmFtIGluZm8gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGFkZEVtYmVkZGVkUGxheWVyKGluZm86IElFbWJlZGRlZFBsYXllcnMpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgSUFwcGx5T3BlcmF0aW9uKGFkZEVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIGluZm8pKTtcbiAgICAgICAgbXVsdGlwbHlUcmFja1dpdGhUaW1lcignaGlwcG9BbmltYXRvcicsIHtcbiAgICAgICAgICAgICdBMTAwMDAyJzogMSxcbiAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjemhueebrmlk77yMcHJvamVjdF9pZFxuICAgICAgICAgICAgcHJvamVjdF9pZDogRWRpdG9yLlByb2plY3QudXVpZCxcbiAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjee8lui+keeahOWKqOeUu+WJqui+kSBjbGlwX2lkXG4gICAgICAgICAgICBjbGlwX2lkOiB0aGlzLnZtLmN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgLy8g57yW6L6R5Zmo54mI5pysXG4gICAgICAgICAgICB2ZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgIC8qKlxuICAgICAqIOWIoOmZpOW1jOWFpeaSreaUvuWZqFxuICAgICAqIEBwYXJhbSBlbWJlZGRlZFBsYXllckR1bXAgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIGRlbGV0ZUVtYmVkZGVkUGxheWVyKGVtYmVkZGVkUGxheWVyRHVtcDogSUVtYmVkZGVkUGxheWVycykge1xuICAgICAgICByZXR1cm4gYXdhaXQgSUFwcGx5T3BlcmF0aW9uKGRlbGV0ZUVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIGVtYmVkZGVkUGxheWVyRHVtcCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS/ruaUueW1jOWFpeaSreaUvuWZqFxuICAgICAqIEBwYXJhbSByYXdFbWJlZGRlZFBsYXllciBcbiAgICAgKiBAcGFyYW0gbmV3RW1iZWRkZWRQbGF5ZXIgXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHVwZGF0ZUVtYmVkZGVkUGxheWVyKHJhd0VtYmVkZGVkUGxheWVyOiBJRW1iZWRkZWRQbGF5ZXJzLCBuZXdFbWJlZGRlZFBsYXllcjogSUVtYmVkZGVkUGxheWVycykge1xuICAgICAgICByZXR1cm4gYXdhaXQgSUFwcGx5T3BlcmF0aW9uKHVwZGF0ZUVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIHJhd0VtYmVkZGVkUGxheWVyLCBuZXdFbWJlZGRlZFBsYXllcikpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAvLyAjcmVnaW9uICoqKioqKioqKioqKioqKioqKioqKiAg6L6F5Yqp5puy57q/5pON5L2c55u45YWzICoqKioqKioqKioqKioqKioqKioqKlxuICAgIHB1YmxpYyBhc3luYyBjcmVhdGVBdXhLZXkoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZnJhbWU/OiBudW1iZXIsXG4gICAgICAgIGRhdGE/OiBJUHJvcEN1c3RvbURhdGEsXG4gICAgICAgIG9wdGlvbnM/OiBBbmltYXRpb25PcGVyYXRpb25PcHRpb25zLFxuICAgICkge1xuICAgICAgICByZXR1cm4gSUFwcGx5T3BlcmF0aW9uKGNyZWF0ZUF1eEtleSh0aGlzLnZtLmN1cnJlbnRDbGlwLCBuYW1lLCBmcmFtZSA/PyB0aGlzLnZtLmN1cnJlbnRGcmFtZSwgZGF0YSksIG9wdGlvbnMpO1xuICAgIH1cbiAgICBwdWJsaWMgYXN5bmMgcmVtb3ZlQXV4S2V5KG5hbWU6IHN0cmluZywgZnJhbWU/OiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIElBcHBseU9wZXJhdGlvbihyZW1vdmVBdXhLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbmFtZSwgZnJhbWUgPz8gdGhpcy52bS5jdXJyZW50RnJhbWUpKTtcbiAgICB9XG4gICAgcHVibGljIGFzeW5jIG1vdmVBdXhLZXkoZnJhbWVzOiBJS2V5ZnJhbWVEYXRhQmFzZVtdLCBvZmZzZXRGcmFtZTogbnVtYmVyIHwgbnVtYmVyW10pIHtcbiAgICAgICAgY29uc3QgY2xpcCA9IHRoaXMudm0uY3VycmVudENsaXA7XG4gICAgICAgIC8vIGdyb3VwIGtleWZyYW1lIGJ5IGN1cnZlIG5hbWVcbiAgICAgICAgY29uc3QgZ3JvdXBzID0gZ3JvdXBCeShmcmFtZXMsIChmcmFtZSkgPT4gZnJhbWUua2V5KTtcbiAgICAgICAgY29uc3QgbmFtZXMgPSBPYmplY3Qua2V5cyhncm91cHMpO1xuXG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnMgPSBuYW1lcy5tYXAoKG5hbWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lRGF0YSA9IGdyb3Vwc1tuYW1lXTtcbiAgICAgICAgICAgIC8vIOaKiuWQjOS4gOS4qiBjdXJ2ZSDnmoTmk43kvZzljovnvKnlnKjkuIDmrKEgb3BlcmF0aW9uIOmHjFxuICAgICAgICAgICAgY29uc3QgZnJhbWVzQXJyID0gZnJhbWVEYXRhLnJlZHVjZSgocHJldiwgY3VycikgPT4ge1xuICAgICAgICAgICAgICAgIHByZXYucHVzaChjdXJyLnJhd0ZyYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgICAgIH0sIFtdIGFzIG51bWJlcltdKTtcbiAgICAgICAgICAgIHJldHVybiBtb3ZlQXV4S2V5cyhjbGlwLCBuYW1lLCBmcmFtZXNBcnIsIG9mZnNldEZyYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIElBcHBseU9wZXJhdGlvbihvcGVyYXRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY29weUF1eEtleShzcmM6IElBbmltQ29weUF1eFNyYywgZGVzdDogSUFuaW1Db3B5QXV4RGVzdCkge1xuICAgICAgICByZXR1cm4gSUFwcGx5T3BlcmF0aW9uKFtjb3B5QXV4S2V5KHRoaXMudm0uY3VycmVudENsaXAsIHNyYywgZGVzdCldKTtcbiAgICB9XG5cbiAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAvKipcbiAgICAgKiDmuIXnqbrnvJPlrZhcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuX19jb3B5UHJvcEluZm8gPSBudWxsO1xuICAgICAgICB0aGlzLl9fY29weUV2ZW50SW5mbyA9IG51bGw7XG4gICAgICAgIHRoaXMuX19jb3B5S2V5SW5mbyA9IG51bGw7XG4gICAgICAgIHRoaXMuX19jb3B5Tm9kZUluZm8gPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGFuaW1hdGlvbkN0cmwgPSBuZXcgQW5pbWF0aW9uQ3RybCgpO1xuXG5mdW5jdGlvbiBUKGtleTogc3RyaW5nLCB0eXBlID0gJycpIHtcbiAgICByZXR1cm4gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuJHt0eXBlfSR7a2V5fWApO1xufVxuXG4vLyDnp7vpmaTlsZ7mgKfovajpgZNcbmFzeW5jIGZ1bmN0aW9uIGNoZWNrUmVtb3ZlUHJvcChwcm9wTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdCA9IFQ7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKHQoJ2lzX3JlbW92ZV9wcm9wLm1lc3NhZ2UnKSwge1xuICAgICAgICB0aXRsZTogYCR7dCgnaXNfcmVtb3ZlX3Byb3AudGl0bGUnKX0oJHtwcm9wTmFtZX0pYCxcbiAgICAgICAgYnV0dG9uczogW3QoJ2NhbmNlbCcpLCB0KCdpc19yZW1vdmVfcHJvcC5yZW1vdmUnKV0sXG4gICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgIGNhbmNlbDogMCxcbiAgICB9KTtcbiAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxuLy8g5riF56m65bGe5oCn5YWz6ZSu5bin5o+Q56S6XG5hc3luYyBmdW5jdGlvbiBjaGVja0NsZWFyUHJvcERhdGEocHJvcE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHQgPSBUO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybih0KCdpc19jbGVhcl9wcm9wLm1lc3NhZ2UnKSwge1xuICAgICAgICB0aXRsZTogYCR7dCgnaXNfY2xlYXJfcHJvcC50aXRsZScpfSgke3Byb3BOYW1lfSlgLFxuICAgICAgICBidXR0b25zOiBbdCgnY2FuY2VsJyksIHQoJ2lzX2NsZWFyX3Byb3AucmVtb3ZlJyldLFxuICAgICAgICBkZWZhdWx0OiAxLFxuICAgICAgICBjYW5jZWw6IDAsXG4gICAgfSk7XG4gICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5cbi8vIOa4heepuuiKgueCuei9qOmBk1xuYXN5bmMgZnVuY3Rpb24gY2hlY2tDbGVhck5vZGVLZXlzKCkge1xuICAgIGNvbnN0IHQgPSBUO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybih0KCdpc19jbGVhcl9tZXNzYWdlJyksIHtcbiAgICAgICAgdGl0bGU6IHQoJ2lzX2NsZWFyJyksXG4gICAgICAgIGJ1dHRvbnM6IFt0KCdjYW5jZWwnKSwgdCgnY2xlYXInKV0sXG4gICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgIGNhbmNlbDogMCxcbiAgICB9KTtcbiAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbiJdfQ==