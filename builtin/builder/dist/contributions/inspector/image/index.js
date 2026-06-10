Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const CompressTexture = require("./compress-texture");

const vueTemplate = `
<div class="compress-texture">
  <compress-texture
      v-if="meta"
      :meta="meta"
      :metas="metas"
      :readonly="info.readonly"
      @confirm="onChanged"
      ref="child"
  ></compress-texture>
</div>`;

function update(e, t) {
  const s = this;
  var r;

  if (!s.vm) {
    (r = new Vue({
      name: "InspectorImage",
      components: { "compress-texture": CompressTexture },
      data: { infos: [], metas: [], meta: {}, info: {} },
      methods: {
        onChanged() {
          s.dispatch("change");
          s.dispatch("snapshot");
        },
        refresh() {
          this.$refs.child.refresh();
        },
      },
      template: vueTemplate,
    })).$mount(s.$.container);

    s.vm = r;
  }

  s.vm.infos = e;
  s.vm.metas = t;
  s.vm.info = e[0];
  s.vm.meta = t[0];
  s.vm.refresh();
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = readFileSync(join(__dirname, "./compress-texture.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
