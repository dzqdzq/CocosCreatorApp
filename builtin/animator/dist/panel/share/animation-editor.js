"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcFrames = exports.animationEditor = exports.CurveColorList = void 0;
const lodash_1 = require("lodash");
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const utils_1 = require("../utils");
const animation_ctrl_1 = require("./animation-ctrl");
const bezier_presets_1 = require("./bezier-presets");
const clip_cache_1 = require("./clip-cache");
const global_data_1 = require("./global-data");
const grid_ctrl_1 = require("./grid-ctrl");
const ipc_event_1 = require("./ipc-event");
const pop_menu_1 = require("./pop-menu");
exports.CurveColorList = ["#AE2D47" /* RED */, "#198F6B" /* GREEN */, "#227F9B" /* BLUE */, "#7979D7" /* PURPLE */];
const Lodash = require('lodash');
const defaultLayoutConfig = () => {
    return {
        topMin: 0,
        topMax: 500,
        leftMin: 100,
        leftMax: 500,
        centerMin: 0,
        centerMax: 500,
        auxCurveMin: 0,
        auxCurveMax: 500,
        totalPec: 100,
    };
};
/**
 * 存储动画编辑相关操作的方法，例如选中关键帧、打开动画曲线编辑器等等
 */
class AnimationEditor {
    constructor() {
        this.panel = null;
        this.LINE_HEIGHT = 24;
        // 关键帧
        this.KEY_SIZE_R = Math.sqrt(14);
        this.imageCCTypes = ['cc.SpriteFrame', 'cc.Texture2D', 'cc.TextureBase', 'cc.ImageAsset'];
        this.curveDisabledCCtypes = ['Unknown', 'cc.Boolean', 'cc.Quat', ...this.imageCCTypes];
        this.gridCtrl = grid_ctrl_1.gridCtrl;
        this.refreshTask = 0;
        this.hasInitCurve = false;
        this.hasInitCurvePreset = false;
        this._spacingFrame = 1;
        this._curveData = null;
        this.selectKeyUpdateFlag = false;
        this.stickInfo = {
            leftFrame: 0,
            rightFrame: 0,
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        };
        this.hasShowStick = false;
        this.layoutConfig = defaultLayoutConfig();
        this.debounceUpdateNode = (0, lodash_1.debounce)(this.updateNode, 300);
        this.debounceFilterNode = (0, lodash_1.debounce)(this.FilterNode, 300);
        this.debounceRefresh = (0, lodash_1.debounce)(this._refresh, 300);
        this.aniPlayTask = 0;
        this.updateSelectQueue = [];
        // ********************* 全局事件处理 *********************
        this.onMouseUp = (event) => {
            // TODO merge 3.5.1
            // if (!Flags.mouseDownName) {
            //     if (Flags._startMove) {
            //         // @ts-ignore
            //         clearTimeout(Flags._startMove);
            //     }
            //     return;
            // }
            if (![
                'grid',
                'pointer',
                'time-pointer',
                'resize',
                'property',
                'key',
                'event',
                'node',
                'property-list-content',
                'embeddedPlayer',
                'aux-key',
            ].includes(global_data_1.Flags.mouseDownName) &&
                exports.animationEditor.isLock) {
                return;
            }
            const that = exports.animationEditor.vm;
            const $target = event.target;
            $target.style.cursor = 'default';
            global_data_1.Flags.onSelecting = false;
            switch (global_data_1.Flags.mouseDownName) {
                case 'key':
                    exports.animationEditor.onKeyMouseUp(event, {
                        target: grid_ctrl_1.gridCtrl.pageToFrame(event.x),
                    });
                    break;
                case 'aux-key':
                    this.onAuxKeyMouseup(event);
                    break;
                case 'embeddedPlayer':
                    exports.animationEditor.onEmbeddedPlayerMouseUp(event);
                    break;
                case 'event':
                    exports.animationEditor.onEventMouseUp(event);
                    break;
                case 'stick':
                    exports.animationEditor.onStickMouseUp(event);
                    break;
                case 'resize':
                    exports.animationEditor.onResizeMouseUp(event);
                    break;
                case 'time-pointer':
                    {
                        let frame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
                        if (frame < 0) {
                            frame = 0;
                        }
                        if (event.button !== 2 /* RIGHT */) {
                            that.currentFrame = frame;
                            const time = (0, utils_1.frameToTime)(frame, that.sample);
                            (0, ipc_event_1.IsetCurEditTime)(time);
                        }
                        else {
                            const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onTimerContextMenus, true);
                            menuMap.createEventKey.click = () => {
                                animation_ctrl_1.animationCtrl.addEvent(frame);
                                global_data_1.Flags.mouseDownName = '';
                            };
                            menuMap.pasteEventKey.enabled = !!animation_ctrl_1.animationCtrl.copyEventInfo;
                            menuMap.pasteEventKey.click = () => {
                                animation_ctrl_1.animationCtrl.pasteEvent(frame);
                                global_data_1.Flags.mouseDownName = '';
                            };
                            Editor.Menu.popup({ menu: Object.values(menuMap) });
                        }
                    }
                    break;
                case 'property':
                    !that.boxInfo && exports.animationEditor.onPropTrackMenu(event.x, event.y);
                    break;
                case 'property-list-content':
                    if (event.button === 2 /* RIGHT */) {
                        // 在属性列表空白位置右键菜单
                        const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onPropListContextMenus, true);
                        menuMap.pasteProp.enabled = !!(animation_ctrl_1.animationCtrl.copyPropInfo && that.selectedId);
                        menuMap.pasteProp.click = () => {
                            animation_ctrl_1.animationCtrl.pasteNodeData(animation_ctrl_1.animationCtrl.nodesDump.uuid2path[that.selectedId], animation_ctrl_1.animationCtrl.getClipBoardData('prop'));
                        };
                        menuMap.createProp.submenu = that.displayPropertiesMenu;
                        menuMap.createProp.enabled = (!!that.selectedId && !!that.displayPropertiesMenu.length && !that.clipConfig?.isLock);
                        Editor.Menu.popup({ menu: Object.values(menuMap) });
                    }
                    break;
                case 'grid':
                    if (event.button === 2 /* RIGHT */) {
                        break;
                    }
                    // grid 右键拖动会和关键帧右键菜单冲突
                    setTimeout(() => {
                        global_data_1.Flags.mouseDownName = '';
                        global_data_1.Flags.startDragGridInfo = null;
                    }, 10);
                    break;
            }
            that.boxInfo = null;
            that.boxStyle = null;
            that.boxData = null;
            global_data_1.Flags.mouseDownName = '';
            global_data_1.Flags.startDragGridInfo = null;
            that.moveInfo = null;
        };
        this.onMouseMove = (event) => {
            // 当前无鼠标按键点击时，直接过滤鼠标移动事件
            if ((![
                'grid',
                'pointer',
                'time-pointer',
                'resize',
                'event',
                'key',
                'property',
                'node',
                'embeddedPlayer',
                'aux-key',
            ].includes(global_data_1.Flags.mouseDownName) &&
                (exports.animationEditor.isLock || global_data_1.Flags.onScrolling || !event.buttons)) ||
                exports.animationEditor.vm.maskPanel) {
                return;
            }
            const that = exports.animationEditor.vm;
            const $target = event.target;
            const { x, y, button } = event;
            const rect = that.$refs.gridCanvas.getBoundingClientRect();
            if (global_data_1.Flags.mouseDownName) {
                that.previewPointer = null;
            }
            switch (global_data_1.Flags.mouseDownName) {
                case 'key':
                    exports.animationEditor.onKeyMouseMove(event);
                    break;
                case 'aux-key':
                    this.onAuxKeyMouseMove(event);
                    break;
                case 'embeddedPlayer':
                    exports.animationEditor.onEmbeddedPlayerMouseMove(event);
                    break;
                case 'event':
                    exports.animationEditor.onEventMouseMove(event);
                    break;
                case 'stick':
                    exports.animationEditor.onStickMouseMove(event);
                    break;
                case 'resize':
                    exports.animationEditor.onResizeMouseMove(event);
                    break;
                case 'grid':
                case 'property':
                case 'node':
                    {
                        if (!global_data_1.Flags.startDragGridInfo) {
                            break;
                        }
                        $target.style.cursor = '-webkit-grabbing';
                        const moveX = x - global_data_1.Flags.startDragGridInfo.lastStart;
                        if (moveX === 0) {
                            return;
                        }
                        global_data_1.Flags.mouseDownName = 'grid';
                        global_data_1.Flags.startDragGridInfo.lastStart = x;
                        requestAnimationFrame(() => {
                            exports.animationEditor.moveTimeLine(moveX);
                        });
                    }
                    break;
                case 'pointer':
                case 'time-pointer':
                    {
                        $target.style.cursor = 'ew-resize';
                        let frame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
                        if (frame < 0) {
                            frame = 0;
                        }
                        that.currentFrame = frame;
                        (0, ipc_event_1.IsetCurEditTime)((0, utils_1.frameToTime)(that.currentFrame, that.sample));
                    }
                    break;
            }
            if (!global_data_1.Flags.mouseDownName) {
                // 超出界面范围的不显示光标提示
                if (x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height) {
                    return;
                }
                $target.style.cursor = '';
                // 处理鼠标经过时的位置提示
                const result = grid_ctrl_1.gridCtrl.pageToCtrl(x, y);
                const pointerFrame = grid_ctrl_1.gridCtrl.pageToFrame(x);
                if (pointerFrame < 0) {
                    return;
                }
                if (that.previewPointer && that.previewPointer.frame === pointerFrame && that.previewPointer.y === result.y) {
                    return;
                }
                global_data_1.Flags.previewPointerTask && clearTimeout(global_data_1.Flags.previewPointerTask);
                // 留有距离避免影响到点击关键帧等的使用
                result.y += 24;
                // 限制提示关键帧的显示范围，避免影响到顶部的使用
                if (result.y < 32) {
                    result.y = 32;
                }
                requestAnimationFrame(() => {
                    that.previewPointer = {
                        frame: pointerFrame,
                        x: result.x - grid_ctrl_1.gridCtrl.startOffset,
                        y: result.y,
                    };
                    global_data_1.Flags.previewPointerTask = setTimeout(() => {
                        that.previewPointer = null;
                    }, 1000);
                });
                return;
            }
            if (['node', 'property'].includes(global_data_1.Flags.mouseDownName) && event.button === 0 /* LEFT */) {
                global_data_1.Flags.onSelecting = true;
                if (exports.animationEditor.isLock) {
                    return;
                }
                requestAnimationFrame(() => {
                    // 对 box 的框选处理
                    // 骨骼动画目前无关键帧数据，不需要响应关键框选移动等操作
                    if (that.boxInfo) {
                        that.boxInfo.x = event.x;
                        that.boxInfo.y = event.y;
                        that.boxStyle = exports.animationEditor.calcBoxStyle();
                    }
                });
            }
        };
    }
    get spacingFrame() {
        return this._spacingFrame;
    }
    set spacingFrame(val) {
        this._spacingFrame = val;
        this.changeSpacingFrame(val);
    }
    get isLock() {
        if (!this.vm) {
            return true;
        }
        return !!(!this.vm || !this.vm.animationMode || this.vm.lock || this.vm.maskPanel);
    }
    reset() {
        this.refreshTask = 0;
        this.hasInitCurve = false;
        this.selectKeyUpdateFlag = false;
        this.stickInfo = {
            leftFrame: 0,
            rightFrame: 0,
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        };
        this._spacingFrame = 1;
        this.hasShowStick = false;
        this.layoutConfig = defaultLayoutConfig();
        this.aniPlayTask = 0;
        this.updateSelectQueue = [];
    }
    /**
     * 设置某个配置值
     * @param key
     * @param value
     */
    setConfig(key, value) {
        Editor.Profile.setConfig('animator', key, value, 'global');
    }
    /**
     * 获取某个配置值
     * @param key
     */
    async getConfig(key) {
        return await Editor.Profile.getConfig('animator', key);
    }
    async init(vm) {
        this.vm = vm;
        const frame = await exports.animationEditor.getConfig('spacingFrame');
        this._spacingFrame = frame || 1;
        (0, utils_1.addEventListenerOnce)(document, 'mouseup', this.onMouseUp);
        (0, utils_1.addEventListenerOnce)(document, 'mousemove', this.onMouseMove);
    }
    async vmInit() {
        const vm = this.vm;
        vm.$refs.chart.style.width = `${vm.$refs.right.offsetWidth}px`;
        const showType = await this.getConfig('showType');
        grid_ctrl_1.gridCtrl.init({
            $canvas: vm.$refs.gridCanvas,
            $left: vm.$refs.left,
            $right: vm.$refs.right,
            $xAxis: vm.$refs.xAxis,
            showType,
            minScale: 5,
            maxScale: 100,
        });
        this.updateLayoutConfig();
        vm.offset = vm.$refs.left.offsetWidth;
        requestAnimationFrame(() => {
            grid_ctrl_1.gridCtrl.grid.resize();
            this.renderTimeAxis();
            this.setCurrentFrame(vm.currentFrame); // 主动触发更新
            this.initCurve();
            vm.offset = grid_ctrl_1.gridCtrl.grid.xAxisOffset;
        });
    }
    // 从 initCurve 中抽取出来的配置逻辑
    // FIXME: 应该进一步提取，以便和 hook 函数配合使用。
    // 同时这个函数只应该在初始化时调用一次，而不是每次显示曲线时都调用（目前的 bug）
    configureCurveEditor(curve) {
        curve.setConfig({
            xRange: [0, Infinity],
            yRange: [-Infinity, Infinity],
            showPreWrapMode: false,
            showPostWrapMode: false,
            precisionX: 0,
            precisionY: 3,
            showXLabel: false,
            showYLabel: true,
            axisMargin: 0,
            showYLine: true,
            showXLine: false,
            startXOffset: 10,
            handlerSize: 60,
            gridColor: '#333846',
            spacingFrame: this.spacingFrame,
            sample: this.vm.sample,
            xAxisName: 'time',
            yAxisName: 'value',
        });
        // TODO: connected to global grid data
        if (grid_ctrl_1.gridCtrl.grid && curve.curveCtrl?.grid) {
            (0, grid_ctrl_1.syncAxisX)(grid_ctrl_1.gridCtrl.grid, curve.curveCtrl.grid);
        }
        else {
            // FIXME: gridCtrl.grid 的初始化时机比较特殊，依赖于 scene:ready 及一系列逻辑。在它初始化完成前使用固定值
            curve.curveCtrl.grid.xAxisScale = 20;
            curve.curveCtrl.grid.xAxisOffset = 10;
        }
        // FIXME: 按照之前的行为，每次都 y 轴缩放
        curve.curveCtrl.grid.yAxisScale = 10;
    }
    initCurve() {
        const { width, height } = this.vm.$refs['property-content'].getBoundingClientRect();
        this.vm.$refs.curve.style.width = width;
        this.vm.$refs.curve.style.height = height;
        if (!this.vm.$refs.curve.curveCtrl || !this.vm.$refs.curve.curveCtrl.canvas.width || !this.vm.$refs.curve.curveCtrl.canvas.height) {
            this.vm.$refs.curve.resize(width, height);
            this.configureCurveEditor(this.vm.$refs.curve);
        }
        if (!exports.animationEditor.hasInitCurve) {
            this.vm.$refs.curve.addEventListener('transform', () => {
                grid_ctrl_1.gridCtrl.grid.xAxisScale = this.vm.$refs.curve.curveCtrl.grid.xAxisScale;
                grid_ctrl_1.gridCtrl.grid.xAxisOffset = this.vm.$refs.curve.curveCtrl.grid.xAxisOffset;
                this.vm.transformEvent.emitUpdate('property');
            });
            this.vm.$refs.curve.curveCtrl.getCopyKeys = () => {
                const info = animation_ctrl_1.animationCtrl.copyKeyInfo;
                if (!info) {
                    return [];
                }
                const curveInfos = [];
                info.curvesDump.forEach((dump) => {
                    curveInfos.push({
                        key: dump.key,
                        keys: dump.keyframes.map((item) => (0, utils_1.mockDumpToCtrl)(item)),
                    });
                });
                return curveInfos;
            };
            // 将曲线内判断获取拷贝关键帧数据的接口改为动画编辑器的判断接口
            this.vm.$refs.curve.curveCtrl.on('operate', this.onCurveOperate.bind(this));
            exports.animationEditor.hasInitCurve = true;
        }
        if (!this.hasInitCurvePreset) {
            // 设置 curve 的 config
            for (const presetItem of bezier_presets_1.defaultBezier.value) {
                const { p1, p2, p3, p4 } = (0, bezier_presets_1.transformBezierDataToPoint)(presetItem.data);
                vue_js_1.default.set(presetItem, 'svgData', `M${p1[0]} ${p1[1]} C ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}, ${p4[0]} ${p4[1]}`);
            }
            this.hasInitCurvePreset = true;
        }
    }
    getEmbeddedPlayerMenu(createInfo) {
        const template = createInfo || {};
        return Object.values(utils_1.EmbeddedPlayerMenuMap).map((info) => {
            return {
                label: info.label,
                click: () => {
                    this.addEmbeddedPlayer({
                        ...template,
                        playable: info.value,
                    });
                },
            };
        });
    }
    onEmbeddedPlayerTrackMenu(event, trackInfo) {
        const embeddedPlayersMenu = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onEmbeddedPlayerTrackMenu);
        embeddedPlayersMenu.clearEmbeddedPlayer.click = () => {
            this.clearEmbeddedPlayerGroup(trackInfo.key);
            this.unSelectEmbeddedPlayerInfo(trackInfo.embeddedPlayers);
        };
        embeddedPlayersMenu.removeEmbeddedPlayerGroup.click = () => {
            this.removeEmbeddedPlayerGroup(trackInfo.key);
            this.unSelectEmbeddedPlayerInfo(trackInfo.embeddedPlayers);
        };
        Editor.Menu.popup({ menu: Object.values(embeddedPlayersMenu) });
    }
    onEmbeddedPlayerContextMenu(event, trackInfo) {
        const embeddedPlayersMenu = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onEmbeddedPlayerContextMenu);
        const begin = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
        // 根据类型定制化菜单显示
        embeddedPlayersMenu.createEmbeddedPlayer.label = this.vm.t(pop_menu_1.popMenuMap.createEmbeddedPlayer.label, {
            player: this.vm.t(trackInfo.menuInfo.label),
        });
        embeddedPlayersMenu.createEmbeddedPlayer.click = () => {
            this.addEmbeddedPlayer({
                begin,
                end: begin + 5,
                playable: {
                    type: trackInfo.type,
                },
                group: trackInfo.key,
            });
        };
        embeddedPlayersMenu.clearEmbeddedPlayer.click = () => {
            this.clearEmbeddedPlayerGroup(trackInfo.key);
        };
        let embeddedPlayerDumps = animation_ctrl_1.animationCtrl.getClipBoardData('embeddedPlayer') || [];
        embeddedPlayerDumps = embeddedPlayerDumps.filter((dump) => {
            return dump.playable.type === trackInfo.type;
        });
        embeddedPlayersMenu.pasteEmbeddedPlayer.enabled = !!embeddedPlayerDumps.length;
        embeddedPlayersMenu.pasteEmbeddedPlayer.click = () => {
            animation_ctrl_1.animationCtrl.pasteEmbeddedPlayer(begin, embeddedPlayerDumps, trackInfo.key);
        };
        Editor.Menu.popup({ menu: Object.values(embeddedPlayersMenu) });
    }
    async clearEmbeddedPlayerGroup(groupKey) {
        await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.clearEmbeddedPlayerGroup)(this.vm.currentClip, groupKey));
    }
    async removeEmbeddedPlayerGroup(groupKey) {
        await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.removeEmbeddedPlayerGroup)(this.vm.currentClip, groupKey));
    }
    async addEmbeddedPlayer(info) {
        const dump = {
            begin: this.vm.currentFrame,
            end: this.vm.currentFrame + 5,
            reconciledSpeed: false,
            playable: {
                type: 'animation-clip',
            },
            group: '',
        };
        if (info) {
            Object.assign(dump, info);
        }
        let currentGroup = this.findGroupCanAdd(dump);
        const operations = [];
        if (!currentGroup) {
            currentGroup = {
                key: String(Date.now()),
                name: dump.playable.type,
                type: dump.playable.type,
                embeddedPlayers: [],
                menuInfo: utils_1.EmbeddedPlayerMenuMap[dump.playable.type],
            };
            operations.push((0, ipc_event_1.addEmbeddedPlayerGroup)(this.vm.currentClip, {
                key: currentGroup.key,
                name: currentGroup.name,
                type: currentGroup.type,
            }));
            this.vm.embeddedPlayerGroups.push(currentGroup);
        }
        currentGroup.embeddedPlayers.push(this.transEmbeddedPlayerDumpToInfo(dump));
        dump.group = currentGroup.key;
        operations.push((0, ipc_event_1.addEmbeddedPlayer)(this.vm.currentClip, dump));
        await (0, ipc_event_1.IApplyOperation)(operations);
        (0, utils_1.multiplyTrackWithTimer)('hippoAnimator', {
            // 添加嵌入播放器次数
            'A100002': 1,
            // 每次上报时需要带上当前项目id，project_id
            project_id: Editor.Project.uuid,
            // 每次上报时需要带上当前编辑的动画剪辑 clip_id
            clip_id: this.vm.currentClip,
            // 编辑器版本
            version: Editor.App.version,
        });
    }
    findGroupCanAdd(dump) {
        const group = this.vm.embeddedPlayerGroups.find((item) => item.key === dump.group);
        if (group) {
            const conflic = group.embeddedPlayers.find((embeddedPlayer) => {
                return Math.max(embeddedPlayer.begin, dump.begin) < Math.min(embeddedPlayer.end, dump.end);
            });
            if (!conflic) {
                return group;
            }
        }
        for (const group of this.vm.embeddedPlayerGroups) {
            if (group.type !== dump.playable.type) {
                continue;
            }
            const conflic = group.embeddedPlayers.find((embeddedPlayer) => {
                return Math.max(embeddedPlayer.begin, dump.begin) < Math.min(embeddedPlayer.end, dump.end);
            });
            if (conflic) {
                continue;
            }
            return group;
        }
        return null;
    }
    changeToEmbeddedPlayerMode() {
        // 切换是否隐藏无效节点时，去除原本的滚动信息
        this.vm.$refs.nodes.scrollTop = this.vm.nodeScrollInfo.top = 0;
        exports.animationEditor.calcDisplayClips();
    }
    changeToKeyFrameMode() {
        // 切换是否隐藏无效节点时，去除原本的滚动信息
        this.vm.$refs.nodes.scrollTop = this.vm.nodeScrollInfo.top = 0;
        exports.animationEditor.calcDisplayClips();
    }
    renderTimeAxis() {
        let time = 1;
        let frame = time * (animation_ctrl_1.animationCtrl.clipConfig.sample || 60);
        const timeInfos = [];
        const width = this.vm.$refs.container.clientWidth;
        const getCanvasOffset = (frame) => {
            return this.gridCtrl.frameToCanvas(frame) - 10 + this.vm.offset;
        };
        while (Editor.Utils.Math.clamp(getCanvasOffset(frame), 0, width) === getCanvasOffset(frame)) {
            const x = this.gridCtrl.frameToCanvas(frame);
            timeInfos.push({
                value: Math.floor(frame / (animation_ctrl_1.animationCtrl.clipConfig.sample || 60)),
                x: x,
            });
            time++;
            frame = time * (animation_ctrl_1.animationCtrl.clipConfig.sample || 60);
        }
        this.vm.timeInfos = timeInfos;
        // TODO scale 的更新需要换个位置
        this.vm.scale = (0, lodash_1.clamp)(grid_ctrl_1.gridCtrl.grid.xAxisScale, grid_ctrl_1.gridCtrl.grid.xMinScale, grid_ctrl_1.gridCtrl.grid.xMaxScale);
    }
    onCurveOperate(operate, curveKeyFrames, targetFrame) {
        this.vm.hasSelectedCurveClip = false;
        if (operate === 'unselect' || !this.vm.selectProperty) {
            this.vm.selectKeyInfo = null;
            this.vm.lightCurve = null;
            return;
        }
        if (!curveKeyFrames) {
            return;
        }
        const { nodePath, type } = this.vm.selectProperty;
        switch (operate) {
            case 'select':
                {
                    const selectKeyInfo = {
                        keyFrames: [],
                        nodePath: nodePath,
                        prop: this.vm.selectProperty.prop,
                        location: 'prop',
                    };
                    curveKeyFrames.forEach((keysInfo) => {
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keysInfo.keys, type);
                        const prop = keysInfo.key;
                        selectKeyInfo.keyFrames.push(...keys.map((info, index) => {
                            const keyData = {
                                x: keysInfo.keys[index].key.canvas.x - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                                frame: info.frame,
                                rawFrame: info.frame,
                                prop: prop,
                                nodePath: this.vm.computeSelectPath,
                            };
                            return {
                                ...keyData,
                                key: (0, utils_1.calcKeyFrameKey)(keyData),
                            };
                        }));
                    });
                    this.selectKeyUpdateFlag = false;
                    this.vm.selectKeyInfo = selectKeyInfo;
                    this.vm.updateSelectKey++;
                }
                break;
            case 'db-select':
                // 双击跳转到某个关键帧位置
                {
                    const currentKeys = curveKeyFrames[0].keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(currentKeys, type);
                    this.updateCurrentFrame(keys[0].frame);
                }
                break;
            case 'select-curve':
                this.vm.lightCurve = {
                    name: curveKeyFrames[0].key,
                    color: this.vm.properties[curveKeyFrames[0].key].color,
                };
                break;
            case 'select-curve-clip':
                this.vm.lightCurve = {
                    name: curveKeyFrames[0].key,
                    color: this.vm.properties[curveKeyFrames[0].key].color,
                };
                this.vm.hasSelectedCurveClip = true;
                break;
            case 'apply-bezier':
                {
                    this.vm.hasSelectedCurveClip = true;
                    // 所有关键帧值的修改
                    const operations = [];
                    for (const curveKeyInfos of curveKeyFrames) {
                        const targetProp = curveKeyInfos.key;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyInfos.keys, type);
                        const modifyKeys = keys.map((item) => {
                            return (0, ipc_event_1.ImodifyCurveOfKey)(this.vm.currentClip, nodePath, targetProp, item.frame, {
                                inTangent: item.inTangent,
                                outTangent: item.outTangent,
                                inTangentWeight: item.inTangentWeight,
                                outTangentWeight: item.outTangentWeight,
                                interpMode: item.interpMode,
                                tangentWeightMode: item.tangentWeightMode,
                            });
                        });
                        operations.push(...modifyKeys);
                    }
                    (0, ipc_event_1.IApplyOperation)(operations);
                }
                break;
            case 'scale-keys':
            case 'move-keys':
                {
                    const moveKeys = [];
                    const createKeys = [];
                    const selectKeyInfo = {
                        nodePath: this.vm.computeSelectPath,
                        keyFrames: [],
                        location: 'prop',
                        prop: this.vm.selectProperty.prop,
                    };
                    curveKeyFrames.forEach((curveInfo) => {
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        keyInfos.forEach((item, index) => {
                            // 关键帧移动
                            const offsetFrameX = Math.round(item.key.point.x - item.raw.point.x);
                            const keyData = {
                                x: grid_ctrl_1.gridCtrl.grid.valueToPixelH(keys[index].frame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                                frame: keys[index].frame,
                                prop: curveInfo.key,
                                rawFrame: Math.round(item.raw.point.x),
                                nodePath: this.vm.computeSelectPath,
                                offsetFrame: offsetFrameX,
                            };
                            selectKeyInfo.keyFrames.push({
                                ...keyData,
                                key: (0, utils_1.calcKeyFrameKey)(keyData),
                            });
                            const offsetFrameY = Math.round(item.key.point.y - item.raw.point.y);
                            if (!offsetFrameX && !offsetFrameY) {
                                return;
                            }
                            offsetFrameX && moveKeys.push((0, ipc_event_1.ImoveKeys)(this.vm.currentClip, nodePath, curveInfo.key, [Math.round(item.raw.point.x)], offsetFrameX));
                            createKeys.push((0, ipc_event_1.IcreateKey)(this.vm.currentClip, nodePath, curveInfo.key, keys[index].frame, {
                                newValue: item.key.point.y,
                                inTangent: item.key.inTangent,
                                outTangent: item.key.outTangent,
                            }));
                        });
                    });
                    // 按顺序，先移动，再更新关键帧数据
                    (0, ipc_event_1.IApplyOperation)([...moveKeys, ...createKeys]);
                    this.selectKeyUpdateFlag = false;
                    this.vm.selectKeyInfo = selectKeyInfo;
                }
                break;
            case 'tangent':
                {
                    // 所有关键帧值的修改
                    const targetProp = curveKeyFrames[0].key;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, type);
                    const modifyKeys = keys.map((item) => {
                        return (0, ipc_event_1.ImodifyCurveOfKey)(this.vm.currentClip, nodePath, targetProp, item.frame, {
                            inTangent: item.inTangent,
                            broken: item.broken,
                            outTangent: item.outTangent,
                            inTangentWeight: item.inTangentWeight,
                            outTangentWeight: item.outTangentWeight,
                        });
                    });
                    (0, ipc_event_1.IApplyOperation)(modifyKeys);
                }
                break;
            // TODO 暂时没有调用，需要场景支持 broken 数据的修改
            case 'change-broken-state':
                {
                    // 所有关键帧值的修改
                    const targetProp = curveKeyFrames[0].key;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, type);
                    const modifyKeys = keys.map((item) => {
                        return (0, ipc_event_1.ImodifyCurveOfKey)(this.vm.currentClip, nodePath, targetProp, item.frame, {
                            broken: item.broken,
                        });
                    });
                    (0, ipc_event_1.IApplyOperation)(modifyKeys);
                }
                break;
            case 'create-keys':
                // 粘贴接口目前也走新建关键帧处理
                {
                    const createKeysTask = [];
                    curveKeyFrames.forEach((curveInfo) => {
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        keys.forEach((targetKey, index) => {
                            createKeysTask.push((0, ipc_event_1.IcreateKey)(this.vm.currentClip, nodePath, curveInfo.key, keys[index].frame, {
                                inTangent: targetKey.inTangent,
                                outTangent: targetKey.outTangent,
                                newValue: targetKey.dump.value,
                                interpMode: targetKey.interpMode,
                                tangentWeightMode: targetKey.tangentWeightMode,
                                inTangentWeight: targetKey.inTangentWeight,
                                outTangentWeight: targetKey.outTangentWeight,
                            }));
                        });
                    });
                    (0, ipc_event_1.IApplyOperation)(createKeysTask);
                }
                break;
            case 'change-interp-mode':
                {
                    // 所有关键帧值的修改
                    const modifyCurveOfKeys = [];
                    curveKeyFrames.forEach((curveInfo) => {
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        modifyCurveOfKeys.push(...keys.map((item) => {
                            return (0, ipc_event_1.ImodifyCurveOfKey)(this.vm.currentClip, nodePath, curveInfo.key, item.frame, {
                                inTangent: item.inTangent,
                                outTangent: item.outTangent,
                                interpMode: item.interpMode,
                            });
                        }));
                    });
                    (0, ipc_event_1.IApplyOperation)(modifyCurveOfKeys);
                }
                break;
            case 'change-tangent-weight':
                {
                    // 所有关键帧值的修改
                    const modifyCurveOfKeys = [];
                    curveKeyFrames.forEach((curveInfo) => {
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        modifyCurveOfKeys.push(...keys.map((item) => {
                            return (0, ipc_event_1.ImodifyCurveOfKey)(this.vm.currentClip, nodePath, curveInfo.key, item.frame, {
                                tangentWeightMode: item.tangentWeightMode,
                                inTangentWeight: item.inTangentWeight,
                                outTangentWeight: item.outTangentWeight,
                            });
                        }));
                    });
                    (0, ipc_event_1.IApplyOperation)(modifyCurveOfKeys);
                }
                break;
            case 'remove-keys':
                {
                    const removeKeys = [];
                    curveKeyFrames.forEach((curveInfo) => {
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        removeKeys.push(...keys.map((item) => {
                            return (0, ipc_event_1.IremoveKey)(this.vm.currentClip, nodePath, curveInfo.key, item.frame);
                        }));
                    });
                    (0, ipc_event_1.IApplyOperation)(removeKeys);
                    this.selectKeyUpdateFlag = false;
                    this.vm.selectKeyInfo = null;
                }
                break;
            case 'move-curve':
                {
                    const createKeys = [];
                    curveKeyFrames.forEach((curveInfo) => {
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        // 整条曲线的上下移动：所有关键帧值的修改
                        createKeys.push(...keys.map((item) => {
                            return (0, ipc_event_1.IcreateKey)(this.vm.currentClip, nodePath, curveInfo.key, item.frame, { newValue: item.dump.value });
                        }));
                    });
                    (0, ipc_event_1.IApplyOperation)(createKeys);
                }
                break;
            case 'paste':
                animation_ctrl_1.animationCtrl.pasteKey({
                    target: targetFrame,
                    nodePath: nodePath,
                }, animation_ctrl_1.animationCtrl.getClipBoardData('key'));
                break;
            case 'copy':
                {
                    // 将关键帧数据转换为动画编辑器可接受的拷贝数据格式
                    const curvesDump = [];
                    const leftFrames = [];
                    curveKeyFrames.forEach((curveInfo) => {
                        const rawPropData = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[nodePath][curveInfo.key];
                        const parent = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[nodePath][rawPropData.parentPropKey];
                        const keyInfos = curveInfo.keys;
                        const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, type);
                        curvesDump.push({
                            nodePath: nodePath,
                            key: curveInfo.key,
                            type: rawPropData.type,
                            displayName: rawPropData.displayName,
                            keyframes: keys,
                            // 分量轨道要尽量粘贴到一样父轨道下的子轨道内，需要记录额外信息，否则只有 number 这类的信息，无法判断
                            _parentType: parent && parent.type,
                            preExtrap: rawPropData.preExtrap,
                            postExtrap: rawPropData.postExtrap,
                            isCurveSupport: rawPropData.isCurveSupport,
                        });
                        leftFrames.push(keys[0].frame);
                    });
                    animation_ctrl_1.animationCtrl.copyKeyInfo = {
                        curvesDump,
                        leftFrame: leftFrames.sort((a, b) => a - b)[0],
                    };
                }
                break;
        }
    }
    FilterNode(name) {
        this.vm.filterName = name;
        this.calcDisplayNodes();
    }
    checkCurveDataDirty(curveData) {
        if (!this._curveData) {
            this._curveData = curveData;
            return true;
        }
        const res = JSON.stringify(this._curveData) !== JSON.stringify(curveData);
        // 检查 dirty 后需要缓存最新的曲线数据，下次 dirty 值需要和上一次记录的比对
        this._curveData = curveData;
        return res;
    }
    /**
     * 将选中关键帧数据同步到曲线内
     */
    updateCurveSelecteKeys() {
        if (!this.vm.showAnimCurve) {
            return;
        }
        if (!this.vm.selectKeyInfo) {
            this.vm.$refs.curve.curveCtrl.selectKeys(null);
            return;
        }
        const sortDump = this.vm.selectKeyInfo.sortDump || (0, utils_1.sortKeysToTreeMap)(this.vm.selectKeyInfo.keyFrames);
        const keyInfos = Object.values(sortDump).map((propDump) => {
            return {
                key: propDump.prop,
                frames: propDump.keyFrames.map((item) => item.frame),
            };
        });
        this.vm.$refs.curve.curveCtrl.selectKeys(keyInfos);
    }
    repaintCurve(data) {
        if (!this.vm) {
            return;
        }
        try {
            // 界面假定所有数据都是正常的规则去处理，如果遇到异常数据会抛出异常导致错误，先 try catch 避免影响界面的其他操作
            this.vm.showAnimCurve && (this.vm.$refs.curve.curveCtrl && this.vm.$refs.curve.curveCtrl.paint(data));
            this._curveData = data;
        }
        catch (error) {
            console.error(error);
        }
        if (this.selectKeyUpdateFlag) {
            this.updateCurveSelecteKeys();
            this.selectKeyUpdateFlag = false;
        }
    }
    updateLayoutConfig() {
        // 133 ≈ $container.top(50) + $time-pointer.height(31) + $property-tools.height(28) +.events(24)
        const rect = this.vm.$el.getBoundingClientRect();
        this.layoutConfig.topMax = rect.top + this.panel.clientHeight - 133;
        this.layoutConfig.leftMax = rect.left + this.panel.clientWidth - 100;
        this.layoutConfig.totalPec = 100 * (this.vm.$refs.container.offsetHeight - 30 * 3) / this.vm.$refs.container.offsetHeight;
    }
    updateSample(sample) {
        if (!this.vm || !this.vm.showAnimCurve) {
            return;
        }
        this.vm.$refs.curve.sample = sample;
    }
    hideNodes() {
        this.vm.$refs.nodes.style.height = '24px';
        this.vm.$refs.nodes.style.flex = 'unset';
        this.vm.$refs['node-content'].style.height = '24px';
        this.vm.$refs['node-content'].style.flex = 'unset';
    }
    /**
     * 显示某段提示
     * @param message
     */
    showToast(message, awaitMs = 1000) {
        this.vm.toast.message = message;
        global_data_1.Flags.tipsTimer && clearTimeout(global_data_1.Flags.tipsTimer);
        global_data_1.Flags.tipsTimer = setTimeout(() => {
            this.vm.toast.message = '';
        }, awaitMs);
    }
    changeSpacingFrame(value) {
        this.setConfig('spacingFrame', value);
        this.vm.$refs.curve.curveCtrl && (this.vm.$refs.curve.curveCtrl.config.spacingFrame = value);
    }
    // 更新选中关键帧位置, 以及当前鼠标关键帧的位置
    updatePositionInfo(type) {
        const that = this.vm;
        that.updatePosition++;
        if (that.previewPointer) {
            that.previewPointer = null;
        }
        if (that.nodeDump && animation_ctrl_1.animationCtrl.clipsDump) {
            that.nodeDump.forEach((item) => {
                // @ts-ignore
                item.keyFrames = Object.freeze(this.calcNodeFrames(item.path));
            });
            // TODO 不能整段替换，会影响界面渲染效率
            if (that.properties) {
                that.properties = this.calcProperty();
            }
            this.calcAuxiliaryCurves();
            that.updateKeyFrame++;
        }
        exports.animationEditor.calcDisplayEmbeddedPlayers();
        if (type === 'move') {
            return;
        }
        if (that.selectKeyInfo) {
            for (const item of that.selectKeyInfo.keyFrames) {
                if (!item) {
                    continue;
                }
                item.x = grid_ctrl_1.gridCtrl.frameToCanvas(item.frame);
            }
            that.updateSelectKey++;
        }
        if (animation_ctrl_1.animationCtrl.clipsDump && animation_ctrl_1.animationCtrl.clipsDump.events) {
            this.calcEventsDump();
        }
        if (that.selectEventInfo) {
            for (const item of that.selectEventInfo.data) {
                if (!item) {
                    continue;
                }
                item.x = grid_ctrl_1.gridCtrl.frameToCanvas(item.frame);
            }
        }
        if (that.selectEmbeddedPlayerInfo) {
            for (const item of that.selectEmbeddedPlayerInfo) {
                if (!item) {
                    continue;
                }
                item.x = grid_ctrl_1.gridCtrl.frameToCanvas(item.rawInfo.begin);
                item.width = grid_ctrl_1.gridCtrl.frameToCanvas(item.rawInfo.end) - item.x;
            }
        }
    }
    // 重置选中的关键帧信息
    resetSelectedKeyInfo() {
        const that = this.vm;
        if (!that.selectKeyInfo) {
            return;
        }
        const tempSelect = JSON.parse(JSON.stringify(that.selectKeyInfo));
        tempSelect.offsetFrame = 0;
        tempSelect.offset = 0;
        delete tempSelect.sortDump;
        tempSelect.keyFrames.forEach((keyFrame, index) => {
            tempSelect.keyFrames[index].frame = keyFrame.frame;
            delete tempSelect.keyFrames[index].offsetFrame;
        });
        tempSelect.sortDump = (0, utils_1.sortKeysToTreeMap)(tempSelect.keyFrames);
        tempSelect.keyFrames.sort((a, b) => a.frame - b.frame);
        that.selectKeyInfo = tempSelect;
    }
    /**
     * 渐进的清空当前选中的数据
     */
    clearSelectData() {
        if (this.vm.selectEventInfo || this.vm.selectKeyInfo) {
            this.vm.selectEventInfo = null;
            this.vm.selectKeyInfo = null;
            return;
        }
        if (this.vm.selectProperty) {
            this.vm.selectProperty = null;
        }
        if (this.vm.selectEmbeddedPlayerInfo) {
            this.vm.selectEmbeddedPlayerInfo = null;
            Editor.Selection.unselect('animation-embeddedPlayer', Editor.Selection.getSelected('animation-embeddedPlayer'));
        }
    }
    /**
     * 拷贝当前选中信息
     */
    copy() {
        if (this.isLock) {
            if (this.vm.selectEventInfo && !this.vm.maskPanel) {
                animation_ctrl_1.animationCtrl.copyEvents();
                return;
            }
            if (this.vm.selectEmbeddedPlayerInfo) {
                animation_ctrl_1.animationCtrl.copyEmbeddedPlayerDump = this.vm.selectEmbeddedPlayerInfo.map((info) => this.transEmbeddedPlayerInfoToDump(info, false));
                return;
            }
            return;
        }
        if (this.vm.selectKeyInfo) {
            animation_ctrl_1.animationCtrl.copyKey();
            return;
        }
        if (this.vm.selectEmbeddedPlayerInfo) {
            animation_ctrl_1.animationCtrl.copyEmbeddedPlayerDump = this.vm.selectEmbeddedPlayerInfo.map((info) => this.transEmbeddedPlayerInfoToDump(info, false));
            return;
        }
        if (this.vm.selectEventInfo) {
            animation_ctrl_1.animationCtrl.copyEvents();
            return;
        }
        if (this.vm.selectProperty) {
            animation_ctrl_1.animationCtrl.copyProp(this.vm.selectProperty);
            return;
        }
        if (this.vm.selectedId) {
            animation_ctrl_1.animationCtrl.copyNodeData([animation_ctrl_1.animationCtrl.nodesDump.uuid2path[this.vm.selectedId]]);
            return;
        }
    }
    /**
     * 粘贴当前系统复制信息，调用的 ctrl 粘贴接口第二个参数都是可选的，但是为了优先取剪贴板内的数据，需要传递第二个参数
     */
    paste() {
        if (this.isLock) {
            // 骨骼动画允许快捷键复制粘贴
            if (animation_ctrl_1.animationCtrl.copyEventInfo && this.vm.animationMode && !this.vm.maskPanel) {
                animation_ctrl_1.animationCtrl.pasteEvent(this.vm.currentFrame, animation_ctrl_1.animationCtrl.getClipBoardData('event'));
                return;
            }
            if (animation_ctrl_1.animationCtrl.copyEmbeddedPlayerDump) {
                animation_ctrl_1.animationCtrl.pasteEmbeddedPlayer(this.vm.currentFrame, animation_ctrl_1.animationCtrl.getClipBoardData('embeddedPlayer'));
            }
            return;
        }
        if (animation_ctrl_1.animationCtrl.copyKeyInfo) {
            animation_ctrl_1.animationCtrl.pasteKey({
                target: this.vm.currentFrame,
                nodePath: this.vm.computeSelectPath,
            }, animation_ctrl_1.animationCtrl.getClipBoardData('key'));
            return;
        }
        if (animation_ctrl_1.animationCtrl.copyEmbeddedPlayerDump) {
            animation_ctrl_1.animationCtrl.pasteEmbeddedPlayer(this.vm.currentFrame, animation_ctrl_1.animationCtrl.getClipBoardData('embeddedPlayer'));
        }
        if (animation_ctrl_1.animationCtrl.copyEventInfo) {
            animation_ctrl_1.animationCtrl.pasteEvent(this.vm.currentFrame, animation_ctrl_1.animationCtrl.getClipBoardData('event'));
            return;
        }
        if (this.vm.selectProperty && animation_ctrl_1.animationCtrl.copyPropInfo) {
            animation_ctrl_1.animationCtrl.pasteProp(this.vm.selectProperty, animation_ctrl_1.animationCtrl.getClipBoardData('prop'));
            return;
        }
        this.vm.selectedId &&
            animation_ctrl_1.animationCtrl.pasteNodeData(animation_ctrl_1.animationCtrl.nodesDump.uuid2path[this.vm.selectedId], animation_ctrl_1.animationCtrl.getClipBoardData('node') || animation_ctrl_1.animationCtrl.getClipBoardData('prop'));
    }
    /**
     * 更新选中的关键帧
     * @param params
     */
    updateSelectKey(params) {
        const that = this.vm;
        if (!that.selectKeyInfo && !params) {
            return;
        }
        const tempSelect = JSON.parse(JSON.stringify(that.selectKeyInfo || params));
        if (!tempSelect.sortDump) {
            if (!params.nodePath) {
                return;
            }
            tempSelect.sortDump = {};
        }
        const { nodePath, prop } = params;
        const path = nodePath + prop;
        if ((!tempSelect.sortDump[path] && !params.keyFrames.length) || !prop) {
            return;
        }
        const frames = params.keyFrames.map((param) => param.frame) || [];
        tempSelect.sortDump[path] = {
            keyFrames: params.keyFrames,
            prop,
            nodePath,
            frames,
        };
        if (!params.keyFrames.length) {
            delete tempSelect.sortDump[path];
        }
        let keyFrames = [];
        Object.keys(tempSelect.sortDump).map((path) => {
            const item = tempSelect.sortDump[path];
            if (!item.keyFrames.length) {
                delete tempSelect.sortDump[path];
            }
            keyFrames = keyFrames.concat(item.keyFrames);
        });
        tempSelect.keyFrames = keyFrames.sort((a, b) => a.frame - b.frame);
        that.selectKeyInfo = tempSelect;
    }
    /**
     * 检查某个关键帧在选中的关键帧内的位置
     * @param param
     */
    getPositionAtSelect(param) {
        if (!this.vm.selectKeyInfo) {
            return -1;
        }
        return this.vm.selectKeyInfo.keyFrames.findIndex((item) => {
            return item.prop === param.prop && item.frame === param.frame && item.nodePath === param.nodePath;
        });
    }
    /**
     * 移除部分选中的关键帧
     * @param params
     */
    removeSelectKey(params) {
        if (!this.vm.selectKeyInfo || !this.vm.selectKeyInfo.keyFrames) {
            return false;
        }
        const selectKeyInfo = JSON.parse(JSON.stringify(this.vm.selectKeyInfo));
        this.vm.selectKeyInfo.keyFrames.forEach((info, index) => {
            if (params.find((param) => Lodash.isEqual(info, param))) {
                selectKeyInfo.keyFrames.splice(index, 1);
                selectKeyInfo.keyFrames.splice(index, 1);
            }
        });
        delete selectKeyInfo.sortDump;
        this.vm.selectKeyInfo = selectKeyInfo;
        return true;
    }
    /**
     * 删除选中的嵌入播放器数据
     * @returns
     */
    async deleteSelecteEmbeddedPlayers() {
        if (!this.vm.selectEmbeddedPlayerInfo) {
            return false;
        }
        const operations = [];
        this.vm.selectEmbeddedPlayerInfo.forEach((info) => {
            operations.push((0, ipc_event_1.deleteEmbeddedPlayer)(this.vm.currentClip, this.transEmbeddedPlayerInfoToDump(info, false)));
        });
        this.vm.selectEmbeddedPlayerInfo = null;
        Editor.Selection.unselect('animation-embeddedPlayer', Editor.Selection.getSelected('animation-embeddedPlayer'));
        return await (0, ipc_event_1.IApplyOperation)(operations);
    }
    /**
     * 打开某一帧的事件帧编辑界面
     * @param frame
     */
    openEventEditor(frame) {
        this.vm.editEventFrame = frame;
        this.vm.maskPanel = 'event';
    }
    /**
     * 关闭事件编辑界面
     */
    closeMaskPanel() {
        this.vm.maskPanel = '';
    }
    /**
     * 设置当前需要移动的节点数据
     * @param nodePath
     */
    setMovePath(nodePath) {
        // TODO 这应该是一个中间状态，不需要最外层知晓控制？
        this.vm.moveNodePath = nodePath;
    }
    /**
     * 取消移动
     */
    cancelMoveNode() {
        this.vm.moveNodePath = '';
    }
    /**
     * 选中某个节点
     * @param nodePath
     * @param ctrl 是否按下 ctrl
     */
    selectNode(nodePath, ctrl = false) {
        if (!animation_ctrl_1.animationCtrl.nodesDump) {
            return;
        }
        const that = this.vm;
        const uuids = animation_ctrl_1.animationCtrl.nodesDump.path2uuid[nodePath];
        if (uuids) {
            const selectUuids = [uuids[0]];
            if (selectUuids[0] !== that.selectedId && ctrl) {
                selectUuids.push(that.selectedId);
            }
            that.selectedId = uuids[0];
            that.selectPath = '';
            Editor.Selection.update('node', selectUuids);
        }
        else {
            // 丢失节点时的处理逻辑
            that.selectPath = nodePath;
            that.properties = this.calcProperty();
            that.selectedId = '';
            that.selectedIds.clear();
        }
    }
    /**
     * 开始移动某个节点 TODO 只需要复制粘贴节点功能即可
     * @param path
     */
    startMoveNode(path) {
        this.vm.moveNodePath = path;
    }
    /**
     * 记录开始拖拽的关键帧信息
     * @param dragKeysInfo
     */
    startDragKey(dragKeysInfo, ctrl = false) {
        if (!animation_ctrl_1.animationCtrl.nodesDump || !animation_ctrl_1.animationCtrl.clipsDump) {
            return;
        }
        const that = this.vm;
        if (dragKeysInfo) {
            dragKeysInfo.keyFrames.sort((a, b) => a.frame - b.frame);
            dragKeysInfo.sortDump = (0, utils_1.sortKeysToTreeMap)(dragKeysInfo.keyFrames);
            const selectParams = dragKeysInfo.keyFrames[0];
            if (selectParams.nodePath !== that.computeSelectPath) {
                // 选中节点的路径与当前路径不同，更新 selectedId 为改路径下的第一个节点 uuid
                // 注意处理同名节点的选中问题
                const uuids = animation_ctrl_1.animationCtrl.nodesDump.path2uuid[selectParams.nodePath];
                if (uuids[0] !== that.selectedId) {
                    Editor.Selection.unselect('node', that.selectedId);
                    Editor.Selection.select('node', uuids[0]);
                    // 1. 更新当前选中节点
                    // selectedId 做了 watch，更换选中节点后，清空之前的选中属性轨道信息，因而需要先修改
                    that.selectedId = uuids[0];
                }
            }
            if (!this.vm.selectProperty || this.vm.selectProperty.prop !== selectParams.prop || this.vm.selectProperty.nodePath !== selectParams.nodePath) {
                const propData = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[selectParams.nodePath][selectParams.prop];
                // 2. 更新当前选中属性轨道信息
                exports.animationEditor.updateSelectProperty({
                    nodePath: selectParams.nodePath,
                    prop: selectParams.prop,
                    clipUuid: animation_ctrl_1.animationCtrl.clipsDump.uuid,
                    isCurveSupport: propData.isCurveSupport,
                });
                this.selectKeyUpdateFlag = true;
            }
        }
        // 3. 更新当前选中的关键帧信息
        that.selectKeyInfo = dragKeysInfo;
        that.updateSelectKey++;
        // 按下 Ctrl 时不允许拖拽
        if (ctrl) {
            return;
        }
        global_data_1.Flags.mouseDownName = 'key';
    }
    /**
     * 更新选中的属性信息
     * @param dragProperty
     */
    async updateSelectProperty(dragProperty) {
        const that = this.vm;
        if (dragProperty.clipUuid !== this.vm.currentClip || dragProperty.nodePath !== this.vm.computeSelectPath) {
            // 当前选中属性轨道的信息不属于当前编辑的 clip 则不查询信息
            return;
        }
        const dump = await (0, ipc_event_1.IgetPropValueAtFrame)(dragProperty.clipUuid, dragProperty.nodePath, dragProperty.prop, that.currentFrame);
        if (!dump) {
            return;
        }
        that.selectProperty = Object.assign(dragProperty, {
            dump,
            type: {
                value: dump.type,
                extends: dump.extends,
            },
        });
        that.lightCurve = null;
    }
    /**
     * 记录刚开始拖动的事件帧信息
     * @param dragEvent
     */
    startDragEvent(dragEvent, hasCtrl = false) {
        this.vm.selectEventInfo = dragEvent;
        // 按下 Ctrl 键时不允许移动
        if (!hasCtrl) {
            global_data_1.Flags.mouseDownName = 'event';
        }
        else if (global_data_1.Flags.mouseDownName === 'event') {
            global_data_1.Flags.mouseDownName = '';
        }
    }
    /**
     * 更新提示小红线的位置信息提示
     * @param x
     * @param y
     */
    updateMouseFrame(point, offsetFrame) {
        const that = this.vm;
        if (!point || (!point.x && !point.y)) {
            that.moveInfo = null;
            return;
        }
        const result = grid_ctrl_1.gridCtrl.pageToCtrl(point.x, point.y);
        const frame = point.frame || grid_ctrl_1.gridCtrl.pageToFrame(point.x);
        // 关键帧的半径大小是 5
        if (!that.moveInfo) {
            that.moveInfo = {
                frame,
                x: result.x + 5,
                y: result.y + 5,
                offsetFrame: offsetFrame || 0,
            };
        }
        else {
            that.moveInfo.frame = frame;
            that.moveInfo.x = result.x + 5;
            that.moveInfo.y = result.y + 5;
            that.moveInfo.offsetFrame = offsetFrame || 0;
        }
    }
    /**
     * 展开
     * @param prop
     * @param expand
     */
    updatePropExpandState(prop, expand) {
        const that = this.vm;
        that.expandInfo[prop] = expand;
        const partKeys = that.properties[prop].partKeys;
        if (!partKeys) {
            console.log(`[Animation Editor] Can't get partKeys of prop(${prop})`);
            return;
        }
        partKeys.forEach((prop) => {
            that.properties[prop].hidden = !expand;
        });
        that.properties = this.calcProperty();
        requestAnimationFrame(() => {
            // 更新选中关键帧数据
            that.updateSelectKey++;
        });
    }
    // ********************* 对时间轴的处理方法 *********************
    /**
     * 让指定关键帧在画布区域显示
     * 指定关键帧超出画布左边界会将其设置在画布右边界
     * 指定关键帧超出画布右边界会将其设置在画布左边界
     * @param frame
     */
    showFrameInGrid(frame) {
        const { start, end } = grid_ctrl_1.gridCtrl.getFrameRang();
        // 超过边界
        if (frame >= end) {
            this.setGridHeaderFrame(frame);
        }
        else if (frame <= start) {
            this.setGridFooterFrame(frame);
        }
    }
    /**
     * 将画布移动到将指定帧放置在首位的画面
     * @param frame
     */
    setGridHeaderFrame(frame) {
        const { start } = grid_ctrl_1.gridCtrl.getFrameRang();
        const startPosition = grid_ctrl_1.gridCtrl.frameToCanvas(start);
        this.moveTimeLine(startPosition - grid_ctrl_1.gridCtrl.frameToCanvas(frame));
    }
    /**
     * 将画布移动到将指定帧放置在末尾的画面
     * @param frame
     */
    setGridFooterFrame(frame) {
        const { end } = grid_ctrl_1.gridCtrl.getFrameRang();
        const endPosition = grid_ctrl_1.gridCtrl.frameToCanvas(end);
        this.moveTimeLine(endPosition - grid_ctrl_1.gridCtrl.frameToCanvas(frame));
    }
    /**
     * 对整个时间轴进行移动
     * @param delta (移动距离)
     */
    moveTimeLine(delta) {
        const that = this.vm;
        grid_ctrl_1.gridCtrl.grid.transferX(delta);
        this.vm.transformEvent.emitUpdate('grid');
    }
    /**
     * 对整个时间轴进行缩放
     * @param delta 缩放时鼠标滚动距离，用具计算缩放倍数
     * @param x 缩放中心点
     */
    scaleTimeLineAt(delta, x) {
        const that = this.vm;
        const scale = (0, utils_1.smoothScale)(delta, grid_ctrl_1.gridCtrl.scale);
        if ((delta < 0 && scale <= grid_ctrl_1.gridCtrl.grid.xMinScale) || (delta > 0 && scale >= grid_ctrl_1.gridCtrl.grid.xMaxScale)) {
            return;
        }
        grid_ctrl_1.gridCtrl.grid.xAxisScaleAt(x, scale); // 坐标画布更改
        this.vm.transformEvent.emitUpdate('grid');
    }
    /**
     * 按照某个缩放比例对整个时间轴进行缩放
     * @param scaleNum 缩放比例
     */
    scaleTimeLineWith(scaleNum) {
        const that = this.vm;
        const scale = (0, lodash_1.clamp)(scaleNum, grid_ctrl_1.gridCtrl.grid.xMinScale, grid_ctrl_1.gridCtrl.grid.xMaxScale);
        grid_ctrl_1.gridCtrl.grid.xAxisScale = scale;
        this.vm.transformEvent.emitUpdate('grid');
    }
    // 关键帧的自动移动
    runPointer() {
        const that = this.vm;
        this.aniPlayTask = requestAnimationFrame(async () => {
            if (that.animationState === 'play' && that.animationMode) {
                await this.checkCurrentTime();
                this.runPointer();
            }
            else {
                this.aniPlayTask && cancelAnimationFrame(this.aniPlayTask);
                // 预防数据未完整更新，多查询一次
                await this.checkCurrentTime();
            }
        });
    }
    // ********************* 计算控制杆 *********************
    // ********************* 当前关键帧处理相关 *********************
    // 更改当前关键帧
    setCurrentFrame(frame) {
        // 更新当前关键帧
        const that = this.vm;
        if (frame < 0) {
            frame = 0;
        }
        that.currentFrame = frame;
        if (frame === 0) {
            if (grid_ctrl_1.gridCtrl.grid && grid_ctrl_1.gridCtrl.grid.xAxisOffset !== grid_ctrl_1.gridCtrl.startOffset) {
                this.moveTimeLine(grid_ctrl_1.gridCtrl.startOffset - grid_ctrl_1.gridCtrl.grid.xAxisOffset);
            }
            return;
        }
        this.showFrameInGrid(frame);
    }
    /**
     * 更新当前关键帧位置
     * @param frame
     */
    updateCurrentFrame(frame) {
        this.setCurrentFrame(frame);
        const time = (0, utils_1.frameToTime)(frame, this.vm.sample);
        (0, ipc_event_1.IsetCurEditTime)(time);
    }
    jumpPrevFrame() {
        if (this.vm.currentFrame > 0) {
            this.updateCurrentFrame(--this.vm.currentFrame);
        }
    }
    jumpNextFrame() {
        this.updateCurrentFrame(++this.vm.currentFrame);
    }
    jumpFirstFrame() {
        this.updateCurrentFrame(0);
    }
    jumpLastFrame() {
        this.updateCurrentFrame(this.vm.lastFrameInfo.frame);
    }
    /**
     * 下一步
     */
    async nextStep() {
        const that = this.vm;
        if (this.isLock) {
            return;
        }
        if (that.selectKeyInfo) {
            this.moveSelectKeys(1, true);
            return;
        }
        if (that.selectEmbeddedPlayerInfo) {
            this.moveSelectEmbeddedPlayers(1);
            return;
        }
        if (that.selectEventInfo) {
            await this.moveSelectEvents(1, true);
            return;
        }
        this.jumpNextFrame();
    }
    /**
     * 上一步
     */
    async prevStep() {
        if (this.isLock) {
            return;
        }
        const that = this.vm;
        if (that.selectKeyInfo) {
            this.moveSelectKeys(-1, true);
            return;
        }
        if (that.selectEmbeddedPlayerInfo) {
            this.moveSelectEmbeddedPlayers(-1);
            return;
        }
        if (that.selectEventInfo) {
            await this.moveSelectEvents(-1, true);
            return;
        }
        this.jumpPrevFrame();
    }
    /**
     * 跳转到下一关键帧
     */
    jumpToNextKey() {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.computeSelectPath) {
            return;
        }
        let keyframes = [];
        if (!that.selectProperty) {
            keyframes = this.calcNodeFrames(that.computeSelectPath, true);
        }
        else {
            keyframes = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.computeSelectPath][that.selectProperty.prop].keyFrames;
        }
        if (that.currentFrame > keyframes[keyframes.length - 1].frame) {
            this.updateCurrentFrame(keyframes[keyframes.length - 1].frame);
            return;
        }
        for (const item of keyframes) {
            if (item.frame > that.currentFrame) {
                this.updateCurrentFrame(item.frame);
                return;
            }
        }
    }
    /**
     * 跳转到上一关键帧
     */
    jumpToPrevKey() {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.computeSelectPath) {
            return;
        }
        let keyframes = [];
        if (!that.selectProperty) {
            keyframes = this.calcNodeFrames(that.computeSelectPath, true);
        }
        else {
            keyframes = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.computeSelectPath][that.selectProperty.prop].keyFrames;
        }
        if (that.currentFrame < keyframes[0].frame) {
            this.updateCurrentFrame(keyframes[0].frame);
            return;
        }
        for (let i = keyframes.length - 1; i >= 0; i--) {
            const frame = keyframes[i].frame;
            if (frame < that.currentFrame) {
                this.updateCurrentFrame(frame);
                return;
            }
        }
    }
    // ********************* 菜单栏的相关配置 *********************
    async moveSelectEmbeddedPlayers(offsetFrame) {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.selectEmbeddedPlayerInfo) {
            return;
        }
        const operations = [];
        for (const info of that.selectEmbeddedPlayerInfo) {
            const realOffset = Math.max(info.rawInfo.begin + offsetFrame, 0) - info.rawInfo.begin;
            // 超出临界点，不可再移动
            if (realOffset === 0) {
                return;
            }
            const newDump = {
                ...info.rawInfo,
                begin: info.rawInfo.begin + realOffset,
                end: info.rawInfo.end + realOffset,
            };
            operations.push((0, ipc_event_1.updateEmbeddedPlayer)(this.vm.currentClip, info.rawInfo, newDump));
            Object.assign(info, this.transEmbeddedPlayerDumpToInfo(newDump));
        }
        await (0, ipc_event_1.IApplyOperation)(operations);
    }
    /**
     * 移动选中的关键帧
     * @param offsetFrame
     */
    async moveSelectKeys(offsetFrame, ctrl = false) {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.selectKeyInfo) {
            return;
        }
        // 选中关键帧是其他组件 watch 的对象，要尽量一次性“赋值”，而不是循环的去计算赋值
        const tempSelect = JSON.parse(JSON.stringify(that.selectKeyInfo));
        tempSelect.offsetFrame = tempSelect.offsetFrame || 0;
        const { keyFrames: keyFrameDatas } = tempSelect;
        const frames = [];
        for (let i = 0; i < keyFrameDatas.length; i++) {
            const item = keyFrameDatas[i];
            let newFrame = item.frame + offsetFrame;
            if (newFrame < 0) {
                this.showToast('i18n:animator.move_key_tips.can_not_be_zero');
                return;
            }
            // 新关键帧不在选中的关键帧数据上时，需要校验
            if (!that.selectKeyInfo.keyFrames.find((item) => item.frame === newFrame)) {
                // 校验是否会覆盖现有关键帧
                const param = keyFrameDatas[i];
                const keyFrames = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[param.nodePath][param.prop].keyFrames;
                while (keyFrames.find((item) => item.frame === newFrame)) {
                    // 目前不支持 ctrl/cmd 跳过，快捷键消息不支持传递 evene
                    // let message = '';
                    // if (ctrl && !this.hasShowStick) {
                    //     message = Editor.I18n.t('animator.move_key_tips.move_with_ctrl');
                    // } else if (ctrl && this.hasShowStick) {
                    //     message = Editor.I18n.t('animator.move_key_tips.move_keys_with_ctrl');
                    // } else {
                    //     message = Editor.I18n.t('animator.move_key_tips.should_move_keys_with_ctrl');
                    // }
                    // this.showToast(message);
                    if (!ctrl || this.hasShowStick) {
                        // - 多选关键帧并且会覆盖其他关键帧,
                        // - 单选关键帧并且没有按下 Ctrl 会覆盖其他关键帧时，
                        // 直接退出不允许继续移动
                        return;
                    }
                    // 跳过关键帧时，直接计算好 offsetFrame
                    offsetFrame = offsetFrame > 0 ? offsetFrame + 1 : offsetFrame - 1;
                    newFrame = item.frame + offsetFrame;
                }
            }
            frames.push(newFrame);
            item.frame = newFrame;
            item.x = grid_ctrl_1.gridCtrl.grid.valueToPixelH(item.frame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset;
        }
        if (frames.length === 0) {
            return;
        }
        frames.sort((a, b) => a - b);
        if (offsetFrame > 0) {
            this.showFrameInGrid(frames[frames.length - 1]);
        }
        else {
            this.showFrameInGrid(frames[0]);
        }
        tempSelect.ctrl = ctrl;
        // 集体移动相同关键帧时，该 offsetFrame 才有效
        tempSelect.offsetFrame += offsetFrame;
        that.selectKeyInfo = tempSelect;
        // animationCtrl.callByDebounce('moveKeys');
        await animation_ctrl_1.animationCtrl.moveKeys();
    }
    /**
     * 移动选中的事件关键帧 TODO 转义到 Ctrl
     * @param offsetFrame
     */
    async moveSelectEvents(offsetFrame, ctrl) {
        const that = this.vm;
        const { data, frames } = that.selectEventInfo;
        const movedFrames = [];
        for (const item of data) {
            let newFrame = item.frame + offsetFrame;
            if (newFrame < 0) {
                this.showToast('i18n:animator.move_key_tips.can_not_be_zero');
                return;
            }
            if (!frames.includes(newFrame)) {
                while (animation_ctrl_1.animationCtrl.clipsDump.events.find((item) => item.frame === newFrame)) {
                    // 即将覆盖新关键帧
                    let message = '';
                    if (ctrl && frames.length === 1) {
                        message = 'i18n:animator.move_key_tips.move_with_ctrl';
                    }
                    else if (ctrl && frames.length !== 1) {
                        message = 'i18n:animator.move_key_tips.move_keys_with_ctrl';
                    }
                    else {
                        message = 'i18n:animator.move_key_tips.should_move_keys_with_ctrl';
                    }
                    this.showToast(message);
                    if (!ctrl || frames.length !== 1) {
                        return;
                    }
                    offsetFrame = offsetFrame > 0 ? offsetFrame + 1 : offsetFrame - 1;
                    newFrame = item.frame + offsetFrame;
                }
            }
            movedFrames.push(newFrame);
            item.frame = newFrame;
            item.x = grid_ctrl_1.gridCtrl.grid.valueToPixelH(item.frame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset;
        }
        movedFrames.sort((a, b) => a - b);
        if (offsetFrame > 0) {
            this.showFrameInGrid(movedFrames[frames.length - 1]);
        }
        else {
            this.showFrameInGrid(movedFrames[0]);
        }
        that.selectEventInfo.offsetFrame += offsetFrame;
        await animation_ctrl_1.animationCtrl.callByDebounce('moveEvents');
    }
    // ********************* 绑定事件相关 *********************
    /**
     * 移动关键帧
     * @param event
     * @returns
     */
    onKeyMouseMove(event) {
        const that = this.vm;
        const $target = event.target;
        if (!that.selectKeyInfo) {
            return;
        }
        const tempSelect = JSON.parse(JSON.stringify(that.selectKeyInfo));
        const { startX, keyFrames, location, nodePath } = tempSelect;
        if (Math.abs(startX - event.x) < 0.1) {
            return;
        }
        if (event.altKey) {
            $target.style.cursor = 'copy';
        }
        else {
            $target.style.cursor = 'ew-resize';
        }
        const startFrame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
        let endFrame = grid_ctrl_1.gridCtrl.pageToFrame(startX);
        if (endFrame < 0) {
            endFrame = 0;
        }
        const offsetFrame = startFrame - endFrame;
        if (offsetFrame === 0) {
            return;
        }
        const offset = grid_ctrl_1.gridCtrl.grid.valueToPixelH(startFrame) - grid_ctrl_1.gridCtrl.grid.valueToPixelH(endFrame);
        const frames = [];
        for (const item of keyFrames) {
            if (!item) {
                continue;
            }
            // 在属性轨道上开始拖拽的关键帧，仅可以移动当前选中节点的关键帧数据
            if (location === 'prop' && nodePath && item.nodePath !== nodePath) {
                item.offsetFrame = 0;
                frames.push(item.frame);
                continue;
            }
            const newFrame = item.frame + offsetFrame;
            if (newFrame < 0) {
                return;
            }
            item.x += offset;
            item.frame = newFrame;
            frames.push(newFrame);
        }
        tempSelect.startX += offset;
        tempSelect.offset += offset;
        tempSelect.offsetFrame += offsetFrame;
        if (!global_data_1.Flags.startDragStickInfo) {
            this.updateMouseFrame({ x: event.x, y: event.y, frame: keyFrames[0].frame }, tempSelect.offsetFrame);
        }
        that.selectKeyInfo = tempSelect;
        frames.sort((a, b) => a - b);
        const { start, end } = grid_ctrl_1.gridCtrl.getFrameRang();
        if (frames[0] <= start || frames[frames.length - 1] >= end) {
            this.moveTimeLine(-offset);
        }
    }
    onAuxKeyMouseMove(event) {
        const vm = this.vm;
        const $target = event.target;
        const auxCurveStore = vm.auxCurveStore;
        if (!auxCurveStore.selectKeyInfo) {
            return;
        }
        const tempSelect = JSON.parse(JSON.stringify(auxCurveStore.selectKeyInfo));
        const { startX, keyframes } = tempSelect;
        if (Math.abs(startX - event.x) < 0.1) {
            return;
        }
        if (event.altKey) {
            $target.style.cursor = 'copy';
        }
        else {
            $target.style.cursor = 'ew-resize';
        }
        const startFrame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
        let endFrame = grid_ctrl_1.gridCtrl.pageToFrame(startX);
        if (endFrame < 0) {
            endFrame = 0;
        }
        const offsetFrame = startFrame - endFrame;
        if (offsetFrame === 0) {
            return;
        }
        const offset = grid_ctrl_1.gridCtrl.grid.valueToPixelH(startFrame) - grid_ctrl_1.gridCtrl.grid.valueToPixelH(endFrame);
        const frames = [];
        for (const item of keyframes) {
            if (!item) {
                continue;
            }
            frames.push(item.frame);
            const newFrame = item.frame + offsetFrame;
            if (newFrame < 0) {
                return;
            }
            item.x += offset;
            item.frame = newFrame;
            frames.push(newFrame);
        }
        if (typeof tempSelect.startX === 'number') {
            tempSelect.startX += offset;
        }
        if (typeof tempSelect.offset === 'number') {
            tempSelect.offset += offset;
        }
        if (typeof tempSelect.offset === 'number') {
            tempSelect.offset += offset;
        }
        if (typeof tempSelect.offsetFrame === 'number') {
            tempSelect.offsetFrame += offsetFrame;
        }
        if (!global_data_1.Flags.startDragStickInfo) {
            this.updateMouseFrame({
                x: event.x,
                y: event.y,
                frame: keyframes[0].frame,
            }, tempSelect.offsetFrame);
        }
        auxCurveStore.selectKeyInfo = tempSelect;
        frames.sort((a, b) => a - b);
        const { start, end } = grid_ctrl_1.gridCtrl.getFrameRang();
        if (frames[0] <= start || frames[frames.length - 1] >= end) {
            this.moveTimeLine(-offset);
        }
    }
    onEmbeddedPlayerMouseMove(event) {
        const that = this.vm;
        if (!global_data_1.Flags.startDragEmbeddedPlayerInfo || !that.selectEmbeddedPlayerInfo) {
            return;
        }
        const offset = event.x - global_data_1.Flags.startDragEmbeddedPlayerInfo.startX;
        if (offset === 0) {
            return;
        }
        const $target = event.target;
        global_data_1.Flags.startDragEmbeddedPlayerInfo.offset = offset;
        switch (global_data_1.Flags.startDragEmbeddedPlayerInfo.type) {
            case 'center':
                if (event.altKey) {
                    $target.style.cursor = 'copy';
                }
                else {
                    $target.style.cursor = 'move';
                }
                // TODO 需要检查和现有分组轨道上有没有冲突，出现冲突需要将前面有冲突的顶开（或者放在其他可以放置的分组内）
                that.selectEmbeddedPlayerInfo.forEach((info) => {
                    info.x = info.rawInfo.x + offset;
                });
                break;
            case 'left':
                $target.style.cursor = 'em-resize';
                that.selectEmbeddedPlayerInfo.forEach((info) => {
                    const rawX = info.x;
                    info.x = Math.max(0, info.rawInfo.x + offset);
                    info.width = info.rawInfo.width - (rawX - info.rawInfo.x);
                });
                break;
            case 'right':
                that.selectEmbeddedPlayerInfo.forEach((info) => {
                    info.width = info.rawInfo.width + offset;
                });
                break;
        }
    }
    async onEmbeddedPlayerMouseUp(event) {
        const that = this.vm;
        if (!global_data_1.Flags.startDragEmbeddedPlayerInfo || !that.selectEmbeddedPlayerInfo || !global_data_1.Flags.startDragEmbeddedPlayerInfo.offset || global_data_1.Flags.startDragEmbeddedPlayerInfo.type === 'drop') {
            return;
        }
        const operations = [];
        that.selectEmbeddedPlayerInfo.forEach((info) => {
            operations.push((0, ipc_event_1.updateEmbeddedPlayer)(this.vm.currentClip, this.transEmbeddedPlayerInfoToDump(info, false), this.transEmbeddedPlayerInfoToDump(info, true)));
        });
        await (0, ipc_event_1.IApplyOperation)(operations);
    }
    async onEmbeddedPlayerDrop(event, group) {
        const { value } = JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)) || {};
        event.preventDefault();
        event.stopPropagation();
        const embeddedPlayer = JSON.parse(value);
        const rawEmbededPLayerDump = this.transEmbeddedPlayerInfoToDump(embeddedPlayer, false);
        const offset = event.x - global_data_1.Flags.startDragEmbeddedPlayerInfo.startX;
        embeddedPlayer.x = embeddedPlayer.rawInfo.x + offset;
        embeddedPlayer.group = group;
        const newEmbededPLayerDump = this.transEmbeddedPlayerInfoToDump(embeddedPlayer, true);
        await (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.updateEmbeddedPlayer)(this.vm.currentClip, rawEmbededPLayerDump, newEmbededPLayerDump));
    }
    onKeyMouseUp(event, options) {
        if (((options && options.alt) || event.altKey) && this.vm.selectKeyInfo) {
            const target = (options && options.target) || this.vm.currentFrame;
            animation_ctrl_1.animationCtrl.pasteKey({
                target,
                nodePath: this.vm.selectKeyInfo.keyFrames[0].nodePath,
            }, animation_ctrl_1.animationCtrl.transSelectToCopyKeyInfo());
            return;
        }
        animation_ctrl_1.animationCtrl.moveKeys();
    }
    onAuxKeyMouseup(e) {
        const vm = this.vm;
        const auxCurveStore = vm.auxCurveStore;
        if (auxCurveStore.selectKeyInfo == null) {
            return;
        }
        const selectInfo = auxCurveStore.selectKeyInfo;
        const offset = selectInfo.offsetFrame;
        if (Math.abs(offset) < Number.EPSILON) {
            return;
        }
        animation_ctrl_1.animationCtrl.moveAuxKey(selectInfo.keyframes, offset);
    }
    onEventMouseMove(event) {
        const that = this.vm;
        if (!that.selectEventInfo) {
            return;
        }
        const $target = event.target;
        if (event.altKey) {
            $target.style.cursor = 'copy';
        }
        else {
            $target.style.cursor = 'ew-resize';
        }
        const { startX, data } = that.selectEventInfo;
        const startFrame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
        let endFrame = grid_ctrl_1.gridCtrl.pageToFrame(startX);
        if (endFrame < 0) {
            endFrame = 0;
        }
        const offsetFrame = startFrame - endFrame;
        if (offsetFrame === 0) {
            return;
        }
        const offset = grid_ctrl_1.gridCtrl.grid.valueToPixelH(startFrame) - grid_ctrl_1.gridCtrl.grid.valueToPixelH(endFrame);
        that.selectEventInfo.startX += offset;
        that.selectEventInfo.offset += offset;
        that.selectEventInfo.offsetFrame += offsetFrame;
        for (const dataItem of data) {
            dataItem.x += offset;
            dataItem.frame += offsetFrame;
            if (dataItem.frame < 0) {
                return;
            }
        }
        this.updateMouseFrame({ x: event.x, y: event.y, frame: data[0].frame }, that.selectEventInfo.offsetFrame);
        const { start, end } = grid_ctrl_1.gridCtrl.getFrameRang();
        if (data[0].frame <= start || data[data.length - 1].frame >= end) {
            this.moveTimeLine(-offset);
        }
    }
    onEventMouseUp(event) {
        const frame = grid_ctrl_1.gridCtrl.pageToFrame(event.x + grid_ctrl_1.gridCtrl.startOffset);
        if (event.altKey && this.vm.selectEventInfo) {
            animation_ctrl_1.animationCtrl.pasteEvent(frame, {
                eventsDump: this.vm.selectEventInfo.data,
            });
            return;
        }
        if (this.vm.selectEventInfo && this.vm.selectEventInfo.offsetFrame === 0) {
            return;
        }
        animation_ctrl_1.animationCtrl.moveEvents();
    }
    // 批量取消选中 IEmbeddedPlayerInfo
    unSelectEmbeddedPlayerInfo(embeddedPlayerInfos) {
        embeddedPlayerInfos.forEach((embeddedPlayerInfo) => {
            if (!this.vm.selectEmbeddedPlayerInfo)
                return;
            const inSelectedIndex = this.vm.selectEmbeddedPlayerInfo.findIndex((info) => info.key === embeddedPlayerInfo.key);
            if (inSelectedIndex !== -1) {
                this.vm.selectEmbeddedPlayerInfo.splice(inSelectedIndex, 1);
            }
        });
        if (!this.vm.selectEmbeddedPlayerInfo)
            return;
        Editor.Selection.unselect('animation-embeddedPlayer', Editor.Selection.getSelected('animation-embeddedPlayer'));
        Editor.Selection.select('animation-embeddedPlayer', this.vm.selectEmbeddedPlayerInfo.map((item) => JSON.stringify({
            dump: this.transEmbeddedPlayerInfoToDump(item, false),
            clipUuid: this.vm.currentClip,
            root: animation_ctrl_1.animationCtrl.nodesDump.rawPath,
        })));
    }
    onStartDragSuregion(event, embeddedPlayerInfo) {
        if ((0, utils_1.checkCtrlOrCommand)(event) && this.vm.selectEmbeddedPlayerInfo) {
            const inSelectedIndex = this.vm.selectEmbeddedPlayerInfo.findIndex((info) => info.key === embeddedPlayerInfo.key);
            if (inSelectedIndex === -1) {
                this.vm.selectEmbeddedPlayerInfo.push({
                    ...embeddedPlayerInfo,
                    rawInfo: JSON.parse(JSON.stringify(embeddedPlayerInfo)),
                });
            }
            else {
                this.vm.selectEmbeddedPlayerInfo.splice(inSelectedIndex, 1);
            }
        }
        this.vm.selectEmbeddedPlayerInfo = [{
                ...embeddedPlayerInfo,
                rawInfo: JSON.parse(JSON.stringify(embeddedPlayerInfo)),
            }];
        Editor.Selection.unselect('animation-embeddedPlayer', Editor.Selection.getSelected('animation-embeddedPlayer'));
        Editor.Selection.select('animation-embeddedPlayer', this.vm.selectEmbeddedPlayerInfo.map((item) => JSON.stringify({
            dump: this.transEmbeddedPlayerInfoToDump(item, false),
            clipUuid: this.vm.currentClip,
            root: animation_ctrl_1.animationCtrl.nodesDump.rawPath,
        })));
        global_data_1.Flags.mouseDownName = 'embeddedPlayer';
        global_data_1.Flags.startDragEmbeddedPlayerInfo = {
            startX: event.x,
            // @ts-ignore
            type: event.target.getAttribute('name'),
        };
    }
    /**
     * 缩放关键帧，移动框选控制杆
     * @param event
     * @returns
     */
    onStickMouseMove(event) {
        const that = this.vm;
        if (!global_data_1.Flags.startDragStickInfo || !that.selectKeyInfo) {
            return;
        }
        const offset = event.x - global_data_1.Flags.startDragStickInfo.startX;
        if (offset === 0) {
            return;
        }
        switch (global_data_1.Flags.startDragStickInfo.type) {
            case 'center':
                // 整体移动关键帧
                this.onKeyMouseMove(event);
                // 可能需要的其他处理
                break;
            case 'right':
                {
                    const scale = 1 + offset / global_data_1.Flags.startDragStickInfo.width;
                    const data = global_data_1.Flags.startDragStickInfo.cacheData;
                    const referKey = data[0];
                    for (let i = 1; i < data.length; i++) {
                        const info = data[i];
                        if (info.frame === referKey.frame) {
                            continue;
                        }
                        let x = (info.x - referKey.x) * scale + referKey.x;
                        let frame = grid_ctrl_1.gridCtrl.canvasToFrame(x);
                        // 保证参考关键帧不会被覆盖
                        if (frame === referKey.frame) {
                            frame = referKey.frame + (scale > 1 ? -1 : 1);
                        }
                        x = grid_ctrl_1.gridCtrl.frameToCanvas(frame);
                        this.stickInfo.width = x + 12 - this.stickInfo.left;
                        that.selectKeyInfo.keyFrames[i].offsetFrame = frame - that.selectKeyInfo.keyFrames[i].rawFrame;
                        Object.assign(that.selectKeyInfo.keyFrames[i], { x, frame });
                    }
                    that.updateSelectKey++;
                }
                break;
            case 'left':
                {
                    const scale = offset / global_data_1.Flags.startDragStickInfo.width;
                    const data = global_data_1.Flags.startDragStickInfo.cacheData;
                    const referKey = data[data.length - 1];
                    for (let i = data.length - 2; i >= 0; i--) {
                        const info = data[i];
                        if (info.frame === referKey.frame) {
                            continue;
                        }
                        let x = (referKey.x - info.x) * scale + info.x;
                        let frame = grid_ctrl_1.gridCtrl.canvasToFrame(x);
                        // 保证参考关键帧不会被覆盖
                        if (frame === referKey.frame) {
                            frame = referKey.frame + (scale > 1 ? -1 : 1);
                        }
                        x = grid_ctrl_1.gridCtrl.frameToCanvas(frame);
                        that.selectKeyInfo.keyFrames[i].offsetFrame = frame - that.selectKeyInfo.keyFrames[i].rawFrame;
                        Object.assign(that.selectKeyInfo.keyFrames[i], { x, frame });
                    }
                    that.updateSelectKey++;
                }
                break;
        }
    }
    cancelDebounce() {
        this.debounceUpdateNode.cancel();
        this.debounceFilterNode.cancel();
        this.debounceRefresh.cancel();
    }
    onSceneClose() {
        // cancel all debounced function
        this.cancelDebounce();
    }
    async updateNode(uuid) {
        const vm = this.vm;
        const editInfo = await (0, ipc_event_1.queryAnimationNodeEditInfo)(uuid);
        if (editInfo.state === 'failure' || !editInfo.result) {
            console.error(editInfo.reason);
            return;
        }
        // 处理 selectedId 赋值与 nodeChange 调用存在的时序偏差（异步调用 + throttle）。
        // selectedId 先于 updateNode 调用变化。此时的 selectedId 可能已经变化，若比较 uuid 与 selectedId 不一致，则不更新。
        if (vm.selectedId !== uuid) {
            return;
        }
        const { root, node, aniComp, clipsMenu, defaultClip } = editInfo.result;
        vm.root = root;
        this.updateRoot(node);
        vm.clipsMenu = clipsMenu || [];
        vm.nodeDump = Object.freeze(animation_ctrl_1.animationCtrl.nodesDump ? animation_ctrl_1.animationCtrl.nodesDump.nodes : null);
        vm.aniCompType = aniComp ? aniComp : null;
        // 目前几个更新操作是正交的，可以同时去执行
        await Promise.all([
            (0, ipc_event_1.IqueryPropertiesMenu)(uuid).then((menu) => {
                if (uuid === vm.selectedId) {
                    vm.propertiesMenu = menu;
                }
            }),
            this.updateClips(defaultClip, 'update'),
        ]);
    }
    async updateEditInfo() {
        const that = this.vm;
        const mode = await (0, ipc_event_1.IquerySceneMode)();
        // 原来在动画编辑模式下的，需要查询最新的时间和播放状态
        if (mode === 'animation') {
            const playState = await (0, ipc_event_1.IqueryPlayState)(that.currentClip);
            this.updatePlayState(playState);
            const currentTime = await (0, ipc_event_1.IqueryPlayingClipTime)(that.currentClip);
            this.setCurrentFrame((0, utils_1.timeToFrame)(currentTime, that.sample));
            that.animationMode = true;
        }
        else {
            that.animationMode = false;
            this.updatePlayState(0 /* STOP */);
            this.setCurrentFrame(0);
        }
    }
    /**
     * 检查更新 clip 菜单，返回是否真正更新了 clip 菜单
     * @returns boolean
     */
    async updateClipMenu(clipsMenu) {
        const that = this.vm;
        const clipInfo = clipsMenu || (await (0, ipc_event_1.IqueryclipsMenuInfo)(that.root));
        if (!clipInfo || (clipInfo && clipInfo.clipsMenu && clipInfo.clipsMenu.length === 0)) {
            that.clipsMenu = [];
            this.updateClips(null);
            return true;
        }
        else {
            that.clipsMenu = clipInfo.clipsMenu;
            if (that.currentClip !== clipInfo.defaultClip) {
                // 不能直接拿新的默认 clip 替换，需要查询当前的 clip 在 clip 菜单中是否存在
                const index = clipInfo.clipsMenu.findIndex((item) => {
                    return item.uuid === that.currentClip;
                });
                // 未进入动画编辑模式或者当前编辑的 clip 被移除，以及界面主动发消息时才会切换 clip
                if ((index === -1 && that.animationMode) || !that.animationMode) {
                    if (!clipInfo.defaultClip) {
                        clipInfo.defaultClip = clipInfo.clipsMenu[0].uuid;
                    }
                    await this.updateClips(clipInfo.defaultClip);
                    return true;
                }
            }
        }
        return false;
    }
    async checkUseBakedAnimationBySkeletalAnimation() {
        const that = this.vm;
        return (0, ipc_event_1.IqueryAnimationRootInfo)(that.root)
            .then((rootInfo) => {
            that.showUseBakedAnimationWarn = that.isSkeletonClip && rootInfo.useBakedAnimation;
        });
    }
    checkPropTypeInCopyKeyInfo(type) {
        const copyKeyInfo = animation_ctrl_1.animationCtrl.copyKeyInfo;
        if (!copyKeyInfo) {
            return false;
        }
        for (const item of copyKeyInfo.curvesDump) {
            // 同节点同属性的关键帧才允许粘贴
            // @ts-ignore
            if (item._parentType && item._parentType.value === type.value || item.type.value === type.value) {
                return true;
            }
        }
        return false;
    }
    /**
     * 在属性轨道某个空白位置右键，不符合属性轨道位置的将会返回 false
     * @param x
     * @param y
     */
    onPropTrackMenu(x, y) {
        if (!this.vm.properties) {
            return false;
        }
        // 显示属性轨道右键菜单
        const rect = this.vm.$refs['property-content'].getBoundingClientRect();
        const top = y - rect.top + this.vm.propertyScrollInfo.top;
        const propData = Object.values(this.vm.properties).find((item) => item.top + this.LINE_HEIGHT > top && top > item.top);
        if (!propData) {
            return false;
        }
        const frame = grid_ctrl_1.gridCtrl.pageToFrame(x);
        const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onPropContextMenus, true);
        menuMap.createKey.click = () => {
            animation_ctrl_1.animationCtrl.createKey({
                frame,
                nodePath: propData.nodePath,
                prop: propData.prop,
            });
        };
        menuMap.pasteKey.enabled = this.checkPropTypeInCopyKeyInfo(propData.type);
        menuMap.pasteKey.click = () => {
            animation_ctrl_1.animationCtrl.pasteKey({
                target: frame,
                nodePath: propData.nodePath,
                prop: propData.prop,
            });
        };
        Editor.Menu.popup({
            menu: [
                ...Object.values(menuMap),
                {
                    label: `frame: ${frame}`,
                    enabled: false,
                },
            ],
        });
        return true;
    }
    /**
     * 在节点轨道某个位置右键，不符合属性轨道位置的将会返回 false
     * @param x
     * @param y
     */
    onNodeTrackMenu(x, y) {
        // 显示节点轨道右键菜单
        const rect = this.vm.$refs['node-content'].getBoundingClientRect();
        const top = y - rect.top + this.vm.nodeScrollInfo.top;
        const nodeData = this.vm.nodeDump.find((item) => item.top + this.LINE_HEIGHT > top && top > item.top);
        if (!nodeData) {
            return false;
        }
        return true;
    }
    spacingSelectedKeys(spacingFrame) {
        this.selectKeyUpdateFlag = true;
        animation_ctrl_1.animationCtrl.spacingKeys(spacingFrame);
    }
    onStickMouseUp(event) {
        if (event.button === 2 /* RIGHT */) {
            const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onStickMenus, true);
            menuMap.copyKey.click = () => {
                animation_ctrl_1.animationCtrl.copyKey();
            };
            menuMap.spacingKeys.click = () => {
                this.spacingSelectedKeys(exports.animationEditor.spacingFrame);
            };
            menuMap.removeKey.click = () => {
                animation_ctrl_1.animationCtrl.removeKey();
            };
            // 右键菜单
            Editor.Menu.popup({ menu: Object.values(menuMap) });
            return;
        }
        if (!global_data_1.Flags.startDragStickInfo) {
            return;
        }
        switch (global_data_1.Flags.startDragStickInfo.type) {
            case 'center':
                // 整体移动关键帧(整体移动时，鼠标位置并不一定在关键帧上，不能直接使用位置计算第一个关键帧的位置)
                this.onKeyMouseUp(event, {
                    target: this.stickInfo.leftFrame,
                });
                break;
            case 'right':
                this.onKeyMouseUp(event);
                break;
            case 'left':
                this.onKeyMouseUp(event);
                break;
        }
        global_data_1.Flags.startDragStickInfo = null;
    }
    onStartResize(event, type) {
        const element = event.target;
        if (element && element.tagName === 'UI-INPUT') {
            return;
        }
        global_data_1.Flags.mouseDownName = 'resize';
        global_data_1.Flags.startResizeInfo = {
            type,
            start: 0,
        };
    }
    onResizeMouseMove(event) {
        if (!global_data_1.Flags.startResizeInfo) {
            return;
        }
        const type = global_data_1.Flags.startResizeInfo.type;
        const start = global_data_1.Flags.startResizeInfo.start;
        let end = 0;
        if (type === 'left') {
            end = event.x;
            this.vm.leftResizeMoving = true;
        }
        else {
            end = event.y + 25;
        }
        if (!start) {
            global_data_1.Flags.startResizeInfo.start = end;
            return;
        }
        if (event.x < this.layoutConfig.leftMin || event.x > this.layoutConfig.leftMax) {
            return;
        }
        // 32 为窗口顶上 title 栏 + 边框总和
        const positionY = event.y - 32 - this.vm.$refs['container'].getBoundingClientRect().top;
        if (type !== 'left' && (positionY > this.layoutConfig.topMax || positionY < this.layoutConfig.topMin)) {
            return;
        }
        global_data_1.Flags.startResizeInfo.start = end;
        const typeKey = type + 'Pec';
        const totalLen = type === 'left' ? this.vm.$refs['container'].offsetWidth : this.vm.$refs['container'].offsetHeight;
        // @ts-ignore
        const cur = (parseFloat(this.vm.layout[typeKey]) / 100) * totalLen || 0;
        let res = cur + end - start;
        // FIXME: resize mousemove的逻辑是控制 resize 元素上方区域的高度(property 拖动时控制 node 高度, node 拖动控制 top 高度)，
        // 因为暂时没有修改 property 区域 flex-1 自动撑满的逻辑，因此 property 下方区域的拖动逻辑都是相反的，
        // 即 header 拖动控制的是本区域的高度。
        if (type === 'auxCurve') {
            res = cur - (end - start);
        }
        // @ts-ignore
        res = Editor.Utils.Math.clamp(res, this.layoutConfig[`${type}Min`], this.layoutConfig[`${type}Max`]);
        let newValue = (res / totalLen) * 100;
        newValue = Math.min(100, newValue); // 最大不超过 100%
        // 展开时保留最小折叠高度 (百分比)
        const minExpandHeight = 4;
        if (newValue < minExpandHeight) {
            if (typeKey === 'centerPec') {
                const minus = this.vm.layout[typeKey] - newValue;
                this.vm.layout.topPec -= minus;
                if (this.vm.layout.topPec < minExpandHeight) {
                    this.vm.layout.topPec = minExpandHeight;
                }
            }
            newValue = minExpandHeight;
        }
        if (typeKey === 'topPec') {
            this.vm.layout.centerPec = this.vm.layout.topPec + this.vm.layout.centerPec - newValue;
            if (this.vm.layout.centerPec < minExpandHeight) {
                this.vm.layout.centerPec = minExpandHeight;
            }
        }
        // @ts-ignore
        this.vm.layout[typeKey] = newValue;
    }
    onResizeMouseUp(event) {
        this.vm.leftResizeMoving = false;
        global_data_1.Flags.startResizeInfo = null;
        this.setConfig('layout', this.vm.layout);
        // @ts-ignore
        event.target.style = 'default';
    }
    /**
     * 更新 clip 上选中的数据信息
     */
    checkSelectData() {
        this.checkSelectProperty();
        this.checkSelectEvents();
        this.checkSelectKeys();
        this.checkSelectEmbeddedPlayers();
    }
    checkSelectEmbeddedPlayers() {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !animation_ctrl_1.animationCtrl.nodesDump || !animation_ctrl_1.animationCtrl.clipsDump.groupToEmbeddedPlayers) {
            that.selectEmbeddedPlayerInfo = null;
            Editor.Selection.unselect('animation-embeddedPlayer', Editor.Selection.getSelected('animation-embeddedPlayer'));
            return;
        }
        const embeddedPlayerStrs = Editor.Selection.getSelected('animation-embeddedPlayer');
        if (embeddedPlayerStrs) {
            const selectEmbeddedPlayerInfo = [];
            for (const embeddedPlayerStr of embeddedPlayerStrs) {
                const embeddedPlayer = JSON.parse(embeddedPlayerStr);
                if (embeddedPlayer.clipUuid !== that.currentClip) {
                    Editor.Selection.unselect('animation-embeddedPlayer', embeddedPlayerStr);
                    continue;
                }
                const info = this.transEmbeddedPlayerDumpToInfo(embeddedPlayer.dump);
                selectEmbeddedPlayerInfo.push({
                    ...info,
                    rawInfo: JSON.parse(JSON.stringify(info)),
                });
            }
            selectEmbeddedPlayerInfo.length && (that.selectEmbeddedPlayerInfo = selectEmbeddedPlayerInfo);
        }
        if (!that.selectEmbeddedPlayerInfo) {
            return;
        }
        that.selectEmbeddedPlayerInfo = that.selectEmbeddedPlayerInfo.filter((info) => {
            const newDump = animation_ctrl_1.animationCtrl.clipsDump.groupToEmbeddedPlayers[info.group];
            if (!newDump || !newDump.length) {
                return false;
            }
            const dump = this.transEmbeddedPlayerInfoToDump(info, true);
            const newInfo = newDump.find((item) => {
                return Lodash.isEqual(item, dump);
            });
            if (!newInfo) {
                return false;
            }
            Object.assign(info, newInfo);
            info.rawInfo = JSON.parse(JSON.stringify(newInfo));
            return true;
        });
    }
    /**
     * 检查当前选中属性轨道是否在最新的数据内
     */
    checkSelectProperty() {
        const that = this.vm;
        if (!that.selectProperty || !that.selectPropData || !animation_ctrl_1.animationCtrl.clipsDump || !animation_ctrl_1.animationCtrl.nodesDump) {
            return;
        }
        if (!Object.keys(animation_ctrl_1.animationCtrl.nodesDump.path2uuid).includes(that.selectProperty.nodePath)) {
            that.selectProperty = null;
            return;
        }
        if (!animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.selectProperty.nodePath] ||
            !animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.selectProperty.nodePath][that.selectPropData.prop]) {
            that.selectProperty = null;
        }
    }
    /**
     * 检查当前选中事件帧数据是否在最新的数据内
     */
    checkSelectEvents() {
        const that = this.vm;
        if (!that.selectEventInfo) {
            return;
        }
        if (!animation_ctrl_1.animationCtrl.clipsDump || !animation_ctrl_1.animationCtrl.clipsDump.events) {
            that.selectEventInfo = null;
            return;
        }
        const newFrames = animation_ctrl_1.animationCtrl.clipsDump.events.map((item) => item.frame);
        if (!newFrames.length) {
            that.selectEventInfo = null;
            return;
        }
        const selectedFrames = [];
        for (const frame of that.selectEventInfo.frames) {
            const index = newFrames.indexOf(frame);
            if (index === -1) {
                continue;
            }
            selectedFrames.push(frame);
        }
        if (selectedFrames.length === 0) {
            that.selectEventInfo = null;
        }
        else {
            that.selectEventInfo.frames = selectedFrames;
        }
    }
    /**
     * 检查当前选中关键帧数据是否在最新的数据内
     */
    checkSelectKeys() {
        const that = this.vm;
        if (!that.selectKeyInfo) {
            return;
        }
        if (!animation_ctrl_1.animationCtrl.clipsDump) {
            that.selectKeyInfo = null;
            return;
        }
        const keyFrames = [];
        that.selectKeyInfo.keyFrames.forEach((data, index) => {
            if (!animation_ctrl_1.animationCtrl.clipsDump.pathsDump[data.nodePath] || !animation_ctrl_1.animationCtrl.clipsDump.pathsDump[data.nodePath][data.prop]) {
                return;
            }
            const dataInfo = that.selectKeyInfo.keyFrames[index];
            const frames = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[data.nodePath][data.prop].keyFrames.map((data) => data.frame);
            if (frames.includes(dataInfo.frame)) {
                dataInfo.rawFrame = data.frame;
                delete dataInfo.offsetFrame;
                keyFrames.push(dataInfo);
            }
        });
        if (keyFrames.length === 0) {
            that.selectKeyInfo = null;
            return;
        }
        const sortDump = (0, utils_1.sortKeysToTreeMap)(keyFrames);
        // 重置选中关键帧数据
        Object.assign(that.selectKeyInfo, {
            keyFrames,
            sortDump,
            offsetFrame: 0,
            offset: 0,
            startX: that.selectKeyInfo.startX,
        });
        that.updateSelectKey++;
    }
    resetState() {
        const that = this.vm;
        this.updateClips(null);
        that.animationMode = false;
        that.aniCompType = null;
        that.clipConfig = null;
        that.nodeDump = null;
    }
    /**
     * 根据菜单配置生成对应的编辑器菜单
     * @param menuData
     */
    calcCreatePropMenu(menuData) {
        let result = [];
        if ((0, utils_1.isMenuItem)(menuData)) {
            const menuName = menuData.menuName ? menuData.menuName : menuData.displayName;
            result.push({
                label: menuName,
                enabled: !menuData.disable,
                click: () => {
                    this.createProp(menuData.key);
                },
            });
            return result;
        }
        for (const key of Object.keys(menuData)) {
            const item = menuData[key];
            if ((0, utils_1.isMenuItem)(item)) {
                result = result.concat(this.calcCreatePropMenu(item));
                continue;
            }
            result.push({
                label: key,
                submenu: this.calcCreatePropMenu(item),
            });
        }
        return result;
    }
    /**
     * 创建某个属性轨道
     * @param prop
     * @returns
     */
    async createProp(prop) {
        let multi = false;
        const that = this.vm;
        if (that.selectedIds && that.selectedIds.size > 1) {
            let uuids = Array.from(that.selectedIds);
            // 选中节点可能不在动画节点内
            uuids = uuids.filter((uuid) => {
                return animation_ctrl_1.animationCtrl.nodesDump.uuid2path[uuid];
            });
            if (uuids.length > 1) {
                const result = await Editor.Dialog.info(Editor.I18n.t('animator.is_add_prop_multi.title'), {
                    buttons: [
                        Editor.I18n.t('animator.is_add_prop_multi.add_to_current'),
                        Editor.I18n.t('animator.is_add_prop_multi.add_to_all'),
                    ],
                    default: 0,
                    cancel: -1,
                });
                if (result.response === -1) {
                    return;
                }
                multi = !!result.response;
            }
        }
        animation_ctrl_1.animationCtrl.createProp({ prop: prop }, multi);
    }
    async updateSelectedId() {
        const that = this.vm;
        if (!that.selectedId && that.animationMode) {
            return;
        }
        if (!that.selectedId) {
            that.root = '';
            this.resetState();
            that.propertiesMenu = null;
        }
        else {
            that.propertiesMenu = await (0, ipc_event_1.IqueryPropertiesMenu)(that.selectedId);
        }
        that.properties = this.calcProperty();
        this.jumpToSelectedNode();
    }
    jumpToSelectedNode() {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.nodesDump) {
            return;
        }
        const nodesDump = animation_ctrl_1.animationCtrl.nodesDump.nodesDump || animation_ctrl_1.animationCtrl.nodesDump.nodes;
        const index = nodesDump.findIndex((item) => {
            return item.uuid === that.selectedId && typeof item.listIndex === 'number';
        });
        if (index === -1) {
            return;
        }
        // 将节点列表滚动到中间位置
        const selectHeight = (nodesDump[index].listIndex + 1) * this.LINE_HEIGHT;
        const { top, height } = that.nodeScrollInfo;
        if (selectHeight - top > height || selectHeight - top < 0) {
            // 计算的最终 top 值存在时都要 + this.LINE_HEIGHT 避免在底部显示不全
            that.nodeScrollInfo.top = Editor.Utils.Math.clamp(selectHeight - height / 2, 0, (nodesDump.length + 1) * this.LINE_HEIGHT - height);
            this.calcDisplayClips();
        }
    }
    // 计算框选的数据信息
    calcBoxStyle() {
        const vm = this.vm;
        if (!vm.boxInfo || !vm.boxInfo.type || vm.lock) {
            return null;
        }
        const { startX, startY, type, x, y } = vm.boxInfo;
        const point = grid_ctrl_1.gridCtrl.pageToCtrl(x, y);
        // 先把鼠标移动的点控制转化为当前与i内需框选的范围之内
        // @ts-ignore
        const { offsetTop, offsetHeight, offsetWidth } = vm.$refs[`${type}-content`];
        const endX = Editor.Utils.Math.clamp(point.x, 0, offsetWidth);
        const endY = Editor.Utils.Math.clamp(point.y, offsetTop, offsetTop + offsetHeight);
        const w = startX - endX;
        const h = startY - endY;
        // 宽高一个为 0 返回
        if (!w || !h) {
            return null;
        }
        const origin = {};
        if (w > 0 && h > 0) {
            // 往左上角移动
            origin.x = endX;
            origin.y = endY - offsetTop;
        }
        else if (w < 0 && h < 0) {
            // 右下角移动
            origin.x = startX;
            origin.y = startY - offsetTop;
        }
        else if (w < 0 && h > 0) {
            // 左下角
            origin.x = startX;
            origin.y = endY - offsetTop;
        }
        else if (w > 0 && h < 0) {
            // 右下角
            origin.x = endX;
            origin.y = startY - offsetTop;
        }
        vm.boxData = {
            origin,
            w: Math.abs(w),
            h: Math.abs(h),
            type: vm.boxInfo.type,
        };
        return {
            top: `${origin.y}px`,
            left: `${origin.x}px`,
            right: `${Math.round(offsetWidth - origin.x - Math.abs(w))}px`,
            bottom: `${Math.round(offsetHeight - origin.y - Math.abs(h))}px`,
        };
    }
    updatePlayState(state) {
        const that = this.vm;
        switch (state) {
            case 0 /* STOP */:
                that.animationState = 'stop';
                this.aniPlayTask && cancelAnimationFrame(this.aniPlayTask);
                this.checkCurrentTime();
                break;
            case 1 /* PLAY */:
                if (animation_ctrl_1.animationCtrl.animationState !== 'play') {
                    console.debug(`Invalid animation state change. (${animation_ctrl_1.animationCtrl.animationState} -> play))`);
                    break;
                }
                if (that.animationState !== 'play') {
                    that.animationState = 'play';
                    this.runPointer();
                }
                break;
            case 2 /* PAUSE */:
                that.animationState = 'pause';
                this.aniPlayTask && cancelAnimationFrame(this.aniPlayTask);
                break;
        }
    }
    async checkCurrentTime() {
        const that = this.vm;
        const time = await (0, ipc_event_1.IqueryPlayingClipTime)(that.currentClip);
        const newFrame = (0, utils_1.timeToFrame)(time, that.sample);
        if (newFrame === that.currentFrame) {
            return;
        }
        this.setCurrentFrame(newFrame);
    }
    // 更新根节点数据
    updateRoot(nodeInfo) {
        const that = this.vm;
        // 当前节点未添加动画组件
        // const dump = await Editor.Message.request('scene', 'query-node-tree', uuid);
        // if (!dump) {
        //     return;
        // }
        if (!nodeInfo) {
            return;
        }
        // 根节点名称为空
        if (nodeInfo.name === '' || nodeInfo.isScene) {
            that.selectedId = '';
            that.root = '';
            that.nodeDump = null;
            animation_ctrl_1.animationCtrl.clipsDump = null;
            animation_ctrl_1.animationCtrl.nodesDump = null;
            return;
        }
        animation_ctrl_1.animationCtrl.nodesDump = (0, utils_1.formatNodeDump)(nodeInfo);
        // that.active = nodeInfo.active;
        // if (!nodeInfo.active) {
        that.nodeDump = JSON.parse(JSON.stringify(animation_ctrl_1.animationCtrl.nodesDump.nodes));
        //     return;
        // }
    }
    // 更新 clip 数据
    async updateClips(clipInfo, type) {
        const that = this.vm;
        // 当前编辑 clip 不存在需要退出动画编辑模式
        if (that.nodeDump && !that.active) {
            this.clearClips();
            return;
        }
        // 当前编辑 clip 不存在需要退出动画编辑模式
        // FIXME: 由于 scene close 与 node change 事件的相互作用，导致在退出动画编辑模式时，会走入下方 queryClipDump 的分支，
        // 而此时 root，currentClip 都为空。暂时通过增加判断规避，本质上是异步时序逻辑不够健壮
        if (!clipInfo || that.root === '') {
            // console.warn(`Root(${that.root}) or clipInfo(${clipInfo}) is empty!`);
            this.clearClips();
            return;
        }
        let clipDump = undefined;
        clip_cache_1.animationClipCacheManager.cacheClipDump(that.root, that.currentClip);
        if (typeof clipInfo === 'string') {
            if (that.currentClip === clipInfo && type !== 'update') {
                return;
            }
            console.time('IqueryClipDump');
            clipDump = await (0, ipc_event_1.IqueryClipDump)(that.root, clipInfo);
            console.timeEnd('IqueryClipDump');
            if (!clipDump && !global_data_1.Flags.sceneReady) {
                exports.animationEditor.refreshTask++;
                return;
            }
            if (!clipDump) {
                console.warn(`Get animation clip data failed! node ${that.root}, clip ${that.currentClip}`);
                this.clearClips();
                return;
            }
            // 只有动画数据获取成功后才能更新当前选中 clip
            that.currentClip = clipInfo;
        }
        if (clipDump) {
            animation_ctrl_1.animationCtrl.clipsDump = Object.assign((0, utils_1.formatClipDump)(clipDump), { uuid: that.currentClip });
            if (clipDump.sample !== grid_ctrl_1.gridCtrl.grid?.sample) {
                grid_ctrl_1.gridCtrl.grid.sample = clipDump.sample;
                grid_ctrl_1.gridCtrl.grid.render();
                this.renderTimeAxis();
                // 更新当前控制杆关键帧的显示
            }
            Object.keys(animation_ctrl_1.animationCtrl.clipConfig).forEach((key) => {
                // @ts-ignore
                animation_ctrl_1.animationCtrl.clipConfig[key] = animation_ctrl_1.animationCtrl.clipsDump[key] ?? animation_ctrl_1.animationCtrl.clipConfig[key];
            });
            that.clipConfig = JSON.parse(JSON.stringify(animation_ctrl_1.animationCtrl.clipConfig));
            if (that.clipConfig && that.clipConfig.duration) {
                const newMin = Math.min(that.$refs.chart.offsetWidth / (that.clipConfig.duration * that.clipConfig.sample * 2), this.gridCtrl.grid.xMinScale);
                const newMax = Math.max(that.clipConfig.duration * that.clipConfig.sample, this.gridCtrl.grid.xMaxScale);
                this.gridCtrl.grid.updateScale(newMin, newMax);
                // TODO 可在编辑器内提供一键恢复到最佳缩放比例（可以看见全部关键帧）
                // 可以提供 slider 组件控制缩放比例
                // animationEditor.gridCtrl.grid!.xAxisScale = animationEditor.scaleRange.min;
                // animationEditor.gridCtrl.grid!.render();
            }
            that.isSkeletonClip = animation_ctrl_1.animationCtrl.clipsDump.isSkeleton === true;
            that.showUseBakedAnimationWarn = that.isSkeletonClip && animation_ctrl_1.animationCtrl.clipsDump.useBakedAnimation;
            that.expandLayout.auxiliaryCurve = that.isSkeletonClip; // 骨骼动画默认展开
            await that.calcSelectProperty(null, true);
        }
        this.calcEventsDump();
        this.calcNodes();
        this.calcDisplayClips();
        that.properties = this.calcProperty();
        this.calcAuxiliaryCurves();
        this.checkSelectData();
        that.updateKeyFrame++;
    }
    /**
     * 当前无动画数据，清空数据状态
     */
    clearClips() {
        const that = this.vm;
        const auxCurveStore = that.auxCurveStore;
        that.currentClip = '';
        animation_ctrl_1.animationCtrl.exit();
        animation_ctrl_1.animationCtrl.clipsDump = null;
        that.clipConfig = null;
        that.eventsDump = null;
        this.calcDisplayClips();
        that.properties = this.calcProperty();
        auxCurveStore.reset();
        that.embeddedPlayerGroups = [];
        this.checkSelectData();
        that.updateKeyFrame++;
    }
    calcProperty() {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump || !that.computeSelectPath || !grid_ctrl_1.gridCtrl.grid) {
            return null;
        }
        let data = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.computeSelectPath];
        if (!data) {
            return null;
        }
        data = JSON.parse(JSON.stringify(data));
        let i = 0;
        Object.keys(data).forEach((name, index) => {
            const propData = data[name];
            let parentData = propData;
            // data[name]
            if (typeof data[name].parentPropKey === 'string') {
                parentData = data[data[name].parentPropKey];
                const childIndex = parentData.partKeys.findIndex((key) => key === propData.prop);
                if (childIndex !== -1 && propData.isCurveSupport) {
                    propData.color = exports.CurveColorList[childIndex];
                }
                // 初始化折叠展开信息记录
                if (that.expandInfo[parentData.prop] !== true) {
                    that.expandInfo[parentData.prop] = false;
                    data[name].hidden = true;
                }
                else {
                    i++;
                }
            }
            else {
                i++;
                if (propData.type && propData.isCurveSupport) {
                    propData.color = exports.CurveColorList[3];
                }
            }
            data[name].index = Math.max(0, i - 1);
            // 计算轨道高度
            data[name].top = (i - 1) * this.LINE_HEIGHT;
            // 分量轨道不在属性菜单内，需要使用父轨道信息判断是否 missing
            if (that.propertiesMenu && !(0, utils_1.checkPropertyInMenu)(parentData, that.propertiesMenu)) {
                // 属性丢失
                data[name].missing = true;
            }
            // @ts-ignore
            propData.keyFrames
                = Object.freeze(calcFrames(propData.keyFrames, that.$refs.chart.offsetWidth, this.imageCCTypes.includes(propData.type && propData.type.value)));
        });
        return data;
    }
    calcAuxiliaryCurves() {
        const auxCurveStore = this.vm.auxCurveStore;
        auxCurveStore.calcCurves(animation_ctrl_1.animationCtrl.clipsDump?.displayAuxiliaryCurves ?? [], this.vm.$refs.chart.offsetWidth);
        auxCurveStore.forceDumpUpdate();
    }
    // 计算显示的 event 位置
    calcEventsDump() {
        const that = this.vm;
        let result = [];
        if (animation_ctrl_1.animationCtrl.clipsDump && grid_ctrl_1.gridCtrl.grid) {
            result = animation_ctrl_1.animationCtrl.clipsDump.events.map((item) => {
                item.x = grid_ctrl_1.gridCtrl.grid.valueToPixelH(item.frame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset;
                return item;
            });
        }
        // @ts-ignore
        return (that.eventsDump = Object.freeze(result));
    }
    // 融合节点数据与 clip 数据
    calcNodes() {
        if (!animation_ctrl_1.animationCtrl.nodesDump) {
            return null;
        }
        if (!animation_ctrl_1.animationCtrl.clipsDump) {
            return;
        }
        const paths = JSON.parse(JSON.stringify(Object.keys(animation_ctrl_1.animationCtrl.nodesDump.path2uuid)));
        animation_ctrl_1.animationCtrl.nodesDump.nodesDump = JSON.parse(JSON.stringify(animation_ctrl_1.animationCtrl.nodesDump.nodes));
        function addNodeTemplate(path, missing = false) {
            const matchs = path.match(/\//g);
            if (!matchs) {
                return;
            }
            const times = matchs.length;
            let index = paths.findIndex((item) => {
                if (item.match(/\//g)) {
                    return item.match(/\//g).length === times;
                }
                return false;
            });
            const nameMatchs = path.match(/\/([^/]*)$/);
            if (!nameMatchs) {
                return;
            }
            // 丢失节点与根节点同级时，放置在根节点之后
            if (index === 0) {
                index = 1;
            }
            // 未找到与丢失节点同级节点时，将丢失节点直接放置在节点最后
            if (index === -1) {
                // 需要补全父节点显示在界面上
                index = paths.length;
                const parentNodes = path.match(/\/([^/]+)/g);
                if (parentNodes && !missing) {
                    let currentPath = '';
                    for (const name of parentNodes) {
                        currentPath += name;
                        if (paths.includes(currentPath)) {
                            continue;
                        }
                        addNodeTemplate(currentPath, true);
                    }
                    return;
                }
            }
            // 找到与丢失节点同级节点，则直接放在该同级节点之后
            paths.splice(index, 0, path);
            animation_ctrl_1.animationCtrl.nodesDump.nodesDump.splice(index, 0, {
                indent: times * 2,
                path,
                name: nameMatchs[1],
                uuid: '',
                keyFrames: [],
                top: 0,
                rawIndex: index,
                listIndex: index,
            });
            return;
        }
        // 处理丢失节点数据
        for (const path of Object.keys(animation_ctrl_1.animationCtrl.clipsDump.pathsDump)) {
            if (paths.indexOf(path) !== -1) {
                continue;
            }
            addNodeTemplate(path);
        }
    }
    // 更新现有的滚动范围内的显示节点数据（包括关键帧）
    calcDisplayNodes() {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.nodesDump) {
            that.nodeDump = null;
            return;
        }
        const nodesDump = animation_ctrl_1.animationCtrl.nodesDump.nodesDump || animation_ctrl_1.animationCtrl.nodesDump.nodes;
        const result = [];
        // 记录实际需要参与判断是否在可视区域的节点 index，滚动条位置是针对过滤后节点的位置计算而不是全部节点
        let listIndex = -1;
        const hasFilter = that.filterInvalid || that.filterName;
        nodesDump.forEach((item, index) => {
            delete item.listIndex;
            delete item.top;
            delete item.rawIndex;
            if (hasFilter) {
                item.hidden = true;
                if (that.filterName && !new RegExp(that.filterName, 'i').test(item.name)) {
                    return;
                }
                if (that.filterInvalid && (!item.keyFrames || !item.keyFrames.length)) {
                    return;
                }
                item.hidden = false;
                listIndex++;
            }
            else {
                listIndex = index;
            }
            const offsetHeight = listIndex * this.LINE_HEIGHT - that.nodeScrollInfo.top;
            item.top = listIndex * this.LINE_HEIGHT;
            item.rawIndex = index;
            item.listIndex = listIndex;
            if (offsetHeight > -this.LINE_HEIGHT && offsetHeight < that.nodeScrollInfo.height + this.LINE_HEIGHT) {
                result.push(item);
                item.hidden = false;
            }
        });
        const nodesHeight = hasFilter ? listIndex * this.LINE_HEIGHT : nodesDump.length * this.LINE_HEIGHT;
        that.nodesHeight = Math.floor(nodesHeight);
        animation_ctrl_1.animationCtrl.nodesDump.displayNodesDump = result;
        that.nodeDump = result;
        if (Math.abs(that.nodeScrollInfo.top - that.$refs.nodes.scrollTop) > this.LINE_HEIGHT) {
            that.$refs.nodes.scrollTop = that.nodeScrollInfo.top;
        }
    }
    // 更新现有的显示的属性轨道数据
    calcDisplayClips() {
        const that = this.vm;
        if (!that.nodeDump || !animation_ctrl_1.animationCtrl.nodesDump || !animation_ctrl_1.animationCtrl.clipsDump || !animation_ctrl_1.animationCtrl.nodesDump.nodesDump) {
            that.clipConfig = null;
            this.calcDisplayNodes();
            return;
        }
        this.calcDisplayEmbeddedPlayers();
        // TODO showAnimEmbeddedPlayer = true 时这段理论上是多余的
        const result = Object.create(null);
        animation_ctrl_1.animationCtrl.nodesDump.nodesDump.forEach((item) => {
            result[item.path] = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[item.path];
            if (!item.disabled && result[item.path]) {
                item.keyFrames = Object.freeze(JSON.parse(JSON.stringify(this.calcNodeFrames(item.path))));
            }
        });
        that.nodeDump = animation_ctrl_1.animationCtrl.nodesDump.nodesDump;
        animation_ctrl_1.animationCtrl.clipsDump.displayClipsDump = result;
        this.calcDisplayNodes();
    }
    calcDisplayEmbeddedPlayers() {
        if (!animation_ctrl_1.animationCtrl.clipsDump || !animation_ctrl_1.animationCtrl.clipsDump.groupToEmbeddedPlayers || !animation_ctrl_1.animationCtrl.clipsDump.embeddedPlayerGroups) {
            return {};
        }
        const embeddedPlayerGroups = [];
        animation_ctrl_1.animationCtrl.clipsDump.embeddedPlayerGroups.forEach((group) => {
            let embeddedPlayers = [];
            if (animation_ctrl_1.animationCtrl.clipsDump.groupToEmbeddedPlayers[group.key]) {
                embeddedPlayers = animation_ctrl_1.animationCtrl.clipsDump.groupToEmbeddedPlayers[group.key].map((embeddedPlayer) => this.transEmbeddedPlayerDumpToInfo(embeddedPlayer));
            }
            embeddedPlayerGroups.push({
                name: group.name,
                type: group.type,
                key: group.key,
                embeddedPlayers,
                menuInfo: utils_1.EmbeddedPlayerMenuMap[group.type],
            });
        });
        this.vm.embeddedPlayerGroups = embeddedPlayerGroups;
        return embeddedPlayerGroups;
    }
    /**
     * 计算对应节点处的关键帧数据
     * @param path
     */
    calcNodeFrames(path, sort = false) {
        const that = this.vm;
        if (!animation_ctrl_1.animationCtrl.clipsDump) {
            return [];
        }
        const data = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[path];
        if (!data) {
            return [];
        }
        let result = [];
        for (const name of Object.keys(data)) {
            const keyFrames = calcFrames(data[name].keyFrames, that.$refs.chart.offsetWidth, false);
            result = result.concat(keyFrames);
        }
        if (sort && result.length !== 0) {
            result.sort((a, b) => {
                return a.frame - b.frame;
            });
        }
        return result;
    }
    transEmbeddedPlayerDumpToInfo(embeddedPlayerDump, x) {
        x = typeof x === 'number' ? x : grid_ctrl_1.gridCtrl.frameToCanvas(embeddedPlayerDump.begin);
        return {
            x,
            width: grid_ctrl_1.gridCtrl.frameToCanvas(embeddedPlayerDump.end) - x,
            reconciledSpeed: embeddedPlayerDump.reconciledSpeed,
            playable: embeddedPlayerDump.playable,
            group: embeddedPlayerDump.group,
            displayName: embeddedPlayerDump.displayName,
            key: (0, utils_1.calcEmbeddedPlayerKey)(embeddedPlayerDump),
            begin: embeddedPlayerDump.begin,
            end: embeddedPlayerDump.end,
        };
    }
    calcEmbeddedPlayers(embeddedPlayersDump, width) {
        const embeddedPlayers = [];
        embeddedPlayersDump.forEach((embeddedPlayer) => {
            const begin = grid_ctrl_1.gridCtrl.frameToCanvas(embeddedPlayer.begin);
            const end = grid_ctrl_1.gridCtrl.frameToCanvas(embeddedPlayer.end);
            const distanceBegin = getDistance(begin, width);
            const distanceEnd = getDistance(end, width);
            // 区段任意帧在画布内即可
            if (distanceBegin === 0 || distanceEnd === 0) {
                embeddedPlayers.push(this.transEmbeddedPlayerDumpToInfo(embeddedPlayer, begin));
                return;
            }
        });
        return embeddedPlayers;
    }
    transEmbeddedPlayerInfoToDump(info, hasMove) {
        return {
            begin: hasMove ? grid_ctrl_1.gridCtrl.canvasToFrame(info.x) : info.begin,
            end: hasMove ? grid_ctrl_1.gridCtrl.canvasToFrame(info.x + info.width) : info.end,
            reconciledSpeed: info.reconciledSpeed,
            playable: info.playable,
            group: info.group,
            displayName: info.displayName,
        };
    }
    // 刷新
    async _refresh() {
        const that = this.vm;
        // if (!that.$refs.right) {
        //     Flags.domReady = false;
        //     return;
        // }
        const size = {
            w: that.$refs.right.offsetWidth,
            h: that.$refs.right.offsetHeight,
        };
        // 只要动画编辑器此时获取不到尺寸信息就直接返回，后续会有 resize\show 消息来重新进入 refresh 函数
        if (!(size.w && size.h)) {
            global_data_1.Flags.domReady = false;
            return;
        }
        // 主要为了避免多次调用 refresh 函数
        if (!this.refreshTask &&
            global_data_1.Flags.domReady &&
            that.$refs.gridCanvas.width === size.w &&
            that.$refs.gridCanvas.height === size.h) {
            that.loading = '';
            return;
        }
        Editor.Metrics.trackTimeStart('animator:view-refresh');
        that.loading = 'init_animation_data';
        global_data_1.Flags.domReady = true;
        this.updateScrollInfo(size);
        requestAnimationFrame(async () => {
            this.updateScrollInfo(size);
        });
        // 初始化
        const uuid = Editor.Selection.getLastSelected('node');
        // 刷新需要判断是否已在动画编辑模式下
        const mode = await (0, ipc_event_1.IquerySceneMode)();
        mode === 'animation' ? (that.animationMode = true) : (that.animationMode = false);
        await this.vmInit();
        that.wrapModeList = await Editor.Message.request('scene', 'query-enum-list-with-path', 'AnimationClip.WrapMode');
        that.wrapModeList.forEach((item) => {
            // @ts-ignore
            item.tip = Editor.I18n.t(`animator.animationCurve.WrapMode.${item.name}.tip`) || item.name;
            item.name = Editor.I18n.t(`animator.animationCurve.WrapMode.${item.name}.label`) || item.name;
        });
        if (uuid) {
            console.time('updateNode');
            await this.updateNode(uuid);
            console.timeEnd('updateNode');
            await this.updateEditInfo();
        }
        else {
            if (that.animationMode) {
                const { rootid, clipid } = await (0, ipc_event_1.IgetEditAnimationInfo)();
                const dump = await Editor.Message.request('scene', 'query-node-tree', rootid);
                console.time('updateRoot');
                await this.updateRoot(dump);
                console.timeEnd('updateRoot');
                Editor.Metrics.trackTimeStart('animator:update-clips-data');
                await this.updateClips(clipid);
                Editor.Metrics.trackTimeEnd('animator:update-clips-data', { output: true, label: `animator:update-clips-data ${clipid}` });
                console.timeEnd('updateClips');
            }
            else {
                this.resetState();
            }
        }
        that.loading = '';
        global_data_1.Flags.sceneReady = true;
        this.refreshTask = 0;
        Editor.Metrics.trackTimeEnd('animator:view-refresh', { output: true });
    }
    resize() {
        // @ts-ignore
        const that = this.vm;
        if (!that.$refs.right) {
            global_data_1.Flags.domReady = false;
            return;
        }
        const { offsetWidth, offsetHeight } = that.$refs.right;
        that.$refs.chart.style.width = `${offsetWidth}px`;
        const size = {
            w: that.$refs.right.offsetWidth,
            h: that.$refs.right.offsetHeight,
        };
        grid_ctrl_1.gridCtrl.grid && grid_ctrl_1.gridCtrl.grid.resize(offsetWidth, offsetHeight);
        requestAnimationFrame(() => {
            this.updateScrollInfo(size);
            this.calcDisplayClips();
            this.calcDisplayNodes();
            this.vm.updateKeyFrame++;
        });
    }
    updateScrollInfo(size) {
        const that = this.vm;
        const auxCurveStore = that.auxCurveStore;
        // TODO 优化不应该每个 info 都填写一样的 size
        that.nodeScrollInfo = {
            size,
            height: that.$refs['node-content'].offsetHeight,
            top: that.$refs.nodes.scrollTop,
        };
        that.propertyScrollInfo = {
            size,
            height: that.$refs['property-content'].offsetHeight,
            top: that.$refs.property.scrollTop,
        };
        that.embeddedPlayerScrollInfo = {
            size,
            height: that.$refs['embeddedPlayer-content'].offsetHeight,
            top: that.$refs.embeddedPlayer.scrollTop,
        };
        auxCurveStore.scrollInfo = {
            size,
            height: 0,
            top: 0,
        };
    }
    async onEnter() {
        clip_cache_1.animationClipCacheManager.animationMode = true;
        // const clipDump = await animationClipCacheManager.queryLatestCache(this.vm.currentClip);
        // if (clipDump) {
        //     // 应用动画数据
        //     await Editor.Message.request('scene', 'execute-scene-script', {
        //         name: 'animator',
        //         method: 'restoreFromDump',
        //         args: [this.vm.root, this.vm.currentClip, clipDump],
        //     });
        // }
        this.vm.animationMode = true;
    }
    /**
     * 被动退出动画编辑模式后(一些界面编辑状态的重置)
     */
    onExit() {
        this.closeMaskPanel();
        this.vm.animationMode = false;
        clip_cache_1.animationClipCacheManager.animationMode = false;
        this.vm.moveNodePath = '';
        this.vm.selectKeyInfo = null;
        this.vm.selectEventInfo = null;
        this.vm.selectProperty = null;
        this._curveData = null;
        if (this.vm.showAnimCurve) {
            this.vm.toggleAniCurve();
        }
        this.updateCurrentFrame(0);
        animation_ctrl_1.animationCtrl.clear();
    }
    /**
     * 关闭动画编辑器监听事件清理
     */
    close() {
        // 清理注册的全局事件
        (0, utils_1.removeEventListener)(document, 'mouseup', this.onMouseUp);
        (0, utils_1.removeEventListener)(document, 'mousemove', this.onMouseMove);
        // 取消未执行的防抖函数
        this.cancelDebounce();
    }
    async selectCacheClipToApply() {
        const clipDump = await clip_cache_1.animationClipCacheManager.selectClipCache(this.vm.currentClip);
        if (clipDump) {
            // 应用动画数据
            await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'animator',
                method: 'restoreFromDump',
                args: [this.vm.root, this.vm.currentClip, clipDump],
            });
        }
    }
}
exports.animationEditor = new AnimationEditor();
/**
 * 获取 x 偏移画布之外的距离
 * > 0 则为超过视窗左边的距离
 * < 0 则为少于视窗右边的距离
 * @param x
 */
function getDistance(x, width) {
    if (x + grid_ctrl_1.gridCtrl.grid.xAxisOffset > width) {
        return x + grid_ctrl_1.gridCtrl.grid.xAxisOffset - width;
    }
    if (x + grid_ctrl_1.gridCtrl.grid.xAxisOffset < 0) {
        return x + grid_ctrl_1.gridCtrl.grid.xAxisOffset;
    }
    return 0;
}
// 计算关键帧数据的实际显示位置，同时过滤不在显示区域内的关键帧数据
function calcFrames(keyFrames, width, isImage) {
    if (!keyFrames) {
        return [];
    }
    const result = [];
    function formatKey(keyframe) {
        if (isImage) {
            return {
                x: keyframe.x,
                prop: keyframe.prop,
                frame: keyframe.frame,
                // 部分数据可能出现类似是 unknow 的空值
                value: keyframe.dump.value && keyframe.dump.value.uuid,
            };
        }
        return {
            x: keyframe.x,
            prop: keyframe.prop,
            frame: keyframe.frame,
        };
    }
    const distanceInfo = {
        maxNegative: {
            distance: -Infinity,
            index: -1,
        },
        minPositive: {
            index: -1,
            distance: Infinity,
        },
    };
    keyFrames.forEach((item, index) => {
        item.x = grid_ctrl_1.gridCtrl.frameToCanvas(item.frame);
        const distance = getDistance(item.x, width);
        if (distance === 0) {
            result.push(formatKey(item));
            return;
        }
        if (distance > 0 && distanceInfo.minPositive.distance > distance) {
            distanceInfo.minPositive.distance = distance;
            distanceInfo.minPositive.index = index;
        }
        else if (distance < 0 && distanceInfo.maxNegative.distance < distance) {
            distanceInfo.maxNegative.distance = distance;
            distanceInfo.maxNegative.index = index;
        }
    });
    // 当关键帧都在画面之外时，需要显示在画面内最近的两个关键帧及其线条
    if (result.length !== keyFrames.length) {
        distanceInfo.maxNegative.index !== -1 && result.push(formatKey(keyFrames[distanceInfo.maxNegative.index]));
        distanceInfo.minPositive.index !== -1 && result.push(formatKey(keyFrames[distanceInfo.minPositive.index]));
    }
    return result;
}
exports.calcFrames = calcFrames;
/**
 * 判断某个节点上是否挂载了动画数据
 * @param nodePath
 */
function hasKeyData(nodePath) {
    if (!animation_ctrl_1.animationCtrl.clipsDump || !animation_ctrl_1.animationCtrl.clipsDump.pathsDump[nodePath]) {
        return false;
    }
    for (const dump of Object.values(animation_ctrl_1.animationCtrl.clipsDump.pathsDump[nodePath])) {
        if (dump.keyFrames.length !== 0) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS9wYW5lbC9zaGFyZS9hbmltYXRpb24tZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG1DQUF5QztBQUN6Qyw2REFBa0M7QUF5QmxDLG9DQXFCa0I7QUFDbEIscURBQWlEO0FBQ2pELHFEQUE2RTtBQUM3RSw2Q0FBeUQ7QUFDekQsK0NBQThDO0FBQzlDLDJDQUE2RDtBQUM3RCwyQ0F5QnFCO0FBQ3JCLHlDQUE4TDtBQWVqTCxRQUFBLGNBQWMsR0FBRywwRkFBc0UsQ0FBQztBQUVyRyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFakMsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLEVBQUU7SUFDN0IsT0FBTztRQUNILE1BQU0sRUFBRSxDQUFDO1FBQ1QsTUFBTSxFQUFFLEdBQUc7UUFFWCxPQUFPLEVBQUUsR0FBRztRQUNaLE9BQU8sRUFBRSxHQUFHO1FBRVosU0FBUyxFQUFFLENBQUM7UUFDWixTQUFTLEVBQUUsR0FBRztRQUVkLFdBQVcsRUFBRSxDQUFDO1FBQ2QsV0FBVyxFQUFFLEdBQUc7UUFFaEIsUUFBUSxFQUFFLEdBQUc7S0FDaEIsQ0FBQztBQUNOLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBTSxlQUFlO0lBQXJCO1FBQ1csVUFBSyxHQUFRLElBQUksQ0FBQztRQUNULGdCQUFXLEdBQVcsRUFBRSxDQUFDO1FBQ3pDLE1BQU07UUFDVSxlQUFVLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuQyxpQkFBWSxHQUFhLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQy9GLHlCQUFvQixHQUFhLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxD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LE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsOEJBQWEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDM0UsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDN0IsT0FBTyxJQUFJLENBQUM7U0FDZjtLQUNKO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNsYW1wLCBkZWJvdW5jZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBFZGl0b3JBbmltYXRpb25DbGlwRHVtcCwgSUNsaXBJbmZvLCBJRW1iZWRkZWRQbGF5ZXJzIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQge1xuICAgIElTZWxlY3RQYXJhbSxcbiAgICBJU2VsZWN0S2V5LFxuICAgIElLZXlGcmFtZSxcbiAgICBJU3RhcnREcmFnS2V5LFxuICAgIElTdGFydERyYWdFdmVudCxcbiAgICBJTm9kZUluZm8sXG4gICAgSVJhd0tleUZyYW1lLFxuICAgIElQcm9wRGF0YSxcbiAgICBJU3RpY2tJbmZvLFxuICAgIElBbmlWTVRoaXMsXG4gICAgSUFuaVByb3BDdXJ2ZUR1bXBEYXRhLFxuICAgIElDdXJ2ZVZhbHVlLFxuICAgIElDdXJ2ZUtleUluZm9zLFxuICAgIElLZXlGcmFtZURhdGEsXG4gICAgSUVtYmVkZGVkUGxheWVySW5mbyxcbiAgICBJQ3JlYXRlRW1iZWRkZWRQbGF5ZXJJbmZvLFxuICAgIElFbWJlZGRlZFBsYXllckdyb3VwLFxuICAgIElTZWxlY3RFbWJlZGRlZFBsYXllckluZm8sXG4gICAgSVNlbGVjdEtleUJhc2UsXG4gICAgSFRNTEN1c3RvbUVsZW1lbnQsXG59IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHtcbiAgICBmcmFtZVRvVGltZSxcbiAgICBhZGRFdmVudExpc3RlbmVyT25jZSxcbiAgICByZW1vdmVFdmVudExpc3RlbmVyLFxuICAgIHNvcnRLZXlzVG9UcmVlTWFwLFxuICAgIGZvcm1hdENsaXBEdW1wLFxuICAgIGZvcm1hdE5vZGVEdW1wLFxuICAgIGNoZWNrUHJvcGVydHlJbk1lbnUsXG4gICAgc21vb3RoU2NhbGUsXG4gICAgdGltZVRvRnJhbWUsXG4gICAgdHJhbnNmb3JtQ3RybEtleVRvRHVtcCxcbiAgICB0cmFuc0R1bXBLZXlUb0N1cnZlS2V5LFxuICAgIG1vY2tEdW1wVG9DdHJsLFxuICAgIEV2ZW50QnV0dG9uLFxuICAgIFQsXG4gICAgY2FsY0VtYmVkZGVkUGxheWVyS2V5LFxuICAgIGNoZWNrQ3RybE9yQ29tbWFuZCxcbiAgICBFbWJlZGRlZFBsYXllck1lbnVNYXAsXG4gICAgY2FsY0tleUZyYW1lS2V5LFxuICAgIGlzTWVudUl0ZW0sXG4gICAgbXVsdGlwbHlUcmFja1dpdGhUaW1lcixcbn0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgYW5pbWF0aW9uQ3RybCB9IGZyb20gJy4vYW5pbWF0aW9uLWN0cmwnO1xuaW1wb3J0IHsgZGVmYXVsdEJlemllciwgdHJhbnNmb3JtQmV6aWVyRGF0YVRvUG9pbnQgfSBmcm9tICcuL2Jlemllci1wcmVzZXRzJztcbmltcG9ydCB7IGFuaW1hdGlvbkNsaXBDYWNoZU1hbmFnZXIgfSBmcm9tICcuL2NsaXAtY2FjaGUnO1xuaW1wb3J0IHsgRmxhZ3MsIElGbGFncyB9IGZyb20gJy4vZ2xvYmFsLWRhdGEnO1xuaW1wb3J0IHsgZ3JpZEN0cmwsIHN5bmNBeGlzWCwgc3luY0F4aXNZIH0gZnJvbSAnLi9ncmlkLWN0cmwnO1xuaW1wb3J0IHtcbiAgICBJZ2V0UHJvcFZhbHVlQXRGcmFtZSxcbiAgICBJc2V0Q3VyRWRpdFRpbWUsXG4gICAgSXF1ZXJ5Q2xpcER1bXAsXG4gICAgSXF1ZXJ5UGxheWluZ0NsaXBUaW1lLFxuICAgIElxdWVyeWNsaXBzTWVudUluZm8sXG4gICAgSXF1ZXJ5QW5pbWF0aW9uUm9vdCxcbiAgICBJcXVlcnlBbmltYXRpb25Sb290SW5mbyxcbiAgICBJcXVlcnlTY2VuZU1vZGUsXG4gICAgSXF1ZXJ5UHJvcGVydGllc01lbnUsXG4gICAgSWdldEVkaXRBbmltYXRpb25JbmZvLFxuICAgIEltb3ZlS2V5cyxcbiAgICBJQXBwbHlPcGVyYXRpb24sXG4gICAgSWNyZWF0ZUtleSxcbiAgICBJQW5pbU9wZXJhdGlvbixcbiAgICBJcmVtb3ZlS2V5LFxuICAgIEltb2RpZnlDdXJ2ZU9mS2V5LFxuICAgIHVwZGF0ZUVtYmVkZGVkUGxheWVyLFxuICAgIGRlbGV0ZUVtYmVkZGVkUGxheWVyLFxuICAgIGFkZEVtYmVkZGVkUGxheWVyR3JvdXAsXG4gICAgYWRkRW1iZWRkZWRQbGF5ZXIsXG4gICAgY2xlYXJFbWJlZGRlZFBsYXllckdyb3VwLFxuICAgIHJlbW92ZUVtYmVkZGVkUGxheWVyR3JvdXAsXG4gICAgcXVlcnlBbmltYXRpb25Ob2RlRWRpdEluZm8sXG4gICAgSXF1ZXJ5UGxheVN0YXRlLFxufSBmcm9tICcuL2lwYy1ldmVudCc7XG5pbXBvcnQgeyBnZXRQb3BNZW51TWFwLCBvblByb3BMaXN0Q29udGV4dE1lbnVzLCBvblRpbWVyQ29udGV4dE1lbnVzLCBvblByb3BDb250ZXh0TWVudXMsIG9uU3RpY2tNZW51cywgcG9wTWVudU1hcCwgb25FbWJlZGRlZFBsYXllckNvbnRleHRNZW51LCBvbkVtYmVkZGVkUGxheWVyVHJhY2tNZW51IH0gZnJvbSAnLi9wb3AtbWVudSc7XG5cbmV4cG9ydCBjb25zdCBlbnVtIEN1cnZlQ29sb3Ige1xuICAgIFJFRCA9ICcjQUUyRDQ3JyxcbiAgICBCTFVFID0gJyMyMjdGOUInLFxuICAgIEdSRUVOID0gJyMxOThGNkInLFxuICAgIFBVUlBMRSA9ICcjNzk3OUQ3Jyxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQW5pbWF0aW9uU3RhdGUge1xuICAgIFNUT1AgPSAwLFxuICAgIFBMQVksXG4gICAgUEFVU0UsXG59XG5cbmV4cG9ydCBjb25zdCBDdXJ2ZUNvbG9yTGlzdCA9IFtDdXJ2ZUNvbG9yLlJFRCwgQ3VydmVDb2xvci5HUkVFTiwgQ3VydmVDb2xvci5CTFVFLCBDdXJ2ZUNvbG9yLlBVUlBMRV07XG5cbmNvbnN0IExvZGFzaCA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jb25zdCBkZWZhdWx0TGF5b3V0Q29uZmlnID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHRvcE1pbjogMCxcbiAgICAgICAgdG9wTWF4OiA1MDAsXG5cbiAgICAgICAgbGVmdE1pbjogMTAwLFxuICAgICAgICBsZWZ0TWF4OiA1MDAsXG5cbiAgICAgICAgY2VudGVyTWluOiAwLFxuICAgICAgICBjZW50ZXJNYXg6IDUwMCxcblxuICAgICAgICBhdXhDdXJ2ZU1pbjogMCxcbiAgICAgICAgYXV4Q3VydmVNYXg6IDUwMCxcblxuICAgICAgICB0b3RhbFBlYzogMTAwLFxuICAgIH07XG59O1xuXG4vKipcbiAqIOWtmOWCqOWKqOeUu+e8lui+keebuOWFs+aTjeS9nOeahOaWueazle+8jOS+i+WmgumAieS4reWFs+mUruW4p+OAgeaJk+W8gOWKqOeUu+absue6v+e8lui+keWZqOetieetiVxuICovXG5jbGFzcyBBbmltYXRpb25FZGl0b3Ige1xuICAgIHB1YmxpYyBwYW5lbDogYW55ID0gbnVsbDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgTElORV9IRUlHSFQ6IG51bWJlciA9IDI0O1xuICAgIC8vIOWFs+mUruW4p1xuICAgIHB1YmxpYyByZWFkb25seSBLRVlfU0laRV9SOiBudW1iZXIgPSBNYXRoLnNxcnQoMTQpO1xuICAgIHB1YmxpYyByZWFkb25seSBpbWFnZUNDVHlwZXM6IHN0cmluZ1tdID0gWydjYy5TcHJpdGVGcmFtZScsICdjYy5UZXh0dXJlMkQnLCAnY2MuVGV4dHVyZUJhc2UnLCAnY2MuSW1hZ2VBc3NldCddO1xuICAgIHB1YmxpYyByZWFkb25seSBjdXJ2ZURpc2FibGVkQ0N0eXBlczogc3RyaW5nW10gPSBbJ1Vua25vd24nLCAnY2MuQm9vbGVhbicsICdjYy5RdWF0JywgLi4udGhpcy5pbWFnZUNDVHlwZXNdO1xuICAgIHB1YmxpYyBncmlkQ3RybCA9IGdyaWRDdHJsO1xuICAgIHB1YmxpYyByZWZyZXNoVGFzayA9IDA7XG4gICAgcHVibGljIGhhc0luaXRDdXJ2ZSA9IGZhbHNlO1xuICAgIHB1YmxpYyBoYXNJbml0Q3VydmVQcmVzZXQgPSBmYWxzZTtcbiAgICBnZXQgc3BhY2luZ0ZyYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3BhY2luZ0ZyYW1lO1xuICAgIH1cblxuICAgIHNldCBzcGFjaW5nRnJhbWUodmFsOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fc3BhY2luZ0ZyYW1lID0gdmFsO1xuICAgICAgICB0aGlzLmNoYW5nZVNwYWNpbmdGcmFtZSh2YWwpO1xuICAgIH1cbiAgICBwcml2YXRlIF9zcGFjaW5nRnJhbWUgPSAxO1xuICAgIHByaXZhdGUgX2N1cnZlRGF0YTogSUN1cnZlVmFsdWUgfCBudWxsID0gbnVsbDtcbiAgICBwdWJsaWMgc2VsZWN0S2V5VXBkYXRlRmxhZyA9IGZhbHNlO1xuXG4gICAgcHVibGljIHN0aWNrSW5mbzogSVN0aWNrSW5mbyA9IHtcbiAgICAgICAgbGVmdEZyYW1lOiAwLFxuICAgICAgICByaWdodEZyYW1lOiAwLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHdpZHRoOiAwLFxuICAgICAgICBoZWlnaHQ6IDAsXG4gICAgfTtcbiAgICBwdWJsaWMgaGFzU2hvd1N0aWNrID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgbGF5b3V0Q29uZmlnID0gZGVmYXVsdExheW91dENvbmZpZygpO1xuXG4gICAgcHVibGljIGRlYm91bmNlVXBkYXRlTm9kZSA9IGRlYm91bmNlKHRoaXMudXBkYXRlTm9kZSwgMzAwKTtcbiAgICBwdWJsaWMgZGVib3VuY2VGaWx0ZXJOb2RlID0gZGVib3VuY2UodGhpcy5GaWx0ZXJOb2RlLCAzMDApO1xuICAgIHB1YmxpYyBkZWJvdW5jZVJlZnJlc2ggPSBkZWJvdW5jZSh0aGlzLl9yZWZyZXNoLCAzMDApO1xuXG4gICAgLyoqIEBkZXByZWNhdGVkIHZtLCBhbmltYXRpb25FZGl0b3IsIGFuaW1hdGlvbkN0cmwg5LiJ6ICF5L6d6LWW5YWz57O75re35LmxICovXG4gICAgcHJpdmF0ZSB2bSE6IElBbmlWTVRoaXM7XG4gICAgcHJpdmF0ZSBhbmlQbGF5VGFzayA9IDA7XG5cbiAgICBwdWJsaWMgdXBkYXRlU2VsZWN0UXVldWU6IHN0cmluZ1tdID0gW107XG5cbiAgICBnZXQgaXNMb2NrKCk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIXRoaXMudm0pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhISghdGhpcy52bSB8fCAhdGhpcy52bS5hbmltYXRpb25Nb2RlIHx8IHRoaXMudm0ubG9jayB8fCB0aGlzLnZtLm1hc2tQYW5lbCk7XG4gICAgfVxuXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMucmVmcmVzaFRhc2sgPSAwO1xuICAgICAgICB0aGlzLmhhc0luaXRDdXJ2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdEtleVVwZGF0ZUZsYWcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGlja0luZm8gPSB7XG4gICAgICAgICAgICBsZWZ0RnJhbWU6IDAsXG4gICAgICAgICAgICByaWdodEZyYW1lOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHdpZHRoOiAwLFxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9zcGFjaW5nRnJhbWUgPSAxO1xuICAgICAgICB0aGlzLmhhc1Nob3dTdGljayA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxheW91dENvbmZpZyA9IGRlZmF1bHRMYXlvdXRDb25maWcoKTtcbiAgICAgICAgdGhpcy5hbmlQbGF5VGFzayA9IDA7XG4gICAgICAgIHRoaXMudXBkYXRlU2VsZWN0UXVldWUgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorr7nva7mn5DkuKrphY3nva7lgLxcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgc2V0Q29uZmlnKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIEVkaXRvci5Qcm9maWxlLnNldENvbmZpZygnYW5pbWF0b3InLCBrZXksIHZhbHVlLCAnZ2xvYmFsJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5p+Q5Liq6YWN572u5YC8XG4gICAgICogQHBhcmFtIGtleVxuICAgICAqL1xuICAgIGFzeW5jIGdldENvbmZpZyhrZXk6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdhbmltYXRvcicsIGtleSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGluaXQodm06IElBbmlWTVRoaXMpIHtcbiAgICAgICAgdGhpcy52bSA9IHZtO1xuICAgICAgICBjb25zdCBmcmFtZSA9IGF3YWl0IGFuaW1hdGlvbkVkaXRvci5nZXRDb25maWcoJ3NwYWNpbmdGcmFtZScpO1xuICAgICAgICB0aGlzLl9zcGFjaW5nRnJhbWUgPSBmcmFtZSB8fCAxO1xuICAgICAgICBhZGRFdmVudExpc3RlbmVyT25jZShkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcCk7XG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXJPbmNlKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB2bUluaXQoKSB7XG4gICAgICAgIGNvbnN0IHZtID0gdGhpcy52bTtcbiAgICAgICAgdm0uJHJlZnMuY2hhcnQuc3R5bGUud2lkdGggPSBgJHt2bS4kcmVmcy5yaWdodC5vZmZzZXRXaWR0aH1weGA7XG4gICAgICAgIGNvbnN0IHNob3dUeXBlID0gYXdhaXQgdGhpcy5nZXRDb25maWcoJ3Nob3dUeXBlJyk7XG4gICAgICAgIGdyaWRDdHJsLmluaXQoe1xuICAgICAgICAgICAgJGNhbnZhczogdm0uJHJlZnMuZ3JpZENhbnZhcyxcbiAgICAgICAgICAgICRsZWZ0OiB2bS4kcmVmcy5sZWZ0LFxuICAgICAgICAgICAgJHJpZ2h0OiB2bS4kcmVmcy5yaWdodCxcbiAgICAgICAgICAgICR4QXhpczogdm0uJHJlZnMueEF4aXMsXG4gICAgICAgICAgICBzaG93VHlwZSxcbiAgICAgICAgICAgIG1pblNjYWxlOiA1LFxuICAgICAgICAgICAgbWF4U2NhbGU6IDEwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0Q29uZmlnKCk7XG4gICAgICAgIHZtLm9mZnNldCA9IHZtLiRyZWZzLmxlZnQub2Zmc2V0V2lkdGg7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBncmlkQ3RybC5ncmlkIS5yZXNpemUoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyVGltZUF4aXMoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudEZyYW1lKHZtLmN1cnJlbnRGcmFtZSk7IC8vIOS4u+WKqOinpuWPkeabtOaWsFxuICAgICAgICAgICAgdGhpcy5pbml0Q3VydmUoKTtcbiAgICAgICAgICAgIHZtLm9mZnNldCA9IGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDku44gaW5pdEN1cnZlIOS4reaKveWPluWHuuadpeeahOmFjee9rumAu+i+kVxuICAgIC8vIEZJWE1FOiDlupTor6Xov5vkuIDmraXmj5Dlj5bvvIzku6Xkvr/lkowgaG9vayDlh73mlbDphY3lkIjkvb/nlKjjgIJcbiAgICAvLyDlkIzml7bov5nkuKrlh73mlbDlj6rlupTor6XlnKjliJ3lp4vljJbml7bosIPnlKjkuIDmrKHvvIzogIzkuI3mmK/mr4/mrKHmmL7npLrmm7Lnur/ml7bpg73osIPnlKjvvIjnm67liY3nmoQgYnVn77yJXG4gICAgcHVibGljIGNvbmZpZ3VyZUN1cnZlRWRpdG9yKGN1cnZlOiBIVE1MQ3VzdG9tRWxlbWVudCApIHtcbiAgICAgICAgY3VydmUuc2V0Q29uZmlnKHtcbiAgICAgICAgICAgIHhSYW5nZTogWzAsIEluZmluaXR5XSxcbiAgICAgICAgICAgIHlSYW5nZTogWy1JbmZpbml0eSwgSW5maW5pdHldLFxuICAgICAgICAgICAgc2hvd1ByZVdyYXBNb2RlOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dQb3N0V3JhcE1vZGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJlY2lzaW9uWDogMCxcbiAgICAgICAgICAgIHByZWNpc2lvblk6IDMsXG4gICAgICAgICAgICBzaG93WExhYmVsOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dZTGFiZWw6IHRydWUsXG4gICAgICAgICAgICBheGlzTWFyZ2luOiAwLFxuICAgICAgICAgICAgc2hvd1lMaW5lOiB0cnVlLFxuICAgICAgICAgICAgc2hvd1hMaW5lOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXJ0WE9mZnNldDogMTAsXG4gICAgICAgICAgICBoYW5kbGVyU2l6ZTogNjAsXG4gICAgICAgICAgICBncmlkQ29sb3I6ICcjMzMzODQ2JyxcbiAgICAgICAgICAgIHNwYWNpbmdGcmFtZTogdGhpcy5zcGFjaW5nRnJhbWUsXG4gICAgICAgICAgICBzYW1wbGU6IHRoaXMudm0uc2FtcGxlLFxuICAgICAgICAgICAgeEF4aXNOYW1lOiAndGltZScsXG4gICAgICAgICAgICB5QXhpc05hbWU6ICd2YWx1ZScsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRPRE86IGNvbm5lY3RlZCB0byBnbG9iYWwgZ3JpZCBkYXRhXG4gICAgICAgIGlmIChncmlkQ3RybC5ncmlkICYmIGN1cnZlLmN1cnZlQ3RybD8uZ3JpZCkge1xuICAgICAgICAgICAgc3luY0F4aXNYKGdyaWRDdHJsLmdyaWQsIGN1cnZlLmN1cnZlQ3RybC5ncmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBncmlkQ3RybC5ncmlkIOeahOWIneWni+WMluaXtuacuuavlOi+g+eJueauiu+8jOS+nei1luS6jiBzY2VuZTpyZWFkeSDlj4rkuIDns7vliJfpgLvovpHjgILlnKjlroPliJ3lp4vljJblrozmiJDliY3kvb/nlKjlm7rlrprlgLxcbiAgICAgICAgICAgIGN1cnZlLmN1cnZlQ3RybC5ncmlkLnhBeGlzU2NhbGUgPSAyMDtcbiAgICAgICAgICAgIGN1cnZlLmN1cnZlQ3RybC5ncmlkLnhBeGlzT2Zmc2V0ID0gMTA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRklYTUU6IOaMieeFp+S5i+WJjeeahOihjOS4uu+8jOavj+asoemDvSB5IOi9tOe8qeaUvlxuICAgICAgICBjdXJ2ZS5jdXJ2ZUN0cmwuZ3JpZC55QXhpc1NjYWxlID0gMTA7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXRDdXJ2ZSgpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSB0aGlzLnZtLiRyZWZzWydwcm9wZXJ0eS1jb250ZW50J10uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGlmICghdGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwgfHwgIXRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLmNhbnZhcy53aWR0aCB8fCAhdGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwuY2FudmFzLmhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyZUN1cnZlRWRpdG9yKHRoaXMudm0uJHJlZnMuY3VydmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYW5pbWF0aW9uRWRpdG9yLmhhc0luaXRDdXJ2ZSkge1xuICAgICAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2Zvcm0nLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZ3JpZEN0cmwuZ3JpZCEueEF4aXNTY2FsZSA9IHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLmdyaWQueEF4aXNTY2FsZTtcbiAgICAgICAgICAgICAgICBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCA9IHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLmdyaWQueEF4aXNPZmZzZXQ7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnZtLnRyYW5zZm9ybUV2ZW50LmVtaXRVcGRhdGUoJ3Byb3BlcnR5Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLmdldENvcHlLZXlzID0gKCk6IElDdXJ2ZUtleUluZm9zW10gPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhbmltYXRpb25DdHJsLmNvcHlLZXlJbmZvO1xuICAgICAgICAgICAgICAgIGlmICghaW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnZlSW5mb3M6IElDdXJ2ZUtleUluZm9zW10gPSBbXTtcbiAgICAgICAgICAgICAgICBpbmZvLmN1cnZlc0R1bXAuZm9yRWFjaCgoZHVtcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjdXJ2ZUluZm9zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBkdW1wLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXM6IGR1bXAua2V5ZnJhbWVzLm1hcCgoaXRlbSkgPT4gbW9ja0R1bXBUb0N0cmwoaXRlbSkhKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnZlSW5mb3M7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8g5bCG5puy57q/5YaF5Yik5pat6I635Y+W5ou36LSd5YWz6ZSu5bin5pWw5o2u55qE5o6l5Y+j5pS55Li65Yqo55S757yW6L6R5Zmo55qE5Yik5pat5o6l5Y+jXG4gICAgICAgICAgICB0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybC5vbignb3BlcmF0ZScsIHRoaXMub25DdXJ2ZU9wZXJhdGUuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IuaGFzSW5pdEN1cnZlID0gdHJ1ZTtcblxuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5oYXNJbml0Q3VydmVQcmVzZXQpIHtcbiAgICAgICAgICAgIC8vIOiuvue9riBjdXJ2ZSDnmoQgY29uZmlnXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByZXNldEl0ZW0gb2YgZGVmYXVsdEJlemllci52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgcDEsIHAyLCBwMywgcDQgfSA9IHRyYW5zZm9ybUJlemllckRhdGFUb1BvaW50KHByZXNldEl0ZW0uZGF0YSk7XG4gICAgICAgICAgICAgICAgVnVlLnNldChcbiAgICAgICAgICAgICAgICAgICAgcHJlc2V0SXRlbSxcbiAgICAgICAgICAgICAgICAgICAgJ3N2Z0RhdGEnLFxuICAgICAgICAgICAgICAgICAgICBgTSR7cDFbMF19ICR7cDFbMV19IEMgJHtwMlswXX0gJHtwMlsxXX0sICR7cDNbMF19ICR7cDNbMV19LCAke3A0WzBdfSAke3A0WzFdfWAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaGFzSW5pdEN1cnZlUHJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRFbWJlZGRlZFBsYXllck1lbnUoY3JlYXRlSW5mbz86IElDcmVhdGVFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGU6IElDcmVhdGVFbWJlZGRlZFBsYXllckluZm8gPSBjcmVhdGVJbmZvIHx8IHt9O1xuICAgICAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhFbWJlZGRlZFBsYXllck1lbnVNYXApLm1hcCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaW5mby5sYWJlbCxcbiAgICAgICAgICAgICAgICBjbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVtYmVkZGVkUGxheWVyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWFibGU6IGluZm8udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25FbWJlZGRlZFBsYXllclRyYWNrTWVudShldmVudDogTW91c2VFdmVudCwgdHJhY2tJbmZvOiBJRW1iZWRkZWRQbGF5ZXJHcm91cCkge1xuICAgICAgICBjb25zdCBlbWJlZGRlZFBsYXllcnNNZW51ID0gZ2V0UG9wTWVudU1hcChvbkVtYmVkZGVkUGxheWVyVHJhY2tNZW51KTtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJzTWVudS5jbGVhckVtYmVkZGVkUGxheWVyLmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGVhckVtYmVkZGVkUGxheWVyR3JvdXAodHJhY2tJbmZvLmtleSk7XG4gICAgICAgICAgICB0aGlzLnVuU2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKHRyYWNrSW5mby5lbWJlZGRlZFBsYXllcnMpO1xuICAgICAgICB9O1xuICAgICAgICBlbWJlZGRlZFBsYXllcnNNZW51LnJlbW92ZUVtYmVkZGVkUGxheWVyR3JvdXAuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVtYmVkZGVkUGxheWVyR3JvdXAodHJhY2tJbmZvLmtleSk7XG4gICAgICAgICAgICB0aGlzLnVuU2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKHRyYWNrSW5mby5lbWJlZGRlZFBsYXllcnMpO1xuICAgICAgICB9O1xuICAgICAgICBFZGl0b3IuTWVudS5wb3B1cCh7IG1lbnU6IE9iamVjdC52YWx1ZXMoZW1iZWRkZWRQbGF5ZXJzTWVudSkgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRW1iZWRkZWRQbGF5ZXJDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgdHJhY2tJbmZvOiBJRW1iZWRkZWRQbGF5ZXJHcm91cCkge1xuICAgICAgICBjb25zdCBlbWJlZGRlZFBsYXllcnNNZW51ID0gZ2V0UG9wTWVudU1hcChvbkVtYmVkZGVkUGxheWVyQ29udGV4dE1lbnUpO1xuICAgICAgICBjb25zdCBiZWdpbiA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LngpO1xuICAgICAgICAvLyDmoLnmja7nsbvlnovlrprliLbljJboj5zljZXmmL7npLpcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJzTWVudS5jcmVhdGVFbWJlZGRlZFBsYXllci5sYWJlbCA9IHRoaXMudm0udChcbiAgICAgICAgICAgIHBvcE1lbnVNYXAuY3JlYXRlRW1iZWRkZWRQbGF5ZXIubGFiZWwhLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBsYXllcjogdGhpcy52bS50KHRyYWNrSW5mby5tZW51SW5mby5sYWJlbCksXG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgICBlbWJlZGRlZFBsYXllcnNNZW51LmNyZWF0ZUVtYmVkZGVkUGxheWVyLmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGRFbWJlZGRlZFBsYXllcih7XG4gICAgICAgICAgICAgICAgYmVnaW4sXG4gICAgICAgICAgICAgICAgZW5kOiBiZWdpbiArIDUsXG4gICAgICAgICAgICAgICAgcGxheWFibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdHJhY2tJbmZvLnR5cGUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBncm91cDogdHJhY2tJbmZvLmtleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGVtYmVkZGVkUGxheWVyc01lbnUuY2xlYXJFbWJlZGRlZFBsYXllci5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFbWJlZGRlZFBsYXllckdyb3VwKHRyYWNrSW5mby5rZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBlbWJlZGRlZFBsYXllckR1bXBzOiBJRW1iZWRkZWRQbGF5ZXJzW10gPSBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2VtYmVkZGVkUGxheWVyJykgfHwgW107XG4gICAgICAgIGVtYmVkZGVkUGxheWVyRHVtcHMgPSBlbWJlZGRlZFBsYXllckR1bXBzLmZpbHRlcigoZHVtcCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGR1bXAucGxheWFibGUhLnR5cGUgPT09IHRyYWNrSW5mby50eXBlO1xuICAgICAgICB9KTtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJzTWVudS5wYXN0ZUVtYmVkZGVkUGxheWVyLmVuYWJsZWQgPSAhIWVtYmVkZGVkUGxheWVyRHVtcHMubGVuZ3RoO1xuICAgICAgICBlbWJlZGRlZFBsYXllcnNNZW51LnBhc3RlRW1iZWRkZWRQbGF5ZXIuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlRW1iZWRkZWRQbGF5ZXIoYmVnaW4sIGVtYmVkZGVkUGxheWVyRHVtcHMsIHRyYWNrSW5mby5rZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHsgbWVudTogT2JqZWN0LnZhbHVlcyhlbWJlZGRlZFBsYXllcnNNZW51KSB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBjbGVhckVtYmVkZGVkUGxheWVyR3JvdXAoZ3JvdXBLZXk6IHN0cmluZykge1xuICAgICAgICBhd2FpdCBJQXBwbHlPcGVyYXRpb24oY2xlYXJFbWJlZGRlZFBsYXllckdyb3VwKHRoaXMudm0uY3VycmVudENsaXAsIGdyb3VwS2V5KSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmVtb3ZlRW1iZWRkZWRQbGF5ZXJHcm91cChncm91cEtleTogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IElBcHBseU9wZXJhdGlvbihyZW1vdmVFbWJlZGRlZFBsYXllckdyb3VwKHRoaXMudm0uY3VycmVudENsaXAsIGdyb3VwS2V5KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZEVtYmVkZGVkUGxheWVyKGluZm8/OiBJQ3JlYXRlRW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgIGNvbnN0IGR1bXA6IElFbWJlZGRlZFBsYXllcnMgPSB7XG4gICAgICAgICAgICBiZWdpbjogdGhpcy52bS5jdXJyZW50RnJhbWUsXG4gICAgICAgICAgICBlbmQ6IHRoaXMudm0uY3VycmVudEZyYW1lICsgNSxcbiAgICAgICAgICAgIHJlY29uY2lsZWRTcGVlZDogZmFsc2UsXG4gICAgICAgICAgICBwbGF5YWJsZToge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhbmltYXRpb24tY2xpcCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ3JvdXA6ICcnLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkdW1wLCBpbmZvKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VycmVudEdyb3VwID0gdGhpcy5maW5kR3JvdXBDYW5BZGQoZHVtcCk7XG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgaWYgKCFjdXJyZW50R3JvdXApIHtcbiAgICAgICAgICAgIGN1cnJlbnRHcm91cCA9IHtcbiAgICAgICAgICAgICAgICBrZXk6IFN0cmluZyhEYXRlLm5vdygpKSxcbiAgICAgICAgICAgICAgICBuYW1lOiBkdW1wLnBsYXlhYmxlIS50eXBlLFxuICAgICAgICAgICAgICAgIHR5cGU6IGR1bXAucGxheWFibGUhLnR5cGUsXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXJzOiBbXSxcbiAgICAgICAgICAgICAgICBtZW51SW5mbzogRW1iZWRkZWRQbGF5ZXJNZW51TWFwW2R1bXAucGxheWFibGUhLnR5cGVdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaChhZGRFbWJlZGRlZFBsYXllckdyb3VwKHRoaXMudm0uY3VycmVudENsaXAsIHtcbiAgICAgICAgICAgICAgICBrZXk6IGN1cnJlbnRHcm91cC5rZXksXG4gICAgICAgICAgICAgICAgbmFtZTogY3VycmVudEdyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogY3VycmVudEdyb3VwLnR5cGUsXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLnZtLmVtYmVkZGVkUGxheWVyR3JvdXBzLnB1c2goY3VycmVudEdyb3VwKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50R3JvdXAuZW1iZWRkZWRQbGF5ZXJzLnB1c2godGhpcy50cmFuc0VtYmVkZGVkUGxheWVyRHVtcFRvSW5mbyhkdW1wKSk7XG4gICAgICAgIGR1bXAuZ3JvdXAgPSBjdXJyZW50R3JvdXAhLmtleTtcbiAgICAgICAgb3BlcmF0aW9ucy5wdXNoKGFkZEVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIGR1bXApKTtcbiAgICAgICAgYXdhaXQgSUFwcGx5T3BlcmF0aW9uKG9wZXJhdGlvbnMpO1xuICAgICAgICBtdWx0aXBseVRyYWNrV2l0aFRpbWVyKCdoaXBwb0FuaW1hdG9yJywge1xuICAgICAgICAgICAgLy8g5re75Yqg5bWM5YWl5pKt5pS+5Zmo5qyh5pWwXG4gICAgICAgICAgICAnQTEwMDAwMic6IDEsXG4gICAgICAgICAgICAvLyDmr4/mrKHkuIrmiqXml7bpnIDopoHluKbkuIrlvZPliY3pobnnm65pZO+8jHByb2plY3RfaWRcbiAgICAgICAgICAgIHByb2plY3RfaWQ6IEVkaXRvci5Qcm9qZWN0LnV1aWQsXG4gICAgICAgICAgICAvLyDmr4/mrKHkuIrmiqXml7bpnIDopoHluKbkuIrlvZPliY3nvJbovpHnmoTliqjnlLvliarovpEgY2xpcF9pZFxuICAgICAgICAgICAgY2xpcF9pZDogdGhpcy52bS5jdXJyZW50Q2xpcCxcbiAgICAgICAgICAgIC8vIOe8lui+keWZqOeJiOacrFxuICAgICAgICAgICAgdmVyc2lvbjogRWRpdG9yLkFwcC52ZXJzaW9uLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmluZEdyb3VwQ2FuQWRkKGR1bXA6IElFbWJlZGRlZFBsYXllcnMpOiBJRW1iZWRkZWRQbGF5ZXJHcm91cCB8IG51bGwge1xuICAgICAgICBjb25zdCBncm91cCA9IHRoaXMudm0uZW1iZWRkZWRQbGF5ZXJHcm91cHMuZmluZCgoaXRlbSkgPT4gaXRlbS5rZXkgPT09IGR1bXAuZ3JvdXApO1xuICAgICAgICBpZiAoZ3JvdXApIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZsaWMgPSBncm91cC5lbWJlZGRlZFBsYXllcnMuZmluZCgoZW1iZWRkZWRQbGF5ZXIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoZW1iZWRkZWRQbGF5ZXIuYmVnaW4sIGR1bXAuYmVnaW4pIDwgTWF0aC5taW4oZW1iZWRkZWRQbGF5ZXIuZW5kLCBkdW1wLmVuZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghY29uZmxpYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMudm0uZW1iZWRkZWRQbGF5ZXJHcm91cHMpIHtcbiAgICAgICAgICAgIGlmIChncm91cC50eXBlICE9PSBkdW1wLnBsYXlhYmxlIS50eXBlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb25mbGljID0gZ3JvdXAuZW1iZWRkZWRQbGF5ZXJzLmZpbmQoKGVtYmVkZGVkUGxheWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KGVtYmVkZGVkUGxheWVyLmJlZ2luLCBkdW1wLmJlZ2luKSA8IE1hdGgubWluKGVtYmVkZGVkUGxheWVyLmVuZCwgZHVtcC5lbmQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoY29uZmxpYykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZVRvRW1iZWRkZWRQbGF5ZXJNb2RlKCkge1xuICAgICAgICAvLyDliIfmjaLmmK/lkKbpmpDol4/ml6DmlYjoioLngrnml7bvvIzljrvpmaTljp/mnKznmoTmu5rliqjkv6Hmga9cbiAgICAgICAgdGhpcy52bS4kcmVmcy5ub2Rlcy5zY3JvbGxUb3AgPSB0aGlzLnZtLm5vZGVTY3JvbGxJbmZvIS50b3AgPSAwO1xuICAgICAgICBhbmltYXRpb25FZGl0b3IuY2FsY0Rpc3BsYXlDbGlwcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGFuZ2VUb0tleUZyYW1lTW9kZSgpIHtcbiAgICAgICAgLy8g5YiH5o2i5piv5ZCm6ZqQ6JeP5peg5pWI6IqC54K55pe277yM5Y676Zmk5Y6f5pys55qE5rua5Yqo5L+h5oGvXG4gICAgICAgIHRoaXMudm0uJHJlZnMubm9kZXMuc2Nyb2xsVG9wID0gdGhpcy52bS5ub2RlU2Nyb2xsSW5mbyEudG9wID0gMDtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyVGltZUF4aXMoKSB7XG4gICAgICAgIGxldCB0aW1lID0gMTtcbiAgICAgICAgbGV0IGZyYW1lID0gdGltZSAqIChhbmltYXRpb25DdHJsLmNsaXBDb25maWcuc2FtcGxlIHx8IDYwKTtcbiAgICAgICAgY29uc3QgdGltZUluZm9zOiB7IHZhbHVlOiBudW1iZXIsIHg6IG51bWJlciB9W10gPSBbXTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLnZtLiRyZWZzLmNvbnRhaW5lci5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgZ2V0Q2FudmFzT2Zmc2V0ID0gKGZyYW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZnJhbWUpIC0gMTAgKyB0aGlzLnZtLm9mZnNldDtcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKGdldENhbnZhc09mZnNldChmcmFtZSksIDAsIHdpZHRoKSA9PT0gZ2V0Q2FudmFzT2Zmc2V0KGZyYW1lKSkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhmcmFtZSk7XG4gICAgICAgICAgICB0aW1lSW5mb3MucHVzaCh7XG4gICAgICAgICAgICAgICAgdmFsdWU6IE1hdGguZmxvb3IoZnJhbWUgLyAoYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnLnNhbXBsZSB8fCA2MCkpLFxuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRpbWUrKztcbiAgICAgICAgICAgIGZyYW1lID0gdGltZSAqIChhbmltYXRpb25DdHJsLmNsaXBDb25maWcuc2FtcGxlIHx8IDYwKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZtLnRpbWVJbmZvcyA9IHRpbWVJbmZvcztcblxuICAgICAgICAvLyBUT0RPIHNjYWxlIOeahOabtOaWsOmcgOimgeaNouS4quS9jee9rlxuICAgICAgICB0aGlzLnZtLnNjYWxlID0gY2xhbXAoZ3JpZEN0cmwuZ3JpZCEueEF4aXNTY2FsZSwgZ3JpZEN0cmwuZ3JpZCEueE1pblNjYWxlLCBncmlkQ3RybC5ncmlkIS54TWF4U2NhbGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25DdXJ2ZU9wZXJhdGUob3BlcmF0ZTogc3RyaW5nLCBjdXJ2ZUtleUZyYW1lczogSUN1cnZlS2V5SW5mb3NbXSwgdGFyZ2V0RnJhbWU/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy52bS5oYXNTZWxlY3RlZEN1cnZlQ2xpcCA9IGZhbHNlO1xuICAgICAgICBpZiAob3BlcmF0ZSA9PT0gJ3Vuc2VsZWN0JyB8fCAhdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudm0ubGlnaHRDdXJ2ZSA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjdXJ2ZUtleUZyYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBub2RlUGF0aCwgdHlwZSB9ID0gdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSE7XG4gICAgICAgIHN3aXRjaCAob3BlcmF0ZSkge1xuICAgICAgICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEtleUluZm86IElTZWxlY3RLZXkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlGcmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IG5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDogdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSEucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiAncHJvcCcsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGtleXNJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChrZXlzSW5mby5rZXlzLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBrZXlzSW5mby5rZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RLZXlJbmZvLmtleUZyYW1lcy5wdXNoKC4uLmtleXMhLm1hcCgoaW5mbywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBrZXlzSW5mby5rZXlzW2luZGV4XS5rZXkuY2FudmFzLnggLSBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGluZm8uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBpbmZvLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wOiBwcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmtleURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY2FsY0tleUZyYW1lS2V5KGtleURhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdEtleVVwZGF0ZUZsYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gc2VsZWN0S2V5SW5mbztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS51cGRhdGVTZWxlY3RLZXkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdkYi1zZWxlY3QnOlxuICAgICAgICAgICAgICAgIC8vIOWPjOWHu+i3s+i9rOWIsOafkOS4quWFs+mUruW4p+S9jee9rlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEtleXMgPSBjdXJ2ZUtleUZyYW1lc1swXS5rZXlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJyZW50S2V5cywgdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKGtleXNbMF0uZnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NlbGVjdC1jdXJ2ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy52bS5saWdodEN1cnZlID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjdXJ2ZUtleUZyYW1lc1swXS5rZXksXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnZtLnByb3BlcnRpZXMhW2N1cnZlS2V5RnJhbWVzWzBdLmtleV0uY29sb3IhLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZWxlY3QtY3VydmUtY2xpcCc6XG4gICAgICAgICAgICAgICAgdGhpcy52bS5saWdodEN1cnZlID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjdXJ2ZUtleUZyYW1lc1swXS5rZXksXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnZtLnByb3BlcnRpZXMhW2N1cnZlS2V5RnJhbWVzWzBdLmtleV0uY29sb3IhLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy52bS5oYXNTZWxlY3RlZEN1cnZlQ2xpcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhcHBseS1iZXppZXInOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS5oYXNTZWxlY3RlZEN1cnZlQ2xpcCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wZXJhdGlvbnM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjdXJ2ZUtleUluZm9zIG9mIGN1cnZlS2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQcm9wID0gY3VydmVLZXlJbmZvcy5rZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJ2ZUtleUluZm9zLmtleXMsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kaWZ5S2V5cyA9IGtleXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEltb2RpZnlDdXJ2ZU9mS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCB0YXJnZXRQcm9wLCBpdGVtLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0uaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50V2VpZ2h0OiBpdGVtLmluVGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGl0ZW0ub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycE1vZGU6IGl0ZW0uaW50ZXJwTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhbmdlbnRXZWlnaHRNb2RlOiBpdGVtLnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoKC4uLm1vZGlmeUtleXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihvcGVyYXRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzY2FsZS1rZXlzJzpcbiAgICAgICAgICAgIGNhc2UgJ21vdmUta2V5cyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3ZlS2V5czogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEtleUluZm86IElTZWxlY3RLZXkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleUZyYW1lczogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogJ3Byb3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDogdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSEucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5SW5mb3MuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlhbPplK7luKfnp7vliqhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXRGcmFtZVggPSBNYXRoLnJvdW5kKGl0ZW0ua2V5LnBvaW50LnggLSBpdGVtLnJhdy5wb2ludC54KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGtleXNbaW5kZXhdLmZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZToga2V5c1tpbmRleF0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3A6IGN1cnZlSW5mby5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBNYXRoLnJvdW5kKGl0ZW0ucmF3LnBvaW50LngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IG9mZnNldEZyYW1lWCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEtleUluZm8ua2V5RnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGNhbGNLZXlGcmFtZUtleShrZXlEYXRhKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXRGcmFtZVkgPSBNYXRoLnJvdW5kKGl0ZW0ua2V5LnBvaW50LnkgLSBpdGVtLnJhdy5wb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9mZnNldEZyYW1lWCAmJiAhb2Zmc2V0RnJhbWVZKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZVggJiYgbW92ZUtleXMucHVzaChJbW92ZUtleXModGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIGN1cnZlSW5mby5rZXksIFtNYXRoLnJvdW5kKGl0ZW0ucmF3LnBvaW50LngpXSwgb2Zmc2V0RnJhbWVYKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlS2V5cy5wdXNoKEljcmVhdGVLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIGN1cnZlSW5mby5rZXksIGtleXNbaW5kZXhdLmZyYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBpdGVtLmtleS5wb2ludC55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0ua2V5LmluVGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5rZXkub3V0VGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaMiemhuuW6j++8jOWFiOenu+WKqO+8jOWGjeabtOaWsOWFs+mUruW4p+aVsOaNrlxuICAgICAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oWy4uLm1vdmVLZXlzLCAuLi5jcmVhdGVLZXlzXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZtLnNlbGVjdEtleUluZm8gPSBzZWxlY3RLZXlJbmZvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RhbmdlbnQnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByb3AgPSBjdXJ2ZUtleUZyYW1lc1swXS5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlLZXlzID0ga2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW1vZGlmeUN1cnZlT2ZLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIHRhcmdldFByb3AsIGl0ZW0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0uaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm9rZW46IGl0ZW0uYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50OiBpdGVtLm91dFRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogaXRlbS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGl0ZW0ub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUtleXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIFRPRE8g5pqC5pe25rKh5pyJ6LCD55So77yM6ZyA6KaB5Zy65pmv5pSv5oyBIGJyb2tlbiDmlbDmja7nmoTkv67mlLlcbiAgICAgICAgICAgIGNhc2UgJ2NoYW5nZS1icm9rZW4tc3RhdGUnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByb3AgPSBjdXJ2ZUtleUZyYW1lc1swXS5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlLZXlzID0ga2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW1vZGlmeUN1cnZlT2ZLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIHRhcmdldFByb3AsIGl0ZW0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm9rZW46IGl0ZW0uYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5S2V5cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlLWtleXMnOlxuICAgICAgICAgICAgICAgIC8vIOeymOi0tOaOpeWPo+ebruWJjeS5n+i1sOaWsOW7uuWFs+mUruW4p+WkhOeQhlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlS2V5c1Rhc2s6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5cy5mb3JFYWNoKCh0YXJnZXRLZXksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlS2V5c1Rhc2sucHVzaChJY3JlYXRlS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBrZXlzW2luZGV4XS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IHRhcmdldEtleS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnQ6IHRhcmdldEtleS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogdGFyZ2V0S2V5LmR1bXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycE1vZGU6IHRhcmdldEtleS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogdGFyZ2V0S2V5LnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnRXZWlnaHQ6IHRhcmdldEtleS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IHRhcmdldEtleS5vdXRUYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKGNyZWF0ZUtleXNUYXNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGFuZ2UtaW50ZXJwLW1vZGUnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUN1cnZlT2ZLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeUN1cnZlT2ZLZXlzLnB1c2goLi4ua2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEltb2RpZnlDdXJ2ZU9mS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0uaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwTW9kZTogaXRlbS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUN1cnZlT2ZLZXlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGFuZ2UtdGFuZ2VudC13ZWlnaHQnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUN1cnZlT2ZLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeUN1cnZlT2ZLZXlzLnB1c2goLi4ua2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEltb2RpZnlDdXJ2ZU9mS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogaXRlbS50YW5nZW50V2VpZ2h0TW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogaXRlbS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiBpdGVtLm91dFRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUN1cnZlT2ZLZXlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyZW1vdmUta2V5cyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUtleXMucHVzaCguLi5rZXlzIS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSXJlbW92ZUtleSh0aGlzLnZtLmN1cnJlbnRDbGlwLCBub2RlUGF0aCwgY3VydmVJbmZvLmtleSwgaXRlbS5mcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihyZW1vdmVLZXlzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RLZXlVcGRhdGVGbGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudm0uc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbW92ZS1jdXJ2ZSc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaVtOadoeabsue6v+eahOS4iuS4i+enu+WKqO+8muaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlS2V5cy5wdXNoKC4uLmtleXMhLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBJY3JlYXRlS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLCB7IG5ld1ZhbHVlOiBpdGVtLmR1bXAudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oY3JlYXRlS2V5cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGFzdGUnOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVLZXkoXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0RnJhbWUhLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IG5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2tleScpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjb3B5JzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWwhuWFs+mUruW4p+aVsOaNrui9rOaNouS4uuWKqOeUu+e8lui+keWZqOWPr+aOpeWPl+eahOaLt+i0neaVsOaNruagvOW8j1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJ2ZXNEdW1wOiBJQW5pUHJvcEN1cnZlRHVtcERhdGFbXSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlZnRGcmFtZXM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3UHJvcERhdGEgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEucGF0aHNEdW1wW25vZGVQYXRoXVtjdXJ2ZUluZm8ua2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbbm9kZVBhdGhdW3Jhd1Byb3BEYXRhLnBhcmVudFByb3BLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnZlc0R1bXAucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IG5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY3VydmVJbmZvLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiByYXdQcm9wRGF0YSEudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogcmF3UHJvcERhdGEhLmRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleWZyYW1lczoga2V5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliIbph4/ovajpgZPopoHlsL3ph4/nspjotLTliLDkuIDmoLfniLbovajpgZPkuIvnmoTlrZDovajpgZPlhoXvvIzpnIDopoHorrDlvZXpop3lpJbkv6Hmga/vvIzlkKbliJnlj6rmnIkgbnVtYmVyIOi/meexu+eahOS/oeaBr++8jOaXoOazleWIpOaWrVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9wYXJlbnRUeXBlOiBwYXJlbnQgJiYgcGFyZW50LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlRXh0cmFwOiByYXdQcm9wRGF0YS5wcmVFeHRyYXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdEV4dHJhcDogcmF3UHJvcERhdGEucG9zdEV4dHJhcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0N1cnZlU3VwcG9ydDogcmF3UHJvcERhdGEuaXNDdXJ2ZVN1cHBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnRGcmFtZXMucHVzaChrZXlzWzBdLmZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUtleUluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJ2ZXNEdW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdEZyYW1lOiBsZWZ0RnJhbWVzLnNvcnQoKGEsIGIpID0+IGEgLSBiKVswXSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIEZpbHRlck5vZGUobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMudm0uZmlsdGVyTmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlOb2RlcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja0N1cnZlRGF0YURpcnR5KGN1cnZlRGF0YTogSUN1cnZlVmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jdXJ2ZURhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnZlRGF0YSA9IGN1cnZlRGF0YTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlcyA9IEpTT04uc3RyaW5naWZ5KHRoaXMuX2N1cnZlRGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KGN1cnZlRGF0YSk7XG4gICAgICAgIC8vIOajgOafpSBkaXJ0eSDlkI7pnIDopoHnvJPlrZjmnIDmlrDnmoTmm7Lnur/mlbDmja7vvIzkuIvmrKEgZGlydHkg5YC86ZyA6KaB5ZKM5LiK5LiA5qyh6K6w5b2V55qE5q+U5a+5XG4gICAgICAgIHRoaXMuX2N1cnZlRGF0YSA9IGN1cnZlRGF0YTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbpgInkuK3lhbPplK7luKfmlbDmja7lkIzmraXliLDmm7Lnur/lhoVcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlQ3VydmVTZWxlY3RlS2V5cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZtLnNob3dBbmltQ3VydmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudm0uc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwuc2VsZWN0S2V5cyhudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb3J0RHVtcCA9IHRoaXMudm0uc2VsZWN0S2V5SW5mby5zb3J0RHVtcCB8fCBzb3J0S2V5c1RvVHJlZU1hcCh0aGlzLnZtLnNlbGVjdEtleUluZm8ua2V5RnJhbWVzKTtcbiAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBPYmplY3QudmFsdWVzKHNvcnREdW1wKS5tYXAoKHByb3BEdW1wKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGtleTogcHJvcER1bXAucHJvcCxcbiAgICAgICAgICAgICAgICBmcmFtZXM6IHByb3BEdW1wLmtleUZyYW1lcy5tYXAoKGl0ZW0pID0+IGl0ZW0uZnJhbWUpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLnNlbGVjdEtleXMoa2V5SW5mb3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXBhaW50Q3VydmUoZGF0YTogSUN1cnZlVmFsdWUgfCBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy52bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDnlYzpnaLlgYflrprmiYDmnInmlbDmja7pg73mmK/mraPluLjnmoTop4TliJnljrvlpITnkIbvvIzlpoLmnpzpgYfliLDlvILluLjmlbDmja7kvJrmipvlh7rlvILluLjlr7zoh7TplJnor6/vvIzlhYggdHJ5IGNhdGNoIOmBv+WFjeW9seWTjeeVjOmdoueahOWFtuS7luaTjeS9nFxuICAgICAgICAgICAgdGhpcy52bS5zaG93QW5pbUN1cnZlICYmICh0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybCAmJiB0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybC5wYWludChkYXRhKSk7XG4gICAgICAgICAgICB0aGlzLl9jdXJ2ZURhdGEgPSBkYXRhO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZykge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDdXJ2ZVNlbGVjdGVLZXlzKCk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdEtleVVwZGF0ZUZsYWcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVMYXlvdXRDb25maWcoKSB7XG4gICAgICAgIC8vIDEzMyDiiYggJGNvbnRhaW5lci50b3AoNTApICsgJHRpbWUtcG9pbnRlci5oZWlnaHQoMzEpICsgJHByb3BlcnR5LXRvb2xzLmhlaWdodCgyOCkgKy5ldmVudHMoMjQpXG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZtLiRlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdGhpcy5sYXlvdXRDb25maWcudG9wTWF4ID0gcmVjdC50b3AgKyB0aGlzLnBhbmVsLmNsaWVudEhlaWdodCAtIDEzMztcbiAgICAgICAgdGhpcy5sYXlvdXRDb25maWcubGVmdE1heCA9IHJlY3QubGVmdCArIHRoaXMucGFuZWwuY2xpZW50V2lkdGggLSAxMDA7XG4gICAgICAgIHRoaXMubGF5b3V0Q29uZmlnLnRvdGFsUGVjID0gMTAwICogKHRoaXMudm0uJHJlZnMuY29udGFpbmVyLm9mZnNldEhlaWdodCAtIDMwICogMykgLyB0aGlzLnZtLiRyZWZzLmNvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZVNhbXBsZShzYW1wbGU6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMudm0gfHwgIXRoaXMudm0uc2hvd0FuaW1DdXJ2ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuc2FtcGxlID0gc2FtcGxlO1xuICAgIH1cblxuICAgIHB1YmxpYyBoaWRlTm9kZXMoKSB7XG4gICAgICAgIHRoaXMudm0uJHJlZnMubm9kZXMuc3R5bGUuaGVpZ2h0ID0gJzI0cHgnO1xuICAgICAgICB0aGlzLnZtLiRyZWZzLm5vZGVzLnN0eWxlLmZsZXggPSAndW5zZXQnO1xuICAgICAgICB0aGlzLnZtLiRyZWZzWydub2RlLWNvbnRlbnQnXS5zdHlsZS5oZWlnaHQgPSAnMjRweCc7XG4gICAgICAgIHRoaXMudm0uJHJlZnNbJ25vZGUtY29udGVudCddLnN0eWxlLmZsZXggPSAndW5zZXQnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaYvuekuuafkOauteaPkOekulxuICAgICAqIEBwYXJhbSBtZXNzYWdlXG4gICAgICovXG4gICAgcHVibGljIHNob3dUb2FzdChtZXNzYWdlOiBzdHJpbmcsIGF3YWl0TXMgPSAxMDAwKSB7XG4gICAgICAgIHRoaXMudm0udG9hc3QubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIEZsYWdzLnRpcHNUaW1lciAmJiBjbGVhclRpbWVvdXQoRmxhZ3MudGlwc1RpbWVyKTtcbiAgICAgICAgRmxhZ3MudGlwc1RpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZtLnRvYXN0Lm1lc3NhZ2UgPSAnJztcbiAgICAgICAgfSwgYXdhaXRNcyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaGFuZ2VTcGFjaW5nRnJhbWUodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnNldENvbmZpZygnc3BhY2luZ0ZyYW1lJywgdmFsdWUpO1xuICAgICAgICB0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybCAmJiAodGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwuY29uZmlnLnNwYWNpbmdGcmFtZSA9IHZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyDmm7TmlrDpgInkuK3lhbPplK7luKfkvY3nva4sIOS7peWPiuW9k+WJjem8oOagh+WFs+mUruW4p+eahOS9jee9rlxuICAgIHB1YmxpYyB1cGRhdGVQb3NpdGlvbkluZm8odHlwZT86IHN0cmluZykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgdGhhdC51cGRhdGVQb3NpdGlvbisrO1xuXG4gICAgICAgIGlmICh0aGF0LnByZXZpZXdQb2ludGVyKSB7XG4gICAgICAgICAgICB0aGF0LnByZXZpZXdQb2ludGVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5ub2RlRHVtcCAmJiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgdGhhdC5ub2RlRHVtcC5mb3JFYWNoKChpdGVtOiBJTm9kZUluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgaXRlbS5rZXlGcmFtZXMgPSBPYmplY3QuZnJlZXplKHRoaXMuY2FsY05vZGVGcmFtZXMoaXRlbS5wYXRoKSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gVE9ETyDkuI3og73mlbTmrrXmm7/mjaLvvIzkvJrlvbHlk43nlYzpnaLmuLLmn5PmlYjnjodcbiAgICAgICAgICAgIGlmICh0aGF0LnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnByb3BlcnRpZXMgPSB0aGlzLmNhbGNQcm9wZXJ0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jYWxjQXV4aWxpYXJ5Q3VydmVzKCk7XG4gICAgICAgICAgICB0aGF0LnVwZGF0ZUtleUZyYW1lKys7XG4gICAgICAgIH1cblxuICAgICAgICBhbmltYXRpb25FZGl0b3IuY2FsY0Rpc3BsYXlFbWJlZGRlZFBsYXllcnMoKTtcblxuICAgICAgICBpZiAodHlwZSA9PT0gJ21vdmUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW0ueCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoaXRlbS5mcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdEtleSsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNsaXBzRHVtcCAmJiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5ldmVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuY2FsY0V2ZW50c0R1bXAoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5zZWxlY3RFdmVudEluZm8pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGF0LnNlbGVjdEV2ZW50SW5mby5kYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtLnggPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGl0ZW0uZnJhbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtLnggPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGl0ZW0ucmF3SW5mbyEuYmVnaW4pO1xuICAgICAgICAgICAgICAgIGl0ZW0ud2lkdGggPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGl0ZW0ucmF3SW5mbyEuZW5kKSAtIGl0ZW0ueDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOmHjee9rumAieS4reeahOWFs+mUruW4p+S/oeaBr1xuICAgIHB1YmxpYyByZXNldFNlbGVjdGVkS2V5SW5mbygpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVtcFNlbGVjdDogSVNlbGVjdEtleSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhhdC5zZWxlY3RLZXlJbmZvKSk7XG4gICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUgPSAwO1xuICAgICAgICB0ZW1wU2VsZWN0Lm9mZnNldCA9IDA7XG4gICAgICAgIGRlbGV0ZSB0ZW1wU2VsZWN0LnNvcnREdW1wO1xuICAgICAgICB0ZW1wU2VsZWN0LmtleUZyYW1lcy5mb3JFYWNoKChrZXlGcmFtZTogSUtleUZyYW1lLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICB0ZW1wU2VsZWN0LmtleUZyYW1lc1tpbmRleF0uZnJhbWUgPSBrZXlGcmFtZS5mcmFtZTtcbiAgICAgICAgICAgIGRlbGV0ZSB0ZW1wU2VsZWN0LmtleUZyYW1lc1tpbmRleF0ub2Zmc2V0RnJhbWU7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZW1wU2VsZWN0LnNvcnREdW1wID0gc29ydEtleXNUb1RyZWVNYXAodGVtcFNlbGVjdC5rZXlGcmFtZXMpO1xuICAgICAgICB0ZW1wU2VsZWN0LmtleUZyYW1lcy5zb3J0KChhLCBiKSA9PiBhLmZyYW1lIC0gYi5mcmFtZSk7XG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IHRlbXBTZWxlY3Q7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5riQ6L+b55qE5riF56m65b2T5YmN6YCJ5Lit55qE5pWw5o2uXG4gICAgICovXG4gICAgcHVibGljIGNsZWFyU2VsZWN0RGF0YSgpIHtcbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvIHx8IHRoaXMudm0uc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RFdmVudEluZm8gPSBudWxsO1xuICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdFByb3BlcnR5KSB7XG4gICAgICAgICAgICB0aGlzLnZtLnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8gPSBudWxsO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ou36LSd5b2T5YmN6YCJ5Lit5L+h5oGvXG4gICAgICovXG4gICAgcHVibGljIGNvcHkoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTG9jaykge1xuICAgICAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvICYmICF0aGlzLnZtLm1hc2tQYW5lbCkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUV2ZW50cygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUVtYmVkZGVkUGxheWVyRHVtcCA9IHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLm1hcCgoaW5mbykgPT4gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChpbmZvLCBmYWxzZSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUtleSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNvcHlFbWJlZGRlZFBsYXllckR1bXAgPSB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5tYXAoKGluZm8pID0+IHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaW5mbywgZmFsc2UpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdEV2ZW50SW5mbykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5RXZlbnRzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy52bS5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5UHJvcCh0aGlzLnZtLnNlbGVjdFByb3BlcnR5KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdGVkSWQpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weU5vZGVEYXRhKFthbmltYXRpb25DdHJsLm5vZGVzRHVtcCEudXVpZDJwYXRoW3RoaXMudm0uc2VsZWN0ZWRJZF1dKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOeymOi0tOW9k+WJjeezu+e7n+WkjeWItuS/oeaBr++8jOiwg+eUqOeahCBjdHJsIOeymOi0tOaOpeWPo+esrOS6jOS4quWPguaVsOmDveaYr+WPr+mAieeahO+8jOS9huaYr+S4uuS6huS8mOWFiOWPluWJqui0tOadv+WGheeahOaVsOaNru+8jOmcgOimgeS8oOmAkuesrOS6jOS4quWPguaVsFxuICAgICAqL1xuICAgIHB1YmxpYyBwYXN0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNMb2NrKSB7XG4gICAgICAgICAgICAvLyDpqqjpqrzliqjnlLvlhYHorrjlv6vmjbfplK7lpI3liLbnspjotLRcbiAgICAgICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNvcHlFdmVudEluZm8gJiYgdGhpcy52bS5hbmltYXRpb25Nb2RlICYmICF0aGlzLnZtLm1hc2tQYW5lbCkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVFdmVudCh0aGlzLnZtLmN1cnJlbnRGcmFtZSwgYW5pbWF0aW9uQ3RybC5nZXRDbGlwQm9hcmREYXRhKCdldmVudCcpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ3RybC5jb3B5RW1iZWRkZWRQbGF5ZXJEdW1wKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZUVtYmVkZGVkUGxheWVyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZtLmN1cnJlbnRGcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5nZXRDbGlwQm9hcmREYXRhKCdlbWJlZGRlZFBsYXllcicpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYW5pbWF0aW9uQ3RybC5jb3B5S2V5SW5mbykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZUtleShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcy52bS5jdXJyZW50RnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0aGlzLnZtLmNvbXB1dGVTZWxlY3RQYXRoLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5nZXRDbGlwQm9hcmREYXRhKCdrZXknKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYW5pbWF0aW9uQ3RybC5jb3B5RW1iZWRkZWRQbGF5ZXJEdW1wKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlRW1iZWRkZWRQbGF5ZXIoXG4gICAgICAgICAgICAgICAgdGhpcy52bS5jdXJyZW50RnJhbWUsXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5nZXRDbGlwQm9hcmREYXRhKCdlbWJlZGRlZFBsYXllcicpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNvcHlFdmVudEluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVFdmVudCh0aGlzLnZtLmN1cnJlbnRGcmFtZSwgYW5pbWF0aW9uQ3RybC5nZXRDbGlwQm9hcmREYXRhKCdldmVudCcpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdFByb3BlcnR5ICYmIGFuaW1hdGlvbkN0cmwuY29weVByb3BJbmZvKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlUHJvcCh0aGlzLnZtLnNlbGVjdFByb3BlcnR5LCBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ3Byb3AnKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52bS5zZWxlY3RlZElkICYmXG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlTm9kZURhdGEoYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAhLnV1aWQycGF0aFt0aGlzLnZtLnNlbGVjdGVkSWRdLCBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ25vZGUnKSB8fCBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ3Byb3AnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05paw6YCJ5Lit55qE5YWz6ZSu5binXG4gICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVTZWxlY3RLZXkocGFyYW1zOiBJU2VsZWN0S2V5KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0S2V5SW5mbyAmJiAhcGFyYW1zKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVtcFNlbGVjdDogSVNlbGVjdEtleSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhhdC5zZWxlY3RLZXlJbmZvIHx8IHBhcmFtcykpO1xuICAgICAgICBpZiAoIXRlbXBTZWxlY3Quc29ydER1bXApIHtcbiAgICAgICAgICAgIGlmICghcGFyYW1zLm5vZGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVtcFNlbGVjdC5zb3J0RHVtcCA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgbm9kZVBhdGgsIHByb3AgfSA9IHBhcmFtcztcbiAgICAgICAgY29uc3QgcGF0aCA9IG5vZGVQYXRoICsgcHJvcDtcbiAgICAgICAgaWYgKCghdGVtcFNlbGVjdC5zb3J0RHVtcFtwYXRoXSAmJiAhcGFyYW1zLmtleUZyYW1lcy5sZW5ndGgpIHx8ICFwcm9wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZnJhbWVzID0gcGFyYW1zLmtleUZyYW1lcy5tYXAoKHBhcmFtOiBJU2VsZWN0UGFyYW0pID0+IHBhcmFtLmZyYW1lKSB8fCBbXTtcbiAgICAgICAgdGVtcFNlbGVjdC5zb3J0RHVtcFtwYXRoXSA9IHtcbiAgICAgICAgICAgIGtleUZyYW1lczogcGFyYW1zLmtleUZyYW1lcyxcbiAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICBub2RlUGF0aCxcbiAgICAgICAgICAgIGZyYW1lcyxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXBhcmFtcy5rZXlGcmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBkZWxldGUgdGVtcFNlbGVjdC5zb3J0RHVtcFtwYXRoXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQga2V5RnJhbWVzOiBJS2V5RnJhbWVEYXRhW10gPSBbXTtcblxuICAgICAgICBPYmplY3Qua2V5cyh0ZW1wU2VsZWN0LnNvcnREdW1wKS5tYXAoKHBhdGg6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRlbXBTZWxlY3Quc29ydER1bXAhW3BhdGhdO1xuICAgICAgICAgICAgaWYgKCFpdGVtLmtleUZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGVtcFNlbGVjdC5zb3J0RHVtcCFbcGF0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXlGcmFtZXMgPSBrZXlGcmFtZXMuY29uY2F0KGl0ZW0ua2V5RnJhbWVzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlbXBTZWxlY3Qua2V5RnJhbWVzID0ga2V5RnJhbWVzLnNvcnQoKGE6IElLZXlGcmFtZURhdGEsIGI6IElLZXlGcmFtZURhdGEpID0+IGEuZnJhbWUgLSBiLmZyYW1lKTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gdGVtcFNlbGVjdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6Xmn5DkuKrlhbPplK7luKflnKjpgInkuK3nmoTlhbPplK7luKflhoXnmoTkvY3nva5cbiAgICAgKiBAcGFyYW0gcGFyYW1cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0UG9zaXRpb25BdFNlbGVjdChwYXJhbTogSVNlbGVjdFBhcmFtKSB7XG4gICAgICAgIGlmICghdGhpcy52bS5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMudm0uc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMhLmZpbmRJbmRleCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS5wcm9wID09PSBwYXJhbS5wcm9wICYmIGl0ZW0uZnJhbWUgPT09IHBhcmFtLmZyYW1lICYmIGl0ZW0ubm9kZVBhdGggPT09IHBhcmFtLm5vZGVQYXRoO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vpmaTpg6jliIbpgInkuK3nmoTlhbPplK7luKdcbiAgICAgKiBAcGFyYW0gcGFyYW1zXG4gICAgICovXG4gICAgcHVibGljIHJlbW92ZVNlbGVjdEtleShwYXJhbXM6IElTZWxlY3RQYXJhbVtdKSB7XG4gICAgICAgIGlmICghdGhpcy52bS5zZWxlY3RLZXlJbmZvIHx8ICF0aGlzLnZtLnNlbGVjdEtleUluZm8ua2V5RnJhbWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RLZXlJbmZvOiBJU2VsZWN0S2V5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLnZtLnNlbGVjdEtleUluZm8pKTtcbiAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcyEuZm9yRWFjaCgoaW5mbzogSVNlbGVjdFBhcmFtLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAocGFyYW1zLmZpbmQoKHBhcmFtKSA9PiBMb2Rhc2guaXNFcXVhbChpbmZvLCBwYXJhbSkpKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMhLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMhLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkZWxldGUgc2VsZWN0S2V5SW5mby5zb3J0RHVtcDtcbiAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gc2VsZWN0S2V5SW5mbztcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yig6Zmk6YCJ5Lit55qE5bWM5YWl5pKt5pS+5Zmo5pWw5o2uXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgZGVsZXRlU2VsZWN0ZUVtYmVkZGVkUGxheWVycygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoKGRlbGV0ZUVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaW5mbywgZmFsc2UpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IG51bGw7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2FuaW1hdGlvbi1lbWJlZGRlZFBsYXllcicsIEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2FuaW1hdGlvbi1lbWJlZGRlZFBsYXllcicpKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IElBcHBseU9wZXJhdGlvbihvcGVyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmiZPlvIDmn5DkuIDluKfnmoTkuovku7bluKfnvJbovpHnlYzpnaJcbiAgICAgKiBAcGFyYW0gZnJhbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgb3BlbkV2ZW50RWRpdG9yKGZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy52bS5lZGl0RXZlbnRGcmFtZSA9IGZyYW1lO1xuICAgICAgICB0aGlzLnZtLm1hc2tQYW5lbCA9ICdldmVudCc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet5LqL5Lu257yW6L6R55WM6Z2iXG4gICAgICovXG4gICAgcHVibGljIGNsb3NlTWFza1BhbmVsKCkge1xuICAgICAgICB0aGlzLnZtLm1hc2tQYW5lbCA9ICcnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruW9k+WJjemcgOimgeenu+WKqOeahOiKgueCueaVsOaNrlxuICAgICAqIEBwYXJhbSBub2RlUGF0aFxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRNb3ZlUGF0aChub2RlUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIFRPRE8g6L+Z5bqU6K+l5piv5LiA5Liq5Lit6Ze054q25oCB77yM5LiN6ZyA6KaB5pyA5aSW5bGC55+l5pmT5o6n5Yi277yfXG4gICAgICAgIHRoaXMudm0ubW92ZU5vZGVQYXRoID0gbm9kZVBhdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Y+W5raI56e75YqoXG4gICAgICovXG4gICAgcHVibGljIGNhbmNlbE1vdmVOb2RlKCkge1xuICAgICAgICB0aGlzLnZtLm1vdmVOb2RlUGF0aCA9ICcnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOmAieS4reafkOS4quiKgueCuVxuICAgICAqIEBwYXJhbSBub2RlUGF0aFxuICAgICAqIEBwYXJhbSBjdHJsIOaYr+WQpuaMieS4iyBjdHJsXG4gICAgICovXG4gICAgcHVibGljIHNlbGVjdE5vZGUobm9kZVBhdGg6IHN0cmluZywgY3RybCA9IGZhbHNlKSB7XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgdXVpZHMgPSBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5wYXRoMnV1aWRbbm9kZVBhdGhdO1xuICAgICAgICBpZiAodXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdFV1aWRzID0gW3V1aWRzWzBdXTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RVdWlkc1swXSAhPT0gdGhhdC5zZWxlY3RlZElkICYmIGN0cmwpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RVdWlkcy5wdXNoKHRoYXQuc2VsZWN0ZWRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGF0LnNlbGVjdGVkSWQgPSB1dWlkc1swXTtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0UGF0aCA9ICcnO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51cGRhdGUoJ25vZGUnLCBzZWxlY3RVdWlkcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDkuKLlpLHoioLngrnml7bnmoTlpITnkIbpgLvovpFcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0UGF0aCA9IG5vZGVQYXRoO1xuICAgICAgICAgICAgdGhhdC5wcm9wZXJ0aWVzID0gdGhpcy5jYWxjUHJvcGVydHkoKTtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0ZWRJZCA9ICcnO1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RlZElkcy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5byA5aeL56e75Yqo5p+Q5Liq6IqC54K5IFRPRE8g5Y+q6ZyA6KaB5aSN5Yi257KY6LS06IqC54K55Yqf6IO95Y2z5Y+vXG4gICAgICogQHBhcmFtIHBhdGhcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhcnRNb3ZlTm9kZShwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy52bS5tb3ZlTm9kZVBhdGggPSBwYXRoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiusOW9leW8gOWni+aLluaLveeahOWFs+mUruW4p+S/oeaBr1xuICAgICAqIEBwYXJhbSBkcmFnS2V5c0luZm9cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhcnREcmFnS2V5KGRyYWdLZXlzSW5mbzogSVN0YXJ0RHJhZ0tleSB8IG51bGwsIGN0cmwgPSBmYWxzZSkge1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoZHJhZ0tleXNJbmZvKSB7XG4gICAgICAgICAgICBkcmFnS2V5c0luZm8ua2V5RnJhbWVzLnNvcnQoKGEsIGIpID0+IGEuZnJhbWUgLSBiLmZyYW1lKTtcbiAgICAgICAgICAgIGRyYWdLZXlzSW5mby5zb3J0RHVtcCA9IHNvcnRLZXlzVG9UcmVlTWFwKGRyYWdLZXlzSW5mby5rZXlGcmFtZXMpO1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0UGFyYW1zOiBJS2V5RnJhbWVEYXRhID0gZHJhZ0tleXNJbmZvLmtleUZyYW1lc1swXTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RQYXJhbXMubm9kZVBhdGggIT09IHRoYXQuY29tcHV0ZVNlbGVjdFBhdGgpIHtcbiAgICAgICAgICAgICAgICAvLyDpgInkuK3oioLngrnnmoTot6/lvoTkuI7lvZPliY3ot6/lvoTkuI3lkIzvvIzmm7TmlrAgc2VsZWN0ZWRJZCDkuLrmlLnot6/lvoTkuIvnmoTnrKzkuIDkuKroioLngrkgdXVpZFxuICAgICAgICAgICAgICAgIC8vIOazqOaEj+WkhOeQhuWQjOWQjeiKgueCueeahOmAieS4remXrumimFxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWRzID0gYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAucGF0aDJ1dWlkW3NlbGVjdFBhcmFtcy5ub2RlUGF0aF07XG4gICAgICAgICAgICAgICAgaWYgKHV1aWRzWzBdICE9PSB0aGF0LnNlbGVjdGVkSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIHRoYXQuc2VsZWN0ZWRJZCk7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgdXVpZHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAvLyAxLiDmm7TmlrDlvZPliY3pgInkuK3oioLngrlcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VsZWN0ZWRJZCDlgZrkuoYgd2F0Y2jvvIzmm7TmjaLpgInkuK3oioLngrnlkI7vvIzmuIXnqbrkuYvliY3nmoTpgInkuK3lsZ7mgKfovajpgZPkv6Hmga/vvIzlm6DogIzpnIDopoHlhYjkv67mlLlcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RlZElkID0gdXVpZHNbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnZtLnNlbGVjdFByb3BlcnR5IHx8IHRoaXMudm0uc2VsZWN0UHJvcGVydHkucHJvcCAhPT0gc2VsZWN0UGFyYW1zLnByb3AgfHwgdGhpcy52bS5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aCAhPT0gc2VsZWN0UGFyYW1zLm5vZGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcERhdGEgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbc2VsZWN0UGFyYW1zLm5vZGVQYXRoXVtzZWxlY3RQYXJhbXMucHJvcF07XG4gICAgICAgICAgICAgICAgLy8gMi4g5pu05paw5b2T5YmN6YCJ5Lit5bGe5oCn6L2o6YGT5L+h5oGvXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZVNlbGVjdFByb3BlcnR5KHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IHNlbGVjdFBhcmFtcy5ub2RlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcHJvcDogc2VsZWN0UGFyYW1zLnByb3AsXG4gICAgICAgICAgICAgICAgICAgIGNsaXBVdWlkOiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgaXNDdXJ2ZVN1cHBvcnQ6IHByb3BEYXRhLmlzQ3VydmVTdXBwb3J0LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4g5pu05paw5b2T5YmN6YCJ5Lit55qE5YWz6ZSu5bin5L+h5oGvXG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IGRyYWdLZXlzSW5mbztcbiAgICAgICAgdGhhdC51cGRhdGVTZWxlY3RLZXkrKztcbiAgICAgICAgLy8g5oyJ5LiLIEN0cmwg5pe25LiN5YWB6K645ouW5ou9XG4gICAgICAgIGlmIChjdHJsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdrZXknO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOmAieS4reeahOWxnuaAp+S/oeaBr1xuICAgICAqIEBwYXJhbSBkcmFnUHJvcGVydHlcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlU2VsZWN0UHJvcGVydHkoZHJhZ1Byb3BlcnR5OiB7IG5vZGVQYXRoOiBzdHJpbmc7IHByb3A6IHN0cmluZzsgY2xpcFV1aWQ6IHN0cmluZzsgaXNDdXJ2ZVN1cHBvcnQ6IGJvb2xlYW47IG1pc3Npbmc/OiBib29sZWFuIH0pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmIChkcmFnUHJvcGVydHkuY2xpcFV1aWQgIT09IHRoaXMudm0uY3VycmVudENsaXAgfHwgZHJhZ1Byb3BlcnR5Lm5vZGVQYXRoICE9PSB0aGlzLnZtLmNvbXB1dGVTZWxlY3RQYXRoKSB7XG4gICAgICAgICAgICAvLyDlvZPliY3pgInkuK3lsZ7mgKfovajpgZPnmoTkv6Hmga/kuI3lsZ7kuo7lvZPliY3nvJbovpHnmoQgY2xpcCDliJnkuI3mn6Xor6Lkv6Hmga9cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgSWdldFByb3BWYWx1ZUF0RnJhbWUoZHJhZ1Byb3BlcnR5LmNsaXBVdWlkLCBkcmFnUHJvcGVydHkubm9kZVBhdGgsIGRyYWdQcm9wZXJ0eS5wcm9wLCB0aGF0LmN1cnJlbnRGcmFtZSk7XG4gICAgICAgIGlmICghZHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQuc2VsZWN0UHJvcGVydHkgPSBPYmplY3QuYXNzaWduKGRyYWdQcm9wZXJ0eSwge1xuICAgICAgICAgICAgZHVtcCxcbiAgICAgICAgICAgIHR5cGU6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogZHVtcC50eXBlLFxuICAgICAgICAgICAgICAgIGV4dGVuZHM6IGR1bXAuZXh0ZW5kcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICB0aGF0LmxpZ2h0Q3VydmUgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiusOW9leWImuW8gOWni+aLluWKqOeahOS6i+S7tuW4p+S/oeaBr1xuICAgICAqIEBwYXJhbSBkcmFnRXZlbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhcnREcmFnRXZlbnQoZHJhZ0V2ZW50OiBJU3RhcnREcmFnRXZlbnQsIGhhc0N0cmwgPSBmYWxzZSkge1xuICAgICAgICB0aGlzLnZtLnNlbGVjdEV2ZW50SW5mbyA9IGRyYWdFdmVudDtcbiAgICAgICAgLy8g5oyJ5LiLIEN0cmwg6ZSu5pe25LiN5YWB6K6456e75YqoXG4gICAgICAgIGlmICghaGFzQ3RybCkge1xuICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdldmVudCc7XG4gICAgICAgIH0gZWxzZSBpZiAoRmxhZ3MubW91c2VEb3duTmFtZSA9PT0gJ2V2ZW50Jykge1xuICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05paw5o+Q56S65bCP57qi57q/55qE5L2N572u5L+h5oGv5o+Q56S6XG4gICAgICogQHBhcmFtIHhcbiAgICAgKiBAcGFyYW0geVxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVNb3VzZUZyYW1lKHBvaW50PzogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgZnJhbWU/OiBudW1iZXIgfSwgb2Zmc2V0RnJhbWU/OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghcG9pbnQgfHwgKCFwb2ludC54ICYmICFwb2ludC55KSkge1xuICAgICAgICAgICAgdGhhdC5tb3ZlSW5mbyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZ3JpZEN0cmwucGFnZVRvQ3RybChwb2ludC54LCBwb2ludC55KTtcbiAgICAgICAgY29uc3QgZnJhbWUgPSBwb2ludC5mcmFtZSB8fCBncmlkQ3RybC5wYWdlVG9GcmFtZShwb2ludC54KTtcbiAgICAgICAgLy8g5YWz6ZSu5bin55qE5Y2K5b6E5aSn5bCP5pivIDVcbiAgICAgICAgaWYgKCF0aGF0Lm1vdmVJbmZvKSB7XG4gICAgICAgICAgICB0aGF0Lm1vdmVJbmZvID0ge1xuICAgICAgICAgICAgICAgIGZyYW1lLFxuICAgICAgICAgICAgICAgIHg6IHJlc3VsdC54ICsgNSxcbiAgICAgICAgICAgICAgICB5OiByZXN1bHQueSArIDUsXG4gICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IG9mZnNldEZyYW1lIHx8IDAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5tb3ZlSW5mby5mcmFtZSA9IGZyYW1lO1xuICAgICAgICAgICAgdGhhdC5tb3ZlSW5mby54ID0gcmVzdWx0LnggKyA1O1xuICAgICAgICAgICAgdGhhdC5tb3ZlSW5mby55ID0gcmVzdWx0LnkgKyA1O1xuICAgICAgICAgICAgdGhhdC5tb3ZlSW5mby5vZmZzZXRGcmFtZSA9IG9mZnNldEZyYW1lIHx8IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsZXlvIBcbiAgICAgKiBAcGFyYW0gcHJvcFxuICAgICAqIEBwYXJhbSBleHBhbmRcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlUHJvcEV4cGFuZFN0YXRlKHByb3A6IHN0cmluZywgZXhwYW5kOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICB0aGF0LmV4cGFuZEluZm9bcHJvcF0gPSBleHBhbmQ7XG4gICAgICAgIGNvbnN0IHBhcnRLZXlzID0gdGhhdC5wcm9wZXJ0aWVzIVtwcm9wXS5wYXJ0S2V5cztcbiAgICAgICAgaWYgKCFwYXJ0S2V5cykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtBbmltYXRpb24gRWRpdG9yXSBDYW4ndCBnZXQgcGFydEtleXMgb2YgcHJvcCgke3Byb3B9KWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhcnRLZXlzLmZvckVhY2goKHByb3A6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdGhhdC5wcm9wZXJ0aWVzIVtwcm9wXS5oaWRkZW4gPSAhZXhwYW5kO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGF0LnByb3BlcnRpZXMgPSB0aGlzLmNhbGNQcm9wZXJ0eSgpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgLy8g5pu05paw6YCJ5Lit5YWz6ZSu5bin5pWw5o2uXG4gICAgICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdEtleSsrO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKiog5a+55pe26Ze06L2055qE5aSE55CG5pa55rOVICoqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgLyoqXG4gICAgICog6K6p5oyH5a6a5YWz6ZSu5bin5Zyo55S75biD5Yy65Z+f5pi+56S6XG4gICAgICog5oyH5a6a5YWz6ZSu5bin6LaF5Ye655S75biD5bem6L6555WM5Lya5bCG5YW26K6+572u5Zyo55S75biD5Y+z6L6555WMXG4gICAgICog5oyH5a6a5YWz6ZSu5bin6LaF5Ye655S75biD5Y+z6L6555WM5Lya5bCG5YW26K6+572u5Zyo55S75biD5bem6L6555WMXG4gICAgICogQHBhcmFtIGZyYW1lXG4gICAgICovXG4gICAgc2hvd0ZyYW1lSW5HcmlkKGZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBncmlkQ3RybC5nZXRGcmFtZVJhbmcoKTtcbiAgICAgICAgLy8g6LaF6L+H6L6555WMXG4gICAgICAgIGlmIChmcmFtZSA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0R3JpZEhlYWRlckZyYW1lKGZyYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChmcmFtZSA8PSBzdGFydCkge1xuICAgICAgICAgICAgdGhpcy5zZXRHcmlkRm9vdGVyRnJhbWUoZnJhbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5bCG55S75biD56e75Yqo5Yiw5bCG5oyH5a6a5bin5pS+572u5Zyo6aaW5L2N55qE55S76Z2iXG4gICAgICogQHBhcmFtIGZyYW1lXG4gICAgICovXG4gICAgc2V0R3JpZEhlYWRlckZyYW1lKGZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgeyBzdGFydCB9ID0gZ3JpZEN0cmwuZ2V0RnJhbWVSYW5nKCk7XG4gICAgICAgIGNvbnN0IHN0YXJ0UG9zaXRpb24gPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKHN0YXJ0KTtcbiAgICAgICAgdGhpcy5tb3ZlVGltZUxpbmUoc3RhcnRQb3NpdGlvbiAtIGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZnJhbWUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbnlLvluIPnp7vliqjliLDlsIbmjIflrprluKfmlL7nva7lnKjmnKvlsL7nmoTnlLvpnaJcbiAgICAgKiBAcGFyYW0gZnJhbWVcbiAgICAgKi9cbiAgICBzZXRHcmlkRm9vdGVyRnJhbWUoZnJhbWU6IG51bWJlcikge1xuICAgICAgICBjb25zdCB7IGVuZCB9ID0gZ3JpZEN0cmwuZ2V0RnJhbWVSYW5nKCk7XG4gICAgICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhlbmQpO1xuICAgICAgICB0aGlzLm1vdmVUaW1lTGluZShlbmRQb3NpdGlvbiAtIGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZnJhbWUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlr7nmlbTkuKrml7bpl7TovbTov5vooYznp7vliqhcbiAgICAgKiBAcGFyYW0gZGVsdGEgKOenu+WKqOi3neemuylcbiAgICAgKi9cbiAgICBtb3ZlVGltZUxpbmUoZGVsdGE6IG51bWJlcikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgZ3JpZEN0cmwuZ3JpZCEudHJhbnNmZXJYKGRlbHRhKTtcblxuICAgICAgICB0aGlzLnZtLnRyYW5zZm9ybUV2ZW50LmVtaXRVcGRhdGUoJ2dyaWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlr7nmlbTkuKrml7bpl7TovbTov5vooYznvKnmlL5cbiAgICAgKiBAcGFyYW0gZGVsdGEg57yp5pS+5pe26byg5qCH5rua5Yqo6Led56a777yM55So5YW36K6h566X57yp5pS+5YCN5pWwXG4gICAgICogQHBhcmFtIHgg57yp5pS+5Lit5b+D54K5XG4gICAgICovXG4gICAgc2NhbGVUaW1lTGluZUF0KGRlbHRhOiBudW1iZXIsIHg6IG51bWJlcikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBzbW9vdGhTY2FsZShkZWx0YSwgZ3JpZEN0cmwuc2NhbGUpO1xuICAgICAgICBpZiAoKGRlbHRhIDwgMCAmJiBzY2FsZSA8PSBncmlkQ3RybC5ncmlkIS54TWluU2NhbGUpIHx8IChkZWx0YSA+IDAgJiYgc2NhbGUgPj0gZ3JpZEN0cmwuZ3JpZCEueE1heFNjYWxlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGdyaWRDdHJsLmdyaWQhLnhBeGlzU2NhbGVBdCh4LCBzY2FsZSk7IC8vIOWdkOagh+eUu+W4g+abtOaUuVxuXG4gICAgICAgIHRoaXMudm0udHJhbnNmb3JtRXZlbnQuZW1pdFVwZGF0ZSgnZ3JpZCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaMieeFp+afkOS4que8qeaUvuavlOS+i+WvueaVtOS4quaXtumXtOi9tOi/m+ihjOe8qeaUvlxuICAgICAqIEBwYXJhbSBzY2FsZU51bSDnvKnmlL7mr5TkvotcbiAgICAgKi9cbiAgICBzY2FsZVRpbWVMaW5lV2l0aChzY2FsZU51bTogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuXG4gICAgICAgIGNvbnN0IHNjYWxlID0gY2xhbXAoc2NhbGVOdW0sIGdyaWRDdHJsLmdyaWQhLnhNaW5TY2FsZSwgZ3JpZEN0cmwuZ3JpZCEueE1heFNjYWxlKTtcbiAgICAgICAgZ3JpZEN0cmwuZ3JpZCEueEF4aXNTY2FsZSA9IHNjYWxlO1xuXG4gICAgICAgIHRoaXMudm0udHJhbnNmb3JtRXZlbnQuZW1pdFVwZGF0ZSgnZ3JpZCcpO1xuICAgIH1cblxuICAgIC8vIOWFs+mUruW4p+eahOiHquWKqOenu+WKqFxuICAgIHJ1blBvaW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICB0aGlzLmFuaVBsYXlUYXNrID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGF0LmFuaW1hdGlvblN0YXRlID09PSAncGxheScgJiYgdGhhdC5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0N1cnJlbnRUaW1lKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5Qb2ludGVyKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5pUGxheVRhc2sgJiYgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmlQbGF5VGFzayk7XG4gICAgICAgICAgICAgICAgLy8g6aKE6Ziy5pWw5o2u5pyq5a6M5pW05pu05paw77yM5aSa5p+l6K+i5LiA5qyhXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0N1cnJlbnRUaW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDorqHnrpfmjqfliLbmnYYgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKiog5b2T5YmN5YWz6ZSu5bin5aSE55CG55u45YWzICoqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgLy8g5pu05pS55b2T5YmN5YWz6ZSu5binXG4gICAgc2V0Q3VycmVudEZyYW1lKGZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgLy8g5pu05paw5b2T5YmN5YWz6ZSu5binXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoZnJhbWUgPCAwKSB7XG4gICAgICAgICAgICBmcmFtZSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5jdXJyZW50RnJhbWUgPSBmcmFtZTtcbiAgICAgICAgaWYgKGZyYW1lID09PSAwKSB7XG4gICAgICAgICAgICBpZiAoZ3JpZEN0cmwuZ3JpZCAmJiBncmlkQ3RybC5ncmlkLnhBeGlzT2Zmc2V0ICE9PSBncmlkQ3RybC5zdGFydE9mZnNldCkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVRpbWVMaW5lKGdyaWRDdHJsLnN0YXJ0T2Zmc2V0IC0gZ3JpZEN0cmwuZ3JpZC54QXhpc09mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaG93RnJhbWVJbkdyaWQoZnJhbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOabtOaWsOW9k+WJjeWFs+mUruW4p+S9jee9rlxuICAgICAqIEBwYXJhbSBmcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVDdXJyZW50RnJhbWUoZnJhbWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnNldEN1cnJlbnRGcmFtZShmcmFtZSk7XG4gICAgICAgIGNvbnN0IHRpbWUgPSBmcmFtZVRvVGltZShmcmFtZSwgdGhpcy52bS5zYW1wbGUpO1xuICAgICAgICBJc2V0Q3VyRWRpdFRpbWUodGltZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGp1bXBQcmV2RnJhbWUoKSB7XG4gICAgICAgIGlmICh0aGlzLnZtLmN1cnJlbnRGcmFtZSA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKC0tdGhpcy52bS5jdXJyZW50RnJhbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGp1bXBOZXh0RnJhbWUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKCsrdGhpcy52bS5jdXJyZW50RnJhbWUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBqdW1wRmlyc3RGcmFtZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUoMCk7XG4gICAgfVxuXG4gICAgcHVibGljIGp1bXBMYXN0RnJhbWUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKHRoaXMudm0ubGFzdEZyYW1lSW5mby5mcmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LiL5LiA5q2lXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG5leHRTdGVwKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKHRoaXMuaXNMb2NrKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgdGhpcy5tb3ZlU2VsZWN0S2V5cygxLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgdGhpcy5tb3ZlU2VsZWN0RW1iZWRkZWRQbGF5ZXJzKDEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0RXZlbnRJbmZvKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLm1vdmVTZWxlY3RFdmVudHMoMSwgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5qdW1wTmV4dEZyYW1lKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5LiK5LiA5q2lXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIHByZXZTdGVwKCkge1xuICAgICAgICBpZiAodGhpcy5pc0xvY2spIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgdGhpcy5tb3ZlU2VsZWN0S2V5cygtMSwgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVTZWxlY3RFbWJlZGRlZFBsYXllcnMoLTEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEV2ZW50SW5mbykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5tb3ZlU2VsZWN0RXZlbnRzKC0xLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmp1bXBQcmV2RnJhbWUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDot7PovazliLDkuIvkuIDlhbPplK7luKdcbiAgICAgKi9cbiAgICBwdWJsaWMganVtcFRvTmV4dEtleSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXRoYXQuY29tcHV0ZVNlbGVjdFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQga2V5ZnJhbWVzID0gW107XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAga2V5ZnJhbWVzID0gdGhpcy5jYWxjTm9kZUZyYW1lcyh0aGF0LmNvbXB1dGVTZWxlY3RQYXRoLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleWZyYW1lcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt0aGF0LmNvbXB1dGVTZWxlY3RQYXRoXVt0aGF0LnNlbGVjdFByb3BlcnR5LnByb3BdLmtleUZyYW1lcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5jdXJyZW50RnJhbWUgPiBrZXlmcmFtZXNba2V5ZnJhbWVzLmxlbmd0aCAtIDFdLmZyYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRGcmFtZShrZXlmcmFtZXNba2V5ZnJhbWVzLmxlbmd0aCAtIDFdLmZyYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Yga2V5ZnJhbWVzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5mcmFtZSA+IHRoYXQuY3VycmVudEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUoaXRlbS5mcmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6Lez6L2s5Yiw5LiK5LiA5YWz6ZSu5binXG4gICAgICovXG4gICAgcHVibGljIGp1bXBUb1ByZXZLZXkoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICF0aGF0LmNvbXB1dGVTZWxlY3RQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGtleWZyYW1lcyA9IFtdO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIGtleWZyYW1lcyA9IHRoaXMuY2FsY05vZGVGcmFtZXModGhhdC5jb21wdXRlU2VsZWN0UGF0aCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlmcmFtZXMgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbdGhhdC5jb21wdXRlU2VsZWN0UGF0aF1bdGhhdC5zZWxlY3RQcm9wZXJ0eS5wcm9wXS5rZXlGcmFtZXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoYXQuY3VycmVudEZyYW1lIDwga2V5ZnJhbWVzWzBdLmZyYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRGcmFtZShrZXlmcmFtZXNbMF0uZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSBrZXlmcmFtZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lID0ga2V5ZnJhbWVzW2ldLmZyYW1lO1xuICAgICAgICAgICAgaWYgKGZyYW1lIDwgdGhhdC5jdXJyZW50RnJhbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRGcmFtZShmcmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqIOiPnOWNleagj+eahOebuOWFs+mFjee9riAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIHB1YmxpYyBhc3luYyBtb3ZlU2VsZWN0RW1iZWRkZWRQbGF5ZXJzKG9mZnNldEZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uczogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGluZm8gb2YgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWxPZmZzZXQgPSBNYXRoLm1heChpbmZvLnJhd0luZm8uYmVnaW4gKyBvZmZzZXRGcmFtZSwgMCkgLSBpbmZvLnJhd0luZm8uYmVnaW47XG4gICAgICAgICAgICAvLyDotoXlh7rkuLTnlYzngrnvvIzkuI3lj6/lho3np7vliqhcbiAgICAgICAgICAgIGlmIChyZWFsT2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3RHVtcCA9IHtcbiAgICAgICAgICAgICAgICAuLi5pbmZvLnJhd0luZm8sXG4gICAgICAgICAgICAgICAgYmVnaW46IGluZm8ucmF3SW5mby5iZWdpbiArIHJlYWxPZmZzZXQsXG4gICAgICAgICAgICAgICAgZW5kOiBpbmZvLnJhd0luZm8uZW5kICsgcmVhbE9mZnNldCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcGVyYXRpb25zLnB1c2godXBkYXRlRW1iZWRkZWRQbGF5ZXIodGhpcy52bS5jdXJyZW50Q2xpcCwgaW5mby5yYXdJbmZvLCBuZXdEdW1wKSk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGluZm8sIHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckR1bXBUb0luZm8obmV3RHVtcCkpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IElBcHBseU9wZXJhdGlvbihvcGVyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vliqjpgInkuK3nmoTlhbPplK7luKdcbiAgICAgKiBAcGFyYW0gb2Zmc2V0RnJhbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgbW92ZVNlbGVjdEtleXMob2Zmc2V0RnJhbWU6IG51bWJlciwgY3RybCA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICF0aGF0LnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDpgInkuK3lhbPplK7luKfmmK/lhbbku5bnu4Tku7Ygd2F0Y2gg55qE5a+56LGh77yM6KaB5bC96YeP5LiA5qyh5oCn4oCc6LWL5YC84oCd77yM6ICM5LiN5piv5b6q546v55qE5Y676K6h566X6LWL5YC8XG4gICAgICAgIGNvbnN0IHRlbXBTZWxlY3Q6IElTZWxlY3RLZXkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoYXQuc2VsZWN0S2V5SW5mbykpO1xuICAgICAgICB0ZW1wU2VsZWN0Lm9mZnNldEZyYW1lID0gdGVtcFNlbGVjdC5vZmZzZXRGcmFtZSB8fCAwO1xuICAgICAgICBjb25zdCB7IGtleUZyYW1lczoga2V5RnJhbWVEYXRhcyB9ID0gdGVtcFNlbGVjdDtcbiAgICAgICAgY29uc3QgZnJhbWVzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleUZyYW1lRGF0YXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBrZXlGcmFtZURhdGFzW2ldO1xuICAgICAgICAgICAgbGV0IG5ld0ZyYW1lID0gaXRlbS5mcmFtZSArIG9mZnNldEZyYW1lO1xuICAgICAgICAgICAgaWYgKG5ld0ZyYW1lIDwgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1RvYXN0KCdpMThuOmFuaW1hdG9yLm1vdmVfa2V5X3RpcHMuY2FuX25vdF9iZV96ZXJvJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5paw5YWz6ZSu5bin5LiN5Zyo6YCJ5Lit55qE5YWz6ZSu5bin5pWw5o2u5LiK5pe277yM6ZyA6KaB5qCh6aqMXG4gICAgICAgICAgICBpZiAoIXRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMhLmZpbmQoKGl0ZW06IElLZXlGcmFtZSkgPT4gaXRlbS5mcmFtZSA9PT0gbmV3RnJhbWUpKSB7XG4gICAgICAgICAgICAgICAgLy8g5qCh6aqM5piv5ZCm5Lya6KaG55uW546w5pyJ5YWz6ZSu5binXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW0gPSBrZXlGcmFtZURhdGFzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleUZyYW1lcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFtwYXJhbS5ub2RlUGF0aF1bcGFyYW0ucHJvcF0ua2V5RnJhbWVzO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrZXlGcmFtZXMuZmluZCgoaXRlbTogSUtleUZyYW1lKSA9PiBpdGVtLmZyYW1lID09PSBuZXdGcmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g55uu5YmN5LiN5pSv5oyBIGN0cmwvY21kIOi3s+i/h++8jOW/q+aNt+mUrua2iOaBr+S4jeaUr+aMgeS8oOmAkiBldmVuZVxuICAgICAgICAgICAgICAgICAgICAvLyBsZXQgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoY3RybCAmJiAhdGhpcy5oYXNTaG93U3RpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIG1lc3NhZ2UgPSBFZGl0b3IuSTE4bi50KCdhbmltYXRvci5tb3ZlX2tleV90aXBzLm1vdmVfd2l0aF9jdHJsJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH0gZWxzZSBpZiAoY3RybCAmJiB0aGlzLmhhc1Nob3dTdGljaykge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgbWVzc2FnZSA9IEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLm1vdmVfa2V5X3RpcHMubW92ZV9rZXlzX3dpdGhfY3RybCcpO1xuICAgICAgICAgICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgbWVzc2FnZSA9IEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLm1vdmVfa2V5X3RpcHMuc2hvdWxkX21vdmVfa2V5c193aXRoX2N0cmwnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLnNob3dUb2FzdChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsIHx8IHRoaXMuaGFzU2hvd1N0aWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAtIOWkmumAieWFs+mUruW4p+W5tuS4lOS8muimhuebluWFtuS7luWFs+mUruW4pyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0g5Y2V6YCJ5YWz6ZSu5bin5bm25LiU5rKh5pyJ5oyJ5LiLIEN0cmwg5Lya6KaG55uW5YW25LuW5YWz6ZSu5bin5pe277yMXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnm7TmjqXpgIDlh7rkuI3lhYHorrjnu6fnu63np7vliqhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIOi3s+i/h+WFs+mUruW4p+aXtu+8jOebtOaOpeiuoeeul+WlvSBvZmZzZXRGcmFtZVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZSA9IG9mZnNldEZyYW1lID4gMCA/IG9mZnNldEZyYW1lICsgMSA6IG9mZnNldEZyYW1lIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgbmV3RnJhbWUgPSBpdGVtLmZyYW1lICsgb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnJhbWVzLnB1c2gobmV3RnJhbWUpO1xuICAgICAgICAgICAgaXRlbS5mcmFtZSA9IG5ld0ZyYW1lO1xuICAgICAgICAgICAgaXRlbS54ID0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChpdGVtLmZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChmcmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZnJhbWVzLnNvcnQoKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBhIC0gYik7XG4gICAgICAgIGlmIChvZmZzZXRGcmFtZSA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0ZyYW1lSW5HcmlkKGZyYW1lc1tmcmFtZXMubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaG93RnJhbWVJbkdyaWQoZnJhbWVzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wU2VsZWN0LmN0cmwgPSBjdHJsO1xuICAgICAgICAvLyDpm4bkvZPnp7vliqjnm7jlkIzlhbPplK7luKfml7bvvIzor6Ugb2Zmc2V0RnJhbWUg5omN5pyJ5pWIXG4gICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUgKz0gb2Zmc2V0RnJhbWU7XG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IHRlbXBTZWxlY3Q7XG4gICAgICAgIC8vIGFuaW1hdGlvbkN0cmwuY2FsbEJ5RGVib3VuY2UoJ21vdmVLZXlzJyk7XG4gICAgICAgIGF3YWl0IGFuaW1hdGlvbkN0cmwubW92ZUtleXMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnp7vliqjpgInkuK3nmoTkuovku7blhbPplK7luKcgVE9ETyDovazkuYnliLAgQ3RybFxuICAgICAqIEBwYXJhbSBvZmZzZXRGcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBtb3ZlU2VsZWN0RXZlbnRzKG9mZnNldEZyYW1lOiBudW1iZXIsIGN0cmw6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZnJhbWVzIH0gPSB0aGF0LnNlbGVjdEV2ZW50SW5mbyE7XG4gICAgICAgIGNvbnN0IG1vdmVkRnJhbWVzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgbGV0IG5ld0ZyYW1lID0gaXRlbS5mcmFtZSArIG9mZnNldEZyYW1lO1xuICAgICAgICAgICAgaWYgKG5ld0ZyYW1lIDwgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1RvYXN0KCdpMThuOmFuaW1hdG9yLm1vdmVfa2V5X3RpcHMuY2FuX25vdF9iZV96ZXJvJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmcmFtZXMuaW5jbHVkZXMobmV3RnJhbWUpKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5mcmFtZSA9PT0gbmV3RnJhbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWNs+WwhuimhuebluaWsOWFs+mUruW4p1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybCAmJiBmcmFtZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJ2kxOG46YW5pbWF0b3IubW92ZV9rZXlfdGlwcy5tb3ZlX3dpdGhfY3RybCc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3RybCAmJiBmcmFtZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJ2kxOG46YW5pbWF0b3IubW92ZV9rZXlfdGlwcy5tb3ZlX2tleXNfd2l0aF9jdHJsJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnaTE4bjphbmltYXRvci5tb3ZlX2tleV90aXBzLnNob3VsZF9tb3ZlX2tleXNfd2l0aF9jdHJsJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dUb2FzdChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsIHx8IGZyYW1lcy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lID0gb2Zmc2V0RnJhbWUgPiAwID8gb2Zmc2V0RnJhbWUgKyAxIDogb2Zmc2V0RnJhbWUgLSAxO1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmFtZSA9IGl0ZW0uZnJhbWUgKyBvZmZzZXRGcmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtb3ZlZEZyYW1lcy5wdXNoKG5ld0ZyYW1lKTtcbiAgICAgICAgICAgIGl0ZW0uZnJhbWUgPSBuZXdGcmFtZTtcbiAgICAgICAgICAgIGl0ZW0ueCA9IGdyaWRDdHJsLmdyaWQhLnZhbHVlVG9QaXhlbEgoaXRlbS5mcmFtZSkgLSBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBtb3ZlZEZyYW1lcy5zb3J0KChhOiBudW1iZXIsIGI6IG51bWJlcikgPT4gYSAtIGIpO1xuICAgICAgICBpZiAob2Zmc2V0RnJhbWUgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dGcmFtZUluR3JpZChtb3ZlZEZyYW1lc1tmcmFtZXMubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaG93RnJhbWVJbkdyaWQobW92ZWRGcmFtZXNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvIS5vZmZzZXRGcmFtZSArPSBvZmZzZXRGcmFtZTtcbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uQ3RybC5jYWxsQnlEZWJvdW5jZSgnbW92ZUV2ZW50cycpO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDnu5Hlrprkuovku7bnm7jlhbMgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvKipcbiAgICAgKiDnp7vliqjlhbPplK7luKdcbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHB1YmxpYyBvbktleU1vdXNlTW92ZShldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgJHRhcmdldDogYW55ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRlbXBTZWxlY3Q6IElTZWxlY3RLZXkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoYXQuc2VsZWN0S2V5SW5mbykpO1xuICAgICAgICBjb25zdCB7IHN0YXJ0WCwga2V5RnJhbWVzLCBsb2NhdGlvbiwgbm9kZVBhdGggfSA9IHRlbXBTZWxlY3Q7XG4gICAgICAgIGlmIChNYXRoLmFicyhzdGFydFghIC0gZXZlbnQueCkgPCAwLjEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICdjb3B5JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2V3LXJlc2l6ZSc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhcnRGcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LngpO1xuICAgICAgICBsZXQgZW5kRnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZShzdGFydFghKTtcbiAgICAgICAgaWYgKGVuZEZyYW1lIDwgMCkge1xuICAgICAgICAgICAgZW5kRnJhbWUgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9mZnNldEZyYW1lID0gc3RhcnRGcmFtZSAtIGVuZEZyYW1lO1xuICAgICAgICBpZiAob2Zmc2V0RnJhbWUgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvZmZzZXQgPSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKHN0YXJ0RnJhbWUpIC0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChlbmRGcmFtZSk7XG4gICAgICAgIGNvbnN0IGZyYW1lczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGtleUZyYW1lcykge1xuICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlnKjlsZ7mgKfovajpgZPkuIrlvIDlp4vmi5bmi73nmoTlhbPplK7luKfvvIzku4Xlj6/ku6Xnp7vliqjlvZPliY3pgInkuK3oioLngrnnmoTlhbPplK7luKfmlbDmja5cbiAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PT0gJ3Byb3AnICYmIG5vZGVQYXRoICYmIGl0ZW0ubm9kZVBhdGggIT09IG5vZGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5vZmZzZXRGcmFtZSA9IDA7XG4gICAgICAgICAgICAgICAgZnJhbWVzLnB1c2goaXRlbS5mcmFtZSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXdGcmFtZSA9IGl0ZW0uZnJhbWUgKyBvZmZzZXRGcmFtZTtcbiAgICAgICAgICAgIGlmIChuZXdGcmFtZSA8IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVtLnggKz0gb2Zmc2V0O1xuICAgICAgICAgICAgaXRlbS5mcmFtZSA9IG5ld0ZyYW1lO1xuICAgICAgICAgICAgZnJhbWVzLnB1c2gobmV3RnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBTZWxlY3Quc3RhcnRYISArPSBvZmZzZXQ7XG4gICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0ISArPSBvZmZzZXQ7XG4gICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUhICs9IG9mZnNldEZyYW1lO1xuXG4gICAgICAgIGlmICghRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1vdXNlRnJhbWUoeyB4OiBldmVudC54LCB5OiBldmVudC55LCBmcmFtZToga2V5RnJhbWVzWzBdLmZyYW1lIH0sIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IHRlbXBTZWxlY3Q7XG4gICAgICAgIGZyYW1lcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gZ3JpZEN0cmwuZ2V0RnJhbWVSYW5nKCk7XG4gICAgICAgIGlmIChmcmFtZXNbMF0gPD0gc3RhcnQgfHwgZnJhbWVzW2ZyYW1lcy5sZW5ndGggLSAxXSA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRpbWVMaW5lKC1vZmZzZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uQXV4S2V5TW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHZtID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgJHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgY29uc3QgYXV4Q3VydmVTdG9yZSA9IHZtLmF1eEN1cnZlU3RvcmU7XG4gICAgICAgIGlmICghYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVtcFNlbGVjdDogSVNlbGVjdEtleUJhc2UgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGF1eEN1cnZlU3RvcmUuc2VsZWN0S2V5SW5mbykpO1xuICAgICAgICBjb25zdCB7IHN0YXJ0WCwga2V5ZnJhbWVzIH0gPSB0ZW1wU2VsZWN0O1xuICAgICAgICBpZiAoTWF0aC5hYnMoc3RhcnRYISAtIGV2ZW50LngpIDwgMC4xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnY29weSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICdldy1yZXNpemUnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXJ0RnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZShldmVudC54KTtcbiAgICAgICAgbGV0IGVuZEZyYW1lID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoc3RhcnRYISk7XG4gICAgICAgIGlmIChlbmRGcmFtZSA8IDApIHtcbiAgICAgICAgICAgIGVuZEZyYW1lID0gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvZmZzZXRGcmFtZSA9IHN0YXJ0RnJhbWUgLSBlbmRGcmFtZTtcbiAgICAgICAgaWYgKG9mZnNldEZyYW1lID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChzdGFydEZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnZhbHVlVG9QaXhlbEgoZW5kRnJhbWUpO1xuICAgICAgICBjb25zdCBmcmFtZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBrZXlmcmFtZXMpIHtcbiAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcmFtZXMucHVzaChpdGVtLmZyYW1lKTtcblxuICAgICAgICAgICAgY29uc3QgbmV3RnJhbWUgPSBpdGVtLmZyYW1lICsgb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICBpZiAobmV3RnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlbS54ICs9IG9mZnNldDtcbiAgICAgICAgICAgIGl0ZW0uZnJhbWUgPSBuZXdGcmFtZTtcbiAgICAgICAgICAgIGZyYW1lcy5wdXNoKG5ld0ZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRlbXBTZWxlY3Quc3RhcnRYID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGVtcFNlbGVjdC5zdGFydFggKz0gb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGVtcFNlbGVjdC5vZmZzZXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0ZW1wU2VsZWN0Lm9mZnNldCArPSBvZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0ZW1wU2VsZWN0Lm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0ICs9IG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0ZW1wU2VsZWN0Lm9mZnNldEZyYW1lICs9IG9mZnNldEZyYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFGbGFncy5zdGFydERyYWdTdGlja0luZm8pIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTW91c2VGcmFtZShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHg6IGV2ZW50LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGV2ZW50LnksXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiBrZXlmcmFtZXNbMF0uZnJhbWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0ZW1wU2VsZWN0Lm9mZnNldEZyYW1lLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhdXhDdXJ2ZVN0b3JlLnNlbGVjdEtleUluZm8gPSB0ZW1wU2VsZWN0O1xuICAgICAgICBmcmFtZXMuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgICAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGdyaWRDdHJsLmdldEZyYW1lUmFuZygpO1xuICAgICAgICBpZiAoZnJhbWVzWzBdIDw9IHN0YXJ0IHx8IGZyYW1lc1tmcmFtZXMubGVuZ3RoIC0gMV0gPj0gZW5kKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUaW1lTGluZSgtb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkVtYmVkZGVkUGxheWVyTW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIUZsYWdzLnN0YXJ0RHJhZ0VtYmVkZGVkUGxheWVySW5mbyB8fCAhdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvZmZzZXQgPSBldmVudC54IC0gRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvLnN0YXJ0WDtcbiAgICAgICAgaWYgKG9mZnNldCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0ICR0YXJnZXQ6IGFueSA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvLm9mZnNldCA9IG9mZnNldDtcbiAgICAgICAgc3dpdGNoIChGbGFncy5zdGFydERyYWdFbWJlZGRlZFBsYXllckluZm8udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2NvcHknO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ21vdmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBUT0RPIOmcgOimgeajgOafpeWSjOeOsOacieWIhue7hOi9qOmBk+S4iuacieayoeacieWGsueqge+8jOWHuueOsOWGsueqgemcgOimgeWwhuWJjemdouacieWGsueqgeeahOmhtuW8gO+8iOaIluiAheaUvuWcqOWFtuS7luWPr+S7peaUvue9rueahOWIhue7hOWGhe+8iVxuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby54ID0gaW5mby5yYXdJbmZvLnggKyBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICdlbS1yZXNpemUnO1xuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLmZvckVhY2goKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3WCA9IGluZm8ueDtcbiAgICAgICAgICAgICAgICAgICAgaW5mby54ID0gTWF0aC5tYXgoMCwgaW5mby5yYXdJbmZvLnggKyBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLndpZHRoID0gaW5mby5yYXdJbmZvLndpZHRoIC0gKHJhd1ggLSBpbmZvLnJhd0luZm8ueCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLndpZHRoID0gaW5mby5yYXdJbmZvLndpZHRoICsgb2Zmc2V0O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG9uRW1iZWRkZWRQbGF5ZXJNb3VzZVVwKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIUZsYWdzLnN0YXJ0RHJhZ0VtYmVkZGVkUGxheWVySW5mbyB8fCAhdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8gfHwgIUZsYWdzLnN0YXJ0RHJhZ0VtYmVkZGVkUGxheWVySW5mby5vZmZzZXQgfHwgRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvLnR5cGUgPT09ICdkcm9wJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoKHVwZGF0ZUVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaW5mbywgZmFsc2UpLCB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGluZm8sIHRydWUpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBJQXBwbHlPcGVyYXRpb24ob3BlcmF0aW9ucyk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG9uRW1iZWRkZWRQbGF5ZXJEcm9wKGV2ZW50OiBEcmFnRXZlbnQsIGdyb3VwOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuX19wcm90ZWN0ZWRfXy5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkUGxheWVyID0gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgIGNvbnN0IHJhd0VtYmVkZWRQTGF5ZXJEdW1wID0gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChlbWJlZGRlZFBsYXllciwgZmFsc2UpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBldmVudC54IC0gRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvIS5zdGFydFg7XG4gICAgICAgIGVtYmVkZGVkUGxheWVyLnggPSBlbWJlZGRlZFBsYXllci5yYXdJbmZvLnggKyBvZmZzZXQ7XG4gICAgICAgIGVtYmVkZGVkUGxheWVyLmdyb3VwID0gZ3JvdXA7XG4gICAgICAgIGNvbnN0IG5ld0VtYmVkZWRQTGF5ZXJEdW1wID0gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChlbWJlZGRlZFBsYXllciwgdHJ1ZSk7XG4gICAgICAgIGF3YWl0IElBcHBseU9wZXJhdGlvbih1cGRhdGVFbWJlZGRlZFBsYXllcih0aGlzLnZtLmN1cnJlbnRDbGlwLCByYXdFbWJlZGVkUExheWVyRHVtcCwgbmV3RW1iZWRlZFBMYXllckR1bXApKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25LZXlNb3VzZVVwKGV2ZW50OiBNb3VzZUV2ZW50LCBvcHRpb25zPzogeyBhbHQ/OiBib29sZWFuOyB0YXJnZXQ/OiBudW1iZXIgfSkge1xuICAgICAgICBpZiAoKChvcHRpb25zICYmIG9wdGlvbnMuYWx0KSB8fCBldmVudC5hbHRLZXkpICYmIHRoaXMudm0uc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0OiBudW1iZXIgPSAob3B0aW9ucyAmJiBvcHRpb25zLnRhcmdldCkgfHwgdGhpcy52bS5jdXJyZW50RnJhbWU7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5zZWxlY3RLZXlJbmZvLmtleUZyYW1lc1swXS5ub2RlUGF0aCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwudHJhbnNTZWxlY3RUb0NvcHlLZXlJbmZvKCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkN0cmwubW92ZUtleXMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25BdXhLZXlNb3VzZXVwKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3Qgdm0gPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdm0uYXV4Q3VydmVTdG9yZTtcbiAgICAgICAgaWYgKGF1eEN1cnZlU3RvcmUuc2VsZWN0S2V5SW5mbyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VsZWN0SW5mbyA9IGF1eEN1cnZlU3RvcmUuc2VsZWN0S2V5SW5mbztcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gc2VsZWN0SW5mby5vZmZzZXRGcmFtZTtcbiAgICAgICAgaWYgKE1hdGguYWJzKG9mZnNldCkgPCBOdW1iZXIuRVBTSUxPTikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYW5pbWF0aW9uQ3RybC5tb3ZlQXV4S2V5KHNlbGVjdEluZm8ua2V5ZnJhbWVzLCBvZmZzZXQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkV2ZW50TW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0RXZlbnRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgJHRhcmdldDogYW55ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICdjb3B5JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2V3LXJlc2l6ZSc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBzdGFydFgsIGRhdGEgfSA9IHRoYXQuc2VsZWN0RXZlbnRJbmZvO1xuICAgICAgICBjb25zdCBzdGFydEZyYW1lID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCk7XG4gICAgICAgIGxldCBlbmRGcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKHN0YXJ0WCk7XG4gICAgICAgIGlmIChlbmRGcmFtZSA8IDApIHtcbiAgICAgICAgICAgIGVuZEZyYW1lID0gMDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvZmZzZXRGcmFtZSA9IHN0YXJ0RnJhbWUgLSBlbmRGcmFtZTtcbiAgICAgICAgaWYgKG9mZnNldEZyYW1lID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvZmZzZXQgPSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKHN0YXJ0RnJhbWUpIC0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChlbmRGcmFtZSk7XG4gICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvLnN0YXJ0WCArPSBvZmZzZXQ7XG4gICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvLm9mZnNldCArPSBvZmZzZXQ7XG4gICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvLm9mZnNldEZyYW1lICs9IG9mZnNldEZyYW1lO1xuICAgICAgICBmb3IgKGNvbnN0IGRhdGFJdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGFJdGVtLnggKz0gb2Zmc2V0O1xuICAgICAgICAgICAgZGF0YUl0ZW0uZnJhbWUgKz0gb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICBpZiAoZGF0YUl0ZW0uZnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlTW91c2VGcmFtZSh7IHg6IGV2ZW50LngsIHk6IGV2ZW50LnksIGZyYW1lOiBkYXRhWzBdLmZyYW1lIH0sIHRoYXQuc2VsZWN0RXZlbnRJbmZvLm9mZnNldEZyYW1lKTtcbiAgICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBncmlkQ3RybC5nZXRGcmFtZVJhbmcoKTtcbiAgICAgICAgaWYgKGRhdGFbMF0uZnJhbWUgPD0gc3RhcnQgfHwgZGF0YVtkYXRhLmxlbmd0aCAtIDFdLmZyYW1lID49IGVuZCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlVGltZUxpbmUoLW9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25FdmVudE1vdXNlVXAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgZnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZShldmVudC54ICsgZ3JpZEN0cmwuc3RhcnRPZmZzZXQpO1xuICAgICAgICBpZiAoZXZlbnQuYWx0S2V5ICYmIHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlRXZlbnQoZnJhbWUsIHtcbiAgICAgICAgICAgICAgICBldmVudHNEdW1wOiB0aGlzLnZtLnNlbGVjdEV2ZW50SW5mby5kYXRhLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvICYmIHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvIS5vZmZzZXRGcmFtZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkN0cmwubW92ZUV2ZW50cygpO1xuICAgIH1cblxuICAgIC8vIOaJuemHj+WPlua2iOmAieS4rSBJRW1iZWRkZWRQbGF5ZXJJbmZvXG4gICAgdW5TZWxlY3RFbWJlZGRlZFBsYXllckluZm8oZW1iZWRkZWRQbGF5ZXJJbmZvczogSUVtYmVkZGVkUGxheWVySW5mb1tdKSB7XG4gICAgICAgIGVtYmVkZGVkUGxheWVySW5mb3MuZm9yRWFjaCgoZW1iZWRkZWRQbGF5ZXJJbmZvKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBpblNlbGVjdGVkSW5kZXggPSB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5maW5kSW5kZXgoKGluZm86IElFbWJlZGRlZFBsYXllckluZm8pID0+IGluZm8ua2V5ID09PSBlbWJlZGRlZFBsYXllckluZm8ua2V5KTtcbiAgICAgICAgICAgIGlmIChpblNlbGVjdGVkSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uc3BsaWNlKGluU2VsZWN0ZWRJbmRleCwgMSk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHJldHVybjtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJykpO1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8ubWFwKChpdGVtKSA9PiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBkdW1wOiB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGl0ZW0sIGZhbHNlKSxcbiAgICAgICAgICAgIGNsaXBVdWlkOiB0aGlzLnZtLmN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgcm9vdDogYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAhLnJhd1BhdGgsXG4gICAgICAgIH0pKSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uU3RhcnREcmFnU3VyZWdpb24oZXZlbnQ6IE1vdXNlRXZlbnQsIGVtYmVkZGVkUGxheWVySW5mbzogSUVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICBpZiAoY2hlY2tDdHJsT3JDb21tYW5kKGV2ZW50KSAmJiB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgY29uc3QgaW5TZWxlY3RlZEluZGV4ID0gdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZmluZEluZGV4KChpbmZvOiBJRW1iZWRkZWRQbGF5ZXJJbmZvKSA9PiBpbmZvLmtleSA9PT0gZW1iZWRkZWRQbGF5ZXJJbmZvLmtleSk7XG4gICAgICAgICAgICBpZiAoaW5TZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAuLi5lbWJlZGRlZFBsYXllckluZm8sXG4gICAgICAgICAgICAgICAgICAgIHJhd0luZm86IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZW1iZWRkZWRQbGF5ZXJJbmZvKSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLnNwbGljZShpblNlbGVjdGVkSW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8gPSBbe1xuICAgICAgICAgICAgLi4uZW1iZWRkZWRQbGF5ZXJJbmZvLFxuICAgICAgICAgICAgcmF3SW5mbzogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShlbWJlZGRlZFBsYXllckluZm8pKSxcbiAgICAgICAgfV07XG5cbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJykpO1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8ubWFwKChpdGVtKSA9PiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBkdW1wOiB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGl0ZW0sIGZhbHNlKSxcbiAgICAgICAgICAgIGNsaXBVdWlkOiB0aGlzLnZtLmN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgcm9vdDogYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAhLnJhd1BhdGgsXG4gICAgICAgIH0pKSk7XG4gICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnZW1iZWRkZWRQbGF5ZXInO1xuICAgICAgICBGbGFncy5zdGFydERyYWdFbWJlZGRlZFBsYXllckluZm8gPSB7XG4gICAgICAgICAgICBzdGFydFg6IGV2ZW50LngsXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0eXBlOiBldmVudC50YXJnZXQhLmdldEF0dHJpYnV0ZSgnbmFtZScpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOe8qeaUvuWFs+mUruW4p++8jOenu+WKqOahhumAieaOp+WItuadhlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHVibGljIG9uU3RpY2tNb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvIHx8ICF0aGF0LnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvZmZzZXQgPSBldmVudC54IC0gRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvLnN0YXJ0WDtcbiAgICAgICAgaWYgKG9mZnNldCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgICAgICAgLy8g5pW05L2T56e75Yqo5YWz6ZSu5binXG4gICAgICAgICAgICAgICAgdGhpcy5vbktleU1vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgLy8g5Y+v6IO96ZyA6KaB55qE5YW25LuW5aSE55CGXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2FsZSA9IDEgKyBvZmZzZXQgLyBGbGFncy5zdGFydERyYWdTdGlja0luZm8ud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBGbGFncy5zdGFydERyYWdTdGlja0luZm8uY2FjaGVEYXRhO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZlcktleSA9IGRhdGFbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmZyYW1lID09PSByZWZlcktleS5mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHggPSAoaW5mby54IC0gcmVmZXJLZXkueCkgKiBzY2FsZSArIHJlZmVyS2V5Lng7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZnJhbWUgPSBncmlkQ3RybC5jYW52YXNUb0ZyYW1lKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L+d6K+B5Y+C6ICD5YWz6ZSu5bin5LiN5Lya6KKr6KaG55uWXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnJhbWUgPT09IHJlZmVyS2V5LmZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUgPSByZWZlcktleS5mcmFtZSArIChzY2FsZSA+IDEgPyAtMSA6IDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGlja0luZm8ud2lkdGggPSB4ICsgMTIgLSB0aGlzLnN0aWNrSW5mby5sZWZ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lc1tpXS5vZmZzZXRGcmFtZSA9IGZyYW1lIC0gdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lc1tpXS5yYXdGcmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcyFbaV0sIHsgeCwgZnJhbWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVTZWxlY3RLZXkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gb2Zmc2V0IC8gRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvLmNhY2hlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVmZXJLZXkgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBkYXRhLmxlbmd0aCAtIDI7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmZyYW1lID09PSByZWZlcktleS5mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHggPSAocmVmZXJLZXkueCAtIGluZm8ueCkgKiBzY2FsZSArIGluZm8ueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmcmFtZSA9IGdyaWRDdHJsLmNhbnZhc1RvRnJhbWUoeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkv53or4Hlj4LogIPlhbPplK7luKfkuI3kvJrooqvopobnm5ZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcmFtZSA9PT0gcmVmZXJLZXkuZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSA9IHJlZmVyS2V5LmZyYW1lICsgKHNjYWxlID4gMSA/IC0xIDogMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXNbaV0ub2Zmc2V0RnJhbWUgPSBmcmFtZSAtIHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXNbaV0ucmF3RnJhbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoYXQuc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMhW2ldLCB7IHgsIGZyYW1lIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU2VsZWN0S2V5Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FuY2VsRGVib3VuY2UoKSB7XG4gICAgICAgIHRoaXMuZGVib3VuY2VVcGRhdGVOb2RlLmNhbmNlbCgpO1xuICAgICAgICB0aGlzLmRlYm91bmNlRmlsdGVyTm9kZS5jYW5jZWwoKTtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVJlZnJlc2guY2FuY2VsKCk7XG4gICAgfVxuXG4gICAgb25TY2VuZUNsb3NlKCkge1xuICAgICAgICAvLyBjYW5jZWwgYWxsIGRlYm91bmNlZCBmdW5jdGlvblxuICAgICAgICB0aGlzLmNhbmNlbERlYm91bmNlKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlTm9kZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgdm0gPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCBlZGl0SW5mbyA9IGF3YWl0IHF1ZXJ5QW5pbWF0aW9uTm9kZUVkaXRJbmZvKHV1aWQpO1xuICAgICAgICBpZiAoZWRpdEluZm8uc3RhdGUgPT09ICdmYWlsdXJlJyB8fCAhZWRpdEluZm8ucmVzdWx0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVkaXRJbmZvLnJlYXNvbik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5aSE55CGIHNlbGVjdGVkSWQg6LWL5YC85LiOIG5vZGVDaGFuZ2Ug6LCD55So5a2Y5Zyo55qE5pe25bqP5YGP5beu77yI5byC5q2l6LCD55SoICsgdGhyb3R0bGXvvInjgIJcbiAgICAgICAgLy8gc2VsZWN0ZWRJZCDlhYjkuo4gdXBkYXRlTm9kZSDosIPnlKjlj5jljJbjgILmraTml7bnmoQgc2VsZWN0ZWRJZCDlj6/og73lt7Lnu4/lj5jljJbvvIzoi6Xmr5TovoMgdXVpZCDkuI4gc2VsZWN0ZWRJZCDkuI3kuIDoh7TvvIzliJnkuI3mm7TmlrDjgIJcbiAgICAgICAgaWYgKHZtLnNlbGVjdGVkSWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgcm9vdCwgbm9kZSwgYW5pQ29tcCwgY2xpcHNNZW51LCBkZWZhdWx0Q2xpcCB9ID0gZWRpdEluZm8ucmVzdWx0O1xuICAgICAgICB2bS5yb290ID0gcm9vdDtcbiAgICAgICAgdGhpcy51cGRhdGVSb290KG5vZGUpO1xuICAgICAgICB2bS5jbGlwc01lbnUgPSBjbGlwc01lbnUgfHwgW107XG4gICAgICAgIHZtLm5vZGVEdW1wID0gT2JqZWN0LmZyZWV6ZShhbmltYXRpb25DdHJsLm5vZGVzRHVtcCA/IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzIDogbnVsbCk7XG4gICAgICAgIHZtLmFuaUNvbXBUeXBlID0gYW5pQ29tcCA/IGFuaUNvbXAgOiBudWxsO1xuXG4gICAgICAgIC8vIOebruWJjeWHoOS4quabtOaWsOaTjeS9nOaYr+ato+S6pOeahO+8jOWPr+S7peWQjOaXtuWOu+aJp+ihjFxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBJcXVlcnlQcm9wZXJ0aWVzTWVudSh1dWlkKS50aGVuKChtZW51KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLnNlbGVjdGVkSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0ucHJvcGVydGllc01lbnUgPSBtZW51O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGhpcy51cGRhdGVDbGlwcyhkZWZhdWx0Q2xpcCwgJ3VwZGF0ZScpLFxuICAgICAgICBdKTtcbiAgICB9XG5cbiAgICBhc3luYyB1cGRhdGVFZGl0SW5mbygpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGNvbnN0IG1vZGUgPSBhd2FpdCBJcXVlcnlTY2VuZU1vZGUoKTtcbiAgICAgICAgLy8g5Y6f5p2l5Zyo5Yqo55S757yW6L6R5qih5byP5LiL55qE77yM6ZyA6KaB5p+l6K+i5pyA5paw55qE5pe26Ze05ZKM5pKt5pS+54q25oCBXG4gICAgICAgIGlmIChtb2RlID09PSAnYW5pbWF0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgcGxheVN0YXRlID0gYXdhaXQgSXF1ZXJ5UGxheVN0YXRlKHRoYXQuY3VycmVudENsaXApO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVQbGF5U3RhdGUocGxheVN0YXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gYXdhaXQgSXF1ZXJ5UGxheWluZ0NsaXBUaW1lKHRoYXQuY3VycmVudENsaXApO1xuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50RnJhbWUodGltZVRvRnJhbWUoY3VycmVudFRpbWUsIHRoYXQuc2FtcGxlKSk7XG4gICAgICAgICAgICB0aGF0LmFuaW1hdGlvbk1vZGUgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5hbmltYXRpb25Nb2RlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBsYXlTdGF0ZShBbmltYXRpb25TdGF0ZS5TVE9QKTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudEZyYW1lKDApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5pu05pawIGNsaXAg6I+c5Y2V77yM6L+U5Zue5piv5ZCm55yf5q2j5pu05paw5LqGIGNsaXAg6I+c5Y2VXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZUNsaXBNZW51KGNsaXBzTWVudT86IElDbGlwSW5mb1tdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuXG4gICAgICAgIGNvbnN0IGNsaXBJbmZvID0gY2xpcHNNZW51IHx8IChhd2FpdCBJcXVlcnljbGlwc01lbnVJbmZvKHRoYXQucm9vdCkpO1xuICAgICAgICBpZiAoIWNsaXBJbmZvIHx8IChjbGlwSW5mbyAmJiBjbGlwSW5mby5jbGlwc01lbnUgJiYgY2xpcEluZm8uY2xpcHNNZW51Lmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIHRoYXQuY2xpcHNNZW51ID0gW107XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNsaXBzKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0LmNsaXBzTWVudSA9IGNsaXBJbmZvLmNsaXBzTWVudTtcbiAgICAgICAgICAgIGlmICh0aGF0LmN1cnJlbnRDbGlwICE9PSBjbGlwSW5mby5kZWZhdWx0Q2xpcCkge1xuICAgICAgICAgICAgICAgIC8vIOS4jeiDveebtOaOpeaLv+aWsOeahOm7mOiupCBjbGlwIOabv+aNou+8jOmcgOimgeafpeivouW9k+WJjeeahCBjbGlwIOWcqCBjbGlwIOiPnOWNleS4reaYr+WQpuWtmOWcqFxuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2xpcEluZm8uY2xpcHNNZW51LmZpbmRJbmRleCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnV1aWQgPT09IHRoYXQuY3VycmVudENsaXA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8g5pyq6L+b5YWl5Yqo55S757yW6L6R5qih5byP5oiW6ICF5b2T5YmN57yW6L6R55qEIGNsaXAg6KKr56e76Zmk77yM5Lul5Y+K55WM6Z2i5Li75Yqo5Y+R5raI5oGv5pe25omN5Lya5YiH5o2iIGNsaXBcbiAgICAgICAgICAgICAgICBpZiAoKGluZGV4ID09PSAtMSAmJiB0aGF0LmFuaW1hdGlvbk1vZGUpIHx8ICF0aGF0LmFuaW1hdGlvbk1vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjbGlwSW5mby5kZWZhdWx0Q2xpcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xpcEluZm8uZGVmYXVsdENsaXAgPSBjbGlwSW5mby5jbGlwc01lbnVbMF0udXVpZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUNsaXBzKGNsaXBJbmZvLmRlZmF1bHRDbGlwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhc3luYyBjaGVja1VzZUJha2VkQW5pbWF0aW9uQnlTa2VsZXRhbEFuaW1hdGlvbigpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIHJldHVybiBJcXVlcnlBbmltYXRpb25Sb290SW5mbyh0aGF0LnJvb3QpXG4gICAgICAgICAgICAudGhlbigocm9vdEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICB0aGF0LnNob3dVc2VCYWtlZEFuaW1hdGlvbldhcm4gPSB0aGF0LmlzU2tlbGV0b25DbGlwICYmIHJvb3RJbmZvLnVzZUJha2VkQW5pbWF0aW9uO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNoZWNrUHJvcFR5cGVJbkNvcHlLZXlJbmZvKHR5cGU6IGFueSkge1xuICAgICAgICBjb25zdCBjb3B5S2V5SW5mbyA9IGFuaW1hdGlvbkN0cmwuY29weUtleUluZm87XG4gICAgICAgIGlmICghY29weUtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgY29weUtleUluZm8uY3VydmVzRHVtcCkge1xuICAgICAgICAgICAgLy8g5ZCM6IqC54K55ZCM5bGe5oCn55qE5YWz6ZSu5bin5omN5YWB6K6457KY6LS0XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBpZiAoaXRlbS5fcGFyZW50VHlwZSAmJiBpdGVtLl9wYXJlbnRUeXBlLnZhbHVlID09PSB0eXBlLnZhbHVlIHx8IGl0ZW0udHlwZS52YWx1ZSA9PT0gdHlwZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlnKjlsZ7mgKfovajpgZPmn5DkuKrnqbrnmb3kvY3nva7lj7PplK7vvIzkuI3nrKblkIjlsZ7mgKfovajpgZPkvY3nva7nmoTlsIbkvJrov5Tlm54gZmFsc2VcbiAgICAgKiBAcGFyYW0geFxuICAgICAqIEBwYXJhbSB5XG4gICAgICovXG4gICAgcHVibGljIG9uUHJvcFRyYWNrTWVudSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMudm0ucHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIOaYvuekuuWxnuaAp+i9qOmBk+WPs+mUruiPnOWNlVxuICAgICAgICBjb25zdCByZWN0ID0gdGhpcy52bS4kcmVmc1sncHJvcGVydHktY29udGVudCddLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0b3AgPSB5IC0gcmVjdC50b3AgKyB0aGlzLnZtLnByb3BlcnR5U2Nyb2xsSW5mbyEudG9wO1xuICAgICAgICBjb25zdCBwcm9wRGF0YSA9IE9iamVjdC52YWx1ZXModGhpcy52bS5wcm9wZXJ0aWVzKS5maW5kKChpdGVtKSA9PiBpdGVtLnRvcCArIHRoaXMuTElORV9IRUlHSFQgPiB0b3AgJiYgdG9wID4gaXRlbS50b3ApO1xuICAgICAgICBpZiAoIXByb3BEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZSh4KTtcbiAgICAgICAgY29uc3QgbWVudU1hcCA9IGdldFBvcE1lbnVNYXAob25Qcm9wQ29udGV4dE1lbnVzLCB0cnVlKTtcbiAgICAgICAgbWVudU1hcC5jcmVhdGVLZXkuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNyZWF0ZUtleSh7XG4gICAgICAgICAgICAgICAgZnJhbWUsXG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IHByb3BEYXRhLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgIHByb3A6IHByb3BEYXRhLnByb3AsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgbWVudU1hcC5wYXN0ZUtleS5lbmFibGVkID0gdGhpcy5jaGVja1Byb3BUeXBlSW5Db3B5S2V5SW5mbyhwcm9wRGF0YS50eXBlKTtcbiAgICAgICAgbWVudU1hcC5wYXN0ZUtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVLZXkoe1xuICAgICAgICAgICAgICAgIHRhcmdldDogZnJhbWUsXG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IHByb3BEYXRhLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgIHByb3A6IHByb3BEYXRhLnByb3AsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBFZGl0b3IuTWVudS5wb3B1cCh7XG4gICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgLi4uT2JqZWN0LnZhbHVlcyhtZW51TWFwKSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBgZnJhbWU6ICR7ZnJhbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlnKjoioLngrnovajpgZPmn5DkuKrkvY3nva7lj7PplK7vvIzkuI3nrKblkIjlsZ7mgKfovajpgZPkvY3nva7nmoTlsIbkvJrov5Tlm54gZmFsc2VcbiAgICAgKiBAcGFyYW0geFxuICAgICAqIEBwYXJhbSB5XG4gICAgICovXG4gICAgcHVibGljIG9uTm9kZVRyYWNrTWVudSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICAvLyDmmL7npLroioLngrnovajpgZPlj7PplK7oj5zljZVcbiAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMudm0uJHJlZnNbJ25vZGUtY29udGVudCddLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0b3AgPSB5IC0gcmVjdC50b3AgKyB0aGlzLnZtLm5vZGVTY3JvbGxJbmZvIS50b3A7XG4gICAgICAgIGNvbnN0IG5vZGVEYXRhID0gdGhpcy52bS5ub2RlRHVtcCEuZmluZCgoaXRlbSkgPT4gaXRlbS50b3AgKyB0aGlzLkxJTkVfSEVJR0hUID4gdG9wICYmIHRvcCA+IGl0ZW0udG9wKTtcbiAgICAgICAgaWYgKCFub2RlRGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBzcGFjaW5nU2VsZWN0ZWRLZXlzKHNwYWNpbmdGcmFtZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IHRydWU7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwuc3BhY2luZ0tleXMoc3BhY2luZ0ZyYW1lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25TdGlja01vdXNlVXAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lbnVNYXAgPSBnZXRQb3BNZW51TWFwKG9uU3RpY2tNZW51cywgdHJ1ZSk7XG4gICAgICAgICAgICBtZW51TWFwLmNvcHlLZXkuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5S2V5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbWVudU1hcC5zcGFjaW5nS2V5cy5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNwYWNpbmdTZWxlY3RlZEtleXMoYW5pbWF0aW9uRWRpdG9yLnNwYWNpbmdGcmFtZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbWVudU1hcC5yZW1vdmVLZXkuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5yZW1vdmVLZXkoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyDlj7PplK7oj5zljZVcbiAgICAgICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHsgbWVudTogT2JqZWN0LnZhbHVlcyhtZW51TWFwKSB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIUZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgICAgICAgLy8g5pW05L2T56e75Yqo5YWz6ZSu5binKOaVtOS9k+enu+WKqOaXtu+8jOm8oOagh+S9jee9ruW5tuS4jeS4gOWumuWcqOWFs+mUruW4p+S4iu+8jOS4jeiDveebtOaOpeS9v+eUqOS9jee9ruiuoeeul+esrOS4gOS4quWFs+mUruW4p+eahOS9jee9rilcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5TW91c2VVcChldmVudCwge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXMuc3RpY2tJbmZvLmxlZnRGcmFtZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5TW91c2VVcChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5TW91c2VVcChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvID0gbnVsbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25TdGFydFJlc2l6ZShldmVudDogTW91c2VFdmVudCwgdHlwZTogTm9uTnVsbGFibGU8SUZsYWdzWydzdGFydFJlc2l6ZUluZm8nXT5bJ3R5cGUnXSkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LnRhZ05hbWUgPT09ICdVSS1JTlBVVCcpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdyZXNpemUnO1xuICAgICAgICBGbGFncy5zdGFydFJlc2l6ZUluZm8gPSB7XG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIG9uUmVzaXplTW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmICghRmxhZ3Muc3RhcnRSZXNpemVJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZSA9IEZsYWdzLnN0YXJ0UmVzaXplSW5mby50eXBlO1xuICAgICAgICBjb25zdCBzdGFydCA9IEZsYWdzLnN0YXJ0UmVzaXplSW5mby5zdGFydDtcbiAgICAgICAgbGV0IGVuZCA9IDA7XG4gICAgICAgIGlmICh0eXBlID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGVuZCA9IGV2ZW50Lng7XG4gICAgICAgICAgICB0aGlzLnZtLmxlZnRSZXNpemVNb3ZpbmcgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW5kID0gZXZlbnQueSArIDI1O1xuICAgICAgICB9XG4gICAgICAgIGlmICghc3RhcnQpIHtcbiAgICAgICAgICAgIEZsYWdzLnN0YXJ0UmVzaXplSW5mby5zdGFydCA9IGVuZDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQueCA8IHRoaXMubGF5b3V0Q29uZmlnLmxlZnRNaW4gfHwgZXZlbnQueCA+IHRoaXMubGF5b3V0Q29uZmlnLmxlZnRNYXgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyAzMiDkuLrnqpflj6PpobbkuIogdGl0bGUg5qCPICsg6L655qGG5oC75ZKMXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uWSA9IGV2ZW50LnkgLSAzMiAtIHRoaXMudm0uJHJlZnNbJ2NvbnRhaW5lciddLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgICAgaWYgKHR5cGUgIT09ICdsZWZ0JyAmJiAocG9zaXRpb25ZID4gdGhpcy5sYXlvdXRDb25maWcudG9wTWF4IHx8IHBvc2l0aW9uWSA8IHRoaXMubGF5b3V0Q29uZmlnLnRvcE1pbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEZsYWdzLnN0YXJ0UmVzaXplSW5mby5zdGFydCA9IGVuZDtcbiAgICAgICAgY29uc3QgdHlwZUtleSA9IHR5cGUgKyAnUGVjJztcbiAgICAgICAgY29uc3QgdG90YWxMZW4gPSB0eXBlID09PSAnbGVmdCcgPyB0aGlzLnZtLiRyZWZzWydjb250YWluZXInXS5vZmZzZXRXaWR0aCA6IHRoaXMudm0uJHJlZnNbJ2NvbnRhaW5lciddLm9mZnNldEhlaWdodDtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBjdXIgPSAocGFyc2VGbG9hdCh0aGlzLnZtLmxheW91dFt0eXBlS2V5XSkgLyAxMDApICogdG90YWxMZW4gfHwgMDtcblxuICAgICAgICBsZXQgcmVzID0gY3VyICsgZW5kIC0gc3RhcnQ7XG4gICAgICAgIC8vIEZJWE1FOiByZXNpemUgbW91c2Vtb3Zl55qE6YC76L6R5piv5o6n5Yi2IHJlc2l6ZSDlhYPntKDkuIrmlrnljLrln5/nmoTpq5jluqYocHJvcGVydHkg5ouW5Yqo5pe25o6n5Yi2IG5vZGUg6auY5bqmLCBub2RlIOaLluWKqOaOp+WItiB0b3Ag6auY5bqmKe+8jFxuICAgICAgICAvLyDlm6DkuLrmmoLml7bmsqHmnInkv67mlLkgcHJvcGVydHkg5Yy65Z+fIGZsZXgtMSDoh6rliqjmkpHmu6HnmoTpgLvovpHvvIzlm6DmraQgcHJvcGVydHkg5LiL5pa55Yy65Z+f55qE5ouW5Yqo6YC76L6R6YO95piv55u45Y+N55qE77yMXG4gICAgICAgIC8vIOWNsyBoZWFkZXIg5ouW5Yqo5o6n5Yi255qE5piv5pys5Yy65Z+f55qE6auY5bqm44CCXG4gICAgICAgIGlmICh0eXBlID09PSAnYXV4Q3VydmUnKSB7XG4gICAgICAgICAgICByZXMgPSBjdXIgLSAoZW5kIC0gc3RhcnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXMgPSBFZGl0b3IuVXRpbHMuTWF0aC5jbGFtcChyZXMsIHRoaXMubGF5b3V0Q29uZmlnW2Ake3R5cGV9TWluYF0sIHRoaXMubGF5b3V0Q29uZmlnW2Ake3R5cGV9TWF4YF0pO1xuICAgICAgICBsZXQgbmV3VmFsdWUgPSAocmVzIC8gdG90YWxMZW4pICogMTAwO1xuICAgICAgICBuZXdWYWx1ZSA9IE1hdGgubWluKDEwMCwgbmV3VmFsdWUpOyAvLyDmnIDlpKfkuI3otoXov4cgMTAwJVxuXG4gICAgICAgIC8vIOWxleW8gOaXtuS/neeVmeacgOWwj+aKmOWPoOmrmOW6piAo55m+5YiG5q+UKVxuICAgICAgICBjb25zdCBtaW5FeHBhbmRIZWlnaHQgPSA0O1xuICAgICAgICBpZiAobmV3VmFsdWUgPCBtaW5FeHBhbmRIZWlnaHQpe1xuICAgICAgICAgICAgaWYgKHR5cGVLZXkgPT09ICdjZW50ZXJQZWMnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWludXMgPSB0aGlzLnZtLmxheW91dFt0eXBlS2V5XSAtIG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIHRoaXMudm0ubGF5b3V0LnRvcFBlYyAtPSBtaW51cztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy52bS5sYXlvdXQudG9wUGVjIDwgbWluRXhwYW5kSGVpZ2h0KXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS5sYXlvdXQudG9wUGVjID0gbWluRXhwYW5kSGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld1ZhbHVlID0gbWluRXhwYW5kSGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVLZXkgPT09ICd0b3BQZWMnKSB7XG4gICAgICAgICAgICB0aGlzLnZtLmxheW91dC5jZW50ZXJQZWMgPSB0aGlzLnZtLmxheW91dC50b3BQZWMgKyB0aGlzLnZtLmxheW91dC5jZW50ZXJQZWMgLSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnZtLmxheW91dC5jZW50ZXJQZWMgPCBtaW5FeHBhbmRIZWlnaHQpe1xuICAgICAgICAgICAgICAgIHRoaXMudm0ubGF5b3V0LmNlbnRlclBlYyA9IG1pbkV4cGFuZEhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy52bS5sYXlvdXRbdHlwZUtleV0gPSBuZXdWYWx1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25SZXNpemVNb3VzZVVwKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIHRoaXMudm0ubGVmdFJlc2l6ZU1vdmluZyA9IGZhbHNlO1xuICAgICAgICBGbGFncy5zdGFydFJlc2l6ZUluZm8gPSBudWxsO1xuICAgICAgICB0aGlzLnNldENvbmZpZygnbGF5b3V0JywgdGhpcy52bS5sYXlvdXQpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGV2ZW50LnRhcmdldC5zdHlsZSA9ICdkZWZhdWx0JztcbiAgICB9XG5cbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKiog5YWo5bGA5LqL5Lu25aSE55CGICoqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgcHVibGljIG9uTW91c2VVcCA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAvLyBUT0RPIG1lcmdlIDMuNS4xXG4gICAgICAgIC8vIGlmICghRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAvLyAgICAgaWYgKEZsYWdzLl9zdGFydE1vdmUpIHtcbiAgICAgICAgLy8gICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIC8vICAgICAgICAgY2xlYXJUaW1lb3V0KEZsYWdzLl9zdGFydE1vdmUpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFbXG4gICAgICAgICAgICAgICAgJ2dyaWQnLFxuICAgICAgICAgICAgICAgICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAndGltZS1wb2ludGVyJyxcbiAgICAgICAgICAgICAgICAncmVzaXplJyxcbiAgICAgICAgICAgICAgICAncHJvcGVydHknLFxuICAgICAgICAgICAgICAgICdrZXknLFxuICAgICAgICAgICAgICAgICdldmVudCcsXG4gICAgICAgICAgICAgICAgJ25vZGUnLFxuICAgICAgICAgICAgICAgICdwcm9wZXJ0eS1saXN0LWNvbnRlbnQnLFxuICAgICAgICAgICAgICAgICdlbWJlZGRlZFBsYXllcicsXG4gICAgICAgICAgICAgICAgJ2F1eC1rZXknLFxuICAgICAgICAgICAgXS5pbmNsdWRlcyhGbGFncy5tb3VzZURvd25OYW1lKSAmJlxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmlzTG9ja1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aGF0ID0gYW5pbWF0aW9uRWRpdG9yLnZtO1xuICAgICAgICBjb25zdCAkdGFyZ2V0OiBhbnkgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuXG4gICAgICAgIEZsYWdzLm9uU2VsZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHN3aXRjaCAoRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAna2V5JzpcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25LZXlNb3VzZVVwKGV2ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhdXgta2V5JzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uQXV4S2V5TW91c2V1cChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdlbWJlZGRlZFBsYXllcic6XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uRW1iZWRkZWRQbGF5ZXJNb3VzZVVwKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2V2ZW50JzpcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25FdmVudE1vdXNlVXAoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RpY2snOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblN0aWNrTW91c2VVcChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyZXNpemUnOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblJlc2l6ZU1vdXNlVXAoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndGltZS1wb2ludGVyJzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LngpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY3VycmVudEZyYW1lID0gZnJhbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lID0gZnJhbWVUb1RpbWUoZnJhbWUsIHRoYXQuc2FtcGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIElzZXRDdXJFZGl0VGltZSh0aW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lbnVNYXAgPSBnZXRQb3BNZW51TWFwKG9uVGltZXJDb250ZXh0TWVudXMsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudU1hcC5jcmVhdGVFdmVudEtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmFkZEV2ZW50KGZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUV2ZW50S2V5LmVuYWJsZWQgPSAhIWFuaW1hdGlvbkN0cmwuY29weUV2ZW50SW5mbztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVNYXAucGFzdGVFdmVudEtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlRXZlbnQoZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVudS5wb3B1cCh7IG1lbnU6IE9iamVjdC52YWx1ZXMobWVudU1hcCkgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwcm9wZXJ0eSc6XG4gICAgICAgICAgICAgICAgIXRoYXQuYm94SW5mbyAmJiBhbmltYXRpb25FZGl0b3Iub25Qcm9wVHJhY2tNZW51KGV2ZW50LngsIGV2ZW50LnkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncHJvcGVydHktbGlzdC1jb250ZW50JzpcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSBFdmVudEJ1dHRvbi5SSUdIVCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlnKjlsZ7mgKfliJfooajnqbrnmb3kvY3nva7lj7PplK7oj5zljZVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVudU1hcCA9IGdldFBvcE1lbnVNYXAob25Qcm9wTGlzdENvbnRleHRNZW51cywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIG1lbnVNYXAucGFzdGVQcm9wLmVuYWJsZWQgPSAhIShhbmltYXRpb25DdHJsLmNvcHlQcm9wSW5mbyAmJiB0aGF0LnNlbGVjdGVkSWQpO1xuICAgICAgICAgICAgICAgICAgICBtZW51TWFwLnBhc3RlUHJvcC5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVOb2RlRGF0YShhbmltYXRpb25DdHJsLm5vZGVzRHVtcCEudXVpZDJwYXRoW3RoYXQuc2VsZWN0ZWRJZF0sIGFuaW1hdGlvbkN0cmwuZ2V0Q2xpcEJvYXJkRGF0YSgncHJvcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgbWVudU1hcC5jcmVhdGVQcm9wLnN1Ym1lbnUgPSB0aGF0LmRpc3BsYXlQcm9wZXJ0aWVzTWVudTtcbiAgICAgICAgICAgICAgICAgICAgbWVudU1hcC5jcmVhdGVQcm9wLmVuYWJsZWQgPSAoISF0aGF0LnNlbGVjdGVkSWQgJiYgISF0aGF0LmRpc3BsYXlQcm9wZXJ0aWVzTWVudS5sZW5ndGggJiYgIXRoYXQuY2xpcENvbmZpZz8uaXNMb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lbnUucG9wdXAoeyBtZW51OiBPYmplY3QudmFsdWVzKG1lbnVNYXApIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2dyaWQnOlxuICAgICAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gPT09IEV2ZW50QnV0dG9uLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBncmlkIOWPs+mUruaLluWKqOS8muWSjOWFs+mUruW4p+WPs+mUruiPnOWNleWGsueqgVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIEZsYWdzLnN0YXJ0RHJhZ0dyaWRJbmZvID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9LCAxMCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5ib3hJbmZvID0gbnVsbDtcbiAgICAgICAgdGhhdC5ib3hTdHlsZSA9IG51bGw7XG4gICAgICAgIHRoYXQuYm94RGF0YSA9IG51bGw7XG4gICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnJztcbiAgICAgICAgRmxhZ3Muc3RhcnREcmFnR3JpZEluZm8gPSBudWxsO1xuICAgICAgICB0aGF0Lm1vdmVJbmZvID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcHVibGljIG9uTW91c2VNb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIC8vIOW9k+WJjeaXoOm8oOagh+aMiemUrueCueWHu+aXtu+8jOebtOaOpei/h+a7pOm8oOagh+enu+WKqOS6i+S7tlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAoIVtcbiAgICAgICAgICAgICAgICAnZ3JpZCcsXG4gICAgICAgICAgICAgICAgJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICd0aW1lLXBvaW50ZXInLFxuICAgICAgICAgICAgICAgICdyZXNpemUnLFxuICAgICAgICAgICAgICAgICdldmVudCcsXG4gICAgICAgICAgICAgICAgJ2tleScsXG4gICAgICAgICAgICAgICAgJ3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICAnbm9kZScsXG4gICAgICAgICAgICAgICAgJ2VtYmVkZGVkUGxheWVyJyxcbiAgICAgICAgICAgICAgICAnYXV4LWtleScsXG4gICAgICAgICAgICBdLmluY2x1ZGVzKEZsYWdzLm1vdXNlRG93bk5hbWUpICYmXG4gICAgICAgICAgICAgICAgKGFuaW1hdGlvbkVkaXRvci5pc0xvY2sgfHwgRmxhZ3Mub25TY3JvbGxpbmcgfHwgIWV2ZW50LmJ1dHRvbnMpKSB8fFxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnZtLm1hc2tQYW5lbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aGF0ID0gYW5pbWF0aW9uRWRpdG9yLnZtO1xuICAgICAgICBjb25zdCAkdGFyZ2V0OiBhbnkgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIGNvbnN0IHsgeCwgeSwgYnV0dG9uIH0gPSBldmVudDtcbiAgICAgICAgY29uc3QgcmVjdCA9IHRoYXQuJHJlZnMuZ3JpZENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgaWYgKEZsYWdzLm1vdXNlRG93bk5hbWUpIHtcbiAgICAgICAgICAgIHRoYXQucHJldmlld1BvaW50ZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAna2V5JzpcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25LZXlNb3VzZU1vdmUoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYXV4LWtleSc6XG4gICAgICAgICAgICAgICAgdGhpcy5vbkF1eEtleU1vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdlbWJlZGRlZFBsYXllcic6XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uRW1iZWRkZWRQbGF5ZXJNb3VzZU1vdmUoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXZlbnQnOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vbkV2ZW50TW91c2VNb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N0aWNrJzpcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25TdGlja01vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyZXNpemUnOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblJlc2l6ZU1vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdncmlkJzpcbiAgICAgICAgICAgIGNhc2UgJ3Byb3BlcnR5JzpcbiAgICAgICAgICAgIGNhc2UgJ25vZGUnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFGbGFncy5zdGFydERyYWdHcmlkSW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnLXdlYmtpdC1ncmFiYmluZyc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVYID0geCAtIEZsYWdzLnN0YXJ0RHJhZ0dyaWRJbmZvLmxhc3RTdGFydDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmVYID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdncmlkJztcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3Muc3RhcnREcmFnR3JpZEluZm8hLmxhc3RTdGFydCA9IHg7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3IubW92ZVRpbWVMaW5lKG1vdmVYKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncG9pbnRlcic6XG4gICAgICAgICAgICBjYXNlICd0aW1lLXBvaW50ZXInOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnZXctcmVzaXplJztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZyYW1lID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmcmFtZSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRGcmFtZSA9IGZyYW1lO1xuICAgICAgICAgICAgICAgICAgICBJc2V0Q3VyRWRpdFRpbWUoZnJhbWVUb1RpbWUodGhhdC5jdXJyZW50RnJhbWUsIHRoYXQuc2FtcGxlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAgICAgLy8g6LaF5Ye655WM6Z2i6IyD5Zu055qE5LiN5pi+56S65YWJ5qCH5o+Q56S6XG4gICAgICAgICAgICBpZiAoeCA8IHJlY3QueCB8fCB4ID4gcmVjdC54ICsgcmVjdC53aWR0aCB8fCB5IDwgcmVjdC55IHx8IHkgPiByZWN0LnkgKyByZWN0LmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJyc7XG4gICAgICAgICAgICAvLyDlpITnkIbpvKDmoIfnu4/ov4fml7bnmoTkvY3nva7mj5DnpLpcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGdyaWRDdHJsLnBhZ2VUb0N0cmwoeCwgeSk7XG4gICAgICAgICAgICBjb25zdCBwb2ludGVyRnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZSh4KTtcbiAgICAgICAgICAgIGlmIChwb2ludGVyRnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoYXQucHJldmlld1BvaW50ZXIgJiYgdGhhdC5wcmV2aWV3UG9pbnRlci5mcmFtZSA9PT0gcG9pbnRlckZyYW1lICYmIHRoYXQucHJldmlld1BvaW50ZXIueSA9PT0gcmVzdWx0LnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBGbGFncy5wcmV2aWV3UG9pbnRlclRhc2sgJiYgY2xlYXJUaW1lb3V0KEZsYWdzLnByZXZpZXdQb2ludGVyVGFzayk7XG4gICAgICAgICAgICAvLyDnlZnmnInot53nprvpgb/lhY3lvbHlk43liLDngrnlh7vlhbPplK7luKfnrYnnmoTkvb/nlKhcbiAgICAgICAgICAgIHJlc3VsdC55ICs9IDI0O1xuICAgICAgICAgICAgLy8g6ZmQ5Yi25o+Q56S65YWz6ZSu5bin55qE5pi+56S66IyD5Zu077yM6YG/5YWN5b2x5ZON5Yiw6aG26YOo55qE5L2/55SoXG4gICAgICAgICAgICBpZiAocmVzdWx0LnkgPCAzMikge1xuICAgICAgICAgICAgICAgIHJlc3VsdC55ID0gMzI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoYXQucHJldmlld1BvaW50ZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiBwb2ludGVyRnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIHg6IHJlc3VsdC54IC0gZ3JpZEN0cmwuc3RhcnRPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIHk6IHJlc3VsdC55LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgRmxhZ3MucHJldmlld1BvaW50ZXJUYXNrID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQucHJldmlld1BvaW50ZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFsnbm9kZScsICdwcm9wZXJ0eSddLmluY2x1ZGVzKEZsYWdzLm1vdXNlRG93bk5hbWUpICYmIGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uTEVGVCkge1xuICAgICAgICAgICAgRmxhZ3Mub25TZWxlY3RpbmcgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkVkaXRvci5pc0xvY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOWvuSBib3gg55qE5qGG6YCJ5aSE55CGXG4gICAgICAgICAgICAgICAgLy8g6aqo6aq85Yqo55S755uu5YmN5peg5YWz6ZSu5bin5pWw5o2u77yM5LiN6ZyA6KaB5ZON5bqU5YWz6ZSu5qGG6YCJ56e75Yqo562J5pON5L2cXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuYm94SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmJveEluZm8hLnggPSBldmVudC54O1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmJveEluZm8hLnkgPSBldmVudC55O1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmJveFN0eWxlID0gYW5pbWF0aW9uRWRpdG9yLmNhbGNCb3hTdHlsZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOabtOaWsCBjbGlwIOS4iumAieS4reeahOaVsOaNruS/oeaBr1xuICAgICAqL1xuICAgIHB1YmxpYyBjaGVja1NlbGVjdERhdGEoKSB7XG4gICAgICAgIHRoaXMuY2hlY2tTZWxlY3RQcm9wZXJ0eSgpO1xuICAgICAgICB0aGlzLmNoZWNrU2VsZWN0RXZlbnRzKCk7XG4gICAgICAgIHRoaXMuY2hlY2tTZWxlY3RLZXlzKCk7XG4gICAgICAgIHRoaXMuY2hlY2tTZWxlY3RFbWJlZGRlZFBsYXllcnMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2hlY2tTZWxlY3RFbWJlZGRlZFBsYXllcnMoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICFhbmltYXRpb25DdHJsLm5vZGVzRHVtcCB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAuZ3JvdXBUb0VtYmVkZGVkUGxheWVycykge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8gPSBudWxsO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkUGxheWVyU3RycyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2FuaW1hdGlvbi1lbWJlZGRlZFBsYXllcicpO1xuICAgICAgICBpZiAoZW1iZWRkZWRQbGF5ZXJTdHJzKSB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RFbWJlZGRlZFBsYXllckluZm86IElTZWxlY3RFbWJlZGRlZFBsYXllckluZm9bXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBlbWJlZGRlZFBsYXllclN0ciBvZiBlbWJlZGRlZFBsYXllclN0cnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbWJlZGRlZFBsYXllciA9IEpTT04ucGFyc2UoZW1iZWRkZWRQbGF5ZXJTdHIpO1xuICAgICAgICAgICAgICAgIGlmIChlbWJlZGRlZFBsYXllci5jbGlwVXVpZCAhPT0gdGhhdC5jdXJyZW50Q2xpcCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBlbWJlZGRlZFBsYXllclN0cik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVyRHVtcFRvSW5mbyhlbWJlZGRlZFBsYXllci5kdW1wKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RFbWJlZGRlZFBsYXllckluZm8ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIC4uLmluZm8sXG4gICAgICAgICAgICAgICAgICAgIHJhd0luZm86IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoaW5mbykpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLmxlbmd0aCAmJiAodGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8gPSBzZWxlY3RFbWJlZGRlZFBsYXllckluZm8pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLmZpbHRlcigoaW5mbykgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3RHVtcCA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5ncm91cFRvRW1iZWRkZWRQbGF5ZXJzIVtpbmZvLmdyb3VwXTtcbiAgICAgICAgICAgIGlmICghbmV3RHVtcCB8fCAhbmV3RHVtcC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkdW1wID0gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChpbmZvLCB0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0luZm8gPSBuZXdEdW1wLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTG9kYXNoLmlzRXF1YWwoaXRlbSwgZHVtcCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghbmV3SW5mbykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oaW5mbywgbmV3SW5mbyk7XG4gICAgICAgICAgICBpbmZvLnJhd0luZm8gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG5ld0luZm8pKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XlvZPliY3pgInkuK3lsZ7mgKfovajpgZPmmK/lkKblnKjmnIDmlrDnmoTmlbDmja7lhoVcbiAgICAgKi9cbiAgICBwdWJsaWMgY2hlY2tTZWxlY3RQcm9wZXJ0eSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RQcm9wZXJ0eSB8fCAhdGhhdC5zZWxlY3RQcm9wRGF0YSB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFPYmplY3Qua2V5cyhhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5wYXRoMnV1aWQpLmluY2x1ZGVzKHRoYXQuc2VsZWN0UHJvcGVydHkubm9kZVBhdGgpKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW3RoYXQuc2VsZWN0UHJvcGVydHkubm9kZVBhdGhdIHx8XG4gICAgICAgICAgICAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW3RoYXQuc2VsZWN0UHJvcGVydHkubm9kZVBhdGhdW3RoYXQuc2VsZWN0UHJvcERhdGEucHJvcF1cbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeW9k+WJjemAieS4reS6i+S7tuW4p+aVsOaNruaYr+WQpuWcqOacgOaWsOeahOaVsOaNruWGhVxuICAgICAqL1xuICAgIHB1YmxpYyBjaGVja1NlbGVjdEV2ZW50cygpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RFdmVudEluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5ldmVudHMpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZXdGcmFtZXMgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5ldmVudHMubWFwKChpdGVtOiBhbnkpID0+IGl0ZW0uZnJhbWUpO1xuICAgICAgICBpZiAoIW5ld0ZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWxlY3RlZEZyYW1lcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGZyYW1lIG9mIHRoYXQuc2VsZWN0RXZlbnRJbmZvLmZyYW1lcykge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBuZXdGcmFtZXMuaW5kZXhPZihmcmFtZSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxlY3RlZEZyYW1lcy5wdXNoKGZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0ZWRGcmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEV2ZW50SW5mbyA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEV2ZW50SW5mby5mcmFtZXMgPSBzZWxlY3RlZEZyYW1lcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeW9k+WJjemAieS4reWFs+mUruW4p+aVsOaNruaYr+WQpuWcqOacgOaWsOeahOaVsOaNruWGhVxuICAgICAqL1xuICAgIHB1YmxpYyBjaGVja1NlbGVjdEtleXMoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIXRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXApIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qga2V5RnJhbWVzOiBJS2V5RnJhbWVEYXRhW10gPSBbXTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcy5mb3JFYWNoKChkYXRhOiBJS2V5RnJhbWVEYXRhLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbZGF0YS5ub2RlUGF0aF0gfHwgIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbZGF0YS5ub2RlUGF0aF1bZGF0YS5wcm9wXSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRhdGFJbmZvID0gdGhhdC5zZWxlY3RLZXlJbmZvIS5rZXlGcmFtZXNbaW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgZnJhbWVzID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFtkYXRhLm5vZGVQYXRoXVtkYXRhLnByb3BdLmtleUZyYW1lcy5tYXAoKGRhdGE6IGFueSkgPT4gZGF0YS5mcmFtZSk7XG4gICAgICAgICAgICBpZiAoZnJhbWVzLmluY2x1ZGVzKGRhdGFJbmZvLmZyYW1lKSkge1xuICAgICAgICAgICAgICAgIGRhdGFJbmZvLnJhd0ZyYW1lID0gZGF0YS5mcmFtZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZGF0YUluZm8ub2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICAgICAga2V5RnJhbWVzLnB1c2goZGF0YUluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGtleUZyYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29ydER1bXAgPSBzb3J0S2V5c1RvVHJlZU1hcChrZXlGcmFtZXMpO1xuICAgICAgICAvLyDph43nva7pgInkuK3lhbPplK7luKfmlbDmja5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGF0LnNlbGVjdEtleUluZm8sIHtcbiAgICAgICAgICAgIGtleUZyYW1lcyxcbiAgICAgICAgICAgIHNvcnREdW1wLFxuICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IDAsXG4gICAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgICBzdGFydFg6IHRoYXQuc2VsZWN0S2V5SW5mby5zdGFydFgsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdEtleSsrO1xuICAgIH1cblxuICAgIHJlc2V0U3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICB0aGlzLnVwZGF0ZUNsaXBzKG51bGwpO1xuICAgICAgICB0aGF0LmFuaW1hdGlvbk1vZGUgPSBmYWxzZTtcbiAgICAgICAgdGhhdC5hbmlDb21wVHlwZSA9IG51bGw7XG4gICAgICAgIHRoYXQuY2xpcENvbmZpZyA9IG51bGw7XG4gICAgICAgIHRoYXQubm9kZUR1bXAgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagueaNruiPnOWNlemFjee9rueUn+aIkOWvueW6lOeahOe8lui+keWZqOiPnOWNlVxuICAgICAqIEBwYXJhbSBtZW51RGF0YVxuICAgICAqL1xuICAgIGNhbGNDcmVhdGVQcm9wTWVudShtZW51RGF0YTogYW55KSB7XG4gICAgICAgIGxldCByZXN1bHQ6IEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbVtdID0gW107XG4gICAgICAgIGlmIChpc01lbnVJdGVtKG1lbnVEYXRhKSkge1xuICAgICAgICAgICAgY29uc3QgbWVudU5hbWUgPSBtZW51RGF0YS5tZW51TmFtZSA/IG1lbnVEYXRhLm1lbnVOYW1lIDogbWVudURhdGEuZGlzcGxheU5hbWU7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IG1lbnVOYW1lLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6ICFtZW51RGF0YS5kaXNhYmxlLFxuICAgICAgICAgICAgICAgIGNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlUHJvcChtZW51RGF0YS5rZXkpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhtZW51RGF0YSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW06IGFueSA9IG1lbnVEYXRhW2tleV07XG4gICAgICAgICAgICBpZiAoaXNNZW51SXRlbShpdGVtKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpcy5jYWxjQ3JlYXRlUHJvcE1lbnUoaXRlbSkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBrZXksXG4gICAgICAgICAgICAgICAgc3VibWVudTogdGhpcy5jYWxjQ3JlYXRlUHJvcE1lbnUoaXRlbSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIm+W7uuafkOS4quWxnuaAp+i9qOmBk1xuICAgICAqIEBwYXJhbSBwcm9wXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBhc3luYyBjcmVhdGVQcm9wKHByb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgbXVsdGkgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdGVkSWRzICYmIHRoYXQuc2VsZWN0ZWRJZHMuc2l6ZSA+IDEpIHtcbiAgICAgICAgICAgIGxldCB1dWlkczogc3RyaW5nW10gPSBBcnJheS5mcm9tKHRoYXQuc2VsZWN0ZWRJZHMpO1xuICAgICAgICAgICAgLy8g6YCJ5Lit6IqC54K55Y+v6IO95LiN5Zyo5Yqo55S76IqC54K55YaFXG4gICAgICAgICAgICB1dWlkcyA9IHV1aWRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wIS51dWlkMnBhdGhbdXVpZF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICh1dWlkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5pbmZvKEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLmlzX2FkZF9wcm9wX211bHRpLnRpdGxlJyksIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYW5pbWF0b3IuaXNfYWRkX3Byb3BfbXVsdGkuYWRkX3RvX2N1cnJlbnQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLmlzX2FkZF9wcm9wX211bHRpLmFkZF90b19hbGwnKSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiAtMSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG11bHRpID0gISFyZXN1bHQucmVzcG9uc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uQ3RybC5jcmVhdGVQcm9wKHsgcHJvcDogcHJvcCB9LCBtdWx0aSk7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlU2VsZWN0ZWRJZCgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RlZElkICYmIHRoYXQuYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RlZElkKSB7XG4gICAgICAgICAgICB0aGF0LnJvb3QgPSAnJztcbiAgICAgICAgICAgIHRoaXMucmVzZXRTdGF0ZSgpO1xuICAgICAgICAgICAgdGhhdC5wcm9wZXJ0aWVzTWVudSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0LnByb3BlcnRpZXNNZW51ID0gYXdhaXQgSXF1ZXJ5UHJvcGVydGllc01lbnUodGhhdC5zZWxlY3RlZElkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGF0LnByb3BlcnRpZXMgPSB0aGlzLmNhbGNQcm9wZXJ0eSgpO1xuICAgICAgICB0aGlzLmp1bXBUb1NlbGVjdGVkTm9kZSgpO1xuICAgIH1cblxuICAgIGp1bXBUb1NlbGVjdGVkTm9kZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLm5vZGVzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGVzRHVtcCA9IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzRHVtcCB8fCBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2RlcztcbiAgICAgICAgY29uc3QgaW5kZXggPSBub2Rlc0R1bXAuZmluZEluZGV4KChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnV1aWQgPT09IHRoYXQuc2VsZWN0ZWRJZCAmJiB0eXBlb2YgaXRlbS5saXN0SW5kZXggPT09ICdudW1iZXInO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWwhuiKgueCueWIl+ihqOa7muWKqOWIsOS4remXtOS9jee9rlxuICAgICAgICBjb25zdCBzZWxlY3RIZWlnaHQgPSAobm9kZXNEdW1wW2luZGV4XS5saXN0SW5kZXggKyAxKSAqIHRoaXMuTElORV9IRUlHSFQ7XG4gICAgICAgIGNvbnN0IHsgdG9wLCBoZWlnaHQgfSA9IHRoYXQubm9kZVNjcm9sbEluZm8hO1xuICAgICAgICBpZiAoc2VsZWN0SGVpZ2h0IC0gdG9wID4gaGVpZ2h0IHx8IHNlbGVjdEhlaWdodCAtIHRvcCA8IDApIHtcbiAgICAgICAgICAgIC8vIOiuoeeul+eahOacgOe7iCB0b3Ag5YC85a2Y5Zyo5pe26YO96KaBICsgdGhpcy5MSU5FX0hFSUdIVCDpgb/lhY3lnKjlupXpg6jmmL7npLrkuI3lhahcbiAgICAgICAgICAgIHRoYXQubm9kZVNjcm9sbEluZm8hLnRvcCA9IEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKHNlbGVjdEhlaWdodCAtIGhlaWdodCAvIDIsIDAsIChub2Rlc0R1bXAubGVuZ3RoICsgMSkgKiB0aGlzLkxJTkVfSEVJR0hUIC0gaGVpZ2h0KTtcbiAgICAgICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlDbGlwcygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g6K6h566X5qGG6YCJ55qE5pWw5o2u5L+h5oGvXG4gICAgY2FsY0JveFN0eWxlKCkge1xuICAgICAgICBjb25zdCB2bSA9IHRoaXMudm07XG4gICAgICAgIGlmICghdm0uYm94SW5mbyB8fCAhdm0uYm94SW5mby50eXBlIHx8IHZtLmxvY2spIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgc3RhcnRYLCBzdGFydFksIHR5cGUsIHgsIHkgfSA9IHZtLmJveEluZm87XG4gICAgICAgIGNvbnN0IHBvaW50ID0gZ3JpZEN0cmwucGFnZVRvQ3RybCh4LCB5KTtcbiAgICAgICAgLy8g5YWI5oqK6byg5qCH56e75Yqo55qE54K55o6n5Yi26L2s5YyW5Li65b2T5YmN5LiOaeWGhemcgOahhumAieeahOiMg+WbtOS5i+WGhVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHsgb2Zmc2V0VG9wLCBvZmZzZXRIZWlnaHQsIG9mZnNldFdpZHRoIH0gPSB2bS4kcmVmc1tgJHt0eXBlfS1jb250ZW50YF07XG4gICAgICAgIGNvbnN0IGVuZFggPSBFZGl0b3IuVXRpbHMuTWF0aC5jbGFtcChwb2ludC54LCAwLCBvZmZzZXRXaWR0aCk7XG4gICAgICAgIGNvbnN0IGVuZFkgPSBFZGl0b3IuVXRpbHMuTWF0aC5jbGFtcChwb2ludC55LCBvZmZzZXRUb3AsIG9mZnNldFRvcCArIG9mZnNldEhlaWdodCk7XG4gICAgICAgIGNvbnN0IHcgPSBzdGFydFggLSBlbmRYO1xuICAgICAgICBjb25zdCBoID0gc3RhcnRZIC0gZW5kWTtcbiAgICAgICAgLy8g5a696auY5LiA5Liq5Li6IDAg6L+U5ZueXG4gICAgICAgIGlmICghdyB8fCAhaCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3JpZ2luOiBhbnkgPSB7fTtcbiAgICAgICAgaWYgKHcgPiAwICYmIGggPiAwKSB7XG4gICAgICAgICAgICAvLyDlvoDlt6bkuIrop5Lnp7vliqhcbiAgICAgICAgICAgIG9yaWdpbi54ID0gZW5kWDtcbiAgICAgICAgICAgIG9yaWdpbi55ID0gZW5kWSAtIG9mZnNldFRvcDtcbiAgICAgICAgfSBlbHNlIGlmICh3IDwgMCAmJiBoIDwgMCkge1xuICAgICAgICAgICAgLy8g5Y+z5LiL6KeS56e75YqoXG4gICAgICAgICAgICBvcmlnaW4ueCA9IHN0YXJ0WDtcbiAgICAgICAgICAgIG9yaWdpbi55ID0gc3RhcnRZIC0gb2Zmc2V0VG9wO1xuICAgICAgICB9IGVsc2UgaWYgKHcgPCAwICYmIGggPiAwKSB7XG4gICAgICAgICAgICAvLyDlt6bkuIvop5JcbiAgICAgICAgICAgIG9yaWdpbi54ID0gc3RhcnRYO1xuICAgICAgICAgICAgb3JpZ2luLnkgPSBlbmRZIC0gb2Zmc2V0VG9wO1xuICAgICAgICB9IGVsc2UgaWYgKHcgPiAwICYmIGggPCAwKSB7XG4gICAgICAgICAgICAvLyDlj7PkuIvop5JcbiAgICAgICAgICAgIG9yaWdpbi54ID0gZW5kWDtcbiAgICAgICAgICAgIG9yaWdpbi55ID0gc3RhcnRZIC0gb2Zmc2V0VG9wO1xuICAgICAgICB9XG4gICAgICAgIHZtLmJveERhdGEgPSB7XG4gICAgICAgICAgICBvcmlnaW4sXG4gICAgICAgICAgICB3OiBNYXRoLmFicyh3KSxcbiAgICAgICAgICAgIGg6IE1hdGguYWJzKGgpLFxuICAgICAgICAgICAgdHlwZTogdm0uYm94SW5mby50eXBlLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiBgJHtvcmlnaW4ueX1weGAsXG4gICAgICAgICAgICBsZWZ0OiBgJHtvcmlnaW4ueH1weGAsXG4gICAgICAgICAgICByaWdodDogYCR7TWF0aC5yb3VuZChvZmZzZXRXaWR0aCAtIG9yaWdpbi54IC0gTWF0aC5hYnModykpfXB4YCxcbiAgICAgICAgICAgIGJvdHRvbTogYCR7TWF0aC5yb3VuZChvZmZzZXRIZWlnaHQgLSBvcmlnaW4ueSAtIE1hdGguYWJzKGgpKX1weGAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdXBkYXRlUGxheVN0YXRlKHN0YXRlOiBBbmltYXRpb25TdGF0ZSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSBBbmltYXRpb25TdGF0ZS5TVE9QOlxuICAgICAgICAgICAgICAgIHRoYXQuYW5pbWF0aW9uU3RhdGUgPSAnc3RvcCc7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmlQbGF5VGFzayAmJiBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuaVBsYXlUYXNrKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQ3VycmVudFRpbWUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQW5pbWF0aW9uU3RhdGUuUExBWTpcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ3RybC5hbmltYXRpb25TdGF0ZSAhPT0gJ3BsYXknKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYEludmFsaWQgYW5pbWF0aW9uIHN0YXRlIGNoYW5nZS4gKCR7YW5pbWF0aW9uQ3RybC5hbmltYXRpb25TdGF0ZX0gLT4gcGxheSkpYCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhhdC5hbmltYXRpb25TdGF0ZSAhPT0gJ3BsYXknKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYW5pbWF0aW9uU3RhdGUgPSAncGxheSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucnVuUG9pbnRlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQW5pbWF0aW9uU3RhdGUuUEFVU0U6XG4gICAgICAgICAgICAgICAgdGhhdC5hbmltYXRpb25TdGF0ZSA9ICdwYXVzZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmlQbGF5VGFzayAmJiBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuaVBsYXlUYXNrKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGNoZWNrQ3VycmVudFRpbWUoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCB0aW1lID0gYXdhaXQgSXF1ZXJ5UGxheWluZ0NsaXBUaW1lKHRoYXQuY3VycmVudENsaXApO1xuICAgICAgICBjb25zdCBuZXdGcmFtZSA9IHRpbWVUb0ZyYW1lKHRpbWUsIHRoYXQuc2FtcGxlKTtcbiAgICAgICAgaWYgKG5ld0ZyYW1lID09PSB0aGF0LmN1cnJlbnRGcmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0Q3VycmVudEZyYW1lKG5ld0ZyYW1lKTtcbiAgICB9XG5cbiAgICAvLyDmm7TmlrDmoLnoioLngrnmlbDmja5cbiAgICBwdWJsaWMgdXBkYXRlUm9vdChub2RlSW5mbzogYW55KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICAvLyDlvZPliY3oioLngrnmnKrmt7vliqDliqjnlLvnu4Tku7ZcbiAgICAgICAgLy8gY29uc3QgZHVtcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHV1aWQpO1xuICAgICAgICAvLyBpZiAoIWR1bXApIHtcbiAgICAgICAgLy8gICAgIHJldHVybjtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAoIW5vZGVJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5qC56IqC54K55ZCN56ew5Li656m6XG4gICAgICAgIGlmIChub2RlSW5mby5uYW1lID09PSAnJyB8fCBub2RlSW5mby5pc1NjZW5lKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdGVkSWQgPSAnJztcbiAgICAgICAgICAgIHRoYXQucm9vdCA9ICcnO1xuICAgICAgICAgICAgdGhhdC5ub2RlRHVtcCA9IG51bGw7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCA9IG51bGw7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAgPSBmb3JtYXROb2RlRHVtcChub2RlSW5mbyk7XG4gICAgICAgIC8vIHRoYXQuYWN0aXZlID0gbm9kZUluZm8uYWN0aXZlO1xuICAgICAgICAvLyBpZiAoIW5vZGVJbmZvLmFjdGl2ZSkge1xuICAgICAgICB0aGF0Lm5vZGVEdW1wID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2RlcykpO1xuICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLy8g5pu05pawIGNsaXAg5pWw5o2uXG4gICAgYXN5bmMgdXBkYXRlQ2xpcHMoY2xpcEluZm86IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwsIHR5cGU/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIC8vIOW9k+WJjee8lui+kSBjbGlwIOS4jeWtmOWcqOmcgOimgemAgOWHuuWKqOeUu+e8lui+keaooeW8j1xuICAgICAgICBpZiAodGhhdC5ub2RlRHVtcCAmJiAhdGhhdC5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDbGlwcygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOW9k+WJjee8lui+kSBjbGlwIOS4jeWtmOWcqOmcgOimgemAgOWHuuWKqOeUu+e8lui+keaooeW8j1xuICAgICAgICAvLyBGSVhNRTog55Sx5LqOIHNjZW5lIGNsb3NlIOS4jiBub2RlIGNoYW5nZSDkuovku7bnmoTnm7jkupLkvZznlKjvvIzlr7zoh7TlnKjpgIDlh7rliqjnlLvnvJbovpHmqKHlvI/ml7bvvIzkvJrotbDlhaXkuIvmlrkgcXVlcnlDbGlwRHVtcCDnmoTliIbmlK/vvIxcbiAgICAgICAgLy8g6ICM5q2k5pe2IHJvb3TvvIxjdXJyZW50Q2xpcCDpg73kuLrnqbrjgILmmoLml7bpgJrov4flop7liqDliKTmlq3op4Tpgb/vvIzmnKzotKjkuIrmmK/lvILmraXml7bluo/pgLvovpHkuI3lpJ/lgaXlo65cbiAgICAgICAgaWYgKCFjbGlwSW5mbyB8fCB0aGF0LnJvb3QgPT09ICcnKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYFJvb3QoJHt0aGF0LnJvb3R9KSBvciBjbGlwSW5mbygke2NsaXBJbmZvfSkgaXMgZW1wdHkhYCk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyQ2xpcHMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY2xpcER1bXA6IEVkaXRvckFuaW1hdGlvbkNsaXBEdW1wIHwgbnVsbCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgYW5pbWF0aW9uQ2xpcENhY2hlTWFuYWdlci5jYWNoZUNsaXBEdW1wKHRoYXQucm9vdCwgdGhhdC5jdXJyZW50Q2xpcCk7XG4gICAgICAgIGlmICh0eXBlb2YgY2xpcEluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAodGhhdC5jdXJyZW50Q2xpcCA9PT0gY2xpcEluZm8gJiYgdHlwZSAhPT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLnRpbWUoJ0lxdWVyeUNsaXBEdW1wJyk7XG4gICAgICAgICAgICBjbGlwRHVtcCA9IGF3YWl0IElxdWVyeUNsaXBEdW1wKHRoYXQucm9vdCwgY2xpcEluZm8pO1xuICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKCdJcXVlcnlDbGlwRHVtcCcpO1xuICAgICAgICAgICAgaWYgKCFjbGlwRHVtcCAmJiAhRmxhZ3Muc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZWZyZXNoVGFzaysrO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY2xpcER1bXApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEdldCBhbmltYXRpb24gY2xpcCBkYXRhIGZhaWxlZCEgbm9kZSAke3RoYXQucm9vdH0sIGNsaXAgJHt0aGF0LmN1cnJlbnRDbGlwfWApO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDbGlwcygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWPquacieWKqOeUu+aVsOaNruiOt+WPluaIkOWKn+WQjuaJjeiDveabtOaWsOW9k+WJjemAieS4rSBjbGlwXG4gICAgICAgICAgICB0aGF0LmN1cnJlbnRDbGlwID0gY2xpcEluZm87XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNsaXBEdW1wKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCA9IE9iamVjdC5hc3NpZ24oZm9ybWF0Q2xpcER1bXAoY2xpcER1bXApLCB7IHV1aWQ6IHRoYXQuY3VycmVudENsaXAgfSk7XG4gICAgICAgICAgICBpZiAoY2xpcER1bXAuc2FtcGxlICE9PSBncmlkQ3RybC5ncmlkPy5zYW1wbGUpIHtcbiAgICAgICAgICAgICAgICBncmlkQ3RybC5ncmlkIS5zYW1wbGUgPSBjbGlwRHVtcC5zYW1wbGU7XG4gICAgICAgICAgICAgICAgZ3JpZEN0cmwuZ3JpZCEucmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJUaW1lQXhpcygpO1xuICAgICAgICAgICAgICAgIC8vIOabtOaWsOW9k+WJjeaOp+WItuadhuWFs+mUruW4p+eahOaYvuekulxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmtleXMoYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnW2tleV0gPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcFtrZXldID8/IGFuaW1hdGlvbkN0cmwuY2xpcENvbmZpZ1trZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGF0LmNsaXBDb25maWcgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGFuaW1hdGlvbkN0cmwuY2xpcENvbmZpZykpO1xuICAgICAgICAgICAgaWYgKHRoYXQuY2xpcENvbmZpZyAmJiB0aGF0LmNsaXBDb25maWcuZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdNaW4gPSBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgdGhhdC4kcmVmcy5jaGFydC5vZmZzZXRXaWR0aCAvICh0aGF0LmNsaXBDb25maWcuZHVyYXRpb24gKiB0aGF0LmNsaXBDb25maWcuc2FtcGxlICogMiksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEN0cmwuZ3JpZCEueE1pblNjYWxlLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3TWF4ID0gTWF0aC5tYXgodGhhdC5jbGlwQ29uZmlnLmR1cmF0aW9uICogdGhhdC5jbGlwQ29uZmlnLnNhbXBsZSwgdGhpcy5ncmlkQ3RybC5ncmlkIS54TWF4U2NhbGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEN0cmwuZ3JpZCEudXBkYXRlU2NhbGUobmV3TWluLCBuZXdNYXgpO1xuICAgICAgICAgICAgICAgIC8vIFRPRE8g5Y+v5Zyo57yW6L6R5Zmo5YaF5o+Q5L6b5LiA6ZSu5oGi5aSN5Yiw5pyA5L2z57yp5pS+5q+U5L6L77yI5Y+v5Lul55yL6KeB5YWo6YOo5YWz6ZSu5bin77yJXG4gICAgICAgICAgICAgICAgLy8g5Y+v5Lul5o+Q5L6bIHNsaWRlciDnu4Tku7bmjqfliLbnvKnmlL7mr5TkvotcbiAgICAgICAgICAgICAgICAvLyBhbmltYXRpb25FZGl0b3IuZ3JpZEN0cmwuZ3JpZCEueEF4aXNTY2FsZSA9IGFuaW1hdGlvbkVkaXRvci5zY2FsZVJhbmdlLm1pbjtcbiAgICAgICAgICAgICAgICAvLyBhbmltYXRpb25FZGl0b3IuZ3JpZEN0cmwuZ3JpZCEucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGF0LmlzU2tlbGV0b25DbGlwID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAuaXNTa2VsZXRvbiA9PT0gdHJ1ZTtcbiAgICAgICAgICAgIHRoYXQuc2hvd1VzZUJha2VkQW5pbWF0aW9uV2FybiA9IHRoYXQuaXNTa2VsZXRvbkNsaXAgJiYgYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAudXNlQmFrZWRBbmltYXRpb247XG4gICAgICAgICAgICB0aGF0LmV4cGFuZExheW91dC5hdXhpbGlhcnlDdXJ2ZSA9IHRoYXQuaXNTa2VsZXRvbkNsaXA7IC8vIOmqqOmqvOWKqOeUu+m7mOiupOWxleW8gFxuICAgICAgICAgICAgYXdhaXQgdGhhdC5jYWxjU2VsZWN0UHJvcGVydHkobnVsbCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYWxjRXZlbnRzRHVtcCgpO1xuICAgICAgICB0aGlzLmNhbGNOb2RlcygpO1xuICAgICAgICB0aGlzLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICAgICAgdGhhdC5wcm9wZXJ0aWVzID0gdGhpcy5jYWxjUHJvcGVydHkoKTtcbiAgICAgICAgdGhpcy5jYWxjQXV4aWxpYXJ5Q3VydmVzKCk7XG4gICAgICAgIHRoaXMuY2hlY2tTZWxlY3REYXRhKCk7XG4gICAgICAgIHRoYXQudXBkYXRlS2V5RnJhbWUrKztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlvZPliY3ml6DliqjnlLvmlbDmja7vvIzmuIXnqbrmlbDmja7nirbmgIFcbiAgICAgKi9cbiAgICBjbGVhckNsaXBzKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgYXV4Q3VydmVTdG9yZSA9IHRoYXQuYXV4Q3VydmVTdG9yZTtcbiAgICAgICAgdGhhdC5jdXJyZW50Q2xpcCA9ICcnO1xuICAgICAgICBhbmltYXRpb25DdHJsLmV4aXQoKTtcbiAgICAgICAgYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgPSBudWxsO1xuICAgICAgICB0aGF0LmNsaXBDb25maWcgPSBudWxsO1xuICAgICAgICB0aGF0LmV2ZW50c0R1bXAgPSBudWxsO1xuICAgICAgICB0aGlzLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICAgICAgdGhhdC5wcm9wZXJ0aWVzID0gdGhpcy5jYWxjUHJvcGVydHkoKTtcbiAgICAgICAgYXV4Q3VydmVTdG9yZS5yZXNldCgpO1xuICAgICAgICB0aGF0LmVtYmVkZGVkUGxheWVyR3JvdXBzID0gW107XG4gICAgICAgIHRoaXMuY2hlY2tTZWxlY3REYXRhKCk7XG4gICAgICAgIHRoYXQudXBkYXRlS2V5RnJhbWUrKztcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY1Byb3BlcnR5KCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhdGhhdC5jb21wdXRlU2VsZWN0UGF0aCB8fCAhZ3JpZEN0cmwuZ3JpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRhdGEgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbdGhhdC5jb21wdXRlU2VsZWN0UGF0aF07XG4gICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIE9iamVjdC5rZXlzKGRhdGEpLmZvckVhY2goKG5hbWUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wRGF0YTogSVByb3BEYXRhID0gZGF0YVtuYW1lXTtcbiAgICAgICAgICAgIGxldCBwYXJlbnREYXRhID0gcHJvcERhdGE7XG4gICAgICAgICAgICAvLyBkYXRhW25hbWVdXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGFbbmFtZV0ucGFyZW50UHJvcEtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREYXRhID0gZGF0YVtkYXRhW25hbWVdLnBhcmVudFByb3BLZXldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkSW5kZXggPSBwYXJlbnREYXRhLnBhcnRLZXlzLmZpbmRJbmRleCgoa2V5KSA9PiBrZXkgPT09IHByb3BEYXRhLnByb3ApO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSAmJiBwcm9wRGF0YS5pc0N1cnZlU3VwcG9ydCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wRGF0YS5jb2xvciA9IEN1cnZlQ29sb3JMaXN0W2NoaWxkSW5kZXhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDliJ3lp4vljJbmipjlj6DlsZXlvIDkv6Hmga/orrDlvZVcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5leHBhbmRJbmZvW3BhcmVudERhdGEucHJvcF0gIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5leHBhbmRJbmZvW3BhcmVudERhdGEucHJvcF0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtuYW1lXS5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICBpZiAocHJvcERhdGEudHlwZSAmJiBwcm9wRGF0YS5pc0N1cnZlU3VwcG9ydCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wRGF0YS5jb2xvciA9IEN1cnZlQ29sb3JMaXN0WzNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRhdGFbbmFtZV0uaW5kZXggPSBNYXRoLm1heCgwLCBpIC0gMSk7XG4gICAgICAgICAgICAvLyDorqHnrpfovajpgZPpq5jluqZcbiAgICAgICAgICAgIGRhdGFbbmFtZV0udG9wID0gKGkgLSAxKSAqIHRoaXMuTElORV9IRUlHSFQ7XG4gICAgICAgICAgICAvLyDliIbph4/ovajpgZPkuI3lnKjlsZ7mgKfoj5zljZXlhoXvvIzpnIDopoHkvb/nlKjniLbovajpgZPkv6Hmga/liKTmlq3mmK/lkKYgbWlzc2luZ1xuICAgICAgICAgICAgaWYgKHRoYXQucHJvcGVydGllc01lbnUgJiYgIWNoZWNrUHJvcGVydHlJbk1lbnUocGFyZW50RGF0YSwgdGhhdC5wcm9wZXJ0aWVzTWVudSkpIHtcbiAgICAgICAgICAgICAgICAvLyDlsZ7mgKfkuKLlpLFcbiAgICAgICAgICAgICAgICBkYXRhW25hbWVdLm1pc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgcHJvcERhdGEua2V5RnJhbWVzXG4gICAgICAgICAgICAgICAgPSBPYmplY3QuZnJlZXplKGNhbGNGcmFtZXMocHJvcERhdGEua2V5RnJhbWVzLCB0aGF0LiRyZWZzLmNoYXJ0Lm9mZnNldFdpZHRoLCB0aGlzLmltYWdlQ0NUeXBlcy5pbmNsdWRlcyhwcm9wRGF0YS50eXBlICYmIHByb3BEYXRhLnR5cGUudmFsdWUpKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjQXV4aWxpYXJ5Q3VydmVzKCkge1xuICAgICAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdGhpcy52bS5hdXhDdXJ2ZVN0b3JlO1xuICAgICAgICBhdXhDdXJ2ZVN0b3JlLmNhbGNDdXJ2ZXMoXG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNsaXBzRHVtcD8uZGlzcGxheUF1eGlsaWFyeUN1cnZlcyA/PyBbXSxcbiAgICAgICAgICAgIHRoaXMudm0uJHJlZnMuY2hhcnQub2Zmc2V0V2lkdGgsXG4gICAgICAgICk7XG4gICAgICAgIGF1eEN1cnZlU3RvcmUuZm9yY2VEdW1wVXBkYXRlKCk7XG4gICAgfVxuXG4gICAgLy8g6K6h566X5pi+56S655qEIGV2ZW50IOS9jee9rlxuICAgIHByaXZhdGUgY2FsY0V2ZW50c0R1bXAoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBsZXQgcmVzdWx0OiBhbnlbXSA9IFtdO1xuICAgICAgICBpZiAoYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgJiYgZ3JpZEN0cmwuZ3JpZCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAuZXZlbnRzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaXRlbS54ID0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChpdGVtLmZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0O1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKHRoYXQuZXZlbnRzRHVtcCA9IE9iamVjdC5mcmVlemUocmVzdWx0KSk7XG4gICAgfVxuXG4gICAgLy8g6J6N5ZCI6IqC54K55pWw5o2u5LiOIGNsaXAg5pWw5o2uXG4gICAgcHVibGljIGNhbGNOb2RlcygpIHtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLm5vZGVzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhdGhzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShPYmplY3Qua2V5cyhhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5wYXRoMnV1aWQpKSk7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzRHVtcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAubm9kZXMpKTtcblxuICAgICAgICBmdW5jdGlvbiBhZGROb2RlVGVtcGxhdGUocGF0aDogc3RyaW5nLCBtaXNzaW5nID0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNocyA9IHBhdGgubWF0Y2goL1xcLy9nKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2hzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdGltZXMgPSBtYXRjaHMubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IGluZGV4ID0gcGF0aHMuZmluZEluZGV4KChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5tYXRjaCgvXFwvL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLm1hdGNoKC9cXC8vZykubGVuZ3RoID09PSB0aW1lcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBuYW1lTWF0Y2hzID0gcGF0aC5tYXRjaCgvXFwvKFteL10qKSQvKTtcbiAgICAgICAgICAgIGlmICghbmFtZU1hdGNocykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOS4ouWkseiKgueCueS4juagueiKgueCueWQjOe6p+aXtu+8jOaUvue9ruWcqOagueiKgueCueS5i+WQjlxuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5pyq5om+5Yiw5LiO5Lii5aSx6IqC54K55ZCM57qn6IqC54K55pe277yM5bCG5Lii5aSx6IqC54K555u05o6l5pS+572u5Zyo6IqC54K55pyA5ZCOXG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8g6ZyA6KaB6KGl5YWo54i26IqC54K55pi+56S65Zyo55WM6Z2i5LiKXG4gICAgICAgICAgICAgICAgaW5kZXggPSBwYXRocy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZXMgPSBwYXRoLm1hdGNoKC9cXC8oW14vXSspL2cpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlcyAmJiAhbWlzc2luZykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VycmVudFBhdGggPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIHBhcmVudE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aCArPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhzLmluY2x1ZGVzKGN1cnJlbnRQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTm9kZVRlbXBsYXRlKGN1cnJlbnRQYXRoLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5om+5Yiw5LiO5Lii5aSx6IqC54K55ZCM57qn6IqC54K577yM5YiZ55u05o6l5pS+5Zyo6K+l5ZCM57qn6IqC54K55LmL5ZCOXG4gICAgICAgICAgICBwYXRocy5zcGxpY2UoaW5kZXgsIDAsIHBhdGgpO1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAhLm5vZGVzRHVtcC5zcGxpY2UoaW5kZXgsIDAsIHtcbiAgICAgICAgICAgICAgICBpbmRlbnQ6IHRpbWVzICogMixcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVNYXRjaHNbMV0sXG4gICAgICAgICAgICAgICAgdXVpZDogJycsXG4gICAgICAgICAgICAgICAga2V5RnJhbWVzOiBbXSxcbiAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgcmF3SW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICAgIGxpc3RJbmRleDogaW5kZXgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDlpITnkIbkuKLlpLHoioLngrnmlbDmja5cbiAgICAgICAgZm9yIChjb25zdCBwYXRoIG9mIE9iamVjdC5rZXlzKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRocy5pbmRleE9mKHBhdGgpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkTm9kZVRlbXBsYXRlKHBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5pu05paw546w5pyJ55qE5rua5Yqo6IyD5Zu05YaF55qE5pi+56S66IqC54K55pWw5o2u77yI5YyF5ous5YWz6ZSu5bin77yJXG4gICAgcHVibGljIGNhbGNEaXNwbGF5Tm9kZXMoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICB0aGF0Lm5vZGVEdW1wID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub2Rlc0R1bXAgPSBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2Rlc0R1bXAgfHwgYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAubm9kZXM7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gW107XG4gICAgICAgIC8vIOiusOW9leWunumZhemcgOimgeWPguS4juWIpOaWreaYr+WQpuWcqOWPr+inhuWMuuWfn+eahOiKgueCuSBpbmRleO+8jOa7muWKqOadoeS9jee9ruaYr+mSiOWvuei/h+a7pOWQjuiKgueCueeahOS9jee9ruiuoeeul+iAjOS4jeaYr+WFqOmDqOiKgueCuVxuICAgICAgICBsZXQgbGlzdEluZGV4ID0gLTE7XG4gICAgICAgIGNvbnN0IGhhc0ZpbHRlciA9IHRoYXQuZmlsdGVySW52YWxpZCB8fCB0aGF0LmZpbHRlck5hbWU7XG4gICAgICAgIG5vZGVzRHVtcC5mb3JFYWNoKChpdGVtOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBpdGVtLmxpc3RJbmRleDtcbiAgICAgICAgICAgIGRlbGV0ZSBpdGVtLnRvcDtcbiAgICAgICAgICAgIGRlbGV0ZSBpdGVtLnJhd0luZGV4O1xuICAgICAgICAgICAgaWYgKGhhc0ZpbHRlcikge1xuICAgICAgICAgICAgICAgIGl0ZW0uaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5maWx0ZXJOYW1lICYmICFuZXcgUmVnRXhwKHRoYXQuZmlsdGVyTmFtZSwgJ2knKS50ZXN0KGl0ZW0ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhhdC5maWx0ZXJJbnZhbGlkICYmICghaXRlbS5rZXlGcmFtZXMgfHwgIWl0ZW0ua2V5RnJhbWVzLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxpc3RJbmRleCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0SW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9mZnNldEhlaWdodCA9IGxpc3RJbmRleCAqIHRoaXMuTElORV9IRUlHSFQgLSB0aGF0Lm5vZGVTY3JvbGxJbmZvIS50b3A7XG4gICAgICAgICAgICBpdGVtLnRvcCA9IGxpc3RJbmRleCAqIHRoaXMuTElORV9IRUlHSFQ7XG4gICAgICAgICAgICBpdGVtLnJhd0luZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICBpdGVtLmxpc3RJbmRleCA9IGxpc3RJbmRleDtcbiAgICAgICAgICAgIGlmIChvZmZzZXRIZWlnaHQgPiAtdGhpcy5MSU5FX0hFSUdIVCAmJiBvZmZzZXRIZWlnaHQgPCB0aGF0Lm5vZGVTY3JvbGxJbmZvIS5oZWlnaHQgKyB0aGlzLkxJTkVfSEVJR0hUKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgaXRlbS5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG5vZGVzSGVpZ2h0ID0gaGFzRmlsdGVyID8gbGlzdEluZGV4ICogdGhpcy5MSU5FX0hFSUdIVCA6IG5vZGVzRHVtcC5sZW5ndGggKiB0aGlzLkxJTkVfSEVJR0hUO1xuICAgICAgICB0aGF0Lm5vZGVzSGVpZ2h0ID0gTWF0aC5mbG9vcihub2Rlc0hlaWdodCk7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLmRpc3BsYXlOb2Rlc0R1bXAgPSByZXN1bHQ7XG4gICAgICAgIHRoYXQubm9kZUR1bXAgPSByZXN1bHQ7XG4gICAgICAgIGlmIChNYXRoLmFicyh0aGF0Lm5vZGVTY3JvbGxJbmZvIS50b3AgLSB0aGF0LiRyZWZzLm5vZGVzLnNjcm9sbFRvcCkgPiB0aGlzLkxJTkVfSEVJR0hUKSB7XG4gICAgICAgICAgICB0aGF0LiRyZWZzLm5vZGVzLnNjcm9sbFRvcCA9IHRoYXQubm9kZVNjcm9sbEluZm8hLnRvcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOabtOaWsOeOsOacieeahOaYvuekuueahOWxnuaAp+i9qOmBk+aVsOaNrlxuICAgIHB1YmxpYyBjYWxjRGlzcGxheUNsaXBzKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0Lm5vZGVEdW1wIHx8ICFhbmltYXRpb25DdHJsLm5vZGVzRHVtcCB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzRHVtcCkge1xuICAgICAgICAgICAgdGhhdC5jbGlwQ29uZmlnID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlOb2RlcygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxjRGlzcGxheUVtYmVkZGVkUGxheWVycygpO1xuICAgICAgICAvLyBUT0RPIHNob3dBbmltRW1iZWRkZWRQbGF5ZXIgPSB0cnVlIOaXtui/meauteeQhuiuuuS4iuaYr+WkmuS9meeahFxuICAgICAgICBjb25zdCByZXN1bHQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2Rlc0R1bXAuZm9yRWFjaCgoaXRlbTogSU5vZGVJbmZvKSA9PiB7XG4gICAgICAgICAgICByZXN1bHRbaXRlbS5wYXRoXSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbaXRlbS5wYXRoXTtcbiAgICAgICAgICAgIGlmICghaXRlbS5kaXNhYmxlZCAmJiByZXN1bHRbaXRlbS5wYXRoXSkge1xuICAgICAgICAgICAgICAgIGl0ZW0ua2V5RnJhbWVzID0gT2JqZWN0LmZyZWV6ZShKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMuY2FsY05vZGVGcmFtZXMoaXRlbS5wYXRoKSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoYXQubm9kZUR1bXAgPSBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2Rlc0R1bXA7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLmRpc3BsYXlDbGlwc0R1bXAgPSByZXN1bHQ7XG4gICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlOb2RlcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjRGlzcGxheUVtYmVkZGVkUGxheWVycygpIHtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAuZ3JvdXBUb0VtYmVkZGVkUGxheWVycyB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAuZW1iZWRkZWRQbGF5ZXJHcm91cHMpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbWJlZGRlZFBsYXllckdyb3VwczogSUVtYmVkZGVkUGxheWVyR3JvdXBbXSA9IFtdO1xuICAgICAgICBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5lbWJlZGRlZFBsYXllckdyb3Vwcy5mb3JFYWNoKChncm91cCkgPT4ge1xuICAgICAgICAgICAgbGV0IGVtYmVkZGVkUGxheWVyczogSUVtYmVkZGVkUGxheWVySW5mb1tdID0gW107XG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLmdyb3VwVG9FbWJlZGRlZFBsYXllcnNbZ3JvdXAua2V5XSkge1xuICAgICAgICAgICAgICAgIGVtYmVkZGVkUGxheWVycyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5ncm91cFRvRW1iZWRkZWRQbGF5ZXJzW2dyb3VwLmtleV0ubWFwKChlbWJlZGRlZFBsYXllcikgPT4gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVyRHVtcFRvSW5mbyhlbWJlZGRlZFBsYXllcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXJHcm91cHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogZ3JvdXAubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBncm91cC50eXBlLFxuICAgICAgICAgICAgICAgIGtleTogZ3JvdXAua2V5LFxuICAgICAgICAgICAgICAgIGVtYmVkZGVkUGxheWVycyxcbiAgICAgICAgICAgICAgICBtZW51SW5mbzogRW1iZWRkZWRQbGF5ZXJNZW51TWFwW2dyb3VwLnR5cGVdLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZtLmVtYmVkZGVkUGxheWVyR3JvdXBzID0gZW1iZWRkZWRQbGF5ZXJHcm91cHM7XG4gICAgICAgIHJldHVybiBlbWJlZGRlZFBsYXllckdyb3VwcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDorqHnrpflr7nlupToioLngrnlpITnmoTlhbPplK7luKfmlbDmja5cbiAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAqL1xuICAgIHByaXZhdGUgY2FsY05vZGVGcmFtZXMocGF0aDogc3RyaW5nLCBzb3J0ID0gZmFsc2UpOiBJS2V5RnJhbWVbXSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFtwYXRoXTtcbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdDogSUtleUZyYW1lW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGRhdGEpKSB7XG4gICAgICAgICAgICBjb25zdCBrZXlGcmFtZXMgPSBjYWxjRnJhbWVzKGRhdGFbbmFtZV0ua2V5RnJhbWVzLCB0aGF0LiRyZWZzLmNoYXJ0Lm9mZnNldFdpZHRoLCBmYWxzZSk7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGtleUZyYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvcnQgJiYgcmVzdWx0Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0LnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEuZnJhbWUgLSBiLmZyYW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRyYW5zRW1iZWRkZWRQbGF5ZXJEdW1wVG9JbmZvKGVtYmVkZGVkUGxheWVyRHVtcDogSUVtYmVkZGVkUGxheWVycywgeD86IG51bWJlcik6IElFbWJlZGRlZFBsYXllckluZm8ge1xuICAgICAgICB4ID0gdHlwZW9mIHggPT09ICdudW1iZXInID8geCA6IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZW1iZWRkZWRQbGF5ZXJEdW1wLmJlZ2luKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHgsXG4gICAgICAgICAgICB3aWR0aDogZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhlbWJlZGRlZFBsYXllckR1bXAuZW5kKSAtIHgsXG4gICAgICAgICAgICByZWNvbmNpbGVkU3BlZWQ6IGVtYmVkZGVkUGxheWVyRHVtcC5yZWNvbmNpbGVkU3BlZWQsXG4gICAgICAgICAgICBwbGF5YWJsZTogZW1iZWRkZWRQbGF5ZXJEdW1wLnBsYXlhYmxlLFxuICAgICAgICAgICAgZ3JvdXA6IGVtYmVkZGVkUGxheWVyRHVtcC5ncm91cCxcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBlbWJlZGRlZFBsYXllckR1bXAuZGlzcGxheU5hbWUsXG4gICAgICAgICAgICBrZXk6IGNhbGNFbWJlZGRlZFBsYXllcktleShlbWJlZGRlZFBsYXllckR1bXApLFxuICAgICAgICAgICAgYmVnaW46IGVtYmVkZGVkUGxheWVyRHVtcC5iZWdpbixcbiAgICAgICAgICAgIGVuZDogZW1iZWRkZWRQbGF5ZXJEdW1wLmVuZCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNhbGNFbWJlZGRlZFBsYXllcnMoZW1iZWRkZWRQbGF5ZXJzRHVtcDogSUVtYmVkZGVkUGxheWVyc1tdLCB3aWR0aDogbnVtYmVyKTogSUVtYmVkZGVkUGxheWVySW5mb1tdIHtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRQbGF5ZXJzOiBJRW1iZWRkZWRQbGF5ZXJJbmZvW10gPSBbXTtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJzRHVtcC5mb3JFYWNoKChlbWJlZGRlZFBsYXllcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmVnaW4gPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGVtYmVkZGVkUGxheWVyLmJlZ2luKTtcbiAgICAgICAgICAgIGNvbnN0IGVuZCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZW1iZWRkZWRQbGF5ZXIuZW5kKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlQmVnaW4gPSBnZXREaXN0YW5jZShiZWdpbiwgd2lkdGgpO1xuICAgICAgICAgICAgY29uc3QgZGlzdGFuY2VFbmQgPSBnZXREaXN0YW5jZShlbmQsIHdpZHRoKTtcbiAgICAgICAgICAgIC8vIOWMuuauteS7u+aEj+W4p+WcqOeUu+W4g+WGheWNs+WPr1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlQmVnaW4gPT09IDAgfHwgZGlzdGFuY2VFbmQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFBsYXllcnMucHVzaCh0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJEdW1wVG9JbmZvKGVtYmVkZGVkUGxheWVyLCBiZWdpbikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbWJlZGRlZFBsYXllcnM7XG4gICAgfVxuXG4gICAgcHVibGljIHRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGluZm86IElFbWJlZGRlZFBsYXllckluZm8sIGhhc01vdmU6IGJvb2xlYW4pOiBJRW1iZWRkZWRQbGF5ZXJzIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGJlZ2luOiBoYXNNb3ZlID8gZ3JpZEN0cmwuY2FudmFzVG9GcmFtZShpbmZvLngpIDogaW5mby5iZWdpbixcbiAgICAgICAgICAgIGVuZDogaGFzTW92ZSA/IGdyaWRDdHJsLmNhbnZhc1RvRnJhbWUoaW5mby54ICsgaW5mby53aWR0aCkgOiBpbmZvLmVuZCxcbiAgICAgICAgICAgIHJlY29uY2lsZWRTcGVlZDogaW5mby5yZWNvbmNpbGVkU3BlZWQsXG4gICAgICAgICAgICBwbGF5YWJsZTogaW5mby5wbGF5YWJsZSxcbiAgICAgICAgICAgIGdyb3VwOiBpbmZvLmdyb3VwLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6IGluZm8uZGlzcGxheU5hbWUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yi35pawXG4gICAgcHJpdmF0ZSBhc3luYyBfcmVmcmVzaCgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIC8vIGlmICghdGhhdC4kcmVmcy5yaWdodCkge1xuICAgICAgICAvLyAgICAgRmxhZ3MuZG9tUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgLy8gICAgIHJldHVybjtcbiAgICAgICAgLy8gfVxuICAgICAgICBjb25zdCBzaXplID0ge1xuICAgICAgICAgICAgdzogdGhhdC4kcmVmcy5yaWdodC5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgIGg6IHRoYXQuJHJlZnMucmlnaHQub2Zmc2V0SGVpZ2h0LFxuICAgICAgICB9O1xuICAgICAgICAvLyDlj6ropoHliqjnlLvnvJbovpHlmajmraTml7bojrflj5bkuI3liLDlsLrlr7jkv6Hmga/lsLHnm7TmjqXov5Tlm57vvIzlkI7nu63kvJrmnIkgcmVzaXplXFxzaG93IOa2iOaBr+adpemHjeaWsOi/m+WFpSByZWZyZXNoIOWHveaVsFxuICAgICAgICBpZiAoIShzaXplLncgJiYgc2l6ZS5oKSkge1xuICAgICAgICAgICAgRmxhZ3MuZG9tUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDkuLvopoHkuLrkuobpgb/lhY3lpJrmrKHosIPnlKggcmVmcmVzaCDlh73mlbBcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXRoaXMucmVmcmVzaFRhc2sgJiZcbiAgICAgICAgICAgIEZsYWdzLmRvbVJlYWR5ICYmXG4gICAgICAgICAgICB0aGF0LiRyZWZzLmdyaWRDYW52YXMud2lkdGggPT09IHNpemUudyAmJlxuICAgICAgICAgICAgdGhhdC4kcmVmcy5ncmlkQ2FudmFzLmhlaWdodCA9PT0gc2l6ZS5oXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhhdC5sb2FkaW5nID0gJyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgRWRpdG9yLk1ldHJpY3MudHJhY2tUaW1lU3RhcnQoJ2FuaW1hdG9yOnZpZXctcmVmcmVzaCcpO1xuICAgICAgICB0aGF0LmxvYWRpbmcgPSAnaW5pdF9hbmltYXRpb25fZGF0YSc7XG4gICAgICAgIEZsYWdzLmRvbVJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVTY3JvbGxJbmZvKHNpemUpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTY3JvbGxJbmZvKHNpemUpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8g5Yid5aeL5YyWXG4gICAgICAgIGNvbnN0IHV1aWQgPSBFZGl0b3IuU2VsZWN0aW9uLmdldExhc3RTZWxlY3RlZCgnbm9kZScpO1xuICAgICAgICAvLyDliLfmlrDpnIDopoHliKTmlq3mmK/lkKblt7LlnKjliqjnlLvnvJbovpHmqKHlvI/kuItcbiAgICAgICAgY29uc3QgbW9kZSA9IGF3YWl0IElxdWVyeVNjZW5lTW9kZSgpO1xuICAgICAgICBtb2RlID09PSAnYW5pbWF0aW9uJyA/ICh0aGF0LmFuaW1hdGlvbk1vZGUgPSB0cnVlKSA6ICh0aGF0LmFuaW1hdGlvbk1vZGUgPSBmYWxzZSk7XG4gICAgICAgIGF3YWl0IHRoaXMudm1Jbml0KCk7XG4gICAgICAgIHRoYXQud3JhcE1vZGVMaXN0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktZW51bS1saXN0LXdpdGgtcGF0aCcsICdBbmltYXRpb25DbGlwLldyYXBNb2RlJyk7XG4gICAgICAgIHRoYXQud3JhcE1vZGVMaXN0LmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGl0ZW0udGlwID0gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuYW5pbWF0aW9uQ3VydmUuV3JhcE1vZGUuJHtpdGVtLm5hbWV9LnRpcGApIHx8IGl0ZW0ubmFtZTtcbiAgICAgICAgICAgIGl0ZW0ubmFtZSA9IEVkaXRvci5JMThuLnQoYGFuaW1hdG9yLmFuaW1hdGlvbkN1cnZlLldyYXBNb2RlLiR7aXRlbS5uYW1lfS5sYWJlbGApIHx8IGl0ZW0ubmFtZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICBjb25zb2xlLnRpbWUoJ3VwZGF0ZU5vZGUnKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGNvbnNvbGUudGltZUVuZCgndXBkYXRlTm9kZScpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVFZGl0SW5mbygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoYXQuYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgcm9vdGlkLCBjbGlwaWQgfSA9IGF3YWl0IElnZXRFZGl0QW5pbWF0aW9uSW5mbygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnLCByb290aWQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUudGltZSgndXBkYXRlUm9vdCcpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlUm9vdChkdW1wKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ3VwZGF0ZVJvb3QnKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVTdGFydCgnYW5pbWF0b3I6dXBkYXRlLWNsaXBzLWRhdGEnKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUNsaXBzKGNsaXBpZCk7XG4gICAgICAgICAgICAgICAgRWRpdG9yLk1ldHJpY3MudHJhY2tUaW1lRW5kKCdhbmltYXRvcjp1cGRhdGUtY2xpcHMtZGF0YScsIHsgb3V0cHV0OiB0cnVlLCBsYWJlbDogYGFuaW1hdG9yOnVwZGF0ZS1jbGlwcy1kYXRhICR7Y2xpcGlkfWAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKCd1cGRhdGVDbGlwcycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0U3RhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGF0LmxvYWRpbmcgPSAnJztcbiAgICAgICAgRmxhZ3Muc2NlbmVSZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMucmVmcmVzaFRhc2sgPSAwO1xuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVFbmQoJ2FuaW1hdG9yOnZpZXctcmVmcmVzaCcsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgIH1cblxuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bSBhcyBJQW5pVk1UaGlzO1xuICAgICAgICBpZiAoIXRoYXQuJHJlZnMucmlnaHQpIHtcbiAgICAgICAgICAgIEZsYWdzLmRvbVJlYWR5ID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBvZmZzZXRXaWR0aCwgb2Zmc2V0SGVpZ2h0IH0gPSB0aGF0LiRyZWZzLnJpZ2h0O1xuICAgICAgICB0aGF0LiRyZWZzLmNoYXJ0LnN0eWxlLndpZHRoID0gYCR7b2Zmc2V0V2lkdGh9cHhgO1xuICAgICAgICBjb25zdCBzaXplID0ge1xuICAgICAgICAgICAgdzogdGhhdC4kcmVmcy5yaWdodC5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgIGg6IHRoYXQuJHJlZnMucmlnaHQub2Zmc2V0SGVpZ2h0LFxuICAgICAgICB9O1xuICAgICAgICBncmlkQ3RybC5ncmlkICYmIGdyaWRDdHJsLmdyaWQucmVzaXplKG9mZnNldFdpZHRoLCBvZmZzZXRIZWlnaHQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTY3JvbGxJbmZvKHNpemUpO1xuICAgICAgICAgICAgdGhpcy5jYWxjRGlzcGxheUNsaXBzKCk7XG4gICAgICAgICAgICB0aGlzLmNhbGNEaXNwbGF5Tm9kZXMoKTtcbiAgICAgICAgICAgIHRoaXMudm0udXBkYXRlS2V5RnJhbWUrKztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlU2Nyb2xsSW5mbyhzaXplOiB7IHc6IG51bWJlciwgaDogbnVtYmVyIH0pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGNvbnN0IGF1eEN1cnZlU3RvcmUgPSB0aGF0LmF1eEN1cnZlU3RvcmU7XG4gICAgICAgIC8vIFRPRE8g5LyY5YyW5LiN5bqU6K+l5q+P5LiqIGluZm8g6YO95aGr5YaZ5LiA5qC355qEIHNpemVcbiAgICAgICAgdGhhdC5ub2RlU2Nyb2xsSW5mbyA9IHtcbiAgICAgICAgICAgIHNpemUsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoYXQuJHJlZnNbJ25vZGUtY29udGVudCddLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIHRvcDogdGhhdC4kcmVmcy5ub2Rlcy5zY3JvbGxUb3AsXG4gICAgICAgIH07XG4gICAgICAgIHRoYXQucHJvcGVydHlTY3JvbGxJbmZvID0ge1xuICAgICAgICAgICAgc2l6ZSxcbiAgICAgICAgICAgIGhlaWdodDogdGhhdC4kcmVmc1sncHJvcGVydHktY29udGVudCddLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIHRvcDogdGhhdC4kcmVmcy5wcm9wZXJ0eS5zY3JvbGxUb3AsXG4gICAgICAgIH07XG4gICAgICAgIHRoYXQuZW1iZWRkZWRQbGF5ZXJTY3JvbGxJbmZvID0ge1xuICAgICAgICAgICAgc2l6ZSxcbiAgICAgICAgICAgIGhlaWdodDogdGhhdC4kcmVmc1snZW1iZWRkZWRQbGF5ZXItY29udGVudCddLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIHRvcDogdGhhdC4kcmVmcy5lbWJlZGRlZFBsYXllci5zY3JvbGxUb3AsXG4gICAgICAgIH07XG4gICAgICAgIGF1eEN1cnZlU3RvcmUuc2Nyb2xsSW5mbyA9IHtcbiAgICAgICAgICAgIHNpemUsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgb25FbnRlcigpIHtcbiAgICAgICAgYW5pbWF0aW9uQ2xpcENhY2hlTWFuYWdlci5hbmltYXRpb25Nb2RlID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc3QgY2xpcER1bXAgPSBhd2FpdCBhbmltYXRpb25DbGlwQ2FjaGVNYW5hZ2VyLnF1ZXJ5TGF0ZXN0Q2FjaGUodGhpcy52bS5jdXJyZW50Q2xpcCk7XG4gICAgICAgIC8vIGlmIChjbGlwRHVtcCkge1xuICAgICAgICAvLyAgICAgLy8g5bqU55So5Yqo55S75pWw5o2uXG4gICAgICAgIC8vICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIHtcbiAgICAgICAgLy8gICAgICAgICBuYW1lOiAnYW5pbWF0b3InLFxuICAgICAgICAvLyAgICAgICAgIG1ldGhvZDogJ3Jlc3RvcmVGcm9tRHVtcCcsXG4gICAgICAgIC8vICAgICAgICAgYXJnczogW3RoaXMudm0ucm9vdCwgdGhpcy52bS5jdXJyZW50Q2xpcCwgY2xpcER1bXBdLFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgdGhpcy52bS5hbmltYXRpb25Nb2RlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDooqvliqjpgIDlh7rliqjnlLvnvJbovpHmqKHlvI/lkI4o5LiA5Lqb55WM6Z2i57yW6L6R54q25oCB55qE6YeN572uKVxuICAgICAqL1xuICAgIG9uRXhpdCgpIHtcbiAgICAgICAgdGhpcy5jbG9zZU1hc2tQYW5lbCgpO1xuICAgICAgICB0aGlzLnZtLmFuaW1hdGlvbk1vZGUgPSBmYWxzZTtcbiAgICAgICAgYW5pbWF0aW9uQ2xpcENhY2hlTWFuYWdlci5hbmltYXRpb25Nb2RlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudm0ubW92ZU5vZGVQYXRoID0gJyc7XG4gICAgICAgIHRoaXMudm0uc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgIHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2N1cnZlRGF0YSA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnZtLnNob3dBbmltQ3VydmUpIHtcbiAgICAgICAgICAgIHRoaXMudm0udG9nZ2xlQW5pQ3VydmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKDApO1xuICAgICAgICBhbmltYXRpb25DdHJsLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet5Yqo55S757yW6L6R5Zmo55uR5ZCs5LqL5Lu25riF55CGXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIC8vIOa4heeQhuazqOWGjOeahOWFqOWxgOS6i+S7tlxuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwKTtcbiAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpO1xuXG4gICAgICAgIC8vIOWPlua2iOacquaJp+ihjOeahOmYsuaKluWHveaVsFxuICAgICAgICB0aGlzLmNhbmNlbERlYm91bmNlKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgc2VsZWN0Q2FjaGVDbGlwVG9BcHBseSgpIHtcbiAgICAgICAgY29uc3QgY2xpcER1bXAgPSBhd2FpdCBhbmltYXRpb25DbGlwQ2FjaGVNYW5hZ2VyLnNlbGVjdENsaXBDYWNoZSh0aGlzLnZtLmN1cnJlbnRDbGlwKTtcbiAgICAgICAgaWYgKGNsaXBEdW1wKSB7XG4gICAgICAgICAgICAvLyDlupTnlKjliqjnlLvmlbDmja5cbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdhbmltYXRvcicsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAncmVzdG9yZUZyb21EdW1wJyxcbiAgICAgICAgICAgICAgICBhcmdzOiBbdGhpcy52bS5yb290LCB0aGlzLnZtLmN1cnJlbnRDbGlwLCBjbGlwRHVtcF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGFuaW1hdGlvbkVkaXRvciA9IG5ldyBBbmltYXRpb25FZGl0b3IoKTtcblxuLyoqXG4gKiDojrflj5YgeCDlgY/np7vnlLvluIPkuYvlpJbnmoTot53nprtcbiAqID4gMCDliJnkuLrotoXov4fop4bnqpflt6bovrnnmoTot53nprtcbiAqIDwgMCDliJnkuLrlsJHkuo7op4bnqpflj7PovrnnmoTot53nprtcbiAqIEBwYXJhbSB4XG4gKi9cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHg6IG51bWJlciwgd2lkdGg6IG51bWJlcikge1xuICAgIGlmICh4ICsgZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQgPiB3aWR0aCkge1xuICAgICAgICByZXR1cm4geCArIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0IC0gd2lkdGg7XG4gICAgfVxuICAgIGlmICh4ICsgZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQgPCAwKSB7XG4gICAgICAgIHJldHVybiB4ICsgZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQ7XG4gICAgfVxuICAgIHJldHVybiAwO1xufVxuLy8g6K6h566X5YWz6ZSu5bin5pWw5o2u55qE5a6e6ZmF5pi+56S65L2N572u77yM5ZCM5pe26L+H5ruk5LiN5Zyo5pi+56S65Yy65Z+f5YaF55qE5YWz6ZSu5bin5pWw5o2uXG5leHBvcnQgZnVuY3Rpb24gY2FsY0ZyYW1lcyhrZXlGcmFtZXM6IElSYXdLZXlGcmFtZVtdLCB3aWR0aDogbnVtYmVyLCBpc0ltYWdlOiBib29sZWFuKTogSUtleUZyYW1lW10ge1xuICAgIGlmICgha2V5RnJhbWVzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0OiBJS2V5RnJhbWVbXSA9IFtdO1xuXG4gICAgZnVuY3Rpb24gZm9ybWF0S2V5KGtleWZyYW1lOiBJUmF3S2V5RnJhbWUpOiBJS2V5RnJhbWUge1xuICAgICAgICBpZiAoaXNJbWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBrZXlmcmFtZS54LFxuICAgICAgICAgICAgICAgIHByb3A6IGtleWZyYW1lLnByb3AsXG4gICAgICAgICAgICAgICAgZnJhbWU6IGtleWZyYW1lLmZyYW1lLFxuICAgICAgICAgICAgICAgIC8vIOmDqOWIhuaVsOaNruWPr+iDveWHuueOsOexu+S8vOaYryB1bmtub3cg55qE56m65YC8XG4gICAgICAgICAgICAgICAgdmFsdWU6IGtleWZyYW1lLmR1bXAudmFsdWUgJiYga2V5ZnJhbWUuZHVtcC52YWx1ZS51dWlkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDoga2V5ZnJhbWUueCxcbiAgICAgICAgICAgIHByb3A6IGtleWZyYW1lLnByb3AsXG4gICAgICAgICAgICBmcmFtZToga2V5ZnJhbWUuZnJhbWUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgZGlzdGFuY2VJbmZvID0ge1xuICAgICAgICBtYXhOZWdhdGl2ZToge1xuICAgICAgICAgICAgZGlzdGFuY2U6IC1JbmZpbml0eSxcbiAgICAgICAgICAgIGluZGV4OiAtMSxcbiAgICAgICAgfSxcbiAgICAgICAgbWluUG9zaXRpdmU6IHtcbiAgICAgICAgICAgIGluZGV4OiAtMSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBJbmZpbml0eSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIGtleUZyYW1lcy5mb3JFYWNoKChpdGVtLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIGl0ZW0ueCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoaXRlbS5mcmFtZSk7XG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gZ2V0RGlzdGFuY2UoaXRlbS54LCB3aWR0aCk7XG4gICAgICAgIGlmIChkaXN0YW5jZSA9PT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZm9ybWF0S2V5KGl0ZW0pKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlzdGFuY2UgPiAwICYmIGRpc3RhbmNlSW5mby5taW5Qb3NpdGl2ZS5kaXN0YW5jZSA+IGRpc3RhbmNlKSB7XG4gICAgICAgICAgICBkaXN0YW5jZUluZm8ubWluUG9zaXRpdmUuZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICAgICAgICAgIGRpc3RhbmNlSW5mby5taW5Qb3NpdGl2ZS5pbmRleCA9IGluZGV4O1xuICAgICAgICB9IGVsc2UgaWYgKGRpc3RhbmNlIDwgMCAmJiBkaXN0YW5jZUluZm8ubWF4TmVnYXRpdmUuZGlzdGFuY2UgPCBkaXN0YW5jZSkge1xuICAgICAgICAgICAgZGlzdGFuY2VJbmZvLm1heE5lZ2F0aXZlLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgICAgICBkaXN0YW5jZUluZm8ubWF4TmVnYXRpdmUuaW5kZXggPSBpbmRleDtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIOW9k+WFs+mUruW4p+mDveWcqOeUu+mdouS5i+WkluaXtu+8jOmcgOimgeaYvuekuuWcqOeUu+mdouWGheacgOi/keeahOS4pOS4quWFs+mUruW4p+WPiuWFtue6v+adoVxuICAgIGlmIChyZXN1bHQubGVuZ3RoICE9PSBrZXlGcmFtZXMubGVuZ3RoKSB7XG4gICAgICAgIGRpc3RhbmNlSW5mby5tYXhOZWdhdGl2ZS5pbmRleCAhPT0gLTEgJiYgcmVzdWx0LnB1c2goZm9ybWF0S2V5KGtleUZyYW1lc1tkaXN0YW5jZUluZm8ubWF4TmVnYXRpdmUuaW5kZXhdKSk7XG4gICAgICAgIGRpc3RhbmNlSW5mby5taW5Qb3NpdGl2ZS5pbmRleCAhPT0gLTEgJiYgcmVzdWx0LnB1c2goZm9ybWF0S2V5KGtleUZyYW1lc1tkaXN0YW5jZUluZm8ubWluUG9zaXRpdmUuaW5kZXhdKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICog5Yik5pat5p+Q5Liq6IqC54K55LiK5piv5ZCm5oyC6L295LqG5Yqo55S75pWw5o2uXG4gKiBAcGFyYW0gbm9kZVBhdGhcbiAqL1xuZnVuY3Rpb24gaGFzS2V5RGF0YShub2RlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW25vZGVQYXRoXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBkdW1wIG9mIE9iamVjdC52YWx1ZXMoYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW25vZGVQYXRoXSkpIHtcbiAgICAgICAgaWYgKGR1bXAua2V5RnJhbWVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuIl19