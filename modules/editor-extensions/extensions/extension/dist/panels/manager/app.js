"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelApp = exports.updateExtensionOption = void 0;
const fs_1 = require("fs");
const path_1 = __importStar(require("path"));
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
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
    <div class="extension">
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
        <!-- <custom-dialog v-if="extensionDependencies" :info="extensionDependencies" @cancel="dialogCancel"
        @confirm="dialogConfirm"></custom-dialog> -->
    </div>
`;
exports.PanelApp = vue_js_1.default.extend({
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
    inject: {
        ...sdk_1.injectSdk(),
        ...store_1.injectStore(),
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
            this.searchThrottle = lodash_1.throttle(this.handleSearch, 300, { leading: true, trailing: true });
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
                const state = fs_1.statSync(item.extension_path);
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
            const queryRE = new RegExp(lodash_1.escapeRegExp(query));
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
            await utils_1.sleep(100);
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
            if (utils_1.matchInternalName(item.name)) {
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
                        if (!utils_1.matchInternalName(item.name)) {
                            await this.setEnable(item.name, false, item.path);
                            if (item.path !== item.builtInPath) {
                                // 非 builtin 时反注册
                                await Editor.Package.unregister(item.path);
                            }
                        }
                        else {
                            // 反注册全局 builtin 目录下已安装的插件（未启用，因此不会走上面的判断逻辑）
                            const dist = info.installPkgPath ?? path_1.default.resolve(info.installPath, info.name);
                            if (fs_1.existsSync(dist) && this.allPackages.find((pkg) => pkg.path === dist)) {
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
                        if (utils_1.matchInternalName(name)) {
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
                                            version: isUninstalled && utils_1.isOnlineExtension(localItem)
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
                                            version: utils_1.isOnlineExtension(localItem)
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
                    if (utils_1.matchInternalName(name) &&
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
            const packageName = path_1.basename(filePath, '.zip');
            try {
                await this.installPkgTemplate({
                    selectedPath: filePath,
                    importHandler: async () => {
                        return import_1.importPackage(type, filePath, { extensionDisplayName: packageName });
                    },
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    const message = error.message;
                    switch (message) {
                        case import_1.ImportPackageErrorMessage.decompressFail:
                            utils_1.handleDecompressFail(filePath, packageName, true);
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
                            utils_1.handleCancelImport();
                            break;
                        case import_1.ImportPackageErrorMessage.invalidPath:
                            utils_1.handleInvalidPath(selectedPath);
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
                            utils_1.handleUnexpectedImportError(error);
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
                    const dist = await import_1.importPackageFolder(type, folderPath);
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
                    return import_1.importPackageSymlink(type, folderPath);
                },
                selectedPath: folderPath,
            });
        },
    },
    template: template,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9tYW5hZ2VyL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQXdEO0FBQ3hELDZDQUF1RTtBQUN2RSw2REFBa0M7QUFDbEMsb0RBQTRCO0FBQzVCLG1DQUFnRDtBQUVoRCwwREFBaUM7QUFDakMsc0RBQWlDO0FBQ2pDLDBEQUFpQztBQUNqQyx1REFBc0Q7QUFDdEQsOENBQThGO0FBQzlGLCtCQUFrQztBQUNsQyxtQ0FBc0M7QUFDdEMsMkNBQThDO0FBQzlDLDhDQVU0QjtBQUM1QixnREFLNkI7QUFFN0Isc0RBWWdDO0FBQ2hDLGtEQUE0RDtBQVk1RCxpQ0FBaUM7QUFDcEIsUUFBQSxxQkFBcUIsR0FBRztJQUNqQyw4QkFBOEI7SUFDOUIsWUFBWSxFQUFFLEtBQUs7SUFDbkIsdUJBQXVCO0lBQ3ZCLElBQUksRUFBRSxFQUFFO0NBQ1gsQ0FBQztBQUVGLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0STNCLENBQUM7QUFFVyxRQUFBLFFBQVEsR0FBRyxnQkFBRyxDQUFDLE1BQU0sQ0FBQztJQUMvQixJQUFJLEVBQUUsa0JBQWtCO0lBQ3hCLFVBQVUsRUFBRTtRQUNSLFVBQVUsRUFBRSxrQkFBTztRQUNuQixZQUFZLEVBQUUsZ0JBQVM7UUFDdkIsVUFBVSxFQUFFLGtCQUFPO1FBQ25CLGFBQWEsRUFBRSxtQ0FBaUI7UUFDaEMsZUFBZSxFQUFFLHlCQUFZO1FBQzdCLFdBQVcsRUFBWCx3QkFBVztRQUNYLGNBQWMsRUFBZCwyQkFBYztRQUNkLGtC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R0FBRyxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQztZQUV2QixJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNiLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUVwRCxJQUFJLFVBQVUsS0FBSyxFQUFFLEVBQUU7b0JBQ25CLE9BQU87aUJBQ1Y7YUFDSjtZQUVELE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDO2dCQUMxQixZQUFZLEVBQUUsVUFBVTtnQkFDeEIsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUN0QixNQUFNLElBQUksR0FBRyxNQUFNLDRCQUFtQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDekQsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7YUFDSixDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEdBQUcsRUFBRTtZQUMvQixNQUFNLElBQUksR0FBRyxTQUFTLENBQUM7WUFDdkIsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDYixVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxVQUFVLEtBQUssRUFBRSxFQUFFO29CQUNuQixPQUFPLEVBQUUsQ0FBQztpQkFDYjthQUNKO1lBRUQsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUM7Z0JBQzFCLGFBQWEsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDdEIsT0FBTyw2QkFBb0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2xELENBQUM7Z0JBQ0QsWUFBWSxFQUFFLFVBQVU7YUFDM0IsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUNKO0lBQ0QsUUFBUSxFQUFFLFFBQVE7Q0FDckIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoLCB7IGpvaW4sIGJhc2VuYW1lLCBwYXJzZSwgbm9ybWFsaXplLCBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyB0aHJvdHRsZSwgZXNjYXBlUmVnRXhwIH0gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHBrZ05vZGUgZnJvbSAnLi9wa2ctbm9kZSc7XG5pbXBvcnQgcGtnRGV0YWlsIGZyb20gJy4vZGV0YWlsJztcbmltcG9ydCBwa2dMaXN0IGZyb20gJy4vcGtnLWxpc3QnO1xuaW1wb3J0IHsgUGFja2FnZVNlYXJjaExpc3QgfSBmcm9tICcuL3BrZy1zZWFyY2gtbGlzdCc7XG5pbXBvcnQgeyBUYWJEcm9wZG93biwgQ3VzdG9tRGlhbG9nLCBDdXN0b21Ecm9wZG93biwgQ3VzdG9tRHJvcGRvd25JdGVtIH0gZnJvbSAnLi4vY29tcG9uZW50cyc7XG5pbXBvcnQgeyBpbmplY3RTZGsgfSBmcm9tICcuL3Nkayc7XG5pbXBvcnQgeyBpbmplY3RTdG9yZSB9IGZyb20gJy4vc3RvcmUnO1xuaW1wb3J0IHsgSU5URVJOQUxfRVZFTlRTIH0gZnJvbSAnLi9ldmVudC1idXMnO1xuaW1wb3J0IHtcbiAgICBoYW5kbGVDYW5jZWxJbXBvcnQsXG4gICAgaGFuZGxlRGVjb21wcmVzc0ZhaWwsXG4gICAgaGFuZGxlSW52YWxpZFBhdGgsXG4gICAgaGFuZGxlVW5leHBlY3RlZEltcG9ydEVycm9yLFxuICAgIHNsZWVwLFxuICAgIEZBS0VfQVVUSE9SX0lELFxuICAgIGlzT25saW5lRXh0ZW5zaW9uLFxuICAgIG1hdGNoSW50ZXJuYWxOYW1lLFxuICAgIENhbmNlbEVycm9yLFxufSBmcm9tICcuLi8uLi9wdWJsaWMvdXRpbHMnO1xuaW1wb3J0IHtcbiAgICBpbXBvcnRQYWNrYWdlLFxuICAgIGltcG9ydFBhY2thZ2VGb2xkZXIsXG4gICAgaW1wb3J0UGFja2FnZVN5bWxpbmssXG4gICAgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZSxcbn0gZnJvbSAnLi4vLi4vcHVibGljL2ltcG9ydCc7XG5cbmltcG9ydCB7XG4gICAgRXh0ZW5zaW9uRGVwZW5kZW5jaWVzLFxuICAgIEV4dGVuc2lvbkRldGFpbCxcbiAgICBFeHRlbnNpb25JbnN0YWxsZWRQYXRoLFxuICAgIEV4dGVuc2lvbkl0ZW0sXG4gICAgRXh0ZW5zaW9uSXRlbUxvY2FsLFxuICAgIEV4dGVuc2lvbkl0ZW1PbmxpbmUsXG4gICAgRXh0ZW5zaW9uTWFuYWdlclRhYixcbiAgICBFeHRlbnNpb25Tb3VyY2VUeXBlLFxuICAgIFBhY2thZ2VJbmZvLFxuICAgIFNvdXJjZSxcbiAgICBQYWNrYWdlU2VhcmNoR3JvdXAsXG59IGZyb20gJy4uLy4uL3B1YmxpYy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgTGFzdEltcG9ydEZvbGRlclBhdGggfSBmcm9tICcuLi8uLi9zaGFyZWQvcHJvZmlsZSc7XG5pbXBvcnQge1xuICAgIE1hbmFnZXIsXG4gICAgSUV4dGVuc2lvbkxpc3RSZXNwb25zZSxcbiAgICBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSxcbiAgICBJRXh0ZW5zaW9uQ29uZmlnLFxuICAgIElFeHRlbnNpb25MaXN0UGFyYW1zLFxuICAgIElMb2NhbEV4dGVuc2lvbkRldGFpbCxcbn0gZnJvbSAnQGVkaXRvci9leHRlbnNpb24tc2RrJztcblxudHlwZSBFZGl0b3JQa2dJbmZvID0gRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbztcblxuLyoqIOaYr+WQpuWcqOWFs+mXremhtemdoueahOaXtuWAmemHjeaWsOazqOWGjGV4dGVuc2lvbiAoKSAqL1xuZXhwb3J0IGNvbnN0IHVwZGF0ZUV4dGVuc2lvbk9wdGlvbiA9IHtcbiAgICAvKiog5piv5ZCm5Zyo5YWz6Zet6aG16Z2i55qE5pe25YCZ6YeN5paw5rOo5YaMZXh0ZW5zaW9uICovXG4gICAgaXNSZVJlZ2lzdGVyOiBmYWxzZSxcbiAgICAvKiogZXh0ZW5zaW9u55qE5Y2H57qn5YyF55qE5Zyw5Z2AICovXG4gICAgcGF0aDogJycsXG59O1xuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuICAgIDxkaXYgY2xhc3M9XCJleHRlbnNpb25cIj5cbiAgICAgICAgPCEtLSA8ZGl2IGNsYXNzPVwiZXh0ZW5zaW9uLWxheW91dFwiPiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxpc3QtbGF5b3V0XCI+XG4gICAgICAgICAgICA8aGVhZGVyIGNsYXNzPVwiaGVhZGVyXCIgdi1zaG93PVwiIWlzU2hvd1NlYXJjaGluZ1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJlbnRyeS10YWJzXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0YWItZHJvcGRvd25cbiAgICAgICAgICAgICAgICAgICAgICAgIHYtZm9yPVwiKHRhYiwgaW5kZXgpIGluIHRhYnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOmtleT1cInRhYi5pZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6YWN0aXZlLWxhYmVsPVwiYWN0aXZlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDpsYWJlbD1cInRhYi5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6Y2hpbGRyZW49XCJ0YWIuY2hpbGRyZW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgQHNlbGVjdD1cIm9uVGFiU2VsZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgPjwvdGFiLWRyb3Bkb3duPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidHJhbnNwYXJlbnQgZmVhdHVyZS1jb2wgZmVhdHVyZS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcD1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuc2VhcmNoX2V4dGVuc2lvbnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGNsaWNrPVwic3dpdGNoU2VhcmNoU3RhdHVzKClcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktaWNvbiB2YWx1ZT1cInNlYXJjaFwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgPEN1c3RvbURyb3Bkb3duIGNsYXNzPVwiYnV0dG9uLWdyb3VwIGZlYXR1cmUtY29sXCIgc2l6ZT1cIm1pbmlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50IGZlYXR1cmUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5pbXBvcnRfZXh0ZW5zaW9uc196aXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljay5zdG9wPVwiaW5zdGFsbCgpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktaWNvbiB2YWx1ZT1cImltcG9ydFwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGVtcGxhdGUgI292ZXJsYXk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEN1c3RvbURyb3Bkb3duSXRlbSBAY2xpY2s9XCJpbnN0YWxsUGtnRm9sZGVyKClcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3sgdCgnaW1wb3J0X2V4dGVuc2lvbnNfZm9sZGVyJykgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0N1c3RvbURyb3Bkb3duSXRlbT5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93bkl0ZW0gQGNsaWNrPVwiaW5zdGFsbFBrZ0RldigpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7IHQoJ2ltcG9ydF9leHRlbnNpb25zX2RldicpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9DdXN0b21Ecm9wZG93bkl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICA8L0N1c3RvbURyb3Bkb3duPlxuXG4gICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidHJhbnNwYXJlbnQgZmVhdHVyZS1jb2wgZmVhdHVyZS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcD1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIucmVmcmVzaF9leHRlbnNpb25zXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljay5zdG9wPVwicmVmcmVzaExpc3QoKVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1pY29uIHZhbHVlPVwicmVmcmVzaFwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2hlYWRlcj5cbiAgICAgICAgICAgIDxoZWFkZXIgY2xhc3M9XCJoZWFkZXJcIiB2LXNob3c9XCJpc1Nob3dTZWFyY2hpbmdcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VhcmNoXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1pbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdy1jbGVhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPVwic2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGNoYW5nZT1cImRvU2VhcmNoKCRldmVudClcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGJsdXI9XCJvblNlYXJjaEJsdXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOnZhbHVlPVwic2VhcmNoS2V5XCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8L3VpLWlucHV0PlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLmV4aXRfc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljay5zdG9wPVwic3dpdGNoU2VhcmNoU3RhdHVzKClcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgdmFsdWU9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLmNhbmNlbFwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgdi1zaG93PVwiIWlzU2hvd1NlYXJjaGluZyAmJiBhY3RpdmUgPT09IGl0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgIHYtZm9yPVwiaXRlbSBvZiBmbGF0VGFic1wiXG4gICAgICAgICAgICAgICAgOmtleT1cIml0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibGlzdFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHBrZy1saXN0XG4gICAgICAgICAgICAgICAgICAgIDpyZWY9XCJpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICAgICAgOmxhYmVsPVwiaXRlbS5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgIDphY3RpdmU9XCIhaXNTaG93U2VhcmNoaW5nICYmIGFjdGl2ZSA9PT0gaXRlbS5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgIEByZWZyZXNoPVwicmVmcmVzaExpc3RcIlxuICAgICAgICAgICAgICAgICAgICA6cGFnZS1zaXplPVwicGFnZVNpemVcIlxuICAgICAgICAgICAgICAgICAgICA6Y2hvb3NlZD1cImN1cnJlbnRQYWNrYWdlID8gY3VycmVudFBhY2thZ2UubmFtZSA6ICcnXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1saXN0PVwidXBkYXRlTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIEBjaG9vc2U9XCJjaG9vc2VcIlxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlLXBhY2thZ2U9XCJ1cGRhdGVQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHJlbW92ZS1wYWNrYWdlPVwicmVtb3ZlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEB1bmluc3RhbGwtcGFja2FnZT1cInVuaW5zdGFsbFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAc2V0LWVuYWJsZT1cInNldEVuYWJsZVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvcGtnLWxpc3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsaXN0XCIgdi1zaG93PVwiaXNTaG93U2VhcmNoaW5nXCI+XG4gICAgICAgICAgICAgICAgPHBrZy1zZWFyY2gtbGlzdFxuICAgICAgICAgICAgICAgICAgICByZWY9XCJzZWFyY2hfbGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPVwic2VhcmNoX2xpc3RcIlxuICAgICAgICAgICAgICAgICAgICA6aXMtc2VhcmNoPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgICAgIDphY3RpdmU9XCJpc1Nob3dTZWFyY2hpbmdcIlxuICAgICAgICAgICAgICAgICAgICBAcmVmcmVzaD1cInJlZnJlc2hMaXN0XCJcbiAgICAgICAgICAgICAgICAgICAgOnNlYXJjaC1rZXk9XCJzZWFyY2hLZXlcIlxuICAgICAgICAgICAgICAgICAgICA6cGFnZS1zaXplPVwicGFnZVNpemVcIlxuICAgICAgICAgICAgICAgICAgICA6Y2hvb3NlZD1cImN1cnJlbnRQYWNrYWdlID8gY3VycmVudFBhY2thZ2UubmFtZSA6ICcnXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1saXN0PVwidXBkYXRlTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIEBjaG9vc2U9XCJjaG9vc2VcIlxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlLXBhY2thZ2U9XCJ1cGRhdGVQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHJlbW92ZS1wYWNrYWdlPVwicmVtb3ZlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEB1bmluc3RhbGwtcGFja2FnZT1cInVuaW5zdGFsbFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAc2V0LWVuYWJsZT1cInNldEVuYWJsZVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvcGtnLXNlYXJjaC1saXN0PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZGV0YWlsLWxheW91dFwiPlxuICAgICAgICAgICAgPHBrZy1kZXRhaWxcbiAgICAgICAgICAgICAgICA6ZGV0YWlsPVwiY3VycmVudFBhY2thZ2VEZXRhaWxcIlxuICAgICAgICAgICAgICAgIDppbmZvPVwiY3VycmVudFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgIDpsb2FkaW5nPVwiZ2V0RGV0YWlsTG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgOmVycm9yLW1lc3NhZ2U9XCJkZXRhaWxFcnJvck1lc3NhZ2VcIlxuICAgICAgICAgICAgICAgIEByZWZyZXNoPVwicmVmcmVzaERldGFpbFwiXG4gICAgICAgICAgICA+PC9wa2ctZGV0YWlsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPCEtLSA8L2Rpdj4gLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbXBvcnQtbG9hZGluZy1sYXlvdXRcIiB2LWlmPVwiaW1wb3J0TG9hZGluZ1wiPlxuICAgICAgICAgICAgPHVpLWxvYWRpbmc+PC91aS1sb2FkaW5nPlxuICAgICAgICAgICAgPHVpLWxhYmVsIHYtaWY9XCJpbXBvcnRFcnJvck1lc3NhZ2VcIiB2YWx1ZT1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuaW1wb3J0X2Vycm9yX3RpcFwiPiA8L3VpLWxhYmVsPlxuICAgICAgICAgICAgPGRpdiB2LWlmPVwiaW1wb3J0RXJyb3JNZXNzYWdlXCI+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBjbGFzcz1cInRyYW5zcGFyZW50XCIgQGNsaWNrPVwiY2FuY2VsUmV0cnlJbXBvcnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5jYW5jZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gQGNsaWNrPVwicmV0cnlJbXBvcnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5yZXRyeVwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwhLS0gPGN1c3RvbS1kaWFsb2cgdi1pZj1cImV4dGVuc2lvbkRlcGVuZGVuY2llc1wiIDppbmZvPVwiZXh0ZW5zaW9uRGVwZW5kZW5jaWVzXCIgQGNhbmNlbD1cImRpYWxvZ0NhbmNlbFwiXG4gICAgICAgIEBjb25maXJtPVwiZGlhbG9nQ29uZmlybVwiPjwvY3VzdG9tLWRpYWxvZz4gLS0+XG4gICAgPC9kaXY+XG5gO1xuXG5leHBvcnQgY29uc3QgUGFuZWxBcHAgPSBWdWUuZXh0ZW5kKHtcbiAgICBuYW1lOiAnRXh0ZW5zaW9uTWFuYWdlcicsXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICAncGtnLW5vZGUnOiBwa2dOb2RlLFxuICAgICAgICAncGtnLWRldGFpbCc6IHBrZ0RldGFpbCxcbiAgICAgICAgJ3BrZy1saXN0JzogcGtnTGlzdCxcbiAgICAgICAgUGtnU2VhcmNoTGlzdDogUGFja2FnZVNlYXJjaExpc3QsXG4gICAgICAgICdjdXN0b20tZGlhbG9nJzogQ3VzdG9tRGlhbG9nLFxuICAgICAgICBUYWJEcm9wZG93bixcbiAgICAgICAgQ3VzdG9tRHJvcGRvd24sXG4gICAgICAgIEN1c3RvbURyb3Bkb3duSXRlbSxcbiAgICB9LFxuICAgIGluamVjdDoge1xuICAgICAgICAuLi5pbmplY3RTZGsoKSxcblxuICAgICAgICAuLi5pbmplY3RTdG9yZSgpLFxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKiDpobXnrb7liJfooajvvIzmmoLml7bpmpDol4/kuoblt7LotK3kubAgKi9cbiAgICAgICAgICAgIHRhYnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zLFxuICAgICAgICAgICAgICAgICAgICBpZDogMSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlB1cmNoYXNlZCxcbiAgICAgICAgICAgICAgICAvLyAgICAgaWQ6IDIsXG4gICAgICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IDMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAvKiog5omB5bmz5YyW5ZCO55qE6aG1562+77yM55So5LqO5riy5p+T5a6e6ZmF6aG16Z2iICovXG4gICAgICAgICAgICBmbGF0VGFiczogW10gYXMgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiB9W10sXG4gICAgICAgICAgICAvKiog5b2T5YmN5omA5pi+56S655qE6aG1562+ICovXG4gICAgICAgICAgICBhY3RpdmU6IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgIC8qKiDlvZPliY3pgInkuK3nmoTmj5Lku7YgKi9cbiAgICAgICAgICAgIGN1cnJlbnRQYWNrYWdlOiBudWxsIGFzIEV4dGVuc2lvbkl0ZW0gfCBudWxsLFxuICAgICAgICAgICAgLyoqIOW9k+WJjemAieS4reeahOaPkuS7tueahOivpuaDhSAqL1xuICAgICAgICAgICAgY3VycmVudFBhY2thZ2VEZXRhaWw6IG51bGwgYXMgRXh0ZW5zaW9uRGV0YWlsIHwgbnVsbCxcbiAgICAgICAgICAgIC8qKiDojrflj5bmj5Lku7bor6bmg4XnmoTmiqXplJkgKi9cbiAgICAgICAgICAgIGRldGFpbEVycm9yTWVzc2FnZTogJycsXG4gICAgICAgICAgICAvKiog5piv5ZCm5aSE5Zyo5pCc57Si5qCP5LitICovXG4gICAgICAgICAgICBpc1Nob3dTZWFyY2hpbmc6IGZhbHNlLFxuICAgICAgICAgICAgLyoqIOaQnOe0oumhtemdoueahOaJgOWkhOWIl+ihqOmhtSovXG4gICAgICAgICAgICBwYWdlOiAxLFxuICAgICAgICAgICAgLyoqIOavj+asoeWKoOi9veadoeaVsCAg55uu5YmN55Sx5LqO5YaF572u5o+S5Lu25ZKM5bey5a6J6KOF5o+S5Lu26ZyA6KaB5LqL5YWI5omr5o+P5Ye65YWo6YOo77yM5Zug5q2k5pqC5pe25LiN5YGa5YiG6aG15aSE55CGKi9cbiAgICAgICAgICAgIHBhZ2VTaXplOiA5OTk5OSxcbiAgICAgICAgICAgIC8qKiDmupDliJfooaggKi9cbiAgICAgICAgICAgIHNvdXJjZUxpc3Q6IFtdIGFzIFNvdXJjZVtdLFxuICAgICAgICAgICAgLyoqIOiOt+WPluivpuaDheeahExvYWRpbmcgKi9cbiAgICAgICAgICAgIGdldERldGFpbExvYWRpbmc6IGZhbHNlLFxuXG4gICAgICAgICAgICAvKiog5pCc57Si5YWz6ZSu5a2XICovXG4gICAgICAgICAgICBzZWFyY2hLZXk6ICcnLFxuICAgICAgICAgICAgLyoqIOaQnOe0ouaXtumXtOaIs+OAguavj+asoeaQnOe0ouaTjeS9nOeahOagh+iusO+8jOeUqOS6juWunueOsCBzd2l0Y2gg5pWI5p6cICovXG4gICAgICAgICAgICBzZWFyY2hUaW1lc3RhbXA6IC0xLFxuICAgICAgICAgICAgLyoqIOaQnOe0oueahOiKgua1gSAqL1xuICAgICAgICAgICAgc2VhcmNoVGhyb3R0bGU6IG51bGwgYXMgbnVsbCB8ICgoLi4uYXJnczogYW55KSA9PiB2b2lkKSxcblxuICAgICAgICAgICAgLyoqIOW3suWuieijheeahOWIl+ihqCwg5LiT5oyHaW5zdGFsbGVk6aG1562+5LiL55qE5YiX6KGo77yM5Lmf5bCx5piv6Z2e5YaF572u55qE5o+S5Lu2ICovXG4gICAgICAgICAgICBpbnN0YWxsZWRMaXN0OiBbXSBhcyBFeHRlbnNpb25JdGVtW10sXG4gICAgICAgICAgICAvKiogRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKeaJq+aPj+WHuuadpeeahOaJgOacieaPkuS7tiAqL1xuICAgICAgICAgICAgYWxsUGFja2FnZXM6IFtdIGFzIEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm9bXSxcbiAgICAgICAgICAgIC8qKiDmj5Lku7bkvp3otZbnmoTlvLnnqpfpmJ/liJcgKi9cbiAgICAgICAgICAgIGV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3Q6IFtdIGFzIEV4dGVuc2lvbkRlcGVuZGVuY2llc1tdLFxuICAgICAgICAgICAgLyoqIOaPkuS7tuS+nei1lueahOW8ueeql+S/oeaBryAqL1xuICAgICAgICAgICAgZXh0ZW5zaW9uRGVwZW5kZW5jaWVzOiBudWxsIGFzIEV4dGVuc2lvbkRlcGVuZGVuY2llcyB8IG51bGwsXG4gICAgICAgICAgICAvKiog5a+85YWl5o+S5Lu25pe255qE5oql6ZSZ5L+h5oGvICovXG4gICAgICAgICAgICBpbXBvcnRFcnJvck1lc3NhZ2U6ICcnLFxuICAgICAgICAgICAgLyoqIOWvvOWFpeaPkuS7tuaXtueahGxvYWRpbmfnirbmgIEgKi9cbiAgICAgICAgICAgIGltcG9ydExvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgLyoqIOWvvOWFpeaPkuS7tueahOi3r+W+hOe8k+WtmO+8jOeUqOS6juWQjue7reeahOmHjeivleWvvOWFpSAqL1xuICAgICAgICAgICAgaW1wb3J0UGF0aENhY2hlOiAnJyxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIC8qKiDlvZPliY3nmoTkvp3otZbmj5Lku7bnmoTlvLnnqpfkv6Hmga/vvIznlKjkuo7op6blj5HlvLnnqpfpmJ/liJcgKi9cbiAgICAgICAgZXh0ZW5zaW9uRGVwZW5kZW5jaWVzKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlICYmIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMgPSB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3Quc2hpZnQoKSE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBjcmVhdGVkKCkge1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdlbmFibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2Rpc2FibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIEVkaXRvci5NZXNzYWdlLl9fcHJvdGVjdGVkX18uYWRkQnJvYWRjYXN0TGlzdGVuZXIoJ2kxOG46Y2hhbmdlJywgdGhpcy5vbkkxOG5DaGFuZ2UpO1xuICAgIH0sXG4gICAgbW91bnRlZCgpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVGbGF0VGFicygpO1xuICAgICAgICB0aGlzLmluaXQoKTtcblxuICAgICAgICAvLyDmlK/mjIHlnKggcGFuZWwg5omT5byA5pe25oyH5a6a5pCc57Si54q25oCBXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBQYXJhbXMgPSB0aGlzLnN0b3JlLnN0YXJ0dXBQYXJhbXMudmFsdWU7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RhcnR1cFBhcmFtcy5zZWFyY2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLm9uU2VhcmNoRXZlbnQoc3RhcnR1cFBhcmFtcy5zZWFyY2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRklYTUU6IOS4jeW6lOWwhiB2dWUg5L2c5Li65LqL5Lu25oC757q/44CC5ZCO57ut6ICD6JmR5byV5YWlIHJ4anMg5p2l5aSE55CGXG4gICAgICAgIHRoaXMuJHJvb3QuJG9uKElOVEVSTkFMX0VWRU5UUy5zZWFyY2gsIHRoaXMub25TZWFyY2hFdmVudCk7XG4gICAgfSxcbiAgICBiZWZvcmVEZXN0cm95KCkge1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdlbmFibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ucmVtb3ZlTGlzdGVuZXIoJ2Rpc2FibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIHRoaXMuJHJvb3QuJG9mZihJTlRFUk5BTF9FVkVOVFMuc2VhcmNoLCB0aGlzLm9uU2VhcmNoRXZlbnQpO1xuICAgICAgICBFZGl0b3IuTWVzc2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUJyb2FkY2FzdExpc3RlbmVyKCdpMThuOmNoYW5nZScsIHRoaXMub25JMThuQ2hhbmdlKTtcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOe/u+ivkVxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxuICAgICAgICAgKi9cbiAgICAgICAgdChrZXk6IHN0cmluZywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gICAgICAgICAgICBFZGl0b3IuSTE4bi5nZXRMYW5ndWFnZTtcbiAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KGBleHRlbnNpb24ubWFuYWdlci4ke2tleX1gLCBwYXJhbXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGN1ckxhbmd1YWdlKCk6ICd6aCcgfCAnZW4nIHtcbiAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi5nZXRMYW5ndWFnZSgpIGFzICd6aCcgfCAnZW4nO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uSTE4bkNoYW5nZSgpIHtcbiAgICAgICAgICAgIC8vIHRoaXMucmVmcmVzaERldGFpbCgpO1xuICAgICAgICAgICAgLy8gcmVmcmVzaExpc3Qg5Lya6Ieq5Yqo6YCJ5Lit5YiX6KGo56ys5LiA6aG577yM5LiN5LiA5a6a5piv55So5oi35pyf5pyb55qE6KGM5Li6XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hMaXN0KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWIneWni+WMliAqL1xuICAgICAgICBhc3luYyBpbml0KCkge1xuICAgICAgICAgICAgLy8gdGhpcy5zb3VyY2VMaXN0ID0gYXdhaXQgU0RLLmdldFNvdXJjZUxpc3QoKTtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGVkTGlzdCA9IGF3YWl0IHRoaXMuc2NhbkxvY2FsKCk7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRoaXMudGFic1swXS5sYWJlbDtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVGhyb3R0bGUgPSB0aHJvdHRsZSh0aGlzLmhhbmRsZVNlYXJjaCwgMzAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmi43lubPltYzlpZfnu5PmnoTnmoTpobXnrb7mlbDnu4QgKi9cbiAgICAgICAgaGFuZGxlRmxhdFRhYnMoKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbjogTWFwPHN0cmluZywgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiB9PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHRhYnM6IHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIgfVtdID0gW107XG4gICAgICAgICAgICB0aGlzLnRhYnMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHRhYnMucHVzaCh7IGxhYmVsOiBpdGVtLmxhYmVsIH0pO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4uZm9yRWFjaCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYubGFiZWwgIT09IGl0ZW0ubGFiZWwpIGNoaWxkcmVuLnNldCh2LmxhYmVsLCB7IGxhYmVsOiB2LmxhYmVsIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNoaWxkcmVuLmZvckVhY2goKHYpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRhYnMuZmluZCgoZSkgPT4gZS5sYWJlbCA9PT0gdi5sYWJlbCkpIHRhYnMucHVzaCh7IGxhYmVsOiB2LmxhYmVsIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmZsYXRUYWJzID0gdGFicztcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog6YCJ5Lit5o+S5Lu2ICovXG4gICAgICAgIGFzeW5jIGNob29zZShwa2c6IEV4dGVuc2lvbkl0ZW0gfCB1bmRlZmluZWQgfCBudWxsKSB7XG4gICAgICAgICAgICAvLyDkvKDlhaXnqbrlgLzml7bph43nva4gY3VycmVudCDmlbDmja5cbiAgICAgICAgICAgIGlmIChwa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKHBrZyAmJiAhdGhpcy5jdXJyZW50UGFja2FnZSkgfHxcbiAgICAgICAgICAgICAgICAhdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCB8fFxuICAgICAgICAgICAgICAgIHBrZy5uYW1lICE9PSB0aGlzLmN1cnJlbnRQYWNrYWdlPy5uYW1lIHx8XG4gICAgICAgICAgICAgICAgcGtnLnZlcnNpb24gIT09IHRoaXMuY3VycmVudFBhY2thZ2UudmVyc2lvbiB8fFxuICAgICAgICAgICAgICAgIHBrZy52ZXJzaW9uICE9PSB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsLnZlcnNpb25cbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UGFja2FnZURldGFpbChwa2cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmuIXpmaTlvZPliY3nmoTpgInkuK3or6bmg4UgKi9cbiAgICAgICAgY2xlYXJDdXJyZW50RGV0YWlsKCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZGV0YWlsRXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICB0aGlzLmdldERldGFpbExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog6I635Y+W5o+S5Lu26K+m5oOFICovXG4gICAgICAgIGdldFBhY2thZ2VEZXRhaWwoaXRlbTogRXh0ZW5zaW9uSXRlbSkge1xuICAgICAgICAgICAgdGhpcy5nZXREZXRhaWxMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2UgPSB7IC4uLml0ZW0gfTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5kZXRhaWxFcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgLy8gVE9ETzog6K+t6KiA5Y+Y5YyW5ZCO5pu05pawIGRldGFpbCDlhoXlrrlcbiAgICAgICAgICAgICAgICBsYW5nOiB0aGlzLmN1ckxhbmd1YWdlKCksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgLmdldEV4dGVuc2lvbkRldGFpbChwYXJhbSlcbiAgICAgICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMgJiYgdHlwZW9mIHJlcy5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiByZXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogcmVzLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hfYXQ6IHJlcy5wdWJsaXNoX2F0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uX2xpbWl0OiByZXMuZWRpdG9yX2xpbWl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHJlcy5kZXRhaWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IHJlcy5zaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uX3VybDogcmVzLmljb25fdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5jdXJyZW50UGFja2FnZS52ZXJzaW9uID0gcmVzLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS5wYXRoICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5TG9jYWxFeHRlbnNpb25EZXRhaWwoaXRlbS5wYXRoLCB0aGlzLmN1ckxhbmd1YWdlKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGRldGFpbDogSUxvY2FsRXh0ZW5zaW9uRGV0YWlsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWwgJiYgdHlwZW9mIGRldGFpbC5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRob3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBGQUtFX0FVVEhPUl9JRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldGFpbC5hdXRob3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldGFpbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBkZXRhaWwudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaF9hdDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbl9saW1pdDogZGV0YWlsLmVkaXRvcl9saW1pdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBkZXRhaWwuZGV0YWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiByZXMuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6IHJlcy5pY29uX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2UudmVyc2lvbiA9IGRldGFpbC52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWlsRXJyb3JNZXNzYWdlID0gdGhpcy50KCdkZXRhaWxfZXJyb3JfdGlwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWlsRXJyb3JNZXNzYWdlID0gdGhpcy50KCduZXR3b3JrX2Vycm9yX3RpcCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFja2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoX2F0OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uX2xpbWl0OiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6IGl0ZW0uaWNvbl91cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlLnZlcnNpb24gPSBpdGVtLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0YWlsRXJyb3JNZXNzYWdlID0gdGhpcy50KCduZXR3b3JrX2Vycm9yX3RpcCcpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0RGV0YWlsTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlkK/nlKgv5YWz6Zet5o+S5Lu2XG4gICAgICAgICAqIEBwYXJhbSBuYW1lIOaPkuS7tuWQjVxuICAgICAgICAgKiBAcGFyYW0gZW5hYmxlIOiuvue9ruaPkuS7tueahOW8gOWQr+eKtuaAge+8jHRydWUg5byA5ZCv77yMZmFsc2Ug5YWz6ZetXG4gICAgICAgICAqIEBwYXJhbSBwYXRoIOaPkuS7tui3r+W+hFxuICAgICAgICAgKiBAcmV0dXJuc1xuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgc2V0RW5hYmxlKG5hbWU6IHN0cmluZywgZW5hYmxlOiBib29sZWFuLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5lbmFibGUocGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZGlzYWJsZShwYXRoLCB7fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2V4dGVuc2lvbicsICdlbmFibGUnLCBwYXRoLCAhZW5hYmxlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0aXAgPSBlbmFibGUgPyAnZGlzYWJsZV9lcnJvcl90aXAnIDogJ2VuYWJsZV9lcnJvcl90aXAnO1xuICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IodGhpcy50KHRpcCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiog55SxRWRpdG9yLlBhY2thZ2Uub27nm5HlkKzliLDliIfmjaLmiJDlip/lkI7nmoTlm57osIMgKi9cbiAgICAgICAgdG9nZ2xlRW5hYmxlSGFuZGxlKGl0ZW06IEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm8pIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG5cbiAgICAgICAgICAgICAgICBlbC50b2dnbGVFbmFibGVIYW5kbGUoaXRlbSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIEZJWE1FOiDlhbPkuo7ov5nph4zlr7nkuo4gdGhpcy5pbnN0YWxsZWRMaXN0IOaVsOaNrueahOabtOaWsO+8jCDnm67liY3lroPlkowgSW5zdGFsbGVkIGxpc3Qg6aG16Z2i55qEIGxpc3Qg5pWw5o2u5piv5YWx5Lqr55qE77yM6KaB5rOo5oSP44CCXG4gICAgICAgICAgICAvLyDmm7TmlrDmk43kvZzmmoLml7bkuqTnlLEgbGlzdCDnu4Tku7bmnaXlrozmiJDmm7TmlrDvvIzov5nph4zkuI3lho3lgZrlhpfkvZnmm7TmlrDkuobjgIJcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5Yi35paw5b2T5YmN6K+m5oOFICovXG4gICAgICAgIHJlZnJlc2hEZXRhaWwoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFja2FnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UGFja2FnZURldGFpbCh0aGlzLmN1cnJlbnRQYWNrYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvblRhYlNlbGVjdCh0YWI6IEV4dGVuc2lvbk1hbmFnZXJUYWIpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdGFiO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliIfmjaLmkJzntKLnirbmgIEgKi9cbiAgICAgICAgc3dpdGNoU2VhcmNoU3RhdHVzKHNlYXJjaGluZz86IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIHRoaXMuaXNTaG93U2VhcmNoaW5nID0gdHlwZW9mIHNlYXJjaGluZyA9PT0gJ2Jvb2xlYW4nID8gc2VhcmNoaW5nIDogIXRoaXMuaXNTaG93U2VhcmNoaW5nO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hLZXkgPSAnJztcbiAgICAgICAgICAgIGlmICh0aGlzLmlzU2hvd1NlYXJjaGluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAodGhpcy4kcmVmcy5zZWFyY2ggYXMgSFRNTElucHV0RWxlbWVudCkuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2hdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5bCGc2Rr5omr5o+P5Ye655qE5pys5Zyw5o+S5Lu277yM5LiORWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKeW+l+WIsOeahOaPkuS7tui/m+ihjOi/h+a7pOWSjOWkhOeQhiAqL1xuICAgICAgICBmb3JtYXRJbnN0YWxsZWRFeHRlbnNpb24oaXRlbTogSUV4dGVuc2lvbkNvbmZpZyk6IEV4dGVuc2lvbkl0ZW1Mb2NhbCB7XG4gICAgICAgICAgICBjb25zdCBwa2cgPSB0aGlzLmFsbFBhY2thZ2VzLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lICYmIHRoaXMuY2hlY2tQYXRoVHlwZSh2LnBhdGgpID09PSAnbG9jYWwnKTtcbiAgICAgICAgICAgIGNvbnN0IGlzQ29jb3NTb3VyY2UgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbjogRXh0ZW5zaW9uSXRlbUxvY2FsID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgaWNvbl91cmw6IGl0ZW0uaWNvbl91cmwsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgZW5hYmxlOiBwa2cgPyBwa2cuZW5hYmxlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgaXNJbnN0YWxsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgc3RhdGU6ICdub25lJyxcbiAgICAgICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgICAgICBwYXRoOiBpdGVtLmV4dGVuc2lvbl9wYXRoLFxuICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChwa2c/LmluZm8uYXV0aG9yKSB7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uLmF1dGhvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IEZBS0VfQVVUSE9SX0lELFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBwa2cuaW5mby5hdXRob3IsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHN0YXRTeW5jKGl0ZW0uZXh0ZW5zaW9uX3BhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSAmJiB0eXBlb2Ygc3RhdGUubXRpbWVNcyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uWydtdGltZSddID0gc3RhdGUubXRpbWVNcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHsgfVxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5aSE55CG572R57uc6K+35rGC5Lit6I635Y+W5Yiw55qE5a6Y5pa55o+S5Lu25L+h5oGv77yM5ZCM5pe25a6Y5pa55o+S5Lu25pyJ5Y+v6IO95Lmf5piv5YaF572u5o+S5Lu2ICovXG4gICAgICAgIGZvcm1hdE5ldEV4dGVuc2lvbihpdGVtOiBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSk6IEV4dGVuc2lvbkl0ZW1PbmxpbmUge1xuICAgICAgICAgICAgY29uc3QgaXNDb2Nvc1NvdXJjZSA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIOWFiOajgOa1iyBsYWJlbCDmmK/lkKbmnIkgYnVpbHRpblxuICAgICAgICAgICAgbGV0IGlzQnVpbHRJbiA9XG4gICAgICAgICAgICAgICAgaXRlbS5sYWJlbCAmJiBpdGVtLmxhYmVsLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICA/IGl0ZW0ubGFiZWwuZmluZEluZGV4KCh2KSA9PiB2ID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4pID4gLTFcbiAgICAgICAgICAgICAgICAgICAgOiBmYWxzZTtcblxuICAgICAgICAgICAgbGV0IGJ1aWx0aW5Qa2c6IEVkaXRvclBrZ0luZm8gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgY292ZXJQa2c6IEVkaXRvclBrZ0luZm8gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAvLyDlpITkuo4gZW5hYmxlZCDnirbmgIHnmoQgY292ZXIg57G75Z6L5o+S5Lu2XG4gICAgICAgICAgICBsZXQgY292ZXJQa2dFbmFibGVkOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IGxvY2FsUGtnOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAvLyDmj5Lku7bnmoQgcGF0aCB0eXBlIOaYryBidWlsdGluIOaIliBjb3ZlciDnmoTkuZ/nrpcgYnVpbHRpbu+8jOi/memHjOaKiuWug+S7rOaJvuWHuuadpeOAglxuICAgICAgICAgICAgLy8g6YGN5Y6G5LiA5qyh77yM5a+75om+6ZyA6KaB55qE5o+S5Lu25pWw5o2u44CC5Y+q5L2/55So56ys5LiA5Liq5om+5Yiw55qE5pWw5o2u77yI5Y+q6L+b6KGM5LiA5qyh6LWL5YC8XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBrZyBvZiB0aGlzLmFsbFBhY2thZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBrZy5uYW1lICE9PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aFR5cGUgPSB0aGlzLmNoZWNrUGF0aFR5cGUocGtnLnBhdGgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwYXRoVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdidWlsdGluJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ1aWx0aW5Qa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0aW5Qa2cgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY292ZXInOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY292ZXJQa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdmVyUGtnID0gcGtnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBrZy5lbmFibGUgJiYgY292ZXJQa2dFbmFibGVkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3ZlclBrZ0VuYWJsZWQgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xvY2FsJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsUGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFBrZyA9IHBrZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWFqOmDveaJvuWIsOaVsOaNru+8jOWBnOatouafpeaJvlxuICAgICAgICAgICAgICAgIGlmIChidWlsdGluUGtnICE9IG51bGwgJiYgY292ZXJQa2cgIT0gbnVsbCAmJiBsb2NhbFBrZyAhPSBudWxsICYmIGNvdmVyUGtnRW5hYmxlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXNCdWlsdEluID0gaXNCdWlsdEluIHx8IGJ1aWx0aW5Qa2cgIT0gbnVsbCB8fCBjb3ZlclBrZyAhPSBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCBwa2cgPSBpc0J1aWx0SW4gPyBidWlsdGluUGtnIDogbG9jYWxQa2c7XG5cbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbkl0ZW06IEV4dGVuc2lvbkl0ZW1PbmxpbmUgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHBrZyA/IHBrZy52ZXJzaW9uIDogaXRlbS5sYXRlc3RfdmVyc2lvbixcbiAgICAgICAgICAgICAgICBpY29uX3VybDogaXRlbS5pY29uX3VybCxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXRlbS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBlbmFibGU6IHBrZz8uZW5hYmxlID8/IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkOiBwa2cgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbGF0ZXN0X3ZlcnNpb246IGl0ZW0ubGF0ZXN0X3ZlcnNpb24sXG4gICAgICAgICAgICAgICAgbGF0ZXN0X2Rlc2NyaXB0aW9uOiBpdGVtLmxhdGVzdF9kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICB1cGRhdGVfYXQ6IGl0ZW0udXBkYXRlX2F0LFxuICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgcGF0aDogcGtnID8gcGtnLnBhdGggOiAnJyxcbiAgICAgICAgICAgICAgICBpc0J1aWx0SW4sXG4gICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uSXRlbS5pc0J1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLmJ1aWx0SW5QYXRoID0gZXh0ZW5zaW9uSXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0uYnVpbHRJblZlcnNpb24gPSBleHRlbnNpb25JdGVtLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICBpZiAoY292ZXJQa2dFbmFibGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bey5ZCv55So55qE5YWo5bGA6KaG55uW5a6J6KOF5YaF572u5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0udmVyc2lvbiA9IGNvdmVyUGtnRW5hYmxlZC52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLnBhdGggPSBjb3ZlclBrZ0VuYWJsZWQucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5lbmFibGUgPSBjb3ZlclBrZ0VuYWJsZWQuZW5hYmxlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY292ZXJQa2cgIT0gbnVsbCAmJiBleHRlbnNpb25JdGVtLmVuYWJsZSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnvJbovpHlmajlhoXnva7niYjmnKzmnKrlkK/nlKjvvIzkuJTlrZjlnKjlhajlsYDopobnm5blronoo4XnmoTlhoXnva7mj5Lku7bvvIjkuI3kuIDlrprlkK/nlKjvvInvvIzopobnm5bmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS52ZXJzaW9uID0gY292ZXJQa2cudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5wYXRoID0gY292ZXJQa2cucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5lbmFibGUgPSBjb3ZlclBrZy5lbmFibGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbkl0ZW07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOiOt+WPlue9kee7nOS4iueahOWGhee9ruaPkuS7tuWIl+ihqOWQju+8jOS4juacrOWcsOWGhee9ruaPkuS7tuWIl+ihqOi/m+ihjOWQiOW5tiAqL1xuICAgICAgICBtZXJnZUJ1aWx0SW5FeHRlbnNpb24obGlzdDogSUV4dGVuc2lvbkxpc3RJdGVtUmVzcG9uc2VbXSk6IEV4dGVuc2lvbkl0ZW1bXSB7XG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb25zOiBFeHRlbnNpb25JdGVtW10gPSBsaXN0Lm1hcCgodikgPT4gdGhpcy5mb3JtYXROZXRFeHRlbnNpb24odikpO1xuXG4gICAgICAgICAgICBjb25zdCBidWlsdEluTGlzdCA9IHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFleHRlbnNpb25zLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lKSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUoaXRlbS5wYXRoKSA9PT0gJ2J1aWx0aW4nO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOazqOaEj+i/memHjOaJvueahOaYr+e9kee7nOWIl+ihqOS4reaJvuS4jeWIsOWMuemFjSBuYW1lIOeahOacrOWcsOimhuebluaPkuS7tlxuICAgICAgICAgICAgY29uc3QgbXVsdGlwbGVWZXJzaW9ucyA9IHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFleHRlbnNpb25zLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lKSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUoaXRlbS5wYXRoKSA9PT0gJ2NvdmVyJztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBidWlsdEluTGlzdC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uaW5mby5kZXNjcmlwdGlvbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlOiBpdGVtLmVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgaXNJbnN0YWxsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtdWx0aXBsZVZlcnNpb25zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGV4dGVuc2lvbnMuZmluZEluZGV4KCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uaW5mby5kZXNjcmlwdGlvbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogaXRlbS5lbmFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luc3RhbGxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uZW5hYmxlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvdmVyIOaPkuS7tumcgOimgeWkhOS6juWQr+eUqOeKtuaAge+8jOaJjeS8muWwhuaVsOaNriBtZXJnZSDov5vmnaVcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uc1tpbmRleF0uYnVpbHRJblBhdGggPSBleHRlbnNpb25zW2luZGV4XS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zW2luZGV4XS5idWlsdEluVmVyc2lvbiA9IGV4dGVuc2lvbnNbaW5kZXhdLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLnZlcnNpb24gPSBpdGVtLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLnBhdGggPSBpdGVtLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLmVuYWJsZSA9IGl0ZW0uZW5hYmxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9ucztcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5pCc57Si5qCP6Kem5Y+R5Zue6LCDICovXG4gICAgICAgIGRvU2VhcmNoKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoS2V5ID0gZXZlbnQ/LnRhcmdldD8udmFsdWUgPz8gJyc7XG4gICAgICAgICAgICBpZiAoc2VhcmNoS2V5ID09PSB0aGlzLnNlYXJjaEtleSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaHJvdHRsZSAmJiB0aGlzLnNlYXJjaFRocm90dGxlKHNlYXJjaEtleSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uU2VhcmNoQmx1cihlOiBGb2N1c0V2ZW50KSB7XG4gICAgICAgICAgICAvLyBGSVhNRTog5Li05pe25aSE55CG5pa55qGI77yM6L6T5YWl5qGG5aSx5Y6754Sm54K55pe277yM5aaC5p6c5rKh5pyJ5pCc57Si5ZCN56ew77yM6Ieq5Yqo57uT5p2f5pCc57Si54q25oCB44CCXG4gICAgICAgICAgICAvLyDlkI7nu63lrozlloTmkJzntKLlip/og73lkI7lsLHkuI3pnIDopoHov5nkuKrlpITnkIbkuobjgILmsqHmnInmkJzntKLlkI3np7Dml7blupTmmL7npLrmiYDmnInmlbDmja5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaEtleSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFNlYXJjaFN0YXR1cyhmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWPkei1t+aQnOe0oiAqL1xuICAgICAgICBoYW5kbGVTZWFyY2goc2VhcmNoS2V5OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5ID0gc2VhcmNoS2V5O1xuICAgICAgICAgICAgaWYgKHNlYXJjaEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFnZSA9IDE7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTZWFyY2hFeHRlbnNpb25zKHRoaXMuc2VhcmNoS2V5LCB0aGlzLnBhZ2UsIHRoaXMucGFnZVNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uU2VhcmNoRXZlbnQobmFtZT86IHN0cmluZyB8IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoU2VhcmNoU3RhdHVzKGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IHRydWUgfHwgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hTZWFyY2hTdGF0dXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTZWFyY2gobmFtZSA9PT0gdHJ1ZSA/ICcnIDogbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgdXBkYXRlU2VhcmNoRXh0ZW5zaW9ucyhxdWVyeTogc3RyaW5nLCBwYWdlOiBudW1iZXIsIHBhZ2VTaXplOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5UkUgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cChxdWVyeSkpO1xuICAgICAgICAgICAgY29uc3QgZWwgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBJbnN0YW5jZVR5cGU8dHlwZW9mIFBhY2thZ2VTZWFyY2hMaXN0PjtcblxuICAgICAgICAgICAgY29uc3QgcGFyYW06IElFeHRlbnNpb25MaXN0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGU6IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICBxOiBxdWVyeSxcbiAgICAgICAgICAgICAgICBsYW5nOiB0aGlzLmN1ckxhbmd1YWdlKCksXG4gICAgICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgICAgICBwYWdlU2l6ZSxcbiAgICAgICAgICAgICAgICBsYWJlbDogW1xuICAgICAgICAgICAgICAgICAgICAvLyDmkJzntKLpnIDopoHmiYvliqjluKbkuIrmoIfnrb7vvIzpgb/lhY3lnKjmiYDmnInmoIfnrb7kuK3mkJzntKLvvIjlkKbliJnmnInkupvpmpDol4/nmoTmj5Lku7bkuZ/kvJrkuIDotbfooqvmkJzntKLlh7rmnaXvvIlcbiAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvcyxcbiAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluLFxuICAgICAgICAgICAgICAgIF0uam9pbignLCcpLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZWwubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIGxldCBzZWFyY2hSZXN1bHQ6IFBhY2thZ2VTZWFyY2hHcm91cFtdID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNlYXJjaFJlc3VsdCA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgLi4uW1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIuQ29jb3MsXG4gICAgICAgICAgICAgICAgICAgIF0ubWFwPFByb21pc2U8UGFja2FnZVNlYXJjaEdyb3VwPj4oYXN5bmMgKGxhYmVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2RrLmdldEV4dGVuc2lvbkxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5wYXJhbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pys5qyh5pCc57Si6L+H5pyf5ZCO77yM5ZCO57ut55qE5aSE55CG5Lmf5LiN6ZyA6KaB5LqG77yM55u05o6l6YCa6L+H5oqb5Ye6IGVycm9yIOi/lOWbnuepuuaVsOaNruWwseihjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaFRpbWVzdGFtcCAhPT0gdGltZXN0YW1wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBDYW5jZWxFcnJvcigndGltZXN0YW1wIGNhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZExpc3QgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMubWVyZ2VCdWlsdEluRXh0ZW5zaW9uKHJlcy5wYWNrYWdlcykuZmlsdGVyKChwa2cpID0+IHF1ZXJ5UkUudGVzdChwa2cubmFtZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHJlcy5wYWNrYWdlcy5tYXAodGhpcy5mb3JtYXROZXRFeHRlbnNpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0OiBmb3JtYXR0ZWRMaXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogcmVzLmNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYW5jZWwg5pe25oqb5Ye6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENhbmNlbEVycm9yLmlzQ2FuY2VsKGVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIGNhbmNlbCDml7bkuI3lho3miafooYzlkI7nu63pgLvovpFcbiAgICAgICAgICAgICAgICBpZiAoQ2FuY2VsRXJyb3IuaXNDYW5jZWwoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkuIvpnaLpg73mmK/lkIzmraXmlrnms5XvvIzkuI3pnIDopoHlho3liKTmlq0gdGltZXN0YW1wIOS6hlxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcmVkSW5zdGFsbGVkID0gdGhpcy5pbnN0YWxsZWRMaXN0LmZpbHRlcigocGtnKSA9PiBxdWVyeVJFLnRlc3QocGtnLm5hbWUpKTtcbiAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGtleTogRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgbGlzdDogZmlsdGVyZWRJbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsOiBmaWx0ZXJlZEluc3RhbGxlZC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBlbC5iYXRjaFVwZGF0ZUxpc3QoXG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaFJlc3VsdC5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZbY3Vyci5rZXldID0gY3VycjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICAgICAgICAgICAgICB9LCB7fSBhcyBSZWNvcmQ8RXh0ZW5zaW9uTWFuYWdlclRhYiwgUGFja2FnZVNlYXJjaEdyb3VwPiksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgZWwubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrDmj5Lku7bmlbDnu4QgKi9cbiAgICAgICAgYXN5bmMgdXBkYXRlTGlzdChsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiwgcGFnZTogbnVtYmVyLCBwYWdlX3NpemU6IG51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgdGFiID0gdGhpcy5pc1Nob3dTZWFyY2hpbmcgPyBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCA6IGxhYmVsO1xuICAgICAgICAgICAgaWYgKHRhYiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxvY2F0aW9uRXh0ZW5zaW9ucygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YWIgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQWxsUGFja2FnZXMoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZVNlYXJjaEV4dGVuc2lvbnModGhpcy5zZWFyY2hLZXksIDEsIHRoaXMucGFnZVNpemUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRXh0ZW5zaW9ucyhsYWJlbCwgdGhpcy5zZWFyY2hLZXksIHBhZ2UsIHBhZ2Vfc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWIt+aWsOaMiemSrueahOinpuWPke+8jOWIt+aWsOW9k+WJjea/gOa0u+eahOmdouadv+S4i+eahOWGheWuueOAgiBpbnN0YWxsZWTkuLrmiavmj4/mnKzlnLDmj5Lku7bvvIzlhbbku5bliJnkuLror7fmsYLnvZHnu5zmj5Lku7YqL1xuICAgICAgICAvLyBGSVhNRTog5piv5ZCm5bqU6K+l5aeL57uI5Yi35paw5q+P5Liq5Y+v6YCJIHRhYiBwYW5lbCDlhoXnmoTlhoXlrrnvvJ/lkKbliJnnlKjmiLflj6rog73kuIDkuKrkuKrpnaLmnb/ljrvliLfmlrDjgIJcbiAgICAgICAgYXN5bmMgcmVmcmVzaExpc3QoKSB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVUYWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogdGhpcy5hY3RpdmU7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1thY3RpdmVUYWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXNjYW4odHlwZTogUGFja2FnZUluZm9bJ3R5cGUnXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAnc2Nhbm5pbmcnLCB0eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDMuNi54IOeJiOacrOeahCDigJzmiavmj4/mj5Lku7bigJ0g5oyJ6ZKu54K55Ye75pe277yM5Lya5Y675Li76L+b56iL5omL5Yqo5pu05paw5o+S5Lu25rOo5YaM5L+h5oGv44CCXG4gICAgICAgICAgICAvLyDov5nph4zlhajpg6jmm7TmlrDvvIzogIzkuI3lho3moLnmja7lvZPliY0gdGFiIOWMuuWIhlxuICAgICAgICAgICAgYXdhaXQgcmVzY2FuKCdnbG9iYWwnKTtcbiAgICAgICAgICAgIGF3YWl0IHJlc2NhbigncHJvamVjdCcpO1xuXG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBpZiAoYWN0aXZlVGFiID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTG9jYXRpb25FeHRlbnNpb25zKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZVRhYiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2gpIHtcbiAgICAgICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaEFsbFBhY2thZ2VzKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVTZWFyY2hFeHRlbnNpb25zKHRoaXMuc2VhcmNoS2V5LCAxLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRXh0ZW5zaW9ucyhhY3RpdmVUYWIsIHRoaXMuc2VhcmNoS2V5LCAxLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5pu05paw6Z2e5pys5Zyw5o+S5Lu25YiX6KGoXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB1cGRhdGVFeHRlbnNpb25zKGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLCBxdWVyeTogc3RyaW5nLCBwYWdlOiBudW1iZXIsIHBhZ2VTaXplOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhYiA9IGxhYmVsO1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiXSBhcyBhbnk7XG5cbiAgICAgICAgICAgIC8vIHNlYXJjaCDpnaLmnb/ljZXni6zlrprliLbpgLvovpFcbiAgICAgICAgICAgIGlmICghZSB8fCB0YWIgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChwYWdlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnN0IHNvdXJjZUlkID0gMTsvLyDov5nph4zlupTor6Xljrt0YWJz6YeM6L+H5rukXG4gICAgICAgICAgICBjb25zdCBwYXJhbTogSUV4dGVuc2lvbkxpc3RQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgZTogRWRpdG9yLkFwcC52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIHE6IHF1ZXJ5LFxuICAgICAgICAgICAgICAgIGxhbmc6IHRoaXMuY3VyTGFuZ3VhZ2UoKSxcbiAgICAgICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgICAgIHBhZ2VTaXplLFxuICAgICAgICAgICAgICAgIGxhYmVsOiAnJyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHN3aXRjaCAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAvLyDov5nph4zmjpLpmaTmjonkuI3pnIDopoHluKYgbGFiZWwg55qE5oOF5Ya177yM5YW25a6D55qE6YO95bim5LiKIHRhYiBsYWJlbFxuICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQ6XG4gICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLlB1cmNoYXNlZDpcbiAgICAgICAgICAgICAgICBjYXNlIEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoOlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtLmxhYmVsID0gbGFiZWw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZGtcbiAgICAgICAgICAgICAgICAuZ2V0RXh0ZW5zaW9uTGlzdChwYXJhbSlcbiAgICAgICAgICAgICAgICAudGhlbigocmVzOiBJRXh0ZW5zaW9uTGlzdFJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbkxpc3QgPVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5tZXJnZUJ1aWx0SW5FeHRlbnNpb24ocmVzLnBhY2thZ2VzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVzLnBhY2thZ2VzLm1hcCgoaXRlbSkgPT4gdGhpcy5mb3JtYXROZXRFeHRlbnNpb24oaXRlbSkpO1xuICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVMaXN0KGV4dGVuc2lvbkxpc3QsIHJlcy5jb3VudCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTaG93U2VhcmNoaW5nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5QdXJjaGFzZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc2V0RXJyb3IodGhpcy50KCduZXR3b3JrX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEVycm9yKHRoaXMudCgnbG9jYWxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlbC5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOabtOaWsOW3suWuieijheaPkuS7tuWIl+ihqCAqL1xuICAgICAgICBhc3luYyB1cGRhdGVMb2NhdGlvbkV4dGVuc2lvbnMoKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgZWwubG9hZGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIEZJWE1F77ya5Ymv5L2c55So44CC5riF56m65o+S5Lu26K+m5oOF6aG15YaF5a6544CC5ZCO57ut55yL5piv5ZCm6ZyA6KaB77yM5oiW6ICF5Y+m5aSW5a+75om+5LiA5Liq5aSE55CG5pa55byPXG4gICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgdGhpcy5zY2FuTG9jYWwoKTtcblxuICAgICAgICAgICAgLy8gRklYTUU6IOazqOaEjyBpbnN0YWxsZWQg5YiX6KGo6L+Z6YeM77yM5Lik5Liq5pWw57uE5a+56LGh5piv5YWx5Lqr55qE77yM5a+55pWw57uE44CB5pWw57uE5YaF5a+56LGh55qE5pS55Yqo5Lya5a+55Lik6L655ZCM5pe25Lqn55Sf5b2x5ZONXG4gICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBsaXN0O1xuICAgICAgICAgICAgZWwudXBkYXRlTGlzdChsaXN0LCBsaXN0Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHRoaXMuaGFuZGxlTGlzdFVwZGF0ZShsaXN0LCBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCk7XG4gICAgICAgICAgICBlbC5sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWcqOafkOS4quWIl+ihqOeahOaVsOaNruabtOaWsOWQju+8jOWQjOatpee7meWFtuS7luWIl+ihqFxuICAgICAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAgICAgKiBAcGFyYW0gbGFiZWxcbiAgICAgICAgICovXG4gICAgICAgIGhhbmRsZUxpc3RVcGRhdGUobGlzdDogRXh0ZW5zaW9uSXRlbVtdLCBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYikge1xuICAgICAgICAgICAgWy4uLnRoaXMuZmxhdFRhYnMsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIH1dXG4gICAgICAgICAgICAgICAgLmZpbHRlcigodikgPT4gdi5sYWJlbCAhPT0gbGFiZWwpXG4gICAgICAgICAgICAgICAgLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgICAgICAgICAgZWwuaGFuZGxlTGlzdFVwZGF0ZShsaXN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyByZWZyZXNoQWxsUGFja2FnZXMoKSB7XG4gICAgICAgICAgICB0aGlzLmFsbFBhY2thZ2VzID0gRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5omr5o+P5bm25aSE55CG5pys5Zyw55uu5b2V5LiL55qE5o+S5Lu277yI5ZCr6aG555uu55qEZXh0ZW5zaW9uc+ebruW9leS4i++8jOWPiu+8iVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgc2NhbkxvY2FsKCkge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFsbGVkTGlzdCA9IGF3YWl0IHRoaXMuc2RrLnNjYW5Mb2NhbEV4dGVuc2lvbnMoKTtcblxuICAgICAgICAgICAgLy8gRklYTUU6IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzIOWtmOWcqOiwg+eUqOaXtuW6j+mXrumimO+8jOacieaXtumcgOimgeetieW+heWug+WGhemDqOaVsOaNruabtOaWsOOAglxuXG4gICAgICAgICAgICAvLyDlhbfkvZPpnIDopoHnrYnlvoXlpJrkuYXvvIzmmoLml7bkuI3muIXmpZpcbiAgICAgICAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuXG4gICAgICAgICAgICBjb25zdCBsaXN0OiBFeHRlbnNpb25JdGVtW10gPSBbXTtcbiAgICAgICAgICAgIGluc3RhbGxlZExpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxQYWNrYWdlcy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAodikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB2LnBhdGggPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja1BhdGhUeXBlKHYucGF0aCkgPT09ICdsb2NhbCcsXG4gICAgICAgICAgICAgICAgICAgICkubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnB1c2godGhpcy5mb3JtYXRJbnN0YWxsZWRFeHRlbnNpb24oaXRlbSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGlzdC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgYi5tdGltZSA9PT0gJ251bWJlcicgPyBiLm10aW1lIDogMCkgLSAodHlwZW9mIGEubXRpbWUgPT09ICdudW1iZXInID8gYS5tdGltZSA6IDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5qOA5p+l5o+S5Lu255qE57G75YirXG4gICAgICAgICAqIEBwYXJhbSBwYXRoIOimgeajgOa1i+eahOaPkuS7tuWuieijhei3r+W+hFxuICAgICAgICAgKiBAcmV0dXJucyDmj5Lku7bnsbvliKtcbiAgICAgICAgICovXG4gICAgICAgIGNoZWNrUGF0aFR5cGUocGF0aDogc3RyaW5nKTogJ290aGVyJyB8ICdsb2NhbCcgfCAnZ2xvYmFsJyB8ICdjb3ZlcicgfCAnYnVpbHRpbicge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18uY2hlY2tUeXBlKHBhdGgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrAv5a6J6KOF5o+S5Lu2ICovXG4gICAgICAgIHVwZGF0ZVBhY2thZ2UobmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIGluZm86IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmlzSW5zdGFsbGVkICYmIHNlbXZlci5lcSh2ZXJzaW9uLCBpbmZvLnZlcnNpb24pKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoaW5mby5pc0J1aWx0SW4gJiYgdHlwZW9mIGluZm8uYnVpbHRJblZlcnNpb24gPT09ICdzdHJpbmcnICYmIHNlbXZlci5lcSh2ZXJzaW9uLCBpbmZvLmJ1aWx0SW5WZXJzaW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRCdWlsdEluVmVyc2lvbihpbmZvKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kb3dubG9hZChuYW1lLCB2ZXJzaW9uLCBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyDlvoDlt7Llronoo4XliJfooajkuK3mj5LlhaVcbiAgICAgICAgYWRkSW5zdGFsbGVkUGFja2FnZShpdGVtOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5hZGRQYWNrYWdlKGl0ZW0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDlvZPpgInmi6nnmoTniYjmnKzkuLrlhoXnva7niYjmnKzml7bvvIzliJnop4bkuLrph43nva7liLDlhoXnva7niYjmnKwgKi9cbiAgICAgICAgYXN5bmMgcmVzZXRCdWlsdEluVmVyc2lvbihpdGVtOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICBpZiAoIWl0ZW0gfHwgIWl0ZW0uYnVpbHRJblBhdGggfHwgIWl0ZW0uYnVpbHRJblZlcnNpb24pIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgdHJ5VW5pbnN0YWxsID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOWNuOi9veWFqOWxgOebruW9leS4i+eahOaPkuS7tu+8jOS9v+W+l+WPr+S7peWvueaJgOaciemhueebrueUn+aViFxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2RrLnVuaW5zdGFsbChpdGVtLm5hbWUsIHRoaXMuZXh0ZW5zaW9uUGF0aHMuZ2xvYmFsKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyDljbjovb3lpLHotKXvvIzkuI3lvbHlk43lkI7nu63pgLvovpHmiafooYxcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoSW50ZXJuYWxOYW1lKGl0ZW0ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4odGhpcy50KCd1cGRhdGVfZXh0ZW5zaW9uX3RpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt0aGlzLnQoJ2NvbmZpcm0nKSwgdGhpcy50KCdjYW5jZWwnKV0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2V4dGVuc2lvbicsICdzZWxmLXVwZGF0ZScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogaXRlbS5idWlsdEluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0SW5QYXRoOiBpdGVtLmJ1aWx0SW5QYXRoLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUV4dGVuc2lvbk9wdGlvbi5pc1JlUmVnaXN0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCA9IGl0ZW0uYnVpbHRJblBhdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTog5ZCM5LiL5pa5IGRvd25sb2FkLnBlckluc3RhbGxlZCDpkqnlrZDkuK3nmoTlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS52ZXJzaW9uLCBwYXRoOiBpdGVtLnBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRyeVVuaW5zdGFsbCgpO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUoaXRlbS5uYW1lLCB0cnVlLCBpdGVtLmJ1aWx0SW5QYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS5idWlsdEluVmVyc2lvbiwgcGF0aDogaXRlbS5idWlsdEluUGF0aCB9LFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaXRlbS5wYXRoID0gaXRlbS5idWlsdEluUGF0aDtcbiAgICAgICAgICAgICAgICBpdGVtLnZlcnNpb24gPSBpdGVtLmJ1aWx0SW5WZXJzaW9uO1xuICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlKGl0ZW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDkuIvovb3mj5Lku7YgKi9cbiAgICAgICAgZG93bmxvYWQobmFtZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcsIGl0ZW06IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvblBhdGhzID0gdGhpcy5leHRlbnNpb25QYXRocztcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbGxQYXRoID0gaXRlbS5pc0J1aWx0SW4gPyBleHRlbnNpb25QYXRocy5nbG9iYWwgOiBleHRlbnNpb25QYXRocy5wcm9qZWN0O1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlID0gdGhpcy5zZGsuZ2V0RG93bmxvYWRlcihcbiAgICAgICAgICAgICAgICB7IG5hbWUsIHZlcnNpb24sIGluc3RhbGxQYXRoIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFByb2dyZXNzOiAocHJvZ3Jlc3M6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MgPSBNYXRoLmZsb29yKDEwMCAqIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMobmFtZSwgbnVsbCwgbnVsbCwgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwZXJEb3dubG9hZGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNCdWlsdEluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5a+55LqO5omp5bGV566h55CG5Zmo5L6L5aSW77yM5a6D55qE5pu05paw5LiN6IO95YGa5Yiw5Y2z5pe256aB55So44CB5Y+N5rOo5YaMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaEludGVybmFsTmFtZShpdGVtLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgZmFsc2UsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLnBhdGggIT09IGl0ZW0uYnVpbHRJblBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmdniBidWlsdGluIOaXtuWPjeazqOWGjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y+N5rOo5YaM5YWo5bGAIGJ1aWx0aW4g55uu5b2V5LiL5bey5a6J6KOF55qE5o+S5Lu277yI5pyq5ZCv55So77yM5Zug5q2k5LiN5Lya6LWw5LiK6Z2i55qE5Yik5pat6YC76L6R77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3QgPSBpbmZvLmluc3RhbGxQa2dQYXRoID8/IHBhdGgucmVzb2x2ZShpbmZvLmluc3RhbGxQYXRoLCBpbmZvLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0KSAmJiB0aGlzLmFsbFBhY2thZ2VzLmZpbmQoKHBrZykgPT4gcGtnLnBhdGggPT09IGRpc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBkaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoZGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uaXNJbnN0YWxsZWQgJiYgaXRlbS5wYXRoICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgZmFsc2UsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwZXJJbnN0YWxsZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwa2c6IEV4dGVuc2lvbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlu7bov581MDDmr6vnp5LvvIzlm6DkuLrorr7orqHluIzmnJvlnKjkuIvovb3lrozmiJDlkI7og73oh7PlsJHlgZznlZnlnKgxMDAl54q25oCB5LiA5q615pe26Ze0XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5mby50ZW1wUGF0aCAhPT0gJ3N0cmluZycgfHwgaW5mby50ZW1wUGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGluZm8udGVtcFBhdGg6IFwiJHtpbmZvLnRlbXBQYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaEludGVybmFsTmFtZShuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4odGhpcy50KCd1cGRhdGVfZXh0ZW5zaW9uX3RpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdleHRlbnNpb24nLCAnc2VsZi11cGRhdGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogaW5mby50ZW1wUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsdEluUGF0aDogaXRlbS5idWlsdEluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uT3B0aW9uLmlzUmVSZWdpc3RlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCA9IGluZm8udGVtcFBhdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeS4i+asoeWQr+WKqOaXtuabtOaWsOWAme+8jOe7k+adn+S4i+i9veeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6L+Z6YeM5L2/55So55qE5piv5b2T5YmN55qE54mI5pys5ZKM6Lev5b6E77yM55u45b2T5LqO5rKh5pyJ5pu05pawXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOmcgOimgeS4gOS4quabtOWQiOeQhueahOeKtuaAgeabtOaWsOacuuWItlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS52ZXJzaW9uLCBwYXRoOiBpdGVtLnBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXRlbS5pc0J1aWx0SW4gJiYgaXRlbS5pc0NvY29zU291cmNlICYmICFpdGVtLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy5pc0luc3RhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwa2cuZW5hYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5yZWdpc3RlcihpbmZvLnRlbXBQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUobmFtZSwgdHJ1ZSwgaW5mby50ZW1wUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGtnLnBhdGggPSBpbmZvLnRlbXBQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIG51bGwsIHsgdmVyc2lvbiwgcGF0aDogaW5mby50ZW1wUGF0aCEgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlKHBrZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMb2NhdGlvbkV4dGVuc2lvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIHRoaXMudCgnaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uOiBFeHRlbnNpb25EZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uZm9yRWFjaCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbi5kZXBlbmRlbmNpZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHYubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogdi52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wZW5EaWFsb2cob3B0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGUuZG93bmxvYWQoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMobmFtZSwgdGhpcy50KCdpbnN0YWxsX2Vycm9yX3RpcCcpLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5bCG5o+S5Lu255qE5LiL6L2954q25oCB5ZCM5q2l5Yiw5omA5pyJ5YiX6KGoICovXG4gICAgICAgIHVwZGF0ZURvd25sb2FkU3RhdHVzKFxuICAgICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgZXJyb3I6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiB7IHBhdGg6IHN0cmluZzsgdmVyc2lvbjogc3RyaW5nIH0gfCBudWxsLFxuICAgICAgICAgICAgcHJvZ3Jlc3M6IG51bWJlciB8IG51bGwsXG4gICAgICAgICkge1xuICAgICAgICAgICAgWy4uLnRoaXMuZmxhdFRhYnMsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIH1dLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW3RhYi5sYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgICAgICBlbC51cGRhdGVEb3dubG9hZFN0YXR1cyhuYW1lLCBlcnJvciwgc3VjY2VzcywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiDlsIbmj5Lku7bnmoTljbjovb3nirbmgIHlkIzmraXliLDmiYDmnInliJfooaggKi9cbiAgICAgICAgdXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgaXRlbTogRXh0ZW5zaW9uSXRlbSxcbiAgICAgICAgICAgIGVycm9yOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogeyBwYXRoOiBzdHJpbmc7IHZlcnNpb246IHN0cmluZyB9IHwgbnVsbCxcbiAgICAgICAgICAgIHByb2dyZXNzOiBudW1iZXIgfCBudWxsLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOWPquafpeaJviBidWlsdGluICYgY292ZXLvvIzmmK/lkKblupTor6XljLrliIbmmL7npLrvvJ9cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVpbHRJbiA9IHRoaXMuYWxsUGFja2FnZXMuZmluZCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFR5cGUgPSB0aGlzLmNoZWNrUGF0aFR5cGUodi5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJiAocGF0aFR5cGUgPT09ICdidWlsdGluJyB8fCBwYXRoVHlwZSA9PT0gJ2NvdmVyJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhYi5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNCdWlsdEluICYmIGJ1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHBhdGg6IGJ1aWx0SW4/LnBhdGgsIHZlcnNpb246IGJ1aWx0SW4udmVyc2lvbiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2NhbEl0ZW06IEV4dGVuc2lvbkl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6Kem5Y+R5Y246L295pON5L2c55qE5piv5ZCm5piv5b2T5YmN5YiX6KGo5Lit55qE5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5pbnN0YWxsZWQgPSBpdGVtLnBhdGggPT09IGxvY2FsSXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogaXNVbmluc3RhbGxlZCA/ICcnIDogbG9jYWxJdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDov5nph4zopoHnlKjliJfooajnu4Tku7bmnKzlnLDnmoTmlbDmja7vvIzogIzkuI3mmK/op6blj5Hljbjovb3mk43kvZzpgqPkuKrliJfooajnmoTmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNVbmluc3RhbGxlZCAmJiBpc09ubGluZUV4dGVuc2lvbihsb2NhbEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbG9jYWxJdGVtLmxhdGVzdF92ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxJdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2NhbEl0ZW06IEV4dGVuc2lvbkl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VuaW5zdGFsbGVkID0gaXRlbS5wYXRoID09PSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFBhdGggPSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFZlcnNpb24gPSBsb2NhbEl0ZW0udmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNVbmluc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDljbjovb3nmoTmmK/lhoXnva7liJfooajph4zlvZPliY3nmoTmmL7npLrpoblcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFBhdGggPSBidWlsdEluPy5wYXRoID8/ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VmVyc2lvbiA9IGJ1aWx0SW4/LnZlcnNpb24gPz8gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG5leHRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBuZXh0VmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzQ29jb3NTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobG9jYWxJdGVtOiBFeHRlbnNpb25JdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IOWboOS4uuebruWJjeaQnOe0ouS7heWkhOeQhuacjeWKoeerr+i/lOWbnueahOaVsOaNru+8jOWboOatpOWNuOi9veWQjueahOeKtuaAgeabtOaWsOS5n+WPqumcgOimgeeugOWNleWIpOaWrVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2gg5YiX6KGo55qE5pWw5o2u5Zyo56a75byA5ZCO5Lya5riF56m677yM5Zug5q2k5pqC5pe25LiN5Lya5pyJ5Zyo5Yir55qEIHRhYiDkuIvmm7TmlrAgc2VhcmNoIOaVsOaNrueahOmXrumimO+8jFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y2z5q2k5aSEIGxvY2FsSXRlbSA9PT0gaXRlbeOAguS4uuS6huS4juS4iumdouS4gOiHtO+8jOS+neaXp+S9v+eUqCBsb2NhbEl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGlzT25saW5lRXh0ZW5zaW9uKGxvY2FsSXRlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxvY2FsSXRlbS5sYXRlc3RfdmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxJdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZShpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZShpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKGl0ZW0ubmFtZSwgZXJyb3IsIHN1Y2Nlc3MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlRG93bmxvYWRTdGF0dXMoaXRlbS5uYW1lLCBlcnJvciwgc3VjY2VzcywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliIfmjaLmj5Lku7bnmoTljbjovb1sb2FkaW5nICovXG4gICAgICAgIHVwZGF0ZVVuaW5zdGFsbExvYWRpbmcobmFtZTogc3RyaW5nLCBpc0xvYWRpbmc6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsTG9hZGluZyhuYW1lLCBpc0xvYWRpbmcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiDljbjovb3mj5Lku7YgKi9cbiAgICAgICAgYXN5bmMgdW5pbnN0YWxsUGFja2FnZShuYW1lOiBzdHJpbmcsIGl0ZW06IEV4dGVuc2lvbkl0ZW0sIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tsYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAvLyDliKDpmaTliY3or6Lpl65cbiAgICAgICAgICAgIGlmIChpdGVtLmVuYWJsZSAmJiBsYWJlbCAhPT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKHRoaXMudCgnY2xvc2VfZXh0ZW5zaW9uc190aXAnKSwge1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDEsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgbnVsbCwgeyBwYXRoOiBpdGVtLnBhdGgsIHZlcnNpb246IGl0ZW0udmVyc2lvbiB9LCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsICFpdGVtLmVuYWJsZSwgaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiDljbjovb3mj5Lku7bml7blhYjmuIXnqbror6bmg4XpobXlhoXlrrnjgILkuLvopoHmmK/kuLrkuoblkozlronoo4Xmj5Lku7bml7bnmoTooYzkuLrliY3lkI7lkbzlupTjgILlkI7nu63nnIvnnIvmmK/lkKbpnIDopoHkv53nlZlcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVW5pbnN0YWxsTG9hZGluZyhuYW1lLCB0cnVlKTtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcblxuICAgICAgICAgICAgLy8g5Yib5bu6IHNkayDml7bnmoTlj4LmlbDkuK3lj6rkvKDlhaXkuobpobnnm67ot6/lvoTvvIzlm6DmraTov5nph4zlj6rkvJrljbjovb3pobnnm67ot6/lvoTkuIvnmoTmj5Lku7ZcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgIC51bmluc3RhbGwobmFtZSwge1xuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxQcm9ncmVzczogKHByb2dyZXNzOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzID0gTWF0aC5mbG9vcigxMDAgKiBwcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgbnVsbCwgbnVsbCwgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxlZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoSW50ZXJuYWxOYW1lKG5hbWUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGl0ZW0uYnVpbHRJblBhdGggPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5idWlsdEluUGF0aCAhPT0gJydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsIHRydWUsIGl0ZW0uYnVpbHRJblBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVVbmluc3RhbGxTdGF0dXMoaXRlbSwgbnVsbCwgeyBwYXRoOiAnJywgdmVyc2lvbjogJycgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ3VuaW5zdGFsbF9lcnJvcl90aXAnKSk7XG4gICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhuYW1lLCB0aGlzLnQoJ3VuaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog56e76Zmk5pyq5a6J6KOF55qE5o+S5Lu2ICovXG4gICAgICAgIHJlbW92ZVBhY2thZ2UobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCB0YWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogdGhpcy5hY3RpdmU7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgLnVuaW5zdGFsbChuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIHVuaW5zdGFsbGVkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmUobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKHRoaXMudCgncmVtb3ZlX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmiZPlvIDlvLnnqpfvvIzlt7LlgZrpmJ/liJflpITnkIbjgIIg5L2G5piv55uu5YmN5by556qX5Yqf6IO95YWI6ZqQ6JePICovXG4gICAgICAgIG9wZW5EaWFsb2coaW5mbzogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAvLyBpZiAodGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3QucHVzaChpbmZvKVxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llcyA9IGluZm9cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGlmIChpbmZvLmRlcGVuZGVuY2llcy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGluZm8uZGVwZW5kZW5jaWVzLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgaW5kZXggPiAwID8gKG1lc3NhZ2UgKz0gYOOAgSR7aXRlbS5uYW1lfUAke2l0ZW0udmVyc2lvbn1gKSA6IChtZXNzYWdlICs9IGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgICAgICAgICAgdGl0bGU6IGAke2luZm8ubmFtZX0gJHt0aGlzLnQoJ2luc3RhbGxfZGVwZW5kZW5jZV90aXAnKX1gLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3dhcm4nLFxuICAgICAgICAgICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgICAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5by556qX55qE5Y+W5raI5oyJ6ZKuICovXG4gICAgICAgIGRpYWxvZ0NhbmNlbCgpIHtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5by556qX55qE56Gu6K6k5oyJ6ZKuICovXG4gICAgICAgIGRpYWxvZ0NvbmZpcm0oaW5mbzogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5jYWxsYmFjaykgaW5mby5jYWxsYmFjaygpO1xuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDph43or5Xlr7zlhaUgKi9cbiAgICAgICAgcmV0cnlJbXBvcnQoKSB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydEVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsKHRoaXMuaW1wb3J0UGF0aENhY2hlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5Y+W5raI6YeN6K+V5a+85YWl77yM55u05o6l57uT5p2fICovXG4gICAgICAgIGNhbmNlbFJldHJ5SW1wb3J0KCkge1xuICAgICAgICAgICAgdGhpcy5pbXBvcnRFcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0UGF0aENhY2hlID0gJyc7XG4gICAgICAgICAgICB0aGlzLmltcG9ydExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblBvcHVwSW1wb3J0TW9yZSgpIHtcbiAgICAgICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLnQoJ2ltcG9ydF9leHRlbnNpb25zX2ZvbGRlcicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxQa2dGb2xkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLnQoJ2ltcG9ydF9leHRlbnNpb25zX2RldicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxQa2dEZXYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIHNlbGVjdERpcmVjdG9yeUZyb21EaWFsb2cob3B0aW9uaXM6IEVkaXRvci5EaWFsb2cuU2VsZWN0RGlhbG9nT3B0aW9ucyA9IHt9KSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0Rm9sZGVyUGF0aCA9IGF3YWl0IExhc3RJbXBvcnRGb2xkZXJQYXRoLnRyeUdldCgpO1xuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLnNlbGVjdCh7XG4gICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnNlbGVjdERpcmVjdG9yeScpLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdkaXJlY3RvcnknLFxuICAgICAgICAgICAgICAgIG11bHRpOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBwYXRoOiBsYXN0Rm9sZGVyUGF0aCA/PyB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgLi4ub3B0aW9uaXMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdC5maWxlUGF0aHMpIHx8IHJlc3VsdC5maWxlUGF0aHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlckRpciA9IHBhdGguZGlybmFtZShzZWxlY3RlZFBhdGgpO1xuXG4gICAgICAgICAgICAvLyDmiormnKzmrKHpgInkuK3mlofku7blpLnnmoTniLbnuqfmlofku7blpLnot6/lvoTlrZjliLAgcHJvZmlsZSDkuK1cbiAgICAgICAgICAgIGlmIChmb2xkZXJEaXIgIT09IGxhc3RGb2xkZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgTGFzdEltcG9ydEZvbGRlclBhdGgudHJ5U2V0KGZvbGRlckRpcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZFBhdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWvvOWFpeS4gOS4quaPkuS7tuWOi+e8qeWMhVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgaW5zdGFsbChmaWxlUGF0aCA9ICcnKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gJ3Byb2plY3QnO1xuICAgICAgICAgICAgaWYgKCFmaWxlUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RGb2xkZXJQYXRoID0gYXdhaXQgTGFzdEltcG9ydEZvbGRlclBhdGgudHJ5R2V0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5zZWxlY3Qoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuc2VsZWN0WmlwJyksXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdaSVAnLCBleHRlbnNpb25zOiBbJ3ppcCddIH1dLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBsYXN0Rm9sZGVyUGF0aCA/PyB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCB8fCAhcmVzdWx0LmZpbGVQYXRoc1swXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlRGlyID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBMYXN0SW1wb3J0Rm9sZGVyUGF0aC50cnlTZXQoZmlsZURpcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2VOYW1lID0gYmFzZW5hbWUoZmlsZVBhdGgsICcuemlwJyk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsUGtnVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW1wb3J0UGFja2FnZSh0eXBlLCBmaWxlUGF0aCwgeyBleHRlbnNpb25EaXNwbGF5TmFtZTogcGFja2FnZU5hbWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmRlY29tcHJlc3NGYWlsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZURlY29tcHJlc3NGYWlsKGZpbGVQYXRoLCBwYWNrYWdlTmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlpITnkIblronoo4XpgLvovpHnmoTmqKHmnb/mlrnms5XjgIJcbiAgICAgICAgICog5ZCO57ut6ZyA5rGC5Y+Y5pu05pe25Y+v5Lul5aKe5Yqg5pu05aSa5Y+C5pWw77yM5oiW6ICF5bCG5pW05Liq5qih5p2/5pa55rOV5ouG5pWj5oiQ5aSa5Liq5bCP5Ye95pWw77yM6K6p5ZCE5Liq6LCD55So5YWl5Y+j6Ieq5bex5Y6757uE5ZCI6LCD55SoXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbnN0YWxsUGtnVGVtcGxhdGUob3B0aW9uczoge1xuICAgICAgICAgICAgLy8g55So5oi36YCJ5Lit55qE6Lev5b6E77yI5paH5Lu25oiW5paH5Lu25aS577yJXG4gICAgICAgICAgICBzZWxlY3RlZFBhdGg6IHN0cmluZztcbiAgICAgICAgICAgIC8vIGltcG9ydCDmk43kvZznmoTlpITnkIblh73mlbDjgILov5Tlm54gaW1wb3J0IOWujOaIkOWQjueahCBkaXN0IOi3r+W+hFxuICAgICAgICAgICAgaW1wb3J0SGFuZGxlcjogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgICB9KSB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydExvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgLy8g5q+P5qyh5a+85YWl5byA5aeL5pe26YeN572u5LiK5LiA5qyh5a+85YWl55qE6ZSZ6K+v5L+h5oGvXG4gICAgICAgICAgICB0aGlzLmltcG9ydEVycm9yTWVzc2FnZSA9ICcnO1xuXG4gICAgICAgICAgICBjb25zdCB7IHNlbGVjdGVkUGF0aCB9ID0gb3B0aW9ucztcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgb3B0aW9ucy5pbXBvcnRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBpbXBvcnRlZCBwYWNrYWdlIHBhdGg6IFwiJHtwYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0UGF0aENhY2hlID0gJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZDtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaW5zdGFsbGVkTGlzdC5maW5kKCh2KSA9PiB2LnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwdGVkIHBhY2thZ2UgaW1wb3J0OiBjYW5ub3QgZmluZCBpbiBpbnN0YWxsZWQgbGlzdCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgdHJ1ZSwgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaG9vc2UoaXRlbSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0RXJyb3JNZXNzYWdlID0gdGhpcy50KCdpbXBvcnRfZXJyb3JfdGlwJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRQYXRoQ2FjaGUgPSBzZWxlY3RlZFBhdGg7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2FuY2VsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsUmV0cnlJbXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5jZWxJbXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZS5pbnZhbGlkUGF0aDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVJbnZhbGlkUGF0aChzZWxlY3RlZFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2Fubm90RmluZFBhY2thZ2VKc29uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IChlcnJvciBhcyBhbnkpLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmltcG9ydEVycm9yJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmNhbm5vdEZpbmRQYWNrYWdlSnNvbicsIHsgcGF0aDogZm9sZGVyUGF0aCB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMTAwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaKm+WHuuiuqeWkluWxguWkhOeQhlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmRlY29tcHJlc3NGYWlsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVVuZXhwZWN0ZWRJbXBvcnRFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGluc3RhbGxQa2dGb2xkZXIoZm9sZGVyUGF0aCA9ICcnKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gJ3Byb2plY3QnO1xuXG4gICAgICAgICAgICBpZiAoIWZvbGRlclBhdGgpIHtcbiAgICAgICAgICAgICAgICBmb2xkZXJQYXRoID0gYXdhaXQgdGhpcy5zZWxlY3REaXJlY3RvcnlGcm9tRGlhbG9nKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZm9sZGVyUGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsUGtnVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcbiAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3QgPSBhd2FpdCBpbXBvcnRQYWNrYWdlRm9sZGVyKHR5cGUsIGZvbGRlclBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlzdDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgaW5zdGFsbFBrZ0Rldihmb2xkZXJQYXRoID0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSAncHJvamVjdCc7XG4gICAgICAgICAgICBpZiAoIWZvbGRlclBhdGgpIHtcbiAgICAgICAgICAgICAgICBmb2xkZXJQYXRoID0gYXdhaXQgdGhpcy5zZWxlY3REaXJlY3RvcnlGcm9tRGlhbG9nKCk7XG4gICAgICAgICAgICAgICAgaWYgKGZvbGRlclBhdGggPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5zdGFsbFBrZ1RlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbXBvcnRQYWNrYWdlU3ltbGluayh0eXBlLCBmb2xkZXJQYXRoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxufSk7XG4iXX0=