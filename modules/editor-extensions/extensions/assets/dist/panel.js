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
const separate_box_1 = require("./components/separate-box");
const panelData = __importStar(require("./components/panel-data"));
const treeData = __importStar(require("./components/tree-data"));
const utils = __importStar(require("./components/utils"));
const util_1 = require("./util");
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel;
let vm;
const vueTemplate = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../static/template/index.html'), 'utf8');
const AssetPanelVM = Vue.extend({
    name: 'AssetPanelVM',
    components: {
        tree: require('./components/tree'),
        SeparateBox: separate_box_1.SeparateBox,
    },
    data() {
        return {
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
        };
    },
    computed: {
        searchPlaceholder() {
            if (this.searchTypeLabel) {
                return this.searchTypeLabel;
            }
            const typeText = this.searchType;
            const firstLetterUpperCase = typeText.toLocaleUpperCase().substr(0, 1) + typeText.substr(1);
            return `i18n:assets.menu.search${firstLetterUpperCase}`;
        },
        hasLocalFileExtend() {
            return !!this.localFileExtend.length;
        },
    },
    watch: {
        searchValue() {
            panelData.$.searchInput.value = this.searchValue;
            panelData.$.tree.search();
        },
        searchAssetTypes() {
            panelData.$.searchInput.focus();
            panelData.$.tree.search();
        },
        searchType() {
            if (this.searchType === 'usages') {
                this.searchAssetTypes = ['cc.SceneAsset', 'cc.Prefab', 'cc.Material', 'cc.AnimationClip'];
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
         * this.treeHeight > this.viewHeight 是为了保障此时有垂直滚动条
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
         * @param key 不带面板名称的标记字符
         */
        t(key) {
            return Editor.I18n.t(`assets.${key}`);
        },
        async refresh() {
            try {
                this.dbReady = false;
                // 更新外部数据后触发 tree 数据的更新
                await panelData.config.update();
                panelData.$.tree.update();
                this.isOperating = true;
                await treeData.reset();
                this.isOperating = false;
            }
            catch (error) {
                console.error(error);
            }
            finally {
                this.dbReady = true;
            }
        },
        async refreshDB() {
            const value = await Editor.Profile.getConfig('asset-db', 'autoScan');
            if (value) {
                this.refresh();
                return;
            }
            this.refreshLock = true;
            Editor.Message.send('asset-db', 'refresh-all-database');
        },
        warnShow(name) {
            this.warnCase = name;
            this.operateLock = true;
        },
        warnHide() {
            this.warnCase = '';
            this.operateLock = false;
            this.refresh();
        },
        clear() {
            this.dbReady = false;
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
        /**
         * 取消搜索类型，默认 name
         */
        cancelSearchType() {
            this.searchType = 'name';
            this.searchTypeLabel = '';
        },
        /**
         * 取消在文件夹内搜索
         */
        cancelSearchInFolder() {
            this.searchInFolder = null;
        },
        /**
         * 取消限定搜索类型
         */
        cancelSearchAssetTypes() {
            this.searchAssetTypes = [];
        },
        clearSearch() {
            // 清空搜索
            this.searchInFolder = null;
            this.searchValue = '';
            this.searchAssetTypes = [];
            if (this.searchType === 'fails') {
                this.searchType = 'name';
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
                    this.viewWidth = panel.clientWidth;
                    this.viewHeight = parseInt(panelData.$.viewBox.style.height);
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
            if (!this.localFileExtend.length) {
                return;
            }
            const files = (await Promise.all(this.localFileExtend.map(async (extend) => {
                return (0, util_1.getPackageFileExtend)(extend.path);
            })));
            const localFile = this.$refs.localFile;
            if (!localFile) {
                return;
            }
            localFile.tree = files;
            localFile.setTemplate('text', `<span class="name"></span>`);
            localFile.setTemplateInit('text', ($text) => {
                $text.$name = $text.querySelector('.name');
            });
            localFile.setRender('text', ($text, data) => {
                $text.$name.innerHTML = data.detail.value;
            });
            localFile.setTemplateInit('item', ($div) => {
                $div.addEventListener('dblclick', (event) => {
                    if (!$div.data.isDirectory) {
                        (0, util_1.openFile)($div.data.filePath, $div.data.root);
                    }
                    localFile.render();
                });
            });
            localFile.setRender('item', ($div, data) => {
                if (data.detail.disabled) {
                    $div.setAttribute('disabled', '');
                }
                else {
                    $div.removeAttribute('disabled');
                }
            });
        },
        async resetSearchParams() {
            // 尽量减少直接设置新值，因为这些值都被 watch 了，会触发 search
            this.searchValue && (this.searchValue = '');
            this.searchInFolder && (this.searchInFolder = null);
            this.searchAssetTypes.length && (this.searchAssetTypes = []);
            this.searchType = 'name';
            this.searchTypeLabel = 'i18n:assets.menu.searchName';
            // 修改上面的值 通过 watch 的机制触发 tree.search() 
            // 所以要等 nextTick 才能得到 tree.search() 返回的 timer
            await this.$nextTick();
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
        if (!vm || !state) {
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
        vm && vm.dbReady && panelData.$.searchInput.focus();
    },
    /**
     * 复制资源
     */
    copy() {
        vm && vm.dbReady && panelData.$.tree.copy();
    },
    /**
     * 来自编辑器顶层 edit 菜单的 paste 指令
     */
    paste() {
        if (!vm || !vm.dbReady) {
            return;
        }
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
        vm && vm.dbReady && panelData.$.tree.cut();
    },
    /**
     * 复制节点
     */
    duplicate() {
        if (!vm || !vm.dbReady) {
            return;
        }
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
        vm && vm.dbReady && panelData.$.tree.delete();
    },
    up() {
        vm && vm.dbReady && panelData.$.tree.upDownLeftRight('up');
    },
    down() {
        vm && vm.dbReady && panelData.$.tree.upDownLeftRight('down');
    },
    left() {
        vm && vm.dbReady && panelData.$.tree.upDownLeftRight('left');
    },
    right() {
        vm && vm.dbReady && panelData.$.tree.upDownLeftRight('right');
    },
    shiftUp() {
        vm && vm.dbReady && panelData.$.tree.shiftUpDown('up');
    },
    shiftDown() {
        vm && vm.dbReady && panelData.$.tree.shiftUpDown('down');
    },
    rename() {
        vm && vm.dbReady && panelData.$.tree.keyboardRename();
    },
    /**
     * 来自编辑器顶层 edit 菜单的 selectAll 指令
     */
    selectAll() {
        vm && vm.dbReady && panelData.$.tree.selectAll();
    },
    /**
     * esc 快捷键取消选中
     */
    selectClear() {
        vm && vm.dbReady && panelData.$.tree.selectClear();
    },
    /**
     * asset db 就绪
     * 刷新数据
     */
    async ready() {
        if (!vm) {
            return;
        }
        Editor.Metrics.trackTimeStart('assets:render-tree');
        vm.dbReady = true;
        await exports.methods.unstaging();
        if (vm) {
            await vm.refresh();
            vm && panelData.$.tree.resetSelected();
        }
        Editor.Metrics.trackTimeEnd('assets:render-tree', { output: true });
    },
    refreshFinish() {
        vm && (vm.refreshLock = false);
    },
    /**
     * asset db 关闭
     * 清除数据
     */
    close() {
        vm && vm.clear();
    },
    dbReady() {
        if (vm && vm.dbReady) {
            vm.refresh();
        }
    },
    dbClose() {
        if (vm && vm.dbReady) {
            vm.refresh();
        }
    },
    dbPause(mask) {
        if (vm && vm.dbReady) {
            vm.warnShow(mask);
        }
    },
    dbResume() {
        if (vm) {
            vm.warnHide();
        }
    },
    /**
     * 添加了资源
     * @param uuid 资源
     * @param info 信息
     */
    async added(uuid, info) {
        if (!vm || !vm.dbReady) {
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
        if (!vm || !vm.dbReady) {
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
        if (!vm || !vm.dbReady) {
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
        if (!vm || !vm.dbReady || type !== 'asset') {
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
        if (!vm || !vm.dbReady || type !== 'asset') {
            return;
        }
        panelData.$.tree.unselected(uuid);
    },
    /**
     * 定位到资源，会闪烁
     * @param uuid 资源 选中物体的 uuid
     * @param animation 默认动画
     */
    async twinkle(uuid, animation = 'hint') {
        if (!uuid || !vm) {
            return;
        }
        await vm.resetSearchParams();
        panelData.$.tree.clearSearchTimer(); // twinkle 自己有滚动，手动将 search 里面的滚动清空
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
                vm && (vm.refocus = false);
            }, 300);
        }
    },
};
async function ready() {
    // @ts-ignore
    panel = this;
    vm?.$destroy();
    vm = new AssetPanelVM();
    vm.$mount(panel.$.container);
    /**
     * 由于登录界面出现时使用了让相邻元素 display: none 的样式，
     * 此时取 viewBox.clientHeight 为 0，树形显示会不正确
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
    // db 就绪后才能查询数据
    const ready = await Editor.Message.request('asset-db', 'query-ready');
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
        vm.dbReady = false;
        panelData.clear();
        treeData.clear();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdiLDJCQUFrQztBQUNsQywrQkFBNEI7QUFDNUIsd0RBQTBHO0FBQzFHLDREQUFzRDtBQUN0RCxtRUFBcUQ7QUFDckQsaUVBQW1EO0FBQ25ELDBEQUE0QztBQUM1QyxpQ0FBd0Q7QUFHeEQsTUFBTSxHQUFHLEdBQW1CLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZELEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUNqQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFFNUIsSUFBSSxLQUFVLENBQUM7QUFDZixJQUFJLEVBQU8sQ0FBQztBQUVaLE1BQU0sV0FBVyxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsK0JBQStCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUUzRixNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQzVCLElBQUksRUFBRSxjQUFjO0lBQ3BCLFVBQVUsRUFBRTtRQUNSLElBQUksRUFBRSxPQUFPLENBQUMsbUJBQW1CLENBQUM7UUFDbEMsV0FBVyxFQUFYLDBCQUFXO0tBQ2Q7SUFDRCxJQUFJO1FBQ0EsT0FBTztZQUNILE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsRUFBRTtZQUNaLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtZQUNsQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FB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QUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN0RSxJQUFJLEtBQUssRUFBRTtRQUNQLE1BQU0sZUFBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQ3pCO0FBQ0wsQ0FBQztBQXhDRCxzQkF3Q0M7QUFFRDs7R0FFRztBQUNJLEtBQUssVUFBVSxXQUFXO0lBQzdCLElBQUksRUFBRSxFQUFFO1FBQ0osTUFBTSxlQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDM0I7QUFDTCxDQUFDO0FBSkQsa0NBSUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLEtBQUs7SUFDakIsSUFBSSxFQUFFLEVBQUU7UUFDSixFQUFFLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNuQixTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbEIsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQ3BCO0lBRUQsSUFBSSxLQUFLLEVBQUM7UUFDTixLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ3RDO0lBRUQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xGLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVuRixFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDZixFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ1YsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixDQUFDO0FBakJELHNCQWlCQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSAnLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcG9wdXBDcmVhdGVNZW51LCBwb3B1cFNlYXJjaE1lbnUsIHBvcHVwU29ydE1lbnUsIHBvcHVwUGFuZWxNZW51IH0gZnJvbSAnLi9jb21wb25lbnRzL3BhbmVsLW1lbnUnO1xuaW1wb3J0IHtTZXBhcmF0ZUJveH0gZnJvbSAnLi9jb21wb25lbnRzL3NlcGFyYXRlLWJveCc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9jb21wb25lbnRzL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi9jb21wb25lbnRzL3RyZWUtZGF0YSc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL2NvbXBvbmVudHMvdXRpbHMnO1xuaW1wb3J0IHsgZ2V0UGFja2FnZUZpbGVFeHRlbmQsIG9wZW5GaWxlIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0IHR5cGUgeyBWdWVDb25zdHJ1Y3RvciB9IGZyb20gJ3Z1ZSc7XG5jb25zdCBWdWU6IFZ1ZUNvbnN0cnVjdG9yID0gcmVxdWlyZSgndnVlL2Rpc3QvdnVlLmpzJyk7XG5WdWUuY29uZmlnLnByb2R1Y3Rpb25UaXAgPSBmYWxzZTtcblZ1ZS5jb25maWcuZGV2dG9vbHMgPSBmYWxzZTtcblxubGV0IHBhbmVsOiBhbnk7XG5sZXQgdm06IGFueTtcblxuY29uc3QgdnVlVGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMvdGVtcGxhdGUvaW5kZXguaHRtbCcpLCAndXRmOCcpO1xuXG5jb25zdCBBc3NldFBhbmVsVk0gPSBWdWUuZXh0ZW5kKHtcbiAgICBuYW1lOiAnQXNzZXRQYW5lbFZNJyxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIHRyZWU6IHJlcXVpcmUoJy4vY29tcG9uZW50cy90cmVlJyksXG4gICAgICAgIFNlcGFyYXRlQm94LFxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlZm9jdXM6IGZhbHNlLCAvLyDph43mlrDojrflvpfnhKbngrlcbiAgICAgICAgICAgIGRiUmVhZHk6IGZhbHNlLCAvLyBmYWxzZSDkvJrmnIkgbG9hZGluZyDmlYjmnpxcbiAgICAgICAgICAgIHdhcm5DYXNlOiAnJywgLy8g5pS25YiwIGRiIOeahOemgeeUqOitpuWRiu+8jOeVjOmdoue7meWHuuaPkOekuuW5tumUgeWumui1hOa6kOaTjeS9nFxuICAgICAgICAgICAgb3BlcmF0ZUxvY2s6IGZhbHNlLCAvLyDplIHlrprotYTmupDmk43kvZxcbiAgICAgICAgICAgIHJlZnJlc2hMb2NrOiBmYWxzZSwgLy8g5Yi35paw6ZSB5a6a54q25oCB77yM5Y+R6LW35Yi35paw6LWE5rqQ55qE5pe25YCZ5Lya6K6+572uXG4gICAgICAgICAgICBpc09wZXJhdGluZzogZmFsc2UsIC8vIOaYr+WQpuato+WcqOaTjeS9nFxuICAgICAgICAgICAgcmVmcmVzaGluZzogeyB0eXBlOiAnJywgbmFtZTogJycgfSwgLy8g5q2j5Zyo5beu5byC5pu05pawLCBuYW1lIOaYr+i1hOa6kOWQjeensFxuICAgICAgICAgICAgZHJvcHBhYmxlVHlwZXM6IFsnZmlsZScsICdjYy5Ob2RlJ10sIC8vIOWPr+aLluWKqOeahOi1hOa6kOexu+Wei1xuICAgICAgICAgICAgYWxsRXhwYW5kOiBudWxsLCAvLyDkuLrkuobojrflj5bliJ3lp4vnmoQgd2F0Y2gg55Sf5pWI77yM5LiN6IO96LWL5Yid5aeL5YC8IHRydWUg5oiWIGZhbHNlXG4gICAgICAgICAgICB2aWV3V2lkdGg6IDAsIC8vIOagkeW9ouaJgOWcqOeahOa7muWKqOWMuueahOWPr+inhuWuveW6plxuICAgICAgICAgICAgdmlld0hlaWdodDogMCwgLy8g5qCR5b2i5omA5Zyo55qE5rua5Yqo5Yy655qE5Y+v6KeG6auY5bqmXG4gICAgICAgICAgICB0cmVlSGVpZ2h0OiAwLCAvLyDlrozmlbTmoJHlvaLnmoTlhajpg6jpq5jluqZcbiAgICAgICAgICAgIGRyb3BCb3hTdHlsZToge30sIC8vIOaLluaLveahhueahOWunuaXtuS9jee9ru+8jOeUsSB0cmVlIOe7hOS7tui1i+WAvFxuICAgICAgICAgICAgc2VhcmNoVmFsdWU6ICcnLFxuICAgICAgICAgICAgc2VhcmNoSW5Gb2xkZXI6IG51bGwsIC8vIOWcqOaWh+S7tuWkueWGheaQnOe0olxuICAgICAgICAgICAgc2VhcmNoQXNzZXRUeXBlczogW10gYXMgc3RyaW5nW10sIC8vIOaQnOe0oiBhc3NldFR5cGXvvIzlj6/lpJrpgIlcbiAgICAgICAgICAgIHNlYXJjaFR5cGU6ICduYW1lJywgLy8g5oyH5a6a5pCc57Si55qE57G75Z6LXG4gICAgICAgICAgICBzZWFyY2hUeXBlTGFiZWw6ICdpMThuOmFzc2V0cy5tZW51LnNlYXJjaE5hbWUnLCAvLyDmjIflrprmkJzntKLnmoTnsbvlnovnmoQgbGFiZWxcbiAgICAgICAgICAgIGV4dGVuZFNlYXJjaEZ1bmM6IHt9LCAvLyDmianlsZXmkJzntKLmlrnlvI9cbiAgICAgICAgICAgIHNvcnRUeXBlOiAnbmFtZScsIC8vIOaMh+WumuaOkuW6j+eahOexu+Wei1xuICAgICAgICAgICAgbG9jYWxGaWxlRXh0ZW5kOiBbXSwgLy8g5pys5Zyw5paH5Lu25ouT5bGVXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBzZWFyY2hQbGFjZWhvbGRlcigpOiBzdHJpbmcge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VhcmNoVHlwZUxhYmVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VhcmNoVHlwZUxhYmVsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0eXBlVGV4dCA9IHRoaXMuc2VhcmNoVHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0TGV0dGVyVXBwZXJDYXNlID0gdHlwZVRleHQudG9Mb2NhbGVVcHBlckNhc2UoKS5zdWJzdHIoMCwgMSkgKyB0eXBlVGV4dC5zdWJzdHIoMSk7XG4gICAgICAgICAgICByZXR1cm4gYGkxOG46YXNzZXRzLm1lbnUuc2VhcmNoJHtmaXJzdExldHRlclVwcGVyQ2FzZX1gO1xuICAgICAgICB9LFxuICAgICAgICBoYXNMb2NhbEZpbGVFeHRlbmQoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICByZXR1cm4gISF0aGlzLmxvY2FsRmlsZUV4dGVuZC5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgICBzZWFyY2hWYWx1ZSgpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LnZhbHVlID0gdGhpcy5zZWFyY2hWYWx1ZTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuc2VhcmNoKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlYXJjaEFzc2V0VHlwZXMoKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWFyY2goKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VhcmNoVHlwZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaFR5cGUgPT09ICd1c2FnZXMnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hBc3NldFR5cGVzID0gWydjYy5TY2VuZUFzc2V0JywgJ2NjLlByZWZhYicsICdjYy5NYXRlcmlhbCcsICdjYy5BbmltYXRpb25DbGlwJ107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWFyY2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2VhcmNoSW5Gb2xkZXIoKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWFyY2goKTtcbiAgICAgICAgfSxcbiAgICAgICAgc29ydFR5cGUoKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNvcnQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgbG9jYWxGaWxlRXh0ZW5kKCkge1xuICAgICAgICAgICAgYXdhaXQgcGFuZWxEYXRhLiQucGFuZWwuaW5pdExvY2FsRmlsZVRyZWUoKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGFzeW5jIG1vdW50ZWQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsID0gdGhpcztcbiAgICAgICAgcGFuZWxEYXRhLiQuc2VhcmNoSW5wdXQgPSB0aGlzLiRyZWZzLnNlYXJjaElucHV0O1xuICAgICAgICBwYW5lbERhdGEuJC50b2dnbGVFeHBhbmRJY29uID0gdGhpcy4kcmVmcy50b2dnbGVFeHBhbmRJY29uO1xuICAgICAgICBwYW5lbERhdGEuJC52aWV3Qm94ID0gdGhpcy4kcmVmcy52aWV3Qm94O1xuICAgICAgICBwYW5lbERhdGEuJC50cmVlID0gdGhpcy4kcmVmcy50cmVlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliJ3lp4vljJbnm5HlkKwgc2Nyb2xsIOS6i+S7tlxuICAgICAgICAgKiDkuI3mlL7lnKggdnVlIHRlbXBsYXRlIOmHjOmdouaYr+WboOS4uuacieaAp+iDveaNn+iAl++8jHZ1ZSDph4zlv6vpgJ/mu5rliqjnmoTor53kvJrmnInliY3lkI7nqbrnmb3ljLpcbiAgICAgICAgICog6L+Z5qC355u05o6l57uR5a6a5oCn6IO95pyA5aW9XG4gICAgICAgICAqIHRoaXMudHJlZUhlaWdodCA+IHRoaXMudmlld0hlaWdodCDmmK/kuLrkuobkv53pmpzmraTml7bmnInlnoLnm7Tmu5rliqjmnaFcbiAgICAgICAgICovXG4gICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAgICdzY3JvbGwnLFxuICAgICAgICAgICAgKGV2ZW50OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmVlSGVpZ2h0ID4gdGhpcy52aWV3SGVpZ2h0ICYmIHRoaXMudHJlZUhlaWdodCA8IHRoaXMudmlld0hlaWdodCArIGV2ZW50LnRhcmdldC5zY3JvbGxUb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zY3JvbGxUb3AgPSB0aGlzLnRyZWVIZWlnaHQgLSB0aGlzLnZpZXdIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zY3JvbGxUb3AgPSBldmVudC50YXJnZXQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOe/u+ivkVxuICAgICAgICAgKiBAcGFyYW0ga2V5IOS4jeW4pumdouadv+WQjeensOeahOagh+iusOWtl+esplxuICAgICAgICAgKi9cbiAgICAgICAgdChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLkkxOG4udChgYXNzZXRzLiR7a2V5fWApO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyByZWZyZXNoKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRiUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDlpJbpg6jmlbDmja7lkI7op6blj5EgdHJlZSDmlbDmja7nmoTmm7TmlrBcbiAgICAgICAgICAgICAgICBhd2FpdCBwYW5lbERhdGEuY29uZmlnLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUudXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGJSZWFkeSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIHJlZnJlc2hEQigpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdhc3NldC1kYicsICdhdXRvU2NhbicpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hMb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYWxsLWRhdGFiYXNlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhcm5TaG93KG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy53YXJuQ2FzZSA9IG5hbWU7XG4gICAgICAgICAgICB0aGlzLm9wZXJhdGVMb2NrID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgd2FybkhpZGUoKSB7XG4gICAgICAgICAgICB0aGlzLndhcm5DYXNlID0gJyc7XG4gICAgICAgICAgICB0aGlzLm9wZXJhdGVMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICB0aGlzLmRiUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWFqOmDqOiKgueCueaYr+WQpuWxleW8gFxuICAgICAgICAgKi9cbiAgICAgICAgYWxsVG9nZ2xlKCkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hbGxUb2dnbGUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaQnOe0ouahhiBpbnB1dCDmnInlj5jliqhcbiAgICAgICAgICovXG4gICAgICAgIHNlYXJjaENoYW5nZSgpIHtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVmFsdWUgPSBwYW5lbERhdGEuJC5zZWFyY2hJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmkJzntKLmoYbph4zmjInplK7nm5gg5LiL566t5aS0XG4gICAgICAgICAqIOWIh+aNoueEpueCue+8jOW5tumAieS4reaQnOe0oue7k+aenOS4reesrOS4gOS4qumhuVxuICAgICAgICAgKiBAcGFyYW0gZXZlbnQg6ZSu55uY5LqL5Lu2XG4gICAgICAgICAqL1xuICAgICAgICBzZWFyY2hBcnJvd0Rvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQsIGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICB0YXJnZXQuYmx1cigpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoZGlyZWN0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5pcGNTZWxlY3RGaXJzdENoaWxkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlj5bmtojmkJzntKLnsbvlnovvvIzpu5jorqQgbmFtZVxuICAgICAgICAgKi9cbiAgICAgICAgY2FuY2VsU2VhcmNoVHlwZSgpIHtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVHlwZSA9ICduYW1lJztcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVHlwZUxhYmVsID0gJyc7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlj5bmtojlnKjmlofku7blpLnlhoXmkJzntKJcbiAgICAgICAgICovXG4gICAgICAgIGNhbmNlbFNlYXJjaEluRm9sZGVyKCkge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hJbkZvbGRlciA9IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlj5bmtojpmZDlrprmkJzntKLnsbvlnotcbiAgICAgICAgICovXG4gICAgICAgIGNhbmNlbFNlYXJjaEFzc2V0VHlwZXMoKSB7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaEFzc2V0VHlwZXMgPSBbXTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXJTZWFyY2goKSB7XG4gICAgICAgICAgICAvLyDmuIXnqbrmkJzntKJcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoSW5Gb2xkZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hBc3NldFR5cGVzID0gW107XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaFR5cGUgPT09ICdmYWlscycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaFR5cGUgPSAnbmFtZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIOW8ueWHuuWIm+W7uui1hOa6kOiPnOWNlVxuICAgICAgICBwb3B1cENyZWF0ZU1lbnUsXG5cbiAgICAgICAgLy8g5by55Ye66Z2i5p2/5pCc57Si6I+c5Y2VXG4gICAgICAgIHBvcHVwU2VhcmNoTWVudSxcblxuICAgICAgICAvLyDlvLnlh7rpnaLmnb/mjpLluo/mlrnlvI/oj5zljZVcbiAgICAgICAgcG9wdXBTb3J0TWVudSxcblxuICAgICAgICAvLyDpnaLmnb/nmoTlj7Plh7voj5zljZVcbiAgICAgICAgcG9wdXBQYW5lbE1lbnUsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDosIPmlbTlj6/op4bljLrln5/pq5jluqZcbiAgICAgICAgICovXG4gICAgICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgICAgIGlmICh2bSAmJiBwYW5lbERhdGEuJC52aWV3Qm94KSB7XG4gICAgICAgICAgICAgICAgLy8g5bu25pe25piv5Li65LqG562JIGRvbSDlrozmiJDkuoblho3ojrflj5bpq5jluqZcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3V2lkdGggPSBwYW5lbC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3SGVpZ2h0ID0gcGFyc2VJbnQocGFuZWxEYXRhLiQudmlld0JveC5zdHlsZS5oZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLmZpbHRlckFzc2V0cygpO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICog5Lul5L6/5Zyo5ouW5ou96L+b5paH5Lu25pe2XG4gICAgICAgICAqIOiuqemdouadv+mHjeaWsOiOt+W+l+eEpueCuVxuICAgICAgICAgKi9cbiAgICAgICAgZm9jdXNXaW5kb3coKSB7XG4gICAgICAgICAgICBjb25zdCByZW1vdGUgPSByZXF1aXJlKCdAZWxlY3Ryb24vcmVtb3RlJyk7XG4gICAgICAgICAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLmZvY3VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGlzU2VhcmNoaW5nTW9kZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5pc1NlYXJjaGluZ01vZGUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgaW5pdExvY2FsRmlsZVRyZWUoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMubG9jYWxGaWxlRXh0ZW5kLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSAoYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5sb2NhbEZpbGVFeHRlbmQubWFwKGFzeW5jIChleHRlbmQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRQYWNrYWdlRmlsZUV4dGVuZChleHRlbmQucGF0aCk7XG4gICAgICAgICAgICB9KSkpO1xuXG4gICAgICAgICAgICBjb25zdCBsb2NhbEZpbGUgPSB0aGlzLiRyZWZzLmxvY2FsRmlsZSBhcyBhbnk7XG4gICAgICAgICAgICBpZiAoIWxvY2FsRmlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9jYWxGaWxlLnRyZWUgPSBmaWxlcztcbiAgICAgICAgICAgIGxvY2FsRmlsZS5zZXRUZW1wbGF0ZSgndGV4dCcsIGA8c3BhbiBjbGFzcz1cIm5hbWVcIj48L3NwYW4+YCk7XG4gICAgICAgICAgICBsb2NhbEZpbGUuc2V0VGVtcGxhdGVJbml0KCd0ZXh0JywgKCR0ZXh0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAkdGV4dC4kbmFtZSA9ICR0ZXh0LnF1ZXJ5U2VsZWN0b3IoJy5uYW1lJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxvY2FsRmlsZS5zZXRSZW5kZXIoJ3RleHQnLCAoJHRleHQ6IGFueSwgZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgJHRleHQuJG5hbWUuaW5uZXJIVE1MID0gZGF0YS5kZXRhaWwudmFsdWU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbG9jYWxGaWxlLnNldFRlbXBsYXRlSW5pdCgnaXRlbScsICgkZGl2OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAkZGl2LmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghJGRpdi5kYXRhLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuRmlsZSgkZGl2LmRhdGEuZmlsZVBhdGgsICRkaXYuZGF0YS5yb290KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsRmlsZS5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbG9jYWxGaWxlLnNldFJlbmRlcignaXRlbScsICgkZGl2OiBhbnksIGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmRldGFpbC5kaXNhYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAkZGl2LnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJGRpdi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgcmVzZXRTZWFyY2hQYXJhbXMoKSB7XG4gICAgICAgICAgICAvLyDlsL3ph4/lh4/lsJHnm7TmjqXorr7nva7mlrDlgLzvvIzlm6DkuLrov5nkupvlgLzpg73ooqsgd2F0Y2gg5LqG77yM5Lya6Kem5Y+RIHNlYXJjaFxuICAgICAgICAgICAgdGhpcy5zZWFyY2hWYWx1ZSAmJiAodGhpcy5zZWFyY2hWYWx1ZSA9ICcnKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoSW5Gb2xkZXIgJiYgKHRoaXMuc2VhcmNoSW5Gb2xkZXIgPSBudWxsKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoQXNzZXRUeXBlcy5sZW5ndGggJiYgKHRoaXMuc2VhcmNoQXNzZXRUeXBlcyA9IFtdKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVHlwZSA9ICduYW1lJztcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVHlwZUxhYmVsID0gJ2kxOG46YXNzZXRzLm1lbnUuc2VhcmNoTmFtZSc7XG5cbiAgICAgICAgICAgIC8vIOS/ruaUueS4iumdoueahOWAvCDpgJrov4cgd2F0Y2gg55qE5py65Yi26Kem5Y+RIHRyZWUuc2VhcmNoKCkgXG4gICAgICAgICAgICAvLyDmiYDku6XopoHnrYkgbmV4dFRpY2sg5omN6IO95b6X5YiwIHRyZWUuc2VhcmNoKCkg6L+U5Zue55qEIHRpbWVyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLiRuZXh0VGljaygpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHZ1ZVRlbXBsYXRlLFxufSk7XG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uL2Rpc3QvaW5kZXguY3NzJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+PC9kaXY+JztcblxuZXhwb3J0IGNvbnN0ICQgPSB7XG4gICAgY29udGFpbmVyOiAnLmNvbnRhaW5lcicsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDmmoLlrZjmlbDmja7vvJrmoJHlvaLoioLngrnnmoTmipjlj6DnirbmgIFcbiAgICAgKi9cbiAgICBhc3luYyBzdGFnaW5nKCkge1xuICAgICAgICBjb25zdCBleHBhbmRzID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCB1dWlkIGluIHRyZWVEYXRhLnV1aWRUb0V4cGFuZCkge1xuICAgICAgICAgICAgLy8g5LiN6K6w5b2V6LWE5rqQ6IqC54K55LiN5a2Y5ZyoIOaIliDmsqHmnInlsZXlvIBcbiAgICAgICAgICAgIGlmICghdHJlZURhdGEudXVpZFRvQXNzZXRbdXVpZF0gfHwgdHJlZURhdGEudXVpZFRvRXhwYW5kW3V1aWRdICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4cGFuZHMucHVzaCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaVsOaNruS/neWtmOWIsOS4u+i/m+eoi1xuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldHMnLCAnc3RhZ2luZycsIHtcbiAgICAgICAgICAgIGV4cGFuZFV1aWRzOiBleHBhbmRzLFxuICAgICAgICAgICAgc29ydFR5cGU6IHZtLnNvcnRUeXBlLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaBouWkjeaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIHVuc3RhZ2luZygpIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldHMnLCAndW5zdGFnaW5nJyk7XG4gICAgICAgIGlmICghdm0gfHwgIXN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGV4cGFuZFV1aWRzLCBzb3J0VHlwZSB9ID0gc3RhdGU7XG5cbiAgICAgICAgLy8g6IqC54K555qE5oqY5Y+gXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGV4cGFuZFV1aWRzKSkge1xuICAgICAgICAgICAgZXhwYW5kVXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvRXhwYW5kW3V1aWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6LWL5YC85o6S5bqP5pa55byPXG4gICAgICAgIGlmIChzb3J0VHlwZSkge1xuICAgICAgICAgICAgdm0uc29ydFR5cGUgPSBzb3J0VHlwZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6Z2i5p2/5rOo5YaM55qE5pa55rOV77yM5LiOIHBhY2thZ2UuanNvbiDnmoTlv6vmjbfmlrnlvI/lr7nlupRcbiAgICAgKiDkuIvlkIxcbiAgICAgKlxuICAgICAqIOa/gOa0u+mdouadv+eahOaQnOe0ouahhlxuICAgICAqL1xuICAgIGZpbmQoKSB7XG4gICAgICAgIHZtICYmIHZtLmRiUmVhZHkgJiYgcGFuZWxEYXRhLiQuc2VhcmNoSW5wdXQuZm9jdXMoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItui1hOa6kFxuICAgICAqL1xuICAgIGNvcHkoKSB7XG4gICAgICAgIHZtICYmIHZtLmRiUmVhZHkgJiYgcGFuZWxEYXRhLiQudHJlZS5jb3B5KCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rnvJbovpHlmajpobblsYIgZWRpdCDoj5zljZXnmoQgcGFzdGUg5oyH5LukXG4gICAgICovXG4gICAgcGFzdGUoKSB7XG4gICAgICAgIGlmICghdm0gfHwgIXZtLmRiUmVhZHkpIHsgXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0uaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLnBhc3RlKCk7XG4gICAgICAgICAgICB2bS5pc09wZXJhdGluZyA9IHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZtLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rnvJbovpHlmajpobblsYIgZWRpdCDoj5zljZXnmoQgY3V0IOaMh+S7pFxuICAgICAqIOWJquWIh+aYr+mihOWumueahOihjOS4uu+8jOWPquacieWGjeaJp+ihjOeymOi0tOaTjeS9nOaJjeS8mueUn+aViFxuICAgICAqL1xuICAgIGN1dCgpIHtcbiAgICAgICAgdm0gJiYgdm0uZGJSZWFkeSAmJiBwYW5lbERhdGEuJC50cmVlLmN1dCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi26IqC54K5XG4gICAgICovXG4gICAgZHVwbGljYXRlKCkge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5kYlJlYWR5KSB7IFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodm0uaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLmR1cGxpY2F0ZSgpO1xuICAgICAgICAgICAgdm0uaXNPcGVyYXRpbmcgPSB0cnVlOyAvLyDplIHlrppcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZtLmlzT3BlcmF0aW5nID0gZmFsc2U7IC8vIOino+mUgVxuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZGVsZXRlKCkge1xuICAgICAgICB2bSAmJiB2bS5kYlJlYWR5ICYmIHBhbmVsRGF0YS4kLnRyZWUuZGVsZXRlKCk7XG4gICAgfSxcbiAgICB1cCgpIHtcbiAgICAgICAgdm0gJiYgdm0uZGJSZWFkeSAmJiBwYW5lbERhdGEuJC50cmVlLnVwRG93bkxlZnRSaWdodCgndXAnKTtcbiAgICB9LFxuICAgIGRvd24oKSB7XG4gICAgICAgIHZtICYmIHZtLmRiUmVhZHkgJiYgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ2Rvd24nKTtcbiAgICB9LFxuICAgIGxlZnQoKSB7XG4gICAgICAgIHZtICYmIHZtLmRiUmVhZHkgJiYgcGFuZWxEYXRhLiQudHJlZS51cERvd25MZWZ0UmlnaHQoJ2xlZnQnKTtcbiAgICB9LFxuICAgIHJpZ2h0KCkge1xuICAgICAgICB2bSAmJiB2bS5kYlJlYWR5ICYmIHBhbmVsRGF0YS4kLnRyZWUudXBEb3duTGVmdFJpZ2h0KCdyaWdodCcpO1xuICAgIH0sXG4gICAgc2hpZnRVcCgpIHtcbiAgICAgICAgdm0gJiYgdm0uZGJSZWFkeSAmJiBwYW5lbERhdGEuJC50cmVlLnNoaWZ0VXBEb3duKCd1cCcpO1xuICAgIH0sXG4gICAgc2hpZnREb3duKCkge1xuICAgICAgICB2bSAmJiB2bS5kYlJlYWR5ICYmIHBhbmVsRGF0YS4kLnRyZWUuc2hpZnRVcERvd24oJ2Rvd24nKTtcbiAgICB9LFxuICAgIHJlbmFtZSgpIHtcbiAgICAgICAgdm0gJiYgdm0uZGJSZWFkeSAmJiBwYW5lbERhdGEuJC50cmVlLmtleWJvYXJkUmVuYW1lKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rnvJbovpHlmajpobblsYIgZWRpdCDoj5zljZXnmoQgc2VsZWN0QWxsIOaMh+S7pFxuICAgICAqL1xuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgdm0gJiYgdm0uZGJSZWFkeSAmJiBwYW5lbERhdGEuJC50cmVlLnNlbGVjdEFsbCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogZXNjIOW/q+aNt+mUruWPlua2iOmAieS4rVxuICAgICAqL1xuICAgIHNlbGVjdENsZWFyKCkge1xuICAgICAgICB2bSAmJiB2bS5kYlJlYWR5ICYmIHBhbmVsRGF0YS4kLnRyZWUuc2VsZWN0Q2xlYXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGFzc2V0IGRiIOWwsee7qlxuICAgICAqIOWIt+aWsOaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIHJlYWR5KCkge1xuICAgICAgICBpZiAoIXZtKSB7IFxuICAgICAgICAgICAgcmV0dXJuOyBcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5NZXRyaWNzLnRyYWNrVGltZVN0YXJ0KCdhc3NldHM6cmVuZGVyLXRyZWUnKTtcblxuICAgICAgICB2bS5kYlJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgYXdhaXQgbWV0aG9kcy51bnN0YWdpbmcoKTtcbiAgICAgICAgaWYgKHZtKSB7IFxuICAgICAgICAgICAgYXdhaXQgdm0ucmVmcmVzaCgpO1xuICAgICAgICAgICAgdm0gJiYgcGFuZWxEYXRhLiQudHJlZS5yZXNldFNlbGVjdGVkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBFZGl0b3IuTWV0cmljcy50cmFja1RpbWVFbmQoJ2Fzc2V0czpyZW5kZXItdHJlZScsIHsgb3V0cHV0OiB0cnVlIH0pO1xuICAgIH0sXG4gICAgcmVmcmVzaEZpbmlzaCgpIHtcbiAgICAgICAgdm0gJiYgKHZtLnJlZnJlc2hMb2NrID0gZmFsc2UpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogYXNzZXQgZGIg5YWz6ZetXG4gICAgICog5riF6Zmk5pWw5o2uXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIHZtICYmIHZtLmNsZWFyKCk7XG4gICAgfSxcbiAgICBkYlJlYWR5KCkge1xuICAgICAgICBpZiAodm0gJiYgdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgdm0ucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkYkNsb3NlKCkge1xuICAgICAgICBpZiAodm0gJiYgdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgdm0ucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkYlBhdXNlKG1hc2s6IHN0cmluZykge1xuICAgICAgICBpZiAodm0gJiYgdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgdm0ud2FyblNob3cobWFzayk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRiUmVzdW1lKCkge1xuICAgICAgICBpZiAodm0pIHtcbiAgICAgICAgICAgIHZtLndhcm5IaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5re75Yqg5LqG6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGluZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgYWRkZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgcGFuZWxEYXRhLiQudHJlZS5hZGRlZCh1dWlkLCBpbmZvKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpOS6hui1hOa6kFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uZGJSZWFkeSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgcGFuZWxEYXRhLiQudHJlZS5kZWxldGVkKHV1aWQsIGluZm8pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5L+u5pS55LqG6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGluZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgY2hhbmdlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBpZiAoIXZtIHx8ICF2bS5kYlJlYWR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgcGFuZWxEYXRhLiQudHJlZS5jaGFuZ2VkKHV1aWQsIGluZm8pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5LqG5p+Q5Liq54mp5L2TXG4gICAgICogQHBhcmFtIHR5cGUg6YCJ5Lit54mp5L2T55qE57G75Z6LXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQIOmAieS4reeJqeS9k+eahCB1dWlkXG4gICAgICovXG4gICAgc2VsZWN0ZWQodHlwZTogc3RyaW5nLCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uZGJSZWFkeSB8fCB0eXBlICE9PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5zZWxlY3RlZCh1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4reS6huafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOmAieS4reeJqeS9k+eahOexu+Wei1xuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kCDpgInkuK3niankvZPnmoQgdXVpZFxuICAgICAqL1xuICAgIHVuc2VsZWN0ZWQodHlwZTogc3RyaW5nLCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF2bSB8fCAhdm0uZGJSZWFkeSB8fCB0eXBlICE9PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuJC50cmVlLnVuc2VsZWN0ZWQodXVpZCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlrprkvY3liLDotYTmupDvvIzkvJrpl6rng4FcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupAg6YCJ5Lit54mp5L2T55qEIHV1aWRcbiAgICAgKiBAcGFyYW0gYW5pbWF0aW9uIOm7mOiupOWKqOeUu1xuICAgICAqL1xuICAgIGFzeW5jIHR3aW5rbGUodXVpZDogc3RyaW5nLCBhbmltYXRpb24gPSAnaGludCcpIHtcbiAgICAgICAgaWYgKCF1dWlkIHx8ICF2bSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdm0ucmVzZXRTZWFyY2hQYXJhbXMoKTtcbiAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5jbGVhclNlYXJjaFRpbWVyKCk7Ly8gdHdpbmtsZSDoh6rlt7HmnInmu5rliqjvvIzmiYvliqjlsIYgc2VhcmNoIOmHjOmdoueahOa7muWKqOa4heepulxuXG4gICAgICAgIGNvbnN0IHRvVXVpZCA9IHRyZWVEYXRhLnVybFRvVXVpZFt1dWlkXSB8fCB0cmVlRGF0YS5maWxlVG9VdWlkW3V1aWRdO1xuICAgICAgICBpZiAodG9VdWlkKSB7XG4gICAgICAgICAgICB1dWlkID0gdG9VdWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6Zeq54OB57G75Z6L5pivIFRleHR1cmUyRCDnmoTor53vvIznm7TmjqXpl6rng4Hlm77niYfmnKzouqtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbdXVpZF07XG4gICAgICAgIGlmICh0YXJnZXQ/LnR5cGUgPT09ICdjYy5UZXh0dXJlMkQnKSB7XG4gICAgICAgICAgICB1dWlkID0gdXVpZC5zcGxpdCgnQCcpWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgYW5pbWF0aW9uKTtcbiAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCwgdHJ1ZSk7XG4gICAgfSxcbiAgICBhc3luYyBxdWVyeUFzc2V0KHV1aWQ6IHN0cmluZywgbmV4dFN0b3A6IGJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHV0aWxzLmdldEFzc2V0Rm9yUHJldmlldyh1dWlkLCBuZXh0U3RvcCk7XG4gICAgfSxcbiAgICBhc3luYyBxdWVyeUNoaWxkcmVuKHV1aWQ6IHN0cmluZywgbmV4dFN0b3A6IGJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHV0aWxzLmdldENoaWxkcmVuRm9yUHJldmlldyh1dWlkLCBuZXh0U3RvcCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBsaXN0ZW5lcnMgPSB7XG4gICAgcmVzaXplKCkge1xuICAgICAgICB2bSAmJiB2bS5yZXNpemUoKTtcbiAgICB9LFxuICAgIHNob3coKSB7XG4gICAgICAgIHZtICYmIHZtLnJlc2l6ZSgpO1xuICAgIH0sXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIGlmICh2bSkge1xuICAgICAgICAgICAgdm0ucmVmb2N1cyA9IHRydWU7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHZtICYmICh2bS5yZWZvY3VzID0gZmFsc2UpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHBhbmVsID0gdGhpcztcblxuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbmV3IEFzc2V0UGFuZWxWTSgpO1xuICAgIHZtLiRtb3VudChwYW5lbC4kLmNvbnRhaW5lcik7XG5cbiAgICAvKipcbiAgICAgKiDnlLHkuo7nmbvlvZXnlYzpnaLlh7rnjrDml7bkvb/nlKjkuoborqnnm7jpgrvlhYPntKAgZGlzcGxheTogbm9uZSDnmoTmoLflvI/vvIxcbiAgICAgKiDmraTml7blj5Ygdmlld0JveC5jbGllbnRIZWlnaHQg5Li6IDDvvIzmoJHlvaLmmL7npLrkvJrkuI3mraPnoa5cbiAgICAgKiDliqDlhaXov5nkuKrop4Llr5/lmajvvIzmmL7npLrml7bph43nrpdcbiAgICAgKi9cbiAgICBwYW5lbC52aWV3Qm94T2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoXG4gICAgICAgIChlbnRyaWVzKSA9PiB7XG4gICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goKGVudHJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5LmludGVyc2VjdGlvblJhdGlvICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtICYmIHZtLnJlc2l6ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICByb290OiB2bS4kZWwsXG4gICAgICAgICAgICByb290TWFyZ2luOiAnMHB4JyxcbiAgICAgICAgICAgIHRocmVzaG9sZDogMC4xLFxuICAgICAgICB9LFxuICAgICk7XG4gICAgcGFuZWwudmlld0JveE9ic2VydmVyLm9ic2VydmUocGFuZWxEYXRhLiQudmlld0JveCk7XG5cbiAgICAvLyDor4bliKvlpJbpg6jmianlsZVcbiAgICBjb25zdCBwa2dzID0gRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoeyBlbmFibGU6IHRydWUgfSk7XG4gICAgcGtncy5mb3JFYWNoKHBhbmVsRGF0YS5leHRlbnNpb24uYXR0YWNoKTtcbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdlbmFibGUnLCBwYW5lbERhdGEuZXh0ZW5zaW9uLmF0dGFjaCk7XG4gICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5vbignZGlzYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uZGV0YWNoKTtcblxuICAgIC8vIGRiIOWwsee7quWQjuaJjeiDveafpeivouaVsOaNrlxuICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcmVhZHknKTtcbiAgICBpZiAocmVhZHkpIHtcbiAgICAgICAgYXdhaXQgbWV0aG9kcy5yZWFkeSgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDpnaLmnb8gYmVmb3JlQ2xvc2VcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJlZm9yZUNsb3NlKCkge1xuICAgIGlmICh2bSkge1xuICAgICAgICBhd2FpdCBtZXRob2RzLnN0YWdpbmcoKTtcbiAgICB9XG59XG5cbi8qKlxuICog6Z2i5p2/IGNsb3NlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICBpZiAodm0pIHtcbiAgICAgICAgdm0uZGJSZWFkeSA9IGZhbHNlO1xuICAgICAgICBwYW5lbERhdGEuY2xlYXIoKTtcbiAgICAgICAgdHJlZURhdGEuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBpZiAocGFuZWwpe1xuICAgICAgICBwYW5lbC52aWV3Qm94T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgICBcbiAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdlbmFibGUnLCBwYW5lbERhdGEuZXh0ZW5zaW9uLmF0dGFjaCk7XG4gICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5yZW1vdmVMaXN0ZW5lcignZGlzYWJsZScsIHBhbmVsRGF0YS5leHRlbnNpb24uZGV0YWNoKTtcblxuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbnVsbDtcbiAgICBwYW5lbCA9IG51bGw7XG59XG4iXX0=