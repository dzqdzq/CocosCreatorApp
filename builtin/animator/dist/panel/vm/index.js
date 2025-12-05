"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mounted = exports.components = exports.methods = exports.watch = exports.computed = exports.setup = exports.data = exports.directives = void 0;
const vue_js_1 = require("vue/dist/vue.js");
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
        scale: 20,
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
    const { t } = (0, hooks_1.useI18n)();
    const isSkeletonClip = (0, vue_js_1.toRef)(baseStore, 'isSkeletonClip');
    const offset = (0, vue_js_1.toRef)(baseStore, 'offset');
    const clipConfig = (0, vue_js_1.toRef)(baseStore, 'clipConfig');
    const currentClip = (0, vue_js_1.toRef)(baseStore, 'currentClip');
    const chart = (0, vue_js_1.ref)();
    const layoutRight = (0, vue_js_1.ref)();
    const gridCanvas = (0, vue_js_1.ref)();
    const curve = (0, vue_js_1.ref)();
    const auxCurveStore = (0, hooks_1.useAuxCurveStore)();
    const transformEvent = (0, hooks_1.useTransformEvent)();
    // 从其他地方触发的 transform，同步到 property 的 curve
    transformEvent.onUpdate((key) => {
        if (grid_ctrl_1.gridCtrl.grid) {
            offset.value = grid_ctrl_1.gridCtrl.grid.xAxisOffset;
        }
        if (key !== 'property' && curve.value) {
            if (curve.value.curveCtrl && grid_ctrl_1.gridCtrl.grid) {
                (0, grid_ctrl_1.syncAxisX)(grid_ctrl_1.gridCtrl.grid, curve.value.curveCtrl.grid);
            }
        }
        // 这些操作不区分事件来源，统一在这里做一次，其它地方监听的时候就不用做了
        grid_ctrl_1.gridCtrl.grid?.render();
        animation_editor_1.animationEditor.updatePositionInfo();
        curve.value?.rePaint();
        animation_editor_1.animationEditor.renderTimeAxis();
    });
    const enableAuxCurve = (0, vue_js_1.computed)(() => {
        // 暂时只对骨骼动画开放辅助曲线
        return auxCurveStore.enabled && isSkeletonClip.value;
    });
    const updateAuxCurveEnableState = async () => {
        await auxCurveStore.updateEnableState();
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
        // ref elements
        curve,
        gridCanvas,
        chart,
        right: layoutRight,
        toPercent: (num) => `${num}%`,
        transformEvent,
        enableAuxCurve,
        updateAuxCurveEnableState,
    };
};
exports.setup = setup;
const vComputed = {
    // 根据 expandLayout 与 layout 计算真实显示的布局信息
    displayLayout() {
        // @ts-ignore
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
        const that = this;
        that.expandLayout[type] = !that.expandLayout[type];
        animation_editor_1.animationEditor.setConfig('expandLayout', that.expandLayout);
        // resize 内部访问了 dom 的宽高数据，需要等待 vue 将数据翻到 dom 元素上后才能获取到正确数据
        (0, vue_js_1.nextTick)(() => {
            animation_editor_1.animationEditor.resize();
        });
    },
    showAllKeys() {
        // 显示所有关键帧到可视区域
        const that = this;
        if (!that.clipConfig.duration || !that.curveData) {
            return;
        }
        this.$refs.curve.curveCtrl.zoomToFit();
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
                if (event.button !== 1 /* CENTER */) {
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
                if (event.button === 1 /* CENTER */ || event.button === 2 /* RIGHT */) {
                    global_data_1.Flags.startDragGridInfo = {
                        start: event.x,
                        lastStart: event.x,
                    };
                    if (event.button === 2 /* RIGHT */) {
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
        const menu = await animation_editor_1.animationEditor.getEmbeddedPlayerMenu();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBQXNGO0FBa0J0Riw0REFBd0Q7QUFDeEQsa0RBVTRCO0FBRTVCLHNDQVFvQjtBQUVwQixrREFBb0U7QUFDcEUsc0RBQTZDO0FBQzdDLGdFQUE0RDtBQUM1RCxtQ0FBcUY7QUFDckYsNkNBQXdEO0FBRXhELDZDQWlCc0I7QUFFdEIsNERBQXdEO0FBRXhELGFBQWE7QUFDYixNQUFNLGlCQUFpQixHQUFhLEVBQUUsQ0FBQztBQUUxQixRQUFBLFVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQUM7SUFDdEMsR0FBRyxFQUFFLG9CQUFPO0NBQ2YsQ0FBQyxDQUFDO0FBRUksTUFBTSxJQUFJLEdBQW9CO0lBQ2pDLE9BQU87UUFDSCxPQUFPLEVBQUUsa0JBQWtCO1FBQzNCLEtBQUssRUFBRSxFQUFFO1FBQ1QsS0FBSyxFQUFFO1lBQ0gsT0FBTyxFQUFFLEVBQUU7U0FDZDtRQUNELFlBQVksRUFBRSxDQUFDO1FBQ2YsSUFBSSxFQUFFLEVBQUU7UUFDUixVQUFVLEVBQUUsRUFBRTtRQUNkLFdBQVcsRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUN0QixVQUFVLEVBQUUsRUFBRTtRQUNkLFlBQVksRUFBRSxFQUFFO1FBQ2hCLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsVUFBVSxFQUFFLElBQUk7UUFDaEIsU0FBUyxFQUFFLEVBQUU7UUFDYixhQUFhLEVBQUUsSUFBSTtRQUNuQixlQUFlLEVBQUUsSUFBSTtRQUNyQix3QkFBd0IsRUFBRSxJQUFJO1FBQzlCLHFDQUFxQztRQUNyQyxXQUFXLEVBQUUsSUFBSTtRQUNqQixhQUFhLEVBQUUsS0FBSztRQUNwQixjQUFjLEVBQUUsTUFBTTtRQUN0QixjQUFjLEVBQUUsQ0FBQztRQUNqQixTQUFTLEVBQUUsRUFBRTtRQUNiLGdC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SUFDdkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sSUFBQSwyQkFBZSxHQUFFLENBQUM7QUFDcEQsQ0FBQztBQXZDRCwwQkF1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZXR1cENvbnRleHQsIGNvbXB1dGVkLCByZWYsIHVucmVmLCBuZXh0VGljaywgdG9SZWYgfSBmcm9tICd2dWUvZGlzdC92dWUuanMnO1xuXG5pbXBvcnQge1xuICAgIElLZXlGcmFtZSxcbiAgICBJUmF3S2V5RnJhbWUsXG4gICAgYW5pVm1EYXRhLFxuICAgIElBbmlWTU1ldGhvZHMsXG4gICAgSUFuaVZNVGhpcyxcbiAgICBJU2VsZWN0UHJvcGVydHksXG4gICAgSUN1cnZlVmFsdWUsXG4gICAgSUtleUZyYW1lRGF0YSxcbiAgICBJUHJvcERhdGEsXG4gICAgSVNob3dUeXBlLFxuICAgIElDcmVhdGVLZXlJbmZvLFxuICAgIExheW91dFBlcmNlbnRLZXksXG4gICAgSFRNTEN1c3RvbUVsZW1lbnQsXG59IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgYW5pbWF0aW9uQ3RybCB9IGZyb20gJy4uL3NoYXJlL2FuaW1hdGlvbi1jdHJsJztcbmltcG9ydCB7XG4gICAgSUFuaW1PcGVyYXRpb24sXG4gICAgSUFwcGx5T3BlcmF0aW9uLFxuICAgIEljcmVhdGVLZXksXG4gICAgSWdldFByb3BWYWx1ZUF0RnJhbWUsXG4gICAgSW1vZGlmeUN1cnZlT2ZLZXksXG4gICAgSXF1ZXJ5UGxheWluZ0NsaXBUaW1lLFxuICAgIElxdWVyeVNjZW5lTW9kZSxcbiAgICBJc2V0RWRpdENsaXAsXG4gICAgSXVwZGF0ZUV2ZW50LFxufSBmcm9tICcuLi9zaGFyZS9pcGMtZXZlbnQnO1xuXG5pbXBvcnQge1xuICAgIGNhbGNLZXlGcmFtZUtleSxcbiAgICBjaGVja0N0cmxPckNvbW1hbmQsXG4gICAgRXZlbnRCdXR0b24sXG4gICAgbXVsdGlwbHlUcmFja1dpdGhUaW1lcixcbiAgICBzb3J0UHJvcGVydHlNZW51LFxuICAgIHRpbWVUb0ZyYW1lLFxuICAgIHRyYW5zRnJhbWVCeVR5cGUsXG59IGZyb20gJy4vLi4vdXRpbHMnO1xuXG5pbXBvcnQgeyBncmlkQ3RybCwgc3luY0F4aXNYLCBzeW5jQXhpc1kgfSBmcm9tICcuLi9zaGFyZS9ncmlkLWN0cmwnO1xuaW1wb3J0IHsgRmxhZ3MgfSBmcm9tICcuLi9zaGFyZS9nbG9iYWwtZGF0YSc7XG5pbXBvcnQgeyBhbmltYXRpb25FZGl0b3IgfSBmcm9tICcuLi9zaGFyZS9hbmltYXRpb24tZWRpdG9yJztcbmltcG9ydCB7IHVzZUJhc2VTdG9yZSwgdXNlQXV4Q3VydmVTdG9yZSwgdXNlVHJhbnNmb3JtRXZlbnQsIHVzZUkxOG4gfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7IFByb3BTZXQsIGFkYXB0RGlyZWN0aXZlcyB9IGZyb20gJy4vZGlyZWN0aXZlcyc7XG5cbmltcG9ydCB7XG4gICAgQXV4aWxpYXJ5Q3VydmVGcmFtZXMsXG4gICAgQXV4aWxpYXJ5Q3VydmVzLFxuICAgIEFuaU1hc2ssXG4gICAgQW5pbWF0b3JUb29sYmFyLFxuICAgIENvbnRyb2xQb2ludGVyLFxuICAgIENvbnRyb2xUcmFja1RyZWUsXG4gICAgQ3RybFN0aWNrLFxuICAgIEV2ZW50RWRpdG9yLFxuICAgIEV2ZW50c1JvdyxcbiAgICBOb2RlVHJlZSxcbiAgICBQcmV2aWV3UmFuZ2VSb3csXG4gICAgUHJldmlld1JvdyxcbiAgICBQcm9wZXJ0eVRvb2xzLFxuICAgIFByb3BlcnR5VHJlZSxcbiAgICBUaXBzTWFzayxcbiAgICBDdXJ2ZVByZXNldHMsXG59IGZyb20gJy4vY29tcG9uZW50cyc7XG5pbXBvcnQgeyBJRXZlbnREdW1wIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgeyBkZWZhdWx0QmV6aWVyIH0gZnJvbSAnLi4vc2hhcmUvYmV6aWVyLXByZXNldHMnO1xuXG4vLyBIQUNLIOmBv+WFjeatu+W+queOr1xuY29uc3QgY2hhbmdlRmFpbGVkQ2xpcHM6IHN0cmluZ1tdID0gW107XG5cbmV4cG9ydCBjb25zdCBkaXJlY3RpdmVzID0gYWRhcHREaXJlY3RpdmVzKHtcbiAgICBzZXQ6IFByb3BTZXQsXG59KTtcblxuZXhwb3J0IGNvbnN0IGRhdGE6ICgpID0+IGFuaVZtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRpbmc6ICd3YWl0X3NjZW5lX3JlYWR5JyxcbiAgICAgICAgc2NhbGU6IDIwLFxuICAgICAgICB0b2FzdDoge1xuICAgICAgICAgICAgbWVzc2FnZTogJycsXG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRGcmFtZTogMCwgLy8g77yI5b2T5YmN5YWz6ZSu5bin77yJ56e75Yqo55qEIHBvaW50ZXIg5omA5aSE5Zyo55qE5YWz6ZSu5binXG4gICAgICAgIHJvb3Q6ICcnLCAvLyDmoLnoioLngrkgdXVpZCBUT0RPIOenu+mZpFxuICAgICAgICBzZWxlY3RlZElkOiAnJywgLy8g6YCJ5Lit6IqC54K5IHV1aWRcbiAgICAgICAgc2VsZWN0ZWRJZHM6IG5ldyBTZXQoKSwgLy8g6YCJ5Lit6IqC54K5IHV1aWQg5pWw57uEXG4gICAgICAgIHNlbGVjdFBhdGg6ICcnLFxuICAgICAgICBtb3ZlTm9kZVBhdGg6ICcnLCAvLyDmraPlnKjov4Hnp7vnmoTliqjnlLvoioLngrnot6/lvoRcbiAgICAgICAgc2VsZWN0UHJvcGVydHk6IG51bGwsIC8vIOmAieS4reeahOWxnuaAp+aVsOaNrlxuICAgICAgICBub2RlRHVtcDogbnVsbCwgLy8g6IqC54K5IGR1bXAg5pWw5o2uXG4gICAgICAgIGV2ZW50c0R1bXA6IG51bGwsIC8vIOWKqOeUu+S6i+S7tuWFs+mUruW4p+aVsOaNrlxuICAgICAgICBjbGlwc01lbnU6IFtdLFxuICAgICAgICBzZWxlY3RLZXlJbmZvOiBudWxsLCAvLyDlvZPliY3pgInkuK3nmoTlhbPplK7luKdcbiAgICAgICAgc2VsZWN0RXZlbnRJbmZvOiBudWxsLCAvLyDlvZPliY3pgInkuK3nmoTkuovku7bkv6Hmga9cbiAgICAgICAgc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvOiBudWxsLCAvLyDlvZPliY3pgInkuK3nmoTltYzlhaXmkq3mlL7lmahcbiAgICAgICAgLy8gY29weUV2ZW50SW5mbzogbnVsbCwgLy8g5aSN5Yi255qE5YWz6ZSu5bin5LqL5Lu25L+h5oGvXG4gICAgICAgIGFuaUNvbXBUeXBlOiBudWxsLCAvLyDlrZjlgqjlvZPliY3liqjnlLvnu4Tku7bnmoTnsbvlnosg6aqo6aq85Yqo55S744CB5pmu6YCa5Yqo55S744CB5Yqo55S75Zu+XG4gICAgICAgIGFuaW1hdGlvbk1vZGU6IGZhbHNlLCAvLyDlvZPliY3liqjnlLvnmoTnvJbovpHmqKHlvI9cbiAgICAgICAgYW5pbWF0aW9uU3RhdGU6ICdzdG9wJywgLy8g5b2T5YmN5Yqo55S755qE5pKt5pS+5qih5byPXG4gICAgICAgIGVkaXRFdmVudEZyYW1lOiAwLCAvLyDlvZPliY3nvJbovpHnmoTkuovku7blhbPplK7luKdcbiAgICAgICAgbWFza1BhbmVsOiAnJywgLy8g6YGu572p6Z2i5p2/XG4gICAgICAgIHNlbGVjdERhdGFDaGFuZ2U6IDAsIC8vIOabtOaWsOW9k+WJjemAieS4reiKgueCueaVsOaNrueahFxuICAgICAgICBub2Rlc0hlaWdodDogMCxcbiAgICAgICAgbm9kZVNjcm9sbEluZm86IG51bGwsXG4gICAgICAgIHByb3BlcnR5U2Nyb2xsSW5mbzogbnVsbCxcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJTY3JvbGxJbmZvOiBudWxsLFxuICAgICAgICBtb3ZlSW5mbzogbnVsbCwgLy8g5a2Y5YKo5b2T5YmN56e75Yqo6L+H56iL5Lit55qE5YWz6ZSu5bin5L+h5oGvXG4gICAgICAgIGJveEluZm86IG51bGwsIC8vIOWIneWni+WMluWtmOWCqOS/oeaBr1xuICAgICAgICBib3hTdHlsZTogbnVsbCwgLy8g6ZyA6KaB57uR5a6a5Yiw55WM6Z2i5LiK55qE5qC35byP5pWw5o2uXG4gICAgICAgIGJveERhdGE6IG51bGwsIC8vIOmcgOimgeS8oOmAkue7meWtkOe7hOS7tueahCBib3gg5L+h5oGvXG4gICAgICAgIHByZXZpZXdQb2ludGVyOiBudWxsLCAvLyDpooTop4jlvZPliY3lsI/nuqLnur/nmoTkvY3nva5cbiAgICAgICAgcHJvcGVydGllc01lbnU6IG51bGwsIC8vIOWtmOWCqOW9k+WJjeiKgueCueWFgeiuuOa3u+WKoOeahOWxnuaAp+iPnOWNlVxuICAgICAgICBwcm9wZXJ0aWVzOiBudWxsLFxuXG4gICAgICAgIHVwZGF0ZUtleUZyYW1lOiAwLFxuICAgICAgICB1cGRhdGVQb3NpdGlvbjogMCxcbiAgICAgICAgdXBkYXRlU2VsZWN0S2V5OiAxLCAvLyDmm7TmlrDpgInkuK3lhbPplK7luKfnmoTkvY3nva7kv6Hmga9cbiAgICAgICAgdXBkYXRlU2VsZWN0Tm9kZTogMSwgLy8gSEFDSyDop6blj5HorqHnrpflsZ7mgKfmm7TmlrBcbiAgICAgICAgc2Nyb2xsaW5nOiBmYWxzZSxcbiAgICAgICAgZXhwYW5kSW5mbzoge30sIC8vIOWtmOWCqOacieWIhumHj+i9qOmBk+eahOWxleW8gOS/oeaBr1xuICAgICAgICBsYXlvdXQ6IHtcbiAgICAgICAgICAgIC8vIOWtmOWCqOW9k+WJjeW4g+WxgOS/oeaBr1xuICAgICAgICAgICAgdG9wUGVjOiAyNSxcbiAgICAgICAgICAgIGNlbnRlclBlYzogMzAsXG4gICAgICAgICAgICBhdXhDdXJ2ZVBlYzogMTUsXG4gICAgICAgICAgICBsZWZ0UGVjOiAzMCxcbiAgICAgICAgICAgIF90b3RhbFBlYzogMTAwLFxuXG4gICAgICAgICAgICBfX3ZlcnNpb25fXzogJzEuMC4xJyxcbiAgICAgICAgfSxcbiAgICAgICAgbGVmdFJlc2l6ZU1vdmluZzogZmFsc2UsXG4gICAgICAgIGV4cGFuZExheW91dDoge1xuICAgICAgICAgICAgLy8g6buY6K6k6ZqQ6JeP6YG/5YWN5bmy5omwXG4gICAgICAgICAgICBlbWJlZGRlZFBsYXllcjogZmFsc2UsXG4gICAgICAgICAgICBub2RlOiB0cnVlLFxuICAgICAgICAgICAgcHJvcGVydHk6IHRydWUsXG4gICAgICAgICAgICBhdXhpbGlhcnlDdXJ2ZTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOWKqOeUu+W1jOWFpeaSreaUvuWZqOebruWJjeS9nOS4uuWunumqjOWupOWKn+iDveaPkOS+m++8jOmcgOimgeS4gOS6m+WKn+iDveW8gOWFs1xuICAgICAgICBlbmFibGVFbWJlZGRlZFBsYXllcjogdHJ1ZSxcbiAgICAgICAgZmlsdGVySW52YWxpZDogZmFsc2UsXG4gICAgICAgIGZpbHRlck5hbWU6ICcnLFxuICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgIHdyYXBNb2RlTGlzdDogW10sXG4gICAgICAgIHNob3dBbmltQ3VydmU6IGZhbHNlLFxuICAgICAgICBzaG93QW5pbUVtYmVkZGVkUGxheWVyOiB0cnVlLFxuICAgICAgICBsaWdodEN1cnZlOiBudWxsLFxuICAgICAgICBoYXNTZWxlY3RlZEN1cnZlQ2xpcDogZmFsc2UsXG4gICAgICAgIGN1cnZlRGlzYWJsZWRDQ3R5cGVzOiBhbmltYXRpb25FZGl0b3IuY3VydmVEaXNhYmxlZENDdHlwZXMsXG4gICAgICAgIHByZXNldFNpemU6IDExMCxcbiAgICAgICAgLy8g5b2T5YmN5bGV5byA55qEIHRhYiDpoblcbiAgICAgICAgZXhwYW5kVGFiOiAnJyxcbiAgICAgICAgc2VhcmNoUHJlc2V0TmFtZTogJycsXG4gICAgICAgIHRpbWVJbmZvczogW10sXG4gICAgICAgIHNob3dUeXBlOiAnZnJhbWUnLFxuICAgICAgICBlbWJlZGRlZFBsYXllckdyb3VwczogW10sXG5cbiAgICAgICAgc2hvd1VzZUJha2VkQW5pbWF0aW9uV2FybjogZmFsc2UsXG4gICAgICAgIHVzZUJha2VkQW5pbWF0aW9uV2FyblRpcDogbnVsbCxcbiAgICAgICAgY3VycmVudFNjZW5lTW9kZTogJ3ByZXZpZXcnLFxuICAgIH07XG59O1xuXG5leHBvcnQgY29uc3Qgc2V0dXAgPSAocHJvcHM6IGFueSwgY3R4OiBTZXR1cENvbnRleHQpID0+IHtcbiAgICBjb25zdCBiYXNlU3RvcmUgPSB1c2VCYXNlU3RvcmUoKTtcbiAgICBjb25zdCB7IHQgfSA9IHVzZUkxOG4oKTtcblxuICAgIGNvbnN0IGlzU2tlbGV0b25DbGlwID0gdG9SZWYoYmFzZVN0b3JlLCAnaXNTa2VsZXRvbkNsaXAnKTtcbiAgICBjb25zdCBvZmZzZXQgPSB0b1JlZihiYXNlU3RvcmUsICdvZmZzZXQnKTtcbiAgICBjb25zdCBjbGlwQ29uZmlnID0gdG9SZWYoYmFzZVN0b3JlLCAnY2xpcENvbmZpZycpO1xuICAgIGNvbnN0IGN1cnJlbnRDbGlwID0gdG9SZWYoYmFzZVN0b3JlLCAnY3VycmVudENsaXAnKTtcblxuICAgIGNvbnN0IGNoYXJ0ID0gcmVmPEhUTUxFbGVtZW50PigpO1xuICAgIGNvbnN0IGxheW91dFJpZ2h0ID0gcmVmPEhUTUxFbGVtZW50PigpO1xuICAgIGNvbnN0IGdyaWRDYW52YXMgPSByZWY8SFRNTENhbnZhc0VsZW1lbnQ+KCk7XG4gICAgY29uc3QgY3VydmUgPSByZWY8SFRNTEN1c3RvbUVsZW1lbnQ+KCk7XG5cbiAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdXNlQXV4Q3VydmVTdG9yZSgpO1xuXG4gICAgY29uc3QgdHJhbnNmb3JtRXZlbnQgPSB1c2VUcmFuc2Zvcm1FdmVudCgpO1xuICAgIC8vIOS7juWFtuS7luWcsOaWueinpuWPkeeahCB0cmFuc2Zvcm3vvIzlkIzmraXliLAgcHJvcGVydHkg55qEIGN1cnZlXG4gICAgdHJhbnNmb3JtRXZlbnQub25VcGRhdGUoKGtleSkgPT4ge1xuICAgICAgICBpZiAoZ3JpZEN0cmwuZ3JpZCkge1xuICAgICAgICAgICAgb2Zmc2V0LnZhbHVlID0gZ3JpZEN0cmwuZ3JpZC54QXhpc09mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgIT09ICdwcm9wZXJ0eScgJiYgY3VydmUudmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChjdXJ2ZS52YWx1ZS5jdXJ2ZUN0cmwgJiYgZ3JpZEN0cmwuZ3JpZCkge1xuICAgICAgICAgICAgICAgIHN5bmNBeGlzWChncmlkQ3RybC5ncmlkLCBjdXJ2ZS52YWx1ZS5jdXJ2ZUN0cmwuZ3JpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov5nkupvmk43kvZzkuI3ljLrliIbkuovku7bmnaXmupDvvIznu5/kuIDlnKjov5nph4zlgZrkuIDmrKHvvIzlhbblroPlnLDmlrnnm5HlkKznmoTml7blgJnlsLHkuI3nlKjlgZrkuoZcbiAgICAgICAgZ3JpZEN0cmwuZ3JpZD8ucmVuZGVyKCk7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVQb3NpdGlvbkluZm8oKTtcbiAgICAgICAgY3VydmUudmFsdWU/LnJlUGFpbnQoKTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlbmRlclRpbWVBeGlzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBlbmFibGVBdXhDdXJ2ZSA9IGNvbXB1dGVkKCgpID0+IHtcbiAgICAgICAgLy8g5pqC5pe25Y+q5a+56aqo6aq85Yqo55S75byA5pS+6L6F5Yqp5puy57q/XG4gICAgICAgIHJldHVybiBhdXhDdXJ2ZVN0b3JlLmVuYWJsZWQgJiYgaXNTa2VsZXRvbkNsaXAudmFsdWU7XG4gICAgfSk7XG4gICAgY29uc3QgdXBkYXRlQXV4Q3VydmVFbmFibGVTdGF0ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgYXV4Q3VydmVTdG9yZS51cGRhdGVFbmFibGVTdGF0ZSgpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0LFxuICAgICAgICAvLyBGSVhNRTog5Li65LqG5L2/IGFuaW1hdGlvbkVkaXRvcu+8jGFuaW1hdGlvbkN0cmwg562J5qih5Z2X5Lit6IO96K6/6Zeu5YiwIHN0b3Jl77yM5bCGIHN0b3JlIOaVtOS4quaatOmcsuWHuuWOu+OAglxuICAgICAgICAvLyDov5nkuKrnlKjms5XljYHliIbkuI3mjqjojZDvvIzkvYblnKjmlbTkvZPph43mnoTliY3msqHmnInmm7Tlpb3nmoTlip7ms5VcbiAgICAgICAgYXV4Q3VydmVTdG9yZSxcblxuICAgICAgICBjdXJyZW50Q2xpcCxcbiAgICAgICAgY2xpcENvbmZpZyxcbiAgICAgICAgaXNTa2VsZXRvbkNsaXAsXG4gICAgICAgIG9mZnNldCxcblxuICAgICAgICAvLyByZWYgZWxlbWVudHNcbiAgICAgICAgY3VydmUsXG4gICAgICAgIGdyaWRDYW52YXMsXG4gICAgICAgIGNoYXJ0LFxuICAgICAgICByaWdodDogbGF5b3V0UmlnaHQsXG5cbiAgICAgICAgdG9QZXJjZW50OiAobnVtOiBudW1iZXIpID0+IGAke251bX0lYCxcblxuICAgICAgICB0cmFuc2Zvcm1FdmVudCxcblxuICAgICAgICBlbmFibGVBdXhDdXJ2ZSxcbiAgICAgICAgdXBkYXRlQXV4Q3VydmVFbmFibGVTdGF0ZSxcbiAgICB9O1xufTtcblxuY29uc3QgdkNvbXB1dGVkID0ge1xuICAgIC8vIOagueaNriBleHBhbmRMYXlvdXQg5LiOIGxheW91dCDorqHnrpfnnJ/lrp7mmL7npLrnmoTluIPlsYDkv6Hmga9cbiAgICBkaXNwbGF5TGF5b3V0KCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgaGFuZGxlS2V5cyA9IE9iamVjdC5rZXlzKHRoYXQuZXhwYW5kTGF5b3V0KS5maWx0ZXIoKGtleSkgPT4gIXRoYXQuZXhwYW5kTGF5b3V0W2tleV0pO1xuICAgICAgICBpZiAoIWhhbmRsZUtleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhhdC5sYXlvdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXMgPSB7IC4uLnRoYXQubGF5b3V0IH07XG4gICAgICAgIGNvbnN0IHJlc3Q6IExheW91dFBlcmNlbnRLZXlbXSA9IFsndG9wUGVjJywgJ2NlbnRlclBlYycsICdhdXhDdXJ2ZVBlYyddO1xuICAgICAgICBjb25zdCB0b3RhbFBlYyA9IGFuaW1hdGlvbkVkaXRvci5sYXlvdXRDb25maWcudG90YWxQZWM7XG5cbiAgICAgICAgaWYgKCF0aGF0LmV4cGFuZExheW91dC5lbWJlZGRlZFBsYXllcikge1xuICAgICAgICAgICAgcmVzLnRvcFBlYyA9IDA7XG4gICAgICAgICAgICByZXN0LnNwbGljZShyZXN0LmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbSA9PT0gJ3RvcFBlYycpLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoYXQuZXhwYW5kTGF5b3V0Lm5vZGUpIHtcbiAgICAgICAgICAgIHJlcy5jZW50ZXJQZWMgPSAwO1xuICAgICAgICAgICAgcmVzdC5zcGxpY2UocmVzdC5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0gPT09ICdjZW50ZXJQZWMnKSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGF0LmV4cGFuZExheW91dC5hdXhpbGlhcnlDdXJ2ZSkge1xuICAgICAgICAgICAgcmVzLmF1eEN1cnZlUGVjID0gMDtcbiAgICAgICAgICAgIHJlc3Quc3BsaWNlKHJlc3QuZmluZEluZGV4KChpdGVtKSA9PiBpdGVtID09PSAnYXV4Q3VydmVQZWMnKSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGF0LmV4cGFuZExheW91dC5wcm9wZXJ0eSkge1xuICAgICAgICAgICAgY29uc3QgaW5jcmVhc2UgPSB0b3RhbFBlYyAtIChyZXMudG9wUGVjICsgcmVzLmNlbnRlclBlYyArIHJlcy5hdXhDdXJ2ZVBlYyk7XG4gICAgICAgICAgICBpZiAocmVzdC5sZW5ndGggPiAwICYmIGluY3JlYXNlID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2UgPSBpbmNyZWFzZSAvIHJlc3QubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJlc3QuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1trZXldICs9IGF2ZXJhZ2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyByZXNbcmVzdFswXV0gPSBNYXRoLm1pbih0b3RhbFBlYywgdGhhdC5sYXlvdXQudG9wUGVjICsgdGhhdC5sYXlvdXQuY2VudGVyUGVjKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICAvLyDlvZPliY3lhbPplK7luKfmmL7npLrml7bpl7RcbiAgICBjdXJyZW50VGltZSgpOiBzdHJpbmcge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHJldHVybiB0cmFuc0ZyYW1lQnlUeXBlKHRoYXQuY3VycmVudEZyYW1lLCB0aGF0LnNob3dUeXBlLCB0aGF0LnNhbXBsZSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlQcm9wZXJ0aWVzTWVudSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQucHJvcGVydGllc01lbnUpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICAvLyDlr7nlsZ7mgKfoj5zljZXlgZrnu4Tku7bnmoTliIbnsbvlkoznpoHnlKjlpITnkIZcbiAgICAgICAgY29uc3QgbmV3TWVudSA9IHNvcnRQcm9wZXJ0eU1lbnUodGhhdC5wcm9wZXJ0aWVzTWVudSwgdGhhdC5wcm9wZXJ0aWVzID8/IHt9KTtcbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbkVkaXRvci5jYWxjQ3JlYXRlUHJvcE1lbnUobmV3TWVudSk7XG4gICAgfSxcblxuICAgIHNlbGVjdFByb3BlcnR5UmVuZGVyRHVtcCgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0UHJvcGVydHkgfHwgIXRoYXQuc2VsZWN0UHJvcGVydHkuZHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhhdC5zZWxlY3RQcm9wZXJ0eS5kdW1wKSk7XG4gICAgICAgIGlmIChkYXRhLmV4dGVuZHMgJiYgZGF0YS5leHRlbmRzLmluY2x1ZGVzKCdjYy5Bc3NldCcpKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS50eXBlICE9PSBkYXRhLmV4dGVuZHNbMF0gJiYgIWRhdGEuZXh0ZW5kc1swXS5zdGFydHNXaXRoKCdjYy4nKSkge1xuICAgICAgICAgICAgICAgIC8vIEhBQ0sg55uu5YmN6YOo5YiG5pWw5o2u5bqP5YiX5YyW5ZCOIHR5cGUg5LiN5pivIGNjLlhYWCDov5nnsbvmoIflh4bnmoTmnZDotKjotYTmupDnsbvlnotcbiAgICAgICAgICAgICAgICBkYXRhLnR5cGUgPSBkYXRhLmV4dGVuZHNbMF07XG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RQcm9wZXJ0eS5kdW1wLnR5cGUgPSBkYXRhLmV4dGVuZHNbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS5yZWFkb25seSA9IHRoYXQuY2xpcENvbmZpZyAmJiB0aGF0LmNsaXBDb25maWcuaXNMb2NrIHx8IHRoYXQuc2VsZWN0UHJvcGVydHkubWlzc2luZztcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICAgIH0sXG5cbiAgICBwcmVzZXRBcnIoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnNlYXJjaFByZXNldE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0QmV6aWVyLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZhdWx0QmV6aWVyLnZhbHVlLmZpbHRlcigoaXRlbSkgPT4gbmV3IFJlZ0V4cCh0aGF0LnNlYXJjaFByZXNldE5hbWUsICdpJykudGVzdChpdGVtLm5hbWUpKTtcbiAgICB9LFxuXG4gICAgLy8g5piv5ZCm6ZSB5a6a5LiN5YWB6K645b+r5o236ZSu562J57yW6L6R5YWz6ZSu5bin5pON5L2cXG4gICAgbG9jaygpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICByZXR1cm4gQm9vbGVhbighdGhhdC5jbGlwQ29uZmlnIHx8IHRoYXQuY2xpcENvbmZpZy5pc0xvY2sgfHwgdGhhdC5tYXNrUGFuZWwgfHwgIXRoYXQuYW5pbWF0aW9uTW9kZSk7XG4gICAgfSxcblxuICAgIHNlbGVjdFByb3BEYXRhKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXRoYXQuc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgcHJvcCwgbm9kZVBhdGggfSA9IHRoYXQuc2VsZWN0UHJvcGVydHk7XG4gICAgICAgIHJldHVybiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbbm9kZVBhdGhdICYmIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFtub2RlUGF0aF1bcHJvcF07XG4gICAgfSxcblxuICAgIC8vIOiuoeeul+W9k+WJjemAieS4reiKgueCuSBwYXRoXG4gICAgY29tcHV0ZVNlbGVjdFBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQudXBkYXRlU2VsZWN0Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGF0LnNlbGVjdFBhdGg7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgICAgICBpZiAodGhhdC5zZWxlY3RlZElkICYmIHRoYXQubm9kZUR1bXApIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wIS51dWlkMnBhdGhbdGhhdC5zZWxlY3RlZElkXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvLyDorqHnrpflvZPliY0gc2FtcGxlXG4gICAgc2FtcGxlKCkge1xuICAgICAgICBsZXQgc2FtcGxlID0gNjA7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5jbGlwQ29uZmlnICYmIChzYW1wbGUgPSB0aGF0LmNsaXBDb25maWcuc2FtcGxlKTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZVNhbXBsZShzYW1wbGUpO1xuICAgICAgICByZXR1cm4gc2FtcGxlO1xuICAgIH0sXG5cbiAgICAvLyDorqHnrpflvZPliY3mnIDlkI7kuIDluKfkuI7kvY3nva7mlbDmja5cbiAgICBsYXN0RnJhbWVJbmZvKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGxldCBmcmFtZSA9IDA7XG4gICAgICAgIGlmICh0aGF0LmNsaXBDb25maWcgJiYgdGhhdC5jbGlwQ29uZmlnLmR1cmF0aW9uKSB7XG4gICAgICAgICAgICBmcmFtZSA9IHRpbWVUb0ZyYW1lKHRoYXQuY2xpcENvbmZpZy5kdXJhdGlvbiwgdGhhdC5zYW1wbGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHggPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGZyYW1lKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lLFxuICAgICAgICAgICAgeCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcHJvcGVydHlIZWlnaHQoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXMgPSAwO1xuICAgICAgICBPYmplY3Qua2V5cyh0aGF0LnByb3BlcnRpZXMpLmZvckVhY2goKHByb3A6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGF0LnByb3BlcnRpZXMhW3Byb3BdLmhpZGRlbikge1xuICAgICAgICAgICAgICAgIHJlcyArPSBhbmltYXRpb25FZGl0b3IuTElORV9IRUlHSFQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBzdGlja0luZm8oKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXRoYXQucHJvcGVydGllcyB8fFxuICAgICAgICAgICAgIXRoYXQuc2VsZWN0S2V5SW5mbyB8fFxuICAgICAgICAgICAgIXRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMgfHxcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMubGVuZ3RoIDwgMiB8fFxuICAgICAgICAgICAgIXRoYXQudXBkYXRlU2VsZWN0S2V5IHx8XG4gICAgICAgICAgICAhdGhhdC51cGRhdGVQb3NpdGlvbiB8fFxuICAgICAgICAgICAgIXRoYXQucHJvcGVydHlTY3JvbGxJbmZvXG4gICAgICAgICkge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmhhc1Nob3dTdGljayA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB4TGlzdDogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgY29uc3QgeUxpc3Q6IG51bWJlcltdID0gW107XG4gICAgICAgIGNvbnN0IGZyYW1lczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcy5mb3JFYWNoKChpdGVtOiBJS2V5RnJhbWUsIGk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoYXQuY29tcHV0ZVNlbGVjdFBhdGggJiZcbiAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8hLmtleUZyYW1lc1tpXSAmJlxuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyEua2V5RnJhbWVzW2ldLm5vZGVQYXRoICE9PSB0aGF0LmNvbXB1dGVTZWxlY3RQYXRoXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4TGlzdC5wdXNoKGl0ZW0ueCB8fCAwKTtcbiAgICAgICAgICAgIHRoYXQucHJvcGVydGllcyFbaXRlbS5wcm9wXSAmJiB5TGlzdC5wdXNoKHRoYXQucHJvcGVydGllcyFbaXRlbS5wcm9wXS50b3ApO1xuICAgICAgICAgICAgZnJhbWVzLnB1c2goaXRlbS5mcmFtZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmcmFtZXMuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgICAgICBhbmltYXRpb25FZGl0b3Iuc3RpY2tJbmZvLmxlZnRGcmFtZSA9IGZyYW1lc1swXTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby5yaWdodEZyYW1lID0gZnJhbWVzW2ZyYW1lcy5sZW5ndGggLSAxXTtcblxuICAgICAgICB4TGlzdC5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgICAgIHlMaXN0LnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcblxuICAgICAgICAvLyDorqHnrpfnu5PmnpzkuLrlj6rmnInlkIzkuKrkvY3nva7nmoTlhbPplK7luKdcbiAgICAgICAgaWYgKHhMaXN0W3hMaXN0Lmxlbmd0aCAtIDFdID09PSB4TGlzdFswXSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmhhc1Nob3dTdGljayA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby53aWR0aCA9IHhMaXN0W3hMaXN0Lmxlbmd0aCAtIDFdIC0geExpc3RbMF0gKyAxODtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby5oZWlnaHQgPSB5TGlzdFt5TGlzdC5sZW5ndGggLSAxXSAtIHlMaXN0WzBdICsgYW5pbWF0aW9uRWRpdG9yLkxJTkVfSEVJR0hUO1xuICAgICAgICBhbmltYXRpb25FZGl0b3Iuc3RpY2tJbmZvLmxlZnQgPSB4TGlzdFswXSArIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0IC0gMTA7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zdGlja0luZm8udG9wID0geUxpc3RbMF0gLSB0aGF0LnByb3BlcnR5U2Nyb2xsSW5mby50b3A7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5oYXNTaG93U3RpY2sgPSB0cnVlO1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhbmltYXRpb25FZGl0b3Iuc3RpY2tJbmZvKSk7XG4gICAgfSxcblxuICAgIGN1cnZlRGF0YSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0UHJvcGVydHkgfHwgIXRoYXQuc2hvd0FuaW1DdXJ2ZSB8fCAhdGhhdC5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IucmVwYWludEN1cnZlKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZVByb3BEYXRhcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wPy5wYXRoc0R1bXBbdGhhdC5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aF07XG4gICAgICAgIGlmICghbm9kZVByb3BEYXRhcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvcERhdGEgPSBub2RlUHJvcERhdGFzW3RoYXQuc2VsZWN0UHJvcGVydHkucHJvcF07XG4gICAgICAgIGlmICghcHJvcERhdGEgfHwgIXByb3BEYXRhLmlzQ3VydmVTdXBwb3J0IHx8ICFwcm9wRGF0YS50eXBlIHx8ICF0aGF0LnByb3BlcnRpZXMhW3RoYXQuc2VsZWN0UHJvcGVydHkucHJvcF0pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZXBhaW50Q3VydmUobnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvcERhdGEudHlwZSAmJiBhbmltYXRpb25FZGl0b3IuY3VydmVEaXNhYmxlZENDdHlwZXMuaW5jbHVkZXMocHJvcERhdGEudHlwZSEudmFsdWUpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IucmVwYWludEN1cnZlKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWU6IElDdXJ2ZVZhbHVlID0ge1xuICAgICAgICAgICAgY3VydmVJbmZvczoge30sXG4gICAgICAgICAgICB3cmFwTW9kZTogdGhhdC5jbGlwQ29uZmlnIS53cmFwTW9kZSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiB0aGF0LmNsaXBDb25maWchLmR1cmF0aW9uICogdGhhdC5jbGlwQ29uZmlnIS5zYW1wbGUsXG4gICAgICAgIH07XG4gICAgICAgIGxldCBoYXNVc2VyRWFzaW5nTWV0aG9kID0gZmFsc2U7XG4gICAgICAgIGlmIChwcm9wRGF0YS5wYXJ0S2V5cykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgcHJvcERhdGEucGFydEtleXMpIHtcbiAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCDlhoXpg6jmnInlvILmraXpo47pmanvvIxub2RlUHJvcERhdGFzIOWFiOWPluWHuuadpeWGjeS9v+eUqFxuICAgICAgICAgICAgICAgIGNvbnN0IHN1YlByb3BEYXRhID0gbm9kZVByb3BEYXRhc1trZXldO1xuICAgICAgICAgICAgICAgIHZhbHVlLmN1cnZlSW5mb3Nba2V5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgLy8ga2V5cyDkuI3og73kuLogbnVsbFtdXG4gICAgICAgICAgICAgICAgICAgIGtleXM6IHN1YlByb3BEYXRhLmtleUZyYW1lcy5tYXAoKGl0ZW06IElSYXdLZXlGcmFtZSkgPT4gaXRlbS5jdXJ2ZSEpLmZpbHRlcigoY3VydmUpID0+ICEhY3VydmUpLFxuICAgICAgICAgICAgICAgICAgICBwcmVXcmFwTW9kZTogc3ViUHJvcERhdGEucHJlRXh0cmFwLFxuICAgICAgICAgICAgICAgICAgICBwb3N0V3JhcE1vZGU6IHN1YlByb3BEYXRhLnBvc3RFeHRyYXAsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGF0LnByb3BlcnRpZXMhW2tleV0uY29sb3IsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBoYXNVc2VyRWFzaW5nTWV0aG9kID0gISEoaGFzVXNlckVhc2luZ01ldGhvZCB8fCB2YWx1ZS5jdXJ2ZUluZm9zW2tleV0ua2V5cy5maW5kKChpdGVtKSA9PiBpdGVtLmVhc2luZ01ldGhvZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5Yqo55S75pWw5o2u5Y+v6IO95a2Y5Zyo5peg56m35aSn5pWw5o2u77yM5LiN6IO955u05o6l5bqP5YiX5YyW5Lyg6YCS57uZIGN1cnZlLWVkaXRvclxuICAgICAgICAgICAgdmFsdWUuY3VydmVJbmZvcyA9IHtcbiAgICAgICAgICAgICAgICBbdGhhdC5zZWxlY3RQcm9wZXJ0eS5wcm9wXToge1xuICAgICAgICAgICAgICAgICAgICBrZXlzOiBwcm9wRGF0YS5rZXlGcmFtZXMubWFwKChpdGVtOiBJUmF3S2V5RnJhbWUpID0+IGl0ZW0uY3VydmUhKS5maWx0ZXIoKGN1cnZlKSA9PiAhIWN1cnZlKSxcbiAgICAgICAgICAgICAgICAgICAgcHJlV3JhcE1vZGU6IHByb3BEYXRhLnByZUV4dHJhcCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdFdyYXBNb2RlOiBwcm9wRGF0YS5wb3N0RXh0cmFwLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogdGhhdC5wcm9wZXJ0aWVzIVt0aGF0LnNlbGVjdFByb3BlcnR5LnByb3BdLmNvbG9yLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFzVXNlckVhc2luZ01ldGhvZCA9ICEhKFxuICAgICAgICAgICAgICAgIGhhc1VzZXJFYXNpbmdNZXRob2QgfHwgdmFsdWUuY3VydmVJbmZvc1t0aGF0LnNlbGVjdFByb3BlcnR5LnByb3BdLmtleXMuZmluZCgoaXRlbSkgPT4gaXRlbS5lYXNpbmdNZXRob2QpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbmltYXRpb25FZGl0b3IuY2hlY2tDdXJ2ZURhdGFEaXJ0eSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIOWIqeeUqCB2dWUg6K6h566X5bGe5oCn5py65Yi25p2l5pyA5aSn5YyW55qE5YeP5bCP5LiN5b+F6KaB55qE6YeN5paw57uY5Yi277yM5ZCM5pe26ZyA6KaB6Ieq6KGM5YaN5YGa5LiA5qyhIGRpcnR5IOWIpOaWrVxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlcGFpbnRDdXJ2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnZhbHVlLFxuICAgICAgICAgICAgaGFzVXNlckVhc2luZ01ldGhvZCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY3VydmVTdHlsZSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAodGhhdC5zaG93QW5pbUN1cnZlICYmIHRoYXQuY29tcHV0ZVNlbGVjdFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgc3RpY2tCb3hTdHlsZSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuc3RpY2tJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IHRoYXQuc3RpY2tJbmZvLndpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgIGhlaWdodDogdGhhdC5zdGlja0luZm8uaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgIHRvcDogdGhhdC5zdGlja0luZm8udG9wICsgJ3B4JyxcbiAgICAgICAgICAgIGxlZnQ6IHRoYXQuc3RpY2tJbmZvLmxlZnQgKyAncHgnLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBjdXJyZW50S2V5RW1wdHlJbmZvKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXRoYXQucHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcbiAgICAgICAgY29uc3QgcmF3UHJvcGVydHlEYXRhID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW3RoYXQuY29tcHV0ZVNlbGVjdFBhdGhdO1xuICAgICAgICBpZiAoIXJhd1Byb3BlcnR5RGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICBPYmplY3Qua2V5cyh0aGF0LnByb3BlcnRpZXMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFyYXdQcm9wZXJ0eURhdGFba2V5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGtleUZyYW1lcyA9IHJhd1Byb3BlcnR5RGF0YVtrZXldLmtleUZyYW1lcztcbiAgICAgICAgICAgIHJlc1trZXldID0gIShrZXlGcmFtZXMuZmluZCgoa2V5SW5mbykgPT4ga2V5SW5mby5mcmFtZSA9PT0gdGhhdC5jdXJyZW50RnJhbWUpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIG5vZGVUaXRsZSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICAvLyBpZiAodGhhdC5zaG93QW5pbUVtYmVkZGVkUGxheWVyICYmICF0aGF0LmZpbHRlckludmFsaWQpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiAn5Y+v6YCa55+l6IqC54K55YiX6KGoJztcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBpZiAodGhhdC5zaG93QW5pbUVtYmVkZGVkUGxheWVyICYmIHRoYXQuZmlsdGVySW52YWxpZCkge1xuICAgICAgICAvLyAgICAgcmV0dXJuICfpgJrnn6XoioLngrnliJfooagnO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmICh0aGF0LmZpbHRlckludmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnaTE4bjphbmltYXRvci5ub2RlLm5vZGVIYXNBbmltYXRpb24nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnaTE4bjphbmltYXRvci5ub2RlLnRpdGxlJztcbiAgICB9LFxufTtcbmV4cG9ydCB7IHZDb21wdXRlZCBhcyBjb21wdXRlZCB9O1xuXG5leHBvcnQgY29uc3Qgd2F0Y2ggPSB7XG4gICAgYXN5bmMgc2VsZWN0ZWRJZChuZXdWYWx1ZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgY29uc3Qgbm9kZVBhdGggPSB0aGF0LmNvbXB1dGVTZWxlY3RQYXRoO1xuICAgICAgICAvLyAxLiDmuIXnkIbkuI3lnKjmlrDpgInkuK3oioLngrnkuIrnmoTpgInkuK3lhbPplK7luKfkv6Hmga9cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gdGhhdC5zZWxlY3RLZXlJbmZvIS5rZXlGcmFtZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5ub2RlUGF0aCAhPT0gbm9kZVBhdGgpO1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFuZXdWYWx1ZSAmJiBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCkge1xuICAgICAgICAgICAgLy8g5paw5YC85Li656m65pe277yM5Y+v6IO95piv55Sx5LqO6YCJ5Lit55qE6IqC54K55piv5Lii5aSx6IqC54K55a+86Ie055qEXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC51dWlkMnBhdGhbb2xkVmFsdWVdO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbm9kZVBhdGggJiYgbm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC51cGRhdGVTZWxlY3ROb2RlID0gLXRoYXQudXBkYXRlU2VsZWN0Tm9kZTtcbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZVNlbGVjdGVkSWQoKTtcbiAgICAgICAgLy8gMi4g5pu05paw5b2T5YmN6YCJ5Lit5bGe5oCn6L2o6YGT5L+h5oGvXG4gICAgICAgIGlmICh0aGF0LnByb3BlcnRpZXMgJiYgKCh0aGF0LnNlbGVjdFByb3BlcnR5ICYmIHRoYXQuc2VsZWN0UHJvcGVydHkubm9kZVBhdGggIT09IG5vZGVQYXRoKSB8fCAhdGhhdC5zZWxlY3RQcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3AgPSBPYmplY3Qua2V5cyh0aGF0LnByb3BlcnRpZXMpWzBdO1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZVNlbGVjdFByb3BlcnR5KHtcbiAgICAgICAgICAgICAgICBub2RlUGF0aCxcbiAgICAgICAgICAgICAgICBwcm9wLFxuICAgICAgICAgICAgICAgIG1pc3Npbmc6IHRoYXQucHJvcGVydGllc1twcm9wXS5taXNzaW5nLFxuICAgICAgICAgICAgICAgIGNsaXBVdWlkOiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEudXVpZCxcbiAgICAgICAgICAgICAgICBpc0N1cnZlU3VwcG9ydDogdGhhdC5wcm9wZXJ0aWVzW3Byb3BdLmlzQ3VydmVTdXBwb3J0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZWxlY3RLZXlJbmZvKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdGhhdC5zaG93QW5pbUN1cnZlKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbmltYXRpb25FZGl0b3Iuc2VsZWN0S2V5VXBkYXRlRmxhZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVDdXJ2ZVNlbGVjdGVLZXlzKCk7XG4gICAgfSxcblxuICAgIC8vIOWIh+aNouWKqOeUu+agueiKgueCueeKtuaAgemHjee9rlxuICAgIHJvb3QoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5maWx0ZXJJbnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoYXQuZmlsdGVyTmFtZSA9ICcnO1xuICAgICAgICB0aGF0Lm5vZGVzSGVpZ2h0ID0gMDtcbiAgICB9LFxuXG4gICAgYXN5bmMgY3VycmVudENsaXAobmV3VXVpZDogc3RyaW5nLCBvbGRVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICAvLyDliIfmjaIgY2xpcCDopoHmuIXnqbrlpI3liLbnmoTlhbPplK7luKfkv6Hmga9cbiAgICAgICAgLy8gYW5pbWF0aW9uQ3RybC5jb3B5S2V5SW5mbyA9IG51bGw7XG4gICAgICAgIGlmIChuZXdVdWlkID09PSBvbGRVdWlkIHx8ICFuZXdVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGFuZ2VTdWNjZXNzID0gYXdhaXQgSXNldEVkaXRDbGlwKG5ld1V1aWQpO1xuICAgICAgICBpZiAoIWNoYW5nZVN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGNoYW5nZUZhaWxlZENsaXBzLnB1c2gobmV3VXVpZCk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFNldCBlZGl0IGNsaXAgZmFpbGVkISR7bmV3VXVpZH1gKTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VGYWlsZWRDbGlwcy5pbmNsdWRlcyhvbGRVdWlkKSkge1xuICAgICAgICAgICAgICAgIHRoYXQuY3VycmVudENsaXAgPSAnJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50Q2xpcCA9IG9sZFV1aWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0LnNlbGVjdEV2ZW50SW5mbyA9IG51bGw7XG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IG51bGw7XG5cbiAgICAgICAgY29uc3QgdGltZSA9IGF3YWl0IElxdWVyeVBsYXlpbmdDbGlwVGltZSh0aGF0LmN1cnJlbnRDbGlwKTtcbiAgICAgICAgY29uc3QgZnJhbWUgPSB0aW1lVG9GcmFtZSh0aW1lLCB0aGF0LnNhbXBsZSk7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zZXRDdXJyZW50RnJhbWUoZnJhbWUpO1xuICAgIH0sXG5cbiAgICBsYXlvdXQ6IHtcbiAgICAgICAgZGVlcDogdHJ1ZSxcbiAgICAgICAgaGFuZGxlcigpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgICAgICAvLyByZXNpemUg5YaF6YOo6K6/6Zeu5LqGIGRvbSDnmoTlrr3pq5jmlbDmja7vvIzpnIDopoHnrYnlvoUgdnVlIOWwhuaVsOaNrue/u+WIsCBkb20g5YWD57Sg5LiK5ZCO5omN6IO96I635Y+W5Yiw5q2j56Gu5pWw5o2uXG4gICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlc2l6ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIGN1cnJlbnRGcmFtZSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICB0aGF0LmNhbGNTZWxlY3RQcm9wZXJ0eShudWxsLCB0cnVlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5qC55o2u5qGG6YCJ5L+h5oGv6K6h566X6YCJ5Lit55qE5YWz6ZSu5bin5L+h5oGvXG4gICAgICovXG4gICAgYm94RGF0YSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuYm94RGF0YSB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IG9yaWdpbiwgaCwgdywgdHlwZSB9ID0gdGhhdC5ib3hEYXRhITtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdwcm9wZXJ0eScgJiYgIXRoYXQucHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJhd0tleWZyYW1lcyA9IHRoYXQuYm94SW5mbz8ucmF3S2V5RnJhbWVzO1xuICAgICAgICBjb25zdCBrZXlGcmFtZXM6IElLZXlGcmFtZURhdGFbXSA9IHJhd0tleWZyYW1lcyB8fCBbXTtcbiAgICAgICAgY29uc3Qgc2Nyb2xsVG9wID0gdHlwZSA9PT0gJ25vZGUnID8gdGhhdC5ub2RlU2Nyb2xsSW5mbyEudG9wIDogdGhhdC5wcm9wZXJ0eVNjcm9sbEluZm8hLnRvcDtcbiAgICAgICAgZnVuY3Rpb24gcHVzaFRvS2V5RnJhbWVzKGtleUluZm86IElLZXlGcmFtZURhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGtleUZyYW1lcy5maW5kKChrZXkpID0+IGtleS5yYXdGcmFtZSA9PT0ga2V5SW5mby5yYXdGcmFtZSAmJiBrZXkucHJvcCA9PT0ga2V5SW5mby5wcm9wICYmIGtleS5ub2RlUGF0aCA9PT0ga2V5Lm5vZGVQYXRoKTtcbiAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXlGcmFtZXMucHVzaChrZXlJbmZvKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwdXNoS2V5RnJhbWU6IChrZXlJbmZvOiBJS2V5RnJhbWVEYXRhKSA9PiB2b2lkID0gcmF3S2V5ZnJhbWVzID8gcHVzaFRvS2V5RnJhbWVzIDogKGtleUluZm86IElLZXlGcmFtZURhdGEpID0+IGtleUZyYW1lcy5wdXNoKGtleUluZm8pO1xuICAgICAgICBmdW5jdGlvbiBhZGRLZXlGcmFtZXMocHJvcGVydGllczogUmVjb3JkPHN0cmluZywgSVByb3BEYXRhPiwgbm9kZT86IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIE9iamVjdC52YWx1ZXMocHJvcGVydGllcykuZm9yRWFjaCgocHJvcERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDotoXlh7rojIPlm7Tpq5jluqbnmoTlsZ7mgKfovajpgZNcbiAgICAgICAgICAgICAgICAvLyDovajpgZMgdG9wIC0g5YWz6ZSu5binIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgY29uc3QgdG9wID0gcHJvcERhdGEudG9wICsgYW5pbWF0aW9uRWRpdG9yLkxJTkVfSEVJR0hUIC8gMiArIGFuaW1hdGlvbkVkaXRvci5LRVlfU0laRV9SIC0gc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZSAmJiAodG9wIDwgb3JpZ2luLnkgfHwgdG9wID4gb3JpZ2luLnkgKyBoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb3BEYXRhLmtleUZyYW1lcy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IGtleS54ICsgdGhhdC5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4ID4gb3JpZ2luLnggJiYgeCA8IG9yaWdpbi54ICsgdykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5RGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZToga2V5LmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBrZXkuZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IHByb3BEYXRhLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGtleS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3A6IHByb3BEYXRhLnByb3AsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgcHVzaEtleUZyYW1lKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY2FsY0tleUZyYW1lS2V5KGtleURhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnbm9kZScpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXApLmZvckVhY2goKHBhdGgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IHRoYXQubm9kZUR1bXAhLmZpbmQoKGl0ZW0pID0+IGl0ZW0ucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlSW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IG5vZGVJbmZvLnRvcCArIGFuaW1hdGlvbkVkaXRvci5MSU5FX0hFSUdIVCAvIDIgKyBhbmltYXRpb25FZGl0b3IuS0VZX1NJWkVfUiAtIHNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICBpZiAodG9wIDwgb3JpZ2luLnkgfHwgdG9wID4gb3JpZ2luLnkgKyBoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbcGF0aF07XG4gICAgICAgICAgICAgICAgYWRkS2V5RnJhbWVzKHByb3BlcnRpZXMsIHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZGRLZXlGcmFtZXModGhhdC5wcm9wZXJ0aWVzISk7XG4gICAgICAgIH1cbiAgICAgICAga2V5RnJhbWVzLnNvcnQoKGEsIGIpID0+IGEuZnJhbWUgLSBiLmZyYW1lKTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0ge1xuICAgICAgICAgICAgbm9kZVBhdGg6IHRoYXQuY29tcHV0ZVNlbGVjdFBhdGgsXG4gICAgICAgICAgICBrZXlGcmFtZXMsXG4gICAgICAgICAgICBsb2NhdGlvbjogJ3Byb3AnLFxuICAgICAgICAgICAgcHJvcDogdGhhdC5zZWxlY3RQcm9wZXJ0eT8ucHJvcCxcbiAgICAgICAgfTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IElBbmlWTU1ldGhvZHMgPSB7XG4gICAgb25DbGlwQ3VydmVQcmVzZXQoY3VydmVEYXRhOiBudW1iZXJbXSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICB0aGF0LiRyZWZzLmN1cnZlLmN1cnZlQ3RybC5hcHBseUJlemllclRvU2VsZWN0ZWRDdXJ2ZUNsaXAoY3VydmVEYXRhKTtcbiAgICAgICAgbXVsdGlwbHlUcmFja1dpdGhUaW1lcignaGlwcG9BbmltYXRvcicsIHtcbiAgICAgICAgICAgIC8vIOS7jumihOiuvuabsue6v+S4remAieaLqeabsue6v+W6lOeUqOasoeaVsFxuICAgICAgICAgICAgJ0ExMDAwMDAnOiAxLFxuICAgICAgICAgICAgLy8g5q+P5qyh5LiK5oql5pe26ZyA6KaB5bim5LiK5b2T5YmN6aG555uuaWTvvIxwcm9qZWN0X2lkXG4gICAgICAgICAgICBwcm9qZWN0X2lkOiBFZGl0b3IuUHJvamVjdC51dWlkLFxuICAgICAgICAgICAgLy8g5q+P5qyh5LiK5oql5pe26ZyA6KaB5bim5LiK5b2T5YmN57yW6L6R55qE5Yqo55S75Ymq6L6RIGNsaXBfaWRcbiAgICAgICAgICAgIGNsaXBfaWQ6IHRoYXQuY3VycmVudENsaXAsXG4gICAgICAgICAgICAvLyDnvJbovpHlmajniYjmnKxcbiAgICAgICAgICAgIHZlcnNpb246IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZUV4cGFuZExheW91dENoYW5nZSh0eXBlKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHRoYXQuZXhwYW5kTGF5b3V0W3R5cGVdID0gIXRoYXQuZXhwYW5kTGF5b3V0W3R5cGVdO1xuICAgICAgICBhbmltYXRpb25FZGl0b3Iuc2V0Q29uZmlnKCdleHBhbmRMYXlvdXQnLCB0aGF0LmV4cGFuZExheW91dCk7XG4gICAgICAgIC8vIHJlc2l6ZSDlhoXpg6jorr/pl67kuoYgZG9tIOeahOWuvemrmOaVsOaNru+8jOmcgOimgeetieW+hSB2dWUg5bCG5pWw5o2u57+75YiwIGRvbSDlhYPntKDkuIrlkI7miY3og73ojrflj5bliLDmraPnoa7mlbDmja5cbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlc2l6ZSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2hvd0FsbEtleXModGhpczogSUFuaVZNVGhpcykge1xuICAgICAgICAvLyDmmL7npLrmiYDmnInlhbPplK7luKfliLDlj6/op4bljLrln59cbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICAgIGlmICghdGhhdC5jbGlwQ29uZmlnIS5kdXJhdGlvbiB8fCAhdGhhdC5jdXJ2ZURhdGEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRyZWZzLmN1cnZlLmN1cnZlQ3RybC56b29tVG9GaXQoKTtcbiAgICB9LFxuXG4gICAgb25VcGRhdGVFdmVudCh1dWlkOiBzdHJpbmcsIGZyYW1lOiBudW1iZXIsIGV2ZW50OiBJRXZlbnREdW1wW10pIHtcbiAgICAgICAgaWYgKGV2ZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8g5LqL5Lu25Ye95pWw5Li656m65pe25piv5LiA5Liq5Yig6Zmk5pON5L2c77yM6ZyA6KaB5YGa6YCJ5Lit5YWz6ZSu5bin55qE5Yig6Zmk5bel5L2cXG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmRlbGV0ZUV2ZW50KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgSUFwcGx5T3BlcmF0aW9uKEl1cGRhdGVFdmVudCh1dWlkLCBmcmFtZSwgZXZlbnQpKTtcbiAgICB9LFxuXG4gICAgLy8gdG9nZ2xlQW5pbUVtYmVkZGVkUGxheWVyKCkge1xuICAgIC8vICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgIC8vICAgICBpZiAoIXRoYXQuc2hvd0FuaW1FbWJlZGRlZFBsYXllcikge1xuICAgIC8vICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNoYW5nZVRvRW1iZWRkZWRQbGF5ZXJNb2RlKCk7XG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICBhbmltYXRpb25FZGl0b3IuY2hhbmdlVG9LZXlGcmFtZU1vZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0sXG5cbiAgICB0b2dnbGVJbnZhbGlkTm9kZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5maWx0ZXJJbnZhbGlkID0gIXRoYXQuZmlsdGVySW52YWxpZDtcbiAgICAgICAgLy8g5YiH5o2i5piv5ZCm6ZqQ6JeP5peg5pWI6IqC54K55pe277yM5Y676Zmk5Y6f5pys55qE5rua5Yqo5L+h5oGvXG4gICAgICAgIHRoYXQuJHJlZnMubm9kZXMuc2Nyb2xsVG9wID0gdGhhdC5ub2RlU2Nyb2xsSW5mbyEudG9wID0gMDtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICB9LFxuXG4gICAgb25GaWx0ZXIoZXZlbnQ6IGFueSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHRoYXQuZmlsdGVyTmFtZSA9PT0gZXZlbnQudGFyZ2V0LnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmRlYm91bmNlRmlsdGVyTm9kZSEoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY2FsY1NlbGVjdFByb3BlcnR5KHBhcmFtczogbnVsbCB8IElTZWxlY3RQcm9wZXJ0eSwgaXNVcGRhdGUgPSBmYWxzZSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoaXNVcGRhdGUgJiYgdGhhdC5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgcGFyYW1zID0gdGhhdC5zZWxlY3RQcm9wZXJ0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IElnZXRQcm9wVmFsdWVBdEZyYW1lKHRoYXQuY3VycmVudENsaXAsIHBhcmFtcy5ub2RlUGF0aCwgcGFyYW1zLnByb3AsIHRoYXQuY3VycmVudEZyYW1lKTtcbiAgICAgICAgdGhhdC5zZWxlY3RQcm9wZXJ0eSA9IE9iamVjdC5hc3NpZ24ocGFyYW1zLCB7XG4gICAgICAgICAgICBkdW1wLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcXVlcnlEdXJhdGlvblN0eWxlKGZyYW1lOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIWZyYW1lIHx8ICFncmlkQ3RybC5ncmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0ID0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSCgwKTtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkge1xuICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCB3aWR0aCA9IGdyaWRDdHJsLmdyaWQhLnZhbHVlVG9QaXhlbEgoZnJhbWUpIC0gc3RhcnQ7XG4gICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgIC8vIGR1cmF0aW9uIOW3suWcqOWxj+W5leS5i+WkllxuICAgICAgICAgICAgc3RhcnQgPSB3aWR0aDtcbiAgICAgICAgICAgIHdpZHRoID0gMDtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKCR7c3RhcnR9cHgpOyB3aWR0aDogJHt3aWR0aH1weGA7XG4gICAgfSxcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDmlbDmja7lpITnkIYgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvLyDorqHnrpflhbPplK7luKfkuI7lrp7pmYXlnZDmoIflgY/np7tcbiAgICBwb2ludGVyUG9zaXRpb24ob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKHRoYXQuY3VycmVudEZyYW1lKSArXG4gICAgICAgICAgICAob2Zmc2V0ID8/IGdyaWRDdHJsLmdyaWQ/LnhBeGlzT2Zmc2V0ID8/IDApIC1cbiAgICAgICAgICAgIGdyaWRDdHJsLnN0YXJ0T2Zmc2V0XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDkuovku7blpITnkIYgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICBvbk1vdXNlV2hlZWwoZXZlbnQ6IFdoZWVsRXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAvLyDmjInkuIsgc2hpZnQg5rua5Yqo77yM5YWB6K645qiq5ZCR56e75Yqo55S75biDXG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IubW92ZVRpbWVMaW5lKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nID8gZXZlbnQuZGVsdGFYIDogZXZlbnQuZGVsdGFZKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnMoZXZlbnQuZGVsdGFYKSA+IE1hdGguYWJzKGV2ZW50LmRlbHRhWSkpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5tb3ZlVGltZUxpbmUoZXZlbnQuZGVsdGFZKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5zY2FsZVRpbWVMaW5lQXQoLWV2ZW50LmRlbHRhWSwgTWF0aC5yb3VuZChldmVudC5vZmZzZXRYKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog54K55Ye7XG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICovXG4gICAgb25Nb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5tb3ZlTm9kZVBhdGggPSAnJztcbiAgICAgICAgdGhhdC5ib3hJbmZvID0gbnVsbDtcbiAgICAgICAgdGhhdC5ib3hTdHlsZSA9IG51bGw7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgbmFtZSA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgICAgICAgaWYgKG5hbWUgIT09ICdldmVudCcpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gJ2tleScgJiYgbmFtZSAhPT0gJ3N0aWNrJyAmJiAhY2hlY2tDdHJsT3JDb21tYW5kKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gJ3JhbmdlJyAmJiBuYW1lICE9PSAnc3RpY2snICYmICFjaGVja0N0cmxPckNvbW1hbmQoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IG51bGw7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKG5hbWUgIT09ICd0aW1lLXBvaW50ZXInKSB7XG4gICAgICAgIC8vICAgICB0aGF0LnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgLy8gfVxuICAgICAgICBsZXQgYm94SW5mbzogYW55ID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiBjaGVja01vdXNlRG93bk5hbWUoKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQub2Zmc2V0WSA+IHRoYXQuJHJlZnNbJ3Byb3BlcnR5LWNvbnRlbnQnXS5vZmZzZXRUb3ApIHtcbiAgICAgICAgICAgICAgICAvLyDlnKggcHJvcGVydHkg5Yy65Z+f6YCJ5LitXG4gICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdwcm9wZXJ0eSc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50Lm9mZnNldFkgPiB0aGF0LiRyZWZzWydub2RlLWNvbnRlbnQnXS5vZmZzZXRUb3AgJiYgZXZlbnQub2Zmc2V0WSA8IHRoYXQuJHJlZnNbJ3Byb3BlcnR5LWNvbnRlbnQnXS5vZmZzZXRUb3ApIHtcbiAgICAgICAgICAgICAgICAvLyDlnKjoioLngrnljLrln5/ngrnlh7tcbiAgICAgICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ25vZGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g54K55Ye76aG26YOo56e75Yqo5b2T5YmN5YWz6ZSu5binXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAndGltZS1wb2ludGVyJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAndGltZS1wb2ludGVyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwb2ludGVyJzpcbiAgICAgICAgICAgICAgICAvLyDkuI3lhYHorrjlt6bplK7kuK3plK7np7vliqjlsI/nuqLnur9cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSBFdmVudEJ1dHRvbi5DRU5URVIpIHtcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdwb2ludGVyJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBjYXNlICdub2RlJzpcbiAgICAgICAgICAgIC8vIGNhc2UgJ3Byb3BlcnR5JzpcbiAgICAgICAgICAgIC8vICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAwKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGJveEluZm8gPSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0eXBlOiBuYW1lLFxuICAgICAgICAgICAgLy8gICAgICAgICB9O1xuICAgICAgICAgICAgLy8gICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gbmFtZTtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ2dyaWQnO1xuICAgICAgICAgICAgLy8gICAgICAgICBGbGFncy5zdGFydERyYWdHcmlkSW5mbyA9IHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHN0YXJ0OiBldmVudC54LFxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgbGFzdFN0YXJ0OiBldmVudC54LFxuICAgICAgICAgICAgLy8gICAgICAgICB9O1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RpY2snOlxuICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnc3RpY2snO1xuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyEuc3RhcnRYID0gZXZlbnQueDtcbiAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8hLm9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvIS5vZmZzZXRGcmFtZSA9IDA7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uQ0VOVEVSIHx8IGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3Muc3RhcnREcmFnR3JpZEluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogZXZlbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTdGFydDogZXZlbnQueCxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrTW91c2VEb3duTmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEZsYWdzLm1vdXNlRG93bk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDpvKDmoIfkuK3plK7miJblj7PplK7mjInkuIvvvIzmoIfor4blj6/ku6XlvIDlp4vmi5bmi73ml7bpl7TovbRcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdncmlkJztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIC8vIOmSiOWvuSBib3gg55qE5pi+56S65pWI5p6cXG4gICAgICAgIGlmICghYm94SW5mbyAmJiAhRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAgICAgY2hlY2tNb3VzZURvd25OYW1lKCk7XG4gICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lICYmIChib3hJbmZvID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IEZsYWdzLm1vdXNlRG93bk5hbWUsXG4gICAgICAgICAgICAgICAgY3RybEtleTogY2hlY2tDdHJsT3JDb21tYW5kKGV2ZW50KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFsnbm9kZScsICdwcm9wZXJ0eSddLmluY2x1ZGVzKEZsYWdzLm1vdXNlRG93bk5hbWUpICYmIGJveEluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uUmVzdWx0ID0gZ3JpZEN0cmwucGFnZVRvQ3RybChldmVudC54LCBldmVudC55KTtcbiAgICAgICAgICAgIGJveEluZm8uc3RhcnRYID0gcG9zaXRpb25SZXN1bHQueDtcbiAgICAgICAgICAgIGJveEluZm8uc3RhcnRZID0gcG9zaXRpb25SZXN1bHQueTtcbiAgICAgICAgICAgIGJveEluZm8uY3RybEtleSA9IGNoZWNrQ3RybE9yQ29tbWFuZChldmVudCk7XG4gICAgICAgICAgICBpZiAoYm94SW5mby5jdHJsS2V5ICYmIHRoYXQuc2VsZWN0S2V5SW5mbyAmJiB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgYm94SW5mby5yYXdLZXlGcmFtZXMgPSB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhhdC5ib3hJbmZvID0gYm94SW5mbztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblByb3BlcnR5TGlzdENvbnRleHRNb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdwcm9wZXJ0eS1saXN0LWNvbnRlbnQnO1xuICAgIH0sXG5cbiAgICBvblNjcm9sbChldmVudDogYW55LCB0eXBlOiAnbm9kZScgfCAncHJvcGVydHknIHwgJ2F1eEN1cnZlJykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoRmxhZ3Mub25TY3JvbGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzY3JvbGxJbmZvID0gdHlwZSA9PT0gJ25vZGUnID8gdGhhdC5ub2RlU2Nyb2xsSW5mbyEgOiB0aGF0LnByb3BlcnR5U2Nyb2xsSW5mbyE7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IGV2ZW50LnRhcmdldC5zY3JvbGxUb3A7XG4gICAgICAgIGlmIChzY3JvbGxUb3AgPT09IHNjcm9sbEluZm8udG9wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgRmxhZ3MubGFzdFNjcm9sbFRvcHMuc3BsaWNlKDAsIDAsIHNjcm9sbFRvcCk7XG4gICAgICAgIEZsYWdzLmxhc3RTY3JvbGxUb3BzLmxlbmd0aCA9IDM7XG4gICAgICAgIGlmIChGbGFncy5sYXN0U2Nyb2xsVG9wc1swXSA9PT0gRmxhZ3MubGFzdFNjcm9sbFRvcHNbMl0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoYXQuc2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICBGbGFncy5vblNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGF0LnNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNjcm9sbEluZm8udG9wID0gc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgIC8vIFRPRE8g55CG6K665LiK5LiN6ZyA6KaB6YeN5paw6K6h566X6IqC54K55pWw5o2uXG4gICAgICAgICAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLm5vZGVzRHVtcD8ubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5jYWxjTm9kZXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZUtleUZyYW1lKys7XG4gICAgICAgICAgICAgICAgdGhhdC5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBGbGFncy5vblNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgb25Db25maXJtKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGlmIChuYW1lID09PSAnc2FtcGxlJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZVNhbXBsZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uQ3RybC51cGRhdGVDb25maWcobmFtZSwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICBvblN0YXJ0UmVzaXplKGV2ZW50OiBNb3VzZUV2ZW50LCB0eXBlOiAnbGVmdCcgfCAndG9wJyB8ICdjZW50ZXInKSB7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblN0YXJ0UmVzaXplKGV2ZW50LCB0eXBlKTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlQW5pQ3VydmUoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIHRoYXQuc2hvd0FuaW1DdXJ2ZSA9ICF0aGF0LnNob3dBbmltQ3VydmU7XG4gICAgICAgIC8vIOWcqCBjdXJ2ZSDlhYPntKDmmL7npLrlkI7lho3liJ3lp4vljJZcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmluaXRDdXJ2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgb25FZGl0RWFzaW5nTWV0aG9kQ3VydmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdm0uc2hvd0FuaW1DdXJ2ZSB8fCAhdm0uY3VydmVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZtLmN1cnZlRGF0YS5oYXNVc2VyRWFzaW5nTWV0aG9kKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLnRpcHMuYWJvcnRfZWFzaW5nX21ldGhvZCcpLCB7XG4gICAgICAgICAgICAgICAgYnV0dG9uczogW0VkaXRvci5JMThuLnQoJ2FuaW1hdG9yLmNhbmNlbCcpLCBFZGl0b3IuSTE4bi50KCdhbmltYXRvci5hYm9ydCcpXSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgIGNhbmNlbDogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHJlcy5yZXNwb25zZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vZGlmeUtleXM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgIC8vIFRPRE8g5Y+v5Lul5L+u5pS55Li656e76Zmk5b2T5YmN6YCJ5Lit5bGe5oCn6L2o6YGT55qE5omA5pyJ5YWz6ZSu5binIGVhc2luZ01ldGhvZCDnmoTmjqXlj6NcbiAgICAgICAgICAgIGNvbnN0IHsgbm9kZVBhdGggfSA9IHZtLnNlbGVjdFByb3BlcnR5ITtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBPYmplY3Qua2V5cyh2bS5jdXJ2ZURhdGEuY3VydmVJbmZvcykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJ2ZUluZm8gPSB2bS5jdXJ2ZURhdGEhLmN1cnZlSW5mb3NbcHJvcF07XG4gICAgICAgICAgICAgICAgY3VydmVJbmZvLmtleXMuZm9yRWFjaCgoa2V5SW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5SW5mby5lYXNpbmdNZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeUtleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbW9kaWZ5Q3VydmVPZktleSh2bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIHByb3AsIE1hdGgucm91bmQoa2V5SW5mby5wb2ludC54KSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmdNZXRob2Q6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5S2V5cyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25TaG93VXNlQmFrZWRBbmltYXRpb25XYXJuKHRoaXM6IElBbmlWTVRoaXMsIGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnVzZUJha2VkQW5pbWF0aW9uV2FyblRpcCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRvb2x0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29uc3QgdWlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VpLWxhYmVsJyk7XG4gICAgICAgIHVpTGFiZWwuc3R5bGUud2hpdGVTcGFjZSA9ICdub3JtYWwnO1xuICAgICAgICB1aUxhYmVsLnNldEF0dHJpYnV0ZSgndmFsdWUnLCAnaTE4bjphbmltYXRvci50aXBzLnVzZV9iYWtlZF9hbmltYXRpb24uZGV0YWlsZWRfd2Fybl9ieV9za2EnKTtcbiAgICAgICAgdG9vbHRpcC5hcHBlbmRDaGlsZCh1aUxhYmVsKTtcblxuICAgICAgICBjb25zdCB0aXBCdXR0b24gPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHRhcmdldFJlY3QgPSB0aXBCdXR0b24uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0gdG9vbHRpcC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICB0b29sdGlwLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICB3aWR0aDogNjA4cHg7XG4gICAgICAgICAgICBsZWZ0OiAke3RhcmdldFJlY3QubGVmdCAtIDIyfXB4O1xuICAgICAgICAgICAgdG9wOiAke3RhcmdldFJlY3QudG9wICsgdGFyZ2V0UmVjdC5oZWlnaHQgKyA0fXB4O1xuICAgICAgICAgICAgei1pbmRleDogMTAxO1xuICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjNDI0MjQyZmY7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjOGY4ZjhmZmY7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDAgMTJweCAwICMwMDAwMDBhNjtcbiAgICAgICAgICAgIHBhZGRpbmc6IDE2cHg7ICAgIFxuICAgICAgICBgKTtcblxuICAgICAgICBjb25zdCByZW1vdmVVc2VCYWtlZEFuaW1hdGlvbldhcm5UaXAgPSAoZXZlbnQ/OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbkdsb2JhbE1vdXNlZG93bik7XG4gICAgICAgICAgICB0b29sdGlwLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBvbk1vdXNlbGVhdmUpO1xuICAgICAgICAgICAgaWYgKHRoaXMudXNlQmFrZWRBbmltYXRpb25XYXJuVGlwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VCYWtlZEFuaW1hdGlvbldhcm5UaXAgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sdGlwLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25Nb3VzZWxlYXZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvc2VkUGF0aCA9IGUuY29tcG9zZWRQYXRoKCk7XG4gICAgICAgICAgICBpZiAoY29tcG9zZWRQYXRoLmluY2x1ZGVzKHRpcEJ1dHRvbikpIHJldHVybjtcbiAgICAgICAgICAgIHJlbW92ZVVzZUJha2VkQW5pbWF0aW9uV2FyblRpcChlKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb25HbG9iYWxNb3VzZWRvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcG9zZWRQYXRoID0gZS5jb21wb3NlZFBhdGgoKTtcblxuICAgICAgICAgICAgLy8gdG9vbHRpcCDlhoXngrnlh7vml7bkuI3pmpDol49cbiAgICAgICAgICAgIGlmIChjb21wb3NlZFBhdGguaW5jbHVkZXModG9vbHRpcCkpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVtb3ZlVXNlQmFrZWRBbmltYXRpb25XYXJuVGlwKGUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRvb2x0aXAuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIG9uTW91c2VsZWF2ZSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uR2xvYmFsTW91c2Vkb3duKTtcblxuICAgICAgICB0aGlzLnVzZUJha2VkQW5pbWF0aW9uV2FyblRpcCA9IHRvb2x0aXA7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG9vbHRpcCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIh+aNouWFs+mUruW4p+aYvuekuuexu+Wei1xuICAgICAqL1xuICAgIGNoYW5nZUZyYW1lU2hvd1R5cGUoc2hvd1R5cGU6IElTaG93VHlwZSkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICAvLyDlvZPliY3ml7bpl7TkvJrmoLnmja4gc2hvd1R5cGUg6Ieq5Yqo6K6h566XXG4gICAgICAgIC8vIOiAjOW9k+WJjeaXtumXtOaYryB1aS1udW0taW5wdXQg54Sm54K55Zyo6L6T5YWl5qGG5YaF5pe2IHZhbHVlIOWAvOS/ruaUueaXoOaViO+8jOmcgOimgeW7tuWQjuS4gOW4p+S/ruaUuVxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgdGhhdC5zaG93VHlwZSA9IHNob3dUeXBlO1xuICAgICAgICAgICAgZ3JpZEN0cmwuZ3JpZCEubGFiZWxTaG93VHlwZSA9IHNob3dUeXBlO1xuICAgICAgICAgICAgZ3JpZEN0cmwuZ3JpZCEudXBkYXRlTGFiZWxzKCk7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iuc2V0Q29uZmlnKCdzaG93VHlwZScsIHNob3dUeXBlKTtcbiAgICAgICAgICAgIC8vIOWIh+aNouexu+Wei+WQjuS/ruaUueW9k+WJjeaYvuekuuaXtumXtFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25TY2FsZShzY2FsZTogbnVtYmVyKSB7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zY2FsZVRpbWVMaW5lV2l0aChzY2FsZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWFs+mUruW4p+abtOaUuVxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqL1xuICAgIG9uVGltZUNvbmZpcm0oZXZlbnQ6IGFueSkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICBjb25zdCB2YWx1ZTogc3RyaW5nID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICBpZiAoL14oWzAtOV0qKWY/JC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVDdXJyZW50RnJhbWUoTnVtYmVyKHZhbHVlKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2FtcGxlID0gYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnLnNhbXBsZTtcblxuICAgICAgICBjb25zdCB0aW1lVGVzdCA9IC9eKFswLTldKiktKFswLTldKikkLztcbiAgICAgICAgY29uc3QgdGVzdFZhbHVlID0gdmFsdWUubWF0Y2godGltZVRlc3QpO1xuICAgICAgICBpZiAodGVzdFZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBmcmFtZSA9IE51bWJlcih0ZXN0VmFsdWVbMV0pICogc2FtcGxlICsgTnVtYmVyKHRlc3RWYWx1ZVsyXSk7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlQ3VycmVudEZyYW1lKGZyYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRpbWVzVGVzdCA9IC9eKCg/PG0+XFxkKChcXC5cXGQqKT8pKW0pPyg/PHM+KFxcZCgoXFwuXFxkKik/KSkpcyQvO1xuICAgICAgICBpZiAodGltZXNUZXN0LnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCB7IGdyb3VwczogeyBtLCBzIH0gfSA9IHZhbHVlLm1hdGNoKHRpbWVzVGVzdCkgYXMgUmVnRXhwTWF0Y2hBcnJheTtcbiAgICAgICAgICAgIGxldCBmcmFtZSA9IHRpbWVUb0ZyYW1lKE51bWJlcihzKSwgc2FtcGxlKTtcbiAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgICAgZnJhbWUgKz0gTnVtYmVyKG0pICogc2FtcGxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUN1cnJlbnRGcmFtZShmcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaGFjayDnm7TmjqXkv67mlLkgZXZlbnQudGFyZ2V0IOeahCB2YWx1ZSDlgLzml6Dms5Xmm7TmlLlcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnBhdGhbMF0udmFsdWUgPSB0aGF0LmN1cnJlbnRUaW1lO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqIOe7hOS7tuS6i+S7tuebkeWQrCAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIC8vIOebkeWQrOW9k+WJjeWKqOeUu+e8lui+keWZqOS/ruaUueWFs+mUruW4p+aVsOaNrlxuICAgIG9uUHJvcENoYW5nZShldmVudDogYW55KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhBQ0sg55uu5YmNIHVpIOe7hOS7tuWPr+iDveWkmuWPkSBjaGFuZ2VcbiAgICAgICAgaWYgKGV2ZW50LmRldGFpbCAmJiBldmVudC5kZXRhaWwuaWdub3JlQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3JlYXRlS2V5SW5mbzogSUNyZWF0ZUtleUluZm8gPSB7XG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBldmVudC50YXJnZXQuZHVtcC52YWx1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wOiB0aGF0LnNlbGVjdFByb3BlcnR5LnByb3AsXG4gICAgICAgICAgICBub2RlUGF0aDogdGhhdC5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgIGZyYW1lOiB0aGF0LmN1cnJlbnRGcmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8g5LiN5Lya5ZCRIHVuZG8g57O757uf5o+Q5Lqk6K6w5b2VXG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2FsbEJ5RGVib3VuY2UoJ2NyZWF0ZUtleScsIGNyZWF0ZUtleUluZm8sIHsgcmVjb3JkVW5kbzogZmFsc2UgfSk7XG4gICAgfSxcbiAgICBvblByb3BDb25maXJtKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcyBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBsaWtlIHdoYXQgcHJvcCBjaGFuZ2UgZXZlbnQgZG9cbiAgICAgICAgaWYgKGV2ZW50LmRldGFpbCAmJiBldmVudC5kZXRhaWwuaWdub3JlQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdWlQcm9wID0gZXZlbnQudGFyZ2V0IGFzIGFueTtcbiAgICAgICAgY29uc3QgY3JlYXRlS2V5SW5mbzogSUNyZWF0ZUtleUluZm8gPSB7XG4gICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB1aVByb3AuZHVtcC52YWx1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9wOiB0aGF0LnNlbGVjdFByb3BlcnR5LnByb3AsXG4gICAgICAgICAgICBub2RlUGF0aDogdGhhdC5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgIGZyYW1lOiB0aGF0LmN1cnJlbnRGcmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8g5ZyoIHVuZG8g57O757uf5Lit55Sf5oiQ5LiA5p2h6K6w5b2VXG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2FsbEJ5RGVib3VuY2UoJ2NyZWF0ZUtleScsIGNyZWF0ZUtleUluZm8pO1xuICAgIH0sXG5cbiAgICBhc3luYyBvblNob3dFbWJlZGRlZFBsYXllck1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgbWVudSA9IGF3YWl0IGFuaW1hdGlvbkVkaXRvci5nZXRFbWJlZGRlZFBsYXllck1lbnUoKTtcbiAgICAgICAgRWRpdG9yLk1lbnUucG9wdXAoeyBtZW51IH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVFbmFibGVFbWJlZGRlZFBsYXllcigpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICAgICAgdGhhdC5lbmFibGVFbWJlZGRlZFBsYXllciA9IGF3YWl0IGFuaW1hdGlvbkVkaXRvci5nZXRDb25maWcoJ2VuYWJsZUVtYmVkZGVkUGxheWVyJykgPz8gdHJ1ZTtcblxuICAgICAgICBpZiAoIXRoYXQuZW5hYmxlRW1iZWRkZWRQbGF5ZXIpIHtcbiAgICAgICAgICAgIHRoYXQuZXhwYW5kTGF5b3V0LmVtYmVkZGVkUGxheWVyID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ2NvbnRyb2wtcHJldmlldyc6IENvbnRyb2xQb2ludGVyLFxuICAgICdjb250cm9sLXRyYWNrLXRyZWUnOiBDb250cm9sVHJhY2tUcmVlLFxuICAgICdwcmV2aWV3LXJvdyc6IFByZXZpZXdSb3csXG4gICAgJ3ByZXZpZXctcmFuZ2Utcm93JzogUHJldmlld1JhbmdlUm93LFxuICAgICd0b29sLWJhcic6IEFuaW1hdG9yVG9vbGJhcixcbiAgICAnbm9kZS10cmVlJzogTm9kZVRyZWUsXG4gICAgJ3Byb3BlcnR5LXRyZWUnOiBQcm9wZXJ0eVRyZWUsXG4gICAgJ3RpcHMtbWFzayc6IFRpcHNNYXNrLFxuICAgIGV2ZW50czogRXZlbnRzUm93LFxuICAgICdwcm9wZXJ0eS10b29scyc6IFByb3BlcnR5VG9vbHMsXG4gICAgJ2V2ZW50LWVkaXRvcic6IEV2ZW50RWRpdG9yLFxuICAgICdjdHJsLXN0aWNrJzogQ3RybFN0aWNrLFxuICAgICdhbmktbWFzayc6IEFuaU1hc2ssXG4gICAgJ0F1eGlsaWFyeUN1cnZlcyc6IEF1eGlsaWFyeUN1cnZlcyxcbiAgICBBdXhpbGlhcnlDdXJ2ZUZyYW1lczogQXV4aWxpYXJ5Q3VydmVGcmFtZXMsXG4gICAgQ3VydmVQcmVzZXRzOiBDdXJ2ZVByZXNldHMsXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW91bnRlZCgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgdGhhdCA9IHRoaXMgYXMgSUFuaVZNVGhpcztcbiAgICBhbmltYXRpb25DdHJsLmluaXQodGhhdCk7XG4gICAgYW5pbWF0aW9uRWRpdG9yLmluaXQodGhhdCk7XG4gICAgRmxhZ3Muc2NlbmVSZWFkeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWlzLXJlYWR5Jyk7XG4gICAgaWYgKEZsYWdzLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uRWRpdG9yLmRlYm91bmNlUmVmcmVzaCgpO1xuICAgIH1cbiAgICB0aGF0LndyYXBNb2RlTGlzdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWVudW0tbGlzdC13aXRoLXBhdGgnLCAnQW5pbWF0aW9uQ2xpcC5XcmFwTW9kZScpO1xuXG4gICAgdGhhdC53cmFwTW9kZUxpc3Q/LmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpdGVtLnRpcCA9IEVkaXRvci5JMThuLnQoYGFuaW1hdG9yLmFuaW1hdGlvbkN1cnZlLldyYXBNb2RlLiR7aXRlbS5uYW1lfS50aXBgKSB8fCBpdGVtLm5hbWU7XG4gICAgICAgIGl0ZW0ubmFtZSA9IEVkaXRvci5JMThuLnQoYGFuaW1hdG9yLmFuaW1hdGlvbkN1cnZlLldyYXBNb2RlLiR7aXRlbS5uYW1lfS5sYWJlbGApIHx8IGl0ZW0ubmFtZTtcbiAgICB9KTtcbiAgICBjb25zdCBsYXlvdXQgPSBhd2FpdCBhbmltYXRpb25FZGl0b3IuZ2V0Q29uZmlnKCdsYXlvdXQnKTtcbiAgICBpZiAobGF5b3V0ICYmIHR5cGVvZiBsYXlvdXQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIOaVsOaNrui/geenu1xuICAgICAgICBpZiAoIWxheW91dC50b3BQZWMpIHtcbiAgICAgICAgICAgIGxheW91dC50b3BQZWMgPSBsYXlvdXQudG9wICYmIChsYXlvdXQudG9wIC8gdGhhdC4kcmVmc1snY29udGFpbmVyJ10ub2Zmc2V0SGVpZ2h0KSAqIDEwMCB8fCAyNTtcbiAgICAgICAgICAgIGxheW91dC5sZWZ0UGVjID0gbGF5b3V0LmxlZnQgJiYgKGxheW91dC5sZWZ0IC8gdGhhdC4kcmVmc1snY29udGFpbmVyJ10ub2Zmc2V0V2lkdGgpICogMTAwIHx8IDMwO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGF5b3V0LnRvcFBlYyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGxheW91dC50b3BQZWMgPSBOdW1iZXIobGF5b3V0LnRvcFBlYy5yZXBsYWNlKCclJywgJycpKSB8fCAyNTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxheW91dC5sZWZ0UGVjID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbGF5b3V0LmxlZnRQZWMgPSBOdW1iZXIobGF5b3V0LmxlZnRQZWMucmVwbGFjZSgnJScsICcnKSkgfHwgMzA7XG4gICAgICAgIH1cbiAgICAgICAgbGF5b3V0LmNlbnRlclBlYyA9IGxheW91dC5jZW50ZXJQZWMgPz8gMzA7XG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhhdC5sYXlvdXQsIGxheW91dCk7XG4gICAgfVxuXG4gICAgdGhhdC5leHBhbmRMYXlvdXQgPSBPYmplY3QuYXNzaWduKHRoYXQuZXhwYW5kTGF5b3V0LCBhd2FpdCBhbmltYXRpb25FZGl0b3IuZ2V0Q29uZmlnKCdleHBhbmRMYXlvdXQnKSB8fCB7fSk7XG4gICAgYXdhaXQgdGhhdC51cGRhdGVFbmFibGVFbWJlZGRlZFBsYXllcigpO1xuICAgIGF3YWl0IHRoYXQudXBkYXRlQXV4Q3VydmVFbmFibGVTdGF0ZSgpO1xuICAgIHRoYXQuc2VsZWN0ZWRJZHMgPSBuZXcgU2V0KEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ25vZGUnKSk7XG4gICAgdGhhdC5zZWxlY3RlZElkID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRMYXN0U2VsZWN0ZWQoJ25vZGUnKTtcbiAgICB0aGF0LmN1cnJlbnRTY2VuZU1vZGUgPSBhd2FpdCBJcXVlcnlTY2VuZU1vZGUoKTtcbn1cbiJdfQ==