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
exports.close = exports.ready = exports.$ = exports.template = exports.style = exports.defaultCustomData = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const panelData = __importStar(require("./components/panel-data"));
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
const builtinData = [
    {
        name: 'i18n:node-library.groups.renderer',
        items: [
            {
                name: 'Sprite',
                assetUuid: '9db8cd0b-cbe4-42e7-96a9-a239620c0a9d',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/sprite.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'SpriteSplash',
                assetUuid: 'e5f21aad-3a69-4011-ac62-b74352ac025e',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/sprite.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Label',
                assetUuid: '36008810-7ad3-47c0-8112-e30aee089e45',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/label.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'RichText',
                assetUuid: 'fc6bfcfa-8086-4326-809b-0ba1226bac7d',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/richtext.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'ParticleSystem2D',
                assetUuid: 'f396261e-3e06-41ec-bdd6-9a8b6d99026f',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/particlesystem.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'TiledMap',
                assetUuid: '3139fa4f-8c42-4ce6-98be-15e848d9734c',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/tiledmap.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
        ],
    },
    {
        name: 'i18n:node-library.groups.ui',
        items: [
            {
                name: 'Canvas',
                assetUuid: 'f773db21-62b8-4540-956a-29bacf5ddbf5',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/canvas.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Button',
                assetUuid: '90bdd2a9-2838-4888-b66c-e94c8b7a5169',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/button.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Layout',
                assetUuid: 'a9ef7dfc-ea8b-4cf8-918e-36da948c4de0',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/layout.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'ScrollView',
                assetUuid: 'c1baa707-78d6-4b89-8d5d-0b7fdf0c39bc',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/scrollview.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'ProgressBar',
                assetUuid: '0d9353c4-6fb9-49bb-bc62-77f1750078c2',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/progressbar.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'EditBox',
                assetUuid: '05e79121-8675-4551-9ad7-1b901a4025db',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/editbox.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Slider',
                assetUuid: '2bd7e5b6-cd8c-41a1-8136-ddb8efbf6326',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/slider.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Toggle',
                assetUuid: '0e89afe7-56de-4f99-96a1-cba8a75bedd2',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/toggle.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'ToggleGroup',
                assetUuid: '2af73429-41d1-4346-9062-7798e42945dd',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/togglegroup.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Widget',
                assetUuid: '36ed4422-3542-4cc4-bf02-dc4bfc590836',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/default.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'Mask',
                assetUuid: '7fa63aed-f3e2-46a5-8a7c-c1a1adf6cea6',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/default.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'VideoPlayer',
                assetUuid: '7e089eaf-fa97-40d7-8a20-741a152585df',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/videoplayer.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
            {
                name: 'WebView',
                assetUuid: '9c541fa2-1dc8-4d8b-813a-aec89133f5b1',
                type: 'cc.Prefab',
                icon: 'packages://node-library/static/images/ui-prefab/webview.png',
                canvasRequired: true,
                unlinkPrefab: true,
            },
        ],
    },
];
builtinData.forEach((group) => {
    group.items.sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
});
const vueTemplate = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../static', '/template/index.html'), 'utf8');
exports.defaultCustomData = [
    {
        name: 'i18n:node-library.groups.custom',
        items: [],
    },
];
const NodeLibraryPanelVM = Vue.extend({
    components: {
        groups: require('./components/groups'),
    },
    data() {
        return {
            ready: false,
            tabs: ['builtin', 'custom'],
            active: 'builtin',
            builtinData: builtinData,
            customData: exports.defaultCustomData,
            extensions: [],
        };
    },
    async mounted() {
        const customData = (await Editor.Profile.getConfig('node-library', 'custom')) || exports.defaultCustomData;
        this.customData = customData;
        this.customData[0].items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        this.ready = true;
    },
    methods: {
        /**
         * drop 到面板空白区域里
         */
        drop(event) {
            // @ts-ignore
            if (!event.currentTarget.hoving) {
                return;
            }
            const data = JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)) || {};
            if (data && Array.isArray(data.additional)) {
                data.additional.forEach((item) => {
                    // 已存在的跳过
                    const exist = this.customData[0].items.findIndex((existItem) => existItem.assetUuid === item.value) !== -1;
                    if (exist || !item.name) {
                        return;
                    }
                    const name = item.name.substr(0, item.name.lastIndexOf('.'));
                    Object.assign(item, {
                        name,
                        assetUuid: item.value,
                        icon: 'packages://node-library/static/images/ui-prefab/default.png',
                        unlinkPrefab: true,
                    });
                    // 目前只有一组
                    this.customData[0].items.push(item);
                });
                this.customData[0].items.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                Editor.Profile.setConfig('node-library', 'custom', this.customData);
            }
        },
    },
    template: vueTemplate,
});
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../dist/index.css'), 'utf8');
exports.template = '<div class="container"></div>';
exports.$ = {
    container: '.container',
};
/**
 * 面板 ready
 */
async function ready() {
    // @ts-ignore
    panel = this;
    vm?.$destroy();
    vm = new NodeLibraryPanelVM();
    vm.$mount(panel.$.container);
    // 识别外部扩展
    panelData.config.vm = vm;
    panelData.config.panel = panel;
    const pkgs = Editor.Package.getPackages({ enable: true });
    pkgs.forEach(panelData.extension.attach);
    Editor.Package.__protected__.on('enable', panelData.extension.attach);
    Editor.Package.__protected__.on('disable', panelData.extension.detach);
}
exports.ready = ready;
/**
 * 面板 close
 */
function close() {
    vm?.$destroy();
    vm = null;
    panel = null;
    delete panelData.config.panel;
    delete panelData.config.vm;
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUliLDJCQUFrQztBQUNsQywrQkFBNEI7QUFDNUIsbUVBQXFEO0FBR3JELE1BQU0sR0FBRyxHQUFtQixPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDakMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBRTVCLElBQUksS0FBSyxHQUFRLElBQUksQ0FBQztBQUN0QixJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFFbkIsTUFBTSxXQUFXLEdBQXVCO0lBQ3BDO1FBQ0ksSUFBSSxFQUFFLG1DQUFtQztRQUN6QyxLQUFLLEVBQUU7WUFDSDtnQkFDSSxJQUFJLEVBQUUsUUFBUTtnQkFDZCxTQUFTLEVBQUUsc0NBQXNDO2dCQUNqRCxJQUFJLEVBQUUsV0FBVztnQkFDakIsSUFBSSxFQUFFLDREQUE0RDtnQkFDbEUsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxJQUFJO2FBQ3JCO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFNBQVMsRUFBRSxzQ0FBc0M7Z0JBQ2pELElBQUksRUFBRSxXQUFXO2dCQUNqQixJQUFJLEVBQUUsNERBQTREO2dCQUNsRSxjQUFjLEVBQUUsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLElBQUk7YUFDckI7WUFDRDtnQkFDSSxJQUFJLEVBQUUsT0FBTztnQkFDYixTQUFTLEVBQUUsc0NBQXNDO2dCQUNqRCxJQUFJLEVBQUUsV0FBVztnQkFDakIsSUFBSSxFQUFFLDJEQUEyRDtnQkFDakUsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxJQUFJO2FBQ3JCO1lBQ0Q7Z0JBQ0ksSUFB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QUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBZkQsc0JBZUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLEtBQUs7SUFDakIsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQ2YsRUFBRSxHQUFHLElBQUksQ0FBQztJQUNWLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDYixPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQzlCLE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQU5ELHNCQU1DIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBOb2RlTGlicmFyeUdyb3VwLCBOb2RlTGlicmFyeUl0ZW0gfSBmcm9tICcuLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHBhbmVsRGF0YSBmcm9tICcuL2NvbXBvbmVudHMvcGFuZWwtZGF0YSc7XG5cbmltcG9ydCB0eXBlIHsgVnVlQ29uc3RydWN0b3IgfSBmcm9tICd2dWUnO1xuY29uc3QgVnVlOiBWdWVDb25zdHJ1Y3RvciA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmxldCBwYW5lbDogYW55ID0gbnVsbDtcbmxldCB2bTogYW55ID0gbnVsbDtcblxuY29uc3QgYnVpbHRpbkRhdGE6IE5vZGVMaWJyYXJ5R3JvdXBbXSA9IFtcbiAgICB7XG4gICAgICAgIG5hbWU6ICdpMThuOm5vZGUtbGlicmFyeS5ncm91cHMucmVuZGVyZXInLFxuICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdTcHJpdGUnLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzlkYjhjZDBiLWNiZTQtNDJlNy05NmE5LWEyMzk2MjBjMGE5ZCcsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL3Nwcml0ZS5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1Nwcml0ZVNwbGFzaCcsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnZTVmMjFhYWQtM2E2OS00MDExLWFjNjItYjc0MzUyYWMwMjVlJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvc3ByaXRlLnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnTGFiZWwnLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzM2MDA4ODEwLTdhZDMtNDdjMC04MTEyLWUzMGFlZTA4OWU0NScsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL2xhYmVsLnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnUmljaFRleHQnLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJ2ZjNmJmY2ZhLTgwODYtNDMyNi04MDliLTBiYTEyMjZiYWM3ZCcsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL3JpY2h0ZXh0LnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnUGFydGljbGVTeXN0ZW0yRCcsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnZjM5NjI2MWUtM2UwNi00MWVjLWJkZDYtOWE4YjZkOTkwMjZmJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvcGFydGljbGVzeXN0ZW0ucG5nJyxcbiAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdUaWxlZE1hcCcsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnMzEzOWZhNGYtOGM0Mi00Y2U2LTk4YmUtMTVlODQ4ZDk3MzRjJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvdGlsZWRtYXAucG5nJyxcbiAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBuYW1lOiAnaTE4bjpub2RlLWxpYnJhcnkuZ3JvdXBzLnVpJyxcbiAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnQ2FudmFzJyxcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6ICdmNzczZGIyMS02MmI4LTQ1NDAtOTU2YS0yOWJhY2Y1ZGRiZjUnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5QcmVmYWInLFxuICAgICAgICAgICAgICAgIGljb246ICdwYWNrYWdlczovL25vZGUtbGlicmFyeS9zdGF0aWMvaW1hZ2VzL3VpLXByZWZhYi9jYW52YXMucG5nJyxcbiAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdCdXR0b24nLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzkwYmRkMmE5LTI4MzgtNDg4OC1iNjZjLWU5NGM4YjdhNTE2OScsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL2J1dHRvbi5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0xheW91dCcsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnYTllZjdkZmMtZWE4Yi00Y2Y4LTkxOGUtMzZkYTk0OGM0ZGUwJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvbGF5b3V0LnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnU2Nyb2xsVmlldycsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnYzFiYWE3MDctNzhkNi00Yjg5LThkNWQtMGI3ZmRmMGMzOWJjJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvc2Nyb2xsdmlldy5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1Byb2dyZXNzQmFyJyxcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6ICcwZDkzNTNjNC02ZmI5LTQ5YmItYmM2Mi03N2YxNzUwMDc4YzInLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5QcmVmYWInLFxuICAgICAgICAgICAgICAgIGljb246ICdwYWNrYWdlczovL25vZGUtbGlicmFyeS9zdGF0aWMvaW1hZ2VzL3VpLXByZWZhYi9wcm9ncmVzc2Jhci5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0VkaXRCb3gnLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzA1ZTc5MTIxLTg2NzUtNDU1MS05YWQ3LTFiOTAxYTQwMjVkYicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL2VkaXRib3gucG5nJyxcbiAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdTbGlkZXInLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzJiZDdlNWI2LWNkOGMtNDFhMS04MTM2LWRkYjhlZmJmNjMyNicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL3NsaWRlci5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1RvZ2dsZScsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnMGU4OWFmZTctNTZkZS00Zjk5LTk2YTEtY2JhOGE3NWJlZGQyJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvdG9nZ2xlLnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnVG9nZ2xlR3JvdXAnLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzJhZjczNDI5LTQxZDEtNDM0Ni05MDYyLTc3OThlNDI5NDVkZCcsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL3RvZ2dsZWdyb3VwLnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnV2lkZ2V0JyxcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6ICczNmVkNDQyMi0zNTQyLTRjYzQtYmYwMi1kYzRiZmM1OTA4MzYnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5QcmVmYWInLFxuICAgICAgICAgICAgICAgIGljb246ICdwYWNrYWdlczovL25vZGUtbGlicmFyeS9zdGF0aWMvaW1hZ2VzL3VpLXByZWZhYi9kZWZhdWx0LnBuZycsXG4gICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnTWFzaycsXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiAnN2ZhNjNhZWQtZjNlMi00NmE1LThhN2MtYzFhMWFkZjZjZWE2JyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpY29uOiAncGFja2FnZXM6Ly9ub2RlLWxpYnJhcnkvc3RhdGljL2ltYWdlcy91aS1wcmVmYWIvZGVmYXVsdC5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1ZpZGVvUGxheWVyJyxcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6ICc3ZTA4OWVhZi1mYTk3LTQwZDctOGEyMC03NDFhMTUyNTg1ZGYnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5QcmVmYWInLFxuICAgICAgICAgICAgICAgIGljb246ICdwYWNrYWdlczovL25vZGUtbGlicmFyeS9zdGF0aWMvaW1hZ2VzL3VpLXByZWZhYi92aWRlb3BsYXllci5wbmcnLFxuICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1dlYlZpZXcnLFxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogJzljNTQxZmEyLTFkYzgtNGQ4Yi04MTNhLWFlYzg5MTMzZjViMScsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLlByZWZhYicsXG4gICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL3dlYnZpZXcucG5nJyxcbiAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG5dO1xuXG5idWlsdGluRGF0YS5mb3JFYWNoKChncm91cDogTm9kZUxpYnJhcnlHcm91cCkgPT4ge1xuICAgIGdyb3VwLml0ZW1zLnNvcnQoKGE6IE5vZGVMaWJyYXJ5SXRlbSwgYjogTm9kZUxpYnJhcnlJdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgIH0pO1xufSk7XG5cbmNvbnN0IHZ1ZVRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vc3RhdGljJywgJy90ZW1wbGF0ZS9pbmRleC5odG1sJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0Q3VzdG9tRGF0YTogTm9kZUxpYnJhcnlHcm91cFtdID0gW1xuICAgIHtcbiAgICAgICAgbmFtZTogJ2kxOG46bm9kZS1saWJyYXJ5Lmdyb3Vwcy5jdXN0b20nLFxuICAgICAgICBpdGVtczogW10sXG4gICAgfSxcbl07XG5cbmNvbnN0IE5vZGVMaWJyYXJ5UGFuZWxWTSA9IFZ1ZS5leHRlbmQoe1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgZ3JvdXBzOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvZ3JvdXBzJyksXG4gICAgfSxcbiAgICBkYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVhZHk6IGZhbHNlLFxuICAgICAgICAgICAgdGFiczogWydidWlsdGluJywgJ2N1c3RvbSddLFxuICAgICAgICAgICAgYWN0aXZlOiAnYnVpbHRpbicsXG4gICAgICAgICAgICBidWlsdGluRGF0YTogYnVpbHRpbkRhdGEsXG4gICAgICAgICAgICBjdXN0b21EYXRhOiBkZWZhdWx0Q3VzdG9tRGF0YSxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtdLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgYXN5bmMgbW91bnRlZCgpe1xuICAgICAgICBjb25zdCBjdXN0b21EYXRhID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygnbm9kZS1saWJyYXJ5JywgJ2N1c3RvbScpKSB8fCBkZWZhdWx0Q3VzdG9tRGF0YTtcbiAgICAgICAgdGhpcy5jdXN0b21EYXRhID0gY3VzdG9tRGF0YTtcbiAgICAgICAgdGhpcy5jdXN0b21EYXRhWzBdLml0ZW1zLnNvcnQoKGE6IE5vZGVMaWJyYXJ5SXRlbSwgYjogTm9kZUxpYnJhcnlJdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVhZHkgPSB0cnVlO1xuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICAvKipcbiAgICAgICAgICogZHJvcCDliLDpnaLmnb/nqbrnmb3ljLrln5/ph4xcbiAgICAgICAgICovXG4gICAgICAgIGRyb3AoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKCFldmVudC5jdXJyZW50VGFyZ2V0LmhvdmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoRWRpdG9yLlVJLl9fcHJvdGVjdGVkX18uRHJhZ0FyZWEuY3VycmVudERyYWdJbmZvKSkgfHwge307XG5cbiAgICAgICAgICAgIGlmIChkYXRhICYmIEFycmF5LmlzQXJyYXkoZGF0YS5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIGRhdGEuYWRkaXRpb25hbC5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bey5a2Y5Zyo55qE6Lez6L+HXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0ID0gdGhpcy5jdXN0b21EYXRhWzBdLml0ZW1zLmZpbmRJbmRleCgoZXhpc3RJdGVtOiBhbnkpID0+IGV4aXN0SXRlbS5hc3NldFV1aWQgPT09IGl0ZW0udmFsdWUpICE9PSAtMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0IHx8ICFpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLm5hbWUuc3Vic3RyKDAsIGl0ZW0ubmFtZS5sYXN0SW5kZXhPZignLicpKTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihpdGVtLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBpdGVtLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbjogJ3BhY2thZ2VzOi8vbm9kZS1saWJyYXJ5L3N0YXRpYy9pbWFnZXMvdWktcHJlZmFiL2RlZmF1bHQucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g55uu5YmN5Y+q5pyJ5LiA57uEXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRGF0YVswXS5pdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21EYXRhWzBdLml0ZW1zLnNvcnQoKGE6IE5vZGVMaWJyYXJ5SXRlbSwgYjogTm9kZUxpYnJhcnlJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgRWRpdG9yLlByb2ZpbGUuc2V0Q29uZmlnKCdub2RlLWxpYnJhcnknLCAnY3VzdG9tJywgdGhpcy5jdXN0b21EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiB2dWVUZW1wbGF0ZSxcbn0pO1xuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2luZGV4LmNzcycpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPjwvZGl2Pic7XG5cbmV4cG9ydCBjb25zdCAkID0ge1xuICAgIGNvbnRhaW5lcjogJy5jb250YWluZXInLFxufTtcblxuLyoqXG4gKiDpnaLmnb8gcmVhZHlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwYW5lbCA9IHRoaXM7XG5cbiAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG5ldyBOb2RlTGlicmFyeVBhbmVsVk0oKTtcbiAgICB2bS4kbW91bnQocGFuZWwuJC5jb250YWluZXIpO1xuICAgIFxuICAgIC8vIOivhuWIq+WklumDqOaJqeWxlVxuICAgIHBhbmVsRGF0YS5jb25maWcudm0gPSB2bTtcbiAgICBwYW5lbERhdGEuY29uZmlnLnBhbmVsID0gcGFuZWw7XG4gICAgY29uc3QgcGtncyA9IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKHsgZW5hYmxlOiB0cnVlIH0pO1xuICAgIHBrZ3MuZm9yRWFjaChwYW5lbERhdGEuZXh0ZW5zaW9uLmF0dGFjaCk7XG4gICAgRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5vbignZW5hYmxlJywgcGFuZWxEYXRhLmV4dGVuc2lvbi5hdHRhY2gpO1xuICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2Rpc2FibGUnLCBwYW5lbERhdGEuZXh0ZW5zaW9uLmRldGFjaCk7XG59XG5cbi8qKlxuICog6Z2i5p2/IGNsb3NlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG51bGw7XG4gICAgcGFuZWwgPSBudWxsO1xuICAgIGRlbGV0ZSBwYW5lbERhdGEuY29uZmlnLnBhbmVsO1xuICAgIGRlbGV0ZSBwYW5lbERhdGEuY29uZmlnLnZtO1xufVxuIl19