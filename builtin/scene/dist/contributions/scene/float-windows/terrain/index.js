var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, n);
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.default = undefined;
exports.template = undefined;
exports.height = undefined;
exports.width = undefined;
exports.type = undefined;

exports.ready = ready;
exports.close = close;
exports.update = update;
exports.send = send;

const { join } = require("path");

const { readFileSync } = require("fs");

const terrain_1 = __importDefault(require("../../public/terrain"));
const texture_1 = require("./texture");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
let cacheInfoForReset = {};

const Listeners = {
  mode(e) {
    if (vm) {
      switch (e) {
        case 0: {
          vm.mode = 0;
          break;
        }
        case 1:
        case 2:
        case 3:
        case 6:
        case 7: {
          vm.sculpt.mode = e;
          vm.mode = 1;
          break;
        }
        case 4: {
          vm.mode = 2;
          break;
        }
        default: {
          vm.mode = 3;
        }
      }
    }
  },
  apply_layers(r) {
    if (Array.isArray(r) && vm && ((vm.layers = []), r.length > 0)) {
      for (let t = 0; t <= layerLength; t++) {
        let e = null;

        if (r[t] && r[t].detailMap) {
          e = {
            uuid: r[t].detailMap,
            tileSize: r[t].tileSize,
            normalMap: r[t].normalMap || "",
            metallic: r[t].metallic,
            roughness: r[t].roughness,
          };
        }

        vm.layers.push(e);
      }
    }
  },
  layer(e) {
    if (vm) {
      vm.$emit("select-layer", e);
    }
  },
  component(e) {
    if (panel) {
      if (e && e.value._asset.value.uuid) {
        panel.hidden = false;
      } else {
        panel.hidden = true;
      }
    }
  },
  info(e) {
    if (e && vm) {
      cacheInfoForReset = e;
      vm.info.tileSize = e.tileSize;
      vm.info.weightMapSize = e.weightMapSize;
      vm.info.lightMapSize = e.lightMapSize;
      vm.info.blockCount[0] = e.blockCount[0];
      vm.info.blockCount[1] = e.blockCount[1];
    }
  },
  sculpt(e) {
    if (e && vm) {
      vm.sculpt.radius = e.radius;
      vm.sculpt.strength = e.strength;
      vm.sculpt._setHeight = e._setHeight;
    }
  },
  sculpt_brush(e, t) {
    if (
      vm &&
      (e !== vm.sculpt.currBrush &&
        ((vm.sculpt.currBrush = e), vm.setSculptBrush(e)),
      t !== vm.sculpt.rotation)
    ) {
      vm.sculpt.rotation = t;
      vm.setSculptBrushRotation(t);
    }
  },
  paint_brush(e) {
    if (vm && e !== vm.paint.currBrush) {
      vm.paint.currBrush = e;
      vm.setPaintBrush(e);
    }
  },
  paint(e) {
    if (vm && e) {
      vm.paint.radius = e.radius;
      vm.paint.strength = e.strength;
      vm.paint.falloff = e.falloff;
    }
  },
  onNodeRemove(e) {
    terrain_1.default.removeConfigByNodeID(e);
  },
};

exports.type = "cc.Terrain";
const layerLength = 4;
exports.width = 250;
exports.height = 300;

const vueTemplate = readFileSync(join(__dirname, "./index.html"), "utf-8");

const SceneTerrainVM = Vue.extend({
  name: "SceneTerrainVM",
  components: { texture: texture_1.Texture },
  data() {
    return {
      mode:
        terrain_1.default.mode < 1
          ? 0
          : terrain_1.default.mode < 4
          ? 1
          : terrain_1.default.mode < 5
          ? 2
          : 3,
      info: {
        tileSize: 0,
        weightMapSize: 0,
        lightMapSize: 0,
        blockCount: [0, 0],
        isChanged: false,
      },
      sculpt: {
        radius: 0,
        strength: 0,
        _setHeight: 0,
        mode: 1,
        brushes: [],
        currBrush: "",
        rotation: 0,
      },
      paint: {
        radius: 0,
        strength: 0,
        falloff: 0,
        brushes: [],
        currBrush: "",
        paintNorMap: "",
      },
      select: 0,
      layers: [],
      block: { index: { x: 0, y: 0 }, weight: "", layers: [] },
    };
  },
  watch: {
    mode(e) {
      if (e === 3) {
        send({ action: "block-update" });
      }
    },
  },
  methods: {
    changeToolMode(e) {
      switch ((e -= 0)) {
        case 0: {
          terrain_1.default.changeMode(0);
          break;
        }
        case 1: {
          terrain_1.default.changeMode(vm.sculpt.mode);
          break;
        }
        case 2: {
          terrain_1.default.changeMode(4);
          break;
        }
        case 3: {
          terrain_1.default.changeMode(5);
        }
      }
    },
    changeLayer(e) {
      terrain_1.default.changeLayer(e);
    },
    setLayerTileSize(e) {
      var t = this.select;
      terrain_1.default.setLayer(t, undefined, { tileSize: e });
    },
    setLayerMetallic(e) {
      var t = this.select;
      terrain_1.default.setLayer(t, undefined, { metallic: e });
    },
    setLayerRoughness(e) {
      var t = this.select;
      terrain_1.default.setLayer(t, undefined, { roughness: e });
    },
    setLayerTexture(e) {
      var t = this.select;
      terrain_1.default.setLayer(t, e, undefined);
    },
    setLayerNormalMap(e) {
      var t = this.select;
      terrain_1.default.setLayer(t, undefined, { normalMap: e });
    },
    setSculptBrush(e) {
      terrain_1.default.setSculptBrush(e);
    },
    setSculptBrushRotation(e) {
      terrain_1.default.setSculptBrushRotation(Number(e));
    },
    setPaintBrush(e) {
      terrain_1.default.setPaintBrush(e);
    },
    createLayer() {
      if (vm.validLayerCount() < layerLength) {
        terrain_1.default.createLayer().then((e) => {
          if (-1 !== e) {
            terrain_1.default.changeLayer(e);
          }
        });
      }
    },
    removeLayer(e) {
      terrain_1.default.removeLayer(e);
    },
    changeInfo() {
      if (!vm.info.isChanged) {
        vm.info.isChanged = true;
      }
    },
    resetInfos() {
      Listeners.info(cacheInfoForReset);
      vm.info.isChanged = false;
    },
    applyInfos() {
      terrain_1.default.changeInfo(vm.info);
      vm.info.isChanged = false;
    },
    changeSculpt(e, t) {
      terrain_1.default.changeSculpt(e, t);
    },
    changeSculptMode(e) {
      vm.sculpt.mode = e;
      terrain_1.default.changeSculptMode(e);
    },
    changePaint(e, t) {
      terrain_1.default.changePaint(e, t);
    },
    validLayerCount() {
      let t = 0;
      for (let e = 0; e < vm.layers.length; e++) {
        if (vm.layers[e] !== null) {
          t++;
        }
      }
      return t;
    },
    async _onLayerDrop(t) {
      var e = this.$refs.area;
      if (
        e &&
        !e.hasAttribute("hoving") &&
        !(this.validLayerCount() >= layerLength)
      ) {
        let e = t.dataTransfer.getData("value");

        if (e) {
          /@/.test(e) || (e += "@6c48a");
          terrain_1.default.createLayer(e);
        }
      }
    },
  },
  template: vueTemplate,
});

function ready(e, t, r) {
  panel = e;
  panel.hidden = true;

  if (t.nodes.length > 1) {
    close();
  } else {
    t = e.querySelector(".scene-terrain");
    vm?.$destroy();
    (vm = new SceneTerrainVM()).$mount(t);

    vm.$on("select-layer", (e) => {
      vm.select = e;
      vm.changeLayer(Number(e));
    });

    Editor.Message.__protected__.addBroadcastListener(
      "scene:remove-node",
      Listeners.onNodeRemove
    );

    terrain_1.default.on("mode-changed", Listeners.mode);
    terrain_1.default.on("component-changed", Listeners.component);
    terrain_1.default.on("info-changed", Listeners.info);
    terrain_1.default.on("sculpt-changed", Listeners.sculpt);
    terrain_1.default.on("paint-changed", Listeners.paint);
    terrain_1.default.on("layer_change", Listeners.layer);
    terrain_1.default.on("sculpt-brush-changed", Listeners.sculpt_brush);
    terrain_1.default.on("paint-brush-changed", Listeners.paint_brush);
    terrain_1.default.on("apply-layers", Listeners.apply_layers);

    terrain_1.default.component &&
      Listeners.component(terrain_1.default.component);

    terrain_1.default.layerDatas &&
      Listeners.apply_layers(terrain_1.default.layerDatas);

    terrain_1.default.info && Listeners.info(terrain_1.default.info);
    terrain_1.default.sculpt && Listeners.sculpt(terrain_1.default.sculpt);
    terrain_1.default.paint && Listeners.paint(terrain_1.default.paint);

    Listeners.sculpt_brush(
      terrain_1.default.sculpt_brush,
      terrain_1.default.sculpt_brush_rotate
    );

    terrain_1.default.paint_brush &&
      Listeners.paint_brush(terrain_1.default.paint_brush);

    Listeners.layer(terrain_1.default.getCurrLayer());
  }
}
function close() {
  Editor.Message.__protected__.removeBroadcastListener(
    "scene:remove-node",
    Listeners.onNodeRemove
  );

  terrain_1.default.off("mode-changed", Listeners.mode);
  terrain_1.default.off("component-changed", Listeners.component);
  terrain_1.default.off("info-changed", Listeners.info);
  terrain_1.default.off("sculpt-changed", Listeners.sculpt);
  terrain_1.default.off("paint-changed", Listeners.paint);
  terrain_1.default.off("layer_change", Listeners.layer);
  terrain_1.default.off("sculpt-brush-changed", Listeners.sculpt_brush);
  terrain_1.default.off("paint-brush-changed", Listeners.paint_brush);
  terrain_1.default.off("apply-layers", Listeners.apply_layers);
  terrain_1.default.close();
  vm?.$destroy();
  vm = null;
  panel = null;
}
function update() {
  terrain_1.default.select();
}
function send(d) {
  window.requestIdleCallback(async () => {
    if (d.action === "block-update") {
      var t = await terrain_1.default.getBlockLayers();
      if (vm && t) {
        vm.block.index.x = t.index.x;
        vm.block.index.y = t.index.y;
        vm.block.layers = t.layers;

        if (t.weight) {
          var r = t.weight.width;
          var a = t.weight.height;
          var e = r * a * 4;
          var n = new Uint8Array(70 + e);
          var i = new DataView(n.buffer);
          i.setUint16(0, 16973, false);
          i.setUint32(2, n.length, true);
          i.setUint32(10, 70, true);
          i.setUint32(14, 40, true);
          i.setInt32(18, r, true);
          i.setInt32(22, -a, true);
          i.setUint16(26, 1, true);
          i.setUint16(28, 32, true);
          i.setUint32(30, 6, true);
          i.setUint32(34, e, true);
          i.setInt32(38, 0, true);
          i.setInt32(42, 0, true);
          i.setUint32(46, 0, true);
          i.setUint32(50, 0, true);
          i.setUint32(54, 255, true);
          i.setUint32(58, 65280, true);
          i.setUint32(62, 16711680, true);
          i.setUint32(66, 4278190080, true);
          for (let e = 0; e < r * a; ++e) {
            var s = t.weight.data[4 * e + 0];
            var o = t.weight.data[4 * e + 1];
            var l = t.weight.data[4 * e + 2];
            var u = t.weight.data[4 * e + 3];
            n[70 + 4 * e] = s;
            n[70 + 4 * e + 1] = o;
            n[70 + 4 * e + 2] = l;
            n[70 + 4 * e + 3] = Math.max(u, 1);
          }
          e = new Blob([n], { type: "image/bmp" });
          i = window.URL.createObjectURL(e);
          vm.block.weight = i;
        } else {
          vm.block.weight = "";
        }
      }
    }
  });
}

exports.template = `
<style>
.scene-terrain ui-prop { --left-width: 45%; margin-bottom: 4px; }
.scene-terrain ui-asset { width: 100%; }
.scene-terrain .buttons { display: flex; justify-content: space-around; margin-bottom: 4px; }
.scene-terrain .buttons i { cursor: pointer; }
.scene-terrain .row { margin-bottom: 4px; }
.scene-terrain > header { text-align: center;margin-bottom: 8px; }
.scene-terrain ui-prop > div[slot="content"] { display: flex; flex-wrap: wrap; width: 100%; }
.scene-terrain ui-prop > div[slot="content"] ui-select { width: 100%; }
.scene-terrain .layers { display: block; border: 1px solid var(--color-normal-border); border-radius: calc(var(--size-normal-radius) * 1px); padding: 0 5px; margin-bottom: 6px; }
.scene-terrain .layers[hoving] { border-color: var(--color-active-contrast); }
.scene-terrain .layers > header { margin-top: 8px; }
.scene-terrain .layers > header > ui-button { line-height: 1.2; vertical-align: middle; padding: 0 2px; margin-left: 10px; font-size: 11px; }
.scene-terrain .layers > section { margin-top: 8px; margin-bottom: 4px; }
.scene-terrain .layers > section > ui-drag-area { overflow: hidden; display: inline-flex; width: 30px; height: 30px; border: 1px solid var(--color-normal-border); margin-right: 4px; border-radius: calc(var(--size-normal-radius) * 1px); }
.scene-terrain .layers > section > ui-drag-area[hoving] { border-color: var(--color-active-contrast); }
.scene-terrain .layers > section > ui-drag-area[active] { border-color: var(--color-active-contrast); }
.scene-terrain .layers img { width: 30px; height: 30px; }
.scene-terrain .layer > * { display: block; }
.scene-terrain .manager-toolbar { padding-bottom: 5px; width: 100%; text-align: right; }
.block-index { display: flex; pointer-events: none; }
.block-index > ui-num-input { flex: 1; margin-right: 10px; }
.scene-terrain .blocks ui-prop { --left-width: 35%; }
.scene-terrain .block-weight ui-image { display: inline-block; border: none; overflow: hidden; width: 32px; height: 32px; margin-right: 4px; pointer-events: none; border-radius: calc(var(--size-normal-radius) * 1px); }
.scene-terrain .block-layers .image { display: inline-block; border: none; overflow: hidden; width: 32px; height: 32px; margin-right: 4px; pointer-events: none; border-radius: calc(var(--size-normal-radius) * 1px); }
</style>
<div class="scene-terrain"></div>
`;

exports.default = __importStar(require("./index"));
