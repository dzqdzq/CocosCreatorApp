"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mounted = exports.components = exports.methods = exports.watch = exports.computed = exports.setup = exports.data = exports.directives = void 0;
const vue_js_1 = __importStar(require("vue/dist/vue.js"));
const animation_ctrl_1 = require("../share/animation-ctrl");
const ipc_event_1 = require("../share/ipc-event");
const utils_1 = require("./../utils");
const grid_ctrl_1 = require("../share/grid-ctrl");
const global_data_1 = require("../share/global-data");
const animation_editor_1 = require("../share/animation-editor");
const hooks_1 = require("./hooks");
const directives_1 = require("./directives");
const components_1 = require("./components");
const bezier_presets_1 = require("../share/bezier-presets");
// HACK 避免死循环
const changeFailedClips = [];
exports.directives = (0, directives_1.adaptDirectives)({
    set: directives_1.PropSet,
});
const data = function () {
    return {
        loading: 'wait_scene_ready',
        toast: {
            message: '',
        },
        currentFrame: 0,
        root: '',
        selectedId: '',
        selectedIds: new Set(),
        selectPath: '',
        moveNodePath: '',
        selectProperty: null,
        nodeDump: null,
        eventsDump: null,
        clipsMenu: [],
        selectKeyInfo: null,
        selectEventInfo: null,
        selectEmbeddedPlayerInfo: null,
        // copyEventInfo: null, // 复制的关键帧事件信息
        aniCompType: null,
        animationMode: false,
        animationState: 'stop',
        editEventFrame: 0,
        maskPanel: '',
        selectDataChange: 0,
        nodesHeight: 0,
        nodeScrollInfo: null,
        propertyScrollInfo: null,
        embeddedPlayerScrollInfo: null,
        moveInfo: null,
        boxInfo: null,
        boxStyle: null,
        boxData: null,
        previewPointer: null,
        propertiesMenu: null,
        properties: null,
        updateKeyFrame: 0,
        updatePosition: 0,
        updateSelectKey: 1,
        updateSelectNode: 1,
        scrolling: false,
        expandInfo: {},
        layout: {
            // 存储当前布局信息
            topPec: 25,
            centerPec: 30,
            auxCurvePec: 15,
            leftPec: 30,
            _totalPec: 100,
            __version__: '1.0.1',
        },
        leftResizeMoving: false,
        expandLayout: {
            // 默认隐藏避免干扰
            embeddedPlayer: false,
            node: true,
            property: true,
            auxiliaryCurve: false,
        },
        // 动画嵌入播放器目前作为实验室功能提供，需要一些功能开关
        enableEmbeddedPlayer: true,
        filterInvalid: false,
        filterName: '',
        active: true,
        wrapModeList: [],
        showAnimCurve: false,
        showAnimEmbeddedPlayer: true,
        lightCurve: null,
        hasSelectedCurveClip: false,
        curveDisabledCCtypes: animation_editor_1.animationEditor.curveDisabledCCtypes,
        presetSize: 110,
        // 当前展开的 tab 项
        expandTab: '',
        searchPresetName: '',
        timeInfos: [],
        showType: 'frame',
        embeddedPlayerGroups: [],
        showUseBakedAnimationWarn: false,
        useBakedAnimationWarnTip: null,
        currentSceneMode: 'preview',
    };
};
exports.data = data;
const setup = (props, ctx) => {
    const baseStore = (0, hooks_1.useBaseStore)();
    const gridStore = (0, hooks_1.useGridStore)();
    const { t } = (0, hooks_1.useI18n)();
    const isSkeletonClip = (0, vue_js_1.toRef)(baseStore, 'isSkeletonClip');
    const offset = (0, vue_js_1.toRef)(gridStore, 'offset');
    const scale = (0, vue_js_1.toRef)(gridStore, 'scale');
    const clipConfig = (0, vue_js_1.toRef)(baseStore, 'clipConfig');
    const currentClip = (0, vue_js_1.toRef)(baseStore, 'currentClip');
    const focusedCurve = (0, vue_js_1.toRef)(baseStore, 'focusedCurve');
    const chart = (0, vue_js_1.ref)();
    const layoutRight = (0, vue_js_1.ref)();
    const gridCanvas = (0, vue_js_1.ref)();
    const curve = (0, vue_js_1.ref)();
    const auxCurve = (0, vue_js_1.ref)();
    const auxCurveStore = (0, hooks_1.useAuxCurveStore)();
    const transformEvent = (0, hooks_1.useTransformEvent)();
    // 从其他地方触发的 transform，同步到 property 的 curve
    transformEvent.onUpdate((key) => {
        if (grid_ctrl_1.gridCtrl.grid) {
            offset.value = grid_ctrl_1.gridCtrl.grid.xAxisOffset;
            scale.value = grid_ctrl_1.gridCtrl.grid.xAxisScale;
        }
        if (key !== 'property' && curve.value) {
            if (curve.value.curveCtrl && grid_ctrl_1.gridCtrl.grid) {
                (0, grid_ctrl_1.syncAxisX)(grid_ctrl_1.gridCtrl.grid, curve.value.curveCtrl.grid);
            }
        }
        // 这些操作不区分事件来源，统一在这里做一次，其它地方监听的时候就不用做了
        grid_ctrl_1.gridCtrl.grid?.render();
        animation_editor_1.animationEditor.updatePositionInfo();
        curve.value?.repaint();
        animation_editor_1.animationEditor.renderTimeAxis();
    });
    const enableAuxCurve = (0, vue_js_1.computed)(() => {
        // 暂时只对骨骼动画开放辅助曲线
        return auxCurveStore.enabled && isSkeletonClip.value;
    });
    const updateAuxCurveEnableState = async () => {
        await auxCurveStore.updateEnableState();
    };
    // embeded player 相关
    const addingEmbeddedPlayer = (0, vue_js_1.ref)({});
    const onAddEmbeddedPlayer = (info) => {
        const key = typeof info.group === 'string' && info.group ? info.group : '';
        if (key !== '') {
            vue_js_1.default.set(addingEmbeddedPlayer.value, key, info);
        }
        animation_editor_1.animationEditor.addEmbeddedPlayer(info).finally(() => {
            if (key !== '') {
                vue_js_1.default.delete(addingEmbeddedPlayer.value, key);
            }
        });
    };
    const isEmbeddedPlayerAdding = (key) => {
        const map = (0, vue_js_1.unref)(addingEmbeddedPlayer);
        return map[key] !== undefined;
    };
    return {
        t,
        // FIXME: 为了使 animationEditor，animationCtrl 等模块中能访问到 store，将 store 整个暴露出去。
        // 这个用法十分不推荐，但在整体重构前没有更好的办法
        auxCurveStore,
        currentClip,
        clipConfig,
        isSkeletonClip,
        offset,
        scale,
        // ref elements
        curve,
        auxCurve,
        gridCanvas,
        chart,
        right: layoutRight,
        focusedCurve,
        toPercent: (num) => `${num}%`,
        transformEvent,
        enableAuxCurve,
        updateAuxCurveEnableState,
        onAddEmbeddedPlayer,
        isEmbeddedPlayerAdding,
    };
};
exports.setup = setup;
const vComputed = {
    // 根据 expandLayout 与 layout 计算真实显示的布局信息
    displayLayout() {
        const that = this;
        // @ts-ignore
        const handleKeys = Object.keys(that.expandLayout).filter((key) => !that.expandLayout[key]);
        if (!handleKeys.length) {
            return that.layout;
        }
        const res = { ...that.layout };
        const rest = ['topPec', 'centerPec', 'auxCurvePec'];
        const totalPec = animation_editor_1.animationEditor.layoutConfig.totalPec;
        if (!that.expandLayout.embeddedPlayer) {
            res.topPec = 0;
            rest.splice(rest.findIndex((item) => item === 'topPec'), 1);
        }
        if (!that.expandLayout.node) {
            res.centerPec = 0;
            rest.splice(rest.findIndex((item) => item === 'centerPec'), 1);
        }
        if (!that.expandLayout.auxiliaryCurve) {
            res.auxCurvePec = 0;
            rest.splice(rest.findIndex((item) => item === 'auxCurvePec'), 1);
        }
        if (!that.expandLayout.property) {
            const increase = totalPec - (res.topPec + res.centerPec + res.auxCurvePec);
            if (rest.length > 0 && increase > 0) {
                const average = increase / rest.length;
                rest.forEach((key) => {
                    res[key] += average;
                });
            }
        }
        else {
            // res[rest[0]] = Math.min(totalPec, that.layout.topPec + that.layout.centerPec);
        }
        return res;
    },
    // 当前关键帧显示时间
    currentTime() {
        // @ts-ignore
        const that = this;
        return (0, utils_1.transFrameByType)(that.currentFrame, that.showType, that.sample);
    },
    displayPropertiesMenu() {
        // @ts-ignore
        const that = this;
        if (!that.propertiesMenu) {
            return [];
        }
        // 对属性菜单做组件的分类和禁用处理
        const newMenu = (0, utils_1.sortPropertyMenu)(that.propertiesMenu, that.properties ?? {});
        return animation_editor_1.animationEditor.calcCreatePropMenu(newMenu);
    },
    selectPropertyRenderDump() {
        // @ts-ignore
        const that = this;
        if (!that.selectProperty || !that.selectProperty.dump) {
            return null;
        }
        const data = JSON.parse(JSON.stringify(that.selectProperty.dump));
        if (data.extends && data.extends.includes('cc.Asset')) {
            if (data.type !== data.extends[0] && !data.extends[0].startsWith('cc.')) {
                // HACK 目前部分数据序列化后 type 不是 cc.XXX 这类标准的材质资源类型
                data.type = data.extends[0];
                that.selectProperty.dump.type = data.extends[0];
            }
        }
        data.readonly = that.clipConfig && that.clipConfig.isLock || that.selectProperty.missing;
        return JSON.stringify(data);
    },
    presetArr() {
        // @ts-ignore
        const that = this;
        if (!that.searchPresetName) {
            return bezier_presets_1.defaultBezier.value;
        }
        return bezier_presets_1.defaultBezier.value.filter((item) => new RegExp(that.searchPresetName, 'i').test(item.name));
    },
    // 是否锁定不允许快捷键等编辑关键帧操作
    lock() {
        // @ts-ignore
        const that = this;
        return Boolean(!that.clipConfig || that.clipConfig.isLock || that.maskPanel || !that.animationMode);
    },
    selectPropData() {
        // @ts-ignore
        const that = this;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.selectProperty) {
            return null;
        }
        const { prop, nodePath } = that.selectProperty;
        return animation_ctrl_1.animationCtrl.clipsDump.pathsDump[nodePath] && animation_ctrl_1.animationCtrl.clipsDump.pathsDump[nodePath][prop];
    },
    // 计算当前选中节点 path
    computeSelectPath() {
        // @ts-ignore
        const that = this;
        if (!that.updateSelectNode) {
            return '';
        }
        if (that.selectPath) {
            return that.selectPath;
        }
        let result = '';
        if (that.selectedId && that.nodeDump) {
            result = animation_ctrl_1.animationCtrl.nodesDump.uuid2path[that.selectedId];
        }
        return result;
    },
    // 计算当前 sample
    sample() {
        let sample = 60;
        // @ts-ignore
        const that = this;
        that.clipConfig && (sample = that.clipConfig.sample);
        animation_editor_1.animationEditor.updateSample(sample);
        return sample;
    },
    // 计算当前最后一帧与位置数据
    lastFrameInfo() {
        // @ts-ignore
        const that = this;
        let frame = 0;
        if (that.clipConfig && that.clipConfig.duration) {
            frame = (0, utils_1.timeToFrame)(that.clipConfig.duration, that.sample);
        }
        const x = grid_ctrl_1.gridCtrl.frameToCanvas(frame);
        return {
            frame,
            x,
        };
    },
    propertyHeight() {
        // @ts-ignore
        const that = this;
        if (!that.properties) {
            return 0;
        }
        let res = 0;
        Object.keys(that.properties).forEach((prop) => {
            if (!that.properties[prop].hidden) {
                res += animation_editor_1.animationEditor.LINE_HEIGHT;
            }
        });
        return res;
    },
    stickInfo() {
        // @ts-ignore
        const that = this;
        if (!that.properties ||
            !that.selectKeyInfo ||
            !that.selectKeyInfo.keyFrames ||
            that.selectKeyInfo.keyFrames.length < 2 ||
            !that.updateSelectKey ||
            !that.updatePosition ||
            !that.propertyScrollInfo) {
            animation_editor_1.animationEditor.hasShowStick = false;
            return null;
        }
        const xList = [];
        const yList = [];
        const frames = [];
        that.selectKeyInfo.keyFrames.forEach((item, i) => {
            if (that.computeSelectPath &&
                that.selectKeyInfo.keyFrames[i] &&
                that.selectKeyInfo.keyFrames[i].nodePath !== that.computeSelectPath) {
                return;
            }
            xList.push(item.x || 0);
            that.properties[item.prop] && yList.push(that.properties[item.prop].top);
            frames.push(item.frame);
        });
        frames.sort((a, b) => a - b);
        animation_editor_1.animationEditor.stickInfo.leftFrame = frames[0];
        animation_editor_1.animationEditor.stickInfo.rightFrame = frames[frames.length - 1];
        xList.sort((a, b) => a - b);
        yList.sort((a, b) => a - b);
        // 计算结果为只有同个位置的关键帧
        if (xList[xList.length - 1] === xList[0]) {
            animation_editor_1.animationEditor.hasShowStick = false;
            return null;
        }
        animation_editor_1.animationEditor.stickInfo.width = xList[xList.length - 1] - xList[0] + 18;
        animation_editor_1.animationEditor.stickInfo.height = yList[yList.length - 1] - yList[0] + animation_editor_1.animationEditor.LINE_HEIGHT;
        animation_editor_1.animationEditor.stickInfo.left = xList[0] + grid_ctrl_1.gridCtrl.grid.xAxisOffset - 10;
        animation_editor_1.animationEditor.stickInfo.top = yList[0] - that.propertyScrollInfo.top;
        animation_editor_1.animationEditor.hasShowStick = true;
        return JSON.parse(JSON.stringify(animation_editor_1.animationEditor.stickInfo));
    },
    curveData() {
        // @ts-ignore
        const that = this;
        if (!that.selectProperty || !that.showAnimCurve || !that.properties) {
            animation_editor_1.animationEditor.repaintCurve(null);
            return null;
        }
        const nodePropDatas = animation_ctrl_1.animationCtrl.clipsDump?.pathsDump[that.selectProperty.nodePath];
        if (!nodePropDatas) {
            return null;
        }
        const propData = nodePropDatas[that.selectProperty.prop];
        if (!propData || !propData.isCurveSupport || !propData.type || !that.properties[that.selectProperty.prop]) {
            animation_editor_1.animationEditor.repaintCurve(null);
            return null;
        }
        if (propData.type && animation_editor_1.animationEditor.curveDisabledCCtypes.includes(propData.type.value)) {
            animation_editor_1.animationEditor.repaintCurve(null);
            return null;
        }
        const value = {
            curveInfos: {},
            wrapMode: that.clipConfig.wrapMode,
            duration: that.clipConfig.duration * that.clipConfig.sample,
        };
        let hasUserEasingMethod = false;
        if (propData.partKeys) {
            for (const key of propData.partKeys) {
                // for each 内部有异步风险，nodePropDatas 先取出来再使用
                const subPropData = nodePropDatas[key];
                value.curveInfos[key] = {
                    // keys 不能为 null[]
                    keys: subPropData.keyFrames.map((item) => item.curve).filter((curve) => !!curve),
                    preWrapMode: subPropData.preExtrap,
                    postWrapMode: subPropData.postExtrap,
                    color: that.properties[key].color,
                };
                hasUserEasingMethod = !!(hasUserEasingMethod || value.curveInfos[key].keys.find((item) => item.easingMethod));
            }
        }
        else {
            // 动画数据可能存在无穷大数据，不能直接序列化传递给 curve-editor
            value.curveInfos = {
                [that.selectProperty.prop]: {
                    keys: propData.keyFrames.map((item) => item.curve).filter((curve) => !!curve),
                    preWrapMode: propData.preExtrap,
                    postWrapMode: propData.postExtrap,
                    color: that.properties[that.selectProperty.prop].color,
                },
            };
            hasUserEasingMethod = !!(hasUserEasingMethod || value.curveInfos[that.selectProperty.prop].keys.find((item) => item.easingMethod));
        }
        if (animation_editor_1.animationEditor.checkCurveDataDirty(value)) {
            // 利用 vue 计算属性机制来最大化的减小不必要的重新绘制，同时需要自行再做一次 dirty 判断
            animation_editor_1.animationEditor.repaintCurve(value);
        }
        return {
            ...value,
            hasUserEasingMethod,
        };
    },
    curveStyle() {
        // @ts-ignore
        const that = this;
        if (that.showAnimCurve && that.computeSelectPath) {
            return {
                width: '100%',
                height: '100%',
            };
        }
        return {
            display: 'none',
        };
    },
    stickBoxStyle() {
        // @ts-ignore
        const that = this;
        if (!that.stickInfo) {
            return null;
        }
        return {
            width: that.stickInfo.width + 'px',
            height: that.stickInfo.height + 'px',
            top: that.stickInfo.top + 'px',
            left: that.stickInfo.left + 'px',
        };
    },
    currentKeyEmptyInfo() {
        // @ts-ignore
        const that = this;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.properties) {
            return {};
        }
        const res = {};
        const rawPropertyData = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.computeSelectPath];
        if (!rawPropertyData) {
            return res;
        }
        Object.keys(that.properties).forEach((key) => {
            if (!rawPropertyData[key]) {
                return;
            }
            const keyFrames = rawPropertyData[key].keyFrames;
            res[key] = !(keyFrames.find((keyInfo) => keyInfo.frame === that.currentFrame));
        });
        return res;
    },
    nodeTitle() {
        // @ts-ignore
        const that = this;
        // if (that.showAnimEmbeddedPlayer && !that.filterInvalid) {
        //     return '可通知节点列表';
        // }
        // if (that.showAnimEmbeddedPlayer && that.filterInvalid) {
        //     return '通知节点列表';
        // }
        if (that.filterInvalid) {
            return 'i18n:animator.node.nodeHasAnimation';
        }
        return 'i18n:animator.node.title';
    },
};
exports.computed = vComputed;
exports.watch = {
    async selectedId(newValue, oldValue) {
        // @ts-ignore
        const that = this;
        const nodePath = that.computeSelectPath;
        // 1. 清理不在新选中节点上的选中关键帧信息
        if (that.selectKeyInfo) {
            const res = that.selectKeyInfo.keyFrames.find((item) => item.nodePath !== nodePath);
            if (res) {
                that.selectKeyInfo = null;
            }
        }
        if (!newValue && animation_ctrl_1.animationCtrl.nodesDump) {
            // 新值为空时，可能是由于选中的节点是丢失节点导致的
            const result = animation_ctrl_1.animationCtrl.nodesDump.uuid2path[oldValue];
            if (result !== nodePath && nodePath) {
                return;
            }
        }
        that.updateSelectNode = -that.updateSelectNode;
        await animation_editor_1.animationEditor.updateSelectedId();
        // 2. 更新当前选中属性轨道信息
        if (that.properties && ((that.selectProperty && that.selectProperty.nodePath !== nodePath) || !that.selectProperty)) {
            const prop = Object.keys(that.properties)[0];
            animation_editor_1.animationEditor.updateSelectProperty({
                nodePath,
                prop,
                missing: that.properties[prop].missing,
                clipUuid: animation_ctrl_1.animationCtrl.clipsDump.uuid,
                isCurveSupport: that.properties[prop].isCurveSupport,
            });
        }
        else {
            that.selectProperty = null;
        }
    },
    selectKeyInfo() {
        // @ts-ignore
        const that = this;
        if (!that.showAnimCurve) {
            animation_editor_1.animationEditor.selectKeyUpdateFlag = true;
            return;
        }
        if (!animation_editor_1.animationEditor.selectKeyUpdateFlag) {
            return;
        }
        animation_editor_1.animationEditor.updateCurveSelecteKeys();
    },
    // 切换动画根节点状态重置
    root() {
        // @ts-ignore
        const that = this;
        that.filterInvalid = false;
        that.filterName = '';
        that.nodesHeight = 0;
    },
    async currentClip(newUuid, oldUuid) {
        // @ts-ignore
        const that = this;
        // 切换 clip 要清空复制的关键帧信息
        // animationCtrl.copyKeyInfo = null;
        if (newUuid === oldUuid || !newUuid) {
            return;
        }
        const changeSuccess = await (0, ipc_event_1.IsetEditClip)(newUuid);
        if (!changeSuccess) {
            changeFailedClips.push(newUuid);
            console.warn(`Set edit clip failed!${newUuid}`);
            if (changeFailedClips.includes(oldUuid)) {
                that.currentClip = '';
            }
            else {
                that.currentClip = oldUuid;
            }
            return;
        }
        that.selectEventInfo = null;
        that.selectKeyInfo = null;
        const time = await (0, ipc_event_1.IqueryPlayingClipTime)(that.currentClip);
        const frame = (0, utils_1.timeToFrame)(time, that.sample);
        animation_editor_1.animationEditor.setCurrentFrame(frame);
    },
    layout: {
        deep: true,
        handler() {
            // @ts-ignore
            const that = this;
            // resize 内部访问了 dom 的宽高数据，需要等待 vue 将数据翻到 dom 元素上后才能获取到正确数据
            (0, vue_js_1.nextTick)(() => {
                animation_editor_1.animationEditor.resize();
            });
        },
    },
    currentFrame() {
        // @ts-ignore
        const that = this;
        that.calcSelectProperty(null, true);
    },
    /**
     * 根据框选信息计算选中的关键帧信息
     */
    boxData() {
        // @ts-ignore
        const that = this;
        if (!that.boxData || !animation_ctrl_1.animationCtrl.clipsDump) {
            return;
        }
        const { origin, h, w, type } = that.boxData;
        if (type === 'property' && !that.properties) {
            return;
        }
        const rawKeyframes = that.boxInfo?.rawKeyFrames;
        const keyFrames = rawKeyframes || [];
        const scrollTop = type === 'node' ? that.nodeScrollInfo.top : that.propertyScrollInfo.top;
        function pushToKeyFrames(keyInfo) {
            const key = keyFrames.find((key) => key.rawFrame === keyInfo.rawFrame && key.prop === keyInfo.prop && key.nodePath === key.nodePath);
            if (key) {
                return;
            }
            keyFrames.push(keyInfo);
        }
        const pushKeyFrame = rawKeyframes ? pushToKeyFrames : (keyInfo) => keyFrames.push(keyInfo);
        function addKeyFrames(properties, node) {
            Object.values(properties).forEach((propData) => {
                // 超出范围高度的属性轨道
                // 轨道 top - 关键帧 position
                const top = propData.top + animation_editor_1.animationEditor.LINE_HEIGHT / 2 + animation_editor_1.animationEditor.KEY_SIZE_R - scrollTop;
                if (!node && (top < origin.y || top > origin.y + h)) {
                    return;
                }
                propData.keyFrames.forEach((key) => {
                    const x = key.x + that.offset;
                    if (x > origin.x && x < origin.x + w) {
                        const keyData = {
                            frame: key.frame,
                            rawFrame: key.frame,
                            nodePath: propData.nodePath,
                            x: key.x,
                            prop: propData.prop,
                        };
                        pushKeyFrame({
                            ...keyData,
                            key: (0, utils_1.calcKeyFrameKey)(keyData),
                        });
                    }
                });
            });
        }
        if (type === 'node') {
            Object.keys(animation_ctrl_1.animationCtrl.clipsDump.pathsDump).forEach((path) => {
                const nodeInfo = that.nodeDump.find((item) => item.path === path);
                if (!nodeInfo) {
                    return;
                }
                const top = nodeInfo.top + animation_editor_1.animationEditor.LINE_HEIGHT / 2 + animation_editor_1.animationEditor.KEY_SIZE_R - scrollTop;
                if (top < origin.y || top > origin.y + h) {
                    return;
                }
                const properties = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[path];
                addKeyFrames(properties, true);
            });
        }
        else {
            addKeyFrames(that.properties);
        }
        keyFrames.sort((a, b) => a.frame - b.frame);
        that.selectKeyInfo = {
            nodePath: that.computeSelectPath,
            keyFrames,
            location: 'prop',
            prop: that.selectProperty?.prop,
        };
    },
};
exports.methods = {
    onClipCurvePreset(curveData) {
        const that = this;
        that.$refs.curve.curveCtrl.applyBezierToSelectedCurveClip(curveData);
        (0, utils_1.multiplyTrackWithTimer)('hippoAnimator', {
            // 从预设曲线中选择曲线应用次数
            'A100000': 1,
            // 每次上报时需要带上当前项目id，project_id
            project_id: Editor.Project.uuid,
            // 每次上报时需要带上当前编辑的动画剪辑 clip_id
            clip_id: that.currentClip,
            // 编辑器版本
            version: Editor.App.version,
        });
    },
    toggleExpandLayoutChange(type) {
        this.expandLayout[type] = !this.expandLayout[type];
        animation_editor_1.animationEditor.setConfig('expandLayout', this.expandLayout);
        // resize 内部访问了 dom 的宽高数据，需要等待 vue 将数据翻到 dom 元素上后才能获取到正确数据
        (0, vue_js_1.nextTick)(() => {
            animation_editor_1.animationEditor.resize();
        });
    },
    showSelectedKeys() {
        // TODO: 临时方案。后续需要一个更好的分发方式，或者组件直接监听 keyboard 事件，而不是由顶层派发
        switch (this.focusedCurve) {
            case 'curve':
                if (!this.showAnimCurve || this.$refs.curve == null) {
                    return;
                }
                this.$refs.curve.zoomToSelectedKeys();
                break;
            case 'auxCurve':
                this.$refs.auxCurve.zoomToSelectedKeys();
                break;
            default:
                break;
        }
    },
    showAllKeys() {
        switch (this.focusedCurve) {
            case 'curve':
                // 显示所有关键帧到可视区域
                if (!this.showAnimCurve || !this.clipConfig?.duration || !this.curveData) {
                    return;
                }
                this.$refs.curve.zoomToFit();
                break;
            case 'auxCurve':
                this.$refs.auxCurve.zoomToFit();
                break;
            default:
                break;
        }
    },
    onUpdateEvent(uuid, frame, event) {
        if (event.length === 0) {
            // 事件函数为空时是一个删除操作，需要做选中关键帧的删除工作
            animation_ctrl_1.animationCtrl.deleteEvent();
            return;
        }
        (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.IupdateEvent)(uuid, frame, event));
    },
    // toggleAnimEmbeddedPlayer() {
    //     const that = this as IAniVMThis;
    //     if (!that.showAnimEmbeddedPlayer) {
    //         animationEditor.changeToEmbeddedPlayerMode();
    //     } else {
    //         animationEditor.changeToKeyFrameMode();
    //     }
    // },
    toggleInvalidNode() {
        const that = this;
        that.filterInvalid = !that.filterInvalid;
        // 切换是否隐藏无效节点时，去除原本的滚动信息
        that.$refs.nodes.scrollTop = that.nodeScrollInfo.top = 0;
        animation_editor_1.animationEditor.calcDisplayClips();
    },
    onFilter(event) {
        const that = this;
        event.stopPropagation();
        event.preventDefault();
        if (that.filterName === event.target.value) {
            return;
        }
        animation_editor_1.animationEditor.debounceFilterNode(event.target.value);
    },
    async calcSelectProperty(params, isUpdate = false) {
        const that = this;
        if (isUpdate && that.selectProperty) {
            params = that.selectProperty;
        }
        if (!params) {
            return;
        }
        const dump = await (0, ipc_event_1.IgetPropValueAtFrame)(that.currentClip, params.nodePath, params.prop, that.currentFrame);
        that.selectProperty = Object.assign(params, {
            dump,
        });
    },
    queryDurationStyle(frame) {
        if (!frame || !grid_ctrl_1.gridCtrl.grid) {
            return '';
        }
        let start = grid_ctrl_1.gridCtrl.grid.valueToPixelH(0);
        if (start < 0) {
            start = 0;
        }
        let width = grid_ctrl_1.gridCtrl.grid.valueToPixelH(frame) - start;
        if (width < 0) {
            // duration 已在屏幕之外
            start = width;
            width = 0;
        }
        // @ts-ignore
        return `transform: translateX(${start}px); width: ${width}px`;
    },
    // ********************* 数据处理 *********************
    // 计算关键帧与实际坐标偏移
    pointerPosition(offset = 0) {
        const that = this;
        return (grid_ctrl_1.gridCtrl.frameToCanvas(that.currentFrame) +
            (offset ?? grid_ctrl_1.gridCtrl.grid?.xAxisOffset ?? 0) -
            grid_ctrl_1.gridCtrl.startOffset);
    },
    // ********************* 事件处理 *********************
    onMouseWheel(event) {
        if (event.shiftKey) {
            // 按下 shift 滚动，允许横向移动画布
            animation_editor_1.animationEditor.moveTimeLine(process.platform === 'darwin' ? event.deltaX : event.deltaY);
            return;
        }
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
            animation_editor_1.animationEditor.moveTimeLine(event.deltaY);
        }
        else {
            animation_editor_1.animationEditor.scaleTimeLineAt(-event.deltaY, Math.round(event.offsetX));
        }
    },
    /**
     * 点击
     * @param event
     */
    onMouseDown(event) {
        const that = this;
        that.moveNodePath = '';
        that.boxInfo = null;
        that.boxStyle = null;
        // @ts-ignore
        const name = event.target.getAttribute('name');
        if (name !== 'event') {
            that.selectEventInfo = null;
        }
        if (name !== 'key' && name !== 'stick' && !(0, utils_1.checkCtrlOrCommand)(event)) {
            that.selectKeyInfo = null;
        }
        if (name !== 'range' && name !== 'stick' && !(0, utils_1.checkCtrlOrCommand)(event)) {
            that.selectEmbeddedPlayerInfo = null;
            Editor.Selection.unselect('animation-embeddedPlayer', Editor.Selection.getSelected('animation-embeddedPlayer'));
        }
        // if (name !== 'time-pointer') {
        //     that.selectProperty = null;
        // }
        let boxInfo = null;
        function checkMouseDownName() {
            if (event.offsetY > that.$refs['property-content'].offsetTop) {
                // 在 property 区域选中
                global_data_1.Flags.mouseDownName = 'property';
            }
            else if (event.offsetY > that.$refs['node-content'].offsetTop && event.offsetY < that.$refs['property-content'].offsetTop) {
                // 在节点区域点击
                global_data_1.Flags.mouseDownName = 'node';
            }
        }
        // 点击顶部移动当前关键帧
        switch (name) {
            case 'time-pointer':
                {
                    global_data_1.Flags.mouseDownName = 'time-pointer';
                }
                break;
            case 'pointer':
                // 不允许左键中键移动小红线
                if (event.button !== 1 /* EventButton.CENTER */) {
                    global_data_1.Flags.mouseDownName = 'pointer';
                }
                break;
            // case 'node':
            // case 'property':
            //     if (event.button === 0) {
            //         boxInfo = {
            //             type: name,
            //         };
            //         Flags.mouseDownName = name;
            //     } else {
            //         Flags.mouseDownName = 'grid';
            //         Flags.startDragGridInfo = {
            //             start: event.x,
            //             lastStart: event.x,
            //         };
            //         return;
            //     }
            //     break;
            case 'stick':
                global_data_1.Flags.mouseDownName = 'stick';
                that.selectKeyInfo.startX = event.x;
                that.selectKeyInfo.offset = 0;
                that.selectKeyInfo.offsetFrame = 0;
                // @ts-ignore
                global_data_1.Flags.startDragStickInfo = {
                    type: 'center',
                };
                break;
            default:
                if (event.button === 1 /* EventButton.CENTER */ || event.button === 2 /* EventButton.RIGHT */) {
                    global_data_1.Flags.startDragGridInfo = {
                        start: event.x,
                        lastStart: event.x,
                    };
                    if (event.button === 2 /* EventButton.RIGHT */) {
                        checkMouseDownName();
                        if (global_data_1.Flags.mouseDownName) {
                            break;
                        }
                    }
                    // 鼠标中键或右键按下，标识可以开始拖拽时间轴
                    global_data_1.Flags.mouseDownName = 'grid';
                    return;
                }
                if (!name) {
                    break;
                }
                global_data_1.Flags.mouseDownName = name;
        }
        // 针对 box 的显示效果
        if (!boxInfo && !global_data_1.Flags.mouseDownName) {
            checkMouseDownName();
            global_data_1.Flags.mouseDownName && (boxInfo = {
                type: global_data_1.Flags.mouseDownName,
                ctrlKey: (0, utils_1.checkCtrlOrCommand)(event),
            });
        }
        if (['node', 'property'].includes(global_data_1.Flags.mouseDownName) && boxInfo) {
            const positionResult = grid_ctrl_1.gridCtrl.pageToCtrl(event.x, event.y);
            boxInfo.startX = positionResult.x;
            boxInfo.startY = positionResult.y;
            boxInfo.ctrlKey = (0, utils_1.checkCtrlOrCommand)(event);
            if (boxInfo.ctrlKey && that.selectKeyInfo && that.selectKeyInfo.keyFrames) {
                boxInfo.rawKeyFrames = that.selectKeyInfo.keyFrames;
            }
            that.boxInfo = boxInfo;
        }
    },
    onPropertyListContextMouseDown(event) {
        global_data_1.Flags.mouseDownName = 'property-list-content';
    },
    onScroll(event, type) {
        const that = this;
        if (global_data_1.Flags.onScrolling) {
            return;
        }
        const scrollInfo = type === 'node' ? that.nodeScrollInfo : that.propertyScrollInfo;
        const scrollTop = event.target.scrollTop;
        if (scrollTop === scrollInfo.top) {
            return;
        }
        global_data_1.Flags.lastScrollTops.splice(0, 0, scrollTop);
        global_data_1.Flags.lastScrollTops.length = 3;
        if (global_data_1.Flags.lastScrollTops[0] === global_data_1.Flags.lastScrollTops[2]) {
            return;
        }
        if (!that.scrolling) {
            global_data_1.Flags.onScrolling = true;
            that.scrolling = true;
            requestAnimationFrame(() => {
                scrollInfo.top = scrollTop;
                // TODO 理论上不需要重新计算节点数据
                if (!animation_ctrl_1.animationCtrl.nodesDump?.nodesDump) {
                    animation_editor_1.animationEditor.calcNodes();
                }
                animation_editor_1.animationEditor.calcDisplayClips();
                that.updateKeyFrame++;
                that.scrolling = false;
                global_data_1.Flags.onScrolling = false;
            });
        }
    },
    async onConfirm(event) {
        const name = event.target.getAttribute('name');
        const value = event.target.value;
        if (name === 'sample') {
            animation_editor_1.animationEditor.updateSample(value);
        }
        await animation_ctrl_1.animationCtrl.updateConfig(name, value);
    },
    onStartResize(event, type) {
        animation_editor_1.animationEditor.onStartResize(event, type);
    },
    toggleAniCurve() {
        const that = this;
        that.showAnimCurve = !that.showAnimCurve;
        // 在 curve 元素显示后再初始化
        (0, vue_js_1.nextTick)(() => {
            animation_editor_1.animationEditor.initCurve();
        });
    },
    async onEditEasingMethodCurve(event) {
        const vm = this;
        if (!vm.showAnimCurve || !vm.curveData) {
            return;
        }
        if (vm.curveData.hasUserEasingMethod) {
            event.stopPropagation();
            event.stopImmediatePropagation();
            event.preventDefault();
            const res = await Editor.Dialog.warn(Editor.I18n.t('animator.tips.abort_easing_method'), {
                buttons: [Editor.I18n.t('animator.cancel'), Editor.I18n.t('animator.abort')],
                default: 0,
                cancel: 0,
            });
            if (res.response === 0) {
                return;
            }
            const modifyKeys = [];
            // TODO 可以修改为移除当前选中属性轨道的所有关键帧 easingMethod 的接口
            const { nodePath } = vm.selectProperty;
            for (const prop of Object.keys(vm.curveData.curveInfos)) {
                const curveInfo = vm.curveData.curveInfos[prop];
                curveInfo.keys.forEach((keyInfo) => {
                    if (keyInfo.easingMethod) {
                        modifyKeys.push((0, ipc_event_1.ImodifyCurveOfKey)(vm.currentClip, nodePath, prop, Math.round(keyInfo.point.x), {
                            easingMethod: 0,
                        }));
                    }
                });
            }
            (0, ipc_event_1.IApplyOperation)(modifyKeys);
        }
    },
    onShowUseBakedAnimationWarn(event) {
        if (this.useBakedAnimationWarnTip)
            return;
        const tooltip = document.createElement('div');
        const uiLabel = document.createElement('ui-label');
        uiLabel.style.whiteSpace = 'normal';
        uiLabel.setAttribute('value', 'i18n:animator.tips.use_baked_animation.detailed_warn_by_ska');
        tooltip.appendChild(uiLabel);
        const tipButton = event.target;
        const targetRect = tipButton.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        tooltip.setAttribute('style', `
            position: absolute;
            width: 608px;
            left: ${targetRect.left - 22}px;
            top: ${targetRect.top + targetRect.height + 4}px;
            z-index: 101;
            display: block;
            border-radius: 2px;
            background: #424242ff;
            border: 1px solid #8f8f8fff;
            box-shadow: 0 0 12px 0 #000000a6;
            padding: 16px;    
        `);
        const removeUseBakedAnimationWarnTip = (event) => {
            document.removeEventListener('mousedown', onGlobalMousedown);
            tooltip.removeEventListener('mouseleave', onMouseleave);
            if (this.useBakedAnimationWarnTip) {
                this.useBakedAnimationWarnTip = null;
                setTimeout(() => {
                    tooltip.remove();
                }, 100);
            }
        };
        const onMouseleave = (e) => {
            const composedPath = e.composedPath();
            if (composedPath.includes(tipButton))
                return;
            removeUseBakedAnimationWarnTip(e);
        };
        const onGlobalMousedown = (e) => {
            const composedPath = e.composedPath();
            // tooltip 内点击时不隐藏
            if (composedPath.includes(tooltip)) {
                return;
            }
            removeUseBakedAnimationWarnTip(e);
        };
        tooltip.addEventListener('mouseleave', onMouseleave);
        document.addEventListener('mousedown', onGlobalMousedown);
        this.useBakedAnimationWarnTip = tooltip;
        document.body.appendChild(tooltip);
    },
    /**
     * 切换关键帧显示类型
     */
    changeFrameShowType(showType) {
        const that = this;
        // 当前时间会根据 showType 自动计算
        // 而当前时间是 ui-num-input 焦点在输入框内时 value 值修改无效，需要延后一帧修改
        requestAnimationFrame(() => {
            that.showType = showType;
            grid_ctrl_1.gridCtrl.grid.labelShowType = showType;
            grid_ctrl_1.gridCtrl.grid.updateLabels();
            animation_editor_1.animationEditor.setConfig('showType', showType);
            // 切换类型后修改当前显示时间
        });
    },
    onScale(scale) {
        animation_editor_1.animationEditor.scaleTimeLineWith(scale);
    },
    /**
     * 关键帧更改
     * @param event
     */
    onTimeConfirm(event) {
        const that = this;
        const value = event.target.value;
        if (/^([0-9]*)f?$/.test(value)) {
            animation_editor_1.animationEditor.updateCurrentFrame(Number(value));
            return;
        }
        const sample = animation_ctrl_1.animationCtrl.clipConfig.sample;
        const timeTest = /^([0-9]*)-([0-9]*)$/;
        const testValue = value.match(timeTest);
        if (testValue) {
            const frame = Number(testValue[1]) * sample + Number(testValue[2]);
            animation_editor_1.animationEditor.updateCurrentFrame(frame);
            return;
        }
        const timesTest = /^((?<m>\d((\.\d*)?))m)?(?<s>(\d((\.\d*)?)))s$/;
        if (timesTest.test(value)) {
            // @ts-ignore
            const { groups: { m, s } } = value.match(timesTest);
            let frame = (0, utils_1.timeToFrame)(Number(s), sample);
            if (m) {
                frame += Number(m) * sample;
            }
            animation_editor_1.animationEditor.updateCurrentFrame(frame);
        }
        // hack 直接修改 event.target 的 value 值无法更改
        requestAnimationFrame(() => {
            event.path[0].value = that.currentTime;
        });
    },
    // ********************* 组件事件监听 *********************
    // 监听当前动画编辑器修改关键帧数据
    onPropChange(event) {
        const that = this;
        if (!that.selectProperty) {
            return;
        }
        // HACK 目前 ui 组件可能多发 change
        if (event.detail && event.detail.ignoreChange) {
            return;
        }
        const createKeyInfo = {
            value: {
                newValue: event.target.dump.value,
            },
            prop: that.selectProperty.prop,
            nodePath: that.computeSelectPath,
            frame: that.currentFrame,
        };
        // 不会向 undo 系统提交记录
        animation_ctrl_1.animationCtrl.callByDebounce('createKey', createKeyInfo, { recordUndo: false });
    },
    onPropConfirm(event) {
        const that = this;
        if (!that.selectProperty) {
            return;
        }
        // like what prop change event do
        if (event.detail && event.detail.ignoreChange) {
            return;
        }
        const uiProp = event.target;
        const createKeyInfo = {
            value: {
                newValue: uiProp.dump.value,
            },
            prop: that.selectProperty.prop,
            nodePath: that.computeSelectPath,
            frame: that.currentFrame,
        };
        // 在 undo 系统中生成一条记录
        animation_ctrl_1.animationCtrl.callByDebounce('createKey', createKeyInfo);
    },
    async onShowEmbeddedPlayerMenu(event) {
        const menu = animation_editor_1.animationEditor.getEmbeddedPlayerMenu();
        Editor.Menu.popup({ menu });
    },
    async updateEnableEmbeddedPlayer() {
        const that = this;
        that.enableEmbeddedPlayer = await animation_editor_1.animationEditor.getConfig('enableEmbeddedPlayer') ?? true;
        if (!that.enableEmbeddedPlayer) {
            that.expandLayout.embeddedPlayer = false;
        }
    },
};
exports.components = {
    'control-preview': components_1.ControlPointer,
    'control-track-tree': components_1.ControlTrackTree,
    'preview-row': components_1.PreviewRow,
    'preview-range-row': components_1.PreviewRangeRow,
    'tool-bar': components_1.AnimatorToolbar,
    'node-tree': components_1.NodeTree,
    'property-tree': components_1.PropertyTree,
    'tips-mask': components_1.TipsMask,
    events: components_1.EventsRow,
    'property-tools': components_1.PropertyTools,
    'event-editor': components_1.EventEditor,
    'ctrl-stick': components_1.CtrlStick,
    'ani-mask': components_1.AniMask,
    'AuxiliaryCurves': components_1.AuxiliaryCurves,
    AuxiliaryCurveFrames: components_1.AuxiliaryCurveFrames,
    CurvePresets: components_1.CurvePresets,
    PropertyCurve: components_1.PropertyCurve,
};
async function mounted() {
    // @ts-ignore
    const that = this;
    animation_ctrl_1.animationCtrl.init(that);
    animation_editor_1.animationEditor.init(that);
    global_data_1.Flags.sceneReady = await Editor.Message.request('scene', 'query-is-ready');
    if (global_data_1.Flags.sceneReady) {
        await animation_editor_1.animationEditor.debounceRefresh();
    }
    that.wrapModeList = await Editor.Message.request('scene', 'query-enum-list-with-path', 'AnimationClip.WrapMode');
    that.wrapModeList?.forEach((item) => {
        // @ts-ignore
        item.tip = Editor.I18n.t(`animator.animationCurve.WrapMode.${item.name}.tip`) || item.name;
        item.name = Editor.I18n.t(`animator.animationCurve.WrapMode.${item.name}.label`) || item.name;
    });
    const layout = await animation_editor_1.animationEditor.getConfig('layout');
    if (layout && typeof layout === 'object') {
        // 数据迁移
        if (!layout.topPec) {
            layout.topPec = layout.top && (layout.top / that.$refs['container'].offsetHeight) * 100 || 25;
            layout.leftPec = layout.left && (layout.left / that.$refs['container'].offsetWidth) * 100 || 30;
        }
        if (typeof layout.topPec === 'string') {
            layout.topPec = Number(layout.topPec.replace('%', '')) || 25;
        }
        if (typeof layout.leftPec === 'string') {
            layout.leftPec = Number(layout.leftPec.replace('%', '')) || 30;
        }
        layout.centerPec = layout.centerPec ?? 30;
        Object.assign(that.layout, layout);
    }
    that.expandLayout = Object.assign(that.expandLayout, await animation_editor_1.animationEditor.getConfig('expandLayout') || {});
    await that.updateEnableEmbeddedPlayer();
    await that.updateAuxCurveEnableState();
    that.selectedIds = new Set(Editor.Selection.getSelected('node'));
    that.selectedId = Editor.Selection.getLastSelected('node');
    that.currentSceneMode = await (0, ipc_event_1.IquerySceneMode)();
}
exports.mounted = mounted;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwREFBNEc7QUFtQjVHLDREQUF3RDtBQUN4RCxrREFVNEI7QUFFNUIsc0NBUW9CO0FBRXBCLGtEQUFvRTtBQUNwRSxzREFBNkM7QUFDN0MsZ0VBQTREO0FBQzVELG1DQUFtRztBQUNuRyw2Q0FBd0Q7QUFFeEQsNkNBa0JzQjtBQUV0Qiw0REFBd0Q7QUFFeEQsYUFBYTtBQUNiLE1BQU0saUJBQWlCLEdBQWEsRUFBRSxDQUFDO0FBRTFCLFFBQUEsVUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBQztJQUN0QyxHQUFHLEVBQUUsb0JBQU87Q0FDZixDQUFDLENBQUM7QUFFSSxNQUFNLElBQUksR0FBb0I7SUFDakMsT0FBTztRQUNILE9BQU8sRUFBRSxrQkFBa0I7UUFDM0IsS0FBSyxFQUFFO1lBQ0gsT0FBTyxFQUFFLEVBQUU7U0FDZDtRQUNELFlBQVksRUFBRSxDQUFDO1FBQ2YsSUFBSSxFQUFFLEVBQUU7UUFDUixVQUFVLEVBQUUsRUFBRTtRQUNkLFdBQVcsRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUN0QixVQUFVLEVBQUUsRUFBRTtRQUNkLFlBQVksRUFBRSxFQUFFO1FBQ2hCLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsVUFBVSxFQUFFLElBQUk7UUFDaEIsU0FBUyxFQUFFLEVBQUU7UUFDYixhQUFhLEVBQUUsSUFBSTtRQUNuQixlQUFlLEVBQUUsSUFBSTtRQUNyQix3QkFBd0IsRUFBRSxJQUFJO1FBQzlCLHFDQUFxQztRQUNyQyxXQUFXLEVBQUUsSUFBSTtRQUNqQixhQUFhLEVBQUUsS0FBSztRQUNwQixjQUFjLEVBQUUsTUFBTTtRQUN0QixjQUFjLEVBQUUsQ0FBQztRQUNqQixTQUFTLEVBQUUsRUFBRTtRQUNi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Q25DLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNoRTtRQUNELElBQUksT0FBTyxNQUFNLENBQUMsT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUNwQyxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDbEU7UUFDRCxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN0QztJQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sa0NBQWUsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDNUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztJQUN4QyxNQUFNLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0lBQ3ZDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNqRSxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLElBQUEsMkJBQWUsR0FBRSxDQUFDO0FBQ3BELENBQUM7QUF2Q0QsMEJBdUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSwgeyBTZXR1cENvbnRleHQsIGNvbXB1dGVkLCByZWYsIHVucmVmLCBuZXh0VGljaywgdG9SZWYsIGRlZmluZUNvbXBvbmVudCB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmltcG9ydCB7XG4gICAgSUtleUZyYW1lLFxuICAgIElSYXdLZXlGcmFtZSxcbiAgICBhbmlWbURhdGEsXG4gICAgSUFuaVZNTWV0aG9kcyxcbiAgICBJQW5pVk1UaGlzLFxuICAgIElTZWxlY3RQcm9wZXJ0eSxcbiAgICBJQ3VydmVWYWx1ZSxcbiAgICBJS2V5RnJhbWVEYXRhLFxuICAgIElQcm9wRGF0YSxcbiAgICBJU2hvd1R5cGUsXG4gICAgSUNyZWF0ZUtleUluZm8sXG4gICAgTGF5b3V0UGVyY2VudEtleSxcbiAgICBJQ3JlYXRlRW1iZWRkZWRQbGF5ZXJJbmZvLFxuICAgIElBbmlDdXJ2ZUNvbXBvbmVudCxcbn0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyBhbmltYXRpb25DdHJsIH0gZnJvbSAnLi4vc2hhcmUvYW5pbWF0aW9uLWN0cmwnO1xuaW1wb3J0IHtcbiAgICBJQW5pbU9wZXJhdGlvbixcbiAgICBJQXBwbHlPcGVyYXRpb24sXG4gICAgSWNyZWF0ZUtleSxcbiAgICBJZ2V0UHJvcFZhbHVlQXRGcmFtZSxcbiAgICBJbW9kaWZ5Q3VydmVPZktleSxcbiAgICBJcXVlcnlQbGF5aW5nQ2xpcFRpbWUsXG4gICAgSXF1ZXJ5U2NlbmVNb2RlLFxuICAgIElzZXRFZGl0Q2xpcCxcbiAgICBJdXBkYXRlRXZlbnQsXG59IGZyb20gJy4uL3NoYXJlL2lwYy1ldmVudCc7XG5cbmltcG9ydCB7XG4gICAgY2FsY0tleUZyYW1lS2V5LFxuICAgIGNoZWNrQ3RybE9yQ29tbWFuZCxcbiAgICBFdmVudEJ1dHRvbixcbiAgICBtdWx0aXBseVRyYWNrV2l0aFRpbWVyLFxuICAgIHNvcnRQcm9wZXJ0eU1lbnUsXG4gICAgdGltZVRvRnJhbWUsXG4gICAgdHJhbnNGcmFtZUJ5VHlwZSxcbn0gZnJvbSAnLi8uLi91dGlscyc7XG5cbmltcG9ydCB7IGdyaWRDdHJsLCBzeW5jQXhpc1gsIHN5bmNBeGlzWSB9IGZyb20gJy4uL3NoYXJlL2dyaWQtY3RybCc7XG5pbXBvcnQgeyBGbGFncyB9IGZyb20gJy4uL3NoYXJlL2dsb2JhbC1kYXRhJztcbmltcG9ydCB7IGFuaW1hdGlvbkVkaXRvciB9IGZyb20gJy4uL3NoYXJlL2FuaW1hdGlvbi1lZGl0b3InO1xuaW1wb3J0IHsgdXNlQmFzZVN0b3JlLCB1c2VBdXhDdXJ2ZVN0b3JlLCB1c2VUcmFuc2Zvcm1FdmVudCwgdXNlSTE4biwgdXNlR3JpZFN0b3JlIH0gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQgeyBQcm9wU2V0LCBhZGFwdERpcmVjdGl2ZXMgfSBmcm9tICcuL2RpcmVjdGl2ZXMnO1xuXG5pbXBvcnQge1xuICAgIEF1eGlsaWFyeUN1cnZlRnJhbWVzLFxuICAgIEF1eGlsaWFyeUN1cnZlcyxcbiAgICBBbmlNYXNrLFxuICAgIEFuaW1hdG9yVG9vbGJhcixcbiAgICBDb250cm9sUG9pbnRlcixcbiAgICBDb250cm9sVHJhY2tUcmVlLFxuICAgIEN0cmxTdGljayxcbiAgICBFdmVudEVkaXRvcixcbiAgICBFdmVudHNSb3csXG4gICAgTm9kZVRyZWUsXG4gICAgUHJldmlld1JhbmdlUm93LFxuICAgIFByZXZpZXdSb3csXG4gICAgUHJvcGVydHlUb29scyxcbiAgICBQcm9wZXJ0eVRyZWUsXG4gICAgUHJvcGVydHlDdXJ2ZSxcbiAgICBUaXBzTWFzayxcbiAgICBDdXJ2ZVByZXNldHMsXG59IGZyb20gJy4vY29tcG9uZW50cyc7XG5pbXBvcnQgeyBJRXZlbnREdW1wIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgeyBkZWZhdWx0QmV6aWVyIH0gZnJvbSAnLi4vc2hhcmUvYmV6aWVyLXByZXNldHMnO1xuXG4vLyBIQUNLIOmBv+WFjeatu+W+queOr1xuY29uc3QgY2hhbmdlRmFpbGVkQ2xpcHM6IHN0cmluZ1tdID0gW107XG5cbmV4cG9ydCBjb25zdCBkaXJlY3RpdmVzID0gYWRhcHREaXJlY3RpdmVzKHtcbiAgICBzZXQ6IFByb3BTZXQsXG59KTtcblxuZXhwb3J0IGNvbnN0IGRhdGE6ICgpID0+IGFuaVZtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRpbmc6ICd3YWl0X3NjZW5lX3JlYWR5JyxcbiAgICAgICAgdG9hc3Q6IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50RnJhbWU6IDAsIC8vIO+8iOW9k+WJjeWFs+mUruW4p++8ieenu+WKqOeahCBwb2ludGVyIOaJgOWkhOWcqOeahOWFs+mUruW4p1xuICAgICAgICByb290OiAnJywgLy8g5qC56IqC54K5IHV1aWQgVE9ETyDnp7vpmaRcbiAgICAgICAgc2VsZWN0ZWRJZDogJycsIC8vIOmAieS4reiKgueCuSB1dWlkXG4gICAgICAgIHNlbGVjdGVkSWRzOiBuZXcgU2V0KCksIC8vIOmAieS4reiKgueCuSB1dWlkIOaVsOe7hFxuICAgICAgICBzZWxlY3RQYXRoOiAnJyxcbiAgICAgICAgbW92ZU5vZGVQYXRoOiAnJywgLy8g5q2j5Zyo6L+B56e755qE5Yqo55S76IqC54K56Lev5b6EXG4gICAgICAgIHNlbGVjdFByb3BlcnR5OiBudWxsLCAvLyDpgInkuK3nmoTlsZ7mgKfmlbDmja5cbiAgICAgICAgbm9kZUR1bXA6IG51bGwsIC8vIOiKgueCuSBkdW1wIOaVsOaNrlxuICAgICAgICBldmVudHNEdW1wOiBudWxsLCAvLyDliqjnlLvkuovku7blhbPplK7luKfmlbDmja5cbiAgICAgICAgY2xpcHNNZW51OiBbXSxcbiAgICAgICAgc2VsZWN0S2V5SW5mbzogbnVsbCwgLy8g5b2T5YmN6YCJ5Lit55qE5YWz6ZSu5binXG4gICAgICAgIHNlbGVjdEV2ZW50SW5mbzogbnVsbCwgLy8g5b2T5YmN6YCJ5Lit55qE5LqL5Lu25L+h5oGvXG4gICAgICAgIHNlbGVjdEVtYmVkZGVkUGxheWVySW5mbzogbnVsbCwgLy8g5b2T5YmN6YCJ5Lit55qE5bWM5YWl5pKt5pS+5ZmoXG4gICAgICAgIC8vIGNvcHlFdmVudEluZm86IG51bGwsIC8vIOWkjeWItueahOWFs+mUruW4p+S6i+S7tuS/oeaBr1xuICAgICAgICBhbmlDb21wVHlwZTogbnVsbCwgLy8g5a2Y5YKo5b2T5YmN5Yqo55S757uE5Lu255qE57G75Z6LIOmqqOmqvOWKqOeUu+OAgeaZrumAmuWKqOeUu+OAgeWKqOeUu+WbvlxuICAgICAgICBhbmltYXRpb25Nb2RlOiBmYWxzZSwgLy8g5b2T5YmN5Yqo55S755qE57yW6L6R5qih5byPXG4gICAgICAgIGFuaW1hdGlvblN0YXRlOiAnc3RvcCcsIC8vIOW9k+WJjeWKqOeUu+eahOaSreaUvuaooeW8j1xuICAgICAgICBlZGl0RXZlbnRGcmFtZTogMCwgLy8g5b2T5YmN57yW6L6R55qE5LqL5Lu25YWz6ZSu5binXG4gICAgICAgIG1hc2tQYW5lbDogJycsIC8vIOmBrue9qemdouadv1xuICAgICAgICBzZWxlY3REYXRhQ2hhbmdlOiAwLCAvLyDmm7TmlrDlvZPliY3pgInkuK3oioLngrnmlbDmja7nmoRcbiAgICAgICAgbm9kZXNIZWlnaHQ6IDAsXG4gICAgICAgIG5vZGVTY3JvbGxJbmZvOiBudWxsLFxuICAgICAgICBwcm9wZXJ0eVNjcm9sbEluZm86IG51bGwsXG4gICAgICAgIGVtYmVkZGVkUGxheWVyU2Nyb2xsSW5mbzogbnVsbCxcbiAgICAgICAgbW92ZUluZm86IG51bGwsIC8vIOWtmOWCqOW9k+WJjeenu+WKqOi/h+eoi+S4reeahOWFs+mUruW4p+S/oeaBr1xuICAgICAgICBib3hJbmZvOiBudWxsLCAvLyDliJ3lp4vljJblrZjlgqjkv6Hmga9cbiAgICAgICAgYm94U3R5bGU6IG51bGwsIC8vIOmcgOimgee7keWumuWIsOeVjOmdouS4iueahOagt+W8j+aVsOaNrlxuICAgICAgICBib3hEYXRhOiBudWxsLCAvLyDpnIDopoHkvKDpgJLnu5nlrZDnu4Tku7bnmoQgYm94IOS/oeaBr1xuICAgICAgICBwcmV2aWV3UG9pbnRlcjogbnVsbCwgLy8g6aKE6KeI5b2T5YmN5bCP57qi57q/55qE5L2N572uXG4gICAgICAgIHByb3BlcnRpZXNNZW51OiBudWxsLCAvLyDlrZjlgqjlvZPliY3oioLngrnlhYHorrjmt7vliqDnmoTlsZ7mgKfoj5zljZVcbiAgICAgICAgcHJvcGVydGllczogbnVsbCxcblxuICAgICAgICB1cGRhdGVLZXlGcmFtZTogMCxcbiAgICAgICAgdXBkYXRlUG9zaXRpb246IDAsXG4gICAgICAgIHVwZGF0ZVNlbGVjdEtleTogMSwgLy8g5pu05paw6YCJ5Lit5YWz6ZSu5bin55qE5L2N572u5L+h5oGvXG4gICAgICAgIHVwZGF0ZVNlbGVjdE5vZGU6IDEsIC8vIEhBQ0sg6Kem5Y+R6K6h566X5bGe5oCn5pu05pawXG4gICAgICAgIHNjcm9sbGluZzogZmFsc2UsXG4gICAgICAgIGV4cGFuZEluZm86IHt9LCAvLyDlrZjlgqjmnInliIbph4/ovajpgZPnmoTlsZXlvIDkv6Hmga9cbiAgICAgICAgbGF5b3V0OiB7XG4gICAgICAgICAgICAvLyDlrZjlgqjlvZPliY3luIPlsYDkv6Hmga9cbiAgICAgICAgICAgIHRvcFBlYzogMjUsXG4gICAgICAgICAgICBjZW50ZXJQZWM6IDMwLFxuICAgICAgICAgICAgYXV4Q3VydmVQZWM6IDE1LFxuICAgICAgICAgICAgbGVmdFBlYzogMzAsXG4gICAgICAgICAgICBfdG90YWxQZWM6IDEwMCxcblxuICAgICAgICAgICAgX192ZXJzaW9uX186ICcxLjAuMScsXG4gICAgICAgIH0sXG4gICAgICAgIGxlZnRSZXNpemVNb3Zpbmc6IGZhbHNlLFxuICAgICAgICBleHBhbmRMYXlvdXQ6IHtcbiAgICAgICAgICAgIC8vIOm7mOiupOmakOiXj+mBv+WFjeW5suaJsFxuICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXI6IGZhbHNlLFxuICAgICAgICAgICAgbm9kZTogdHJ1ZSxcbiAgICAgICAgICAgIHByb3BlcnR5OiB0cnVlLFxuICAgICAgICAgICAgYXV4aWxpYXJ5Q3VydmU6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICAvLyDliqjnlLvltYzlhaXmkq3mlL7lmajnm67liY3kvZzkuLrlrp7pqozlrqTlip/og73mj5DkvpvvvIzpnIDopoHkuIDkupvlip/og73lvIDlhbNcbiAgICAgICAgZW5hYmxlRW1iZWRkZWRQbGF5ZXI6IHRydWUsXG4gICAgICAgIGZpbHRlckludmFsaWQ6IGZhbHNlLFxuICAgICAgICBmaWx0ZXJOYW1lOiAnJyxcbiAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICB3cmFwTW9kZUxpc3Q6IFtdLFxuICAgICAgICBzaG93QW5pbUN1cnZlOiBmYWxzZSxcbiAgICAgICAgc2hvd0FuaW1FbWJlZGRlZFBsYXllcjogdHJ1ZSxcbiAgICAgICAgbGlnaHRDdXJ2ZTogbnVsbCxcbiAgICAgICAgaGFzU2VsZWN0ZWRDdXJ2ZUNsaXA6IGZhbHNlLFxuICAgICAgICBjdXJ2ZURpc2FibGVkQ0N0eXBlczogYW5pbWF0aW9uRWRpdG9yLmN1cnZlRGlzYWJsZWRDQ3R5cGVzLFxuICAgICAgICBwcmVzZXRTaXplOiAxMTAsXG4gICAgICAgIC8vIOW9k+WJjeWxleW8gOeahCB0YWIg6aG5XG4gICAgICAgIGV4cGFuZFRhYjogJycsXG4gICAgICAgIHNlYXJjaFByZXNldE5hbWU6ICcnLFxuICAgICAgICB0aW1lSW5mb3M6IFtdLFxuICAgICAgICBzaG93VHlwZTogJ2ZyYW1lJyxcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJHcm91cHM6IFtdLFxuXG4gICAgICAgIHNob3dVc2VCYWtlZEFuaW1hdGlvbldhcm46IGZhbHNlLFxuICAgICAgICB1c2VCYWtlZEFuaW1hdGlvbldhcm5UaXA6IG51bGwsXG4gICAgICAgIGN1cnJlbnRTY2VuZU1vZGU6ICdwcmV2aWV3JyxcbiAgICB9O1xufTtcblxuZXhwb3J0IGNvbnN0IHNldHVwID0gKHByb3BzOiBhbnksIGN0eDogU2V0dXBDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgYmFzZVN0b3JlID0gdXNlQmFzZVN0b3JlKCk7XG4gICAgY29uc3QgZ3JpZFN0b3JlID0gdXNlR3JpZFN0b3JlKCk7XG4gICAgY29uc3QgeyB0IH0gPSB1c2VJMThuKCk7XG5cbiAgICBjb25zdCBpc1NrZWxldG9uQ2xpcCA9IHRvUmVmKGJhc2VTdG9yZSwgJ2lzU2tlbGV0b25DbGlwJyk7XG4gICAgY29uc3Qgb2Zmc2V0ID0gdG9SZWYoZ3JpZFN0b3JlLCAnb2Zmc2V0Jyk7XG4gICAgY29uc3Qgc2NhbGUgPSB0b1JlZihncmlkU3RvcmUsICdzY2FsZScpO1xuICAgIGNvbnN0IGNsaXBDb25maWcgPSB0b1JlZihiYXNlU3RvcmUsICdjbGlwQ29uZmlnJyk7XG4gICAgY29uc3QgY3VycmVudENsaXAgPSB0b1JlZihiYXNlU3RvcmUsICdjdXJyZW50Q2xpcCcpO1xuICAgIGNvbnN0IGZvY3VzZWRDdXJ2ZSA9IHRvUmVmKGJhc2VTdG9yZSwgJ2ZvY3VzZWRDdXJ2ZScpO1xuXG4gICAgY29uc3QgY2hhcnQgPSByZWY8SFRNTEVsZW1lbnQ+KCk7XG4gICAgY29uc3QgbGF5b3V0UmlnaHQgPSByZWY8SFRNTEVsZW1lbnQ+KCk7XG4gICAgY29uc3QgZ3JpZENhbnZhcyA9IHJlZjxIVE1MQ2FudmFzRWxlbWVudD4oKTtcbiAgICBjb25zdCBjdXJ2ZSA9IHJlZjxJQW5pQ3VydmVDb21wb25lbnQ+KCk7XG4gICAgY29uc3QgYXV4Q3VydmUgPSByZWY8SUFuaUN1cnZlQ29tcG9uZW50PigpO1xuXG4gICAgY29uc3QgYXV4Q3VydmVTdG9yZSA9IHVzZUF1eEN1cnZlU3RvcmUoKTtcblxuICAgIGNvbnN0IHRyYW5zZm9ybUV2ZW50ID0gdXNlVHJhbnNmb3JtRXZlbnQoKTtcbiAgICAvLyDku47lhbbku5blnLDmlrnop6blj5HnmoQgdHJhbnNmb3Jt77yM5ZCM5q2l5YiwIHByb3BlcnR5IOeahCBjdXJ2ZVxuICAgIHRyYW5zZm9ybUV2ZW50Lm9uVXBkYXRlKChrZXkpID0+IHtcbiAgICAgICAgaWYgKGdyaWRDdHJsLmdyaWQpIHtcbiAgICAgICAgICAgIG9mZnNldC52YWx1ZSA9IGdyaWRDdHJsLmdyaWQueEF4aXNPZmZzZXQ7XG4gICAgICAgICAgICBzY2FsZS52YWx1ZSA9IGdyaWRDdHJsLmdyaWQueEF4aXNTY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgIT09ICdwcm9wZXJ0eScgJiYgY3VydmUudmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChjdXJ2ZS52YWx1ZS5jdXJ2ZUN0cmwgJiYgZ3JpZEN0cmwuZ3JpZCkge1xuICAgICAgICAgICAgICAgIHN5bmNBeGlzWChncmlkQ3RybC5ncmlkLCBjdXJ2ZS52YWx1ZS5jdXJ2ZUN0cmwuZ3JpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov5nkupvmk43kvZzkuI3ljLrliIbkuovku7bmnaXmupDvvIznu5/kuIDlnKjov5nph4zlgZrkuIDmrKHvvIzlhbblroPlnLDmlrnnm5HlkKznmoTml7blgJnlsLHkuI3nlKjlgZrkuoZcbiAgICAgICAgZ3JpZEN0cmwuZ3JpZD8ucmVuZGVyKCk7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVQb3NpdGlvbkluZm8oKTtcbiAgICAgICAgY3VydmUudmFsdWU/LnJlcGFpbnQoKTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlbmRlclRpbWVBeGlzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBlbmFibGVBdXhDdXJ2ZSA9IGNvbXB1dGVkKCgpID0+IHtcbiAgICAgICAgLy8g5pqC5pe25Y+q5a+56aqo6aq85Yqo55S75byA5pS+6L6F5Yqp5puy57q/XG4gICAgICAgIHJldHVybiBhdXhDdXJ2ZVN0b3JlLmVuYWJsZWQgJiYgaXNTa2VsZXRvbkNsaXAudmFsdWU7XG4gICAgfSk7XG4gICAgY29uc3QgdXBkYXRlQXV4Q3VydmVFbmFibGVTdGF0ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgYXV4Q3VydmVTdG9yZS51cGRhdGVFbmFibGVTdGF0ZSgpO1xuICAgIH07XG5cbiAgICAvLyBlbWJlZGVkIHBsYXllciDnm7jlhbNcbiAgICBjb25zdCBhZGRpbmdFbWJlZGRlZFBsYXllciA9IHJlZjxSZWNvcmQ8c3RyaW5nLCBJQ3JlYXRlRW1iZWRkZWRQbGF5ZXJJbmZvPj4oe30pO1xuICAgIGNvbnN0IG9uQWRkRW1iZWRkZWRQbGF5ZXIgPSAoaW5mbzogSUNyZWF0ZUVtYmVkZGVkUGxheWVySW5mbykgPT4ge1xuICAgICAgICBjb25zdCBrZXkgPSB0eXBlb2YgaW5mby5ncm91cCA9PT0gJ3N0cmluZycgJiYgaW5mby5ncm91cCA/IGluZm8uZ3JvdXAgOiAnJztcbiAgICAgICAgaWYgKGtleSAhPT0gJycpIHtcbiAgICAgICAgICAgIFZ1ZS5zZXQoYWRkaW5nRW1iZWRkZWRQbGF5ZXIudmFsdWUsIGtleSwgaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmFkZEVtYmVkZGVkUGxheWVyKGluZm8pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBWdWUuZGVsZXRlKGFkZGluZ0VtYmVkZGVkUGxheWVyLnZhbHVlLCBrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGNvbnN0IGlzRW1iZWRkZWRQbGF5ZXJBZGRpbmcgPSAoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgbWFwID0gdW5yZWYoYWRkaW5nRW1iZWRkZWRQbGF5ZXIpO1xuICAgICAgICByZXR1cm4gbWFwW2tleV0gIT09IHVuZGVmaW5lZDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdCxcbiAgICAgICAgLy8gRklYTUU6IOS4uuS6huS9vyBhbmltYXRpb25FZGl0b3LvvIxhbmltYXRpb25DdHJsIOetieaooeWdl+S4reiDveiuv+mXruWIsCBzdG9yZe+8jOWwhiBzdG9yZSDmlbTkuKrmmrTpnLLlh7rljrvjgIJcbiAgICAgICAgLy8g6L+Z5Liq55So5rOV5Y2B5YiG5LiN5o6o6I2Q77yM5L2G5Zyo5pW05L2T6YeN5p6E5YmN5rKh5pyJ5pu05aW955qE5Yqe5rOVXG4gICAgICAgIGF1eEN1cnZlU3RvcmUsXG5cbiAgICAgICAgY3VycmVudENsaXAsXG4gICAgICAgIGNsaXBDb25maWcsXG4gICAgICAgIGlzU2tlbGV0b25DbGlwLFxuICAgICAgICBvZmZzZXQsXG4gICAgICAgIHNjYWxlLFxuXG4gICAgICAgIC8vIHJlZiBlbGVtZW50c1xuICAgICAgICBjdXJ2ZSxcbiAgICAgICAgYXV4Q3VydmUsXG4gICAgICAgIGdyaWRDYW52YXMsXG4gICAgICAgIGNoYXJ0LFxuICAgICAgICByaWdodDogbGF5b3V0UmlnaHQsXG4gICAgICAgIGZvY3VzZWRDdXJ2ZSxcblxuICAgICAgICB0b1BlcmNlbnQ6IChudW06IG51bWJlcikgPT4gYCR7bnVtfSVgLFxuXG4gICAgICAgIHRyYW5zZm9ybUV2ZW50LFxuXG4gICAgICAgIGVuYWJsZUF1eEN1cnZlLFxuICAgICAgICB1cGRhdGVBdXhDdXJ2ZUVuYWJsZVN0YXRlLFxuXG4gICAgICAgIG9uQWRkRW1iZWRkZWRQbGF5ZXIsXG4gICAgICAgIGlzRW1iZWRkZWRQbGF5ZXJBZGRpbmcsXG4gICAgfTtcbn07XG5cbmNvbnN0IHZDb21wdXRlZCA9IHtcbiAgICAvLyDmoLnmja4gZXhwYW5kTGF5b3V0IOS4jiBsYXlvdXQg6K6h566X55yf5a6e5pi+56S655qE5biD5bGA5L+h5oGvXG4gICAgZGlzcGxheUxheW91dCh0aGlzOiBJQW5pVk1UaGlzKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGhhbmRsZUtleXMgPSBPYmplY3Qua2V5cyh0aGF0LmV4cGFuZExheW91dCkuZmlsdGVyKChrZXkpID0+ICF0aGF0LmV4cGFuZExheW91dFtrZXldKTtcbiAgICAgICAgaWYgKCFoYW5kbGVLZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoYXQubGF5b3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzID0geyAuLi50aGF0LmxheW91dCB9O1xuICAgICAgICBjb25zdCByZXN0OiBMYXlvdXRQZXJjZW50S2V5W10gPSBbJ3RvcFBlYycsICdjZW50ZXJQZWMnLCAnYXV4Q3VydmVQZWMnXTtcbiAgICAgICAgY29uc3QgdG90YWxQZWMgPSBhbmltYXRpb25FZGl0b3IubGF5b3V0Q29uZmlnLnRvdGFsUGVjO1xuXG4gICAgICAgIGlmICghdGhhdC5leHBhbmRMYXlvdXQuZW1iZWRkZWRQbGF5ZXIpIHtcbiAgICAgICAgICAgIHJlcy50b3BQZWMgPSAwO1xuICAgICAgICAgICAgcmVzdC5zcGxpY2UocmVzdC5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0gPT09ICd0b3BQZWMnKSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGF0LmV4cGFuZExheW91dC5ub2RlKSB7XG4gICAgICAgICAgICByZXMuY2VudGVyUGVjID0gMDtcbiAgICAgICAgICAgIHJlc3Quc3BsaWNlKHJlc3QuZmluZEluZGV4KChpdGVtKSA9PiBpdGVtID09PSAnY2VudGVyUGVjJyksIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhhdC5leHBhbmRMYXlvdXQuYXV4aWxpYXJ5Q3VydmUpIHtcbiAgICAgICAgICAgIHJlcy5hdXhDdXJ2ZVBlYyA9IDA7XG4gICAgICAgICAgICByZXN0LnNwbGljZShyZXN0LmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbSA9PT0gJ2F1eEN1cnZlUGVjJyksIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhhdC5leHBhbmRMYXlvdXQucHJvcGVydHkpIHtcbiAgICAgICAgICAgIGNvbnN0IGluY3JlYXNlID0gdG90YWxQZWMgLSAocmVzLnRvcFBlYyArIHJlcy5jZW50ZXJQZWMgKyByZXMuYXV4Q3VydmVQZWMpO1xuICAgICAgICAgICAgaWYgKHJlc3QubGVuZ3RoID4gMCAmJiBpbmNyZWFzZSA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdmVyYWdlID0gaW5jcmVhc2UgLyByZXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXN0LmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNba2V5XSArPSBhdmVyYWdlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcmVzW3Jlc3RbMF1dID0gTWF0aC5taW4odG90YWxQZWMsIHRoYXQubGF5b3V0LnRvcFBlYyArIHRoYXQubGF5b3V0LmNlbnRlclBlYyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLy8g5b2T5YmN5YWz6ZSu5bin5pi+56S65pe26Ze0XG4gICAgY3VycmVudFRpbWUoKTogc3RyaW5nIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICByZXR1cm4gdHJhbnNGcmFtZUJ5VHlwZSh0aGF0LmN1cnJlbnRGcmFtZSwgdGhhdC5zaG93VHlwZSwgdGhhdC5zYW1wbGUpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvcGVydGllc01lbnUoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnByb3BlcnRpZXNNZW51KSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgLy8g5a+55bGe5oCn6I+c5Y2V5YGa57uE5Lu255qE5YiG57G75ZKM56aB55So5aSE55CGXG4gICAgICAgIGNvbnN0IG5ld01lbnUgPSBzb3J0UHJvcGVydHlNZW51KHRoYXQucHJvcGVydGllc01lbnUsIHRoYXQucHJvcGVydGllcyA/PyB7fSk7XG4gICAgICAgIHJldHVybiBhbmltYXRpb25FZGl0b3IuY2FsY0NyZWF0ZVByb3BNZW51KG5ld01lbnUpO1xuICAgIH0sXG5cbiAgICBzZWxlY3RQcm9wZXJ0eVJlbmRlckR1bXAoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdFByb3BlcnR5IHx8ICF0aGF0LnNlbGVjdFByb3BlcnR5LmR1bXApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoYXQuc2VsZWN0UHJvcGVydHkuZHVtcCkpO1xuICAgICAgICBpZiAoZGF0YS5leHRlbmRzICYmIGRhdGEuZXh0ZW5kcy5pbmNsdWRlcygnY2MuQXNzZXQnKSkge1xuICAgICAgICAgICAgaWYgKGRhdGEudHlwZSAhPT0gZGF0YS5leHRlbmRzWzBdICYmICFkYXRhLmV4dGVuZHNbMF0uc3RhcnRzV2l0aCgnY2MuJykpIHtcbiAgICAgICAgICAgICAgICAvLyBIQUNLIOebruWJjemDqOWIhuaVsOaNruW6j+WIl+WMluWQjiB0eXBlIOS4jeaYryBjYy5YWFgg6L+Z57G75qCH5YeG55qE5p2Q6LSo6LWE5rqQ57G75Z6LXG4gICAgICAgICAgICAgICAgZGF0YS50eXBlID0gZGF0YS5leHRlbmRzWzBdO1xuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0UHJvcGVydHkuZHVtcC50eXBlID0gZGF0YS5leHRlbmRzWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGRhdGEucmVhZG9ubHkgPSB0aGF0LmNsaXBDb25maWcgJiYgdGhhdC5jbGlwQ29uZmlnLmlzTG9jayB8fCB0aGF0LnNlbGVjdFByb3BlcnR5Lm1pc3Npbmc7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICB9LFxuXG4gICAgcHJlc2V0QXJyKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdGhhdC5zZWFyY2hQcmVzZXROYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdEJlemllci52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmYXVsdEJlemllci52YWx1ZS5maWx0ZXIoKGl0ZW0pID0+IG5ldyBSZWdFeHAodGhhdC5zZWFyY2hQcmVzZXROYW1lLCAnaScpLnRlc3QoaXRlbS5uYW1lKSk7XG4gICAgfSxcblxuICAgIC8vIOaYr+WQpumUgeWumuS4jeWFgeiuuOW/q+aNt+mUruetiee8lui+keWFs+mUruW4p+aTjeS9nFxuICAgIGxvY2soKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oIXRoYXQuY2xpcENvbmZpZyB8fCB0aGF0LmNsaXBDb25maWcuaXNMb2NrIHx8IHRoYXQubWFza1BhbmVsIHx8ICF0aGF0LmFuaW1hdGlvbk1vZGUpO1xuICAgIH0sXG5cbiAgICBzZWxlY3RQcm9wRGF0YSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICF0aGF0LnNlbGVjdFByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHByb3AsIG5vZGVQYXRoIH0gPSB0aGF0LnNlbGVjdFByb3BlcnR5O1xuICAgICAgICByZXR1cm4gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW25vZGVQYXRoXSAmJiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbbm9kZVBhdGhdW3Byb3BdO1xuICAgIH0sXG5cbiAgICAvLyDorqHnrpflvZPliY3pgInkuK3oioLngrkgcGF0aFxuICAgIGNvbXB1dGVTZWxlY3RQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnVwZGF0ZVNlbGVjdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5zZWxlY3RQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhhdC5zZWxlY3RQYXRoO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0ZWRJZCAmJiB0aGF0Lm5vZGVEdW1wKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCEudXVpZDJwYXRoW3RoYXQuc2VsZWN0ZWRJZF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy8g6K6h566X5b2T5YmNIHNhbXBsZVxuICAgIHNhbXBsZSgpIHtcbiAgICAgICAgbGV0IHNhbXBsZSA9IDYwO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHRoYXQuY2xpcENvbmZpZyAmJiAoc2FtcGxlID0gdGhhdC5jbGlwQ29uZmlnLnNhbXBsZSk7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVTYW1wbGUoc2FtcGxlKTtcbiAgICAgICAgcmV0dXJuIHNhbXBsZTtcbiAgICB9LFxuXG4gICAgLy8g6K6h566X5b2T5YmN5pyA5ZCO5LiA5bin5LiO5L2N572u5pWw5o2uXG4gICAgbGFzdEZyYW1lSW5mbygpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBsZXQgZnJhbWUgPSAwO1xuICAgICAgICBpZiAodGhhdC5jbGlwQ29uZmlnICYmIHRoYXQuY2xpcENvbmZpZy5kdXJhdGlvbikge1xuICAgICAgICAgICAgZnJhbWUgPSB0aW1lVG9GcmFtZSh0aGF0LmNsaXBDb25maWcuZHVyYXRpb24sIHRoYXQuc2FtcGxlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB4ID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhmcmFtZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcmFtZSxcbiAgICAgICAgICAgIHgsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHByb3BlcnR5SGVpZ2h0KCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdGhhdC5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzID0gMDtcbiAgICAgICAgT2JqZWN0LmtleXModGhhdC5wcm9wZXJ0aWVzKS5mb3JFYWNoKChwcm9wOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhhdC5wcm9wZXJ0aWVzIVtwcm9wXS5oaWRkZW4pIHtcbiAgICAgICAgICAgICAgICByZXMgKz0gYW5pbWF0aW9uRWRpdG9yLkxJTkVfSEVJR0hUO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgc3RpY2tJbmZvKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICF0aGF0LnByb3BlcnRpZXMgfHxcbiAgICAgICAgICAgICF0aGF0LnNlbGVjdEtleUluZm8gfHxcbiAgICAgICAgICAgICF0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzIHx8XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzLmxlbmd0aCA8IDIgfHxcbiAgICAgICAgICAgICF0aGF0LnVwZGF0ZVNlbGVjdEtleSB8fFxuICAgICAgICAgICAgIXRoYXQudXBkYXRlUG9zaXRpb24gfHxcbiAgICAgICAgICAgICF0aGF0LnByb3BlcnR5U2Nyb2xsSW5mb1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5oYXNTaG93U3RpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeExpc3Q6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IHlMaXN0OiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBjb25zdCBmcmFtZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMuZm9yRWFjaCgoaXRlbTogSUtleUZyYW1lLCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGF0LmNvbXB1dGVTZWxlY3RQYXRoICYmXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvIS5rZXlGcmFtZXNbaV0gJiZcbiAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8hLmtleUZyYW1lc1tpXS5ub2RlUGF0aCAhPT0gdGhhdC5jb21wdXRlU2VsZWN0UGF0aFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeExpc3QucHVzaChpdGVtLnggfHwgMCk7XG4gICAgICAgICAgICB0aGF0LnByb3BlcnRpZXMhW2l0ZW0ucHJvcF0gJiYgeUxpc3QucHVzaCh0aGF0LnByb3BlcnRpZXMhW2l0ZW0ucHJvcF0udG9wKTtcbiAgICAgICAgICAgIGZyYW1lcy5wdXNoKGl0ZW0uZnJhbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgZnJhbWVzLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby5sZWZ0RnJhbWUgPSBmcmFtZXNbMF07XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zdGlja0luZm8ucmlnaHRGcmFtZSA9IGZyYW1lc1tmcmFtZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgeExpc3Quc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgICAgICB5TGlzdC5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG5cbiAgICAgICAgLy8g6K6h566X57uT5p6c5Li65Y+q5pyJ5ZCM5Liq5L2N572u55qE5YWz6ZSu5binXG4gICAgICAgIGlmICh4TGlzdFt4TGlzdC5sZW5ndGggLSAxXSA9PT0geExpc3RbMF0pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5oYXNTaG93U3RpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zdGlja0luZm8ud2lkdGggPSB4TGlzdFt4TGlzdC5sZW5ndGggLSAxXSAtIHhMaXN0WzBdICsgMTg7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zdGlja0luZm8uaGVpZ2h0ID0geUxpc3RbeUxpc3QubGVuZ3RoIC0gMV0gLSB5TGlzdFswXSArIGFuaW1hdGlvbkVkaXRvci5MSU5FX0hFSUdIVDtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby5sZWZ0ID0geExpc3RbMF0gKyBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCAtIDEwO1xuICAgICAgICBhbmltYXRpb25FZGl0b3Iuc3RpY2tJbmZvLnRvcCA9IHlMaXN0WzBdIC0gdGhhdC5wcm9wZXJ0eVNjcm9sbEluZm8udG9wO1xuICAgICAgICBhbmltYXRpb25FZGl0b3IuaGFzU2hvd1N0aWNrID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mbykpO1xuICAgIH0sXG5cbiAgICBjdXJ2ZURhdGEoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdFByb3BlcnR5IHx8ICF0aGF0LnNob3dBbmltQ3VydmUgfHwgIXRoYXQucHJvcGVydGllcykge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlcGFpbnRDdXJ2ZShudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGVQcm9wRGF0YXMgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcD8ucGF0aHNEdW1wW3RoYXQuc2VsZWN0UHJvcGVydHkubm9kZVBhdGhdO1xuICAgICAgICBpZiAoIW5vZGVQcm9wRGF0YXMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb3BEYXRhID0gbm9kZVByb3BEYXRhc1t0aGF0LnNlbGVjdFByb3BlcnR5LnByb3BdO1xuICAgICAgICBpZiAoIXByb3BEYXRhIHx8ICFwcm9wRGF0YS5pc0N1cnZlU3VwcG9ydCB8fCAhcHJvcERhdGEudHlwZSB8fCAhdGhhdC5wcm9wZXJ0aWVzIVt0aGF0LnNlbGVjdFByb3BlcnR5LnByb3BdKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IucmVwYWludEN1cnZlKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3BEYXRhLnR5cGUgJiYgYW5pbWF0aW9uRWRpdG9yLmN1cnZlRGlzYWJsZWRDQ3R5cGVzLmluY2x1ZGVzKHByb3BEYXRhLnR5cGUhLnZhbHVlKSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlcGFpbnRDdXJ2ZShudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlOiBJQ3VydmVWYWx1ZSA9IHtcbiAgICAgICAgICAgIGN1cnZlSW5mb3M6IHt9LFxuICAgICAgICAgICAgd3JhcE1vZGU6IHRoYXQuY2xpcENvbmZpZyEud3JhcE1vZGUsXG4gICAgICAgICAgICBkdXJhdGlvbjogdGhhdC5jbGlwQ29uZmlnIS5kdXJhdGlvbiAqIHRoYXQuY2xpcENvbmZpZyEuc2FtcGxlLFxuICAgICAgICB9O1xuICAgICAgICBsZXQgaGFzVXNlckVhc2luZ01ldGhvZCA9IGZhbHNlO1xuICAgICAgICBpZiAocHJvcERhdGEucGFydEtleXMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHByb3BEYXRhLnBhcnRLZXlzKSB7XG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2gg5YaF6YOo5pyJ5byC5q2l6aOO6Zmp77yMbm9kZVByb3BEYXRhcyDlhYjlj5blh7rmnaXlho3kvb/nlKhcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJQcm9wRGF0YSA9IG5vZGVQcm9wRGF0YXNba2V5XTtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jdXJ2ZUluZm9zW2tleV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGtleXMg5LiN6IO95Li6IG51bGxbXVxuICAgICAgICAgICAgICAgICAgICBrZXlzOiBzdWJQcm9wRGF0YS5rZXlGcmFtZXMubWFwKChpdGVtOiBJUmF3S2V5RnJhbWUpID0+IGl0ZW0uY3VydmUhKS5maWx0ZXIoKGN1cnZlKSA9PiAhIWN1cnZlKSxcbiAgICAgICAgICAgICAgICAgICAgcHJlV3JhcE1vZGU6IHN1YlByb3BEYXRhLnByZUV4dHJhcCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdFdyYXBNb2RlOiBzdWJQcm9wRGF0YS5wb3N0RXh0cmFwLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhhdC5wcm9wZXJ0aWVzIVtrZXldLmNvbG9yLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaGFzVXNlckVhc2luZ01ldGhvZCA9ICEhKGhhc1VzZXJFYXNpbmdNZXRob2QgfHwgdmFsdWUuY3VydmVJbmZvc1trZXldLmtleXMuZmluZCgoaXRlbSkgPT4gaXRlbS5lYXNpbmdNZXRob2QpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWKqOeUu+aVsOaNruWPr+iDveWtmOWcqOaXoOept+Wkp+aVsOaNru+8jOS4jeiDveebtOaOpeW6j+WIl+WMluS8oOmAkue7mSBjdXJ2ZS1lZGl0b3JcbiAgICAgICAgICAgIHZhbHVlLmN1cnZlSW5mb3MgPSB7XG4gICAgICAgICAgICAgICAgW3RoYXQuc2VsZWN0UHJvcGVydHkucHJvcF06IHtcbiAgICAgICAgICAgICAgICAgICAga2V5czogcHJvcERhdGEua2V5RnJhbWVzLm1hcCgoaXRlbTogSVJhd0tleUZyYW1lKSA9PiBpdGVtLmN1cnZlISkuZmlsdGVyKChjdXJ2ZSkgPT4gISFjdXJ2ZSksXG4gICAgICAgICAgICAgICAgICAgIHByZVdyYXBNb2RlOiBwcm9wRGF0YS5wcmVFeHRyYXAsXG4gICAgICAgICAgICAgICAgICAgIHBvc3RXcmFwTW9kZTogcHJvcERhdGEucG9zdEV4dHJhcCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IHRoYXQucHJvcGVydGllcyFbdGhhdC5zZWxlY3RQcm9wZXJ0eS5wcm9wXS5jb2xvcixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhc1VzZXJFYXNpbmdNZXRob2QgPSAhIShcbiAgICAgICAgICAgICAgICBoYXNVc2VyRWFzaW5nTWV0aG9kIHx8IHZhbHVlLmN1cnZlSW5mb3NbdGhhdC5zZWxlY3RQcm9wZXJ0eS5wcm9wXS5rZXlzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZWFzaW5nTWV0aG9kKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYW5pbWF0aW9uRWRpdG9yLmNoZWNrQ3VydmVEYXRhRGlydHkodmFsdWUpKSB7XG4gICAgICAgICAgICAvLyDliKnnlKggdnVlIOiuoeeul+WxnuaAp+acuuWItuadpeacgOWkp+WMlueahOWHj+Wwj+S4jeW/heimgeeahOmHjeaWsOe7mOWItu+8jOWQjOaXtumcgOimgeiHquihjOWGjeWBmuS4gOasoSBkaXJ0eSDliKTmlq1cbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZXBhaW50Q3VydmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi52YWx1ZSxcbiAgICAgICAgICAgIGhhc1VzZXJFYXNpbmdNZXRob2QsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGN1cnZlU3R5bGUoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKHRoYXQuc2hvd0FuaW1DdXJ2ZSAmJiB0aGF0LmNvbXB1dGVTZWxlY3RQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHN0aWNrQm94U3R5bGUoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnN0aWNrSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiB0aGF0LnN0aWNrSW5mby53aWR0aCArICdweCcsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoYXQuc3RpY2tJbmZvLmhlaWdodCArICdweCcsXG4gICAgICAgICAgICB0b3A6IHRoYXQuc3RpY2tJbmZvLnRvcCArICdweCcsXG4gICAgICAgICAgICBsZWZ0OiB0aGF0LnN0aWNrSW5mby5sZWZ0ICsgJ3B4JyxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY3VycmVudEtleUVtcHR5SW5mbygpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICF0aGF0LnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gICAgICAgIGNvbnN0IHJhd1Byb3BlcnR5RGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt0aGF0LmNvbXB1dGVTZWxlY3RQYXRoXTtcbiAgICAgICAgaWYgKCFyYXdQcm9wZXJ0eURhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmtleXModGhhdC5wcm9wZXJ0aWVzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgIGlmICghcmF3UHJvcGVydHlEYXRhW2tleV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBrZXlGcmFtZXMgPSByYXdQcm9wZXJ0eURhdGFba2V5XS5rZXlGcmFtZXM7XG4gICAgICAgICAgICByZXNba2V5XSA9ICEoa2V5RnJhbWVzLmZpbmQoKGtleUluZm8pID0+IGtleUluZm8uZnJhbWUgPT09IHRoYXQuY3VycmVudEZyYW1lKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBub2RlVGl0bGUoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgLy8gaWYgKHRoYXQuc2hvd0FuaW1FbWJlZGRlZFBsYXllciAmJiAhdGhhdC5maWx0ZXJJbnZhbGlkKSB7XG4gICAgICAgIC8vICAgICByZXR1cm4gJ+WPr+mAmuefpeiKgueCueWIl+ihqCc7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gaWYgKHRoYXQuc2hvd0FuaW1FbWJlZGRlZFBsYXllciAmJiB0aGF0LmZpbHRlckludmFsaWQpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiAn6YCa55+l6IqC54K55YiX6KGoJztcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAodGhhdC5maWx0ZXJJbnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2kxOG46YW5pbWF0b3Iubm9kZS5ub2RlSGFzQW5pbWF0aW9uJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ2kxOG46YW5pbWF0b3Iubm9kZS50aXRsZSc7XG4gICAgfSxcbn07XG5leHBvcnQgeyB2Q29tcHV0ZWQgYXMgY29tcHV0ZWQgfTtcblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIGFzeW5jIHNlbGVjdGVkSWQobmV3VmFsdWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZykge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGNvbnN0IG5vZGVQYXRoID0gdGhhdC5jb21wdXRlU2VsZWN0UGF0aDtcbiAgICAgICAgLy8gMS4g5riF55CG5LiN5Zyo5paw6YCJ5Lit6IqC54K55LiK55qE6YCJ5Lit5YWz6ZSu5bin5L+h5oGvXG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHRoYXQuc2VsZWN0S2V5SW5mbyEua2V5RnJhbWVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubm9kZVBhdGggIT09IG5vZGVQYXRoKTtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghbmV3VmFsdWUgJiYgYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXApIHtcbiAgICAgICAgICAgIC8vIOaWsOWAvOS4uuepuuaXtu+8jOWPr+iDveaYr+eUseS6jumAieS4reeahOiKgueCueaYr+S4ouWkseiKgueCueWvvOiHtOeahFxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAudXVpZDJwYXRoW29sZFZhbHVlXTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IG5vZGVQYXRoICYmIG5vZGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoYXQudXBkYXRlU2VsZWN0Tm9kZSA9IC10aGF0LnVwZGF0ZVNlbGVjdE5vZGU7XG4gICAgICAgIGF3YWl0IGFuaW1hdGlvbkVkaXRvci51cGRhdGVTZWxlY3RlZElkKCk7XG4gICAgICAgIC8vIDIuIOabtOaWsOW9k+WJjemAieS4reWxnuaAp+i9qOmBk+S/oeaBr1xuICAgICAgICBpZiAodGhhdC5wcm9wZXJ0aWVzICYmICgodGhhdC5zZWxlY3RQcm9wZXJ0eSAmJiB0aGF0LnNlbGVjdFByb3BlcnR5Lm5vZGVQYXRoICE9PSBub2RlUGF0aCkgfHwgIXRoYXQuc2VsZWN0UHJvcGVydHkpKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wID0gT2JqZWN0LmtleXModGhhdC5wcm9wZXJ0aWVzKVswXTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVTZWxlY3RQcm9wZXJ0eSh7XG4gICAgICAgICAgICAgICAgbm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgICAgICAgICBtaXNzaW5nOiB0aGF0LnByb3BlcnRpZXNbcHJvcF0ubWlzc2luZyxcbiAgICAgICAgICAgICAgICBjbGlwVXVpZDogYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnV1aWQsXG4gICAgICAgICAgICAgICAgaXNDdXJ2ZVN1cHBvcnQ6IHRoYXQucHJvcGVydGllc1twcm9wXS5pc0N1cnZlU3VwcG9ydCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RQcm9wZXJ0eSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2VsZWN0S2V5SW5mbygpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuc2hvd0FuaW1DdXJ2ZSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnNlbGVjdEtleVVwZGF0ZUZsYWcgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYW5pbWF0aW9uRWRpdG9yLnNlbGVjdEtleVVwZGF0ZUZsYWcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlQ3VydmVTZWxlY3RlS2V5cygpO1xuICAgIH0sXG5cbiAgICAvLyDliIfmjaLliqjnlLvmoLnoioLngrnnirbmgIHph43nva5cbiAgICByb290KCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHRoYXQuZmlsdGVySW52YWxpZCA9IGZhbHNlO1xuICAgICAgICB0aGF0LmZpbHRlck5hbWUgPSAnJztcbiAgICAgICAgdGhhdC5ub2Rlc0hlaWdodCA9IDA7XG4gICAgfSxcblxuICAgIGFzeW5jIGN1cnJlbnRDbGlwKG5ld1V1aWQ6IHN0cmluZywgb2xkVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgLy8g5YiH5o2iIGNsaXAg6KaB5riF56m65aSN5Yi255qE5YWz6ZSu5bin5L+h5oGvXG4gICAgICAgIC8vIGFuaW1hdGlvbkN0cmwuY29weUtleUluZm8gPSBudWxsO1xuICAgICAgICBpZiAobmV3VXVpZCA9PT0gb2xkVXVpZCB8fCAhbmV3VXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2hhbmdlU3VjY2VzcyA9IGF3YWl0IElzZXRFZGl0Q2xpcChuZXdVdWlkKTtcbiAgICAgICAgaWYgKCFjaGFuZ2VTdWNjZXNzKSB7XG4gICAgICAgICAgICBjaGFuZ2VGYWlsZWRDbGlwcy5wdXNoKG5ld1V1aWQpO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBTZXQgZWRpdCBjbGlwIGZhaWxlZCEke25ld1V1aWR9YCk7XG4gICAgICAgICAgICBpZiAoY2hhbmdlRmFpbGVkQ2xpcHMuaW5jbHVkZXMob2xkVXVpZCkpIHtcbiAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRDbGlwID0gJyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQuY3VycmVudENsaXAgPSBvbGRVdWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8gPSBudWxsO1xuICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8gPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IHRpbWUgPSBhd2FpdCBJcXVlcnlQbGF5aW5nQ2xpcFRpbWUodGhhdC5jdXJyZW50Q2xpcCk7XG4gICAgICAgIGNvbnN0IGZyYW1lID0gdGltZVRvRnJhbWUodGltZSwgdGhhdC5zYW1wbGUpO1xuICAgICAgICBhbmltYXRpb25FZGl0b3Iuc2V0Q3VycmVudEZyYW1lKGZyYW1lKTtcbiAgICB9LFxuXG4gICAgbGF5b3V0OiB7XG4gICAgICAgIGRlZXA6IHRydWUsXG4gICAgICAgIGhhbmRsZXIoKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICAgICAgLy8gcmVzaXplIOWGhemDqOiuv+mXruS6hiBkb20g55qE5a696auY5pWw5o2u77yM6ZyA6KaB562J5b6FIHZ1ZSDlsIbmlbDmja7nv7vliLAgZG9tIOWFg+e0oOS4iuWQjuaJjeiDveiOt+WPluWIsOato+ehruaVsOaNrlxuICAgICAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZXNpemUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBjdXJyZW50RnJhbWUoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5jYWxjU2VsZWN0UHJvcGVydHkobnVsbCwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOagueaNruahhumAieS/oeaBr+iuoeeul+mAieS4reeahOWFs+mUruW4p+S/oeaBr1xuICAgICAqL1xuICAgIGJveERhdGEoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LmJveERhdGEgfHwgIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBvcmlnaW4sIGgsIHcsIHR5cGUgfSA9IHRoYXQuYm94RGF0YSE7XG4gICAgICAgIGlmICh0eXBlID09PSAncHJvcGVydHknICYmICF0aGF0LnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByYXdLZXlmcmFtZXMgPSB0aGF0LmJveEluZm8/LnJhd0tleUZyYW1lcztcbiAgICAgICAgY29uc3Qga2V5RnJhbWVzOiBJS2V5RnJhbWVEYXRhW10gPSByYXdLZXlmcmFtZXMgfHwgW107XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHR5cGUgPT09ICdub2RlJyA/IHRoYXQubm9kZVNjcm9sbEluZm8hLnRvcCA6IHRoYXQucHJvcGVydHlTY3JvbGxJbmZvIS50b3A7XG4gICAgICAgIGZ1bmN0aW9uIHB1c2hUb0tleUZyYW1lcyhrZXlJbmZvOiBJS2V5RnJhbWVEYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBrZXlGcmFtZXMuZmluZCgoa2V5KSA9PiBrZXkucmF3RnJhbWUgPT09IGtleUluZm8ucmF3RnJhbWUgJiYga2V5LnByb3AgPT09IGtleUluZm8ucHJvcCAmJiBrZXkubm9kZVBhdGggPT09IGtleS5ub2RlUGF0aCk7XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2V5RnJhbWVzLnB1c2goa2V5SW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHVzaEtleUZyYW1lOiAoa2V5SW5mbzogSUtleUZyYW1lRGF0YSkgPT4gdm9pZCA9IHJhd0tleWZyYW1lcyA/IHB1c2hUb0tleUZyYW1lcyA6IChrZXlJbmZvOiBJS2V5RnJhbWVEYXRhKSA9PiBrZXlGcmFtZXMucHVzaChrZXlJbmZvKTtcbiAgICAgICAgZnVuY3Rpb24gYWRkS2V5RnJhbWVzKHByb3BlcnRpZXM6IFJlY29yZDxzdHJpbmcsIElQcm9wRGF0YT4sIG5vZGU/OiBib29sZWFuKSB7XG4gICAgICAgICAgICBPYmplY3QudmFsdWVzKHByb3BlcnRpZXMpLmZvckVhY2goKHByb3BEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g6LaF5Ye66IyD5Zu06auY5bqm55qE5bGe5oCn6L2o6YGTXG4gICAgICAgICAgICAgICAgLy8g6L2o6YGTIHRvcCAtIOWFs+mUruW4pyBwb3NpdGlvblxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IHByb3BEYXRhLnRvcCArIGFuaW1hdGlvbkVkaXRvci5MSU5FX0hFSUdIVCAvIDIgKyBhbmltYXRpb25FZGl0b3IuS0VZX1NJWkVfUiAtIHNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUgJiYgKHRvcCA8IG9yaWdpbi55IHx8IHRvcCA+IG9yaWdpbi55ICsgaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9wRGF0YS5rZXlGcmFtZXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSBrZXkueCArIHRoYXQub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoeCA+IG9yaWdpbi54ICYmIHggPCBvcmlnaW4ueCArIHcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGtleS5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdGcmFtZToga2V5LmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiBwcm9wRGF0YS5ub2RlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBrZXkueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wOiBwcm9wRGF0YS5wcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hLZXlGcmFtZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ua2V5RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGNhbGNLZXlGcmFtZUtleShrZXlEYXRhKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ25vZGUnKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEucGF0aHNEdW1wKS5mb3JFYWNoKChwYXRoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSB0aGF0Lm5vZGVEdW1wIS5maW5kKChpdGVtKSA9PiBpdGVtLnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZUluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0b3AgPSBub2RlSW5mby50b3AgKyBhbmltYXRpb25FZGl0b3IuTElORV9IRUlHSFQgLyAyICsgYW5pbWF0aW9uRWRpdG9yLktFWV9TSVpFX1IgLSBzY3JvbGxUb3A7XG4gICAgICAgICAgICAgICAgaWYgKHRvcCA8IG9yaWdpbi55IHx8IHRvcCA+IG9yaWdpbi55ICsgaCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEucGF0aHNEdW1wW3BhdGhdO1xuICAgICAgICAgICAgICAgIGFkZEtleUZyYW1lcyhwcm9wZXJ0aWVzLCB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkS2V5RnJhbWVzKHRoYXQucHJvcGVydGllcyEpO1xuICAgICAgICB9XG4gICAgICAgIGtleUZyYW1lcy5zb3J0KChhLCBiKSA9PiBhLmZyYW1lIC0gYi5mcmFtZSk7XG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IHtcbiAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LmNvbXB1dGVTZWxlY3RQYXRoLFxuICAgICAgICAgICAga2V5RnJhbWVzLFxuICAgICAgICAgICAgbG9jYXRpb246ICdwcm9wJyxcbiAgICAgICAgICAgIHByb3A6IHRoYXQuc2VsZWN0UHJvcGVydHk/LnByb3AsXG4gICAgICAgIH07XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzOiBJQW5pVk1NZXRob2RzID0ge1xuICAgIG9uQ2xpcEN1cnZlUHJlc2V0KGN1cnZlRGF0YTogbnVtYmVyW10pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwuYXBwbHlCZXppZXJUb1NlbGVjdGVkQ3VydmVDbGlwKGN1cnZlRGF0YSk7XG4gICAgICAgIG11bHRpcGx5VHJhY2tXaXRoVGltZXIoJ2hpcHBvQW5pbWF0b3InLCB7XG4gICAgICAgICAgICAvLyDku47pooTorr7mm7Lnur/kuK3pgInmi6nmm7Lnur/lupTnlKjmrKHmlbBcbiAgICAgICAgICAgICdBMTAwMDAwJzogMSxcbiAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjemhueebrmlk77yMcHJvamVjdF9pZFxuICAgICAgICAgICAgcHJvamVjdF9pZDogRWRpdG9yLlByb2plY3QudXVpZCxcbiAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjee8lui+keeahOWKqOeUu+WJqui+kSBjbGlwX2lkXG4gICAgICAgICAgICBjbGlwX2lkOiB0aGF0LmN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgLy8g57yW6L6R5Zmo54mI5pysXG4gICAgICAgICAgICB2ZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0b2dnbGVFeHBhbmRMYXlvdXRDaGFuZ2UodGhpczogSUFuaVZNVGhpcywgdHlwZSkge1xuICAgICAgICB0aGlzLmV4cGFuZExheW91dFt0eXBlXSA9ICF0aGlzLmV4cGFuZExheW91dFt0eXBlXTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnNldENvbmZpZygnZXhwYW5kTGF5b3V0JywgdGhpcy5leHBhbmRMYXlvdXQpO1xuICAgICAgICAvLyByZXNpemUg5YaF6YOo6K6/6Zeu5LqGIGRvbSDnmoTlrr3pq5jmlbDmja7vvIzpnIDopoHnrYnlvoUgdnVlIOWwhuaVsOaNrue/u+WIsCBkb20g5YWD57Sg5LiK5ZCO5omN6IO96I635Y+W5Yiw5q2j56Gu5pWw5o2uXG4gICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZXNpemUoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNob3dTZWxlY3RlZEtleXModGhpczogSUFuaVZNVGhpcykge1xuICAgICAgICAvLyBUT0RPOiDkuLTml7bmlrnmoYjjgILlkI7nu63pnIDopoHkuIDkuKrmm7Tlpb3nmoTliIblj5HmlrnlvI/vvIzmiJbogIXnu4Tku7bnm7TmjqXnm5HlkKwga2V5Ym9hcmQg5LqL5Lu277yM6ICM5LiN5piv55Sx6aG25bGC5rS+5Y+RXG4gICAgICAgIHN3aXRjaCAodGhpcy5mb2N1c2VkQ3VydmUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2N1cnZlJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc2hvd0FuaW1DdXJ2ZSB8fCB0aGlzLiRyZWZzLmN1cnZlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLiRyZWZzLmN1cnZlLnpvb21Ub1NlbGVjdGVkS2V5cygpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYXV4Q3VydmUnOlxuICAgICAgICAgICAgICAgIHRoaXMuJHJlZnMuYXV4Q3VydmUuem9vbVRvU2VsZWN0ZWRLZXlzKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2hvd0FsbEtleXModGhpczogSUFuaVZNVGhpcykge1xuICAgICAgICBzd2l0Y2ggKHRoaXMuZm9jdXNlZEN1cnZlKSB7XG4gICAgICAgICAgICBjYXNlICdjdXJ2ZSc6XG4gICAgICAgICAgICAgICAgLy8g5pi+56S65omA5pyJ5YWz6ZSu5bin5Yiw5Y+v6KeG5Yy65Z+fXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnNob3dBbmltQ3VydmUgfHwgIXRoaXMuY2xpcENvbmZpZz8uZHVyYXRpb24gfHwgIXRoaXMuY3VydmVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy4kcmVmcy5jdXJ2ZS56b29tVG9GaXQoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2F1eEN1cnZlJzpcbiAgICAgICAgICAgICAgICB0aGlzLiRyZWZzLmF1eEN1cnZlLnpvb21Ub0ZpdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25VcGRhdGVFdmVudCh1dWlkOiBzdHJpbmcsIGZyYW1lOiBudW1iZXIsIGV2ZW50OiBJRXZlbnREdW1wW10pIHtcbiAgICAgICAgaWYgKGV2ZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8g5LqL5Lu25Ye95pWw5Li656m65pe25piv5LiA5Liq5Yig6Zmk5pON5L2c77yM6ZyA6KaB5YGa6YCJ5Lit5YWz6ZSu5bin55qE5Yig6Zmk5bel5L2cXG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmRlbGV0ZUV2ZW50KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgSUFwcGx5T3BlcmF0aW9uKEl1cGRhdGVFdmVudCh1dWlkLCBmcmFtZSwgZXZlbnQpKTtcbiAgICB9LFxuXG4gICAgLy8gdG9nZ2xlQW5pbUVtYmVkZGVkUGxheWVyKCkge1xuICAgIC8vICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgIC8vICAgICBpZiAoIXRoYXQuc2hvd0FuaW1FbWJlZGRlZFBsYXllcikge1xuICAgIC8vICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNoYW5nZVRvRW1iZWRkZWRQbGF5ZXJNb2RlKCk7XG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICBhbmltYXRpb25FZGl0b3IuY2hhbmdlVG9LZXlGcmFtZU1vZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0sXG5cbiAgICB0b2dnbGVJbnZhbGlkTm9kZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5maWx0ZXJJbnZhbGlkID0gIXRoYXQuZmlsdGVySW52YWxpZDtcbiAgICAgICAgLy8g5YiH5o2i5piv5ZCm6ZqQ6JeP5peg5pWI6IqC54K55pe277yM5Y676Zmk5Y6f5pys55qE5rua5Yqo5L+h5oGvXG4gICAgICAgIHRoYXQuJHJlZnMubm9kZXMuc2Nyb2xsVG9wID0gdGhhdC5ub2RlU2Nyb2xsSW5mbyEudG9wID0gMDtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICB9LFxuXG4gICAgb25GaWx0ZXIoZXZlbnQ6IGFueSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHRoYXQuZmlsdGVyTmFtZSA9PT0gZXZlbnQudGFyZ2V0LnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmRlYm91bmNlRmlsdGVyTm9kZSEoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY2FsY1NlbGVjdFByb3BlcnR5KHBhcmFtczogbnVsbCB8IElTZWxlY3RQcm9wZXJ0eSwgaXNVcGRhdGUgPSBmYWxzZSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoaXNVcGRhdGUgJiYgdGhhdC5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgcGFyYW1zID0gdGhhdC5zZWxlY3RQcm9wZXJ0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IElnZXRQcm9wVmFsdWVBdEZyYW1lKHRoYXQuY3VycmVudENsaXAsIHBhcmFtcy5ub2RlUGF0aCwgcGFyYW1zLnByb3AsIHRoYXQuY3VycmVudEZyYW1lKTtcbiAgICAgICAgdGhhdC5zZWxlY3RQcm9wZXJ0eSA9IE9iamVjdC5hc3NpZ24ocGFyYW1zLCB7XG4gICAgICAgICAgICBkdW1wLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcXVlcnlEdXJhdGlvblN0eWxlKGZyYW1lOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIWZyYW1lIHx8ICFncmlkQ3RybC5ncmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0ID0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSCgwKTtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkge1xuICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCB3aWR0aCA9IGdyaWRDdHJsLmdyaWQhLnZhbHVlVG9QaXhlbEgoZnJhbWUpIC0gc3RhcnQ7XG4gICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgIC8vIGR1cmF0aW9uIOW3suWcqOWxj+W5leS5i+WkllxuICAgICAgICAgICAgc3RhcnQgPSB3aWR0aDtcbiAgICAgICAgICAgIHdpZHRoID0gMDtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKCR7c3RhcnR9cHgpOyB3aWR0aDogJHt3aWR0aH1weGA7XG4gICAgfSxcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDmlbDmja7lpITnkIYgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvLyDorqHnrpflhbPplK7luKfkuI7lrp7pmYXlnZDmoIflgY/np7tcbiAgICBwb2ludGVyUG9zaXRpb24ob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKHRoYXQuY3VycmVudEZyYW1lKSArXG4gICAgICAgICAgICAob2Zmc2V0ID8/IGdyaWRDdHJsLmdyaWQ/LnhBeGlzT2Zmc2V0ID8/IDApIC1cbiAgICAgICAgICAgIGdyaWRDdHJsLnN0YXJ0T2Zmc2V0XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDkuovku7blpITnkIYgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICBvbk1vdXNlV2hlZWwoZXZlbnQ6IFdoZWVsRXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAvLyDmjInkuIsgc2hpZnQg5rua5Yqo77yM5YWB6K645qiq5ZCR56e75Yqo55S75biDXG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IubW92ZVRpbWVMaW5lKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nID8gZXZlbnQuZGVsdGFYIDogZXZlbnQuZGVsdGFZKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnMoZXZlbnQuZGVsdGFYKSA+IE1hdGguYWJzKGV2ZW50LmRlbHRhWSkpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5tb3ZlVGltZUxpbmUoZXZlbnQuZGVsdGFZKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5zY2FsZVRpbWVMaW5lQXQoLWV2ZW50LmRlbHRhWSwgTWF0aC5yb3VuZChldmVudC5vZmZzZXRYKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog54K55Ye7XG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZURvd24odGhpczogSUFuaVZNVGhpcywgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5tb3ZlTm9kZVBhdGggPSAnJztcbiAgICAgICAgdGhhdC5ib3hJbmZvID0gbnVsbDtcbiAgICAgICAgdGhhdC5ib3hTdHlsZSA9IG51bGw7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgbmFtZSA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgICAgICAgaWYgKG5hbWUgIT09ICdldmVudCcpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gJ2tleScgJiYgbmFtZSAhPT0gJ3N0aWNrJyAmJiAhY2hlY2tDdHJsT3JDb21tYW5kKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gJ3JhbmdlJyAmJiBuYW1lICE9PSAnc3RpY2snICYmICFjaGVja0N0cmxPckNvbW1hbmQoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IG51bGw7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKG5hbWUgIT09ICd0aW1lLXBvaW50ZXInKSB7XG4gICAgICAgIC8vICAgICB0aGF0LnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgLy8gfVxuICAgICAgICBsZXQgYm94SW5mbzogYW55ID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiBjaGVja01vdXNlRG93bk5hbWUoKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQub2Zmc2V0WSA+IHRoYXQuJHJlZnNbJ3Byb3BlcnR5LWNvbnRlbnQnXS5vZmZzZXRUb3ApIHtcbiAgICAgICAgICAgICAgICAvLyDlnKggcHJvcGVydHkg5Yy65Z+f6YCJ5LitXG4gICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdwcm9wZXJ0eSc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50Lm9mZnNldFkgPiB0aGF0LiRyZWZzWydub2RlLWNvbnRlbnQnXS5vZmZzZXRUb3AgJiYgZXZlbnQub2Zmc2V0WSA8IHRoYXQuJHJlZnNbJ3Byb3BlcnR5LWNvbnRlbnQnXS5vZmZzZXRUb3ApIHtcbiAgICAgICAgICAgICAgICAvLyDlnKjoioLngrnljLrln5/ngrnlh7tcbiAgICAgICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ25vZGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g54K55Ye76aG26YOo56e75Yqo5b2T5YmN5YWz6ZSu5binXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAndGltZS1wb2ludGVyJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAndGltZS1wb2ludGVyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwb2ludGVyJzpcbiAgICAgICAgICAgICAgICAvLyDkuI3lhYHorrjlt6bplK7kuK3plK7np7vliqjlsI/nuqLnur9cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSBFdmVudEJ1dHRvbi5DRU5URVIpIHtcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBjYXNlICdub2RlJzpcbiAgICAgICAgICAgIC8vIGNhc2UgJ3Byb3BlcnR5JzpcbiAgICAgICAgICAgIC8vICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAwKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGJveEluZm8gPSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0eXBlOiBuYW1lLFxuICAgICAgICAgICAgLy8gICAgICAgICB9O1xuICAgICAgICAgICAgLy8gICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gbmFtZTtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ2dyaWQnO1xuICAgICAgICAgICAgLy8gICAgICAgICBGbGFncy5zdGFydERyYWdHcmlkSW5mbyA9IHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHN0YXJ0OiBldmVudC54LFxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgbGFzdFN0YXJ0OiBldmVudC54LFxuICAgICAgICAgICAgLy8gICAgICAgICB9O1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RpY2snOlxuICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnc3RpY2snO1xuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyEuc3RhcnRYID0gZXZlbnQueDtcbiAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8hLm9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvIS5vZmZzZXRGcmFtZSA9IDA7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uQ0VOVEVSIHx8IGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3Muc3RhcnREcmFnR3JpZEluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogZXZlbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTdGFydDogZXZlbnQueCxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrTW91c2VEb3duTmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEZsYWdzLm1vdXNlRG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDpvKDmoIfkuK3plK7miJblj7PplK7mjInkuIvvvIzmoIfor4blj6/ku6XlvIDlp4vmi5bmi73ml7bpl7TovbRcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdncmlkJztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIC8vIOmSiOWvuSBib3gg55qE5pi+56S65pWI5p6cXG4gICAgICAgIGlmICghYm94SW5mbyAmJiAhRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAgICAgY2hlY2tNb3VzZURvd25OYW1lKCk7XG4gICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lICYmIChib3hJbmZvID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IEZsYWdzLm1vdXNlRG93bk5hbWUsXG4gICAgICAgICAgICAgICAgY3RybEtleTogY2hlY2tDdHJsT3JDb21tYW5kKGV2ZW50KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFsnbm9kZScsICdwcm9wZXJ0eSddLmluY2x1ZGVzKEZsYWdzLm1vdXNlRG93bk5hbWUpICYmIGJveEluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uUmVzdWx0ID0gZ3JpZEN0cmwucGFnZVRvQ3RybChldmVudC54LCBldmVudC55KTtcbiAgICAgICAgICAgIGJveEluZm8uc3RhcnRYID0gcG9zaXRpb25SZXN1bHQueDtcbiAgICAgICAgICAgIGJveEluZm8uc3RhcnRZID0gcG9zaXRpb25SZXN1bHQueTtcbiAgICAgICAgICAgIGJveEluZm8uY3RybEtleSA9IGNoZWNrQ3RybE9yQ29tbWFuZChldmVudCk7XG4gICAgICAgICAgICBpZiAoYm94SW5mby5jdHJsS2V5ICYmIHRoYXQuc2VsZWN0S2V5SW5mbyAmJiB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgYm94SW5mby5yYXdLZXlGcmFtZXMgPSB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhhdC5ib3hJbmZvID0gYm94SW5mbztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblByb3BlcnR5TGlzdENvbnRleHRNb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdwcm9wZXJ0eS1saXN0LWNvbnRlbnQnO1xuICAgIH0sXG5cbiAgICBvblNjcm9sbChldmVudDogYW55LCB0eXBlOiAnbm9kZScgfCAncHJvcGVydHknIHwgJ2F1eEN1cnZlJykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoRmxhZ3Mub25TY3JvbGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzY3JvbGxJbmZvID0gdHlwZSA9PT0gJ25vZGUnID8gdGhhdC5ub2RlU2Nyb2xsSW5mbyEgOiB0aGF0LnByb3BlcnR5U2Nyb2xsSW5mbyE7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IGV2ZW50LnRhcmdldC5zY3JvbGxUb3A7XG4gICAgICAgIGlmIChzY3JvbGxUb3AgPT09IHNjcm9sbEluZm8udG9wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgRmxhZ3MubGFzdFNjcm9sbFRvcHMuc3BsaWNlKDAsIDAsIHNjcm9sbFRvcCk7XG4gICAgICAgIEZsYWdzLmxhc3RTY3JvbGxUb3BzLmxlbmd0aCA9IDM7XG4gICAgICAgIGlmIChGbGFncy5sYXN0U2Nyb2xsVG9wc1swXSA9PT0gRmxhZ3MubGFzdFNjcm9sbFRvcHNbMl0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoYXQuc2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICBGbGFncy5vblNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGF0LnNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNjcm9sbEluZm8udG9wID0gc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgIC8vIFRPRE8g55CG6K665LiK5LiN6ZyA6KaB6YeN5paw6K6h566X6IqC54K55pWw5o2uXG4gICAgICAgICAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLm5vZGVzRHVtcD8ubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5jYWxjTm9kZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZUtleUZyYW1lKys7XG4gICAgICAgICAgICAgICAgdGhhdC5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBGbGFncy5vblNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgb25Db25maXJtKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGlmIChuYW1lID09PSAnc2FtcGxlJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZVNhbXBsZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uQ3RybC51cGRhdGVDb25maWcobmFtZSwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICBvblN0YXJ0UmVzaXplKGV2ZW50OiBNb3VzZUV2ZW50LCB0eXBlOiAnbGVmdCcgfCAndG9wJyB8ICdjZW50ZXInKSB7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblN0YXJ0UmVzaXplKGV2ZW50LCB0eXBlKTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlQW5pQ3VydmUoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHRoYXQuc2hvd0FuaW1DdXJ2ZSA9ICF0aGF0LnNob3dBbmltQ3VydmU7XG4gICAgICAgIC8vIOWcqCBjdXJ2ZSDlhYPntKDmmL7npLrlkI7lho3liJ3lp4vljJZcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmluaXRDdXJ2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgb25FZGl0RWFzaW5nTWV0aG9kQ3VydmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdm0uc2hvd0FuaW1DdXJ2ZSB8fCAhdm0uY3VydmVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZtLmN1cnZlRGF0YS5oYXNVc2VyRWFzaW5nTWV0aG9kKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLnRpcHMuYWJvcnRfZWFzaW5nX21ldGhvZCcpLCB7XG4gICAgICAgICAgICAgICAgYnV0dG9uczogW0VkaXRvci5JMThuLnQoJ2FuaW1hdG9yLmNhbmNlbCcpLCBFZGl0b3IuSTE4bi50KCdhbmltYXRvci5hYm9ydCcpXSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgIGNhbmNlbDogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHJlcy5yZXNwb25zZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vZGlmeUtleXM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgIC8vIFRPRE8g5Y+v5Lul5L+u5pS55Li656e76Zmk5b2T5YmN6YCJ5Lit5bGe5oCn6L2o6YGT55qE5omA5pyJ5YWz6ZSu5binIGVhc2luZ01ldGhvZCDnmoTmjqXlj6NcbiAgICAgICAgICAgIGNvbnN0IHsgbm9kZVBhdGggfSA9IHZtLnNlbGVjdFByb3BlcnR5ITtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBPYmplY3Qua2V5cyh2bS5jdXJ2ZURhdGEuY3VydmVJbmZvcykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJ2ZUluZm8gPSB2bS5jdXJ2ZURhdGEhLmN1cnZlSW5mb3NbcHJvcF07XG4gICAgICAgICAgICAgICAgY3VydmVJbmZvLmtleXMuZm9yRWFjaCgoa2V5SW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5SW5mby5lYXNpbmdNZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeUtleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbW9kaWZ5Q3VydmVPZktleSh2bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIHByb3AsIE1hdGgucm91bmQoa2V5SW5mby5wb2ludC54KSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmdNZXRob2Q6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5S2V5cyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25TaG93VXNlQmFrZWRBbmltYXRpb25XYXJuKHRoaXM6IElBbmlWTVRoaXMsIGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnVzZUJha2VkQW5pbWF0aW9uV2FyblRpcCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRvb2x0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29uc3QgdWlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VpLWxhYmVsJyk7XG4gICAgICAgIHVpTGFiZWwuc3R5bGUud2hpdGVTcGFjZSA9ICdub3JtYWwnO1xuICAgICAgICB1aUxhYmVsLnNldEF0dHJpYnV0ZSgndmFsdWUnLCAnaTE4bjphbmltYXRvci50aXBzLnVzZV9iYWtlZF9hbmltYXRpb24uZGV0YWlsZWRfd2Fybl9ieV9za2EnKTtcbiAgICAgICAgdG9vbHRpcC5hcHBlbmRDaGlsZCh1aUxhYmVsKTtcblxuICAgICAgICBjb25zdCB0aXBCdXR0b24gPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHRhcmdldFJlY3QgPSB0aXBCdXR0b24uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0gdG9vbHRpcC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICB0b29sdGlwLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICB3aWR0aDogNjA4cHg7XG4gICAgICAgICAgICBsZWZ0OiAke3RhcmdldFJlY3QubGVmdCAtIDIyfXB4O1xuICAgICAgICAgICAgdG9wOiAke3RhcmdldFJlY3QudG9wICsgdGFyZ2V0UmVjdC5oZWlnaHQgKyA0fXB4O1xuICAgICAgICAgICAgei1pbmRleDogMTAxO1xuICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjNDI0MjQyZmY7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjOGY4ZjhmZmY7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDAgMTJweCAwICMwMDAwMDBhNjtcbiAgICAgICAgICAgIHBhZGRpbmc6IDE2cHg7ICAgIFxuICAgICAgICBgKTtcblxuICAgICAgICBjb25zdCByZW1vdmVVc2VCYWtlZEFuaW1hdGlvbldhcm5UaXAgPSAoZXZlbnQ/OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbkdsb2JhbE1vdXNlZG93bik7XG4gICAgICAgICAgICB0b29sdGlwLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBvbk1vdXNlbGVhdmUpO1xuICAgICAgICAgICAgaWYgKHRoaXMudXNlQmFrZWRBbmltYXRpb25XYXJuVGlwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VCYWtlZEFuaW1hdGlvbldhcm5UaXAgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25Nb3VzZWxlYXZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvc2VkUGF0aCA9IGUuY29tcG9zZWRQYXRoKCk7XG4gICAgICAgICAgICBpZiAoY29tcG9zZWRQYXRoLmluY2x1ZGVzKHRpcEJ1dHRvbikpIHJldHVybjtcbiAgICAgICAgICAgIHJlbW92ZVVzZUJha2VkQW5pbWF0aW9uV2FyblRpcChlKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb25HbG9iYWxNb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcG9zZWRQYXRoID0gZS5jb21wb3NlZFBhdGgoKTtcblxuICAgICAgICAgICAgLy8gdG9vbHRpcCDlhoXngrnlh7vml7bkuI3pmpDol49cbiAgICAgICAgICAgIGlmIChjb21wb3NlZFBhdGguaW5jbHVkZXModG9vbHRpcCkpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVtb3ZlVXNlQmFrZWRBbmltYXRpb25XYXJuVGlwKGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRvb2x0aXAuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIG9uTW91c2VsZWF2ZSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uR2xvYmFsTW91c2Vkb3duKTtcblxuICAgICAgICB0aGlzLnVzZUJha2VkQW5pbWF0aW9uV2FyblRpcCA9IHRvb2x0aXA7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG9vbHRpcCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIh+aNouWFs+mUruW4p+aYvuekuuexu+Wei1xuICAgICAqL1xuICAgIGNoYW5nZUZyYW1lU2hvd1R5cGUoc2hvd1R5cGU6IElTaG93VHlwZSkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICAvLyDlvZPliY3ml7bpl7TkvJrmoLnmja4gc2hvd1R5cGUg6Ieq5Yqo6K6h566XXG4gICAgICAgIC8vIOiAjOW9k+WJjeaXtumXtOaYryB1aS1udW0taW5wdXQg54Sm54K55Zyo6L6T5YWl5qGG5YaF5pe2IHZhbHVlIOWAvOS/ruaUueaXoOaViO+8jOmcgOimgeW7tuWQjuS4gOW4p+S/ruaUuVxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgdGhhdC5zaG93VHlwZSA9IHNob3dUeXBlO1xuICAgICAgICAgICAgZ3JpZEN0cmwuZ3JpZCEubGFiZWxTaG93VHlwZSA9IHNob3dUeXBlO1xuICAgICAgICAgICAgZ3JpZEN0cmwuZ3JpZCEudXBkYXRlTGFiZWxzKCk7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iuc2V0Q29uZmlnKCdzaG93VHlwZScsIHNob3dUeXBlKTtcbiAgICAgICAgICAgIC8vIOWIh+aNouexu+Wei+WQjuS/ruaUueW9k+WJjeaYvuekuuaXtumXtFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25TY2FsZShzY2FsZTogbnVtYmVyKSB7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zY2FsZVRpbWVMaW5lV2l0aChzY2FsZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWFs+mUruW4p+abtOaUuVxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqL1xuICAgIG9uVGltZUNvbmZpcm0oZXZlbnQ6IGFueSkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICBjb25zdCB2YWx1ZTogc3RyaW5nID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICBpZiAoL14oWzAtOV0qKWY/JC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVDdXJyZW50RnJhbWUoTnVtYmVyKHZhbHVlKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2FtcGxlID0gYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnLnNhbXBsZTtcblxuICAgICAgICBjb25zdCB0aW1lVGVzdCA9IC9eKFswLTldKiktKFswLTldKikkLztcbiAgICAgICAgY29uc3QgdGVzdFZhbHVlID0gdmFsdWUubWF0Y2godGltZVRlc3QpO1xuICAgICAgICBpZiAodGVzdFZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBmcmFtZSA9IE51bWJlcih0ZXN0VmFsdWVbMV0pICogc2FtcGxlICsgTnVtYmVyKHRlc3RWYWx1ZVsyXSk7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlQ3VycmVudEZyYW1lKGZyYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRpbWVzVGVzdCA9IC9eKCg/PG0+XFxkKChcXC5cXGQqKT8pKW0pPyg/PHM+KFxcZCgoXFwuXFxkKik/KSkpcyQvO1xuICAgICAgICBpZiAodGltZXNUZXN0LnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCB7IGdyb3VwczogeyBtLCBzIH0gfSA9IHZhbHVlLm1hdGNoKHRpbWVzVGVzdCkgYXMgUmVnRXhwTWF0Y2hBcnJheTtcbiAgICAgICAgICAgIGxldCBmcmFtZSA9IHRpbWVUb0ZyYW1lKE51bWJlcihzKSwgc2FtcGxlKTtcbiAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgICAgZnJhbWUgKz0gTnVtYmVyKG0pICogc2FtcGxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUN1cnJlbnRGcmFtZShmcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaGFjayDnm7TmjqXkv67mlLkgZXZlbnQudGFyZ2V0IOeahCB2YWx1ZSDlgLzml6Dms5Xmm7TmlLlcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnBhdGhbMF0udmFsdWUgPSB0aGF0LmN1cnJlbnRUaW1lO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqIOe7hOS7tuS6i+S7tuebkeWQrCAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIC8vIOebkeWQrOW9k+WJjeWKqOeUu+e8lui+keWZqOS/ruaUueWFs+mUruW4p+aVsOaNrlxuICAgIG9uUHJvcENoYW5nZShldmVudDogYW55KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhBQ0sg55uu5YmNIHVpIOe7hOS7tuWPr+iDveWkmuWPkSBjaGFuZ2VcbiAgICAgICAgaWYgKGV2ZW50LmRldGFpbCAmJiBldmVudC5kZXRhaWwuaWdub3JlQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3JlYXRlS2V5SW5mbzogSUNyZWF0ZUtleUluZm8gPSB7XG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBldmVudC50YXJnZXQuZHVtcC52YWx1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wOiB0aGF0LnNlbGVjdFByb3BlcnR5LnByb3AsXG4gICAgICAgICAgICBub2RlUGF0aDogdGhhdC5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgIGZyYW1lOiB0aGF0LmN1cnJlbnRGcmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8g5LiN5Lya5ZCRIHVuZG8g57O757uf5o+Q5Lqk6K6w5b2VXG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2FsbEJ5RGVib3VuY2UoJ2NyZWF0ZUtleScsIGNyZWF0ZUtleUluZm8sIHsgcmVjb3JkVW5kbzogZmFsc2UgfSk7XG4gICAgfSxcbiAgICBvblByb3BDb25maXJtKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBsaWtlIHdoYXQgcHJvcCBjaGFuZ2UgZXZlbnQgZG9cbiAgICAgICAgaWYgKGV2ZW50LmRldGFpbCAmJiBldmVudC5kZXRhaWwuaWdub3JlQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdWlQcm9wID0gZXZlbnQudGFyZ2V0IGFzIGFueTtcbiAgICAgICAgY29uc3QgY3JlYXRlS2V5SW5mbzogSUNyZWF0ZUtleUluZm8gPSB7XG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB1aVByb3AuZHVtcC52YWx1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wOiB0aGF0LnNlbGVjdFByb3BlcnR5LnByb3AsXG4gICAgICAgICAgICBub2RlUGF0aDogdGhhdC5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgIGZyYW1lOiB0aGF0LmN1cnJlbnRGcmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8g5ZyoIHVuZG8g57O757uf5Lit55Sf5oiQ5LiA5p2h6K6w5b2VXG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2FsbEJ5RGVib3VuY2UoJ2NyZWF0ZUtleScsIGNyZWF0ZUtleUluZm8pO1xuICAgIH0sXG5cbiAgICBhc3luYyBvblNob3dFbWJlZGRlZFBsYXllck1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgbWVudSA9IGFuaW1hdGlvbkVkaXRvci5nZXRFbWJlZGRlZFBsYXllck1lbnUoKTtcbiAgICAgICAgRWRpdG9yLk1lbnUucG9wdXAoeyBtZW51IH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVFbmFibGVFbWJlZGRlZFBsYXllcigpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5lbmFibGVFbWJlZGRlZFBsYXllciA9IGF3YWl0IGFuaW1hdGlvbkVkaXRvci5nZXRDb25maWcoJ2VuYWJsZUVtYmVkZGVkUGxheWVyJykgPz8gdHJ1ZTtcblxuICAgICAgICBpZiAoIXRoYXQuZW5hYmxlRW1iZWRkZWRQbGF5ZXIpIHtcbiAgICAgICAgICAgIHRoYXQuZXhwYW5kTGF5b3V0LmVtYmVkZGVkUGxheWVyID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ2NvbnRyb2wtcHJldmlldyc6IENvbnRyb2xQb2ludGVyLFxuICAgICdjb250cm9sLXRyYWNrLXRyZWUnOiBDb250cm9sVHJhY2tUcmVlLFxuICAgICdwcmV2aWV3LXJvdyc6IFByZXZpZXdSb3csXG4gICAgJ3ByZXZpZXctcmFuZ2Utcm93JzogUHJldmlld1JhbmdlUm93LFxuICAgICd0b29sLWJhcic6IEFuaW1hdG9yVG9vbGJhcixcbiAgICAnbm9kZS10cmVlJzogTm9kZVRyZWUsXG4gICAgJ3Byb3BlcnR5LXRyZWUnOiBQcm9wZXJ0eVRyZWUsXG4gICAgJ3RpcHMtbWFzayc6IFRpcHNNYXNrLFxuICAgIGV2ZW50czogRXZlbnRzUm93LFxuICAgICdwcm9wZXJ0eS10b29scyc6IFByb3BlcnR5VG9vbHMsXG4gICAgJ2V2ZW50LWVkaXRvcic6IEV2ZW50RWRpdG9yLFxuICAgICdjdHJsLXN0aWNrJzogQ3RybFN0aWNrLFxuICAgICdhbmktbWFzayc6IEFuaU1hc2ssXG4gICAgJ0F1eGlsaWFyeUN1cnZlcyc6IEF1eGlsaWFyeUN1cnZlcyxcbiAgICBBdXhpbGlhcnlDdXJ2ZUZyYW1lczogQXV4aWxpYXJ5Q3VydmVGcmFtZXMsXG4gICAgQ3VydmVQcmVzZXRzOiBDdXJ2ZVByZXNldHMsXG4gICAgUHJvcGVydHlDdXJ2ZSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3VudGVkKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgIGFuaW1hdGlvbkN0cmwuaW5pdCh0aGF0KTtcbiAgICBhbmltYXRpb25FZGl0b3IuaW5pdCh0aGF0KTtcbiAgICBGbGFncy5zY2VuZVJlYWR5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktaXMtcmVhZHknKTtcbiAgICBpZiAoRmxhZ3Muc2NlbmVSZWFkeSkge1xuICAgICAgICBhd2FpdCBhbmltYXRpb25FZGl0b3IuZGVib3VuY2VSZWZyZXNoKCk7XG4gICAgfVxuICAgIHRoYXQud3JhcE1vZGVMaXN0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZW51bS1saXN0LXdpdGgtcGF0aCcsICdBbmltYXRpb25DbGlwLldyYXBNb2RlJyk7XG5cbiAgICB0aGF0LndyYXBNb2RlTGlzdD8uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGl0ZW0udGlwID0gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuYW5pbWF0aW9uQ3VydmUuV3JhcE1vZGUuJHtpdGVtLm5hbWV9LnRpcGApIHx8IGl0ZW0ubmFtZTtcbiAgICAgICAgaXRlbS5uYW1lID0gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuYW5pbWF0aW9uQ3VydmUuV3JhcE1vZGUuJHtpdGVtLm5hbWV9LmxhYmVsYCkgfHwgaXRlbS5uYW1lO1xuICAgIH0pO1xuICAgIGNvbnN0IGxheW91dCA9IGF3YWl0IGFuaW1hdGlvbkVkaXRvci5nZXRDb25maWcoJ2xheW91dCcpO1xuICAgIGlmIChsYXlvdXQgJiYgdHlwZW9mIGxheW91dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8g5pWw5o2u6L+B56e7XG4gICAgICAgIGlmICghbGF5b3V0LnRvcFBlYykge1xuICAgICAgICAgICAgbGF5b3V0LnRvcFBlYyA9IGxheW91dC50b3AgJiYgKGxheW91dC50b3AgLyB0aGF0LiRyZWZzWydjb250YWluZXInXS5vZmZzZXRIZWlnaHQpICogMTAwIHx8IDI1O1xuICAgICAgICAgICAgbGF5b3V0LmxlZnRQZWMgPSBsYXlvdXQubGVmdCAmJiAobGF5b3V0LmxlZnQgLyB0aGF0LiRyZWZzWydjb250YWluZXInXS5vZmZzZXRXaWR0aCkgKiAxMDAgfHwgMzA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsYXlvdXQudG9wUGVjID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbGF5b3V0LnRvcFBlYyA9IE51bWJlcihsYXlvdXQudG9wUGVjLnJlcGxhY2UoJyUnLCAnJykpIHx8IDI1O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGF5b3V0LmxlZnRQZWMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBsYXlvdXQubGVmdFBlYyA9IE51bWJlcihsYXlvdXQubGVmdFBlYy5yZXBsYWNlKCclJywgJycpKSB8fCAzMDtcbiAgICAgICAgfVxuICAgICAgICBsYXlvdXQuY2VudGVyUGVjID0gbGF5b3V0LmNlbnRlclBlYyA/PyAzMDtcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGF0LmxheW91dCwgbGF5b3V0KTtcbiAgICB9XG5cbiAgICB0aGF0LmV4cGFuZExheW91dCA9IE9iamVjdC5hc3NpZ24odGhhdC5leHBhbmRMYXlvdXQsIGF3YWl0IGFuaW1hdGlvbkVkaXRvci5nZXRDb25maWcoJ2V4cGFuZExheW91dCcpIHx8IHt9KTtcbiAgICBhd2FpdCB0aGF0LnVwZGF0ZUVuYWJsZUVtYmVkZGVkUGxheWVyKCk7XG4gICAgYXdhaXQgdGhhdC51cGRhdGVBdXhDdXJ2ZUVuYWJsZVN0YXRlKCk7XG4gICAgdGhhdC5zZWxlY3RlZElkcyA9IG5ldyBTZXQoRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnbm9kZScpKTtcbiAgICB0aGF0LnNlbGVjdGVkSWQgPSBFZGl0b3IuU2VsZWN0aW9uLmdldExhc3RTZWxlY3RlZCgnbm9kZScpO1xuICAgIHRoYXQuY3VycmVudFNjZW5lTW9kZSA9IGF3YWl0IElxdWVyeVNjZW5lTW9kZSgpO1xufVxuIl19