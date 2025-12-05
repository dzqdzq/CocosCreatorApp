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
exports.close = exports.ready = exports.methods = exports.$ = exports.style = exports.template = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const section = __importStar(require("./comps/section"));
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static', '/template/panels/searcher.html'), 'utf8');
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../dist/searcher.css'), 'utf8');
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
exports.$ = {
    container: '.searcher',
};
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
        vm && (vm.loading = true);
        return new Promise(resolve => {
            // setTimeout 0 等待取消预览事件执行完毕
            setTimeout(() => {
                resolve(void 0);
            }, 0);
        });
    },
    async reset(option) {
        if (!vm) {
            return;
        }
        await vm.updateData(option.type, option.droppable, option);
        vm.selected = option.value;
        vm.loading = false;
        vm.isKitClosed = false;
        vm.search = '';
        requestAnimationFrame(() => {
            if (vm && !vm.$refs['searchInput'].focused) {
                vm.$refs['searchInput'].focus();
            }
        });
    },
    up() {
        vm && vm.upDownSelect(-1);
    },
    down() {
        vm && vm.upDownSelect(1);
    },
    enter() {
        vm && vm.enterSelect();
    },
    esc() {
        vm && vm.$refs['searchInput'].focus();
    },
};
function ready() {
    // @ts-ignore
    panel = this;
    vm?.$destroy();
    vm = new Vue({
        el: panel.$.container,
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
                if (vm.search) {
                    return true;
                }
                return false;
            },
        },
        watch: {
            selected() {
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
                    // 定位到选择数据时，自动展开
                    let parentNode = target.parentNode;
                    while (parentNode && parentNode.tagName === 'UI-SECTION' && !parentNode.expand) {
                        parentNode.expand = true;
                        parentNode = parentNode.parentNode;
                    }
                    target.scrollIntoViewIfNeeded();
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
                DataDumpCache = await Editor.Message.request('scene', 'query-components');
                if (!vm) {
                    return;
                }
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
                const dumps = await Editor.Message.request('scene', 'query-node-tree');
                if (!vm) {
                    return;
                }
                DataDumpCache = sortNodeCompDump(dumps, vm.ccType.split(','));
                DataDumpCache.sort((a, b) => a.name.localeCompare(b.name));
                vm.dataDump = DataDumpCache;
                vm.selected = null;
            },
            /**
             * 资源搜索数据初始化
             */
            async searchAssetsInit() {
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
                if (!vm) {
                    return;
                }
                vm.dataDump = DataDumpCache;
                vm.dataDumpShowNumber = maxLinesNumber;
            },
            /**
             * 节点搜索数据初始化
             */
            async searchNodeInit(nodeFilter) {
                const dumps = await Editor.Message.request('scene', 'query-node-tree');
                DataDumpCache = sortNodeDump(dumps, nodeFilter);
                if (!vm) {
                    return;
                }
                vm.dataDump = DataDumpCache;
                vm.dataDumpShowNumber = maxLinesNumber;
            },
            /**
             * 搜索不同的脚本组件，基类与 Component 不同
             */
            async searchScriptInit() {
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
                if (!vm) {
                    return;
                }
                vm.dataDump = sortScriptDump(DataDumpCache);
            },
            /**
             * 搜索
             * @param event
             */
            onSearch(event) {
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
                    if (!vm) {
                        return;
                    }
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
                const result = [];
                const lines = vm.$refs['main'].querySelectorAll('.line');
                lines.forEach((line) => {
                    const value = line.getAttribute('value');
                    value && result.push(value);
                });
                return result;
            },
            upDownSelect(i) {
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
                Editor.Panel.__protected__.holdKit();
                const uuid = await Editor.Message.request('asset-db', 'create-asset-dialog', vm.ccType);
                if (uuid) {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
                    if (info) {
                        vm && vm.onSelect(uuid, info);
                        return;
                    }
                }
                vm && vm.closeKit();
            },
            closeKit() {
                vm.isKitClosed = true;
                // @ts-ignore
                Editor.Panel.__protected__.closeKit();
            },
            preview(method, id, info) {
                if (!vm || vm.isKitClosed) {
                    // kit 关闭后不再触发 preview 行为
                    return;
                }
                recordPreview.method = method;
                recordPreview.id = id;
                recordPreview.info = info;
                dispatchEvent(vm.$el, 'preview', {
                    method,
                    value: id,
                    info,
                });
            },
        },
    });
}
exports.ready = ready;
function close() {
    panel = null;
    vm?.$destroy();
    vm = null;
}
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
            const extName = (0, path_1.extname)(asset.fatherInfo.source).toLowerCase();
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
                const fileExt = (0, path_1.extname)(imageAsset.name).toLowerCase();
                src = getLibraryImageSrc(imageAsset.library, fileExt);
            }
            iconInfo.value = src;
        }
        else {
            const extName = (0, path_1.extname)(asset.source);
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
                    ccType,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3NlYXJjaGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLYiwyQkFBa0M7QUFDbEMsK0JBQXFDO0FBQ3JDLHlEQUEyQztBQUczQyxNQUFNLEdBQUcsR0FBbUIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUVmLFFBQUEsUUFBUSxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsZ0NBQWdDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN0RyxRQUFBLEtBQUssR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDekYsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBS3ZDLElBQUksRUFBRSxHQUFRLElBQUksQ0FBQztBQUNuQixJQUFJLEtBQUssR0FBUSxJQUFJLENBQUM7QUFFdEIsU0FBUyxhQUFhLENBQUMsSUFBYSxFQUFFLElBQVksRUFBRSxNQUFXO0lBQzNELE1BQU0sS0FBSyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksRUFBRTtRQUNoQyxNQUFNO0tBQ1QsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUVELE1BQU0scUJBQXFCLEdBQUc7SUFDMUIsV0FBVztJQUNYLG1CQUFtQjtJQUNuQixrQkFBa0I7SUFDbEIsZ0JBQWdC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U0FDWjtRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzdGLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQzFDLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFO2dCQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMxQjthQUNKO1NBQ0o7S0FDSjtJQUVELE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBc3NldEluZm8sIEljb25JbmZvIH0gZnJvbSAnLi4vLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0IHsgUXVlcnlBc3NldHNPcHRpb24gfSBmcm9tICdAY29jb3MvY3JlYXRvci10eXBlcy9lZGl0b3IvcGFja2FnZXMvYXNzZXQtZGIvQHR5cGVzL3B1YmxpYyc7XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGV4dG5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNlY3Rpb24gZnJvbSAnLi9jb21wcy9zZWN0aW9uJztcblxuaW1wb3J0IHR5cGUgeyBWdWVDb25zdHJ1Y3RvciB9IGZyb20gJ3Z1ZSc7XG5jb25zdCBWdWU6IFZ1ZUNvbnN0cnVjdG9yID0gcmVxdWlyZSgndnVlL2Rpc3QvdnVlLmpzJyk7XG5WdWUuY29uZmlnLnByb2R1Y3Rpb25UaXAgPSBmYWxzZTtcblZ1ZS5jb25maWcuZGV2dG9vbHMgPSBmYWxzZTtcblxuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljJywgJy90ZW1wbGF0ZS9wYW5lbHMvc2VhcmNoZXIuaHRtbCcpLCAndXRmOCcpO1xuZXhwb3J0IGNvbnN0IHN0eWxlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vZGlzdC9zZWFyY2hlci5jc3MnKSwgJ3V0ZjgnKTtcbmNvbnN0IG1pbmltYXRjaCA9IHJlcXVpcmUoJ21pbmltYXRjaCcpO1xuXG5kZWNsYXJlIGludGVyZmFjZSBTZWxlY3RJbmZvIHtcbiAgICB1dWlkOiBzdHJpbmc7XG59XG5sZXQgdm06IGFueSA9IG51bGw7XG5sZXQgcGFuZWw6IGFueSA9IG51bGw7XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQobm9kZTogRWxlbWVudCwgbmFtZTogc3RyaW5nLCBkZXRhaWw6IGFueSkge1xuICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KG5hbWUsIHtcbiAgICAgICAgZGV0YWlsLFxuICAgIH0pO1xuICAgIG5vZGUucGFyZW50Tm9kZT8uZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG5cbmNvbnN0IGFsbG93Q3JlYXRlQXNzZXRUeXBlcyA9IFtcbiAgICAnY2MuU2NyaXB0JyxcbiAgICAnY2MuUmVuZGVyUGlwZWxpbmUnLFxuICAgICdjYy5BbmltYXRpb25DbGlwJyxcbiAgICAnY2MuRWZmZWN0QXNzZXQnLFxuICAgICdjYy5NYXRlcmlhbCcsXG4gICAgJ2NjLlBoeXNpY3NNYXRlcmlhbCcsXG4gICAgJ2NjLlJlbmRlclRleHR1cmUnLFxuICAgICdjYy5TY2VuZUFzc2V0JyxcbiAgICAnY2MuU3ByaXRlQXRsYXMnLFxuICAgICdjYy5UZXJyYWluQXNzZXQnLFxuICAgICdjYy5UZXh0dXJlQ3ViZScsXG5dO1xuXG5sZXQgRGF0YUR1bXBDYWNoZTogYW55W10gPSBbXTtcblxuY29uc3QgbWF4TGluZXNOdW1iZXIgPSA1MDsgLy8g5pyA5aSn5pi+56S655qE6KGM5pWw77yM5rua5Yqo5Yiw5pyr5bC+5pe25aKe5YqgXG5cbmV4cG9ydCBjb25zdCAkID0geyBcbiAgICBjb250YWluZXI6ICcuc2VhcmNoZXInLCBcbn07XG5cbmNvbnN0IHJlY29yZFByZXZpZXcgPSB7XG4gICAgbWV0aG9kOiAnJyxcbiAgICBpZDogJycsXG4gICAgaW5mbzoge30sXG59O1xuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog5Lii5aSx5YWz6Zet6Z2i5p2/6Kem5Y+R55qE5Ye95pWwXG4gICAgICovXG4gICAgYXN5bmMgY2xlYXIoKSB7XG4gICAgICAgIC8vIOWcqOmakOiXj+mdouadv+WJjeWmguaenOS4jeaYr+WPlua2iOmihOiniOWImeaJp+ihjOS4gOasoeWPlua2iOmihOiniOS6i+S7tuOAglxuICAgICAgICBpZiAocmVjb3JkUHJldmlldy5tZXRob2QgPT09ICdjb25maXJtJykge1xuICAgICAgICAgICAgcmVjb3JkUHJldmlldy5tZXRob2QgPSAnJztcblxuICAgICAgICAgICAgY29uc3QgcGFuZWw6IGFueSA9IHRoaXM7XG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50KHBhbmVsLiQuY29udGVudCwgJ3ByZXZpZXcnLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnY2FuY2VsJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVjb3JkUHJldmlldy5pZCxcbiAgICAgICAgICAgICAgICBpbmZvOiByZWNvcmRQcmV2aWV3LmluZm8sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2bSAmJiAodm0ubG9hZGluZyA9IHRydWUpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICAvLyBzZXRUaW1lb3V0IDAg562J5b6F5Y+W5raI6aKE6KeI5LqL5Lu25omn6KGM5a6M5q+VXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHZvaWQgMCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFzeW5jIHJlc2V0KG9wdGlvbjogYW55KSB7XG4gICAgICAgIGlmICghdm0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHZtLnVwZGF0ZURhdGEob3B0aW9uLnR5cGUsIG9wdGlvbi5kcm9wcGFibGUsIG9wdGlvbik7XG5cbiAgICAgICAgdm0uc2VsZWN0ZWQgPSBvcHRpb24udmFsdWU7XG4gICAgICAgIHZtLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgdm0uaXNLaXRDbG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdm0uc2VhcmNoID0gJyc7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodm0gJiYgIXZtLiRyZWZzWydzZWFyY2hJbnB1dCddLmZvY3VzZWQpIHtcbiAgICAgICAgICAgICAgICB2bS4kcmVmc1snc2VhcmNoSW5wdXQnXS5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHVwKCkge1xuICAgICAgICB2bSAmJiB2bS51cERvd25TZWxlY3QoLTEpO1xuICAgIH0sXG4gICAgZG93bigpIHtcbiAgICAgICAgdm0gJiYgdm0udXBEb3duU2VsZWN0KDEpO1xuICAgIH0sXG4gICAgZW50ZXIoKSB7XG4gICAgICAgIHZtICYmIHZtLmVudGVyU2VsZWN0KCk7XG4gICAgfSxcbiAgICBlc2MoKSB7XG4gICAgICAgIHZtICYmIHZtLiRyZWZzWydzZWFyY2hJbnB1dCddLmZvY3VzKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xuXG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBuZXcgVnVlKHtcbiAgICAgICAgZWw6IHBhbmVsLiQuY29udGFpbmVyLFxuICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAnY29tcHMtc2VjdGlvbic6IHNlY3Rpb24sXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvYWRpbmc6IHRydWUsXG5cbiAgICAgICAgICAgIHNlYXJjaDogJycsIC8vIOaQnOe0oueahCBpbnB1dCB2YWx1ZVxuICAgICAgICAgICAgc2VsZWN0ZWQ6IG51bGwsXG5cbiAgICAgICAgICAgIHR5cGU6ICcnLFxuICAgICAgICAgICAgY2NUeXBlOiAnJyxcbiAgICAgICAgICAgIGFzc2V0RmlsdGVyOiBudWxsLFxuICAgICAgICAgICAgZGF0YUR1bXA6IG51bGwsXG4gICAgICAgICAgICBkYXRhRHVtcFNob3dOdW1iZXI6IG1heExpbmVzTnVtYmVyLCAvLyDmgKfog73kvJjljJbvvJrlvZPliY3mmL7npLrnmoTmnIDlpKfooYzmlbDvvIzmu5rliqjliLDmnKvlsL7lho3nu6fnu63nv7vlgI3liqDovb1cblxuICAgICAgICAgICAgaXNLaXRDbG9zZWQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBjb21wdXRlZDoge1xuICAgICAgICAgICAgZXhwYW5kKCkge1xuICAgICAgICAgICAgICAgIGlmICh2bS5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgIHNlbGVjdGVkKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB2bS4kcmVmc1snbWFpbiddLnF1ZXJ5U2VsZWN0b3IoJy5saW5lW3NlbGVjdGVkXScpO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQucmVtb3ZlQXR0cmlidXRlKCdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXZtLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdm0uJHJlZnNbJ21haW4nXS5xdWVyeVNlbGVjdG9yKCcubGluZVt2YWx1ZT1cIicgKyB2bS5zZWxlY3RlZCArICdcIl0nKTtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoJ3NlbGVjdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWumuS9jeWIsOmAieaLqeaVsOaNruaXtu+8jOiHquWKqOWxleW8gFxuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyZW50Tm9kZSA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50Tm9kZSAmJiBwYXJlbnROb2RlLnRhZ05hbWUgPT09ICdVSS1TRUNUSU9OJyAmJiAhcGFyZW50Tm9kZS5leHBhbmQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5leHBhbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZSA9IHBhcmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBtb3VudGVkKCkge1xuICAgICAgICAgICAgdGhpcy4kcmVmcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgc2Nyb2xsSGVpZ2h0LCBjbGllbnRIZWlnaHQsIHNjcm9sbFRvcCB9ID0gdGhpcy4kcmVmcy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbEhlaWdodCAtIGNsaWVudEhlaWdodCAtIHNjcm9sbFRvcCA8IDEwMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhRHVtcCAmJiB0aGlzLmRhdGFEdW1wU2hvd051bWJlciA8IHRoaXMuZGF0YUR1bXAubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGFEdW1wU2hvd051bWJlciArPSBtYXhMaW5lc051bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICB0KGtleTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoYHVpLWtpdC5zZWFyY2hlci4ke2tleX1gKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5qC55o2u57G75Z6L5pu05paw5pWw5o2uXG4gICAgICAgICAgICAgKiBAcGFyYW0gdHlwZSBub2RlIHwgY29tcG9uZW50IHwgYXNzZXQgfCBhZGQtY29tcG9uZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0gY2NUeXBlXG4gICAgICAgICAgICAgKiBAcGFyYW0gb3B0aW9uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFzeW5jIHVwZGF0ZURhdGEodHlwZTogc3RyaW5nLCBjY1R5cGU6IHN0cmluZywgb3B0aW9uOiBhbnkpIHtcbiAgICAgICAgICAgICAgICB2bS4kcmVmc1snc2VhcmNoSW5wdXQnXS52YWx1ZSA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZtLnR5cGUgIT09IHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcFNob3dOdW1iZXIgPSBtYXhMaW5lc051bWJlcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWFyY2hlciB0eXBlIOWIhuS4uuWkmuenjeexu+Wei1xuICAgICAgICAgICAgICAgIHZtLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgICAgIHZtLmNjVHlwZSA9IGNjVHlwZTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAodm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhZGQtY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHZtLmFkZENvbXBvbmVudHNJbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbm9kZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB2bS5zZWFyY2hOb2RlSW5pdChvcHRpb24uZmlsdGVyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLmNjVHlwZSA9IGF3YWl0IGdldEV4dGVuZHNDbGFzcyhjY1R5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdm0uc2VhcmNoQ29tcG9uZW50c0luaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhc3NldCc6XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5jY1R5cGUgPSBhd2FpdCBnZXRFeHRlbmRzQ2xhc3MoY2NUeXBlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXNzZXQtZGIg5pSv5oyB5aSa56eN5YWl5Y+C55qE6L+H5ruk5pa55byPXG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5hc3NldEZpbHRlciA9IG9wdGlvbi5hc3NldEZpbHRlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdm0uc2VhcmNoQXNzZXRzSW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NjcmlwdCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB2bS5zZWFyY2hTY3JpcHRJbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOa3u+WKoOe7hOS7tueahOaVsOaNruWIneWni+WMllxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhc3luYyBhZGRDb21wb25lbnRzSW5pdCgpIHtcbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktY29tcG9uZW50cycpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5ZCN56ew5o6S5bqP5LyY5YWI77yM5YW25qyh5piv5YaF6YOo5bGC57qn77yM5pyJ5a2Q6ZuG55qE5o6S5Zyo5ZCO6Z2iXG4gICAgICAgICAgICAgICAgRGF0YUR1bXBDYWNoZS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFNYXRjaCA9IGEucGF0aC5tYXRjaCgvXFwvL2cpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBiTWF0Y2ggPSBiLnBhdGgubWF0Y2goL1xcLy9nKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhTGV2ZWxzID0gYU1hdGNoID8gYU1hdGNoLmxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJMZXZlbHMgPSBiTWF0Y2ggPyBiTWF0Y2gubGVuZ3RoIDogMDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYUxldmVscyA9PT0gYkxldmVscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEucGF0aC5sb2NhbGVDb21wYXJlKGIucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYUxldmVscyAtIGJMZXZlbHM7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcCA9IHNvcnRDb21wRHVtcChEYXRhRHVtcENhY2hlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pCc57Si57uE5Lu255qE5pWw5o2u5Yid5aeL5YyWXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFzeW5jIHNlYXJjaENvbXBvbmVudHNJbml0KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXBzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJyk7XG4gICAgICAgICAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgRGF0YUR1bXBDYWNoZSA9IHNvcnROb2RlQ29tcER1bXAoZHVtcHMsIHZtLmNjVHlwZS5zcGxpdCgnLCcpKTtcbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlLnNvcnQoKGEsIGIpID0+IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpO1xuICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wID0gRGF0YUR1bXBDYWNoZTtcbiAgICAgICAgICAgICAgICB2bS5zZWxlY3RlZCA9IG51bGw7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOi1hOa6kOaQnOe0ouaVsOaNruWIneWni+WMllxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhc3luYyBzZWFyY2hBc3NldHNJbml0KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5T3B0aW9uczogUXVlcnlBc3NldHNPcHRpb24gPSB7fTtcbiAgICAgICAgICAgICAgICBpZiAodm0uYXNzZXRGaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihxdWVyeU9wdGlvbnMsIHZtLmFzc2V0RmlsdGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVE9ETyDlj6/ku6XogIPomZHlkowgYXNzZXRGaWx0ZXIg5ZCI5bm2XG4gICAgICAgICAgICAgICAgaWYgKHZtLmNjVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjY1R5cGVzID0gdm0uY2NUeXBlLnNwbGl0KCcsJykubWFwKCh0eXBlOiBzdHJpbmcpID0+IHR5cGUudHJpbSgpKTtcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlPcHRpb25zLmNjVHlwZSA9IGNjVHlwZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHF1ZXJ5T3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgRGF0YUR1bXBDYWNoZSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgYXNzZXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGljb25JbmZvID0gYXdhaXQgZ2V0QXNzZXRJY29uSW5mbyhhc3NldCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGFzc2V0LmRpc3BsYXlOYW1lIHx8IGFzc2V0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0OiBuYW1lICsgYXNzZXQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkluZm8sXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIERhdGFEdW1wQ2FjaGUucHVzaChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlLnNvcnQoKGEsIGIpID0+IGEuc29ydC5sb2NhbGVDb21wYXJlKGIuc29ydCkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF2bSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wID0gRGF0YUR1bXBDYWNoZTtcbiAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcFNob3dOdW1iZXIgPSBtYXhMaW5lc051bWJlcjtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6IqC54K55pCc57Si5pWw5o2u5Yid5aeL5YyWXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFzeW5jIHNlYXJjaE5vZGVJbml0KG5vZGVGaWx0ZXI/OiBOb2RlRmlsdGVyT3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXBzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJyk7XG4gICAgICAgICAgICAgICAgRGF0YUR1bXBDYWNoZSA9IHNvcnROb2RlRHVtcChkdW1wcywgbm9kZUZpbHRlcik7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXZtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBEYXRhRHVtcENhY2hlO1xuICAgICAgICAgICAgICAgIHZtLmRhdGFEdW1wU2hvd051bWJlciA9IG1heExpbmVzTnVtYmVyO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmkJzntKLkuI3lkIznmoTohJrmnKznu4Tku7bvvIzln7rnsbvkuI4gQ29tcG9uZW50IOS4jeWQjFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhc3luYyBzZWFyY2hTY3JpcHRJbml0KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVTZWxmOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBleHRlbmRzOiB2bS5jY1R5cGUsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAodm0uY2NUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygdm0uY2NUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5leHRlbmRzID0gW3ZtLmNjVHlwZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBEYXRhRHVtcENhY2hlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktY2xhc3NlcycsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIC8vIOWQjeensOaOkuW6j+S8mOWFiO+8jOWFtuasoeaYr+WGhemDqOWxgue6p++8jOacieWtkOmbhueahOaOkuWcqOWQjumdolxuICAgICAgICAgICAgICAgIERhdGFEdW1wQ2FjaGUuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXZtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBzb3J0U2NyaXB0RHVtcChEYXRhRHVtcENhY2hlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5pCc57SiXG4gICAgICAgICAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25TZWFyY2goZXZlbnQ6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlYXJjaFN0ciA9IGV2ZW50LnRhcmdldC52YWx1ZS50cmltKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodm0uc2VhcmNoID09PSBzZWFyY2hTdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNlYXJjaCA9IHNlYXJjaFN0cjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gRGF0YUR1bXBDYWNoZTtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2bS5zZWFyY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZyA9IG5ldyBSZWdFeHAodm0uc2VhcmNoLCAnaScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gRGF0YUR1bXBDYWNoZS5maWx0ZXIoKGFzc2V0OiBBc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXNNYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhc3NldC5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2ggPSBhc3NldC5uYW1lLnNlYXJjaChyZWcpICE9PSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01hdGNoICYmIGFzc2V0LnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYXRjaCA9IGFzc2V0LnBhdGguc2VhcmNoKHJlZykgIT09IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNNYXRjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHZtLnR5cGUgPT09ICdhZGQtY29tcG9uZW50Jykge1xuICAgICAgICAgICAgICAgICAgICB2bS5kYXRhRHVtcCA9IHNvcnRDb21wRHVtcChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2bS50eXBlID09PSAnc2NyaXB0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSBzb3J0U2NyaXB0RHVtcChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0uZGF0YUR1bXAgPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdm0uZGF0YUR1bXBTaG93TnVtYmVyID0gbWF4TGluZXNOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIHZtLiRyZWZzLmNvbnRhaW5lci5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6buY6K6k6YCJ5Lit56ys5LiA5LiqXG4gICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggJiYgdm0uc2VhcmNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDpnIDopoHnrYnlvoUgZGF0YUR1bXAg5Zyo55WM6Z2i5LiK5pu05paw5ZCO5omN6IO95p+l5om+5YiwIHNlbGVjdGVkRG9tXG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5zZWxlY3RlZCA9IHJlc3VsdFswXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0ZWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOaQnOe0ouaXtumUruebmOS6i+S7tlxuICAgICAgICAgICAgICog5LiL566t5aS0IOWIh+aNoiDpgInkuK3nrKzkuIDkuKrmkJzntKLnu5PmnpxcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2VhcmNoS2V5ZG93bihldmVudDogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LmJsdXIoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuZ2V0VmFsdWVzKCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0ZWQgPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0VmFsdWVzKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHZtLiRyZWZzWydtYWluJ10ucXVlcnlTZWxlY3RvckFsbCgnLmxpbmUnKTtcbiAgICAgICAgICAgICAgICBsaW5lcy5mb3JFYWNoKChsaW5lOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGxpbmUuZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSAmJiByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdXBEb3duU2VsZWN0KGk6IG51bWJlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IHZtLmdldFZhbHVlcygpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gdmFsdWVzLmluZGV4T2Yodm0uc2VsZWN0ZWQpICsgaTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHZhbHVlcy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZtLnNlbGVjdGVkID0gdmFsdWVzW2luZGV4XTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVudGVyU2VsZWN0KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSB2bS4kcmVmc1snbWFpbiddLnF1ZXJ5U2VsZWN0b3IoJy5saW5lW3ZhbHVlPVwiJyArIHZtLnNlbGVjdGVkICsgJ1wiXScpO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOehruiupOW6lOeUqOafkOmAiemhue+8iOWFs+mXrSBraXQg6Z2i5p2/77yJXG4gICAgICAgICAgICAgKiBAcGFyYW0gaWRcbiAgICAgICAgICAgICAqIEBwYXJhbSBpbmZvXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uU2VsZWN0KGlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2bS5zZWxlY3RlZCA9IGlkO1xuICAgICAgICAgICAgICAgIHZtLnNlYXJjaCA9ICcnO1xuXG4gICAgICAgICAgICAgICAgLy8g5pyJ55So5oi36YCJ5Lit6KGM5Li655qE5Y+W5raI5Zue6YCA6aKE6KeI55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgcmVjb3JkUHJldmlldy5tZXRob2QgPSAnJztcblxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtOiBhbnkgPSB0aGlzLiRlbDtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50KGVsZW0sICdjaGFuZ2UnLCB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50KGVsZW0sICdjb25maXJtJywge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaWQsXG4gICAgICAgICAgICAgICAgICAgIGluZm8sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdm0uY2xvc2VLaXQoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog6Zeq54OB5p+Q6LWE5rqQ5oiW6IqC54K5XG4gICAgICAgICAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0d2lua2xlKGRhdGE6IGFueSkge1xuICAgICAgICAgICAgICAgIGlmICh2bS50eXBlID09PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2Fzc2V0cycsICd0d2lua2xlJywgZGF0YS51dWlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZtLnR5cGUgPT09ICdub2RlJykge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdoaWVyYXJjaHknLCAndHdpbmtsZScsIGRhdGEudXVpZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2bS50eXBlID09PSAnY29tcG9uZW50Jykge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdoaWVyYXJjaHknLCAndHdpbmtsZScsIGRhdGEubm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNoZWNrQWxsb3dDcmVhdGUodHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsbG93Q3JlYXRlQXNzZXRUeXBlcy5pbmNsdWRlcyh0eXBlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFzeW5jIGNyZWF0ZUFzc2V0KCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5QYW5lbC5fX3Byb3RlY3RlZF9fLmhvbGRLaXQoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQtZGlhbG9nJywgdm0uY2NUeXBlKTtcbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0gJiYgdm0ub25TZWxlY3QodXVpZCwgaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdm0gJiYgdm0uY2xvc2VLaXQoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNsb3NlS2l0KCkge1xuICAgICAgICAgICAgICAgIHZtLmlzS2l0Q2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLl9fcHJvdGVjdGVkX18uY2xvc2VLaXQoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHByZXZpZXcobWV0aG9kOiBzdHJpbmcsIGlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgIGlmICghdm0gfHwgdm0uaXNLaXRDbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8ga2l0IOWFs+mXreWQjuS4jeWGjeinpuWPkSBwcmV2aWV3IOihjOS4ulxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVjb3JkUHJldmlldy5tZXRob2QgPSBtZXRob2Q7XG4gICAgICAgICAgICAgICAgcmVjb3JkUHJldmlldy5pZCA9IGlkO1xuICAgICAgICAgICAgICAgIHJlY29yZFByZXZpZXcuaW5mbyA9IGluZm87XG5cbiAgICAgICAgICAgICAgICBkaXNwYXRjaEV2ZW50KHZtLiRlbCwgJ3ByZXZpZXcnLCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgICAgICAgICBpbmZvLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlKCkgeyBcbiAgICBwYW5lbCA9IG51bGw7XG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBudWxsO1xufVxuXG5jb25zdCBpbWFnZUltcG9ydGVyID0gWydpbWFnZScsICd0ZXh0dXJlJywgJ3Nwcml0ZS1mcmFtZScsICdnbHRmLW1lc2gnXTtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0QXNzZXRJY29uSW5mbyhhc3NldDogYW55KSB7XG4gICAgY29uc3QgaWNvbkluZm86IEljb25JbmZvID0ge1xuICAgICAgICB0eXBlOiAnaWNvbicsXG4gICAgICAgIHZhbHVlOiAnZmlsZScsXG4gICAgfTtcbiAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgIHJldHVybiBpY29uSW5mbztcbiAgICB9XG4gICAgaWYgKGltYWdlSW1wb3J0ZXIuaW5jbHVkZXMoYXNzZXQuaW1wb3J0ZXIpKSB7XG4gICAgICAgIGlmICghYXNzZXQuc291cmNlICYmIGFzc2V0LmZhdGhlckluZm8pIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dE5hbWUgPSBleHRuYW1lKGFzc2V0LmZhdGhlckluZm8uc291cmNlKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgbGV0IHNyYyA9IGdldExpYnJhcnlJbWFnZVNyYyhhc3NldC5mYXRoZXJJbmZvLmxpYnJhcnksIGV4dE5hbWUpO1xuXG4gICAgICAgICAgICAvLyDmnInlj6/og73mmK8gZ2x0ZiDmlofku7bph4znmoTlm77niYdcbiAgICAgICAgICAgIGlmICghc3JjICYmIGFzc2V0LmltcG9ydGVyID09PSAndGV4dHVyZScpIHtcbiAgICAgICAgICAgICAgICAvLyB0ZXh0dXJlIOm7mOiupOWbvuagh1xuICAgICAgICAgICAgICAgIGljb25JbmZvLnZhbHVlID0gYXNzZXQuaW1wb3J0ZXI7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtbWV0YScsIGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghbWV0YSB8fCAhbWV0YS51c2VyRGF0YSB8fCAhbWV0YS51c2VyRGF0YS5pbWFnZVV1aWRPckRhdGFiYXNlVXJpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpY29uSW5mbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VBc3NldCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBtZXRhLnVzZXJEYXRhLmltYWdlVXVpZE9yRGF0YWJhc2VVcmkpO1xuICAgICAgICAgICAgICAgIGlmICghaW1hZ2VBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWNvbkluZm87XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZUV4dCA9IGV4dG5hbWUoaW1hZ2VBc3NldC5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHNyYyA9IGdldExpYnJhcnlJbWFnZVNyYyhpbWFnZUFzc2V0LmxpYnJhcnksIGZpbGVFeHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpY29uSW5mby52YWx1ZSA9IHNyYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4dE5hbWUgPSBleHRuYW1lKGFzc2V0LnNvdXJjZSk7XG4gICAgICAgICAgICBpY29uSW5mby52YWx1ZSA9IGFzc2V0LmxpYnJhcnlbZXh0TmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICBpY29uSW5mby50eXBlID0gJ2ltYWdlJztcbiAgICAgICAgcmV0dXJuIGljb25JbmZvO1xuICAgIH1cbiAgICBjb25zdCBuYW1lID0gYXNzZXQuaW1wb3J0ZXI7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgICAgaWNvbkluZm8udmFsdWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gaWNvbkluZm87XG4gICAgfVxuICAgIHJldHVybiBpY29uSW5mbztcbn1cblxuZnVuY3Rpb24gZ2V0TGlicmFyeUltYWdlU3JjKGxpYnJhcnk6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sIGZpbGVFeHQ6IHN0cmluZykge1xuICAgIGxldCBzcmMgPSBsaWJyYXJ5W2ZpbGVFeHRdO1xuICAgIGlmICghc3JjKSB7XG4gICAgICAgIGNvbnN0IGtleTogc3RyaW5nID0gT2JqZWN0LmtleXMobGlicmFyeSkuZmluZCgoa2V5KSA9PiBrZXkgIT09ICcuanNvbicpIHx8ICcnO1xuICAgICAgICBzcmMgPSBsaWJyYXJ5W2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHNyYztcbn1cblxuaW50ZXJmYWNlIE5vZGVGaWx0ZXJPcHRpb25zIHtcbiAgICBwYXRoUGF0dGVybj86IHN0cmluZzsgLy8g5Y+C6ICDIG1pbmltYXRjaCDot6/lvoTljLnphY3op4TliJlcbn1cblxuLyoqXG4gKiDmlbTnkIbmiYDmnInnmoToioLngrnkv6Hmga9cbiAqIEBwYXJhbSBkdW1wc1xuICogQHBhcmFtIHJlc3VsdFxuICogQHBhcmFtIGRpclxuICovXG5mdW5jdGlvbiBzb3J0Tm9kZUR1bXAoZHVtcHM6IGFueSwgb3B0aW9ucz86IE5vZGVGaWx0ZXJPcHRpb25zLCByZXN1bHQ6IEFzc2V0SW5mb1tdID0gW10pOiBBc3NldEluZm9bXSB7XG4gICAgaWYgKCFkdW1wcykge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBpZiAoZHVtcHMuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZHVtcHMuY2hpbGRyZW4uZm9yRWFjaCgoaW5mbzogYW55KSA9PiB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAob3B0aW9ucyAmJiBvcHRpb25zLnBhdGhQYXR0ZXJuICYmIG1pbmltYXRjaChpbmZvLnBhdGgsIG9wdGlvbnMucGF0aFBhdHRlcm4pKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IGluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBpbmZvLnR5cGUsXG4gICAgICAgICAgICAgICAgdXVpZDogaW5mby51dWlkLFxuICAgICAgICAgICAgICAgIHBhdGg6IGluZm8ucGF0aCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZm8uY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc29ydE5vZGVEdW1wKGluZm8sIG9wdGlvbnMsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICog5pW055CG5bim5pyJ5p+Q5Liq57G75Z6L57uE5Lu255qE6IqC54K55L+h5oGvXG4gKiBAcGFyYW0gZHVtcHNcbiAqIEBwYXJhbSBjY1R5cGVcbiAqIEBwYXJhbSByZXN1bHRcbiAqIEBwYXJhbSBkaXJcbiAqL1xuZnVuY3Rpb24gc29ydE5vZGVDb21wRHVtcChkdW1wczogYW55LCBjY1R5cGVzOiBzdHJpbmdbXSwgcmVzdWx0OiBhbnlbXSA9IFtdLCBkaXI/OiBzdHJpbmcpIHtcbiAgICBpZiAoIWR1bXBzKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGR1bXBzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGNjVHlwZSBvZiBjY1R5cGVzKSB7XG4gICAgICAgIGR1bXBzLmNoaWxkcmVuLmZvckVhY2goKG5vZGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IHBhdGggPSBkaXIgPyBkaXIgOiAnJztcbiAgICAgICAgICAgIHBhdGggKz0gYCAvICR7bm9kZS5uYW1lfWA7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmNvbXBvbmVudHMuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLnR5cGUgPT09IGNjVHlwZSk7XG5cbiAgICAgICAgICAgIGlmIChjb21wKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGNvbXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGljb25OYW1lOiBjY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGNjVHlwZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzb3J0Tm9kZUNvbXBEdW1wKG5vZGUsIFtjY1R5cGVdLCByZXN1bHQsIHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyDmlbTnkIbmiYDmnInnmoTnu4Tku7bkv6Hmga/vvIjmt7vliqDnu4Tku7bml7bvvIlcbmZ1bmN0aW9uIHNvcnRDb21wRHVtcChkdW1wczogYW55W10pIHtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9O1xuICAgIGZvciAoY29uc3QgZHVtcCBvZiBkdW1wcykge1xuICAgICAgICBpZiAoZHVtcC5wYXRoLnN0YXJ0c1dpdGgoJ2hpZGRlbjonKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXlBcnIgPSBkdW1wLnBhdGguc3BsaXQoJy8nKTtcbiAgICAgICAgbGV0IHNyY09iaiA9IHJlc3VsdDtcbiAgICAgICAga2V5QXJyLmZvckVhY2goKGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAvLyDnv7vor5FcbiAgICAgICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aCgnaTE4bjonKSkge1xuICAgICAgICAgICAgICAgIGtleSA9IEVkaXRvci5JMThuLnQoJ0VOR0lORS4nICsga2V5LnN1YnN0cig1KSkgfHwga2V5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IGtleUFyci5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgLy8g6Ieq5a6a5LmJ55qE6ISa5pys6LWE5rqQLCBrZXkg5pivIGNsYXNzTmFtZSDmnInlj6/og73ph43lpI3vvIzmiYDku6XmlLnnlKggY2lkXG4gICAgICAgICAgICAgICAgaWYgKGR1bXAuY2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IGR1bXAuY2lkO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNyY09ialtrZXldID0ge1xuICAgICAgICAgICAgICAgICAgICBpY29uTmFtZTogZHVtcC5uYW1lIHx8ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgICAgICAgICAuLi5kdW1wLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFzcmNPYmpba2V5XSkge1xuICAgICAgICAgICAgICAgIHNyY09ialtrZXldID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcmNPYmogPSBzcmNPYmpba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHNvcnRTY3JpcHREdW1wKGR1bXBzOiBhbnlbXSkge1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge307XG4gICAgZm9yIChjb25zdCBkdW1wIG9mIGR1bXBzKSB7XG4gICAgICAgIHJlc3VsdFtkdW1wLm5hbWVdID0ge1xuICAgICAgICAgICAgaWNvbk5hbWU6ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgLi4uZHVtcCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRFeHRlbmRzQ2xhc3MoY2NUeXBlOiBzdHJpbmcpIHtcbiAgICBpZiAoIWNjVHlwZSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgLy8gY2NDbGFzcyDpnIDopoHmn6Xor6IgY2NUeXBlIOWBmuS4uuWfuuexu+eahOe7p+aJv+WFs+ezu1xuICAgIGNvbnN0IGNjQ2xhc3NlcyA9IGNjVHlwZS5zcGxpdCgnLCcpO1xuICAgIGNvbnN0IGNjVHlwZXM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBjY0NsYXNzIG9mIGNjQ2xhc3Nlcykge1xuICAgICAgICBpZiAoIWNjQ2xhc3MpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWNsYXNzZXMnLCB7IGV4dGVuZHM6IGNjQ2xhc3MgfSk7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNsYXNzZXMpICYmIGNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNscyBvZiBjbGFzc2VzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjY1R5cGVzLmluY2x1ZGVzKGNscy5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjY1R5cGVzLnB1c2goY2xzLm5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjY1R5cGVzLmpvaW4oJywnKTtcbn1cbiJdfQ==