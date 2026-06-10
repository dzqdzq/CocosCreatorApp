var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, t, i = t) => {
        var n = Object.getOwnPropertyDescriptor(a, t);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : a.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return a[t];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, a, t, i) => {
        e[(i = i === undefined ? t : i)] = a[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, a) => {
        Object.defineProperty(e, "default", { enumerable: true, value: a });
      }
    : (e, a) => {
        e.default = a;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var a;
          var t = [];
          for (a in e) {
            if (Object.prototype.hasOwnProperty.call(e, a)) {
              t[t.length] = a;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var a = {};
      if (e != null) {
        for (var t = n(e), i = 0; i < t.length; i++) {
          if (t[i] !== "default") {
            __createBinding(a, e, t[i]);
          }
        }
      }
      __setModuleDefault(a, e);
      return a;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.defaultCustomData = undefined;

exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const panelData = __importStar(require("./components/panel-data"));
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;

const builtinData = [
  {
    name: "i18n:node-library.groups.renderer",
    items: [
      {
        name: "Sprite",
        assetUuid: "9db8cd0b-cbe4-42e7-96a9-a239620c0a9d",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/sprite.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "SpriteSplash",
        assetUuid: "e5f21aad-3a69-4011-ac62-b74352ac025e",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/sprite.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Label",
        assetUuid: "36008810-7ad3-47c0-8112-e30aee089e45",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/label.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "RichText",
        assetUuid: "fc6bfcfa-8086-4326-809b-0ba1226bac7d",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/richtext.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "ParticleSystem2D",
        assetUuid: "f396261e-3e06-41ec-bdd6-9a8b6d99026f",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/particlesystem.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "TiledMap",
        assetUuid: "3139fa4f-8c42-4ce6-98be-15e848d9734c",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/tiledmap.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
    ],
  },
  {
    name: "i18n:node-library.groups.ui",
    items: [
      {
        name: "Canvas",
        assetUuid: "f773db21-62b8-4540-956a-29bacf5ddbf5",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/canvas.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Button",
        assetUuid: "90bdd2a9-2838-4888-b66c-e94c8b7a5169",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/button.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Layout",
        assetUuid: "a9ef7dfc-ea8b-4cf8-918e-36da948c4de0",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/layout.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "ScrollView",
        assetUuid: "c1baa707-78d6-4b89-8d5d-0b7fdf0c39bc",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/scrollview.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "ProgressBar",
        assetUuid: "0d9353c4-6fb9-49bb-bc62-77f1750078c2",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/progressbar.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "EditBox",
        assetUuid: "05e79121-8675-4551-9ad7-1b901a4025db",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/editbox.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Slider",
        assetUuid: "2bd7e5b6-cd8c-41a1-8136-ddb8efbf6326",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/slider.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Toggle",
        assetUuid: "0e89afe7-56de-4f99-96a1-cba8a75bedd2",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/toggle.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "ToggleGroup",
        assetUuid: "2af73429-41d1-4346-9062-7798e42945dd",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/togglegroup.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Widget",
        assetUuid: "36ed4422-3542-4cc4-bf02-dc4bfc590836",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/default.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "Mask",
        assetUuid: "7fa63aed-f3e2-46a5-8a7c-c1a1adf6cea6",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/default.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "VideoPlayer",
        assetUuid: "7e089eaf-fa97-40d7-8a20-741a152585df",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/videoplayer.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
      {
        name: "WebView",
        assetUuid: "9c541fa2-1dc8-4d8b-813a-aec89133f5b1",
        type: "cc.Prefab",
        icon: "packages://node-library/static/images/ui-prefab/webview.png",
        canvasRequired: true,
        unlinkPrefab: true,
      },
    ],
  },
];

builtinData.forEach((e) => {
  e.items.sort((e, a) => e.name.localeCompare(a.name));
});

const vueTemplate = readFileSync(
  join(__dirname, "../static", "/template/index.html"),
  "utf8"
);

exports.defaultCustomData = [
  { name: "i18n:node-library.groups.custom", items: [] },
];

const NodeLibraryPanelVM = Vue.extend({
  components: { groups: require("./components/groups") },
  data() {
    return {
      ready: false,
      tabs: ["builtin", "custom"],
      active: "builtin",
      builtinData,
      customData: exports.defaultCustomData,
      extensions: [],
    };
  },
  async mounted() {
    var e =
      (await Editor.Profile.getConfig("node-library", "custom")) ||
      exports.defaultCustomData;
    this.customData = e;

    this.customData[0].items.sort((e, a) => e.name.localeCompare(a.name));

    this.ready = true;
  },
  methods: {
    drop(e) {
      if (
        e.currentTarget.hoving &&
        (e =
          JSON.parse(
            JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
          ) || {}) &&
        Array.isArray(e.additional)
      ) {
        e.additional.forEach((a) => {
          var e;

          if (
            -1 ===
              this.customData[0].items.findIndex(
                (e) => e.assetUuid === a.value
              ) &&
            a.name
          ) {
            e = a.name.substr(0, a.name.lastIndexOf("."));

            Object.assign(a, {
              name: e,
              assetUuid: a.value,
              icon: "packages://node-library/static/images/ui-prefab/default.png",
              unlinkPrefab: true,
            });

            this.customData[0].items.push(a);
          }
        });

        this.customData[0].items.sort((e, a) => e.name.localeCompare(a.name));

        Editor.Profile.setConfig("node-library", "custom", this.customData);
      }
    },
  },
  template: vueTemplate,
});

async function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new NodeLibraryPanelVM()).$mount(panel.$.container);
  panelData.config.vm = vm;
  panelData.config.panel = panel;

  Editor.Package.getPackages({ enable: true }).forEach(
    panelData.extension.attach
  );

  Editor.Package.__protected__.on("enable", panelData.extension.attach);
  Editor.Package.__protected__.on("disable", panelData.extension.detach);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
  delete panelData.config.panel;
  delete panelData.config.vm;
}

exports.style = readFileSync(join(__dirname, "../dist/index.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
