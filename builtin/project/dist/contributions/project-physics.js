Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.close = close;
const fs_1 = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const vueTemplate = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../static/contributions/project-physics.html"),
  "utf8"
);

const ProjectPhysicsVM = Vue.extend({
  name: "ProjectPhysicsVM",
  data() {
    return {
      collisionMatrix: { 0: 1 },
      groups: [],
      reverseGroups: [],
      state: "",
      stateIndex: 0,
      error: "",
    };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    t(t) {
      return Editor.I18n.t(t);
    },
    async refresh() {
      var t =
        (await Editor.Profile.getProject(
          "project",
          "physics.collisionGroups"
        )) || [];

      var t =
        ((this.groups = t
          .concat([{ index: 0, name: "DEFAULT" }])
          .sort((t, e) => t.index - e.index)),
        (this.reverseGroups = this.groups.slice().reverse()),
        await Editor.Profile.getProject("project", "physics.collisionMatrix"));

      if (t) {
        this.collisionMatrix = t;
      }
    },
    checked(t, e) {
      e = this.collisionMatrix[e.toString()];
      return e !== undefined && !!(e & (1 << t));
    },
    onChanged(t) {
      var t = t.currentTarget;
      var e = t.getAttribute("y");
      const o = 1 << Number(e);
      if (e) {
        let r = this.collisionMatrix[e];

        Array.from(t.getElementsByTagName("ui-checkbox")).forEach((t) => {
          var t_checked = t.checked;
          var t = t.getAttribute("x");
          var i = 1 << Number(t);
          let s = this.collisionMatrix[t];

          if (t_checked) {
            r |= i;
            s |= o;
          } else {
            r &= ~i;
            s &= ~o;
          }

          this.$set(this.collisionMatrix, t, s);
        });

        this.$set(this.collisionMatrix, e, r);

        Editor.Profile.setProject(
          "project",
          "physics.collisionMatrix",
          this.collisionMatrix
        );
      }
    },
    async onkeydown(t) {
      if (t.key === "Enter") {
        await this.saveEdit(t);
      } else if (t.key === "Escape") {
        this.cancelEdit();
      }
    },
    startEdit(t) {
      if (!t.path) {
        t.path = t.composedPath();
      }

      const e = t.path.find((t) => t.tagName === "TR");

      if (e) {
        this.stateIndex = Number(e.getAttribute("y"));
        this.state = "edit";

        this.$nextTick(() => {
          e.after(this.$refs.errorRow);
        });
      }
    },
    cancelEdit() {
      this.state = "";
      this.error = "";
    },
    async saveEdit(t) {
      if (!t.path) {
        t.path = t.composedPath();
      }

      var t = t.path.find((t) => t.tagName === "TR");
      if (t) {
        const i = t.getElementsByClassName("name")[0].value;
        let e = true;

        this.groups.forEach((t) => {
          if (!i || i === t.name) {
            e = false;
          }
        });

        if (e) {
          this.groups.forEach((t) => {
            if (t.index === this.stateIndex) {
              t.name = i;
            }
          });

          t = this.groups
            .filter((t) => t.index > 0)
            .sort((t, e) => t.index - e.index);

          await Editor.Profile.setProject(
            "project",
            "physics.collisionGroups",
            t
          );

          this.cancelAdd();
          this.refresh();
          Editor.Message.send("scene", "project:update-physics-group");
        } else {
          this.error = this.t("project.physics.edit.error");
        }
      }
    },
    startAdd() {
      this.state = "add";

      this.$nextTick(() => {
        var t = this.$refs.addRow;

        if (t) {
          t.after(this.$refs.errorRow);
        }
      });
    },
    cancelAdd() {
      this.state = "";
      this.error = "";
    },
    async saveAdd() {
      var t = this.$refs.addIndex;
      var i = this.$refs.addName;
      if (t && i) {
        const t_value = t.value;
        const r = i.value.trim();
        let e = true;

        this.groups.forEach((t) => {
          if (t_value <= 0 || t_value >= 32 || t_value === t.index) {
            e = false;
          }

          if (!r || r === t.name) {
            e = false;
          }
        });

        if (e) {
          t = this.groups
            .concat([{ index: t_value, name: r }])
            .filter((t) => t.index > 0)
            .sort((t, e) => t.index - e.index);

          await Editor.Profile.setProject(
            "project",
            "physics.collisionGroups",
            t
          );

          this.cancelAdd();
          this.refresh();
          Editor.Message.send("scene", "project:update-physics-group");
        } else {
          this.error = this.t("project.physics.add.error");
        }
      }
    },
    async deleteIndex(e) {
      let i = null;
      let s = null;
      for (let t = 0; t < this.groups.length; t++) {
        var r = this.groups[t];
        if (r.index === e) {
          i = r;
          s = t;
          break;
        }
      }
      var t;

      if (
        i &&
        s &&
        ((t = this.t("project.physics.delete.warn")
          .replace("${index}", i.index)
          .replace("${name}", i.name)),
        (
          await Editor.Dialog.warn(t, {
            title: this.t("project.delete"),
            buttons: [this.t("project.delete"), this.t("project.cancel")],
          })
        ).response !== 1)
      ) {
        delete this.groups[s];

        t = this.groups
          .filter((t) => t.index > 0)
          .sort((t, e) => t.index - e.index);

        Editor.Profile.setProject("project", "physics.collisionGroups", t);
        this.refresh();
      }
    },
    addIndexValue() {
      let t = -1;
      for (const e of this.groups) {
        if (e.index > t) {
          t = e.index;
        }
      }
      return t + 1;
    },
  },
  template: vueTemplate,
});

function ready() {
  this.vm?.$destroy();
  this.vm = new ProjectPhysicsVM();
  this.vm.$mount(this.$.container);
}
async function exportConfig() {
  var t = {};

  t["physics.collisionMatrix"] =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "physics.collisionMatrix"
    )) || {};

  t["physics.collisionGroups"] =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "physics.collisionGroups"
    )) || [];

  return t;
}
async function importConfig(t) {
  if (t["physics.collisionMatrix"]) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "physics.collisionMatrix",
      t["physics.collisionMatrix"]
    );
  }

  if (t["physics.collisionGroups"]) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "physics.collisionGroups",
      t["physics.collisionGroups"]
    );
  }
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = `
.config { display: grid; }
.config >.table { width: 100%; }
.config >.table .td { text-align: center; }

.config >.table .td.mini { width: 40px; }
.config >.table .td.name { width: 130px; }
.config >.table .td.operation { width: 80px; text-align: left; }

.config >.table .td .input { vertical-align: inherit; width: 100%; }
.config >.table .td.error { text-align: left; color: var(--color-danger-fill-weaker); }
.config >.table .td ui-button[type="icon"] { margin: 0 2px; }
.config >.table .gray { color: var(--color-normal-contrast-emphasis); }
.config >.table .td.first { text-align: left; }
.config >.table .td.first .add { width: 200px; margin: 10px 0; }
.config >.table .td.first .add > .icon { margin-right: 8px; }
.config .transform { writing-mode: tb; }
`;

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
