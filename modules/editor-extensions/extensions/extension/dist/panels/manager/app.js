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
const vue_1 = __importDefault(require("vue/dist/vue"));
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
exports.PanelApp = vue_1.default.extend({
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
        Editor.Message.addBroadcastListener('i18n:change', this.onI18nChange);
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
        Editor.Message.removeBroadcastListener('i18n:change', this.onI18nChange);
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
        /**
         * 导入一个插件压缩包
         */
        async install(filePath = '') {
            const type = 'project';
            if (!filePath) {
                const result = await Editor.Dialog.select({
                    title: Editor.I18n.t('extension.menu.selectZip'),
                    filters: [{ name: 'ZIP', extensions: ['zip'] }],
                });
                if (!result || !result.filePaths[0]) {
                    return;
                }
                filePath = result.filePaths[0];
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
                const result = await Editor.Dialog.select({
                    title: Editor.I18n.t('extension.menu.selectDirectory'),
                    type: 'directory',
                    multi: false,
                });
                if (!Array.isArray(result.filePaths) || result.filePaths.length < 1) {
                    return;
                }
                folderPath = result.filePaths[0];
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
                const result = await Editor.Dialog.select({
                    title: Editor.I18n.t('extension.menu.selectDirectory'),
                    type: 'directory',
                    multi: false,
                });
                if (!Array.isArray(result.filePaths) || result.filePaths.length < 1) {
                    return;
                }
                folderPath = result.filePaths[0];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9tYW5hZ2VyL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQXdEO0FBQ3hELDZDQUF1RTtBQUN2RSx1REFBK0I7QUFDL0Isb0RBQTRCO0FBQzVCLG1DQUFnRDtBQUVoRCwwREFBaUM7QUFDakMsc0RBQWlDO0FBQ2pDLDBEQUFpQztBQUNqQyx1REFBc0Q7QUFDdEQsOENBQThGO0FBQzlGLCtCQUFrQztBQUNsQyxtQ0FBc0M7QUFDdEMsMkNBQThDO0FBQzlDLDhDQVU0QjtBQUM1QixnREFLNkI7QUFFN0Isc0RBWWdDO0FBWWhDLGlDQUFpQztBQUNwQixRQUFBLHFCQUFxQixHQUFHO0lBQ2pDLDhCQUE4QjtJQUM5QixZQUFZLEVBQUUsS0FBSztJQUNuQix1QkFBdUI7SUFDdkIsSUFBSSxFQUFFLEVBQUU7Q0FDWCxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTRJM0IsQ0FBQztBQUVXLFFBQUEsUUFBUSxHQUFHLGFBQUcsQ0FBQyxNQUFNLENBQUM7SUFDL0IsSUFBSSxFQUFFLGtCQUFrQjtJQUN4QixVQUFVLEVBQUU7UUFDUixVQUFVLEVBQUUsa0JBQU87UUFDbkIsWUFBWSxFQUFFLGdCQUFTO1FBQ3ZCLFVBQVUsRUFBRSxrQkFBTztRQUNuQixhQUFhLEVBQUUsbUNBQWlCO1FBQ2hDLGVBQWUsRUFBRSx5QkFBWTtRQUM3QixXQUFXLEVBQVgsd0JBQVc7UUFDWCxjQUFjLEVBQWQsMkJBQWM7UUFDZCxrQkFBa0IsRUFBbEIsK0JB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QUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ2pFLE9BQU87aUJBQ1Y7Z0JBRUQsVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEM7WUFFRCxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDMUIsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUN0QixPQUFPLDZCQUFvQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbEQsQ0FBQztnQkFDRCxZQUFZLEVBQUUsVUFBVTthQUMzQixDQUFDLENBQUM7UUFDUCxDQUFDO0tBQ0o7SUFDRCxRQUFRLEVBQUUsUUFBUTtDQUNyQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGgsIHsgam9pbiwgYmFzZW5hbWUsIHBhcnNlLCBub3JtYWxpemUsIGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBWdWUgZnJvbSAndnVlL2Rpc3QvdnVlJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IHRocm90dGxlLCBlc2NhcGVSZWdFeHAgfSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgcGtnTm9kZSBmcm9tICcuL3BrZy1ub2RlJztcbmltcG9ydCBwa2dEZXRhaWwgZnJvbSAnLi9kZXRhaWwnO1xuaW1wb3J0IHBrZ0xpc3QgZnJvbSAnLi9wa2ctbGlzdCc7XG5pbXBvcnQgeyBQYWNrYWdlU2VhcmNoTGlzdCB9IGZyb20gJy4vcGtnLXNlYXJjaC1saXN0JztcbmltcG9ydCB7IFRhYkRyb3Bkb3duLCBDdXN0b21EaWFsb2csIEN1c3RvbURyb3Bkb3duLCBDdXN0b21Ecm9wZG93bkl0ZW0gfSBmcm9tICcuLi9jb21wb25lbnRzJztcbmltcG9ydCB7IGluamVjdFNkayB9IGZyb20gJy4vc2RrJztcbmltcG9ydCB7IGluamVjdFN0b3JlIH0gZnJvbSAnLi9zdG9yZSc7XG5pbXBvcnQgeyBJTlRFUk5BTF9FVkVOVFMgfSBmcm9tICcuL2V2ZW50LWJ1cyc7XG5pbXBvcnQge1xuICAgIGhhbmRsZUNhbmNlbEltcG9ydCxcbiAgICBoYW5kbGVEZWNvbXByZXNzRmFpbCxcbiAgICBoYW5kbGVJbnZhbGlkUGF0aCxcbiAgICBoYW5kbGVVbmV4cGVjdGVkSW1wb3J0RXJyb3IsXG4gICAgc2xlZXAsXG4gICAgRkFLRV9BVVRIT1JfSUQsXG4gICAgaXNPbmxpbmVFeHRlbnNpb24sXG4gICAgbWF0Y2hJbnRlcm5hbE5hbWUsXG4gICAgQ2FuY2VsRXJyb3IsXG59IGZyb20gJy4uLy4uL3B1YmxpYy91dGlscyc7XG5pbXBvcnQge1xuICAgIGltcG9ydFBhY2thZ2UsXG4gICAgaW1wb3J0UGFja2FnZUZvbGRlcixcbiAgICBpbXBvcnRQYWNrYWdlU3ltbGluayxcbiAgICBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLFxufSBmcm9tICcuLi8uLi9wdWJsaWMvaW1wb3J0JztcblxuaW1wb3J0IHtcbiAgICBFeHRlbnNpb25EZXBlbmRlbmNpZXMsXG4gICAgRXh0ZW5zaW9uRGV0YWlsLFxuICAgIEV4dGVuc2lvbkluc3RhbGxlZFBhdGgsXG4gICAgRXh0ZW5zaW9uSXRlbSxcbiAgICBFeHRlbnNpb25JdGVtTG9jYWwsXG4gICAgRXh0ZW5zaW9uSXRlbU9ubGluZSxcbiAgICBFeHRlbnNpb25NYW5hZ2VyVGFiLFxuICAgIEV4dGVuc2lvblNvdXJjZVR5cGUsXG4gICAgUGFja2FnZUluZm8sXG4gICAgU291cmNlLFxuICAgIFBhY2thZ2VTZWFyY2hHcm91cCxcbn0gZnJvbSAnLi4vLi4vcHVibGljL2ludGVyZmFjZSc7XG5pbXBvcnQge1xuICAgIE1hbmFnZXIsXG4gICAgSUV4dGVuc2lvbkxpc3RSZXNwb25zZSxcbiAgICBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSxcbiAgICBJRXh0ZW5zaW9uQ29uZmlnLFxuICAgIElFeHRlbnNpb25MaXN0UGFyYW1zLFxuICAgIElMb2NhbEV4dGVuc2lvbkRldGFpbCxcbn0gZnJvbSAnQGVkaXRvci9leHRlbnNpb24tc2RrJztcblxudHlwZSBFZGl0b3JQa2dJbmZvID0gRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbztcblxuLyoqIOaYr+WQpuWcqOWFs+mXremhtemdoueahOaXtuWAmemHjeaWsOazqOWGjGV4dGVuc2lvbiAoKSAqL1xuZXhwb3J0IGNvbnN0IHVwZGF0ZUV4dGVuc2lvbk9wdGlvbiA9IHtcbiAgICAvKiog5piv5ZCm5Zyo5YWz6Zet6aG16Z2i55qE5pe25YCZ6YeN5paw5rOo5YaMZXh0ZW5zaW9uICovXG4gICAgaXNSZVJlZ2lzdGVyOiBmYWxzZSxcbiAgICAvKiogZXh0ZW5zaW9u55qE5Y2H57qn5YyF55qE5Zyw5Z2AICovXG4gICAgcGF0aDogJycsXG59O1xuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuICAgIDxkaXYgY2xhc3M9XCJleHRlbnNpb25cIj5cbiAgICAgICAgPCEtLSA8ZGl2IGNsYXNzPVwiZXh0ZW5zaW9uLWxheW91dFwiPiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxpc3QtbGF5b3V0XCI+XG4gICAgICAgICAgICA8aGVhZGVyIGNsYXNzPVwiaGVhZGVyXCIgdi1zaG93PVwiIWlzU2hvd1NlYXJjaGluZ1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJlbnRyeS10YWJzXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0YWItZHJvcGRvd25cbiAgICAgICAgICAgICAgICAgICAgICAgIHYtZm9yPVwiKHRhYiwgaW5kZXgpIGluIHRhYnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOmtleT1cInRhYi5pZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6YWN0aXZlLWxhYmVsPVwiYWN0aXZlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDpsYWJlbD1cInRhYi5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6Y2hpbGRyZW49XCJ0YWIuY2hpbGRyZW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgQHNlbGVjdD1cIm9uVGFiU2VsZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgPjwvdGFiLWRyb3Bkb3duPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidHJhbnNwYXJlbnQgZmVhdHVyZS1jb2wgZmVhdHVyZS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcD1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuc2VhcmNoX2V4dGVuc2lvbnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGNsaWNrPVwic3dpdGNoU2VhcmNoU3RhdHVzKClcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktaWNvbiB2YWx1ZT1cInNlYXJjaFwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgPEN1c3RvbURyb3Bkb3duIGNsYXNzPVwiYnV0dG9uLWdyb3VwIGZlYXR1cmUtY29sXCIgc2l6ZT1cIm1pbmlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50IGZlYXR1cmUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5pbXBvcnRfZXh0ZW5zaW9uc196aXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljay5zdG9wPVwiaW5zdGFsbCgpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktaWNvbiB2YWx1ZT1cImltcG9ydFwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGVtcGxhdGUgI292ZXJsYXk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEN1c3RvbURyb3Bkb3duSXRlbSBAY2xpY2s9XCJpbnN0YWxsUGtnRm9sZGVyKClcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3sgdCgnaW1wb3J0X2V4dGVuc2lvbnNfZm9sZGVyJykgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0N1c3RvbURyb3Bkb3duSXRlbT5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93bkl0ZW0gQGNsaWNrPVwiaW5zdGFsbFBrZ0RldigpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7IHQoJ2ltcG9ydF9leHRlbnNpb25zX2RldicpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9DdXN0b21Ecm9wZG93bkl0ZW0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgICA8L0N1c3RvbURyb3Bkb3duPlxuXG4gICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidHJhbnNwYXJlbnQgZmVhdHVyZS1jb2wgZmVhdHVyZS1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcD1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIucmVmcmVzaF9leHRlbnNpb25zXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljay5zdG9wPVwicmVmcmVzaExpc3QoKVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1pY29uIHZhbHVlPVwicmVmcmVzaFwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2hlYWRlcj5cbiAgICAgICAgICAgIDxoZWFkZXIgY2xhc3M9XCJoZWFkZXJcIiB2LXNob3c9XCJpc1Nob3dTZWFyY2hpbmdcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VhcmNoXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1pbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdy1jbGVhclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPVwic2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5zZWFyY2hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGNoYW5nZT1cImRvU2VhcmNoKCRldmVudClcIlxuICAgICAgICAgICAgICAgICAgICAgICAgQGJsdXI9XCJvblNlYXJjaEJsdXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOnZhbHVlPVwic2VhcmNoS2V5XCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8L3VpLWlucHV0PlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLmV4aXRfc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljay5zdG9wPVwic3dpdGNoU2VhcmNoU3RhdHVzKClcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgdmFsdWU9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLmNhbmNlbFwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgdi1zaG93PVwiIWlzU2hvd1NlYXJjaGluZyAmJiBhY3RpdmUgPT09IGl0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgIHYtZm9yPVwiaXRlbSBvZiBmbGF0VGFic1wiXG4gICAgICAgICAgICAgICAgOmtleT1cIml0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwibGlzdFwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHBrZy1saXN0XG4gICAgICAgICAgICAgICAgICAgIDpyZWY9XCJpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICAgICAgOmxhYmVsPVwiaXRlbS5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgIDphY3RpdmU9XCIhaXNTaG93U2VhcmNoaW5nICYmIGFjdGl2ZSA9PT0gaXRlbS5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgIEByZWZyZXNoPVwicmVmcmVzaExpc3RcIlxuICAgICAgICAgICAgICAgICAgICA6cGFnZS1zaXplPVwicGFnZVNpemVcIlxuICAgICAgICAgICAgICAgICAgICA6Y2hvb3NlZD1cImN1cnJlbnRQYWNrYWdlID8gY3VycmVudFBhY2thZ2UubmFtZSA6ICcnXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1saXN0PVwidXBkYXRlTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIEBjaG9vc2U9XCJjaG9vc2VcIlxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlLXBhY2thZ2U9XCJ1cGRhdGVQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHJlbW92ZS1wYWNrYWdlPVwicmVtb3ZlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEB1bmluc3RhbGwtcGFja2FnZT1cInVuaW5zdGFsbFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAc2V0LWVuYWJsZT1cInNldEVuYWJsZVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvcGtnLWxpc3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsaXN0XCIgdi1zaG93PVwiaXNTaG93U2VhcmNoaW5nXCI+XG4gICAgICAgICAgICAgICAgPHBrZy1zZWFyY2gtbGlzdFxuICAgICAgICAgICAgICAgICAgICByZWY9XCJzZWFyY2hfbGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPVwic2VhcmNoX2xpc3RcIlxuICAgICAgICAgICAgICAgICAgICA6aXMtc2VhcmNoPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgICAgIDphY3RpdmU9XCJpc1Nob3dTZWFyY2hpbmdcIlxuICAgICAgICAgICAgICAgICAgICBAcmVmcmVzaD1cInJlZnJlc2hMaXN0XCJcbiAgICAgICAgICAgICAgICAgICAgOnNlYXJjaC1rZXk9XCJzZWFyY2hLZXlcIlxuICAgICAgICAgICAgICAgICAgICA6cGFnZS1zaXplPVwicGFnZVNpemVcIlxuICAgICAgICAgICAgICAgICAgICA6Y2hvb3NlZD1cImN1cnJlbnRQYWNrYWdlID8gY3VycmVudFBhY2thZ2UubmFtZSA6ICcnXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1saXN0PVwidXBkYXRlTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIEBjaG9vc2U9XCJjaG9vc2VcIlxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlLXBhY2thZ2U9XCJ1cGRhdGVQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHJlbW92ZS1wYWNrYWdlPVwicmVtb3ZlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEB1bmluc3RhbGwtcGFja2FnZT1cInVuaW5zdGFsbFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAc2V0LWVuYWJsZT1cInNldEVuYWJsZVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvcGtnLXNlYXJjaC1saXN0PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZGV0YWlsLWxheW91dFwiPlxuICAgICAgICAgICAgPHBrZy1kZXRhaWxcbiAgICAgICAgICAgICAgICA6ZGV0YWlsPVwiY3VycmVudFBhY2thZ2VEZXRhaWxcIlxuICAgICAgICAgICAgICAgIDppbmZvPVwiY3VycmVudFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgIDpsb2FkaW5nPVwiZ2V0RGV0YWlsTG9hZGluZ1wiXG4gICAgICAgICAgICAgICAgOmVycm9yLW1lc3NhZ2U9XCJkZXRhaWxFcnJvck1lc3NhZ2VcIlxuICAgICAgICAgICAgICAgIEByZWZyZXNoPVwicmVmcmVzaERldGFpbFwiXG4gICAgICAgICAgICA+PC9wa2ctZGV0YWlsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPCEtLSA8L2Rpdj4gLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbXBvcnQtbG9hZGluZy1sYXlvdXRcIiB2LWlmPVwiaW1wb3J0TG9hZGluZ1wiPlxuICAgICAgICAgICAgPHVpLWxvYWRpbmc+PC91aS1sb2FkaW5nPlxuICAgICAgICAgICAgPHVpLWxhYmVsIHYtaWY9XCJpbXBvcnRFcnJvck1lc3NhZ2VcIiB2YWx1ZT1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuaW1wb3J0X2Vycm9yX3RpcFwiPiA8L3VpLWxhYmVsPlxuICAgICAgICAgICAgPGRpdiB2LWlmPVwiaW1wb3J0RXJyb3JNZXNzYWdlXCI+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBjbGFzcz1cInRyYW5zcGFyZW50XCIgQGNsaWNrPVwiY2FuY2VsUmV0cnlJbXBvcnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5jYW5jZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gQGNsaWNrPVwicmV0cnlJbXBvcnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5yZXRyeVwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwhLS0gPGN1c3RvbS1kaWFsb2cgdi1pZj1cImV4dGVuc2lvbkRlcGVuZGVuY2llc1wiIDppbmZvPVwiZXh0ZW5zaW9uRGVwZW5kZW5jaWVzXCIgQGNhbmNlbD1cImRpYWxvZ0NhbmNlbFwiXG4gICAgICAgIEBjb25maXJtPVwiZGlhbG9nQ29uZmlybVwiPjwvY3VzdG9tLWRpYWxvZz4gLS0+XG4gICAgPC9kaXY+XG5gO1xuXG5leHBvcnQgY29uc3QgUGFuZWxBcHAgPSBWdWUuZXh0ZW5kKHtcbiAgICBuYW1lOiAnRXh0ZW5zaW9uTWFuYWdlcicsXG4gICAgY29tcG9uZW50czoge1xuICAgICAgICAncGtnLW5vZGUnOiBwa2dOb2RlLFxuICAgICAgICAncGtnLWRldGFpbCc6IHBrZ0RldGFpbCxcbiAgICAgICAgJ3BrZy1saXN0JzogcGtnTGlzdCxcbiAgICAgICAgUGtnU2VhcmNoTGlzdDogUGFja2FnZVNlYXJjaExpc3QsXG4gICAgICAgICdjdXN0b20tZGlhbG9nJzogQ3VzdG9tRGlhbG9nLFxuICAgICAgICBUYWJEcm9wZG93bixcbiAgICAgICAgQ3VzdG9tRHJvcGRvd24sXG4gICAgICAgIEN1c3RvbURyb3Bkb3duSXRlbSxcbiAgICB9LFxuICAgIGluamVjdDoge1xuICAgICAgICAuLi5pbmplY3RTZGsoKSxcblxuICAgICAgICAuLi5pbmplY3RTdG9yZSgpLFxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKiDpobXnrb7liJfooajvvIzmmoLml7bpmpDol4/kuoblt7LotK3kubAgKi9cbiAgICAgICAgICAgIHRhYnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zLFxuICAgICAgICAgICAgICAgICAgICBpZDogMSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlB1cmNoYXNlZCxcbiAgICAgICAgICAgICAgICAvLyAgICAgaWQ6IDIsXG4gICAgICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IDMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAvKiog5omB5bmz5YyW5ZCO55qE6aG1562+77yM55So5LqO5riy5p+T5a6e6ZmF6aG16Z2iICovXG4gICAgICAgICAgICBmbGF0VGFiczogW10gYXMgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiB9W10sXG4gICAgICAgICAgICAvKiog5b2T5YmN5omA5pi+56S655qE6aG1562+ICovXG4gICAgICAgICAgICBhY3RpdmU6IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgIC8qKiDlvZPliY3pgInkuK3nmoTmj5Lku7YgKi9cbiAgICAgICAgICAgIGN1cnJlbnRQYWNrYWdlOiBudWxsIGFzIEV4dGVuc2lvbkl0ZW0gfCBudWxsLFxuICAgICAgICAgICAgLyoqIOW9k+WJjemAieS4reeahOaPkuS7tueahOivpuaDhSAqL1xuICAgICAgICAgICAgY3VycmVudFBhY2thZ2VEZXRhaWw6IG51bGwgYXMgRXh0ZW5zaW9uRGV0YWlsIHwgbnVsbCxcbiAgICAgICAgICAgIC8qKiDojrflj5bmj5Lku7bor6bmg4XnmoTmiqXplJkgKi9cbiAgICAgICAgICAgIGRldGFpbEVycm9yTWVzc2FnZTogJycsXG4gICAgICAgICAgICAvKiog5piv5ZCm5aSE5Zyo5pCc57Si5qCP5LitICovXG4gICAgICAgICAgICBpc1Nob3dTZWFyY2hpbmc6IGZhbHNlLFxuICAgICAgICAgICAgLyoqIOaQnOe0oumhtemdoueahOaJgOWkhOWIl+ihqOmhtSovXG4gICAgICAgICAgICBwYWdlOiAxLFxuICAgICAgICAgICAgLyoqIOavj+asoeWKoOi9veadoeaVsCAg55uu5YmN55Sx5LqO5YaF572u5o+S5Lu25ZKM5bey5a6J6KOF5o+S5Lu26ZyA6KaB5LqL5YWI5omr5o+P5Ye65YWo6YOo77yM5Zug5q2k5pqC5pe25LiN5YGa5YiG6aG15aSE55CGKi9cbiAgICAgICAgICAgIHBhZ2VTaXplOiA5OTk5OSxcbiAgICAgICAgICAgIC8qKiDmupDliJfooaggKi9cbiAgICAgICAgICAgIHNvdXJjZUxpc3Q6IFtdIGFzIFNvdXJjZVtdLFxuICAgICAgICAgICAgLyoqIOiOt+WPluivpuaDheeahExvYWRpbmcgKi9cbiAgICAgICAgICAgIGdldERldGFpbExvYWRpbmc6IGZhbHNlLFxuXG4gICAgICAgICAgICAvKiog5pCc57Si5YWz6ZSu5a2XICovXG4gICAgICAgICAgICBzZWFyY2hLZXk6ICcnLFxuICAgICAgICAgICAgLyoqIOaQnOe0ouaXtumXtOaIs+OAguavj+asoeaQnOe0ouaTjeS9nOeahOagh+iusO+8jOeUqOS6juWunueOsCBzd2l0Y2gg5pWI5p6cICovXG4gICAgICAgICAgICBzZWFyY2hUaW1lc3RhbXA6IC0xLFxuICAgICAgICAgICAgLyoqIOaQnOe0oueahOiKgua1gSAqL1xuICAgICAgICAgICAgc2VhcmNoVGhyb3R0bGU6IG51bGwgYXMgbnVsbCB8ICgoLi4uYXJnczogYW55KSA9PiB2b2lkKSxcblxuICAgICAgICAgICAgLyoqIOW3suWuieijheeahOWIl+ihqCwg5LiT5oyHaW5zdGFsbGVk6aG1562+5LiL55qE5YiX6KGo77yM5Lmf5bCx5piv6Z2e5YaF572u55qE5o+S5Lu2ICovXG4gICAgICAgICAgICBpbnN0YWxsZWRMaXN0OiBbXSBhcyBFeHRlbnNpb25JdGVtW10sXG4gICAgICAgICAgICAvKiogRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKeaJq+aPj+WHuuadpeeahOaJgOacieaPkuS7tiAqL1xuICAgICAgICAgICAgYWxsUGFja2FnZXM6IFtdIGFzIEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm9bXSxcbiAgICAgICAgICAgIC8qKiDmj5Lku7bkvp3otZbnmoTlvLnnqpfpmJ/liJcgKi9cbiAgICAgICAgICAgIGV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3Q6IFtdIGFzIEV4dGVuc2lvbkRlcGVuZGVuY2llc1tdLFxuICAgICAgICAgICAgLyoqIOaPkuS7tuS+nei1lueahOW8ueeql+S/oeaBryAqL1xuICAgICAgICAgICAgZXh0ZW5zaW9uRGVwZW5kZW5jaWVzOiBudWxsIGFzIEV4dGVuc2lvbkRlcGVuZGVuY2llcyB8IG51bGwsXG4gICAgICAgICAgICAvKiog5a+85YWl5o+S5Lu25pe255qE5oql6ZSZ5L+h5oGvICovXG4gICAgICAgICAgICBpbXBvcnRFcnJvck1lc3NhZ2U6ICcnLFxuICAgICAgICAgICAgLyoqIOWvvOWFpeaPkuS7tuaXtueahGxvYWRpbmfnirbmgIEgKi9cbiAgICAgICAgICAgIGltcG9ydExvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgLyoqIOWvvOWFpeaPkuS7tueahOi3r+W+hOe8k+WtmO+8jOeUqOS6juWQjue7reeahOmHjeivleWvvOWFpSAqL1xuICAgICAgICAgICAgaW1wb3J0UGF0aENhY2hlOiAnJyxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIC8qKiDlvZPliY3nmoTkvp3otZbmj5Lku7bnmoTlvLnnqpfkv6Hmga/vvIznlKjkuo7op6blj5HlvLnnqpfpmJ/liJcgKi9cbiAgICAgICAgZXh0ZW5zaW9uRGVwZW5kZW5jaWVzKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlICYmIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMgPSB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3Quc2hpZnQoKSE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBjcmVhdGVkKCkge1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdlbmFibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2Rpc2FibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIEVkaXRvci5NZXNzYWdlLmFkZEJyb2FkY2FzdExpc3RlbmVyKCdpMThuOmNoYW5nZScsIHRoaXMub25JMThuQ2hhbmdlKTtcbiAgICB9LFxuICAgIG1vdW50ZWQoKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlRmxhdFRhYnMoKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG5cbiAgICAgICAgLy8g5pSv5oyB5ZyoIHBhbmVsIOaJk+W8gOaXtuaMh+WumuaQnOe0oueKtuaAgVxuICAgICAgICBjb25zdCBzdGFydHVwUGFyYW1zID0gdGhpcy5zdG9yZS5zdGFydHVwUGFyYW1zLnZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHN0YXJ0dXBQYXJhbXMuc2VhcmNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5vblNlYXJjaEV2ZW50KHN0YXJ0dXBQYXJhbXMuc2VhcmNoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZJWE1FOiDkuI3lupTlsIYgdnVlIOS9nOS4uuS6i+S7tuaAu+e6v+OAguWQjue7reiAg+iZkeW8leWFpSByeGpzIOadpeWkhOeQhlxuICAgICAgICB0aGlzLiRyb290LiRvbihJTlRFUk5BTF9FVkVOVFMuc2VhcmNoLCB0aGlzLm9uU2VhcmNoRXZlbnQpO1xuICAgIH0sXG4gICAgYmVmb3JlRGVzdHJveSgpIHtcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5yZW1vdmVMaXN0ZW5lcignZW5hYmxlJywgdGhpcy50b2dnbGVFbmFibGVIYW5kbGUpO1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdkaXNhYmxlJywgdGhpcy50b2dnbGVFbmFibGVIYW5kbGUpO1xuICAgICAgICB0aGlzLiRyb290LiRvZmYoSU5URVJOQUxfRVZFTlRTLnNlYXJjaCwgdGhpcy5vblNlYXJjaEV2ZW50KTtcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVtb3ZlQnJvYWRjYXN0TGlzdGVuZXIoJ2kxOG46Y2hhbmdlJywgdGhpcy5vbkkxOG5DaGFuZ2UpO1xuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICAvKipcbiAgICAgICAgICog57+76K+RXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XG4gICAgICAgICAqL1xuICAgICAgICB0KGtleTogc3RyaW5nLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgICAgICAgICAgIEVkaXRvci5JMThuLmdldExhbmd1YWdlO1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoYGV4dGVuc2lvbi5tYW5hZ2VyLiR7a2V5fWAsIHBhcmFtcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3VyTGFuZ3VhZ2UoKTogJ3poJyB8ICdlbicge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLmdldExhbmd1YWdlKCkgYXMgJ3poJyB8ICdlbic7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25JMThuQ2hhbmdlKCkge1xuICAgICAgICAgICAgLy8gdGhpcy5yZWZyZXNoRGV0YWlsKCk7XG4gICAgICAgICAgICAvLyByZWZyZXNoTGlzdCDkvJroh6rliqjpgInkuK3liJfooajnrKzkuIDpobnvvIzkuI3kuIDlrprmmK/nlKjmiLfmnJ/mnJvnmoTooYzkuLpcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaExpc3QoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5Yid5aeL5YyWICovXG4gICAgICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgICAgICAvLyB0aGlzLnNvdXJjZUxpc3QgPSBhd2FpdCBTREsuZ2V0U291cmNlTGlzdCgpO1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsZWRMaXN0ID0gYXdhaXQgdGhpcy5zY2FuTG9jYWwoKTtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdGhpcy50YWJzWzBdLmxhYmVsO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaHJvdHRsZSA9IHRocm90dGxlKHRoaXMuaGFuZGxlU2VhcmNoLCAzMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOaLjeW5s+W1jOWll+e7k+aehOeahOmhteetvuaVsOe7hCAqL1xuICAgICAgICBoYW5kbGVGbGF0VGFicygpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuOiBNYXA8c3RyaW5nLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiIH0+ID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgY29uc3QgdGFiczogeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiB9W10gPSBbXTtcbiAgICAgICAgICAgIHRoaXMudGFicy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgdGFicy5wdXNoKHsgbGFiZWw6IGl0ZW0ubGFiZWwgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGlsZHJlbi5mb3JFYWNoKCh2KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodi5sYWJlbCAhPT0gaXRlbS5sYWJlbCkgY2hpbGRyZW4uc2V0KHYubGFiZWwsIHsgbGFiZWw6IHYubGFiZWwgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2hpbGRyZW4uZm9yRWFjaCgodikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGFicy5maW5kKChlKSA9PiBlLmxhYmVsID09PSB2LmxhYmVsKSkgdGFicy5wdXNoKHsgbGFiZWw6IHYubGFiZWwgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZmxhdFRhYnMgPSB0YWJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDpgInkuK3mj5Lku7YgKi9cbiAgICAgICAgYXN5bmMgY2hvb3NlKHBrZzogRXh0ZW5zaW9uSXRlbSB8IHVuZGVmaW5lZCB8IG51bGwpIHtcbiAgICAgICAgICAgIC8vIOS8oOWFpeepuuWAvOaXtumHjee9riBjdXJyZW50IOaVsOaNrlxuICAgICAgICAgICAgaWYgKHBrZyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAocGtnICYmICF0aGlzLmN1cnJlbnRQYWNrYWdlKSB8fFxuICAgICAgICAgICAgICAgICF0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsIHx8XG4gICAgICAgICAgICAgICAgcGtnLm5hbWUgIT09IHRoaXMuY3VycmVudFBhY2thZ2U/Lm5hbWUgfHxcbiAgICAgICAgICAgICAgICBwa2cudmVyc2lvbiAhPT0gdGhpcy5jdXJyZW50UGFja2FnZS52ZXJzaW9uIHx8XG4gICAgICAgICAgICAgICAgcGtnLnZlcnNpb24gIT09IHRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwudmVyc2lvblxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRQYWNrYWdlRGV0YWlsKHBrZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOa4hemZpOW9k+WJjeeahOmAieS4reivpuaDhSAqL1xuICAgICAgICBjbGVhckN1cnJlbnREZXRhaWwoKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5kZXRhaWxFcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIHRoaXMuZ2V0RGV0YWlsTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDojrflj5bmj5Lku7bor6bmg4UgKi9cbiAgICAgICAgZ2V0UGFja2FnZURldGFpbChpdGVtOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICB0aGlzLmdldERldGFpbExvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZSA9IHsgLi4uaXRlbSB9O1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgY29uc3QgcGFyYW0gPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IGl0ZW0udmVyc2lvbixcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiDor63oqIDlj5jljJblkI7mm7TmlrAgZGV0YWlsIOWGheWuuVxuICAgICAgICAgICAgICAgIGxhbmc6IHRoaXMuY3VyTGFuZ3VhZ2UoKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZGtcbiAgICAgICAgICAgICAgICAuZ2V0RXh0ZW5zaW9uRGV0YWlsKHBhcmFtKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcyAmJiB0eXBlb2YgcmVzLm5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFja2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHJlcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiByZXMudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaF9hdDogcmVzLnB1Ymxpc2hfYXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb25fbGltaXQ6IHJlcy5lZGl0b3JfbGltaXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcmVzLmRldGFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogcmVzLnNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiByZXMuaWNvbl91cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmN1cnJlbnRQYWNrYWdlLnZlcnNpb24gPSByZXMudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLnBhdGggIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZGtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucXVlcnlMb2NhbEV4dGVuc2lvbkRldGFpbChpdGVtLnBhdGgsIHRoaXMuY3VyTGFuZ3VhZ2UoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoZGV0YWlsOiBJTG9jYWxFeHRlbnNpb25EZXRhaWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRldGFpbCAmJiB0eXBlb2YgZGV0YWlsLm5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFja2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dGhvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IEZBS0VfQVVUSE9SX0lELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV0YWlsLmF1dGhvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV0YWlsLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGRldGFpbC52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoX2F0OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uX2xpbWl0OiBkZXRhaWwuZWRpdG9yX2xpbWl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbC5kZXRhaWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IHJlcy5zaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uX3VybDogcmVzLmljb25fdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZS52ZXJzaW9uID0gZGV0YWlsLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhaWxFcnJvck1lc3NhZ2UgPSB0aGlzLnQoJ2RldGFpbF9lcnJvcl90aXAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhaWxFcnJvck1lc3NhZ2UgPSB0aGlzLnQoJ25ldHdvcmtfZXJyb3JfdGlwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWNrYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hfYXQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb25fbGltaXQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uX3VybDogaXRlbS5pY29uX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2UudmVyc2lvbiA9IGl0ZW0udmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhaWxFcnJvck1lc3NhZ2UgPSB0aGlzLnQoJ25ldHdvcmtfZXJyb3JfdGlwJyk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXREZXRhaWxMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWQr+eUqC/lhbPpl63mj5Lku7ZcbiAgICAgICAgICogQHBhcmFtIG5hbWUg5o+S5Lu25ZCNXG4gICAgICAgICAqIEBwYXJhbSBlbmFibGUg6K6+572u5o+S5Lu255qE5byA5ZCv54q25oCB77yMdHJ1ZSDlvIDlkK/vvIxmYWxzZSDlhbPpl61cbiAgICAgICAgICogQHBhcmFtIHBhdGgg5o+S5Lu26Lev5b6EXG4gICAgICAgICAqIEByZXR1cm5zXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBzZXRFbmFibGUobmFtZTogc3RyaW5nLCBlbmFibGU6IGJvb2xlYW4sIHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmVuYWJsZShwYXRoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5kaXNhYmxlKHBhdGgsIHt9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnZXh0ZW5zaW9uJywgJ2VuYWJsZScsIHBhdGgsICFlbmFibGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpcCA9IGVuYWJsZSA/ICdkaXNhYmxlX2Vycm9yX3RpcCcgOiAnZW5hYmxlX2Vycm9yX3RpcCc7XG4gICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQodGlwKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDnlLFFZGl0b3IuUGFja2FnZS5vbuebkeWQrOWIsOWIh+aNouaIkOWKn+WQjueahOWbnuiwgyAqL1xuICAgICAgICB0b2dnbGVFbmFibGVIYW5kbGUoaXRlbTogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykge1xuICAgICAgICAgICAgWy4uLnRoaXMuZmxhdFRhYnMsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIH1dLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW3RhYi5sYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcblxuICAgICAgICAgICAgICAgIGVsLnRvZ2dsZUVuYWJsZUhhbmRsZShpdGVtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gRklYTUU6IOWFs+S6jui/memHjOWvueS6jiB0aGlzLmluc3RhbGxlZExpc3Qg5pWw5o2u55qE5pu05paw77yMIOebruWJjeWug+WSjCBJbnN0YWxsZWQgbGlzdCDpobXpnaLnmoQgbGlzdCDmlbDmja7mmK/lhbHkuqvnmoTvvIzopoHms6jmhI/jgIJcbiAgICAgICAgICAgIC8vIOabtOaWsOaTjeS9nOaaguaXtuS6pOeUsSBsaXN0IOe7hOS7tuadpeWujOaIkOabtOaWsO+8jOi/memHjOS4jeWGjeWBmuWGl+S9meabtOaWsOS6huOAglxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliLfmlrDlvZPliY3or6bmg4UgKi9cbiAgICAgICAgcmVmcmVzaERldGFpbCgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWNrYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRQYWNrYWdlRGV0YWlsKHRoaXMuY3VycmVudFBhY2thZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uVGFiU2VsZWN0KHRhYjogRXh0ZW5zaW9uTWFuYWdlclRhYikge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0YWI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWIh+aNouaQnOe0oueKtuaAgSAqL1xuICAgICAgICBzd2l0Y2hTZWFyY2hTdGF0dXMoc2VhcmNoaW5nPzogYm9vbGVhbikge1xuICAgICAgICAgICAgdGhpcy5pc1Nob3dTZWFyY2hpbmcgPSB0eXBlb2Ygc2VhcmNoaW5nID09PSAnYm9vbGVhbicgPyBzZWFyY2hpbmcgOiAhdGhpcy5pc1Nob3dTZWFyY2hpbmc7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaEtleSA9ICcnO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTaG93U2VhcmNoaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzLiRyZWZzLnNlYXJjaCBhcyBIVE1MSW5wdXRFbGVtZW50KS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaF0gYXMgYW55O1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDlsIZzZGvmiavmj4/lh7rnmoTmnKzlnLDmj5Lku7bvvIzkuI5FZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcygp5b6X5Yiw55qE5o+S5Lu26L+b6KGM6L+H5ruk5ZKM5aSE55CGICovXG4gICAgICAgIGZvcm1hdEluc3RhbGxlZEV4dGVuc2lvbihpdGVtOiBJRXh0ZW5zaW9uQ29uZmlnKTogRXh0ZW5zaW9uSXRlbUxvY2FsIHtcbiAgICAgICAgICAgIGNvbnN0IHBrZyA9IHRoaXMuYWxsUGFja2FnZXMuZmluZCgodikgPT4gdi5uYW1lID09PSBpdGVtLm5hbWUgJiYgdGhpcy5jaGVja1BhdGhUeXBlKHYucGF0aCkgPT09ICdsb2NhbCcpO1xuICAgICAgICAgICAgY29uc3QgaXNDb2Nvc1NvdXJjZSA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uOiBFeHRlbnNpb25JdGVtTG9jYWwgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IGl0ZW0udmVyc2lvbixcbiAgICAgICAgICAgICAgICBpY29uX3VybDogaXRlbS5pY29uX3VybCxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXRlbS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBlbmFibGU6IHBrZyA/IHBrZy5lbmFibGUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc0luc3RhbGxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICAgICAgICAgIHBhdGg6IGl0ZW0uZXh0ZW5zaW9uX3BhdGgsXG4gICAgICAgICAgICAgICAgaXNCdWlsdEluOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc0NvY29zU291cmNlLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHBrZz8uaW5mby5hdXRob3IpIHtcbiAgICAgICAgICAgICAgICBleHRlbnNpb24uYXV0aG9yID0ge1xuICAgICAgICAgICAgICAgICAgICBpZDogRkFLRV9BVVRIT1JfSUQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHBrZy5pbmZvLmF1dGhvcixcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gc3RhdFN5bmMoaXRlbS5leHRlbnNpb25fcGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlICYmIHR5cGVvZiBzdGF0ZS5tdGltZU1zID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25bJ210aW1lJ10gPSBzdGF0ZS5tdGltZU1zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge31cbiAgICAgICAgICAgIHJldHVybiBleHRlbnNpb247XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWkhOeQhue9kee7nOivt+axguS4reiOt+WPluWIsOeahOWumOaWueaPkuS7tuS/oeaBr++8jOWQjOaXtuWumOaWueaPkuS7tuacieWPr+iDveS5n+aYr+WGhee9ruaPkuS7tiAqL1xuICAgICAgICBmb3JtYXROZXRFeHRlbnNpb24oaXRlbTogSUV4dGVuc2lvbkxpc3RJdGVtUmVzcG9uc2UpOiBFeHRlbnNpb25JdGVtT25saW5lIHtcbiAgICAgICAgICAgIGNvbnN0IGlzQ29jb3NTb3VyY2UgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyDlhYjmo4DmtYsgbGFiZWwg5piv5ZCm5pyJIGJ1aWx0aW5cbiAgICAgICAgICAgIGxldCBpc0J1aWx0SW4gPVxuICAgICAgICAgICAgICAgIGl0ZW0ubGFiZWwgJiYgaXRlbS5sYWJlbC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgPyBpdGVtLmxhYmVsLmZpbmRJbmRleCgodikgPT4gdiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluKSA+IC0xXG4gICAgICAgICAgICAgICAgICAgIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGxldCBidWlsdGluUGtnOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IGNvdmVyUGtnOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgLy8g5aSE5LqOIGVuYWJsZWQg54q25oCB55qEIGNvdmVyIOexu+Wei+aPkuS7tlxuICAgICAgICAgICAgbGV0IGNvdmVyUGtnRW5hYmxlZDogRWRpdG9yUGtnSW5mbyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBsb2NhbFBrZzogRWRpdG9yUGtnSW5mbyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgLy8g5o+S5Lu255qEIHBhdGggdHlwZSDmmK8gYnVpbHRpbiDmiJYgY292ZXIg55qE5Lmf566XIGJ1aWx0aW7vvIzov5nph4zmiorlroPku6zmib7lh7rmnaXjgIJcbiAgICAgICAgICAgIC8vIOmBjeWOhuS4gOasoe+8jOWvu+aJvumcgOimgeeahOaPkuS7tuaVsOaNruOAguWPquS9v+eUqOesrOS4gOS4quaJvuWIsOeahOaVsOaNru+8iOWPqui/m+ihjOS4gOasoei1i+WAvFxuICAgICAgICAgICAgZm9yIChjb25zdCBwa2cgb2YgdGhpcy5hbGxQYWNrYWdlcykge1xuICAgICAgICAgICAgICAgIGlmIChwa2cubmFtZSAhPT0gaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhUeXBlID0gdGhpcy5jaGVja1BhdGhUeXBlKHBrZy5wYXRoKTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAocGF0aFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYnVpbHRpbic6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChidWlsdGluUGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsdGluUGtnID0gcGtnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvdmVyJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdmVyUGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3ZlclBrZyA9IHBrZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwa2cuZW5hYmxlICYmIGNvdmVyUGtnRW5hYmxlZCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY292ZXJQa2dFbmFibGVkID0gcGtnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjYXNlICdsb2NhbCc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbFBrZyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxQa2cgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlhajpg73mib7liLDmlbDmja7vvIzlgZzmraLmn6Xmib5cbiAgICAgICAgICAgICAgICBpZiAoYnVpbHRpblBrZyAhPSBudWxsICYmIGNvdmVyUGtnICE9IG51bGwgJiYgbG9jYWxQa2cgIT0gbnVsbCAmJiBjb3ZlclBrZ0VuYWJsZWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlzQnVpbHRJbiA9IGlzQnVpbHRJbiB8fCBidWlsdGluUGtnICE9IG51bGwgfHwgY292ZXJQa2cgIT0gbnVsbDtcblxuICAgICAgICAgICAgY29uc3QgcGtnID0gaXNCdWlsdEluID8gYnVpbHRpblBrZyA6IGxvY2FsUGtnO1xuXG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb25JdGVtOiBFeHRlbnNpb25JdGVtT25saW5lID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBwa2cgPyBwa2cudmVyc2lvbiA6IGl0ZW0ubGF0ZXN0X3ZlcnNpb24sXG4gICAgICAgICAgICAgICAgaWNvbl91cmw6IGl0ZW0uaWNvbl91cmwsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgZW5hYmxlOiBwa2c/LmVuYWJsZSA/PyBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc0luc3RhbGxlZDogcGtnID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGxhdGVzdF92ZXJzaW9uOiBpdGVtLmxhdGVzdF92ZXJzaW9uLFxuICAgICAgICAgICAgICAgIGxhdGVzdF9kZXNjcmlwdGlvbjogaXRlbS5sYXRlc3RfZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgdXBkYXRlX2F0OiBpdGVtLnVwZGF0ZV9hdCxcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICAgICAgICAgIHBhdGg6IHBrZyA/IHBrZy5wYXRoIDogJycsXG4gICAgICAgICAgICAgICAgaXNCdWlsdEluLFxuICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2UsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGV4dGVuc2lvbkl0ZW0uaXNCdWlsdEluKSB7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5idWlsdEluUGF0aCA9IGV4dGVuc2lvbkl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLmJ1aWx0SW5WZXJzaW9uID0gZXh0ZW5zaW9uSXRlbS52ZXJzaW9uO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvdmVyUGtnRW5hYmxlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW3suWQr+eUqOeahOWFqOWxgOimhuebluWuieijheWGhee9ruaPkuS7tlxuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLnZlcnNpb24gPSBjb3ZlclBrZ0VuYWJsZWQudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5wYXRoID0gY292ZXJQa2dFbmFibGVkLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0uZW5hYmxlID0gY292ZXJQa2dFbmFibGVkLmVuYWJsZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvdmVyUGtnICE9IG51bGwgJiYgZXh0ZW5zaW9uSXRlbS5lbmFibGUgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57yW6L6R5Zmo5YaF572u54mI5pys5pyq5ZCv55So77yM5LiU5a2Y5Zyo5YWo5bGA6KaG55uW5a6J6KOF55qE5YaF572u5o+S5Lu277yI5LiN5LiA5a6a5ZCv55So77yJ77yM6KaG55uW5pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0udmVyc2lvbiA9IGNvdmVyUGtnLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0ucGF0aCA9IGNvdmVyUGtnLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0uZW5hYmxlID0gY292ZXJQa2cuZW5hYmxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHRlbnNpb25JdGVtO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDojrflj5bnvZHnu5zkuIrnmoTlhoXnva7mj5Lku7bliJfooajlkI7vvIzkuI7mnKzlnLDlhoXnva7mj5Lku7bliJfooajov5vooYzlkIjlubYgKi9cbiAgICAgICAgbWVyZ2VCdWlsdEluRXh0ZW5zaW9uKGxpc3Q6IElFeHRlbnNpb25MaXN0SXRlbVJlc3BvbnNlW10pOiBFeHRlbnNpb25JdGVtW10ge1xuICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uczogRXh0ZW5zaW9uSXRlbVtdID0gbGlzdC5tYXAoKHYpID0+IHRoaXMuZm9ybWF0TmV0RXh0ZW5zaW9uKHYpKTtcblxuICAgICAgICAgICAgY29uc3QgYnVpbHRJbkxpc3QgPSB0aGlzLmFsbFBhY2thZ2VzLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAhZXh0ZW5zaW9ucy5maW5kKCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSkgJiYgdGhpcy5jaGVja1BhdGhUeXBlKGl0ZW0ucGF0aCkgPT09ICdidWlsdGluJztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyDms6jmhI/ov5nph4zmib7nmoTmmK/nvZHnu5zliJfooajkuK3mib7kuI3liLDljLnphY0gbmFtZSDnmoTmnKzlnLDopobnm5bmj5Lku7ZcbiAgICAgICAgICAgIGNvbnN0IG11bHRpcGxlVmVyc2lvbnMgPSB0aGlzLmFsbFBhY2thZ2VzLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAhZXh0ZW5zaW9ucy5maW5kKCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSkgJiYgdGhpcy5jaGVja1BhdGhUeXBlKGl0ZW0ucGF0aCkgPT09ICdjb3Zlcic7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYnVpbHRJbkxpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICBpY29uX3VybDogJycsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmluZm8uZGVzY3JpcHRpb24gPz8gJycsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZTogaXRlbS5lbmFibGUsXG4gICAgICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogaXRlbS5wYXRoLFxuICAgICAgICAgICAgICAgICAgICBpc0J1aWx0SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2U6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbXVsdGlwbGVWZXJzaW9ucy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBleHRlbnNpb25zLmZpbmRJbmRleCgodikgPT4gdi5uYW1lID09PSBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGl0ZW0udmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmluZm8uZGVzY3JpcHRpb24gPz8gJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGU6IGl0ZW0uZW5hYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNJbnN0YWxsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ25vbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0J1aWx0SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0NvY29zU291cmNlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLmVuYWJsZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb3ZlciDmj5Lku7bpnIDopoHlpITkuo7lkK/nlKjnirbmgIHvvIzmiY3kvJrlsIbmlbDmja4gbWVyZ2Ug6L+b5p2lXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLmJ1aWx0SW5QYXRoID0gZXh0ZW5zaW9uc1tpbmRleF0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uc1tpbmRleF0uYnVpbHRJblZlcnNpb24gPSBleHRlbnNpb25zW2luZGV4XS52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zW2luZGV4XS52ZXJzaW9uID0gaXRlbS52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zW2luZGV4XS5wYXRoID0gaXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zW2luZGV4XS5lbmFibGUgPSBpdGVtLmVuYWJsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbnM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOaQnOe0ouagj+inpuWPkeWbnuiwgyAqL1xuICAgICAgICBkb1NlYXJjaChldmVudDogQ3VzdG9tRXZlbnQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaEtleSA9IGV2ZW50Py50YXJnZXQ/LnZhbHVlID8/ICcnO1xuICAgICAgICAgICAgaWYgKHNlYXJjaEtleSA9PT0gdGhpcy5zZWFyY2hLZXkpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVGhyb3R0bGUgJiYgdGhpcy5zZWFyY2hUaHJvdHRsZShzZWFyY2hLZXkpO1xuICAgICAgICB9LFxuICAgICAgICBvblNlYXJjaEJsdXIoZTogRm9jdXNFdmVudCkge1xuICAgICAgICAgICAgLy8gRklYTUU6IOS4tOaXtuWkhOeQhuaWueahiO+8jOi+k+WFpeahhuWkseWOu+eEpueCueaXtu+8jOWmguaenOayoeacieaQnOe0ouWQjeensO+8jOiHquWKqOe7k+adn+aQnOe0oueKtuaAgeOAglxuICAgICAgICAgICAgLy8g5ZCO57ut5a6M5ZaE5pCc57Si5Yqf6IO95ZCO5bCx5LiN6ZyA6KaB6L+Z5Liq5aSE55CG5LqG44CC5rKh5pyJ5pCc57Si5ZCN56ew5pe25bqU5pi+56S65omA5pyJ5pWw5o2uXG4gICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hLZXkgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hTZWFyY2hTdGF0dXMoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDlj5HotbfmkJzntKIgKi9cbiAgICAgICAgaGFuZGxlU2VhcmNoKHNlYXJjaEtleTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaF0gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaEtleSA9IHNlYXJjaEtleTtcbiAgICAgICAgICAgIGlmIChzZWFyY2hLZXkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhZ2UgPSAxO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VhcmNoRXh0ZW5zaW9ucyh0aGlzLnNlYXJjaEtleSwgdGhpcy5wYWdlLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvblNlYXJjaEV2ZW50KG5hbWU/OiBzdHJpbmcgfCBib29sZWFuKSB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFNlYXJjaFN0YXR1cyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSB0cnVlIHx8IHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoU2VhcmNoU3RhdHVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlU2VhcmNoKG5hbWUgPT09IHRydWUgPyAnJyA6IG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIHVwZGF0ZVNlYXJjaEV4dGVuc2lvbnMocXVlcnk6IHN0cmluZywgcGFnZTogbnVtYmVyLCBwYWdlU2l6ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgICAgICBjb25zdCBxdWVyeVJFID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAocXVlcnkpKTtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gdGhpcy4kcmVmc1tFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaF0gYXMgSW5zdGFuY2VUeXBlPHR5cGVvZiBQYWNrYWdlU2VhcmNoTGlzdD47XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcmFtOiBJRXh0ZW5zaW9uTGlzdFBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBlOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgcTogcXVlcnksXG4gICAgICAgICAgICAgICAgbGFuZzogdGhpcy5jdXJMYW5ndWFnZSgpLFxuICAgICAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICAgICAgcGFnZVNpemUsXG4gICAgICAgICAgICAgICAgbGFiZWw6IFtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pCc57Si6ZyA6KaB5omL5Yqo5bim5LiK5qCH562+77yM6YG/5YWN5Zyo5omA5pyJ5qCH562+5Lit5pCc57Si77yI5ZCm5YiZ5pyJ5Lqb6ZqQ6JeP55qE5o+S5Lu25Lmf5Lya5LiA6LW36KKr5pCc57Si5Ye65p2l77yJXG4gICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIuQ29jb3MsXG4gICAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbixcbiAgICAgICAgICAgICAgICBdLmpvaW4oJywnKSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGVsLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBsZXQgc2VhcmNoUmVzdWx0OiBQYWNrYWdlU2VhcmNoR3JvdXBbXSA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHQgPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgICAgIC4uLltcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zLFxuICAgICAgICAgICAgICAgICAgICBdLm1hcDxQcm9taXNlPFBhY2thZ2VTZWFyY2hHcm91cD4+KGFzeW5jIChsYWJlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLnNkay5nZXRFeHRlbnNpb25MaXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ucGFyYW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacrOasoeaQnOe0oui/h+acn+WQju+8jOWQjue7reeahOWkhOeQhuS5n+S4jemcgOimgeS6hu+8jOebtOaOpemAmui/h+aKm+WHuiBlcnJvciDov5Tlm57nqbrmlbDmja7lsLHooYxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hUaW1lc3RhbXAgIT09IHRpbWVzdGFtcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgQ2FuY2VsRXJyb3IoJ3RpbWVzdGFtcCBjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWRMaXN0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLm1lcmdlQnVpbHRJbkV4dGVuc2lvbihyZXMucGFja2FnZXMpLmZpbHRlcigocGtnKSA9PiBxdWVyeVJFLnRlc3QocGtnLm5hbWUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiByZXMucGFja2FnZXMubWFwKHRoaXMuZm9ybWF0TmV0RXh0ZW5zaW9uKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdDogZm9ybWF0dGVkTGlzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IHJlcy5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuY2VsIOaXtuaKm+WHulxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDYW5jZWxFcnJvci5pc0NhbmNlbChlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdDogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBjYW5jZWwg5pe25LiN5YaN5omn6KGM5ZCO57ut6YC76L6RXG4gICAgICAgICAgICAgICAgaWYgKENhbmNlbEVycm9yLmlzQ2FuY2VsKGVycm9yKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5LiL6Z2i6YO95piv5ZCM5q2l5pa55rOV77yM5LiN6ZyA6KaB5YaN5Yik5patIHRpbWVzdGFtcCDkuoZcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJlZEluc3RhbGxlZCA9IHRoaXMuaW5zdGFsbGVkTGlzdC5maWx0ZXIoKHBrZykgPT4gcXVlcnlSRS50ZXN0KHBrZy5uYW1lKSk7XG4gICAgICAgICAgICAgICAgc2VhcmNoUmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBrZXk6IEV4dGVuc2lvbk1hbmFnZXJUYWIuSW5zdGFsbGVkLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIGxpc3Q6IGZpbHRlcmVkSW5zdGFsbGVkLFxuICAgICAgICAgICAgICAgICAgICB0b3RhbDogZmlsdGVyZWRJbnN0YWxsZWQubGVuZ3RoLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZWwuYmF0Y2hVcGRhdGVMaXN0KFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hSZXN1bHQucmVkdWNlKChwcmV2LCBjdXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2W2N1cnIua2V5XSA9IGN1cnI7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgICAgICAgICAgICAgfSwge30gYXMgUmVjb3JkPEV4dGVuc2lvbk1hbmFnZXJUYWIsIFBhY2thZ2VTZWFyY2hHcm91cD4pLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGVsLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5pu05paw5o+S5Lu25pWw57uEICovXG4gICAgICAgIGFzeW5jIHVwZGF0ZUxpc3QobGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIsIHBhZ2U6IG51bWJlciwgcGFnZV9zaXplOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhYiA9IHRoaXMuaXNTaG93U2VhcmNoaW5nID8gRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2ggOiBsYWJlbDtcbiAgICAgICAgICAgIGlmICh0YWIgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMb2NhdGlvbkV4dGVuc2lvbnMoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFiID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaEFsbFBhY2thZ2VzKCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVTZWFyY2hFeHRlbnNpb25zKHRoaXMuc2VhcmNoS2V5LCAxLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQWxsUGFja2FnZXMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUV4dGVuc2lvbnMobGFiZWwsIHRoaXMuc2VhcmNoS2V5LCBwYWdlLCBwYWdlX3NpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliLfmlrDmjInpkq7nmoTop6blj5HvvIzliLfmlrDlvZPliY3mv4DmtLvnmoTpnaLmnb/kuIvnmoTlhoXlrrnjgIIgaW5zdGFsbGVk5Li65omr5o+P5pys5Zyw5o+S5Lu277yM5YW25LuW5YiZ5Li66K+35rGC572R57uc5o+S5Lu2Ki9cbiAgICAgICAgLy8gRklYTUU6IOaYr+WQpuW6lOivpeWni+e7iOWIt+aWsOavj+S4quWPr+mAiSB0YWIgcGFuZWwg5YaF55qE5YaF5a6577yf5ZCm5YiZ55So5oi35Y+q6IO95LiA5Liq5Liq6Z2i5p2/5Y675Yi35paw44CCXG4gICAgICAgIGFzeW5jIHJlZnJlc2hMaXN0KCkge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlVGFiID0gdGhpcy5pc1Nob3dTZWFyY2hpbmcgPyBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCA6IHRoaXMuYWN0aXZlO1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbYWN0aXZlVGFiXSBhcyBhbnk7XG4gICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVzY2FuKHR5cGU6IFBhY2thZ2VJbmZvWyd0eXBlJ10pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnZXh0ZW5zaW9uJywgJ3NjYW5uaW5nJywgdHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAzLjYueCDniYjmnKznmoQg4oCc5omr5o+P5o+S5Lu24oCdIOaMiemSrueCueWHu+aXtu+8jOS8muWOu+S4u+i/m+eoi+aJi+WKqOabtOaWsOaPkuS7tuazqOWGjOS/oeaBr+OAglxuICAgICAgICAgICAgLy8g6L+Z6YeM5YWo6YOo5pu05paw77yM6ICM5LiN5YaN5qC55o2u5b2T5YmNIHRhYiDljLrliIZcbiAgICAgICAgICAgIGF3YWl0IHJlc2NhbignZ2xvYmFsJyk7XG4gICAgICAgICAgICBhd2FpdCByZXNjYW4oJ3Byb2plY3QnKTtcblxuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZVRhYiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUxvY2F0aW9uRXh0ZW5zaW9ucygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3RpdmVUYWIgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hBbGxQYWNrYWdlcygpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlU2VhcmNoRXh0ZW5zaW9ucyh0aGlzLnNlYXJjaEtleSwgMSwgdGhpcy5wYWdlU2l6ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQWxsUGFja2FnZXMoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUV4dGVuc2lvbnMoYWN0aXZlVGFiLCB0aGlzLnNlYXJjaEtleSwgMSwgdGhpcy5wYWdlU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOabtOaWsOmdnuacrOWcsOaPkuS7tuWIl+ihqFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgdXBkYXRlRXh0ZW5zaW9ucyhsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiwgcXVlcnk6IHN0cmluZywgcGFnZTogbnVtYmVyLCBwYWdlU2l6ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICBjb25zdCB0YWIgPSBsYWJlbDtcbiAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW3RhYl0gYXMgYW55O1xuXG4gICAgICAgICAgICAvLyBzZWFyY2gg6Z2i5p2/5Y2V54us5a6a5Yi26YC76L6RXG4gICAgICAgICAgICBpZiAoIWUgfHwgdGFiID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgZWwubG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBpZiAocGFnZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zdCBzb3VyY2VJZCA9IDE7Ly8g6L+Z6YeM5bqU6K+l5Y67dGFic+mHjOi/h+a7pFxuICAgICAgICAgICAgY29uc3QgcGFyYW06IElFeHRlbnNpb25MaXN0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGU6IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICBxOiBxdWVyeSxcbiAgICAgICAgICAgICAgICBsYW5nOiB0aGlzLmN1ckxhbmd1YWdlKCksXG4gICAgICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgICAgICBwYWdlU2l6ZSxcbiAgICAgICAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgLy8g6L+Z6YeM5o6S6Zmk5o6J5LiN6ZyA6KaB5bimIGxhYmVsIOeahOaDheWGte+8jOWFtuWug+eahOmDveW4puS4iiB0YWIgbGFiZWxcbiAgICAgICAgICAgICAgICBjYXNlIEV4dGVuc2lvbk1hbmFnZXJUYWIuSW5zdGFsbGVkOlxuICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5QdXJjaGFzZWQ6XG4gICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaDpcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBwYXJhbS5sYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgLmdldEV4dGVuc2lvbkxpc3QocGFyYW0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlczogSUV4dGVuc2lvbkxpc3RSZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHRlbnNpb25MaXN0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMubWVyZ2VCdWlsdEluRXh0ZW5zaW9uKHJlcy5wYWNrYWdlcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHJlcy5wYWNrYWdlcy5tYXAoKGl0ZW0pID0+IHRoaXMuZm9ybWF0TmV0RXh0ZW5zaW9uKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlTGlzdChleHRlbnNpb25MaXN0LCByZXMuY291bnQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzU2hvd1NlYXJjaGluZyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuUHVyY2hhc2VkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2Nvc1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEVycm9yKHRoaXMudCgnbmV0d29ya19lcnJvcl90aXAnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRFcnJvcih0aGlzLnQoJ2xvY2FsX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWwubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrDlt7Llronoo4Xmj5Lku7bliJfooaggKi9cbiAgICAgICAgYXN5bmMgdXBkYXRlTG9jYXRpb25FeHRlbnNpb25zKCkge1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWRdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgIGVsLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBGSVhNRe+8muWJr+S9nOeUqOOAgua4heepuuaPkuS7tuivpuaDhemhteWGheWuueOAguWQjue7reeci+aYr+WQpumcgOimge+8jOaIluiAheWPpuWkluWvu+aJvuS4gOS4quWkhOeQhuaWueW8j1xuICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcblxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuc2NhbkxvY2FsKCk7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiDms6jmhI8gaW5zdGFsbGVkIOWIl+ihqOi/memHjO+8jOS4pOS4quaVsOe7hOWvueixoeaYr+WFseS6q+eahO+8jOWvueaVsOe7hOOAgeaVsOe7hOWGheWvueixoeeahOaUueWKqOS8muWvueS4pOi+ueWQjOaXtuS6p+eUn+W9seWTjVxuICAgICAgICAgICAgdGhpcy5pbnN0YWxsZWRMaXN0ID0gbGlzdDtcbiAgICAgICAgICAgIGVsLnVwZGF0ZUxpc3QobGlzdCwgbGlzdC5sZW5ndGgpO1xuXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUxpc3RVcGRhdGUobGlzdCwgRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQpO1xuICAgICAgICAgICAgZWwubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlnKjmn5DkuKrliJfooajnmoTmlbDmja7mm7TmlrDlkI7vvIzlkIzmraXnu5nlhbbku5bliJfooahcbiAgICAgICAgICogQHBhcmFtIGxpc3RcbiAgICAgICAgICogQHBhcmFtIGxhYmVsXG4gICAgICAgICAqL1xuICAgICAgICBoYW5kbGVMaXN0VXBkYXRlKGxpc3Q6IEV4dGVuc2lvbkl0ZW1bXSwgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIpIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKHYpID0+IHYubGFiZWwgIT09IGxhYmVsKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiLmxhYmVsXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgICAgIGVsLmhhbmRsZUxpc3RVcGRhdGUobGlzdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgcmVmcmVzaEFsbFBhY2thZ2VzKCkge1xuICAgICAgICAgICAgdGhpcy5hbGxQYWNrYWdlcyA9IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaJq+aPj+W5tuWkhOeQhuacrOWcsOebruW9leS4i+eahOaPkuS7tu+8iOWQq+mhueebrueahGV4dGVuc2lvbnPnm67lvZXkuIvvvIzlj4rvvIlcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIHNjYW5Mb2NhbCgpIHtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNkay5zY2FuTG9jYWxFeHRlbnNpb25zKCk7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiBFZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcyDlrZjlnKjosIPnlKjml7bluo/pl67popjvvIzmnInml7bpnIDopoHnrYnlvoXlroPlhoXpg6jmlbDmja7mm7TmlrDjgIJcblxuICAgICAgICAgICAgLy8g5YW35L2T6ZyA6KaB562J5b6F5aSa5LmF77yM5pqC5pe25LiN5riF5qWaXG4gICAgICAgICAgICBhd2FpdCBzbGVlcCgxMDApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoQWxsUGFja2FnZXMoKTtcblxuICAgICAgICAgICAgY29uc3QgbGlzdDogRXh0ZW5zaW9uSXRlbVtdID0gW107XG4gICAgICAgICAgICBpbnN0YWxsZWRMaXN0LmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHYpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5uYW1lID09PSBpdGVtLm5hbWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2Ygdi5wYXRoID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tQYXRoVHlwZSh2LnBhdGgpID09PSAnbG9jYWwnLFxuICAgICAgICAgICAgICAgICAgICApLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5wdXNoKHRoaXMuZm9ybWF0SW5zdGFsbGVkRXh0ZW5zaW9uKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxpc3Quc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAodHlwZW9mIGIubXRpbWUgPT09ICdudW1iZXInID8gYi5tdGltZSA6IDApIC0gKHR5cGVvZiBhLm10aW1lID09PSAnbnVtYmVyJyA/IGEubXRpbWUgOiAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOajgOafpeaPkuS7tueahOexu+WIq1xuICAgICAgICAgKiBAcGFyYW0gcGF0aCDopoHmo4DmtYvnmoTmj5Lku7blronoo4Xot6/lvoRcbiAgICAgICAgICogQHJldHVybnMg5o+S5Lu257G75YirXG4gICAgICAgICAqL1xuICAgICAgICBjaGVja1BhdGhUeXBlKHBhdGg6IHN0cmluZyk6ICdvdGhlcicgfCAnbG9jYWwnIHwgJ2dsb2JhbCcgfCAnY292ZXInIHwgJ2J1aWx0aW4nIHtcbiAgICAgICAgICAgIHJldHVybiBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLmNoZWNrVHlwZShwYXRoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5pu05pawL+WuieijheaPkuS7tiAqL1xuICAgICAgICB1cGRhdGVQYWNrYWdlKG5hbWU6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nLCBpbmZvOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5pc0luc3RhbGxlZCAmJiBzZW12ZXIuZXEodmVyc2lvbiwgaW5mby52ZXJzaW9uKSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGluZm8uaXNCdWlsdEluICYmIHR5cGVvZiBpbmZvLmJ1aWx0SW5WZXJzaW9uID09PSAnc3RyaW5nJyAmJiBzZW12ZXIuZXEodmVyc2lvbiwgaW5mby5idWlsdEluVmVyc2lvbikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0QnVpbHRJblZlcnNpb24oaW5mbyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZG93bmxvYWQobmFtZSwgdmVyc2lvbiwgaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5b6A5bey5a6J6KOF5YiX6KGo5Lit5o+S5YWlXG4gICAgICAgIGFkZEluc3RhbGxlZFBhY2thZ2UoaXRlbTogRXh0ZW5zaW9uSXRlbSkge1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWRdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgZWwuYWRkUGFja2FnZShpdGVtKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5b2T6YCJ5oup55qE54mI5pys5Li65YaF572u54mI5pys5pe277yM5YiZ6KeG5Li66YeN572u5Yiw5YaF572u54mI5pysICovXG4gICAgICAgIGFzeW5jIHJlc2V0QnVpbHRJblZlcnNpb24oaXRlbTogRXh0ZW5zaW9uSXRlbSkge1xuICAgICAgICAgICAgaWYgKCFpdGVtIHx8ICFpdGVtLmJ1aWx0SW5QYXRoIHx8ICFpdGVtLmJ1aWx0SW5WZXJzaW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IHRyeVVuaW5zdGFsbCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDljbjovb3lhajlsYDnm67lvZXkuIvnmoTmj5Lku7bvvIzkvb/lvpflj6/ku6Xlr7nmiYDmnInpobnnm67nlJ/mlYhcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNkay51bmluc3RhbGwoaXRlbS5uYW1lLCB0aGlzLmV4dGVuc2lvblBhdGhzLmdsb2JhbCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y246L295aSx6LSl77yM5LiN5b2x5ZON5ZCO57ut6YC76L6R5omn6KGMXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChtYXRjaEludGVybmFsTmFtZShpdGVtLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKHRoaXMudCgndXBkYXRlX2V4dGVuc2lvbl90aXAnKSwge1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDEsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdleHRlbnNpb24nLCAnc2VsZi11cGRhdGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aDogaXRlbS5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFsbFBhdGg6IGl0ZW0uYnVpbHRJblBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBidWlsdEluUGF0aDogaXRlbS5idWlsdEluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25PcHRpb24uaXNSZVJlZ2lzdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uT3B0aW9uLnBhdGggPSBpdGVtLmJ1aWx0SW5QYXRoO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMoXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOWQjOS4i+aWuSBkb3dubG9hZC5wZXJJbnN0YWxsZWQg6ZKp5a2Q5Lit55qE5aSE55CGXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHZlcnNpb246IGl0ZW0udmVyc2lvbiwgcGF0aDogaXRlbS5wYXRoIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUoaXRlbS5uYW1lLCBmYWxzZSwgaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS51bnJlZ2lzdGVyKGl0ZW0ucGF0aCk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0cnlVbmluc3RhbGwoKTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgdHJ1ZSwgaXRlbS5idWlsdEluUGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICB7IHZlcnNpb246IGl0ZW0uYnVpbHRJblZlcnNpb24sIHBhdGg6IGl0ZW0uYnVpbHRJblBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGl0ZW0ucGF0aCA9IGl0ZW0uYnVpbHRJblBhdGg7XG4gICAgICAgICAgICAgICAgaXRlbS52ZXJzaW9uID0gaXRlbS5idWlsdEluVmVyc2lvbjtcbiAgICAgICAgICAgICAgICB0aGlzLmNob29zZShpdGVtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbnN0YWxsZWRMaXN0ID0gYXdhaXQgdGhpcy5zY2FuTG9jYWwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5LiL6L295o+S5Lu2ICovXG4gICAgICAgIGRvd25sb2FkKG5hbWU6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nLCBpdGVtOiBFeHRlbnNpb25JdGVtKSB7XG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb25QYXRocyA9IHRoaXMuZXh0ZW5zaW9uUGF0aHM7XG4gICAgICAgICAgICBjb25zdCBpbnN0YWxsUGF0aCA9IGl0ZW0uaXNCdWlsdEluID8gZXh0ZW5zaW9uUGF0aHMuZ2xvYmFsIDogZXh0ZW5zaW9uUGF0aHMucHJvamVjdDtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZSA9IHRoaXMuc2RrLmdldERvd25sb2FkZXIoXG4gICAgICAgICAgICAgICAgeyBuYW1lLCB2ZXJzaW9uLCBpbnN0YWxsUGF0aCB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZG93bmxvYWRQcm9ncmVzczogKHByb2dyZXNzOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzID0gTWF0aC5mbG9vcigxMDAgKiBwcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIG51bGwsIG51bGwsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcGVyRG93bmxvYWRlZDogYXN5bmMgKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzQnVpbHRJbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWvueS6juaJqeWxleeuoeeQhuWZqOS+i+Wklu+8jOWug+eahOabtOaWsOS4jeiDveWBmuWIsOWNs+aXtuemgeeUqOOAgeWPjeazqOWGjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWF0Y2hJbnRlcm5hbE5hbWUoaXRlbS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5wYXRoICE9PSBpdGVtLmJ1aWx0SW5QYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpnZ4gYnVpbHRpbiDml7blj43ms6jlhoxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWPjeazqOWGjOWFqOWxgCBidWlsdGluIOebruW9leS4i+W3suWuieijheeahOaPkuS7tu+8iOacquWQr+eUqO+8jOWboOatpOS4jeS8mui1sOS4iumdoueahOWIpOaWremAu+i+ke+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXN0ID0gaW5mby5pbnN0YWxsUGtnUGF0aCA/PyBwYXRoLnJlc29sdmUoaW5mby5pbnN0YWxsUGF0aCwgaW5mby5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZGlzdCkgJiYgdGhpcy5hbGxQYWNrYWdlcy5maW5kKChwa2cpID0+IHBrZy5wYXRoID09PSBkaXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUoaXRlbS5uYW1lLCBmYWxzZSwgZGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS51bnJlZ2lzdGVyKGRpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLmlzSW5zdGFsbGVkICYmIGl0ZW0ucGF0aCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcGVySW5zdGFsbGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGtnOiBFeHRlbnNpb25JdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bu26L+fNTAw5q+r56eS77yM5Zug5Li66K6+6K6h5biM5pyb5Zyo5LiL6L295a6M5oiQ5ZCO6IO96Iez5bCR5YGc55WZ5ZyoMTAwJeeKtuaAgeS4gOauteaXtumXtFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluZm8udGVtcFBhdGggIT09ICdzdHJpbmcnIHx8IGluZm8udGVtcFBhdGggPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBpbmZvLnRlbXBQYXRoOiBcIiR7aW5mby50ZW1wUGF0aH1cImApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hJbnRlcm5hbE5hbWUobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKHRoaXMudCgndXBkYXRlX2V4dGVuc2lvbl90aXAnKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW3RoaXMudCgnY29uZmlybScpLCB0aGlzLnQoJ2NhbmNlbCcpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZGlhbG9nUXVlc3Rpb24nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnZXh0ZW5zaW9uJywgJ3NlbGYtdXBkYXRlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFsbFBhdGg6IGluZm8udGVtcFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbHRJblBhdGg6IGl0ZW0uYnVpbHRJblBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUV4dGVuc2lvbk9wdGlvbi5pc1JlUmVnaXN0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uT3B0aW9uLnBhdGggPSBpbmZvLnRlbXBQYXRoO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpgInmi6nkuIvmrKHlkK/liqjml7bmm7TmlrDlgJnvvIznu5PmnZ/kuIvovb3nirbmgIFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOi/memHjOS9v+eUqOeahOaYr+W9k+WJjeeahOeJiOacrOWSjOi3r+W+hO+8jOebuOW9k+S6juayoeacieabtOaWsFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiDpnIDopoHkuIDkuKrmm7TlkIjnkIbnmoTnirbmgIHmm7TmlrDmnLrliLZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHZlcnNpb246IGl0ZW0udmVyc2lvbiwgcGF0aDogaXRlbS5wYXRoIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uaXNCdWlsdEluICYmIGl0ZW0uaXNDb2Nvc1NvdXJjZSAmJiAhaXRlbS5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwa2cuaXNJbnN0YWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGtnLmVuYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoaW5mby50ZW1wUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsIHRydWUsIGluZm8udGVtcFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwa2cudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy5wYXRoID0gaW5mby50ZW1wUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhuYW1lLCBudWxsLCB7IHZlcnNpb24sIHBhdGg6IGluZm8udGVtcFBhdGghIH0sIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob29zZShwa2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTG9jYXRpb25FeHRlbnNpb25zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhuYW1lLCB0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJyksIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IodGhpcy50KCdpbnN0YWxsX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZG93bmxvYWRlZDogYXN5bmMgKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbjogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmZvckVhY2goKHYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24uZGVwZW5kZW5jaWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB2Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2M6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHYudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcGVuRGlhbG9nKG9wdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlLmRvd25sb2FkKCkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IodGhpcy50KCdpbnN0YWxsX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIHRoaXMudCgnaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWwhuaPkuS7tueahOS4i+i9veeKtuaAgeWQjOatpeWIsOaJgOacieWIl+ihqCAqL1xuICAgICAgICB1cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgIGVycm9yOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogeyBwYXRoOiBzdHJpbmc7IHZlcnNpb246IHN0cmluZyB9IHwgbnVsbCxcbiAgICAgICAgICAgIHByb2dyZXNzOiBudW1iZXIgfCBudWxsLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgZWwudXBkYXRlRG93bmxvYWRTdGF0dXMobmFtZSwgZXJyb3IsIHN1Y2Nlc3MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5bCG5o+S5Lu255qE5Y246L2954q25oCB5ZCM5q2l5Yiw5omA5pyJ5YiX6KGoICovXG4gICAgICAgIHVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgIGl0ZW06IEV4dGVuc2lvbkl0ZW0sXG4gICAgICAgICAgICBlcnJvcjogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHsgcGF0aDogc3RyaW5nOyB2ZXJzaW9uOiBzdHJpbmcgfSB8IG51bGwsXG4gICAgICAgICAgICBwcm9ncmVzczogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBbLi4udGhpcy5mbGF0VGFicywgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2ggfV0uZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiLmxhYmVsXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiDlj6rmn6Xmib4gYnVpbHRpbiAmIGNvdmVy77yM5piv5ZCm5bqU6K+l5Yy65YiG5pi+56S677yfXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1aWx0SW4gPSB0aGlzLmFsbFBhY2thZ2VzLmZpbmQoKHYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhUeXBlID0gdGhpcy5jaGVja1BhdGhUeXBlKHYucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdi5uYW1lID09PSBpdGVtLm5hbWUgJiYgKHBhdGhUeXBlID09PSAnYnVpbHRpbicgfHwgcGF0aFR5cGUgPT09ICdjb3ZlcicpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0YWIubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzQnVpbHRJbiAmJiBidWlsdEluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBwYXRoOiBidWlsdEluPy5wYXRoLCB2ZXJzaW9uOiBidWlsdEluLnZlcnNpb24gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobG9jYWxJdGVtOiBFeHRlbnNpb25JdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOinpuWPkeWNuOi9veaTjeS9nOeahOaYr+WQpuaYr+W9k+WJjeWIl+ihqOS4reeahOaPkuS7tlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VuaW5zdGFsbGVkID0gaXRlbS5wYXRoID09PSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGlzVW5pbnN0YWxsZWQgPyAnJyA6IGxvY2FsSXRlbS5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6L+Z6YeM6KaB55So5YiX6KGo57uE5Lu25pys5Zyw55qE5pWw5o2u77yM6ICM5LiN5piv6Kem5Y+R5Y246L295pON5L2c6YKj5Liq5YiX6KGo55qE5pWw5o2uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVW5pbnN0YWxsZWQgJiYgaXNPbmxpbmVFeHRlbnNpb24obG9jYWxJdGVtKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxvY2FsSXRlbS5sYXRlc3RfdmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxvY2FsSXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobG9jYWxJdGVtOiBFeHRlbnNpb25JdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNVbmluc3RhbGxlZCA9IGl0ZW0ucGF0aCA9PT0gbG9jYWxJdGVtLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5leHRQYXRoID0gbG9jYWxJdGVtLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5leHRWZXJzaW9uID0gbG9jYWxJdGVtLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVW5pbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y246L2955qE5piv5YaF572u5YiX6KGo6YeM5b2T5YmN55qE5pi+56S66aG5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRQYXRoID0gYnVpbHRJbj8ucGF0aCA/PyAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFZlcnNpb24gPSBidWlsdEluPy52ZXJzaW9uID8/ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBuZXh0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogbmV4dFZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2g6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5pc0NvY29zU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGxvY2FsSXRlbTogRXh0ZW5zaW9uSXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiDlm6DkuLrnm67liY3mkJzntKLku4XlpITnkIbmnI3liqHnq6/ov5Tlm57nmoTmlbDmja7vvIzlm6DmraTljbjovb3lkI7nmoTnirbmgIHmm7TmlrDkuZ/lj6rpnIDopoHnroDljZXliKTmlq1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIOWIl+ihqOeahOaVsOaNruWcqOemu+W8gOWQjuS8mua4heepuu+8jOWboOatpOaaguaXtuS4jeS8muacieWcqOWIq+eahCB0YWIg5LiL5pu05pawIHNlYXJjaCDmlbDmja7nmoTpl67popjvvIxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWNs+atpOWkhCBsb2NhbEl0ZW0gPT09IGl0ZW3jgILkuLrkuobkuI7kuIrpnaLkuIDoh7TvvIzkvp3ml6fkvb/nlKggbG9jYWxJdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpc09ubGluZUV4dGVuc2lvbihsb2NhbEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBsb2NhbEl0ZW0ubGF0ZXN0X3ZlcnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGxvY2FsSXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmUoaXRlbS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmUoaXRlbS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhpdGVtLm5hbWUsIGVycm9yLCBzdWNjZXNzLCBwcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZURvd25sb2FkU3RhdHVzKGl0ZW0ubmFtZSwgZXJyb3IsIHN1Y2Nlc3MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5YiH5o2i5o+S5Lu255qE5Y246L29bG9hZGluZyAqL1xuICAgICAgICB1cGRhdGVVbmluc3RhbGxMb2FkaW5nKG5hbWU6IHN0cmluZywgaXNMb2FkaW5nOiBib29sZWFuKSB7XG4gICAgICAgICAgICBbLi4udGhpcy5mbGF0VGFicywgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2ggfV0uZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiLmxhYmVsXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbExvYWRpbmcobmFtZSwgaXNMb2FkaW5nKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5Y246L295o+S5Lu2ICovXG4gICAgICAgIGFzeW5jIHVuaW5zdGFsbFBhY2thZ2UobmFtZTogc3RyaW5nLCBpdGVtOiBFeHRlbnNpb25JdGVtLCBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYikge1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbbGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgLy8g5Yig6Zmk5YmN6K+i6ZeuXG4gICAgICAgICAgICBpZiAoaXRlbS5lbmFibGUgJiYgbGFiZWwgIT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuQnVpbHRJbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybih0aGlzLnQoJ2Nsb3NlX2V4dGVuc2lvbnNfdGlwJyksIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW3RoaXMudCgnY29uZmlybScpLCB0aGlzLnQoJ2NhbmNlbCcpXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiAxLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZGlhbG9nUXVlc3Rpb24nKSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2UgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKG5hbWUsIG51bGwsIHsgcGF0aDogaXRlbS5wYXRoLCB2ZXJzaW9uOiBpdGVtLnZlcnNpb24gfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShuYW1lLCAhaXRlbS5lbmFibGUsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGSVhNRTog5Y246L295o+S5Lu25pe25YWI5riF56m66K+m5oOF6aG15YaF5a6544CC5Li76KaB5piv5Li65LqG5ZKM5a6J6KOF5o+S5Lu25pe255qE6KGM5Li65YmN5ZCO5ZG85bqU44CC5ZCO57ut55yL55yL5piv5ZCm6ZyA6KaB5L+d55WZXG4gICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVVuaW5zdGFsbExvYWRpbmcobmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS51bnJlZ2lzdGVyKGl0ZW0ucGF0aCk7XG5cbiAgICAgICAgICAgIC8vIOWIm+W7uiBzZGsg5pe255qE5Y+C5pWw5Lit5Y+q5Lyg5YWl5LqG6aG555uu6Lev5b6E77yM5Zug5q2k6L+Z6YeM5Y+q5Lya5Y246L296aG555uu6Lev5b6E5LiL55qE5o+S5Lu2XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZGtcbiAgICAgICAgICAgICAgICAudW5pbnN0YWxsKG5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgdW5pbnN0YWxsUHJvZ3Jlc3M6IChwcm9ncmVzczogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcyA9IE1hdGguZmxvb3IoMTAwICogcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKG5hbWUsIG51bGwsIG51bGwsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdW5pbnN0YWxsZWQ6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaEludGVybmFsTmFtZShuYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBpdGVtLmJ1aWx0SW5QYXRoID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uYnVpbHRJblBhdGggIT09ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShuYW1lLCB0cnVlLCBpdGVtLmJ1aWx0SW5QYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVW5pbnN0YWxsU3RhdHVzKGl0ZW0sIG51bGwsIHsgcGF0aDogJycsIHZlcnNpb246ICcnIH0sIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsZWRMaXN0ID0gYXdhaXQgdGhpcy5zY2FuTG9jYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IodGhpcy50KCd1bmluc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgdGhpcy50KCd1bmluc3RhbGxfZXJyb3JfdGlwJyksIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOenu+mZpOacquWuieijheeahOaPkuS7tiAqL1xuICAgICAgICByZW1vdmVQYWNrYWdlKG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgdGFiID0gdGhpcy5pc1Nob3dTZWFyY2hpbmcgPyBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCA6IHRoaXMuYWN0aXZlO1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiXSBhcyBhbnk7XG4gICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgIC51bmluc3RhbGwobmFtZSwge1xuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxlZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ3JlbW92ZV9lcnJvcl90aXAnKSk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5omT5byA5by556qX77yM5bey5YGa6Zif5YiX5aSE55CG44CCIOS9huaYr+ebruWJjeW8ueeql+WKn+iDveWFiOmakOiXjyAqL1xuICAgICAgICBvcGVuRGlhbG9nKGluZm86IEV4dGVuc2lvbkRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgLy8gaWYgKHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXNMaXN0LnB1c2goaW5mbylcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMgPSBpbmZvXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBpZiAoaW5mby5kZXBlbmRlbmNpZXMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBpbmZvLmRlcGVuZGVuY2llcy5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGluZGV4ID4gMCA/IChtZXNzYWdlICs9IGDjgIEke2l0ZW0ubmFtZX1AJHtpdGVtLnZlcnNpb259YCkgOiAobWVzc2FnZSArPSBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiBgJHtpbmZvLm5hbWV9ICR7dGhpcy50KCdpbnN0YWxsX2RlcGVuZGVuY2VfdGlwJyl9YCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgICAgIHR5cGU6ICd3YXJuJyxcbiAgICAgICAgICAgICAgICBzb3VyY2U6ICdleHRlbnNpb24nLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqIOW8ueeql+eahOWPlua2iOaMiemSriAqL1xuICAgICAgICBkaWFsb2dDYW5jZWwoKSB7XG4gICAgICAgICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llcyA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOW8ueeql+eahOehruiupOaMiemSriAqL1xuICAgICAgICBkaWFsb2dDb25maXJtKGluZm86IEV4dGVuc2lvbkRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgaWYgKGluZm8uY2FsbGJhY2spIGluZm8uY2FsbGJhY2soKTtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog6YeN6K+V5a+85YWlICovXG4gICAgICAgIHJldHJ5SW1wb3J0KCkge1xuICAgICAgICAgICAgdGhpcy5pbXBvcnRFcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbCh0aGlzLmltcG9ydFBhdGhDYWNoZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWPlua2iOmHjeivleWvvOWFpe+8jOebtOaOpee7k+adnyAqL1xuICAgICAgICBjYW5jZWxSZXRyeUltcG9ydCgpIHtcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0RXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICB0aGlzLmltcG9ydFBhdGhDYWNoZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5pbXBvcnRMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Qb3B1cEltcG9ydE1vcmUoKSB7XG4gICAgICAgICAgICBFZGl0b3IuTWVudS5wb3B1cCh7XG4gICAgICAgICAgICAgICAgbWVudTogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogdGhpcy50KCdpbXBvcnRfZXh0ZW5zaW9uc19mb2xkZXInKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsUGtnRm9sZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogdGhpcy50KCdpbXBvcnRfZXh0ZW5zaW9uc19kZXYnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnN0YWxsUGtnRGV2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5a+85YWl5LiA5Liq5o+S5Lu25Y6L57yp5YyFXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbnN0YWxsKGZpbGVQYXRoID0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSAncHJvamVjdCc7XG4gICAgICAgICAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5zZWxlY3Qoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuc2VsZWN0WmlwJyksXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdaSVAnLCBleHRlbnNpb25zOiBbJ3ppcCddIH1dLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC5maWxlUGF0aHNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWxlUGF0aCA9IHJlc3VsdC5maWxlUGF0aHNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2VOYW1lID0gYmFzZW5hbWUoZmlsZVBhdGgsICcuemlwJyk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsUGtnVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFBhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW1wb3J0UGFja2FnZSh0eXBlLCBmaWxlUGF0aCwgeyBleHRlbnNpb25EaXNwbGF5TmFtZTogcGFja2FnZU5hbWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmRlY29tcHJlc3NGYWlsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZURlY29tcHJlc3NGYWlsKGZpbGVQYXRoLCBwYWNrYWdlTmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlpITnkIblronoo4XpgLvovpHnmoTmqKHmnb/mlrnms5XjgIJcbiAgICAgICAgICog5ZCO57ut6ZyA5rGC5Y+Y5pu05pe25Y+v5Lul5aKe5Yqg5pu05aSa5Y+C5pWw77yM5oiW6ICF5bCG5pW05Liq5qih5p2/5pa55rOV5ouG5pWj5oiQ5aSa5Liq5bCP5Ye95pWw77yM6K6p5ZCE5Liq6LCD55So5YWl5Y+j6Ieq5bex5Y6757uE5ZCI6LCD55SoXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBpbnN0YWxsUGtnVGVtcGxhdGUob3B0aW9uczoge1xuICAgICAgICAgICAgLy8g55So5oi36YCJ5Lit55qE6Lev5b6E77yI5paH5Lu25oiW5paH5Lu25aS577yJXG4gICAgICAgICAgICBzZWxlY3RlZFBhdGg6IHN0cmluZztcbiAgICAgICAgICAgIC8vIGltcG9ydCDmk43kvZznmoTlpITnkIblh73mlbDjgILov5Tlm54gaW1wb3J0IOWujOaIkOWQjueahCBkaXN0IOi3r+W+hFxuICAgICAgICAgICAgaW1wb3J0SGFuZGxlcjogKCkgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgICB9KSB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydExvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgLy8g5q+P5qyh5a+85YWl5byA5aeL5pe26YeN572u5LiK5LiA5qyh5a+85YWl55qE6ZSZ6K+v5L+h5oGvXG4gICAgICAgICAgICB0aGlzLmltcG9ydEVycm9yTWVzc2FnZSA9ICcnO1xuXG4gICAgICAgICAgICBjb25zdCB7IHNlbGVjdGVkUGF0aCB9ID0gb3B0aW9ucztcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgb3B0aW9ucy5pbXBvcnRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBpbXBvcnRlZCBwYWNrYWdlIHBhdGg6IFwiJHtwYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0UGF0aENhY2hlID0gJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZDtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaW5zdGFsbGVkTGlzdC5maW5kKCh2KSA9PiB2LnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwdGVkIHBhY2thZ2UgaW1wb3J0OiBjYW5ub3QgZmluZCBpbiBpbnN0YWxsZWQgbGlzdCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgdHJ1ZSwgcGF0aCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hMaXN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaG9vc2UoaXRlbSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0RXJyb3JNZXNzYWdlID0gdGhpcy50KCdpbXBvcnRfZXJyb3JfdGlwJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRQYXRoQ2FjaGUgPSBzZWxlY3RlZFBhdGg7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2FuY2VsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsUmV0cnlJbXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5jZWxJbXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZS5pbnZhbGlkUGF0aDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVJbnZhbGlkUGF0aChzZWxlY3RlZFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2Fubm90RmluZFBhY2thZ2VKc29uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IChlcnJvciBhcyBhbnkpLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmltcG9ydEVycm9yJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmNhbm5vdEZpbmRQYWNrYWdlSnNvbicsIHsgcGF0aDogZm9sZGVyUGF0aCB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogMTAwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaKm+WHuuiuqeWkluWxguWkhOeQhlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmRlY29tcHJlc3NGYWlsOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVVuZXhwZWN0ZWRJbXBvcnRFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGluc3RhbGxQa2dGb2xkZXIoZm9sZGVyUGF0aCA9ICcnKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gJ3Byb2plY3QnO1xuXG4gICAgICAgICAgICBpZiAoIWZvbGRlclBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLnNlbGVjdCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5zZWxlY3REaXJlY3RvcnknKSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpcmVjdG9yeScsXG4gICAgICAgICAgICAgICAgICAgIG11bHRpOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQuZmlsZVBhdGhzKSB8fCByZXN1bHQuZmlsZVBhdGhzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvbGRlclBhdGggPSByZXN1bHQuZmlsZVBhdGhzWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluc3RhbGxQa2dUZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRQYXRoOiBmb2xkZXJQYXRoLFxuICAgICAgICAgICAgICAgIGltcG9ydEhhbmRsZXI6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzdCA9IGF3YWl0IGltcG9ydFBhY2thZ2VGb2xkZXIodHlwZSwgZm9sZGVyUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXN0O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBpbnN0YWxsUGtnRGV2KGZvbGRlclBhdGggPSAnJykge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9ICdwcm9qZWN0JztcbiAgICAgICAgICAgIGlmICghZm9sZGVyUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cuc2VsZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnNlbGVjdERpcmVjdG9yeScpLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyZWN0b3J5JyxcbiAgICAgICAgICAgICAgICAgICAgbXVsdGk6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdC5maWxlUGF0aHMpIHx8IHJlc3VsdC5maWxlUGF0aHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9sZGVyUGF0aCA9IHJlc3VsdC5maWxlUGF0aHNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5zdGFsbFBrZ1RlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbXBvcnRQYWNrYWdlU3ltbGluayh0eXBlLCBmb2xkZXJQYXRoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxufSk7XG4iXX0=