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
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.beforeClose = exports.ready = exports.listeners = exports.methods = exports.$ = exports.template = exports.style = void 0;
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
const vueTemplate = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../static', '/template/index.html'), 'utf8');
const HierarchyPanelVM = Vue.extend({
    name: 'HierarchyPanelVM',
    components: {
        tree: require('./components/tree'),
    },
    data() {
        return {
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
        };
    },
    computed: {
        searchPlaceholder() {
            const typeText = this.searchType;
            const firstLetterUpperCase = typeText.toLocaleUpperCase().substr(0, 1) + typeText.substr(1);
            return `i18n:hierarchy.menu.search${firstLetterUpperCase}`;
        },
        searchTypeLabel() {
            const firstLetterUpperCase = this.searchType.toLocaleUpperCase().substr(0, 1) + this.searchType.substr(1);
            return this.t(`menu.search${firstLetterUpperCase}`);
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
         * this.treeHeight > this.viewHeight 是为了保障此时处于有垂直滚动条的情况
         */
        panelData.$.viewBox.addEventListener('scroll', (event) => {
            if (this.treeHeight > this.viewHeight && this.treeHeight < this.viewHeight + event.target.scrollTop) {
                panelData.$.tree.scrollTop = this.treeHeight - this.viewHeight;
            }
            else {
                panelData.$.tree.scrollTop = event.target.scrollTop;
            }
        }, false);
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
            if (!this.sceneReady) {
                return;
            }
            try {
                this.isRefreshing = true;
                panelData.$.tree.update();
                await treeData.reset();
            }
            catch (error) {
                console.error(error);
            }
            finally {
                this.isRefreshing = false;
                this.isOperating = false;
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
            this.searchValue = panelData.$.searchInput.value.trim();
        },
        /**
         * 搜索框里按键盘 下箭头
         * 切换焦点，并选中搜索结果中第一个项
         * @param event 键盘事件
         */
        searchArrowDown(event, direction) {
            const target = event.target;
            target.blur();
            if (!this.searchValue) {
                panelData.$.tree.upDownLeftRight(direction);
            }
            else {
                panelData.$.tree.ipcSelectFirstChild();
            }
        },
        clearSearch() {
            this.searchValue = panelData.$.searchInput.value = '';
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
            this.searchType = 'name';
        },
        /**
         * 调整可视区域高度
         */
        resize() {
            if (vm && panelData.$.viewBox) {
                this.viewWidth = panel.clientWidth;
                this.viewHeight = panelData.$.viewBox.offsetHeight;
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
    template: vueTemplate,
});
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../dist/index.css'), 'utf8');
exports.template = '<div class="container"></div>';
exports.$ = {
    container: '.container',
};
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
        if (vm) {
            await panelData.ready(stageData);
        }
    },
    /**
     * 焦点面板搜索
     */
    find() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.searchInput.focus();
    },
    /**
     * 拷贝节点
     */
    copy() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.copy();
    },
    /**
     * 粘贴节点
     */
    paste() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.paste();
    },
    /**
     * 粘贴为子节点
     */
    pasteAsChild() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.paste(null, false, true);
    },
    /**
     * 剪切节点
     * 剪切是预定的行为，只有再执行粘贴操作才会生效
     */
    cut() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.cut();
    },
    /**
     * 复制节点
     */
    duplicate() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.duplicate();
    },
    /**
     * 删除节点
     */
    delete() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.delete();
    },
    /**
     * 选择上一项
     */
    up() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.upDownLeftRight('up');
    },
    /**
     * 选择下一项
     */
    down() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.upDownLeftRight('down');
    },
    /**
     * 折叠
     */
    left() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.upDownLeftRight('left');
    },
    /**
     * 展开
     */
    right() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.upDownLeftRight('right');
    },
    /**
     * 向上连续多选
     */
    shiftUp() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.shiftUpDown('up');
    },
    /**
     * 向下连续多选
     */
    shiftDown() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.shiftUpDown('down');
    },
    /**
     * 重命名
     */
    rename() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.keyboardRename();
    },
    /**
     * 全选
     */
    selectAll() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.selectAll();
    },
    /**
     * 取消选择
     */
    selectClear() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.selectClear();
    },
    /**
     * 向上移动节点
     */
    moveUp() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.moveNode('up');
    },
    /**
     * 向下移动节点
     */
    moveDown() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.moveNode('down');
    },
    /**
     * 节点置顶（只在 group 内）
     */
    top() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.moveNode('top');
    },
    /**
     * 节点置底（只在 group 内）
     */
    bottom() {
        if (!vm || !vm.sceneReady) {
            return;
        }
        panelData.$.tree.moveNode('bottom');
    },
    /**
     * 场景准备就绪
     */
    async ready() {
        if (!vm) {
            return;
        }
        Editor.Metrics.trackTimeStart('hierarchy:render-tree');
        vm.sceneReady = true;
        await exports.methods.unstaging();
        if (vm) {
            await vm.refresh();
            vm && panelData.$.tree.reselected(); // 让 ctrl + r 的刷新，能恢复节点的选中状态
        }
        Editor.Metrics.trackTimeEnd('hierarchy:render-tree', { output: true });
    },
    /**
     * 关闭场景
     * 打开 loading 状态
     */
    async close() {
        if (!vm) {
            return;
        }
        await exports.methods.staging();
    },
    async save(uuid) {
        if (!vm) {
            return;
        }
        if (panelData.act.assetInfo) {
            return;
        }
        const assetUuid = uuid ?? await Editor.Message.request(panelData.act.messageProtocol.scene, 'query-current-scene');
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
        if (!vm || !vm.sceneReady) {
            return;
        }
        await utils.scrollIntoView(uuid);
        utils.twinkle.add(uuid, 'hint');
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
                vm && (vm.refocus = false);
            }, 300);
        }
    },
};
/**
 * 面板 ready
 */
async function ready() {
    // @ts-ignore
    panel = this;
    vm?.$destroy();
    vm = new HierarchyPanelVM();
    vm.$mount(panel.$.container);
    /**
     * 由于登录界面出现时使用了让相邻元素 display: none 的样式，
     * 此时取 this.$refs.viewBox.clientHeight 为 0，树形显示会不正确
     * 加入这个观察器，显示时重算
     */
    panel.viewBoxObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio !== 0) {
                vm && vm.resize();
            }
        });
    }, {
        root: vm.$el,
        rootMargin: '0px',
        threshold: 0.1,
    });
    panel.viewBoxObserver.observe(panelData.$.viewBox);
    // 识别外部扩展
    const pkgs = Editor.Package.getPackages({ enable: true });
    pkgs.forEach(panelData.extension.attach);
    Editor.Package.__protected__.on('enable', panelData.extension.attach);
    Editor.Package.__protected__.on('disable', panelData.extension.detach);
    // 场景就绪状态才需要查询数据
    const ready = await Editor.Message.request(panelData.act.messageProtocol.scene, 'query-is-ready');
    if (ready) {
        await exports.methods.ready();
    }
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
function close() {
    if (vm) {
        vm.sceneReady = false;
    }
    if (panel) {
        panel.viewBoxObserver.disconnect();
    }
    Editor.Package.__protected__.removeListener('enable', panelData.extension.attach);
    Editor.Package.__protected__.removeListener('disable', panelData.extension.detach);
    vm?.$destroy();
    vm = null;
    panel = null;
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUViLDJCQUFrQztBQUNsQywrQkFBNEI7QUFDNUIsd0RBQTJGO0FBQzNGLG1FQUFxRDtBQUNyRCxpRUFBbUQ7QUFDbkQsMERBQTRDO0FBRzVDLE1BQU0sR0FBRyxHQUFtQixPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDakMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBRTVCLElBQUksS0FBVSxDQUFDO0FBQ2YsSUFBSSxFQUFPLENBQUM7QUFFWixNQUFNLFdBQVcsR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRS9GLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNoQyxJQUFJLEVBQUUsa0JBQWtCO0lBQ3hCLFVBQVUsRUFBRTtRQUNSLElBQUksRUFBRSxPQUFPLENBQUMsbUJBQW1CLENBQUM7S0FDckM7SUFDRCxJQUFJO1FBQ0EsT0FBTztZQUNILE9BQU8sRUFBRSxLQUFLO1lBQ2QsVUFBVSxFQUFFLEtBQUs7WUFDakIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsY0FBYyxFQUFFLENBQUMsU0FBUyxDQUFDO1lBQzNCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsU0FBUyxFQUFFLENBQUM7WUFDWixVQUFVLEVBQUUsQ0FBQztZQUNiLFVBQVUsRUFBRSxDQUFDO1lBQ2IsT0FBTyxFQUFFLEVBQUU7WUFDWCxXQUFXLEVBQUUsRUFBRTtZQUNmLFVBQVUsRUFBRSxN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QztJQUNWLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsQ0FBQztBQWZELHNCQWVDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwb3B1cENyZWF0ZU1lbnUsIHBvcHVwU2VhcmNoTWVudSwgcG9wdXBQYW5lbE1lbnUgfSBmcm9tICcuL2NvbXBvbmVudHMvcGFuZWwtbWVudSc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9jb21wb25lbnRzL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi9jb21wb25lbnRzL3RyZWUtZGF0YSc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL2NvbXBvbmVudHMvdXRpbHMnO1xuXG5pbXBvcnQgdHlwZSB7IFZ1ZUNvbnN0cnVjdG9yIH0gZnJvbSAndnVlJztcbmNvbnN0IFZ1ZTogVnVlQ29uc3RydWN0b3IgPSByZXF1aXJlKCd2dWUvZGlzdC92dWUuanMnKTtcblZ1ZS5jb25maWcucHJvZHVjdGlvblRpcCA9IGZhbHNlO1xuVnVlLmNvbmZpZy5kZXZ0b29scyA9IGZhbHNlO1xuXG5sZXQgcGFuZWw6IGFueTtcbmxldCB2bTogYW55O1xuXG5jb25zdCB2dWVUZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uL3N0YXRpYycsICcvdGVtcGxhdGUvaW5kZXguaHRtbCcpLCAndXRmOCcpO1xuXG5jb25zdCBIaWVyYXJjaHlQYW5lbFZNID0gVnVlLmV4dGVuZCh7XG4gICAgbmFtZTogJ0hpZXJhcmNoeVBhbmVsVk0nLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgdHJlZTogcmVxdWlyZSgnLi9jb21wb25lbnRzL3RyZWUnKSxcbiAgICB9LFxuICAgIGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZWZvY3VzOiBmYWxzZSwgLy8g6YeN5paw6I635b6X54Sm54K5XG4gICAgICAgICAgICBzY2VuZVJlYWR5OiBmYWxzZSxcbiAgICAgICAgICAgIGlzT3BlcmF0aW5nOiBmYWxzZSwgLy8g5piv5ZCm5q2j5Zyo5pON5L2c77yM5aaCIHJlbmFtZSwgYWRkLCBwYXN0ZVxuICAgICAgICAgICAgaXNSZWZyZXNoaW5nOiBmYWxzZSwgLy8g5piv5ZCm5q2j5Zyo5Yi35pawXG4gICAgICAgICAgICBkcm9wcGFibGVUeXBlczogWydjYy5Ob2RlJ10sXG4gICAgICAgICAgICBhbGxFeHBhbmQ6IG51bGwsXG4gICAgICAgICAgICB2aWV3V2lkdGg6IDAsIC8vIOW9k+WJjeagkeW9oueahOWPr+inhuWMuuWfn+WuveW6plxuICAgICAgICAgICAgdmlld0hlaWdodDogMCwgLy8g5b2T5YmN5qCR5b2i55qE5Y+v6KeG5Yy65Z+f6auY5bqmXG4gICAgICAgICAgICB0cmVlSGVpZ2h0OiAwLCAvLyDlrozmlbTmoJHlvaLnmoTlhajpg6jpq5jluqZcbiAgICAgICAgICAgIGRyb3BCb3g6IHt9LFxuICAgICAgICAgICAgc2VhcmNoVmFsdWU6ICcnLFxuICAgICAgICAgICAgc2VhcmNoVHlwZTogJ25hbWUnLCAvLyDmjIflrprmkJzntKLnmoTnsbvlnotcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHNlYXJjaFBsYWNlaG9sZGVyKCk6IHN0cmluZyB7XG4gICAgICAgICAgICBjb25zdCB0eXBlVGV4dCA9IHRoaXMuc2VhcmNoVHlwZTtcblxuICAgICAgICAgICAgY29uc3QgZmlyc3RMZXR0ZXJVcHBlckNhc2UgPSB0eXBlVGV4dC50b0xvY2FsZVVwcGVyQ2FzZSgpLnN1YnN0cigwLCAxKSArIHR5cGVUZXh0LnN1YnN0cigxKTtcbiAgICAgICAgICAgIHJldHVybiBgaTE4bjpoaWVyYXJjaHkubWVudS5zZWFyY2gke2ZpcnN0TGV0dGVyVXBwZXJDYXNlfWA7XG4gICAgICAgIH0sXG4gICAgICAgIHNlYXJjaFR5cGVMYWJlbCgpOiBzdHJpbmcge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RMZXR0ZXJVcHBlckNhc2UgPSB0aGlzLnNlYXJjaFR5cGUudG9Mb2NhbGVVcHBlckNhc2UoKS5zdWJzdHIoMCwgMSkgKyB0aGlzLnNlYXJjaFR5cGUuc3Vic3RyKDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudChgbWVudS5zZWFyY2gke2ZpcnN0TGV0dGVyVXBwZXJDYXNlfWApO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgd2F0Y2g6IHtcbiAgICAgICAgc2VhcmNoVmFsdWUoKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNlYXJjaCgpO1xuICAgICAgICB9LFxuICAgICAgICBzZWFyY2hUeXBlKCkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQuc2VhcmNoSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VhcmNoKCk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBtb3VudGVkKCkge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbCA9IHRoaXM7XG4gICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0ID0gdGhpcy4kcmVmcy5zZWFyY2hJbnB1dDtcbiAgICAgICAgcGFuZWxEYXRhLiQudG9nZ2xlRXhwYW5kSWNvbiA9IHRoaXMuJHJlZnMudG9nZ2xlRXhwYW5kSWNvbjtcbiAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveCA9IHRoaXMuJHJlZnMudmlld0JveDtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZSA9IHRoaXMuJHJlZnMudHJlZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yid5aeL5YyW55uR5ZCsIHNjcm9sbCDkuovku7ZcbiAgICAgICAgICog5LiN5pS+5ZyoIHZ1ZSB0ZW1wbGF0ZSDph4zpnaLmmK/lm6DkuLrmnInmgKfog73mjZ/ogJfvvIx2dWUg6YeM5b+r6YCf5rua5Yqo55qE6K+d5Lya5pyJ5YmN5ZCO56m655m95Yy6XG4gICAgICAgICAqIOi/meagt+ebtOaOpee7keWumuaAp+iDveacgOWlvVxuICAgICAgICAgKiB0aGlzLnRyZWVIZWlnaHQgPiB0aGlzLnZpZXdIZWlnaHQg5piv5Li65LqG5L+d6Zqc5q2k5pe25aSE5LqO5pyJ5Z6C55u05rua5Yqo5p2h55qE5oOF5Ya1XG4gICAgICAgICAqL1xuICAgICAgICBwYW5lbERhdGEuJC52aWV3Qm94LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAnc2Nyb2xsJyxcbiAgICAgICAgICAgIChldmVudDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJlZUhlaWdodCA+IHRoaXMudmlld0hlaWdodCAmJiB0aGlzLnRyZWVIZWlnaHQgPCB0aGlzLnZpZXdIZWlnaHQgKyBldmVudC50YXJnZXQuc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2Nyb2xsVG9wID0gdGhpcy50cmVlSGVpZ2h0IC0gdGhpcy52aWV3SGVpZ2h0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2Nyb2xsVG9wID0gZXZlbnQudGFyZ2V0LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICk7XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnv7vor5FcbiAgICAgICAgICogQHBhcmFtIGtleSDlrZfnrKZcbiAgICAgICAgICovXG4gICAgICAgIHQoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoYGhpZXJhcmNoeS4ke2tleX1gKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIt+aWsOaVsOaNrlxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgcmVmcmVzaCgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNSZWZyZXNoaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEucmVzZXQoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNSZWZyZXNoaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog5byA5aeL5Yqo55S757yW6L6R5qih5byPXG4gICAgICAgICAqIEBwYXJhbSB1dWlkIOiKgueCueeahCB1dWlkXG4gICAgICAgICAqL1xuICAgICAgICBhbmltYXRpb25TdGFydCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLmFuaW1hdGlvblN0YXJ0KHV1aWQpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog57uT5p2f5Yqo55S757yW6L6R5qih5byPXG4gICAgICAgICAqL1xuICAgICAgICBhbmltYXRpb25FbmQoKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5hbmltYXRpb25FbmQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWFqOmDqOiKgueCueaYr+WQpuWxleW8gFxuICAgICAgICAgKi9cbiAgICAgICAgYWxsVG9nZ2xlKCkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hbGxUb2dnbGUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaQnOe0oiBpbnB1dCDlj5jliqhcbiAgICAgICAgICovXG4gICAgICAgIHNlYXJjaENoYW5nZSgpIHtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVmFsdWUgPSBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmkJzntKLmoYbph4zmjInplK7nm5gg5LiL566t5aS0XG4gICAgICAgICAqIOWIh+aNoueEpueCue+8jOW5tumAieS4reaQnOe0oue7k+aenOS4reesrOS4gOS4qumhuVxuICAgICAgICAgKiBAcGFyYW0gZXZlbnQg6ZSu55uY5LqL5Lu2XG4gICAgICAgICAqL1xuICAgICAgICBzZWFyY2hBcnJvd0Rvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQsIGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICB0YXJnZXQuYmx1cigpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5pcGNTZWxlY3RGaXJzdENoaWxkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFyU2VhcmNoKCkge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hWYWx1ZSA9IHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LnZhbHVlID0gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIOW8ueWHuuWIm+W7uui1hOa6kOiPnOWNlVxuICAgICAgICBwb3B1cENyZWF0ZU1lbnUsXG4gICAgICAgIC8vIOW8ueWHuumdouadv+aQnOe0ouiPnOWNlVxuICAgICAgICBwb3B1cFNlYXJjaE1lbnUsXG4gICAgICAgIC8vIOmdouadv+eahOWPs+WHu+iPnOWNlVxuICAgICAgICBwb3B1cFBhbmVsTWVudSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWPlua2iOaQnOe0ouexu+Wei++8jOm7mOiupCBuYW1lXG4gICAgICAgICAqL1xuICAgICAgICBjYW5jZWxTZWFyY2hUeXBlKCkge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUeXBlID0gJ25hbWUnO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog6LCD5pW05Y+v6KeG5Yy65Z+f6auY5bqmXG4gICAgICAgICAqL1xuICAgICAgICByZXNpemUoKSB7XG4gICAgICAgICAgICBpZiAodm0gJiYgcGFuZWxEYXRhLiQudmlld0JveCkge1xuICAgICAgICAgICAgICAgIHRoaXMudmlld1dpZHRoID0gcGFuZWwuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3SGVpZ2h0ID0gcGFuZWxEYXRhLiQudmlld0JveC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5maWx0ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS7peS+v+WcqOaLluaLvei/m+aWh+S7tuaXtlxuICAgICAgICAgKiDorqnpnaLmnb/ph43mlrDojrflvpfnhKbngrlcbiAgICAgICAgICovXG4gICAgICAgIGZvY3VzV2luZG93KCkge1xuICAgICAgICAgICAgY29uc3QgcmVtb3RlID0gcmVxdWlyZSgnQGVsZWN0cm9uL3JlbW90ZScpO1xuICAgICAgICAgICAgcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKS5mb2N1cygpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHZ1ZVRlbXBsYXRlLFxufSk7XG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uL2Rpc3QvaW5kZXguY3NzJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+PC9kaXY+JztcblxuZXhwb3J0IGNvbnN0ICQgPSB7XG4gICAgY29udGFpbmVyOiAnLmNvbnRhaW5lcicsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDmmoLlrZjpobXpnaLmlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyBzdGFnaW5nKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuYWN0LmV4cGFuZExldmVscyA9IHRyZWVEYXRhLmdldEV4cGFuZExldmVscygpO1xuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdoaWVyYXJjaHknLCAnc3RhZ2luZycsIHtcbiAgICAgICAgICAgIGFzc2V0VXVpZDogcGFuZWxEYXRhLmFjdC5hc3NldFV1aWQsXG4gICAgICAgICAgICBhbmltYXRpb25VdWlkOiBwYW5lbERhdGEuYWN0LmFuaW1hdGlvblV1aWQsXG4gICAgICAgICAgICBleHBhbmRMZXZlbHM6IHBhbmVsRGF0YS5hY3QuZXhwYW5kTGV2ZWxzLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaBouWkjemhtemdouaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIHVuc3RhZ2luZygpIHtcbiAgICAgICAgLy8g5Yid5aeL5YyW57yT5a2Y55qE5oqY5Y+g5pWw5o2uXG4gICAgICAgIGNvbnN0IHN0YWdlRGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2hpZXJhcmNoeScsICd1bnN0YWdpbmcnKTtcblxuICAgICAgICBpZiAoIXN0YWdlRGF0YS5hc3NldFV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2bSl7XG4gICAgICAgICAgICBhd2FpdCBwYW5lbERhdGEucmVhZHkoc3RhZ2VEYXRhKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog54Sm54K56Z2i5p2/5pCc57SiXG4gICAgICovXG4gICAgZmluZCgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ou36LSd6IqC54K5XG4gICAgICovXG4gICAgY29weSgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmNvcHkoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOeymOi0tOiKgueCuVxuICAgICAqL1xuICAgIHBhc3RlKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUucGFzdGUoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOeymOi0tOS4uuWtkOiKgueCuVxuICAgICAqL1xuICAgIHBhc3RlQXNDaGlsZCgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnBhc3RlKG51bGwsIGZhbHNlLCB0cnVlKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWJquWIh+iKgueCuVxuICAgICAqIOWJquWIh+aYr+mihOWumueahOihjOS4uu+8jOWPquacieWGjeaJp+ihjOeymOi0tOaTjeS9nOaJjeS8mueUn+aViFxuICAgICAqL1xuICAgIGN1dCgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmN1dCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi26IqC54K5XG4gICAgICovXG4gICAgZHVwbGljYXRlKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZHVwbGljYXRlKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliKDpmaToioLngrlcbiAgICAgKi9cbiAgICBkZWxldGUoKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5kZWxldGUoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieaLqeS4iuS4gOmhuVxuICAgICAqL1xuICAgIHVwKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBEb3duTGVmdFJpZ2h0KCd1cCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5oup5LiL5LiA6aG5XG4gICAgICovXG4gICAgZG93bigpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnVwRG93bkxlZnRSaWdodCgnZG93bicpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oqY5Y+gXG4gICAgICovXG4gICAgbGVmdCgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnVwRG93bkxlZnRSaWdodCgnbGVmdCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5bGV5byAXG4gICAgICovXG4gICAgcmlnaHQoKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ3JpZ2h0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkJHkuIrov57nu63lpJrpgIlcbiAgICAgKi9cbiAgICBzaGlmdFVwKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2hpZnRVcERvd24oJ3VwJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkJHkuIvov57nu63lpJrpgIlcbiAgICAgKi9cbiAgICBzaGlmdERvd24oKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zaGlmdFVwRG93bignZG93bicpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5ZG95ZCNXG4gICAgICovXG4gICAgcmVuYW1lKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUua2V5Ym9hcmRSZW5hbWUoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmAiVxuICAgICAqL1xuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNlbGVjdEFsbCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Y+W5raI6YCJ5oupXG4gICAgICovXG4gICAgc2VsZWN0Q2xlYXIoKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWxlY3RDbGVhcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ZCR5LiK56e75Yqo6IqC54K5XG4gICAgICovXG4gICAgbW92ZVVwKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUubW92ZU5vZGUoJ3VwJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkJHkuIvnp7vliqjoioLngrlcbiAgICAgKi9cbiAgICBtb3ZlRG93bigpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLm1vdmVOb2RlKCdkb3duJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnnva7pobbvvIjlj6rlnKggZ3JvdXAg5YaF77yJXG4gICAgICovXG4gICAgdG9wKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLm1vdmVOb2RlKCd0b3AnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCuee9ruW6le+8iOWPquWcqCBncm91cCDlhoXvvIlcbiAgICAgKi9cbiAgICBib3R0b20oKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUubW92ZU5vZGUoJ2JvdHRvbScpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Zy65pmv5YeG5aSH5bCx57uqXG4gICAgICovXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIGlmICghdm0pIHsgXG4gICAgICAgICAgICByZXR1cm47IFxuICAgICAgICB9XG5cbiAgICAgICAgRWRpdG9yLk1ldHJpY3MudHJhY2tUaW1lU3RhcnQoJ2hpZXJhcmNoeTpyZW5kZXItdHJlZScpO1xuICAgICAgICBcbiAgICAgICAgdm0uc2NlbmVSZWFkeSA9IHRydWU7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMudW5zdGFnaW5nKCk7XG5cbiAgICAgICAgaWYgKHZtKSB7IFxuICAgICAgICAgICAgYXdhaXQgdm0ucmVmcmVzaCgpO1xuICAgICAgICAgICAgdm0gJiYgcGFuZWxEYXRhLiQudHJlZS5yZXNlbGVjdGVkKCk7IC8vIOiuqSBjdHJsICsgciDnmoTliLfmlrDvvIzog73mgaLlpI3oioLngrnnmoTpgInkuK3nirbmgIFcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVFbmQoJ2hpZXJhcmNoeTpyZW5kZXItdHJlZScsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWz6Zet5Zy65pmvXG4gICAgICog5omT5byAIGxvYWRpbmcg54q25oCBXG4gICAgICovXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICghdm0pIHsgXG4gICAgICAgICAgICByZXR1cm47IFxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IG1ldGhvZHMuc3RhZ2luZygpO1xuICAgIH0sXG4gICAgYXN5bmMgc2F2ZSh1dWlkPzogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0pIHsgXG4gICAgICAgICAgICByZXR1cm47IFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3QuYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldFV1aWQgPSB1dWlkID8/IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdxdWVyeS1jdXJyZW50LXNjZW5lJyk7XG4gICAgICAgIC8vIOWJjeWQjuWcuuaZr+WIh+aNouaXtu+8jOS4remXtOeKtuaAgeafpeivouWIsOeahCBhc3NldFV1aWQg5Lya5Li656m677yM5Li656m655qE5LiN5aSE55CG44CCXG4gICAgICAgIGlmICghYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxEYXRhLmFjdC5hc3NldEluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgYXNzZXRVdWlkKTtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC5hc3NldFV1aWQgPSBhc3NldFV1aWQ7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMuc3RhZ2luZygpO1xuICAgIH0sXG5cbiAgICBhc3luYyBhbmltYXRpb25TdGFydCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uc2NlbmVSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbWV0aG9kcy5zdGFnaW5nKCk7XG4gICAgICAgIHZtLmFuaW1hdGlvblN0YXJ0KHV1aWQpO1xuICAgIH0sXG4gICAgYW5pbWF0aW9uRW5kKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS5hbmltYXRpb25FbmQoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCueiiq+S/ruaUuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGNoYW5nZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuY2hhbmdlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIm+W7uuS4gOS4quaWsOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFkZGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hZGRlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGRlbGV0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZGVsZXRlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reS6huafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOexu+WeiyAnYXNzZXQnIOaIliAnbm9kZSdcbiAgICAgKiBAcGFyYW0gdXVpZCDljZXkuKogdXVpZFxuICAgICAqL1xuICAgIHNlbGVjdGVkKHR5cGU6IHN0cmluZywgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLnNjZW5lUmVhZHkgfHwgdHlwZSAhPT0gJ25vZGUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNlbGVjdGVkKHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Y+W5raI6YCJ5Lit5LqG5p+Q5Liq54mp5L2TXG4gICAgICogQHBhcmFtIHR5cGUg57G75Z6LICdhc3NldCcg5oiWICdub2RlJ1xuICAgICAqIEBwYXJhbSB1dWlkIOWNleS4qiB1dWlkXG4gICAgICovXG4gICAgdW5zZWxlY3RlZCh0eXBlOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5IHx8IHR5cGUgIT09ICdub2RlJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51bnNlbGVjdGVkKHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Li75Yqo5a6a5L2N5Yiw6IqC54K5XG4gICAgICog5bm26K6p5YW26Zeq54OBXG4gICAgICogQHBhcmFtIHV1aWQg6YCJ5Lit54mp5L2T55qEIHV1aWRcbiAgICAgKi9cbiAgICBhc3luYyB0d2lua2xlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5zY2VuZVJlYWR5KSB7IFxuICAgICAgICAgICAgcmV0dXJuOyBcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsICdoaW50Jyk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBsaXN0ZW5lcnMgPSB7XG4gICAgcmVzaXplKCkge1xuICAgICAgICB2bSAmJiB2bS5yZXNpemUoKTtcbiAgICB9LFxuICAgIHNob3coKSB7XG4gICAgICAgIHZtICYmIHZtLnJlc2l6ZSgpO1xuICAgIH0sXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIGlmICh2bSkge1xuICAgICAgICAgICAgdm0ucmVmb2N1cyA9IHRydWU7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZtICYmICh2bS5yZWZvY3VzID0gZmFsc2UpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG4vKipcbiAqIOmdouadvyByZWFkeVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHBhbmVsID0gdGhpcztcblxuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbmV3IEhpZXJhcmNoeVBhbmVsVk0oKTtcbiAgICB2bS4kbW91bnQocGFuZWwuJC5jb250YWluZXIpO1xuXG4gICAgLyoqXG4gICAgICog55Sx5LqO55m75b2V55WM6Z2i5Ye6546w5pe25L2/55So5LqG6K6p55u46YK75YWD57SgIGRpc3BsYXk6IG5vbmUg55qE5qC35byP77yMXG4gICAgICog5q2k5pe25Y+WIHRoaXMuJHJlZnMudmlld0JveC5jbGllbnRIZWlnaHQg5Li6IDDvvIzmoJHlvaLmmL7npLrkvJrkuI3mraPnoa5cbiAgICAgKiDliqDlhaXov5nkuKrop4Llr5/lmajvvIzmmL7npLrml7bph43nrpdcbiAgICAgKi9cbiAgICBwYW5lbC52aWV3Qm94T2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICAgIChlbnRyaWVzKSA9PiB7XG4gICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goKGVudHJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5LmludGVyc2VjdGlvblJhdGlvICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtICYmIHZtLnJlc2l6ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICByb290OiB2bS4kZWwsXG4gICAgICAgICAgICByb290TWFyZ2luOiAnMHB4JyxcbiAgICAgICAgICAgIHRocmVzaG9sZDogMC4xLFxuICAgICAgICB9LFxuICAgICk7XG4gICAgcGFuZWwudmlld0JveE9ic2VydmVyLm9ic2VydmUocGFuZWxEYXRhLiQudmlld0JveCk7XG5cbiAgICAvLyDor4bliKvlpJbpg6jmianlsZVcbiAgICBjb25zdCBwa2dzID0gRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoeyBlbmFibGU6IHRydWUgfSk7XG4gICAgcGtncy5mb3JFYWNoKHBhbmVsRGF0YS5leHRlbnNpb24uYXR0YWNoKTtcbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdlbmFibGUnLCBwYW5lbERhdGEuZXh0ZW5zaW9uLmF0dGFjaCk7XG4gICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5vbignZGlzYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uZGV0YWNoKTtcblxuICAgIC8vIOWcuuaZr+Wwsee7queKtuaAgeaJjemcgOimgeafpeivouaVsOaNrlxuICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChwYW5lbERhdGEuYWN0Lm1lc3NhZ2VQcm90b2NvbC5zY2VuZSwgJ3F1ZXJ5LWlzLXJlYWR5Jyk7XG4gICAgaWYgKHJlYWR5KSB7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMucmVhZHkoKTtcbiAgICB9XG59XG5cbi8qKlxuICog6Z2i5p2/IGJlZm9yZUNsb3NlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiZWZvcmVDbG9zZSgpIHtcbiAgICBpZiAodm0pIHtcbiAgICAgICAgYXdhaXQgbWV0aG9kcy5zdGFnaW5nKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOmdouadvyBjbG9zZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgaWYgKHZtKSB7XG4gICAgICAgIHZtLnNjZW5lUmVhZHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAocGFuZWwpe1xuICAgICAgICBwYW5lbC52aWV3Qm94T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ucmVtb3ZlTGlzdGVuZXIoJ2VuYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uYXR0YWNoKTtcbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdkaXNhYmxlJywgcGFuZWxEYXRhLmV4dGVuc2lvbi5kZXRhY2gpO1xuXG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBudWxsO1xuICAgIHBhbmVsID0gbnVsbDtcbn1cbiJdfQ==