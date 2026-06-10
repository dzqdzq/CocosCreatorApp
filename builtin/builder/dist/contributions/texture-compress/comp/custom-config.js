Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.data = undefined;
exports.props = undefined;
exports.template = undefined;
exports.created = created;
exports.beforeDestroy = beforeDestroy;
const event_bus_1 = require("../event-bus");

exports.template = `
<div class="custom-format" v-if="config && formatsInfo">
  <ui-section class="content" expand>
      <div class="config-header flex-spacing-between" slot="header">
          <span>
              <ui-input
                  v-if="inEdit"
                  :value="config.name"
                  :tooltip="config.name"
                  @click.stop
                  @confirm="onChangeFormatName($event.target.value)"
              ></ui-input>
              <ui-label v-else :value="config.name"></ui-label>
          </span>
          <ui-button type="icon" class="transparent child-margin-right"
              @click.stop="showMenu"
          >
              <ui-icon value="menu"></ui-icon>
          </ui-button>
      </div>
      <div @confirm="onConfigChange" class="config-content">
          <ui-prop>
              <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.format"></ui-label>
              <ui-select-pro slot="content" path="format" filter>
                  <template v-for="(format, formatId) in formatsInfo">
                      <ui-select-option-pro 
                          :key='formatId' 
                          :value="formatId" 
                          :label='format.displayName'
                          :selected='(config.format || Object.keys(formatsInfo)[0]) === formatId'
                      ></ui-select-option-pro>
                  </template>
              </ui-select-pro>
          </ui-prop>
          <ui-prop>
              <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.overwrite"></ui-label>
              <ui-checkbox slot="content" path="overwrite"
                  :value="config.overwrite"
              ></ui-checkbox>
          </ui-prop>
          <ui-prop>
              <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.compressTools"></ui-label>
              <div slot="content">
                  <ui-prop class="config-item">
                      <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.program"></ui-label>
                      <ui-file slot="content"
                          path="path"
                          protocols="file,project"
                          :value="config.path"
                      ></ui-file>
                  </ui-prop>
                  <ui-prop class="config-item">
                      <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.commandParams"></ui-label>
                      <div
                          slot="content"
                      >
                          <ui-input
                              path="command"
                              :value="config.command"
                          ></ui-input>
                          <ui-button @click="showAddParamsMenu">
                              <ui-icon value="arrow-triangle"></ui-icon>
                          </ui-button>
                      </div>
                  </ui-prop>
              </div>
          </ui-prop>
      </div>
  </ui-section>
</div>
`;

exports.props = ["formatsInfo", "config", "customConfigs", "overwriteFormats"];

const data = () => ({
  editTypList: { program: "程序", npm: "npm 库" },
  inEdit: "",
});

function created() {
  event_bus_1.EventBus.$on(
    "blank-click",
    (this.onBlankClickBind = this.onBlankClick.bind(this))
  );
}
function beforeDestroy() {
  event_bus_1.EventBus.$off("blank-click", this.onBlankClickBind);
}
exports.data = data;

exports.methods = {
  removeFormat() {
    this.$emit("remove", this.config.id);
  },
  async onConfigChange(e) {
    var e = e.target;
    var t = e.getAttribute("path");
    if (t) {
      var o = this;
      var e_value = e.value;
      var r = o.config.id;
      if (t === "overwrite" || t === "format") {
        var a = !!(t === "overwrite" ? e_value : o.config.overwrite);
        var n = t === "format" ? e_value : o.config.format;
        var s = o.config[t];
        if (a == true) {
          if (o.overwriteFormats[n] && a == true) {
            a = o.overwriteFormats[o.customConfigs[r].format];
            if (!o.customConfigs[a]) {
              o.config[t] = true;
              delete o.overwriteFormats[o.customConfigs[r].format];
              return void o.$emit("update", r, "overwrite", true);
            }
            if (
              (
                await Editor.Dialog.info(
                  Editor.I18n.t(
                    "builder.project.texture_compress.customFormat.conflictOverwrite",
                    {
                      rawFormat: n,
                      conflictFormat:
                        (o.customConfigs[a] && o.customConfigs[a].name) || a,
                    }
                  ),
                  {
                    buttons: [
                      Editor.I18n.t(
                        "builder.project.texture_compress.overwrite"
                      ),
                      Editor.I18n.t("builder.project.texture_compress.cancel"),
                    ],
                    cancel: 1,
                    default: 1,
                  }
                )
              ).response === 1
            ) {
              return void (e.value = s);
            }
            o.$emit("update", a, "overwrite", false);
          } else {
            o.config[t] = e_value;
          }
          e = t === "format" ? s : o.config.format;
          delete o.overwriteFormats[e];
          o.$set(o.overwriteFormats, n, r);
        } else {
          o.config[t] = s;

          if (t === "overwrite") {
            delete o.overwriteFormats[n];
          }
        }
      }
      o.$emit("update", r, t, e_value);
    }
  },
  showMenu(e) {
    Editor.Menu.popup({
      x: e.pageX,
      y: e.pageY,
      menu: [
        {
          label: "i18n:builder.project.texture_compress.editConfigName",
          enabled: !this.readonly,
          click: () => {
            this.inEdit = true;
          },
        },
        {
          label: "i18n:builder.copyConfig",
          click: () => {
            this.$emit("add-config", this.config.id);
          },
        },
        {
          label: "i18n:builder.project.texture_compress.copyId",
          click: () => {
            Editor.Clipboard.write("text", this.config.id);
          },
        },
        { type: "separator" },
        {
          label: "i18n:builder.delete",
          enabled: !this.readonly,
          click: () => {
            this.removeFormat();
          },
        },
      ],
    });
  },
  onChangeFormatName(e) {
    this.$emit("update", this.config.id, "name", e);
  },
  showAddParamsMenu(e) {
    const t = this;
    var o = ["src", "dest", "quality"].map((e) => ({
      label: e,

      click: () => {
        t.addParam(e);
      },
    }));
    Editor.Menu.popup({ x: e.x, y: e.y, menu: o });
  },
  addParam(e) {
    var t = this;
    t.config.command += " ${" + e + "}";
    t.$emit("update", t.config.id, "command", t.config.command);
  },
  onBlankClick() {
    this.inEdit = false;
  },
};
