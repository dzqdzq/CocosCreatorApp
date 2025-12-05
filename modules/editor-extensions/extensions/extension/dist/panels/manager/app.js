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
exports.PanelApp = exports.updateExtensionOption = void 0;
const fs_1 = require("fs");
const path_1 = __importStar(require("path"));
const vue_js_1 = require("vue/dist/vue.js");
const semver_1 = __importDefault(require("semver"));
const lodash_1 = require("lodash");
const pkg_node_1 = __importDefault(require("./pkg-node"));
const detail_1 = __importDefault(require("./detail"));
const pkg_list_1 = __importDefault(require("./pkg-list"));
const pkg_search_list_1 = require("./pkg-search-list");
const components_1 = require("../components");
const sdk_1 = require("./sdk");
const store_1 = require("./store");
const event_bus_1 = require("./event-bus");
const utils_1 = require("../../public/utils");
const utils_dom_1 = require("../../public/utils-dom");
const import_1 = require("../../public/import");
const interface_1 = require("../../public/interface");
const profile_1 = require("../../shared/profile");
/** 是否在关闭页面的时候重新注册extension () */
exports.updateExtensionOption = {
    /** 是否在关闭页面的时候重新注册extension */
    isReRegister: false,
    /** extension的升级包的地址 */
    path: '',
};
const template = /* html */ `
    <div
        ref="containerEl"
        class="extension"
        @dragover="onAppDragover"
        @dragleave="onAppDragleave"
        @dragend="onAppDragend"
        @drop="onAppDrop"
    >
        <!-- <div class="extension-layout"> -->
        <div class="list-layout">
            <header class="header" v-show="!isShowSearching">
                <div class="entry-tabs">
                    <tab-dropdown
                        v-for="(tab, index) in tabs"
                        :key="tab.id"
                        :active-label="active"
                        :label="tab.label"
                        :children="tab.children"
                        @select="onTabSelect"
                    ></tab-dropdown>
                </div>
                <div class="feature">
                    <ui-button
                        class="transparent feature-col feature-btn"
                        tooltip="i18n:extension.manager.search_extensions"
                        @click="switchSearchStatus()"
                    >
                        <ui-icon value="search"></ui-icon>
                    </ui-button>

                    <CustomDropdown class="button-group feature-col" size="mini">
                        <ui-button
                            class="transparent feature-btn"
                            tooltip="i18n:extension.manager.import_extensions_zip"
                            @click.stop="install()"
                        >
                            <ui-icon value="import"></ui-icon>
                        </ui-button>

                        <template #overlay>
                            <CustomDropdownItem @click="installPkgFolder()">
                                {{ t('import_extensions_folder') }}
                            </CustomDropdownItem>

                            <CustomDropdownItem @click="installPkgDev()">
                                {{ t('import_extensions_dev') }}
                            </CustomDropdownItem>
                        </template>
                    </CustomDropdown>

                    <ui-button
                        class="transparent feature-col feature-btn"
                        tooltip="i18n:extension.manager.refresh_extensions"
                        @click.stop="refreshList()"
                    >
                        <ui-icon value="refresh"></ui-icon>
                    </ui-button>
                </div>
            </header>
            <header class="header" v-show="isShowSearching">
                <div class="search">
                    <ui-input
                        show-clear
                        ref="search"
                        placeholder="i18n:extension.manager.search"
                        @change="doSearch($event)"
                        @blur="onSearchBlur"
                        :value="searchKey"
                    >
                    </ui-input>
                    <ui-button
                        class="transparent"
                        tooltip="i18n:extension.manager.exit_search"
                        @click.stop="switchSearchStatus()"
                    >
                        <ui-label value="i18n:extension.manager.cancel"></ui-label>
                    </ui-button>
                </div>
            </header>
            <div
                v-show="!isShowSearching && active === item.label"
                v-for="item of flatTabs"
                :key="item.label"
                class="list"
            >
                <pkg-list
                    :ref="item.label"
                    :label="item.label"
                    :active="!isShowSearching && active === item.label"
                    @refresh="refreshList"
                    :page-size="pageSize"
                    :choosed="currentPackage ? currentPackage.name : ''"
                    @update-list="updateList"
                    @choose="choose"
                    @update-package="updatePackage"
                    @remove-package="removePackage"
                    @uninstall-package="uninstallPackage"
                    @set-enable="setEnable"
                >
                </pkg-list>
            </div>
            <div class="list" v-show="isShowSearching">
                <pkg-search-list
                    ref="search_list"
                    label="search_list"
                    :is-search="true"
                    :active="isShowSearching"
                    @refresh="refreshList"
                    :search-key="searchKey"
                    :page-size="pageSize"
                    :choosed="currentPackage ? currentPackage.name : ''"
                    @update-list="updateList"
                    @choose="choose"
                    @update-package="updatePackage"
                    @remove-package="removePackage"
                    @uninstall-package="uninstallPackage"
                    @set-enable="setEnable"
                >
                </pkg-search-list>
            </div>
        </div>
        <div class="detail-layout">
            <pkg-detail
                :detail="currentPackageDetail"
                :info="currentPackage"
                :loading="getDetailLoading"
                :error-message="detailErrorMessage"
                @refresh="refreshDetail"
            ></pkg-detail>
        </div>
        <!-- </div> -->
        <div class="import-loading-layout" v-if="importLoading">
            <ui-loading></ui-loading>
            <ui-label v-if="importErrorMessage" value="i18n:extension.manager.import_error_tip"> </ui-label>
            <div v-if="importErrorMessage">
                <ui-button class="transparent" @click="cancelRetryImport">
                    <ui-label value="i18n:extension.manager.cancel"></ui-label>
                </ui-button>
                <ui-button @click="retryImport">
                    <ui-label value="i18n:extension.manager.retry"></ui-label>
                </ui-button>
            </div>
        </div>

        <div v-show="zipDraggingOver" class="file-drop-layer">
            <div class="file-drop-layer__tip">
                <ui-icon value="extension"></ui-icon>
                <ui-label value="i18n:extension.manager.drop_to_import_tip" class=""></ui-label>
            </div>
        </div>
        <!-- <custom-dialog v-if="extensionDependencies" :info="extensionDependencies" @cancel="dialogCancel"
        @confirm="dialogConfirm"></custom-dialog> -->
    </div>
`;
exports.PanelApp = (0, vue_js_1.defineComponent)({
    name: 'ExtensionManager',
    components: {
        'pkg-node': pkg_node_1.default,
        'pkg-detail': detail_1.default,
        'pkg-list': pkg_list_1.default,
        PkgSearchList: pkg_search_list_1.PackageSearchList,
        'custom-dialog': components_1.CustomDialog,
        TabDropdown: components_1.TabDropdown,
        CustomDropdown: components_1.CustomDropdown,
        CustomDropdownItem: components_1.CustomDropdownItem,
    },
    setup(props, ctx) {
        const vm = (0, vue_js_1.getCurrentInstance)();
        const containerEl = (0, vue_js_1.ref)();
        const { extensionPaths, sdk } = (0, sdk_1.useInjectSdk)();
        const store = (0, store_1.useInjectStore)();
        const { 
        //
        draggingOver: zipDraggingOver, onAppDragend, onAppDragleave, onAppDragover, onAppDrop, } = useFileDrop(containerEl, (vm?.proxy).install);
        return {
            containerEl,
            extensionPaths,
            sdk,
            store,
            zipDraggingOver,
            onAppDragend,
            onAppDragleave,
            onAppDragover,
            onAppDrop,
        };
    },
    data() {
        return {
            /** 页签列表，暂时隐藏了已购买 */
            tabs: [
                {
                    label: interface_1.ExtensionManagerTab.Cocos,
                    id: 1,
                    children: [
                        {
                            label: interface_1.ExtensionManagerTab.Cocos,
                        },
                        {
                            label: interface_1.ExtensionManagerTab.BuiltIn,
                        },
                    ],
                },
                // {
                //     label: ExtensionManagerTab.Purchased,
                //     id: 2,
                // },
                {
                    label: interface_1.ExtensionManagerTab.Installed,
                    id: 3,
                },
            ],
            /** 扁平化后的页签，用于渲染实际页面 */
            flatTabs: [],
            /** 当前所显示的页签 */
            active: interface_1.ExtensionManagerTab.BuiltIn,
            /** 当前选中的插件 */
            currentPackage: null,
            /** 当前选中的插件的详情 */
            currentPackageDetail: null,
            /** 获取插件详情的报错 */
            detailErrorMessage: '',
            /** 是否处在搜索栏中 */
            isShowSearching: false,
            /** 搜索页面的所处列表页*/
            page: 1,
            /** 每次加载条数  目前由于内置插件和已安装插件需要事先扫描出全部，因此暂时不做分页处理*/
            pageSize: 99999,
            /** 源列表 */
            sourceList: [],
            /** 获取详情的Loading */
            getDetailLoading: false,
            /** 搜索关键字 */
            searchKey: '',
            /** 搜索时间戳。每次搜索操作的标记，用于实现 switch 效果 */
            searchTimestamp: -1,
            /** 搜索的节流 */
            searchThrottle: null,
            /** 已安装的列表, 专指installed页签下的列表，也就是非内置的插件 */
            installedList: [],
            /** Editor.Package.getPackages()扫描出来的所有插件 */
            allPackages: [],
            /** 插件依赖的弹窗队列 */
            extensionDependenciesList: [],
            /** 插件依赖的弹窗信息 */
            extensionDependencies: null,
            /** 导入插件时的报错信息 */
            importErrorMessage: '',
            /** 导入插件时的loading状态 */
            importLoading: false,
            /** 导入插件的路径缓存，用于后续的重试导入 */
            importPathCache: '',
        };
    },
    watch: {
        /** 当前的依赖插件的弹窗信息，用于触发弹窗队列 */
        extensionDependencies(value) {
            if (!value && this.extensionDependenciesList.length > 0) {
                this.extensionDependencies = this.extensionDependenciesList.shift();
            }
        },
    },
    created() {
        Editor.Package.__protected__.on('enable', this.toggleEnableHandle);
        Editor.Package.__protected__.on('disable', this.toggleEnableHandle);
        Editor.Message.__protected__.addBroadcastListener('i18n:change', this.onI18nChange);
    },
    mounted() {
        this.handleFlatTabs();
        this.init();
        // 支持在 panel 打开时指定搜索状态
        const startupParams = this.store.startupParams.value;
        if (typeof startupParams.search === 'string') {
            this.onSearchEvent(startupParams.search);
        }
        // FIXME: 不应将 vue 作为事件总线。后续考虑引入 rxjs 来处理
        this.$root.$on(event_bus_1.INTERNAL_EVENTS.search, this.onSearchEvent);
    },
    beforeDestroy() {
        Editor.Package.__protected__.removeListener('enable', this.toggleEnableHandle);
        Editor.Package.__protected__.removeListener('disable', this.toggleEnableHandle);
        this.$root.$off(event_bus_1.INTERNAL_EVENTS.search, this.onSearchEvent);
        Editor.Message.__protected__.removeBroadcastListener('i18n:change', this.onI18nChange);
    },
    methods: {
        /**
         * 翻译
         * @param {*} key
         */
        t(key, params) {
            Editor.I18n.getLanguage;
            return Editor.I18n.t(`extension.manager.${key}`, params);
        },
        curLanguage() {
            return Editor.I18n.getLanguage();
        },
        onI18nChange() {
            // this.refreshDetail();
            // refreshList 会自动选中列表第一项，不一定是用户期望的行为
            this.refreshList();
        },
        /** 初始化 */
        async init() {
            // this.sourceList = await SDK.getSourceList();
            this.installedList = await this.scanLocal();
            this.active = this.tabs[0].label;
            this.searchThrottle = (0, lodash_1.throttle)(this.handleSearch, 300, { leading: true, trailing: true });
        },
        /** 拍平嵌套结构的页签数组 */
        handleFlatTabs() {
            const children = new Map();
            const tabs = [];
            this.tabs.forEach((item) => {
                tabs.push({ label: item.label });
                if (item.children) {
                    item.children.forEach((v) => {
                        if (v.label !== item.label)
                            children.set(v.label, { label: v.label });
                    });
                }
            });
            children.forEach((v) => {
                if (!tabs.find((e) => e.label === v.label))
                    tabs.push({ label: v.label });
            });
            this.flatTabs = tabs;
        },
        /** 选中插件 */
        async choose(pkg) {
            // 传入空值时重置 current 数据
            if (pkg == null) {
                this.clearCurrentDetail();
                return;
            }
            if ((pkg && !this.currentPackage) ||
                !this.currentPackageDetail ||
                pkg.name !== this.currentPackage?.name ||
                pkg.version !== this.currentPackage.version ||
                pkg.version !== this.currentPackageDetail.version) {
                this.getPackageDetail(pkg);
            }
        },
        /** 清除当前的选中详情 */
        clearCurrentDetail() {
            this.currentPackage = null;
            this.currentPackageDetail = null;
            this.detailErrorMessage = '';
            this.getDetailLoading = false;
        },
        /** 获取插件详情 */
        getPackageDetail(item) {
            this.getDetailLoading = true;
            this.currentPackage = { ...item };
            this.currentPackageDetail = null;
            this.detailErrorMessage = '';
            const param = {
                name: item.name,
                version: item.version,
                // TODO: 语言变化后更新 detail 内容
                lang: this.curLanguage(),
            };
            return this.sdk
                .getExtensionDetail(param)
                .then((res) => {
                if (res && typeof res.name === 'string') {
                    if (this.currentPackage) {
                        this.currentPackageDetail = {
                            name: res.name,
                            version: res.version,
                            publish_at: res.publish_at,
                            version_limit: res.editor_limit,
                            detail: res.detail,
                            size: res.size,
                            icon_url: res.icon_url,
                        };
                        // this.currentPackage.version = res.version;
                    }
                }
                else if (item.path !== '') {
                    return this.sdk
                        .queryLocalExtensionDetail(item.path, this.curLanguage())
                        .then((detail) => {
                        if (detail && typeof detail.name === 'string') {
                            if (this.currentPackage) {
                                this.currentPackageDetail = {
                                    author: {
                                        id: utils_1.FAKE_AUTHOR_ID,
                                        name: detail.author,
                                    },
                                    name: detail.name,
                                    version: detail.version,
                                    publish_at: 0,
                                    version_limit: detail.editor_limit,
                                    detail: detail.detail,
                                    size: res.size,
                                    icon_url: res.icon_url,
                                };
                                this.currentPackage.version = detail.version;
                            }
                        }
                        else {
                            this.clearCurrentDetail();
                            this.detailErrorMessage = this.t('detail_error_tip');
                        }
                    })
                        .catch((err) => {
                        this.clearCurrentDetail();
                        this.detailErrorMessage = this.t('network_error_tip');
                        throw err;
                    });
                }
                else {
                    if (this.currentPackage) {
                        this.currentPackageDetail = {
                            name: item.name,
                            version: item.version,
                            publish_at: 0,
                            version_limit: '',
                            detail: '',
                            size: 0,
                            icon_url: item.icon_url,
                        };
                        this.currentPackage.version = item.version;
                    }
                }
            })
                .catch((err) => {
                this.detailErrorMessage = this.t('network_error_tip');
                throw err;
            })
                .finally(() => {
                this.getDetailLoading = false;
            });
        },
        /**
         * 启用/关闭插件
         * @param name 插件名
         * @param enable 设置插件的开启状态，true 开启，false 关闭
         * @param path 插件路径
         * @returns
         */
        async setEnable(name, enable, path) {
            try {
                if (enable) {
                    await Editor.Package.enable(path);
                }
                else {
                    await Editor.Package.disable(path, {});
                }
                // await Editor.Message.request('extension', 'enable', path, !enable);
                return true;
            }
            catch (err) {
                console.error(err);
                const tip = enable ? 'disable_error_tip' : 'enable_error_tip';
                Editor.Dialog.error(this.t(tip));
                return false;
            }
        },
        /** 由Editor.Package.on监听到切换成功后的回调 */
        toggleEnableHandle(item) {
            [...this.flatTabs, { label: interface_1.ExtensionManagerTab.Search }].forEach((tab) => {
                const e = this.$refs[tab.label];
                if (!e)
                    return;
                const el = e.length ? e[0] : e;
                el.toggleEnableHandle(item);
            });
            // FIXME: 关于这里对于 this.installedList 数据的更新， 目前它和 Installed list 页面的 list 数据是共享的，要注意。
            // 更新操作暂时交由 list 组件来完成更新，这里不再做冗余更新了。
        },
        /** 刷新当前详情 */
        refreshDetail() {
            if (this.currentPackage) {
                this.getPackageDetail(this.currentPackage);
            }
        },
        onTabSelect(tab) {
            this.active = tab;
        },
        /** 切换搜索状态 */
        switchSearchStatus(searching) {
            this.isShowSearching = typeof searching === 'boolean' ? searching : !this.isShowSearching;
            this.searchKey = '';
            if (this.isShowSearching) {
                this.clearCurrentDetail();
                this.$nextTick(() => {
                    this.$refs.search.focus();
                });
            }
            else {
                const e = this.$refs[interface_1.ExtensionManagerTab.Search];
                const el = e.length ? e[0] : e;
                el.reset();
            }
        },
        /** 将sdk扫描出的本地插件，与Editor.Package.getPackages()得到的插件进行过滤和处理 */
        formatInstalledExtension(item) {
            const pkg = this.allPackages.find((v) => v.name === item.name && this.checkPathType(v.path) === 'local');
            const isCocosSource = false;
            const extension = {
                name: item.name,
                version: item.version,
                icon_url: item.icon_url,
                description: item.description,
                enable: pkg ? pkg.enable : false,
                isInstalled: true,
                state: 'none',
                progress: 0,
                path: item.extension_path,
                isBuiltIn: false,
                isCocosSource,
            };
            if (pkg?.info.author) {
                extension.author = {
                    id: utils_1.FAKE_AUTHOR_ID,
                    name: pkg.info.author,
                };
            }
            try {
                const state = (0, fs_1.statSync)(item.extension_path);
                if (state && typeof state.mtimeMs === 'number') {
                    extension['mtime'] = state.mtimeMs;
                }
            }
            catch (err) { }
            return extension;
        },
        /** 处理网络请求中获取到的官方插件信息，同时官方插件有可能也是内置插件 */
        formatNetExtension(item) {
            const isCocosSource = true;
            // 先检测 label 是否有 builtin
            let isBuiltIn = item.label && item.label.length
                ? item.label.findIndex((v) => v === interface_1.ExtensionManagerTab.BuiltIn) > -1
                : false;
            let builtinPkg = undefined;
            let coverPkg = undefined;
            // 处于 enabled 状态的 cover 类型插件
            let coverPkgEnabled = undefined;
            let localPkg = undefined;
            // 插件的 path type 是 builtin 或 cover 的也算 builtin，这里把它们找出来。
            // 遍历一次，寻找需要的插件数据。只使用第一个找到的数据（只进行一次赋值
            for (const pkg of this.allPackages) {
                if (pkg.name !== item.name) {
                    continue;
                }
                const pathType = this.checkPathType(pkg.path);
                switch (pathType) {
                    case 'builtin': {
                        if (builtinPkg == null) {
                            builtinPkg = pkg;
                        }
                        break;
                    }
                    case 'cover': {
                        if (coverPkg == null) {
                            coverPkg = pkg;
                        }
                        if (pkg.enable && coverPkgEnabled == null) {
                            coverPkgEnabled = pkg;
                        }
                        break;
                    }
                    case 'local': {
                        if (localPkg == null) {
                            localPkg = pkg;
                        }
                        break;
                    }
                    default:
                        break;
                }
                // 全都找到数据，停止查找
                if (builtinPkg != null && coverPkg != null && localPkg != null && coverPkgEnabled != null) {
                    break;
                }
            }
            isBuiltIn = isBuiltIn || builtinPkg != null || coverPkg != null;
            const pkg = isBuiltIn ? builtinPkg : localPkg;
            const extensionItem = {
                name: item.name,
                version: pkg ? pkg.version : item.latest_version,
                icon_url: item.icon_url,
                description: item.description,
                enable: pkg?.enable ?? false,
                isInstalled: pkg ? true : false,
                latest_version: item.latest_version,
                latest_description: item.latest_description,
                update_at: item.update_at,
                state: 'none',
                progress: 0,
                path: pkg ? pkg.path : '',
                isBuiltIn,
                isCocosSource,
            };
            if (extensionItem.isBuiltIn) {
                extensionItem.builtInPath = extensionItem.path;
                extensionItem.builtInVersion = extensionItem.version;
                if (coverPkgEnabled != null) {
                    // 已启用的全局覆盖安装内置插件
                    extensionItem.version = coverPkgEnabled.version;
                    extensionItem.path = coverPkgEnabled.path;
                    extensionItem.enable = coverPkgEnabled.enable;
                }
                else if (coverPkg != null && extensionItem.enable !== true) {
                    // 编辑器内置版本未启用，且存在全局覆盖安装的内置插件（不一定启用），覆盖数据
                    extensionItem.version = coverPkg.version;
                    extensionItem.path = coverPkg.path;
                    extensionItem.enable = coverPkg.enable;
                }
            }
            return extensionItem;
        },
        /** 获取网络上的内置插件列表后，与本地内置插件列表进行合并 */
        mergeBuiltInExtension(list) {
            const extensions = list.map((v) => this.formatNetExtension(v));
            const builtInList = this.allPackages.filter((item) => {
                return !extensions.find((v) => v.name === item.name) && this.checkPathType(item.path) === 'builtin';
            });
            // 注意这里找的是网络列表中找不到匹配 name 的本地覆盖插件
            const multipleVersions = this.allPackages.filter((item) => {
                return !extensions.find((v) => v.name === item.name) && this.checkPathType(item.path) === 'cover';
            });
            builtInList.forEach((item) => {
                extensions.push({
                    name: item.name,
                    version: item.version,
                    icon_url: '',
                    description: item.info.description ?? '',
                    enable: item.enable,
                    isInstalled: true,
                    state: 'none',
                    progress: 0,
                    path: item.path,
                    isBuiltIn: true,
                    isCocosSource: true,
                });
            });
            multipleVersions.forEach((item) => {
                const index = extensions.findIndex((v) => v.name === item.name);
                if (index < 0) {
                    extensions.push({
                        name: item.name,
                        version: item.version,
                        icon_url: '',
                        description: item.info.description ?? '',
                        enable: item.enable,
                        isInstalled: true,
                        state: 'none',
                        progress: 0,
                        path: item.path,
                        isBuiltIn: true,
                        isCocosSource: false,
                    });
                }
                else if (item.enable === true) {
                    // cover 插件需要处于启用状态，才会将数据 merge 进来
                    extensions[index].builtInPath = extensions[index].path;
                    extensions[index].builtInVersion = extensions[index].version;
                    extensions[index].version = item.version;
                    extensions[index].path = item.path;
                    extensions[index].enable = item.enable;
                }
            });
            return extensions;
        },
        /** 搜索栏触发回调 */
        doSearch(event) {
            // @ts-ignore
            const searchKey = event?.target?.value ?? '';
            if (searchKey === this.searchKey)
                return;
            this.searchThrottle && this.searchThrottle(searchKey);
        },
        onSearchBlur(e) {
            // FIXME: 临时处理方案，输入框失去焦点时，如果没有搜索名称，自动结束搜索状态。
            // 后续完善搜索功能后就不需要这个处理了。没有搜索名称时应显示所有数据
            if (this.searchKey === '') {
                this.switchSearchStatus(false);
            }
        },
        /** 发起搜索 */
        handleSearch(searchKey) {
            const e = this.$refs[interface_1.ExtensionManagerTab.Search];
            const el = e.length ? e[0] : e;
            el.reset();
            this.clearCurrentDetail();
            this.searchKey = searchKey;
            if (searchKey) {
                this.page = 1;
                this.updateSearchExtensions(this.searchKey, this.page, this.pageSize);
            }
        },
        onSearchEvent(name) {
            if (name === false) {
                this.switchSearchStatus(false);
                return;
            }
            else if (name === true || typeof name === 'string') {
                this.switchSearchStatus(true);
                this.handleSearch(name === true ? '' : name);
            }
        },
        async updateSearchExtensions(query, page, pageSize) {
            const timestamp = Date.now();
            this.searchTimestamp = timestamp;
            const queryRE = new RegExp((0, lodash_1.escapeRegExp)(query));
            const el = this.$refs[interface_1.ExtensionManagerTab.Search];
            const param = {
                e: Editor.App.version,
                q: query,
                lang: this.curLanguage(),
                page,
                pageSize,
                label: [
                    // 搜索需要手动带上标签，避免在所有标签中搜索（否则有些隐藏的插件也会一起被搜索出来）
                    interface_1.ExtensionManagerTab.Cocos,
                    interface_1.ExtensionManagerTab.BuiltIn,
                ].join(','),
            };
            el.loading = true;
            let searchResult = [];
            try {
                searchResult = await Promise.all([
                    ...[
                        //
                        interface_1.ExtensionManagerTab.BuiltIn,
                        interface_1.ExtensionManagerTab.Cocos,
                    ].map(async (label) => {
                        try {
                            const res = await this.sdk.getExtensionList({
                                ...param,
                                label: label,
                            });
                            // 本次搜索过期后，后续的处理也不需要了，直接通过抛出 error 返回空数据就行
                            if (this.searchTimestamp !== timestamp) {
                                throw new utils_1.CancelError('timestamp cancel');
                            }
                            const formattedList = label === interface_1.ExtensionManagerTab.BuiltIn
                                ? this.mergeBuiltInExtension(res.packages).filter((pkg) => queryRE.test(pkg.name))
                                : res.packages.map(this.formatNetExtension);
                            return {
                                key: label,
                                label: label,
                                list: formattedList,
                                total: res.count,
                            };
                        }
                        catch (err) {
                            // cancel 时抛出
                            if (utils_1.CancelError.isCancel(err)) {
                                throw err;
                            }
                            console.error(err);
                            return {
                                key: label,
                                label: label,
                                list: [],
                                total: 0,
                            };
                        }
                    }),
                ]);
            }
            catch (error) {
                // cancel 时不再执行后续逻辑
                if (utils_1.CancelError.isCancel(error)) {
                    return;
                }
                console.error(error);
            }
            finally {
            }
            // 下面都是同步方法，不需要再判断 timestamp 了
            try {
                const filteredInstalled = this.installedList.filter((pkg) => queryRE.test(pkg.name));
                searchResult.push({
                    key: interface_1.ExtensionManagerTab.Installed,
                    label: interface_1.ExtensionManagerTab.Installed,
                    list: filteredInstalled,
                    total: filteredInstalled.length,
                });
                el.batchUpdateList(searchResult.reduce((prev, curr) => {
                    prev[curr.key] = curr;
                    return prev;
                }, {}));
            }
            finally {
                el.loading = false;
            }
        },
        /** 更新插件数组 */
        async updateList(label, page, page_size) {
            const tab = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : label;
            if (tab === interface_1.ExtensionManagerTab.Installed) {
                this.updateLocationExtensions();
            }
            else if (tab === interface_1.ExtensionManagerTab.Search) {
                await this.refreshAllPackages();
                await this.updateSearchExtensions(this.searchKey, 1, this.pageSize);
            }
            else {
                await this.refreshAllPackages();
                this.updateExtensions(label, this.searchKey, page, page_size);
            }
        },
        /** 刷新按钮的触发，刷新当前激活的面板下的内容。 installed为扫描本地插件，其他则为请求网络插件*/
        // FIXME: 是否应该始终刷新每个可选 tab panel 内的内容？否则用户只能一个个面板去刷新。
        async refreshList() {
            const activeTab = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : this.active;
            const e = this.$refs[activeTab];
            if (!e)
                return;
            function rescan(type) {
                return Editor.Message.request('extension', 'scanning', type);
            }
            // 3.6.x 版本的 “扫描插件” 按钮点击时，会去主进程手动更新插件注册信息。
            // 这里全部更新，而不再根据当前 tab 区分
            await rescan('global');
            await rescan('project');
            const el = e.length ? e[0] : e;
            if (activeTab === interface_1.ExtensionManagerTab.Installed) {
                await this.updateLocationExtensions();
            }
            else if (activeTab === interface_1.ExtensionManagerTab.Search) {
                el.reset();
                await this.refreshAllPackages();
                await this.updateSearchExtensions(this.searchKey, 1, this.pageSize);
            }
            else {
                el.reset();
                await this.refreshAllPackages();
                await this.updateExtensions(activeTab, this.searchKey, 1, this.pageSize);
            }
        },
        /**
         * 更新非本地插件列表
         */
        async updateExtensions(label, query, page, pageSize) {
            const tab = label;
            const e = this.$refs[tab];
            // search 面板单独定制逻辑
            if (!e || tab === interface_1.ExtensionManagerTab.Search) {
                return;
            }
            const el = e.length ? e[0] : e;
            el.loading = true;
            if (page === 1) {
                this.clearCurrentDetail();
            }
            // const sourceId = 1;// 这里应该去tabs里过滤
            const param = {
                e: Editor.App.version,
                q: query,
                lang: this.curLanguage(),
                page,
                pageSize,
                label: '',
            };
            switch (label) {
                // 这里排除掉不需要带 label 的情况，其它的都带上 tab label
                case interface_1.ExtensionManagerTab.Installed:
                case interface_1.ExtensionManagerTab.Purchased:
                case interface_1.ExtensionManagerTab.Search:
                    break;
                default:
                    param.label = label;
                    break;
            }
            return this.sdk
                .getExtensionList(param)
                .then((res) => {
                const extensionList = label === interface_1.ExtensionManagerTab.BuiltIn
                    ? this.mergeBuiltInExtension(res.packages)
                    : res.packages.map((item) => this.formatNetExtension(item));
                el.updateList(extensionList, res.count);
            })
                .catch((error) => {
                this.clearCurrentDetail();
                if (this.isShowSearching ||
                    label === interface_1.ExtensionManagerTab.Purchased ||
                    label === interface_1.ExtensionManagerTab.Cocos) {
                    el.setError(this.t('network_error_tip'));
                }
                else {
                    el.setError(this.t('local_error_tip'));
                }
                throw error;
            })
                .finally(() => {
                el.loading = false;
            });
        },
        /** 更新已安装插件列表 */
        async updateLocationExtensions() {
            const e = this.$refs[interface_1.ExtensionManagerTab.Installed];
            if (!e)
                return;
            const el = e.length ? e[0] : e;
            el.reset();
            el.loading = true;
            // FIXME：副作用。清空插件详情页内容。后续看是否需要，或者另外寻找一个处理方式
            this.clearCurrentDetail();
            const list = await this.scanLocal();
            // FIXME: 注意 installed 列表这里，两个数组对象是共享的，对数组、数组内对象的改动会对两边同时产生影响
            this.installedList = list;
            el.updateList(list, list.length);
            this.handleListUpdate(list, interface_1.ExtensionManagerTab.Installed);
            el.loading = false;
        },
        /**
         * 在某个列表的数据更新后，同步给其他列表
         * @param list
         * @param label
         */
        handleListUpdate(list, label) {
            [...this.flatTabs, { label: interface_1.ExtensionManagerTab.Search }]
                .filter((v) => v.label !== label)
                .forEach((tab) => {
                const e = this.$refs[tab.label];
                if (!e)
                    return;
                const el = e.length ? e[0] : e;
                el.handleListUpdate(list);
            });
        },
        async refreshAllPackages() {
            this.allPackages = Editor.Package.getPackages();
        },
        /**
         * 扫描并处理本地目录下的插件（含项目的extensions目录下，及）
         */
        async scanLocal() {
            const installedList = await this.sdk.scanLocalExtensions();
            // FIXME: Editor.Package.getPackages 存在调用时序问题，有时需要等待它内部数据更新。
            // 具体需要等待多久，暂时不清楚
            await (0, utils_1.sleep)(100);
            await this.refreshAllPackages();
            const list = [];
            installedList.forEach((item) => {
                if (this.allPackages.filter((v) => v.name === item.name &&
                    typeof v.path === 'string' &&
                    this.checkPathType(v.path) === 'local').length > 0) {
                    list.push(this.formatInstalledExtension(item));
                }
            });
            list.sort((a, b) => {
                return (typeof b.mtime === 'number' ? b.mtime : 0) - (typeof a.mtime === 'number' ? a.mtime : 0);
            });
            return list;
        },
        /**
         * 检查插件的类别
         * @param path 要检测的插件安装路径
         * @returns 插件类别
         */
        checkPathType(path) {
            return Editor.Package.__protected__.checkType(path);
        },
        /** 更新/安装插件 */
        updatePackage(name, version, info) {
            if (info.isInstalled && semver_1.default.eq(version, info.version))
                return;
            if (info.isBuiltIn && typeof info.builtInVersion === 'string' && semver_1.default.eq(version, info.builtInVersion)) {
                this.resetBuiltInVersion(info);
            }
            else {
                this.download(name, version, info);
            }
        },
        // 往已安装列表中插入
        addInstalledPackage(item) {
            const e = this.$refs[interface_1.ExtensionManagerTab.Installed];
            if (!e)
                return;
            const el = e.length ? e[0] : e;
            el.addPackage(item);
        },
        /** 当选择的版本为内置版本时，则视为重置到内置版本 */
        async resetBuiltInVersion(item) {
            if (!item || !item.builtInPath || !item.builtInVersion)
                return;
            const tryUninstall = async () => {
                // 卸载全局目录下的插件，使得可以对所有项目生效
                try {
                    await this.sdk.uninstall(item.name, this.extensionPaths.global);
                }
                catch (error) {
                    // 卸载失败，不影响后续逻辑执行
                    console.error(error);
                }
            };
            if ((0, utils_1.matchInternalName)(item.name)) {
                const result = await Editor.Dialog.warn(this.t('update_extension_tip'), {
                    buttons: [this.t('confirm'), this.t('cancel')],
                    default: 0,
                    cancel: 1,
                    title: Editor.I18n.t('assets.operate.dialogQuestion'),
                });
                if (result.response === 0) {
                    Editor.Message.send('extension', 'self-update', {
                        currentPath: item.path,
                        newInstallPath: item.builtInPath,
                        builtInPath: item.builtInPath,
                    });
                    return;
                }
                else {
                    exports.updateExtensionOption.isReRegister = true;
                    exports.updateExtensionOption.path = item.builtInPath;
                    this.updateDownloadStatus(item.name, null, 
                    // FIXME: 同下方 download.perInstalled 钩子中的处理
                    { version: item.version, path: item.path }, null);
                }
            }
            else {
                await this.setEnable(item.name, false, item.path);
                await Editor.Package.unregister(item.path);
                await tryUninstall();
                await this.setEnable(item.name, true, item.builtInPath);
                this.updateDownloadStatus(item.name, null, { version: item.builtInVersion, path: item.builtInPath }, null);
                item.path = item.builtInPath;
                item.version = item.builtInVersion;
                this.choose(item);
            }
            this.installedList = await this.scanLocal();
        },
        /** 下载插件 */
        download(name, version, item) {
            const extensionPaths = this.extensionPaths;
            const installPath = item.isBuiltIn ? extensionPaths.global : extensionPaths.project;
            const handle = this.sdk.getDownloader({ name, version, installPath }, {
                downloadProgress: (progress) => {
                    progress = Math.floor(100 * progress);
                    this.updateDownloadStatus(name, null, null, progress);
                },
                perDownloaded: async (info) => {
                    if (item.isBuiltIn) {
                        // 对于扩展管理器例外，它的更新不能做到即时禁用、反注册
                        if (!(0, utils_1.matchInternalName)(item.name)) {
                            await this.setEnable(item.name, false, item.path);
                            if (item.path !== item.builtInPath) {
                                // 非 builtin 时反注册
                                await Editor.Package.unregister(item.path);
                            }
                        }
                        else {
                            // 反注册全局 builtin 目录下已安装的插件（未启用，因此不会走上面的判断逻辑）
                            const dist = info.installPkgPath ?? path_1.default.resolve(info.installPath, info.name);
                            if ((0, fs_1.existsSync)(dist) && this.allPackages.find((pkg) => pkg.path === dist)) {
                                await this.setEnable(item.name, false, dist);
                                await Editor.Package.unregister(dist);
                            }
                        }
                    }
                    else if (item.isInstalled && item.path !== '') {
                        await this.setEnable(item.name, false, item.path);
                        await Editor.Package.unregister(item.path);
                    }
                },
                perInstalled: async (info) => {
                    const pkg = {
                        ...item,
                    };
                    // 延迟500毫秒，因为设计希望在下载完成后能至少停留在100%状态一段时间
                    try {
                        if (typeof info.tempPath !== 'string' || info.tempPath === '') {
                            throw new Error(`invalid info.tempPath: "${info.tempPath}"`);
                        }
                        if ((0, utils_1.matchInternalName)(name)) {
                            const result = await Editor.Dialog.warn(this.t('update_extension_tip'), {
                                buttons: [this.t('confirm'), this.t('cancel')],
                                default: 0,
                                cancel: 1,
                                title: Editor.I18n.t('assets.operate.dialogQuestion'),
                            });
                            if (result.response === 0) {
                                Editor.Message.send('extension', 'self-update', {
                                    currentPath: item.path,
                                    newInstallPath: info.tempPath,
                                    builtInPath: item.builtInPath,
                                });
                                return;
                            }
                            else {
                                exports.updateExtensionOption.isReRegister = true;
                                exports.updateExtensionOption.path = info.tempPath;
                                // 选择下次启动时更新候，结束下载状态
                                this.updateDownloadStatus(name, null, 
                                // 这里使用的是当前的版本和路径，相当于没有更新
                                // FIXME: 需要一个更合理的状态更新机制
                                { version: item.version, path: item.path }, null);
                            }
                        }
                        else {
                            if (!item.isBuiltIn && item.isCocosSource && !item.path) {
                                pkg.isInstalled = true;
                                pkg.enable = true;
                            }
                            await Editor.Package.register(info.tempPath);
                            await this.setEnable(name, true, info.tempPath);
                            pkg.version = version;
                            pkg.path = info.tempPath;
                            this.updateDownloadStatus(name, null, { version, path: info.tempPath }, null);
                        }
                        this.choose(pkg);
                        this.updateLocationExtensions();
                    }
                    catch (err) {
                        console.error(err);
                        this.updateDownloadStatus(name, this.t('install_error_tip'), null, null);
                        Editor.Dialog.error(this.t('install_error_tip'));
                    }
                },
                downloaded: async (info) => {
                    const option = {
                        name,
                        dependencies: [],
                    };
                    info.forEach((v) => {
                        option.dependencies.push({
                            name: v.name,
                            desc: '',
                            checked: false,
                            disable: false,
                            version: v.version,
                        });
                    });
                    this.openDialog(option);
                },
            });
            return handle.download().catch((err) => {
                Editor.Dialog.error(this.t('install_error_tip'));
                this.updateDownloadStatus(name, this.t('install_error_tip'), null, null);
                throw err;
            });
        },
        /** 将插件的下载状态同步到所有列表 */
        updateDownloadStatus(name, error, success, progress) {
            [...this.flatTabs, { label: interface_1.ExtensionManagerTab.Search }].forEach((tab) => {
                const e = this.$refs[tab.label];
                if (!e)
                    return;
                const el = e.length ? e[0] : e;
                el.updateDownloadStatus(name, error, success, progress);
            });
        },
        /** 将插件的卸载状态同步到所有列表 */
        updateUninstallStatus(item, error, success, progress) {
            [...this.flatTabs, { label: interface_1.ExtensionManagerTab.Search }].forEach((tab) => {
                const e = this.$refs[tab.label];
                if (!e)
                    return;
                const el = e.length ? e[0] : e;
                if (success) {
                    // FIXME: 只查找 builtin & cover，是否应该区分显示？
                    const builtIn = this.allPackages.find((v) => {
                        const pathType = this.checkPathType(v.path);
                        return v.name === item.name && (pathType === 'builtin' || pathType === 'cover');
                    });
                    switch (tab.label) {
                        case interface_1.ExtensionManagerTab.Cocos:
                            {
                                if (item.isBuiltIn && builtIn) {
                                    el.updateUninstallStatus(item.name, null, { path: builtIn?.path, version: builtIn.version }, null);
                                }
                                else {
                                    el.updateUninstallStatus(item.name, null, (localItem) => {
                                        // 触发卸载操作的是否是当前列表中的插件
                                        const isUninstalled = item.path === localItem.path;
                                        return {
                                            path: isUninstalled ? '' : localItem.path,
                                            // 这里要用列表组件本地的数据，而不是触发卸载操作那个列表的数据
                                            version: isUninstalled && (0, utils_1.isOnlineExtension)(localItem)
                                                ? localItem.latest_version
                                                : localItem.version,
                                        };
                                    }, null);
                                }
                            }
                            break;
                        case interface_1.ExtensionManagerTab.BuiltIn:
                            {
                                el.updateUninstallStatus(item.name, null, (localItem) => {
                                    const isUninstalled = item.path === localItem.path;
                                    let nextPath = localItem.path;
                                    let nextVersion = localItem.version;
                                    if (isUninstalled) {
                                        // 卸载的是内置列表里当前的显示项
                                        nextPath = builtIn?.path ?? '';
                                        nextVersion = builtIn?.version ?? '';
                                    }
                                    return {
                                        path: nextPath,
                                        version: nextVersion,
                                    };
                                }, null);
                            }
                            break;
                        case interface_1.ExtensionManagerTab.Search:
                            {
                                if (item.isCocosSource) {
                                    el.updateUninstallStatus(item.name, null, (localItem) => {
                                        // TODO: 因为目前搜索仅处理服务端返回的数据，因此卸载后的状态更新也只需要简单判断
                                        return {
                                            path: '',
                                            // search 列表的数据在离开后会清空，因此暂时不会有在别的 tab 下更新 search 数据的问题，
                                            // 即此处 localItem === item。为了与上面一致，依旧使用 localItem
                                            version: (0, utils_1.isOnlineExtension)(localItem)
                                                ? localItem.latest_version
                                                : localItem.version,
                                        };
                                    }, null);
                                }
                                else {
                                    el.remove(item.name);
                                }
                            }
                            break;
                        case interface_1.ExtensionManagerTab.Installed:
                            {
                                el.remove(item.name);
                            }
                            break;
                    }
                }
                else if (error) {
                    el.updateUninstallStatus(item.name, error, success, progress);
                    Editor.Dialog.error(error);
                }
                else {
                    el.updateDownloadStatus(item.name, error, success, progress);
                }
            });
        },
        /** 切换插件的卸载loading */
        updateUninstallLoading(name, isLoading) {
            [...this.flatTabs, { label: interface_1.ExtensionManagerTab.Search }].forEach((tab) => {
                const e = this.$refs[tab.label];
                if (!e)
                    return;
                const el = e.length ? e[0] : e;
                el.updateUninstallLoading(name, isLoading);
            });
        },
        /** 卸载插件 */
        async uninstallPackage(name, item, label) {
            const e = this.$refs[label];
            if (!e)
                return;
            const el = e.length ? e[0] : e;
            // 删除前询问
            if (item.enable && label !== interface_1.ExtensionManagerTab.BuiltIn) {
                const result = await Editor.Dialog.warn(this.t('close_extensions_tip'), {
                    buttons: [this.t('confirm'), this.t('cancel')],
                    default: 0,
                    cancel: 1,
                    title: Editor.I18n.t('assets.operate.dialogQuestion'),
                });
                if (result.response === 1) {
                    el.updateUninstallStatus(name, null, { path: item.path, version: item.version }, null);
                    return;
                }
                else {
                    await this.setEnable(name, !item.enable, item.path);
                }
            }
            // FIXME: 卸载插件时先清空详情页内容。主要是为了和安装插件时的行为前后呼应。后续看看是否需要保留
            this.clearCurrentDetail();
            this.updateUninstallLoading(name, true);
            await Editor.Package.unregister(item.path);
            // 创建 sdk 时的参数中只传入了项目路径，因此这里只会卸载项目路径下的插件
            return this.sdk
                .uninstall(name, {
                uninstallProgress: (progress) => {
                    progress = Math.floor(100 * progress);
                    el.updateUninstallStatus(name, null, null, progress);
                },
                uninstalled: async () => {
                    if ((0, utils_1.matchInternalName)(name) &&
                        typeof item.builtInPath === 'string' &&
                        item.builtInPath !== '') {
                        await this.setEnable(name, true, item.builtInPath);
                    }
                    this.updateUninstallStatus(item, null, { path: '', version: '' }, null);
                    this.installedList = await this.scanLocal();
                },
            })
                .catch((err) => {
                Editor.Dialog.error(this.t('uninstall_error_tip'));
                el.updateUninstallStatus(name, this.t('uninstall_error_tip'), null, null);
                throw err;
            });
        },
        /** 移除未安装的插件 */
        removePackage(name) {
            const tab = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : this.active;
            const e = this.$refs[tab];
            if (!e)
                return;
            const el = e.length ? e[0] : e;
            return this.sdk
                .uninstall(name, {
                uninstalled: async () => {
                    el.remove(name);
                },
            })
                .catch((err) => {
                Editor.Dialog.error(this.t('remove_error_tip'));
                throw err;
            });
        },
        /** 打开弹窗，已做队列处理。 但是目前弹窗功能先隐藏 */
        openDialog(info) {
            // if (this.extensionDependencies) {
            //     this.extensionDependenciesList.push(info)
            // } else {
            //     this.extensionDependencies = info
            // }
            if (info.dependencies.length < 1) {
                return;
            }
            let message = '';
            info.dependencies.forEach((item, index) => {
                index > 0 ? (message += `、${item.name}@${item.version}`) : (message += item.name);
            });
            Editor.Task.addNotice({
                title: `${info.name} ${this.t('install_dependence_tip')}`,
                message: message,
                type: 'warn',
                source: 'extension',
                timeout: 5000,
            });
        },
        /** 弹窗的取消按钮 */
        dialogCancel() {
            this.extensionDependencies = null;
        },
        /** 弹窗的确认按钮 */
        dialogConfirm(info) {
            if (info.callback)
                info.callback();
            this.extensionDependencies = null;
        },
        /** 重试导入 */
        retryImport() {
            this.importErrorMessage = '';
            this.install(this.importPathCache);
        },
        /** 取消重试导入，直接结束 */
        cancelRetryImport() {
            this.importErrorMessage = '';
            this.importPathCache = '';
            this.importLoading = false;
        },
        onPopupImportMore() {
            Editor.Menu.popup({
                menu: [
                    {
                        label: this.t('import_extensions_folder'),
                        click: () => {
                            this.installPkgFolder();
                        },
                    },
                    {
                        label: this.t('import_extensions_dev'),
                        click: () => {
                            this.installPkgDev();
                        },
                    },
                ],
            });
        },
        async selectDirectoryFromDialog(optionis = {}) {
            const lastFolderPath = await profile_1.LastImportFolderPath.tryGet();
            const result = await Editor.Dialog.select({
                title: Editor.I18n.t('extension.menu.selectDirectory'),
                type: 'directory',
                multi: false,
                path: lastFolderPath ?? undefined,
                ...optionis,
            });
            if (!Array.isArray(result.filePaths) || result.filePaths.length < 1) {
                return '';
            }
            const selectedPath = result.filePaths[0];
            const folderDir = path_1.default.dirname(selectedPath);
            // 把本次选中文件夹的父级文件夹路径存到 profile 中
            if (folderDir !== lastFolderPath) {
                await profile_1.LastImportFolderPath.trySet(folderDir);
            }
            return selectedPath;
        },
        /**
         * 导入一个插件压缩包
         */
        async install(filePath = '') {
            const type = 'project';
            if (!filePath) {
                const lastFolderPath = await profile_1.LastImportFolderPath.tryGet();
                const result = await Editor.Dialog.select({
                    title: Editor.I18n.t('extension.menu.selectZip'),
                    filters: [{ name: 'ZIP', extensions: ['zip'] }],
                    path: lastFolderPath ?? undefined,
                });
                if (!result || !result.filePaths[0]) {
                    return;
                }
                filePath = result.filePaths[0];
                const fileDir = path_1.default.dirname(filePath);
                await profile_1.LastImportFolderPath.trySet(fileDir);
            }
            const packageName = (0, path_1.basename)(filePath, '.zip');
            try {
                await this.installPkgTemplate({
                    selectedPath: filePath,
                    importHandler: async () => {
                        return (0, import_1.importPackage)(type, filePath, { extensionDisplayName: packageName });
                    },
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    const message = error.message;
                    switch (message) {
                        case import_1.ImportPackageErrorMessage.decompressFail:
                            (0, utils_1.handleDecompressFail)(filePath, packageName, true);
                            break;
                        default:
                            throw error;
                    }
                    return;
                }
                throw error;
            }
        },
        /**
         * 处理安装逻辑的模板方法。
         * 后续需求变更时可以增加更多参数，或者将整个模板方法拆散成多个小函数，让各个调用入口自己去组合调用
         * @private
         */
        async installPkgTemplate(options) {
            this.importLoading = true;
            // 每次导入开始时重置上一次导入的错误信息
            this.importErrorMessage = '';
            const { selectedPath } = options;
            try {
                const path = await options.importHandler();
                if (!path) {
                    throw new Error(`invalid imported package path: "${path}"`);
                }
                this.importLoading = false;
                this.importPathCache = '';
                this.active = interface_1.ExtensionManagerTab.Installed;
                this.installedList = await this.scanLocal();
                const item = this.installedList.find((v) => v.path === path);
                if (!item) {
                    throw new Error('unexpted package import: cannot find in installed list');
                }
                await this.setEnable(item.name, true, path);
                this.refreshList();
                this.choose(item);
            }
            catch (error) {
                this.importLoading = false;
                this.importErrorMessage = this.t('import_error_tip');
                this.importPathCache = selectedPath;
                if (error instanceof Error) {
                    const message = error.message;
                    switch (message) {
                        case import_1.ImportPackageErrorMessage.cancel:
                            this.cancelRetryImport();
                            (0, utils_1.handleCancelImport)();
                            break;
                        case import_1.ImportPackageErrorMessage.invalidPath:
                            (0, utils_1.handleInvalidPath)(selectedPath);
                            break;
                        case import_1.ImportPackageErrorMessage.cannotFindPackageJson: {
                            const folderPath = error.path;
                            Editor.Task.addNotice({
                                title: Editor.I18n.t('extension.menu.importError'),
                                message: Editor.I18n.t('extension.menu.cannotFindPackageJson', { path: folderPath }),
                                type: 'error',
                                source: 'extension',
                                timeout: 10000,
                            });
                            break;
                        }
                        // 抛出让外层处理
                        case import_1.ImportPackageErrorMessage.decompressFail:
                            throw error;
                        default:
                            console.error(error);
                            (0, utils_1.handleUnexpectedImportError)(error);
                            break;
                    }
                    return;
                }
                throw error;
            }
        },
        async installPkgFolder(folderPath = '') {
            const type = 'project';
            if (!folderPath) {
                folderPath = await this.selectDirectoryFromDialog();
                if (folderPath === '') {
                    return;
                }
            }
            await this.installPkgTemplate({
                selectedPath: folderPath,
                importHandler: async () => {
                    const dist = await (0, import_1.importPackageFolder)(type, folderPath);
                    return dist;
                },
            });
        },
        async installPkgDev(folderPath = '') {
            const type = 'project';
            if (!folderPath) {
                folderPath = await this.selectDirectoryFromDialog();
                if (folderPath === '') {
                    return '';
                }
            }
            await this.installPkgTemplate({
                importHandler: async () => {
                    return (0, import_1.importPackageSymlink)(type, folderPath);
                },
                selectedPath: folderPath,
            });
        },
    },
    template: template,
});
function useFileDrop(container, onInstall) {
    // app 根元素上的文件拖放处理
    const draggingOver = (0, vue_js_1.ref)(false);
    // mimeType 区分平台，有多种取值，处理起来比较麻烦。如果要支持文件夹，逻辑会更复杂
    // see: https://stackoverflow.com/questions/4411757/zip-mime-types-when-to-pick-which-one
    // test `/zip`, `x-zip`
    const zipMimeTypeRE = /(\/|x-)zip/;
    function onAppDragenter(e) {
        draggingOver.value = false;
    }
    function onAppDragleave(e) {
        const inContainer = container.value && (0, utils_dom_1.containsEventTarget)(container.value, e);
        const willLeave = e.relatedTarget == null;
        if (inContainer && willLeave) {
            // console.debug('drag leave', [e.target, e.relatedTarget, inContainer, willLeave]);
            draggingOver.value = false;
        }
    }
    function onAppDragend(e) {
        draggingOver.value = false;
    }
    function onAppDragover(e) {
        if (!e.dataTransfer)
            return;
        draggingOver.value = true;
        e.preventDefault();
        const items = Array.from(e.dataTransfer.items ?? []);
        const filesOnDragging = items.filter((item) => {
            if (item.kind !== 'file') {
                return false;
            }
            // 此时调用 getAsFile 无法获得数据，只能校验 `item.type`(mimeType)。
            // windows 上拖拽文件夹时 item.type === ''，需要注意
            // return zipMimeTypeRE.test(item.type);
            // 不校验 type，在 drop 事件时校验文件后缀。
            return true;
        });
        if (filesOnDragging.length > 0) {
            e.dataTransfer.dropEffect = 'copy';
        }
        else {
            e.dataTransfer.dropEffect = 'none';
        }
    }
    function onAppDrop(e) {
        draggingOver.value = false;
        const items = Array.from(e.dataTransfer?.items ?? []);
        if (!e.dataTransfer || items.length < 1) {
            return;
        }
        // TODO: 支持批量导入？
        const file = items[0];
        if (file.kind !== 'file') {
            return;
        }
        const blob = file.getAsFile();
        if (blob == null || !blob.path.endsWith('.zip')) {
            Editor.Dialog.info(Editor.I18n.t(`extension.manager.drop_to_import_requires_zip`), {
                title: Editor.I18n.t(`extension.title`),
                buttons: [Editor.I18n.t(`extension.manager.confirm`)],
            });
            return;
        }
        if (!(0, fs_1.existsSync)(blob.path)) {
            const msg = Editor.I18n.t(`extension.manager.drop_to_import_file_not_exists`, { path: blob.path });
            Editor.Dialog.info(msg, {
                title: Editor.I18n.t(`extension.title`),
                buttons: [Editor.I18n.t(`extension.manager.confirm`)],
            });
            throw new Error(msg);
        }
        try {
            // 这里应该不需要 await
            // TODO: 后续统一迁移到 composition api，以获得完整的类型支持
            onInstall(blob.path);
        }
        catch (error) {
            console.error(error);
            return;
        }
    }
    return {
        draggingOver,
        onAppDragenter,
        onAppDragend,
        onAppDragleave,
        onAppDragover,
        onAppDrop,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9tYW5hZ2VyL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUF3RDtBQUN4RCw2Q0FBdUU7QUFDdkUsNENBQW9IO0FBQ3BILG9EQUE0QjtBQUM1QixtQ0FBZ0Q7QUFFaEQsMERBQWlDO0FBQ2pDLHNEQUFpQztBQUNqQywwREFBaUM7QUFDakMsdURBQXNEO0FBQ3RELDhDQUE4RjtBQUM5RiwrQkFBcUM7QUFDckMsbUNBQXlDO0FBQ3pDLDJDQUE4QztBQUM5Qyw4Q0FVNEI7QUFDNUIsc0RBQStFO0FBQy9FLGdEQUs2QjtBQUU3QixzREFZZ0M7QUFDaEMsa0RBQTREO0FBWTVELGlDQUFpQztBQUNwQixRQUFBLHFCQUFxQixHQUFHO0lBQ2pDLDhCQUE4QjtJQUM5QixZQUFZLEVBQUUsS0FBSztJQUNuQix1QkFBdUI7SUFDdkIsSUFBSSxFQUFFLEVBQUU7Q0FDWCxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMEozQixDQUFDO0FBRVcsUUFBQSxRQUFRLEdBQUcsSUFBQSx3QkFBZSxFQUFDO0lBQ3BDLElBQUksRUFBRSxrQkFBa0I7SUFDeEIsVUFBVSxFQUFFO1FBQ1IsVUFBVSxFQUFFLGtCQUFPO1FBQ25CLFlBQVksRUFBRSxnQkFBUztRQUN2QixVQUFVLEVBQUUsa0JBQU87UUFDbkIsYUFBYSxFQUFFLG1DQUFpQjtRQUNoQyxlQUFlLEVBQUUseUJBQVk7UUFDN0IsV0FBVyxFQUFYLHdCQUFXO1FB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QztZQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDeEI7UUFDRCxJQUFJO1lBQ0EsZ0JBQWdCO1lBQ2hCLDJDQUEyQztZQUMzQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLE9BQU87U0FDVjtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsWUFBWTtRQUVaLGNBQWM7UUFDZCxZQUFZO1FBQ1osY0FBYztRQUNkLGFBQWE7UUFDYixTQUFTO0tBQ1osQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGgsIHsgam9pbiwgYmFzZW5hbWUsIHBhcnNlLCBub3JtYWxpemUsIGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBWdWUsIHsgUmVmLCBkZWZpbmVDb21wb25lbnQsIGdldEN1cnJlbnRJbnN0YW5jZSwgb25Nb3VudGVkLCBvblVubW91bnRlZCwgcmVmLCB1bnJlZiB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyB0aHJvdHRsZSwgZXNjYXBlUmVnRXhwIH0gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHBrZ05vZGUgZnJvbSAnLi9wa2ctbm9kZSc7XG5pbXBvcnQgcGtnRGV0YWlsIGZyb20gJy4vZGV0YWlsJztcbmltcG9ydCBwa2dMaXN0IGZyb20gJy4vcGtnLWxpc3QnO1xuaW1wb3J0IHsgUGFja2FnZVNlYXJjaExpc3QgfSBmcm9tICcuL3BrZy1zZWFyY2gtbGlzdCc7XG5pbXBvcnQgeyBUYWJEcm9wZG93biwgQ3VzdG9tRGlhbG9nLCBDdXN0b21Ecm9wZG93biwgQ3VzdG9tRHJvcGRvd25JdGVtIH0gZnJvbSAnLi4vY29tcG9uZW50cyc7XG5pbXBvcnQgeyB1c2VJbmplY3RTZGsgfSBmcm9tICcuL3Nkayc7XG5pbXBvcnQgeyB1c2VJbmplY3RTdG9yZSB9IGZyb20gJy4vc3RvcmUnO1xuaW1wb3J0IHsgSU5URVJOQUxfRVZFTlRTIH0gZnJvbSAnLi9ldmVudC1idXMnO1xuaW1wb3J0IHtcbiAgICBoYW5kbGVDYW5jZWxJbXBvcnQsXG4gICAgaGFuZGxlRGVjb21wcmVzc0ZhaWwsXG4gICAgaGFuZGxlSW52YWxpZFBhdGgsXG4gICAgaGFuZGxlVW5leHBlY3RlZEltcG9ydEVycm9yLFxuICAgIHNsZWVwLFxuICAgIEZBS0VfQVVUSE9SX0lELFxuICAgIGlzT25saW5lRXh0ZW5zaW9uLFxuICAgIG1hdGNoSW50ZXJuYWxOYW1lLFxuICAgIENhbmNlbEVycm9yLFxufSBmcm9tICcuLi8uLi9wdWJsaWMvdXRpbHMnO1xuaW1wb3J0IHsgY29udGFpbnNFdmVudFRhcmdldCwgZWxlbWVudHNDb250YWlucyB9IGZyb20gJy4uLy4uL3B1YmxpYy91dGlscy1kb20nO1xuaW1wb3J0IHtcbiAgICBpbXBvcnRQYWNrYWdlLFxuICAgIGltcG9ydFBhY2thZ2VGb2xkZXIsXG4gICAgaW1wb3J0UGFja2FnZVN5bWxpbmssXG4gICAgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZSxcbn0gZnJvbSAnLi4vLi4vcHVibGljL2ltcG9ydCc7XG5cbmltcG9ydCB7XG4gICAgRXh0ZW5zaW9uRGVwZW5kZW5jaWVzLFxuICAgIEV4dGVuc2lvbkRldGFpbCxcbiAgICBFeHRlbnNpb25JbnN0YWxsZWRQYXRoLFxuICAgIEV4dGVuc2lvbkl0ZW0sXG4gICAgRXh0ZW5zaW9uSXRlbUxvY2FsLFxuICAgIEV4dGVuc2lvbkl0ZW1PbmxpbmUsXG4gICAgRXh0ZW5zaW9uTWFuYWdlclRhYixcbiAgICBFeHRlbnNpb25Tb3VyY2VUeXBlLFxuICAgIFBhY2thZ2VJbmZvLFxuICAgIFNvdXJjZSxcbiAgICBQYWNrYWdlU2VhcmNoR3JvdXAsXG59IGZyb20gJy4uLy4uL3B1YmxpYy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgTGFzdEltcG9ydEZvbGRlclBhdGggfSBmcm9tICcuLi8uLi9zaGFyZWQvcHJvZmlsZSc7XG5pbXBvcnQge1xuICAgIE1hbmFnZXIsXG4gICAgSUV4dGVuc2lvbkxpc3RSZXNwb25zZSxcbiAgICBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSxcbiAgICBJRXh0ZW5zaW9uQ29uZmlnLFxuICAgIElFeHRlbnNpb25MaXN0UGFyYW1zLFxuICAgIElMb2NhbEV4dGVuc2lvbkRldGFpbCxcbn0gZnJvbSAnQGVkaXRvci9leHRlbnNpb24tc2RrJztcblxudHlwZSBFZGl0b3JQa2dJbmZvID0gRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbztcblxuLyoqIOaYr+WQpuWcqOWFs+mXremhtemdoueahOaXtuWAmemHjeaWsOazqOWGjGV4dGVuc2lvbiAoKSAqL1xuZXhwb3J0IGNvbnN0IHVwZGF0ZUV4dGVuc2lvbk9wdGlvbiA9IHtcbiAgICAvKiog5piv5ZCm5Zyo5YWz6Zet6aG16Z2i55qE5pe25YCZ6YeN5paw5rOo5YaMZXh0ZW5zaW9uICovXG4gICAgaXNSZVJlZ2lzdGVyOiBmYWxzZSxcbiAgICAvKiogZXh0ZW5zaW9u55qE5Y2H57qn5YyF55qE5Zyw5Z2AICovXG4gICAgcGF0aDogJycsXG59O1xuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuICAgIDxkaXZcbiAgICAgICAgcmVmPVwiY29udGFpbmVyRWxcIlxuICAgICAgICBjbGFzcz1cImV4dGVuc2lvblwiXG4gICAgICAgIEBkcmFnb3Zlcj1cIm9uQXBwRHJhZ292ZXJcIlxuICAgICAgICBAZHJhZ2xlYXZlPVwib25BcHBEcmFnbGVhdmVcIlxuICAgICAgICBAZHJhZ2VuZD1cIm9uQXBwRHJhZ2VuZFwiXG4gICAgICAgIEBkcm9wPVwib25BcHBEcm9wXCJcbiAgICA+XG4gICAgICAgIDwhLS0gPGRpdiBjbGFzcz1cImV4dGVuc2lvbi1sYXlvdXRcIj4gLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJsaXN0LWxheW91dFwiPlxuICAgICAgICAgICAgPGhlYWRlciBjbGFzcz1cImhlYWRlclwiIHYtc2hvdz1cIiFpc1Nob3dTZWFyY2hpbmdcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZW50cnktdGFic1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGFiLWRyb3Bkb3duXG4gICAgICAgICAgICAgICAgICAgICAgICB2LWZvcj1cIih0YWIsIGluZGV4KSBpbiB0YWJzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDprZXk9XCJ0YWIuaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOmFjdGl2ZS1sYWJlbD1cImFjdGl2ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6bGFiZWw9XCJ0YWIubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOmNoaWxkcmVuPVwidGFiLmNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3Q9XCJvblRhYlNlbGVjdFwiXG4gICAgICAgICAgICAgICAgICAgID48L3RhYi1kcm9wZG93bj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmVhdHVyZVwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50IGZlYXR1cmUtY29sIGZlYXR1cmUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLnNlYXJjaF9leHRlbnNpb25zXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljaz1cInN3aXRjaFNlYXJjaFN0YXR1cygpXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWljb24gdmFsdWU9XCJzZWFyY2hcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93biBjbGFzcz1cImJ1dHRvbi1ncm91cCBmZWF0dXJlLWNvbFwiIHNpemU9XCJtaW5pXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ0cmFuc3BhcmVudCBmZWF0dXJlLWJ0blwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcD1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuaW1wb3J0X2V4dGVuc2lvbnNfemlwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2suc3RvcD1cImluc3RhbGwoKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWljb24gdmFsdWU9XCJpbXBvcnRcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPHRlbXBsYXRlICNvdmVybGF5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93bkl0ZW0gQGNsaWNrPVwiaW5zdGFsbFBrZ0ZvbGRlcigpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7IHQoJ2ltcG9ydF9leHRlbnNpb25zX2ZvbGRlcicpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9DdXN0b21Ecm9wZG93bkl0ZW0+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q3VzdG9tRHJvcGRvd25JdGVtIEBjbGljaz1cImluc3RhbGxQa2dEZXYoKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eyB0KCdpbXBvcnRfZXh0ZW5zaW9uc19kZXYnKSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQ3VzdG9tRHJvcGRvd25JdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgPC9DdXN0b21Ecm9wZG93bj5cblxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50IGZlYXR1cmUtY29sIGZlYXR1cmUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLnJlZnJlc2hfZXh0ZW5zaW9uc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2suc3RvcD1cInJlZnJlc2hMaXN0KClcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktaWNvbiB2YWx1ZT1cInJlZnJlc2hcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgICAgICA8aGVhZGVyIGNsYXNzPVwiaGVhZGVyXCIgdi1zaG93PVwiaXNTaG93U2VhcmNoaW5nXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlYXJjaFwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3ctY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInNlYXJjaFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjaGFuZ2U9XCJkb1NlYXJjaCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBibHVyPVwib25TZWFyY2hCbHVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDp2YWx1ZT1cInNlYXJjaEtleVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1pbnB1dD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ0cmFuc3BhcmVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5leGl0X3NlYXJjaFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2suc3RvcD1cInN3aXRjaFNlYXJjaFN0YXR1cygpXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5jYW5jZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvaGVhZGVyPlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHYtc2hvdz1cIiFpc1Nob3dTZWFyY2hpbmcgJiYgYWN0aXZlID09PSBpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICB2LWZvcj1cIml0ZW0gb2YgZmxhdFRhYnNcIlxuICAgICAgICAgICAgICAgIDprZXk9XCJpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImxpc3RcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxwa2ctbGlzdFxuICAgICAgICAgICAgICAgICAgICA6cmVmPVwiaXRlbS5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgIDpsYWJlbD1cIml0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICA6YWN0aXZlPVwiIWlzU2hvd1NlYXJjaGluZyAmJiBhY3RpdmUgPT09IGl0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICBAcmVmcmVzaD1cInJlZnJlc2hMaXN0XCJcbiAgICAgICAgICAgICAgICAgICAgOnBhZ2Utc2l6ZT1cInBhZ2VTaXplXCJcbiAgICAgICAgICAgICAgICAgICAgOmNob29zZWQ9XCJjdXJyZW50UGFja2FnZSA/IGN1cnJlbnRQYWNrYWdlLm5hbWUgOiAnJ1wiXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGUtbGlzdD1cInVwZGF0ZUxpc3RcIlxuICAgICAgICAgICAgICAgICAgICBAY2hvb3NlPVwiY2hvb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1wYWNrYWdlPVwidXBkYXRlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEByZW1vdmUtcGFja2FnZT1cInJlbW92ZVBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAdW5pbnN0YWxsLXBhY2thZ2U9XCJ1bmluc3RhbGxQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHNldC1lbmFibGU9XCJzZXRFbmFibGVcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L3BrZy1saXN0PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGlzdFwiIHYtc2hvdz1cImlzU2hvd1NlYXJjaGluZ1wiPlxuICAgICAgICAgICAgICAgIDxwa2ctc2VhcmNoLWxpc3RcbiAgICAgICAgICAgICAgICAgICAgcmVmPVwic2VhcmNoX2xpc3RcIlxuICAgICAgICAgICAgICAgICAgICBsYWJlbD1cInNlYXJjaF9saXN0XCJcbiAgICAgICAgICAgICAgICAgICAgOmlzLXNlYXJjaD1cInRydWVcIlxuICAgICAgICAgICAgICAgICAgICA6YWN0aXZlPVwiaXNTaG93U2VhcmNoaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgQHJlZnJlc2g9XCJyZWZyZXNoTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIDpzZWFyY2gta2V5PVwic2VhcmNoS2V5XCJcbiAgICAgICAgICAgICAgICAgICAgOnBhZ2Utc2l6ZT1cInBhZ2VTaXplXCJcbiAgICAgICAgICAgICAgICAgICAgOmNob29zZWQ9XCJjdXJyZW50UGFja2FnZSA/IGN1cnJlbnRQYWNrYWdlLm5hbWUgOiAnJ1wiXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGUtbGlzdD1cInVwZGF0ZUxpc3RcIlxuICAgICAgICAgICAgICAgICAgICBAY2hvb3NlPVwiY2hvb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1wYWNrYWdlPVwidXBkYXRlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEByZW1vdmUtcGFja2FnZT1cInJlbW92ZVBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAdW5pbnN0YWxsLXBhY2thZ2U9XCJ1bmluc3RhbGxQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHNldC1lbmFibGU9XCJzZXRFbmFibGVcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L3BrZy1zZWFyY2gtbGlzdD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImRldGFpbC1sYXlvdXRcIj5cbiAgICAgICAgICAgIDxwa2ctZGV0YWlsXG4gICAgICAgICAgICAgICAgOmRldGFpbD1cImN1cnJlbnRQYWNrYWdlRGV0YWlsXCJcbiAgICAgICAgICAgICAgICA6aW5mbz1cImN1cnJlbnRQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICA6bG9hZGluZz1cImdldERldGFpbExvYWRpbmdcIlxuICAgICAgICAgICAgICAgIDplcnJvci1tZXNzYWdlPVwiZGV0YWlsRXJyb3JNZXNzYWdlXCJcbiAgICAgICAgICAgICAgICBAcmVmcmVzaD1cInJlZnJlc2hEZXRhaWxcIlxuICAgICAgICAgICAgPjwvcGtnLWRldGFpbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwhLS0gPC9kaXY+IC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW1wb3J0LWxvYWRpbmctbGF5b3V0XCIgdi1pZj1cImltcG9ydExvYWRpbmdcIj5cbiAgICAgICAgICAgIDx1aS1sb2FkaW5nPjwvdWktbG9hZGluZz5cbiAgICAgICAgICAgIDx1aS1sYWJlbCB2LWlmPVwiaW1wb3J0RXJyb3JNZXNzYWdlXCIgdmFsdWU9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLmltcG9ydF9lcnJvcl90aXBcIj4gPC91aS1sYWJlbD5cbiAgICAgICAgICAgIDxkaXYgdi1pZj1cImltcG9ydEVycm9yTWVzc2FnZVwiPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gY2xhc3M9XCJ0cmFuc3BhcmVudFwiIEBjbGljaz1cImNhbmNlbFJldHJ5SW1wb3J0XCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCB2YWx1ZT1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuY2FuY2VsXCI+PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8dWktYnV0dG9uIEBjbGljaz1cInJldHJ5SW1wb3J0XCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCB2YWx1ZT1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIucmV0cnlcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgdi1zaG93PVwiemlwRHJhZ2dpbmdPdmVyXCIgY2xhc3M9XCJmaWxlLWRyb3AtbGF5ZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmaWxlLWRyb3AtbGF5ZXJfX3RpcFwiPlxuICAgICAgICAgICAgICAgIDx1aS1pY29uIHZhbHVlPVwiZXh0ZW5zaW9uXCI+PC91aS1pY29uPlxuICAgICAgICAgICAgICAgIDx1aS1sYWJlbCB2YWx1ZT1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuZHJvcF90b19pbXBvcnRfdGlwXCIgY2xhc3M9XCJcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8IS0tIDxjdXN0b20tZGlhbG9nIHYtaWY9XCJleHRlbnNpb25EZXBlbmRlbmNpZXNcIiA6aW5mbz1cImV4dGVuc2lvbkRlcGVuZGVuY2llc1wiIEBjYW5jZWw9XCJkaWFsb2dDYW5jZWxcIlxuICAgICAgICBAY29uZmlybT1cImRpYWxvZ0NvbmZpcm1cIj48L2N1c3RvbS1kaWFsb2c+IC0tPlxuICAgIDwvZGl2PlxuYDtcblxuZXhwb3J0IGNvbnN0IFBhbmVsQXBwID0gZGVmaW5lQ29tcG9uZW50KHtcbiAgICBuYW1lOiAnRXh0ZW5zaW9uTWFuYWdlcicsXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICAncGtnLW5vZGUnOiBwa2dOb2RlLFxuICAgICAgICAncGtnLWRldGFpbCc6IHBrZ0RldGFpbCxcbiAgICAgICAgJ3BrZy1saXN0JzogcGtnTGlzdCxcbiAgICAgICAgUGtnU2VhcmNoTGlzdDogUGFja2FnZVNlYXJjaExpc3QsXG4gICAgICAgICdjdXN0b20tZGlhbG9nJzogQ3VzdG9tRGlhbG9nLFxuICAgICAgICBUYWJEcm9wZG93bixcbiAgICAgICAgQ3VzdG9tRHJvcGRvd24sXG4gICAgICAgIEN1c3RvbURyb3Bkb3duSXRlbSxcbiAgICB9LFxuICAgIHNldHVwKHByb3BzLCBjdHgpIHtcbiAgICAgICAgY29uc3Qgdm0gPSBnZXRDdXJyZW50SW5zdGFuY2UoKTtcblxuICAgICAgICBjb25zdCBjb250YWluZXJFbCA9IHJlZjxIVE1MRWxlbWVudD4oKTtcblxuICAgICAgICBjb25zdCB7IGV4dGVuc2lvblBhdGhzLCBzZGsgfSA9IHVzZUluamVjdFNkaygpO1xuICAgICAgICBjb25zdCBzdG9yZSA9IHVzZUluamVjdFN0b3JlKCk7XG5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIGRyYWdnaW5nT3ZlcjogemlwRHJhZ2dpbmdPdmVyLFxuICAgICAgICAgICAgb25BcHBEcmFnZW5kLFxuICAgICAgICAgICAgb25BcHBEcmFnbGVhdmUsXG4gICAgICAgICAgICBvbkFwcERyYWdvdmVyLFxuICAgICAgICAgICAgb25BcHBEcm9wLFxuICAgICAgICB9ID0gdXNlRmlsZURyb3AoY29udGFpbmVyRWwsICh2bT8ucHJveHkgYXMgYW55KS5pbnN0YWxsKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGFpbmVyRWwsXG5cbiAgICAgICAgICAgIGV4dGVuc2lvblBhdGhzLFxuICAgICAgICAgICAgc2RrLFxuICAgICAgICAgICAgc3RvcmUsXG5cbiAgICAgICAgICAgIHppcERyYWdnaW5nT3ZlcixcbiAgICAgICAgICAgIG9uQXBwRHJhZ2VuZCxcbiAgICAgICAgICAgIG9uQXBwRHJhZ2xlYXZlLFxuICAgICAgICAgICAgb25BcHBEcmFnb3ZlcixcbiAgICAgICAgICAgIG9uQXBwRHJvcCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKiog6aG1562+5YiX6KGo77yM5pqC5pe26ZqQ6JeP5LqG5bey6LSt5LmwICovXG4gICAgICAgICAgICB0YWJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvcyxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuQ29jb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAgICAgIC8vICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5QdXJjaGFzZWQsXG4gICAgICAgICAgICAgICAgLy8gICAgIGlkOiAyLFxuICAgICAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIGlkOiAzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgLyoqIOaJgeW5s+WMluWQjueahOmhteetvu+8jOeUqOS6jua4suafk+WunumZhemhtemdoiAqL1xuICAgICAgICAgICAgZmxhdFRhYnM6IFtdIGFzIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIgfVtdLFxuICAgICAgICAgICAgLyoqIOW9k+WJjeaJgOaYvuekuueahOmhteetviAqL1xuICAgICAgICAgICAgYWN0aXZlOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4sXG4gICAgICAgICAgICAvKiog5b2T5YmN6YCJ5Lit55qE5o+S5Lu2ICovXG4gICAgICAgICAgICBjdXJyZW50UGFja2FnZTogbnVsbCBhcyBFeHRlbnNpb25JdGVtIHwgbnVsbCxcbiAgICAgICAgICAgIC8qKiDlvZPliY3pgInkuK3nmoTmj5Lku7bnmoTor6bmg4UgKi9cbiAgICAgICAgICAgIGN1cnJlbnRQYWNrYWdlRGV0YWlsOiBudWxsIGFzIEV4dGVuc2lvbkRldGFpbCB8IG51bGwsXG4gICAgICAgICAgICAvKiog6I635Y+W5o+S5Lu26K+m5oOF55qE5oql6ZSZICovXG4gICAgICAgICAgICBkZXRhaWxFcnJvck1lc3NhZ2U6ICcnLFxuICAgICAgICAgICAgLyoqIOaYr+WQpuWkhOWcqOaQnOe0ouagj+S4rSAqL1xuICAgICAgICAgICAgaXNTaG93U2VhcmNoaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIC8qKiDmkJzntKLpobXpnaLnmoTmiYDlpITliJfooajpobUqL1xuICAgICAgICAgICAgcGFnZTogMSxcbiAgICAgICAgICAgIC8qKiDmr4/mrKHliqDovb3mnaHmlbAgIOebruWJjeeUseS6juWGhee9ruaPkuS7tuWSjOW3suWuieijheaPkuS7tumcgOimgeS6i+WFiOaJq+aPj+WHuuWFqOmDqO+8jOWboOatpOaaguaXtuS4jeWBmuWIhumhteWkhOeQhiovXG4gICAgICAgICAgICBwYWdlU2l6ZTogOTk5OTksXG4gICAgICAgICAgICAvKiog5rqQ5YiX6KGoICovXG4gICAgICAgICAgICBzb3VyY2VMaXN0OiBbXSBhcyBTb3VyY2VbXSxcbiAgICAgICAgICAgIC8qKiDojrflj5bor6bmg4XnmoRMb2FkaW5nICovXG4gICAgICAgICAgICBnZXREZXRhaWxMb2FkaW5nOiBmYWxzZSxcblxuICAgICAgICAgICAgLyoqIOaQnOe0ouWFs+mUruWtlyAqL1xuICAgICAgICAgICAgc2VhcmNoS2V5OiAnJyxcbiAgICAgICAgICAgIC8qKiDmkJzntKLml7bpl7TmiLPjgILmr4/mrKHmkJzntKLmk43kvZznmoTmoIforrDvvIznlKjkuo7lrp7njrAgc3dpdGNoIOaViOaenCAqL1xuICAgICAgICAgICAgc2VhcmNoVGltZXN0YW1wOiAtMSxcbiAgICAgICAgICAgIC8qKiDmkJzntKLnmoToioLmtYEgKi9cbiAgICAgICAgICAgIHNlYXJjaFRocm90dGxlOiBudWxsIGFzIG51bGwgfCAoKC4uLmFyZ3M6IGFueSkgPT4gdm9pZCksXG5cbiAgICAgICAgICAgIC8qKiDlt7Llronoo4XnmoTliJfooagsIOS4k+aMh2luc3RhbGxlZOmhteetvuS4i+eahOWIl+ihqO+8jOS5n+WwseaYr+mdnuWGhee9rueahOaPkuS7tiAqL1xuICAgICAgICAgICAgaW5zdGFsbGVkTGlzdDogW10gYXMgRXh0ZW5zaW9uSXRlbVtdLFxuICAgICAgICAgICAgLyoqIEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCnmiavmj4/lh7rmnaXnmoTmiYDmnInmj5Lku7YgKi9cbiAgICAgICAgICAgIGFsbFBhY2thZ2VzOiBbXSBhcyBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvW10sXG4gICAgICAgICAgICAvKiog5o+S5Lu25L6d6LWW55qE5by556qX6Zif5YiXICovXG4gICAgICAgICAgICBleHRlbnNpb25EZXBlbmRlbmNpZXNMaXN0OiBbXSBhcyBFeHRlbnNpb25EZXBlbmRlbmNpZXNbXSxcbiAgICAgICAgICAgIC8qKiDmj5Lku7bkvp3otZbnmoTlvLnnqpfkv6Hmga8gKi9cbiAgICAgICAgICAgIGV4dGVuc2lvbkRlcGVuZGVuY2llczogbnVsbCBhcyBFeHRlbnNpb25EZXBlbmRlbmNpZXMgfCBudWxsLFxuICAgICAgICAgICAgLyoqIOWvvOWFpeaPkuS7tuaXtueahOaKpemUmeS/oeaBryAqL1xuICAgICAgICAgICAgaW1wb3J0RXJyb3JNZXNzYWdlOiAnJyxcbiAgICAgICAgICAgIC8qKiDlr7zlhaXmj5Lku7bml7bnmoRsb2FkaW5n54q25oCBICovXG4gICAgICAgICAgICBpbXBvcnRMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIC8qKiDlr7zlhaXmj5Lku7bnmoTot6/lvoTnvJPlrZjvvIznlKjkuo7lkI7nu63nmoTph43or5Xlr7zlhaUgKi9cbiAgICAgICAgICAgIGltcG9ydFBhdGhDYWNoZTogJycsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgICAvKiog5b2T5YmN55qE5L6d6LWW5o+S5Lu255qE5by556qX5L+h5oGv77yM55So5LqO6Kem5Y+R5by556qX6Zif5YiXICovXG4gICAgICAgIGV4dGVuc2lvbkRlcGVuZGVuY2llcyh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSAmJiB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzID0gdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXNMaXN0LnNoaWZ0KCkhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY3JlYXRlZCgpIHtcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5vbignZW5hYmxlJywgdGhpcy50b2dnbGVFbmFibGVIYW5kbGUpO1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdkaXNhYmxlJywgdGhpcy50b2dnbGVFbmFibGVIYW5kbGUpO1xuICAgICAgICBFZGl0b3IuTWVzc2FnZS5fX3Byb3RlY3RlZF9fLmFkZEJyb2FkY2FzdExpc3RlbmVyKCdpMThuOmNoYW5nZScsIHRoaXMub25JMThuQ2hhbmdlKTtcbiAgICB9LFxuICAgIG1vdW50ZWQoKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlRmxhdFRhYnMoKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG5cbiAgICAgICAgLy8g5pSv5oyB5ZyoIHBhbmVsIOaJk+W8gOaXtuaMh+WumuaQnOe0oueKtuaAgVxuICAgICAgICBjb25zdCBzdGFydHVwUGFyYW1zID0gdGhpcy5zdG9yZS5zdGFydHVwUGFyYW1zLnZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHN0YXJ0dXBQYXJhbXMuc2VhcmNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5vblNlYXJjaEV2ZW50KHN0YXJ0dXBQYXJhbXMuc2VhcmNoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZJWE1FOiDkuI3lupTlsIYgdnVlIOS9nOS4uuS6i+S7tuaAu+e6v+OAguWQjue7reiAg+iZkeW8leWFpSByeGpzIOadpeWkhOeQhlxuICAgICAgICB0aGlzLiRyb290LiRvbihJTlRFUk5BTF9FVkVOVFMuc2VhcmNoLCB0aGlzLm9uU2VhcmNoRXZlbnQpO1xuICAgIH0sXG4gICAgYmVmb3JlRGVzdHJveSgpIHtcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5yZW1vdmVMaXN0ZW5lcignZW5hYmxlJywgdGhpcy50b2dnbGVFbmFibGVIYW5kbGUpO1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdkaXNhYmxlJywgdGhpcy50b2dnbGVFbmFibGVIYW5kbGUpO1xuICAgICAgICB0aGlzLiRyb290LiRvZmYoSU5URVJOQUxfRVZFTlRTLnNlYXJjaCwgdGhpcy5vblNlYXJjaEV2ZW50KTtcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2UuX19wcm90ZWN0ZWRfXy5yZW1vdmVCcm9hZGNhc3RMaXN0ZW5lcignaTE4bjpjaGFuZ2UnLCB0aGlzLm9uSTE4bkNoYW5nZSk7XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnv7vor5FcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcbiAgICAgICAgICovXG4gICAgICAgIHQoa2V5OiBzdHJpbmcsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICAgICAgICAgICAgRWRpdG9yLkkxOG4uZ2V0TGFuZ3VhZ2U7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLkkxOG4udChgZXh0ZW5zaW9uLm1hbmFnZXIuJHtrZXl9YCwgcGFyYW1zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjdXJMYW5ndWFnZSgpOiAnemgnIHwgJ2VuJyB7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLkkxOG4uZ2V0TGFuZ3VhZ2UoKSBhcyAnemgnIHwgJ2VuJztcbiAgICAgICAgfSxcblxuICAgICAgICBvbkkxOG5DaGFuZ2UoKSB7XG4gICAgICAgICAgICAvLyB0aGlzLnJlZnJlc2hEZXRhaWwoKTtcbiAgICAgICAgICAgIC8vIHJlZnJlc2hMaXN0IOS8muiHquWKqOmAieS4reWIl+ihqOesrOS4gOmhue+8jOS4jeS4gOWumuaYr+eUqOaIt+acn+acm+eahOihjOS4ulxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTGlzdCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliJ3lp4vljJYgKi9cbiAgICAgICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgICAgIC8vIHRoaXMuc291cmNlTGlzdCA9IGF3YWl0IFNESy5nZXRTb3VyY2VMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0aGlzLnRhYnNbMF0ubGFiZWw7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaFRocm90dGxlID0gdGhyb3R0bGUodGhpcy5oYW5kbGVTZWFyY2gsIDMwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5ouN5bmz5bWM5aWX57uT5p6E55qE6aG1562+5pWw57uEICovXG4gICAgICAgIGhhbmRsZUZsYXRUYWJzKCkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW46IE1hcDxzdHJpbmcsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIgfT4gPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBjb25zdCB0YWJzOiB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiIH1bXSA9IFtdO1xuICAgICAgICAgICAgdGhpcy50YWJzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICB0YWJzLnB1c2goeyBsYWJlbDogaXRlbS5sYWJlbCB9KTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNoaWxkcmVuLmZvckVhY2goKHYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LmxhYmVsICE9PSBpdGVtLmxhYmVsKSBjaGlsZHJlbi5zZXQodi5sYWJlbCwgeyBsYWJlbDogdi5sYWJlbCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjaGlsZHJlbi5mb3JFYWNoKCh2KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0YWJzLmZpbmQoKGUpID0+IGUubGFiZWwgPT09IHYubGFiZWwpKSB0YWJzLnB1c2goeyBsYWJlbDogdi5sYWJlbCB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5mbGF0VGFicyA9IHRhYnM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOmAieS4reaPkuS7tiAqL1xuICAgICAgICBhc3luYyBjaG9vc2UocGtnOiBFeHRlbnNpb25JdGVtIHwgdW5kZWZpbmVkIHwgbnVsbCkge1xuICAgICAgICAgICAgLy8g5Lyg5YWl56m65YC85pe26YeN572uIGN1cnJlbnQg5pWw5o2uXG4gICAgICAgICAgICBpZiAocGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIChwa2cgJiYgIXRoaXMuY3VycmVudFBhY2thZ2UpIHx8XG4gICAgICAgICAgICAgICAgIXRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgfHxcbiAgICAgICAgICAgICAgICBwa2cubmFtZSAhPT0gdGhpcy5jdXJyZW50UGFja2FnZT8ubmFtZSB8fFxuICAgICAgICAgICAgICAgIHBrZy52ZXJzaW9uICE9PSB0aGlzLmN1cnJlbnRQYWNrYWdlLnZlcnNpb24gfHxcbiAgICAgICAgICAgICAgICBwa2cudmVyc2lvbiAhPT0gdGhpcy5jdXJyZW50UGFja2FnZURldGFpbC52ZXJzaW9uXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBhY2thZ2VEZXRhaWwocGtnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5riF6Zmk5b2T5YmN55qE6YCJ5Lit6K+m5oOFICovXG4gICAgICAgIGNsZWFyQ3VycmVudERldGFpbCgpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5nZXREZXRhaWxMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOiOt+WPluaPkuS7tuivpuaDhSAqL1xuICAgICAgICBnZXRQYWNrYWdlRGV0YWlsKGl0ZW06IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0RGV0YWlsTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlID0geyAuLi5pdGVtIH07XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZGV0YWlsRXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBjb25zdCBwYXJhbSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIC8vIFRPRE86IOivreiogOWPmOWMluWQjuabtOaWsCBkZXRhaWwg5YaF5a65XG4gICAgICAgICAgICAgICAgbGFuZzogdGhpcy5jdXJMYW5ndWFnZSgpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgIC5nZXRFeHRlbnNpb25EZXRhaWwocGFyYW0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzICYmIHR5cGVvZiByZXMubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWNrYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmVzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHJlcy52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoX2F0OiByZXMucHVibGlzaF9hdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbl9saW1pdDogcmVzLmVkaXRvcl9saW1pdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiByZXMuZGV0YWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiByZXMuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6IHJlcy5pY29uX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuY3VycmVudFBhY2thZ2UudmVyc2lvbiA9IHJlcy52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0ucGF0aCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeUxvY2FsRXh0ZW5zaW9uRGV0YWlsKGl0ZW0ucGF0aCwgdGhpcy5jdXJMYW5ndWFnZSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChkZXRhaWw6IElMb2NhbEV4dGVuc2lvbkRldGFpbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlsICYmIHR5cGVvZiBkZXRhaWwubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWNrYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0aG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogRkFLRV9BVVRIT1JfSUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXRhaWwuYXV0aG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXRhaWwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogZGV0YWlsLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hfYXQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb25fbGltaXQ6IGRldGFpbC5lZGl0b3JfbGltaXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogZGV0YWlsLmRldGFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogcmVzLnNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiByZXMuaWNvbl91cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlLnZlcnNpb24gPSBkZXRhaWwudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9IHRoaXMudCgnZGV0YWlsX2Vycm9yX3RpcCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9IHRoaXMudCgnbmV0d29ya19lcnJvcl90aXAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGl0ZW0udmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaF9hdDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbl9saW1pdDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiBpdGVtLmljb25fdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZS52ZXJzaW9uID0gaXRlbS52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9IHRoaXMudCgnbmV0d29ya19lcnJvcl90aXAnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldERldGFpbExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5ZCv55SoL+WFs+mXreaPkuS7tlxuICAgICAgICAgKiBAcGFyYW0gbmFtZSDmj5Lku7blkI1cbiAgICAgICAgICogQHBhcmFtIGVuYWJsZSDorr7nva7mj5Lku7bnmoTlvIDlkK/nirbmgIHvvIx0cnVlIOW8gOWQr++8jGZhbHNlIOWFs+mXrVxuICAgICAgICAgKiBAcGFyYW0gcGF0aCDmj5Lku7bot6/lvoRcbiAgICAgICAgICogQHJldHVybnNcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIHNldEVuYWJsZShuYW1lOiBzdHJpbmcsIGVuYWJsZTogYm9vbGVhbiwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKHBhdGgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmRpc2FibGUocGF0aCwge30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAnZW5hYmxlJywgcGF0aCwgIWVuYWJsZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgY29uc3QgdGlwID0gZW5hYmxlID8gJ2Rpc2FibGVfZXJyb3JfdGlwJyA6ICdlbmFibGVfZXJyb3JfdGlwJztcbiAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKHRoaXMudCh0aXApKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOeUsUVkaXRvci5QYWNrYWdlLm9u55uR5ZCs5Yiw5YiH5o2i5oiQ5Yqf5ZCO55qE5Zue6LCDICovXG4gICAgICAgIHRvZ2dsZUVuYWJsZUhhbmRsZShpdGVtOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvKSB7XG4gICAgICAgICAgICBbLi4udGhpcy5mbGF0VGFicywgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2ggfV0uZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiLmxhYmVsXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuXG4gICAgICAgICAgICAgICAgZWwudG9nZ2xlRW5hYmxlSGFuZGxlKGl0ZW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBGSVhNRTog5YWz5LqO6L+Z6YeM5a+55LqOIHRoaXMuaW5zdGFsbGVkTGlzdCDmlbDmja7nmoTmm7TmlrDvvIwg55uu5YmN5a6D5ZKMIEluc3RhbGxlZCBsaXN0IOmhtemdoueahCBsaXN0IOaVsOaNruaYr+WFseS6q+eahO+8jOimgeazqOaEj+OAglxuICAgICAgICAgICAgLy8g5pu05paw5pON5L2c5pqC5pe25Lqk55SxIGxpc3Qg57uE5Lu25p2l5a6M5oiQ5pu05paw77yM6L+Z6YeM5LiN5YaN5YGa5YaX5L2Z5pu05paw5LqG44CCXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWIt+aWsOW9k+WJjeivpuaDhSAqL1xuICAgICAgICByZWZyZXNoRGV0YWlsKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBhY2thZ2VEZXRhaWwodGhpcy5jdXJyZW50UGFja2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25UYWJTZWxlY3QodGFiOiBFeHRlbnNpb25NYW5hZ2VyVGFiKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRhYjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5YiH5o2i5pCc57Si54q25oCBICovXG4gICAgICAgIHN3aXRjaFNlYXJjaFN0YXR1cyhzZWFyY2hpbmc/OiBib29sZWFuKSB7XG4gICAgICAgICAgICB0aGlzLmlzU2hvd1NlYXJjaGluZyA9IHR5cGVvZiBzZWFyY2hpbmcgPT09ICdib29sZWFuJyA/IHNlYXJjaGluZyA6ICF0aGlzLmlzU2hvd1NlYXJjaGluZztcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5ID0gJyc7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1Nob3dTZWFyY2hpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuJHJlZnMuc2VhcmNoIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgICAgIGVsLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWwhnNka+aJq+aPj+WHuueahOacrOWcsOaPkuS7tu+8jOS4jkVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCnlvpfliLDnmoTmj5Lku7bov5vooYzov4fmu6TlkozlpITnkIYgKi9cbiAgICAgICAgZm9ybWF0SW5zdGFsbGVkRXh0ZW5zaW9uKGl0ZW06IElFeHRlbnNpb25Db25maWcpOiBFeHRlbnNpb25JdGVtTG9jYWwge1xuICAgICAgICAgICAgY29uc3QgcGtnID0gdGhpcy5hbGxQYWNrYWdlcy5maW5kKCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUodi5wYXRoKSA9PT0gJ2xvY2FsJyk7XG4gICAgICAgICAgICBjb25zdCBpc0NvY29zU291cmNlID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb246IEV4dGVuc2lvbkl0ZW1Mb2NhbCA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIGljb25fdXJsOiBpdGVtLmljb25fdXJsLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIGVuYWJsZTogcGtnID8gcGtnLmVuYWJsZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgcGF0aDogaXRlbS5leHRlbnNpb25fcGF0aCxcbiAgICAgICAgICAgICAgICBpc0J1aWx0SW46IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAocGtnPy5pbmZvLmF1dGhvcikge1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5hdXRob3IgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBGQUtFX0FVVEhPUl9JRCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcGtnLmluZm8uYXV0aG9yLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBzdGF0U3luYyhpdGVtLmV4dGVuc2lvbl9wYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgJiYgdHlwZW9mIHN0YXRlLm10aW1lTXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvblsnbXRpbWUnXSA9IHN0YXRlLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5aSE55CG572R57uc6K+35rGC5Lit6I635Y+W5Yiw55qE5a6Y5pa55o+S5Lu25L+h5oGv77yM5ZCM5pe25a6Y5pa55o+S5Lu25pyJ5Y+v6IO95Lmf5piv5YaF572u5o+S5Lu2ICovXG4gICAgICAgIGZvcm1hdE5ldEV4dGVuc2lvbihpdGVtOiBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSk6IEV4dGVuc2lvbkl0ZW1PbmxpbmUge1xuICAgICAgICAgICAgY29uc3QgaXNDb2Nvc1NvdXJjZSA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIOWFiOajgOa1iyBsYWJlbCDmmK/lkKbmnIkgYnVpbHRpblxuICAgICAgICAgICAgbGV0IGlzQnVpbHRJbiA9XG4gICAgICAgICAgICAgICAgaXRlbS5sYWJlbCAmJiBpdGVtLmxhYmVsLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICA/IGl0ZW0ubGFiZWwuZmluZEluZGV4KCh2KSA9PiB2ID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4pID4gLTFcbiAgICAgICAgICAgICAgICAgICAgOiBmYWxzZTtcblxuICAgICAgICAgICAgbGV0IGJ1aWx0aW5Qa2c6IEVkaXRvclBrZ0luZm8gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgY292ZXJQa2c6IEVkaXRvclBrZ0luZm8gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAvLyDlpITkuo4gZW5hYmxlZCDnirbmgIHnmoQgY292ZXIg57G75Z6L5o+S5Lu2XG4gICAgICAgICAgICBsZXQgY292ZXJQa2dFbmFibGVkOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IGxvY2FsUGtnOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAvLyDmj5Lku7bnmoQgcGF0aCB0eXBlIOaYryBidWlsdGluIOaIliBjb3ZlciDnmoTkuZ/nrpcgYnVpbHRpbu+8jOi/memHjOaKiuWug+S7rOaJvuWHuuadpeOAglxuICAgICAgICAgICAgLy8g6YGN5Y6G5LiA5qyh77yM5a+75om+6ZyA6KaB55qE5o+S5Lu25pWw5o2u44CC5Y+q5L2/55So56ys5LiA5Liq5om+5Yiw55qE5pWw5o2u77yI5Y+q6L+b6KGM5LiA5qyh6LWL5YC8XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBrZyBvZiB0aGlzLmFsbFBhY2thZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBrZy5uYW1lICE9PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aFR5cGUgPSB0aGlzLmNoZWNrUGF0aFR5cGUocGtnLnBhdGgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwYXRoVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdidWlsdGluJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ1aWx0aW5Qa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0aW5Qa2cgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY292ZXInOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY292ZXJQa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdmVyUGtnID0gcGtnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBrZy5lbmFibGUgJiYgY292ZXJQa2dFbmFibGVkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3ZlclBrZ0VuYWJsZWQgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xvY2FsJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsUGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFBrZyA9IHBrZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWFqOmDveaJvuWIsOaVsOaNru+8jOWBnOatouafpeaJvlxuICAgICAgICAgICAgICAgIGlmIChidWlsdGluUGtnICE9IG51bGwgJiYgY292ZXJQa2cgIT0gbnVsbCAmJiBsb2NhbFBrZyAhPSBudWxsICYmIGNvdmVyUGtnRW5hYmxlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXNCdWlsdEluID0gaXNCdWlsdEluIHx8IGJ1aWx0aW5Qa2cgIT0gbnVsbCB8fCBjb3ZlclBrZyAhPSBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCBwa2cgPSBpc0J1aWx0SW4gPyBidWlsdGluUGtnIDogbG9jYWxQa2c7XG5cbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbkl0ZW06IEV4dGVuc2lvbkl0ZW1PbmxpbmUgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHBrZyA/IHBrZy52ZXJzaW9uIDogaXRlbS5sYXRlc3RfdmVyc2lvbixcbiAgICAgICAgICAgICAgICBpY29uX3VybDogaXRlbS5pY29uX3VybCxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXRlbS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBlbmFibGU6IHBrZz8uZW5hYmxlID8/IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkOiBwa2cgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbGF0ZXN0X3ZlcnNpb246IGl0ZW0ubGF0ZXN0X3ZlcnNpb24sXG4gICAgICAgICAgICAgICAgbGF0ZXN0X2Rlc2NyaXB0aW9uOiBpdGVtLmxhdGVzdF9kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICB1cGRhdGVfYXQ6IGl0ZW0udXBkYXRlX2F0LFxuICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgcGF0aDogcGtnID8gcGtnLnBhdGggOiAnJyxcbiAgICAgICAgICAgICAgICBpc0J1aWx0SW4sXG4gICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uSXRlbS5pc0J1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLmJ1aWx0SW5QYXRoID0gZXh0ZW5zaW9uSXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0uYnVpbHRJblZlcnNpb24gPSBleHRlbnNpb25JdGVtLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICBpZiAoY292ZXJQa2dFbmFibGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bey5ZCv55So55qE5YWo5bGA6KaG55uW5a6J6KOF5YaF572u5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0udmVyc2lvbiA9IGNvdmVyUGtnRW5hYmxlZC52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLnBhdGggPSBjb3ZlclBrZ0VuYWJsZWQucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5lbmFibGUgPSBjb3ZlclBrZ0VuYWJsZWQuZW5hYmxlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY292ZXJQa2cgIT0gbnVsbCAmJiBleHRlbnNpb25JdGVtLmVuYWJsZSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnvJbovpHlmajlhoXnva7niYjmnKzmnKrlkK/nlKjvvIzkuJTlrZjlnKjlhajlsYDopobnm5blronoo4XnmoTlhoXnva7mj5Lku7bvvIjkuI3kuIDlrprlkK/nlKjvvInvvIzopobnm5bmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS52ZXJzaW9uID0gY292ZXJQa2cudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5wYXRoID0gY292ZXJQa2cucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5lbmFibGUgPSBjb3ZlclBrZy5lbmFibGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbkl0ZW07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOiOt+WPlue9kee7nOS4iueahOWGhee9ruaPkuS7tuWIl+ihqOWQju+8jOS4juacrOWcsOWGhee9ruaPkuS7tuWIl+ihqOi/m+ihjOWQiOW5tiAqL1xuICAgICAgICBtZXJnZUJ1aWx0SW5FeHRlbnNpb24obGlzdDogSUV4dGVuc2lvbkxpc3RJdGVtUmVzcG9uc2VbXSk6IEV4dGVuc2lvbkl0ZW1bXSB7XG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb25zOiBFeHRlbnNpb25JdGVtW10gPSBsaXN0Lm1hcCgodikgPT4gdGhpcy5mb3JtYXROZXRFeHRlbnNpb24odikpO1xuXG4gICAgICAgICAgICBjb25zdCBidWlsdEluTGlzdCA9IHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFleHRlbnNpb25zLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lKSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUoaXRlbS5wYXRoKSA9PT0gJ2J1aWx0aW4nO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOazqOaEj+i/memHjOaJvueahOaYr+e9kee7nOWIl+ihqOS4reaJvuS4jeWIsOWMuemFjSBuYW1lIOeahOacrOWcsOimhuebluaPkuS7tlxuICAgICAgICAgICAgY29uc3QgbXVsdGlwbGVWZXJzaW9ucyA9IHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFleHRlbnNpb25zLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lKSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUoaXRlbS5wYXRoKSA9PT0gJ2NvdmVyJztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBidWlsdEluTGlzdC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uaW5mby5kZXNjcmlwdGlvbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlOiBpdGVtLmVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgaXNJbnN0YWxsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtdWx0aXBsZVZlcnNpb25zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGV4dGVuc2lvbnMuZmluZEluZGV4KCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uaW5mby5kZXNjcmlwdGlvbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogaXRlbS5lbmFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luc3RhbGxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uZW5hYmxlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvdmVyIOaPkuS7tumcgOimgeWkhOS6juWQr+eUqOeKtuaAge+8jOaJjeS8muWwhuaVsOaNriBtZXJnZSDov5vmnaVcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uc1tpbmRleF0uYnVpbHRJblBhdGggPSBleHRlbnNpb25zW2luZGV4XS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zW2luZGV4XS5idWlsdEluVmVyc2lvbiA9IGV4dGVuc2lvbnNbaW5kZXhdLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLnZlcnNpb24gPSBpdGVtLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLnBhdGggPSBpdGVtLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLmVuYWJsZSA9IGl0ZW0uZW5hYmxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9ucztcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5pCc57Si5qCP6Kem5Y+R5Zue6LCDICovXG4gICAgICAgIGRvU2VhcmNoKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoS2V5ID0gZXZlbnQ/LnRhcmdldD8udmFsdWUgPz8gJyc7XG4gICAgICAgICAgICBpZiAoc2VhcmNoS2V5ID09PSB0aGlzLnNlYXJjaEtleSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaHJvdHRsZSAmJiB0aGlzLnNlYXJjaFRocm90dGxlKHNlYXJjaEtleSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uU2VhcmNoQmx1cihlOiBGb2N1c0V2ZW50KSB7XG4gICAgICAgICAgICAvLyBGSVhNRTog5Li05pe25aSE55CG5pa55qGI77yM6L6T5YWl5qGG5aSx5Y6754Sm54K55pe277yM5aaC5p6c5rKh5pyJ5pCc57Si5ZCN56ew77yM6Ieq5Yqo57uT5p2f5pCc57Si54q25oCB44CCXG4gICAgICAgICAgICAvLyDlkI7nu63lrozlloTmkJzntKLlip/og73lkI7lsLHkuI3pnIDopoHov5nkuKrlpITnkIbkuobjgILmsqHmnInmkJzntKLlkI3np7Dml7blupTmmL7npLrmiYDmnInmlbDmja5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaEtleSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFNlYXJjaFN0YXR1cyhmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWPkei1t+aQnOe0oiAqL1xuICAgICAgICBoYW5kbGVTZWFyY2goc2VhcmNoS2V5OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5ID0gc2VhcmNoS2V5O1xuICAgICAgICAgICAgaWYgKHNlYXJjaEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFnZSA9IDE7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTZWFyY2hFeHRlbnNpb25zKHRoaXMuc2VhcmNoS2V5LCB0aGlzLnBhZ2UsIHRoaXMucGFnZVNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uU2VhcmNoRXZlbnQobmFtZT86IHN0cmluZyB8IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoU2VhcmNoU3RhdHVzKGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IHRydWUgfHwgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hTZWFyY2hTdGF0dXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTZWFyY2gobmFtZSA9PT0gdHJ1ZSA/ICcnIDogbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgdXBkYXRlU2VhcmNoRXh0ZW5zaW9ucyhxdWVyeTogc3RyaW5nLCBwYWdlOiBudW1iZXIsIHBhZ2VTaXplOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5UkUgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cChxdWVyeSkpO1xuICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBJbnN0YW5jZVR5cGU8dHlwZW9mIFBhY2thZ2VTZWFyY2hMaXN0PjtcblxuICAgICAgICAgICAgY29uc3QgcGFyYW06IElFeHRlbnNpb25MaXN0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGU6IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICBxOiBxdWVyeSxcbiAgICAgICAgICAgICAgICBsYW5nOiB0aGlzLmN1ckxhbmd1YWdlKCksXG4gICAgICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgICAgICBwYWdlU2l6ZSxcbiAgICAgICAgICAgICAgICBsYWJlbDogW1xuICAgICAgICAgICAgICAgICAgICAvLyDmkJzntKLpnIDopoHmiYvliqjluKbkuIrmoIfnrb7vvIzpgb/lhY3lnKjmiYDmnInmoIfnrb7kuK3mkJzntKLvvIjlkKbliJnmnInkupvpmpDol4/nmoTmj5Lku7bkuZ/kvJrkuIDotbfooqvmkJzntKLlh7rmnaXvvIlcbiAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvcyxcbiAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluLFxuICAgICAgICAgICAgICAgIF0uam9pbignLCcpLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZWwubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIGxldCBzZWFyY2hSZXN1bHQ6IFBhY2thZ2VTZWFyY2hHcm91cFtdID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNlYXJjaFJlc3VsdCA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgLi4uW1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIuQ29jb3MsXG4gICAgICAgICAgICAgICAgICAgIF0ubWFwPFByb21pc2U8UGFja2FnZVNlYXJjaEdyb3VwPj4oYXN5bmMgKGxhYmVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2RrLmdldEV4dGVuc2lvbkxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5wYXJhbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pys5qyh5pCc57Si6L+H5pyf5ZCO77yM5ZCO57ut55qE5aSE55CG5Lmf5LiN6ZyA6KaB5LqG77yM55u05o6l6YCa6L+H5oqb5Ye6IGVycm9yIOi/lOWbnuepuuaVsOaNruWwseihjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaFRpbWVzdGFtcCAhPT0gdGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBDYW5jZWxFcnJvcigndGltZXN0YW1wIGNhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZExpc3QgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMubWVyZ2VCdWlsdEluRXh0ZW5zaW9uKHJlcy5wYWNrYWdlcykuZmlsdGVyKChwa2cpID0+IHF1ZXJ5UkUudGVzdChwa2cubmFtZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHJlcy5wYWNrYWdlcy5tYXAodGhpcy5mb3JtYXROZXRFeHRlbnNpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0OiBmb3JtYXR0ZWRMaXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogcmVzLmNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYW5jZWwg5pe25oqb5Ye6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENhbmNlbEVycm9yLmlzQ2FuY2VsKGVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIGNhbmNlbCDml7bkuI3lho3miafooYzlkI7nu63pgLvovpFcbiAgICAgICAgICAgICAgICBpZiAoQ2FuY2VsRXJyb3IuaXNDYW5jZWwoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkuIvpnaLpg73mmK/lkIzmraXmlrnms5XvvIzkuI3pnIDopoHlho3liKTmlq0gdGltZXN0YW1wIOS6hlxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkSW5zdGFsbGVkID0gdGhpcy5pbnN0YWxsZWRMaXN0LmZpbHRlcigocGtnKSA9PiBxdWVyeVJFLnRlc3QocGtnLm5hbWUpKTtcbiAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGtleTogRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgbGlzdDogZmlsdGVyZWRJbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsOiBmaWx0ZXJlZEluc3RhbGxlZC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBlbC5iYXRjaFVwZGF0ZUxpc3QoXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaFJlc3VsdC5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZbY3Vyci5rZXldID0gY3VycjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICAgICAgICAgICAgICB9LCB7fSBhcyBSZWNvcmQ8RXh0ZW5zaW9uTWFuYWdlclRhYiwgUGFja2FnZVNlYXJjaEdyb3VwPiksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgZWwubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrDmj5Lku7bmlbDnu4QgKi9cbiAgICAgICAgYXN5bmMgdXBkYXRlTGlzdChsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiwgcGFnZTogbnVtYmVyLCBwYWdlX3NpemU6IG51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgdGFiID0gdGhpcy5pc1Nob3dTZWFyY2hpbmcgPyBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCA6IGxhYmVsO1xuICAgICAgICAgICAgaWYgKHRhYiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxvY2F0aW9uRXh0ZW5zaW9ucygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YWIgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQWxsUGFja2FnZXMoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZVNlYXJjaEV4dGVuc2lvbnModGhpcy5zZWFyY2hLZXksIDEsIHRoaXMucGFnZVNpemUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRXh0ZW5zaW9ucyhsYWJlbCwgdGhpcy5zZWFyY2hLZXksIHBhZ2UsIHBhZ2Vfc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWIt+aWsOaMiemSrueahOinpuWPke+8jOWIt+aWsOW9k+WJjea/gOa0u+eahOmdouadv+S4i+eahOWGheWuueOAgiBpbnN0YWxsZWTkuLrmiavmj4/mnKzlnLDmj5Lku7bvvIzlhbbku5bliJnkuLror7fmsYLnvZHnu5zmj5Lku7YqL1xuICAgICAgICAvLyBGSVhNRTog5piv5ZCm5bqU6K+l5aeL57uI5Yi35paw5q+P5Liq5Y+v6YCJIHRhYiBwYW5lbCDlhoXnmoTlhoXlrrnvvJ/lkKbliJnnlKjmiLflj6rog73kuIDkuKrkuKrpnaLmnb/ljrvliLfmlrDjgIJcbiAgICAgICAgYXN5bmMgcmVmcmVzaExpc3QoKSB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVUYWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogdGhpcy5hY3RpdmU7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1thY3RpdmVUYWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXNjYW4odHlwZTogUGFja2FnZUluZm9bJ3R5cGUnXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAnc2Nhbm5pbmcnLCB0eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDMuNi54IOeJiOacrOeahCDigJzmiavmj4/mj5Lku7bigJ0g5oyJ6ZKu54K55Ye75pe277yM5Lya5Y675Li76L+b56iL5omL5Yqo5pu05paw5o+S5Lu25rOo5YaM5L+h5oGv44CCXG4gICAgICAgICAgICAvLyDov5nph4zlhajpg6jmm7TmlrDvvIzogIzkuI3lho3moLnmja7lvZPliY0gdGFiIOWMuuWIhlxuICAgICAgICAgICAgYXdhaXQgcmVzY2FuKCdnbG9iYWwnKTtcbiAgICAgICAgICAgIGF3YWl0IHJlc2NhbigncHJvamVjdCcpO1xuXG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBpZiAoYWN0aXZlVGFiID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTG9jYXRpb25FeHRlbnNpb25zKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZVRhYiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2gpIHtcbiAgICAgICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaEFsbFBhY2thZ2VzKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVTZWFyY2hFeHRlbnNpb25zKHRoaXMuc2VhcmNoS2V5LCAxLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRXh0ZW5zaW9ucyhhY3RpdmVUYWIsIHRoaXMuc2VhcmNoS2V5LCAxLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5pu05paw6Z2e5pys5Zyw5o+S5Lu25YiX6KGoXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB1cGRhdGVFeHRlbnNpb25zKGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLCBxdWVyeTogc3RyaW5nLCBwYWdlOiBudW1iZXIsIHBhZ2VTaXplOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhYiA9IGxhYmVsO1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiXSBhcyBhbnk7XG5cbiAgICAgICAgICAgIC8vIHNlYXJjaCDpnaLmnb/ljZXni6zlrprliLbpgLvovpFcbiAgICAgICAgICAgIGlmICghZSB8fCB0YWIgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChwYWdlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnN0IHNvdXJjZUlkID0gMTsvLyDov5nph4zlupTor6Xljrt0YWJz6YeM6L+H5rukXG4gICAgICAgICAgICBjb25zdCBwYXJhbTogSUV4dGVuc2lvbkxpc3RQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgZTogRWRpdG9yLkFwcC52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXJ5LFxuICAgICAgICAgICAgICAgIGxhbmc6IHRoaXMuY3VyTGFuZ3VhZ2UoKSxcbiAgICAgICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgICAgIHBhZ2VTaXplLFxuICAgICAgICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHN3aXRjaCAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAvLyDov5nph4zmjpLpmaTmjonkuI3pnIDopoHluKYgbGFiZWwg55qE5oOF5Ya177yM5YW25a6D55qE6YO95bim5LiKIHRhYiBsYWJlbFxuICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQ6XG4gICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLlB1cmNoYXNlZDpcbiAgICAgICAgICAgICAgICBjYXNlIEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoOlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtLmxhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZGtcbiAgICAgICAgICAgICAgICAuZ2V0RXh0ZW5zaW9uTGlzdChwYXJhbSlcbiAgICAgICAgICAgICAgICAudGhlbigocmVzOiBJRXh0ZW5zaW9uTGlzdFJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbkxpc3QgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5tZXJnZUJ1aWx0SW5FeHRlbnNpb24ocmVzLnBhY2thZ2VzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVzLnBhY2thZ2VzLm1hcCgoaXRlbSkgPT4gdGhpcy5mb3JtYXROZXRFeHRlbnNpb24oaXRlbSkpO1xuICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVMaXN0KGV4dGVuc2lvbkxpc3QsIHJlcy5jb3VudCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTaG93U2VhcmNoaW5nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5QdXJjaGFzZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc2V0RXJyb3IodGhpcy50KCduZXR3b3JrX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEVycm9yKHRoaXMudCgnbG9jYWxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlbC5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOabtOaWsOW3suWuieijheaPkuS7tuWIl+ihqCAqL1xuICAgICAgICBhc3luYyB1cGRhdGVMb2NhdGlvbkV4dGVuc2lvbnMoKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgZWwubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIEZJWE1F77ya5Ymv5L2c55So44CC5riF56m65o+S5Lu26K+m5oOF6aG15YaF5a6544CC5ZCO57ut55yL5piv5ZCm6ZyA6KaB77yM5oiW6ICF5Y+m5aSW5a+75om+5LiA5Liq5aSE55CG5pa55byPXG4gICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgdGhpcy5zY2FuTG9jYWwoKTtcblxuICAgICAgICAgICAgLy8gRklYTUU6IOazqOaEjyBpbnN0YWxsZWQg5YiX6KGo6L+Z6YeM77yM5Lik5Liq5pWw57uE5a+56LGh5piv5YWx5Lqr55qE77yM5a+55pWw57uE44CB5pWw57uE5YaF5a+56LGh55qE5pS55Yqo5Lya5a+55Lik6L655ZCM5pe25Lqn55Sf5b2x5ZONXG4gICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBsaXN0O1xuICAgICAgICAgICAgZWwudXBkYXRlTGlzdChsaXN0LCBsaXN0Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHRoaXMuaGFuZGxlTGlzdFVwZGF0ZShsaXN0LCBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCk7XG4gICAgICAgICAgICBlbC5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWcqOafkOS4quWIl+ihqOeahOaVsOaNruabtOaWsOWQju+8jOWQjOatpee7meWFtuS7luWIl+ihqFxuICAgICAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAgICAgKiBAcGFyYW0gbGFiZWxcbiAgICAgICAgICovXG4gICAgICAgIGhhbmRsZUxpc3RVcGRhdGUobGlzdDogRXh0ZW5zaW9uSXRlbVtdLCBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYikge1xuICAgICAgICAgICAgWy4uLnRoaXMuZmxhdFRhYnMsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIH1dXG4gICAgICAgICAgICAgICAgLmZpbHRlcigodikgPT4gdi5sYWJlbCAhPT0gbGFiZWwpXG4gICAgICAgICAgICAgICAgLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgICAgICAgICAgZWwuaGFuZGxlTGlzdFVwZGF0ZShsaXN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyByZWZyZXNoQWxsUGFja2FnZXMoKSB7XG4gICAgICAgICAgICB0aGlzLmFsbFBhY2thZ2VzID0gRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5omr5o+P5bm25aSE55CG5pys5Zyw55uu5b2V5LiL55qE5o+S5Lu277yI5ZCr6aG555uu55qEZXh0ZW5zaW9uc+ebruW9leS4i++8jOWPiu+8iVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgc2NhbkxvY2FsKCkge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFsbGVkTGlzdCA9IGF3YWl0IHRoaXMuc2RrLnNjYW5Mb2NhbEV4dGVuc2lvbnMoKTtcblxuICAgICAgICAgICAgLy8gRklYTUU6IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzIOWtmOWcqOiwg+eUqOaXtuW6j+mXrumimO+8jOacieaXtumcgOimgeetieW+heWug+WGhemDqOaVsOaNruabtOaWsOOAglxuXG4gICAgICAgICAgICAvLyDlhbfkvZPpnIDopoHnrYnlvoXlpJrkuYXvvIzmmoLml7bkuI3muIXmpZpcbiAgICAgICAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuXG4gICAgICAgICAgICBjb25zdCBsaXN0OiBFeHRlbnNpb25JdGVtW10gPSBbXTtcbiAgICAgICAgICAgIGluc3RhbGxlZExpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxQYWNrYWdlcy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAodikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB2LnBhdGggPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1BhdGhUeXBlKHYucGF0aCkgPT09ICdsb2NhbCcsXG4gICAgICAgICAgICAgICAgICAgICkubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2godGhpcy5mb3JtYXRJbnN0YWxsZWRFeHRlbnNpb24oaXRlbSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGlzdC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgYi5tdGltZSA9PT0gJ251bWJlcicgPyBiLm10aW1lIDogMCkgLSAodHlwZW9mIGEubXRpbWUgPT09ICdudW1iZXInID8gYS5tdGltZSA6IDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5qOA5p+l5o+S5Lu255qE57G75YirXG4gICAgICAgICAqIEBwYXJhbSBwYXRoIOimgeajgOa1i+eahOaPkuS7tuWuieijhei3r+W+hFxuICAgICAgICAgKiBAcmV0dXJucyDmj5Lku7bnsbvliKtcbiAgICAgICAgICovXG4gICAgICAgIGNoZWNrUGF0aFR5cGUocGF0aDogc3RyaW5nKTogJ290aGVyJyB8ICdsb2NhbCcgfCAnZ2xvYmFsJyB8ICdjb3ZlcicgfCAnYnVpbHRpbicge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18uY2hlY2tUeXBlKHBhdGgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrAv5a6J6KOF5o+S5Lu2ICovXG4gICAgICAgIHVwZGF0ZVBhY2thZ2UobmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIGluZm86IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmlzSW5zdGFsbGVkICYmIHNlbXZlci5lcSh2ZXJzaW9uLCBpbmZvLnZlcnNpb24pKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoaW5mby5pc0J1aWx0SW4gJiYgdHlwZW9mIGluZm8uYnVpbHRJblZlcnNpb24gPT09ICdzdHJpbmcnICYmIHNlbXZlci5lcSh2ZXJzaW9uLCBpbmZvLmJ1aWx0SW5WZXJzaW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRCdWlsdEluVmVyc2lvbihpbmZvKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kb3dubG9hZChuYW1lLCB2ZXJzaW9uLCBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyDlvoDlt7Llronoo4XliJfooajkuK3mj5LlhaVcbiAgICAgICAgYWRkSW5zdGFsbGVkUGFja2FnZShpdGVtOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5hZGRQYWNrYWdlKGl0ZW0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDlvZPpgInmi6nnmoTniYjmnKzkuLrlhoXnva7niYjmnKzml7bvvIzliJnop4bkuLrph43nva7liLDlhoXnva7niYjmnKwgKi9cbiAgICAgICAgYXN5bmMgcmVzZXRCdWlsdEluVmVyc2lvbihpdGVtOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICBpZiAoIWl0ZW0gfHwgIWl0ZW0uYnVpbHRJblBhdGggfHwgIWl0ZW0uYnVpbHRJblZlcnNpb24pIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgdHJ5VW5pbnN0YWxsID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOWNuOi9veWFqOWxgOebruW9leS4i+eahOaPkuS7tu+8jOS9v+W+l+WPr+S7peWvueaJgOaciemhueebrueUn+aViFxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2RrLnVuaW5zdGFsbChpdGVtLm5hbWUsIHRoaXMuZXh0ZW5zaW9uUGF0aHMuZ2xvYmFsKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyDljbjovb3lpLHotKXvvIzkuI3lvbHlk43lkI7nu63pgLvovpHmiafooYxcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoSW50ZXJuYWxOYW1lKGl0ZW0ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4odGhpcy50KCd1cGRhdGVfZXh0ZW5zaW9uX3RpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt0aGlzLnQoJ2NvbmZpcm0nKSwgdGhpcy50KCdjYW5jZWwnKV0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2V4dGVuc2lvbicsICdzZWxmLXVwZGF0ZScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogaXRlbS5idWlsdEluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0SW5QYXRoOiBpdGVtLmJ1aWx0SW5QYXRoLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUV4dGVuc2lvbk9wdGlvbi5pc1JlUmVnaXN0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCA9IGl0ZW0uYnVpbHRJblBhdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTog5ZCM5LiL5pa5IGRvd25sb2FkLnBlckluc3RhbGxlZCDpkqnlrZDkuK3nmoTlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS52ZXJzaW9uLCBwYXRoOiBpdGVtLnBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRyeVVuaW5zdGFsbCgpO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUoaXRlbS5uYW1lLCB0cnVlLCBpdGVtLmJ1aWx0SW5QYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS5idWlsdEluVmVyc2lvbiwgcGF0aDogaXRlbS5idWlsdEluUGF0aCB9LFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaXRlbS5wYXRoID0gaXRlbS5idWlsdEluUGF0aDtcbiAgICAgICAgICAgICAgICBpdGVtLnZlcnNpb24gPSBpdGVtLmJ1aWx0SW5WZXJzaW9uO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlKGl0ZW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDkuIvovb3mj5Lku7YgKi9cbiAgICAgICAgZG93bmxvYWQobmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIGl0ZW06IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvblBhdGhzID0gdGhpcy5leHRlbnNpb25QYXRocztcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gaXRlbS5pc0J1aWx0SW4gPyBleHRlbnNpb25QYXRocy5nbG9iYWwgOiBleHRlbnNpb25QYXRocy5wcm9qZWN0O1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlID0gdGhpcy5zZGsuZ2V0RG93bmxvYWRlcihcbiAgICAgICAgICAgICAgICB7IG5hbWUsIHZlcnNpb24sIGluc3RhbGxQYXRoIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFByb2dyZXNzOiAocHJvZ3Jlc3M6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MgPSBNYXRoLmZsb29yKDEwMCAqIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMobmFtZSwgbnVsbCwgbnVsbCwgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwZXJEb3dubG9hZGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNCdWlsdEluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5a+55LqO5omp5bGV566h55CG5Zmo5L6L5aSW77yM5a6D55qE5pu05paw5LiN6IO95YGa5Yiw5Y2z5pe256aB55So44CB5Y+N5rOo5YaMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaEludGVybmFsTmFtZShpdGVtLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgZmFsc2UsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLnBhdGggIT09IGl0ZW0uYnVpbHRJblBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmdniBidWlsdGluIOaXtuWPjeazqOWGjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y+N5rOo5YaM5YWo5bGAIGJ1aWx0aW4g55uu5b2V5LiL5bey5a6J6KOF55qE5o+S5Lu277yI5pyq5ZCv55So77yM5Zug5q2k5LiN5Lya6LWw5LiK6Z2i55qE5Yik5pat6YC76L6R77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3QgPSBpbmZvLmluc3RhbGxQa2dQYXRoID8/IHBhdGgucmVzb2x2ZShpbmZvLmluc3RhbGxQYXRoLCBpbmZvLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0KSAmJiB0aGlzLmFsbFBhY2thZ2VzLmZpbmQoKHBrZykgPT4gcGtnLnBhdGggPT09IGRpc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBkaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoZGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uaXNJbnN0YWxsZWQgJiYgaXRlbS5wYXRoICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgZmFsc2UsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwZXJJbnN0YWxsZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwa2c6IEV4dGVuc2lvbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlu7bov581MDDmr6vnp5LvvIzlm6DkuLrorr7orqHluIzmnJvlnKjkuIvovb3lrozmiJDlkI7og73oh7PlsJHlgZznlZnlnKgxMDAl54q25oCB5LiA5q615pe26Ze0XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5mby50ZW1wUGF0aCAhPT0gJ3N0cmluZycgfHwgaW5mby50ZW1wUGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGluZm8udGVtcFBhdGg6IFwiJHtpbmZvLnRlbXBQYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaEludGVybmFsTmFtZShuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4odGhpcy50KCd1cGRhdGVfZXh0ZW5zaW9uX3RpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdleHRlbnNpb24nLCAnc2VsZi11cGRhdGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogaW5mby50ZW1wUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsdEluUGF0aDogaXRlbS5idWlsdEluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uT3B0aW9uLmlzUmVSZWdpc3RlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCA9IGluZm8udGVtcFBhdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeS4i+asoeWQr+WKqOaXtuabtOaWsOWAme+8jOe7k+adn+S4i+i9veeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6L+Z6YeM5L2/55So55qE5piv5b2T5YmN55qE54mI5pys5ZKM6Lev5b6E77yM55u45b2T5LqO5rKh5pyJ5pu05pawXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOmcgOimgeS4gOS4quabtOWQiOeQhueahOeKtuaAgeabtOaWsOacuuWItlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS52ZXJzaW9uLCBwYXRoOiBpdGVtLnBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXRlbS5pc0J1aWx0SW4gJiYgaXRlbS5pc0NvY29zU291cmNlICYmICFpdGVtLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy5pc0luc3RhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwa2cuZW5hYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5yZWdpc3RlcihpbmZvLnRlbXBQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUobmFtZSwgdHJ1ZSwgaW5mby50ZW1wUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGtnLnBhdGggPSBpbmZvLnRlbXBQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIG51bGwsIHsgdmVyc2lvbiwgcGF0aDogaW5mby50ZW1wUGF0aCEgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlKHBrZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMb2NhdGlvbkV4dGVuc2lvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIHRoaXMudCgnaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uOiBFeHRlbnNpb25EZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uZm9yRWFjaCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbi5kZXBlbmRlbmNpZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHYubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogdi52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wZW5EaWFsb2cob3B0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGUuZG93bmxvYWQoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMobmFtZSwgdGhpcy50KCdpbnN0YWxsX2Vycm9yX3RpcCcpLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5bCG5o+S5Lu255qE5LiL6L2954q25oCB5ZCM5q2l5Yiw5omA5pyJ5YiX6KGoICovXG4gICAgICAgIHVwZGF0ZURvd25sb2FkU3RhdHVzKFxuICAgICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgZXJyb3I6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiB7IHBhdGg6IHN0cmluZzsgdmVyc2lvbjogc3RyaW5nIH0gfCBudWxsLFxuICAgICAgICAgICAgcHJvZ3Jlc3M6IG51bWJlciB8IG51bGwsXG4gICAgICAgICkge1xuICAgICAgICAgICAgWy4uLnRoaXMuZmxhdFRhYnMsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIH1dLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW3RhYi5sYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgICAgICBlbC51cGRhdGVEb3dubG9hZFN0YXR1cyhuYW1lLCBlcnJvciwgc3VjY2VzcywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiDlsIbmj5Lku7bnmoTljbjovb3nirbmgIHlkIzmraXliLDmiYDmnInliJfooaggKi9cbiAgICAgICAgdXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgaXRlbTogRXh0ZW5zaW9uSXRlbSxcbiAgICAgICAgICAgIGVycm9yOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogeyBwYXRoOiBzdHJpbmc7IHZlcnNpb246IHN0cmluZyB9IHwgbnVsbCxcbiAgICAgICAgICAgIHByb2dyZXNzOiBudW1iZXIgfCBudWxsLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOWPquafpeaJviBidWlsdGluICYgY292ZXLvvIzmmK/lkKblupTor6XljLrliIbmmL7npLrvvJ9cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVpbHRJbiA9IHRoaXMuYWxsUGFja2FnZXMuZmluZCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFR5cGUgPSB0aGlzLmNoZWNrUGF0aFR5cGUodi5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJiAocGF0aFR5cGUgPT09ICdidWlsdGluJyB8fCBwYXRoVHlwZSA9PT0gJ2NvdmVyJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhYi5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNCdWlsdEluICYmIGJ1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHBhdGg6IGJ1aWx0SW4/LnBhdGgsIHZlcnNpb246IGJ1aWx0SW4udmVyc2lvbiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2NhbEl0ZW06IEV4dGVuc2lvbkl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6Kem5Y+R5Y246L295pON5L2c55qE5piv5ZCm5piv5b2T5YmN5YiX6KGo5Lit55qE5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5pbnN0YWxsZWQgPSBpdGVtLnBhdGggPT09IGxvY2FsSXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogaXNVbmluc3RhbGxlZCA/ICcnIDogbG9jYWxJdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDov5nph4zopoHnlKjliJfooajnu4Tku7bmnKzlnLDnmoTmlbDmja7vvIzogIzkuI3mmK/op6blj5Hljbjovb3mk43kvZzpgqPkuKrliJfooajnmoTmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNVbmluc3RhbGxlZCAmJiBpc09ubGluZUV4dGVuc2lvbihsb2NhbEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbG9jYWxJdGVtLmxhdGVzdF92ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxJdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2NhbEl0ZW06IEV4dGVuc2lvbkl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VuaW5zdGFsbGVkID0gaXRlbS5wYXRoID09PSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFBhdGggPSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFZlcnNpb24gPSBsb2NhbEl0ZW0udmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNVbmluc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDljbjovb3nmoTmmK/lhoXnva7liJfooajph4zlvZPliY3nmoTmmL7npLrpoblcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFBhdGggPSBidWlsdEluPy5wYXRoID8/ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VmVyc2lvbiA9IGJ1aWx0SW4/LnZlcnNpb24gPz8gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG5leHRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBuZXh0VmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzQ29jb3NTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobG9jYWxJdGVtOiBFeHRlbnNpb25JdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IOWboOS4uuebruWJjeaQnOe0ouS7heWkhOeQhuacjeWKoeerr+i/lOWbnueahOaVsOaNru+8jOWboOatpOWNuOi9veWQjueahOeKtuaAgeabtOaWsOS5n+WPqumcgOimgeeugOWNleWIpOaWrVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2gg5YiX6KGo55qE5pWw5o2u5Zyo56a75byA5ZCO5Lya5riF56m677yM5Zug5q2k5pqC5pe25LiN5Lya5pyJ5Zyo5Yir55qEIHRhYiDkuIvmm7TmlrAgc2VhcmNoIOaVsOaNrueahOmXrumimO+8jFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y2z5q2k5aSEIGxvY2FsSXRlbSA9PT0gaXRlbeOAguS4uuS6huS4juS4iumdouS4gOiHtO+8jOS+neaXp+S9v+eUqCBsb2NhbEl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGlzT25saW5lRXh0ZW5zaW9uKGxvY2FsSXRlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxvY2FsSXRlbS5sYXRlc3RfdmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxJdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZShpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZShpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKGl0ZW0ubmFtZSwgZXJyb3IsIHN1Y2Nlc3MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlRG93bmxvYWRTdGF0dXMoaXRlbS5uYW1lLCBlcnJvciwgc3VjY2VzcywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliIfmjaLmj5Lku7bnmoTljbjovb1sb2FkaW5nICovXG4gICAgICAgIHVwZGF0ZVVuaW5zdGFsbExvYWRpbmcobmFtZTogc3RyaW5nLCBpc0xvYWRpbmc6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsTG9hZGluZyhuYW1lLCBpc0xvYWRpbmcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiDljbjovb3mj5Lku7YgKi9cbiAgICAgICAgYXN5bmMgdW5pbnN0YWxsUGFja2FnZShuYW1lOiBzdHJpbmcsIGl0ZW06IEV4dGVuc2lvbkl0ZW0sIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tsYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAvLyDliKDpmaTliY3or6Lpl65cbiAgICAgICAgICAgIGlmIChpdGVtLmVuYWJsZSAmJiBsYWJlbCAhPT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKHRoaXMudCgnY2xvc2VfZXh0ZW5zaW9uc190aXAnKSwge1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDEsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgbnVsbCwgeyBwYXRoOiBpdGVtLnBhdGgsIHZlcnNpb246IGl0ZW0udmVyc2lvbiB9LCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsICFpdGVtLmVuYWJsZSwgaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiDljbjovb3mj5Lku7bml7blhYjmuIXnqbror6bmg4XpobXlhoXlrrnjgILkuLvopoHmmK/kuLrkuoblkozlronoo4Xmj5Lku7bml7bnmoTooYzkuLrliY3lkI7lkbzlupTjgILlkI7nu63nnIvnnIvmmK/lkKbpnIDopoHkv53nlZlcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVW5pbnN0YWxsTG9hZGluZyhuYW1lLCB0cnVlKTtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcblxuICAgICAgICAgICAgLy8g5Yib5bu6IHNkayDml7bnmoTlj4LmlbDkuK3lj6rkvKDlhaXkuobpobnnm67ot6/lvoTvvIzlm6DmraTov5nph4zlj6rkvJrljbjovb3pobnnm67ot6/lvoTkuIvnmoTmj5Lku7ZcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgIC51bmluc3RhbGwobmFtZSwge1xuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxQcm9ncmVzczogKHByb2dyZXNzOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzID0gTWF0aC5mbG9vcigxMDAgKiBwcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgbnVsbCwgbnVsbCwgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxlZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoSW50ZXJuYWxOYW1lKG5hbWUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGl0ZW0uYnVpbHRJblBhdGggPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5idWlsdEluUGF0aCAhPT0gJydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsIHRydWUsIGl0ZW0uYnVpbHRJblBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVVbmluc3RhbGxTdGF0dXMoaXRlbSwgbnVsbCwgeyBwYXRoOiAnJywgdmVyc2lvbjogJycgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ3VuaW5zdGFsbF9lcnJvcl90aXAnKSk7XG4gICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhuYW1lLCB0aGlzLnQoJ3VuaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog56e76Zmk5pyq5a6J6KOF55qE5o+S5Lu2ICovXG4gICAgICAgIHJlbW92ZVBhY2thZ2UobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCB0YWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogdGhpcy5hY3RpdmU7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgLnVuaW5zdGFsbChuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIHVuaW5zdGFsbGVkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmUobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKHRoaXMudCgncmVtb3ZlX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmiZPlvIDlvLnnqpfvvIzlt7LlgZrpmJ/liJflpITnkIbjgIIg5L2G5piv55uu5YmN5by556qX5Yqf6IO95YWI6ZqQ6JePICovXG4gICAgICAgIG9wZW5EaWFsb2coaW5mbzogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAvLyBpZiAodGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3QucHVzaChpbmZvKVxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llcyA9IGluZm9cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGlmIChpbmZvLmRlcGVuZGVuY2llcy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGluZm8uZGVwZW5kZW5jaWVzLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgaW5kZXggPiAwID8gKG1lc3NhZ2UgKz0gYOOAgSR7aXRlbS5uYW1lfUAke2l0ZW0udmVyc2lvbn1gKSA6IChtZXNzYWdlICs9IGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgICAgICAgICAgdGl0bGU6IGAke2luZm8ubmFtZX0gJHt0aGlzLnQoJ2luc3RhbGxfZGVwZW5kZW5jZV90aXAnKX1gLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3dhcm4nLFxuICAgICAgICAgICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgICAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5by556qX55qE5Y+W5raI5oyJ6ZKuICovXG4gICAgICAgIGRpYWxvZ0NhbmNlbCgpIHtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5by556qX55qE56Gu6K6k5oyJ6ZKuICovXG4gICAgICAgIGRpYWxvZ0NvbmZpcm0oaW5mbzogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5jYWxsYmFjaykgaW5mby5jYWxsYmFjaygpO1xuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDph43or5Xlr7zlhaUgKi9cbiAgICAgICAgcmV0cnlJbXBvcnQoKSB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydEVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsKHRoaXMuaW1wb3J0UGF0aENhY2hlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5Y+W5raI6YeN6K+V5a+85YWl77yM55u05o6l57uT5p2fICovXG4gICAgICAgIGNhbmNlbFJldHJ5SW1wb3J0KCkge1xuICAgICAgICAgICAgdGhpcy5pbXBvcnRFcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0UGF0aENhY2hlID0gJyc7XG4gICAgICAgICAgICB0aGlzLmltcG9ydExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblBvcHVwSW1wb3J0TW9yZSgpIHtcbiAgICAgICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLnQoJ2ltcG9ydF9leHRlbnNpb25zX2ZvbGRlcicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxQa2dGb2xkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLnQoJ2ltcG9ydF9leHRlbnNpb25zX2RldicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxQa2dEZXYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIHNlbGVjdERpcmVjdG9yeUZyb21EaWFsb2cob3B0aW9uaXM6IEVkaXRvci5EaWFsb2cuU2VsZWN0RGlhbG9nT3B0aW9ucyA9IHt9KSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0Rm9sZGVyUGF0aCA9IGF3YWl0IExhc3RJbXBvcnRGb2xkZXJQYXRoLnRyeUdldCgpO1xuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLnNlbGVjdCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnNlbGVjdERpcmVjdG9yeScpLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXJlY3RvcnknLFxuICAgICAgICAgICAgICAgIG11bHRpOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBwYXRoOiBsYXN0Rm9sZGVyUGF0aCA/PyB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgLi4ub3B0aW9uaXMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdC5maWxlUGF0aHMpIHx8IHJlc3VsdC5maWxlUGF0aHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlckRpciA9IHBhdGguZGlybmFtZShzZWxlY3RlZFBhdGgpO1xuXG4gICAgICAgICAgICAvLyDmiormnKzmrKHpgInkuK3mlofku7blpLnnmoTniLbnuqfmlofku7blpLnot6/lvoTlrZjliLAgcHJvZmlsZSDkuK1cbiAgICAgICAgICAgIGlmIChmb2xkZXJEaXIgIT09IGxhc3RGb2xkZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgTGFzdEltcG9ydEZvbGRlclBhdGgudHJ5U2V0KGZvbGRlckRpcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZFBhdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWvvOWFpeS4gOS4quaPkuS7tuWOi+e8qeWMhVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW5zdGFsbChmaWxlUGF0aCA9ICcnKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gJ3Byb2plY3QnO1xuICAgICAgICAgICAgaWYgKCFmaWxlUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RGb2xkZXJQYXRoID0gYXdhaXQgTGFzdEltcG9ydEZvbGRlclBhdGgudHJ5R2V0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5zZWxlY3Qoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuc2VsZWN0WmlwJyksXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdaSVAnLCBleHRlbnNpb25zOiBbJ3ppcCddIH1dLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBsYXN0Rm9sZGVyUGF0aCA/PyB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCB8fCAhcmVzdWx0LmZpbGVQYXRoc1swXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlRGlyID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBMYXN0SW1wb3J0Rm9sZGVyUGF0aC50cnlTZXQoZmlsZURpcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2VOYW1lID0gYmFzZW5hbWUoZmlsZVBhdGgsICcuemlwJyk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsUGtnVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW1wb3J0UGFja2FnZSh0eXBlLCBmaWxlUGF0aCwgeyBleHRlbnNpb25EaXNwbGF5TmFtZTogcGFja2FnZU5hbWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmRlY29tcHJlc3NGYWlsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZURlY29tcHJlc3NGYWlsKGZpbGVQYXRoLCBwYWNrYWdlTmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlpITnkIblronoo4XpgLvovpHnmoTmqKHmnb/mlrnms5XjgIJcbiAgICAgICAgICog5ZCO57ut6ZyA5rGC5Y+Y5pu05pe25Y+v5Lul5aKe5Yqg5pu05aSa5Y+C5pWw77yM5oiW6ICF5bCG5pW05Liq5qih5p2/5pa55rOV5ouG5pWj5oiQ5aSa5Liq5bCP5Ye95pWw77yM6K6p5ZCE5Liq6LCD55So5YWl5Y+j6Ieq5bex5Y6757uE5ZCI6LCD55SoXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbnN0YWxsUGtnVGVtcGxhdGUob3B0aW9uczoge1xuICAgICAgICAgICAgLy8g55So5oi36YCJ5Lit55qE6Lev5b6E77yI5paH5Lu25oiW5paH5Lu25aS577yJXG4gICAgICAgICAgICBzZWxlY3RlZFBhdGg6IHN0cmluZztcbiAgICAgICAgICAgIC8vIGltcG9ydCDmk43kvZznmoTlpITnkIblh73mlbDjgILov5Tlm54gaW1wb3J0IOWujOaIkOWQjueahCBkaXN0IOi3r+W+hFxuICAgICAgICAgICAgaW1wb3J0SGFuZGxlcjogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgICB9KSB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydExvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgLy8g5q+P5qyh5a+85YWl5byA5aeL5pe26YeN572u5LiK5LiA5qyh5a+85YWl55qE6ZSZ6K+v5L+h5oGvXG4gICAgICAgICAgICB0aGlzLmltcG9ydEVycm9yTWVzc2FnZSA9ICcnO1xuXG4gICAgICAgICAgICBjb25zdCB7IHNlbGVjdGVkUGF0aCB9ID0gb3B0aW9ucztcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgb3B0aW9ucy5pbXBvcnRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBpbXBvcnRlZCBwYWNrYWdlIHBhdGg6IFwiJHtwYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0UGF0aENhY2hlID0gJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZDtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaW5zdGFsbGVkTGlzdC5maW5kKCh2KSA9PiB2LnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwdGVkIHBhY2thZ2UgaW1wb3J0OiBjYW5ub3QgZmluZCBpbiBpbnN0YWxsZWQgbGlzdCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgdHJ1ZSwgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaG9vc2UoaXRlbSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0RXJyb3JNZXNzYWdlID0gdGhpcy50KCdpbXBvcnRfZXJyb3JfdGlwJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRQYXRoQ2FjaGUgPSBzZWxlY3RlZFBhdGg7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2FuY2VsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsUmV0cnlJbXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5jZWxJbXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZS5pbnZhbGlkUGF0aDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVJbnZhbGlkUGF0aChzZWxlY3RlZFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2Fubm90RmluZFBhY2thZ2VKc29uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IChlcnJvciBhcyBhbnkpLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmltcG9ydEVycm9yJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmNhbm5vdEZpbmRQYWNrYWdlSnNvbicsIHsgcGF0aDogZm9sZGVyUGF0aCB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMTAwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaKm+WHuuiuqeWkluWxguWkhOeQhlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmRlY29tcHJlc3NGYWlsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVVuZXhwZWN0ZWRJbXBvcnRFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGluc3RhbGxQa2dGb2xkZXIoZm9sZGVyUGF0aCA9ICcnKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gJ3Byb2plY3QnO1xuXG4gICAgICAgICAgICBpZiAoIWZvbGRlclBhdGgpIHtcbiAgICAgICAgICAgICAgICBmb2xkZXJQYXRoID0gYXdhaXQgdGhpcy5zZWxlY3REaXJlY3RvcnlGcm9tRGlhbG9nKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZm9sZGVyUGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsUGtnVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcbiAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3QgPSBhd2FpdCBpbXBvcnRQYWNrYWdlRm9sZGVyKHR5cGUsIGZvbGRlclBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlzdDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgaW5zdGFsbFBrZ0Rldihmb2xkZXJQYXRoID0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSAncHJvamVjdCc7XG4gICAgICAgICAgICBpZiAoIWZvbGRlclBhdGgpIHtcbiAgICAgICAgICAgICAgICBmb2xkZXJQYXRoID0gYXdhaXQgdGhpcy5zZWxlY3REaXJlY3RvcnlGcm9tRGlhbG9nKCk7XG4gICAgICAgICAgICAgICAgaWYgKGZvbGRlclBhdGggPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5zdGFsbFBrZ1RlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbXBvcnRQYWNrYWdlU3ltbGluayh0eXBlLCBmb2xkZXJQYXRoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxufSk7XG5cbmZ1bmN0aW9uIHVzZUZpbGVEcm9wKGNvbnRhaW5lcjogUmVmPEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkPiwgb25JbnN0YWxsOiAoemlwUGF0aD86IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPikge1xuICAgIC8vIGFwcCDmoLnlhYPntKDkuIrnmoTmlofku7bmi5bmlL7lpITnkIZcbiAgICBjb25zdCBkcmFnZ2luZ092ZXIgPSByZWYoZmFsc2UpO1xuXG4gICAgLy8gbWltZVR5cGUg5Yy65YiG5bmz5Y+w77yM5pyJ5aSa56eN5Y+W5YC877yM5aSE55CG6LW35p2l5q+U6L6D6bq754Om44CC5aaC5p6c6KaB5pSv5oyB5paH5Lu25aS577yM6YC76L6R5Lya5pu05aSN5p2CXG4gICAgLy8gc2VlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80NDExNzU3L3ppcC1taW1lLXR5cGVzLXdoZW4tdG8tcGljay13aGljaC1vbmVcbiAgICAvLyB0ZXN0IGAvemlwYCwgYHgtemlwYFxuICAgIGNvbnN0IHppcE1pbWVUeXBlUkUgPSAvKFxcL3x4LSl6aXAvO1xuXG4gICAgZnVuY3Rpb24gb25BcHBEcmFnZW50ZXIoZTogRHJhZ0V2ZW50KSB7XG4gICAgICAgIGRyYWdnaW5nT3Zlci52YWx1ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbkFwcERyYWdsZWF2ZShlOiBEcmFnRXZlbnQpIHtcbiAgICAgICAgY29uc3QgaW5Db250YWluZXIgPSBjb250YWluZXIudmFsdWUgJiYgY29udGFpbnNFdmVudFRhcmdldChjb250YWluZXIudmFsdWUsIGUpO1xuICAgICAgICBjb25zdCB3aWxsTGVhdmUgPSBlLnJlbGF0ZWRUYXJnZXQgPT0gbnVsbDtcblxuICAgICAgICBpZiAoaW5Db250YWluZXIgJiYgd2lsbExlYXZlKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmRlYnVnKCdkcmFnIGxlYXZlJywgW2UudGFyZ2V0LCBlLnJlbGF0ZWRUYXJnZXQsIGluQ29udGFpbmVyLCB3aWxsTGVhdmVdKTtcbiAgICAgICAgICAgIGRyYWdnaW5nT3Zlci52YWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uQXBwRHJhZ2VuZChlOiBEcmFnRXZlbnQpIHtcbiAgICAgICAgZHJhZ2dpbmdPdmVyLnZhbHVlID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uQXBwRHJhZ292ZXIoZTogRHJhZ0V2ZW50KSB7XG4gICAgICAgIGlmICghZS5kYXRhVHJhbnNmZXIpIHJldHVybjtcblxuICAgICAgICBkcmFnZ2luZ092ZXIudmFsdWUgPSB0cnVlO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKGUuZGF0YVRyYW5zZmVyLml0ZW1zID8/IFtdKTtcbiAgICAgICAgY29uc3QgZmlsZXNPbkRyYWdnaW5nID0gaXRlbXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS5raW5kICE9PSAnZmlsZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDmraTml7bosIPnlKggZ2V0QXNGaWxlIOaXoOazleiOt+W+l+aVsOaNru+8jOWPquiDveagoemqjCBgaXRlbS50eXBlYChtaW1lVHlwZSnjgIJcbiAgICAgICAgICAgIC8vIHdpbmRvd3Mg5LiK5ouW5ou95paH5Lu25aS55pe2IGl0ZW0udHlwZSA9PT0gJyfvvIzpnIDopoHms6jmhI9cbiAgICAgICAgICAgIC8vIHJldHVybiB6aXBNaW1lVHlwZVJFLnRlc3QoaXRlbS50eXBlKTtcblxuICAgICAgICAgICAgLy8g5LiN5qCh6aqMIHR5cGXvvIzlnKggZHJvcCDkuovku7bml7bmoKHpqozmlofku7blkI7nvIDjgIJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZmlsZXNPbkRyYWdnaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGUuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlLmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25BcHBEcm9wKGU6IERyYWdFdmVudCkge1xuICAgICAgICBkcmFnZ2luZ092ZXIudmFsdWUgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKGUuZGF0YVRyYW5zZmVyPy5pdGVtcyA/PyBbXSk7XG4gICAgICAgIGlmICghZS5kYXRhVHJhbnNmZXIgfHwgaXRlbXMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzog5pSv5oyB5om56YeP5a+85YWl77yfXG4gICAgICAgIGNvbnN0IGZpbGUgPSBpdGVtc1swXTtcbiAgICAgICAgaWYgKGZpbGUua2luZCAhPT0gJ2ZpbGUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmxvYiA9IGZpbGUuZ2V0QXNGaWxlKCk7XG4gICAgICAgIGlmIChibG9iID09IG51bGwgfHwgIWJsb2IucGF0aC5lbmRzV2l0aCgnLnppcCcpKSB7XG4gICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmluZm8oRWRpdG9yLkkxOG4udChgZXh0ZW5zaW9uLm1hbmFnZXIuZHJvcF90b19pbXBvcnRfcmVxdWlyZXNfemlwYCksIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udChgZXh0ZW5zaW9uLnRpdGxlYCksXG4gICAgICAgICAgICAgICAgYnV0dG9uczogW0VkaXRvci5JMThuLnQoYGV4dGVuc2lvbi5tYW5hZ2VyLmNvbmZpcm1gKV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWV4aXN0c1N5bmMoYmxvYi5wYXRoKSkge1xuICAgICAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udChgZXh0ZW5zaW9uLm1hbmFnZXIuZHJvcF90b19pbXBvcnRfZmlsZV9ub3RfZXhpc3RzYCwgeyBwYXRoOiBibG9iLnBhdGggfSk7XG4gICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmluZm8obXNnLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoYGV4dGVuc2lvbi50aXRsZWApLFxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtFZGl0b3IuSTE4bi50KGBleHRlbnNpb24ubWFuYWdlci5jb25maXJtYCldLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g6L+Z6YeM5bqU6K+l5LiN6ZyA6KaBIGF3YWl0XG4gICAgICAgICAgICAvLyBUT0RPOiDlkI7nu63nu5/kuIDov4Hnp7vliLAgY29tcG9zaXRpb24gYXBp77yM5Lul6I635b6X5a6M5pW055qE57G75Z6L5pSv5oyBXG4gICAgICAgICAgICBvbkluc3RhbGwoYmxvYi5wYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZHJhZ2dpbmdPdmVyLFxuXG4gICAgICAgIG9uQXBwRHJhZ2VudGVyLFxuICAgICAgICBvbkFwcERyYWdlbmQsXG4gICAgICAgIG9uQXBwRHJhZ2xlYXZlLFxuICAgICAgICBvbkFwcERyYWdvdmVyLFxuICAgICAgICBvbkFwcERyb3AsXG4gICAgfTtcbn1cbiJdfQ==