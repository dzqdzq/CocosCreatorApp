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
                <pkg-list
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
                </pkg-list>
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
            pageSize: 9999,
            /** 源列表 */
            sourceList: [],
            /** 获取详情的Loading */
            getDetailLoading: false,
            /** 搜索关键字 */
            searchKey: '',
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
                this.updateExtensions(interface_1.ExtensionManagerTab.Search, this.searchKey, this.page, this.pageSize);
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
        /** 更新插件数组 */
        async updateList(label, page, page_size) {
            const tab = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : label;
            if (tab === interface_1.ExtensionManagerTab.Installed) {
                this.updateLocationExtensions();
            }
            else {
                this.updateExtensions(label, this.searchKey, page, page_size);
            }
        },
        /** 刷新按钮的触发， installed为扫描本地插件，其他则为请求网络插件*/
        async refreshList() {
            const tab = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : this.active;
            const e = this.$refs[tab];
            if (!e)
                return;
            // 3.6.x 版本的 “扫描插件” 按钮点击时，会去主进程手动更新插件注册信息。
            // 这里全部更新，而不再根据当前 tab 区分
            const updateTypeProject = 'project';
            await Editor.Message.request('extension', 'scanning', updateTypeProject);
            const el = e.length ? e[0] : e;
            if (tab === interface_1.ExtensionManagerTab.Installed) {
                await this.updateLocationExtensions();
            }
            else {
                el.reset();
                await this.updateExtensions(tab, this.searchKey, 1, this.pageSize);
            }
        },
        /**
         * 更新非本地插件列表
         */
        async updateExtensions(label, query, page, pageSize) {
            if (this.installedList.length === 0)
                this.installedList = await this.scanLocal();
            const tab = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : label;
            const e = this.$refs[tab];
            if (!e)
                return;
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
                    break;
                case interface_1.ExtensionManagerTab.Search:
                    param.label = [
                        // 搜索需要手动带上标签，避免在所有标签中搜索（否则有些隐藏的插件也会一起被搜索出来）
                        interface_1.ExtensionManagerTab.Cocos,
                        interface_1.ExtensionManagerTab.BuiltIn,
                    ].join(',');
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
        /**
         * 扫描并处理本地目录下的插件（含项目的extensions目录下，及）
         */
        async scanLocal() {
            const installedList = await this.sdk.scanLocalExtensions();
            // FIXME: Editor.Package.getPackages 存在调用时序问题，有时需要等待它内部数据更新。
            // 具体需要等待多久，暂时不清楚
            await utils_1.sleep(100);
            this.allPackages = Editor.Package.getPackages();
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
            if (item.name === 'extension') {
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
                        if (item.path !== item.builtInPath && item.name !== 'extension') {
                            await this.setEnable(item.name, false, item.path);
                            await Editor.Package.unregister(item.path);
                        }
                        else {
                            // 反注册全局 builtin 目录下已安装的插件（未启用，因此不会走上面的判断逻辑）
                            // FIXME: 插件最终安装目录的获取不应该在插件里面拼接，应该由 sdk 给出。
                            const dist = path_1.default.resolve(info.installPath, info.name);
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
                        if (name === 'extension') {
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
                    if (name === 'extension' && typeof item.builtInPath === 'string' && item.builtInPath !== '') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9tYW5hZ2VyL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQXdEO0FBQ3hELDZDQUF1RTtBQUN2RSx1REFBK0I7QUFDL0Isb0RBQTRCO0FBQzVCLG1DQUFrQztBQUVsQywwREFBaUM7QUFDakMsc0RBQWlDO0FBQ2pDLDBEQUFpQztBQUNqQyw4Q0FBOEY7QUFDOUYsK0JBQWtDO0FBQ2xDLG1DQUFzQztBQUN0QywyQ0FBOEM7QUFDOUMsOENBUTRCO0FBQzVCLGdEQUs2QjtBQUU3QixzREFXZ0M7QUFZaEMsaUNBQWlDO0FBQ3BCLFFBQUEscUJBQXFCLEdBQUc7SUFDakMsOEJBQThCO0lBQzlCLFlBQVksRUFBRSxLQUFLO0lBQ25CLHVCQUF1QjtJQUN2QixJQUFJLEVBQUUsRUFBRTtDQUNYLENBQUM7QUFFRixNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEkzQixDQUFDO0FBRVcsUUFBQSxRQUFRLEdBQUcsYUFBRyxDQUFDLE1BQU0sQ0FBQztJQUMvQixJQUFJLEVBQUUsa0JBQWtCO0lBQ3hCLFVBQVUsRUFBRTtRQUNSLFVBQVUsRUFBRSxrQkFBTztRQUNuQixZQUFZLEVBQUUsZ0JBQVM7UUFDdkIsVUFBVSxFQUFFLGtCQUFPO1FBQ25CLGVBQWUsRUFBRSx5QkFBWTtRQUM3QixXQUFXLEVBQVgsd0JBQVc7UUFDWCxjQUFjLEVBQWQsMkJBQWM7UUFDZCxrQkFBa0IsRUFBbEIsK0JBQWtCO0tBQ3JCO0lBQ0QsTUFBTSxFQUFFO1FBQ0osR0FBRyxl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QUFvQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbEQsQ0FBQztnQkFDRCxZQUFZLEVBQUUsVUFBVTthQUMzQixDQUFDLENBQUM7UUFDUCxDQUFDO0tBQ0o7SUFDRCxRQUFRLEVBQUUsUUFBUTtDQUNyQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGgsIHsgam9pbiwgYmFzZW5hbWUsIHBhcnNlLCBub3JtYWxpemUsIGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBWdWUgZnJvbSAndnVlL2Rpc3QvdnVlJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IHRocm90dGxlIH0gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHBrZ05vZGUgZnJvbSAnLi9wa2ctbm9kZSc7XG5pbXBvcnQgcGtnRGV0YWlsIGZyb20gJy4vZGV0YWlsJztcbmltcG9ydCBwa2dMaXN0IGZyb20gJy4vcGtnLWxpc3QnO1xuaW1wb3J0IHsgVGFiRHJvcGRvd24sIEN1c3RvbURpYWxvZywgQ3VzdG9tRHJvcGRvd24sIEN1c3RvbURyb3Bkb3duSXRlbSB9IGZyb20gJy4uL2NvbXBvbmVudHMnO1xuaW1wb3J0IHsgaW5qZWN0U2RrIH0gZnJvbSAnLi9zZGsnO1xuaW1wb3J0IHsgaW5qZWN0U3RvcmUgfSBmcm9tICcuL3N0b3JlJztcbmltcG9ydCB7IElOVEVSTkFMX0VWRU5UUyB9IGZyb20gJy4vZXZlbnQtYnVzJztcbmltcG9ydCB7XG4gICAgaGFuZGxlQ2FuY2VsSW1wb3J0LFxuICAgIGhhbmRsZURlY29tcHJlc3NGYWlsLFxuICAgIGhhbmRsZUludmFsaWRQYXRoLFxuICAgIGhhbmRsZVVuZXhwZWN0ZWRJbXBvcnRFcnJvcixcbiAgICBzbGVlcCxcbiAgICBGQUtFX0FVVEhPUl9JRCxcbiAgICBpc09ubGluZUV4dGVuc2lvbixcbn0gZnJvbSAnLi4vLi4vcHVibGljL3V0aWxzJztcbmltcG9ydCB7XG4gICAgaW1wb3J0UGFja2FnZSxcbiAgICBpbXBvcnRQYWNrYWdlRm9sZGVyLFxuICAgIGltcG9ydFBhY2thZ2VTeW1saW5rLFxuICAgIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UsXG59IGZyb20gJy4uLy4uL3B1YmxpYy9pbXBvcnQnO1xuXG5pbXBvcnQge1xuICAgIEV4dGVuc2lvbkRlcGVuZGVuY2llcyxcbiAgICBFeHRlbnNpb25EZXRhaWwsXG4gICAgRXh0ZW5zaW9uSW5zdGFsbGVkUGF0aCxcbiAgICBFeHRlbnNpb25JdGVtLFxuICAgIEV4dGVuc2lvbkl0ZW1Mb2NhbCxcbiAgICBFeHRlbnNpb25JdGVtT25saW5lLFxuICAgIEV4dGVuc2lvbk1hbmFnZXJUYWIsXG4gICAgRXh0ZW5zaW9uU291cmNlVHlwZSxcbiAgICBQYWNrYWdlSW5mbyxcbiAgICBTb3VyY2UsXG59IGZyb20gJy4uLy4uL3B1YmxpYy9pbnRlcmZhY2UnO1xuaW1wb3J0IHtcbiAgICBNYW5hZ2VyLFxuICAgIElFeHRlbnNpb25MaXN0UmVzcG9uc2UsXG4gICAgSUV4dGVuc2lvbkxpc3RJdGVtUmVzcG9uc2UsXG4gICAgSUV4dGVuc2lvbkNvbmZpZyxcbiAgICBJRXh0ZW5zaW9uTGlzdFBhcmFtcyxcbiAgICBJTG9jYWxFeHRlbnNpb25EZXRhaWwsXG59IGZyb20gJ0BlZGl0b3IvZXh0ZW5zaW9uLXNkayc7XG5cbnR5cGUgRWRpdG9yUGtnSW5mbyA9IEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm87XG5cbi8qKiDmmK/lkKblnKjlhbPpl63pobXpnaLnmoTml7blgJnph43mlrDms6jlhoxleHRlbnNpb24gKCkgKi9cbmV4cG9ydCBjb25zdCB1cGRhdGVFeHRlbnNpb25PcHRpb24gPSB7XG4gICAgLyoqIOaYr+WQpuWcqOWFs+mXremhtemdoueahOaXtuWAmemHjeaWsOazqOWGjGV4dGVuc2lvbiAqL1xuICAgIGlzUmVSZWdpc3RlcjogZmFsc2UsXG4gICAgLyoqIGV4dGVuc2lvbueahOWNh+e6p+WMheeahOWcsOWdgCAqL1xuICAgIHBhdGg6ICcnLFxufTtcblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbiAgICA8ZGl2IGNsYXNzPVwiZXh0ZW5zaW9uXCI+XG4gICAgICAgIDwhLS0gPGRpdiBjbGFzcz1cImV4dGVuc2lvbi1sYXlvdXRcIj4gLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJsaXN0LWxheW91dFwiPlxuICAgICAgICAgICAgPGhlYWRlciBjbGFzcz1cImhlYWRlclwiIHYtc2hvdz1cIiFpc1Nob3dTZWFyY2hpbmdcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZW50cnktdGFic1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGFiLWRyb3Bkb3duXG4gICAgICAgICAgICAgICAgICAgICAgICB2LWZvcj1cIih0YWIsIGluZGV4KSBpbiB0YWJzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDprZXk9XCJ0YWIuaWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOmFjdGl2ZS1sYWJlbD1cImFjdGl2ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6bGFiZWw9XCJ0YWIubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOmNoaWxkcmVuPVwidGFiLmNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3Q9XCJvblRhYlNlbGVjdFwiXG4gICAgICAgICAgICAgICAgICAgID48L3RhYi1kcm9wZG93bj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZmVhdHVyZVwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50IGZlYXR1cmUtY29sIGZlYXR1cmUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLnNlYXJjaF9leHRlbnNpb25zXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGljaz1cInN3aXRjaFNlYXJjaFN0YXR1cygpXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWljb24gdmFsdWU9XCJzZWFyY2hcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93biBjbGFzcz1cImJ1dHRvbi1ncm91cCBmZWF0dXJlLWNvbFwiIHNpemU9XCJtaW5pXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ0cmFuc3BhcmVudCBmZWF0dXJlLWJ0blwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHRpcD1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuaW1wb3J0X2V4dGVuc2lvbnNfemlwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2suc3RvcD1cImluc3RhbGwoKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWljb24gdmFsdWU9XCJpbXBvcnRcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPHRlbXBsYXRlICNvdmVybGF5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93bkl0ZW0gQGNsaWNrPVwiaW5zdGFsbFBrZ0ZvbGRlcigpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7IHQoJ2ltcG9ydF9leHRlbnNpb25zX2ZvbGRlcicpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9DdXN0b21Ecm9wZG93bkl0ZW0+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q3VzdG9tRHJvcGRvd25JdGVtIEBjbGljaz1cImluc3RhbGxQa2dEZXYoKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eyB0KCdpbXBvcnRfZXh0ZW5zaW9uc19kZXYnKSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQ3VzdG9tRHJvcGRvd25JdGVtPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICAgICAgPC9DdXN0b21Ecm9wZG93bj5cblxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRyYW5zcGFyZW50IGZlYXR1cmUtY29sIGZlYXR1cmUtYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLnJlZnJlc2hfZXh0ZW5zaW9uc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2suc3RvcD1cInJlZnJlc2hMaXN0KClcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktaWNvbiB2YWx1ZT1cInJlZnJlc2hcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9oZWFkZXI+XG4gICAgICAgICAgICA8aGVhZGVyIGNsYXNzPVwiaGVhZGVyXCIgdi1zaG93PVwiaXNTaG93U2VhcmNoaW5nXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlYXJjaFwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3ctY2xlYXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInNlYXJjaFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cImkxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuc2VhcmNoXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjaGFuZ2U9XCJkb1NlYXJjaCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBibHVyPVwib25TZWFyY2hCbHVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDp2YWx1ZT1cInNlYXJjaEtleVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1pbnB1dD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ0cmFuc3BhcmVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5leGl0X3NlYXJjaFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2suc3RvcD1cInN3aXRjaFNlYXJjaFN0YXR1cygpXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5jYW5jZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvaGVhZGVyPlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHYtc2hvdz1cIiFpc1Nob3dTZWFyY2hpbmcgJiYgYWN0aXZlID09PSBpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICB2LWZvcj1cIml0ZW0gb2YgZmxhdFRhYnNcIlxuICAgICAgICAgICAgICAgIDprZXk9XCJpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImxpc3RcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxwa2ctbGlzdFxuICAgICAgICAgICAgICAgICAgICA6cmVmPVwiaXRlbS5sYWJlbFwiXG4gICAgICAgICAgICAgICAgICAgIDpsYWJlbD1cIml0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICA6YWN0aXZlPVwiIWlzU2hvd1NlYXJjaGluZyAmJiBhY3RpdmUgPT09IGl0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICBAcmVmcmVzaD1cInJlZnJlc2hMaXN0XCJcbiAgICAgICAgICAgICAgICAgICAgOnBhZ2Utc2l6ZT1cInBhZ2VTaXplXCJcbiAgICAgICAgICAgICAgICAgICAgOmNob29zZWQ9XCJjdXJyZW50UGFja2FnZSA/IGN1cnJlbnRQYWNrYWdlLm5hbWUgOiAnJ1wiXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGUtbGlzdD1cInVwZGF0ZUxpc3RcIlxuICAgICAgICAgICAgICAgICAgICBAY2hvb3NlPVwiY2hvb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1wYWNrYWdlPVwidXBkYXRlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEByZW1vdmUtcGFja2FnZT1cInJlbW92ZVBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAdW5pbnN0YWxsLXBhY2thZ2U9XCJ1bmluc3RhbGxQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHNldC1lbmFibGU9XCJzZXRFbmFibGVcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L3BrZy1saXN0PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGlzdFwiIHYtc2hvdz1cImlzU2hvd1NlYXJjaGluZ1wiPlxuICAgICAgICAgICAgICAgIDxwa2ctbGlzdFxuICAgICAgICAgICAgICAgICAgICByZWY9XCJzZWFyY2hfbGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPVwic2VhcmNoX2xpc3RcIlxuICAgICAgICAgICAgICAgICAgICA6aXMtc2VhcmNoPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgICAgIDphY3RpdmU9XCJpc1Nob3dTZWFyY2hpbmdcIlxuICAgICAgICAgICAgICAgICAgICBAcmVmcmVzaD1cInJlZnJlc2hMaXN0XCJcbiAgICAgICAgICAgICAgICAgICAgOnNlYXJjaC1rZXk9XCJzZWFyY2hLZXlcIlxuICAgICAgICAgICAgICAgICAgICA6cGFnZS1zaXplPVwicGFnZVNpemVcIlxuICAgICAgICAgICAgICAgICAgICA6Y2hvb3NlZD1cImN1cnJlbnRQYWNrYWdlID8gY3VycmVudFBhY2thZ2UubmFtZSA6ICcnXCJcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZS1saXN0PVwidXBkYXRlTGlzdFwiXG4gICAgICAgICAgICAgICAgICAgIEBjaG9vc2U9XCJjaG9vc2VcIlxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlLXBhY2thZ2U9XCJ1cGRhdGVQYWNrYWdlXCJcbiAgICAgICAgICAgICAgICAgICAgQHJlbW92ZS1wYWNrYWdlPVwicmVtb3ZlUGFja2FnZVwiXG4gICAgICAgICAgICAgICAgICAgIEB1bmluc3RhbGwtcGFja2FnZT1cInVuaW5zdGFsbFBhY2thZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAc2V0LWVuYWJsZT1cInNldEVuYWJsZVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvcGtnLWxpc3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJkZXRhaWwtbGF5b3V0XCI+XG4gICAgICAgICAgICA8cGtnLWRldGFpbFxuICAgICAgICAgICAgICAgIDpkZXRhaWw9XCJjdXJyZW50UGFja2FnZURldGFpbFwiXG4gICAgICAgICAgICAgICAgOmluZm89XCJjdXJyZW50UGFja2FnZVwiXG4gICAgICAgICAgICAgICAgOmxvYWRpbmc9XCJnZXREZXRhaWxMb2FkaW5nXCJcbiAgICAgICAgICAgICAgICA6ZXJyb3ItbWVzc2FnZT1cImRldGFpbEVycm9yTWVzc2FnZVwiXG4gICAgICAgICAgICAgICAgQHJlZnJlc2g9XCJyZWZyZXNoRGV0YWlsXCJcbiAgICAgICAgICAgID48L3BrZy1kZXRhaWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8IS0tIDwvZGl2PiAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cImltcG9ydC1sb2FkaW5nLWxheW91dFwiIHYtaWY9XCJpbXBvcnRMb2FkaW5nXCI+XG4gICAgICAgICAgICA8dWktbG9hZGluZz48L3VpLWxvYWRpbmc+XG4gICAgICAgICAgICA8dWktbGFiZWwgdi1pZj1cImltcG9ydEVycm9yTWVzc2FnZVwiIHZhbHVlPVwiaTE4bjpleHRlbnNpb24ubWFuYWdlci5pbXBvcnRfZXJyb3JfdGlwXCI+IDwvdWktbGFiZWw+XG4gICAgICAgICAgICA8ZGl2IHYtaWY9XCJpbXBvcnRFcnJvck1lc3NhZ2VcIj5cbiAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGNsYXNzPVwidHJhbnNwYXJlbnRcIiBAY2xpY2s9XCJjYW5jZWxSZXRyeUltcG9ydFwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgdmFsdWU9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLmNhbmNlbFwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBAY2xpY2s9XCJyZXRyeUltcG9ydFwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgdmFsdWU9XCJpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLnJldHJ5XCI+PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPCEtLSA8Y3VzdG9tLWRpYWxvZyB2LWlmPVwiZXh0ZW5zaW9uRGVwZW5kZW5jaWVzXCIgOmluZm89XCJleHRlbnNpb25EZXBlbmRlbmNpZXNcIiBAY2FuY2VsPVwiZGlhbG9nQ2FuY2VsXCJcbiAgICAgICAgQGNvbmZpcm09XCJkaWFsb2dDb25maXJtXCI+PC9jdXN0b20tZGlhbG9nPiAtLT5cbiAgICA8L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCBQYW5lbEFwcCA9IFZ1ZS5leHRlbmQoe1xuICAgIG5hbWU6ICdFeHRlbnNpb25NYW5hZ2VyJyxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICdwa2ctbm9kZSc6IHBrZ05vZGUsXG4gICAgICAgICdwa2ctZGV0YWlsJzogcGtnRGV0YWlsLFxuICAgICAgICAncGtnLWxpc3QnOiBwa2dMaXN0LFxuICAgICAgICAnY3VzdG9tLWRpYWxvZyc6IEN1c3RvbURpYWxvZyxcbiAgICAgICAgVGFiRHJvcGRvd24sXG4gICAgICAgIEN1c3RvbURyb3Bkb3duLFxuICAgICAgICBDdXN0b21Ecm9wZG93bkl0ZW0sXG4gICAgfSxcbiAgICBpbmplY3Q6IHtcbiAgICAgICAgLi4uaW5qZWN0U2RrKCksXG5cbiAgICAgICAgLi4uaW5qZWN0U3RvcmUoKSxcbiAgICB9LFxuICAgIGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKiog6aG1562+5YiX6KGo77yM5pqC5pe26ZqQ6JeP5LqG5bey6LSt5LmwICovXG4gICAgICAgICAgICB0YWJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2NvcyxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuQ29jb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAgICAgIC8vICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5QdXJjaGFzZWQsXG4gICAgICAgICAgICAgICAgLy8gICAgIGlkOiAyLFxuICAgICAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQsXG4gICAgICAgICAgICAgICAgICAgIGlkOiAzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgLyoqIOaJgeW5s+WMluWQjueahOmhteetvu+8jOeUqOS6jua4suafk+WunumZhemhtemdoiAqL1xuICAgICAgICAgICAgZmxhdFRhYnM6IFtdIGFzIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIgfVtdLFxuICAgICAgICAgICAgLyoqIOW9k+WJjeaJgOaYvuekuueahOmhteetviAqL1xuICAgICAgICAgICAgYWN0aXZlOiBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4sXG4gICAgICAgICAgICAvKiog5b2T5YmN6YCJ5Lit55qE5o+S5Lu2ICovXG4gICAgICAgICAgICBjdXJyZW50UGFja2FnZTogbnVsbCBhcyBFeHRlbnNpb25JdGVtIHwgbnVsbCxcbiAgICAgICAgICAgIC8qKiDlvZPliY3pgInkuK3nmoTmj5Lku7bnmoTor6bmg4UgKi9cbiAgICAgICAgICAgIGN1cnJlbnRQYWNrYWdlRGV0YWlsOiBudWxsIGFzIEV4dGVuc2lvbkRldGFpbCB8IG51bGwsXG4gICAgICAgICAgICAvKiog6I635Y+W5o+S5Lu26K+m5oOF55qE5oql6ZSZICovXG4gICAgICAgICAgICBkZXRhaWxFcnJvck1lc3NhZ2U6ICcnLFxuICAgICAgICAgICAgLyoqIOaYr+WQpuWkhOWcqOaQnOe0ouagj+S4rSAqL1xuICAgICAgICAgICAgaXNTaG93U2VhcmNoaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIC8qKiDmkJzntKLpobXpnaLnmoTmiYDlpITliJfooajpobUqL1xuICAgICAgICAgICAgcGFnZTogMSxcbiAgICAgICAgICAgIC8qKiDmr4/mrKHliqDovb3mnaHmlbAgIOebruWJjeeUseS6juWGhee9ruaPkuS7tuWSjOW3suWuieijheaPkuS7tumcgOimgeS6i+WFiOaJq+aPj+WHuuWFqOmDqO+8jOWboOatpOaaguaXtuS4jeWBmuWIhumhteWkhOeQhiovXG4gICAgICAgICAgICBwYWdlU2l6ZTogOTk5OSxcbiAgICAgICAgICAgIC8qKiDmupDliJfooaggKi9cbiAgICAgICAgICAgIHNvdXJjZUxpc3Q6IFtdIGFzIFNvdXJjZVtdLFxuICAgICAgICAgICAgLyoqIOiOt+WPluivpuaDheeahExvYWRpbmcgKi9cbiAgICAgICAgICAgIGdldERldGFpbExvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgLyoqIOaQnOe0ouWFs+mUruWtlyAqL1xuICAgICAgICAgICAgc2VhcmNoS2V5OiAnJyxcbiAgICAgICAgICAgIC8qKiDmkJzntKLnmoToioLmtYEgKi9cbiAgICAgICAgICAgIHNlYXJjaFRocm90dGxlOiBudWxsIGFzIG51bGwgfCAoKC4uLmFyZ3M6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAvKiog5bey5a6J6KOF55qE5YiX6KGoLCDkuJPmjIdpbnN0YWxsZWTpobXnrb7kuIvnmoTliJfooajvvIzkuZ/lsLHmmK/pnZ7lhoXnva7nmoTmj5Lku7YgKi9cbiAgICAgICAgICAgIGluc3RhbGxlZExpc3Q6IFtdIGFzIEV4dGVuc2lvbkl0ZW1bXSxcbiAgICAgICAgICAgIC8qKiBFZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcygp5omr5o+P5Ye65p2l55qE5omA5pyJ5o+S5Lu2ICovXG4gICAgICAgICAgICBhbGxQYWNrYWdlczogW10gYXMgRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mb1tdLFxuICAgICAgICAgICAgLyoqIOaPkuS7tuS+nei1lueahOW8ueeql+mYn+WIlyAqL1xuICAgICAgICAgICAgZXh0ZW5zaW9uRGVwZW5kZW5jaWVzTGlzdDogW10gYXMgRXh0ZW5zaW9uRGVwZW5kZW5jaWVzW10sXG4gICAgICAgICAgICAvKiog5o+S5Lu25L6d6LWW55qE5by556qX5L+h5oGvICovXG4gICAgICAgICAgICBleHRlbnNpb25EZXBlbmRlbmNpZXM6IG51bGwgYXMgRXh0ZW5zaW9uRGVwZW5kZW5jaWVzIHwgbnVsbCxcbiAgICAgICAgICAgIC8qKiDlr7zlhaXmj5Lku7bml7bnmoTmiqXplJnkv6Hmga8gKi9cbiAgICAgICAgICAgIGltcG9ydEVycm9yTWVzc2FnZTogJycsXG4gICAgICAgICAgICAvKiog5a+85YWl5o+S5Lu25pe255qEbG9hZGluZ+eKtuaAgSAqL1xuICAgICAgICAgICAgaW1wb3J0TG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAvKiog5a+85YWl5o+S5Lu255qE6Lev5b6E57yT5a2Y77yM55So5LqO5ZCO57ut55qE6YeN6K+V5a+85YWlICovXG4gICAgICAgICAgICBpbXBvcnRQYXRoQ2FjaGU6ICcnLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgd2F0Y2g6IHtcbiAgICAgICAgLyoqIOW9k+WJjeeahOS+nei1luaPkuS7tueahOW8ueeql+S/oeaBr++8jOeUqOS6juinpuWPkeW8ueeql+mYn+WIlyAqL1xuICAgICAgICBleHRlbnNpb25EZXBlbmRlbmNpZXModmFsdWUpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUgJiYgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXNMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llcyA9IHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzTGlzdC5zaGlmdCgpITtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGNyZWF0ZWQoKSB7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2VuYWJsZScsIHRoaXMudG9nZ2xlRW5hYmxlSGFuZGxlKTtcbiAgICAgICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5vbignZGlzYWJsZScsIHRoaXMudG9nZ2xlRW5hYmxlSGFuZGxlKTtcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYWRkQnJvYWRjYXN0TGlzdGVuZXIoJ2kxOG46Y2hhbmdlJywgdGhpcy5vbkkxOG5DaGFuZ2UpO1xuICAgIH0sXG4gICAgbW91bnRlZCgpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVGbGF0VGFicygpO1xuICAgICAgICB0aGlzLmluaXQoKTtcblxuICAgICAgICAvLyDmlK/mjIHlnKggcGFuZWwg5omT5byA5pe25oyH5a6a5pCc57Si54q25oCBXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBQYXJhbXMgPSB0aGlzLnN0b3JlLnN0YXJ0dXBQYXJhbXMudmFsdWU7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RhcnR1cFBhcmFtcy5zZWFyY2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLm9uU2VhcmNoRXZlbnQoc3RhcnR1cFBhcmFtcy5zZWFyY2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRklYTUU6IOS4jeW6lOWwhiB2dWUg5L2c5Li65LqL5Lu25oC757q/44CC5ZCO57ut6ICD6JmR5byV5YWlIHJ4anMg5p2l5aSE55CGXG4gICAgICAgIHRoaXMuJHJvb3QuJG9uKElOVEVSTkFMX0VWRU5UUy5zZWFyY2gsIHRoaXMub25TZWFyY2hFdmVudCk7XG4gICAgfSxcbiAgICBiZWZvcmVEZXN0cm95KCkge1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdlbmFibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ucmVtb3ZlTGlzdGVuZXIoJ2Rpc2FibGUnLCB0aGlzLnRvZ2dsZUVuYWJsZUhhbmRsZSk7XG4gICAgICAgIHRoaXMuJHJvb3QuJG9mZihJTlRFUk5BTF9FVkVOVFMuc2VhcmNoLCB0aGlzLm9uU2VhcmNoRXZlbnQpO1xuICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZW1vdmVCcm9hZGNhc3RMaXN0ZW5lcignaTE4bjpjaGFuZ2UnLCB0aGlzLm9uSTE4bkNoYW5nZSk7XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDnv7vor5FcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcbiAgICAgICAgICovXG4gICAgICAgIHQoa2V5OiBzdHJpbmcsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICAgICAgICAgICAgRWRpdG9yLkkxOG4uZ2V0TGFuZ3VhZ2U7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLkkxOG4udChgZXh0ZW5zaW9uLm1hbmFnZXIuJHtrZXl9YCwgcGFyYW1zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjdXJMYW5ndWFnZSgpOiAnemgnIHwgJ2VuJyB7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLkkxOG4uZ2V0TGFuZ3VhZ2UoKSBhcyAnemgnIHwgJ2VuJztcbiAgICAgICAgfSxcblxuICAgICAgICBvbkkxOG5DaGFuZ2UoKSB7XG4gICAgICAgICAgICAvLyB0aGlzLnJlZnJlc2hEZXRhaWwoKTtcbiAgICAgICAgICAgIC8vIHJlZnJlc2hMaXN0IOS8muiHquWKqOmAieS4reWIl+ihqOesrOS4gOmhue+8jOS4jeS4gOWumuaYr+eUqOaIt+acn+acm+eahOihjOS4ulxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTGlzdCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliJ3lp4vljJYgKi9cbiAgICAgICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgICAgIC8vIHRoaXMuc291cmNlTGlzdCA9IGF3YWl0IFNESy5nZXRTb3VyY2VMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0aGlzLnRhYnNbMF0ubGFiZWw7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaFRocm90dGxlID0gdGhyb3R0bGUodGhpcy5oYW5kbGVTZWFyY2gsIDMwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5ouN5bmz5bWM5aWX57uT5p6E55qE6aG1562+5pWw57uEICovXG4gICAgICAgIGhhbmRsZUZsYXRUYWJzKCkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW46IE1hcDxzdHJpbmcsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIgfT4gPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBjb25zdCB0YWJzOiB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiIH1bXSA9IFtdO1xuICAgICAgICAgICAgdGhpcy50YWJzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICB0YWJzLnB1c2goeyBsYWJlbDogaXRlbS5sYWJlbCB9KTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNoaWxkcmVuLmZvckVhY2goKHYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LmxhYmVsICE9PSBpdGVtLmxhYmVsKSBjaGlsZHJlbi5zZXQodi5sYWJlbCwgeyBsYWJlbDogdi5sYWJlbCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjaGlsZHJlbi5mb3JFYWNoKCh2KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0YWJzLmZpbmQoKGUpID0+IGUubGFiZWwgPT09IHYubGFiZWwpKSB0YWJzLnB1c2goeyBsYWJlbDogdi5sYWJlbCB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5mbGF0VGFicyA9IHRhYnM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOmAieS4reaPkuS7tiAqL1xuICAgICAgICBhc3luYyBjaG9vc2UocGtnOiBFeHRlbnNpb25JdGVtIHwgdW5kZWZpbmVkIHwgbnVsbCkge1xuICAgICAgICAgICAgLy8g5Lyg5YWl56m65YC85pe26YeN572uIGN1cnJlbnQg5pWw5o2uXG4gICAgICAgICAgICBpZiAocGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIChwa2cgJiYgIXRoaXMuY3VycmVudFBhY2thZ2UpIHx8XG4gICAgICAgICAgICAgICAgIXRoaXMuY3VycmVudFBhY2thZ2VEZXRhaWwgfHxcbiAgICAgICAgICAgICAgICBwa2cubmFtZSAhPT0gdGhpcy5jdXJyZW50UGFja2FnZT8ubmFtZSB8fFxuICAgICAgICAgICAgICAgIHBrZy52ZXJzaW9uICE9PSB0aGlzLmN1cnJlbnRQYWNrYWdlLnZlcnNpb24gfHxcbiAgICAgICAgICAgICAgICBwa2cudmVyc2lvbiAhPT0gdGhpcy5jdXJyZW50UGFja2FnZURldGFpbC52ZXJzaW9uXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBhY2thZ2VEZXRhaWwocGtnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5riF6Zmk5b2T5YmN55qE6YCJ5Lit6K+m5oOFICovXG4gICAgICAgIGNsZWFyQ3VycmVudERldGFpbCgpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhY2thZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5nZXREZXRhaWxMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOiOt+WPluaPkuS7tuivpuaDhSAqL1xuICAgICAgICBnZXRQYWNrYWdlRGV0YWlsKGl0ZW06IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0RGV0YWlsTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlID0geyAuLi5pdGVtIH07XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZGV0YWlsRXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBjb25zdCBwYXJhbSA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIC8vIFRPRE86IOivreiogOWPmOWMluWQjuabtOaWsCBkZXRhaWwg5YaF5a65XG4gICAgICAgICAgICAgICAgbGFuZzogdGhpcy5jdXJMYW5ndWFnZSgpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgIC5nZXRFeHRlbnNpb25EZXRhaWwocGFyYW0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzICYmIHR5cGVvZiByZXMubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWNrYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmVzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHJlcy52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoX2F0OiByZXMucHVibGlzaF9hdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbl9saW1pdDogcmVzLmVkaXRvcl9saW1pdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiByZXMuZGV0YWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiByZXMuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6IHJlcy5pY29uX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuY3VycmVudFBhY2thZ2UudmVyc2lvbiA9IHJlcy52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0ucGF0aCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5xdWVyeUxvY2FsRXh0ZW5zaW9uRGV0YWlsKGl0ZW0ucGF0aCwgdGhpcy5jdXJMYW5ndWFnZSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChkZXRhaWw6IElMb2NhbEV4dGVuc2lvbkRldGFpbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlsICYmIHR5cGVvZiBkZXRhaWwubmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWNrYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZURldGFpbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0aG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogRkFLRV9BVVRIT1JfSUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXRhaWwuYXV0aG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXRhaWwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogZGV0YWlsLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hfYXQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb25fbGltaXQ6IGRldGFpbC5lZGl0b3JfbGltaXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogZGV0YWlsLmRldGFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogcmVzLnNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiByZXMuaWNvbl91cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlLnZlcnNpb24gPSBkZXRhaWwudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9IHRoaXMudCgnZGV0YWlsX2Vycm9yX3RpcCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9IHRoaXMudCgnbmV0d29ya19lcnJvcl90aXAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWNrYWdlRGV0YWlsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGl0ZW0udmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaF9hdDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbl9saW1pdDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiBpdGVtLmljb25fdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFja2FnZS52ZXJzaW9uID0gaXRlbS52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGFpbEVycm9yTWVzc2FnZSA9IHRoaXMudCgnbmV0d29ya19lcnJvcl90aXAnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldERldGFpbExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5ZCv55SoL+WFs+mXreaPkuS7tlxuICAgICAgICAgKiBAcGFyYW0gbmFtZSDmj5Lku7blkI1cbiAgICAgICAgICogQHBhcmFtIGVuYWJsZSDorr7nva7mj5Lku7bnmoTlvIDlkK/nirbmgIHvvIx0cnVlIOW8gOWQr++8jGZhbHNlIOWFs+mXrVxuICAgICAgICAgKiBAcGFyYW0gcGF0aCDmj5Lku7bot6/lvoRcbiAgICAgICAgICogQHJldHVybnNcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIHNldEVuYWJsZShuYW1lOiBzdHJpbmcsIGVuYWJsZTogYm9vbGVhbiwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKHBhdGgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmRpc2FibGUocGF0aCwge30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAnZW5hYmxlJywgcGF0aCwgIWVuYWJsZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgY29uc3QgdGlwID0gZW5hYmxlID8gJ2Rpc2FibGVfZXJyb3JfdGlwJyA6ICdlbmFibGVfZXJyb3JfdGlwJztcbiAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKHRoaXMudCh0aXApKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOeUsUVkaXRvci5QYWNrYWdlLm9u55uR5ZCs5Yiw5YiH5o2i5oiQ5Yqf5ZCO55qE5Zue6LCDICovXG4gICAgICAgIHRvZ2dsZUVuYWJsZUhhbmRsZShpdGVtOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvKSB7XG4gICAgICAgICAgICBbLi4udGhpcy5mbGF0VGFicywgeyBsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2ggfV0uZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiLmxhYmVsXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuXG4gICAgICAgICAgICAgICAgZWwudG9nZ2xlRW5hYmxlSGFuZGxlKGl0ZW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBGSVhNRTog5YWz5LqO6L+Z6YeM5a+55LqOIHRoaXMuaW5zdGFsbGVkTGlzdCDmlbDmja7nmoTmm7TmlrDvvIwg55uu5YmN5a6D5ZKMIEluc3RhbGxlZCBsaXN0IOmhtemdoueahCBsaXN0IOaVsOaNruaYr+WFseS6q+eahO+8jOimgeazqOaEj+OAglxuICAgICAgICAgICAgLy8g5pu05paw5pON5L2c5pqC5pe25Lqk55SxIGxpc3Qg57uE5Lu25p2l5a6M5oiQ5pu05paw77yM6L+Z6YeM5LiN5YaN5YGa5YaX5L2Z5pu05paw5LqG44CCXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWIt+aWsOW9k+WJjeivpuaDhSAqL1xuICAgICAgICByZWZyZXNoRGV0YWlsKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBhY2thZ2VEZXRhaWwodGhpcy5jdXJyZW50UGFja2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25UYWJTZWxlY3QodGFiOiBFeHRlbnNpb25NYW5hZ2VyVGFiKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRhYjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5YiH5o2i5pCc57Si54q25oCBICovXG4gICAgICAgIHN3aXRjaFNlYXJjaFN0YXR1cyhzZWFyY2hpbmc/OiBib29sZWFuKSB7XG4gICAgICAgICAgICB0aGlzLmlzU2hvd1NlYXJjaGluZyA9IHR5cGVvZiBzZWFyY2hpbmcgPT09ICdib29sZWFuJyA/IHNlYXJjaGluZyA6ICF0aGlzLmlzU2hvd1NlYXJjaGluZztcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5ID0gJyc7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1Nob3dTZWFyY2hpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuJHJlZnMuc2VhcmNoIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgICAgIGVsLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWwhnNka+aJq+aPj+WHuueahOacrOWcsOaPkuS7tu+8jOS4jkVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCnlvpfliLDnmoTmj5Lku7bov5vooYzov4fmu6TlkozlpITnkIYgKi9cbiAgICAgICAgZm9ybWF0SW5zdGFsbGVkRXh0ZW5zaW9uKGl0ZW06IElFeHRlbnNpb25Db25maWcpOiBFeHRlbnNpb25JdGVtTG9jYWwge1xuICAgICAgICAgICAgY29uc3QgcGtnID0gdGhpcy5hbGxQYWNrYWdlcy5maW5kKCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUodi5wYXRoKSA9PT0gJ2xvY2FsJyk7XG4gICAgICAgICAgICBjb25zdCBpc0NvY29zU291cmNlID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb246IEV4dGVuc2lvbkl0ZW1Mb2NhbCA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIGljb25fdXJsOiBpdGVtLmljb25fdXJsLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIGVuYWJsZTogcGtnID8gcGtnLmVuYWJsZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgcGF0aDogaXRlbS5leHRlbnNpb25fcGF0aCxcbiAgICAgICAgICAgICAgICBpc0J1aWx0SW46IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAocGtnPy5pbmZvLmF1dGhvcikge1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbi5hdXRob3IgPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBGQUtFX0FVVEhPUl9JRCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcGtnLmluZm8uYXV0aG9yLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBzdGF0U3luYyhpdGVtLmV4dGVuc2lvbl9wYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgJiYgdHlwZW9mIHN0YXRlLm10aW1lTXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvblsnbXRpbWUnXSA9IHN0YXRlLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5aSE55CG572R57uc6K+35rGC5Lit6I635Y+W5Yiw55qE5a6Y5pa55o+S5Lu25L+h5oGv77yM5ZCM5pe25a6Y5pa55o+S5Lu25pyJ5Y+v6IO95Lmf5piv5YaF572u5o+S5Lu2ICovXG4gICAgICAgIGZvcm1hdE5ldEV4dGVuc2lvbihpdGVtOiBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSk6IEV4dGVuc2lvbkl0ZW1PbmxpbmUge1xuICAgICAgICAgICAgY29uc3QgaXNDb2Nvc1NvdXJjZSA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIOWFiOajgOa1iyBsYWJlbCDmmK/lkKbmnIkgYnVpbHRpblxuICAgICAgICAgICAgbGV0IGlzQnVpbHRJbiA9XG4gICAgICAgICAgICAgICAgaXRlbS5sYWJlbCAmJiBpdGVtLmxhYmVsLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICA/IGl0ZW0ubGFiZWwuZmluZEluZGV4KCh2KSA9PiB2ID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW4pID4gLTFcbiAgICAgICAgICAgICAgICAgICAgOiBmYWxzZTtcblxuICAgICAgICAgICAgbGV0IGJ1aWx0aW5Qa2c6IEVkaXRvclBrZ0luZm8gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgY292ZXJQa2c6IEVkaXRvclBrZ0luZm8gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAvLyDlpITkuo4gZW5hYmxlZCDnirbmgIHnmoQgY292ZXIg57G75Z6L5o+S5Lu2XG4gICAgICAgICAgICBsZXQgY292ZXJQa2dFbmFibGVkOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IGxvY2FsUGtnOiBFZGl0b3JQa2dJbmZvIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAvLyDmj5Lku7bnmoQgcGF0aCB0eXBlIOaYryBidWlsdGluIOaIliBjb3ZlciDnmoTkuZ/nrpcgYnVpbHRpbu+8jOi/memHjOaKiuWug+S7rOaJvuWHuuadpeOAglxuICAgICAgICAgICAgLy8g6YGN5Y6G5LiA5qyh77yM5a+75om+6ZyA6KaB55qE5o+S5Lu25pWw5o2u44CC5Y+q5L2/55So56ys5LiA5Liq5om+5Yiw55qE5pWw5o2u77yI5Y+q6L+b6KGM5LiA5qyh6LWL5YC8XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBrZyBvZiB0aGlzLmFsbFBhY2thZ2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBrZy5uYW1lICE9PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aFR5cGUgPSB0aGlzLmNoZWNrUGF0aFR5cGUocGtnLnBhdGgpO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwYXRoVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdidWlsdGluJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ1aWx0aW5Qa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0aW5Qa2cgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY292ZXInOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY292ZXJQa2cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdmVyUGtnID0gcGtnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBrZy5lbmFibGUgJiYgY292ZXJQa2dFbmFibGVkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3ZlclBrZ0VuYWJsZWQgPSBwa2c7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xvY2FsJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsUGtnID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFBrZyA9IHBrZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWFqOmDveaJvuWIsOaVsOaNru+8jOWBnOatouafpeaJvlxuICAgICAgICAgICAgICAgIGlmIChidWlsdGluUGtnICE9IG51bGwgJiYgY292ZXJQa2cgIT0gbnVsbCAmJiBsb2NhbFBrZyAhPSBudWxsICYmIGNvdmVyUGtnRW5hYmxlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXNCdWlsdEluID0gaXNCdWlsdEluIHx8IGJ1aWx0aW5Qa2cgIT0gbnVsbCB8fCBjb3ZlclBrZyAhPSBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCBwa2cgPSBpc0J1aWx0SW4gPyBidWlsdGluUGtnIDogbG9jYWxQa2c7XG5cbiAgICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbkl0ZW06IEV4dGVuc2lvbkl0ZW1PbmxpbmUgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHBrZyA/IHBrZy52ZXJzaW9uIDogaXRlbS5sYXRlc3RfdmVyc2lvbixcbiAgICAgICAgICAgICAgICBpY29uX3VybDogaXRlbS5pY29uX3VybCxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogaXRlbS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBlbmFibGU6IHBrZz8uZW5hYmxlID8/IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkOiBwa2cgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbGF0ZXN0X3ZlcnNpb246IGl0ZW0ubGF0ZXN0X3ZlcnNpb24sXG4gICAgICAgICAgICAgICAgbGF0ZXN0X2Rlc2NyaXB0aW9uOiBpdGVtLmxhdGVzdF9kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICB1cGRhdGVfYXQ6IGl0ZW0udXBkYXRlX2F0LFxuICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDAsXG4gICAgICAgICAgICAgICAgcGF0aDogcGtnID8gcGtnLnBhdGggOiAnJyxcbiAgICAgICAgICAgICAgICBpc0J1aWx0SW4sXG4gICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uSXRlbS5pc0J1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLmJ1aWx0SW5QYXRoID0gZXh0ZW5zaW9uSXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0uYnVpbHRJblZlcnNpb24gPSBleHRlbnNpb25JdGVtLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICBpZiAoY292ZXJQa2dFbmFibGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bey5ZCv55So55qE5YWo5bGA6KaG55uW5a6J6KOF5YaF572u5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbkl0ZW0udmVyc2lvbiA9IGNvdmVyUGtnRW5hYmxlZC52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25JdGVtLnBhdGggPSBjb3ZlclBrZ0VuYWJsZWQucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5lbmFibGUgPSBjb3ZlclBrZ0VuYWJsZWQuZW5hYmxlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY292ZXJQa2cgIT0gbnVsbCAmJiBleHRlbnNpb25JdGVtLmVuYWJsZSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnvJbovpHlmajlhoXnva7niYjmnKzmnKrlkK/nlKjvvIzkuJTlrZjlnKjlhajlsYDopobnm5blronoo4XnmoTlhoXnva7mj5Lku7bvvIjkuI3kuIDlrprlkK/nlKjvvInvvIzopobnm5bmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS52ZXJzaW9uID0gY292ZXJQa2cudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5wYXRoID0gY292ZXJQa2cucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSXRlbS5lbmFibGUgPSBjb3ZlclBrZy5lbmFibGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4dGVuc2lvbkl0ZW07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOiOt+WPlue9kee7nOS4iueahOWGhee9ruaPkuS7tuWIl+ihqOWQju+8jOS4juacrOWcsOWGhee9ruaPkuS7tuWIl+ihqOi/m+ihjOWQiOW5tiAqL1xuICAgICAgICBtZXJnZUJ1aWx0SW5FeHRlbnNpb24obGlzdDogSUV4dGVuc2lvbkxpc3RJdGVtUmVzcG9uc2VbXSk6IEV4dGVuc2lvbkl0ZW1bXSB7XG4gICAgICAgICAgICBjb25zdCBleHRlbnNpb25zOiBFeHRlbnNpb25JdGVtW10gPSBsaXN0Lm1hcCgodikgPT4gdGhpcy5mb3JtYXROZXRFeHRlbnNpb24odikpO1xuXG4gICAgICAgICAgICBjb25zdCBidWlsdEluTGlzdCA9IHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFleHRlbnNpb25zLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lKSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUoaXRlbS5wYXRoKSA9PT0gJ2J1aWx0aW4nO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOazqOaEj+i/memHjOaJvueahOaYr+e9kee7nOWIl+ihqOS4reaJvuS4jeWIsOWMuemFjSBuYW1lIOeahOacrOWcsOimhuebluaPkuS7tlxuICAgICAgICAgICAgY29uc3QgbXVsdGlwbGVWZXJzaW9ucyA9IHRoaXMuYWxsUGFja2FnZXMuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFleHRlbnNpb25zLmZpbmQoKHYpID0+IHYubmFtZSA9PT0gaXRlbS5uYW1lKSAmJiB0aGlzLmNoZWNrUGF0aFR5cGUoaXRlbS5wYXRoKSA9PT0gJ2NvdmVyJztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBidWlsdEluTGlzdC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIGljb25fdXJsOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uaW5mby5kZXNjcmlwdGlvbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlOiBpdGVtLmVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgaXNJbnN0YWxsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBpdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNDb2Nvc1NvdXJjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtdWx0aXBsZVZlcnNpb25zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGV4dGVuc2lvbnMuZmluZEluZGV4KCh2KSA9PiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogaXRlbS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbl91cmw6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uaW5mby5kZXNjcmlwdGlvbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZTogaXRlbS5lbmFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luc3RhbGxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQnVpbHRJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQ29jb3NTb3VyY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uZW5hYmxlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvdmVyIOaPkuS7tumcgOimgeWkhOS6juWQr+eUqOeKtuaAge+8jOaJjeS8muWwhuaVsOaNriBtZXJnZSDov5vmnaVcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uc1tpbmRleF0uYnVpbHRJblBhdGggPSBleHRlbnNpb25zW2luZGV4XS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25zW2luZGV4XS5idWlsdEluVmVyc2lvbiA9IGV4dGVuc2lvbnNbaW5kZXhdLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLnZlcnNpb24gPSBpdGVtLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLnBhdGggPSBpdGVtLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnNbaW5kZXhdLmVuYWJsZSA9IGl0ZW0uZW5hYmxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9ucztcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5pCc57Si5qCP6Kem5Y+R5Zue6LCDICovXG4gICAgICAgIGRvU2VhcmNoKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoS2V5ID0gZXZlbnQ/LnRhcmdldD8udmFsdWUgPz8gJyc7XG4gICAgICAgICAgICBpZiAoc2VhcmNoS2V5ID09PSB0aGlzLnNlYXJjaEtleSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaHJvdHRsZSAmJiB0aGlzLnNlYXJjaFRocm90dGxlKHNlYXJjaEtleSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uU2VhcmNoQmx1cihlOiBGb2N1c0V2ZW50KSB7XG4gICAgICAgICAgICAvLyBGSVhNRTog5Li05pe25aSE55CG5pa55qGI77yM6L6T5YWl5qGG5aSx5Y6754Sm54K55pe277yM5aaC5p6c5rKh5pyJ5pCc57Si5ZCN56ew77yM6Ieq5Yqo57uT5p2f5pCc57Si54q25oCB44CCXG4gICAgICAgICAgICAvLyDlkI7nu63lrozlloTmkJzntKLlip/og73lkI7lsLHkuI3pnIDopoHov5nkuKrlpITnkIbkuobjgILmsqHmnInmkJzntKLlkI3np7Dml7blupTmmL7npLrmiYDmnInmlbDmja5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaEtleSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFNlYXJjaFN0YXR1cyhmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOWPkei1t+aQnOe0oiAqL1xuICAgICAgICBoYW5kbGVTZWFyY2goc2VhcmNoS2V5OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoXSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBlbC5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoS2V5ID0gc2VhcmNoS2V5O1xuICAgICAgICAgICAgaWYgKHNlYXJjaEtleSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFnZSA9IDE7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFeHRlbnNpb25zKEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoLCB0aGlzLnNlYXJjaEtleSwgdGhpcy5wYWdlLCB0aGlzLnBhZ2VTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvblNlYXJjaEV2ZW50KG5hbWU/OiBzdHJpbmcgfCBib29sZWFuKSB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFNlYXJjaFN0YXR1cyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSB0cnVlIHx8IHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoU2VhcmNoU3RhdHVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlU2VhcmNoKG5hbWUgPT09IHRydWUgPyAnJyA6IG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrDmj5Lku7bmlbDnu4QgKi9cbiAgICAgICAgYXN5bmMgdXBkYXRlTGlzdChsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYiwgcGFnZTogbnVtYmVyLCBwYWdlX3NpemU6IG51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgdGFiID0gdGhpcy5pc1Nob3dTZWFyY2hpbmcgPyBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCA6IGxhYmVsO1xuICAgICAgICAgICAgaWYgKHRhYiA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxvY2F0aW9uRXh0ZW5zaW9ucygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUV4dGVuc2lvbnMobGFiZWwsIHRoaXMuc2VhcmNoS2V5LCBwYWdlLCBwYWdlX3NpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliLfmlrDmjInpkq7nmoTop6blj5HvvIwgaW5zdGFsbGVk5Li65omr5o+P5pys5Zyw5o+S5Lu277yM5YW25LuW5YiZ5Li66K+35rGC572R57uc5o+S5Lu2Ki9cbiAgICAgICAgYXN5bmMgcmVmcmVzaExpc3QoKSB7XG4gICAgICAgICAgICBjb25zdCB0YWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogdGhpcy5hY3RpdmU7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyAzLjYueCDniYjmnKznmoQg4oCc5omr5o+P5o+S5Lu24oCdIOaMiemSrueCueWHu+aXtu+8jOS8muWOu+S4u+i/m+eoi+aJi+WKqOabtOaWsOaPkuS7tuazqOWGjOS/oeaBr+OAglxuICAgICAgICAgICAgLy8g6L+Z6YeM5YWo6YOo5pu05paw77yM6ICM5LiN5YaN5qC55o2u5b2T5YmNIHRhYiDljLrliIZcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVR5cGVQcm9qZWN0OiBQYWNrYWdlSW5mb1sndHlwZSddID0gJ3Byb2plY3QnO1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnZXh0ZW5zaW9uJywgJ3NjYW5uaW5nJywgdXBkYXRlVHlwZVByb2plY3QpO1xuXG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICBpZiAodGFiID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTG9jYXRpb25FeHRlbnNpb25zKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVFeHRlbnNpb25zKHRhYiwgdGhpcy5zZWFyY2hLZXksIDEsIHRoaXMucGFnZVNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmm7TmlrDpnZ7mnKzlnLDmj5Lku7bliJfooahcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIHVwZGF0ZUV4dGVuc2lvbnMobGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIsIHF1ZXJ5OiBzdHJpbmcsIHBhZ2U6IG51bWJlciwgcGFnZVNpemU6IG51bWJlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5zdGFsbGVkTGlzdC5sZW5ndGggPT09IDApIHRoaXMuaW5zdGFsbGVkTGlzdCA9IGF3YWl0IHRoaXMuc2NhbkxvY2FsKCk7XG4gICAgICAgICAgICBjb25zdCB0YWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogbGFiZWw7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgZWwubG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICBpZiAocGFnZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zdCBzb3VyY2VJZCA9IDE7Ly8g6L+Z6YeM5bqU6K+l5Y67dGFic+mHjOi/h+a7pFxuICAgICAgICAgICAgY29uc3QgcGFyYW06IElFeHRlbnNpb25MaXN0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGU6IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICBxOiBxdWVyeSxcbiAgICAgICAgICAgICAgICBsYW5nOiB0aGlzLmN1ckxhbmd1YWdlKCksXG4gICAgICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgICAgICBwYWdlU2l6ZSxcbiAgICAgICAgICAgICAgICBsYWJlbDogJycsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgLy8g6L+Z6YeM5o6S6Zmk5o6J5LiN6ZyA6KaB5bimIGxhYmVsIOeahOaDheWGte+8jOWFtuWug+eahOmDveW4puS4iiB0YWIgbGFiZWxcbiAgICAgICAgICAgICAgICBjYXNlIEV4dGVuc2lvbk1hbmFnZXJUYWIuSW5zdGFsbGVkOlxuICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5QdXJjaGFzZWQ6XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5TZWFyY2g6XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtLmxhYmVsID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pCc57Si6ZyA6KaB5omL5Yqo5bim5LiK5qCH562+77yM6YG/5YWN5Zyo5omA5pyJ5qCH562+5Lit5pCc57Si77yI5ZCm5YiZ5pyJ5Lqb6ZqQ6JeP55qE5o+S5Lu25Lmf5Lya5LiA6LW36KKr5pCc57Si5Ye65p2l77yJXG4gICAgICAgICAgICAgICAgICAgICAgICBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zLFxuICAgICAgICAgICAgICAgICAgICAgICAgRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluLFxuICAgICAgICAgICAgICAgICAgICBdLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBwYXJhbS5sYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgLmdldEV4dGVuc2lvbkxpc3QocGFyYW0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlczogSUV4dGVuc2lvbkxpc3RSZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHRlbnNpb25MaXN0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID09PSBFeHRlbnNpb25NYW5hZ2VyVGFiLkJ1aWx0SW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMubWVyZ2VCdWlsdEluRXh0ZW5zaW9uKHJlcy5wYWNrYWdlcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHJlcy5wYWNrYWdlcy5tYXAoKGl0ZW0pID0+IHRoaXMuZm9ybWF0TmV0RXh0ZW5zaW9uKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlTGlzdChleHRlbnNpb25MaXN0LCByZXMuY291bnQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ3VycmVudERldGFpbCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzU2hvd1NlYXJjaGluZyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgPT09IEV4dGVuc2lvbk1hbmFnZXJUYWIuUHVyY2hhc2VkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9PT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5Db2Nvc1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEVycm9yKHRoaXMudCgnbmV0d29ya19lcnJvcl90aXAnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRFcnJvcih0aGlzLnQoJ2xvY2FsX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWwubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmm7TmlrDlt7Llronoo4Xmj5Lku7bliJfooaggKi9cbiAgICAgICAgYXN5bmMgdXBkYXRlTG9jYXRpb25FeHRlbnNpb25zKCkge1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWRdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgZWwucmVzZXQoKTtcbiAgICAgICAgICAgIGVsLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBGSVhNRe+8muWJr+S9nOeUqOOAgua4heepuuaPkuS7tuivpuaDhemhteWGheWuueOAguWQjue7reeci+aYr+WQpumcgOimge+8jOaIluiAheWPpuWkluWvu+aJvuS4gOS4quWkhOeQhuaWueW8j1xuICAgICAgICAgICAgdGhpcy5jbGVhckN1cnJlbnREZXRhaWwoKTtcblxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuc2NhbkxvY2FsKCk7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiDms6jmhI8gaW5zdGFsbGVkIOWIl+ihqOi/memHjO+8jOS4pOS4quaVsOe7hOWvueixoeaYr+WFseS6q+eahO+8jOWvueaVsOe7hOOAgeaVsOe7hOWGheWvueixoeeahOaUueWKqOS8muWvueS4pOi+ueWQjOaXtuS6p+eUn+W9seWTjVxuICAgICAgICAgICAgdGhpcy5pbnN0YWxsZWRMaXN0ID0gbGlzdDtcbiAgICAgICAgICAgIGVsLnVwZGF0ZUxpc3QobGlzdCwgbGlzdC5sZW5ndGgpO1xuXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUxpc3RVcGRhdGUobGlzdCwgRXh0ZW5zaW9uTWFuYWdlclRhYi5JbnN0YWxsZWQpO1xuICAgICAgICAgICAgZWwubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlnKjmn5DkuKrliJfooajnmoTmlbDmja7mm7TmlrDlkI7vvIzlkIzmraXnu5nlhbbku5bliJfooahcbiAgICAgICAgICogQHBhcmFtIGxpc3RcbiAgICAgICAgICogQHBhcmFtIGxhYmVsXG4gICAgICAgICAqL1xuICAgICAgICBoYW5kbGVMaXN0VXBkYXRlKGxpc3Q6IEV4dGVuc2lvbkl0ZW1bXSwgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIpIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKHYpID0+IHYubGFiZWwgIT09IGxhYmVsKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuJHJlZnNbdGFiLmxhYmVsXSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgICAgIGVsLmhhbmRsZUxpc3RVcGRhdGUobGlzdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaJq+aPj+W5tuWkhOeQhuacrOWcsOebruW9leS4i+eahOaPkuS7tu+8iOWQq+mhueebrueahGV4dGVuc2lvbnPnm67lvZXkuIvvvIzlj4rvvIlcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIHNjYW5Mb2NhbCgpIHtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNkay5zY2FuTG9jYWxFeHRlbnNpb25zKCk7XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiBFZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcyDlrZjlnKjosIPnlKjml7bluo/pl67popjvvIzmnInml7bpnIDopoHnrYnlvoXlroPlhoXpg6jmlbDmja7mm7TmlrDjgIJcblxuICAgICAgICAgICAgLy8g5YW35L2T6ZyA6KaB562J5b6F5aSa5LmF77yM5pqC5pe25LiN5riF5qWaXG4gICAgICAgICAgICBhd2FpdCBzbGVlcCgxMDApO1xuICAgICAgICAgICAgdGhpcy5hbGxQYWNrYWdlcyA9IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGxpc3Q6IEV4dGVuc2lvbkl0ZW1bXSA9IFtdO1xuICAgICAgICAgICAgaW5zdGFsbGVkTGlzdC5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbFBhY2thZ2VzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICh2KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYubmFtZSA9PT0gaXRlbS5uYW1lICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHYucGF0aCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrUGF0aFR5cGUodi5wYXRoKSA9PT0gJ2xvY2FsJyxcbiAgICAgICAgICAgICAgICAgICAgKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QucHVzaCh0aGlzLmZvcm1hdEluc3RhbGxlZEV4dGVuc2lvbihpdGVtKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsaXN0LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiBiLm10aW1lID09PSAnbnVtYmVyJyA/IGIubXRpbWUgOiAwKSAtICh0eXBlb2YgYS5tdGltZSA9PT0gJ251bWJlcicgPyBhLm10aW1lIDogMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBsaXN0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmo4Dmn6Xmj5Lku7bnmoTnsbvliKtcbiAgICAgICAgICogQHBhcmFtIHBhdGgg6KaB5qOA5rWL55qE5o+S5Lu25a6J6KOF6Lev5b6EXG4gICAgICAgICAqIEByZXR1cm5zIOaPkuS7tuexu+WIq1xuICAgICAgICAgKi9cbiAgICAgICAgY2hlY2tQYXRoVHlwZShwYXRoOiBzdHJpbmcpOiAnb3RoZXInIHwgJ2xvY2FsJyB8ICdnbG9iYWwnIHwgJ2NvdmVyJyB8ICdidWlsdGluJyB7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5jaGVja1R5cGUocGF0aCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOabtOaWsC/lronoo4Xmj5Lku7YgKi9cbiAgICAgICAgdXBkYXRlUGFja2FnZShuYW1lOiBzdHJpbmcsIHZlcnNpb246IHN0cmluZywgaW5mbzogRXh0ZW5zaW9uSXRlbSkge1xuICAgICAgICAgICAgaWYgKGluZm8uaXNJbnN0YWxsZWQgJiYgc2VtdmVyLmVxKHZlcnNpb24sIGluZm8udmVyc2lvbikpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChpbmZvLmlzQnVpbHRJbiAmJiB0eXBlb2YgaW5mby5idWlsdEluVmVyc2lvbiA9PT0gJ3N0cmluZycgJiYgc2VtdmVyLmVxKHZlcnNpb24sIGluZm8uYnVpbHRJblZlcnNpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldEJ1aWx0SW5WZXJzaW9uKGluZm8pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRvd25sb2FkKG5hbWUsIHZlcnNpb24sIGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOW+gOW3suWuieijheWIl+ihqOS4reaPkuWFpVxuICAgICAgICBhZGRJbnN0YWxsZWRQYWNrYWdlKGl0ZW06IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW0V4dGVuc2lvbk1hbmFnZXJUYWIuSW5zdGFsbGVkXSBhcyBhbnk7XG4gICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgIGVsLmFkZFBhY2thZ2UoaXRlbSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOW9k+mAieaLqeeahOeJiOacrOS4uuWGhee9rueJiOacrOaXtu+8jOWImeinhuS4uumHjee9ruWIsOWGhee9rueJiOacrCAqL1xuICAgICAgICBhc3luYyByZXNldEJ1aWx0SW5WZXJzaW9uKGl0ZW06IEV4dGVuc2lvbkl0ZW0pIHtcbiAgICAgICAgICAgIGlmICghaXRlbSB8fCAhaXRlbS5idWlsdEluUGF0aCB8fCAhaXRlbS5idWlsdEluVmVyc2lvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCB0cnlVbmluc3RhbGwgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5Y246L295YWo5bGA55uu5b2V5LiL55qE5o+S5Lu277yM5L2/5b6X5Y+v5Lul5a+55omA5pyJ6aG555uu55Sf5pWIXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZGsudW5pbnN0YWxsKGl0ZW0ubmFtZSwgdGhpcy5leHRlbnNpb25QYXRocy5nbG9iYWwpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWNuOi9veWksei0pe+8jOS4jeW9seWTjeWQjue7remAu+i+keaJp+ihjFxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoaXRlbS5uYW1lID09PSAnZXh0ZW5zaW9uJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybih0aGlzLnQoJ3VwZGF0ZV9leHRlbnNpb25fdGlwJyksIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW3RoaXMudCgnY29uZmlybScpLCB0aGlzLnQoJ2NhbmNlbCcpXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiAxLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZGlhbG9nUXVlc3Rpb24nKSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnZXh0ZW5zaW9uJywgJ3NlbGYtdXBkYXRlJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbGxQYXRoOiBpdGVtLmJ1aWx0SW5QYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnVpbHRJblBhdGg6IGl0ZW0uYnVpbHRJblBhdGgsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uT3B0aW9uLmlzUmVSZWdpc3RlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUV4dGVuc2lvbk9wdGlvbi5wYXRoID0gaXRlbS5idWlsdEluUGF0aDtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiDlkIzkuIvmlrkgZG93bmxvYWQucGVySW5zdGFsbGVkIOmSqeWtkOS4reeahOWkhOeQhlxuICAgICAgICAgICAgICAgICAgICAgICAgeyB2ZXJzaW9uOiBpdGVtLnZlcnNpb24sIHBhdGg6IGl0ZW0ucGF0aCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgZmFsc2UsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgdHJ5VW5pbnN0YWxsKCk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIHRydWUsIGl0ZW0uYnVpbHRJblBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMoXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgeyB2ZXJzaW9uOiBpdGVtLmJ1aWx0SW5WZXJzaW9uLCBwYXRoOiBpdGVtLmJ1aWx0SW5QYXRoIH0sXG4gICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpdGVtLnBhdGggPSBpdGVtLmJ1aWx0SW5QYXRoO1xuICAgICAgICAgICAgICAgIGl0ZW0udmVyc2lvbiA9IGl0ZW0uYnVpbHRJblZlcnNpb247XG4gICAgICAgICAgICAgICAgdGhpcy5jaG9vc2UoaXRlbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaW5zdGFsbGVkTGlzdCA9IGF3YWl0IHRoaXMuc2NhbkxvY2FsKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqIOS4i+i9veaPkuS7tiAqL1xuICAgICAgICBkb3dubG9hZChuYW1lOiBzdHJpbmcsIHZlcnNpb246IHN0cmluZywgaXRlbTogRXh0ZW5zaW9uSXRlbSkge1xuICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uUGF0aHMgPSB0aGlzLmV4dGVuc2lvblBhdGhzO1xuICAgICAgICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBpdGVtLmlzQnVpbHRJbiA/IGV4dGVuc2lvblBhdGhzLmdsb2JhbCA6IGV4dGVuc2lvblBhdGhzLnByb2plY3Q7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGUgPSB0aGlzLnNkay5nZXREb3dubG9hZGVyKFxuICAgICAgICAgICAgICAgIHsgbmFtZSwgdmVyc2lvbiwgaW5zdGFsbFBhdGggfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRvd25sb2FkUHJvZ3Jlc3M6IChwcm9ncmVzczogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcyA9IE1hdGguZmxvb3IoMTAwICogcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhuYW1lLCBudWxsLCBudWxsLCBwcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHBlckRvd25sb2FkZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5pc0J1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5wYXRoICE9PSBpdGVtLmJ1aWx0SW5QYXRoICYmIGl0ZW0ubmFtZSAhPT0gJ2V4dGVuc2lvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUoaXRlbS5uYW1lLCBmYWxzZSwgaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWPjeazqOWGjOWFqOWxgCBidWlsdGluIOebruW9leS4i+W3suWuieijheeahOaPkuS7tu+8iOacquWQr+eUqO+8jOWboOatpOS4jeS8mui1sOS4iumdoueahOWIpOaWremAu+i+ke+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTog5o+S5Lu25pyA57uI5a6J6KOF55uu5b2V55qE6I635Y+W5LiN5bqU6K+l5Zyo5o+S5Lu26YeM6Z2i5ou85o6l77yM5bqU6K+l55SxIHNkayDnu5nlh7rjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzdCA9IHBhdGgucmVzb2x2ZShpbmZvLmluc3RhbGxQYXRoLCBpbmZvLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhkaXN0KSAmJiB0aGlzLmFsbFBhY2thZ2VzLmZpbmQoKHBrZykgPT4gcGtnLnBhdGggPT09IGRpc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNldEVuYWJsZShpdGVtLm5hbWUsIGZhbHNlLCBkaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoZGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uaXNJbnN0YWxsZWQgJiYgaXRlbS5wYXRoICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKGl0ZW0ubmFtZSwgZmFsc2UsIGl0ZW0ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihpdGVtLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwZXJJbnN0YWxsZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwa2c6IEV4dGVuc2lvbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlu7bov581MDDmr6vnp5LvvIzlm6DkuLrorr7orqHluIzmnJvlnKjkuIvovb3lrozmiJDlkI7og73oh7PlsJHlgZznlZnlnKgxMDAl54q25oCB5LiA5q615pe26Ze0XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5mby50ZW1wUGF0aCAhPT0gJ3N0cmluZycgfHwgaW5mby50ZW1wUGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGluZm8udGVtcFBhdGg6IFwiJHtpbmZvLnRlbXBQYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSAnZXh0ZW5zaW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4odGhpcy50KCd1cGRhdGVfZXh0ZW5zaW9uX3RpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdleHRlbnNpb24nLCAnc2VsZi11cGRhdGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGg6IGl0ZW0ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogaW5mby50ZW1wUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsdEluUGF0aDogaXRlbS5idWlsdEluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlRXh0ZW5zaW9uT3B0aW9uLmlzUmVSZWdpc3RlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCA9IGluZm8udGVtcFBhdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmAieaLqeS4i+asoeWQr+WKqOaXtuabtOaWsOWAme+8jOe7k+adn+S4i+i9veeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEb3dubG9hZFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6L+Z6YeM5L2/55So55qE5piv5b2T5YmN55qE54mI5pys5ZKM6Lev5b6E77yM55u45b2T5LqO5rKh5pyJ5pu05pawXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOmcgOimgeS4gOS4quabtOWQiOeQhueahOeKtuaAgeabtOaWsOacuuWItlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdmVyc2lvbjogaXRlbS52ZXJzaW9uLCBwYXRoOiBpdGVtLnBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXRlbS5pc0J1aWx0SW4gJiYgaXRlbS5pc0NvY29zU291cmNlICYmICFpdGVtLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy5pc0luc3RhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwa2cuZW5hYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5yZWdpc3RlcihpbmZvLnRlbXBQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUobmFtZSwgdHJ1ZSwgaW5mby50ZW1wUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBrZy52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGtnLnBhdGggPSBpbmZvLnRlbXBQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIG51bGwsIHsgdmVyc2lvbiwgcGF0aDogaW5mby50ZW1wUGF0aCEgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlKHBrZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMb2NhdGlvbkV4dGVuc2lvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURvd25sb2FkU3RhdHVzKG5hbWUsIHRoaXMudCgnaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uOiBFeHRlbnNpb25EZXBlbmRlbmNpZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8uZm9yRWFjaCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbi5kZXBlbmRlbmNpZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHYubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogdi52ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wZW5EaWFsb2cob3B0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGUuZG93bmxvYWQoKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ2luc3RhbGxfZXJyb3JfdGlwJykpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRG93bmxvYWRTdGF0dXMobmFtZSwgdGhpcy50KCdpbnN0YWxsX2Vycm9yX3RpcCcpLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5bCG5o+S5Lu255qE5LiL6L2954q25oCB5ZCM5q2l5Yiw5omA5pyJ5YiX6KGoICovXG4gICAgICAgIHVwZGF0ZURvd25sb2FkU3RhdHVzKFxuICAgICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgZXJyb3I6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiB7IHBhdGg6IHN0cmluZzsgdmVyc2lvbjogc3RyaW5nIH0gfCBudWxsLFxuICAgICAgICAgICAgcHJvZ3Jlc3M6IG51bWJlciB8IG51bGwsXG4gICAgICAgICkge1xuICAgICAgICAgICAgWy4uLnRoaXMuZmxhdFRhYnMsIHsgbGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIH1dLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGUgPSB0aGlzLiRyZWZzW3RhYi5sYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZS5sZW5ndGggPyBlWzBdIDogZTtcbiAgICAgICAgICAgICAgICBlbC51cGRhdGVEb3dubG9hZFN0YXR1cyhuYW1lLCBlcnJvciwgc3VjY2VzcywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiDlsIbmj5Lku7bnmoTljbjovb3nirbmgIHlkIzmraXliLDmiYDmnInliJfooaggKi9cbiAgICAgICAgdXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgaXRlbTogRXh0ZW5zaW9uSXRlbSxcbiAgICAgICAgICAgIGVycm9yOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogeyBwYXRoOiBzdHJpbmc7IHZlcnNpb246IHN0cmluZyB9IHwgbnVsbCxcbiAgICAgICAgICAgIHByb2dyZXNzOiBudW1iZXIgfCBudWxsLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IOWPquafpeaJviBidWlsdGluICYgY292ZXLvvIzmmK/lkKblupTor6XljLrliIbmmL7npLrvvJ9cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVpbHRJbiA9IHRoaXMuYWxsUGFja2FnZXMuZmluZCgodikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFR5cGUgPSB0aGlzLmNoZWNrUGF0aFR5cGUodi5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2Lm5hbWUgPT09IGl0ZW0ubmFtZSAmJiAocGF0aFR5cGUgPT09ICdidWlsdGluJyB8fCBwYXRoVHlwZSA9PT0gJ2NvdmVyJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhYi5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLkNvY29zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNCdWlsdEluICYmIGJ1aWx0SW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHBhdGg6IGJ1aWx0SW4/LnBhdGgsIHZlcnNpb246IGJ1aWx0SW4udmVyc2lvbiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2NhbEl0ZW06IEV4dGVuc2lvbkl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6Kem5Y+R5Y246L295pON5L2c55qE5piv5ZCm5piv5b2T5YmN5YiX6KGo5Lit55qE5o+S5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVW5pbnN0YWxsZWQgPSBpdGVtLnBhdGggPT09IGxvY2FsSXRlbS5wYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogaXNVbmluc3RhbGxlZCA/ICcnIDogbG9jYWxJdGVtLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDov5nph4zopoHnlKjliJfooajnu4Tku7bmnKzlnLDnmoTmlbDmja7vvIzogIzkuI3mmK/op6blj5Hljbjovb3mk43kvZzpgqPkuKrliJfooajnmoTmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNVbmluc3RhbGxlZCAmJiBpc09ubGluZUV4dGVuc2lvbihsb2NhbEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbG9jYWxJdGVtLmxhdGVzdF92ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxJdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb2NhbEl0ZW06IEV4dGVuc2lvbkl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1VuaW5zdGFsbGVkID0gaXRlbS5wYXRoID09PSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFBhdGggPSBsb2NhbEl0ZW0ucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFZlcnNpb24gPSBsb2NhbEl0ZW0udmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNVbmluc3RhbGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDljbjovb3nmoTmmK/lhoXnva7liJfooajph4zlvZPliY3nmoTmmL7npLrpoblcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFBhdGggPSBidWlsdEluPy5wYXRoID8/ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VmVyc2lvbiA9IGJ1aWx0SW4/LnZlcnNpb24gPz8gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG5leHRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBuZXh0VmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzQ29jb3NTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobG9jYWxJdGVtOiBFeHRlbnNpb25JdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IOWboOS4uuebruWJjeaQnOe0ouS7heWkhOeQhuacjeWKoeerr+i/lOWbnueahOaVsOaNru+8jOWboOatpOWNuOi9veWQjueahOeKtuaAgeabtOaWsOS5n+WPqumcgOimgeeugOWNleWIpOaWrVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2gg5YiX6KGo55qE5pWw5o2u5Zyo56a75byA5ZCO5Lya5riF56m677yM5Zug5q2k5pqC5pe25LiN5Lya5pyJ5Zyo5Yir55qEIHRhYiDkuIvmm7TmlrAgc2VhcmNoIOaVsOaNrueahOmXrumimO+8jFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y2z5q2k5aSEIGxvY2FsSXRlbSA9PT0gaXRlbeOAguS4uuS6huS4juS4iumdouS4gOiHtO+8jOS+neaXp+S9v+eUqCBsb2NhbEl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGlzT25saW5lRXh0ZW5zaW9uKGxvY2FsSXRlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxvY2FsSXRlbS5sYXRlc3RfdmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbG9jYWxJdGVtLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZShpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBFeHRlbnNpb25NYW5hZ2VyVGFiLkluc3RhbGxlZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZShpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsU3RhdHVzKGl0ZW0ubmFtZSwgZXJyb3IsIHN1Y2Nlc3MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwudXBkYXRlRG93bmxvYWRTdGF0dXMoaXRlbS5uYW1lLCBlcnJvciwgc3VjY2VzcywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDliIfmjaLmj5Lku7bnmoTljbjovb1sb2FkaW5nICovXG4gICAgICAgIHVwZGF0ZVVuaW5zdGFsbExvYWRpbmcobmFtZTogc3RyaW5nLCBpc0xvYWRpbmc6IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIFsuLi50aGlzLmZsYXRUYWJzLCB7IGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiLlNlYXJjaCB9XS5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWIubGFiZWxdIGFzIGFueTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAgICAgZWwudXBkYXRlVW5pbnN0YWxsTG9hZGluZyhuYW1lLCBpc0xvYWRpbmcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiDljbjovb3mj5Lku7YgKi9cbiAgICAgICAgYXN5bmMgdW5pbnN0YWxsUGFja2FnZShuYW1lOiBzdHJpbmcsIGl0ZW06IEV4dGVuc2lvbkl0ZW0sIGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1tsYWJlbF0gYXMgYW55O1xuICAgICAgICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBlbCA9IGUubGVuZ3RoID8gZVswXSA6IGU7XG4gICAgICAgICAgICAvLyDliKDpmaTliY3or6Lpl65cbiAgICAgICAgICAgIGlmIChpdGVtLmVuYWJsZSAmJiBsYWJlbCAhPT0gRXh0ZW5zaW9uTWFuYWdlclRhYi5CdWlsdEluKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKHRoaXMudCgnY2xvc2VfZXh0ZW5zaW9uc190aXAnKSwge1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbdGhpcy50KCdjb25maXJtJyksIHRoaXMudCgnY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDEsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgbnVsbCwgeyBwYXRoOiBpdGVtLnBhdGgsIHZlcnNpb246IGl0ZW0udmVyc2lvbiB9LCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsICFpdGVtLmVuYWJsZSwgaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiDljbjovb3mj5Lku7bml7blhYjmuIXnqbror6bmg4XpobXlhoXlrrnjgILkuLvopoHmmK/kuLrkuoblkozlronoo4Xmj5Lku7bml7bnmoTooYzkuLrliY3lkI7lkbzlupTjgILlkI7nu63nnIvnnIvmmK/lkKbpnIDopoHkv53nlZlcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDdXJyZW50RGV0YWlsKCk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVW5pbnN0YWxsTG9hZGluZyhuYW1lLCB0cnVlKTtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoaXRlbS5wYXRoKTtcblxuICAgICAgICAgICAgLy8g5Yib5bu6IHNkayDml7bnmoTlj4LmlbDkuK3lj6rkvKDlhaXkuobpobnnm67ot6/lvoTvvIzlm6DmraTov5nph4zlj6rkvJrljbjovb3pobnnm67ot6/lvoTkuIvnmoTmj5Lku7ZcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNka1xuICAgICAgICAgICAgICAgIC51bmluc3RhbGwobmFtZSwge1xuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxQcm9ncmVzczogKHByb2dyZXNzOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzID0gTWF0aC5mbG9vcigxMDAgKiBwcm9ncmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC51cGRhdGVVbmluc3RhbGxTdGF0dXMobmFtZSwgbnVsbCwgbnVsbCwgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB1bmluc3RhbGxlZDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdleHRlbnNpb24nICYmIHR5cGVvZiBpdGVtLmJ1aWx0SW5QYXRoID09PSAnc3RyaW5nJyAmJiBpdGVtLmJ1aWx0SW5QYXRoICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0RW5hYmxlKG5hbWUsIHRydWUsIGl0ZW0uYnVpbHRJblBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVVbmluc3RhbGxTdGF0dXMoaXRlbSwgbnVsbCwgeyBwYXRoOiAnJywgdmVyc2lvbjogJycgfSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxlZExpc3QgPSBhd2FpdCB0aGlzLnNjYW5Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcih0aGlzLnQoJ3VuaW5zdGFsbF9lcnJvcl90aXAnKSk7XG4gICAgICAgICAgICAgICAgICAgIGVsLnVwZGF0ZVVuaW5zdGFsbFN0YXR1cyhuYW1lLCB0aGlzLnQoJ3VuaW5zdGFsbF9lcnJvcl90aXAnKSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog56e76Zmk5pyq5a6J6KOF55qE5o+S5Lu2ICovXG4gICAgICAgIHJlbW92ZVBhY2thZ2UobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCB0YWIgPSB0aGlzLmlzU2hvd1NlYXJjaGluZyA/IEV4dGVuc2lvbk1hbmFnZXJUYWIuU2VhcmNoIDogdGhpcy5hY3RpdmU7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy4kcmVmc1t0YWJdIGFzIGFueTtcbiAgICAgICAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlLmxlbmd0aCA/IGVbMF0gOiBlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2RrXG4gICAgICAgICAgICAgICAgLnVuaW5zdGFsbChuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIHVuaW5zdGFsbGVkOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmUobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKHRoaXMudCgncmVtb3ZlX2Vycm9yX3RpcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDmiZPlvIDlvLnnqpfvvIzlt7LlgZrpmJ/liJflpITnkIbjgIIg5L2G5piv55uu5YmN5by556qX5Yqf6IO95YWI6ZqQ6JePICovXG4gICAgICAgIG9wZW5EaWFsb2coaW5mbzogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAvLyBpZiAodGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llc0xpc3QucHVzaChpbmZvKVxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmV4dGVuc2lvbkRlcGVuZGVuY2llcyA9IGluZm9cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGlmIChpbmZvLmRlcGVuZGVuY2llcy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGluZm8uZGVwZW5kZW5jaWVzLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgaW5kZXggPiAwID8gKG1lc3NhZ2UgKz0gYOOAgSR7aXRlbS5uYW1lfUAke2l0ZW0udmVyc2lvbn1gKSA6IChtZXNzYWdlICs9IGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgICAgICAgICAgdGl0bGU6IGAke2luZm8ubmFtZX0gJHt0aGlzLnQoJ2luc3RhbGxfZGVwZW5kZW5jZV90aXAnKX1gLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3dhcm4nLFxuICAgICAgICAgICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgICAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5by556qX55qE5Y+W5raI5oyJ6ZKuICovXG4gICAgICAgIGRpYWxvZ0NhbmNlbCgpIHtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uRGVwZW5kZW5jaWVzID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5by556qX55qE56Gu6K6k5oyJ6ZKuICovXG4gICAgICAgIGRpYWxvZ0NvbmZpcm0oaW5mbzogRXh0ZW5zaW9uRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5jYWxsYmFjaykgaW5mby5jYWxsYmFjaygpO1xuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25EZXBlbmRlbmNpZXMgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKiDph43or5Xlr7zlhaUgKi9cbiAgICAgICAgcmV0cnlJbXBvcnQoKSB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydEVycm9yTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5pbnN0YWxsKHRoaXMuaW1wb3J0UGF0aENhY2hlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiog5Y+W5raI6YeN6K+V5a+85YWl77yM55u05o6l57uT5p2fICovXG4gICAgICAgIGNhbmNlbFJldHJ5SW1wb3J0KCkge1xuICAgICAgICAgICAgdGhpcy5pbXBvcnRFcnJvck1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0UGF0aENhY2hlID0gJyc7XG4gICAgICAgICAgICB0aGlzLmltcG9ydExvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblBvcHVwSW1wb3J0TW9yZSgpIHtcbiAgICAgICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgICAgICAgICBtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLnQoJ2ltcG9ydF9leHRlbnNpb25zX2ZvbGRlcicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxQa2dGb2xkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLnQoJ2ltcG9ydF9leHRlbnNpb25zX2RldicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbGxQa2dEZXYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlr7zlhaXkuIDkuKrmj5Lku7bljovnvKnljIVcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGluc3RhbGwoZmlsZVBhdGggPSAnJykge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9ICdwcm9qZWN0JztcbiAgICAgICAgICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLnNlbGVjdCh7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5zZWxlY3RaaXAnKSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyczogW3sgbmFtZTogJ1pJUCcsIGV4dGVuc2lvbnM6IFsnemlwJ10gfV0sXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCB8fCAhcmVzdWx0LmZpbGVQYXRoc1swXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSBiYXNlbmFtZShmaWxlUGF0aCwgJy56aXAnKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmluc3RhbGxQa2dUZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEhhbmRsZXI6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbXBvcnRQYWNrYWdlKHR5cGUsIGZpbGVQYXRoLCB7IGV4dGVuc2lvbkRpc3BsYXlOYW1lOiBwYWNrYWdlTmFtZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuZGVjb21wcmVzc0ZhaWw6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRGVjb21wcmVzc0ZhaWwoZmlsZVBhdGgsIHBhY2thZ2VOYW1lLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWkhOeQhuWuieijhemAu+i+keeahOaooeadv+aWueazleOAglxuICAgICAgICAgKiDlkI7nu63pnIDmsYLlj5jmm7Tml7blj6/ku6Xlop7liqDmm7TlpJrlj4LmlbDvvIzmiJbogIXlsIbmlbTkuKrmqKHmnb/mlrnms5Xmi4bmlaPmiJDlpJrkuKrlsI/lh73mlbDvvIzorqnlkITkuKrosIPnlKjlhaXlj6Poh6rlt7Hljrvnu4TlkIjosIPnlKhcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGluc3RhbGxQa2dUZW1wbGF0ZShvcHRpb25zOiB7XG4gICAgICAgICAgICAvLyDnlKjmiLfpgInkuK3nmoTot6/lvoTvvIjmlofku7bmiJbmlofku7blpLnvvIlcbiAgICAgICAgICAgIHNlbGVjdGVkUGF0aDogc3RyaW5nO1xuICAgICAgICAgICAgLy8gaW1wb3J0IOaTjeS9nOeahOWkhOeQhuWHveaVsOOAgui/lOWbniBpbXBvcnQg5a6M5oiQ5ZCO55qEIGRpc3Qg6Lev5b6EXG4gICAgICAgICAgICBpbXBvcnRIYW5kbGVyOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG4gICAgICAgIH0pIHtcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0TG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAvLyDmr4/mrKHlr7zlhaXlvIDlp4vml7bph43nva7kuIrkuIDmrKHlr7zlhaXnmoTplJnor6/kv6Hmga9cbiAgICAgICAgICAgIHRoaXMuaW1wb3J0RXJyb3JNZXNzYWdlID0gJyc7XG5cbiAgICAgICAgICAgIGNvbnN0IHsgc2VsZWN0ZWRQYXRoIH0gPSBvcHRpb25zO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCBvcHRpb25zLmltcG9ydEhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGltcG9ydGVkIHBhY2thZ2UgcGF0aDogXCIke3BhdGh9XCJgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRQYXRoQ2FjaGUgPSAnJztcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IEV4dGVuc2lvbk1hbmFnZXJUYWIuSW5zdGFsbGVkO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFsbGVkTGlzdCA9IGF3YWl0IHRoaXMuc2NhbkxvY2FsKCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pbnN0YWxsZWRMaXN0LmZpbmQoKHYpID0+IHYucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5leHB0ZWQgcGFja2FnZSBpbXBvcnQ6IGNhbm5vdCBmaW5kIGluIGluc3RhbGxlZCBsaXN0Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXRFbmFibGUoaXRlbS5uYW1lLCB0cnVlLCBwYXRoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaExpc3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNob29zZShpdGVtKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRFcnJvck1lc3NhZ2UgPSB0aGlzLnQoJ2ltcG9ydF9lcnJvcl90aXAnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmltcG9ydFBhdGhDYWNoZSA9IHNlbGVjdGVkUGF0aDtcblxuICAgICAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZS5jYW5jZWw6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW5jZWxSZXRyeUltcG9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNhbmNlbEltcG9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmludmFsaWRQYXRoOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUludmFsaWRQYXRoKHNlbGVjdGVkUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZS5jYW5ub3RGaW5kUGFja2FnZUpzb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gKGVycm9yIGFzIGFueSkucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuaW1wb3J0RXJyb3InKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuY2Fubm90RmluZFBhY2thZ2VKc29uJywgeyBwYXRoOiBmb2xkZXJQYXRoIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6ICdleHRlbnNpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAxMDAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5oqb5Ye66K6p5aSW5bGC5aSE55CGXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuZGVjb21wcmVzc0ZhaWw6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlVW5leHBlY3RlZEltcG9ydEVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgaW5zdGFsbFBrZ0ZvbGRlcihmb2xkZXJQYXRoID0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSAncHJvamVjdCc7XG5cbiAgICAgICAgICAgIGlmICghZm9sZGVyUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cuc2VsZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnNlbGVjdERpcmVjdG9yeScpLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZGlyZWN0b3J5JyxcbiAgICAgICAgICAgICAgICAgICAgbXVsdGk6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdC5maWxlUGF0aHMpIHx8IHJlc3VsdC5maWxlUGF0aHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9sZGVyUGF0aCA9IHJlc3VsdC5maWxlUGF0aHNbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5zdGFsbFBrZ1RlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFBhdGg6IGZvbGRlclBhdGgsXG4gICAgICAgICAgICAgICAgaW1wb3J0SGFuZGxlcjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXN0ID0gYXdhaXQgaW1wb3J0UGFja2FnZUZvbGRlcih0eXBlLCBmb2xkZXJQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpc3Q7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGluc3RhbGxQa2dEZXYoZm9sZGVyUGF0aCA9ICcnKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gJ3Byb2plY3QnO1xuICAgICAgICAgICAgaWYgKCFmb2xkZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5zZWxlY3Qoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuc2VsZWN0RGlyZWN0b3J5JyksXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkaXJlY3RvcnknLFxuICAgICAgICAgICAgICAgICAgICBtdWx0aTogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVzdWx0LmZpbGVQYXRocykgfHwgcmVzdWx0LmZpbGVQYXRocy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb2xkZXJQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnN0YWxsUGtnVGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgIGltcG9ydEhhbmRsZXI6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGltcG9ydFBhY2thZ2VTeW1saW5rKHR5cGUsIGZvbGRlclBhdGgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRQYXRoOiBmb2xkZXJQYXRoLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG59KTtcbiJdfQ==