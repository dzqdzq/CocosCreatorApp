Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.style = undefined;
exports.template = undefined;
exports.ready = ready;

const { readJSONSync } = require("fs-extra");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");
function ready() {
  new Vue({
    el: this.$.material,
    data() {
      return { defaultRenderConfig: {}, userConfig: {} };
    },
    mounted() {
      this.initDefaultData();
    },
    methods: {
      async initDefaultData() {
        this.userConfig =
          (await Editor.Profile.getProject(
            "engine-extends",
            "autoMaterialConfig"
          )) || {};
        var e = (await Editor.Message.request("engine", "query-engine-info"))
          .typescript.builtin;
        this.defaultRenderConfig = readJSONSync(
          join(e, "editor/auto_material_settings.json")
        ).properties;
      },
      async onDataConfirm(e, t) {
        e = e.target.value;
        this.userConfig[t] = e;

        await Editor.Profile.setProject(
          "engine-extends",
          "autoMaterialConfig",
          this.userConfig
        );
      },
    },
  });
}

exports.template = `
<div class="auto-material">
    <ui-prop
        v-for="(renderConfig, property) in defaultRenderConfig"
        :key="property"
        @confirm="onDataConfirm($event, property)"
    >
        <ui-label slot="label"
            :value=" property"
        ></ui-label>
        <ui-input slot="content"
            :value="userConfig[property] || defaultRenderConfig[property].matchString"
        ></ui-input>
    </ui-prop>
</div> 
`;

exports.style = `
.auto-material { padding: 4px; }
.auto-material ui-prop { margin-bottom: 4px;}
`;

exports.$ = { material: ".auto-material" };
