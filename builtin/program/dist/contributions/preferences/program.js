Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramComponent = undefined;
const fs_1 = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const template = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../../static/template/program.html"),
  "utf8"
);

exports.ProgramComponent = Vue.extend({
  name: "ProgramComponent",
  props: {
    program: { type: String, required: true },
    item: { type: Object, required: true },
    pkg: { type: String, required: true },
  },
  data() {
    return {
      type: "global",
      localValue: { path: "", commandArgument: [] },
      defaultValue: { path: "", commandArgument: [] },
    };
  },
  async mounted() {
    await this.refresh();
    await this.init();
  },
  methods: {
    getRenderText(e) {
      var t = this;
      e.attributes = e.attributes || {};
      e.attributes.path = t.program + ".path";

      if (t.defaultValue && t.defaultValue.path) {
        e.attributes.placeholder = t.defaultValue.path;
      }

      return JSON.stringify(e);
    },
    async refresh() {
      var e = this;

      if (e.pkg) {
        e.localValue = await Editor.Profile.getConfig(
          e.pkg,
          e.program,
          "local"
        );

        e.defaultValue = await Editor.Profile.getConfig(
          e.pkg,
          e.program,
          "default"
        );

        !e.localValue ||
        (e.localValue.path == null && e.localValue.commandArgument == null)
          ? (e.type = "global")
          : (e.type = "local");
      }
    },
    popup(e, t) {
      const a = this;

      if (a.pkg) {
        Editor.Menu.popup({
          x: e,
          y: t,
          menu: [
            {
              label: Editor.I18n.t("preferences.menu.copyConfigKey"),
              click() {
                Editor.Clipboard.write("text", `'${a.pkg}', '${a.program}'`);
              },
            },
            {
              label: Editor.I18n.t("preferences.menu.move_local"),
              enabled: a.type === "global",
              async click() {
                let e = await Editor.Profile.getConfig(
                  a.pkg,
                  a.program,
                  a.type
                );

                if (e == null) {
                  e = { path: "" };
                }

                await Editor.Profile.setConfig(a.pkg, a.program, e, "local");
                a.refresh();
              },
            },
            {
              label: Editor.I18n.t("preferences.menu.move_global"),
              enabled: a.type === "local",
              async click() {
                var e = await Editor.Profile.getConfig(
                  a.pkg,
                  a.program,
                  a.type
                );
                await Editor.Profile.setConfig(a.pkg, a.program, e, "global");
                await Editor.Profile.removeConfig(a.pkg, a.program, a.type);
                a.refresh();
              },
            },
          ],
        });
      }
    },
    showArgumentsMenu(e) {
      const t = this;
      var a = [];
      for (const o in t.item.arguments) {
        var r = t.item.arguments[o];

        var r = {
          label: o,
          sublabel: r.label,
          click() {
            t.addArgument(o);
          },
        };

        a.push(r);
      }
      Editor.Menu.popup({ x: e.x, y: e.y, menu: a });
    },
    addArgument(e) {
      var t;
      var a = this.$refs.commandArgument;

      if (a) {
        t = a.value || "";
        a.value = (t += " ${" + e + "}").trim();
        a.dispatch("confirm");
      }
    },
    async onCommandArgumentConfirm(e) {
      var t = this;
      var e = e.target.value;
      await Editor.Profile.setConfig(
        t.pkg,
        t.program + ".commandArgument",
        e,
        t.type
      );
    },
    async init() {
      var e = this;

      var t = await Editor.Profile.getConfig(
        e.pkg,
        e.program + ".commandArgument",
        e.type
      );

      var e = e.$refs.commandArgument;

      if (e && t != null) {
        e.value = t;
      }
    },
  },
  template,
});
