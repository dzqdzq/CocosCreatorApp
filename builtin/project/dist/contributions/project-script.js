Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;

const vueTemplate = `
<div>
<ui-prop type="ui" class="container"
    tooltip="i18n:project.scripts.exportsConditionsTips"
>
    <ui-label slot="label" value="i18n:project.scripts.exportsConditions"></ui-label>
    <ui-input slot="content"
        :value="exportsConditions"
        @confirm="changeExportsConditions($event.target.value)"
    ></ui-input>
</ui-prop>
<ui-section class="sorting-plugin" expand>
    <header slot="header"style="width: 100%; justify-content: space-between;">
        <ui-label value="i18n:project.scripts.pluginSortingConfig" tooltip="i18n:project.scripts.pluginSortingConfigTips"></ui-label>
        <div class="toolbar">
            <template v-if="editMode === 'json'">
                <ui-button type="icon" class="transparent"
                    :disabled="!jsonStrDirty"
                    @click.stop="resetJSONData"
                >
                    <ui-icon value="reset" color="true"></ui-icon>
                </ui-button>
                <ui-button type="icon" class="transparent"
                    :disabled="!jsonStrDirty"
                    @click.stop="applyJSONData"
                >
                    <ui-icon value="check" color="true"></ui-icon>
                </ui-button>
            </template>
            <template v-else>
                <ui-button type="icon" class="transparent"
                    :disabled="!selectPlugin.length"
                    @click.stop="remove"
                >
                    <ui-icon value="mini"></ui-icon>
                </ui-button>
                <ui-button type="icon" class="transparent"
                    @click.stop="add"
                >
                    <ui-icon value="add-more"></ui-icon>
                </ui-button>
            </template>
            <ui-button type="icon" class="transparent"
                @click.stop="popMenu"
            >
                <ui-icon value="menu"></ui-icon>
            </ui-button>
        </div>
    </header>
    <div ref="editor" class="script-content">
        <ui-textarea v-if="editMode === 'json'" 
            :value="jsonStr"
            @change="onJSONChange"
        ></ui-textarea>
        <ui-list v-if="editMode === 'list'"
            :list.prop="pluginScript"
            @change="onListChange"
        >
            <ui-list-item class="script-item" show-drag
                v-for="(script, index) in pluginScript"
                :key="script.uuid"
                :index="index"
                :missing="script.missing"
                :selected="selectPlugin.includes(script.uuid)"
                @click.stop="onToggleSelectPlugin(script.uuid)"
            >
                <span class="drag"></span>
                <ui-label class="index"
                    :value="index"
                ></ui-label>
                <ui-label class="script"
                    :value="script.url || script.uuid"
                ></ui-label>
            </ui-list-item>
        </ui-list>
    </div>
</ui-section>
</div>
`;

const ProjectScriptVM = Vue.extend({
  name: "ProjectScriptVM",
  data() {
    return {
      exportsConditions: "",
      pluginScript: [],
      selectPlugin: [],
      editMode: "list",
      jsonStr: "",
      jsonStrDirty: false,
    };
  },
  computed: {
    sortingPlugins() {
      return this.pluginScript.map((t) => t.uuid);
    },
  },
  destroyed() {
    document.removeEventListener("click", this.onBlankClick);
  },
  async mounted() {
    var t = await Editor.Profile.getProject(
      "project",
      "script.exportsConditions"
    );

    var t =
      ((this.exportsConditions = t.join(",")),
      await Editor.Profile.getProject("project", "script.sortingPlugin"));

    if (t) {
      for (const e of t) {
        var i = e && (await Editor.Message.request("asset-db", "query-url", e));

        if (i) {
          this.pluginScript.push({ uuid: e, url: i });
        } else {
          this.pluginScript.push({ uuid: e, missing: true });
        }
      }
    }
    this.onBlankClick = this.clearSelect.bind(this);
    document.addEventListener("click", this.onBlankClick);
  },
  methods: {
    onBlankClick() {},
    onListChange(t) {
      this.pluginScript = t.detail.list;
      this.saveData();
    },
    onJSONChange(t) {
      this.jsonStr = t.target.value;
      this.jsonStrDirty = true;
    },
    resetJSONData() {
      this.jsonStr = JSON.stringify(
        this.pluginScript.map((t) => t.url || t.uuid),
        null,
        4
      );

      this.jsonStrDirty = false;
    },
    async applyJSONData() {
      try {
        var t = JSON.parse(this.jsonStr);

        const e = await Editor.Message.request(
          "asset-db",
          "batch-message-handler",
          t.map((t) => ({
            name: "query-uuid",
            args: [t],
          }))
        );

        const s = [];
        const n = [];

        t.forEach((t, i) => {
          if (e[i]) {
            s.push({ url: t, uuid: e[i] });
          } else {
            n.push(t);
          }
        });

        if (n.length) {
          if (
            (
              await Editor.Dialog.info(
                Editor.I18n.t("project.scripts.invalidPlugins", {
                  plugin: n.toString(),
                }),
                {
                  buttons: [
                    Editor.I18n.t("project.scripts.continueEdit"),
                    Editor.I18n.t("project.scripts.confirmCommit"),
                  ],
                  default: 0,
                  cancel: 1,
                }
              )
            ).response === 0
          ) {
            return false;
          }
        }

        this.pluginScript = s;

        await Editor.Profile.setProject("project", "script.sortingPlugin", e);

        this.jsonStrDirty = false;
        this.editMode = "list";
      } catch (t) {
        console.warn(t);
        Editor.Dialog.error(t.message, { title: t.stack });
        return false;
      }
      return true;
    },
    changeExportsConditions(t) {
      Editor.Profile.setProject(
        "project",
        "script.exportsConditions",
        t.split(",")
      );
    },
    onToggleSelectPlugin(t) {
      if (this.selectPlugin.includes(t)) {
        this.selectPlugin.splice(this.selectPlugin.indexOf(t), 1);
      } else {
        this.selectPlugin.push(t);
      }
    },
    remove() {
      if (this.selectPlugin.length) {
        for (let t = 0; t < this.selectPlugin.length; t++) {
          const e = this.selectPlugin[t];
          var i = this.pluginScript.findIndex((t) => t.uuid === e);

          if (-1 !== i) {
            this.pluginScript.splice(i, 1);
          }
        }
        this.selectPlugin = [];
        this.saveData();
      }
    },
    _addPlugin(i) {
      if (!this.pluginScript.find((t) => t.uuid === i.uuid)) {
        this.pluginScript.push(i);
      }
    },
    async add(t) {
      t = t.target;
      let i = await Editor.Message.request("asset-db", "query-assets", {
        userData: { isPlugin: true },
      });

      i = i.filter((t) => !this.sortingPlugins.includes(t.uuid));

      Editor.Panel.__protected__.openKit("ui-kit.searcher", {
        elem: t,
        params: [{ type: "asset", droppable: "cc.Script", data: i }],
        listeners: {
          confirm: (t) => {
            if (t) {
              this._addPlugin({ url: t.info.path, uuid: t.info.uuid });
              this.saveData();
            }
          },
        },
      });
    },
    popMenu(t) {
      var i = [
        {
          label: "i18n:project.scripts.addAllPlugins",
          click: () => {
            this.onAddAll();
          },
        },
      ];

      if (this.editMode === "list") {
        i.push({
          label: "i18n:project.scripts.editInJSONMode",
          click: () => {
            this.editMode = "json";

            this.jsonStr = JSON.stringify(
              this.pluginScript.map((t) => t.url || t.uuid),
              null,
              4
            );
          },
        });
      } else {
        i.push({
          label: "i18n:project.scripts.editInListMode",
          click: async () => {
            if (!this.jsonStrDirty || (await this.applyJSONData())) {
              this.editMode = "list";
            }
          },
        });
      }

      if (this.pluginScript.find((t) => t.missing)) {
        i.push({
          label: "i18n:project.scripts.clearMissingPlugin",
          click: () => {
            this.pluginScript = this.pluginScript.filter((t) => !t.missing);

            this.saveData();
          },
        });
      }

      Editor.Menu.popup({ menu: i });
    },
    async onAddAll() {
      (
        await Editor.Message.request("asset-db", "query-assets", {
          ccType: "cc.Script",
          userData: { isPlugin: true },
        })
      ).forEach((t) => {
        this._addPlugin({ url: t.url, uuid: t.uuid });
      });

      await this.saveData();
    },
    async saveData() {
      await Editor.Profile.setProject(
        "project",
        "script.sortingPlugin",
        this.sortingPlugins
      );
    },
    async checkSave() {
      return !this.jsonStrDirty || this.applyJSONData();
    },
    clearSelect() {
      this.selectPlugin = [];
    },
  },
  template: vueTemplate,
});

function ready() {
  var t = this;
  t.vm?.$destroy();
  t.vm = new ProjectScriptVM();
  t.vm.$mount(t.$.container);
}
async function exportConfig() {
  var t = {};

  t["script.exportsConditions"] =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "script.exportsConditions"
    )) || [];

  return t;
}
async function importConfig(t) {
  if (t["script.exportsConditions"]) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "script.exportsConditions",
      t["script.exportsConditions"]
    );
  }
}
async function beforeClose() {
  return this.vm?.checkSave();
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = readFileSync(
  join(__dirname, "../../dist/contributions/project-script.css")
);

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
