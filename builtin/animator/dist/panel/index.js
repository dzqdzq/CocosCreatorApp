'use strict';
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
exports.close = exports.beforeClose = exports.ready = exports.listeners = exports.methods = exports.$ = exports.template = exports.style = void 0;
const lodash_1 = require("lodash");
const fs_1 = require("fs");
const path_1 = require("path");
const VmConfig = __importStar(require("./vm/index"));
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const pinia_1 = require("pinia");
const ipc_event_1 = require("./share/ipc-event");
const utils_1 = require("./utils");
const animation_ctrl_1 = require("./share/animation-ctrl");
const global_data_1 = require("./share/global-data");
const animation_editor_1 = require("./share/animation-editor");
const grid_ctrl_1 = require("./share/grid-ctrl");
const Utils = __importStar(require("./utils"));
const pop_menu_1 = require("./share/pop-menu");
vue_js_1.default.config.productionTip = !Editor.App.dev;
vue_js_1.default.config.devtools = !Editor.App.dev;
vue_js_1.default.config.silent = !Editor.App.dev;
vue_js_1.default.use(pinia_1.PiniaVuePlugin);
let panel = null;
let vm = null;
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../index.css'), 'utf8');
// vue app template
const vueTemplate = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static', '/template/index.html'), 'utf8');
// panel template
exports.template = `
    <div class="animator"></div>
`;
exports.$ = {
    animator: '.animator',
};
// export const fonts = [
//     {
//         name: 'animator',
//         file: '',
//     },
// ];
exports.methods = {
    t: Editor.I18n.t,
    /**
     * 删除选中的关键帧或关键帧事件
     */
    deleteSelected() {
        if (vm && vm.selectEventInfo && animation_ctrl_1.animationCtrl.clipsDump) {
            animation_ctrl_1.animationCtrl.deleteEvent();
            return;
        }
        if (vm && vm.selectEmbeddedPlayerInfo) {
            animation_editor_1.animationEditor.deleteSelecteEmbeddedPlayers();
            return;
        }
        if (!vm || animation_editor_1.animationEditor.isLock || !animation_ctrl_1.animationCtrl.clipsDump) {
            return;
        }
        if (vm.selectKeyInfo) {
            animation_ctrl_1.animationCtrl.removeKey();
            return;
        }
        if (vm.selectProperty) {
            // 确认是否是分量轨道，分量轨道无法单独删除
            if (animation_ctrl_1.animationCtrl.clipsDump.pathsDump[vm.selectProperty.nodePath][vm.selectProperty.prop].parentPropKey) {
                animation_editor_1.animationEditor.showToast('i18n:animator.property.can_not_delete_part_property');
                return;
            }
            animation_ctrl_1.animationCtrl.removeProp(vm.selectProperty);
            return;
        }
    },
    nextStep: animation_editor_1.animationEditor.nextStep.bind(animation_editor_1.animationEditor),
    prevStep: animation_editor_1.animationEditor.prevStep.bind(animation_editor_1.animationEditor),
    jumpToNextKey: animation_editor_1.animationEditor.jumpToNextKey.bind(animation_editor_1.animationEditor),
    jumpToPrevKey: animation_editor_1.animationEditor.jumpToPrevKey.bind(animation_editor_1.animationEditor),
    jumpFirstFrame: animation_editor_1.animationEditor.jumpFirstFrame.bind(animation_editor_1.animationEditor),
    jumpLastFrame: animation_editor_1.animationEditor.jumpLastFrame.bind(animation_editor_1.animationEditor),
    showAllKeys() {
        if (!vm || !vm.showAnimCurve) {
            return;
        }
        vm.showAllKeys();
    },
    /**
     * 拷贝选中的关键帧或关键帧事件
     */
    copy: animation_editor_1.animationEditor.copy.bind(animation_editor_1.animationEditor),
    /**
     * 粘贴复制的内容
     */
    paste: animation_editor_1.animationEditor.paste.bind(animation_editor_1.animationEditor),
    /**
     * 选择当前属性轨道的所有关键帧
     */
    selectAll(event) {
        if (event) {
            if (event.path && event.path[0].tagName === 'INPUT') {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
        }
        if (!vm || animation_editor_1.animationEditor.isLock || !animation_ctrl_1.animationCtrl.clipsDump || !vm.selectProperty || !vm.properties) {
            return;
        }
        const data = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[vm.computeSelectPath][vm.selectProperty.prop].keyFrames;
        const keyFrames = data.map((data) => {
            return {
                ...data,
                nodePath: vm.computeSelectPath,
                rawFrame: data.frame,
                key: Utils.calcKeyFrameKey(data),
            };
        });
        const sortDump = (0, utils_1.sortKeysToTreeMap)(keyFrames);
        vm.selectKeyInfo = {
            keyFrames,
            sortDump,
            prop: vm.selectProperty.prop,
            nodePath: vm.computeSelectPath,
            location: 'prop',
        };
    },
    /**
     * 在当前选中属性轨道上添加关键帧
     */
    createKey() {
        if (!vm || animation_editor_1.animationEditor.isLock) {
            return;
        }
        // 当前没有选中节点与属性时，不处理
        if (!vm.selectProperty || !vm.computeSelectPath) {
            return;
        }
        if (animation_ctrl_1.animationCtrl.clipsDump && animation_ctrl_1.animationCtrl.clipsDump.isLock) {
            return;
        }
        const { prop, nodePath } = vm.selectProperty;
        if (nodePath !== vm.computeSelectPath) {
            return;
        }
        animation_ctrl_1.animationCtrl.createKey({
            frame: vm.currentFrame,
            nodePath,
            prop,
        });
    },
    /**
     * 播放或暂停
     */
    playOrPause() {
        if (!vm || !vm.animationMode) {
            return;
        }
        if (vm.animationState === 'stop' || vm.animationState === 'pause') {
            animation_ctrl_1.animationCtrl.updatePlayState('play');
        }
        else {
            animation_ctrl_1.animationCtrl.updatePlayState('pause');
        }
    },
    /**
     * 停止播放
     */
    stop() {
        if (!vm || !vm.animationMode) {
            return;
        }
        animation_ctrl_1.animationCtrl.updatePlayState('stop');
    },
    /**
     * 清空选中的数据
     */
    clearSelect() {
        if (animation_editor_1.animationEditor.isLock) {
            return;
        }
        animation_editor_1.animationEditor.clearSelectData();
    },
    /**
     * 退出 / 进入动画编辑模式
     */
    changeRecordState() {
        if (!vm || !vm.currentClip || !vm.active) {
            return;
        }
        if (vm.animationMode) {
            this.cancelNodeChange();
            animation_ctrl_1.animationCtrl.exit();
        }
        else {
            animation_ctrl_1.animationCtrl.enter(vm.currentClip);
        }
    },
    'change-debug-mode'() {
        toggleAnimationEditor();
    },
    'asset-db:asset-change'(uuid, assetInfo) {
        if (!vm || !Array.isArray(vm.clipsMenu)) {
            return;
        }
        let shouldUpdate = false;
        for (const clipInfo of vm.clipsMenu) {
            if (clipInfo.uuid === uuid) {
                shouldUpdate = true;
                break;
            }
        }
        // 如果是动画图或动画变体，可能被当前节点使用了，动画图里有 clips，所以需要更新
        if (assetInfo && assetInfo.extends?.includes('cc.animation.AnimationGraphLike')) {
            shouldUpdate = true;
        }
        if (!shouldUpdate) {
            return;
        }
        // TODO 目前场景数据更新会有延迟
        setTimeout(() => {
            // 可能在弹出窗口之前有数据保存，有可能遇到中间状态，没有vm
            if (vm && vm.selectedId !== '') {
                animation_editor_1.animationEditor.updateNode(vm.selectedId);
            }
        }, 500);
    },
    /**
     * 场景准备就绪
     */
    async 'scene:ready'() {
        const that = this;
        if (global_data_1.Flags.sceneReady) {
            return;
        }
        global_data_1.Flags.sceneReady = true;
        animation_editor_1.animationEditor.refreshTask++;
        vm && (await animation_editor_1.animationEditor.debounceRefresh());
    },
    /**
     * 关闭场景
     * 打开 loading 状态
     */
    'scene:close'() {
        global_data_1.Flags.sceneReady = false;
        vm && (vm.loading = 'wait_scene_ready');
        // 关闭场景时，需要把debounce的updateNode或者refresh cancel掉。否则会出现问题 #15637
        animation_editor_1.animationEditor.onSceneClose();
        this.cancelNodeChange();
    },
    /**
     * 选中某个物体
     * @param type 选中物体的类型
     * @param uuid 选中物体的 uuid
     */
    async 'selection:activated'(type, uuids) {
        const that = this;
        if (that.hidden) {
            return;
        }
        if (!vm || type !== 'node') {
            return;
        }
        vm.selectedIds = new Set(uuids);
        vm.selectPath = '';
        if (!uuids.length) {
            vm.selectedId = '';
            return;
        }
        vm.selectedId = uuids[0];
        if (!vm.animationMode) {
            await animation_editor_1.animationEditor.debounceUpdateNode(vm.selectedId);
        }
    },
    /**
     * 节点修改后需要更新动画编辑器内节点的显示状态
     * @param {string} uuid
     */
    'scene:change-node'(uuid, dump) {
        if (!global_data_1.Flags.sceneReady) {
            return;
        }
        panel.onChangeNode(uuid, dump);
    },
    // 打开动画编辑模式消息
    'scene:animation-start'(uuid) {
        if (!vm || uuid !== vm.root || vm.animationMode) {
            return;
        }
        animation_editor_1.animationEditor.onEnter();
        console.debug('scene:animation-start');
    },
    // 关闭动画编辑模式消息
    'scene:animation-end'() {
        // 关闭动画模式后会需要重新恢复正常场景数据
        // 在 animation-end 与 scene-close 之间还会接收到两条 change-node 消息需要过滤掉此时的处理
        global_data_1.Flags.sceneReady = false;
        if (!vm || !vm.animationMode) {
            return;
        }
        vm.animationMode = false;
        console.debug('scene:animation-end');
    },
    // 动画数据更改通知
    async 'scene:animation-change'(uuid) {
        const that = this;
        if (that.hidden || !uuid) {
            return;
        }
        if (!vm) {
            return;
        }
        if (uuid !== vm.root) {
            return;
        }
        await animation_editor_1.animationEditor.updateClips(vm.currentClip, 'update');
    },
    // 动画播放状态更改通知
    'scene:animation-state-change'(state) {
        animation_editor_1.animationEditor.updatePlayState(state);
    },
    'scene:change-mode'(mode) {
        if (!vm) {
            return;
        }
        vm.currentSceneMode = mode;
    },
    // 动画播放时的事件变化广播消息
    // 'scene:animation-time-change'(time: number) {
    //     if (!vm || !vm.animationMode) {
    //         return;
    //     }
    //     // const frame = timeToFrame(time, vm.sample);
    //     // vm.setCurrentFrame(frame);
    //     // console.log(time);
    // },
    // 切换所编辑的动画
    async 'scene:animation-clip-change'(clipUuid) {
        if (!vm || clipUuid === vm.currentClip) {
            return;
        }
        await animation_editor_1.animationEditor.updateClips(clipUuid);
        // 切换 clip 需要做一些状态清理
        vm.selectKeyInfo = null;
        vm.selectProperty = null;
    },
    async enableEmbeddedPlayer() {
        if (!vm) {
            return;
        }
        vm.updateEnableEmbeddedPlayer();
    },
    async enableAuxiliaryCurve() {
        if (!vm) {
            return;
        }
        vm.updateAuxCurveEnableState();
    },
};
exports.listeners = {
    resize() {
        if (!global_data_1.Flags.sceneReady || !vm) {
            return;
        }
        animation_editor_1.animationEditor.updateLayoutConfig();
        animation_editor_1.animationEditor.resize();
    },
    /**
     * 窗口显示时调用更新
     */
    async show() {
        if (!vm) {
            initVue();
        }
        if (!global_data_1.Flags.sceneReady) {
            return;
        }
        await animation_editor_1.animationEditor.debounceRefresh();
    },
};
function ready() {
    panel = this;
    this.onChangeNode = (0, lodash_1.throttle)(_onChangeNode.bind(panel), 100);
    this.cancelNodeChange = cancelNodeChange.bind(this);
    animation_editor_1.animationEditor.panel = panel;
    initVue();
    if (Editor.App.dev || Editor.App.args.spectron) {
        toggleAnimationEditor();
    }
}
exports.ready = ready;
async function beforeClose() {
    if (vm && vm.animationMode) {
        // 避免意外情况下动画编辑状态记录出错引起界面无法刷新关闭
        const mode = await (0, ipc_event_1.IquerySceneMode)();
        if (mode !== 'animation') {
            return true;
        }
        this.cancelNodeChange();
        const exitSuccess = await animation_ctrl_1.animationCtrl.exit();
        if (!exitSuccess) {
            return false;
        }
    }
    return true;
}
exports.beforeClose = beforeClose;
function close() {
    animation_editor_1.animationEditor.close();
    vm?.$destroy();
    vm = null;
}
exports.close = close;
function toggleAnimationEditor() {
    // @ts-ignore
    window.AnimationEditor = window.AnimationEditor ? null : {
        animationEditor: animation_editor_1.animationEditor,
        animationCtrl: animation_ctrl_1.animationCtrl,
        gridCtrl: grid_ctrl_1.gridCtrl,
        Utils,
        menuConfig: pop_menu_1.menuConfig,
        Test: require((0, path_1.join)(__dirname, '../../test/tools/index.js')),
    };
}
function initVue() {
    // 当动画编辑器重新放置到主界面 animationEditor/animationCtrl 都会有缓存数据，需要重置
    animation_editor_1.animationEditor.reset();
    animation_ctrl_1.animationCtrl.reset();
    const pinia = (0, pinia_1.createPinia)();
    vm = new vue_js_1.default({
        el: panel.$.animator,
        name: 'CcAnimatior',
        ...VmConfig,
        template: vueTemplate,
        pinia,
    });
}
async function _onChangeNode(uuid, dump) {
    // @ts-ignore
    const that = this;
    if (that.hidden) {
        return;
    }
    Editor.App.dev && console.debug('change-node', uuid);
    // 1. 播放状态下，不更新任何数据
    if (!vm || vm.animationState === 'play') {
        return;
    }
    // 2. 编辑动画图组件内剪辑时，不响应 node-change
    if (vm.animationMode && vm.aniCompType === 'cc.animation.AnimationController') {
        return;
    }
    // 3. 普通动画组件，动画编辑模式下 node-change 仅更新 clip 菜单
    if (vm.animationMode) {
        // 4. 普通动画组件，动画编辑模式下 node-change 仅更新 clip 菜单
        if (vm.aniCompType === 'cc.SkeletalAnimation') {
            animation_editor_1.animationEditor.checkUseBakedAnimationBySkeletalAnimation();
        }
        await animation_editor_1.animationEditor.updateClipMenu();
        return;
    }
    // --------------- 非动画编辑模式 ----------------
    const root = await (0, ipc_event_1.IqueryAnimationRoot)(uuid);
    if (!vm || vm.selectedId === '') {
        return;
    }
    const selectRoot = await (0, ipc_event_1.IqueryAnimationRoot)(vm.selectedId);
    if (selectRoot && selectRoot !== root) {
        // 4. 当前变动节点不在选中节点的动画根节点下，不做响应
        return;
    }
    if (global_data_1.Flags.lockUuid || global_data_1.Flags.lockUuid === uuid) {
        return;
    }
    global_data_1.Flags.lockUuid = uuid;
    global_data_1.Flags.lockTimer && clearTimeout(global_data_1.Flags.lockTimer);
    await animation_editor_1.animationEditor.updateNode(uuid);
    global_data_1.Flags.lockTimer = setTimeout(() => {
        global_data_1.Flags.lockUuid = '';
    }, 600);
}
// exit, close 前取消未执行的 nodeChange 
// FIXME: 治标不治本，已经进入执行流程的回调无法取消或停止执行。一个多段 await 的异步函数，需要判断的地方太多了，本质上是编程模式存在缺陷
function cancelNodeChange() {
    this.onChangeNode.cancel();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcGFuZWwvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVNiLG1DQUFrQztBQUNsQywyQkFBa0M7QUFDbEMsK0JBQTRCO0FBQzVCLHFEQUF1QztBQUN2Qyw2REFBa0M7QUFDbEMsaUNBQW9EO0FBRXBELGlEQUF1RztBQUN2RyxtQ0FBNEM7QUFFNUMsMkRBQXVEO0FBQ3ZELHFEQUE0QztBQUM1QywrREFBMkQ7QUFDM0QsaURBQTZDO0FBQzdDLCtDQUFpQztBQUNqQywrQ0FBOEM7QUFHOUMsZ0JBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDM0MsZ0JBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDdEMsZ0JBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFFcEMsZ0JBQUcsQ0FBQyxHQUFHLENBQUMsc0JBQWMsQ0FBQyxDQUFDO0FBRXhCLElBQUksS0FBSyxHQUFRLElBQUksQ0FBQztBQUN0QixJQUFJLEVBQUUsR0FBc0IsSUFBSSxDQUFDO0FBRXBCLFFBQUEsS0FBSyxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFM0UsbUJBQW1CO0FBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLHNCQUFzQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFbEcsaUJBQWlCO0FBQ0osUUFBQSxRQUFRLEdBQWM7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QyxTQUFTLENBQUMsQ0FBQztJQUNqRCxNQUFNLGtDQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLG1CQUFLLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDOUIsbUJBQUssQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3hCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRCxrQ0FBa0M7QUFDbEMsNkVBQTZFO0FBQzdFLFNBQVMsZ0JBQWdCO0lBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDL0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAgICBJU2VsZWN0UGFyYW0sXG4gICAgSUtleUZyYW1lLFxuICAgIElBbmlWTVRoaXMsXG4gICAgSUtleUZyYW1lRGF0YSxcbn0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyB0aHJvdHRsZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBWbUNvbmZpZyBmcm9tICcuL3ZtL2luZGV4JztcbmltcG9ydCBWdWUgZnJvbSAndnVlL2Rpc3QvdnVlLmpzJztcbmltcG9ydCB7IFBpbmlhVnVlUGx1Z2luLCBjcmVhdGVQaW5pYSB9IGZyb20gJ3BpbmlhJztcblxuaW1wb3J0IHsgSXF1ZXJ5QW5pbWF0aW9uUm9vdCwgSXF1ZXJ5Y2xpcHNNZW51SW5mbywgSXF1ZXJ5U2NlbmVNb2RlLCBJcmVjb3JkIH0gZnJvbSAnLi9zaGFyZS9pcGMtZXZlbnQnO1xuaW1wb3J0IHsgc29ydEtleXNUb1RyZWVNYXAgfSBmcm9tICcuL3V0aWxzJztcblxuaW1wb3J0IHsgYW5pbWF0aW9uQ3RybCB9IGZyb20gJy4vc2hhcmUvYW5pbWF0aW9uLWN0cmwnO1xuaW1wb3J0IHsgRmxhZ3MgfSBmcm9tICcuL3NoYXJlL2dsb2JhbC1kYXRhJztcbmltcG9ydCB7IGFuaW1hdGlvbkVkaXRvciB9IGZyb20gJy4vc2hhcmUvYW5pbWF0aW9uLWVkaXRvcic7XG5pbXBvcnQgeyBncmlkQ3RybCB9IGZyb20gJy4vc2hhcmUvZ3JpZC1jdHJsJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgbWVudUNvbmZpZyB9IGZyb20gJy4vc2hhcmUvcG9wLW1lbnUnO1xuaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSAnLi4vLi4vLi4vYXNzZXQtZGIvQHR5cGVzL3ByaXZhdGUnO1xuXG5WdWUuY29uZmlnLnByb2R1Y3Rpb25UaXAgPSAhRWRpdG9yLkFwcC5kZXY7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gIUVkaXRvci5BcHAuZGV2O1xuVnVlLmNvbmZpZy5zaWxlbnQgPSAhRWRpdG9yLkFwcC5kZXY7XG5cblZ1ZS51c2UoUGluaWFWdWVQbHVnaW4pO1xuXG5sZXQgcGFuZWw6IGFueSA9IG51bGw7XG5sZXQgdm06IElBbmlWTVRoaXMgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vaW5kZXguY3NzJyksICd1dGY4Jyk7XG5cbi8vIHZ1ZSBhcHAgdGVtcGxhdGVcbmNvbnN0IHZ1ZVRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljJywgJy90ZW1wbGF0ZS9pbmRleC5odG1sJyksICd1dGY4Jyk7XG5cbi8vIHBhbmVsIHRlbXBsYXRlXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbiAgICA8ZGl2IGNsYXNzPVwiYW5pbWF0b3JcIj48L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCAkID0ge1xuICAgIGFuaW1hdG9yOiAnLmFuaW1hdG9yJyxcbn07XG5cbi8vIGV4cG9ydCBjb25zdCBmb250cyA9IFtcbi8vICAgICB7XG4vLyAgICAgICAgIG5hbWU6ICdhbmltYXRvcicsXG4vLyAgICAgICAgIGZpbGU6ICcnLFxuLy8gICAgIH0sXG4vLyBdO1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcblxuICAgIHQ6IEVkaXRvci5JMThuLnQsXG5cbiAgICAvKipcbiAgICAgKiDliKDpmaTpgInkuK3nmoTlhbPplK7luKfmiJblhbPplK7luKfkuovku7ZcbiAgICAgKi9cbiAgICBkZWxldGVTZWxlY3RlZCgpIHtcbiAgICAgICAgaWYgKHZtICYmIHZtLnNlbGVjdEV2ZW50SW5mbyAmJiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5kZWxldGVFdmVudCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bSAmJiB2bS5zZWxlY3RFbWJlZGRlZFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5kZWxldGVTZWxlY3RlRW1iZWRkZWRQbGF5ZXJzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2bSB8fCBhbmltYXRpb25FZGl0b3IuaXNMb2NrIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZtLnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucmVtb3ZlS2V5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0uc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIC8vIOehruiupOaYr+WQpuaYr+WIhumHj+i9qOmBk++8jOWIhumHj+i9qOmBk+aXoOazleWNleeLrOWIoOmZpFxuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt2bS5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aF1bdm0uc2VsZWN0UHJvcGVydHkucHJvcF0ucGFyZW50UHJvcEtleSkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5zaG93VG9hc3QoJ2kxOG46YW5pbWF0b3IucHJvcGVydHkuY2FuX25vdF9kZWxldGVfcGFydF9wcm9wZXJ0eScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucmVtb3ZlUHJvcCh2bS5zZWxlY3RQcm9wZXJ0eSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbmV4dFN0ZXA6IGFuaW1hdGlvbkVkaXRvci5uZXh0U3RlcC5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG4gICAgcHJldlN0ZXA6IGFuaW1hdGlvbkVkaXRvci5wcmV2U3RlcC5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG4gICAganVtcFRvTmV4dEtleTogYW5pbWF0aW9uRWRpdG9yLmp1bXBUb05leHRLZXkuYmluZChhbmltYXRpb25FZGl0b3IpLFxuICAgIGp1bXBUb1ByZXZLZXk6IGFuaW1hdGlvbkVkaXRvci5qdW1wVG9QcmV2S2V5LmJpbmQoYW5pbWF0aW9uRWRpdG9yKSxcbiAgICBqdW1wRmlyc3RGcmFtZTogYW5pbWF0aW9uRWRpdG9yLmp1bXBGaXJzdEZyYW1lLmJpbmQoYW5pbWF0aW9uRWRpdG9yKSxcbiAgICBqdW1wTGFzdEZyYW1lOiBhbmltYXRpb25FZGl0b3IuanVtcExhc3RGcmFtZS5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG5cbiAgICBzaG93QWxsS2V5cygpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2hvd0FuaW1DdXJ2ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLnNob3dBbGxLZXlzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOaLt+i0nemAieS4reeahOWFs+mUruW4p+aIluWFs+mUruW4p+S6i+S7tlxuICAgICAqL1xuICAgIGNvcHk6IGFuaW1hdGlvbkVkaXRvci5jb3B5LmJpbmQoYW5pbWF0aW9uRWRpdG9yKSxcblxuICAgIC8qKlxuICAgICAqIOeymOi0tOWkjeWItueahOWGheWuuVxuICAgICAqL1xuICAgIHBhc3RlOiBhbmltYXRpb25FZGl0b3IucGFzdGUuYmluZChhbmltYXRpb25FZGl0b3IpLFxuXG4gICAgLyoqXG4gICAgICog6YCJ5oup5b2T5YmN5bGe5oCn6L2o6YGT55qE5omA5pyJ5YWz6ZSu5binXG4gICAgICovXG4gICAgc2VsZWN0QWxsKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucGF0aCAmJiBldmVudC5wYXRoWzBdLnRhZ05hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdm0gfHwgYW5pbWF0aW9uRWRpdG9yLmlzTG9jayB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAgfHwgIXZtLnNlbGVjdFByb3BlcnR5IHx8ICF2bS5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt2bS5jb21wdXRlU2VsZWN0UGF0aF1bdm0uc2VsZWN0UHJvcGVydHkucHJvcF0ua2V5RnJhbWVzO1xuICAgICAgICBjb25zdCBrZXlGcmFtZXM6IElLZXlGcmFtZURhdGFbXSA9IGRhdGEubWFwKChkYXRhOiBJS2V5RnJhbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4uZGF0YSxcbiAgICAgICAgICAgICAgICBub2RlUGF0aDogdm0hLmNvbXB1dGVTZWxlY3RQYXRoLFxuICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBkYXRhLmZyYW1lLFxuICAgICAgICAgICAgICAgIGtleTogVXRpbHMuY2FsY0tleUZyYW1lS2V5KGRhdGEpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNvcnREdW1wID0gc29ydEtleXNUb1RyZWVNYXAoa2V5RnJhbWVzKTtcbiAgICAgICAgdm0uc2VsZWN0S2V5SW5mbyA9IHtcbiAgICAgICAgICAgIGtleUZyYW1lcyxcbiAgICAgICAgICAgIHNvcnREdW1wLFxuICAgICAgICAgICAgcHJvcDogdm0uc2VsZWN0UHJvcGVydHkucHJvcCxcbiAgICAgICAgICAgIG5vZGVQYXRoOiB2bS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgIGxvY2F0aW9uOiAncHJvcCcsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWcqOW9k+WJjemAieS4reWxnuaAp+i9qOmBk+S4iua3u+WKoOWFs+mUruW4p1xuICAgICAqL1xuICAgIGNyZWF0ZUtleSgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCBhbmltYXRpb25FZGl0b3IuaXNMb2NrKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5b2T5YmN5rKh5pyJ6YCJ5Lit6IqC54K55LiO5bGe5oCn5pe277yM5LiN5aSE55CGXG4gICAgICAgIGlmICghdm0uc2VsZWN0UHJvcGVydHkgfHwgIXZtLmNvbXB1dGVTZWxlY3RQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wICYmIGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLmlzTG9jaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgcHJvcCwgbm9kZVBhdGggfSA9IHZtLnNlbGVjdFByb3BlcnR5O1xuICAgICAgICBpZiAobm9kZVBhdGggIT09IHZtLmNvbXB1dGVTZWxlY3RQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uQ3RybC5jcmVhdGVLZXkoe1xuICAgICAgICAgICAgZnJhbWU6IHZtLmN1cnJlbnRGcmFtZSxcbiAgICAgICAgICAgIG5vZGVQYXRoLFxuICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOaSreaUvuaIluaaguWBnFxuICAgICAqL1xuICAgIHBsYXlPclBhdXNlKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZtLmFuaW1hdGlvblN0YXRlID09PSAnc3RvcCcgfHwgdm0uYW5pbWF0aW9uU3RhdGUgPT09ICdwYXVzZScpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwudXBkYXRlUGxheVN0YXRlKCdwbGF5Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnVwZGF0ZVBsYXlTdGF0ZSgncGF1c2UnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDlgZzmraLmkq3mlL5cbiAgICAgKi9cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uQ3RybC51cGRhdGVQbGF5U3RhdGUoJ3N0b3AnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5riF56m66YCJ5Lit55qE5pWw5o2uXG4gICAgICovXG4gICAgY2xlYXJTZWxlY3QoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25FZGl0b3IuaXNMb2NrKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNsZWFyU2VsZWN0RGF0YSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDpgIDlh7ogLyDov5vlhaXliqjnlLvnvJbovpHmqKHlvI9cbiAgICAgKi9cbiAgICBjaGFuZ2VSZWNvcmRTdGF0ZSh0aGlzOiBhbnkpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uY3VycmVudENsaXAgfHwgIXZtLmFjdGl2ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bS5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmNhbmNlbE5vZGVDaGFuZ2UoKTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuZXhpdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5lbnRlcih2bS5jdXJyZW50Q2xpcCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgJ2NoYW5nZS1kZWJ1Zy1tb2RlJygpIHtcbiAgICAgICAgdG9nZ2xlQW5pbWF0aW9uRWRpdG9yKCk7XG4gICAgfSxcblxuICAgICdhc3NldC1kYjphc3NldC1jaGFuZ2UnKHV1aWQ6IHN0cmluZywgYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhQXJyYXkuaXNBcnJheSh2bS5jbGlwc01lbnUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNob3VsZFVwZGF0ZSA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGNsaXBJbmZvIG9mIHZtLmNsaXBzTWVudSkge1xuICAgICAgICAgICAgaWYgKGNsaXBJbmZvLnV1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBzaG91bGRVcGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aaC5p6c5piv5Yqo55S75Zu+5oiW5Yqo55S75Y+Y5L2T77yM5Y+v6IO96KKr5b2T5YmN6IqC54K55L2/55So5LqG77yM5Yqo55S75Zu+6YeM5pyJIGNsaXBz77yM5omA5Lul6ZyA6KaB5pu05pawXG4gICAgICAgIGlmIChhc3NldEluZm8gJiYgYXNzZXRJbmZvLmV4dGVuZHM/LmluY2x1ZGVzKCdjYy5hbmltYXRpb24uQW5pbWF0aW9uR3JhcGhMaWtlJykpe1xuICAgICAgICAgICAgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFzaG91bGRVcGRhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPIOebruWJjeWcuuaZr+aVsOaNruabtOaWsOS8muacieW7tui/n1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIC8vIOWPr+iDveWcqOW8ueWHuueql+WPo+S5i+WJjeacieaVsOaNruS/neWtmO+8jOacieWPr+iDvemBh+WIsOS4remXtOeKtuaAge+8jOayoeaciXZtXG4gICAgICAgICAgICBpZiAodm0gJiYgdm0uc2VsZWN0ZWRJZCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlTm9kZSh2bS5zZWxlY3RlZElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Zy65pmv5YeG5aSH5bCx57uqXG4gICAgICovXG4gICAgYXN5bmMgJ3NjZW5lOnJlYWR5JygpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgaWYgKEZsYWdzLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBGbGFncy5zY2VuZVJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlZnJlc2hUYXNrKys7XG4gICAgICAgIHZtICYmIChhd2FpdCBhbmltYXRpb25FZGl0b3IuZGVib3VuY2VSZWZyZXNoKCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63lnLrmma9cbiAgICAgKiDmiZPlvIAgbG9hZGluZyDnirbmgIFcbiAgICAgKi9cbiAgICAnc2NlbmU6Y2xvc2UnKHRoaXM6IGFueSkge1xuICAgICAgICBGbGFncy5zY2VuZVJlYWR5ID0gZmFsc2U7XG4gICAgICAgIHZtICYmICh2bS5sb2FkaW5nID0gJ3dhaXRfc2NlbmVfcmVhZHknKTtcbiAgICAgICAgLy8g5YWz6Zet5Zy65pmv5pe277yM6ZyA6KaB5oqKZGVib3VuY2XnmoR1cGRhdGVOb2Rl5oiW6ICFcmVmcmVzaCBjYW5jZWzmjonjgILlkKbliJnkvJrlh7rnjrDpl67popggIzE1NjM3XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5vblNjZW5lQ2xvc2UoKTtcbiAgICAgICAgdGhpcy5jYW5jZWxOb2RlQ2hhbmdlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOmAieS4reafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOmAieS4reeJqeS9k+eahOexu+Wei1xuICAgICAqIEBwYXJhbSB1dWlkIOmAieS4reeJqeS9k+eahCB1dWlkXG4gICAgICovXG4gICAgYXN5bmMgJ3NlbGVjdGlvbjphY3RpdmF0ZWQnKHR5cGU6IHN0cmluZywgdXVpZHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIGlmICh0aGF0LmhpZGRlbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdm0gfHwgdHlwZSAhPT0gJ25vZGUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm0uc2VsZWN0ZWRJZHMgPSBuZXcgU2V0KHV1aWRzKTtcbiAgICAgICAgdm0uc2VsZWN0UGF0aCA9ICcnO1xuICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgdm0uc2VsZWN0ZWRJZCA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLnNlbGVjdGVkSWQgPSB1dWlkc1swXTtcbiAgICAgICAgaWYgKCF2bS5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICBhd2FpdCBhbmltYXRpb25FZGl0b3IuZGVib3VuY2VVcGRhdGVOb2RlISh2bS5zZWxlY3RlZElkKTtcbiAgICAgICAgfVxuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOiKgueCueS/ruaUueWQjumcgOimgeabtOaWsOWKqOeUu+e8lui+keWZqOWGheiKgueCueeahOaYvuekuueKtuaAgVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1dWlkXG4gICAgICovXG4gICAgJ3NjZW5lOmNoYW5nZS1ub2RlJyh1dWlkOiBzdHJpbmcsIGR1bXA6IGFueSkge1xuICAgICAgICBpZiAoIUZsYWdzLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwYW5lbC5vbkNoYW5nZU5vZGUodXVpZCwgZHVtcCk7XG4gICAgfSxcblxuICAgIC8vIOaJk+W8gOWKqOeUu+e8lui+keaooeW8j+a2iOaBr1xuICAgICdzY2VuZTphbmltYXRpb24tc3RhcnQnKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8IHV1aWQgIT09IHZtLnJvb3QgfHwgdm0uYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5vbkVudGVyKCk7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ3NjZW5lOmFuaW1hdGlvbi1zdGFydCcpO1xuICAgIH0sXG5cbiAgICAvLyDlhbPpl63liqjnlLvnvJbovpHmqKHlvI/mtojmga9cbiAgICAnc2NlbmU6YW5pbWF0aW9uLWVuZCcoKSB7XG4gICAgICAgIC8vIOWFs+mXreWKqOeUu+aooeW8j+WQjuS8mumcgOimgemHjeaWsOaBouWkjeato+W4uOWcuuaZr+aVsOaNrlxuICAgICAgICAvLyDlnKggYW5pbWF0aW9uLWVuZCDkuI4gc2NlbmUtY2xvc2Ug5LmL6Ze06L+Y5Lya5o6l5pS25Yiw5Lik5p2hIGNoYW5nZS1ub2RlIOa2iOaBr+mcgOimgei/h+a7pOaOieatpOaXtueahOWkhOeQhlxuICAgICAgICBGbGFncy5zY2VuZVJlYWR5ID0gZmFsc2U7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLmFuaW1hdGlvbk1vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS5hbmltYXRpb25Nb2RlID0gZmFsc2U7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ3NjZW5lOmFuaW1hdGlvbi1lbmQnKTtcbiAgICB9LFxuXG4gICAgLy8g5Yqo55S75pWw5o2u5pu05pS56YCa55+lXG4gICAgYXN5bmMgJ3NjZW5lOmFuaW1hdGlvbi1jaGFuZ2UnKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICBpZiAodGhhdC5oaWRkZW4gfHwgIXV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHV1aWQgIT09IHZtLnJvb3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBhbmltYXRpb25FZGl0b3IudXBkYXRlQ2xpcHMhKHZtLmN1cnJlbnRDbGlwLCAndXBkYXRlJyk7XG4gICAgfSxcblxuICAgIC8vIOWKqOeUu+aSreaUvueKtuaAgeabtOaUuemAmuefpVxuICAgICdzY2VuZTphbmltYXRpb24tc3RhdGUtY2hhbmdlJyhzdGF0ZTogbnVtYmVyKSB7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci51cGRhdGVQbGF5U3RhdGUhKHN0YXRlKTtcbiAgICB9LFxuXG4gICAgJ3NjZW5lOmNoYW5nZS1tb2RlJyhtb2RlOiBzdHJpbmcpe1xuICAgICAgICBpZiAoIXZtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm0uY3VycmVudFNjZW5lTW9kZSA9IG1vZGU7XG4gICAgfSxcblxuICAgIC8vIOWKqOeUu+aSreaUvuaXtueahOS6i+S7tuWPmOWMluW5v+aSrea2iOaBr1xuICAgIC8vICdzY2VuZTphbmltYXRpb24tdGltZS1jaGFuZ2UnKHRpbWU6IG51bWJlcikge1xuICAgIC8vICAgICBpZiAoIXZtIHx8ICF2bS5hbmltYXRpb25Nb2RlKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgLy8gY29uc3QgZnJhbWUgPSB0aW1lVG9GcmFtZSh0aW1lLCB2bS5zYW1wbGUpO1xuICAgIC8vICAgICAvLyB2bS5zZXRDdXJyZW50RnJhbWUoZnJhbWUpO1xuICAgIC8vICAgICAvLyBjb25zb2xlLmxvZyh0aW1lKTtcbiAgICAvLyB9LFxuXG4gICAgLy8g5YiH5o2i5omA57yW6L6R55qE5Yqo55S7XG4gICAgYXN5bmMgJ3NjZW5lOmFuaW1hdGlvbi1jbGlwLWNoYW5nZScoY2xpcFV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8IGNsaXBVdWlkID09PSB2bS5jdXJyZW50Q2xpcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGFuaW1hdGlvbkVkaXRvci51cGRhdGVDbGlwcyhjbGlwVXVpZCk7XG4gICAgICAgIC8vIOWIh+aNoiBjbGlwIOmcgOimgeWBmuS4gOS6m+eKtuaAgea4heeQhlxuICAgICAgICB2bS5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgdm0uc2VsZWN0UHJvcGVydHkgPSBudWxsO1xuICAgIH0sXG5cbiAgICBhc3luYyBlbmFibGVFbWJlZGRlZFBsYXllcigpIHtcbiAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLnVwZGF0ZUVuYWJsZUVtYmVkZGVkUGxheWVyKCk7XG4gICAgfSxcbiAgICBhc3luYyBlbmFibGVBdXhpbGlhcnlDdXJ2ZSgpIHtcbiAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLnVwZGF0ZUF1eEN1cnZlRW5hYmxlU3RhdGUoKTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IGxpc3RlbmVycyA9IHtcbiAgICByZXNpemUoKSB7XG4gICAgICAgIGlmICghRmxhZ3Muc2NlbmVSZWFkeSB8fCAhdm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlTGF5b3V0Q29uZmlnKCk7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZXNpemUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog56qX5Y+j5pi+56S65pe26LCD55So5pu05pawXG4gICAgICovXG4gICAgYXN5bmMgc2hvdygpIHtcbiAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgaW5pdFZ1ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghRmxhZ3Muc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGFuaW1hdGlvbkVkaXRvci5kZWJvdW5jZVJlZnJlc2goKTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWR5KHRoaXM6IGFueSkge1xuICAgIHBhbmVsID0gdGhpcztcblxuICAgIHRoaXMub25DaGFuZ2VOb2RlID0gdGhyb3R0bGUoX29uQ2hhbmdlTm9kZS5iaW5kKHBhbmVsKSwgMTAwKTtcbiAgICB0aGlzLmNhbmNlbE5vZGVDaGFuZ2UgPSBjYW5jZWxOb2RlQ2hhbmdlLmJpbmQodGhpcyk7XG5cbiAgICBhbmltYXRpb25FZGl0b3IucGFuZWwgPSBwYW5lbDtcbiAgICBpbml0VnVlKCk7XG4gICAgaWYgKEVkaXRvci5BcHAuZGV2IHx8IEVkaXRvci5BcHAuYXJncy5zcGVjdHJvbikge1xuICAgICAgICB0b2dnbGVBbmltYXRpb25FZGl0b3IoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiZWZvcmVDbG9zZSh0aGlzOiBhbnkpIHtcbiAgICBpZiAodm0gJiYgdm0uYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAvLyDpgb/lhY3mhI/lpJbmg4XlhrXkuIvliqjnlLvnvJbovpHnirbmgIHorrDlvZXlh7rplJnlvJXotbfnlYzpnaLml6Dms5XliLfmlrDlhbPpl61cbiAgICAgICAgY29uc3QgbW9kZSA9IGF3YWl0IElxdWVyeVNjZW5lTW9kZSgpO1xuICAgICAgICBpZiAobW9kZSAhPT0gJ2FuaW1hdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FuY2VsTm9kZUNoYW5nZSgpO1xuICAgICAgICBjb25zdCBleGl0U3VjY2VzcyA9IGF3YWl0IGFuaW1hdGlvbkN0cmwuZXhpdCgpO1xuICAgICAgICBpZiAoIWV4aXRTdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICBhbmltYXRpb25FZGl0b3IuY2xvc2UoKTtcbiAgICAodm0gYXMgYW55KT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUFuaW1hdGlvbkVkaXRvcigpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgd2luZG93LkFuaW1hdGlvbkVkaXRvciA9IHdpbmRvdy5BbmltYXRpb25FZGl0b3IgPyBudWxsIDoge1xuICAgICAgICBhbmltYXRpb25FZGl0b3IsXG4gICAgICAgIGFuaW1hdGlvbkN0cmwsXG4gICAgICAgIGdyaWRDdHJsLFxuICAgICAgICBVdGlscyxcbiAgICAgICAgbWVudUNvbmZpZyxcbiAgICAgICAgVGVzdDogcmVxdWlyZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3Rlc3QvdG9vbHMvaW5kZXguanMnKSksXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaW5pdFZ1ZSgpIHtcbiAgICAvLyDlvZPliqjnlLvnvJbovpHlmajph43mlrDmlL7nva7liLDkuLvnlYzpnaIgYW5pbWF0aW9uRWRpdG9yL2FuaW1hdGlvbkN0cmwg6YO95Lya5pyJ57yT5a2Y5pWw5o2u77yM6ZyA6KaB6YeN572uXG4gICAgYW5pbWF0aW9uRWRpdG9yLnJlc2V0KCk7XG4gICAgYW5pbWF0aW9uQ3RybC5yZXNldCgpO1xuICAgIGNvbnN0IHBpbmlhID0gY3JlYXRlUGluaWEoKTtcbiAgICB2bSA9IG5ldyBWdWUoe1xuICAgICAgICBlbDogcGFuZWwuJC5hbmltYXRvcixcbiAgICAgICAgbmFtZTogJ0NjQW5pbWF0aW9yJyxcbiAgICAgICAgLi4uVm1Db25maWcsXG4gICAgICAgIHRlbXBsYXRlOiB2dWVUZW1wbGF0ZSxcbiAgICAgICAgcGluaWEsXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIF9vbkNoYW5nZU5vZGUodXVpZDogc3RyaW5nLCBkdW1wOiBhbnkpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICBpZiAodGhhdC5oaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBFZGl0b3IuQXBwLmRldiAmJiBjb25zb2xlLmRlYnVnKCdjaGFuZ2Utbm9kZScsIHV1aWQpO1xuICAgIC8vIDEuIOaSreaUvueKtuaAgeS4i++8jOS4jeabtOaWsOS7u+S9leaVsOaNrlxuICAgIGlmICghdm0gfHwgdm0uYW5pbWF0aW9uU3RhdGUgPT09ICdwbGF5Jykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gMi4g57yW6L6R5Yqo55S75Zu+57uE5Lu25YaF5Ymq6L6R5pe277yM5LiN5ZON5bqUIG5vZGUtY2hhbmdlXG4gICAgaWYgKHZtLmFuaW1hdGlvbk1vZGUgJiYgdm0uYW5pQ29tcFR5cGUgPT09ICdjYy5hbmltYXRpb24uQW5pbWF0aW9uQ29udHJvbGxlcicpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIDMuIOaZrumAmuWKqOeUu+e7hOS7tu+8jOWKqOeUu+e8lui+keaooeW8j+S4iyBub2RlLWNoYW5nZSDku4Xmm7TmlrAgY2xpcCDoj5zljZVcbiAgICBpZiAodm0uYW5pbWF0aW9uTW9kZSkge1xuXG4gICAgICAgIC8vIDQuIOaZrumAmuWKqOeUu+e7hOS7tu+8jOWKqOeUu+e8lui+keaooeW8j+S4iyBub2RlLWNoYW5nZSDku4Xmm7TmlrAgY2xpcCDoj5zljZVcbiAgICAgICAgaWYgKHZtLmFuaUNvbXBUeXBlID09PSAnY2MuU2tlbGV0YWxBbmltYXRpb24nKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IuY2hlY2tVc2VCYWtlZEFuaW1hdGlvbkJ5U2tlbGV0YWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGFuaW1hdGlvbkVkaXRvci51cGRhdGVDbGlwTWVudSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOmdnuWKqOeUu+e8lui+keaooeW8jyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBjb25zdCByb290ID0gYXdhaXQgSXF1ZXJ5QW5pbWF0aW9uUm9vdCh1dWlkKTtcblxuICAgIGlmICghdm0gfHwgdm0uc2VsZWN0ZWRJZCA9PT0gJycpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdFJvb3QgPSBhd2FpdCBJcXVlcnlBbmltYXRpb25Sb290KHZtLnNlbGVjdGVkSWQpO1xuICAgIGlmIChzZWxlY3RSb290ICYmIHNlbGVjdFJvb3QgIT09IHJvb3QpIHtcbiAgICAgICAgLy8gNC4g5b2T5YmN5Y+Y5Yqo6IqC54K55LiN5Zyo6YCJ5Lit6IqC54K555qE5Yqo55S75qC56IqC54K55LiL77yM5LiN5YGa5ZON5bqUXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoRmxhZ3MubG9ja1V1aWQgfHwgRmxhZ3MubG9ja1V1aWQgPT09IHV1aWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBGbGFncy5sb2NrVXVpZCA9IHV1aWQ7XG4gICAgRmxhZ3MubG9ja1RpbWVyICYmIGNsZWFyVGltZW91dChGbGFncy5sb2NrVGltZXIpO1xuICAgIGF3YWl0IGFuaW1hdGlvbkVkaXRvci51cGRhdGVOb2RlKHV1aWQpO1xuICAgIEZsYWdzLmxvY2tUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBGbGFncy5sb2NrVXVpZCA9ICcnO1xuICAgIH0sIDYwMCk7XG59XG5cbi8vIGV4aXQsIGNsb3NlIOWJjeWPlua2iOacquaJp+ihjOeahCBub2RlQ2hhbmdlIFxuLy8gRklYTUU6IOayu+agh+S4jeayu+acrO+8jOW3sue7j+i/m+WFpeaJp+ihjOa1geeoi+eahOWbnuiwg+aXoOazleWPlua2iOaIluWBnOatouaJp+ihjOOAguS4gOS4quWkmuautSBhd2FpdCDnmoTlvILmraXlh73mlbDvvIzpnIDopoHliKTmlq3nmoTlnLDmlrnlpKrlpJrkuobvvIzmnKzotKjkuIrmmK/nvJbnqIvmqKHlvI/lrZjlnKjnvLrpmbdcbmZ1bmN0aW9uIGNhbmNlbE5vZGVDaGFuZ2UodGhpczogYW55KSB7XG4gICAgdGhpcy5vbkNoYW5nZU5vZGUuY2FuY2VsKCk7XG59XG4iXX0=