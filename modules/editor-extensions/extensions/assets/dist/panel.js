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
exports.close = exports.beforeClose = exports.ready = exports.listeners = exports.methods = exports.$ = exports.template = exports.style = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const panel_menu_1 = require("./components/panel-menu");
const panelData = __importStar(require("./components/panel-data"));
const treeData = __importStar(require("./components/tree-data"));
const utils = __importStar(require("./components/utils"));
const util_1 = require("./util");
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel;
let vm;
exports.style = fs_1.readFileSync(path_1.join(__dirname, '../dist/index.css'), 'utf8');
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../static/template/index.html'), 'utf8');
// export const fonts = [{ name: 'assets', file: '', }];
exports.$ = { content: '.assets' };
exports.methods = {
    /**
     * 暂存数据：树形节点的折叠状态
     */
    async staging() {
        const expands = [];
        for (const uuid in treeData.uuidToExpand) {
            // 不记录资源节点不存在 或 没有展开
            if (!treeData.uuidToAsset[uuid] || treeData.uuidToExpand[uuid] !== true) {
                continue;
            }
            expands.push(uuid);
        }
        // 数据保存到主进程
        await Editor.Message.request('assets', 'staging', {
            expandUuids: expands,
            sortType: vm.sortType,
        });
    },
    /**
     * 恢复数据
     */
    async unstaging() {
        const state = await Editor.Message.request('assets', 'unstaging');
        if (!state) {
            return;
        }
        const { expandUuids, sortType } = state;
        // 节点的折叠
        if (Array.isArray(expandUuids)) {
            expandUuids.forEach((uuid) => {
                treeData.uuidToExpand[uuid] = true;
            });
        }
        // 赋值排序方式
        if (sortType) {
            vm.sortType = sortType;
        }
    },
    /**
     * 面板注册的方法，与 package.json 的快捷方式对应
     * 下同
     *
     * 激活面板的搜索框
     */
    find() {
        panelData.$.searchInput.focus();
    },
    /**
     * 复制资源
     */
    copy() {
        panelData.$.tree.copy();
    },
    /**
     * 来自编辑器顶层 edit 菜单的 paste 指令
     */
    paste() {
        if (vm.isOperating) {
            return;
        }
        try {
            panelData.$.tree.paste();
            vm.isOperating = true;
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setTimeout(() => {
                vm.isOperating = false;
            }, 200);
        }
    },
    /**
     * 来自编辑器顶层 edit 菜单的 cut 指令
     * 剪切是预定的行为，只有再执行粘贴操作才会生效
     */
    cut() {
        panelData.$.tree.cut();
    },
    /**
     * 复制节点
     */
    duplicate() {
        if (vm.isOperating) {
            return;
        }
        try {
            panelData.$.tree.duplicate();
            vm.isOperating = true; // 锁定
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setTimeout(() => {
                vm.isOperating = false; // 解锁
            }, 200);
        }
    },
    delete() {
        panelData.$.tree.delete();
    },
    up() {
        panelData.$.tree.upDownLeftRight('up');
    },
    down() {
        panelData.$.tree.upDownLeftRight('down');
    },
    left() {
        panelData.$.tree.upDownLeftRight('left');
    },
    right() {
        panelData.$.tree.upDownLeftRight('right');
    },
    shiftUp() {
        panelData.$.tree.shiftUpDown('up');
    },
    shiftDown() {
        panelData.$.tree.shiftUpDown('down');
    },
    rename() {
        panelData.$.tree.keyboardRename();
    },
    /**
     * 来自编辑器顶层 edit 菜单的 selectAll 指令
     */
    selectAll() {
        panelData.$.tree.selectAll();
    },
    /**
     * esc 快捷键取消选中
     */
    selectClear() {
        panelData.$.tree.selectClear();
    },
    /**
     * asset db 就绪
     * 刷新数据
     */
    async ready() {
        Editor.Metrics.trackTimeStart('assets:render-tree');
        await exports.methods.unstaging();
        await vm.refresh();
        panelData.$.tree.resetSelected();
        Editor.Metrics.trackTimeEnd('assets:render-tree', { output: true });
    },
    refreshFinish() {
        vm.refreshLock = false;
    },
    /**
     * asset db 关闭
     * 清除数据
     */
    close() {
        vm.clear();
    },
    dbReady() {
        if (vm.dbReady) {
            vm.refresh();
        }
    },
    dbClose() {
        if (vm.dbReady) {
            vm.refresh();
        }
    },
    dbPause(mask) {
        if (vm.dbReady) {
            vm.warnShow(mask);
        }
    },
    dbResume() {
        if (vm.dbReady) {
            vm.warnHide();
        }
    },
    /**
     * 添加了资源
     * @param uuid 资源
     * @param info 信息
     */
    async added(uuid, info) {
        if (!vm.dbReady) {
            return;
        }
        await panelData.$.tree.added(uuid, info);
    },
    /**
     * 删除了资源
     * @param uuid 资源
     * @param info 信息
     */
    async deleted(uuid, info) {
        if (!vm.dbReady) {
            return;
        }
        await panelData.$.tree.deleted(uuid, info);
    },
    /**
     * 修改了资源
     * @param uuid 资源
     * @param info 信息
     */
    async changed(uuid, info) {
        if (!vm.dbReady) {
            return;
        }
        await panelData.$.tree.changed(uuid, info);
    },
    /**
     * 选中了某个物体
     * @param type 选中物体的类型
     * @param uuid 资源 选中物体的 uuid
     */
    selected(type, uuid) {
        if (!vm.dbReady || type !== 'asset') {
            return;
        }
        panelData.$.tree.selected(uuid);
    },
    /**
     * 取消选中了某个物体
     * @param type 选中物体的类型
     * @param uuid 资源 选中物体的 uuid
     */
    unselected(type, uuid) {
        if (!vm.dbReady || type !== 'asset') {
            return;
        }
        panelData.$.tree.unselected(uuid);
    },
    /**
     * 定位到资源，会闪烁
     * @param uuid 资源 选中物体的 uuid
     * @param animation 默认动画
     */
    async twinkle(uuid, animation = 'shake') {
        if (!uuid) {
            return;
        }
        const toUuid = treeData.urlToUuid[uuid] || treeData.fileToUuid[uuid];
        if (toUuid) {
            uuid = toUuid;
        }
        // 闪烁类型是 Texture2D 的话，直接闪烁图片本身
        const target = treeData.uuidToAsset[uuid];
        if (target?.type === 'cc.Texture2D') {
            uuid = uuid.split('@')[0];
        }
        utils.twinkle.add(uuid, animation);
        await utils.scrollIntoView(uuid, true);
    },
    async queryAsset(uuid, nextStop) {
        return await utils.getAssetForPreview(uuid, nextStop);
    },
    async queryChildren(uuid, nextStop) {
        return await utils.getChildrenForPreview(uuid, nextStop);
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
    // @ts-ignore
    panel = this;
    vm = new Vue({
        el: panel.$.content,
        components: {
            tree: require('./components/tree'),
            SepareteBox: require('./components/separete-box').default,
        },
        data: {
            refocus: false,
            dbReady: false,
            warnCase: '',
            operateLock: false,
            refreshLock: false,
            isOperating: false,
            refreshing: { type: '', name: '' },
            droppableTypes: ['file', 'cc.Node'],
            allExpand: null,
            viewWidth: 0,
            viewHeight: 0,
            treeHeight: 0,
            dropBoxStyle: {},
            searchValue: '',
            searchInFolder: null,
            searchAssetTypes: [],
            searchType: 'name',
            searchTypeLabel: 'i18n:assets.menu.searchName',
            extendSearchFunc: {},
            sortType: 'name',
            localFileExtend: [], // 本地文件拓展
        },
        computed: {
            searchPlaceholder() {
                const vm = this;
                if (vm.searchTypeLabel) {
                    return vm.searchTypeLabel;
                }
                const typeText = vm.searchType;
                const firstLetterUpperCase = typeText.toLocaleUpperCase().substr(0, 1) + typeText.substr(1);
                return `i18n:assets.menu.search${firstLetterUpperCase}`;
            },
            hasLocalFileExtend() {
                const vm = this;
                return !!vm.localFileExtend.length;
            },
        },
        watch: {
            searchValue() {
                panelData.$.searchInput.value = vm.searchValue;
                panelData.$.tree.search();
            },
            searchAssetTypes() {
                panelData.$.searchInput.focus();
                panelData.$.tree.search();
            },
            searchType() {
                if (vm.searchType === 'usages') {
                    vm.searchAssetTypes = ['cc.SceneAsset', 'cc.Prefab', 'cc.Material', 'cc.AnimationClip'];
                }
                else {
                    panelData.$.searchInput.focus();
                    panelData.$.tree.search();
                }
            },
            searchInFolder() {
                panelData.$.searchInput.focus();
                panelData.$.tree.search();
            },
            sortType() {
                panelData.$.tree.sort();
            },
            async localFileExtend() {
                await panelData.$.panel.initLocalFileTree();
            },
        },
        async mounted() {
            panelData.$.panel = this;
            panelData.$.searchInput = this.$refs.searchInput;
            panelData.$.toggleExpandIcon = this.$refs.toggleExpandIcon;
            panelData.$.viewBox = this.$refs.viewBox;
            panelData.$.tree = this.$refs.tree;
            /**
             * 初始化监听 scroll 事件
             * 不放在 vue template 里面是因为有性能损耗，vue 里快速滚动的话会有前后空白区
             * 这样直接绑定性能最好
             * vm.treeHeight > vm.viewHeight 是为了保障此时有垂直滚动条
             */
            this.$refs.viewBox.addEventListener('scroll', (event) => {
                if (vm.treeHeight > vm.viewHeight && vm.treeHeight < vm.viewHeight + event.target.scrollTop) {
                    panelData.$.tree.scrollTop = vm.treeHeight - vm.viewHeight;
                }
                else {
                    panelData.$.tree.scrollTop = event.target.scrollTop;
                }
            }, false);
            this.resize();
        },
        methods: {
            /**
             * 翻译
             * @param key 不带面板名称的标记字符
             */
            t(key) {
                return Editor.I18n.t(`assets.${key}`);
            },
            async refresh() {
                try {
                    vm.dbReady = false;
                    // 更新外部数据后触发 tree 数据的更新
                    await panelData.config.update();
                    panelData.$.tree.update();
                    vm.isOperating = true;
                    await treeData.reset();
                    vm.isOperating = false;
                }
                catch (error) {
                    console.error(error);
                }
                finally {
                    vm.dbReady = true;
                }
            },
            async refreshDB() {
                const value = await Editor.Profile.getConfig('asset-db', 'autoScan');
                if (value) {
                    this.refresh();
                    return;
                }
                vm.refreshLock = true;
                Editor.Message.send('asset-db', 'refresh-all-database');
            },
            warnShow(name) {
                vm.warnCase = name;
                vm.operateLock = true;
            },
            warnHide() {
                vm.warnCase = '';
                vm.operateLock = false;
                this.refresh();
            },
            clear() {
                vm.dbReady = false;
                panelData.$.tree.clear();
            },
            /**
             * 全部节点是否展开
             */
            allToggle() {
                panelData.$.tree.allToggle();
            },
            /**
             * 搜索框 input 有变动
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
            /**
             * 取消搜索类型，默认 name
             */
            cancelSearchType() {
                vm.searchType = 'name';
                vm.searchTypeLabel = '';
            },
            /**
             * 取消在文件夹内搜索
             */
            cancelSearchInFolder() {
                vm.searchInFolder = null;
            },
            /**
             * 取消限定搜索类型
             */
            cancelSearchAssetTypes() {
                vm.searchAssetTypes = [];
            },
            clearSearch() {
                // 清空搜索
                vm.searchInFolder = null;
                vm.searchValue = '';
                vm.searchAssetTypes = [];
                if (vm.searchType === 'fails') {
                    vm.searchType = 'name';
                }
            },
            // 弹出创建资源菜单
            popupCreateMenu: panel_menu_1.popupCreateMenu,
            // 弹出面板搜索菜单
            popupSearchMenu: panel_menu_1.popupSearchMenu,
            // 弹出面板排序方式菜单
            popupSortMenu: panel_menu_1.popupSortMenu,
            // 面板的右击菜单
            popupPanelMenu: panel_menu_1.popupPanelMenu,
            /**
             * 调整可视区域高度
             */
            resize() {
                if (vm && panelData.$.viewBox) {
                    // 延时是为了等 dom 完成了再获取高度
                    setTimeout(() => {
                        vm.viewWidth = panel.clientWidth;
                        vm.viewHeight = parseInt(panelData.$.viewBox.style.height);
                        panelData.$.tree.filterAssets();
                    }, 0);
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
            isSearchingMode() {
                return utils.isSearchingMode();
            },
            async initLocalFileTree() {
                const vm = this;
                if (!vm.localFileExtend.length)
                    return;
                const files = (await Promise.all(vm.localFileExtend.map(async (extend) => {
                    return util_1.getPackageFileExtend(extend.path);
                })));
                vm.$refs.localFile.tree = files;
                vm.$refs.localFile.setTemplate('text', `<span class="name"></span>`);
                vm.$refs.localFile.setTemplateInit('text', ($text) => {
                    $text.$name = $text.querySelector('.name');
                });
                vm.$refs.localFile.setRender('text', ($text, data) => {
                    $text.$name.innerHTML = data.detail.value;
                });
                vm.$refs.localFile.setTemplateInit('item', ($div) => {
                    const $dom = vm.$refs.localFile;
                    $div.addEventListener('dblclick', (event) => {
                        if (!$div.data.isDirectory) {
                            util_1.openFile($div.data.filePath, $div.data.root);
                        }
                        // if (event.ctrlKey || event.metaKey) {
                        //     $dom.select($div.data);
                        // } else {
                        //     $dom.clear();
                        //     $dom.select($div.data);
                        // }
                        $dom.render();
                    });
                });
                vm.$refs.localFile.setRender('item', ($div, data) => {
                    if (data.detail.disabled) {
                        $div.setAttribute('disabled', '');
                    }
                    else {
                        $div.removeAttribute('disabled');
                    }
                });
            },
        },
    });
    // db 就绪后才能查询数据
    vm.dbReady = await Editor.Message.request('asset-db', 'query-ready');
    if (vm.dbReady) {
        Editor.Metrics.trackTimeStart('assets:render-tree');
        await exports.methods.unstaging();
        await vm.refresh();
        // 让 ctrl + r 的刷新，能恢复选中状态
        panelData.$.tree.resetSelected();
        Editor.Metrics.trackTimeEnd('assets:render-tree', { output: true });
    }
    /**
     * 由于登录界面出现时使用了让相邻元素 display: none 的样式，
     * 此时取 viewBox.clientHeight 为 0，树形显示会不正确
     * 加入这个观察器，显示时重算
     */
    new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio !== 0) {
                vm.resize();
            }
        });
    }, {
        root: vm.$el,
        rootMargin: '0px',
        threshold: 0.1,
    }).observe(panelData.$.viewBox);
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
    if (vm) {
        vm.dbReady = false;
        panelData.clear();
        treeData.clear();
    }
    Editor.Package.__protected__.removeListener('enable', panelData.extension.attach);
    Editor.Package.__protected__.removeListener('disable', panelData.extension.detach);
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWIsMkJBQWtDO0FBQ2xDLCtCQUE0QjtBQUM1Qix3REFBMEc7QUFDMUcsbUVBQXFEO0FBQ3JELGlFQUFtRDtBQUNuRCwwREFBNEM7QUFDNUMsaUNBQXdEO0FBR3hELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZDLEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUNqQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFFNUIsSUFBSSxLQUFVLENBQUM7QUFDZixJQUFJLEVBQU8sQ0FBQztBQUVDLFFBQUEsS0FBSyxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRW5FLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSwrQkFBK0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRS9GLHdEQUF3RDtBQUUzQyxRQUFBLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztBQUUzQixRQUFBLE9BQU8sR0FBRztJQUNuQjs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1QsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBRW5CLEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRTtZQUN0QyxvQkFBb0I7WUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3JFLFNBQVM7YUFDWjtZQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdEI7UUFFRCxXQUFXO1FBQ1gsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFO1lBQzlDLFdBQVcsRUFBRSxPQUFPO1lBQ3BCLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUTtTQUN4QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNYLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDUixPQUFPO1NBQ1Y7UUFFRCxNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUV4QyxRQUFRO1FBQ1IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVCLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDakMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDdkMsQ0FBQyxDQUFDLENBQUM7U0FDTjtRQUVELFNBQVM7UUFDVCxJQUFJLFFBQVEsRUFBRTtZQUNWLEVBQUUsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1NBQzFCO0lBQ0wsQ0FBQztJQUNEOzs7OztPQUtHO0lBQ0gsSUFBSTtRQUNBLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILElBQUk7UUFDQSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBQ0Q7O09BRUc7SUFDSCxLQUFLO1FBQ0QsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1lBQ2hCLE9BQU87U0FDVjtRQUVELElBQUk7WUFDQSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6QixFQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztTQUN6QjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QjtnQkFBUztZQUNOLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1osRUFBRSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDM0IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ1g7SUFDTCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsR0FBRztRQUNDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRDs7T0FFRztJQUNILFNBQVM7UUFDTCxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7WUFDaEIsT0FBTztTQUNWO1FBRUQsSUFBSTtZQUNBLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLEVBQUUsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSztTQUMvQjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtnQkFBUztZQUNOLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1osRUFBRSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsQ0FBQyxLQUFLO1lBQ2pDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUNYO0lBQ0wsQ0FBQztJQUNELE1BQU07UUFDRixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBQ0QsRUFBRTtRQUNFLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsSUFBSTtRQUNBLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBQ0QsSUFBSTtRQUNBLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBQ0QsS0FBSztRQUNELFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBQ0QsT0FBTztRQUNILFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsU0FBUztRQUNMLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsTUFBTTtRQUNGLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3RDLENBQUM7SUFDRDs7T0FFRztJQUNILFNBQVM7UUFDTCxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxXQUFXO1FBQ1AsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUNEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNwRCxNQUFNLGVBQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMxQixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVuQixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNqQyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFDRCxhQUFhO1FBQ1QsRUFBRSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDM0IsQ0FBQztJQUNEOzs7T0FHRztJQUNILEtBQUs7UUFDRCxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZixDQUFDO0lBQ0QsT0FBTztRQUNILElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUNaLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoQjtJQUNMLENBQUM7SUFDRCxPQUFPO1FBQ0gsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ1osRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQztJQUNELE9BQU8sQ0FBQyxJQUFZO1FBQ2hCLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUNaLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckI7SUFDTCxDQUFDO0lBQ0QsUUFBUTtRQUNKLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUNaLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUNqQjtJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFZLEVBQUUsSUFBZTtRQUNyQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUNiLE9BQU87U0FDVjtRQUVELE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBWSxFQUFFLElBQWU7UUFDdkMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDYixPQUFPO1NBQ1Y7UUFFRCxNQUFNLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQVksRUFBRSxJQUFlO1FBQ3ZDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ2IsT0FBTztTQUNWO1FBQ0QsTUFBTSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDRDs7OztPQUlHO0lBQ0gsUUFBUSxDQUFDLElBQVksRUFBRSxJQUFZO1FBQy9CLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7WUFDakMsT0FBTztTQUNWO1FBQ0QsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7OztPQUlHO0lBQ0gsVUFBVSxDQUFDLElBQVksRUFBRSxJQUFZO1FBQ2pDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7WUFDakMsT0FBTztTQUNWO1FBRUQsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZLEVBQUUsU0FBUyxHQUFHLE9BQU87UUFDM0MsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNQLE9BQU87U0FDVjtRQUVELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRSxJQUFJLE1BQU0sRUFBRTtZQUNSLElBQUksR0FBRyxNQUFNLENBQUM7U0FDakI7UUFFRCw4QkFBOEI7UUFDOUIsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxJQUFJLE1BQU0sRUFBRSxJQUFJLEtBQUssY0FBYyxFQUFFO1lBQ2pDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdCO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLE1BQU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUNELEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBWSxFQUFFLFFBQWlCO1FBQzVDLE9BQU8sTUFBTSxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFDRCxLQUFLLENBQUMsYUFBYSxDQUFDLElBQVksRUFBRSxRQUFpQjtRQUMvQyxPQUFPLE1BQU0sS0FBSyxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0osQ0FBQztBQUVXLFFBQUEsU0FBUyxHQUFHO0lBQ3JCLE1BQU07UUFDRixFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDRCxJQUFJO1FBQ0EsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBQ0QsS0FBSztRQUNELElBQUksRUFBRSxFQUFFO1lBQ0osRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFFbEIsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDWixFQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUN2QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDWDtJQUNMLENBQUM7Q0FDSixDQUFDO0FBRUY7O0dBRUc7QUFDSSxLQUFLLFVBQVUsS0FBSztJQUN2QixhQUFhO0lBQ2IsS0FBSyxHQUFHLElBQUksQ0FBQztJQUViLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUNULEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU87UUFDbkIsVUFBVSxFQUFFO1lBQ1IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztZQUNsQyxXQUFXLEVBQUUsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUMsT0FBTztTQUM1RDtRQUNELElBQUksRUFBRTtZQUNGLE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsRUFBRTtZQUNaLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtZQUNsQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDO1lBQ25DLFNBQVMsRUFBRSxJQUFJO1lBQ2YsU0FBUyxFQUFFLENBQUM7WUFDWixVQUFVLEVBQUUsQ0FBQztZQUNiLFVBQVUsRUFBRSxDQUFDO1lBQ2IsWUFBWSxFQUFFLEVBQUU7WUFDaEIsV0FBVyxFQUFFLEVBQUU7WUFDZixjQUFjLEVBQUUsSUFBSTtZQUNwQixnQkFBZ0IsRUFBRSxFQUFFO1lBQ3BCLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLGVBQWUsRUFBRSw2QkFBNkI7WUFDOUMsZ0JBQWdCLEVBQUUsRUFBRTtZQUNwQixRQUFRLEVBQUUsTUFBTTtZQUNoQixlQUFlLEVBQUUsRUFBRSxFQUFFLFNBQVM7U0FDakM7UUFDRCxRQUFRLEVBQUU7WUFDTixpQkFBaUI7Z0JBQ2IsTUFBTSxFQUFFLEdBQVEsSUFBSSxDQUFDO2dCQUVyQixJQUFJLEVBQUUsQ0FBQyxlQUFlLEVBQUU7b0JBQ3BCLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztpQkFDN0I7Z0JBRUQsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztnQkFDL0IsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVGLE9BQU8sMEJBQTBCLG9CQUFvQixFQUFFLENBQUM7WUFDNUQsQ0FBQztZQUNELGtCQUFrQjtnQkFDZCxNQUFNLEVBQUUsR0FBUSxJQUFJLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDO1lBQ3ZDLENBQUM7U0FDSjtRQUNELEtBQUssRUFBRTtZQUNILFdBQVc7Z0JBQ1AsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUM7Z0JBQy9DLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLENBQUM7WUFDRCxnQkFBZ0I7Z0JBQ1osU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLENBQUM7WUFDRCxVQUFVO2dCQUNOLElBQUksRUFBRSxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUU7b0JBQzVCLEVBQUUsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLGVBQWUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUM7aUJBQzNGO3FCQUFNO29CQUNILFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNoQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDN0I7WUFDTCxDQUFDO1lBQ0QsY0FBYztnQkFDVixTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDOUIsQ0FBQztZQUNELFFBQVE7Z0JBQ0osU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsQ0FBQztZQUNELEtBQUssQ0FBQyxlQUFlO2dCQUNqQixNQUFNLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDaEQsQ0FBQztTQUNKO1FBQ0QsS0FBSyxDQUFDLE9BQU87WUFDVCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDekIsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDakQsU0FBUyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1lBQzNELFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1lBQ3pDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBRW5DOzs7OztlQUtHO1lBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQy9CLFFBQVEsRUFDUixDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUNYLElBQUksRUFBRSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtvQkFDekYsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztpQkFDOUQ7cUJBQU07b0JBQ0gsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO2lCQUN2RDtZQUNMLENBQUMsRUFDRCxLQUFLLENBQ1IsQ0FBQztZQUVGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxFQUFFO1lBQ0w7OztlQUdHO1lBQ0gsQ0FBQyxDQUFDLEdBQVc7Z0JBQ1QsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELEtBQUssQ0FBQyxPQUFPO2dCQUNULElBQUk7b0JBQ0EsRUFBRSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ25CLHVCQUF1QjtvQkFDdkIsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNoQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFFMUIsRUFBRSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7b0JBQ3RCLE1BQU0sUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN2QixFQUFFLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztpQkFDMUI7Z0JBQUMsT0FBTyxLQUFLLEVBQUU7b0JBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDeEI7d0JBQVM7b0JBQ04sRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7aUJBQ3JCO1lBQ0wsQ0FBQztZQUNELEtBQUssQ0FBQyxTQUFTO2dCQUNYLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLEtBQUssRUFBRTtvQkFDUCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2YsT0FBTztpQkFDVjtnQkFFRCxFQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDdEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUNELFFBQVEsQ0FBQyxJQUFZO2dCQUNqQixFQUFFLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztnQkFDbkIsRUFBRSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDMUIsQ0FBQztZQUNELFFBQVE7Z0JBQ0osRUFBRSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLEVBQUUsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO2dCQUN2QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUNELEtBQUs7Z0JBQ0QsRUFBRSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ25CLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFDRDs7ZUFFRztZQUNILFNBQVM7Z0JBQ0wsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakMsQ0FBQztZQUNEOztlQUVHO1lBQ0gsWUFBWTtnQkFDUixFQUFFLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxRCxDQUFDO1lBQ0Q7Ozs7ZUFJRztZQUNILGVBQWUsQ0FBQyxLQUFvQixFQUFFLFNBQWlCO2dCQUNuRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBcUIsQ0FBQztnQkFDM0MsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFO29CQUNqQixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQy9DO3FCQUFNO29CQUNILFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7aUJBQzFDO1lBQ0wsQ0FBQztZQUNEOztlQUVHO1lBQ0gsZ0JBQWdCO2dCQUNaLEVBQUUsQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO2dCQUN2QixFQUFFLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUM1QixDQUFDO1lBQ0Q7O2VBRUc7WUFDSCxvQkFBb0I7Z0JBQ2hCLEVBQUUsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFDRDs7ZUFFRztZQUNILHNCQUFzQjtnQkFDbEIsRUFBRSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBQ0QsV0FBVztnQkFDUCxPQUFPO2dCQUNQLEVBQUUsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixFQUFFLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDcEIsRUFBRSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztnQkFFekIsSUFBSSxFQUFFLENBQUMsVUFBVSxLQUFLLE9BQU8sRUFBRTtvQkFDM0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7aUJBQzFCO1lBQ0wsQ0FBQztZQUNELFdBQVc7WUFDWCxlQUFlLEVBQWYsNEJBQWU7WUFFZixXQUFXO1lBQ1gsZUFBZSxFQUFmLDRCQUFlO1lBRWYsYUFBYTtZQUNiLGFBQWEsRUFBYiwwQkFBYTtZQUViLFVBQVU7WUFDVixjQUFjLEVBQWQsMkJBQWM7WUFDZDs7ZUFFRztZQUNILE1BQU07Z0JBQ0YsSUFBSSxFQUFFLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUU7b0JBQzNCLHNCQUFzQjtvQkFDdEIsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDWixFQUFFLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7d0JBQ2pDLEVBQUUsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDM0QsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3BDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDVDtZQUNMLENBQUM7WUFDRDs7O2VBR0c7WUFDSCxXQUFXO2dCQUNQLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsZUFBZTtnQkFDWCxPQUFPLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsS0FBSyxDQUFDLGlCQUFpQjtnQkFDbkIsTUFBTSxFQUFFLEdBQVEsSUFBSSxDQUFDO2dCQUNyQixJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxNQUFNO29CQUFFLE9BQU87Z0JBRXZDLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFXLEVBQUUsRUFBRTtvQkFDMUUsT0FBTywyQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO2dCQUVoQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLDRCQUE0QixDQUFDLENBQUM7Z0JBQ3JFLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRTtvQkFDdEQsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxDQUFDLENBQUMsQ0FBQztnQkFDSCxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBVSxFQUFFLElBQVMsRUFBRSxFQUFFO29CQUMzRCxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDOUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO29CQUNyRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQWlCLEVBQUUsRUFBRTt3QkFDcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFOzRCQUN4QixlQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt5QkFDaEQ7d0JBRUQsd0NBQXdDO3dCQUN4Qyw4QkFBOEI7d0JBQzlCLFdBQVc7d0JBQ1gsb0JBQW9CO3dCQUNwQiw4QkFBOEI7d0JBQzlCLElBQUk7d0JBQ0osSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNsQixDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLENBQUMsQ0FBQztnQkFDSCxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBUyxFQUFFLElBQVMsRUFBRSxFQUFFO29CQUMxRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO3dCQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztxQkFDckM7eUJBQU07d0JBQ0gsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztxQkFDcEM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFUCxDQUFDO1NBQ0o7S0FDSixDQUFDLENBQUM7SUFFSCxlQUFlO0lBQ2YsRUFBRSxDQUFDLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNyRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUU7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sZUFBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFCLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRW5CLHlCQUF5QjtRQUN6QixTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNqQyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ3ZFO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksb0JBQW9CLENBQ3BCLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDUixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDdEIsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEtBQUssQ0FBQyxFQUFFO2dCQUMvQixFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDZjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxFQUNEO1FBQ0ksSUFBSSxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1osVUFBVSxFQUFFLEtBQUs7UUFDakIsU0FBUyxFQUFFLEdBQUc7S0FDakIsQ0FDSixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRS9CLFNBQVM7SUFDVCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNFLENBQUM7QUFwVUQsc0JBb1VDO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsV0FBVztJQUM3QixJQUFJLEVBQUUsRUFBRTtRQUNKLE1BQU0sZUFBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzNCO0FBQ0wsQ0FBQztBQUpELGtDQUlDO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsS0FBSztJQUN2QixJQUFJLEVBQUUsRUFBRTtRQUNKLEVBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsQixRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDcEI7SUFDRCxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZGLENBQUM7QUFSRCxzQkFRQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSAnLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwb3B1cENyZWF0ZU1lbnUsIHBvcHVwU2VhcmNoTWVudSwgcG9wdXBTb3J0TWVudSwgcG9wdXBQYW5lbE1lbnUgfSBmcm9tICcuL2NvbXBvbmVudHMvcGFuZWwtbWVudSc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9jb21wb25lbnRzL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi9jb21wb25lbnRzL3RyZWUtZGF0YSc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL2NvbXBvbmVudHMvdXRpbHMnO1xuaW1wb3J0IHsgZ2V0UGFja2FnZUZpbGVFeHRlbmQsIG9wZW5GaWxlIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IHV1aWRUb0Fzc2V0IH0gZnJvbSAnLi9jb21wb25lbnRzL3RyZWUtZGF0YSc7XG5cbmNvbnN0IFZ1ZSA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmxldCBwYW5lbDogYW55O1xubGV0IHZtOiBhbnk7XG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uL2Rpc3QvaW5kZXguY3NzJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uL3N0YXRpYy90ZW1wbGF0ZS9pbmRleC5odG1sJyksICd1dGY4Jyk7XG5cbi8vIGV4cG9ydCBjb25zdCBmb250cyA9IFt7IG5hbWU6ICdhc3NldHMnLCBmaWxlOiAnJywgfV07XG5cbmV4cG9ydCBjb25zdCAkID0geyBjb250ZW50OiAnLmFzc2V0cycgfTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog5pqC5a2Y5pWw5o2u77ya5qCR5b2i6IqC54K555qE5oqY5Y+g54q25oCBXG4gICAgICovXG4gICAgYXN5bmMgc3RhZ2luZygpIHtcbiAgICAgICAgY29uc3QgZXhwYW5kcyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgdXVpZCBpbiB0cmVlRGF0YS51dWlkVG9FeHBhbmQpIHtcbiAgICAgICAgICAgIC8vIOS4jeiusOW9lei1hOa6kOiKgueCueS4jeWtmOWcqCDmiJYg5rKh5pyJ5bGV5byAXG4gICAgICAgICAgICBpZiAoIXRyZWVEYXRhLnV1aWRUb0Fzc2V0W3V1aWRdIHx8IHRyZWVEYXRhLnV1aWRUb0V4cGFuZFt1dWlkXSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBleHBhbmRzLnB1c2godXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlbDmja7kv53lrZjliLDkuLvov5vnqItcbiAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXRzJywgJ3N0YWdpbmcnLCB7XG4gICAgICAgICAgICBleHBhbmRVdWlkczogZXhwYW5kcyxcbiAgICAgICAgICAgIHNvcnRUeXBlOiB2bS5zb3J0VHlwZSxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmgaLlpI3mlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyB1bnN0YWdpbmcoKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXRzJywgJ3Vuc3RhZ2luZycpO1xuICAgICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGV4cGFuZFV1aWRzLCBzb3J0VHlwZSB9ID0gc3RhdGU7XG5cbiAgICAgICAgLy8g6IqC54K555qE5oqY5Y+gXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGV4cGFuZFV1aWRzKSkge1xuICAgICAgICAgICAgZXhwYW5kVXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvRXhwYW5kW3V1aWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6LWL5YC85o6S5bqP5pa55byPXG4gICAgICAgIGlmIChzb3J0VHlwZSkge1xuICAgICAgICAgICAgdm0uc29ydFR5cGUgPSBzb3J0VHlwZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6Z2i5p2/5rOo5YaM55qE5pa55rOV77yM5LiOIHBhY2thZ2UuanNvbiDnmoTlv6vmjbfmlrnlvI/lr7nlupRcbiAgICAgKiDkuIvlkIxcbiAgICAgKlxuICAgICAqIOa/gOa0u+mdouadv+eahOaQnOe0ouahhlxuICAgICAqL1xuICAgIGZpbmQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlpI3liLbotYTmupBcbiAgICAgKi9cbiAgICBjb3B5KCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLmNvcHkoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOadpeiHque8lui+keWZqOmhtuWxgiBlZGl0IOiPnOWNleeahCBwYXN0ZSDmjIfku6RcbiAgICAgKi9cbiAgICBwYXN0ZSgpIHtcbiAgICAgICAgaWYgKHZtLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5wYXN0ZSgpO1xuICAgICAgICAgICAgdm0uaXNPcGVyYXRpbmcgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB2bS5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5p2l6Ieq57yW6L6R5Zmo6aG25bGCIGVkaXQg6I+c5Y2V55qEIGN1dCDmjIfku6RcbiAgICAgKiDliarliIfmmK/pooTlrprnmoTooYzkuLrvvIzlj6rmnInlho3miafooYznspjotLTmk43kvZzmiY3kvJrnlJ/mlYhcbiAgICAgKi9cbiAgICBjdXQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuY3V0KCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlpI3liLboioLngrlcbiAgICAgKi9cbiAgICBkdXBsaWNhdGUoKSB7XG4gICAgICAgIGlmICh2bS5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZHVwbGljYXRlKCk7XG4gICAgICAgICAgICB2bS5pc09wZXJhdGluZyA9IHRydWU7IC8vIOmUgeWumlxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdm0uaXNPcGVyYXRpbmcgPSBmYWxzZTsgLy8g6Kej6ZSBXG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkZWxldGUoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZGVsZXRlKCk7XG4gICAgfSxcbiAgICB1cCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ3VwJyk7XG4gICAgfSxcbiAgICBkb3duKCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnVwRG93bkxlZnRSaWdodCgnZG93bicpO1xuICAgIH0sXG4gICAgbGVmdCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ2xlZnQnKTtcbiAgICB9LFxuICAgIHJpZ2h0KCkge1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnVwRG93bkxlZnRSaWdodCgncmlnaHQnKTtcbiAgICB9LFxuICAgIHNoaWZ0VXAoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2hpZnRVcERvd24oJ3VwJyk7XG4gICAgfSxcbiAgICBzaGlmdERvd24oKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2hpZnRVcERvd24oJ2Rvd24nKTtcbiAgICB9LFxuICAgIHJlbmFtZSgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5rZXlib2FyZFJlbmFtZSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5p2l6Ieq57yW6L6R5Zmo6aG25bGCIGVkaXQg6I+c5Y2V55qEIHNlbGVjdEFsbCDmjIfku6RcbiAgICAgKi9cbiAgICBzZWxlY3RBbGwoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VsZWN0QWxsKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBlc2Mg5b+r5o236ZSu5Y+W5raI6YCJ5LitXG4gICAgICovXG4gICAgc2VsZWN0Q2xlYXIoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VsZWN0Q2xlYXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGFzc2V0IGRiIOWwsee7qlxuICAgICAqIOWIt+aWsOaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIHJlYWR5KCkge1xuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVTdGFydCgnYXNzZXRzOnJlbmRlci10cmVlJyk7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMudW5zdGFnaW5nKCk7XG4gICAgICAgIGF3YWl0IHZtLnJlZnJlc2goKTtcblxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnJlc2V0U2VsZWN0ZWQoKTtcbiAgICAgICAgRWRpdG9yLk1ldHJpY3MudHJhY2tUaW1lRW5kKCdhc3NldHM6cmVuZGVyLXRyZWUnLCB7IG91dHB1dDogdHJ1ZSB9KTtcbiAgICB9LFxuICAgIHJlZnJlc2hGaW5pc2goKSB7XG4gICAgICAgIHZtLnJlZnJlc2hMb2NrID0gZmFsc2U7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBhc3NldCBkYiDlhbPpl61cbiAgICAgKiDmuIXpmaTmlbDmja5cbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgdm0uY2xlYXIoKTtcbiAgICB9LFxuICAgIGRiUmVhZHkoKSB7XG4gICAgICAgIGlmICh2bS5kYlJlYWR5KSB7XG4gICAgICAgICAgICB2bS5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRiQ2xvc2UoKSB7XG4gICAgICAgIGlmICh2bS5kYlJlYWR5KSB7XG4gICAgICAgICAgICB2bS5yZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRiUGF1c2UobWFzazogc3RyaW5nKSB7XG4gICAgICAgIGlmICh2bS5kYlJlYWR5KSB7XG4gICAgICAgICAgICB2bS53YXJuU2hvdyhtYXNrKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZGJSZXN1bWUoKSB7XG4gICAgICAgIGlmICh2bS5kYlJlYWR5KSB7XG4gICAgICAgICAgICB2bS53YXJuSGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOa3u+WKoOS6hui1hOa6kFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGFkZGVkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIGlmICghdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgcGFuZWxEYXRhLiQudHJlZS5hZGRlZCh1dWlkLCBpbmZvKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpOS6hui1hOa6kFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgaWYgKCF2bS5kYlJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBwYW5lbERhdGEuJC50cmVlLmRlbGV0ZWQodXVpZCwgaW5mbyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDkv67mlLnkuobotYTmupBcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gaW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBjaGFuZ2VkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIGlmICghdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHBhbmVsRGF0YS4kLnRyZWUuY2hhbmdlZCh1dWlkLCBpbmZvKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reS6huafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOmAieS4reeJqeS9k+eahOexu+Wei1xuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kCDpgInkuK3niankvZPnmoQgdXVpZFxuICAgICAqL1xuICAgIHNlbGVjdGVkKHR5cGU6IHN0cmluZywgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0uZGJSZWFkeSB8fCB0eXBlICE9PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWxlY3RlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4reS6huafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOmAieS4reeJqeS9k+eahOexu+Wei1xuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kCDpgInkuK3niankvZPnmoQgdXVpZFxuICAgICAqL1xuICAgIHVuc2VsZWN0ZWQodHlwZTogc3RyaW5nLCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF2bS5kYlJlYWR5IHx8IHR5cGUgIT09ICdhc3NldCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudW5zZWxlY3RlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWumuS9jeWIsOi1hOa6kO+8jOS8mumXqueDgVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kCDpgInkuK3niankvZPnmoQgdXVpZFxuICAgICAqIEBwYXJhbSBhbmltYXRpb24g6buY6K6k5Yqo55S7XG4gICAgICovXG4gICAgYXN5bmMgdHdpbmtsZSh1dWlkOiBzdHJpbmcsIGFuaW1hdGlvbiA9ICdzaGFrZScpIHtcbiAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0b1V1aWQgPSB0cmVlRGF0YS51cmxUb1V1aWRbdXVpZF0gfHwgdHJlZURhdGEuZmlsZVRvVXVpZFt1dWlkXTtcbiAgICAgICAgaWYgKHRvVXVpZCkge1xuICAgICAgICAgICAgdXVpZCA9IHRvVXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmXqueDgeexu+Wei+aYryBUZXh0dXJlMkQg55qE6K+d77yM55u05o6l6Zeq54OB5Zu+54mH5pys6LqrXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRyZWVEYXRhLnV1aWRUb0Fzc2V0W3V1aWRdO1xuICAgICAgICBpZiAodGFyZ2V0Py50eXBlID09PSAnY2MuVGV4dHVyZTJEJykge1xuICAgICAgICAgICAgdXVpZCA9IHV1aWQuc3BsaXQoJ0AnKVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsIGFuaW1hdGlvbik7XG4gICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHV1aWQsIHRydWUpO1xuICAgIH0sXG4gICAgYXN5bmMgcXVlcnlBc3NldCh1dWlkOiBzdHJpbmcsIG5leHRTdG9wOiBib29sZWFuKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCB1dGlscy5nZXRBc3NldEZvclByZXZpZXcodXVpZCwgbmV4dFN0b3ApO1xuICAgIH0sXG4gICAgYXN5bmMgcXVlcnlDaGlsZHJlbih1dWlkOiBzdHJpbmcsIG5leHRTdG9wOiBib29sZWFuKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCB1dGlscy5nZXRDaGlsZHJlbkZvclByZXZpZXcodXVpZCwgbmV4dFN0b3ApO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbGlzdGVuZXJzID0ge1xuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgdm0gJiYgdm0ucmVzaXplKCk7XG4gICAgfSxcbiAgICBzaG93KCkge1xuICAgICAgICB2bSAmJiB2bS5yZXNpemUoKTtcbiAgICB9LFxuICAgIGZvY3VzKCkge1xuICAgICAgICBpZiAodm0pIHtcbiAgICAgICAgICAgIHZtLnJlZm9jdXMgPSB0cnVlO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB2bS5yZWZvY3VzID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbi8qKlxuICog6Z2i5p2/IHJlYWR5XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xuXG4gICAgdm0gPSBuZXcgVnVlKHtcbiAgICAgICAgZWw6IHBhbmVsLiQuY29udGVudCxcbiAgICAgICAgY29tcG9uZW50czoge1xuICAgICAgICAgICAgdHJlZTogcmVxdWlyZSgnLi9jb21wb25lbnRzL3RyZWUnKSxcbiAgICAgICAgICAgIFNlcGFyZXRlQm94OiByZXF1aXJlKCcuL2NvbXBvbmVudHMvc2VwYXJldGUtYm94JykuZGVmYXVsdCxcbiAgICAgICAgfSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVmb2N1czogZmFsc2UsIC8vIOmHjeaWsOiOt+W+l+eEpueCuVxuICAgICAgICAgICAgZGJSZWFkeTogZmFsc2UsIC8vIGZhbHNlIOS8muaciSBsb2FkaW5nIOaViOaenFxuICAgICAgICAgICAgd2FybkNhc2U6ICcnLCAvLyDmlLbliLAgZGIg55qE56aB55So6K2m5ZGK77yM55WM6Z2i57uZ5Ye65o+Q56S65bm26ZSB5a6a6LWE5rqQ5pON5L2cXG4gICAgICAgICAgICBvcGVyYXRlTG9jazogZmFsc2UsIC8vIOmUgeWumui1hOa6kOaTjeS9nFxuICAgICAgICAgICAgcmVmcmVzaExvY2s6IGZhbHNlLCAvLyDliLfmlrDplIHlrprnirbmgIHvvIzlj5HotbfliLfmlrDotYTmupDnmoTml7blgJnkvJrorr7nva5cbiAgICAgICAgICAgIGlzT3BlcmF0aW5nOiBmYWxzZSwgLy8g5piv5ZCm5q2j5Zyo5pON5L2cXG4gICAgICAgICAgICByZWZyZXNoaW5nOiB7IHR5cGU6ICcnLCBuYW1lOiAnJyB9LCAvLyDmraPlnKjlt67lvILmm7TmlrAsIG5hbWUg5piv6LWE5rqQ5ZCN56ewXG4gICAgICAgICAgICBkcm9wcGFibGVUeXBlczogWydmaWxlJywgJ2NjLk5vZGUnXSwgLy8g5Y+v5ouW5Yqo55qE6LWE5rqQ57G75Z6LXG4gICAgICAgICAgICBhbGxFeHBhbmQ6IG51bGwsIC8vIOS4uuS6huiOt+WPluWIneWni+eahCB3YXRjaCDnlJ/mlYjvvIzkuI3og73otYvliJ3lp4vlgLwgdHJ1ZSDmiJYgZmFsc2VcbiAgICAgICAgICAgIHZpZXdXaWR0aDogMCwgLy8g5qCR5b2i5omA5Zyo55qE5rua5Yqo5Yy655qE5Y+v6KeG5a695bqmXG4gICAgICAgICAgICB2aWV3SGVpZ2h0OiAwLCAvLyDmoJHlvaLmiYDlnKjnmoTmu5rliqjljLrnmoTlj6/op4bpq5jluqZcbiAgICAgICAgICAgIHRyZWVIZWlnaHQ6IDAsIC8vIOWujOaVtOagkeW9oueahOWFqOmDqOmrmOW6plxuICAgICAgICAgICAgZHJvcEJveFN0eWxlOiB7fSwgLy8g5ouW5ou95qGG55qE5a6e5pe25L2N572u77yM55SxIHRyZWUg57uE5Lu26LWL5YC8XG4gICAgICAgICAgICBzZWFyY2hWYWx1ZTogJycsXG4gICAgICAgICAgICBzZWFyY2hJbkZvbGRlcjogbnVsbCwgLy8g5Zyo5paH5Lu25aS55YaF5pCc57SiXG4gICAgICAgICAgICBzZWFyY2hBc3NldFR5cGVzOiBbXSwgLy8g5pCc57SiIGFzc2V0VHlwZe+8jOWPr+WkmumAiVxuICAgICAgICAgICAgc2VhcmNoVHlwZTogJ25hbWUnLCAvLyDmjIflrprmkJzntKLnmoTnsbvlnotcbiAgICAgICAgICAgIHNlYXJjaFR5cGVMYWJlbDogJ2kxOG46YXNzZXRzLm1lbnUuc2VhcmNoTmFtZScsIC8vIOaMh+WumuaQnOe0oueahOexu+Wei+eahCBsYWJlbFxuICAgICAgICAgICAgZXh0ZW5kU2VhcmNoRnVuYzoge30sIC8vIOaJqeWxleaQnOe0ouaWueW8j1xuICAgICAgICAgICAgc29ydFR5cGU6ICduYW1lJywgLy8g5oyH5a6a5o6S5bqP55qE57G75Z6LXG4gICAgICAgICAgICBsb2NhbEZpbGVFeHRlbmQ6IFtdLCAvLyDmnKzlnLDmlofku7bmi5PlsZVcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgIHNlYXJjaFBsYWNlaG9sZGVyKCk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICBpZiAodm0uc2VhcmNoVHlwZUxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2bS5zZWFyY2hUeXBlTGFiZWw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZVRleHQgPSB2bS5zZWFyY2hUeXBlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGV0dGVyVXBwZXJDYXNlID0gdHlwZVRleHQudG9Mb2NhbGVVcHBlckNhc2UoKS5zdWJzdHIoMCwgMSkgKyB0eXBlVGV4dC5zdWJzdHIoMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBpMThuOmFzc2V0cy5tZW51LnNlYXJjaCR7Zmlyc3RMZXR0ZXJVcHBlckNhc2V9YDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNMb2NhbEZpbGVFeHRlbmQoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhdm0ubG9jYWxGaWxlRXh0ZW5kLmxlbmd0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHdhdGNoOiB7XG4gICAgICAgICAgICBzZWFyY2hWYWx1ZSgpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC52YWx1ZSA9IHZtLnNlYXJjaFZhbHVlO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VhcmNoKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VhcmNoQXNzZXRUeXBlcygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VhcmNoKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VhcmNoVHlwZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAodm0uc2VhcmNoVHlwZSA9PT0gJ3VzYWdlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2VhcmNoQXNzZXRUeXBlcyA9IFsnY2MuU2NlbmVBc3NldCcsICdjYy5QcmVmYWInLCAnY2MuTWF0ZXJpYWwnLCAnY2MuQW5pbWF0aW9uQ2xpcCddO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VhcmNoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlYXJjaEluRm9sZGVyKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWFyY2goKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb3J0VHlwZSgpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNvcnQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyBsb2NhbEZpbGVFeHRlbmQoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGFuZWxEYXRhLiQucGFuZWwuaW5pdExvY2FsRmlsZVRyZWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIG1vdW50ZWQoKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbCA9IHRoaXM7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dCA9IHRoaXMuJHJlZnMuc2VhcmNoSW5wdXQ7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC50b2dnbGVFeHBhbmRJY29uID0gdGhpcy4kcmVmcy50b2dnbGVFeHBhbmRJY29uO1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveCA9IHRoaXMuJHJlZnMudmlld0JveDtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUgPSB0aGlzLiRyZWZzLnRyZWU7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Yid5aeL5YyW55uR5ZCsIHNjcm9sbCDkuovku7ZcbiAgICAgICAgICAgICAqIOS4jeaUvuWcqCB2dWUgdGVtcGxhdGUg6YeM6Z2i5piv5Zug5Li65pyJ5oCn6IO95o2f6ICX77yMdnVlIOmHjOW/q+mAn+a7muWKqOeahOivneS8muacieWJjeWQjuepuueZveWMulxuICAgICAgICAgICAgICog6L+Z5qC355u05o6l57uR5a6a5oCn6IO95pyA5aW9XG4gICAgICAgICAgICAgKiB2bS50cmVlSGVpZ2h0ID4gdm0udmlld0hlaWdodCDmmK/kuLrkuobkv53pmpzmraTml7bmnInlnoLnm7Tmu5rliqjmnaFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy4kcmVmcy52aWV3Qm94LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgJ3Njcm9sbCcsXG4gICAgICAgICAgICAgICAgKGV2ZW50OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZtLnRyZWVIZWlnaHQgPiB2bS52aWV3SGVpZ2h0ICYmIHZtLnRyZWVIZWlnaHQgPCB2bS52aWV3SGVpZ2h0ICsgZXZlbnQudGFyZ2V0LnNjcm9sbFRvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zY3JvbGxUb3AgPSB2bS50cmVlSGVpZ2h0IC0gdm0udmlld0hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2Nyb2xsVG9wID0gZXZlbnQudGFyZ2V0LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgICB9LFxuICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe/u+ivkVxuICAgICAgICAgICAgICogQHBhcmFtIGtleSDkuI3luKbpnaLmnb/lkI3np7DnmoTmoIforrDlrZfnrKZcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoYGFzc2V0cy4ke2tleX1gKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyByZWZyZXNoKCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmRiUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw5aSW6YOo5pWw5o2u5ZCO6Kem5Y+RIHRyZWUg5pWw5o2u55qE5pu05pawXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHBhbmVsRGF0YS5jb25maWcudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdm0uaXNPcGVyYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5yZXNldCgpO1xuICAgICAgICAgICAgICAgICAgICB2bS5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmRiUmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyByZWZyZXNoREIoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ2Fzc2V0LWRiJywgJ2F1dG9TY2FuJyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdm0ucmVmcmVzaExvY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYWxsLWRhdGFiYXNlJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2FyblNob3cobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdm0ud2FybkNhc2UgPSBuYW1lO1xuICAgICAgICAgICAgICAgIHZtLm9wZXJhdGVMb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YXJuSGlkZSgpIHtcbiAgICAgICAgICAgICAgICB2bS53YXJuQ2FzZSA9ICcnO1xuICAgICAgICAgICAgICAgIHZtLm9wZXJhdGVMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICAgICAgdm0uZGJSZWFkeSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWFqOmDqOiKgueCueaYr+WQpuWxleW8gFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhbGxUb2dnbGUoKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hbGxUb2dnbGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaQnOe0ouahhiBpbnB1dCDmnInlj5jliqhcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2VhcmNoQ2hhbmdlKCkge1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaFZhbHVlID0gcGFuZWxEYXRhLiQuc2VhcmNoSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pCc57Si5qGG6YeM5oyJ6ZSu55uYIOS4i+eureWktFxuICAgICAgICAgICAgICog5YiH5o2i54Sm54K577yM5bm26YCJ5Lit5pCc57Si57uT5p6c5Lit56ys5LiA5Liq6aG5XG4gICAgICAgICAgICAgKiBAcGFyYW0gZXZlbnQg6ZSu55uY5LqL5Lu2XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNlYXJjaEFycm93RG93bihldmVudDogS2V5Ym9hcmRFdmVudCwgZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmJsdXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZtLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBEb3duTGVmdFJpZ2h0KGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5pcGNTZWxlY3RGaXJzdENoaWxkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Y+W5raI5pCc57Si57G75Z6L77yM6buY6K6kIG5hbWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2FuY2VsU2VhcmNoVHlwZSgpIHtcbiAgICAgICAgICAgICAgICB2bS5zZWFyY2hUeXBlID0gJ25hbWUnO1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaFR5cGVMYWJlbCA9ICcnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5Y+W5raI5Zyo5paH5Lu25aS55YaF5pCc57SiXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNhbmNlbFNlYXJjaEluRm9sZGVyKCkge1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaEluRm9sZGVyID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOWPlua2iOmZkOWumuaQnOe0ouexu+Wei1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjYW5jZWxTZWFyY2hBc3NldFR5cGVzKCkge1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaEFzc2V0VHlwZXMgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjbGVhclNlYXJjaCgpIHtcbiAgICAgICAgICAgICAgICAvLyDmuIXnqbrmkJzntKJcbiAgICAgICAgICAgICAgICB2bS5zZWFyY2hJbkZvbGRlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgdm0uc2VhcmNoVmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICB2bS5zZWFyY2hBc3NldFR5cGVzID0gW107XG5cbiAgICAgICAgICAgICAgICBpZiAodm0uc2VhcmNoVHlwZSA9PT0gJ2ZhaWxzJykge1xuICAgICAgICAgICAgICAgICAgICB2bS5zZWFyY2hUeXBlID0gJ25hbWUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyDlvLnlh7rliJvlu7rotYTmupDoj5zljZVcbiAgICAgICAgICAgIHBvcHVwQ3JlYXRlTWVudSxcblxuICAgICAgICAgICAgLy8g5by55Ye66Z2i5p2/5pCc57Si6I+c5Y2VXG4gICAgICAgICAgICBwb3B1cFNlYXJjaE1lbnUsXG5cbiAgICAgICAgICAgIC8vIOW8ueWHuumdouadv+aOkuW6j+aWueW8j+iPnOWNlVxuICAgICAgICAgICAgcG9wdXBTb3J0TWVudSxcblxuICAgICAgICAgICAgLy8g6Z2i5p2/55qE5Y+z5Ye76I+c5Y2VXG4gICAgICAgICAgICBwb3B1cFBhbmVsTWVudSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6LCD5pW05Y+v6KeG5Yy65Z+f6auY5bqmXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAodm0gJiYgcGFuZWxEYXRhLiQudmlld0JveCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlu7bml7bmmK/kuLrkuobnrYkgZG9tIOWujOaIkOS6huWGjeiOt+WPlumrmOW6plxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLnZpZXdXaWR0aCA9IHBhbmVsLmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0udmlld0hlaWdodCA9IHBhcnNlSW50KHBhbmVsRGF0YS4kLnZpZXdCb3guc3R5bGUuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZmlsdGVyQXNzZXRzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOS7peS+v+WcqOaLluaLvei/m+aWh+S7tuaXtlxuICAgICAgICAgICAgICog6K6p6Z2i5p2/6YeN5paw6I635b6X54Sm54K5XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZvY3VzV2luZG93KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IHJlcXVpcmUoJ0BlbGVjdHJvbi9yZW1vdGUnKTtcbiAgICAgICAgICAgICAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLmZvY3VzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNTZWFyY2hpbmdNb2RlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1dGlscy5pc1NlYXJjaGluZ01vZGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyBpbml0TG9jYWxGaWxlVHJlZSgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAoIXZtLmxvY2FsRmlsZUV4dGVuZC5sZW5ndGgpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gKGF3YWl0IFByb21pc2UuYWxsKHZtLmxvY2FsRmlsZUV4dGVuZC5tYXAoYXN5bmMgKGV4dGVuZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRQYWNrYWdlRmlsZUV4dGVuZChleHRlbmQucGF0aCk7XG4gICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgICAgICAgICB2bS4kcmVmcy5sb2NhbEZpbGUudHJlZSA9IGZpbGVzO1xuXG4gICAgICAgICAgICAgICAgdm0uJHJlZnMubG9jYWxGaWxlLnNldFRlbXBsYXRlKCd0ZXh0JywgYDxzcGFuIGNsYXNzPVwibmFtZVwiPjwvc3Bhbj5gKTtcbiAgICAgICAgICAgICAgICB2bS4kcmVmcy5sb2NhbEZpbGUuc2V0VGVtcGxhdGVJbml0KCd0ZXh0JywgKCR0ZXh0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgJHRleHQuJG5hbWUgPSAkdGV4dC5xdWVyeVNlbGVjdG9yKCcubmFtZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZtLiRyZWZzLmxvY2FsRmlsZS5zZXRSZW5kZXIoJ3RleHQnLCAoJHRleHQ6IGFueSwgZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICR0ZXh0LiRuYW1lLmlubmVySFRNTCA9IGRhdGEuZGV0YWlsLnZhbHVlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdm0uJHJlZnMubG9jYWxGaWxlLnNldFRlbXBsYXRlSW5pdCgnaXRlbScsICgkZGl2OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGRvbSA9IHZtLiRyZWZzLmxvY2FsRmlsZTtcbiAgICAgICAgICAgICAgICAgICAgJGRpdi5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkZGl2LmRhdGEuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRmlsZSgkZGl2LmRhdGEuZmlsZVBhdGgsICRkaXYuZGF0YS5yb290KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICRkb20uc2VsZWN0KCRkaXYuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICRkb20uY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAkZG9tLnNlbGVjdCgkZGl2LmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgJGRvbS5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdm0uJHJlZnMubG9jYWxGaWxlLnNldFJlbmRlcignaXRlbScsICgkZGl2OiBhbnksIGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5kZXRhaWwuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkaXYuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkaXYucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBkYiDlsLHnu6rlkI7miY3og73mn6Xor6LmlbDmja5cbiAgICB2bS5kYlJlYWR5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcmVhZHknKTtcbiAgICBpZiAodm0uZGJSZWFkeSkge1xuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVTdGFydCgnYXNzZXRzOnJlbmRlci10cmVlJyk7XG4gICAgICAgIGF3YWl0IG1ldGhvZHMudW5zdGFnaW5nKCk7XG4gICAgICAgIGF3YWl0IHZtLnJlZnJlc2goKTtcblxuICAgICAgICAvLyDorqkgY3RybCArIHIg55qE5Yi35paw77yM6IO95oGi5aSN6YCJ5Lit54q25oCBXG4gICAgICAgIHBhbmVsRGF0YS4kLnRyZWUucmVzZXRTZWxlY3RlZCgpO1xuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVFbmQoJ2Fzc2V0czpyZW5kZXItdHJlZScsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOeUseS6jueZu+W9leeVjOmdouWHuueOsOaXtuS9v+eUqOS6huiuqeebuOmCu+WFg+e0oCBkaXNwbGF5OiBub25lIOeahOagt+W8j++8jFxuICAgICAqIOatpOaXtuWPliB2aWV3Qm94LmNsaWVudEhlaWdodCDkuLogMO+8jOagkeW9ouaYvuekuuS8muS4jeato+ehrlxuICAgICAqIOWKoOWFpei/meS4quinguWvn+WZqO+8jOaYvuekuuaXtumHjeeul1xuICAgICAqL1xuICAgIG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgICAgKGVudHJpZXMpID0+IHtcbiAgICAgICAgICAgIGVudHJpZXMuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdm0ucmVzaXplKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJvb3Q6IHZtLiRlbCxcbiAgICAgICAgICAgIHJvb3RNYXJnaW46ICcwcHgnLFxuICAgICAgICAgICAgdGhyZXNob2xkOiAwLjEsXG4gICAgICAgIH0sXG4gICAgKS5vYnNlcnZlKHBhbmVsRGF0YS4kLnZpZXdCb3gpO1xuXG4gICAgLy8g6K+G5Yir5aSW6YOo5omp5bGVXG4gICAgY29uc3QgcGtncyA9IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKHsgZW5hYmxlOiB0cnVlIH0pO1xuICAgIHBrZ3MuZm9yRWFjaChwYW5lbERhdGEuZXh0ZW5zaW9uLmF0dGFjaCk7XG4gICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5vbignZW5hYmxlJywgcGFuZWxEYXRhLmV4dGVuc2lvbi5hdHRhY2gpO1xuICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2Rpc2FibGUnLCBwYW5lbERhdGEuZXh0ZW5zaW9uLmRldGFjaCk7XG59XG5cbi8qKlxuICog6Z2i5p2/IGJlZm9yZUNsb3NlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiZWZvcmVDbG9zZSgpIHtcbiAgICBpZiAodm0pIHtcbiAgICAgICAgYXdhaXQgbWV0aG9kcy5zdGFnaW5nKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOmdouadvyBjbG9zZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgaWYgKHZtKSB7XG4gICAgICAgIHZtLmRiUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgcGFuZWxEYXRhLmNsZWFyKCk7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgfVxuICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ucmVtb3ZlTGlzdGVuZXIoJ2VuYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uYXR0YWNoKTtcbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdkaXNhYmxlJywgcGFuZWxEYXRhLmV4dGVuc2lvbi5kZXRhY2gpO1xufVxuIl19