'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.close = exports.beforeClose = exports.ready = exports.listeners = exports.methods = exports.$ = exports.fonts = exports.template = exports.style = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const panel_menu_1 = require("./components/panel-menu");
const panelData = __importStar(require("./components/panel-data"));
const treeData = __importStar(require("./components/tree-data"));
const utils = __importStar(require("./components/utils"));
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel;
let vm;
exports.style = fs_1.readFileSync(path_1.join(__dirname, '../dist/index.css'), 'utf8');
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../static', '/template/index.html'), 'utf8');
exports.fonts = [{ name: 'hierarchy' }];
exports.$ = { content: '.hierarchy' };
exports.methods = {
    /**
     * 暂存页面数据
     */
    async staging() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.act.expandLevels = treeData.getExpandLevels();
        await Editor.Message.request('hierarchy', 'staging', {
            assetUuid: panelData.act.assetUuid,
            animationUuid: panelData.act.animationUuid,
            expandLevels: panelData.act.expandLevels,
        });
    },
    /**
     * 恢复页面数据
     */
    async unstaging() {
        // 初始化缓存的折叠数据
        const stageData = await Editor.Message.request('hierarchy', 'unstaging');
        if (!stageData.assetUuid) {
            return;
        }
        await panelData.ready(stageData);
    },
    /**
     * 焦点面板搜索
     */
    find() {
        panelData.$.searchInput.focus();
    },
    /**
     * 拷贝节点
     */
    copy() {
        panelData.$.tree.copy();
    },
    /**
     * 粘贴节点
     */
    paste() {
        panelData.$.tree.paste();
    },
    /**
     * 粘贴为子节点
     */
    pasteAsChild() {
        panelData.$.tree.paste(null, false, true);
    },
    /**
     * 剪切节点
     * 剪切是预定的行为，只有再执行粘贴操作才会生效
     */
    cut() {
        panelData.$.tree.cut();
    },
    /**
     * 复制节点
     */
    duplicate() {
        panelData.$.tree.duplicate();
    },
    /**
     * 删除节点
     */
    delete() {
        panelData.$.tree.delete();
    },
    /**
     * 选择上一项
     */
    up() {
        panelData.$.tree.upDownLeftRight('up');
    },
    /**
     * 选择下一项
     */
    down() {
        panelData.$.tree.upDownLeftRight('down');
    },
    /**
     * 折叠
     */
    left() {
        panelData.$.tree.upDownLeftRight('left');
    },
    /**
     * 展开
     */
    right() {
        panelData.$.tree.upDownLeftRight('right');
    },
    /**
     * 向上连续多选
     */
    shiftUp() {
        panelData.$.tree.shiftUpDown('up');
    },
    /**
     * 向下连续多选
     */
    shiftDown() {
        panelData.$.tree.shiftUpDown('down');
    },
    /**
     * 重命名
     */
    rename() {
        panelData.$.tree.keyboardRename();
    },
    /**
     * 全选
     */
    selectAll() {
        panelData.$.tree.selectAll();
    },
    /**
     * 取消选择
     */
    selectClear() {
        panelData.$.tree.selectClear();
    },
    /**
     * 向上移动节点
     */
    moveUp() {
        panelData.$.tree.moveNode('up');
    },
    /**
     * 向下移动节点
     */
    moveDown() {
        panelData.$.tree.moveNode('down');
    },
    /**
     * 节点置顶（只在 group 内）
     */
    top() {
        panelData.$.tree.moveNode('top');
    },
    /**
     * 节点置底（只在 group 内）
     */
    bottom() {
        panelData.$.tree.moveNode('bottom');
    },
    /**
     * 场景准备就绪
     */
    async ready() {
        vm.sceneReady = true;
        Editor.Metrics.trackTimeStart('hierarchy:render-tree');
        await exports.methods.unstaging();
        await vm.refresh();
        panelData.$.tree.reselected(); // 让 ctrl + r 的刷新，能恢复节点的选中状态
        Editor.Metrics.trackTimeEnd('hierarchy:render-tree', { output: true });
    },
    /**
     * 关闭场景
     * 打开 loading 状态
     */
    async close() {
        await exports.methods.staging();
    },
    async save() {
        if (panelData.act.assetInfo) {
            return;
        }
        const assetUuid = await Editor.Message.request('scene', 'query-current-scene');
        // 前后场景切换时，中间状态查询到的 assetUuid 会为空，为空的不处理。
        if (!assetUuid) {
            return;
        }
        panelData.act.assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetUuid);
        panelData.act.assetUuid = assetUuid;
        await exports.methods.staging();
    },
    async animationStart(uuid) {
        if (!vm || !vm.sceneReady) {
            return;
        }
        await exports.methods.staging();
        vm.animationStart(uuid);
    },
    animationEnd() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        vm.animationEnd();
    },
    /**
     * 节点被修改
     * @param uuid 节点
     */
    changed(uuid) {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.changed(uuid);
    },
    /**
     * 创建一个新节点
     * @param uuid 节点
     */
    added(uuid) {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.added(uuid);
    },
    /**
     * 删除节点
     * @param uuid 节点
     */
    deleted(uuid) {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.deleted(uuid);
    },
    /**
     * 选中了某个物体
     * @param type 类型 'asset' 或 'node'
     * @param uuid 单个 uuid
     */
    selected(type, uuid) {
        if (!vm || !vm.sceneReady || type !== 'node') {
            return;
        }
        panelData.$.tree.selected(uuid);
    },
    /**
     * 取消选中了某个物体
     * @param type 类型 'asset' 或 'node'
     * @param uuid 单个 uuid
     */
    unselected(type, uuid) {
        if (!vm || !vm.sceneReady || type !== 'node') {
            return;
        }
        panelData.$.tree.unselected(uuid);
    },
    /**
     * 主动定位到节点
     * 并让其闪烁
     * @param uuid 选中物体的 uuid
     */
    async twinkle(uuid) {
        await utils.scrollIntoView(uuid);
        utils.twinkle.add(uuid, 'shake');
    },
};
exports.listeners = {
    resize() {
        vm && vm.resize();
    },
    show() {
        vm && vm.resize();
    },
    focus() {
        if (vm) {
            vm.refocus = true;
            setTimeout(() => {
                vm.refocus = false;
            }, 300);
        }
    },
};
/**
 * 面板 ready
 */
async function ready() {
    panel = this;
    vm = new Vue({
        el: panel.$.content,
        name: 'HierarchyApp',
        components: {
            tree: require('./components/tree'),
        },
        data: {
            refocus: false,
            sceneReady: false,
            isOperating: false,
            isRefreshing: false,
            droppableTypes: ['cc.Node'],
            allExpand: null,
            viewWidth: 0,
            viewHeight: 0,
            treeHeight: 0,
            dropBox: {},
            searchValue: '',
            searchType: 'name', // 指定搜索的类型
        },
        computed: {
            searchPlaceholder() {
                const vm = this;
                const typeText = vm.searchType;
                const firstLetterUpperCase = typeText.toLocaleUpperCase().substr(0, 1) + typeText.substr(1);
                return `i18n:hierarchy.menu.search${firstLetterUpperCase}`;
            },
            searchTypeLabel() {
                const vm = this;
                const firstLetterUpperCase = vm.searchType.toLocaleUpperCase().substr(0, 1) + vm.searchType.substr(1);
                return vm.t(`menu.search${firstLetterUpperCase}`);
            },
        },
        watch: {
            searchValue() {
                panelData.$.tree.search();
            },
            searchType() {
                panelData.$.searchInput.focus();
                panelData.$.tree.search();
            },
        },
        mounted() {
            panelData.$.panel = this;
            panelData.$.searchInput = this.$refs.searchInput;
            panelData.$.toggleExpandIcon = this.$refs.toggleExpandIcon;
            panelData.$.viewBox = this.$refs.viewBox;
            panelData.$.tree = this.$refs.tree;
            /**
             * 初始化监听 scroll 事件
             * 不放在 vue template 里面是因为有性能损耗，vue 里快速滚动的话会有前后空白区
             * 这样直接绑定性能最好
             * vm.treeHeight > vm.viewHeight 是为了保障此时处于有垂直滚动条的情况
             */
            this.$refs.viewBox.addEventListener('scroll', (event) => {
                if (vm.treeHeight > vm.viewHeight && vm.treeHeight < vm.viewHeight + event.target.scrollTop) {
                    panelData.$.tree.scrollTop = vm.treeHeight - vm.viewHeight;
                }
                else {
                    panelData.$.tree.scrollTop = event.target.scrollTop;
                }
            }, false);
            // 下一个 Vue Tick 触发
            this.resize();
        },
        methods: {
            /**
             * 翻译
             * @param key 字符
             */
            t(key) {
                // @ts-ignore
                return Editor.I18n.t(`hierarchy.${key}`);
            },
            /**
             * 刷新数据
             */
            async refresh() {
                if (!vm.sceneReady) {
                    return;
                }
                try {
                    vm.isRefreshing = true;
                    panelData.$.tree.update();
                    await treeData.reset();
                }
                catch (error) {
                    console.error(error);
                }
                finally {
                    vm.isRefreshing = false;
                    vm.isOperating = false;
                }
            },
            /**
             * 开始动画编辑模式
             * @param uuid 节点的 uuid
             */
            animationStart(uuid) {
                treeData.animationStart(uuid);
            },
            /**
             * 结束动画编辑模式
             */
            animationEnd() {
                treeData.animationEnd();
            },
            /**
             * 全部节点是否展开
             */
            allToggle() {
                panelData.$.tree.allToggle();
            },
            /**
             * 搜索 input 变动
             */
            searchChange() {
                vm.searchValue = panelData.$.searchInput.value.trim();
            },
            /**
             * 搜索框里按键盘 下箭头
             * 切换焦点，并选中搜索结果中第一个项
             * @param event 键盘事件
             */
            searchArrowDown(event, direction) {
                const target = event.target;
                target.blur();
                if (!vm.searchValue) {
                    panelData.$.tree.upDownLeftRight(direction);
                }
                else {
                    panelData.$.tree.ipcSelectFirstChild();
                }
            },
            clearSearch() {
                vm.searchValue = panelData.$.searchInput.value = '';
            },
            // 弹出创建资源菜单
            popupCreateMenu: panel_menu_1.popupCreateMenu,
            // 弹出面板搜索菜单
            popupSearchMenu: panel_menu_1.popupSearchMenu,
            // 面板的右击菜单
            popupPanelMenu: panel_menu_1.popupPanelMenu,
            /**
             * 取消搜索类型，默认 name
             */
            cancelSearchType() {
                vm.searchType = 'name';
            },
            /**
             * 调整可视区域高度
             */
            resize() {
                if (vm && panelData.$.viewBox) {
                    vm.viewWidth = panel.clientWidth;
                    vm.viewHeight = panelData.$.viewBox.offsetHeight;
                    panelData.$.tree.filter();
                }
            },
            /**
             * 以便在拖拽进文件时
             * 让面板重新获得焦点
             */
            focusWindow() {
                const remote = require('@electron/remote');
                remote.getCurrentWindow().focus();
            },
        },
    });
    // 场景就绪状态才需要查询数据
    vm.sceneReady = await Editor.Message.request('scene', 'query-is-ready');
    if (vm.sceneReady) {
        Editor.Metrics.trackTimeStart('hierarchy:render-tree');
        await exports.methods.unstaging();
        await vm.refresh();
        // 让 ctrl + r 的刷新，能恢复选中状态
        panelData.$.tree.reselected();
        Editor.Metrics.trackTimeEnd('hierarchy:render-tree', { output: true });
    }
    /**
     * 由于登录界面出现时使用了让相邻元素 display: none 的样式，
     * 此时取 this.$refs.viewBox.clientHeight 为 0，树形显示会不正确
     * 加入这个观察器，显示时重算
     */
    this._viewBoxResizeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio !== 0) {
                vm.resize();
            }
        });
    }, {
        root: vm.$el,
        rootMargin: '0px',
        threshold: 0.1,
    });
    this._viewBoxResizeObserver.observe(panelData.$.viewBox);
    // 识别外部扩展
    const pkgs = Editor.Package.getPackages({ enable: true });
    pkgs.forEach(panelData.extension.attach);
    Editor.Package.__protected__.on('enable', panelData.extension.attach);
    Editor.Package.__protected__.on('disable', panelData.extension.detach);
}
exports.ready = ready;
/**
 * 面板 beforeClose
 */
async function beforeClose() {
    if (vm) {
        await exports.methods.staging();
    }
}
exports.beforeClose = beforeClose;
/**
 * 面板 close
 */
async function close() {
    this._viewBoxResizeObserver?.disconnect();
    this._viewBoxResizeObserver = undefined;
    if (vm) {
        vm.sceneReady = false;
        vm.$destroy();
        vm = undefined;
    }
    Editor.Package.__protected__.removeListener('enable', panelData.extension.attach);
    Editor.Package.__protected__.removeListener('disable', panelData.extension.detach);
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRWIsMkJBQWtDO0FBQ2xDLCtCQUE0QjtBQUM1Qix3REFBMkY7QUFDM0YsbUVBQXFEO0FBQ3JELGlFQUFtRDtBQUNuRCwwREFBNEM7QUFFNUMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDdkMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUU1QixJQUFJLEtBQVUsQ0FBQztBQUNmLElBQUksRUFBTyxDQUFDO0FBRUMsUUFBQSxLQUFLLEdBQUcsaUJBQVksQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFbkUsUUFBQSxRQUFRLEdBQUcsaUJBQVksQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXRGLFFBQUEsS0FBSyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUVoQyxRQUFBLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztBQUU5QixRQUFBLE9BQU8sR0FBRztJQUNuQjs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1QsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUU7WUFDdkIsT0FBTztTQUNWO1FBRUQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hELE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFP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VUFBVSxLQUFLO0lBQ3RCLElBQUksQ0FBQyxzQkFBK0MsRUFBRSxVQUFVLEVBQUUsQ0FBQztJQUNwRSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsU0FBUyxDQUFDO0lBQ3hDLElBQUksRUFBRSxFQUFFO1FBQ0osRUFBRSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDdEIsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2QsRUFBRSxHQUFHLFNBQVMsQ0FBQztLQUNsQjtJQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsRixNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkYsQ0FBQztBQVZELHNCQVVDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwb3B1cENyZWF0ZU1lbnUsIHBvcHVwU2VhcmNoTWVudSwgcG9wdXBQYW5lbE1lbnUgfSBmcm9tICcuL2NvbXBvbmVudHMvcGFuZWwtbWVudSc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9jb21wb25lbnRzL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi9jb21wb25lbnRzL3RyZWUtZGF0YSc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL2NvbXBvbmVudHMvdXRpbHMnO1xuXG5jb25zdCBWdWUgPSByZXF1aXJlKCd2dWUvZGlzdC92dWUuanMnKTtcblZ1ZS5jb25maWcucHJvZHVjdGlvblRpcCA9IGZhbHNlO1xuVnVlLmNvbmZpZy5kZXZ0b29scyA9IGZhbHNlO1xuXG5sZXQgcGFuZWw6IGFueTtcbmxldCB2bTogYW55O1xuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2luZGV4LmNzcycpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMnLCAnL3RlbXBsYXRlL2luZGV4Lmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGZvbnRzID0gW3sgbmFtZTogJ2hpZXJhcmNoeScgfV07XG5cbmV4cG9ydCBjb25zdCAkID0geyBjb250ZW50OiAnLmhpZXJhcmNoeScgfTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog5pqC5a2Y6aG16Z2i5pWw5o2uXG4gICAgICovXG4gICAgYXN5bmMgc3RhZ2luZygpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC5leHBhbmRMZXZlbHMgPSB0cmVlRGF0YS5nZXRFeHBhbmRMZXZlbHMoKTtcbiAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnaGllcmFyY2h5JywgJ3N0YWdpbmcnLCB7XG4gICAgICAgICAgICBhc3NldFV1aWQ6IHBhbmVsRGF0YS5hY3QuYXNzZXRVdWlkLFxuICAgICAgICAgICAgYW5pbWF0aW9uVXVpZDogcGFuZWxEYXRhLmFjdC5hbmltYXRpb25VdWlkLFxuICAgICAgICAgICAgZXhwYW5kTGV2ZWxzOiBwYW5lbERhdGEuYWN0LmV4cGFuZExldmVscyxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmgaLlpI3pobXpnaLmlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyB1bnN0YWdpbmcoKSB7XG4gICAgICAgIC8vIOWIneWni+WMlue8k+WtmOeahOaKmOWPoOaVsOaNrlxuICAgICAgICBjb25zdCBzdGFnZURhdGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdoaWVyYXJjaHknLCAndW5zdGFnaW5nJyk7XG5cbiAgICAgICAgaWYgKCFzdGFnZURhdGEuYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBwYW5lbERhdGEucmVhZHkoc3RhZ2VEYXRhKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOeEpueCuemdouadv+aQnOe0olxuICAgICAqL1xuICAgIGZpbmQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi7fotJ3oioLngrlcbiAgICAgKi9cbiAgICBjb3B5KCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmNvcHkoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOeymOi0tOiKgueCuVxuICAgICAqL1xuICAgIHBhc3RlKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnBhc3RlKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnspjotLTkuLrlrZDoioLngrlcbiAgICAgKi9cbiAgICBwYXN0ZUFzQ2hpbGQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUucGFzdGUobnVsbCwgZmFsc2UsIHRydWUpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Ymq5YiH6IqC54K5XG4gICAgICog5Ymq5YiH5piv6aKE5a6a55qE6KGM5Li677yM5Y+q5pyJ5YaN5omn6KGM57KY6LS05pON5L2c5omN5Lya55Sf5pWIXG4gICAgICovXG4gICAgY3V0KCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmN1dCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi26IqC54K5XG4gICAgICovXG4gICAgZHVwbGljYXRlKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmR1cGxpY2F0ZSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yig6Zmk6IqC54K5XG4gICAgICovXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmRlbGV0ZSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5oup5LiK5LiA6aG5XG4gICAgICovXG4gICAgdXAoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBEb3duTGVmdFJpZ2h0KCd1cCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5oup5LiL5LiA6aG5XG4gICAgICovXG4gICAgZG93bigpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ2Rvd24nKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaKmOWPoFxuICAgICAqL1xuICAgIGxlZnQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBEb3duTGVmdFJpZ2h0KCdsZWZ0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlsZXlvIBcbiAgICAgKi9cbiAgICByaWdodCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ3JpZ2h0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkJHkuIrov57nu63lpJrpgIlcbiAgICAgKi9cbiAgICBzaGlmdFVwKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNoaWZ0VXBEb3duKCd1cCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ZCR5LiL6L+e57ut5aSa6YCJXG4gICAgICovXG4gICAgc2hpZnREb3duKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNoaWZ0VXBEb3duKCdkb3duJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43lkb3lkI1cbiAgICAgKi9cbiAgICByZW5hbWUoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUua2V5Ym9hcmRSZW5hbWUoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmAiVxuICAgICAqL1xuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWxlY3RBbGwoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieaLqVxuICAgICAqL1xuICAgIHNlbGVjdENsZWFyKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNlbGVjdENsZWFyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkJHkuIrnp7vliqjoioLngrlcbiAgICAgKi9cbiAgICBtb3ZlVXAoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUubW92ZU5vZGUoJ3VwJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkJHkuIvnp7vliqjoioLngrlcbiAgICAgKi9cbiAgICBtb3ZlRG93bigpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5tb3ZlTm9kZSgnZG93bicpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K5572u6aG277yI5Y+q5ZyoIGdyb3VwIOWGhe+8iVxuICAgICAqL1xuICAgIHRvcCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5tb3ZlTm9kZSgndG9wJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnnva7lupXvvIjlj6rlnKggZ3JvdXAg5YaF77yJXG4gICAgICovXG4gICAgYm90dG9tKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLm1vdmVOb2RlKCdib3R0b20nKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Zy65pmv5YeG5aSH5bCx57uqXG4gICAgICovXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIHZtLnNjZW5lUmVhZHkgPSB0cnVlO1xuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVTdGFydCgnaGllcmFyY2h5OnJlbmRlci10cmVlJyk7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMudW5zdGFnaW5nKCk7XG4gICAgICAgIGF3YWl0IHZtLnJlZnJlc2goKTtcblxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnJlc2VsZWN0ZWQoKTsgLy8g6K6pIGN0cmwgKyByIOeahOWIt+aWsO+8jOiDveaBouWkjeiKgueCueeahOmAieS4reeKtuaAgVxuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVFbmQoJ2hpZXJhcmNoeTpyZW5kZXItdHJlZScsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWz6Zet5Zy65pmvXG4gICAgICog5omT5byAIGxvYWRpbmcg54q25oCBXG4gICAgICovXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMuc3RhZ2luZygpO1xuICAgIH0sXG4gICAgYXN5bmMgc2F2ZSgpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3QuYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldFV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jdXJyZW50LXNjZW5lJyk7XG4gICAgICAgIC8vIOWJjeWQjuWcuuaZr+WIh+aNouaXtu+8jOS4remXtOeKtuaAgeafpeivouWIsOeahCBhc3NldFV1aWQg5Lya5Li656m677yM5Li656m655qE5LiN5aSE55CG44CCXG4gICAgICAgIGlmICghYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxEYXRhLmFjdC5hc3NldEluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgYXNzZXRVdWlkKTtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC5hc3NldFV1aWQgPSBhc3NldFV1aWQ7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMuc3RhZ2luZygpO1xuICAgIH0sXG5cbiAgICBhc3luYyBhbmltYXRpb25TdGFydCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbWV0aG9kcy5zdGFnaW5nKCk7XG4gICAgICAgIHZtLmFuaW1hdGlvblN0YXJ0KHV1aWQpO1xuICAgIH0sXG4gICAgYW5pbWF0aW9uRW5kKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS5hbmltYXRpb25FbmQoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCueiiq+S/ruaUuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGNoYW5nZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuY2hhbmdlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIm+W7uuS4gOS4quaWsOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFkZGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hZGRlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGRlbGV0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZGVsZXRlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reS6huafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOexu+WeiyAnYXNzZXQnIOaIliAnbm9kZSdcbiAgICAgKiBAcGFyYW0gdXVpZCDljZXkuKogdXVpZFxuICAgICAqL1xuICAgIHNlbGVjdGVkKHR5cGU6IHN0cmluZywgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkgfHwgdHlwZSAhPT0gJ25vZGUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNlbGVjdGVkKHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Y+W5raI6YCJ5Lit5LqG5p+Q5Liq54mp5L2TXG4gICAgICogQHBhcmFtIHR5cGUg57G75Z6LICdhc3NldCcg5oiWICdub2RlJ1xuICAgICAqIEBwYXJhbSB1dWlkIOWNleS4qiB1dWlkXG4gICAgICovXG4gICAgdW5zZWxlY3RlZCh0eXBlOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5IHx8IHR5cGUgIT09ICdub2RlJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51bnNlbGVjdGVkKHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Li75Yqo5a6a5L2N5Yiw6IqC54K5XG4gICAgICog5bm26K6p5YW26Zeq54OBXG4gICAgICogQHBhcmFtIHV1aWQg6YCJ5Lit54mp5L2T55qEIHV1aWRcbiAgICAgKi9cbiAgICBhc3luYyB0d2lua2xlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyh1dWlkKTtcbiAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ3NoYWtlJyk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBsaXN0ZW5lcnMgPSB7XG4gICAgcmVzaXplKCkge1xuICAgICAgICB2bSAmJiB2bS5yZXNpemUoKTtcbiAgICB9LFxuICAgIHNob3coKSB7XG4gICAgICAgIHZtICYmIHZtLnJlc2l6ZSgpO1xuICAgIH0sXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIGlmICh2bSkge1xuICAgICAgICAgICAgdm0ucmVmb2N1cyA9IHRydWU7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZtLnJlZm9jdXMgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgIH1cbiAgICB9LFxufTtcblxuLyoqXG4gKiDpnaLmnb8gcmVhZHlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWR5KHRoaXM6IGFueSkge1xuICAgIHBhbmVsID0gdGhpcztcblxuICAgIHZtID0gbmV3IFZ1ZSh7XG4gICAgICAgIGVsOiBwYW5lbC4kLmNvbnRlbnQsXG4gICAgICAgIG5hbWU6ICdIaWVyYXJjaHlBcHAnLFxuICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICB0cmVlOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvdHJlZScpLFxuICAgICAgICB9LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWZvY3VzOiBmYWxzZSwgLy8g6YeN5paw6I635b6X54Sm54K5XG4gICAgICAgICAgICBzY2VuZVJlYWR5OiBmYWxzZSxcbiAgICAgICAgICAgIGlzT3BlcmF0aW5nOiBmYWxzZSwgLy8g5piv5ZCm5q2j5Zyo5pON5L2c77yM5aaCIHJlbmFtZSwgYWRkLCBwYXN0ZVxuICAgICAgICAgICAgaXNSZWZyZXNoaW5nOiBmYWxzZSwgLy8g5piv5ZCm5q2j5Zyo5Yi35pawXG4gICAgICAgICAgICBkcm9wcGFibGVUeXBlczogWydjYy5Ob2RlJ10sXG4gICAgICAgICAgICBhbGxFeHBhbmQ6IG51bGwsXG4gICAgICAgICAgICB2aWV3V2lkdGg6IDAsIC8vIOW9k+WJjeagkeW9oueahOWPr+inhuWMuuWfn+WuveW6plxuICAgICAgICAgICAgdmlld0hlaWdodDogMCwgLy8g5b2T5YmN5qCR5b2i55qE5Y+v6KeG5Yy65Z+f6auY5bqmXG4gICAgICAgICAgICB0cmVlSGVpZ2h0OiAwLCAvLyDlrozmlbTmoJHlvaLnmoTlhajpg6jpq5jluqZcbiAgICAgICAgICAgIGRyb3BCb3g6IHt9LFxuICAgICAgICAgICAgc2VhcmNoVmFsdWU6ICcnLFxuICAgICAgICAgICAgc2VhcmNoVHlwZTogJ25hbWUnLCAvLyDmjIflrprmkJzntKLnmoTnsbvlnotcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgIHNlYXJjaFBsYWNlaG9sZGVyKCk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZVRleHQgPSB2bS5zZWFyY2hUeXBlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMZXR0ZXJVcHBlckNhc2UgPSB0eXBlVGV4dC50b0xvY2FsZVVwcGVyQ2FzZSgpLnN1YnN0cigwLCAxKSArIHR5cGVUZXh0LnN1YnN0cigxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGkxOG46aGllcmFyY2h5Lm1lbnUuc2VhcmNoJHtmaXJzdExldHRlclVwcGVyQ2FzZX1gO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlYXJjaFR5cGVMYWJlbCgpOiBzdHJpbmcge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZtOiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGV0dGVyVXBwZXJDYXNlID0gdm0uc2VhcmNoVHlwZS50b0xvY2FsZVVwcGVyQ2FzZSgpLnN1YnN0cigwLCAxKSArIHZtLnNlYXJjaFR5cGUuc3Vic3RyKDEpO1xuICAgICAgICAgICAgICAgIHJldHVybiB2bS50KGBtZW51LnNlYXJjaCR7Zmlyc3RMZXR0ZXJVcHBlckNhc2V9YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB3YXRjaDoge1xuICAgICAgICAgICAgc2VhcmNoVmFsdWUoKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWFyY2goKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWFyY2hUeXBlKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWFyY2goKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1vdW50ZWQoKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbCA9IHRoaXM7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dCA9IHRoaXMuJHJlZnMuc2VhcmNoSW5wdXQ7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC50b2dnbGVFeHBhbmRJY29uID0gdGhpcy4kcmVmcy50b2dnbGVFeHBhbmRJY29uO1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveCA9IHRoaXMuJHJlZnMudmlld0JveDtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUgPSB0aGlzLiRyZWZzLnRyZWU7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yid5aeL5YyW55uR5ZCsIHNjcm9sbCDkuovku7ZcbiAgICAgICAgICAgICAqIOS4jeaUvuWcqCB2dWUgdGVtcGxhdGUg6YeM6Z2i5piv5Zug5Li65pyJ5oCn6IO95o2f6ICX77yMdnVlIOmHjOW/q+mAn+a7muWKqOeahOivneS8muacieWJjeWQjuepuueZveWMulxuICAgICAgICAgICAgICog6L+Z5qC355u05o6l57uR5a6a5oCn6IO95pyA5aW9XG4gICAgICAgICAgICAgKiB2bS50cmVlSGVpZ2h0ID4gdm0udmlld0hlaWdodCDmmK/kuLrkuobkv53pmpzmraTml7blpITkuo7mnInlnoLnm7Tmu5rliqjmnaHnmoTmg4XlhrVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy4kcmVmcy52aWV3Qm94LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgJ3Njcm9sbCcsXG4gICAgICAgICAgICAgICAgKGV2ZW50OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZtLnRyZWVIZWlnaHQgPiB2bS52aWV3SGVpZ2h0ICYmIHZtLnRyZWVIZWlnaHQgPCB2bS52aWV3SGVpZ2h0ICsgZXZlbnQudGFyZ2V0LnNjcm9sbFRvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zY3JvbGxUb3AgPSB2bS50cmVlSGVpZ2h0IC0gdm0udmlld0hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2Nyb2xsVG9wID0gZXZlbnQudGFyZ2V0LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyDkuIvkuIDkuKogVnVlIFRpY2sg6Kem5Y+RXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgICB9LFxuICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe/u+ivkVxuICAgICAgICAgICAgICogQHBhcmFtIGtleSDlrZfnrKZcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KGBoaWVyYXJjaHkuJHtrZXl9YCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDliLfmlrDmlbDmja5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXN5bmMgcmVmcmVzaCgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmlzUmVmcmVzaGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pc1JlZnJlc2hpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdm0uaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDlvIDlp4vliqjnlLvnvJbovpHmqKHlvI9cbiAgICAgICAgICAgICAqIEBwYXJhbSB1dWlkIOiKgueCueeahCB1dWlkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFuaW1hdGlvblN0YXJ0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLmFuaW1hdGlvblN0YXJ0KHV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog57uT5p2f5Yqo55S757yW6L6R5qih5byPXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFuaW1hdGlvbkVuZCgpIHtcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS5hbmltYXRpb25FbmQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWFqOmDqOiKgueCueaYr+WQpuWxleW8gFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhbGxUb2dnbGUoKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hbGxUb2dnbGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaQnOe0oiBpbnB1dCDlj5jliqhcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2VhcmNoQ2hhbmdlKCkge1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaFZhbHVlID0gcGFuZWxEYXRhLiQuc2VhcmNoSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pCc57Si5qGG6YeM5oyJ6ZSu55uYIOS4i+eureWktFxuICAgICAgICAgICAgICog5YiH5o2i54Sm54K577yM5bm26YCJ5Lit5pCc57Si57uT5p6c5Lit56ys5LiA5Liq6aG5XG4gICAgICAgICAgICAgKiBAcGFyYW0gZXZlbnQg6ZSu55uY5LqL5Lu2XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNlYXJjaEFycm93RG93bihldmVudDogS2V5Ym9hcmRFdmVudCwgZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmJsdXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZtLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBEb3duTGVmdFJpZ2h0KGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5pcGNTZWxlY3RGaXJzdENoaWxkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNsZWFyU2VhcmNoKCkge1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaFZhbHVlID0gcGFuZWxEYXRhLiQuc2VhcmNoSW5wdXQudmFsdWUgPSAnJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyDlvLnlh7rliJvlu7rotYTmupDoj5zljZVcbiAgICAgICAgICAgIHBvcHVwQ3JlYXRlTWVudSxcbiAgICAgICAgICAgIC8vIOW8ueWHuumdouadv+aQnOe0ouiPnOWNlVxuICAgICAgICAgICAgcG9wdXBTZWFyY2hNZW51LFxuICAgICAgICAgICAgLy8g6Z2i5p2/55qE5Y+z5Ye76I+c5Y2VXG4gICAgICAgICAgICBwb3B1cFBhbmVsTWVudSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Y+W5raI5pCc57Si57G75Z6L77yM6buY6K6kIG5hbWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2FuY2VsU2VhcmNoVHlwZSgpIHtcbiAgICAgICAgICAgICAgICB2bS5zZWFyY2hUeXBlID0gJ25hbWUnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6LCD5pW05Y+v6KeG5Yy65Z+f6auY5bqmXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAodm0gJiYgcGFuZWxEYXRhLiQudmlld0JveCkge1xuICAgICAgICAgICAgICAgICAgICB2bS52aWV3V2lkdGggPSBwYW5lbC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdm0udmlld0hlaWdodCA9IHBhbmVsRGF0YS4kLnZpZXdCb3gub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLmZpbHRlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS7peS+v+WcqOaLluaLvei/m+aWh+S7tuaXtlxuICAgICAgICAgICAgICog6K6p6Z2i5p2/6YeN5paw6I635b6X54Sm54K5XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZvY3VzV2luZG93KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IHJlcXVpcmUoJ0BlbGVjdHJvbi9yZW1vdGUnKTtcbiAgICAgICAgICAgICAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLmZvY3VzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8g5Zy65pmv5bCx57uq54q25oCB5omN6ZyA6KaB5p+l6K+i5pWw5o2uXG4gICAgdm0uc2NlbmVSZWFkeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWlzLXJlYWR5Jyk7XG4gICAgaWYgKHZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgRWRpdG9yLk1ldHJpY3MudHJhY2tUaW1lU3RhcnQoJ2hpZXJhcmNoeTpyZW5kZXItdHJlZScpO1xuICAgICAgICBhd2FpdCBtZXRob2RzLnVuc3RhZ2luZygpO1xuICAgICAgICBhd2FpdCB2bS5yZWZyZXNoKCk7XG5cbiAgICAgICAgLy8g6K6pIGN0cmwgKyByIOeahOWIt+aWsO+8jOiDveaBouWkjemAieS4reeKtuaAgVxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnJlc2VsZWN0ZWQoKTtcbiAgICAgICAgRWRpdG9yLk1ldHJpY3MudHJhY2tUaW1lRW5kKCdoaWVyYXJjaHk6cmVuZGVyLXRyZWUnLCB7IG91dHB1dDogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDnlLHkuo7nmbvlvZXnlYzpnaLlh7rnjrDml7bkvb/nlKjkuoborqnnm7jpgrvlhYPntKAgZGlzcGxheTogbm9uZSDnmoTmoLflvI/vvIxcbiAgICAgKiDmraTml7blj5YgdGhpcy4kcmVmcy52aWV3Qm94LmNsaWVudEhlaWdodCDkuLogMO+8jOagkeW9ouaYvuekuuS8muS4jeato+ehrlxuICAgICAqIOWKoOWFpei/meS4quinguWvn+WZqO+8jOaYvuekuuaXtumHjeeul1xuICAgICAqL1xuICAgIHRoaXMuX3ZpZXdCb3hSZXNpemVPYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgICAgKGVudHJpZXMpID0+IHtcbiAgICAgICAgICAgIGVudHJpZXMuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdm0ucmVzaXplKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJvb3Q6IHZtLiRlbCxcbiAgICAgICAgICAgIHJvb3RNYXJnaW46ICcwcHgnLFxuICAgICAgICAgICAgdGhyZXNob2xkOiAwLjEsXG4gICAgICAgIH0sXG4gICAgKTtcbiAgICB0aGlzLl92aWV3Qm94UmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShwYW5lbERhdGEuJC52aWV3Qm94KTtcblxuICAgIC8vIOivhuWIq+WklumDqOaJqeWxlVxuICAgIGNvbnN0IHBrZ3MgPSBFZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcyh7IGVuYWJsZTogdHJ1ZSB9KTtcbiAgICBwa2dzLmZvckVhY2gocGFuZWxEYXRhLmV4dGVuc2lvbi5hdHRhY2gpO1xuICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2VuYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uYXR0YWNoKTtcbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdkaXNhYmxlJywgcGFuZWxEYXRhLmV4dGVuc2lvbi5kZXRhY2gpO1xufVxuXG4vKipcbiAqIOmdouadvyBiZWZvcmVDbG9zZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmVmb3JlQ2xvc2UoKSB7XG4gICAgaWYgKHZtKSB7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMuc3RhZ2luZygpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDpnaLmnb8gY2xvc2VcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlKHRoaXM6IGFueSkge1xuICAgICh0aGlzLl92aWV3Qm94UmVzaXplT2JzZXJ2ZXIgYXMgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIpPy5kaXNjb25uZWN0KCk7XG4gICAgdGhpcy5fdmlld0JveFJlc2l6ZU9ic2VydmVyID0gdW5kZWZpbmVkO1xuICAgIGlmICh2bSkge1xuICAgICAgICB2bS5zY2VuZVJlYWR5ID0gZmFsc2U7XG4gICAgICAgIHZtLiRkZXN0cm95KCk7XG4gICAgICAgIHZtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdlbmFibGUnLCBwYW5lbERhdGEuZXh0ZW5zaW9uLmF0dGFjaCk7XG4gICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5yZW1vdmVMaXN0ZW5lcignZGlzYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uZGV0YWNoKTtcbn1cbiJdfQ==