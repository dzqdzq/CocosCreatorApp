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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcFrames = exports.animationEditor = exports.CurveColorList = void 0;
const lodash_1 = __importStar(require("lodash"));
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const utils_1 = require("../utils");
const animation_ctrl_1 = require("./animation-ctrl");
const bezier_presets_1 = require("./bezier-presets");
const clip_cache_1 = require("./clip-cache");
const global_data_1 = require("./global-data");
const grid_ctrl_1 = require("./grid-ctrl");
const ipc_event_1 = require("./ipc-event");
const pop_menu_1 = require("./pop-menu");
exports.CurveColorList = ["#AE2D47" /* CurveColor.RED */, "#198F6B" /* CurveColor.GREEN */, "#227F9B" /* CurveColor.BLUE */, "#7979D7" /* CurveColor.PURPLE */];
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
                        if (event.button !== 2 /* EventButton.RIGHT */) {
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
                    if (event.button === 2 /* EventButton.RIGHT */) {
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
                    if (event.button === 2 /* EventButton.RIGHT */) {
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
            if (['node', 'property'].includes(global_data_1.Flags.mouseDownName) && event.button === 0 /* EventButton.LEFT */) {
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
        if (!this.vm.$refs.curve.curveCtrl || !this.vm.$refs.curve.curveCtrl.canvas.width || !this.vm.$refs.curve.curveCtrl.canvas.height) {
            this.vm.$refs.curve.resize(width, height);
            this.configureCurveEditor(this.vm.$refs.curve.editor);
        }
        if (!exports.animationEditor.hasInitCurve) {
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
                    this.addEmbeddedPlayerGroup({
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
    async addEmbeddedPlayerGroup(info) {
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
        const operations = [];
        const currentGroup = {
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
        await (0, ipc_event_1.IApplyOperation)(operations);
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
        if (dump.group !== '') {
            const group = this.vm.embeddedPlayerGroups.find((item) => item.key === dump.group);
            if (group) {
                const conflict = group.embeddedPlayers.find((embeddedPlayer) => {
                    return !(embeddedPlayer.end < dump.begin || dump.end < embeddedPlayer.begin);
                    // return Math.max(embeddedPlayer.begin, dump.begin) < Math.min(embeddedPlayer.end, dump.end);
                });
                if (!conflict) {
                    return group;
                }
            }
            // 指定了 group，就不会在其它 group 里查找
            return null;
        }
        for (const group of this.vm.embeddedPlayerGroups) {
            if (group.type !== dump.playable.type) {
                continue;
            }
            const conflict = group.embeddedPlayers.find((embeddedPlayer) => {
                return Math.max(embeddedPlayer.begin, dump.begin) < Math.min(embeddedPlayer.end, dump.end);
            });
            if (conflict) {
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
            this.vm.showAnimCurve && (this.vm.$refs.curve.curveCtrl && this.vm.$refs.curve.paint(data));
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
            if (params.find((param) => lodash_1.default.isEqual(info, param))) {
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
            this.updatePlayState(0 /* AnimationState.STOP */);
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
        if (event.button === 2 /* EventButton.RIGHT */) {
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
                return lodash_1.default.isEqual(item, dump);
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
            case 0 /* AnimationState.STOP */:
                that.animationState = 'stop';
                this.aniPlayTask && cancelAnimationFrame(this.aniPlayTask);
                this.checkCurrentTime();
                break;
            case 1 /* AnimationState.PLAY */:
                if (animation_ctrl_1.animationCtrl.animationState !== 'play') {
                    console.debug(`Invalid animation state change. (${animation_ctrl_1.animationCtrl.animationState} -> play))`);
                    break;
                }
                if (that.animationState !== 'play') {
                    that.animationState = 'play';
                    this.runPointer();
                }
                break;
            case 2 /* AnimationState.PAUSE */:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS9wYW5lbC9zaGFyZS9hbmltYXRpb24tZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQWlEO0FBQ2pELDZEQUFrQztBQXdCbEMsb0NBcUJrQjtBQUNsQixxREFBaUQ7QUFDakQscURBQTZFO0FBQzdFLDZDQUF5RDtBQUN6RCwrQ0FBOEM7QUFDOUMsMkNBQTZEO0FBQzdELDJDQXlCcUI7QUFDckIseUNBQThMO0FBZWpMLFFBQUEsY0FBYyxHQUFHLHNJQUFzRSxDQUFDO0FBRXJHLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxFQUFFO0lBQzdCLE9BQU87UUFDSCxNQUFNLEVBQUUsQ0FBQztRQUNULE1BQU0sRUFBRSxHQUFHO1FBRVgsT0FBTyxFQUFFLEdBQUc7UUFDWixPQUFPLEVBQUUsR0FBRztRQUVaLFNBQVMsRUFBRSxDQUFDO1FBQ1osU0FBUyxFQUFFLEdBQUc7UUFFZCxXQUFXLEVBQUUsQ0FBQztRQUNkLFdBQVcsRUFBRSxHQUFHO1FBRWhCLFFBQVEsRUFBRSxHQUFHO0tBQ2hCLENBQUM7QUFDTixDQUFDLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sZUFBZTtJQUFyQjtRQUNXLFVBQUssR0FBUSxJQUFJLENBQUM7UUFDVCxnQkFBVyxHQUFXLEVBQUUsQ0FBQztRQUN6QyxNQUFNO1FBQ1UsZUFBVSxHQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkMsaUJBQVksR0FBYSxDQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMvRix5QkFBb0IsR0FBYSxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JHLGFBQVEsR0FB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QzNHLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM5RztJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUF0REQsZ0NBc0RDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsSUFBSSxDQUFDLDhCQUFhLENBQUMsU0FBUyxJQUFJLENBQUMsOEJBQWEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFFLE9BQU8sS0FBSyxDQUFDO0tBQ2hCO0lBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLDhCQUFhLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQzNFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzdCLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7S0FDSjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTG9kYXNoLCB7IGNsYW1wLCBkZWJvdW5jZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBFZGl0b3JBbmltYXRpb25DbGlwRHVtcCwgSUNsaXBJbmZvLCBJRW1iZWRkZWRQbGF5ZXJzIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQge1xuICAgIElTZWxlY3RQYXJhbSxcbiAgICBJU2VsZWN0S2V5LFxuICAgIElLZXlGcmFtZSxcbiAgICBJU3RhcnREcmFnS2V5LFxuICAgIElTdGFydERyYWdFdmVudCxcbiAgICBJTm9kZUluZm8sXG4gICAgSVJhd0tleUZyYW1lLFxuICAgIElQcm9wRGF0YSxcbiAgICBJU3RpY2tJbmZvLFxuICAgIElBbmlWTVRoaXMsXG4gICAgSUFuaVByb3BDdXJ2ZUR1bXBEYXRhLFxuICAgIElDdXJ2ZVZhbHVlLFxuICAgIElDdXJ2ZUtleUluZm9zLFxuICAgIElLZXlGcmFtZURhdGEsXG4gICAgSUVtYmVkZGVkUGxheWVySW5mbyxcbiAgICBJQ3JlYXRlRW1iZWRkZWRQbGF5ZXJJbmZvLFxuICAgIElFbWJlZGRlZFBsYXllckdyb3VwLFxuICAgIElTZWxlY3RFbWJlZGRlZFBsYXllckluZm8sXG4gICAgSVNlbGVjdEtleUJhc2UsXG59IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHtcbiAgICBmcmFtZVRvVGltZSxcbiAgICBhZGRFdmVudExpc3RlbmVyT25jZSxcbiAgICByZW1vdmVFdmVudExpc3RlbmVyLFxuICAgIHNvcnRLZXlzVG9UcmVlTWFwLFxuICAgIGZvcm1hdENsaXBEdW1wLFxuICAgIGZvcm1hdE5vZGVEdW1wLFxuICAgIGNoZWNrUHJvcGVydHlJbk1lbnUsXG4gICAgc21vb3RoU2NhbGUsXG4gICAgdGltZVRvRnJhbWUsXG4gICAgdHJhbnNmb3JtQ3RybEtleVRvRHVtcCxcbiAgICB0cmFuc0R1bXBLZXlUb0N1cnZlS2V5LFxuICAgIG1vY2tEdW1wVG9DdHJsLFxuICAgIEV2ZW50QnV0dG9uLFxuICAgIFQsXG4gICAgY2FsY0VtYmVkZGVkUGxheWVyS2V5LFxuICAgIGNoZWNrQ3RybE9yQ29tbWFuZCxcbiAgICBFbWJlZGRlZFBsYXllck1lbnVNYXAsXG4gICAgY2FsY0tleUZyYW1lS2V5LFxuICAgIGlzTWVudUl0ZW0sXG4gICAgbXVsdGlwbHlUcmFja1dpdGhUaW1lcixcbn0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgYW5pbWF0aW9uQ3RybCB9IGZyb20gJy4vYW5pbWF0aW9uLWN0cmwnO1xuaW1wb3J0IHsgZGVmYXVsdEJlemllciwgdHJhbnNmb3JtQmV6aWVyRGF0YVRvUG9pbnQgfSBmcm9tICcuL2Jlemllci1wcmVzZXRzJztcbmltcG9ydCB7IGFuaW1hdGlvbkNsaXBDYWNoZU1hbmFnZXIgfSBmcm9tICcuL2NsaXAtY2FjaGUnO1xuaW1wb3J0IHsgRmxhZ3MsIElGbGFncyB9IGZyb20gJy4vZ2xvYmFsLWRhdGEnO1xuaW1wb3J0IHsgZ3JpZEN0cmwsIHN5bmNBeGlzWCwgc3luY0F4aXNZIH0gZnJvbSAnLi9ncmlkLWN0cmwnO1xuaW1wb3J0IHtcbiAgICBJZ2V0UHJvcFZhbHVlQXRGcmFtZSxcbiAgICBJc2V0Q3VyRWRpdFRpbWUsXG4gICAgSXF1ZXJ5Q2xpcER1bXAsXG4gICAgSXF1ZXJ5UGxheWluZ0NsaXBUaW1lLFxuICAgIElxdWVyeWNsaXBzTWVudUluZm8sXG4gICAgSXF1ZXJ5QW5pbWF0aW9uUm9vdCxcbiAgICBJcXVlcnlBbmltYXRpb25Sb290SW5mbyxcbiAgICBJcXVlcnlTY2VuZU1vZGUsXG4gICAgSXF1ZXJ5UHJvcGVydGllc01lbnUsXG4gICAgSWdldEVkaXRBbmltYXRpb25JbmZvLFxuICAgIEltb3ZlS2V5cyxcbiAgICBJQXBwbHlPcGVyYXRpb24sXG4gICAgSWNyZWF0ZUtleSxcbiAgICBJQW5pbU9wZXJhdGlvbixcbiAgICBJcmVtb3ZlS2V5LFxuICAgIEltb2RpZnlDdXJ2ZU9mS2V5LFxuICAgIHVwZGF0ZUVtYmVkZGVkUGxheWVyLFxuICAgIGRlbGV0ZUVtYmVkZGVkUGxheWVyLFxuICAgIGFkZEVtYmVkZGVkUGxheWVyR3JvdXAsXG4gICAgYWRkRW1iZWRkZWRQbGF5ZXIsXG4gICAgY2xlYXJFbWJlZGRlZFBsYXllckdyb3VwLFxuICAgIHJlbW92ZUVtYmVkZGVkUGxheWVyR3JvdXAsXG4gICAgcXVlcnlBbmltYXRpb25Ob2RlRWRpdEluZm8sXG4gICAgSXF1ZXJ5UGxheVN0YXRlLFxufSBmcm9tICcuL2lwYy1ldmVudCc7XG5pbXBvcnQgeyBnZXRQb3BNZW51TWFwLCBvblByb3BMaXN0Q29udGV4dE1lbnVzLCBvblRpbWVyQ29udGV4dE1lbnVzLCBvblByb3BDb250ZXh0TWVudXMsIG9uU3RpY2tNZW51cywgcG9wTWVudU1hcCwgb25FbWJlZGRlZFBsYXllckNvbnRleHRNZW51LCBvbkVtYmVkZGVkUGxheWVyVHJhY2tNZW51IH0gZnJvbSAnLi9wb3AtbWVudSc7XG5cbmV4cG9ydCBjb25zdCBlbnVtIEN1cnZlQ29sb3Ige1xuICAgIFJFRCA9ICcjQUUyRDQ3JyxcbiAgICBCTFVFID0gJyMyMjdGOUInLFxuICAgIEdSRUVOID0gJyMxOThGNkInLFxuICAgIFBVUlBMRSA9ICcjNzk3OUQ3Jyxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQW5pbWF0aW9uU3RhdGUge1xuICAgIFNUT1AgPSAwLFxuICAgIFBMQVksXG4gICAgUEFVU0UsXG59XG5cbmV4cG9ydCBjb25zdCBDdXJ2ZUNvbG9yTGlzdCA9IFtDdXJ2ZUNvbG9yLlJFRCwgQ3VydmVDb2xvci5HUkVFTiwgQ3VydmVDb2xvci5CTFVFLCBDdXJ2ZUNvbG9yLlBVUlBMRV07XG5cbmNvbnN0IGRlZmF1bHRMYXlvdXRDb25maWcgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdG9wTWluOiAwLFxuICAgICAgICB0b3BNYXg6IDUwMCxcblxuICAgICAgICBsZWZ0TWluOiAxMDAsXG4gICAgICAgIGxlZnRNYXg6IDUwMCxcblxuICAgICAgICBjZW50ZXJNaW46IDAsXG4gICAgICAgIGNlbnRlck1heDogNTAwLFxuXG4gICAgICAgIGF1eEN1cnZlTWluOiAwLFxuICAgICAgICBhdXhDdXJ2ZU1heDogNTAwLFxuXG4gICAgICAgIHRvdGFsUGVjOiAxMDAsXG4gICAgfTtcbn07XG5cbi8qKlxuICog5a2Y5YKo5Yqo55S757yW6L6R55u45YWz5pON5L2c55qE5pa55rOV77yM5L6L5aaC6YCJ5Lit5YWz6ZSu5bin44CB5omT5byA5Yqo55S75puy57q/57yW6L6R5Zmo562J562JXG4gKi9cbmNsYXNzIEFuaW1hdGlvbkVkaXRvciB7XG4gICAgcHVibGljIHBhbmVsOiBhbnkgPSBudWxsO1xuICAgIHB1YmxpYyByZWFkb25seSBMSU5FX0hFSUdIVDogbnVtYmVyID0gMjQ7XG4gICAgLy8g5YWz6ZSu5binXG4gICAgcHVibGljIHJlYWRvbmx5IEtFWV9TSVpFX1I6IG51bWJlciA9IE1hdGguc3FydCgxNCk7XG4gICAgcHVibGljIHJlYWRvbmx5IGltYWdlQ0NUeXBlczogc3RyaW5nW10gPSBbJ2NjLlNwcml0ZUZyYW1lJywgJ2NjLlRleHR1cmUyRCcsICdjYy5UZXh0dXJlQmFzZScsICdjYy5JbWFnZUFzc2V0J107XG4gICAgcHVibGljIHJlYWRvbmx5IGN1cnZlRGlzYWJsZWRDQ3R5cGVzOiBzdHJpbmdbXSA9IFsnVW5rbm93bicsICdjYy5Cb29sZWFuJywgJ2NjLlF1YXQnLCAuLi50aGlzLmltYWdlQ0NUeXBlc107XG4gICAgcHVibGljIGdyaWRDdHJsID0gZ3JpZEN0cmw7XG4gICAgcHVibGljIHJlZnJlc2hUYXNrID0gMDtcbiAgICBwdWJsaWMgaGFzSW5pdEN1cnZlID0gZmFsc2U7XG4gICAgcHVibGljIGhhc0luaXRDdXJ2ZVByZXNldCA9IGZhbHNlO1xuICAgIGdldCBzcGFjaW5nRnJhbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zcGFjaW5nRnJhbWU7XG4gICAgfVxuXG4gICAgc2V0IHNwYWNpbmdGcmFtZSh2YWw6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9zcGFjaW5nRnJhbWUgPSB2YWw7XG4gICAgICAgIHRoaXMuY2hhbmdlU3BhY2luZ0ZyYW1lKHZhbCk7XG4gICAgfVxuICAgIHByaXZhdGUgX3NwYWNpbmdGcmFtZSA9IDE7XG4gICAgcHJpdmF0ZSBfY3VydmVEYXRhOiBJQ3VydmVWYWx1ZSB8IG51bGwgPSBudWxsO1xuICAgIHB1YmxpYyBzZWxlY3RLZXlVcGRhdGVGbGFnID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgc3RpY2tJbmZvOiBJU3RpY2tJbmZvID0ge1xuICAgICAgICBsZWZ0RnJhbWU6IDAsXG4gICAgICAgIHJpZ2h0RnJhbWU6IDAsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICB9O1xuICAgIHB1YmxpYyBoYXNTaG93U3RpY2sgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBsYXlvdXRDb25maWcgPSBkZWZhdWx0TGF5b3V0Q29uZmlnKCk7XG5cbiAgICBwdWJsaWMgZGVib3VuY2VVcGRhdGVOb2RlID0gZGVib3VuY2UodGhpcy51cGRhdGVOb2RlLCAzMDApO1xuICAgIHB1YmxpYyBkZWJvdW5jZUZpbHRlck5vZGUgPSBkZWJvdW5jZSh0aGlzLkZpbHRlck5vZGUsIDMwMCk7XG4gICAgcHVibGljIGRlYm91bmNlUmVmcmVzaCA9IGRlYm91bmNlKHRoaXMuX3JlZnJlc2gsIDMwMCk7XG5cbiAgICAvKiogQGRlcHJlY2F0ZWQgdm0sIGFuaW1hdGlvbkVkaXRvciwgYW5pbWF0aW9uQ3RybCDkuInogIXkvp3otZblhbPns7vmt7fkubEgKi9cbiAgICBwcml2YXRlIHZtITogSUFuaVZNVGhpcztcbiAgICBwcml2YXRlIGFuaVBsYXlUYXNrID0gMDtcblxuICAgIHB1YmxpYyB1cGRhdGVTZWxlY3RRdWV1ZTogc3RyaW5nW10gPSBbXTtcblxuICAgIGdldCBpc0xvY2soKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGhpcy52bSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEhKCF0aGlzLnZtIHx8ICF0aGlzLnZtLmFuaW1hdGlvbk1vZGUgfHwgdGhpcy52bS5sb2NrIHx8IHRoaXMudm0ubWFza1BhbmVsKTtcbiAgICB9XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5yZWZyZXNoVGFzayA9IDA7XG4gICAgICAgIHRoaXMuaGFzSW5pdEN1cnZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnN0aWNrSW5mbyA9IHtcbiAgICAgICAgICAgIGxlZnRGcmFtZTogMCxcbiAgICAgICAgICAgIHJpZ2h0RnJhbWU6IDAsXG4gICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3NwYWNpbmdGcmFtZSA9IDE7XG4gICAgICAgIHRoaXMuaGFzU2hvd1N0aWNrID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGF5b3V0Q29uZmlnID0gZGVmYXVsdExheW91dENvbmZpZygpO1xuICAgICAgICB0aGlzLmFuaVBsYXlUYXNrID0gMDtcbiAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RRdWV1ZSA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruafkOS4qumFjee9ruWAvFxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRDb25maWcoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgRWRpdG9yLlByb2ZpbGUuc2V0Q29uZmlnKCdhbmltYXRvcicsIGtleSwgdmFsdWUsICdnbG9iYWwnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmn5DkuKrphY3nva7lgLxcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgYXN5bmMgZ2V0Q29uZmlnKGtleTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ2FuaW1hdG9yJywga2V5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgaW5pdCh2bTogSUFuaVZNVGhpcykge1xuICAgICAgICB0aGlzLnZtID0gdm07XG4gICAgICAgIGNvbnN0IGZyYW1lID0gYXdhaXQgYW5pbWF0aW9uRWRpdG9yLmdldENvbmZpZygnc3BhY2luZ0ZyYW1lJyk7XG4gICAgICAgIHRoaXMuX3NwYWNpbmdGcmFtZSA9IGZyYW1lIHx8IDE7XG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXJPbmNlKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwKTtcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lck9uY2UoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHZtSW5pdCgpIHtcbiAgICAgICAgY29uc3Qgdm0gPSB0aGlzLnZtO1xuICAgICAgICB2bS4kcmVmcy5jaGFydC5zdHlsZS53aWR0aCA9IGAke3ZtLiRyZWZzLnJpZ2h0Lm9mZnNldFdpZHRofXB4YDtcbiAgICAgICAgY29uc3Qgc2hvd1R5cGUgPSBhd2FpdCB0aGlzLmdldENvbmZpZygnc2hvd1R5cGUnKTtcbiAgICAgICAgZ3JpZEN0cmwuaW5pdCh7XG4gICAgICAgICAgICAkY2FudmFzOiB2bS4kcmVmcy5ncmlkQ2FudmFzLFxuICAgICAgICAgICAgJGxlZnQ6IHZtLiRyZWZzLmxlZnQsXG4gICAgICAgICAgICAkcmlnaHQ6IHZtLiRyZWZzLnJpZ2h0LFxuICAgICAgICAgICAgJHhBeGlzOiB2bS4kcmVmcy54QXhpcyxcbiAgICAgICAgICAgIHNob3dUeXBlLFxuICAgICAgICAgICAgbWluU2NhbGU6IDUsXG4gICAgICAgICAgICBtYXhTY2FsZTogMTAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRDb25maWcoKTtcbiAgICAgICAgdm0ub2Zmc2V0ID0gdm0uJHJlZnMubGVmdC5vZmZzZXRXaWR0aDtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGdyaWRDdHJsLmdyaWQhLnJlc2l6ZSgpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJUaW1lQXhpcygpO1xuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50RnJhbWUodm0uY3VycmVudEZyYW1lKTsgLy8g5Li75Yqo6Kem5Y+R5pu05pawXG4gICAgICAgICAgICB0aGlzLmluaXRDdXJ2ZSgpO1xuICAgICAgICAgICAgdm0ub2Zmc2V0ID0gZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOS7jiBpbml0Q3VydmUg5Lit5oq95Y+W5Ye65p2l55qE6YWN572u6YC76L6RXG4gICAgLy8gRklYTUU6IOW6lOivpei/m+S4gOatpeaPkOWPlu+8jOS7peS+v+WSjCBob29rIOWHveaVsOmFjeWQiOS9v+eUqOOAglxuICAgIC8vIOWQjOaXtui/meS4quWHveaVsOWPquW6lOivpeWcqOWIneWni+WMluaXtuiwg+eUqOS4gOasoe+8jOiAjOS4jeaYr+avj+asoeaYvuekuuabsue6v+aXtumDveiwg+eUqO+8iOebruWJjeeahCBidWfvvIlcbiAgICBwdWJsaWMgY29uZmlndXJlQ3VydmVFZGl0b3IoY3VydmU6IEVkaXRvci5VSS5IVE1MQ3VzdG9tRWxlbWVudCApIHtcbiAgICAgICAgY3VydmUuc2V0Q29uZmlnKHtcbiAgICAgICAgICAgIHhSYW5nZTogWzAsIEluZmluaXR5XSxcbiAgICAgICAgICAgIHlSYW5nZTogWy1JbmZpbml0eSwgSW5maW5pdHldLFxuICAgICAgICAgICAgc2hvd1ByZVdyYXBNb2RlOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dQb3N0V3JhcE1vZGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJlY2lzaW9uWDogMCxcbiAgICAgICAgICAgIHByZWNpc2lvblk6IDMsXG4gICAgICAgICAgICBzaG93WExhYmVsOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dZTGFiZWw6IHRydWUsXG4gICAgICAgICAgICBheGlzTWFyZ2luOiAwLFxuICAgICAgICAgICAgc2hvd1lMaW5lOiB0cnVlLFxuICAgICAgICAgICAgc2hvd1hMaW5lOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXJ0WE9mZnNldDogMTAsXG4gICAgICAgICAgICBoYW5kbGVyU2l6ZTogNjAsXG4gICAgICAgICAgICBncmlkQ29sb3I6ICcjMzMzODQ2JyxcbiAgICAgICAgICAgIHNwYWNpbmdGcmFtZTogdGhpcy5zcGFjaW5nRnJhbWUsXG4gICAgICAgICAgICBzYW1wbGU6IHRoaXMudm0uc2FtcGxlLFxuICAgICAgICAgICAgeEF4aXNOYW1lOiAndGltZScsXG4gICAgICAgICAgICB5QXhpc05hbWU6ICd2YWx1ZScsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRPRE86IGNvbm5lY3RlZCB0byBnbG9iYWwgZ3JpZCBkYXRhXG4gICAgICAgIGlmIChncmlkQ3RybC5ncmlkICYmIGN1cnZlLmN1cnZlQ3RybD8uZ3JpZCkge1xuICAgICAgICAgICAgc3luY0F4aXNYKGdyaWRDdHJsLmdyaWQsIGN1cnZlLmN1cnZlQ3RybC5ncmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBncmlkQ3RybC5ncmlkIOeahOWIneWni+WMluaXtuacuuavlOi+g+eJueauiu+8jOS+nei1luS6jiBzY2VuZTpyZWFkeSDlj4rkuIDns7vliJfpgLvovpHjgILlnKjlroPliJ3lp4vljJblrozmiJDliY3kvb/nlKjlm7rlrprlgLxcbiAgICAgICAgICAgIGN1cnZlLmN1cnZlQ3RybC5ncmlkLnhBeGlzU2NhbGUgPSAyMDtcbiAgICAgICAgICAgIGN1cnZlLmN1cnZlQ3RybC5ncmlkLnhBeGlzT2Zmc2V0ID0gMTA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRklYTUU6IOaMieeFp+S5i+WJjeeahOihjOS4uu+8jOavj+asoemDvSB5IOi9tOe8qeaUvlxuICAgICAgICBjdXJ2ZS5jdXJ2ZUN0cmwuZ3JpZC55QXhpc1NjYWxlID0gMTA7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXRDdXJ2ZSgpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSB0aGlzLnZtLiRyZWZzWydwcm9wZXJ0eS1jb250ZW50J10uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmICghdGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwgfHwgIXRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLmNhbnZhcy53aWR0aCB8fCAhdGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwuY2FudmFzLmhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyZUN1cnZlRWRpdG9yKHRoaXMudm0uJHJlZnMuY3VydmUuZWRpdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFuaW1hdGlvbkVkaXRvci5oYXNJbml0Q3VydmUpIHtcbiAgICAgICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLmdldENvcHlLZXlzID0gKCk6IElDdXJ2ZUtleUluZm9zW10gPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhbmltYXRpb25DdHJsLmNvcHlLZXlJbmZvO1xuICAgICAgICAgICAgICAgIGlmICghaW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnZlSW5mb3M6IElDdXJ2ZUtleUluZm9zW10gPSBbXTtcbiAgICAgICAgICAgICAgICBpbmZvLmN1cnZlc0R1bXAuZm9yRWFjaCgoZHVtcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjdXJ2ZUluZm9zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBkdW1wLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXM6IGR1bXAua2V5ZnJhbWVzLm1hcCgoaXRlbSkgPT4gbW9ja0R1bXBUb0N0cmwoaXRlbSkhKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnZlSW5mb3M7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8g5bCG5puy57q/5YaF5Yik5pat6I635Y+W5ou36LSd5YWz6ZSu5bin5pWw5o2u55qE5o6l5Y+j5pS55Li65Yqo55S757yW6L6R5Zmo55qE5Yik5pat5o6l5Y+jXG4gICAgICAgICAgICB0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybC5vbignb3BlcmF0ZScsIHRoaXMub25DdXJ2ZU9wZXJhdGUuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IuaGFzSW5pdEN1cnZlID0gdHJ1ZTtcblxuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5oYXNJbml0Q3VydmVQcmVzZXQpIHtcbiAgICAgICAgICAgIC8vIOiuvue9riBjdXJ2ZSDnmoQgY29uZmlnXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByZXNldEl0ZW0gb2YgZGVmYXVsdEJlemllci52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgcDEsIHAyLCBwMywgcDQgfSA9IHRyYW5zZm9ybUJlemllckRhdGFUb1BvaW50KHByZXNldEl0ZW0uZGF0YSk7XG4gICAgICAgICAgICAgICAgVnVlLnNldChcbiAgICAgICAgICAgICAgICAgICAgcHJlc2V0SXRlbSxcbiAgICAgICAgICAgICAgICAgICAgJ3N2Z0RhdGEnLFxuICAgICAgICAgICAgICAgICAgICBgTSR7cDFbMF19ICR7cDFbMV19IEMgJHtwMlswXX0gJHtwMlsxXX0sICR7cDNbMF19ICR7cDNbMV19LCAke3A0WzBdfSAke3A0WzFdfWAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaGFzSW5pdEN1cnZlUHJlc2V0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRFbWJlZGRlZFBsYXllck1lbnUoY3JlYXRlSW5mbz86IElDcmVhdGVFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGU6IElDcmVhdGVFbWJlZGRlZFBsYXllckluZm8gPSBjcmVhdGVJbmZvIHx8IHt9O1xuICAgICAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhFbWJlZGRlZFBsYXllck1lbnVNYXApLm1hcCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogaW5mby5sYWJlbCxcbiAgICAgICAgICAgICAgICBjbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVtYmVkZGVkUGxheWVyR3JvdXAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4udGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5YWJsZTogaW5mby52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkVtYmVkZGVkUGxheWVyVHJhY2tNZW51KGV2ZW50OiBNb3VzZUV2ZW50LCB0cmFja0luZm86IElFbWJlZGRlZFBsYXllckdyb3VwKSB7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkUGxheWVyc01lbnUgPSBnZXRQb3BNZW51TWFwKG9uRW1iZWRkZWRQbGF5ZXJUcmFja01lbnUpO1xuICAgICAgICBlbWJlZGRlZFBsYXllcnNNZW51LmNsZWFyRW1iZWRkZWRQbGF5ZXIuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRW1iZWRkZWRQbGF5ZXJHcm91cCh0cmFja0luZm8ua2V5KTtcbiAgICAgICAgICAgIHRoaXMudW5TZWxlY3RFbWJlZGRlZFBsYXllckluZm8odHJhY2tJbmZvLmVtYmVkZGVkUGxheWVycyk7XG4gICAgICAgIH07XG4gICAgICAgIGVtYmVkZGVkUGxheWVyc01lbnUucmVtb3ZlRW1iZWRkZWRQbGF5ZXJHcm91cC5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRW1iZWRkZWRQbGF5ZXJHcm91cCh0cmFja0luZm8ua2V5KTtcbiAgICAgICAgICAgIHRoaXMudW5TZWxlY3RFbWJlZGRlZFBsYXllckluZm8odHJhY2tJbmZvLmVtYmVkZGVkUGxheWVycyk7XG4gICAgICAgIH07XG4gICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHsgbWVudTogT2JqZWN0LnZhbHVlcyhlbWJlZGRlZFBsYXllcnNNZW51KSB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25FbWJlZGRlZFBsYXllckNvbnRleHRNZW51KGV2ZW50OiBNb3VzZUV2ZW50LCB0cmFja0luZm86IElFbWJlZGRlZFBsYXllckdyb3VwKSB7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkUGxheWVyc01lbnUgPSBnZXRQb3BNZW51TWFwKG9uRW1iZWRkZWRQbGF5ZXJDb250ZXh0TWVudSk7XG4gICAgICAgIGNvbnN0IGJlZ2luID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCk7XG4gICAgICAgIC8vIOagueaNruexu+Wei+WumuWItuWMluiPnOWNleaYvuekulxuICAgICAgICBlbWJlZGRlZFBsYXllcnNNZW51LmNyZWF0ZUVtYmVkZGVkUGxheWVyLmxhYmVsID0gdGhpcy52bS50KFxuICAgICAgICAgICAgcG9wTWVudU1hcC5jcmVhdGVFbWJlZGRlZFBsYXllci5sYWJlbCEsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGxheWVyOiB0aGlzLnZtLnQodHJhY2tJbmZvLm1lbnVJbmZvLmxhYmVsKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICAgIGVtYmVkZGVkUGxheWVyc01lbnUuY3JlYXRlRW1iZWRkZWRQbGF5ZXIuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZEVtYmVkZGVkUGxheWVyKHtcbiAgICAgICAgICAgICAgICBiZWdpbixcbiAgICAgICAgICAgICAgICBlbmQ6IGJlZ2luICsgNSxcbiAgICAgICAgICAgICAgICBwbGF5YWJsZToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0cmFja0luZm8udHlwZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdyb3VwOiB0cmFja0luZm8ua2V5LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJzTWVudS5jbGVhckVtYmVkZGVkUGxheWVyLmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGVhckVtYmVkZGVkUGxheWVyR3JvdXAodHJhY2tJbmZvLmtleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGVtYmVkZGVkUGxheWVyRHVtcHM6IElFbWJlZGRlZFBsYXllcnNbXSA9IGFuaW1hdGlvbkN0cmwuZ2V0Q2xpcEJvYXJkRGF0YSgnZW1iZWRkZWRQbGF5ZXInKSB8fCBbXTtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJEdW1wcyA9IGVtYmVkZGVkUGxheWVyRHVtcHMuZmlsdGVyKChkdW1wKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZHVtcC5wbGF5YWJsZSEudHlwZSA9PT0gdHJhY2tJbmZvLnR5cGU7XG4gICAgICAgIH0pO1xuICAgICAgICBlbWJlZGRlZFBsYXllcnNNZW51LnBhc3RlRW1iZWRkZWRQbGF5ZXIuZW5hYmxlZCA9ICEhZW1iZWRkZWRQbGF5ZXJEdW1wcy5sZW5ndGg7XG4gICAgICAgIGVtYmVkZGVkUGxheWVyc01lbnUucGFzdGVFbWJlZGRlZFBsYXllci5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVFbWJlZGRlZFBsYXllcihiZWdpbiwgZW1iZWRkZWRQbGF5ZXJEdW1wcywgdHJhY2tJbmZvLmtleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgRWRpdG9yLk1lbnUucG9wdXAoeyBtZW51OiBPYmplY3QudmFsdWVzKGVtYmVkZGVkUGxheWVyc01lbnUpIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGNsZWFyRW1iZWRkZWRQbGF5ZXJHcm91cChncm91cEtleTogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IElBcHBseU9wZXJhdGlvbihjbGVhckVtYmVkZGVkUGxheWVyR3JvdXAodGhpcy52bS5jdXJyZW50Q2xpcCwgZ3JvdXBLZXkpKTtcbiAgICB9XG5cbiAgICBhc3luYyByZW1vdmVFbWJlZGRlZFBsYXllckdyb3VwKGdyb3VwS2V5OiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgSUFwcGx5T3BlcmF0aW9uKHJlbW92ZUVtYmVkZGVkUGxheWVyR3JvdXAodGhpcy52bS5jdXJyZW50Q2xpcCwgZ3JvdXBLZXkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgYWRkRW1iZWRkZWRQbGF5ZXJHcm91cChpbmZvPzogSUNyZWF0ZUVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICBjb25zdCBkdW1wOiBJRW1iZWRkZWRQbGF5ZXJzID0ge1xuICAgICAgICAgICAgYmVnaW46IHRoaXMudm0uY3VycmVudEZyYW1lLFxuICAgICAgICAgICAgZW5kOiB0aGlzLnZtLmN1cnJlbnRGcmFtZSArIDUsXG4gICAgICAgICAgICByZWNvbmNpbGVkU3BlZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGxheWFibGU6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYW5pbWF0aW9uLWNsaXAnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdyb3VwOiAnJyxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZHVtcCwgaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uczogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICBjb25zdCBjdXJyZW50R3JvdXAgPSB7XG4gICAgICAgICAgICBrZXk6IFN0cmluZyhEYXRlLm5vdygpKSxcbiAgICAgICAgICAgIG5hbWU6IGR1bXAucGxheWFibGUhLnR5cGUsXG4gICAgICAgICAgICB0eXBlOiBkdW1wLnBsYXlhYmxlIS50eXBlLFxuICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXJzOiBbXSxcbiAgICAgICAgICAgIG1lbnVJbmZvOiBFbWJlZGRlZFBsYXllck1lbnVNYXBbZHVtcC5wbGF5YWJsZSEudHlwZV0sXG4gICAgICAgIH07XG4gICAgICAgIG9wZXJhdGlvbnMucHVzaChhZGRFbWJlZGRlZFBsYXllckdyb3VwKHRoaXMudm0uY3VycmVudENsaXAsIHtcbiAgICAgICAgICAgIGtleTogY3VycmVudEdyb3VwLmtleSxcbiAgICAgICAgICAgIG5hbWU6IGN1cnJlbnRHcm91cC5uYW1lLFxuICAgICAgICAgICAgdHlwZTogY3VycmVudEdyb3VwLnR5cGUsXG4gICAgICAgIH0pKTtcbiAgICAgICAgYXdhaXQgSUFwcGx5T3BlcmF0aW9uKG9wZXJhdGlvbnMpO1xuICAgIH1cbiAgICBwdWJsaWMgYXN5bmMgYWRkRW1iZWRkZWRQbGF5ZXIoaW5mbz86IElDcmVhdGVFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgY29uc3QgZHVtcDogSUVtYmVkZGVkUGxheWVycyA9IHtcbiAgICAgICAgICAgIGJlZ2luOiB0aGlzLnZtLmN1cnJlbnRGcmFtZSxcbiAgICAgICAgICAgIGVuZDogdGhpcy52bS5jdXJyZW50RnJhbWUgKyA1LFxuICAgICAgICAgICAgcmVjb25jaWxlZFNwZWVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBsYXlhYmxlOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2FuaW1hdGlvbi1jbGlwJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBncm91cDogJycsXG4gICAgICAgIH07XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGR1bXAsIGluZm8pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjdXJyZW50R3JvdXAgPSB0aGlzLmZpbmRHcm91cENhbkFkZChkdW1wKTtcbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uczogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICBpZiAoIWN1cnJlbnRHcm91cCkge1xuICAgICAgICAgICAgY3VycmVudEdyb3VwID0ge1xuICAgICAgICAgICAgICAgIGtleTogU3RyaW5nKERhdGUubm93KCkpLFxuICAgICAgICAgICAgICAgIG5hbWU6IGR1bXAucGxheWFibGUhLnR5cGUsXG4gICAgICAgICAgICAgICAgdHlwZTogZHVtcC5wbGF5YWJsZSEudHlwZSxcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFBsYXllcnM6IFtdLFxuICAgICAgICAgICAgICAgIG1lbnVJbmZvOiBFbWJlZGRlZFBsYXllck1lbnVNYXBbZHVtcC5wbGF5YWJsZSEudHlwZV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoKGFkZEVtYmVkZGVkUGxheWVyR3JvdXAodGhpcy52bS5jdXJyZW50Q2xpcCwge1xuICAgICAgICAgICAgICAgIGtleTogY3VycmVudEdyb3VwLmtleSxcbiAgICAgICAgICAgICAgICBuYW1lOiBjdXJyZW50R3JvdXAubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBjdXJyZW50R3JvdXAudHlwZSxcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMudm0uZW1iZWRkZWRQbGF5ZXJHcm91cHMucHVzaChjdXJyZW50R3JvdXApO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRHcm91cC5lbWJlZGRlZFBsYXllcnMucHVzaCh0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJEdW1wVG9JbmZvKGR1bXApKTtcbiAgICAgICAgZHVtcC5ncm91cCA9IGN1cnJlbnRHcm91cCEua2V5O1xuICAgICAgICBvcGVyYXRpb25zLnB1c2goYWRkRW1iZWRkZWRQbGF5ZXIodGhpcy52bS5jdXJyZW50Q2xpcCwgZHVtcCkpO1xuICAgICAgICBhd2FpdCBJQXBwbHlPcGVyYXRpb24ob3BlcmF0aW9ucyk7XG4gICAgICAgIG11bHRpcGx5VHJhY2tXaXRoVGltZXIoJ2hpcHBvQW5pbWF0b3InLCB7XG4gICAgICAgICAgICAvLyDmt7vliqDltYzlhaXmkq3mlL7lmajmrKHmlbBcbiAgICAgICAgICAgICdBMTAwMDAyJzogMSxcbiAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjemhueebrmlk77yMcHJvamVjdF9pZFxuICAgICAgICAgICAgcHJvamVjdF9pZDogRWRpdG9yLlByb2plY3QudXVpZCxcbiAgICAgICAgICAgIC8vIOavj+asoeS4iuaKpeaXtumcgOimgeW4puS4iuW9k+WJjee8lui+keeahOWKqOeUu+WJqui+kSBjbGlwX2lkXG4gICAgICAgICAgICBjbGlwX2lkOiB0aGlzLnZtLmN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgLy8g57yW6L6R5Zmo54mI5pysXG4gICAgICAgICAgICB2ZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBmaW5kR3JvdXBDYW5BZGQoZHVtcDogSUVtYmVkZGVkUGxheWVycyk6IElFbWJlZGRlZFBsYXllckdyb3VwIHwgbnVsbCB7XG4gICAgICAgIGlmIChkdW1wLmdyb3VwICE9PSAnJykge1xuICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLnZtLmVtYmVkZGVkUGxheWVyR3JvdXBzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ua2V5ID09PSBkdW1wLmdyb3VwKTtcbiAgICAgICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZsaWN0ID0gZ3JvdXAuZW1iZWRkZWRQbGF5ZXJzLmZpbmQoKGVtYmVkZGVkUGxheWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhKGVtYmVkZGVkUGxheWVyLmVuZCA8IGR1bXAuYmVnaW4gfHwgZHVtcC5lbmQgPCBlbWJlZGRlZFBsYXllci5iZWdpbik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBNYXRoLm1heChlbWJlZGRlZFBsYXllci5iZWdpbiwgZHVtcC5iZWdpbikgPCBNYXRoLm1pbihlbWJlZGRlZFBsYXllci5lbmQsIGR1bXAuZW5kKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZsaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBncm91cDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOaMh+WumuS6hiBncm91cO+8jOWwseS4jeS8muWcqOWFtuWugyBncm91cCDph4zmn6Xmib5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBncm91cCBvZiB0aGlzLnZtLmVtYmVkZGVkUGxheWVyR3JvdXBzKSB7XG4gICAgICAgICAgICBpZiAoZ3JvdXAudHlwZSAhPT0gZHVtcC5wbGF5YWJsZSEudHlwZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29uZmxpY3QgPSBncm91cC5lbWJlZGRlZFBsYXllcnMuZmluZCgoZW1iZWRkZWRQbGF5ZXIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoZW1iZWRkZWRQbGF5ZXIuYmVnaW4sIGR1bXAuYmVnaW4pIDwgTWF0aC5taW4oZW1iZWRkZWRQbGF5ZXIuZW5kLCBkdW1wLmVuZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChjb25mbGljdCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZVRvRW1iZWRkZWRQbGF5ZXJNb2RlKCkge1xuICAgICAgICAvLyDliIfmjaLmmK/lkKbpmpDol4/ml6DmlYjoioLngrnml7bvvIzljrvpmaTljp/mnKznmoTmu5rliqjkv6Hmga9cbiAgICAgICAgdGhpcy52bS4kcmVmcy5ub2Rlcy5zY3JvbGxUb3AgPSB0aGlzLnZtLm5vZGVTY3JvbGxJbmZvIS50b3AgPSAwO1xuICAgICAgICBhbmltYXRpb25FZGl0b3IuY2FsY0Rpc3BsYXlDbGlwcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGFuZ2VUb0tleUZyYW1lTW9kZSgpIHtcbiAgICAgICAgLy8g5YiH5o2i5piv5ZCm6ZqQ6JeP5peg5pWI6IqC54K55pe277yM5Y676Zmk5Y6f5pys55qE5rua5Yqo5L+h5oGvXG4gICAgICAgIHRoaXMudm0uJHJlZnMubm9kZXMuc2Nyb2xsVG9wID0gdGhpcy52bS5ub2RlU2Nyb2xsSW5mbyEudG9wID0gMDtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyVGltZUF4aXMoKSB7XG4gICAgICAgIGxldCB0aW1lID0gMTtcbiAgICAgICAgbGV0IGZyYW1lID0gdGltZSAqIChhbmltYXRpb25DdHJsLmNsaXBDb25maWcuc2FtcGxlIHx8IDYwKTtcbiAgICAgICAgY29uc3QgdGltZUluZm9zOiB7IHZhbHVlOiBudW1iZXIsIHg6IG51bWJlciB9W10gPSBbXTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLnZtLiRyZWZzLmNvbnRhaW5lci5jbGllbnRXaWR0aDtcbiAgICAgICAgY29uc3QgZ2V0Q2FudmFzT2Zmc2V0ID0gKGZyYW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZnJhbWUpIC0gMTAgKyB0aGlzLnZtLm9mZnNldDtcbiAgICAgICAgfTtcbiAgICAgICAgd2hpbGUgKEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKGdldENhbnZhc09mZnNldChmcmFtZSksIDAsIHdpZHRoKSA9PT0gZ2V0Q2FudmFzT2Zmc2V0KGZyYW1lKSkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhmcmFtZSk7XG4gICAgICAgICAgICB0aW1lSW5mb3MucHVzaCh7XG4gICAgICAgICAgICAgICAgdmFsdWU6IE1hdGguZmxvb3IoZnJhbWUgLyAoYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnLnNhbXBsZSB8fCA2MCkpLFxuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRpbWUrKztcbiAgICAgICAgICAgIGZyYW1lID0gdGltZSAqIChhbmltYXRpb25DdHJsLmNsaXBDb25maWcuc2FtcGxlIHx8IDYwKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZtLnRpbWVJbmZvcyA9IHRpbWVJbmZvcztcblxuICAgICAgICAvLyBUT0RPIHNjYWxlIOeahOabtOaWsOmcgOimgeaNouS4quS9jee9rlxuICAgICAgICB0aGlzLnZtLnNjYWxlID0gY2xhbXAoZ3JpZEN0cmwuZ3JpZCEueEF4aXNTY2FsZSwgZ3JpZEN0cmwuZ3JpZCEueE1pblNjYWxlLCBncmlkQ3RybC5ncmlkIS54TWF4U2NhbGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25DdXJ2ZU9wZXJhdGUob3BlcmF0ZTogc3RyaW5nLCBjdXJ2ZUtleUZyYW1lczogSUN1cnZlS2V5SW5mb3NbXSwgdGFyZ2V0RnJhbWU/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy52bS5oYXNTZWxlY3RlZEN1cnZlQ2xpcCA9IGZhbHNlO1xuICAgICAgICBpZiAob3BlcmF0ZSA9PT0gJ3Vuc2VsZWN0JyB8fCAhdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudm0ubGlnaHRDdXJ2ZSA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjdXJ2ZUtleUZyYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBub2RlUGF0aCwgdHlwZSB9ID0gdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSE7XG4gICAgICAgIHN3aXRjaCAob3BlcmF0ZSkge1xuICAgICAgICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEtleUluZm86IElTZWxlY3RLZXkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlGcmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IG5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDogdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSEucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiAncHJvcCcsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGtleXNJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChrZXlzSW5mby5rZXlzLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBrZXlzSW5mby5rZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RLZXlJbmZvLmtleUZyYW1lcy5wdXNoKC4uLmtleXMhLm1hcCgoaW5mbywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBrZXlzSW5mby5rZXlzW2luZGV4XS5rZXkuY2FudmFzLnggLSBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGluZm8uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBpbmZvLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wOiBwcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmtleURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY2FsY0tleUZyYW1lS2V5KGtleURhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdEtleVVwZGF0ZUZsYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gc2VsZWN0S2V5SW5mbztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS51cGRhdGVTZWxlY3RLZXkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdkYi1zZWxlY3QnOlxuICAgICAgICAgICAgICAgIC8vIOWPjOWHu+i3s+i9rOWIsOafkOS4quWFs+mUruW4p+S9jee9rlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEtleXMgPSBjdXJ2ZUtleUZyYW1lc1swXS5rZXlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJyZW50S2V5cywgdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKGtleXNbMF0uZnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NlbGVjdC1jdXJ2ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy52bS5saWdodEN1cnZlID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjdXJ2ZUtleUZyYW1lc1swXS5rZXksXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnZtLnByb3BlcnRpZXMhW2N1cnZlS2V5RnJhbWVzWzBdLmtleV0uY29sb3IhLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZWxlY3QtY3VydmUtY2xpcCc6XG4gICAgICAgICAgICAgICAgdGhpcy52bS5saWdodEN1cnZlID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjdXJ2ZUtleUZyYW1lc1swXS5rZXksXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnZtLnByb3BlcnRpZXMhW2N1cnZlS2V5RnJhbWVzWzBdLmtleV0uY29sb3IhLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy52bS5oYXNTZWxlY3RlZEN1cnZlQ2xpcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhcHBseS1iZXppZXInOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52bS5oYXNTZWxlY3RlZEN1cnZlQ2xpcCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wZXJhdGlvbnM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjdXJ2ZUtleUluZm9zIG9mIGN1cnZlS2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQcm9wID0gY3VydmVLZXlJbmZvcy5rZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJ2ZUtleUluZm9zLmtleXMsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kaWZ5S2V5cyA9IGtleXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEltb2RpZnlDdXJ2ZU9mS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCB0YXJnZXRQcm9wLCBpdGVtLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0uaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50V2VpZ2h0OiBpdGVtLmluVGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGl0ZW0ub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycE1vZGU6IGl0ZW0uaW50ZXJwTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhbmdlbnRXZWlnaHRNb2RlOiBpdGVtLnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9ucy5wdXNoKC4uLm1vZGlmeUtleXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihvcGVyYXRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzY2FsZS1rZXlzJzpcbiAgICAgICAgICAgIGNhc2UgJ21vdmUta2V5cyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3ZlS2V5czogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEtleUluZm86IElTZWxlY3RLZXkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleUZyYW1lczogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogJ3Byb3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDogdGhpcy52bS5zZWxlY3RQcm9wZXJ0eSEucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5SW5mb3MuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlhbPplK7luKfnp7vliqhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXRGcmFtZVggPSBNYXRoLnJvdW5kKGl0ZW0ua2V5LnBvaW50LnggLSBpdGVtLnJhdy5wb2ludC54KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGtleXNbaW5kZXhdLmZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZToga2V5c1tpbmRleF0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3A6IGN1cnZlSW5mby5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBNYXRoLnJvdW5kKGl0ZW0ucmF3LnBvaW50LngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhpcy52bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IG9mZnNldEZyYW1lWCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdEtleUluZm8ua2V5RnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGNhbGNLZXlGcmFtZUtleShrZXlEYXRhKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXRGcmFtZVkgPSBNYXRoLnJvdW5kKGl0ZW0ua2V5LnBvaW50LnkgLSBpdGVtLnJhdy5wb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9mZnNldEZyYW1lWCAmJiAhb2Zmc2V0RnJhbWVZKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZVggJiYgbW92ZUtleXMucHVzaChJbW92ZUtleXModGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIGN1cnZlSW5mby5rZXksIFtNYXRoLnJvdW5kKGl0ZW0ucmF3LnBvaW50LngpXSwgb2Zmc2V0RnJhbWVYKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlS2V5cy5wdXNoKEljcmVhdGVLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIGN1cnZlSW5mby5rZXksIGtleXNbaW5kZXhdLmZyYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBpdGVtLmtleS5wb2ludC55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0ua2V5LmluVGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5rZXkub3V0VGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaMiemhuuW6j++8jOWFiOenu+WKqO+8jOWGjeabtOaWsOWFs+mUruW4p+aVsOaNrlxuICAgICAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oWy4uLm1vdmVLZXlzLCAuLi5jcmVhdGVLZXlzXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZtLnNlbGVjdEtleUluZm8gPSBzZWxlY3RLZXlJbmZvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RhbmdlbnQnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByb3AgPSBjdXJ2ZUtleUZyYW1lc1swXS5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlLZXlzID0ga2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW1vZGlmeUN1cnZlT2ZLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIHRhcmdldFByb3AsIGl0ZW0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0uaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm9rZW46IGl0ZW0uYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50OiBpdGVtLm91dFRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogaXRlbS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGl0ZW0ub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUtleXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIFRPRE8g5pqC5pe25rKh5pyJ6LCD55So77yM6ZyA6KaB5Zy65pmv5pSv5oyBIGJyb2tlbiDmlbDmja7nmoTkv67mlLlcbiAgICAgICAgICAgIGNhc2UgJ2NoYW5nZS1icm9rZW4tc3RhdGUnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFByb3AgPSBjdXJ2ZUtleUZyYW1lc1swXS5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlLZXlzID0ga2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSW1vZGlmeUN1cnZlT2ZLZXkodGhpcy52bS5jdXJyZW50Q2xpcCwgbm9kZVBhdGgsIHRhcmdldFByb3AsIGl0ZW0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm9rZW46IGl0ZW0uYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5S2V5cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlLWtleXMnOlxuICAgICAgICAgICAgICAgIC8vIOeymOi0tOaOpeWPo+ebruWJjeS5n+i1sOaWsOW7uuWFs+mUruW4p+WkhOeQhlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlS2V5c1Rhc2s6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5cy5mb3JFYWNoKCh0YXJnZXRLZXksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlS2V5c1Rhc2sucHVzaChJY3JlYXRlS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBrZXlzW2luZGV4XS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IHRhcmdldEtleS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnQ6IHRhcmdldEtleS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogdGFyZ2V0S2V5LmR1bXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycE1vZGU6IHRhcmdldEtleS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogdGFyZ2V0S2V5LnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnRXZWlnaHQ6IHRhcmdldEtleS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IHRhcmdldEtleS5vdXRUYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKGNyZWF0ZUtleXNUYXNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGFuZ2UtaW50ZXJwLW1vZGUnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUN1cnZlT2ZLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeUN1cnZlT2ZLZXlzLnB1c2goLi4ua2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEltb2RpZnlDdXJ2ZU9mS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnQ6IGl0ZW0uaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwTW9kZTogaXRlbS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUN1cnZlT2ZLZXlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGFuZ2UtdGFuZ2VudC13ZWlnaHQnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUN1cnZlT2ZLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmeUN1cnZlT2ZLZXlzLnB1c2goLi4ua2V5cyEubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEltb2RpZnlDdXJ2ZU9mS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogaXRlbS50YW5nZW50V2VpZ2h0TW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogaXRlbS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiBpdGVtLm91dFRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUN1cnZlT2ZLZXlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdyZW1vdmUta2V5cyc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUtleXMucHVzaCguLi5rZXlzIS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSXJlbW92ZUtleSh0aGlzLnZtLmN1cnJlbnRDbGlwLCBub2RlUGF0aCwgY3VydmVJbmZvLmtleSwgaXRlbS5mcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihyZW1vdmVLZXlzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RLZXlVcGRhdGVGbGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudm0uc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbW92ZS1jdXJ2ZSc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaVtOadoeabsue6v+eahOS4iuS4i+enu+WKqO+8muaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlS2V5cy5wdXNoKC4uLmtleXMhLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBJY3JlYXRlS2V5KHRoaXMudm0uY3VycmVudENsaXAsIG5vZGVQYXRoLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLCB7IG5ld1ZhbHVlOiBpdGVtLmR1bXAudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oY3JlYXRlS2V5cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGFzdGUnOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVLZXkoXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0RnJhbWUhLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IG5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2tleScpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjb3B5JzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWwhuWFs+mUruW4p+aVsOaNrui9rOaNouS4uuWKqOeUu+e8lui+keWZqOWPr+aOpeWPl+eahOaLt+i0neaVsOaNruagvOW8j1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJ2ZXNEdW1wOiBJQW5pUHJvcEN1cnZlRHVtcERhdGFbXSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlZnRGcmFtZXM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3UHJvcERhdGEgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEucGF0aHNEdW1wW25vZGVQYXRoXVtjdXJ2ZUluZm8ua2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbbm9kZVBhdGhdW3Jhd1Byb3BEYXRhLnBhcmVudFByb3BLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCB0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnZlc0R1bXAucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IG5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY3VydmVJbmZvLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiByYXdQcm9wRGF0YSEudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogcmF3UHJvcERhdGEhLmRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleWZyYW1lczoga2V5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliIbph4/ovajpgZPopoHlsL3ph4/nspjotLTliLDkuIDmoLfniLbovajpgZPkuIvnmoTlrZDovajpgZPlhoXvvIzpnIDopoHorrDlvZXpop3lpJbkv6Hmga/vvIzlkKbliJnlj6rmnIkgbnVtYmVyIOi/meexu+eahOS/oeaBr++8jOaXoOazleWIpOaWrVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9wYXJlbnRUeXBlOiBwYXJlbnQgJiYgcGFyZW50LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlRXh0cmFwOiByYXdQcm9wRGF0YS5wcmVFeHRyYXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdEV4dHJhcDogcmF3UHJvcERhdGEucG9zdEV4dHJhcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0N1cnZlU3VwcG9ydDogcmF3UHJvcERhdGEuaXNDdXJ2ZVN1cHBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnRGcmFtZXMucHVzaChrZXlzWzBdLmZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUtleUluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJ2ZXNEdW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdEZyYW1lOiBsZWZ0RnJhbWVzLnNvcnQoKGEsIGIpID0+IGEgLSBiKVswXSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIEZpbHRlck5vZGUobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMudm0uZmlsdGVyTmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlOb2RlcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja0N1cnZlRGF0YURpcnR5KGN1cnZlRGF0YTogSUN1cnZlVmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jdXJ2ZURhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnZlRGF0YSA9IGN1cnZlRGF0YTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlcyA9IEpTT04uc3RyaW5naWZ5KHRoaXMuX2N1cnZlRGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KGN1cnZlRGF0YSk7XG4gICAgICAgIC8vIOajgOafpSBkaXJ0eSDlkI7pnIDopoHnvJPlrZjmnIDmlrDnmoTmm7Lnur/mlbDmja7vvIzkuIvmrKEgZGlydHkg5YC86ZyA6KaB5ZKM5LiK5LiA5qyh6K6w5b2V55qE5q+U5a+5XG4gICAgICAgIHRoaXMuX2N1cnZlRGF0YSA9IGN1cnZlRGF0YTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbpgInkuK3lhbPplK7luKfmlbDmja7lkIzmraXliLDmm7Lnur/lhoVcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlQ3VydmVTZWxlY3RlS2V5cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZtLnNob3dBbmltQ3VydmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMudm0uc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5jdXJ2ZUN0cmwuc2VsZWN0S2V5cyhudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb3J0RHVtcCA9IHRoaXMudm0uc2VsZWN0S2V5SW5mby5zb3J0RHVtcCB8fCBzb3J0S2V5c1RvVHJlZU1hcCh0aGlzLnZtLnNlbGVjdEtleUluZm8ua2V5RnJhbWVzKTtcbiAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBPYmplY3QudmFsdWVzKHNvcnREdW1wKS5tYXAoKHByb3BEdW1wKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGtleTogcHJvcER1bXAucHJvcCxcbiAgICAgICAgICAgICAgICBmcmFtZXM6IHByb3BEdW1wLmtleUZyYW1lcy5tYXAoKGl0ZW0pID0+IGl0ZW0uZnJhbWUpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsLnNlbGVjdEtleXMoa2V5SW5mb3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXBhaW50Q3VydmUoZGF0YTogSUN1cnZlVmFsdWUgfCBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy52bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDnlYzpnaLlgYflrprmiYDmnInmlbDmja7pg73mmK/mraPluLjnmoTop4TliJnljrvlpITnkIbvvIzlpoLmnpzpgYfliLDlvILluLjmlbDmja7kvJrmipvlh7rlvILluLjlr7zoh7TplJnor6/vvIzlhYggdHJ5IGNhdGNoIOmBv+WFjeW9seWTjeeVjOmdoueahOWFtuS7luaTjeS9nFxuICAgICAgICAgICAgdGhpcy52bS5zaG93QW5pbUN1cnZlICYmICh0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybCAmJiB0aGlzLnZtLiRyZWZzLmN1cnZlLnBhaW50KGRhdGEpKTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnZlRGF0YSA9IGRhdGE7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zZWxlY3RLZXlVcGRhdGVGbGFnKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUN1cnZlU2VsZWN0ZUtleXMoKTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0S2V5VXBkYXRlRmxhZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZUxheW91dENvbmZpZygpIHtcbiAgICAgICAgLy8gMTMzIOKJiCAkY29udGFpbmVyLnRvcCg1MCkgKyAkdGltZS1wb2ludGVyLmhlaWdodCgzMSkgKyAkcHJvcGVydHktdG9vbHMuaGVpZ2h0KDI4KSArLmV2ZW50cygyNClcbiAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMudm0uJGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB0aGlzLmxheW91dENvbmZpZy50b3BNYXggPSByZWN0LnRvcCArIHRoaXMucGFuZWwuY2xpZW50SGVpZ2h0IC0gMTMzO1xuICAgICAgICB0aGlzLmxheW91dENvbmZpZy5sZWZ0TWF4ID0gcmVjdC5sZWZ0ICsgdGhpcy5wYW5lbC5jbGllbnRXaWR0aCAtIDEwMDtcbiAgICAgICAgdGhpcy5sYXlvdXRDb25maWcudG90YWxQZWMgPSAxMDAgKiAodGhpcy52bS4kcmVmcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0IC0gMzAgKiAzKSAvIHRoaXMudm0uJHJlZnMuY29udGFpbmVyLm9mZnNldEhlaWdodDtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlU2FtcGxlKHNhbXBsZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy52bSB8fCAhdGhpcy52bS5zaG93QW5pbUN1cnZlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52bS4kcmVmcy5jdXJ2ZS5zYW1wbGUgPSBzYW1wbGU7XG4gICAgfVxuXG4gICAgcHVibGljIGhpZGVOb2RlcygpIHtcbiAgICAgICAgdGhpcy52bS4kcmVmcy5ub2Rlcy5zdHlsZS5oZWlnaHQgPSAnMjRweCc7XG4gICAgICAgIHRoaXMudm0uJHJlZnMubm9kZXMuc3R5bGUuZmxleCA9ICd1bnNldCc7XG4gICAgICAgIHRoaXMudm0uJHJlZnNbJ25vZGUtY29udGVudCddLnN0eWxlLmhlaWdodCA9ICcyNHB4JztcbiAgICAgICAgdGhpcy52bS4kcmVmc1snbm9kZS1jb250ZW50J10uc3R5bGUuZmxleCA9ICd1bnNldCc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pi+56S65p+Q5q615o+Q56S6XG4gICAgICogQHBhcmFtIG1lc3NhZ2VcbiAgICAgKi9cbiAgICBwdWJsaWMgc2hvd1RvYXN0KG1lc3NhZ2U6IHN0cmluZywgYXdhaXRNcyA9IDEwMDApIHtcbiAgICAgICAgdGhpcy52bS50b2FzdC5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgRmxhZ3MudGlwc1RpbWVyICYmIGNsZWFyVGltZW91dChGbGFncy50aXBzVGltZXIpO1xuICAgICAgICBGbGFncy50aXBzVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudm0udG9hc3QubWVzc2FnZSA9ICcnO1xuICAgICAgICB9LCBhd2FpdE1zKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNoYW5nZVNwYWNpbmdGcmFtZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc2V0Q29uZmlnKCdzcGFjaW5nRnJhbWUnLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMudm0uJHJlZnMuY3VydmUuY3VydmVDdHJsICYmICh0aGlzLnZtLiRyZWZzLmN1cnZlLmN1cnZlQ3RybC5jb25maWcuc3BhY2luZ0ZyYW1lID0gdmFsdWUpO1xuICAgIH1cblxuICAgIC8vIOabtOaWsOmAieS4reWFs+mUruW4p+S9jee9riwg5Lul5Y+K5b2T5YmN6byg5qCH5YWz6ZSu5bin55qE5L2N572uXG4gICAgcHVibGljIHVwZGF0ZVBvc2l0aW9uSW5mbyh0eXBlPzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICB0aGF0LnVwZGF0ZVBvc2l0aW9uKys7XG5cbiAgICAgICAgaWYgKHRoYXQucHJldmlld1BvaW50ZXIpIHtcbiAgICAgICAgICAgIHRoYXQucHJldmlld1BvaW50ZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0Lm5vZGVEdW1wICYmIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wKSB7XG4gICAgICAgICAgICB0aGF0Lm5vZGVEdW1wLmZvckVhY2goKGl0ZW06IElOb2RlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBpdGVtLmtleUZyYW1lcyA9IE9iamVjdC5mcmVlemUodGhpcy5jYWxjTm9kZUZyYW1lcyhpdGVtLnBhdGgpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBUT0RPIOS4jeiDveaVtOauteabv+aNou+8jOS8muW9seWTjeeVjOmdoua4suafk+aViOeOh1xuICAgICAgICAgICAgaWYgKHRoYXQucHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHRoYXQucHJvcGVydGllcyA9IHRoaXMuY2FsY1Byb3BlcnR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNhbGNBdXhpbGlhcnlDdXJ2ZXMoKTtcbiAgICAgICAgICAgIHRoYXQudXBkYXRlS2V5RnJhbWUrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5jYWxjRGlzcGxheUVtYmVkZGVkUGxheWVycygpO1xuXG4gICAgICAgIGlmICh0eXBlID09PSAnbW92ZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcykge1xuICAgICAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaXRlbS54ID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhpdGVtLmZyYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQudXBkYXRlU2VsZWN0S2V5Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wICYmIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLmV2ZW50cykge1xuICAgICAgICAgICAgdGhpcy5jYWxjRXZlbnRzRHVtcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEV2ZW50SW5mbykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoYXQuc2VsZWN0RXZlbnRJbmZvLmRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW0ueCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoaXRlbS5mcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW0ueCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoaXRlbS5yYXdJbmZvIS5iZWdpbik7XG4gICAgICAgICAgICAgICAgaXRlbS53aWR0aCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoaXRlbS5yYXdJbmZvIS5lbmQpIC0gaXRlbS54O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g6YeN572u6YCJ5Lit55qE5YWz6ZSu5bin5L+h5oGvXG4gICAgcHVibGljIHJlc2V0U2VsZWN0ZWRLZXlJbmZvKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZW1wU2VsZWN0OiBJU2VsZWN0S2V5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGF0LnNlbGVjdEtleUluZm8pKTtcbiAgICAgICAgdGVtcFNlbGVjdC5vZmZzZXRGcmFtZSA9IDA7XG4gICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0ID0gMDtcbiAgICAgICAgZGVsZXRlIHRlbXBTZWxlY3Quc29ydER1bXA7XG4gICAgICAgIHRlbXBTZWxlY3Qua2V5RnJhbWVzLmZvckVhY2goKGtleUZyYW1lOiBJS2V5RnJhbWUsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHRlbXBTZWxlY3Qua2V5RnJhbWVzW2luZGV4XS5mcmFtZSA9IGtleUZyYW1lLmZyYW1lO1xuICAgICAgICAgICAgZGVsZXRlIHRlbXBTZWxlY3Qua2V5RnJhbWVzW2luZGV4XS5vZmZzZXRGcmFtZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlbXBTZWxlY3Quc29ydER1bXAgPSBzb3J0S2V5c1RvVHJlZU1hcCh0ZW1wU2VsZWN0LmtleUZyYW1lcyk7XG4gICAgICAgIHRlbXBTZWxlY3Qua2V5RnJhbWVzLnNvcnQoKGEsIGIpID0+IGEuZnJhbWUgLSBiLmZyYW1lKTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gdGVtcFNlbGVjdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmuJDov5vnmoTmuIXnqbrlvZPliY3pgInkuK3nmoTmlbDmja5cbiAgICAgKi9cbiAgICBwdWJsaWMgY2xlYXJTZWxlY3REYXRhKCkge1xuICAgICAgICBpZiAodGhpcy52bS5zZWxlY3RFdmVudEluZm8gfHwgdGhpcy52bS5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLnZtLnNlbGVjdEV2ZW50SW5mbyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnZtLnNlbGVjdEtleUluZm8gPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIHRoaXMudm0uc2VsZWN0UHJvcGVydHkgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IG51bGw7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmi7fotJ3lvZPliY3pgInkuK3kv6Hmga9cbiAgICAgKi9cbiAgICBwdWJsaWMgY29weSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNMb2NrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy52bS5zZWxlY3RFdmVudEluZm8gJiYgIXRoaXMudm0ubWFza1BhbmVsKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5RXZlbnRzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5RW1iZWRkZWRQbGF5ZXJEdW1wID0gdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8ubWFwKChpbmZvKSA9PiB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGluZm8sIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5S2V5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUVtYmVkZGVkUGxheWVyRHVtcCA9IHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLm1hcCgoaW5mbykgPT4gdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChpbmZvLCBmYWxzZSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNvcHlFdmVudHMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZtLnNlbGVjdFByb3BlcnR5KSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmNvcHlQcm9wKHRoaXMudm0uc2VsZWN0UHJvcGVydHkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0ZWRJZCkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5jb3B5Tm9kZURhdGEoW2FuaW1hdGlvbkN0cmwubm9kZXNEdW1wIS51dWlkMnBhdGhbdGhpcy52bS5zZWxlY3RlZElkXV0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog57KY6LS05b2T5YmN57O757uf5aSN5Yi25L+h5oGv77yM6LCD55So55qEIGN0cmwg57KY6LS05o6l5Y+j56ys5LqM5Liq5Y+C5pWw6YO95piv5Y+v6YCJ55qE77yM5L2G5piv5Li65LqG5LyY5YWI5Y+W5Ymq6LS05p2/5YaF55qE5pWw5o2u77yM6ZyA6KaB5Lyg6YCS56ys5LqM5Liq5Y+C5pWwXG4gICAgICovXG4gICAgcHVibGljIHBhc3RlKCkge1xuICAgICAgICBpZiAodGhpcy5pc0xvY2spIHtcbiAgICAgICAgICAgIC8vIOmqqOmqvOWKqOeUu+WFgeiuuOW/q+aNt+mUruWkjeWItueymOi0tFxuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkN0cmwuY29weUV2ZW50SW5mbyAmJiB0aGlzLnZtLmFuaW1hdGlvbk1vZGUgJiYgIXRoaXMudm0ubWFza1BhbmVsKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZUV2ZW50KHRoaXMudm0uY3VycmVudEZyYW1lLCBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2V2ZW50JykpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNvcHlFbWJlZGRlZFBsYXllckR1bXApIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlRW1iZWRkZWRQbGF5ZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudm0uY3VycmVudEZyYW1lLFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2VtYmVkZGVkUGxheWVyJyksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNvcHlLZXlJbmZvKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLnZtLmN1cnJlbnRGcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IHRoaXMudm0uY29tcHV0ZVNlbGVjdFBhdGgsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2tleScpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNvcHlFbWJlZGRlZFBsYXllckR1bXApIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVFbWJlZGRlZFBsYXllcihcbiAgICAgICAgICAgICAgICB0aGlzLnZtLmN1cnJlbnRGcmFtZSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2VtYmVkZGVkUGxheWVyJyksXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFuaW1hdGlvbkN0cmwuY29weUV2ZW50SW5mbykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZUV2ZW50KHRoaXMudm0uY3VycmVudEZyYW1lLCBhbmltYXRpb25DdHJsLmdldENsaXBCb2FyZERhdGEoJ2V2ZW50JykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudm0uc2VsZWN0UHJvcGVydHkgJiYgYW5pbWF0aW9uQ3RybC5jb3B5UHJvcEluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVQcm9wKHRoaXMudm0uc2VsZWN0UHJvcGVydHksIGFuaW1hdGlvbkN0cmwuZ2V0Q2xpcEJvYXJkRGF0YSgncHJvcCcpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZtLnNlbGVjdGVkSWQgJiZcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVOb2RlRGF0YShhbmltYXRpb25DdHJsLm5vZGVzRHVtcCEudXVpZDJwYXRoW3RoaXMudm0uc2VsZWN0ZWRJZF0sIGFuaW1hdGlvbkN0cmwuZ2V0Q2xpcEJvYXJkRGF0YSgnbm9kZScpIHx8IGFuaW1hdGlvbkN0cmwuZ2V0Q2xpcEJvYXJkRGF0YSgncHJvcCcpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDpgInkuK3nmoTlhbPplK7luKdcbiAgICAgKiBAcGFyYW0gcGFyYW1zXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZVNlbGVjdEtleShwYXJhbXM6IElTZWxlY3RLZXkpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RLZXlJbmZvICYmICFwYXJhbXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZW1wU2VsZWN0OiBJU2VsZWN0S2V5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGF0LnNlbGVjdEtleUluZm8gfHwgcGFyYW1zKSk7XG4gICAgICAgIGlmICghdGVtcFNlbGVjdC5zb3J0RHVtcCkge1xuICAgICAgICAgICAgaWYgKCFwYXJhbXMubm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZW1wU2VsZWN0LnNvcnREdW1wID0ge307XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBub2RlUGF0aCwgcHJvcCB9ID0gcGFyYW1zO1xuICAgICAgICBjb25zdCBwYXRoID0gbm9kZVBhdGggKyBwcm9wO1xuICAgICAgICBpZiAoKCF0ZW1wU2VsZWN0LnNvcnREdW1wW3BhdGhdICYmICFwYXJhbXMua2V5RnJhbWVzLmxlbmd0aCkgfHwgIXByb3ApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmcmFtZXMgPSBwYXJhbXMua2V5RnJhbWVzLm1hcCgocGFyYW06IElTZWxlY3RQYXJhbSkgPT4gcGFyYW0uZnJhbWUpIHx8IFtdO1xuICAgICAgICB0ZW1wU2VsZWN0LnNvcnREdW1wW3BhdGhdID0ge1xuICAgICAgICAgICAga2V5RnJhbWVzOiBwYXJhbXMua2V5RnJhbWVzLFxuICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgICAgIG5vZGVQYXRoLFxuICAgICAgICAgICAgZnJhbWVzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghcGFyYW1zLmtleUZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0ZW1wU2VsZWN0LnNvcnREdW1wW3BhdGhdO1xuICAgICAgICB9XG4gICAgICAgIGxldCBrZXlGcmFtZXM6IElLZXlGcmFtZURhdGFbXSA9IFtdO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRlbXBTZWxlY3Quc29ydER1bXApLm1hcCgocGF0aDogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gdGVtcFNlbGVjdC5zb3J0RHVtcCFbcGF0aF07XG4gICAgICAgICAgICBpZiAoIWl0ZW0ua2V5RnJhbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0ZW1wU2VsZWN0LnNvcnREdW1wIVtwYXRoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtleUZyYW1lcyA9IGtleUZyYW1lcy5jb25jYXQoaXRlbS5rZXlGcmFtZXMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVtcFNlbGVjdC5rZXlGcmFtZXMgPSBrZXlGcmFtZXMuc29ydCgoYTogSUtleUZyYW1lRGF0YSwgYjogSUtleUZyYW1lRGF0YSkgPT4gYS5mcmFtZSAtIGIuZnJhbWUpO1xuICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8gPSB0ZW1wU2VsZWN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeafkOS4quWFs+mUruW4p+WcqOmAieS4reeahOWFs+mUruW4p+WGheeahOS9jee9rlxuICAgICAqIEBwYXJhbSBwYXJhbVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRQb3NpdGlvbkF0U2VsZWN0KHBhcmFtOiBJU2VsZWN0UGFyYW0pIHtcbiAgICAgICAgaWYgKCF0aGlzLnZtLnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy52bS5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcyEuZmluZEluZGV4KChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnByb3AgPT09IHBhcmFtLnByb3AgJiYgaXRlbS5mcmFtZSA9PT0gcGFyYW0uZnJhbWUgJiYgaXRlbS5ub2RlUGF0aCA9PT0gcGFyYW0ubm9kZVBhdGg7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOenu+mZpOmDqOWIhumAieS4reeahOWFs+mUruW4p1xuICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlU2VsZWN0S2V5KHBhcmFtczogSVNlbGVjdFBhcmFtW10pIHtcbiAgICAgICAgaWYgKCF0aGlzLnZtLnNlbGVjdEtleUluZm8gfHwgIXRoaXMudm0uc2VsZWN0S2V5SW5mby5rZXlGcmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdEtleUluZm86IElTZWxlY3RLZXkgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMudm0uc2VsZWN0S2V5SW5mbykpO1xuICAgICAgICB0aGlzLnZtLnNlbGVjdEtleUluZm8ua2V5RnJhbWVzIS5mb3JFYWNoKChpbmZvOiBJU2VsZWN0UGFyYW0sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJhbXMuZmluZCgocGFyYW0pID0+IExvZGFzaC5pc0VxdWFsKGluZm8sIHBhcmFtKSkpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RLZXlJbmZvLmtleUZyYW1lcyEuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RLZXlJbmZvLmtleUZyYW1lcyEuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRlbGV0ZSBzZWxlY3RLZXlJbmZvLnNvcnREdW1wO1xuICAgICAgICB0aGlzLnZtLnNlbGVjdEtleUluZm8gPSBzZWxlY3RLZXlJbmZvO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliKDpmaTpgInkuK3nmoTltYzlhaXmkq3mlL7lmajmlbDmja5cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBkZWxldGVTZWxlY3RlRW1iZWRkZWRQbGF5ZXJzKCkge1xuICAgICAgICBpZiAoIXRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uczogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5mb3JFYWNoKChpbmZvKSA9PiB7XG4gICAgICAgICAgICBvcGVyYXRpb25zLnB1c2goZGVsZXRlRW1iZWRkZWRQbGF5ZXIodGhpcy52bS5jdXJyZW50Q2xpcCwgdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChpbmZvLCBmYWxzZSkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvID0gbnVsbDtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJywgRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJykpO1xuICAgICAgICByZXR1cm4gYXdhaXQgSUFwcGx5T3BlcmF0aW9uKG9wZXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaJk+W8gOafkOS4gOW4p+eahOS6i+S7tuW4p+e8lui+keeVjOmdolxuICAgICAqIEBwYXJhbSBmcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBvcGVuRXZlbnRFZGl0b3IoZnJhbWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZtLmVkaXRFdmVudEZyYW1lID0gZnJhbWU7XG4gICAgICAgIHRoaXMudm0ubWFza1BhbmVsID0gJ2V2ZW50JztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63kuovku7bnvJbovpHnlYzpnaJcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xvc2VNYXNrUGFuZWwoKSB7XG4gICAgICAgIHRoaXMudm0ubWFza1BhbmVsID0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6+572u5b2T5YmN6ZyA6KaB56e75Yqo55qE6IqC54K55pWw5o2uXG4gICAgICogQHBhcmFtIG5vZGVQYXRoXG4gICAgICovXG4gICAgcHVibGljIHNldE1vdmVQYXRoKG5vZGVQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gVE9ETyDov5nlupTor6XmmK/kuIDkuKrkuK3pl7TnirbmgIHvvIzkuI3pnIDopoHmnIDlpJblsYLnn6XmmZPmjqfliLbvvJ9cbiAgICAgICAgdGhpcy52bS5tb3ZlTm9kZVBhdGggPSBub2RlUGF0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlj5bmtojnp7vliqhcbiAgICAgKi9cbiAgICBwdWJsaWMgY2FuY2VsTW92ZU5vZGUoKSB7XG4gICAgICAgIHRoaXMudm0ubW92ZU5vZGVQYXRoID0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5p+Q5Liq6IqC54K5XG4gICAgICogQHBhcmFtIG5vZGVQYXRoXG4gICAgICogQHBhcmFtIGN0cmwg5piv5ZCm5oyJ5LiLIGN0cmxcbiAgICAgKi9cbiAgICBwdWJsaWMgc2VsZWN0Tm9kZShub2RlUGF0aDogc3RyaW5nLCBjdHJsID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLm5vZGVzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCB1dWlkcyA9IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLnBhdGgydXVpZFtub2RlUGF0aF07XG4gICAgICAgIGlmICh1dWlkcykge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0VXVpZHMgPSBbdXVpZHNbMF1dO1xuICAgICAgICAgICAgaWYgKHNlbGVjdFV1aWRzWzBdICE9PSB0aGF0LnNlbGVjdGVkSWQgJiYgY3RybCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdFV1aWRzLnB1c2godGhhdC5zZWxlY3RlZElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQuc2VsZWN0ZWRJZCA9IHV1aWRzWzBdO1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RQYXRoID0gJyc7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVwZGF0ZSgnbm9kZScsIHNlbGVjdFV1aWRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOS4ouWkseiKgueCueaXtueahOWkhOeQhumAu+i+kVxuICAgICAgICAgICAgdGhhdC5zZWxlY3RQYXRoID0gbm9kZVBhdGg7XG4gICAgICAgICAgICB0aGF0LnByb3BlcnRpZXMgPSB0aGlzLmNhbGNQcm9wZXJ0eSgpO1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RlZElkID0gJyc7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdGVkSWRzLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlvIDlp4vnp7vliqjmn5DkuKroioLngrkgVE9ETyDlj6rpnIDopoHlpI3liLbnspjotLToioLngrnlip/og73ljbPlj69cbiAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGFydE1vdmVOb2RlKHBhdGg6IHN0cmluZykge1xuICAgICAgICB0aGlzLnZtLm1vdmVOb2RlUGF0aCA9IHBhdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6w5b2V5byA5aeL5ouW5ou955qE5YWz6ZSu5bin5L+h5oGvXG4gICAgICogQHBhcmFtIGRyYWdLZXlzSW5mb1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGFydERyYWdLZXkoZHJhZ0tleXNJbmZvOiBJU3RhcnREcmFnS2V5IHwgbnVsbCwgY3RybCA9IGZhbHNlKSB7XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAgfHwgIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmIChkcmFnS2V5c0luZm8pIHtcbiAgICAgICAgICAgIGRyYWdLZXlzSW5mby5rZXlGcmFtZXMuc29ydCgoYSwgYikgPT4gYS5mcmFtZSAtIGIuZnJhbWUpO1xuICAgICAgICAgICAgZHJhZ0tleXNJbmZvLnNvcnREdW1wID0gc29ydEtleXNUb1RyZWVNYXAoZHJhZ0tleXNJbmZvLmtleUZyYW1lcyk7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RQYXJhbXM6IElLZXlGcmFtZURhdGEgPSBkcmFnS2V5c0luZm8ua2V5RnJhbWVzWzBdO1xuICAgICAgICAgICAgaWYgKHNlbGVjdFBhcmFtcy5ub2RlUGF0aCAhPT0gdGhhdC5jb21wdXRlU2VsZWN0UGF0aCkge1xuICAgICAgICAgICAgICAgIC8vIOmAieS4reiKgueCueeahOi3r+W+hOS4juW9k+WJjei3r+W+hOS4jeWQjO+8jOabtOaWsCBzZWxlY3RlZElkIOS4uuaUuei3r+W+hOS4i+eahOesrOS4gOS4quiKgueCuSB1dWlkXG4gICAgICAgICAgICAgICAgLy8g5rOo5oSP5aSE55CG5ZCM5ZCN6IqC54K555qE6YCJ5Lit6Zeu6aKYXG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZHMgPSBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5wYXRoMnV1aWRbc2VsZWN0UGFyYW1zLm5vZGVQYXRoXTtcbiAgICAgICAgICAgICAgICBpZiAodXVpZHNbMF0gIT09IHRoYXQuc2VsZWN0ZWRJZCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgdGhhdC5zZWxlY3RlZElkKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB1dWlkc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIOabtOaWsOW9k+WJjemAieS4reiKgueCuVxuICAgICAgICAgICAgICAgICAgICAvLyBzZWxlY3RlZElkIOWBmuS6hiB3YXRjaO+8jOabtOaNoumAieS4reiKgueCueWQju+8jOa4heepuuS5i+WJjeeahOmAieS4reWxnuaAp+i9qOmBk+S/oeaBr++8jOWboOiAjOmcgOimgeWFiOS/ruaUuVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdGVkSWQgPSB1dWlkc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMudm0uc2VsZWN0UHJvcGVydHkgfHwgdGhpcy52bS5zZWxlY3RQcm9wZXJ0eS5wcm9wICE9PSBzZWxlY3RQYXJhbXMucHJvcCB8fCB0aGlzLnZtLnNlbGVjdFByb3BlcnR5Lm5vZGVQYXRoICE9PSBzZWxlY3RQYXJhbXMubm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wRGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFtzZWxlY3RQYXJhbXMubm9kZVBhdGhdW3NlbGVjdFBhcmFtcy5wcm9wXTtcbiAgICAgICAgICAgICAgICAvLyAyLiDmm7TmlrDlvZPliY3pgInkuK3lsZ7mgKfovajpgZPkv6Hmga9cbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlU2VsZWN0UHJvcGVydHkoe1xuICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogc2VsZWN0UGFyYW1zLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBwcm9wOiBzZWxlY3RQYXJhbXMucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgY2xpcFV1aWQ6IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBpc0N1cnZlU3VwcG9ydDogcHJvcERhdGEuaXNDdXJ2ZVN1cHBvcnQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RLZXlVcGRhdGVGbGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyAzLiDmm7TmlrDlvZPliY3pgInkuK3nmoTlhbPplK7luKfkv6Hmga9cbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gZHJhZ0tleXNJbmZvO1xuICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdEtleSsrO1xuICAgICAgICAvLyDmjInkuIsgQ3RybCDml7bkuI3lhYHorrjmi5bmi71cbiAgICAgICAgaWYgKGN0cmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ2tleSc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05paw6YCJ5Lit55qE5bGe5oCn5L+h5oGvXG4gICAgICogQHBhcmFtIGRyYWdQcm9wZXJ0eVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyB1cGRhdGVTZWxlY3RQcm9wZXJ0eShkcmFnUHJvcGVydHk6IHsgbm9kZVBhdGg6IHN0cmluZzsgcHJvcDogc3RyaW5nOyBjbGlwVXVpZDogc3RyaW5nOyBpc0N1cnZlU3VwcG9ydDogYm9vbGVhbjsgbWlzc2luZz86IGJvb2xlYW4gfSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKGRyYWdQcm9wZXJ0eS5jbGlwVXVpZCAhPT0gdGhpcy52bS5jdXJyZW50Q2xpcCB8fCBkcmFnUHJvcGVydHkubm9kZVBhdGggIT09IHRoaXMudm0uY29tcHV0ZVNlbGVjdFBhdGgpIHtcbiAgICAgICAgICAgIC8vIOW9k+WJjemAieS4reWxnuaAp+i9qOmBk+eahOS/oeaBr+S4jeWxnuS6juW9k+WJjee8lui+keeahCBjbGlwIOWImeS4jeafpeivouS/oeaBr1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCBJZ2V0UHJvcFZhbHVlQXRGcmFtZShkcmFnUHJvcGVydHkuY2xpcFV1aWQsIGRyYWdQcm9wZXJ0eS5ub2RlUGF0aCwgZHJhZ1Byb3BlcnR5LnByb3AsIHRoYXQuY3VycmVudEZyYW1lKTtcbiAgICAgICAgaWYgKCFkdW1wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5zZWxlY3RQcm9wZXJ0eSA9IE9iamVjdC5hc3NpZ24oZHJhZ1Byb3BlcnR5LCB7XG4gICAgICAgICAgICBkdW1wLFxuICAgICAgICAgICAgdHlwZToge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBkdW1wLnR5cGUsXG4gICAgICAgICAgICAgICAgZXh0ZW5kczogZHVtcC5leHRlbmRzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoYXQubGlnaHRDdXJ2ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6w5b2V5Yia5byA5aeL5ouW5Yqo55qE5LqL5Lu25bin5L+h5oGvXG4gICAgICogQHBhcmFtIGRyYWdFdmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBzdGFydERyYWdFdmVudChkcmFnRXZlbnQ6IElTdGFydERyYWdFdmVudCwgaGFzQ3RybCA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvID0gZHJhZ0V2ZW50O1xuICAgICAgICAvLyDmjInkuIsgQ3RybCDplK7ml7bkuI3lhYHorrjnp7vliqhcbiAgICAgICAgaWYgKCFoYXNDdHJsKSB7XG4gICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ2V2ZW50JztcbiAgICAgICAgfSBlbHNlIGlmIChGbGFncy5tb3VzZURvd25OYW1lID09PSAnZXZlbnQnKSB7XG4gICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmm7TmlrDmj5DnpLrlsI/nuqLnur/nmoTkvY3nva7kv6Hmga/mj5DnpLpcbiAgICAgKiBAcGFyYW0geFxuICAgICAqIEBwYXJhbSB5XG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZU1vdXNlRnJhbWUocG9pbnQ/OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyBmcmFtZT86IG51bWJlciB9LCBvZmZzZXRGcmFtZT86IG51bWJlcikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCFwb2ludCB8fCAoIXBvaW50LnggJiYgIXBvaW50LnkpKSB7XG4gICAgICAgICAgICB0aGF0Lm1vdmVJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBncmlkQ3RybC5wYWdlVG9DdHJsKHBvaW50LngsIHBvaW50LnkpO1xuICAgICAgICBjb25zdCBmcmFtZSA9IHBvaW50LmZyYW1lIHx8IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKHBvaW50LngpO1xuICAgICAgICAvLyDlhbPplK7luKfnmoTljYrlvoTlpKflsI/mmK8gNVxuICAgICAgICBpZiAoIXRoYXQubW92ZUluZm8pIHtcbiAgICAgICAgICAgIHRoYXQubW92ZUluZm8gPSB7XG4gICAgICAgICAgICAgICAgZnJhbWUsXG4gICAgICAgICAgICAgICAgeDogcmVzdWx0LnggKyA1LFxuICAgICAgICAgICAgICAgIHk6IHJlc3VsdC55ICsgNSxcbiAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZTogb2Zmc2V0RnJhbWUgfHwgMCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0Lm1vdmVJbmZvLmZyYW1lID0gZnJhbWU7XG4gICAgICAgICAgICB0aGF0Lm1vdmVJbmZvLnggPSByZXN1bHQueCArIDU7XG4gICAgICAgICAgICB0aGF0Lm1vdmVJbmZvLnkgPSByZXN1bHQueSArIDU7XG4gICAgICAgICAgICB0aGF0Lm1vdmVJbmZvLm9mZnNldEZyYW1lID0gb2Zmc2V0RnJhbWUgfHwgMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWxleW8gFxuICAgICAqIEBwYXJhbSBwcm9wXG4gICAgICogQHBhcmFtIGV4cGFuZFxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVQcm9wRXhwYW5kU3RhdGUocHJvcDogc3RyaW5nLCBleHBhbmQ6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIHRoYXQuZXhwYW5kSW5mb1twcm9wXSA9IGV4cGFuZDtcbiAgICAgICAgY29uc3QgcGFydEtleXMgPSB0aGF0LnByb3BlcnRpZXMhW3Byb3BdLnBhcnRLZXlzO1xuICAgICAgICBpZiAoIXBhcnRLZXlzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0FuaW1hdGlvbiBFZGl0b3JdIENhbid0IGdldCBwYXJ0S2V5cyBvZiBwcm9wKCR7cHJvcH0pYCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFydEtleXMuZm9yRWFjaCgocHJvcDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB0aGF0LnByb3BlcnRpZXMhW3Byb3BdLmhpZGRlbiA9ICFleHBhbmQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoYXQucHJvcGVydGllcyA9IHRoaXMuY2FsY1Byb3BlcnR5KCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyDmm7TmlrDpgInkuK3lhbPplK7luKfmlbDmja5cbiAgICAgICAgICAgIHRoYXQudXBkYXRlU2VsZWN0S2V5Kys7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDlr7nml7bpl7TovbTnmoTlpITnkIbmlrnms5UgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvKipcbiAgICAgKiDorqnmjIflrprlhbPplK7luKflnKjnlLvluIPljLrln5/mmL7npLpcbiAgICAgKiDmjIflrprlhbPplK7luKfotoXlh7rnlLvluIPlt6bovrnnlYzkvJrlsIblhbborr7nva7lnKjnlLvluIPlj7PovrnnlYxcbiAgICAgKiDmjIflrprlhbPplK7luKfotoXlh7rnlLvluIPlj7PovrnnlYzkvJrlsIblhbborr7nva7lnKjnlLvluIPlt6bovrnnlYxcbiAgICAgKiBAcGFyYW0gZnJhbWVcbiAgICAgKi9cbiAgICBzaG93RnJhbWVJbkdyaWQoZnJhbWU6IG51bWJlcikge1xuICAgICAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGdyaWRDdHJsLmdldEZyYW1lUmFuZygpO1xuICAgICAgICAvLyDotoXov4fovrnnlYxcbiAgICAgICAgaWYgKGZyYW1lID49IGVuZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRHcmlkSGVhZGVyRnJhbWUoZnJhbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGZyYW1lIDw9IHN0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLnNldEdyaWRGb290ZXJGcmFtZShmcmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIbnlLvluIPnp7vliqjliLDlsIbmjIflrprluKfmlL7nva7lnKjpppbkvY3nmoTnlLvpnaJcbiAgICAgKiBAcGFyYW0gZnJhbWVcbiAgICAgKi9cbiAgICBzZXRHcmlkSGVhZGVyRnJhbWUoZnJhbWU6IG51bWJlcikge1xuICAgICAgICBjb25zdCB7IHN0YXJ0IH0gPSBncmlkQ3RybC5nZXRGcmFtZVJhbmcoKTtcbiAgICAgICAgY29uc3Qgc3RhcnRQb3NpdGlvbiA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoc3RhcnQpO1xuICAgICAgICB0aGlzLm1vdmVUaW1lTGluZShzdGFydFBvc2l0aW9uIC0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhmcmFtZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhueUu+W4g+enu+WKqOWIsOWwhuaMh+WumuW4p+aUvue9ruWcqOacq+WwvueahOeUu+mdolxuICAgICAqIEBwYXJhbSBmcmFtZVxuICAgICAqL1xuICAgIHNldEdyaWRGb290ZXJGcmFtZShmcmFtZTogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHsgZW5kIH0gPSBncmlkQ3RybC5nZXRGcmFtZVJhbmcoKTtcbiAgICAgICAgY29uc3QgZW5kUG9zaXRpb24gPSBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGVuZCk7XG4gICAgICAgIHRoaXMubW92ZVRpbWVMaW5lKGVuZFBvc2l0aW9uIC0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhmcmFtZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWvueaVtOS4quaXtumXtOi9tOi/m+ihjOenu+WKqFxuICAgICAqIEBwYXJhbSBkZWx0YSAo56e75Yqo6Led56a7KVxuICAgICAqL1xuICAgIG1vdmVUaW1lTGluZShkZWx0YTogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBncmlkQ3RybC5ncmlkIS50cmFuc2ZlclgoZGVsdGEpO1xuXG4gICAgICAgIHRoaXMudm0udHJhbnNmb3JtRXZlbnQuZW1pdFVwZGF0ZSgnZ3JpZCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWvueaVtOS4quaXtumXtOi9tOi/m+ihjOe8qeaUvlxuICAgICAqIEBwYXJhbSBkZWx0YSDnvKnmlL7ml7bpvKDmoIfmu5rliqjot53nprvvvIznlKjlhbforqHnrpfnvKnmlL7lgI3mlbBcbiAgICAgKiBAcGFyYW0geCDnvKnmlL7kuK3lv4PngrlcbiAgICAgKi9cbiAgICBzY2FsZVRpbWVMaW5lQXQoZGVsdGE6IG51bWJlciwgeDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCBzY2FsZSA9IHNtb290aFNjYWxlKGRlbHRhLCBncmlkQ3RybC5zY2FsZSk7XG4gICAgICAgIGlmICgoZGVsdGEgPCAwICYmIHNjYWxlIDw9IGdyaWRDdHJsLmdyaWQhLnhNaW5TY2FsZSkgfHwgKGRlbHRhID4gMCAmJiBzY2FsZSA+PSBncmlkQ3RybC5ncmlkIS54TWF4U2NhbGUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZ3JpZEN0cmwuZ3JpZCEueEF4aXNTY2FsZUF0KHgsIHNjYWxlKTsgLy8g5Z2Q5qCH55S75biD5pu05pS5XG5cbiAgICAgICAgdGhpcy52bS50cmFuc2Zvcm1FdmVudC5lbWl0VXBkYXRlKCdncmlkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5oyJ54Wn5p+Q5Liq57yp5pS+5q+U5L6L5a+55pW05Liq5pe26Ze06L206L+b6KGM57yp5pS+XG4gICAgICogQHBhcmFtIHNjYWxlTnVtIOe8qeaUvuavlOS+i1xuICAgICAqL1xuICAgIHNjYWxlVGltZUxpbmVXaXRoKHNjYWxlTnVtOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG5cbiAgICAgICAgY29uc3Qgc2NhbGUgPSBjbGFtcChzY2FsZU51bSwgZ3JpZEN0cmwuZ3JpZCEueE1pblNjYWxlLCBncmlkQ3RybC5ncmlkIS54TWF4U2NhbGUpO1xuICAgICAgICBncmlkQ3RybC5ncmlkIS54QXhpc1NjYWxlID0gc2NhbGU7XG5cbiAgICAgICAgdGhpcy52bS50cmFuc2Zvcm1FdmVudC5lbWl0VXBkYXRlKCdncmlkJyk7XG4gICAgfVxuXG4gICAgLy8g5YWz6ZSu5bin55qE6Ieq5Yqo56e75YqoXG4gICAgcnVuUG9pbnRlcigpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIHRoaXMuYW5pUGxheVRhc2sgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoYXQuYW5pbWF0aW9uU3RhdGUgPT09ICdwbGF5JyAmJiB0aGF0LmFuaW1hdGlvbk1vZGUpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNoZWNrQ3VycmVudFRpbWUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1blBvaW50ZXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmlQbGF5VGFzayAmJiBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuaVBsYXlUYXNrKTtcbiAgICAgICAgICAgICAgICAvLyDpooTpmLLmlbDmja7mnKrlrozmlbTmm7TmlrDvvIzlpJrmn6Xor6LkuIDmrKFcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNoZWNrQ3VycmVudFRpbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqIOiuoeeul+aOp+WItuadhiAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDlvZPliY3lhbPplK7luKflpITnkIbnm7jlhbMgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICAvLyDmm7TmlLnlvZPliY3lhbPplK7luKdcbiAgICBzZXRDdXJyZW50RnJhbWUoZnJhbWU6IG51bWJlcikge1xuICAgICAgICAvLyDmm7TmlrDlvZPliY3lhbPplK7luKdcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmIChmcmFtZSA8IDApIHtcbiAgICAgICAgICAgIGZyYW1lID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGF0LmN1cnJlbnRGcmFtZSA9IGZyYW1lO1xuICAgICAgICBpZiAoZnJhbWUgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChncmlkQ3RybC5ncmlkICYmIGdyaWRDdHJsLmdyaWQueEF4aXNPZmZzZXQgIT09IGdyaWRDdHJsLnN0YXJ0T2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVGltZUxpbmUoZ3JpZEN0cmwuc3RhcnRPZmZzZXQgLSBncmlkQ3RybC5ncmlkLnhBeGlzT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNob3dGcmFtZUluR3JpZChmcmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05paw5b2T5YmN5YWz6ZSu5bin5L2N572uXG4gICAgICogQHBhcmFtIGZyYW1lXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZUN1cnJlbnRGcmFtZShmcmFtZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc2V0Q3VycmVudEZyYW1lKGZyYW1lKTtcbiAgICAgICAgY29uc3QgdGltZSA9IGZyYW1lVG9UaW1lKGZyYW1lLCB0aGlzLnZtLnNhbXBsZSk7XG4gICAgICAgIElzZXRDdXJFZGl0VGltZSh0aW1lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMganVtcFByZXZGcmFtZSgpIHtcbiAgICAgICAgaWYgKHRoaXMudm0uY3VycmVudEZyYW1lID4gMCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUoLS10aGlzLnZtLmN1cnJlbnRGcmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMganVtcE5leHRGcmFtZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUoKyt0aGlzLnZtLmN1cnJlbnRGcmFtZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGp1bXBGaXJzdEZyYW1lKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRGcmFtZSgwKTtcbiAgICB9XG5cbiAgICBwdWJsaWMganVtcExhc3RGcmFtZSgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUodGhpcy52bS5sYXN0RnJhbWVJbmZvLmZyYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkuIvkuIDmraVcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgbmV4dFN0ZXAoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAodGhpcy5pc0xvY2spIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVTZWxlY3RLZXlzKDEsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVTZWxlY3RFbWJlZGRlZFBsYXllcnMoMSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhhdC5zZWxlY3RFdmVudEluZm8pIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubW92ZVNlbGVjdEV2ZW50cygxLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmp1bXBOZXh0RnJhbWUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkuIrkuIDmraVcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcHJldlN0ZXAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTG9jaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAodGhhdC5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVTZWxlY3RLZXlzKC0xLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVNlbGVjdEVtYmVkZGVkUGxheWVycygtMSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0RXZlbnRJbmZvKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLm1vdmVTZWxlY3RFdmVudHMoLTEsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuanVtcFByZXZGcmFtZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi3s+i9rOWIsOS4i+S4gOWFs+mUruW4p1xuICAgICAqL1xuICAgIHB1YmxpYyBqdW1wVG9OZXh0S2V5KCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhdGhhdC5jb21wdXRlU2VsZWN0UGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBrZXlmcmFtZXMgPSBbXTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdFByb3BlcnR5KSB7XG4gICAgICAgICAgICBrZXlmcmFtZXMgPSB0aGlzLmNhbGNOb2RlRnJhbWVzKHRoYXQuY29tcHV0ZVNlbGVjdFBhdGgsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5ZnJhbWVzID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW3RoYXQuY29tcHV0ZVNlbGVjdFBhdGhdW3RoYXQuc2VsZWN0UHJvcGVydHkucHJvcF0ua2V5RnJhbWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0LmN1cnJlbnRGcmFtZSA+IGtleWZyYW1lc1trZXlmcmFtZXMubGVuZ3RoIC0gMV0uZnJhbWUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKGtleWZyYW1lc1trZXlmcmFtZXMubGVuZ3RoIC0gMV0uZnJhbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBrZXlmcmFtZXMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLmZyYW1lID4gdGhhdC5jdXJyZW50RnJhbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRGcmFtZShpdGVtLmZyYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDot7PovazliLDkuIrkuIDlhbPplK7luKdcbiAgICAgKi9cbiAgICBwdWJsaWMganVtcFRvUHJldktleSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXRoYXQuY29tcHV0ZVNlbGVjdFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQga2V5ZnJhbWVzID0gW107XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RQcm9wZXJ0eSkge1xuICAgICAgICAgICAga2V5ZnJhbWVzID0gdGhpcy5jYWxjTm9kZUZyYW1lcyh0aGF0LmNvbXB1dGVTZWxlY3RQYXRoLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleWZyYW1lcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt0aGF0LmNvbXB1dGVTZWxlY3RQYXRoXVt0aGF0LnNlbGVjdFByb3BlcnR5LnByb3BdLmtleUZyYW1lcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhhdC5jdXJyZW50RnJhbWUgPCBrZXlmcmFtZXNbMF0uZnJhbWUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKGtleWZyYW1lc1swXS5mcmFtZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IGtleWZyYW1lcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgZnJhbWUgPSBrZXlmcmFtZXNbaV0uZnJhbWU7XG4gICAgICAgICAgICBpZiAoZnJhbWUgPCB0aGF0LmN1cnJlbnRGcmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEZyYW1lKGZyYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKiog6I+c5Y2V5qCP55qE55u45YWz6YWN572uICoqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgcHVibGljIGFzeW5jIG1vdmVTZWxlY3RFbWJlZGRlZFBsYXllcnMob2Zmc2V0RnJhbWU6IG51bWJlcikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcGVyYXRpb25zOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgY29uc3QgcmVhbE9mZnNldCA9IE1hdGgubWF4KGluZm8ucmF3SW5mby5iZWdpbiArIG9mZnNldEZyYW1lLCAwKSAtIGluZm8ucmF3SW5mby5iZWdpbjtcbiAgICAgICAgICAgIC8vIOi2heWHuuS4tOeVjOeCue+8jOS4jeWPr+WGjeenu+WKqFxuICAgICAgICAgICAgaWYgKHJlYWxPZmZzZXQgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuZXdEdW1wID0ge1xuICAgICAgICAgICAgICAgIC4uLmluZm8ucmF3SW5mbyxcbiAgICAgICAgICAgICAgICBiZWdpbjogaW5mby5yYXdJbmZvLmJlZ2luICsgcmVhbE9mZnNldCxcbiAgICAgICAgICAgICAgICBlbmQ6IGluZm8ucmF3SW5mby5lbmQgKyByZWFsT2Zmc2V0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wZXJhdGlvbnMucHVzaCh1cGRhdGVFbWJlZGRlZFBsYXllcih0aGlzLnZtLmN1cnJlbnRDbGlwLCBpbmZvLnJhd0luZm8sIG5ld0R1bXApKTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oaW5mbywgdGhpcy50cmFuc0VtYmVkZGVkUGxheWVyRHVtcFRvSW5mbyhuZXdEdW1wKSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgSUFwcGx5T3BlcmF0aW9uKG9wZXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOenu+WKqOmAieS4reeahOWFs+mUruW4p1xuICAgICAqIEBwYXJhbSBvZmZzZXRGcmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBtb3ZlU2VsZWN0S2V5cyhvZmZzZXRGcmFtZTogbnVtYmVyLCBjdHJsID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOmAieS4reWFs+mUruW4p+aYr+WFtuS7lue7hOS7tiB3YXRjaCDnmoTlr7nosaHvvIzopoHlsL3ph4/kuIDmrKHmgKfigJzotYvlgLzigJ3vvIzogIzkuI3mmK/lvqrnjq/nmoTljrvorqHnrpfotYvlgLxcbiAgICAgICAgY29uc3QgdGVtcFNlbGVjdDogSVNlbGVjdEtleSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhhdC5zZWxlY3RLZXlJbmZvKSk7XG4gICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUgPSB0ZW1wU2VsZWN0Lm9mZnNldEZyYW1lIHx8IDA7XG4gICAgICAgIGNvbnN0IHsga2V5RnJhbWVzOiBrZXlGcmFtZURhdGFzIH0gPSB0ZW1wU2VsZWN0O1xuICAgICAgICBjb25zdCBmcmFtZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5RnJhbWVEYXRhcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGtleUZyYW1lRGF0YXNbaV07XG4gICAgICAgICAgICBsZXQgbmV3RnJhbWUgPSBpdGVtLmZyYW1lICsgb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICBpZiAobmV3RnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93VG9hc3QoJ2kxOG46YW5pbWF0b3IubW92ZV9rZXlfdGlwcy5jYW5fbm90X2JlX3plcm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDmlrDlhbPplK7luKfkuI3lnKjpgInkuK3nmoTlhbPplK7luKfmlbDmja7kuIrml7bvvIzpnIDopoHmoKHpqoxcbiAgICAgICAgICAgIGlmICghdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcyEuZmluZCgoaXRlbTogSUtleUZyYW1lKSA9PiBpdGVtLmZyYW1lID09PSBuZXdGcmFtZSkpIHtcbiAgICAgICAgICAgICAgICAvLyDmoKHpqozmmK/lkKbkvJropobnm5bnjrDmnInlhbPplK7luKdcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbSA9IGtleUZyYW1lRGF0YXNbaV07XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5RnJhbWVzID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW3BhcmFtLm5vZGVQYXRoXVtwYXJhbS5wcm9wXS5rZXlGcmFtZXM7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGtleUZyYW1lcy5maW5kKChpdGVtOiBJS2V5RnJhbWUpID0+IGl0ZW0uZnJhbWUgPT09IG5ld0ZyYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnm67liY3kuI3mlK/mjIEgY3RybC9jbWQg6Lez6L+H77yM5b+r5o236ZSu5raI5oGv5LiN5pSv5oyB5Lyg6YCSIGV2ZW5lXG4gICAgICAgICAgICAgICAgICAgIC8vIGxldCBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChjdHJsICYmICF0aGlzLmhhc1Nob3dTdGljaykge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgbWVzc2FnZSA9IEVkaXRvci5JMThuLnQoJ2FuaW1hdG9yLm1vdmVfa2V5X3RpcHMubW92ZV93aXRoX2N0cmwnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gfSBlbHNlIGlmIChjdHJsICYmIHRoaXMuaGFzU2hvd1N0aWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBtZXNzYWdlID0gRWRpdG9yLkkxOG4udCgnYW5pbWF0b3IubW92ZV9rZXlfdGlwcy5tb3ZlX2tleXNfd2l0aF9jdHJsJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBtZXNzYWdlID0gRWRpdG9yLkkxOG4udCgnYW5pbWF0b3IubW92ZV9rZXlfdGlwcy5zaG91bGRfbW92ZV9rZXlzX3dpdGhfY3RybCcpO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuc2hvd1RvYXN0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwgfHwgdGhpcy5oYXNTaG93U3RpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0g5aSa6YCJ5YWz6ZSu5bin5bm25LiU5Lya6KaG55uW5YW25LuW5YWz6ZSu5binLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSDljZXpgInlhbPplK7luKflubbkuJTmsqHmnInmjInkuIsgQ3RybCDkvJropobnm5blhbbku5blhbPplK7luKfml7bvvIxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOebtOaOpemAgOWHuuS4jeWFgeiuuOe7p+e7reenu+WKqFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g6Lez6L+H5YWz6ZSu5bin5pe277yM55u05o6l6K6h566X5aW9IG9mZnNldEZyYW1lXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lID0gb2Zmc2V0RnJhbWUgPiAwID8gb2Zmc2V0RnJhbWUgKyAxIDogb2Zmc2V0RnJhbWUgLSAxO1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmFtZSA9IGl0ZW0uZnJhbWUgKyBvZmZzZXRGcmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmcmFtZXMucHVzaChuZXdGcmFtZSk7XG4gICAgICAgICAgICBpdGVtLmZyYW1lID0gbmV3RnJhbWU7XG4gICAgICAgICAgICBpdGVtLnggPSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGl0ZW0uZnJhbWUpIC0gZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZyYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmcmFtZXMuc29ydCgoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IGEgLSBiKTtcbiAgICAgICAgaWYgKG9mZnNldEZyYW1lID4gMCkge1xuICAgICAgICAgICAgdGhpcy5zaG93RnJhbWVJbkdyaWQoZnJhbWVzW2ZyYW1lcy5sZW5ndGggLSAxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3dGcmFtZUluR3JpZChmcmFtZXNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBTZWxlY3QuY3RybCA9IGN0cmw7XG4gICAgICAgIC8vIOmbhuS9k+enu+WKqOebuOWQjOWFs+mUruW4p+aXtu+8jOivpSBvZmZzZXRGcmFtZSDmiY3mnInmlYhcbiAgICAgICAgdGVtcFNlbGVjdC5vZmZzZXRGcmFtZSArPSBvZmZzZXRGcmFtZTtcbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gdGVtcFNlbGVjdDtcbiAgICAgICAgLy8gYW5pbWF0aW9uQ3RybC5jYWxsQnlEZWJvdW5jZSgnbW92ZUtleXMnKTtcbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uQ3RybC5tb3ZlS2V5cygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOenu+WKqOmAieS4reeahOS6i+S7tuWFs+mUruW4pyBUT0RPIOi9rOS5ieWIsCBDdHJsXG4gICAgICogQHBhcmFtIG9mZnNldEZyYW1lXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG1vdmVTZWxlY3RFdmVudHMob2Zmc2V0RnJhbWU6IG51bWJlciwgY3RybDogYm9vbGVhbikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgeyBkYXRhLCBmcmFtZXMgfSA9IHRoYXQuc2VsZWN0RXZlbnRJbmZvITtcbiAgICAgICAgY29uc3QgbW92ZWRGcmFtZXM6IG51bWJlcltdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBsZXQgbmV3RnJhbWUgPSBpdGVtLmZyYW1lICsgb2Zmc2V0RnJhbWU7XG4gICAgICAgICAgICBpZiAobmV3RnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93VG9hc3QoJ2kxOG46YW5pbWF0b3IubW92ZV9rZXlfdGlwcy5jYW5fbm90X2JlX3plcm8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWZyYW1lcy5pbmNsdWRlcyhuZXdGcmFtZSkpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLmZyYW1lID09PSBuZXdGcmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y2z5bCG6KaG55uW5paw5YWz6ZSu5binXG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHJsICYmIGZyYW1lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnaTE4bjphbmltYXRvci5tb3ZlX2tleV90aXBzLm1vdmVfd2l0aF9jdHJsJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdHJsICYmIGZyYW1lcy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnaTE4bjphbmltYXRvci5tb3ZlX2tleV90aXBzLm1vdmVfa2V5c193aXRoX2N0cmwnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICdpMThuOmFuaW1hdG9yLm1vdmVfa2V5X3RpcHMuc2hvdWxkX21vdmVfa2V5c193aXRoX2N0cmwnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd1RvYXN0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwgfHwgZnJhbWVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWUgPSBvZmZzZXRGcmFtZSA+IDAgPyBvZmZzZXRGcmFtZSArIDEgOiBvZmZzZXRGcmFtZSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIG5ld0ZyYW1lID0gaXRlbS5mcmFtZSArIG9mZnNldEZyYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1vdmVkRnJhbWVzLnB1c2gobmV3RnJhbWUpO1xuICAgICAgICAgICAgaXRlbS5mcmFtZSA9IG5ld0ZyYW1lO1xuICAgICAgICAgICAgaXRlbS54ID0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChpdGVtLmZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIG1vdmVkRnJhbWVzLnNvcnQoKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBhIC0gYik7XG4gICAgICAgIGlmIChvZmZzZXRGcmFtZSA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0ZyYW1lSW5HcmlkKG1vdmVkRnJhbWVzW2ZyYW1lcy5sZW5ndGggLSAxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3dGcmFtZUluR3JpZChtb3ZlZEZyYW1lc1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8hLm9mZnNldEZyYW1lICs9IG9mZnNldEZyYW1lO1xuICAgICAgICBhd2FpdCBhbmltYXRpb25DdHJsLmNhbGxCeURlYm91bmNlKCdtb3ZlRXZlbnRzJyk7XG4gICAgfVxuXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqIOe7keWumuS6i+S7tuebuOWFsyAqKioqKioqKioqKioqKioqKioqKipcblxuICAgIC8qKlxuICAgICAqIOenu+WKqOWFs+mUruW4p1xuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgcHVibGljIG9uS2V5TW91c2VNb3ZlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCAkdGFyZ2V0OiBhbnkgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVtcFNlbGVjdDogSVNlbGVjdEtleSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhhdC5zZWxlY3RLZXlJbmZvKSk7XG4gICAgICAgIGNvbnN0IHsgc3RhcnRYLCBrZXlGcmFtZXMsIGxvY2F0aW9uLCBub2RlUGF0aCB9ID0gdGVtcFNlbGVjdDtcbiAgICAgICAgaWYgKE1hdGguYWJzKHN0YXJ0WCEgLSBldmVudC54KSA8IDAuMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2NvcHknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnZXctcmVzaXplJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGFydEZyYW1lID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCk7XG4gICAgICAgIGxldCBlbmRGcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKHN0YXJ0WCEpO1xuICAgICAgICBpZiAoZW5kRnJhbWUgPCAwKSB7XG4gICAgICAgICAgICBlbmRGcmFtZSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2Zmc2V0RnJhbWUgPSBzdGFydEZyYW1lIC0gZW5kRnJhbWU7XG4gICAgICAgIGlmIChvZmZzZXRGcmFtZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGdyaWRDdHJsLmdyaWQhLnZhbHVlVG9QaXhlbEgoc3RhcnRGcmFtZSkgLSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGVuZEZyYW1lKTtcbiAgICAgICAgY29uc3QgZnJhbWVzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Yga2V5RnJhbWVzKSB7XG4gICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWcqOWxnuaAp+i9qOmBk+S4iuW8gOWni+aLluaLveeahOWFs+mUruW4p++8jOS7heWPr+S7peenu+WKqOW9k+WJjemAieS4reiKgueCueeahOWFs+mUruW4p+aVsOaNrlxuICAgICAgICAgICAgaWYgKGxvY2F0aW9uID09PSAncHJvcCcgJiYgbm9kZVBhdGggJiYgaXRlbS5ub2RlUGF0aCAhPT0gbm9kZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBpdGVtLm9mZnNldEZyYW1lID0gMDtcbiAgICAgICAgICAgICAgICBmcmFtZXMucHVzaChpdGVtLmZyYW1lKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5ld0ZyYW1lID0gaXRlbS5mcmFtZSArIG9mZnNldEZyYW1lO1xuICAgICAgICAgICAgaWYgKG5ld0ZyYW1lIDwgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZW0ueCArPSBvZmZzZXQ7XG4gICAgICAgICAgICBpdGVtLmZyYW1lID0gbmV3RnJhbWU7XG4gICAgICAgICAgICBmcmFtZXMucHVzaChuZXdGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcFNlbGVjdC5zdGFydFghICs9IG9mZnNldDtcbiAgICAgICAgdGVtcFNlbGVjdC5vZmZzZXQhICs9IG9mZnNldDtcbiAgICAgICAgdGVtcFNlbGVjdC5vZmZzZXRGcmFtZSEgKz0gb2Zmc2V0RnJhbWU7XG5cbiAgICAgICAgaWYgKCFGbGFncy5zdGFydERyYWdTdGlja0luZm8pIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTW91c2VGcmFtZSh7IHg6IGV2ZW50LngsIHk6IGV2ZW50LnksIGZyYW1lOiBrZXlGcmFtZXNbMF0uZnJhbWUgfSwgdGVtcFNlbGVjdC5vZmZzZXRGcmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gdGVtcFNlbGVjdDtcbiAgICAgICAgZnJhbWVzLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSBncmlkQ3RybC5nZXRGcmFtZVJhbmcoKTtcbiAgICAgICAgaWYgKGZyYW1lc1swXSA8PSBzdGFydCB8fCBmcmFtZXNbZnJhbWVzLmxlbmd0aCAtIDFdID49IGVuZCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlVGltZUxpbmUoLW9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25BdXhLZXlNb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3Qgdm0gPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCAkdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdm0uYXV4Q3VydmVTdG9yZTtcbiAgICAgICAgaWYgKCFhdXhDdXJ2ZVN0b3JlLnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZW1wU2VsZWN0OiBJU2VsZWN0S2V5QmFzZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvKSk7XG4gICAgICAgIGNvbnN0IHsgc3RhcnRYLCBrZXlmcmFtZXMgfSA9IHRlbXBTZWxlY3Q7XG4gICAgICAgIGlmIChNYXRoLmFicyhzdGFydFghIC0gZXZlbnQueCkgPCAwLjEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICdjb3B5JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2V3LXJlc2l6ZSc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhcnRGcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LngpO1xuICAgICAgICBsZXQgZW5kRnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZShzdGFydFghKTtcbiAgICAgICAgaWYgKGVuZEZyYW1lIDwgMCkge1xuICAgICAgICAgICAgZW5kRnJhbWUgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9mZnNldEZyYW1lID0gc3RhcnRGcmFtZSAtIGVuZEZyYW1lO1xuICAgICAgICBpZiAob2Zmc2V0RnJhbWUgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvZmZzZXQgPSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKHN0YXJ0RnJhbWUpIC0gZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChlbmRGcmFtZSk7XG4gICAgICAgIGNvbnN0IGZyYW1lczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGtleWZyYW1lcykge1xuICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZyYW1lcy5wdXNoKGl0ZW0uZnJhbWUpO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdGcmFtZSA9IGl0ZW0uZnJhbWUgKyBvZmZzZXRGcmFtZTtcbiAgICAgICAgICAgIGlmIChuZXdGcmFtZSA8IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVtLnggKz0gb2Zmc2V0O1xuICAgICAgICAgICAgaXRlbS5mcmFtZSA9IG5ld0ZyYW1lO1xuICAgICAgICAgICAgZnJhbWVzLnB1c2gobmV3RnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGVtcFNlbGVjdC5zdGFydFggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0ZW1wU2VsZWN0LnN0YXJ0WCArPSBvZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0ZW1wU2VsZWN0Lm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0ICs9IG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRlbXBTZWxlY3Qub2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGVtcFNlbGVjdC5vZmZzZXQgKz0gb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGVtcFNlbGVjdC5vZmZzZXRGcmFtZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUgKz0gb2Zmc2V0RnJhbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIUZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mbykge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVNb3VzZUZyYW1lKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgeDogZXZlbnQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQueSxcbiAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGtleWZyYW1lc1swXS5mcmFtZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRlbXBTZWxlY3Qub2Zmc2V0RnJhbWUsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF1eEN1cnZlU3RvcmUuc2VsZWN0S2V5SW5mbyA9IHRlbXBTZWxlY3Q7XG4gICAgICAgIGZyYW1lcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gZ3JpZEN0cmwuZ2V0RnJhbWVSYW5nKCk7XG4gICAgICAgIGlmIChmcmFtZXNbMF0gPD0gc3RhcnQgfHwgZnJhbWVzW2ZyYW1lcy5sZW5ndGggLSAxXSA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVRpbWVMaW5lKC1vZmZzZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uRW1iZWRkZWRQbGF5ZXJNb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvIHx8ICF0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGV2ZW50LnggLSBGbGFncy5zdGFydERyYWdFbWJlZGRlZFBsYXllckluZm8uc3RhcnRYO1xuICAgICAgICBpZiAob2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgJHRhcmdldDogYW55ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBGbGFncy5zdGFydERyYWdFbWJlZGRlZFBsYXllckluZm8ub2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgICBzd2l0Y2ggKEZsYWdzLnN0YXJ0RHJhZ0VtYmVkZGVkUGxheWVySW5mby50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICAgICAgICAgIGlmIChldmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnY29weSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnbW92ZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFRPRE8g6ZyA6KaB5qOA5p+l5ZKM546w5pyJ5YiG57uE6L2o6YGT5LiK5pyJ5rKh5pyJ5Yay56qB77yM5Ye6546w5Yay56qB6ZyA6KaB5bCG5YmN6Z2i5pyJ5Yay56qB55qE6aG25byA77yI5oiW6ICF5pS+5Zyo5YW25LuW5Y+v5Lul5pS+572u55qE5YiG57uE5YaF77yJXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLnggPSBpbmZvLnJhd0luZm8ueCArIG9mZnNldDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2VtLXJlc2l6ZSc7XG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByYXdYID0gaW5mby54O1xuICAgICAgICAgICAgICAgICAgICBpbmZvLnggPSBNYXRoLm1heCgwLCBpbmZvLnJhd0luZm8ueCArIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ud2lkdGggPSBpbmZvLnJhd0luZm8ud2lkdGggLSAocmF3WCAtIGluZm8ucmF3SW5mby54KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5mb3JFYWNoKChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ud2lkdGggPSBpbmZvLnJhd0luZm8ud2lkdGggKyBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb25FbWJlZGRlZFBsYXllck1vdXNlVXAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvIHx8ICF0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyB8fCAhRmxhZ3Muc3RhcnREcmFnRW1iZWRkZWRQbGF5ZXJJbmZvLm9mZnNldCB8fCBGbGFncy5zdGFydERyYWdFbWJlZGRlZFBsYXllckluZm8udHlwZSA9PT0gJ2Ryb3AnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uczogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5mb3JFYWNoKChpbmZvKSA9PiB7XG4gICAgICAgICAgICBvcGVyYXRpb25zLnB1c2godXBkYXRlRW1iZWRkZWRQbGF5ZXIodGhpcy52bS5jdXJyZW50Q2xpcCwgdGhpcy50cmFuc0VtYmVkZGVkUGxheWVySW5mb1RvRHVtcChpbmZvLCBmYWxzZSksIHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaW5mbywgdHJ1ZSkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IElBcHBseU9wZXJhdGlvbihvcGVyYXRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgb25FbWJlZGRlZFBsYXllckRyb3AoZXZlbnQ6IERyYWdFdmVudCwgZ3JvdXA6IHN0cmluZykge1xuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEVkaXRvci5VSS5fX3Byb3RlY3RlZF9fLkRyYWdBcmVhLmN1cnJlbnREcmFnSW5mbykpIHx8IHt9O1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRQbGF5ZXIgPSBKU09OLnBhcnNlKHZhbHVlKTtcbiAgICAgICAgY29uc3QgcmF3RW1iZWRlZFBMYXllckR1bXAgPSB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGVtYmVkZGVkUGxheWVyLCBmYWxzZSk7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGV2ZW50LnggLSBGbGFncy5zdGFydERyYWdFbWJlZGRlZFBsYXllckluZm8hLnN0YXJ0WDtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXIueCA9IGVtYmVkZGVkUGxheWVyLnJhd0luZm8ueCArIG9mZnNldDtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXIuZ3JvdXAgPSBncm91cDtcbiAgICAgICAgY29uc3QgbmV3RW1iZWRlZFBMYXllckR1bXAgPSB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGVtYmVkZGVkUGxheWVyLCB0cnVlKTtcbiAgICAgICAgYXdhaXQgSUFwcGx5T3BlcmF0aW9uKHVwZGF0ZUVtYmVkZGVkUGxheWVyKHRoaXMudm0uY3VycmVudENsaXAsIHJhd0VtYmVkZWRQTGF5ZXJEdW1wLCBuZXdFbWJlZGVkUExheWVyRHVtcCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbktleU1vdXNlVXAoZXZlbnQ6IE1vdXNlRXZlbnQsIG9wdGlvbnM/OiB7IGFsdD86IGJvb2xlYW47IHRhcmdldD86IG51bWJlciB9KSB7XG4gICAgICAgIGlmICgoKG9wdGlvbnMgJiYgb3B0aW9ucy5hbHQpIHx8IGV2ZW50LmFsdEtleSkgJiYgdGhpcy52bS5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQ6IG51bWJlciA9IChvcHRpb25zICYmIG9wdGlvbnMudGFyZ2V0KSB8fCB0aGlzLnZtLmN1cnJlbnRGcmFtZTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVLZXkoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0aGlzLnZtLnNlbGVjdEtleUluZm8ua2V5RnJhbWVzWzBdLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC50cmFuc1NlbGVjdFRvQ29weUtleUluZm8oKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uQ3RybC5tb3ZlS2V5cygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkF1eEtleU1vdXNldXAoZTogTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCB2bSA9IHRoaXMudm07XG4gICAgICAgIGNvbnN0IGF1eEN1cnZlU3RvcmUgPSB2bS5hdXhDdXJ2ZVN0b3JlO1xuICAgICAgICBpZiAoYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWxlY3RJbmZvID0gYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBzZWxlY3RJbmZvLm9mZnNldEZyYW1lO1xuICAgICAgICBpZiAoTWF0aC5hYnMob2Zmc2V0KSA8IE51bWJlci5FUFNJTE9OKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhbmltYXRpb25DdHJsLm1vdmVBdXhLZXkoc2VsZWN0SW5mby5rZXlmcmFtZXMsIG9mZnNldCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRXZlbnRNb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RFdmVudEluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCAkdGFyZ2V0OiBhbnkgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIGlmIChldmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgICR0YXJnZXQuc3R5bGUuY3Vyc29yID0gJ2NvcHknO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnZXctcmVzaXplJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHN0YXJ0WCwgZGF0YSB9ID0gdGhhdC5zZWxlY3RFdmVudEluZm87XG4gICAgICAgIGNvbnN0IHN0YXJ0RnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZShldmVudC54KTtcbiAgICAgICAgbGV0IGVuZEZyYW1lID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoc3RhcnRYKTtcbiAgICAgICAgaWYgKGVuZEZyYW1lIDwgMCkge1xuICAgICAgICAgICAgZW5kRnJhbWUgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9mZnNldEZyYW1lID0gc3RhcnRGcmFtZSAtIGVuZEZyYW1lO1xuICAgICAgICBpZiAob2Zmc2V0RnJhbWUgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGdyaWRDdHJsLmdyaWQhLnZhbHVlVG9QaXhlbEgoc3RhcnRGcmFtZSkgLSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGVuZEZyYW1lKTtcbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8uc3RhcnRYICs9IG9mZnNldDtcbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8ub2Zmc2V0ICs9IG9mZnNldDtcbiAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8ub2Zmc2V0RnJhbWUgKz0gb2Zmc2V0RnJhbWU7XG4gICAgICAgIGZvciAoY29uc3QgZGF0YUl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgZGF0YUl0ZW0ueCArPSBvZmZzZXQ7XG4gICAgICAgICAgICBkYXRhSXRlbS5mcmFtZSArPSBvZmZzZXRGcmFtZTtcbiAgICAgICAgICAgIGlmIChkYXRhSXRlbS5mcmFtZSA8IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVNb3VzZUZyYW1lKHsgeDogZXZlbnQueCwgeTogZXZlbnQueSwgZnJhbWU6IGRhdGFbMF0uZnJhbWUgfSwgdGhhdC5zZWxlY3RFdmVudEluZm8ub2Zmc2V0RnJhbWUpO1xuICAgICAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IGdyaWRDdHJsLmdldEZyYW1lUmFuZygpO1xuICAgICAgICBpZiAoZGF0YVswXS5mcmFtZSA8PSBzdGFydCB8fCBkYXRhW2RhdGEubGVuZ3RoIC0gMV0uZnJhbWUgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUaW1lTGluZSgtb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkV2ZW50TW91c2VVcChldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCBmcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LnggKyBncmlkQ3RybC5zdGFydE9mZnNldCk7XG4gICAgICAgIGlmIChldmVudC5hbHRLZXkgJiYgdGhpcy52bS5zZWxlY3RFdmVudEluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVFdmVudChmcmFtZSwge1xuICAgICAgICAgICAgICAgIGV2ZW50c0R1bXA6IHRoaXMudm0uc2VsZWN0RXZlbnRJbmZvLmRhdGEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52bS5zZWxlY3RFdmVudEluZm8gJiYgdGhpcy52bS5zZWxlY3RFdmVudEluZm8hLm9mZnNldEZyYW1lID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uQ3RybC5tb3ZlRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgLy8g5om56YeP5Y+W5raI6YCJ5LitIElFbWJlZGRlZFBsYXllckluZm9cbiAgICB1blNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyhlbWJlZGRlZFBsYXllckluZm9zOiBJRW1iZWRkZWRQbGF5ZXJJbmZvW10pIHtcbiAgICAgICAgZW1iZWRkZWRQbGF5ZXJJbmZvcy5mb3JFYWNoKChlbWJlZGRlZFBsYXllckluZm8pID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGluU2VsZWN0ZWRJbmRleCA9IHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvLmZpbmRJbmRleCgoaW5mbzogSUVtYmVkZGVkUGxheWVySW5mbykgPT4gaW5mby5rZXkgPT09IGVtYmVkZGVkUGxheWVySW5mby5rZXkpO1xuICAgICAgICAgICAgaWYgKGluU2VsZWN0ZWRJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5zcGxpY2UoaW5TZWxlY3RlZEluZGV4LCAxKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCF0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykgcmV0dXJuO1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInKSk7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5tYXAoKGl0ZW0pID0+IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGR1bXA6IHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaXRlbSwgZmFsc2UpLFxuICAgICAgICAgICAgY2xpcFV1aWQ6IHRoaXMudm0uY3VycmVudENsaXAsXG4gICAgICAgICAgICByb290OiBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCEucmF3UGF0aCxcbiAgICAgICAgfSkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25TdGFydERyYWdTdXJlZ2lvbihldmVudDogTW91c2VFdmVudCwgZW1iZWRkZWRQbGF5ZXJJbmZvOiBJRW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgIGlmIChjaGVja0N0cmxPckNvbW1hbmQoZXZlbnQpICYmIHRoaXMudm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICBjb25zdCBpblNlbGVjdGVkSW5kZXggPSB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5maW5kSW5kZXgoKGluZm86IElFbWJlZGRlZFBsYXllckluZm8pID0+IGluZm8ua2V5ID09PSBlbWJlZGRlZFBsYXllckluZm8ua2V5KTtcbiAgICAgICAgICAgIGlmIChpblNlbGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIC4uLmVtYmVkZGVkUGxheWVySW5mbyxcbiAgICAgICAgICAgICAgICAgICAgcmF3SW5mbzogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShlbWJlZGRlZFBsYXllckluZm8pKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy52bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uc3BsaWNlKGluU2VsZWN0ZWRJbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IFt7XG4gICAgICAgICAgICAuLi5lbWJlZGRlZFBsYXllckluZm8sXG4gICAgICAgICAgICByYXdJbmZvOiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGVtYmVkZGVkUGxheWVySW5mbykpLFxuICAgICAgICB9XTtcblxuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInKSk7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCB0aGlzLnZtLnNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5tYXAoKGl0ZW0pID0+IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGR1bXA6IHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaXRlbSwgZmFsc2UpLFxuICAgICAgICAgICAgY2xpcFV1aWQ6IHRoaXMudm0uY3VycmVudENsaXAsXG4gICAgICAgICAgICByb290OiBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCEucmF3UGF0aCxcbiAgICAgICAgfSkpKTtcbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdlbWJlZGRlZFBsYXllcic7XG4gICAgICAgIEZsYWdzLnN0YXJ0RHJhZ0VtYmVkZGVkUGxheWVySW5mbyA9IHtcbiAgICAgICAgICAgIHN0YXJ0WDogZXZlbnQueCxcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHR5cGU6IGV2ZW50LnRhcmdldCEuZ2V0QXR0cmlidXRlKCduYW1lJyksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog57yp5pS+5YWz6ZSu5bin77yM56e75Yqo5qGG6YCJ5o6n5Yi25p2GXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBwdWJsaWMgb25TdGlja01vdXNlTW92ZShldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCFGbGFncy5zdGFydERyYWdTdGlja0luZm8gfHwgIXRoYXQuc2VsZWN0S2V5SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGV2ZW50LnggLSBGbGFncy5zdGFydERyYWdTdGlja0luZm8uc3RhcnRYO1xuICAgICAgICBpZiAob2Zmc2V0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChGbGFncy5zdGFydERyYWdTdGlja0luZm8udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgICAgICAvLyDmlbTkvZPnp7vliqjlhbPplK7luKdcbiAgICAgICAgICAgICAgICB0aGlzLm9uS2V5TW91c2VNb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAvLyDlj6/og73pnIDopoHnmoTlhbbku5blpITnkIZcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gMSArIG9mZnNldCAvIEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mby53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mby5jYWNoZURhdGE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZmVyS2V5ID0gZGF0YVswXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZnJhbWUgPT09IHJlZmVyS2V5LmZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgeCA9IChpbmZvLnggLSByZWZlcktleS54KSAqIHNjYWxlICsgcmVmZXJLZXkueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmcmFtZSA9IGdyaWRDdHJsLmNhbnZhc1RvRnJhbWUoeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDkv53or4Hlj4LogIPlhbPplK7luKfkuI3kvJrooqvopobnm5ZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcmFtZSA9PT0gcmVmZXJLZXkuZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSA9IHJlZmVyS2V5LmZyYW1lICsgKHNjYWxlID4gMSA/IC0xIDogMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhmcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0aWNrSW5mby53aWR0aCA9IHggKyAxMiAtIHRoaXMuc3RpY2tJbmZvLmxlZnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzW2ldLm9mZnNldEZyYW1lID0gZnJhbWUgLSB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzW2ldLnJhd0ZyYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzIVtpXSwgeyB4LCBmcmFtZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNlbGVjdEtleSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSBvZmZzZXQgLyBGbGFncy5zdGFydERyYWdTdGlja0luZm8ud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBGbGFncy5zdGFydERyYWdTdGlja0luZm8uY2FjaGVEYXRhO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZlcktleSA9IGRhdGFbZGF0YS5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGRhdGEubGVuZ3RoIC0gMjsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZnJhbWUgPT09IHJlZmVyS2V5LmZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgeCA9IChyZWZlcktleS54IC0gaW5mby54KSAqIHNjYWxlICsgaW5mby54O1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZyYW1lID0gZ3JpZEN0cmwuY2FudmFzVG9GcmFtZSh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS/neivgeWPguiAg+WFs+mUruW4p+S4jeS8muiiq+imhuebllxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyYW1lID09PSByZWZlcktleS5mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lID0gcmVmZXJLZXkuZnJhbWUgKyAoc2NhbGUgPiAxID8gLTEgOiAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lc1tpXS5vZmZzZXRGcmFtZSA9IGZyYW1lIC0gdGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lc1tpXS5yYXdGcmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odGhhdC5zZWxlY3RLZXlJbmZvLmtleUZyYW1lcyFbaV0sIHsgeCwgZnJhbWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVTZWxlY3RLZXkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYW5jZWxEZWJvdW5jZSgpIHtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVVwZGF0ZU5vZGUuY2FuY2VsKCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VGaWx0ZXJOb2RlLmNhbmNlbCgpO1xuICAgICAgICB0aGlzLmRlYm91bmNlUmVmcmVzaC5jYW5jZWwoKTtcbiAgICB9XG5cbiAgICBvblNjZW5lQ2xvc2UoKSB7XG4gICAgICAgIC8vIGNhbmNlbCBhbGwgZGVib3VuY2VkIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMuY2FuY2VsRGVib3VuY2UoKTtcbiAgICB9XG5cbiAgICBhc3luYyB1cGRhdGVOb2RlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCB2bSA9IHRoaXMudm07XG4gICAgICAgIGNvbnN0IGVkaXRJbmZvID0gYXdhaXQgcXVlcnlBbmltYXRpb25Ob2RlRWRpdEluZm8odXVpZCk7XG4gICAgICAgIGlmIChlZGl0SW5mby5zdGF0ZSA9PT0gJ2ZhaWx1cmUnIHx8ICFlZGl0SW5mby5yZXN1bHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZWRpdEluZm8ucmVhc29uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDlpITnkIYgc2VsZWN0ZWRJZCDotYvlgLzkuI4gbm9kZUNoYW5nZSDosIPnlKjlrZjlnKjnmoTml7bluo/lgY/lt67vvIjlvILmraXosIPnlKggKyB0aHJvdHRsZe+8ieOAglxuICAgICAgICAvLyBzZWxlY3RlZElkIOWFiOS6jiB1cGRhdGVOb2RlIOiwg+eUqOWPmOWMluOAguatpOaXtueahCBzZWxlY3RlZElkIOWPr+iDveW3sue7j+WPmOWMlu+8jOiLpeavlOi+gyB1dWlkIOS4jiBzZWxlY3RlZElkIOS4jeS4gOiHtO+8jOWImeS4jeabtOaWsOOAglxuICAgICAgICBpZiAodm0uc2VsZWN0ZWRJZCAhPT0gdXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyByb290LCBub2RlLCBhbmlDb21wLCBjbGlwc01lbnUsIGRlZmF1bHRDbGlwIH0gPSBlZGl0SW5mby5yZXN1bHQ7XG4gICAgICAgIHZtLnJvb3QgPSByb290O1xuICAgICAgICB0aGlzLnVwZGF0ZVJvb3Qobm9kZSk7XG4gICAgICAgIHZtLmNsaXBzTWVudSA9IGNsaXBzTWVudSB8fCBbXTtcbiAgICAgICAgdm0ubm9kZUR1bXAgPSBPYmplY3QuZnJlZXplKGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wID8gYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAubm9kZXMgOiBudWxsKTtcbiAgICAgICAgdm0uYW5pQ29tcFR5cGUgPSBhbmlDb21wID8gYW5pQ29tcCA6IG51bGw7XG5cbiAgICAgICAgLy8g55uu5YmN5Yeg5Liq5pu05paw5pON5L2c5piv5q2j5Lqk55qE77yM5Y+v5Lul5ZCM5pe25Y675omn6KGMXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIElxdWVyeVByb3BlcnRpZXNNZW51KHV1aWQpLnRoZW4oKG1lbnUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodXVpZCA9PT0gdm0uc2VsZWN0ZWRJZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5wcm9wZXJ0aWVzTWVudSA9IG1lbnU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNsaXBzKGRlZmF1bHRDbGlwLCAndXBkYXRlJyksXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIHVwZGF0ZUVkaXRJbmZvKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgbW9kZSA9IGF3YWl0IElxdWVyeVNjZW5lTW9kZSgpO1xuICAgICAgICAvLyDljp/mnaXlnKjliqjnlLvnvJbovpHmqKHlvI/kuIvnmoTvvIzpnIDopoHmn6Xor6LmnIDmlrDnmoTml7bpl7Tlkozmkq3mlL7nirbmgIFcbiAgICAgICAgaWYgKG1vZGUgPT09ICdhbmltYXRpb24nKSB7XG4gICAgICAgICAgICBjb25zdCBwbGF5U3RhdGUgPSBhd2FpdCBJcXVlcnlQbGF5U3RhdGUodGhhdC5jdXJyZW50Q2xpcCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBsYXlTdGF0ZShwbGF5U3RhdGUpO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFRpbWUgPSBhd2FpdCBJcXVlcnlQbGF5aW5nQ2xpcFRpbWUodGhhdC5jdXJyZW50Q2xpcCk7XG4gICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRGcmFtZSh0aW1lVG9GcmFtZShjdXJyZW50VGltZSwgdGhhdC5zYW1wbGUpKTtcbiAgICAgICAgICAgIHRoYXQuYW5pbWF0aW9uTW9kZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGF0LmFuaW1hdGlvbk1vZGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUGxheVN0YXRlKEFuaW1hdGlvblN0YXRlLlNUT1ApO1xuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50RnJhbWUoMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6Xmm7TmlrAgY2xpcCDoj5zljZXvvIzov5Tlm57mmK/lkKbnnJ/mraPmm7TmlrDkuoYgY2xpcCDoj5zljZVcbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlQ2xpcE1lbnUoY2xpcHNNZW51PzogSUNsaXBJbmZvW10pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG5cbiAgICAgICAgY29uc3QgY2xpcEluZm8gPSBjbGlwc01lbnUgfHwgKGF3YWl0IElxdWVyeWNsaXBzTWVudUluZm8odGhhdC5yb290KSk7XG4gICAgICAgIGlmICghY2xpcEluZm8gfHwgKGNsaXBJbmZvICYmIGNsaXBJbmZvLmNsaXBzTWVudSAmJiBjbGlwSW5mby5jbGlwc01lbnUubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgICAgdGhhdC5jbGlwc01lbnUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2xpcHMobnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuY2xpcHNNZW51ID0gY2xpcEluZm8uY2xpcHNNZW51O1xuICAgICAgICAgICAgaWYgKHRoYXQuY3VycmVudENsaXAgIT09IGNsaXBJbmZvLmRlZmF1bHRDbGlwKSB7XG4gICAgICAgICAgICAgICAgLy8g5LiN6IO955u05o6l5ou/5paw55qE6buY6K6kIGNsaXAg5pu/5o2i77yM6ZyA6KaB5p+l6K+i5b2T5YmN55qEIGNsaXAg5ZyoIGNsaXAg6I+c5Y2V5Lit5piv5ZCm5a2Y5ZyoXG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjbGlwSW5mby5jbGlwc01lbnUuZmluZEluZGV4KChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udXVpZCA9PT0gdGhhdC5jdXJyZW50Q2xpcDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyDmnKrov5vlhaXliqjnlLvnvJbovpHmqKHlvI/miJbogIXlvZPliY3nvJbovpHnmoQgY2xpcCDooqvnp7vpmaTvvIzku6Xlj4rnlYzpnaLkuLvliqjlj5Hmtojmga/ml7bmiY3kvJrliIfmjaIgY2xpcFxuICAgICAgICAgICAgICAgIGlmICgoaW5kZXggPT09IC0xICYmIHRoYXQuYW5pbWF0aW9uTW9kZSkgfHwgIXRoYXQuYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNsaXBJbmZvLmRlZmF1bHRDbGlwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGlwSW5mby5kZWZhdWx0Q2xpcCA9IGNsaXBJbmZvLmNsaXBzTWVudVswXS51dWlkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlQ2xpcHMoY2xpcEluZm8uZGVmYXVsdENsaXApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGFzeW5jIGNoZWNrVXNlQmFrZWRBbmltYXRpb25CeVNrZWxldGFsQW5pbWF0aW9uKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgcmV0dXJuIElxdWVyeUFuaW1hdGlvblJvb3RJbmZvKHRoYXQucm9vdClcbiAgICAgICAgICAgIC50aGVuKChyb290SW5mbykgPT4ge1xuICAgICAgICAgICAgICAgIHRoYXQuc2hvd1VzZUJha2VkQW5pbWF0aW9uV2FybiA9IHRoYXQuaXNTa2VsZXRvbkNsaXAgJiYgcm9vdEluZm8udXNlQmFrZWRBbmltYXRpb247XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2hlY2tQcm9wVHlwZUluQ29weUtleUluZm8odHlwZTogYW55KSB7XG4gICAgICAgIGNvbnN0IGNvcHlLZXlJbmZvID0gYW5pbWF0aW9uQ3RybC5jb3B5S2V5SW5mbztcbiAgICAgICAgaWYgKCFjb3B5S2V5SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBjb3B5S2V5SW5mby5jdXJ2ZXNEdW1wKSB7XG4gICAgICAgICAgICAvLyDlkIzoioLngrnlkIzlsZ7mgKfnmoTlhbPplK7luKfmiY3lhYHorrjnspjotLRcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGlmIChpdGVtLl9wYXJlbnRUeXBlICYmIGl0ZW0uX3BhcmVudFR5cGUudmFsdWUgPT09IHR5cGUudmFsdWUgfHwgaXRlbS50eXBlLnZhbHVlID09PSB0eXBlLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOWxnuaAp+i9qOmBk+afkOS4quepuueZveS9jee9ruWPs+mUru+8jOS4jeespuWQiOWxnuaAp+i9qOmBk+S9jee9rueahOWwhuS8mui/lOWbniBmYWxzZVxuICAgICAqIEBwYXJhbSB4XG4gICAgICogQHBhcmFtIHlcbiAgICAgKi9cbiAgICBwdWJsaWMgb25Qcm9wVHJhY2tNZW51KHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy52bS5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5pi+56S65bGe5oCn6L2o6YGT5Y+z6ZSu6I+c5Y2VXG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZtLiRyZWZzWydwcm9wZXJ0eS1jb250ZW50J10uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHRvcCA9IHkgLSByZWN0LnRvcCArIHRoaXMudm0ucHJvcGVydHlTY3JvbGxJbmZvIS50b3A7XG4gICAgICAgIGNvbnN0IHByb3BEYXRhID0gT2JqZWN0LnZhbHVlcyh0aGlzLnZtLnByb3BlcnRpZXMpLmZpbmQoKGl0ZW0pID0+IGl0ZW0udG9wICsgdGhpcy5MSU5FX0hFSUdIVCA+IHRvcCAmJiB0b3AgPiBpdGVtLnRvcCk7XG4gICAgICAgIGlmICghcHJvcERhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKHgpO1xuICAgICAgICBjb25zdCBtZW51TWFwID0gZ2V0UG9wTWVudU1hcChvblByb3BDb250ZXh0TWVudXMsIHRydWUpO1xuICAgICAgICBtZW51TWFwLmNyZWF0ZUtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY3JlYXRlS2V5KHtcbiAgICAgICAgICAgICAgICBmcmFtZSxcbiAgICAgICAgICAgICAgICBub2RlUGF0aDogcHJvcERhdGEubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgcHJvcDogcHJvcERhdGEucHJvcCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBtZW51TWFwLnBhc3RlS2V5LmVuYWJsZWQgPSB0aGlzLmNoZWNrUHJvcFR5cGVJbkNvcHlLZXlJbmZvKHByb3BEYXRhLnR5cGUpO1xuICAgICAgICBtZW51TWFwLnBhc3RlS2V5LmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZUtleSh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBmcmFtZSxcbiAgICAgICAgICAgICAgICBub2RlUGF0aDogcHJvcERhdGEubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgcHJvcDogcHJvcERhdGEucHJvcCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgICAgIG1lbnU6IFtcbiAgICAgICAgICAgICAgICAuLi5PYmplY3QudmFsdWVzKG1lbnVNYXApLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGBmcmFtZTogJHtmcmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOiKgueCuei9qOmBk+afkOS4quS9jee9ruWPs+mUru+8jOS4jeespuWQiOWxnuaAp+i9qOmBk+S9jee9rueahOWwhuS8mui/lOWbniBmYWxzZVxuICAgICAqIEBwYXJhbSB4XG4gICAgICogQHBhcmFtIHlcbiAgICAgKi9cbiAgICBwdWJsaWMgb25Ob2RlVHJhY2tNZW51KHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIC8vIOaYvuekuuiKgueCuei9qOmBk+WPs+mUruiPnOWNlVxuICAgICAgICBjb25zdCByZWN0ID0gdGhpcy52bS4kcmVmc1snbm9kZS1jb250ZW50J10uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHRvcCA9IHkgLSByZWN0LnRvcCArIHRoaXMudm0ubm9kZVNjcm9sbEluZm8hLnRvcDtcbiAgICAgICAgY29uc3Qgbm9kZURhdGEgPSB0aGlzLnZtLm5vZGVEdW1wIS5maW5kKChpdGVtKSA9PiBpdGVtLnRvcCArIHRoaXMuTElORV9IRUlHSFQgPiB0b3AgJiYgdG9wID4gaXRlbS50b3ApO1xuICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIHNwYWNpbmdTZWxlY3RlZEtleXMoc3BhY2luZ0ZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RLZXlVcGRhdGVGbGFnID0gdHJ1ZTtcbiAgICAgICAgYW5pbWF0aW9uQ3RybC5zcGFjaW5nS2V5cyhzcGFjaW5nRnJhbWUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblN0aWNrTW91c2VVcChldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSBFdmVudEJ1dHRvbi5SSUdIVCkge1xuICAgICAgICAgICAgY29uc3QgbWVudU1hcCA9IGdldFBvcE1lbnVNYXAob25TdGlja01lbnVzLCB0cnVlKTtcbiAgICAgICAgICAgIG1lbnVNYXAuY29weUtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmNvcHlLZXkoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBtZW51TWFwLnNwYWNpbmdLZXlzLmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc3BhY2luZ1NlbGVjdGVkS2V5cyhhbmltYXRpb25FZGl0b3Iuc3BhY2luZ0ZyYW1lKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBtZW51TWFwLnJlbW92ZUtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLnJlbW92ZUtleSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIOWPs+mUruiPnOWNlVxuICAgICAgICAgICAgRWRpdG9yLk1lbnUucG9wdXAoeyBtZW51OiBPYmplY3QudmFsdWVzKG1lbnVNYXApIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghRmxhZ3Muc3RhcnREcmFnU3RpY2tJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChGbGFncy5zdGFydERyYWdTdGlja0luZm8udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgICAgICAvLyDmlbTkvZPnp7vliqjlhbPplK7luKco5pW05L2T56e75Yqo5pe277yM6byg5qCH5L2N572u5bm25LiN5LiA5a6a5Zyo5YWz6ZSu5bin5LiK77yM5LiN6IO955u05o6l5L2/55So5L2N572u6K6h566X56ys5LiA5Liq5YWz6ZSu5bin55qE5L2N572uKVxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlNb3VzZVVwKGV2ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcy5zdGlja0luZm8ubGVmdEZyYW1lLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlNb3VzZVVwKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgIHRoaXMub25LZXlNb3VzZVVwKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBGbGFncy5zdGFydERyYWdTdGlja0luZm8gPSBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblN0YXJ0UmVzaXplKGV2ZW50OiBNb3VzZUV2ZW50LCB0eXBlOiBOb25OdWxsYWJsZTxJRmxhZ3NbJ3N0YXJ0UmVzaXplSW5mbyddPlsndHlwZSddKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQudGFnTmFtZSA9PT0gJ1VJLUlOUFVUJyl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ3Jlc2l6ZSc7XG4gICAgICAgIEZsYWdzLnN0YXJ0UmVzaXplSW5mbyA9IHtcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBzdGFydDogMCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25SZXNpemVNb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKCFGbGFncy5zdGFydFJlc2l6ZUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlID0gRmxhZ3Muc3RhcnRSZXNpemVJbmZvLnR5cGU7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRmxhZ3Muc3RhcnRSZXNpemVJbmZvLnN0YXJ0O1xuICAgICAgICBsZXQgZW5kID0gMDtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgZW5kID0gZXZlbnQueDtcbiAgICAgICAgICAgIHRoaXMudm0ubGVmdFJlc2l6ZU1vdmluZyA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbmQgPSBldmVudC55ICsgMjU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzdGFydCkge1xuICAgICAgICAgICAgRmxhZ3Muc3RhcnRSZXNpemVJbmZvLnN0YXJ0ID0gZW5kO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC54IDwgdGhpcy5sYXlvdXRDb25maWcubGVmdE1pbiB8fCBldmVudC54ID4gdGhpcy5sYXlvdXRDb25maWcubGVmdE1heCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMyIOS4uueql+WPo+mhtuS4iiB0aXRsZSDmoI8gKyDovrnmoYbmgLvlkoxcbiAgICAgICAgY29uc3QgcG9zaXRpb25ZID0gZXZlbnQueSAtIDMyIC0gdGhpcy52bS4kcmVmc1snY29udGFpbmVyJ10uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgICAgICBpZiAodHlwZSAhPT0gJ2xlZnQnICYmIChwb3NpdGlvblkgPiB0aGlzLmxheW91dENvbmZpZy50b3BNYXggfHwgcG9zaXRpb25ZIDwgdGhpcy5sYXlvdXRDb25maWcudG9wTWluKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgRmxhZ3Muc3RhcnRSZXNpemVJbmZvLnN0YXJ0ID0gZW5kO1xuICAgICAgICBjb25zdCB0eXBlS2V5ID0gdHlwZSArICdQZWMnO1xuICAgICAgICBjb25zdCB0b3RhbExlbiA9IHR5cGUgPT09ICdsZWZ0JyA/IHRoaXMudm0uJHJlZnNbJ2NvbnRhaW5lciddLm9mZnNldFdpZHRoIDogdGhpcy52bS4kcmVmc1snY29udGFpbmVyJ10ub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGN1ciA9IChwYXJzZUZsb2F0KHRoaXMudm0ubGF5b3V0W3R5cGVLZXldKSAvIDEwMCkgKiB0b3RhbExlbiB8fCAwO1xuXG4gICAgICAgIGxldCByZXMgPSBjdXIgKyBlbmQgLSBzdGFydDtcbiAgICAgICAgLy8gRklYTUU6IHJlc2l6ZSBtb3VzZW1vdmXnmoTpgLvovpHmmK/mjqfliLYgcmVzaXplIOWFg+e0oOS4iuaWueWMuuWfn+eahOmrmOW6pihwcm9wZXJ0eSDmi5bliqjml7bmjqfliLYgbm9kZSDpq5jluqYsIG5vZGUg5ouW5Yqo5o6n5Yi2IHRvcCDpq5jluqYp77yMXG4gICAgICAgIC8vIOWboOS4uuaaguaXtuayoeacieS/ruaUuSBwcm9wZXJ0eSDljLrln58gZmxleC0xIOiHquWKqOaSkea7oeeahOmAu+i+ke+8jOWboOatpCBwcm9wZXJ0eSDkuIvmlrnljLrln5/nmoTmi5bliqjpgLvovpHpg73mmK/nm7jlj43nmoTvvIxcbiAgICAgICAgLy8g5Y2zIGhlYWRlciDmi5bliqjmjqfliLbnmoTmmK/mnKzljLrln5/nmoTpq5jluqbjgIJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdhdXhDdXJ2ZScpIHtcbiAgICAgICAgICAgIHJlcyA9IGN1ciAtIChlbmQgLSBzdGFydCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJlcyA9IEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKHJlcywgdGhpcy5sYXlvdXRDb25maWdbYCR7dHlwZX1NaW5gXSwgdGhpcy5sYXlvdXRDb25maWdbYCR7dHlwZX1NYXhgXSk7XG4gICAgICAgIGxldCBuZXdWYWx1ZSA9IChyZXMgLyB0b3RhbExlbikgKiAxMDA7XG4gICAgICAgIG5ld1ZhbHVlID0gTWF0aC5taW4oMTAwLCBuZXdWYWx1ZSk7IC8vIOacgOWkp+S4jei2hei/hyAxMDAlXG5cbiAgICAgICAgLy8g5bGV5byA5pe25L+d55WZ5pyA5bCP5oqY5Y+g6auY5bqmICjnmb7liIbmr5QpXG4gICAgICAgIGNvbnN0IG1pbkV4cGFuZEhlaWdodCA9IDQ7XG4gICAgICAgIGlmIChuZXdWYWx1ZSA8IG1pbkV4cGFuZEhlaWdodCl7XG4gICAgICAgICAgICBpZiAodHlwZUtleSA9PT0gJ2NlbnRlclBlYycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtaW51cyA9IHRoaXMudm0ubGF5b3V0W3R5cGVLZXldIC0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgdGhpcy52bS5sYXlvdXQudG9wUGVjIC09IG1pbnVzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZtLmxheW91dC50b3BQZWMgPCBtaW5FeHBhbmRIZWlnaHQpe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZtLmxheW91dC50b3BQZWMgPSBtaW5FeHBhbmRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3VmFsdWUgPSBtaW5FeHBhbmRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZUtleSA9PT0gJ3RvcFBlYycpIHtcbiAgICAgICAgICAgIHRoaXMudm0ubGF5b3V0LmNlbnRlclBlYyA9IHRoaXMudm0ubGF5b3V0LnRvcFBlYyArIHRoaXMudm0ubGF5b3V0LmNlbnRlclBlYyAtIG5ld1ZhbHVlO1xuICAgICAgICAgICAgaWYgKHRoaXMudm0ubGF5b3V0LmNlbnRlclBlYyA8IG1pbkV4cGFuZEhlaWdodCl7XG4gICAgICAgICAgICAgICAgdGhpcy52bS5sYXlvdXQuY2VudGVyUGVjID0gbWluRXhwYW5kSGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLnZtLmxheW91dFt0eXBlS2V5XSA9IG5ld1ZhbHVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblJlc2l6ZU1vdXNlVXAoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgdGhpcy52bS5sZWZ0UmVzaXplTW92aW5nID0gZmFsc2U7XG4gICAgICAgIEZsYWdzLnN0YXJ0UmVzaXplSW5mbyA9IG51bGw7XG4gICAgICAgIHRoaXMuc2V0Q29uZmlnKCdsYXlvdXQnLCB0aGlzLnZtLmxheW91dCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZXZlbnQudGFyZ2V0LnN0eWxlID0gJ2RlZmF1bHQnO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKiDlhajlsYDkuovku7blpITnkIYgKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICBwdWJsaWMgb25Nb3VzZVVwID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIC8vIFRPRE8gbWVyZ2UgMy41LjFcbiAgICAgICAgLy8gaWYgKCFGbGFncy5tb3VzZURvd25OYW1lKSB7XG4gICAgICAgIC8vICAgICBpZiAoRmxhZ3MuX3N0YXJ0TW92ZSkge1xuICAgICAgICAvLyAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgLy8gICAgICAgICBjbGVhclRpbWVvdXQoRmxhZ3MuX3N0YXJ0TW92ZSk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICByZXR1cm47XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIVtcbiAgICAgICAgICAgICAgICAnZ3JpZCcsXG4gICAgICAgICAgICAgICAgJ3BvaW50ZXInLFxuICAgICAgICAgICAgICAgICd0aW1lLXBvaW50ZXInLFxuICAgICAgICAgICAgICAgICdyZXNpemUnLFxuICAgICAgICAgICAgICAgICdwcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgJ2tleScsXG4gICAgICAgICAgICAgICAgJ2V2ZW50JyxcbiAgICAgICAgICAgICAgICAnbm9kZScsXG4gICAgICAgICAgICAgICAgJ3Byb3BlcnR5LWxpc3QtY29udGVudCcsXG4gICAgICAgICAgICAgICAgJ2VtYmVkZGVkUGxheWVyJyxcbiAgICAgICAgICAgICAgICAnYXV4LWtleScsXG4gICAgICAgICAgICBdLmluY2x1ZGVzKEZsYWdzLm1vdXNlRG93bk5hbWUpICYmXG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IuaXNMb2NrXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRoYXQgPSBhbmltYXRpb25FZGl0b3Iudm07XG4gICAgICAgIGNvbnN0ICR0YXJnZXQ6IGFueSA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG5cbiAgICAgICAgRmxhZ3Mub25TZWxlY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgc3dpdGNoIChGbGFncy5tb3VzZURvd25OYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdrZXknOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vbktleU1vdXNlVXAoZXZlbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBncmlkQ3RybC5wYWdlVG9GcmFtZShldmVudC54KSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2F1eC1rZXknOlxuICAgICAgICAgICAgICAgIHRoaXMub25BdXhLZXlNb3VzZXVwKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2VtYmVkZGVkUGxheWVyJzpcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25FbWJlZGRlZFBsYXllck1vdXNlVXAoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXZlbnQnOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vbkV2ZW50TW91c2VVcChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzdGljayc6XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uU3RpY2tNb3VzZVVwKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Jlc2l6ZSc6XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uUmVzaXplTW91c2VVcChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0aW1lLXBvaW50ZXInOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZyYW1lID0gZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmcmFtZSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSBFdmVudEJ1dHRvbi5SSUdIVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50RnJhbWUgPSBmcmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWUgPSBmcmFtZVRvVGltZShmcmFtZSwgdGhhdC5zYW1wbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgSXNldEN1ckVkaXRUaW1lKHRpbWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVudU1hcCA9IGdldFBvcE1lbnVNYXAob25UaW1lckNvbnRleHRNZW51cywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51TWFwLmNyZWF0ZUV2ZW50S2V5LmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuYWRkRXZlbnQoZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51TWFwLnBhc3RlRXZlbnRLZXkuZW5hYmxlZCA9ICEhYW5pbWF0aW9uQ3RybC5jb3B5RXZlbnRJbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUV2ZW50S2V5LmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucGFzdGVFdmVudChmcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHsgbWVudTogT2JqZWN0LnZhbHVlcyhtZW51TWFwKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Byb3BlcnR5JzpcbiAgICAgICAgICAgICAgICAhdGhhdC5ib3hJbmZvICYmIGFuaW1hdGlvbkVkaXRvci5vblByb3BUcmFja01lbnUoZXZlbnQueCwgZXZlbnQueSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwcm9wZXJ0eS1saXN0LWNvbnRlbnQnOlxuICAgICAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gPT09IEV2ZW50QnV0dG9uLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWcqOWxnuaAp+WIl+ihqOepuueZveS9jee9ruWPs+mUruiPnOWNlVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZW51TWFwID0gZ2V0UG9wTWVudU1hcChvblByb3BMaXN0Q29udGV4dE1lbnVzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZVByb3AuZW5hYmxlZCA9ICEhKGFuaW1hdGlvbkN0cmwuY29weVByb3BJbmZvICYmIHRoYXQuc2VsZWN0ZWRJZCk7XG4gICAgICAgICAgICAgICAgICAgIG1lbnVNYXAucGFzdGVQcm9wLmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZU5vZGVEYXRhKGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wIS51dWlkMnBhdGhbdGhhdC5zZWxlY3RlZElkXSwgYW5pbWF0aW9uQ3RybC5nZXRDbGlwQm9hcmREYXRhKCdwcm9wJykpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBtZW51TWFwLmNyZWF0ZVByb3Auc3VibWVudSA9IHRoYXQuZGlzcGxheVByb3BlcnRpZXNNZW51O1xuICAgICAgICAgICAgICAgICAgICBtZW51TWFwLmNyZWF0ZVByb3AuZW5hYmxlZCA9ICghIXRoYXQuc2VsZWN0ZWRJZCAmJiAhIXRoYXQuZGlzcGxheVByb3BlcnRpZXNNZW51Lmxlbmd0aCAmJiAhdGhhdC5jbGlwQ29uZmlnPy5pc0xvY2spO1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVudS5wb3B1cCh7IG1lbnU6IE9iamVjdC52YWx1ZXMobWVudU1hcCkgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZ3JpZCc6XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gRXZlbnRCdXR0b24uUklHSFQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGdyaWQg5Y+z6ZSu5ouW5Yqo5Lya5ZKM5YWz6ZSu5bin5Y+z6ZSu6I+c5Y2V5Yay56qBXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIEZsYWdzLm1vdXNlRG93bk5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgRmxhZ3Muc3RhcnREcmFnR3JpZEluZm8gPSBudWxsO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGF0LmJveEluZm8gPSBudWxsO1xuICAgICAgICB0aGF0LmJveFN0eWxlID0gbnVsbDtcbiAgICAgICAgdGhhdC5ib3hEYXRhID0gbnVsbDtcbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICcnO1xuICAgICAgICBGbGFncy5zdGFydERyYWdHcmlkSW5mbyA9IG51bGw7XG4gICAgICAgIHRoYXQubW92ZUluZm8gPSBudWxsO1xuICAgIH07XG5cbiAgICBwdWJsaWMgb25Nb3VzZU1vdmUgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgLy8g5b2T5YmN5peg6byg5qCH5oyJ6ZSu54K55Ye75pe277yM55u05o6l6L+H5ruk6byg5qCH56e75Yqo5LqL5Lu2XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICghW1xuICAgICAgICAgICAgICAgICdncmlkJyxcbiAgICAgICAgICAgICAgICAncG9pbnRlcicsXG4gICAgICAgICAgICAgICAgJ3RpbWUtcG9pbnRlcicsXG4gICAgICAgICAgICAgICAgJ3Jlc2l6ZScsXG4gICAgICAgICAgICAgICAgJ2V2ZW50JyxcbiAgICAgICAgICAgICAgICAna2V5JyxcbiAgICAgICAgICAgICAgICAncHJvcGVydHknLFxuICAgICAgICAgICAgICAgICdub2RlJyxcbiAgICAgICAgICAgICAgICAnZW1iZWRkZWRQbGF5ZXInLFxuICAgICAgICAgICAgICAgICdhdXgta2V5JyxcbiAgICAgICAgICAgIF0uaW5jbHVkZXMoRmxhZ3MubW91c2VEb3duTmFtZSkgJiZcbiAgICAgICAgICAgICAgICAoYW5pbWF0aW9uRWRpdG9yLmlzTG9jayB8fCBGbGFncy5vblNjcm9sbGluZyB8fCAhZXZlbnQuYnV0dG9ucykpIHx8XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iudm0ubWFza1BhbmVsXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRoYXQgPSBhbmltYXRpb25FZGl0b3Iudm07XG4gICAgICAgIGNvbnN0ICR0YXJnZXQ6IGFueSA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgY29uc3QgeyB4LCB5LCBidXR0b24gfSA9IGV2ZW50O1xuICAgICAgICBjb25zdCByZWN0ID0gdGhhdC4kcmVmcy5ncmlkQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBpZiAoRmxhZ3MubW91c2VEb3duTmFtZSkge1xuICAgICAgICAgICAgdGhhdC5wcmV2aWV3UG9pbnRlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChGbGFncy5tb3VzZURvd25OYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdrZXknOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vbktleU1vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhdXgta2V5JzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uQXV4S2V5TW91c2VNb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2VtYmVkZGVkUGxheWVyJzpcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25FbWJlZGRlZFBsYXllck1vdXNlTW92ZShldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdldmVudCc6XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uRXZlbnRNb3VzZU1vdmUoZXZlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RpY2snOlxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblN0aWNrTW91c2VNb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3Jlc2l6ZSc6XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uUmVzaXplTW91c2VNb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2dyaWQnOlxuICAgICAgICAgICAgY2FzZSAncHJvcGVydHknOlxuICAgICAgICAgICAgY2FzZSAnbm9kZSc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUZsYWdzLnN0YXJ0RHJhZ0dyaWRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICctd2Via2l0LWdyYWJiaW5nJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW92ZVggPSB4IC0gRmxhZ3Muc3RhcnREcmFnR3JpZEluZm8ubGFzdFN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICBpZiAobW92ZVggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJ2dyaWQnO1xuICAgICAgICAgICAgICAgICAgICBGbGFncy5zdGFydERyYWdHcmlkSW5mbyEubGFzdFN0YXJ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5tb3ZlVGltZUxpbmUobW92ZVgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwb2ludGVyJzpcbiAgICAgICAgICAgIGNhc2UgJ3RpbWUtcG9pbnRlcic6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkdGFyZ2V0LnN0eWxlLmN1cnNvciA9ICdldy1yZXNpemUnO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZnJhbWUgPSBncmlkQ3RybC5wYWdlVG9GcmFtZShldmVudC54KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZyYW1lIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuY3VycmVudEZyYW1lID0gZnJhbWU7XG4gICAgICAgICAgICAgICAgICAgIElzZXRDdXJFZGl0VGltZShmcmFtZVRvVGltZSh0aGF0LmN1cnJlbnRGcmFtZSwgdGhhdC5zYW1wbGUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFGbGFncy5tb3VzZURvd25OYW1lKSB7XG4gICAgICAgICAgICAvLyDotoXlh7rnlYzpnaLojIPlm7TnmoTkuI3mmL7npLrlhYnmoIfmj5DnpLpcbiAgICAgICAgICAgIGlmICh4IDwgcmVjdC54IHx8IHggPiByZWN0LnggKyByZWN0LndpZHRoIHx8IHkgPCByZWN0LnkgfHwgeSA+IHJlY3QueSArIHJlY3QuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHRhcmdldC5zdHlsZS5jdXJzb3IgPSAnJztcbiAgICAgICAgICAgIC8vIOWkhOeQhum8oOagh+e7j+i/h+aXtueahOS9jee9ruaPkOekulxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ3JpZEN0cmwucGFnZVRvQ3RybCh4LCB5KTtcbiAgICAgICAgICAgIGNvbnN0IHBvaW50ZXJGcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKHgpO1xuICAgICAgICAgICAgaWYgKHBvaW50ZXJGcmFtZSA8IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhhdC5wcmV2aWV3UG9pbnRlciAmJiB0aGF0LnByZXZpZXdQb2ludGVyLmZyYW1lID09PSBwb2ludGVyRnJhbWUgJiYgdGhhdC5wcmV2aWV3UG9pbnRlci55ID09PSByZXN1bHQueSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEZsYWdzLnByZXZpZXdQb2ludGVyVGFzayAmJiBjbGVhclRpbWVvdXQoRmxhZ3MucHJldmlld1BvaW50ZXJUYXNrKTtcbiAgICAgICAgICAgIC8vIOeVmeaciei3neemu+mBv+WFjeW9seWTjeWIsOeCueWHu+WFs+mUruW4p+etieeahOS9v+eUqFxuICAgICAgICAgICAgcmVzdWx0LnkgKz0gMjQ7XG4gICAgICAgICAgICAvLyDpmZDliLbmj5DnpLrlhbPplK7luKfnmoTmmL7npLrojIPlm7TvvIzpgb/lhY3lvbHlk43liLDpobbpg6jnmoTkvb/nlKhcbiAgICAgICAgICAgIGlmIChyZXN1bHQueSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnkgPSAzMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhhdC5wcmV2aWV3UG9pbnRlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWU6IHBvaW50ZXJGcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgeDogcmVzdWx0LnggLSBncmlkQ3RybC5zdGFydE9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgeTogcmVzdWx0LnksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBGbGFncy5wcmV2aWV3UG9pbnRlclRhc2sgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5wcmV2aWV3UG9pbnRlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoWydub2RlJywgJ3Byb3BlcnR5J10uaW5jbHVkZXMoRmxhZ3MubW91c2VEb3duTmFtZSkgJiYgZXZlbnQuYnV0dG9uID09PSBFdmVudEJ1dHRvbi5MRUZUKSB7XG4gICAgICAgICAgICBGbGFncy5vblNlbGVjdGluZyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uRWRpdG9yLmlzTG9jaykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5a+5IGJveCDnmoTmoYbpgInlpITnkIZcbiAgICAgICAgICAgICAgICAvLyDpqqjpqrzliqjnlLvnm67liY3ml6DlhbPplK7luKfmlbDmja7vvIzkuI3pnIDopoHlk43lupTlhbPplK7moYbpgInnp7vliqjnrYnmk43kvZxcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5ib3hJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYm94SW5mbyEueCA9IGV2ZW50Lng7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYm94SW5mbyEueSA9IGV2ZW50Lnk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYm94U3R5bGUgPSBhbmltYXRpb25FZGl0b3IuY2FsY0JveFN0eWxlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5pu05pawIGNsaXAg5LiK6YCJ5Lit55qE5pWw5o2u5L+h5oGvXG4gICAgICovXG4gICAgcHVibGljIGNoZWNrU2VsZWN0RGF0YSgpIHtcbiAgICAgICAgdGhpcy5jaGVja1NlbGVjdFByb3BlcnR5KCk7XG4gICAgICAgIHRoaXMuY2hlY2tTZWxlY3RFdmVudHMoKTtcbiAgICAgICAgdGhpcy5jaGVja1NlbGVjdEtleXMoKTtcbiAgICAgICAgdGhpcy5jaGVja1NlbGVjdEVtYmVkZGVkUGxheWVycygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjaGVja1NlbGVjdEVtYmVkZGVkUGxheWVycygpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5ncm91cFRvRW1iZWRkZWRQbGF5ZXJzKSB7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IG51bGw7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInLCBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdhbmltYXRpb24tZW1iZWRkZWRQbGF5ZXInKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW1iZWRkZWRQbGF5ZXJTdHJzID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYW5pbWF0aW9uLWVtYmVkZGVkUGxheWVyJyk7XG4gICAgICAgIGlmIChlbWJlZGRlZFBsYXllclN0cnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdEVtYmVkZGVkUGxheWVySW5mbzogSVNlbGVjdEVtYmVkZGVkUGxheWVySW5mb1tdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVtYmVkZGVkUGxheWVyU3RyIG9mIGVtYmVkZGVkUGxheWVyU3Rycykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVtYmVkZGVkUGxheWVyID0gSlNPTi5wYXJzZShlbWJlZGRlZFBsYXllclN0cik7XG4gICAgICAgICAgICAgICAgaWYgKGVtYmVkZGVkUGxheWVyLmNsaXBVdWlkICE9PSB0aGF0LmN1cnJlbnRDbGlwKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2FuaW1hdGlvbi1lbWJlZGRlZFBsYXllcicsIGVtYmVkZGVkUGxheWVyU3RyKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJEdW1wVG9JbmZvKGVtYmVkZGVkUGxheWVyLmR1bXApO1xuICAgICAgICAgICAgICAgIHNlbGVjdEVtYmVkZGVkUGxheWVySW5mby5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgLi4uaW5mbyxcbiAgICAgICAgICAgICAgICAgICAgcmF3SW5mbzogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShpbmZvKSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxlY3RFbWJlZGRlZFBsYXllckluZm8ubGVuZ3RoICYmICh0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyA9IHNlbGVjdEVtYmVkZGVkUGxheWVySW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEVtYmVkZGVkUGxheWVySW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQuc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvID0gdGhhdC5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8uZmlsdGVyKChpbmZvKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdEdW1wID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLmdyb3VwVG9FbWJlZGRlZFBsYXllcnMhW2luZm8uZ3JvdXBdO1xuICAgICAgICAgICAgaWYgKCFuZXdEdW1wIHx8ICFuZXdEdW1wLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGR1bXAgPSB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJJbmZvVG9EdW1wKGluZm8sIHRydWUpO1xuICAgICAgICAgICAgY29uc3QgbmV3SW5mbyA9IG5ld0R1bXAuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBMb2Rhc2guaXNFcXVhbChpdGVtLCBkdW1wKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFuZXdJbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihpbmZvLCBuZXdJbmZvKTtcbiAgICAgICAgICAgIGluZm8ucmF3SW5mbyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobmV3SW5mbykpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeW9k+WJjemAieS4reWxnuaAp+i9qOmBk+aYr+WQpuWcqOacgOaWsOeahOaVsOaNruWGhVxuICAgICAqL1xuICAgIHB1YmxpYyBjaGVja1NlbGVjdFByb3BlcnR5KCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdFByb3BlcnR5IHx8ICF0aGF0LnNlbGVjdFByb3BEYXRhIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIU9iamVjdC5rZXlzKGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLnBhdGgydXVpZCkuaW5jbHVkZXModGhhdC5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aCkpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0UHJvcGVydHkgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbdGhhdC5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aF0gfHxcbiAgICAgICAgICAgICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbdGhhdC5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aF1bdGhhdC5zZWxlY3RQcm9wRGF0YS5wcm9wXVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0UHJvcGVydHkgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5b2T5YmN6YCJ5Lit5LqL5Lu25bin5pWw5o2u5piv5ZCm5Zyo5pyA5paw55qE5pWw5o2u5YaFXG4gICAgICovXG4gICAgcHVibGljIGNoZWNrU2VsZWN0RXZlbnRzKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEV2ZW50SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLmV2ZW50cykge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8gPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld0ZyYW1lcyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLmV2ZW50cy5tYXAoKGl0ZW06IGFueSkgPT4gaXRlbS5mcmFtZSk7XG4gICAgICAgIGlmICghbmV3RnJhbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RFdmVudEluZm8gPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkRnJhbWVzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgZnJhbWUgb2YgdGhhdC5zZWxlY3RFdmVudEluZm8uZnJhbWVzKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IG5ld0ZyYW1lcy5pbmRleE9mKGZyYW1lKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGVjdGVkRnJhbWVzLnB1c2goZnJhbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RlZEZyYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0RXZlbnRJbmZvLmZyYW1lcyA9IHNlbGVjdGVkRnJhbWVzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5b2T5YmN6YCJ5Lit5YWz6ZSu5bin5pWw5o2u5piv5ZCm5Zyo5pyA5paw55qE5pWw5o2u5YaFXG4gICAgICovXG4gICAgcHVibGljIGNoZWNrU2VsZWN0S2V5cygpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RLZXlJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXlGcmFtZXM6IElLZXlGcmFtZURhdGFbXSA9IFtdO1xuICAgICAgICB0aGF0LnNlbGVjdEtleUluZm8ua2V5RnJhbWVzLmZvckVhY2goKGRhdGE6IElLZXlGcmFtZURhdGEsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFtkYXRhLm5vZGVQYXRoXSB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFtkYXRhLm5vZGVQYXRoXVtkYXRhLnByb3BdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZGF0YUluZm8gPSB0aGF0LnNlbGVjdEtleUluZm8hLmtleUZyYW1lc1tpbmRleF07XG4gICAgICAgICAgICBjb25zdCBmcmFtZXMgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEucGF0aHNEdW1wW2RhdGEubm9kZVBhdGhdW2RhdGEucHJvcF0ua2V5RnJhbWVzLm1hcCgoZGF0YTogYW55KSA9PiBkYXRhLmZyYW1lKTtcbiAgICAgICAgICAgIGlmIChmcmFtZXMuaW5jbHVkZXMoZGF0YUluZm8uZnJhbWUpKSB7XG4gICAgICAgICAgICAgICAgZGF0YUluZm8ucmF3RnJhbWUgPSBkYXRhLmZyYW1lO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhSW5mby5vZmZzZXRGcmFtZTtcbiAgICAgICAgICAgICAgICBrZXlGcmFtZXMucHVzaChkYXRhSW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoa2V5RnJhbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhhdC5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb3J0RHVtcCA9IHNvcnRLZXlzVG9UcmVlTWFwKGtleUZyYW1lcyk7XG4gICAgICAgIC8vIOmHjee9rumAieS4reWFs+mUruW4p+aVsOaNrlxuICAgICAgICBPYmplY3QuYXNzaWduKHRoYXQuc2VsZWN0S2V5SW5mbywge1xuICAgICAgICAgICAga2V5RnJhbWVzLFxuICAgICAgICAgICAgc29ydER1bXAsXG4gICAgICAgICAgICBvZmZzZXRGcmFtZTogMCxcbiAgICAgICAgICAgIG9mZnNldDogMCxcbiAgICAgICAgICAgIHN0YXJ0WDogdGhhdC5zZWxlY3RLZXlJbmZvLnN0YXJ0WCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoYXQudXBkYXRlU2VsZWN0S2V5Kys7XG4gICAgfVxuXG4gICAgcmVzZXRTdGF0ZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIHRoaXMudXBkYXRlQ2xpcHMobnVsbCk7XG4gICAgICAgIHRoYXQuYW5pbWF0aW9uTW9kZSA9IGZhbHNlO1xuICAgICAgICB0aGF0LmFuaUNvbXBUeXBlID0gbnVsbDtcbiAgICAgICAgdGhhdC5jbGlwQ29uZmlnID0gbnVsbDtcbiAgICAgICAgdGhhdC5ub2RlRHVtcCA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC55o2u6I+c5Y2V6YWN572u55Sf5oiQ5a+55bqU55qE57yW6L6R5Zmo6I+c5Y2VXG4gICAgICogQHBhcmFtIG1lbnVEYXRhXG4gICAgICovXG4gICAgY2FsY0NyZWF0ZVByb3BNZW51KG1lbnVEYXRhOiBhbnkpIHtcbiAgICAgICAgbGV0IHJlc3VsdDogRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW10gPSBbXTtcbiAgICAgICAgaWYgKGlzTWVudUl0ZW0obWVudURhdGEpKSB7XG4gICAgICAgICAgICBjb25zdCBtZW51TmFtZSA9IG1lbnVEYXRhLm1lbnVOYW1lID8gbWVudURhdGEubWVudU5hbWUgOiBtZW51RGF0YS5kaXNwbGF5TmFtZTtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogbWVudU5hbWUsXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogIW1lbnVEYXRhLmRpc2FibGUsXG4gICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVQcm9wKG1lbnVEYXRhLmtleSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG1lbnVEYXRhKSkge1xuICAgICAgICAgICAgY29uc3QgaXRlbTogYW55ID0gbWVudURhdGFba2V5XTtcbiAgICAgICAgICAgIGlmIChpc01lbnVJdGVtKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzLmNhbGNDcmVhdGVQcm9wTWVudShpdGVtKSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGtleSxcbiAgICAgICAgICAgICAgICBzdWJtZW51OiB0aGlzLmNhbGNDcmVhdGVQcm9wTWVudShpdGVtKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu65p+Q5Liq5bGe5oCn6L2o6YGTXG4gICAgICogQHBhcmFtIHByb3BcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZVByb3AocHJvcDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBtdWx0aSA9IGZhbHNlO1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKHRoYXQuc2VsZWN0ZWRJZHMgJiYgdGhhdC5zZWxlY3RlZElkcy5zaXplID4gMSkge1xuICAgICAgICAgICAgbGV0IHV1aWRzOiBzdHJpbmdbXSA9IEFycmF5LmZyb20odGhhdC5zZWxlY3RlZElkcyk7XG4gICAgICAgICAgICAvLyDpgInkuK3oioLngrnlj6/og73kuI3lnKjliqjnlLvoioLngrnlhoVcbiAgICAgICAgICAgIHV1aWRzID0gdXVpZHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAhLnV1aWQycGF0aFt1dWlkXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHV1aWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLmluZm8oRWRpdG9yLkkxOG4udCgnYW5pbWF0b3IuaXNfYWRkX3Byb3BfbXVsdGkudGl0bGUnKSwge1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSTE4bi50KCdhbmltYXRvci5pc19hZGRfcHJvcF9tdWx0aS5hZGRfdG9fY3VycmVudCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYW5pbWF0b3IuaXNfYWRkX3Byb3BfbXVsdGkuYWRkX3RvX2FsbCcpLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IC0xLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2UgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbXVsdGkgPSAhIXJlc3VsdC5yZXNwb25zZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhbmltYXRpb25DdHJsLmNyZWF0ZVByb3AoeyBwcm9wOiBwcm9wIH0sIG11bHRpKTtcbiAgICB9XG5cbiAgICBhc3luYyB1cGRhdGVTZWxlY3RlZElkKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdGVkSWQgJiYgdGhhdC5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGF0LnNlbGVjdGVkSWQpIHtcbiAgICAgICAgICAgIHRoYXQucm9vdCA9ICcnO1xuICAgICAgICAgICAgdGhpcy5yZXNldFN0YXRlKCk7XG4gICAgICAgICAgICB0aGF0LnByb3BlcnRpZXNNZW51ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQucHJvcGVydGllc01lbnUgPSBhd2FpdCBJcXVlcnlQcm9wZXJ0aWVzTWVudSh0aGF0LnNlbGVjdGVkSWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQucHJvcGVydGllcyA9IHRoaXMuY2FsY1Byb3BlcnR5KCk7XG4gICAgICAgIHRoaXMuanVtcFRvU2VsZWN0ZWROb2RlKCk7XG4gICAgfVxuXG4gICAganVtcFRvU2VsZWN0ZWROb2RlKCkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm9kZXNEdW1wID0gYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAubm9kZXNEdW1wIHx8IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzO1xuICAgICAgICBjb25zdCBpbmRleCA9IG5vZGVzRHVtcC5maW5kSW5kZXgoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udXVpZCA9PT0gdGhhdC5zZWxlY3RlZElkICYmIHR5cGVvZiBpdGVtLmxpc3RJbmRleCA9PT0gJ251bWJlcic7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5bCG6IqC54K55YiX6KGo5rua5Yqo5Yiw5Lit6Ze05L2N572uXG4gICAgICAgIGNvbnN0IHNlbGVjdEhlaWdodCA9IChub2Rlc0R1bXBbaW5kZXhdLmxpc3RJbmRleCArIDEpICogdGhpcy5MSU5FX0hFSUdIVDtcbiAgICAgICAgY29uc3QgeyB0b3AsIGhlaWdodCB9ID0gdGhhdC5ub2RlU2Nyb2xsSW5mbyE7XG4gICAgICAgIGlmIChzZWxlY3RIZWlnaHQgLSB0b3AgPiBoZWlnaHQgfHwgc2VsZWN0SGVpZ2h0IC0gdG9wIDwgMCkge1xuICAgICAgICAgICAgLy8g6K6h566X55qE5pyA57uIIHRvcCDlgLzlrZjlnKjml7bpg73opoEgKyB0aGlzLkxJTkVfSEVJR0hUIOmBv+WFjeWcqOW6lemDqOaYvuekuuS4jeWFqFxuICAgICAgICAgICAgdGhhdC5ub2RlU2Nyb2xsSW5mbyEudG9wID0gRWRpdG9yLlV0aWxzLk1hdGguY2xhbXAoc2VsZWN0SGVpZ2h0IC0gaGVpZ2h0IC8gMiwgMCwgKG5vZGVzRHVtcC5sZW5ndGggKyAxKSAqIHRoaXMuTElORV9IRUlHSFQgLSBoZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5jYWxjRGlzcGxheUNsaXBzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDorqHnrpfmoYbpgInnmoTmlbDmja7kv6Hmga9cbiAgICBjYWxjQm94U3R5bGUoKSB7XG4gICAgICAgIGNvbnN0IHZtID0gdGhpcy52bTtcbiAgICAgICAgaWYgKCF2bS5ib3hJbmZvIHx8ICF2bS5ib3hJbmZvLnR5cGUgfHwgdm0ubG9jaykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBzdGFydFgsIHN0YXJ0WSwgdHlwZSwgeCwgeSB9ID0gdm0uYm94SW5mbztcbiAgICAgICAgY29uc3QgcG9pbnQgPSBncmlkQ3RybC5wYWdlVG9DdHJsKHgsIHkpO1xuICAgICAgICAvLyDlhYjmiorpvKDmoIfnp7vliqjnmoTngrnmjqfliLbovazljJbkuLrlvZPliY3kuI5p5YaF6ZyA5qGG6YCJ55qE6IyD5Zu05LmL5YaFXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgeyBvZmZzZXRUb3AsIG9mZnNldEhlaWdodCwgb2Zmc2V0V2lkdGggfSA9IHZtLiRyZWZzW2Ake3R5cGV9LWNvbnRlbnRgXTtcbiAgICAgICAgY29uc3QgZW5kWCA9IEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKHBvaW50LngsIDAsIG9mZnNldFdpZHRoKTtcbiAgICAgICAgY29uc3QgZW5kWSA9IEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKHBvaW50LnksIG9mZnNldFRvcCwgb2Zmc2V0VG9wICsgb2Zmc2V0SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgdyA9IHN0YXJ0WCAtIGVuZFg7XG4gICAgICAgIGNvbnN0IGggPSBzdGFydFkgLSBlbmRZO1xuICAgICAgICAvLyDlrr3pq5jkuIDkuKrkuLogMCDov5Tlm55cbiAgICAgICAgaWYgKCF3IHx8ICFoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcmlnaW46IGFueSA9IHt9O1xuICAgICAgICBpZiAodyA+IDAgJiYgaCA+IDApIHtcbiAgICAgICAgICAgIC8vIOW+gOW3puS4iuinkuenu+WKqFxuICAgICAgICAgICAgb3JpZ2luLnggPSBlbmRYO1xuICAgICAgICAgICAgb3JpZ2luLnkgPSBlbmRZIC0gb2Zmc2V0VG9wO1xuICAgICAgICB9IGVsc2UgaWYgKHcgPCAwICYmIGggPCAwKSB7XG4gICAgICAgICAgICAvLyDlj7PkuIvop5Lnp7vliqhcbiAgICAgICAgICAgIG9yaWdpbi54ID0gc3RhcnRYO1xuICAgICAgICAgICAgb3JpZ2luLnkgPSBzdGFydFkgLSBvZmZzZXRUb3A7XG4gICAgICAgIH0gZWxzZSBpZiAodyA8IDAgJiYgaCA+IDApIHtcbiAgICAgICAgICAgIC8vIOW3puS4i+inklxuICAgICAgICAgICAgb3JpZ2luLnggPSBzdGFydFg7XG4gICAgICAgICAgICBvcmlnaW4ueSA9IGVuZFkgLSBvZmZzZXRUb3A7XG4gICAgICAgIH0gZWxzZSBpZiAodyA+IDAgJiYgaCA8IDApIHtcbiAgICAgICAgICAgIC8vIOWPs+S4i+inklxuICAgICAgICAgICAgb3JpZ2luLnggPSBlbmRYO1xuICAgICAgICAgICAgb3JpZ2luLnkgPSBzdGFydFkgLSBvZmZzZXRUb3A7XG4gICAgICAgIH1cbiAgICAgICAgdm0uYm94RGF0YSA9IHtcbiAgICAgICAgICAgIG9yaWdpbixcbiAgICAgICAgICAgIHc6IE1hdGguYWJzKHcpLFxuICAgICAgICAgICAgaDogTWF0aC5hYnMoaCksXG4gICAgICAgICAgICB0eXBlOiB2bS5ib3hJbmZvLnR5cGUsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IGAke29yaWdpbi55fXB4YCxcbiAgICAgICAgICAgIGxlZnQ6IGAke29yaWdpbi54fXB4YCxcbiAgICAgICAgICAgIHJpZ2h0OiBgJHtNYXRoLnJvdW5kKG9mZnNldFdpZHRoIC0gb3JpZ2luLnggLSBNYXRoLmFicyh3KSl9cHhgLFxuICAgICAgICAgICAgYm90dG9tOiBgJHtNYXRoLnJvdW5kKG9mZnNldEhlaWdodCAtIG9yaWdpbi55IC0gTWF0aC5hYnMoaCkpfXB4YCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB1cGRhdGVQbGF5U3RhdGUoc3RhdGU6IEFuaW1hdGlvblN0YXRlKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIEFuaW1hdGlvblN0YXRlLlNUT1A6XG4gICAgICAgICAgICAgICAgdGhhdC5hbmltYXRpb25TdGF0ZSA9ICdzdG9wJztcbiAgICAgICAgICAgICAgICB0aGlzLmFuaVBsYXlUYXNrICYmIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuYW5pUGxheVRhc2spO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDdXJyZW50VGltZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBbmltYXRpb25TdGF0ZS5QTEFZOlxuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25DdHJsLmFuaW1hdGlvblN0YXRlICE9PSAncGxheScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgSW52YWxpZCBhbmltYXRpb24gc3RhdGUgY2hhbmdlLiAoJHthbmltYXRpb25DdHJsLmFuaW1hdGlvblN0YXRlfSAtPiBwbGF5KSlgKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmFuaW1hdGlvblN0YXRlICE9PSAncGxheScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5hbmltYXRpb25TdGF0ZSA9ICdwbGF5JztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5Qb2ludGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBbmltYXRpb25TdGF0ZS5QQVVTRTpcbiAgICAgICAgICAgICAgICB0aGF0LmFuaW1hdGlvblN0YXRlID0gJ3BhdXNlJztcbiAgICAgICAgICAgICAgICB0aGlzLmFuaVBsYXlUYXNrICYmIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuYW5pUGxheVRhc2spO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY2hlY2tDdXJyZW50VGltZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGNvbnN0IHRpbWUgPSBhd2FpdCBJcXVlcnlQbGF5aW5nQ2xpcFRpbWUodGhhdC5jdXJyZW50Q2xpcCk7XG4gICAgICAgIGNvbnN0IG5ld0ZyYW1lID0gdGltZVRvRnJhbWUodGltZSwgdGhhdC5zYW1wbGUpO1xuICAgICAgICBpZiAobmV3RnJhbWUgPT09IHRoYXQuY3VycmVudEZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRDdXJyZW50RnJhbWUobmV3RnJhbWUpO1xuICAgIH1cblxuICAgIC8vIOabtOaWsOagueiKgueCueaVsOaNrlxuICAgIHB1YmxpYyB1cGRhdGVSb290KG5vZGVJbmZvOiBhbnkpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIC8vIOW9k+WJjeiKgueCueacqua3u+WKoOWKqOeUu+e7hOS7tlxuICAgICAgICAvLyBjb25zdCBkdW1wID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJywgdXVpZCk7XG4gICAgICAgIC8vIGlmICghZHVtcCkge1xuICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmICghbm9kZUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDmoLnoioLngrnlkI3np7DkuLrnqbpcbiAgICAgICAgaWYgKG5vZGVJbmZvLm5hbWUgPT09ICcnIHx8IG5vZGVJbmZvLmlzU2NlbmUpIHtcbiAgICAgICAgICAgIHRoYXQuc2VsZWN0ZWRJZCA9ICcnO1xuICAgICAgICAgICAgdGhhdC5yb290ID0gJyc7XG4gICAgICAgICAgICB0aGF0Lm5vZGVEdW1wID0gbnVsbDtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wID0gbnVsbDtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCA9IGZvcm1hdE5vZGVEdW1wKG5vZGVJbmZvKTtcbiAgICAgICAgLy8gdGhhdC5hY3RpdmUgPSBub2RlSW5mby5hY3RpdmU7XG4gICAgICAgIC8vIGlmICghbm9kZUluZm8uYWN0aXZlKSB7XG4gICAgICAgIHRoYXQubm9kZUR1bXAgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzKSk7XG4gICAgICAgIC8vICAgICByZXR1cm47XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICAvLyDmm7TmlrAgY2xpcCDmlbDmja5cbiAgICBhc3luYyB1cGRhdGVDbGlwcyhjbGlwSW5mbzogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCwgdHlwZT86IHN0cmluZykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgLy8g5b2T5YmN57yW6L6RIGNsaXAg5LiN5a2Y5Zyo6ZyA6KaB6YCA5Ye65Yqo55S757yW6L6R5qih5byPXG4gICAgICAgIGlmICh0aGF0Lm5vZGVEdW1wICYmICF0aGF0LmFjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5jbGVhckNsaXBzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5b2T5YmN57yW6L6RIGNsaXAg5LiN5a2Y5Zyo6ZyA6KaB6YCA5Ye65Yqo55S757yW6L6R5qih5byPXG4gICAgICAgIC8vIEZJWE1FOiDnlLHkuo4gc2NlbmUgY2xvc2Ug5LiOIG5vZGUgY2hhbmdlIOS6i+S7tueahOebuOS6kuS9nOeUqO+8jOWvvOiHtOWcqOmAgOWHuuWKqOeUu+e8lui+keaooeW8j+aXtu+8jOS8mui1sOWFpeS4i+aWuSBxdWVyeUNsaXBEdW1wIOeahOWIhuaUr++8jFxuICAgICAgICAvLyDogIzmraTml7Ygcm9vdO+8jGN1cnJlbnRDbGlwIOmDveS4uuepuuOAguaaguaXtumAmui/h+WinuWKoOWIpOaWreinhOmBv++8jOacrOi0qOS4iuaYr+W8guatpeaXtuW6j+mAu+i+keS4jeWkn+WBpeWjrlxuICAgICAgICBpZiAoIWNsaXBJbmZvIHx8IHRoYXQucm9vdCA9PT0gJycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgUm9vdCgke3RoYXQucm9vdH0pIG9yIGNsaXBJbmZvKCR7Y2xpcEluZm99KSBpcyBlbXB0eSFgKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDbGlwcygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjbGlwRHVtcDogRWRpdG9yQW5pbWF0aW9uQ2xpcER1bXAgfCBudWxsIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBhbmltYXRpb25DbGlwQ2FjaGVNYW5hZ2VyLmNhY2hlQ2xpcER1bXAodGhhdC5yb290LCB0aGF0LmN1cnJlbnRDbGlwKTtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGlwSW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICh0aGF0LmN1cnJlbnRDbGlwID09PSBjbGlwSW5mbyAmJiB0eXBlICE9PSAndXBkYXRlJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUudGltZSgnSXF1ZXJ5Q2xpcER1bXAnKTtcbiAgICAgICAgICAgIGNsaXBEdW1wID0gYXdhaXQgSXF1ZXJ5Q2xpcER1bXAodGhhdC5yb290LCBjbGlwSW5mbyk7XG4gICAgICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0lxdWVyeUNsaXBEdW1wJyk7XG4gICAgICAgICAgICBpZiAoIWNsaXBEdW1wICYmICFGbGFncy5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlZnJlc2hUYXNrKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFjbGlwRHVtcCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgR2V0IGFuaW1hdGlvbiBjbGlwIGRhdGEgZmFpbGVkISBub2RlICR7dGhhdC5yb290fSwgY2xpcCAke3RoYXQuY3VycmVudENsaXB9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckNsaXBzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5Y+q5pyJ5Yqo55S75pWw5o2u6I635Y+W5oiQ5Yqf5ZCO5omN6IO95pu05paw5b2T5YmN6YCJ5LitIGNsaXBcbiAgICAgICAgICAgIHRoYXQuY3VycmVudENsaXAgPSBjbGlwSW5mbztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2xpcER1bXApIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wID0gT2JqZWN0LmFzc2lnbihmb3JtYXRDbGlwRHVtcChjbGlwRHVtcCksIHsgdXVpZDogdGhhdC5jdXJyZW50Q2xpcCB9KTtcbiAgICAgICAgICAgIGlmIChjbGlwRHVtcC5zYW1wbGUgIT09IGdyaWRDdHJsLmdyaWQ/LnNhbXBsZSkge1xuICAgICAgICAgICAgICAgIGdyaWRDdHJsLmdyaWQhLnNhbXBsZSA9IGNsaXBEdW1wLnNhbXBsZTtcbiAgICAgICAgICAgICAgICBncmlkQ3RybC5ncmlkIS5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRpbWVBeGlzKCk7XG4gICAgICAgICAgICAgICAgLy8g5pu05paw5b2T5YmN5o6n5Yi25p2G5YWz6ZSu5bin55qE5pi+56S6XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhhbmltYXRpb25DdHJsLmNsaXBDb25maWcpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLmNsaXBDb25maWdba2V5XSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wW2tleV0gPz8gYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnW2tleV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoYXQuY2xpcENvbmZpZyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYW5pbWF0aW9uQ3RybC5jbGlwQ29uZmlnKSk7XG4gICAgICAgICAgICBpZiAodGhhdC5jbGlwQ29uZmlnICYmIHRoYXQuY2xpcENvbmZpZy5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld01pbiA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICB0aGF0LiRyZWZzLmNoYXJ0Lm9mZnNldFdpZHRoIC8gKHRoYXQuY2xpcENvbmZpZy5kdXJhdGlvbiAqIHRoYXQuY2xpcENvbmZpZy5zYW1wbGUgKiAyKSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkQ3RybC5ncmlkIS54TWluU2NhbGUsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdNYXggPSBNYXRoLm1heCh0aGF0LmNsaXBDb25maWcuZHVyYXRpb24gKiB0aGF0LmNsaXBDb25maWcuc2FtcGxlLCB0aGlzLmdyaWRDdHJsLmdyaWQhLnhNYXhTY2FsZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkQ3RybC5ncmlkIS51cGRhdGVTY2FsZShuZXdNaW4sIG5ld01heCk7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyDlj6/lnKjnvJbovpHlmajlhoXmj5DkvpvkuIDplK7mgaLlpI3liLDmnIDkvbPnvKnmlL7mr5TkvovvvIjlj6/ku6XnnIvop4Hlhajpg6jlhbPplK7luKfvvIlcbiAgICAgICAgICAgICAgICAvLyDlj6/ku6Xmj5Dkvpsgc2xpZGVyIOe7hOS7tuaOp+WItue8qeaUvuavlOS+i1xuICAgICAgICAgICAgICAgIC8vIGFuaW1hdGlvbkVkaXRvci5ncmlkQ3RybC5ncmlkIS54QXhpc1NjYWxlID0gYW5pbWF0aW9uRWRpdG9yLnNjYWxlUmFuZ2UubWluO1xuICAgICAgICAgICAgICAgIC8vIGFuaW1hdGlvbkVkaXRvci5ncmlkQ3RybC5ncmlkIS5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQuaXNTa2VsZXRvbkNsaXAgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5pc1NrZWxldG9uID09PSB0cnVlO1xuICAgICAgICAgICAgdGhhdC5zaG93VXNlQmFrZWRBbmltYXRpb25XYXJuID0gdGhhdC5pc1NrZWxldG9uQ2xpcCAmJiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC51c2VCYWtlZEFuaW1hdGlvbjtcbiAgICAgICAgICAgIHRoYXQuZXhwYW5kTGF5b3V0LmF1eGlsaWFyeUN1cnZlID0gdGhhdC5pc1NrZWxldG9uQ2xpcDsgLy8g6aqo6aq85Yqo55S76buY6K6k5bGV5byAXG4gICAgICAgICAgICBhd2FpdCB0aGF0LmNhbGNTZWxlY3RQcm9wZXJ0eShudWxsLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbGNFdmVudHNEdW1wKCk7XG4gICAgICAgIHRoaXMuY2FsY05vZGVzKCk7XG4gICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlDbGlwcygpO1xuICAgICAgICB0aGF0LnByb3BlcnRpZXMgPSB0aGlzLmNhbGNQcm9wZXJ0eSgpO1xuICAgICAgICB0aGlzLmNhbGNBdXhpbGlhcnlDdXJ2ZXMoKTtcbiAgICAgICAgdGhpcy5jaGVja1NlbGVjdERhdGEoKTtcbiAgICAgICAgdGhhdC51cGRhdGVLZXlGcmFtZSsrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW9k+WJjeaXoOWKqOeUu+aVsOaNru+8jOa4heepuuaVsOaNrueKtuaAgVxuICAgICAqL1xuICAgIGNsZWFyQ2xpcHMoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdGhhdC5hdXhDdXJ2ZVN0b3JlO1xuICAgICAgICB0aGF0LmN1cnJlbnRDbGlwID0gJyc7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwuZXhpdCgpO1xuICAgICAgICBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCA9IG51bGw7XG4gICAgICAgIHRoYXQuY2xpcENvbmZpZyA9IG51bGw7XG4gICAgICAgIHRoYXQuZXZlbnRzRHVtcCA9IG51bGw7XG4gICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlDbGlwcygpO1xuICAgICAgICB0aGF0LnByb3BlcnRpZXMgPSB0aGlzLmNhbGNQcm9wZXJ0eSgpO1xuICAgICAgICBhdXhDdXJ2ZVN0b3JlLnJlc2V0KCk7XG4gICAgICAgIHRoYXQuZW1iZWRkZWRQbGF5ZXJHcm91cHMgPSBbXTtcbiAgICAgICAgdGhpcy5jaGVja1NlbGVjdERhdGEoKTtcbiAgICAgICAgdGhhdC51cGRhdGVLZXlGcmFtZSsrO1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxjUHJvcGVydHkoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICF0aGF0LmNvbXB1dGVTZWxlY3RQYXRoIHx8ICFncmlkQ3RybC5ncmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt0aGF0LmNvbXB1dGVTZWxlY3RQYXRoXTtcbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaCgobmFtZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BEYXRhOiBJUHJvcERhdGEgPSBkYXRhW25hbWVdO1xuICAgICAgICAgICAgbGV0IHBhcmVudERhdGEgPSBwcm9wRGF0YTtcbiAgICAgICAgICAgIC8vIGRhdGFbbmFtZV1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YVtuYW1lXS5wYXJlbnRQcm9wS2V5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHBhcmVudERhdGEgPSBkYXRhW2RhdGFbbmFtZV0ucGFyZW50UHJvcEtleV07XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRJbmRleCA9IHBhcmVudERhdGEucGFydEtleXMuZmluZEluZGV4KChrZXkpID0+IGtleSA9PT0gcHJvcERhdGEucHJvcCk7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkSW5kZXggIT09IC0xICYmIHByb3BEYXRhLmlzQ3VydmVTdXBwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BEYXRhLmNvbG9yID0gQ3VydmVDb2xvckxpc3RbY2hpbGRJbmRleF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWIneWni+WMluaKmOWPoOWxleW8gOS/oeaBr+iusOW9lVxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmV4cGFuZEluZm9bcGFyZW50RGF0YS5wcm9wXSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmV4cGFuZEluZm9bcGFyZW50RGF0YS5wcm9wXSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBkYXRhW25hbWVdLmhpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wRGF0YS50eXBlICYmIHByb3BEYXRhLmlzQ3VydmVTdXBwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BEYXRhLmNvbG9yID0gQ3VydmVDb2xvckxpc3RbM107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGF0YVtuYW1lXS5pbmRleCA9IE1hdGgubWF4KDAsIGkgLSAxKTtcbiAgICAgICAgICAgIC8vIOiuoeeul+i9qOmBk+mrmOW6plxuICAgICAgICAgICAgZGF0YVtuYW1lXS50b3AgPSAoaSAtIDEpICogdGhpcy5MSU5FX0hFSUdIVDtcbiAgICAgICAgICAgIC8vIOWIhumHj+i9qOmBk+S4jeWcqOWxnuaAp+iPnOWNleWGhe+8jOmcgOimgeS9v+eUqOeItui9qOmBk+S/oeaBr+WIpOaWreaYr+WQpiBtaXNzaW5nXG4gICAgICAgICAgICBpZiAodGhhdC5wcm9wZXJ0aWVzTWVudSAmJiAhY2hlY2tQcm9wZXJ0eUluTWVudShwYXJlbnREYXRhLCB0aGF0LnByb3BlcnRpZXNNZW51KSkge1xuICAgICAgICAgICAgICAgIC8vIOWxnuaAp+S4ouWksVxuICAgICAgICAgICAgICAgIGRhdGFbbmFtZV0ubWlzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBwcm9wRGF0YS5rZXlGcmFtZXNcbiAgICAgICAgICAgICAgICA9IE9iamVjdC5mcmVlemUoY2FsY0ZyYW1lcyhwcm9wRGF0YS5rZXlGcmFtZXMsIHRoYXQuJHJlZnMuY2hhcnQub2Zmc2V0V2lkdGgsIHRoaXMuaW1hZ2VDQ1R5cGVzLmluY2x1ZGVzKHByb3BEYXRhLnR5cGUgJiYgcHJvcERhdGEudHlwZS52YWx1ZSkpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNBdXhpbGlhcnlDdXJ2ZXMoKSB7XG4gICAgICAgIGNvbnN0IGF1eEN1cnZlU3RvcmUgPSB0aGlzLnZtLmF1eEN1cnZlU3RvcmU7XG4gICAgICAgIGF1eEN1cnZlU3RvcmUuY2FsY0N1cnZlcyhcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wPy5kaXNwbGF5QXV4aWxpYXJ5Q3VydmVzID8/IFtdLFxuICAgICAgICAgICAgdGhpcy52bS4kcmVmcy5jaGFydC5vZmZzZXRXaWR0aCxcbiAgICAgICAgKTtcbiAgICAgICAgYXV4Q3VydmVTdG9yZS5mb3JjZUR1bXBVcGRhdGUoKTtcbiAgICB9XG5cbiAgICAvLyDorqHnrpfmmL7npLrnmoQgZXZlbnQg5L2N572uXG4gICAgcHJpdmF0ZSBjYWxjRXZlbnRzRHVtcCgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGxldCByZXN1bHQ6IGFueVtdID0gW107XG4gICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNsaXBzRHVtcCAmJiBncmlkQ3RybC5ncmlkKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5ldmVudHMubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpdGVtLnggPSBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGl0ZW0uZnJhbWUpIC0gZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAodGhhdC5ldmVudHNEdW1wID0gT2JqZWN0LmZyZWV6ZShyZXN1bHQpKTtcbiAgICB9XG5cbiAgICAvLyDono3lkIjoioLngrnmlbDmja7kuI4gY2xpcCDmlbDmja5cbiAgICBwdWJsaWMgY2FsY05vZGVzKCkge1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGF0aHMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KE9iamVjdC5rZXlzKGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLnBhdGgydXVpZCkpKTtcbiAgICAgICAgYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAubm9kZXNEdW1wID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2RlcykpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZE5vZGVUZW1wbGF0ZShwYXRoOiBzdHJpbmcsIG1pc3NpbmcgPSBmYWxzZSkge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hzID0gcGF0aC5tYXRjaCgvXFwvL2cpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0aW1lcyA9IG1hdGNocy5sZW5ndGg7XG4gICAgICAgICAgICBsZXQgaW5kZXggPSBwYXRocy5maW5kSW5kZXgoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLm1hdGNoKC9cXC8vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0ubWF0Y2goL1xcLy9nKS5sZW5ndGggPT09IHRpbWVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVNYXRjaHMgPSBwYXRoLm1hdGNoKC9cXC8oW14vXSopJC8pO1xuICAgICAgICAgICAgaWYgKCFuYW1lTWF0Y2hzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5Lii5aSx6IqC54K55LiO5qC56IqC54K55ZCM57qn5pe277yM5pS+572u5Zyo5qC56IqC54K55LmL5ZCOXG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDmnKrmib7liLDkuI7kuKLlpLHoioLngrnlkIznuqfoioLngrnml7bvvIzlsIbkuKLlpLHoioLngrnnm7TmjqXmlL7nva7lnKjoioLngrnmnIDlkI5cbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyDpnIDopoHooaXlhajniLboioLngrnmmL7npLrlnKjnlYzpnaLkuIpcbiAgICAgICAgICAgICAgICBpbmRleCA9IHBhdGhzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnROb2RlcyA9IHBhdGgubWF0Y2goL1xcLyhbXi9dKykvZyk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGVzICYmICFtaXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXJyZW50UGF0aCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgcGFyZW50Tm9kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoICs9IG5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aHMuaW5jbHVkZXMoY3VycmVudFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGROb2RlVGVtcGxhdGUoY3VycmVudFBhdGgsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDmib7liLDkuI7kuKLlpLHoioLngrnlkIznuqfoioLngrnvvIzliJnnm7TmjqXmlL7lnKjor6XlkIznuqfoioLngrnkuYvlkI5cbiAgICAgICAgICAgIHBhdGhzLnNwbGljZShpbmRleCwgMCwgcGF0aCk7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLm5vZGVzRHVtcCEubm9kZXNEdW1wLnNwbGljZShpbmRleCwgMCwge1xuICAgICAgICAgICAgICAgIGluZGVudDogdGltZXMgKiAyLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgbmFtZTogbmFtZU1hdGNoc1sxXSxcbiAgICAgICAgICAgICAgICB1dWlkOiAnJyxcbiAgICAgICAgICAgICAgICBrZXlGcmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgICAgICByYXdJbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgICAgbGlzdEluZGV4OiBpbmRleCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWkhOeQhuS4ouWkseiKgueCueaVsOaNrlxuICAgICAgICBmb3IgKGNvbnN0IHBhdGggb2YgT2JqZWN0LmtleXMoYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wKSkge1xuICAgICAgICAgICAgaWYgKHBhdGhzLmluZGV4T2YocGF0aCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGROb2RlVGVtcGxhdGUocGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyDmm7TmlrDnjrDmnInnmoTmu5rliqjojIPlm7TlhoXnmoTmmL7npLroioLngrnmlbDmja7vvIjljIXmi6zlhbPplK7luKfvvIlcbiAgICBwdWJsaWMgY2FsY0Rpc3BsYXlOb2RlcygpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXApIHtcbiAgICAgICAgICAgIHRoYXQubm9kZUR1bXAgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGVzRHVtcCA9IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzRHVtcCB8fCBhbmltYXRpb25DdHJsLm5vZGVzRHVtcC5ub2RlcztcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBbXTtcbiAgICAgICAgLy8g6K6w5b2V5a6e6ZmF6ZyA6KaB5Y+C5LiO5Yik5pat5piv5ZCm5Zyo5Y+v6KeG5Yy65Z+f55qE6IqC54K5IGluZGV477yM5rua5Yqo5p2h5L2N572u5piv6ZKI5a+56L+H5ruk5ZCO6IqC54K555qE5L2N572u6K6h566X6ICM5LiN5piv5YWo6YOo6IqC54K5XG4gICAgICAgIGxldCBsaXN0SW5kZXggPSAtMTtcbiAgICAgICAgY29uc3QgaGFzRmlsdGVyID0gdGhhdC5maWx0ZXJJbnZhbGlkIHx8IHRoYXQuZmlsdGVyTmFtZTtcbiAgICAgICAgbm9kZXNEdW1wLmZvckVhY2goKGl0ZW06IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgZGVsZXRlIGl0ZW0ubGlzdEluZGV4O1xuICAgICAgICAgICAgZGVsZXRlIGl0ZW0udG9wO1xuICAgICAgICAgICAgZGVsZXRlIGl0ZW0ucmF3SW5kZXg7XG4gICAgICAgICAgICBpZiAoaGFzRmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmICh0aGF0LmZpbHRlck5hbWUgJiYgIW5ldyBSZWdFeHAodGhhdC5maWx0ZXJOYW1lLCAnaScpLnRlc3QoaXRlbS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmZpbHRlckludmFsaWQgJiYgKCFpdGVtLmtleUZyYW1lcyB8fCAhaXRlbS5rZXlGcmFtZXMubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW0uaGlkZGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGlzdEluZGV4Kys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpc3RJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb2Zmc2V0SGVpZ2h0ID0gbGlzdEluZGV4ICogdGhpcy5MSU5FX0hFSUdIVCAtIHRoYXQubm9kZVNjcm9sbEluZm8hLnRvcDtcbiAgICAgICAgICAgIGl0ZW0udG9wID0gbGlzdEluZGV4ICogdGhpcy5MSU5FX0hFSUdIVDtcbiAgICAgICAgICAgIGl0ZW0ucmF3SW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGl0ZW0ubGlzdEluZGV4ID0gbGlzdEluZGV4O1xuICAgICAgICAgICAgaWYgKG9mZnNldEhlaWdodCA+IC10aGlzLkxJTkVfSEVJR0hUICYmIG9mZnNldEhlaWdodCA8IHRoYXQubm9kZVNjcm9sbEluZm8hLmhlaWdodCArIHRoaXMuTElORV9IRUlHSFQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICBpdGVtLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgbm9kZXNIZWlnaHQgPSBoYXNGaWx0ZXIgPyBsaXN0SW5kZXggKiB0aGlzLkxJTkVfSEVJR0hUIDogbm9kZXNEdW1wLmxlbmd0aCAqIHRoaXMuTElORV9IRUlHSFQ7XG4gICAgICAgIHRoYXQubm9kZXNIZWlnaHQgPSBNYXRoLmZsb29yKG5vZGVzSGVpZ2h0KTtcbiAgICAgICAgYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAuZGlzcGxheU5vZGVzRHVtcCA9IHJlc3VsdDtcbiAgICAgICAgdGhhdC5ub2RlRHVtcCA9IHJlc3VsdDtcbiAgICAgICAgaWYgKE1hdGguYWJzKHRoYXQubm9kZVNjcm9sbEluZm8hLnRvcCAtIHRoYXQuJHJlZnMubm9kZXMuc2Nyb2xsVG9wKSA+IHRoaXMuTElORV9IRUlHSFQpIHtcbiAgICAgICAgICAgIHRoYXQuJHJlZnMubm9kZXMuc2Nyb2xsVG9wID0gdGhhdC5ub2RlU2Nyb2xsSW5mbyEudG9wO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5pu05paw546w5pyJ55qE5pi+56S655qE5bGe5oCn6L2o6YGT5pWw5o2uXG4gICAgcHVibGljIGNhbGNEaXNwbGF5Q2xpcHMoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtO1xuICAgICAgICBpZiAoIXRoYXQubm9kZUR1bXAgfHwgIWFuaW1hdGlvbkN0cmwubm9kZXNEdW1wIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCB8fCAhYW5pbWF0aW9uQ3RybC5ub2Rlc0R1bXAubm9kZXNEdW1wKSB7XG4gICAgICAgICAgICB0aGF0LmNsaXBDb25maWcgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jYWxjRGlzcGxheU5vZGVzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGNEaXNwbGF5RW1iZWRkZWRQbGF5ZXJzKCk7XG4gICAgICAgIC8vIFRPRE8gc2hvd0FuaW1FbWJlZGRlZFBsYXllciA9IHRydWUg5pe26L+Z5q6155CG6K665LiK5piv5aSa5L2Z55qEXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzRHVtcC5mb3JFYWNoKChpdGVtOiBJTm9kZUluZm8pID0+IHtcbiAgICAgICAgICAgIHJlc3VsdFtpdGVtLnBhdGhdID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFtpdGVtLnBhdGhdO1xuICAgICAgICAgICAgaWYgKCFpdGVtLmRpc2FibGVkICYmIHJlc3VsdFtpdGVtLnBhdGhdKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5rZXlGcmFtZXMgPSBPYmplY3QuZnJlZXplKEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5jYWxjTm9kZUZyYW1lcyhpdGVtLnBhdGgpKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhhdC5ub2RlRHVtcCA9IGFuaW1hdGlvbkN0cmwubm9kZXNEdW1wLm5vZGVzRHVtcDtcbiAgICAgICAgYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAuZGlzcGxheUNsaXBzRHVtcCA9IHJlc3VsdDtcbiAgICAgICAgdGhpcy5jYWxjRGlzcGxheU5vZGVzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGNEaXNwbGF5RW1iZWRkZWRQbGF5ZXJzKCkge1xuICAgICAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5ncm91cFRvRW1iZWRkZWRQbGF5ZXJzIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5lbWJlZGRlZFBsYXllckdyb3Vwcykge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkUGxheWVyR3JvdXBzOiBJRW1iZWRkZWRQbGF5ZXJHcm91cFtdID0gW107XG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLmVtYmVkZGVkUGxheWVyR3JvdXBzLmZvckVhY2goKGdyb3VwKSA9PiB7XG4gICAgICAgICAgICBsZXQgZW1iZWRkZWRQbGF5ZXJzOiBJRW1iZWRkZWRQbGF5ZXJJbmZvW10gPSBbXTtcbiAgICAgICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNsaXBzRHVtcCEuZ3JvdXBUb0VtYmVkZGVkUGxheWVyc1tncm91cC5rZXldKSB7XG4gICAgICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXJzID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLmdyb3VwVG9FbWJlZGRlZFBsYXllcnNbZ3JvdXAua2V5XS5tYXAoKGVtYmVkZGVkUGxheWVyKSA9PiB0aGlzLnRyYW5zRW1iZWRkZWRQbGF5ZXJEdW1wVG9JbmZvKGVtYmVkZGVkUGxheWVyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbWJlZGRlZFBsYXllckdyb3Vwcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBncm91cC5uYW1lLFxuICAgICAgICAgICAgICAgIHR5cGU6IGdyb3VwLnR5cGUsXG4gICAgICAgICAgICAgICAga2V5OiBncm91cC5rZXksXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRQbGF5ZXJzLFxuICAgICAgICAgICAgICAgIG1lbnVJbmZvOiBFbWJlZGRlZFBsYXllck1lbnVNYXBbZ3JvdXAudHlwZV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudm0uZW1iZWRkZWRQbGF5ZXJHcm91cHMgPSBlbWJlZGRlZFBsYXllckdyb3VwcztcbiAgICAgICAgcmV0dXJuIGVtYmVkZGVkUGxheWVyR3JvdXBzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuoeeul+WvueW6lOiKgueCueWkhOeahOWFs+mUruW4p+aVsOaNrlxuICAgICAqIEBwYXJhbSBwYXRoXG4gICAgICovXG4gICAgcHJpdmF0ZSBjYWxjTm9kZUZyYW1lcyhwYXRoOiBzdHJpbmcsIHNvcnQgPSBmYWxzZSk6IElLZXlGcmFtZVtdIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXMudm07XG4gICAgICAgIGlmICghYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXApIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkYXRhID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAucGF0aHNEdW1wW3BhdGhdO1xuICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0OiBJS2V5RnJhbWVbXSA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoZGF0YSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleUZyYW1lcyA9IGNhbGNGcmFtZXMoZGF0YVtuYW1lXS5rZXlGcmFtZXMsIHRoYXQuJHJlZnMuY2hhcnQub2Zmc2V0V2lkdGgsIGZhbHNlKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoa2V5RnJhbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc29ydCAmJiByZXN1bHQubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICByZXN1bHQuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5mcmFtZSAtIGIuZnJhbWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgdHJhbnNFbWJlZGRlZFBsYXllckR1bXBUb0luZm8oZW1iZWRkZWRQbGF5ZXJEdW1wOiBJRW1iZWRkZWRQbGF5ZXJzLCB4PzogbnVtYmVyKTogSUVtYmVkZGVkUGxheWVySW5mbyB7XG4gICAgICAgIHggPSB0eXBlb2YgeCA9PT0gJ251bWJlcicgPyB4IDogZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhlbWJlZGRlZFBsYXllckR1bXAuYmVnaW4pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeCxcbiAgICAgICAgICAgIHdpZHRoOiBncmlkQ3RybC5mcmFtZVRvQ2FudmFzKGVtYmVkZGVkUGxheWVyRHVtcC5lbmQpIC0geCxcbiAgICAgICAgICAgIHJlY29uY2lsZWRTcGVlZDogZW1iZWRkZWRQbGF5ZXJEdW1wLnJlY29uY2lsZWRTcGVlZCxcbiAgICAgICAgICAgIHBsYXlhYmxlOiBlbWJlZGRlZFBsYXllckR1bXAucGxheWFibGUsXG4gICAgICAgICAgICBncm91cDogZW1iZWRkZWRQbGF5ZXJEdW1wLmdyb3VwLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6IGVtYmVkZGVkUGxheWVyRHVtcC5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIGtleTogY2FsY0VtYmVkZGVkUGxheWVyS2V5KGVtYmVkZGVkUGxheWVyRHVtcCksXG4gICAgICAgICAgICBiZWdpbjogZW1iZWRkZWRQbGF5ZXJEdW1wLmJlZ2luLFxuICAgICAgICAgICAgZW5kOiBlbWJlZGRlZFBsYXllckR1bXAuZW5kLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgY2FsY0VtYmVkZGVkUGxheWVycyhlbWJlZGRlZFBsYXllcnNEdW1wOiBJRW1iZWRkZWRQbGF5ZXJzW10sIHdpZHRoOiBudW1iZXIpOiBJRW1iZWRkZWRQbGF5ZXJJbmZvW10ge1xuICAgICAgICBjb25zdCBlbWJlZGRlZFBsYXllcnM6IElFbWJlZGRlZFBsYXllckluZm9bXSA9IFtdO1xuICAgICAgICBlbWJlZGRlZFBsYXllcnNEdW1wLmZvckVhY2goKGVtYmVkZGVkUGxheWVyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBiZWdpbiA9IGdyaWRDdHJsLmZyYW1lVG9DYW52YXMoZW1iZWRkZWRQbGF5ZXIuYmVnaW4pO1xuICAgICAgICAgICAgY29uc3QgZW5kID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhlbWJlZGRlZFBsYXllci5lbmQpO1xuICAgICAgICAgICAgY29uc3QgZGlzdGFuY2VCZWdpbiA9IGdldERpc3RhbmNlKGJlZ2luLCB3aWR0aCk7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZUVuZCA9IGdldERpc3RhbmNlKGVuZCwgd2lkdGgpO1xuICAgICAgICAgICAgLy8g5Yy65q615Lu75oSP5bin5Zyo55S75biD5YaF5Y2z5Y+vXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2VCZWdpbiA9PT0gMCB8fCBkaXN0YW5jZUVuZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGVtYmVkZGVkUGxheWVycy5wdXNoKHRoaXMudHJhbnNFbWJlZGRlZFBsYXllckR1bXBUb0luZm8oZW1iZWRkZWRQbGF5ZXIsIGJlZ2luKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVtYmVkZGVkUGxheWVycztcbiAgICB9XG5cbiAgICBwdWJsaWMgdHJhbnNFbWJlZGRlZFBsYXllckluZm9Ub0R1bXAoaW5mbzogSUVtYmVkZGVkUGxheWVySW5mbywgaGFzTW92ZTogYm9vbGVhbik6IElFbWJlZGRlZFBsYXllcnMge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYmVnaW46IGhhc01vdmUgPyBncmlkQ3RybC5jYW52YXNUb0ZyYW1lKGluZm8ueCkgOiBpbmZvLmJlZ2luLFxuICAgICAgICAgICAgZW5kOiBoYXNNb3ZlID8gZ3JpZEN0cmwuY2FudmFzVG9GcmFtZShpbmZvLnggKyBpbmZvLndpZHRoKSA6IGluZm8uZW5kLFxuICAgICAgICAgICAgcmVjb25jaWxlZFNwZWVkOiBpbmZvLnJlY29uY2lsZWRTcGVlZCxcbiAgICAgICAgICAgIHBsYXlhYmxlOiBpbmZvLnBsYXlhYmxlLFxuICAgICAgICAgICAgZ3JvdXA6IGluZm8uZ3JvdXAsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogaW5mby5kaXNwbGF5TmFtZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDliLfmlrBcbiAgICBwcml2YXRlIGFzeW5jIF9yZWZyZXNoKCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgLy8gaWYgKCF0aGF0LiRyZWZzLnJpZ2h0KSB7XG4gICAgICAgIC8vICAgICBGbGFncy5kb21SZWFkeSA9IGZhbHNlO1xuICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAvLyB9XG4gICAgICAgIGNvbnN0IHNpemUgPSB7XG4gICAgICAgICAgICB3OiB0aGF0LiRyZWZzLnJpZ2h0Lm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgaDogdGhhdC4kcmVmcy5yaWdodC5vZmZzZXRIZWlnaHQsXG4gICAgICAgIH07XG4gICAgICAgIC8vIOWPquimgeWKqOeUu+e8lui+keWZqOatpOaXtuiOt+WPluS4jeWIsOWwuuWvuOS/oeaBr+WwseebtOaOpei/lOWbnu+8jOWQjue7reS8muaciSByZXNpemVcXHNob3cg5raI5oGv5p2l6YeN5paw6L+b5YWlIHJlZnJlc2gg5Ye95pWwXG4gICAgICAgIGlmICghKHNpemUudyAmJiBzaXplLmgpKSB7XG4gICAgICAgICAgICBGbGFncy5kb21SZWFkeSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOS4u+imgeS4uuS6humBv+WFjeWkmuasoeiwg+eUqCByZWZyZXNoIOWHveaVsFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5yZWZyZXNoVGFzayAmJlxuICAgICAgICAgICAgRmxhZ3MuZG9tUmVhZHkgJiZcbiAgICAgICAgICAgIHRoYXQuJHJlZnMuZ3JpZENhbnZhcy53aWR0aCA9PT0gc2l6ZS53ICYmXG4gICAgICAgICAgICB0aGF0LiRyZWZzLmdyaWRDYW52YXMuaGVpZ2h0ID09PSBzaXplLmhcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGF0LmxvYWRpbmcgPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVTdGFydCgnYW5pbWF0b3I6dmlldy1yZWZyZXNoJyk7XG4gICAgICAgIHRoYXQubG9hZGluZyA9ICdpbml0X2FuaW1hdGlvbl9kYXRhJztcbiAgICAgICAgRmxhZ3MuZG9tUmVhZHkgPSB0cnVlO1xuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEluZm8oc2l6ZSk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEluZm8oc2l6ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyDliJ3lp4vljJZcbiAgICAgICAgY29uc3QgdXVpZCA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0TGFzdFNlbGVjdGVkKCdub2RlJyk7XG4gICAgICAgIC8vIOWIt+aWsOmcgOimgeWIpOaWreaYr+WQpuW3suWcqOWKqOeUu+e8lui+keaooeW8j+S4i1xuICAgICAgICBjb25zdCBtb2RlID0gYXdhaXQgSXF1ZXJ5U2NlbmVNb2RlKCk7XG4gICAgICAgIG1vZGUgPT09ICdhbmltYXRpb24nID8gKHRoYXQuYW5pbWF0aW9uTW9kZSA9IHRydWUpIDogKHRoYXQuYW5pbWF0aW9uTW9kZSA9IGZhbHNlKTtcbiAgICAgICAgYXdhaXQgdGhpcy52bUluaXQoKTtcbiAgICAgICAgdGhhdC53cmFwTW9kZUxpc3QgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1lbnVtLWxpc3Qtd2l0aC1wYXRoJywgJ0FuaW1hdGlvbkNsaXAuV3JhcE1vZGUnKTtcbiAgICAgICAgdGhhdC53cmFwTW9kZUxpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaXRlbS50aXAgPSBFZGl0b3IuSTE4bi50KGBhbmltYXRvci5hbmltYXRpb25DdXJ2ZS5XcmFwTW9kZS4ke2l0ZW0ubmFtZX0udGlwYCkgfHwgaXRlbS5uYW1lO1xuICAgICAgICAgICAgaXRlbS5uYW1lID0gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuYW5pbWF0aW9uQ3VydmUuV3JhcE1vZGUuJHtpdGVtLm5hbWV9LmxhYmVsYCkgfHwgaXRlbS5uYW1lO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUudGltZSgndXBkYXRlTm9kZScpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVOb2RlKHV1aWQpO1xuICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKCd1cGRhdGVOb2RlJyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUVkaXRJbmZvKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhhdC5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyByb290aWQsIGNsaXBpZCB9ID0gYXdhaXQgSWdldEVkaXRBbmltYXRpb25JbmZvKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScsIHJvb3RpZCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS50aW1lKCd1cGRhdGVSb290Jyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVSb290KGR1bXApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUudGltZUVuZCgndXBkYXRlUm9vdCcpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5NZXRyaWNzLnRyYWNrVGltZVN0YXJ0KCdhbmltYXRvcjp1cGRhdGUtY2xpcHMtZGF0YScpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlQ2xpcHMoY2xpcGlkKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVFbmQoJ2FuaW1hdG9yOnVwZGF0ZS1jbGlwcy1kYXRhJywgeyBvdXRwdXQ6IHRydWUsIGxhYmVsOiBgYW5pbWF0b3I6dXBkYXRlLWNsaXBzLWRhdGEgJHtjbGlwaWR9YCB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ3VwZGF0ZUNsaXBzJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRTdGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoYXQubG9hZGluZyA9ICcnO1xuICAgICAgICBGbGFncy5zY2VuZVJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWZyZXNoVGFzayA9IDA7XG4gICAgICAgIEVkaXRvci5NZXRyaWNzLnRyYWNrVGltZUVuZCgnYW5pbWF0b3I6dmlldy1yZWZyZXNoJywgeyBvdXRwdXQ6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgcmVzaXplKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzLnZtIGFzIElBbmlWTVRoaXM7XG4gICAgICAgIGlmICghdGhhdC4kcmVmcy5yaWdodCkge1xuICAgICAgICAgICAgRmxhZ3MuZG9tUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IG9mZnNldFdpZHRoLCBvZmZzZXRIZWlnaHQgfSA9IHRoYXQuJHJlZnMucmlnaHQ7XG4gICAgICAgIHRoYXQuJHJlZnMuY2hhcnQuc3R5bGUud2lkdGggPSBgJHtvZmZzZXRXaWR0aH1weGA7XG4gICAgICAgIGNvbnN0IHNpemUgPSB7XG4gICAgICAgICAgICB3OiB0aGF0LiRyZWZzLnJpZ2h0Lm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgaDogdGhhdC4kcmVmcy5yaWdodC5vZmZzZXRIZWlnaHQsXG4gICAgICAgIH07XG4gICAgICAgIGdyaWRDdHJsLmdyaWQgJiYgZ3JpZEN0cmwuZ3JpZC5yZXNpemUob2Zmc2V0V2lkdGgsIG9mZnNldEhlaWdodCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEluZm8oc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLmNhbGNEaXNwbGF5Q2xpcHMoKTtcbiAgICAgICAgICAgIHRoaXMuY2FsY0Rpc3BsYXlOb2RlcygpO1xuICAgICAgICAgICAgdGhpcy52bS51cGRhdGVLZXlGcmFtZSsrO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1cGRhdGVTY3JvbGxJbmZvKHNpemU6IHsgdzogbnVtYmVyLCBoOiBudW1iZXIgfSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcy52bTtcbiAgICAgICAgY29uc3QgYXV4Q3VydmVTdG9yZSA9IHRoYXQuYXV4Q3VydmVTdG9yZTtcbiAgICAgICAgLy8gVE9ETyDkvJjljJbkuI3lupTor6Xmr4/kuKogaW5mbyDpg73loavlhpnkuIDmoLfnmoQgc2l6ZVxuICAgICAgICB0aGF0Lm5vZGVTY3JvbGxJbmZvID0ge1xuICAgICAgICAgICAgc2l6ZSxcbiAgICAgICAgICAgIGhlaWdodDogdGhhdC4kcmVmc1snbm9kZS1jb250ZW50J10ub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgdG9wOiB0aGF0LiRyZWZzLm5vZGVzLnNjcm9sbFRvcCxcbiAgICAgICAgfTtcbiAgICAgICAgdGhhdC5wcm9wZXJ0eVNjcm9sbEluZm8gPSB7XG4gICAgICAgICAgICBzaXplLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGF0LiRyZWZzWydwcm9wZXJ0eS1jb250ZW50J10ub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgdG9wOiB0aGF0LiRyZWZzLnByb3BlcnR5LnNjcm9sbFRvcCxcbiAgICAgICAgfTtcbiAgICAgICAgdGhhdC5lbWJlZGRlZFBsYXllclNjcm9sbEluZm8gPSB7XG4gICAgICAgICAgICBzaXplLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGF0LiRyZWZzWydlbWJlZGRlZFBsYXllci1jb250ZW50J10ub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgdG9wOiB0aGF0LiRyZWZzLmVtYmVkZGVkUGxheWVyLnNjcm9sbFRvcCxcbiAgICAgICAgfTtcbiAgICAgICAgYXV4Q3VydmVTdG9yZS5zY3JvbGxJbmZvID0ge1xuICAgICAgICAgICAgc2l6ZSxcbiAgICAgICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBvbkVudGVyKCkge1xuICAgICAgICBhbmltYXRpb25DbGlwQ2FjaGVNYW5hZ2VyLmFuaW1hdGlvbk1vZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zdCBjbGlwRHVtcCA9IGF3YWl0IGFuaW1hdGlvbkNsaXBDYWNoZU1hbmFnZXIucXVlcnlMYXRlc3RDYWNoZSh0aGlzLnZtLmN1cnJlbnRDbGlwKTtcbiAgICAgICAgLy8gaWYgKGNsaXBEdW1wKSB7XG4gICAgICAgIC8vICAgICAvLyDlupTnlKjliqjnlLvmlbDmja5cbiAgICAgICAgLy8gICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywge1xuICAgICAgICAvLyAgICAgICAgIG5hbWU6ICdhbmltYXRvcicsXG4gICAgICAgIC8vICAgICAgICAgbWV0aG9kOiAncmVzdG9yZUZyb21EdW1wJyxcbiAgICAgICAgLy8gICAgICAgICBhcmdzOiBbdGhpcy52bS5yb290LCB0aGlzLnZtLmN1cnJlbnRDbGlwLCBjbGlwRHVtcF0sXG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfVxuICAgICAgICB0aGlzLnZtLmFuaW1hdGlvbk1vZGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiiq+WKqOmAgOWHuuWKqOeUu+e8lui+keaooeW8j+WQjijkuIDkupvnlYzpnaLnvJbovpHnirbmgIHnmoTph43nva4pXG4gICAgICovXG4gICAgb25FeGl0KCkge1xuICAgICAgICB0aGlzLmNsb3NlTWFza1BhbmVsKCk7XG4gICAgICAgIHRoaXMudm0uYW5pbWF0aW9uTW9kZSA9IGZhbHNlO1xuICAgICAgICBhbmltYXRpb25DbGlwQ2FjaGVNYW5hZ2VyLmFuaW1hdGlvbk1vZGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy52bS5tb3ZlTm9kZVBhdGggPSAnJztcbiAgICAgICAgdGhpcy52bS5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgdGhpcy52bS5zZWxlY3RFdmVudEluZm8gPSBudWxsO1xuICAgICAgICB0aGlzLnZtLnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY3VydmVEYXRhID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMudm0uc2hvd0FuaW1DdXJ2ZSkge1xuICAgICAgICAgICAgdGhpcy52bS50b2dnbGVBbmlDdXJ2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RnJhbWUoMCk7XG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY2xlYXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63liqjnlLvnvJbovpHlmajnm5HlkKzkuovku7bmuIXnkIZcbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgLy8g5riF55CG5rOo5YaM55qE5YWo5bGA5LqL5Lu2XG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXApO1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XG5cbiAgICAgICAgLy8g5Y+W5raI5pyq5omn6KGM55qE6Ziy5oqW5Ye95pWwXG4gICAgICAgIHRoaXMuY2FuY2VsRGVib3VuY2UoKTtcbiAgICB9XG5cbiAgICBhc3luYyBzZWxlY3RDYWNoZUNsaXBUb0FwcGx5KCkge1xuICAgICAgICBjb25zdCBjbGlwRHVtcCA9IGF3YWl0IGFuaW1hdGlvbkNsaXBDYWNoZU1hbmFnZXIuc2VsZWN0Q2xpcENhY2hlKHRoaXMudm0uY3VycmVudENsaXApO1xuICAgICAgICBpZiAoY2xpcER1bXApIHtcbiAgICAgICAgICAgIC8vIOW6lOeUqOWKqOeUu+aVsOaNrlxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2FuaW1hdG9yJyxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdyZXN0b3JlRnJvbUR1bXAnLFxuICAgICAgICAgICAgICAgIGFyZ3M6IFt0aGlzLnZtLnJvb3QsIHRoaXMudm0uY3VycmVudENsaXAsIGNsaXBEdW1wXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgYW5pbWF0aW9uRWRpdG9yID0gbmV3IEFuaW1hdGlvbkVkaXRvcigpO1xuXG4vKipcbiAqIOiOt+WPliB4IOWBj+enu+eUu+W4g+S5i+WklueahOi3neemu1xuICogPiAwIOWImeS4uui2hei/h+inhueql+W3pui+ueeahOi3neemu1xuICogPCAwIOWImeS4uuWwkeS6juinhueql+WPs+i+ueeahOi3neemu1xuICogQHBhcmFtIHhcbiAqL1xuZnVuY3Rpb24gZ2V0RGlzdGFuY2UoeDogbnVtYmVyLCB3aWR0aDogbnVtYmVyKSB7XG4gICAgaWYgKHggKyBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCA+IHdpZHRoKSB7XG4gICAgICAgIHJldHVybiB4ICsgZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQgLSB3aWR0aDtcbiAgICB9XG4gICAgaWYgKHggKyBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCA8IDApIHtcbiAgICAgICAgcmV0dXJuIHggKyBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG4vLyDorqHnrpflhbPplK7luKfmlbDmja7nmoTlrp7pmYXmmL7npLrkvY3nva7vvIzlkIzml7bov4fmu6TkuI3lnKjmmL7npLrljLrln5/lhoXnmoTlhbPplK7luKfmlbDmja5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjRnJhbWVzKGtleUZyYW1lczogSVJhd0tleUZyYW1lW10sIHdpZHRoOiBudW1iZXIsIGlzSW1hZ2U6IGJvb2xlYW4pOiBJS2V5RnJhbWVbXSB7XG4gICAgaWYgKCFrZXlGcmFtZXMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQ6IElLZXlGcmFtZVtdID0gW107XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRLZXkoa2V5ZnJhbWU6IElSYXdLZXlGcmFtZSk6IElLZXlGcmFtZSB7XG4gICAgICAgIGlmIChpc0ltYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IGtleWZyYW1lLngsXG4gICAgICAgICAgICAgICAgcHJvcDoga2V5ZnJhbWUucHJvcCxcbiAgICAgICAgICAgICAgICBmcmFtZToga2V5ZnJhbWUuZnJhbWUsXG4gICAgICAgICAgICAgICAgLy8g6YOo5YiG5pWw5o2u5Y+v6IO95Ye6546w57G75Ly85pivIHVua25vdyDnmoTnqbrlgLxcbiAgICAgICAgICAgICAgICB2YWx1ZToga2V5ZnJhbWUuZHVtcC52YWx1ZSAmJiBrZXlmcmFtZS5kdW1wLnZhbHVlLnV1aWQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBrZXlmcmFtZS54LFxuICAgICAgICAgICAgcHJvcDoga2V5ZnJhbWUucHJvcCxcbiAgICAgICAgICAgIGZyYW1lOiBrZXlmcmFtZS5mcmFtZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBkaXN0YW5jZUluZm8gPSB7XG4gICAgICAgIG1heE5lZ2F0aXZlOiB7XG4gICAgICAgICAgICBkaXN0YW5jZTogLUluZmluaXR5LFxuICAgICAgICAgICAgaW5kZXg6IC0xLFxuICAgICAgICB9LFxuICAgICAgICBtaW5Qb3NpdGl2ZToge1xuICAgICAgICAgICAgaW5kZXg6IC0xLFxuICAgICAgICAgICAgZGlzdGFuY2U6IEluZmluaXR5LFxuICAgICAgICB9LFxuICAgIH07XG4gICAga2V5RnJhbWVzLmZvckVhY2goKGl0ZW0sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgaXRlbS54ID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhpdGVtLmZyYW1lKTtcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBnZXREaXN0YW5jZShpdGVtLngsIHdpZHRoKTtcbiAgICAgICAgaWYgKGRpc3RhbmNlID09PSAwKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChmb3JtYXRLZXkoaXRlbSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkaXN0YW5jZSA+IDAgJiYgZGlzdGFuY2VJbmZvLm1pblBvc2l0aXZlLmRpc3RhbmNlID4gZGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGRpc3RhbmNlSW5mby5taW5Qb3NpdGl2ZS5kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgICAgICAgICAgZGlzdGFuY2VJbmZvLm1pblBvc2l0aXZlLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlzdGFuY2UgPCAwICYmIGRpc3RhbmNlSW5mby5tYXhOZWdhdGl2ZS5kaXN0YW5jZSA8IGRpc3RhbmNlKSB7XG4gICAgICAgICAgICBkaXN0YW5jZUluZm8ubWF4TmVnYXRpdmUuZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICAgICAgICAgIGRpc3RhbmNlSW5mby5tYXhOZWdhdGl2ZS5pbmRleCA9IGluZGV4O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8g5b2T5YWz6ZSu5bin6YO95Zyo55S76Z2i5LmL5aSW5pe277yM6ZyA6KaB5pi+56S65Zyo55S76Z2i5YaF5pyA6L+R55qE5Lik5Liq5YWz6ZSu5bin5Y+K5YW257q/5p2hXG4gICAgaWYgKHJlc3VsdC5sZW5ndGggIT09IGtleUZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgZGlzdGFuY2VJbmZvLm1heE5lZ2F0aXZlLmluZGV4ICE9PSAtMSAmJiByZXN1bHQucHVzaChmb3JtYXRLZXkoa2V5RnJhbWVzW2Rpc3RhbmNlSW5mby5tYXhOZWdhdGl2ZS5pbmRleF0pKTtcbiAgICAgICAgZGlzdGFuY2VJbmZvLm1pblBvc2l0aXZlLmluZGV4ICE9PSAtMSAmJiByZXN1bHQucHVzaChmb3JtYXRLZXkoa2V5RnJhbWVzW2Rpc3RhbmNlSW5mby5taW5Qb3NpdGl2ZS5pbmRleF0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiDliKTmlq3mn5DkuKroioLngrnkuIrmmK/lkKbmjILovb3kuobliqjnlLvmlbDmja5cbiAqIEBwYXJhbSBub2RlUGF0aFxuICovXG5mdW5jdGlvbiBoYXNLZXlEYXRhKG5vZGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbbm9kZVBhdGhdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGR1bXAgb2YgT2JqZWN0LnZhbHVlcyhhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbbm9kZVBhdGhdKSkge1xuICAgICAgICBpZiAoZHVtcC5rZXlGcmFtZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iXX0=