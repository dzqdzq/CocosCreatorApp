var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.Texture = undefined;

const { getImageLikeAssetSource } = require("./utils");

const terrain_1 = __importDefault(require("../../public/terrain"));
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.Texture = Vue.extend({
  props: {
    layer: { type: Object, required: true },
    index: { type: Number, required: true },
  },
  data() {
    return { src: "", isBusy: false };
  },
  watch: {
    layer(e) {
      this.update();
    },
  },
  mounted() {
    this.update();
  },
  methods: {
    async update() {
      var e;

      if (this.layer && this.layer.uuid) {
        if (!this.isBusy) {
          this.isBusy = true;
          e = this.layer.uuid;

          e = await Editor.Message.request("asset-db", "query-asset-meta", e);

          this.src = e ? await getImageLikeAssetSource(e) : "";
          this.isBusy = false;
        }
      } else {
        this.src = "";
      }
    },
    _onImgClick() {
      if (this.$parent) {
        this.$parent.$emit("select-layer", this.index);
      }
    },
    _onDrop(e) {
      e.stopPropagation();
      e = e.dataTransfer?.getData("additional");
      if (e) {
        try {
          var t;
          var r;
          var i = JSON.parse(e);

          if (Array.isArray(i) && i[0]) {
            if ((t = i[0].value) && t.includes("@") && t.includes("@6c48a")) {
              r = this.index;
              terrain_1.default.setLayer(r, t);
            } else {
              console.warn(
                "Terrain Layer need cc.Texture2D asset, and can't recognize texture without entity, which maybe from FBX or GLTF."
              );
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    },
  },
  template: `
        <ui-drag-area droppable="cc.Texture2D"
            @drop="_onDrop($event)"
        >
            <img v-if="src"
            :src="src" 
            @click="_onImgClick()"
            >
        </ui-drag-area>
`,
});
