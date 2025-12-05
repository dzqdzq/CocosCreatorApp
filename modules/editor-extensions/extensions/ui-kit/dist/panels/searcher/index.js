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
exports.close = exports.beforeClose = exports.ready = exports.methods = exports.$ = exports.style = exports.template = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const section = __importStar(require("./comps/section"));
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../../../static', '/template/panels/searcher.html'), 'utf8');
exports.style = fs_1.readFileSync(path_1.join(__dirname, '../../../dist/searcher.css'), 'utf8');
const minimatch = require('minimatch');
let vm = null;
let panel = null;
function dispatchEvent(node, name, detail) {
    const event = new CustomEvent(name, {
        detail,
    });
    node.parentNode?.dispatchEvent(event);
}
const allowCreateAssetTypes = [
    'cc.Script',
    'cc.RenderPipeline',
    'cc.AnimationClip',
    'cc.EffectAsset',
    'cc.Material',
    'cc.PhysicsMaterial',
    'cc.RenderTexture',
    'cc.SceneAsset',
    'cc.SpriteAtlas',
    'cc.TerrainAsset',
    'cc.TextureCube',
];
let DataDumpCache = [];
const maxLinesNumber = 50; // 最大显示的行数，滚动到末尾时增加
exports.$ = { content: '.searcher' };
const recordPreview = {
    method: '',
    id: '',
    info: {},
};
exports.methods = {
    /**
     * 丢失关闭面板触发的函数
     */
    async clear() {
        // 在隐藏面板前如果不是取消预览则执行一次取消预览事件。
        if (recordPreview.method === 'confirm') {
            recordPreview.method = '';
            const panel = this;
            dispatchEvent(panel.$.content, 'preview', {
                method: 'cancel',
                value: recordPreview.id,
                info: recordPreview.info,
            });
        }
        vm.loading = true;
        return new Promise(resolve => {
            // setTimeout 0 等待取消预览事件执行完毕
            setTimeout(() => {
                resolve(void 0);
            }, 0);
        });
    },
    async reset(option) {
        await vm.updateData(option.type, option.droppable, option);
        vm.selected = option.value;
        vm.loading = false;
        vm.isKitClosed = false;
        requestAnimationFrame(() => {
            if (!vm.$refs['searchInput'].focused) {
                vm.$refs['searchInput'].focus();
            }
        });
    },
    up() {
        vm.upDownSelect(-1);
    },
    down() {
        vm.upDownSelect(1);
    },
    enter() {
        vm.enterSelect();
    },
    esc() {
        vm.$refs['searchInput'].focus();
    },
};
async function ready() {
    // @ts-ignore
    panel = this;
    // 初始化 vue
    vm = new Vue({
        el: panel.$.content,
        components: {
            'comps-section': section,
        },
        data: {
            loading: true,
            search: '',
            selected: null,
            type: '',
            ccType: '',
            assetFilter: null,
            dataDump: null,
            dataDumpShowNumber: maxLinesNumber,
            isKitClosed: false,
        },
        computed: {
            expand() {
                const vm = this;
                if (vm.search) {
                    return true;
                }
                return false;
            },
        },
        watch: {
            selected() {
                const vm = this;
                const current = vm.$refs['main'].querySelector('.line[selected]');
                if (current) {
                    current.removeAttribute('selected');
                }
                if (!vm.selected) {
                    return;
                }
                const target = vm.$refs['main'].querySelector('.line[value="' + vm.selected + '"]');
                if (target) {
                    target.setAttribute('selected', true);
                    target.scrollIntoViewIfNeeded();
                    // 定位到选择数据时，自动展开
                    if (target.parentNode && !target.parentNode.expand) {
                        target.parentNode.expand = true;
                    }
                }
            },
        },
        mounted() {
            this.$refs.container.addEventListener('scroll', () => {
                const { scrollHeight, clientHeight, scrollTop } = this.$refs.container;
                if (scrollHeight - clientHeight - scrollTop < 100) {
                    if (this.dataDump && this.dataDumpShowNumber < this.dataDump.length) {
                        this.dataDumpShowNumber += maxLinesNumber;
                    }
                }
            });
        },
        methods: {
            t(key) {
                return Editor.I18n.t(`ui-kit.searcher.${key}`);
            },
            /**
             * 根据类型更新数据
             * @param type node | component | asset | add-component
             * @param ccType
             * @param option
             */
            async updateData(type, ccType, option) {
                const vm = this;
                vm.$refs['searchInput'].value = '';
                if (vm.type !== type) {
                    vm.dataDump = null;
                    vm.dataDumpShowNumber = maxLinesNumber;
                }
                // searcher type 分为多种类型
                vm.type = type;
                vm.ccType = ccType;
                switch (vm.type) {
                    case 'add-component':
                        await vm.addComponentsInit();
                        break;
                    case 'node':
                        await vm.searchNodeInit(option.filterOptions);
                        break;
                    case 'component':
                        vm.ccType = await getExtendsClass(ccType);
                        await vm.searchComponentsInit();
                        break;
                    case 'asset':
                        vm.ccType = await getExtendsClass(ccType);
                        // asset-db 支持多种入参的过滤方式
                        vm.assetFilter = option.assetFilter;
                        await vm.searchAssetsInit();
                        break;
                    case 'script':
                        await vm.searchScriptInit();
                        break;
                }
            },
            /**
             * 添加组件的数据初始化
             */
            async addComponentsInit() {
                const vm = this;
                DataDumpCache = await Editor.Message.request('scene', 'query-components');
                // 名称排序优先，其次是内部层级，有子集的排在后面
                DataDumpCache.sort((a, b) => {
                    const aMatch = a.path.match(/\//g);
                    const bMatch = b.path.match(/\//g);
                    const aLevels = aMatch ? aMatch.length : 0;
                    const bLevels = bMatch ? bMatch.length : 0;
                    if (aLevels === bLevels) {
                        return a.path.localeCompare(b.path);
                    }
                    return aLevels - bLevels;
                });
                vm.dataDump = sortCompDump(DataDumpCache);
            },
            /**
             * 搜索组件的数据初始化
             */
            async searchComponentsInit() {
                const vm = this;
                const dumps = await Editor.Message.request('scene', 'query-node-tree');
                DataDumpCache = sortNodeCompDump(dumps, vm.ccType.split(','));
                DataDumpCache.sort((a, b) => a.name.localeCompare(b.name));
                vm.dataDump = DataDumpCache;
                vm.selected = null;
            },
            /**
             * 资源搜索数据初始化
             */
            async searchAssetsInit() {
                const vm = this;
                const queryOptions = {};
                if (vm.assetFilter) {
                    Object.assign(queryOptions, vm.assetFilter);
                }
                // TODO 可以考虑和 assetFilter 合并
                if (vm.ccType) {
                    const ccTypes = vm.ccType.split(',').map((type) => type.trim());
                    queryOptions.ccType = ccTypes;
                }
                const assets = await Editor.Message.request('asset-db', 'query-assets', queryOptions);
                DataDumpCache = [];
                for (const asset of assets) {
                    const iconInfo = await getAssetIconInfo(asset);
                    const name = asset.displayName || asset.name;
                    const data = {
                        type: asset.type,
                        name,
                        uuid: asset.uuid,
                        path: asset.url,
                        sort: name + asset.url,
                        iconInfo,
                    };
                    DataDumpCache.push(data);
                }
                DataDumpCache.sort((a, b) => a.sort.localeCompare(b.sort));
                vm.dataDump = DataDumpCache;
                vm.dataDumpShowNumber = maxLinesNumber;
            },
            /**
             * 节点搜索数据初始化
             */
            async searchNodeInit(nodeFilter) {
                const vm = this;
                const dumps = await Editor.Message.request('scene', 'query-node-tree');
                DataDumpCache = sortNodeDump(dumps, nodeFilter);
                vm.dataDump = DataDumpCache;
                vm.dataDumpShowNumber = maxLinesNumber;
            },
            /**
             * 搜索不同的脚本组件，基类与 Component 不同
             */
            async searchScriptInit() {
                const vm = this;
                const options = {
                    excludeSelf: true,
                    extends: vm.ccType,
                };
                if (vm.ccType) {
                    if (typeof vm.ccType === 'string') {
                        options.extends = [vm.ccType];
                    }
                }
                DataDumpCache = await Editor.Message.request('scene', 'query-classes', options);
                // 名称排序优先，其次是内部层级，有子集的排在后面
                DataDumpCache.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                vm.dataDump = sortScriptDump(DataDumpCache);
            },
            /**
             * 搜索
             * @param event
             */
            onSearch(event) {
                const vm = this;
                const searchStr = event.target.value.trim();
                if (vm.search === searchStr) {
                    return;
                }
                else {
                    vm.search = searchStr;
                }
                let result = DataDumpCache;
                try {
                    if (vm.search) {
                        const reg = new RegExp(vm.search, 'i');
                        result = DataDumpCache.filter((asset) => {
                            let isMatch = false;
                            if (asset.name) {
                                isMatch = asset.name.search(reg) !== -1;
                            }
                            if (!isMatch && asset.path) {
                                isMatch = asset.path.search(reg) !== -1;
                            }
                            return isMatch;
                        });
                    }
                }
                catch (error) { }
                if (vm.type === 'add-component') {
                    vm.dataDump = sortCompDump(result);
                }
                else {
                    if (vm.type === 'script') {
                        vm.dataDump = sortScriptDump(result);
                    }
                    else {
                        vm.dataDump = result;
                    }
                    vm.dataDumpShowNumber = maxLinesNumber;
                    vm.$refs.container.scrollTop = 0;
                }
                // @ts-ignore 默认选中第一个
                window.requestIdleCallback(() => {
                    if (result && result.length && vm.search) {
                        // 需要等待 dataDump 在界面上更新后才能查找到 selectedDom
                        vm.selected = result[0].name;
                    }
                    else {
                        vm.selected = null;
                    }
                });
            },
            /**
             * 搜索时键盘事件
             * 下箭头 切换 选中第一个搜索结果
             * @param evnet
             */
            searchKeydown(event) {
                // @ts-ignore
                event.target.blur();
                const values = this.getValues();
                if (values.length) {
                    vm.selected = values[0];
                }
            },
            getValues() {
                const vm = this;
                const result = [];
                const lines = vm.$refs['main'].querySelectorAll('.line');
                lines.forEach((line) => {
                    const value = line.getAttribute('value');
                    value && result.push(value);
                });
                return result;
            },
            upDownSelect(i) {
                const vm = this;
                const values = vm.getValues();
                let index = values.indexOf(vm.selected) + i;
                if (index === values.length) {
                    index = 0;
                }
                if (index <= -1) {
                    index = values.length - 1;
                }
                vm.selected = values[index];
            },
            enterSelect() {
                const vm = this;
                const current = vm.$refs['main'].querySelector('.line[value="' + vm.selected + '"]');
                if (current) {
                    current.click();
                }
            },
            /**
             * 确认应用某选项（关闭 kit 面板）
             * @param id
             * @param info
             */
            onSelect(id, info) {
                if (typeof id !== 'string') {
                    return;
                }
                vm.selected = id;
                vm.search = '';
                // 有用户选中行为的取消回退预览的动作
                recordPreview.method = '';
                // @ts-ignore
                const elem = this.$el;
                dispatchEvent(elem, 'change', {
                    value: id,
                    info,
                });
                dispatchEvent(elem, 'confirm', {
                    value: id,
                    info,
                });
                vm.closeKit();
            },
            /**
             * 闪烁某资源或节点
             * @param data
             */
            twinkle(data) {
                const vm = this;
                if (vm.type === 'asset') {
                    Editor.Message.send('assets', 'twinkle', data.uuid);
                }
                else if (vm.type === 'node') {
                    Editor.Message.send('hierarchy', 'twinkle', data.uuid);
                }
                else if (vm.type === 'component') {
                    Editor.Message.send('hierarchy', 'twinkle', data.nodeUuid);
                }
            },
            checkAllowCreate(type) {
                return allowCreateAssetTypes.includes(type);
            },
            async createAsset() {
                const vm = this;
                // @ts-ignore
                Editor.Panel.__protected__.holdKit();
                const uuid = await Editor.Message.request('asset-db', 'create-asset-dialog', vm.ccType);
                if (uuid) {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
                    if (info) {
                        vm.onSelect(uuid, info);
                        return;
                    }
                }
                vm.closeKit();
            },
            closeKit() {
                const vm = this;
                vm.isKitClosed = true;
                // @ts-ignore
                Editor.Panel.__protected__.closeKit();
            },
            preview(method, id, info) {
                const vm = this;
                if (vm.isKitClosed) {
                    // kit 关闭后不再触发 preview 行为
                    return;
                }
                recordPreview.method = method;
                recordPreview.id = id;
                recordPreview.info = info;
                // @ts-ignore
                const elem = this.$el;
                dispatchEvent(elem, 'preview', {
                    method,
                    value: id,
                    info,
                });
            },
        },
    });
}
exports.ready = ready;
async function beforeClose() { }
exports.beforeClose = beforeClose;
async function close() { }
exports.close = close;
const imageImporter = ['image', 'texture', 'sprite-frame', 'gltf-mesh'];
async function getAssetIconInfo(asset) {
    const iconInfo = {
        type: 'icon',
        value: 'file',
    };
    if (!asset) {
        return iconInfo;
    }
    if (imageImporter.includes(asset.importer)) {
        if (!asset.source && asset.fatherInfo) {
            const extName = path_1.extname(asset.fatherInfo.source).toLowerCase();
            let src = getLibraryImageSrc(asset.fatherInfo.library, extName);
            // 有可能是 gltf 文件里的图片
            if (!src && asset.importer === 'texture') {
                // texture 默认图标
                iconInfo.value = asset.importer;
                const meta = await Editor.Message.request('asset-db', 'query-asset-meta', asset.uuid);
                if (!meta || !meta.userData || !meta.userData.imageUuidOrDatabaseUri) {
                    return iconInfo;
                }
                const imageAsset = await Editor.Message.request('asset-db', 'query-asset-info', meta.userData.imageUuidOrDatabaseUri);
                if (!imageAsset) {
                    return iconInfo;
                }
                const fileExt = path_1.extname(imageAsset.name).toLowerCase();
                src = getLibraryImageSrc(imageAsset.library, fileExt);
            }
            iconInfo.value = src;
        }
        else {
            const extName = path_1.extname(asset.source);
            iconInfo.value = asset.library[extName];
        }
        iconInfo.type = 'image';
        return iconInfo;
    }
    const name = asset.importer;
    if (name) {
        iconInfo.value = name;
        return iconInfo;
    }
    return iconInfo;
}
function getLibraryImageSrc(library, fileExt) {
    let src = library[fileExt];
    if (!src) {
        const key = Object.keys(library).find((key) => key !== '.json') || '';
        src = library[key];
    }
    return src;
}
/**
 * 整理所有的节点信息
 * @param dumps
 * @param result
 * @param dir
 */
function sortNodeDump(dumps, options, result = []) {
    if (!dumps) {
        return result;
    }
    if (dumps.children.length === 0) {
        return result;
    }
    dumps.children.forEach((info) => {
        if (!options || (options && options.pathPattern && minimatch(info.path, options.pathPattern))) {
            result.push({
                name: info.name,
                type: info.type,
                uuid: info.uuid,
                path: info.path,
            });
        }
        if (info.children.length > 0) {
            sortNodeDump(info, options, result);
        }
    });
    return result;
}
/**
 * 整理带有某个类型组件的节点信息
 * @param dumps
 * @param ccType
 * @param result
 * @param dir
 */
function sortNodeCompDump(dumps, ccTypes, result = [], dir) {
    if (!dumps) {
        return result;
    }
    if (dumps.children.length === 0) {
        return result;
    }
    for (const ccType of ccTypes) {
        dumps.children.forEach((node) => {
            let path = dir ? dir : '';
            path += ` / ${node.name}`;
            const comp = node.components.find((item) => item.type === ccType);
            if (comp) {
                result.push({
                    name: node.name,
                    uuid: comp.value,
                    path,
                    nodeUuid: node.uuid,
                    iconName: ccType,
                });
            }
            if (node.children.length > 0) {
                sortNodeCompDump(node, [ccType], result, path);
            }
        });
    }
    return result;
}
// 整理所有的组件信息（添加组件时）
function sortCompDump(dumps) {
    const result = {};
    for (const dump of dumps) {
        if (dump.path.startsWith('hidden:')) {
            continue;
        }
        const keyArr = dump.path.split('/');
        let srcObj = result;
        keyArr.forEach((key, index) => {
            // 翻译
            if (key.startsWith('i18n:')) {
                key = Editor.I18n.t('ENGINE.' + key.substr(5)) || key;
            }
            if (index === keyArr.length - 1) {
                // 自定义的脚本资源, key 是 className 有可能重复，所以改用 cid
                if (dump.cid) {
                    key = dump.cid;
                }
                srcObj[key] = {
                    iconName: dump.name || 'component',
                    ...dump,
                };
            }
            else if (!srcObj[key]) {
                srcObj[key] = {};
            }
            srcObj = srcObj[key];
        });
    }
    return result;
}
function sortScriptDump(dumps) {
    const result = {};
    for (const dump of dumps) {
        result[dump.name] = {
            iconName: 'component',
            ...dump,
        };
    }
    return result;
}
async function getExtendsClass(ccType) {
    if (!ccType) {
        return '';
    }
    // ccClass 需要查询 ccType 做为基类的继承关系
    const ccClasses = ccType.split(',');
    const ccTypes = [];
    for (const ccClass of ccClasses) {
        if (!ccClass) {
            continue;
        }
        const classes = await Editor.Message.request('scene', 'query-classes', { extends: ccClass });
        if (Array.isArray(classes) && classes.length) {
            for (const cls of classes) {
                if (!ccTypes.includes(cls.name)) {
                    ccTypes.push(cls.name);
                }
            }
        }
    }
    return ccTypes.join(',');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3NlYXJjaGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtiLDJCQUFrQztBQUNsQywrQkFBcUM7QUFDckMseURBQTJDO0FBQzNDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZDLEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUNqQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFFZixRQUFBLFFBQVEsR0FBRyxpQkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsZ0NBQWdDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN0RyxRQUFBLEtBQUssR0FBRyxpQkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsNEJBQTRCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN6RixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFLdkMsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBQ25CLElBQUksS0FBSyxHQUFRLElBQUksQ0FBQztBQUV0QixTQUFTLGFBQWEsQ0FBQyxJQUFhLEVBQUUsSUFBWSxFQUFFLE1BQVc7SUFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFO1FBQ2hDLE1BQU07S0FDVCxDQUFDLENBQUM7SUFDSCxJQUFJLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBRUQsTUFBTSxxQkFBcUIsR0FBRztJQUMxQixXQUFXO0lBQ1gsbUJBQW1CO0lBQ25CLGtCQUFrQjtJQUNsQixnQkFBZ0I7SUFDaEIsYUFBYTtJQUNiLG9CQUFvQjtJ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QUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM3RixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUMxQyxLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRTtnQkFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDMUI7YUFDSjtTQUNKO0tBQ0o7SUFFRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXRJbmZvLCBJY29uSW5mbyB9IGZyb20gJy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB7IFF1ZXJ5QXNzZXRzT3B0aW9uIH0gZnJvbSAnQGVkaXRvci9saWJyYXJ5LXR5cGUvcGFja2FnZXMvYXNzZXQtZGIvQHR5cGVzL3B1YmxpYyc7XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGV4dG5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNlY3Rpb24gZnJvbSAnLi9jb21wcy9zZWN0aW9uJztcbmNvbnN0IFZ1ZSA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYycsICcvdGVtcGxhdGUvcGFuZWxzL3NlYXJjaGVyLmh0bWwnKSwgJ3V0ZjgnKTtcbmV4cG9ydCBjb25zdCBzdHlsZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2Rpc3Qvc2VhcmNoZXIuY3NzJyksICd1dGY4Jyk7XG5jb25zdCBtaW5pbWF0Y2ggPSByZXF1aXJlKCdtaW5pbWF0Y2gnKTtcblxuZGVjbGFyZSBpbnRlcmZhY2UgU2VsZWN0SW5mbyB7XG4gICAgdXVpZDogc3RyaW5nO1xufVxubGV0IHZtOiBhbnkgPSBudWxsO1xubGV0IHBhbmVsOiBhbnkgPSBudWxsO1xuXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KG5vZGU6IEVsZW1lbnQsIG5hbWU6IHN0cmluZywgZGV0YWlsOiBhbnkpIHtcbiAgICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudChuYW1lLCB7XG4gICAgICAgIGRldGFpbCxcbiAgICB9KTtcbiAgICBub2RlLnBhcmVudE5vZGU/LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufVxuXG5jb25zdCBhbGxvd0NyZWF0ZUFzc2V0VHlwZXMgPSBbXG4gICAgJ2NjLlNjcmlwdCcsXG4gICAgJ2NjLlJlbmRlclBpcGVsaW5lJyxcbiAgICAnY2MuQW5pbWF0aW9uQ2xpcCcsXG4gICAgJ2NjLkVmZmVjdEFzc2V0JyxcbiAgICAnY2MuTWF0ZXJpYWwnLFxuICAgICdjYy5QaHlzaWNzTWF0ZXJpYWwnLFxuICAgICdjYy5SZW5kZXJUZXh0dXJlJyxcbiAgICAnY2MuU2NlbmVBc3NldCcsXG4gICAgJ2NjLlNwcml0ZUF0bGFzJyxcbiAgICAnY2MuVGVycmFpbkFzc2V0JyxcbiAgICAnY2MuVGV4dHVyZUN1YmUnLFxuXTtcblxubGV0IERhdGFEdW1wQ2FjaGU6IGFueVtdID0gW107XG5cbmNvbnN0IG1heExpbmVzTnVtYmVyID0gNTA7IC8vIOacgOWkp+aYvuekuueahOihjOaVsO+8jOa7muWKqOWIsOacq+WwvuaXtuWinuWKoFxuXG5leHBvcnQgY29uc3QgJCA9IHsgY29udGVudDogJy5zZWFyY2hlcicgfTtcblxuY29uc3QgcmVjb3JkUHJldmlldyA9IHtcbiAgICBtZXRob2Q6ICcnLFxuICAgIGlkOiAnJyxcbiAgICBpbmZvOiB7fSxcbn07XG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcblxuICAgIC8qKlxuICAgICAqIOS4ouWkseWFs+mXremdouadv+inpuWPkeeahOWHveaVsFxuICAgICAqL1xuICAgIGFzeW5jIGNsZWFyKCkge1xuICAgICAgICAvLyDlnKjpmpDol4/pnaLmnb/liY3lpoLmnpzkuI3mmK/lj5bmtojpooTop4jliJnmiafooYzkuIDmrKHlj5bmtojpooTop4jkuovku7bjgIJcbiAgICAgICAgaWYgKHJlY29yZFByZXZpZXcubWV0aG9kID09PSAnY29uZmlybScpIHtcbiAgICAgICAgICAgIHJlY29yZFByZXZpZXcubWV0aG9kID0gJyc7XG5cbiAgICAgICAgICAgIGNvbnN0IHBhbmVsOiBhbnkgPSB0aGlzO1xuICAgICAgICAgICAgZGlzcGF0Y2hFdmVudChwYW5lbC4kLmNvbnRlbnQsICdwcmV2aWV3Jywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ2NhbmNlbCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlY29yZFByZXZpZXcuaWQsXG4gICAgICAgICAgICAgICAgaW5mbzogcmVjb3JkUHJldmlldy5pbmZvLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdm0ubG9hZGluZyA9IHRydWU7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIC8vIHNldFRpbWVvdXQgMCDnrYnlvoXlj5bmtojpooTop4jkuovku7bmiafooYzlrozmr5VcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodm9pZCAwKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgcmVzZXQob3B0aW9uOiBhbnkpIHtcbiAgICAgICAgYXdhaXQgdm0udXBkYXRlRGF0YShvcHRpb24udHlwZSwgb3B0aW9uLmRyb3BwYWJsZSwgb3B0aW9uKTtcbiAgICAgICAgdm0uc2VsZWN0ZWQgPSBvcHRpb24udmFsdWU7XG4gICAgICAgIHZtLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgdm0uaXNLaXRDbG9zZWQgPSBmYWxzZTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghdm0uJHJlZnNbJ3NlYXJjaElucHV0J10uZm9jdXNlZCkge1xuICAgICAgICAgICAgICAgIHZtLiRyZWZzWydzZWFyY2hJbnB1dCddLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgdXAoKSB7XG4gICAgICAgIHZtLnVwRG93blNlbGVjdCgtMSk7XG4gICAgfSxcbiAgICBkb3duKCkge1xuICAgICAgICB2bS51cERvd25TZWxlY3QoMSk7XG4gICAgfSxcbiAgICBlbnRlcigpIHtcbiAgICAgICAgdm0uZW50ZXJTZWxlY3QoKTtcbiAgICB9LFxuICAgIGVzYygpIHtcbiAgICAgICAgdm0uJHJlZnNbJ3NlYXJjaElucHV0J10uZm9jdXMoKTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwYW5lbCA9IHRoaXM7XG5cbiAgICAvLyDliJ3lp4vljJYgdnVlXG4gICAgdm0gPSBuZXcgVnVlKHtcbiAgICAgICAgZWw6IHBhbmVsLiQuY29udGVudCxcbiAgICAgICAgY29tcG9uZW50czoge1xuICAgICAgICAgICAgJ2NvbXBzLXNlY3Rpb24nOiBzZWN0aW9uLFxuICAgICAgICB9LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsb2FkaW5nOiB0cnVlLFxuXG4gICAgICAgICAgICBzZWFyY2g6ICcnLCAvLyDmkJzntKLnmoQgaW5wdXQgdmFsdWVcbiAgICAgICAgICAgIHNlbGVjdGVkOiBudWxsLFxuXG4gICAgICAgICAgICB0eXBlOiAnJyxcbiAgICAgICAgICAgIGNjVHlwZTogJycsXG4gICAgICAgICAgICBhc3NldEZpbHRlcjogbnVsbCxcbiAgICAgICAgICAgIGRhdGFEdW1wOiBudWxsLFxuICAgICAgICAgICAgZGF0YUR1bXBTaG93TnVtYmVyOiBtYXhMaW5lc051bWJlciwgLy8g5oCn6IO95LyY5YyW77ya5b2T5YmN5pi+56S655qE5pyA5aSn6KGM5pWw77yM5rua5Yqo5Yiw5pyr5bC+5YaN57un57ut57+75YCN5Yqg6L29XG5cbiAgICAgICAgICAgIGlzS2l0Q2xvc2VkOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgIGV4cGFuZCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcztcblxuICAgICAgICAgICAgICAgIGlmICh2bS5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgIHNlbGVjdGVkKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZtOiBhbnkgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHZtLiRyZWZzWydtYWluJ10ucXVlcnlTZWxlY3RvcignLmxpbmVbc2VsZWN0ZWRdJyk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudC5yZW1vdmVBdHRyaWJ1dGUoJ3NlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdm0uc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB2bS4kcmVmc1snbWFpbiddLnF1ZXJ5U2VsZWN0b3IoJy5saW5lW3ZhbHVlPVwiJyArIHZtLnNlbGVjdGVkICsgJ1wiXScpO1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZSgnc2VsZWN0ZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5a6a5L2N5Yiw6YCJ5oup5pWw5o2u5pe277yM6Ieq5Yqo5bGV5byAXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQucGFyZW50Tm9kZSAmJiAhdGFyZ2V0LnBhcmVudE5vZGUuZXhwYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQucGFyZW50Tm9kZS5leHBhbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbW91bnRlZCgpIHtcbiAgICAgICAgICAgIHRoaXMuJHJlZnMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHNjcm9sbEhlaWdodCwgY2xpZW50SGVpZ2h0LCBzY3JvbGxUb3AgfSA9IHRoaXMuJHJlZnMuY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxIZWlnaHQgLSBjbGllbnRIZWlnaHQgLSBzY3JvbGxUb3AgPCAxMDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0YUR1bXAgJiYgdGhpcy5kYXRhRHVtcFNob3dOdW1iZXIgPCB0aGlzLmRhdGFEdW1wLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhRHVtcFNob3dOdW1iZXIgKz0gbWF4TGluZXNOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbWV0aG9kczoge1xuICAgICAgICAgICAgdChrZXk6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KGB1aS1raXQuc2VhcmNoZXIuJHtrZXl9YCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOagueaNruexu+Wei+abtOaWsOaVsOaNrlxuICAgICAgICAgICAgICogQHBhcmFtIHR5cGUgbm9kZSB8IGNvbXBvbmVudCB8IGFzc2V0IHwgYWRkLWNvbXBvbmVudFxuICAgICAgICAgICAgICogQHBhcmFtIGNjVHlwZVxuICAgICAgICAgICAgICogQHBhcmFtIG9wdGlvblxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhc3luYyB1cGRhdGVEYXRhKHR5cGU6IHN0cmluZywgY2NUeXBlOiBzdHJpbmcsIG9wdGlvbjogYW55KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICB2bS4kcmVmc1snc2VhcmNoSW5wdXQnXS52YWx1ZSA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZtLnR5cGUgIT09IHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcFNob3dOdW1iZXIgPSBtYXhMaW5lc051bWJlcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWFyY2hlciB0eXBlIOWIhuS4uuWkmuenjeexu+Wei1xuICAgICAgICAgICAgICAgIHZtLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgIHZtLmNjVHlwZSA9IGNjVHlwZTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAodm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhZGQtY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHZtLmFkZENvbXBvbmVudHNJbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbm9kZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB2bS5zZWFyY2hOb2RlSW5pdChvcHRpb24uZmlsdGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLmNjVHlwZSA9IGF3YWl0IGdldEV4dGVuZHNDbGFzcyhjY1R5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdm0uc2VhcmNoQ29tcG9uZW50c0luaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhc3NldCc6XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5jY1R5cGUgPSBhd2FpdCBnZXRFeHRlbmRzQ2xhc3MoY2NUeXBlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXNzZXQtZGIg5pSv5oyB5aSa56eN5YWl5Y+C55qE6L+H5ruk5pa55byPXG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5hc3NldEZpbHRlciA9IG9wdGlvbi5hc3NldEZpbHRlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdm0uc2VhcmNoQXNzZXRzSW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NjcmlwdCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB2bS5zZWFyY2hTY3JpcHRJbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOa3u+WKoOe7hOS7tueahOaVsOaNruWIneWni+WMllxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhc3luYyBhZGRDb21wb25lbnRzSW5pdCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcztcbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktY29tcG9uZW50cycpO1xuXG4gICAgICAgICAgICAgICAgLy8g5ZCN56ew5o6S5bqP5LyY5YWI77yM5YW25qyh5piv5YaF6YOo5bGC57qn77yM5pyJ5a2Q6ZuG55qE5o6S5Zyo5ZCO6Z2iXG4gICAgICAgICAgICAgICAgRGF0YUR1bXBDYWNoZS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFNYXRjaCA9IGEucGF0aC5tYXRjaCgvXFwvL2cpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBiTWF0Y2ggPSBiLnBhdGgubWF0Y2goL1xcLy9nKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhTGV2ZWxzID0gYU1hdGNoID8gYU1hdGNoLmxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJMZXZlbHMgPSBiTWF0Y2ggPyBiTWF0Y2gubGVuZ3RoIDogMDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYUxldmVscyA9PT0gYkxldmVscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEucGF0aC5sb2NhbGVDb21wYXJlKGIucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYUxldmVscyAtIGJMZXZlbHM7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcCA9IHNvcnRDb21wRHVtcChEYXRhRHVtcENhY2hlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pCc57Si57uE5Lu255qE5pWw5o2u5Yid5aeL5YyWXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFzeW5jIHNlYXJjaENvbXBvbmVudHNJbml0KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZtOiBhbnkgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZHVtcHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKTtcbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlID0gc29ydE5vZGVDb21wRHVtcChkdW1wcywgdm0uY2NUeXBlLnNwbGl0KCcsJykpO1xuICAgICAgICAgICAgICAgIERhdGFEdW1wQ2FjaGUuc29ydCgoYSwgYikgPT4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSk7XG4gICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBEYXRhRHVtcENhY2hlO1xuICAgICAgICAgICAgICAgIHZtLnNlbGVjdGVkID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6LWE5rqQ5pCc57Si5pWw5o2u5Yid5aeL5YyWXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFzeW5jIHNlYXJjaEFzc2V0c0luaXQoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeU9wdGlvbnM6IFF1ZXJ5QXNzZXRzT3B0aW9uID0ge307XG4gICAgICAgICAgICAgICAgaWYgKHZtLmFzc2V0RmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ocXVlcnlPcHRpb25zLCB2bS5hc3NldEZpbHRlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFRPRE8g5Y+v5Lul6ICD6JmR5ZKMIGFzc2V0RmlsdGVyIOWQiOW5tlxuICAgICAgICAgICAgICAgIGlmICh2bS5jY1R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2NUeXBlcyA9IHZtLmNjVHlwZS5zcGxpdCgnLCcpLm1hcCgodHlwZTogc3RyaW5nKSA9PiB0eXBlLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5T3B0aW9ucy5jY1R5cGUgPSBjY1R5cGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldHMnLCBxdWVyeU9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIERhdGFEdW1wQ2FjaGUgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIGFzc2V0cykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpY29uSW5mbyA9IGF3YWl0IGdldEFzc2V0SWNvbkluZm8oYXNzZXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBhc3NldC5kaXNwbGF5TmFtZSB8fCBhc3NldC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogYXNzZXQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgc29ydDogbmFtZSArIGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25JbmZvLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlLnB1c2goZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgRGF0YUR1bXBDYWNoZS5zb3J0KChhLCBiKSA9PiBhLnNvcnQubG9jYWxlQ29tcGFyZShiLnNvcnQpKTtcbiAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcCA9IERhdGFEdW1wQ2FjaGU7XG4gICAgICAgICAgICAgICAgdm0uZGF0YUR1bXBTaG93TnVtYmVyID0gbWF4TGluZXNOdW1iZXI7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOiKgueCueaQnOe0ouaVsOaNruWIneWni+WMllxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhc3luYyBzZWFyY2hOb2RlSW5pdChub2RlRmlsdGVyPzogTm9kZUZpbHRlck9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcztcbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wcyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpO1xuICAgICAgICAgICAgICAgIERhdGFEdW1wQ2FjaGUgPSBzb3J0Tm9kZUR1bXAoZHVtcHMsIG5vZGVGaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wID0gRGF0YUR1bXBDYWNoZTtcbiAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcFNob3dOdW1iZXIgPSBtYXhMaW5lc051bWJlcjtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pCc57Si5LiN5ZCM55qE6ISa5pys57uE5Lu277yM5Z+657G75LiOIENvbXBvbmVudCDkuI3lkIxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXN5bmMgc2VhcmNoU2NyaXB0SW5pdCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcztcblxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVTZWxmOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBleHRlbmRzOiB2bS5jY1R5cGUsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAodm0uY2NUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygdm0uY2NUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5leHRlbmRzID0gW3ZtLmNjVHlwZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktY2xhc3NlcycsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIC8vIOWQjeensOaOkuW6j+S8mOWFiO+8jOWFtuasoeaYr+WGhemDqOWxgue6p++8jOacieWtkOmbhueahOaOkuWcqOWQjumdolxuICAgICAgICAgICAgICAgIERhdGFEdW1wQ2FjaGUuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcCA9IHNvcnRTY3JpcHREdW1wKERhdGFEdW1wQ2FjaGUpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmkJzntKJcbiAgICAgICAgICAgICAqIEBwYXJhbSBldmVudFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvblNlYXJjaChldmVudDogYW55KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2hTdHIgPSBldmVudC50YXJnZXQudmFsdWUudHJpbSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZtLnNlYXJjaCA9PT0gc2VhcmNoU3RyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2bS5zZWFyY2ggPSBzZWFyY2hTdHI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IERhdGFEdW1wQ2FjaGU7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodm0uc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWcgPSBuZXcgUmVnRXhwKHZtLnNlYXJjaCwgJ2knKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IERhdGFEdW1wQ2FjaGUuZmlsdGVyKChhc3NldDogQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGlzTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoID0gYXNzZXQubmFtZS5zZWFyY2gocmVnKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNNYXRjaCAmJiBhc3NldC5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2ggPSBhc3NldC5wYXRoLnNlYXJjaChyZWcpICE9PSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IH1cblxuICAgICAgICAgICAgICAgIGlmICh2bS50eXBlID09PSAnYWRkLWNvbXBvbmVudCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBzb3J0Q29tcER1bXAocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodm0udHlwZSA9PT0gJ3NjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wID0gc29ydFNjcmlwdER1bXAocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wU2hvd051bWJlciA9IG1heExpbmVzTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICB2bS4kcmVmcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOm7mOiupOmAieS4reesrOS4gOS4qlxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoICYmIHZtLnNlYXJjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6ZyA6KaB562J5b6FIGRhdGFEdW1wIOWcqOeVjOmdouS4iuabtOaWsOWQjuaJjeiDveafpeaJvuWIsCBzZWxlY3RlZERvbVxuICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0ZWQgPSByZXN1bHRbMF0ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLnNlbGVjdGVkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmkJzntKLml7bplK7nm5jkuovku7ZcbiAgICAgICAgICAgICAqIOS4i+eureWktCDliIfmjaIg6YCJ5Lit56ys5LiA5Liq5pCc57Si57uT5p6cXG4gICAgICAgICAgICAgKiBAcGFyYW0gZXZuZXRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2VhcmNoS2V5ZG93bihldmVudDogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LmJsdXIoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuZ2V0VmFsdWVzKCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0ZWQgPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0VmFsdWVzKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZtOiBhbnkgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gdm0uJHJlZnNbJ21haW4nXS5xdWVyeVNlbGVjdG9yQWxsKCcubGluZScpO1xuICAgICAgICAgICAgICAgIGxpbmVzLmZvckVhY2goKGxpbmU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbGluZS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlICYmIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB1cERvd25TZWxlY3QoaTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSB2bS5nZXRWYWx1ZXMoKTtcblxuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IHZhbHVlcy5pbmRleE9mKHZtLnNlbGVjdGVkKSArIGk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPD0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSB2YWx1ZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2bS5zZWxlY3RlZCA9IHZhbHVlc1tpbmRleF07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBlbnRlclNlbGVjdCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2bTogYW55ID0gdGhpcztcblxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB2bS4kcmVmc1snbWFpbiddLnF1ZXJ5U2VsZWN0b3IoJy5saW5lW3ZhbHVlPVwiJyArIHZtLnNlbGVjdGVkICsgJ1wiXScpO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOehruiupOW6lOeUqOafkOmAiemhue+8iOWFs+mXrSBraXQg6Z2i5p2/77yJXG4gICAgICAgICAgICAgKiBAcGFyYW0gaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSBpbmZvXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU2VsZWN0KGlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2bS5zZWxlY3RlZCA9IGlkO1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaCA9ICcnO1xuXG4gICAgICAgICAgICAgICAgLy8g5pyJ55So5oi36YCJ5Lit6KGM5Li655qE5Y+W5raI5Zue6YCA6aKE6KeI55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgcmVjb3JkUHJldmlldy5tZXRob2QgPSAnJztcblxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtOiBhbnkgPSB0aGlzLiRlbDtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50KGVsZW0sICdjaGFuZ2UnLCB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50KGVsZW0sICdjb25maXJtJywge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaWQsXG4gICAgICAgICAgICAgICAgICAgIGluZm8sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdm0uY2xvc2VLaXQoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6Zeq54OB5p+Q6LWE5rqQ5oiW6IqC54K5XG4gICAgICAgICAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0d2lua2xlKGRhdGE6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZtOiBhbnkgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZtLnR5cGUgPT09ICdhc3NldCcpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnYXNzZXRzJywgJ3R3aW5rbGUnLCBkYXRhLnV1aWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodm0udHlwZSA9PT0gJ25vZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2hpZXJhcmNoeScsICd0d2lua2xlJywgZGF0YS51dWlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZtLnR5cGUgPT09ICdjb21wb25lbnQnKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2hpZXJhcmNoeScsICd0d2lua2xlJywgZGF0YS5ub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY2hlY2tBbGxvd0NyZWF0ZSh0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxsb3dDcmVhdGVBc3NldFR5cGVzLmluY2x1ZGVzKHR5cGUpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXN5bmMgY3JlYXRlQXNzZXQoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLl9fcHJvdGVjdGVkX18uaG9sZEtpdCgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldC1kaWFsb2cnLCB2bS5jY1R5cGUpO1xuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5vblNlbGVjdCh1dWlkLCBpbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2bS5jbG9zZUtpdCgpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY2xvc2VLaXQoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdm0uaXNLaXRDbG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwuX19wcm90ZWN0ZWRfXy5jbG9zZUtpdCgpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcHJldmlldyhtZXRob2Q6IHN0cmluZywgaWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm06IGFueSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHZtLmlzS2l0Q2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGtpdCDlhbPpl63lkI7kuI3lho3op6blj5EgcHJldmlldyDooYzkuLpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlY29yZFByZXZpZXcubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICAgICAgICAgIHJlY29yZFByZXZpZXcuaWQgPSBpZDtcbiAgICAgICAgICAgICAgICByZWNvcmRQcmV2aWV3LmluZm8gPSBpbmZvO1xuXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW06IGFueSA9IHRoaXMuJGVsO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQoZWxlbSwgJ3ByZXZpZXcnLCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgICAgICAgICBpbmZvLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJlZm9yZUNsb3NlKCkgeyB9XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZSgpIHsgfVxuXG5jb25zdCBpbWFnZUltcG9ydGVyID0gWydpbWFnZScsICd0ZXh0dXJlJywgJ3Nwcml0ZS1mcmFtZScsICdnbHRmLW1lc2gnXTtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0QXNzZXRJY29uSW5mbyhhc3NldDogYW55KSB7XG4gICAgY29uc3QgaWNvbkluZm86IEljb25JbmZvID0ge1xuICAgICAgICB0eXBlOiAnaWNvbicsXG4gICAgICAgIHZhbHVlOiAnZmlsZScsXG4gICAgfTtcbiAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgIHJldHVybiBpY29uSW5mbztcbiAgICB9XG4gICAgaWYgKGltYWdlSW1wb3J0ZXIuaW5jbHVkZXMoYXNzZXQuaW1wb3J0ZXIpKSB7XG4gICAgICAgIGlmICghYXNzZXQuc291cmNlICYmIGFzc2V0LmZhdGhlckluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dE5hbWUgPSBleHRuYW1lKGFzc2V0LmZhdGhlckluZm8uc291cmNlKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgbGV0IHNyYyA9IGdldExpYnJhcnlJbWFnZVNyYyhhc3NldC5mYXRoZXJJbmZvLmxpYnJhcnksIGV4dE5hbWUpO1xuXG4gICAgICAgICAgICAvLyDmnInlj6/og73mmK8gZ2x0ZiDmlofku7bph4znmoTlm77niYdcbiAgICAgICAgICAgIGlmICghc3JjICYmIGFzc2V0LmltcG9ydGVyID09PSAndGV4dHVyZScpIHtcbiAgICAgICAgICAgICAgICAvLyB0ZXh0dXJlIOm7mOiupOWbvuagh1xuICAgICAgICAgICAgICAgIGljb25JbmZvLnZhbHVlID0gYXNzZXQuaW1wb3J0ZXI7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghbWV0YSB8fCAhbWV0YS51c2VyRGF0YSB8fCAhbWV0YS51c2VyRGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpY29uSW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VBc3NldCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBtZXRhLnVzZXJEYXRhLmltYWdlVXVpZE9yRGF0YWJhc2VVcmkpO1xuICAgICAgICAgICAgICAgIGlmICghaW1hZ2VBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWNvbkluZm87XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZUV4dCA9IGV4dG5hbWUoaW1hZ2VBc3NldC5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHNyYyA9IGdldExpYnJhcnlJbWFnZVNyYyhpbWFnZUFzc2V0LmxpYnJhcnksIGZpbGVFeHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpY29uSW5mby52YWx1ZSA9IHNyYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dE5hbWUgPSBleHRuYW1lKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICBpY29uSW5mby52YWx1ZSA9IGFzc2V0LmxpYnJhcnlbZXh0TmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICBpY29uSW5mby50eXBlID0gJ2ltYWdlJztcbiAgICAgICAgcmV0dXJuIGljb25JbmZvO1xuICAgIH1cbiAgICBjb25zdCBuYW1lID0gYXNzZXQuaW1wb3J0ZXI7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgICAgaWNvbkluZm8udmFsdWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gaWNvbkluZm87XG4gICAgfVxuICAgIHJldHVybiBpY29uSW5mbztcbn1cblxuZnVuY3Rpb24gZ2V0TGlicmFyeUltYWdlU3JjKGxpYnJhcnk6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sIGZpbGVFeHQ6IHN0cmluZykge1xuICAgIGxldCBzcmMgPSBsaWJyYXJ5W2ZpbGVFeHRdO1xuICAgIGlmICghc3JjKSB7XG4gICAgICAgIGNvbnN0IGtleTogc3RyaW5nID0gT2JqZWN0LmtleXMobGlicmFyeSkuZmluZCgoa2V5KSA9PiBrZXkgIT09ICcuanNvbicpIHx8ICcnO1xuICAgICAgICBzcmMgPSBsaWJyYXJ5W2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHNyYztcbn1cblxuaW50ZXJmYWNlIE5vZGVGaWx0ZXJPcHRpb25zIHtcbiAgICBwYXRoUGF0dGVybj86IHN0cmluZzsgLy8g5Y+C6ICDIG1pbmltYXRjaCDot6/lvoTljLnphY3op4TliJlcbn1cblxuLyoqXG4gKiDmlbTnkIbmiYDmnInnmoToioLngrnkv6Hmga9cbiAqIEBwYXJhbSBkdW1wc1xuICogQHBhcmFtIHJlc3VsdFxuICogQHBhcmFtIGRpclxuICovXG5mdW5jdGlvbiBzb3J0Tm9kZUR1bXAoZHVtcHM6IGFueSwgb3B0aW9ucz86IE5vZGVGaWx0ZXJPcHRpb25zLCByZXN1bHQ6IEFzc2V0SW5mb1tdID0gW10pOiBBc3NldEluZm9bXSB7XG4gICAgaWYgKCFkdW1wcykge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBpZiAoZHVtcHMuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZHVtcHMuY2hpbGRyZW4uZm9yRWFjaCgoaW5mbzogYW55KSA9PiB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAob3B0aW9ucyAmJiBvcHRpb25zLnBhdGhQYXR0ZXJuICYmIG1pbmltYXRjaChpbmZvLnBhdGgsIG9wdGlvbnMucGF0aFBhdHRlcm4pKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IGluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBpbmZvLnR5cGUsXG4gICAgICAgICAgICAgICAgdXVpZDogaW5mby51dWlkLFxuICAgICAgICAgICAgICAgIHBhdGg6IGluZm8ucGF0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZm8uY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc29ydE5vZGVEdW1wKGluZm8sIG9wdGlvbnMsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICog5pW055CG5bim5pyJ5p+Q5Liq57G75Z6L57uE5Lu255qE6IqC54K55L+h5oGvXG4gKiBAcGFyYW0gZHVtcHNcbiAqIEBwYXJhbSBjY1R5cGVcbiAqIEBwYXJhbSByZXN1bHRcbiAqIEBwYXJhbSBkaXJcbiAqL1xuZnVuY3Rpb24gc29ydE5vZGVDb21wRHVtcChkdW1wczogYW55LCBjY1R5cGVzOiBzdHJpbmdbXSwgcmVzdWx0OiBhbnlbXSA9IFtdLCBkaXI/OiBzdHJpbmcpIHtcbiAgICBpZiAoIWR1bXBzKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGR1bXBzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGNjVHlwZSBvZiBjY1R5cGVzKSB7XG4gICAgICAgIGR1bXBzLmNoaWxkcmVuLmZvckVhY2goKG5vZGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IHBhdGggPSBkaXIgPyBkaXIgOiAnJztcbiAgICAgICAgICAgIHBhdGggKz0gYCAvICR7bm9kZS5uYW1lfWA7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmNvbXBvbmVudHMuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLnR5cGUgPT09IGNjVHlwZSk7XG5cbiAgICAgICAgICAgIGlmIChjb21wKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGNvbXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGljb25OYW1lOiBjY1R5cGUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgc29ydE5vZGVDb21wRHVtcChub2RlLCBbY2NUeXBlXSwgcmVzdWx0LCBwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8g5pW055CG5omA5pyJ55qE57uE5Lu25L+h5oGv77yI5re75Yqg57uE5Lu25pe277yJXG5mdW5jdGlvbiBzb3J0Q29tcER1bXAoZHVtcHM6IGFueVtdKSB7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGR1bXAgb2YgZHVtcHMpIHtcbiAgICAgICAgaWYgKGR1bXAucGF0aC5zdGFydHNXaXRoKCdoaWRkZW46JykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qga2V5QXJyID0gZHVtcC5wYXRoLnNwbGl0KCcvJyk7XG4gICAgICAgIGxldCBzcmNPYmogPSByZXN1bHQ7XG4gICAgICAgIGtleUFyci5mb3JFYWNoKChrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgLy8g57+76K+RXG4gICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoJ2kxOG46JykpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBFZGl0b3IuSTE4bi50KCdFTkdJTkUuJyArIGtleS5zdWJzdHIoNSkpIHx8IGtleTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGluZGV4ID09PSBrZXlBcnIubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vIOiHquWumuS5ieeahOiEmuacrOi1hOa6kCwga2V5IOaYryBjbGFzc05hbWUg5pyJ5Y+v6IO96YeN5aSN77yM5omA5Lul5pS555SoIGNpZFxuICAgICAgICAgICAgICAgIGlmIChkdW1wLmNpZCkge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBkdW1wLmNpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzcmNPYmpba2V5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbk5hbWU6IGR1bXAubmFtZSB8fCAnY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAgICAgLi4uZHVtcCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICghc3JjT2JqW2tleV0pIHtcbiAgICAgICAgICAgICAgICBzcmNPYmpba2V5XSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3JjT2JqID0gc3JjT2JqW2tleV07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBzb3J0U2NyaXB0RHVtcChkdW1wczogYW55W10pIHtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9O1xuICAgIGZvciAoY29uc3QgZHVtcCBvZiBkdW1wcykge1xuICAgICAgICByZXN1bHRbZHVtcC5uYW1lXSA9IHtcbiAgICAgICAgICAgIGljb25OYW1lOiAnY29tcG9uZW50JyxcbiAgICAgICAgICAgIC4uLmR1bXAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0RXh0ZW5kc0NsYXNzKGNjVHlwZTogc3RyaW5nKSB7XG4gICAgaWYgKCFjY1R5cGUpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIC8vIGNjQ2xhc3Mg6ZyA6KaB5p+l6K+iIGNjVHlwZSDlgZrkuLrln7rnsbvnmoTnu6fmib/lhbPns7tcbiAgICBjb25zdCBjY0NsYXNzZXMgPSBjY1R5cGUuc3BsaXQoJywnKTtcbiAgICBjb25zdCBjY1R5cGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2NDbGFzcyBvZiBjY0NsYXNzZXMpIHtcbiAgICAgICAgaWYgKCFjY0NsYXNzKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1jbGFzc2VzJywgeyBleHRlbmRzOiBjY0NsYXNzIH0pO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjbGFzc2VzKSAmJiBjbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjbHMgb2YgY2xhc3Nlcykge1xuICAgICAgICAgICAgICAgIGlmICghY2NUeXBlcy5pbmNsdWRlcyhjbHMubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2NUeXBlcy5wdXNoKGNscy5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2NUeXBlcy5qb2luKCcsJyk7XG59XG4iXX0=