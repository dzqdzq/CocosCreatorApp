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
    container: '.animator',
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
        if (!vm) {
            return;
        }
        if (vm.selectEventInfo && animation_ctrl_1.animationCtrl.clipsDump) {
            animation_ctrl_1.animationCtrl.deleteEvent();
            return;
        }
        if (vm.selectEmbeddedPlayerInfo) {
            animation_editor_1.animationEditor.deleteSelecteEmbeddedPlayers();
            return;
        }
        if (animation_editor_1.animationEditor.isLock || !animation_ctrl_1.animationCtrl.clipsDump) {
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
        if (!vm) {
            return;
        }
        vm.showAllKeys();
    },
    showSelectedKeys() {
        if (!vm) {
            return;
        }
        vm.showSelectedKeys();
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
        if (!panel || panel.hidden) {
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
        panel && panel.onChangeNode(uuid, dump);
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
        if (!panel || panel.hidden || !uuid) {
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
        if (!global_data_1.Flags.sceneReady || !vm) {
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
    panel = null;
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
    vm?.$destroy();
    vm = new vue_js_1.default({
        el: panel.$.container,
        name: 'CCAnimator',
        ...VmConfig,
        template: vueTemplate,
        pinia,
    });
}
async function _onChangeNode(uuid, dump) {
    if (!panel || panel.hidden) {
        return;
    }
    Editor.App.dev && console.debug('change-node', uuid);
    if (!vm) {
        return;
    }
    // 1. 播放状态下，不更新任何数据
    if (vm.animationState === 'play') {
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
    if (vm.selectedId === '') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcGFuZWwvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVNiLG1DQUFrQztBQUNsQywyQkFBa0M7QUFDbEMsK0JBQTRCO0FBQzVCLHFEQUF1QztBQUN2Qyw2REFBa0M7QUFDbEMsaUNBQW9EO0FBRXBELGlEQUF1RztBQUN2RyxtQ0FBNEM7QUFFNUMsMkRBQXVEO0FBQ3ZELHFEQUE0QztBQUM1QywrREFBMkQ7QUFDM0QsaURBQTZDO0FBQzdDLCtDQUFpQztBQUNqQywrQ0FBOEM7QUFHOUMsZ0JBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDM0MsZ0JBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDdEMsZ0JBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFFcEMsZ0JBQUcsQ0FBQyxHQUFHLENBQUMsc0JBQWMsQ0FBQyxDQUFDO0FBRXhCLElBQUksS0FBSyxHQUFRLElBQUksQ0FBQztBQUN0QixJQUFJLEVBQUUsR0FBc0IsSUFBSSxDQUFDO0FBRXBCLFFBQUEsS0FBSyxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFM0UsbUJBQW1CO0FBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLHNCQUFzQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFbEcsaUJBQWlCO0FBQ0osUUFBQSxRQUFRLEdBQWM7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QVMsSUFBSSxZQUFZLENBQUMsbUJBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqRCxNQUFNLGtDQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLG1CQUFLLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDOUIsbUJBQUssQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3hCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRCxrQ0FBa0M7QUFDbEMsNkVBQTZFO0FBQzdFLFNBQVMsZ0JBQWdCO0lBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDL0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAgICBJU2VsZWN0UGFyYW0sXG4gICAgSUtleUZyYW1lLFxuICAgIElBbmlWTVRoaXMsXG4gICAgSUtleUZyYW1lRGF0YSxcbn0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyB0aHJvdHRsZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBWbUNvbmZpZyBmcm9tICcuL3ZtL2luZGV4JztcbmltcG9ydCBWdWUgZnJvbSAndnVlL2Rpc3QvdnVlLmpzJztcbmltcG9ydCB7IFBpbmlhVnVlUGx1Z2luLCBjcmVhdGVQaW5pYSB9IGZyb20gJ3BpbmlhJztcblxuaW1wb3J0IHsgSXF1ZXJ5QW5pbWF0aW9uUm9vdCwgSXF1ZXJ5Y2xpcHNNZW51SW5mbywgSXF1ZXJ5U2NlbmVNb2RlLCBJcmVjb3JkIH0gZnJvbSAnLi9zaGFyZS9pcGMtZXZlbnQnO1xuaW1wb3J0IHsgc29ydEtleXNUb1RyZWVNYXAgfSBmcm9tICcuL3V0aWxzJztcblxuaW1wb3J0IHsgYW5pbWF0aW9uQ3RybCB9IGZyb20gJy4vc2hhcmUvYW5pbWF0aW9uLWN0cmwnO1xuaW1wb3J0IHsgRmxhZ3MgfSBmcm9tICcuL3NoYXJlL2dsb2JhbC1kYXRhJztcbmltcG9ydCB7IGFuaW1hdGlvbkVkaXRvciB9IGZyb20gJy4vc2hhcmUvYW5pbWF0aW9uLWVkaXRvcic7XG5pbXBvcnQgeyBncmlkQ3RybCB9IGZyb20gJy4vc2hhcmUvZ3JpZC1jdHJsJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgbWVudUNvbmZpZyB9IGZyb20gJy4vc2hhcmUvcG9wLW1lbnUnO1xuaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSAnLi4vLi4vLi4vYXNzZXQtZGIvQHR5cGVzL3ByaXZhdGUnO1xuXG5WdWUuY29uZmlnLnByb2R1Y3Rpb25UaXAgPSAhRWRpdG9yLkFwcC5kZXY7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gIUVkaXRvci5BcHAuZGV2O1xuVnVlLmNvbmZpZy5zaWxlbnQgPSAhRWRpdG9yLkFwcC5kZXY7XG5cblZ1ZS51c2UoUGluaWFWdWVQbHVnaW4pO1xuXG5sZXQgcGFuZWw6IGFueSA9IG51bGw7XG5sZXQgdm06IElBbmlWTVRoaXMgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vaW5kZXguY3NzJyksICd1dGY4Jyk7XG5cbi8vIHZ1ZSBhcHAgdGVtcGxhdGVcbmNvbnN0IHZ1ZVRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljJywgJy90ZW1wbGF0ZS9pbmRleC5odG1sJyksICd1dGY4Jyk7XG5cbi8vIHBhbmVsIHRlbXBsYXRlXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbiAgICA8ZGl2IGNsYXNzPVwiYW5pbWF0b3JcIj48L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCAkID0ge1xuICAgIGNvbnRhaW5lcjogJy5hbmltYXRvcicsXG59O1xuXG4vLyBleHBvcnQgY29uc3QgZm9udHMgPSBbXG4vLyAgICAge1xuLy8gICAgICAgICBuYW1lOiAnYW5pbWF0b3InLFxuLy8gICAgICAgICBmaWxlOiAnJyxcbi8vICAgICB9LFxuLy8gXTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG5cbiAgICB0OiBFZGl0b3IuSTE4bi50LFxuXG4gICAgLyoqXG4gICAgICog5Yig6Zmk6YCJ5Lit55qE5YWz6ZSu5bin5oiW5YWz6ZSu5bin5LqL5Lu2XG4gICAgICovXG4gICAgZGVsZXRlU2VsZWN0ZWQoKSB7XG4gICAgICAgIGlmICghdm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2bS5zZWxlY3RFdmVudEluZm8gJiYgYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXApIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuZGVsZXRlRXZlbnQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodm0uc2VsZWN0RW1iZWRkZWRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3IuZGVsZXRlU2VsZWN0ZUVtYmVkZGVkUGxheWVycygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbmltYXRpb25FZGl0b3IuaXNMb2NrIHx8ICFhbmltYXRpb25DdHJsLmNsaXBzRHVtcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZtLnNlbGVjdEtleUluZm8pIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucmVtb3ZlS2V5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0uc2VsZWN0UHJvcGVydHkpIHtcbiAgICAgICAgICAgIC8vIOehruiupOaYr+WQpuaYr+WIhumHj+i9qOmBk++8jOWIhumHj+i9qOmBk+aXoOazleWNleeLrOWIoOmZpFxuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wLnBhdGhzRHVtcFt2bS5zZWxlY3RQcm9wZXJ0eS5ub2RlUGF0aF1bdm0uc2VsZWN0UHJvcGVydHkucHJvcF0ucGFyZW50UHJvcEtleSkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5zaG93VG9hc3QoJ2kxOG46YW5pbWF0b3IucHJvcGVydHkuY2FuX25vdF9kZWxldGVfcGFydF9wcm9wZXJ0eScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwucmVtb3ZlUHJvcCh2bS5zZWxlY3RQcm9wZXJ0eSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbmV4dFN0ZXA6IGFuaW1hdGlvbkVkaXRvci5uZXh0U3RlcC5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG4gICAgcHJldlN0ZXA6IGFuaW1hdGlvbkVkaXRvci5wcmV2U3RlcC5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG4gICAganVtcFRvTmV4dEtleTogYW5pbWF0aW9uRWRpdG9yLmp1bXBUb05leHRLZXkuYmluZChhbmltYXRpb25FZGl0b3IpLFxuICAgIGp1bXBUb1ByZXZLZXk6IGFuaW1hdGlvbkVkaXRvci5qdW1wVG9QcmV2S2V5LmJpbmQoYW5pbWF0aW9uRWRpdG9yKSxcbiAgICBqdW1wRmlyc3RGcmFtZTogYW5pbWF0aW9uRWRpdG9yLmp1bXBGaXJzdEZyYW1lLmJpbmQoYW5pbWF0aW9uRWRpdG9yKSxcbiAgICBqdW1wTGFzdEZyYW1lOiBhbmltYXRpb25FZGl0b3IuanVtcExhc3RGcmFtZS5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG5cbiAgICBzaG93QWxsS2V5cygpIHtcbiAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLnNob3dBbGxLZXlzKCk7XG4gICAgfSxcbiAgICBzaG93U2VsZWN0ZWRLZXlzKCkge1xuICAgICAgICBpZiAoIXZtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm0uc2hvd1NlbGVjdGVkS2V5cygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmi7fotJ3pgInkuK3nmoTlhbPplK7luKfmiJblhbPplK7luKfkuovku7ZcbiAgICAgKi9cbiAgICBjb3B5OiBhbmltYXRpb25FZGl0b3IuY29weS5iaW5kKGFuaW1hdGlvbkVkaXRvciksXG5cbiAgICAvKipcbiAgICAgKiDnspjotLTlpI3liLbnmoTlhoXlrrlcbiAgICAgKi9cbiAgICBwYXN0ZTogYW5pbWF0aW9uRWRpdG9yLnBhc3RlLmJpbmQoYW5pbWF0aW9uRWRpdG9yKSxcblxuICAgIC8qKlxuICAgICAqIOmAieaLqeW9k+WJjeWxnuaAp+i9qOmBk+eahOaJgOacieWFs+mUruW4p1xuICAgICAqL1xuICAgIHNlbGVjdEFsbChldmVudDogYW55KSB7XG4gICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnBhdGggJiYgZXZlbnQucGF0aFswXS50YWdOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZtIHx8IGFuaW1hdGlvbkVkaXRvci5pc0xvY2sgfHwgIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIHx8ICF2bS5zZWxlY3RQcm9wZXJ0eSB8fCAhdm0ucHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5wYXRoc0R1bXBbdm0uY29tcHV0ZVNlbGVjdFBhdGhdW3ZtLnNlbGVjdFByb3BlcnR5LnByb3BdLmtleUZyYW1lcztcbiAgICAgICAgY29uc3Qga2V5RnJhbWVzOiBJS2V5RnJhbWVEYXRhW10gPSBkYXRhLm1hcCgoZGF0YTogSUtleUZyYW1lKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLmRhdGEsXG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IHZtIS5jb21wdXRlU2VsZWN0UGF0aCxcbiAgICAgICAgICAgICAgICByYXdGcmFtZTogZGF0YS5mcmFtZSxcbiAgICAgICAgICAgICAgICBrZXk6IFV0aWxzLmNhbGNLZXlGcmFtZUtleShkYXRhKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzb3J0RHVtcCA9IHNvcnRLZXlzVG9UcmVlTWFwKGtleUZyYW1lcyk7XG4gICAgICAgIHZtLnNlbGVjdEtleUluZm8gPSB7XG4gICAgICAgICAgICBrZXlGcmFtZXMsXG4gICAgICAgICAgICBzb3J0RHVtcCxcbiAgICAgICAgICAgIHByb3A6IHZtLnNlbGVjdFByb3BlcnR5LnByb3AsXG4gICAgICAgICAgICBub2RlUGF0aDogdm0uY29tcHV0ZVNlbGVjdFBhdGgsXG4gICAgICAgICAgICBsb2NhdGlvbjogJ3Byb3AnLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDlnKjlvZPliY3pgInkuK3lsZ7mgKfovajpgZPkuIrmt7vliqDlhbPplK7luKdcbiAgICAgKi9cbiAgICBjcmVhdGVLZXkoKSB7XG4gICAgICAgIGlmICghdm0gfHwgYW5pbWF0aW9uRWRpdG9yLmlzTG9jaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOW9k+WJjeayoeaciemAieS4reiKgueCueS4juWxnuaAp+aXtu+8jOS4jeWkhOeQhlxuICAgICAgICBpZiAoIXZtLnNlbGVjdFByb3BlcnR5IHx8ICF2bS5jb21wdXRlU2VsZWN0UGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbmltYXRpb25DdHJsLmNsaXBzRHVtcCAmJiBhbmltYXRpb25DdHJsLmNsaXBzRHVtcC5pc0xvY2spIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHByb3AsIG5vZGVQYXRoIH0gPSB2bS5zZWxlY3RQcm9wZXJ0eTtcbiAgICAgICAgaWYgKG5vZGVQYXRoICE9PSB2bS5jb21wdXRlU2VsZWN0UGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkN0cmwuY3JlYXRlS2V5KHtcbiAgICAgICAgICAgIGZyYW1lOiB2bS5jdXJyZW50RnJhbWUsXG4gICAgICAgICAgICBub2RlUGF0aCxcbiAgICAgICAgICAgIHByb3AsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmkq3mlL7miJbmmoLlgZxcbiAgICAgKi9cbiAgICBwbGF5T3JQYXVzZSgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bS5hbmltYXRpb25TdGF0ZSA9PT0gJ3N0b3AnIHx8IHZtLmFuaW1hdGlvblN0YXRlID09PSAncGF1c2UnKSB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnVwZGF0ZVBsYXlTdGF0ZSgncGxheScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC51cGRhdGVQbGF5U3RhdGUoJ3BhdXNlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5YGc5q2i5pKt5pS+XG4gICAgICovXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkN0cmwudXBkYXRlUGxheVN0YXRlKCdzdG9wJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOa4heepuumAieS4reeahOaVsOaNrlxuICAgICAqL1xuICAgIGNsZWFyU2VsZWN0KCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uRWRpdG9yLmlzTG9jaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5jbGVhclNlbGVjdERhdGEoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6YCA5Ye6IC8g6L+b5YWl5Yqo55S757yW6L6R5qih5byPXG4gICAgICovXG4gICAgY2hhbmdlUmVjb3JkU3RhdGUodGhpczogYW55KSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLmN1cnJlbnRDbGlwIHx8ICF2bS5hY3RpdmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodm0uYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgdGhpcy5jYW5jZWxOb2RlQ2hhbmdlKCk7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLmV4aXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuZW50ZXIodm0uY3VycmVudENsaXApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgICdjaGFuZ2UtZGVidWctbW9kZScoKSB7XG4gICAgICAgIHRvZ2dsZUFuaW1hdGlvbkVkaXRvcigpO1xuICAgIH0sXG5cbiAgICAnYXNzZXQtZGI6YXNzZXQtY2hhbmdlJyh1dWlkOiBzdHJpbmcsIGFzc2V0SW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIGlmICghdm0gfHwgIUFycmF5LmlzQXJyYXkodm0uY2xpcHNNZW51KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzaG91bGRVcGRhdGUgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBjbGlwSW5mbyBvZiB2bS5jbGlwc01lbnUpIHtcbiAgICAgICAgICAgIGlmIChjbGlwSW5mby51dWlkID09PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWmguaenOaYr+WKqOeUu+WbvuaIluWKqOeUu+WPmOS9k++8jOWPr+iDveiiq+W9k+WJjeiKgueCueS9v+eUqOS6hu+8jOWKqOeUu+WbvumHjOaciSBjbGlwc++8jOaJgOS7pemcgOimgeabtOaWsFxuICAgICAgICBpZiAoYXNzZXRJbmZvICYmIGFzc2V0SW5mby5leHRlbmRzPy5pbmNsdWRlcygnY2MuYW5pbWF0aW9uLkFuaW1hdGlvbkdyYXBoTGlrZScpKXtcbiAgICAgICAgICAgIHNob3VsZFVwZGF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghc2hvdWxkVXBkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETyDnm67liY3lnLrmma/mlbDmja7mm7TmlrDkvJrmnInlu7bov59cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAvLyDlj6/og73lnKjlvLnlh7rnqpflj6PkuYvliY3mnInmlbDmja7kv53lrZjvvIzmnInlj6/og73pgYfliLDkuK3pl7TnirbmgIHvvIzmsqHmnIl2bVxuICAgICAgICAgICAgaWYgKHZtICYmIHZtLnNlbGVjdGVkSWQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZU5vZGUodm0uc2VsZWN0ZWRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWcuuaZr+WHhuWkh+Wwsee7qlxuICAgICAqL1xuICAgIGFzeW5jICdzY2VuZTpyZWFkeScoKSB7XG4gICAgICAgIGlmIChGbGFncy5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgRmxhZ3Muc2NlbmVSZWFkeSA9IHRydWU7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5yZWZyZXNoVGFzaysrO1xuICAgICAgICB2bSAmJiAoYXdhaXQgYW5pbWF0aW9uRWRpdG9yLmRlYm91bmNlUmVmcmVzaCgpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet5Zy65pmvXG4gICAgICog5omT5byAIGxvYWRpbmcg54q25oCBXG4gICAgICovXG4gICAgJ3NjZW5lOmNsb3NlJyh0aGlzOiBhbnkpIHtcbiAgICAgICAgRmxhZ3Muc2NlbmVSZWFkeSA9IGZhbHNlO1xuICAgICAgICB2bSAmJiAodm0ubG9hZGluZyA9ICd3YWl0X3NjZW5lX3JlYWR5Jyk7XG4gICAgICAgIC8vIOWFs+mXreWcuuaZr+aXtu+8jOmcgOimgeaKimRlYm91bmNl55qEdXBkYXRlTm9kZeaIluiAhXJlZnJlc2ggY2FuY2Vs5o6J44CC5ZCm5YiZ5Lya5Ye6546w6Zeu6aKYICMxNTYzN1xuICAgICAgICBhbmltYXRpb25FZGl0b3Iub25TY2VuZUNsb3NlKCk7XG4gICAgICAgIHRoaXMuY2FuY2VsTm9kZUNoYW5nZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDpgInkuK3mn5DkuKrniankvZNcbiAgICAgKiBAcGFyYW0gdHlwZSDpgInkuK3niankvZPnmoTnsbvlnotcbiAgICAgKiBAcGFyYW0gdXVpZCDpgInkuK3niankvZPnmoQgdXVpZFxuICAgICAqL1xuICAgIGFzeW5jICdzZWxlY3Rpb246YWN0aXZhdGVkJyh0eXBlOiBzdHJpbmcsIHV1aWRzOiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIXBhbmVsIHx8IHBhbmVsLmhpZGRlbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2bSB8fCB0eXBlICE9PSAnbm9kZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS5zZWxlY3RlZElkcyA9IG5ldyBTZXQodXVpZHMpO1xuICAgICAgICB2bS5zZWxlY3RQYXRoID0gJyc7XG4gICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2bS5zZWxlY3RlZElkID0gJyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm0uc2VsZWN0ZWRJZCA9IHV1aWRzWzBdO1xuICAgICAgICBpZiAoIXZtLmFuaW1hdGlvbk1vZGUpIHtcbiAgICAgICAgICAgIGF3YWl0IGFuaW1hdGlvbkVkaXRvci5kZWJvdW5jZVVwZGF0ZU5vZGUhKHZtLnNlbGVjdGVkSWQpO1xuICAgICAgICB9XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6IqC54K55L+u5pS55ZCO6ZyA6KaB5pu05paw5Yqo55S757yW6L6R5Zmo5YaF6IqC54K555qE5pi+56S654q25oCBXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHV1aWRcbiAgICAgKi9cbiAgICAnc2NlbmU6Y2hhbmdlLW5vZGUnKHV1aWQ6IHN0cmluZywgZHVtcDogYW55KSB7XG4gICAgICAgIGlmICghRmxhZ3Muc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhbmVsICYmIHBhbmVsLm9uQ2hhbmdlTm9kZSh1dWlkLCBkdW1wKTtcbiAgICB9LFxuXG4gICAgLy8g5omT5byA5Yqo55S757yW6L6R5qih5byP5raI5oGvXG4gICAgJ3NjZW5lOmFuaW1hdGlvbi1zdGFydCcodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgdXVpZCAhPT0gdm0ucm9vdCB8fCB2bS5hbmltYXRpb25Nb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uRW50ZXIoKTtcbiAgICAgICAgY29uc29sZS5kZWJ1Zygnc2NlbmU6YW5pbWF0aW9uLXN0YXJ0Jyk7XG4gICAgfSxcblxuICAgIC8vIOWFs+mXreWKqOeUu+e8lui+keaooeW8j+a2iOaBr1xuICAgICdzY2VuZTphbmltYXRpb24tZW5kJygpIHtcbiAgICAgICAgLy8g5YWz6Zet5Yqo55S75qih5byP5ZCO5Lya6ZyA6KaB6YeN5paw5oGi5aSN5q2j5bi45Zy65pmv5pWw5o2uXG4gICAgICAgIC8vIOWcqCBhbmltYXRpb24tZW5kIOS4jiBzY2VuZS1jbG9zZSDkuYvpl7Tov5jkvJrmjqXmlLbliLDkuKTmnaEgY2hhbmdlLW5vZGUg5raI5oGv6ZyA6KaB6L+H5ruk5o6J5q2k5pe255qE5aSE55CGXG4gICAgICAgIEZsYWdzLnNjZW5lUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uYW5pbWF0aW9uTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLmFuaW1hdGlvbk1vZGUgPSBmYWxzZTtcbiAgICAgICAgY29uc29sZS5kZWJ1Zygnc2NlbmU6YW5pbWF0aW9uLWVuZCcpO1xuICAgIH0sXG5cbiAgICAvLyDliqjnlLvmlbDmja7mm7TmlLnpgJrnn6VcbiAgICBhc3luYyAnc2NlbmU6YW5pbWF0aW9uLWNoYW5nZScodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghcGFuZWwgfHwgcGFuZWwuaGlkZGVuIHx8ICF1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1dWlkICE9PSB2bS5yb290KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUNsaXBzISh2bS5jdXJyZW50Q2xpcCwgJ3VwZGF0ZScpO1xuICAgIH0sXG5cbiAgICAvLyDliqjnlLvmkq3mlL7nirbmgIHmm7TmlLnpgJrnn6VcbiAgICAnc2NlbmU6YW5pbWF0aW9uLXN0YXRlLWNoYW5nZScoc3RhdGU6IG51bWJlcikge1xuICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlUGxheVN0YXRlIShzdGF0ZSk7XG4gICAgfSxcblxuICAgICdzY2VuZTpjaGFuZ2UtbW9kZScobW9kZTogc3RyaW5nKXtcbiAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLmN1cnJlbnRTY2VuZU1vZGUgPSBtb2RlO1xuICAgIH0sXG5cbiAgICAvLyDliqjnlLvmkq3mlL7ml7bnmoTkuovku7blj5jljJblub/mkq3mtojmga9cbiAgICAvLyAnc2NlbmU6YW5pbWF0aW9uLXRpbWUtY2hhbmdlJyh0aW1lOiBudW1iZXIpIHtcbiAgICAvLyAgICAgaWYgKCF2bSB8fCAhdm0uYW5pbWF0aW9uTW9kZSkge1xuICAgIC8vICAgICAgICAgcmV0dXJuO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIC8vIGNvbnN0IGZyYW1lID0gdGltZVRvRnJhbWUodGltZSwgdm0uc2FtcGxlKTtcbiAgICAvLyAgICAgLy8gdm0uc2V0Q3VycmVudEZyYW1lKGZyYW1lKTtcbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2codGltZSk7XG4gICAgLy8gfSxcblxuICAgIC8vIOWIh+aNouaJgOe8lui+keeahOWKqOeUu1xuICAgIGFzeW5jICdzY2VuZTphbmltYXRpb24tY2xpcC1jaGFuZ2UnKGNsaXBVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF2bSB8fCBjbGlwVXVpZCA9PT0gdm0uY3VycmVudENsaXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBhbmltYXRpb25FZGl0b3IudXBkYXRlQ2xpcHMoY2xpcFV1aWQpO1xuICAgICAgICAvLyDliIfmjaIgY2xpcCDpnIDopoHlgZrkuIDkupvnirbmgIHmuIXnkIZcbiAgICAgICAgdm0uc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgIHZtLnNlbGVjdFByb3BlcnR5ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgYXN5bmMgZW5hYmxlRW1iZWRkZWRQbGF5ZXIoKSB7XG4gICAgICAgIGlmICghdm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS51cGRhdGVFbmFibGVFbWJlZGRlZFBsYXllcigpO1xuICAgIH0sXG4gICAgYXN5bmMgZW5hYmxlQXV4aWxpYXJ5Q3VydmUoKSB7XG4gICAgICAgIGlmICghdm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS51cGRhdGVBdXhDdXJ2ZUVuYWJsZVN0YXRlKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBsaXN0ZW5lcnMgPSB7XG4gICAgcmVzaXplKCkge1xuICAgICAgICBpZiAoIUZsYWdzLnNjZW5lUmVhZHkgfHwgIXZtKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUxheW91dENvbmZpZygpO1xuICAgICAgICBhbmltYXRpb25FZGl0b3IucmVzaXplKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOeql+WPo+aYvuekuuaXtuiwg+eUqOabtOaWsFxuICAgICAqL1xuICAgIGFzeW5jIHNob3coKSB7XG4gICAgICAgIGlmICghRmxhZ3Muc2NlbmVSZWFkeSB8fCAhdm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBhbmltYXRpb25FZGl0b3IuZGVib3VuY2VSZWZyZXNoKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkeSh0aGlzOiBhbnkpIHtcbiAgICBwYW5lbCA9IHRoaXM7XG5cbiAgICB0aGlzLm9uQ2hhbmdlTm9kZSA9IHRocm90dGxlKF9vbkNoYW5nZU5vZGUuYmluZChwYW5lbCksIDEwMCk7XG4gICAgdGhpcy5jYW5jZWxOb2RlQ2hhbmdlID0gY2FuY2VsTm9kZUNoYW5nZS5iaW5kKHRoaXMpO1xuXG4gICAgYW5pbWF0aW9uRWRpdG9yLnBhbmVsID0gcGFuZWw7XG4gICAgaW5pdFZ1ZSgpO1xuICAgIGlmIChFZGl0b3IuQXBwLmRldiB8fCBFZGl0b3IuQXBwLmFyZ3Muc3BlY3Ryb24pIHtcbiAgICAgICAgdG9nZ2xlQW5pbWF0aW9uRWRpdG9yKCk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmVmb3JlQ2xvc2UodGhpczogYW55KSB7XG4gICAgaWYgKHZtICYmIHZtLmFuaW1hdGlvbk1vZGUpIHtcbiAgICAgICAgLy8g6YG/5YWN5oSP5aSW5oOF5Ya15LiL5Yqo55S757yW6L6R54q25oCB6K6w5b2V5Ye66ZSZ5byV6LW355WM6Z2i5peg5rOV5Yi35paw5YWz6ZetXG4gICAgICAgIGNvbnN0IG1vZGUgPSBhd2FpdCBJcXVlcnlTY2VuZU1vZGUoKTtcbiAgICAgICAgaWYgKG1vZGUgIT09ICdhbmltYXRpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbmNlbE5vZGVDaGFuZ2UoKTtcbiAgICAgICAgY29uc3QgZXhpdFN1Y2Nlc3MgPSBhd2FpdCBhbmltYXRpb25DdHJsLmV4aXQoKTtcbiAgICAgICAgaWYgKCFleGl0U3VjY2Vzcykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgYW5pbWF0aW9uRWRpdG9yLmNsb3NlKCk7XG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBudWxsO1xuICAgIHBhbmVsID0gbnVsbDtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlQW5pbWF0aW9uRWRpdG9yKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB3aW5kb3cuQW5pbWF0aW9uRWRpdG9yID0gd2luZG93LkFuaW1hdGlvbkVkaXRvciA/IG51bGwgOiB7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvcixcbiAgICAgICAgYW5pbWF0aW9uQ3RybCxcbiAgICAgICAgZ3JpZEN0cmwsXG4gICAgICAgIFV0aWxzLFxuICAgICAgICBtZW51Q29uZmlnLFxuICAgICAgICBUZXN0OiByZXF1aXJlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vdGVzdC90b29scy9pbmRleC5qcycpKSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpbml0VnVlKCkge1xuICAgIC8vIOW9k+WKqOeUu+e8lui+keWZqOmHjeaWsOaUvue9ruWIsOS4u+eVjOmdoiBhbmltYXRpb25FZGl0b3IvYW5pbWF0aW9uQ3RybCDpg73kvJrmnInnvJPlrZjmlbDmja7vvIzpnIDopoHph43nva5cbiAgICBhbmltYXRpb25FZGl0b3IucmVzZXQoKTtcbiAgICBhbmltYXRpb25DdHJsLnJlc2V0KCk7XG4gICAgY29uc3QgcGluaWEgPSBjcmVhdGVQaW5pYSgpO1xuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbmV3IFZ1ZSh7XG4gICAgICAgIGVsOiBwYW5lbC4kLmNvbnRhaW5lcixcbiAgICAgICAgbmFtZTogJ0NDQW5pbWF0b3InLFxuICAgICAgICAuLi5WbUNvbmZpZyxcbiAgICAgICAgdGVtcGxhdGU6IHZ1ZVRlbXBsYXRlLFxuICAgICAgICBwaW5pYSxcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX29uQ2hhbmdlTm9kZSh1dWlkOiBzdHJpbmcsIGR1bXA6IGFueSkge1xuICAgIGlmICghcGFuZWwgfHwgcGFuZWwuaGlkZGVuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgRWRpdG9yLkFwcC5kZXYgJiYgY29uc29sZS5kZWJ1ZygnY2hhbmdlLW5vZGUnLCB1dWlkKTtcblxuICAgIGlmICghdm0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIDEuIOaSreaUvueKtuaAgeS4i++8jOS4jeabtOaWsOS7u+S9leaVsOaNrlxuICAgIGlmICh2bS5hbmltYXRpb25TdGF0ZSA9PT0gJ3BsYXknKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAyLiDnvJbovpHliqjnlLvlm77nu4Tku7blhoXliarovpHml7bvvIzkuI3lk43lupQgbm9kZS1jaGFuZ2VcbiAgICBpZiAodm0uYW5pbWF0aW9uTW9kZSAmJiB2bS5hbmlDb21wVHlwZSA9PT0gJ2NjLmFuaW1hdGlvbi5BbmltYXRpb25Db250cm9sbGVyJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gMy4g5pmu6YCa5Yqo55S757uE5Lu277yM5Yqo55S757yW6L6R5qih5byP5LiLIG5vZGUtY2hhbmdlIOS7heabtOaWsCBjbGlwIOiPnOWNlVxuICAgIGlmICh2bS5hbmltYXRpb25Nb2RlKSB7XG5cbiAgICAgICAgLy8gNC4g5pmu6YCa5Yqo55S757uE5Lu277yM5Yqo55S757yW6L6R5qih5byP5LiLIG5vZGUtY2hhbmdlIOS7heabtOaWsCBjbGlwIOiPnOWNlVxuICAgICAgICBpZiAodm0uYW5pQ29tcFR5cGUgPT09ICdjYy5Ta2VsZXRhbEFuaW1hdGlvbicpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5jaGVja1VzZUJha2VkQW5pbWF0aW9uQnlTa2VsZXRhbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUNsaXBNZW51KCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g6Z2e5Yqo55S757yW6L6R5qih5byPIC0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGNvbnN0IHJvb3QgPSBhd2FpdCBJcXVlcnlBbmltYXRpb25Sb290KHV1aWQpO1xuXG4gICAgaWYgKHZtLnNlbGVjdGVkSWQgPT09ICcnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RSb290ID0gYXdhaXQgSXF1ZXJ5QW5pbWF0aW9uUm9vdCh2bS5zZWxlY3RlZElkKTtcbiAgICBpZiAoc2VsZWN0Um9vdCAmJiBzZWxlY3RSb290ICE9PSByb290KSB7XG4gICAgICAgIC8vIDQuIOW9k+WJjeWPmOWKqOiKgueCueS4jeWcqOmAieS4reiKgueCueeahOWKqOeUu+agueiKgueCueS4i++8jOS4jeWBmuWTjeW6lFxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKEZsYWdzLmxvY2tVdWlkIHx8IEZsYWdzLmxvY2tVdWlkID09PSB1dWlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgRmxhZ3MubG9ja1V1aWQgPSB1dWlkO1xuICAgIEZsYWdzLmxvY2tUaW1lciAmJiBjbGVhclRpbWVvdXQoRmxhZ3MubG9ja1RpbWVyKTtcbiAgICBhd2FpdCBhbmltYXRpb25FZGl0b3IudXBkYXRlTm9kZSh1dWlkKTtcbiAgICBGbGFncy5sb2NrVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgRmxhZ3MubG9ja1V1aWQgPSAnJztcbiAgICB9LCA2MDApO1xufVxuXG4vLyBleGl0LCBjbG9zZSDliY3lj5bmtojmnKrmiafooYznmoQgbm9kZUNoYW5nZSBcbi8vIEZJWE1FOiDmsrvmoIfkuI3msrvmnKzvvIzlt7Lnu4/ov5vlhaXmiafooYzmtYHnqIvnmoTlm57osIPml6Dms5Xlj5bmtojmiJblgZzmraLmiafooYzjgILkuIDkuKrlpJrmrrUgYXdhaXQg55qE5byC5q2l5Ye95pWw77yM6ZyA6KaB5Yik5pat55qE5Zyw5pa55aSq5aSa5LqG77yM5pys6LSo5LiK5piv57yW56iL5qih5byP5a2Y5Zyo57y66Zm3XG5mdW5jdGlvbiBjYW5jZWxOb2RlQ2hhbmdlKHRoaXM6IGFueSkge1xuICAgIHRoaXMub25DaGFuZ2VOb2RlLmNhbmNlbCgpO1xufVxuIl19