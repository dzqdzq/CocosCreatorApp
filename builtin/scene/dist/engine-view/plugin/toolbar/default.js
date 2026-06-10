Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarDefault = undefined;
const Vue = require("vue/dist/vue.js");
const plugin_1 = require("./plugin");

const template = `
  <div class="default-toolbar">
          <div class="left">
              <template v-for="item in left">
                  <toolbar-plugin :option="item"></toolbar-plugin>
              </template>
          </div>
          <div class="right">
              <template v-for="item in right">
                  <toolbar-plugin :option="item"></toolbar-plugin>
              </template>
          </div>
      </div>
`;

exports.ToolbarDefault = Vue.extend({
  name: "ToolbarDefault",
  components: { ToolbarPlugin: plugin_1.ToolbarPlugin },
  props: {
    left: { type: Array, default: () => [] },
    right: { type: Array, default: () => [] },
    scenes: { type: Array, default: () => [{ name: "scene" }] },
  },
  data() {
    return {};
  },
  template,
});
